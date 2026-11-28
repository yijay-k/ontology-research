import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { OntologyStore } from "../src/store/ontology-store.js";

let app: FastifyInstance;
let base: string;
beforeEach(async () => {
  app = await createServer({ config: { port: 0, host: "127.0.0.1", logLevel: "silent", nodeEnv: "test" } as never, store: new OntologyStore(null) });
  const res = await app.inject({ method: "POST", url: "/api/v2/ontologies", payload: { apiName: "ar", displayName: "AR", description: "" } });
  base = `/api/v2/ontologies/${res.json().rid}/objectTypes`;
});

const invoice = (metrics: Record<string, unknown>) => ({
  apiName: "Invoice",
  primaryKeyApiName: "id",
  properties: { id: { type: "STRING" }, amount: { type: "DOUBLE" }, dueDate: { type: "DATE" }, status: { type: "STRING" } },
  metrics,
});

describe("metric definitions", () => {
  it("accepts a well-formed metric and serves it back", async () => {
    const created = await app.inject({
      method: "POST",
      url: base,
      payload: invoice({ openAmount: { measure: { type: "sum", property: "amount" }, timeProperty: "dueDate", unit: "EUR" } }),
    });
    expect(created.statusCode).toBe(201);
    const read = (await app.inject({ method: "GET", url: `${base}/Invoice` })).json();
    expect(read.metrics.openAmount.unit).toBe("EUR");
  });

  it.each([
    ["a sum over a non-numeric property", { m: { measure: { type: "sum", property: "status" } } }, /not numeric/],
    ["an unknown measure", { m: { measure: { type: "median", property: "amount" } } }, /must be count/],
    ["a time property that is not a date", { m: { measure: { type: "count" }, timeProperty: "status" } }, /DATE or TIMESTAMP/],
    ["a measure over a missing property", { m: { measure: { type: "max", property: "ghost" } } }, /must name a property/],
  ])("refuses %s", async (_label, metrics, reason) => {
    const res = await app.inject({ method: "POST", url: base, payload: invoice(metrics) });
    expect(res.statusCode).toBe(400);
    expect(res.json().parameters.reason).toMatch(reason);
  });
});
