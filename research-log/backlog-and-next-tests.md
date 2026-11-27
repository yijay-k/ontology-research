# Backlog and next tests

> **Status 28 Nov 2026:** the first executable proofs are done — action gate, tenant isolation, metric join safety, incremental cursor, DBOS recovery (21/21 passed). See [proof-results.md](proof-results.md). Items below that those proofs close are marked in that file; the rest stay open.

What is still open: the research backlog by priority, and the acceptance tests that must pass before the architecture is frozen.

## Research backlog

Phase 1 establishes the original six-map build reference and a broad evidence base. Phase 2 now has deeper documentation and selected source inspection for data/build semantics, object querying, metrics, action correctness and agent lifecycle. Runtime tests and broader source audits remain open.

### Priority 0 — restore traceability and original source integrity

1. Keep [Original research architecture and build blueprint](../engineering/00-overview/system-architecture.md) as the controlling synthesis of maps 30–35.
2. Restore `sources/archive-original/30-map-palantir-platform.md` and `31-map-lingyang-alibaba-offers.md` byte-for-byte from the Phase 1 ZIP and verify all 82 original Phase 1 file blobs.
3. Keep the original receivables assumptions distinct from the later legal pivot. Record the product decision only after workflow and buyer evidence.
4. Keep publishing-status records consistent with the actual main branch.

### Priority 1 — correctness-critical tests

1. **Data lifecycle:** connector replay, cursor atomicity, update/delete handling, schema drift, build partial failure, projection freshness and lineage.
2. **Ontology/query:** schema version publication, stable identity, snapshot pagination, relation traversal fan-out, derived property cost, query token binding and provider contract tests.
3. **Actions/invariants:** snapshot write skew, concurrent writes, idempotency, action version pinning, transaction/outbox boundary, transient retry and external acceptance timeout.
4. **Tenant/matter authorization:** missing/forged tenant, cross-tenant/matter read, ethical wall, document/chunk/vector/search/cache leakage, revocation while a session/workflow is paused.
5. **Agent lifecycle:** durable session resume, duplicate/out-of-order event, release pinning, per-session authorization, repeated evaluation and rollback.
6. **Workflow runtime:** same Temporal-vs-DBOS bake-off under process crash, replay, timers, approval waits, code migration and external effect reconciliation.

### Priority 2 — complete implementation evidence

- Finish OpenFoundry route registration/startup, object CRUD/read authorization, schema migration, delete/link cascade, outbox/event publication and failure-injection tests.
- Run UModel GraphStore contract tests on Ladybug, Neo4j and Gremlin; finish pack atomicity, workspace isolation, search indexing and durable entity idempotency.
- Complete OpenFGA datastore/consistency/revocation tests and OPA/Cedar policy bundle lifecycle.
- Inspect Neo4j GraphRAG, TypeDB and OpenSPG/KAG query plans against required ontology query semantics.
- Inspect LangGraph/PydanticAI and MCP lifecycle for identity, cancellation, state, approval and observability.
- Run Airbyte/dlt tests for checkpoint correctness and source schema drift; inspect DataHub lineage/version end-to-end.

### Priority 3 — broaden the original market and domain evidence

- Revisit original company entries 18–28 with current product documentation and customer/problem-fit evidence.
- Complete law-firm workflow interviews; measure frequency, cycle time, error/risk cost, systems, approver and buyer.
- Keep finance/receivables as the original structured reference domain; compare it with law-firm interview evidence instead of deleting it.
- Build domain packs from real or carefully synthetic workflows and documents.

### Priority 4 — executable proof

Build a vertical slice following the original build sequence:
1. Tenant identity and policy context.
2. One source connection with replay-safe staged ingestion.
3. Versioned ontology definitions, keys and runtime objects.
4. Typed object-set and metric query with snapshot paging.
5. Governed action with invariant enforcement and atomic outbox.
6. Evidence-linked retrieval.
7. Durable agent session and workflow.
8. Eval suite, release pinning, audit and rollback.

Record commit, environment, command, logs and observed results. A source-code inspection or a test file is not a passing test.

### Additional schema evolution tests

- Stable source/canonical IDs survive title-key and display-label edits.
- Primary-key change requires an explicit migration of edits, relationships and audit references.
- A one-to-one semantic declaration is backed by an actual uniqueness constraint when business correctness requires it.
- Stateful relationships (membership, representation, allocation, assignment) have their own object identity, lifecycle and permission checks.
- Interface property/link/action contract changes produce a compatibility report for all implementing object types.
- A model package that fails link endpoint or interface constraint validation cannot replace the current published model.

## Phase 2 findings and next tests

**Research date:** 27 November 2026  
**Status:** selected source-level audits and official-document deep dives completed; implementation validation remains open.

### Executive synthesis

The strongest cross-cutting finding is that an enterprise ontology is not merely a graph database with a chat interface. The difficult engineering work sits at the boundaries: source state/checkpointing, schema versus runtime data lifecycle, query planning, metric semantics, authorization freshness, atomic state changes, external side effects and durable agent recovery.

### Findings from original Phase 2 source inspections

