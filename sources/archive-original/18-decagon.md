# Decagon: full product catalogue, mechanics, commercials and lessons

Scope note (written 21 November 2026). This is a single-company deep dive on Decagon, the San Francisco AI customer-experience agent company. It goes beyond the Decagon section of `12-agent-companies.md`, which covered AOPs at headline level, Duet Autopilot, the deployment team and Sacra's pricing note. Here I go through Decagon's product navigation, its public learning modules ("Decagon University"), its product and engineering blog through 13 November 2026, three funding and analyst sources, a competitor's pricing teardown and one founder talk. Important limit: Decagon's real documentation at `docs.decagon.ai` is behind a login (I tried; it returns a sign-in page), so exact AOP syntax, node schema, API shapes and role definitions are not public. What I give below is what Decagon's public pages, learning modules and blog posts say, which is more than the earlier document but still short of a spec. The shared web-fetch budget ran out twice during the work (proxy rate limit, then the target's hourly limit), so some pages listed in "Open questions" were not opened. Labels: [Fact] checked on a primary page; [Vendor claim] Decagon says it; [Analyst] Sacra or similar; [Competitor claim] Intercom/Fin says it; [Inference] my reasoning; [Unverified] not found or not opened.

The founder's product, for context: a system holding a company's model (objects, metric definitions, rules, permissions, actions) that agents work through; first job is receivables and collections for 100 to 1,000-staff companies, with an internal face (finance reports, questions) and an external face (payment reminders by email and messaging); models are rented.

## Key findings

1. **Decagon's whole product is one loop around one artifact.** The artifact is the Agent Operating Procedure (AOP): natural-language steps plus code-backed tools, entry conditions, conditional "content blocks", references and customer metadata. Everything else (Trace View, Watchtower, Simulations, Experiments, Versions, Duet) exists to write, inspect, test, compare, ship or rewrite AOPs. Their own published loop is: flag in Watchtower, diagnose in Trace View, edit the AOP in natural language, validate with replays and simulations, deploy with versioning. [Vendor claim] https://decagon.ai/blog/decagon-trace-view ; https://decagon.ai/modules/aops
2. **Runtime routing is simple and re-run on every message.** For each customer message the agent extracts intent using full history, selects a matching AOP, and if none matches falls back to RAG over the knowledge base. Because it re-runs per message, mid-conversation topic switches are handled. A separate supervisor model watches live conversations for safety; "escalation intents" route high-risk topics. [Vendor claim] https://decagon.ai/modules/decagon-platform
3. **Knowledge answers and actions are split by design.** Informational questions go to RAG over help centre, internal docs and ticket sources; anything that changes state (update address, dispute a charge) goes through an AOP. Short internal "snippets" hold launch notes and known issues that should not be public. [Vendor claim] https://decagon.ai/modules/knowledge-base
4. **Change control is Git, not a settings page.** AOPs, tools and guidelines are versioned commits, editable in the console or GitHub; versions live in "gated workspaces" mapped to Git branches; optional branch protection, diffs, staging environments, alerts; every change auditable. New versions can take a randomized traffic split and are reported per version. [Vendor claim] https://decagon.ai/modules/versions ; https://decagon.ai/product/aop
5. **Experiments live inside the procedure.** Experiment Hub (22 Oct 2026) puts an "experiment block" inside an AOP step holding up to 20 variants against a shared control, sized up front, ramped gradually, auto-stopped if a variant is significantly worse, with 20+ metrics (resolution, CSAT, NPS, latency, turn count, cost per conversation). A conversation keeps its variant even if a new agent version publishes mid-test, and only conversations that reached the tested step count. [Vendor claim] https://decagon.ai/blog/experiment-hub
6. **QA is natural-language rules over 100% of traffic, tested on a sample first.** Watchtower jobs are written in plain language ("mentions of frustration"), filtered by channel, CSAT, metadata, resolution status, run once on history or continuously, scored with multi-field rubrics, and grouped into categories. "Test Watchtower" runs a job on a small sample before scaling; authors are told to write positive and negative examples. [Vendor claim] https://decagon.ai/modules/watchtower-qa ; https://decagon.ai/product/watchtower
7. **The improvement agent (Duet) has two modes and always ends in a human merge.** Copilot: you ask. Autopilot: it reads scheduled reports, turns opportunities into AOP edits, runs a full test cycle, and stages changes in a versioned workspace for approval. Duet also generates AOPs from transcripts (one builder: 25,000 transcripts) or SOP documents, and Duet Apprentice (Oct 2026) learns from internal docs and expert-handled escalations and sits in Slack/Teams. [Vendor claim] https://decagon.ai/modules/duet ; https://decagon.ai/blog/dialogues-2026
8. **Decagon already sells collections.** On 29 Oct 2026 it published a payments/collections offer: proactive reminders, at-risk check-ins, calls timed to stated paydays, SMS payment links, in-call payment, payment plans and hardship offers, a "Campaign Composer" for channels, local calling hours, retry cadence and contact caps, and FDCPA, TCPA, UDAAP and Reg F (including 7-in-7) "enforced natively". One unnamed UK brand: 24% higher revenue recovery. "Agent Modules" (Oct 2026) name collections as a target journey. This makes Decagon a direct reference design and a potential competitor at the enterprise end. [Vendor claim] https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution ; https://decagon.ai/blog/dialogues-2026
9. **Long-running work is modelled as a case record plus memory, re-read before every step.** Missions (12 Nov 2026): plain-language goal, named personas to engage, optional guidance, no fixed steps; state lives in a "Mission case" that the agent re-checks with Memory before each action, so it adapts if the customer acted on their own; built as an AOP; can wait days or weeks on third parties; can use Browser Actions to fill back-office forms. [Vendor claim] https://decagon.ai/blog/missions
10. **Voice is where Decagon now trains models.** Voice 3 (1 Oct 2026) is "duplex": a fast conversational model talks while a stronger model reasons, calls tools and enforces guardrails. Alto (11 Nov 2026), the conversational layer, started from a small open-weight model, was fine-tuned on simulated calls and RL-trained, tested on 90M+ simulated calls and in shadow mode; about 700 ms average response; +5 points resolution. Chord (speech model) is credited with up to +7 points. Text reasoning still uses third-party frontier models. [Vendor claim] https://decagon.ai/blog/introducing-alto ; https://decagon.ai/blog/voice-3 ; https://sacra.com/c/decagon/
11. **Commercials: big tickets, two meters.** Sacra estimates $100M annualized revenue in July 2026, up from $44M at end-2025; ~$481M raised; $4.5B valuation (Series D $250M, 27 Jan 2026). Pricing is per conversation (more common) or per resolution (higher rate, escalations free). Intercom's teardown (8 Jun 2026) reports a ~$50K annual platform fee, a Vendr median contract of ~$386K (range $95K to $590K+), and no trial or self-serve. [Analyst/Competitor claim] https://sacra.com/c/decagon/ ; https://fin.ai/learn/decagon-ai-pricing
12. **Delivery is a paired human team.** Agent Product Managers own the relationship and transformation; Agent Deployment Engineers own instructions, tools, tests, debugging and post-launch tuning, and feed patterns back as reusable architectures. The CEO's go-live advice: pick one surface area, go live with about 10% of customers, ramp. [Vendor claim] https://decagon.ai/blog/agent-deployment-engineering ; https://saastr.com/from-zero-to-eight-figures-in-18-months-decagon-ceos-playbook-for-ai-native-saas-growth-and-why-they-partnered-with-accel/
13. **A new channel: customers' own AI agents.** Personal Agent Gateway (Oct 2026) detects personal agents (even unannounced ones), gives them a dedicated channel with business policies and customer-granted permissions, and publishes a protocol (PACT) so they can identify themselves and show what the customer authorised. Hertz uses it with the Muse agent (13 Nov 2026). [Vendor claim] https://decagon.ai/blog/dialogues-2026 ; https://decagon.ai/blog

