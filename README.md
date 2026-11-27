# Enterprise Ontology Research

**Research snapshot:** 27 November 2026  
**Status:** Phase 1 preserved; Phase 2 implementation-critical audits added.  
**Architecture status:** Working hypotheses only. No final technology decisions have been approved.

This repository investigates how to build an enterprise ontology and operational-intelligence platform: source integration, semantic modelling, query, knowledge retrieval, authorization, actions, durable workflows, agents, observability and governance. The goal is to reconstruct engineering mechanisms from public evidence—not repeat product marketing claims.

## Start here

1. [`00-foundation/research-charter.md`](00-foundation/research-charter.md) — scope and core questions.
2. [`research-method/README.md`](research-method/README.md) — evidence labels and research protocol.
3. [`01-reference-architecture/company-platform-comparison.md`](01-reference-architecture/company-platform-comparison.md) — company and platform comparisons.
4. [`15-repository-audits/README.md`](15-repository-audits/README.md) — code-level audit index.
5. [`16-validation/archive-reconciliation.md`](16-validation/archive-reconciliation.md) — preservation and corrections to the original archive.
6. [`16-validation/phase2-findings-and-next-tests.md`](16-validation/phase2-findings-and-next-tests.md) — new findings, design implications and test plan.
7. [`17-decisions-and-tradeoffs/architecture-hypotheses.md`](17-decisions-and-tradeoffs/architecture-hypotheses.md) — provisional architectural hypotheses, not ADRs.
8. [`13-domain-packs/legal/law-firm-interview-guide.md`](13-domain-packs/legal/law-firm-interview-guide.md) — discovery guide for the 29 November 2026 law-firm workflow interview.

## What is included

- The 32 Markdown documents from the supplied `research-all-markdown.zip`, preserved under `sources/archive-original/` without editorial changes.
- Phase 1 comparative research, engineering audits, methodology, evidence register, architecture hypotheses and Mermaid system diagrams.
- Phase 2 deeper source inspection of OpenFoundry's tenant/action paths, Alibaba UModel's storage/import/query/agent boundaries, OpenFGA's recursive checks and authorization cache consistency, and Temporal-vs-DBOS workflow semantics.
- A practical legal-domain interview guide and testable legal workflow hypotheses.

## Evidence labels and limitations

- **Documented:** stated in official documentation or repository docs.
- **Implemented:** a corresponding mechanism was located in source code.
- **Test source inspected:** tests cover a behaviour, but were not executed here.
- **Validated:** behaviour was run and observed in a reproducible environment. This label is not used for the remote source inspections in this research pack.
- **Inference:** conclusion drawn from multiple pieces of evidence.
- **Proposed:** recommendation for our platform, not a claim about a reference product.

No repository was cloned or built in this execution environment. GitHub source files and test sources were inspected remotely at pinned commits; tests, benchmarks, security tests and production runtime behaviour were **not** executed. A source-level audit cannot prove hosted product behaviour or the full production configuration. OpenFoundry is AGPL-3.0-only; do not copy its code into a proprietary product without a separate legal review. UModel is Apache-2.0 according to its repository README, but verify the current license before reuse.

## Publishing

This research pack is intended to live in [`yijay-k/ontology-research`](https://github.com/yijay-k/ontology-research). The GitHub connector can read the target repository, but write calls were rejected by GitHub with HTTP 403. The pack is prepared locally and is not yet published. See [`16-validation/publishing-status.md`](16-validation/publishing-status.md) for access-repair steps.

## Important rule

The architecture remains open. Do not freeze the graph database, workflow runtime, policy engine or primary system of record until the correctness tests and the smallest end-to-end prototype in the Phase 2/3 plan have been run.
