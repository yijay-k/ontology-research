# Hypotheses and decisions

**Layer:** [00-overview](README.md) · **What it is:** Architecture hypotheses that are proposed but not yet decided, and the gate for deciding them.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Earlier engineering notes (Phase 2)

### Architecture hypotheses — not final decisions

> Source: former `17-decisions-and-tradeoffs/architecture-hypotheses.md` (moved here in the Nov 2026 restructure)

This is a synthesis of evidence, not an approved ADR. Each point needs a prototype, domain test or operational constraint before becoming final.

#### H1 — Modular monolith first

**Hypothesis:** one deployable application with clear internal modules may be the smallest coherent first system; extract services only for independent scaling, reliability, security boundary, team ownership or deployment cadence. OpenFoundry illustrates the complexity of a broad microservice fleet; UModel illustrates how a single semantic service can still expose explicit internal contracts.

**Risks:** shared database coupling and module boundary erosion. Mitigate with module-owned tables, explicit interfaces, event contracts and architecture tests.

#### H2 — PostgreSQL as first authoritative store

**Hypothesis:** use PostgreSQL for ontology definitions, core object state, actions, workflow references and outbox initially. Use JSONB selectively, not as a substitute for typed constraints. Consider graph/vector/search stores as projections/adapters until query volume or traversal requirements justify separate authoritative graph storage.

**Alternatives:** Cassandra for high-write partitioned object workloads; Neo4j/TypeDB for graph-specific constraints/reasoning; external warehouse/lakehouse for analytics.

**Evidence:** OpenFoundry uses PostgreSQL metadata/outbox and Cassandra object storage; LightRAG proves a PostgreSQL graph representation; Graphiti demonstrates temporal facts but stores via graph providers. These projects have different workloads.

#### H3 — Separate authoritative business objects from extracted knowledge graph

**Hypothesis:** business records and agent-extracted evidence should share identity references but keep distinct trust/provenance and write policies.

**Why:** Graphiti and LightRAG show useful LLM-derived facts/relations; these are not automatically correct canonical business state. Legal evidence and contractual obligations need source citation and review.

#### H4 — Typed query compiler

**Hypothesis:** natural language compiles to typed ontology queries and metric plans; the server validates join paths, grain, filters, policy and time boundaries before execution.

**Evidence:** MetricFlow's typed dataflow and join validator; UModel's query-plan boundary; Fabric IQ's source-binding model.

#### H5 — Action commit plus outbox; workflows for external effects

**Hypothesis:** local authoritative object mutation, audit and outbox intent commit atomically in one database transaction. Durable workflow performs external calls and reconciliation.

**Evidence:** OpenFoundry's schema batch edit provides a good local transaction pattern; its Cassandra+PG object writeback demonstrates the partial-commit problem when databases differ; DBOS illustrates durable execution state.

#### H6 — Policy enforcement is multi-layer

**Hypothesis:** tenant isolation via database-level partition/RLS, relationship authorization via ReBAC, context/purpose/marking via policy evaluation, and data-plane filters across object/search/graph/vector/cache.

**Evidence:** Palantir resource/object distinction, Glean permission-aware connectors, OpenFGA and OPA/Cedar. None alone proves all data access paths are protected.

#### H7 — Agent configuration is a versioned product artifact

**Hypothesis:** agent journeys/procedures/tools/guardrails/evaluation sets are versioned and released through review, simulation, regression and canary. Do not allow prompt-only production changes without traceability.

**Evidence:** Sierra's Agent Studio/release governance and Decagon's AOP approach.

#### Proposed initial technology shortlist (not selected)

| Concern | Candidate(s) | Why / caveat |
|---|---|---|
| Core API | TypeScript/NestJS or Go | Existing preference/skills and repo examples; benchmark team productivity and runtime needs |
| Primary DB | PostgreSQL | Transactions, RLS, JSONB, relational constraints, outbox; test graph/query load |
| Vector | pgvector or Qdrant | Keep retrieval projection distinct; test hybrid ranking and ACL filtering |
| Graph | PostgreSQL first; Neo4j/TypeDB if justified | Avoid premature graph database; graph-specific constraints may later justify it |
| Ingestion | dlt/Airbyte/custom connectors | Licensing varies; connector semantics must preserve ACLs and source identity |
| Orchestration | DBOS or Temporal | Compare durability, operational cost, licensing/package gates and TS ergonomics |
| Authorization | Postgres RLS + OpenFGA and/or OPA/Cedar | Need consistent enforcement; no single product solves all layers |
| Metrics | MetricFlow or custom typed planner | Validate semantic join constraints and source-dialect support |
| Agent runtime | Model-independent tool orchestration; LangGraph/PydanticAI candidates | Avoid provider lock-in; action server remains authoritative |
| Observability | OpenTelemetry + traces/evaluation store | Every tool/action/workflow needs correlated audit/trace IDs |

#### Decision gate

No technology should be finalised until at least one legal workflow and one finance workflow run end-to-end with: source ingestion, canonical identity, ontology query, policy enforcement, document retrieval, action preview, approval, local commit, external writeback, reconciliation and evaluation.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
