# Coverage ledger — Phase 1 and Phase 2

**Last reconciled:** 27 November 2026  
**Mode:** archive reconciliation, public-document review and remote source-code inspection.  
**Execution status:** no local builds, test suites, benchmarks or production runtime tests were run.

## Repository pack coverage

| Item | Expected | Verified on main | Status |
|---|---:|---:|---|
| Phase 1 bundle paths | 82 | 82 | All present |
| Phase 1 exact Git blob matches | 82 | 75 exact | 5 working-document revisions; 2 original map hash mismatches remain |
| Additional Phase 2 paths | 9 | 9 | All present |
| Total repository blobs | 91 | 91 | Verified |
| Original source Markdown documents | 32 | 32 paths | Two reference-map copies (30, 31) are not exact blob matches to Phase 1 ZIP |
| Repository tests executed | — | 0 | Not executed |

See [Phase 1/2 repository reconciliation](../16-validation/phase1-phase2-reconciliation.md). The Phase 1 archive is included file-by-file, not as a ZIP inside the repository.

## Source-level research coverage

| Research target | Docs/code inspected | Tests inspected | Tests run | Status |
|---|---|---|---|---|
| Original research archive | 32 original notes, six maps and verification report inventoried | Not applicable | No | Preserved by path; two map hashes need restoration; not all 32 docs re-audited line-by-line |
| CapTrix/OpenFoundry | Definition handlers, batch-save repository, schema outbox, object DB handlers, action execution, writeback, indexer, Cedar gate; Phase 2 tenant/action paths | Selected action/writeback test sources | No | Partial deep audit; route/wiring, rollback and recovery gaps remain |
| Alibaba UnifiedModel | README/docs, query service, AgentGateway, EntityStore, schema validation, GraphStore providers, import confinement, capability planner | Selected AgentGateway/entity-store tests and import-path test sources | No | Partial deep audit; run provider contracts and audit full pack publication/idempotency |
| Graphiti | Node/edge types, temporal fields, ingestion, edge resolution and search | Not in this phase | No | Partial source audit |
| LightRAG | PostgreSQL graph tables, pipeline state/reservation logic, graph and retrieval paths | Not in this phase | No | Partial source audit |
| DataHub | Source/workunit pipeline, Kafka emitter and service boundaries | Not in this phase | No | Partial source audit |
| MetricFlow | Engine plan/explain, dataflow conversion and join validation | Not in this phase | No | Partial source audit |
| DBOS TS | Workflow decorator, executor, system DB, status/events and recovery semantics | Selected recovery test source | No | Partial source audit |
| Temporal | History persistence and rebuild paths; Phase 2 comparison with DBOS | Test trees identified; not comprehensively inspected | No | Partial source audit |
| OpenFGA | Type-system validation, recursive evaluator, cycle handling and cache consistency | Selected recursion/cycle test sources | No | Partial source audit |
| OPA / Cedar | OPA authorizer/Rego path and OpenFoundry Cedar wiring | Selected tests not comprehensively reviewed | No | Partial source audit |
| OpenSPG + KAG | Lube logical/physical planners, optimizer, KAG solver planner, retrievers and math subprocess | Not in this cycle | No | Partial source audit |
| TypeDB | Schema define phases, query type annotations and storage isolation manager | Selected define integration source | No | Partial source audit |
| dlt / Airbyte / Debezium | Incremental cursors, load recovery, Postgres partitions, CDC offsets/schema history/checkpoint paths | Test trees identified; not fully read | No | Partial source audit |
| Palantir OSDK TS | Typed client, object sets, action application/validate-only contract | Selected SDK test source not fully reviewed | No | Partial client audit; not server internals |
| Other repositories named in original 60+ study | Listed in original source research | Not re-audited | No | Backlog |

## What Phase 1 covers

The six original reference maps remain the detailed research/build guide:

1. Palantir platform and product architecture.
2. Lingyang/Alibaba and AgentOne offer/technical catalogue.
3. Research literature, knowledge/agent techniques and model economics.
4. Context, open-source building blocks and integrations.
5. Agent-company procedure, release and operating patterns.
6. Market, competitors and the original receivables first-job thesis.

The generic platform capability notes under 02–10 are a synthesis/decomposition, not a replacement for the six maps or their version checklists.

## Phase 2 completion boundary

Phase 2 deepened four correctness-critical areas (OpenFoundry, UModel, OpenFGA, Temporal/DBOS). It did not finish every Phase 2 backlog item and did not audit all 60+ repositories. It generated source-level findings and acceptance tests, not validated production behaviour.

## Priority follow-up

1. Restore maps 30 and 31 exactly from the Phase 1 bundle and re-run Git blob hash checks for all 82 paths.
2. Complete OpenFoundry routes/startup, read authorization, schema migration, delete/link cascade and partial-failure recovery.
3. Run UModel provider contract tests and inspect atomic model-pack publication, workspace isolation and durable idempotency.
4. Run cross-tenant/matter authorization tests across API, SQL, graph, vector, search, cache, workflows and agent tools.
5. Run OpenFGA revocation/cache tests across multiple service instances.
6. Execute a Temporal-vs-DBOS workflow bake-off under crash, retry, approval wait, migration and external timeout.
7. Re-audit the rest of the 60+ source-code catalogue selectively based on risk/priority.
8. Complete legal workflow interviews and choose one validated domain workflow; keep the receivables baseline as the original reference until that decision is evidence-backed.
