/**
 * Behaviour of `branch`, `scenarioRid` and `transactionId` on action apply.
 *
 * OpenFoundry models no ontology branches, scenarios or transactions, so any
 * value names something that does not exist. Applying the action anyway would
 * tell the caller its edit landed on the branch or scenario it asked for when
 * it landed on the only ontology there is.
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { createServer } from "../src/server.js";
import { ActionLog } from "../src/store/action-log.js";
import {
  ONTOLOGY_RID,
  TEST_CONFIG,
  fakeObjects,
  fakeOntology,
  pestControlRows,
  type FakeObjects,
} from "./fixtures.js";

const APPLY = `/api/v2/ontologies/${ONTOLOGY_RID}/actions/reorder-product/apply`;
const APPLY_BATCH = `/api/v2/ontologies/${ONTOLOGY_RID}/actions/reorder-product/applyBatch`;
const PARAMS = { productId: "PROD-1", quantity: 1 };

let app: FastifyInstance;
let objects: FakeObjects;

beforeEach(async () => {
  objects = fakeObjects(pestControlRows());
  app = await createServer({
    config: TEST_CONFIG,
    ontology: fakeOntology(),
    objects,
    actionLog: new ActionLog(),
  });
});

describe("Apply action — ontology scoping", () => {
  it("answers FoundryBranchNotFound naming the branch that was asked for", async () => {
    const res = await app.inject({
      method: "POST",
      url: `${APPLY}?branch=experiment`,
      payload: { parameters: PARAMS },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().errorName).toBe("FoundryBranchNotFound");
    expect(res.json().parameters.branch).toBe("experiment");
  });

  it("answers OntologyScenarioNotFound for a scenario", async () => {
    const res = await app.inject({
      method: "POST",
      url: `${APPLY}?scenarioRid=ri.scenario.main.scenario.1`,
      payload: { parameters: PARAMS },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().errorName).toBe("OntologyScenarioNotFound");
  });

  it("answers OntologyTransactionNotFound for a transaction", async () => {
    const res = await app.inject({
      method: "POST",
      url: `${APPLY}?transactionId=txn-1`,
      payload: { parameters: PARAMS },
    });

    expect(res.statusCode).toBe(404);
    expect(res.json().errorName).toBe("OntologyTransactionNotFound");
  });

  it("does not run the action when the scoping is rejected", async () => {
    await app.inject({
      method: "POST",
      url: `${APPLY}?branch=experiment`,
      payload: { parameters: PARAMS },
    });

    expect(objects.commits).toBe(0);
  });

  it("applies normally when nothing is scoped", async () => {
    const res = await app.inject({
      method: "POST",
      url: APPLY,
      payload: { parameters: PARAMS },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().validation.result).toBe("VALID");
    expect(objects.commits).toBe(1);
  });
});

describe("Apply batch — ontology scoping", () => {
  it("rejects a branch and a scenario", async () => {
    for (const [query, errorName] of [
      ["branch=experiment", "FoundryBranchNotFound"],
      ["scenarioRid=ri.scenario.main.scenario.1", "OntologyScenarioNotFound"],
    ]) {
      const res = await app.inject({
        method: "POST",
        url: `${APPLY_BATCH}?${query}`,
        payload: { requests: [{ parameters: PARAMS }] },
      });
      expect(res.statusCode, query).toBe(404);
      expect(res.json().errorName, query).toBe(errorName);
    }
  });

  it("applies normally when nothing is scoped", async () => {
    const res = await app.inject({
      method: "POST",
      url: APPLY_BATCH,
      payload: { requests: [{ parameters: PARAMS }] },
    });

    expect(res.statusCode).toBe(200);
  });
});