## Breakdown

### 1. What Decagon is, in one paragraph

Decagon sells an AI agent platform that answers and acts on customer contacts over chat, email, voice, SMS/WhatsApp and now customers' own AI agents, built around plain-language procedures. Buyers are heads of customer experience, CX operations and support (for example Chime's COO and a ClassPass "Director, CX Operations Strategy and AI"), at large consumer and fintech brands: Chime, Duolingo, Notion, Rippling, Affirm, Block/Cash App/Square, Avis Budget, Hertz, Deutsche Telekom, Mercado Libre, Oura, American Airlines, Ticketmaster, Figma, Dropbox. [Vendor claim] https://decagon.ai/product/integrations ; https://decagon.ai/blog/series-d-announcement. Sacra describes the base as F100 airlines, banks, telecom and retail plus high-growth tech. [Analyst] https://sacra.com/c/decagon/. The job: resolve the bulk of inbound volume end to end, including authenticated actions (card replacement, deposit status, refunds), and increasingly run outbound journeys (collections, lead follow-up, onboarding). The result paid for: fewer human contacts at equal or higher satisfaction. Chime: 70% resolution across chat and voice, support costs down 60%, 1M+ voice calls a month. [Vendor claim] https://decagon.ai/case-studies/chime

### 2. Function catalogue (grouped as Decagon groups it)

Decagon's navigation groups product as Channels; Duet; Build (AOPs, Integrations, Missions); Optimize (Experiments, Testing & QA); Scale (Insights & reporting, Watchtower, Suggestions). [Fact] https://decagon.ai/blog (site navigation). I keep that grouping and add the runtime, voice-model, admin and deployment pieces that sit outside the nav.

#### 2.1 Channels

| Function | What it does for the customer | Status / date |
|---|---|---|
| Chat | Web/app widget with brand colours, avatar, header; static or metadata-driven welcome message (by language, role, product line). Live-chat escalation into Zendesk Sunshine and Salesforce. | GA. https://decagon.ai/modules/customizations ; https://decagon.ai/product/integrations |
| Email | Configurable greetings, signatures, footers; default values when customer data is missing; built-in language detection; routing and human handoff via Zendesk and Intercom. | GA. Same sources |
| Voice (Decagon Voice) | Inbound and outbound phone agent; 70+ languages with automatic detection and mid-call switching; hundreds of voices including custom; tune speed, stability, tone, background effects; interruption handling; talks while working with progress updates; transfers with summary; Amazon Connect, RingCentral, SIP trunking, call forwarding. | GA. Voice 2.0 Sep 2025 (65% latency cut, per Sacra); Voice 3 1 Oct 2026. https://decagon.ai/product/voice ; https://decagon.ai/blog/voice-3 ; https://sacra.com/c/decagon/ |
| Outbound Voice | AOP-defined outbound call logic; handles callbacks, voicemail and robocall screeners; captures intent and outcome for next-best-action. | Spring 2026 release (exact date not given). https://decagon.ai/proactive-agents |
| SMS and WhatsApp | Named alongside voice in collections outreach; SMS used for payment links. | Mentioned 29 Oct 2026; no standalone product page found. https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution |
| Decagon dialer | Own outbound dialer, or works alongside the customer's dialer. | Mentioned 29 Oct 2026. Same source |
| Personal Agent Gateway | Detects consumer AI agents (named: Instinct, Muse, dots), including unannounced ones; dedicated channel; business-set policies; customer-defined permissions; discovery and identity protocol (PACT, 6 Oct 2026). | Protocol spec "available now"; provider work ongoing (Oct 2026). Hertz/Muse live 13 Nov 2026. https://decagon.ai/blog/dialogues-2026 ; https://decagon.ai/blog |
| Decagon Assist | Copilot for human agents: auto summaries, suggested replies, in-tool actions, live transcription, analytics hub; on voice provides summaries, knowledge and live guidance after warm handoff. | GA (no date). https://decagon.ai/product/voice ; payments post above |

#### 2.2 Duet (the AI builder and improver)

