# Context assembly and grounding

**Layer:** [06-knowledge-and-evidence](README.md) · **What it is:** What reaches the model: layered context, business terms, synonyms, routing and marking filters.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Other companies and products](#other-companies-and-products) (5) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (3)

## Palantir

### 7. Markings and what reaches an LLM

> Source: [general-references/03-palantir-aip.md § 7. Markings and what reaches an LLM](../../general-references/03-palantir-aip.md#7-markings-and-what-reaches-an-llm)

**Plain English.** Markings are labels such as "PII" or "Export-controlled" that a user must hold to see data. AIP lets an admin say "only sessions carrying these markings may talk to models".

**Technical detail** ([Fact] https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/ , shipped 12 Oct 2026 per https://www.palantir.com/docs/foundry/announcements/2026-10):
- There are two policies: "Allow any data" or "Allow only the following markings". A request passes only if *every* mandatory marking on the request's session token is in the allowlist. A token with no mandatory markings always passes.
- The check uses the **session token**, not the data in the prompt. A user cleared for markings A and C, with an allowlist of A and B, is blocked even if the prompt contains only A data.
- The fix is a **scoped session**, where the user narrows their session to fewer markings.
- The policy covers interactive use and automations, and agents such as AI FDE. Registered models can override it with a stricter or looser policy.
- **Row and column security applies only to reads.** In Logic, restricted views and object or property security policies apply when the Query objects tool reads data. They do not cover model output or edits made through Apply actions. Palantir says to pair them with markings or classification-based access control to protect downstream data. [Fact] https://www.palantir.com/docs/foundry/logic/blocks/
- **Log markings are not inherited.** When log access is enabled, only the markings an admin explicitly applies are enforced on logs. They are not inherited from the data the execution touched, so admins must set them to the highest sensitivity the workflow could reach. [Fact] https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/

[Inference] Checking the session is coarse but safe and cheap, because nothing has to classify the prompt. A product for mid-sized companies could copy it as "this agent's session is narrowed to these data scopes before any model call".

## Lingyang, AgentOne and Alibaba

### 5. QwenWork (千问办公) and Enterprise Context

> Source: [general-references/08-alibaba-stack.md § 5. QwenWork (千问办公) and Enterprise Context](../../general-references/08-alibaba-stack.md#5-qwenwork-千问办公-and-enterprise-context)

**Plain English.** QwenWork is Alibaba's agent workbench for staff: chat with an agent that writes documents, analyses data, runs scheduled jobs and acts in DingTalk. "Enterprise Context" is its company-memory layer. "Digital employees" are agents with an HR-style identity. Example: a tea chain loads store-operations documents, Q&A group chats and training schedules into a "store operations knowledge space" for about 10,000 frontline staff. [Vendor claim] [Jiemian](https://m.jiemian.com/article/15128675.html)

**History.** QwenWork is the merged successor of QoderWork, Wukong (悟空) and MuleRun, combined in July 2026 under the head of DingTalk. [Vendor claim via press] [Jiemian](https://m.jiemian.com/article/15128675.html); [ifanr](https://www.ifanr.com/1673691). Public beta was running by 3 Aug 2026. [ifanr]

**Surfaces.** The desktop client handles local files and computer control. The cloud handles research, web building and long tasks. DingTalk handles groups, meetings, documents, approvals and to-dos. [Vendor claim] [ifanr](https://www.ifanr.com/1673691). Browser automation and local file work are client-only. [Fact] [FAQ](https://help.aliyun.com/zh/qwenwork/product-faq)

**Connectors** (from press, not docs): browser, computer control, macOS apps, Microsoft 365, DingTalk, Feishu, Slack, LINE, Linear, Notion, Figma, Canva, Vercel, Supabase, Neon, Google Calendar, Google Maps, Todoist. IM channels: DingTalk, Feishu, Lark, WeChat, WeCom, Slack, WhatsApp. [Vendor claim] [ifanr](https://www.ifanr.com/1673691). After authorization, DingTalk access covers docs, attendance, AI meeting notes and knowledge bases. [Fact] [FAQ](https://help.aliyun.com/zh/qwenwork/product-faq). A community article counts 25 native DingTalk capabilities. [Unverified, user-contributed] [developer.aliyun.com/article/1753347](https://developer.aliyun.com/article/1753347)

**Skills and expert kits.** Skills are packaged workflows. Expert kits bundle skills, connectors and workflows per role or industry. Organization-level skills preserve method when staff leave. [Vendor claim] [ifanr](https://www.ifanr.com/1673691)

**Scheduled tasks.** They run in the cloud. Rules: one-time, interval, hourly, daily, weekly, monthly, custom. Each run gets its own session, and "run now" does not change the schedule. [Fact] [FAQ](https://help.aliyun.com/zh/qwenwork/product-faq)

**Enterprise controls and pricing.** Seats plus a pooled credit wallet. Each seat gives 2,000 credits per month into the pool, with no rollover. Packs last one year. Deduction order is seat credits first, then packs by earliest expiry. Seats added mid-period are prorated; reductions apply at renewal; there is no direct downgrade. [Fact] [FAQ](https://help.aliyun.com/zh/qwenwork/product-faq). Credit multipliers by model tier: 0.1× / 0.25× / 1× / 1.1× (Qwen3.8-Max). [Vendor claim] [ifanr](https://www.ifanr.com/1673691). CNY seat prices were not found. [Unverified]

**Enterprise Context, digital employees and Security Center (22 Sep 2026).** [Vendor claim] [ifeng](https://tech.ifeng.com/c/8wd2EoDIYv7)
- Enterprise Context compresses and structures documents, communications and business systems, updates continuously, and returns only the context a task needs. A built-in dedicated model keeps token cost low.
- A digital employee has a name, department, owner, duties, authorization scope and lifecycle. Admins can disable it, and every execution record traces to its identity.
- Security Center sets sandbox boundaries before a run, approves or blocks high-risk operations during it, and keeps logs and recovery afterwards. With DingTalk security it adds least privilege, sensitive-information detection, and an audit trail recording who started the task, which data was used and which actions were taken.
- Apps: SaaS vendors plug their systems in, keeping their own interfaces and data, and results can be written back.

**Open source.** No Enterprise Context code was found. MyContext (next section) is the personal layer only. [Fact for the repo contents; Inference that nothing enterprise-level is open]

## Other companies and products

### 2. Fabric data agent, operations agent, Power BI "Prep data for AI", Foundry IQ, Work IQ

> Source: [general-references/11-context-layer-products.md § 2. Fabric data agent, operations agent, Power BI "Prep data for AI", Foundry IQ, Work IQ](../../general-references/11-context-layer-products.md#2-fabric-data-agent-operations-agent-power-bi-prep-data-for-ai-foundry-iq-work-iq)

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

### 6. Google: Knowledge Catalog, context sets, enrichment, BigQuery Graph, Looker, Gemini Enterprise

> Source: [general-references/11-context-layer-products.md § 6. Google: Knowledge Catalog, context sets, enrichment, BigQuery Graph, Looker, Gemini Enterprise](../../general-references/11-context-layer-products.md#6-google-knowledge-catalog-context-sets-enrichment-bigquery-graph-looker-gemini-enterprise)

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

### 8. Salesforce: Data 360, Tableau Semantics, Agent Context Engine, Atlas, Agent Script, Testing Center

> Source: [general-references/11-context-layer-products.md § 8. Salesforce: Data 360, Tableau Semantics, Agent Context Engine, Atlas, Agent Script, Testing Center](../../general-references/11-context-layer-products.md#8-salesforce-data-360-tableau-semantics-agent-context-engine-atlas-agent-script-testing-center)

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

> Source: [general-references/11-context-layer-products.md § 9. SAP, ServiceNow, Workday, Oracle](../../general-references/11-context-layer-products.md#9-sap-servicenow-workday-oracle)

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

### 13. Glean, Atlan, Hebbia

> Source: [general-references/11-context-layer-products.md § 13. Glean, Atlan, Hebbia](../../general-references/11-context-layer-products.md#13-glean-atlan-hebbia)

- **Glean.**
  - The MCP server exposes Search, Chat, `read_document`, Code Search, People, Artifacts and image tools. Glean agents are also callable as tools, and external tools come through an MCP Gateway.
  - Auth is OAuth 2.1 with PKCE, with dynamic or static clients, or user API tokens with the `MCP` scope. Permissions are enforced "through Glean's Knowledge Graph". Billing is in FlexCredits ([Fact](https://docs.glean.com/administration/platform/mcp/about)).
  - Agent identity (beta, page updated 4 Nov 2026): the default is run-as-invoker. Alternatively an admin-scoped service credential is attached *per tool step*. Credentials are injected server-side only for the approved domain, and the audit records both the agent account and the triggering principal ([Fact](https://docs.glean.com/administration/agent-identity/overview)).
  - Enterprise Graph (content, people and activity), personal graph, and ACL capture at indexing time: I could not open these pages before the budget ran out. [Unverified]
- **Atlan** positions itself as "the context layer". Components: Enterprise Data Graph (column-level lineage parsed from SQL), Context Agents (generate certified descriptions, glossary terms and ontology relationships), Context Lakehouse (Iceberg-native storage), Context Engineering Studio (context as code, with CI evaluations before production) and an MCP server. It claims 108 connectors as of Sep 2026 ([Vendor claim](https://atlan.com/know/ai-agent/databricks/genie-ontology-and-atlan-context-layer.md)). *Copy:* treating context as code with CI evaluations.
- **Hebbia.** Its "Matrix" product is a spreadsheet-style grid in which agents extract answers from documents per row and column. It is a document-analysis layer, not an ontology. [Unverified: pages not opened.]

## Research literature

### 9. Grounding agents in a company model (semantic layer evidence)

> Source: [general-references/10-papers-agents-memory-eval.md § 9. Grounding agents in a company model (semantic layer evidence)](../../general-references/10-papers-agents-memory-eval.md#9-grounding-agents-in-a-company-model-semantic-layer-evidence)

This section ties sections 3, 4 and 7 to the product thesis.

- Evidence that a semantic model helps: Sequeda et al. (16% to 54%, and 0% to 36% to 39% on complex schemas) [Fact]. Spider 2.0 shows raw enterprise schemas remain hard (21.3%) [Fact]. Zep's authors list "ontologies and business-data integration" as untested future work [Fact]. Anthropic's wiki experiments show a curated representation beats search for multi-document and judgment questions (87% vs 73%) but not for single-document lookups [Fact].
- Design implication [Inference]: let the agent query metrics and objects in the company model's vocabulary, such as `query_metric(metric="recognised_revenue", by=["region"], period="FY2026Q3")`. The model never writes raw SQL against source tables. A deterministic compiler turns that into SQL, the way data.world turns SPARQL into SQL over R2RML. For questions the model cannot express, fall back to a SQL-writing sub-agent over documented views only, and show the generated query.

## Design decisions already in the reference maps

### 13. What reaches a model

> Source: [general-references/30-map-palantir-platform.md § 13. What reaches a model](../../general-references/30-map-palantir-platform.md#13-what-reaches-a-model)

**Purpose.** Decide, before any prompt leaves the platform, which data the session may carry to which model, and never let a model see more than its caller could read. *Receivables example:* an `HR-Confidential` marking on staff commission data means the Qwen endpoint is barred from any session that carries it, while Claude is allowed. An external customer-facing agent's session carries only `Customer-Facing` scope.

**Design to implement.**
- **The data gate checks the session, not the prompt** [Fact 03, 04]:
  - There is a tenant policy, "allow any data" or "allow only these markings", plus per-model overrides that fully replace it.
  - A request passes only if **every** mandatory marking on the session token is in the allowlist. A session with no markings always passes.
  - The check does not inspect prompt content, so a user cleared for markings A and C, with an allowlist of A and B, is blocked even when the prompt contains only A data. The remedy is a scoped session.
- **Scoped sessions** [Fact 04]: an admin defines named marking sets, and a user can pick one only if they hold all of its markings. Inside the session, visible = resources carrying one of the session's markings, plus unmarked resources. **Every agent run starts by narrowing to a declared scope** [Inference, following 03 and 04]. Customer-facing agents always run in a narrow scope [04 "What to copy" 12].
- **The model gets data only through tools executed under the caller's identity** (section 15). The model never calls tools itself [Fact 03].
- **Context minimisation** [Fact 03]:
  - each query tool exposes a whitelist of properties per object type and a cap on the number of objects returned;
  - media references and vectors are never printed into context;
  - variable visibility to the LLM is off by default.
- **Retrieval playbook** [Fact 03]: if the content fits the context window (Palantir notes 128k tokens is about 300+ pages), skip search. Otherwise use top-K over chunk objects with vectors, and add HyDE, query enrichment or extraction, and hybrid search with RRF (score = Σ 1/(k + rank)) only when evals show a need. When answers are bad, check retrieval first.
- **Propagation gap, stated as a design constraint** [Fact 04]: tool results in model context carry no link to their source policy. So:
  1. model outputs persisted by agents (drafts, summaries, memory) are written through actions whose output objects inherit the union of the markings the session read [Inference];
  2. **agent logs carry explicit markings** chosen by an admin, because Palantir's logs do not inherit them [Fact 03, 04];
  3. outbound customer messages pass a check that the recipient may receive the referenced objects [Inference, by analogy with Palantir's notification rule that every recipient must be able to see the rendered data, Fact 02].
- **Saved analyses store the recipe, not the results** [Fact 03]: on reopen, re-run under the viewer's permissions.
- **Provider terms.** Palantir's zero-retention and no-training statements are [Vendor claim 03, 04] backed by contracts. Claim only what each provider's own terms say [03, 04].
- **Local MCP clients** send tool outputs to their own provider, under that provider's terms [Fact 03]. Make this visible in the consent screen (section 18).

**Copies.**
- Document 03, §7 and document 04, §20: the markings gate on the session token. https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
- Document 04, §12: scoped sessions. https://www.palantir.com/docs/foundry/administration/configure-scoped-sessions/
- Document 04, §6: where propagation stops. https://palantir.com/docs/foundry/security/access-control-propagation/
- Document 03, §§8–9: query-tool property limits, variable visibility. https://www.palantir.com/docs/foundry/logic/blocks/ , https://www.palantir.com/docs/foundry/chatbot-studio/application-state/
- Document 03, §16: retrieval playbook. https://www.palantir.com/docs/foundry/ontology/ontology-augmented-generation/
- Document 03, §15: log markings not inherited. https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/
- Document 03, §18: saved analyses. https://www.palantir.com/docs/foundry/aip-analyst/analysis-resources/

**Left out, and why.**
- Classifying prompt content (not done by Palantir either).
- PII redaction proxy: version 2.

**Open questions.**
- Do receivables customers have enough marking diversity to need scoped sessions in version 1? Customer-facing agents need them regardless.

---

### 10. The six-layer context design (OpenAI in-house data agent), adapted

> Source: [general-references/33-map-context-code-integration.md § 10. The six-layer context design (OpenAI in-house data agent), adapted](../../general-references/33-map-context-code-integration.md#10-the-six-layer-context-design-openai-in-house-data-agent-adapted)

**Purpose.** Decide what the agent is told, in what order and within what budget, so answers are grounded and small. Receivables example: for "Why is Acme late?", the agent gets Acme's profile, open invoices, the certified `overdue_balance` definition, the last three email facts and the collector's saved memory "Acme pays on the 25th".

**Design to implement.** OpenAI's six layers [Fact], mapped to a SaaS-only company [Inference]:

| OpenAI layer | What OpenAI uses | Equivalent here |
|---|---|---|
| 1. Table usage | Schema, lineage, historical queries showing common joins | Model schema plus the product's own agent query log (no warehouse history exists) |
| 2. Human annotations | Expert descriptions and caveats | `aiContext`, Pages, certified definitions (sections 1, 8) |
| 3. Codex enrichment | Crawls pipeline code for derivation, uniqueness, update frequency, scope | Ledger settings and connector config crawl; sync freshness per stream |
| 4. Institutional knowledge | Slack, Docs, Notion, embedded with permissions; ACLs enforced at retrieval | SOPs, credit policy, AR mailbox chunks, with markings enforced at retrieval |
| 5. Memory | User-confirmed corrections, global or personal | Section 8 memory |
| 6. Runtime context | Live warehouse queries, metadata service, Airflow, Spark | Live direct reads through the Nango proxy; temporal facts; current sync status |

- Layers 1–3 are normalised by a daily offline job into embeddings (OpenAI [Fact]) — a DBOS scheduled workflow here.
- Assembly order **entity-first** (Salesforce ACE [Vendor claim]): resolve the customer or object first, then traverse only permitted edges to build a scoped payload (profile, memories, signals, graph slice).
- Reading order for a domain bundle (Google context sets [Fact]): root index first, then matching query templates (verified queries), then object context, then concepts, learnings and documents.
- One budgeted call (Google LookupContext [Fact]): `lookup_context(resources ≤ 10, format yaml|json, budget_chars)` returns schema, links, definitions, sample values, quality and related objects, plus the relationships between the requested objects, in one LLM-ready block. dbt lesson: return the metric, its dimensions and sample values in one payload instead of a chatty loop [Inference, document 11].
- Freshness labels: each item states which access path answered (synced table, live read, search index) and its age (Airbyte context layer [Fact]).
- Every answer summarises its assumptions and links to results (OpenAI [Fact]); read tools return object type plus record ID so a later action acts on exactly those records (ServiceNow [Fact]).
- Lessons kept: consolidate tools; guide the goal, not the path; meaning lives in code — here, in connector config and ledger settings (OpenAI [Fact]; adaptation [Inference]).
- Limits [Inference]: default `budget_chars` 24,000 per call; keep each agent bound to one domain bundle (document 11, key finding 13).

**Copies.**
- Document 11, section 7 and "What to copy" 12. https://openai.com/index/inside-our-in-house-data-agent/
- Document 11, section 6 and "What to copy" 10–11. https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context ; https://docs.cloud.google.com/knowledge-catalog/docs/context-sets
- Document 11, section 8 and "What to copy" 18. https://www.salesforce.com/blog/?p=157012
- Document 11, section 9 and "What to copy" 19. https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html
- Document 24, "What to copy" 8. https://github.com/airbytehq/airbyte/blob/master/docs/platform/context-layer/readme.md

**Left out, and why.** Dependence on dense warehouse query history (absent). Answer caps such as Fabric's 25 rows × 25 columns (fits chat, not reporting). Foundry IQ-style multi-source agentic retrieval with reasoning effort levels: version 2 if document search becomes a bottleneck.

**Open questions.** The right default budget per model (Claude versus Qwen context windows are not in the documents). How to rank layer 4 chunks against layer 5 memories when they disagree [Inference: memory wins only if confirmed and newer].

### 9. Grounding with business terms, synonyms and routing (Quick BI knowledge base)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 9. Grounding with business terms, synonyms and routing (Quick BI knowledge base)](../../general-references/31-map-lingyang-alibaba-offers.md#9-grounding-with-business-terms-synonyms-and-routing-quick-bi-knowledge-base)

**Purpose.** Map the words staff use to exactly one metric or object, deterministically. Receivables example: "past due", "overdue" and "tertunggak" all map to `overdue_amt`; the question "how much is overdue at Penang branch" routes to the receivables topic and the branch dimension.

**Design to implement.**
- Four rule types, from Quick BI [Fact, 07 §6]:
  1. **business logic**: term, definition (≤100 characters), interpretation (≤300 characters in the enterprise knowledge base; ≤3,000 in the dataset knowledge base), synonyms, scope, optional forced rewrite;
  2. **regex**: Python-style regex ≤100 characters (implement with JavaScript regex [Inference]);
  3. **dataset selection**: keyword to up to 10 datasets;
  4. **smart table selection**: an LLM prompt describing each table's facts, grain, period and relationships, as a last resort.
- Precedence: dataset (local) knowledge overrides enterprise (global) knowledge [Fact, 07 §6].
- **No fuzzy matching**: the question must contain the term or a synonym [Fact, 07 KF 9]. Copy this. If no term matches, the system asks a clarifying question (section 11) rather than guessing [Inference].
- Bulk import and export via CSV or XLS ≤5 MB [Fact, 07 §6].
- **Scoped topics ("albums")** from Dataphin X-Analytics [Fact, 07 §5]: each question runs against an explicit set of tables, business knowledge, prompts and example questions; fields are labelled dimension, metric or statistical date and linked to entities. Version 1 has two topics: Receivables and Collections activity [Inference].
- **Dataset preparation** [Fact, 07 §6]: a default aggregation per measure; up to 10 expert ("quick") questions per topic; per-user Q&A permission with expiry; automatic field-quality scoring with suggested edits; guidance to put units in field names and avoid time-specific field names; learn dimension values (customer names, branch names) so they can be matched exactly.
- Dimension-value matching [Inference]: exact or alias match on learned values. The 2024 ChatBI did fuzzy name matching ("小郑" to "郑强") [Press, 07 §6]; the current documentation says no fuzzy matching. Allow aliases a human has confirmed, not fuzzy guesses.
- Glossary lives in the model, versioned with draft and publish (section 5), and synonyms are part of the record so citations can name them (25 row 17).

**Copies.**
- 07, §6 Quick BI knowledge, dataset preparation. https://help.aliyun.com/zh/quick-bi/user-guide/knowledge-base-configuration ; https://help.aliyun.com/zh/quick-bi/user-guide/prepare-data
- 07, §5 X-Analytics albums. https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis
- 25, C6 row 17.

**Left out, and why.** Dimension-value "learning caps" and rewrite modes: Quick BI does not publish the cap, and a 1,000-customer ledger is small [Inference].

**Open questions.** Which limit to use for interpretation text: 300 or 3,000 characters (see Contradictions).

## Open-source implementations (added 28 Nov 2026)

- LightRAG query modes (local, global, hybrid, mix) and Graphiti search/rerank recipes as context-retrieval building blocks — [lightrag](../../open-source-references/lightrag.md), [graphiti](../../open-source-references/graphiti.md).

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

