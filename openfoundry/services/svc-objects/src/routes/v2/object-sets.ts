import type { FastifyInstance } from "fastify";
import type { InterfaceSource } from "../../sync/http-sources.js";
import type { ObjectSet, Aggregation } from "@openfoundry/object-set";
import {
  ObjectSetQueryEngine,
  WHERE_TYPES,
  type WhereClause,
  type AggregationDef,
  type GroupByDef,
} from "@openfoundry/object-set";
import {
  type ObjectReadWriteStore,
  type ObjectTypeSchemaSource,
  type StoredObject,
  type OrderByClause,
  evaluateFilter,
  evaluateAggregation,
} from "../../store/object-store.js";
import type { LinkReadWriteStore } from "../../store/link-store.js";
import { encodePageToken, decodePageToken, type PageToken } from "@openfoundry/pagination";
import { requirePermission } from "@openfoundry/permissions";
import {
  ErrorCode,
  OpenFoundryApiError,
  invalidArgument,
  notFound,
  rejectUnsupportedOntologyScoping,
  safeArg,
} from "@openfoundry/errors";
import { createHash } from "node:crypto";
import {
  assertOrderByClauseListBody,
  assertPropertiesExist,
  assertStringListBody,
  parseBooleanParam,
} from "./query-params.js";

// ---------------------------------------------------------------------------
// Query engine singleton
// ---------------------------------------------------------------------------

const queryEngine = new ObjectSetQueryEngine();

// ---------------------------------------------------------------------------
// ObjectSet resolver
// ---------------------------------------------------------------------------

async function resolveObjectSet(
  objectSetDef: ObjectSet,
  ontologyRid: string,
  store: ObjectReadWriteStore,
  linkStore: LinkReadWriteStore,
): Promise<StoredObject[]> {
  switch (objectSetDef.type) {
    case "BASE":
      return store.allObjects(ontologyRid, objectSetDef.objectType);

    case "FILTER": {
      const source = await resolveObjectSet(objectSetDef.objectSet, ontologyRid, store, linkStore);
      return source.filter((obj) => evaluateFilter(obj, objectSetDef.filter));
    }

    case "UNION": {
      const sets = await Promise.all(
        objectSetDef.objectSets.map((s) =>
          resolveObjectSet(s, ontologyRid, store, linkStore),
        ),
      );
      // Deduplicate by rid
      const seen = new Set<string>();
      const result: StoredObject[] = [];
      for (const set of sets) {
        for (const obj of set) {
          if (!seen.has(obj.rid)) {
            seen.add(obj.rid);
            result.push(obj);
          }
        }
      }
      return result;
    }

    case "INTERSECT": {
      const sets = await Promise.all(
        objectSetDef.objectSets.map((s) =>
          resolveObjectSet(s, ontologyRid, store, linkStore),
        ),
      );
      if (sets.length === 0) return [];
      const ridSets = sets.map((s) => new Set(s.map((o) => o.rid)));
      return sets[0].filter((obj) =>
        ridSets.every((rids) => rids.has(obj.rid)),
      );
    }

    case "SUBTRACT": {
      const [left, right] = objectSetDef.objectSets;
      const leftObjects = await resolveObjectSet(left, ontologyRid, store, linkStore);
      const rightRids = new Set(
        (await resolveObjectSet(right, ontologyRid, store, linkStore)).map((o) => o.rid),
      );
      return leftObjects.filter((obj) => !rightRids.has(obj.rid));
    }

    case "STATIC":
      return store.getObjectsByKeys(ontologyRid, objectSetDef.objectType, objectSetDef.primaryKeys);

    case "SEARCH_AROUND": {
      const sourceObjects = await resolveObjectSet(objectSetDef.objectSet, ontologyRid, store, linkStore);
      const result: StoredObject[] = [];
      const seen = new Set<string>();
      for (const source of sourceObjects) {
        const targets = await linkStore.getLinkedObjects(
          ontologyRid,
          source.objectType,
          source.primaryKey,
          objectSetDef.link,
        );
        for (const target of targets) {
          try {
            const obj = await store.getObject(ontologyRid, target.targetObjectType, target.targetPrimaryKey);
            if (!seen.has(obj.rid)) {
              seen.add(obj.rid);
              result.push(obj);
            }
          } catch {
            // Skip objects that no longer exist
          }
        }
      }
      return result;
    }

    default:
      throw invalidArgument(
        "objectSet.type",
        `unsupported object set type "${(objectSetDef as { type?: unknown }).type}"`,
      );
  }
}

