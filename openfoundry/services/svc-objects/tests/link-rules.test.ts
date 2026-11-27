/**
 * A link is an instance of a declared link type: from its source object type
 * to its target type, between objects that exist, with no duplicates, and at
 * most one target per source when the type's cardinality is ONE.
 */
import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import type { LinkTypeDefinition } from "@openfoundry/ontology-schema";
import { createServer } from "../src/server.js";
import { ObjectStore } from "../src/store/object-store.js";
import { LinkStore } from "../src/store/link-store.js";

const RID = "ri.ontology.main.ontology.links";
const LINK_TYPES: Record<string, LinkTypeDefinition> = {
  drives: { apiName: "drives", objectTypeApiName: "Technician", linkedObjectTypeApiName: "Vehicle", cardinality: "ONE", foreignKeyPropertyApiName: "vehicleId" },
  assigned: { apiName: "assigned", objectTypeApiName: "Technician", linkedObjectTypeApiName: "Job", cardinality: "MANY", foreignKeyPropertyApiName: "jobId" },
};

let app: FastifyInstance;

beforeEach(async () => {
  const store = new ObjectStore(null);
  for (const [type, pk] of [["Technician", "t1"], ["Vehicle", "v1"], ["Vehicle", "v2"], ["Job", "j1"], ["Job", "j2"]]) {
    store.createObject(RID, type, pk, { id: pk });
  }
  app = await createServer({
    config: { port: 0, host: "127.0.0.1", logLevel: "silent" } as never,
    store,
    linkStore: new LinkStore(null),
    linkTypes: { getLinkType: async (_rid, name) => LINK_TYPES[name] },
  });
});

const link = (linkType: string, targetObjectType: string, targetPrimaryKey: string, source = "t1") =>
  app.inject({
    method: "POST",
    url: `/api/v2/ontologies/${RID}/objects/Technician/${source}/links/${linkType}`,
    payload: { targetObjectType, targetPrimaryKey },
  });

describe("link creation", () => {
  it("links objects through a declared link type", async () => {
    expect((await link("assigned", "Job", "j1")).statusCode).toBe(201);
    expect((await link("assigned", "Job", "j2")).statusCode).toBe(201);
  });

  it("answers LinkTypeNotFound for an undeclared link type", async () => {
    const res = await link("owns", "Job", "j1");
    expect(res.statusCode).toBe(404);
    expect(res.json().errorName).toBe("LinkTypeNotFound");
  });

  it("refuses a target of the wrong object type", async () => {
    expect((await link("assigned", "Vehicle", "v1")).statusCode).toBe(400);
  });

  it("answers ObjectNotFound / LinkedObjectNotFound for missing endpoints", async () => {
    expect((await link("assigned", "Job", "j1", "t404")).json().errorName).toBe("ObjectNotFound");
    expect((await link("assigned", "Job", "j404")).json().errorName).toBe("LinkedObjectNotFound");
  });

  it("answers LinkAlreadyExists for the same link twice", async () => {
    await link("assigned", "Job", "j1");
    const res = await link("assigned", "Job", "j1");
    expect(res.statusCode).toBe(409);
    expect(res.json().errorName).toBe("LinkAlreadyExists");
  });

  it("allows one target per source when cardinality is ONE", async () => {
    expect((await link("drives", "Vehicle", "v1")).statusCode).toBe(201);
    const res = await link("drives", "Vehicle", "v2");
    expect(res.statusCode).toBe(409);
    expect(res.json().errorName).toBe("LinkCardinalityExceeded");
  });

  it("allows only one of two concurrent ONE links to land", async () => {
    const results = await Promise.all([link("drives", "Vehicle", "v1"), link("drives", "Vehicle", "v2")]);
    expect(results.map((r) => r.statusCode).sort()).toEqual([201, 409]);
  });
});
