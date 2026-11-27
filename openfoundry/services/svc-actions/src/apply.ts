import type {
  ActionTypeDefinition,
  ObjectTypeDefinition,
} from "@openfoundry/ontology-schema";
import { ErrorCode, OpenFoundryApiError, notFound, safeArg } from "@openfoundry/errors";
import type { ObjectEdit, ObjectsGateway, OntologySource } from "./clients.js";
import type { ActionLogic } from "./logic.js";
import type { ActionExecutionLog } from "./store/action-log.js";
import { validateActionParameters } from "./validation.js";

// Wire shapes below are Foundry's, from `foundry_sdk/v2/ontologies/models.py`.

type ValidationResult = "VALID" | "INVALID";

export interface ValidateActionResponseV2 {
  result: ValidationResult;
  submissionCriteria: Array<{ configuredFailureMessage?: string; result: ValidationResult }>;
  parameters: Record<
    string,
    { result: ValidationResult; evaluatedConstraints: never[]; required: boolean }
  >;
}

/** `ObjectEdits`: what an applied action changed, by object type and key. */
export type ObjectEditsResult = {
  type: "edits";
  edits: Array<{ type: ObjectEdit["type"]; objectType: string; primaryKey: string }>;
  addedObjectCount: number;
  modifiedObjectsCount: number;
  deletedObjectsCount: number;
  addedLinksCount: number;
  deletedLinksCount: number;
};

export interface ActionDeps {
  ontology: OntologySource;
  objects: ObjectsGateway;
  logic: Readonly<Record<string, ActionLogic>>;
}

export interface Evaluation {
  validation: ValidateActionResponseV2;
  /** The edit plan; present only when the validation is VALID. */
  edits?: ObjectEdit[];
}

/** A Foundry `BadRequestError`: `INVALID_ARGUMENT`, 400, naming the action type. */
function badRequest(errorName: string, message: string, actionType: string): OpenFoundryApiError {
  return new OpenFoundryApiError({
    errorCode: ErrorCode.INVALID_ARGUMENT,
    errorName,
    message,
    args: [safeArg("actionType", actionType)],
  });
}

/** `ApplyActionFailed`: the action could not be applied, through no fault of its parameters. */
function applyActionFailed(actionType: string, reason: string): never {
  throw badRequest("ApplyActionFailed", reason, actionType);
}

/** Load the action type from the ontology in the request path, or 404 `ActionTypeNotFound`. */
export async function requireActionType(
  deps: ActionDeps,
  ontologyRid: string,
  apiName: string,
): Promise<ActionTypeDefinition> {
  const actionType = await deps.ontology.getActionType(ontologyRid, apiName);
  if (!actionType) throw notFound("ActionType", apiName);
  return actionType;
}

/**
 * Validate the parameters, run the logic, and check its edit plan against the
 * ontology. Nothing is written: the logic only reads.
 */
export async function evaluate(
  deps: ActionDeps,
  ontologyRid: string,
  actionType: ActionTypeDefinition,
  params: Record<string, unknown>,
): Promise<Evaluation> {
  const checked = validateActionParameters(params, actionType);
  const failed = new Set(checked.errors.map((e) => e.parameter));
  const parameters: ValidateActionResponseV2["parameters"] = {};
  for (const [id, def] of Object.entries(actionType.parameters ?? {})) {
    parameters[id] = {
      result: failed.has(id) ? "INVALID" : "VALID",
      evaluatedConstraints: [],
      required: def.required,
    };
  }
  if (!checked.valid) {
    return { validation: { result: "INVALID", submissionCriteria: [], parameters } };
  }

  const logic = Object.hasOwn(deps.logic, actionType.apiName)
    ? deps.logic[actionType.apiName]
    : undefined;
  if (!logic) {
    applyActionFailed(actionType.apiName, `Action type ${actionType.apiName} has no logic to apply`);
  }

  // Record the version of every object the logic reads, so its edits can be
  // refused at commit if any of those objects changed in between (Foundry
  // OSv2 checks the versions of objects used to generate edits).
  const versions = new Map<string, number>();
  const outcome = await logic(params, {
    get: async (objectType, primaryKey) => {
      const object = await deps.objects.getObject(ontologyRid, objectType, primaryKey);
      if (object) versions.set(`${objectType}/${primaryKey}`, object.version);
      return object?.properties;
    },
  });
  if ("refusal" in outcome) {
    return {
      validation: {
        result: "INVALID",
        submissionCriteria: [{ configuredFailureMessage: outcome.refusal, result: "INVALID" }],
        parameters,
      },
    };
  }

  await checkEdits(deps, ontologyRid, actionType, outcome.edits);
  return {
    validation: { result: "VALID", submissionCriteria: [], parameters },
    edits: withExpectedVersions(outcome.edits, versions),
  };
}

