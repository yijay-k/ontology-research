/**
 * Querying a governed metric - an openfoundry extension, not a Foundry endpoint:
 *   POST /ontologies/:ontologyRid/objectSets/metrics/query
 *   { objectType, metric, from?, to?, grain?, groupBy?: ["status", "owedBy.rating"] }
 *
 * The metric's measure, filter and time property come from its definition on
 * the object type; the caller chooses only the period, grain and grouping.
 *
 * A group-by may reach across one link to the linked object's property, but
 * only a cardinality-ONE link: each object then joins to at most one other, so
 * every object is counted once. Grouping across a one-to-many link would count
 * an object once per linked object and inflate sums - the fan-out MetricFlow's
 * join rule refuses (research proofs M1-M5: 420 reported against 220 real).
 */
import type { FastifyInstance } from "fastify";
import { ErrorCode, OpenFoundryApiError, invalidArgument, notFound, safeArg } from "@openfoundry/errors";
import { requirePermission } from "@openfoundry/permissions";
import { ObjectSetQueryEngine, WHERE_TYPES, type WhereClause } from "@openfoundry/object-set";
import { GRAINS, measure, periodOf, type Grain, type MetricDefinition } from "@openfoundry/ontology-schema";
import type { ObjectReadWriteStore, StoredObject } from "../../store/object-store.js";
import type { LinkReadWriteStore } from "../../store/link-store.js";
import type { LinkTypeSource } from "../../sync/http-sources.js";
import type { SyncSources } from "../../sync/sync-object-type.js";

const engine = new ObjectSetQueryEngine();
const MAX_GROUPS = 10_000;

function fanOutRefused(link: string, cardinality: string): OpenFoundryApiError {
  return new OpenFoundryApiError({
    errorCode: ErrorCode.INVALID_ARGUMENT,
    errorName: "MetricFanOutRefused",
    message: `Grouping across ${link} (cardinality ${cardinality}) would count objects once per linked object; group only across cardinality ONE links`,
    args: [safeArg("link", link)],
  });
}

interface Body {
  objectType?: unknown;
  metric?: unknown;
  from?: unknown;
  to?: unknown;
  grain?: unknown;
  groupBy?: unknown;
}

