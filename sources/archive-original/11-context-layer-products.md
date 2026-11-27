# Context layer, ontology and semantic layer products: technical teardown

Scope note (written 21 November 2026). This file covers every major product that, in 2026, claims to hold "the company's model" for AI agents: Microsoft Fabric IQ and its siblings, Databricks Genie Ontology and metric views, Snowflake semantic views and Cortex, the Apache Ossie (formerly Open Semantic Interchange) specification, Google Knowledge Catalog, BigQuery Graph and Looker, OpenAI Frontier and OpenAI's in-house data agent, Salesforce (Tableau Semantics, Agent Context Engine, Agent Script, Testing Center), SAP, ServiceNow, Workday, Oracle, dbt MetricFlow, Cube, AtScale, Malloy, Kyligence, Glean, Atlan, Hebbia, graph vendors (Neo4j, Stardog, TigerGraph, RelationalAI, Timbr, Cognite, C3 AI, Aera), and the "context graph" thesis. For each product I read the official documentation pages and, where possible, the source code: the Apache Ossie spec repo (commit of 20 Nov 2026), the dbt-mcp README and the neo4j-graphrag-python source (v1.24.0, commit of 20 Nov 2026), all cloned under `/home/claude/research/_code/`. Part-way through, the session's shared web-search budget (200 calls) and web-fetch budget (800 per hour) ran out. Because of that, the sections on Stardog, TigerGraph, RelationalAI, Timbr, Cognite, C3 AI, Aera, Hebbia, Kyligence and Glean's graph internals, and parts of Malloy and LookML, rest on prior knowledge, and every such claim is labelled [Unverified]. Labels used: [Fact] with URL, [Vendor claim] with URL, [Inference], [Unverified].

## Key findings

