/**
 * Foundry v2 object-set types and filters beyond the basics: asType,
 * withProperties (derived aggregates over up to three link hops),
 * nearestNeighbors over a vector property, the term queries, `isNull` with
 * `value`, and a 400 for any filter type the evaluator does not know (which
 * used to match every object).
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { ObjectStore } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";

const RID = "ri.ontology.main.ontology.sets";
const LOAD = `/api/v2/ontologies/${RID}/objectSets/loadObjects`;
let app: FastifyInstance;

beforeEach(async () => {
  const store = new ObjectStore(null);
  const links = new LinkStore(null);
  store.createObject(RID, "Region", "R1", { id: "R1" });
  store.createObject(RID, "Buyer", "B1", { id: "B1", name: "Halden Retail plc", note: null, embedding: [1, 0, 0] });
  store.createObject(RID, "Buyer", "B2", { id: "B2", name: "Kestrel Components", note: "watch", embedding: [0, 1, 0] });
  store.createObject(RID, "Buyer", "B3", { id: "B3", name: "Retail Halden Group", embedding: [0.9, 0.1, 0] });
  for (const [pk, buyer, amount] of [["I1", "B1", 100], ["I2", "B1", 250], ["I3", "B2", 40]] as const) {
    store.createObject(RID, "Invoice", pk, { id: pk, amount });
    links.createLink(RID, "Buyer", buyer, "invoices", "Invoice", pk);
  }
  links.createLink(RID, "Region", "R1", "buyers", "Buyer", "B1");
  links.createLink(RID, "Region", "R1", "buyers", "Buyer", "B2");
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
    store,
    linkStore: links,
    interfaces: { implementingObjectTypes: async () => [] } as never,
  });
});

const load = async (objectSet: Record<string, unknown>, extra: Record<string, unknown> = {}) => {
  const res = await app.inject({ method: "POST", url: LOAD, payload: { objectSet, ...extra } });
  return { status: res.statusCode, body: res.json() };
};
const keys = (body: { data: Array<{ primaryKey: string }> }) => body.data.map((o) => o.primaryKey);
const buyers = { type: "base", objectType: "Buyer" };
const where = (w: Record<string, unknown>) => ({ type: "filter", objectSet: buyers, where: w });

describe("filters", () => {
  it("refuses an unknown filter type instead of matching everything", async () => {
    const res = await load(where({ type: "regexMatchez", field: "name", value: ".*" }));
    expect(res.status).toBe(400);
    const nested = await load(where({ type: "and", value: [{ type: "eq", field: "id", value: "B1" }, { type: "bogus" }] }));
    expect(nested.status).toBe(400);
  });

  it("honours isNull's value", async () => {
    expect(keys((await load(where({ type: "isNull", field: "note", value: true }))).body).sort()).toEqual(["B1", "B3"]);
    expect(keys((await load(where({ type: "isNull", field: "note", value: false }))).body)).toEqual(["B2"]);
  });

  it("matches terms case-insensitively, in any order or in order", async () => {
    expect(keys((await load(where({ type: "containsAnyTerm", field: "name", value: "kestrel acme" }))).body)).toEqual(["B2"]);
    expect(keys((await load(where({ type: "containsAllTerms", field: "name", value: "halden retail" }))).body).sort()).toEqual(["B1", "B3"]);
    expect(keys((await load(where({ type: "containsAllTermsInOrder", field: "name", value: "halden retail" }))).body)).toEqual(["B1"]);
    expect(keys((await load(where({ type: "containsAllTermsInOrderPrefixLastTerm", field: "name", value: "retail hal" }))).body)).toEqual(["B3"]);
  });
});

describe("object set types", () => {
  it("asType keeps the objects of one type from a mixed set", async () => {
    const mixed = { type: "union", objectSets: [buyers, { type: "base", objectType: "Invoice" }] };
    expect(keys((await load({ type: "asType", objectSet: mixed, entityType: "Invoice" })).body)).toEqual(["I1", "I2", "I3"]);
  });

  it("withProperties derives link aggregates that later filters can use", async () => {
    const derived = {
      type: "withProperties",
      objectSet: buyers,
      derivedProperties: {
        invoiceCount: { type: "selection", objectSet: { type: "searchAround", objectSet: { type: "methodInput" }, link: "invoices" }, operation: { type: "count" } },
        invoiceTotal: {
          type: "selection",
          objectSet: { type: "searchAround", objectSet: { type: "methodInput" }, link: "invoices" },
          operation: { type: "sum", selectedPropertyApiName: "amount" },
        },
      },
    };
    const res = await load(derived, { orderBy: [{ field: "id", direction: "asc" }] });
    expect(res.body.data.map((o: { properties: Record<string, unknown> }) => [o.properties.invoiceCount, o.properties.invoiceTotal])).toEqual([
      [2, 350], [1, 40], [0, 0],
    ]);
    const big = await load({ type: "filter", objectSet: derived, where: { type: "gt", field: "invoiceTotal", value: 100 } });
    expect(keys(big.body)).toEqual(["B1"]);
  });

  it("derives across two link hops", async () => {
    const res = await load({
      type: "withProperties",
      objectSet: { type: "base", objectType: "Region" },
      derivedProperties: {
        maxInvoice: {
          type: "selection",
          objectSet: { type: "searchAround", link: "invoices", objectSet: { type: "searchAround", link: "buyers", objectSet: { type: "methodInput" } } },
          operation: { type: "max", selectedPropertyApiName: "amount" },
        },
      },
    });
    expect(res.body.data[0].properties.maxInvoice).toBe(250);
  });

  it("nearestNeighbors ranks by cosine similarity to a vector and refuses a text query", async () => {
    const nn = (query: unknown) => load({ type: "nearestNeighbors", objectSet: buyers, propertyIdentifier: { type: "property", apiName: "embedding" }, numNeighbors: 2, query });
    expect(keys((await nn({ type: "vector", value: [1, 0, 0] })).body)).toEqual(["B1", "B3"]);
    expect((await nn({ type: "text", value: "retail" })).status).toBe(400);
  });

  it("still refuses an object set type it does not know", async () => {
    expect((await load({ type: "reference", reference: "ri.object-set.main.saved.1" })).status).toBe(400);
  });
});
