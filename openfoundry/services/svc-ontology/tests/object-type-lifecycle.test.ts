/**
 * Object type lifecycle: what may change, by status (Palantir's metadata
 * statuses and schema-migration rules; see `object-type-evolution.ts`).
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { OntologyStore } from "../src/store/ontology-store.js";

let app: FastifyInstance;
let base: string;

const prop = (type: string) => ({ type, nullable: true, multiplicity: "SINGLE" });
const customer = (overrides: Record<string, unknown> = {}) => ({
  apiName: "Customer",
  description: "A customer",
  primaryKeyApiName: "id",
  primaryKeyType: "STRING",
  titlePropertyApiName: "name",
  properties: { id: prop("STRING"), name: prop("STRING"), balance: prop("INTEGER") },
  implements: [],
  ...overrides,
});

const create = (body: Record<string, unknown>) => app.inject({ method: "POST", url: base, payload: body });
const update = (body: Record<string, unknown>) => app.inject({ method: "PUT", url: `${base}/Customer`, payload: body });
const remove = () => app.inject({ method: "DELETE", url: `${base}/Customer` });

beforeEach(async () => {
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never,
    store: new OntologyStore(null),
  });
  const res = await app.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "crm", displayName: "CRM", description: "" } });
  base = `/api/v2/ontologies/${res.json().rid}/objectTypes`;
});

const breaking: Array<[string, Record<string, unknown>]> = [
  ["a changed primary key", { primaryKeyApiName: "name" }],
  ["a removed property", { properties: { id: prop("STRING"), name: prop("STRING") } }],
  ["a changed property type", { properties: { id: prop("STRING"), name: prop("STRING"), balance: prop("DOUBLE") } }],
];

describe("object type lifecycle", () => {
  it("creates a type with no status as EXPERIMENTAL", async () => {
    expect((await create(customer())).json().status).toBe("EXPERIMENTAL");
  });

  it.each(breaking)("lets an EXPERIMENTAL type take %s", async (_, change) => {
    await create(customer());
    expect((await update(customer(change))).statusCode).toBe(200);
  });

  it.each(breaking)("refuses %s on an ACTIVE type", async (_, change) => {
    await create(customer({ status: "ACTIVE" }));
    const res = await update(customer({ status: "ACTIVE", ...change }));
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("BreakingObjectTypeChange");
  });

  it("lets an ACTIVE type take additive changes", async () => {
    await create(customer({ status: "ACTIVE" }));
    const res = await update(
      customer({ status: "ACTIVE", description: "Renamed", properties: { ...customer().properties, city: prop("STRING") } }),
    );
    expect(res.statusCode).toBe(200);
  });

  it("refuses a breaking change on a DEPRECATED type too", async () => {
    await create(customer({ status: "DEPRECATED" }));
    expect((await update(customer({ status: "DEPRECATED", primaryKeyApiName: "name" }))).statusCode).toBe(400);
  });

  it("never renames a type through update", async () => {
    await create(customer());
    const res = await update(customer({ apiName: "Client" }));
    expect(res.json().errorName).toBe("ObjectTypeApiNameChange");
  });

  it("refuses to delete an ACTIVE type, and deletes it once DEPRECATED", async () => {
    await create(customer({ status: "ACTIVE" }));
    const refused = await remove();
    expect(refused.statusCode).toBe(400);
    expect(refused.json().errorName).toBe("ActiveObjectTypeDeletion");

    expect((await update(customer({ status: "DEPRECATED" }))).statusCode).toBe(200);
    expect((await remove()).statusCode).toBe(204);
  });
});
