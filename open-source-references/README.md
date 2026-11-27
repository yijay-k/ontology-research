# Open-source references

One file per repository or project. Each file starts with a header table: repository link, why it matters, what to take, what not to copy, which engineering components it feeds, and how strong the evidence is. Below the header is the full research text, copied from the original code study (doc 14) and the Phase 2 repository audits.

| File | Project | Why it matters | Feeds |
|---|---|---|---|
| [agentscope-qwen-agent](agentscope-qwen-agent.md) | AgentScope and Qwen-Agent (Alibaba) | Alibaba's agent frameworks; AgentScope's SOP module is a close analogue of Lingyang-style SOP agents. | 08-agent-platform |
| [alibaba-umodel](alibaba-umodel.md) | alibaba/UnifiedModel (UModel) | Alibaba Cloud's open ontology runtime (UnifiedModel): definitions separate from instances, typed query surface, MCP agent gateway. | 03-ontology-engine, 03-ontology-engine, 04-query-and-metrics, 08-agent-platform |
| [apache-ossie](apache-ossie.md) | Apache Ossie (formerly Open Semantic Interchange) | Emerging open interchange format for semantic models and ontologies (datasets, relationships, metrics, ai_context, concept mappings). | 03-ontology-engine |
| [cedar](cedar.md) | cedar-policy/cedar | Fast, analysable policy language for yes/no authorization decisions, available as WebAssembly for TypeScript. | 01-security |
| [claude-agent-sdk](claude-agent-sdk.md) | Claude Agent SDK (TypeScript and Python) | Shows a mature hook and permission surface for agent tool use. | 08-agent-platform |
| [cognee](cognee.md) | topoteretes/cognee | Shows graph + vector storage keyed by deterministic identity, with dataset-level permissions. | 06-knowledge-and-evidence |
| [cube](cube.md) | cube-js/cube | The most complete open design for 'who sees which metric columns and rows'. | 04-query-and-metrics |
| [datahub](datahub.md) | datahub-project/datahub | Metadata/catalog platform: shows the source → workunit → emitter ingestion model with backpressure. | 02-data-platform |
| [dbos](dbos.md) | dbos-inc/dbos-transact-ts | Durable workflows as a library on PostgreSQL — the best fit for one person on Postgres. | 09-workflows |
| [dlt-airbyte-and-connectors](dlt-airbyte-and-connectors.md) | dlt, Airbyte, Nango, Pipedream (connectors and OAuth) | How production connector frameworks handle cursors, checkpoints, CDC and OAuth — and their licences. | 02-data-platform |
| [docling-unstructured](docling-unstructured.md) | Docling and Unstructured (document parsing) | Permissive document parsers with layout and table structure. | 06-knowledge-and-evidence |
| [durable-execution-comparison](durable-execution-comparison.md) | Durable execution compared: Temporal vs DBOS vs pg-boss | Side-by-side of Temporal, DBOS and pg-boss for this product. | 09-workflows |
| [eval-and-observability-tools](eval-and-observability-tools.md) | tau-bench, tau2-bench, Langfuse, promptfoo, Phoenix | tau2-bench defines action-level agent evaluation precisely; Langfuse/Phoenix/promptfoo are the tracing and regression options. | 08-agent-platform |
| [graphiti](graphiti.md) | getzep/graphiti | The clearest temporal fact model: each fact has world time and record time, and contradictions close old facts instead of overwriting. | 06-knowledge-and-evidence, 06-knowledge-and-evidence |
| [graphrag](graphrag.md) | microsoft/graphrag | Reference for hierarchical community summaries that answer 'global' questions over a corpus. | 06-knowledge-and-evidence |
| [hipporag](hipporag.md) | OSU-NLP-Group/HippoRAG | Reference technique for multi-hop recall (personalized PageRank over extracted facts). | 06-knowledge-and-evidence |
| [langgraph](langgraph.md) | LangGraph (Python and JS) | Model-agnostic TypeScript agent graph framework with a Postgres checkpointer and interrupts for human review. | 08-agent-platform |
| [letta](letta.md) | letta-ai/letta | Reference for versioned, diff-tracked agent memory. | 06-knowledge-and-evidence |
| [lightrag](lightrag.md) | HKUDS/LightRAG | The most directly copyable knowledge-graph-in-Postgres design. | 06-knowledge-and-evidence |
| [malloy](malloy.md) | malloydata/malloy | Shows how to aggregate correctly over fanned-out joins. | 04-query-and-metrics |
| [mem0](mem0.md) | mem0ai/mem0 | Widely used agent-memory library; shows extraction/dedup pipeline tricks. | 06-knowledge-and-evidence |
| [metricflow](metricflow.md) | dbt-labs/metricflow | Apache-2.0 metric compiler that turns metric names, group-bys and filters into SQL, with a typed dataflow plan and join-safety rules. | 04-query-and-metrics |
| [model-context-protocol](model-context-protocol.md) | Model Context Protocol (spec and SDKs) | The standard interface for exposing ontology tools to external agents; the 2026-07-28 revision is stateless. | 08-agent-platform |
| [mycontext](mycontext.md) | openTrinity/mycontext | Alibaba-ecosystem work-context layer with DingTalk/Feishu ingestion and a two-phase knowledge graph build. | 06-knowledge-and-evidence |
| [opa](opa.md) | open-policy-agent/opa | Policy engine whose compile API turns policies into SQL WHERE clauses. | 01-security |
| [openfga](openfga.md) | openfga/openfga | Zanzibar-style relationship-based authorization with a Postgres tuple store. | 01-security |
| [openfoundry](openfoundry.md) | The "open Foundry" family (CapTrix/openfoundry and forks) | The only large open re-implementations of Foundry; useful for how action types, policies, outbox and tenant RLS can be laid out. | 01-security, 03-ontology-engine, 03-ontology-engine, 05-actions-and-rules |
| [openspg-kag](openspg-kag.md) | OpenSPG and KAG (Ant Group) | Ant Group's typed knowledge graph with a schema DSL, rule-derived relations and a planner/executor solver. | 04-query-and-metrics, 06-knowledge-and-evidence |
| [operational-ontology](operational-ontology.md) | gura105/operational-ontology | The clearest small implementation of the action gate: model as data, preconditions, dry run in a rolled-back transaction, writeback before local commit, audit of every attempt. | 05-actions-and-rules |
| [palantir-osdk](palantir-osdk.md) | Palantir public SDKs (osdk-ts, foundry-platform-python, conjure) | Palantir's own Apache-2.0 SDKs are the most authoritative public evidence of Foundry's ontology metadata, action and ObjectSet formats. | 03-ontology-engine, 05-actions-and-rules |
| [postgres-rls](postgres-rls.md) | PostgreSQL row-level security for multi-tenant apps | The database-enforced tenant isolation pattern, seen in full in Przyval/openfoundry. | 01-security |
| [rules-engines](rules-engines.md) | GoRules Zen, json-rules-engine, DMN | Options for business-editable decision tables and rule evaluation with traces. | 05-actions-and-rules |
| [splink](splink.md) | moj-analytical-services/splink | Production-grade probabilistic entity resolution (Fellegi–Sunter). | 02-data-platform |
| [temporal](temporal.md) | temporalio/temporal | The reference durable-workflow engine: event-history replay with deterministic orchestration. | 09-workflows |
| [typedb](typedb.md) | TypeDB | A strongly typed semantic database: schema declarations, typed query analysis and explicit snapshot concurrency. | 03-ontology-engine |
| [cross-repo-patterns](cross-repo-patterns.md) | Patterns seen across all audited repositories | The 13 patterns every audited codebase agrees on | 00-overview and most layers |

