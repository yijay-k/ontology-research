# Corrections and research-quality record

Every known error, stale claim and unverified area in the research, in one place. Read this before relying on any number or vendor claim.

## Source correction register

**Opened:** 27 November 2026  
**Authority:** `sources/archive-original/36-verification-report.md`, checked 21 November 2026, plus the current Palantir OSv2 re-check.  
**Purpose:** track known overstatements, inconsistencies and source gaps without rewriting the preserved research archive.

### How to use this register

The original files under `sources/archive-original/` are historical source material. Do not silently edit them. Each correction below records what the independent checker found, the safe current interpretation, what engineering/market decisions it affects, and the remaining verification needed.

Status vocabulary:
- **Correction specified:** wording/action is explicit, but the original note has not yet been edited.
- **Fresh re-check required:** the 21 November check is useful evidence but the current primary source should be fetched again before relying on the claim.
- **Open:** evidence is incomplete or contradictory.
- **Rechecked:** a dated current source has been read and the correction note is published.

### P0 — claims that must not drive architecture or commercial decisions until resolved

#### CR-01 — Palantir enrollment tiers and Ontology change approvals
- **Original location:** `03-palantir-aip.md`, key finding 2 and §8.
- **Problem:** “Small” was not present in the fetched LLM capacity page; the checker found Medium (default), Large and XL. The public MCP page supported branch-based changes and `create_global_proposal`, but did not say every Ontology change requires human-approved proposals.
- **Safe wording:** describe only the tiers actually shown by the current source; separate branch workflow, proposal capability and human approval policy. Do not infer a universal approval rule.
- **Impact:** do not model our release governance on a feature that has not been established.
- **Status:** Fresh re-check required. Fetch the current official capacity and MCP pages; record retrieval date and exact wording.

#### CR-02 — Airbyte licence and connector reuse
- **Original locations:** `14-open-source-code-study.md` and `24-integration-companies.md`.
- **Problem:** the two documents differ in how they interpret Elastic License 2.0. The verifier confirmed the platform repository licence but could not inspect the connector directory because it was absent from the local clone. The integration study cites a more specific Airbyte FAQ permitting use of Airbyte to ingest data for one's own customers, while the code study warns against offering Airbyte itself as a hosted service.
- **Safe wording:** distinguish (a) using Airbyte as an internal dependency to ingest customer data, (b) offering a hosted Airbyte service, (c) copying/redistributing connector code, and (d) each connector's own licence. Do not make a blanket “Airbyte is unusable in SaaS” or “all connectors are safe” statement.
- **Impact:** ingestion build-vs-buy and licence risk.
- **Status:** Open. Re-clone the current repository including integrations, inspect the precise licence/NOTICE for each connector considered, and obtain legal review before redistribution or hosted-service use.

#### CR-03 — Harvey model attribution
- **Original location:** `13-cost-and-economics.md`, key finding 7 and §8.
- **Problem:** Kimi K3 attribution comes from a secondary summary, not Harvey's own post. The cited Harvey post names Qwen3.8-27B (Firm Knowledge) and GLM-5.2 (Review Table). The source date is also written as 21 September in one place and 24 September in another.
- **Safe wording:** identify Kimi K3 as secondary-source reporting only; attribute the models named by Harvey to Harvey's own post; reconcile the publication date.
- **Impact:** model-routing and cost strategy must not be based on a false vendor-specific claim.
- **Status:** Correction specified; fresh primary-source check required.

#### CR-04 — AgentOne credit units are product-specific
- **Original locations:** `07-lingyang-agentone.md`, `13-cost-and-economics.md`, `25-palantir-agentone-offer-catalogue.md`.
- **Problem:** one note says the rate was not found; later work finds CNY 0.01/credit for the Data Analysis Agent top-up and CNY 0.09–0.10/credit for an ad-creative agent. There is no universal AgentOne credit-to-yuan rate. The 150,000-credit pack value is product-dependent.
- **Safe wording:** price each product/credit pack independently and include region, purchase type, date and included allowance. Never use a global “AgentOne credit” conversion.
- **Impact:** competitor economics, model cost comparisons and any pricing benchmark.
- **Status:** Correction specified; re-check live product-specific pricing before quoting externally.

