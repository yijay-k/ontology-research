/**
 * Definition history: every change to an object, action or link type is kept
 * as a numbered model version, with the definition before and after and who
 * made it (research §4 L3, "a model version per change").
 *
 * Recorded by wrapping the store's mutating methods, so every route that
 * changes a definition is covered without each one remembering to. The caller
 * comes from an AsyncLocalStorage the server sets per request.
 *
 * ponytail: the history row is written after, not in the same transaction as,
 * the definition change, so a crash between them loses one entry. Definition
 * changes are rare and human-driven; move both into one transaction when the
 * stores share a connection.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type pg from "pg";

export type DefinitionKind = "objectType" | "actionType" | "linkType";
export type DefinitionChange = "CREATED" | "UPDATED" | "DELETED";

export interface DefinitionVersion {
  ontologyRid: string;
  /** Per ontology, starting at 1: the ontology's model version after this change. */
  version: number;
  kind: DefinitionKind;
  apiName: string;
  change: DefinitionChange;
  before: unknown;
  after: unknown;
  actor?: string;
  createdAt: string;
}

type NewVersion = Omit<DefinitionVersion, "version" | "createdAt">;
type MaybePromise<T> = T | Promise<T>;

export interface DefinitionHistory {
  record(entry: NewVersion): MaybePromise<DefinitionVersion>;
  list(ontologyRid: string, filter?: { kind?: DefinitionKind; apiName?: string }): MaybePromise<DefinitionVersion[]>;
  get(ontologyRid: string, version: number): MaybePromise<DefinitionVersion | undefined>;
}

export class MemoryDefinitionHistory implements DefinitionHistory {
  private readonly entries: DefinitionVersion[] = [];

  record(entry: NewVersion): DefinitionVersion {
    const version = this.entries.filter((e) => e.ontologyRid === entry.ontologyRid).length + 1;
    const stored = { ...entry, version, createdAt: new Date().toISOString() };
    this.entries.push(stored);
    return stored;
  }

  list(ontologyRid: string, filter: { kind?: DefinitionKind; apiName?: string } = {}): DefinitionVersion[] {
    return this.entries.filter(
      (e) => e.ontologyRid === ontologyRid && (!filter.kind || e.kind === filter.kind) && (!filter.apiName || e.apiName === filter.apiName),
    );
  }

  get(ontologyRid: string, version: number): DefinitionVersion | undefined {
    return this.entries.find((e) => e.ontologyRid === ontologyRid && e.version === version);
  }
}

interface Row {
  ontology_rid: string;
  version: number;
  kind: DefinitionKind;
  api_name: string;
  change: DefinitionChange;
  before: unknown;
  after: unknown;
  actor: string | null;
  created_at: Date | string;
}
const toVersion = (r: Row): DefinitionVersion => ({
  ontologyRid: r.ontology_rid,
  version: r.version,
  kind: r.kind,
  apiName: r.api_name,
  change: r.change,
  before: r.before,
  after: r.after,
  ...(r.actor ? { actor: r.actor } : {}),
  createdAt: new Date(r.created_at).toISOString(),
});

/** `definition_versions` (db/migrations/023, mirrored in scripts/migrate.sql). */
export class PgDefinitionHistory implements DefinitionHistory {
  constructor(private readonly pool: pg.Pool) {}

  async record(entry: NewVersion): Promise<DefinitionVersion> {
    // The unique (ontology_rid, version) index catches two writers taking the
    // same next number; the loser retries with the number after it.
    for (let attempt = 0; ; attempt++) {
      try {
        const { rows } = await this.pool.query<Row>({
          text: `INSERT INTO definition_versions (ontology_rid, version, kind, api_name, change, before, after, actor)
                 SELECT $1, COALESCE(MAX(version), 0) + 1, $2, $3, $4, $5, $6, $7
                 FROM definition_versions WHERE ontology_rid = $1
                 RETURNING *`,
          values: [entry.ontologyRid, entry.kind, entry.apiName, entry.change, JSON.stringify(entry.before ?? null), JSON.stringify(entry.after ?? null), entry.actor ?? null],
        });
        return toVersion(rows[0]);
      } catch (err) {
        if ((err as { code?: string }).code !== "23505" || attempt >= 4) throw err;
      }
    }
  }

  async list(ontologyRid: string, filter: { kind?: DefinitionKind; apiName?: string } = {}): Promise<DefinitionVersion[]> {
    const { rows } = await this.pool.query<Row>({
      text: `SELECT * FROM definition_versions
             WHERE ontology_rid = $1 AND ($2::text IS NULL OR kind = $2) AND ($3::text IS NULL OR api_name = $3)
             ORDER BY version`,
      values: [ontologyRid, filter.kind ?? null, filter.apiName ?? null],
    });
    return rows.map(toVersion);
  }

  async get(ontologyRid: string, version: number): Promise<DefinitionVersion | undefined> {
    const { rows } = await this.pool.query<Row>({
      text: `SELECT * FROM definition_versions WHERE ontology_rid = $1 AND version = $2`,
      values: [ontologyRid, version],
    });
    return rows[0] ? toVersion(rows[0]) : undefined;
  }
}

/** Who is changing definitions in this request; set by the server's onRequest hook. */
export const definitionActor = new AsyncLocalStorage<{ actor?: string }>();

const MUTATORS: Record<string, { kind: DefinitionKind; change: DefinitionChange; getter: string }> = {
  createObjectType: { kind: "objectType", change: "CREATED", getter: "getObjectType" },
  updateObjectType: { kind: "objectType", change: "UPDATED", getter: "getObjectType" },
  deleteObjectType: { kind: "objectType", change: "DELETED", getter: "getObjectType" },
  createActionType: { kind: "actionType", change: "CREATED", getter: "getActionType" },
  updateActionType: { kind: "actionType", change: "UPDATED", getter: "getActionType" },
  deleteActionType: { kind: "actionType", change: "DELETED", getter: "getActionType" },
  createLinkType: { kind: "linkType", change: "CREATED", getter: "getLinkType" },
  deleteLinkType: { kind: "linkType", change: "DELETED", getter: "getLinkType" },
};

/**
 * The store, with every definition mutation also recorded in `history`. A
 * failed mutation records nothing. `create*(rid, def)` names the definition in
 * `def.apiName`; `update*` and `delete*(rid, apiName, ...)` in their second
 * argument.
 */
export function withDefinitionHistory<S extends object>(store: S, history: DefinitionHistory): S {
  return new Proxy(store, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      const spec = typeof prop === "string" ? MUTATORS[prop] : undefined;
      if (!spec || typeof value !== "function") return value;
      return async (...args: unknown[]) => {
        const ontologyRid = args[0] as string;
        const apiName =
          spec.change === "CREATED" ? (args[1] as { apiName: string }).apiName : (args[1] as string);
        const read = async () => {
          try {
            return await (Reflect.get(target, spec.getter) as (...a: unknown[]) => unknown).call(target, ontologyRid, apiName);
          } catch {
            return null;
          }
        };
        const before = spec.change === "CREATED" ? null : await read();
        const result = await (value as (...a: unknown[]) => unknown).apply(target, args);
        const after = spec.change === "DELETED" ? null : await read();
        await history.record({
          ontologyRid,
          kind: spec.kind,
          apiName,
          change: spec.change,
          before,
          after,
          actor: definitionActor.getStore()?.actor,
        });
        return result;
      };
    },
  });
}
