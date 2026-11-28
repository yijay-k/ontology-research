/**
 * Definition history: every create, update and delete of an object, action or
 * link type is a numbered model version with before, after and actor.
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
import { createServer } from "../src/server.js";
import { OntologyStore } from "../src/store/ontology-store.js";
import { PgDefinitionHistory } from "../src/definition-history.js";

let app: FastifyInstance;
let base: string;

beforeEach(async () => {
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never,
    store: new OntologyStore(null),
  });
  const res = await app.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "ar", displayName: "AR", description: "" } });
  base = `/api/v2/ontologies/${res.json().rid}`;
});

const invoice = (description: string) => ({
  apiName: "Invoice",
  description,
  primaryKeyApiName: "id",
  properties: { id: { type: "STRING", nullable: false, multiplicity: "SINGLE" } },
});

describe("definition history", () => {
  it("records create, update and delete as numbered versions with before, after and actor", async () => {
    const as = { "x-user-id": "alice", "x-user-platform-admin": "true" };
    await app.inject({ method: "POST", url: `${base}/objectTypes`, payload: invoice("v1") });
    await app.inject({ method: "PUT", url: `${base}/objectTypes/Invoice`, headers: as, payload: invoice("v2") });
    await app.inject({ method: "DELETE", url: `${base}/objectTypes/Invoice` });

    const history = (await app.inject({ method: "GET", url: `${base}/definitionHistory?kind=objectType&apiName=Invoice` })).json().data;
    expect(history.map((h: { version: number; change: string }) => [h.version, h.change])).toEqual([[1, "CREATED"], [2, "UPDATED"], [3, "DELETED"]]);
    expect(history[0].before).toBeNull();
    expect(history[1].before.description).toBe("v1");
    expect(history[1].after.description).toBe("v2");
    expect(history[1].actor).toBe("alice");
    expect(history[2].after).toBeNull();

    const one = (await app.inject({ method: "GET", url: `${base}/definitionHistory/2` })).json();
    expect(one).toMatchObject({ version: 2, apiName: "Invoice", change: "UPDATED" });
    expect((await app.inject({ method: "GET", url: `${base}/definitionHistory/99` })).statusCode).toBe(404);
  });

  it("records nothing for a refused change", async () => {
    await app.inject({ method: "POST", url: `${base}/objectTypes`, payload: invoice("v1") });
    const dup = await app.inject({ method: "POST", url: `${base}/objectTypes`, payload: invoice("again") });
    expect(dup.statusCode).toBe(409);
    expect((await app.inject({ method: "GET", url: `${base}/definitionHistory` })).json().data).toHaveLength(1);
  });

  it("refuses an unknown kind filter", async () => {
    expect((await app.inject({ method: "GET", url: `${base}/definitionHistory?kind=table` })).statusCode).toBe(400);
  });
});

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationFiles = () => {
  const dir = path.join(REPO_ROOT, "db/migrations");
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(dir, f));
};

describe.each([
  ["db/migrations", migrationFiles],
  ["scripts/migrate.sql", () => [path.join(REPO_ROOT, "scripts/migrate.sql")]],
])("PgDefinitionHistory on a database built from %s", (_schema, files) => {
  let db: PGlite;
  let pool: pg.Pool;
  beforeAll(async () => {
    db = await PGlite.create({ extensions: { citext, pgcrypto, pg_trgm, vector } });
    for (const file of files()) await db.exec(readFileSync(file, "utf8"));
    pool = new pg.Pool(createPgConfig(db));
  }, 60_000);
  afterAll(async () => {
    await pool?.end();
    await db?.close();
  });

  it("numbers versions per ontology and filters by name", async () => {
    const h = new PgDefinitionHistory(pool);
    await h.record({ ontologyRid: "o1", kind: "objectType", apiName: "A", change: "CREATED", before: null, after: { apiName: "A" } });
    await h.record({ ontologyRid: "o2", kind: "objectType", apiName: "A", change: "CREATED", before: null, after: {} });
    const second = await h.record({ ontologyRid: "o1", kind: "linkType", apiName: "L", change: "CREATED", before: null, after: {}, actor: "bob" });
    expect(second.version).toBe(2);
    expect((await h.list("o1")).map((v) => v.version)).toEqual([1, 2]);
    expect((await h.list("o1", { kind: "linkType" }))[0]).toMatchObject({ apiName: "L", actor: "bob" });
    expect((await h.get("o2", 1))?.after).toEqual({});
  });
});
