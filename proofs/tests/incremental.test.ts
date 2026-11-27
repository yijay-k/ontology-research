import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyIncremental, type Row, type CursorState } from '../src/incremental.ts';

// A source where several rows share a timestamp and new rows arrive at the same timestamp between runs.
const run1: Row[] = [
  { id: 'a', updated_at: '2026-11-01T10:00' }, { id: 'b', updated_at: '2026-11-01T10:05' }, { id: 'c', updated_at: '2026-11-01T10:05' }];
const lateArrival: Row = { id: 'd', updated_at: '2026-11-01T10:05' }; // committed after run 1 read the source
const run2Source = [...run1, lateArrival, { id: 'e', updated_at: '2026-11-01T10:09' }];

const query = (src: Row[], op: '>' | '>=', since: string | null) =>
  since === null ? src : src.filter((r) => (op === '>' ? r.updated_at > since : r.updated_at >= since));

test('I1 naive "updated_at > last" loses the late row that shares the boundary timestamp', () => {
  let last: string | null = null; const loaded: string[] = [];
  for (const src of [run1, run2Source]) {
    const rows = query(src, '>', last); loaded.push(...rows.map((r) => r.id));
    last = rows.reduce((m, r) => (m === null || r.updated_at > m ? r.updated_at : m), last);
  }
  assert.ok(!loaded.includes('d'), 'row d is silently skipped');
});

test('I2 naive "updated_at >= last" loads boundary rows twice', () => {
  let last: string | null = null; const loaded: string[] = [];
  for (const src of [run1, run2Source]) {
    const rows = query(src, '>=', last); loaded.push(...rows.map((r) => r.id));
    last = rows.reduce((m, r) => (m === null || r.updated_at > m ? r.updated_at : m), last);
  }
  assert.ok(loaded.filter((x) => x === 'b').length === 2, 'row b duplicated');
});

test('I3 ">=" plus boundary hashes (dlt rule) loads every row exactly once', () => {
  let state: CursorState = { last_value: null, unique_hashes: [] }; const loaded: string[] = [];
  for (const src of [run1, run2Source, run2Source /* an idempotent re-run */]) {
    const r = applyIncremental(query(src, '>=', state.last_value), state);
    loaded.push(...r.keep.map((x) => x.id)); state = r.state;
  }
  assert.deepEqual(loaded.sort(), ['a', 'b', 'c', 'd', 'e']);
  assert.deepEqual(state.last_value, '2026-11-01T10:09');
  assert.equal(state.unique_hashes.length, 1, 'hash set reset on the new maximum');
});
