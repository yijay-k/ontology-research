# Sierra: full function catalogue, mechanics, commercials and lessons

Scope note (written 21 November 2026). This is a single-company document on Sierra (sierra.ai), the customer-facing AI agent company founded by Bret Taylor and Clay Bavor. It extends /home/claude/research/12-agent-companies.md and does not repeat its detail on journeys, simulations, tau-bench code, ADP memory levels or the constellation-of-models internals; where I rely on that file I say "(see 12)". New here: the full product navigation and sitemap as of Nov 2026, Compliance Console, release governance, payments architecture, defence in depth, Context Engine, Horizon product page, Summit 2026 announcements (Curie, Fleming, Tandem Voice, Persona Studio), Personal Agent Protocol 1.0, all five acquisitions, the partner programme, the renamed deployment role (Strategist, Agent Development), the 30 Oct 2026 revenue post, Sacra and Contrary figures, tau-voice, and competitor criticism. Labels: [Fact] checked against a primary page; [Vendor claim] Sierra says it, not independently checked; [Analyst] Sacra or Contrary estimate; [Competitor claim] from a rival's marketing; [Inference] my reasoning; [Unverified] could not find or open. Sierra publishes no public developer documentation, changelog or pricing page: the sitemap lists none (fetched 21 Nov 2026, https://sierra.ai/sitemap). The function catalogue is therefore assembled from product pages and blog posts. Research limits: the shared web-fetch pool ran out partway through; about 33 pages were read. Pages listed but not opened are named in "Open questions".

## Key findings

