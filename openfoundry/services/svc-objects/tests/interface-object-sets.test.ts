/**
 * Foundry's `interfaceBase` object set: the objects of every object type that
 * implements an interface, queried as one set.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { ObjectStore } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";

const RID = "ri.ontology.main.ontology.facilities";
let app: FastifyInstance;

beforeEach(async () => {
  const store = new ObjectStore(null);
  store.createObject(RID, "Warehouse", "w1", { name: "North", city: "Oslo" });
  store.createObject(RID, "Airport", "a1", { name: "Gardermoen", city: "Oslo" });
  store.createObject(RID, "Airport", "a2", { name: "Flesland", city: "Bergen" });
  store.createObject(RID, "Truck", "t1", { name: "Volvo" });
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
    store,
    linkStore: new LinkStore(null),
    interfaces: {
      implementingObjectTypes: async (_rid, name) => (name === "Facility" ? ["Warehouse", "Airport"] : undefined),
    },
  });
});

const load = (objectSet: unknown) =>
  app.inject({ method: "POST", url: `/api/v2/ontologies/${RID}/objectSets/loadObjects`, payload: { objectSet } });

const keys = (res: { json: () => { data: Array<{ primaryKey: string }> } }) =>
  res.json().data.map((o) => o.primaryKey).sort();

describe("interfaceBase object sets", () => {
  it("returns the objects of every implementing type, and no others", async () => {
    expect(keys(await load({ type: "interfaceBase", interfaceType: "Facility" }))).toEqual(["a1", "a2", "w1"]);
  });

  it("composes with filters like any other set", async () => {
    const res = await load({
      type: "filter",
      objectSet: { type: "interfaceBase", interfaceType: "Facility" },
      where: { type: "eq", field: "city", value: "Oslo" },
    });
    expect(keys(res)).toEqual(["a1", "w1"]);
  });

  it("answers InterfaceTypeNotFound for an undeclared interface", async () => {
    const res = await load({ type: "interfaceBase", interfaceType: "Vehicle" });
    expect(res.statusCode).toBe(404);
    expect(res.json().errorName).toBe("InterfaceTypeNotFound");
  });
});

describe("unsupported object set types", () => {
  it("are a bad request, not an empty result", async () => {
    const res = await load({ type: "nearestNeighbors", objectSet: { type: "base", objectType: "Truck" } });
    expect(res.statusCode).toBe(400);
  });
});
