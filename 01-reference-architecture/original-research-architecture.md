# Original research architecture and build blueprint

**Status:** reconciled on 27 November 2026  
**Authority:** the six original reference maps in sources/archive-original/30–35  
**Purpose:** restore the architecture the original research actually specified, and distinguish it from the later legal-market pivot.

This is the controlling synthesis of the original research architecture. It is deliberately more specific than a generic list of platform services. The six reference maps are build references; this document connects their decisions into one system and identifies which assumptions have since changed.

## 1. Original product thesis and baseline assumptions

The original research did not start with “RAG for enterprise”. It started with a **company operating model that AI agents can safely work through**:

- A company has typed business objects, properties, identities, relationships, metrics, rules, permissions, evidence and named actions.
- Human applications, analysts and agents use the same governed model.
- Data from source systems is connected to that model; documents and extracted knowledge enrich it but do not silently become authoritative operational facts.
- Questions are answered through semantic/object queries and deterministic computation where possible. The model is used for language, interpretation and bounded reasoning—not as the source of truth for arithmetic, policy or state changes.
- Agents can propose and execute only the actions their identities and policies permit. Important actions have approvals, audit history and recovery semantics.

The assumptions embedded across original maps 30–35 were:

| Original assumption | Original research position |
|---|---|
| Initial buyer segment | Companies with roughly 100–1,000 staff |
| First workflow | Receivables and collections |
| Product | A company model / operational layer with agents, not a generic chatbot |
| Application stack | TypeScript, PostgreSQL with row-level security, one repository |
| Models | Rented through APIs; Claude and Qwen were the examples |
| System shape | One coherent codebase with explicit internal boundaries; not a requirement to copy Palantir's fleet of services |
| Data and state | Explicit source-of-truth, sync, object-edit, audit and action semantics |
| Product differentiator | Governed objects + rules + metrics + permissions + actions + agent procedures, rather than retrieval alone |

These are historical baseline assumptions, not a claim that receivables must remain the first commercial vertical forever. A later pivot to legal changes the **domain pack and market hypothesis**, not the need for an ontology/action platform. That pivot must be tested and recorded as a decision; it must not silently rewrite the provenance of the original research.

## 2. The actual architecture: six research maps, one system

### A. Data platform — source data becomes trustworthy operational state

**Primary source:** [Map 1 — Palantir platform](../sources/archive-original/30-map-palantir-platform.md), design decision 2; [Palantir data-layer research](../sources/archive-original/01-palantir-data-layer.md).

Responsibilities:

1. Source registry, connection setup, encrypted credentials, connector health and sync scheduling.
2. Raw landing and clean/normalized datasets, with source identifiers and lineage retained.
3. Snapshot and append sync first; CDC is a later capability when source volume and freshness justify it.
4. Dataset transactions, ordering/current-state rules, schema-drift policy, incremental rebuilds and deduplication.
5. Build/job dependency tracking, expectations, data health and operational alerts.
6. Explicit per-field/object ownership: source-owned, user-edited, computed, extracted or ephemeral.

The original map deliberately did **not** copy the entire Foundry lakehouse. Its baseline was a small Postgres-centred product for customers with a small number of SaaS/accounting sources. Iceberg, streaming/Flink, broad warehouse virtualization and an on-prem agent were not first-version requirements. Do not import those enterprise features without a customer need.

### B. Ontology definition and object runtime — the company model

**Primary sources:** Map 1, design decisions 3–4 and 6–8; [Map 2 — Lingyang/Alibaba](../sources/archive-original/31-map-lingyang-alibaba-offers.md), design decisions 1–2 and 10–13; [Map 4 — context/code/integration](../sources/archive-original/33-map-context-code-integration.md), design decisions 1–2 and 12.

The model needs distinct concepts for:

- Versioned object/entity type definitions, property definitions, stable keys and validation.
- Typed relationships/links, cardinality and relationship semantics.
- Interfaces/shared properties and value types where the domain needs them.
- Mappings from source datasets/fields into typed ontology properties.
- Runtime object instances and relationship instances, stored separately from schema definitions.
- Source-backed values versus user edits/overlays, with deterministic merge precedence and conflict visibility.
- Object identity resolution when multiple systems refer to the same real-world entity.
- Model-pack versioning, validation, publication, compatibility and rollback.

The original study deliberately treats ontology definitions (the “TBox”/model) separately from runtime facts/instances (the “ABox”). It also separates an operational object from an extracted knowledge-graph assertion. A graph database alone does not provide this product. The follow-up schema-language audit now makes the concrete object/link/interface distinction, relationship backing and schema-evolution constraints explicit; see [Phase 2 schema-language and relationship research](../03-ontology-engine/phase2-schema-language-and-relationships.md).

