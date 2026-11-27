# Metrics and semantic layer

**Layer:** [04-query-and-metrics](README.md) · **What it is:** Governed metric definitions: grammar, time windows, safe joins and compilation to SQL.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Open-source implementations](#open-source-implementations) (4) · [Other companies and products](#other-companies-and-products) (7) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (4) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Lingyang, AgentOne and Alibaba

### 6. Quick BI and 智能小Q (conversational analytics)

> Source: [general-references/07-lingyang-agentone.md § 6. Quick BI and 智能小Q (conversational analytics)](../../general-references/07-lingyang-agentone.md#6-quick-bi-and-智能小q-conversational-analytics)

Plain English: a business user types "why did sales drop in Penang last week?" Quick BI picks a dataset, writes the query, shows the SQL, draws a chart and optionally explains it.

- Agents: since Aug or Sep 2025 marketed as a "super data analyst" made of 问数 (query), 解读 (interpretation) and 报告 (report) agents [Press, https://www.tmtpost.com/7705705.html; https://www.36kr.com/p/3483384622619523]. Metrics are computed on the fly. A "发现" (discovery) feature links the org chart, job duties and targets so it can push insights proactively [Press, Wang Sai talk].
- Singapore, May 2026: Quick BI described its stack as LLMs → AI-ready data layer → cognitive and memory layer → action execution layer. The point was that any agent calling Quick BI gets consistent metric definitions and permission boundaries. The motivating example: three agents gave three definitions of "sales revenue" [Vendor claim, https://www.alibabacloud.com/blog/603196].
- Dataset preparation (documented) [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/prepare-data]:
  - Dataset type: detail table, multi-metric periodic table, key-value table or other.
  - "Learning acceleration" maps dimension fields to tables and learns dimension values. When a dimension has more values than the learning cap, the dimension-value rewrite mode is auto or custom per dimension.
  - Automatic field-quality scoring (takes 1 to 2 minutes) with suggested edits.
  - Default aggregation per measure, used when the user does not specify one.
  - Guidance: put units in field names, avoid time-specific field names, create calculated fields for distinct counts.
  - Quick questions: up to 10 expert questions, and per-audience sets.
  - Q&A permission per user, with an expiry date.
- Knowledge [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/knowledge-base-configuration]:
  - Four rule types: (1) business logic (definition ≤100 characters, interpretation ≤300 characters in the enterprise knowledge base and ≤3,000 characters in the dataset knowledge base per prepare-data, synonyms, scope, optional forced rewrite); (2) regex (Python regex ≤100 characters); (3) dataset selection (keyword → up to 10 datasets); (4) smart table selection (an LLM prompt describing each table's facts, grain, period and relationships).
  - Dataset knowledge overrides enterprise knowledge.
  - Bulk import and export via xls or csv (≤5 MB).
  - No fuzzy matching.
- Answering [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/user-guide-for-smart-q-a]:
  - Clarification when the period or metric is missing or ambiguous.
  - Separate model choice for reasoning and for interpretation (built-in or custom).
  - "Smart planning" mode for multi-step, multi-turn questions.
  - Both the business-logic SQL and the executed SQL are shown.
  - Attribution only for a single date dimension on a line or metric chart. Forecasting needs at least 12 date points.
  - One follow-up per question. Like or dislike feedback. Trace_ID.
- Packaging [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/chat-bi-overview]: a paid add-on with per-member seats, in the advanced and professional editions only. 30 days of history. Embedding via "Ticket" enhanced embedding. Custom agents can be built in Dify or Bailian workflows and plugged in.
- Skill for external agents [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/quick-bi-open-skill-manual]: four tools (问数, 报表, 解读, 报告). 小Q报表 crawls a dashboard URL by browser automation and generates a dashboard-specific skill. Credentials: api_key, api_secret, user_token (which defines data scope) and server_domain (`https://bi.aliyun.com`). Files ≤5 MB.
- Recognition: Quick BI has been in the Gartner ABI Magic Quadrant for 7 consecutive years [Vendor claim, lingyang-overview]. The 2024 ChatBI did NL2SQL with fuzzy name matching, for example "小郑" → "郑强" [Press, aitntnews].

## Open-source implementations

### 4. MetricFlow: semantic models and metric-to-SQL compilation

> Source: [open-source-references/metricflow.md](../../open-source-references/metricflow.md) (code study)

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

### 5. Cube: data model and access policies

> Source: [open-source-references/cube.md](../../open-source-references/cube.md) (code study)

- Licence and activity: Apache-2.0 by default, MIT where a package header says so. Mostly TypeScript (about 279k lines) and Rust (about 445k, CubeStore and SQL API), last commit 2026-11-20. [Fact] ([LICENSE](https://github.com/cube-js/cube/blob/HEAD/LICENSE))
- Access policy schema (`CubeValidator.ts`):
  - `GroupPolicySchema` has `group` or `groups` (exactly one), `memberLevel{includes|excludes}`, `memberMasking{includes|excludes}` (which requires memberLevel), `rowLevel{filters | allowAll}` (exactly one of the two), and `conditions[{if: fn(securityContext)}]`.
  - The validator has a deliberate error message warning that an empty `memberLevel` grants every member.

  [Fact]
- Enforcement (`CompilerApi.applyRowLevelSecurity`):
  - The policies of the cube an instance belongs to apply to that instance alone.
  - A member path through joins that resolves to no cube instance is denied by pushing a `1 = 0` segment.
  - A cube accessed through a view skips member-level restrictions but keeps row-level filters ("views act as a security boundary", like Postgres views).
  - The per-cube constraints are AND-ed together; the multiple applicable policies within a cube are combined with OR.

  [Fact] ([CompilerApi.ts](https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-server-core/src/core/CompilerApi.ts))
- Verdict: **copy the design** of the policy object and the combination semantics. Running Cube itself is plausible, since it has a Postgres driver and its own SQL API, but it adds a second semantic layer next to your ontology. [Inference]

### 6. Malloy

> Source: [open-source-references/malloy.md](../../open-source-references/malloy.md) (code study)

- MIT, TypeScript (about 218k lines), version 0.0.439, last commit 2026-11-18. It has a Postgres dialect (`packages/malloy/src/dialect/postgres/`) and a stable query-interface package (`malloy-interfaces`, Thrift-defined). [Fact]
- Notable technique: `shifty_sum_distinct.ts` implements a "shifty sum". It is a symmetric aggregate: it sums a value over the distinct rows of a fanned-out join by shifting values into wide decimals keyed by row identity, so measures survive joins without double counting. [Fact] ([file](https://github.com/malloydata/malloy/blob/HEAD/packages/malloy/src/dialect/shifty_sum_distinct.ts))
- Verdict: **ignore as a dependency** (it is a whole language to teach). Copy the symmetric-aggregate idea if you ever allow joins that fan out instead of forbidding them as MetricFlow does. [Inference]

### Repository audit — dbt-labs/metricflow

> Source: [open-source-references/metricflow.md](../../open-source-references/metricflow.md) (repository audit)

**Role:** semantic metrics compiler and query-planning reference.  
**Repository:** [dbt-labs/metricflow](https://github.com/dbt-labs/metricflow), branch `main`.  
**Validation:** selected source inspected; no tests/build run.

#### Query pipeline

`MetricFlowEngine` creates an execution plan from a typed query request. Its `explain()` API returns the plan without running the warehouse query. When execution is requested, the engine executes the plan through an executor. The plan-conversion layer transforms a semantic dataflow plan into SQL plan nodes and then renders SQL for a target dialect.

`node_processor.py` handles node types such as time constraints, selectors, filters, joins and multi-hop join candidates. It uses a semantic-model lookup and `JoinDataflowOutputValidator`. The validator checks whether two instance sets can be joined along an entity and whether the join is safe; the code explicitly handles cases where one side is aggregated to the joining entity, and it uses semantic model join evaluators for non-aggregated paths. The original archive notes a `MAX_JOIN_HOPS` limit and fan-out validation; check current definitions before pinning exact numeric defaults in an implementation spec.

#### Why this matters

A reliable metric query is not “let an LLM write SQL”. It requires a typed request, known metric and dimension definitions, join graph, aggregation grain, time semantics, filter typing, dataflow plan, fan-out checks and dialect-specific SQL rendering. A natural-language layer can help create a structured request, but deterministic validation should own the correctness boundaries.

#### What MetricFlow does not solve

- Full business object identity and lifecycle.
- Operational actions and external writeback.
- Enterprise permissions or row/field policies on its own.
- Document/knowledge graph retrieval.
- Durable workflows.

#### Adoption recommendation

**Learn from:** semantic request → dataflow plan → join validator → SQL plan → executor; `explain()` as an inspectable intermediate product; semantic join/fan-out logic.  
**Adapt:** connect ontology object relations/metrics to an equivalent typed query planner, but keep execution and data source adapters separate.  
**Avoid:** relying on generated SQL without proving join cardinality, aggregation grain and policy constraints.

## Other companies and products

### 3. Databricks: metric views, Genie Agents, Genie Ontology

> Source: [general-references/11-context-layer-products.md § 3. Databricks: metric views, Genie Agents, Genie Ontology](../../general-references/11-context-layer-products.md#3-databricks-metric-views-genie-agents-genie-ontology)

**Metric views (Unity Catalog).** A YAML spec, version 1.1 ([Fact](https://docs.databricks.com/aws/en/uc-semantics/metric-views/yaml-reference)):
- Top level: `version`, `comment`, `source` (table, metric view or SQL), `parameters` (`name`, `data_type`, `default`), `filter` (a global boolean), `joins`, `fields` (alias `dimensions`), `measures` and `materialization`.
- Joins: `name`, `source`, `on` or `using`, `cardinality` (`many_to_one` by default, or `one_to_many`), nested `joins` for snowflake schemas, and a `rely.at_most_one_match` planner hint. The hint is not validated, and wrong use gives wrong measures.
- Fields and measures: `name`, `expr`, `comment`, `display_name` (up to 255 characters), `format`, and `synonyms` (up to 10, each up to 255 characters). Measures must contain an aggregate.
- Windows: `order`, `range` (current, cumulative, trailing/leading n units, all), `semiadditive` (first or last) and `offset`.
- Queried with `MEASURE()`.
- Materialization: aggregated or unaggregated materialized views with a schedule and a refresh policy. It is impossible when the source has row-level security, masks or ABAC, or when expressions use `current_user()`.
- Field and measure names must be unique across both lists, ignoring case.

**Genie Agents (formerly Genie Spaces).** The knowledge store ([Fact](https://docs.databricks.com/aws/en/genie-agents/tune-quality)):
- Table descriptions (default to the Unity Catalog descriptions).
- Per-column descriptions, synonyms and hide flags.
- "Format assistance" (representative values) and *entity matching*: string columns only, up to 120 columns, 1,024 distinct values per column, 127 characters per value. It is disabled for row-filtered or masked tables.
- Join relationships (many-to-one, one-to-many, one-to-one). Unity Catalog primary and foreign keys are saved as joins automatically.
- SQL expressions of three kinds, each with a name, code, synonyms and instructions: filters (booleans like "high-value orders"), measures, and fields.
- Example SQL, static or parameterised (`:param`, typed).
- *Trusted assets*: parameterised examples and Unity Catalog SQL functions. An answer produced through one is labelled a verified answer. Genie can call such a function but cannot see its SQL, and the caller needs EXECUTE.
- Text instructions, reserved for global context (fiscal calendar and similar).
- Limits: 100 instructions, where each example query, each function and the whole text block count as one; and 200 knowledge-store snippets.

**Genie Ontology** (announced 16 June 2026, GA 11 November 2026) ([Fact](https://www.databricks.com/en/blog/introducing-genie-one-genie-ontology-and-genie-agents), [Fact](https://databricks.com/blog/announcing-ga-genie-ontology)):
- *Learned knowledge* is auto-extracted "snippets" from metric views, dashboards, SQL query history (including queries from dbt and other external tools), notebooks, Genie Agents, and, in beta, external BI semantic models (Power BI now; Tableau and Sigma "coming soon").
- Snippet types: metric definitions, authoritative-source designations, business rules.
- Each snippet carries a description, source asset, author, domains, lineage and an authority score. Snippets cannot be edited directly: you fix the source or model the concept ([Fact](https://docs.databricks.com/aws/en/genie/genie-ontology)).
- *Modeled knowledge*: metric views, Unity Catalog domains and subdomains, Pages, certification and deprecation tags, and curated Genie Agents.
- *Authority*: "OntoRank", described as similar to PageRank, weighs source authority, certification, author expertise and closeness of collaboration, popularity and recency. Pages and certified assets win conflicts. When a conflict cannot be resolved, Genie asks the user.
- *Genie Search* indexes Google Drive, Jira, Confluence and Workday (SharePoint in beta). A Workday people directory weights knowledge from close collaborators.
- Pricing: curating snippets currently costs nothing. Genie has no seats and gives up to $10 of free usage per user per month ([Vendor claim](https://www.databricks.com/en/blog/introducing-genie-one-genie-ontology-and-genie-agents)).
- Benchmark: on a fictional energy-supplier task set, Genie passed 91% against 45% and 58% for anonymised agents ([Vendor claim](https://databricks.com/blog/announcing-ga-genie-ontology)).
- Limit: no customer-managed keys for snippets.

**Pages** ([Fact](https://docs.databricks.com/aws/en/uc-semantics/pages)):
- An authoritative definition of a term, entity or acronym.
- Fields: domain (required), owner, synonyms, description, rich body with `@` tags to assets, related assets, sources.
- Authoring: manual, a Genie Code draft from attached material, or bulk import from documents. Bulk import produces deduplicated drafts, with flags for conflicts, duplicates and low-confidence terms.
- Roles: consumer (view, comment, suggest), owner, Page manager (`MANAGE PAGES`) and curator (certify or deprecate through the `system.certification_status` tag). Permissions inherit from the domain.
- Published Pages are used by every Genie One conversation. Drafts are visible only to their owner.
- REST API for managing Pages as code. Audit events go to `system.access.audit`.

**Genie One MCP** (GA) ([Fact](https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp)):
- `https://<host>/ai-gateway/mcp-services/system.ai.genie_one_mcp?o=<ws>` over streamable HTTP.
- Tools: `genie_ask(question, conversation_id?, _meta.warehouse_id?)` returns `conversation_id`, `response_id` and `status`; `genie_poll_response`; `genie_get_query_result(item_id)`; `genie_cancel_response`; `view_ask`.
- Requires EXECUTE on securable type `mcp_service`. On-behalf-of OAuth with the `ai-gateway` scope is recommended.
- The old beta endpoint reaches end of life on 30 Nov 2026.

**Copy:** keep learned and modeled knowledge as two tiers, with authority scoring and "fix the source, not the snippet". **Avoid:** account-wide visibility for snippets from external sources.

### 4. Snowflake: semantic views, Autopilot, Cortex Analyst, Cortex Agents

> Source: [general-references/11-context-layer-products.md § 4. Snowflake: semantic views, Autopilot, Cortex Analyst, Cortex Agents](../../general-references/11-context-layer-products.md#4-snowflake-semantic-views-autopilot-cortex-analyst-cortex-agents)

**Semantic view DDL** ([Fact](https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view)). Clause order is fixed:

```
CREATE SEMANTIC VIEW sv
  TABLES (orders AS db.s.orders PRIMARY KEY (order_id) WITH SYNONYMS ('sales') COMMENT='...', customers AS ... PRIMARY KEY (id))
  RELATIONSHIPS (orders (customer_id) REFERENCES customers)
  FACTS (orders.net AS amount - discount)
  DIMENSIONS (customers.region AS region)
  METRICS (orders.revenue AS SUM(orders.net), revenue_per_cust AS orders.revenue / customers.cnt)
  AI_SQL_GENERATION '...' AI_QUESTION_CATEGORIZATION '...'
  AI_VERIFIED_QUERIES (q1 AS (QUESTION '...' VERIFIED_AT 1730000000 ONBOARDING_QUESTION TRUE SQL '...'))
```

(The example is mine; the clause names and options are from the reference.)

- *TABLES*: logical tables with `PRIMARY KEY`, `UNIQUE`, a preview `DISTINCT RANGE` constraint, synonyms, comment and tags.
- *RELATIONSHIPS*: a foreign key `REFERENCES` a primary or unique key. Supports `ASOF` (point-in-time) joins and preview `BETWEEN ... EXCLUSIVE` range joins. Without a key on the referenced side, the join is a direct many-to-many (public preview).
- *FACTS*: row-level expressions, which may be `PRIVATE`.
- *DIMENSIONS*: always public. A dimension can carry `WITH CORTEX SEARCH SERVICE` for fuzzy value lookup.
- *METRICS*: aggregate expressions, which may be private. Options: `USING (relationship)` to choose a join path, `NON ADDITIVE BY (dim)` for semi-additive metrics, window-function metrics with `PARTITION BY EXCLUDING`, and preview level-of-detail expressions (`FIXED`, `INCLUDE` or `EXCLUDE DIMENSIONS`). A metric without a table prefix is a derived metric.
- `LABELS = (FILTER)` marks a boolean fact or dimension as a filter.
- `MAX_STALENESS` (minimum 120 seconds) applies when materializations are used.
- `CREATE OR ALTER` and `DEFINE SEMANTIC VIEW` support declarative deployment.
- Privileges: CREATE SEMANTIC VIEW on the schema, and SELECT on every referenced table.
- Snowflake warns against putting regulated data in metadata fields.

**Semantic View Autopilot** ([Fact](https://docs.snowflake.com/en/user-guide/views-semantic/autopilot)):
- Inputs: query history (as visible to the creating role), question-and-SQL pairs (a two-column CSV), table and column comments, Tableau TWB/TWBX/TDS/TDSX, Power BI PBIX/PBIT (DAX measures, relationships, columns), existing YAML, and optional sample values.
- Outputs: logical tables, relationships, metrics, descriptions (extracted or AI-generated from names and sample values), keys inferred from metadata or distinct counts, verified queries from the examples, and suggested queries from history. Cortex Analyst then posts improvement suggestions for the user to accept.
- Guidance: fewer than 10 tables and at most 50 columns for a first view.

**Cortex Analyst** ([Fact](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst)):
- REST call with a `messages` array (roles `user` and `analyst`; content of type `text` or `sql`) plus a semantic model reference.
- Model preference order: Claude Sonnet 4.6, Sonnet 4.5, GPT-4.1, Arctic Text2SQL R1.5, then Mistral Large 2 with Llama 3.1 70b. It uses the highest model the role may access, and the user cannot choose.
- Billed per successful message. Each turn reprocesses the full history, so cost grows with conversation length.
- Role `SNOWFLAKE.CORTEX_ANALYST_USER`. Internal pipeline stages are not documented.

**Cortex Agents** ([Fact](https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents)):
- A schema-level agent object holds the model ("auto" recommended), tools, orchestration budget, and planning and response instructions.
- Tools: Cortex Analyst, Cortex Search, analytical search, a Python sandbox, charting, stored procedures and UDFs as custom tools, MCP connectors, skills and web search.
- Threads persist state. Runs go through `agent:run` with streamed events. A Snowflake-managed MCP server can invoke agents.
- Rate limit: 1,000 requests per minute per account (500 burst).
- If the caller lacks access to some tools, the run continues with the rest.

**Copy:** private facts and metrics (building blocks that agents cannot query directly), `USING` to pin a join path, and verified queries flagged as onboarding questions. **Avoid:** per-message pricing that grows with history, if you resell it.

### 10. dbt Semantic Layer / MetricFlow (v1.12 spec)

> Source: [general-references/11-context-layer-products.md § 10. dbt Semantic Layer / MetricFlow (v1.12 spec)](../../general-references/11-context-layer-products.md#10-dbt-semantic-layer--metricflow-v112-spec)

The semantic model is now declared inside the dbt model YAML ([Fact](https://docs.getdbt.com/docs/build/semantic-models)):
- `semantic_model: {enabled, name}` and `agg_time_dimension` (required).
- Columns carry `entity: {type: primary|foreign|unique|natural, name, description, expr}` or `dimension: {type: categorical|time, name}`, plus `granularity` for time dimensions.
- `derived_semantics` covers expression-based entities and dimensions.
- `metrics` of `type: simple` replace the old `measures`.
- `config.meta` and `group`.
- Dimensions are addressed through the primary entity (`user__full_name`).
- Entities are the join keys MetricFlow uses to build join paths.
- Ossie documents can replace the native YAML.

Metric types ([Fact](https://docs.getdbt.com/docs/build/metrics-overview)):
- *simple*: `agg` is one of sum, max, min, average, median, count_distinct, percentile, count or sum_boolean. Options: `expr`, `percentile` and `percentile_type`, `non_additive_dimension {name, window_agg, group_by}`, `join_to_timespine`, `fill_nulls_with`.
- *cumulative*: `input_metric`, `window` or `grain_to_date`, `period_agg`. Needs a time spine.
- *derived*: `expr` and `input_metrics`, with `offset_window` or `offset_to_grain`.
- *ratio*: `numerator` and `denominator`, with filters.
- *conversion*: `entity`, `calculation`, `base_metric`, `conversion_metric`, `window`, `constant_properties`.
- Every metric type accepts `filter`, written in Jinja as `{{ Dimension('order__value') }} > 100`.

MCP tools: `list_metrics`, `get_dimensions`, `get_entities`, `get_dimension_values`, `query_metrics`, `get_metrics_compiled_sql`, `list_saved_queries`, plus discovery tools such as `get_lineage` and `get_model_health` ([Fact](https://github.com/dbt-labs/dbt-mcp)). The remote MCP limit is 5,000 requests per minute per IP. The tools available depend on the plan ([Fact](https://docs.getdbt.com/docs/dbt-ai/about-mcp)).

**Copy:** entity-typed join keys (primary, unique, foreign, natural) and the five metric types, especially conversion and cumulative. **Avoid:** making the agent call `get_dimensions` per metric in a chatty loop. Return the metric, its dimensions and sample values in one payload. [Inference]

### 11. Cube

> Source: [general-references/11-context-layer-products.md § 11. Cube](../../general-references/11-context-layer-products.md#11-cube)

- Data model: cubes (usually one per table, `sql_table`), measures (count, sum, number-from-other-measures, with `filters` and `format`), dimensions, plus views, joins, segments, pre-aggregations, hierarchies and folders ([Fact](https://cube.dev/docs/product/data-modeling/overview); only the basics were read).
- **Access policies** ([Fact](https://docs.cube.dev/reference/data-modeling/data-access-policies.md)):
  - On each cube or view: `access_policy` entries with `group` or `groups` (`"*"` for everyone), `conditions` (`if:` expressions over `userAttributes` or `securityContext`), `member_level` (`includes` / `excludes`), `member_masking`, and `row_level.filters` (`member`, `operator`, `values`, which may interpolate `{ userAttributes.state }`).
  - Once any group-specific policy exists, groups without a matching policy get no access at all.
  - Members granted by a policy are masked outside that policy's row filter.
- **AI API** (May 2024, since evolved into the D3 agentic platform): `POST /cubejs-api/v1/ai/query/completions` returns a *Cube semantic query*, not SQL, which Cube compiles. The argument is that a constrained output reduces hallucination ([Vendor claim](https://cube.dev/blog/a-practical-guide-to-getting-started-with-cubes-ai-api)).

**Copy:** declarative row, column and mask policies keyed on user attributes and stored alongside the model; and making agents emit semantic queries rather than SQL. **Avoid:** per-cube policy sprawl with no central viewer. Cube ships a separate policies viewer, which suggests this is a real pain point. [Inference]

### 12. AtScale, Malloy, Kyligence

> Source: [general-references/11-context-layer-products.md § 12. AtScale, Malloy, Kyligence](../../general-references/11-context-layer-products.md#12-atscale-malloy-kyligence)

- **AtScale.** SML, an open-source semantic modeling language, was released 10 Sep 2024. AtScale joined OSI in January 2026. Its strength is multidimensional (MDX, OLAP) semantics and migration from SSAS and Cognos ([Vendor claim](https://www.businesswire.com/news/home/20260127372541/en/AtScale-Joins-the-Open-Semantic-Interchange-OSI-Bringing-over-a-Decade-of-Semantic-Layer-Expertise-to-support-Open-Standards)). MCP status was not verified. [Unverified]
- **Malloy.** An open-source semantic modeling and query language that compiles to SQL on BigQuery, Postgres and DuckDB, and calls itself "a work in progress" ([Fact](https://docs.malloydata.dev/documentation/)). Core constructs: `source`, `dimension`, `measure`, `join_one` / `join_many` with symmetric aggregates, `view`, `run`; MCP and Publisher appear in the docs navigation. [Unverified this session.] *Copy:* symmetric aggregates (the same no-double-count goal as BigQuery measures and Ossie `AGG`).
- **Kyligence.** Kyligence Zen is a metrics store and catalog with an AI copilot, built on Apache Kylin OLAP. GA was announced in 2023 per press coverage titles. [Unverified]

### 16. Comparison matrix

> Source: [general-references/11-context-layer-products.md § 16. Comparison matrix](../../general-references/11-context-layer-products.md#16-comparison-matrix)

Legend: Y = first-class typed object; T = free text only; P = partial or preview; – = absent.

| Product | Objects | Links | Metrics | Rules | Actions | Permissions | Memory | Cold start | Who operates | Smallest realistic adopter [Inference] |
|---|---|---|---|---|---|---|---|---|---|---|
| Fabric IQ ontology (+ operations agent) | Y (entity types, inheritance) | Y | P (DAX only) | T (ops agent: Y conditions) | P (ops agent, Teams approval) | Y (delegated, source RLS/OLS/CLS) | – | Generate from Power BI models; agent samples rows | BI/Fabric admin | ~200 staff already on Fabric F2+ and Power BI |
| Databricks metric views + Genie | P (tables, Pages) | Y (joins) | Y | P (snippets, text) | P (Genie One actions) | Y (Unity Catalog inherited) | P (learned snippets) | Mines query history, dashboards, notebooks, Power BI | Data team plus curators | ~300 staff with a Databricks lakehouse |
| Snowflake semantic views + Cortex | P (logical tables) | Y (incl. ASOF, range) | Y (semi-additive, window, LOD) | T (custom instructions) | P (agent custom tools) | Y (RBAC, private members) | P (threads) | Autopilot: history, Tableau, PBIX, YAML | Data engineer | ~200 staff on Snowflake |
| Apache Ossie | Y (datasets; ontology concepts) | Y (n-ary roles) | Y | Y (`requires` / `derived_by` expressions) | – | – | – | n/a (format) | Whoever authors | Any |
| Google Knowledge Catalog + BigQuery Graph + Looker | P (entries, concepts) | Y (graph edges, LookML joins) | Y (measures, LookML) | T (instructions, learnings) | – | Y (IAM, LookML grants) | P (learnings from traces) | Query logs, data insights, interaction traces, document mining | Data steward | ~300 staff on BigQuery/Looker |
| OpenAI Frontier / internal agent | P | P | T (canonical definitions in docs) | T | Y (agent execution) | Y (agent identity; pass-through) | Y (global/personal) | Usage, lineage, code crawl, Slack/Docs | Platform team (FDE-assisted) | Large enterprise (limited availability) |
| Salesforce Tableau Semantics + ACE + Agent Script | Y (data objects, resolved customer) | Y | Y | Y (Agent Script deterministic logic) | Y (Flow/Apex actions) | Y (OLS/FLS/sharing) | Y (ACE, preview) | Data 360 identity resolution; defined per job | Salesforce admin | ~200 staff on Salesforce plus Data 360 |
| Workday Data Cloud | Y (240+ objects) | P | Y (prebuilt models) | P | P (Gateway) | Y (contextual security) | – | Prebuilt from the Workday schema | Workday admin | Any Workday tenant |
| dbt MetricFlow | P (semantic models, entities) | Y (entity joins) | Y (5 types) | – | – | P (warehouse) | – | Hand-authored YAML | Analytics engineer | ~50 staff with dbt |
| Cube | Y (cubes, views) | Y | Y | – | – | Y (access policies) | – | Hand-authored, with AI assist [Unverified] | Data engineer | ~30 staff |
| Glean | P (people, documents) | P (graph) | – | – | Y (actions, agents) | Y (indexed ACLs, agent identity) | P [Unverified] | Connector crawl | IT | ~100 staff |
| Neo4j GraphRAG | Y (node types) | Y (patterns) | – | P (constraints) | – | P (database RBAC) | – | LLM extraction from text | Developer | Any (open source) |
| Cognite / C3 / RelationalAI / Stardog | Y | Y | P | Y (reasoning; constraints) [Unverified] | P | P | – | Industry templates [Unverified] | Vendor and integrator | Large enterprise |

### 17. What none of them does

> Source: [general-references/11-context-layer-products.md § 17. What none of them does](../../general-references/11-context-layer-products.md#17-what-none-of-them-does)

[Inference, from the gaps documented above]

1. **None makes actions typed members of the ontology.** No product has an "action type" with parameters, preconditions over object properties, the permission required, approval policy and side effects. Actions live in separate agent products (Fabric operations agent, Agentforce Flow/Apex, Workday Gateway) and are not part of the business model.
2. **None evaluates its rules.** Fabric is explicit that rules are descriptive. Snowflake and Databricks hold only text instructions. Only Ossie has evaluable `requires` and `derived_by` expressions, and no engine in this set executes them as guards on agent actions.
3. **None stores decision traces as linked, queryable records tied to object instances, rule versions and approvers.** ACE memory comes closest and is in preview.
4. **None cold-starts from operational SaaS apps for a company with no warehouse, no BI model and no query history.** Every cold-start method mines analytics artefacts.
5. **None serves internal and external (customer-facing) agents from the same model with different exposure policies.** Salesforce comes closest through Agentforce.
6. **None is model-agnostic, platform-agnostic and sized for 100 to 1,000 staff.** Each requires its own capacity, warehouse or CRM tier.
7. **None exports the whole model** (objects, metrics, rules, actions, permissions) in one portable format. Ossie covers objects, metrics and constraints, but has no actions or permissions.

## Design decisions already in the reference maps

### 1. Answering questions about numbers: semantic layer first, text-to-SQL as a guarded fallback

> Source: [general-references/32-map-research-and-cost.md § 1. Answering questions about numbers: semantic layer first, text-to-SQL as a guarded fallback](../../general-references/32-map-research-and-cost.md#1-answering-questions-about-numbers-semantic-layer-first-text-to-sql-as-a-guarded-fallback)

**Purpose.** Every number an agent states should come from a governed metric definition compiled to SQL. The model must not write SQL from scratch against raw tables. Example: "What is our DSO for the Northern region this quarter?" resolves to `query_metric(metric="dso", dimensions=["region"], filters={region:"Northern"}, period="FY2026Q4")`. Postgres computes the figure.

**Design to implement.**
- *Metric catalogue table* (part of the company model): `metric(id, name, description, measure_expression, base_object_type, allowed_dimensions[], default_filters, time_grain_default, fiscal_calendar_id, currency_rule, owner, status: draft|certified, version)`. Receivables examples: `ar_balance`, `overdue_amount`, `dso`, `collected_amount`, `promise_to_pay_kept_rate`.
- *Query plan* emitted by the model as structured output: `{metric_ids[], dimensions[], filters[{field, op, value}], period, grain, limit}`.
- *Deterministic compiler* (TypeScript): plan → parameterised SQL over views generated from the company model. It runs under the caller's Postgres role so RLS applies, and returns a result table capped at about 1k–2k tokens, plus a trace `{plan, sql_hash, row_count, data_version}`.
- *Typed refusal*: if a metric, dimension or join path is not in the catalogue, return `{error:"out_of_scope", missing:[...], nearest_metrics:[...]}` as a tool error. Never produce a guessed number.
- *Conventions card*: about 4 KB of markdown per data domain, generated from the catalogue and kept in the cached prompt prefix. It holds measure definitions, fiscal calendar, currency, what "overdue" means (due date vs grace period) and disambiguation rules.
- *Echo defaults* in every answer ("Using invoice due date, fiscal Q4 = Oct–Dec, MYR").
- *Fallback (version 1, behind a flag)*: a SQL-writing sub-agent that may query only the documented views. Its query goes through the check in section 2 and is shown to the user.
- *Certified example queries* mined from logs and from finance staff, retrieved as few-shot examples.

**Evidence, with the source for each figure.**
- GPT-4 zero-shot over SQL scored 16.7%, against 54.2% over an OWL ontology with R2RML mappings. On high-schema-complexity questions it scored 0%, against 35.7–38.5% (Sequeda, Allemang, Jacob 2023, arXiv 2311.07509; document 09, section 6; document 10, section 7).
- dbt Labs' 2026 rerun on the ACME insurance data: Semantic Layer 98.2–100% against 84.1–90.0% for text-to-SQL on modelled data. On the raw schema, 60.5%→72.7% against 32.7%→64.5% [Vendor claim] (dbt blog, 7 Apr 2026; document 09, section 6).
- A 4 KB hand-written semantics document added 17–23 points (from 45.5–50.5% to 67.7–68.7%), p<0.01, across Claude Opus 4.7, Sonnet 4.6 and GPT-5.4 (Rumiantsau & Fokeev, arXiv 2604.25149; document 09, section 6).
- LinkedIn SQL Bot: 9% of answers rated 4 or higher with schemas alone, against 48–53% with the full metadata system. Example queries and table clustering gave most of the gain. Filter-value errors were the top failure at 24% (arXiv 2507.14372; document 09, section 6).
- Spider 2.0: o1-preview scored 21.3% on enterprise schemas, against 91.2% on Spider 1.0 (arXiv 2411.07763; documents 09 and 10).
- AMBROSIA: ambiguity persists even when the schema is in hand (arXiv 2406.19073; document 10, section 3).
- Cost: in the worked model, this design (design C) is 9.5x cheaper than a routed design in which the model reads the numbers [Estimate] (document 13, section 5).

**Copies.**
- Document 09, "What to copy" items 5, 7, 8: metric API with typed refusal; conventions card; query-log mining. https://docs.getdbt.com/blog/semantic-layer-vs-text-to-sql-2026 ; https://arxiv.org/abs/2604.25149 ; https://arxiv.org/html/2507.14372v1
- Document 09, section 1 (Gruber, Guarino): one canonical declarative model compiled to SQL views, tool schemas and prompt cards. https://tomgruber.org/writing/ontolingua-kaj-1993/ ; https://www.loa.istc.cnr.it/wp-content/uploads/2020/03/FOIS98.pdf
- Document 09, section 1 (OWL 2 profiles): keep expressivity QL-like (class hierarchy, typed links, domain and range; no transitive closure or cardinality inference in the query path) so queries rewrite to SQL. https://www.w3.org/TR/owl2-profiles/
- Document 10, section 9: `query_metric(...)` compiled deterministically, the way data.world compiles SPARQL to SQL. https://arxiv.org/html/2311.07509
- Document 13, "What to copy" item 1: a result table capped at 1k–2k tokens.

**Left out, and why.**
- Cypher or SPARQL generation as the main path. The best corporate score at TEXT2SPARQL'25 was 0.447 (document 09, section 6).
- Fine-tuned SQL models: the founder uses third-party models only.
- RDF storage. The gains come from the semantic context, not the RDF format (document 09, section 1).
- Benchmark-leaderboard agents (Spider 2.0-Snow 96.7, BIRD 83.40). They are tuned to the benchmark and do not transfer (document 09, "What cannot be copied").

**Open questions.**
- dbt's study put the full schema in context, which is unrealistic at scale (document 09).
- No study tested Qwen on these benchmarks. All the semantic-layer figures are for GPT or Claude.
- How many receivables metrics are needed before the refusal rate becomes acceptable? Unknown; measure it with competency questions (section 4).

### 3. Metric grammar and naming (Dataphin)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 3. Metric grammar and naming (Dataphin)](../../general-references/31-map-lingyang-alibaba-offers.md#3-metric-grammar-and-naming-dataphin)

**Purpose.** Make every number agents and reports use a governed object built from four parts, so there is exactly one meaning for "overdue amount this month by collector". Receivables example: `overdue_amt_mtd_over30_by_collector` is overdue amount (atomic), month to date (period), more than 30 days past due (qualification), by collector (granularity).

**Design to implement.**
- Derived metric = atomic metric + business qualification + statistical period + granularity [Fact, 07 KF 6, §5].
- **Atomic metric**, fields and limits from Dataphin [Fact, 07 §5]:
  - business entity and subject domain;
  - English name: letters, digits and `_`, at most 64 characters, with suggestions from a word-root list;
  - display name at most 128 characters;
  - unit from an enum: currency, time, ratio, rank, count noun, weight, other;
  - data type;
  - definition text (口径) at most 1,000 characters;
  - description;
  - timeliness: day, hour or minute (version 1: day only [Inference]);
  - source main table, which must be a dimension or fact table (here: an entity type or event set);
  - statistical-period identifier field, allowed on snapshot facts and dimensions but not on event facts;
  - calculation expression, e.g. `sum(open_amount)` or `count(distinct invoice_id)`;
  - additive flag (distinct counts are not additive).
- **Derived atomic metric**: an expression over atomic metrics, e.g. C = A/B [Fact, 07 §5]. DSO is one: receivables over sales times days [Inference for the formula; the documents do not define DSO].
- **Business qualification** [Fact, 07 §5]:
  - basic: a predicate over the source table's fields, e.g. `days_past_due > 30`;
  - composite: a boolean tree over already-submitted qualifications, with match or not-match plus AND/OR and nested groups;
  - must reference the same source main table;
  - no time condition inside a qualification (time belongs to the period);
  - a "preview SQL" button.
- **Granularity**: up to 3 object dimensions [Fact, 07 §5]. Receivables dimensions: customer, collector, legal entity, currency, region [Inference].
- **Derived metric wizard rules** [Fact, 07 §5]:
  - choose up to 3 periods, one atomic metric and qualifications, all with the same timeliness, and up to 3 granularity dimensions;
  - the wizard pre-generates the combinations;
  - default name `<atomic>_<period-abbr>_<qualification>`, starting with a letter, at most 100 characters, unique within its summary table;
  - set ops owner and business owner (batch settable) and description;
  - upstream dependencies are generated by the system and cannot be edited;
  - publish is required in dev/prod mode.
- **Summary table**: exactly one granularity; the primary key is the granularity combination and every other column is a metric; derived metrics with the same period and granularity share one summary table [Fact, 07 §5]. Name pattern `dws_<grain>_<period>`, from Dataphin's prefixes `dim_`, `fct_`, `dws_` and suffixes `_di`, `_df` [Fact, 07 §5].
- **Additive flag enforcement** [Inference from 07 What to copy 3]: when a query rolls a non-additive metric up to a coarser grain, the planner refuses and recomputes from the atomic level instead.
- **Registered existing metric**: attach a column already computed in the customer's system to the governed grain by mapping the grain key to source fields [Fact, 07 §5]. Use for an ageing figure the accounting system already produces.
- **Version 1 metric set**: about a dozen, per 25 row 6: overdue amount, ageing buckets, DSO, collected this period, promise-kept rate [Fact as a list, 25 C6 row 6; Inference for the rest].
- Storage [Inference]: `metric_atomic`, `metric_qualification`, `metric_period`, `metric_derived` as `model_definition` kinds, each version immutable once published.

**Copies.**
- 07, §5 Dataphin logical objects: atomic, derived atomic, qualification, derived metric, summary table, registered metric, naming prefixes. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/creating-atomic-metrics ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-business-qualification ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-derived-metrics ; https://help.aliyun.com/zh/dataphin/user-guide/specification-modeling-overview ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/new-registration-indicator ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-data-panel
- 25, C6 row 6: the version-1 metric list.

**Left out, and why.**
- Hour and minute timeliness: collections runs on a daily cadence (25 row 3 says nightly refresh is enough at first).
- Dataphin's conditional-schedule rules (up to 10, first match wins) [Fact, 07 §5]: no warehouse scheduling in this product.
- Word-root dictionaries from data standards: version 1 ships a fixed name list [Inference].

**Open questions.**
- Metric versioning beyond dev/prod publishing: Dataphin does not document a version history for 口径 and expression [Unverified, 07 Open questions]. This product needs one for citations, so it must be designed without a source [Inference].
- The DSO formula variant (count-back or simple) should come from each customer's finance head.

### 4. Time-window language (Dataphin period expressions)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 4. Time-window language (Dataphin period expressions)](../../general-references/31-map-lingyang-alibaba-offers.md#4-time-window-language-dataphin-period-expressions)

**Purpose.** Name every time window once and evaluate it in code, because "last 7 days", "month to date" and fiscal periods are where agent answers most often go wrong. Receivables example: "collected this fiscal quarter" for a company whose fiscal year starts 1 April resolves to fixed dates through `CustomBeginDate`, not through the model's guess.

**Design to implement.**
- Period record fields, from Dataphin [Fact, 07 §5]: name (≤64), abbreviation (≤64), grain (day, hour, minute; version 1 day only), calendar (regular or fiscal; fiscal only for day grain), start and end as expressions.
- Function set, copied from Dataphin's appendix [Fact, 07 §5]:
  - `lastNDate(date, N)`;
  - `cBeginDate(date, 'w|m|q|y', [len])` and `cEndDate(...)` for natural periods;
  - `tdBeginDate(date, 'm|q|y')` for to-date periods;
  - `CustomBeginDate/CustomEndDate(date, 'm|q|y', shift)` for fiscal periods, e.g. fiscal year start `'0401'`;
  - hour and minute variants exist (`lastNHour`, `lastNMinute`, `dthBeginDatetime`, `dtmiBeginDatetime`), but are left for version 2.
- Anchor variable `${bizdate}`, the business date of the run [Fact, 07 §5]. Examples: last 7 days = `lastNDate('${bizdate}',7)` to `${bizdate}`; month to date = `tdBeginDate('${bizdate}','m')` to `${bizdate}`.
- Rules [Fact, 07 §5]: no two periods may share the same start and end; only admins create periods; a default set is generated when the tenant is set up.
- The same functions are reused in quality rules and partition expressions [Fact, 07 §5]. Here: in quality rules (section 6) and in dunning rules ("due date plus 10 days").
- Implementation [Inference]: a small parser in TypeScript that evaluates an expression to a `[start, end]` date pair for a given `bizdate` and tenant calendar, then binds the dates as SQL parameters. Unknown functions or malformed arguments fail at publish. The tenant record holds its time zone and fiscal-year start.
- The period's resolved dates are returned with every answer (section 11), so a user sees "1 Oct to 21 Nov 2026".
- Event facts cannot carry the period identifier field; snapshots can [Fact, 07 §5]. Receivables mapping [Inference]: the daily open-invoice snapshot is a snapshot fact (`_df`); payments received are event facts (`_di`).

**Copies.**
- 07, §5 Statistical period and period expression language. https://help.aliyun.com/en/dataphin/fullmanaged/user-guide/new-statistical-cycle ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/appendix-statistical-period-expression-parameters
- 07, What to copy 4: a small closed DSL.

**Left out, and why.** Hour and minute periods, for the cadence reason in section 3.

**Open questions.** Whether customers with 4-4-5 or other non-calendar fiscal months exist in the target segment. Dataphin's fiscal shift handles only a shifted start date [Inference].

### 11. Metric compilation and safe-join rules

> Source: [general-references/33-map-context-code-integration.md § 11. Metric compilation and safe-join rules](../../general-references/33-map-context-code-integration.md#11-metric-compilation-and-safe-join-rules)

**Purpose.** Agents ask for metrics by name; the product writes correct SQL, never double-counts across joins, and applies permissions. Receivables example: "overdue balance by collector for the last 90 days" compiles to SQL that joins invoices to customers (many-to-one, safe) and never joins invoices to payments in a way that repeats invoice amounts.

**Design to implement.**
- Decision: **write a small compiler in TypeScript** that copies MetricFlow's rules, because the data lives in the product's own Postgres (normalised receivables tables), not in a customer warehouse. Document 14's verdict is to adopt the MetricFlow sidecar only when metrics must compile over a customer's warehouse; otherwise copy the design [Inference, document 14].
- Agents never emit SQL. They emit a semantic request: `{metrics[], groupBy[], where[] (JSON condition IR), orderBy[], limit, timeRange}` (MetricFlow sidecar parameters [Fact]; Cube semantic query [Vendor claim]).
- Pipeline (MetricFlow dataflow plan [Fact]): read source → filter elements → join to base (only allowed joins) → join to time spine (cumulative or `joinToTimespine`) → where filter → aggregate simple metric inputs → compute metrics (ratio, derived) → semi-additive join for `nonAdditiveDimension` → order/limit → render Postgres SQL.
- Join safety (MetricFlow `_VALID_ENTITY_JOINS` [Fact]): allowed — primary → {natural, primary, unique}; unique → {natural, primary, unique}; foreign → {natural, primary, unique}; natural → {primary, unique}. Any join landing on a foreign entity is invalid; natural → natural is invalid. `MAX_JOIN_HOPS = 2`.
- Composition: model-scoped metrics compose object metrics only through `AGG(object.metric)` (Ossie [Fact]); measures are locked to the key grain of their object, so `AGG()` over joins never double-counts (BigQuery Graph measures [Fact]).
- `using(link)` pins the join path when two exist (Snowflake [Fact]); without it, ambiguous paths are an error, not a guess [Inference].
- Semi-additive metrics: balances such as `ar_balance` use `nonAdditiveDimension {name: snapshot_date, windowAgg: last}` (MetricFlow/dbt [Fact]; Snowflake `NON ADDITIVE BY` [Fact]).
- Permissions: the section 3 predicates are folded in at the "read source" node, before aggregation; any path that resolves to no permitted object yields `1 = 0` (Cube [Fact]).
- Private metrics and properties are usable as inputs but not requestable (Snowflake [Fact]).
- Execution: run under the request transaction with `SET LOCAL app.org_id` (section 3); return rows plus the compiled SQL for audit and evaluation (dbt `get_metrics_compiled_sql` [Fact]).
- Version 1 metric types [Inference]: simple, ratio, derived, plus `nonAdditiveDimension`. Version 2: cumulative (needs a time spine), conversion (e.g., reminder → payment within N days), symmetric aggregates if fan-out joins are ever allowed (Malloy "shifty sum" [Fact]).
- Fallback: if the hand-written compiler stalls, spawn the MetricFlow sidecar (Apache-2.0, NDJSON `explain` over stdin/stdout, Postgres renderer exists, parameters `manifest_path`, `metric_names`, `group_by_names`, `where_constraints`, `order_by_names`, `limit`, `sql_engine`) and execute the returned SQL under your own filters [Fact for the protocol].

**Copies.**
- Document 14, section 4 and "What to copy" 13. https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py ; https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow/dataflow/builder/dataflow_plan_builder.py ; https://github.com/dbt-labs/metricflow/blob/HEAD/sidecar/mf_ipc_protocol.py ; https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantic_interfaces/protocols/metric.py
- Document 11, section 6 and "What to copy" 6: key-grain measures. https://docs.cloud.google.com/bigquery/docs/graph-measures
- Document 11, section 4: `USING`, `NON ADDITIVE BY`, `PRIVATE`. https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view
- Document 11, section 11: Cube semantic-query output. https://cube.dev/blog/a-practical-guide-to-getting-started-with-cubes-ai-api
- Document 14, section 6: Malloy symmetric aggregates (version 2). https://github.com/malloydata/malloy/blob/HEAD/packages/malloy/src/dialect/shifty_sum_distinct.ts

**Left out, and why.** Running Cube itself (a second semantic layer beside the ontology [Inference]). Malloy as a dependency (a whole language). Databricks `rely.at_most_one_match` hint (not validated; wrong use gives wrong measures [Fact]). Materialised metric views (Databricks: impossible with row-level security [Fact]; at this data size, [Inference] not needed).

**Open questions.** Whether MetricFlow's relicensing to Apache-2.0 is settled (document 14 unverified). Whether two hops are enough for receivables (Invoice → Customer → Collector is two hops; Allocation → Payment → Customer → Collector is three) [Inference: model `collector_id` on Customer and keep the limit].

## Earlier engineering notes (Phase 2)

### Phase 2 research — semantic metrics and business meaning

> Source: former `05-semantic-and-metrics-engine/phase2-metric-contracts.md` (moved here in the Nov 2026 restructure)

**Research date:** 27 November 2026  
**Evidence:** Dataphin and Quick BI official help documentation, read as public product contracts. Vendor implementation internals were not inspected.

#### 1. Dataphin's metric grammar is more structured than a named SQL expression

Dataphin separates a business data model from statistical metrics. Its documented concepts include business entities, business activities, logical dimension tables and logical fact tables. Metric primitives include:

- **Atomic metric:** statistical scope and calculation algorithm, such as payment amount.
- **Business filter:** business scope predicate, analogous to SQL WHERE but separate from the time interval.
- **Statistical period:** time window for the measurement, e.g. last day or last 30 days.
- **Statistic granularity:** entity/dimensions used to group the measure, analogous to GROUP BY.
- **Statistical timeliness:** how frequently derived metrics are computed.
- **Derived metric:** combines the atomic metric, business filter, statistical period and one or more dimensions.

Dataphin's documented expression is:

`DerivedMetric = AtomicMetric + BusinessFilter + StatisticalPeriod + StatisticGranularity`

The derived metric belongs to a logical aggregate table; physical tables are created in the compute engine and materialized tables hold the actual data.

Sources:
- https://help.aliyun.com/en/dataphin/fullmanaged/getting-started/the-statistical-index
- https://help.aliyun.com/en/dataphin/fullmanaged/product-overview/logical-structure-that
- https://help.aliyun.com/en/dataphin/semimanaged-v4/product-overview/logical-structure-that

#### 2. Why this matters to our ontology

A metric is not merely `SUM(invoice.amount)`. The number has a declared business scope and valid grain.

For example, "overdue receivables" requires explicit decisions:
- Which invoice statuses count?
- Is the due-date cut-off inclusive?
- Is the as-of date in tenant-local time?
- Are disputed invoices included?
- Are credit notes/netting included?
- Is amount gross, net of payments, or allocated cash basis?
- Is the measure in document currency or reporting currency?
- Is aggregation valid by customer, entity, office, matter or collector?
- How fresh is the underlying payment/allocation data?

If these are not modelled, an agent can produce plausible but inconsistent answers despite retrieving the correct rows.

#### 3. Quick BI Q-Data shows a separate intent-to-dataset routing layer

Quick BI's Question-based Knowledge Management documents:
- business logic rules;
- regular-expression matching;
- dataset selection;
- AI-assisted table selection;
- business definitions and synonyms linked to specific datasets.

A dataset-selection rule maps a business definition and synonyms to up to ten datasets. It acts as controlled question-to-data routing, rather than leaving the model to guess which table might contain an answer. The documentation says the feature was available in Hong Kong, Kuala Lumpur and Singapore regions in the page last updated 23 June 2026; availability should be rechecked before depending on it.

Sources:
- https://help.aliyun.com/en/quick-bi/user-guide/knowledge-base-configuration
- https://help.aliyun.com/en/quick-bi/user-guide/knowledge-base-configuration (page updated 23 June 2026)

This layer complements, but does not replace, authorization or typed metric validation. A synonym or business phrase can help pick a candidate dataset; the server must still verify that the user can access it and that the resulting metric is semantically valid.

#### 4. Proposed MetricDefinition contract

A published metric should include:

| Field | Purpose |
|---|---|
| `api_name`, `version`, `display_name`, `description` | Stable identity and human/agent vocabulary |
| `base_measure` | Source property or deterministic expression |
| `aggregation` | sum, count, distinct count, min, max, ratio, custom validated expression |
| `base_grain` | One row per what? invoice, payment, transaction, matter, event |
| `dimensions_allowed` | Valid grouping dimensions and relationship paths |
| `business_predicate` | Versioned typed filter, distinct from time range |
| `time_semantics` | Event/posted/due/created time, timezone and period expression |
| `unit_currency` | Unit, currency and conversion policy |
| `freshness_sla` | Latest data time expected; stale behaviour |
| `null_and_missing_policy` | Whether missing values are zero, unknown or excluded |
| `source_lineage` | Source systems, model and transformation versions |
| `owner_approver`, `status` | Governance and publication lifecycle |
| `synonyms_examples` | Natural language resolution hints; not execution authority |

The query planner must reject a dimension/relationship combination that changes the metric's grain without an explicit, reviewed aggregation rule.

#### 5. Metric evaluation and release

Each metric should have golden examples and reconciliation tests:
- known source rows → exact expected metric value;
- same metric by multiple dimensions → aggregation invariants;
- currency and timezone boundary cases;
- as-of date and late-arriving update cases;
- business filter version change → explicit metric version change;
- materialized metric vs live computation → explainable discrepancy and freshness label.

Metric changes are governed artefacts and should be released with the ontology/model version, not edited as undocumented prompt instructions.

#### 6. Research boundary

Dataphin/Quick BI public documentation provides evidence about metric modelling and question-to-dataset configuration. It does not prove that their hosted systems use Palantir-like object action transactions or expose the same ontology runtime. Keep these product comparisons at the capability boundary.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Join-safety rule — copy verbatim (code)** from [`dbt-labs/metricflow` → `metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py`](https://github.com/dbt-labs/metricflow/blob/013590e/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py): `MAX_JOIN_HOPS = 2`; valid entity joins are primary→{natural, primary, unique}, unique→{natural, primary, unique}, foreign→{natural, primary, unique}, natural→{primary, unique}. Anything that lands on a foreign entity, and natural→natural, is invalid (fan-out).
- **Metric types (code):** `simple`, `ratio`, `cumulative`, `derived`, `conversion` — [`dbt-labs/metricflow` → `metricflow_semantic_interfaces/type_enums/metric_type.py`](https://github.com/dbt-labs/metricflow/blob/013590e/metricflow_semantic_interfaces/type_enums/metric_type.py).
- **Compile-only sidecar (code):** [`dbt-labs/metricflow` → `sidecar/mf_ipc_protocol.py`](https://github.com/dbt-labs/metricflow/blob/013590e/sidecar/mf_ipc_protocol.py) — NDJSON "mf-ipc" protocol version 1; ready message reports `metricflow_version`; `explain` params `manifest_path`, `metric_names`, `group_by_names`, `where_constraints`, `order_by_names`, `limit`. Spawn from Node, generate the manifest from our own metric definitions, execute the returned SQL under our own permission filters.
- **Metric access policy (code):** [`cube-js/cube` → `packages/cubejs-schema-compiler/src/compiler/CubeValidator.ts`](https://github.com/cube-js/cube/blob/47c6d3b/packages/cubejs-schema-compiler/src/compiler/CubeValidator.ts) — `memberLevel` (includes/excludes), `memberMasking` (requires memberLevel), `rowLevel` (exactly one of `filters` / `allowAll`), `conditions`. The validator now warns explicitly that an empty `memberLevel` grants every member. Unattributable member paths are denied by injecting `1 = 0` ([`cube-js/cube` → `packages/cubejs-server-core/src/core/CompilerApi.ts`](https://github.com/cube-js/cube/blob/47c6d3b/packages/cubejs-server-core/src/core/CompilerApi.ts)).

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed (code)** — MetricFlow join matrix, `MAX_JOIN_HOPS = 2`, five metric types and the sidecar protocol are unchanged at 013590e; licence Apache-2.0.
- **Confirmed (code)** — Cube access-policy schema unchanged at 47c6d3b.
- **New — Snowflake status.** Semantic View Autopilot reached GA on 3 Feb 2026; standard SQL querying of semantic views reached GA on 2 Mar 2026; Power BI ingestion for Autopilot reached GA on 18 Aug 2026 (report-level measures and time-intelligence functions not yet fully supported). Sources: https://www.snowflake.com/en/blog/semantic-view-autopilot/ , https://atlan.com/know/snowflake/snowflake-semantic-views/ , https://docs.snowflake.com/release-notes/2026/other/2026-08-18-semantic-views-power-bi-ingestion-ga
- **Mixed — Databricks metric views.** The AWS docs page shows no preview banner and adds joins with other views (Beta), parameters, window measures and materialization; the Azure and GCP mirrors still label the feature Public Preview. Treat GA status as cloud-dependent. Sources: https://docs.databricks.com/en/metric-views , https://learn.microsoft.com/azure/databricks/metric-views

## Gaps

- No palantir material in the research yet.
- No research literature material in the research yet.