1. **OpenFoundry action atomicity needs an exact boundary.** Its inspected `ActionWriteTransaction` stages writes but applies object, link and audit-store operations sequentially. Success tests do not establish rollback on partial failure. A same-database transaction plus outbox is a stronger starting design; cross-system effects require a saga and reconciliation.
2. **Do not hide external effects inside writeback.** OpenFoundry invokes a configured webhook before action planning/validation. Separate read-only preparation from committed external effects.
3. **Tenant is not workspace, and neither is a matter permission.** An absent organisation claim is distinct from a tenant. Legal products also need matter-level access, ethical walls and document-level restrictions.
4. **An ontology platform has multiple schemas and runtimes.** UModel separates model definitions, runtime entities/relations, providers, query planning and agent tools.
5. **Query portability is capability-bound.** UModel validates requested limits/depth/operators against provider capabilities. Contract-test every claimed provider.
6. **Agent read access and write access should be separate capabilities.** UModel write tools are disabled unless explicitly enabled and adapters wired.
7. **Authorization cache freshness is part of the security model.** OpenFGA's latency mode may use cached data; higher-consistency mode bypasses cache. Revocation-sensitive operations need a declared freshness policy.
8. **Durable steps do not make arbitrary remote APIs exactly-once.** Temporal replay and DBOS checkpoints aid orchestration; external calls still need receiver idempotency, a durable operation ledger and reconciliation.

### New documentation and OSDK findings from this pass

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
21. **Object identity needs an immutable key contract.** Palantir warns that object edits are attached to primary-key values; changing the key can require deleting existing edits. Source identity and canonical identity must therefore be separated.
22. **Relationship shape must reflect relationship state.** A direct FK or join-table link is appropriate for simple relationships, while relationships with dates, roles, status, allocations or permissions should be first-class object-backed relationships.
23. **Declared cardinality is not the same as enforced uniqueness.** Palantir documents one-to-one cardinality as an intent signal rather than an enforcement guarantee. Our database must enforce uniqueness/exclusion/foreign-key invariants separately.
24. **Interfaces are abstract contracts, not concrete object types.** They can standardize properties, links and actions across implementing object types, but feature support varies by service and should be treated as capability-specific.

### Provisional architecture direction — not final decisions

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

### Phase 2 research artifacts added

- `02-data-platform/phase2-sync-and-build-semantics.md`
- `03-ontology-engine/phase2-object-and-query-contracts.md`
- `03-ontology-engine/phase2-schema-language-and-relationships.md`
- `05-semantic-and-metrics-engine/phase2-metric-contracts.md`
- `06-action-and-execution-engine/phase2-action-isolation-and-invariants.md`
- `08-agent-platform/phase2-agent-sessions-and-evaluation.md`
- `15-repository-audits/palantir-osdk-runtime-phase2.md`

### Acceptance tests before architecture freeze

#### Source and data lifecycle
- Replayed pages/events converge idempotently; cursors advance only after committed staging.
- Out-of-order changes cannot overwrite newer source versions.
- Deletions are explicit tombstones; partial sync absence is not treated as deletion.
- Failed DAG jobs expose completed upstream outputs and their exact versions.

#### Ontology/query
- Schema publish does not rewrite runtime facts unnecessarily.
- Primary-key migration is blocked unless an explicit edit/link/audit identity migration exists.
- Declared one-to-one relationships have matching database uniqueness constraints where exclusivity is required.
- Object-backed relationships preserve their own metadata, lifecycle and authorization.
- Interface changes identify all implementing object types and produce a compatibility/migration report.
- Stable IDs survive re-sync and re-index.
- Snapshot pagination has no duplicates/missing records; live pagination behaviour is documented.
- Query tokens are bound to query hash, model version, tenant and policy scope.
- Join paths preserve aggregation grain and don't multiply metrics.

#### Metrics
- Golden measures reconcile to source totals at approved grain.
- Invalid dimensions/time periods/currencies are rejected or require approved conversions.
- Freshness and stale-data behaviour are explicit.

#### Actions/workflows
- Cross-object write skew is prevented for invariants that require it.
- Object state + audit + outbox commit atomically.
- Remote acceptance followed by timeout does not duplicate an external effect.
- Approval/policy revocation before commit blocks execution.
- Recovery after crash resumes without duplicating completed side effects.

#### Agent sessions/ADLC
- Sessions resume after restart and long approval waits.
- Duplicate/out-of-order events are safely handled.
- Revoked matter/tenant access blocks the next event and tool call.
- Agent release versions and ontology/tool/policy versions are pinned.
- A golden eval suite runs multiple times and blocks promotion on hard policy violations.

### Next work, in order

1. Restore maps 30 and 31 byte-for-byte from the Phase 1 archive and complete blob-hash validation for all 82 Phase 1 paths.
2. Finish OpenFoundry route/read-authorization/cascade/failure-injection audit and UModel model-pack/provider contract tests.
3. Run OpenFGA revocation/cache tests, OPA/Cedar bundle lifecycle checks and the Temporal-vs-DBOS bake-off.
4. Build the smallest vertical slice following the original architecture: identity → connector → ontology → typed query/metric → action/outbox → document evidence → durable session/workflow → eval and audit.
5. Complete domain discovery before committing to legal or receivables as the first commercial workflow.

### Research integrity

Official vendor docs are product-contract evidence, not complete source disclosure. OSDK code inspection concerns a public client library, not the private Foundry backend. Test sources inspected are not proof of passing tests. No builds, tests, benchmarks or production workflows were run in this pass.
