# Receivables and collections automation: the direct competitors

Scope note (21 November 2026). This file covers the vendors that already sell the founder's first job, accounts receivable (AR) and collections automation: the enterprise order-to-cash suites (HighRadius, Billtrust, Versapay, Esker, Sidetrade, Emagia, Serrala, Bectran, Quadient AR), the mid-market and SMB tools (Upflow, Chaser, Kolleno, Gaviti, Tesorio, Growfin, Centime, Invoiced/Flywire, Paidnice, Satago), regional players (Peakflo in Southeast Asia, Levers/Wafeq and ClearGrid in the Gulf, Debtor Daddy and CreditorWatch Collect in Australia), the native features of Stripe, QuickBooks and Xero, and the AI-native entrants funded in 2025 and 2026 (Stuut, Fazeshift, Monk, Paraglide, AgentCollect). It was written under a hard web budget shared with other agents; the shared fetch pool ran out partway through (see "Open questions"). Every claim is labelled. "[Vendor claim]" means the vendor said it on its own page, unaudited. Items marked "[Unverified]" come from background knowledge that I could not re-check in this round; treat them as leads, not facts.

## Key findings

1. **The job is crowded at every price point, and the crowding moved to AI agents in 2025 and 2026.** At least four AI-native AR start-ups raised Series A or seed rounds in the 12 months to November 2026: Stuut ($29.5M, a16z, Nov 2025), Monk ($25M, Apr 2026), Fazeshift ($17M, F-Prime, May 2026) and Paraglide ($5M seed, Bessemer and DN Capital, Jan 2026). [Fact] sources below. Every incumbent now sells "agents" too: HighRadius claims 190+, Sidetrade has Aimie Agents plus an Agent Builder Studio, Upflow, Tesorio, Emagia, Gaviti, Esker and Billtrust all market agentic collections.
2. **The function list is now standard.** Almost every vendor sells the same seven blocks: dunning sequences, a prioritised collector worklist, cash application (payment-to-invoice matching), dispute/deduction handling, credit decisions, a customer payment portal, and cash forecasting. Newer additions that are spreading fast: AP-portal agents that submit invoices into the buyer's Coupa or Ariba (Tesorio, Upflow, Monk, HighRadius), inbound-email reading that extracts promises to pay (Tesorio, Sidetrade), outbound voice calling (Sidetrade, Emagia, Stuut, Peakflo), and MCP connectors to Claude and ChatGPT (Tesorio, Paidnice, Billtrust).
3. **What the AI actually does is narrow.** Across vendor pages the "AI" is: drafting and personalising reminder emails, reading inbound replies and classifying them, extracting remittance data from PDFs and emails for matching, scoring credit or payment risk, choosing who to chase first, and timing card retries. The sequence logic, escalation steps, credit-limit rules and approval thresholds are still configured rules almost everywhere. Sidetrade says this plainly: it compares its "Aimie-driven" workflow efficiency (68%) with rule-based approaches (about 50%). [Vendor claim] https://www.sidetrade.com/core-platform/aimie-agent.md
4. **Pricing splits into three bands.** SMB tools publish prices: Paidnice from US$69 a month, Chaser US$233 to US$1,050 a month (annual), Kolleno US$545 to US$995 per user per month. Mid-market tools (Upflow, Gaviti, Tesorio, Growfin, Centime, Versapay, Quadient) quote by invoiced revenue or invoice volume and hide prices. Enterprise suites (HighRadius, Billtrust, Esker, Sidetrade, Emagia, Serrala) sell multi-module contracts; HighRadius now offers $0 implementation and $0 subscription until go-live, then a share of measured savings. [Fact/Vendor claim] URLs in sections.
5. **Deployment time is the AI-natives' main attack.** Stuut claims live in under a week (3 to 4 days for named customers) against 6 to 18 months for traditional AR software. Paraglide claims "financial inbox-zero" in the first onboarding week. [Vendor claim] Incumbents rarely publish a timeline; Emagia's own case study describes a 15-month global rollout. [Vendor claim]
6. **The 100 to 1,000 staff segment is served by tools sized by revenue, not by complexity.** Upflow's tiers run from up to $10M invoiced revenue (Starter) to over $100M (Enterprise); Kolleno's from under GBP 1M to over GBP 1B. A 300-person distributor with $80M revenue, NetSuite or Business Central, three entities and messy remittances lands in "Accelerate" or "Enterprise" quote-only tiers in Upflow, where cash application and Salesforce sync only arrive. [Fact] https://upflow.io/pricing
7. **Mid-sized firms say cost and staff training block automation.** A PYMNTS/Esker report (Aug 2024) found 96% of mid-sized firms face barriers to adopting AR automation, cost was the main one, and 37% of executives had paused or scrapped projects because of staff training time. [Fact] https://www.pymnts.com/tracker_posts/businesses-at-risk-the-high-cost-of-manual-ar-processes-and-what-to-do-about-it/
8. **No vendor I could read publishes an explicit, inspectable model of the customer's own allocation, credit-note and dispute rules with "show the rule behind this number".** The closest is Sidetrade, which says custom agents are built "on governed O2C domain models" with audit trails and escalation policies, but the public page does not describe the schema, permissions or testing. [Fact] https://www.sidetrade.com/core-platform/agent-builder-studio.md Paidnice's "drafted replies awaiting approval" and Tesorio's "Controls & Governance" are approval and audit features, not a rule model. [Inference]
9. **A few vendors already combine an internal analyst with external outreach.** Tesorio (AI Chat and MCP over live AR data, plus Collections Agent), Upflow (Insights Agent on all plans plus Collections Agent from Scale), Sidetrade (Aimie IQ insight plus Aimie Agents execution), Billtrust (Claude and Copilot connection plus agentic collections). None publicly describes the two faces as running through one governed model with shared definitions; they are separate features on a shared database. [Inference from vendor pages]
10. **Southeast Asia and the Gulf are thin.** Peakflo (Singapore-centred) is the only regional AR platform I found with AI voice, browser and WhatsApp agents and local ERPs (Jurnal, Xero, QuickBooks, NetSuite, SAP Business One). [Vendor claim] https://www.peakflo.co/ In the Gulf, the visible offers are a Wafeq accounting integration with a dunning tool called Levers (no AI mentioned, 2024) and consumer debt collectors (ClearGrid, InDebted). [Fact] I found no Malaysian B2B AR collections product. [Inference, limited search]
11. **Native accounting features set a low floor.** QuickBooks Online sends up to three automatic email reminders, scheduled up to 90 days before or after the due date, only for invoices already emailed, with template variables; Advanced users get workflows, and the new "Intuit Intelligence" can set reminders by prompt. [Fact] https://quickbooks.intuit.com/learn-support/en-sg/help-article/invoicing/send-invoice-reminders-automatically-manually/L84cQjpxo_SG_en_SG Stripe adds AI-timed card retries (default up to 8 retries in 2 weeks), reminder schedules and partial-payment tolerance. [Fact] https://docs.stripe.com/invoicing/automatic-collection
12. **The published evidence on manual-collections cost is weak and vendor-sponsored.** Best figures: 40% of businesses spend 6+ hours a week on AR tasks; 92% are typically paid late; 23.1% write off 3 to 5% of revenue and 10% write off 6%+ (Chaser 2026 report, 163 validated responses, mainly UK and Australia). [Fact] 27% of firms spend at least half their AR team's time on disputes (PYMNTS/Versapay, Jul 2025). [Fact] DSO-reduction claims cluster at 10% (HighRadius), 25% (Esker "up to"), 30% (Tesorio), 33% (Growfin), 34% (Paraglide), 37 to 40% (Stuut, Monk). [Vendor claims]
13. **Blunt verdict:** collections is a good first proof of the founder's architecture because the outcome (cash in, DSO down) is measurable in weeks and the rules (allocation, credit notes, disputes, who may promise what) are exactly what a governed model is for. It is too crowded to win as "another AI collections agent". The under-served wedge is mid-sized multi-entity B2B companies in Southeast Asia on Xero, QuickBooks, Business Central, NetSuite or local ERPs, whose customers reply on WhatsApp, who need explainable numbers for the finance head, and who are priced out of enterprise suites and under-served by UK/US tools. See the final assessment.

