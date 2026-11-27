# Research charter

## Aim

Design a governed enterprise ontology and operational-intelligence platform: a company operating model that applications, analysts and AI agents use to understand business entities, relationships, evidence, metrics, rules, permissions and permitted actions.

This is **not** a generic RAG/chatbot research project and it is not simply a graph-database project. The platform connects source systems to stable business objects, answers questions through typed and governed semantics, retrieves source-linked knowledge, and performs controlled actions/workflows while preserving identity, authorization, provenance, audit and recovery.

The controlling synthesis of the original product architecture is [Original research architecture and build blueprint](../01-reference-architecture/original-research-architecture.md). Its detailed source of truth is the six original reference maps (30–35) in sources/archive-original.

## Original product baseline

The original research assumed:
- A company model of objects, links, metrics, rules, permissions and actions that AI agents work through.
- Receivables and collections as the first concrete workflow for companies of roughly 100–1,000 staff.
- TypeScript, PostgreSQL with row-level security, one repository and rented model APIs (Claude/Qwen as examples).
- A platform that combines source ingestion, an operational ontology, typed queries/metrics, deterministic rules/actions, knowledge/context, agents and governed workflows.

This is the baseline that maps 30–35 were written to. Preserve it as historical research. Do not silently replace it with a new domain or a generic service diagram.

## Current strategic direction and domain hypotheses

The subsequent product discussion has prioritised legal/law firms. Treat this as a **current product hypothesis/pivot**, not as a retroactive change to the original research. Legal may become the first domain pack if interviews confirm a valuable workflow. Finance/receivables remains the original structured operational benchmark; construction remains a transferability test.

The platform kernel should remain domain-neutral. Domain-specific entities, rules, permissions, actions and workflows belong in domain packs. A legal pack needs matter-level permissions and ethical walls in addition to firm/tenant isolation, plus evidence-linked document facts that do not become authoritative until reviewed.

## Product boundary

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

## Core research questions

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

## Research phases

- **Phase 1:** preserve the supplied source archive, create the six original reference maps and comparative/implementation synthesis, audit selected repositories and record architectural hypotheses.
- **Phase 2:** deepen correctness-critical seams (tenant isolation, ontology/object lifecycle, query planning, transactions, authorization freshness and durable workflows).
- **Phase 3:** validate one domain workflow and implement a runnable vertical slice.
- **Phase 4:** prove security, failure recovery, evaluation, operating economics and pilot readiness.

The exact current file coverage and known archive-integrity exceptions are recorded in the Phase 1/2 reconciliation and coverage ledger.

## Architecture discipline

Keep facts, vendor claims, source-code observations, inferences and our proposed decisions distinct. Do not freeze the graph store, workflow runtime, policy engine or canonical store from a feature comparison alone. Architecture decisions require an explicit trade-off, testable acceptance criteria, and an observed prototype result.
