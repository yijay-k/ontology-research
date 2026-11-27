# Research quality and accuracy audit

**Checked:** 27 November 2026  
**Scope:** supplied original research archive, current `yijay-k/ontology-research` tree, Phase 1/2 reconciliation, selected current official vendor docs.

## 1. Executive assessment

The research archive is substantial, but it is not uniformly verified and should not yet be treated as a complete, implementation-ready engineering specification.

The supplied `research-all-markdown.zip` contains 32 Markdown research documents, approximately 17,567 lines and 2.54 million characters. It includes six detailed architecture/reference maps (30–35), separate Palantir and Alibaba/Lingyang research, research literature, agent-company studies, market/competitor research, an open-source code study and a verification report.

**Conclusion:** volume is not the main gap. The main gaps are claim freshness, source quality, unresolved contradictions, uneven coverage, and the difference between source inspection and executable validation.

## 2. What has been verified about the archive

The supplied source archive and the Phase 1 package each contain the same original map 30 and map 31 byte-for-byte. The Phase 1 package contains 82 entries: 75 Markdown files, six Mermaid diagrams and one QA report.

The separate verification report (dated 21 November 2026) describes a limited independent check:
- it reviewed key findings, “what to copy” and open questions, plus number-heavy sections of selected documents;
- it fetched 27 source pages and checked selected code claims by reading code only;
- 20 fetched claims were fully supported, six were partly supported, none were outright contradicted in that sample, and one further claim was confirmed on a second fetch;
- it redid the arithmetic in the cost model and selected business averages.

These results are encouraging, but they do **not** establish that every claim in all 32 documents is correct. The report explicitly says some documents received no fetch check, the paper results were not all re-read against the papers, and some code was not present in the inspected clone.

## 3. Known accuracy debt already recorded in the original verification report

The following are not new guesses; they are issues explicitly raised by the independent verification report and must remain visible until reconciled in the synthesis:

| Area | Known issue | Required treatment |
|---|---|---|
| Palantir AIP | “Small” enrollment tier and the claim that every Ontology change requires a human-approved proposal were not supported by the checked pages | Do not repeat without new primary evidence |
| Ramp / finance | A mandatory rejection reason code was overstated; the source made the reason optional | Keep vendor behaviour separate from our own desired policy |
| AgentOne pricing | Credit-to-yuan rate differs by product; Data Analysis Agent and ad-creative agent rates are not interchangeable | Model product-specific price units and re-check live pricing |
| Harvey models | Kimi K3 attribution relied on a secondary summary; Harvey's own post named other models | Label secondary evidence or omit the claim |
| Sierra / Decagon | ARR/revenue dates and source labels differ between documents | Reconcile exact publication date, event date and source class |
| Airbyte | The code-study and integration study disagreed on Elastic License 2.0 interpretation; connector directories/licences were not fully checked in the inspected clone | Obtain legal review and inspect the actual connector code before adoption |
| Big-platform agent catalogue | Parts of Microsoft, Google, Amazon, ServiceNow and Workday sections were written from prior knowledge rather than re-read sources | Re-research before using in a build or market decision |
| “More companies” catalogue | Some figures are headline-only or unsourced | Treat as leads, not evidence |
| Source labels | Some secondary sources and search-result titles were labelled too strongly as facts | Downgrade to secondary/vendor claim unless primary evidence is obtained |

See `sources/archive-original/36-verification-report.md` for the complete list of sampled claims, disagreements, arithmetic checks and 15 proposed corrections. The original files are preserved; apply corrections in the synthesis layer.

## 4. Current source re-check: material Palantir update

The current official Foundry documentation distinguishes the legacy Object Storage v1 (Phonograph) backend from Object Storage v2 (OSv2). The OSv1 overview states planned unavailability after 30 June 2026. OSv2 separates indexing and querying, uses the Object Data Funnel for indexing, defaults to incremental indexing, and has explicit breaking changes in edit and changelog semantics.

A material conflict was found with original map 30:

- Map 30 says Palantir ignores the ordering column and indexes in arrival order, then recommends that our product honour the ordering column at index time.
- The current OSv2 breaking-changes documentation says OSv2 does not use the legacy “latest timestamp wins” changelog semantic; Funnel performs the relevant changelog calculations and the old changelog decorator is obsolete.

This does **not** remove the need for our own source ordering and replay contract. It means the old Palantir behaviour must be scoped to the legacy path and must not be copied as a current OSv2 design rule.

A separate detailed erratum is in `01-reference-architecture/palantir-osv2-current-state.md`.

## 5. Current reference-source checks