| Function | What it does | Status / date |
|---|---|---|
| Duet Copilot | Ask Duet to answer questions or act: draft AOPs, build simulations, analyse a conversation's logs (AOP selection, tool calls, model responses), explain and suggest fixes. | GA. https://decagon.ai/modules/duet ; https://decagon.ai/modules/debugging |
| AOP generation (formerly AOP Copilot) | Generates a production AOP from a prompt, an SOP, or a rough idea; knows the library of step types and how they connect; checks structural soundness before production; applies Decagon's writing standards. | AOP Copilot blog 23 Sep 2025, now folded into Duet. https://decagon.ai/resources/aop-copilot |
| Transcript-to-AOP | Drafts happy paths and edge cases from past conversations; one builder generated a full AOP set from 25,000 transcripts. | GA. https://decagon.ai/modules/duet |
| Duet Autopilot | Background mode: reads scheduled reports, turns opportunities into AOP edits, tests against the source conversation plus an auto-maintained golden set, stages in a versioned workspace with diffs for approval; teams can declare off-limits procedures; configured in the Duet toolbar under "Vault and Autopilot". | Launched 9 Jun 2026; validated in live experiments per 5 Nov 2026 post (not opened). https://decagon.ai/blog/autopilot ; https://decagon.ai/modules/duet |
| Duet artifacts | Any output saved as a shareable artifact (e.g. "hillclimbing report": executive summary, dashboard, next steps), schedulable (weekly hillclimbing, monthly guardrails audit). | GA. https://decagon.ai/modules/duet |
| Duet Apprentice | Learns the business from internal resources and expert-handled escalations; drafts AOPs, runs simulations; Slack and Teams plugins follow discussions, draft AOP updates when tagged, ask clarifying questions; data stays in the customer's workspace. | Announced Oct 2026, availability not stated. https://decagon.ai/blog/dialogues-2026 |
| DuetBench / DuetBench-2 | Decagon's own benchmarks for self-improving CX agents. | 9 Jun and 9 Sep 2026 (titles only, not opened). https://decagon.ai/blog |

#### 2.3 Build

| Function | What it does | Status / date |
|---|---|---|
| AOPs | Plain-language procedures backed by code: name, entry conditions, natural-language steps, content blocks for conditional logic, references, tools, customer metadata. Inbound and outbound. Git versioning, full code ownership for technical teams. | GA; "AOP v2" in docs paths (date unknown). https://decagon.ai/modules/aops ; https://decagon.ai/product/aop |
| Guidelines (brand voice) | Global rules for tone, escalation behaviour and language patterns across chat, email, voice; import existing brand voice guides and glossaries. Versioned with AOPs and tools. | GA. https://decagon.ai/modules/customizations ; https://decagon.ai/modules/versions |
| Guardrails | Rules for brand voice, escalations and hallucinations across channels; supervisor model watches live conversations; escalation intents route high-risk topics. | GA. https://decagon.ai/product/aop ; https://decagon.ai/modules/decagon-platform |
| Tools | Custom logic run in real time: API calls, data lookups, calculations. | GA. https://decagon.ai/modules/aops |
| Integrations | Salesforce, Intercom, Zendesk (tickets, customer data); Confluence, Contentful, Kustomer (knowledge sync); Amazon Connect, RingCentral, SIP (voice); MCP for "open connectivity"; self-serve APIs and custom tools. | GA. https://decagon.ai/product/integrations |
| Partner data integrations | Databricks (enterprise context into conversations, 30 Sep 2026); Plaid (financial experiences, 28 Sep 2026). | Announced; posts not opened. https://decagon.ai/blog |
| Knowledge base and snippets | Syncs help centres, internal docs, ticketing systems automatically; RAG for informational questions; snippets for internal, non-public context. | GA. https://decagon.ai/modules/knowledge-base |
| User Memory | Conversation history across sessions and channels; proactive recommendations from customer signals; granular control over what is stored and how it is used; data portability. | Spring 2026 release. https://decagon.ai/proactive-agents |
| Missions | Long-horizon outcomes over days to months: goal, personas, guidance, Mission case record, Memory, Browser Actions; built as an AOP. | Launched 12 Nov 2026. https://decagon.ai/blog/missions |
| Agent Modules | Packaged foundation for journeys beyond support (lead qualification, onboarding, collections) by industry; shared management layer with per-team access controls and admin-wide visibility; cross-channel memory. | Announced Oct 2026; availability not stated. https://decagon.ai/blog/dialogues-2026 |
| Campaign Composer | One place to manage outreach campaigns: channels, local calling hours, retry cadence, contact limits, without engineering. | Mentioned 29 Oct 2026. https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution |
| Browser Actions | Agent completes back-office work in a browser (e.g. a payer-portal form). | Mentioned 12 Nov 2026. https://decagon.ai/blog/missions |
| Agent-detection | Recognising when the counterparty is another agent. | Blog 10 Nov 2026 (not opened). https://decagon.ai/blog |

#### 2.4 Optimize

| Function | What it does | Status / date |
|---|---|---|
| Message Replays | Unit-style test of a specific agent response; replay a turn against updated logic. | GA. https://decagon.ai/modules/testing ; https://decagon.ai/blog/decagon-trace-view |
| Simulations | AI personas hold full conversations; checkpoints confirm the right actions, data and tools at the right moments; an evaluation model gives a rationale for each pass/fail; Duet auto-generates tests; stale tests auto-detected, updated or removed; scheduled recurring runs; CI/CD runs every version; alerts to PagerDuty when metrics leave a range. | GA. https://decagon.ai/product/testing-qa |
| Conversation-to-test | Turn an investigated conversation into a test case; run the scenario multiple times to check consistency. | GA. https://decagon.ai/blog/decagon-trace-view |
| Experiments / Experiment Hub | Experiment blocks inside AOPs, up to 20 variants vs shared control, simulation pre-check against golden set, sizing, ramp, alerts, auto-stop, 20+ metrics, one-click winner publish; concurrent experiments without overlap. | Experiments GA; Experiment Hub 22 Oct 2026. https://decagon.ai/product/experiments ; https://decagon.ai/blog/experiment-hub |
| Version traffic split | Randomized split between current and new agent version, per-version reporting, roll forward or back. | GA. https://decagon.ai/modules/versions |

