/**
 * Minimal action gate implementing the sequence the research converged on
 * (operational-ontology core.ts + map 33 §13), plus the three pieces no repo had:
 * an idempotency key per invocation, a persisted pending-invocation record written
 * before writeback, and a recovery pass that finishes or re-drives pending work.
 *
 *   parse → idempotency claim → preconditions → effects → preflight (rolled back)
 *   → pending record → writeback (external, idempotent on invocation id)
 *   → commit edits + audit + status in one transaction
 */
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { tx } from './db.ts';

export type Edit = { op: 'modify'; type: string; pk: string; patch: Record<string, unknown> };
export type Rejection = { code: string; message: string };
export type ActionDef<P> = {
  name: string;
  preconditions: (obj: Record<string, unknown> | null, p: P) => Rejection | null;
  effects: (obj: Record<string, unknown>, p: P) => Edit[];
  target: (p: P) => { type: string; pk: string };
  writeback?: boolean;
};

export const SCHEMA = `
CREATE TABLE objects (tenant text NOT NULL, type text NOT NULL, pk text NOT NULL, data jsonb NOT NULL, version int NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant, type, pk));
CREATE TABLE action_invocation (
  id uuid PRIMARY KEY, tenant text NOT NULL, idempotency_key text NOT NULL, action text NOT NULL, actor text NOT NULL,
  params jsonb NOT NULL, edits jsonb, status text NOT NULL CHECK (status IN ('pending','committed','rejected','failed')),
  error jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant, idempotency_key));
CREATE TABLE audit_log (seq bigserial PRIMARY KEY, invocation_id uuid NOT NULL, tenant text NOT NULL, actor text NOT NULL,
  action text NOT NULL, status text NOT NULL, detail jsonb, ts timestamptz NOT NULL DEFAULT now());
CREATE TABLE outbox (id bigserial PRIMARY KEY, invocation_id uuid NOT NULL, payload jsonb NOT NULL, published_at timestamptz);
-- the external system of record, with its own idempotency table keyed by our invocation id
CREATE TABLE ext_ledger (invocation_id uuid PRIMARY KEY, payload jsonb NOT NULL, applied_at timestamptz NOT NULL DEFAULT now());
`;

export class CrashAfterWriteback extends Error {}

export class Gate {
  private pool: pg.Pool;
  private actions: Map<string, ActionDef<any>>;
  constructor(pool: pg.Pool, actions: Map<string, ActionDef<any>>) { this.pool = pool; this.actions = actions; }

  /** External writeback. Idempotent on invocation id, as any real writeback must be (or be made to be). */
  async writeback(invocationId: string, edits: Edit[]): Promise<void> {
    await this.pool.query(
      `INSERT INTO ext_ledger (invocation_id, payload) VALUES ($1, $2) ON CONFLICT (invocation_id) DO NOTHING`,
      [invocationId, JSON.stringify(edits)]);
  }

