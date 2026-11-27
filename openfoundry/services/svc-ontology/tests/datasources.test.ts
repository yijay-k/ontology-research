/**
 * Object types backed by a dataset, declared as Foundry's
 * `ObjectTypeDatasource` (`foundry_sdk/v2/ontologies/models.py`).
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { OntologyStore } from "../src/store/ontology-store.js";

let app: FastifyInstance;
let base: string;

const datasource = (propertyMapping: Record<string, unknown>) => ({
  definition: { type: "dataset", datasetRid: "ri.datasets.main.dataset.customers", propertyMapping },
});

const customer = (datasources: unknown[]) => ({
  apiName: "Customer",
  description: "A customer",
  primaryKeyApiName: "id",
  primaryKeyType: "STRING",
  titlePropertyApiName: "name",
  properties: {
    id: { type: "STRING", nullable: false, multiplicity: "SINGLE" },
    name: { type: "STRING", nullable: true, multiplicity: "SINGLE" },
    note: { type: "STRING", nullable: true, multiplicity: "SINGLE" },
  },
  implements: [],
  status: "ACTIVE",
  datasources,
});

const valid = () =>
  customer([datasource({ id: { type: "column", column: "customer_id" }, note: { type: "editOnly" } })]);

beforeEach(async () => {
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never,
    store: new OntologyStore(null),
  });
  const res = await app.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "crm", displayName: "CRM", description: "" } });
  base = `/api/v2/ontologies/${res.json().rid}/objectTypes`;
});

describe("object type datasources", () => {
  it("stores a dataset datasource with a generated RID, served only with includeDatasources", async () => {
    const created = await app.inject({ method: "POST", url: base, payload: valid() });
    expect(created.statusCode).toBe(201);
    expect(created.json()).not.toHaveProperty("datasources");

    const withFlag = await app.inject({ method: "GET", url: `${base}/Customer?includeDatasources=true` });
    const [source] = withFlag.json().datasources;
    expect(source.rid).toMatch(/^ri\.ontology\..*\.datasource\./);
    expect(source.definition).toEqual(valid().datasources[0].definition);

    const plain = await app.inject({ method: "GET", url: `${base}/Customer` });
    expect(plain.json()).not.toHaveProperty("datasources");
  });

  it.each([
    ["a mapping to an undeclared property", [datasource({ id: { type: "column", column: "id" }, ghost: { type: "column", column: "g" } })], /ghost/],
    ["a primary key with no column", [datasource({ name: { type: "column", column: "n" } })], /primary key "id"/],
    ["two datasources", [datasource({ id: { type: "column", column: "id" } }), datasource({ id: { type: "column", column: "id" } })], /at most one/],
  ])("rejects %s", async (_, sources, message) => {
    const res = await app.inject({ method: "POST", url: base, payload: customer(sources) });
    expect(res.statusCode).toBe(400);
    expect(res.json().parameters.reason).toMatch(message);
  });

  it("validates datasources on update too", async () => {
    await app.inject({ method: "POST", url: base, payload: customer([]) });
    const res = await app.inject({
      method: "PUT",
      url: `${base}/Customer`,
      payload: customer([datasource({ name: { type: "column", column: "n" } })]),
    });
    expect(res.statusCode).toBe(400);
  });
});
