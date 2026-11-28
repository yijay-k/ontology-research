import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { FastifyInstance } from "fastify";
import {
  FileAuthorizationStore,
  ROOT_RESOURCE,
  setEnforcePermissions,
} from "@openfoundry/permissions";
import { createServer } from "../src/server.js";
import type { ActionExecutionLog } from "../src/store/action-log.js";
import type { ActionLogic } from "../src/logic.js";
import { ACTION_LOGIC } from "../src/logic.js";
import {
  ONTOLOGY_RID,
  OTHER_ONTOLOGY_RID,
  TEST_CONFIG,
  fakeObjects,
  fakeOntology,
  pestControlRows,
  type FakeObjects,
} from "./fixtures.js";

const authz = new FileAuthorizationStore(null);
await authz.addGrant({
  resourceRid: ROOT_RESOURCE,
  principalType: "user",
  principalId: "test-viewer",
  roleId: "viewer",
  grantedBy: "test",
  grantedAt: new Date().toISOString(),
});

const url = (action: string, op = "apply", rid = ONTOLOGY_RID) =>
  `/api/v2/ontologies/${rid}/actions/${action}/${op}`;

let app: FastifyInstance;
let objects: FakeObjects;
/** Final status of each logged attempt, in order. */
let outcomes: string[];

function recordingLog(): ActionExecutionLog {
  outcomes = [];
  return {
    logStart: (actionApiName, parameters) => ({
      rid: String(outcomes.push("RUNNING") - 1),
      actionApiName,
      parameters,
      status: "RUNNING",
      startedAt: new Date().toISOString(),
    }),
    logComplete: (rid) => void (outcomes[Number(rid)] = "SUCCEEDED"),
    logFailure: (rid) => void (outcomes[Number(rid)] = "FAILED"),
  };
}

async function start(logic: Readonly<Record<string, ActionLogic>> = ACTION_LOGIC) {
  objects = fakeObjects(pestControlRows());
  app = await createServer({
    config: TEST_CONFIG,
    authorizationStore: authz,
    ontology: fakeOntology(),
    objects,
    logic,
    actionLog: recordingLog(),
  });
}

const apply = (action: string, body: unknown, rid = ONTOLOGY_RID) =>
  app.inject({ method: "POST", url: url(action, "apply", rid), payload: body });

beforeEach(() => start());

describe("health", () => {
  it("GET /status/health is HEALTHY", async () => {
    const res = await app.inject({ method: "GET", url: "/status/health" });
    expect(res.statusCode).toBe(200);
  });
});

describe("apply", () => {
  it("commits the whole edit plan in one commit and answers SyncApplyActionResponseV2", async () => {
    const res = await apply("assign-technician", {
      parameters: { jobId: "JOB-1", technicianId: "TECH-2", vehicleId: "VAN-1" },
      options: { returnEdits: "ALL" },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.validation).toEqual({
      result: "VALID",
      submissionCriteria: [],
      parameters: {
        jobId: { result: "VALID", evaluatedConstraints: [], required: true },
        technicianId: { result: "VALID", evaluatedConstraints: [], required: true },
        vehicleId: { result: "VALID", evaluatedConstraints: [], required: false },
      },
    });
    expect(body.edits).toMatchObject({ type: "edits", modifiedObjectsCount: 4, addedObjectCount: 0 });
    expect(objects.commits).toBe(1);
    expect(objects.rows.get("ServiceJob/JOB-1")?.technicianId).toBe("TECH-2");
    expect(objects.rows.get("Technician/TECH-1")?.activeJobCount).toBe(1);
    expect(objects.rows.get("Technician/TECH-2")?.activeJobCount).toBe(1);
    expect(objects.rows.get("Vehicle/VAN-1")?.assignedTechnicianId).toBe("TECH-2");
  });

  it("returns no edits unless asked, as returnEdits defaults to NONE", async () => {
    const res = await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 3 } });
    expect(res.json()).toEqual({ validation: expect.objectContaining({ result: "VALID" }) });
    expect(objects.rows.get("TreatmentProduct/PROD-1")?.stockQty).toBe(8);
  });

  it("adds an object in the same commit as its modifications", async () => {
    const res = await apply("complete-service-job", {
      parameters: { jobId: "JOB-1", treatmentUsed: "gel", technicianNotes: "ok", customerRating: 5 },
      options: { returnEdits: "ALL" },
    });
    expect(res.json().edits).toMatchObject({ addedObjectCount: 1, modifiedObjectsCount: 2 });
    const invoices = [...objects.rows].filter(([k]) => k.startsWith("Invoice/"));
    expect(invoices).toHaveLength(1);
    expect(invoices[0][1]).toMatchObject({ jobId: "JOB-1", amount: 1000, tax: 110, totalAmount: 1110 });
    expect(objects.rows.get("ServiceJob/JOB-1")?.status).toBe("completed");
  });

  it("does not move a technician's count when the job is reassigned to the same technician", async () => {
    await apply("assign-technician", { parameters: { jobId: "JOB-1", technicianId: "TECH-1" } });
    expect(objects.rows.get("Technician/TECH-1")?.activeJobCount).toBe(2);
  });

  it("evaluates without writing in VALIDATE_ONLY mode", async () => {
    const res = await apply("reorder-product", {
      parameters: { productId: "PROD-1", quantity: 3 },
      options: { mode: "VALIDATE_ONLY" },
    });
    expect(res.json()).toEqual({ validation: expect.objectContaining({ result: "VALID" }) });
    expect(objects.commits).toBe(0);
    expect(outcomes).toEqual([]);
  });
});