// ---------------------------------------------------------------------------
// Resolve object set from API wire format (lowercase types + where clauses)
// ---------------------------------------------------------------------------

/**
 * Resolves an object set definition in the API wire format which supports
 * lowercase type names ("base", "filter") and "where" clauses in addition
 * to the internal canonical format.
 */
/** Refuse any `where` clause type the evaluator does not know, before evaluating. */
function assertWhere(where: unknown, path = "where"): void {
  if (typeof where !== "object" || where === null) throw invalidArgument(path, "must be a filter object");
  const w = where as { type?: unknown; value?: unknown; filter?: unknown };
  const type = String(w.type ?? "").toLowerCase();
  if (!WHERE_TYPES.has(type)) throw invalidArgument(`${path}.type`, `${String(w.type)} is not a supported filter type`);
  if (type === "and" || type === "or") {
    if (!Array.isArray(w.value)) throw invalidArgument(`${path}.value`, "must be an array of filters");
    w.value.forEach((inner, i) => assertWhere(inner, `${path}.value[${i}]`));
  }
  if (type === "not") assertWhere(w.filter ?? w.value, `${path}.value`);
}

const MAX_DERIVED_HOPS = 3;
const MAX_NEIGHBORS = 500;

/**
 * Follow a `searchAround` chain rooted at `methodInput` from one object: the
 * objects a derived property aggregates over. At most three hops, as Foundry
 * caps derived-property link traversal.
 */
async function linkedFrom(
  source: StoredObject,
  chain: Record<string, unknown>,
  ontologyRid: string,
  store: ObjectReadWriteStore,
  linkStore: LinkReadWriteStore,
): Promise<StoredObject[]> {
  const links: string[] = [];
  let node: Record<string, unknown> | undefined = chain;
  while (node && String(node.type ?? "").toLowerCase() === "searcharound") {
    links.unshift(String(node.link ?? ""));
    node = node.objectSet as Record<string, unknown> | undefined;
  }
  if (!node || String(node.type ?? "").toLowerCase() !== "methodinput" || links.length === 0) {
    throw invalidArgument("derivedProperties", "objectSet must be searchAround links rooted at methodInput");
  }
  if (links.length > MAX_DERIVED_HOPS) {
    throw invalidArgument("derivedProperties", `at most ${MAX_DERIVED_HOPS} link hops`);
  }
  let frontier = [source];
  for (const link of links) {
    const next = new Map<string, StoredObject>();
    for (const obj of frontier) {
      for (const t of await linkStore.getLinkedObjects(ontologyRid, obj.objectType, obj.primaryKey, link)) {
        try {
          const target = await store.getObject(ontologyRid, t.targetObjectType, t.targetPrimaryKey);
          next.set(target.rid, target);
        } catch {
          // a link to an object that no longer exists contributes nothing
        }
      }
    }
    frontier = [...next.values()];
  }
  return frontier;
}

/** Foundry's `SelectedPropertyOperation` over the linked objects. */
function aggregateSelection(objects: StoredObject[], operation: Record<string, unknown>): unknown {
  const op = String(operation.type ?? "").toLowerCase();
  if (op === "count") return objects.length;
  const property = String(operation.selectedPropertyApiName ?? "");
  const values = objects.map((o) => o.properties[property]).filter((v) => v !== undefined && v !== null);
  if (op === "approximatedistinct") return new Set(values.map((v) => JSON.stringify(v))).size;
  const numbers = values.filter((v): v is number => typeof v === "number");
  switch (op) {
    case "sum":
      return numbers.reduce((a, b) => a + b, 0);
    case "avg":
      return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
    case "min":
      return numbers.length ? Math.min(...numbers) : null;
    case "max":
      return numbers.length ? Math.max(...numbers) : null;
    default:
      throw invalidArgument("derivedProperties", `${String(operation.type)} is not a supported operation`);
  }
}

