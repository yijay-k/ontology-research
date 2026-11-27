# Enterprise Ontology Research

**Research snapshot:** 27 November 2026  
**Repository status:** Phase 1 source archive and maps are present; Phase 2 source-level deep dives are partial. The research-quality audit records known claim corrections, current source updates and validation limits.

This repository studies how to build a governed company operating model for software and AI agents. The product thesis is larger than RAG: connect company data to typed business objects and relationships; answer through semantic queries and deterministic computation; retrieve evidence with provenance; and execute permitted business actions through controlled workflows.

## Start here

1. [Research quality and accuracy audit](16-validation/research-quality-audit-2026-11-27.md) — what is supported, what is inaccurate/stale, and what must be validated.
2. [Palantir Object Storage v2 current reference and legacy corrections](01-reference-architecture/palantir-osv2-current-state.md) — a concrete example of a source correction that changes the architecture reading.
3. [Original research architecture and build blueprint](01-reference-architecture/original-research-architecture.md) — architecture reconstructed from the six original reference maps.
4. [Research charter](00-foundation/research-charter.md) — original assumptions, current direction and research phases.
5. [Map 1 — Palantir platform](sources/archive-original/30-map-palantir-platform.md) and [Map 2 — Lingyang/Alibaba](sources/archive-original/31-map-lingyang-alibaba-offers.md).
6. [Maps 3–6](sources/archive-original/) — research/cost, context/code/integration, agent companies, market/competitors and verification report.
7. [Company platform comparison](01-reference-architecture/company-platform-comparison.md) — product and platform boundaries.
8. [Repository audit index](15-repository-audits/README.md) — source-level implementation audits and limits.
9. [Phase 2 source register](research-method/phase2-source-register.md) — pinned source snapshots and official documentation.
10. [Phase 2 findings and next tests](16-validation/phase2-findings-and-next-tests.md) — findings and acceptance criteria.
11. [Phase 1/2 reconciliation](16-validation/phase1-phase2-reconciliation.md) — package manifest and known integrity exceptions.
12. [Architecture hypotheses](17-decisions-and-tradeoffs/architecture-hypotheses.md) — proposals, not approved ADRs.

## What is included

- The 82-path Phase 1 bundle and 32 original research Markdown documents, including the full Palantir Foundry/Ontology/AIP/security/business research, Lingyang/AgentOne and Alibaba stack, literature, cost, competitors and six consolidated build maps.
- Phase 2 correctness research and source-level audits for OpenFoundry, UModel, OpenFGA and Temporal/DBOS.
- New Phase 2 deep dives on source sync/build semantics, ontology object/query contracts, ontology schema language/relationship semantics, Dataphin/Quick BI metric semantics, action isolation/invariants, agent sessions/evaluation and the Palantir TypeScript OSDK client contract.
- Research protocol, coverage ledger, evidence register, architecture synthesis and Mermaid system diagrams.

## Research status and limitations

The Phase 1/2 reconciliation documents the 75 exact blob matches, five revised working documents and two original map blob mismatches that still require restoration. The original maps 30–35 remain the controlling historical build references; newer architecture documents may add findings but must not silently rewrite their evidence.

Phase 2 source inspections and official docs are evidence, not proof of runtime behaviour. No local builds, upstream test suites, benchmarks, security tests or production workflow runs were executed in this pass. Read the [research-quality audit](16-validation/research-quality-audit-2026-11-27.md) before using a claim as an implementation requirement.

## Important architecture rule

Do not build the product as “RAG + a graph database + agents”. Follow the original sequence: tenant/security floor → source data lifecycle → versioned ontology/object runtime → object-set and semantic query → deterministic rules and governed actions → evidence/context → agent runtime → durable workflow and controlled release → application/integration surfaces. The detailed design remains anchored in the six original maps.