/**
 * Hold the plan to the ontology before anything is committed: every edited
 * object type must be declared in this ontology and listed in the action
 * type's `modifiedEntities` for that kind of edit, and every property must be
 * declared on the type. A failure here is a bug in the logic, not the caller's.
 */
async function checkEdits(
  deps: ActionDeps,
  ontologyRid: string,
  actionType: ActionTypeDefinition,
  edits: ObjectEdit[],
): Promise<void> {
  const types = new Map<string, ObjectTypeDefinition | undefined>();
  for (const edit of edits) {
    if (!types.has(edit.objectType)) {
      types.set(edit.objectType, await deps.ontology.getObjectType(ontologyRid, edit.objectType));
    }
    const objectType = types.get(edit.objectType);
    const where = `${edit.type} ${edit.objectType}/${edit.primaryKey}`;
    if (!objectType) {
      applyActionFailed(actionType.apiName, `${where}: object type is not declared in this ontology`);
    }

    const allowed = actionType.modifiedEntities?.[edit.objectType];
    if (!(edit.type === "addObject" ? allowed?.created : allowed?.modified)) {
      // `ActionEditsReadOnlyEntity`: the action edits a type it does not declare.
      throw badRequest(
        "ActionEditsReadOnlyEntity",
        `${where}: the action type does not declare this edit in modifiedEntities`,
        actionType.apiName,
      );
    }

    if (edit.type === "deleteObject") continue;
    const unknown = Object.keys(edit.properties).filter(
      (key) => !Object.hasOwn(objectType.properties ?? {}, key),
    );
    if (unknown.length > 0) {
      applyActionFailed(actionType.apiName, `${where}: undeclared properties ${unknown.join(", ")}`);
    }
    if (edit.type === "addObject") {
      // Seeds name the key `primaryKey`; the schema type names it `primaryKeyApiName`.
      const keyProperty =
        objectType.primaryKeyApiName ?? (objectType as { primaryKey?: string }).primaryKey;
      if (keyProperty && edit.properties[keyProperty] !== edit.primaryKey) {
        applyActionFailed(actionType.apiName, `${where}: ${keyProperty} must equal the primary key`);
      }
    }
  }
}

/**
 * Stamp the read version on the first edit to each object that was read. Only
 * the first: the store checks it against the version before the plan runs.
 */
function withExpectedVersions(edits: ObjectEdit[], versions: Map<string, number>): ObjectEdit[] {
  const stamped = new Set<string>();
  return edits.map((edit) => {
    const key = `${edit.objectType}/${edit.primaryKey}`;
    const version = versions.get(key);
    if (edit.type === "addObject" || version === undefined || stamped.has(key)) return edit;
    stamped.add(key);
    return { ...edit, expectedVersion: version };
  });
}

/** Foundry's `ObjectEdits` summary of a committed plan. */
export function toObjectEdits(edits: ObjectEdit[]): ObjectEditsResult {
  const countOf = (type: ObjectEdit["type"]) => edits.filter((e) => e.type === type).length;
  return {
    type: "edits",
    edits: edits.map(({ type, objectType, primaryKey }) => ({ type, objectType, primaryKey })),
    addedObjectCount: countOf("addObject"),
    modifiedObjectsCount: countOf("modifyObject"),
    deletedObjectsCount: countOf("deleteObject"),
    addedLinksCount: 0,
    deletedLinksCount: 0,
  };
}