## Breakdown

### Common vocabulary for a newcomer

- **Dunning sequence:** a scheduled series of reminders. Example: email 7 days before due, on the due date, then SMS at +7 days, a call task at +14, a statement at +30.
- **Collector worklist:** a ranked to-do list telling a human (or agent) which customers to chase today.
- **Cash application (cash app):** matching a received payment to the invoices it pays. Example: a customer pays 41,800 for invoices 1001, 1002 and 1005 minus a 200 short-pay; cash app must find that combination and post it to the ERP.
- **Deduction / short-pay / dispute:** the customer paid less, or refuses to pay, citing damage, pricing, promotions or missing proof of delivery.
- **Credit management:** deciding whether to give a customer credit and how much, and putting orders on hold when they exceed it.
- **EIPP / customer portal:** a web page where the buyer sees invoices, pays, downloads statements and raises disputes.
- **AP portal:** the buyer's own procurement portal (Coupa, Ariba, Tungsten) where the seller must upload invoices to get paid.
- **DSO (days sales outstanding):** roughly receivables divided by daily sales. Lower means cash comes in faster.

### HighRadius (enterprise; "autonomous receivables")

**In one paragraph.** HighRadius is the largest dedicated order-to-cash and finance-automation vendor. It sells to CFOs, controllers, credit and collections heads and shared-service leaders in large and mid-sized enterprises (it claims 1,500+ customers and 200+ of the Fortune 1000), mainly in manufacturing, CPG, distribution and chemicals. Customers pay for lower DSO, fewer past-due balances, higher touchless cash-application rates and fewer collectors per dollar collected. [Vendor claim] https://www.highradius.com/product/accounts-receivable-automation/

**Function catalogue** (as grouped on its AR pages, Nov 2026). [Vendor claim, same URL]
- Collections: AI-prioritised collector worklist; automated dunning; collection software; invoice collection; dunning management.
- Cash Application: auto-posting of cash; line-item remittance matching; remittance processing; remote deposit capture; bank and lockbox ingestion (BAI2, MT940, lockbox files from 100+ banks).
- Deductions: auto-coding of deductions; validity checking; routing for resolution; exception management; dispute management; trade promotion deductions; claim download from retailer portals.
- Credit: online credit application; credit scoring; credit risk monitoring; credit decisions engine; blocked-order review and release.
- E-invoicing and EIPP: electronic invoicing and presentment; buyer/supplier portal.
- B2B Payments: payment gateway; credit-card surcharge; interchange-fee optimisation.
- AR forecasting and analytics: DSO visibility, aging, cash forecast dashboards; O2C analytics; "LiveCube" no-code analytics; "FreedaGPT" generative assistant.
- Connectivity: SAP, Oracle, NetSuite, Microsoft Dynamics, Workday; Coupa, Ariba, Tungsten and "600 customer portals"; Stripe, FIS, Worldpay; email, EDI, cheques.
- Adjacent suites: accounts payable, close and reconciliation, consolidation and reporting, treasury and risk.
- Agents: the AR page says 60+ agents; the Feb 2026 pricing release says the whole platform has 190+ agents. Named examples: dunning and surcharge billing, claim download and validity predictor, invoice matching and exception handler, dunning and worklist prioritisation, buyer portal and interchange fee, blocked-order review and credit application. [Vendor claim] https://www.businesswire.com/news/home/20260227310299/en
- Roadmap: in Feb 2025 HighRadius set a goal of "fully autonomous" capabilities driving 90%+ automation across the office of the CFO by 2027, with 186 agents GA at that time. [Vendor claim, as reported in the 2026 release]

**How it works underneath.** Published detail is thin. The pattern visible from the pages: pre-built ERP connectors pull open items and customer master; bank files and remittance documents feed a matching engine; agents are tied to named KPIs (for example, the dunning agent to past-due reduction). HighRadius says it "guarantees" KPI improvements by mapping KPIs to agents, which implies each agent has an owned metric and a baseline. [Vendor claim/Inference] No public description of how customer-specific rules are stored.

**Commercials.** Outcome-based pricing ("mutually agreed success criteria"): $0 implementation, $0 subscription until go-live, then a share of measured gains; the share is not disclosed (announced 27 Feb 2026). [Vendor claim] https://www.businesswire.com/news/home/20260227310299/en Customer results quoted on the AR page: DSO down 10% within 12 months, past-due down 20%, productivity up 40% (also "3X"), 90%+ touchless cash app, Coca-Cola bottlers recovered $33.4M, L'Oreal 96% cash app, DXP DSO down 20 days, Chevron Phillips Chemical zero bad debt four years running. [Vendor claim] Funding and valuation: [Unverified] last widely reported as a $3.1B valuation in 2021.

**Why customers choose it.** Breadth across all O2C modules in one vendor; analyst positioning (it claims leadership in Gartner, Hackett, IDC and Everest 2026 reports); deep SAP/Oracle connectors and bank/lockbox coverage; now, risk-free outcome pricing. [Vendor claim] Complaints: I could not open review sites this round. [Unverified] Commonly reported themes elsewhere are long implementations and heavy services dependence.

**How it deploys.** No timeline published; "pre-built connectors" and "faster deployment". [Vendor claim]

**What to copy.** (1) Tie each agent to one named KPI with a baseline and measure it; that is also the basis for outcome pricing. https://www.businesswire.com/news/home/20260227310299/en (2) Name agents by job (worklist prioritisation, claim validity predictor) so buyers can map them to their org chart. https://www.highradius.com/product/accounts-receivable-automation/

**What not to copy.** The module sprawl (dozens of overlapping solution pages) and inconsistent claims on one page (1,100+ vs 1,500+ customers; 30 to 40% vs 3X productivity) undermine trust. Gain-share pricing needs a measurement apparatus a solo founder cannot staff early.

**Relationship.** Competitor at the top end; teacher for outcome pricing and KPI-per-agent. Not a realistic competitor for 100-staff firms.

### Billtrust (enterprise and upper mid-market)

**In one paragraph.** Billtrust sells a "B2B cash generation platform" to finance executives and AR leaders in distribution, manufacturing, business services, medical and transportation. It bundles invoicing, payments, credit, collections and cash application, and runs a network of buyers and suppliers (it claims 2,600+ suppliers, 20M+ buyers, $1T+ annual trade credit). [Vendor claim] https://www.billtrust.com/

**Function catalogue.** [Vendor claim, same URL] Invoicing and delivery to 260+ AP portals; B2B payments including virtual-card acceptance (95%+ automated virtual card processing; 30% lower card processing cost); credit (AI-set credit limits and payment policies); collections (AI collections priorities, "agentic collections" that handle routine chasing and disputes, 9 minutes saved per collections email); cash application (95%+ match rate); cash forecasting with a confidence score; 200+ ERP and bank connectors; a connection to Claude and Copilot (headline only).

**Results claimed.** Cintas tripled AR volume without new headcount and saved $1M+ a year; Peak Industrial DSO 38 to 20 days, $10M freed, bad debt down 60%; McPherson Oil $2M freed, 93% paid on time. [Vendor claim] Ownership: [Unverified] taken private by EQT in 2022.

**Lesson.** A cash forecast that shows its confidence score is a good pattern for "show the basis of a number". Billtrust's strength is the payments network, which the founder cannot copy.

**Relationship.** Competitor at the top; not in the 100 to 1,000 staff core.

### Versapay (mid-market, "collaborative AR")