### C. Read/query and semantic computation — answer with typed meaning

**Primary sources:** Map 1, decision 6–7; Map 2, decisions 3–5 and 9–11; [Map 3 — research and cost](../sources/archive-original/32-map-research-and-cost.md), decisions 1–3 and 8–10; Map 4, decisions 11–12.

Required surfaces:

1. An object-set/query abstraction for filtering, traversing, selecting, aggregating and paging typed business objects.
2. A semantic query path for business metrics; metric definitions carry grain, dimensions, filters, time periods and valid joins.
3. A deterministic planner that validates schema paths, relationship direction/cardinality, join grain, time bounds, permissions, limits and backend capability.
4. An inspectable typed query plan and explain output; natural language may propose a plan, but the server validates it.
5. Functions/derived properties and rules with declared inputs, outputs, versions and execution boundaries.
6. Arithmetic, reconciliation and numeric reasoning executed by deterministic code/SQL, with a trace. Text-to-SQL is a guarded fallback, not the default semantic contract.
7. Document retrieval and graph traversal only when they improve a defined question; “multi-hop” does not mean every query must traverse a graph.

MetricFlow, UModel, OpenSPG/KAG and TypeDB are complementary evidence for planning and validation. They are not interchangeable products.

### D. Rules, actions and state mutation — agents do not write arbitrary rows

**Primary sources:** Map 1, decisions 8–11 and 19–20; Map 2, decisions 2, 6 and 12; Map 3, decisions 10–11; Map 4, decision 13; [Map 6 — market/competitors](../sources/archive-original/35-map-market-and-competitors.md), decisions 4–10 and 12–15.

The action plane requires:

- Named, typed action definitions with input schema, preconditions, validation, permissions, expected state transition and audit metadata.
- A risk class per action: allowed automatically, approval required, or prohibited. The model must not set or weaken its own authority.
- A preview/dry-run path with the intended object diff, applicable rules, effects and required approver.
- Server-side re-checks of authorization, current object version, policy and approval at execution time.
- A clear transaction boundary for canonical state, edit history, audit and outbox intent.
- Reliable external side effects via durable outbox/workflow, idempotency keys, retry policy and reconciliation. A webhook is not automatically part of a database transaction.
- Scenarios/simulations for “what if” evaluation without mutating production state.
- Versioned rules, named owners, proposal/review/approval, effective dates and rollback.

The action registry is shared by the UI and agent tools. A human button and an agent tool should invoke the same server-side operation and policy checks. Agents must not be granted direct database write access.

### E. Knowledge and context — evidence complements the operational model

**Primary sources:** Map 2, decisions 7–11; Map 3, decisions 4–9 and 15–17; Map 4, decisions 7–10.

This plane handles documents, messages, unstructured knowledge and memory:

- Preserve source document identity, version, location, access controls and precise source spans.
- Parse and chunk documents with structural context; retain links from chunks and extracted claims back to the exact source version.
- Represent extracted entities/facts/claims with confidence and review state. Distinguish candidate, corroborated, verified, rejected, contradicted and superseded facts.
- Keep temporal validity separate from when the system learned/recorded a fact.
- Maintain separate auto-learned and human-certified knowledge; define explicit merge precedence rather than letting the latest model output win.
- Use hybrid lexical/vector retrieval, reranking and graph traversal when appropriate, always applying the same tenant/resource permissions as the source.
- Keep user/session memory separate from canonical business facts and from the knowledge base.

This is where RAG, graph retrieval and context engineering belong. They are important platform capabilities, but they are not the ontology itself and do not replace typed query/action semantics.

### F. Agent, workflow and application lifecycle — a governed operator, not a prompt

**Primary sources:** Map 1, decisions 12–21; Map 2, decisions 12–17; Map 3, decisions 11–19; [Map 5 — agent companies](../sources/archive-original/34-map-agent-companies.md), decisions 2–17; Map 6, decisions 12–15.

The system needs:

- A model gateway with provider abstraction, budgets, rate limits, usage attribution, routing and retention controls.
- Separate human, service and agent identities. Agent permissions are the intersection of the initiating user, agent role, tenant/resource scope and action capability—not a blanket service credential.
- Typed tools for object lookup, semantic query, document retrieval, approved actions and workflow status. Read tools can be available by default; write tools require explicit enabling and policy.
- Procedure/SOP artifacts with versioned instructions, tool contracts, constraints, examples, risk level and evaluation requirements.
- Durable workflows for timers, long-running tasks, approval waits, customer replies, retries, cancellations and recovery.
- A human handoff path and a kill switch for autonomous work.
- Traces, action audit, model/tool costs, evaluations, golden cases, simulations, regressions, experiments, canaries and immutable release snapshots.
- MCP as an integration surface for discovery and tool/resource delivery—not as a replacement for the domain API or authorization layer.
- Human applications and developer tooling on top of the same object/query/action contracts.

