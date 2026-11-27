# Alibaba UModel: model import, graph providers and agent boundary — Phase 2

**Snapshot:** `alibaba/UnifiedModel` main at `5cd06e951195bebfc29e8d256eb0471b135df4b4` (27 November 2026).  
**Evidence level:** source inspected; selected test sources inspected; no build or tests run.  
**License note:** repository README declares Apache-2.0; verify the exact license file before copying or distributing code.

## Scope actually inspected

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

## Finding 1 — model definition, runtime records, query and agent tools are separate services

The repository architecture separates model-pack import/validation, workspace metadata, runtime EntityStore writes, Query Service reads, AgentGateway tool exposure and GraphStore persistence. The public documentation describes model packs as the semantic vocabulary and the EntityStore as the runtime layer that instantiates records and relations. Query Service is the common read surface for model/entity/topology query families. This is a useful separation of contracts; the graph database is not the whole ontology product.

**Design implication (proposed):** model schema and runtime business objects should have separate lifecycle and versioning. A schema publication should be validated and versioned independently of object mutations. Query plans should be compiled against a stable model/schema version. Runtime entities should not silently define the ontology by accidental ingestion.

## Finding 2 — provider selection is an interface plus capability boundary

`graphstore.NewProvider` resolves a provider factory by type. The registry includes `memory`, `file.memory`, `local.ladybug`, `neo4j` and `gremlin` when their provider packages are imported. `DefaultProviderType` is `local.ladybug`. The contract tests explicitly verify that the default app uses Ladybug, that memory and file-memory can be selected, and that unknown provider names fail.

The Neo4j provider states that query evaluation remains in the shared Go engine, so workspace and lifecycle semantics remain consistent with the memory/file-memory implementations; it supports Neo4j and OpenCypher dialect modes. The Gremlin provider likewise delegates reads to the shared evaluator and validates the endpoint/TLS configuration. The repository has a GraphStore contract test suite to exercise common semantics, which is the right portability pattern. A provider abstraction does not make providers feature-identical: `GraphStoreCapabilities` and the planner constrain depth, limit and supported operators.

**Design implication (proposed):** define a small portable semantic core and a capability matrix. Make provider-specific limitations explicit in the compiled query plan and API response. Run the same contract suite against every production provider, plus multi-process, crash and concurrency tests. Do not promise arbitrary Cypher/Gremlin portability.

## Finding 3 — import paths have meaningful filesystem confinement

`Import` confines a caller-supplied path to a configured import root, resolves the root and rechecks discovered files; the source comment specifically calls out a symlink escape. `ImportTrusted` bypasses confinement for trusted bundled sample packs and carries an explicit warning that user input must never reach it. The inspected import tests cover in-root import, absolute path escape, `..` traversal and symlink escape.

**Design implication (proposed):** keep trusted and user-originated ingestion paths as separate capabilities. Never expose a trusted filesystem import method directly through MCP/REST. Prefer content-addressed uploads or a controlled object store for user documents, with malware scanning, MIME validation, extraction limits and tenant-bound metadata.

## Finding 4 — query planner validates provider capability instead of assuming unlimited traversal

`Planner.Plan` parses then validates a plan against GraphStore capabilities. The inspected code enforces provider maximum result limit/top-K and maximum traversal depth, and it rejects `entity-call` for unsupported source types. This is important for cost control and portability.

**Design implication (proposed):** our query API should expose plan/explain output, limits, timeout budgets, row budgets and an explicit execution scope. A natural-language agent should first create a typed query plan and explain it; it should not receive unrestricted query language or raw database credentials.

## Finding 5 — agent writes are explicit opt-in

AgentGateway has a `writeEnabled` flag and injected write-service dependencies. The default constructor leaves write tools disabled. Query, explain, examples and schema validation tools are enabled; model import, entity write and entity expiration require explicit write enablement and adapters. If a write tool is not explicitly enabled and wired, the call fails with a tool-disabled error.

**Design implication (proposed):** agent capabilities should be allowlisted by environment, user, workspace, data classification and action risk. Separate discovery/read tools from write tools. Each write tool should declare input schema, preconditions, policy requirements, approval requirements, idempotency and audit contract. An agent's ability to reason about an action is not permission to execute it.

## Highest-value follow-up tests

- Run the same contract tests against Ladybug, Neo4j and Gremlin with persistence/restart and concurrent writers.
- Test model pack upgrades with backward/forward compatibility and failed import rollback.
- Confirm schema validation and model import cannot partially publish half a pack.
- Verify every workspace-scoped read/write rejects a mismatched workspace, including queries and agent resources.
- Inject GraphStore capability differences and verify the planner rejects or rewrites unsupported operators deterministically.
- Verify AgentGateway write tools remain absent/disabled without explicit opt-in; with opt-in, test authorization at the service boundary, not just UI visibility.
- Add idempotency and optimistic-concurrency tests for entity and relation writes.

## What remains unverified

The pass did not exhaustively audit the schema/model validator, search-index adapter, all provider transaction details, or cross-process consistency. The inspected test files were not executed. README and docs explain the public architecture but do not prove performance or production deployment properties.