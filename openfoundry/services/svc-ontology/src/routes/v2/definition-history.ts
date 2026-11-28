/**
 * Definition history - openfoundry extension, not a Foundry endpoint:
 *   GET /ontologies/:ontologyRid/definitionHistory?kind=&apiName=
 *   GET /ontologies/:ontologyRid/definitionHistory/:version
 */
import type { FastifyInstance } from "fastify";
import { invalidArgument, notFound } from "@openfoundry/errors";
import { requirePermission } from "@openfoundry/permissions";
import type { DefinitionHistory, DefinitionKind } from "../../definition-history.js";
import type { ActionTypeDefinition, LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import type { OntologyStore } from "../../store/ontology-store.js";
import { lintOntology } from "../../lint.js";

const listOf = <T>(v: unknown): T[] => (Array.isArray(v) ? v : ((v as { items?: T[] })?.items ?? [])) as T[];

const KINDS = new Set<DefinitionKind>(["objectType", "actionType", "linkType"]);

export async function definitionHistoryRoutes(
  app: FastifyInstance,
  opts: { history: DefinitionHistory; store: OntologyStore },
): Promise<void> {
  // Modelling lint (openfoundry extension): warnings, never refusals.
  app.get<{ Params: { ontologyRid: string } }>(
    "/ontologies/:ontologyRid/lint",
    { preHandler: requirePermission("ontology:read") },
    async (request) => {
      const rid = request.params.ontologyRid;
      const [objectTypes, actionTypes, linkTypes] = await Promise.all([
        Promise.resolve(opts.store.listObjectTypes(rid)),
        Promise.resolve(opts.store.listActionTypes(rid)),
        Promise.resolve(opts.store.listLinkTypes(rid)),
      ]);
      return {
        warnings: lintOntology(
          listOf<ObjectTypeDefinition>(objectTypes),
          listOf<ActionTypeDefinition>(actionTypes),
          listOf<LinkTypeDefinition>(linkTypes),
        ),
      };
    },
  );

  app.get<{ Params: { ontologyRid: string }; Querystring: { kind?: string; apiName?: string } }>(
    "/ontologies/:ontologyRid/definitionHistory",
    { preHandler: requirePermission("ontology:read") },
    async (request) => {
      const { kind, apiName } = request.query;
      if (kind !== undefined && !KINDS.has(kind as DefinitionKind)) {
        throw invalidArgument("kind", "must be objectType, actionType or linkType");
      }
      return { data: await opts.history.list(request.params.ontologyRid, { kind: kind as DefinitionKind | undefined, apiName }) };
    },
  );

  app.get<{ Params: { ontologyRid: string; version: string } }>(
    "/ontologies/:ontologyRid/definitionHistory/:version",
    { preHandler: requirePermission("ontology:read") },
    async (request) => {
      const version = Number(request.params.version);
      if (!Number.isInteger(version) || version < 1) throw invalidArgument("version", "must be a positive integer");
      const entry = await opts.history.get(request.params.ontologyRid, version);
      if (!entry) throw notFound("DefinitionVersion", request.params.version);
      return entry;
    },
  );
}
