# Research method

How research in this repository is done and graded: evidence chain, confidence labels, protocols and the source registers.

## Overview

This folder defines the method used for every company profile, repository audit, architecture claim and design recommendation. Documentation is treated as a navigation map and a statement of intended capability—not proof that the capability works.

### Evidence chain

For each high-value feature, the audit should trace:

`product claim → official docs → architecture docs → repo entrypoint → owning module → data model/schema → execution path → storage/event side effects → permission boundary → tests → runtime verification`

If a link in that chain is unavailable, the gap is named. A README claim with no implementation evidence remains **Documented**, not **Implemented**. A test file is evidence that the project intends to test a behaviour; it is not proof that the test passes. A passing unit test would still not prove production security or resilience.

### Research units

- **Company/product:** product boundaries, architecture, customer workflow, commercial model, deployment, public customer evidence and limitations.
- **Repository:** identity and lineage, modules, entrypoints, runtime boundaries, schemas, persistence, dataflow, APIs/events, security, tests, packaging and licensing.
- **Architecture capability:** problem definition, candidate implementations, common pattern, divergent approaches, failure modes and design implications.
- **Domain pack:** business objects, source systems, rules, workflows, actors, controls and competency questions.

### Standard workflow

1. Preserve the supplied source pack and inventory it.
2. Build the list of claims and questions from previous research.
3. Locate canonical upstream repositories and distinguish forks, ports, emulators and derived projects.
4. Check licence, release/commit activity, supported language/runtime and deployment instructions.
5. Read project docs and architecture docs to map the design.
6. Inspect actual code: startup and dependency wiring, core service handlers, domain types, repository/storage adapters, transaction boundaries, indexers, query planners, policy enforcement and error/retry paths.
7. Inspect tests and CI for claimed guarantees; do not infer a passing result without execution.
8. Compare the implementation to the feature claim and to relevant independent projects.
9. Reconcile contradictions against the original ZIP and prior research.
10. Write a recommendation with evidence, limitations, alternatives and a confidence label.

### Research status for this phase

The audits in `15-repository-audits/` contain remote source inspection. The `validation_status` field in each audit indicates whether build/test/runtime verification occurred. In this phase, test sources were inspected selectively, but no repository tests were run.

## Evidence and confidence model

| Label | Definition | Required basis |
|---|---|---|
| Documented | Project/company says a capability exists | Official docs or repository docs; link and retrieval date |
| Implemented | Mechanism exists in source code | Exact source path and explanation of the executed path |
| Test source inspected | A test is present for the mechanism | Exact test path and what it asserts; execution status stated |
| Validated | Behaviour was observed in an executable environment | Commit, environment, command, test or experiment, result and logs |
| Vendor claim | A company makes a product/customer/performance claim | Official marketing or case study; do not present as independent proof |
| Independent evidence | Third-party source supports the point | Publisher, date, methodology/limitations and link |
| Inference | Reasoned conclusion not explicitly asserted by a source | Supporting evidence and alternative explanations |
| Proposed | Recommendation for our platform | Problem, rationale, alternatives, risks and decision owner |

Confidence is assigned separately: **High** (multiple direct sources or direct implementation evidence), **Medium** (one direct source or indirect implementation path), **Low** (partial evidence, unclear version, or material unverified assumption). Confidence does not upgrade a documented feature into a validated feature.

Do not call a feature production-ready based only on a README, a demo, a passing unit test or a project architecture diagram. Do not call a product scalable without workload and operational evidence. Do not infer security from a policy schema without tracing enforcement to each read/write path.

## Cross-source verification

### Conflict resolution order

1. Current executable code at a pinned commit, for implementation claims.
2. Current official technical docs, for intended/public contract and platform guarantees.
3. Tests and CI definitions, for intended verification coverage (execution result is a separate fact).
4. Official product/marketing pages, for packaging and vendor positioning.
5. Customer case studies and independent reporting, for adoption and outcomes, with methodology caveats.
6. Earlier research notes and secondary summaries, as leads and historical evidence.

This ordering is not universal: code may be incomplete or a private hosted service may differ from the public repo. In such cases, explicitly explain the boundary instead of silently selecting the most convenient source.

### Version drift

Every correction must record the earlier statement, its origin document, the current source snapshot, the changed implementation, the effect on the conclusion and whether it changes a proposed design. Never edit the original research archive to erase an earlier error; add a correction record.

### Repository lineage

Before comparing two repositories, establish whether one is a fork/port of another. Shared code is not independent confirmation. For forks, compare divergent commits/modules and attribute inherited behaviour correctly.

## Company and product research protocol