| Reference | Current evidence checked | Confidence / limitation |
|---|---|---|
| Palantir Ontology backend | Official overview and OSv1→OSv2 breaking-changes docs | Strong for published product contracts; not private backend internals |
| Palantir object/link schema | Current object-type primary-key and link-cardinality docs | Confirms identity and non-enforced one-to-one cardinality caveat |
| Palantir AIP | Current 12-category AIP architecture page and Evals docs | Strong for described feature categories; vendor claims are not independent outcome evidence |
| Microsoft Fabric IQ | Current overview, FAQ and graph docs | Ontology and graph remain labelled preview in checked docs; graph materialization is optional and constrained |
| Alibaba Dataphin | Current statistical metric documentation and selected permissions pages | Partial; metric versioning and full row-level permission semantics remain open |
| Sierra | Current Agent Studio product page | Supports journeys, instructions, traces, integrations and simulation/regression features; product page is not implementation evidence |
| Decagon | Original archive and verification report | The current primary-source product/engineering contract still needs a fresh re-check before using detailed AOP claims |

External sources:
- https://www.palantir.com/docs/foundry/object-backend/overview/index.html
- https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes
- https://www.palantir.com/docs/foundry/object-link-types/create-object-type
- https://www.palantir.com/docs/foundry/object-link-types/create-link-type
- https://www.palantir.com/docs/foundry/architecture-center/aip-architecture
- https://www.palantir.com/docs/foundry/aip-evals/run-suite
- https://learn.microsoft.com/en-us/fabric/iq/overview
- https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-graph
- https://help.aliyun.com/en/dataphin/fullmanaged/getting-started/the-statistical-index
- https://sierra.ai/product/agent-studio

## 6. Repository and implementation evidence limits

The current repository already includes the original maps, research notes, selected repository audits, source registers and Phase 2 deep dives. However:

- The original 60+ repository study was conducted without builds or test execution. Phase 2 rechecked only selected high-value repositories.
- OpenFoundry, UModel, OpenFGA, Temporal/DBOS, OSDK and other code audits are remote source inspections at recorded branches/commits; they are not executed behavioural validation.
- Test files may have been inspected, but the relevant upstream suites were not run in this research pass.
- No production workflow, tenant-isolation test, benchmark, load test or failure-injection run was executed.
- The Phase 1/2 reconciliation says all 82 Phase 1 paths exist on main, but only 75 of 82 Git blob hashes match. Five differences are documented working-document revisions. Two unexpected mismatches remain for original map 30 and map 31.

The source archive and Phase 1 package copies of maps 30 and 31 were byte-compared and match each other. GitHub's current main-branch blob hashes for those paths differ from the corresponding Phase 1 package blobs. Restore those two files from the baseline package before treating the archive as byte-identical on main.

See:
- `16-validation/phase1-phase2-reconciliation.md`
- `16-validation/phase2-findings-and-next-tests.md`
- `research-method/coverage-ledger.md`
- `research-method/phase2-source-register.md`

## 7. What “enough research” should mean for each target document

A target document in the 00–17 structure is ready to influence engineering only when it contains:

1. **Scope:** the exact question and system boundary.
2. **Primary evidence:** current official docs, source-code paths at a pinned commit, or a paper; secondary/vendor claims are labelled.
3. **Mechanism:** the actual sequence, state transitions, data structures, invariants and failure paths—not only a feature summary.
4. **Comparison:** at least one alternative and why it differs.
5. **Implication:** what we copy, adapt, reject or defer, with inference separated from fact.
6. **Open questions:** source contradictions, version gaps and unknowns.
7. **Acceptance tests:** specific cases that could prove the design wrong.
8. **Evidence status:** documented, source-inspected, test-source-inspected, prototyped, tested or validated.

A directory full of files is not a completion metric. An unverified paragraph does not become reliable by being moved into a new folder.

## 8. Recommended research sequence

### P0 — correct historical evidence and claim traceability
- Restore map 30 and map 31 byte-for-byte from the original Phase 1 package.
- Apply the 15 corrections in the original verification report in a separately versioned correction register.
- Add the OSv2 correction to the Palantir reference documents and re-check every OSv1-dependent recommendation.
- Ensure every load-bearing claim links to a primary source or is explicitly downgraded.

### P1 — correctness-critical engineering research
- Data source identity, event ordering, replay, tombstones, checkpoint commits and schema drift.
- Ontology schema publication, primary-key migration, link constraints and object-set snapshot semantics.
- Tenant/matter policy enforcement across SQL, document, vector, graph, cache, workflow and agent paths.
- Action concurrency, idempotency, audit/outbox boundary and external side-effect reconciliation.
- Durable workflow restart, approval wait, version pinning and cancellation.
- Metric grain, semantic join validation, definition versioning and verified query library.

### P2 — domain and product validation
- Complete law-firm workflow interviews and choose one workflow with a measurable baseline.
- Re-check legal ethical-wall and matter-membership requirements with practitioner evidence.
- Preserve receivables as the original structured-data benchmark; compare it to legal rather than rewriting the history.
- Re-research company/market material whose source labels are weak or whose data is stale.

### P3 — executable proof
- Build one narrow source→ontology→query→policy→action→workflow slice.
- Run replay, concurrency, isolation, revocation, recovery, retrieval permission and cost tests.
- Record commit, environment, commands, fixtures, logs and observed outcomes.

## 9. Research integrity rule

Preserve historical source documents. Record corrections in dated, source-linked errata and synthesis documents. Never silently rewrite an old source note, promote an inference into a fact, or label a source inspection as a passing test.
