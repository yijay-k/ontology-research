# Agent loop and runtime

**Layer:** [08-agent-platform](README.md) · **What it is:** The agent loop and the runtime that hosts it: frameworks, model orchestration and role-packaged agents.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (4) · [Open-source implementations](#open-source-implementations) (4) · [Other companies and products](#other-companies-and-products) (5) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (3) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Palantir

### 9. AIP Chatbot Studio (formerly AIP Agent Studio)

> Source: [general-references/03-palantir-aip.md § 9. AIP Chatbot Studio (formerly AIP Agent Studio)](../../general-references/03-palantir-aip.md#9-aip-chatbot-studio-formerly-aip-agent-studio)

**Plain English.** Chatbot Studio is a no-code builder for chat assistants embedded in apps. Example: a maintenance chatbot inside a Workshop screen, which sees the aircraft the user has selected, can search manuals, and can file a work order after the user confirms.

**Naming.** It was renamed from AIP Agent Studio in the week of 27 Apr 2026. "AIP Agents" became "AIP Chatbots", and the API endpoints kept the old "Agent" names. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-04

**Definition components** ([Fact] https://www.palantir.com/docs/foundry/chatbot-studio/core-concepts/):
- The system prompt is compiled from instructions plus tool descriptions plus variable descriptions.
- Application state, retrieval context and tools are the other parts.
- The context window holds the system prompt, history, injected context, state and tools. If it overflows, the user must start a new session.

**Retrieval context types.** Any number can be combined, and retrieval runs on *every* user message. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/retrieval-context/
- *Ontology context* uses a fixed set of N objects, or semantic search for the top K (which requires a vector property). The starting set can be static (the whole type) or a variable (a filtered object set from app state). You choose which properties are printed; media references and vectors are excluded. Outputs can be routed to variables.
- *Document context* sends either full document text, or (in beta) the top K semantic chunks.
- *Function-backed context* is a TypeScript v1 function implementing the `AipAgentsContextRetrieval` interface. It takes `messages` and returns a `retrievedPrompt` string that is inserted into the system prompt. It can take string or object-set variables, and it can tell the LLM to emit custom XML citations. This is how hybrid keyword plus semantic retrieval is built.
- *Custom documentation context* uses Notepad or Markdown documents registered for AIP Assist. [Fact] https://www.palantir.com/docs/foundry/assist/agents-in-aip-assist/

**Tool types** ([Fact] https://www.palantir.com/docs/foundry/chatbot-studio/tools/):
- **Action** applies an Ontology edit, either automatically or after the user confirms.
- **Object query** covers several object types with a limited property list, and supports filter, aggregate, inspect and link traversal.
- **Function** can call any Foundry function, including Logic. It uses the latest version by default or can be pinned to a version.
- **Update application variable** sets a variable.
- **Command** triggers a UI operation in a paired Palantir app, such as moving a map. It requires user approval by default, the retention window expires after 24 hours of inactivity, and commands are ignored when the chatbot runs as a function in Automate. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/commands-as-tools/
- **Request clarification** pauses so the bot can ask the user a question.
- **(Legacy) Ontology semantic search** is superseded by Ontology context.

**Tool modes.** Prompted mode works with all tools and models but makes one call at a time and uses tokens less efficiently. Native mode supports parallel calls and is faster and cheaper, but only works with Action, Object query, Function and Update variable tools, and only on a subset of Palantir-provided models. "View reasoning" exposes the reasoning trace. [Fact] tools page.

**Application state** ([Fact] https://www.palantir.com/docs/foundry/chatbot-studio/application-state/):
- Variables are strings or object sets. Each has a description that is injected into the prompt, and a visibility flag that controls whether the LLM can read the value. Palantir advises keeping visibility off where possible.
- There are three write paths: (1) *deterministic* mapping of tool or context outputs to a variable after streaming, which Palantir recommends; (2) the LLM-driven Update variable tool; (3) clicking a citation.
- *Deterministic tool inputs*: Action and Function tool parameters can be bound to variables instead of LLM-generated values. Values are frozen at the start of the reasoning loop. Palantir cites "more consistent behavior and lower token usage".
- In Workshop, variables map to Workshop variables of the same type, which lets the chat drive other widgets.

**Citations.** Supported types are object, PDF document (with page), external URL and function-backed (when prompted for). They use a small XML grammar: `<citation><key>RID</key>`, `objectTypeId` plus `primaryKey`, `mediaSetKey` plus `mediaItemKey` plus `page`, and `name` plus `href`. Responses carry a Sources dropdown, and clicking a citation can set a variable. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/citations/

**Deployment.**
- *Workshop widget.*
- *AIP Assist mode.* Toggled on under Usage. Publishing creates version 1.0, and later changes need a new publish. [Fact] https://www.palantir.com/docs/foundry/assist/agents-in-aip-assist/
- *Chatbot as a Function.* Inputs are `userInput` and an optional `sessionRid` (omit it for a new session, never pass an empty string). Outputs are `markdownResponse`, `sessionRid` and any variables that changed. Optionally a minor version is published on every save. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/chatbots-as-functions/
- *Platform APIs / OSDK.* Create Session, Blocking Continue, Streaming Continue, Get Session, Get Content and Get Session Trace (with a client-generated UUIDv4 `sessionTraceId` so you can poll while the answer streams). `parameterInputs` and `parameterUpdates` carry state. A Developer Console app must explicitly include every object, action and function type the bot uses, plus its projects, and the "AIP Chatbots write permission". It does **not** update automatically when the bot changes. Under OSDK the bot must use resources from a single Ontology. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/foundry-apis/

**Permissions.** A chatbot is a filesystem resource. Users need read access to its folder, access to its sources, and access to its model. [Fact] https://www.palantir.com/docs/foundry/assist/agents-in-aip-assist/

**Session logging.** Each message is one execution with a `traceId`. Events are `session_metadata`, `user_request`, the chat messages, `tool_call`, `tool_call_result`, `final_response` and `execution_error`. Common fields are `uid` and `owning_rid` (the originating bot, function or app, even through nested calls). Logs export to a streaming dataset that the docs say to mark and to retain only as long as needed. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/

### 10. The Agent Stack: Agent Builder, Agent Manager and Agent SDK

> Source: [general-references/03-palantir-aip.md § 10. The Agent Stack: Agent Builder, Agent Manager and Agent SDK](../../general-references/03-palantir-aip.md#10-the-agent-stack-agent-builder-agent-manager-and-agent-sdk)

**Plain English.** This is Palantir's newer runtime for agents that run longer than a single chat and can wait for people. Example: an airline rebooking agent takes an airport code, pre-computes the cancelled flights before it starts, proposes rebookings, and pauses for an operator.

**Core concepts** ([Fact] https://www.palantir.com/docs/foundry/aip/agent-stack/):
- **Sessions** hold state, context items and event history. They can last indefinitely and can have several participants.
- **Context items** are strongly typed records such as messages, tool results and recommendations.
- **Events** bring input into a session. A state machine and event handlers decide what happens next.
- Agents are published as Compass (filesystem) resources. Agent Manager shows sessions subject to the viewer's mandatory and discretionary access.
- Integrations: Workshop embedding, Automate (to create sessions or send events) and platform APIs. OSDK and Logic integration are marked "coming soon".

**Agent Builder (beta)** ([Fact] https://www.palantir.com/docs/foundry/agent-builder/core-concepts/ , https://www.palantir.com/docs/foundry/agent-builder/overview/):
- **Inputs** can be required or optional.
- **Pre-computed variables** run before the agent: filtered object sets, function results, and even Actions. Those Actions run at session start even if nothing references them. In Preview, the Actions run but their edits are not applied.
- There is a **system prompt** and an **initial user message**.
- **Tools** can be functions, actions, Ontology queries, Ontology SQL, or custom tools built in a no-code tool builder.
- **Completion** is either "stays open" (conversational) or "ends after first valid output" matching a typed Agent output.

**Agent Manager.** It shows a session timeline filterable by event type and time, searchable payloads, a Preview pane (conversation), a Raw pane (context items) and session state. You can pin a past event to see the state at that moment, which shows where behaviour diverged. There are Trace (telemetry spans) and Logs tabs. [Fact] https://www.palantir.com/docs/foundry/agent-manager/session-debugging/

**Agent SDK (TypeScript)** ([Fact] https://www.palantir.com/docs/foundry/agent-sdk/overview/ , https://www.palantir.com/docs/foundry/agent-sdk/customize-agent/ , https://www.palantir.com/docs/foundry/agent-sdk/advanced-customization/):
- `defineAgent({ systemPrompt, model, tools, contextItemDefinitions, agentStateSchema, createSessionArgsSchema, createSession, handleEvent ... })`.
- `systemPrompt(state)` runs before *each* model request, so a change in state changes the instructions.
- `model` is any `LanguageModel` object exposing `generateResponse`. It can be a function of state, so the model can change at runtime. You can wrap models for fallback, for example switching to a backup when the primary response has a terminated status. Built-in constructors are `anthropic`, `openAi`, `openAiChat`, `google` and `xAi`, each taking a model resource id from "Resource imports" plus `modelSettings`.
- `tools` can be a function of state. Tools are built with `zodTool(name, description, argsSchema, emits, execute)`. A tool returns context items and events. A thrown error is shown to the model on the next turn.
- **Context items** use `zodContextItem(type, argSchema, dataSchema, create, render)`. `render` returns `RenderResult.ready` or `RenderResult.pending`. Removing an id from `contextItemOrder` hides an item from the model without deleting it, which manages the context window.
- **Long-running tools** return a *pending* item at once and finish later through `zodContextItemEffect` and `zodContextItemEvent`, so the UI can show progress.
- **Human-in-the-loop** works the same way: the tool returns a `UserQuestion` item, and the human's answer is dispatched as an event.
- The **state machine** processes queued events in order. `handleEvent(state, event)` returns updates (`setAgentState`, create, delete or reorder items) and effects. Effects come from `zodSessionEffect` with declared emitted events. Custom events come from `zodSessionEvent`. Event sources include users, schedules and effects.
- **Ontology access** goes through the TypeScript OSDK. Resources must be imported or calls fail with permission errors. *Applying actions requires "scoped mode"*, which is turned on in Scope settings.

[Inference] This is an event-sourced agent design in the style of Redux or the Elm architecture: deterministic reducer, typed state, side effects as messages. It makes sessions replayable and debuggable at any point in time, which explains why Agent Manager can "pin the timeline to an event". It is the strongest single design to copy.

## Lingyang, AgentOne and Alibaba

### 3. AgentOne: launch to today

> Source: [general-references/07-lingyang-agentone.md § 3. AgentOne: launch to today](../../general-references/07-lingyang-agentone.md#3-agentone-launch-to-today)

Plain English: AgentOne is a platform where a company "hires" preset AI employees (sales, service, operations, marketing) or builds custom "X employees". Lingyang engineers go on site to wire them to the company's data and systems.

Timeline [all dated]:
- Jul 2025 to Sep 2025: three batches of enterprise agents released (customer service, data analysis, marketing) [Press, https://www.tmtpost.com/7705705.html].
- 25 Sep 2025: AgentOne launched at Apsara (云栖) 2025 with 20+ ready-made agents and an "AI training ground" (AI训练场) [Press/Vendor, tmtpost; https://help.aliyun.com/document_detail/3004555.html]. Over 100 customers were claimed [Vendor claim, tmtpost].
- 29 Jul 2026: four role-based AI employees went live (AI Sales, AI Customer Service, AI Operations, AI Marketing), plus custom "X employees" (finance, legal, procurement, admin, HR) [Fact as reported, https://news.mydrivers.com/1/1139/1139921.htm].
- 23 Sep 2026: the "AI员工7日上场计划" (seven-day AI employee programme) launched at Apsara 2026 with Feihe, 盈峰数科 and 易豹集团. 27 companies signed letters of intent on site [Press, https://www.sohu.com/a/1080187818_115035; https://i.ifeng.com/c/8wnEITDyxMe].
- 19 Nov 2026: Malaysia talk on Ontology & FDE (agenda only).

Published architecture descriptions (they disagree; all are marketing-level):
- Official help page: three elements. **Data** supplies business meaning and relationships, plus collection, cleaning and processing, so AI inputs and outputs are traceable. **Agent** supplies planning, memory, tool calling and multi-agent collaboration, connects to CRM, OA, service and store systems, and keeps task progress and operation logs reviewable. **FDE** covers discovery, diagnosis, SOP abstraction, integration and knowledge transfer. Design principle: "岗位化" (role-based), meaning each AI employee is configured with data, knowledge, tools, permissions and evaluation metrics for one job. Human confirmation is required for fund-related and major decisions [Vendor claim, https://help.aliyun.com/document_detail/3004555.html].
- Datayuan, Sep 2025: five layers. Model integration (Qwen, DeepSeek, private models); data semantic layer (governance plus metric semantic layer); low- or no-code agent development and orchestration; plugins and tools (BI, CRM, ERP, mail, DingTalk, Feishu, OA); runtime and governance (permission boundaries, operation logs, task status, feedback, monitoring) [Press, https://datayuan.substack.com/p/all-in-agent].
- 36Kr, Sep 2025: three agent maturity levels. "Thinking" (model plus knowledge base Q&A), "execution" (tool-calling task completion) and "self-evolution". Enterprise agents were said to be at level two [Press, https://www.36kr.com/p/3483384622619523].
- Apsara 2026: the CEO's three AI layers. Chat (public knowledge), work (operating PCs, files, browsers), and business (connected to ERP and CRM, understands 口径 and role know-how, measured on GMV, ROI and retention). Lingyang places itself in the business layer [Press, https://i.ifeng.com/c/8wnEITDyxMe].
- LatePost, Aug 2026: workflows constrain each step, multiple agents split complex tasks, and "Harness-style orchestration" is named as the 2026 enabler. Industry know-how is packaged as Skills. Member, transaction and ad records become reusable agent context. In a car-sales example, sub-agents handle lead cleaning, planning, sales strategy and store invitations [Press, https://finance.sina.cn/stock/jdts/2026-08-04/detail-inimekpf5165695.d.html].
- Leiphone, Sep 2025: privacy computing and "安全屋" (secure clean room) for data circulation. Business semantics turn data into agent-readable terms such as "inventory turnover" and "member repurchase propensity". A "Lego-style" composition of ecosystem modules. A development workflow covering build, test and deploy [Press, https://www.leiphone.com/category/digitalindustry/CIVlQ0TuWa4IBiXC.html].
- Product page: unified definitions for sales terms (customer, opportunity, stage, product) so every query returns the same 口径 with traceable results. Agent forms: autonomous-planning agents, dialogue-orchestrated agents and "expert groups". Security: classification, encryption, masking, RBAC, audit logging, anomaly detection and prompt-injection defence. Certifications: ISO 27001 and 27018, and China's MLPS Level 3 (等保三级) [Vendor claim, https://www.aliyun.com/product/agentone].

AI employee behaviours (29 Jul 2026) [Vendor claim, https://news.mydrivers.com/1/1139/1139921.htm]:
- AI Sales: before the meeting, a customer brief plus a decision-maker and risk map. During the meeting, real-time Q&A and requirement logging. After the meeting, minutes, follow-up tasks and CRM write-back.
- AI Customer Service: outbound, inbound, service operations, pre-sales and after-sales. Plans the service path, then creates tickets, changes appointments and reissues goods by calling business systems.
- AI Operations: standard actions (price changes, coupons) run "under rules". Inspection findings and anomaly suggestions go to work groups. Funds and major decisions need human confirmation. LatePost adds that high-risk actions such as budget increases or price changes are submitted to the owner for approval [Press].
- AI Marketing: strategy breakdown, then audience matching, budget allocation, effect simulation, content and benefit generation, approval and delivery. Humans confirm key budget decisions. A demo campaign: 38,000 yuan over 14 days, projected at +5,012 members and 1.6M yuan GMV [Press, LatePost].
- [Inference] The published behaviours fall into four action kinds: read/query, generate (briefs, minutes, content), write back (CRM, tickets, price changes) and reach out (outbound calls, IM pushes). These line up with the founder's "read, generate, write back, reach out" grades, but Lingyang has not published that taxonomy.

Seven-day programme mechanics (23 Sep 2026) [Press, https://www.sohu.com/a/1080187818_115035]:
1. Topic selection: the company brings a real business problem, and the FDE team and the company pick a scenario suitable for AI.
2. Mapping: FDEs work with business, data and IT staff to map data, processes, systems and acceptance metrics.
3. Build: validate on AgentOne, then build the knowledge base and agent.
4. Delivery: hand over the AI employee with a before/after comparison report.

Resources: a free one-day FDE scenario diagnosis and a 150,000-Credit starter pack plus tooling. Example: a smart-bed company with about 150 stores semantically mapped 110+ operating metrics across 5 business segments in the first 7 days, and got NL query, AI diagnostic reports, and drill-down from whole company to city, store and process step.

Customers and quantified cases (all vendor or press claims, unaudited):
- Yadi (EV two-wheelers), Mar to Sep 2025: hotline bot resolution 20% → 42%; online bot resolution 78%; peak connection rate 88% → 95%; average call time 6 → 4 min. Delivery took 24 days on site, 78 interviews and 10+ departments, in two phases (agent workbench and summaries first, then bots) [mydrivers; LatePost].
- Muyuan Foods: report generation went from days to about 30 min; 80% efficiency gain; 90% of queries self-served; 22 provinces, about 100 meetings a week [36Kr; help page].
- Fosun Tourism & Culture "AI G.O": handles 100+ request types in under 1.5 s and dispatches work orders; development to launch in about 90 days; built on Qwen [tmtpost; 36Kr].
- Voyah (岚图): lead pool of 20M+; campaign setup 12–24 h → under 3 h; CTR +15%; dormant-lead activation +20%; lead-to-order +20% [ifeng].
- Feihe: 2,600+ distributors and about 67,000 outlets; provincial management report 3 days → 1 hour [ifeng].
- Unilever: a "food knowledge engine" built from sales-call recordings, category data and reviews; produces visit prep per restaurant with traceable sources, reviewed by top salespeople [ifeng].
- StarCharge: NL charging-station search inside the Qwen App, with AgentOne connecting the model, data and tools [ifeng].
- Others: Qianxun Positioning (target accuracy 80%, completeness 50%) [36Kr]; an appliance brand's pre-sales accuracy 60% → 90%+ [LatePost]; a maternal brand's ad ROI +20% [LatePost]; Great Wall Motor service efficiency +50% [datayuan]; Baozun data-analysis agent serving 490+ brands [product page]; Taobao, where 300,000+ merchants use the 解读 agent over 1,500+ metrics [datayuan].
- Lingyang turned down a manufacturer's production-scheduling project for lack of domain experience and repeatability [Press, LatePost]. This is a useful signal about the scope they will deliver.

Pricing and credits:
- The packaged Experience Insight Agent is billed by shop-connection quota: minimum 1 shop, terms of 1 month to 3 years; the example is 5 shops × 1 year = 25,200 yuan [Fact, https://help.aliyun.com/document_detail/3011198.html].
- The Data Analysis Agent docs include a "Credit管理" (credit management) sub-page; I did not read it [Fact that it exists, https://help.aliyun.com/zh/document_detail/3050036.html, updated 2026-08-06].
- The 7-day programme includes a 150,000-Credit starter pack [Press]. The Credit-to-yuan rate was not found [Unverified].
- Commercial models: free until go-live and target results; per seat or resource; per campaign; per promotion cycle; negotiated upside above a target conversion rate [Press, LatePost].

AgentOne help-doc structure (shows what is actually productised): the overview, quick-start and billing pages cover individual agents (Experience Insight, 店小蜜大客版, Live-stream Inspection, Data Analysis, WinNexo Sales Operations). The security section has permission, data-security and compliance pages [Fact, https://help.aliyun.com/zh/product/2987146.html; https://help.aliyun.com/zh/document_detail/3019609.html; https://help.aliyun.com/zh/document_detail/3019711.html]. There is no public platform API reference, ontology editor documentation or agent-builder documentation [Inference from the navigation].

### 5. Business logic

> Source: [general-references/28-winnexo.md § 5. Business logic](../../general-references/28-winnexo.md#5-business-logic)

| Type | Key | What it is | Examples given |
|---|---|---|---|
| Business process | `process` | A workflow with start and end states and key stages | Product development, project acceptance, contract signing |
| Logic | `logic` | Criteria and calculations for filtering and deriving values | VIP customers, online-payment contracts, high-risk projects |
| Rule | `rule` | Constraints and validation checks | A risk needs a resolution before it can be closed; milestone date validation |
| Metric | `indicator` | A key measurement and its formula | GAAP completion rate, project risk count, milestone completion rate |

Source: [Fact](https://robject.lydaas.com/help/en/admin/ontology/model/business-logic/).

- Creation: a guided form (name, display name, associated object, description of the core logic) or one YAML block holding several entries, ingested one at a time with failures reported individually. A "Load Template" button pre-fills a sample ([Fact](https://robject.lydaas.com/help/en/admin/ontology/model/business-logic/create)).
- Nesting: indicators can link to processes and rules can link to logic. The page's example: the indicator "GAAP completion rate" is associated with Project and linked to the "project acceptance" process; the AI counts projects whose acceptance node is completed and divides by the total ([Fact](https://robject.lydaas.com/help/en/admin/ontology/model/business-logic/create)).
- [Inference] The pages read describe these definitions as descriptions the AI applies. They do not say whether a metric is compiled to a fixed query or interpreted by the model each time. This matters: the founder's plan compiles metrics so the same question always gives the same number. Whether WinNexo does the same is not established by these pages.

### 3. Bailian Agent 2.0, workflows, MCP, evaluation, managed agents

> Source: [general-references/08-alibaba-stack.md § 3. Bailian Agent 2.0, workflows, MCP, evaluation, managed agents](../../general-references/08-alibaba-stack.md#3-bailian-agent-20-workflows-mcp-evaluation-managed-agents)

**Agent 2.0** (released 26 Dec 2025). Knowledge bases, MCP servers and built-in tools are all "tools" the agent plans over. KB retrieval can be "intelligent" (the model decides) or "always" (search before the first inference). The loop is plan / act / reflect, with ReAct max rounds 1–50. Short-term memory is 0–30 turns. Long-term memory is "planned". Publishing shows a diff against the last release, and you can roll back to an earlier version. Models can be fixed or routed by AUTO / performance / balanced / economy. [Fact] [Agent 2.0](https://help.aliyun.com/zh/model-studio/new-single-agent-application)

**Workflows.** Workflows support batch, multimodal generation and document/image/video/audio parsing nodes. The KB node call modes are always / intelligent / legacy. Async runs return a task ID, and Dify workflows can be imported. [Fact] [release notes](https://help.aliyun.com/document_detail/2679100.html)

**Custom MCP.** Three ways to add one:
1. Script deployment to Function Compute: npx/uvx stdio servers, or an `http` connection to a remote SSE or streamable-HTTP server, using an `mcpServers` JSON config. Two modes: Basic (pay per call) or Speed (always on).
2. Import a REST API already published as MCP in AI Gateway (that is, Higress).
3. Import Alibaba Cloud OpenAPI services under a RAM role and RAM policy.
After deployment only the name and description can be edited. [Fact] [custom-mcp](https://help.aliyun.com/zh/model-studio/custom-mcp)

**Evaluation ("Evolution").** Set types are agent, workflow, trajectory (columns `input`, `reference_output`, `trajectory`) and custom. Column types: String, Number, Boolean, Object, Array, trajectory, multimodal. Imports from xls, xlsx or csv up to 20 MB. At most 10 versions are retained, and a set must be published before use. Column types are frozen once data exists. [Fact] [evaluation set](https://help.aliyun.com/zh/model-studio/agenteval-evaluation-set). Evaluator types and metrics were not on that page. [Unverified]

**Managed Agents (commercial billing since 17 Aug 2026).**
- Agent definition: name, model, system prompt, 9 built-in tools, MCP servers, version-locked skills, multi-agent "coordinator team", and metadata. Every save increments `version`. A session pins the agent version it started with. API updates are full replacements guarded by an optimistic lock on `version`. Agents can be archived but not deleted. [Fact] [agent definition](https://help.aliyun.com/zh/model-studio/managed-agents-agent-definition)
- Sandbox: images `code-interpreter-v1`, `browser`, `all-in-one`; E2B-compatible. Persistence is off by default; snapshots are kept 1–30 days (default 3). `web_search` costs ¥0.03 per call. Credentials use `${variable}` placeholders that the gateway substitutes only for configured domains, and only in the Authorization header. Scheduled tasks (cron) run one session per run. Webhooks are supported. Tool approval is either "always allow" or "ask each time". [Fact] [release notes](https://help.aliyun.com/document_detail/2679100.html)
- Memory Store: described in finding 9 and the memory section below.

**July 2026 enterprise agent platform.** The Bailian July 2026 monthly report (3 Aug 2026) lists an "enterprise-grade full-stack agent platform with visual orchestration and long-horizon autonomous planning", Token Plan (personal), "Knowledge Studio", and 39 new MCP templates. [Vendor claim] [developer.aliyun.com/article/1752713](https://developer.aliyun.com/article/1752713). The article body did not load, so no mechanics are known. At Apsara (22 Sep 2026) Alibaba also named **AgentCore** (build, run and manage agents, with human-agent collaboration controls), **Agent Security Center**, and a "Context Engine" with **Agent Context**, "real-time context and long-term memory for agents", claimed to cut tokens up to 67%. [Vendor claim] [blog 603589](https://www.alibabacloud.com/blog/alibaba-unveils-roadmap-on-full-stack-ai-strategy-from-chips-cloud-infrastructure-models-to-agents_603589)

### 9. Agent frameworks: AgentScope, Qwen-Agent, Spring AI Alibaba

> Source: [general-references/08-alibaba-stack.md § 9. Agent frameworks: AgentScope, Qwen-Agent, Spring AI Alibaba](../../general-references/08-alibaba-stack.md#9-agent-frameworks-agentscope-qwen-agent-spring-ai-alibaba)

- **AgentScope 2.0** (Apache-2.0, Python ≥3.11; latest tag v2.0.12 by `git ls-remote`). [Fact] [repo](https://github.com/agentscope-ai/agentscope)
  - ReAct agent with realtime interrupt and resume, sequential or concurrent tool calls.
  - Toolkit spanning Python tools, MCP and skills. Memory backends ReMe or Mem0. Context compaction and middleware.
  - Permission and human-in-the-loop controls. A2A via `A2AAgent` (Sep 2026). `TeamPipeline` leader/worker teams (Sep 2026). Experimental SOP support (Sep 2026). `ModelRouterMiddleware`.
  - Agent service: FastAPI with web UI, multi-tenancy, SQL or NoSQL persistence, scheduling, IM channels, WebRTC voice (Oct 2026).
  - Sandboxes: local, Docker, Apple Container, Bubblewrap, E2B, OpenSandbox, Daytona, Kubernetes.
- **AgentScope Runtime** is being archived into AgentScope 2.0 (last tags v1.1.x). It provided `AgentApp` as a FastAPI subclass with init / query / shutdown and SSE. Sandboxes: Base, GUI, Browser, Filesystem, Mobile, Training, Agentbay, on docker, gvisor, boxlite or fc backends. `RedisSession` keyed by `session_id` and `user_id`. Deploy targets: local, Kubernetes, Function Compute, ACK, and `ModelstudioDeployManager`. Protocols: A2A, Responses API, OpenAI-compatible. [Fact] [repo](https://github.com/agentscope-ai/agentscope-runtime)
- **Qwen-Agent** (Apache-2.0, latest tag v0.0.26). LLM wrappers over DashScope or any OpenAI-compatible server. A parallel function-call template with `fncall_prompt_type` and `use_raw_api`. MCP via `mcpServers`. A Docker code interpreter that the README itself calls not hardened for production. Long-document RAG. DeepPlanning benchmark (Jan 2026). [Fact] [repo](https://github.com/QwenLM/Qwen-Agent)
- **Spring AI Alibaba** (Apache-2.0, Maven 1.1.2.2; tag v2.0.0-M1.1 exists). Modules: agent framework (ReactAgent), Graph core, Admin, Studio, Sandbox. "Context engineering" policies: human-in-the-loop, compaction, model and tool call limits, tool retry, planning, dynamic tool selection. A2A with Nacos. NL2SQL/DataAgent and DeepResearch are separate projects. [Fact] [repo](https://github.com/alibaba/spring-ai-alibaba)

## Open-source implementations

### 21. Claude Agent SDK (TypeScript and Python)

> Source: [open-source-references/claude-agent-sdk.md](../../open-source-references/claude-agent-sdk.md) (code study)

- TypeScript: `LICENSE.md` states all rights reserved, with use governed by Anthropic's Commercial Terms of Service. The repository holds only examples and a changelog. Version 0.3.329 ("parity with Claude Code v2.1.329"), last commit 2026-11-19. [Fact] ([LICENSE.md](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/LICENSE.md), [CHANGELOG.md](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/CHANGELOG.md))
- Python: the wrapper code is MIT, but its README says use is governed by the Commercial Terms. Version 0.2.186. It bundles the CLI under `_bundled`. [Fact]
- Surfaces worth copying:
  - Hook events: PreToolUse, PostToolUse, PostToolUseFailure, UserPromptSubmit, Stop, SubagentStop, PreCompact, Notification, SubagentStart and PermissionRequest.
  - Permission results: `allow` with `updated_input`/`updated_permissions`, and `deny` with `message`/`interrupt`.
  - A `SessionStore` interface, with a Postgres reference store holding one JSONB row per transcript entry, ordered by BIGSERIAL and keyed by `(project_key, session_id, subpath)`.

  [Fact] ([types.py](https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py), [PostgresSessionStore.ts](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts))
- Verdict: **copy the design** (the hook taxonomy, allow/deny-with-rewrite, the session-store contract). **Do not build the core agent loop on it**, because the product must run GPT and Qwen as well. [Inference]

### 23. LangGraph (Python and JS)

> Source: [open-source-references/langgraph.md](../../open-source-references/langgraph.md) (code study)

- MIT. Python last commit 2026-11-20. JS: `@langchain/langgraph` 1.0.47 and core 1.7.5; `langgraph-api` is also MIT. [Fact]
- The Postgres checkpointer (`libs/checkpoint-postgres/src/migrations.ts`) has three tables:
  - `checkpoints(thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, type, checkpoint JSONB, metadata JSONB)`.
  - `checkpoint_blobs(thread_id, ns, channel, version, type, blob BYTEA)`.
  - `checkpoint_writes(thread_id, ns, checkpoint_id, task_id, idx, channel, type, blob)`.

  Human-in-the-loop is `interrupt(value)` inside a node, resumed with a command. [Fact] ([migrations.ts](https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts), [interrupt.ts](https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/langgraph-core/src/interrupt.ts))
- Verdict: **optional dependency** (model-agnostic, TypeScript, Postgres checkpointer). A hand-written loop over the provider SDKs is simpler for a generated-tool architecture. Copy the checkpoint/blob/writes split if you persist agent state yourself. [Inference]

### 24. AgentScope (Alibaba Tongyi) and Qwen-Agent

> Source: [open-source-references/agentscope-qwen-agent.md](../../open-source-references/agentscope-qwen-agent.md) (code study)

- AgentScope: Apache-2.0, Python, version 2.0.13dev, last commit 2026-11-20. Three modules matter:
  - The `sop` module defines a procedure as an ordered list of `SOPStep(subject, description, executor, verifier?, max_attempts=3)`. Each attempt is "work, then judgement"; run state (`SOPRunState`) outlives the process; a user interrupt parks the step without spending an attempt. [Fact] ([sop/_schema.py](https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py))
  - The `permission` module defines rules `PermissionRule(tool_name, rule_content, behavior, source)` and decisions with `updated_input`, `suggested_rules` and `bypass_immune`. [Fact]
  - Middleware covers budget, a model router, RAG, steering and long-term memory. [Fact]
- Qwen-Agent: Apache-2.0, Python, version 0.0.34, last commit 2026-03-04 (slowing). It has Qwen-specific and Nous-style function-calling prompt templates (`llm/fncall_prompts/`), DashScope and OpenAI-compatible clients, and an MCP manager. [Fact]
- Verdict: **copy the SOP executor/verifier/max_attempts structure** for multi-step agent procedures, a close analogue of what Lingyang-style "SOP agents" describe [Inference]. Ignore both as dependencies in a TypeScript build. Qwen's fncall templates matter only if you call Qwen models without native tool calling. [Inference]

### 7. Agents need a controlled operating lifecycle

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#7-agents-need-a-controlled-operating-lifecycle)

Sierra documents journey traces, simulations, release governance and regression; Decagon exposes AOPs and engineer-owned controls; Harvey product architecture is workflow/document-centric. This is analogous to a software release lifecycle, not a prompt editor.

**Design implication:** agent configuration should be versioned, typed, testable, reviewed, promoted and observable; production outputs should not silently rewrite business policies.

## Other companies and products

### Sierra Agent OS (1.0 to 2.0) and the Agent SDK

> Source: [general-references/12-agent-companies.md § Sierra Agent OS (1.0 to 2.0) and the Agent SDK](../../general-references/12-agent-companies.md#sierra-agent-os-10-to-20-and-the-agent-sdk)

Plain English. Agent OS is the runtime and the tooling. The SDK is how engineers write an agent as code. You declare goals ("help a customer return an order") and guardrails the agent cannot cross ("30-day window"), and the platform decides how to reach the goal.

Technical detail:
- The SDK is a "declarative programming language". Agents are composed from skills that encode procedural knowledge. Developers declare goals and deterministic guardrails. Guardrails are enforced deterministically in high-stakes actions such as processing an order or upgrading a plan. Behaviour is abstracted from the LLM, so models can be swapped without code changes. [Vendor claim] https://sierra.ai/blog/agent-development-life-cycle
- Out-of-the-box skills include triage, respond and confirm. A knowledge engine holds FAQs and policies. Escalation hands off to the contact centre with an auto-generated summary. Ramp's testimonial calls this writing "customer journeys as code". [Vendor claim] https://sierra.ai/product/agent-sdk
- Agent engineers can bypass the LLM to emit exact regulated language, build custom supervisors for healthcare or finance, and encode regional policy (UK vs US). The SDK enforces deterministic API interactions with systems of record. [Vendor claim] https://sierra.ai/blog/meet-the-ai-agent-engineer
- Agent OS 2.0 (5 Nov 2025) adds: build once and deploy to chat, voice, email, SMS, ChatGPT and the contact centre; Live Assist for human agents; Agent Studio 2.0 (journeys, workspaces, Integration Library); Insights 2.0 (Explorer, and Expert Answers, which turns contact-centre expertise into grounded articles); and the Agent Data Platform. [Vendor claim] https://sierra.ai/blog/agent-os-2-0
- Payments run on an isolated PCI DSS Level 1 cluster, so card data never reaches external LLMs. Sierra prefers one monolithic agent per customer to a multi-agent split, and supports MCP and agent-to-agent protocols. [Vendor claim, secondary] https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents

### Sierra model orchestration ("constellation of models")

> Source: [general-references/12-agent-companies.md § Sierra model orchestration ("constellation of models")](../../general-references/12-agent-companies.md#sierra-model-orchestration-constellation-of-models)

- 15+ frontier, open-weight and proprietary models are chosen per task: low-latency tool calling, high-precision classification, long-context policy reasoning, and tone. Sierra runs task-specific evaluations, fine-tunes where needed, adjusts prompts per model family, and keeps redundancy across providers with automatic failover on latency, error-rate and timeout signals. [Vendor claim] https://sierra.ai/blog/constellation-of-models
- About 10 to 15 model calls per conversation turn: a couple of frontier reasoning calls, several classifiers and speculative calls. Knowledge retrieval runs speculatively, and classification runs in parallel with generation. Sierra builds its own retrieval and reranking models. It works with existing model strengths "80% of the time". Prompt compaction must be non-lossy, and prompt caching never outranks quality. [Vendor claim, secondary] https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents

### 3.2 Per-message runtime

> Source: [general-references/18-decagon.md § 3.2 Per-message runtime](../../general-references/18-decagon.md#32-per-message-runtime)

[Vendor claim] https://decagon.ai/modules/decagon-platform ; https://decagon.ai/blog/decagon-trace-view ; https://decagon.ai/blog/voice-3
1. Message arrives on a channel (with metadata such as language, role, product tier).
2. Intent extraction over the full history.
3. AOP selection by entry conditions; else RAG over the knowledge base.
4. Within the AOP: model calls, retrieval, condition checks, tool calls and safety checks, each a traced micro-step with latency.
5. Supervisor model monitors the live conversation; escalation intents route high-risk topics to humans; guidelines shape tone.
6. Repeat on next message (so the agent can switch AOPs; Trace View records "AOP switches").
7. After the conversation: Watchtower jobs, tags, topic clustering, Suggestions, Duet reports.

Voice adds the duplex split: a low-latency conversational model (Alto) handles listening and speaking and decides whether to answer or wait, while a stronger model handles reasoning, tools and guardrails, and Alto waits for confirmation before telling a caller an action is done. [Vendor claim] https://decagon.ai/blog/introducing-alto

### 3.3 Models and orchestration

> Source: [general-references/18-decagon.md § 3.3 Models and orchestration](../../general-references/18-decagon.md#33-models-and-orchestration)

Sacra: a mix of OpenAI, Anthropic and Cohere models plus proprietary fine-tunes. [Analyst] https://sacra.com/c/decagon/. The air-gapped post: a "network of specialized models", frontier models reached by private connectivity and Decagon Labs models self-hosted. [Vendor claim] https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires. CEO in Feb 2025: what matters for text is instruction-following; for voice, latency (5 to 6 seconds is fine in chat, not on a call). [Vendor claim] https://www.amplifypartners.com/barrchives/how-decagon-builds-customer-support-ai-agents-that-really-work. SaaStr write-up: build for model flexibility, own the application layer, not the model. [Vendor claim, paraphrased by Lemkin] https://saastr.com/from-zero-to-eight-figures-in-18-months-decagon-ceos-playbook-for-ai-native-saas-growth-and-why-they-partnered-with-accel/. Alto's training recipe (small open-weight base, SFT on simulated calls built from production data, RL scoring candidates on answer-vs-wait and on policy adherence, varied simulated businesses for generality, 90M+ simulated calls, shadow mode) is the only published model-training detail. [Vendor claim] https://decagon.ai/blog/introducing-alto

### 3.5 Agent runtime

> Source: [general-references/21-glean.md § 3.5 Agent runtime](../../general-references/21-glean.md#35-agent-runtime)

- Agents are step graphs (flow) or auto-mode agents that pick tools themselves. Each step can override the org default model ([Fact](https://docs.glean.com/administration/configure-llms)). Step memory is explicit and token-bounded, and a warning appears when documents are truncated ([Fact](https://docs.glean.com/agents/concepts/memory)).
- Agents run as the invoker by default. Independent agents run as their own principal with service credentials ([Fact](https://docs.glean.com/agents/independent-agents)).
- Agent sandbox and "programmatic tool calling" are listed under security docs (titles only) ([Fact](https://docs.glean.com/security)).

## Research literature

### 1. The agent loop: ReAct, its descendants, and when to add structure

> Source: [general-references/10-papers-agents-memory-eval.md § 1. The agent loop: ReAct, its descendants, and when to add structure](../../general-references/10-papers-agents-memory-eval.md#1-the-agent-loop-react-its-descendants-and-when-to-add-structure)

**Plain English.** An agent is a model in a loop: think, call a tool, read the result, repeat, stop. Example: "What did ACME order last month?" The model thinks it needs the customer ID, calls `find_customer("ACME")`, then calls `list_orders(customer_id, month)`, then answers.

**ReAct** (Yao, Zhao, Yu, Du, Shafran, Narasimhan, Cao; arXiv 2210.03629, ICLR camera-ready). The model interleaves free-text reasoning traces with actions against an environment, which in the paper is a Wikipedia API for HotpotQA/FEVER and text environments for ALFWorld/WebShop. Grounding reasoning in observations reduces hallucination and error propagation compared with chain-of-thought alone. With one or two in-context examples it beat imitation and RL methods by an absolute 34% success on ALFWorld and 10% on WebShop [Fact, https://arxiv.org/abs/2210.03629]. Implementation: a prompt format with Thought / Action / Observation turns. Modern native function calling replaces the text parsing, but the loop is the same. Limitation: the loop is greedy, so one bad early step propagates. Takeaway: this is the base loop. Everything else is a modification.

**Toolformer** (Schick, Dwivedi-Yu, Dessì, Raileanu, Lomeli, Zettlemoyer, Cancedda, Scialom; arXiv 2302.04761, Feb 2023). The model learns in a self-supervised way when to call APIs (calculator, QA system, two search engines, translator, calendar) from a handful of demonstrations per API [Fact, https://arxiv.org/abs/2302.04761]. The details that candidate calls are kept only when they reduce the loss on subsequent tokens, and that the base model was GPT-J at about 6.7B parameters, come from the paper body, which I did not re-read this session [Unverified]. Takeaway for this product: none directly, since the founder will not train models. Its lesson is historical: tool use became a trained model capability, which is why third-party models now do it natively.

**Function-calling evolution** [Inference; not separately sourced this session]. The path runs from text-parsed ReAct (2022) to JSON-schema function calling in provider APIs (2023), then parallel calls, strict schema adherence, server-side tools (code execution, web search), deferred tool loading (Tool Search, Nov 2025), programmatic tool calling inside a sandbox (Nov 2025), and MCP as the cross-vendor tool transport. The design consequence is that the tool schema is the contract. Invest in it. See section 2.

**Plan-and-execute.** ReWOO (Xu et al., arXiv 2305.18323, May 2023) separates reasoning from observations. A planner writes the whole plan up front with placeholders for evidence, workers fill them, and a solver composes the answer. It reported about 5x token efficiency and +4% on HotpotQA [Fact, https://arxiv.org/abs/2305.18323]. The planner/worker/solver naming is from the paper body [Unverified this session]. Security bonus: a plan fixed before untrusted data is read is the "Plan-Then-Execute" injection-defence pattern (section 11). Limitation: rigid when later steps depend on earlier results.

**Reflexion** (Shinn, Cassano, Berman, Gopinath, Narasimhan, Yao; arXiv 2303.11366, 2023). After a failed trial, the agent writes a verbal self-reflection into an episodic memory buffer and conditions the next trial on it. There are no weight updates. It reached 91% pass@1 on HumanEval against GPT-4's 80% [Fact, https://arxiv.org/abs/2303.11366]. Requirement: a feedback signal (tests, environment reward, or a judge). Takeaway: retry with a written lesson works when you have a verifier. In a business product, the verifiers are rule checks, schema validation and dry-run results.

**Tree search.** LATS (Zhou et al., arXiv 2310.04406) runs Monte Carlo tree search over agent actions, with an LM value function, self-reflection and environment feedback. It reported 92.7% pass@1 on HumanEval (GPT-4) and an average score of 75.9 on WebShop (GPT-3.5) [Fact, https://arxiv.org/abs/2310.04406]. Limitation [Inference]: it needs reversible environments, because you cannot branch-and-backtrack a sent email or a posted refund. Takeaway: use search only inside simulated or dry-run sandboxes, such as exploring candidate plans against a copy of state, never on live side effects.

**Code as action (CodeAct)** (Wang, Chen, Yuan, Zhang, Li, Peng, Ji; ICML 2024, arXiv 2402.01030). The agent emits executable Python as its action, which unifies tool calls, control flow and data handling. It was up to 20% higher success across 17 LLMs, and the paper released CodeActInstruct with about 7k multi-turn interactions [Fact, https://arxiv.org/abs/2402.01030]. The industrial follow-ups are Anthropic's "code execution with MCP" (150k to 2k tokens on a Drive-to-Salesforce example) and Programmatic Tool Calling (-37% tokens on complex research tasks; internal knowledge retrieval 25.6% to 28.5%) [Vendor claim, https://www.anthropic.com/engineering/code-execution-with-mcp; https://www.anthropic.com/engineering/advanced-tool-use]. Caveat: the code needs sandboxing, resource limits and monitoring [Fact, code-execution post].

**Computer use.** OSWorld (Xie et al., arXiv 2404.07972) has 369 real-desktop tasks: humans 72.36%, best model at publication 12.24%. Failures were mainly GUI grounding and operational knowledge [Fact, https://arxiv.org/abs/2404.07972]. Takeaway [Inference]: for a company-model product, computer use is a fallback for systems without APIs. Typed tools over the company model are cheaper, more reliable and auditable.

**Anthropic, "Building effective agents"** (19 Dec 2024). Workflows (predefined code paths) differ from agents (the model directs its own tool use). The patterns are prompt chaining with gates, routing, parallelisation (sectioning and voting), orchestrator-workers, evaluator-optimizer, and autonomous agents with stopping conditions and human checkpoints. Use agents only for open-ended problems in trusted environments. Frameworks hide prompts, so start with raw APIs. Appendix: invest in the agent-computer interface (ACI) as much as in a human UI, write tool docs like a docstring for a junior developer, and poka-yoke arguments [Fact, https://www.anthropic.com/engineering/building-effective-agents].

**Anthropic, "Effective context engineering"** (29 Sep 2025). Context is a finite attention budget, and recall degrades gradually as tokens grow ("context rot"). System prompts should sit at the right "altitude", between brittle if-else rules and vague guidance. Start minimal on the best model and add instructions from observed failures. Prefer a few canonical examples over long edge-case lists. Use just-in-time retrieval: keep references (paths, queries) and load data with tools. For long horizons, use compaction (Claude Code keeps decisions, open bugs and the 5 most recent files), structured note-taking, and sub-agents that return condensed 1k to 2k-token summaries [Fact, https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents].

**OpenAI, "A practical guide to building agents"** (undated PDF; I could not confirm the date). It has three components: model, tools (data, action, orchestration) and instructions derived from existing SOPs. The single-agent loop has explicit exit conditions (final output, no tool call, error, max turns). The manager pattern uses agents as tools, and the decentralised pattern uses handoffs. Split only for complex conditional logic or tool overload. It recommends layered guardrails, including tool risk ratings of low, medium or high. Escalate to humans on repeated failure or on high-risk, irreversible actions such as large refunds [Fact, https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf].

**Google "Agents" white paper** (2 Sep 2024; Wiesinger, Marlow, Vuskovic, 42 pp.). It names three components (model, tools, orchestration layer) and three tool types. Extensions execute agent-side. Functions return a name and arguments for the client to execute. Data stores are vector stores for RAG [Fact, per index at https://www.aigl.blog/agents.md; I did not open the PDF itself]. The "client-side function" concept matters here: it is how you keep execution, and therefore policy enforcement, in your own process. Google's 2025 "Agents Companion" (AgentOps, trajectory metrics such as exact, in-order and any-order match) could not be opened this session [Unverified].

**Multi-agent: when it helps or hurts.**
- Anthropic's research system (13 Jun 2025): an Opus 4 lead with Sonnet 4 subagents scored +90.2% over single-agent Opus 4 on an internal research eval. On BrowseComp, token usage explained 80% of variance, and tokens plus tool calls plus model choice explained 95%. Agents use about 4x chat tokens and multi-agent systems about 15x. Effort rules were embedded in prompts: 1 agent with 3 to 10 calls for simple facts, 2 to 4 subagents for comparisons, more than 10 for complex research. Parallelism cut time by up to 90%. Early bugs included spawning 50 subagents for trivial queries. Production needed resumable checkpoints, full tracing, and rainbow deployments. It is a poor fit for shared-context or tightly coupled tasks, including most coding [Fact, https://www.anthropic.com/engineering/multi-agent-research-system].
- Cognition, "Don't build multi-agents" (Walden Yan, 12 Jun 2025): share full traces, not messages, because actions carry implicit decisions. In the Flappy Bird example, parallel subagents produced stylistically incompatible parts. The recommendation is a single-threaded linear agent plus, for long tasks, a dedicated history-compression model [Fact, https://cognition.com/blog/dont-build-multi-agents].
- MAST (Cemri et al., arXiv 2503.13657, v3 Oct 2025): 1,600+ annotated traces across 7 frameworks, 14 failure modes in 3 categories (system design, inter-agent misalignment, task verification), kappa 0.88, and an LLM-as-judge annotator [Fact, https://arxiv.org/abs/2503.13657].
- Synthesis [Inference]: for an internal "answer, report, act" agent over a company model, use one agent with good tools. Add read-only, context-isolated sub-agents only for wide fan-out research, such as scanning 40 accounts. Never let parallel sub-agents take write actions.

## Design decisions already in the reference maps

### 12. The agent loop

> Source: [general-references/32-map-research-and-cost.md § 12. The agent loop](../../general-references/32-map-research-and-cost.md#12-the-agent-loop)

**Purpose.** One model in a tool-calling loop that answers, reports and acts. Example: a collector asks "Draft reminders for everyone 30+ days overdue in my region". The loop resolves intent, queries the metric, retrieves the dunning template, drafts the messages, runs the guards and returns the drafts for approval.

**Design to implement.**
- *Single agent, raw provider APIs*, with no framework. Exit on any of: final answer, no tool call, error, max turns (for example 30), token budget.
- *Turn 0*: the intent and slot step (section 13).
- *Context management*:
  - cached fixed prefix (section 20)
  - just-in-time loading of facts via tools
  - clear stale tool results first, then compact long loops (keep decisions, open issues, recent artefacts)
  - a minimal system prompt grown from observed failures, with a few canonical examples
- *Sub-agents*: read-only and context-isolated, only for wide fan-out (for example scanning 40 customer accounts). Each returns a 1k–2k-token summary. No parallel writers.
- *Verifier-driven retry*: on a rule-check, schema or dry-run failure, retry with the error text (Reflexion pattern).
- *Plan search* (LATS-style) only in dry-run sandboxes, never on live side effects.
- *Computer use* only as a fallback for systems without APIs.

**Evidence.**
- The most successful teams used simple composable patterns; start from raw API calls (Anthropic, Dec 2024).
- Multi-agent scored +90.2% on breadth-first research but at about 15x chat tokens. It hurts when subtasks share context (Anthropic multi-agent post; Cognition).
- MAST found 14 failure modes in 1,600+ multi-agent traces (arXiv 2503.13657).
- Context editing cut tokens by 84% on a 100-turn task [Vendor claim] (document 13, section 3).
- OSWorld: best model 12.24% against humans 72.36% at publication (arXiv 2404.07972).
- Document 10, section 1.

**Copies.** Document 10, section 1 and "What to copy" items 1 and 13. https://www.anthropic.com/engineering/building-effective-agents ; https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf ; https://www.anthropic.com/engineering/multi-agent-research-system ; https://cognition.com/blog/dont-build-multi-agents ; https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents

**Left out.** Multi-agent orchestration as the default; Toolformer-style training; tree search on live systems.

**Open questions.** The max-turn and token-budget defaults are illustrative (the "30" comes from document 10, which says "for example").

### 15. Agent loop and model interface

> Source: [general-references/33-map-context-code-integration.md § 15. Agent loop and model interface](../../general-references/33-map-context-code-integration.md#15-agent-loop-and-model-interface)

**Purpose.** One loop that runs Claude or Qwen (and GPT if wanted) with the same generated tools, hooks and permissions. Receivables example: a tenant switches from Claude to Qwen for cost; the reminder-drafting agent keeps the same tools, permissions and evaluations.

**Design to implement.**
- **Write the loop yourself** over the provider SDKs (Anthropic; OpenAI-compatible endpoint for Qwen via DashScope) [Inference, document 14]. The model is a per-tenant (and per-agent) setting, never fixed by the platform (document 11 warns against Cortex Analyst's fixed order and Fabric's fixed model [Fact]).
- Do **not** build the core loop on the Claude Agent SDK: TypeScript licence is all rights reserved under Anthropic's Commercial Terms; it drives the Claude Code runtime and cannot carry other models' turns [Fact/Inference].
- Copy its surfaces [Fact]: hook events PreToolUse, PostToolUse, PostToolUseFailure, UserPromptSubmit, Stop, SubagentStop, PreCompact, Notification, SubagentStart, PermissionRequest; permission results `allow` (optionally with `updatedInput`) and `deny` (with `message` and `interrupt`); a session store with one JSONB row per transcript entry, ordered by BIGSERIAL, keyed by `(project_key, session_id, subpath)` — here `(org_id, session_id, subpath)` [Inference].
- PreToolUse is where the permission layer and tool-pack check run; PostToolUse is where audit, DLP-style masking of outputs (Merge Agent Handler [Vendor claim]) and safety-flag redaction (Conjure) run [Inference].
- Multi-step procedures: SOP steps with executor and verifier, `max_attempts = 3`, run state that outlives the process, parking on human input (AgentScope [Fact]), running as DBOS workflows (section 6).
- Optional: LangGraph JS (MIT) with its Postgres checkpointer (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`) and `interrupt()`; document 14 judges a hand-written loop simpler for a generated-tool architecture [Fact/Inference].
- Qwen function-calling prompt templates (Qwen-Agent `fncall_prompts`) matter only if a Qwen model without native tool calling is used [Fact/Inference].
- Lessons: few consolidated tools; guide the goal, not the path (OpenAI [Fact]); the Fabric data agent pipeline (validate against policy, rephrase, pick a source, generate, validate, execute, summarise) is a reasonable reading pipeline [Fact].

**Copies.**
- Document 14, section 21. https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py ; https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/LICENSE.md ; https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts
- Document 14, sections 23–24. https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts ; https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py
- Document 11, section 7 lessons; section 2 pipeline. https://openai.com/index/inside-our-in-house-data-agent/ ; https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent

**Left out, and why.** Claude Agent SDK as runtime (licence, single model). Letta V1 server (archived; maintainers forbid new use [Fact]). Snowflake-style per-message pricing that reprocesses full history (cost grows with conversation length [Fact]).

**Open questions.** Whether DashScope exposes an Anthropic-compatible endpoint (document 14 unverified). Tool-calling reliability of Qwen on generated tool sets was not measured.

### 13. Role-packaged AI employees: data, knowledge, tools, permissions, evaluation metric

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 13. Role-packaged AI employees: data, knowledge, tools, permissions, evaluation metric](../../general-references/31-map-lingyang-alibaba-offers.md#13-role-packaged-ai-employees-data-knowledge-tools-permissions-evaluation-metric)

**Purpose.** Sell and govern agents as named jobs, each with exactly what it needs and one measure of success. Receivables example: "Collections Agent" has the AR objects, the dunning policy KB, the eight actions, a service identity limited to reminders and replies, and is measured on promise-kept rate and approval rate.

**Design to implement.**
- AgentOne's role-based design (岗位化): each AI employee is configured with data, knowledge, tools, permissions and evaluation metrics for one job [CLAIM, 07 §3]. Bundle record [Inference]: `{role_id, data_scope (entity types and topics), knowledge (KB ids, glossary scope, memory mounts), tools (runbook ids), permission_identity, evaluation_metrics[], agent_definition_version}`.
- HR-style identity from QwenWork digital employees: name, department, owner, duties, authorisation scope, lifecycle, admin disable; every execution record traces to that identity [Vendor claim, 08 §5].
- Identity rules, from 25 row 27: internal agents act as the asking user (Quick BI's `user_token` defines data scope [Fact, 07 §6]; the Alibaba Cloud CIO principle that an agent acting for an employee inherits that employee's permissions [Fact as reported, 07 What to copy 13]); the external agent acts as a service identity limited to reminder and reply actions.
- Version 1 ships two fixed roles, not a builder (25 row 21): **Finance Analyst** (internal: questions, weekly report) and **Collections Agent** (external: reminders, reply classification, proposed actions).
- Evaluation metric per role [Inference, from the role principle plus 25 rows 10 and 25]: Finance Analyst: answer like rate and test-set pass rate. Collections Agent: draft approval rate, promise-kept rate, days from due date to first contact.
- Know-how packaging: QwenWork "expert kits" bundle skills, connectors and workflows per role; organisation-level skills preserve method when staff leave [Vendor claim, 08 §5]. LatePost: industry know-how packaged as Skills [Press, 07 §3]. [Inference] Ship each role with a skill file describing the dunning cadence, editable by the finance owner through draft and publish.
- Distribution: offer the agent interface as an MCP server and a Skill package using the user's own token (25 row 23; Quick BI Skill credentials api_key, api_secret, user_token, server_domain [Fact, 07 §6]).
- Agent seats gated separately from viewing seats: in Quick BI members without an agent seat cannot use agents [Fact, 25 B2.5].
- Phasing from Yadi's delivery: agent workbench and summaries first, then bots [Press, 07 §3]. [Inference] Launch the Finance Analyst and draft-only collections first; turn on sending after approval history exists.

**Copies.**
- 07, §3 AgentOne official architecture and AI employee behaviours. https://help.aliyun.com/document_detail/3004555.html ; https://news.mydrivers.com/1/1139/1139921.htm
- 08, §5 QwenWork digital employees and expert kits. https://tech.ifeng.com/c/8wd2EoDIYv7 ; https://www.ifanr.com/1673691
- 07, §6 Quick BI Skill. https://help.aliyun.com/zh/quick-bi/user-guide/quick-bi-open-skill-manual
- 25, C6 rows 21, 23, 27; What to copy 4 and 8. https://help.aliyun.com/zh/quick-bi/user-guide/smartq

**Left out, and why.** AI Sales, AI Marketing, AI Operations roles; custom "X employees"; multi-agent expert groups (25 row 46: never).

**Open questions.** AgentOne's role configuration has no published mechanics [CLAIM, 25 KF 6], so the bundle schema above is designed, not copied.

## Earlier engineering notes (Phase 2)

### Runtime responsibilities

> Source: former `08-agent-platform/agent-runtime-and-adlc.md` (moved here in the Nov 2026 restructure)

- Resolve agent identity, tenant, delegated principal and session scope.
- Construct context from ontology objects, documents, graph facts, policies, metrics and workflow state.
- Route to model(s) under budget/privacy/capability constraints.
- Plan tool use through a typed tool registry.
- Separate read/query tools from write/action tools.
- Require server-side policy enforcement for every tool invocation.
- Record tool inputs/outputs, policy result, citations, token/cost, latency and state transition.
- Persist only selected memory/facts with provenance, retention and correction logic.
- Escalate ambiguous/high-risk cases to a human.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- Every source category has some material; see the open questions in each linked source.