#### 2.5 Scale

| Function | What it does | Status / date |
|---|---|---|
| Insights & reporting | Dashboards for deflection, CSAT, escalation trends; heat maps and journey flows; QA resolution status; knowledge effectiveness; voice-specific analytics; deflection per AOP; how customers move through each workflow. | GA. https://decagon.ai/modules/insights-reports |
| Tags | Custom insight tags; automatic intent-based tags. | GA. Same |
| Topic discovery (Voice of the Customer) | Organises conversations into topics and themes, frequency and trend, surfaces spikes (e.g. after a launch). | GA. Same |
| Ask AI | Natural-language questions over conversations; applies filters; returns summary, chart, links to source conversations. | GA. Same |
| Watchtower | Always-on QA across AI and human conversations: natural-language flag criteria, filters, historical or continuous, rubric scoring with points and averages, categories/clusters, dashboards, drill-down to transcript, templates, Test Watchtower on a sample. | GA. https://decagon.ai/product/watchtower ; https://decagon.ai/modules/watchtower-qa |
| Suggestions | Finds where the agent lacked context and escalated; ranks gaps by conversations affected; summarises each gap; drafts help-centre articles from how the best human agents resolved the same issue; grouped by topic; CSV export; monthly by default, on demand. | GA. https://decagon.ai/product/suggestions ; https://decagon.ai/modules/knowledge-base |

#### 2.6 Debugging and observability

| Function | What it does | Status / date |
|---|---|---|
| Audit Logs | Shows whether the correct AOP ran and whether tool calls errored; used to catch, e.g., refund tool called but no refund issued. | GA. https://decagon.ai/modules/debugging ; https://decagon.ai/modules/watchtower-qa |
| Trace View | Each turn as a "miniature workflow": LLM calls, retrieval, condition checks, tool calls, safety checks; per AOP step shows inputs, reasoning, outputs and transition; shows what instructions the model received and how it responded; latency for every micro-step; AOP switches. | Blog 12 Dec 2025. https://decagon.ai/blog/decagon-trace-view |
| Agent Workbench | Chat assistant over audit logs, reasoning and tool errors; explains why an AOP node ran as it did and where latency started; suggests fixes to AOP configuration, conditions, knowledge gaps, hallucinations; sample prompts; shareable investigations. | 9 Mar 2026. https://decagon.ai/blog/agent-workbench |
| Reasoning timeline in console | Explanation of agent reasoning at any point with runtime and latency (e.g. "Called: Create carousel"). | GA. https://decagon.ai/product/aop |

#### 2.7 Models (Decagon Labs)

| Function | What it does | Status / date |
|---|---|---|
| Decagon Labs | In-house research group. | 24 Mar 2026. https://decagon.ai/blog |
| Chord | Speech model post-trained on CX conversations; per-phrase pacing; pronunciation of business terms; licensed data and consented voice talent, no customer data; ~90% of blind-test listeners could not tell it from a human (sample size not given); up to +7 points resolution. | 1 Oct 2026. https://decagon.ai/blog/voice-3 ; https://decagon.ai/blog/introducing-alto |
| Alto | Conversational layer of duplex voice; decides answer now vs wait for the reasoning model; ~700 ms average response; +5 points resolution. | 11 Nov 2026. https://decagon.ai/blog/introducing-alto |
| GEPA-GAN, TTS RL, speaker-change detection, GPU-efficient serving (4.7x) | Research and infrastructure posts. | Aug to Sep 2026 (titles only). https://decagon.ai/blog |

#### 2.8 Platform, admin, deployment and learning

| Function | What it does | Status / date |
|---|---|---|
| Deployment options | Standard multi-tenant SaaS (most customers, incl. regulated F50s); single-tenant VPC in Decagon's cloud; customer-VPC "cloud-prem" incl. air-gapped; on-prem datacentre for special cases. | Blog 9 Jul 2026. https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires |
| Team access controls | Separate team access controls with admin-wide visibility (in Agent Modules). Branch protections and gated workspaces in Versions. | Oct 2026; detailed role model not public. https://decagon.ai/blog/dialogues-2026 ; https://decagon.ai/modules/versions |
| Decagon University | Public learning modules (about 51 minutes total): Platform 5, Customizations 3, Knowledge base 4, AOPs 7, Debugging 3, Testing 4, Versions 4, Watchtower QA 5, Insights 6, Duet 10. Certifications: "AI CX Specialist" (open) and "AI CX Architect" (customers only). | Live Nov 2026. https://decagon.ai/modules/decagon-platform |
| Partner Community | Partner programme. | 30 Oct 2026 (not opened). https://decagon.ai/blog |
| OpenAI B2B marketplace | Decagon listed as a partner. | 2 Oct 2026 (not opened). https://decagon.ai/blog |

### 3. How it works underneath

#### 3.1 The AOP: what is in one

Plain English: an AOP is the written instruction a supervisor would give a new hire for one kind of request ("replace a lost card"), with the hard parts (look up the account, block the card, order a new one) wired to real system calls. Example in Decagon's own words: return a broken item and ship a replacement to a new address means verify order, confirm policy applies, process return, update address, arrange replacement. [Vendor claim] https://decagon.ai/resources/from-sops-to-agent-operating-procedures

Published components [Vendor claim] https://decagon.ai/modules/aops :
- **Name** (required).
- **Entry conditions**: when the agent should select this AOP. These are what the router matches against extracted intent.
- **Steps** in natural language. Decagon's SOP-conversion guide says each step has a trigger and action, lists the data it needs (customer ID, order number, account status), and that decision points, success criteria and escalation points are explicit; sensitive actions (refunds, account changes) carry explicit validation requirements. https://decagon.ai/resources/from-sops-to-agent-operating-procedures
- **Content blocks** for conditional logic.
- **References** that let the agent act or pull information from external sources.
- **Tools**: custom logic run in real time (API calls, lookups, calculations).
- **Metadata**: customer context such as location, role, product tier.
- **Experiment blocks** (since Oct 2026) holding variants and traffic split. https://decagon.ai/blog/experiment-hub

