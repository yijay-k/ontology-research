# File manifest — research repository

**Tree verification:** 27 November 2026  
**Verified commit:** `4de368c0abad303813d9178ecb560b655a66a148`

## Current repository inventory

- 103 file blobs on `main`.
- 82 paths from the Phase 1 package; all 82 paths are present.
- 21 post-Phase-1 additions.
- 32 original source Markdown documents under `sources/archive-original/`.
- Two original source-map Git blob mismatches remain open; see `phase1-phase2-reconciliation.md`.

The Phase 1 package itself contains 82 entries: 75 Markdown files, six Mermaid diagrams and one JSON QA report. It includes 32 historical research Markdown files. The original archive is preserved as extracted documents rather than committed as a ZIP.

## Twenty-one post-Phase-1 paths

### Architecture synthesis and vendor corrections

1. `01-reference-architecture/original-research-architecture.md`
2. `01-reference-architecture/palantir-osv2-current-state.md`

### Phase 2 technical deep dives

3. `02-data-platform/phase2-sync-and-build-semantics.md`
4. `03-ontology-engine/phase2-object-and-query-contracts.md`
5. `03-ontology-engine/phase2-schema-language-and-relationships.md`
6. `05-semantic-and-metrics-engine/phase2-metric-contracts.md`
7. `06-action-and-execution-engine/phase2-action-isolation-and-invariants.md`
8. `08-agent-platform/phase2-agent-sessions-and-evaluation.md`
9. `09-security-and-governance/tenant-isolation-threat-model.md`
10. `13-domain-packs/legal/law-firm-interview-guide.md`

### Repository implementation audits

11. `15-repository-audits/alibaba-umodel-runtime-phase2.md`
12. `15-repository-audits/durable-workflow-deep-dive-phase2.md`
13. `15-repository-audits/openfga-recursion-and-consistency-phase2.md`
14. `15-repository-audits/openfoundry-action-and-tenancy-phase2.md`
15. `15-repository-audits/palantir-osdk-runtime-phase2.md`

### Validation, evidence and correction tracking

16. `16-validation/github-access-and-publishing.md`
17. `16-validation/phase1-phase2-reconciliation.md`
18. `16-validation/phase2-findings-and-next-tests.md`
19. `16-validation/research-quality-audit-2026-11-27.md`
20. `16-validation/source-correction-register.md`
21. `research-method/phase2-source-register.md`

## Preserved originals

The original 32 Markdown research notes are stored under `sources/archive-original/`. The six reference maps (30–35) remain the controlling historical build maps. New research and corrections belong in the synthesis/audit layer; do not silently rewrite those historical sources.

## Verification and known limits

The tree check was recursive and not truncated. All 82 Phase 1 package paths were found. The manifest-to-tree comparison found 75 exact Git blob matches; five changes are expected working-document revisions and two unexpected mismatches remain in maps 30 and 31. See `16-validation/phase1-phase2-reconciliation.md` for the expected and observed hashes.

This manifest tracks file presence, not research correctness or runtime validation. No test suites, production workflows or benchmarks were run as part of this inventory check.