#### CR-05 — Palantir object-storage/changelog semantics changed
- **Original location:** `30-map-palantir-platform.md`, data-layer decision 2.
- **Problem:** the map says Palantir ignores the ordering column and indexes in arrival order, recommending that we honour ordering at index time. The current OSv2 documentation distinguishes this from legacy OSv1 “latest timestamp wins” semantics and says Funnel handles changelog calculation for OSv2.
- **Safe wording:** scope the old observation to its legacy path. Do not treat it as current OSv2 behaviour or a design requirement copied from Foundry.
- **Impact:** source ordering, replay, indexing and build semantics.
- **Status:** Rechecked. See `01-reference-architecture/palantir-osv2-current-state.md`. Our own ordering contract remains an open engineering decision to test against source sequence, event time, observation time and ingestion time.

### P1 — material source or cross-document corrections

#### CR-06 — Ramp cash-application rejection reason is optional
- **Original location:** `22-ramp-and-finance-platforms.md`, cash-application findings.
- **Problem:** the source allows a rejection reason to be left blank; the archive says rejection must include a reason code.
- **Safe wording:** “A rejection may include one of the offered reasons and an optional note, or no reason.” A mandatory reason is our product policy choice, not a Ramp requirement.
- **Impact:** workflow UX and action validation.
- **Status:** Correction specified; re-fetch the current support page before use.

#### CR-07 — Ramp employee count attribution
- **Original location:** `22-ramp-and-finance-platforms.md`, company size/scale finding.
- **Problem:** the approximately 1,900 staff figure is attributed jointly to TechCrunch and Sacra, but the verifier could not find it in TechCrunch.
- **Safe wording:** cite Sacra alone if it still carries the estimate; include date and label it third-party estimate.
- **Impact:** market/company comparison; not a platform architecture dependency.
- **Status:** Fresh re-check required.

#### CR-08 — Sierra $400M+ ARR label
- **Original locations:** `13-cost-and-economics.md`, `12-agent-companies.md`, `19-sierra.md`.
- **Problem:** the same $400M+ October 2026 figure is labelled a Sacra estimate in document 13 but is supported by Sierra's own 30 October blog in documents 12 and 19. The $130M end-2025 figure is a separate Sacra estimate; do not collapse the sources.
- **Safe wording:** keep Sierra's October statement as a vendor-reported figure and Sacra's year-end estimate separately labelled.
- **Impact:** competitor financial comparison; not a validated market-size figure.
- **Status:** Correction specified; fresh blog and estimate check required before external citation.

#### CR-09 — Anthropic tool-use tokens and cache multipliers
- **Original location:** `13-cost-and-economics.md`, pricing section and key findings.
- **Problem:** 406 tokens for `any`/`tool` is listed only for Haiku 5.5, not Opus/Sonnet 5.5. Cache read multipliers vary by model: the verifier reports 0.05x for Opus/Sonnet 5.5, 0.1x for Haiku 5.5/Sonnet 5/Haiku 4.5, and 0.025x for Fable 5.2/Mythos 5.2.
- **Safe wording:** attribute each system-prompt overhead and cache factor to the exact model/version and retrieval date.
- **Impact:** model cost estimates and routing policies.
- **Status:** Fresh re-check required because prices/model versions are time-sensitive.

#### CR-10 — Cost sensitivity multiplier
- **Original location:** `13-cost-and-economics.md`, §5 sensitivity analysis.
- **Problem:** a “5x usage (250 questions/day)” case multiplies the entire design cost, including fixed cache writes, reports and drafts. The checker estimates that increasing only questions yields different totals (A ≈ $14,670; B ≈ $1,130; C ≈ $115).
- **Safe wording:** either rename the case “5x all activity volumes” or recompute each variable component independently. State the prefix-token assumption (20k total versus 20k on each call).
- **Impact:** unit economics and gross-margin modelling.
- **Status:** Correction specified; recompute the model in a reproducible sheet before using the estimates.

