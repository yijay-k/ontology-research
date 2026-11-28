/**
 * Proposals staged by actions that require approval:
 * `/api/v2/ontologies/:ontologyRid/proposals`. Not Foundry endpoints - an
 * openfoundry extension, routed here by the gateway.
 */
import type { FastifyInstance } from "fastify";
import { invalidArgument, notFound, rejectUnsupportedOntologyScoping } from "@openfoundry/errors";
import { identityFromHeaders, requirePermission } from "@openfoundry/permissions";
import { approveProposal, rejectProposal, type ActionDeps } from "../../apply.js";
import type { ProposalStatus } from "../../store/proposals.js";

const STATUSES = new Set<ProposalStatus>(["PENDING", "APPROVED", "REJECTED", "STALE"]);

export async function proposalRoutes(app: FastifyInstance, deps: ActionDeps): Promise<void> {
  const store = () => {
    if (!deps.proposals) throw notFound("ProposalStore", "none configured");
    return deps.proposals;
  };
  const actor = (headers: Record<string, string | string[] | undefined>) => identityFromHeaders(headers)?.userId;

  app.get<{ Params: { ontologyRid: string }; Querystring: { status?: string; branch?: string } }>(
    "/ontologies/:ontologyRid/proposals",
    { preHandler: requirePermission("actions:read") },
    async (request) => {
      rejectUnsupportedOntologyScoping(request.query);
      const status = request.query.status?.toUpperCase();
      if (status !== undefined && !STATUSES.has(status as ProposalStatus)) {
        throw invalidArgument("status", "must be PENDING, APPROVED, REJECTED or STALE");
      }
      return { data: await store().list(request.params.ontologyRid, status as ProposalStatus | undefined) };
    },
  );

  app.get<{ Params: { ontologyRid: string; proposalRid: string } }>(
    "/ontologies/:ontologyRid/proposals/:proposalRid",
    { preHandler: requirePermission("actions:read") },
    async (request) => {
      const proposal = await store().get(request.params.ontologyRid, request.params.proposalRid);
      if (!proposal) throw notFound("Proposal", request.params.proposalRid);
      return proposal;
    },
  );

  app.post<{ Params: { ontologyRid: string; proposalRid: string } }>(
    "/ontologies/:ontologyRid/proposals/:proposalRid/approve",
    { preHandler: requirePermission("actions:approve") },
    async (request) => approveProposal(deps, request.params.ontologyRid, request.params.proposalRid, actor(request.headers)),
  );

  app.post<{ Params: { ontologyRid: string; proposalRid: string }; Body: { reason?: unknown } }>(
    "/ontologies/:ontologyRid/proposals/:proposalRid/reject",
    { preHandler: requirePermission("actions:approve") },
    async (request) => {
      const reason = request.body?.reason;
      if (reason !== undefined && typeof reason !== "string") throw invalidArgument("reason", "must be a string");
      return rejectProposal(deps, request.params.ontologyRid, request.params.proposalRid, actor(request.headers), reason);
    },
  );
}