## 3. Original build sequence

This is the order implied by the build-order sections in maps 30, 31, 33, 34 and 35. The system can remain a modular monolith while these boundaries are implemented.

| Build order | Capability | Minimum coherent result | Main research references |
|---:|---|---|---|
| 1 | Tenant, identity and security floor | Tenant isolation; stable user identity; groups/roles; object/resource policy context; deny on missing scope | Map 1 §§1,5,14,19; Map 4 §§3–4 |
| 2 | Source connections and data lifecycle | One or two useful sources; raw/clean sync; snapshot/append; current-state and schema-drift behaviour; operational health | Map 1 §2; Map 2 §5–6 |
| 3 | Versioned ontology and mappings | Typed definitions, keys, links, source mappings, model validation and separate runtime instances | Map 1 §§3–4; Map 2 §§1–2; Map 4 §§1–2 |
| 4 | Object/query and semantic layer | Object sets, typed filters/traversals, governed metrics, deterministic arithmetic, explain plans | Map 1 §§6–7; Map 2 §§3–5,9–11; Map 3 §§1–3 |
| 5 | Rules and governed actions | Deterministic rules, typed actions, preview/dry-run, approval gates, audit and canonical commit boundary | Map 1 §§8–10,19–20; Map 4 §§12–14; Map 6 §§4–10 |
| 6 | Knowledge/context | Source-backed documents, provenance, extraction review, hybrid retrieval, temporal facts and permission filters | Map 2 §§7–11; Map 3 §§4–9,15–16; Map 4 §§7–10 |
| 7 | Agent runtime and model access | Agent identity, least-privilege tools, model gateway/budgets, memory and MCP | Map 1 §§12–18; Map 2 §§12–17; Map 3 §§11–18 |
| 8 | Durable workflow and ADLC | Outbox, idempotency, long-running jobs, human handoff, simulations, evals and controlled releases | Map 3 §§14,19; Map 5 §§2–17; Map 6 §§12–15 |
| 9 | Application, integrations and commercial delivery | Operator console, SDK/API, connector/writeback coverage, deployment, onboarding, support and pricing | Maps 1–2 function checklists; Maps 5–6 market and delivery sections |

**Do not reverse this order.** Starting with a chat/RAG experience before identity, data ownership, the object model and safe actions produces a demo, not the operational platform described in the original research.

## 4. Original receivables domain model (the baseline, not a mandatory forever choice)

The original maps use receivables/collections to make the platform concrete. The core model includes Customer/Debtor, Contact, Invoice, Payment, PromiseToPay, Dispute, Case, CollectionPolicy, DunningStep/Touch, CollectorAssignment, bank transaction/remittance and an object-centric event history.

Its first valuable workflow is not “chat with invoices”. It is a governed daily collections operation:

1. Bring invoice, payment and customer state in from accounting/bank sources.
2. Resolve identity and calculate balances/ageing deterministically.
3. Build one current case per debtor/customer, with explicit pause/resume and stop conditions.
4. Record payment promises and disputes as first-class objects.
5. Apply versioned collection policies and decision tables.
6. Draft or send only the message classes allowed by risk/consent policy; require approval for judgment-heavy or high-impact responses.
7. Record delivery, replies, broken promises, payment matching and resulting state changes.
8. Measure a small number of outcome KPIs (for example overdue balance, promise kept/broken, cash collected and DSO movement) against a baseline.
9. Replay previous runs as regression cases and expose a central control page/kill switch.

Map 6 records both the case **for** receivables and the case **against** it, including free incumbent reminders and crowded competitors. It is a research-backed first-job hypothesis, not a conclusion that the market is automatically attractive.

## 5. Legal pivot: what changes and what must not change

The later product direction prioritised the lawyer/law-firm market. The pivot should be expressed as a domain pack on the same platform—not a new generic “legal RAG” architecture.

### Platform invariants to retain

- Firm/tenant isolation and explicit matter/resource scope.
- Versioned object types and relationships.
- Source-system ownership, ingestion checkpoints and provenance.
- Typed queries, deterministic metrics/rules where applicable.
- Permission checks over documents, extracted facts, chunks, embeddings, summaries, caches, agent tools and workflow state.
- Typed action registry, approvals, audit, outbox, durable workflow and agent release controls.

### Legal domain objects to validate

