/**
 * `POST /internal/ontologies/:ontologyRid/edits` - the commit half of an
 * action. An edit plan lands whole or not at all, on both store backends.
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
import { createServer } from "../src/server.js";
import { ObjectStore, type ObjectEdit } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";
import { PgObjectStore } from "../src/store/pg-object-store.js";

const ONTOLOGY_RID = "ri.ontology.main.ontology.edits";
const URL = `/internal/ontologies/${ONTOLOGY_RID}/edits`;

const modify = (pk: string, properties: Record<string, unknown>): ObjectEdit => ({
  type: "modifyObject", objectType: "Product", primaryKey: pk, properties,
});
const add = (pk: string): ObjectEdit => ({
  type: "addObject", objectType: "Product", primaryKey: pk, properties: { id: pk, stock: 0 },
});

describe("the edits route on the in-memory store", () => {
  let app: FastifyInstance;
  let store: ObjectStore;

  beforeEach(async () => {
    store = new ObjectStore(null);
    store.createObject(ONTOLOGY_RID, "Product", "p-1", { id: "p-1", stock: 5 });
    app = await createServer({
      config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
      store,
      linkStore: new LinkStore(null),
    });
  });

  const stock = () => store.getObject(ONTOLOGY_RID, "Product", "p-1").properties.stock;

  it("applies every edit and answers with the commit", async () => {
    const res = await app.inject({
      method: "POST",
      url: URL,
      payload: { edits: [modify("p-1", { stock: 4 }), add("p-2"), { type: "deleteObject", objectType: "Product", primaryKey: "p-2" }] },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ replayed: false, commitId: expect.any(String) });
    expect(stock()).toBe(4);
    expect(store.allObjects(ONTOLOGY_RID, "Product").map((o) => o.primaryKey)).toEqual(["p-1"]);
  });

  it("applies nothing when a later edit would fail", async () => {
    const res = await app.inject({
      method: "POST",
      url: URL,
      payload: { edits: [modify("p-1", { stock: 0 }), add("p-1")] },
    });
    expect(res.statusCode).toBe(409);
    expect(stock()).toBe(5);
  });

  it("applies nothing when an edited object is missing", async () => {
    const res = await app.inject({
      method: "POST",
      url: URL,
      payload: { edits: [add("p-3"), modify("p-404", { stock: 1 })] },
    });
    expect(res.statusCode).toBe(404);
    expect(store.allObjects(ONTOLOGY_RID, "Product")).toHaveLength(1);
  });

  it("rejects an edit that is not one of the three kinds", async () => {
    const res = await app.inject({
      method: "POST",
      url: URL,
      payload: { edits: [{ type: "addLink", objectType: "Product", primaryKey: "p-1" }] },
    });
    expect(res.statusCode).toBe(400);
  });

  it("serves an object's properties and version, and bumps the version on every write", async () => {
    const read = () => app.inject({ method: "GET", url: `/internal/ontologies/${ONTOLOGY_RID}/objects/Product/p-1` });
    expect((await read()).json()).toEqual({ properties: { id: "p-1", stock: 5 }, version: 1 });
    await app.inject({ method: "POST", url: URL, payload: { edits: [modify("p-1", { stock: 4 })] } });
    expect((await read()).json().version).toBe(2);
  });

  it("answers ObjectChanged and applies nothing when an object moved past the expected version", async () => {
    store.updateObject(ONTOLOGY_RID, "Product", "p-1", { stock: 6 }); // a concurrent writer: version 2
    const res = await app.inject({
      method: "POST",
      url: URL,
      payload: { edits: [add("p-2"), { ...modify("p-1", { stock: 0 }), expectedVersion: 1 }] },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toMatchObject({ errorName: "ObjectChanged", parameters: { objectType: "Product", primaryKey: "p-1" } });
    expect(stock()).toBe(6);
    expect(store.allObjects(ONTOLOGY_RID, "Product")).toHaveLength(1);
  });

  it("applies an edit whose expected version is current", async () => {
    const res = await app.inject({
      method: "POST",
      url: URL,
      payload: { edits: [{ ...modify("p-1", { stock: 1 }), expectedVersion: 1 }] },
    });
    expect(res.statusCode).toBe(200);
    expect(stock()).toBe(1);
  });

  it("is not served under /api", async () => {
    const res = await app.inject({ method: "POST", url: `/api/v2/ontologies/${ONTOLOGY_RID}/edits`, payload: { edits: [] } });
    expect(res.statusCode).toBe(404);
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
] as const)("PgObjectStore.applyEdits on a database built from %s", (_schema, files) => {
  let db: PGlite;
  let pool: pg.Pool;
  let store: PgObjectStore;

  beforeAll(async () => {
    db = await PGlite.create({ extensions: { citext, pgcrypto, pg_trgm, vector } });
    for (const file of files()) await db.exec(readFileSync(file, "utf8"));
    pool = new pg.Pool(createPgConfig(db));
    store = new PgObjectStore(pool);
    await pool.query(`INSERT INTO ontologies (rid, api_name) VALUES ($1, 'edits')`, [ONTOLOGY_RID]);
    await pool.query(
      `INSERT INTO object_types (rid, ontology_rid, api_name, primary_key_api_name, primary_key_type)
       VALUES ('ot-product', $1, 'Product', 'id', 'STRING')`,
      [ONTOLOGY_RID],
    );
    await store.createObject(ONTOLOGY_RID, "Product", "p-1", { id: "p-1", stock: 5 });
  }, 60_000);

  afterAll(async () => {
    await pool?.end();
    await db?.close();
  });

  const keys = async () => (await store.allObjects(ONTOLOGY_RID, "Product")).map((o) => o.primaryKey).sort();
  const stock = async () => (await store.getObject(ONTOLOGY_RID, "Product", "p-1")).properties.stock;

  it("rolls back every edit when one fails", async () => {
    await expect(store.applyEdits(ONTOLOGY_RID, [modify("p-1", { stock: 0 }), add("p-9"), add("p-1")]))
      .rejects.toMatchObject({ statusCode: 409 });
    await expect(store.applyEdits(ONTOLOGY_RID, [add("p-9"), modify("p-404", { stock: 1 })]))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(await stock()).toBe(5);
    expect(await keys()).toEqual(["p-1"]);
  });

  it("refuses a stale expected version with ObjectChanged and rolls the plan back", async () => {
    const { version } = await store.getObject(ONTOLOGY_RID, "Product", "p-1");
    await store.updateObject(ONTOLOGY_RID, "Product", "p-1", { stock: 5 }); // concurrent write
    await expect(
      store.applyEdits(ONTOLOGY_RID, [add("p-8"), { ...modify("p-1", { stock: 0 }), expectedVersion: version }]),
    ).rejects.toMatchObject({ statusCode: 409, errorName: "ObjectChanged" });
    expect(await stock()).toBe(5);
    expect(await keys()).toEqual(["p-1"]);

    const current = (await store.getObject(ONTOLOGY_RID, "Product", "p-1")).version;
    expect(current).toBe(version + 1);
    await store.applyEdits(ONTOLOGY_RID, [{ ...modify("p-1", { stock: 5 }), expectedVersion: current }]);
    expect((await store.getObject(ONTOLOGY_RID, "Product", "p-1")).version).toBe(current + 1);
  });

  it("commits a mixed plan", async () => {
    await store.applyEdits(ONTOLOGY_RID, [
      modify("p-1", { stock: 4 }),
      add("p-2"),
      add("p-3"),
      { type: "deleteObject", objectType: "Product", primaryKey: "p-3" },
    ]);
    expect(await stock()).toBe(4);
    expect(await keys()).toEqual(["p-1", "p-2"]);
  });
});
