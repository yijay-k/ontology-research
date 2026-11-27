# Coverage ledger — phase 1

**Date:** 27 November 2026. **Mode:** remote source inspection and web/document research. **No code builds or tests executed.**

| Research target | Docs read | Implementation inspected | Tests inspected | Tests run | Status |
|---|---:|---:|---:|---:|---|
| Original research archive | 32 files inventoried; core code study, six maps and verification report inspected for reconciliation; all files preserved | Not applicable | Not applicable | Not applicable | Preserved unchanged; selected claims cross-checked; not all 32 documents re-audited line-by-line |
| CapTrix/OpenFoundry | README, ADR references, service docs | Definition handlers, batch-save repository, schema outbox, object DB handlers, action execution, writeback, indexer, Cedar gate | Action/writeback test sources selectively | No | Partial deep audit; significant path gaps remain |
| Alibaba UnifiedModel | README, docs index, architecture/query/agent guides | Query service, AgentGateway, entity store, schema validation, GraphStore contract/provider paths | AgentGateway and entity-store test sources | No | Partial deep audit; model storage/provider audit still open |
| Graphiti | docs and code comments | node/edge types, temporal fields, ingestion, edge resolution, search | Not in this phase | No | Partial deep audit |
| LightRAG | README/docs, PostgreSQL storage design | PostgreSQL graph tables, pipeline state/reservation logic, query/graph operations | Not in this phase | No | Partial deep audit |
| DataHub | architecture/docs, module map | Source/workunit pipeline, Kafka emitter and service boundaries | Not in this phase | No | Partial deep audit |
| MetricFlow | semantic layer docs | engine plan/explain, dataflow conversion, join validation | Not in this phase | No | Partial deep audit |
| DBOS TS | workflow docs and API | workflow decorator, executor, system DB, workflow status and events | Not in this phase | No | Partial deep audit |
| OpenFGA | model docs | type-system validation, authorization evaluator structure | Some test file listing; no test body review yet | No | Reconnaissance + partial type-system audit |
| Palantir OSDK TS | API/SDK docs | typed client and action application / validate-only contract | Selected SDK tests not yet reviewed | No | Partial client SDK audit; not server implementation |
| OpenSPG + KAG | repo docs/config map | Lube logical/physical planners and optimizer; KAG solver pipeline, planner, retriever config and math subprocess | Test suites not inspected in this cycle | No | Partial code audit; no production security or accuracy validation |
| Temporal | workflow docs/tree | context mutable-state load, persistence request, event rebuilder | Test trees identified, bodies not comprehensively reviewed | No | Partial deep audit; storage backend and worker execution follow-up open |
| dlt | docs | pipeline extract/normalize/load, incremental cursor, load recovery | Tests not inspected in this cycle | No | Partial source audit; source/destination adapter coverage open |
| Airbyte Postgres + Debezium | CDK/module map | Postgres partition model/creator, CDC handler, offsets, schema history and checkpoint interface | Connector test tree identified, bodies not reviewed | No | Partial connector audit; snapshot-to-CDC handoff needs runtime test |
| OPA | docs/API | Rego evaluation, compiler target contract, HTTP authorizer input/result handling | Authorizer test tree not read in full | No | Partial policy-engine audit; policy bundle lifecycle and PEP coverage open |
| TypeDB | query/storage docs | schema define phases, query type annotations, storage isolation manager | Define integration test source inspected, not run | No | Partial typed-database audit; complete durability/recovery and redefine path open |
| gura105/operational-ontology | original archive source study | Relied on archive's cited source study; current live source not re-audited in phase 1 | Not re-run | No | Historical archive evidence, re-audit pending |
| Other repos named in archive | Inventory from archive | Not re-audited | No | No | Backlog, not complete |

## Priority follow-up

1. Finish OpenFoundry event completeness: verify all public object routes, service wiring, schema validation, delete/link cascades and read authorization.
2. Finish UModel GraphStore providers, model schema contracts, search-index lifecycle and workspace isolation.
3. Inspect tests for Graphiti, LightRAG, MetricFlow and DBOS, and execute selected tests when local clone/build access is available.
4. Deep audit OpenFGA check evaluator, recursive/cycle handling, consistency tokens, caches and tuple datastore adapters.
5. Continue deeper audits for OpenFoundry wiring/event completeness, UModel provider/tenant paths, OpenFGA check evaluator, Temporal worker/task/retry backend paths, dlt/Airbyte checkpoint semantics, OPA bundle policy lifecycle, TypeDB durability, OpenSPG/KAG backend/query tests and Neo4j/agent modules.
6. Extend current company files for all companies in original docs 18–28 with current product and independent market sources.