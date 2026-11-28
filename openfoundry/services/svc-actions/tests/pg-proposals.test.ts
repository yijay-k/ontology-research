/**
 * PgProposalStore against a database built from each schema source: a
 * proposal round-trips, and a decision lands only on a PENDING proposal.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { PGlite } from "@electric-sql/pglite";
import { createPgConfig } from "@electric-sql/pglite/node-postgres";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { vector } from "@electric-sql/pglite-pgvector";
import { PgProposalStore } from "../src/store/pg-proposals.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationFiles = () => {
  const dir = path.join(REPO_ROOT, "db/migrations");
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(dir, f));
};

describe.each([
  ["db/migrations", migrationFiles],
  ["scripts/migrate.sql", () => [path.join(REPO_ROOT, "scripts/migrate.sql")]],
])("PgProposalStore on a database built from %s", (_schema, files) => {
  let db: PGlite;
  let pool: pg.Pool;
  let store: PgProposalStore;

  beforeAll(async () => {
    db = await PGlite.create({ extensions: { citext, pgcrypto, pg_trgm, vector } });
    for (const file of files()) await db.exec(readFileSync(file, "utf8"));
    pool = new pg.Pool(createPgConfig(db));
    store = new PgProposalStore(pool);
  }, 60_000);

  afterAll(async () => {
    await pool?.end();
    await db?.close();
  });

  it("round-trips a proposal and decides it only while PENDING", async () => {
    const edits = [{ type: "modifyObject" as const, objectType: "P", primaryKey: "1", properties: { q: 2 }, expectedVersion: 3 }];
    const created = await store.create({
      ontologyRid: "ri.o", actionType: "bulk", parameters: { q: 2 }, edits,
      reads: [{ objectType: "Q", primaryKey: "9", version: 4 }], proposedBy: "alice",
    });
    expect(created).toMatchObject({ status: "PENDING", proposedBy: "alice", edits });
    expect((await store.list("ri.o", "PENDING")).map((p) => p.rid)).toEqual([created.rid]);

    const approved = await store.decide("ri.o", created.rid, { status: "APPROVED", decidedBy: "bob", commitId: "c1" });
    expect(approved).toMatchObject({ status: "APPROVED", decidedBy: "bob", commitId: "c1", decidedAt: expect.any(String) });
    expect(await store.decide("ri.o", created.rid, { status: "REJECTED", decidedBy: "carol" })).toBeUndefined();
    expect((await store.get("ri.o", created.rid))?.status).toBe("APPROVED");
    expect(await store.get("ri.other", created.rid)).toBeUndefined();
  });
});
