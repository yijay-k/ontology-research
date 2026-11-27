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

## Recommended decisions (28 Nov 2026)

> **Status: recommended, awaiting owner sign-off.** Each recommendation is drawn from the evidence already in this repository plus the executable proofs in [`proofs/`](../../proofs/README.md) ([results](../../research-log/proof-results.md)). The original decision gate — one legal and one finance workflow end-to-end — is **not yet met**, so treat these as the working baseline for building that end-to-end slice, not as final.

| # | Hypothesis | Recommendation | Evidence | Proof | What would change it |
|---|---|---|---|---|---|
| H1 | Modular monolith first | **Adopt.** One TypeScript service with module-owned tables and explicit interfaces; Docling and (optionally) the MetricFlow sidecar run as side processes. | Research BOM is single-person TypeScript + Postgres ([bill-of-materials](bill-of-materials.md)); CapTrix/openfoundry's 51 services show the cost of the alternative. | — (structural) | A module that needs independent scaling, a different security boundary, or another team. |
| H2 | PostgreSQL as the first authoritative store | **Adopt.** Definitions, objects, edits, actions, audit, outbox, workflow state (DBOS), vectors (pgvector) and graph tables (LightRAG pattern) all in Postgres. | [object-storage-and-indexing](../03-ontology-engine/object-storage-and-indexing.md), [knowledge-graph-retrieval](../06-knowledge-and-evidence/knowledge-graph-retrieval.md#implementation-starting-points-from-source-code), [durable-execution](../09-workflows/durable-execution.md#implementation-starting-points-from-source-code). | G1–G6, T1–T6, D1 all ran on one Postgres 16. | Sustained write or traversal load that Postgres cannot meet in a benchmark. |
| H3 | Keep authoritative objects separate from extracted knowledge | **Adopt.** Shared identities, separate tables and write paths; extracted facts carry provenance (`episodes`/`chunk_ids`) and a confidence/status block; only actions change objects. | [temporal-facts-and-memory-store](../06-knowledge-and-evidence/temporal-facts-and-memory-store.md), [provenance-and-answer-transparency](../06-knowledge-and-evidence/provenance-and-answer-transparency.md), UModel `confidence`. | — (design) | None expected; this is a safety property. |
| H4 | Typed query compiler | **Adopt.** Object-set algebra and metric plans compiled server-side; MetricFlow join matrix and 2-hop cap enforced; text-to-SQL only as a checked fallback. | [object-set-queries](../04-query-and-metrics/object-set-queries.md), [metrics-and-semantic-layer](../04-query-and-metrics/metrics-and-semantic-layer.md#implementation-starting-points-from-source-code). | M1–M5: fan-out bug reproduced and blocked. | — |
| H5 | Local commit + outbox; workflows for external effects | **Adopt, with three mandatory additions:** idempotency key per invocation, a persisted pending record before writeback, and a recovery pass; run writeback as a DBOS workflow; run invariant-protecting actions SERIALIZABLE (with retry) or lock a shared row. | [action-gate-and-transactions](../05-actions-and-rules/action-gate-and-transactions.md). | G1–G6, D1. G6 shows snapshot isolation is not enough. | A target system that cannot be made idempotent → it needs a reconciliation step instead. |
| H6 | Multi-layer policy enforcement | **Adopt.** Layer 1 forced RLS per tenant with a non-owner app role and **`security_invoker` on every view**; layer 2 markings and row/column predicates compiled into SQL; layer 3 Cedar-wasm for yes/no action decisions; OpenFGA only when sharing graphs get deep. | [tenancy-and-isolation](../01-security/tenancy-and-isolation.md), [authorization-model](../01-security/authorization-model.md#implementation-starting-points-from-source-code). | T1–T6; T5 found the view bypass. | Evidence that projections (search, vector, cache) can't carry the same predicates. |
| H7 | Agent configuration is a versioned artifact | **Adopt.** Procedures/skills, tools, guardrails and eval sets versioned together; release = diff → review → eval suite (tau2-style DB-state reward, pass^k) → canary flag (OpenFeature) → snapshot. | [release-pipeline](../10-change-control/release-pipeline.md), [evaluation-and-simulation](../08-agent-platform/evaluation-and-simulation.md); Sierra and Decagon both version agent logic with review. | — (process) | — |

### Recommended technology choices (replacing "not selected")

| Concern | Recommended | Why |
|---|---|---|
| Core API | TypeScript (Node 22) | Research BOM; MCP SDK, Cedar-wasm, isolated-vm and DBOS all TypeScript-native. |
| Primary DB | PostgreSQL 16 + pgvector + pgcrypto | H2; all proofs ran on it. |
| Graph | Postgres tables (LightRAG `pgtable` pattern) | No graph DB needed at this scale. |
| Ingestion | Own TypeScript sync engine with dlt cursor rules; Nango Cloud for OAuth | I1–I3; Airbyte and Nango code are ELv2 (read only). |
| Orchestration | DBOS Transact (MIT core); pg-boss for simple jobs | D1; Temporal needs its own cluster. |
| Authorization | Forced RLS + SQL marking predicates + Cedar-wasm; OpenFGA later | H6, T1–T6. |
| Metrics | Own TypeScript planner with MetricFlow's matrix; sidecar as fallback | M1–M5. |
| Agent runtime | Own model-agnostic loop; `@modelcontextprotocol/server` 2.4.0 for external agents | Multi-model requirement; Claude Agent SDK is commercial-terms. |
| Observability | OpenTelemetry spans into Postgres; promptfoo in CI | Small footprint; Langfuse self-host is seven services. |

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- Palantir: not applicable — this is a project-level or overview component.
- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Open-source implementations: not applicable — product, onboarding or domain content rather than code.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
