import type { FastifyInstance } from "fastify";
import {
  parseMigrationSteps,
  validateDatasources,
  validateMetrics,
  type MigrationStep,
  type ObjectTypeDefinition,
} from "@openfoundry/ontology-schema";
import { generateRid } from "@openfoundry/rid";
import type { OntologyStore } from "../../store/ontology-store.js";
import { requirePermission } from "@openfoundry/permissions";
import { OpenFoundryApiError, invalidArgument, rejectUnsupportedOntologyScoping } from "@openfoundry/errors";
import { paginateArray } from "./pagination-helpers.js";
import { assertDeleteAllowed, assertUpdateAllowed, statusOf } from "./object-type-evolution.js";
import { parseBooleanParam } from "./query-params.js";

/**
 * Emits `datasources` exactly when the caller opted in with
 * `includeDatasources=true`, as Foundry does: an object type with none answers
 * an empty list, and without the flag the field is left out entirely.
 */
function withDatasources(
  objectType: ObjectTypeDefinition,
  includeDatasources: boolean | undefined,
): ObjectTypeDefinition {
  const { datasources, ...rest } = objectType;
  return includeDatasources === true ? { ...rest, datasources: datasources ?? [] } : rest;
}

/**
 * Validate an incoming definition's datasources, give each a RID, and store
 * its status in canonical form (EXPERIMENTAL when none is given).
 */
function normalize(def: ObjectTypeDefinition): ObjectTypeDefinition {
  const errors = validateDatasources(def);
  if (errors.length > 0) {
    throw invalidArgument("datasources", errors.map((e) => `${e.field} ${e.message}`).join("; "));
  }
  const metricErrors = validateMetrics(def as Parameters<typeof validateMetrics>[0]);
  if (metricErrors.length > 0) {
    throw invalidArgument("metrics", metricErrors.map((e) => `${e.field} ${e.message}`).join("; "));
  }
  const status = statusOf(def);
  // Seeds and older clients name the key `primaryKey`; the stores read
  // `primaryKeyApiName`, and the Postgres one defaults a missing name to "id".
  const alias = (def as { primaryKey?: unknown }).primaryKey;
  if (def.primaryKeyApiName === undefined && typeof alias === "string") {
    def = { ...def, primaryKeyApiName: alias };
  }
  if (!def.datasources) return { ...def, status };
  return {
    ...def,
    status,
    datasources: def.datasources.map((source) => ({
      ...source,
      rid: source.rid || generateRid("ontology", "datasource").toString(),
    })),
  };
}

/** Where a schema migration's data half runs: svc-objects. */
export interface ObjectMigrator {
  migrate(ontologyRid: string, objectType: string, steps: MigrationStep[], dryRun: boolean): Promise<{ objects: number; changed: number }>;
}

export function httpObjectMigrator(objectsServiceUrl: string): ObjectMigrator {
  return {
    async migrate(rid, objectType, steps, dryRun) {
      const url = `${objectsServiceUrl}/internal/ontologies/${encodeURIComponent(rid)}/objectTypes/${encodeURIComponent(objectType)}/migrate`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, dryRun }),
        signal: AbortSignal.timeout(120_000),
      });
      const body = await res.json().catch(() => undefined);
      if (!res.ok) throw OpenFoundryApiError.fromResponse({ status: res.status, body: body as never });
      return body as { objects: number; changed: number };
    },
  };
}