**In one paragraph.** Versapay sells AR automation built around a shared customer portal where buyer and seller work on invoices, payments and disputes together. It targets manufacturing, wholesale distribution and professional services, and claims 10,000+ customers, 5M+ companies transacting and $257B in payments a year. [Vendor claim] https://www.versapay.com/

**Function catalogue.** [Vendor claim, same URL] Digital invoicing and self-serve customer portal (pay, manage account, resolve disputes); collections management (task automation, high-risk prioritisation, overdue tracking); AI/ML cash application; reporting and reconciliation (DSO, average days to pay, trends); B2B payments (ACH, card, embedded ERP payments); an AI assistant. Native ERPs: NetSuite, Sage Intacct, Dynamics 365 Business Central, Dynamics 365 Finance and Supply Chain; others by API or flat file. Results: Laticrete $6M more cash receipts; TireHub 200 hours a week saved. Pricing not published.

**What to copy.** Disputes raised by the customer in the portal, attached to the invoice line, rather than by email. https://www.versapay.com/

**Relationship.** Competitor in the upper mid-market on NetSuite and Microsoft ERPs; teacher on the collaborative portal.

### Esker (large enterprise O2C suite)

**In one paragraph.** French vendor selling document and process automation across order-to-cash and procure-to-pay to large B2B companies; buyers are CFOs, AR, billing, credit, customer service and IT leaders. [Vendor claim] https://www.esker.com/solutions/order-to-cash/ Ownership: [Unverified] taken private by Bridgepoint in 2024.

**Function catalogue.** Order management (multi-channel B2B order capture and validation); credit management (automated reviews and risk monitoring); customer inquiry management (classify and route requests, self-service); claims management; invoice delivery with tracking; cash application; deductions management; collections management (prioritised by cash impact); payments; "Esker Synergy AI Agents" (named, little detail). ERPs: SAP, Oracle, Microsoft Dynamics and multi-ERP. Results: up to 25% lower DSO, up to 95% less unapplied cash, 71% fewer overdue payments. [Vendor claim]

**Relationship.** Competitor only for large SAP/Oracle shops. Its "customer inquiry management" (classify and route inbound customer emails) is a function the founder's external face must also do.

### Sidetrade (enterprise; Aimie agents and Agent Builder Studio)

**In one paragraph.** French O2C vendor positioned as "the order-to-cash intelligence company", selling credit, invoicing, collections, disputes, cash application, deductions, analytics and buyer self-service to large companies in construction, financial services, ICT, logistics, life sciences, manufacturing, retail, CPG and utilities. Its differentiator is a data lake of buyer payment behaviour: 1B+ payment experiences, 42M+ buyers, about $8T of B2B transactions and 20+ years of history. [Vendor claim] https://www.sidetrade.com/ Listed status: [Unverified] Euronext Growth Paris.

**Function catalogue.** [Vendor claim]
- Aimie IQ: live O2C insight, next-best actions, "governed execution". 78% of payments fall within Aimie IQ's predicted payment windows.
- Aimie Agents (page published 1 Apr 2026): insightful summaries, auto-generated optimised responses, instant financial reporting, autonomous outbound calling, intelligent interaction, outcome qualification, escalation and governance, multilingual execution. Claims: 15,000+ emails processed a day with up to 70% routed automatically; 94% auto-resolution for standard payments; 40% less manual cash-app time; +12% recovery-action effectiveness; 9 to 15 days annual DSO reduction. https://www.sidetrade.com/core-platform/aimie-agent.md
- Agent Builder Studio: three building blocks (O2C workflows, agents, connectors); start from pre-built best-practice agents; event-driven workflows with branching and conditional logic; agents built once, governed individually and reused across workflows; bi-directional connectors to ERP, CRM, payments and communications; configurable controls, audit trails, escalation policies; a Health Dashboard with monitoring, diagnostics, cost tracking, alerting and action traceability; exceptions handled by rule-based and AI decisioning with escalation to humans. https://www.sidetrade.com/core-platform/agent-builder-studio.md
- Customer Agents with autonomy tiers (mentioned on the Aimie page; separate Q3 2026 brochure not read).
- O2C Apps: credit, invoicing, collections, disputes, cash application, deductions, analytics, buyer self-service.
- Results: 35 to 50% productivity gains; 30 to 40% reduction in excess DSO; Gartner MQ Leader 2024. [Vendor claim]

**How it works underneath.** Agents are governed by "predefined policies, role-based access controls and continuous monitoring", and every action is traceable. [Vendor claim] The public page does not show the domain model, permissions, testing or which LLMs are used. [Fact: absence]

**What to copy.** (1) Separate "agents" from "workflows": an agent is a reusable, individually governed worker; a workflow is an event-driven graph that calls agents. (2) A per-agent health dashboard with cost tracking. (3) Explicit autonomy tiers for customer-facing agents. https://www.sidetrade.com/core-platform/agent-builder-studio.md

**Relationship.** The closest conceptual competitor to the founder's "governed model" idea, but sold to large enterprises. Teacher.

### Emagia (enterprise)

Emagia sells an "Enterprise Autonomous Finance" O2C platform to global enterprises: order management, credit risk, receivables, collections, deductions, cash application, cash-flow forecasting, an EIPP portal and analytics. Agents: Gia Inbox Agent (shared-service inboxes), Gia AlphaCash (cash intelligence), Gia Collect (outbound collections calling), an agent orchestration studio, GiaPay (payments orchestration), Gia AI assistant, GiaGPT and GiaDocs AI (document processing). ERPs: JD Edwards, SAP, Oracle, NetSuite, PeopleSoft, Microsoft Dynamics, Sage. Claims: 95%+ cash application, 1,000+ customers, 170+ banks, 25 languages; customers include Shell, Staples, Autodesk, Syngenta, Textron, Parker; Convatec rolled out globally in 15 months. Everest 2026 Leader; Gartner 2024 Visionary. Pricing not published. [Vendor claim] https://www.emagia.com/ Relationship: enterprise competitor; the 15-month rollout is the deployment benchmark the founder should contrast against.

### Bectran (credit-first O2C, all sizes)

Bectran started in credit applications and now covers credit management (applications, decisioning, job sheets, sales-tax control, document storage), AR (cash application, invoicing and payments, AR review, order and credit holds, claims and disputes, customer payment portal), collections (strategy, collector tasks, promise-to-pay tracking, third-party collections), vendor onboarding, and risk (fraud network, UCC filings, lien tracking, watchlist, audit trails), plus AI credit review, risk scoring, instant decisioning, collections outreach and AI cash application. Strong in building materials, cement, steel, electrical, chemicals, plumbing/HVAC. Claims 4,000+ businesses (Sysco, Michelin, Sunoco, Keurig Dr Pepper), $250B+ invoices a year processed for collections and payments. Pricing on a separate page not read. [Vendor claim] https://www.bectran.com/ Lesson: in construction supply and distribution, credit and liens are part of collections; a model that ignores credit limits and holds misses half the job.

### Serrala, Quadient AR (YayPay), Satago, Monto: not read this round

- **Serrala:** fetch failed (rate limit). [Unverified] SAP-centric finance automation (FS² AR, Alevate cloud on SAP BTP), private-equity owned; sells to large SAP customers in Europe.
- **Quadient AR by YayPay:** product page failed to load. A pricing aggregator says Quadient publishes no price list, quotes by invoice volume and modules, has no free trial, and a Capterra listing cites roughly $500 a month as a start (not verified by the aggregator). [Fact about the aggregator page] https://erpresearch.com/erp-add-ons/ar-collections/quadient-ar/pricing [Unverified] Quadient acquired YayPay in 2020; mid-market, NetSuite/Sage Intacct/Dynamics-centred.
- **Satago (UK):** search results show Lloyds Bank invested in Satago and later terminated its five-year agreement, and TruFin (the parent) shares fell on the news. [Fact from headline] https://finextra.com/newsarticle/44456/trufin-shares-tank-as-lloyds-terminates-satago-contract Date and current product not verified. [Unverified] Satago combined credit control, credit-risk insight and invoice finance for UK SMEs on Xero/QuickBooks/Sage. Lesson: bundling collections with lending creates channel dependency on a bank partner.
- **Monto:** monto.io turned out to be an unrelated e-commerce app suite. The AR-relevant Monto (AP-portal automation for suppliers, listed on G2) was not read. https://www.g2.com/products/monto/reviews

