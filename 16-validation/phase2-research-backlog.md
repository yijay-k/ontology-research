# Phase 2 research backlog — from original architecture to implementation proof

Phase 1 establishes the original six-map build reference and a broad evidence base. Phase 2 deepens correctness-critical implementation seams. The work below distinguishes completed source inspection from tests and product validation that remain open.

## Priority 0 — restore research traceability and source integrity

1. Use [Original research architecture and build blueprint](../01-reference-architecture/original-research-architecture.md) as the controlling synthesis of maps 30–35. Do not replace their detailed v1/v2 checklists with a generic module decomposition.
2. Restore sources/archive-original/30-map-palantir-platform.md and 31-map-lingyang-alibaba-offers.md byte-for-byte from the Phase 1 ZIP. The current Git blob hashes differ despite matching file sizes. Then verify all 82 Phase 1 files by Git blob hash.
3. Keep original receivables assumptions distinct from the later legal pivot. Record the decision and evidence that changes the first vertical; do not silently rewrite history.
4. Keep all publication-status records consistent with the actual main branch.

## Priority 1 — finish correctness-critical implementation audits

1. **OpenFoundry:** trace route registration and startup wiring for object CRUD, outbox, event publication, Cedar, tenant identity and query filters; inspect schema migrations, replay, delete/link cascade and tests. Prove store-specific transaction scope and partial-failure recovery. Review AGPL-3.0-only reuse constraints separately.
2. **UModel:** run all GraphStore contract tests on Ladybug, Neo4j and Gremlin; finish model validation and pack atomicity, search-index lifecycle, workspace scoping and entity-write idempotency.
3. **Action guarantees:** specify canonical database atomicity separately from external API effects, projections and notifications. Design object state + audit + outbox commit, then durable dispatch/saga/reconciliation.
4. **Tenant and matter enforcement:** threat model identity → gateway → service → DB RLS → graph/vector/search → caches → logs → workflow state → agent tools. Run negative tests for missing, forged, cross-tenant and ethical-wall context.
5. **Workflow runtime:** execute the Temporal-vs-DBOS bake-off for process crash, replay, timers, retries, concurrency, approval waits, schema evolution and external-effect reconciliation.

## Priority 2 — broaden engineering evidence from the original 60+ catalogue

- Complete OpenFGA evaluator/datastore/revocation tests; compare OpenFGA with OPA/Cedar as complementary policy components.
- Inspect Neo4j GraphRAG and TypeDB query plans against OpenSPG Lube and the target ontology query requirements.
- Inspect LangGraph/PydanticAI and MCP tool lifecycle, cancellation, identity propagation, approval and observability.
- Inspect Airbyte/dlt test fixtures for checkpoint correctness and source schema drift.
- Inspect DataHub ingestion source lifecycle, metadata aspect versioning and lineage end-to-end.
- Benchmark Postgres, graph and vector choices on the same representative legal/finance workloads with permission filters.

## Priority 3 — reconcile product/domain direction with evidence

- Complete law-firm workflow interviews; capture one real anonymised matter workflow, users, systems, frequency, cycle time, failure cost, approval and buying authority.
- Revisit original company entries 18–28 with current product documentation and customer/problem-fit sources. Keep vendor claims distinct from independent evidence.
- Keep finance/receivables as the original structured reference domain; compare it against the legal workflow evidence rather than deleting it from the plan.
- Derive legal/finance/construction domain packs from actual workflows and public or synthetic sample documents.
- Choose a legal workflow only after comparing value, access, risk and willingness to pay; candidate workflows include evidence-linked matter Q&A and obligation/deadline extraction.

## Priority 4 — executable proof

- Build a minimal vertical slice: Postgres-backed schema registry, typed object/relationship runtime, one source connector, object-set/semantic query, policy context, evidence-linked retrieval, action preview, transactional commit/outbox and durable workflow.
- Run schema migration, concurrent update, idempotency, tenant/matter isolation, policy revocation, retrieval ACL, replay and external-writeback failure tests.
- Record exact source commit, test command, environment, logs and result. A test file is not a passing test.

## Exit criteria for architecture freeze

Do not freeze the graph store, workflow runtime, authorization engine or primary system of record until the original architecture's critical path has code evidence, at least one runnable vertical slice, failure/security tests, clear source-of-truth ownership, data/API contracts and explicit alternatives/trade-offs.