## Scope of the original code study

Scope note (21 November 2026). This document reports what 60+ open-source repositories actually implement, read from their source code rather than their READMEs. Every repository was cloned at depth 1 under `/home/claude/research/_code/` on 21 November 2026 and read without executing anything. The date given for each repository is the date of the most recent commit at the time of cloning, and it is the only activity signal used here. Star counts and contributor counts could not be fetched: the GitHub API was not available to this session and the web-search budget had already run out, so nothing in this file comes from a live web page. Each claim cites the file it was read from as a `github.com/.../blob/HEAD/<path>` link, so readers can check it against the current default branch. The target is a TypeScript and PostgreSQL product built by one person that holds a company's business objects, metrics, rules, permissions and allowed actions, and puts AI agents (Claude, GPT, Qwen) on top of that model.

Labels: [Fact] means I read it in the cited file. [Vendor claim] means the project's README or docs say it about itself. [Inference] is my own reasoning. [Unverified] means I could not check it.

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

## Additional security design note

See [`../09-security-and-governance/tenant-isolation-threat-model.md`](../engineering/01-security/threat-model.md) for a proposed tenant/matter threat model and negative-test matrix.

## Audit caveats

- Source links in Phase 2 deep dives are pinned to commit SHAs. Phase 1 source links may still use branch paths and should be re-pinned before an implementation decision.
- Some repositories have only partial code coverage. The coverage ledger states the gaps.
- No code was built and no tests were executed in this research pass. Test files read are explicitly labelled source-inspected only.
- A public repository cannot reveal a company's complete hosted backend or internal systems.
