# Terminology

**Layer:** [00-overview](README.md) · **What it is:** Shared vocabulary and the research charter that defines scope.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (2)

## Earlier engineering notes (Phase 2)

### Terminology

> Source: former `00-foundation/terminology.md` (moved here in the Nov 2026 restructure)

| Term | Working definition |
|---|---|
| Ontology definition / TBox | Type-level model: entity/object types, attributes, relationship types, constraints, rules, metrics, interfaces and actions. |
| Runtime instance / ABox | Actual business objects, links and events conforming to ontology definitions. |
| Source-backed object | Object whose authoritative values are owned by an external system; the ontology stores a mapping/projection and provenance. |
| Ontology-owned object | Object whose authoritative state is maintained by our platform. |
| Derived object/property | Computed from other records/rules; generally recomputable and not independently authoritative. |
| Entity resolution | Linking records from multiple systems to one business identity, with match evidence and uncertainty. |
| Object set | Typed, composable selection of ontology instances; filters, joins/links, aggregation, sort, pagination and policy constraints. |
| Semantic layer | Governed business concepts and measures mapped to underlying data sources. It may or may not execute queries itself. |
| Knowledge graph | Graph of entities and relations, often enriched by evidence and temporal facts. It is not automatically a complete enterprise ontology. |
| Provenance | Origin, source record/document, extraction method, timestamps, confidence, transformations and actor behind a fact. |
| Valid time | When a fact is true in the business world. |
| Transaction/system time | When the platform recorded, changed or invalidated the fact. |
| Action | Named, typed, validated command that applies a bounded business state transition. |
| Workflow | Durable sequence of work, waits, approvals, retries, timers and external interactions. |
| Outbox | Durable event intent written in the same transaction as the local authoritative mutation. |
| Reconciliation | Process that compares local intent/state to external system outcomes and repairs divergence. |
| Marking | Classification or information-control label applied to data/objects/fields. |
| Policy evaluation | Decision about whether a principal/agent may perform an operation on a resource under context and constraints. |
| Projection/index | Derived representation optimised for search, analytics, graph traversal or vector retrieval; not authoritative unless explicitly designated. |
| Agent tool | A constrained interface to read/query or request an action; never equivalent to unrestricted database access. |

### Research charter

> Source: former `00-foundation/research-charter.md` (moved here in the Nov 2026 restructure)

#### Aim

Design a governed enterprise ontology and operational-intelligence platform: a company operating model that applications, analysts and AI agents use to understand business entities, relationships, evidence, metrics, rules, permissions and permitted actions.

This is **not** a generic RAG/chatbot research project and it is not simply a graph-database project. The platform connects source systems to stable business objects, answers questions through typed and governed semantics, retrieves source-linked knowledge, and performs controlled actions/workflows while preserving identity, authorization, provenance, audit and recovery.

The controlling synthesis of the original product architecture is [Original research architecture and build blueprint](system-architecture.md). Its detailed source of truth is the six original reference maps (30–35) in sources/archive-original.

#### Original product baseline

The original research assumed:
- A company model of objects, links, metrics, rules, permissions and actions that AI agents work through.
- Receivables and collections as the first concrete workflow for companies of roughly 100–1,000 staff.
- TypeScript, PostgreSQL with row-level security, one repository and rented model APIs (Claude/Qwen as examples).
- A platform that combines source ingestion, an operational ontology, typed queries/metrics, deterministic rules/actions, knowledge/context, agents and governed workflows.

This is the baseline that maps 30–35 were written to. Preserve it as historical research. Do not silently replace it with a new domain or a generic service diagram.

#### Current strategic direction and domain hypotheses

The subsequent product discussion has prioritised legal/law firms. Treat this as a **current product hypothesis/pivot**, not as a retroactive change to the original research. Legal may become the first domain pack if interviews confirm a valuable workflow. Finance/receivables remains the original structured operational benchmark; construction remains a transferability test.

The platform kernel should remain domain-neutral. Domain-specific entities, rules, permissions, actions and workflows belong in domain packs. A legal pack needs matter-level permissions and ethical walls in addition to firm/tenant isolation, plus evidence-linked document facts that do not become authoritative until reviewed.

#### Product boundary

The research covers these capabilities as connected parts of one operating model:

1. Tenant identity, groups, roles and resource authorization.
2. Source connectivity, ingestion, raw/clean state, sync transactions, CDC and lineage.
3. Versioned ontology definitions, source mappings, runtime objects and relationships.
4. Object-set queries, typed plans, semantic metrics, functions and deterministic computation.
5. Rules, typed action definitions, previews, approvals, transactional edits, audit and outbox.
6. Document ingestion, evidence, entity resolution, knowledge graph, hybrid retrieval and temporal memory.
7. Model gateway, agent identity, role-specific tools, procedures, sessions and MCP.
8. Durable workflows, integrations, external writeback, reconciliation and human handoff.
9. Application/SDK surfaces, developer tooling, evaluation, traces, operations and commercial delivery.

These are research boundaries, not an approved microservice map. Begin with explicit module boundaries in a modular monolith unless scale, isolation, operations or ownership proves that service extraction is necessary.

#### Core research questions

- What makes an ontology operational rather than descriptive?
- What state is source-owned, canonical, mirrored, derived, extracted, user-edited or ephemeral?
- How should ontology definitions, model packs and runtime instances evolve independently?
- How do stable entity identity, links, interfaces, properties and provenance work across source syncs?
- How do object-set queries and semantic metrics avoid invalid joins, bad aggregation grain and permission leaks?
- How can documents produce traceable candidate knowledge without turning LLM outputs into unquestioned facts?
- What does an action transaction guarantee, and where does external writeback require a saga/outbox/reconciliation?
- How does authorization remain consistent across relational, graph, vector, search, cache, agent, workflow and application access?
- How do we evaluate agent end-state, policy compliance, tool correctness, communication quality and cost?
- Which capabilities should be built, adapted, integrated or deferred, based on evidence and runnable tests?

#### Research phases

- **Phase 1:** preserve the supplied source archive, create the six original reference maps and comparative/implementation synthesis, audit selected repositories and record architectural hypotheses.
- **Phase 2:** deepen correctness-critical seams (tenant isolation, ontology/object lifecycle, query planning, transactions, authorization freshness and durable workflows).
- **Phase 3:** validate one domain workflow and implement a runnable vertical slice.
- **Phase 4:** prove security, failure recovery, evaluation, operating economics and pilot readiness.

The exact current file coverage and known archive-integrity exceptions are recorded in the Phase 1/2 reconciliation and coverage ledger.

#### Architecture discipline

Keep facts, vendor claims, source-code observations, inferences and our proposed decisions distinct. Do not freeze the graph store, workflow runtime, policy engine or canonical store from a feature comparison alone. Architecture decisions require an explicit trade-off, testable acceptance criteria, and an observed prototype result.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
