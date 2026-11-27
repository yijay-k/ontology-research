import type { FastifyInstance } from "fastify";
import { invalidArgument, rejectUnsupportedOntologyScoping } from "@openfoundry/errors";
import { requirePermission } from "@openfoundry/permissions";
import type { ActionExecutionLog } from "../../store/action-log.js";
import {
  applyAction,
  applyActionBatch,
  evaluate,
  requireActionType,
  toObjectEdits,
  type ActionDeps,
  type ObjectEditsResult,
} from "../../apply.js";
import type { ObjectEdit } from "../../clients.js";

type ApplyMode = "VALIDATE_ONLY" | "VALIDATE_AND_EXECUTE";
type ReturnEditsMode = "ALL" | "ALL_V2_WITH_DELETIONS" | "NONE";

interface ScopingQuery {
  branch?: string;
  scenarioRid?: string;
  transactionId?: string;
}

/** `ReturnEditsMode`: `ALL` omits deletions, `ALL_V2_WITH_DELETIONS` keeps them, `NONE` (the default) returns nothing. */
function editsFor(mode: string | undefined, edits: ObjectEdit[]): ObjectEditsResult | undefined {
  if (mode === "ALL_V2_WITH_DELETIONS") return toObjectEdits(edits);
  if (mode === "ALL") return toObjectEdits(edits.filter((e) => e.type !== "deleteObject"));
  return undefined;
}

/**
 * Foundry's v2 action endpoints (`foundry_sdk/v2/ontologies/action.py`).
 *
 * Validation is not a separate route in v2: `apply` with
 * `options.mode = VALIDATE_ONLY` evaluates without applying. A request whose
 * validation is INVALID still answers 200 - Foundry's documented contract is
 * that the body's `validation`, not the status, says whether it applied.
 */
export async function actionRoutes(
  app: FastifyInstance,
  deps: ActionDeps & { log: ActionExecutionLog },
): Promise<void> {
  app.post<{
    Params: { ontologyRid: string; actionApiName: string };
    Querystring: ScopingQuery;
    Body: {
      parameters?: Record<string, unknown>;
      options?: { mode?: ApplyMode; returnEdits?: ReturnEditsMode };
    };
  }>(
    "/ontologies/:ontologyRid/actions/:actionApiName/apply",
    { preHandler: requirePermission("actions:execute") },
    async (request) => {
      rejectUnsupportedOntologyScoping(request.query);
      const { ontologyRid, actionApiName } = request.params;
      const parameters = request.body?.parameters ?? {};
      const options = request.body?.options ?? {};
      const actionType = await requireActionType(deps, ontologyRid, actionApiName);

      if (options.mode === "VALIDATE_ONLY") {
        const { validation } = await evaluate(deps, ontologyRid, actionType, parameters);
        return { validation };
      }

      const { validation, edits } = await applyAction(deps, deps.log, ontologyRid, actionType, parameters);
      const result = edits ? editsFor(options.returnEdits, edits) : undefined;
      return { validation, ...(result ? { edits: result } : {}) };
    },
  );

  app.post<{
    Params: { ontologyRid: string; actionApiName: string };
    Querystring: ScopingQuery;
    Body: {
      requests?: Array<{ parameters?: Record<string, unknown> }>;
      options?: { returnEdits?: "ALL" | "NONE" };
    };
  }>(
    "/ontologies/:ontologyRid/actions/:actionApiName/applyBatch",
    { preHandler: requirePermission("actions:execute") },
    async (request) => {
      rejectUnsupportedOntologyScoping(request.query);
      const { ontologyRid, actionApiName } = request.params;
      const requests = request.body?.requests;
      if (!Array.isArray(requests)) throw invalidArgument("requests", "must be an array");
      const actionType = await requireActionType(deps, ontologyRid, actionApiName);

      const edits = await applyActionBatch(
        deps,
        deps.log,
        ontologyRid,
        actionType,
        requests.map((r) => r?.parameters ?? {}),
      );
      // `BatchApplyActionResponseV2`: only `edits`, and only when asked for.
      return request.body?.options?.returnEdits === "ALL" ? { edits: toObjectEdits(edits) } : {};
    },
  );
}
