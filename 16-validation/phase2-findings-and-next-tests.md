# Phase 2 findings and next tests

**Research date:** 27 November 2026  
**Status:** selected source-level audits and official-document deep dives completed; implementation validation remains open.

## Executive synthesis

The strongest cross-cutting finding is that an enterprise ontology is not merely a graph database with a chat interface. The difficult engineering work sits at the boundaries: source state/checkpointing, schema versus runtime data lifecycle, query planning, metric semantics, authorization freshness, atomic state changes, external side effects and durable agent recovery.

## Findings from original Phase 2 source inspections

1. **OpenFoundry action atomicity needs an exact boundary.** Its inspected `ActionWriteTransaction` stages writes but applies object, link and audit-store operations sequentially. Success tests do not establish rollback on partial failure. A same-database transaction plus outbox is a stronger starting design; cross-system effects require a saga and reconciliation.
2. **Do not hide external effects inside writeback.** OpenFoundry invokes a configured webhook before action planning/validation. Separate read-only preparation from committed external effects.
3. **Tenant is not workspace, and neither is a matter permission.** An absent organisation claim is distinct from a tenant. Legal products also need matter-level access, ethical walls and document-level restrictions.
4. **An ontology platform has multiple schemas and runtimes.** UModel separates model definitions, runtime entities/relations, providers, query planning and agent tools.
5. **Query portability is capability-bound.** UModel validates requested limits/depth/operators against provider capabilities. Contract-test every claimed provider.
6. **Agent read access and write access should be separate capabilities.** UModel write tools are disabled unless explicitly enabled and adapters wired.
7. **Authorization cache freshness is part of the security model.** OpenFGA's latency mode may use cached data; higher-consistency mode bypasses cache. Revocation-sensitive operations need a declared freshness policy.
8. **Durable steps do not make arbitrary remote APIs exactly-once.** Temporal replay and DBOS checkpoints aid orchestration; external calls still need receiver idempotency, a durable operation ledger and reconciliation.

## New documentation and OSDK findings from this pass

9. **A Foundry build is a DAG, not one global transaction.** Job outputs are grouped per job; independent jobs run in parallel; dependent jobs are stopped on failure, but previously completed jobs may already have committed outputs. Our source pipelines must expose partial-build state and data-version lineage.
10. **Incremental correctness depends on append-only inputs.** Foundry distinguishes SNAPSHOT, APPEND and UPDATE. Overwriting existing files with UPDATE breaks downstream append-only incremental processing and requires snapshot/batch recomputation. Do not label arbitrary upsert syncs as append-only.
11. **Dataset branches are not Git branches.** Dataset branch heads point to transaction history and cannot be merged. Do not assume code merge implies data merge.
12. **The ontology read path is a query service, not direct graph traversal.** Palantir publicly distinguishes OMS, object databases, Object Set Service, Actions, Funnel and Functions on Objects. This supports separate metadata, object persistence/indexing, query and mutation boundaries.
13. **Query pagination is part of correctness.** Palantir's API docs and OSDK comments say live pagination can duplicate or omit records when data changes between requests. Snapshot pagination avoids that within a point-in-time view. Page size is only one page; page tokens must be exhausted. Select only needed properties.
14. **Query execution has cost tiers.** OSS describes storage pushdown, in-memory execution and Spark fallback. Derived/computed properties can lose index pushdown. Filtering early and treating provider execution/cost capabilities as explicit planner inputs are important.
15. **Snapshot isolation is not serializability.** Palantir explicitly documents write skew: two actions may read the same invariant and write different objects, both commit, and collectively violate that invariant. Use invariant/anchor rows, database constraints/locks or stronger isolation where needed.
16. **Automatic retries must understand side effects.** Palantir retries transient actions up to five times by default only when no external calls are declared. External webhooks, source calls, OSDK calls and nested functions/actions affect retry classification. Idempotency is required before replaying side effects.
17. **Metrics need a grammar, not merely names.** Dataphin defines derived metrics from atomic metric + business filter + statistical period + statistic granularity and separately records calculation timeliness. Query-time dimension/period choices must obey grain, units, currency/timezone and data freshness.
18. **Question-to-dataset selection is a governed routing hint.** Quick BI Q-Data lets business definitions and synonyms select candidate datasets (up to ten per rule). This can improve intent resolution but must never bypass authorization or semantic query validation.
19. **Agent tasks need durable typed state.** Palantir's public Agent Stack models sessions, typed context items, events and state transitions; sessions can remain open while waiting for human input. Session history itself needs scope-aware permissions.
20. **Agent evaluation should be regression-oriented.** AIP Evals provides per-case evaluators, aggregate metrics, cross-version/model comparisons and traces. The run guide recommends at least three runs for LLM-backed functions to observe variance.

