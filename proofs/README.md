# Executable proofs

Small, runnable checks of the engineering claims that the build depends on. Each one runs against a real PostgreSQL 16 database. Results are recorded in [research-log/proof-results.md](../research-log/proof-results.md).

## Run

```bash
# a PostgreSQL 16 server reachable as postgres@localhost:5433 (trust auth), or set PROOFS_ADMIN_URL
cd proofs && npm install && npm test
```

Node 22.18+ runs the `.ts` files directly (type stripping); no build step.

## What each file proves

| File | Claim tested | Engineering component |
|---|---|---|
| [`tests/action-gate.test.ts`](tests/action-gate.test.ts) + [`src/action-gate.ts`](src/action-gate.ts) | G1–G2 idempotency keys give exactly-once effect under duplicates and 10-way concurrency · G3 refusals audited, nothing written · G4 preflight in a rolled-back savepoint catches bad edits · G5 crash between writeback and commit is recovered from a persisted pending record without double writeback · G6 snapshot isolation allows write skew on a cross-object invariant; SERIALIZABLE prevents it | [action-gate-and-transactions](../engineering/05-actions-and-rules/action-gate-and-transactions.md) |
| [`tests/tenant-isolation.test.ts`](tests/tenant-isolation.test.ts) | T1 unset tenant fails closed · T2 cross-tenant reads impossible · T3 `WITH CHECK` blocks cross-tenant writes · T4 `SET LOCAL` does not leak across pooled transactions · **T5 a view owned by a privileged role bypasses RLS unless `security_invoker = true`** · T6 the app role cannot disable RLS or `row_security` | [tenancy-and-isolation](../engineering/01-security/tenancy-and-isolation.md) |
| [`tests/metrics.test.ts`](tests/metrics.test.ts) + [`src/metrics.ts`](src/metrics.ts) | M1 the join fan-out bug is real (revenue 220 → 420) · M2 MetricFlow's entity-type matrix refuses that path · M3–M4 safe directions allowed · M5 `MAX_JOIN_HOPS = 2` | [metrics-and-semantic-layer](../engineering/04-query-and-metrics/metrics-and-semantic-layer.md) |
| [`tests/incremental.test.ts`](tests/incremental.test.ts) + [`src/incremental.ts`](src/incremental.ts) | I1 `> last` silently loses late rows sharing the boundary timestamp · I2 `>= last` duplicates · I3 `>=` plus dlt-style boundary hashes loads every row exactly once, and a re-run is idempotent | [connectors-and-ingestion](../engineering/02-data-platform/connectors-and-ingestion.md) |
| [`tests/durable-execution.test.ts`](tests/durable-execution.test.ts) + [`src/dbos/worker.ts`](src/dbos/worker.ts) | D1 DBOS 5.7.0: a workflow killed after step one resumes on relaunch, step one is not re-run, both step outputs are memoised in `dbos.operation_outputs` | [durable-execution](../engineering/09-workflows/durable-execution.md) |

## Limits

These are single-node correctness proofs, not load or failure-injection tests. The external system in G5 is simulated by a table with its own idempotency key; a real writeback target must offer (or be wrapped to offer) the same. D1 kills the process after a step has committed; a crash *during* a step can still re-run that step, so external effects inside steps must stay idempotent.
