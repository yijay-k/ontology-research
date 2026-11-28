/**
 * Apache Ossie interchange for object types and link types.
 *
 * Ossie (formerly Open Semantic Interchange; spec 0.3.0.dev0, core-spec/spec.md
 * in apache/ossie) is the format NVIDIA Auto Ontology, dbt and others export
 * semantic models in. Exporting lets those tools read our model; importing
 * lets a model they drafted seed ours (research: cold start; NVIDIA review).
 *
 * The mapping:
 *   object type  <-> dataset (name, source, primary_key, fields)
 *   property     <-> field (expression.sql is the source column, datatype)
 *   link type    <-> relationship (from = side holding the foreign key)
 *   agentDescription <-> ai_context.instructions; synonyms are kept on import
 * Ossie has no actions, permissions or lifecycle, and our model has no
 * metrics yet, so those are reported as skipped rather than dropped silently.
 */
import type { LinkTypeDefinition, ObjectTypeDefinition } from "@openfoundry/ontology-schema";

export const OSSIE_VERSION = "0.3.0.dev0";
const VENDOR = "OPENFOUNDRY";

type AiContext = string | { instructions?: string; synonyms?: string[]; examples?: string[] };

export interface OssieField {
  name: string;
  expression: { sql: string };
  description?: string;
  datatype?: string;
  ai_context?: AiContext;
  nonportable_extensions?: Array<{ vendor_name: string; data: Record<string, unknown> }>;
}

export interface OssieMetric {
  name: string;
  expression: { sql: string };
  description?: string;
}

export interface OssieDataset {
  name: string;
  source: string;
  primary_key?: string[];
  description?: string;
  ai_context?: AiContext;
  fields?: OssieField[];
  metrics?: OssieMetric[];
}

const AGGREGATE_SQL: Record<string, string> = { sum: "SUM", avg: "AVG", min: "MIN", max: "MAX", count: "COUNT", countDistinct: "COUNT" };

/** An Ossie metric expression of the simple `AGG(field)` shape as our measure, else undefined. */
function parseAggregate(sql: string, fields: Set<string>): { type: string; property?: string } | undefined {
  const m = /^\s*(SUM|AVG|MIN|MAX|COUNT)\s*\(\s*(DISTINCT\s+)?(?:\w+\.)?(\w+|\*)\s*\)\s*$/i.exec(sql);
  if (!m) return undefined;
  const fn = m[1].toUpperCase();
  const field = m[3];
  if (fn === "COUNT") {
    if (m[2]) return fields.has(field) ? { type: "countDistinct", property: field } : undefined;
    return { type: "count" };
  }
  if (!fields.has(field)) return undefined;
  return { type: fn.toLowerCase(), property: field };
}

export interface OssieRelationship {
  name: string;
  from: string;
  to: string;
  from_columns: string[];
  to_columns: string[];
  ai_context?: AiContext;
}

export interface OssieModel {
  version: string;
  name: string;
  description?: string;
  ai_context?: AiContext;
  datasets: OssieDataset[];
  relationships?: OssieRelationship[];
  metrics?: unknown[];
}

// Ours -> Ossie. Ours are upper case in the schema; seeds use lower case.
const TO_OSSIE: Record<string, string> = {
  STRING: "String", INTEGER: "Integer", LONG: "Integer", SHORT: "Integer", BYTE: "Integer",
  DOUBLE: "Float", FLOAT: "Float", DECIMAL: "Decimal", BOOLEAN: "Boolean",
  DATE: "Date", TIMESTAMP: "DateTimeTz",
};
const FROM_OSSIE: Record<string, string> = {
  String: "STRING", Integer: "INTEGER", Decimal: "DECIMAL", Float: "DOUBLE", Boolean: "BOOLEAN",
  Date: "DATE", Time: "STRING", DateTime: "TIMESTAMP", DateTimeTz: "TIMESTAMP", Opaque: "STRING",
};

