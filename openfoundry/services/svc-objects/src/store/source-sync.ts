import { isDeepStrictEqual } from "node:util";

/**
 * What Actions have done to one object, kept apart from the source data so a
 * re-sync can reapply it. This is the user-edit layer of Palantir's object
 * storage, under its default "apply user edits" strategy
 * (https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/).
 */
export interface ObjectEditRecord {
  /** Properties an Action set; each keeps its edited value over the source. */
  patch: Record<string, unknown>;
  /** An Action created the object: the source no longer drives it. */
  created: boolean;
  /** An Action deleted the object: it stays deleted whatever the source says. */
  deleted: boolean;
}

/** One source row, keyed by the object's primary key. */
export interface SourceRow {
  primaryKey: string;
  properties: Record<string, unknown>;
}

export interface SyncResult {
  added: number;
  modified: number;
  deleted: number;
  unchanged: number;
}

export interface SyncPlan {
  add: SourceRow[];
  /** Objects whose effective properties changed; `properties` replaces the stored set. */
  modify: SourceRow[];
  delete: string[];
  unchanged: number;
}

/** Fold an Action's edit into the object's edit record. */
export function recordEdit(
  record: ObjectEditRecord | undefined,
  edit: { type: "addObject" | "modifyObject" | "deleteObject"; properties?: Record<string, unknown> },
): ObjectEditRecord {
  const current = record ?? { patch: {}, created: false, deleted: false };
  if (edit.type === "addObject") return { patch: {}, created: true, deleted: false };
  if (edit.type === "deleteObject") return { ...current, deleted: true };
  return { ...current, patch: { ...current.patch, ...edit.properties } };
}

/**
 * Decide what a sync changes, given the stored objects, their edit records
 * and the full current source.
 *
 * For each object:
 * - deleted by an Action: removed, and never brought back by the source;
 * - created by an Action: left alone, the source does not drive it;
 * - absent from the source: removed (an edit record survives, so its edits
 *   reapply if the row returns);
 * - otherwise: the source row with the edited properties laid over it.
 */
export function planSync(
  stored: ReadonlyMap<string, Record<string, unknown>>,
  edits: ReadonlyMap<string, ObjectEditRecord>,
  source: readonly SourceRow[],
): SyncPlan {
  const plan: SyncPlan = { add: [], modify: [], delete: [], unchanged: 0 };
  const rows = new Map(source.map((row) => [row.primaryKey, row.properties]));

  for (const primaryKey of new Set([...stored.keys(), ...rows.keys()])) {
    const edit = edits.get(primaryKey);
    const current = stored.get(primaryKey);
    const row = rows.get(primaryKey);

    if (edit?.deleted) {
      if (current) plan.delete.push(primaryKey);
      continue;
    }
    if (edit?.created) {
      if (current) plan.unchanged++;
      continue;
    }
    if (!row) {
      if (current) plan.delete.push(primaryKey);
      continue;
    }

    const properties = { ...row, ...edit?.patch };
    if (!current) plan.add.push({ primaryKey, properties });
    else if (isDeepStrictEqual(current, properties)) plan.unchanged++;
    else plan.modify.push({ primaryKey, properties });
  }
  return plan;
}

export const resultOf = (plan: SyncPlan): SyncResult => ({
  added: plan.add.length,
  modified: plan.modify.length,
  deleted: plan.delete.length,
  unchanged: plan.unchanged,
});
