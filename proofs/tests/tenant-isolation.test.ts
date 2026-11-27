/**
 * Tenant isolation with forced Postgres RLS, the pattern from Przyval/openfoundry 009_multi_tenancy.sql:
 * tenant column on every table, RLS enabled + FORCED, separate non-owner app role, SET LOCAL per transaction.
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { freshDb } from '../src/db.ts';

let db: Awaited<ReturnType<typeof freshDb>>;
let app: pg.Pool;   // connects as the restricted application role

before(async () => {
  db = await freshDb('proof_tenancy');
  await db.pool.query(`
    DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='app_user') THEN CREATE ROLE app_user LOGIN; END IF; END $$;
    DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='schema_owner') THEN CREATE ROLE schema_owner NOLOGIN; END IF; END $$;
    CREATE TABLE invoice (tenant text NOT NULL, id text NOT NULL, amount numeric NOT NULL, PRIMARY KEY (tenant, id));
    ALTER TABLE invoice OWNER TO schema_owner;
    ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
    ALTER TABLE invoice FORCE ROW LEVEL SECURITY;
    CREATE POLICY tenant_isolation ON invoice
      USING (tenant = current_setting('app.tenant', true))
      WITH CHECK (tenant = current_setting('app.tenant', true));
    GRANT SELECT, INSERT, UPDATE, DELETE ON invoice TO app_user;
    -- a view created by the owner WITHOUT security_invoker, and one WITH it
    CREATE VIEW invoice_totals_definer AS SELECT tenant, sum(amount) total FROM invoice GROUP BY tenant;
    CREATE VIEW invoice_totals_invoker WITH (security_invoker = true) AS SELECT tenant, sum(amount) total FROM invoice GROUP BY tenant;
    ALTER VIEW invoice_totals_definer OWNER TO postgres;
    ALTER VIEW invoice_totals_invoker OWNER TO postgres;
    GRANT SELECT ON invoice_totals_definer, invoice_totals_invoker TO app_user;
  `);
  // seed through the policy, one tenant at a time
  for (const t of ['A', 'B']) {
    const c = await db.pool.connect();
    await c.query('BEGIN'); await c.query(`SET LOCAL ROLE app_user`); await c.query(`SELECT set_config('app.tenant', $1, true)`, [t]);
    await c.query(`INSERT INTO invoice VALUES ($1,'1',100),($1,'2',50)`, [t]);
    await c.query('COMMIT'); c.release();
  }
  app = new pg.Pool({ connectionString: db.url.replace('postgres@', 'app_user@'), max: 1 }); // max 1 → every query reuses one pooled connection
});
after(async () => { await app.end(); await db.drop(); });

async function asTenant<T>(tenant: string | null, fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await app.connect();
  try {
    await c.query('BEGIN');
    if (tenant !== null) await c.query(`SELECT set_config('app.tenant', $1, true)`, [tenant]); // = SET LOCAL
    const r = await fn(c);
    await c.query('COMMIT');
    return r;
  } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); }
}

test('T1 no tenant set → zero rows (fails closed)', async () => {
  const r = await asTenant(null, (c) => c.query(`SELECT count(*)::int n FROM invoice`));
  assert.equal(r.rows[0].n, 0);
});

test('T2 tenant A sees only A, even with an explicit WHERE for B', async () => {
  const r = await asTenant('A', (c) => c.query(`SELECT tenant, count(*)::int n FROM invoice GROUP BY tenant`));
  assert.deepEqual(r.rows, [{ tenant: 'A', n: 2 }]);
  const b = await asTenant('A', (c) => c.query(`SELECT count(*)::int n FROM invoice WHERE tenant='B'`));
  assert.equal(b.rows[0].n, 0);
});

test('T3 WITH CHECK blocks writing another tenant’s row', async () => {
  await assert.rejects(asTenant('A', (c) => c.query(`INSERT INTO invoice VALUES ('B','9',1)`)), /row-level security/);
  const u = await asTenant('A', (c) => c.query(`UPDATE invoice SET amount=0 WHERE tenant='B'`));
  assert.equal(u.rowCount, 0);
});

test('T4 SET LOCAL does not leak to the next transaction on the same pooled connection', async () => {
  await asTenant('B', (c) => c.query(`SELECT 1`));
  const r = await asTenant(null, (c) => c.query(`SELECT current_setting('app.tenant', true) v, (SELECT count(*)::int FROM invoice) n`));
  assert.ok(r.rows[0].v === null || r.rows[0].v === '');
  assert.equal(r.rows[0].n, 0);
});

test('T5 GOTCHA: a view owned by a privileged role bypasses RLS unless security_invoker=true', async () => {
  const leak = await asTenant('A', (c) => c.query(`SELECT tenant FROM invoice_totals_definer ORDER BY tenant`));
  assert.deepEqual(leak.rows.map((r) => r.tenant), ['A', 'B'], 'definer view leaks tenant B');
  const safe = await asTenant('A', (c) => c.query(`SELECT tenant FROM invoice_totals_invoker ORDER BY tenant`));
  assert.deepEqual(safe.rows.map((r) => r.tenant), ['A']);
});

test('T6 the app role cannot switch off RLS or change the policy', async () => {
  await assert.rejects(asTenant('A', (c) => c.query(`ALTER TABLE invoice DISABLE ROW LEVEL SECURITY`)), /must be owner/);
  await assert.rejects(asTenant('A', (c) => c.query(`SET LOCAL row_security = off`).then(() => c.query(`SELECT * FROM invoice`))), /row-level security/);
});
