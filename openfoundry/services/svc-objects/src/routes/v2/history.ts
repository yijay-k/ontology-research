/**
 * Edit history and revert - openfoundry extensions, not Foundry endpoints.
 *
 *   GET  /ontologies/:ontologyRid/objects/:objectType/:primaryKey/editHistory
 *   POST /ontologies/:ontologyRid/commits/:commitId/revert
 *
 * History is every commit that touched the object, with what it changed and
 * what the object held before. A revert is a new commit that restores those
 * before-states, refused with `ObjectChanged` if any object moved since the
 * reverted commit, and at most once per commit.
 */
import type { FastifyInstance } from "fastify";
import { invalidArgument, notFound } from "@openfoundry/errors";
import { identityFromHeaders, requirePermission } from "@openfoundry/permissions";
import { revertEdits, type ObjectReadWriteStore } from "../../store/object-store.js";

export async function historyRoutes(app: FastifyInstance, opts: { store: ObjectReadWriteStore }): Promise<void> {
  const { store } = opts;

  app.get<{ Params: { ontologyRid: string; objectType: string; primaryKey: string } }>(
    "/ontologies/:ontologyRid/objects/:objectType/:primaryKey/editHistory",
    { preHandler: requirePermission("objects:read") },
    async (request) => {
      const { ontologyRid, objectType, primaryKey } = request.params;
      const commits = await store.commitsTouching(ontologyRid, objectType, primaryKey);
      return {
        data: commits.map((c) => {
          const change = c.changes.find((ch) => ch.objectType === objectType && ch.primaryKey === primaryKey)!;
          return {
            commitId: c.commitId,
            actionType: c.actionType ?? null,
            actor: c.actor ?? null,
            createdAt: c.createdAt,
            edits: c.edits.filter((e) => e.objectType === objectType && e.primaryKey === primaryKey),
            before: change.before,
            afterVersion: change.afterVersion,
            ...(c.revertOf ? { revertOf: c.revertOf } : {}),
            ...(c.revertedBy ? { revertedBy: c.revertedBy } : {}),
          };
        }),
      };
    },
  );

  app.post<{ Params: { ontologyRid: string; commitId: string } }>(
    "/ontologies/:ontologyRid/commits/:commitId/revert",
    // Undoing someone's committed change is an approval-level decision.
    { preHandler: requirePermission("actions:approve") },
    async (request) => {
      const { ontologyRid, commitId } = request.params;
      const commit = await store.getCommitById(ontologyRid, commitId);
      if (!commit) throw notFound("Commit", commitId);
      const current = new Map<string, Record<string, unknown>>();
      for (const c of commit.changes) {
        try {
          const obj = await store.getObject(ontologyRid, c.objectType, c.primaryKey);
          current.set(`${c.objectType}\u0000${c.primaryKey}`, obj.properties);
        } catch {
          // gone now: the revert either re-adds it or is refused by its version check
        }
      }
      const edits = revertEdits(commit, (type, pk) => current.get(`${type}\u0000${pk}`));
      if (edits.length === 0) throw invalidArgument("commitId", "the commit changed nothing that can be reverted");
      const result = await store.applyEdits(ontologyRid, edits, {
        revertOf: commitId,
        idempotencyKey: `revert:${commitId}`,
        actionType: "revert",
        actor: identityFromHeaders(request.headers)?.userId,
      });
      return { commitId: result.commitId, revertOf: commitId, replayed: result.replayed };
    },
  );
}
