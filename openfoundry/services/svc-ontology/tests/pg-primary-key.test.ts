/**
 * The seeds name an object type's key `primaryKey`; the schema type names it
 * `primaryKeyApiName`. The Postgres store defaults a missing name to "id", so
 * unless the route maps the alias, every seeded type gets the wrong key in
 * Postgres mode. Run against a database built from each schema source.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
import { PgOntologyStore } from "../src/store/pg-ontology-store.js";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migrationFiles = () => {
  const dir = path.join(REPO_ROOT, "db/migrations");
  return readdirSync(dir).filter((f) => f.endsWith(".sql")).sort().map((f) => path.join(dir, f));
};

describe.each([
  ["db/migrations", migrationFiles],
  ["scripts/migrate.sql", () => [path.join(REPO_ROOT, "scripts/migrate.sql")]],
])("PgOntologyStore on a database built from %s", (_schema, files) => {
  let db: PGlite;
  let pool: pg.Pool;
  let app: FastifyInstance;
  let ontologyRid: string;

  beforeAll(async () => {
    db = await PGlite.create({ extensions: { citext, pgcrypto, pg_trgm, vector } });
    for (const file of files()) await db.exec(readFileSync(file, "utf8"));
    pool = new pg.Pool(createPgConfig(db));
    const store = new PgOntologyStore(pool);
    ontologyRid = (await store.createOntology({ apiName: "pk", displayName: "PK", description: "" })).rid;
    app = await createServer({
      config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never,
      store,
    });
  }, 60_000);

  afterAll(async () => {
    await app?.close();
    await pool?.end();
    await db?.close();
  });

  it("keeps the key a seed names as `primaryKey`", async () => {
    const created = await app.inject({
      method: "POST",
      url: `/api/v2/ontologies/${ontologyRid}/objectTypes`,
      payload: {
        apiName: "Customer",
        displayName: "Customer",
        primaryKey: "customerId",
        properties: { customerId: { type: "string" }, name: { type: "string" } },
      },
    });
    expect(created.statusCode).toBe(201);

    const read = await app.inject({ method: "GET", url: `/api/v2/ontologies/${ontologyRid}/objectTypes/Customer` });
    expect(read.json().primaryKeyApiName).toBe("customerId");
  });
});