const keyOf = (t: ObjectTypeDefinition) =>
  t.primaryKeyApiName ?? (t as unknown as { primaryKey?: string }).primaryKey;

/** Our model as an Ossie semantic model. */
export function toOssie(
  ontology: { apiName: string; displayName?: string; description?: string },
  objectTypes: ObjectTypeDefinition[],
  linkTypes: LinkTypeDefinition[],
): { model: OssieModel; skipped: string[] } {
  const skipped: string[] = [];
  const byName = new Map(objectTypes.map((t) => [t.apiName, t]));
  const datasets: OssieDataset[] = objectTypes.map((t) => {
    const source = t.datasources?.[0]?.definition;
    const columnOf = (property: string) => {
      const mapping = source?.propertyMapping?.[property];
      return mapping?.type === "column" && mapping.column ? mapping.column : property;
    };
    const key = keyOf(t);
    return {
      name: t.apiName,
      // A dataset-backed type names its dataset; others are only addressable here.
      source: source?.datasetRid ?? `openfoundry:${ontology.apiName}.${t.apiName}`,
      ...(key ? { primary_key: [key] } : {}),
      ...(t.description ? { description: t.description } : {}),
      ...(t.agentDescription ? { ai_context: { instructions: t.agentDescription } } : {}),
      ...(t.metrics && Object.keys(t.metrics).length
        ? {
            metrics: Object.entries(t.metrics)
              .filter(([, m]) => !m.filter) // a filtered metric has no portable Ossie form here
              .map(([name, m]) => ({
                name,
                expression: {
                  sql: `${AGGREGATE_SQL[m.measure.type]}(${m.measure.type === "countDistinct" ? "DISTINCT " : ""}${m.measure.property ?? "*"})`,
                },
                ...(m.description ? { description: m.description } : {}),
              })),
          }
        : {}),
      fields: Object.entries(t.properties ?? {}).map(([name, p]) => {
        const prop = p as { type?: string; description?: string; editable?: boolean };
        const datatype = TO_OSSIE[String(prop.type ?? "").toUpperCase()];
        return {
          name,
          expression: { sql: columnOf(name) },
          ...(datatype ? { datatype } : {}),
          ...(prop.description ? { description: prop.description } : {}),
          ...(prop.editable === false ? { nonportable_extensions: [{ vendor_name: VENDOR, data: { editable: false } }] } : {}),
        };
      }),
    };
  });

  const relationships: OssieRelationship[] = [];
  for (const l of linkTypes) {
    const target = byName.get(l.linkedObjectTypeApiName);
    const targetKey = target ? keyOf(target) : undefined;
    if (!l.foreignKeyPropertyApiName || !targetKey) {
      skipped.push(`link ${l.apiName}: no foreign key property to express as a relationship`);
      continue;
    }
    relationships.push({
      name: l.apiName,
      from: l.objectTypeApiName,
      to: l.linkedObjectTypeApiName,
      from_columns: [l.foreignKeyPropertyApiName],
      to_columns: [targetKey],
    });
  }

  return {
    model: {
      version: OSSIE_VERSION,
      name: ontology.apiName,
      ...(ontology.description ? { description: ontology.description } : {}),
      datasets,
      ...(relationships.length ? { relationships } : {}),
    },
    skipped,
  };
}

export interface ImportPlan {
  objectTypes: ObjectTypeDefinition[];
  linkTypes: LinkTypeDefinition[];
  skipped: string[];
}

const API_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;

function instructionsOf(ctx: AiContext | undefined): string | undefined {
  if (!ctx) return undefined;
  if (typeof ctx === "string") return ctx;
  const parts = [ctx.instructions, ctx.synonyms?.length ? `Also called: ${ctx.synonyms.join(", ")}.` : undefined];
  return parts.filter(Boolean).join(" ") || undefined;
}

