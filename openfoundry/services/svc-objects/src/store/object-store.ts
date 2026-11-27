import type { Filter } from "@openfoundry/object-set";
import type { Aggregation } from "@openfoundry/object-set";
import { generateRid } from "@openfoundry/rid";
import {
  ErrorCode,
  OpenFoundryApiError,
  conflict,
  notFound,
  safeArg,
} from "@openfoundry/errors";
import {
  encodePageToken,
  decodePageToken,
  type PageToken,
} from "@openfoundry/pagination";
import {
  readOntologyScopedFile,
  writeOntologyScopedFile,
} from "./ontology-scoped-file.js";
import {
  planSync,
  recordEdit,
  resultOf,
  type ObjectEditRecord,
  type SourceRow,
  type SyncResult,
} from "./source-sync.js";

export type { ObjectEditRecord, SourceRow, SyncResult } from "./source-sync.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StoredObject {
  rid: string;
  objectType: string;
  primaryKey: string;
  properties: Record<string, unknown>;
  /** Incremented on every write; what `expectedVersion` on an edit is checked against. */
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListOptions {
  pageSize?: number;
  pageToken?: string;
}

export interface ListResult {
  data: StoredObject[];
  nextPageToken?: string;
  totalCount: number;
}

/**
 * Where the property names declared on an object type are read from.
 *
 * The declaration, not the data, is what says whether a property exists: a
 * property an object type lists but no object has populated is still a real
 * property and must be selectable. `undefined` means no declaration is
 * available for that type, in which case nothing can be said about a property
 * name and no existence check may be made.
 */
export interface ObjectTypeSchemaSource {
  propertyNames(
    ontologyRid: string,
    objectType: string,
  ): ReadonlySet<string> | undefined | Promise<ReadonlySet<string> | undefined>;

  /**
   * The object type a link type points at, per the link type's own
   * declaration. `undefined` when the link type is not declared, which - like
   * an undeclared object type - means nothing can be checked.
   */
  linkTargetObjectType(
    ontologyRid: string,
    objectType: string,
    linkType: string,
  ): string | undefined | Promise<string | undefined>;
}

/**
 * The object-store surface the object routes depend on.
 *
 * Both the in-memory `ObjectStore` and the Postgres-backed `PgObjectStore`
 * satisfy it. Every method may answer synchronously or with a promise, so a
 * handler that awaits its result is correct against either backend - which is
 * what keeps a Postgres deployment from silently serving the unresolved
 * promise instead of the object.
 *
 * Every data method takes the ontology first. An object type's API name is
 * unique only within one ontology, so two ontologies may each declare an
 * `Employee`; their objects are distinct data, and the ontology in the request
 * path is what says which of them is meant - the same ontology the
 * declaration lookups (`propertyNames`, `linkTargetObjectType`) are keyed by.
 */
export interface ObjectReadWriteStore {
  allObjects(
    ontologyRid: string,
    objectType: string,
  ): StoredObject[] | Promise<StoredObject[]>;
  listObjects(
    ontologyRid: string,
    objectType: string,
    options?: ListOptions,
  ): ListResult | Promise<ListResult>;
  getObjectsByKeys(
    ontologyRid: string,
    objectType: string,
    primaryKeys: string[],
  ): StoredObject[] | Promise<StoredObject[]>;
  propertyNames?: ObjectTypeSchemaSource["propertyNames"];
  linkTargetObjectType?: ObjectTypeSchemaSource["linkTargetObjectType"];
  getObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
  ): StoredObject | Promise<StoredObject>;
  createObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): StoredObject | Promise<StoredObject>;
  upsertObject?(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): StoredObject | Promise<StoredObject>;
  updateObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): StoredObject | Promise<StoredObject>;
  deleteObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
  ): void | Promise<void>;
  /** Apply every edit or none of them, recording each in the object's edit layer. */
  applyEdits(ontologyRid: string, edits: ObjectEdit[]): void | Promise<void>;
  /**
   * Replace an object type's source-backed state with `rows`, reapplying the
   * edit layer over it, all or nothing.
   */
  syncFromSource(
    ontologyRid: string,
    objectType: string,
    rows: SourceRow[],
  ): SyncResult | Promise<SyncResult>;
}