  async execute(tenant: string, actor: string, actionName: string, params: any, idempotencyKey: string,
                opts: { crashAfterWriteback?: boolean } = {}): Promise<{ status: string; invocationId: string; replayed: boolean; error?: Rejection }> {
    const def = this.actions.get(actionName);
    if (!def) throw new Error(`unknown action ${actionName}`);
    const c = await this.pool.connect();
    let invocationId = randomUUID();
    let edits: Edit[] = [];
    try {
      // 1. Claim the idempotency key. A duplicate returns the earlier outcome instead of acting again.
      const claim = await c.query(
        `INSERT INTO action_invocation (id, tenant, idempotency_key, action, actor, params, status)
         VALUES ($1,$2,$3,$4,$5,$6,'pending') ON CONFLICT (tenant, idempotency_key) DO NOTHING RETURNING id`,
        [invocationId, tenant, idempotencyKey, actionName, actor, JSON.stringify(params)]);
      if (claim.rowCount === 0) {
        const prior = await c.query(`SELECT id, status, error FROM action_invocation WHERE tenant=$1 AND idempotency_key=$2`, [tenant, idempotencyKey]);
        return { status: prior.rows[0].status, invocationId: prior.rows[0].id, replayed: true, error: prior.rows[0].error ?? undefined };
      }
      // 2-4. Load, preconditions, effects, preflight in a transaction that always rolls back.
      const t = def.target(params);
      const rejection = await tx(c, async () => {
        const row = await c.query(`SELECT data FROM objects WHERE tenant=$1 AND type=$2 AND pk=$3 FOR UPDATE`, [tenant, t.type, t.pk]);
        const obj = row.rows[0]?.data ?? null;
        const r = def.preconditions(obj, params);
        if (r) return r;
        edits = def.effects(obj, params);
        await c.query('SAVEPOINT preflight');
        try {
          for (const e of edits) await this.apply(c, tenant, e);
        } catch (err: any) {
          await c.query('ROLLBACK TO SAVEPOINT preflight');
          return { code: 'PREFLIGHT_FAILED', message: String(err.message) } as Rejection;
        }
        await c.query('ROLLBACK TO SAVEPOINT preflight');
        await c.query(`UPDATE action_invocation SET edits=$2, updated_at=now() WHERE id=$1`, [invocationId, JSON.stringify(edits)]);
        return null;
      });
      if (rejection) {
        await tx(c, async () => {
          await c.query(`UPDATE action_invocation SET status='rejected', error=$2, updated_at=now() WHERE id=$1`, [invocationId, JSON.stringify(rejection)]);
          await c.query(`INSERT INTO audit_log (invocation_id, tenant, actor, action, status, detail) VALUES ($1,$2,$3,$4,'rejected',$5)`,
            [invocationId, tenant, actor, actionName, JSON.stringify(rejection)]);
        });
        return { status: 'rejected', invocationId, replayed: false, error: rejection };
      }
      // 5. Writeback to the source system BEFORE the local commit (pending record already persisted).
      if (def.writeback) await this.writeback(invocationId, edits);
      if (opts.crashAfterWriteback) throw new CrashAfterWriteback('simulated crash between writeback and local commit');
      // 6. Commit edits + audit + status atomically.
      await this.commit(c, invocationId, tenant, actor, actionName, edits);
      return { status: 'committed', invocationId, replayed: false };
    } finally {
      c.release();
    }
  }

  private async apply(c: pg.PoolClient, tenant: string, e: Edit) {
    const r = await c.query(
      `UPDATE objects SET data = data || $4::jsonb, version = version + 1 WHERE tenant=$1 AND type=$2 AND pk=$3`,
      [tenant, e.type, e.pk, JSON.stringify(e.patch)]);
    if (r.rowCount !== 1) throw new Error(`object ${e.type}/${e.pk} not found`);
  }

  private async commit(c: pg.PoolClient, id: string, tenant: string, actor: string, action: string, edits: Edit[]) {
    await tx(c, async () => {
      const cur = await c.query(`SELECT status FROM action_invocation WHERE id=$1 FOR UPDATE`, [id]);
      if (cur.rows[0].status !== 'pending') return; // already finished by another worker
      for (const e of edits) await this.apply(c, tenant, e);
      await c.query(`INSERT INTO outbox (invocation_id, payload) VALUES ($1,$2)`, [id, JSON.stringify({ action, edits })]);
      await c.query(`INSERT INTO audit_log (invocation_id, tenant, actor, action, status, detail) VALUES ($1,$2,$3,$4,'committed',$5)`,
        [id, tenant, actor, action, JSON.stringify(edits)]);
      await c.query(`UPDATE action_invocation SET status='committed', updated_at=now() WHERE id=$1`, [id]);
    });
  }

  /** Recovery: finish every pending invocation whose edits were computed. Writeback is re-driven (idempotent). */
  async recover(olderThanMs = 0): Promise<number> {
    const c = await this.pool.connect();
    try {
      const pend = await c.query(
        `SELECT id, tenant, actor, action, edits FROM action_invocation
         WHERE status='pending' AND edits IS NOT NULL AND updated_at < now() - ($1 || ' milliseconds')::interval`, [String(olderThanMs)]);
      for (const r of pend.rows) {
        const def = this.actions.get(r.action)!;
        if (def.writeback) await this.writeback(r.id, r.edits);
        await this.commit(c, r.id, r.tenant, r.actor, r.action, r.edits);
      }
      return pend.rowCount ?? 0;
    } finally { c.release(); }
  }
}
