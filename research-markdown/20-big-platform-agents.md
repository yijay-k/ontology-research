# Big-platform business agents: Meta, Salesforce, Microsoft, Google, Amazon, ServiceNow, Workday, SAP, Oracle, Intuit, Xero, plus OpenAI, Anthropic and Alibaba in summary

Scope note (written 21 November 2026). This file lists what the large platforms sell businesses as "agents" in late 2026. It goes deepest on Meta (Business Agent, Business Agent Platform, Meta Enterprise Platform, Manus, WhatsApp pricing). It then covers the others in one format, and ends with the section that matters most to the founder: which platforms already ship an agent that chases receivables, what it does, for which customer size, and at what price. **Budget and coverage.** The shared web-fetch pool ran out twice (an 800-per-hour pool shared across all agents, then a per-hour target limit), so the session got about 25 successful page reads instead of the 60 allowed. Meta, Salesforce pricing, SAP's receivables agents, Oracle's agent list, the Microsoft collections-agent scenario, Intuit's Payments agent and Xero's JAX were read from primary pages. Most of Microsoft, Google, Amazon, ServiceNow and Workday, and some of Salesforce, rest on earlier files in this folder (notably `11-context-layer-products.md`, `08-alibaba-stack.md`, `10-papers-agents-memory-eval.md`, `12-agent-companies.md`) or on prior knowledge (to June 2026). Prior-knowledge claims are marked **[Unverified]**. Labels: [Fact] with URL, [Vendor claim] with URL, [Inference], [Unverified].

---

## Key findings

