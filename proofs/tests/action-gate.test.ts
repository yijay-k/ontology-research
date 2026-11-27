import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { freshDb, tx } from '../src/db.ts';
import { Gate, SCHEMA, CrashAfterWriteback, type ActionDef } from '../src/action-gate.ts';

let db: Awaited<ReturnType<typeof freshDb>>;
let gate: Gate;

type CancelP = { orderId: string; reason: string };
const cancelOrder: ActionDef<CancelP> = {
  name: 'cancelOrder',
  target: (p) => ({ type: 'Order', pk: p.orderId }),
  preconditions: (o) => !o ? { code: 'NOT_FOUND', message: 'order missing' }
    : o.status === 'shipped' ? { code: 'ALREADY_SHIPPED', message: 'a shipped order cannot be cancelled' } : null,
  effects: (_o, p) => [{ op: 'modify', type: 'Order', pk: p.orderId, patch: { status: 'cancelled', reason: p.reason } }],
  writeback: true,
};
const badAction: ActionDef<{ orderId: string }> = {
  name: 'touchMissing', target: (p) => ({ type: 'Order', pk: p.orderId }), preconditions: () => null,
  effects: () => [{ op: 'modify', type: 'Order', pk: 'does-not-exist', patch: { x: 1 } }],
};

before(async () => {
  db = await freshDb('proof_action_gate');
  await db.pool.query(SCHEMA);
  await db.pool.query(`INSERT INTO objects (tenant, type, pk, data) VALUES
    ('t1','Order','o1','{"status":"open"}'), ('t1','Order','o2','{"status":"shipped"}'), ('t1','Order','o3','{"status":"open"}'),
    ('t1','Order','o4','{"status":"open"}')`);
  gate = new Gate(db.pool, new Map<string, ActionDef<any>>([['cancelOrder', cancelOrder], ['touchMissing', badAction]]));
});
after(async () => { await db.drop(); });

const count = async (sql: string, args: unknown[] = []) => Number((await db.pool.query(sql, args)).rows[0].n);

test('G1 same idempotency key twice → one effect, second call replays the first outcome', async () => {
  const a = await gate.execute('t1', 'alice', 'cancelOrder', { orderId: 'o1', reason: 'dup' }, 'key-1');
  const b = await gate.execute('t1', 'alice', 'cancelOrder', { orderId: 'o1', reason: 'dup' }, 'key-1');
  assert.equal(a.status, 'committed'); assert.equal(b.replayed, true); assert.equal(b.invocationId, a.invocationId);
  assert.equal(await count(`SELECT count(*) n FROM ext_ledger`), 1);
  assert.equal(await count(`SELECT version n FROM objects WHERE pk='o1'`), 2);
});

test('G2 ten concurrent calls with one key → exactly one effect', async () => {
  const rs = await Promise.all(Array.from({ length: 10 }, () =>
    gate.execute('t1', 'bob', 'cancelOrder', { orderId: 'o3', reason: 'race' }, 'key-race')));
  assert.equal(rs.filter((r) => !r.replayed).length, 1);
  assert.equal(await count(`SELECT count(*) n FROM action_invocation WHERE idempotency_key='key-race'`), 1);
  assert.equal(await count(`SELECT version n FROM objects WHERE pk='o3'`), 2);
});

test('G3 precondition refusal is audited and changes nothing', async () => {
  const r = await gate.execute('t1', 'alice', 'cancelOrder', { orderId: 'o2', reason: 'x' }, 'key-2');
  assert.equal(r.status, 'rejected'); assert.equal(r.error!.code, 'ALREADY_SHIPPED');
  assert.equal(await count(`SELECT count(*) n FROM audit_log WHERE status='rejected' AND invocation_id=$1`, [r.invocationId]), 1);
  assert.equal(await count(`SELECT version n FROM objects WHERE pk='o2'`), 1);
});

test('G4 preflight failure (edit hits a missing object) leaves no writes and is audited', async () => {
  const r = await gate.execute('t1', 'alice', 'touchMissing', { orderId: 'o4' }, 'key-3');
  assert.equal(r.status, 'rejected'); assert.equal(r.error!.code, 'PREFLIGHT_FAILED');
  assert.equal(await count(`SELECT count(*) n FROM outbox WHERE invocation_id=$1`, [r.invocationId]), 0);
});

test('G5 crash between writeback and local commit → pending record survives; recovery commits once, no double writeback', async () => {
  await assert.rejects(gate.execute('t1', 'carol', 'cancelOrder', { orderId: 'o4', reason: 'crash' }, 'key-4', { crashAfterWriteback: true }), CrashAfterWriteback);
  const inv = (await db.pool.query(`SELECT id, status FROM action_invocation WHERE idempotency_key='key-4'`)).rows[0];
  assert.equal(inv.status, 'pending');
  assert.equal(await count(`SELECT count(*) n FROM ext_ledger WHERE invocation_id=$1`, [inv.id]), 1);  // source already changed
  assert.equal(await count(`SELECT version n FROM objects WHERE pk='o4'`), 1);                         // local not yet
  // retry by the caller with the same key does not act again
  const retry = await gate.execute('t1', 'carol', 'cancelOrder', { orderId: 'o4', reason: 'crash' }, 'key-4');
  assert.equal(retry.replayed, true); assert.equal(retry.status, 'pending');
  const n = await gate.recover();
  assert.equal(n, 1);
  assert.equal((await db.pool.query(`SELECT status FROM action_invocation WHERE id=$1`, [inv.id])).rows[0].status, 'committed');
  assert.equal(await count(`SELECT count(*) n FROM ext_ledger WHERE invocation_id=$1`, [inv.id]), 1);  // still exactly one
  assert.equal(await count(`SELECT version n FROM objects WHERE pk='o4'`), 2);
  assert.equal(await gate.recover(), 0);                                                               // idempotent recovery
});

test('G6 snapshot isolation allows write skew on a cross-object invariant; SERIALIZABLE prevents it', async () => {
  // invariant: a customer keeps at least one primary contact (two contacts, each "demote me" checks the other is still primary)
  await db.pool.query(`CREATE TABLE contact (id text PRIMARY KEY, customer text, is_primary boolean)`);
  const run = async (iso: string) => {
    await db.pool.query(`DELETE FROM contact; INSERT INTO contact VALUES ('a','c1',true),('b','c1',true)`);
    const [c1, c2] = [await db.pool.connect(), await db.pool.connect()];
    const demote = async (c: any, me: string, other: string) => {
      await c.query(`BEGIN ISOLATION LEVEL ${iso}`);
      const r = await c.query(`SELECT is_primary FROM contact WHERE id=$1`, [other]);
      if (r.rows[0].is_primary) await c.query(`UPDATE contact SET is_primary=false WHERE id=$1`, [me]);
      return c;
    };
    let failures = 0;
    try {
      await demote(c1, 'a', 'b'); await demote(c2, 'b', 'a');
      for (const c of [c1, c2]) { try { await c.query('COMMIT'); } catch { failures++; await c.query('ROLLBACK'); } }
    } finally { c1.release(); c2.release(); }
    const primaries = Number((await db.pool.query(`SELECT count(*) n FROM contact WHERE is_primary`)).rows[0].n);
    return { primaries, failures };
  };
  const rr = await run('REPEATABLE READ');
  assert.equal(rr.primaries, 0, 'snapshot isolation lets both commit → invariant broken');
  const ser = await run('SERIALIZABLE');
  assert.equal(ser.primaries, 1, 'serializable aborts one transaction → invariant holds');
  assert.equal(ser.failures, 1);
});
