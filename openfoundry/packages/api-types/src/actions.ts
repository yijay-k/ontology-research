/**
 * Types for the Action Service API.
 * Derived from conjure/action-service.yml, which follows Foundry's v2 action
 * models (`foundry_sdk/v2/ontologies/models.py`).
 */

export type ValidationResultValue = "VALID" | "INVALID";

export type ApplyActionMode = "VALIDATE_ONLY" | "VALIDATE_AND_EXECUTE";
export type ReturnEditsMode = "ALL" | "ALL_V2_WITH_DELETIONS" | "NONE";

// ---------------------------------------------------------------------------
// Apply
// ---------------------------------------------------------------------------

/** `ApplyActionRequestV2` */
export interface ActionApplyRequest {
  parameters: Record<string, unknown>;
  options?: { mode?: ApplyActionMode; returnEdits?: ReturnEditsMode };
}

/** `SubmissionCriteriaEvaluation` */
export interface SubmissionCriteriaEvaluation {
  configuredFailureMessage?: string;
  result: ValidationResultValue;
}

/** `ParameterEvaluationResult` */
export interface ParameterEvaluationResult {
  result: ValidationResultValue;
  evaluatedConstraints: unknown[];
  required: boolean;
}

/** `ValidateActionResponseV2` */
export interface ValidationResult {
  result: ValidationResultValue;
  submissionCriteria: SubmissionCriteriaEvaluation[];
  parameters: Record<string, ParameterEvaluationResult>;
}

/** `ObjectEdit` */
export interface ObjectEdit {
  type: "addObject" | "modifyObject" | "deleteObject" | "addLink" | "deleteLink";
  objectType: string;
  primaryKey: string;
}

/** `ObjectEdits` */
export interface ObjectEdits {
  type: "edits";
  edits: ObjectEdit[];
  addedObjectCount: number;
  modifiedObjectsCount: number;
  deletedObjectsCount: number;
  addedLinksCount: number;
  deletedLinksCount: number;
}

/** `SyncApplyActionResponseV2`: `validation` says whether the action was applied. */
export interface ActionApplyResponse {
  validation?: ValidationResult;
  edits?: ObjectEdits;
}

// ---------------------------------------------------------------------------
// Batch apply
// ---------------------------------------------------------------------------

export interface BatchApplyRequestItem {
  parameters: Record<string, unknown>;
}

/** `BatchApplyActionRequestV2` */
export interface BatchApplyRequest {
  requests: BatchApplyRequestItem[];
  options?: { returnEdits?: "ALL" | "NONE" };
}

/** `BatchApplyActionResponseV2` */
export interface BatchApplyResponse {
  edits?: ObjectEdits;
}