1. **Every big vendor has converged on one object set**: typed entity/table, keyed field, relationship (join path with cardinality), governed metric, synonyms or description for the LLM, verified question-to-query pairs, and free-text instructions. Snowflake semantic views, Databricks metric views plus Genie knowledge store, Fabric ontology, Tableau Semantics, dbt MetricFlow, Cube and Apache Ossie all express this set with near-identical fields. [Inference from the specs below.] For the founder this means the "semantic" half of the product is a solved, copyable schema. Ossie is the open, vendor-neutral version of it.
2. **"Rules" are almost always descriptive text, not executable logic.** Fabric's ontology rules have a name, a natural-language definition, linked concepts and key-value metadata. The docs say outright that the ontology does not run them, and the consumer must interpret and apply them ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules)). Executable conditions live in separate products (the Fabric operations agent, Agent Script). The one exception is the Ossie ontology spec, which has machine-readable `requires` (constraints) and `derived_by` (derivations) expressions ([Fact](https://github.com/apache/ossie/blob/main/ontology/ontology.md)). There is a clear gap for rules that are typed, evaluable and linked to the ontology.
3. **Cold start comes from mining what already exists, never from interviews.** Snowflake Autopilot reads query history, SQL examples, Tableau TWB/TDS files, Power BI PBIX/PBIT files and YAML ([Fact](https://docs.snowflake.com/en/user-guide/views-semantic/autopilot)). Databricks Genie Ontology mines dashboards, SQL queries (including dbt queries in query history), notebooks and Power BI models into "snippets" ([Fact](https://databricks.com/blog/announcing-ga-genie-ontology)). Fabric generates an ontology from Power BI semantic models: tables become entity types, columns become properties, relationships become relationship types, DAX measures become metrics ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models)). Google mines query logs for joins and "golden queries", and mines agent interaction traces for gaps ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/about-context)). OpenAI's internal agent adds code crawling: Codex reads pipeline code to learn what each table means ([Fact](https://openai.com/index/inside-our-in-house-data-agent/)).
4. **The most important new pattern of 2026 is learned knowledge plus authority ranking, with human-modeled knowledge taking precedence.** Databricks keeps auto-extracted "learned knowledge" (snippets that are not editable, each with an authority score derived from source, usage and freshness) separate from "modeled knowledge" (metric views, Pages, certifications). Modeled and certified knowledge wins conflicts ([Fact](https://docs.databricks.com/aws/en/genie/genie-ontology)). Google does the same: auto-proposals carry citations and a confidence score, and anything under a threshold (the example is 85%) or any deletion becomes a steward Change Request ([Vendor claim](https://cloud.google.com/blog/products/data-analytics/knowledge-catalog-self-learning-context-enrichment-for-ai-agents)).
5. **Self-improvement from agent failures is now shipped (in preview).** Google's self-learning enrichment reads agent interaction traces, detects ambiguous lookups, ungrounded metrics and rephrased questions, finds an authoritative answer in connected documents, and stages a fix ([Vendor claim](https://cloud.google.com/blog/products/data-analytics/knowledge-catalog-self-learning-context-enrichment-for-ai-agents)). OpenAI's agent asks the user to save corrections as memories scoped global or personal ([Fact](https://openai.com/index/inside-our-in-house-data-agent/)). Snowflake surfaces suggestions after creation ([Fact](https://docs.snowflake.com/en/user-guide/views-semantic/autopilot)).
6. **Permissions are always delegated and pass-through, and the context layer never grants data access.** Fabric's ontology agent and data agent run on the user's identity ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent)). Google states that context sets do not grant data access ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/context-sets)). Genie snippets inherit Unity Catalog permissions from their source assets ([Fact](https://docs.databricks.com/aws/en/genie/genie-ontology)). Two documented holes are worth avoiding. Databricks snippets from external knowledge sources are visible to all users in the account. The Fabric operations agent executes approved actions with the creator's permissions, not the approver's ([Fact](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent)).
7. **Agent identity is becoming a separate principal.** The Fabric operations agent gets its own Entra Agent ID but runs on-behalf-of its creator ([Fact](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent)). Glean (beta) lets an agent run either as the invoker or on a service credential scoped per tool step, and logs both the agent account and the triggering principal ([Fact](https://docs.glean.com/administration/agent-identity/overview)). OpenAI Frontier gives each "AI coworker" its own identity ([Vendor claim](https://openai.com/index/introducing-openai-frontier)).
8. **MCP is the standard consumption surface, and the tool sets are small.** Fabric's ontology MCP exposes `list_ontology_entity_types`, `search_ontology` and `list_ontology_rules` ([Fact](https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric), [Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules)). Databricks Genie One MCP exposes `genie_ask`, `genie_poll_response`, `genie_get_query_result`, `genie_cancel_response` and `view_ask` (asynchronous, with truncated results) ([Fact](https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp)). Google Knowledge Catalog exposes `search_entries`, `lookup_context` and `lookup_entry` ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/reference/mcp)). dbt exposes `list_metrics`, `get_dimensions`, `get_entities`, `get_dimension_values`, `query_metrics`, `get_metrics_compiled_sql` and `list_saved_queries` ([Fact](https://github.com/dbt-labs/dbt-mcp)). OpenAI's lesson is the same: fewer, consolidated tools work better ([Fact](https://openai.com/index/inside-our-in-house-data-agent/)).
9. **Answering and acting are split into separate products.** Fabric has a read-only data agent (it generates only read queries) and a separate operations agent (it monitors every 5 minutes, evaluates state or transition conditions, and asks for approval in Teams) ([Fact](https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent), [Fact](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent)). Workday routes every agent action through an Agent Gateway that escalates when an action exceeds policy ([Vendor claim](https://blog.workday.com/en-us/four-layers-workday-data-cloud.html)). No product in this set has "actions" as typed first-class members of the ontology, the way Palantir does. [Inference]
10. **Evaluation is built in everywhere and uses the same shape**: a question, an expected (golden) query or outcome, and execution comparison rather than string match. OpenAI compares both the generated SQL and the result data using the Evals API ([Fact](https://openai.com/index/inside-our-in-house-data-agent/)). Salesforce Testing Center checks topic, action and outcome (outcome judged by an LLM) ([Fact](https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce)). Fabric's "Test the ontology" generates representative questions ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models)). Genie Agents have benchmarks.
11. **Decision traces and memory are the frontier no incumbent has solved.** The Foundation Capital context-graph thesis (26 Dec 2025) argues that systems of record store state but not why: exceptions, approvals and precedent. It argues that whoever sits in the execution path can capture this ([Fact](https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context)). Salesforce ACE (preview, Oct 2026) is the nearest incumbent: shared memory of facts, preferences and learnings, with provenance and optional human confirmation ([Vendor claim](https://www.salesforce.com/blog/?p=157012)).
12. **Every incumbent's layer is locked to its own data platform and assumes a mature data estate.** A warehouse, a BI semantic model, query history and certified tables must already exist. A 100 to 1,000 person company running on SaaS apps (CRM, ERP, helpdesk, spreadsheets), with no data team and no warehouse, cannot cold-start any of them. [Inference] This is the clearest opening.
13. **Hard numeric limits show the scale these layers are tuned for.** Genie Agent: 100 instructions, 200 knowledge snippets, entity matching on 120 columns of up to 1,024 values each ([Fact](https://docs.databricks.com/aws/en/genie-agents/tune-quality)). Fabric data agent: 5 sources, 100 examples per source, answers capped at 25 rows by 25 columns ([Fact](https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent)). Snowflake recommends fewer than 10 tables and no more than 50 columns per semantic view ([Fact](https://docs.snowflake.com/en/user-guide/views-semantic/autopilot)). Google LookupContext: 10 resources per request with a soft character budget ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context)). The design lesson is to keep each agent's context small and scoped by domain.
14. **Apache Ossie is the only portable format, and it now has an ontology layer.** It defines separate ontology, semantic model and mapping documents. The ontology spec uses ORM-style fact-based modeling: concepts, n-ary relationships with roles, `verbalizes` patterns, `identify_by`, `requires`, `derived_by` and IRIs for RDF/OWL alignment. Version 0.3.0.dev0 is unreleased and mutable; the last release is 0.1.1 of 11 Dec 2025 ([Fact](https://github.com/apache/ossie)). dbt v1.12 accepts Ossie documents in place of native YAML ([Fact](https://docs.getdbt.com/docs/build/semantic-models)).

## Breakdown

### 1. Microsoft Fabric IQ: Ontology item

**Plain English.** A Fabric "ontology" is a list of business things (Customer, Order, Machine), what each thing has (properties), how they connect (Customer *places* Order), the governed numbers about them (metrics), and plain-language rules ("every refrigeration unit must be inspected every 90 days"). Each piece is bound to the tables that actually hold the data. Nothing is copied: the ontology is a map that points at live data. Tiny example: entity type `Store` (key `store_id`, properties `name`, `region`), relationship `Store stocks Product`, metric `Total Sales` (a DAX measure owned by a Power BI model), rule "Stores in EMEA must not stock product category X."

**Data model** ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview), [Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-create-entity-types)):
- *Entity type*: name, description, properties, identifiers (key), metrics, rules, metadata, relationships. Keys must be string or integer. Keyless entity types, hierarchies, inheritance (a base type extended by specialised types) and shared properties (defined once, reused) are all supported.
- *Property*: a name plus one of five value types: integer, boolean, datetime, double, string. There is also an `Unknown` type for an unbound placeholder, which never appears in results until it is bound. A property name can repeat across entity types only if the type matches. Time-series bindings need a timestamp column.
- *Relationship type*: an explicit link between two entity types. It does not need a dedicated join table.
- *Metric*: in preview, metrics come only from DAX measures in a source semantic model. The semantic model keeps ownership of the expression, and the ontology keeps the business context around it.
- *Rule*: name (required, unique), definition (required, natural language), linked concepts (optional: entity types, properties, relationship types), description (rationale), and free key-value metadata (for example `category: maintenance`, `owner: facilities-operations`). Authors are advised to use "must be true / must not be true / should normally be true" phrasing. Rules are read-only to consumers, and the ontology never evaluates them ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules)).
- *Namespace*: a scope that lets several teams share one model.
- *Data binding*: maps definitions to sources. Supported sources: semantic models, lakehouses, eventhouses, warehouses, SQL databases, mirrored databases, OneLake shortcuts and views.

**Storage and compute.** This is a virtual layer. Consumers query the bound source live: KQL for eventhouse, SQL for lakehouse, DAX for semantic model, and GQL only when a Graph model has been materialised. Graph is optional and does not load instance data unless you opt in. It is meant only for multi-hop traversal, reachability and shortest path ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)). Row limits in the ontology agent: 1,000 for KQL, SQL and GQL; 200 for DAX ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent)).

**Authoring and lifecycle.** Authoring is done in the UI, through APIs and CI/CD, or by the ontology agent. Named manual version checkpoints are supported, and restoring one replaces the whole definition. Import accepts RDF, Turtle or OWL, and only into an empty item. Export produces RDF or Turtle ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)).

**Cold start.** "Generate Ontology" on a Power BI semantic model maps tables to entity types, columns to properties, model relationships to relationship types and DAX measures to metrics. Afterwards you must do these by hand: bind time series, review keys, bind relationship types to data, rename to friendly names, and review everything. Combining several semantic models is possible only through the ontology agent in Act mode. The agent reconciles overlapping tables and can create relationships across models. You need Read and Build permission on every semantic model ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models)).

**Ontology agent (proposal-first).** It has two modes: Plan (discover, draft, validate, query, explain, with no writes) and Act (applies changes after stating them). The pipeline is Discover (samples a few rows per table), then Draft (entity types, relationships, bindings), then Validate (structural and grounding checks), then Apply. A read-only diff preview highlights added, edited and removed items, each with an explanation. Patches keep stable IDs, so downstream integrations do not break. It runs as the user: Viewers can query, Contributors can change. Limits: one ontology per conversation, no undo per operation, no polymorphic queries, conversations capped at 24 hours, 10 attachments of 5 MB each, and conversation data kept for up to 2 days ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent)).

**Agent consumption.** The MCP endpoint is `https://api.fabric.microsoft.com/v1/mcp/dataPlane/workspaces/<ws>/items/<ontology>/ontologyEndpoint` over HTTP. Auth is the signed-in user's credentials; service principals are not supported because of a known issue. It needs F2+ or P1+ capacity ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-mcp-server)). The Agent 365 reference lists the tools `list_ontology_entity_types` (entity types with property names, types and available telemetry) and `search_ontology` (a natural-language question that returns raw JSON plus an optional natural-language answer). It requires the scope `McpServers.FabricIQOntology.All` and warns that tool names may change ([Fact](https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric)). The rules page adds `list_ontology_rules` ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules)). Parameter schemas are not published. The ontology can also feed Fabric data agents, Foundry IQ knowledge bases, Copilot Studio and operations agents ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/concepts-agent-integration)).

**Permissions.** Workspace and item permissions control the ontology itself. Queries respect OneLake security plus source row-, object- and column-level security ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)).

**Status.** Preview. The old experience retires on 31 January 2027, and its Activator-linked rules must be recreated by hand ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)). Pricing is not stated on the ontology pages beyond the capacity requirement. [Unverified: billing is through Fabric capacity units.]

**Copy:** the proposal-first agent with a Plan/Act split, a diff preview and stable IDs on every patch. **Avoid:** text-only rules that nothing evaluates, and an ontology whose metrics can only come from one BI tool.

### 2. Fabric data agent, operations agent, Power BI "Prep data for AI", Foundry IQ, Work IQ

