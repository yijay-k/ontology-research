# Repository audit — dbt-labs/metricflow

**Role:** semantic metrics compiler and query-planning reference.  
**Repository:** [dbt-labs/metricflow](https://github.com/dbt-labs/metricflow), branch `main`.  
**Validation:** selected source inspected; no tests/build run.

## Query pipeline

`MetricFlowEngine` creates an execution plan from a typed query request. Its `explain()` API returns the plan without running the warehouse query. When execution is requested, the engine executes the plan through an executor. The plan-conversion layer transforms a semantic dataflow plan into SQL plan nodes and then renders SQL for a target dialect.

`node_processor.py` handles node types such as time constraints, selectors, filters, joins and multi-hop join candidates. It uses a semantic-model lookup and `JoinDataflowOutputValidator`. The validator checks whether two instance sets can be joined along an entity and whether the join is safe; the code explicitly handles cases where one side is aggregated to the joining entity, and it uses semantic model join evaluators for non-aggregated paths. The original archive notes a `MAX_JOIN_HOPS` limit and fan-out validation; check current definitions before pinning exact numeric defaults in an implementation spec.

## Why this matters

A reliable metric query is not “let an LLM write SQL”. It requires a typed request, known metric and dimension definitions, join graph, aggregation grain, time semantics, filter typing, dataflow plan, fan-out checks and dialect-specific SQL rendering. A natural-language layer can help create a structured request, but deterministic validation should own the correctness boundaries.

## What MetricFlow does not solve

- Full business object identity and lifecycle.
- Operational actions and external writeback.
- Enterprise permissions or row/field policies on its own.
- Document/knowledge graph retrieval.
- Durable workflows.

## Adoption recommendation

**Learn from:** semantic request → dataflow plan → join validator → SQL plan → executor; `explain()` as an inspectable intermediate product; semantic join/fan-out logic.  
**Adapt:** connect ontology object relations/metrics to an equivalent typed query planner, but keep execution and data source adapters separate.  
**Avoid:** relying on generated SQL without proving join cardinality, aggregation grain and policy constraints.