For each company, separate (1) official product descriptions, (2) official technical/engineering documentation, (3) public customer case studies, (4) independent reporting/research, and (5) our own inference.

Investigate:

- Product modules and target buyer/user; core workflow and deployment model.
- Data sources, connectors, ingestion cadence, normalization, source-of-truth and writeback.
- Business entity model, relationships, rules, metrics, provenance and time semantics.
- Query/search/analytics and how a user or agent obtains context.
- Actions, external side effects, approvals, rollback, idempotency and human handoff.
- Agent design, tool execution, model choices, state, memory, guardrails and evaluation.
- Identity, tenancy, access-control propagation, audit, retention and deployment controls.
- Product packaging, pricing model and go-to-market evidence where sourceable.
- Gaps, preview/beta status, documented limitations and aspects that cannot be inferred from public material.

Vendor claims are explicitly labelled. A customer logo or testimonial is not an independent benchmark. Revenue, valuation, customer count and other market data require date-specific sources and must not be mixed with architecture facts.

## Repository audit protocol

### 1. Identity and provenance

Record canonical repository URL, owner, branch, current commit SHA where obtained, release tag/date, licence, language, package manager, support policy, archived/fork status and lineage. A similarly named repository is not assumed to be the same project. Record whether the target is an upstream, port, fork, emulator, tutorial or example implementation.

### 2. Repository map

Inventory runtime services, libraries, packages, apps, generated code, migrations, schemas, test suites, deployment manifests and CI. Do not read generated/vendor/build output line-by-line. Inspect the generator or code that produces it and sample generated contracts when needed.

### 3. Runtime trace

A README or architecture document is only a claim inventory and navigation aid. It is never sufficient evidence that a feature is implemented. For each material capability, trace:

`product claim → official docs → repository entrypoint/route/consumer → owning module → domain model/IR → validation → authorization → persistence/transaction → event/outbox/projection → tests`.

If the documented feature cannot be located in active code, record it as documented-only, planned, incomplete or not found. If the feature is only present in a disconnected module, check startup/DI/route/event registration before calling it active. If a code path is only seen in one handler, do not generalize it to every route.

### 4. Runtime trace

For each capability, trace the real path from public API or event consumer to domain operation and persistence. Identify the caller, validation, authorization, transaction, side effects, event emission, retry and response. Follow dependency injection and startup wiring; a feature module that is never registered is not an active runtime feature.

### 5. Data and persistence

Record identifiers, tenant or workspace keys, ownership, versions, history, unique constraints, indexes, migrations, storage adapters, cache invalidation and materialized/search/vector projections. Distinguish authoritative state from derived indexes and caches.

### 6. Security

Trace identity at ingress through service context, repository scope, storage constraints, search/vector filters, caches, agent tools and external calls. Inspect fail-open defaults and missing-context behaviour. A `tenant_id` column or workspace field is not, by itself, proof of isolation.

### 7. Reliability

Inspect transaction boundaries across databases and services, outbox/inbox pattern, event IDs, idempotency keys, retries, DLQ behaviour, replay, reconciliation, partial success, cancellation and compensation. Identify effects that occur outside the transaction guarantee.

### 8. Tests and validation

List relevant unit/integration/e2e tests, fixtures, CI jobs and local build commands. Distinguish test source inspection from actual test execution. Record exact commands and outcomes only when run. Record environmental blockers without converting them into assumptions.

### 9. Output format

Each audit should include: scope; exact commit/branch snapshot; claim-to-code matrix; architecture map; core execution traces; data/schema path; API/events; security path; test coverage; licence; strengths; limitations; risks; adoption classification (reuse/adapt/learn/avoid); open questions; confidence and coverage ledger.

## Coverage ledger

**Last reconciled:** 27 November 2026  
**Mode:** archive reconciliation, official documentation review and remote source-code inspection.  
**Execution status:** no local builds, test suites, benchmarks or production runtime tests were run.

### Repository pack coverage

| Item | Expected | Verified on main | Status |
|---|---:|---:|---|
| Phase 1 bundle paths | 82 | 82 | All present |
| Phase 1 exact Git blob matches | 82 | 75 exact | 5 working-document revisions; 2 original map hash mismatches remain |
| Additional Phase 2 paths at last reconciliation | 9 | 9 | All present |
| Original source Markdown documents | 32 | 32 paths | Maps 30 and 31 still have blob mismatches |
| Repository tests executed | — | 0 | Not executed |

See [Phase 1/2 repository reconciliation](corrections.md). Phase 2 deep-dive documents added in this commit extend the current repository beyond the nine-file Phase 2 baseline.

### Source-level research coverage