**Fabric data agent** (GA) ([Fact](https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent)):
- Up to 5 sources per agent: lakehouse, warehouse, Power BI semantic model, KQL, mirrored databases, ontology, Microsoft Graph.
- Configured with agent instructions (routing, for example "financial metrics go to the semantic model") and up to 100 example question-query pairs per source. Examples are not supported for semantic models.
- Pipeline: validate the question against policy and permissions, rephrase it, pick a source using schema read with the user's credentials, generate the query with NL2SQL, NL2DAX or NL2KQL, validate, execute, summarise.
- Read-only. Answers are capped at 25 rows and 25 columns. Built on Azure OpenAI Assistants, and the model cannot be changed.
- The governance precedence is stated explicitly: tenant policy, then workspace role, then developer instructions, then the user's prompt.
- *Copy:* the explicit four-level precedence order. *Avoid:* the 25-row cap for reporting use cases.

**Operations agent** ([Fact](https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent)):
- Configured with instructions, a knowledge source (eventhouse or ontology) and actions. "Generate Playbook" compiles these into goals, monitored concepts, rules with backing queries, and actions.
- Each rule's query runs every 5 minutes. Conditions are typed: state conditions (is above, is below, is) re-fire on every evaluation; transition conditions (crosses above, crosses below, enters range, exits range, becomes) fire once per change.
- The default action is a Teams message. A recipient approves, and then the agent executes.
- Each agent has its own Entra Agent ID but runs on-behalf-of its creator, so approved actions use the creator's permissions. There is an activity log of evaluations, recommendations, responses and status.
- *Copy:* the state-versus-transition condition taxonomy and the playbook compilation step. *Avoid:* executing with the creator's rights after a different person approves.