export async function metricRoutes(
  app: FastifyInstance,
  opts: { store: ObjectReadWriteStore; linkStore: LinkReadWriteStore; definitions: Pick<SyncSources, "getObjectType">; linkTypes: LinkTypeSource },
): Promise<void> {
  app.post<{ Params: { ontologyRid: string }; Body: Body }>(
    "/ontologies/:ontologyRid/objectSets/metrics/query",
    { preHandler: requirePermission("objects:read") },
    async (request) => {
      const { ontologyRid } = request.params;
      const body = request.body ?? {};
      if (typeof body.objectType !== "string" || typeof body.metric !== "string") {
        throw invalidArgument("metric", "objectType and metric are required");
      }
      const objectType = await opts.definitions.getObjectType(ontologyRid, body.objectType);
      if (!objectType) throw notFound("ObjectType", body.objectType);
      const metric = objectType.metrics?.[body.metric] as MetricDefinition | undefined;
      if (!metric) throw notFound("Metric", `${body.objectType}.${body.metric}`);

      const grain = body.grain as Grain | undefined;
      if (grain !== undefined && !GRAINS.has(grain)) throw invalidArgument("grain", "must be day, week, month, quarter or year");
      const from = body.from === undefined ? undefined : String(body.from);
      const to = body.to === undefined ? undefined : String(body.to);
      if ((grain || from || to) && !metric.timeProperty) {
        throw invalidArgument("grain", `${body.metric} declares no timeProperty, so it has no periods`);
      }
      for (const [name, v] of [["from", from], ["to", to]] as const) {
        if (v !== undefined && Number.isNaN(Date.parse(v))) throw invalidArgument(name, "must be an ISO date");
      }
      const groupBy = body.groupBy ?? [];
      if (!Array.isArray(groupBy) || !groupBy.every((g) => typeof g === "string" && g.length > 0)) {
        throw invalidArgument("groupBy", "must be an array of property names or link.property paths");
      }

      // Resolve every link group-by first, refusing a fan-out before reading data.
      const linked = new Map<string, string>(); // "link.property" -> link
      for (const g of groupBy as string[]) {
        const dot = g.indexOf(".");
        if (dot === -1) {
          if (!Object.hasOwn(objectType.properties ?? {}, g)) throw invalidArgument("groupBy", `${g} is not a property of ${body.objectType}`);
          continue;
        }
        const link = g.slice(0, dot);
        const declared = await opts.linkTypes.getLinkType(ontologyRid, link);
        if (!declared || declared.objectTypeApiName !== body.objectType) {
          throw invalidArgument("groupBy", `${link} is not a link from ${body.objectType}`);
        }
        if (String(declared.cardinality).toUpperCase() !== "ONE") throw fanOutRefused(link, String(declared.cardinality));
        linked.set(g, link);
      }

      let objects: StoredObject[] = await opts.store.allObjects(ontologyRid, body.objectType);
      if (metric.filter) {
        if (!WHERE_TYPES.has(String(metric.filter.type).toLowerCase())) {
          throw invalidArgument("metric", `${body.metric}'s filter type ${String(metric.filter.type)} is not supported`);
        }
        objects = objects.filter((o) => engine.evaluateWhere(o as unknown as Record<string, unknown>, metric.filter as unknown as WhereClause));
      }
      if (metric.timeProperty && (from || to)) {
        const lo = from ? Date.parse(from) : -Infinity;
        const hi = to ? Date.parse(to) : Infinity;
        objects = objects.filter((o) => {
          const t = Date.parse(String(o.properties[metric.timeProperty!] ?? ""));
          return !Number.isNaN(t) && t >= lo && t < hi;
        });
      }

      // One linked object per link per object at most (cardinality ONE).
      const linkedValue = async (o: StoredObject, path: string) => {
        const link = linked.get(path)!;
        const [target] = await opts.linkStore.getLinkedObjects(ontologyRid, o.objectType, o.primaryKey, link);
        if (!target) return null;
        try {
          return (await opts.store.getObject(ontologyRid, target.targetObjectType, target.targetPrimaryKey)).properties[path.slice(link.length + 1)] ?? null;
        } catch {
          return null;
        }
      };

      const groups = new Map<string, { period?: string; group: Record<string, unknown>; values: unknown[] }>();
      for (const o of objects) {
        const period = grain ? periodOf(o.properties[metric.timeProperty!], grain) : undefined;
        if (grain && period === undefined) continue; // no usable date: outside every period
        const group: Record<string, unknown> = {};
        for (const g of groupBy as string[]) group[g] = linked.has(g) ? await linkedValue(o, g) : (o.properties[g] ?? null);
        const key = JSON.stringify([period, group]);
        let bucket = groups.get(key);
        if (!bucket) {
          if (groups.size >= MAX_GROUPS) throw invalidArgument("groupBy", `more than ${MAX_GROUPS} groups; group more coarsely`);
          groups.set(key, (bucket = { ...(period ? { period } : {}), group, values: [] }));
        }
        bucket.values.push(metric.measure.type === "count" ? 1 : o.properties[metric.measure.property!]);
      }

      const rows = [...groups.values()]
        .map(({ period, group, values }) => ({ ...(period ? { period } : {}), ...(groupBy.length ? { group } : {}), value: measure(metric.measure.type, values), objects: values.length }))
        .sort((a, b) => String(a.period ?? "").localeCompare(String(b.period ?? "")) || JSON.stringify(a.group ?? {}).localeCompare(JSON.stringify(b.group ?? {})));

      return {
        objectType: body.objectType,
        metric: body.metric,
        measure: metric.measure,
        ...(metric.unit ? { unit: metric.unit } : {}),
        ...(grain ? { grain } : {}),
        ...(from || to ? { period: { from: from ?? null, to: to ?? null } } : {}),
        rows: rows.length || groupBy.length || grain ? rows : [{ value: measure(metric.measure.type, []), objects: 0 }],
      };
    },
  );
}