1. **Meta now sells the external face of the founder's product on WhatsApp, and prices it per token.** Meta Business Agent (announced 3 June 2026) is the primary responder on a WhatsApp number. It answers from business knowledge, calls the business's own APIs through "connectors", relays business events to customers, and hands off to the business's app [Fact](https://developers.facebook.com/documentation/meta-business-agent/overview). Agent messages cost $2.00 per million tokens from 1 August 2026, roughly 4 to 5 US cents per message, with no free window [Fact](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/).
2. **Meta excludes the Finance vertical from Business Agent.** Eligible WhatsApp accounts must be outside Finance, Government, Health, Alcohol, Gambling, OTC drugs and matrimony [Fact](https://developers.facebook.com/documentation/meta-business-agent/overview). A manufacturer or distributor chasing its own invoices is probably not "Finance" [Inference]. A debt-collection agency, lender or BNPL firm is. Meta's agent has no receivables or payment-reminder function; payments appear only as "payment methods" in business info [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities).
3. **WhatsApp payment reminders got more expensive on 1 October 2026.** Utility templates (the category for payment reminders) are now charged per message even inside the 24-hour service window, and service messages became paid outside the 72-hour entry window (1,000 free service messages per number per month) [Fact](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/), [Fact via BSP](https://360dialog.com/blog/?p=1433). A reminder channel on WhatsApp now has a real per-message cost that must be modelled.
4. **Meta's "Agent events" endpoint is the pattern for outbound, system-triggered messages.** The business posts a custom event type with a description and a payload; the agent writes the customer message. It is asynchronous and returns `accepted` [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities). An "invoice overdue" event would fit this shape exactly [Inference].
5. **Meta Enterprise Platform (28 Sep 2026) is mostly names so far.** Muse agent, Muse API, Muse Code and Business Agent were announced under a new Chief Enterprise Platform Officer, CJ Desai (ex-MongoDB CEO), with no published pricing, controls or customers [Fact](https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/). Analysts cite Meta's record of shutting enterprise products (Workplace closed May 2026) as the main buyer risk [Fact](https://www.infoworld.com/article/4228532/metas-next-big-ai-bet-is-enterprise-its-biggest-hurdle-may-be-trust-2.html).
6. **Manus is no longer Meta's.** Meta announced the deal (over $2B) in December 2025; Beijing ordered it unwound in April 2026; Manus separated in August and "resumed independent operations" on 1 September 2026, with some users' post-29-Dec-2025 data deleted [Fact](https://eweek.com/news/meta-manus-ai-deal-china-unwind-apac/), [Fact](https://manus.im/blog/manus-resumes-independent-operations).
7. **SAP ships the most complete receivables agent set, for the largest companies.** Joule's Accounts Receivable Assistant coordinates eight agents: orchestration, collection account preparation, collections email outreach, dispute creation, dispute resolution, dunning insights, receivable account analysis, and receivables/payables clearing [Fact](https://www.sap.com/use-cases/joule-assistant/accounts-receivable-ai). Nestlé (S/4HANA in 140 countries) is the named adopter; there is no GA date, and rollouts run through Q1 2027 [Fact](https://www.pymnts.com/?p=4328429).
8. **Intuit already ships invoice chasing to small businesses in the US.** The QuickBooks Payments agent suggests a reminder schedule for overdue invoices, drafts the reminder, suggests late fees and payment methods, and Intuit claims customers get paid about 5 days faster [Fact](https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US), [Vendor claim](https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/). US only; no separate price.
9. **Xero is about to ship the closest thing to the founder's external face for SMEs.** "Payment Follow Ups" (coming soon, Xerocon London 2026) analyses each customer's payment history and runs a tailored collection plan: consolidated invoices, timed reminders, or switching to SMS [Fact](https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/). Xero also opened its data to Claude and Microsoft 365 Copilot and announced XeroForce, a no-code agent builder.
10. **Oracle and Microsoft cover collections but less directly.** Oracle has a Collectors Workspace (risk analysis, next-best action, automated outreach) and a Cash Processing Agent for cash application [Fact](https://www.oracle.com/in/applications/fusion-ai/ai-agents/). Microsoft's "collections agent" is a Copilot Studio demonstration scenario, not a product [Fact](https://adoption.microsoft.com/en-gb/scenario-library/finance/collections-agent/).
11. **The platforms converge on the same agent anatomy:** knowledge (files, FAQs, websites), natural-language instructions, typed tools that call the customer's APIs, deterministic handoff to humans, test and evaluation suites, and an admin control plane. Meta's version is the smallest public example: Knowledge API, instructions, connectors plus connector tools, agent settings (handoff, follow-up, allowlist, never-say phrases), Agent Test and Agent Eval [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities), [Fact via BSP](https://360dialog.com/blog/?p=1433).
12. **Pricing has split three ways:** per message or token (Meta), per conversation or per action (Salesforce: $2 per conversation, or Flex Credits at $0.10 per action), and per seat with pooled credits (Salesforce add-ons at $150 to $175 per user per month; Microsoft, Google, Amazon, QwenWork) [Fact](https://www.salesforce.com/agentforce/pricing/). Accounting suites (Intuit, Xero) bundle agents into the subscription.
13. **None of them holds a cross-system company model for a mid-sized firm that uses an accounting package plus WhatsApp.** SAP's and Oracle's receivables agents need SAP or Oracle ERP; Intuit's and Xero's need their ledger and target small firms; Meta's has the channel but no ledger and excludes Finance-vertical senders. [Inference]

---

## Breakdown

### 1. Meta (deepest)

#### 1.1 In one paragraph

Meta sells businesses an AI agent that sits inside WhatsApp, Messenger and Instagram chats and answers, sells, books and qualifies leads in the business's voice. Two buyers exist. Small merchants (owner-operators, home bakers, car workshops) switch it on from the WhatsApp Business app or Meta Business Suite in minutes; Meta says over one million businesses use it [Fact](https://about.fb.com/news/2026/06/meta-business-agent/). Larger businesses (heads of customer service, e-commerce and CRM, usually via a Business Solution Provider) use the Business Agent Platform APIs on the WhatsApp Cloud API to connect it to Shopify, Zendesk, Shopee and their own systems [Fact](https://developers.facebook.com/documentation/meta-business-agent/overview). The result they pay for is fewer support staff hours and more chat-driven sales: Meta describes the agent as designed "to reduce support workload while increasing sales" [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities). In September 2026 Meta grouped this with Muse (its agent and model family) under "Meta Enterprise Platform" [Fact](https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/).

#### 1.2 Function catalogue

**A. Meta Business Agent (consumer-app path; announced 3 June 2026)** [Fact](https://about.fb.com/news/2026/06/meta-business-agent/)
- Answers business-specific questions in the customer's language and the business's tone.
- Recommends products from the business's catalog; closes sales.
- Books appointments; qualifies leads.
- Human takeover: the business decides when staff step in; owners can take over any thread [Fact](https://techwireasia.com/2026/06/meta-business-agent-whatsapp-southeast-asia/).
- Channels: WhatsApp and Messenger, now also Instagram. Activation at facebook.com/business/ai. Free "for now"; paid subscriptions "in the coming months"; for small merchants these come through paid tiers of WhatsApp Business Premium / Meta One [Fact](https://techwireasia.com/2026/06/meta-business-agent-whatsapp-southeast-asia/), [Fact via BSP](https://360dialog.com/blog/?p=1433).
- On the Business App path, enabling the agent pauses away messages and keyword automations; they resume when the agent exits a chat [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Morning briefing** (early access, waitlist): summary of chats missed overnight with insights. Status: limited early access on WhatsApp Business app, Instagram Pro, Messenger and Meta Business Suite [Fact](https://about.fb.com/news/2026/06/meta-business-agent/).
- **Announced, no date:** market research, product insights, calendar connections, competitive intelligence; discovery of agent-powered businesses through WhatsApp search and shared contact cards ("soon") [Fact](https://about.fb.com/news/2026/06/meta-business-agent/).

**B. Meta Business Agent Platform (API path; launched 1 July 2026)** [Fact via BSP](https://360dialog.com/blog/?p=1433)
- **Agent Knowledge API:** four source types. Business Info (structured: payment methods, shipping, returns), FAQs (Q and A pairs), Files (unstructured), Websites (crawled periodically) [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities).
- **Instructions:** agent instructions (tone, priorities, response patterns, in natural language) and UI instructions (when to send interactive components such as lists and buttons) [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities). Meta also calls these "skills" [Fact](https://developers.facebook.com/documentation/meta-business-agent/overview).
- **Connectors and connector tools:** a connector declares an external API base URL and auth method; a connector tool declares an operation and its request schema. Example domains: commerce (catalog, inventory, order status), customer (history, tickets, contacts), productivity (documents, calendars, projects), scheduling [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities). Named prebuilt integrations: Shopify, Zendesk, Shopee; "hundreds of systems" claimed [Vendor claim](https://about.fb.com/news/2026/06/meta-business-agent/).
- **Webhooks:** your app can subscribe to events and act (book, confirm payment) [Fact](https://developers.facebook.com/documentation/meta-business-agent/overview).
- **Agent events:** your system sends a business update of a custom event type (description plus payload); the agent writes and sends the customer message. Async, returns `accepted`, status queryable [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities).
- **Agent settings:** status; handoff policy and message (`handoff.message`, `message_selection` = CUSTOM / AGENT / DEFAULT); follow-up policy with fixed intervals of 0, 300, 900, 1800, 3600, 7200, 28800 or 86400 seconds; `ai_audience` = EVERYONE or ALLOWLISTED_ONLY plus an Allowlist endpoint; `never_say_phrases` [Fact via BSP](https://360dialog.com/blog/?p=1433), [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities).
- **Thread control:** agent is primary; your app is standby and receives copies, delivery and read receipts. Your app takes control by sending a message; returns it with the Thread Control release action ("pass" not accepted). `messaging_handovers` webhook fires on change [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Automatic handoff** on low confidence, integrity violation, or customer asking for a human. Triggers are not configurable [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities).
- **Inbound understanding:** text, images with captions, voice notes via transcript (enabled per number by a Meta rep), stickers, reactions, location, button and list replies, catalog orders. It cannot read video, non-voice audio or documents (PDF, CSV, Office); customer documents never enter knowledge [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities).
- **Language:** auto-detects and replies in kind, falls back to the primary language; no language setting; English strongest; product names not translated [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities).
- **Agent Test** (free test messages) and **Agent Eval** (conversation- and turn-level quality scores across scenarios) [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities), [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Insights endpoint:** one consumer's most recent conversation at a time [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Eligibility endpoint:** `GET .../agent_eligibility` per phone number returns `is_eligible` [Fact via BSP](https://360dialog.com/blog/?p=1433).
- Channel: the platform API documents WhatsApp only, though Meta announces Messenger and Instagram generally [Fact](https://developers.facebook.com/documentation/meta-business-agent/overview).

**C. WhatsApp Business Platform (the underlying messaging product)**
- Cloud API, BSPs, Embedded Signup; message categories marketing, utility, authentication, service; the 24-hour customer service window and the 72-hour free entry point window (from click-to-WhatsApp ads) [Fact](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/).
- Paid messaging reached a US$2B annual run rate (disclosed December 2025) and the small-business user base passed 200 million [Fact, reported](https://techwireasia.com/2026/06/meta-business-agent-whatsapp-southeast-asia/).

**D. Meta Enterprise Platform (28 Sep 2026)** [Fact](https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/)
- **Muse agent:** an autonomous business and personal agent that runs multi-step background tasks [Fact, reported](https://www.infoworld.com/article/4228532/metas-next-big-ai-bet-is-enterprise-its-biggest-hurdle-may-be-trust-2.html). Launched early September 2026 and briefly topped US and Canadian app charts [Fact, reported](https://techcrunch.com/2026/09/29/meta-is-expanding-its-ai-agent-muse-to-small-businesses/).
- **Muse for Small Business (29 Sep 2026):** connects to Instagram professional analytics, Facebook Pages and Meta ad accounts, learns what the business sells, its voice and common questions, and connects to Shopify, Dropbox, Slack, Asana, Box, Canva, Figma, Granola, HighLevel, Intuit QuickBooks, Klaviyo, Lovable, Notion, Stripe and Zoom. Free with usage limits; paid subscription for more [Fact, reported](https://techcrunch.com/2026/09/29/meta-is-expanding-its-ai-agent-muse-to-small-businesses/). **Note: QuickBooks and Stripe connectors mean Muse can, in principle, read a small firm's invoices** [Inference].
- **Muse API:** developer access to the Muse stack; **Muse Code:** coding agent for large codebases [Fact, reported](https://www.infoworld.com/article/4228532/metas-next-big-ai-bet-is-enterprise-its-biggest-hurdle-may-be-trust-2.html). Underlying model: Muse Spark, first model of Meta Superintelligence Labs, April 2026, multimodal with parallel sub-agents [Fact, reported](https://www.infoworld.com/article/4228532/metas-next-big-ai-bet-is-enterprise-its-biggest-hurdle-may-be-trust-2.html).
- No pricing, controls, data-handling terms or named customers published [Fact](https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/). Analysts cite early Muse privacy problems and zero-day vulnerabilities [Fact, reported](https://www.infoworld.com/article/4228532/metas-next-big-ai-bet-is-enterprise-its-biggest-hurdle-may-be-trust-2.html).

**E. Forward-deployed "Enterprise Solutions" team.** I found no primary source describing it in this session; the Meta newsroom posts read do not mention it [Unverified].

**F. Manus**
- Product: a general-purpose autonomous agent (web, desktop for macOS and Windows, iOS, Android, "Manus 2.0"), with AI slides, design, image, music and video generation, Wide Research (parallel sub-agents), Slack integration, an API (open.manus.ai), Team plan with SSO, and a "Cue" product (cue.im) [Fact, nav links only](https://manus.im/blog/manus-resumes-independent-operations). Current plan prices did not load (dynamic page) [Fact](https://manus.im/pricing). Earlier, Manus sold credit-based tiers of roughly $19, $39 and $199 per month [Unverified, 2025].
- Business: $100M ARR and $125M revenue run-rate (17 Dec 2025) [Fact, from 12-agent-companies.md](https://manus.im/blog).
- What changed: Meta announced the acquisition (reported over $2B) in December 2025; Manus capabilities were integrated into products including Instagram and staff got Meta access in Singapore; Beijing ordered the deal unwound in April 2026; Meta firewalled shared tools and data; Manus announced separation in August 2026 and deleted some users' data created on or after 29 Dec 2025 "to comply with regulations in specific jurisdictions"; data stays in the US and Singapore; Tencent was reported in talks to become largest shareholder (July 2026) [Fact, reported](https://eweek.com/news/meta-manus-ai-deal-china-unwind-apac/). Manus "formally resumed independent operations" on 1 September 2026, founding team leading; some users lost access temporarily and had to restore backups [Fact](https://manus.im/blog/manus-resumes-independent-operations).
- [Inference] Meta's Business Agent does not depend on Manus, and Manus is now a separate vendor and a possible competitor in "do the task for me" agents for SMEs.

#### 1.3 How it works underneath

- **Configuration model.** One agent per WhatsApp number; it is "primary responder" once enabled. Its configuration is five resources: Knowledge (business info, FAQs, files, websites), Instructions (agent and UI), Connectors and Connector tools (base URL, auth, operation schemas), Agent settings (status, handoff, follow-up, audience, never-say phrases), and Events (custom types) [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities), [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Procedures and rules capture** is natural-language instructions plus a phrase blocklist. There are no typed business rules, no metric definitions and no per-action approval policies in the published docs [Inference from the capabilities page].
- **Request flow (inbound):** customer message, then Meta's agent (Meta-hosted model), optional connector tool call to the business's API, reply. The business app gets a standby copy. **Outbound:** business posts an agent event, the agent composes the message [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities).
- **Permissions:** a Meta app with `whatsapp_business_messaging`; an Admin system user in Business Suite assigned to the app and WABA; a system-user token (direct) or BISU token (BSPs and Tech Providers); the client accepts the Business Agent ToS and the BSP accepts the Tech Provider ToS [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Testing:** Agent Test messages are free; ALLOWLISTED_ONLY mode lets a business test with chosen consumers before a payment method exists [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Disable/enable semantics:** disabling stops the agent on all threads; re-enabling applies only to new threads [Fact via BSP](https://360dialog.com/blog/?p=1433).

#### 1.4 Commercials

- **Business Agent messages (from 1 Aug 2026):** $2.00 per million tokens, single global rate covering AI and delivery; typical message 20,000 to 25,000 tokens (about 4 to 5 US cents); simple 4-message enquiry about 16 to 20 cents, complex 10-message one about 40 to 50 cents; no free window [Fact](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/). Input and output tokens charged, cache tokens free [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Billing:** monthly credit line with Meta; Visa and Mastercard from 8 Sep 2026; Meta invoices the business directly, bypassing the BSP; 14 currencies for agent billing including MYR, IDR and SGD, at the USD rate times the daily FX rate [Fact](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/), [Fact via BSP](https://360dialog.com/blog/?p=1433).
- **Service messages (from 1 Oct 2026):** per message at the market's utility/authentication rate; free in the 72-hour entry window; 1,000 free per number per month (BSP report). Brazil reference 0.68 US cents [Fact](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/).
- **Utility templates in an open 24-hour window:** charged per message from 1 Oct 2026, volume tiers apply [Fact](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/). Malaysian per-message rates were not read this session [Unverified].
- **Scale:** over 1M businesses on the agent; over 1B daily active business threads across the three apps [Vendor claim](https://about.fb.com/news/2026/06/meta-business-agent/).
- **Named customers with results:** none in the sources read [Fact, absence].
- **Availability:** "businesses of all sizes globally" [Vendor claim](https://about.fb.com/news/2026/06/meta-business-agent/), but the platform path requires an "authorized country" and Meta publishes no list; use the eligibility endpoint [Fact via BSP](https://360dialog.com/blog/?p=1433). Trials ran for nearly two years, first in India and Mexico; Malaysia and Indonesia are named as key informal-commerce markets; Bahasa Melayu, Thai, Vietnamese and code-switching quality are unconfirmed [Fact, reported](https://techwireasia.com/2026/06/meta-business-agent-whatsapp-southeast-asia/).

#### 1.5 Why customers choose it

1. It sits where customers already are. In Malaysia and Indonesia, chat commerce runs on WhatsApp [Fact, reported](https://techwireasia.com/2026/06/meta-business-agent-whatsapp-southeast-asia/).
2. One bill for AI and delivery; may be structurally cheaper than a third-party bot plus Meta's delivery fee [Fact, analyst](https://omdia.tech.informa.com/om146764/the-whatsapp-free-lunch-is-over-and-meta-is-also-coming-for-the-ai-layer).
3. Free to start and minutes to set up for small merchants [Fact](https://about.fb.com/news/2026/06/meta-business-agent/).
Complaints and risks: trust in Meta's data stewardship and its history of dropping enterprise products [Fact, analyst](https://www.infoworld.com/article/4228532/metas-next-big-ai-bet-is-enterprise-its-biggest-hurdle-may-be-trust-2.html); thin analytics (one conversation at a time), no configurable handoff triggers, no documents in, excluded verticals [Fact](https://developers.facebook.com/documentation/meta-business-agent/capabilities); BSPs squeezed by the October price changes [Fact, analyst](https://omdia.tech.informa.com/om146764/the-whatsapp-free-lunch-is-over-and-meta-is-also-coming-for-the-ai-layer).

#### 1.6 How it deploys

Platform path, seven steps: accept ToS in WhatsApp Manager; attach a payment method in Billing Hub; create an Admin system user; assign app and WABA; generate token; subscribe the app to the WABA; subscribe to `messages`, `standby` and `messaging_handovers` webhooks. Then load knowledge, instructions and connectors, test with the allowlist, and enable [Fact via BSP](https://360dialog.com/blog/?p=1433). Business App path: switch on from the app [Fact](https://about.fb.com/news/2026/06/meta-business-agent/). Self-serve for both; larger firms go through BSPs.

#### 1.7 What to copy (Meta)

1. The five-resource agent configuration: knowledge, instructions, connectors with typed tool schemas, settings, events. https://developers.facebook.com/documentation/meta-business-agent/capabilities
2. **Agent events** as the outbound trigger: system posts `{type, description, payload}`, agent writes the message, async status. Use it for "invoice due in 3 days", "invoice 14 days overdue", "payment received". https://developers.facebook.com/documentation/meta-business-agent/capabilities
3. Thread control with an explicit owner (agent or human app), standby copies to the non-owner, and a handover webhook. https://360dialog.com/blog/?p=1433
4. Allowlist mode (`ALLOWLISTED_ONLY`) to run the agent on chosen customers first, which doubles as a pilot mechanism. https://360dialog.com/blog/?p=1433
5. A `never_say_phrases` list as a hard output filter, plus fixed follow-up intervals. https://360dialog.com/blog/?p=1433
6. Explicit list of input types the agent cannot read, with a fallback reply. https://developers.facebook.com/documentation/meta-business-agent/capabilities
7. Price tokens transparently with worked examples per conversation size. https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/

#### 1.8 Weak points; what not to copy

- Rules captured only as prose instructions; no typed rules, approvals or metrics.
- Handoff triggers not configurable; for collections, the business must control when a human takes over (disputes, hardship, legal threats) [Inference].
- Analytics limited to one conversation at a time.
- Opaque country eligibility.

#### 1.9 Relationship to the founder

**Supplier and potential competitor.** Supplier: WhatsApp is the reminder channel; the founder will pay Meta per utility template (and per token if he used Meta's agent). Competitor: if Meta adds a ledger connector (Muse already lists QuickBooks and Stripe), a "payment follow-up" event is a small step. Partner option: use Meta Business Agent as the conversational front end and the founder's model as the connector it calls, but the Finance-vertical exclusion and Meta's own model in the loop limit control [Inference].

---

### 2. Salesforce Agentforce (Agentforce 360)

**In one paragraph.** Salesforce sells agents that run inside its CRM, service, sales, commerce, marketing and Slack products, built on Data 360 (formerly Data Cloud) and the Atlas reasoning engine. Buyers are CIOs, heads of service and sales operations at large enterprises already on Salesforce. The job is resolving customer cases, qualifying leads, and assisting employees with Salesforce data. The result they pay for is case deflection and staff hours. [Inference from product scope; pricing page below.]

**Function catalogue** (as Salesforce groups it; pricing page read 21 Nov 2026 [Fact](https://www.salesforce.com/agentforce/pricing/), other items from `11-context-layer-products.md` or [Unverified]):
- *Agent types:* customer-facing agents (service, self-service portal, commerce), employee-facing agents, Agentforce Voice, Agentforce Coworker ("AI teammate", $50 per user per month), Slackbot, Agentforce Vibes (developer tool), field service agents [Fact](https://www.salesforce.com/agentforce/pricing/). Role agents named in 2025: SDR, Sales Coach, Service Agent, Commerce, Marketing campaigns [Unverified].
- *Build:* Agentforce Builder, Prompt Builder, Agent Script (DSL with `->` deterministic logic and `|` LLM text; topics renamed "subagents" from April 2026) [Fact](https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html). Actions are Flows, Apex, prompt templates, MuleSoft APIs [Unverified].
- *Reasoning:* Atlas reasoning engine: event-driven, graph-based workflows, YAML-declared agents, typed module interfaces [Fact](https://engineering.salesforce.com/inside-the-brain-of-agentforce-revealing-the-atlas-reasoning-engine/).
- *Test:* Testing Center with topic, action and outcome checks, synthetic test generation [Fact](https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce).
- *Run and govern:* Command Center (agent observability), Einstein Trust Layer (masking, zero retention with model providers, toxicity checks), Digital Wallet usage tracking with thresholds [Fact for Digital Wallet](https://www.salesforce.com/agentforce/pricing/); others [Unverified].
- *Data:* Data 360 (zero-copy, identity resolution), Tableau Semantics, and Agent Context Engine (preview, 20 Oct 2026) [Vendor claim](https://www.salesforce.com/blog/?p=157012).

**Commercials** [Fact](https://www.salesforce.com/agentforce/pricing/), page last modified 20 Nov 2026:
- Flex Credits: $500 per 100,000 credits ($0.005 each); an action costs 20 credits (about $0.10), a Voice action 30 (about $0.15). PayGo or Pre-Commit.
- Conversations: $2 per conversation, customer-facing only, cannot mix with Flex Credits in one org.
- Per user: Agentforce User License $5 per month (requires credits); add-ons for Sales, Service, Field Service $150 per user per month (unmetered employee use); Industries add-ons $175; Max Edition from $550 per user per month with 2.75M credits per org per year; Foundations free (includes Builder and Agent Script). Data 360 credits extra.
- Customer counts: Salesforce reported about 18,500 Agentforce deals and Agentforce ARR near $540M for the quarter to October 2025 [Unverified, from Q3 FY26 results recalled]. Later figures not read.
- **Collections:** no Agentforce collections agent was found in sources read. Financial Services Cloud has collections and recovery features for lenders [Unverified].

**Why chosen:** it acts on the CRM record the company already trusts; Agent Script mixes deterministic steps and LLM reasoning; testing tooling. **Complaints:** pricing changed three times in a year (conversation, credits, seats) [Inference from the pricing page's coexisting models]; value depends on Data 360 spend.

**Deploys:** admin-led inside an existing org; Foundations gives free builder access; larger rollouts via SIs [Unverified].

**Copy:** (1) Agent Script's split of deterministic and LLM instructions [source above]; (2) the Testing Center triple: expected topic, expected action, expected outcome; (3) a usage wallet with threshold alerts (https://www.salesforce.com/agentforce/pricing/); (4) price per action as well as per conversation, so customers can map spend to work.
**Don't copy:** three overlapping pricing schemes; requiring a data-cloud purchase to make agents useful.
**Relationship:** teacher; competitor only where a mid-sized firm already runs Salesforce for receivables (rare) [Inference].

---

### 3. Microsoft: Copilot Studio, Microsoft 365 Copilot agents, Dynamics 365 agents, Agent 365, Foundry Agent Service

**In one paragraph.** Microsoft sells agents everywhere its customers already work: in Microsoft 365 (Copilot chat, Researcher and Analyst agents, Teams, Outlook), in Dynamics 365 business applications, and as building blocks for developers (Foundry). Buyers are CIOs and IT admins in organisations of every size on Microsoft 365. The job is employee productivity and process automation; the result paid for is hours saved per seat. [Inference]

**Function catalogue** (read this session only where linked; rest [Unverified] from prior knowledge):
- *Microsoft 365 Copilot* ($30 per user per month for enterprise; a Business SKU for SMB announced late 2025 [Unverified]): chat grounded in Microsoft Graph, Researcher and Analyst reasoning agents, agents in Teams and SharePoint, Agent Store [Unverified].
- *Copilot Studio:* low-code agent builder with topics, knowledge, actions (Power Platform connectors, 1,000+), autonomous triggers, MCP; billed in Copilot Credits (packs of 25,000 per month for about $200, or pay-as-you-go) [Unverified; the pricing page fetch failed at the rate limit].
- *Agent 365* (announced Ignite, November 2025): a control plane to register, govern, secure and observe agents, with Entra Agent ID as each agent's identity [Unverified]. The Agent 365 MCP server reference exists in Microsoft Learn and exposes e.g. Fabric IQ ontology tools [Fact](https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric).
- *Foundry Agent Service:* hosted runtime for developer-built agents with tools, memory, evaluation, multi-agent workflows; Foundry IQ knowledge bases [Unverified; Foundry IQ named in 11-context-layer-products.md].
- *Dynamics 365 agents:* Sales qualification and research agents, Customer Intent and Case management agents in Customer Service, Supplier Communications agent in Supply Chain; Business Central Sales Order agent, Payables agent [Fact for Payables agent setup page existing](https://learn.microsoft.com/ja-jp/dynamics365/business-central/payables-agent-setup), and an Expense agent planned in 2026 wave 1 [Fact, page title](https://learn.microsoft.com/en-us/dynamics365/release-plan/2026wave1/smb/dynamics365-business-central/manage-expenses-business-central-using-expense-agent).
- *Collections:* Dynamics 365 Finance has an AI "collections coordinator summary" in the Collections workspace [Fact, page title](https://learn.microsoft.com/hr-hr/dynamics365/finance/accounts-receivable/collections-coordinator-summary-faq); Business Central has automated reminder processing and "Copilot for Finance" collections help [Fact, page titles](https://learn.microsoft.com/en-us/dynamics365/release-plan/2024wave1/smb/dynamics365-business-central/empower-collections-team-copilot-finance-business-central); Microsoft 365 Copilot finance agents include an accounts-receivable team scenario (2025 wave 1) [Fact, page title](https://learn.microsoft.com/en-us/copilot/release-plan/2025wave1/copilot-finance/manage-accounts-receivable-teams). The "Collections agent" in Microsoft's adoption library is a Copilot Studio scenario "for demonstration purposes only": monitor payment behaviour and risk, rank overdue accounts, propose strategies for disputes, alert on at-risk accounts, draft personalised follow-up emails [Fact](https://adoption.microsoft.com/en-gb/scenario-library/finance/collections-agent/).

**Copy:** a single agent registry with per-agent identity (Agent 365 / Entra Agent ID) [Unverified]; the five-step collections scenario as a feature checklist [Fact, link above].
**Don't copy:** dependence on a seat licence before an agent is useful.
**Relationship:** supplier (Outlook/Teams are channels; M365 Copilot connectors are a route to finance staff), competitor at the low end via Business Central and Copilot Studio templates [Inference].

---

### 4. Google: Gemini Enterprise, Customer Engagement Suite, Agent Development Kit, agent marketplace

All [Unverified] unless linked; Google pages were not read this session because of the fetch limit.
- *Gemini Enterprise* (launched 9 Oct 2025, successor to Agentspace): one front door for staff with prebuilt agents (Deep Research, NotebookLM, Code Assist), no-code Agent Designer, connectors to Workspace, Microsoft 365, Salesforce, SAP, and an agent gallery; Business edition about $21 per seat per month, Standard/Plus about $30 [Unverified]. Deep Research Agent uses Knowledge Catalog [Vendor claim](https://cloud.google.com/blog/products/data-analytics/introducing-the-google-cloud-knowledge-catalog).
- *Customer Engagement Suite:* Conversational Agents (Dialogflow successor) for chat and voice, Agent Assist for human agents, Conversational Insights, and Google's CCaaS [Unverified].
- *Agent Development Kit (ADK):* open-source framework (April 2025) for multi-agent systems, deployable on Vertex AI Agent Engine; A2A (agent-to-agent) protocol, later donated to the Linux Foundation; AP2 (Agent Payments Protocol, Sept 2025) [Unverified].
- *Marketplace:* AI agents sold through Google Cloud Marketplace and listed in Gemini Enterprise [Unverified].
- Context layer: Knowledge Catalog context sets, LookupContext and self-learning enrichment [Fact](https://docs.cloud.google.com/knowledge-catalog/docs/context-sets) (details in `11-context-layer-products.md`).
- No Google receivables agent found [Unverified].
**Copy:** LookupContext's single call with a character budget (see file 11). **Relationship:** supplier (Gemini models, Gmail as channel, ADK/A2A for interop), teacher.

---

### 5. Amazon: Bedrock AgentCore, Amazon Connect, Quick Suite

All [Unverified] (not read this session).
- *Bedrock AgentCore* (preview July 2025, GA October 2025): Runtime (session-isolated, long-running), Memory (short- and long-term), Gateway (turns APIs and Lambda functions into MCP tools), Identity (agent identity and OAuth to third parties), Code Interpreter, Browser, Observability; Policy and Evaluations added at re:Invent (December 2025). Model-agnostic and framework-agnostic; consumption pricing per vCPU-hour, memory GB-hour, gateway call.
- *Amazon Connect:* cloud contact centre with agentic self-service on voice and chat, agent assist, and per-minute/per-message pricing; WhatsApp and SMS channels.
- *Quick Suite* (October 2025): Quick Sight (BI), Quick Research, Quick Flows (personal automations), Quick Automate (enterprise process automation), Quick Index; about $20 per user per month (Professional) and $40 (Enterprise).
**Copy:** AgentCore's separation of runtime, memory, gateway, identity and policy as independent services. **Relationship:** supplier (hosting, Bedrock models including Claude), teacher.

---

### 6. ServiceNow AI Agents and AI Control Tower

[Unverified] except where linked. ServiceNow sells AI Agents inside its Now Platform for IT, HR, customer service and finance operations workflows, with AI Agent Studio, AI Agent Orchestrator, and AI Control Tower (announced Knowledge, May 2025) as a governance hub for all agents and models, including third-party ones. It acquired Moveworks (announced March 2025, about $2.85B) for employee-facing agents and data.world for its knowledge-graph catalog [Fact for data.world](https://www.techtarget.com/searchitoperations/news/366623687/ServiceNow-digs-deeper-into-data-for-AI-with-Dataworld-buy). Its Knowledge Graph tool returns table, columns and each record's `sysId`, so a later action can operate on the same records [Fact](https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html). Licensing is via Pro Plus / Pro "assist" packs [Unverified]. ServiceNow Finance Operations has collections workflow features [Unverified]. **Copy:** return record IDs from every read so actions act on the same records; a control tower that inventories every agent with owner, scope and metrics. **Relationship:** teacher.

---

### 7. Workday agents and Agent System of Record

[Unverified] except where linked. Workday announced the Agent System of Record (February 2025) to manage Workday and third-party agents like workers: onboarding, roles, permissions, cost and performance. Illuminate agents include Recruiting, Talent Mobility, Payroll, Policy, Contracts, Financial Auditing and Expense agents; it bought Sana, Paradox and Flowise in 2025. Workday Data Cloud (16 Oct 2026) adds 240+ curated business objects, a Context Layer with semantic models over MCP, Agent-Ready Tools through an Agent Gateway, and Contextual Security based on the person's relationship to the data [Vendor claim](https://blog.workday.com/en-us/four-layers-workday-data-cloud.html). **Copy:** treat each agent as a managed "worker" with a role and a cost line; relationship-based access. **Relationship:** teacher; Workday Financials customers are larger than the founder's target [Inference].

---

### 8. SAP Joule agents

**In one paragraph.** SAP embeds Joule agents in S/4HANA, SuccessFactors, Ariba and other SAP applications. Buyers are CFOs and finance-transformation leads at large enterprises on SAP. For receivables the job is to cut DSO and collector effort.

**Receivables agents (Joule Accounts Receivable Assistant)** [Fact](https://www.sap.com/use-cases/joule-assistant/accounts-receivable-ai):
1. Accounts Receivable Orchestration Agent: coordinates the others.
2. Collection Account Preparation Agent: account insights before a collector's call.
3. Collections Email Outreach Agent: sends personalised collection emails.
4. Dispute Creation Agent: creates dispute cases from emails or Joule prompts, checks documents and duplicates.
5. Dispute Resolution Agent: open disputes with context and recommended next action.
6. Dunning Insights Agent: payment-history analysis and recommendations.
7. Receivable Account Analysis Agent: balances, invoices, aging, disputes, dunning levels.
8. Receivables and Payables Clearing Agent: AI matching and aging-pattern analysis to recommend clearings.

Status: no GA date; SAP's finance assistants roll out through early-adopter programmes and GA releases through Q1 2027 [Fact, reported](https://www.pymnts.com/?p=4328429). Named adopter: Nestlé, which will use it to rank overdue invoices by risk and recommend next steps on an S/4HANA estate spanning 140 countries [Fact, reported](https://www.pymnts.com/?p=4328429). No quantified results; pricing via SAP AI units [Unverified]. Customer size: very large enterprise.

**Copy:** the eight-way decomposition of receivables work (above) as the founder's internal-face feature map; dispute creation as a first-class step with duplicate checks. **Relationship:** teacher; not a competitor for firms of 100 to 1,000 staff unless they run S/4HANA Cloud [Inference].

---

### 9. Oracle AI agents for Fusion

Oracle lists Fusion Agentic Applications (12 ERP, 7 HCM, 6 CX "workspaces" and "command centers") and AI agents embedded in Fusion modules [Fact](https://www.oracle.com/in/applications/fusion-ai/ai-agents/), page updated 18 Nov 2026.
- **Receivables-related:** Collectors Workspace (LLM support for collections teams: contextual risk analysis, next-best action, automated outreach) and Cash Processing Agent (creates receipts from bank statement lines; matches remittance advices to receipts with exception handling). No dedicated dispute or customer-payment agent [Fact](https://www.oracle.com/in/applications/fusion-ai/ai-agents/). Oracle Customer Connect has an "ERP Receivable Response Action Agent" example built in AI Agent Studio [Fact, page title, login wall](https://community.oracle.com/CustomerConnect/discussion/904524/ai-agent-studio-inspiration-series-introduction-part-2-erp-receivable-response-action-agent).
- **Finance:** Expenses, Ledger, Payables, Payments agents; EPM Account Reconciliation, Planning and PCM agents; risk advisors.
- **AI Agent Studio:** agent ROI dashboard, agentic app builder, patterns, marketplace (partner agents "in minutes"), contextual memory, human-in-the-loop, MCP and A2A, LLM choice, monitoring, native business objects, templates, testing [Fact](https://www.oracle.com/in/applications/fusion-ai/ai-agents/).
- Pricing: not stated on the page; Oracle has said embedded agents come at no extra cost to Fusion subscribers [Unverified]. Named customers: ADT, Northwell Health, Spectrum (no figures) [Fact].
**Copy:** an "agent ROI dashboard" as a standard screen. **Relationship:** teacher.

---

### 10. Intuit QuickBooks agents

**In one paragraph.** Intuit embeds agents in QuickBooks Online and Intuit Enterprise Suite for US small and mid-sized businesses. Buyers are owners and bookkeepers. The Payments agent's job is getting paid sooner.

- **Payments agent ("Payments AI")** [Fact](https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US): suggests payment methods per customer (card, ACH, PayPal, Venmo); for overdue invoices suggests a reminder schedule for approval and drafts an editable reminder with invoice number, customer and due date; suggests a late fee; drafts the invoice email; builds invoices from a file, image or text; builds estimates from Gmail/Outlook negotiation emails. US only; QuickBooks Online Essentials, Plus, Advanced or Intuit Enterprise Suite (the July 2025 launch note said not in Advanced; the help page now lists it) [Fact](https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/). Claimed result: paid "an average of 5 days faster" with AI-drafted reminders (US beta, Jan to Aug 2024) [Vendor claim](https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/). No separate price.
- **Accounting agent** (categorisation, reconciliation), **Finance agent** (reporting, KPIs, scenario planning, forecasting, benchmarks for mid-market), **Customer agent** (leads, replies, meetings), **Marketing agent** (via Mailchimp), **Payroll agent**, **Project management agent** [Vendor claim](https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/).
- Intuit is a named OpenAI Frontier adopter [Vendor claim](https://openai.com/index/introducing-openai-frontier).
**Copy:** reminder schedule proposed by AI, approved by a human; late-fee suggestion tied to a policy; the "paid X days faster" metric as the headline outcome. **Relationship:** competitor in the US SME segment; data source (connector) for any customer on QuickBooks; QuickBooks has little presence in Malaysia [Inference].

---

### 11. Xero (JAX)

Xero (5 million customers [Vendor claim](https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/)) announced at Xerocon London 2026:
- **Payment Follow Ups** (coming soon): per-customer payment-history analysis and tailored collection plans: consolidated invoices, timed reminders, or switching to SMS.
- **Cash Flow Actions** (beta): preventive plans to protect payroll, delay non-critical bills, bridge gaps; user reviews and executes.
- **Bill Protection** (beta): flags unusual amounts, altered bank details, unfamiliar suppliers.
- **Smart Document Capture**, **Auto Bank Reconciliation**, Partner Hub updates and receipt chasing for accountants.
- **XeroForce** (early access; GA later in 2026): natural-language no-code builder for custom agents connecting Xero to other tools.
- **Claude integration** and **Microsoft 365 Copilot integration** (available) [Fact](https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/).
Earlier JAX updates improved predictions of when customers will pay [Fact, title](https://www.techrepublic.com/article/xero-jax-significant-updates/). Pricing and markets not stated.
**Copy:** per-customer collection plans chosen from payment history, with channel escalation (email then SMS). **Relationship:** competitor for small firms; data source and channel partner (Xero is common among Malaysian SMEs [Unverified]); XeroForce could become a route for third-party agents.

---

### 12. OpenAI, Anthropic, Alibaba (summary)

- **OpenAI.** Frontier (5 Feb 2026): business context as "a semantic layer for the enterprise", agent execution, per-agent identity and permissions, evaluation; limited availability; adopters HP, Intuit, Oracle, State Farm, Thermo Fisher, Uber [Vendor claim](https://openai.com/index/introducing-openai-frontier). AgentKit (October 2025: Agent Builder, ChatKit, Connector Registry, evals), ChatGPT agent (July 2025), apps in ChatGPT via the Apps SDK, ChatGPT Enterprise and Business [Unverified].
- **Anthropic.** Claude Enterprise; Cowork (desktop agent for knowledge work); plugins and Skills; connectors over MCP; Claude Managed Agents with memory stores (100 kB per memory, up to 8 stores per session, versioned, beta) [Fact](https://platform.claude.com/docs/en/managed-agents/memory). Xero data is available in Claude [Fact](https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/). Pricing and other product details [Unverified].
- **Alibaba.** QwenWork (merged July 2026; desktop, cloud and DingTalk surfaces; "digital employees" with owner, duties and authorisation scope; seats with 2,000 pooled credits each) and Bailian (Model Studio: knowledge bases, memory, Managed Agents billed since 17 Aug 2026) [Fact](https://help.aliyun.com/zh/qwenwork/product-faq); full detail in `08-alibaba-stack.md`.
**Relationship:** suppliers of models and agent runtimes; Frontier is the closest conceptual competitor for very large firms.

---

## Receivables, collections and invoice chasing: who ships what (the section that matters most)

| Vendor | Product | What it does exactly | Status / date | Customer size | Price | Source |
|---|---|---|---|---|---|---|
| SAP | Joule Accounts Receivable Assistant (8 agents) | Orchestration; account prep for collector calls; personalised collection emails; dispute creation from emails with document and duplicate checks; dispute resolution next-best-action; dunning insights; AR account analysis (balances, aging, dunning levels); receivables/payables clearing recommendations | No GA date; early adopter to Q1 2027; Nestlé adopting (Oct 2026) | Large enterprise on S/4HANA | Not published (AI units [Unverified]) | [SAP](https://www.sap.com/use-cases/joule-assistant/accounts-receivable-ai), [PYMNTS](https://www.pymnts.com/?p=4328429) |
| Oracle | Collectors Workspace; Cash Processing Agent | Risk analysis, next-best action, automated outreach for collectors; receipts from bank lines, remittance matching | Listed as available, Nov 2026 | Large enterprise on Fusion ERP | Not stated | [Oracle](https://www.oracle.com/in/applications/fusion-ai/ai-agents/) |
| Intuit | QuickBooks Payments agent | Suggests reminder schedule (human approves), drafts reminder, suggests late fee and payment method, drafts invoice emails, autofills invoices | Rolling out since 1 Jul 2025; US only | Small to mid-sized US firms | Included in QBO Essentials/Plus/Advanced, IES | [Intuit help](https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US), [Intuit news](https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/) |
| Xero | JAX Payment Follow Ups | Per-customer collection plan from payment history: consolidate invoices, timed reminders, switch to SMS | Coming soon (Xerocon London 2026) | Small businesses | Not stated | [Xero](https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/) |
| Microsoft | Collections agent scenario (Copilot Studio); D365 Finance collections coordinator summary; Business Central reminders; M365 Copilot finance AR scenario | Monitor payment risk, rank overdue accounts, propose dispute tactics, alert, draft follow-up emails (scenario is demo only) | Scenario: demonstration; D365/BC features shipped 2023 to 2025 | Any size on Dynamics / M365 | Copilot Studio credits; D365 licences [Unverified] | [Microsoft adoption](https://adoption.microsoft.com/en-gb/scenario-library/finance/collections-agent/) |
| Salesforce | None found as an Agentforce agent | (Financial Services Cloud collections for lenders [Unverified]) | n/a | n/a | n/a | — |
| Meta | None | Business Agent has no ledger; Finance vertical excluded; Agent events could carry reminders | n/a | n/a | WhatsApp utility templates per message | [Meta](https://developers.facebook.com/documentation/meta-business-agent/overview) |
| Google, Amazon, ServiceNow, Workday, OpenAI, Anthropic, Alibaba | None found | Generic builders can be used to make one | n/a | n/a | n/a | [Unverified] |

[Inference] The gap: firms of 100 to 1,000 staff in Southeast Asia that use a mid-market or local accounting system, chase by email and WhatsApp, and have no SAP or Oracle. SAP and Oracle prove the job decomposition at the top; Intuit and Xero prove "paid faster" at the bottom; nobody serves the middle across ledgers with WhatsApp as a first-class channel.

---

## What to copy

1. **Receivables feature map from SAP's eight agents**: account analysis, collector prep, outreach, dunning insights, dispute creation (with duplicate and document checks), dispute resolution, clearing recommendations, orchestration. https://www.sap.com/use-cases/joule-assistant/accounts-receivable-ai
2. **Outbound via typed events**: the ledger or scheduler posts `{event_type, description, payload}`; the agent composes the message; async status. https://developers.facebook.com/documentation/meta-business-agent/capabilities
3. **Human-approved reminder schedules** proposed by AI, plus policy-based late fees that apply only after the policy exists. https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US
4. **Per-customer collection plans with channel escalation** (email, then SMS/WhatsApp; consolidate invoices). https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/
5. **Thread ownership with standby copies and a handover webhook**, so finance staff can take over a chat cleanly. https://360dialog.com/blog/?p=1433
6. **Allowlist pilot mode** (agent talks only to chosen debtors at first). https://360dialog.com/blog/?p=1433
7. **Never-say phrase list** enforced on outbound messages (important for collections law and tone). https://360dialog.com/blog/?p=1433
8. **Per-action price unit** alongside per-conversation, with a usage wallet and threshold alerts. https://www.salesforce.com/agentforce/pricing/
9. **Test triple: expected topic, action, outcome** before go-live. https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce
10. **Headline outcome metric "paid N days faster"** measured against a control group of standard reminders. https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/
11. **Return record IDs from every read**, so later actions operate on the same invoice or customer. https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html
12. **Model WhatsApp costs per message category** (utility templates for reminders, service replies, free windows) in the founder's own pricing. https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/

## What cannot or should not be copied

- Meta's distribution (a billion daily business threads) and its ability to price AI and delivery as one line. Not copyable.
- ERP-native agents (SAP, Oracle) rely on owning the ledger; the founder must connect to ledgers instead.
- Rules as prose only (Meta). Collections needs typed rules: who may be contacted, when, by which channel, with which tone, and when a human must take over.
- Non-configurable handoff triggers (Meta). Disputes, hardship and legal threats must route to humans by rule.
- Three coexisting pricing schemes (Salesforce).

## Open questions and unverified items

- Meta: authorised-country list; Malaysian utility and service rates after 1 Oct 2026; Enterprise Solutions / forward-deployed team; named customers; Business Agent paid tiers; Muse API and Enterprise Platform pricing and data terms.
- Whether a manufacturer sending invoice reminders through Meta's agent counts as "Finance" vertical.
- Manus current plan prices.
- Microsoft Copilot Studio, Agent 365, Dynamics 365 agent details and prices; Google Gemini Enterprise, CES and ADK; Amazon AgentCore, Connect and Quick Suite; ServiceNow and Workday: all from prior knowledge, not re-read.
- Salesforce Agentforce customer numbers after October 2025; any Agentforce collections agent.
- SAP AI-unit pricing for receivables agents; Oracle agent pricing.
- Xero Payment Follow Ups release date, markets and price.

## Comparison table

| Company | Main agent offer | Buyer / size | Build surface | Knowledge and rules capture | Channels | Pricing unit | Receivables agent? | Relationship |
|---|---|---|---|---|---|---|---|---|
| Meta | Business Agent, Business Agent Platform, Muse | SMB (app) to large (API) | API + app toggle | Knowledge API, prose instructions, connectors, never-say list | WhatsApp, Messenger, Instagram | $2 per M tokens; per message | No | Supplier, potential competitor |
| Salesforce | Agentforce 360 | Large, on Salesforce | Builder, Agent Script, Testing Center | Topics/subagents, Flows, Data 360, Tableau Semantics | Web, voice, Slack, messaging | $2/conv; $0.10/action; $5 to $550 per user | No (found) | Teacher |
| Microsoft | Copilot Studio, M365 Copilot, D365 agents, Agent 365, Foundry | All sizes on M365 | Low-code + pro-code | Topics, knowledge, Power connectors, Fabric IQ | Teams, Outlook, web | Seats + credits [Unverified] | Partial (features, demo scenario) | Supplier, low-end competitor |
| Google | Gemini Enterprise, CES, ADK | All sizes on GCP/Workspace | Agent Designer, ADK | Knowledge Catalog context sets | Workspace, web, voice | Seats [Unverified] | No | Supplier, teacher |
| Amazon | AgentCore, Connect, Quick Suite | Builders, contact centres | AgentCore services | Memory, Gateway, Policy | Connect voice/chat, WhatsApp | Consumption, seats [Unverified] | No | Supplier |
| ServiceNow | AI Agents, Control Tower | Large | AI Agent Studio | Knowledge Graph with sysIds | Portal, chat | Packs [Unverified] | No (found) | Teacher |
| Workday | Illuminate agents, ASOR | Large | Agent Gateway, Data Cloud | 240+ objects, contextual security | Workday | [Unverified] | No (found) | Teacher |
| SAP | Joule agents | Very large, S/4HANA | Joule Studio | ERP data | Email, Joule | AI units [Unverified] | **Yes, 8 agents** | Teacher |
| Oracle | Fusion agents, AI Agent Studio | Large, Fusion | Agent Studio | Native business objects | Fusion | Not stated | **Yes (collectors workspace, cash processing)** | Teacher |
| Intuit | QuickBooks agents | US SMB | none (embedded) | Ledger | Email | Bundled | **Yes (Payments agent)** | Competitor (US), connector |
| Xero | JAX, XeroForce | SMB | XeroForce (early access) | Ledger | Email, SMS | Bundled [Unverified] | **Coming (Payment Follow Ups)** | Competitor, connector |
| OpenAI / Anthropic / Alibaba | Frontier, AgentKit; Claude Enterprise, Managed Agents; QwenWork, Bailian | All | Platforms | Semantic layer (Frontier); memory stores | Various | Tokens, seats | No | Suppliers |

## Sources (ranked by usefulness)

1. Meta Business Agent capabilities, https://developers.facebook.com/documentation/meta-business-agent/capabilities (2026). Full configuration surface: knowledge, instructions, connectors, events, handoff, tests.
2. 360dialog, Meta Business Agent guide for API users, https://360dialog.com/blog/?p=1433 (2026). Setup steps, settings values, limits, billing mechanics; secondary but detailed.
3. WhatsApp pricing for non-template messages, https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/ (2026). Token price, October changes, currencies.
4. SAP Accounts Receivable AI, https://www.sap.com/use-cases/joule-assistant/accounts-receivable-ai. The eight receivables agents.
5. Meta Business Agent Platform overview, https://developers.facebook.com/documentation/meta-business-agent/overview. Eligibility and excluded verticals.
6. Salesforce Agentforce pricing, https://www.salesforce.com/agentforce/pricing/ (modified 20 Nov 2026). All price units.
7. QuickBooks Payments agent help, https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US. Exact reminder features.
8. Xero Xerocon London 2026, https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/. Payment Follow Ups, XeroForce.
9. Oracle Fusion AI agents, https://www.oracle.com/in/applications/fusion-ai/ai-agents/ (updated 18 Nov 2026). Full agent list.
10. PYMNTS on Nestlé and SAP, https://www.pymnts.com/?p=4328429 (20 Oct 2026). Adoption and timing.
11. Meta newsroom, Business Agent, https://about.fb.com/news/2026/06/meta-business-agent/ (3 Jun 2026).
12. Meta newsroom, Enterprise Platform, https://about.fb.com/news/2026/09/launching-meta-enterprise-platform/ (28 Sep 2026).
13. Intuit, virtual team of AI agents, https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/ (1 Jul 2025).
14. Microsoft adoption, collections agent scenario, https://adoption.microsoft.com/en-gb/scenario-library/finance/collections-agent/.
15. Omdia, WhatsApp free lunch is over, https://omdia.tech.informa.com/om146764/the-whatsapp-free-lunch-is-over-and-meta-is-also-coming-for-the-ai-layer (2026).
16. InfoWorld on Meta enterprise trust, https://www.infoworld.com/article/4228532/metas-next-big-ai-bet-is-enterprise-its-biggest-hurdle-may-be-trust-2.html (Sep/Oct 2026).
17. TechCrunch, Muse for small business, https://techcrunch.com/2026/09/29/meta-is-expanding-its-ai-agent-muse-to-small-businesses/ (29 Sep 2026).
18. Tech Wire Asia, Business Agent in Southeast Asia, https://techwireasia.com/2026/06/meta-business-agent-whatsapp-southeast-asia/ (11 Jun 2026).
19. eWeek, Manus separates from Meta, https://eweek.com/news/meta-manus-ai-deal-china-unwind-apac/ (13 Aug 2026).
20. Manus, resumes independent operations, https://manus.im/blog/manus-resumes-independent-operations (1 Sep 2026).
21. Earlier files in this folder: `11-context-layer-products.md` (Salesforce, Google, ServiceNow, Workday, Oracle, OpenAI Frontier detail), `08-alibaba-stack.md`, `10-papers-agents-memory-eval.md`, `12-agent-companies.md`.
