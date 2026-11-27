# Enterprise Ontology Research

**Research snapshot:** 27 November 2026  
**Repository status:** Phase 1 source archive and maps are present; Phase 2 source-level deep dives are partial. A claim-level correction register and current Palantir OSv2 erratum are published.

This repository studies how to build a governed company operating model for software and AI agents. The product thesis is larger than RAG: connect company data to typed business objects and relationships; answer through semantic queries and deterministic computation; retrieve evidence with provenance; and execute permitted business actions through controlled workflows.

## Start here

1. [Research quality and accuracy audit](16-validation/research-quality-audit-2026-11-27.md) — supported, inaccurate/stale and unvalidated areas.
2. [Source correction register](16-validation/source-correction-register.md) — 16 known claim corrections and what evidence closes them.
3. [Palantir Object Storage v2 reference](01-reference-architecture/palantir-osv2-current-state.md) — a current-vendor correction that changes the reading of legacy research.
4. [Original research architecture and build blueprint](01-reference-architecture/original-research-architecture.md) — controlling synthesis of the six original maps.
5. [Research charter](00-foundation/research-charter.md) — original assumptions and the current product hypothesis.
6. [Map 1 — Palantir platform](sources/archive-original/30-map-palantir-platform.md) and [Map 2 — Lingyang/Alibaba](sources/archive-original/31-map-lingyang-alibaba-offers.md).
7. [Maps 3–6 and original verification report](sources/archive-original/).
8. [Repository audit index](15-repository-audits/README.md).
9. [Phase 2 source register](research-method/phase2-source-register.md).
10. [Phase 2 findings and next tests](16-validation/phase2-findings-and-next-tests.md).
11. [Phase 1/2 reconciliation](16-validation/phase1-phase2-reconciliation.md).
12. [File manifest](16-validation/file-manifest.md) — recursive tree inventory and post-Phase-1 additions.

## What is included

- The Phase 1 package (82 files) and 32 original research Markdown documents, including six consolidated build maps.
- Selected Phase 2 source-level audits and deep dives across data sync, ontology schema/query, metrics, actions, security, workflows and agents.
- Dated source corrections, evidence registers, research methods and Mermaid system diagrams.

## Research status and limitations

The original archive is substantial but not uniformly verified. The 21 November verification report checked a sample of 27 claims (20 fully supported, six partly supported and none contradicted in that sample); it did not verify every claim in all 32 documents. Several prior-knowledge/secondary-source sections remain open.

The current tree contains **103 file blobs**; all 82 Phase 1 paths are present and 21 additional paths have been added. The blob comparison still has two unresolved historical source mismatches in original maps 30 and 31. The reconciliation document contains the current path inventory and hashes.

Phase 2 source inspections are not runtime proof. No upstream test suites, local product builds, benchmarks, security tests or production workflow runs were executed in this research pass. Do not treat a file's existence as evidence that its architecture has been validated.

## Important architecture rule

Do not build the product as “RAG + a graph database + agents”. Follow the original sequence: tenant/security floor → source data lifecycle → versioned ontology/object runtime → object-set and semantic query → deterministic rules and governed actions → evidence/context → agent runtime → durable workflow and controlled release → application/integration surfaces. Keep the legal-market pivot separate from the original receivables/collections baseline.