| Research target | Evidence inspected | Tests inspected | Tests run | Status |
|---|---|---|---|---|
| Original research archive | 32 original notes, six maps and verification report inventoried | N/A | No | Two map hashes need restoration; archive not fully re-audited line-by-line |
| CapTrix/OpenFoundry | Definition handlers, batch-save, schema outbox, object DB, action/writeback, indexer, Cedar and Phase 2 tenant/action paths | Selected action/writeback test sources | No | Partial deep audit; route/wiring and failure-recovery gaps |
| Alibaba UnifiedModel | Query, AgentGateway, EntityStore, schema validation, GraphStore, imports and provider capability planner | Selected AgentGateway/entity-store/import tests | No | Partial deep audit; run all provider contracts |
| OpenFGA | Type validation, recursive evaluator, cycle handling and cache consistency | Selected recursion/cycle test sources | No | Partial deep audit |
| Temporal / DBOS | Workflow history/replay and DBOS persistence/recovery; Phase 2 comparison | Selected DBOS recovery test source | No | Partial deep audit; run comparative bake-off |
| Palantir official docs | Data transaction/build/branching; Ontology backend/OSS limits; action isolation/write skew/retry; Agent Stack and AIP Evals | Not applicable | No | Product-contract evidence, not private implementation |
| Palantir OSDK TS | ObjectSet API, fetchPage implementation, createObjectSet iterator and action examples at pinned commit `5c6d916f` | No tests run | No | Client-contract source audit only |
| Dataphin / Quick BI | Statistical metric grammar, metric logical structure, quality rules, Q-Data dataset selection | Not applicable | No | Official product documentation only |
| Graphiti / LightRAG / DataHub / MetricFlow / OpenSPG-KAG / dlt / Airbyte / OPA / TypeDB / Palantir OSDK earlier report | Code/docs as detailed in individual audit reports | Selective | No | Partial; do not infer full correctness |

### What the new Phase 2 evidence adds

- Source sync and build semantics distinguish source cursor, staged import, current-state projection, job output grouping and DAG-level partial completion.
- Ontology research now includes paging consistency, object-set execution tiers, projections and a pinned public OSDK client-source inspection.
- Metric research now compares Dataphin's atomic/derived metric grammar and Quick BI's question-to-dataset routing configuration.
- Action research now explicitly records snapshot write skew, retry classification and the transaction/effect boundary.
- Agent research now covers durable typed sessions, event/state transitions and repeated regression evaluation.

### Remaining research coverage gaps

1. Phase 1 maps 30 and 31 need exact blob restoration from original Phase 1 archive.
2. Not every one of the original 60+ code repositories has been re-audited.
3. Phase 2 source inspections do not include builds, test execution, benchmarks or deployment verification.
4. Palantir official docs are not private implementation; UModel/OpenFoundry are independent projects.
5. Market/product documents 18–28 need targeted current verification for the legal direction.

### Priority follow-up

- Restore maps 30/31 and verify the complete archive manifest.
- Finish OpenFoundry route/wiring/read authorization and action failure paths.
- Run UModel provider/model-pack contract tests and tenant isolation tests.
- Execute snapshot pagination, action write-skew, outbox recovery, workflow replay and ACL revocation tests in our own prototype.
- Select a first domain workflow only after interviews and measurable buyer pain are evidenced.

### Additional ontology schema research

Palantir official docs were inspected for object identity, link backing strategies, cardinality, object-backed relationships and interfaces. Evidence is documented in `03-ontology-engine/phase2-schema-language-and-relationships.md`. This is official product-contract evidence, not private server code inspection. No schema migration or cardinality enforcement tests were executed.

## Phase 2 source register

**Last checked:** 27 November 2026. Source commits and documentation retrieval identify what was inspected, not what was executed or runtime-validated.

### Pinned repository source inspections

| Project | Commit inspected | Primary source |
|---|---|---|
| CapTrix/openfoundry | `090e3f19b6b90fb77c23d779a318957c937067b2` | https://github.com/CapTrix/openfoundry/tree/090e3f19b6b90fb77c23d779a318957c937067b2 |
| alibaba/UnifiedModel | `5cd06e951195bebfc29e8d256eb0471b135df4b4` | https://github.com/alibaba/UnifiedModel/tree/5cd06e951195bebfc29e8d256eb0471b135df4b4 |
| openfga/openfga | `d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251` | https://github.com/openfga/openfga/tree/d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251 |
| dbos-inc/dbos-transact-ts | `adde4eb4037d64cd3072d5c6b875cf0bd2927d75` | https://github.com/dbos-inc/dbos-transact-ts/tree/adde4eb4037d64cd3072d5c6b875cf0bd2927d75 |
| temporalio/sdk-typescript | `8447c6928c773072a94d5f206a34465e3d9ea7df` | https://github.com/temporalio/sdk-typescript/tree/8447c6928c773072a94d5f206a34465e3d9ea7df |
| palantir/osdk-ts | `5c6d916f5ab1874ea081402eddeb130960d4c9b4` | https://github.com/palantir/osdk-ts/tree/5c6d916f5ab1874ea081402eddeb130960d4c9b4 |

