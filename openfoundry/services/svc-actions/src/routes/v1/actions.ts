import type { FastifyInstance } from "fastify";
import { invalidArgument } from "@openfoundry/errors";
import { requirePermission } from "@openfoundry/permissions";
import type { ActionExecutionLog } from "../../store/action-log.js";
import {
  actionValidationFailed,
  applyAction,
  applyActionBatch,
  evaluate,
  requireActionType,
  type ActionDeps,
} from "../../apply.js";

/**
 * Foundry's v1 action endpoints (`foundry_sdk/v1/ontologies/action.py`).
 *
 * Every response model differs from v2: `ApplyActionResponse` and
 * `BatchApplyActionResponse` declare no fields, so a v1 apply answers `{}` and
 * reports an invalid request as `ActionValidationFailed` instead of in the
 * body, and validation is its own route answering `ValidateActionResponse`,
 * which has the same three fields as v2's `ValidateActionResponseV2`.
 */
export async function actionRoutesV1(
  app: FastifyInstance,
  deps: ActionDeps & { log: ActionExecutionLog },
): Promise<void> {
  app.post<{
    Params: { ontologyRid: string; actionType: string };
    Body: { parameters?: Record<string, unknown> };
  }>("/ontologies/:ontologyRid/actions/:actionType/apply", {
    preHandler: requirePermission("actions:execute"),
  }, async (request) => {
    const { ontologyRid, actionType } = request.params;
    const definition = await requireActionType(deps, ontologyRid, actionType);
    const { edits } = await applyAction(
      deps,
      deps.log,
      ontologyRid,
      definition,
      request.body?.parameters ?? {},
    );
    if (!edits) actionValidationFailed(actionType);
    return {};
  });

  app.post<{
    Params: { ontologyRid: string; actionType: string };
    Body: { requests?: Array<{ parameters?: Record<string, unknown> }> };
  }>("/ontologies/:ontologyRid/actions/:actionType/applyBatch", {
    preHandler: requirePermission("actions:execute"),
  }, async (request) => {
    const { ontologyRid, actionType } = request.params;
    const requests = request.body?.requests;
    if (!Array.isArray(requests)) throw invalidArgument("requests", "must be an array");
    const definition = await requireActionType(deps, ontologyRid, actionType);
    await applyActionBatch(
      deps,
      deps.log,
      ontologyRid,
      definition,
      requests.map((r) => r?.parameters ?? {}),
    );
    return {};
  });

  app.post<{
    Params: { ontologyRid: string; actionType: string };
    Body: { parameters?: Record<string, unknown> };
  }>("/ontologies/:ontologyRid/actions/:actionType/validate", {
    preHandler: requirePermission("actions:read"),
  }, async (request) => {
    const { ontologyRid, actionType } = request.params;
    const definition = await requireActionType(deps, ontologyRid, actionType);
    const { validation } = await evaluate(deps, ontologyRid, definition, request.body?.parameters ?? {});
    return validation;
  });
}