Potential initial vocabulary: Firm/Tenant, Principal, Team, Client, Party, Contact, Matter, MatterMembership, Document, DocumentVersion, EvidenceSpan, ExtractedAssertion, Clause, LegalIssue, Obligation, Deadline, Task, WorkProduct, Approval and Activity. Do not freeze this schema before a real workflow interview.

Legal has an additional authorization boundary beyond ordinary tenant membership: matter-level access and ethical walls. The system must be able to deny a matter even when a user belongs to the firm or a broad practice group.

Extracted assertions must remain evidence-linked and reviewable. An LLM extraction is a candidate, not an authoritative obligation or legal conclusion. Every accepted claim needs an exact source document version and span, reviewer/provenance and applicable effective dates.

The first legal workflow is still a hypothesis: evidence-linked matter Q&A or obligation/deadline extraction, followed by a reviewed action such as creating a task or drafting a deadline entry. The law-firm interview must decide which workflow is frequent, costly, risky and fundable.

### Strategy decision that remains open

| Question | Original baseline | Current direction | Decision gate |
|---|---|---|---|
| First vertical | Receivables and collections | Legal/law firms | Compare interview evidence, buyer access, willingness to pay and time-to-value |
| Domain model | Customer, Invoice, Payment, Promise, Dispute, Case | Matter, Party, Document, Evidence, Obligation, Deadline | Keep domain vocabularies in packs; share the platform kernel |
| Market assumption | 100–1,000 staff companies | Not yet validated for law firms | Define by firm size, matter volume, document volume, practice area and budget—not headcount alone |
| Initial workflow | Collections operations | Evidence Q&A or obligation/deadline workflow candidates | Select one observed workflow, not a feature catalogue |

Do not erase the receivables analysis when pivoting to legal. It remains a useful structured-data and action-safety benchmark, but it is no longer automatically the first commercial product.

## 6. Research phase sequence — separate from product build order

| Research phase | Intended output | Current status |
|---|---|---|
| Phase 1 — preserve and synthesize | Original source archive, six build maps, comparative company research, repository survey/audits, design hypotheses and diagrams | Phase 1 bundle contains 82 files; all 82 paths are present on main. Exact blob reconciliation is recorded in the Phase 1/2 report; two original map copies still need byte-level restoration. |
| Phase 2 — deepen correctness-critical evidence | Source-level inspection of transaction, tenant, query, authorization and workflow seams; convert findings into failure tests and research backlog | Partial deep dives completed; tests were not executed; many Phase 1 repositories remain unaudited. |
| Phase 3 — domain proof and runnable vertical slice | Workflow interviews; one domain/one workflow; schema and API contracts; working ingestion → ontology → query → policy → action → workflow slice | Not yet complete. |
| Phase 4 — prove product readiness | Security/failure tests, recovery, evaluation, operating cost, deployment, pilot metrics and commercial validation | Not started. |

These labels describe the **research programme**. They are not a promise that Phase 1 or Phase 2 has already delivered a production architecture.

## 7. Decision rules for the next architecture revision

1. Map every proposed module to a section in one or more of the six reference maps, or label it as a new proposal.
2. Keep documented competitor mechanisms, repository observations, inferences and our own decisions separate.
3. Record source-of-truth ownership for every important object/property.
4. Do not let graph/vector/search projections become authoritative by accident.
5. Do not let an agent write raw database rows or bypass named action contracts.
6. Treat authorization as a cross-plane invariant; test revocation and matter/tenant scope through every retrieval and execution path.
7. Treat external side effects as a recoverable workflow, not as a magical extension of a database transaction.
8. Do not choose Neo4j, TypeDB, Temporal, DBOS, OpenFGA, OPA/Cedar or a vector store from a feature list. Run the decision tests and record the trade-offs.
9. Preserve original maps 30–35 as source documents. Newer architecture synthesis may add findings but must not silently rewrite historical evidence.
10. Keep the legal pivot explicit and reversible until buyer/workflow evidence supports it.

## 8. Source map index

- [Map 1 — Palantir platform](../sources/archive-original/30-map-palantir-platform.md)
- [Map 2 — Lingyang and Alibaba](../sources/archive-original/31-map-lingyang-alibaba-offers.md)
- [Map 3 — research and cost](../sources/archive-original/32-map-research-and-cost.md)
- [Map 4 — context, code and integration](../sources/archive-original/33-map-context-code-integration.md)
- [Map 5 — agent companies](../sources/archive-original/34-map-agent-companies.md)
- [Map 6 — market and competitors](../sources/archive-original/35-map-market-and-competitors.md)
- [Original verification report](../sources/archive-original/36-verification-report.md)
