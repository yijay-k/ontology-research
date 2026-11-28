import type { PropertyDef, PropertyType } from "./property-types.js";

// ---------------------------------------------------------------------------
// Object type status
// ---------------------------------------------------------------------------

export const ObjectTypeStatus = {
  ACTIVE: "ACTIVE",
  EXPERIMENTAL: "EXPERIMENTAL",
  DEPRECATED: "DEPRECATED",
} as const;

export type ObjectTypeStatus =
  (typeof ObjectTypeStatus)[keyof typeof ObjectTypeStatus];

// ---------------------------------------------------------------------------
// Datasources (Foundry's `ObjectTypeDatasource`, dataset variant only)
// ---------------------------------------------------------------------------

/** How one property is bound to the backing dataset. */
export type PropertyTypeMappingInfo =
  /** The property's value comes from this column. */
  | { readonly type: "column"; readonly column: string }
  /** No backing column: the property is populated only through Actions. */
  | { readonly type: "editOnly" };

/** An object type datasource backed by a dataset. */
export interface ObjectTypeDatasetDatasource {
  readonly type: "dataset";
  readonly datasetRid: string;
  readonly branch?: string;
  /** Property API name to its binding; unmapped properties are not read from the source. */
  readonly propertyMapping: Readonly<Record<string, PropertyTypeMappingInfo>>;
}

/** A datasource that supplies an object type's property values. */
export interface ObjectTypeDatasource {
  readonly rid: string;
  readonly definition: ObjectTypeDatasetDatasource;
}

// ---------------------------------------------------------------------------
// ObjectTypeDefinition
// ---------------------------------------------------------------------------

/**
 * Defines an object type in the ontology — the fundamental entity that users
 * create, query, and link together.
 *
 * Mirrors the Palantir ObjectType specification with apiName-based addressing,
 * a typed primary key, and optional interface conformance.
 */
export interface ObjectTypeDefinition {
  /** Unique API name used to reference this object type programmatically. */
  readonly apiName: string;

  /**
   * Human-readable label for this object type. Persisted in the
   * `object_types.display_name` column; falls back to `apiName` when absent.
   */
  readonly displayName?: string;

  /** Human-readable description of what this object type represents. */
  readonly description: string;

  /**
   * The apiName of the property that serves as the primary key.
   * Must reference a key in `properties`.
   */
  readonly primaryKeyApiName: string;

  /** The property type of the primary key (e.g. "STRING", "INTEGER", "RID"). */
  readonly primaryKeyType: PropertyType;

  /**
   * The apiName of the property used as the display title.
   * Must reference a key in `properties`.
   */
  readonly titlePropertyApiName: string;

  /** All properties defined on this object type, keyed by property apiName. */
  readonly properties: Record<string, PropertyDef>;

  /**
   * Interface apiNames that this object type implements.
   * The object type must satisfy all property constraints of each interface.
   */
  readonly implements: readonly string[];

  /** Lifecycle status of this object type. */
  readonly status: ObjectTypeStatus;

  /**
   * Where the objects' property values come from. Absent or empty means the
   * objects exist only through writes to the object service.
   */
  readonly datasources?: readonly ObjectTypeDatasource[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export interface ObjectTypeValidationError {
  readonly field: string;
  readonly message: string;
}

/**
 * Validates an ObjectTypeDefinition, returning an array of errors.
 * An empty array indicates a valid definition.
 */
export function validateObjectType(
  def: ObjectTypeDefinition,
): ObjectTypeValidationError[] {
  const errors: ObjectTypeValidationError[] = [];

  if (!def.apiName || def.apiName.trim().length === 0) {
    errors.push({ field: "apiName", message: "apiName must be non-empty" });
  }

  if (!def.description || def.description.trim().length === 0) {
    errors.push({
      field: "description",
      message: "description must be non-empty",
    });
  }

  if (!def.properties || Object.keys(def.properties).length === 0) {
    errors.push({
      field: "properties",
      message: "object type must define at least one property",
    });
  }

  if (
    def.primaryKeyApiName &&
    def.properties &&
    !(def.primaryKeyApiName in def.properties)
  ) {
    errors.push({
      field: "primaryKeyApiName",
      message: `primary key "${def.primaryKeyApiName}" is not defined in properties`,
    });
  }

  if (
    def.titlePropertyApiName &&
    def.properties &&
    !(def.titlePropertyApiName in def.properties)
  ) {
    errors.push({
      field: "titlePropertyApiName",
      message: `title property "${def.titlePropertyApiName}" is not defined in properties`,
    });
  }

  if (
    def.primaryKeyApiName &&
    def.properties &&
    def.primaryKeyApiName in def.properties
  ) {
    const pkProp = def.properties[def.primaryKeyApiName];
    if (pkProp.nullable) {
      errors.push({
        field: "primaryKeyApiName",
        message: "primary key property must not be nullable",
      });
    }
  }

  return errors;
}

/**
 * Checks an object type's datasources against its own properties.
 *
 * ponytail: one dataset datasource per type. Foundry allows several, joined
 * column-wise on the primary key; add that when a type needs two sources.
 */
export function validateDatasources(
  def: Pick<ObjectTypeDefinition, "properties" | "datasources"> & {
    primaryKeyApiName?: string;
    primaryKey?: string;
  },
): ObjectTypeValidationError[] {
  const sources = def.datasources ?? [];
  if (sources.length === 0) return [];
  if (sources.length > 1) {
    return [{ field: "datasources", message: "at most one datasource is supported" }];
  }
  const errors: ObjectTypeValidationError[] = [];
  const source = sources[0].definition;
  if (source?.type !== "dataset" || !source.datasetRid) {
    return [{ field: "datasources[0].definition", message: "must be a dataset datasource with a datasetRid" }];
  }
  const properties = def.properties ?? {};
  for (const [property, mapping] of Object.entries(source.propertyMapping ?? {})) {
    if (!Object.hasOwn(properties, property)) {
      errors.push({ field: `propertyMapping.${property}`, message: "is not a property of this object type" });
    } else if (mapping.type === "column" && !mapping.column) {
      errors.push({ field: `propertyMapping.${property}`, message: "column must be non-empty" });
    } else if (mapping.type !== "column" && mapping.type !== "editOnly") {
      errors.push({ field: `propertyMapping.${property}`, message: "must be a column or editOnly mapping" });
    } else if (mapping.type === "editOnly" && (properties[property] as { editable?: boolean }).editable === false) {
      // An edit-only property has no source; with edits refused it could never hold a value.
      errors.push({ field: `propertyMapping.${property}`, message: "is editOnly, so it cannot be declared editable: false" });
    }
  }
  // Seeds name the key `primaryKey`; the schema type names it `primaryKeyApiName`.
  const key = def.primaryKeyApiName ?? def.primaryKey;
  if (key && source.propertyMapping?.[key]?.type !== "column") {
    errors.push({ field: "propertyMapping", message: `primary key "${key}" must be mapped to a column` });
  }
  return errors;
}
