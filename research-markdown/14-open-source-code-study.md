# Open-source code that implements parts of an "organizational brain": a source-level study

Scope note (21 November 2026). This document reports what 60+ open-source repositories actually implement, read from their source code rather than their READMEs. Every repository was cloned at depth 1 under `/home/claude/research/_code/` on 21 November 2026 and read without executing anything. The date given for each repository is the date of the most recent commit at the time of cloning, and it is the only activity signal used here. Star counts and contributor counts could not be fetched: the GitHub API was not available to this session and the web-search budget had already run out, so nothing in this file comes from a live web page. Each claim cites the file it was read from as a `github.com/.../blob/HEAD/<path>` link, so readers can check it against the current default branch. The target is a TypeScript and PostgreSQL product built by one person that holds a company's business objects, metrics, rules, permissions and allowed actions, and puts AI agents (Claude, GPT, Qwen) on top of that model.

Labels: [Fact] means I read it in the cited file. [Vendor claim] means the project's README or docs say it about itself. [Inference] is my own reasoning. [Unverified] means I could not check it.

---

## Key findings

1. **The best blueprint for the action gate is a 1,600-line MIT TypeScript repository: `gura105/operational-ontology`.** The model is plain data, with Zod schemas for objects, links, actions and functions. An action runs in a fixed order: preconditions, then effects described as data, then a dry run inside a transaction that always rolls back, then write-back to the source system, then the local commit. Every attempt is audited, both applied and refused. Each piece of state declares who owns it: the source system, the ontology itself, or nobody because it is derived. The MCP tool surface is generated from the model and deliberately has no raw-SQL tool and no generic update tool. [Fact] ([core.ts](https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts), [mcp.ts](https://github.com/gura105/operational-ontology/blob/HEAD/src/mcp.ts)). The right move is to copy its design and port it to Postgres.
2. **Palantir's own Apache-2.0 SDKs publish the real Foundry ontology metadata format.** `osdk-ts` contains an 18,102-line generated type file for the ontology metadata IR. It covers twelve kinds of action logic rule, nine kinds of condition (comparison, markings, regex, user property and others) and submission criteria. `foundry-platform-python` shows the v2 REST surface: `apply` with `VALIDATE_ONLY` or `VALIDATE_AND_EXECUTE`, `returnEdits`, `applyBatch`, and an ObjectSet algebra with 15 variants. [Fact]. This is the most authoritative Palantir design data available as code, and it is permissively licensed.
3. **None of the "open Foundry" clones is a usable dependency.** CapTrix/openfoundry is AGPL-3.0 (51 Go services), which is incompatible with closed-source SaaS reuse. Przyval/openfoundry is an Apache-2.0 *emulator* of Foundry's APIs; its Postgres migrations for row-level security (RLS), markings and resource-role grants are worth reading. smilebank7/OpenFoundry is a Docker Compose skeleton with no ontology code at all. foundry-ontology-open evaluates rule expressions with Python `eval()`. [Fact].
4. **MetricFlow is now Apache-2.0 and ships a compile-only sidecar.** The sidecar speaks NDJSON over stdin/stdout: an `explain` request turns metric names, group-bys and filters into SQL. The SQL renderers include Postgres. A TypeScript service could therefore run the sidecar as a subprocess instead of re-implementing metric compilation. [Fact] ([sidecar/README.md](https://github.com/dbt-labs/metricflow/blob/HEAD/sidecar/README.md)). Its rule for preventing fan-out (double counting across joins) is a hard-coded matrix of allowed entity-type pairs plus `MAX_JOIN_HOPS = 2`. [Fact].
5. **The Open Semantic Interchange spec is now "Apache Ossie (incubating)".** Release 0.1.1 is dated 2025-12-11, and 0.3.0.dev0 is unreleased and mutable. It defines datasets, relationships, fields, metrics with dialect variants, a structured `ai_context` (instructions, synonyms, examples), and a separate ontology spec with concepts, relationships and mappings. It has no actions and no permissions. [Fact]. Use it as an import/export format, not as the internal model.
6. **Cube's access-policy model is the most complete open design for "who sees which metric columns and rows".** Each policy is per group and has `memberLevel` (includes/excludes), `memberMasking`, `rowLevel` (filters or `allowAll`) and `conditions`. A query that cannot be attributed to a cube instance is denied by injecting `1 = 0`, and views act as a security boundary for members. [Fact] ([CubeValidator.ts](https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-schema-compiler/src/compiler/CubeValidator.ts), [CompilerApi.ts](https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-server-core/src/core/CompilerApi.ts)).
7. **Turning policies into row filters has a ready answer only in OPA.** OPA's compile API translates Rego into Postgres `WHERE` clauses (media type `application/vnd.opa.sql.postgresql+json`), and also into UCAST and Prisma filters. [Fact]. Cedar 4.15's type-aware partial evaluation (`query_resource`, `query_principal`) sits behind an experimental `tpe` Cargo feature. The npm `cedar-wasm` build enables only `wasm` and `partial-eval`. [Fact]. [Inference] For a TypeScript stack: Postgres RLS for tenant isolation, a hand-written marking/role filter compiled to SQL, and Cedar-wasm only for yes/no decisions on actions.
8. **Graphiti has the clearest temporal fact model.** Each edge carries `valid_at`/`invalid_at` (world time) and `created_at`/`expired_at` (transaction time). An LLM flags which facts a new fact contradicts, and then a deterministic rule closes the old edge's validity window. Graphiti has no Postgres driver (Neo4j, FalkorDB and Neptune only). [Fact]. Copy the four timestamps and the invalidation rule into Postgres.
9. **mem0's open-source pipeline is now "V3 additive" (add-only).** It makes one LLM extraction call, deduplicates by hash, and links entities. The older ADD/UPDATE/DELETE prompt is still in the code. The OSS SDK rejects `timestamp`, `reference_date` and decay. Telemetry to PostHog is on by default. [Fact]. Letta's Python server is archived: its `main` branch is now a landing page, and current Letta is `letta-code` (TypeScript, Apache-2.0) with git-backed memory files. [Fact].
10. **LightRAG's `PGTableGraphStorage` is the most directly copyable knowledge-graph-in-Postgres design.** It uses two plain tables with JSONB properties, stores each edge once in a canonical order, and walks the graph with a BFS whose cost is capped by `max_nodes`. Its vector tables use pgvector with a `workspace` tenant column. [Fact]. Cognee has a similar `graph_node`/`graph_edge` adapter and a `DataPoint` model with `identity_fields` (which fix a node's id) and `index_fields` (which get embedded). [Fact].
11. **The Claude Agent SDK is not open source in the licensing sense.** The TypeScript repository says use is governed by Anthropic's Commercial Terms, and the SDK drives the Claude Code runtime. [Fact]. That conflicts with the multi-model requirement for the core agent loop. [Inference]
12. **MCP 2026-07-28 is a stateless protocol.** The initialize handshake and `Mcp-Session-Id` are gone. Multi Round-Trip Requests (MRTR) replace server-initiated sampling and elicitation, and tasks have moved into an extension. TypeScript SDK v2 (`@modelcontextprotocol/server` 2.4.0, Apache-2.0) implements this version. [Fact]. Generated ontology tools should carry `readOnlyHint`/`destructiveHint`/`idempotentHint`. [Fact]
13. **For one person on Postgres, DBOS Transact TS is the best durable-execution fit.** Its core is MIT and keeps all state in Postgres tables such as `workflow_status`, `operation_outputs` and `queues`. Four features are gated behind a proprietary enterprise package: auto-upgrade, sharding, suspend workflows and external storage. pg-boss 12 (MIT) covers plain job queues. Temporal (MIT) needs its own server cluster. [Fact]
14. **Connector licences are a minefield.** Nango is Elastic License 2.0 (ELv2), with 1,441 provider entries in `providers.yaml`. The Airbyte platform is ELv2, and licences vary per connector (HubSpot's is ELv2). Pipedream's licence excludes *any* commercial use. dlt is Apache-2.0 but Python. [Fact]. mycontext (ELv2) shows DingTalk/Feishu ingestion done in two phases: cheap indexing first, LLM extraction later and cached per chunk. [Fact]
15. **tau2-bench defines action-level evaluation precisely.** A task's reward is the product of selected components, and the default is a database end-state match times a communicated-info check. Results are reported as pass^k over repeated trials, and tools are typed READ/WRITE/GENERIC. [Fact]. This is the evaluation design to copy for "did the agent do the right thing through the model".

---

## Breakdown

### 1. gura105/operational-ontology: the action gate, implemented

Plain-English explanation: imagine an "Order" object that is assembled from two ERPs. An agent may only change an order by calling a named action such as `cancelOrder(orderId, reason)`. The action checks its rule ("a shipped order cannot be cancelled"), describes the change it wants to make, writes that change to the ERP first, then commits locally. It records the attempt whether it succeeded or not.

- Licence and maturity: MIT. TypeScript on Node 24+. Four source files (`src/core.ts` 1,200 lines, `src/query.ts` 170, `src/mcp.ts` 237, `src/index.ts` 49), with tests and five example domains (orders, finance, hospital, factory, recall). Last commit 2026-11-19. The README says it is a learning resource, not a framework or an npm dependency. [Fact] ([README](https://github.com/gura105/operational-ontology/blob/HEAD/README.md))
- Data model. `defineObject({primaryKey, properties: ZodRawShape, owned?, visibility?, source?})` defines an object type; `owned` is either `true` (the whole type is ontology-owned) or a map from property name to default value (ontology-owned properties on a row that otherwise comes from a source). `defineLink({from, to, kind: 'one-to-many'|'many-to-many', owned?, via?})` defines a link type. `defineAction({object, targetParam, params, preconditions[], effects(), writeback?})` defines an action. `defineFunction({params, run})` defines a read-only named query. [Fact] ([core.ts](https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts))
- Edits are data. There are four edit types: `modify`, `create`, `link` and `unlink`. Deletes are deliberately out of scope. Preconditions return `reject(code, message)`, a machine-readable refusal with a `Violation {code, message}` shape. [Fact]
- Storage (SQLite in the reference). There are four tables. `objects(type, pk, data)` holds object rows. `links(name, from_pk, to_pk)` holds link instances. `overlay(type, pk, patch)` holds ontology-owned patches that are reapplied after a source re-index. `audit_log(seq, ts, actor, action, target, params, status CHECK IN ('applied','rejected'), error, edits)` holds every attempt. [Fact] (core.ts, Runtime constructor)
- Execution flow:
  1. Parse the params with Zod.
  2. Load the target object.
  3. Run the preconditions.
  4. Compute the effects.
  5. Run a preflight: apply the edits inside a transaction that always throws `Rollback`, so the commit's own code validates them and there is no second validator to drift.
  6. Check authority. An edit plan that touches source-backed state requires `writeback: true`, a plan touching only ontology-owned state forbids it, and a plan that mixes both is refused.
  7. Call `WritebackAdapter.apply(edits, {action, actor, target})` *before* the local commit.
  8. Commit the edits and the audit entry together in one transaction.
  9. On failure, audit the attempt as `WRITEBACK_FAILED`, `COMMIT_FAILED` or `EXECUTION_CRASHED`.

  [Fact] ([docs/IMPLEMENTATION.md](https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md), "Failure semantics in detail")
- Stated limits. There are no idempotency keys. There is no persisted pending-invocation record, so if the process dies after write-back but before the local commit, the edit is lost. The design assumes a single writer. Visibility is fail-open and the actor is self-declared, because the reference has no authentication. [Fact] (IMPLEMENTATION.md)
- MCP surface. For each object type it generates `search_`, `get_`, union/intersect/subtract and `aggregate_` tools. For each link it generates `traverse_` and `pivot_`. Each action and each function becomes its own tool, and there is a `read_audit_log` tool. The build fails if two generated tool names collide. Errors come back as JSON `{error:{code,message}}` with no stack traces. [Fact] ([mcp.ts](https://github.com/gura105/operational-ontology/blob/HEAD/src/mcp.ts)). It uses the v1 `@modelcontextprotocol/sdk` `McpServer`. [Fact]
- Verdict: **copy the design.** It is the most honest small statement of the pattern. Do not depend on it. To make it production-grade, add Postgres, real identity, fail-closed visibility, idempotency keys, an outbox/pending-invocation record, and asynchronous write-back on a durable workflow. [Inference]

### 2. Palantir's public SDKs: osdk-ts, foundry-platform-python, conjure

Plain-English explanation: these are the client libraries Palantir publishes so customers can call Foundry. They are generated from Foundry's internal API definitions, so their types reveal how Foundry itself models object types, actions and object sets.

- **osdk-ts**: Apache-2.0 (per-package `license` field; there is no root LICENSE file), TypeScript, about 636k lines across roughly 80 packages, last commit 2026-11-20. [Fact]
  - `packages/api/src/ontology/ObjectTypeDefinition.ts`: `ObjectMetadata` has `apiName`, `primaryKeyApiName`, `titleProperty`, `links`, `primaryKeyType`, `visibility`, `status`, `implements`, and `interfaceMap`/`inverseInterfaceMap` (interface property ↔ object property). Properties carry `type`, `multiplicity`, `nullable`, `valueTypeApiName`, `valueFormatting` and `readonly`. [Fact] ([file](https://github.com/palantir/osdk-ts/blob/HEAD/packages/api/src/ontology/ObjectTypeDefinition.ts))
  - `ActionDefinition.ts`: action parameters are typed as base types (boolean, string, integer, long, double, decimal, datetime, timestamp, attachment, marking, mediaReference, geoshape and others) or as `object`, `objectSet`, `interface` or `struct`. Each action declares `modifiedEntities: {created, modified}` per object type. [Fact]
  - `packages/api/src/actions/Actions.ts`: the apply options `$validateOnly` and `$returnEdits` are mutually exclusive. [Fact]
  - The ontology-as-code "maker" lives in `packages/maker/src/api/` (`defineObject`, `defineLink`, `defineAction`, `defineCreateObjectAction`, `defineModifyObjectAction`, `defineInterface`, `defineValueType`, and more). An action type there carries `rules: OntologyIrLogicRule[]`, `validation: OntologyIrValidationRule[]`, `sections`, `parameterOrdering`, `submissionMetadata` and `isolationSettings` ("runtime isolation and retries"). [Fact] ([ActionType.ts](https://github.com/palantir/osdk-ts/blob/HEAD/packages/maker/src/api/action/ActionType.ts))
  - `packages/client.unstable/src/generated/ontology-metadata/api/__components.ts` (18,102 lines) is the ontology metadata IR:
    - `OntologyIrLogicRule` has twelve variants: addObject, addOrModifyObjectV2, modifyObject, deleteObject, add/modifyInterface, add/deleteLink, add/deleteInterfaceLink, function and scenario.
    - `OntologyIrCondition` has nine variants: true, or, and, not, comparison, markings, regex, executionContext and redacted.
    - `ComparisonOperator` covers `LESS_THAN_EQUALS`, `LESS_THAN`, `EQUALS`, `NOT_EQUALS`, `GREATER_THAN_EQUALS`, `GREATER_THAN`, `INTERSECTS` and `IS_OF_OBJECT_TYPE`.
    - Condition values can be a parameterId, a staticValue, an objectParameterPropertyValue, an interfaceParameterPropertyValue, a userProperty or a parameterLength.

    [Fact]. This is the most concrete public evidence of how Foundry encodes submission criteria, and it is directly copyable as a JSON shape.
- **foundry-platform-python**: Apache-2.0, generated, about 160k lines, last commit 2026-11-20. [Fact]
  - `foundry_sdk/v2/ontologies/action.py` exposes the endpoints `/v2/ontologies/{ontology}/actions/{action}/apply`, `/applyBatch`, `/applyWithOverrides` and `/applyBatchWithOverrides`.
  - `models.py`: `ApplyActionRequestV2{options:{mode: VALIDATE_ONLY|VALIDATE_AND_EXECUTE, returnEdits: ALL|ALL_V2_WITH_DELETIONS|NONE}, parameters}`. `ValidateActionResponseV2{result: VALID|INVALID, submissionCriteria: [{configuredFailureMessage, result}], parameters: {id: ParameterEvaluationResult}}`. `ObjectSet` is a union discriminated on `type` with 15 variants: base, static, filter, searchAround, union, intersect, subtract, nearestNeighbors, withProperties, asType, asBaseObjectTypes, interfaceBase, interfaceLinkSearchAround, methodInput and reference. [Fact] ([models.py](https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py))
- **conjure**: Apache-2.0, Java (about 15k lines), last commit 2026-11-18. It is Palantir's YAML IDL. Two pieces are worth copying:
  1. A closed set of error codes: PERMISSION_DENIED, INVALID_ARGUMENT, NOT_FOUND, CONFLICT, REQUEST_ENTITY_TOO_LARGE, FAILED_PRECONDITION, INTERNAL, TIMEOUT, CUSTOM_CLIENT and CUSTOM_SERVER. Each error is split into `safe-args` and `unsafe-args`.
  2. Per-field `safety: safe | unsafe | do-not-log`, with bearer tokens always treated as do-not-log.

  [Fact] ([docs/spec/conjure_definitions.md](https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md)). [Inference] Do not adopt Conjure's toolchain, which is Gradle/Java. Copy the error taxonomy and the log-safety flag into your Zod schemas so that audit logs and agent traces redact by construction.
- Verdict: **copy the design** (IR shapes, the validate/apply split, ObjectSet algebra, error taxonomy). As a dependency the SDKs only make sense when talking to a real Foundry.

### 3. The "open Foundry" family

Plain-English explanation: several projects call themselves "open-source Foundry". They range from a full platform rewrite to an infrastructure skeleton with no ontology code yet.

- **CapTrix/openfoundry**: AGPL-3.0, last commit 2026-05-20 (stale for six months). It is large: about 528k lines of Go plus 358k of TS, 51 service directories and 36 libraries. [Fact]. Its README links to `openfoundry/openfoundry-go` as the project home, and the last merge commit references a `DioCrafts` contributor branch. I could not clone either upstream (authentication required, so it is probably private, renamed or deleted) and could not search the web. [Unverified]. What the code shows:
  - Action types live in Postgres rows with `operation_kind` (14 kinds, including `invoke_function`, `invoke_webhook`, interface create/modify/delete and interface links), `input_schema`, `form_schema` (sections and conditional parameter overrides), `confirmation_required`, `permission_key` and `authorization_policy`. The policy object has `required_permission_keys`, `any_role`, `all_roles`, `attribute_equals`, `allowed_markings`, `minimum_clearance` and `deny_guest_sessions`. [Fact] ([libs/ontology-kernel/models/action_type.go](https://github.com/CapTrix/openfoundry/blob/HEAD/libs/ontology-kernel/models/action_type.go))
  - Execution (`libs/ontology-kernel/handlers/actions/execute.go`, 2,735 lines) has `planAction`, `planPreview`, `simulateTargetAfterPreview` and `ensureConfirmationJustification`. [Fact]
  - Schema changes are published through a transactional outbox (`outbox.events`, sent to Kafka by Debezium) on topics such as `ontology.action_type.changed.v1`, with before/after envelopes. [Fact] ([services/ontology-actions-service/internal/repo/events.go](https://github.com/CapTrix/openfoundry/blob/HEAD/services/ontology-actions-service/internal/repo/events.go))
  - Comments say the Go code "mirrors" Rust structs, so it is a port of a Rust codebase. `proto/ontology/action.proto` is a two-line stub. [Fact]
  - Verdict: **ignore as code** because of AGPL. As design reference only: the action-type authorization-policy fields, and confirmation with justification. [Inference]
- **Przyval/openfoundry**: Apache-2.0, TypeScript (about 114k lines), last commit 2026-11-03. It describes itself as a local Foundry *emulator* for development and testing. [Vendor claim] ([README](https://github.com/Przyval/openfoundry/blob/HEAD/README.md))
  - `db/migrations/009_multi_tenancy.sql` adds `org_rid` to about 40 tables. It enables and forces RLS on 16 tables with policies of the form `USING (org_rid = current_setting('app.org_rid', true)) WITH CHECK (...)`, and creates a dedicated `openfoundry_app` login role. `packages/db/src/pg-store.ts` wraps queries in `BEGIN; SET LOCAL app.org_rid = $1; ...; COMMIT`. [Fact]
  - `014_resource_authorization.sql` models Foundry-style roles held *on a resource*: `resource_role_grants(resource_rid, principal_type user|group, principal_id, role_id owner|editor|viewer|discoverer)`, plus `resource_policies(resource_rid, organizations[], markings[])`. [Fact]
  - `packages/markings/src/marking-evaluator.ts`: a user must hold *all* mandatory markings and *at least one* discretionary marking if any are present. Unknown markings are treated as mandatory. [Fact]
  - Action submission criteria are always an empty array (`services/svc-actions/src/routes/v1/actions.ts`), so its action logic is shallow. [Fact]
  - Verdict: **copy the design** of the RLS, resource-grant and marking migrations (Apache-2.0 also allows copying code with attribution). Ignore the services.
- **smilebank7/OpenFoundry**: Apache-2.0, last commit 2026-02-22. Its status line says "Phase 0 — Infrastructure Skeleton". It is a Compose file with Postgres 17, MinIO, Valkey, Trino 479, Keycloak 26.5, OPA 1.13, Dagster 1.12, OpenMetadata 1.11, Superset 6 and Grafana, plus one Rego policy gating Trino schemas by group. The README says the ontology layer is not implemented. [Fact]. Verdict: **ignore**. It is useful only as evidence that "compose existing OSS" stacks are heavy.
- **cloudbadal007/foundry-ontology-open**: MIT, Python, 1,848 lines, last commit 2026-07-19. Validation rules are strings run through `eval(rule.expression, {"__builtins__": {}}, context)`, which is a known-unsafe sandbox. `PermissionCheck.can_read` returns true for any user with at least one role. Markings are a linear 0–3 level scale. It also has OWL/SHACL exporters. [Fact] ([core/action_type.py](https://github.com/cloudbadal007/foundry-ontology-open/blob/HEAD/foundry_ontology/core/action_type.py), [governance/permissions.py](https://github.com/cloudbadal007/foundry-ontology-open/blob/HEAD/foundry_ontology/governance/permissions.py)). Verdict: **ignore**, except as a warning: never store rules as code strings.
- **jachenms/OntoForge**: MIT, Python (2,266 lines) plus a 95 KB single-file HTML workbench, last commit 2026-10-24, bilingual Chinese/English.
  - Action rules are declarative JSON with nine operators (`eq, neq, in, notIn, gt, lt, ge, le, contains`).
  - Edits use five operators (`set, create, delete, addLink, removeLink`).
  - Side effects are limited to `notify` and `webhookLog`.
  - A `submissionCriteria.requireConfirm` setting makes `run_action` return `{needConfirm: true, preview}` until the call is repeated with `confirmed`.
  - Schema branches are deep copies of the schema with name-aligned diffs and merge proposals. Instance data is global, not branched.

  [Fact] ([python/src/ontoforge/actions.py](https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/actions.py), [branches.py](https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/branches.py)). Its `docs/research/逆向分析-Foundry-Ontology.md` is a Chinese evidence-labelled reverse-analysis of Foundry docs, useful as a secondary source. Verdict: **copy the design** of the confirm-preview handshake and the JSON rule vocabulary.

### 4. MetricFlow: semantic models and metric-to-SQL compilation

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

- MIT, TypeScript (about 218k lines), version 0.0.439, last commit 2026-11-18. It has a Postgres dialect (`packages/malloy/src/dialect/postgres/`) and a stable query-interface package (`malloy-interfaces`, Thrift-defined). [Fact]
- Notable technique: `shifty_sum_distinct.ts` implements a "shifty sum". It is a symmetric aggregate: it sums a value over the distinct rows of a fanned-out join by shifting values into wide decimals keyed by row identity, so measures survive joins without double counting. [Fact] ([file](https://github.com/malloydata/malloy/blob/HEAD/packages/malloy/src/dialect/shifty_sum_distinct.ts))
- Verdict: **ignore as a dependency** (it is a whole language to teach). Copy the symmetric-aggregate idea if you ever allow joins that fan out instead of forbidding them as MetricFlow does. [Inference]

### 7. Apache Ossie (formerly Open Semantic Interchange)

- Apache-2.0, Python SDK (Pydantic v2), last commit 2026-11-20, repository `open-semantic-interchange/OSI`. The README states the rename to "Apache Ossie (incubating)" and points to `apache/ossie-converters` for converters to and from dbt, GoodData, Polaris and Salesforce. [Fact] ([README](https://github.com/open-semantic-interchange/OSI/blob/HEAD/README.md))
- Core spec (`core-spec/spec.md`, 953 lines):
  - A model contains datasets (primary key, unique keys), relationships (from/to columns), fields (with an `is_time` role), and metrics.
  - Metrics are either dataset-scoped (unqualified field names, `source.column`, `AGG(source.measure)`) or model-scoped (`dataset.field`, `AGG(dataset.metric)`).
  - An expression has a portable `sql` in the `OSSIE_SQL_2026` dialect plus optional per-dialect variants.
  - `ai_context` is a string or `{instructions, synonyms, examples}`, and `nonportable_extensions` carries vendor attributes.
  - The version history gives 0.1.1 as released on 2025-12-11 and 0.3.0.dev0 as unreleased, with breaking changes and an explicit warning against production use.

  [Fact]
- Ontology spec (`ontology/ontology.md`, 764 lines): concept types `EntityType` and `ValueType`, extends, relationships with roles and multiplicities, identifying relationships, derivation expressions, global identifiers, annotations, and mapping documents (concept, object and link mappings to datasets). [Fact]
- Verdict: **copy the shape** of `ai_context` onto your objects and metrics, and plan an Ossie export later. Do not make it the internal model: it has no actions, rules or permissions, and the spec is still changing. [Inference]

### 8. Graphiti: temporal knowledge graph

Plain-English explanation: "Alice is the account manager for Acme" was true from March. In September a new message says Bob took over. Graphiti does not overwrite the first fact. It closes it (`invalid_at = September`) and keeps both, so "who was the account manager in May?" still has an answer.

- Apache-2.0, Python (about 85k lines), version 0.31.2, last commit 2026-11-20. Graph drivers exist for Neo4j, FalkorDB and Neptune; there is no Postgres driver. [Fact] ([graphiti_core/driver/](https://github.com/getzep/graphiti/tree/HEAD/graphiti_core/driver))
- Schema (`graphiti_core/edges.py`, `nodes.py`):
  - Every node and edge has `uuid` and `group_id` ("partition of the graph", which serves as the tenant or namespace key).
  - `EntityEdge` adds `name`, `fact` (a natural-language sentence), `fact_embedding`, `episodes[]` (provenance), `valid_at`, `invalid_at`, `expired_at` (transaction time), `reference_time` and typed `attributes`.
  - The node types are `EntityNode` (name_embedding, summary, attributes), `EpisodicNode` (the raw source unit, with `source`, `content` and `valid_at`), `CommunityNode` and `SagaNode` (a sequence of episodes with a rolling summary).

  [Fact] ([edges.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/edges.py))
- Ingestion API. `add_episode(name, episode_body, source_description, reference_time, group_id, entity_types: dict[str, pydantic model], edge_types, edge_type_map: {(src_label, tgt_label): [edge names]}, custom_extraction_instructions, saga, identity_properties ...)`. Custom types are Pydantic models. `enforce_edge_type_signatures` drops an edge, or renames it to a default, if its name is not allowed between its endpoint labels. [Fact] ([graphiti.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/graphiti.py), [edge_operations.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py))
- Invalidation, in three steps:
  1. A fast path reuses an existing edge whose endpoints match and whose normalised fact text is identical.
  2. Otherwise one small-model LLM call receives the duplicate candidates and the invalidation candidates with *continuous integer indices*, so the model never sees UUIDs, and returns `duplicate_facts` and `contradicted_facts`. Out-of-range indices are logged and discarded.
  3. `resolve_edge_contradictions` applies a deterministic rule. If the time windows do not overlap, nothing happens. If the old edge started before the new one, the old edge gets `invalid_at = new.valid_at` and `expired_at = now`.

  [Fact]
- Future-tense handling. `temporal_edge_utils.py` uses regular expressions (will, plans to, scheduled to, by/deadline, until/expires, and so on) so that a promise's `valid_at` is the statement time, not the promised date, and so that a soft deadline does not become `invalid_at`. [Fact] ([file](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/temporal_edge_utils.py))
- Search. Edge search methods are cosine similarity, BM25 and breadth-first search. Rerankers are reciprocal rank fusion, node distance, episode mentions, maximal marginal relevance (MMR) and a cross-encoder. [Fact] ([search_config.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/search/search_config.py))
- Verdict: **copy the design** (four-timestamp edges, index-based LLM adjudication, the deterministic invalidation rule, the future-tense normaliser) into Postgres tables. Running Graphiti adds Python plus Neo4j or FalkorDB. [Inference]

### 9. LightRAG

- MIT, Python, version 1.5.8, last commit 2026-11-21 (very active). The Python line count (489k) is inflated by vendored or generated files. [Fact]/[Inference]
- Query modes: `local`, `global`, `hybrid`, `naive`, `mix` (graph plus vector, the default) and `bypass`. [Fact] ([lightrag/base.py](https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/base.py))
- Postgres storage (`lightrag/kg/postgres_impl.py`, 10,914 lines) has KV, vector, doc-status and graph classes. The graph class uses Apache AGE/Cypher. The DDL defines tables such as `LIGHTRAG_VDB_CHUNKS(workspace, id, full_doc_id, chunk_order_index, tokens, content, content_vector VECTOR(dim), file_path)` and `LIGHTRAG_VDB_ENTITY/RELATION` (with `chunk_ids[]` for provenance), all keyed `(workspace, id)`. [Fact]
- `lightrag/kg/pgtable_impl.py` (`PGTableGraphStorage`) is a Postgres-native graph on two plain tables with JSONB properties and B-tree indexes, with no AGE and no Cypher. Edges are stored in canonical order (`src = min(a,b)`, computed in Python because SQL `LEAST` differs under non-C collations). Node properties are merged with `jsonb ||`, edge properties are replaced, and an edge upsert creates missing endpoints. Graph retrieval is a frontier-capped iterative BFS whose per-hop filtering and degree ranking run in SQL, so cost is bounded by `max_nodes`. [Fact] ([file](https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py))
- Verdict: **copy the design** of `PGTableGraphStorage` and the provenance columns. This is the plan for graph storage in a Postgres-only build. [Inference]

### 10. Microsoft GraphRAG

- MIT, Python (about 52k lines), version 3.3.0, last commit 2026-11-01, split into eight packages (graphrag, -cache, -chunking, -common, -input, -llm, -storage, -vectors). [Fact]
- The indexing workflows are `index/workflows/*` (extract_graph or extract_graph_nlp, finalize_graph, prune_graph, create_communities, create_community_reports, generate_text_embeddings, and incremental `update_*` workflows). Search modes are basic, local, global and DRIFT. [Fact]
- Output tables (`data_model/schemas.py`):
  - entities: id, short_id, title, type, description, text_unit_ids, frequency, degree.
  - relationships: source, target, description, weight, degree, text_unit_ids.
  - community_reports: community, level, parent, children, title, summary, full_content, rating, explanation, findings, period.

  [Fact]
- Verdict: **copy the community-report idea**, a hierarchical pre-summary of clusters for "global" questions, as an optional batch job. **Ignore** the pipeline. Indexing is LLM-heavy and better suited to static corpora than to a live operational model. [Inference]

### 11. HippoRAG 2

- MIT, Python (about 12k lines), version 2.0.0a5, last commit 2026-10-06. It extracts OpenIE triples, builds a graph of phrases and passages, and ranks passages with personalized PageRank (python-igraph, damping 0.5 by default) seeded by facts matched to the query and reranked by an LLM. [Fact] ([src/hipporag/HippoRAG.py](https://github.com/OSU-NLP-Group/HippoRAG/blob/HEAD/src/hipporag/HippoRAG.py), `run_ppr`, `rerank_facts`)
- Verdict: **ignore** as a dependency, since it is research-grade alpha code. The personalized-PageRank-over-facts idea is the reference if multi-hop recall becomes a problem. [Inference]

### 12. KAG and OpenSPG (Ant Group)

- KAG: Apache-2.0, Python (about 101k lines), version 0.8.0, last commit 2026-11-19. OpenSPG: Apache-2.0, Java/Scala (about 138k lines), last commit 2025-06-29. OpenSPG has been idle for about 17 months while KAG is active. [Fact]
- The schema DSL (`*.schema`, for example [RiskMining.schema](https://github.com/OpenSPG/KAG/blob/HEAD/kag/examples/riskmining/schema/RiskMining.schema)) works like this:
  - Types are bilingual (`Person(自然人): EntityType`) and come in two kinds: `ConceptType` with a `hypernymPredicate: isA` (a taxonomy) and `EntityType` with `properties` and `relations`.
  - Relations can have their own properties (for example `fundTrans` carries transDate and transAmt).
  - Relations can be *derived by rule*. KGDSL `Define (s:Person)-[p:developed]->(o:App) { STRUCTURE {...} CONSTRAINT { deviceNum = group(s,o).count(d); R1(...): deviceNum > 5 } }` defines a relation by a graph pattern plus an aggregate constraint.

  [Fact]
- The solver has planners (static, iterative, logical-form, MCP) and executors (retriever, deduce, math, MCP). [Fact] ([kag/solver/](https://github.com/OpenSPG/KAG/tree/HEAD/kag/solver))
- Verdict: **copy the design** of bilingual labels, concept taxonomies separate from entity types, and *rule-derived relations* (a derived link computed from a pattern). **Ignore** as a dependency (it needs the Java OpenSPG server and a graph store). [Inference]

### 13. mem0

- Apache-2.0, Python version 2.2.1 and TypeScript package `mem0ai` 3.3.1, last commit 2026-11-18. [Fact]
- The current add path (`mem0/memory/main.py`, `_add_to_vector_store`, about 3,900 lines) runs as a "V3 phased batch pipeline":
  1. Gather context.
  2. Retrieve existing memories, mapping UUIDs to integers "anti-hallucination", the same trick as Graphiti.
  3. Run a single LLM extraction call.
  4. Batch-embed the results.
  5. Deduplicate by hash.
  6. Persist in a batch, reporting only the records the store actually accepted.
  7. Link entities in a batch.

  The prompt file labels the V3 prompt "ADD-only with memory linking". The older `DEFAULT_UPDATE_MEMORY_PROMPT` with ADD/UPDATE/DELETE/NONE events still exists. [Fact] ([main.py](https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/main.py), [configs/prompts.py](https://github.com/mem0ai/mem0/blob/HEAD/mem0/configs/prompts.py))
- Open-core boundary. The OSS SDK raises errors for the `timestamp`, `reference_date` and `decay` parameters ("not supported by the OSS Memory SDK"). [Fact] ([memory/notices.py](https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/notices.py))
- Telemetry. `MEM0_TELEMETRY` defaults to true and sends events to `https://us.i.posthog.com`. [Fact] ([memory/telemetry.py](https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/telemetry.py))
- The TypeScript port has a pgvector store and SQLite or Supabase history managers. [Fact]
- Verdict: **ignore as a dependency** for company memory. It is user-centric (scoped by user_id, agent_id and run_id), the temporal features are paywalled, and telemetry is on by default. **Copy** the integer-ID mapping trick and the "report only confirmed writes" rule. [Inference]

### 14. Cognee

- Apache-2.0, Python version 1.6.10, last commit 2026-11-20. [Fact]
- `DataPoint` (Pydantic) is the unit of storage. A field that holds another DataPoint becomes an edge named after the field. `metadata.index_fields` are embedded into per-type vector collections named `<Type>_<field>`. `identity_fields` derive a deterministic node id, so repeated mentions merge. Provenance records which document owns each node, so `forget()` can remove a document's nodes and edges. [Fact] ([infrastructure/engine/models/DataPoint.py](https://github.com/topoteretes/cognee/blob/HEAD/cognee/infrastructure/engine/models/DataPoint.py))
- Storage adapters: graph on Kuzu, Neo4j, Neptune, Turso, or a "postgres_demo" adapter with `graph_node`/`graph_edge` tables over SQLAlchemy and asyncpg (isolated either per dataset or as one schema per dataset in a shared database). Vectors on LanceDB, pgvector or Turso. [Fact]
- Permissions: dataset ACLs (`principal_id, permission_id, dataset_id`) with permission types `read`, `write`, `delete` and `share`, plus tenant-scoped capabilities such as `manage_users`, `grant_capabilities` and `revoke_capabilities`. Granting can only pass on what the granter already holds. [Fact] ([modules/users/permissions/permission_types.py](https://github.com/topoteretes/cognee/blob/HEAD/cognee/modules/users/permissions/permission_types.py))
- Verdict: **copy the design** of identity_fields/index_fields as metadata on your object types, and the rule that a grant can only pass on what the granter holds. **Ignore** as a dependency (Python, and a large surface of about 779k lines). [Inference]

### 15. Letta (letta-ai/letta and letta-code)

- `letta-ai/letta` `main` (last commit 2026-10-18) is now a landing page. Its AGENTS.md says the V1 Python server lives on an `archive` branch, is unsupported, and should not be used for production, benchmarks or comparisons. [Fact] ([AGENTS.md](https://github.com/letta-ai/letta/blob/HEAD/AGENTS.md))
- `letta-ai/letta-code`: Apache-2.0, TypeScript (about 647k lines), version 0.34.67, last commit 2026-11-20. It includes channels (Slack, Telegram, Discord), cron, approval execution and recovery, and "git-backed memory" (`src/agent/memory-filesystem.ts`). `memory-constraints.ts` validates memory trees against read-only globs and size limits per changed path. [Fact]
- Verdict: **copy the design** of a versioned memory store (every memory change is a diff with history), but in Postgres rows rather than git. **Ignore** as a dependency. [Inference]

### 16. openTrinity/mycontext

- **Elastic License 2.0** (SPDX `Elastic-2.0`, which forbids offering the software as a hosted or managed service), TypeScript plus Python, last commit 2026-08-31, labelled "developer preview" with breaking changes promised. The 3.4M Python line count is mostly a vendored runtime (`vendor/`, 407 MB). [Fact] ([LICENSE](https://github.com/openTrinity/mycontext/blob/HEAD/LICENSE), [README](https://github.com/openTrinity/mycontext/blob/HEAD/README.md))
- It is a personal (not organisational) work-context layer. Source plugins exist for `dingtalk` and `feishu` (`packages/channels/src/plugins/`) over a local SQLite vault. Sending and deleting require explicit confirmation. [Fact]
- `kl-graph`, its spatio-temporal knowledge graph, ingests in two phases:
  - **Phase A** chunks new source units, persists lineage and embeds the chunks, with no LLM. Dense and BM25 search work immediately.
  - **Phase B** runs LLM entity and fact extraction and caches results *per chunk* in a separate `extraction_cache.db`, so they can be replayed across database rebuilds.
  - A finalisation step builds similarity edges, runs Leiden community detection at levels L0–L3, disambiguates entities and writes community summaries.
  - Deduplication uses `(source_id, source_type, unit_id)`, not timestamps.

  [Fact] ([kl-graph/README.md](https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md))
- Verdict: **copy the design** (two-phase ingestion, LLM results cached by content hash, dedup on the source-unit key). **Do not copy code** (ELv2). [Inference]

### 17. Cedar

- Apache-2.0, Rust, workspace version 4.15.0, last commit 2026-11-20. [Fact]
- Crates: `cedar-policy` (API), `-core` (parser, evaluator, validator, batched evaluator, `tpe`), `-cli`, `-formatter`, `-symcc` (symbolic compilation), a language server, and `cedar-wasm`. [Fact]
- Type-aware partial evaluation (`cedar-policy/src/api/tpe.rs`):
  - `PolicySet::tpe` returns a decision, or residual policies that can be inspected as a structured tree.
  - `is_authorized_batched` loads entities on demand through an `EntityLoader`, up to `max_iters` times.
  - `query_resource` and `query_principal` answer "which resources may this principal act on" or "which principals may act on this resource", given a known type.
  - `query_action` is also present.

  The `tpe` feature is listed under `experimental` in `cedar-policy/Cargo.toml`. [Fact] ([tpe.rs](https://github.com/cedar-policy/cedar/blob/HEAD/cedar-policy/src/api/tpe.rs))
- `cedar-wasm` is published as `@cedar-policy/cedar-wasm` in ESM, Node/CommonJS and web flavours. It is built with features `["wasm", "partial-eval"]`, not `tpe`. [Fact] ([cedar-wasm/Cargo.toml](https://github.com/cedar-policy/cedar/blob/HEAD/cedar-wasm/Cargo.toml), [README](https://github.com/cedar-policy/cedar/blob/HEAD/cedar-wasm/README.md))
- Verdict: **adopt `@cedar-policy/cedar-wasm` as a dependency** for "may principal P run action A on object O with context C". Write the "filter the list of objects" path yourself in SQL, because resource queries are not in the wasm build. [Inference]

### 18. Open Policy Agent

- Apache-2.0, Go (about 478k lines), version 1.23.0-dev, last commit 2026-11-20. [Fact]
- The compile API (`v1/server/compile_handler.go`, `v1/rego/compile/compile.go`) runs partial evaluation with post-checks that decide whether a residual can become a filter for a given target. Targets are UCAST (all, minimal, Prisma, LINQ), SQL (PostgreSQL, MySQL, SQL Server, SQLite) and Lucene/Solr, selected by `application/vnd.opa.*` media types. [Fact] ([compile_handler.go](https://github.com/open-policy-agent/opa/blob/HEAD/v1/server/compile_handler.go))
- Verdict: **consider as a sidecar** only if you want policy authors to write Rego and get SQL `WHERE` clauses back. For one person, a Go sidecar plus Rego is a second language and a second service. **Copy the design** of "partial evaluation → check translatability → emit SQL fragment". [Inference]

### 19. OpenFGA

- Apache-2.0, Go (about 185k lines), last commit 2026-11-20. It uses CEL (`cel.dev/cel-go` v0.33.2) for conditional tuples. [Fact]
- The Postgres schema (`assets/migrations/postgres/001_initialize_schema.sql`) has `tuple(store, object_type, object_id, relation, _user, user_type, ulid, inserted_at)` with primary key `(store, object_type, object_id, relation, _user)` and partial indexes for user versus userset. It also has `authorization_model(store, id, type, type_definition BYTEA)`, `changelog` for the watch API, and `assertion`. Migration 005 adds `condition_name` and `condition_context` to tuples. [Fact] ([migrations](https://github.com/openfga/openfga/tree/HEAD/assets/migrations/postgres))
- Verdict: **copy the tuple-table design** if you need relationship-based sharing ("viewer of this account because member of team T, which owns region R"). Run OpenFGA itself only if relationship graphs become deep; at 100–1,000 staff, group and role grants in Postgres are likely enough. [Inference]

### 20. Postgres row-level security for multi-tenant apps (pattern as found in code)

Plain-English explanation: every row carries a tenant id. The database itself refuses to return another tenant's rows, even if application code forgets a `WHERE` clause.

- The pattern in Przyval/openfoundry, which is the only full example in this repository set:
  - An `org_rid TEXT NOT NULL` column on every table, with an index on it.
  - RLS enabled *and forced* on each table.
  - `CREATE POLICY tenant_isolation ... USING (org_rid = current_setting('app.org_rid', true)) WITH CHECK (same)`.
  - A separate application login role, so that the migration owner (which bypasses RLS) is not the role the app connects as.
  - Each request runs inside a transaction that starts with `SET LOCAL app.org_rid = $1`.

  [Fact] ([009_multi_tenancy.sql](https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/009_multi_tenancy.sql), [pg-store.ts](https://github.com/Przyval/openfoundry/blob/HEAD/packages/db/src/pg-store.ts))
- Variants elsewhere: LightRAG uses a `workspace` column in every primary key, Graphiti uses `group_id`, OpenFGA uses `store`, and Cognee offers one database or schema per dataset. These are application-level partitions without RLS. [Fact]
- [Inference] The `true` second argument of `current_setting` makes an unset variable return NULL, so the policy matches no rows. That means it fails closed, which is the behaviour you want. `SET LOCAL` only lasts until the end of the transaction, so a pooled connection does not leak a tenant to the next request. Both points come from my knowledge of Postgres semantics; I did not re-check the Postgres docs in this session. [Unverified against docs this session]

### 21. Claude Agent SDK (TypeScript and Python)

- TypeScript: `LICENSE.md` states all rights reserved, with use governed by Anthropic's Commercial Terms of Service. The repository holds only examples and a changelog. Version 0.3.329 ("parity with Claude Code v2.1.329"), last commit 2026-11-19. [Fact] ([LICENSE.md](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/LICENSE.md), [CHANGELOG.md](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/CHANGELOG.md))
- Python: the wrapper code is MIT, but its README says use is governed by the Commercial Terms. Version 0.2.186. It bundles the CLI under `_bundled`. [Fact]
- Surfaces worth copying:
  - Hook events: PreToolUse, PostToolUse, PostToolUseFailure, UserPromptSubmit, Stop, SubagentStop, PreCompact, Notification, SubagentStart and PermissionRequest.
  - Permission results: `allow` with `updated_input`/`updated_permissions`, and `deny` with `message`/`interrupt`.
  - A `SessionStore` interface, with a Postgres reference store holding one JSONB row per transcript entry, ordered by BIGSERIAL and keyed by `(project_key, session_id, subpath)`.

  [Fact] ([types.py](https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py), [PostgresSessionStore.ts](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts))
- Verdict: **copy the design** (the hook taxonomy, allow/deny-with-rewrite, the session-store contract). **Do not build the core agent loop on it**, because the product must run GPT and Qwen as well. [Inference]

### 22. Model Context Protocol (spec and SDKs)

- Spec repository: licensing is moving from MIT to Apache-2.0 for new contributions; docs are CC-BY-4.0. Schema versions present: 2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25, 2026-07-28 and draft. [Fact] ([LICENSE](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/LICENSE))
- 2026-07-28 major changes:
  - Protocol-level sessions and the `Mcp-Session-Id` header are removed; servers mint explicit handles passed as tool arguments.
  - The initialize handshake is removed; each request carries its protocol version and client capabilities in `_meta`.
  - A mandatory `server/discover` RPC is added.
  - `subscriptions/listen` replaces GET and resource subscribe.
  - `ping` and `logging/setLevel` are removed.
  - Tasks move to an extension that is polled with `tasks/get`.
  - MRTR replaces server-initiated `sampling`/`elicitation`/`roots`, and every result now carries `resultType`.
  - SSE resumability is removed.

  Minor changes include deterministic `tools/list` ordering (for prompt-cache hits), required `ttlMs`/`cacheScope` on list results, OpenTelemetry `traceparent` in `_meta`, and JSON Schema 2020-12 for tool schemas. Roots, Sampling and Logging are deprecated. [Fact] ([changelog.mdx](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx))
- Tool annotations in `schema/2026-07-28/schema.ts`: `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. [Fact]
- TypeScript SDK: `main` is v2, published as `@modelcontextprotocol/server` and `@modelcontextprotocol/client` 2.4.0 (Apache-2.0), implementing 2026-07-28. v1.x (`@modelcontextprotocol/sdk`) receives fixes for at least six months after the v2 release on 2026-07-27. [Fact] ([README](https://github.com/modelcontextprotocol/typescript-sdk/blob/HEAD/README.md))
- Verdict: **adopt `@modelcontextprotocol/server` v2** as the external agent interface. Statelessness suits generated tools well: put the actor and tenant in auth, not in session state. [Inference]

### 23. LangGraph (Python and JS)

- MIT. Python last commit 2026-11-20. JS: `@langchain/langgraph` 1.0.47 and core 1.7.5; `langgraph-api` is also MIT. [Fact]
- The Postgres checkpointer (`libs/checkpoint-postgres/src/migrations.ts`) has three tables:
  - `checkpoints(thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, type, checkpoint JSONB, metadata JSONB)`.
  - `checkpoint_blobs(thread_id, ns, channel, version, type, blob BYTEA)`.
  - `checkpoint_writes(thread_id, ns, checkpoint_id, task_id, idx, channel, type, blob)`.

  Human-in-the-loop is `interrupt(value)` inside a node, resumed with a command. [Fact] ([migrations.ts](https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts), [interrupt.ts](https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/langgraph-core/src/interrupt.ts))
- Verdict: **optional dependency** (model-agnostic, TypeScript, Postgres checkpointer). A hand-written loop over the provider SDKs is simpler for a generated-tool architecture. Copy the checkpoint/blob/writes split if you persist agent state yourself. [Inference]

### 24. AgentScope (Alibaba Tongyi) and Qwen-Agent

- AgentScope: Apache-2.0, Python, version 2.0.13dev, last commit 2026-11-20. Three modules matter:
  - The `sop` module defines a procedure as an ordered list of `SOPStep(subject, description, executor, verifier?, max_attempts=3)`. Each attempt is "work, then judgement"; run state (`SOPRunState`) outlives the process; a user interrupt parks the step without spending an attempt. [Fact] ([sop/_schema.py](https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py))
  - The `permission` module defines rules `PermissionRule(tool_name, rule_content, behavior, source)` and decisions with `updated_input`, `suggested_rules` and `bypass_immune`. [Fact]
  - Middleware covers budget, a model router, RAG, steering and long-term memory. [Fact]
- Qwen-Agent: Apache-2.0, Python, version 0.0.34, last commit 2026-03-04 (slowing). It has Qwen-specific and Nous-style function-calling prompt templates (`llm/fncall_prompts/`), DashScope and OpenAI-compatible clients, and an MCP manager. [Fact]
- Verdict: **copy the SOP executor/verifier/max_attempts structure** for multi-step agent procedures, a close analogue of what Lingyang-style "SOP agents" describe [Inference]. Ignore both as dependencies in a TypeScript build. Qwen's fncall templates matter only if you call Qwen models without native tool calling. [Inference]

### 25. Durable execution: Temporal vs DBOS vs pg-boss

- Temporal server: MIT, Go (about 1.16M lines), version 1.33.0. Persistence schemas exist for Cassandra, MySQL, PostgreSQL and SQLite, plus Elasticsearch for visibility. The TypeScript SDK is 1.26.0 (MIT). [Fact]. Operationally it is a separate multi-service cluster. [Inference]
- DBOS Transact TS: MIT core, last commit 2026-11-18. Its Postgres system tables include `workflow_status` (status, name, authenticated_user, assumed_role, request, output, error, executor_id, created_at), `operation_outputs(workflow_uuid, function_id, function_name, output, error)` (the per-step memo that makes replay safe), `notifications`, `workflow_events(_history)`, `workflow_schedules`, `queues`, `application_versions` and `workflow_input`/`workflow_output`. [Fact] ([sysdb_migrations/internal/migrations.ts](https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts)). `src/enterprise.ts` gates `autoUpgrade`, `sharding`, `suspendWorkflows` and `externalStorage` behind the proprietary `@dbos-inc/dbos-enterprise` package and a Conductor entitlement check. [Fact] ([enterprise.ts](https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/enterprise.ts))
- pg-boss: MIT, version 12.38.2. It has a partitioned `job` table (cloned per queue), `queue`, `schedule`, `subscription`, a warning table and queue statistics, with options for CockroachDB-style inline indexes. [Fact] ([src/plans.ts](https://github.com/timgit/pg-boss/blob/HEAD/src/plans.ts))
- Verdict: **adopt DBOS** for action write-back and long agent tasks (steps are memoised, so a write-back that crashed is resumed rather than re-run blindly), or **pg-boss** for simpler background jobs. Skip Temporal until you have operations staff. [Inference]

### 26. Connectors and OAuth: dlt, Airbyte, Nango, Pipedream, mycontext

- **dlt**: Apache-2.0, Python, version 1.32.0. The declarative `rest_api` source config has a `client{base_url, headers, auth, paginator}`, and each `resources[]` entry has an `endpoint{path, method, params (with resolve-from-parent or incremental binds), data_selector (JSONPath), paginator, response_actions, incremental{cursor, start_param, end_param}}`. There are sources for sql_database and filesystem. [Fact] ([sources/rest_api/typing.py](https://github.com/dlt-hub/dlt/blob/HEAD/dlt/sources/rest_api/typing.py))
- **Airbyte**: the platform repository is ELv2 (`LICENSE`, copyright "Airbyte, Inc."). There are 703 connector directories, each with its own licence in `metadata.yaml` (for example `source-hubspot`: `license: ELv2`, certified). The Python CDK repository is MIT. Its low-code declarative schema, `declarative_component_schema.yaml`, is 6,077 lines. [Fact] ([airbyte-python-cdk](https://github.com/airbytehq/airbyte-python-cdk/blob/HEAD/airbyte_cdk/sources/declarative/declarative_component_schema.yaml))
- **Nango**: ELv2 at the repository root, with packages marked `Elastic-2.0` or "SEE LICENSE". `packages/providers/providers.yaml` has 1,441 top-level provider entries. Each entry gives `auth_mode`, `authorization_url`/`token_url` with `${connectionConfig.*}` templating, `default_scopes`, `token_response_metadata`, `proxy.base_url`, webhook routing scripts and `connection_config` fields (the Salesforce entry is an example). [Fact] ([providers.yaml](https://github.com/NangoHQ/nango/blob/HEAD/packages/providers/providers.yaml))
- **Pipedream**: the "Pipedream Source Available License 1.0" defines an "Excluded Purpose" as any commercial use. [Fact] ([LICENSE](https://github.com/PipedreamHQ/pipedream/blob/HEAD/LICENSE))
- Verdict, per tool:
  - Nango: self-hosting it as an internal component behind your SaaS is arguably not "providing the software as a hosted service", but that reading is mine and should be checked by a lawyer [Inference]. The safer path is Nango Cloud (paid) or writing OAuth for the 5–10 systems you need.
  - dlt: copy its config grammar for a TypeScript sync engine.
  - Airbyte: ignore the platform.
  - Pipedream: ignore entirely.

### 27. Entity resolution: Splink

- MIT, Python, version 5.0.0, last commit 2026-11-11. It implements Fellegi–Sunter probabilistic linkage with blocking rules, comparison levels, m/u estimation by expectation-maximisation, term-frequency adjustments, connected-components clustering and `realtime.py` (score one new record against existing records). Backends are DuckDB, Spark, Postgres and SQLite. [Fact] ([splink/internals/](https://github.com/moj-analytical-services/splink/tree/HEAD/splink/internals))
- Verdict: **adopt as an offline batch job** (Python against your Postgres) for merging customers and suppliers across systems. Its output is match pairs and cluster ids, which your ontology stores as a link type. [Inference]

### 28. Document parsing: Docling and Unstructured

- Docling: MIT, Python, version 2.151.1. It depends on `docling-core` (the DoclingDocument model and chunking), `docling-parse` and `docling-ibm-models` (layout, TableFormer), and has a `service_client` module. [Fact] ([pyproject.toml](https://github.com/docling-project/docling/blob/HEAD/pyproject.toml)). Unstructured: Apache-2.0, Python, version 0.27.38-dev. [Fact]
- Verdict: **adopt Docling as a separate HTTP service** called from TypeScript. It is the permissive choice with structure-aware chunking. [Inference]

### 29. Evaluation and observability: tau-bench, tau2-bench, Langfuse, promptfoo, Phoenix

- **tau2-bench**: MIT, Python, version 2.0.0, last commit 2026-11-10. Domains: airline, retail, telecom, banking_knowledge, intake and mock. Each domain has `policy.md`, `db.json`, `tasks.json` and `tools.py`, with tools decorated `@is_tool(ToolType.READ|WRITE|GENERIC)`. The task reward is the product of the components in `reward_basis`:
  - `DB`: the end state matches the result of replaying the reference actions, so any path that produces an equivalent state passes. This is the default together with COMMUNICATE.
  - `ENV_ASSERTION`.
  - `NL_ASSERTION`: LLM-judged, experimental.
  - `ACTION`: an exact trajectory, used only in some banking tasks.
  - `COMMUNICATE`: required strings appear in the agent's messages.

  The `pass_hat_k` metric is in `metrics/agent_metrics.py`. [Fact] ([data_model/tasks.py](https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py)). The original tau-bench is MIT (last commit 2026-03-18). [Fact]
- **Langfuse**: the core is MIT; `ee/`, `web/src/ee/` and two other `ee` directories fall under a commercial licence (audit-log viewer, admin API, multi-tenant SSO, UI customisation, verified domains, and more). Copyright belongs to "ClickHouse, Inc.". Version 4.83.0. Self-hosting needs Postgres, ClickHouse, Redis and MinIO/S3 (`docker-compose.yml`), plus a new `langfuse-ai-gateway` service. [Fact] ([LICENSE](https://github.com/langfuse/langfuse/blob/HEAD/LICENSE), [docker-compose.yml](https://github.com/langfuse/langfuse/blob/HEAD/docker-compose.yml))
- **Phoenix**: the server is ELv2 (version 22.0.0) on SQLite or Postgres. Its JS client packages are Apache-2.0. [Fact]
- **promptfoo**: MIT, TypeScript, version 0.126.0. [Fact]
- Verdict:
  - Copy tau2's reward design for your own action evaluations: seed the database, replay the reference actions to get a target state, compare end states, run k trials.
  - Use promptfoo (MIT) in CI for prompt and tool regression.
  - For traces, either emit OpenTelemetry and self-host Phoenix (ELv2 is fine for internal use, [Inference]), or write traces to your own Postgres table. Langfuse self-hosting is a four-service footprint.

  [Inference]

### 30. Rules engines: GoRules Zen, json-rules-engine, DMN

- **Zen**: MIT, Rust (about 89k lines) with napi bindings published as `@gorules/zen-engine` 2.1.12. The JSON Decision Model graph has node kinds Input, Output, Function (JavaScript source), Decision (sub-decision by key), DecisionTable (hit policy `first` or `collect`), Expression, Switch and Custom. A newer `policy` module adds "policy documents" with prose, typed data models and tables, plus tracing (`BlockTrace`, `ConditionTrace`), diagnostics, rename and linting. [Fact] ([core/types/src/decision/mod.rs](https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs), [core/engine/src/policy/mod.rs](https://github.com/gorules/zen/blob/HEAD/core/engine/src/policy/mod.rs))
- **json-rules-engine**: ISC, JavaScript, version 7.3.2, about 1,500 lines, last commit 2026-02-16. It provides all/any/not conditions, custom operators, async facts in an almanac, and events and priorities. [Fact]
- **DMN**: `dmn-js` is MIT plus a clause that the bpmn.io watermark must stay visible. It is a modeller, not an engine. `feelin` (MIT, version 8.2.2) is a JavaScript FEEL interpreter. [Fact] ([dmn-js LICENSE](https://github.com/bpmn-io/dmn-js/blob/HEAD/LICENSE))
- Verdict:
  - **Adopt Zen** if business users must edit decision tables (pricing, eligibility, approval thresholds) and you want a trace of why a row fired.
  - Otherwise encode preconditions as the JSON condition IR copied from Palantir's `OntologyIrCondition`, evaluated in TypeScript.
  - Avoid DMN unless a customer demands it.

  [Inference]

---

## What to copy

1. **Model as data, validated by Zod, with every write going through an action.** Object, link, action and function definitions are plain values, and the tool surface, forms and docs are generated from them. Why: it lets you enumerate the operation space for agents and audit it. Source: https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts
2. **Authority declaration per property** (`source-backed` | `ontology-owned` | `derived`), checked against every edit plan. A plan that changes source-backed state without declaring write-back is refused, and so is a plan that straddles both kinds. Why: it stops agents silently forking the truth away from the ERP. Source: operational-ontology core.ts (`owned`, `writeback`) and docs/IMPLEMENTATION.md "The authority line, checked".
3. **Action pipeline**:
   1. Parse.
   2. Load the target.
   3. Run the preconditions, which return `{code, message}`.
   4. Run the effects, which return `Edit[]`.
   5. Preflight in a rolled-back transaction using the commit code.
   6. Write back first, as a durable workflow step.
   7. Commit the edits and the audit entry in one transaction.
   8. On failure, audit `WRITEBACK_FAILED`, `COMMIT_FAILED` or `EXECUTION_CRASHED`.

   Add what the reference lacks: an `invocation_id` idempotency key and a `pending_invocations` row written *before* write-back (DBOS `operation_outputs` gives this for free). Sources: operational-ontology IMPLEMENTATION.md; https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts
4. **Validate/apply split with an evaluation per parameter.** Copy Foundry's `mode: VALIDATE_ONLY | VALIDATE_AND_EXECUTE`, `returnEdits: ALL | NONE`, and a validate response of `{result, submissionCriteria:[{configuredFailureMessage, result}], parameters:{...}}`. Agents call validate first and show the preview to a human when `confirmation_required`. Sources: https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py ; OntoForge `requireConfirm`/`preview` (https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/actions.py)
5. **Submission criteria as a JSON condition tree, never code strings.** Use `true | and | or | not | comparison(left, op, right) | markings | regex | userProperty`. Comparison operators are `<=, <, =, !=, >=, >, INTERSECTS, IS_OF_OBJECT_TYPE`. Values are parameterId, staticValue, objectParameterPropertyValue or userProperty. Source: https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts (search `OntologyIrCondition`). Anti-source: the `eval()` in foundry-ontology-open.
6. **Action logic rules as a closed set**: addObject, modifyObject, addOrModifyObject, deleteObject, addLink, deleteLink, function (computes edits), and webhook (side effect). Source: osdk-ts `OntologyIrLogicRule`; CapTrix `ActionOperationKind` (design only, AGPL).
7. **Per-action authorization policy fields**: `required_permission_keys`, `any_role`, `all_roles`, `attribute_equals`, `allowed_markings`, `minimum_clearance` and `deny_guest_sessions`, plus `confirmation_required` with a mandatory justification string. Source (design only): https://github.com/CapTrix/openfoundry/blob/HEAD/libs/ontology-kernel/models/action_type.go
8. **ObjectSet algebra as JSON**: base, filter, searchAround(link), union, intersect, subtract, static(pks), nearestNeighbors(vector), withProperties (derived), as the agent's query language, compiled to SQL. Source: foundry-platform-python `ObjectSet` union; operational-ontology `query.ts`.
9. **Generated MCP tools with no raw SQL and no generic update**: `search_<type>`, `get_<type>`, `aggregate_<type>`, `traverse_<link>`, one tool per action and function, and an audit-log reader. Fail the build on tool-name collisions. Set `readOnlyHint` on reads, `destructiveHint` on actions that delete or cancel, and `idempotentHint` where true. Return deterministic `tools/list` order. Sources: https://github.com/gura105/operational-ontology/blob/HEAD/src/mcp.ts ; https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx
10. **Tenant isolation with forced RLS**: an `org_id` column on every table, `ENABLE` plus `FORCE ROW LEVEL SECURITY`, `USING/WITH CHECK (org_id = current_setting('app.org_id', true))`, a non-owner app role, and `SET LOCAL` inside every request transaction. Source: https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/009_multi_tenancy.sql
11. **Markings with mandatory/discretionary semantics**: a user needs every mandatory marking and at least one of the discretionary markings present; unknown markings count as mandatory. Grant roles *on resources* (owner, editor, viewer, discoverer), inherited by contents. Sources: https://github.com/Przyval/openfoundry/blob/HEAD/packages/markings/src/marking-evaluator.ts ; 014_resource_authorization.sql
12. **Metric access policy object**: per group `memberLevel{includes|excludes}`, `memberMasking`, `rowLevel{filters|allowAll}` and `conditions`. Policies are OR-ed within an object type and AND-ed across types. Anything unresolvable is denied by injecting `1 = 0`. Source: https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-schema-compiler/src/compiler/CubeValidator.ts and CompilerApi.ts
13. **Fan-out-safe metric joins**: give each object-type key an entity type (primary, unique, natural, foreign), allow only the joins in MetricFlow's matrix, and cap joins at two hops. Support simple, ratio, cumulative, derived and conversion metrics plus `non_additive_dimension`. Source: https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py
14. **`ai_context` on every object, property, metric and action**: `{instructions, synonyms[], examples[]}`, exported to Ossie later. Source: https://github.com/open-semantic-interchange/OSI/blob/HEAD/core-spec/spec.md ("AI Context Structure")
15. **Bi-temporal facts**: each fact row has `valid_at`, `invalid_at`, `created_at`, `expired_at`, `reference_time` and `episodes[]` (provenance). Contradictions are adjudicated by an LLM using integer indices, then the old fact is closed by a deterministic rule. Add the future-tense normaliser. Sources: https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/edges.py ; edge_operations.py `resolve_edge_contradictions`; temporal_edge_utils.py
16. **Graph in plain Postgres tables**: `graph_nodes(tenant, id, props jsonb)` and `graph_edges(tenant, src, tgt, props jsonb)` with a canonical edge order, JSONB merge for node upserts, and a BFS capped by `max_nodes` in SQL. Source: https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py
17. **Two-phase ingestion**. Phase A (chunk, store lineage, embed, no LLM) is usable at once. Phase B (LLM extraction) is cached by chunk hash so it can be replayed. Deduplicate on `(source_id, source_type, unit_id)`. Source (design only, ELv2): https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md
18. **Identity and index metadata on types**: `identity_fields` derive deterministic ids so repeated extractions merge, and `index_fields` decide what is embedded. Source: https://github.com/topoteretes/cognee/blob/HEAD/cognee/infrastructure/engine/models/DataPoint.py
19. **Rule-derived links**: a link type whose instances are computed from a graph pattern plus an aggregate constraint (for example "Person controls App if they own more than 5 devices that installed it"). Source: https://github.com/OpenSPG/KAG/blob/HEAD/kag/examples/riskmining/schema/RiskMining.schema
20. **SOP steps with an executor and a verifier**: each step has a subject and description, an executor agent, an optional verifier agent and `max_attempts`, with persistent run state and parking on human input. Source: https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py
21. **Agent hooks and permission decisions**: PreToolUse and PostToolUse hooks, plus permission results of the form allow (optionally rewriting the input) or deny (with a message and an interrupt flag). Store sessions as JSONB entries in one table. Source: https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py
22. **Error taxonomy and log safety**: a closed set of error codes (PERMISSION_DENIED, INVALID_ARGUMENT, NOT_FOUND, CONFLICT, FAILED_PRECONDITION, INTERNAL, TIMEOUT, and so on), each error split into safe and unsafe args, and a per-field `safety` flag that drives redaction in audit logs and traces. Source: https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md
23. **Schema change events through a transactional outbox**: every change to the ontology definition writes `{schema_version, event_type, aggregate, aggregate_id, actor_id, occurred_at, before, after}` to an outbox table in the same transaction. Source (design only): https://github.com/CapTrix/openfoundry/blob/HEAD/services/ontology-actions-service/internal/repo/events.go
24. **Ontology branches and proposals**: a branch is a copy of the schema definitions, compared by name with `{added, removed, changed}`; a merge proposal is reviewed before it is applied to main; instance data is not branched. Source: https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/branches.py
25. **Action-level evaluation**:
    1. Seed the database.
    2. Replay a reference action list to get the target state.
    3. Grade the agent on end-state equality times required-information-communicated.
    4. Report pass^k over k trials.

    Type every tool READ or WRITE. Source: https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py

---

## What cannot or should not be copied

- **Code from AGPL, ELv2 and source-available projects in a closed-source SaaS.** CapTrix/openfoundry (AGPL-3.0: the network-use clause would force you to publish your source), Nango, the Airbyte platform and many of its connectors, mycontext, the Phoenix server (all ELv2: no offering as a hosted service), and Pipedream (no commercial use). Design ideas are fine; copied code is not. [Fact] for the licence texts; [Inference] for the legal reading.
- **Claude Agent SDK as the core loop.** Its licence is Anthropic's Commercial Terms, and it is a Claude-only runtime. It cannot carry GPT or Qwen turns, which the brief requires. [Fact]/[Inference]
- **Letta V1 server code.** The maintainers explicitly forbid using the archive branch for new applications or comparisons. [Fact]
- **mem0's temporal and decay features.** They are not in the OSS SDK. Relying on mem0 for "what was true when" would require its paid platform. [Fact]
- **foundry-ontology-open's rule engine.** It uses `eval()` and its permission checks are placeholders. [Fact]
- **Przyval/openfoundry's action engine.** Submission criteria are hard-coded to empty. It is an emulator, not a reference for action logic. [Fact]
- **Ossie as the internal model.** It is unreleased (0.3.0.dev0), has explicit breaking changes, and has no actions, rules or permissions. [Fact]
- **Graphiti, KAG/OpenSPG and GraphRAG as runtime dependencies.** Each needs Python plus a graph database or a heavy batch pipeline. That is a poor fit for a TypeScript+Postgres solo build, and their value is in their data models, which are copyable. [Inference]
- **Palantir's IR names verbatim.** The shapes are Apache-2.0 code and fine to mirror, but Palantir trademarks ("Foundry", "AIP", "Ontology Manager") should not appear in your product. [Inference]
- **Nango's `providers.yaml` as a data file.** The file is ELv2-licensed as part of the repository. Re-deriving OAuth endpoints from each provider's own docs is safer than copying the file. [Inference]

---

## Recommended bill of materials (TypeScript + PostgreSQL, one person)

**Depend on (permissive licence, TypeScript-callable):**

| Need | Dependency | Licence | Note |
|---|---|---|---|
| Database | PostgreSQL 16/17 + `pgvector` | PostgreSQL / PostgreSQL-style | Holds everything: model, objects, graph, vectors, audit, jobs |
| Schemas | `zod` | MIT | One schema serves validation, MCP tool input and forms (operational-ontology pattern) |
| Agent interface | `@modelcontextprotocol/server` v2 (2.4.0) | Apache-2.0 | Implements the stateless 2026-07-28 spec [Fact] |
| Durable workflows | `@dbos-inc/dbos-transact` (MIT core) | MIT (enterprise features proprietary) | Write-back steps, long agent tasks; avoid the gated features [Fact] |
| Simple queues (alternative) | `pg-boss` 12 | MIT | If DBOS feels too heavy |
| Action authorization | `@cedar-policy/cedar-wasm` 4.15 | Apache-2.0 | Yes/no decisions; no resource queries in the wasm build [Fact] |
| Decision tables (optional) | `@gorules/zen-engine` 2.1.12 | MIT | Business-editable tables with traces |
| Metric compilation (optional) | MetricFlow sidecar binary | Apache-2.0 | NDJSON `explain` → Postgres SQL [Fact]; Python-built binary |
| Document parsing | Docling as an HTTP service | MIT | Separate container [Inference] |
| Entity resolution (batch) | Splink 5 against Postgres | MIT | Python batch job [Fact] |
| Prompt/tool regression | promptfoo | MIT | CI only |
| Agent graph (optional) | `@langchain/langgraph` + `@langchain/langgraph-checkpoint-postgres` | MIT | Only if you want its interrupt and checkpoint machinery |
| Model access | Provider SDKs (Anthropic, OpenAI, DashScope/OpenAI-compatible for Qwen) | Vendor terms | Keep your own loop model-agnostic [Inference] |

**Copy the design of (write it yourself in TypeScript):**
- Ontology definition and runtime: operational-ontology (model-as-data, authority, action gate, MCP generation).
- Action IR, validate/apply, submission-criteria conditions, ObjectSet algebra: osdk-ts and foundry-platform-python.
- Action authorization-policy fields and the schema outbox: CapTrix (AGPL, so design only).
- Tenant RLS, resource-role grants, markings: Przyval/openfoundry.
- Metric definitions and join rules: MetricFlow (if you do not use the sidecar).
- Metric and row access policies: Cube.
- AI context fields: Ossie.
- Temporal facts and invalidation: Graphiti.
- Graph tables and BFS: LightRAG `pgtable_impl`.
- Identity and index fields: Cognee.
- Two-phase ingestion: mycontext (ELv2, so design only).
- Rule-derived links and bilingual labels: KAG.
- SOP executor/verifier: AgentScope.
- Hooks, permission decisions, session store: Claude Agent SDK.
- Error codes and log safety: Conjure.
- Branches and proposals, confirm-preview: OntoForge.
- Connector config grammar (pagination, incremental cursors, parent-child resources): dlt `rest_api`.
- Evaluation: tau2-bench.

**Write from scratch:**
- The Postgres schema for definitions (versioned), objects, links, overlay, audit and outbox.
- The ObjectSet-to-SQL compiler with marking and RLS predicates folded in.
- The action runtime with idempotency and pending-invocation records.
- The 5–10 connectors and OAuth flows your first customers need.
- The model-agnostic agent loop (tool calling across Claude, GPT and Qwen).
- The internal versus external agent separation (different tool sets generated from the same model with different visibility and marking filters).
- The ontology editor UI.
- Trace storage, either OpenTelemetry to your own table or self-hosted Phoenix for internal use.

---

## Source files most worth reading, by pattern

| Pattern | File |
|---|---|
| Action gate, authority, preflight, audit | https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts |
| Failure semantics, concurrency limits | https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md |
| Model → MCP tools | https://github.com/gura105/operational-ontology/blob/HEAD/src/mcp.ts |
| Foundry ontology IR (rules, conditions) | https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts |
| Ontology-as-code API | https://github.com/palantir/osdk-ts/tree/HEAD/packages/maker/src/api |
| Object and action metadata | https://github.com/palantir/osdk-ts/blob/HEAD/packages/api/src/ontology/ObjectTypeDefinition.ts and ActionDefinition.ts |
| Foundry v2 REST models (apply, validate, ObjectSet) | https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py |
| Error taxonomy, log safety | https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md |
| Action type with auth policy (design only) | https://github.com/CapTrix/openfoundry/blob/HEAD/libs/ontology-kernel/models/action_type.go |
| Postgres RLS multi-tenancy | https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/009_multi_tenancy.sql |
| Resource roles + markings tables | https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/014_resource_authorization.sql |
| Marking evaluation | https://github.com/Przyval/openfoundry/blob/HEAD/packages/markings/src/marking-evaluator.ts |
| Confirm-preview, JSON rules | https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/actions.py |
| Metric types | https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantic_interfaces/protocols/metric.py |
| Fan-out join matrix | https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py |
| Metric → dataflow plan | https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow/dataflow/builder/dataflow_plan_builder.py |
| Compile-only sidecar protocol | https://github.com/dbt-labs/metricflow/blob/HEAD/sidecar/mf_ipc_protocol.py |
| Access policy schema | https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-schema-compiler/src/compiler/CubeValidator.ts |
| Row-level security combination | https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-server-core/src/core/CompilerApi.ts |
| Symmetric aggregates | https://github.com/malloydata/malloy/blob/HEAD/packages/malloy/src/dialect/shifty_sum_distinct.ts |
| Semantic interchange + ai_context | https://github.com/open-semantic-interchange/OSI/blob/HEAD/core-spec/spec.md |
| Ontology interchange | https://github.com/open-semantic-interchange/OSI/blob/HEAD/ontology/ontology.md |
| Temporal edge schema | https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/edges.py |
| Contradiction + invalidation | https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py |
| Future-tense normalisation | https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/temporal_edge_utils.py |
| Graph in plain Postgres | https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py |
| pgvector + provenance DDL | https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/postgres_impl.py (TABLES dict near the end) |
| Typed nodes with identity/index fields | https://github.com/topoteretes/cognee/blob/HEAD/cognee/infrastructure/engine/models/DataPoint.py |
| Grant-only-what-you-hold capabilities | https://github.com/topoteretes/cognee/blob/HEAD/cognee/modules/users/permissions/permission_types.py |
| Additive memory pipeline | https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/main.py (`_add_to_vector_store`) |
| Community reports schema | https://github.com/microsoft/graphrag/blob/HEAD/packages/graphrag/graphrag/data_model/schemas.py |
| Rule-derived relations, bilingual schema | https://github.com/OpenSPG/KAG/blob/HEAD/kag/examples/riskmining/schema/RiskMining.schema |
| Two-phase ingestion | https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md |
| Partial evaluation / resource queries | https://github.com/cedar-policy/cedar/blob/HEAD/cedar-policy/src/api/tpe.rs |
| Policy → SQL WHERE | https://github.com/open-policy-agent/opa/blob/HEAD/v1/rego/compile/compile.go |
| Relationship tuples in Postgres | https://github.com/openfga/openfga/blob/HEAD/assets/migrations/postgres/001_initialize_schema.sql |
| MCP 2026-07-28 changes | https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx |
| Tool annotations | https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/schema/2026-07-28/schema.ts |
| Hooks and permission results | https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py |
| Session store in Postgres | https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts |
| Checkpoint tables | https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts |
| SOP executor/verifier | https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py |
| Durable workflow tables | https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts |
| Enterprise-gated features | https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/enterprise.ts |
| Queue schema | https://github.com/timgit/pg-boss/blob/HEAD/src/plans.ts |
| Declarative REST connector config | https://github.com/dlt-hub/dlt/blob/HEAD/dlt/sources/rest_api/typing.py |
| Low-code connector schema | https://github.com/airbytehq/airbyte-python-cdk/blob/HEAD/airbyte_cdk/sources/declarative/declarative_component_schema.yaml |
| Evaluation rewards | https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py |
| pass^k | https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/metrics/agent_metrics.py |
| Decision graph node kinds | https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs |

---

## Open questions and unverified items

- **CapTrix's upstream.** The README points at `github.com/openfoundry/openfoundry-go`, and the commit history mentions `DioCrafts`. Neither could be cloned (authentication required), and web search was unavailable. Whether an upstream exists publicly, and under what licence, is [Unverified].
- **Activity metrics.** Stars, contributor counts and release cadence were not fetched (no GitHub API, no web search). Activity is judged only from last-commit dates.
- **MetricFlow's relicensing.** The LICENSE file at commit 013590e is Apache-2.0. When and why it changed from its earlier licence was not checked against a primary announcement. [Unverified]
- **Whether Cedar's `tpe` feature or the resource-query APIs will reach `cedar-wasm`.** Not verified; the current build file excludes them. [Fact for now]
- **The ELv2 reading for self-hosting Nango or Phoenix inside a SaaS.** This is my interpretation and needs legal review. [Inference]
- **MCP spec status.** Whether 2026-07-28 is the "current" version on modelcontextprotocol.io was not checked on the web. The TypeScript SDK README calls v2 "the stable release line" implementing it. [Fact for the README]
- **Postgres RLS behaviour** (`current_setting(..., true)` returning NULL, `SET LOCAL` scope, `FORCE ROW LEVEL SECURITY` and table owners). This comes from my knowledge of Postgres, not from docs re-read in this session. [Unverified this session]
- **Qwen through the Claude Agent SDK.** Whether DashScope exposes an Anthropic-compatible endpoint that the SDK could target was not checked. [Unverified]
- **Docling-serve.** Its HTTP API contract and container size were not inspected. Only the `service_client` module's existence was seen. [Unverified]
- **Accuracy and quality of Graphiti's invalidation, mem0's additive extraction and LightRAG's modes.** No benchmark was run (the brief forbids execution). Only the mechanisms are reported.

---

## Sources

Ranked by usefulness. All were read as source code cloned on 2026-11-21; the date given is the last commit.

1. https://github.com/gura105/operational-ontology (2026-11-19): the clearest runnable reference for the action gate, authority declarations and model-to-MCP generation.
2. https://github.com/palantir/osdk-ts (2026-11-20): Foundry's ontology metadata IR (logic rules, conditions, submission criteria) and the ontology-as-code maker, Apache-2.0.
3. https://github.com/palantir/foundry-platform-python (2026-11-20): the v2 ontology REST surface, including validate/apply modes and the ObjectSet algebra.
4. https://github.com/dbt-labs/metricflow (2026-11-16): the semantic model spec, fan-out-safe join rules, the dataflow compiler and the compile-only sidecar.
5. https://github.com/getzep/graphiti (2026-11-20): bi-temporal edges and the contradiction/invalidation algorithm.
6. https://github.com/cube-js/cube (2026-11-20): access policies (member, row, masking) and how they combine.
7. https://github.com/Przyval/openfoundry (2026-11-03): Postgres RLS, resource-role and marking migrations in TypeScript.
8. https://github.com/HKUDS/LightRAG (2026-11-21): Postgres-native graph tables and pgvector DDL with provenance.
9. https://github.com/modelcontextprotocol/modelcontextprotocol (2026-11-20): the 2026-07-28 stateless spec and tool annotations.
10. https://github.com/sierra-research/tau2-bench (2026-11-10): the action-level evaluation reward model and pass^k.
11. https://github.com/dbos-inc/dbos-transact-ts (2026-11-18): Postgres-only durable workflows; the enterprise feature gate.
12. https://github.com/cedar-policy/cedar (2026-11-20): partial evaluation and resource queries; what the wasm build contains.
13. https://github.com/open-policy-agent/opa (2026-11-20): policy-to-SQL compile targets.
14. https://github.com/open-semantic-interchange/OSI (2026-11-20): the Ossie core and ontology specs; the `ai_context` shape.
15. https://github.com/topoteretes/cognee (2026-11-20): the DataPoint identity/index-fields pattern; dataset ACL and capabilities.
16. https://github.com/OpenSPG/KAG (2026-11-19): the bilingual schema DSL with rule-derived relations.
17. https://github.com/openTrinity/mycontext (2026-08-31): two-phase ingestion; DingTalk/Feishu connectors (ELv2).
18. https://github.com/CapTrix/openfoundry (2026-05-20): action authorization-policy fields and schema outbox (AGPL, design only).
19. https://github.com/jachenms/OntoForge (2026-10-24): confirm-preview, JSON rule vocabulary, schema branches; a Chinese reverse-analysis of Foundry docs.
20. https://github.com/agentscope-ai/agentscope (2026-11-20): SOP executor/verifier steps, permission rules.
21. https://github.com/anthropics/claude-agent-sdk-typescript and https://github.com/anthropics/claude-agent-sdk-python (2026-11-19): licence terms, the hook taxonomy, the session-store contract.
22. https://github.com/modelcontextprotocol/typescript-sdk (2026-11-18): the v2 package split and the spec version implemented.
23. https://github.com/openfga/openfga (2026-11-20): the relationship-tuple schema in Postgres.
24. https://github.com/mem0ai/mem0 (2026-11-18): the additive memory pipeline, open-core boundary and telemetry default.
25. https://github.com/palantir/conjure (2026-11-18): the error taxonomy and log-safety annotations.
26. https://github.com/gorules/zen (2026-11-19): decision-graph node kinds, hit policies, the policy-document engine.
27. https://github.com/langchain-ai/langgraphjs (2026-11-20): Postgres checkpointer tables and interrupts.
28. https://github.com/timgit/pg-boss (2026-11-18): the partitioned job-queue schema.
29. https://github.com/dlt-hub/dlt (2026-11-17): the declarative REST source grammar.
30. https://github.com/NangoHQ/nango (2026-11-20): the provider catalogue format; ELv2 licence.
31. https://github.com/airbytehq/airbyte and https://github.com/airbytehq/airbyte-python-cdk (2026-11-17): the licence split; the low-code manifest schema.
32. https://github.com/moj-analytical-services/splink (2026-11-11): probabilistic entity resolution with a Postgres backend.
33. https://github.com/microsoft/graphrag (2026-11-01): the community-report data model.
34. https://github.com/malloydata/malloy (2026-11-18): symmetric aggregates.
35. https://github.com/langfuse/langfuse (2026-11-20), https://github.com/Arize-ai/phoenix (2026-11-20), https://github.com/promptfoo/promptfoo (2026-11-20): observability and evaluation licensing and footprint.
36. https://github.com/letta-ai/letta (2026-10-18) and https://github.com/letta-ai/letta-code (2026-11-20): the archive status; git-backed memory.
37. https://github.com/docling-project/docling and https://github.com/Unstructured-IO/unstructured (2026-11-20 / 2026-11-19): document parsing options.
38. https://github.com/OSU-NLP-Group/HippoRAG (2026-10-06): personalized-PageRank retrieval (research grade).
39. https://github.com/temporalio/temporal and https://github.com/temporalio/sdk-typescript (2026-11-20 / 2026-11-19): persistence options and operational weight.
40. https://github.com/QwenLM/Qwen-Agent (2026-03-04): Qwen function-calling prompt templates.
41. https://github.com/CacheControl/json-rules-engine (2026-02-16), https://github.com/bpmn-io/dmn-js (2026-11-18), https://github.com/nikku/feelin (2026-11-19): lightweight rules and the DMN/FEEL options.
42. https://github.com/OpenSPG/openspg (2025-06-29): the Java server behind KAG; idle.
43. https://github.com/smilebank7/OpenFoundry (2026-02-22) and https://github.com/cloudbadal007/foundry-ontology-open (2026-07-19): included for completeness; not recommended.
44. https://github.com/PipedreamHQ/pipedream (2026-11-20): read only for its licence, which excludes commercial use.
45. https://github.com/sierra-research/tau-bench (2026-03-18): the original benchmark, superseded by tau2.
