# Proof results — 28 Nov 2026

Environment: PostgreSQL 16.15 (Ubuntu), Node 22.23.5, `pg` 8.x, `@dbos-inc/dbos-sdk` 5.7.0. Command: `cd proofs && npm test`. Source: [`proofs/`](../proofs/README.md).

## Result: 21 / 21 passed

```
ok 1 - G1 same idempotency key twice → one effect, second call replays the first outcome
ok 2 - G2 ten concurrent calls with one key → exactly one effect
ok 3 - G3 precondition refusal is audited and changes nothing
ok 4 - G4 preflight failure (edit hits a missing object) leaves no writes and is audited
ok 5 - G5 crash between writeback and local commit → pending record survives; recovery commits once, no double writeback
ok 6 - G6 snapshot isolation allows write skew on a cross-object invariant; SERIALIZABLE prevents it
ok 7 - D1 DBOS: a workflow that crashes after step one resumes on relaunch without re-running step one
ok 8 - I1 naive "updated_at > last" loses the late row that shares the boundary timestamp
ok 9 - I2 naive "updated_at >= last" loads boundary rows twice
ok 10 - I3 ">=" plus boundary hashes (dlt rule) loads every row exactly once
ok 11 - M1 the fan-out bug is real: revenue summed across an order_lines join is inflated
ok 12 - M2 the MetricFlow rule refuses that path (orders.order primary → order_lines.order foreign)
ok 13 - M3 the safe direction is allowed: revenue by customer region (orders.customer foreign → customers.customer primary)
ok 14 - M4 quantity by order is safe from the line side (order_lines.order foreign → orders.order primary)
ok 15 - M5 three hops exceed MAX_JOIN_HOPS = 2
ok 16 - T1 no tenant set → zero rows (fails closed)
ok 17 - T2 tenant A sees only A, even with an explicit WHERE for B
ok 18 - T3 WITH CHECK blocks writing another tenant’s row
ok 19 - T4 SET LOCAL does not leak to the next transaction on the same pooled connection
ok 20 - T5 GOTCHA: a view owned by a privileged role bypasses RLS unless security_invoker=true
ok 21 - T6 the app role cannot switch off RLS or change the policy
# tests 21
# pass 21
# fail 0
# duration_ms 3713.676821
```

## What the results change

| Finding | Consequence for the build |
|---|---|
| Idempotency key + persisted pending record + recovery pass gives exactly-once local effect and no double writeback, including after a crash between writeback and commit (G1, G2, G5). | These three pieces are **required**, not optional. They close the gaps stated in operational-ontology's own docs. Writeback targets must be idempotent on the invocation id (or be wrapped). |
| Snapshot isolation (REPEATABLE READ) let two concurrent actions break a cross-object invariant (G6). | Actions that protect invariants across objects must run SERIALIZABLE (with retry) or lock a shared row. Matches Palantir's own warning that snapshot isolation "does not catch write skew". |
| Forced RLS + non-owner app role + `SET LOCAL` fails closed and does not leak across pooled transactions (T1–T4, T6). | Adopt as the tenant floor. |
| **A view owned by a privileged role silently bypasses RLS** (T5). | Every view must be created `WITH (security_invoker = true)`; add a migration lint that rejects views without it. Not in the research before this test. |
| MetricFlow's join matrix catches the classic revenue fan-out (420 vs 220) (M1–M5). | Port the matrix and hop cap into the TypeScript metric compiler; it is a correctness gate, not an optimisation. |
| Both naive watermark strategies are wrong (I1 loses rows, I2 duplicates); dlt's boundary-hash rule is exact (I3). | The sync engine must store `unique_hashes` with the cursor. |
| DBOS resumes a crashed workflow at the next step with completed steps memoised (D1). | DBOS is fit for durable writeback on Postgres. A crash *inside* a step can repeat it, so step effects stay idempotent. |

## Not yet proven

Load and latency; multi-node workers; real external systems (Xero, email); policy enforcement across search/vector/graph projections; agent evaluation runs. These remain in [backlog-and-next-tests.md](backlog-and-next-tests.md).
