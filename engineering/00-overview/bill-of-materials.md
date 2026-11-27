# Bill of materials

**Layer:** [00-overview](README.md) · **What it is:** Every building block the research recommends for a TypeScript + PostgreSQL build: depend on, copy the design, or write from scratch — with licence and the source file to read.

> The table is copied unchanged from [general-references/33-map-context-code-integration.md § 18](../../general-references/33-map-context-code-integration.md#18-complete-bill-of-materials). The verification table below it records what was re-checked against the repositories on 28 Nov 2026.

## Bill of materials (from map 4, § 18)

| Component | Choice | Depend on / copy design / write from scratch | Licence | Reason | Source file worth reading |
|---|---|---|---|---|---|
| Database | PostgreSQL 16/17 + pgvector | Depend on | PostgreSQL / PostgreSQL-style | Holds model, objects, graph, vectors, audit, jobs (doc 14 BOM) | https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/postgres_impl.py |
| Schemas and validation | `zod` | Depend on | MIT | One schema for validation, MCP input and forms (doc 14) | https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts |
| Model schema (objects, links, metrics, ai_context, verified queries, instructions) | Own Zod model copying Ossie, Snowflake, dbt, Fabric fields | Copy design | n/a (Ossie Apache-2.0) | Converged object set (doc 11) | https://github.com/apache/ossie/blob/main/core-spec/spec.md |
| File format | Ossie ontology + semantic + mapping YAML, plus own actions and policies YAML | Copy design; write exporter | Apache-2.0 spec | Portable, Git-reviewable; Ossie lacks actions and permissions | https://github.com/apache/ossie/blob/main/ontology/ontology.md |
| Branches and proposals | OntoForge pattern | Copy design | MIT | Reviewed schema changes, instance data not branched | https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/branches.py |
| Schema change events | Transactional outbox | Copy design (AGPL source) | AGPL-3.0 source; own code | Before/after envelopes in same transaction | https://github.com/CapTrix/openfoundry/blob/HEAD/services/ontology-actions-service/internal/repo/events.go |
| Tenant isolation | Forced Postgres RLS + `SET LOCAL` | Copy design | Apache-2.0 source | Database refuses cross-tenant rows | https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/009_multi_tenancy.sql |
| Markings and resource roles | Mandatory/discretionary evaluator + grants table | Copy design | Apache-2.0 source | Label filters for agents and documents | https://github.com/Przyval/openfoundry/blob/HEAD/packages/markings/src/marking-evaluator.ts |
| Object access policies | Cube policy object compiled to SQL predicates | Copy design; write compiler | Apache-2.0 source | Most complete open design for rows, members, masking | https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-server-core/src/core/CompilerApi.ts |
| Action authorisation | `@cedar-policy/cedar-wasm` 4.15 | Depend on | Apache-2.0 | Yes/no decisions; no resource queries in wasm | https://github.com/cedar-policy/cedar/blob/HEAD/cedar-wasm/Cargo.toml |
| Relationship sharing (v2) | OpenFGA tuple table | Copy design | Apache-2.0 | Only if sharing graphs get deep | https://github.com/openfga/openfga/blob/HEAD/assets/migrations/postgres/001_initialize_schema.sql |
| Agent identity | Agent principals, invoker or per-step service credential, dual-principal audit | Write from scratch, copying Glean design | n/a | Agent is its own principal; no run-as-creator | https://docs.glean.com/administration/agent-identity/overview |
| OAuth, token rotation, webhook routing, proxy | Nango Cloud pay-as-you-go, own OAuth apps | Depend on (buy) | ELv2 code, used as cloud service | $50/mo floor; prebuilt ledger and email functions | https://github.com/NangoHQ/nango/blob/master/docs/snippets/generated/xero/PreBuiltUseCases.mdx |
| Sync engine | TypeScript connector contract + per-stream opaque state | Write from scratch, copying Airbyte protocol and dlt grammar | n/a (Airbyte docs ELv2 read only; dlt Apache-2.0) | Multi-tenant, small, owned edge cases | https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md |
| Ledger read rules | Xero, QBO, NetSuite rules from Airbyte manifests | Copy design (read as specification) | ELv2 (do not ship code) | Cursor, filters, budgets, soft deletes, token rotation | https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml |
| Ledger API access | Xero tier, Intuit Builder→Silver, NetSuite customer licence | Depend on (pay vendors) | Commercial terms | Unavoidable; Xero no-AI-training clause | https://developer.xero.com/faq/pricing-and-policy-updates |
| Long-tail ledgers (MYOB, QB Desktop, Sage 50) | Rutter, only on demand | Depend on (buy) | Commercial | Broadest ledger list | https://www.rutter.com/accounting |
| Email | Gmail API and Microsoft Graph direct, Nango tokens; Nylas fallback | Write from scratch | Provider terms | Send from customer's mailbox; `history.list`/`watch`, delta queries | https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/google-mail/webhooks.mdx |
| Document parsing | Docling HTTP service; Reducto or LlamaParse for scans | Depend on | MIT; commercial | Remittance PDFs | https://github.com/docling-project/docling/blob/HEAD/pyproject.toml |
| Durable workflows | DBOS Transact TS (MIT core, no enterprise features) | Depend on | MIT (enterprise proprietary) | Postgres-only; memoised steps for write-back | https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts |
| Simple queues (alternative) | pg-boss 12 | Depend on (optional) | MIT | If DBOS feels heavy | https://github.com/timgit/pg-boss/blob/HEAD/src/plans.ts |
| Temporal facts | Four-timestamp fact table, index-based LLM adjudication, deterministic invalidation, future-tense normaliser | Copy design | Apache-2.0 source | "What was true when" in Postgres | https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py |
| Graph storage | Two JSONB tables + capped BFS | Copy design | MIT source | No graph database needed | https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py |
| Ingestion of mail and docs | Two-phase (index first, LLM later, cached by chunk hash) | Copy design (ELv2 source) | ELv2 source; own code | Immediate search, replayable extraction | https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md |
| Entity resolution (batch, v2) | Splink 5 against Postgres | Depend on (Python batch) | MIT | Merge customers across ledgers | https://github.com/moj-analytical-services/splink/tree/HEAD/splink/internals |
| Two-tier knowledge | Learned/modeled table, authority score, confidence-gated proposals | Write from scratch, copying Databricks and Google | n/a | Certified knowledge wins | https://docs.databricks.com/aws/en/genie/genie-ontology |
| Context assembly | Six layers, entity-first, budgeted `lookup_context` | Write from scratch, copying OpenAI, Google, ACE | n/a | Small grounded context per agent | https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context |
| Metric compilation | Own TS compiler with MetricFlow join matrix, 2-hop cap, key-grain `AGG` | Write from scratch, copying MetricFlow; sidecar as fallback | Apache-2.0 source | Data lives in own Postgres | https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py |
| Metric compilation fallback | MetricFlow sidecar (`explain` NDJSON) | Depend on (optional) | Apache-2.0 | If own compiler stalls | https://github.com/dbt-labs/metricflow/blob/HEAD/sidecar/mf_ipc_protocol.py |
| Action and condition IR, ObjectSet algebra, validate/apply | Palantir SDK shapes | Copy design | Apache-2.0 | Most authoritative public action format | https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts |
| ObjectSet → SQL compiler | Own compiler with permission predicates folded in | Write from scratch | n/a | Agent query language with no raw SQL | https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py |
| Error taxonomy and log safety | Conjure codes, safe/unsafe args, safety flags | Copy design | Apache-2.0 | Redaction by construction | https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md |
| Action gate | Parse → authorise → preconditions → effects → rolled-back preflight → authority check → pending record → write-back → commit + audit | Write from scratch, copying operational-ontology | MIT source | The only write path | https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md |
| Precondition evaluation | Own TS evaluator of condition IR | Write from scratch | n/a | Rules as JSON, never code strings | https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts |
| Decision tables (v2) | `@gorules/zen-engine` 2.1.12 | Depend on (optional) | MIT | Business-editable tables with traces | https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs |
| Monitoring playbooks | State vs transition conditions compiled into playbook | Copy design | n/a | Reminder triggers that fire once per change | https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent |
| Agent loop | Own model-agnostic loop over Anthropic and OpenAI-compatible (Qwen) SDKs | Write from scratch | Vendor SDK terms | Multi-model requirement | https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py |
| Hooks, permission results, session store | Claude Agent SDK surfaces | Copy design | Commercial Terms (do not depend) | Proven hook taxonomy | https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts |
| SOP procedures | Executor/verifier steps, `max_attempts = 3` | Copy design | Apache-2.0 source | Multi-step collections procedures | https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py |
| Agent graph (optional) | `@langchain/langgraph` + Postgres checkpointer | Depend on (optional) | MIT | Only for interrupt/checkpoint machinery | https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts |
| MCP server | `@modelcontextprotocol/server` v2 2.4.0, generated tools | Depend on + write generator | Apache-2.0 | Stateless 2026-07-28 spec | https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx |
| Answer evaluation | Golden query + golden result | Write from scratch, copying OpenAI | n/a | Compare results, not strings | https://openai.com/index/inside-our-in-house-data-agent/ |
| Action evaluation | tau2 reward (DB × COMMUNICATE), pass^k | Copy design | MIT source | Did the agent do the right thing | https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py |
| Prompt/tool regression | promptfoo | Depend on (CI only) | MIT | TypeScript, CI | https://github.com/promptfoo/promptfoo |
| Tracing | OpenTelemetry spans to own Postgres table; Phoenix optional internally | Write from scratch (Phoenix optional) | Phoenix server ELv2 | Small footprint | https://github.com/langfuse/langfuse/blob/HEAD/docker-compose.yml (to see what to avoid) |
| Ontology editor UI | Own UI with Plan/Act agent and diff preview | Write from scratch, copying Fabric | n/a | Proposal-first authoring | https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent |

## Verification against source, 28 Nov 2026

| Row | Status at pinned commit |
|---|---|
| Database | Not re-checked (PostgreSQL + pgvector). |
| Schemas and validation (zod) | Used by `gura105/operational-ontology@cd8dea3` (v0.6.3, MIT). |
| Model schema / file format (Ossie) | `apache/ossie@34e4d37`, Apache-2.0, spec 0.3.0.dev0 unreleased; canonical repo moved to `apache/ossie`. |
| Tenant isolation, markings and resource roles | `Przyval/openfoundry@96ff1de`, Apache-2.0 — migrations 009, 014, 015 and the marking evaluator present. |
| Object access policies (Cube) | `cube-js/cube@47c6d3b`, Apache-2.0 — policy schema unchanged; validator now warns on empty memberLevel. |
| Action authorisation (cedar-wasm) | `cedar-policy/cedar@1c9d1c2`, 4.15.0, Apache-2.0 — wasm build still has no `tpe`. |
| Relationship sharing (OpenFGA) | `openfga/openfga@d67ba7b`, Apache-2.0 — schema unchanged. |
| Sync engine (dlt grammar, Airbyte protocol) | `dlt-hub/dlt@f85861b` 1.32.0 Apache-2.0. **Airbyte now states its public repos except the protocol are ELv2** — read only, legal check before copying. |
| Document parsing (Docling) | `docling-project/docling@40e490c` **2.154.0**, MIT. |
| Durable workflows (DBOS) | `dbos-inc/dbos-transact-ts@adde4eb`, MIT core — **enterprise gates now include `workflowArchive`; `suspendMode`, `externalStores` renamed**. |
| Simple queues (pg-boss) | `timgit/pg-boss@b2198aa` **12.40.0**, MIT. |
| Temporal facts (Graphiti design) | `getzep/graphiti@343a7bb` **0.32.1**, Apache-2.0 — new embedded Relate backend, still no Postgres driver. |
| Graph storage (LightRAG pgtable) | `HKUDS/LightRAG@47038cf` **1.5.9**, MIT — `pgtable_impl.py` present. |
| Entity resolution (Splink) | `moj-analytical-services/splink@f319070` 5.0.0, MIT. |
| Metric compilation (MetricFlow design + sidecar) | `dbt-labs/metricflow@013590e`, Apache-2.0 — join matrix, 2-hop cap, sidecar protocol v1 unchanged. |
| Action/condition IR, ObjectSet algebra | `palantir/osdk-ts@fe6f8e1`, `palantir/foundry-platform-python@cb2bd92`, Apache-2.0 — 12 rule / 9 condition variants unchanged. |
| Action gate (operational-ontology design) | `gura105/operational-ontology@cd8dea3` v0.6.3 — still no idempotency keys or pending-invocation record (we add them). |
| Decision tables (Zen) | `gorules/zen@62cd159`, MIT — node kinds unchanged. |
| SOP procedures (AgentScope) | `agentscope-ai/agentscope@b76f272`, Apache-2.0. |
| Agent graph (LangGraph JS) | `langchain-ai/langgraphjs@61aad39`, MIT. |
| MCP server | `modelcontextprotocol/typescript-sdk@5ee54ee` — `@modelcontextprotocol/server` 2.4.0; spec 2026-07-28 still latest. |
| Action evaluation (tau2) | `sierra-research/tau2-bench@768f3d8` 2.0.0, MIT — default reward basis `[DB, COMMUNICATE]`. |
| New candidate: UModel schemas | `alibaba/UnifiedModel@5cd06e9`, Apache-2.0, open-sourced 20 May 2026 — EntitySet, Link, confidence, action risk_level, RunbookSet. See [object-type-registry](../03-ontology-engine/object-type-registry.md#implementation-starting-points-from-source-code). |
| Not re-checked | Nango, Rutter, Xero/QBO/NetSuite APIs, Nylas, promptfoo, Phoenix, Langfuse, Claude Agent SDK, conjure, OntoForge, mycontext, CapTrix/openfoundry. |

See also the open-source code study's own bill of materials in [open-source-references/README.md](../../open-source-references/README.md#recommended-bill-of-materials-typescript--postgresql-one-person).