### Upflow (mid-market, France and US)

**In one paragraph.** Upflow sells collections and AR automation to B2B companies sized by annual invoiced revenue from under $10M to over $100M, mostly SaaS and services, with heavy use by finance teams on QuickBooks, Xero, NetSuite and Stripe/Chargebee billing. Buyers are CFOs and AR managers who want reminders, a portal and visibility without an ERP project. [Fact] https://upflow.io/pricing

**Function catalogue** (pricing page, Nov 2026). [Fact]
- Discover (free): AR dashboards and insights.
- Starter (up to $10M invoiced, 40,000 invoices/yr): unlimited seats; Gmail/Outlook two-way sync; email, SMS, call and letter reminders (SMS, calls and letters metered); advanced analytics; QuickBooks Online, Xero, Pennylane, Rillet, Chargebee, Stripe Billing.
- Grow (up to $25M, 100,000 invoices): branded customer portals; Slack; REST API; multi-entity dashboards; dedicated onboarding specialist; adds NetSuite and Sage Intacct (Business Central and SAP S/4HANA "coming soon").
- Scale (up to $50M, 200,000 invoices): Smart Rules engine; HubSpot two-way sync; Collections Agent; AP Portal Agent; dedicated CSM; adds Zuora.
- Accelerate (up to $100M, 300,000 invoices): Cash Application Agent; Salesforce two-way sync; enterprise SSO; unlimited entities.
- Enterprise (over $100M, 700,000 invoices): all agents (insights, collections, AP portal, cash app).
- Insights Agent on all plans.
- Payments: Upflow Payments Lite on your own gateway (small fee); native Upflow Payments add-on at 3.5% + $0.30 card, 0.8% ACH capped at $5, plus $390/month platform fee.
- Disputes: not shown on the pricing page.

**Commercials.** All paid tiers "ask for a quote". [Fact]

**What to copy.** (1) Size tiers by invoice volume and entity count, not seats; unlimited seats remove the "only finance can log in" problem. (2) Two-way sync of the collector's own mailbox so outreach comes from a person's address. https://upflow.io/pricing

**What not to copy.** Gating cash application and the rules engine to the top tiers means a 300-person company with messy remittances pays enterprise prices for the most labour-intensive part. [Inference]

**Relationship.** Most direct competitor for the founder's segment in Europe and the US.

### Chaser (UK SMB and lower mid-market)

**In one paragraph.** London-based credit-control software for SMBs and accountants, mostly UK and Australia, sending automated reminders from the user's own mailbox, with payment portal, SMS and calls. [Fact/Unverified for features below]

**Commercials** (USD, Nov 2026). Compact $259/month ($233 annual), under GBP 4M revenue, 4 users, 30 templates, 4 workflows; Core $779 ($700), under GBP 10M, unlimited users, templates and workflows, multi-entity; Complete $1,169 ($1,050), under GBP 100M, dedicated account manager, priority support, receivables forecast; Custom above GBP 100M; "+ Care" variants (Core + Care $2,149, Complete + Care $2,799) add a managed service. Integrations: Xero, QuickBooks Online, Sage 50/200/Intacct/Business Cloud, NetSuite, Business Central, Odoo, SAP, AccountsIQ, iFinance; Stripe; HubSpot, Pipedrive, Salesforce, Zoho; Gmail, Outlook; Zapier; API. [Fact] https://www.chaserhq.com/pricing

**What to copy.** The "+ Care" tier: software plus a human credit-control service for firms that have no collector. That is the natural shape for a 100-person firm and a natural upsell for agent-plus-human-review. https://www.chaserhq.com/pricing

**Relationship.** Competitor at the small end; also publishes the most usable SMB survey data (see evidence section).

### Kolleno (UK, SMB to enterprise)

Per-user pricing with a minimum seat count: Business Pay $545/user/month (annual; 1 user; Xero, QuickBooks, Sage Intacct; turnover under GBP 1M; self-onboarding) with payment portal, payment links, customer dashboard and collections inbox; Business Plus $995/user/month (min 2; adds Clio; GBP 1M to 100M; 3-hour onboarding) with team collaboration, reporting, workflow automation and "AI agent support"; Enterprise (min 3; NetSuite, Business Central, SAP, Oracle Fusion; GBP 100M to 1B; 6 hours) adds auto-reconciliation and human agent support; Enterprise Plus (min 4; custom ERP; GBP 1B+). Each plan includes 100 to 600 SMS and calls. AI: drafted email templates and AI responses to client queries. [Fact] https://www.kolleno.com/pricing Lesson: onboarding measured in hours is a credible promise for SMB; per-user pricing at nearly $1,000 per seat is expensive for a team of three collectors. [Inference]

### Paidnice (Australasia and Europe, SMB on Xero/QuickBooks)

Priced by monthly invoice volume, billed monthly, no contracts: Essentials from US$69 (150 invoices, 600 emails, 2 users) with email and SMS reminders, late fees and interest, prompt-payment discounts, automated statements, customer portal, public API and an MCP server; Pro from US$99 (300 invoices) to US$279 (1,000) with unlimited users, payment plans, custom email domain, call recording and transcripts, webhooks, extra entities at US$29; Custom from US$389 with NetSuite and Sage Intacct, Creditsafe credit checks and an account manager. First 20 actions free. AI: reply handling with drafts awaiting approval; MCP server for Claude and ChatGPT. Prices fixed in USD, GBP, EUR, AUD, CAD, NZD, ZAR. [Fact] https://www.paidnice.com/pricing

**What to copy.** (1) Late-fee and early-payment-discount policies as first-class configurable rules. (2) An MCP server so the customer's own AI assistant can query AR. (3) Approval queue for AI-drafted replies. (4) Fixed local-currency pricing. Same URL.

### Gaviti (mid-market, Israel/US)

Usage-based, not per-user custom pricing; unlimited users, workflows and permission profiles included. Modules: Credit Management (online applications, AI credit review, bureau integration, automated limits, order freezes); Dunning and Collections (AI-generated emails, workflows, prioritisation, cash forecasting, payment portal); Dispute Management (customer claim forms, partial or full disputes, one-click settlement, team alerts); Cash Application (matching, automated deductions, AI remittance capture, lockbox capture); Payment Portal (no-fee ACH, cards, auto-pay, credit requests, dispute initiation); AI assistant and agentic chat on every product. Case study: Burwood reduced "RAR" 77% in under 6 months. [Vendor claim] https://www.gaviti.com/pricing/

### Tesorio (mid-market and enterprise, SaaS-heavy)

Functions: Collections Agent (drafts follow-ups, reads inbound email, extracts payment promises, escalates to humans); automated dunning; Cash Application Agent (structured and unstructured data such as lockbox PDFs and remittance emails); Supplier Portals Agent (submits invoices and tracks status in Coupa, Ariba; first agent launched 27 Mar 2025 per a CFO Dive release title); AR Forecast; Payment Portal with Tesorio Pay and ERP auto-posting; Workflows (templates or no-code); AI Chat and MCP (live AR data in ChatGPT and Claude); Controls and Governance (audit trails, guardrails). ERPs: NetSuite, Sage Intacct, QuickBooks, Workday, Zuora, plus Salesforce, Stripe, Plaid; "any ERP" via Tesorio Connect. Claims: 30% average DSO reduction; 90 to 95%+ auto-match; Veeva 50% less 90-day-aged AR; SecurityScorecard 2 FTEs saved; Couchbase 3x collector productivity; G2 4.7/5 (238 reviews). Pricing not published. Customers: Veeva, GitLab, Couchbase, Smartsheet, UiPath, Automattic, Redis. [Vendor claim] https://www.tesorio.com/ and https://www.cfodive.com/press-release/20250327-tesorios-first-ai-agent-eliminates-supplier-portal-bottlenecks-accelerati

