import type { FastifyInstance } from "fastify";
import { invalidArgument, notFound } from "@openfoundry/errors";
import { requirePermission } from "@openfoundry/permissions";
import type { CommitOptions, ObjectEdit, ObjectReadWriteStore, ReadVersion } from "../store/object-store.js";
import { parseMigrationSteps } from "@openfoundry/ontology-schema";

const EDIT_TYPES = new Set(["addObject", "modifyObject", "deleteObject"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEdits(body: unknown): ObjectEdit[] {
  const edits = isRecord(body) ? body.edits : undefined;
  if (!Array.isArray(edits)) throw invalidArgument("edits", "must be an array");
  edits.forEach((edit, i) => {
    if (
      !isRecord(edit) ||
      !EDIT_TYPES.has(edit.type as string) ||
      typeof edit.objectType !== "string" ||
      typeof edit.primaryKey !== "string" ||
      (edit.type !== "deleteObject" && !isRecord(edit.properties)) ||
      (edit.expectedVersion !== undefined &&
        (edit.type === "addObject" || !Number.isInteger(edit.expectedVersion)))
    ) {
      throw invalidArgument(`edits[${i}]`, "is not an addObject, modifyObject or deleteObject edit");
    }
  });
  return edits as ObjectEdit[];
}

function parseCommitOptions(body: unknown): CommitOptions {
  const b = isRecord(body) ? body : {};
  const optionalString = (field: string) => {
    const value = b[field];
    if (value !== undefined && (typeof value !== "string" || value === "")) {
      throw invalidArgument(field, "must be a non-empty string");
    }
    return value as string | undefined;
  };
  const reads = b.reads ?? [];
  if (!Array.isArray(reads)) throw invalidArgument("reads", "must be an array");
  reads.forEach((r, i) => {
    if (!isRecord(r) || typeof r.objectType !== "string" || typeof r.primaryKey !== "string" || !Number.isInteger(r.version)) {
      throw invalidArgument(`reads[${i}]`, "must be { objectType, primaryKey, version }");
    }
  });
  return {
    idempotencyKey: optionalString("idempotencyKey"),
    actionType: optionalString("actionType"),
    actor: optionalString("actor"),
    reads: reads as ReadVersion[],
  };
}

/**
 * Commits an action's edit plan, all or nothing.
 *
 * This is the write half of svc-actions' apply: the action logic reads objects
 * and describes its changes as data, and this route applies them in one store
 * transaction so a failure part-way leaves nothing behind (the pattern from
 * gura105/operational-ontology's `execute`). An edit carrying
 * `expectedVersion` is refused with `ObjectChanged` if the object was written
 * since the logic read it. These are service-to-service routes under
 * `/internal`, which the gateway does not proxy.
 */
export async function editRoutes(
  app: FastifyInstance,
  opts: { store: ObjectReadWriteStore },
): Promise<void> {
  // An object's properties and the version an edit plan is checked against.
  app.get<{ Params: { ontologyRid: string; objectType: string; primaryKey: string } }>(
    "/ontologies/:ontologyRid/objects/:objectType/:primaryKey",
    { preHandler: requirePermission("objects:read") },
    async (request) => {
      const { ontologyRid, objectType, primaryKey } = request.params;
      const { properties, version } = await opts.store.getObject(ontologyRid, objectType, primaryKey);
      return { properties, version };
    },
  );

  app.post<{ Params: { ontologyRid: string }; Body: unknown }>(
    "/ontologies/:ontologyRid/edits",
    { preHandler: requirePermission("objects:write") },
    async (request) => {
      return opts.store.applyEdits(
        request.params.ontologyRid,
        parseEdits(request.body),
        parseCommitOptions(request.body),
      );
    },
  );

  // The commit an idempotency key produced: svc-actions checks this before it
  // re-evaluates a repeated call, so the repeat answers with the first result.
  app.get<{ Params: { ontologyRid: string; idempotencyKey: string } }>(
    "/ontologies/:ontologyRid/commits/:idempotencyKey",
    { preHandler: requirePermission("objects:read") },
    async (request) => {
      const commit = await opts.store.getCommit(request.params.ontologyRid, request.params.idempotencyKey);
      if (!commit) throw notFound("Commit", request.params.idempotencyKey);
      return commit;
    },
  );

  // A schema migration's data half, called by svc-ontology before it writes
  // the new definition. `dryRun` checks every value without changing any.
  app.post<{ Params: { ontologyRid: string; objectType: string }; Body: { steps?: unknown; dryRun?: unknown } }>(
    "/ontologies/:ontologyRid/objectTypes/:objectType/migrate",
    { preHandler: requirePermission("objects:write") },
    async (request) => {
      let steps;
      try {
        steps = parseMigrationSteps(request.body?.steps);
      } catch (err) {
        throw invalidArgument("steps", (err as Error).message);
      }
      return opts.store.migrateObjectType(
        request.params.ontologyRid,
        request.params.objectType,
        steps,
        request.body?.dryRun === true,
      );
    },
  );

  // The outbox, for a delivery worker: read undelivered events, then
  // acknowledge the ones it delivered. Delivery is at-least-once.
  app.get<{ Querystring: { limit?: string } }>(
    "/outbox",
    { preHandler: requirePermission("objects:read") },
    async (request) => {
      const limit = Math.min(Math.max(parseInt(request.query.limit ?? "100", 10) || 100, 1), 1000);
      return { data: await opts.store.pendingOutbox(limit) };
    },
  );

  app.post<{ Body: unknown }>(
    "/outbox/ack",
    { preHandler: requirePermission("objects:write") },
    async (request, reply) => {
      const ids = isRecord(request.body) ? request.body.ids : undefined;
      if (!Array.isArray(ids) || !ids.every(Number.isInteger)) throw invalidArgument("ids", "must be an array of integers");
      await opts.store.markDelivered(ids as number[]);
      return reply.status(204).send();
    },
  );
}
