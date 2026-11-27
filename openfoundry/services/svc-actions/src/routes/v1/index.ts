import type { FastifyInstance } from "fastify";
import type { ActionExecutionLog } from "../../store/action-log.js";
import type { ActionDeps } from "../../apply.js";
import { actionRoutesV1 } from "./actions.js";

/** The `/api/v1` action surface; see `actions.ts` for how it differs from v2. */
export async function v1Routes(
  app: FastifyInstance,
  opts: ActionDeps & { log: ActionExecutionLog },
): Promise<void> {
  // Rebuilt rather than passed through: `opts` still carries this plugin's own
  // `prefix`, which would otherwise be applied a second time.
  await app.register(actionRoutesV1, {
    ontology: opts.ontology,
    objects: opts.objects,
    logic: opts.logic,
    log: opts.log,
  });
}
