/**
 * Dataset-backed object types: the source rows plus the user-edit layer.
 *
 * The merge rules are Palantir's default "apply user edits" strategy
 * (https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/):
 * edited properties keep their edits, unedited ones follow the source,
 * Action-created objects are not driven by the source, Action deletes stick,
 * and a row that disappears takes its object with it until it returns.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import { createPgConfig } from "@electric-sql/pglite/node-postgres";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { vector } from "@electric-sql/pglite-pgvector";
import type { FastifyInstance } from "fastify";
import type { ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import { createServer } from "../src/server.js";
import { ObjectStore, type ObjectReadWriteStore, type SourceRow } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";
import { PgObjectStore } from "../src/store/pg-object-store.js";
import { planSync } from "../src/store/source-sync.js";
import { rowsFromCsv, type SyncSources } from "../src/sync/sync-object-type.js";

const RID = "ri.ontology.main.ontology.sync";
const T = "Customer";

const row = (primaryKey: string, properties: Record<string, unknown>): SourceRow => ({
  primaryKey,
  properties: { id: primaryKey, ...properties },
});

// ---------------------------------------------------------------------------
// The merge, on both stores
// ---------------------------------------------------------------------------

/** The same merge contract, run against each store backend. */
function mergeContract(name: string, setup: () => Promise<ObjectReadWriteStore>) {
  describe(`${name}: syncFromSource`, () => {
    let store: ObjectReadWriteStore;
    beforeEach(async () => {
      store = await setup();
    });

    const props = async (pk: string) => (await store.getObject(RID, T, pk)).properties;
    const keys = async () => (await store.allObjects(RID, T)).map((o) => o.primaryKey).sort();

    it("adds every row on the first sync, and changes nothing on an identical one", async () => {
      expect(await store.syncFromSource(RID, T, [row("c1", { name: "Ann" }), row("c2", { name: "Bob" })]))
        .toEqual({ added: 2, modified: 0, deleted: 0, unchanged: 0 });
      const version = (await store.getObject(RID, T, "c1")).version;

      expect(await store.syncFromSource(RID, T, [row("c1", { name: "Ann" }), row("c2", { name: "Bob" })]))
        .toEqual({ added: 0, modified: 0, deleted: 0, unchanged: 2 });
      expect((await store.getObject(RID, T, "c1")).version).toBe(version);
    });

    it("keeps an Action's edit over later source values, and lets unedited properties follow the source", async () => {
      await store.syncFromSource(RID, T, [row("c1", { name: "Ann", city: "Oslo" })]);
      await store.applyEdits(RID, [{ type: "modifyObject", objectType: T, primaryKey: "c1", properties: { name: "Anne" } }]);

      const result = await store.syncFromSource(RID, T, [row("c1", { name: "Annabel", city: "Bergen" })]);

      expect(result.modified).toBe(1);
      expect(await props("c1")).toEqual({ id: "c1", name: "Anne", city: "Bergen" });
    });

    it("leaves an Action-created object alone, though the source never had it", async () => {
      await store.syncFromSource(RID, T, [row("c1", { name: "Ann" })]);
      await store.applyEdits(RID, [{ type: "addObject", objectType: T, primaryKey: "c9", properties: { id: "c9", name: "New" } }]);

      await store.syncFromSource(RID, T, [row("c1", { name: "Ann" }), row("c9", { name: "From source" })]);

      expect(await keys()).toEqual(["c1", "c9"]);
      expect(await props("c9")).toEqual({ id: "c9", name: "New" });
    });

    it("keeps an Action delete, whatever the source says", async () => {
      await store.syncFromSource(RID, T, [row("c1", { name: "Ann" }), row("c2", { name: "Bob" })]);
      await store.applyEdits(RID, [{ type: "deleteObject", objectType: T, primaryKey: "c2" }]);

      await store.syncFromSource(RID, T, [row("c1", { name: "Ann" }), row("c2", { name: "Bob" })]);

      expect(await keys()).toEqual(["c1"]);
    });

    it("removes an object whose row disappears, and reapplies its edits when the row returns", async () => {
      await store.syncFromSource(RID, T, [row("c1", { name: "Ann" }), row("c2", { name: "Bob", city: "Oslo" })]);
      await store.applyEdits(RID, [{ type: "modifyObject", objectType: T, primaryKey: "c2", properties: { name: "Robert" } }]);

      expect((await store.syncFromSource(RID, T, [row("c1", { name: "Ann" })])).deleted).toBe(1);
      expect(await keys()).toEqual(["c1"]);

      await store.syncFromSource(RID, T, [row("c1", { name: "Ann" }), row("c2", { name: "Bob", city: "Rome" })]);
      expect(await props("c2")).toEqual({ id: "c2", name: "Robert", city: "Rome" });
    });

    it("bumps the version of an object the sync changes", async () => {
      await store.syncFromSource(RID, T, [row("c1", { name: "Ann" })]);
      const before = (await store.getObject(RID, T, "c1")).version;
      await store.syncFromSource(RID, T, [row("c1", { name: "Annie" })]);
      expect((await store.getObject(RID, T, "c1")).version).toBe(before + 1);
    });
  });
}