/**
 * One object edit an action commits. The `type` names are Foundry's `ObjectEdit`
 * variants (`foundry_sdk/v2/ontologies/models.py`); Foundry reports an edit by
 * type and key only, while applying one needs the property values too.
 */
export type ObjectEdit =
  | { type: "addObject"; objectType: string; primaryKey: string; properties: Record<string, unknown> }
  | {
      type: "modifyObject";
      objectType: string;
      primaryKey: string;
      properties: Record<string, unknown>;
      /** The version the edit was planned against; a different stored version refuses the plan. */
      expectedVersion?: number;
    }
  | { type: "deleteObject"; objectType: string; primaryKey: string; expectedVersion?: number };

/**
 * Foundry's `ObjectChanged` (409): an object used by an action was changed by
 * someone else while the action was running.
 */
export function objectChanged(objectType: string, primaryKey: string): OpenFoundryApiError {
  return new OpenFoundryApiError({
    errorCode: ErrorCode.CONFLICT,
    errorName: "ObjectChanged",
    message: `${objectType}:${primaryKey} changed since it was read`,
    args: [safeArg("objectType", objectType), safeArg("primaryKey", primaryKey)],
  });
}

export interface AggregationResult {
  type: string;
  property?: string;
  value: number;
}

export interface OrderByClause {
  field: string;
  direction: "asc" | "desc";
}

// ---------------------------------------------------------------------------
// Filter evaluator
// ---------------------------------------------------------------------------

export function evaluateFilter(
  obj: StoredObject,
  filter: Filter,
): boolean {
  switch (filter.type) {
    case "AND":
      return filter.filters.every((f) => evaluateFilter(obj, f));

    case "OR":
      return filter.filters.some((f) => evaluateFilter(obj, f));

    case "NOT":
      return !evaluateFilter(obj, filter.filter);

    case "EQUALS":
      return obj.properties[filter.property] === filter.value;

    case "CONTAINS": {
      const val = obj.properties[filter.property];
      return typeof val === "string" && val.includes(filter.value);
    }

    case "STARTS_WITH": {
      const val = obj.properties[filter.property];
      return typeof val === "string" && val.startsWith(filter.value);
    }

    case "GT": {
      const val = obj.properties[filter.property];
      return typeof val === typeof filter.value && (val as number) > (filter.value as number);
    }

    case "GTE": {
      const val = obj.properties[filter.property];
      return typeof val === typeof filter.value && (val as number) >= (filter.value as number);
    }

    case "LT": {
      const val = obj.properties[filter.property];
      return typeof val === typeof filter.value && (val as number) < (filter.value as number);
    }

    case "LTE": {
      const val = obj.properties[filter.property];
      return typeof val === typeof filter.value && (val as number) <= (filter.value as number);
    }

    case "IS_NULL":
      return (
        obj.properties[filter.property] === null ||
        obj.properties[filter.property] === undefined
      );

    case "HAS_PROPERTY":
      return (
        filter.property in obj.properties &&
        obj.properties[filter.property] !== undefined &&
        obj.properties[filter.property] !== null
      );

    case "IN_SET": {
      const val = obj.properties[filter.property];
      return filter.values.includes(val as string | number | boolean);
    }

    case "RANGE": {
      const val = obj.properties[filter.property] as number;
      if (typeof val !== "number") return false;
      if (filter.gt !== undefined && val <= (filter.gt as number)) return false;
      if (filter.gte !== undefined && val < (filter.gte as number)) return false;
      if (filter.lt !== undefined && val >= (filter.lt as number)) return false;
      if (filter.lte !== undefined && val > (filter.lte as number)) return false;
      return true;
    }

    default:
      // Unsupported filter types pass through (return true)
      return true;
  }
}

// ---------------------------------------------------------------------------
// Aggregation evaluator
// ---------------------------------------------------------------------------

