# Coverage ledger — Phase 1 and Phase 2

**Last reconciled:** 27 November 2026  
**Mode:** archive reconciliation, official documentation review and remote source-code inspection.  
**Execution status:** no local builds, test suites, benchmarks or production runtime tests were run.

## Repository pack coverage

| Item | Expected | Verified on main | Status |
|---|---:|---:|---|
| Phase 1 bundle paths | 82 | 82 | All present |
| Phase 1 exact Git blob matches | 82 | 75 exact | 5 working-document revisions; 2 original map hash mismatches remain |
| Additional Phase 2 paths at last reconciliation | 9 | 9 | All present |
| Original source Markdown documents | 32 | 32 paths | Maps 30 and 31 still have blob mismatches |
| Repository tests executed | — | 0 | Not executed |

See [Phase 1/2 repository reconciliation](../16-validation/phase1-phase2-reconciliation.md). Phase 2 deep-dive documents added in this commit extend the current repository beyond the nine-file Phase 2 baseline.

## Source-level research coverage

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

## What the new Phase 2 evidence adds

- Source sync and build semantics distinguish source cursor, staged import, current-state projection, job output grouping and DAG-level partial completion.
- Ontology research now includes paging consistency, object-set execution tiers, projections and a pinned public OSDK client-source inspection.
- Metric research now compares Dataphin's atomic/derived metric grammar and Quick BI's question-to-dataset routing configuration.
- Action research now explicitly records snapshot write skew, retry classification and the transaction/effect boundary.
- Agent research now covers durable typed sessions, event/state transitions and repeated regression evaluation.

## Remaining research coverage gaps

1. Phase 1 maps 30 and 31 need exact blob restoration from original Phase 1 archive.
2. Not every one of the original 60+ code repositories has been re-audited.
3. Phase 2 source inspections do not include builds, test execution, benchmarks or deployment verification.
4. Palantir official docs are not private implementation; UModel/OpenFoundry are independent projects.
5. Market/product documents 18–28 need targeted current verification for the legal direction.

## Priority follow-up

- Restore maps 30/31 and verify the complete archive manifest.
- Finish OpenFoundry route/wiring/read authorization and action failure paths.
- Run UModel provider/model-pack contract tests and tenant isolation tests.
- Execute snapshot pagination, action write-skew, outbox recovery, workflow replay and ACL revocation tests in our own prototype.
- Select a first domain workflow only after interviews and measurable buyer pain are evidenced.
