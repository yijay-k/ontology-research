# Repository audit index

The files here report source-level inspection, not just README summaries. Each report identifies the owning code modules, storage and execution paths, security concerns, test sources and what remains unverified.

| Repository / topic | Main question | Primary evidence |
|---|---|---|
| [CapTrix/openfoundry](openfoundry-captix.md) | How far does a multi-service Foundry-inspired implementation go? | Service handlers, schema repo, Cassandra writeback, action engine, Kafka indexer |
| [OpenFoundry action and tenancy — Phase 2](openfoundry-action-and-tenancy-phase2.md) | What are the actual tenant-claim, action-write and webhook boundaries? | `tenant.go`, `ActionWriteTransaction`, action executor, webhook side effects and tests |
| [alibaba/UnifiedModel](alibaba-umodel.md) | How is the public semantic graph separated from storage, query and agent tools? | GraphStore, EntityStore, Query Service, AgentGateway, schema validator |
| [UModel runtime — Phase 2](alibaba-umodel-runtime-phase2.md) | What do provider contracts, model import, capability planning and agent writes really enforce? | Provider registry, Ladybug/Neo4j/Gremlin, import confinement, planner, AgentGateway and contract tests |
| [OpenFGA](openfga.md) | How do relationship tuples and type systems underpin authorization? | Type validation and check engine |
| [OpenFGA recursion and consistency — Phase 2](openfga-recursion-and-consistency-phase2.md) | How do recursive evaluation and cache freshness affect permission safety? | Recursive evaluator, cycle tests, cache controller, query consistency modes |
| [Temporal](temporal.md) | How are long-running workflow state and history persisted/rebuilt? | History transaction, mutable state loading, event rebuilder and workflow test tree |
| [DBOS](dbos.md) | How can durable workflows and steps persist in PostgreSQL? | Workflow decorator, executor, system DB, status/event model |
| [Durable workflow deep dive — Phase 2](durable-workflow-deep-dive-phase2.md) | What does Temporal-vs-DBOS imply for recovery and external effects? | Current official docs, DBOS recovery test source and workflow code |
| [getzep/graphiti](graphiti.md) | How are facts, episodes and relation validity represented over time? | Node/edge types, ingestion and edge-resolution pipeline, search |
| [HKUDS/LightRAG](lightrag.md) | How does graph/vector RAG work over PostgreSQL with ingestion state and concurrency? | PG graph storage, pipeline, graph extraction and retrieval |
| [datahub-project/datahub](datahub.md) | How are metadata connectors, workunits, schema and event emission standardised? | Source API, workunit, Kafka emitter, metadata service/model modules |
| [dbt-labs/metricflow](metricflow.md) | How can business metrics become typed, validated query plans? | Engine, dataflow plan conversion, join validator |
| [OpenSPG and KAG](openspg-kag.md) | How do semantic graph query compilation and knowledge reasoning differ? | Lube logical/physical planners, KAG solver planner, retrievers and math executor |
| [dlt and Airbyte](dlt-airbyte.md) | How do incremental extraction, package recovery and CDC checkpointing work? | dlt pipeline/load/incremental source; Airbyte Postgres partitions and Debezium state |
| [OPA and TypeDB](opa-typedb.md) | How do policy decisions and typed schema/query execution work? | OPA HTTP authorizer/Rego evaluation; TypeDB define/analyse/snapshot storage |
| [Cross-repository synthesis](cross-repository-patterns.md) | Which patterns recur and which components solve different problems? | Comparative synthesis across audited code |

## Additional security design note

See [`../09-security-and-governance/tenant-isolation-threat-model.md`](../09-security-and-governance/tenant-isolation-threat-model.md) for a proposed tenant/matter threat model and negative-test matrix.

## Audit caveats

- Source links in Phase 2 deep dives are pinned to commit SHAs. Phase 1 source links may still use branch paths and should be re-pinned before an implementation decision.
- Some repositories have only partial code coverage. The coverage ledger states the gaps.
- No code was built and no tests were executed in this research pass. Test files read are explicitly labelled source-inspected only.
- A public repository cannot reveal a company's complete hosted backend or internal systems.
