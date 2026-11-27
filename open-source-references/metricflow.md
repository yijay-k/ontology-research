# dbt-labs/metricflow

| | |
|---|---|
| **Repository** | <https://github.com/dbt-labs/metricflow> |
| **Why it matters** | Apache-2.0 metric compiler that turns metric names, group-bys and filters into SQL, with a typed dataflow plan and join-safety rules. |
| **What to take** | Five metric types, the entity-type join matrix with MAX_JOIN_HOPS = 2, semi-additive measures; optionally run the compile-only sidecar from Node. |
| **What not to copy** | Text-to-SQL as the core mechanism (it is not); a second semantic layer that drifts from the ontology. |
| **Feeds** | [04-query-and-metrics/metrics-and-semantic-layer](../engineering/04-query-and-metrics/metrics-and-semantic-layer.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** **adopt as a dependency if metrics must compile to SQL over the customer's warehouse.** Spawn the sidecar from Node, pass it a manifest generated from your own metric definitions, and execute the returned SQL yourself under your own permission filters. Otherwise **copy the design**: the entity-type join matrix, the hop limit, and the five metric types. [Inference]

## From the open-source code study: 4. MetricFlow: semantic models and metric-to-SQL compilation

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

Plain-English explanation: you declare once that "revenue = sum of order_total over the orders table, joinable to customers by customer_id". Afterwards anyone can ask for "revenue by customer region, last 90 days", and the engine writes correct SQL, including the joins and time handling.

- Licence and activity: Apache-2.0 (LICENSE at commit 013590e), Python (about 130k lines), last commit 2026-11-16. The semantic-interface package now lives inside the repository as `metricflow_semantic_interfaces/`. [Fact]
- Spec objects (`metricflow_semantic_interfaces/protocols/`):
  - `SemanticModel` has `name`, `node_relation`, `defaults.agg_time_dimension`, `primary_entity`, `entities`, `measures`, `dimensions`, validity start/end dimensions (for slowly changing dimensions) and `partitions`.
  - Entity types are `primary`, `unique`, `natural` and `foreign`.
  - Metric types are `simple`, `ratio`, `cumulative`, `derived` and `conversion`.
  - Aggregations are sum, min, max, count_distinct, sum_boolean, average, percentile, median and count.
  - A metric can carry `filter`, `join_to_timespine`, `fill_nulls_with`, `offset_window` and `offset_to_grain`, and a measure can carry `non_additive_dimension` (for semi-additive values such as account balances).

  [Fact] ([protocols/metric.py](https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantic_interfaces/protocols/metric.py), [type_enums/](https://github.com/dbt-labs/metricflow/tree/HEAD/metricflow_semantic_interfaces/type_enums))
- Compilation:
  1. `metricflow/dataflow/builder/dataflow_plan_builder.py` (2,495 lines) builds a DataflowPlan DAG. It has separate builders for simple, cumulative, derived and conversion metrics, and uses node types such as read_sql_source, filter_elements, join_to_base, join_to_time_spine, where_filter, aggregate_simple_metric_inputs, compute_metrics, semi_additive_join, window_reaggregation and order_by_limit.
  2. `plan_conversion/` converts that DAG to a SQL query plan.
  3. `sql/optimizer/` prunes columns and reduces sub-queries.
  4. `sql/render/postgres.py` (and Snowflake, BigQuery, DuckDB, Trino, ClickHouse, Databricks, Redshift, Athena, Vertica) renders the SQL.

  [Fact]
- Join safety. `SemanticModelJoinEvaluator._VALID_ENTITY_JOINS` lists the joins that cannot fan out: primary→{natural, primary, unique}, unique→{natural, primary, unique}, foreign→{natural, primary, unique} and natural→{primary, unique}. Anything that lands on a foreign entity is invalid, and so is natural→natural. `MAX_JOIN_HOPS = 2`. [Fact] ([semantic_model_join_evaluator.py](https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py)). `node_evaluator.py` decides which dimension nodes can be joined to a metric node through which entity. [Fact]
- The sidecar. dbt-core v2 compiles MetricFlow to a native binary with Nuitka and talks to it with the "mf-ipc v1" NDJSON protocol. Its only job is `explain` (compile to SQL without executing). The parameters are `manifest_path`, `metric_names`, `group_by_names`, `where_constraints`, `order_by_names`, `limit` and `sql_engine` (enum member name, default `DUCKDB`). [Fact] ([sidecar/mf_ipc_protocol.py](https://github.com/dbt-labs/metricflow/blob/HEAD/sidecar/mf_ipc_protocol.py))
- Verdict: **adopt as a dependency if metrics must compile to SQL over the customer's warehouse.** Spawn the sidecar from Node, pass it a manifest generated from your own metric definitions, and execute the returned SQL yourself under your own permission filters. Otherwise **copy the design**: the entity-type join matrix, the hop limit, and the five metric types. [Inference]

## Repository audit: Repository audit — dbt-labs/metricflow

> Source: former `15-repository-audits/metricflow.md` (Phase 2 source inspection, not executed).

**Role:** semantic metrics compiler and query-planning reference.  
**Repository:** [dbt-labs/metricflow](https://github.com/dbt-labs/metricflow), branch `main`.  
**Validation:** selected source inspected; no tests/build run.

### Query pipeline

`MetricFlowEngine` creates an execution plan from a typed query request. Its `explain()` API returns the plan without running the warehouse query. When execution is requested, the engine executes the plan through an executor. The plan-conversion layer transforms a semantic dataflow plan into SQL plan nodes and then renders SQL for a target dialect.

`node_processor.py` handles node types such as time constraints, selectors, filters, joins and multi-hop join candidates. It uses a semantic-model lookup and `JoinDataflowOutputValidator`. The validator checks whether two instance sets can be joined along an entity and whether the join is safe; the code explicitly handles cases where one side is aggregated to the joining entity, and it uses semantic model join evaluators for non-aggregated paths. The original archive notes a `MAX_JOIN_HOPS` limit and fan-out validation; check current definitions before pinning exact numeric defaults in an implementation spec.

### Why this matters

A reliable metric query is not “let an LLM write SQL”. It requires a typed request, known metric and dimension definitions, join graph, aggregation grain, time semantics, filter typing, dataflow plan, fan-out checks and dialect-specific SQL rendering. A natural-language layer can help create a structured request, but deterministic validation should own the correctness boundaries.

### What MetricFlow does not solve

- Full business object identity and lifecycle.
- Operational actions and external writeback.
- Enterprise permissions or row/field policies on its own.
- Document/knowledge graph retrieval.
- Durable workflows.

### Adoption recommendation

**Learn from:** semantic request → dataflow plan → join validator → SQL plan → executor; `explain()` as an inspectable intermediate product; semantic join/fan-out logic.  
**Adapt:** connect ontology object relations/metrics to an equivalent typed query planner, but keep execution and data source adapters separate.  
**Avoid:** relying on generated SQL without proving join cardinality, aggregation grain and policy constraints.