1. **Sierra's product is now organised in nine named product pages, not "Agent OS 1.0/2.0".** Navigation (Nov 2026): Ghostwriter, Agent Studio, Horizon, Context Engine, Insights, Explorer, Channels, Trust and reliability, plus Agent SDK, Voice, Live Assist, Personal Agents and "Meet your agent" in the sitemap. [Fact] https://sierra.ai/product/agent-studio ; https://sierra.ai/sitemap
2. **Ghostwriter has become the primary interface.** Since 2 Nov 2026 every change is a "session" (a chat thread plus its pending changes) that must be reviewed and merged; sessions can be shared, forked and run in parallel; related agents are grouped in "projects" and released together. Ghostwriter replaced Explorer's assistant, "Sierra Assistant" and other helper agents. [Fact] https://sierra.ai/blog/redesigning-agent-studio-around-ghostwriter
3. **Release governance is a full software-delivery pipeline for agent behaviour** (20 Aug 2026): a linter ("Agent Checks") that catches e.g. a tool named in a prompt but not granted, conflicting instructions, a lookup tool doing an action's job, a response that works on screen but fails on voice, and a sensitive-data lookup with too little authentication; required simulation gates; a Reviewer role with line diffs, comments and request-changes; canary "split traffic" releases; immutable snapshots with instant rollback. [Fact] https://sierra.ai/blog/release-governance-guardrails-for-agents-at-scale
4. **Compliance Console (28 Oct 2026) is the closest published design to what a collections product needs**: per-channel disclosures, contact windows in the recipient's local time (default 8am to 9pm, multiple windows per day), automatic local-holiday holds, frequency caps split between marketing and transactional outreach, opt-outs by STOP or by voice stored and accessible, and dashboards counting outreach allowed, deferred, blocked or held for review. It names late-payment collection as a target use. [Fact] https://sierra.ai/blog/introducing-compliance-console
5. **Horizon (Jul 2026) is the long-running-outcome product**: playbooks that plan toward an outcome over days or weeks, triggers on signals, suppression logic (already in progress, opted out, no longer relevant), consent per customer per channel, "Horizon Advisors" choosing next action (timing, channel, step), and an audit of what triggered each engagement and why anyone was suppressed. It was built with the acquired Takeoff team. [Fact] https://sierra.ai/product/horizon ; https://sierra.ai/blog/sierra-acquires-takeoff ; https://sierra.ai/blog/summit-recap-2026
6. **Payments are architecturally isolated, not prompt-guarded.** Card data flows through dedicated PCI DSS Level 1 infrastructure straight to the customer's processor; the agent receives only status and last four digits; during "secure payment mode" the LLM is out of the loop and prompts follow a server-validated fixed sequence. Supported: card and ACH, autopay, payment plans and instalments (example: a $300 medical bill in three payments), card-on-file updates, receipts in-conversation. [Fact] https://sierra.ai/blog/payments
7. **Four runtime defence layers per message**: retrieval-grounded content, plain-English rules, separate supervisor models (one on input, one on proposed output, able to block, rewrite or nudge), and deterministic guards (e.g. account-modification tools withheld until authentication; output scanning for sensitive data). About half a dozen checks can run per message. [Fact] https://sierra.ai/blog/defense-in-depth-in-the-age-of-agents
8. **Revenue: $400M+ ARR in the week of 30 Oct 2026**, $150M+ added in Q3 2026 alone; $100M to $200M took six months, $200M to $400M five. [Fact] https://sierra.ai/blog/our-customers-ambition-is-accelerating-our-growth. Sacra puts the May 2026 Series E at $950M, $15.8B post-money. [Analyst] https://www.sacra.com/c/sierra
9. **Delivery is people-heavy and Sierra says so.** The customer-facing deployment role is "Strategist, Agent Development" (London listing GBP 150k to 245k), owning the agent lifecycle from scoping to production tuning and defining evaluation metrics improved week over week. [Fact, job post] https://jobs.thrivecap.com/companies/sierra-2-90e5d64d-40bb-415e-bbca-4108552c8ee9/jobs/52580191-strategist-agent-development. A competitor reports deals "often start around $150,000 per year" plus onboarding from about $50,000. [Competitor claim] https://quiq.com/blog/sierra-ai-reviews/
10. **Sierra's stated thesis: "rent the intelligence, own the context."** Customers own the memory layer, which is permissioned, retained on their terms and exportable to their warehouse. [Fact] https://sierra.ai/blog/summit-recap-2026 ; https://sierra.ai/product/context-engine
11. **Sierra now trains its own task models.** Summit 2026 named Curie (the core orchestration loop: choose path, call tools, write reply), Fleming (detects when the caller is another AI agent), and search models Linnaeus and Darwin. [Vendor claim] https://sierra.ai/blog/summit-recap-2026
12. **Personal Agent Protocol 1.0 (Poppy, 13 Nov 2026)** sets how consumer agents (e.g. Meta's Muse) deal with businesses: built on MCP, OpenAPI and Shopify's UCP, OAuth for authentication, customer-controlled permissions, approval before certain actions. 100+ companies are involved. [Fact] https://sierra.ai/blog/releasing-poppy
13. **Five acquisitions in 20 months**: Receptive AI (voice, Mar 2025), Opera Tech (Tokyo, Mar 2026), Fragment (Paris, Apr 2026), Takeoff (long-horizon outcome agents, Jul 2026), Anon (browser agents for sites without APIs, Nov 2026). [Fact] blog URLs in Sources.
14. **Voice is the largest channel and the hardest benchmark.** On tau-voice (May 2026) the best audio-native model scored 67% pass@1 against about 85% for text reasoning models on the same tasks. [Fact] https://sierra.ai/blog/tau-voice-benchmarking-real-time-voice-agents-on-real-world-tasks

## Breakdown

### 1. In one paragraph

Sierra sells branded AI agents that talk to a large company's own customers by phone, chat, SMS, WhatsApp, email and ChatGPT, and take actions in that company's systems (refunds, plan changes, bill payments, appointment booking, loan steps). Buyers are heads of customer experience, contact centre and digital at large consumer-facing companies: half of customers have revenue above $1B and about a quarter above $10B, and Sierra says it works with almost 50% of the Fortune 50, "one in three leading banks" and 80% of Fortune 50 healthcare companies [Vendor claim] https://sierra.ai/blog/summit-recap-2026 ; https://sierra.ai/blog/sierra-acquires-fragment-in-france. Industries: financial services, healthcare, telecom, media, travel and hospitality, retail, technology, services, public sector [Fact] https://sierra.ai/product/agent-studio. The job is to resolve customer contacts without a human, and increasingly to drive revenue and long-running outcomes (a refinanced loan, a paid claim, a retained subscriber). The result they pay for is an agreed outcome, usually a resolved conversation, with unresolved and escalated conversations generally free [Vendor claim] (see 12; https://sierra.ai/blog/outcome-based-pricing-for-ai-agents).

### 2. Function catalogue (grouped as Sierra groups it, Nov 2026)

Status labels: GA unless stated; dates are first public announcement.

**A. Ghostwriter (AI teammate for building and improving agents)** https://sierra.ai/product/ghostwriter
- Build by prompt: describe workflows, integrations, guardrails, tone; "Prompts, not clicks". Inputs: SOPs, raw transcripts, audio interviews with subject-matter experts (25 Mar 2026). [Fact]
- Review before launch: see what it built, approve, ship. [Fact]
- Auto-generated simulations on every build or update; edge-case discovery; failure diagnosis with a proposed next change. [Fact]
- Improve loop: monitors conversations, metrics, releases and experiments, filtered by the customer's goals and guardrails; posts evidence and a proposed step in Slack or Teams; tracks the result after release (teammate mode 28 Sep 2026). [Fact] https://sierra.ai/blog/ghostwriter-ai-tool-to-teammate (see 12)
- Always-on monitoring that flags API outages and metric anomalies; runs and manages A/B tests (Summit, 6 Oct 2026). [Vendor claim] https://sierra.ai/blog/summit-recap-2026
- Sessions, forks, shared sessions, peer review by Ghostwriter, projects (2 Nov 2026). [Fact] https://sierra.ai/blog/redesigning-agent-studio-around-ghostwriter
- Applies Agent Checks fixes in place. [Fact] release-governance post.

**B. Agent Studio (no-code build and manage)** https://sierra.ai/product/agent-studio
- Journeys: agent instructions written step by step or generated from existing SOPs; tools and dynamic data references; Agent Traces showing decisions, tool calls and responses in real time while building. [Fact]
- Knowledge: manage Help Center, FAQ and policy sources; Knowledge gaps (auto-detected missing themes); Expert Answers (drafts articles from how human reps resolved edge cases; Insights 2.0, Nov 2025). [Fact]
- Integrations: 40+ prebuilt connections to knowledge bases, systems of record and contact centres; custom integrations via Sierra's integration framework configured in Studio; agent actions inside journeys or routing to care teams with context. [Fact]
- Simulations: AI-graded conversation sims against defined outcomes; regression suite; Voice Sims (transcription, noise, speaker variation). [Fact]
- Branding and controls: agent name, voice, welcome message, logo, colours; real-time "dynamic updates" (promotions, outages); multimodality (images, video). [Fact]
- Workspaces (Studio 2.0, Nov 2025; Contrary dates launch Dec 2025): private change sets, automatic versioning, numbered snapshots through QA, staging, production. [Vendor claim] (see 12) ; https://research.contrary.com/company/sierra
- Projects: group agents with shared data and channels for joint test and release (2 Nov 2026). [Fact]
- Persona Studio: upload voice samples, tune mannerisms, formality, style without engineering (Summit, 6 Oct 2026). [Vendor claim] https://sierra.ai/blog/summit-recap-2026
- Accelerators: updatable prebuilt packages (greetings, multilingual, name matching, CSAT; retail returns; banking disputes and lending guardrails; healthcare patient auth; telecom retention; insurance FNOL), tracked separately from customer edits (5 Nov 2026). [Vendor claim] (see 12) https://sierra.ai/blog/accelerators

**C. Release governance** (20 Aug 2026) https://sierra.ai/blog/release-governance-guardrails-for-agents-at-scale
- Agent Checks linter, severity-ranked, with suggested fixes. [Fact]
- Required Simulations as quality gates. [Fact]
- Merge approval workflow with a Reviewer role (CX lead, compliance, engineering manager); line diffs, contextual comments, request changes. [Fact]
- Split-traffic (canary) releases; in use at a large airline, a travel marketplace and a fintech. [Vendor claim]
- Experiments (pick a winner) versus split releases (ship the winner safely). [Fact]
- Immutable snapshots and fast rollback. [Fact]
- Stated scale: hundreds of people working in one agent across hundreds of journeys. [Vendor claim]

**D. Agent SDK (code)** https://sierra.ai/uk/product/agent-sdk
- Orchestration: goals and guardrails; composable skills (triage, respond, confirm); "tuning" of how flexible or deterministic each workflow is. [Fact]
- Scalable development: build once, deploy to chat, phone, email, SMS, messaging; simulations; debugging of API calls and logic traces. [Fact]
- Systems integrations: real-time knowledge engine; secure actions (update subscription, submit warranty); contact-centre handoff with auto summary. [Fact]
- Works in the customer's own programming environment and SDLC; documentation, interactive training and Sierra support (docs are not public). [Fact]
- Journeys compile deterministically to SDK code (round-trip with Git). [Vendor claim, secondary] (see 12)
- New SDK capabilities for pacing, interruption response and mid-call voice or language switching (Aug 2026). [Vendor claim] https://sierra.ai/blog/introducing-voice-personas
- Testimonial (Ramp): "write customer journeys as code, track changes". [Fact]

**E. Horizon (long-running agents)** (16 Jul 2026) https://sierra.ai/product/horizon
- Playbooks: take an outcome (mortgage, claim, renewal) and plan and execute over time. [Fact]
- Triggers on behaviour, conversations or milestones; suppression of contacts already in progress, opted out or irrelevant. [Fact]
- Omnichannel with same agent and context; two-way conversations. [Fact]
- Next-best-action decisioning via Context Engine; Horizon Advisors pick timing, channel and next step within goals and guardrails. [Fact/Vendor claim] https://sierra.ai/blog/summit-recap-2026
- Consent-aware delivery per customer per channel; messaging control ("full autonomy by default, with exact wording available where needed"); goals and guardrails defining what needs human sign-off; auditing of triggers, decisions and suppressions. [Fact]
- Compliance Console (28 Oct 2026; see F). [Fact]
- Browser automation for portals without APIs via Anon (5 Nov 2026). [Vendor claim] https://sierra.ai/blog/sierra-acquires-anon

**F. Compliance Console** (28 Oct 2026, inside Horizon) https://sierra.ai/blog/introducing-compliance-console
- Disclosures per channel (call opening, SMS opt-out wording, email unsubscribe). [Fact]
- Contact windows by recipient local time; default 8am to 9pm; per-day and split windows. [Fact]
- Holiday exclusions by region (examples: Spain's National Day, Bastille Day, ANZAC Day). [Fact]
- Frequency limits, separate for marketing and transactional. [Fact]
- Opt-outs via STOP or phone, stored and accessible to the company. [Fact]
- Compliance dashboards in Insights: allowed, deferred, blocked, held for review, opt-outs. [Fact]

**G. Context Engine (formerly Agent Data Platform, Nov 2025)** https://sierra.ai/product/context-engine
- Memory: ties every interaction to one person across channels; customer-owned, permissioned, retained on the customer's terms, exportable to the warehouse or any external system; integrates systems of record for purchase and account history. [Fact]
- Signals: first- and third-party (behaviour, transactions, account changes); re-assesses each customer between conversations. [Fact]
- Personalisation: next best action against custom strategies; non-negotiable guardrails (protect NPS or margins). [Fact]
- No data model, identity-resolution method, connectors or retention periods published. [Unverified]
- [Inference] The rename from "Agent Data Platform" (Nov 2025, see 12) to "Context Engine" by mid-2026 is inferred from Horizon and Summit posts using the new name and the product page; I found no rename announcement.

**H. Insights and Explorer** https://sierra.ai/product/insights
- Reporting: analytics and custom reports; key metrics such as CSAT and case resolution; one-click from any data point into Explorer; automated tagging of conversations. [Fact]
- Experimentation: value discovery (turn cancellations into saves), conversation-design tests (handoff rules, level of determinism), intelligent decisioning. [Fact]
- Observability: always-on monitoring; auditing that shows reasoning, knowledge sources and systems accessed; alerting on abuse attempts or performance drops, integrated with existing tools. [Fact]
- Monitors written in natural language with default coherence, repetition, grounding and sentiment monitors (see 12). [Vendor claim]
- Explorer: natural-language questions over analytics and sample conversations, with recommendations; now folded into Ghostwriter. [Fact] https://sierra.ai/product/agent-studio ; redesign post. (Explorer product page could not be opened.)

**I. Channels** https://sierra.ai/product/channels
- Voice: inbound and outbound, interruption and noise handling, sentiment-adaptive pace, IVR replacement, Voice Personas across 60+ locales. [Fact]
- Messaging: website chat, mobile app chat, WhatsApp, Apple Business Chat, SMS, proactive outreach, multimodal images and video. [Fact]
- Email: autonomous branded replies using CRM and account context. [Fact]
- Live Assist (see J). [Fact]
- ChatGPT: publish one agent as a ChatGPT App via MCP, one click or CI/CD; choose which journeys, data and capabilities each channel exposes; "universal web attachments" (maps, fillable forms, charts) (23 Oct 2025). [Fact] https://sierra.ai/blog/publish-to-chatgpt
- Language count is inconsistent across pages: 55+ (voice page), 58 (channels page), 60+ locales (personas). [Fact, conflict] https://sierra.ai/product/voice ; https://sierra.ai/product/channels
- Marketplaces: OpenAI Marketplace, Google Cloud Marketplace, AWS Marketplace, Stripe App Marketplace (one-click install). [Fact] https://sierra.ai/sitemap ; https://sierra.ai/partners ; https://sierra.ai/blog/summit-recap-2026

**J. Live Assist (for human reps)** https://sierra.ai/product/live-assist
- Real-time next-step guidance in chat or calls with automatic context capture; auto-drafted replies or call scripts grounded in knowledge and systems; one-click actions using the same tools as the AI agent; assisted conversations feed improvements back. [Fact] No metrics given.
- Handoff: escalation routes to the right team with an auto summary; verified identity carries across departments (R1 RCM). [Fact] https://sierra.ai/uk/product/agent-sdk ; https://sierra.ai/customers/r1-rcm

**K. Voice (product)** https://sierra.ai/product/voice
- 55+ languages with mid-conversation switching; per-turn model routing; voice sims; escalation with full history. [Fact]
- Voice payments: card and ACH in one call via keypad on PCI Level 1 infrastructure, no IVR handoff. [Fact]
- Outbound: verified caller ID and number reputation, cached introductions and pickup detection, detection of voicemail, relatives, fax and other IVRs, warm transfer; outbound payment collection was "planned" as of Oct 2025. [Fact] https://sierra.ai/blog/outbound-calls
- Tandem Voice: a conversation layer replies in real time while a reasoning layer plans from the full audio and transcript (Summit 2026). [Vendor claim] https://sierra.ai/blog/summit-recap-2026
- Voice Personas (7 Aug 2026): personality styles, voice selection, pacing, interruption behaviour, A/B tests; voices "sealed" in production; one agent with many personas per brand or market. Resolution up almost 50% for one agent. [Vendor claim] https://sierra.ai/blog/introducing-voice-personas
- Related posts not opened: IVR navigation, caller ID, multilingual voice, voice post-training, Mossy, Voice Sommelier. [Unverified]

**L. Trust and reliability** https://sierra.ai/product/trust-and-reliability
- Certifications claimed: SOC 2, HIPAA, GDPR, PCI DSS Level 1 Service Provider, FedRAMP High, CCPA, CSA STAR, ISO 27001, ISO 42001; AIUC-1 (post not opened). Contrary also lists PCI DSS 4.0.1 and the EU AI Act. [Vendor claim] ; https://research.contrary.com/company/sierra
- Deterministic, controlled access to systems of record; supervisory layers; PII automatically encrypted and masked; filters and monitors for off-limits topics; data used only as instructed, not shared across customers; automatic LLM-provider failover. [Vendor claim]
- Trust Center on Vanta with security documents on request; PCI AOC and Shared Responsibility Matrix available there. [Fact] https://trust.sierra.ai/ ; https://sierra.ai/blog/payments
- Defence in depth (13 Aug 2026): four layers, input and output supervisors, deterministic guards, third-party red teaming with "millions of attempts" in aggregate, platform-wide Threat Detection plus per-agent Monitors. [Fact] https://sierra.ai/blog/defense-in-depth-in-the-age-of-agents
- Fleming model to detect AI callers. [Vendor claim]

**M. Models (Agent OS)** https://sierra.ai/blog/summit-recap-2026
- Constellation of 15+ models (see 12); in-house Curie (orchestration loop), Fleming (AI-caller detection), Linnaeus and Darwin (search). [Vendor claim]
- Provider hedging: send a request to several providers, use the fastest valid answer. [Fact] https://sierra.ai/blog/voice-latency

**N. Personal agents** https://sierra.ai/blog/releasing-poppy
- Personal Agent Protocol (draft 6 to 9 Oct 2026; 1.0 on 13 Nov 2026): OAuth, customer-managed permissions, approval gates, commerce extension with Shopify; spec at personalagentprotocol.org. Live: Mercury, Synchrony, Turkish Airlines. [Fact]
- "Personal agents" product page and enterprise whitepaper exist; not opened. [Unverified]

**O. Export and portability**
- Memory exportable to the customer's warehouse or any external system. [Fact] https://sierra.ai/product/context-engine
- Journeys compile to SDK code that lives in the customer's Git (see 12). [Vendor claim]
- No published export of journeys to a non-Sierra runtime, and no published transcript export format. [Unverified]

### 3. How it works underneath (new detail beyond 12)

**Change model.** The unit of change is a session (Ghostwriter thread plus diff). Sessions merge into a release; releases are immutable snapshots; releases pass linter (Agent Checks), simulation gates and Reviewer approval; they deploy to a traffic share before 100%. Projects bind several agents plus shared data and channels into one release unit. [Fact] redesign and release-governance posts. Example for a newcomer: a compliance officer is set as Reviewer; an ops lead asks Ghostwriter to change the hardship-plan wording; Ghostwriter edits two agents in one session, runs the sims, Agent Checks flags that a balance lookup now runs before identity verification; the fix is applied; the Reviewer approves; it ships to 10% of calls first.

**Runtime per message.** Input supervisor, then the agent (retrieval plus rules plus tools), then deterministic guards (tool availability gated on authentication state, output scan for sensitive data), then output supervisor that may block, rewrite or nudge. [Fact] defence-in-depth post. For voice, the runtime is a concurrent graph: abuse detection, retrieval and API calls in parallel; predictive prefetch (load a known customer's orders before asked); small models for summaries and state updates, large for reasoning; provider hedging; interim progress lines; cached TTS phrases; streaming TTS. Metric is Time to First Audio, measured from true end of speech by a custom VAD. Traces record timing per step. No millisecond figures are published. [Fact] https://sierra.ai/blog/voice-latency

**Secure mode for regulated actions.** During payment capture the LLM is removed from the path and the dialogue follows a server-validated fixed sequence; card data goes from keypad or embedded form to the processor through a separate PCI zone; the agent sees status and last four. [Fact] https://sierra.ai/blog/payments. [Inference] This is a general pattern: a "hard mode" where the model hands control to a deterministic script for any step whose wording or data handling is regulated.

**Outbound rules engine.** Every outbound attempt is evaluated against disclosure, window, holiday, frequency and opt-out rules and lands in one of four states: allowed, deferred, blocked, held for review. [Fact] Compliance Console post. Horizon adds suppression and consent per channel and logs why each person was suppressed. [Fact] Horizon page.

**Identity.** Sensitive tools are withheld until authentication; R1 RCM moved intent capture before verification and cut authentication time by more than half; verified identity is carried across departments on transfer. [Fact] https://sierra.ai/customers/r1-rcm ; defence-in-depth post.

**Websites without APIs.** Anon's browser agent signs in, navigates portals and fills forms for Horizon tasks. [Vendor claim] https://sierra.ai/blog/sierra-acquires-anon

**Not published:** journey syntax, memory schema, connector list, permissions model beyond Reviewer, audit-log format, data residency, retention defaults. [Unverified]

### 4. Commercials

- **ARR** [Fact unless marked]: >$20M Oct 2024 (Contrary); $26M end-2024 [Analyst]; $100M Nov 2025; >$150M Feb 2026; $200M May 2026 [Analyst]; $400M+ week of 30 Oct 2026, with $150M+ added in Q3 2026. https://sierra.ai/blog/our-customers-ambition-is-accelerating-our-growth ; https://www.sacra.com/c/sierra ; https://research.contrary.com/company/sierra
- **Funding** [Analyst]: $110M (Sequoia, Benchmark, Feb 2024, ~$1B valuation unconfirmed); $175M at $4.5B (Greenoaks, Oct 2024); $350M at $10B (Greenoaks, Sep 2025); SoftBank Vision Fund 2 strategic (Dec 2025, amount undisclosed); $950M Series E at $15.8B post (GV and Tiger Global, May 2026), cash >$1B; Sacra total $1.58B. Contrary's page (updated 22 Oct 2026) still shows $635M across three rounds, omitting the Series E: sources conflict on total. Takeoff's post confirms "$950 million at a valuation above $15 billion". [Fact] https://sierra.ai/blog/sierra-acquires-takeoff
- **Valuation multiple**: about 39.5x Oct 2026 ARR per Sacra. [Analyst]
- **Team**: about 500 employees (Contrary, Oct 2026). [Analyst] Offices: San Francisco HQ; Tokyo, Singapore, Madrid, Paris, London, Sydney. [Analyst]
- **Customer count**: "hundreds of enterprises" (Contrary); 58 stories on the customer page. [Analyst; Fact] https://sierra.ai/customers
- **Pricing**: outcome-based, custom-quoted per customer; routine traffic often volume-priced, complex work outcome-priced [Analyst Sacra]. Competitor-reported starting point about $150k a year and onboarding from about $50k. [Competitor claim] https://quiq.com/blog/sierra-ai-reviews/. No public rate card. Resolution definition and dispute process are unpublished (see 12). [Unverified]
- **Customers with quantified results** [Vendor claim unless noted]:
  - Financial services: Rocket Mortgage 4x conversion, $1B loan volume monthly (https://sierra.ai/blog/sierra-acquires-opera-tech-in-japan); SoFi NPS +33; Chime 70%+ resolution; Ramp ~90% of cases without humans (Contrary); an unnamed financial firm 85% resolution on voice card activation (payments post); Capital on Tap, Tilt, Figure, Imprint, JPMorganChase, Santander, Nubank, Guardian named without numbers.
  - Healthcare: Cigna live in eight weeks, patient authentication time cut 80%; R1 RCM resolves up to 40% of patient billing calls in early testing (balances, payments, payment plans); Blue Shield of California voice CSAT 4.4/5 (Sacra); Sutter Health, Modern Animal named.
  - Telecom and media: Singtel live under 10 weeks, >70% resolution; SiriusXM (34M subscribers) uses voice payments and ADP; Virgin Media O2, Liberty Global, SoftBank named.
  - Retail: Next live in six weeks, 48 languages in 83 countries; Sun & Ski 3x conversion; OluKai 70% automated resolution, 4.5/5; Madison Reed 50% fewer cancellations (Contrary); Redfin 2x listings viewed, 47% more tour requests (Sacra); WeightWatchers ~70% containment in week one (see 12); a $40B+ US retailer live in 27 days (Oct 2026).
  - Technology: Airtable 80% resolution; CLEAR 4.7/5 CSAT (Contrary).
  - Utilities: Kraken (also a go-to-market partner).
  - Of 33 stories visible, only 13 carry a number. [Fact] https://sierra.ai/customers

### 5. Why customers choose it

1. **Founders and credibility with large regulated buyers.** Taylor (ex-Salesforce co-CEO, OpenAI chair) and Bavor (18 years at Google) sell to the Fortune 50; JPMorganChase inducted Sierra into its Hall of Innovation (5 Nov 2026). [Fact] https://research.contrary.com/company/sierra ; https://sierra.ai/blog
2. **Breadth of certifications and payment isolation**, which removes procurement blockers in banks, insurers and health systems (PCI L1, HIPAA, FedRAMP High, ISO 42001). [Vendor claim] trust page; payments post.
3. **Outcome pricing** shifts model-cost and performance risk to Sierra. [Vendor claim] https://sierra.ai/blog/our-customers-ambition-is-accelerating-our-growth
4. **Speed to live with white-glove delivery**: 27 days to ten weeks for large firms. [Vendor claim] customer and blog posts.
5. **Governance that lets hundreds of staff edit one agent safely**: reviewers, gates, canaries, rollback. [Vendor claim] release-governance post.

Complaints [Competitor claim, Quiq, plus G2 quotes it relays]: opaque custom pricing and unclear outcome definitions that make budgeting hard; slow ramp and heavy implementation effort; occasional slowness and bugs; context lost in long conversations; bot and human conversation histories in separate systems; analytics with little customisation; ongoing content maintenance. Quiq also says Sierra "doesn't support channel switching", which contradicts Sierra's own cross-channel claims; treat with caution. https://quiq.com/blog/sierra-ai-reviews/. Analyst risks: high-touch delivery limits scale and margins; PCI and healthcare exposure raises error cost; a coordinated jailbreak attempt across more than a dozen customer agents and a misconfigured Gap.com guardrail answering off-scope topics; incumbents (Salesforce now owns Fin) bundling. [Analyst] https://www.sacra.com/c/sierra ; https://research.contrary.com/company/sierra

### 6. How it deploys

- Sales-led, not self-serve: no public sign-up or price list. [Fact] sitemap.
- A Sierra "Strategist, Agent Development" owns the lifecycle: scoping, conversation design, tooling, evaluation, launch, tuning; advises executives on what success means; runs working sessions with ops teams; turns pilots into multi-team production handling thousands of conversations a day; defines evaluation metrics improved week over week. Variants exist for flagship deployments, retail, healthcare, TMT, public sector and Spanish speakers. [Fact] job posts (link in Sources). This appears to supersede or sit beside the "Product Manager, Agent Development" title in 12. [Inference] Agent engineers build reusable components (see 12).
- Partners can deliver: GSIs and consultancies (Accenture, BCG, Capgemini, Cognizant, Infosys, NTT DATA, West Monroe), BPOs (Foundever, ibex, Sagility), and distributors (Carahsoft, AWS Marketplace). [Fact] https://sierra.ai/partners
- Typical path [Vendor claim]: ingest SOPs and transcripts into Ghostwriter; Accelerators for basics; connect systems through the Integration Library; auto-generated sims; small traffic slice; widen. Time to live 27 days to 10 weeks for large firms.
- Self-serve share: the Ghostwriter redesign aims to let CX teams "regardless of technical expertise" make changes after launch. [Vendor claim] https://sierra.ai/product/ghostwriter

### 7. Partner programme (detail)

Two categories: Technology partners (17 logos: Amazon Connect, Anthropic, athenahealth, AWS, Cartesia, Deepgram, Five9, Genesys, Google Cloud, Instinct, Meta, OpenAI, Oracle, Oracle Hospitality, Plaid, Stripe, Twilio) and Go-to-market partners (20: Accenture, Accenture Federal Services, AWS Marketplace, BCG, Capgemini, Carahsoft, Cognizant, Fiserv, Foundever, ibex, Infosys, Knox, Kraken, NTT DATA, OpenAI, Sagility, SoftBank, Vedara, West Monroe, WPP The Cocktail). No tiers, benefits or certification published. [Fact] https://sierra.ai/partners ; https://sierra.ai/blog/the-sierra-partner-ecosystem (6 Oct 2026). [Inference] The technology list reveals parts of the stack: Deepgram and Cartesia for speech, Twilio and the CCaaS vendors for telephony, Anthropic, OpenAI and Google for models.

### 8. Acquisitions

| Date | Company | What it adds | Source |
|---|---|---|---|
| 26 Mar 2025 | Receptive AI | Voice agent technology; voice then the largest channel | https://sierra.ai/blog/sierra-acquires-receptive-ai |
| 27 Mar 2026 | Opera Tech (Tokyo) | Japanese enterprise relationships | https://sierra.ai/blog/sierra-acquires-opera-tech-in-japan |
| 23 Apr 2026 | Fragment (Paris) | French agent development team | https://sierra.ai/blog/sierra-acquires-fragment-in-france |
| 23 Jul 2026 | Takeoff | Long-horizon agent runtime; outcome-paid vertical agents; ~$0 to near eight-figure run rate in H1 2026 with three staff | https://sierra.ai/blog/sierra-acquires-takeoff |
| 5 Nov 2026 | Anon | Browser agents for sites without APIs; raised $13M+, hundreds of customers | https://sierra.ai/blog/sierra-acquires-anon |

No deal terms disclosed for any. [Fact]

### 9. Research

- tau-bench and tau2 (see 12).
- tau-voice (1 May 2026): 278 tasks across retail, airline, telecom; same tools, policies and DB-state scoring as text; full duplex with 200 ms ticks; G.711 8 kHz compression, noise, frame drops; LLM turn-taking policy every 2 s; GPT-4.1 user simulator. Scores: gpt-realtime-1.0 30% (Aug 2025), grok-voice-think-fast-1.0 67% (Apr 2026); text reasoning models about 85%. Paper arXiv 2603.13686, code in sierra-research/tau2-bench. [Fact] https://sierra.ai/blog/tau-voice-benchmarking-real-time-voice-agents-on-real-world-tasks
- tau-Entity (exact detail capture by voice) and mu-Bench (multilingual transcription) exist; not opened. [Unverified] https://sierra.ai/sitemap

### 10. Founders' stated principles (collected)

- Rent the intelligence, own the context; customer relationships are the moat. [Fact] summit recap.
- Pay for outcomes, not tokens. [Fact] 30 Oct post.
- Right model per task. [Fact] summit recap.
- Build once, deploy everywhere; one agent, many personas. [Fact] channels and personas.
- Agents are software: version, test, review, canary, roll back. [Fact] release-governance post.
- Vertical over horizontal; root-cause each failure to missing context (see 12).
- "Automation rates are a means, not an end" (R1 RCM customer quote, not a founder). [Fact]

### 11. Relationship to the founder's product

**Teacher first, possible competitor later, not a customer or supplier.** [Inference] Sierra targets the largest B2C companies at six-figure starting contracts, which leaves 100 to 1,000-staff companies largely unserved. But Horizon plus Compliance Console plus payments is exactly an outbound collections stack, and R1 RCM shows Sierra already running patient balance, payment and payment-plan calls. If Sierra packages a collections Accelerator, it competes at the top end. Sierra lacks what the founder plans as the core: an explicit company model (objects, metric definitions, permissions) that internal agents also use for finance reporting. Sierra's internal face is analytics about the agent, not about receivables.

## What to copy

1. **Session-based change with review and merge.** Every agent or rule change made by a person or a builder-agent lives in an isolated session with a diff; nothing affects customers until a named Reviewer merges. Allow fork and share. https://sierra.ai/blog/redesigning-agent-studio-around-ghostwriter
2. **A linter for the company model.** Static checks over rules and actions, ranked by severity with suggested fixes. Start with Sierra's five: action referenced but not granted; conflicting rules; read tool used to perform a write; message unsuitable for the channel (e.g. a long table sent by SMS); sensitive lookup with insufficient authentication. https://sierra.ai/blog/release-governance-guardrails-for-agents-at-scale
3. **Release gates as configuration:** require simulations to pass, require approvals from a role (finance controller, compliance), deploy to a share of debtors first, keep each release as an immutable snapshot with one-click rollback. Same URL.
4. **Outbound rule engine with four outcomes.** For each reminder evaluate disclosures, local-time window (default 8am to 9pm, editable, multiple windows), regional holidays, frequency caps split by message class, consent and opt-out; return allowed, deferred, blocked or held-for-review; log the reason; show counts on a dashboard. Store opt-outs from any channel (STOP or spoken). https://sierra.ai/blog/introducing-compliance-console
5. **Suppression and audit for long-running cases.** Before each touch, suppress if the case is in progress elsewhere, opted out or no longer relevant (paid, disputed); record what triggered each touch and why anyone was suppressed. https://sierra.ai/product/horizon
6. **Playbooks toward an outcome.** Model collections as a goal ("balance paid or plan agreed") with a plan the agent executes over weeks and re-plans on signals (payment received, promise broken), within guardrails on what needs human sign-off. https://sierra.ai/product/horizon
7. **Hard mode for payments.** Never let the LLM see card or bank data; hand the step to a fixed, server-validated script and a hosted payment form or link to the processor (Stripe); return only status and last four. Support payment plans and card-on-file updates. https://sierra.ai/blog/payments
8. **Tools gated on authentication state.** Account-read and write actions do not exist in the agent's tool list until identity is verified; capture intent before verification to shorten it. https://sierra.ai/blog/defense-in-depth-in-the-age-of-agents ; https://sierra.ai/customers/r1-rcm
9. **Two supervisors per message** (input screen, output check that can block, rewrite or nudge) plus a deterministic output scan for sensitive data. https://sierra.ai/blog/defense-in-depth-in-the-age-of-agents
10. **Customer-owned, exportable memory.** Commit in the contract and product that the customer's context store is exportable to their warehouse. It answers the lock-in objection and fits "own the context". https://sierra.ai/product/context-engine
11. **Per-channel exposure control.** When publishing the agent to a new surface (ChatGPT, WhatsApp), choose which procedures, data and actions that surface gets. https://sierra.ai/blog/publish-to-chatgpt
12. **Updatable starter packs kept separate from customer edits** (Sierra's Accelerators): ship a "collections basics" pack (identity check, balance lookup, promise-to-pay, dispute capture, hardship) whose updates are reviewed before applying. https://sierra.ai/blog/accelerators
13. **Provider hedging and per-step timing traces** for latency-sensitive steps; rented models make this cheap to adopt. https://sierra.ai/blog/voice-latency
14. **Builder agent that proposes, never ships.** Ghostwriter posts evidence plus a proposed change plus estimated impact in Slack or Teams and tracks the result after release. https://sierra.ai/blog/ghostwriter-ai-tool-to-teammate
15. **Evaluate on end state, including under realistic conditions.** Reuse tau2-bench's DB-state scoring for "did the ledger end correct?" and add realistic-noise variants for any voice channel. https://sierra.ai/blog/tau-voice-benchmarking-real-time-voice-agents-on-real-world-tasks

## What cannot or should not be copied

- **White-glove delivery with a strategist per account.** Sierra's speed depends on GBP 150k+ strategists and partner GSIs. A solo founder selling to 100 to 1,000-staff firms cannot staff this; replace it with packs, a guided onboarding and Ghostwriter-style builder help. [Inference]
- **Own model training (Curie, Fleming, search models) and native PCI L1 infrastructure.** Out of scope under the rented-models rule; use processor-hosted payment pages instead of building a PCI zone. [Inference]
- **Pure outcome pricing at the start.** Sierra itself says it needs high autonomy and clean attribution or it becomes "an endless debate" (see 12). For collections, "amount collected" is attributable but also influenced by the company's own staff; begin with a platform fee plus a success component. [Inference]
- **Voice first.** Voice is Sierra's largest channel but needs speech vendors, telephony, latency engineering and is still well below text on tau-voice. Email and messaging reminders come first for the founder. [Inference] tau-voice post.
- **Weak points to exploit:** opaque pricing and high minimums; no public docs or self-serve; analytics about the agent rather than about the business; bot and human histories split (competitor claim); no published data model, so buyers cannot inspect how their rules are represented. [Competitor claim; Inference]

## Open questions and unverified items

- How a billable resolution is detected and disputed; actual rate levels. [Unverified]
- Journey DSL syntax; Context Engine schema, identity resolution, retention and residency. [Unverified]
- Full permission model beyond the Reviewer role; audit-log format. [Unverified]
- Whether outbound payment collection launched (planned in Oct 2025; Compliance Console names late-payment collection in Oct 2026). [Unverified]
- Pages listed in the sitemap but not opened because the fetch budget ran out: Agent OS 2.0 (re-check), Explorer page, Live Assist metrics, AIUC-1, FedRAMP High, ISO posts, multilingual voice, IVR navigation, caller ID, voice post-training, Mossy, tau-Entity, mu-Bench, personal agents page and whitepaper, Stripe and Plaid partnership posts, shopping agents, personal-agents-insights, Accelerators (already in 12), Kraken, Capital on Tap and Paychex stories.
- Headcount (Contrary ~500) and total funding (Sacra $1.58B vs Contrary $635M) conflict or are third-party only.
- Fortune 50 share moved from 40% (Apr 2026) to "almost 50%" (Oct 2026); share of customers above $10B is "over a quarter" (Apr 2026) or "over a fifth" (Contrary).

## Comparison table (Sierra vs named competitors, figures as reported)

| | Sierra | Decagon | Fin (Salesforce) | Parloa | Wonderful |
|---|---|---|---|---|---|
| Revenue | $400M+ ARR (Oct 2026) [Fact] | ~$100M (Aug 2026) [Analyst] | ~$400M ARR, +27% YoY [Analyst] | $52M ARR 2025 [Analyst] | ~$70M (Aug 2026) [Analyst] |
| Last valuation | $15.8B (May 2026) [Analyst] | $4.5B [Analyst] | acquired ~$3.6B (Sep 2026) [Analyst] | $3B (Jan 2026) [Analyst] | $5B (Sep 2026) [Analyst] |
| Pricing | custom, outcome-led | per conversation or resolution (see 12) | $0.99 per outcome (see 12) | not checked | not checked |
| Buyer | Fortune 500 B2C | enterprise B2C | SMB to enterprise | enterprise contact centres | enterprise |
| Self-serve | no | no | yes | no | not checked |

Source for competitor figures: https://www.sacra.com/c/sierra (Sacra's competitor section). Not verified against the competitors' own pages in this round.

## Sources (ranked by usefulness)

1. https://sierra.ai/blog/release-governance-guardrails-for-agents-at-scale (20 Aug 2026): linter checks, reviewer role, gates, canaries, snapshots.
2. https://sierra.ai/blog/introducing-compliance-console (28 Oct 2026): outbound rule set directly reusable for collections.
3. https://sierra.ai/blog/redesigning-agent-studio-around-ghostwriter (2 Nov 2026): sessions, merge, projects.
4. https://sierra.ai/blog/payments (7 Apr 2026): payment isolation and supported flows.
5. https://sierra.ai/blog/defense-in-depth-in-the-age-of-agents (13 Aug 2026): runtime layers and supervisors.
6. https://sierra.ai/product/horizon : long-running agents, suppression, consent, audit.
7. https://sierra.ai/blog/summit-recap-2026 (6 Oct 2026): models, Tandem Voice, Persona Studio, principles, customer share.
8. https://sierra.ai/blog/our-customers-ambition-is-accelerating-our-growth (30 Oct 2026): ARR and growth.
9. https://sierra.ai/blog/voice-latency (9 Oct 2025): concurrent runtime, hedging, TTFA.
10. https://sierra.ai/blog/tau-voice-benchmarking-real-time-voice-agents-on-real-world-tasks (1 May 2026): voice benchmark design and scores.
11. https://sierra.ai/product/agent-studio and https://sierra.ai/uk/product/agent-sdk : feature lists and navigation.
12. https://sierra.ai/product/context-engine , https://sierra.ai/product/insights , https://sierra.ai/product/channels , https://sierra.ai/product/voice , https://sierra.ai/product/live-assist , https://sierra.ai/product/ghostwriter , https://sierra.ai/product/trust-and-reliability : product pages.
13. https://sierra.ai/customers and https://sierra.ai/customers/r1-rcm (18 May 2026): customers; patient billing case closest to collections.
14. https://www.sacra.com/c/sierra : ARR series, funding, competitors, risks (analyst).
15. https://research.contrary.com/company/sierra (updated 22 Oct 2026): headcount, certifications, customer metrics, risks (analyst; Contrary invests in Ramp).
16. https://sierra.ai/blog/releasing-poppy (13 Nov 2026): Personal Agent Protocol 1.0.
17. Acquisition posts: https://sierra.ai/blog/sierra-acquires-takeoff ; https://sierra.ai/blog/sierra-acquires-anon ; https://sierra.ai/blog/sierra-acquires-receptive-ai ; https://sierra.ai/blog/sierra-acquires-opera-tech-in-japan ; https://sierra.ai/blog/sierra-acquires-fragment-in-france
18. https://sierra.ai/partners and https://sierra.ai/blog/the-sierra-partner-ecosystem (6 Oct 2026): partner lists.
19. https://jobs.thrivecap.com/companies/sierra-2-90e5d64d-40bb-415e-bbca-4108552c8ee9/jobs/52580191-strategist-agent-development : deployment role.
20. https://sierra.ai/blog/outbound-calls (10 Oct 2025), https://sierra.ai/blog/publish-to-chatgpt (23 Oct 2025), https://sierra.ai/blog/introducing-voice-personas (7 Aug 2026).
21. https://quiq.com/blog/sierra-ai-reviews/ : criticisms (competitor-authored; use with care).
22. https://sierra.ai/sitemap : full list of pages, including those not read.
23. /home/claude/research/12-agent-companies.md : earlier Sierra detail (journeys, sims, tau2 code, ADP, pricing definition).
