import type pg from "pg";
import {
  linkAlreadyExists,
  linkCardinalityExceeded,
  linkNotFound,
  type LinkReadWriteStore,
  type StoredLink,
} from "./link-store.js";

interface LinkRow {
  source_type: string;
  source_key: string;
  link_type: string;
  target_type: string;
  target_key: string;
  created_at: Date | string;
}

const toLink = (row: LinkRow): StoredLink => ({
  sourceObjectType: row.source_type,
  sourcePrimaryKey: row.source_key,
  linkType: row.link_type,
  targetObjectType: row.target_type,
  targetPrimaryKey: row.target_key,
  createdAt: new Date(row.created_at).toISOString(),
});

const SOURCE = "ontology_rid = $1 AND source_type = $2 AND source_key = $3 AND link_type = $4";

/**
 * Links in the `links` table, which both schema sources declare
 * (`scripts/migrate.sql`, and `db/migrations/018_links.sql` with a tenant
 * column under forced RLS). Rows are read in `id` order, i.e. insertion order.
 */
export class PgLinkStore implements LinkReadWriteStore {
  constructor(
    private readonly pool: pg.Pool,
    private readonly orgRid?: string,
  ) {}

  /** One transaction with a transaction-local tenant, as `PgObjectStore` does. */
  private async tx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      if (this.orgRid) await client.query("SELECT set_config('app.org_rid', $1, true)", [this.orgRid]);
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

  async createLink(
    ontologyRid: string,
    sourceObjectType: string,
    sourcePrimaryKey: string,
    linkType: string,
    targetObjectType: string,
    targetPrimaryKey: string,
    options: { cardinality?: "ONE" | "MANY" } = {},
  ): Promise<StoredLink> {
    return this.tx(async (client) => {
      // Writers to one source object's link type queue here, so the duplicate
      // and cardinality checks below and the insert act as one step: two
      // concurrent ONE links cannot both see "no link yet" and both land.
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `links|${ontologyRid}|${sourceObjectType}|${sourcePrimaryKey}|${linkType}`,
      ]);
      const { rows: existing } = await client.query<{ target_type: string; target_key: string }>({
        text: `SELECT target_type, target_key FROM links WHERE ${SOURCE} ORDER BY id`,
        values: [ontologyRid, sourceObjectType, sourcePrimaryKey, linkType],
      });
      if (existing.some((r) => r.target_type === targetObjectType && r.target_key === targetPrimaryKey)) {
        throw linkAlreadyExists(sourceObjectType, sourcePrimaryKey, linkType, targetPrimaryKey);
      }
      if (options.cardinality === "ONE" && existing.length > 0) {
        throw linkCardinalityExceeded(sourceObjectType, linkType, existing[0].target_key);
      }

      const columns = ["ontology_rid", "source_type", "source_key", "link_type", "target_type", "target_key"];
      const values: unknown[] = [ontologyRid, sourceObjectType, sourcePrimaryKey, linkType, targetObjectType, targetPrimaryKey];
      // Named only with an organization, so the schema default applies otherwise
      // and a schema without the column (`scripts/migrate.sql`) still accepts it.
      if (this.orgRid) {
        columns.push("org_rid");
        values.push(this.orgRid);
      }
      const { rows } = await client.query<LinkRow>({
        text: `INSERT INTO links (${columns.join(", ")})
               VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")})
               RETURNING source_type, source_key, link_type, target_type, target_key, created_at`,
        values,
      });
      return toLink(rows[0]);
    });
  }

  async getLinks(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    linkType: string,
    pageSize = 100,
    pageToken?: string,
  ): Promise<{ data: StoredLink[]; nextPageToken?: string; totalCount: number }> {
    const offset = pageToken ? parseInt(pageToken, 10) || 0 : 0;
    return this.tx(async (client) => {
      const params = [ontologyRid, objectType, primaryKey, linkType];
      const { rows: count } = await client.query<{ total: number }>({
        text: `SELECT COUNT(*)::int AS total FROM links WHERE ${SOURCE}`,
        values: params,
      });
      const { rows } = await client.query<LinkRow>({
        text: `SELECT * FROM links WHERE ${SOURCE} ORDER BY id OFFSET $5 LIMIT $6`,
        values: [...params, offset, pageSize + 1],
      });
      const hasMore = rows.length > pageSize;
      return {
        data: rows.slice(0, pageSize).map(toLink),
        totalCount: count[0].total,
        ...(hasMore ? { nextPageToken: String(offset + pageSize) } : {}),
      };
    });
  }

  async getAllLinks(ontologyRid: string, objectType: string, primaryKey: string, linkType: string): Promise<StoredLink[]> {
    return this.tx(async (client) => {
      const { rows } = await client.query<LinkRow>({
        text: `SELECT * FROM links WHERE ${SOURCE} ORDER BY id`,
        values: [ontologyRid, objectType, primaryKey, linkType],
      });
      return rows.map(toLink);
    });
  }

  async deleteLink(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    linkType: string,
    targetPrimaryKey: string,
  ): Promise<void> {
    await this.tx(async (client) => {
      const { rowCount } = await client.query({
        text: `DELETE FROM links WHERE ${SOURCE} AND target_key = $5`,
        values: [ontologyRid, objectType, primaryKey, linkType, targetPrimaryKey],
      });
      if (!rowCount) throw linkNotFound(objectType, primaryKey, linkType, targetPrimaryKey);
    });
  }

  async getLinkedObjects(
    ontologyRid: string,
    objectType: string,
    primaryKey: string,
    linkType: string,
  ): Promise<Array<{ targetObjectType: string; targetPrimaryKey: string }>> {
    const links = await this.getAllLinks(ontologyRid, objectType, primaryKey, linkType);
    return links.map((l) => ({ targetObjectType: l.targetObjectType, targetPrimaryKey: l.targetPrimaryKey }));
  }
}
