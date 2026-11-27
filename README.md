# Enterprise Ontology Research

Research for building a governed company operating model for software and AI agents. The idea is more than RAG: connect company data to typed business objects and relationships, answer through semantic queries and deterministic computation, retrieve evidence with provenance, and execute permitted business actions through controlled workflows.

## Four sections

| Section | What it holds | Start with |
|---|---|---|
| [**engineering/**](engineering/README.md) | What we build. 14 layer folders, 72 component files. Each component copies the relevant material from every reference below, side by side, with links back. | [engineering/README.md](engineering/README.md) — layer diagram, build order, component index |
| [**open-source-references/**](open-source-references/README.md) | One file per repository (36 projects plus cross-repo patterns). Each opens with: repository link, why it matters, what to take, what not to copy, which components it feeds, evidence level. | [open-source-references/README.md](open-source-references/README.md) |
| [**general-references/**](general-references/README.md) | Company, product, market and research-literature documents (Palantir, Lingyang/AgentOne, Alibaba, Sierra, Decagon, Glean, Ramp, papers, cost) plus the six reference maps. Kept whole. | [general-references/README.md](general-references/README.md) |
| [**research-log/**](research-log/) | How the research was done and how good it is: corrections register, quality audit, verification report, backlog and next tests, method. | [research-log/corrections.md](research-log/corrections.md) |

## How to use it

- **To build a component:** open its file under `engineering/`. Read the "Design decisions already in the reference maps" section first, then the source sections for detail, then "Fact-check notes" and "Gaps".
- **To understand a repository or company:** open its file under `open-source-references/` or `general-references/`. The "Feeds" / "Used by" column says which components use it.
- **Before trusting a number or vendor claim:** check [research-log/corrections.md](research-log/corrections.md). Palantir's object storage changed (OSv1 → OSv2); read [general-references/02a](general-references/02a-palantir-osv2-current-state.md) before relying on older storage or ingestion-order statements.

## Status (28 Nov 2026)

- Phase 1 research (32 documents) and Phase 2 source inspections are complete as research. None of the architecture has been validated by running code: no upstream tests, builds, benchmarks or production runs were executed.
- **Fact-checked on 28 Nov 2026:** the ontology engine and action types against vendor docs, then 27 open-source repositories read at pinned commits (licences, versions, the exact schemas and algorithms to copy) plus vendor spot-checks across data, query/metrics, security, knowledge, agents, workflows and apps. Corrections FC-01…FC-13 are in [research-log/corrections.md](research-log/corrections.md). Each component now has **Implementation starting points (from source code)** where a repository supplies one, and [engineering/00-overview/bill-of-materials.md](engineering/00-overview/bill-of-materials.md) lists every building block with its verified status.
- Open work is listed in [research-log/backlog-and-next-tests.md](research-log/backlog-and-next-tests.md).

## Architecture rule

Do not build the product as "RAG + a graph database + agents". Follow the original sequence: tenant/security floor → source data lifecycle → versioned ontology/object runtime → object-set and semantic query → deterministic rules and governed actions → evidence/context → agent runtime → durable workflow and controlled release → application/integration surfaces. Keep the legal-market pivot separate from the original receivables/collections baseline.