## Provisional architecture direction — not final decisions

- Keep raw/source capture, normalized records, canonical business objects, extracted evidence and derived analytics as distinguishable data classes.
- Commit source cursor/checkpoint only with the corresponding durable staged batch; use stable source IDs and source versions for replay.
- Keep ontology definitions and runtime instances separate; expose object sets as the first-class read contract.
- Make snapshot paging the default for exports, audits and multi-page decisions; allow live paging only with its weaker consistency labelled.
- Compile metrics with explicit base grain, aggregation, business filter, period, dimensions, timezone, currency, freshness, provenance and owner.
- Keep a pure action plan/preview phase separate from transaction commit and external dispatch.
- Use snapshot isolation by default but guard cross-object invariants explicitly; don't treat it as serializable.
- Commit canonical state, action audit and outbox in one local transaction. Run remote writeback through idempotent durable workflows.
- Pin agent/session releases and policy scope. Re-check authorization on each event/action, not only when the session starts.
- Use task outcome, policy compliance, evidence correctness, tool correctness, escalation and cost as separate evaluation dimensions.

These remain hypotheses to test. They are not architecture approvals.

## Phase 2 research artifacts added

- `02-data-platform/phase2-sync-and-build-semantics.md`
- `03-ontology-engine/phase2-object-and-query-contracts.md`
- `05-semantic-and-metrics-engine/phase2-metric-contracts.md`
- `06-action-and-execution-engine/phase2-action-isolation-and-invariants.md`
- `08-agent-platform/phase2-agent-sessions-and-evaluation.md`
- `15-repository-audits/palantir-osdk-runtime-phase2.md`

## Acceptance tests before architecture freeze

### Source and data lifecycle
- Replayed pages/events converge idempotently; cursors advance only after committed staging.
- Out-of-order changes cannot overwrite newer source versions.
- Deletions are explicit tombstones; partial sync absence is not treated as deletion.
- Failed DAG jobs expose completed upstream outputs and their exact versions.

### Ontology/query
- Schema publish does not rewrite runtime facts unnecessarily.
- Stable IDs survive re-sync and re-index.
- Snapshot pagination has no duplicates/missing records; live pagination behaviour is documented.
- Query tokens are bound to query hash, model version, tenant and policy scope.
- Join paths preserve aggregation grain and don't multiply metrics.

### Metrics
- Golden measures reconcile to source totals at approved grain.
- Invalid dimensions/time periods/currencies are rejected or require approved conversions.
- Freshness and stale-data behaviour are explicit.

### Actions/workflows
- Cross-object write skew is prevented for invariants that require it.
- Object state + audit + outbox commit atomically.
- Remote acceptance followed by timeout does not duplicate an external effect.
- Approval/policy revocation before commit blocks execution.
- Recovery after crash resumes without duplicating completed side effects.

### Agent sessions/ADLC
- Sessions resume after restart and long approval waits.
- Duplicate/out-of-order events are safely handled.
- Revoked matter/tenant access blocks the next event and tool call.
- Agent release versions and ontology/tool/policy versions are pinned.
- A golden eval suite runs multiple times and blocks promotion on hard policy violations.

## Next work, in order

1. Restore maps 30 and 31 byte-for-byte from the Phase 1 archive and complete blob-hash validation for all 82 Phase 1 paths.
2. Finish OpenFoundry route/read-authorization/cascade/failure-injection audit and UModel model-pack/provider contract tests.
3. Run OpenFGA revocation/cache tests, OPA/Cedar bundle lifecycle checks and the Temporal-vs-DBOS bake-off.
4. Build the smallest vertical slice following the original architecture: identity → connector → ontology → typed query/metric → action/outbox → document evidence → durable session/workflow → eval and audit.
5. Complete domain discovery before committing to legal or receivables as the first commercial workflow.

## Research integrity

Official vendor docs are product-contract evidence, not complete source disclosure. OSDK code inspection concerns a public client library, not the private Foundry backend. Test sources inspected are not proof of passing tests. No builds, tests, benchmarks or production workflows were run in this pass.
