import type pg from "pg";

import { generateRid } from "@openfoundry/rid";
import { notFound, conflict, ErrorCode, OpenFoundryApiError } from "@openfoundry/errors";
import type { Filter } from "@openfoundry/object-set";
import {
  decodePageToken,
  encodePageToken,
  type PageToken,
} from "@openfoundry/pagination";
import { committedEvent, objectChanged } from "./object-store.js";
import {
  planSync,
  recordEdit,
  resultOf,
  type ObjectEditRecord,
  type SourceRow,
  type SyncResult,
} from "./source-sync.js";
import type {
  CommitOptions,
  CommitResult,
  ListOptions,
  ListResult,
  ObjectEdit,
  OutboxEvent,
  StoredCommit,
  StoredObject,
  OrderByClause,
} from "./object-store.js";

/**
 * Postgres aborts one side of a deadlock (40P01) or a serialization failure
 * (40001). Both mean a concurrent action touched the same objects, so they
 * surface as Foundry's `ObjectChanged`, which svc-actions retries.
 */
function isConcurrencyAbort(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "40P01" || code === "40001";
}

const concurrentAction = () =>
  new OpenFoundryApiError({
    errorCode: ErrorCode.CONFLICT,
    errorName: "ObjectChanged",
    message: "a concurrent action changed objects this plan reads or writes",
    parameters: {},
  });

// ---------------------------------------------------------------------------
// Row shape from the database
// ---------------------------------------------------------------------------

interface ObjectRow {
  rid: string;
  object_type_rid: string;
  primary_key: string;
  properties: Record<string, unknown>;
  version: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Filter to SQL translation
// ---------------------------------------------------------------------------

interface FilterSqlResult {
  where: string;
  values: unknown[];
}

/**
 * Translate an ObjectSet filter tree into a parameterised SQL WHERE clause
 * that queries the JSONB `properties` column.
 *
 * Returns the clause fragment and an array of bind values.  The caller is
 * responsible for adjusting `$N` placeholder numbering via `paramOffset`.
 */
export function filterToSql(
  filter: Filter,
  paramOffset = 0,
): FilterSqlResult {
  const values: unknown[] = [];
  let idx = paramOffset;

  function next(val: unknown): string {
    idx++;
    values.push(val);
    return `$${idx}`;
  }

  function prop(property: string): string {
    return `properties->>\'${property.replace(/'/g, "''")}'`;
  }

  function propJsonb(property: string): string {
    return `properties->\'${property.replace(/'/g, "''")}'`;
  }

  function walk(f: Filter): string {
    switch (f.type) {
      case "AND":
        return `(${f.filters.map(walk).join(" AND ")})`;

      case "OR":
        return `(${f.filters.map(walk).join(" OR ")})`;

      case "NOT":
        return `(NOT ${walk(f.filter)})`;

      case "EQUALS":
        return `(${prop(f.property)} = ${next(String(f.value))})`;

      case "CONTAINS":
        return `(${prop(f.property)} ILIKE ${next(`%${f.value}%`)})`;

      case "STARTS_WITH":
        return `(${prop(f.property)} ILIKE ${next(`${f.value}%`)})`;

      case "GT":
        return `((${prop(f.property)})::numeric > ${next(f.value)})`;

      case "GTE":
        return `((${prop(f.property)})::numeric >= ${next(f.value)})`;

      case "LT":
        return `((${prop(f.property)})::numeric < ${next(f.value)})`;

      case "LTE":
        return `((${prop(f.property)})::numeric <= ${next(f.value)})`;

      case "IS_NULL":
        return `(${propJsonb(f.property)} IS NULL OR ${prop(f.property)} IS NULL)`;

      case "HAS_PROPERTY":
        return `(${propJsonb(f.property)} IS NOT NULL AND ${prop(f.property)} IS NOT NULL)`;

      case "IN_SET": {
        const placeholders = f.values.map((v) => next(String(v)));
        return `(${prop(f.property)} IN (${placeholders.join(", ")}))`;
      }

      case "RANGE": {
        const parts: string[] = [];
        if (f.gt !== undefined) parts.push(`(${prop(f.property)})::numeric > ${next(f.gt)}`);
        if (f.gte !== undefined) parts.push(`(${prop(f.property)})::numeric >= ${next(f.gte)}`);
        if (f.lt !== undefined) parts.push(`(${prop(f.property)})::numeric < ${next(f.lt)}`);
        if (f.lte !== undefined) parts.push(`(${prop(f.property)})::numeric <= ${next(f.lte)}`);
        return parts.length > 0 ? `(${parts.join(" AND ")})` : "TRUE";
      }

      default:
        // Unsupported filter types are treated as always-true
        return "TRUE";
    }
  }

  const where = walk(filter);
  return { where, values };
}

// ---------------------------------------------------------------------------
// Row to domain
// ---------------------------------------------------------------------------

function rowToStoredObject(row: ObjectRow, objectType: string): StoredObject {
  return {
    rid: row.rid,
    objectType,
    primaryKey: row.primary_key,
    properties: row.properties,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// PgObjectStore
// ---------------------------------------------------------------------------

/**
 * PostgreSQL-backed object store.
 *
 * Objects in the schema reference `object_type_rid` (the RID of the object
 * type row in `object_types`).  This store accepts the ontology RID and the
 * objectType's `apiName` at the API level and resolves the RID internally,
 * matching the interface of the in-memory `ObjectStore`.
 */
export class PgObjectStore {
  constructor(
    private pool: pg.Pool,
    private orgRid?: string,
  ) {}

  // Wrap fn in an explicit transaction with a transaction-local setting so the tenant context
  // is guaranteed to reset at COMMIT/ROLLBACK and never leaks to the next
  // request on a pooled connection.
  private async withTenant<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (this.orgRid) {
        await client.query("SELECT set_config('app.org_rid', $1, true)", [this.orgRid]);
      }
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (err) {
      try { await client.query("ROLLBACK"); } catch { /* ignore rollback error */ }
      throw err;
    } finally {
      client.release();
    }
  }

  // -----------------------------------------------------------------------
  // CRUD
  // -----------------------------------------------------------------------

  async createObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): Promise<StoredObject> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);
    const rid = generateRid("phonograph2-objects", "object").toString();
    const insert = this.insertColumns([rid, objectTypeRid, primaryKey, JSON.stringify(properties)]);