const cosine = (a: number[], b: number[]) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na === 0 || nb === 0 ? 0 : dot / Math.sqrt(na * nb);
};

async function resolveApiObjectSet(
  objectSetDef: Record<string, unknown>,
  ontologyRid: string,
  store: ObjectReadWriteStore,
  linkStore: LinkReadWriteStore,
  interfaces: InterfaceSource,
): Promise<StoredObject[]> {
  const type = String(objectSetDef.type ?? "").toUpperCase();

  // First, try to use it as a canonical ObjectSet if the type matches
  if (type === "BASE" && objectSetDef.objectType) {
    return store.allObjects(ontologyRid, String(objectSetDef.objectType));
  }

  if (type === "FILTER") {
    const inner = objectSetDef.objectSet as Record<string, unknown> | undefined;
    const source = inner
      ? await resolveApiObjectSet(inner, ontologyRid, store, linkStore, interfaces)
      : [];

    // Support "where" clause (API wire format)
    if (objectSetDef.where) {
      assertWhere(objectSetDef.where);
      const where = objectSetDef.where as WhereClause;
      return source.filter((obj) =>
        queryEngine.evaluateWhere(obj as unknown as Record<string, unknown>, where),
      );
    }

    // Support "filter" (canonical format)
    if (objectSetDef.filter) {
      return source.filter((obj) =>
        evaluateFilter(obj, objectSetDef.filter as any),
      );
    }

    return source;
  }

  if (type === "UNION") {
    const sets = (objectSetDef.objectSets as Record<string, unknown>[]) ?? [];
    const seen = new Set<string>();
    const result: StoredObject[] = [];
    for (const setDef of sets) {
      for (const obj of await resolveApiObjectSet(setDef, ontologyRid, store, linkStore, interfaces)) {
        if (!seen.has(obj.rid)) {
          seen.add(obj.rid);
          result.push(obj);
        }
      }
    }
    return result;
  }

  if (type === "INTERSECT") {
    const sets = (objectSetDef.objectSets as Record<string, unknown>[]) ?? [];
    if (sets.length === 0) return [];
    const resolved = await Promise.all(
      sets.map((s) => resolveApiObjectSet(s, ontologyRid, store, linkStore, interfaces)),
    );
    const ridSets = resolved.map((s) => new Set(s.map((o) => o.rid)));
    return resolved[0].filter((obj) =>
      ridSets.every((rids) => rids.has(obj.rid)),
    );
  }

  if (type === "SUBTRACT") {
    const sets = (objectSetDef.objectSets as Record<string, unknown>[]) ?? [];
    if (sets.length < 2) return [];
    const left = await resolveApiObjectSet(sets[0], ontologyRid, store, linkStore, interfaces);
    const rightRids = new Set(
      (await resolveApiObjectSet(sets[1], ontologyRid, store, linkStore, interfaces)).map((o) => o.rid),
    );
    return left.filter((obj) => !rightRids.has(obj.rid));
  }

  if (type === "STATIC") {
    const keys = (objectSetDef.primaryKeys as string[]) ?? [];
    return store.getObjectsByKeys(ontologyRid, String(objectSetDef.objectType ?? ""), keys);
  }

  if (type === "SEARCH_AROUND" || type === "SEARCHAROUND") {
    const inner = objectSetDef.objectSet as Record<string, unknown> | undefined;
    const sourceObjects = inner
      ? await resolveApiObjectSet(inner, ontologyRid, store, linkStore, interfaces)
      : [];
    const link = String(objectSetDef.link ?? "");
    const result: StoredObject[] = [];
    const seen = new Set<string>();
    for (const source of sourceObjects) {
      const targets = await linkStore.getLinkedObjects(
        ontologyRid,
        source.objectType,
        source.primaryKey,
        link,
      );
      for (const target of targets) {
        try {
          const obj = await store.getObject(ontologyRid, target.targetObjectType, target.targetPrimaryKey);
          if (!seen.has(obj.rid)) {
            seen.add(obj.rid);
            result.push(obj);
          }
        } catch {
          // Skip objects that no longer exist
        }
      }
    }
    return result;
  }

  // Foundry's `asType`: the objects of the set that are of one type.
  if (type === "ASTYPE") {
    const inner = objectSetDef.objectSet as Record<string, unknown> | undefined;
    const entityType = String(objectSetDef.entityType ?? objectSetDef.objectType ?? "");
    if (!inner || !entityType) throw invalidArgument("objectSet", "asType needs objectSet and entityType");
    return (await resolveApiObjectSet(inner, ontologyRid, store, linkStore, interfaces)).filter((o) => o.objectType === entityType);
  }

  // Foundry's `asBaseObjectTypes`: objects here are always of their base types.
  if (type === "ASBASEOBJECTTYPES") {
    const inner = objectSetDef.objectSet as Record<string, unknown> | undefined;
    if (!inner) throw invalidArgument("objectSet", "asBaseObjectTypes needs objectSet");
    return resolveApiObjectSet(inner, ontologyRid, store, linkStore, interfaces);
  }

  // Foundry's `withProperties`: each object gains derived properties, each an
  // aggregate (count, sum, avg, min, max, approximateDistinct) over objects
  // reached by up to three links. Later filters and ordering can use them.
  if (type === "WITHPROPERTIES") {
    const inner = objectSetDef.objectSet as Record<string, unknown> | undefined;
    const derived = objectSetDef.derivedProperties as Record<string, Record<string, unknown>> | undefined;
    if (!inner || !derived || typeof derived !== "object") {
      throw invalidArgument("objectSet", "withProperties needs objectSet and derivedProperties");
    }
    for (const [name, def] of Object.entries(derived)) {
      if (String(def?.type ?? "").toLowerCase() !== "selection") {
        throw invalidArgument(`derivedProperties.${name}`, "only selection derived properties are supported");
      }
    }
    const objects = await resolveApiObjectSet(inner, ontologyRid, store, linkStore, interfaces);
    return Promise.all(
      objects.map(async (obj) => {
        const extra: Record<string, unknown> = {};
        for (const [name, def] of Object.entries(derived)) {
          const linked = await linkedFrom(obj, def.objectSet as Record<string, unknown>, ontologyRid, store, linkStore);
          extra[name] = aggregateSelection(linked, (def.operation ?? {}) as Record<string, unknown>);
        }
        return { ...obj, properties: { ...obj.properties, ...extra } };
      }),
    );
  }

  // Foundry's `nearestNeighbors` over a vector property. Only a vector query:
  // a text query needs an embedding model this service does not have.
  if (type === "NEARESTNEIGHBORS") {
    const inner = objectSetDef.objectSet as Record<string, unknown> | undefined;
    const identifier = objectSetDef.propertyIdentifier as { apiName?: string } | string | undefined;
    const property = typeof identifier === "string" ? identifier : identifier?.apiName;
    const k = Number(objectSetDef.numNeighbors);
    const query = objectSetDef.query as { type?: string; value?: unknown } | undefined;
    if (!inner || !property) throw invalidArgument("objectSet", "nearestNeighbors needs objectSet and propertyIdentifier");
    if (!Number.isInteger(k) || k < 1 || k > MAX_NEIGHBORS) {
      throw invalidArgument("numNeighbors", `must be an integer from 1 to ${MAX_NEIGHBORS}`);
    }
    if (String(query?.type ?? "").toLowerCase() !== "vector" || !Array.isArray(query?.value) || !query.value.every((x) => typeof x === "number")) {
      throw invalidArgument("query", "must be { type: \"vector\", value: number[] }; text queries need an embedding model");
    }
    const target = query.value as number[];
    return (await resolveApiObjectSet(inner, ontologyRid, store, linkStore, interfaces))
      .map((obj) => ({ obj, v: obj.properties[property] }))
      .filter((x): x is { obj: StoredObject; v: number[] } => Array.isArray(x.v) && x.v.length === target.length)
      .map(({ obj, v }) => ({ obj, score: cosine(v, target) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(({ obj }) => obj);
  }

  // Foundry's `interfaceBase`: every object of every type implementing the
  // interface. ponytail: objects come back with their own properties - no
  // interface-to-object property mapping is declared, so none is applied.
  if (type === "INTERFACEBASE") {
    const interfaceType = String(objectSetDef.interfaceType ?? "");
    const types = await interfaces.implementingObjectTypes(ontologyRid, interfaceType);
    if (!types) throw notFound("InterfaceType", interfaceType);
    return (await Promise.all(types.map((t) => store.allObjects(ontologyRid, t)))).flat();
  }

  return resolveObjectSet(objectSetDef as unknown as ObjectSet, ontologyRid, store, linkStore);
}

/**
 * The object types a set draws its results from, per the definition alone.
 *
 * Only `base` and `static` name a type; every other form has to be walked to
 * its leaves. `intersect` and `subtract` draw only from their first operand,
 * `union` from all of them. Returns `undefined` whenever the definition cannot
 * say - an unnamed leaf, an empty set, or a `searchAround`, whose results are
 * of the link type's target rather than of anything the body names - so the
 * caller makes no claim it has no grounds for.
 */
function objectSetLeafTypes(
  objectSetDef: Record<string, unknown>,
): string[] | undefined {
  const type = String(objectSetDef.type ?? "").toUpperCase();

  if (type === "BASE" || type === "STATIC") {
    return typeof objectSetDef.objectType === "string"
      ? [objectSetDef.objectType]
      : undefined;
  }

  if (type === "FILTER") {
    const inner = objectSetDef.objectSet as Record<string, unknown> | undefined;
    return inner ? objectSetLeafTypes(inner) : undefined;
  }

  if (type === "INTERSECT" || type === "SUBTRACT") {
    const sets = (objectSetDef.objectSets as Record<string, unknown>[]) ?? [];
    return sets.length > 0 ? objectSetLeafTypes(sets[0]) : undefined;
  }

  if (type === "UNION") {
    const sets = (objectSetDef.objectSets as Record<string, unknown>[]) ?? [];
    if (sets.length === 0) return undefined;
    const nested = sets.map(objectSetLeafTypes);
    if (nested.some((types) => types === undefined)) return undefined;
    return [...new Set((nested as string[][]).flat())];
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Request / response types
// ---------------------------------------------------------------------------

interface OntologyParams {
  ontologyRid: string;
}

interface LoadObjectsBody {
  objectSet: Record<string, unknown>;
  select?: string[];
  pageSize?: number;
  pageToken?: string;
  orderBy?: OrderByClause[];
}

interface AggregateBody {
  objectSet: Record<string, unknown>;
  aggregation: Array<AggregationDef & { type: string }>;
  groupBy?: GroupByDef[];
}

interface SearchBody {
  objectSet: Record<string, unknown>;
  query: string;
  fields?: string[];
  orderBy?: { field: string; direction: "asc" | "desc" };
  pageSize?: number;
  pageToken?: string;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/** Foundry's largest `pageSize` for loading objects. */
const MAX_PAGE_SIZE = 10_000;

/**
 * Objects one object set may resolve to before a request is refused.
 *
 * ponytail: the set is resolved in memory and then counted, so the cap bounds
 * response and sort cost, not resolution cost; push limits into the store's
 * queries when sets outgrow memory.
 */
const DEFAULT_MAX_OBJECT_SET_SIZE = 100_000;

/** Foundry's `ObjectsExceededLimit`: the set is larger than this API returns. */
function objectsExceededLimit(limit: number): OpenFoundryApiError {
  return new OpenFoundryApiError({
    errorCode: ErrorCode.INVALID_ARGUMENT,
    errorName: "ObjectsExceededLimit",
    message: `The object set resolves to more than ${limit} objects; narrow it with a filter.`,
    args: [safeArg("limit", limit)],
  });
}

function parsePageSize(value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || (value as number) < 1 || (value as number) > MAX_PAGE_SIZE) {
    throw invalidArgument("pageSize", `must be an integer from 1 to ${MAX_PAGE_SIZE}`);
  }
  return value as number;
}

/** Digest of what decides a page's contents; a page token is valid only for it. */
const queryHash = (query: unknown) =>
  createHash("sha256").update(JSON.stringify(query)).digest("base64url").slice(0, 16);

function readPageToken(token: unknown, hash: string): number {
  if (token === undefined || token === null || token === "") return 0;
  let cursor;
  try {
    cursor = decodePageToken(token as PageToken);
  } catch {
    throw invalidArgument("pageToken", "is not a page token this service issued");
  }
  if (cursor.queryHash !== undefined && cursor.queryHash !== hash) {
    throw invalidArgument("pageToken", "was issued for a different query; start again without it");
  }
  return cursor.offset;
}

export async function objectSetRoutes(
  app: FastifyInstance,
  opts: {
    store: ObjectReadWriteStore;
    linkStore: LinkReadWriteStore;
    objectTypeSchema?: ObjectTypeSchemaSource;
    interfaces: InterfaceSource;
    maxObjectSetSize?: number;
  },
): Promise<void> {
  const { store, linkStore, objectTypeSchema, interfaces } = opts;
  const maxObjectSetSize = opts.maxObjectSetSize ?? DEFAULT_MAX_OBJECT_SET_SIZE;
  const resolveBounded = async (objectSetDef: Record<string, unknown>, ontologyRid: string) => {
    const objects = await resolveApiObjectSet(objectSetDef, ontologyRid, store, linkStore, interfaces);
    if (objects.length > maxObjectSetSize) throw objectsExceededLimit(maxObjectSetSize);
    return objects;
  };

  const declaredProperties = (ontologyRid: string, objectType: string) =>
    objectTypeSchema
      ? objectTypeSchema.propertyNames(ontologyRid, objectType)
      : store.propertyNames?.(ontologyRid, objectType);

  /**
   * The properties declared across the object types an object set draws from.
   *
   * A union spans several types, so a name is known when any of them declares
   * it. `properties` stays `undefined` if the leaves cannot be resolved or any
   * one of them has no declaration, since an incomplete union would call a
   * legitimate name unknown.
   */
  const declaredForSet = async (
    ontologyRid: string,
    objectSetDef: Record<string, unknown>,
  ): Promise<{ objectTypes: string[]; properties?: ReadonlySet<string> }> => {
    const types = objectSetLeafTypes(objectSetDef);
    if (!types || types.length === 0) return { objectTypes: [] };

    const sets = await Promise.all(
      types.map((type) => declaredProperties(ontologyRid, type)),
    );
    if (sets.some((set) => set === undefined)) return { objectTypes: types };
    return {
      objectTypes: types,
      properties: new Set((sets as ReadonlySet<string>[]).flatMap((s) => [...s])),
    };
  };

  // Load objects from an ObjectSet query (enhanced with filter/where support)
  app.post<{
    Params: OntologyParams;
    Querystring: {
      executeInMemoryOnly?: string;
      branch?: string;
      scenarioRid?: string;
      transactionId?: string;
    };
    Body: LoadObjectsBody;
  }>(
    "/ontologies/:ontologyRid/objectSets/loadObjects",
    {
      preHandler: requirePermission("objects:read"),
    },
    async (request) => {
      rejectUnsupportedOntologyScoping(request.query);
      // The object set is resolved entirely from the in-memory object store,
      // so the in-memory-only guarantee always holds; the flag is validated
      // rather than silently swallowed.
      parseBooleanParam("executeInMemoryOnly", request.query.executeInMemoryOnly);
      const { ontologyRid } = request.params;
      const { objectSet: objectSetDef, pageToken } = request.body;
      const pageSize = parsePageSize(request.body.pageSize, 100);
      const select = assertStringListBody("select", request.body.select);
      const orderBy = assertOrderByClauseListBody("orderBy", request.body.orderBy);
      const hash = queryHash({ objectSetDef, orderBy, select, ontologyRid });
      const offset = readPageToken(pageToken, hash);

      const declared = await declaredForSet(ontologyRid, objectSetDef);
      assertPropertiesExist(declared.objectTypes, declared.properties, select);
      assertPropertiesExist(
        declared.objectTypes,
        declared.properties,
        orderBy?.map((clause) => clause.field),
      );

      let objects = await resolveBounded(objectSetDef, ontologyRid);

      // Apply ordering
      if (orderBy && orderBy.length > 0) {
        objects = [...objects].sort((a, b) => {
          for (const clause of orderBy) {
            const aVal = a.properties[clause.field];
            const bVal = b.properties[clause.field];

            if (aVal === bVal) continue;
            if (aVal === undefined || aVal === null) return 1;
            if (bVal === undefined || bVal === null) return -1;

            const cmp = aVal < bVal ? -1 : 1;
            return clause.direction === "desc" ? -cmp : cmp;
          }
          return 0;
        });
      }

      const totalCount = objects.length;

      const slice = objects.slice(offset, offset + pageSize + 1);
      const hasMore = slice.length > pageSize;
      let data: StoredObject[] = hasMore ? slice.slice(0, pageSize) : slice;

      // Apply select (property projection)
      if (select && select.length > 0) {
        data = data.map((obj) => {
          const filtered: Record<string, unknown> = {};
          for (const prop of select) {
            if (prop in obj.properties) {
              filtered[prop] = obj.properties[prop];
            }
          }
          return { ...obj, properties: filtered };
        });
      }

      const result: {
        data: StoredObject[];
        totalCount: number;
        nextPageToken?: string;
      } = { data, totalCount };

      if (hasMore) {
        result.nextPageToken = encodePageToken({ offset: offset + pageSize, queryHash: hash });
      }

      return result;
    },
  );

  // Aggregate over an ObjectSet
  app.post<{
    Params: OntologyParams;
    Querystring: {
      executeInMemoryOnly?: string;
      branch?: string;
      scenarioRid?: string;
      transactionId?: string;
    };
    Body: AggregateBody;
  }>(
    "/ontologies/:ontologyRid/objectSets/aggregate",
    {
      preHandler: requirePermission("objects:read"),
    },
    async (request) => {
      rejectUnsupportedOntologyScoping(request.query);
      // See loadObjects: aggregation runs over the in-memory object store.
      parseBooleanParam("executeInMemoryOnly", request.query.executeInMemoryOnly);
      const { ontologyRid } = request.params;
      const { objectSet: objectSetDef, aggregation: aggregations, groupBy } = request.body;

      const objects = await resolveBounded(objectSetDef, ontologyRid);

      if (groupBy && groupBy.length > 0) {
        // Grouped aggregation: use query engine, return new format
        const aggDefs: AggregationDef[] = aggregations.map((a) => ({
          type: a.type,
          field: a.field ?? (a as unknown as Record<string, unknown>).property as string | undefined,
          name: a.name ?? a.type,
        }));

        const results = queryEngine.aggregate(
          objects as unknown as Record<string, unknown>[],
          aggDefs,
          groupBy,
        );

        return { data: results };
      }

      // No groupBy: backward-compatible flat array of AggregationResult objects
      // Each aggregation becomes its own entry in the array
      const data = aggregations.map((agg) => {
        const aggType = agg.type.toUpperCase();
        const property = agg.field ?? (agg as unknown as Record<string, unknown>).property as string | undefined;

        // Use the evaluateAggregation helper for canonical format
        const canonical = {
          type: aggType,
          ...(property ? { property } : {}),
        } as unknown as Aggregation;

        return evaluateAggregation(objects, canonical);
      });

      return { data };
    },
  );

  // Full-text search within an ObjectSet
  app.post<{ Params: OntologyParams; Body: SearchBody }>(
    "/ontologies/:ontologyRid/objectSets/search",
    {
      preHandler: requirePermission("objects:read"),
    },
    async (request) => {
      const { ontologyRid } = request.params;
      const {
        objectSet: objectSetDef,
        query,
        fields,
        orderBy,
        pageSize = 20,
        pageToken,
      } = request.body;

      const objects = await resolveBounded(objectSetDef, ontologyRid);

      const result = queryEngine.search(
        objects as unknown as Record<string, unknown>[],
        { query, fields, orderBy, pageSize, pageToken },
      );

      return {
        data: result.data,
        totalCount: result.totalCount,
        nextPageToken:
          result.data.length < result.totalCount
            ? String(
                (pageToken ? parseInt(pageToken, 10) : 0) + result.data.length,
              )
            : undefined,
      };
    },
  );
}