**Power BI semantic model and Copilot grounding** ([Fact](https://learn.microsoft.com/power-bi/create-reports/copilot-prepare-data-ai)):
- Three grounding features, all preview: *AI data schema* (choose the subset of fields Copilot should see), *verified answers* (trigger phrases mapped to a specific visual), and *AI instructions*.
- They are stored in the semantic model, not the report. Instructions and schema are stored in "LSDL", which the page does not expand. After a Git or pipeline deployment, a refresh is needed to sync.
- An "Approved for Copilot" flag on the model (formerly "prepped for AI") removes friction, and admins can restrict standalone Copilot to approved items. Propagation can take up to 24 hours.
- Underlying primitives: tables, columns, DAX measures, relationships, hierarchies, plus row-level security (RLS) and object-level security (OLS) roles. [Unverified for this session: well-known Power BI model features, not re-read here.]
- *Copy:* the "approved" flag as a hard gate on what agents may ground on. *Avoid:* grounding artefacts in an undocumented storage format.

**Foundry IQ** ([Fact](https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq)):
- A *knowledge base* (a retrieval configuration with reasoning effort minimal, low or medium) references *knowledge sources* (Blob, SharePoint, OneLake, web and others).
- Agentic retrieval: an LLM plans subqueries, they run in parallel (keyword, vector or hybrid), results are reranked, and extractive results come back with citations.
- ACLs are synced. Purview labels are honoured. Queries can run under the caller's Entra identity.
- This is the document side of context, not the business-object side.

**Work IQ** ([Fact](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/work-iq/api-overview)):
- Reasons over mail, meetings, OneDrive and SharePoint files, Teams, people, Planner and connectors.
- Exposed through A2A (`SendMessage` on `https://workiq.svc.cloud.microsoft/a2a/`), remote MCP, local MCP (`workiq mcp` CLI) and REST.
- Delegated Entra auth only; app-only auth is not supported. Billed in Copilot Credits.
- Microsoft frames four "IQs": Work (how people work), Foundry (documents and policies), Fabric (business entities and data), and Web ([Fact](https://learn.microsoft.com/en-us/fabric/iq/overview)).

### 3. Databricks: metric views, Genie Agents, Genie Ontology

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

### 5. Apache Ossie (formerly Open Semantic Interchange)

**What it is.** An Apache-incubating JSON/YAML spec in which one document holds one semantic model, plus a separate ontology spec and a mapping spec. It is backed by 50+ organisations, including Snowflake, Databricks, dbt Labs, Salesforce, Oracle, Cube, AtScale, Atlan, RelationalAI and ThoughtSpot ([Fact](https://github.com/apache/ossie/blob/main/docs/index.md)). Snowflake leads it ([Vendor claim](https://www.businesswire.com/news/home/20260127372541/en/AtScale-Joins-the-Open-Semantic-Interchange-OSI-Bringing-over-a-Decade-of-Semantic-Layer-Expertise-to-support-Open-Standards)). Released version 0.1.1 (11 Dec 2025); 0.3.0.dev0 is in development and mutable ([Fact](https://github.com/apache/ossie/blob/main/core-spec/spec.md)).

**Core model fields** ([Fact](https://github.com/apache/ossie/blob/main/core-spec/spec.md)):
- Model: `version`, `name`, `description`, `ai_context`, `datasets`, `relationships`, `metrics` (model-scoped), `nonportable_extensions`.
- Dataset: `name`, `source`, `primary_key`, `unique_keys`, `description`, `ai_context`, `fields`, `metrics` (dataset-scoped).
- Relationship: `name`, `from` (the many side), `to` (the one side), `from_columns`, `to_columns` (these are field names, not physical columns), `ai_context`.
- Field: `name`, `expression` (`sql` in the portable `OSSIE_SQL_2026` dialect, plus optional per-dialect variants), `dimension.is_time`, `label`, `description`, `datatype` (String, Integer, Decimal, Float, Boolean, Date, Time, DateTime, DateTimeTz, Opaque), `ai_context`.
- Metric: `name`, `expression`, `description`, `datatype`, `ai_context`.
- `ai_context` is a string or an object with `instructions`, `synonyms` and `examples`.
- Strict name resolution. A dataset-scoped metric references its own fields, or `source.column`. A model-scoped metric must use `dataset.field` and may compose a dataset metric only through `AGG(dataset.metric)`, which preserves the guarantee that nothing is double-counted.
- Vendor state rides in `nonportable_extensions`, which consumers must preserve and core semantics must never depend on.

**Ontology spec** ([Fact](https://github.com/apache/ossie/blob/main/ontology/ontology.md)):
- Concepts are `EntityType` or `ValueType`. Built-in concepts: Any, Boolean, Date, DateTime, Decimal, Float, Integer, String.
- Concept fields: `concept`, `type`, `description`, `extends`, `derived_by`, `identify_by`, `requires`, `relationships`, `iri`, `annotations`.
- Relationships are declared under the concept that plays the first role. They can be unary or n-ary, with `roles` (concept plus optional role name), `multiplicity` (ManyToOne or OneToOne), `derived_by`, `requires`, and required `verbalizes` patterns such as "{Person} earns {Salary}". They are addressed with dot notation (`Person.earns`).
- *Mapping documents* reference exactly one ontology and one semantic model. `concept_mappings` contain `object_mappings` (a SQL expression or referent mappings through identifying relationships) and `link_mappings`.
- The SAP Business Partner example encodes SAP data-dictionary domains as value types with `requires` constraints (for example a length limit), and a customer role as a subtype defined by `derived_by` ([Fact](https://github.com/apache/ossie/blob/main/examples/sap_business_partner.ontology.yaml)).
- The roadmap cites Palantir and Goldman Sachs Legend as motivation for the ontology layer ([Fact](https://github.com/apache/ossie/blob/main/ROADMAP.md)).

[Inference] The verbalization-plus-roles style is Object-Role Modeling. RelationalAI, a listed member, is the likely source of this design, but I did not verify authorship.

**Copy:** use Ossie as the import/export format, and separate ontology, semantic model and mapping. **Avoid:** depending on 0.3.0.dev0 field names in production; the spec itself warns against it.

### 6. Google: Knowledge Catalog, context sets, enrichment, BigQuery Graph, Looker, Gemini Enterprise

**Knowledge Catalog.** Dataplex Universal Catalog was renamed on 10 April 2026, and the API and IAM names did not change ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/about-context)). The context graph combines technical, semantic and operational metadata, relationships, trust signals and agent guidance. Nodes are tables, semantic models, glossary terms and data products. Edges are lineage, associations, schema keys, joins mined from query history, and declared join paths ([Vendor claim](https://cloud.google.com/blog/products/data-analytics/expanded-semantic-model-support-in-knowledge-catalog/)). Overlapping definitions from different sources are kept side by side, each labelled with its source, for stewards to reconcile; they are not overwritten.

**Semantic model ingestion** (29 Oct 2026, GA): LookML, BigQuery Graph (including measures), dbt MetricFlow, Snowflake semantic views (via Horizon), Databricks metric views (via Unity Catalog) and SAP CSN (via Business Data Cloud). Google reports internal benchmarks of nearly 4x accuracy, 33% lower latency and 75% fewer tokens ([Vendor claim](https://cloud.google.com/blog/products/data-analytics/expanded-semantic-model-support-in-knowledge-catalog/)).

**Context sets** (preview) ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/context-sets)):
- An entry group with `type="context-set"`.
- Document entries hold generated knowledge. The `document.type` values are `context-set` (the root `agents` index), `knowledge-base-index`, `table-context`, `concept`, `learning` and `knowledge-base`.
- Query Template entries carry `intent`, `nlQuery`, `query`, `sourceType`, `sourceDialect` and typed `parameters` with `sampleValues`.
- Entry IDs are hierarchical (`documents/concepts/...`).
- Agents are told to read the root index first, then matching queries, then table context, then concepts, learnings and documents.
- One enrichment task per set. A context set definition overrides a conflicting glossary term. Context sets do not grant data access. Enrichment is free during preview.

**Self-learning enrichment** (preview, Oct 2026) ([Vendor claim](https://cloud.google.com/blog/products/data-analytics/knowledge-catalog-self-learning-context-enrichment-for-ai-agents)):
- Reads agent and user interaction traces, with optional PII redaction.
- Detects ambiguous column lookups, ungrounded metrics, missing definitions and rephrased questions.
- Finds an answer in Docs, GitHub, Confluence, SharePoint or GCS and writes proposals: definitions, descriptions, joins, golden queries, task-specific instructions. Each proposal has citations and a confidence score.
- Below the threshold, or for any deletion, it opens a Change Request. Every change is logged with provenance and can be reverted. Customers can supply their own evaluation set.
- Import and export use "Open Knowledge Format", which the context-set doc page does not mention ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/context-sets)).

**Consumption:**
- LookupContext (`POST .../locations/LOC:lookupContext`) takes up to 10 resources and returns one pre-formatted block (YAML by default, or JSON or XML) within a soft `context_budget` of characters. The block covers schema, joins from logs, glossary, data profile, data-quality results and related assets. When several resources are requested, it adds the relationships between them ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context)).
- MCP at `https://dataplex.googleapis.com/mcp` (stateless, MCP version 2026-07-28) with `search_entries`, `lookup_context` and `lookup_entry`. A data-products endpoint adds create, update and get tools. It requires `roles/mcp.toolUser` ([Fact](https://docs.cloud.google.com/knowledge-catalog/docs/use-remote-mcp), [Fact](https://docs.cloud.google.com/knowledge-catalog/docs/reference/mcp)).
- Gemini Enterprise's Deep Research Agent is "natively powered by" Knowledge Catalog (preview) ([Vendor claim](https://cloud.google.com/blog/products/data-analytics/introducing-the-google-cloud-knowledge-catalog)).

**BigQuery Graph measures** ([Fact](https://docs.cloud.google.com/bigquery/docs/graph-measures)):
- A property graph declares node tables with `KEY` and edge tables with `SOURCE KEY` and `DESTINATION KEY`. Inside `PROPERTIES` you can write `MEASURE(SUM(budget)) AS total_budget`.
- A measure is locked to its element's key grain, so `AGG()` over joins never double-counts.
- Queried through the `GRAPH_EXPAND` table-valued function. GQL cannot reference measures directly.
- Many-to-many edges are ignored as ambiguous, so junction tables must be promoted to nodes. `COUNT(*)` is not allowed. Cache must be disabled after graph changes.

**Looker / LookML.** A project is a Git repo with a manifest, models (one connection each, defining explores and joins with `sql_on`), views (dimensions, dimension_groups, measures, sets) and derived tables (persistable as PDTs) ([Fact](https://docs.cloud.google.com/looker/docs/lookml-terms-and-concepts)). Joins also declare `relationship` (many_to_one and so on). Row and field security use `access_filter`, `access_grant` with `required_access_grants`, `sql_always_where` and `always_filter` [Unverified this session; standard LookML]. A managed Looker MCP server went into preview on 28 May 2026. Agent actions map to real Looker users through OAuth and appear in System Activity. The forum shows early connection bugs ([Fact](https://discuss.google.dev/t/unlocking-agentic-ai-for-enterprise-bi-announcing-looker-s-managed-mcp-server-in-preview/367431)).

**Copy:** LookupContext's single call with a character budget that returns one LLM-ready block, and the "root index first" reading order. **Avoid:** proposals from many sources living side by side forever with nobody reconciling them. Assign an owner who resolves conflicts.

### 7. OpenAI Frontier and OpenAI's in-house data agent

**Frontier** (5 Feb 2026). Four pillars: Business Context (connects warehouses, CRM, ticketing and internal apps into "a semantic layer for the enterprise"), Agent Execution (files, code, tools; local, customer cloud or OpenAI-hosted; agents build memories), Identity and Permissions (each AI coworker has its own identity and explicit permissions), and Evaluation and Optimization. Availability was limited at launch, with named adopters HP, Intuit, Oracle, State Farm, Thermo Fisher and Uber ([Vendor claim](https://openai.com/index/introducing-openai-frontier)). The product page adds observability logs and a SOC 2 / ISO compliance list, but no schema, pricing or connector specifics ([Vendor claim](https://openai.com/business/frontier/)). I found no public data-model documentation for Business Context. [Unverified]

**In-house data agent** (29 Jan 2026; authors Bonnie Xu, Aravind Suresh, Emma Tang) ([Fact](https://openai.com/index/inside-our-in-house-data-agent/)):
- Scale: 3.5k users, 600 PB, about 70k datasets. Model GPT-5.2.
- Entry points: Slack, web, IDE, Codex CLI through MCP, and the ChatGPT app.
- Six context layers:
  1. *Table usage*: schema, lineage, historical queries showing common joins.
  2. *Human annotations*: expert descriptions and caveats.
  3. *Codex enrichment*: Codex crawls the pipeline code to learn derivation, uniqueness, update frequency and scope, which separates look-alike tables. It refreshes automatically.
  4. *Institutional knowledge*: Slack, Docs and Notion, embedded with metadata and permissions. A retrieval service enforces ACLs at runtime.
  5. *Memory*: corrections and non-obvious filters. The agent prompts the user to save them; users can create, edit and delete them; scope is global or personal.
  6. *Runtime context*: live warehouse queries, the metadata service, Airflow and Spark.
- A daily offline pipeline normalises layers 1 to 3 into embeddings for retrieval.
- Evaluations run on the Evals API with golden SQL. Both SQL and result data are compared, tolerating syntax differences and immaterial extra columns. They run as unit tests and as production canaries.
- Permissions are strictly pass-through. The agent flags missing access or falls back to tables the user can read. Every answer summarises its assumptions and links to the results.
- Lessons: consolidate tools; guide the goal, not the path; meaning lives in code.

**Copy:** the six-layer context stack, user-confirmed memory with global or personal scope, and golden-result evaluations as production canaries. **Avoid:** relying on a warehouse with dense query history, which small companies do not have.

### 8. Salesforce: Data 360, Tableau Semantics, Agent Context Engine, Atlas, Agent Script, Testing Center

**Tableau Semantics** ([Fact](https://developer.salesforce.com/docs/data/semantic-layer/guide/tableau-semantics-concepts.html)):
- Semantic models are first-class Salesforce metadata containing at least one data object.
- Definition types: dimensions (basic or hierarchical; datetime, date and geo types), calculated dimensions, measurements (default aggregation; number, currency or duration), calculated measurements (computed at query time across tables), relationships (physical or logical, with join criteria and cardinality), metrics (KPIs over time), and logical views (join views).
- Models can override lake-level semantics, for example by renaming fields.
- APIs exist for authoring, semantic query and metric query.

**Agent Context Engine** (ACE; preview, Dreamforce, 20 Oct 2026) ([Vendor claim](https://www.salesforce.com/blog/?p=157012)):
- A shared context layer usable from Agentforce, Google ADK, Bedrock, LangGraph and the OpenAI SDK through an SDK or MCP.
- Built on Data 360 (zero-copy access, identity resolution), a knowledge-graph traversal engine (GraphRAG), the Tableau semantic models and shared memory.
- Business experts define, per "job", the sources, terms and intended use.
- Per request, ACE starts from the *resolved customer* and walks the graph only to permitted facts. It returns a scoped payload: profile, memories, real-time signals and a graph slice.
- Reads apply object-, field- and row-level security, sharing rules and classification, with masking. Memory writes keep provenance, inherit source protections and can require human confirmation before other agents may use them.

**Atlas reasoning engine** (Dec 2024) ([Fact](https://engineering.salesforce.com/inside-the-brain-of-agentforce-revealing-the-atlas-reasoning-engine/)):
- Event-driven, publish-subscribe, graph-based workflows. Agents are defined declaratively in YAML. Modules have strongly typed interfaces. Agent state serves as short- and long-term memory.
- Vendor pilot claims: relevance up 2x, accuracy up 33%.

**Agent Script** ([Fact](https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html)):
- A DSL with blocks `system`, `config`, `access` (`default_agent_user`), `language`, `variables` (typed and mutable), and `start_agent` / subagent blocks with `reasoning.instructions`.
- Inside instructions, `->` introduces deterministic logic (if/else on variables) and `|` introduces text for the LLM.
- Transitions between subagents can be deterministic, or exposed to the LLM as a tool.
- From April 2026 "topics" are called "subagents".

**Testing Center** ([Fact](https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce)):
- A test case has an utterance, expected topics, expected actions and expected outcome.
- AI generates synthetic cases from agent metadata and the data library.
- Three evaluations: topic, action, and outcome (LLM-judged).
- Consumes Einstein Requests.

**Copy:** ACE's "start from the resolved entity and traverse only permitted edges", the per-job context definition, and memory with provenance plus optional confirmation. Also Agent Script's `->` / `|` split. **Avoid:** making the semantic layer depend on one vendor's CRM and data cloud.

### 9. SAP, ServiceNow, Workday, Oracle

- **SAP.** Knowledge Catalog ingests SAP Core Schema Notation (CSN) through Business Data Cloud ([Fact](https://cloud.google.com/blog/products/data-analytics/expanded-semantic-model-support-in-knowledge-catalog/)). SAP's product page for SAP Knowledge Graph promises grounding for Joule but gives no technical detail ([Vendor claim](https://www.sap.com/assetdetail/2026/01/72f930cf-377f-0010-bca6-c68f7e60039b.html)). The HANA Cloud Knowledge Graph Engine is RDF/SPARQL. [Unverified: from SAP learning page titles only; the reference architecture page failed to load.] The Ossie SAP Business Partner example is a better public view of how SAP's data dictionary maps into an ontology ([Fact](https://github.com/apache/ossie/blob/main/examples/sap_business_partner.ontology.yaml)).
- **ServiceNow** acquired data.world (announced 7 May 2025) for its knowledge-graph catalog and metadata collectors, to feed Workflow Data Fabric and RaptorDB ([Fact](https://www.techtarget.com/searchitoperations/news/366623687/ServiceNow-digs-deeper-into-data-for-AI-with-Dataworld-buy)). ServiceNow Knowledge Graph (Brazil release) can be added as a tool in AI Agent Studio. It returns structured JSON naming the table, the columns and each record's `sysId`, so a later tool can act on those records. It has a prebuilt User Profile schema, and results are permission-aware ([Fact](https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html)). *Copy:* returning record IDs so a later action can operate on the same records.
- **Workday Data Cloud** (16 Oct 2026) ([Vendor claim](https://blog.workday.com/en-us/four-layers-workday-data-cloud.html)):
  - Open Data Core: 240+ pre-curated business objects (Worker, Position, Cost Center, Purchase Order, GL Account).
  - Live Data Query on Trino.
  - Context Layer: prebuilt finance and HCM semantic models (Headcount, Voluntary Turnover) exposed over MCP (early access).
  - Agent-Ready Tools, with every action going through the Agent Gateway and escalation to a human above policy.
  - *Contextual Security*: access is based on the person's relationship to the data, for example a regional HR director sees their own region. This is relationship-based, not role-based. *Copy this.*
- **Oracle AI Data Platform** (27 Oct 2026, features due "within the next 12 months"):
  - An AI Discovery agent drafts ontologies from schemas, semantic models, API documentation and documents. Experts approve them.
  - A Semantic Reasoning Engine builds context, applies governance and reuses prior findings.
  - An AI Registry inventories agents, tools and MCP servers with permissions and lifecycle ([Vendor claim](https://www.oracle.com/news/announcement/ai-world-oracle-ai-data-platform-brings-ai-assisted-business-context-to-enterprise-ai-2026-10-27/)).
  - Not shipped.

### 10. dbt Semantic Layer / MetricFlow (v1.12 spec)

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

- Data model: cubes (usually one per table, `sql_table`), measures (count, sum, number-from-other-measures, with `filters` and `format`), dimensions, plus views, joins, segments, pre-aggregations, hierarchies and folders ([Fact](https://cube.dev/docs/product/data-modeling/overview); only the basics were read).
- **Access policies** ([Fact](https://docs.cube.dev/reference/data-modeling/data-access-policies.md)):
  - On each cube or view: `access_policy` entries with `group` or `groups` (`"*"` for everyone), `conditions` (`if:` expressions over `userAttributes` or `securityContext`), `member_level` (`includes` / `excludes`), `member_masking`, and `row_level.filters` (`member`, `operator`, `values`, which may interpolate `{ userAttributes.state }`).
  - Once any group-specific policy exists, groups without a matching policy get no access at all.
  - Members granted by a policy are masked outside that policy's row filter.
- **AI API** (May 2024, since evolved into the D3 agentic platform): `POST /cubejs-api/v1/ai/query/completions` returns a *Cube semantic query*, not SQL, which Cube compiles. The argument is that a constrained output reduces hallucination ([Vendor claim](https://cube.dev/blog/a-practical-guide-to-getting-started-with-cubes-ai-api)).

**Copy:** declarative row, column and mask policies keyed on user attributes and stored alongside the model; and making agents emit semantic queries rather than SQL. **Avoid:** per-cube policy sprawl with no central viewer. Cube ships a separate policies viewer, which suggests this is a real pain point. [Inference]

### 12. AtScale, Malloy, Kyligence

- **AtScale.** SML, an open-source semantic modeling language, was released 10 Sep 2024. AtScale joined OSI in January 2026. Its strength is multidimensional (MDX, OLAP) semantics and migration from SSAS and Cognos ([Vendor claim](https://www.businesswire.com/news/home/20260127372541/en/AtScale-Joins-the-Open-Semantic-Interchange-OSI-Bringing-over-a-Decade-of-Semantic-Layer-Expertise-to-support-Open-Standards)). MCP status was not verified. [Unverified]
- **Malloy.** An open-source semantic modeling and query language that compiles to SQL on BigQuery, Postgres and DuckDB, and calls itself "a work in progress" ([Fact](https://docs.malloydata.dev/documentation/)). Core constructs: `source`, `dimension`, `measure`, `join_one` / `join_many` with symmetric aggregates, `view`, `run`; MCP and Publisher appear in the docs navigation. [Unverified this session.] *Copy:* symmetric aggregates (the same no-double-count goal as BigQuery measures and Ossie `AGG`).
- **Kyligence.** Kyligence Zen is a metrics store and catalog with an AI copilot, built on Apache Kylin OLAP. GA was announced in 2023 per press coverage titles. [Unverified]

### 13. Glean, Atlan, Hebbia

- **Glean.**
  - The MCP server exposes Search, Chat, `read_document`, Code Search, People, Artifacts and image tools. Glean agents are also callable as tools, and external tools come through an MCP Gateway.
  - Auth is OAuth 2.1 with PKCE, with dynamic or static clients, or user API tokens with the `MCP` scope. Permissions are enforced "through Glean's Knowledge Graph". Billing is in FlexCredits ([Fact](https://docs.glean.com/administration/platform/mcp/about)).
  - Agent identity (beta, page updated 4 Nov 2026): the default is run-as-invoker. Alternatively an admin-scoped service credential is attached *per tool step*. Credentials are injected server-side only for the approved domain, and the audit records both the agent account and the triggering principal ([Fact](https://docs.glean.com/administration/agent-identity/overview)).
  - Enterprise Graph (content, people and activity), personal graph, and ACL capture at indexing time: I could not open these pages before the budget ran out. [Unverified]
- **Atlan** positions itself as "the context layer". Components: Enterprise Data Graph (column-level lineage parsed from SQL), Context Agents (generate certified descriptions, glossary terms and ontology relationships), Context Lakehouse (Iceberg-native storage), Context Engineering Studio (context as code, with CI evaluations before production) and an MCP server. It claims 108 connectors as of Sep 2026 ([Vendor claim](https://atlan.com/know/ai-agent/databricks/genie-ontology-and-atlan-context-layer.md)). *Copy:* treating context as code with CI evaluations.
- **Hebbia.** Its "Matrix" product is a spreadsheet-style grid in which agents extract answers from documents per row and column. It is a document-analysis layer, not an ontology. [Unverified: pages not opened.]

### 14. Graph and knowledge-graph vendors

- **Neo4j** (neo4j-graphrag-python v1.24.0, read from source) ([Fact](https://github.com/neo4j/neo4j-graphrag-python)):
  - The KG-builder pipeline has components for data loading (PDF), text splitting, schema extraction, entity and relation extraction, lexical graph, graph pruning, a KG writer, and entity resolution.
  - The schema object is `GraphSchema`: `NodeType` (label, description, properties as `PropertyType{name, type, description, required}`, `additional_properties`), `RelationshipType`, `Pattern` (allowed source-relationship-target triples) and constraints (KEY and similar).
  - The schema can be supplied, built by `SchemaFromTextExtractor`, or reverse-engineered by `SchemaFromExistingGraphExtractor`.
  - Resolvers: exact match, fuzzy match, and SpaCy semantic match.
  - Retrievers: Vector, VectorCypher, Hybrid, HybridCypher, Text2Cypher, Tools (an LLM picks among retrievers), plus Pinecone, Qdrant and Weaviate adapters.
  - *Copy:* `Pattern` triples as an allow-list for extracted links, and the resolver cascade.
  - The Aura Agent docs page could not be opened. [Unverified]
- **Stardog.** Virtual knowledge graph: SPARQL over relational sources through mappings, without copying data. OWL and SHACL reasoning and validation. An LLM assistant called Voicebox. [Unverified]
- **TigerGraph.** GSQL property graph and the Savanna cloud. Its GraphRAG/CoPilot tooling exists. [Unverified]
- **RelationalAI.** Runs as a Snowflake Native App. Models are written in Python (concepts, relationships, rules), with graph, rules, prescriptive and predictive reasoners. It is an Ossie member. [Unverified, apart from Ossie membership, which is a Fact from the Ossie docs.]
- **Timbr.** A SQL-native ontology layer: concepts with inheritance mapped onto tables, and relationships queryable as virtual joins through SQL. [Unverified]
- **Cognite Data Fusion.** An industrial knowledge graph whose data modeling service has *spaces* (namespace and access boundary), *containers* (physical storage with typed properties and constraints), *views* (logical schemas that can map several containers and implement other views) and *data models* (collections of views), with instances as nodes and edges. It has a Core Data Model of standard types such as asset, equipment, time series, activity and file, and "Atlas AI" low-code agents that call data-model tools. [Unverified: pages not opened this session.] *Copy (if verified):* the container/view split, where physical storage and the logical type are separate and many views map onto one container.
- **C3 AI.** A type system in which every entity is a "Type" with fields and methods, using inheritance and mixins. Applications and agents call type methods. [Unverified]
- **Aera Technology.** "Decision intelligence": skills that recommend decisions, capture user accept or reject choices, and learn from them. "Decision records" as a named object is unconfirmed. [Unverified]

### 15. The "context graph" thesis and responses

- **The thesis** (Ashu Garg, Foundation Capital, 26 Dec 2025) ([Fact](https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context)):
  - A rule says what should happen in general. A decision trace records what happened in one case: which policy version applied, which exception was granted, who approved it.
  - A context graph is a living record of decision traces "stitched across entities and time", so that precedent becomes searchable.
  - Entities in it: accounts, renewals, tickets, incidents, policies, approvers and agent runs, connected by decision events and "why" links.
  - Proposed implementation traits: event-sourced state and replayable history.
  - A decision record would capture the inputs gathered, the policy evaluated, the exception route invoked, the approver and the state written.
  - Incumbent systems of record store only current state. Warehouses sit in the read path after ETL. Agent-orchestration startups sit in the execution path.
  - Named startups: Regie, Maximor, PlayerZero (a context graph of code, config and infrastructure) and Arize (observability for agent decision quality).
- **Responses.** The thesis builds on Jamin Ball's "Long Live Systems of Record" (cited in the piece). A reader replied that an agent with full event storage plus later ML analysis would yield the same graph. Incumbents' closest answers in 2026 are Salesforce ACE's shared memory with provenance, Google's interaction-trace enrichment and Atlan's "decision traces" positioning ([Vendor claim](https://atlan.com/know/ai-agent/databricks/genie-ontology-and-atlan-context-layer.md)). I could not run further searches for 2026 decision-trace startups because the budget ran out. Zep/Graphiti (a temporal knowledge graph for agent memory) is a likely relevant open-source project. [Unverified]

### 16. Comparison matrix

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

[Inference, from the gaps documented above]

1. **None makes actions typed members of the ontology.** No product has an "action type" with parameters, preconditions over object properties, the permission required, approval policy and side effects. Actions live in separate agent products (Fabric operations agent, Agentforce Flow/Apex, Workday Gateway) and are not part of the business model.
2. **None evaluates its rules.** Fabric is explicit that rules are descriptive. Snowflake and Databricks hold only text instructions. Only Ossie has evaluable `requires` and `derived_by` expressions, and no engine in this set executes them as guards on agent actions.
3. **None stores decision traces as linked, queryable records tied to object instances, rule versions and approvers.** ACE memory comes closest and is in preview.
4. **None cold-starts from operational SaaS apps for a company with no warehouse, no BI model and no query history.** Every cold-start method mines analytics artefacts.
5. **None serves internal and external (customer-facing) agents from the same model with different exposure policies.** Salesforce comes closest through Agentforce.
6. **None is model-agnostic, platform-agnostic and sized for 100 to 1,000 staff.** Each requires its own capacity, warehouse or CRM tier.
7. **None exports the whole model** (objects, metrics, rules, actions, permissions) in one portable format. Ossie covers objects, metrics and constraints, but has no actions or permissions.

## What to copy

1. **Use Ossie's three-document split: ontology, semantic model, mapping.** Store objects, links and constraints in an ontology document; physical datasets, fields and metrics in a semantic model; and bindings in a mapping document. This lets one ontology bind to several sources (CRM plus ERP), and import/export works with dbt v1.12, Snowflake, Databricks and others through the Ossie converters. Source: https://github.com/apache/ossie/blob/main/ontology/ontology.md
2. **Make every relationship a role-based fact type with a verbalization string** (`"{Customer} places {Order}"`), a multiplicity, and dot-addressing (`Customer.places`). Verbalizations double as LLM-readable descriptions and validation-message text. Source: https://github.com/apache/ossie/blob/main/ontology/ontology.md
3. **Use Fabric's rule record schema** (name unique, definition, linked concepts, description, key-value metadata, read through a `list_rules` tool), extended with an optional machine-checkable `requires` expression in Ossie form. Mark each rule as advisory (text only) or enforced (has an expression). Sources: https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules ; https://github.com/apache/ossie/blob/main/ontology/ontology.md
4. **Copy Snowflake's metric options: `PRIVATE` building blocks, `USING(relationship)`, `NON ADDITIVE BY`, and verified queries with `VERIFIED_AT`, `VERIFIED_BY` and `ONBOARDING_QUESTION`.** Private members stop agents from querying intermediate facts. `USING` removes join-path ambiguity. Onboarding questions double as first-run suggestions. Source: https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view
5. **Model metric types on dbt's five** (simple, ratio, cumulative, derived, conversion), with `filter`, `fill_nulls_with`, `join_to_timespine` and `offset_window`, and entity-typed join keys (primary, unique, foreign, natural). Source: https://docs.getdbt.com/docs/build/metrics-overview
6. **Prevent double counting with key-grain measures**, so that metrics composed across joins aggregate each key once (BigQuery `MEASURE` and `AGG`, Ossie `AGG(dataset.metric)`). Source: https://docs.cloud.google.com/bigquery/docs/graph-measures
7. **Keep two tiers of knowledge.** *Learned* items are auto-extracted, read-only, and carry source, author, lineage and an authority score (from source type, usage and freshness). *Modeled* items are human-authored and certified. Modeled always wins conflicts. When a conflict cannot be resolved, ask the user. Source: https://docs.databricks.com/aws/en/genie/genie-ontology
8. **Use a proposal-first authoring agent** with Plan and Act modes, a staged Discover, Draft, Validate, Apply flow, a diff preview listing added, edited and removed items with reasons, and stable IDs on patches. Source: https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent
9. **Self-improve from agent traces with a confidence gate.** Detect ambiguous lookups, ungrounded metrics and rephrasing. Propose a fix with citations and a confidence score. Auto-apply above a threshold (Google's example is 85%). Send deletions and anything below the threshold to a reviewer queue. Log provenance and allow revert. Source: https://cloud.google.com/blog/products/data-analytics/knowledge-catalog-self-learning-context-enrichment-for-ai-agents
10. **Offer one LLM-ready context call with a budget**: `lookup_context(resources[≤10], format=yaml|json, budget_chars)`. It returns schema, joins, definitions, sample values, quality and related objects in one block, plus relationships between the requested objects. Source: https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context
11. **Give each domain context bundle a root index** (Google context sets), and tell agents to read the index, then matching query templates, then object context, then concepts and learnings. Bind each agent to one bundle. Source: https://docs.cloud.google.com/knowledge-catalog/docs/context-sets
12. **Build OpenAI's six-layer context stack**: usage (where it exists), human annotations, code/config crawl, institutional documents with ACLs, user-confirmed memory scoped global or personal, and live runtime probes. Refresh it daily offline into embeddings. Source: https://openai.com/index/inside-our-in-house-data-agent/
13. **Evaluate with golden results, not golden strings.** Compare both the query and the result set, tolerate immaterial extra columns, and run the evaluations in CI and as production canaries. For acting agents, add Salesforce's topic, action and outcome checks. Sources: https://openai.com/index/inside-our-in-house-data-agent/ ; https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce
14. **Write a declarative access policy per object**, as Cube does: groups, conditions on user attributes, member includes and excludes, masking, and row filters that interpolate user attributes. Default-deny once any policy exists. Add Workday-style relationship-based scoping, such as "manager of region X". Sources: https://docs.cube.dev/reference/data-modeling/data-access-policies.md ; https://blog.workday.com/en-us/four-layers-workday-data-cloud.html
15. **Treat agent identity as its own principal.** Run as the invoker by default. Allow a scoped service credential per tool step. Inject credentials server-side. Log both the agent account and the triggering human. Never execute an approved action with someone else's rights; use the approver's rights or the agent's own scoped credential. Sources: https://docs.glean.com/administration/agent-identity/overview ; https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent
16. **Use typed monitoring conditions**: state conditions (is, is above, is below) versus transition conditions (becomes, crosses, enters range, exits range), compiled into a reviewable playbook before the monitor starts. Source: https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent
17. **Write a fixed governance precedence into the runtime**: tenant policy, then role, then developer instructions, then user prompt. Source: https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent
18. **Assemble context entity-first**: resolve the customer or object first, then traverse only permitted edges to build a scoped payload (profile, memories, signals, graph slice). Store memory writes with provenance, and let them require confirmation before other agents use them. Source: https://www.salesforce.com/blog/?p=157012
19. **Return object IDs from read tools** (table or object type plus record ID), so a follow-up action tool can act on exactly those records. Source: https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html
20. **Keep the MCP surface small and async-safe**: list types, search or ask, get the full result, list rules, plus explicit polling for long queries. Truncate inline results and offer a separate full-result fetch. Sources: https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp ; https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric

## What cannot or should not be copied

- **Cold start from query history and BI artefacts** (Snowflake, Databricks, Google, OpenAI). Most 100 to 1,000 person companies have little warehouse query history. The equivalents to mine instead are SaaS schemas (CRM, ERP and helpdesk object metadata), reports and saved views inside those apps, spreadsheets, and SOP documents. [Inference]
- **Authority scoring that depends on scale** (OntoRank's popularity and collaborator signals). Small companies lack the usage volume for these signals to mean much. Use explicit owner and certification flags instead. [Inference]
- **Text-only rules** (Fabric). Copying this leaves the "rules" promise unenforced.
- **Executing an approved action with the creator's permissions** (Fabric operations agent). This is a privilege-escalation pattern.
- **Account-wide visibility for snippets from external sources** (Databricks beta). This leaks definitions across teams.
- **Undocumented or proprietary storage of grounding artefacts** (Power BI's "LSDL"). The founder's principle requires portable, inspectable storage.
- **Answer caps** such as 25 by 25 rows (Fabric data agent). These suit chat but not reporting.
- **Proprietary model routing that customers cannot control** (Cortex Analyst's fixed order; the Fabric data agent's fixed model). This conflicts with the requirement to use Claude, GPT or Qwen. Make the model a per-tenant setting.
- **Palantir-scale forward-deployed setup** (Frontier, C3, Cognite). This is not feasible for a solo founder. Onboarding must be self-serve and agent-driven.
- **Depending on Ossie 0.3.0.dev0 field names in production.** The spec is mutable. Pin 0.1.1 for exchange, or version your own converter.

## Open questions and unverified items

- Exact MCP parameter schemas for the Fabric ontology tools are not published. The Agent 365 page shows two inconsistent URL formats ([Fact](https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric)).
- The OntoRank formula and scale are not published.
- The internal pipeline stages of Cortex Analyst are not documented on the page I read.
- OpenAI Frontier's Business Context data model, pricing and connector list: no public documentation found.
- "Open Knowledge Format" (Google) has no spec found. The context-sets doc page does not mention it.
- SAP Knowledge Graph's technical design: product page only. The reference architecture page failed to load.
- Not read because of the exhausted search and fetch budgets: Glean Enterprise Graph and personal graph internals; Neo4j Aura Agent; Stardog, TigerGraph, RelationalAI, Timbr, Cognite, C3 AI, Aera and Hebbia documentation; Kyligence 2026 status; Malloy MCP; LookML access-control pages; a survey of 2026 decision-trace startups beyond those named by Foundation Capital. All statements on these are labelled [Unverified] above and should be re-checked.
- Whether the Ossie ontology spec was contributed by RelationalAI. [Inference only]
- The co-authorship of the Foundation Capital piece. The page I read credits Ashu Garg; I did not verify any co-author.

## Sources

1. Apache Ossie repo: core spec, ontology spec, mapping, roadmap and examples (commit 20 Nov 2026), https://github.com/apache/ossie. The only portable spec covering objects, links, constraints and metrics; copy it directly.
2. Fabric ontology overview (updated 2026), https://learn.microsoft.com/en-us/fabric/iq/ontology/overview. The full concept list, bindings, versioning and RDF/OWL import.
3. Fabric ontology agent, https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent. The proposal-first authoring agent design and its limits.
4. Fabric rules, https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules. The rule record schema and `list_ontology_rules`.
5. Databricks Genie Ontology docs (updated 16 Nov 2026), https://docs.databricks.com/aws/en/genie/genie-ontology. The learned versus modeled tiers, authority and permissions.
6. Databricks GA blog (11 Nov 2026), https://databricks.com/blog/announcing-ga-genie-ontology. OntoRank signals, sources and benchmark.
7. Snowflake CREATE SEMANTIC VIEW, https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view. The most expressive metric DDL in the set.
8. OpenAI in-house data agent (29 Jan 2026), https://openai.com/index/inside-our-in-house-data-agent/. The six context layers, memory and evaluations.
9. Google self-learning enrichment (22 Oct 2026), https://cloud.google.com/blog/products/data-analytics/knowledge-catalog-self-learning-context-enrichment-for-ai-agents. The trace-driven improvement loop.
10. Google context sets, https://docs.cloud.google.com/knowledge-catalog/docs/context-sets. Context bundle data model and reading order.
11. Google LookupContext, https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context. The single-call, budgeted context API.
12. Databricks Genie Agent tuning, https://docs.databricks.com/aws/en/genie-agents/tune-quality. Knowledge store objects and hard limits.
13. Databricks metric view YAML reference, https://docs.databricks.com/aws/en/uc-semantics/metric-views/yaml-reference. Full metric view field list.
14. Snowflake Semantic View Autopilot, https://docs.snowflake.com/en/user-guide/views-semantic/autopilot. Cold-start inputs and outputs.
15. Salesforce ACE (20 Oct 2026), https://www.salesforce.com/blog/?p=157012. Entity-first context assembly and governed memory.
16. dbt semantic models and metrics (v1.12), https://docs.getdbt.com/docs/build/semantic-models and https://docs.getdbt.com/docs/build/metrics-overview. Metric types and entity keys.
17. Cube access policies, https://docs.cube.dev/reference/data-modeling/data-access-policies.md. A declarative permission schema worth copying.
18. Fabric operations agent, https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent. Monitoring conditions, approval and identity pitfalls.
19. Fabric data agent, https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent. Pipeline, limits and governance precedence.
20. Databricks Genie One MCP, https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp. Async MCP tool design.
21. Glean agent identity (updated 4 Nov 2026), https://docs.glean.com/administration/agent-identity/overview. Per-step credentials and dual-principal audit.
22. Foundation Capital context graphs (26 Dec 2025), https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context. The decision-trace thesis.
23. Fabric generate from semantic models, https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models. Mapping rules and manual follow-up steps.
24. Fabric ontology MCP setup, https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-mcp-server ; Agent 365 Fabric MCP reference, https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric. Endpoints and tool names.
25. Google semantic model ingestion (29 Oct 2026), https://cloud.google.com/blog/products/data-analytics/expanded-semantic-model-support-in-knowledge-catalog/. Multi-source ingestion that keeps conflicts side by side.
26. BigQuery Graph measures, https://docs.cloud.google.com/bigquery/docs/graph-measures. Key-grain measures.
27. Databricks Pages, https://docs.databricks.com/aws/en/uc-semantics/pages. Governed definitions with a role model.
28. Workday Data Cloud (16 Oct 2026), https://blog.workday.com/en-us/four-layers-workday-data-cloud.html. Contextual (relationship-based) security and the agent gateway.
29. dbt-mcp README, https://github.com/dbt-labs/dbt-mcp. Exact semantic-layer MCP tool names.
30. neo4j-graphrag-python v1.24.0, https://github.com/neo4j/neo4j-graphrag-python. KG extraction schema, resolvers and retrievers.
31. Salesforce Agent Script, https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html. Mixed deterministic and LLM instruction syntax.
32. Salesforce Testing Center, https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce. Topic, action and outcome evaluations.
33. Tableau Semantics concepts, https://developer.salesforce.com/docs/data/semantic-layer/guide/tableau-semantics-concepts.html. Definition types.
34. Power BI Prep data for AI, https://learn.microsoft.com/power-bi/create-reports/copilot-prepare-data-ai. Grounding artefacts and the approval flag.
35. Foundry IQ, https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/what-is-foundry-iq ; Work IQ API, https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/work-iq/api-overview. The document and work-context siblings.
36. Cortex Analyst, https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst ; Cortex Agents, https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-agents. Request shape, model order, pricing and limits.
37. Google Knowledge Catalog context and MCP, https://docs.cloud.google.com/knowledge-catalog/docs/about-context ; https://docs.cloud.google.com/knowledge-catalog/docs/use-remote-mcp ; https://docs.cloud.google.com/knowledge-catalog/docs/reference/mcp.
38. Databricks Genie One launch (16 Jun 2026), https://www.databricks.com/en/blog/introducing-genie-one-genie-ontology-and-genie-agents.
39. OpenAI Frontier (5 Feb 2026), https://openai.com/index/introducing-openai-frontier ; https://openai.com/business/frontier/. Pillars only.
40. Oracle AI Data Platform (27 Oct 2026), https://www.oracle.com/news/announcement/ai-world-oracle-ai-data-platform-brings-ai-assisted-business-context-to-enterprise-ai-2026-10-27/. Announced, not shipped.
41. ServiceNow Knowledge Graph for agents, https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html ; data.world acquisition, https://www.techtarget.com/searchitoperations/news/366623687/ServiceNow-digs-deeper-into-data-for-AI-with-Dataworld-buy.
42. Looker MCP preview (28 May 2026), https://discuss.google.dev/t/unlocking-agentic-ai-for-enterprise-bi-announcing-looker-s-managed-mcp-server-in-preview/367431 ; LookML terms, https://docs.cloud.google.com/looker/docs/lookml-terms-and-concepts.
43. Atlan context layer (19 Jun 2026), https://atlan.com/know/ai-agent/databricks/genie-ontology-and-atlan-context-layer.md. Competitor positioning; vendor content.
44. Atlas reasoning engine (Dec 2024), https://engineering.salesforce.com/inside-the-brain-of-agentforce-revealing-the-atlas-reasoning-engine/.
45. Cube AI API (May 2024), https://cube.dev/blog/a-practical-guide-to-getting-started-with-cubes-ai-api ; AtScale/OSI (Jan 2026), https://www.businesswire.com/news/home/20260127372541/en/AtScale-Joins-the-Open-Semantic-Interchange-OSI-Bringing-over-a-Decade-of-Semantic-Layer-Expertise-to-support-Open-Standards ; Malloy docs, https://docs.malloydata.dev/documentation/.