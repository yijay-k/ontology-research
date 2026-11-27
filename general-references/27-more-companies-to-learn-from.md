# More companies to learn from: the valuable AI-agent companies most people have not heard of

Scope note (written 21 November 2026). This file answers the founder's question "what else is at the level of Airbyte, Decagon, Glean and Ramp?" It does not repeat what /home/claude/research/12-agent-companies.md and /home/claude/research/11-context-layer-products.md already cover: Sierra, Harvey, Decagon, Fin, Hebbia, Distyl, Glean, Ramp's policy agent, Lindy pricing, Manus context engineering, 11x, Coze and Dify code, Tencent ADP, or the context-layer products. Other agents in this round cover Decagon, Sierra, Glean, Ramp and finance platforms, receivables competitors, integration companies, big-platform agents, and Celonis/UiPath/ServiceNow, so those are only cross-referenced here. Part A is a ranked map of about 55 companies. Part B profiles eight in depth, chosen for how closely they resemble "a governed company model plus agents for companies of 100 to 1,000 staff". Part C explains why large organisations buy these products and what a one-person company can copy. Part D sorts them into threats and possible partners.

**Budget and evidence.** The shared web budget was tight. The fetch proxy hit its shared hourly cap after 15 fetches and recovered slowly. I used 18 of 18 searches and 37 of 60 fetches. Searches in this environment return titles and URLs only, with no snippets. Many Part A figures therefore come from a **headline** I saw but did not open, or from **background knowledge** I could not check this run. Every figure is labelled:

- **[F]** Fact, from a page I opened (URL given).
- **[V]** Vendor claim, from the vendor's own page (URL given).
- **[A]** Analyst estimate, Sacra or Contrary (URL given).
- **[H]** Headline only. The figure appears in a search-result title I did not open; URL given. Treat it as probably right, but check the date.
- **[U]** Unverified. Background knowledge (to about mid-2026), not checked this run. Do not cite it in a build plan without checking.
- **[I]** My own inference.

