# Enterprise Ontology Research

**Research snapshot:** 27 November 2026  
**Repository status:** Phase 1 and Phase 2 research packs published to main.  
**Architecture status:** Original build blueprint restored as the controlling synthesis; product/domain decisions remain hypotheses until workflow and implementation validation.

This repository studies how to build a governed company operating model for software and AI agents. The product thesis is larger than RAG: connect company data to typed business objects and relationships; answer through semantic queries and deterministic computation; retrieve evidence with provenance; and execute permitted business actions through controlled workflows.

## Start here — read in this order

1. [Original research architecture and build blueprint](01-reference-architecture/original-research-architecture.md) — reconstructs the intended architecture from the six original reference maps, preserving the original receivables baseline and explicitly documenting the later legal pivot.
2. [Research charter](00-foundation/research-charter.md) — scope, original assumptions, current direction and research phases.
3. [Map 1 — Palantir platform](sources/archive-original/30-map-palantir-platform.md) — original Foundry/Ontology/AIP/security/apps build reference.
4. [Map 2 — Lingyang and Alibaba](sources/archive-original/31-map-lingyang-alibaba-offers.md) — original ontology, semantics, metrics and agent-product comparison.
5. [Maps 3–6](sources/archive-original/) — research/cost, context/code/integration, agent companies, and market/competitors.
6. [Company platform comparison](01-reference-architecture/company-platform-comparison.md) — current cross-vendor distinction and architecture boundaries.
7. [Repository audit index](15-repository-audits/README.md) — source-level audits and their limits.
8. [Phase 1/2 reconciliation](16-validation/phase1-phase2-reconciliation.md) — what was included in GitHub and remaining integrity exceptions.
9. [Phase 2 findings and next tests](16-validation/phase2-findings-and-next-tests.md) — correctness findings and prototype acceptance suite.
10. [Architecture hypotheses](17-decisions-and-tradeoffs/architecture-hypotheses.md) — provisional choices, not approved ADRs.

## What is included

- The complete 82-file Phase 1 bundle, extracted into the repository structure. All 82 Phase 1 paths are present on main.
- The 32 original research documents, including Palantir Foundry's data layer, Ontology, AIP, security, applications/infrastructure and business model; Lingyang/AgentOne and Alibaba; research papers; context products; agent companies; cost; integrations; finance/receivables; and six consolidated reference maps.
- Nine additional Phase 2 files: deeper OpenFoundry, UModel, OpenFGA and workflow audits; legal matter security threat model; law-firm interview guide; Phase 2 findings; Phase 2 source register; and publication handoff.
- Architecture synthesis, repository coverage ledger, evidence/research methods, decision hypotheses and Mermaid diagrams.

## Research status and limitations

Phase 1 is **published**, not an assertion that all research was freshly revalidated. Phase 2 is selective: source code and test sources were inspected in high-value areas, but no repository builds or tests were run. The original 60+ repository study is preserved; it has not all been independently re-audited. Company/market claims in the original notes retain their original evidence labels and dates. Read the coverage ledger and reconciliation before using claims to make a build or commercial decision.

The Phase 1 SHA reconciliation found all 82 paths on main. Seventy-five files match the supplied Phase 1 Git blob exactly; five working documents were subsequently revised; two original reference-map copies (maps 30 and 31) have same-size but different blob hashes and remain an archive-integrity repair item. Do not treat those two copies as byte-identical until restored and rechecked.

No local builds, tests, benchmarks, security tests or production runtime validation were executed in this research pass. OpenFoundry is AGPL-3.0-only; do not copy its code into a proprietary product without legal review. Verify all current upstream licences before reuse.

## Important architecture rule

Do not build the product as “RAG + a graph database + agents”. Follow the original sequence: tenant/security floor → source data lifecycle → versioned ontology/object runtime → object-set and semantic query → deterministic rules and governed actions → evidence/context → agent runtime → durable workflow and controlled release → application/integration surfaces. The detailed map and v1/v2 decisions remain in the six original reference maps.
