# Phase 1 / Phase 2 repository reconciliation

**Checked:** 27 November 2026  
**Repository:** yijay-k/ontology-research  
**Branch:** main  
**Base research package:** ontology-research-phase1.zip (82 files)  
**Expanded package:** ontology-research-phase2-pack.zip (91 files)

## Result

Phase 1 **was included** in the GitHub repository as extracted files, not as a ZIP attachment. The live main tree contains 91 file blobs. Comparing the Phase 1 ZIP manifest against the live GitHub tree found:

- 82 of 82 Phase 1 paths present.
- 9 additional paths from Phase 2.
- 75 of 82 Phase 1 files have an exact Git blob SHA match to the Phase 1 ZIP.
- Five expected working-document revisions account for five content differences: README.md, 15-repository-audits/README.md, 16-validation/file-manifest.md, 16-validation/phase2-research-backlog.md and 16-validation/publishing-status.md.
- Two unexpected content-hash differences remain in files stored under sources/archive-original: 30-map-palantir-platform.md and 31-map-lingyang-alibaba-offers.md. Their current remote byte sizes match the Phase 1 ZIP, but their Git blob hashes differ. They must be restored from the supplied Phase 1 source before the historical archive can be called byte-identical. This is an explicit open integrity issue, not a completed check.

The original source archive itself is not committed as a ZIP; its documents are extracted into sources/archive-original. The Phase 1 structured notes, methodology, audits, diagrams and design hypotheses are also individually present.

## Nine paths added after Phase 1

1. 09-security-and-governance/tenant-isolation-threat-model.md
2. 13-domain-packs/legal/law-firm-interview-guide.md
3. 15-repository-audits/alibaba-umodel-runtime-phase2.md
4. 15-repository-audits/durable-workflow-deep-dive-phase2.md
5. 15-repository-audits/openfga-recursion-and-consistency-phase2.md
6. 15-repository-audits/openfoundry-action-and-tenancy-phase2.md
7. 16-validation/github-access-and-publishing.md
8. 16-validation/phase2-findings-and-next-tests.md
9. research-method/phase2-source-register.md

## What Phase 1 actually delivered

Phase 1 was a research/synthesis package, not an implementation prototype. It includes:

- Six original architecture/reference maps: Palantir platform; Lingyang/Alibaba; research/cost; context/code/integration; agent companies; market/competitors.
- Detailed original source notes for Palantir's data layer, Ontology, AIP, security, apps/infrastructure and business model.
- Lingyang/AgentOne, Dataphin, Quick BI and the wider Alibaba/Qwen/KAG/OpenSPG/UModel research.
- Knowledge-layer and agent/memory/evaluation papers, cost/economics, context-layer products and memory, 60+ repository study, agent-company profiles, integrations, finance/receivables competitors and process automation companies.
- A company/platform comparison, domain packs, selected code-level repository audits, cross-repository patterns, architecture hypotheses and system diagrams.
- Research protocol, source/evidence labels, coverage ledger, reconciliation and verification report.

The six reference maps are the detailed product/build plan. The current generic capability documents are a supporting decomposition; they do not replace the original map-level decisions and v1/v2 checklists.

## Phase 2 status

Phase 2 added deeper source-level inspection in four high-value seams:

- OpenFoundry: tenant handling, action write transaction ordering and webhook side effects.
- Alibaba UnifiedModel: GraphStore providers, import confinement, query capability planning, and agent read/write tool boundaries.
- OpenFGA: recursive checks and consistency/cache freshness.
- Temporal versus DBOS: durable state/recovery and the limits of exactly-once external effects.

It also added a legal matter/ethical-wall threat model and law-firm interview guide. Phase 2 is still partial. No test suites were executed; test-source inspection is not runtime validation. The other 60+ repositories have not all been re-audited.

## Research integrity rules

1. Do not label source inspection as a passing test.
2. Do not describe all 60+ repositories as newly audited.
3. Keep the original maps as the historical source; correct them only through separately versioned findings or an explicit restoration.
4. Record file integrity exceptions rather than hiding them.
5. Keep original receivables assumptions and later legal pivot distinguishable.
