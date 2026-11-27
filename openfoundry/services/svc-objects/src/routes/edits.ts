import type { FastifyInstance } from "fastify";
import { invalidArgument } from "@openfoundry/errors";
import { requirePermission } from "@openfoundry/permissions";
import type { ObjectEdit, ObjectReadWriteStore } from "../store/object-store.js";

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
    async (request, reply) => {
      await opts.store.applyEdits(request.params.ontologyRid, parseEdits(request.body));
      return reply.status(204).send();
    },
  );
}
