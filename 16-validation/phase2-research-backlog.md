# Phase 2 research backlog — from sample audits to implementation proof

Phase 1 preserves the broad source archive and comparative maps. Phase 2 deepens the seams that determine whether the platform can be built safely. The first correctness-critical deep dives are documented; implementation tests remain open.

## Priority 0 — publish to the target repository

- **Prepared locally, not yet published:** the GitHub connector authenticated as `yijay-k` and could read `yijay-k/ontology-research`, but writes through both Git Data and Contents APIs were rejected with HTTP 403 (`Resource not accessible by integration`). See `publishing-status.md`.
- Reauthorize the GitHub integration for the correct account and ensure the app installation includes this repository with Contents read/write permission. Do not share credentials in chat.
- After write access is confirmed, inspect `main`, preserve existing content, publish the complete research pack, and verify the resulting commit/tree.

## Priority 1 — correctness-critical architecture questions

1. **OpenFoundry — deeper implementation proof:** route registration/startup, object CRUD, outbox/event publish, Cedar, tenant filters, schema migrations, replay, delete/link cascade, and failure-injection tests. Phase 2 has identified staged-but-sequential action writes and pre-plan webhook writeback; prove backing-store semantics and partial-failure recovery. Review AGPL-3.0-only obligations separately.
2. **UModel — provider and model lifecycle:** run all GraphStore contract tests on Ladybug, Neo4j and Gremlin; audit full model validation and pack atomicity, search adapter, workspace scoping and entity-write idempotency.
3. **Action guarantees:** specify canonical DB atomicity separately from external API effects, graph/vector projections and notifications. Design outbox + saga + reconciliation.
4. **Tenant enforcement:** test identity → gateway → service → DB → graph/vector/search → cache → logs → agent tools → durable workflow. Include matter-level ACL and ethical walls.
5. **Workflow runtime:** run the Temporal-vs-DBOS bake-off described in `durable-workflow-deep-dive-phase2.md` with crash, external timeout, approval wait, code migration and recovery.

## Priority 2 — broaden engineering evidence

- Complete OPA/Cedar comparison and OpenFGA datastore/consistency/revocation testing.
- Inspect Neo4j GraphRAG and TypeDB query plans against OpenSPG Lube and our legal query expressivity.
- Inspect LangGraph/PydanticAI and MCP lifecycle for cancellation, context propagation, authentication, approval and observability.
- Inspect Airbyte/dlt test suites for checkpoint correctness and source schema drift.
- Inspect DataHub ingestion lifecycle, metadata aspect versioning and lineage end-to-end.
- Benchmark vector/graph stores with representative synthetic legal/finance data and permission filters.

## Priority 3 — product/domain evidence

- Complete the law-firm interview and map one anonymised workflow before deciding the first legal feature.
- Revisit company entries 18–28 from the original archive with current product docs and customer/problem-fit evidence.
- Keep product observations, case-study claims, pricing, market estimates and third-party estimates separate.
- Build legal/finance/construction domain packs from actual workflow interviews and public/synthetic sample documents.

## Priority 4 — executable proof

- Build a minimal vertical slice with Postgres schema registry, typed objects/relationships, evidence provenance, object-set queries, policy context, action transaction/outbox and durable workflow.
- Add permission-carrying document ingestion and retrieval.
- Run migrations, concurrency, idempotency, tenant/matter isolation, policy revocation, replay and external-writeback failure tests.
- Record exact commit SHA, command, environment, logs and outcome. Do not label source inspection as validation.

## Exit criteria for architecture freeze

Do not freeze the graph store, workflow runtime, authorization engine or primary source of truth until there is code evidence, a runnable vertical slice, security/failure tests, data model and API contracts, clear ownership of canonical state, and a documented alternative/trade-off analysis.