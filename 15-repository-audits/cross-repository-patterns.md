# Cross-repository architecture patterns

This document is the main synthesis: repositories are compared by the engineering problem they solve, not ranked as if they were competing full platforms.

## Capability matrix

| Capability | Representative implementation(s) | What the code shows | Not solved by that component alone |
|---|---|---|---|
| Ontology/schema metadata | OpenFoundry definition service; UModel model packs; Palantir OSDK metadata contract | Type definitions, properties, links, schemas and generated contracts | Durable authoritative business-instance state and permission enforcement |
| Runtime object graph | UModel GraphStore/EntityStore; LightRAG PG graph storage; Graphiti nodes/edges | Entity/link storage, graph provider abstraction, JSONB adjacency or temporal facts | Enterprise source ownership, action gates and full domain constraints |
| Data/catalog ingestion | DataHub source/workunit; Airbyte/dlt in archive | Connector contracts, normalisation, work units and event emission | Business object identity and operational writeback |
| Entity resolution / dedup | Graphiti edge/node resolution; archive Splink/Cognee/OpenSPG | Matching and deduplication before graph insertion | A fully governed entity master without stewardship and merge policy |
| Knowledge retrieval | LightRAG; Graphiti; Glean | Hybrid vector/graph/context search, episodes, connector ACLs | Correct business metrics and source mutation |
| Semantic metrics/query | MetricFlow; Fabric semantic models; UModel query plans | Typed query requests, join planning/validation, source bindings | Full ontology transaction and workflow engine |
| Action execution | OpenFoundry action/writeback; Palantir action contract; gura105 in archive | Named actions, edit plans, validation, versions, external writeback concepts | Atomicity across independent external systems |
| Durable workflow | DBOS; Temporal in archive | Persistent workflow/step status, timers, queues, replay | Business authorization and domain-state ownership |
| Authorization | OpenFGA; OPA/Cedar in archive; Palantir docs | ReBAC/ABAC/policy evaluation and filter compilation | Enforcement unless each data plane and tool integrates it |
| SDK/tool integration | Palantir OSDK; UModel MCP/REST/CLI | Typed interfaces and guarded tool discovery | Safe execution without server-side authorization and audit |
| Agent ADLC | Sierra; Decagon; Harvey product workflows | Procedure authoring, simulations, traces, versioning, controlled release | Canonical data model and verified source state |

## Shared patterns observed

### 1. Separate definitions from instances

UModel separates model packs from entity/relation instances. OpenFoundry has a separate ontology-definition service from its object database. Palantir documents ontology resources separately from object/link data. This is a recurring structural boundary, not a coincidence.

**Design implication:** our type registry should version and publish ontology definitions separately from object-instance mutations. A schema change must define how existing instances migrate or remain compatible.

### 2. Make semantic plans inspectable

MetricFlow creates a dataflow/SQL plan and validates joins; UModel can create query plans for downstream telemetry executors; OSDK exposes validate-only action application. This implies a broader principle: do not hide translation and validation inside a model call.

**Design implication:** natural language should compile to a typed query/action IR, explain its assumptions, run deterministic validation and only then execute.

### 3. Keep authoritative state separate from projections

UModel graph writes and search indexing can partially succeed; LightRAG stores graph and vector/chunk representations; OpenFoundry has source object persistence and search projections. DataHub has metadata state and event stream.

**Design implication:** declare source of truth per object/property. Indexes/vectors/graphs are rebuildable projections unless the architecture explicitly assigns authority. Build replay and reconciliation from day one.

### 4. Events need identity, durable intent and replay

OpenFoundry derives deterministic outbox IDs; DataHub emits metadata-change proposals; DBOS persists workflow events and output checkpoints. The common need is durable coordination across components.

**Design implication:** local transaction + outbox, idempotent consumers, schema-versioned events, DLQ, replay, and operator-visible reconciliation.

### 5. Temporal data has multiple clocks

Graphiti distinguishes valid time from transaction time; DBOS stores scheduling and execution time; source data itself has effective timestamps and ingestion timestamps.

**Design implication:** a business fact should carry valid-time bounds, record-time bounds, source-observed time and ingestion time where relevant. Never collapse all timestamps into one `updated_at`.

### 6. Permission is a cross-cutting query invariant

Glean mirrors permissions at connector/index level; Palantir documents object and ontology resource permissions; OpenFGA models tuple-based access; OpenFoundry has Cedar gates, with fail-open wiring risk to investigate. Permission columns or metadata are not enough.

**Design implication:** identity → tenant context → policy decision/filter → repository/query/index/vector/cache/tool/workflow. Test the same principal across every access route and deny on missing/unknown scope.

### 7. Agents need a controlled operating lifecycle

Sierra documents journey traces, simulations, release governance and regression; Decagon exposes AOPs and engineer-owned controls; Harvey product architecture is workflow/document-centric. This is analogous to a software release lifecycle, not a prompt editor.