### Palantir official product/architecture documentation checked

- Ontology system and fourfold data/logic/action/security model: https://www.palantir.com/docs/foundry/architecture-center/ontology-system
- Ontology backend components (OMS, object database, OSS, Actions, Funnel, Functions): https://www.palantir.com/docs/foundry/object-backend/overview
- Object edits and materialization path: https://www.palantir.com/docs/foundry/object-edits/how-edits-applied
- Action consistency, isolation, write skew and retries: https://www.palantir.com/docs/foundry/action-types/consistency-guarantees
- Build DAG, jobs, output grouping, failed-build semantics and staleness: https://www.palantir.com/docs/foundry/data-integration/builds
- Dataset transaction modes: https://www.palantir.com/docs/foundry/data-integration/datasets
- Data branching and build branch resolution: https://www.palantir.com/docs/foundry/data-integration/branching
- OSS execution tiers, pagination and query limitations: https://www.palantir.com/docs/foundry/ontologies/oss-limitations
- API v2 paging and snapshot semantics: https://www.palantir.com/docs/foundry/api/v2/general/overview/paging
- API v3 paging semantics: https://www.palantir.com/docs/foundry/api/v3/general/overview/paging
- AIP Agent Stack sessions, typed context and event/state transitions: https://www.palantir.com/docs/foundry/aip/agent-stack
- Agent Manager session permissions and debugging: https://www.palantir.com/docs/foundry/agent-manager/overview
- AIP Evals suites, runs and test cases: https://www.palantir.com/docs/foundry/aip-evals/overview ; https://www.palantir.com/docs/foundry/aip-evals/run-suite ; https://www.palantir.com/docs/foundry/aip-evals/experiments
- AIP Evals multiple-run recommendation: the run-suite guide recommends at least three test repetitions for LLM-backed functions.

### Alibaba official documentation checked

- Dataphin statistical metric definitions: https://help.aliyun.com/en/dataphin/fullmanaged/getting-started/the-statistical-index
- Dataphin logical business/metric model: https://help.aliyun.com/en/dataphin/fullmanaged/product-overview/logical-structure-that
- Dataphin quality rules, weak/strong enforcement and trial runs: https://help.aliyun.com/en/dataphin/fullmanaged/user-guide/create-a-data-table-quality-rules
- Dataphin modelling and lineage submission checks: https://help.aliyun.com/en/dataphin/semimanaged-v4/user-guide/specification-modeling-task-submission-instructions
- Quick BI Question-based Knowledge Management and dataset selection: https://help.aliyun.com/en/quick-bi/user-guide/knowledge-base-configuration

### Research limits

- Palantir and Alibaba official docs are product-contract evidence, not private server implementation disclosure.
- The OSDK source audit is a client-side API/SDK inspection, not an audit of Palantir's backend.
- No upstream repositories were built; no test suites, benchmarks or Foundry/Dataphin runtime workflows were executed.
- Documentation may describe product features with plan/region/preview dependencies. Re-check availability and lifecycle before implementing against a specific customer environment.

### Additional Palantir schema-language documentation checked

- Object type primary key/title key and stable object identity: https://www.palantir.com/docs/foundry/object-link-types/create-object-type
- Link type backing patterns and declared cardinality: https://www.palantir.com/docs/foundry/object-link-types/create-link-type
- Link type semantic definition and instances: https://www.palantir.com/docs/foundry/object-link-types/link-types-overview
- Object-backed relationship modelling guidance: https://www.palantir.com/docs/foundry/ontology/ontology-structural-guidance
- Interface properties and abstraction: https://www.palantir.com/docs/foundry/interfaces/interface-overview
- Interface implementation and property/link/action contract mapping: https://www.palantir.com/docs/foundry/interfaces/implement-interface
- Interface link constraints: https://www.palantir.com/docs/foundry/interfaces/interface-link-types-overview

### Additional Alibaba documentation checked

- Dataphin dimensional modeling follows Kimball-style business entity/dimension and business activity/fact modelling: https://help.aliyun.com/en/dataphin/semimanaged-v4/user-guide/data-modeling-research-and-development
