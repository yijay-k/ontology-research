# Build sequence

**Layer:** [00-overview](README.md) · **What it is:** The order in which layers must be built, and the separate order in which research is done.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Research literature](#research-literature) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (2)

## Research literature

### Recommendation: what a small product should build first

> Source: [general-references/09-papers-knowledge-layer.md § Recommendation: what a small product should build first](../../general-references/09-papers-knowledge-layer.md#recommendation-what-a-small-product-should-build-first)

**(a) Questions about numbers.** Build first: metric definitions in the company model, a deterministic metric-query compiler (metric × dimensions × filters × grain → SQL), a conventions card in context, and a typed refusal for out-of-scope questions (items 5 and 7). Second: guarded text-to-SQL for exploration with validation against the model, EXPLAIN dry-run and a bounded repair loop (item 6), plus certified example queries mined from query logs (item 8). All derived arithmetic runs in code (item 20). Evidence: SQL alone scored 16.7% against 54.2% over a KG and 72% with checks (Sequeda/Allemang); 98–100% for the semantic layer against 84–90% for text-to-SQL (dbt 2026); +17–23 points from a 4 KB semantics document (2604.25149); 9% against 48% with metadata at LinkedIn; 0% text-to-SQL on high-schema questions (2311.07509). Skip first: Cypher or SPARQL generation (TEXT2SPARQL best corporate score 0.447) and fine-tuned SQL models (third-party models only).

**(b) Answering from documents.** Build first: layout-aware parsing (Docling or MinerU) into structural chunks; contextual prefixes; hybrid BM25 plus dense retrieval with a reranker (150 down to 20); whole-scope long context when the scope is under about 200k tokens; Self-Route fallback; a sufficiency gate and claim-support check; citations to chunk and page (items 11–13). For field-bearing documents (invoices, POs, receipts), VLM extraction from images into the company model's typed schema with validators (item 19), so later questions about those documents become questions about numbers (path a). Evidence: retrieval failure 5.7% down to 1.9% (Contextual Retrieval); semantic chunking not worth its cost (2410.13070); Self-Route matches long context at 39–65% lower cost; native image 87.5% against 47.0% on receipts (2509.04469); CRAG gains of +7 to +37 points. Skip first: RAPTOR (below dense retrieval on average in HippoRAG 2's tests), Self-RAG training, ColBERT infrastructure.

**(c) Multi-hop questions across records.** Build first: the *record graph from structured data* (foreign keys and resolved entities as typed links), exposed to agents through typed traversal tools with depth and beam limits (item 14), with entity resolution (item 18) and mutual indexing to documents (item 15). This avoids the main weakness of LLM-built graphs, in which only about 65% of answer entities make it in (2502.11371). Second, only if customers ask multi-hop questions about *unstructured* text: a HippoRAG 2-style PPR index (item 16), the one graph method that beat strong dense retrieval on average (59.8 against 57.0 F1) without losing on simple questions, at about 1k tokens per query. Evidence against the alternatives: plain RAG beats GraphRAG on single-hop questions; LightRAG scored 6.6 average F1 and about 100k tokens per query in independent tests; GraphRAG global used about 331k tokens per query (GraphRAG-Bench). LazyGraphRAG is a later add-on for corpus-wide summary questions (item 17).

## Earlier engineering notes (Phase 2)

### 3. Original build sequence

> Source: former `01-reference-architecture/original-research-architecture.md` (moved here in the Nov 2026 restructure)

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

### 6. Research phase sequence — separate from product build order

> Source: former `01-reference-architecture/original-research-architecture.md` (moved here in the Nov 2026 restructure)

| Research phase | Intended output | Current status |
|---|---|---|
| Phase 1 — preserve and synthesize | Original source archive, six build maps, comparative company research, repository survey/audits, design hypotheses and diagrams | Phase 1 bundle contains 82 files; all 82 paths are present on main. Exact blob reconciliation is recorded in the Phase 1/2 report; two original map copies still need byte-level restoration. |
| Phase 2 — deepen correctness-critical evidence | Source-level inspection of transaction, tenant, query, authorization and workflow seams; convert findings into failure tests and research backlog | Partial deep dives completed; tests were not executed; many Phase 1 repositories remain unaudited. |
| Phase 3 — domain proof and runnable vertical slice | Workflow interviews; one domain/one workflow; schema and API contracts; working ingestion → ontology → query → policy → action → workflow slice | Not yet complete. |
| Phase 4 — prove product readiness | Security/failure tests, recovery, evaluation, operating cost, deployment, pilot metrics and commercial validation | Not started. |

These labels describe the **research programme**. They are not a promise that Phase 1 or Phase 2 has already delivered a production architecture.

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- Palantir: not applicable — this is a project-level or overview component.
- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Open-source implementations: not applicable — product, onboarding or domain content rather than code.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