#### CR-11 — Big platform agent catalogue contains prior-knowledge sections
- **Original location:** `20-big-platform-agents.md`.
- **Problem:** Microsoft, Google, Amazon, ServiceNow and Workday sections were explicitly marked as prior knowledge and not re-read against sources.
- **Safe wording:** mark these entries “not researched” or re-research each product using current first-party product/developer docs. Do not use their feature lists as architecture evidence.
- **Impact:** reference-architecture completeness and competitive positioning.
- **Status:** Open. Re-research each company separately; do not promote the current summary to fact.

#### CR-12 — Intuit/Xero agent coverage contradiction
- **Original locations:** `22-ramp-and-finance-platforms.md` and `20-big-platform-agents.md`.
- **Problem:** document 22 says no product pages were opened and labels incumbent agent capabilities unverified; document 20 includes source-backed descriptions of QuickBooks Payments Agent and Xero Payment Follow Ups.
- **Safe wording:** reconcile the claims using current first-party links in document 20, then update the competitor comparison with date/version and exact capability boundaries.
- **Impact:** incumbent competition and first-workflow differentiation.
- **Status:** Fresh re-check required; document 20's relevant parts themselves need a current-source audit.

#### CR-13 — Q3 sub-segment revenue split source class
- **Original location:** `06-palantir-business.md`, revenue segment analysis.
- **Problem:** some Q3 sub-segment figures were derived from earnings-call transcript coverage, not directly from the company press release/filing, yet are labelled [Fact].
- **Safe wording:** label as transcript coverage or independently reconcile against a primary filing before making the claim.
- **Impact:** competitor growth analysis and enterprise market assumptions.
- **Status:** Open; source filing not fetched by the original checker.

#### CR-14 — Dataphin “additive?” metric flag
- **Original location:** `07-lingyang-agentone.md`, metric model discussion.
- **Problem:** the derived-metric page fetched by the verifier did not contain the “additive?” flag; it may exist on the atomic-metric page, which was not fetched.
- **Safe wording:** limit the claim to the exact metric type/page where it is documented, or remove it.
- **Impact:** metric registry schema and aggregation semantics.
- **Status:** Open. Fetch both atomic- and derived-metric primary docs.

#### CR-15 — UModel/MyContext source path and merger semantics
- **Original location:** `08-alibaba-stack.md`, MyContext/Higress code notes.
- **Problem:** the Higress `db.Raw` call is in `db.go`, not `server.go`. The verifier also found MyContext merger details omitted from the notes: numeric facets are averaged by evidence weight (capped 0.95); on conflict the stored value becomes the candidate's; supplement keeps the maximum confidence.
- **Safe wording:** correct the file path and describe each merge rule by source layer; do not generalise profile-layer merge behaviour to the full graph or organisation authorization model.
- **Impact:** code-level reference accuracy, agent data writes and memory conflict policy.
- **Status:** Correction specified; inspect the current upstream commit before adapting the mechanism.

#### CR-16 — Decagon revenue date mismatch
- **Original locations:** `13-cost-and-economics.md`, `18-decagon.md`, `19-sierra.md` comparison table.
- **Problem:** the same approximately $100M Decagon revenue estimate is dated July 2026 in two documents and August 2026 in another.
- **Safe wording:** reconcile the primary/secondary source publication date, event date and estimate period. Keep the estimate labelled as a third-party estimate if it is not company-reported.
- **Impact:** competitor trajectory only.
- **Status:** Open; fresh source-date reconciliation required.

### Additional observations from the original verification report

- The report checked 27 fetched claims: 20 fully supported, 6 partly supported and none outright contradicted in that sample. This is a sample result, not a pass rate for all claims in the 32-file archive.
- The arithmetic in the worked monthly cost model was mostly correct, but the checker identified the sensitivity-scaling and draft-prefix assumptions above.
- The original source labels are not uniformly strong enough. Secondary blogs, search-result titles, transcript coverage and vendor statements should not all be labelled `[Fact]`.
- Documents 20 and 27 contain prior-knowledge or headline-only sections; treat them as leads, not implementation evidence.
- The checker did not re-fetch every source or run the code it read. No statement in the historical report should be upgraded to “validated runtime behaviour.”

