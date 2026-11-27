/**
 * Incremental cursor with boundary de-duplication, ported from dlt
 * (dlt/extract/incremental/transform.py @f85861b): closed range start, rows equal to the
 * stored last_value are de-duplicated by primary-key hash, the hash set resets on a new maximum.
 */
import { createHash } from 'node:crypto';

export type CursorState = { last_value: string | null; unique_hashes: string[] };
export type Row = { id: string; updated_at: string; [k: string]: unknown };

const h = (r: Row) => createHash('sha256').update(r.id).digest('hex').slice(0, 16);

/** Filter one extracted batch (source query was `updated_at >= last_value`) and return the new state. */
export function applyIncremental(rows: Row[], state: CursorState): { keep: Row[]; state: CursorState } {
  const start = state.last_value;
  const seen = new Set(state.unique_hashes);
  let last = start;
  let atLast: Row[] = [];
  const keep: Row[] = [];
  for (const r of rows) {
    if (start !== null && r.updated_at < start) continue;                    // below the window
    if (start !== null && r.updated_at === start && seen.has(h(r))) continue; // already loaded at the boundary
    keep.push(r);
    if (last === null || r.updated_at > last) { last = r.updated_at; atLast = [r]; }
    else if (r.updated_at === last) atLast.push(r);
  }
  const hashes = last === start ? [...seen, ...atLast.map(h)] : atLast.map(h);
  return { keep, state: { last_value: last, unique_hashes: [...new Set(hashes)] } };
}