**What to copy.** Promise-to-pay extraction from inbound email as a structured object (amount, date, invoices, who promised), with escalation when a promise is broken. https://www.tesorio.com/

**Relationship.** Strongest direct competitor for the "internal analyst plus external outreach" combination, but US SaaS-focused and quote-only.

### Growfin (mid-market, NetSuite)

Collections CRM (AI follow-ups, prioritisation, "behavioral AI") and Cash Application; a "Built for NetSuite" SuiteApp; Zuora partnership. Claims: 65% of collection tasks automated, 33% lower DSO, 45% faster collection, 27% more cash flow; Aircomm DSO 45 to 30 days. Customers: Druva, Greenhouse, LaunchDarkly, Motive, Postman, ZipRecruiter, InMobi, Innovaccer. Pricing page failed to load. [Vendor claim] https://www.growfin.ai/ Lesson: living inside the ERP as a native app (SuiteApp) removes a sync layer and an IT objection.

### Centime (US mid-market)

AR module within a broader cash-management suite: invoice delivery, collections workflow and campaigns, customer portal, cash application, AR lockbox, surcharge management, merchant processing; cash forecasting from live AP, AR and bank data. ERPs: NetSuite, Sage Intacct, Business Central, QuickBooks. AI is described only for AP (OCR, coding). Pricing not published. [Fact] https://www.centime.com/pricing

### Invoiced (Flywire)

Acquired by Flywire in 2024. Invoicing, collections and dunning, late-fee automation, cash application and reconciliation, reporting and forecasting; payments by ACH, SEPA, Bacs, card and virtual card, plus Flywire cross-border collection and FX. AI described in four layers: Assist (drafts outreach), Automate (matches payments), Advise (flags at-risk accounts), Configure (tunes dunning cadence over time). Native: NetSuite, Dynamics 365, Sage Intacct, QuickBooks, Xero, Workday; "ERP Connect" for on-premise. Target: mid to large businesses. No prices on the pricing page. [Vendor claim] https://www.invoiced.com/pricing Lesson: the Assist/Automate/Advise/Configure split is a clean way to explain what AI does at each autonomy level.

### Stripe Invoicing and Billing (native for Stripe users)

Smart Retries uses a model on time-dependent signals to pick card retry times; default for new accounts is up to 8 retries in 2 weeks; policy windows 1 week to 2 months; segment-specific retry policies via automations. Failed-payment emails with link to a hosted invoice page; branded emails; reminders before, on or after due date for one-off invoices (skipped when a payment is processing); mark past-due invoices uncollectible at 30, 60 or 90 days; automatic reconciliation of partial payments within a set tolerance by applying a credit. [Fact] https://docs.stripe.com/invoicing/automatic-collection Pricing: [Unverified] Invoicing priced as a percentage of invoice volume (about 0.4 to 0.5%). Lesson: "partial-payment tolerance" is an explicit allocation rule exposed as a setting; the founder's model should hold such tolerances as named rules. Relationship: supplier/integration, not a competitor for invoice-to-bank-transfer B2B.

### QuickBooks Online and Xero (native)

- **QuickBooks Online:** automatic email reminders (Reminder 1, plus optional second and third), up to 90 days before or after due date, only for invoices already emailed and unpaid, with editable subject, greeting and variables; changes apply only to future reminders; Advanced plan has workflow-based reminders; "Intuit Intelligence" can set reminders from a prompt or Automations. [Fact] https://quickbooks.intuit.com/learn-support/en-sg/help-article/invoicing/send-invoice-reminders-automatically-manually/L84cQjpxo_SG_en_SG
- **Xero:** not read this round. [Unverified] Built-in automatic invoice reminders on a schedule relative to due date, plus online invoice payment links. Its app store has a "debtor tracking" category including Debtor Daddy and CreditorWatch Collect (Australia), Chaser, Paidnice, Upflow, Kolleno and Satago. [Fact: category and listings exist] https://apps.xero.com/au/function/debtor-tracking
- **Meaning:** for a 100-person company the native floor is "email reminders on a timetable"; nothing native handles replies, disputes, allocation, WhatsApp, or explains a number.

### Regional players

- **Southeast Asia: Peakflo.** AR (invoicing, dunning, customer portal, finance CRM, cash application), AP, procurement and expenses, plus "20X AI Orchestrator", AI Voice Agents, AI Browser Agents, AI WhatsApp Agents. ERPs: NetSuite, QuickBooks, Xero, Jurnal (Indonesia), SAP S/4HANA, SAP Business One, Business Central, Dynamics F&O; also API, SFTP, CSV. Customers: Carousell (10,900 hours saved a year, $17M+ payments automated), Pickupp (40% lower overdue, 25% lower DSO), Ninja Van, Hitachi, AboitizPower, Glints. Pricing custom. [Vendor claim] https://www.peakflo.co/ and https://www.peakflo.co/pricing Relationship: the most direct regional competitor; broad (AP plus AR) rather than deep.
- **Gulf.** Levers (dunning and AR automation; reminders, escalation, payment-behaviour reports) integrated with Wafeq, an SME accounting tool with ZATCA and UAE VAT compliance; UAE and KSA; no AI mentioned; page updated 26 Sep 2024. [Fact] https://www.wafeq.com/en-ae/press-releases/media-center/wafeq-x-levers-partnership ClearGrid (raised about $10M, Mar 2025) and InDebted are AI debt-collection firms in MENA, mainly consumer/lender collections rather than B2B AR. [Fact from TechCrunch headline; B2C focus Unverified] https://techcrunch.com/2025/03/19/cleargrid-armed-with-10m-uses-ai-to-fix-debt-collection-in-mena
- **Australia:** Paidnice (above), Debtor Daddy and CreditorWatch Collect on the Xero AU app store; Chaser's survey base is heavily Australian. [Fact: listings] Details not read.
- **UK:** Chaser, Kolleno, Satago (above); Upflow and Paraglide (Nordics/Europe) also sell there.
- **Malaysia:** I found no dedicated B2B AR collections product; search results were consumer WhatsApp debt-collection tools for digital lenders (Ara Pay) and generic AI voice reminder services in Singapore. [Fact: what appeared; absence is Inference]

### AI-native entrants, 2025 to 2026

