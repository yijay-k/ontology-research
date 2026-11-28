/**
 * A link is an instance of a declared link type: from its source object type
 * to its target type, between objects that exist, with no duplicates, and at
 * most one target per source when the type's cardinality is ONE.
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import type { FastifyInstance } from "fastify";
import { PGlite } from "@electric-sql/pglite";
import { createPgConfig } from "@electric-sql/pglite/node-postgres";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { vector } from "@electric-sql/pglite-pgvector";
import type { LinkTypeDefinition } from "@openfoundry/ontology-schema";
import { createServer } from "../src/server.js";
import { ObjectStore } from "../src/store/object-store.js";
import { LinkStore, type LinkReadWriteStore } from "../src/store/link-store.js";
import { PgLinkStore } from "../src/store/pg-link-store.js";

const RID = "ri.ontology.main.ontology.links";
const LINK_TYPES: Record<string, LinkTypeDefinition> = {
  drives: { apiName: "drives", objectTypeApiName: "Technician", linkedObjectTypeApiName: "Vehicle", cardinality: "ONE", foreignKeyPropertyApiName: "vehicleId" },
  assigned: { apiName: "assigned", objectTypeApiName: "Technician", linkedObjectTypeApiName: "Job", cardinality: "MANY", foreignKeyPropertyApiName: "jobId" },
};

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationFiles = () => {
  const dir = path.join(REPO_ROOT, "db/migrations");
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(dir, f));
};

interface Backend {
  setup(): Promise<void>;
  fresh(): Promise<LinkReadWriteStore>;
  /** A second store over the same data, as a restarted service would build. */
  reopen(): LinkReadWriteStore | null;
  teardown(): Promise<void>;
}

const memory: Backend = {
  async setup() {},
  async fresh() {
    return new LinkStore(null);
  },
  reopen: () => null,
  async teardown() {},
};

function postgres(files: () => string[]): Backend {
  let db: PGlite;
  let pool: pg.Pool;
  return {
    async setup() {
      db = await PGlite.create({ extensions: { citext, pgcrypto, pg_trgm, vector } });
      for (const file of files()) await db.exec(readFileSync(file, "utf8"));
      pool = new pg.Pool(createPgConfig(db));
    },
    async fresh() {
      await pool.query("TRUNCATE links");
      return new PgLinkStore(pool);
    },
    reopen: () => new PgLinkStore(pool),
    async teardown() {
      await pool?.end();
      await db?.close();
    },
  };
}

describe.each([
  ["memory", memory],
  ["postgres, db/migrations", postgres(migrationFiles)],
  ["postgres, scripts/migrate.sql", postgres(() => [path.join(REPO_ROOT, "scripts/migrate.sql")])],
] as const)("link rules on the %s link store", (_name, backend) => {
let app: FastifyInstance;
let linkStore: LinkReadWriteStore;

// PGlite builds the whole schema here; under a full parallel test run that
// outlasts the default hook timeout, as in the other PGlite suites.
beforeAll(() => backend.setup(), 60_000);
afterAll(() => backend.teardown());

beforeEach(async () => {
  linkStore = await backend.fresh();
  const store = new ObjectStore(null);
  for (const [type, pk] of [["Technician", "t1"], ["Vehicle", "v1"], ["Vehicle", "v2"], ["Job", "j1"], ["Job", "j2"]]) {
    store.createObject(RID, type, pk, { id: pk });
  }
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
    store,
    linkStore,
    linkTypes: { getLinkType: async (_rid, name) => LINK_TYPES[name] },
  });
});

const link = (linkType: string, targetObjectType: string, targetPrimaryKey: string, source = "t1") =>
  app.inject({
    method: "POST",
    url: `/api/v2/ontologies/${RID}/objects/Technician/${source}/links/${linkType}`,
    payload: { targetObjectType, targetPrimaryKey },
  });

describe("link creation", () => {
  it("links objects through a declared link type", async () => {
    expect((await link("assigned", "Job", "j1")).statusCode).toBe(201);
    expect((await link("assigned", "Job", "j2")).statusCode).toBe(201);
  });

  it("answers LinkTypeNotFound for an undeclared link type", async () => {
    const res = await link("owns", "Job", "j1");
    expect(res.statusCode).toBe(404);
    expect(res.json().errorName).toBe("LinkTypeNotFound");
  });

  it("refuses a target of the wrong object type", async () => {
    expect((await link("assigned", "Vehicle", "v1")).statusCode).toBe(400);
  });

  it("answers ObjectNotFound / LinkedObjectNotFound for missing endpoints", async () => {
    expect((await link("assigned", "Job", "j1", "t404")).json().errorName).toBe("ObjectNotFound");
    expect((await link("assigned", "Job", "j404")).json().errorName).toBe("LinkedObjectNotFound");
  });

  it("answers LinkAlreadyExists for the same link twice", async () => {
    await link("assigned", "Job", "j1");
    const res = await link("assigned", "Job", "j1");
    expect(res.statusCode).toBe(409);
    expect(res.json().errorName).toBe("LinkAlreadyExists");
  });

  it("allows one target per source when cardinality is ONE", async () => {
    expect((await link("drives", "Vehicle", "v1")).statusCode).toBe(201);
    const res = await link("drives", "Vehicle", "v2");
    expect(res.statusCode).toBe(409);
    expect(res.json().errorName).toBe("LinkCardinalityExceeded");
  });

  it("allows only one of two concurrent ONE links to land", async () => {
    const results = await Promise.all([link("drives", "Vehicle", "v1"), link("drives", "Vehicle", "v2")]);
    expect(results.map((r) => r.statusCode).sort()).toEqual([201, 409]);
  });
});

describe("link persistence", () => {
  it("keeps a link for a store built later over the same data", async () => {
    expect((await link("assigned", "Job", "j1")).statusCode).toBe(201);
    const reopened = backend.reopen();
    if (!reopened) return; // the in-memory store has nothing to reopen
    const links = await reopened.getAllLinks(RID, "Technician", "t1", "assigned");
    expect(links.map((l) => l.targetPrimaryKey)).toEqual(["j1"]);
  });

  it("deletes a link and answers LinkNotFound for one that is gone", async () => {
    await link("assigned", "Job", "j1");
    const url = `/api/v2/ontologies/${RID}/objects/Technician/t1/links/assigned/j1`;
    expect((await app.inject({ method: "DELETE", url })).statusCode).toBe(204);
    expect((await app.inject({ method: "DELETE", url })).statusCode).toBe(404);
  });
});
});