/** `ActionValidationFailed`, Foundry's error for an apply whose validation is INVALID. */
export function actionValidationFailed(actionType: string): never {
  throw badRequest(
    "ActionValidationFailed",
    "The validation failed for the given action parameters. Please use the `validateAction` endpoint for more details.",
    actionType,
  );
}

function describeRefusal(validation: ValidateActionResponseV2): string {
  const criteria = validation.submissionCriteria
    .map((c) => c.configuredFailureMessage)
    .filter(Boolean);
  if (criteria.length > 0) return criteria.join("; ");
  const parameters = Object.entries(validation.parameters)
    .filter(([, p]) => p.result === "INVALID")
    .map(([id]) => id);
  return `invalid parameters: ${parameters.join(", ") || "unknown parameter supplied"}`;
}

/**
 * Foundry's action retry rule: up to 5 attempts on a transient conflict, for
 * actions that make no external calls - which action logic here never does.
 */
const MAX_ATTEMPTS = 5;

const isObjectChanged = (err: unknown) =>
  err instanceof OpenFoundryApiError && err.errorName === "ObjectChanged";

/**
 * Evaluate and, when valid, commit one action, logging the attempt whatever
 * its outcome: applied, refused, or failed. When an object the logic read
 * changed before the commit, the whole evaluation is rerun on fresh reads.
 *
 * This is snapshot-style conflict detection on the objects an action reads
 * and writes; like Foundry's snapshot isolation it does not stop write skew
 * across objects the action only reads.
 */
export async function applyAction(
  deps: ActionDeps,
  log: ActionExecutionLog,
  ontologyRid: string,
  actionType: ActionTypeDefinition,
  params: Record<string, unknown>,
): Promise<Evaluation> {
  const execution = await log.logStart(actionType.apiName, params);
  try {
    for (let attempt = 1; ; attempt++) {
      const evaluation = await evaluate(deps, ontologyRid, actionType, params);
      if (!evaluation.edits) {
        await log.logFailure(execution.rid, describeRefusal(evaluation.validation));
        return evaluation;
      }
      try {
        await deps.objects.applyEdits(ontologyRid, evaluation.edits);
      } catch (err) {
        if (isObjectChanged(err) && attempt < MAX_ATTEMPTS) continue;
        throw err;
      }
      await log.logComplete(execution.rid, toObjectEdits(evaluation.edits));
      return evaluation;
    }
  } catch (err) {
    await log.logFailure(execution.rid, err instanceof Error ? err.message : String(err));
    throw err;
  }
}

/**
 * Apply a batch as one commit: every request is evaluated first, and if any is
 * invalid nothing is applied. Like Foundry's batched write mode, each request's
 * logic reads the state before the batch, not its predecessors' edits.
 */
export async function applyActionBatch(
  deps: ActionDeps,
  log: ActionExecutionLog,
  ontologyRid: string,
  actionType: ActionTypeDefinition,
  paramSets: Array<Record<string, unknown>>,
): Promise<ObjectEdit[]> {
  const evaluations: Evaluation[] = [];
  for (const params of paramSets) {
    evaluations.push(await evaluate(deps, ontologyRid, actionType, params));
  }

  const executions = await Promise.all(
    paramSets.map((params) => log.logStart(actionType.apiName, params)),
  );
  const invalid = evaluations.find((e) => !e.edits);
  if (invalid) {
    const reason = `batch refused: ${describeRefusal(invalid.validation)}`;
    await Promise.all(executions.map((e) => log.logFailure(e.rid, reason)));
    actionValidationFailed(actionType.apiName);
  }

  const edits = evaluations.flatMap((e) => e.edits ?? []);
  try {
    await deps.objects.applyEdits(ontologyRid, edits);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await Promise.all(executions.map((e) => log.logFailure(e.rid, message)));
    throw err;
  }
  await Promise.all(
    executions.map((e, i) => log.logComplete(e.rid, toObjectEdits(evaluations[i].edits ?? []))),
  );
  return edits;
}
