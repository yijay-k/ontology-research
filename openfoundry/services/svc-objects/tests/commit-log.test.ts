/**
 * What an action commit writes beside its edits, in the same transaction
 * (research H5; proofs G1, G2, G5, G6 in yijay-k/ontology-research):
 * - a repeated idempotency key returns the first commit and applies nothing;
 * - objects the plan only read refuse it with `ObjectChanged` if they changed
 *   (the write-skew case: snapshot checks on written objects alone let two
 *   actions that each read a pair and write one of it both commit);
 * - an `action.committed` outbox event exists exactly when the edits do.
 * Run on the in-memory store and on Postgres built from each schema source.
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
import { ObjectStore, type ObjectEdit, type ObjectReadWriteStore } from "../src/store/object-store.js";
import { PgObjectStore } from "../src/store/pg-object-store.js";

const RID = "ri.ontology.main.ontology.commits";
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationFiles = () => {
  const dir = path.join(REPO_ROOT, "db/migrations");
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(dir, f));
};

interface Backend {
  setup(): Promise<void>;
  fresh(): Promise<ObjectReadWriteStore>;
  teardown(): Promise<void>;
}

const memory: Backend = {
  async setup() {},
  async fresh() {
    return new ObjectStore(null);
  },
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
      await pool.query(`INSERT INTO ontologies (rid, api_name) VALUES ($1, 'commits')`, [RID]);
      await pool.query(
        `INSERT INTO object_types (rid, ontology_rid, api_name, primary_key_api_name, primary_key_type)
         VALUES ('ot-account', $1, 'Account', 'id', 'STRING')`,
        [RID],
      );
    },
    async fresh() {
      await pool.query("TRUNCATE objects, object_edits, action_commits, outbox CASCADE");
      return new PgObjectStore(pool);
    },
    async teardown() {
      await pool?.end();
      await db?.close();
    },
  };
}

/** The in-memory store throws synchronously; turn that into a rejection. */
const attempt = <T>(fn: () => T | Promise<T>) => Promise.resolve().then(fn);

const withdraw = (pk: string, balance: number): ObjectEdit => ({
  type: "modifyObject", objectType: "Account", primaryKey: pk, properties: { balance },
});

describe.each([
  ["memory", memory],
  ["postgres, db/migrations", postgres(migrationFiles)],
  ["postgres, scripts/migrate.sql", postgres(() => [path.join(REPO_ROOT, "scripts/migrate.sql")])],
] as const)("action commits on the %s store", (_name, backend) => {
  let store: ObjectReadWriteStore;

  beforeAll(() => backend.setup(), 60_000);
  afterAll(() => backend.teardown());

  beforeEach(async () => {
    store = await backend.fresh();
    await store.createObject(RID, "Account", "a", { id: "a", balance: 100 });
    await store.createObject(RID, "Account", "b", { id: "b", balance: 100 });
  });

  const balance = async (pk: string) => (await store.getObject(RID, "Account", pk)).properties.balance;
  const versionOf = async (pk: string) => (await store.getObject(RID, "Account", pk)).version;

  it("applies a repeated idempotency key once and replays the first commit", async () => {
    const first = await store.applyEdits(RID, [withdraw("a", 70)], { idempotencyKey: "k-1", actionType: "withdraw" });
    const again = await store.applyEdits(RID, [withdraw("a", 40)], { idempotencyKey: "k-1", actionType: "withdraw" });
    expect(first.replayed).toBe(false);
    expect(again).toEqual({ commitId: first.commitId, replayed: true });
    expect(await balance("a")).toBe(70);
    expect((await store.getCommit(RID, "k-1"))?.edits).toEqual([withdraw("a", 70)]);
    expect(await store.getCommit(RID, "k-404")).toBeUndefined();
  });

  it("queues one action.committed event per commit, none for a replay, and drains it", async () => {
    const { commitId } = await store.applyEdits(RID, [withdraw("a", 70)], { idempotencyKey: "k-2", actor: "alice" });
    await store.applyEdits(RID, [withdraw("a", 70)], { idempotencyKey: "k-2" });
    const pending = await store.pendingOutbox(10);
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      ontologyRid: RID,
      topic: "action.committed",
      payload: { commitId, actor: "alice", edits: [{ type: "modifyObject", objectType: "Account", primaryKey: "a" }] },
    });
    await store.markDelivered([pending[0].id]);
    expect(await store.pendingOutbox(10)).toEqual([]);
  });

  it("leaves no commit and no event when the plan fails", async () => {
    await expect(
      attempt(() => store.applyEdits(RID, [withdraw("a", 0), withdraw("missing", 0)], { idempotencyKey: "k-3" })),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(await balance("a")).toBe(100);
    expect(await store.getCommit(RID, "k-3")).toBeUndefined();
    expect(await store.pendingOutbox(10)).toEqual([]);
  });

  it("refuses a plan whose read-only object changed (write skew)", async () => {
    // Invariant: a + b >= 100. Both actions read both accounts at their
    // current versions, each sees 200, and each withdraws 100 from a different
    // account. Version checks on the written object alone would admit both.
    const reads = [
      { objectType: "Account", primaryKey: "a", version: await versionOf("a") },
      { objectType: "Account", primaryKey: "b", version: await versionOf("b") },
    ];
    const readsExcept = (pk: string) => reads.filter((r) => r.primaryKey !== pk);
    await store.applyEdits(RID, [{ ...withdraw("a", 0), expectedVersion: reads[0].version }], { reads: readsExcept("a") });
    await expect(
      attempt(() => store.applyEdits(RID, [{ ...withdraw("b", 0), expectedVersion: reads[1].version }], { reads: readsExcept("b") })),
    ).rejects.toMatchObject({ statusCode: 409, errorName: "ObjectChanged" });
    expect((await balance("a")) + (await balance("b"))).toBe(100);
  });

  it("applies a plan whose read-only objects are unchanged", async () => {
    const reads = [{ objectType: "Account", primaryKey: "b", version: await versionOf("b") }];
    await store.applyEdits(RID, [withdraw("a", 50)], { reads });
    expect(await balance("a")).toBe(50);
  });
});