**Design implication:** agent configuration should be versioned, typed, testable, reviewed, promoted and observable; production outputs should not silently rewrite business policies.

## Important differences—not commonalities

- UModel is a semantic object-graph runtime; Glean is content/people/activity retrieval; MetricFlow is a metrics compiler; DBOS is workflow durability; OpenFGA is authorization. These are complementary layers.
- Graphiti's facts are probabilistic/document-derived knowledge and temporal relationships; OpenFoundry's objects are typed operational state. A platform may use both, but a graph edge is not automatically a validated business fact.
- Fabric IQ emphasises source binding and source-owned data; OpenFoundry materialises runtime object data; Palantir supports an operational read/write engine. Their storage and transaction boundaries differ.
- Palantir OSDK is a client contract; never treat it as source for backend internals.
- AOPs/journeys describe an agent's procedure; they are not substitutes for the domain model that defines what a customer, invoice, legal matter or obligation is.

## Proposed platform decomposition

**Proposed, not decided:**

1. Connectors and ingestion runtime.
2. Metadata/catalog and source-binding registry.
3. Ontology definition and version service.
4. Object runtime and object-set query interface.
5. Entity resolution and identity evidence.
6. Document/knowledge pipeline and hybrid retrieval.
7. Semantic metrics/query compiler.
8. Action engine with transaction/outbox.
9. Durable workflow engine.
10. Authorization/policy layer.
11. Agent runtime/tool gateway and ADLC.
12. Application/SDK and operations/observability.

The first implementation can package many of these as modules in a modular monolith. A service split is an operational decision, not a diagram aesthetic.


## Additional code-traced patterns from the second audit cycle

### 8. Querying should have a compiler pipeline

OpenSPG Lube resolves query blocks against schema into a typed logical plan, applies named logical optimization rules, then maps logical operators into physical graph/RDG operators. TypeDB separately shows a parser → semantic/type analysis → annotated pipeline path. MetricFlow applies typed semantic planning and join validation. These projects all make query interpretation more explicit than a model directly generating arbitrary backend SQL/graph syntax.

**Design implication:** our semantic query surface should have parse/intent → schema resolution → typed query IR → policy injection → optimization → backend plan → explain/execute. The language model may propose the IR; deterministic validators own correctness and authorization.

### 9. Durable ingestion depends on checkpoint meaning, not only timestamps

The Airbyte PostgreSQL CDC bridge restores Debezium offsets and schema history, buffers change events, then emits state on count/time checkpoint intervals. dlt's incremental transform persists cursor values and can deduplicate overlapping cursor ranges by primary key. Its load process handles a crash after destination commit with a pending transition marker so a restored job does not blindly re-run the write.

**Design implication:** ingestion state should include source cursor/offset, schema version/history, stream identity, checkpoint boundary, destination commit and recovery state. “last_updated_at” alone is not a reliable CDC contract.

### 10. A policy engine is not end-to-end authorization by itself

OPA's HTTP authorizer converts path, method, params, headers, body and trusted request identity into Rego input. It fails closed when a configured policy has no result. But that only protects handlers actually placed behind that middleware. OpenFGA/OPA evaluation must be wired into list, object, graph, search/vector, cache, workflow and tool execution paths; a policy decision is not automatically a row filter.

**Design implication:** specify the PDP, policy input contract and PEP coverage map separately. Test all data access paths with the same cross-tenant denial suite.

### 11. Workflow state should be reconstructible

Temporal stores workflow mutation and event-history information through a coordinated persistence request and has a mutable-state rebuilder that reapplies events, versions and state-machine transitions. DBOS uses checkpointed operations and workflow status/output records. Both imply the workflow engine should be able to recover after process loss without trusting process memory.

**Design implication:** persist workflow state transitions, version, event log, scheduled tasks and external-effect checkpoints. Treat downstream notifications as a separately recoverable operation.

### 12. Typed schema is more than field metadata

TypeDB `define` processing handles inheritance/subtyping, relation roles, owns/plays constraints, aliases, value types and annotations in explicit phases, then query analysis resolves variables and fetch annotations against a readable schema snapshot. This is deeper than a table of object-type names and JSON properties.

**Design implication:** decide whether the first ontology release needs strict relation/ownership/cardinality/type checking, interfaces, property constraints and typed query analysis. If these are postponed, document the compatibility and validation gap rather than implying full semantic constraints.

### 13. LLM-generated plans/code are untrusted proposals

KAG's planner passes available executor descriptions to an LLM and parses structured plans. Its Python math executor writes LLM-generated code to a temporary file and launches a subprocess with a default five-second timeout. That does not establish a hardened sandbox. UModel's write tools disabled by default and OSDK's validate-only action path show more conservative alternatives for agent-facing mutation.

**Design implication:** agent tools should be capability-scoped; validate typed args; enforce server-side policy; require human approval for high-impact actions; prohibit arbitrary code execution in application workers. A timeout is not a sandbox.