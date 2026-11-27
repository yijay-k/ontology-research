# Automations and triggers

**Layer:** [09-workflows](README.md) · **What it is:** Triggers on object changes, schedules and events that start actions or agents, and their limits.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Other companies and products](#other-companies-and-products) (15) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### 14. Automate and agents triggered by Ontology changes

> Source: [general-references/03-palantir-aip.md § 14. Automate and agents triggered by Ontology changes](../../general-references/03-palantir-aip.md#14-automate-and-agents-triggered-by-ontology-changes)

**Plain English.** Automate is "when X happens in the data, do Y". Example: when a new high-priority Alert object appears, run a triage Logic function and stage its proposed assignment for a supervisor to approve.

**Technical detail.**
- **Conditions.** Time-based, object data, combined, dataset updated, and streaming. [Fact] https://www.palantir.com/docs/foundry/automate/overview/
- **Object conditions** ([Fact] https://www.palantir.com/docs/foundry/automate/condition-objects/):
  - Objects added to a set (live or scheduled).
  - Objects removed from a set (live or scheduled).
  - Objects modified in a set (live only; can be limited to chosen properties).
  - Run on all objects (scheduled, with batch size and parallelism settings).
  - Threshold crossed (scheduled; Automate-defined logic or a function returning true/false).
  - Metric changed (being retired).
  - Changes are "typically picked up within minutes".
- **Effects.** Action, Logic, Function and Notification. Action, Logic and Function effects can each have a fallback effect. There are per-effect automatic retries for transient errors such as rate limits, and event retries for persistent errors. Effects can run sequentially or in parallel, with **at-least-once** semantics. [Fact] https://www.palantir.com/docs/foundry/automate/effects/
- **Execution identity.** Conditions are evaluated with the *owner's* permissions. Action, Logic and Function effects run as the *owner*. Notifications use each recipient's permissions. An automation can be owned by a third-party application's service user, so it keeps working when a person leaves. [Fact] https://www.palantir.com/docs/foundry/automate/security/ The pro-code agent page instead says agents run "as the user who triggered the automation or as the automation's service user". [Fact] https://www.palantir.com/docs/foundry/agents/publish-and-call/ The two pages describe identity differently, and I could not open the Automate permissions page to reconcile them. [Unverified]
- **Limits** ([Fact] https://www.palantir.com/docs/foundry/automate/limits/):
  - 100k input objects for scheduled added/removed conditions.
  - 1M input objects for "run on all objects".
  - 10k objects per evaluation, both real-time and scheduled per-object.
  - Batch size 1,000.
  - 5M objects for manual execution.
  - 45 minutes maximum in the execution queue.
  - **4-hour maximum run time**.
  - Automations can be paused automatically on excessive activity.
- **Human review of AI edits.**
  - With staged writes on, the Logic function is wrapped in an Action, and the Action effect can be *staged* as a proposal.
  - Proposals appear under "Agent proposals", showing why each was created, a preview, and the agent's decision log.
  - Accepting a proposal runs the Action.
  - Palantir recommends staging consequential or ambiguous actions, and auto-applying only when "purpose, impact, and recovery path justify it".
  - Open proposals are visible only to the automation creator, for 24 hours. [Fact] https://www.palantir.com/docs/foundry/logic/aip-logic-integration-automate/
- **Branching and AI authoring.** Automate supports Global Branching (9 Jul 2026). AI FDE can create and modify automations (27 Aug 2026), but not yet function or agent effects. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07 , https://www.palantir.com/docs/foundry/announcements/2026-08

### A11. Automate (triggers to effects)

> Source: [general-references/05-palantir-apps-infra.md § A11. Automate (triggers to effects)](../../general-references/05-palantir-apps-infra.md#a11-automate-triggers-to-effects)

- **Conditions:** time, object data, time plus object data, or dataset. They are evaluated continuously (streaming or real-time) or on a schedule ([Fact](https://www.palantir.com/docs/foundry/automate/overview/)).
- **Effects:** Foundry Action, AIP Logic, Function, or platform/email notification with attachments, plus fallback effects.
- **Other features:** branching on Global Branching was added 9 Jul 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-07)). Automate replaces "Object Monitoring".
- **Design guidance Palantir gives:** document each effect's purpose, data scope, *execution identity* and impact. Stage consequential writes for human review, and include a recovery path ([Fact](https://www.palantir.com/docs/foundry/automate/overview/)).
- **Limits** ([Fact](https://www.palantir.com/docs/foundry/automate/limits/)):

| Limit | Value |
|---|---|
| Objects added/removed (scheduled) input | 100,000 |
| "Run on all objects" (scheduled) | 1,000,000 |
| Objects per evaluation, real-time | 10,000 (excess dropped or error) |
| Objects per evaluation, scheduled per-object | 10,000 (excess = runtime error, nothing runs) |
| Manual execution object set | 5,000,000 |
| Batch size | 1,000 |
| Static recipients | 10,000 |
| Scenarios tracked | 100 |
| Max queue wait | 45 min (then dropped) |
| Max run time | 4 h (finished effects kept) |

- Automatic pausing on "excessive activity" exists, but no threshold is given.
- **Effect execution:** Retries, execution settings and per-object vs batch settings exist as sub-pages I could not read [Unverified].
- **Small-product equivalent [Inference]:**
  - an event bus fed by ontology edits, a scheduler, and an effects worker;
  - each automation has an owner identity, a batch size, a queue timeout, a run timeout, a fallback effect, and an auto-pause on runaway;
  - this is how "agents that act unprompted" should be built.

## Lingyang, AgentOne and Alibaba

### 7. Automated tasks, events and workflows

> Source: [general-references/28-winnexo.md § 7. Automated tasks, events and workflows](../../general-references/28-winnexo.md#7-automated-tasks-events-and-workflows)

- A task has an execution plan (manual, scheduled daily, weekly, monthly or by Cron, or triggered by an external notification), a natural-language description, and optionally locked objects, ontology elements and skills ([Fact](https://robject.lydaas.com/help/en/user-guide/automated-tasks/)).
- One worker can run a task alone, or up to five as a team in which a lead worker splits the work ([Fact](https://robject.lydaas.com/help/en/user-guide/automated-tasks/)).
- Each run is logged with a status (Success, Failed, Pending, Running, Terminated), outputs and logs; a failed run can be retried from the failed step. Tasks can be distributed centrally to users or groups, who run them with their own permissions, and saved as enterprise templates ([Fact](https://robject.lydaas.com/help/en/user-guide/automated-tasks/)).
- Event Center (beta, 3 Sep 2026): triggers from opportunity stage changes, contract amounts, chat messages, mentions, negative feedback and group membership changes, with conditions in natural language and cooldown windows ([Fact](https://robject.lydaas.com/help/en/changelog/)).
- Collaboration Space workflows (beta 17 Sep, extended 2 Nov 2026): templates with steps, branches, deliverables, human approval, a run summary and an audit page ([Fact](https://robject.lydaas.com/help/en/changelog/)).
- Business Actions (15 and 22 Oct 2026): actions configured in natural language with input formats, execution conditions and batch runs, reusable in chats and tasks ([Fact](https://robject.lydaas.com/help/en/changelog/)).

## Other companies and products

### UiPath

> Source: [general-references/26-process-and-automation-giants.md § UiPath](../../general-references/26-process-and-automation-giants.md#uipath)

**1. In one paragraph.** UiPath (NYSE: PATH) built the robotic process automation (RPA) category. Software robots click through user interfaces and call APIs to repeat rules-based work. Since 2025 it has repositioned as "agentic automation": agents, robots and people coordinated by its Maestro orchestration layer. Buyers are heads of automation centres of excellence, CIOs, and shared-services and finance-operations leaders at large enterprises in banking, insurance, healthcare, the public sector and manufacturing. The job is removing manual swivel-chair work, for example invoice entry, reconciliations, claims and onboarding. The result they pay for is hours saved and throughput at constant headcount [Inference, consistent with UiPath's long-standing positioning].

**2. Function catalogue** (grouped as UiPath's 2026 platform; items without a source in this round are marked).
- *Build*: **Studio / Studio Web** (designer for robots and agents; Studio Web Test and Preview are not billed) ([Fact] https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md). **Agent Builder** (low-code agents with prompts, tools, context grounding, guardrails and evaluations). Coded agents, licensed separately ([Fact] docs page "coded-agents-licensing" appears in search results). Conversational agents, licensed separately ([Fact] search result title). **Coding agents and Maestro BPMN generation** (Preview) ([Fact] search result title "Maestro BPMN (Preview)").
- *Orchestrate*: **Maestro Orchestrate** runs long-running processes across agents, robots and people. It has three canvases on one engine: **Case** (long-running, exception-heavy work), **Flow** (developer-first sequential workflows) and **BPMN 2.0**. A case can invoke a BPMN process. It supports **DMN** business rules, real-time monitoring, live instance supervision (pause, resume, retry), and process mining on process data ([Fact] https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions). **Maestro Automate** handles short runs that finish within 24 hours ([Fact] same). **Maestro Case** and **Maestro Flow** were highlighted as new in the Q2 FY27 results (3 Sep 2026) ([Fact] https://investingnews.com/uipath-reports-second-quarter-fiscal-2027-financial-results).
- *Run and govern*: **Orchestrator**, which handles tenants, folders, robots, queues, triggers, credential assets and logs. The Enterprise tier adds advanced audit, canary tenants, customer-managed keys, an external credential store and Elastic Robot Orchestration ([Fact] https://docs.uipath.com/automation-cloud/automation-cloud/latest/admin-guide/unified-pricing-licensing-plan-framework). **Insights** for real-time monitoring (Basic and above) ([Fact] same). **AI Trust Layer** for model governance, PII handling and audit of LLM calls [Unverified in this round]. **Automation Ops** for governance policies [Unverified in this round].
- *Human in the loop*: **Action Center / Apps**, where people approve, correct or complete tasks [Unverified in this round, long-standing product].
- *Documents*: **Document Understanding** and **IXP** (intelligent extraction). Community limits are 50 documents an hour for Document Understanding, and 500 design and 100 runtime pages a month for IXP ([Fact] unified pricing page).
- *Data*: **Data Fabric** (Community: 1 unit with 100 MB of data, 500 MB of attachments and 1,000 API calls a day) ([Fact] same).
- *AI assistants*: **Autopilot** for developers, testers and end users, with its own licensing ([Fact] same page).
- *Agent interoperability*: **UiPath MCP Server** (Community: 50 a day per organisation) ([Fact] same page).
- *Testing*: **Test Suite / Test Manager**, sold with Automation Test Robots, and "agentic testing" [Unverified in this round; Automation Test Robot licence confirmed by the unified pricing page].
- *Discovery*: **Process Mining** and **Task Mining**, including Maestro's built-in process mining ([Fact] Maestro concepts page).
- *Computer Vision*: Community limit of 30 megapixels a minute ([Fact] unified pricing page).

**3. How it works underneath.** The robot executes deterministic workflows. Orchestrator schedules them through queues and triggers and stores credentials as assets. Maestro sits above as the process engine, where each step is a robot, an agent, an API call or a human task, and DMN tables hold rules ([Fact] Maestro concepts page). Agents run as production "runs", and each run is metered ([Fact] licensing doc). A run starts from Orchestrator (manual, schedule or queue) or from an API or webhook in a production workspace, and a published-channel conversation counts as one run ([Fact] same). Guardrails include "LLM as Judge", which costs extra judge calls ([Fact] same). Design-time debugging and evaluation draw from a per-user monthly pool scaled by licence type: 1x for Basic, 7.5x for Plus and 20x for Pro/Developer ([Fact] same).

**4. Commercials.**
- **Pricing.** "Unified Pricing" has seven plan levels: Free, Community, Basic Trial, Basic, Standard Trial, Standard and Enterprise ([Fact] unified pricing page). User licences are Express, Basic, Plus and Pro. Robots are Unattended and Automation Test. Consumption is in Platform Units: a Standard Trial includes 8,000 PU, Maestro Orchestrate consumes PU per orchestrated instance with no allowance, and Maestro Automate consumes PU at a reduced rate with a monthly allowance ([Fact] same). The older "Flex" plan meters agents in Agent Units ([Fact] licensing doc).
- **Agent metering** (the most precise in the market):

| Model tier | Unified (PU per LLM call) | Flex (AU per LLM call) |
|---|---|---|
| Premium (e.g. Claude Opus 4.6, GPT-5.5) | 0.4 | 2 |
| Standard (e.g. GPT-4.1, Claude Sonnet 4.6, Gemini 2.5 Pro) | 0.2 | 1 |
| Basic (e.g. Claude Haiku 4.5, GPT-4o-mini) | 0.16 | 0.8 |
| Customer-managed model | 0.2 per run (LLM calls not metered) | 1 per run |

  Input is billed in 64k-token increments (system prompt, history, tool definitions and user messages; output excluded). Top-ups come in 50-PU packs that roll over ([Fact] https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md). The money value of a PU was not published on the pages read [Unverified].
- **Revenue (Q2 FY2027, quarter ended 31 July 2026)**: revenue US$410.3M (+13%), ARR US$1.938B (+12%), net new ARR US$37M, dollar-based net retention 109%, non-GAAP gross margin 82%, non-GAAP operating income US$89.0M, cash US$1.405B. FY27 guidance: revenue US$1.789 to 1.794B and ARR US$2.065 to 2.070B ([Fact] https://investingnews.com/uipath-reports-second-quarter-fiscal-2027-financial-results, 3 Sep 2026). The shares fell about 24% after the report despite the raised outlook (headline in search results: Zacks; [Fact] title only).
- **Customers and team.** Not read in this round [Unverified].

**5. Why customers choose it.**
1. It automates systems that have no API (legacy UIs, Citrix) [Inference, long-standing].
2. Governance at scale: tenants, folders, credential stores, audit and canary tenants ([Fact] unified pricing page).
3. One vendor for robots, documents, agents, testing and orchestration ([Fact] catalogue above).
4. An installed base and a trained developer community (Community plan, Academy) [Inference].
- *Complaints*: the licensing is complex (seven plans, four user types, PU and AU) ([Fact]); robots are brittle when UIs change [Unverified, a widely reported pattern]; growth is slowing ([Fact] ARR +12%).

**6. How it deploys.** Self-serve trials last 60 days and then downgrade to Free ([Fact] unified pricing page). Enterprise programmes run through a centre of excellence and partners [Inference]. Time to go live was not read in this round [Unverified].

**7. What to copy.**
1. Meter agent cost per LLM call by model tier, with a flat per-run price when the customer brings a model, and bill input in fixed token increments. This makes the cost of rented models legible to the buyer. Source: https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md
2. Separate design-time (test and evaluation) consumption from run-time, and do not bill previews. Source: same.
3. Use three orchestration shapes on one engine: case for exceptions, flow for linear steps, BPMN for standard processes, with DMN for rules. Source: https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions
4. Allow live instance supervision: pause, resume and retry a running process instance. Source: same.

**8. What not to copy.** Do not copy seven plans and four user types. Do not build UI-scraping robots for version one: the founder's sources (accounting APIs, email) have APIs [Inference]. Weakness: agent value is still unproven in the numbers ([Fact] slowing ARR).

**9. Relationship.** *Teacher* for metering and orchestration design. A possible *competitor* only if UiPath packages AR agents for the mid-market, and there is no evidence it does [Inference].

**What UiPath learned moving from bots to agents** [Inference, drawn from the product shape documented above]: (a) agents did not replace robots and orchestration; they became another task type inside them, hence Maestro; (b) exception-heavy work needed case management, not longer flows; (c) customers demanded cost transparency per call and per model; (d) evaluation and guardrails had to be first-class and billable; (e) agents must be reachable from outside, hence the MCP Server.

### ServiceNow

> Source: [general-references/26-process-and-automation-giants.md § ServiceNow](../../general-references/26-process-and-automation-giants.md#servicenow)

1. **In one paragraph.** ServiceNow is the workflow platform for IT, employee service, customer service, security and risk at large enterprises. It runs more than 100 billion workflows a year ([Vendor claim] https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-launches-the-real-time-data-foundation-that-puts-autonomous-AI-to-work-across-the-enterprise/default.aspx, 6 May 2026). Buyers are CIOs, heads of IT service management, CHROs' service-delivery teams and customer-service leaders at large enterprises and governments. They pay for tickets resolved without people, SLA compliance, and one governed system of action.
2. **Function catalogue (Knowledge 2026, May 2026).**
   - **AI Control Tower** has five parts: Discover (30 new integrations across AWS, GCP, Azure, SAP, Oracle and Workday, which find AI agents and devices), Observe (from the Traceloop acquisition), Govern (risk assessment and remediation), Secure (from the Veza acquisition) and Measure (cost and ROI). It is part of the August "Australia" release ([Fact] https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and).
   - **Action Fabric** runs the platform headless for any MCP agent and exposes processes, workflows, SLAs, the Knowledge Graph and the Context Engine. Claude is the launch partner ([Fact] same).
   - **Autonomous Workforce / AI Specialists.** An L1 IT service desk specialist (GA). CRM specialists covering qualification, quoting, fulfilment, **invoice disputes** and renewals, available now. Employee-service specialists covering HR, legal, **finance**, procurement and others, available now. IT specialists from June. Security and risk specialists GA in September 2026 ([Fact] same). Moveworks (employee-service agent, acquisition milestone December 2025, see file 12) is being integrated into Autonomous Workforce ([Fact] headline in same article).
   - **Autonomous Security & Risk.** Veza Access Graph and Armis asset context. Armis was acquired for US$7.75B ([Fact] same).
   - **Otto.** A cross-platform AI experience, outlined only ([Fact] same).
   - **Data:** Context Engine (a real-time map of people, roles, assets, services and policies, with a semantic layer over CMDB, workflow and third-party data). **Workflow Data Fabric** (GA). **Data Catalog** with lineage and a business glossary (GA). **RaptorDB Pro**, one engine for operational and analytical work with native graph and time series. Live Perform, Live Connect (a SQL API over live data with no copies) and Live Archive (GA). Autonomous Data Governance (2H 2026). Autonomous Data Analytics (vision, built on Pyramid Analytics). **MCP Registry**, a private catalogue of approved MCP servers governed by AI Control Tower (Innovation Lab, with A2A Agent Cards by year end). **AI Gateway** (announced) ([Fact] newsroom release, 6 May 2026).
3. **Underneath.** A single platform data model (tables plus the CMDB) with workflows, SLAs and roles in one place. Agents inherit the platform's ACLs and workflows. Governance is a separate control plane (Control Tower) that inventories agents across vendors [Inference from sources above].
4. **Commercials.** A related headline reports ServiceNow ending a separate AI add-on in 2026 ([Fact] headline only; details [Unverified]). Revenue and pricing were not read in this round [Unverified]. Named results: PayPal's database tasks ran 2x faster and its longest operations 5x faster on RaptorDB ([Vendor claim] newsroom release). Customers named: City of Raleigh, DocuSign, Honeywell, Zespri ([Fact]).
5. **Why chosen.** It is already the system of record for service work; it has one permission and workflow model; and it now offers cross-vendor agent governance. *Complaints:* cost and implementation partners [Unverified].
6. **Deploys.** Partner-led implementations [Unverified].
7. **Copy.** (a) An inventory of every agent and tool, with cost and ROI measured per agent (Control Tower "Measure"). (b) A private registry of approved MCP servers. (c) A headless action layer that external agents call under the platform's own SLAs and rules. Sources above.
8. **Don't copy.** Platform breadth. Acquisition-led suites (Armis, Veza, Traceloop, Pyramid, Moveworks) are not reproducible by a solo founder.
9. **Relationship.** *Teacher* on governance. *Not a competitor* in the 100 to 1,000 staff segment for AR [Inference]. A *possible integration* where a customer already runs ServiceNow CSM for invoice disputes.

### Pega

> Source: [general-references/26-process-and-automation-giants.md § Pega](../../general-references/26-process-and-automation-giants.md#pega)

1. **In one paragraph.** Pegasystems sells a rules-and-case-management platform (Pega Infinity) and real-time decisioning (Customer Decision Hub, with "next-best-action") to banks, insurers, telcos and governments. Buyers are COOs, heads of customer operations, and CIOs in regulated industries. The result is consistent, auditable handling of high-volume cases (claims, onboarding, collections, disputes) and personalised offers chosen in real time [Inference consistent with sources below].
2. **Function catalogue.**
   - **Pega Blueprint.** Generative design of workflows and applications from a description. Since 2026 it is also an *agent builder* that combines deterministic business rules with generative AI, and Blueprint agents can call MCP servers within data-governance rules (preview at PegaWorld, June 2026; release Q3 2026) ([Fact] https://www.techtarget.com/enterprise-software/news/366643870/Pegasystems-refines-Blueprint-agent-builder-expands-marketing-tools, 8 Jun 2026).
   - **MCP support** exposes Pega data to third-party agents (Anthropic, OpenAI, Google, AWS) under Pega governance ([Fact] same).
   - **Customer Engagement Studio**, a marketing front end to Customer Decision Hub ([Fact] same). The Customer Engagement Blueprint launched February 2025 ([Fact] title https://www.businesswire.com/news/home/20250225477319/en).
   - **Pega Predictable AI Agents**, which combine reasoning with workflow predictability (May 2025), and self-service built from Blueprint plus Predictable AI (August 2025) ([Fact] businesswire titles). An "Agentic Enterprise Transformation Platform" launched September 2025 ([Fact] title).
   - **Long-standing products** [Unverified in this round]: Case Management (stages, steps, SLAs, assignments), decision rules (decision tables, decision trees, when rules), Customer Decision Hub with adaptive models, Process AI, and Robotics.
3. **Underneath.** The rules-engine heritage: every behaviour is a versioned "rule" in layered rulesets, so a bank can override a step for one product line without forking the app [Unverified details]. Founder Alan Trefler says workflows matter because they are a deterministic way "to get stuff done" and make work visible ([Fact] TechTarget).
4. **Commercials.** AI pricing is moving from token-based to **per case**, meaning a completed task from start to finish ([Fact] TechTarget, June 2026). Revenue was not read [Unverified].
5. **Why chosen.** Regulated customers want "de-risked" agents ([Fact] TechTarget). Rules are auditable. Next-best-action is proven at scale [Unverified].
6. **Deploys.** Partner-led, with Blueprint shortening design [Inference].
7. **Copy.** (a) Agents that act only inside a case whose stages and rules are deterministic. (b) Per-case (outcome) pricing. (c) Next-best-action: for each customer, a ranked set of eligible actions (rules filter eligibility, a model ranks propensity), which maps directly onto "which reminder, on which channel, today". Sources: TechTarget; [Inference] for the mapping.
8. **Don't copy.** A proprietary rule language, and a developer certification ecosystem.
9. **Relationship.** *Teacher* (case plus decisioning). Not present in the founder's segment.

### Appian

> Source: [general-references/26-process-and-automation-giants.md § Appian](../../general-references/26-process-and-automation-giants.md#appian)

1. **In one paragraph.** A low-code process automation platform (Nasdaq: APPN, 25 years old) sold to government, financial services, insurance and life sciences for case-heavy processes such as claims ([Fact] https://www.aap.com.au/aapreleases/cision20260512ae54260/, 13 May 2026).
2. **Function catalogue (May 2026).** **Data fabric** with a unified metadata model that gives agents context on how data is structured and linked across systems, and read-write access for third-party agents (enhanced). **MCP integration** for Appian agents (announced). **Agent performance tracking and memory** across processes. **AI objective guidance** (soon). A **Snowflake** partnership via MCP. **AI-assisted spec-driven development**, which extracts specifications from legacy apps. **Developer MCP servers** (build Appian apps from Claude Code or Kiro). **Appian Composer** (coming) ([Fact] same). Long-standing products [Unverified in this round]: process modeller, records, case management, RPA, document AI, and Process HQ (mining).
3. **Underneath.** The data fabric is a virtual layer: "records" over external systems with relationships, row-level security and sync. It is a lightweight ontology [Unverified details; the metadata model is confirmed].
4. **Commercials.** Not read [Unverified]. Customer: Global Excel Management (claims) ([Fact]).
7. **Copy.** A virtual data layer: model objects over the customer's systems with row-level security, without forcing a full copy (data fabric metadata model).
9. **Relationship.** *Teacher*. Enterprise-only.

### Camunda

> Source: [general-references/26-process-and-automation-giants.md § Camunda](../../general-references/26-process-and-automation-giants.md#camunda)

1. **In one paragraph.** An open-core BPMN/DMN process orchestration engine (Zeebe in Camunda 8), bought by engineering teams at banks, insurers and telcos who code their processes. Since version 8.7 (April 2025) it has sold "agentic orchestration" ([Fact] https://camunda.com/blog/2025/04/camunda-87-agentic-orchestration-for-enterprise/, title only).
2. **Function catalogue.** BPMN modeller and engine, DMN decision engine, Tasklist (human tasks), Operate (instance monitoring and incidents), Optimize (analytics), connectors, and the **AI Agent connector** (Anthropic, Bedrock, Gemini, OpenAI). The **ad-hoc sub-process** works as a governed toolbox. There is an **MCP Client connector** (early access) and a vector database connector ([Fact] https://docs.camunda.io/docs/8.8/components/agentic-orchestration/ai-agents). Enterprise-grade agentic features were announced in October 2025 ([Fact] title https://camunda.com/blog/2025/10/enterprise-grade-agentic-automation-is-here/).
3. **Underneath (the cleanest published agent design in this set).** Camunda defines an agent as an LLM-driven loop with shared memory across iterations. The tools are the BPMN activities inside an ad-hoc sub-process. The LLM picks which tool to call, in what order and with which parameters, but only from the allowed elements. Camunda executes the chosen activity, stores variables, applies retries and incident handling, and routes human tasks and events. Short-term conversational memory is kept for each process instance ([Fact] same page).
4. **Commercials.** Not read [Unverified].
7. **Copy.** (a) Tools = activities in a bounded set; the engine, not the model, owns retries, incidents and human-task routing. (b) Memory scoped to a process instance (for the founder, one collections case). Source: Camunda AI agents page.
8. **Don't copy.** BPMN authoring as the customer's job in version one; mid-sized finance teams will not draw BPMN [Inference].
9. **Relationship.** *Teacher*. A possible *embedded engine* later (open-core) [Inference].

### IBM watsonx Orchestrate

> Source: [general-references/26-process-and-automation-giants.md § IBM watsonx Orchestrate](../../general-references/26-process-and-automation-giants.md#ibm-watsonx-orchestrate)

1. **In one paragraph.** IBM's agent builder and orchestrator for enterprises, with a catalogue of domain agents (HR, procurement, sales) and a control plane ([Fact] https://www.ibm.com/products/watsonx-orchestrate/pricing).
2. **Function catalogue.** Agent building and orchestration, chat interface, tools and integrations catalogue, custom tools, workflow and document processing, control plane, evaluation and observability, security and access control, and ready-to-use domain agents (Standard tier). Channels: webchat, voice, Slack, Teams. Third-party agent add-ons: Sparx, Bright Data, Tavily, Symplistic ([Fact] same).
4. **Commercials (published, Nov 2026).** 30-day trial. **Essentials from US$578 a month**: 4,000 MAU, up to 200,000 messages a month, 10 GB of knowledge documents. **Standard from US$6,360 a month**: 40,000 MAU, up to 2,000,000 messages. **Premium** on quote: data isolation, HIPAA-ready. Deploys on IBM Cloud, AWS or on-premises ([Fact] same).
7. **Copy.** Published entry pricing with message and MAU caps. Evaluation and observability included even in the trial.
9. **Relationship.** Possible *competitor* at the top of the founder's range (its entry price fits mid-market budgets) but it has no AR model [Inference].

### Workato

> Source: [general-references/26-process-and-automation-giants.md § Workato](../../general-references/26-process-and-automation-giants.md#workato)

1. **In one paragraph.** An enterprise iPaaS: "recipes" (workflows) across 1,200+ connectors, bought by IT and business-systems teams at mid-to-large companies ([Fact] https://zapier.com/blog/workato-pricing, a competitor's article, Nov 2026).
2. **Function catalogue.** Recipes, connectors, editions Standard, Business MCP, Enterprise MCP and Workato ONE (orchestration, API management, AI). Add-ons: Advanced Security & Governance, Private Link, on-premises agents, OpenLegacy, RobotiQ RPA, extra concurrency ([Fact] same). Genies, Agent Studio and Workbot were not verified in this round [Unverified].
4. **Commercials.** A platform fee plus usage in *tasks*: each action step counts, triggers and control-flow steps do not, each loop iteration counts, and a bulk action counts once. Prices are unpublished. Zapier's author estimates at least mid-six figures a year ([Fact] same; the estimate is biased).
7. **Copy.** A precise billing-unit definition (what counts as one task) published in the docs.
9. **Relationship.** A possible *supplier* of connectors for larger customers; otherwise a competitor for "integration plus agents" budgets [Inference].

### Zapier

> Source: [general-references/26-process-and-automation-giants.md § Zapier](../../general-references/26-process-and-automation-giants.md#zapier)

1. **In one paragraph.** A self-serve automation tool for SMBs and departments, with 10,000+ apps ([Fact] https://zapier.com/blog/zapier-pricing/, 16 Jun 2026).
2. **Function catalogue.** Zaps (multi-step, Paths, Filters, Formatter), Tables, Forms, AI tools, Copilot (all plans), **Zapier MCP** (all plans), Interfaces, Agents and Canvas (not priced in the article). Governance: roles and permissions, SAML SSO (Team), usage analytics and a technical account manager (Enterprise), connection activity logs, SOC 2 Type II and SOC 3 ([Fact] same).
4. **Commercials.** Free (100 tasks a month), Professional US$19.99 a month (750 tasks, annual billing), Team US$69 a month, Enterprise custom ([Fact] same).
5. **Why chosen.** Self-serve, breadth of connectors, price.
7. **Copy.** Free and self-serve entry. Filters and branching do not consume billable units.
8. **Weak.** No business model of the company: every Zap re-encodes the rules [Inference].
9. **Relationship.** *Competitor* for the founder's buyers' "just automate reminders" budget. Its MCP is also a *possible supplier* of long-tail connectors [Inference].

### n8n

> Source: [general-references/26-process-and-automation-giants.md § n8n](../../general-references/26-process-and-automation-giants.md#n8n)

1. **In one paragraph.** A fair-code workflow automation tool with AI-agent nodes, popular with technical teams and self-hosters ([Fact] https://n8n.io/pricing).
2. **Function catalogue.** Workflows, all integrations, AI agent nodes and MCP, AI assistant credits, evaluations (metric-based), environments and Git version control (Business), SSO and LDAP (Business), log streaming (Enterprise), queue mode, custom roles (Enterprise) ([Fact] same).
4. **Commercials (EUR, annual).** Starter €20 a month (2,500 executions, 5 concurrent, maximum 5 minutes per execution, 7-day retention). Pro €50 (10,000 executions, maximum 40 minutes, 30-day retention). Business €667 (40,000 executions, self-hosted only). Enterprise custom (200+ concurrent, unlimited retention). The Community Edition is free to self-host ([Fact] same). n8n bills per *execution* (whole workflow run), not per step ([Fact] same).
7. **Copy.** Per-run billing. Built-in evaluations tied to workflows. Execution retention as a plan lever.
9. **Relationship.** *Competitor* for technical mid-market buyers. A possible *internal tool* for the founder's own connectors (licence terms permitting) [Inference].

### Make

> Source: [general-references/26-process-and-automation-giants.md § Make](../../general-references/26-process-and-automation-giants.md#make)

1. **In one paragraph.** A visual scenario builder (formerly Integromat, owned by Celonis since 2020 [Unverified in this round]) for SMBs.
2. **Function catalogue.** Scenarios, routers, **error handlers (Rollback, Break, Resume, Commit, Ignore)**, data stores, webhooks, AI agents and the Maia assistant (not detailed), Enterprise Apps (Workday, ServiceNow), and a platform API with 300+ endpoints ([Fact] https://www.make.com/en/pricing).
4. **Commercials.** Credits: most actions cost 1, and AI features may cost more. Error handlers and routers are free. Free plan 1,000 credits a month. Core, Pro, Teams and Enterprise prices are not shown on the page. Start-up plan: 50% off for organisations under 20 staff. Per 10,000 credits a month: 5 GB transfer and a webhook queue of 667 (maximum 10,000). When credits run out, scenarios stop and webhooks queue ([Fact] same).
7. **Copy.** Named error-handler semantics (rollback, resume, commit, ignore) as first-class workflow elements. Explicit behaviour when the budget is exhausted (queue, don't drop). Source: Make pricing page.
9. **Relationship.** Competitor for simple reminder automation. Note that Celonis's Action Flows feel very like Make [Unverified link].

### Tines

> Source: [general-references/26-process-and-automation-giants.md § Tines](../../general-references/26-process-and-automation-giants.md#tines)

1. **In one paragraph.** Started in security operations; now sells "intelligent workflows" across IT, security, finance, people, RevOps and legal. Customers include Coinbase, Databricks, Reddit and Canva ([Fact] https://www.tines.com/pricing).
2. **Function catalogue.** Workflows, AI agents and Workbench (pages linked, not read), "Govern AI building", flexible hosting, bring-your-own AI model on paid plans ([Fact] same).
4. **Commercials.** Free: unlimited users, 3 live workflows, a one-time US$50 AI allowance. Paid plans on quote ([Fact] same).
7. **Copy.** Bring-your-own model on paid plans; a free tier limited by live workflows rather than users.
9. **Relationship.** Teacher on governed self-build. Minor competitor.

### Microsoft Power Automate with Copilot Studio

> Source: [general-references/26-process-and-automation-giants.md § Microsoft Power Automate with Copilot Studio](../../general-references/26-process-and-automation-giants.md#microsoft-power-automate-with-copilot-studio)

1. **In one paragraph.** Microsoft's low-code automation (cloud flows, desktop RPA) and agent builder, bundled into Microsoft 365 and Power Platform. It reaches every company size through existing Microsoft licences [Inference].
2. **Function catalogue (Copilot Studio billing page, updated 31 Oct 2026).** Classic and generative answers, agent actions, tenant graph grounding, **agent flows**, text and generative AI tools in three tiers, content processing, voice tiers, reasoning models and Computer-Using Agents ([Fact] https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management).
4. **Commercials.** Copilot Credits: classic answer 1, generative answer 2, agent action 5, tenant graph grounding 10, agent flow actions 13 per 100, content processing 8 per page, premium AI tools 10 per 1,000 tokens. Voice costs 10, 35 or 75 credits a minute. Employee-facing use by a user with an M365 Copilot licence is often free. Enforcement starts at 125% of prepaid capacity; blocked agents stop mid-conversation unless pay-as-you-go is linked ([Fact] same). Pack prices are not on that page [Unverified].
7. **Copy.** A published rate card per *agent operation type*. An explicit over-capacity rule (125%) and admin alerts.
8. **Weak.** Credit arithmetic is complex. Stopping agents mid-conversation is hostile for external (customer-facing) agents [Inference].
9. **Relationship.** *The default competitor* for the founder's segment, since many 100 to 1,000 staff firms already pay for Microsoft 365. Also a *channel*: the founder's agent could be reachable from Teams and Copilot via MCP [Inference].

### Automation Anywhere

> Source: [general-references/26-process-and-automation-giants.md § Automation Anywhere](../../general-references/26-process-and-automation-giants.md#automation-anywhere)

1. **In one paragraph.** RPA vendor number two, now marketed as "Agentic Process Automation". Its buyers resemble UiPath's: automation CoEs at large enterprises in financial services, healthcare and BPO [Unverified; the product page failed to load in this round].
2. **Function catalogue** [Unverified, from background knowledge, not read]: Automation Success Platform with a cloud **Control Room** for bot governance, scheduling, credential vault and audit; Bot Creator/Automator; **Document Automation**; **AI Agent Studio**; a "Process Reasoning Engine" for agent planning; Enterprise Knowledge (retrieval); Process Discovery. The G2 comparison page title confirms the product name "Automation Anywhere Agentic Process Automation" ([Fact] search result title https://www.g2.com/compare/automation-anywhere-vs-workato-vs-zapier).
3. to 6. Not verified in this round. The company is private; it was valued at US$6.8B in 2019 [Unverified].
7. **Copy:** the Control Room concept, meaning one console where every bot or agent has an owner, credentials from a vault, a schedule and an audit log [Unverified details].
8. **Don't copy:** UI robots.
9. **Relationship:** distant teacher. Not relevant to the founder's segment.

### What these companies know that agent start-ups are relearning

> Source: [general-references/26-process-and-automation-giants.md § What these companies know that agent start-ups are relearning](../../general-references/26-process-and-automation-giants.md#what-these-companies-know-that-agent-start-ups-are-relearning)

1. **Rules belong outside the prompt.** Maestro and Camunda support DMN. Pega Blueprint mixes deterministic rules with GenAI. Celonis stores filters as named business conditions. All keep eligibility and policy in inspectable tables, with the model choosing only within what the rules allow ([Fact] UiPath Maestro concepts; Camunda AI agents; TechTarget Pega; Celonis KM).
2. **A process model is the agent's boundary.** Camunda's ad-hoc sub-process limits tools to a declared set and gives the engine retries, incidents and human routing ([Fact] Camunda page). UiPath puts agents inside Maestro instances that can be paused, resumed and retried ([Fact]).
3. **Exceptions are the work.** Case management (Maestro Case, Pega, Appian) exists because collections, disputes and claims cannot be fully specified in advance ([Fact] UiPath Q2 FY27 release).
4. **Write-back needs transactions.** Celonis SAP actions use begin and end transaction markers with rollback. Make has commit and rollback handlers ([Fact]).
5. **Audit is retention plus attribution.** Action Flow audit logs are kept for 12 months ([Fact]). Every action needs who, what, why and which rule; ServiceNow's Control Tower and Celonis's Transformation Hub attribute value and cost ([Fact]).
6. **Bot governance means an inventory with owners.** Orchestrator folders, credential stores, canary tenants and audit, plus Control Tower discovery of agents across vendors ([Fact]).
7. **Cost must be metered per operation and visible.** UiPath charges per LLM call by tier, Copilot Studio per operation type, n8n per execution ([Fact]).
8. **Separate design-time from run-time,** and evaluate before production (UiPath pools, n8n evaluations, IBM evaluation in the trial) ([Fact]).
9. **The record of what happened is the evidence for value.** Celonis built its business on measured outcomes from the event log ([Vendor claim]).

### Adopt in version one, later, or never

> Source: [general-references/26-process-and-automation-giants.md § Adopt in version one, later, or never](../../general-references/26-process-and-automation-giants.md#adopt-in-version-one-later-or-never)

| Concept | Decision | Why |
|---|---|---|
| Object-centric event log (every reminder, reply, promise, payment and dispute as an immutable event linked to Customer, Invoice and Case) | **Version one** | It is the audit trail, the per-customer timeline, the KPI source and the evaluation data in one structure. The product generates most events itself, so no mining project is needed [Inference; Celonis OCDM] |
| Semantic layer of KPIs and named conditions (DSO, average days to pay, weighted payment terms, "eligible for reminder") | **Version one** | It copies the Celonis KM and AR KPI lists exactly |
| Decision tables (DMN-style) for dunning policy: days overdue × amount × customer segment × dispute status → action and channel | **Version one**, as simple editable tables, not full DMN | Finance staff can read and approve them; the agent only drafts wording and handles replies [Inference; Maestro and Camunda DMN] |
| Case management (one collections case per customer, or per invoice when disputed, with states, owner, SLA, promise-to-pay, escalation) | **Version one**, minimal | Collections is exception-heavy (Maestro Case, Pega) |
| Human tasks and approval queue (approve first contact to new customers, any message above a threshold, credit changes) | **Version one** | Every incumbent routes human tasks from the engine (Camunda, Maestro, Celonis OE) |
| Governance of automated actions: agent inventory, per-action audit, kill switch, per-customer rate limits on outbound messages, cost meter per run | **Version one** (thin) | External messages carry reputational and legal risk. Copy UiPath's per-run metering and Control Tower's measure-cost idea |
| Transactional write-back with rollback to the accounting system | **Version one for notes and statuses; later for financial postings** | Copies Celonis SAP actions; postings need careful scoping |
| Next-best-action ranking (rules filter, model ranks) | **Later** (after enough outcome events) | Pega CDH; needs data from the event log |
| Full BPMN orchestration canvas | **Later**, or never customer-facing | Mid-sized finance teams will not author BPMN [Inference] |
| Process mining over ERP history (conformance, variants) | **Later**, as an onboarding diagnostic ("your DSO by customer, last 12 months") | High value as a sales tool; Celonis's expensive part |
| Cash application matching | **Later** (second app) | Celonis Cash app functions are a ready spec |
| Prediction or forecast models (pay date, risk) | **Later** | Celonis Prediction Builder and Ikigai show the direction |
| UI-scraping robots (RPA) | **Never** for the target segment | Target systems have APIs; robots are brittle [Inference] |
| Proprietary query or rule language (PQL, Pega rules) | **Never** | Use SQL plus plain decision tables |
| Seven-plan, multi-unit licensing | **Never** | The UiPath and Copilot complexity is a known complaint |

## Design decisions already in the reference maps

### 11. Automations and their limits

> Source: [general-references/30-map-palantir-platform.md § 11. Automations and their limits](../../general-references/30-map-palantir-platform.md#11-automations-and-their-limits)

**Purpose.** "When X happens in the data, do Y", under a durable owner identity and with hard guard rails. *Receivables example:* when an invoice crosses 7 days overdue, run the collections agent to draft a reminder and stage it as a proposal for the assigned collector.

**Design to implement.**
- **Conditions** [Fact 03, 05]:
  - objects added to a set or removed from it (live or scheduled);
  - objects modified (live, optionally limited to chosen properties);
  - run on all objects (scheduled, with batch size and parallelism);
  - threshold crossed (scheduled; built-in logic or a boolean function);
  - time, dataset updated, and combinations.
  - Palantir picks changes up "typically within minutes" [Fact 03].
- **Effects** [Fact 03, 05]: action, function, agent run, notification. Action, function and agent effects can each have a fallback effect. Effects run sequentially or in parallel.
- **Retries** [Fact 03]: per-effect automatic retries for transient errors such as rate limits, plus event retries for persistent errors. Semantics are **at-least-once**, so every effect must be idempotent. The key is `(automation_id, trigger_event_id, effect_index)`, enforced with a unique constraint on the effect-run table [Inference].
- **Limits, copied as numbers** [Fact 05]:

| Limit | Value |
|---|---|
| Scheduled added/removed input | 100,000 objects |
| Run on all objects | 1,000,000 |
| Objects per evaluation (real-time and scheduled per-object) | 10,000 |
| Batch size | ≤1,000 |
| Manual execution set | 5,000,000 |
| Static recipients | 10,000 |
| Maximum queue wait | 45 min, then dropped |
| Maximum run time | 4 h, finished effects kept |

- **Auto-pause on excessive activity.** Palantir gives no threshold [Fact 05]. Choose: pause if more than 10× the trailing 7-day hourly median of effect runs, or more than 1,000 customer-facing messages in an hour [Inference].
- **Identity** [Fact 03, 04]: conditions are evaluated with the owner's permissions, and action, function and agent effects run as the owner. Notifications render under each recipient's permissions. An automation can be owned by an app's service user, so it survives staff turnover. **Version 1 requires a service-principal owner for every automation** [Inference]. The pro-code agent page says agents run "as the triggering user or the automation's service user", which conflicts with the Automate pages [Fact 03, unresolved].
- **Documentation fields required on save** [Fact 05 guidance]: purpose, data scope, execution identity, impact, recovery path. Consequential writes are staged as proposals by default [Fact 03, 05].
- **Implementation** [Inference]: an edit-event table written in the same transaction as each action commit (transactional outbox), a scheduler, and a worker pool using Postgres `SKIP LOCKED`.

**Copies.**
- Document 05, A11 "Automate": condition kinds, effects, limits table, guidance. https://www.palantir.com/docs/foundry/automate/limits/ , https://www.palantir.com/docs/foundry/automate/overview/
- Document 03, §14: object conditions, fallback effects, retries, at-least-once, identity, proposals. https://www.palantir.com/docs/foundry/automate/condition-objects/ , https://www.palantir.com/docs/foundry/automate/effects/ , https://www.palantir.com/docs/foundry/automate/security/
- Document 04, §20: owner identity and recipient rendering. https://palantir.com/docs/foundry/automate/permissions/

**Left out, and why.**
- Streaming conditions.
- "Metric changed" conditions, which Palantir is retiring [Fact 03].
- Branch-aware automations: version 2.

**Open questions.**
- Retry counts and backoff were on Automate sub-pages that were not read [Unverified 03, 05].

---

### 12. Event-driven workflows calling governed agents

> Source: [general-references/35-map-market-and-competitors.md § 12. Event-driven workflows calling governed agents](../../general-references/35-map-market-and-competitors.md#12-event-driven-workflows-calling-governed-agents)

**Purpose.** Run the process in a deterministic engine that reacts to events and calls agents as one kind of step, alongside code steps and human tasks, so agents never own the process. Example: event MessageReceived on an open case starts the "inbound reply" workflow: classify (agent), evaluate decision table (code), draft (agent), approve (human task), send (locked function).

**Design to implement.**
- Two concepts, kept separate (Sidetrade Agent Builder Studio):
  - **Agent**: a reusable, individually governed worker with `id`, `name`, `owner_user_id`, `version`, `model_policy`, `allowed_tools` (bounded set), `kpi_id` (section 14), `status`. Built once, reused across workflows.
  - **Workflow**: an event-driven graph with branching and conditional logic whose nodes are `code`, `agent`, `human_task`, `wait` (timer or event) and `decision_table`.
- Triggers fire on **newly matching** items only (Celonis triggers), via the event log: each trigger stores a cursor of the last event id processed.
- The agent is an LLM loop over a bounded tool set; the engine, not the model, owns retries, incidents, timeouts and human-task routing (Camunda ad-hoc sub-process).
- Durable execution: workflow state persisted in PostgreSQL; document 27 notes file 14 recommends DBOS for one person, Temporal as the alternative [Inference: choose one; out of scope here].
- Limits (copy Celonis Action Flow limits as defaults): 60 minutes maximum per execution; queue of up to 10,000 pending executions per trigger; minimum schedule interval 1 minute; schedules stored in UTC with tenant time zone applied at evaluation.
- Error semantics as named handlers: `rollback`, `resume`, `commit`, `ignore` (Make).
- Budget exhaustion (model spend cap reached): internal agents pause; external conversations are never cut mid-thread: pending sends queue for humans (Copilot Studio's mid-conversation stop is listed as unacceptable in document 26).
- Cost meter per run and per LLM call by model tier, with design-time tests not billed and kept separate from run-time (UiPath).
- Three orchestration modes surfaced to users: suggested next actions, direct command, saved workflows (Rox).

**Copies.**
- Document 23, "Sidetrade, What to copy": agents versus workflows; event-driven graphs with branching; agents governed individually; health dashboard with cost. https://www.sidetrade.com/core-platform/agent-builder-studio.md
- Document 26, "Camunda, Underneath" and master list item 9: bounded tools; engine owns retries, incidents and human routing. https://docs.camunda.io/docs/8.8/components/agentic-orchestration/ai-agents
- Document 26, "Key findings" item 7: deterministic orchestrator, agents as one task type (Maestro, Camunda, Pega, Celonis OE, ServiceNow). https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions
- Document 26, "Celonis, Actions and their safety": 60-minute cap, 10,000 queue, 1-minute schedules, UTC. https://docs.celonis.com/en/action-flows-terms-and-limitations.html
- Document 26, "Make": named error handlers. https://www.make.com/en/pricing
- Document 26, "UiPath, What to copy" items 1 and 2: per-call metering; design-time separated. https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md
- Document 27, "B1 Rox, What to copy" item 3: three orchestration modes. https://launch.rox.com/product-architecture

**Left out, and why.** Customer-authored BPMN (document 26). UI robots (document 26: never for this segment). Multi-agent "swarms" (Contrary reads Rox as one agent per account under an orchestrator, document 27).

**Open questions.** How many workflow templates ship in version one (reminder sequence, inbound reply, promise evaluation, cash match, daily case rebuild is a minimum [Inference]).

## Open-source implementations (added 28 Nov 2026)

- [trigger-dev](../../open-source-references/trigger-dev.md) durable cron (Apache-2.0); DBOS `workflow_schedules` and pg-boss `schedule` tables ([durable-execution](durable-execution.md#implementation-starting-points-from-source-code)).

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **New — Automate limits:** 10,000 recipients per automation; 10,000 objects per evaluation for real-time execution (first 10,000 events processed or error); 10,000 per evaluation for scheduled per-object execution (runtime error, nothing processed). Source: https://palantir.com/docs/foundry/automate/limits/
- **New** — AI FDE gained tools to configure Automate (27 Aug 2026). Source: https://www.palantir.com/docs/foundry/announcements/2026-08

## Gaps

- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
