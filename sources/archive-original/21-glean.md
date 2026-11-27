# Glean, in depth, with its closest rivals (Microsoft 365 Copilot and Work IQ, Atlassian Rovo, Notion AI, Dropbox Dash, Moveworks, Guru, Onyx, Atlan)

Scope note (written 21 November 2026). This file catalogues what Glean sells, how it works underneath as far as Glean documents it, how it prices and deploys, and why large companies buy it. Shorter sections cover eight rivals in the same structure. Sources are Glean's docs (docs.glean.com and its `llms.txt` table of contents), developers.glean.com, Glean product pages and press releases, TechCrunch, BusinessWire, the vendor pages of the rivals, and the Onyx source code (cloned at commit `6425e7d`, 20 Nov 2026, under `/home/claude/research/_code/onyx`). The run had a hard budget (18 searches, 60 fetches) and the shared fetch pool ran dry several times. Pages I could not open are listed under open questions. Labels: [Fact] checked on a primary source, [Vendor claim] the company says it, [Inference] my reasoning, [Unverified] no source found. Earlier files cover Glean's MCP server and agent identity (`11-context-layer-products.md` §13, `12-agent-companies.md`); I do not repeat those details beyond what the catalogue needs.

## Key findings

1. **Glean's core asset is the permission-mirrored index, not the model.** Every connector pulls five things: content, metadata, identity (people and groups), permissions (ACLs) and activity (views, edits, shares). The graph is built on top of that index ([Fact](https://docs.glean.com/connectors/connectors-power-glean)). Everything else (Assistant, agents, MCP) reads through it.
2. **Permission mirroring keeps groups as groups.** The Indexing API stores each document's ACL as `allowed_users`, `allowed_groups` and `allowed_group_intersections` (the user must be in every group of one entry). Identities (users, groups, memberships) are pushed before content. Glean warns against flattening groups into user lists because those go stale ([Fact](https://developers.glean.com/libraries/indexing-sdk/permissions)).
3. **Three access modes per connector: indexed, live, hybrid.** Docs, wikis and tickets are indexed. Mail, calendar and chat are fetched live for the current user. Hybrid merges both into one permission-filtered pool ([Fact](https://docs.glean.com/connectors/connectors-power-glean)). Tools and MCP are a fourth, action-oriented path that makes nothing searchable ([Fact](https://docs.glean.com/connectors/about)).
4. **There is a deliberate escape hatch from user permissions: knowledge profiles.** An admin defines a bounded corpus (connectors plus scoped entities). Public-data agents and Gleanbot search that corpus for every viewer, overriding the invoking user's own ACL view (beta) ([Fact](https://docs.glean.com/administration/managing-agents/knowledge-profiles)). This is exactly what an external-facing agent needs.
5. **Independent agents (beta, 16 Nov 2026) are a separate principal.** They have their own profile, run on events, channel messages or schedules, use admin-scoped service credentials per connected system, and log the triggering user or event. Write tools stay behind human approval until validated ([Fact](https://docs.glean.com/agents/independent-agents)).
6. **The graph is inferred, not modelled.** Entities are extracted from the corpus with NLP and now LLMs. Edges carry timestamps, ACLs, confidence and provenance. The personal graph clusters atomic actions into subtasks, tasks and themes, mapped to OKRs ([Vendor claim](https://glean.com/blog/knowledge-graph-agentic-engine), June 2025). There is no customer-authored schema of objects, metrics or rules. This is the gap the founder's product fills.
7. **Pricing moved to a seat-plus-credits hybrid in 2026.** Enterprise Flex includes up to 100 Assistant queries per user per week on basic and standard models, unlimited search, and agent building. Premium models, agent runs, slides, deep research (on customer keys), meeting notes and learned memory consume pooled FlexCredits. Published medians: a premium Assistant query is about 35 credits and an agent run about 7 (90th percentile about 114) ([Fact](https://docs.glean.com/glean-enterprise-flex-pricing), updated 18 Nov 2026). Core Suite is seat-based, with a model hub billed at published per-token rates ([Fact](https://docs.glean.com/glean-core-suite-pricing)).
8. **Model routing is a product feature.** Auto mode chooses a model per Assistant request. Admins pick a policy per department: Balanced, Frontier or Economy. Optional automatic downgrades move Frontier users to Balanced at 75% of monthly usage and everyone to Economy at 90% ([Fact](https://docs.glean.com/administration/configure-llms)).
9. **Growth: $100M ARR (about Feb 2025), $200M (Dec 2025), $300M (28 May 2026).** At $300M: Fortune 500 customers nearly doubled year on year, 85%+ of customers use Glean in five or more departments, and wDAU/wMAU is 45% ([Vendor claim](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption)). Last priced round: $150M Series F at $7.2B (June 2025) ([Fact, press report](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/)).
10. **The 2026 sales pitch is cost: "we reduce your AI bill".** Glean claims its context cuts tokens. In its benchmark, off-the-shelf MCP tools used about 30% more tokens and Glean was preferred about 2.5 times as often ([Vendor claim](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption)). Onyx's README makes the same index-beats-MCP argument ([Fact](https://github.com/onyx-dot-app/onyx)).
11. **Governance is packaged as Protect (included) and Protect+ (paid add-on).** Protect gives a single-tenant platform, strict permission enforcement, ZDR (zero data retention), SSO/RBAC, audit and one-off oversharing reports. Protect+ adds weekly or continuous sensitive-content scans across 100+ sources, prompt-injection and jailbreak blocking, restricted topics, and agent alignment models that check tools before execution (beta) ([Fact](https://docs.glean.com/administration/protect/overview)).
12. **Glean's agent lifecycle (ADLC) is a guide, not tooling.** Six stages, with review depth scaled to scope (personal, team, enterprise). It asks for a golden test set with happy-path, edge, adversarial and permission cases, and tests under three user profiles. No judge or regression tooling is documented ([Fact](https://docs.glean.com/agents/agent-development-lifecycle/evaluate-agent-quality)).
13. **Rivals converge on the same pattern.** Microsoft Work IQ uses user-scoped actions plus an OPA/Rego policy engine evaluating every tool call ([Fact](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/)). Rovo bills $0.01 per credit over its allowance from 3 Dec 2026 ([Fact](https://atlassian.com/software/rovo/pricing)). Onyx (MIT core) stores ACLs as prefixed strings on each chunk and re-checks Salesforce at query time against `UserRecordAccess` ([Fact, code](https://github.com/onyx-dot-app/onyx)).
14. **For a 100 to 1,000 staff company most of Glean is overkill.** Activity-based personal graphs, 275 connectors, customer-hosted deployments and the alignment-model stack are not needed. What transfers: group-preserving ACLs, identity-before-content ingestion, negative permission tests, live fetch for personal sources, curated knowledge profiles for external agents, and per-department model policies with automatic downgrades ([Inference]).

## Breakdown

### 1. Glean in one paragraph

Glean is an enterprise "Work AI" platform: search, an assistant and agents over everything a company has in its SaaS apps, with each user seeing only what the source apps already let them see. The buyer is usually the CIO or the head of IT or enterprise applications, often with the CISO as co-signer, in companies from a few thousand to hundreds of thousands of staff. Typical buyers are tech, financial services and consumer internet companies (named customers include Databricks, Reddit, Pinterest, Samsung, Booking.com, Zillow, TIME, Ericsson, DBS, Comcast, eBay, Intuit and LinkedIn) ([Vendor claim](https://www.businesswire.com/news/home/20251208127913/en/Glean-Surpasses-%24200M-in-ARR-for-Enterprise-AI-); [Fact, press](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/)). The job is to cut the time employees spend finding information and to give AI agents grounded, permission-safe company context. What the customer pays for is broad daily adoption (45% wDAU/wMAU) across departments, plus, in 2026, a lower total AI bill because one context layer feeds every model and assistant ([Vendor claim](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption)).

### 2. Function catalogue (grouped as Glean groups it)

Glean's site navigation in 2026 groups the product into Enterprise Context, Intelligence, Assistant and Agents ([Fact](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption)). Docs sections are taken from the docs table of contents (`llms.txt`, read 21 Nov 2026) ([Fact](https://docs.glean.com/llms.txt)). Where I only saw a page title, the line says "(title only)".

**A. Enterprise Context (the data layer)**
- **Connectors and actions.** 275+ app connectors, per the 2026 site ([Vendor claim](https://www.glean.com/enterprise-context/enterprise-graph)). The Dec 2025 release said "100+ enterprise SaaS connectors" ([Vendor claim](https://www.businesswire.com/news/home/20251208127913/en/Glean-Surpasses-%24200M-in-ARR-for-Enterprise-AI-)), so the count definition differs between sources. Connector types: native, push-API (Indexing API), partner-built, and web-history fallback (private to each user, from the browser extension) ([Fact](https://docs.glean.com/connectors/about)). GA.
- **Indexing API and Indexing SDK.** Lets a customer push documents, ACLs and identities from custom or firewalled systems. Unlimited on Enterprise Flex ([Fact](https://docs.glean.com/glean-enterprise-flex-pricing); [Fact](https://developers.glean.com/libraries/indexing-sdk/permissions)). GA.
- **Glean Enterprise Graph.** Organisation-wide graph of people, projects, teams, customers, products and processes, plus "Enterprise Graph actions" for agents ([Vendor claim](https://www.glean.com/enterprise-context/enterprise-graph)). Included in the Core Suite seat ([Fact](https://docs.glean.com/glean-core-suite-pricing)).
- **Personal graph.** Each employee's work, inferred from their actions across apps ([Vendor claim](https://www.glean.com/enterprise-context/enterprise-graph)). It feeds personalisation and "quickstart" agents such as weekly work summaries and performance-review prep ([Vendor claim](https://glean.com/blog/knowledge-graph-agentic-engine)).
- **Memory.** "Saved memories" are included in the seat. "Learned memories" consume FlexCredits: median about 5, 90th percentile about 10 credits per monthly active user ([Fact](https://docs.glean.com/glean-enterprise-flex-pricing)). Admin page: memory and personalisation (title only).
- **Glean Protect.** See section E.
- **APIs and API Lookbook.** See section H.

**B. Intelligence (models)**
- **Model hub.** Choice of OpenAI, Google, Anthropic, xAI (TTS), Amazon Nova, Deepgram and open models (DeepSeek, GLM, Kimi, Nemotron, Qwen), plus Glean's own "Glean Waldo" model at $0.50 input and $2.50 output per million tokens ([Fact](https://docs.glean.com/glean-core-suite-pricing), 17 Nov 2026).
- **Two key models.** The Glean Universal Model Key (Glean provisions the models) or a Customer Key (BYOK on Azure OpenAI, Bedrock on self-hosted AWS, Vertex on self-hosted GCP, OpenAI or Anthropic) ([Fact](https://docs.glean.com/administration/configure-llms)).
- **Auto routing.** Picks a model per Assistant request "based on evaluations and live usage". Policies per department: Balanced (default), Frontier or Economy. Optional downgrades at 75% and 90% of monthly usage. Universal Key only; not for Agents or the API ([Fact](https://docs.glean.com/administration/configure-llms)).
- **Model governance.** Pages exist for model exclusion by department, a new-model review period, deprecation, capability and safety evaluations, and open models by region (titles only) ([Fact](https://docs.glean.com/llms.txt)).
- **Usage controls.** Per-user and per-department monthly limits, total-usage alerts, and user requests for higher limits that last to month end ([Fact](https://docs.glean.com/administration/management/usage/flexcredits-dashboard)).
- **AI gateway and MCP Gateway.** Named in the nav ([Fact](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption)). The MCP gateway routes external MCP tools through Glean (see file 11).

**C. Glean Assistant (third generation)**
- **Chat with an agentic engine.** Fast mode runs a fast model set with less reasoning. Thinking mode uses full agentic reasoning with the best model set. Through the Chat API these are `agentConfig.agent = FAST | ADVANCED`; omitting it gives "legacy Chat V2" ([Fact](https://docs.glean.com/administration/assistant/features/chat-api-agentic-engine), 29 Sep 2026). Agentic responses carry `workflowId: INTERNAL_LOOPING_PYAGENT`, which suggests an internal tool-calling loop ([Fact] same page; [Inference] about the loop).
- **Third-generation launch (25 Sep 2025).** The third-generation Assistant personalises results, learns each employee's writing tone, plans multi-step requests, runs parallel sub-agents and "scouts", asks clarifying questions and self-checks answers. It launched with the Enterprise Graph plus personal graph and "Agentic Engine 2" (Assistant only at launch). Available at launch: graph, personal graph, fast and extended thinking, deep research, scheduled agents, agent version control, enhanced Chat API. Beta at launch: personalised writing, conversational agent builder, automatic routing to agents, remote MCP servers, agent looping. Announced as coming: Canvas, 100+ new native actions, an MCP directory of 20+ validated servers, and LLM choice in Assistant ([Vendor claim](https://www.glean.com/press/glean-introduces-third-generation-ai-assistant-new-enterprise-graph-to-enable-the-superintelligent-enterprise)).
- **Assistant features (admin docs, titles only):** adaptive reasoning, code writer, contextual images, file upload, inline artifacts, real-time voice, slide-deck generation, deep research, live or federated fetch, custom instructions, content restrictions, AI watermarks, chat history and feedback data handling.
- **Data analysis.** Spreadsheet analysis in a sandbox, with file-security and technical-overview pages. Warehouse connections let Assistant query BigQuery, Snowflake and Databricks Genie (titles only) ([Fact](https://docs.glean.com/llms.txt)).
- **User features (titles only):** Canvas (a document-editing surface inside chat; requires model-hub usage on Core Suite ([Fact](https://docs.glean.com/glean-core-suite-pricing))), clarifying questions, plan, deep-linked citations, meeting notes with transcription consent, podcast, HTML, spreadsheet and slide artifacts, image generation, team chat, chat sharing, skills, skill reflection, "update Salesforce opportunities", and an assistant library of prompts.
- **Proactive AI, content creation, multiplayer, work execution, data analysis and research** are listed as Assistant sub-areas in the nav ([Fact](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption)).

**D. Glean Agents**
- **Agent Builder.** Agents can be built by natural-language description, from an Assistant chat ("create task agent from assistant"), in a workflow (flow) mode, through a headless builder (API or code) and with a Git-backed agent development lifecycle (configure Git ADLC, merge branches). The builder also offers debugging and re-run from a step (titles only) ([Fact](https://docs.glean.com/llms.txt)).
- **Step memory.** Each tool step is set to read the previous step only (default), all previous steps, or none. Explicit `[[ ]]` references pull in a specific step's output. Sub-agents have their own memory and return only their Respond output. Without chat history, memory is kept up to 2 hours ([Fact](https://docs.glean.com/agents/concepts/memory)).
- **Triggers and schedules** (titles only); **auto mode agents** (title only); **agent library** of templates; **sharing permissions**; **agent orchestration** (nav).
- **Independent agents (beta).** See key finding 5 ([Fact](https://docs.glean.com/agents/independent-agents)).
- **Service credentials** and agent identity: see file 11.
- **Built-in tools:** analyze data, calendar search, code search, code writer, company search, email, expert search, people-profile search, plan-execute, read document, read personal activity, respond, retrieve chat insights, retrieve search insights, think, wait for user input, web search. Also custom tools, human-in-the-loop for tools, and inline execution of write tools (titles only) ([Fact](https://docs.glean.com/llms.txt)).
- **Agent governance:** review-and-publish, agent access, agent routing (picks which agent answers), agent library management, skills roles, skill sharing, skill scanning, tool visibility scoping, and "run without user confirmation" for named write tools (titles only).
- **Agent development lifecycle (ADLC):** see section 3.6.

**E. Glean Protect and Protect+** ([Fact](https://docs.glean.com/administration/protect/overview))
- **Protect (in every deployment):** single tenant, strict permission enforcement, ZDR, SSO and RBAC, encryption, audit logs, compliance certifications. One-off CSV reports of sensitive or overshared content, fixed by uploading a CSV that hides items from Glean. Agent guardrails: who may create, edit, view or share agents, and agents limited to the invoking user's rights.
- **Protect+ (annual site-wide add-on):** weekly sensitive-findings policies across 100+ sources, continuous scanning on some connectors, default policies, classifier-based severity, and triage workflows. AI security: blocks prompt injection, jailbreaks, malicious code and toxic content. Restricted topics. Agent alignment models that check a tool call before execution (beta). Palo Alto Networks integration (beta).
- **Also in docs (titles only):** agent access policies, agent scan, untrusted-URL monitoring, a sensitive-content prompt warning to users, security-posture dashboards for agents and Assistant, and AI security insights.
- **AWARE (11 Mar 2026).** An agent-security framework co-authored with Databricks and Palo Alto Networks, built on five questions: Actor intent, Work context, Autonomous guardrails, Real-time risk scoring and blocking, Ecosystem observability. Protect features mapped to it: restricted-topic policies (beta); agent alignment models that pre-scan every write action, for example blocking a post to an org-wide channel when a private DM was intended (beta); runtime protection against injection, malicious code and toxic content; sensitive-content policy templates for secrets, banking data, medication and PII (GA); sensitive-content models that auto-hide overshared items, tunable with natural-language rules (policies GA, tuning beta); triage with SIEM/SOAR export (beta); Tines runbooks (GA); Cortex Cloud DSPM and Prisma Browser (beta); customer-managed keys and private connectivity (GA) ([Vendor claim](https://glean.com/blog/agentic-security-aware)).

**F. Search and knowledge features** (user guide, titles only) ([Fact](https://docs.glean.com/llms.txt))
- Enterprise search with filters and facets, address-bar search, a home page, and browser-history apps.
- Knowledge curation: announcements, curated Answers, collections, Go links, pins, projects, team pages, and verification (owners re-verify content).
- People directory and profiles, expert search.
- Surfaces: web app, browser extension and sidebar, desktop, mobile (with Intune MAM), Slack (Gleanbot, channel Q&A, daily digest, public mode), Glean Companion.

**G. Glean Tau (desktop agent workspace)**
- A desktop app for macOS and Windows that combines Glean's permission-aware knowledge with local files, folders, repos, terminal, Git and browser/computer use. Engineers can review code and open pull requests; others draft documents, spreadsheets and slides and capture meeting notes. Same identity and permissions as Glean Web. Page updated 9 Nov 2026; status not stated ([Fact](https://docs.glean.com/user-guide/glean-tau)). Sub-pages cover approval modes, an activity journal, automations, local MCP, memory, skills, projects, goals and "shots" (titles only).

**H. Platform, APIs and SDKs**
- Client APIs (Search, Chat, Agents) consume FlexCredits. Platform and admin APIs (Web SDK, Authentication, Activity) and data APIs (Indexing, Connector, Tools) are unlimited ([Fact](https://docs.glean.com/glean-enterprise-flex-pricing)).
- **MCP server:** built-in tools, agents exposed as tools, a gateway for external MCP servers, elicitations, and host guides. Plugins exist for Claude Code, Codex and Cursor, plus MDM rollout of MCP config (titles only) ([Fact](https://docs.glean.com/llms.txt)). Details are in file 11.
- OAuth authorisation server, so Glean can be an OAuth provider for MCP hosts (title only).

**I. Analytics and insights**
- Insights for agents, Assistant, LLMs and MCP, plus "insights chat" (ask questions of your usage data). A data dictionary and production queries for exporting GCE logs (Glean's activity logs in the customer's cloud) are documented (titles only) ([Fact](https://docs.glean.com/llms.txt)).
- A FlexCredits usage dashboard broken down by users, product types, departments and models, with CSV export ([Fact](https://docs.glean.com/administration/management/usage/flexcredits-dashboard)).

**J. Upcoming:** "Glean Transform" is marked "coming soon" in the 2026 nav ([Fact](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption)); what it does is [Unverified].

**K. Vertical packs.** The MCP user guide has pages by function: sales, support, engineering, operations, product management and data analytics (titles only) ([Fact](https://docs.glean.com/llms.txt)). Packaging, as opposed to guidance, is [Unverified]. "Update Salesforce opportunities" is a documented sales write action (title only).

### 3. How it works underneath

#### 3.1 Connectors: what gets crawled
Plain English: a connector is a robot that reads one app (say Confluence) and copies five kinds of thing into Glean. For a page called "Q3 pricing" it copies the text, the last-edited date, who wrote it, the list of people and groups who may see it, and who viewed it recently.

Detail ([Fact](https://docs.glean.com/connectors/connectors-power-glean)):
- Content: titles, bodies, comments, attachments. Metadata: modified time, owner, status, app-specific fields (used for ranking, filters and relationships). Identity: people and groups, matched across apps where directory data allows. Permissions: ACLs. Activity: views, edits and shares, where the API provides them.
- Crawl types: full, incremental, activity, identity and people-data crawls, plus deletion handling by webhook and full-crawl clean-up. The crawler is designed to trade freshness against source API limits. Per-connector refresh rates and limits sit on sub-pages I could not open ([Fact](https://docs.glean.com/connectors/crawling-frequency), updated 29 Sep 2026).
- Freshness: changes arrive "as quickly as the source and connector allow", via webhooks or incremental crawls ([Fact](https://docs.glean.com/connectors/about)).
- Failure mode Glean names itself: enforcement is only as good as the connector configuration. Admins should test search as restricted users before enabling Chat or Agents ([Fact](https://docs.glean.com/connectors/connectors-power-glean)).

#### 3.2 Permission mirroring
- **Document ACL model** ([Fact](https://developers.glean.com/libraries/indexing-sdk/permissions)): `allowed_users` (email or source user ID), `allowed_groups`, and `allowed_group_intersections`. The last is a list of `required_groups` sets: a user qualifies by being in every group of any one set (for example "Finance" AND "Malaysia").
- **Identity model:** `get_identities()` returns users, groups and memberships. Returning groups without memberships raises `InconsistentDataError`. If source and Glean share an IdP, set `is_user_referenced_by_email=True`. Otherwise push a user record mapping each source ID to a person.
- **Ordering:** the identity crawl runs before content, so ACLs never reference unknown principals. Streaming connectors must push identities separately.
- **Testing:** the SDK supports negative tests (`negative_test_identities`, `assert_negative_identities_absent()`). The harness rejects `allow_anonymous_access` and `allow_all_datasource_users_access`, because these make it impossible to prove denial.
- **Enforcement points:** filtering on search, chat retrieval and agent reads. The same filter applies to live and hybrid fetches. The source app checks again at click time. Everything stays inside a single-tenant environment ([Fact](https://docs.glean.com/connectors/connectors-power-glean)). Earlier research found Glean enforces permissions inside the retrieval path, not as a filter on generated answers ([Vendor claim](https://www.glean.com/blog/from-enterprise-search-to-enterprise-context-what-ai-agents-actually-need), in file 12).
- **Deliberate override:** knowledge profiles (key finding 4). Profiles exclude email and calendar, and admins can scope down to Slack workspaces, GitHub repos, Drive directory groups and similar ([Fact](https://docs.glean.com/administration/managing-agents/knowledge-profiles)).

#### 3.3 Enterprise Graph and personal graph
Plain English: Glean notices that "Project Falcon" shows up in many document titles, Jira epics and Slack channels. It makes "Project Falcon" a node and links it to the people who edit those items. It can then answer "who leads Falcon?" by walking links rather than guessing from text.

Detail ([Vendor claim](https://glean.com/blog/knowledge-graph-agentic-engine), 27 Jun 2025):
- Facts are stored as triples (subject, predicate, object), for example engineer → owns → Jira ticket. Example entities: people, documents, tools, projects, systems, customers, tickets, roles, locations, product versions, OKRs. Predicates: authored-by, led-by, reports-to, references, owns.
- Each edge carries metadata: timestamps, ACL, confidence score and provenance (calendar, directory or email).
- Construction: automatic NLP noun-phrase extraction with no human review of private data, filtered by frequency and heuristics. Prominence comes from titles, link counts and share or access counts. A predicate is kept only on strong, repeatable evidence. LLMs now do entity annotation and intent recognition. A real-time crawler feeds both search and graph. The graph is built inside each customer's single-tenant environment ([Vendor claim](https://www.glean.com/enterprise-context/enterprise-graph)).
- Use: user intent → structured query → graph traversal for deterministic lookups (for example "all account executives in Asia") and multi-hop questions. Context-based disambiguation ("Reddit" the customer versus the platform).
- Personal graph: atomic actions (created doc, attended meeting, ran internal tool) are clustered into subtasks, tasks and themes, and mapped to OKRs. Collaboration edges come from comments and shared Slack channels. A source-agnostic schema with a chronological store reconciles what "comment" means in Jira versus Google Docs. Glean admits that work done off-screen is invisible and some intent needs explicit labels.
- Not published: the storage engine, the full schema, edge scoring and how planning uses the graph. The docs have a security page for the knowledge graph that I could not open ([Fact, title](https://docs.glean.com/security)).

#### 3.4 Skill and expert discovery
Expert search and people-profile search are built-in agent tools, and team pages and profiles exist (titles only) ([Fact](https://docs.glean.com/llms.txt)). The graph page makes no specific claim about skills ([Fact](https://www.glean.com/enterprise-context/enterprise-graph)). [Inference] Expertise is probably derived from authorship and activity edges; no published method.

#### 3.5 Agent runtime
- Agents are step graphs (flow) or auto-mode agents that pick tools themselves. Each step can override the org default model ([Fact](https://docs.glean.com/administration/configure-llms)). Step memory is explicit and token-bounded, and a warning appears when documents are truncated ([Fact](https://docs.glean.com/agents/concepts/memory)).
- Agents run as the invoker by default. Independent agents run as their own principal with service credentials ([Fact](https://docs.glean.com/agents/independent-agents)).
- Agent sandbox and "programmatic tool calling" are listed under security docs (titles only) ([Fact](https://docs.glean.com/security)).

#### 3.6 Testing and the Agent Development Lifecycle
- Six stages: plan and design; evaluate quality; build safe and maintainable agents; test and launch; manage drafts, versions and rollbacks; govern, monitor and maintain. Review depth scales from personal to team to enterprise. More review is required if an agent is shared broadly, touches restricted data, uses write tools or is high-impact ([Fact](https://docs.glean.com/agents/overview/agent-development-lifecycle)).
- Evaluation: a golden test set of prompts with ideal outcomes, in four buckets (happy path, edge, adversarial, permission). Set a pass rate (example: correct citations in 95% of tests) and define critical failures. A graceful "I don't have access to that" beats a hallucination. Permission tests under standard, restricted and admin profiles are mandatory beyond personal scope. When a test fails, fix root causes (scope, connector, missing validation step) rather than tweaking the prompt ([Fact](https://docs.glean.com/agents/agent-development-lifecycle/evaluate-agent-quality)).
- Git-backed ADLC with branches and merges exists (titles only).

#### 3.7 Deployment architecture
- Two models. Glean Hosted: a single-tenant instance on GCP, with regions on GCP and AWS. Customer Hosted (formerly "Cloud-Prem"): Glean runs the tenant as a managed service inside the customer's GCP or AWS project, with the customer's VPC-SC, SCP, EDR (CrowdStrike, Wiz) and IDS controls. Glean still does upgrades and keeps support access. No manual patching is allowed. AES-256 at rest, TLS in transit ([Fact](https://docs.glean.com/get-started/prepare/about-deployment)). Azure and on-premises are not offered per this page.
- Certifications: ISO 42001, ISO 27001, SOC 2 Type II and HIPAA ([Vendor claim](https://glean.com/blog/agentic-security-aware), Mar 2026). SOC 2 reports are available under NDA via the Trust Portal ([Fact](https://docs.glean.com/security)). FedRAMP and ISO 27701 status: [Unverified]. **Sources disagree on clouds.** The AWARE post says single-tenant deployment is available on AWS, Azure or GCP. The deployment docs list only GCP and AWS for Customer Hosted ([Fact](https://docs.glean.com/get-started/prepare/about-deployment)).

### 4. Commercials

| Item | Figure | Date | Source |
|---|---|---|---|
| ARR | $100M | ~Feb 2025 (15 months before May 2026) | [Vendor claim](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption) |
| ARR | $200M (doubled in 9 months) | 8 Dec 2025 | [Vendor claim](https://www.businesswire.com/news/home/20251208127913/en/Glean-Surpasses-%24200M-in-ARR-for-Enterprise-AI-) |
| ARR | $300M (tripled in 15 months) | 28 May 2026 | [Vendor claim](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption) |
| ARR caveat | TechCrunch notes consumption revenue is a run rate, not strictly recurring | 28 May 2026 | [Fact](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/) |
| Last round | $150M Series F, $7.2B valuation | June 2025 | [Fact, press](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/) |
| $1M+ contracts | grew nearly 3x in a year | Dec 2025 | [Vendor claim](https://www.businesswire.com/news/home/20251208127913/en/Glean-Surpasses-%24200M-in-ARR-for-Enterprise-AI-) |
| Usage | 5 queries per employee per day; 20T+ tokens per year run rate; 27B+ documents indexed since founding | Dec 2025 | same |
| Engagement | wDAU/wMAU 40% (Dec 2025), 45% (May 2026) | | same; [Vendor claim](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption) |
| Breadth | 85%+ of customers in 5+ departments; Fortune 500 customers nearly doubled year on year; customers in 28 countries | May 2026 | same |
| Team | 1,000+ employees | Dec 2025 | [Vendor claim](https://www.businesswire.com/news/home/20251208127913/en/Glean-Surpasses-%24200M-in-ARR-for-Enterprise-AI-) |
| Age | 7 years (founded 2019) | May 2026 | [Fact, press](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/) |

**Packaging and pricing (2026).**
- **Enterprise Flex (seat plus credits)** ([Fact](https://docs.glean.com/glean-enterprise-flex-pricing), 18 Nov 2026):
  - Each seat (per user per month) includes up to 100 Assistant queries a week on basic and standard models, plus unlimited search, collections, Go links, people directory, agent building and sharing, and platform and indexing APIs. Saved memories are included.
  - Pooled FlexCredits: every agreement has a base pool, and more comes in packs. Overage is charged "at current rate card".
  - Median and 90th-percentile credits per unit: Assistant query (basic or standard) about 7 / 26; premium query 35 / 120; voice session 3 / 26; meeting notes 9 / 18 per meeting; code writer 9 / 32; image 7 / 9; slides 45 / 142; deep research on a customer key 33 / 144 per run; memory 5 / 10 per MAU; agent run 7 / 114. Legacy "advanced agent run" 150 / 450.
  - Search through the client APIs costs 1 credit per query.
  - Discounts apply for BYOK and self-hosting. Protect+ and Premium Support (24x7, 1-hour critical response) are annual site-wide add-ons.
  - No dollar price per credit or per seat is published.
- **Core Suite (seat-based)** ([Fact](https://docs.glean.com/glean-core-suite-pricing), 17 Nov 2026): the seat includes graph, agent harness, connectors, Protect, search, saved memories, agent building, governance, platform and indexing APIs, and the Search API, for "normal human-scale" use. Reasoning modes, learned memories, Canvas, image, slides, code writer, deep research, meeting notes, voice, the builder assistant, agent debugging, and the Chat and Agents APIs need **Model Hub Usage**. This is an upfront commit drawn down at published per-token rates, and only successful LLM calls are charged. A "Flexible Model Management" fee is a percentage of LLM usage (percentage not given).
- **Seat price.** Third-party guides discuss seat prices and minimums ([Unverified, listing only](https://www.eesel.ai/blog/glean-pricing); [listing only](https://www.activepieces.com/blog/glean-pricing-in-2026-cost-seats-and-minimums)). I did not open them, and the figures there are not vendor-confirmed.
- **TechCrunch summary:** two models, consumption-based or hybrid (fixed fee per active user plus model usage) ([Fact, press](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/)).

### 5. Why customers choose Glean (and complaints)

1. **Cross-app search that respects permissions, working on day one.** One index over 100 to 275 apps, versus Microsoft's strength inside Microsoft 365. Evidence: 85%+ of customers expanding to 5+ departments and $1M+ deals tripling ([Vendor claim](https://www.businesswire.com/news/home/20251208127913/en/Glean-Surpasses-%24200M-in-ARR-for-Enterprise-AI-)). [Inference] Companies running Google Workspace, Slack, Atlassian and Salesforce alongside Microsoft cannot get this from Copilot alone. Work IQ only reaches non-Microsoft systems through Copilot connectors that the connector developer must opt in to Work IQ ([Fact](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/)).
2. **Model neutrality and cost control.** Many vendors' models behind one key, per-department Auto policies with automatic downgrades, BYOK, and the pitch that Glean's context lowers token spend ([Fact](https://docs.glean.com/administration/configure-llms); [Vendor claim, CEO quote](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/)).
3. **Security posture fit for large companies.** Single tenant, an option to host in the customer's own cloud, ZDR, Protect+ oversharing remediation. Oversharing is the classic blocker for Copilot rollouts ([Fact](https://docs.glean.com/administration/protect/overview); [Inference] on the Copilot comparison).
4. **Context for every other AI tool.** The MCP server and plugins for Claude Code, Codex and Cursor put Glean behind other assistants, so it does not have to win the chat window ([Fact](https://docs.glean.com/llms.txt)). Its benchmark claims a 66% win rate on simple tasks, 73% on complex ones, and 30% fewer tokens than off-the-shelf MCP tools ([Vendor claim](https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption)).
5. **Compared with Copilot, Glean claims** 275+ permission-aware connectors, a graph of "60+ signals", record-level permission sync in near real time, structured retrieval from CRM, HR and warehouses, 35+ models, SaaS or AWS/GCP VPC hosting, and a single SKU ([Vendor claim](https://www.glean.com/glean-vs-copilot)). Headline value claims: up to 110 hours saved per user per year, 20% fewer internal support requests, and payback in under 6 months (method not given) ([Vendor claim](https://www.glean.com/compare)).
6. **Adoption numbers.** 5 queries per employee per day and a 45% wDAU/wMAU ratio are what a CIO can show a CFO ([Vendor claim](https://www.businesswire.com/news/home/20251208127913/en/Glean-Surpasses-%24200M-in-ARR-for-Enterprise-AI-)).

**Complaints and weaknesses.**
- **Price and opacity.** No public seat or credit prices. Consumption billing makes the "ARR" figure a run rate ([Fact, press](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/)). Variable credit costs (an agent run's 90th percentile is about 16 times its median) make budgets hard to forecast ([Fact](https://docs.glean.com/glean-enterprise-flex-pricing); [Inference]).
- **Quality depends on connector set-up.** Glean itself warns of this ([Fact](https://docs.glean.com/connectors/connectors-power-glean)).
- **Ambiguous features.** Many key features are beta (independent agents, knowledge profiles, alignment models, agent identity).
- **Competitive pressure.** TechCrunch lists Google, Microsoft, OpenAI, Anthropic, Salesforce and Atlassian building the same thing ([Fact, press](https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/)).
- G2 or Reddit complaint mining was not possible within budget. [Unverified] Commonly reported issues are price, minimum seat counts, and set-up effort for custom sources.

### 6. How it deploys
- **Glean Hosted.** No infrastructure work; go straight to "Stage 1, create the workspace". **Customer Hosted.** Prepare the cloud project per the GCP or AWS guide first ([Fact](https://docs.glean.com/get-started/prepare/about-deployment)).
- **Then:** connect data sources, wait for full crawls, validate permissions by searching as restricted users, then enable Assistant and agents, then roll out browser and desktop clients via MDM ([Fact](https://docs.glean.com/connectors/connectors-power-glean); deployment page titles in [docs index](https://docs.glean.com/llms.txt)).
- **Time to live:** not published on the pages I read. [Unverified]
- **Self-serve:** essentially none for the core product. It is sales-led, with admin console set-up by IT. Agents are self-serve for employees once deployed.

### 7. What to copy (Glean)
1. **Store ACLs as users plus groups plus group intersections, never flattened.** Keep a separate identity table (users, groups, memberships) that must be loaded before records. Source: https://developers.glean.com/libraries/indexing-sdk/permissions
2. **Make negative permission tests a release gate.** For every connector and agent, run a test identity that must not see a given record, and refuse "public" or "all users" shortcuts in test harnesses. Source: same.
3. **Give every source an access mode: indexed, live or hybrid.** For collections, index invoices, customers and payment history; fetch mailboxes and chats live per user. Source: https://docs.glean.com/connectors/connectors-power-glean
4. **Use knowledge profiles for external agents.** A customer-facing reminder agent should read an admin-curated corpus (approved templates, policies, that one customer's account data), not any staff member's view. Source: https://docs.glean.com/administration/managing-agents/knowledge-profiles
5. **Give independent agents their own principal.** Service credentials scoped per system, the triggering event logged, write tools behind approval until validated, and a pause or unpublish switch. Source: https://docs.glean.com/agents/independent-agents
6. **Make step memory explicit.** Each step chooses previous-only, all, or none, with `[[step]]` references and truncation warnings. This bounds token cost. Source: https://docs.glean.com/agents/concepts/memory
7. **Use per-department model policies with automatic downgrade thresholds** (75% and 90% of the monthly budget) and per-step model overrides for agents. Source: https://docs.glean.com/administration/configure-llms
8. **Price as a seat with an included human-scale allowance plus pooled credits**, and publish median and 90th-percentile credit costs per action type. Source: https://docs.glean.com/glean-enterprise-flex-pricing
9. **Put provenance, confidence and ACL on every inferred edge.** Source: https://glean.com/blog/knowledge-graph-agentic-engine
10. **Use Glean's four-bucket golden set** (happy, edge, adversarial, permission) under three user profiles, and prefer "I don't have access" over guessing. Source: https://docs.glean.com/agents/agent-development-lifecycle/evaluate-agent-quality

### 8. What not to copy, and where Glean is weak
- **The inferred-only graph.** Glean never lets the customer declare "an invoice is overdue when due_date < today and balance > 0". For receivables, definitions must be authored and versioned. Inference is a supplement ([Inference]).
- **275 connectors and activity crawls.** That breadth took six years ([Vendor claim](https://glean.com/blog/knowledge-graph-agentic-engine)). A collections product needs about 5 to 10 sources (ERP or accounting, CRM, mail, a messaging channel, payments).
- **Customer-hosted deployments, alignment-model stacks and Protect+ scanning across 100+ sources** are not needed at 100 to 1,000 staff.
- **Opaque pricing.** It is a known friction point. Small and mid-sized buyers expect a list price.

### 9. Relationship to the founder's product
**Teacher, and a possible supplier or partner later; not a direct competitor today.** Glean sells horizontally to large enterprises and has no authored business model of objects, metrics, rules and actions for finance. Its permission mechanics and agent governance are the best documented in the category and should be copied. Larger customers of the founder may already own Glean and could use it as a context tool via MCP. [Inference] Glean could move into structured data: it already connects Assistant to Snowflake, BigQuery and Databricks Genie, so watch "Glean Transform".

---

## Rivals (shorter, same structure)

### R1. Microsoft 365 Copilot (search) and Work IQ
1. **In one paragraph.** Microsoft's assistant inside Microsoft 365, bought by Microsoft-standard companies of every size, usually through an existing E3/E5 agreement. Work IQ is the "workplace intelligence layer" that lets Copilot and other agents reason over Microsoft 365, Dynamics 365, Power Platform and connected systems ([Fact](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/), updated 18 Nov 2026).
2. **Functions.** Work IQ has four areas: Chat (A2A and REST), Context (grounding across M365 data), Tools (a remote Work IQ MCP server with 10 generic tools, such as fetch, create and update, over mail, calendar, files, people, chat and sites, addressed by resource paths) and Workspaces (SharePoint Embedded storage for agent working data). Copilot connectors bring in third-party data. The semantic index for Copilot is a vector index over Microsoft Graph. It runs at two levels: tenant (SharePoint text files plus Copilot connector data) and user (mail and documents the user created, commented on or shared). It is on by default and cannot be disabled. Results are trimmed to the user's existing access. Content shared by "anyone in my organization" link does not enter the tenant index. The only exclusion is per SharePoint site ("allow in search = No") or Purview DLP. Index data stays in the tenant's region. Files up to 512 MB are supported ([Fact](https://learn.microsoft.com/en-us/microsoftsearch/semantic-index-for-copilot), Apr/Aug 2026). Work IQ in Copilot Studio is in preview ([Fact, title](https://learn.microsoft.com/microsoft-copilot-studio/use-work-iq)).
3. **Underneath.** A few broad permissions instead of hundreds of OAuth scopes. An OPA/Rego policy engine evaluates every request against resource path, method, user identity and data content. Every action is user-scoped. Every tool call is logged and evaluated for audit, rate limiting and compliance ([Fact](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/)).
4. **Commercials.** Licensed Copilot users get Work IQ in Copilot experiences. Custom and third-party agents, and unlicensed users, are billed on usage in Copilot Credits ([Fact](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/)). The per-seat Copilot price was not checked this round [Unverified].
5. **Why chosen.** It is already in the Microsoft agreement and native to Outlook, Teams and SharePoint. Complaints: the semantic index makes oversharing visible, and the exclusion controls are coarse (site-level). Glean's comparison page also claims Copilot has weaker third-party coverage, connector permissions enforced at source rather than record level, Salesforce limited to standard objects, Azure-only hosting, and SKU sprawl across Copilot, Copilot Studio and Power Platform ([Fact](https://learn.microsoft.com/en-us/microsoftsearch/semantic-index-for-copilot); [Vendor claim, competitor](https://www.glean.com/glean-vs-copilot)).
6. **Deploys.** Admin enablement in the M365 admin center. Connector participation in Work IQ must be enabled by the connector developer ([Fact](https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/)).
7. **Copy.** Generic verb tools over resource paths (fetch, create, update on `/customers/{id}/invoices`) rather than one tool per action, plus a policy engine check on every call. Source: https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/
8. **Weak.** The Microsoft-first data estate.
9. **Relationship.** Platform and channel; for Microsoft-standard customers, a likely host for the founder's agent (via MCP or A2A).

### R2. Atlassian Rovo
1. **In one paragraph.** AI search, chat and agents built into Atlassian Cloud, over the Teamwork Graph (work, knowledge, people and systems across first- and third-party tools). Bought by every Atlassian Cloud customer on Standard, Premium or Enterprise; Free plans are excluded ([Fact](https://atlassian.com/software/rovo/pricing)).
2. **Functions.** Search, Chat (including a premium "Work mode"), Studio (agents, apps, automations), custom agents, Teamwork Graph connectors, an Atlassian Rovo MCP server, the Teamwork Graph CLI and the Rovo CLI ([Fact](https://atlassian.com/software/rovo/pricing)). Data Center customers get only Rovo connectors for Confluence and Jira DC.
3. **Underneath.** The Teamwork Graph and its API, with "enriched" calls costing 1 to 10 credits ([Fact](https://atlassian.com/software/rovo/pricing)). Permission mechanics were not read [Unverified].
4. **Commercials.** Monthly pooled credit allowances that stack across apps. Example: 100 Premium users on Jira plus Confluence get 7,000 + 7,000 credits a month. Teamwork Collection gives 10x the allowance. Overage is $0.01 per credit, with usage billing from 3 Dec 2026. A basic interaction costs 10 credits; a typical prompt uses 10 to 25. Connector indexing, MCP install and in-app search are free. Alerts fire at 80% and 100% ([Fact](https://atlassian.com/software/rovo/pricing)).
5. **Why chosen.** Already paid for in the Atlassian plan; knows Jira and Confluence structure. Complaint: the move to usage pricing amid weak AI adoption ([Fact, title](https://www.techtarget.com/it-infrastructure/news/366622263/Atlassian-Rovo-pricing-shifts-amid-industry-AI-struggles); not opened).
6. **Deploys.** It switches on inside existing Cloud subscriptions.
7. **Copy.** Make indexing and in-app search free, and charge only for AI reasoning calls, with a published per-credit overage price. Source: https://atlassian.com/software/rovo/pricing
8. **Weak.** Centred on Atlassian; little finance data.
9. **Relationship.** Teacher on pricing; not a competitor in receivables.

### R3. Notion AI (Enterprise Search)
1. **In one paragraph.** Notion AI's Enterprise Search answers questions across the Notion workspace, connected apps (Slack, Teams, Google Drive, Jira and others) and the web, with citations. It is on Business and Enterprise plans ([Fact](https://www.notion.com/en-gb/help/enterprise-search)).
2. **Functions.** Source scoping (one source, a page or teamspace, web on or off), @-mentions as context, search inside databases including views, relations and properties, and a model choice of GPT, Claude or Gemini ([Fact](https://www.notion.com/en-gb/help/enterprise-search)).
3. **Underneath.** "Least-privilege permission enforcement" and no training on customer data. Enterprise adds data residency, retention policies, SAML, SCIM, encryption key management, and audit logs feeding DLP or SIEM ([Fact](https://www.notion.com/en-gb/help/enterprise-search-security-and-privacy-practices)). Sync and ACL mechanics are not published on these pages.
4. **Commercials.** Plan pricing not checked [Unverified].
5. **Why chosen.** The team already lives in Notion.
6. **Deploys.** Self-serve; connect apps from settings ([Inference]).
7. **Copy.** Let users narrow an AI question to one source or object scope; this cuts tokens and errors. Source: https://www.notion.com/en-gb/help/enterprise-search
8. **Weak.** Thin published internals; limited connector depth.
9. **Relationship.** Neither; possibly a data source.

### R4. Dropbox Dash
1. **In one paragraph.** AI universal search and work assistant across connected apps, with Stacks (shared collections) and admin "Protect and Control". Since Oct 2025 it is available to teams of any size without sales or IT involvement (selected US teams) ([Fact](https://dash.dropbox.com/release-notes)).
2. **Functions (dated).**
   - Find, Ask, Write and Organize search box; verified-results badges (Apr 2025).
   - Answers on LLMs hosted on Groq (Mar 2025).
   - Connectors: Slack (including DMs, Jul 2025), Teams, Gong, Zoom, Confluence, Jira, Salesforce (Accounts and Opportunities, Aug 2025), Workday (Jul 2025), HubSpot and Zendesk (Jun 2025), Marketo (Jan 2026).
   - Protect and Control: stale-access reports, bulk collaborator removal, policies with automated remediation and alerts (Sep 2025), CSV export of up to 50,000 items (Jan 2026).
   - Local Dash MCP server (Oct 2025); image OCR; a model selector with up to five models (Jan 2026); a combined "Work account" set-up for Google and Microsoft (Mar 2026) ([Fact](https://dash.dropbox.com/release-notes)).
3. **Underneath.** Not published in the notes.
4. **Commercials.** Not checked [Unverified].
5. **Why chosen.** Dropbox's installed base; oversharing clean-up bundled with search.
6. **Deploys.** Self-serve for teams; guided install for Dropbox and Google Drive without service accounts (Jan 2025) ([Fact](https://dash.dropbox.com/release-notes)).
7. **Copy.** Bundle a "who can see this" oversharing report with the AI product: buyers need it before they trust AI search. Source: https://dash.dropbox.com/release-notes
8. **Weak.** No agents in the notes.
9. **Relationship.** Neither.

### R5. Moveworks (ServiceNow)
1. **In one paragraph.** An employee-service AI assistant and enterprise search with an "Agentic Reasoning Engine". About 5.5 million employee users; nearly 90% of customers deploy to all staff. Named customers: Siemens, Toyota, Unilever. ServiceNow completed the acquisition (release dated 15 Dec 2025 per URL) to build an "AI-native front door" for IT and HR requests ([Fact](https://www.businesswire.com/news/home/20251215128980/en/ServiceNow-completes-acquisition-of-Moveworks)).
2. **Functions.** Assistant, enterprise search, reasoning engine, and 100+ integrations ([Fact](https://www.businesswire.com/news/home/20251215128980/en/ServiceNow-completes-acquisition-of-Moveworks)). Details not read.
3. **Underneath.** Not read [Unverified].
4. **Commercials.** Deal value not stated in the release. [Unverified] It was reported at about $2.85B when announced in March 2025. About 250 joint customers.
5. **Why chosen.** Ticket deflection in IT and HR; ServiceNow fulfilment behind it.
6. **Deploys.** Not read.
7. **Copy.** Measure the share of requests resolved without a human. ServiceNow claims its agents resolve 90% of IT requests ([Vendor claim](https://www.businesswire.com/news/home/20251215128980/en/ServiceNow-completes-acquisition-of-Moveworks)).
8. **Weak.** Now tied to ServiceNow.
9. **Relationship.** Teacher on "assistant as front door to workflows".

### R6. Guru
1. **In one paragraph.** "AI source of truth": a verified knowledge layer delivering cited, permission-aware answers through Knowledge Agents in Slack, Teams, the browser and, via MCP, other AI tools. Bought by support, sales enablement and HR or knowledge managers ([Fact](https://getguru.com/pricing)).
2. **Functions.** AI knowledge layer (AI search, Knowledge Agents, verification workflows with usage signals, automated knowledge maintenance, deep research, 100+ integrations, MCP delivery); an AI and KM strategy team (services); enterprise governance (policy, permission inheritance, audit, DLP masking, SOC 2 Type II, HIPAA, GxP) ([Fact](https://getguru.com/pricing)).
3. **Underneath.** Verification: owners periodically re-verify content. Permissions are inherited from source systems ([Fact](https://getguru.com/pricing)). Mechanics not read.
4. **Commercials.** Custom quotes only; nonprofit discount ([Fact](https://getguru.com/pricing)).
5. **Why chosen.** Trust in verified answers for front-line teams.
6. **Deploys.** Services-assisted ([Fact](https://getguru.com/pricing)).
7. **Copy.** Owner-based verification with expiry on every rule and template the agent uses. Source: https://getguru.com/pricing
8. **Weak.** Manual curation costs effort.
9. **Relationship.** Teacher on verification.

### R7. Onyx (open source, formerly Danswer)
1. **In one paragraph.** A self-hostable "context layer" with 50+ connectors, chat, agents, deep research, a sandbox, an MCP server, a Slack bot and a Chrome extension. The core is MIT-licensed; `ee/` directories (permission sync among them) are under the Onyx Enterprise License ([Fact, code](https://github.com/onyx-dot-app/onyx), commit 6425e7d, 20 Nov 2026).
2. **Functions.** Listed in the README: deep research, custom agents, web search, MCP actions, secure sandbox, artifacts, voice; any LLM including local ones; standard and lite deployments on Docker, Kubernetes or Helm ([Fact, code](https://github.com/onyx-dot-app/onyx)).
3. **Underneath (read in code).**
   - **ACL representation:** `ExternalAccess` = `external_user_emails` + `external_user_group_ids` + `is_public`, with a soft cap of 5,000 entries. If permissions cannot be determined, the fallback is `empty()` (private) (`backend/onyx/access/models.py`).
   - **Index-side ACL:** strings prefixed `user_email:`, `group:` and `external_group:`, with external groups namespaced by source (`slack_finance`) to avoid collisions. Retrieval filters carry `access_control_list` as a frozenset (`backend/onyx/access/utils.py`, `document_index/interfaces.py`).
   - **Sync jobs per source:** separate doc-permission sync and group sync with their own frequencies. Defaults: 5 minutes (Slack, GitHub, Teams, Google Drive groups) and 30 minutes (Confluence, Jira) (`ee/onyx/configs/app_configs.py`). Doc syncs can be checkpointed and resumed after a timeout (`perm_sync_types.py`).
   - **Query-time censoring:** for Salesforce, Onyx asks Salesforce at query time which record IDs the user can see (a `UserRecordAccess` query). The user-ID lookup is cached for 1 hour. The code comment says the uncached access query takes about 0.1 to 0.2 seconds (`ee/onyx/external_permissions/salesforce/`). Documents with unknown access are censored, not passed through (`post_query_censoring.py`).
   - **Federated connectors** (live search, Slack first) sit beside indexed ones (`backend/onyx/federated_connectors/`).
   - Hybrid search weighting `HYBRID_ALPHA` defaults to 0.5 (`configs/chat_configs.py`).
4. **Commercials.** Not read this round [Unverified].
5. **Why chosen.** Self-hosting, data sovereignty, cost.
6. **Deploys.** One-line install script; Docker or Kubernetes ([Fact, code](https://github.com/onyx-dot-app/onyx)).
7. **Copy.** (a) Fail closed: unknown ACL means private. (b) Re-check CRM and ERP record access live at query time rather than mirroring complex sharing rules. (c) Namespace group IDs by source. Source: https://github.com/onyx-dot-app/onyx
8. **Weak.** Enterprise permission sync is not MIT-licensed; you must reimplement it.
9. **Relationship.** Teacher and possible component (MIT parts only).

### R8. Atlan as a context layer
Covered in `11-context-layer-products.md` §13. Atlan sells a data catalogue repositioned as "the context layer" for data agents: an Enterprise Data Graph with column-level lineage, Context Agents that draft certified descriptions and glossary terms, Context Engineering Studio (context as code with CI evaluations) and an MCP server. It claims 108 connectors ([Vendor claim](https://atlan.com/know/ai-agent/databricks/genie-ontology-and-atlan-context-layer.md)). Buyers are data platform teams. Unlike Glean, Atlan governs *structured* data definitions, which is closer to the founder's metric layer. Copy: context-as-code with CI evals. Not re-read this round (budget).

---

## What a product for 100 to 1,000 staff companies should take from Glean's permission mirroring and graph, and what is overkill

**Take:**
1. **A principal model of users, groups and memberships plus three ACL forms** (user, group, group-intersection), loaded before any record. Mirror the source's sharing as-is. Sources: developers.glean.com permissions page; Onyx `ExternalAccess`.
2. **Fail closed.** A record with unknown ACL is invisible (Onyx `ExternalAccess.empty()`).
3. **Per-source access mode.** Index structured finance records; fetch mail and messaging live per user; where sharing rules are complex (Salesforce-style), re-check at query time (Onyx Salesforce censoring).
4. **Two retrieval identities.** "As the user" for internal staff; an admin-curated "knowledge profile" for external customer-facing agents and shared channel bots (Glean knowledge profiles).
5. **Agent as its own principal** for scheduled reminder runs, with scoped service credentials, logging of the triggering event, and human approval of write actions until validated (Glean independent agents).
6. **Negative permission tests in CI and the four-bucket golden set** (Glean SDK testing; ADLC evaluation page).
7. **A small, typed graph with provenance and confidence on each edge.** Customer → invoice → contact → owner (account manager), with edges sourced from the ERP or CRM, not inferred (Glean blog edge metadata) ([Inference] on authored versus inferred).
8. **Department model policies with 75% and 90% budget downgrades**, and a seat-plus-credits price with published per-action medians (Glean configure-LLMs page; Enterprise Flex pricing).

**Overkill at this size:**
- An activity-derived personal graph (task and theme clustering, OKR mapping). Finance staff number in the tens; the value is low and the privacy cost high.
- NLP entity extraction across the whole corpus. The founder's objects are known up front (customer, invoice, payment, promise-to-pay).
- 275 connectors, web-history connectors, a desktop agent (Tau) and code search.
- Customer-hosted single-tenant deployments, Protect+ continuous scanning across 100+ sources, and alignment-model stacks. Use standard multi-tenant isolation with row-level security, plus a basic oversharing report.
- Agent-routing layers and agent libraries before the first job works.

## Comparison table

| | Glean | M365 Copilot / Work IQ | Atlassian Rovo | Notion AI | Dropbox Dash | Moveworks | Guru | Onyx | Atlan |
|---|---|---|---|---|---|---|---|---|---|
| Core job | Cross-app search, assistant, agents | Assistant across M365 | AI over Atlassian plus graph | Search inside Notion plus apps | Universal search plus Stacks | Employee service front door | Verified knowledge answers | Self-hosted context layer | Data catalogue as context |
| Connectors | 275+ (vendor, 2026) | Copilot connectors | Teamwork Graph connectors | "Slack, Drive, Jira and more" | ~20+ named | 100+ | 100+ | 50+ | 108 (vendor) |
| Permission model | Mirrored ACL users, groups, intersections; live paths | User-scoped plus OPA/Rego per call | [Unverified] | "Least-privilege" | Not published | [Unverified] | Inherited | Mirrored ACL plus query-time censor | Data-asset policies |
| Authored business model (objects, metrics, rules) | No (inferred graph) | No | No | Databases only | No | No | Verified cards | No | Partly (glossary, metrics) |
| Agents | Yes, incl. independent (beta) | Yes (Studio, A2A) | Yes (Studio) | Limited | Not in notes | Yes | Knowledge Agents | Yes | Context agents |
| MCP | Server plus gateway | Work IQ MCP (10 tools) | Rovo MCP | [Unverified] | Local MCP | [Unverified] | Yes | Yes | Yes |
| Pricing | Seat plus FlexCredits; model hub per token | Copilot seat plus Copilot Credits | In plans; $0.01 per credit overage | In Business/Enterprise | [Unverified] | Inside ServiceNow | Custom quote | Open source plus EE | [Unverified] |
| Deploy | Glean Hosted or customer cloud (GCP/AWS) | Microsoft tenant | Atlassian Cloud | SaaS | SaaS, self-serve | SaaS | SaaS plus services | Self-host | SaaS |
| Relationship to founder | Teacher | Channel and host | Teacher (pricing) | Neither | Neither | Teacher | Teacher (verification) | Teacher and component | Teacher (metrics) |

## What to copy (consolidated design decisions for the build plan)

1. **Principal store before content.** Users, groups and memberships go in their own tables and are synced before any record. Reject group rows that lack membership rows. *Why:* an ACL that names an unknown principal is a silent leak or a silent miss. *Source:* https://developers.glean.com/libraries/indexing-sdk/permissions
2. **Per-record ACL in three forms:** `allowed_users`, `allowed_groups`, and `allowed_group_intersections` (a list of AND-sets, OR'ed together). Store group IDs namespaced by source (for example `xero:finance`). *Why:* this mirrors source sharing without flattening, so a group change does not require re-indexing every record. *Sources:* the same Glean page; `onyx/access/utils.py` in https://github.com/onyx-dot-app/onyx
3. **Fail closed.** If a record's access cannot be determined, store it as private (empty ACL, not public). At query time, censor documents whose ACL type is unknown. *Source:* Onyx `ExternalAccess.empty()` and `post_query_censoring.py`, https://github.com/onyx-dot-app/onyx
4. **Separate doc-permission sync from group sync, each on its own interval.** Start with 5 minutes for chat and identity-provider groups and 30 minutes for wiki and ticket systems. Make long syncs checkpointed and resumable. *Source:* Onyx `ee/onyx/configs/app_configs.py`, `perm_sync_types.py`
5. **Live re-check for systems with complex sharing rules.** For CRM or ERP records with rule-based sharing, ask the source at query time which record IDs the user can see. Cache the user-ID mapping for 1 hour. Budget about 0.1 to 0.3 seconds per call. *Source:* Onyx `ee/onyx/external_permissions/salesforce/`
6. **An access mode per source.** Indexed for finance records and documents; live, as the user, for mailboxes and chats; hybrid where both are needed, merged into one permission-filtered pool. *Source:* https://docs.glean.com/connectors/connectors-power-glean
7. **Two retrieval identities.** "As invoker" for staff; "knowledge profile" (an admin-curated corpus that ignores the viewer's own ACL view, with no email or calendar) for customer-facing agents and shared channel bots. *Source:* https://docs.glean.com/administration/managing-agents/knowledge-profiles
8. **Agent as its own principal for scheduled or event runs.** A dedicated profile; service credentials scoped per connected system; the triggering user, schedule or event logged on every run. Read-only first, write tools behind approval, and an admin pause/unpublish/revoke switch. *Source:* https://docs.glean.com/agents/independent-agents
9. **Pre-execution check of every write action** against the agent's stated purpose. Example: block a reminder sent to the wrong recipient or channel. Run this as a separate cheap model or a rules pass before the tool executes. *Source:* https://glean.com/blog/agentic-security-aware
10. **A policy check on every tool call**, evaluated against resource path, method, user and content, with every call logged. *Source:* https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/
11. **Explicit step memory in agent workflows.** Each step reads previous-only (default), all, or none, plus `[[step]]` references. Warn when documents are truncated. *Source:* https://docs.glean.com/agents/concepts/memory
12. **Model policy per department** (Balanced, Frontier, Economy), automatic downgrades at 75% and 90% of the monthly budget, per-step model overrides in agents, and only successful LLM calls billed. *Sources:* https://docs.glean.com/administration/configure-llms ; https://docs.glean.com/glean-core-suite-pricing
13. **Price as seat plus pooled credits.** Include a human-scale allowance (Glean: 100 standard Assistant queries per user per week). Make indexing and search free (as Rovo does). Publish median and 90th-percentile credit costs per action, and a per-credit overage price ($0.01 at Rovo). Add user requests for higher limits that expire at month end. *Sources:* https://docs.glean.com/glean-enterprise-flex-pricing ; https://atlassian.com/software/rovo/pricing ; https://docs.glean.com/administration/management/usage/flexcredits-dashboard
14. **A release gate built from a golden set** of happy-path, edge, adversarial and permission cases, run under three identities (standard, restricted, admin). Negative identities must return nothing. Require a graceful "no access" answer. *Sources:* https://docs.glean.com/agents/agent-development-lifecycle/evaluate-agent-quality ; https://developers.glean.com/libraries/indexing-sdk/permissions
15. **Review depth scaled to blast radius:** personal, team or enterprise. Extra review is triggered by broad sharing, restricted data, write tools or high impact. *Source:* https://docs.glean.com/agents/overview/agent-development-lifecycle
16. **Provenance, confidence, timestamp and ACL on every graph edge**, whether authored or inferred. *Source:* https://glean.com/blog/knowledge-graph-agentic-engine
17. **Ship an oversharing report with the product:** who can see which customer and invoice data, and stale access. Sell it as the trust step before switching AI on. *Sources:* https://dash.dropbox.com/release-notes ; https://docs.glean.com/administration/protect/overview
18. **Expose the model through MCP** so the customer's existing assistant (Copilot, Claude, Glean) can use it. Expose generic verbs over resource paths rather than hundreds of bespoke tools. *Sources:* https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/ ; https://docs.glean.com/llms.txt (MCP section)

## What cannot or should not be copied

- **Glean's inferred, schema-less graph as the primary model.** Receivables need authored, versioned definitions: overdue, dispute, promise-to-pay, credit hold. Inference can propose them; a human must certify them ([Inference]; contrast with https://glean.com/blog/knowledge-graph-agentic-engine).
- **Activity-derived personal graphs.** Six years of work on Glean's own account, high privacy cost, and little value for a finance team of 5 to 30 people.
- **Connector breadth (275+) and the web-history connector.** Not reachable solo. Five to ten deep connectors (accounting or ERP, CRM, mail, WhatsApp or another messaging channel, bank or payment feeds) matter more.
- **Customer-hosted single-tenant deployments, customer-managed keys, Prisma/Cortex integrations and the full Protect+ stack.** These are sized for Fortune 500 security reviews. At 100 to 1,000 staff, multi-tenant with row-level security, SSO, audit and a basic DLP template set is enough.
- **Opaque pricing with no list prices.** It works with enterprise procurement and fails with mid-market buyers.
- **Onyx `ee/` permission-sync code.** It is under the Onyx Enterprise License, not MIT: copy the design, not the code.
- **Glean's own benchmarks** (2.5x preference, 30% fewer tokens, 110 hours saved) are vendor claims with undisclosed method. Do not cite them as evidence in the build plan.

## Open questions and unverified items
- Pages I could not open because the shared fetch budget ran out: the knowledge-graph security architecture page (site error after the budget reset) and the query-flow page (`docs.glean.com/security/...`); the crawl types, refresh rates and limits sub-pages; customer stories with quantified results (Booking.com at 14,000 employees and Wealthsimple at $1M+ a year saved are claimed in page titles only); Moveworks product docs; Atlassian Teamwork Graph permission docs; Onyx docs and pricing.
- Dollar prices for Glean seats and FlexCredits are not published. Third-party estimates exist but were not read.
- Glean certifications are vendor-stated (ISO 42001, ISO 27001, SOC 2 Type II, HIPAA). FedRAMP is unconfirmed. Whether customer hosting is offered on Azure is unclear: the docs and a blog post disagree.
- Time from signing to live for Glean is not published.
- "Glean Transform" scope is unknown.
- Moveworks deal value: about $2.85B is from memory, not checked this round.
- Glean complaints: no review-site mining was done.
- Connector count: 100+ (Dec 2025 release) versus 275+ (2026 site). The two figures may count different things.

## Sources (ranked by usefulness)
1. https://developers.glean.com/libraries/indexing-sdk/permissions (2026). ACL and identity data model, ingestion order, negative tests.
2. https://docs.glean.com/connectors/connectors-power-glean (2026). Five data types, three access modes, enforcement points.
3. https://docs.glean.com/glean-enterprise-flex-pricing (18 Nov 2026). Seat inclusions and the FlexCredit rate card.
4. https://docs.glean.com/glean-core-suite-pricing (17 Nov 2026). Core Suite inclusions, model hub per-token rates.
5. https://docs.glean.com/administration/configure-llms (2026). Model hub, Auto policies, downgrade thresholds.
6. https://docs.glean.com/agents/independent-agents (16 Nov 2026). Agent as principal, credentials, governance.
7. https://docs.glean.com/administration/managing-agents/knowledge-profiles (2026, beta). Curated corpus overriding user ACLs.
8. https://glean.com/blog/knowledge-graph-agentic-engine (27 Jun 2025). Graph construction, edge metadata, personal graph.
9. https://github.com/onyx-dot-app/onyx (commit 6425e7d, 20 Nov 2026). Readable permission-sync code: ACL strings, sync intervals, query-time censoring.
10. https://docs.glean.com/administration/protect/overview (2026). Protect versus Protect+.
11. https://docs.glean.com/agents/agent-development-lifecycle/evaluate-agent-quality and https://docs.glean.com/agents/overview/agent-development-lifecycle (2026). ADLC stages and golden-set design.
12. https://docs.glean.com/agents/concepts/memory (2026). Step memory model.
13. https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/ (18 Nov 2026). Work IQ tools, OPA policy engine, billing.
14. https://atlassian.com/software/rovo/pricing (2026). Credit allowances and overage price.
15. https://glean.com/press/glean-surpasses-300m-arr-unrivaled-enterprise-context-fuels-ai-adoption (28 May 2026). $300M ARR and adoption metrics.
16. https://www.businesswire.com/news/home/20251208127913/en/Glean-Surpasses-%24200M-in-ARR-for-Enterprise-AI- (8 Dec 2025). $200M ARR, usage, headcount.
17. https://techcrunch.com/2026/05/28/gleans-top-line-crosses-300m-as-ai-budget-cutting-becomes-its-major-selling-point/ (28 May 2026). Valuation, pricing models, CEO cost pitch.
18. https://docs.glean.com/get-started/prepare/about-deployment (2026). Hosted versus customer-hosted.
19. https://docs.glean.com/llms.txt (read 21 Nov 2026). Full docs table of contents; basis for the title-only catalogue entries.
20. https://docs.glean.com/connectors/about and https://docs.glean.com/connectors/crawling-frequency (29 Sep 2026). Connector types, crawl types.
21a. https://glean.com/blog/agentic-security-aware (11 Mar 2026). AWARE framework, Protect feature statuses, certifications.
21b. https://www.glean.com/press/glean-introduces-third-generation-ai-assistant-new-enterprise-graph-to-enable-the-superintelligent-enterprise (25 Sep 2025). Third-generation Assistant, availability by status.
21c. https://www.glean.com/glean-vs-copilot and https://www.glean.com/compare (2026). Glean's competitive claims; vendor content.
21d. https://learn.microsoft.com/en-us/microsoftsearch/semantic-index-for-copilot (2026). Copilot semantic index and security trimming.
21. https://docs.glean.com/administration/assistant/features/chat-api-agentic-engine (29 Sep 2026). FAST/ADVANCED agentic engine.
22. https://docs.glean.com/user-guide/glean-tau (9 Nov 2026). Desktop agent workspace.
23. https://www.glean.com/enterprise-context/enterprise-graph (2026). Graph positioning; vendor content.
24. https://dash.dropbox.com/release-notes (to Mar 2026). Dated Dash features.
25. https://www.businesswire.com/news/home/20251215128980/en/ServiceNow-completes-acquisition-of-Moveworks (Dec 2025). Moveworks scale.
26. https://getguru.com/pricing (2026). Guru modules.
27. https://www.notion.com/en-gb/help/enterprise-search and https://www.notion.com/en-gb/help/enterprise-search-security-and-privacy-practices (2026). Notion Enterprise Search scope and security.
28. https://docs.glean.com/security (2026). Security docs index; Trust Portal.
29. https://docs.glean.com/administration/management/usage/flexcredits-dashboard (2026). Usage dashboard and limits.