mergeContract("in-memory store", async () => new ObjectStore(null));

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationFiles = () => {
  const dir = path.join(REPO_ROOT, "db/migrations");
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(dir, f));
};

for (const [schema, files] of [
  ["db/migrations", migrationFiles],
  ["scripts/migrate.sql", () => [path.join(REPO_ROOT, "scripts/migrate.sql")]],
] as const) {
  let db: PGlite;
  let pool: pg.Pool;

  beforeAll(async () => {
    db = await PGlite.create({ extensions: { citext, pgcrypto, pg_trgm, vector } });
    for (const file of files()) await db.exec(readFileSync(file, "utf8"));
    pool = new pg.Pool(createPgConfig(db));
    await pool.query(`INSERT INTO ontologies (rid, api_name) VALUES ($1, 'sync')`, [RID]);
    await pool.query(
      `INSERT INTO object_types (rid, ontology_rid, api_name, primary_key_api_name, primary_key_type)
       VALUES ('ot-customer', $1, 'Customer', 'id', 'STRING')`,
      [RID],
    );
  }, 60_000);

  afterAll(async () => {
    await pool?.end();
    await db?.close();
  });

  mergeContract(`PgObjectStore on ${schema}`, async () => {
    await pool.query("DELETE FROM object_edits");
    await pool.query("DELETE FROM objects");
    return new PgObjectStore(pool);
  });
}