Docs paths reveal the current form is "AOP v2", whose overview page is titled "overview and nodes", and the Workbench post talks about "why an AOP node executed". So an AOP is now a set of typed nodes (a graph or structured list), not one prompt. [Fact for path names; Inference for the graph] https://decagon.ai/modules/aops ; https://decagon.ai/blog/agent-workbench. The AOP Copilot post confirms a fixed "library of workflow step types" and a structural validator run before production. [Vendor claim] https://decagon.ai/resources/aop-copilot. Trace View says each step shows inputs, reasoning, outputs and a "transition to the next step", which fits a state machine with LLM-chosen transitions. [Vendor claim; Inference] https://decagon.ai/blog/decagon-trace-view

How natural language and code combine: CX teams write steps; engineers add code-level controls for critical operations (refunds, identity checks), guardrails and integrations; language handles messy input, deterministic code executes the critical action. The SOP guide describes AOPs as compiling into "structured logic". [Vendor claim] https://decagon.ai/resources/from-sops-to-agent-operating-procedures ; https://decagon.ai/modules/decagon-platform. Exact syntax (how a tool is referenced in a step, variable notation) is behind the docs login. [Unverified]

#### 3.2 Per-message runtime

[Vendor claim] https://decagon.ai/modules/decagon-platform ; https://decagon.ai/blog/decagon-trace-view ; https://decagon.ai/blog/voice-3
1. Message arrives on a channel (with metadata such as language, role, product tier).
2. Intent extraction over the full history.
3. AOP selection by entry conditions; else RAG over the knowledge base.
4. Within the AOP: model calls, retrieval, condition checks, tool calls and safety checks, each a traced micro-step with latency.
5. Supervisor model monitors the live conversation; escalation intents route high-risk topics to humans; guidelines shape tone.
6. Repeat on next message (so the agent can switch AOPs; Trace View records "AOP switches").
7. After the conversation: Watchtower jobs, tags, topic clustering, Suggestions, Duet reports.

Voice adds the duplex split: a low-latency conversational model (Alto) handles listening and speaking and decides whether to answer or wait, while a stronger model handles reasoning, tools and guardrails, and Alto waits for confirmation before telling a caller an action is done. [Vendor claim] https://decagon.ai/blog/introducing-alto

#### 3.3 Models and orchestration

Sacra: a mix of OpenAI, Anthropic and Cohere models plus proprietary fine-tunes. [Analyst] https://sacra.com/c/decagon/. The air-gapped post: a "network of specialized models", frontier models reached by private connectivity and Decagon Labs models self-hosted. [Vendor claim] https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires. CEO in Feb 2025: what matters for text is instruction-following; for voice, latency (5 to 6 seconds is fine in chat, not on a call). [Vendor claim] https://www.amplifypartners.com/barrchives/how-decagon-builds-customer-support-ai-agents-that-really-work. SaaStr write-up: build for model flexibility, own the application layer, not the model. [Vendor claim, paraphrased by Lemkin] https://saastr.com/from-zero-to-eight-figures-in-18-months-decagon-ceos-playbook-for-ai-native-saas-growth-and-why-they-partnered-with-accel/. Alto's training recipe (small open-weight base, SFT on simulated calls built from production data, RL scoring candidates on answer-vs-wait and on policy adherence, varied simulated businesses for generality, 90M+ simulated calls, shadow mode) is the only published model-training detail. [Vendor claim] https://decagon.ai/blog/introducing-alto

#### 3.4 Knowledge capture

Three channels into the agent's "company model" [Vendor claim]:
- Documents: help centre, Confluence, Contentful, Kustomer, ticket history, auto-synced; snippets for internal notes. https://decagon.ai/modules/knowledge-base ; https://decagon.ai/product/integrations
- Procedures: AOPs drafted by Duet from SOPs or transcripts, edited by CX staff; Duet Apprentice learns from internal docs, expert escalations and Slack/Teams threads. https://decagon.ai/modules/duet ; https://decagon.ai/blog/dialogues-2026
- Rules: guidelines (imported brand guides and glossaries), guardrails, escalation intents; code in tools for hard rules. https://decagon.ai/modules/customizations
- Gaps fed back: Suggestions drafts articles from human resolutions of escalated cases, monthly. https://decagon.ai/product/suggestions
- Enterprise data: Databricks partnership (30 Sep 2026) for "enterprise context". [Title only] https://decagon.ai/blog

#### 3.5 Integrations and tool calls

Prebuilt connectors for helpdesk/CRM, knowledge, telephony; MCP; self-serve APIs; custom tools; custom endpoints. "No custom code required" is claimed for integrations, but the SOP guide admits custom databases and legacy systems need engineering. [Vendor claim] https://decagon.ai/product/integrations ; https://decagon.ai/resources/from-sops-to-agent-operating-procedures. In air-gapped deployments every connector to internal auth and data systems is custom and goes through internal approval. https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires. Note Intercom's point that Decagon has no native helpdesk: it sits on Zendesk, Salesforce or Intercom for human queues. [Competitor claim] https://fin.ai/learn/decagon-ai-pricing

#### 3.6 Escalation and handoff

Authors specify in the AOP when to hand off; escalation intents catch high-risk topics globally; guidelines cover escalation behaviour; voice transfers include a concise summary; warm handoffs include history; Decagon Assist supports the human after transfer; chat/email handoff through Zendesk Sunshine, Salesforce, Intercom. Procedures needing emotional intelligence or negotiation are advised to stay human. [Vendor claim] https://decagon.ai/resources/from-sops-to-agent-operating-procedures ; https://decagon.ai/product/voice ; https://decagon.ai/product/integrations. Experiment Hub examples include testing "a clarifying question before transfer". https://decagon.ai/blog/experiment-hub

#### 3.7 Memory and user context

