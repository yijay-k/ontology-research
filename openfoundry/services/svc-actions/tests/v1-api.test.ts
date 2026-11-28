/**
 * The `/api/v1` action surface, checked against the v1 models in
 * `foundry_sdk/v1/ontologies/models.py`: `ApplyActionResponse` and
 * `BatchApplyActionResponse` declare no fields, an invalid apply is
 * `ActionValidationFailed`, and `ValidateActionResponse` is a per-parameter
 * evaluation plus the submission criteria.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import {
  ONTOLOGY_RID,
  TEST_CONFIG,
  fakeObjects,
  fakeOntology,
  pestControlRows,
  type FakeObjects,
} from "./fixtures.js";

const BASE = `/api/v1/ontologies/${ONTOLOGY_RID}/actions/reorder-product`;

let app: FastifyInstance;
let objects: FakeObjects;

/** Log methods answer with promises, as `PgActionLog`'s do. */
const asyncLog = {
  logStart: async (actionApiName: string, parameters: Record<string, unknown>) => ({
    rid: "ri.actions.main.execution.1",
    actionApiName,
    parameters,
    status: "RUNNING" as const,
    startedAt: new Date().toISOString(),
  }),
  logComplete: async () => {},
  logFailure: async () => {},
};

beforeEach(async () => {
  objects = fakeObjects(pestControlRows());
  app = await createServer({
    config: TEST_CONFIG,
    ontology: fakeOntology(),
    objects,
    actionLog: asyncLog,
  });
});

const post = (op: string, payload: unknown) =>
  app.inject({ method: "POST", url: `${BASE}/${op}`, payload });

describe("v1 apply", () => {
  it("answers an empty ApplyActionResponse and commits the edits", async () => {
    const res = await post("apply", { parameters: { productId: "PROD-1", quantity: 2 } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({});
    expect(objects.rows.get("TreatmentProduct/PROD-1")?.stockQty).toBe(7);
  });

  it("answers ActionValidationFailed for invalid parameters", async () => {
    const res = await post("apply", { parameters: { productId: "PROD-1", quantity: "two" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ActionValidationFailed");
    expect(objects.commits).toBe(0);
  });

  it("answers ActionValidationFailed when the logic refuses", async () => {
    const res = await post("apply", { parameters: { productId: "PROD-1", quantity: 0 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ActionValidationFailed");
  });

  it("reports an unknown action type as a 404", async () => {
    const res = await app.inject({
      method: "POST",
      url: `/api/v1/ontologies/${ONTOLOGY_RID}/actions/absent/apply`,
      payload: { parameters: {} },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe("v1 applyBatch", () => {
  it("answers an empty BatchApplyActionResponse and commits once", async () => {
    const res = await post("applyBatch", {
      requests: [{ parameters: { productId: "PROD-1", quantity: 1 } }, { parameters: { productId: "PROD-1", quantity: 1 } }],
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({});
    expect(objects.commits).toBe(1);
  });

  it("applies nothing when any request is invalid", async () => {
    const res = await post("applyBatch", {
      requests: [{ parameters: { productId: "PROD-1", quantity: 1 } }, { parameters: { productId: "PROD-1" } }],
    });
    expect(res.statusCode).toBe(400);
    expect(objects.commits).toBe(0);
  });
});

describe("v1 validate", () => {
  it("evaluates every declared parameter and writes nothing", async () => {
    const res = await post("validate", { parameters: { productId: "PROD-1", quantity: 1 } });
    expect(res.json()).toEqual({
      result: "VALID",
      submissionCriteria: [],
      parameters: {
        productId: { result: "VALID", evaluatedConstraints: [], required: true },
        quantity: { result: "VALID", evaluatedConstraints: [], required: true },
        supplier: { result: "VALID", evaluatedConstraints: [], required: false },
      },
    });
    expect(objects.commits).toBe(0);
  });

  it("marks a missing required parameter INVALID", async () => {
    const res = await post("validate", { parameters: { productId: "PROD-1" } });
    expect(res.json().result).toBe("INVALID");
    expect(res.json().parameters.quantity.result).toBe("INVALID");
  });

  it("reports the logic's refusal as a failed submission criterion", async () => {
    const res = await post("validate", { parameters: { productId: "PROD-404", quantity: 1 } });
    expect(res.json().result).toBe("INVALID");
    expect(res.json().submissionCriteria).toEqual([
      { configuredFailureMessage: "Treatment product PROD-404 does not exist", result: "INVALID" },
    ]);
  });
});