- **Stuut Technologies (New York).** $29.5M combined Series A led by Andreessen Horowitz, announced 20 Nov 2025 (Activant, Khosla, 1984.vc and others). Agents across SMS, email and voice for customer outreach, payment matching, dispute resolution and AP-portal management; six areas (collections, payments, cash application, deductions, credits, disputes), with credits and disputes "coming soon" in the same release. Customers: ZoomInfo, Bishop Lifting, Honeywell, PerkinElmer. Claims: 40% fewer overdue balances, 70% fewer manual tasks, 37% faster DSO. Targets mid-market and enterprise manufacturers, distributors, CPG, logistics, services, medical devices; SAP, Oracle, NetSuite, Dynamics. Live in under a week (3 to 4 days) vs 6 to 18 months for traditional AR software. [Vendor claim] https://www.prnewswire.com/news-releases/stuut-technologies-raises-29-5-million-series-a-led-by-andreessen-horowitz-to-automate-accounts-receivable-work-302621866.html
- **Fazeshift (San Francisco, YC S24).** $4M seed (Gradient Ventures, Jan 2025), then $17M Series A led by F-Prime (7 May 2026), $22M total. An "intelligent control layer" over existing systems covering contract analysis, billing, cash application, collections and task tracking; tailors the AI to each customer's AR process; claims 90%+ of manual AR tasks automated and 12x revenue growth in a year. Customers: Sigma Computing, Snyk, Meter, Clipboard Health; eight unicorns and one public company; targets wholesale, construction, staffing, HVAC. Founders: Caitlin Leksana (ex-BCG, mechanical engineer) and Timmy Galvin (ex-nuclear submarine officer). [Fact/Vendor claim] https://news.crunchbase.com/fintech/fazeshift-accounts-receivable-ai-finance-ops-startup-funding/ and https://automationtoday.net/news/startup-nabs-4-million-seed-round-for-accounts-receivable-ai-agent/
- **Monk.** $4M seed (2025), $25M Series A co-led by Footwork and Acrew (21 Apr 2026). Contract-to-cash: invoicing, collections, customer communication, cash application; "pairs AI models with deterministic systems" for payment accuracy; later added third-party AP-portal automation. Early customers ElevenLabs and Profound. Claims 40% average DSO reduction, 25+ hours a month saved, 24% higher response rates. [Vendor claim] https://pulse2.com/monk-25-million-series-a-raised-to-automate-accounts-receivable-with-ai/
- **Paraglide (Nordics/Europe).** $5M seed co-led by Bessemer and DN Capital (27 Jan 2026). Two-way billing conversations: answers customers' billing questions, follows up overdue invoices, acts across the finance stack; Chargebee partnership. Founders Rasmus Areskoug (ex-CFO) and Andreas Astrom (built GetAccept). Customers Choco, Ardoq, Spiideo. Claims 34% DSO reduction and finance inbox-zero in week one. [Vendor claim] https://tech.eu/2026/01/27/paraglide-raises-5m-seed-to-reinvent-accounts-receivable-with-agentic-ai/
- **AgentCollect (YC) and Fullseam (YC):** YC directory pages exist; not read. https://www.ycombinator.com/companies/agentcollect
- **Lighthouz, Fragment:** not found as AR-collections companies in this round's searches. [Unverified]

**Pattern across entrants.** All target mid-market and enterprise, mostly US/EU SaaS or industrial firms; all sell speed of deployment and "agent does the work, human approves exceptions"; Monk explicitly separates LLM work from deterministic payment logic; Fazeshift explicitly tailors to each customer's process. None of the four press releases mentions WhatsApp, Southeast Asia or the Gulf. [Fact: absence in the texts read]

## Market map by customer size and price

| Segment | Typical buyer | Vendors | Price signal |
|---|---|---|---|
| Micro/SMB (<GBP/US$5M revenue) | Owner, bookkeeper | QuickBooks/Xero native, Paidnice, Chaser Compact, Kolleno Business Pay, Debtor Daddy | Free to ~US$260/month |
| Small mid-market ($5M to $50M) | Finance manager, 1 to 3 collectors | Chaser Core/Complete, Upflow Starter/Grow/Scale, Kolleno Plus, Gaviti, Paidnice Custom, Peakflo, Centime | ~US$700 to US$3,000/month; quote-only common |
| Upper mid-market ($50M to $500M; roughly 100 to 1,000 staff) | CFO/controller, AR manager, 3 to 15 collectors | Upflow Accelerate/Enterprise, Tesorio, Growfin, Versapay, Quadient AR, Invoiced, Bectran, Stuut, Fazeshift, Monk, Paraglide | Quote-only; [Inference] tens of thousands of dollars a year |
| Enterprise (>$500M, shared services) | CFO, GBS head, credit director | HighRadius, Billtrust, Esker, Sidetrade, Emagia, Serrala | Multi-module contracts, long implementations; HighRadius gain-share |

Sources: pricing pages cited in each section. The upper mid-market row is exactly the founder's 100 to 1,000 staff band, and it is the row where prices are least transparent and vendors most numerous.

## What incumbents do badly for 100 to 1,000 staff companies

1. **Price and packaging gates.** The labour-heavy functions (cash application, rules engine, multi-entity, Salesforce sync) sit in top tiers (Upflow) or per-seat plans near $1,000/user/month (Kolleno). [Fact] Mid-sized firms cite cost as the main barrier; 37% paused projects for training time. [Fact] PYMNTS/Esker 2024.
2. **Deployment length.** Traditional AR software takes 6 to 18 months by Stuut's framing; Emagia's own showcase took 15 months. [Vendor claim] A 300-person company has no project team for that.
3. **ERP coverage gaps.** Mid-market tools support QuickBooks, Xero, NetSuite and Sage Intacct; Business Central and SAP S/4HANA are "coming soon" at Upflow. Regional ERPs (Malaysian and Indonesian local systems, SQL Accounting, AutoCount) are absent from every list read except Peakflo's Jurnal. [Fact for lists; regional ERPs named are Inference]
4. **Channel mismatch outside UK/US.** Email, SMS, calls and letters dominate; WhatsApp appears only at Peakflo. [Fact from pages read]
5. **Opaque numbers.** Dashboards show DSO, aging and forecast, but none of the pages describes showing the definition or rule behind a figure (which credit notes were netted, how unapplied cash was treated, which disputes were excluded). Billtrust's forecast confidence score is the nearest. [Inference]
6. **Rules hidden in configuration.** Customer-specific policy (allocation order, when a credit note offsets, who can grant an extension, dispute reason codes) lives in workflow builders or "Smart Rules" toggles, not as an inspectable model that both a report and an agent obey. [Inference]

## Does anyone model the company's own rules explicitly and show the rule behind a number?

- **Partly:** Sidetrade (agents built on "governed O2C domain models", audit trails, escalation policies; not documented publicly). Upflow's Smart Rules engine (Scale tier; not documented on the page). Stripe's partial-payment tolerance and uncollectible-after-N-days settings are explicit rules but narrow. Paidnice treats late fees, interest and prompt-payment discounts as configured policies. Monk says it pairs AI with deterministic systems for payments. Fazeshift says it tailors to each customer's process. [Fact/Vendor claim, URLs above]
- **Not found:** any vendor that exposes a versioned rule catalogue (allocation, credit notes, disputes, permissions) and, for a given report number or agent action, shows which rule produced it. [Fact: not found in pages read; Unverified as a universal absence]

## Does anyone combine an internal analyst with external outreach on one governed model?

- Tesorio: AI Chat and MCP on live AR data plus Collections Agent and governance. Upflow: Insights Agent plus Collections Agent. Sidetrade: Aimie IQ (insight) plus Aimie Agents (execution) plus Agent Builder Studio (governance). Billtrust: Claude/Copilot connection plus agentic collections. Paidnice: MCP server plus AI reply handling. [Vendor claim]
- None describes both faces running on one explicit model of metric definitions, rules and permissions. Sidetrade's language comes nearest. [Inference] This is the founder's real differentiation, and it is a thin one: Sidetrade or Tesorio could market the same claim within a year.

## Published evidence on the cost of manual collections

