/**
 * Profile a table's columns from a sample of its rows: inferred type, how
 * distinct and how complete each column is, and whether it can be a key.
 * Rules follow NVIDIA Auto Ontology's per-table pass (sample up to 1,000
 * rows; a column is unique when at least 95% of sampled values are distinct)
 * and the research's cold-start design (infer keys from distinct counts).
 */

export type InferredType = "BOOLEAN" | "INTEGER" | "DOUBLE" | "DATE" | "TIMESTAMP" | "STRING";

export interface ColumnProfile {
  column: string;
  type: InferredType;
  /** Non-empty sampled values. */
  filled: number;
  /** Empty sampled values. */
  empty: number;
  distinct: number;
  /** distinct / filled: 1 means every value differs. */
  distinctRatio: number;
  /** No empty values and at least 95% distinct: usable as a primary key. */
  keyCandidate: boolean;
  /** For low-cardinality columns, every value seen (at most 12): an enum in the making. */
  values?: string[];
  /** The distinct sampled values, kept for link inference; not serialised. */
  readonly valueSet: ReadonlySet<string>;
}

export interface TableProfile {
  name: string;
  sampledRows: number;
  columns: ColumnProfile[];
  /** The column chosen as primary key, if any qualifies. */
  primaryKey?: string;
}

export const SAMPLE_ROWS = 1_000;
const UNIQUE_RATIO = 0.95;
const LOW_CARDINALITY = 12;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;

/** The narrowest type every non-empty value fits. */
export function inferType(values: string[]): InferredType {
  if (values.length === 0) return "STRING";
  const all = (test: (v: string) => boolean) => values.every(test);
  if (all((v) => /^(true|false)$/i.test(v))) return "BOOLEAN";
  if (all((v) => /^-?\d+$/.test(v) && Number.isSafeInteger(Number(v)))) {
    // Leading zeros are identifiers (postcodes, account numbers), not numbers.
    return all((v) => !/^-?0\d/.test(v)) ? "INTEGER" : "STRING";
  }
  if (all((v) => /^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(v))) return "DOUBLE";
  if (all((v) => DATE.test(v) && !Number.isNaN(Date.parse(v)))) return "DATE";
  if (all((v) => TIMESTAMP.test(v) && !Number.isNaN(Date.parse(v)))) return "TIMESTAMP";
  return "STRING";
}

/** Column names that read as identifiers rank first among key candidates. */
const looksLikeKey = (column: string) => /(^id$|_id$|Id$|^key$|_key$|Key$|_code$|Code$|_no$|Number$)/.test(column);

/** Profile a parsed CSV: the first row is the header. */
export function profileTable(name: string, table: string[][]): TableProfile {
  const [header = [], ...body] = table;
  const rows = body.slice(0, SAMPLE_ROWS);
  const columns: ColumnProfile[] = header.map((column, i) => {
    const raw = rows.map((r) => r[i] ?? "");
    const filledValues = raw.filter((v) => v !== "");
    const valueSet = new Set(filledValues);
    const distinctRatio = filledValues.length === 0 ? 0 : valueSet.size / filledValues.length;
    return {
      column,
      type: inferType(filledValues),
      filled: filledValues.length,
      empty: raw.length - filledValues.length,
      distinct: valueSet.size,
      distinctRatio: Math.round(distinctRatio * 1000) / 1000,
      keyCandidate: filledValues.length > 0 && filledValues.length === raw.length && distinctRatio >= UNIQUE_RATIO,
      ...(valueSet.size <= LOW_CARDINALITY && filledValues.length > valueSet.size ? { values: [...valueSet].sort() } : {}),
      valueSet,
    };
  });
  // A key must be exactly unique in the sample, not merely 95% distinct: a
  // repeated value would fail the sync outright.
  const exact = columns.filter((c) => c.keyCandidate && c.distinct === c.filled);
  const key = exact.find((c) => looksLikeKey(c.column)) ?? exact[0];
  return { name, sampledRows: rows.length, columns, ...(key ? { primaryKey: key.column } : {}) };
}
