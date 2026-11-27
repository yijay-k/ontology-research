# Repository audit — alibaba/UnifiedModel

**Role:** public semantic object-graph runtime and agent-query integration reference.  
**Repository:** [alibaba/UnifiedModel](https://github.com/alibaba/UnifiedModel), branch `main`; Apache-2.0 per repository.  
**Validation:** source and selected test files inspected remotely; no build/tests run.

## Architecture reconstructed

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

## Trace A — semantic query boundary

The Query Service handles `.umodel`, `.entity` and `.topo` against GraphStore. External metrics/log operations are represented as downstream query plans. The current code's `normalizeMode` accepts the plan mode and rejects data-execution mode as not implemented, with the docs directing the user to the separate `umodel-assistant` execution flow. Therefore the public repository's semantic query surface is not itself the complete telemetry query executor.

This is a valuable boundary: a semantic layer can resolve which dataset/query a request means and produce a typed plan, while an adapter/executor for Prometheus, Elasticsearch or another backend performs the actual data query.

## Trace B — safe agent tool defaults

`internal/agentgateway/service.go` contains a write-tools-enabled option. The agent integration guide says read/query tools are available, while import/entity-write/entity-expire operations are disabled unless explicitly enabled. The test file includes an assertion that write tools are disabled by default and enabled only through explicit configuration. This is a sound default for agents that should first read and reason before requesting state change.

## Trace C — graph write and search-index repair

`internal/entitystore/service.go` writes entity/relation state to GraphStore and updates the search index as a secondary operation. The source and test fixture show partial-success semantics: a primary graph write may succeed while indexing reports a warning. The service exposes an index restoration/rebuild path by reading the GraphStore. The observed request-key idempotency cache is in-memory; the inspected implementation does not establish durable deduplication across process restart.

## Trace D — model validation

The model schema registry loads schema definitions, and the validator checks the model envelope and important structural requirements. There is a TODO in the validation path for fuller field-level schema validation. This is a reminder to distinguish JSON/YAML shape validation from semantic integrity validation (references exist, keys unique, cardinality valid, source bindings compatible, dependency cycles controlled).

## What UModel is good for

- Model definitions distinct from runtime instances.
- Workspace-scoped object graph semantics.
- Storage provider abstraction.
- Shared query contract across CLI, REST, UI, SDK and MCP.
- Safe agent read/query surface with explicit write opt-in.
- Query planning as a bridge between semantic meaning and external data execution.

## What UModel does not prove

- Full Foundry-grade action transaction engine.
- Complete external metrics/log execution in the repository's Query Service.
- End-to-end multi-tenant enterprise authorization from workspace IDs alone.
- Durable idempotency from an in-process request cache.
- Full ingestion/lineage/quality platform.
- Hosted AgentOne internals or product parity.

## Adoption recommendation

**Learn from:** GraphStore abstraction, model-pack vocabulary, typed query surface, contracts reused across clients, safe MCP/agent defaults and plan/executor split.  
**Adapt:** make idempotency durable, formalise full semantic validation and add end-to-end tenant/policy contracts.  
**Do not assume:** a workspace key is a security model or a query plan is an executed query.
