/**
 * Bounds on object-set reads, which agents will otherwise issue unbounded:
 * `pageSize` within Foundry's 1-10,000, a cap on how many objects one set may
 * resolve to (Foundry's `ObjectsExceededLimit`), and page tokens that are
 * valid only for the query that issued them.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { ObjectStore } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";

const RID = "ri.ontology.main.ontology.limits";
const LOAD = `/api/v2/ontologies/${RID}/objectSets/loadObjects`;
const AGGREGATE = `/api/v2/ontologies/${RID}/objectSets/aggregate`;
const invoices = { type: "base", objectType: "Invoice" };

let app: FastifyInstance;

beforeEach(async () => {
  const store = new ObjectStore(null);
  for (let i = 1; i <= 12; i++) store.createObject(RID, "Invoice", `INV-${i}`, { id: `INV-${i}`, amount: i * 10 });
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
    store,
    linkStore: new LinkStore(null),
    interfaces: { implementingTypes: async () => [] } as never,
    maxObjectSetSize: 10,
  });
});

const load = (body: Record<string, unknown>) => app.inject({ method: "POST", url: LOAD, payload: body });
const filtered = (minAmount: number) => ({
  type: "filter",
  objectSet: invoices,
  where: { type: "gte", field: "amount", value: minAmount },
});

describe("object set limits", () => {
  it.each([0, -1, 1.5, 10_001, "50"])("refuses pageSize %s", async (pageSize) => {
    const res = await load({ objectSet: filtered(50), pageSize });
    expect(res.statusCode).toBe(400);
    expect(res.json().parameters.param).toBe("pageSize");
  });

  it("refuses an object set larger than the cap with ObjectsExceededLimit, on load and aggregate", async () => {
    const res = await load({ objectSet: invoices, pageSize: 5 });
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ObjectsExceededLimit");

    const agg = await app.inject({ method: "POST", url: AGGREGATE, payload: { objectSet: invoices, aggregation: [{ type: "count" }] } });
    expect(agg.json().errorName).toBe("ObjectsExceededLimit");
  });

  it("pages through a set within the cap without skipping or repeating", async () => {
    const seen: string[] = [];
    let pageToken: string | undefined;
    do {
      const res = await load({ objectSet: filtered(40), pageSize: 4, orderBy: [{ field: "amount", direction: "asc" }], pageToken });
      expect(res.statusCode).toBe(200);
      seen.push(...res.json().data.map((o: { primaryKey: string }) => o.primaryKey));
      pageToken = res.json().nextPageToken;
    } while (pageToken);
    expect(seen).toEqual(["INV-4", "INV-5", "INV-6", "INV-7", "INV-8", "INV-9", "INV-10", "INV-11", "INV-12"]);
  });

  it("refuses a page token used with a different query", async () => {
    const first = await load({ objectSet: filtered(40), pageSize: 4 });
    const token = first.json().nextPageToken;
    expect(token).toBeDefined();
    const other = await load({ objectSet: filtered(60), pageSize: 4, pageToken: token });
    expect(other.statusCode).toBe(400);
    expect(other.json().parameters.param).toBe("pageToken");
  });

  it("answers a malformed page token with 400, not 500", async () => {
    const res = await load({ objectSet: filtered(40), pageToken: "not-a-token" });
    expect(res.statusCode).toBe(400);
  });
});
