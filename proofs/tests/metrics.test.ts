import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { freshDb } from '../src/db.ts';
import { checkPath, type SemanticModel } from '../src/metrics.ts';

let db: Awaited<ReturnType<typeof freshDb>>;
const customers: SemanticModel = { name: 'customers', table: 'customers', entities: { customer: 'primary' }, measures: {} };
const orders: SemanticModel = { name: 'orders', table: 'orders', entities: { order: 'primary', customer: 'foreign' }, measures: { revenue: 'sum(order_total)' } };
const lines: SemanticModel = { name: 'order_lines', table: 'order_lines', entities: { line: 'primary', order: 'foreign' }, measures: { qty: 'sum(qty)' } };
const regions: SemanticModel = { name: 'regions', table: 'regions', entities: { region: 'primary' }, measures: {} };

before(async () => {
  db = await freshDb('proof_metrics');
  await db.pool.query(`
    CREATE TABLE customers (customer text PRIMARY KEY, region text);
    CREATE TABLE orders (order_id text PRIMARY KEY, customer text, order_total numeric);
    CREATE TABLE order_lines (line text PRIMARY KEY, order_id text, qty int);
    INSERT INTO customers VALUES ('c1','north'),('c2','south');
    INSERT INTO orders VALUES ('o1','c1',100),('o2','c1',50),('o3','c2',70);
    INSERT INTO order_lines VALUES ('l1','o1',1),('l2','o1',2),('l3','o1',3),('l4','o2',1),('l5','o3',1);`);
});
after(async () => { await db.drop(); });

test('M1 the fan-out bug is real: revenue summed across an order_lines join is inflated', async () => {
  const right = await db.pool.query(`SELECT sum(order_total)::int v FROM orders`);
  const wrong = await db.pool.query(`SELECT sum(o.order_total)::int v FROM orders o JOIN order_lines l ON l.order_id = o.order_id`);
  assert.equal(right.rows[0].v, 220);
  assert.equal(wrong.rows[0].v, 420, 'o1 counted three times');
});

test('M2 the MetricFlow rule refuses that path (orders.order primary → order_lines.order foreign)', () => {
  assert.match(checkPath([orders, lines], ['order'])!, /can fan out/);
});

test('M3 the safe direction is allowed: revenue by customer region (orders.customer foreign → customers.customer primary)', async () => {
  assert.equal(checkPath([orders, customers], ['customer']), null);
  const r = await db.pool.query(`SELECT c.region, sum(o.order_total)::int v FROM orders o JOIN customers c USING (customer) GROUP BY 1 ORDER BY 1`);
  assert.deepEqual(r.rows, [{ region: 'north', v: 150 }, { region: 'south', v: 70 }]);
});

test('M4 quantity by order is safe from the line side (order_lines.order foreign → orders.order primary)', () => {
  assert.equal(checkPath([lines, orders], ['order']), null);
});

test('M5 three hops exceed MAX_JOIN_HOPS = 2', () => {
  const r2: SemanticModel = { ...customers, entities: { customer: 'primary', region: 'foreign' } };
  assert.match(checkPath([lines, orders, r2, regions], ['order', 'customer', 'region'])!, /max is 2/);
});