export async function objectTypeRoutes(
  app: FastifyInstance,
  opts: { store: OntologyStore; migrator?: ObjectMigrator },
): Promise<void> {
  const { store } = opts;

  // List object types
  app.get<{
    Params: { ontologyRid: string };
    Querystring: {
      pageSize?: string;
      pageToken?: string;
      includeDatasources?: string;
      branch?: string;
    };
  }>("/ontologies/:ontologyRid/objectTypes", {
    preHandler: requirePermission("ontology:read"),
  }, async (request) => {
    rejectUnsupportedOntologyScoping(request.query);
    const includeDatasources = parseBooleanParam(
      "includeDatasources",
      request.query.includeDatasources,
    );
    const raw = await store.listObjectTypes(request.params.ontologyRid);
    const all = Array.isArray(raw) ? raw : (raw as { items: ObjectTypeDefinition[] }).items ?? [];
    const page = paginateArray(all, request.query);
    return {
      ...page,
      data: page.data.map((ot) => withDatasources(ot as ObjectTypeDefinition, includeDatasources)),
    };
  });

  // Create object type
  app.post<{
    Params: { ontologyRid: string };
    Body: ObjectTypeDefinition;
  }>("/ontologies/:ontologyRid/objectTypes", {
    preHandler: requirePermission("ontology:write"),
  }, async (request, reply) => {
    const objectType = await store.createObjectType(
      request.params.ontologyRid,
      normalize(request.body),
    );
    reply.status(201);
    return withDatasources(objectType, false);
  });

  // Get object type by apiName
  app.get<{
    Params: { ontologyRid: string; objectTypeApiName: string };
    Querystring: { includeDatasources?: string; branch?: string };
  }>(
    "/ontologies/:ontologyRid/objectTypes/:objectTypeApiName",
    {
      preHandler: requirePermission("ontology:read"),
    },
    async (request) => {
      rejectUnsupportedOntologyScoping(request.query);
      const includeDatasources = parseBooleanParam(
        "includeDatasources",
        request.query.includeDatasources,
      );
      const objectType = await store.getObjectType(
        request.params.ontologyRid,
        request.params.objectTypeApiName,
      );
      return withDatasources(objectType, includeDatasources);
    },
  );

  // Update object type
  app.put<{
    Params: { ontologyRid: string; objectTypeApiName: string };
    Body: ObjectTypeDefinition & { migrations?: unknown };
  }>(
    "/ontologies/:ontologyRid/objectTypes/:objectTypeApiName",
    {
      preHandler: requirePermission("ontology:write"),
    },
    async (request) => {
      const { ontologyRid, objectTypeApiName } = request.params;
      const { migrations, ...body } = request.body ?? ({} as ObjectTypeDefinition & { migrations?: unknown });
      let steps: MigrationStep[] = [];
      if (migrations !== undefined) {
        try {
          steps = parseMigrationSteps(migrations);
        } catch (err) {
          throw invalidArgument("migrations", (err as Error).message);
        }
      }
      const current = await store.getObjectType(ontologyRid, objectTypeApiName);
      assertUpdateAllowed(current, body as ObjectTypeDefinition, objectTypeApiName, steps);
      const next = normalize(body as ObjectTypeDefinition);
      if (steps.length > 0) {
        if (!opts.migrator) throw invalidArgument("migrations", "no object service is configured to migrate data");
        // Every value is checked before any changes; then the data moves, then
        // the definition. A refusal at either data step leaves both untouched.
        await opts.migrator.migrate(ontologyRid, objectTypeApiName, steps, true);
        await opts.migrator.migrate(ontologyRid, objectTypeApiName, steps, false);
      }
      const objectType = await store.updateObjectType(ontologyRid, objectTypeApiName, next);
      return withDatasources(objectType, false);
    },
  );

  // Delete object type
  app.delete<{
    Params: { ontologyRid: string; objectTypeApiName: string };
  }>(
    "/ontologies/:ontologyRid/objectTypes/:objectTypeApiName",
    {
      preHandler: requirePermission("ontology:delete"),
    },
    async (request, reply) => {
      const { ontologyRid, objectTypeApiName } = request.params;
      assertDeleteAllowed(await store.getObjectType(ontologyRid, objectTypeApiName));
      await store.deleteObjectType(ontologyRid, objectTypeApiName);
      reply.status(204);
      return;
    },
  );
}
