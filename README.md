# Enterprise Ontology Research

**Research snapshot:** 27 November 2026  
**Repository status:** Phase 1 and Phase 2 research packs published to main.  
**Architecture status:** Original build blueprint restored as the controlling synthesis; product/domain decisions remain hypotheses until workflow and implementation validation.

This repository studies how to build a governed company operating model for software and AI agents. The product thesis is larger than RAG: connect company data to typed business objects and relationships; answer through semantic queries and deterministic computation; retrieve evidence with provenance; and execute permitted business actions through controlled workflows.

## Start here — read in this order

1. [Original research architecture and build blueprint](01-reference-architecture/original-research-architecture.md) — architecture reconstructed from the six original reference maps.
2. [Research charter](00-foundation/research-charter.md) — original assumptions, current direction and research phases.
3. [Map 1 — Palantir platform](sources/archive-original/30-map-palantir-platform.md) and [Map 2 — Lingyang/Alibaba](sources/archive-original/31-map-lingyang-alibaba-offers.md).
4. [Maps 3–6](sources/archive-original/) — research/cost, context/code/integration, agent companies, and market/competitors.
5. [Company platform comparison](01-reference-architecture/company-platform-comparison.md) — product and platform boundaries.
6. [Repository audit index](15-repository-audits/README.md) — source-level implementation audits and limits.
7. [Phase 2 source register](research-method/phase2-source-register.md) — pinned source snapshots and official documentation.
8. [Phase 2 findings and next tests](16-validation/phase2-findings-and-next-tests.md) — findings and acceptance criteria.
9. [Phase 1/2 reconciliation](16-validation/phase1-phase2-reconciliation.md) — package manifest and known integrity exceptions.
10. [Architecture hypotheses](17-decisions-and-tradeoffs/architecture-hypotheses.md) — proposals, not approved ADRs.

## What is included

- The 82-path Phase 1 bundle and 32 original research Markdown documents, including the full Palantir Foundry/Ontology/AIP/security/apps/business research, Lingyang/AgentOne and Alibaba stack, literature, cost, competitors and six consolidated build maps.
- Phase 2 correctness research and source-level audits for OpenFoundry, UModel, OpenFGA and Temporal/DBOS.
- New Phase 2 deep dives on source sync/build semantics, ontology object/query contracts, ontology schema language/relationship semantics, Dataphin/Quick BI metric semantics, action isolation/invariants, agent sessions/evaluation and the Palantir TypeScript OSDK client contract. Start with [ontology schema language and relationships](03-ontology-engine/phase2-schema-language-and-relationships.md).
- Research protocol, coverage ledger, evidence register, architecture synthesis and Mermaid system diagrams.

## Research status and limitations

Phase 1 paths are present on main. The Phase 1/2 reconciliation documents the 75 exact blob matches, five revised working documents and two original map blob mismatches that still require restoration. The original 60+ repository study is preserved, but not every repository has been newly audited. Phase 2 source inspections and official docs are evidence, not proof of runtime behaviour. No local builds, upstream test suites, benchmarks, security tests or production workflow runs were executed in this pass.

## Important architecture rule

Do not build the product as “RAG + a graph database + agents”. Follow the original sequence: tenant/security floor → source data lifecycle → versioned ontology/object runtime → object-set and semantic query → deterministic rules and governed actions → evidence/context → agent runtime → durable workflow and controlled release → application/integration surfaces. The detailed design remains anchored in the six original maps.
