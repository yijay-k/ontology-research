# Phase 1 / Phase 2 repository reconciliation

**Checked:** 27 November 2026  
**Repository:** yijay-k/ontology-research  
**Branch:** main  
**Base package:** ontology-research-phase1.zip (82 file entries)  
**Latest tree check:** commit `28e5ba2a0b7b1e88071795ea27dc15f1f30acadc`

## Result

The original Phase 1 bundle is present in the GitHub repository as extracted files, not as a ZIP attachment.

A fresh recursive Git-tree check at the commit above found:

- **102 file blobs** on `main`.
- **82 of 82 Phase 1 paths** are present.
- **20 paths beyond the Phase 1 package** are present.
- The 20 additional paths consist of 18 previously published synthesis/Phase 2 paths plus the two research-quality/OSv2 correction documents added in the latest audit commit.
- The Git blob comparison remains **75 exact matches out of 82 Phase 1 files**.
- Five content differences are expected working-document revisions: `README.md`, `15-repository-audits/README.md`, `16-validation/file-manifest.md`, `16-validation/phase2-research-backlog.md` and `16-validation/publishing-status.md`.
- Two unexpected hash mismatches remain in `sources/archive-original/30-map-palantir-platform.md` and `31-map-lingyang-alibaba-offers.md`. Their remote sizes match the Phase 1 archive, but their current Git blob hashes differ from the original package and they must be restored.

**Correction to earlier inventory:** an earlier version of this report said 91 file blobs and listed nine additional paths. That count was incomplete. The pre-audit main tree at commit `596db1a9f7224c1ea212623d8beb479ad01eab0f` had 100 file blobs and 18 paths beyond the Phase 1 package. The latest audit commit adds two new files, giving 102. Do not rely on the previous “91 / nine” statement.

## Original map hash comparison

The two source files in `research-all-markdown.zip` and `ontology-research-phase1.zip` are byte-identical. Git blob hashes calculated from the Phase 1 ZIP:

| File | Bytes | Expected Git blob SHA | Current main blob SHA |
|---|---:|---|---|
| `30-map-palantir-platform.md` | 132,560 | `0b81e732b8aa6b9ad05101b0ca57980bcf684ce0` | `4def6d61b72c8c26eba22955855ce4ca916af590` |
| `31-map-lingyang-alibaba-offers.md` | 106,265 | `4ea84cc75a82ad8bd428a1ddb8660d82195f3000` | `6cd279c20db0d9c539fb81649a875696ea00f5f8` |

Both files have the same byte length as the baseline package, but different hashes. The baseline package copies are available in the Library artifact `ontology-research-phase1.zip`; do not call the remote copies byte-identical until they are replaced and re-fetched.

## Phase 1 package inventory

- 75 Markdown files
- 6 Mermaid diagrams
- 1 JSON QA report
- 32 archived original research Markdown files

The original archive itself is not committed as a ZIP. Its 32 documents are extracted under `sources/archive-original/`; the remainder of the research package includes methods, synthesis, audits, hypotheses, validation records and diagrams.

## Twenty paths beyond the Phase 1 package

1. `01-reference-architecture/original-research-architecture.md`
2. `02-data-platform/phase2-sync-and-build-semantics.md`
3. `03-ontology-engine/phase2-object-and-query-contracts.md`
4. `03-ontology-engine/phase2-schema-language-and-relationships.md`
5. `05-semantic-and-metrics-engine/phase2-metric-contracts.md`
6. `06-action-and-execution-engine/phase2-action-isolation-and-invariants.md`
7. `08-agent-platform/phase2-agent-sessions-and-evaluation.md`
8. `09-security-and-governance/tenant-isolation-threat-model.md`
9. `13-domain-packs/legal/law-firm-interview-guide.md`
10. `15-repository-audits/alibaba-umodel-runtime-phase2.md`
11. `15-repository-audits/durable-workflow-deep-dive-phase2.md`
12. `15-repository-audits/openfga-recursion-and-consistency-phase2.md`
13. `15-repository-audits/openfoundry-action-and-tenancy-phase2.md`
14. `15-repository-audits/palantir-osdk-runtime-phase2.md`
15. `16-validation/github-access-and-publishing.md`
16. `16-validation/phase1-phase2-reconciliation.md`
17. `16-validation/phase2-findings-and-next-tests.md`
18. `research-method/phase2-source-register.md`
19. `01-reference-architecture/palantir-osv2-current-state.md`
20. `16-validation/research-quality-audit-2026-11-27.md`

The first 18 were present before the current audit commit; the last two are the new research corrections.

## What Phase 1 actually delivered

Phase 1 was a research/synthesis package, not an implementation prototype. It includes:

- Six original architecture/reference maps: Palantir platform; Lingyang/Alibaba; research/cost; context/code/integration; agent companies; market/competitors.
- Detailed original source notes for Palantir data, Ontology, AIP, security, apps/infrastructure and business model.
- Lingyang/AgentOne, Dataphin, Quick BI and the wider Alibaba/Qwen/KAG/OpenSPG/UModel research.
- Knowledge-layer and agent/memory/evaluation papers, cost/economics, context products, 60+ repository study, agent-company profiles, integrations, finance/receivables competitors and automation companies.
- A research protocol, evidence labels, coverage ledger, source register, verification report, repository audits, architecture hypotheses and Mermaid diagrams.

The six reference maps are the detailed original product/build plan. Generic capability docs are a supporting decomposition; they do not replace the original map-level decisions and v1/v2 checklists.

## Phase 2 status

Phase 2 includes selected deeper source inspections in OpenFoundry, Alibaba UModel, OpenFGA, Temporal/DBOS and OSDK, plus sync/build, schema/query, metrics, action, agent-session and legal threat-model notes. It remains partial. No upstream test suites were run; source/test inspection is not runtime validation. The original 60+ repository survey has not all been re-audited.

## Research integrity rules

1. Do not label source inspection as a passing test.
2. Do not describe all 60+ repositories as newly audited.
3. Keep original maps as historical sources; correct them only through separately versioned findings or an explicit restoration.
4. Record integrity exceptions rather than hiding them.
5. Keep original receivables assumptions and the later legal pivot distinct.
6. Keep file counts and path manifests tied to a recursive tree check; do not reuse stale inventory numbers.
