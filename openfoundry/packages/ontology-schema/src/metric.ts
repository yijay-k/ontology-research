/**
 * Metrics: governed definitions of a number, declared on the object type
 * whose objects they aggregate (Apache Ossie's dataset-scoped metrics).
 *
 * The research's metric rule (R15) is measure + filter + period + grain, not a
 * named query string: the measure and filter are fixed here, the period and
 * grain are chosen at query time against `timeProperty`.
 */

export type MeasureType = "count" | "sum" | "avg" | "min" | "max" | "countDistinct";

export interface MetricDefinition {
  description?: string;
  measure: { type: MeasureType; property?: string };
  /** A `where` clause (object-set filter grammar) every query applies first. */
  filter?: Record<string, unknown>;
  /** The DATE or TIMESTAMP property periods and grains are computed on. */
  timeProperty?: string;
  /** What the number is in, e.g. "EUR" or "days"; shown with every result. */
  unit?: string;
}

export const MEASURE_TYPES: ReadonlySet<string> = new Set(["count", "sum", "avg", "min", "max", "countDistinct"]);
const NUMERIC = new Set(["INTEGER", "LONG", "SHORT", "BYTE", "DOUBLE", "FLOAT", "DECIMAL"]);
const TEMPORAL = new Set(["DATE", "TIMESTAMP"]);
const NAME = /^[A-Za-z][A-Za-z0-9_]*$/;

/** Problems with an object type's metric declarations, against its own properties. */
export function validateMetrics(def: {
  properties?: Record<string, { type?: unknown }>;
  metrics?: Record<string, MetricDefinition>;
}): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];
  const properties = def.properties ?? {};
  const typeOf = (p: string) => String(properties[p]?.type ?? "").toUpperCase();
  for (const [name, m] of Object.entries(def.metrics ?? {})) {
    const at = `metrics.${name}`;
    if (!NAME.test(name)) errors.push({ field: at, message: "name must be a letter followed by letters, digits or _" });
    const type = m?.measure?.type;
    if (!MEASURE_TYPES.has(type)) {
      errors.push({ field: `${at}.measure.type`, message: "must be count, sum, avg, min, max or countDistinct" });
      continue;
    }
    const property = m.measure.property;
    if (type !== "count") {
      if (!property || !Object.hasOwn(properties, property)) {
        errors.push({ field: `${at}.measure.property`, message: `must name a property of this type` });
      } else if (type !== "countDistinct" && !NUMERIC.has(typeOf(property))) {
        errors.push({ field: `${at}.measure.property`, message: `${property} is ${typeOf(property) || "untyped"}, not numeric` });
      }
    }
    if (m.timeProperty !== undefined && (!Object.hasOwn(properties, m.timeProperty) || !TEMPORAL.has(typeOf(m.timeProperty)))) {
      errors.push({ field: `${at}.timeProperty`, message: "must name a DATE or TIMESTAMP property of this type" });
    }
    if (m.filter !== undefined && (typeof m.filter !== "object" || m.filter === null || typeof m.filter.type !== "string")) {
      errors.push({ field: `${at}.filter`, message: "must be a where clause with a type" });
    }
  }
  return errors;
}

export type Grain = "day" | "week" | "month" | "quarter" | "year";
export const GRAINS: ReadonlySet<string> = new Set(["day", "week", "month", "quarter", "year"]);

/** The period an ISO date or timestamp falls in, at a grain: 2026-03-04, 2026-W10, 2026-03, 2026-Q1, 2026. */
export function periodOf(value: unknown, grain: Grain): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = Date.parse(value.length === 10 ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(t)) return undefined;
  const d = new Date(t);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (grain) {
    case "day":
      return `${y}-${pad(m)}-${pad(d.getUTCDate())}`;
    case "month":
      return `${y}-${pad(m)}`;
    case "quarter":
      return `${y}-Q${Math.ceil(m / 3)}`;
    case "year":
      return String(y);
    case "week": {
      // ISO 8601: the week belongs to the year of its Thursday.
      const day = (d.getUTCDay() + 6) % 7;
      const thursday = new Date(Date.UTC(y, d.getUTCMonth(), d.getUTCDate() - day + 3));
      const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
      const week = Math.ceil(((thursday.getTime() - yearStart) / 86_400_000 + 1) / 7);
      return `${thursday.getUTCFullYear()}-W${pad(week)}`;
    }
  }
}

/** Aggregate one group's values. Returns null for an empty sum/avg/min/max. */
export function measure(type: MeasureType, values: unknown[]): number | null {
  if (type === "count") return values.length;
  const present = values.filter((v) => v !== null && v !== undefined);
  if (type === "countDistinct") return new Set(present.map((v) => JSON.stringify(v))).size;
  const numbers = present.map(Number).filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return null;
  switch (type) {
    case "sum":
      return numbers.reduce((a, b) => a + b, 0);
    case "avg":
      return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    case "min":
      return Math.min(...numbers);
    case "max":
      return Math.max(...numbers);
  }
}
