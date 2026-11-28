/**
 * A link type's foreign key property links objects with no link rows, as a
 * dataset-backed type's links arrive: metric group-bys and searchAround follow
 * it, and a source without the property still falls back to stored links.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import type { LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import { createServer } from "../src/server.js";
import { ObjectStore } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";

const RID = "ri.ontology.main.ontology.fk";
const INVOICE = {
  apiName: "Invoice",
  primaryKeyApiName: "invoiceId",
  properties: { invoiceId: { type: "STRING" }, amount: { type: "DOUBLE" }, customerId: { type: "STRING" } },
  metrics: { invoiced: { measure: { type: "sum", property: "amount" } } },
} as unknown as ObjectTypeDefinition;
const BILLED_TO = {
  apiName: "billedTo",
  objectTypeApiName: "Invoice",
  linkedObjectTypeApiName: "Customer",
  cardinality: "ONE",
  foreignKeyPropertyApiName: "customerId",
} as LinkTypeDefinition;

let app: FastifyInstance;
beforeEach(async () => {
  const store = new ObjectStore(null);
  const links = new LinkStore(null);
  store.createObject(RID, "Customer", "C1", { customerId: "C1", segment: "retail" });
  store.createObject(RID, "Customer", "C2", { customerId: "C2", segment: "wholesale" });
  store.createObject(RID, "Invoice", "I1", { invoiceId: "I1", amount: 100, customerId: "C1" });
  store.createObject(RID, "Invoice", "I2", { invoiceId: "I2", amount: 40, customerId: "C2" });
  store.createObject(RID, "Invoice", "I3", { invoiceId: "I3", amount: 5, customerId: "C2" });
  // No foreign key value: the stored row is the link.
  store.createObject(RID, "Invoice", "I4", { invoiceId: "I4", amount: 1 });
  links.createLink(RID, "Invoice", "I4", "billedTo", "Customer", "C1");
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
    store,
    linkStore: links,
    syncSources: { getObjectType: async () => INVOICE } as never,
    linkTypes: { getLinkType: async (_rid, name) => (name === "billedTo" ? BILLED_TO : undefined) },
  });
});

describe("foreign key links", () => {
  it("groups a metric across a link held only as a property", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v2/ontologies/${RID}/objectSets/metrics/query`,
      payload: { objectType: "Invoice", metric: "invoiced", groupBy: ["billedTo.segment"] },
    });
    expect(res.json().rows).toEqual([
      { group: { "billedTo.segment": "retail" }, value: 101, objects: 2 },
      { group: { "billedTo.segment": "wholesale" }, value: 45, objects: 2 },
    ]);
  });

  it("searches around through the foreign key", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v2/ontologies/${RID}/objectSets/loadObjects`,
      payload: {
        objectSet: { type: "searchAround", link: "billedTo", objectSet: { type: "static", objectType: "Invoice", primaryKeys: ["I2", "I3"] } },
        select: ["segment"],
      },
    });
    expect(res.json().data.map((o: { primaryKey: string }) => o.primaryKey)).toEqual(["C2"]);
  });
});
