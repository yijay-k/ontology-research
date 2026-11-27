import type { FastifyInstance } from "fastify";
import { requirePermission } from "@openfoundry/permissions";
import type { ObjectReadWriteStore, SyncResult } from "../store/object-store.js";
import { syncObjectType, type SyncSources } from "../sync/sync-object-type.js";

/**
 * Keeps dataset-backed object types current with their datasets - the job
 * Palantir's Object Data Funnel does on each source update. Service-to-service
 * routes under `/internal`, which the gateway does not proxy.
 */
export async function syncRoutes(
  app: FastifyInstance,
  opts: { store: ObjectReadWriteStore; sources: SyncSources },
): Promise<void> {
  const { store, sources } = opts;

  app.post<{ Params: { ontologyRid: string; objectType: string } }>(
    "/ontologies/:ontologyRid/objectTypes/:objectType/sync",
    { preHandler: requirePermission("objects:write") },
    async (request) =>
      syncObjectType(sources, store, request.params.ontologyRid, request.params.objectType),
  );

  // svc-datasets calls this after a dataset's files change. Each backed type
  // syncs on its own: one with a bad source keeps its previous state and
  // reports why, without holding back the others.
  app.post<{ Params: { datasetRid: string } }>(
    "/datasets/:datasetRid/changed",
    { preHandler: requirePermission("objects:write") },
    async (request) => {
      const results: Array<
        { ontologyRid: string; objectType: string } & ({ result: SyncResult } | { error: string })
      > = [];
      for (const target of await sources.objectTypesBackedBy(request.params.datasetRid)) {
        try {
          results.push({ ...target, result: await syncObjectType(sources, store, target.ontologyRid, target.objectType) });
        } catch (err) {
          request.log.warn({ err, ...target }, "object type sync failed");
          results.push({ ...target, error: err instanceof Error ? err.message : String(err) });
        }
      }
      return { results };
    },
  );
}