describe("refusals", () => {
  it("reports a refused action as a failed submission criterion and writes nothing", async () => {
    const res = await apply("complete-service-job", {
      parameters: { jobId: "JOB-DONE", treatmentUsed: "gel", technicianNotes: "again", customerRating: 4 },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().validation.result).toBe("INVALID");
    expect(res.json().validation.submissionCriteria).toEqual([
      { configuredFailureMessage: "Service job JOB-DONE is already completed", result: "INVALID" },
    ]);
    expect(res.json().edits).toBeUndefined();
    expect(objects.commits).toBe(0);
  });

  it("refuses rather than clamps when stock is short", async () => {
    const res = await apply("complete-service-job", {
      parameters: {
        jobId: "JOB-1", treatmentUsed: "gel", technicianNotes: "ok", customerRating: 5,
        productId: "PROD-1", quantityUsed: 9,
      },
    });
    expect(res.json().validation.submissionCriteria[0].configuredFailureMessage).toBe(
      "Only 5 of PROD-1 in stock, 9 requested",
    );
    expect(objects.rows.get("TreatmentProduct/PROD-1")?.stockQty).toBe(5);
  });

  it("marks the invalid parameter and does not run the logic", async () => {
    let ran = false;
    await start({ "reorder-product": async () => ((ran = true), { edits: [] }) });
    const res = await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: "three" } });

    expect(res.statusCode).toBe(200);
    expect(res.json().validation.result).toBe("INVALID");
    expect(res.json().validation.parameters.quantity.result).toBe("INVALID");
    expect(res.json().validation.parameters.productId.result).toBe("VALID");
    expect(ran).toBe(false);
  });

  it("answers ActionTypeNotFound for an action type the ontology in the path does not declare", async () => {
    const res = await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 1 } }, OTHER_ONTOLOGY_RID);
    expect(res.statusCode).toBe(404);
    expect(res.json().errorName).toBe("ActionTypeNotFound");
  });

  it("answers ApplyActionFailed for an action type with no logic instead of reporting success", async () => {
    const res = await apply("no-logic", { parameters: {} });
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ApplyActionFailed");
    expect(objects.commits).toBe(0);
  });

  it("answers ActionEditsReadOnlyEntity when the logic edits a type the action does not declare", async () => {
    await start({
      "reorder-product": async () => ({
        edits: [{ type: "modifyObject", objectType: "Technician", primaryKey: "TECH-1", properties: { name: "x" } }],
      }),
    });
    const res = await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 1 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ActionEditsReadOnlyEntity");
    expect(objects.commits).toBe(0);
  });

  it("answers ApplyActionFailed when the logic sets an undeclared property", async () => {
    await start({
      "reorder-product": async () => ({
        edits: [{ type: "modifyObject", objectType: "TreatmentProduct", primaryKey: "PROD-1", properties: { colour: "red" } }],
      }),
    });
    const res = await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 1 } });
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ApplyActionFailed");
    expect(objects.commits).toBe(0);
  });

  it("logs every attempt, refused and failed included", async () => {
    await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 0 } });
    objects.failNextCommit = true;
    const failed = await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 1 } });
    await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 1 } });

    expect(failed.statusCode).toBe(500);
    expect(outcomes).toEqual(["FAILED", "FAILED", "SUCCEEDED"]);
    expect(objects.rows.get("TreatmentProduct/PROD-1")?.stockQty).toBe(6);
  });
});