| Figure | Source and quality |
|---|---|
| 40% of businesses spend 6+ hours/week on AR tasks; 76% spend 3+; US 80% at 6+ vs UK 25%, AU 22% | Chaser 2026 AR report; 163 validated responses (summary says 300+), mainly UK/AU, late 2025 to early 2026; vendor survey. https://www.chaserhq.com/the-2026-accounts-receivable-report |
| 92% typically paid after due date; 17.2% wait 31+ days | Same |
| Write-offs: 61.3% under 3% of revenue; 23.1% 3 to 5%; 10% 6%+; US 88% at 3%+ | Same |
| Users of AR software: 71% paid within two weeks of due date vs 47% of non-users | Same (correlation, self-selected) |
| 86% of businesses have up to 30% of monthly invoiced sales overdue | PYMNTS citing Versapay data, 4 Jul 2025; no sample size. https://www.pymnts.com/accounts-receivable/2025/for-86percent-of-firms-nearly-a-third-of-invoiced-sales-are-late/ |
| 27% spend at least half of AR team time on invoice disputes | Same |
| 35% of mid-sized firms fully manual; 75%+ of SMBs chase or handle disputes by email | Same |
| Automation could cut collection times by up to 67% | PYMNTS Intelligence, same article |
| Half of US firms cite excessive time wasted processing AR; 46% find DSO hard to reduce; 59% tie poor cash forecasting to manual AR | PYMNTS/Esker, Aug 2024; no sample. https://www.pymnts.com/tracker_posts/businesses-at-risk-the-high-cost-of-manual-ar-processes-and-what-to-do-about-it/ |
| 96% of mid-sized firms face adoption barriers; cost first; 37% paused for training time; 47% cite security | Same |
| $1.94T cash trapped in US companies; 82% of B2B customers pay past due | Billtrust citing Hackett and its own survey. https://www.billtrust.com/ |
| Per-email time: 9 minutes saved per collections email | Billtrust vendor claim, same URL |

Honest summary: the evidence is all vendor-sponsored, samples are small or unstated, and none gives a clean "hours per $1M receivables" or "cost per collected invoice" figure. For sales, the founder should measure baselines at each pilot (hours, DSO, past-due %, unapplied cash) rather than rely on these. [Inference]

## What to copy

1. **One KPI per agent with a baseline**, measured from day one; it makes outcome pricing possible later. https://www.businesswire.com/news/home/20260227310299/en
2. **Agents as reusable, individually governed workers; workflows as event-driven graphs that call them; a health dashboard with cost per agent.** https://www.sidetrade.com/core-platform/agent-builder-studio.md
3. **Promise-to-pay as a first-class object** extracted from replies (amount, date, invoices, person), with automatic escalation when broken. https://www.tesorio.com/
4. **Approval queue for AI-drafted replies** before sending, with a path to auto-send by rule once trust is earned. https://www.paidnice.com/pricing
5. **Policies as named, configurable rules:** late fees and interest, prompt-payment discounts, partial-payment tolerance, uncollectible-after-N-days, retry policies by segment. https://www.paidnice.com/pricing and https://docs.stripe.com/invoicing/automatic-collection
6. **Customer-raised disputes in the portal tied to invoice lines**, with partial disputes and one-click settlement. https://www.gaviti.com/pricing/ and https://www.versapay.com/
7. **Reminders from the collector's own mailbox** via two-way Gmail/Outlook sync. https://upflow.io/pricing
8. **MCP server over the AR model** so the customer's own Claude or ChatGPT can query it. https://www.tesorio.com/ and https://www.paidnice.com/pricing
9. **Unlimited users, price by invoice volume and entities.** https://upflow.io/pricing and https://www.gaviti.com/pricing/
10. **A software-plus-human "Care" tier** for firms without a collector. https://www.chaserhq.com/pricing
11. **Deterministic matching and posting, LLM only for reading and writing language.** https://pulse2.com/monk-25-million-series-a-raised-to-automate-accounts-receivable-with-ai/
12. **Deployment promise in days**, with ERP connector first and inbox-zero as the week-one outcome. https://www.prnewswire.com/news-releases/stuut-technologies-raises-29-5-million-series-a-led-by-andreessen-horowitz-to-automate-accounts-receivable-work-302621866.html and https://tech.eu/2026/01/27/paraglide-raises-5m-seed-to-reinvent-accounts-receivable-with-agentic-ai/
13. **Explain AI by autonomy level** (Assist, Automate, Advise, Configure). https://www.invoiced.com/pricing
14. **Forecasts with a stated confidence**. https://www.billtrust.com/

## What cannot or should not be copied

