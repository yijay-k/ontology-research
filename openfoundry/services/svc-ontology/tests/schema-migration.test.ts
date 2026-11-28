/**
 * A breaking change to an ACTIVE object type is accepted with migration steps
 * that cover it; the data is migrated (dry run, then for real) before the
 * definition changes.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { OpenFoundryApiError, ErrorCode } from "@openfoundry/errors";
import { createServer } from "../src/server.js";
import { OntologyStore } from "../src/store/ontology-store.js";
import type { ObjectMigrator } from "../src/routes/v2/object-types.js";

let app: FastifyInstance;
let base: string;
let calls: Array<{ steps: unknown; dryRun: boolean }>;
let failNext: boolean;

const migrator: ObjectMigrator = {
  async migrate(_rid, _type, steps, dryRun) {
    calls.push({ steps, dryRun });
    if (failNext) {
      throw new OpenFoundryApiError({ errorCode: ErrorCode.INVALID_ARGUMENT, errorName: "SchemaMigrationFailed", message: "I9: not a number" });
    }
    return { objects: 3, changed: 3 };
  },
};

const prop = (type: string) => ({ type, nullable: true, multiplicity: "SINGLE" });
const invoice = (properties: Record<string, unknown>, key = "id") => ({
  apiName: "Invoice", description: "", primaryKeyApiName: key, status: "ACTIVE",
  properties: { id: prop("STRING"), ref: prop("STRING"), ...properties },
});

beforeEach(async () => {
  calls = [];
  failNext = false;
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never,
    store: new OntologyStore(null),
    objectMigrator: migrator,
  });
  const res = await app.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "ar", displayName: "AR", description: "" } });
  base = `/api/v2/ontologies/${res.json().rid}/objectTypes`;
  await app.inject({ method: "POST", url: base, payload: invoice({ amount: prop("STRING"), legacy: prop("STRING") }) });
});

const update = (payload: unknown) => app.inject({ method: "PUT", url: `${base}/Invoice`, payload });

describe("schema migrations on an ACTIVE type", () => {
  it("still refuses a breaking change with no migration", async () => {
    const res = await update(invoice({ amount: prop("DOUBLE") }));
    expect(res.json().errorName).toBe("BreakingObjectTypeChange");
    expect(calls).toEqual([]);
  });

  it("refuses migrations that leave a break uncovered", async () => {
    const res = await update({ ...invoice({ amount: prop("DOUBLE") }), migrations: [{ type: "castProperty", property: "amount", to: "DOUBLE" }] });
    expect(res.json().errorName).toBe("BreakingObjectTypeChange"); // legacy removed without a drop
    expect(calls).toEqual([]);
  });

  it("migrates the data, dry run first, then changes the definition", async () => {
    const steps = [
      { type: "castProperty", property: "amount", to: "DOUBLE" },
      { type: "renameProperty", from: "legacy", to: "note" },
    ];
    const res = await update({ ...invoice({ amount: prop("DOUBLE"), note: prop("STRING") }), migrations: steps });
    expect(res.statusCode).toBe(200);
    expect(calls.map((c) => c.dryRun)).toEqual([true, false]);
    const read = (await app.inject({ method: "GET", url: `${base}/Invoice` })).json();
    expect(read.properties.amount.type).toBe("DOUBLE");
    expect(read.properties).not.toHaveProperty("legacy");
    expect(read).not.toHaveProperty("migrations");
  });

  it("leaves the definition unchanged when the data cannot be migrated", async () => {
    failNext = true;
    const res = await update({ ...invoice({ amount: prop("INTEGER"), legacy: prop("STRING") }), migrations: [{ type: "castProperty", property: "amount", to: "INTEGER" }] });
    expect(res.json().errorName).toBe("SchemaMigrationFailed");
    expect((await app.inject({ method: "GET", url: `${base}/Invoice` })).json().properties.amount.type).toBe("STRING");
  });

  it("never migrates a primary key change", async () => {
    const res = await update({ ...invoice({ amount: prop("STRING"), legacy: prop("STRING") }, "ref"), migrations: [] });
    expect(res.json().errorName).toBe("BreakingObjectTypeChange");
  });

  it("refuses malformed migration steps", async () => {
    const res = await update({ ...invoice({ amount: prop("STRING"), legacy: prop("STRING") }), migrations: [{ type: "explode" }] });
    expect(res.statusCode).toBe(400);
  });
});