    try {
      return await this.withTenant(async (client) => {
        const { rows } = await client.query<ObjectRow>({
          text: `INSERT INTO objects (${insert.columns})
                 VALUES (${insert.placeholders})
                 RETURNING *`,
          values: insert.values,
        });
        return rowToStoredObject(rows[0], objectType);
      });
    } catch (err: unknown) {
      if (isPgUniqueViolation(err)) {
        throw conflict(
          `${objectType}:${primaryKey}`,
          "object with this primary key already exists",
        );
      }
      throw err;
    }
  }

  async upsertObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): Promise<StoredObject> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);
    const rid = generateRid("phonograph2-objects", "object").toString();
    const insert = this.insertColumns([rid, objectTypeRid, primaryKey, JSON.stringify(properties)]);

    return this.withTenant(async (client) => {
      const { rows } = await client.query<ObjectRow>({
        text: `INSERT INTO objects (${insert.columns})
               VALUES (${insert.placeholders})
               ON CONFLICT (object_type_rid, primary_key)
               DO UPDATE SET properties = $4::jsonb, version = objects.version + 1, updated_at = NOW()
               RETURNING *`,
        values: insert.values,
      });
      return rowToStoredObject(rows[0], objectType);
    });
  }

  async getObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
  ): Promise<StoredObject> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);

    const { rows } = await this.pool.query<ObjectRow>({
      text: `SELECT * FROM objects
             WHERE object_type_rid = $1 AND primary_key = $2`,
      values: [objectTypeRid, primaryKey],
    });

    if (rows.length === 0) {
      throw notFound("Object", `${objectType}:${primaryKey}`);
    }
    return rowToStoredObject(rows[0], objectType);
  }

  /**
   * Returns one page of a type, matching `ObjectStore.listObjects`.
   *
   * Sharing the signature is what lets a listing that needs no whole-collection
   * view stay on `LIMIT`/`OFFSET` against either backend instead of reading the
   * entire object type on every page.
   */
  async listObjects(
    ontologyRid: string,
    objectType: string,
    options: ListOptions = {},
  ): Promise<ListResult> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);
    const pageSize = options.pageSize ?? 100;
    const offset = options.pageToken
      ? decodePageToken(options.pageToken as PageToken).offset
      : 0;

    const countResult = await this.pool.query<{ total: number }>({
      text: `SELECT COUNT(*)::int AS total FROM objects WHERE object_type_rid = $1`,
      values: [objectTypeRid],
    });

    const { rows } = await this.pool.query<ObjectRow>({
      text: `SELECT * FROM objects
             WHERE object_type_rid = $1
             ORDER BY created_at ASC, primary_key ASC
             LIMIT $2 OFFSET $3`,
      values: [objectTypeRid, pageSize, offset],
    });

    const totalCount = countResult.rows[0].total;
    const result: ListResult = {
      data: rows.map((r) => rowToStoredObject(r, objectType)),
      totalCount,
    };
    if (offset + rows.length < totalCount) {
      result.nextPageToken = encodePageToken({ offset: offset + pageSize });
    }
    return result;
  }

  /**
   * Reads the property names declared on an object type.
   *
   * `object_types.properties` is the authoritative declaration; a property it
   * lists is real whether or not any row has populated it. Returns `undefined`
   * when the type is unknown or declares nothing, so callers make no claim
   * about a property name they have no declaration for.
   *
   * Scoped by ontology because `object_types` is unique on
   * `(ontology_rid, api_name)`: two ontologies may each declare `Employee`
   * with different properties, and an unscoped lookup would answer with
   * whichever row the database happened to yield first. `resolveObjectTypeRid`
   * is keyed the same way, so the declaration a request is checked against and
   * the rows it is served always belong to the same ontology.
   */
  async propertyNames(
    ontologyRid: string,
    objectType: string,
  ): Promise<ReadonlySet<string> | undefined> {
    return this.withTenant(async (client) => {
      const { rows } = await client.query<{ properties: Record<string, unknown> | null }>({
        text: `SELECT properties FROM object_types
               WHERE ontology_rid = $1 AND api_name = $2
               LIMIT 1`,
        values: [ontologyRid, objectType],
      });

      const declared = rows[0]?.properties;
      if (!declared || typeof declared !== "object") return undefined;
      const names = Object.keys(declared);
      return names.length > 0 ? new Set(names) : undefined;
    });
  }

  /**
   * Reads the object type a link type points at from the link type's own
   * declaration, so the answer does not depend on which links happen to exist.
   */
  async linkTargetObjectType(
    ontologyRid: string,
    objectType: string,
    linkType: string,
  ): Promise<string | undefined> {
    return this.withTenant(async (client) => {
      const { rows } = await client.query<{ linked_object_type_api_name: string }>({
        text: `SELECT linked_object_type_api_name FROM link_types
               WHERE ontology_rid = $1 AND object_type_api_name = $2 AND api_name = $3
               LIMIT 1`,
        values: [ontologyRid, objectType, linkType],
      });
      return rows[0]?.linked_object_type_api_name;
    });
  }

  /**
   * Gets objects by explicit primary keys, matching
   * `ObjectStore.getObjectsByKeys`. Keys with no row are simply absent from
   * the result rather than an error.
   */
  async getObjectsByKeys(
    ontologyRid: string,
    objectType: string,
    primaryKeys: string[],
  ): Promise<StoredObject[]> {
    if (primaryKeys.length === 0) return [];
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);

    const { rows } = await this.pool.query<ObjectRow>({
      text: `SELECT * FROM objects
             WHERE object_type_rid = $1 AND primary_key = ANY($2::text[])`,
      values: [objectTypeRid, primaryKeys],
    });

    const byKey = new Map(rows.map((r) => [r.primary_key, r]));
    return primaryKeys
      .map((key) => byKey.get(key))
      .filter((row): row is ObjectRow => row !== undefined)
      .map((row) => rowToStoredObject(row, objectType));
  }

  /**
   * Returns every object of a type, matching `ObjectStore.allObjects`.
   *
   * The read endpoints resolve `orderBy`, `snapshot` and `totalCount` over the
   * whole collection, so they need the same unpaginated view from either
   * backend. Ordering is by insertion time with the primary key as a
   * tiebreaker, because `created_at` alone collides for rows written in the
   * same instant and would leave paging offsets unstable.
   */
  async allObjects(ontologyRid: string, objectType: string): Promise<StoredObject[]> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);

    const { rows } = await this.pool.query<ObjectRow>({
      text: `SELECT * FROM objects
             WHERE object_type_rid = $1
             ORDER BY created_at ASC, primary_key ASC`,
      values: [objectTypeRid],
    });

    return rows.map((r) => rowToStoredObject(r, objectType));
  }

  async updateObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    properties: Record<string, unknown>,
  ): Promise<StoredObject> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);

    const { rows } = await this.pool.query<ObjectRow>({
      text: `UPDATE objects
             SET properties = properties || $1::jsonb, version = version + 1, updated_at = NOW()
             WHERE object_type_rid = $2 AND primary_key = $3
             RETURNING *`,
      values: [JSON.stringify(properties), objectTypeRid, primaryKey],
    });

    if (rows.length === 0) {
      throw notFound("Object", `${objectType}:${primaryKey}`);
    }
    return rowToStoredObject(rows[0], objectType);
  }

  async deleteObject(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
  ): Promise<void> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);

    const result = await this.pool.query({
      text: `DELETE FROM objects
             WHERE object_type_rid = $1 AND primary_key = $2`,
      values: [objectTypeRid, primaryKey],
    });

    if (result.rowCount === 0) {
      throw notFound("Object", `${objectType}:${primaryKey}`);
    }
  }

  /** Apply every edit in one transaction: any failure rolls all of them back. */
  async applyEdits(ontologyRid: string, edits: ObjectEdit[], options: CommitOptions = {}): Promise<CommitResult> {
    const reads = options.reads ?? [];
    const typeRids = new Map<string, string>();
    for (const { objectType } of [...edits, ...reads]) {
      if (!typeRids.has(objectType)) {
        typeRids.set(objectType, await this.resolveObjectTypeRid(ontologyRid, objectType));
      }
    }

    try {
      return await this.withTenant(async (client) => {
        // The commit row first: a repeated idempotency key stops here, waiting
        // on the unique index for a concurrent commit of the same key to finish.
        const commitId = generateRid("actions", "commit").toString();
        const commit = this.tenantColumns(
          ["commit_id", "ontology_rid", "idempotency_key", "action_type", "actor", "edits"],
          [commitId, ontologyRid, options.idempotencyKey ?? null, options.actionType ?? null, options.actor ?? null, JSON.stringify(edits)],
        );
        const inserted = await client.query({
          text: `INSERT INTO action_commits (${commit.columns}) VALUES (${commit.placeholders})
                 ON CONFLICT (ontology_rid, idempotency_key) WHERE idempotency_key IS NOT NULL DO NOTHING`,
          values: commit.values,
        });
        if (inserted.rowCount === 0) {
          const { rows } = await client.query<{ commit_id: string }>({
            text: `SELECT commit_id FROM action_commits WHERE ontology_rid = $1 AND idempotency_key = $2`,
            values: [ontologyRid, options.idempotencyKey],
          });
          return { commitId: rows[0].commit_id, replayed: true };
        }

        // Objects the plan only read are share-locked at the version read, so
        // no concurrent action can write them before this one commits.
        for (const read of reads) {
          const { rows } = await client.query<{ version: number }>({
            text: `SELECT version FROM objects WHERE object_type_rid = $1 AND primary_key = $2 FOR SHARE`,
            values: [typeRids.get(read.objectType), read.primaryKey],
          });
          if (rows[0]?.version !== read.version) throw objectChanged(read.objectType, read.primaryKey);
        }

        for (const edit of edits) {
          const objectTypeRid = typeRids.get(edit.objectType)!;
          if (edit.type === "addObject") {
            const rid = generateRid("phonograph2-objects", "object").toString();
            const insert = this.insertColumns([rid, objectTypeRid, edit.primaryKey, JSON.stringify(edit.properties)]);
            await client.query({
              text: `INSERT INTO objects (${insert.columns}) VALUES (${insert.placeholders})`,
              values: insert.values,
            });
            await this.recordEditRow(client, objectTypeRid, edit);
            continue;
          }
          // With an expected version the row is matched only at that version,
          // so a concurrent writer's commit makes this edit miss rather than
          // overwrite it.
          const expected = edit.expectedVersion ?? null;
          const result = edit.type === "modifyObject"
            ? await client.query({
                text: `UPDATE objects
                       SET properties = properties || $1::jsonb, version = version + 1, updated_at = NOW()
                       WHERE object_type_rid = $2 AND primary_key = $3
                         AND ($4::int IS NULL OR version = $4::int)`,
                values: [JSON.stringify(edit.properties), objectTypeRid, edit.primaryKey, expected],
              })
            : await client.query({
                text: `DELETE FROM objects
                       WHERE object_type_rid = $1 AND primary_key = $2
                         AND ($3::int IS NULL OR version = $3::int)`,
                values: [objectTypeRid, edit.primaryKey, expected],
              });
          if (result.rowCount === 0) {
            const { rowCount } = await client.query({
              text: `SELECT 1 FROM objects WHERE object_type_rid = $1 AND primary_key = $2`,
              values: [objectTypeRid, edit.primaryKey],
            });
            throw rowCount
              ? objectChanged(edit.objectType, edit.primaryKey)
              : notFound("Object", `${edit.objectType}:${edit.primaryKey}`);
          }
          await this.recordEditRow(client, objectTypeRid, edit);
        }

        const event = this.tenantColumns(
          ["ontology_rid", "topic", "payload"],
          [ontologyRid, "action.committed", JSON.stringify(committedEvent(commitId, edits, options))],
        );
        await client.query({
          text: `INSERT INTO outbox (${event.columns}) VALUES (${event.placeholders})`,
          values: event.values,
        });
        return { commitId, replayed: false };
      });
    } catch (err: unknown) {
      if (isConcurrencyAbort(err)) throw concurrentAction();
      if (isPgUniqueViolation(err)) {
        throw conflict("ObjectEdits", "an added object's primary key already exists");
      }
      throw err;
    }
  }

  async getCommit(ontologyRid: string, idempotencyKey: string): Promise<StoredCommit | undefined> {
    return this.withTenant(async (client) => {
      const { rows } = await client.query<{
        commit_id: string; idempotency_key: string; action_type: string | null; actor: string | null;
        edits: ObjectEdit[]; created_at: Date | string;
      }>({
        text: `SELECT * FROM action_commits WHERE ontology_rid = $1 AND idempotency_key = $2`,
        values: [ontologyRid, idempotencyKey],
      });
      const row = rows[0];
      if (!row) return undefined;
      return {
        commitId: row.commit_id,
        idempotencyKey: row.idempotency_key,
        actionType: row.action_type ?? undefined,
        actor: row.actor ?? undefined,
        edits: row.edits,
        createdAt: new Date(row.created_at).toISOString(),
      };
    });
  }

  async pendingOutbox(limit: number): Promise<OutboxEvent[]> {
    return this.withTenant(async (client) => {
      const { rows } = await client.query<{
        id: number; ontology_rid: string; topic: string; payload: Record<string, unknown>; created_at: Date | string;
      }>({
        text: `SELECT id, ontology_rid, topic, payload, created_at FROM outbox
               WHERE delivered_at IS NULL ORDER BY id LIMIT $1`,
        values: [limit],
      });
      return rows.map((r) => ({
        id: r.id,
        ontologyRid: r.ontology_rid,
        topic: r.topic,
        payload: r.payload,
        createdAt: new Date(r.created_at).toISOString(),
      }));
    });
  }

  async markDelivered(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    await this.withTenant((client) =>
      client.query({ text: `UPDATE outbox SET delivered_at = NOW() WHERE id = ANY($1::int[])`, values: [ids] }),
    );
  }

  /** Columns and placeholders for an insert, naming `org_rid` only with an organization. */
  private tenantColumns(columns: string[], values: unknown[]): { columns: string; placeholders: string; values: unknown[] } {
    if (this.orgRid) {
      columns = [...columns, "org_rid"];
      values = [...values, this.orgRid];
    }
    return { columns: columns.join(", "), placeholders: values.map((_, i) => `$${i + 1}`).join(", "), values };
  }

  /** Fold one applied edit into `object_edits`, inside the edit's transaction. */
  private async recordEditRow(client: pg.PoolClient, objectTypeRid: string, edit: ObjectEdit): Promise<void> {
    const { rows } = await client.query<ObjectEditRecord>({
      text: `SELECT patch, created, deleted FROM object_edits
             WHERE object_type_rid = $1 AND primary_key = $2 FOR UPDATE`,
      values: [objectTypeRid, edit.primaryKey],
    });
    const next = recordEdit(rows[0], edit);
    const columns = ["object_type_rid", "primary_key", "patch", "created", "deleted"];
    const values: unknown[] = [objectTypeRid, edit.primaryKey, JSON.stringify(next.patch), next.created, next.deleted];
    if (this.orgRid) {
      columns.push("org_rid");
      values.push(this.orgRid);
    }
    await client.query({
      text: `INSERT INTO object_edits (${columns.join(", ")})
             VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")})
             ON CONFLICT (object_type_rid, primary_key)
             DO UPDATE SET patch = EXCLUDED.patch, created = EXCLUDED.created, deleted = EXCLUDED.deleted`,
      values,
    });
  }

  /**
   * Replace a type's source-backed state with `rows` and reapply its edit
   * layer, in one transaction: a failure leaves the previous state standing.
   *
   * ponytail: one statement per changed object; batch with UNNEST if a type
   * grows past tens of thousands of rows.
   */
  async syncFromSource(ontologyRid: string, objectType: string, rows: SourceRow[]): Promise<SyncResult> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);
    return this.withTenant(async (client) => {
      const current = await client.query<{ primary_key: string; properties: Record<string, unknown> }>({
        text: `SELECT primary_key, properties FROM objects WHERE object_type_rid = $1 FOR UPDATE`,
        values: [objectTypeRid],
      });
      const edited = await client.query<ObjectEditRecord & { primary_key: string }>({
        text: `SELECT primary_key, patch, created, deleted FROM object_edits WHERE object_type_rid = $1`,
        values: [objectTypeRid],
      });
      const plan = planSync(
        new Map(current.rows.map((r) => [r.primary_key, r.properties])),
        new Map(edited.rows.map(({ primary_key, ...record }) => [primary_key, record])),
        rows,
      );

      for (const pk of plan.delete) {
        await client.query({
          text: `DELETE FROM objects WHERE object_type_rid = $1 AND primary_key = $2`,
          values: [objectTypeRid, pk],
        });
      }
      for (const { primaryKey, properties } of plan.modify) {
        await client.query({
          text: `UPDATE objects SET properties = $1::jsonb, version = version + 1, updated_at = NOW()
                 WHERE object_type_rid = $2 AND primary_key = $3`,
          values: [JSON.stringify(properties), objectTypeRid, primaryKey],
        });
      }
      for (const { primaryKey, properties } of plan.add) {
        const rid = generateRid("phonograph2-objects", "object").toString();
        const insert = this.insertColumns([rid, objectTypeRid, primaryKey, JSON.stringify(properties)]);
        await client.query({
          text: `INSERT INTO objects (${insert.columns}) VALUES (${insert.placeholders})`,
          values: insert.values,
        });
      }
      return resultOf(plan);
    });
  }

  async queryObjects(
    ontologyRid: string,
    objectType: string,
    filter: Filter | undefined,
    pageSize = 100,
    offset = 0,
    orderBy?: OrderByClause[],
  ): Promise<{ items: StoredObject[]; total: number }> {
    const objectTypeRid = await this.resolveObjectTypeRid(ontologyRid, objectType);

    let whereClause = "object_type_rid = $1";
    const values: unknown[] = [objectTypeRid];
    let paramIdx = 1;

    if (filter) {
      const filterResult = filterToSql(filter, paramIdx);
      whereClause += ` AND ${filterResult.where}`;
      values.push(...filterResult.values);
      paramIdx += filterResult.values.length;
    }

    // Count
    const countResult = await this.pool.query<{ total: number }>({
      text: `SELECT COUNT(*)::int AS total FROM objects WHERE ${whereClause}`,
      values,
    });

    // Build ORDER BY
    let orderClause = "ORDER BY created_at ASC";
    if (orderBy && orderBy.length > 0) {
      const orderParts = orderBy.map((o) => {
        const dir = o.direction === "desc" ? "DESC" : "ASC";
        // Order by JSONB property value
        return `properties->>'${o.field.replace(/'/g, "''")}' ${dir}`;
      });
      orderClause = `ORDER BY ${orderParts.join(", ")}`;
    }

    // Fetch page
    paramIdx++;
    values.push(pageSize);
    const limitParam = `$${paramIdx}`;

    paramIdx++;
    values.push(offset);
    const offsetParam = `$${paramIdx}`;

    const { rows } = await this.pool.query<ObjectRow>({
      text: `SELECT * FROM objects WHERE ${whereClause} ${orderClause} LIMIT ${limitParam} OFFSET ${offsetParam}`,
      values,
    });

    return {
      items: rows.map((r) => rowToStoredObject(r, objectType)),
      total: countResult.rows[0].total,
    };
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  /**
   * The columns and values of an `objects` insert.
   *
   * `org_rid` is named only when this store was given an organization. With
   * none, the column is left to its schema default ('org:default' in
   * `db/migrations`) - an explicit NULL would override that default and fail
   * its NOT NULL constraint - and a schema without the column
   * (`scripts/migrate.sql`) accepts the insert as well.
   */
  private insertColumns(base: [string, string, string, string]): {
    columns: string;
    placeholders: string;
    values: unknown[];
  } {
    const columns = ["rid", "object_type_rid", "primary_key", "properties"];
    const values: unknown[] = [...base];
    if (this.orgRid) {
      columns.push("org_rid");
      values.push(this.orgRid);
    }
    return {
      columns: columns.join(", "),
      placeholders: values.map((_, i) => `$${i + 1}`).join(", "),
      values,
    };
  }

  /**
   * Resolve an object type's apiName, within one ontology, to the RID of its
   * `object_types` row.
   *
   * `object_types` is unique on `(ontology_rid, api_name)`, not on `api_name`:
   * two ontologies may each declare `Employee`, and their objects hang off two
   * different rows. Matching on the name alone would serve one ontology's
   * objects through the other's path, while the declaration lookups above,
   * which are keyed by the ontology, judged the request against the right one.
   */
  private async resolveObjectTypeRid(
    ontologyRid: string,
    apiName: string,
  ): Promise<string> {
    const { rows } = await this.pool.query<{ rid: string }>({
      text: `SELECT rid FROM object_types WHERE ontology_rid = $1 AND api_name = $2`,
      values: [ontologyRid, apiName],
    });
    if (rows.length === 0) {
      throw notFound("ObjectType", apiName);
    }
    return rows[0].rid;
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function isPgUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: string }).code === "23505"
  );
}