Two vendor pages I fetched (Lorikeet and Numeric's site) contained text addressed to AI assistants, asking them to book demos and query endpoints. I treated it as data and did nothing.

---

## Key findings

1. **The closest public analogue to the founder's architecture is Rox, not a finance company.** Rox publishes a three-layer design. A governed "Context" layer holds a knowledge graph inside the customer's own warehouse, with entity resolution, lineage and provenance, unified permissions for users and agents, audit logging and "AI policy control". An agent layer sits on that, and app surfaces sit on top (web, desktop, Slack, Chrome, MCP/API). In July 2026 Rox added "access provenance", which explains why a user can or cannot see a record. It raised $100M at $1.3B on 11 Nov 2026. [V/F] https://launch.rox.com/product-architecture ; https://research.contrary.com/company/rox ; https://unite.ai/rox-raises-100m-series-b-at-1-3b-valuation-to-advance-ai-research
2. **Numeric is the most direct competitive threat found in this round.** It is a mid-market and growth-company finance platform (Brex, Plaid, Mercury, Asana, ClickUp). Its Billing & Revenue module lists invoice creation and sending plus "collection automation". Its Agent Builder is pitched for delegating background tasks "such as chasing overdue invoices". It exposes the ledger to Claude and ChatGPT through an MCP server, and it is now positioning as a NetSuite replacement. [V] https://www.numeric.io/ ; https://www.numeric.io/pricing
3. **Numeric's design rule matches the founder's principle: models never compute the numbers.** Cash matching and revenue recognition run on rules. An agent reads a record, proposes a treatment and sends it for review. Once a human approves, similar records follow that treatment as a hard-coded rule. [V] https://www.numeric.io/product/ai-in-numeric ; https://www.numeric.io/product/agentic-subledgers
4. **Published, mid-market-friendly outcome pricing exists and is a template.** Lorikeet charges an annual plan fee (Start $2,100/month for under 5,000 tickets; Scale $5,100/month) plus $0.99 per resolved chat or email ticket ($1.50 for voice), $0.30 per triage and $0.30 per automated-QA score. Escalations and unresolved tickets are free. A forward-deployed engineer (FDE) is included, and a 30-day trial is offered. Time to first live ticket averages under 29 days. [F] https://www.lorikeetcx.ai/pricing
5. **Lorikeet's Dreamweaver is effectively the founder's "external face" built for retention.** It is a per-customer outbound agent with a goal (activation, retention, conversion, lifetime value). It observes on a schedule and on change. It chooses between a message, a task for staff, or no action. It checks contact hours, frequency limits and consent before every message, shows its reasoning, and measures uplift against a holdout group. Collections is not a listed goal, but it is one configuration away. [V] https://www.lorikeetcx.ai/product/dreamweaver
6. **"Sensitive steps run as code the agent can call but cannot change."** Lorikeet states this for payments and identity checks. The interface is permissive but the operation is strict. It is the cleanest one-line statement of the action-layer rule the founder needs. [V] https://www.lorikeetcx.ai/product/how-it-works
7. **Governance features are converging into a standard checklist.** Maisa (version control with an approval pipeline, deterministic re-execution, immutable audit database, role/workspace permissions, on-prem or VPC), Relevance AI (per-factory permissions with "requires approval" and "never allowed" actions, version history with rollback, evals scored in plain-language rules, autonomy levels L1 to L4), and Feishu aily (agent permissions equal the user's own, per-user memory isolation, central credential custody, change records with diff and one-click rollback) all ship the same core. [V] https://maisa.ai/product ; https://relevanceai.com/ ; https://feishu.cn/content/article/7631864469689240764
8. **Horizontal "build any agent" platforms are narrowing to one function to sell.** Relevance AI's pricing page now shows only an Enterprise tier. Its homepage leads with "AI Factories" for go-to-market (PipeGen, Renewal, Expansion), not generic agents. [F] https://relevanceai.com/pricing ; https://relevanceai.com/ [I] This supports the founder's choice of receivables as the first job.
9. **Vertical finance agents for professionals reach unicorn value fast, and their buyers are a channel.** Basis raised $100M at $1.15B (24 Feb 2026), says about 30% of the top 25 US accounting firms deploy its agents, and keeps humans reviewing and approving every output. Accounting firms' client-accounting-services (CAS) teams run the month-end close for exactly the founder's mid-sized companies. [F] https://siliconangle.com/2026/02/24/ai-accounting-startup-basis-secures-100m-1-15b-valuation-firms-adopt-agent-based-workflows/ ; https://www.getbasis.ai/
10. **Voice and email agents already do payment collections, in a vertical.** HappyRobot (logistics; $150M Series C at $1.2B, 4 Aug 2026; 150+ enterprise customers including DHL, Uber Freight and Kuehne+Nagel) lists payment collections beside dispatch and quote follow-up. It lands with one or two scoped use cases and expands. [F] https://www.freightwaves.com/news/happyrobot-series-c-freighttech-unicorn
11. **The pricing lesson of 2026 is to charge for orchestration, not for data or seats.** In March 2026 Clay split pricing into credits for marketplace data (which it cut 50 to 90%) and "actions" for every enrichment, CRM sync and HTTP call run inside the product. Sacra estimates Clay at about $150M ARR in May 2026 and $5B in the January 2026 tender. Rox charges per agent action (Teams $255/month for 15K actions, unlimited seats) and says it has no seat pricing. [A/F] https://sacra.com/research/clay-crosses-150m-year/ ; https://research.contrary.com/company/rox
12. **Owned small models are becoming the cost lever at scale, but only past about 100K runs a month.** Maisa trains a customer-owned small language model (SLM) from each digital worker's traces. It claims 14x lower cost per job at 100,000+ runs a month with the same accuracy, and "up to 90x". [V] https://maisa.ai/ [I] This is irrelevant for the founder's first years. Note the trace format anyway, so the option stays open.
13. **"Build your own business system by prompt" is arriving inside the chat suites the founder's customers already use.** Feishu's Base AI (launched 19 Mar 2026) turns a natural-language need into tables, dashboards, forms and permission settings. Genspark's AgentBase builds custom CRMs and HR systems from company data. This is the main do-it-yourself substitute for a mid-sized firm. [F/V] https://www.qbitai.com/2026/03/389311.html ; https://businesswire.com/news/home/20260617758937/en/
14. **Growth numbers of the top tier show where the money is, not what a solo founder should copy.** Cursor raised at a reported $50B (Apr 2026). Lovable raised $400M at $13.3B with a reported $600M revenue run-rate. Genspark went from $0 to $250M ARR in about 12 months. Moonshot is at about $50B with about $1B ARR (Oct 2026). All are horizontal, prosumer-led and burn heavily on model costs. [H/F] see Part A.

---

## Part A. Ranked map of about 55 companies

Ranking is by **how much the founder should study the company**, not by size. Each group is ranked internally, and an overall top 15 comes first. Columns: what it does | who buys | money (with date and label) | what makes it valuable | lesson for the founder.

### A0. Overall top 15 to study (one line each)

1. **Numeric**: finance-ops platform with collections automation and an Agent Builder, aimed at the founder's market. Biggest threat and best teacher.
2. **Rox**: warehouse-native governed context layer plus agents. Closest architecture.
3. **Lorikeet**: regulated-industry support and outbound agent with published pricing. The template for the external face and for commercials.
4. **Maisa**: auditable "digital workers" with versioned approvals and on-prem. The template for governance.
5. **Basis**: finance agents with mandatory human review, sold to accounting firms. Template plus channel.
6. **HappyRobot**: voice and email agents, including collections, in one vertical. Shows "land one use case, expand".
7. **Feishu/Lark aily plus Base AI**: agent platform inside the suite many Asian mid-sized firms use. Channel and substitute.
8. **Relevance AI**: horizontal agent platform that narrowed to GTM "factories". Governance checklist and a warning.
9. **Clay**: credits then actions pricing, a community and an agency channel. The go-to-market playbook.
10. **Crescendo**: AI plus humans sold as an outcome-priced contact centre. Shows the "services-as-software" option.
11. **Parloa**: voice agent platform sold through BPOs. Channel lesson.
12. **Giga**: enterprise voice support (DoorDash). Speed of the voice wave.
13. **Genspark**: SMB/prosumer "AI workspace" with AgentBase. Substitute risk.
14. **Assort Health / Tennr**: healthcare back-office agents. Vertical back-office pattern.
15. **Dify**: open-source agent builder widely used in Asia. Supplier and reference code (already code-read in file 14).

### A1. Customer-facing agents

| # | Company | What it does | Who buys | Money (date, label) | What makes it valuable | Lesson |
|---|---|---|---|---|---|---|
| 1 | **Lorikeet** (Sydney/SF) | Support "Concierge" plus outbound "Dreamweaver" plus voice, QA, simulations, guardrails, "Coach" setup agent | Heads of CX at fintech, lending, health, insurance (PayJoy, Carmoola, Hims & Hers, Airwallex, Linktree) | Pricing published (see Part B); funding not on the site; not checked | Handles long regulated flows ("a 40-step refund flow"); sensitive steps run as locked code | Publish prices; include the FDE; charge only for resolutions. [F] https://www.lorikeetcx.ai/pricing |
| 2 | **Fin (Intercom)** | Support agent on any helpdesk | Mid-market and SMB support teams | $0.99 per outcome [F]; see file 12 | Huge installed base; procedures plus simulations | Cheapest public outcome price; the founder's per-collection price should be benchmarked against it. https://fin.ai/pricing |
| 3 | **Crescendo** | AI-native contact centre: AI handles voice, email and chat; human "superhumans" handle escalations | Consumer brands replacing BPO contracts | "On track to exceed $100M ARR" by end-2025 [V]; $500M valuation, Oct 2024 [A]; 500+ deployments [V] | Sells the outcome with humans included, under "Total Outcome Guarantees" [A] | A one-person company can sell "done for you" if a partner supplies the humans. https://www.globenewswire.com/news-release/2025/09/25/3156529/0/en/ ; https://sacra.com/c/crescendo |
| 4 | **Parloa** (Berlin) | Voice-first AI Agent Management Platform for contact centres | Enterprise CX (IKEA, Booking.com, Allianz Partners, HealthEquity); BPOs (TP, ibex, Sopra Steria) | ~$52M ARR 2025 (Sacra est.) [A]; $350M Series D at $3B, Jan 2026 [A/H]; NRR 150% [A] | Integrates into Genesys, Five9, NICE, Avaya; BPO partner channel | Sell through the people who already run the work (BPOs, accounting firms). https://sacra.com/c/parloa ; https://techcrunch.com/2026/01/15/parloa-triples-its-valuation-in-8-months-to-3b-with-350m-raise |
| 5 | **Giga** | Enterprise voice support agents | Large consumer platforms, starting with DoorDash [H] | $61M Series A led by Redpoint, Nov 2025 [H] | Voice at contact-centre volume with in-house models [U] | Voice is a later add-on for collections; email and messaging come first. https://fortune.com/2025/11/05/voice-ai-giga-raise-61-million-customer-service-series-a/ |
| 6 | **Ada** | Autonomous customer-service agent ("reasoning engine") | Mid-market and enterprise support | $1.2B valuation in 2021 [U] | Early mover with a large install base | Incumbents of the 2019 to 2021 chatbot wave survive by rebranding to agents; brand matters less than procedures. [U] |
| 7 | **PolyAI** (London) | Enterprise voice agents for hospitality, banking, utilities | Contact-centre leaders | Not checked [U] | Voice naturalness; long enterprise contracts | Not studied; no primary source opened. |
| 8 | **Cresta** | Real-time agent assist plus AI agents | Contact centres (telco, insurance) | $125M Series D, Nov 2024 [U] | Starts by helping humans, then automates | "Assist first, automate second" is a credible path for collections staff. [U] |

### A2. Vertical professional agents

| # | Company | What it does | Who buys | Money | Valuable because | Lesson |
|---|---|---|---|---|---|---|
| 1 | **Basis** | End-to-end agents for close, tax returns and audit testing, with review-ready workpapers | Accounting firms (CAS, tax, audit) and in-house finance | $100M Series B at $1.15B, 24 Feb 2026 [F]; ~30% of top 25 firms deploying [F] | Long-horizon finance work; humans start at review; audit trail | Finance buyers accept agents when the output is a reviewable workpaper, not an action. https://siliconangle.com/2026/02/24/... |
| 2 | **Legora** (Stockholm) | Collaborative legal AI (review, drafting, workflows); Harvey's main rival | Law firms and in-house legal | $550M Series D at $5.55B, 10 Mar 2026 [H]; $550M at $8.8B later in 2026, "US now its biggest market" [H] | Speed of product iteration with firms | A follower can take the number-two spot quickly in a two-horse market. https://techcrunch.com/2026/03/10/legora-reaches-5-55-billion-valuation-as-ai-legaltech-boom-endures/ ; https://dealroom.co/news/164722-... |
| 3 | **OpenEvidence** | Clinical answer engine for doctors, free to clinicians and ad-supported [U] | Physicians (individual adoption), pharma advertisers | $250M Series D at $12B, Jan 2026 [H]; later reports at $15B and talks at $20B (Jul 2026) [H]; sources disagree on order | Bottom-up adoption by professionals; trusted sources | Distribution to individual professionals can beat enterprise sales. Not applicable to receivables. https://www.cooley.com/news/coverage/2026/2026-01-22-openevidence-raises-$250-million-series-d |
| 4 | **Abridge** | Ambient clinical notes inside Epic | Health systems | $5.3B valuation, Jun 2025 [U]; 300+ health systems [V, file 12] | Quality "Editors" in the pipeline | See file 12. Embedding in the system of record (Epic) wins. |
| 5 | **EvenUp** | Personal-injury demand letters and case prep | Plaintiff law firms | ~$2B valuation, late 2025 [U] | Output tied to case value | Price on the customer's revenue event when you can. [U] |
| 6 | **Ambience Healthcare** | Ambient documentation plus coding | Health systems | $1.25B, Jul 2025 [U] | Coding accuracy drives revenue | Tie the agent to money the customer collects (as collections does). [U] |
| 7 | **Hippocratic AI** | Patient-facing clinical voice agents for non-diagnostic calls | Health systems | ~$3.5B, late 2025 [U] | Safety-tested outbound calling at scale | Outbound to the customer's customers needs a safety and consent layer; see Lorikeet Dreamweaver. [U] |
| 8 | **Rogo** | Research and drafting agent for bankers and investors | Investment banks, PE | Not checked [U] | Finance-grade sourcing | See Hebbia in file 12 for the deeper pattern. |
| 9 | **Spellbook** | Contract drafting and review inside Word | Small and mid-sized law firms, in-house | $50M Series B, 2025 [U] | Lives where the user already works (Word) | Put the internal face where finance staff live (Excel, Lark, email). [U] |
| 10 | **Trunk Tools** | Agents over construction documents and schedules | General contractors | Series B 2025 [U] | Unstructured project data turned into answers | Not studied. |

### A3. Sales and go-to-market

| # | Company | What it does | Who buys | Money | Valuable because | Lesson |
|---|---|---|---|---|---|---|
| 1 | **Rox** | Governed revenue knowledge graph plus agents (outbound, engagement, conversation and revenue intelligence) | Enterprise and mid-market sales teams (MongoDB, Ramp, Couchbase, New Relic, Bynder) | ~$8M ARR projected late 2025 [A]; $1.2B (Mar 2026) then $100M Series B at $1.3B, 11 Nov 2026 [F]; ~150x ARR [A] | Context layer runs inside the customer's warehouse | Architecture template; see Part B. |
| 2 | **Clay** | Data enrichment marketplace plus spreadsheet-style workflow builder plus Claygent research agent | GTM teams, "GTM engineers", agencies (OpenAI, Canva, Rippling) | ~$30M revenue 2024 [A]; ~$100M ARR Nov 2025, ~$150M ARR May 2026 [A]; $3.1B Series C Aug 2025 [H]; $5B tender Jan 2026 [F/A]; $115M Series D at $7.1B [H, date not seen]; 8K+ customers May 2025 [A] | Community (10K+ Slack, 40+ Clay Clubs) and 100+ "Claygencies" | Agencies as a channel; charge for orchestration actions. https://sacra.com/research/clay-crosses-150m-year/ ; https://research.contrary.com/company/clay |
| 3 | **Gong** | Conversation and revenue intelligence, now with agents | Sales leaders, mid-market to enterprise | ARR passed $500M, Apr 2026 [A]; $7.3B (2021) [A] | Owns the call-recording data | The data you capture first becomes the moat. https://research.contrary.com/company/rox (competitor section) |
| 4 | **Apollo.io** | Contact database plus engagement plus agents | SMB and mid-market sales | $1.6B (Aug 2023) [A]; named Salesforce data partner, Sep 2026 [A] | 240M+ contacts | Self-serve volume at low price. Same source. |
| 5 | **Relevance AI** | Agent platform repositioned as GTM "AI Factories" | RevOps and GTM leaders (Qualified, Canva, Databricks, Confluent) | Funding not on site; not checked [U] | Governance and evals | See Part B. |
| 6 | **Outreach** | Sales engagement adding agents | Enterprise sales | $4.4B (2021) [A] | Workflow incumbency | Incumbents add agents; startups must win on outcomes. |
| 7 | **Unify** | Signal-based outbound "GTM system" | B2B growth teams | Not checked [U] | Plays built from intent signals | Not studied. |
| 8 | **11x** | AI SDR | — | ~$350M (Sep 2024) [A]; CEO stepped down May 2025 after reports on false customer claims [A] | — | Failure case; see file 12. |
| 9 | **Artisan** | "AI employee" SDR (Ava) | SMB | $25M Series A, 2025 [U] | Loud brand marketing | Brand without an attributable outcome does not retain. [I] |

### A4. Coding and builder agents (only for growth and pricing lessons)

| # | Company | Money | Pricing lesson | Lesson |
|---|---|---|---|---|
| 1 | **Cursor (Anysphere)** | $100M ARR Jan 2025, $500M Jun 2025 [A]; $2.3B at $29.3B Nov 2025 [A]; $2B at a reported $50B, Apr 2026 [H]; reports of $60B [H] | Moved from fixed request counts to usage pricing (Sep 2025). Analysts say pricing sits at or below model cost [A]. Enterprise contracts $19.2K to $152.6K, median $61.4K [A] | If you rent models, price on usage or outcomes from day one. Moving flat-fee customers to usage later is painful. https://research.contrary.com/company/anysphere ; https://thenextweb.com/news/cursor-anysphere-2-billion-funding-50-billion-valuation-ai-coding |
| 2 | **Lovable** | $330M at $6.6B, Dec 2025 [H]; $400M at $13.3B, "eyes $600M revenue run rate" (2026) [H] | Credit-based subscriptions [U] | Prosumer virality; not the founder's motion. https://techcrunch.com/2025/12/18/vibe-coding-startup-lovable-raises-330m-at-a-6-6b-valuation/ ; https://dealroom.co/news/144597-... |
| 3 | **Replit** | Gross margin −14% rising to 36% during 2025 (secondary) [file 13] | Effort-based agent pricing [U] | Margin is set by the model bill. See file 13. |
| 4 | **Cognition** | Acquired Windsurf, Jul 2025 [A] | Seat plus usage [U] | Not studied. |

### A5. AI employees for small and mid-sized business

| # | Company | What it does | Money | Lesson |
|---|---|---|---|---|
| 1 | **Genspark** | AI workspace; **AgentBase** builds custom databases, dashboards and internal systems (CRM, HR) from company data; **Claw** execution layer (Mar 2026) | $0 to $250M ARR in about 12 months [V]; $485M Series B total at $2.6B post, 17 Jun 2026 [V]; 6,000+ business clients in 6 months [V] | The "build-your-own internal system" substitute is well funded. Win on governed finance semantics it lacks. https://businesswire.com/news/home/20260617758937/en/ |
| 2 | **Lindy** | No-code assistants with approval for anything with outside impact | Team $29.99/user/month with credits [F, file 12] | Approval-before-external-action is table stakes even in SMB. |
| 3 | **Relevance AI** | See A3 and Part B | — | — |
| 4 | **Gumloop** | Visual automation with AI nodes | Series A 2025 [U] | Not studied. |
| 5 | **Sintra** | Pre-built "AI helpers" (marketing, support) for very small firms | Seed 2025 [U] | Persona-branded bundles sell to micro-firms, not 100 to 1,000 staff. [I] |
| 6 | **Manus** | General agent; joined Meta Dec 2025, resumed independence Sep 2026 | $100M ARR Dec 2025 [F, file 12] | See file 12 for its context-engineering lessons. |
| 7 | **Marblism** | Bundle of "AI employees" for small businesses | Not checked | Not studied. |

### A6. Back-office and operations agents

| # | Company | What it does | Who buys | Money | Lesson |
|---|---|---|---|---|---|
| 1 | **Numeric** | Close, reconciliation, cash matching, billing and revenue (with collections automation), agentic subledgers, ERP replacement, MCP | Controllers and CFOs at growth companies and fintechs | Funding not on site; Series A 2024 [U] | Biggest threat; see Part B. |
| 2 | **Maisa** | Auditable "digital workers" for processes such as order-to-cash (O2C), procure-to-pay (P2P), invoice matching, onboarding | Banks (Santander), insurers, engineering and manufacturing firms | $25M seed, Aug 2025 [F]; 35 staff then [F]; "50M+ production runs" [V] | Governance template; see Part B. |
| 3 | **HappyRobot** | Voice, email and follow-up agents for freight: dispatch, **payment collections**, support, quote follow-up | Brokers, 3PLs, carriers (DHL, Uber Freight, Kuehne+Nagel) | $150M Series C at $1.2B, 4 Aug 2026; 150+ enterprise customers; 5x growth since late-2025 Series B [F] | See Part B. |
| 4 | **Tennr** | Referral and intake document processing for specialty healthcare | Healthcare providers | ~$605M valuation, 2025 [U] | Vertical back-office agents grow by owning one messy inbound document flow. [U] |
| 5 | **Assort Health** | Voice agents for patient scheduling and calls | Specialty clinics | ~$750M, 2025 [U] | Phone-heavy back offices buy voice first. [U] |
| 6 | **Augment (Augie)** | AI teammate for freight brokers | Freight brokers | Series A 2025 [U] | The same vertical as HappyRobot; crowded by 2026. [U] |
| 7 | **Vooma** | Email and phone order entry for freight | Brokers and carriers | Not checked | Not studied. |
| 8 | **Pallet** | Logistics workflow agents | 3PLs | Not checked | Not studied. |
| 9 | **Sola** | Process automation from screen recordings | Mid-market ops | Not checked | Not studied. |
| 10 | **Thoughtful AI** | Revenue-cycle automation for healthcare | Providers | Not checked | Not studied. |
| 11 | **Duvo** | Agents for retail and consumer-goods back office | Retailers | Not checked | Not studied. |

### A7. Enterprise deployment and "Palantir-style" firms

| # | Company | What it does | Money | Lesson |
|---|---|---|---|---|
| 1 | **Distyl** | Forward-deployed teams plus a context-views graph | ~$1.8B, 2025 [U]; see file 12 | See file 12. |
| 2 | **Scale AI** | Data labelling, plus enterprise and government AI applications | Meta took 49% for ~$14.3B, Jun 2025 [U] | Services plus platform works when the buyer has huge budgets; not a solo path. |
| 3 | **Invisible Technologies** | Human-plus-AI operations and training data; enterprise "process orchestration" | ~$2B valuation, 2025 [U] | Selling outcomes with humans in the loop is a real business; partner for human escalation. [U] |
| 4 | **Tribe AI** | Network of AI engineers for enterprise builds | Not checked | Possible delivery partner model. |
| 5 | **Accenture and other large integrators** | AI transformation services | Not checked | They are channels to large firms, not to the founder's 100 to 1,000 staff segment. [I] |
| 6 | **Lorikeet, Rox, Ramp** | FDE support bundled into software plans | See Part B | Even product companies now bundle forward-deployed engineers. [F] |

### A8. Data and infrastructure that AI companies use (suppliers)

| # | Company | Role for the founder | Money | Note |
|---|---|---|---|---|
| 1 | **Supabase** | Postgres, auth and storage; Team plan $599/month gives a SOC 2 report | ~$5B, Oct 2025 [U]; pricing [F, file 13] | Default database supplier. |
| 2 | **Stripe** | Payments and payment links inside reminders | ~$107B tender 2025 [U] | Payment links in collections messages are the conversion lever. [I] |
| 3 | **Clerk / WorkOS** | Auth, SSO and SCIM for selling to 100 to 1,000 staff firms | Not checked | Enterprise SSO is a gate in Relevance AI's and Rox's enterprise tiers. [F] |
| 4 | **Temporal** (or DBOS) | Durable execution for long agent tasks | Not checked | File 14 recommends DBOS for one person. |
| 5 | **Databricks / Snowflake** | Warehouses that host semantic layers; Rox runs inside them | Databricks ~$134B, Dec 2025 [U] | Mid-sized firms rarely have one; do not depend on it. [I] |
| 6 | **LangChain / LlamaIndex** | Agent frameworks and document parsing | LangChain ~$1.25B, Oct 2025 [U] | Optional; file 14 covers the code. |
| 7 | **Pinecone** | Vector database | Not checked | Postgres pgvector is enough at this scale. [I] |
| 8 | **Vercel** | Front-end hosting | ~$9.3B, Sep 2025 [U] | Supplier. |
| 9 | **Scale AI** | Evaluation data | See A7 | Not needed. |

### A9. Asian players

| # | Company | What it does | Money | Lesson |
|---|---|---|---|---|
| 1 | **Feishu / Lark aily** (ByteDance) | Enterprise agent platform inside Lark/Feishu; Base AI builds business systems by prompt; Miaoda app builder; official OpenClaw plugin | Pricing via AI points packages [F] | Channel and substitute; see Part B. https://www.qbitai.com/2026/03/389311.html |
| 2 | **DingTalk / QwenWork** (Alibaba) | Agent workbench, "digital employees", enterprise context | See file 08 | See file 08. |
| 3 | **Coze / HiAgent** (ByteDance) | Consumer and enterprise agent builders; Coze Studio is open source | See file 12 | — |
| 4 | **Dify** | Open-source agent and workflow builder, popular with Asian enterprises | Not checked | Reference code; see file 14. |
| 5 | **Moonshot (Kimi)** | Frontier model lab | ~$50B valuation; ARR ~$1B (from $300M in June), $2B expected by Dec 2026; HK IPO targeted Q1 2027 [F, report] | Cheap strong models from China keep falling in price; route to them where allowed. https://www.euronews.com/2026/10/06/... |
| 6 | **Zhipu (Z.ai) and MiniMax** | Model labs, listed in Hong Kong Jan 2026 | Listed Jan 2026 [F, report]; Zhipu sought up to $640M [H] | Model supply is commoditising. https://www.caixinglobal.com/2026-01-08/chinas-zhipu-ai-jumps-in-hong-kong-debut-102401610.html |
| 7 | **Genspark** (Palo Alto, founded by ex-Baidu leaders) | See A5 | — | — |
| 8 | **Sarvam** (India) | Sovereign full-stack AI: models (105B, 30B), voice agents, conversational platform (2M+ interactions/day) | $300M Series B at $1.5B; first close $234M, 15 Jun 2026; HCLTech $150M [F] | Indic-language voice campaigns at national scale (45M+ policyholders) [V]. https://www.sarvam.ai/announcing-series-b |
| 9 | **Yellow.ai** (India) | Customer-service automation for enterprises in Asia | Not checked | Not studied. |
| 10 | **WIZ.AI** (Singapore) | Voice agents for SEA enterprises (collections and telemarketing common in SEA [U]) | Series B "tens of millions" [H] | Closest SEA voice player for reminders. https://www.jtc.gov.sg/about-jtc/news-and-stories/industry-news/wiz-ai-raises-tens-of-millions-in-series-b |
| 11 | **Agnes AI** (Singapore) | AI agents for consumers and businesses | Nears $20M ARR, Mar 2026 [H] | SEA can produce fast ARR. https://lite.aol.com/tech/story/0022/20260320/9675922.htm |
| 12 | **OneByZero** (Singapore) | Data and AI services firm | $20M Series A, Jungle Ventures [H] | SEA buyers still buy AI as services. https://www.dealstreetasia.com/?p=497083 |
| 13 | **Dyna.Ai** (Singapore) | AI for financial services | Series A, Mar 2026 [H] | Financial services is the SEA AI buyer. https://builtin.com/articles/dynaai-raises-multi-million-dollar-series-a-20260303 |
| 14 | **Sprouts.ai** | AI revenue agents for enterprise sales | $9M, Jul 2026 [H] | — https://e27.co/sprouts-ai-raises-us9m-to-build-ai-revenue-agents-for-enterprise-sales-teams-20260709/ |
| 15 | **Diaflow, Decube** (Malaysia) | Diaflow: AI workflow builder; Decube: data catalogue and observability | Small rounds [H] | Malaysian peers exist; possible partners. https://kr-asia.com/deals-in-brief-eezee-and-diaflow-raise-funding-... ; https://www.dealstreetasia.com/?p=470787 |
| 16 | **Japan and Korea**: Sakana AI, LayerX (Bakuraku back-office suite), Upstage (document AI and LLMs), PKSHA | Enterprise AI and back-office automation | Not checked [U] | LayerX is the closest Japanese analogue (spend and invoice automation for mid-sized firms) [U]; not studied this run. |

Context for SEA: one headline puts Southeast Asian AI start-up funding at $4.1B in 2026 [H] https://www.crowdfundinsider.com/2026/08/297239-southeast-asia-ai-startup-funding-hits-4-1bn-in-2026/. DealStreetAsia calls Q1 2026 SEA funding "thin" even as agentic AI gained ground [H] https://www.dealstreetasia.com/stories/southeast-asia-deal-review-q1-2026-summary-481038.

---

## Part B. Deep profiles of the eight most instructive companies

### Why these eight

The founder's product is a governed company model (objects, metrics, rules, permissions, actions), with agents working through it, for firms of 100 to 1,000 staff, starting with receivables. I picked companies that match at least two of four tests: (a) a governed model or context layer under agents; (b) finance or receivables work; (c) mid-market buyers or pricing; (d) an external face that contacts the customer's customers.

| Company | (a) governed layer | (b) finance/AR | (c) mid-market | (d) external outreach |
|---|---|---|---|---|
| Rox | Yes, explicit | No | Partly (self-serve Teams tier) | Yes (outbound) |
| Numeric | Yes (records, rules, subledgers) | Yes, including collections | Yes | Invoices and collections |
| Maisa | Yes (versioned, audited workers) | Yes (O2C, invoice matching) | Partly | No |
| Basis | Partly (rules plus review) | Yes | Yes (firms serving mid-sized clients) | No |
| Lorikeet | Partly (deterministic workflows, locked code) | Fintech and lending | Yes (published $2,100/month entry) | Yes (Dreamweaver) |
| HappyRobot | Unknown | Yes (payment collections) | Partly | Yes (voice, email) |
| Relevance AI | Yes (permissions, approvals, evals) | No | Was mid-market, now enterprise | Yes (GTM) |
| Feishu/Lark aily | Partly (user-equal permissions, change records) | No | Yes (SEA and China mid-sized firms) | Within Lark |

Excluded despite fame: Clay (no governed layer, not finance; lessons kept in Part A), Crescendo and Parloa (contact-centre scale), and the coding agents (different motion).

---

### B1. Rox: governed revenue context plus agents

**1. In one paragraph.** Rox sells "revenue agents" to sales organisations at enterprise and upper mid-market software and industrial companies (MongoDB, New Relic, Couchbase, Ramp, WSP, Puma Energy, Bynder). Buyers are CROs, VPs of Sales and RevOps. It unifies CRM, email, calendar, call transcripts, warehouse data and public web signals into one governed knowledge graph. Agents then prospect, run outreach, prepare meetings, watch deal risk and forecast. The result customers pay for is more pipeline and conversion per rep: Ramp reports a 10 to 15% conversion lift; Bynder account managers closed 2.5x more ARR. [V via F] https://unite.ai/rox-raises-100m-series-b-at-1-3b-valuation-to-advance-ai-research ; https://research.contrary.com/company/rox

**2. Function catalogue** (as Rox groups it):
- *App layer:* Web app, desktop (macOS), iOS, Chrome extension, Slack, Google Workspace, Microsoft 365 (Copilot integration Mar 2026), partner surfaces, and MCP plus API for custom builds. [V/A] https://launch.rox.com/product-architecture ; https://research.contrary.com/company/rox
- *Agents:*
  - Outbound Agent (the flagship): finds buyers from a plain-language description, validates contacts against 17+ enrichment providers, and hands them to sequences. Sends can stay under manual review. [F]
  - Sales Intelligence: leads, enrichment, signal watching, account scoring. Prospect-list agents added Sep 2026. [A]
  - Sales Engagement: drafted sequences, follow-ups, call scripts. Built-in dialer Jan 2026. [A]
  - Conversation Intelligence: capture, transcription, pre-meeting briefs, commitment tracking, coaching. [V/A]
  - Revenue Intelligence: stage-specific risk and forecasting. [V/A]
  - Account Intelligence: funding and leadership-change signals, buying-committee maps, daily digests. [A]
  - Sales Force Automation: account plans, lists, plays, ranking by live signals. [V]
- *Orchestration:*
  - Recommended Actions: suggested next steps from deal context and history.
  - Command / Command Center: chat with agents using @-mentions, plus manual overrides.
  - Workflows / Rox Autopilot: a builder for multi-step agent chains (Mar 2026). [V/A]
- *Context:*
  - Warehouse-native knowledge graph.
  - Entity resolution and deduplication.
  - Data lineage and provenance.
  - AI governance and policy control.
  - Authentication and access control; unified permissioning across users and agents.
  - Audit logging.
  - Access provenance (Jul 2026). [V/A]
- *Data sources:* private (Salesforce, Zendesk and similar), the customer's warehouse (Snowflake, Databricks, BigQuery), and public (web, LinkedIn, funding news, newsrooms, social). [V/A]

**3. How it works underneath.** The graph is computed inside the customer's warehouse and queried live, with no copy of the data. [A] https://research.contrary.com/company/rox. The page publishes no formal schema. Implied objects are accounts, contacts, interactions (calls, emails), deals, plans and plays, and signals. [V, inferred from the page] Permissions and audit apply equally to users and agents. Access provenance answers "why can or can't I see this record". Contrary reads the agent design as one agent per account under an orchestrator, despite the "swarm" marketing. [A]

**4. Commercials.**
- Pricing: Free tier; Individual $100/month for 10K agent actions; Teams $255/month for 15K actions with unlimited seats and CRM write-back (self-serve, launched Aug 2026); Enterprise custom, adding warehouse sync, SSO and dedicated deployment. Unused actions expire each cycle. The company says pricing is usage and outcome based, with no seats (Mar 2026). [A, archived Sep 2026] https://research.contrary.com/company/rox
- Revenue and growth: passed $1M ARR in Nov 2024; ~$8M ARR projected for late 2025 [A]; ARR grew "more than tenfold" in the first year [V].
- Funding: Sequoia seed (Feb 2024); $50M seed plus Series A (Nov 2024, General Catalyst); $1.2B (reported Mar 2026); $100M Series B at $1.3B (11 Nov 2026, General Catalyst and March Capital, with Databricks Ventures and Prosperity7). [F/A]
- Customers: 5K+ organisations served by Nov 2025 [A]; MongoDB went from prototype to production in 45 days; Couchbase has 90%+ adoption across 250+ reps. [V]

**5. Why customers choose it.** [I from the evidence]
- (i) One governed place for all revenue context, instead of point tools.
- (ii) Data stays in the customer's warehouse, which security teams like.
- (iii) Measurable conversion lift.
- (iv) Fast pilots with FDE help.

Complaints: none were found in the sources. Contrary flags the risk that Salesforce, HubSpot and Microsoft embed similar agents in their CRMs, that Microsoft is both partner and competitor, that AI voice calls need prior consent under the TCPA, and that the valuation is about 150x ARR. [A]

**6. How it deploys.** Enterprise deployment uses warehouse sync and forward-deployed engineering (FDE costs are noted as services cost) [A]. MongoDB took 45 days from prototype to production [V]. Teams is fully self-serve [A].

**7. What to copy.**
1. Draw the architecture as Context (governed), then Agents, then Apps. Put governance items (lineage, policy, unified permissions, audit) inside the context layer, not beside the agents. https://launch.rox.com/product-architecture
2. Make agents and users share one permission model, and add a "why can I see this" explanation per record. https://research.contrary.com/company/rox
3. Offer three orchestration modes: suggested next actions, direct command, and saved workflows. https://launch.rox.com/product-architecture
4. Price on agent actions, with unlimited seats, so the whole finance team can join. Keep a self-serve team tier. https://research.contrary.com/company/rox
5. Let outbound sends stay under manual review per customer setting. https://unite.ai/rox-raises-100m-series-b-at-1-3b-valuation-to-advance-ai-research

**8. What not to copy.**
- Warehouse-native deployment: 100 to 1,000-staff firms usually have no Snowflake or Databricks, so the founder must host the model itself. [I]
- The 150x-ARR funding path. [A]
- Expiring action credits, which annoy small buyers. [I]

**9. Relationship.** Teacher (architecture). It is not a competitor in receivables. [I]

---

### B2. Numeric: finance operations platform with collections automation

**1. In one paragraph.** Numeric sells to controllers, accounting managers, CFOs and "finance engineers" at venture-backed growth companies, fintechs and some public companies (Brex, Plaid, Mercury, Asana, ClickUp, Wealthfront, Riskified). It started as close management on top of NetSuite and similar ERPs. It now covers cash matching, billing and revenue recognition (with invoicing and collections automation), agentic subledgers, and a full "ERP Replacement". The result customers pay for is a faster close and fewer people per transaction volume: Brex cut close from 6 to 4 days (33%); Public.com cut month-end by 2 days with 3x output; DailyPay has 80% of flux first drafts written by AI; Built saved 2 FTEs of billing and revenue work. [V] https://www.numeric.io/

**2. Function catalogue** (as Numeric groups it; status: GA unless marked; no dates on the pages):
- *Close Management:*
  - Close Checklist (shared by humans and agents).
  - Account Reconciliation (automated balance-sheet reconciliations with exception review).
  - Flux Analysis (variance, with "agentic flux" pulling payroll and CRM data).
  - Transaction Monitors (pre-close anomaly flags).
  - Review notes and custom reporting. [V] https://www.numeric.io/ ; https://www.numeric.io/pricing
- *Cash Management:*
  - Cash Matching: rules on any field plus AI-suggested matches; "up to 95%" of bank transactions matched.
  - Journal-entry automation.
  - Live bank feeds.
  - AI parsing of bank statements.
  - Bank automations. [V]
- *Billing & Revenue (marked NEW):*
  - Usage-event ingestion and matching usage to contract lines, with exception flags.
  - **Invoice creation and sending.**
  - **Collection automation.**
  - ASC 606 revenue recognition, with modifications, allocations and SSP. [V] https://www.numeric.io/pricing
- *ERP Replacement (marked NEW):*
  - Financial Data Platform (FDP).
  - Agentic Subledgers and Custom Ledgers.
  - Reporting by dimension (project, department, SKU, location).
  - Prism (in-app AI that surfaces daily agent items for review).
  - App Studio.
  - Accounting-policy enforcement through hard-coded workflows. [V]
- *Platform and AI:*
  - Command center to approve agent output, watch metrics and dispatch agents.
  - Agent Builder (the example task given is "chasing overdue invoices").
  - App Studio (describe an app; it plans, writes code and runs it on live financial data; saved apps are auditable).
  - Numeric MCP (use the data from Claude, ChatGPT and others).
  - Integrations (NetSuite named; Ramp, Brex, Stripe as record sources). [V] https://www.numeric.io/product/ai-in-numeric ; https://www.numeric.io/product/agentic-subledgers

**3. How it works underneath.**
- Each financial record is kept whole, with its context, instead of as isolated journal lines. [V]
- Models do not compute numbers or draft journal entries. An agent proposes a treatment. A human approves it. The approved treatment becomes a hard-coded schedule rule, reused when a document is re-uploaded, with downstream entries updated automatically. [V] https://www.numeric.io/product/ai-in-numeric ; https://www.numeric.io/product/agentic-subledgers
- Tracing a transaction to its source takes "less than a minute". [V]
- Permissions, the audit-trail design and the Agent Builder internals are not published on the pages I read. [Unverified] Numeric runs an engineering blog at https://numeric.substack.com/ that I did not open.

**4. Commercials.**
- Pricing is custom, based on transactions to seats. Modules can be mixed, except ERP Replacement, which is the full suite. Onboarding and migration are "scoped upfront". [F] https://www.numeric.io/pricing
- Funding, revenue and customer count: not on the site and not checked this run. [U]

**5. Why customers choose it.** [I from evidence]
- (i) It works alongside the existing ERP first, so there is no migration to start.
- (ii) Deterministic rules plus AI drafts, which auditors accept.
- (iii) Quantified close-time cuts at well-known fintechs.
- (iv) It expands module by module.

Complaints: not found in this run.

**6. How it deploys.** It starts with close management on the current ERP, then adds cash, then billing, then replaces the ERP. Implementation is agreed during evaluation. [V]

**7. What to copy.**
1. "Agent proposes, human approves, approval becomes a deterministic rule for similar records." This is how receivables treatment (dispute categories, payment-plan terms, write-off thresholds) should be learnt. https://www.numeric.io/product/ai-in-numeric
2. Expose the governed model to outside assistants through MCP, so the customer's Claude or ChatGPT answers finance questions through your semantics. https://www.numeric.io/product/numeric-mcp (linked from https://www.numeric.io/)
3. One command centre: agents bring back only items needing judgment; approve, monitor and dispatch from one screen. https://www.numeric.io/product/ai-in-numeric
4. Land beside the ERP, then expand. https://www.numeric.io/pricing

**8. Where it is weak or not to copy.**
- It is US-centric (NetSuite, US fintech logos, ASC 606) [I]. There is no sign of messaging-channel reminders (WhatsApp, Lark) or Asian ERPs (AutoCount, SQL Account, Xero in Malaysia) [I].
- ERP replacement is a huge scope that a one-person company must not attempt. [I]

**9. Relationship.** The **main competitor** if the founder ever sells to US growth companies. In Malaysia and SEA it is a teacher. [I]

---

### B3. Maisa: auditable "digital workers"

**1. In one paragraph.** Maisa (Valencia and San Francisco, founded about 2024) sells "digital workers" to operations, finance and procurement leaders at banks, insurers, engineering and manufacturing firms. Customers include Santander ("100s" of use cases in production), Indigo Group (four processes in production in 3 months across finance, procurement, invoicing and tax), Elecnor, Erste Group and CoverWallet. A digital worker runs a defined process end to end across existing (including legacy) systems. It applies business rules, handles exceptions and records every run. The result customers pay for is the automation of judgment-heavy processes that RPA could not handle, with an audit trail that a regulated firm accepts. [V] https://maisa.ai/ ; [F] https://techcrunch.com/2025/08/27/maisa-ai-gets-25m-to-fix-enterprise-ais-95-failure-rate

**2. Function catalogue.**
- *Maisa Studio:* build a digital worker in natural language through four steps: onboard (task, data, goal; the homepage adds process knowledge, business rules, controls, exceptions and expected outcome), connect systems and tools, run before go-live, and monitor production runs. Self-serve and model-agnostic. [V/F] https://maisa.ai/product
- *KPU (Knowledge Processing Unit):* a deterministic execution system meant to limit hallucinations. Undocumented publicly. [F/V]
- *Chain of Work:* AI builds the process (as code) that produces the answer, instead of answering directly. Every step, tool, data source and decision is logged. Same input gives the same output. [V] https://maisa.ai/landings/chain-of-work
- *HALP (human-augmented LLM processing):* the worker asks the user about needs and lays out each step first. [F, TechCrunch]
- *Audit and traceability:* code traces; an immutable audit database with e-discovery; proactive flagging and alerts; failed validations repaired within the run. [V]
- *Versioning:* version control with an approval pipeline, so every change can be shown to have been approved. [V]
- *Testing:* run before go-live; reliability testing by deterministic re-execution. [V]
- *Permissions:* access by role, workspace or employee for who can build, run and change workers. [V]
- *Operations:* 24/7 monitoring with stop-and-escalate control. [V]
- *Owned SLM:* traces train a customer-owned small model. Claimed 14x lower cost per job at 100K+ runs a month, and up to 90x. Workers can switch model providers. [V]
- *Security:* encryption in motion and at rest, on-the-fly PII encryption for GDPR, prompt-injection guardrails, configurable rule packs for FINMA, Basel III/IV, DORA and the EU AI Act. [V]
- *Deployment:* Maisa cloud, customer VPC, behind the firewall, or on-premise. [V]
- *Use-case catalogue:*
  - Banking: subpoena intake, auto loans, onboarding, equity research.
  - Insurance: renewals, FNOL, quote-and-bind, underwriting intake.
  - Manufacturing: work orders, supplier invoice matching, non-conformance.
  - Engineering: progress reports, tenders, subcontractor compliance.
  - Departments: procurement, finance and accounting (**O2C/P2P**, invoice reconciliation, withholding-tax reconciliation). [V] https://maisa.ai/ ; https://maisa.ai/use-cases/o2c-p2p (linked, not opened)

**3. How it works underneath.** Only the principles are public. A process is generated as code and then executed deterministically. Runs are logged as a reviewable chain. Changes go through approval. Traces become training data. The rules, controls and exceptions model and the KPU internals are not documented on the pages I read. [Unverified]

**4. Commercials.**
- Pricing is not published (demo only). [F]
- Funding: $5M pre-seed (Dec 2024, NFX and Village Global); $25M seed (Aug 2025, led by Creandum, with Forgepoint/Santander JV). [F]
- Team: 35 in Aug 2025, planning 65 by Q1 2026. [F]
- Volume: "50M+ production runs". [V]

**5. Why customers choose it.** [I from evidence]
- (i) Auditability that a bank's risk team accepts.
- (ii) On-prem deployment.
- (iii) Determinism claims.
- (iv) A fast, bounded deployment method.

Complaints: none found. The customer base was described as small in Aug 2025. [F]

**6. How it deploys.** The "1-3-6 method": build in week 1, pilot by week 3, live by week 6. [V] https://maisa.ai/

**7. What to copy.**
1. A worker definition with fixed fields: objective, process knowledge, business rules, controls, exceptions, expected outcome. Map it directly to a "collections playbook" object. https://maisa.ai/
2. A version-controlled approval pipeline for every playbook or rule change, so the customer can prove every change was approved. https://maisa.ai/product
3. Deterministic re-execution as the regression test: replay a past run and compare the outputs. https://maisa.ai/product
4. A published, bounded deployment timeline (1-3-6) as a sales promise. https://maisa.ai/
5. Store traces in a training-ready format now, so a cheaper owned model stays possible later. https://maisa.ai/

**8. What not to copy.**
- On-prem for every customer. [I]
- Unexplained branded concepts (KPU) that buyers cannot evaluate. [I]
- Regulatory rule packs for EU banking. [I]

**9. Relationship.** Teacher. It is a potential competitor only at larger firms that buy O2C automation. [I]

---

### B4. Basis: finance agents with mandatory review

**1. In one paragraph.** Basis (New York, founded 2023) sells agents to US accounting firms' CAS, tax and audit practices: Baker Tilly, CohnReznick, Citrin Cooperman, Sikich, UHY, Clark Nuber, Boulay. A corporate-accounting offering targets in-house finance teams. The agents run long, multi-step work: the full month-end close per client, full tax returns from intake to review-ready workpapers, and audit testing with cited evidence. Staff start at the review stage. The result customers pay for is capacity. Boulay says returns with 60 to 70+ K-1s fell from over 100 prep hours to about 15 to 20. Clark Nuber says Basis is why its CAS department grows 50% a year. [V] https://www.getbasis.ai/

**2. Function catalogue.**
- Solutions: CAS & Advisory (close per client); Tax (full return); Audit (testing with cited evidence); Corporate Accounting (in-house close); Small Firms (no details); End-to-End Tax Platform (newly announced, "agents across an entire tax return"). [V] https://www.getbasis.ai/ ; https://www.getbasis.ai/blogs/the-future-of-tax-is-end-to-end-intelligence (linked, not opened)
- Capabilities: ingestion of structured and unstructured client documents, accounting systems and ERP data; extraction, calculation and validation inside predefined compliance frameworks; reconciliation; workpaper generation; audit trails; structured outputs matching firm documentation standards. [F] https://siliconangle.com/2026/02/24/ai-accounting-startup-basis-secures-100m-1-15b-valuation-firms-adopt-agent-based-workflows/

**3. How it works underneath.** LLMs are combined with rules-based controls and accounting logic. Humans review and approve outputs. Agents gather data, draft and move the workflow forward. [F] Deeper architecture is not published on the pages read. [Unverified]

**4. Commercials.**
- $34M (Dec 2024) [F].
- $100M Series B at $1.15B (24 Feb 2026; Accel, GV, Lloyd Blankfein; plus Khosla and others) [F].
- About 30% of the top 25 firms deploying [F].
- Pricing and revenue not disclosed [F].

**5. Why customers choose it.**
- (i) The talent shortage in accounting means firms cannot hire enough staff. [I]
- (ii) Workpaper-grade outputs that fit firm standards. [F]
- (iii) Partner-level testimonials on hours saved. [V]

Complaints: not found.

**6. How it deploys.** Waitlist and demo. Firm sizes from solo to 100+ staff are selectable. Per-firm onboarding is not described. [V]

**7. What to copy.**
1. Make the agent's product a reviewable workpaper. For collections, the equivalent is a daily "collections pack": who to chase, the proposed message, the evidence (invoice, statement, prior promises), and approve, edit or skip. https://www.getbasis.ai/
2. Sell outcomes in hours saved per unit (per return there; per invoice or per customer account here). https://www.getbasis.ai/
3. Rules-based controls around the LLM for anything numeric. https://siliconangle.com/2026/02/24/...

**8. What not to copy.** US tax and audit specificity. A waitlist-only motion is not workable for a solo founder without a brand. [I]

**9. Relationship.** Teacher, and a model for a **channel**: in Malaysia, accounting firms and outsourced bookkeepers that serve mid-sized companies could resell or operate the founder's receivables agent. [I]

---

### B5. Lorikeet: support and outbound agents for regulated firms, with published prices

**1. In one paragraph.** Lorikeet sells customer-facing agents to heads of CX and operations at "complex, regulated" fintechs, lenders, health and insurance companies: PayJoy, Carmoola, Hnry, Taptap Send, Linktree, Hims & Hers, Talkspace, Pie Insurance, Airwallex. One agent covers chat, email, voice and SMS. It follows the customer's SOPs through multi-step flows (triage, data gathering, status checks, refunds) and acts through the customer's APIs. It hands over to humans with the investigation done. The result customers pay for is resolved tickets and, with Dreamweaver, conversions. Carmoola resolves 60% end to end with a 60% conversion uplift. PayJoy saw 30% more new customers use their credit line within 14 days against a control group. Hnry went from zero to 70% automation. [V] https://www.lorikeetcx.ai/ ; https://www.lorikeetcx.ai/product/dreamweaver

**2. Function catalogue.**
- **Concierge:** the customer-facing agent. Natural-language plus deterministic workflows; live context from the customer's systems; escalation with context. [V]
- **Dreamweaver:** a per-customer proactive account manager toward a set goal (activation, retention, conversion, LTV). Per-customer memory of goals, history and preferences. Observes on schedule and on change. Actions are a message, a staff task or nothing. It learns reply-time preferences. Contact hours, limits and consent are checked before every message. It routes customers who need a person, shows its reasoning, and runs a holdout measurement. Launch credits: $1,000 for the first 100 sign-ups. [V] https://www.lorikeetcx.ai/product/dreamweaver
- **Coach:** a "forward deployed agent" that guides setup during the trial, reviews results and proposes refinements. [V] https://www.lorikeetcx.ai/product/how-it-works
- **Voice** (inbound and outbound); **Outbound**; **Simulations** (bulk replay of historical tickets plus synthetic scenarios, projecting quality and knowledge gaps); **Quality Assurance** (live scoring on real resolution, not deflection); **Guardrails** (runtime checks). [V]
- **Integrations:** Zendesk, Intercom, Salesforce (admin-approved authorisation), Jira, Notion, Help Scout, Stripe, Linear, Google, HubSpot; Lorikeet API; MCP server; SDK; webhooks. [V]
- **Compliance:** ISO 27001, SOC 2 Type II, HIPAA; DPA and BAA standard. [V/F]

**3. How it works underneath.**
- Agentic orchestration plus deterministic operations. Sensitive operations (payments, identity checks) run as code the agent can invoke but cannot change. [V]
- Specialist agents can coordinate with third parties by phone, SMS, email and Slack. [V]
- Deployment is topic by topic, only where simulation evidence supports it. Untrained topics stay with humans. [V] https://www.lorikeetcx.ai/product/how-it-works
- The workflow authoring format and permission model are not published. [Unverified]

**4. Commercials.** [F] https://www.lorikeetcx.ai/pricing
- Start $2,100/month (paid annually; under 5,000 tickets a month); Scale $5,100/month (5,000 to 20,000); Signature custom (20K+, with a "$75K platform fee").
- Per unit, Start / Scale: resolution (chat, email, SMS) $0.99 / $0.90; voice resolution $1.50 / $1.20 (assumes a 3-minute call); triage $0.30 / $0.27; automated QA $0.30 / $0.27.
- Escalations and unresolved tickets are free.
- FDE Standard is included in Start and FDE Plus in Scale; FDE Platinum is $25K+.
- 30-day free trial; US data residency on Start and Scale.
- Funding: not on the site; not checked. [U]

**5. Why customers choose it.** [V/I]
- (i) It handles long regulated flows that FAQ bots cannot.
- (ii) Pay only for resolution.
- (iii) An FDE is included even at the entry tier.
- (iv) Evidence-gated, topic-by-topic rollout.
- (v) Head-to-head wins ("winner in every metric", Flex).

Complaints: none found.

**6. How it deploys.** Connect and train (helpdesk, docs, SOPs, brand guidelines), then simulate on historical tickets, then deploy topic by topic, then improve with Coach. Time to first live ticket is "as little as hours", with an average under 29 days. [V] https://www.lorikeetcx.ai/pricing

**7. What to copy.**
1. The pricing structure: an annual plan fee with included volume band, plus a per-outcome fee, plus small per-triage and per-QA fees, with escalations free. Translate it to collections: a plan fee, plus a fee per invoice moved to "paid", "promise to pay" or "payment plan agreed", with free hand-offs. https://www.lorikeetcx.ai/pricing
2. Dreamweaver's pre-send check: contact hours, frequency limits and consent before every outbound message, plus a holdout group to prove uplift. https://www.lorikeetcx.ai/product/dreamweaver
3. Locked code for money-moving steps (payment links, plan creation, write-off), callable but not editable by the agent. https://www.lorikeetcx.ai/product/how-it-works
4. Simulate on historical tickets before go-live, then go live topic by topic (for receivables: by customer segment or ageing bucket). https://www.lorikeetcx.ai/product/how-it-works
5. A "Coach" agent that does the FDE's first-week work. This is how a one-person company replaces forward-deployed staff. https://www.lorikeetcx.ai/product/coach (linked)

**8. What not to copy.** US-only data residency and HIPAA, which are irrelevant in Malaysia. The $75K platform fee tier is not for the founder's segment. [I]

**9. Relationship.** Teacher. A **potential competitor** if Dreamweaver adds a "collect" goal for its fintech and lender customers. [I]

---

### B6. HappyRobot: vertical voice and email agents that include collections

**1. In one paragraph.** HappyRobot sells "AI workers" that handle phone calls, emails and follow-ups for freight brokers, 3PLs and carriers (DHL, Uber Freight, Kuehne+Nagel, LKW WALTER, Circle Logistics). Buyers are operations leaders. Uses: dispatching, **payment collections**, customer support, general operations, quote follow-up and recovering lost accounts. It is expanding into telecoms, utilities, oil and gas, and P&C insurance. [F] https://www.freightwaves.com/news/happyrobot-series-c-freighttech-unicorn

**2. Function catalogue.** From the article only: voice agents, email agents, follow-up automation, and a platform for many use cases. The product site was not opened. [Unverified beyond the article]

**3. How it works underneath.** The company says it builds most of its models in-house and does not depend on third-party model providers. [V via F] Nothing else is published in my sources.

**4. Commercials.**
- $15.6M Series A (a16z) [H]; $44M Series B (Sep 2025) [H]; $150M Series C at $1.2B post (4 Aug 2026; Prysm Capital, Eurazeo). About $200M raised in 20 months. [F]
- 150+ enterprise customers; 5x growth since late 2025. [F]
- Pricing and team size not disclosed. [F]

**5. Why customers choose it.** [I] Freight is phone- and email-heavy with thin margins, so each automated call has a clear value. Strategic investors are customers (WALTER GROUP has 5 to 10 live use cases). [F]

**6. How it deploys.** It starts with one or two scoped use cases, then expands. [F]

**7. What to copy.**
1. Land with one narrow, high-volume, measurable job (for the founder, the overdue-invoice reminder sequence), then add adjacent jobs (dispute intake, payment-plan negotiation, statement requests). https://www.freightwaves.com/news/happyrobot-series-c-freighttech-unicorn
2. Bring customers in as investors or design partners, as WALTER did. Same source.

**8. What not to copy.** In-house models; the founder rents models by design. [I]

**9. Relationship.** Teacher. A competitor only if it enters SEA mid-market receivables. [I]

---

### B7. Relevance AI: horizontal agent platform turned GTM "factories"

**1. In one paragraph.** Relevance AI (Sydney/SF) began as a no-code platform to build any agent or "AI workforce". By Nov 2026 it leads with "AI Factories": packaged go-to-market workflows (PipeGen inbound and outbound, pipeline, activation, renewal, expansion, bookings) that combine specialist agents, connectors and evals. Buyers are RevOps, sales, marketing, CS and support leaders, plus IT and security as approvers. Named customers: Qualified ($7M pipeline in six months, 35+ agents), Zembl (30% more conversions), Send Payments (40 hours a week saved), Canva, Autodesk, Databricks, Confluent, Freshworks, Employment Hero. [V] https://relevanceai.com/

**2. Function catalogue.**
- *Build:*
  - Invent (an "AI factory engineer" that designs and builds the process with you).
  - Visual canvas, AI Agents, AI Workforce (multi-agent canvas with hand-offs), AI Tools (no-code actions: email, CRM update, web search, API call).
  - MCP and plugins; Knowledge (RAG over uploads, Drive, SharePoint, Notion, websites).
  - Metadata, collaboration, phone agent, calling and meeting agents, templates and marketplace. [V] https://relevanceai.com/ ; https://relevanceai.com/docs
- *Run and govern:*
  - Per-factory permissions with "requires approval" and "never allowed" actions.
  - Approvals and handoffs in Slack and Teams.
  - Version control with history and rollback.
  - Evals (plain-language rules score every task; daily quality tracking); A/B testing.
  - Reporting (pipeline, cost per outcome, quality by version).
  - Enterprise triggers; autonomy levels L1 Assisted, L2 Copilot, L3 Autopilot, L4 Self-improving.
  - SSO, RBAC, audit log; SOC 2 Type II; hosting in US, EU or AU. [V]
- *Packaged agents:* Research & Enricher, Outbound Prospector, Meeting Scheduler, Deal Reviewer; the BDR multi-agent system via sales. [V/F]
- *Ecosystem:* partner programme, AI Ops Bootcamp certification, Academy, community. [V]

**3. How it works underneath.** The public docs introduction only describes concepts. The data model, limits and credit costs were not in the pages read. [Unverified] https://relevanceai.com/docs

**4. Commercials.** The pricing page shows only an Enterprise tier, sales-led, with unlimited agents, users and workforces, custom actions and vendor credits, 2,000+ integrations, evals, A/B tests, SSO, RBAC, audit logs and a dedicated account manager. [F] https://relevanceai.com/pricing. Funding: not checked this run. [U]

**5. Why customers choose it.** [I] Breadth of integrations, a governance checklist IT accepts, and packaged GTM outcomes. Complaints: not gathered.

**6. How it deploys.** Sales-led with an account manager; partners and certified builders. [F/V]

**7. What to copy.**
1. Action permission states per agent and per action: allowed, requires approval, never allowed. https://relevanceai.com/
2. An explicit autonomy ladder (L1 to L4) that the customer chooses per playbook, with reporting by version. https://relevanceai.com/
3. Evals written as plain-language rules that score every task daily (for example, "message cites the correct invoice number and amount"; "no threat language"). https://relevanceai.com/
4. Report cost per outcome by version, visible to the customer. https://relevanceai.com/

**8. Where it is weak.** The horizontal start forced a refocus. Dropping self-serve tiers shuts out the smaller firms the founder targets. [I]

**9. Relationship.** Teacher, and a warning. Unlikely to compete in receivables. [I]

---

### B8. Feishu/Lark aily and Base AI: the suite platform

**1. In one paragraph.** Feishu (Lark outside China), ByteDance's work suite, offers aily, an enterprise agent platform. Any employee or developer creates an agent that lives as a chatbot in the contact list, joins workflows, tracks work, runs scheduled tasks and delivers results. Base (多维表格, multi-dimensional tables) can now generate whole business systems from a description. Buyers are IT and operations leaders at Chinese and Asian companies that already run on Feishu or Lark. [F] https://www.qbitai.com/2026/03/389311.html

**2. Function catalogue.**
- *aily (upgraded 19 Mar 2026):*
  - Built-in office skills (calendar, tasks, minutes, docs, Base), some needing admin approval.
  - No-code business skills; knowledge-space links that update automatically.
  - Scheduled proactive tasks; a proxy channel to internal systems.
  - Recording into Base and analysis reports from Base and MySQL.
  - Memory from real work; aily Pro as a standalone web app for complex work. [F] https://www.qbitai.com/2026/03/389311.html ; https://feishu.cn/content/article/7631864469689240764
- *Publishing and governance (23 Apr 2026):*
  - Standard mode (developers edit persona and skills in the console; changes apply on publish) or seamless mode (edit by chat).
  - Every publish creates a change record with diff and one-click rollback.
  - Central management, logs and permissions. [F]
- *Base AI building (launched 19 Mar 2026):* the agent clarifies the need, drafts a requirements document, then generates tables, dashboards, surveys, **permission settings** and full systems. [F]
- *Miaoda (妙搭):* natural-language generation of business systems and agents. In a demo, about 100 yuan of tokens built an app the article values at up to 20,000 yuan. [F]
- *Official OpenClaw plugin (open source):* lets OpenClaw operate docs, Base and calendars as the user. Volcano Engine, StepFun, Kimi, Coze, MiniMax and Zhipu have integrated. [F]

**3. How it works underneath.**
- Agent permissions equal the user's permissions exactly. Memory is isolated per user and per group (one agent serving 100 people shows each person only their own data). Credentials are held centrally, not by the agent. [F]
- For the founder's own Lark bots, the platform's identity and permission system is the one to integrate with. [I]

**4. Commercials.** A free quota of up to 1,700 points for the first custom agent (Apr 2026 campaign; about 100 medium conversation rounds). After that an admin buys a Feishu AI package. Detailed billing was not opened. [F] One case: OTO retail staff in Hong Kong and Macau cut order time from 10 to 2 minutes and errors from 10% to 0%. [V]

**5. Why customers choose it.** It is already where staff work, identity and org chart are included, the cost is low, and governance is built in. [I]

**6. How it deploys.** Self-serve inside the tenant; admin approval for some skills. [F]

**7. What to copy.**
1. Agents act with exactly the invoking user's permissions, with per-user memory isolation and central credential custody. https://feishu.cn/content/article/7631864469689240764
2. Every publish of an agent or playbook gets a change record with diff and one-click rollback. Same source.
3. Ship the internal face as a Lark (and later WhatsApp or Teams) bot, not only a web app. https://www.qbitai.com/2026/03/389311.html

**8. What not to copy.** Generic "build any system" generation. That is the suite vendor's game, and it produces ungoverned one-off tables. [I]

**9. Relationship.** Both a **channel** (distribution through the Lark app ecosystem, bots in customers' Lark tenants) and a **substitute** (a finance manager could build a crude receivables tracker in Base AI). [I]

---

### Comparison table (the eight)

| | Rox | Numeric | Maisa | Basis | Lorikeet | HappyRobot | Relevance AI | Feishu aily |
|---|---|---|---|---|---|---|---|---|
| Job | Revenue team agents | Close, cash, billing, collections | Process digital workers | Close, tax, audit | Support plus outbound | Freight calls, email, collections | GTM factories | Workplace agents |
| Buyer | CRO / RevOps | Controller / CFO | Ops / finance at banks, insurers | Accounting firms | CX / ops in regulated firms | Freight ops | RevOps / GTM | IT / ops |
| Governed model | Warehouse-native KG with lineage, policy, audit | Whole records plus approved rules | Versioned workers, immutable audit | Rules plus review | Locked code for sensitive steps | Not published | Permissions, approvals, versions | User-equal permissions, change log |
| Pricing | Actions, unlimited seats ($100 to $255/month self-serve) | Custom (transactions to seats) | Not published | Not published | Plan fee plus $0.99 per resolution | Not published | Enterprise only | AI points packages |
| Deploy time | 45 days (MongoDB) | Scoped upfront | 6 weeks (1-3-6) | Not stated | Under 29 days average | 1 to 2 use cases first | Sales-led | Self-serve |
| Money | $1.3B (Nov 2026) | Not checked | $25M seed (Aug 2025) | $1.15B (Feb 2026) | Not checked | $1.2B (Aug 2026) | Not checked | Part of ByteDance |
| Relation to founder | Teacher | **Competitor** | Teacher | Teacher / channel model | Teacher / possible competitor | Teacher | Teacher / warning | **Channel and substitute** |

---

## Part C. What makes huge organisations want these products

Seven recurring reasons, with evidence, and whether a one-person company can acquire each.

**1. A measurable outcome the buyer can attribute.** Hours per tax return (Basis: 100+ down to 15 to 20); close days (Numeric/Brex: 6 to 4); resolution rate (Carmoola 60%); conversion against a holdout (PayJoy +30%); pipeline (Qualified $7M). Vendors price on it: Lorikeet per resolution, Crescendo "Total Outcome Guarantees", Rox per action. [V/F, sources above]
*Solo company:* **Yes.** Receivables has the most attributable outcome in finance: cash collected and days sales outstanding (DSO) moved. Copy Dreamweaver's holdout group to prove it. [I]

**2. Control: approvals, audit and determinism where money or law is involved.** Maisa (versioned approval pipeline, immutable audit, deterministic re-execution); Numeric (models never compute numbers; approved treatments become rules); Lorikeet (sensitive steps as locked code); Relevance AI (requires-approval and never-allowed actions); Feishu (change records with rollback). [V/F]
*Solo company:* **Yes.** These are design choices, not headcount. They are already central to the founder's "company model with permissions and actions". [I]

**3. Works inside existing systems, with no migration.** Rox inside the warehouse; Numeric beside NetSuite; Lorikeet inside Zendesk and Intercom; Parloa inside Genesys and Five9; Feishu inside the suite. [V/A]
*Solo company:* **Partly.** One person can build three or four connectors (for Malaysian mid-sized firms likely Xero, AutoCount or SQL Account, QuickBooks, plus email and WhatsApp or Lark), not 2,000. Choose the first ERP by customer, not by market share. [I; the Malaysian ERP list is unverified]

**4. Speed to production with people included.** Lorikeet includes an FDE in every plan and averages under 29 days; Maisa promises 6 weeks; MongoDB on Rox took 45 days; HappyRobot starts with one or two use cases. [F/V]
*Solo company:* **Partly.** One founder can be the FDE for 5 to 10 customers. Beyond that, copy Lorikeet's Coach (a setup agent) and keep each playbook template-driven. [I]

**5. Peer proof in a closed professional community.** Basis's 30% of the top 25 firms; HappyRobot's freight logos and customer-investors; Clay's community and 100+ agencies; Parloa's BPO partners. [F/A]
*Solo company:* **Slowly.** Start with one community (for example, Malaysian accounting firms or one industry association) and win three referenceable customers before broad marketing. [I]

**6. Security, compliance and deployment options.** SOC 2 Type II, ISO 27001, HIPAA (Lorikeet); SSO, RBAC and audit logs as enterprise gates (Relevance AI, Rox); on-prem and VPC (Maisa); data residency choices (Relevance AI US/EU/AU). [V/F]
*Solo company:* **Partly.** SOC 2 is reachable with a compliance-automation tool plus a supplier with SOC 2 (file 13: Supabase Team $599/month). On-prem is not. For Malaysia, the Personal Data Protection Act (PDPA) and data-residency questions will matter more than SOC 2. [I]

**7. A vendor that will keep unit cost falling.** Maisa's owned small models (14x lower cost claimed); Clay unbundling data from orchestration; Moonshot, Zhipu and MiniMax pushing model prices down. [V/A/F]
*Solo company:* **Yes, by design.** Renting models lets the founder pass falling prices on. Keep traces for future distillation. Never promise a fixed per-seat price that model costs could break (Cursor's lesson). [I/A]

**What a one-person company cannot acquire:** large-account trust built on a brand and a big balance sheet (a Fortune 500 security review); a bench of FDEs; contact-centre-scale voice; on-prem builds. The answer is the founder's chosen segment (100 to 1,000 staff), which buys on outcome and speed, not on vendor size. [I]

---

## Part D. Threats versus partners and channels

### Real threats (ranked)

1. **Numeric.** It already bundles invoicing, collections automation, an agent builder whose example task is chasing overdue invoices, and MCP access, for growth-stage companies. It is the threat if the founder sells to US or venture-backed firms. It is weaker in SEA: no messaging-channel focus and no local ERPs. [V/I]
2. **Suite-native DIY: Feishu/Lark Base AI plus aily, DingTalk/QwenWork, Genspark AgentBase.** A finance manager can prompt a receivables tracker with reminders into existence. The defence is governed semantics (ageing rules, promise-to-pay tracking, dispute states, contact compliance) and measured cash results, which DIY systems lack. [F/I]
3. **Lorikeet Dreamweaver and similar outbound agents.** One configuration away from a "collect" goal for lenders and fintechs. [V/I]
4. **HappyRobot, and SEA voice players such as WIZ.AI.** Voice collections in verticals and in SEA. [F/H/U]
5. **Maisa and RPA-successor players** for O2C at larger firms. [V]
6. Big platforms and receivables specialists are covered by the other agents in this round; see their files.

### Potential partners and channels

- **Lark/Feishu app ecosystem:** distribute the internal face as a Lark bot; use Lark identity and permissions. The founder already builds Lark bots (from the user's memory, not from this research). [I]
- **Accounting firms and outsourced bookkeepers (the Basis model, Clay's "Claygencies"):** they run receivables for mid-sized clients and could operate or resell the product. [I]
- **BPOs and collection agencies (the Parloa and Crescendo channel):** supply the human escalation tier that a one-person company cannot staff. [A/I]
- **Suppliers:** Supabase (database plus a SOC 2 report), Stripe or local payment gateways (payment links in reminders), Clerk or WorkOS (SSO), DBOS or Temporal (durable execution), Dify or Coze Studio code as reference only, and Moonshot, Zhipu or Qwen models as low-cost routes. [F/U/I]
- **Rox, Relevance AI, Clay:** not partners. They are teachers in different functions.

---

## What to copy (consolidated)

1. **Three-layer architecture with governance inside the context layer** (lineage, policy, unified user-and-agent permissions, audit, access provenance). https://launch.rox.com/product-architecture ; https://research.contrary.com/company/rox
2. **"Agent proposes, human approves, approval becomes a deterministic rule for similar records"** for every receivables treatment. https://www.numeric.io/product/ai-in-numeric
3. **No model arithmetic.** Balances, ageing, interest and plan schedules are computed by code. https://www.numeric.io/product/ai-in-numeric
4. **Locked code for money-moving and identity steps,** callable but not editable by the agent. https://www.lorikeetcx.ai/product/how-it-works
5. **Pre-send compliance check on every outbound message:** contact hours, frequency limits, consent, and an escalation flag. https://www.lorikeetcx.ai/product/dreamweaver
6. **Holdout group per customer** to prove cash-collection uplift. https://www.lorikeetcx.ai/product/dreamweaver
7. **Per-action permission states:** allowed, requires approval, never allowed. Add an autonomy level (L1 to L4) per playbook. https://relevanceai.com/
8. **Playbook definition fields:** objective, process knowledge, rules, controls, exceptions, expected outcome. https://maisa.ai/
9. **Version control with an approval pipeline,** plus change records with diff and one-click rollback. https://maisa.ai/product ; https://feishu.cn/content/article/7631864469689240764
10. **Deterministic replay of past runs as regression tests,** and simulation on historical data before go-live, rolled out segment by segment. https://maisa.ai/product ; https://www.lorikeetcx.ai/product/how-it-works
11. **Agents act with the invoking user's permissions,** with per-user memory isolation and central credential custody. https://feishu.cn/content/article/7631864469689240764
12. **MCP server over the governed model,** so the customer's own assistant answers through it. https://www.numeric.io/
13. **Pricing:** plan fee plus per-outcome fee plus small triage and QA fees; escalations free; included onboarding help; 30-day trial; unlimited seats. https://www.lorikeetcx.ai/pricing ; https://research.contrary.com/company/rox
14. **A bounded, published deployment promise** (1-3-6 weeks, or "under 29 days"). https://maisa.ai/ ; https://www.lorikeetcx.ai/pricing
15. **A setup "Coach" agent** to replace forward-deployed staff. https://www.lorikeetcx.ai/product/how-it-works
16. **The daily review pack as the product's main screen** (Basis workpapers; Numeric's command centre). https://www.getbasis.ai/ ; https://www.numeric.io/product/ai-in-numeric

## What cannot or should not be copied

- Warehouse-native deployment (Rox): the target firms have no warehouse. [I]
- On-prem and regulatory rule packs (Maisa), and HIPAA and US residency (Lorikeet): not the segment. [I]
- In-house models (HappyRobot) or owned SLMs (Maisa) before about 100K runs a month. [I]
- ERP replacement (Numeric), or general "build any app" (Feishu Miaoda, Genspark AgentBase): scope traps. [I]
- Venture-scale growth plans at 40 to 150x ARR (Rox, Clay). [A]
- Headline-driven AI SDR marketing without attributable outcomes (11x, Artisan). [A/I]

## Open questions and unverified items

- Numeric's funding, revenue, customer count, Agent Builder mechanics and collections feature depth. The engineering blog (https://numeric.substack.com/) and the Billing & Revenue page were not opened.
- Lorikeet's funding and its workflow-authoring format.
- Maisa's KPU internals and pricing.
- HappyRobot's product pages, pricing and collections results.
- Relevance AI's credit and action costs, approvals data model and funding.
- Feishu AI package prices and aily permission APIs. Lark's international AI page failed to load (client error).
- Every [U] figure in Part A: Ada, Cresta, Abridge, Ambience, Hippocratic, EvenUp, Spellbook, Tennr, Assort, Scale/Meta, Invisible, Distyl, Supabase, Stripe, Vercel, LangChain, Databricks valuations. These are background knowledge and must be checked before citing.
- Not studied at all for lack of budget: PolyAI, Unify, Gumloop, Sintra, Marblism, Pallet, Vooma, Sola, Thoughtful AI, Duvo, Tribe AI, Yellow.ai, the Japanese and Korean firms, and Dify's funding.
- OpenEvidence figures conflict ($12B Jan 2026, a later "$15B", Jul 2026 talks at $20B); the order is unclear from headlines.
- Clay's $7.1B Series D date was not seen.

## Sources (ranked by usefulness)

1. https://www.lorikeetcx.ai/pricing (Nov 2026): the full published outcome-pricing table, FDE bundling, trial and time to live.
2. https://research.contrary.com/company/rox (updated through Oct 2026): Rox modules, pricing archive, ARR, funding, governance features and risks.
3. https://launch.rox.com/product-architecture (2026): the Context, Agents, Apps diagram with governance items.
4. https://www.numeric.io/pricing (Nov 2026): the module list, including collections automation.
5. https://www.numeric.io/product/ai-in-numeric (2026): the no-model-arithmetic rule and the propose-approve-rule loop.
6. https://www.numeric.io/ (Nov 2026): full navigation, customers and results.
7. https://www.lorikeetcx.ai/product/dreamweaver (2026): outbound agent guardrails and holdout measurement.
8. https://www.lorikeetcx.ai/product/how-it-works (2026): locked code for sensitive steps; the topic-by-topic rollout.
9. https://maisa.ai/product (2026): governance features (versioning, audit, replay, permissions, deployment).
10. https://maisa.ai/ (2026): worker definition fields, use cases and the 1-3-6 method.
11. https://feishu.cn/content/article/7631864469689240764 (23 Apr 2026): aily permissions, memory isolation, change records, pricing quota.
12. https://www.qbitai.com/2026/03/389311.html (19 Mar 2026): Feishu enterprise agent launches (aily, Base AI, Miaoda, OpenClaw).
13. https://relevanceai.com/ (Nov 2026): action permission states, autonomy levels, evals.
14. https://siliconangle.com/2026/02/24/ai-accounting-startup-basis-secures-100m-1-15b-valuation-firms-adopt-agent-based-workflows/ (24 Feb 2026): Basis funding and its agent design.
15. https://www.getbasis.ai/ (Nov 2026): Basis solutions and quantified testimonials.
16. https://www.freightwaves.com/news/happyrobot-series-c-freighttech-unicorn (4 Aug 2026): HappyRobot round, customers and use cases including collections.
17. https://sacra.com/research/clay-crosses-150m-year/ (30 Jun 2026): Clay ARR and the Mar 2026 credits-versus-actions pricing split.
18. https://research.contrary.com/company/clay (2025): Clay community, agencies and early growth.
19. https://www.numeric.io/product/agentic-subledgers (2026): approved treatment becomes a hard-coded schedule rule.
20. https://maisa.ai/landings/chain-of-work (2026): logged, deterministic execution principle.
21. https://techcrunch.com/2025/08/27/maisa-ai-gets-25m-to-fix-enterprise-ais-95-failure-rate (27 Aug 2025): Maisa funding, team, HALP and chain of work.
22. https://unite.ai/rox-raises-100m-series-b-at-1-3b-valuation-to-advance-ai-research (Nov 2026): Rox Series B and customer results.
23. https://sacra.com/c/parloa (2026): Parloa ARR estimate, NRR and BPO channel.
24. https://research.contrary.com/company/anysphere (Dec 2025): Cursor ARR, pricing shift and contract sizes.
25. https://businesswire.com/news/home/20260617758937/en/ (17 Jun 2026): Genspark ARR, valuation and AgentBase.
26. https://www.euronews.com/2026/10/06/moonshot-ai-eyes-hong-kong-ipo-after-50-billion-valuation-as-deepseek-raises-capital (6 Oct 2026): Moonshot valuation and ARR; Zhipu and MiniMax listings.
27. https://www.sarvam.ai/announcing-series-b (15 Jun 2026): Sarvam round and enterprise usage.
28. https://www.globenewswire.com/news-release/2025/09/25/3156529/0/en/ (25 Sep 2025): Crescendo ARR path and model.
29. https://sacra.com/c/crescendo (2026): Crescendo's outcome guarantees.
30. https://relevanceai.com/pricing and https://relevanceai.com/docs (Nov 2026): the Enterprise-only tier and docs table of contents.
31. Headline-only sources (not opened; check before citing):
    - Parloa: https://techcrunch.com/2026/01/15/parloa-triples-its-valuation-in-8-months-to-3b-with-350m-raise
    - Giga: https://fortune.com/2025/11/05/voice-ai-giga-raise-61-million-customer-service-series-a/
    - Lovable: https://techcrunch.com/2025/12/18/vibe-coding-startup-lovable-raises-330m-at-a-6-6b-valuation/ ; https://dealroom.co/news/144597-lovable-raises-400m-at-13-3b-valuation-eyes-600m-revenue-run-rate/
    - Cursor: https://thenextweb.com/news/cursor-anysphere-2-billion-funding-50-billion-valuation-ai-coding
    - OpenEvidence: https://www.cooley.com/news/coverage/2026/2026-01-22-openevidence-raises-$250-million-series-d ; https://dealroom.co/news/139883-openevidence-eyes-200m-raise-at-20b-valuation-up-from-12b/
    - Legora: https://techcrunch.com/2026/03/10/legora-reaches-5-55-billion-valuation-as-ai-legaltech-boom-endures/ ; https://dealroom.co/news/164722-legora-raises-550m-at-8-8b-as-legal-ai-becomes-a-two-horse-race-with-har/
    - Clay: https://www.businesswire.com/news/home/20260128514638/en/
    - Zhipu: https://www.caixinglobal.com/2026-01-08/chinas-zhipu-ai-jumps-in-hong-kong-debut-102401610.html
    - Southeast Asia: https://www.jtc.gov.sg/about-jtc/news-and-stories/industry-news/wiz-ai-raises-tens-of-millions-in-series-b ; https://lite.aol.com/tech/story/0022/20260320/9675922.htm ; https://www.dealstreetasia.com/?p=497083 ; https://www.crowdfundinsider.com/2026/08/297239-southeast-asia-ai-startup-funding-hits-4-1bn-in-2026/
