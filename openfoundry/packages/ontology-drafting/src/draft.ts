/**
 * Draft an ontology from profiled tables: one dataset-backed object type per
 * table, and a link wherever one table's column holds another table's keys.
 *
 * Every definition is a proposal (research R25: no relationship is accepted
 * from a model alone). Types are EXPERIMENTAL, and a link is proposed only
 * when the data confirms it, as NVIDIA Auto Ontology keeps an inferred
 * foreign key only if the values match: at least 95% of the column's distinct
 * values must be keys of the target table.
 */
import type { ColumnProfile, TableProfile } from "./profile.js";

export interface DraftSource {
  datasetRid: string;
  profile: TableProfile;
}

export interface LinkEvidence {
  link: string;
  from: string;
  column: string;
  to: string;
  /** Share of the column's distinct values that are target keys. */
  containment: number;
  /** Distinct column values seen in the target's keys. */
  matched: number;
  nameAffinity: boolean;
}

export interface OntologyDraft {
  objectTypes: Array<Record<string, unknown>>;
  linkTypes: Array<Record<string, unknown>>;
  evidence: { tables: Array<Omit<TableProfile, "columns"> & { columns: Array<Omit<ColumnProfile, "valueSet">> }>; links: LinkEvidence[] };
  skipped: string[];
}

const CONTAINMENT = 0.95;

/** `customer_orders.csv` -> `CustomerOrder`. */
export function typeName(table: string): string {
  const words = table.replace(/\.[a-z0-9]+$/i, "").split(/[^A-Za-z0-9]+|(?<=[a-z])(?=[A-Z])/).filter(Boolean);
  const pascal = words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
  const singular = /ies$/.test(pascal) ? pascal.slice(0, -3) + "y" : /(ss|us)$/.test(pascal) ? pascal : pascal.replace(/s$/, "");
  return /^[A-Za-z]/.test(singular) ? singular : `T${singular}`;
}

/** `customer_id` -> `customerId`. */
export function propertyName(column: string): string {
  const words = column.split(/[^A-Za-z0-9]+/).filter(Boolean);
  if (words.length === 0) return "column";
  const camel = words.map((w, i) => (i === 0 ? w[0].toLowerCase() + w.slice(1) : w[0].toUpperCase() + w.slice(1))).join("");
  return /^[A-Za-z]/.test(camel) ? camel : `c${camel}`;
}

const stem = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(id|key|code|no|number)$/, "");

export function draftOntology(sources: DraftSource[]): OntologyDraft {
  const skipped: string[] = [];
  const objectTypes: OntologyDraft["objectTypes"] = [];
  const typed: Array<{ type: string; source: DraftSource; keyProfile: ColumnProfile }> = [];
  const names = new Set<string>();

  for (const source of sources) {
    const { profile } = source;
    const type = typeName(profile.name);
    if (!profile.primaryKey) {
      skipped.push(`${profile.name}: no column is unique and complete in the sample, so it has no primary key`);
      continue;
    }
    if (names.has(type)) {
      skipped.push(`${profile.name}: another table also drafts as ${type}`);
      continue;
    }
    names.add(type);
    const properties: Record<string, unknown> = {};
    const propertyMapping: Record<string, unknown> = {};
    for (const c of profile.columns) {
      const name = propertyName(c.column);
      properties[name] = {
        type: c.type,
        nullable: c.column !== profile.primaryKey,
        multiplicity: "SINGLE",
        ...(c.values ? { description: `Seen values: ${c.values.join(", ")}` } : {}),
      };
      propertyMapping[name] = { type: "column", column: c.column };
    }
    const key = propertyName(profile.primaryKey);
    objectTypes.push({
      apiName: type,
      displayName: type,
      description: `Drafted from ${profile.name} (${profile.sampledRows} sampled rows).`,
      primaryKeyApiName: key,
      primaryKeyType: (properties[key] as { type: string }).type,
      titlePropertyApiName: key,
      properties,
      implements: [],
      status: "EXPERIMENTAL",
      datasources: [{ definition: { type: "dataset", datasetRid: source.datasetRid, propertyMapping } }],
    });
    typed.push({ type, source, keyProfile: profile.columns.find((c) => c.column === profile.primaryKey)! });
  }

  const links: LinkEvidence[] = [];
  const linkTypes: OntologyDraft["linkTypes"] = [];
  const linkNames = new Set<string>();
  for (const from of typed) {
    for (const column of from.source.profile.columns) {
      if (column.column === from.source.profile.primaryKey || column.distinct === 0) continue;
      // The best target this column's values point into, if any.
      let best: LinkEvidence | undefined;
      for (const to of typed) {
        if (to === from || to.keyProfile.type !== column.type) continue;
        let matched = 0;
        for (const v of column.valueSet) if (to.keyProfile.valueSet.has(v)) matched++;
        const containment = matched / column.distinct;
        const nameAffinity =
          stem(column.column).length > 0 &&
          (stem(column.column) === stem(to.type) || stem(column.column) === stem(to.keyProfile.column) || stem(column.column).includes(stem(to.type)));
        // Small integer codes match small integer keys by chance; without a
        // name to go on, demand string values and enough of them to mean it.
        const plausible = nameAffinity || (column.type === "STRING" && column.distinct >= 5);
        if (containment < CONTAINMENT || matched === 0 || !plausible) continue;
        const evidence: LinkEvidence = {
          link: "",
          from: from.type,
          column: column.column,
          to: to.type,
          containment: Math.round(containment * 1000) / 1000,
          matched,
          nameAffinity,
        };
        if (!best || evidence.nameAffinity > best.nameAffinity || (evidence.nameAffinity === best.nameAffinity && evidence.containment > best.containment)) {
          best = evidence;
        }
      }
      if (!best) continue;
      // `invoiceBuyer`; a second link to the same target is told apart by its column.
      const pascal = (w: string) => w.replace(/^./, (c) => c.toUpperCase());
      let apiName = `${propertyName(from.type)}${best.to}`;
      if (linkNames.has(apiName)) apiName += `By${pascal(propertyName(column.column))}`;
      linkNames.add(apiName);
      best.link = apiName;
      links.push(best);
      linkTypes.push({
        apiName,
        objectTypeApiName: from.type,
        linkedObjectTypeApiName: best.to,
        cardinality: "ONE",
        foreignKeyPropertyApiName: propertyName(column.column),
      });
    }
  }

  return {
    objectTypes,
    linkTypes,
    evidence: {
      tables: sources.map(({ profile }) => ({
        ...profile,
        columns: profile.columns.map(({ valueSet: _valueSet, ...rest }) => rest),
      })),
      links,
    },
    skipped,
  };
}
