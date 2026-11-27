import type { ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import { ErrorCode, OpenFoundryApiError, safeArg } from "@openfoundry/errors";

/**
 * How an object type definition may change, by lifecycle status - the rules
 * Palantir documents for Ontology resources
 * (https://www.palantir.com/docs/foundry/object-link-types/metadata-statuses/):
 *
 * - EXPERIMENTAL (the default for a new type): anything may change, and it
 *   may be deleted.
 * - ACTIVE: no breaking changes, and it cannot be deleted. Its API name is
 *   frozen.
 * - DEPRECATED: on its way out, so no breaking changes, but it may be deleted.
 *
 * Breaking changes are the ones Palantir's schema-migration docs list for
 * types with data: a changed primary key, a removed property, a property
 * whose data type changed
 * (https://www.palantir.com/docs/foundry/object-edits/schema-migrations/).
 *
 * ponytail: refusal only. Palantir instead accepts a breaking change with an
 * explicit migration (drop, cast, move edits); add migrations when a type's
 * schema has to change after it goes ACTIVE.
 */

type Status = "ACTIVE" | "EXPERIMENTAL" | "DEPRECATED";

/** The status a definition is held to; a type created without one is EXPERIMENTAL. */
export function statusOf(def: { status?: string }): Status {
  const status = def.status?.toUpperCase();
  return status === "ACTIVE" || status === "DEPRECATED" ? status : "EXPERIMENTAL";
}

/** Seeds name the key `primaryKey`; the schema type names it `primaryKeyApiName`. */
const keyOf = (def: ObjectTypeDefinition) =>
  def.primaryKeyApiName ?? (def as { primaryKey?: string }).primaryKey;

/** Every breaking difference between two definitions of one object type. */
export function breakingChanges(current: ObjectTypeDefinition, next: ObjectTypeDefinition): string[] {
  const changes: string[] = [];
  if (keyOf(current) !== keyOf(next)) {
    changes.push(`primary key changes from "${keyOf(current)}" to "${keyOf(next)}"`);
  }
  const before = current.properties ?? {};
  const after = next.properties ?? {};
  for (const [name, property] of Object.entries(before)) {
    if (!Object.hasOwn(after, name)) {
      changes.push(`property "${name}" is removed`);
    } else if (String(property.type).toUpperCase() !== String(after[name].type).toUpperCase()) {
      changes.push(`property "${name}" changes type from ${property.type} to ${after[name].type}`);
    }
  }
  return changes;
}

function refuse(errorName: string, message: string, objectType: string): never {
  throw new OpenFoundryApiError({
    errorCode: ErrorCode.INVALID_ARGUMENT,
    errorName,
    message,
    args: [safeArg("objectType", objectType)],
  });
}

/** Refuse an update the current definition's status does not allow. */
export function assertUpdateAllowed(
  current: ObjectTypeDefinition,
  next: ObjectTypeDefinition,
  pathApiName: string,
): void {
  if (next.apiName !== undefined && next.apiName !== pathApiName) {
    refuse("ObjectTypeApiNameChange", `apiName "${pathApiName}" cannot be changed`, pathApiName);
  }
  const status = statusOf(current);
  if (status === "EXPERIMENTAL") return;
  const changes = breakingChanges(current, next);
  if (changes.length > 0) {
    refuse(
      "BreakingObjectTypeChange",
      `${pathApiName} is ${status}, so it takes no breaking changes: ${changes.join("; ")}`,
      pathApiName,
    );
  }
}

/** Refuse deleting an ACTIVE object type; deprecate it first. */
export function assertDeleteAllowed(current: ObjectTypeDefinition): void {
  if (statusOf(current) === "ACTIVE") {
    refuse(
      "ActiveObjectTypeDeletion",
      `${current.apiName} is ACTIVE and cannot be deleted; set it to DEPRECATED first`,
      current.apiName,
    );
  }
}
