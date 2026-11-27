# alibaba/UnifiedModel (UModel)

| | |
|---|---|
| **Repository** | <https://github.com/alibaba/UnifiedModel> |
| **Why it matters** | Alibaba Cloud's open ontology runtime (UnifiedModel): definitions separate from instances, typed query surface, MCP agent gateway. |
| **What to take** | TBox/ABox split, model validation, provider capability checks in the query planner, write tools disabled by default, repairable secondary indexes, confined model import. |
| **What not to copy** | Assuming its Query Service executes every metric/log plan (external plans are delegated). |
| **Feeds** | [03-ontology-engine/object-storage-and-indexing](../engineering/03-ontology-engine/object-storage-and-indexing.md), [03-ontology-engine/object-type-registry](../engineering/03-ontology-engine/object-type-registry.md), [04-query-and-metrics/query-plans-and-compiler](../engineering/04-query-and-metrics/query-plans-and-compiler.md), [08-agent-platform/guardrails-and-injection](../engineering/08-agent-platform/guardrails-and-injection.md) |
| **Evidence level** | Phase 2 repository audit (source inspection, not executed) |

> **Fact-check 28 Nov 2026:** open-sourced by Alibaba Cloud on 20 May 2026 with a Universal Semantic Standard initiative; docs at <https://alibaba.github.io/UnifiedModel/>. Public surfaces: REST (OpenAPI), `umctl` CLI, `umodel-mcp` MCP server, web UI, Go/Python SDKs. See [engineering/03-ontology-engine/object-type-registry.md](../engineering/03-ontology-engine/object-type-registry.md#fact-check-notes).