describe("planSync", () => {
  it("is pure: it reports a plan and touches nothing", () => {
    const stored = new Map([["c1", { id: "c1", name: "Ann" }]]);
    const plan = planSync(stored, new Map(), [row("c1", { name: "Ann" }), row("c2", { name: "Bob" })]);
    expect(plan).toEqual({ add: [row("c2", { name: "Bob" })], modify: [], delete: [], unchanged: 1 });
    expect(stored.size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Reading CSV rows
// ---------------------------------------------------------------------------

const customerType = (mapping: Record<string, unknown> = {}): ObjectTypeDefinition =>
  ({
    apiName: T,
    primaryKey: "id",
    properties: {
      id: { type: "string" },
      name: { type: "string" },
      orders: { type: "integer" },
      vip: { type: "boolean" },
      note: { type: "string" },
    },
    datasources: [
      {
        rid: "ri.ontology.main.datasource.1",
        definition: {
          type: "dataset",
          datasetRid: "ri.datasets.main.dataset.customers",
          propertyMapping: {
            id: { type: "column", column: "customer_id" },
            name: { type: "column", column: "full_name" },
            orders: { type: "column", column: "orders" },
            vip: { type: "column", column: "vip" },
            note: { type: "editOnly" },
            ...mapping,
          },
        },
      },
    ],
  }) as unknown as ObjectTypeDefinition;

const csv = (text: string) => [{ path: "customers.csv", text }];

describe("rowsFromCsv", () => {
  it("reads mapped columns as the declared types, skips edit-only properties and empty cells", () => {
    expect(
      rowsFromCsv(customerType(), csv("customer_id,full_name,orders,vip,extra\nc1,Ann,3,TRUE,x\nc2,Bob,,false,y\n")),
    ).toEqual([
      { primaryKey: "c1", properties: { id: "c1", name: "Ann", orders: 3, vip: true } },
      { primaryKey: "c2", properties: { id: "c2", name: "Bob", vip: false } },
    ]);
  });

  it.each([
    ["a repeated primary key", "customer_id,full_name,orders,vip\nc1,Ann,1,true\nc1,Again,2,true\n", /repeats primary key "c1"/],
    ["a value of the wrong type", "customer_id,full_name,orders,vip\nc1,Ann,three,true\n", /orders: "three" is not an integer/],
    ["a missing mapped column", "customer_id,full_name,vip\nc1,Ann,true\n", /column "orders" is missing/],
    ["a row with no primary key", "customer_id,full_name,orders,vip\n,Ann,1,true\n", /has no primary key/],
  ])("refuses the whole source on %s", (_, text, message) => {
    expect(() => rowsFromCsv(customerType(), csv(text))).toThrow(message);
  });
});

// ---------------------------------------------------------------------------
// The internal routes
// ---------------------------------------------------------------------------

describe("sync routes", () => {
  let app: FastifyInstance;
  let store: ObjectStore;
  let files: Record<string, string>;

  beforeEach(async () => {
    store = new ObjectStore(null);
    files = { "ri.datasets.main.dataset.customers": "customer_id,full_name,orders,vip\nc1,Ann,1,true\n" };
    const sources: SyncSources = {
      getObjectType: async (rid, type) => (rid === RID && type === T ? customerType() : undefined),
      objectTypesBackedBy: async (datasetRid) =>
        datasetRid === "ri.datasets.main.dataset.customers"
          ? [{ ontologyRid: RID, objectType: T }, { ontologyRid: RID, objectType: "Missing" }]
          : [],
      readCsvFiles: async (datasetRid) => [{ path: "customers.csv", text: files[datasetRid] ?? "" }],
    };
    app = await createServer({
      config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
      store,
      linkStore: new LinkStore(null),
      syncSources: sources,
    });
  });

  it("syncs one object type from its dataset", async () => {
    const res = await app.inject({ method: "POST", url: `/internal/ontologies/${RID}/objectTypes/${T}/sync` });
    expect(res.json()).toEqual({ added: 1, modified: 0, deleted: 0, unchanged: 0 });
    expect(store.getObject(RID, T, "c1").properties).toEqual({ id: "c1", name: "Ann", orders: 1, vip: true });
  });

  it("keeps the previous state when the source is bad", async () => {
    await app.inject({ method: "POST", url: `/internal/ontologies/${RID}/objectTypes/${T}/sync` });
    files["ri.datasets.main.dataset.customers"] = "customer_id,full_name,orders,vip\nc1,Ann,1,true\nc1,Dup,2,true\n";

    const res = await app.inject({ method: "POST", url: `/internal/ontologies/${RID}/objectTypes/${T}/sync` });

    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ObjectTypeSyncFailed");
    expect(store.allObjects(RID, T).map((o) => o.properties.name)).toEqual(["Ann"]);
  });

  it("resyncs every type a changed dataset backs, reporting each failure without blocking the rest", async () => {
    const res = await app.inject({ method: "POST", url: "/internal/datasets/ri.datasets.main.dataset.customers/changed" });
    expect(res.json().results).toEqual([
      { ontologyRid: RID, objectType: T, result: { added: 1, modified: 0, deleted: 0, unchanged: 0 } },
      { ontologyRid: RID, objectType: "Missing", error: expect.stringContaining("Missing") },
    ]);
  });
});
