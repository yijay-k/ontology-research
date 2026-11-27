# OpenSPG and KAG (Ant Group)

| | |
|---|---|
| **Repository** | <https://github.com/OpenSPG/KAG>, <https://github.com/OpenSPG/openspg>, <https://github.com/typedb/typedb> |
| **Why it matters** | Ant Group's typed knowledge graph with a schema DSL, rule-derived relations and a planner/executor solver. |
| **What to take** | Bilingual type labels, concept taxonomy separate from entity types, relations derived by rule, logical → optimised → physical query planning, generated code run outside the model. |
| **What not to copy** | The Java OpenSPG server and graph store as dependencies (OpenSPG idle ~17 months). |
| **Feeds** | [04-query-and-metrics/query-plans-and-compiler](../engineering/04-query-and-metrics/query-plans-and-compiler.md), [06-knowledge-and-evidence/knowledge-graph-retrieval](../engineering/06-knowledge-and-evidence/knowledge-graph-retrieval.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** **copy the design** of bilingual labels, concept taxonomies separate from entity types, and *rule-derived relations* (a derived link computed from a pattern). **Ignore** as a dependency (it needs the Java OpenSPG server and a graph store). [Inference]

## From the open-source code study: 12. KAG and OpenSPG (Ant Group)

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- KAG: Apache-2.0, Python (about 101k lines), version 0.8.0, last commit 2026-11-19. OpenSPG: Apache-2.0, Java/Scala (about 138k lines), last commit 2025-06-29. OpenSPG has been idle for about 17 months while KAG is active. [Fact]
- The schema DSL (`*.schema`, for example [RiskMining.schema](https://github.com/OpenSPG/KAG/blob/HEAD/kag/examples/riskmining/schema/RiskMining.schema)) works like this:
  - Types are bilingual (`Person(自然人): EntityType`) and come in two kinds: `ConceptType` with a `hypernymPredicate: isA` (a taxonomy) and `EntityType` with `properties` and `relations`.
  - Relations can have their own properties (for example `fundTrans` carries transDate and transAmt).
  - Relations can be *derived by rule*. KGDSL `Define (s:Person)-[p:developed]->(o:App) { STRUCTURE {...} CONSTRAINT { deviceNum = group(s,o).count(d); R1(...): deviceNum > 5 } }` defines a relation by a graph pattern plus an aggregate constraint.

  [Fact]
- The solver has planners (static, iterative, logical-form, MCP) and executors (retriever, deduce, math, MCP). [Fact] ([kag/solver/](https://github.com/OpenSPG/KAG/tree/HEAD/kag/solver))
- Verdict: **copy the design** of bilingual labels, concept taxonomies separate from entity types, and *rule-derived relations* (a derived link computed from a pattern). **Ignore** as a dependency (it needs the Java OpenSPG server and a graph store). [Inference]

## Repository audit: Repository audit — OpenSPG and KAG

> Source: former `15-repository-audits/openspg-kag.md` (Phase 2 source inspection, not executed).

**Projects:** [OpenSPG/openspg](https://github.com/OpenSPG/openspg) and [OpenSPG/KAG](https://github.com/OpenSPG/KAG). These are related projects in the same ecosystem, but they are not the same runtime. OpenSPG provides graph/semantic modelling and query infrastructure; KAG is a knowledge-augmented generation and reasoning framework built around knowledge-base indexes and configurable solver pipelines.

**Snapshot inspected:** `master` for both repositories, 27 November 2026. Public source inspection only; no clone, build or tests run. Licence should be checked at the exact root and for each dependency before reuse; this audit does not issue a legal opinion.

### Why both projects matter

OpenSPG is relevant to the semantic/query side: it treats graph query as a language and planning problem, not just a direct graph-database call. KAG is relevant to the AI retrieval/reasoning side: it composes retrievers, planners and executor types into a workflow. Together, they illustrate a possible boundary between a structured semantic query engine and an LLM-assisted knowledge-reasoning pipeline.

### OpenSPG: source-level query planning trace

#### Module map observed

The repository tree contains a `reasoner` project with `kgdsl-parser`, `lube-api`, `lube-logical`, `lube-physical` and related modules, plus server-side schema model/service modules. The module names and package structure show a deliberate compiler-like separation. This audit focused on selected Lube implementation files, not the full Java schema server.

Relevant code:

- [Lube API parser interface](https://github.com/OpenSPG/openspg/blob/master/reasoner/lube-api/src/main/scala/com/antgroup/openspg/reasoner/lube/parser/ParserInterface.scala)
- [LogicalPlanner](https://github.com/OpenSPG/openspg/blob/master/reasoner/lube-logical/src/main/scala/com/antgroup/openspg/reasoner/lube/logical/planning/LogicalPlanner.scala)
- [LogicalOptimizer](https://github.com/OpenSPG/openspg/blob/master/reasoner/lube-logical/src/main/scala/com/antgroup/openspg/reasoner/lube/logical/optimizer/LogicalOptimizer.scala)
- [PhysicalPlanner](https://github.com/OpenSPG/openspg/blob/master/reasoner/lube-physical/src/main/scala/com/antgroup/openspg/reasoner/lube/physical/planning/PhysicalPlanner.scala)
- [TypeDB query analysis example for contrast](https://github.com/typedb/typedb/blob/master/query/analyse.rs)

#### Trace A — unresolved query becomes a logical plan

`LogicalPlanner.plan(...)` accepts an unresolved `Block` and resolves it against `LogicalPlannerContext`. It derives a `SolvedModel` by resolving match-block graph patterns against the schema catalog, maps query fields to typed variables, and then constructs typed logical operators. Table results become `Select` operators over resolved variables/paths. DDL blocks become DDL logical operators after input references have been resolved.

This matters because names, fields and graph patterns are not simply interpolated into a backend query. The planner resolves them against a model/schema context first. It also explicitly throws `NotImplementedException` for unsupported block kinds in the inspected path; unsupported query constructs should be treated as a bounded capability, not silently assumed to execute.

#### Trace B — logical optimization is rule-driven

`LogicalOptimizer.LOGICAL_OPT_RULES` includes rules such as `PatternJoinPure`, `IdEqualPushDown`, `FilterPushDown`, `FilterMerge`, `AggregatePushDown`, `ProjectMerge` and `SolvedModelPure`. `optimize` applies each rule in a configured direction (top-down or bottom-up) and repeats it up to the rule's `maxIterations`.

The useful pattern is a typed, inspectable intermediate representation plus a small, explicit rule set. Query optimization can be independently tested and reasoned about, unlike a large prompt that asks an LLM to generate a raw graph query with no explainable plan.

#### Trace C — physical planning is a separate stage

`PhysicalPlanner.plan` maps logical operator variants into backend physical operators over a graph/RDG abstraction. The inspected code includes explicit `Cache` and `Join` planning for subqueries and an outer-join choice. This is evidence of a logical-to-physical boundary; this audit did not reconstruct every operator or every physical backend adapter.

### KAG: solver and executor execution trace

Relevant code:

- [main_solver.py](https://github.com/OpenSPG/KAG/blob/master/kag/solver/main_solver.py)
- [KAG static planner](https://github.com/OpenSPG/KAG/blob/master/kag/solver/planner/kag_static_planner.py)
- [Hybrid retrieval executor](https://github.com/OpenSPG/KAG/blob/master/kag/solver/executor/retriever/kag_hybrid_retrieval_executor.py)
- [Python math executor](https://github.com/OpenSPG/KAG/blob/master/kag/solver/executor/math/py_based_math_executor.py)
- [KAG index manager](https://github.com/OpenSPG/KAG/blob/master/kag/indexer/kag_index_manager.py)

#### Trace A — configuration assembles the pipeline

`main_solver.py` loads pipeline YAML configurations, resolves placeholders from runtime configuration, builds retriever configurations for each configured knowledge base/index, and selects a custom or default solver pipeline. For non-index requests it first invokes a self-cognition pipeline; if that does not return a usable result, it executes the configured solver pipeline. This is orchestration over explicitly configured executor types, not one monolithic `RAG()` call.

#### Trace B — planner sees the executor catalogue

`KAGStaticPlanner` receives an LLM, plan prompt and rewrite prompt. Its `invoke/ainvoke` passes the user query and the available executor descriptions to the model, requesting structured task-plan output using the configured JSON prompt format. Task dependencies are later formatted into context for query rewriting. This is an LLM-planned task graph, so executor definitions, parameter schemas, dependency resolution and runtime validation are security-critical.

#### Trace C — retrieval uses a knowledge-base/index contract

`main_solver.do_qa_pipeline` resolves configured KB project IDs, creates index managers, asks them to build retriever configuration and injects those retrievers into the chosen solver pipeline. In the inspected default pipeline, the code comments that it uses the chunk index only. KAG has multiple index/retrieval paths; the selected pipeline config determines what is actually queried.

#### Trace D — generated Python is executed outside the model process

`PyBasedMathExecutor` asks the LLM to generate Python code, writes it to a temporary file, and invokes the current Python interpreter through `subprocess.run`. It applies a default timeout of five seconds and retries code generation up to three attempts. This is a concrete implementation detail, not a guarantee of safe execution. A timeout limits duration; the inspected helper does not establish a sandbox, syscall isolation, filesystem restrictions, memory quota, network prohibition or container-level privilege boundary. Do not copy this design as an enterprise agent-code execution boundary without stronger isolation.

### What is common and what is different

| Concern | OpenSPG Lube | KAG |
|---|---|---|
| Primary responsibility | Semantic graph query compilation/planning | Knowledge retrieval and LLM-assisted reasoning workflow |
| Main IR | Resolved graph/query blocks and logical operators | Task plan and executor arguments/context |
| Schema role | Schema catalog resolves graph patterns/fields | KB indexes and retriever configurations supply knowledge context |
| Optimisation | Explicit logical rules then physical planning | Planner prompt/query rewrite and retrieval strategy composition |
| Execution | Physical graph/RDG operators | Typed executor components, some LLM-assisted |
| Main risk to assess | Query-language coverage and backend physical semantics | Planner-output validation, executor permissioning and code execution isolation |

### What we should learn

1. Use a typed intermediate representation for ontology and semantic queries.
2. Separate parsing, schema resolution, logical planning, optimization and physical execution.
3. Expose an explainable plan and capability errors before execution.
4. Treat an agent planner as a request for a plan, not authority to execute it. Validate every executor type, parameter, policy and dependency server-side.
5. Keep deterministic calculators separate from model-generated code. Prefer a constrained expression language or isolated compute service over executing arbitrary generated scripts in the application worker.
6. Separate knowledge retrieval from authoritative object/action runtime.

### Not established in this audit

- Complete OpenSPG schema-service persistence/migration lifecycle.
- Full graph backend and physical operator coverage.
- KAG's end-to-end evaluator accuracy, citation correctness, multi-tenant authorization or production isolation.
- Actual build/test health or performance. No tests were executed and no benchmark was reproduced.