/**
 * An Ossie model as definitions to create. Every type arrives EXPERIMENTAL:
 * an imported or model-drafted definition is a proposal until a person
 * promotes it (research R25), and agents only see ACTIVE types.
 */
export function fromOssie(model: OssieModel): ImportPlan {
  if (!model || typeof model !== "object" || !Array.isArray(model.datasets)) {
    throw new Error("not an Ossie semantic model: `datasets` must be an array");
  }
  const skipped: string[] = [];
  const objectTypes: ObjectTypeDefinition[] = [];
  const keys = new Map<string, string>();

  for (const d of model.datasets) {
    if (!d?.name || !API_NAME.test(d.name)) {
      skipped.push(`dataset ${String(d?.name)}: name is not a valid apiName`);
      continue;
    }
    if (!d.primary_key || d.primary_key.length !== 1) {
      skipped.push(`dataset ${d.name}: needs exactly one primary key field (composite keys are not supported)`);
      continue;
    }
    const properties: Record<string, unknown> = {};
    for (const f of d.fields ?? []) {
      const editable = f.nonportable_extensions?.find((e) => e.vendor_name === VENDOR)?.data?.editable;
      properties[f.name] = {
        type: FROM_OSSIE[f.datatype ?? ""] ?? "STRING",
        nullable: f.name !== d.primary_key[0],
        multiplicity: "SINGLE",
        ...(f.description ? { description: f.description } : {}),
        ...(editable === false ? { editable: false } : {}),
      };
    }
    if (!Object.hasOwn(properties, d.primary_key[0])) {
      skipped.push(`dataset ${d.name}: primary key ${d.primary_key[0]} is not one of its fields`);
      continue;
    }
    const metrics: Record<string, unknown> = {};
    for (const metric of d.metrics ?? []) {
      const measure = metric?.expression?.sql ? parseAggregate(metric.expression.sql, new Set(Object.keys(properties))) : undefined;
      if (!measure) {
        skipped.push(`dataset ${d.name}: metric ${metric?.name ?? "?"} is not a single AGG(field) expression`);
        continue;
      }
      metrics[metric.name] = { measure, ...(metric.description ? { description: metric.description } : {}) };
    }
    keys.set(d.name, d.primary_key[0]);
    const agentDescription = instructionsOf(d.ai_context);
    objectTypes.push({
      apiName: d.name,
      displayName: d.name,
      description: d.description ?? "",
      ...(agentDescription ? { agentDescription } : {}),
      primaryKeyApiName: d.primary_key[0],
      primaryKeyType: (properties[d.primary_key[0]] as { type: string }).type,
      titlePropertyApiName: d.primary_key[0],
      properties,
      ...(Object.keys(metrics).length ? { metrics } : {}),
      implements: [],
      status: "EXPERIMENTAL",
    } as unknown as ObjectTypeDefinition);
  }

  const linkTypes: LinkTypeDefinition[] = [];
  for (const r of model.relationships ?? []) {
    if (!keys.has(r.from) || !keys.has(r.to)) {
      skipped.push(`relationship ${r.name}: ${!keys.has(r.from) ? r.from : r.to} was not imported`);
      continue;
    }
    if (r.from_columns?.length !== 1 || r.to_columns?.[0] !== keys.get(r.to)) {
      skipped.push(`relationship ${r.name}: only single-field joins onto the target's primary key are supported`);
      continue;
    }
    linkTypes.push({
      apiName: r.name,
      objectTypeApiName: r.from,
      linkedObjectTypeApiName: r.to,
      cardinality: "ONE",
      foreignKeyPropertyApiName: r.from_columns[0],
    } as LinkTypeDefinition);
  }
  for (const metric of model.metrics ?? []) {
    skipped.push(`metric ${(metric as { name?: string }).name ?? "?"}: model-scoped metrics span datasets; declare it on one type`);
  }
  return { objectTypes, linkTypes, skipped };
}
