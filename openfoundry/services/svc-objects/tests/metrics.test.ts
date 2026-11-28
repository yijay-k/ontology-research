/**
 * Governed metrics: measure + filter from the definition, period and grain
 * chosen at query time, group-bys across cardinality-ONE links only.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import type { LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import { createServer } from "../src/server.js";
import { ObjectStore } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";

const RID = "ri.ontology.main.ontology.metrics";
const QUERY = `/api/v2/ontologies/${RID}/objectSets/metrics/query`;

const INVOICE = {
  apiName: "Invoice",
  primaryKeyApiName: "id",
  properties: { id: { type: "STRING" }, amount: { type: "DOUBLE" }, dueDate: { type: "DATE" }, status: { type: "STRING" } },
  metrics: {
    openAmount: { measure: { type: "sum", property: "amount" }, filter: { type: "eq", field: "status", value: "open" }, timeProperty: "dueDate", unit: "EUR" },
    invoiceCount: { measure: { type: "count" } },
  },
} as unknown as ObjectTypeDefinition;
const LINKS: Record<string, LinkTypeDefinition> = {
  owedBy: { apiName: "owedBy", objectTypeApiName: "Invoice", linkedObjectTypeApiName: "Buyer", cardinality: "ONE", foreignKeyPropertyApiName: "buyerId" } as LinkTypeDefinition,
  lines: { apiName: "lines", objectTypeApiName: "Invoice", linkedObjectTypeApiName: "Line", cardinality: "MANY", foreignKeyPropertyApiName: "id" } as LinkTypeDefinition,
};

let app: FastifyInstance;
beforeEach(async () => {
  const store = new ObjectStore(null);
  const links = new LinkStore(null);
  store.createObject(RID, "Buyer", "B1", { id: "B1", rating: "A" });
  store.createObject(RID, "Buyer", "B2", { id: "B2", rating: "C" });
  const rows: Array<[string, number, string, string, string]> = [
    ["I1", 100, "2026-01-10", "open", "B1"],
    ["I2", 50, "2026-01-28", "open", "B2"],
    ["I3", 70, "2026-02-03", "open", "B2"],
    ["I4", 999, "2026-02-04", "paid", "B1"],
    ["I5", 20, "2026-03-15", "open", "B1"],
  ];
  for (const [id, amount, dueDate, status, buyer] of rows) {
    store.createObject(RID, "Invoice", id, { id, amount, dueDate, status });
    links.createLink(RID, "Invoice", id, "owedBy", "Buyer", buyer);
  }
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
    store,
    linkStore: links,
    syncSources: { getObjectType: async (_rid, t) => (t === "Invoice" ? INVOICE : undefined) } as never,
    linkTypes: { getLinkType: async (_rid, name) => LINKS[name] },
  });
});

const query = async (body: Record<string, unknown>) => {
  const res = await app.inject({ method: "POST", url: QUERY, payload: { objectType: "Invoice", ...body } });
  return { status: res.statusCode, body: res.json() };
};

describe("metric queries", () => {
  it("applies the definition's filter and reports its unit", async () => {
    const { body } = await query({ metric: "openAmount" });
    expect(body).toMatchObject({ unit: "EUR", measure: { type: "sum", property: "amount" } });
    expect(body.rows).toEqual([{ value: 240, objects: 4 }]); // the paid 999 is excluded
  });

  it("buckets by grain within a period", async () => {
    const { body } = await query({ metric: "openAmount", grain: "month", from: "2026-01-01", to: "2026-03-01" });
    expect(body.rows).toEqual([
      { period: "2026-01", value: 150, objects: 2 },
      { period: "2026-02", value: 70, objects: 1 },
    ]);
    const weeks = (await query({ metric: "openAmount", grain: "week", from: "2026-01-01", to: "2026-02-01" })).body.rows;
    expect(weeks.map((r: { period: string }) => r.period)).toEqual(["2026-W02", "2026-W05"]);
  });

  it("groups by a property and across a cardinality-ONE link", async () => {
    const { body } = await query({ metric: "openAmount", groupBy: ["owedBy.rating"] });
    expect(body.rows).toEqual([
      { group: { "owedBy.rating": "A" }, value: 120, objects: 2 },
      { group: { "owedBy.rating": "C" }, value: 120, objects: 2 },
    ]);
    const byStatus = (await query({ metric: "invoiceCount", groupBy: ["status"] })).body.rows;
    expect(byStatus).toEqual([
      { group: { status: "open" }, value: 4, objects: 4 },
      { group: { status: "paid" }, value: 1, objects: 1 },
    ]);
  });

  it("refuses to group across a one-to-many link (fan-out)", async () => {
    const res = await query({ metric: "openAmount", groupBy: ["lines.sku"] });
    expect(res.status).toBe(400);
    expect(res.body.errorName).toBe("MetricFanOutRefused");
  });

  it("refuses unknown metrics, unknown groupings and periods on a metric without time", async () => {
    expect((await query({ metric: "nope" })).status).toBe(404);
    expect((await query({ metric: "openAmount", groupBy: ["ghost"] })).status).toBe(400);
    expect((await query({ metric: "invoiceCount", grain: "month" })).status).toBe(400);
    expect((await query({ metric: "openAmount", grain: "fortnight" })).status).toBe(400);
  });
});