### Required closure workflow

For each CR:
1. Fetch the current primary source or pinned source-code revision.
2. Record exact claim text and the supporting passage/path.
3. Check date, product/edition, geography, version and metric definition.
4. Resolve cross-document disagreements and arithmetic.
5. Write the correction into a dated synthesis document; preserve the original.
6. Record the architecture/market consequence and confidence.
7. Update the status only when the evidence is attached.

A correction register is not complete merely because the issue is described. Close each entry with a source URL/path, retrieval date and a reviewer-visible change.

## Research quality and accuracy audit (27 Nov 2026)

**Checked:** 27 November 2026  
**Scope:** supplied original research archive, current `yijay-k/ontology-research` tree, Phase 1/2 reconciliation, selected current official vendor docs.

### 1. Executive assessment

The research archive is substantial, but it is not uniformly verified and should not yet be treated as a complete, implementation-ready engineering specification.

The supplied `research-all-markdown.zip` contains 32 Markdown research documents, approximately 17,567 lines and 2.54 million characters. It includes six detailed architecture/reference maps (30–35), separate Palantir and Alibaba/Lingyang research, research literature, agent-company studies, market/competitor research, an open-source code study and a verification report.

**Conclusion:** volume is not the main gap. The main gaps are claim freshness, source quality, unresolved contradictions, uneven coverage, and the difference between source inspection and executable validation.

### 2. What has been verified about the archive

The supplied source archive and the Phase 1 package each contain the same original map 30 and map 31 byte-for-byte. The Phase 1 package contains 82 entries: 75 Markdown files, six Mermaid diagrams and one QA report.

The separate verification report (dated 21 November 2026) describes a limited independent check:
- it reviewed key findings, “what to copy” and open questions, plus number-heavy sections of selected documents;
- it fetched 27 source pages and checked selected code claims by reading code only;
- 20 fetched claims were fully supported, six were partly supported, none were outright contradicted in that sample, and one further claim was confirmed on a second fetch;
- it redid the arithmetic in the cost model and selected business averages.

These results are encouraging, but they do **not** establish that every claim in all 32 documents is correct. The report explicitly says some documents received no fetch check, the paper results were not all re-read against the papers, and some code was not present in the inspected clone.

### 3. Known accuracy debt already recorded in the original verification report

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

### 4. Current source re-check: material Palantir update

The current official Foundry documentation distinguishes the legacy Object Storage v1 (Phonograph) backend from Object Storage v2 (OSv2). The OSv1 overview states planned unavailability after 30 June 2026. OSv2 separates indexing and querying, uses the Object Data Funnel for indexing, defaults to incremental indexing, and has explicit breaking changes in edit and changelog semantics.

A material conflict was found with original map 30:

- Map 30 says Palantir ignores the ordering column and indexes in arrival order, then recommends that our product honour the ordering column at index time.
- The current OSv2 breaking-changes documentation says OSv2 does not use the legacy “latest timestamp wins” changelog semantic; Funnel performs the relevant changelog calculations and the old changelog decorator is obsolete.

This does **not** remove the need for our own source ordering and replay contract. It means the old Palantir behaviour must be scoped to the legacy path and must not be copied as a current OSv2 design rule.

A separate detailed erratum is in `01-reference-architecture/palantir-osv2-current-state.md`.

### 5. Current reference-source checks

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

### 6. Repository and implementation evidence limits

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

### 7. What “enough research” should mean for each target document

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

### 8. Recommended research sequence

#### P0 — correct historical evidence and claim traceability
- Restore map 30 and map 31 byte-for-byte from the original Phase 1 package.
- Apply the 15 corrections in the original verification report in a separately versioned correction register.
- Add the OSv2 correction to the Palantir reference documents and re-check every OSv1-dependent recommendation.
- Ensure every load-bearing claim links to a primary source or is explicitly downgraded.