describe("concurrent writes", () => {
  const reorder = () => apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 3 } });

  it("plans each edit against the version the logic read", async () => {
    objects.write("TreatmentProduct", "PROD-1", { supplier: "Acme" }); // now version 2
    await reorder();
    expect(objects.plans[0]).toEqual([
      expect.objectContaining({ type: "modifyObject", primaryKey: "PROD-1", expectedVersion: 2 }),
    ]);
  });

  it("reruns the logic on fresh reads when an object changed before the commit", async () => {
    let raced = false;
    objects.beforeCommit = () => {
      if (!raced) objects.write("TreatmentProduct", "PROD-1", { stockQty: 10 });
      raced = true;
    };
    const res = await reorder();

    expect(res.json().validation.result).toBe("VALID");
    expect(objects.plans).toHaveLength(2);
    // 10 + 3 from the rerun, not the 5 + 3 a blind overwrite would leave.
    expect(objects.rows.get("TreatmentProduct/PROD-1")?.stockQty).toBe(13);
    expect(outcomes).toEqual(["SUCCEEDED"]);
  });

  it("gives up with ObjectChanged after five attempts, applying nothing", async () => {
    let stock = 100;
    objects.beforeCommit = () => objects.write("TreatmentProduct", "PROD-1", { stockQty: ++stock });
    const res = await reorder();

    expect(res.statusCode).toBe(409);
    expect(res.json().errorName).toBe("ObjectChanged");
    expect(objects.plans).toHaveLength(5);
    expect(objects.commits).toBe(0);
    expect(outcomes).toEqual(["FAILED"]);
  });
});

describe("non-editable properties", () => {
  const changeJob = (properties: Record<string, unknown>) =>
    start({
      "assign-technician": async () => ({
        edits: [{ type: "modifyObject", objectType: "ServiceJob", primaryKey: "JOB-1", properties }],
      }),
    });

  it("refuses an action that modifies a property declared editable: false", async () => {
    await changeJob({ amountCharged: 1 });
    const res = await apply("assign-technician", { parameters: { jobId: "JOB-1", technicianId: "TECH-2" } });
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ActionEditsReadOnlyEntity");
    expect(res.json().parameters).toMatchObject({ objectType: "ServiceJob", properties: "amountCharged" });
    expect(objects.commits).toBe(0);
    expect(objects.rows.get("ServiceJob/JOB-1")?.amountCharged).toBe(1000);
  });

  it("lets the same action modify the type's editable properties", async () => {
    await changeJob({ status: "on-hold" });
    const res = await apply("assign-technician", { parameters: { jobId: "JOB-1", technicianId: "TECH-2" } });
    expect(res.json().validation.result).toBe("VALID");
    expect(objects.rows.get("ServiceJob/JOB-1")?.status).toBe("on-hold");
  });
});