export function evaluateAggregation(
  objects: StoredObject[],
  aggregation: Aggregation,
): AggregationResult {
  switch (aggregation.type) {
    case "COUNT":
      return { type: "COUNT", value: objects.length };

    case "MIN": {
      const nums = objects
        .map((o) => o.properties[aggregation.property])
        .filter((v): v is number => typeof v === "number");
      return {
        type: "MIN",
        property: aggregation.property,
        value: nums.length > 0 ? Math.min(...nums) : 0,
      };
    }

    case "MAX": {
      const nums = objects
        .map((o) => o.properties[aggregation.property])
        .filter((v): v is number => typeof v === "number");
      return {
        type: "MAX",
        property: aggregation.property,
        value: nums.length > 0 ? Math.max(...nums) : 0,
      };
    }

    case "SUM": {
      const nums = objects
        .map((o) => o.properties[aggregation.property])
        .filter((v): v is number => typeof v === "number");
      return {
        type: "SUM",
        property: aggregation.property,
        value: nums.reduce((a, b) => a + b, 0),
      };
    }

    case "AVG": {
      const nums = objects
        .map((o) => o.properties[aggregation.property])
        .filter((v): v is number => typeof v === "number");
      return {
        type: "AVG",
        property: aggregation.property,
        value: nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0,
      };
    }

    default:
      return { type: aggregation.type, value: 0 };
  }
}

// ---------------------------------------------------------------------------
// ObjectStore
// ---------------------------------------------------------------------------

/** One ontology's objects: Map<objectType, Map<primaryKey, StoredObject>>. */
type OntologyObjects = Map<string, Map<string, StoredObject>>;

/**
 * In-memory object store. Objects are organized by ontology, then by object
 * type, then by primary key, so two ontologies that declare a same-named
 * object type hold separate objects under it.
 */
export class ObjectStore {
  /** Map<ontologyRid, Map<objectType, Map<primaryKey, StoredObject>>> */
  private readonly objects = new Map<string, OntologyObjects>();
  /** The edit layer: Map<ontologyRid, Map<objectType, Map<primaryKey, record>>>. */
  private readonly edits = new Map<string, Map<string, Map<string, ObjectEditRecord>>>();
  private readonly DATA_FILE: string | null;
  private readonly EDITS_FILE: string | null;

  /**
   * @param dataFile Where the store persists between restarts. Pass `null` for
   *   a purely in-memory store, which is what tests need: the default file is
   *   shared by every instance in the process, so a store constructed after
   *   another one has written would otherwise start with that state.
   */
  constructor(dataFile: string | null = "/tmp/openfoundry-data/object-store.json") {
    this.DATA_FILE = dataFile;
    this.EDITS_FILE = dataFile === null ? null : dataFile.replace(/\.json$/, "") + "-edits.json";
    this.loadFromDisk();
    if (this.EDITS_FILE !== null) {
      const plain = readOntologyScopedFile<Record<string, Record<string, ObjectEditRecord>>>(
        this.EDITS_FILE,
        "object-edits",
      );
      for (const [ontologyRid, byType] of Object.entries(plain)) {
        this.edits.set(
          ontologyRid,
          new Map(Object.entries(byType).map(([type, records]) => [type, new Map(Object.entries(records))])),
        );
      }
    }
  }

  private saveEdits(): void {
    if (this.EDITS_FILE === null) return;
    const plain: Record<string, Record<string, Record<string, ObjectEditRecord>>> = {};
    for (const [ontologyRid, types] of this.edits) {
      plain[ontologyRid] = Object.fromEntries(
        [...types].map(([type, records]) => [type, Object.fromEntries(records)]),
      );
    }
    writeOntologyScopedFile(this.EDITS_FILE, plain);
  }

  private editRecords(ontologyRid: string, objectType: string): Map<string, ObjectEditRecord> {
    let types = this.edits.get(ontologyRid);
    if (!types) this.edits.set(ontologyRid, (types = new Map()));
    let records = types.get(objectType);
    if (!records) types.set(objectType, (records = new Map()));
    return records;
  }

  // -----------------------------------------------------------------------
  // Persistence helpers
  // -----------------------------------------------------------------------

  private saveToDisk(): void {
    if (this.DATA_FILE === null) return;
    const plain: Record<string, Record<string, Record<string, StoredObject>>> = {};
    for (const [ontologyRid, types] of this.objects) {
      const byType: Record<string, Record<string, StoredObject>> = {};
      for (const [objectType, typeMap] of types) {
        byType[objectType] = Object.fromEntries(typeMap);
      }
      plain[ontologyRid] = byType;
    }
    writeOntologyScopedFile(this.DATA_FILE, plain);
  }

