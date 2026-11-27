# Phase 2 research backlog — from original architecture to implementation proof

Phase 1 establishes the original six-map build reference and a broad evidence base. Phase 2 now has deeper documentation and selected source inspection for data/build semantics, object querying, metrics, action correctness and agent lifecycle. Runtime tests and broader source audits remain open.

## Priority 0 — restore traceability and original source integrity

1. Keep [Original research architecture and build blueprint](../01-reference-architecture/original-research-architecture.md) as the controlling synthesis of maps 30–35.
2. Restore `sources/archive-original/30-map-palantir-platform.md` and `31-map-lingyang-alibaba-offers.md` byte-for-byte from the Phase 1 ZIP and verify all 82 original Phase 1 file blobs.
3. Keep the original receivables assumptions distinct from the later legal pivot. Record the product decision only after workflow and buyer evidence.
4. Keep publishing-status records consistent with the actual main branch.

## Priority 1 — correctness-critical tests

1. **Data lifecycle:** connector replay, cursor atomicity, update/delete handling, schema drift, build partial failure, projection freshness and lineage.
2. **Ontology/query:** schema version publication, stable identity, snapshot pagination, relation traversal fan-out, derived property cost, query token binding and provider contract tests.
3. **Actions/invariants:** snapshot write skew, concurrent writes, idempotency, action version pinning, transaction/outbox boundary, transient retry and external acceptance timeout.
4. **Tenant/matter authorization:** missing/forged tenant, cross-tenant/matter read, ethical wall, document/chunk/vector/search/cache leakage, revocation while a session/workflow is paused.
5. **Agent lifecycle:** durable session resume, duplicate/out-of-order event, release pinning, per-session authorization, repeated evaluation and rollback.
6. **Workflow runtime:** same Temporal-vs-DBOS bake-off under process crash, replay, timers, approval waits, code migration and external effect reconciliation.

## Priority 2 — complete implementation evidence

- Finish OpenFoundry route registration/startup, object CRUD/read authorization, schema migration, delete/link cascade, outbox/event publication and failure-injection tests.
- Run UModel GraphStore contract tests on Ladybug, Neo4j and Gremlin; finish pack atomicity, workspace isolation, search indexing and durable entity idempotency.
- Complete OpenFGA datastore/consistency/revocation tests and OPA/Cedar policy bundle lifecycle.
- Inspect Neo4j GraphRAG, TypeDB and OpenSPG/KAG query plans against required ontology query semantics.
- Inspect LangGraph/PydanticAI and MCP lifecycle for identity, cancellation, state, approval and observability.
- Run Airbyte/dlt tests for checkpoint correctness and source schema drift; inspect DataHub lineage/version end-to-end.

## Priority 3 — broaden the original market and domain evidence

- Revisit original company entries 18–28 with current product documentation and customer/problem-fit evidence.
- Complete law-firm workflow interviews; measure frequency, cycle time, error/risk cost, systems, approver and buyer.
- Keep finance/receivables as the original structured reference domain; compare it with law-firm interview evidence instead of deleting it.
- Build domain packs from real or carefully synthetic workflows and documents.

## Priority 4 — executable proof

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


## Additional schema evolution tests

- Stable source/canonical IDs survive title-key and display-label edits.
- Primary-key change requires an explicit migration of edits, relationships and audit references.
- A one-to-one semantic declaration is backed by an actual uniqueness constraint when business correctness requires it.
- Stateful relationships (membership, representation, allocation, assignment) have their own object identity, lifecycle and permission checks.
- Interface property/link/action contract changes produce a compatibility report for all implementing object types.
- A model package that fails link endpoint or interface constraint validation cannot replace the current published model.