Per-conversation metadata (location, role, tier, language) shapes AOPs and greetings. User Memory (Spring 2026) persists history across sessions and channels with controls on what is stored and how it is used; Missions read Memory (e.g. "no calls after 3pm") before each step. Chime credits cross-channel memory. [Vendor claim] https://decagon.ai/proactive-agents ; https://decagon.ai/blog/missions ; https://decagon.ai/case-studies/chime. Storage model, retention and per-field consent: not public. [Unverified]

#### 3.8 Testing and release

Four test areas recommended: brand/tone, escalation guardrails, knowledge retrieval, AOP logic. Run tests several times because agents are non-deterministic. Replays for small changes; simulations for new AOPs; scheduled regressions; CI/CD on every version; PagerDuty alerts. Release via versions with traffic split and statistical read-out; Experiment Hub inside AOPs. [Vendor claim] https://decagon.ai/modules/testing ; https://decagon.ai/product/testing-qa ; https://decagon.ai/modules/versions

#### 3.9 Security and compliance

The air-gapped post names deployment tiers and says details live on the Trust Center and Security page; I could not open the Security page before the fetch limit hit. [Unverified for certifications] https://www.decagon.ai/security. The collections post claims native enforcement of FDCPA, TCPA, UDAAP, Reg F and state rules, contact caps, opt-out and wrong-party suppression, and sensitive-data redaction, built "to meet the strict requirements of large banks". It does not mention PCI. [Vendor claim] https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution. Duet Apprentice data stays in the customer's workspace and is not used to train models outside it; Chord trained on licensed data and consented voices, not customer data. [Vendor claim] https://decagon.ai/blog/dialogues-2026 ; https://decagon.ai/blog/voice-3

### 4. Commercials

- **Founders:** Jesse Zhang (CEO) and Ashwin Sreenivas; backgrounds Google, Citadel Securities, Palantir; previous startups Lowkey and Helia. Founded August 2023, San Francisco. Offices New York (Jul 2025), London (Nov 2025); expansions to Brazil (15 Sep 2026) and Benelux (21 Sep 2026). [Analyst] https://sacra.com/c/decagon/ ; https://decagon.ai/blog
- **Funding:** Series A $35M (Jul 2024); Series B $65M at $650M (Oct 2024, Bain Capital Ventures); Series C $131M at $1.5B (Jun 2025, Accel and a16z growth); Series D $250M at $4.5B (27 Jan 2026, Coatue and Index; also ChemistryVC, Definition, Starwood; returning a16z, A*, Accel, Avra, BCV, Elad Gil, Forerunner, Ribbit, T.Capital). Employee tender at $4.5B (Mar 2026, 300+ employees eligible). Total ~$481M. Sacra's summary panel shows $350M 2026 funding, which conflicts with its own text. [Analyst; Fact for Series D] https://sacra.com/c/decagon/ ; https://decagon.ai/blog/series-d-announcement
- **Revenue:** ~$44M annualized end-2025; ~$100M July 2026 [Analyst]. CEO talk (published 21 Oct 2025): eight-figure ARR in about 18 months. [Vendor claim via SaaStr] https://sacra.com/c/decagon/ ; https://saastr.com/from-zero-to-eight-figures-in-18-months-decagon-ceos-playbook-for-ai-native-saas-growth-and-why-they-partnered-with-accel/
- **Customers:** 100+ new global enterprise customers in the last fiscal year (Jan 2026). [Vendor claim] https://decagon.ai/blog/series-d-announcement. Total count not published.
- **Team:** about 100 people, almost all in person (talk, 2025); 300+ employees eligible for the Mar 2026 tender. [Vendor claim via SaaStr; Analyst]
- **Pricing mechanics:** per conversation (default, fixed rate per inbound conversation, volume discounts) or per resolution (higher rate, only when AI resolves without a human, larger commitments lower the rate). [Analyst] https://sacra.com/c/decagon/. Intercom's teardown: ~$50K/yr platform fee; ~$0.99 per conversation third-party estimate; one negotiated $0.50 per resolution; Vendr median ~$386K/yr, range $95K to $590K+; 10K conversations a month ~$120K to $180K/yr; voice costs more; integrations may add services fees; no trial or sandbox. Decagon's own glossary concedes resolution definitions cause "billing disagreements". [Competitor claim, citing Vendr and unnamed estimates] https://fin.ai/learn/decagon-ai-pricing. ROI framing in the CEO talk: roughly $250K spend for $800K savings. [Paraphrase] SaaStr URL above.
- **Quantified customer results** [Vendor claim] https://decagon.ai/case-studies ; https://decagon.ai/case-studies/chime :