#### P1 — correctness-critical engineering research
- Data source identity, event ordering, replay, tombstones, checkpoint commits and schema drift.
- Ontology schema publication, primary-key migration, link constraints and object-set snapshot semantics.
- Tenant/matter policy enforcement across SQL, document, vector, graph, cache, workflow and agent paths.
- Action concurrency, idempotency, audit/outbox boundary and external side-effect reconciliation.
- Durable workflow restart, approval wait, version pinning and cancellation.
- Metric grain, semantic join validation, definition versioning and verified query library.

#### P2 — domain and product validation
- Complete law-firm workflow interviews and choose one workflow with a measurable baseline.
- Re-check legal ethical-wall and matter-membership requirements with practitioner evidence.
- Preserve receivables as the original structured-data benchmark; compare it to legal rather than rewriting the history.
- Re-research company/market material whose source labels are weak or whose data is stale.

#### P3 — executable proof
- Build one narrow source→ontology→query→policy→action→workflow slice.
- Run replay, concurrency, isolation, revocation, recovery, retrieval permission and cost tests.
- Record commit, environment, commands, fixtures, logs and observed outcomes.

### 9. Research integrity rule

Preserve historical source documents. Record corrections in dated, source-linked errata and synthesis documents. Never silently rewrite an old source note, promote an inference into a fact, or label a source inspection as a passing test.

## Corrections from the archive re-check

1. **OpenFoundry feature drift:** older PoC/ADR material says properties and link types are deferred or records an earlier ontology-parity estimate. Current CapTrix `main` includes property/link-type handlers and transactional metadata batch-save. Do not carry forward the old estimate as a current branch score.
2. **OpenFoundry transaction semantics:** metadata schema batch edits can share a PostgreSQL transaction with audit/outbox; object writes use a Cassandra primary write followed by a separate PostgreSQL outbox transaction. Those are different guarantees.
3. **OpenFoundry action ordering:** inspected action handler invokes configured webhook writeback before `planAction()`. This requires careful interpretation and a design warning; do not describe it as safe atomic execution.
4. **UModel scope:** its public README and current code give a semantic graph runtime, typed query surface and MCP agent gateway. External metric/log query plans are delegated rather than universally executed by the Query Service. Write tools are disabled by default. Some indexing is secondary and repairable.
5. **Fabric IQ scope:** current Microsoft documentation explicitly says ontology stores definitions and bindings and is not itself a general-purpose query engine; source data stays with owning systems. Feature is preview and old experience lifecycle is time-sensitive.
6. **Graphiti temporal facts:** current code has valid_at/invalid_at and expired_at distinctions. The archive's four-timestamp insight remains useful; inspect exact current provider behaviour before adoption.
7. **LightRAG Postgres graph:** current code confirms workspace/namespace composite keys, JSONB graph properties and canonical edge order.
8. **MetricFlow:** current code confirms typed dataflow and semantic join validation, not arbitrary Text-to-SQL as the core query mechanism.
9. **DataHub:** current code confirms a source/workunit processing model and Kafka MCP emission with backpressure. It is a metadata/catalog platform, not the operational ontology.
10. **DBOS:** current TypeScript code confirms persistent workflow state and checkpointed steps in a PostgreSQL system database; external side effects still need idempotency and reconciliation.
11. **OpenFGA:** inspected type-system validation confirms untrusted models should use `NewAndValidate()` rather than unvalidated graph construction. Full check evaluator audit remains incomplete.
12. **OSDK:** current client contract exposes typed object sets, interfaces, actions and validate-only mode. This does not disclose Palantir backend internals.

## Unchecked archive claims

The original verification report clearly identifies market figures and some company/repository blocks that were not freshly fetched or independently tested. In particular, several “big platform agents” and “more companies” entries rely on prior knowledge, headlines or summary pages. Preserve their labels and do not promote them to verified facts until rechecked.

## Archive integrity note

The repository used to hold two copies of the original 32 documents (`claude-research-markdown/` and `sources/archive-original/`). They were identical except for whitespace in maps 30 and 31; the `sources/archive-original/` copy of map 31 had two table rows merged onto one line. The `claude-research-markdown/` copy was kept (now `general-references/`) and the duplicate removed in the Nov 2026 restructure.
