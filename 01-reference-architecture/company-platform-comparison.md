# Company and product architecture comparison

**Scope:** Current public product/technical evidence cross-checked with the original archive. Vendor descriptions remain labelled as vendor descriptions. Private internals are not inferred from marketing pages.

## Executive distinction

The companies studied do not all implement the same kind of system:

- **Palantir Foundry Ontology** documents a language, execution engine and developer toolchain joining data, logic, action and dynamic security.
- **Alibaba UnifiedModel (UModel)** is an open semantic object-graph runtime with model packs, entity/relationship writes, graph-store providers and query/agent interfaces. The public repository currently limits some external telemetry operations to query-plan generation.
- **Microsoft Fabric IQ Ontology (preview)** documents a business definition and data-binding layer over source-owned data. Microsoft explicitly says ontology itself is not a general-purpose data-query engine; downstream experiences query the bound sources.
- **Glean** focuses on enterprise knowledge graph/search: content, people and activity, connectors, indexing, permissions and agentic retrieval. It is not equivalent to a transactional object/action runtime.
- **Sierra** and **Decagon** are agent platforms for customer operations. Their public product surfaces reveal workflow authoring, tools/integrations, guardrails, simulations, traces and release controls, not a public general-purpose enterprise object database.
- **Harvey** is a legal workflow and knowledge product, useful for domain design, document intelligence, secure collaboration and legal-specific agent workflows.

## Palantir — primary operational reference