| Customer | Result |
|---|---|
| Chime | 70% chat+voice resolution; support costs -60% (footnoted to Chime's 2025 S-1); 1M+ voice calls/month; sNPS 30; hundreds of thousands of chat messages automated in first two weeks |
| Duolingo | 80% deflection; previous vendor took half a manager's week to maintain |
| ClassPass | 95% cost reduction; deflection 10x higher than expected at launch |
| Tremendous | 90% deflection, 92% CSAT |
| Flashfood | 90%+ resolved automatically |
| Rippling | +32% deflection |
| Valon | 50%+ voice resolution |
| Hunter Douglas | $1M revenue from fully AI-handled conversations |
| Unnamed UK brand (collections) | +24% revenue recovery |
| Alto / Chord (all voice customers) | +5 points and up to +7 points resolution |

### 5. Why customers choose it

1. **Business teams can change the agent themselves, and engineers still own the code.** Duolingo's manager contrasts it with a previous vendor that ate half his week; Chime says CX teams adjust behaviour in natural language while technical teams keep core logic. Coatue's partner cites "control, transparency, and speed". [Vendor claim] https://decagon.ai/product/aop ; https://decagon.ai/case-studies/chime ; https://decagon.ai/blog/series-d-announcement
2. **Measured results in production, sold through incremental rollouts.** Chime ran a vendor evaluation on accuracy, automation rate and sNPS. The CEO's playbook is to start with one surface and ~10% of customers, then ramp, with weekly customer touchpoints. [Vendor claim] https://decagon.ai/case-studies/chime ; SaaStr URL above
3. **One system across chat and voice with shared memory.** Chime calls the single system a strategic advantage because learnings move between channels. [Vendor claim] https://decagon.ai/case-studies/chime
4. **Voice quality.** Duplex architecture and in-house speech models with measured resolution lifts. [Vendor claim] https://decagon.ai/blog/introducing-alto
5. **Enterprise deployment flexibility.** Single-tenant and customer-VPC/air-gapped options for regulated buyers. [Vendor claim] https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires

Complaints and weaknesses (mostly competitor-sourced): opaque pricing, $50K platform floor, no trial or self-serve, no native helpdesk, per-conversation billing charges for failures, long enterprise sales cycle, professional services for complex integrations. [Competitor claim] https://fin.ai/learn/decagon-ai-pricing. I found no independent review set within budget. [Unverified]

### 6. How it deploys

- People: APM (relationship, transformation, launch) plus ADE (instructions, tools, tests against real conversations, debugging, post-launch). [Vendor claim] https://decagon.ai/blog/agent-deployment-engineering
- Starting material: historical transcripts and SOPs fed to Duet to draft AOPs; knowledge sources synced; helpdesk and telephony connected. [Vendor claim] https://decagon.ai/modules/duet
- Validation: simulations and replays; Test Watchtower; staged version with small traffic. [Vendor claim]
- Rollout: one surface area, ~10% of customers, ramp. CEO (Feb 2025) says logic flows can be deployed "in a couple of days"; ADE post says concept to production "within days". No signing-to-live timeline published. Chime automated hundreds of thousands of chat messages in its first two weeks live. [Vendor claim]
- Self-serve: none at purchase (no trial, no sandbox, sales-led). After deployment, much is customer-operated: AOP edits, Watchtower jobs, experiments, Ask AI, Decagon University certifications. [Competitor claim; Vendor claim]
- Air-gapped: longest and most expensive path; custom telephony, self-hosted inference, custom connectors. [Vendor claim]

## What to copy

1. **Procedure object with typed parts.** Store each procedure as: name; entry conditions; ordered natural-language steps; condition blocks; tool references; required data fields per step; success criteria; escalation points; explicit validation on sensitive actions; experiment blocks. Validate structure before publish. For collections: "Overdue 1 to 30 days, friendly reminder" with a hard tool call `create_payment_link(invoice_id)`. https://decagon.ai/modules/aops ; https://decagon.ai/resources/from-sops-to-agent-operating-procedures ; https://decagon.ai/resources/aop-copilot
2. **Per-message router: intent over full history, then procedure by entry condition, else retrieval.** Re-run every message and log switches. https://decagon.ai/modules/decagon-platform
3. **Split informational from state-changing.** Questions go to retrieval over documents; anything that writes (promise to pay, payment plan, dispute) only through a procedure with a typed tool. https://decagon.ai/modules/knowledge-base
4. **Global guidelines and escalation intents separate from procedures.** A small set of always-on rules (tone, "never discuss legal action", "hardship or bereavement routes to a human") plus a supervisor check on every turn. https://decagon.ai/modules/decagon-platform ; https://decagon.ai/modules/customizations
5. **Git-backed versions of procedures, tools and guidelines.** Every change a commit; draft workspaces as branches; optional protection and staging; edit in UI or repo. https://decagon.ai/modules/versions
6. **Trace every turn as micro-steps with inputs, outputs, reasoning and latency.** Make the trace the debugging surface and allow "turn this conversation into a test" and "replay this turn on the new version". https://decagon.ai/blog/decagon-trace-view
7. **Plain-language QA rules over 100% of conversations, tested on a sample first.** Fields: criterion text, positive and negative examples, filters, historical vs continuous, rubric with points, category. For collections: "customer disputes the debt", "agent promised a discount not in policy", "contact outside permitted hours". https://decagon.ai/modules/watchtower-qa
8. **Experiments inside the procedure step, with sticky assignment and step-reached counting.** Shared control, auto-stop on significant harm, metrics including cost per conversation. For collections test reminder wording or send time against promise-to-pay and paid-within-7-days. https://decagon.ai/blog/experiment-hub
9. **Improvement agent that only stages changes.** Read reports, draft edit, test against the source case plus a golden set, stage on a branch, human merges; allow off-limits procedures. https://decagon.ai/modules/duet ; https://decagon.ai/blog/autopilot
10. **Knowledge-gap suggestions from human resolutions.** Monthly: cluster escalations where the agent lacked context, rank by count, draft the fix from how staff resolved it. https://decagon.ai/product/suggestions
11. **Campaign configuration as data, not code.** Channels, local hours, retry cadence, contact caps per campaign, editable by finance ops; enforce caps (e.g. 7-in-7) and opt-out/wrong-party suppression in the engine, not the prompt. https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution
12. **Case record plus memory, re-read before each action.** For a long collections case: goal (invoice paid), personas (AP clerk, CFO), case log of contacts and promises, memory of stated preferences (pay day, preferred channel); before every outreach, re-check the ledger in case they already paid. https://decagon.ai/blog/missions
13. **Schedule follow-ups around what the customer said.** Store "will pay on the 25th" as a dated commitment that drives the next touch. https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution
14. **Draft procedures from existing artefacts.** Import an SOP or a batch of past email threads and generate a first procedure set for human review. https://decagon.ai/resources/aop-copilot ; https://decagon.ai/modules/duet
15. **Short certification-style onboarding for operators.** Ten short modules (about an hour) and a customer-only "architect" certificate make customers self-sufficient. https://decagon.ai/modules/decagon-platform

## What not to copy, and where Decagon is weak

- **Training your own voice and speech models** (Alto, Chord). Out of scope under rented models, and voice is not the founder's first channel. [Inference]
- **The forward-deployed APM+ADE pair per account** at $95K to $590K contracts. A 100 to 1,000-staff buyer will not pay for it. Replace with packaged collections procedures and the improvement agent. [Inference] https://fin.ai/learn/decagon-ai-pricing
- **Platform fee plus per-conversation billing.** It charges for failures and is the main line competitors attack. For collections, an outcome-linked or per-account price is easier to justify, but define the outcome in writing; Decagon's own glossary admits resolution definitions cause disputes. [Competitor claim; Inference]
- **No native system of record.** Decagon sits on top of helpdesks and CRMs; it has no model of objects or metrics, only procedures, knowledge and memory. That is exactly the gap the founder's product fills: Decagon knows "how to handle a refund", not "what our DSO is and which invoices count". [Inference]
- **Opaque docs.** The real spec is behind login, which hampers evaluation and partner ecosystems. Publish yours. [Fact] docs.decagon.ai returned a login page.
- **Metrics are mostly vendor-reported and inconsistent** (deflection vs resolution vs containment across case studies). [Inference]

## Relationship to the founder's product

Primarily a **teacher**; at the enterprise end a **competitor** for collections; potentially a **partner** or **customer** for the data/model layer.
- Teacher: its AOP-plus-loop design is the most completely described operational pattern for agents acting on company rules. [Inference]
- Competitor: it now sells collections with compliance guardrails, Campaign Composer and Agent Modules, but into consumer-facing large enterprises (banks, UK consumer brands) priced from ~$95K. The founder's B2B receivables at 100 to 1,000-staff firms sits below that floor. [Inference]
- Partner/customer: Decagon partnered with Databricks for "enterprise context" and Plaid for financial data, which shows it buys rather than builds the data layer. A company-model layer exposing objects, metrics and permitted actions via MCP is the kind of thing it plugs in. [Inference] https://decagon.ai/blog

## Comparison table (single company: Decagon versus what the founder needs)

| Dimension | Decagon (Nov 2026) | Founder's product |
|---|---|---|
| Core artifact | AOP: NL steps + tools + conditions, Git-versioned | Company model: objects, metrics, rules, permissions, actions; procedures on top |
| Channels | Chat, email, voice, SMS, WhatsApp, personal agents | Email and messaging first; internal Q&A/report face |
| Knowledge | RAG over docs + snippets + memory | Typed objects and metric definitions, plus docs |
| Improvement | Watchtower, Trace, Workbench, Experiments, Duet Autopilot | Copy in reduced form |
| Long-running | Missions (case + memory) | Collections case per account/invoice |
| Compliance | FDCPA/TCPA/Reg F claimed, contact caps | Contact caps and suppression in engine |
| Models | Third-party frontier + own voice models | Rented only |
| Buyer / price | Enterprise CX leader; ~$95K to $590K/yr, ~$50K floor | Finance lead at 100 to 1,000 staff; far lower |
| Deployment | Sales-led, APM+ADE team | Mostly self-serve with templates |

## Open questions and unverified items

- Exact AOP v2 syntax and node types, tool schema, Versions mechanics, roles and permissions: all in docs.decagon.ai behind login.
- Security certifications and data retention: Security page not opened (fetch limit).
- Not opened: PACT spec, Personal Agent guide, agent-recognition post, Autopilot experiments results (5 Nov 2026), DuetBench papers, Databricks and Plaid posts, CX org design post, build-vs-buy post, Decagon's own pricing blog, product overview/chat/email pages, Index Ventures thesis, a16z podcast.
- Revenue is Sacra's estimate; Sacra's funding panel conflicts with its own text.
- Intercom's pricing figures are a competitor's, partly from unnamed third parties.
- No independent user reviews (G2 etc.) read.

## Sources (ranked by usefulness)

1. https://decagon.ai/modules/aops and the other modules (decagon-platform, versions, testing, debugging, watchtower-qa, knowledge-base, customizations, insights-reports, duet), Nov 2026: the most concrete public description of the platform.
2. https://decagon.ai/blog/experiment-hub (22 Oct 2026): experiment blocks, sticky assignment, auto-stop.
3. https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution (29 Oct 2026): Decagon's collections offer.
4. https://decagon.ai/blog/decagon-trace-view (12 Dec 2025): trace structure and the fix loop.
5. https://decagon.ai/blog/missions (12 Nov 2026): long-horizon case model.
6. https://decagon.ai/blog/introducing-alto (11 Nov 2026) and https://decagon.ai/blog/voice-3 (1 Oct 2026): duplex voice, models.
7. https://fin.ai/learn/decagon-ai-pricing (8 Jun 2026): contract sizes and pricing critique (competitor).
8. https://sacra.com/c/decagon/ : funding, revenue estimate, pricing mechanics.
9. https://decagon.ai/product/watchtower , /product/suggestions , /product/testing-qa , /product/experiments , /product/integrations , /product/voice , /product/aop : feature-level claims.
10. https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires (9 Jul 2026): deployment tiers.
11. https://decagon.ai/blog/dialogues-2026 (1 Oct 2026): Personal Agent Gateway, Agent Modules, Duet Apprentice.
12. https://decagon.ai/case-studies and /case-studies/chime : quantified results.
13. https://decagon.ai/blog/agent-workbench (9 Mar 2026) and https://decagon.ai/proactive-agents (Spring 2026): Workbench, memory, outbound voice.
14. https://decagon.ai/resources/from-sops-to-agent-operating-procedures (26 Nov 2025) and /resources/aop-copilot (23 Sep 2025): SOP-to-AOP method.
15. https://decagon.ai/blog/agent-deployment-engineering (12 Aug 2026): deployment roles.
16. https://saastr.com/from-zero-to-eight-figures-in-18-months-decagon-ceos-playbook-for-ai-native-saas-growth-and-why-they-partnered-with-accel/ (21 Oct 2025): go-to-market (paraphrase).
17. https://www.amplifypartners.com/barrchives/how-decagon-builds-customer-support-ai-agents-that-really-work (26 Feb 2025): CEO on logic flows and model needs.
18. https://decagon.ai/blog/series-d-announcement (27 Jan 2026): Series D facts.
19. https://decagon.ai/blog : index of all 2025 to 2026 posts and site navigation.