- **Network data moats** (Sidetrade's 1B payment experiences; Billtrust's buyer network; Versapay's 5M companies) cannot be copied by a new entrant. [Inference]
- **Payments processing** (Upflow Payments, Tesorio Pay, Billtrust virtual cards) needs licences and risk teams; integrate a gateway instead.
- **Gain-share pricing** needs measurement and legal agreement per customer; defer.
- **Breadth across AP, treasury and close** (HighRadius, Peakflo) dilutes a solo founder.
- **Unverifiable headline claims** ("190+ agents", "fully autonomous by 2027"): buyers discount them, and they do not build trust with a finance head who wants to see the rule.
- **Bank-dependent bundling** (Satago and Lloyds) creates a single point of failure in distribution.

## Assessment: good first proof, or too crowded?

Blunt answer: **too crowded as a generic product, good as a proof if narrowed.** In the US and UK mid-market the founder would face Upflow, Tesorio, Growfin, Versapay and four well-funded AI-natives (combined disclosed funding about $85M raised from late 2025 to 2026), all claiming 30 to 40% DSO reduction and deployment in days. Competing there on "AI collections agent" is a losing position for a solo founder. [Inference]

The job is still the right proof of the architecture: rules (allocation, credit notes, disputes, who may agree an extension) are concrete, the outcome is measurable within weeks, the internal face (AR report, "why is DSO up?") and external face (reminders, replies) share the same objects, and errors are expensive enough that a governed model with "show the rule" is a real selling point to a finance head. [Inference]

**Best under-served segment:** B2B distributors, manufacturers, contractors and services firms of 100 to 1,000 staff in Malaysia and wider Southeast Asia (secondarily the Gulf), on Xero, QuickBooks, Business Central, NetSuite or local accounting systems, with several entities, customers who reply on WhatsApp in English, Malay or Chinese, frequent partial payments and bank-transfer remittances without references, and a finance head who must explain aging and DSO to owners. Evidence for under-service: Peakflo is the only regional platform with WhatsApp agents found, and it is broad (AP plus AR plus procurement) and custom-priced; Gulf options are rule-based dunning tied to one accounting tool; none of the funded AI-natives mentions the region or WhatsApp. [Fact for what was found; segment choice is Inference] The risk: Peakflo already serves Carousell, Ninja Van and Hitachi in the region and has voice and WhatsApp agents, so the founder must win on explainable rules, local accounting-system depth and price, not on channels.

## Open questions and unverified items

- The shared fetch budget ran out after about 40 fetches; the following were not read: Serrala, Quadient AR product page, Satago product, Monto (AP-portal vendor), Xero help centre, Growfin pricing, Esker Synergy agent details, Sidetrade Customer Agents brochure (Q3 2026 PDF) and Agent Studio PDF, HighRadius reviews (G2, Gartner Peer Insights), Stuut and Fazeshift product docs, AgentCollect and Fullseam YC pages, Debtor Daddy, CreditorWatch Collect, ClearGrid article body, Lighthouz.
- Reviews and complaints for most vendors were not collected; G2 rating found only for Tesorio (4.7/5, 238 reviews, vendor-cited).
- Ownership/valuation items marked [Unverified]: HighRadius valuation, Billtrust/EQT, Esker/Bridgepoint, Quadient/YayPay 2020, Serrala ownership, Sidetrade listing, Stripe Invoicing percentage pricing, Satago termination date.
- Whether Sidetrade's "governed O2C domain model" is a real customer-editable schema or marketing language: read the Agent Studio PDF at https://www.sidetrade.com/wp-content/uploads/2026/04/Sidetrade_Agent_Studio_Builder_EN_Q1_2026.pdf next.
- Malaysian B2B AR tools: absence based on two searches only; verify with local accounting-software app stores (for example, Xero MY, Bukku, SQL Account partners).

## Sources (ranked by usefulness)

1. https://upflow.io/pricing (Nov 2026): full tier-by-tier feature and integration gating; best map of mid-market packaging.
2. https://www.sidetrade.com/core-platform/agent-builder-studio.md (2026): the closest public design to a governed agent model.
3. https://www.sidetrade.com/core-platform/aimie-agent.md (1 Apr 2026): agent capability list and AI-vs-rules efficiency claim.
4. https://www.tesorio.com/ (Nov 2026): agent catalogue incl. promise-to-pay extraction, MCP, portal agent.
5. https://www.prnewswire.com/news-releases/stuut-technologies-raises-29-5-million-series-a-led-by-andreessen-horowitz-to-automate-accounts-receivable-work-302621866.html (20 Nov 2025): AI-native scope and deployment-speed claim.
6. https://www.chaserhq.com/the-2026-accounts-receivable-report (2026): best SMB time and write-off data.
7. https://www.highradius.com/product/accounts-receivable-automation/ (Nov 2026): enterprise function catalogue.
8. https://www.businesswire.com/news/home/20260227310299/en (27 Feb 2026): outcome-based pricing.
9. https://www.paidnice.com/pricing (Nov 2026): SMB rules (fees, discounts), MCP, approval queue, pricing.
10. https://www.kolleno.com/pricing and https://www.chaserhq.com/pricing (Nov 2026): published SMB/mid prices.
11. https://news.crunchbase.com/fintech/fazeshift-accounts-receivable-ai-finance-ops-startup-funding/ (7 May 2026) and https://pulse2.com/monk-25-million-series-a-raised-to-automate-accounts-receivable-with-ai/ (21 Apr 2026) and https://tech.eu/2026/01/27/paraglide-raises-5m-seed-to-reinvent-accounts-receivable-with-agentic-ai/ (27 Jan 2026): AI-native funding and claims.
12. https://www.pymnts.com/tracker_posts/businesses-at-risk-the-high-cost-of-manual-ar-processes-and-what-to-do-about-it/ (Aug 2024): mid-sized adoption barriers.
13. https://www.peakflo.co/ (Nov 2026): Southeast Asian competitor with WhatsApp and voice agents.
14. https://docs.stripe.com/invoicing/automatic-collection (2026): explicit retry, reminder and tolerance rules.
15. https://quickbooks.intuit.com/learn-support/en-sg/help-article/invoicing/send-invoice-reminders-automatically-manually/L84cQjpxo_SG_en_SG (2026): native floor.
16. https://www.billtrust.com/, https://www.versapay.com/, https://www.esker.com/solutions/order-to-cash/, https://www.emagia.com/, https://www.bectran.com/, https://www.gaviti.com/pricing/, https://www.growfin.ai/, https://www.centime.com/pricing, https://www.invoiced.com/pricing (Nov 2026): vendor catalogues.
17. https://www.pymnts.com/accounts-receivable/2025/for-86percent-of-firms-nearly-a-third-of-invoiced-sales-are-late/ (4 Jul 2025): dispute-time figure.
18. https://www.wafeq.com/en-ae/press-releases/media-center/wafeq-x-levers-partnership (Sep 2024): Gulf SME dunning.
19. https://erpresearch.com/erp-add-ons/ar-collections/quadient-ar/pricing: Quadient pricing model (secondary).
20. https://automationtoday.net/news/startup-nabs-4-million-seed-round-for-accounts-receivable-ai-agent/ (Jan 2025): Fazeshift seed and per-customer tailoring.

## Comparison table

| Vendor | Size served | ERPs/accounting | Dunning | Cash app | Disputes | Credit | Portal | Payments | Forecast | AI beyond rules | Published price | Deploy claim |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HighRadius | Ent, upper mid | SAP, Oracle, NetSuite, Dynamics, Workday | Yes | Yes (90%+) | Yes (deductions) | Yes | Yes | Yes | Yes | 60+ AR agents (190+ total) | Gain-share, $0 until live | Not stated |
| Billtrust | Ent, upper mid | 200+ connectors | Yes | 95%+ | Agentic | AI limits | Yes | Yes, network | With confidence | Yes | No | Not stated |
| Versapay | Mid | NetSuite, Intacct, BC, D365 | Yes | AI/ML | Portal | n/s | Yes | Yes | Reports | Assistant | No | Not stated |
| Esker | Large | SAP, Oracle, Dynamics | Yes | Yes | Claims, deductions | Yes | n/s | Yes | n/s | Synergy agents | No | Not stated |
| Sidetrade | Ent | n/s | Yes | 94% auto | Yes | Yes | Self-service | n/s | IQ | Agents, voice, builder | No | Not stated |
| Emagia | Ent | JDE, SAP, Oracle, NetSuite, D365 | Yes | 95%+ | Deductions | Yes | EIPP | GiaPay | Yes | Inbox, calling agents | No | 15-month case |
| Bectran | All, credit-led | 300+ integrations | Outreach | AI | Claims | Core | Yes | Yes | n/s | AI credit, cash app | Separate page | n/s |
| Upflow | $<10M to >$100M | QBO, Xero, NetSuite, Intacct, Zuora | Email/SMS/call/letter | Agent (top tiers) | n/s | No | Grow+ | Add-on | Analytics | Insights, collections, AP-portal, cash-app agents | Quote | n/s |
| Chaser | SMB to mid | Xero, QBO, Sage, NetSuite, BC, Odoo, SAP | Yes | n/s | n/s | n/s | Yes | Stripe | Complete tier | n/s | $233 to $1,050/mo | n/s |
| Kolleno | SMB to ent | Xero, QBO, Intacct; NetSuite, BC, SAP, Oracle | Yes | Ent tier | n/s | n/s | Yes | 9+ | Reports | Drafts, replies | $545 to $995/user/mo | 3 to 8 hours onboarding |
| Paidnice | SMB | Xero, QBO; NetSuite, Intacct (Custom) | Email, SMS | n/s | n/s | Creditsafe | Yes | Via Stripe | n/s | Reply drafts, MCP | From $69/mo | Self-serve |
| Gaviti | Mid | ERP page not read | Yes | Yes | Yes | Yes | Yes | ACH, card | Yes | Credit review, emails, chat | Usage quote | n/s |
| Tesorio | Mid, ent | NetSuite, Intacct, QBO, Workday, Zuora | Yes | Agent 90%+ | n/s | n/s | Yes | Tesorio Pay | Yes | Promise extraction, portal agent, MCP | Quote | n/s |
| Growfin | Mid | NetSuite SuiteApp, Zoho | Yes | Yes | n/s | n/s | n/s | n/s | n/s | Behavioral AI | n/s | n/s |
| Invoiced | Mid, large | NetSuite, D365, Intacct, QBO, Xero, Workday | Yes | Yes | n/s | n/s | n/s | Flywire | Yes | Assist/Automate/Advise/Configure | No | n/s |
| Peakflo | SEA mid, ent | NetSuite, QBO, Xero, Jurnal, SAP, BC | Yes | Yes | n/s | n/s | Yes | VAs | n/s | Voice, WhatsApp, browser agents | Custom | n/s |
| Stuut | Mid, ent | SAP, Oracle, NetSuite, Dynamics | SMS, email, voice | Yes | Coming soon | Coming soon | Portal mgmt | Yes | n/s | Agent-first | No | 3 to 4 days |
| Fazeshift | Mid, ent | NetSuite, Salesforce (named) | Yes | Yes | n/s | n/s | n/s | n/s | n/s | Agent-first, tailored | No | n/s |
| Monk | AI-native SaaS | n/s | Yes | Yes | n/s | n/s | AP-portal | n/s | n/s | AI plus deterministic | No | n/s |
| Paraglide | EU SaaS | Chargebee | Yes | n/s | Billing Q&A | n/s | n/s | n/s | n/s | Two-way conversations | No | Inbox-zero week 1 |
| QBO native | SMB | Itself | 3 emails | No | No | No | Pay link | QB Payments | No | Prompt setup | Included | Instant |
| Stripe | Stripe users | Itself | Reminders, retries | Partial tolerance | No | No | Hosted page | Yes | No | Smart Retries | [Unverified] % of volume | Instant |

n/s = not stated on the pages read.