**Official sources:** [Ontology system](https://www.palantir.com/docs/foundry/architecture-center/ontology-system), [object backend architecture](https://www.palantir.com/docs/foundry/object-backend/overview/index.html), [object permissioning](https://www.palantir.com/docs/foundry/object-permissioning/overview), [object edits](https://www.palantir.com/docs/foundry/object-edits/overview), [actions](https://www.palantir.com/docs/foundry/action-types/overview), [functions on objects](https://www.palantir.com/docs/foundry/functions/functions-on-objects).

### Documented product architecture

Palantir describes the Ontology as a fourfold integration of data, logic, action and security, organised conceptually into a Language, Engine and Toolchain. The Language includes objects, properties, links, action types, automations, logic and interfaces. The Engine provides read/write architecture and materialisations. The Toolchain supports applications and developers through OSDK and other tooling.

Its documented backend has distinct functional components: Ontology Metadata Service, object databases, Object Set Service, Actions, Object Data Funnel and Functions on Objects. This is a strong warning against compressing “ontology” into one graph database or CRUD API. Definitions, object persistence, object-set query, edits/action execution, ingestion/indexing and developer tooling are separate concerns.

### Action and security semantics

Palantir documentation describes actions as transactions that change one or more objects according to configured logic. Object permissioning distinguishes permissions on ontology resources (schema/type/action resources) from permissions on object/link instances. Its object-edit documentation describes source-backed data combined with user edits. The original archive also captured consistency guarantees: atomicity applies to Ontology edits within its guarantee boundary; external webhooks/notifications are outside that same atomic guarantee. Exact guarantee scope must be read per action type and current docs.

### What to learn

- A separate ontology language/type registry and runtime.
- Object-set API as a first-class query abstraction.
- Typed action definitions plus server-side validation and controlled edit plans.
- Permissions evaluated at interaction time, not only at ingestion.
- Distinction between source-derived data and user/ontology edits.
- Generated typed SDKs and application tooling.

### What is not public

The official service overview is architectural documentation, not a full implementation disclosure. OSDK source code is a client contract and cannot reveal internal object database or action-server implementation. We should not invent Palantir's private algorithms from public diagrams.

## Alibaba Cloud / Lingyang / AgentOne and UModel

**Sources:** [Alibaba UnifiedModel repository](https://github.com/alibaba/UnifiedModel), [UModel docs index](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/README.md), [Object Graph Semantic Layer](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/concepts/object-graph-semantic-layer.md), [Agent integration guide](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/guides/agent-integration.md).

The user's original archive has separate research on Lingyang/AgentOne, Dataphin and Quick BI AIPro. Keep that enterprise product research distinct from the public UModel repository: UModel's public implementation is evidence for the open semantic-layer/runtime project, not proof of AgentOne's hosted internals.

UModel's current README describes a local service around a workspace-scoped object graph. Model packs define EntitySets, datasets, links, storage and relation semantics. EntityStore writes runtime entities and topology relations. Query Service exposes `.umodel`, `.entity` and `.topo`. AgentGateway/MCP exposes discovery, resources, query examples and tools; UI, CLI, REST and SDK use shared contracts. GraphStore providers include memory, file-backed, Ladybug, Neo4j and Gremlin.

The current public query code and agent guide expose a key limitation: external metrics/log queries can be represented as query plans for downstream Prometheus/Elasticsearch execution; the public Query Service does not itself execute all downstream telemetry plans. Write tools are disabled by default and explicitly enabled. Entity writes can persist the graph record before the search index, returning a warning if the secondary index update fails; the service exposes index restoration. The idempotency cache inspected is in-process, not proven durable across restart.

### What to learn

- Semantic model definitions distinct from actual runtime graph records.
- Provider abstraction so semantic query contracts can target different graph stores.
- An agent gateway that exposes controlled query context and keeps write tools opt-in.
- Separate indexing/search repair from primary graph persistence.
- Public contracts shared across CLI, REST, MCP, SDK and UI.

### What not to assume

The public UModel repository is not a complete Foundry replacement. Do not infer full enterprise RBAC, external telemetry execution, data ingestion or business transaction guarantees from the semantic layer alone. Do not assume the open-source UModel implementation is identical to AgentOne's commercial architecture.

## Microsoft Fabric IQ — semantic context and source bindings

**Sources:** [Fabric IQ docs](https://learn.microsoft.com/en-us/fabric/iq/), [Ontology overview, updated 16 October 2026](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview), [data binding](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-bind-data), [generating ontology from semantic models](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models), [rules](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules).

The current Microsoft docs mark ontology as **preview**. They explicitly describe ontology as a business-context and semantic modelling layer that stores definitions and bindings, not itself a general-purpose data-query engine. Source data remains in owning systems; consumer experiences can query live bound sources. Bindings map entity types, properties, relationships and metrics to supported sources. Microsoft documents entity types, keyless entities, namespaces, inheritance, shared properties, rules and metrics. Power BI DAX measures remain owned by the source semantic model while ontology carries source and business context. The docs state an old ontology experience retires on 31 January 2027; that lifecycle detail is time-sensitive and should be rechecked before implementation planning.

### What to learn

- Explicit source bindings and source ownership.
- Reuse of an existing governed semantic model rather than duplicating every metric.
- Ontology definitions and graph storage are distinct capabilities.
- Rules and metric context can be attached to entity types and relationships.
- Proposal-first AI assistance for model generation and changes.

### Product boundary

Fabric IQ's public ontology surface is a good reference for a source-bound semantic model. It is not a drop-in action transaction runtime. It should be compared to the modelling/binding parts of the platform, not treated as a counterpart for every Foundry backend service.

## Glean — enterprise knowledge graph and permission-aware retrieval

**Sources:** [Knowledge Graph](https://docs.glean.com/security/knowledge-graph), [connector architecture](https://docs.glean.com/connectors/connectors-power-glean), [code search](https://docs.glean.com/security/how-code-search-works).

Glean's public docs describe three knowledge graph pillars: content, people and activity. Connectors crawl document/message/ticket/code content, metadata, identity/permissions and activity signals. The resulting graph and indexes feed search, chat/RAG and agents using indexed, live and hybrid retrieval. Their docs stress permission mirroring where source connectors provide it. Code search has a dedicated crawl, lexical+semantic indices and agentic loop.

### What to learn

- Connectors are semantic adapters, not simple file downloaders: they normalize content, metadata, ACLs and activity.
- Identity and permissions are data assets that must be synced and used at query time.
- Enterprise retrieval often needs indexed, live and hybrid access rather than one global vector search.
- Search results must retain source identity and click-through provenance.

### Boundary

This is knowledge retrieval and enterprise context, not a complete canonical object model or transactional operational platform.

## Sierra — agent development lifecycle and observable operations

**Sources:** [Agent Studio](https://sierra.ai/product/agent-studio), [Agent SDK](https://sierra.ai/product/agent-sdk), [Your agent, laid bare](https://sierra.ai/blog/your-agent-laid-bare-and-why-it-matters) (22 September 2026), [release governance](https://sierra.ai/uk/blog/release-governance-guardrails-for-agents-at-scale), [agent testing guide](https://sierra.ai/learn/how-to-test-ai-agents).

Sierra publicly exposes journeys built from agent instructions, tools and dynamic data, knowledge sources, traces, integrations and agent actions, simulations, outcome-based evaluations and regression tests. Its release-governance article describes checks/simulations, merge approvals and split-traffic rollout. The September 2026 article says journey/action/policy/persona definitions can be inspected and edited, traces show decision/tool/response records, and data can be exported to observability/data systems; it also describes agent configuration living in a Git repository. Treat such statements as vendor descriptions.

### What to learn

- An Agent Development Lifecycle (ADLC): build → inspect → simulate → review → canary → observe → revise.
- Trace visibility for each decision and tool call.
- Real workflow outcomes and guardrails are better tests than prompt-quality alone.
- Production failures should become regression cases.
- Operational telemetry can be exported into existing infrastructure.

### Boundary

Sierra's public product is primarily an agent platform for customer-facing workflows. It is useful for orchestration, governance and evaluations; not proof of general-purpose enterprise ontology storage.

## Decagon — business-authored procedures with engineering controls

**Sources:** [Product overview](https://decagon.ai/product/overview), [Agent Operating Procedures](https://decagon.ai/blog/from-sops-to-agent-operating-procedures).

Decagon describes AOPs as natural-language instructions that compile into structured logic for agents. Business/CX teams can author and iterate procedural behaviour; engineers manage underlying tools, integrations, guardrails and versioning. Duet is presented as a collaborative natural-language interface. This suggests a design where the editable business procedure is not identical to arbitrary model prompt text; it is translated into a controlled execution structure.

### What to learn

- Separate business procedure authoring from tool implementation.
- Convert SOPs into discrete triggers, steps, actions, conditions and escalation points.
- Make guardrails, integrations and versions inspectable by engineers.
- Evaluate processes against repeatable case outcomes.

### Boundary

AOPs describe agent workflow logic in a CX product. They do not by themselves provide enterprise object identity, generalized type systems or data governance.

## Harvey — vertical legal workflow and knowledge product

**Sources:** [Harvey platform](https://www.harvey.ai/platform), [Getting Started with Harvey (29 October 2026)](https://help.harvey.ai/articles/getting-started-with-harvey).

Harvey publicly presents Agents, Vault, Knowledge, Workflows, Spaces, Command Center, Contract Intelligence and Horizon Scanning. Its user guide lists Threads, Vault, Workflows, History and Library. The engineering lessons are mostly product/domain-side: legal work is a combination of secure matter/document context, bulk document analysis, research with grounded citations, reusable workflow procedures, collaboration and reviewable generated outputs.

### What to learn

- Domain-specific ontology should model matter, client, party, contract, clause, obligation, deadline, authority, precedent, document, evidence and approval separately.
- Document collections need matter/space scopes and permission boundaries.
- Legal agents need source citations, document-level provenance and human review for high-stakes outputs.
- Workflow templates and playbooks are as important as free-form chat.

### Boundary

Public product pages do not disclose the full internal legal ontology, retrieval stack, training, evaluation or policy architecture. This file does not infer those internals.

## Cross-company summary

| Company | Strongest public evidence area | Not interchangeable with |
|---|---|---|
| Palantir | Ontology language + read/write engine + action/security/toolchain | A catalog or RAG engine alone |
| Alibaba UModel | Public semantic object graph + query/MCP contracts | Hosted AgentOne internals or full enterprise ETL |
| Fabric IQ | Source-bound semantic definitions and business context | Standalone object/action transaction engine |
| Glean | Connector normalization, ACL-aware enterprise retrieval | Canonical transactional business-object runtime |
| Sierra | Agent authoring, actions, simulation, release and trace lifecycle | Enterprise data/ontology store |
| Decagon | SOP-to-procedure authoring, business-engineering collaboration | General data platform |
| Harvey | Legal work product, knowledge, documents and reusable workflows | Generic ontology runtime |

## Additional company cross-check and source boundaries

### Microsoft Fabric IQ — source-bound ontology, not an object transaction runtime

Microsoft's current [Fabric IQ ontology overview](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview) and [data binding documentation](https://learn.microsoft.com/en-us/fabric/iq/ontology/data-bindings) describe entity types, properties, relationships, metrics, rules and bindings to data that remains in source systems. The documentation distinguishes the ontology definition/context layer from the underlying data query engine; it is not itself a general-purpose query engine. The feature is documented as preview in the current material. This is materially different from Palantir's documented operational object read/write engine.

**Lesson:** a semantic ontology can sit over source-owned data and generate context without becoming the source-of-truth database. Our design must explicitly decide which business objects are source-backed/bound and which are platform-owned materialised operational objects.

### Glean — permission-aware enterprise content graph

Glean's [knowledge graph](https://www.glean.com/product/knowledge-graph) and [connector documentation](https://developers.glean.com/connectors) describe a content/people/activity graph built from connector-normalised documents, metadata, permissions and activity. It supports retrieval across indexed and live/hybrid sources. This is a valuable pattern for enterprise document/knowledge context, but it is not evidence of a transactional business object/action engine.

**Lesson:** connector sync must include source ACLs and identity mapping, not just content and embeddings. Retrieval must preserve source document IDs, permissions and provenance.

### Sierra and Decagon — agent configuration requires a release lifecycle

Sierra's [Agent Studio](https://sierra.ai/product/agent-studio), [testing guidance](https://sierra.ai/learn/how-to-test-ai-agents) and [release governance](https://sierra.ai/uk/blog/release-governance-guardrails-for-agents-at-scale) expose journeys/instructions, tools, traces, simulations, guardrails and controlled releases. Decagon's [Agent Operating Procedures](https://decagon.ai/blog/from-sops-to-agent-operating-procedures) describe converting business procedures into structured agent operating logic with engineering-owned integrations/guardrails.

**Lesson:** agent prompts/configuration must be versioned, tested against scenarios, reviewed, promoted, traced and rolled back. Production failures should become regression cases.

### Harvey — domain product surface, not an exposed generic ontology

Harvey's [platform](https://www.harvey.ai/platform) presents legal research, documents, workflows and agent experiences. The public product surface is useful for deriving legal-domain tasks and objects (matter, party, agreement, clause, obligation, evidence, authority and review), but it does not reveal the private internal data model, retrieval stack or policy engine.

**Lesson:** use product surface and public workflow behaviour to shape a legal domain pack, but do not infer Harvey's backend architecture from the UI.

## Implication for our platform

**Proposed:** keep the ontology/runtime as the common business object and action substrate, but treat data ingestion, knowledge retrieval, semantic metrics, workflow durability and agent authoring as separate bounded capabilities. The shared model should connect them through typed contracts and policy enforcement. Do not force a single graph store to be the warehouse, vector database, metrics engine, workflow state store, action transaction manager and agent memory at once.