describe("idempotency and read-only objects", () => {
  const complete = (key?: string) =>
    app.inject({
      method: "POST",
      url: url("complete-service-job", "apply"),
      headers: key === undefined ? {} : { "idempotency-key": key },
      payload: {
        parameters: { jobId: "JOB-1", treatmentUsed: "gel", technicianNotes: "ok", customerRating: 5 },
        options: { returnEdits: "ALL" },
      },
    });
  const invoices = () => [...objects.rows.keys()].filter((k) => k.startsWith("Invoice/"));

  it("commits a repeated Idempotency-Key once and answers the repeat with the first result", async () => {
    const first = await complete("call-1");
    // Re-evaluated now, the job is already completed and the logic would refuse.
    const again = await complete("call-1");
    expect(first.json().validation.result).toBe("VALID");
    expect(again.json().validation.result).toBe("VALID");
    expect(again.json().edits).toEqual(first.json().edits);
    expect(objects.commits).toBe(1);
    expect(invoices()).toHaveLength(1);
    expect(objects.commitOptions[0]).toMatchObject({ idempotencyKey: "call-1", actionType: "complete-service-job" });
  });

  it("does not deduplicate calls without a key", async () => {
    await complete();
    const again = await complete();
    expect(again.json().validation.result).toBe("INVALID");
    expect(objects.commits).toBe(1);
  });

  it("refuses an empty Idempotency-Key", async () => {
    const res = await complete("");
    expect(res.statusCode).toBe(400);
    expect(objects.commits).toBe(0);
  });

  it("sends objects the logic read but did not write to the commit", async () => {
    await start({
      "reorder-product": async (_params, ctx) => {
        await ctx.get("Technician", "TECH-1"); // read, not written
        const product = await ctx.get("TreatmentProduct", "PROD-1");
        return {
          edits: [{
            type: "modifyObject", objectType: "TreatmentProduct", primaryKey: "PROD-1",
            properties: { stockQty: Number(product?.stockQty) + 1 },
          }],
        };
      },
    });
    await apply("reorder-product", { parameters: { productId: "PROD-1", quantity: 1 } });
    expect(objects.commitOptions[0].reads).toEqual([{ objectType: "Technician", primaryKey: "TECH-1", version: 1 }]);
  });
});

describe("applyBatch", () => {
  const batch = (requests: unknown[], returnEdits?: string) =>
    app.inject({
      method: "POST",
      url: url("reorder-product", "applyBatch"),
      payload: { requests, ...(returnEdits ? { options: { returnEdits } } : {}) },
    });

  it("commits every request as one plan", async () => {
    const res = await batch(
      [{ parameters: { productId: "PROD-1", quantity: 1 } }, { parameters: { productId: "PROD-1", quantity: 2, supplier: "B" } }],
      "ALL",
    );
    expect(res.statusCode).toBe(200);
    expect(res.json().edits.modifiedObjectsCount).toBe(2);
    expect(objects.commits).toBe(1);
  });

  it("answers BatchApplyActionResponseV2 with no edits unless asked", async () => {
    const res = await batch([{ parameters: { productId: "PROD-1", quantity: 1 } }]);
    expect(res.json()).toEqual({});
  });

  it("applies nothing when any request is invalid", async () => {
    const res = await batch([
      { parameters: { productId: "PROD-1", quantity: 1 } },
      { parameters: { productId: "PROD-1", quantity: 0 } },
    ]);
    expect(res.statusCode).toBe(400);
    expect(res.json().errorName).toBe("ActionValidationFailed");
    expect(objects.commits).toBe(0);
  });
});

describe("routes Foundry v2 does not have", () => {
  it.each(["validate", "executions"])("does not serve %s", async (op) => {
    const res = await app.inject({ method: op === "validate" ? "POST" : "GET", url: url("reorder-product", op) });
    expect(res.statusCode).toBe(404);
  });
});

describe("permissions", () => {
  beforeEach(() => setEnforcePermissions(true));
  afterEach(() => setEnforcePermissions(false));

  const body = { parameters: { productId: "PROD-1", quantity: 1 } };

  it("lets a platform administrator apply", async () => {
    const res = await app.inject({
      method: "POST",
      url: url("reorder-product"),
      headers: { "x-user-id": "admin", "x-user-platform-admin": "true" },
      payload: body,
    });
    expect(res.statusCode).toBe(200);
  });

  it("denies a viewer, since apply needs actions:execute", async () => {
    const res = await app.inject({
      method: "POST",
      url: url("reorder-product"),
      headers: { "x-user-id": "test-viewer" },
      payload: body,
    });
    expect(res.statusCode).toBe(403);
  });

  it("denies a request with no identity", async () => {
    const res = await app.inject({ method: "POST", url: url("reorder-product"), payload: body });
    expect(res.statusCode).toBe(403);
  });
});

describe("error envelope", () => {
  it("reports Foundry's BadRequestError code, INVALID_ARGUMENT", async () => {
    const res = await apply("no-logic", { parameters: {} });
    expect(res.json()).toMatchObject({
      errorCode: "INVALID_ARGUMENT",
      errorName: "ApplyActionFailed",
      parameters: { actionType: "no-logic" },
    });
  });
});