  private loadFromDisk(): void {
    if (this.DATA_FILE === null) return;
    const plain = readOntologyScopedFile<Record<string, Record<string, StoredObject>>>(
      this.DATA_FILE,
      "object-store",
    );
    for (const [ontologyRid, byType] of Object.entries(plain)) {
      const types: OntologyObjects = new Map();
      for (const [objectType, entries] of Object.entries(byType)) {
        types.set(
          objectType,
          new Map(
            Object.entries(entries).map(([pk, obj]) => [pk, { ...obj, version: obj.version ?? 1 }]),
          ),
        );
      }
      this.objects.set(ontologyRid, types);
    }
  }

  /** The objects of one type in one ontology, if any were ever stored. */
  private findTypeMap(
    ontologyRid: string,
    objectType: string,
  ): Map<string, StoredObject> | undefined {
    return this.objects.get(ontologyRid)?.get(objectType);
  }

  private getTypeMap(ontologyRid: string, objectType: string): Map<string, StoredObject> {
    let types = this.objects.get(ontologyRid);
    if (!types) {
      types = new Map();
      this.objects.set(ontologyRid, types);
    }
    let map = types.get(objectType);
    if (!map) {
      map = new Map();
      types.set(objectType, map);
    }
    return map;
  }

  createObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): StoredObject {
    const typeMap = this.getTypeMap(ontologyRid, objectType);
    if (typeMap.has(primaryKey)) {
      throw conflict(
        `${objectType}:${primaryKey}`,
        "object with this primary key already exists",
      );
    }

    const now = new Date().toISOString();
    const rid = generateRid("phonograph2-objects", "object").toString();
    const obj: StoredObject = {
      rid,
      objectType,
      primaryKey,
      properties,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    typeMap.set(primaryKey, obj);
    this.saveToDisk();
    return obj;
  }

  upsertObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): StoredObject {
    const existing = this.findTypeMap(ontologyRid, objectType)?.get(primaryKey);
    if (existing) {
      existing.properties = { ...existing.properties, ...properties };
      existing.version += 1;
      existing.updatedAt = new Date().toISOString();
      this.saveToDisk();
      return existing;
    }
    return this.createObject(ontologyRid, objectType, primaryKey, properties);
  }

  getObject(ontologyRid: string, objectType: string, primaryKey: string): StoredObject {
    const obj = this.findTypeMap(ontologyRid, objectType)?.get(primaryKey);
    if (!obj) {
      throw notFound("Object", `${objectType}:${primaryKey}`);
    }
    return obj;
  }

  updateObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): StoredObject {
    const obj = this.getObject(ontologyRid, objectType, primaryKey);
    const updated: StoredObject = {
      ...obj,
      properties: { ...obj.properties, ...properties },
      version: obj.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.getTypeMap(ontologyRid, objectType).set(primaryKey, updated);
    this.saveToDisk();
    return updated;
  }

  deleteObject(ontologyRid: string, objectType: string, primaryKey: string): void {
    const typeMap = this.findTypeMap(ontologyRid, objectType);
    if (!typeMap?.has(primaryKey)) {
      throw notFound("Object", `${objectType}:${primaryKey}`);
    }
    typeMap.delete(primaryKey);
    this.saveToDisk();
  }

  /**
   * Check the whole plan against current state first, then write. Every check
   * the writes below would fail on is made before any of them runs, and the
   * store is synchronous, so nothing interleaves: all edits land or none do.
   */
  applyEdits(ontologyRid: string, edits: ObjectEdit[]): void {
    const present = new Map<string, boolean>();
    for (const edit of edits) {
      const key = `${edit.objectType}\u0000${edit.primaryKey}`;
      const stored = this.findTypeMap(ontologyRid, edit.objectType)?.get(edit.primaryKey);
      const exists = present.get(key) ?? stored !== undefined;
      if (edit.type === "addObject" && exists) {
        throw conflict(
          `${edit.objectType}:${edit.primaryKey}`,
          "object with this primary key already exists",
        );
      }
      if (edit.type !== "addObject" && !exists) {
        throw notFound("Object", `${edit.objectType}:${edit.primaryKey}`);
      }
      // Checked against the version before the plan, so only the first edit
      // to an object should carry one.
      if (edit.type !== "addObject" && edit.expectedVersion !== undefined && stored?.version !== edit.expectedVersion) {
        throw objectChanged(edit.objectType, edit.primaryKey);
      }
      present.set(key, edit.type !== "deleteObject");
    }

    for (const edit of edits) {
      if (edit.type === "addObject") {
        this.createObject(ontologyRid, edit.objectType, edit.primaryKey, edit.properties);
      } else if (edit.type === "modifyObject") {
        this.updateObject(ontologyRid, edit.objectType, edit.primaryKey, edit.properties);
      } else {
        this.deleteObject(ontologyRid, edit.objectType, edit.primaryKey);
      }
      const records = this.editRecords(ontologyRid, edit.objectType);
      records.set(edit.primaryKey, recordEdit(records.get(edit.primaryKey), edit));
    }
    this.saveEdits();
  }

  /** Computes the whole plan before writing; synchronous, so nothing interleaves. */
  syncFromSource(ontologyRid: string, objectType: string, rows: SourceRow[]): SyncResult {
    const typeMap = this.findTypeMap(ontologyRid, objectType);
    const stored = new Map([...(typeMap ?? new Map<string, StoredObject>())].map(([pk, o]) => [pk, o.properties]));
    const plan = planSync(stored, this.editRecords(ontologyRid, objectType), rows);

    const now = new Date().toISOString();
    const target = this.getTypeMap(ontologyRid, objectType);
    for (const pk of plan.delete) target.delete(pk);
    for (const { primaryKey, properties } of plan.modify) {
      const obj = target.get(primaryKey)!;
      target.set(primaryKey, { ...obj, properties, version: obj.version + 1, updatedAt: now });
    }
    for (const { primaryKey, properties } of plan.add) {
      const rid = generateRid("phonograph2-objects", "object").toString();
      target.set(primaryKey, { rid, objectType, primaryKey, properties, version: 1, createdAt: now, updatedAt: now });
    }
    this.saveToDisk();
    return resultOf(plan);
  }

  listObjects(
    ontologyRid: string,
    objectType: string,
    options: ListOptions = {},
  ): ListResult {
    const allObjects = this.allObjects(ontologyRid, objectType);
    const totalCount = allObjects.length;
    const pageSize = options.pageSize ?? 100;

    let offset = 0;
    if (options.pageToken) {
      const cursor = decodePageToken(options.pageToken as PageToken);
      offset = cursor.offset;
    }

    // Fetch one extra to detect next page
    const slice = allObjects.slice(offset, offset + pageSize + 1);
    const hasMore = slice.length > pageSize;
    const data = hasMore ? slice.slice(0, pageSize) : slice;

    const result: ListResult = { data, totalCount };
    if (hasMore) {
      result.nextPageToken = encodePageToken({ offset: offset + pageSize });
    }
    return result;
  }

  /**
   * Returns all objects of a given type that match the filter.
   */
  queryObjects(ontologyRid: string, objectType: string, filter?: Filter): StoredObject[] {
    const all = this.allObjects(ontologyRid, objectType);
    if (!filter) return all;
    return all.filter((obj) => evaluateFilter(obj, filter));
  }

  /**
   * Returns all objects of a given type (for use in ObjectSet resolution).
   */
  allObjects(ontologyRid: string, objectType: string): StoredObject[] {
    const typeMap = this.findTypeMap(ontologyRid, objectType);
    return typeMap ? Array.from(typeMap.values()) : [];
  }

  /**
   * Gets objects by explicit primary keys.
   */
  getObjectsByKeys(
    ontologyRid: string,
    objectType: string,
    primaryKeys: string[],
  ): StoredObject[] {
    const typeMap = this.findTypeMap(ontologyRid, objectType);
    if (!typeMap) return [];
    return primaryKeys
      .map((pk) => typeMap.get(pk))
      .filter((o): o is StoredObject => o !== undefined);
  }
}
