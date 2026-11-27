# Phase 2 source register

**Last checked:** 27 November 2026. Source commits and documentation retrieval identify what was inspected, not what was executed or runtime-validated.

## Pinned repository source inspections

| Project | Commit inspected | Primary source |
|---|---|---|
| CapTrix/openfoundry | `090e3f19b6b90fb77c23d779a318957c937067b2` | https://github.com/CapTrix/openfoundry/tree/090e3f19b6b90fb77c23d779a318957c937067b2 |
| alibaba/UnifiedModel | `5cd06e951195bebfc29e8d256eb0471b135df4b4` | https://github.com/alibaba/UnifiedModel/tree/5cd06e951195bebfc29e8d256eb0471b135df4b4 |
| openfga/openfga | `d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251` | https://github.com/openfga/openfga/tree/d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251 |
| dbos-inc/dbos-transact-ts | `adde4eb4037d64cd3072d5c6b875cf0bd2927d75` | https://github.com/dbos-inc/dbos-transact-ts/tree/adde4eb4037d64cd3072d5c6b875cf0bd2927d75 |
| temporalio/sdk-typescript | `8447c6928c773072a94d5f206a34465e3d9ea7df` | https://github.com/temporalio/sdk-typescript/tree/8447c6928c773072a94d5f206a34465e3d9ea7df |
| palantir/osdk-ts | `5c6d916f5ab1874ea081402eddeb130960d4c9b4` | https://github.com/palantir/osdk-ts/tree/5c6d916f5ab1874ea081402eddeb130960d4c9b4 |

## Palantir official product/architecture documentation checked

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

## Alibaba official documentation checked

- Dataphin statistical metric definitions: https://help.aliyun.com/en/dataphin/fullmanaged/getting-started/the-statistical-index
- Dataphin logical business/metric model: https://help.aliyun.com/en/dataphin/fullmanaged/product-overview/logical-structure-that
- Dataphin quality rules, weak/strong enforcement and trial runs: https://help.aliyun.com/en/dataphin/fullmanaged/user-guide/create-a-data-table-quality-rules
- Dataphin modelling and lineage submission checks: https://help.aliyun.com/en/dataphin/semimanaged-v4/user-guide/specification-modeling-task-submission-instructions
- Quick BI Question-based Knowledge Management and dataset selection: https://help.aliyun.com/en/quick-bi/user-guide/knowledge-base-configuration

## Research limits

- Palantir and Alibaba official docs are product-contract evidence, not private server implementation disclosure.
- The OSDK source audit is a client-side API/SDK inspection, not an audit of Palantir's backend.
- No upstream repositories were built; no test suites, benchmarks or Foundry/Dataphin runtime workflows were executed.
- Documentation may describe product features with plan/region/preview dependencies. Re-check availability and lifecycle before implementing against a specific customer environment.


## Additional Palantir schema-language documentation checked

- Object type primary key/title key and stable object identity: https://www.palantir.com/docs/foundry/object-link-types/create-object-type
- Link type backing patterns and declared cardinality: https://www.palantir.com/docs/foundry/object-link-types/create-link-type
- Link type semantic definition and instances: https://www.palantir.com/docs/foundry/object-link-types/link-types-overview
- Object-backed relationship modelling guidance: https://www.palantir.com/docs/foundry/ontology/ontology-structural-guidance
- Interface properties and abstraction: https://www.palantir.com/docs/foundry/interfaces/interface-overview
- Interface implementation and property/link/action contract mapping: https://www.palantir.com/docs/foundry/interfaces/implement-interface
- Interface link constraints: https://www.palantir.com/docs/foundry/interfaces/interface-link-types-overview

## Additional Alibaba documentation checked

- Dataphin dimensional modeling follows Kimball-style business entity/dimension and business activity/fact modelling: https://help.aliyun.com/en/dataphin/semimanaged-v4/user-guide/data-modeling-research-and-development