> **Source re-check 28 Nov 2026 (code):** [`alibaba/UnifiedModel@5cd06e9`](https://github.com/alibaba/UnifiedModel/tree/5cd06e9) — Schemas include entity_set, link, confidence, action_config (risk_level), runbook_set (observations, actions, toolkits, knowledge, automations, skills, terms).

## Repository audit: Repository audit — alibaba/UnifiedModel

> Source: former `15-repository-audits/alibaba-umodel.md` (Phase 2 source inspection, not executed).

**Role:** public semantic object-graph runtime and agent-query integration reference.  
**Repository:** [alibaba/UnifiedModel](https://github.com/alibaba/UnifiedModel), branch `main`; Apache-2.0 per repository.  
**Validation:** source and selected test files inspected remotely; no build/tests run.

### Architecture reconstructed

UModel's public README and docs describe a local service around a workspace-scoped object graph. A model pack establishes EntitySets, datasets, links, storage references and relation semantics. EntityStore writes runtime entities and topology relations. Query Service exposes three aligned query surfaces—`.umodel`, `.entity` and `.topo`. AgentGateway and MCP expose discovery/resources/tools. REST, CLI, web UI and SDK share public contracts. GraphStore adapters isolate runtime persistence from higher layers.

Relevant code/docs:

- [`internal/query/service.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/query/service.go)
- [`internal/agentgateway/service.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/agentgateway/service.go)
- [`internal/entitystore/service.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/entitystore/service.go)
- [`internal/umodel/schemaspec/validator.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/umodel/schemaspec/validator.go)
- [`internal/agentgateway/service_test.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/agentgateway/service_test.go)
- [`internal/entitystore/service_test.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/entitystore/service_test.go)
- [`docs/en/guides/agent-integration.md`](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/guides/agent-integration.md)
- [`docs/en/concepts/object-graph-semantic-layer.md`](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/concepts/object-graph-semantic-layer.md)

### Trace A — semantic query boundary

The Query Service handles `.umodel`, `.entity` and `.topo` against GraphStore. External metrics/log operations are represented as downstream query plans. The current code's `normalizeMode` accepts the plan mode and rejects data-execution mode as not implemented, with the docs directing the user to the separate `umodel-assistant` execution flow. Therefore the public repository's semantic query surface is not itself the complete telemetry query executor.

This is a valuable boundary: a semantic layer can resolve which dataset/query a request means and produce a typed plan, while an adapter/executor for Prometheus, Elasticsearch or another backend performs the actual data query.

### Trace B — safe agent tool defaults

`internal/agentgateway/service.go` contains a write-tools-enabled option. The agent integration guide says read/query tools are available, while import/entity-write/entity-expire operations are disabled unless explicitly enabled. The test file includes an assertion that write tools are disabled by default and enabled only through explicit configuration. This is a sound default for agents that should first read and reason before requesting state change.

### Trace C — graph write and search-index repair

`internal/entitystore/service.go` writes entity/relation state to GraphStore and updates the search index as a secondary operation. The source and test fixture show partial-success semantics: a primary graph write may succeed while indexing reports a warning. The service exposes an index restoration/rebuild path by reading the GraphStore. The observed request-key idempotency cache is in-memory; the inspected implementation does not establish durable deduplication across process restart.

### Trace D — model validation

The model schema registry loads schema definitions, and the validator checks the model envelope and important structural requirements. There is a TODO in the validation path for fuller field-level schema validation. This is a reminder to distinguish JSON/YAML shape validation from semantic integrity validation (references exist, keys unique, cardinality valid, source bindings compatible, dependency cycles controlled).

### What UModel is good for

- Model definitions distinct from runtime instances.
- Workspace-scoped object graph semantics.
- Storage provider abstraction.
- Shared query contract across CLI, REST, UI, SDK and MCP.
- Safe agent read/query surface with explicit write opt-in.
- Query planning as a bridge between semantic meaning and external data execution.

### What UModel does not prove

- Full Foundry-grade action transaction engine.
- Complete external metrics/log execution in the repository's Query Service.
- End-to-end multi-tenant enterprise authorization from workspace IDs alone.
- Durable idempotency from an in-process request cache.
- Full ingestion/lineage/quality platform.
- Hosted AgentOne internals or product parity.

### Adoption recommendation

**Learn from:** GraphStore abstraction, model-pack vocabulary, typed query surface, contracts reused across clients, safe MCP/agent defaults and plan/executor split.  
**Adapt:** make idempotency durable, formalise full semantic validation and add end-to-end tenant/policy contracts.  
**Do not assume:** a workspace key is a security model or a query plan is an executed query.

## Repository audit: Alibaba UModel: model import, graph providers and agent boundary — Phase 2

> Source: former `15-repository-audits/alibaba-umodel-runtime-phase2.md` (Phase 2 source inspection, not executed).

**Snapshot:** `alibaba/UnifiedModel` main at `5cd06e951195bebfc29e8d256eb0471b135df4b4` (27 November 2026).  
**Evidence level:** source inspected; selected test sources inspected; no build or tests run.  
**License note:** repository README declares Apache-2.0; verify the exact license file before copying or distributing code.

### Scope actually inspected

- `internal/graphstore/provider.go`
- `internal/graphstore/provider/{ladybug,neo4j,gremlin}/provider*.go`
- `internal/umodel/import.go` and `import_confine_test.go`
- `internal/workspace/service.go` and workspace persistence tests
- `internal/query/planner.go` and planner tests
- `internal/agentgateway/service.go` and agent gateway tests
- GraphStore contract and import/query integration tests

Pinned code links:

- [GraphStore provider registry](https://github.com/alibaba/UnifiedModel/blob/5cd06e951195bebfc29e8d256eb0471b135df4b4/internal/graphstore/provider.go)
- [UModel import service](https://github.com/alibaba/UnifiedModel/blob/5cd06e951195bebfc29e8d256eb0471b135df4b4/internal/umodel/import.go)
- [import path confinement tests](https://github.com/alibaba/UnifiedModel/blob/5cd06e951195bebfc29e8d256eb0471b135df4b4/internal/umodel/import_confine_test.go)
- [workspace service](https://github.com/alibaba/UnifiedModel/blob/5cd06e951195bebfc29e8d256eb0471b135df4b4/internal/workspace/service.go)
- [query planner](https://github.com/alibaba/UnifiedModel/blob/5cd06e951195bebfc29e8d256eb0471b135df4b4/internal/query/planner.go)
- [AgentGateway](https://github.com/alibaba/UnifiedModel/blob/5cd06e951195bebfc29e8d256eb0471b135df4b4/internal/agentgateway/service.go)
- [GraphStore contract tests](https://github.com/alibaba/UnifiedModel/blob/5cd06e951195bebfc29e8d256eb0471b135df4b4/tests/contract/graphstore_contract_test.go)
- [import/query integration test](https://github.com/alibaba/UnifiedModel/blob/5cd06e951195bebfc29e8d256eb0471b135df4b4/tests/integration/umodel_import_query_test.go)

### Finding 1 — model definition, runtime records, query and agent tools are separate services

The repository architecture separates model-pack import/validation, workspace metadata, runtime EntityStore writes, Query Service reads, AgentGateway tool exposure and GraphStore persistence. The public documentation describes model packs as the semantic vocabulary and the EntityStore as the runtime layer that instantiates records and relations. Query Service is the common read surface for model/entity/topology query families. This is a useful separation of contracts; the graph database is not the whole ontology product.

**Design implication (proposed):** model schema and runtime business objects should have separate lifecycle and versioning. A schema publication should be validated and versioned independently of object mutations. Query plans should be compiled against a stable model/schema version. Runtime entities should not silently define the ontology by accidental ingestion.

### Finding 2 — provider selection is an interface plus capability boundary

`graphstore.NewProvider` resolves a provider factory by type. The registry includes `memory`, `file.memory`, `local.ladybug`, `neo4j` and `gremlin` when their provider packages are imported. `DefaultProviderType` is `local.ladybug`. The contract tests explicitly verify that the default app uses Ladybug, that memory and file-memory can be selected, and that unknown provider names fail.

The Neo4j provider states that query evaluation remains in the shared Go engine, so workspace and lifecycle semantics remain consistent with the memory/file-memory implementations; it supports Neo4j and OpenCypher dialect modes. The Gremlin provider likewise delegates reads to the shared evaluator and validates the endpoint/TLS configuration. The repository has a GraphStore contract test suite to exercise common semantics, which is the right portability pattern. A provider abstraction does not make providers feature-identical: `GraphStoreCapabilities` and the planner constrain depth, limit and supported operators.

**Design implication (proposed):** define a small portable semantic core and a capability matrix. Make provider-specific limitations explicit in the compiled query plan and API response. Run the same contract suite against every production provider, plus multi-process, crash and concurrency tests. Do not promise arbitrary Cypher/Gremlin portability.

### Finding 3 — import paths have meaningful filesystem confinement

`Import` confines a caller-supplied path to a configured import root, resolves the root and rechecks discovered files; the source comment specifically calls out a symlink escape. `ImportTrusted` bypasses confinement for trusted bundled sample packs and carries an explicit warning that user input must never reach it. The inspected import tests cover in-root import, absolute path escape, `..` traversal and symlink escape.

**Design implication (proposed):** keep trusted and user-originated ingestion paths as separate capabilities. Never expose a trusted filesystem import method directly through MCP/REST. Prefer content-addressed uploads or a controlled object store for user documents, with malware scanning, MIME validation, extraction limits and tenant-bound metadata.

### Finding 4 — query planner validates provider capability instead of assuming unlimited traversal

`Planner.Plan` parses then validates a plan against GraphStore capabilities. The inspected code enforces provider maximum result limit/top-K and maximum traversal depth, and it rejects `entity-call` for unsupported source types. This is important for cost control and portability.

**Design implication (proposed):** our query API should expose plan/explain output, limits, timeout budgets, row budgets and an explicit execution scope. A natural-language agent should first create a typed query plan and explain it; it should not receive unrestricted query language or raw database credentials.

### Finding 5 — agent writes are explicit opt-in

AgentGateway has a `writeEnabled` flag and injected write-service dependencies. The default constructor leaves write tools disabled. Query, explain, examples and schema validation tools are enabled; model import, entity write and entity expiration require explicit write enablement and adapters. If a write tool is not explicitly enabled and wired, the call fails with a tool-disabled error.

**Design implication (proposed):** agent capabilities should be allowlisted by environment, user, workspace, data classification and action risk. Separate discovery/read tools from write tools. Each write tool should declare input schema, preconditions, policy requirements, approval requirements, idempotency and audit contract. An agent's ability to reason about an action is not permission to execute it.

### Highest-value follow-up tests

- Run the same contract tests against Ladybug, Neo4j and Gremlin with persistence/restart and concurrent writers.
- Test model pack upgrades with backward/forward compatibility and failed import rollback.
- Confirm schema validation and model import cannot partially publish half a pack.
- Verify every workspace-scoped read/write rejects a mismatched workspace, including queries and agent resources.
- Inject GraphStore capability differences and verify the planner rejects or rewrites unsupported operators deterministically.
- Verify AgentGateway write tools remain absent/disabled without explicit opt-in; with opt-in, test authorization at the service boundary, not just UI visibility.
- Add idempotency and optimistic-concurrency tests for entity and relation writes.

### What remains unverified

The pass did not exhaustively audit the schema/model validator, search-index adapter, all provider transaction details, or cross-process consistency. The inspected test files were not executed. README and docs explain the public architecture but do not prove performance or production deployment properties.
