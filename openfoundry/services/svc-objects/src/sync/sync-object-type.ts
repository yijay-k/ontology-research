import type { ObjectTypeDefinition } from "@openfoundry/ontology-schema";
import { ErrorCode, OpenFoundryApiError, invalidArgument, notFound } from "@openfoundry/errors";
import type { ObjectReadWriteStore, SourceRow, SyncResult } from "../store/object-store.js";
import { parseCSV } from "@openfoundry/ontology-drafting";

/** Where a sync reads definitions and source data from. */
export interface SyncSources {
  /** The object type with its datasources, or `undefined` if not declared. */
  getObjectType(ontologyRid: string, objectType: string): Promise<ObjectTypeDefinition | undefined>;
  /** Every object type, in any ontology, backed by this dataset. */
  objectTypesBackedBy(datasetRid: string): Promise<Array<{ ontologyRid: string; objectType: string }>>;
  /** The dataset's current CSV files. */
  readCsvFiles(datasetRid: string): Promise<Array<{ path: string; text: string }>>;
}

/**
 * The source could not be read into objects. Like a failed Palantir index
 * build (duplicate primary keys fail it), nothing is applied: the previous
 * state stands until the source is fixed.
 */
function syncFailed(objectType: string, reason: string): OpenFoundryApiError {
  return new OpenFoundryApiError({
    errorCode: ErrorCode.INVALID_ARGUMENT,
    errorName: "ObjectTypeSyncFailed",
    message: `${objectType}: ${reason}`,
    parameters: { objectType, reason },
  });
}

const INTEGER_TYPES = new Set(["INTEGER", "LONG", "SHORT", "BYTE"]);
const NUMBER_TYPES = new Set(["DOUBLE", "FLOAT"]);

/** A CSV cell as the property's declared type; an empty cell is no value. */
function convert(raw: string, type: string): { value?: unknown; error?: string } {
  if (raw === "") return {};
  const upper = type.toUpperCase();
  if (INTEGER_TYPES.has(upper)) {
    const n = Number(raw);
    return Number.isInteger(n) ? { value: n } : { error: `"${raw}" is not an integer` };
  }
  if (NUMBER_TYPES.has(upper)) {
    const n = Number(raw);
    return Number.isFinite(n) ? { value: n } : { error: `"${raw}" is not a number` };
  }
  if (upper === "BOOLEAN") {
    const lower = raw.toLowerCase();
    if (lower === "true" || lower === "false") return { value: lower === "true" };
    return { error: `"${raw}" is not a boolean` };
  }
  return { value: raw };
}

/** Read a dataset-backed object type's rows from its CSV files. */
export function rowsFromCsv(
  objectType: ObjectTypeDefinition,
  files: Array<{ path: string; text: string }>,
): SourceRow[] {
  const source = objectType.datasources?.[0]?.definition;
  if (!source) throw invalidArgument("objectType", `${objectType.apiName} has no datasource`);
  // Seeds name the key `primaryKey`; the schema type names it `primaryKeyApiName`.
  const keyProperty =
    objectType.primaryKeyApiName ?? (objectType as { primaryKey?: string }).primaryKey;
  const columns = Object.entries(source.propertyMapping).flatMap(([property, mapping]) =>
    mapping.type === "column" ? [{ property, column: mapping.column }] : [],
  );

  const rows = new Map<string, SourceRow>();
  for (const file of files) {
    const [header, ...records] = parseCSV(file.text);
    if (!header) continue;
    const index = new Map(header.map((name, i) => [name, i]));
    for (const { column } of columns) {
      if (!index.has(column)) {
        throw syncFailed(objectType.apiName, `column "${column}" is missing from ${file.path}`);
      }
    }

    records.forEach((record, i) => {
      const where = `${file.path} row ${i + 2}`;
      const properties: Record<string, unknown> = {};
      for (const { property, column } of columns) {
        const type = objectType.properties[property]?.type ?? "STRING";
        const { value, error } = convert(record[index.get(column)!] ?? "", type);
        if (error) throw syncFailed(objectType.apiName, `${where}, ${property}: ${error}`);
        if (value !== undefined) properties[property] = value;
      }
      const primaryKey = keyProperty ? properties[keyProperty] : undefined;
      if (primaryKey === undefined) {
        throw syncFailed(objectType.apiName, `${where} has no primary key`);
      }
      const key = String(primaryKey);
      if (rows.has(key)) {
        throw syncFailed(objectType.apiName, `${where} repeats primary key "${key}"`);
      }
      rows.set(key, { primaryKey: key, properties });
    });
  }
  return [...rows.values()];
}

/** Sync one object type from its dataset. */
export async function syncObjectType(
  sources: SyncSources,
  store: ObjectReadWriteStore,
  ontologyRid: string,
  objectTypeApiName: string,
): Promise<SyncResult> {
  const objectType = await sources.getObjectType(ontologyRid, objectTypeApiName);
  if (!objectType) throw notFound("ObjectType", objectTypeApiName);
  const source = objectType.datasources?.[0]?.definition;
  if (!source) throw invalidArgument("objectType", `${objectTypeApiName} has no datasource`);

  const rows = rowsFromCsv(objectType, await sources.readCsvFiles(source.datasetRid));
  return store.syncFromSource(ontologyRid, objectTypeApiName, rows);
}
