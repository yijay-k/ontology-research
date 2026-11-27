# Ramp and the finance-operations platforms: product catalogue and lessons for a receivables-and-collections agent

Scope note (written 21 November 2026). This document catalogues what Ramp sells, in depth, then covers the other finance-operations platforms and finance AI agents more briefly: spend and payables suites (Brex, BILL, Airbase/Paylocity, Navan, Mercury, Rippling Spend), close and accounting automation (Numeric, Rillet, Digits, Puzzle, Basis, FloQast, BlackLine, Trullion), AI-native ERPs (Campfire, DualEntry, Light), finance agents (Rogo, Hebbia, Truewind, Maxima, Zeni), and what the incumbent ledgers (QuickBooks, Xero, NetSuite, Sage, Zoho) ship for receivables and collections. Ramp was read from primary pages (pricing, support centre, product blog, engineering-adjacent posts, the public MCP repository). The rest got far less coverage: the shared web-fetch pool for this run ran out partway through (the proxy returned "budget exhausted" errors), so several companies below rest on search-result titles plus prior knowledge, and are labelled [Unverified] where no page was opened. Labels: [Fact] means a page was read and cited; [Vendor claim] means the vendor says so; [Inference] means my reasoning; [Unverified] means no source was opened this session.

**Most important finding up front:** since 22 September 2026, Ramp has had an Accounts Receivable product. It includes a **Collections agent** that drafts overdue-invoice emails from a configurable collections policy, works through the customer's own Gmail or Outlook inbox, records promises to pay, and never sends anything without a human clicking Send. It is US-only, single-entity, and works with QuickBooks Online or NetSuite (NetSuite via a waitlist). Basic AR is in Ramp's **free** plan. This is the founder's first job, already shipped by the fastest-growing finance platform in the US to a base of 85,000 customers. Details are in section 1.

---

## Key findings

1. **Ramp now does receivables, free, with an AI collections agent** [Fact, https://support.ramp.com/ramp-ar-collections-agent; https://ramp.com/pricing]. The agent prepares drafts at 3, 10, 17, 24 and 31 days overdue and stops after the fifth notice. It keeps one case per customer, offers pause/resume and "record promise to pay", and requires a human to send each message. Pre-due reminders (7 days and 1 day before the due date) go out automatically. The only channel is email. Billing schedules, revenue recognition and Avalara tax need a paid AR add-on.
2. **Ramp's trust recipe is published and consistent across agents** [Fact, https://support.ramp.com/policy-agent-overview; https://zenml.io/llmops-database/building-trustworthy-ai-agents-for-automated-expense-management]:
   - three outcomes (approve / needs review / reject) instead of numeric confidence;
   - every decision cites the policy text it relied on and records the policy version used;
   - deterministic limits sit above the LLM;
   - the workflow builder decides where the agent may act alone;
   - rollout runs suggestion mode, then partial autonomy, then full autonomy;
   - overrides and thumbs up/down feedback go into an audit log;
   - golden datasets are labelled by internal experts, not learned from user behaviour, because finance users approve more leniently than policy allows.
3. **Policy is captured as an editable, structured, agent-facing document, separate from the employee PDF** [Fact, https://support.ramp.com/policy-agent-overview]. Ramp converts the uploaded policy, strips filler, refuses to invent rules, caps it at about 10 pages, and versions it. Retrieval pulls in only the relevant sections for each decision.
4. **Cash application is deterministic first, AI second, and has an explicit per-entity mode switch** [Fact, https://support.ramp.com/ramp-ar-cash-application]:
   - matching tries an exact single-invoice match first, then an exact combination of the same customer's invoices, and only then a suggestion;
   - each suggestion shows its "why" reasons;
   - the mode is either "automatic and suggested" or "suggested only";
   - a rejection must give a reason code (wrong customer / wrong invoice / other).
5. **Ramp's AP agents publish acceptance rates** [Vendor claim, https://ramp.com/blog/ramp-ap-agents-announcement]: 90,000 approval recommendations with 90% accepted, and 85% of accounting fields correct first time (September 2025). The policy agent handles more than 65% of approvals on its own [Vendor claim, zenml summary of Ramp engineering post]. Use these as the benchmark numbers buyers have seen.
6. **Ramp's business scale resets buyer expectations of price** [Fact, https://techcrunch.com/2026/10/15/ramp-reaches-60b-valuation-as-it-pushes-deeper-into-ai; https://sacra.com/c/ramp/]:
   - US$60B valuation (October 2026);
   - more than US$2B annualised revenue;
   - 85,000 customers and about 1,900 staff.
   Most revenue is card interchange, so software can be free or US$15 per user per month. A standalone collections tool will be priced against "free inside Ramp" [Inference].
7. **BILL bundles basic AR into every paid plan** [Fact, https://www.bill.com/product/pricing]: invoices, payment reminders, ACH and card acceptance, auto-charge, from US$49 per user per month. It earns per-transaction fees (US$0.59 ACH, 2.9% card). BILL also has an "AI governance hub" with on/off toggles per AI capability and an audit log of every AI action [Fact, https://www.bill.com/product/ai].
8. **Capital One bought Brex** [Fact from search-result titles: Capital One newsroom "Capital One completes acquisition of Brex"; financierworldwide.com 27 January 2026 "$5.15bn deal"]: announced January 2026, reported as US$5.15B, and closed by about April 2026 per Sacra. The spend-management market is consolidating into banks and the two leaders (Ramp, BILL) [Inference].
9. **Every platform's AR "agent" so far drafts and suggests; none sends collections messages without review** [Fact for Ramp; Inference for others]. Autonomous external messaging is still open ground, and also the riskiest ground.
10. **The ledger incumbents are moving into AR agents** [Unverified for details; no product pages opened this session]. Intuit has a Payments Agent and an Accounting Agent in QuickBooks, Xero has JAX, and NetSuite has SuiteAgents. For a QuickBooks customer the default collections tool is becoming "already in my ledger". The founder's wedge has to be what ledgers and Ramp do not do: governed company metrics, cross-system context, multi-channel messaging (WhatsApp/SMS), non-US markets, multi-entity [Inference].
11. **Ramp exposes data to outside agents mainly read-only, via a local ETL-into-SQLite MCP server** [Fact, https://github.com/ramp-public/ramp_mcp, commit March 2025]. It loads API data into an in-memory SQLite database and lets the LLM write SQL, to get around context limits. The newer "Ramp for Agents" (agents.ramp.com) adds agent identity, owners, budgets, merchant restrictions and approval thresholds for agent payments [Fact, https://agents.ramp.com].
12. **Ramp's model-cost playbook** [Fact, https://ramp.com/leading-indicators/what-it-takes-to-build-ai-agents-at-scale, 20 April 2026]: start on the most capable model, clear the edge cases, move to a cheaper model once behaviour is stable, and treat evals as unit tests seeded by an accountant. The Policy Agent runs on OpenAI with no retention [Fact, policy agent support page]. Rented models are normal even at Ramp's scale.

---
## Breakdown

### 1. Ramp (in full depth)

#### 1.1 In one paragraph
Ramp is a US finance-operations platform that started in 2019 as a corporate card and now covers every money flow that passes through the finance team. Its buyers:
- **Who:** controllers, CFOs, VPs of finance and AP managers.
- **Company size:** from startups to enterprises. The core is US companies of 50 to 5,000 staff [Inference from the plan structure and named customers].
- **Named customers range** from Cursor, Notion and Figma to Shopify, Uber, Visa, the Denver Broncos, KIPP Nashville and the City of Ketchum [Fact, https://ramp.com; https://techcrunch.com/2026/10/15/ramp-reaches-60b-valuation-as-it-pushes-deeper-into-ai].

The job it does: take every expense, bill, purchase and (since September 2026) customer invoice, and get it captured, coded, approved under policy, paid or collected, and synced to the ledger with minimal human touch. What buyers pay for is fewer finance hours (Ramp claims more than 40 hours a month saved and a close about three times faster from its accounting agent), less leakage (out-of-policy spend, fraud, overpriced software contracts) and card cashback [Vendor claim, https://www.cpapracticeadvisor.com/2026/02/12/ramp-unveils-accounting-agent-to-streamline-bookkeeping/].

#### 1.2 Function catalogue (grouped as Ramp groups them)
Sources: navigation at https://ramp.com; plan matrix at https://ramp.com/pricing; release index at https://ramp.com/new-on-ramp; all read 21 November 2026.

**Products (site navigation)**

| Module | What it does for the customer | Plan / status |
|---|---|---|
| Corporate cards | Unlimited physical and virtual cards. Per-card controls by merchant, category, amount and time. Auto-lock when receipts or compliance are missing (Plus). Local-currency cards in 30+ countries (Enterprise). | Free; local cards on Enterprise [Fact, pricing] |
| Expense management | Receipt capture by SMS, Slack, email and app, with auto-matching. Expense submission. AI expense review with policy insights (Plus). | Free core; AI review on Plus |
| Reimbursements | Employee out-of-pocket reimbursement. "Prefilled reimbursements" added August 2026. Locally funded reimbursements on Enterprise. | Free; Aug 2026 [Fact, new-on-ramp] |
| Spend management / Approvals / Budgets | Spend requests, pre-spend controls, budgets versus actuals in real time (Plus), and an approval-routing workflow builder. January 2026 added budget-and-approval alignment. | Free core; real-time BvA on Plus |
| Travel | Booking for flights, hotels and cars under a custom travel policy. 24/7 phone travel support on Plus. Hotel auto-rebooking when the price drops by US$50 or more. Guest travel via the acquired Juno platform. | Free; rebooking per https://ramp.com/intelligence; Juno per Sacra |
| Accounts payable (Bill Pay) | Invoice OCR, bill approval workflows, payment by ACH, card, check, wire and international transfer, automated fraud checks. On Plus: batch payments, AI approval recommendations, line-item auto-coding and payment-release approvals. Split bill payments added August 2026. | Free core; agents on Plus |
| Procurement | Intake (natural-language requests), PO creation and tracking, an advanced approval workflow builder, AI vendor-compliance and due-diligence reviews, three-way match with Ramp POs. Punchouts to Amazon Business and CDW (August 2026). Zero-touch sourcing (RFx) is in early access. | Paid add-on to Plus/Enterprise [Fact, pricing; https://www.cpapracticeadvisor.com/2026/05/02/ramp-rolls-out-ai-agents-for-procurement/182627/] |
| Vendor management | Automatic vendor tracking, contract extraction, and price intelligence (benchmarks vendor quotes against anonymised spend across 85,000 businesses). Renewal briefings 90 days before contract renewal. | Free core; renewal intelligence Apr 2026 |
| Banking / Treasury | Business checking paying 2% (FDIC-insured via partners). A Ramp Investment Account paying 4.67% net of an advisory fee of up to 0.15%, not FDIC-insured. Free wires and same-day ACH. Treasury passed US$1.5B in assets after its January 2025 launch. Ramp applied for an OCC national trust bank charter in October 2026 (not approved). | Free [Fact, pricing; Sacra] |
| Accounts receivable (new, 22 Sep 2026) | Invoices generated from contracts and POs. Payment acceptance by ACH, card and check (card via Stripe). Pre-due reminders. Collections agent. AI cash application. QBO/NetSuite sync. With the add-on: billing schedules (recurring and contract-based), revenue recognition schedules and journal entries, Avalara sales tax. | Core on Free; add-on for billing schedules, rev rec and Avalara; US-only, single-entity [Fact, https://ramp.com/pricing; https://support.ramp.com/ramp-ar-overview] |
| Security / Trust | Fraud and anomaly detection, including AI-generated fake receipts. Trust centre at trust.ramp.com. | — |
| Mobile app; Ramp Sheets | iOS and Android app. Spreadsheet-style finance data tool (no detail read). | [Fact, nav only] |

**Platform**

| Module | What it does | Status |
|---|---|---|
| Accounting automation | Accounting rules (Free). On Plus: AI coding for every field, auto-approval and sync of routine spend, multi-entity. The Accounting Agent (19 Feb 2026) codes all transactions, bills and invoice lines across GL, department, class, location and custom fields. It reviews 100% of spend, syncs low-risk items in real time, and posts month-end accruals with automatic reversal. Automated amortisation journal entries were added August 2026. | Plus [Fact, https://www.cpapracticeadvisor.com/2026/02/12/ramp-unveils-accounting-agent-to-streamline-bookkeeping/] |
| Integrations | QuickBooks Online and Xero (Free). NetSuite, Sage Intacct and others (Plus). Workday and Oracle Fusion (Enterprise). | [Fact, pricing] |
| Reporting | Custom report builder and AI reporting (Free). Live shared reports and scheduled exports (Plus). Procurement reporting from plain-English questions. | — |
| Multi-entity; Global | Multi-entity visibility restrictions (Plus). Global cards and payments. Automatic tax capture (Plus). | — |
| Intelligence (Ramp agents) | Listed in 1.3. | — |
| AI Spend Management + Router | Tracks spend by AI provider, model, team and project. Soft and hard limits. Engineering can choose which models and providers are allowed. Router is a model gateway (router.com, August 2026); Ramp claims about 40% average inference savings, a figure reported by customers. | Q3 2026 [Fact, new-on-ramp; Sacra] |
| Glass | A workspace that stores the AI automations, prompts and skills employees build (October 2026). | [Fact, TechCrunch 15 Oct 2026] |
| Ramp for Construction | Card controls by job, cost code and role. Job budgets against ERP budgets. | Q3 2026 |
| Stack by Ramp | Billed as "the AI operating system" for accounting firms and finance teams ("Ramp Stack for accountants", Q2 2026). | No detail read |
| Ramp for Agents | Gives AI agents an identity and an owner. Policy (budgets, approved merchants, required receipts, approval over a threshold) applies before money moves. Agents pay via Agent Card, MPP or x402, with an audit trail. Connects through API, MCP or CLI. | No status or date shown [Fact, https://agents.ramp.com] |
| Developer API + MCP | REST Developer API with OAuth client-credentials and per-resource scopes. An open-source MCP server (detail in 1.4). | [Fact, GitHub] |
| Ramp Labs | Experimental projects at labs.ramp.com. | Not read |
| Partner programmes | Accounting firms, PE, VC, system integrators, technology, spend/payroll, resellers, franchises. | [Fact, nav] |

#### 1.3 The Ramp agents (what each does, how autonomous it is, published numbers)

| Agent | Launched | Does | Autonomy | Numbers (Ramp's own) |
|---|---|---|---|---|
| Policy Agent (expense approvals, "agents for controllers") | 9 Jul 2025, early access; later GA | Reads the policy and the transaction, receipt, attendee, trip and custom-field context. Returns approve, requires review or reject, citing the policy text. Answers employee policy questions by SMS (text HIRAMP), Slack or email. Suggests policy changes. | Recommends by default. Auto-approves clearly in-policy items only where the workflow enables it. Reviewers have final say. | 99% accuracy; 15x more out-of-policy spend caught; 85% fewer manual reviews; more than 65% of approvals handled autonomously [Vendor claim, https://ramp.com/blog/ramp-agents-announcement; support page; zenml] |
| AP agents: zero-touch coding, fraud checks, approval recommendations, card-payment agent | 7 Oct 2025 | Line-item GL coding learned from history plus taught rules. 60+ fraud signals checked before routing. Approval summaries of vendor history, contract and prior bills. The card-payment agent types card details into vendor portals to earn cashback. | Recommendations; fraud flags hold bills; coding automatic once taught | 85% of fields right first time; 90,000 recommendations at 90% acceptance; more than US$1M fraud caught; US$2M cashback [Vendor claim, https://ramp.com/blog/ramp-ap-agents-announcement] |
| Accounting Agent | 12–19 Feb 2026 | Codes everything, smart review of 100% of spend, real-time sync of low-risk items, accruals with reversals, reconciliation | Auto-sync under the team's controls, with audit logs | Close 3x faster; 40+ hours a month saved |
| Procurement agents (intake, workflow builder, due diligence, renewal intelligence, zero-touch sourcing, reporting) | 29 Apr 2026 | Listed in 1.2 | Sourcing is early access; the rest recommend | Process 3x faster; ~2 hours saved per request; 16% vendor savings; 46 hours a month saved |
| AI cash forecasting; "zero-touch AP" | Q4 2025 | Not read in detail | — | — |
| AR Collections agent + cash application | 22 Sep 2026 | Detailed in 1.5 | Drafts only; cash application can auto-apply | No metrics published |

#### 1.4 How it works underneath (as far as published)

**Policy capture** [Fact, https://support.ramp.com/policy-agent-overview]
- The customer uploads a policy, uses the current employee policy, or starts from Ramp's best-practice template.
- Ramp converts it into an "AI-friendly structured document". The conversion strips filler and can add missing rules from travel settings, but does not invent rules.
- It cannot read images or hyperlinks. The recommended size is about 10 pages or 10,000 words.
- Conversion runs asynchronously, and the agent then re-evaluates recent expenses within 24 hours.
- The agent-facing "knowledge center" document is kept separate from the employee-facing PDF that staff sign. Editing one does not change the other or trigger new signatures.

**Decision inputs**
- The policy, merchant and transaction data, receipts, memos, attendees, trip, location and custom fields (department, role).
- Reference data such as GSA per-diem rates, and card metadata.
- USD limits are checked against the converted amount on the spend date.
- The agent does not check GL codes.

**Output and confidence**
- Three classes only: approve, requires review, reject.
- Vague policy language yields "Requires review".
- Ramp avoids numeric confidence because LLM confidence clusters at 70 to 80% [Fact, zenml summary of the Ramp engineering post "How To Build Agents Users Can Trust", 10 July 2025, by CJ Enright, Will Koh and Felix Zhang; the original page did not render for me].

**Guardrails**
- Deterministic dollar limits, vendor blocklists and category restrictions sit above the LLM, which cannot override them [Fact, zenml summary].
- The autonomy boundary is set in the workflow builder. Ramp's example: always require review over US$50.

**Audit**
- Each expense keeps an activity feed: recommendation, rationale, cited policy text, policy version, overrides, thumbs up/down and exceptions.
- An org-wide audit log covers the same, and a policy report shows agent-reviewer alignment [Fact, support page].

**Evals** [Fact, https://ramp.com/leading-indicators/what-it-takes-to-build-ai-agents-at-scale, 20 April 2026; zenml]
- An accountant defines the correct path, a frontier model stress-tests it for edge cases, and beta users give feedback.
- Golden datasets come from internal review, not from user actions.
- Errors users flag go into the eval set. Structured extraction is "close to unit-testable".

**Models**
- The Policy Agent uses OpenAI, with no retention or training on customer data, and is in scope for Ramp's SOC 1 audit [Fact, support page].
- Ramp starts on a frontier model and moves to cheaper ones once behaviour is stable. It is exploring a frontier orchestrator with small RL-trained sub-agents for tasks like reconciliation (not deployed) [Fact, leading-indicators].
- Ramp's internal background coding agent, "Inspect", runs in Modal sandboxes [Fact, same].

**Developer API and MCP** [Fact, https://github.com/ramp-public/ramp_mcp, last commit 20 March 2025, MIT licence]
- Auth is OAuth client credentials from a Ramp developer app, with scopes granted per resource. Read scopes include `transactions:read`, `reimbursements:read`, `bills:read`, `locations:read`, `departments:read`, `bank_accounts:read`, `vendors:read`, `entities:read`, `limits:read`, `spend_programs:read` and `users:read`.
- The server is a local "ETL + ephemeral SQLite" design. `load_*` tools pull API pages (up to 100 pages) into an in-memory SQLite database. The LLM then calls `process_data` (picking columns), `execute_query` (raw SQLite SQL) and `clear_table`.
- Amounts are integers in the smallest currency unit.
- The server defaults to the demo environment; `RAMP_ENV=prd` switches to production.
- It is read-only. The developer docs site (docs.ramp.com) needs JavaScript, so I could not read the full API resource list or webhook catalogue.
- Agent payments with identity and limits are offered separately via Ramp for Agents [Fact, https://agents.ramp.com].

#### 1.5 Ramp Accounts Receivable in detail (the direct overlap with the founder)

**Scope and pricing** [Fact, https://support.ramp.com/ramp-ar-overview; https://cfodive.com/news/ramp-expands-accounts-receivable-cfos-seek-faster-cash-flow-ai/830994]
- US businesses only, single-entity, QuickBooks Online or NetSuite (NetSuite via a waitlist).
- Core invoicing is free; billing schedules, revenue recognition and Avalara need the add-on.

**Roles**
- Owner and Admin have full access.
- Finance Admin manages invoices, customers, settings and sync, but cannot enable the product.
- An "Accounts Receivable" role can view invoices and customers and edit products.

**Onboarding**
1. Import customers, products and open invoices.
2. Set payment methods: card needs Stripe; ACH debit needs Stripe or a bank account; ACH credit and check use the details shown during setup.
3. Set branding.
4. Map GL accounts: the AR account, an income account, and a cash or undeposited-funds account are required.

QuickBooks Online has a known trap: "Automatically apply credits" must be off, or enablement fails. Ramp claims setup takes 5 minutes [Vendor claim, https://ramp.com/blog/introducing-accounts-receivable].

**Invoice creation**
- Ramp extracts the customer, line items, pricing and terms from an uploaded contract or PO into a draft invoice for Finance to review.

**Collections agent** [Fact, https://support.ramp.com/ramp-ar-collections-agent]
- *Cases.* Each day Ramp groups past-due invoices by customer into one active case per customer. Each case shows status, invoice count, balance, days overdue and last update. Statuses are "Needs attention" and "Waiting on customer".
- *Policy.* A default "AR Collections Policy" is created at enablement. It prepares drafts at 3, 10, 17, 24 and 31 days overdue, then stops so humans take over. Editable areas are reminder timing, dispute handling, escalation guidance and tone. The policy is written guidance for the agent, not a rules engine [Inference from the field names].
- *Inbox.* Gmail or Outlook is connected with permission to read collection-related messages and send collection messages. Ramp reads only the matching collection threads, not the whole inbox. The thread history feeds the draft.
- *Drafting.* "Generate response" produces a draft in a full composer (to, cc, bcc, attachments). Nothing is sent until a human clicks Send.
- *Controls.* Pause/resume per case. "Record promise to pay" takes invoices, a date and an amount, and pauses the sequence.
- *Pre-due reminders.* These are separate and fully automatic, at 7 days and 1 day before the due date, and can be paused per invoice.
- *Channel.* Email only.
- *Context.* Ramp says follow-ups use payment status, customer payment history and the collections policy [Vendor claim, launch blog].

**Cash application** [Fact, https://support.ramp.com/ramp-ar-cash-application]
- Monitors automatically connected bank accounts and ignores reversals, returns, chargebacks, NSF and refunds.
- Matching order: an exact single invoice, then an exact combination of the same customer's invoices, then a suggestion with "Why" reasons.
- Constraints: same customer, same currency, same entity as the receiving account.
- Modes are set per entity: "Automatic and suggested matches" or "Suggested matches only".
- Accepting a suggestion auto-rejects the competing suggestions. A rejection needs a reason code. Suggestions cannot be edited before acceptance.
- Unapplied remainders stay on the payment.
- "Mark paid off Ramp" is irreversible and does not sync.

**Early customer quotes** [Vendor claim, launch blog]
- Scicomm Media: one late payment used to mean 20 to 30 emails.
- Matia: "97% of our payments go through Ramp."

#### 1.6 Commercials (dated)

**Pricing** [Fact, https://ramp.com/pricing, read 21 Nov 2026]

| Plan | Price | What it adds |
|---|---|---|
| Free | US$0 | Cards, expenses, travel, AP with OCR and fraud checks, basic accounting rules, QBO/Xero, vendor management and price intelligence, banking, core AR |
| Plus | US$15 per user per month plus an undisclosed team-size platform fee; 20% off annual; 30-day trial; can be paid with card rewards | AI coding, NetSuite and Sage Intacct, multi-entity, AI expense review, auto-lock, batch payments, AI approval recommendations, custom roles, audit log, real-time budgets |
| Enterprise | Custom, annual | Implementation services, custom workflows, ERP extensions, Workday/Oracle, local cards in 30+ countries, dedicated CSM |
| Add-ons | — | Procurement (on Plus/Enterprise); AR add-on (billing schedules, rev rec); 1099 filing at US$0.65 per filing |

Two business points [Fact, Sacra]:
- Revenue is mostly card interchange plus SaaS subscriptions; Sacra gives no split.
- The audit log and custom roles sit behind Plus. Governance features are a paid-tier lever.

**Funding and valuation** [Fact, https://sacra.com/c/ramp/; TechCrunch 15 Oct 2026]

| Date | Event |
|---|---|
| Mar 2025 | Tender at US$13B |
| Jun 2025 | US$200M at US$16B |
| Jul 2025 | US$500M at US$22.5B |
| Nov 2025 | US$300M at US$32B |
| Jun 2026 | US$750M Series F at US$44B |
| Oct 2026 | US$1.85B at US$60B, led by Dragoneer, Thrive, Founders Fund, Sands and Avenir; about US$5B raised in total |

**Revenue**
- About US$1B annualised in August 2025.
- US$1.225B at the end of 2025.
- About US$1.5B in June 2026.
- More than US$2B in October 2026, with positive cash flow.
- Annualised purchase volume above US$275B, up 175% year on year [Fact, TechCrunch; Sacra].

**Customers and team**
- Customers: 50,000 at the start of 2026, 70,000 in June and 85,000 in October.
- 2,200 customers above US$100K in annualised revenue (November 2025).
- Employees: about 1,900 (October 2026) [Fact, Sacra].

**Named results** [Vendor claim, https://ramp.com/intelligence]
- Webflow: 75% less card-reconciliation time.
- Candid: US$250K savings found.
- Glossier: 90% of transactions auto-coded.
- Quora: 5x faster transaction review.
- Procurement: 16% average vendor savings.

#### 1.7 Why customers choose Ramp (evidence) and what they complain about

**Why they choose it**
1. **Software free or cheap, paid for by interchange.** The free plan covers what many mid-market teams need, and Plus can be paid with card rewards [Fact, pricing]. Customers praise the free tier in reviews [Vendor-hostile secondary, https://www.stampli.com/blog/all/ramp-review/].
2. **Employee-facing ease.** Instant virtual cards and receipts by SMS are the most-praised features in review excerpts [same Stampli summary]. G2 shows 4.8 of 5 from 2,582 reviews [Fact, https://g2.com/products/ramp-financial-ramp/reviews?page=5].
3. **One platform for all outgoing money.** Half of customers used at least two products by June 2025 [Fact, Sacra]. AR extends this to incoming money ("97% of our payments go through Ramp. Now ... revenue").
4. **Agents with published accuracy and acceptance rates** that act inside existing approval chains (90% acceptance on AP recommendations).
5. **Shipping speed.** Ramp publishes monthly or quarterly release editions with dozens of features [Fact, new-on-ramp]. Buyers expect the gaps to close.

**Complaints** [secondary, competitor-curated, https://www.stampli.com/blog/all/ramp-review/, updated May 2026]
- AP and reporting are thin for complex needs.
- It gets expensive for large headcounts that mostly use reimbursements.
- Some bulk edits are missing.
- Payments made outside Ramp do not sync.
- Support is bot-heavy, and onboarding is weak for self-serve customers.
- AR-specific limits [Fact, support pages]: US-only, single-entity, only two ledgers, email only, and no autonomous sending.

#### 1.8 How Ramp deploys
- Free and Plus are self-serve: sign up, connect the ledger and bank, issue cards, upload the policy.
- Ramp claims the Policy Agent onboards a 500-person company "in about the time it takes to get coffee" [Vendor claim, agents announcement]. The policy conversion is asynchronous, with a re-evaluation window of up to 24 hours.
- AR claims a 5-minute setup: imports, payment methods, branding, GL mapping.
- Enterprise gets scoped implementation, integration validation testing, training and change management [Fact, pricing].
- Agents are switched on in an "Early Access" tab in company settings and enabled per workflow [Fact, agents and AP blogs].

#### 1.9 What to copy from Ramp
1. **A collections policy as an editable natural-language document** with named sections (timing, dispute handling, escalation, tone). Default cadence 3/10/17/24/31 days overdue, then hand back to humans after the fifth notice. https://support.ramp.com/ramp-ar-collections-agent
2. **One case per customer**, rebuilt daily from past-due invoices. Two states ("Needs attention" / "Waiting on customer"). Pause/resume. "Promise to pay" as a structured record (invoices, date, amount) that pauses the sequence automatically. Same URL.
3. **Separate pre-due reminders (automatic) from post-due collections (drafted)**: low-risk messages are automatic, higher-risk ones go to review. Same URL.
4. **Read only matching collection threads** in the customer's own inbox, and send from the customer's own address. The permission scope is "read collection-related, send collection". Same URL.
5. **Deterministic-first cash matching** (exact single, then exact combination within one customer, currency and entity), then AI suggestions with "Why" reasons. A per-entity mode switch for automatic versus suggested. Rejection reason codes captured as training and eval signal. https://support.ramp.com/ramp-ar-cash-application
6. **Three-class outcomes instead of confidence numbers**, with a valid "unsure" route to humans that records why. https://zenml.io/llmops-database/building-trustworthy-ai-agents-for-automated-expense-management
7. **Cite the exact rule text** and store the policy version on every decision. Show the referenced rule on hover. https://support.ramp.com/policy-agent-overview
8. **Hard limits outside the LLM** (amount thresholds, blocklists) that the model cannot override; the autonomy boundary set in a workflow builder. zenml summary above.
9. **Suggestion mode, then partial autonomy, then full autonomy**, with agent-reviewer alignment reported as a metric the customer can see before raising autonomy. Policy agent support page (the "agent-reviewer alignment" report).
10. **Keep the agent-facing policy separate from the human-facing signed document**, with versioning. Policy agent support page.
11. **Golden datasets labelled by experts, not learned from user behaviour.** Ramp found users approve too leniently; collectors are likely to be inconsistent in the same way [Inference]. zenml summary.
12. **Model cost:** launch on the strongest model, then downgrade per task once evals are stable. https://ramp.com/leading-indicators/what-it-takes-to-build-ai-agents-at-scale
13. **Agent identity**: every agent has a name and an owner, acts under a user's permissions, and stays attributed from request to reconciliation. https://agents.ramp.com
14. **For an MCP surface**, Ramp's ETL-to-SQLite approach shows the pain of raw APIs feeding LLMs. The founder's semantic layer should expose governed metrics instead [Inference]. https://github.com/ramp-public/ramp_mcp

#### 1.10 What not to copy, and Ramp's weak points
- **The interchange-subsidised free tier.** The founder has no card float to fund free software [Inference].
- **The MCP design** (ad hoc SQL over raw JSON in memory). It is a workaround, not a governed model; metric definitions are left to the LLM [Inference from code].
- **Ramp AR's gaps are the opening**:
  - US-only, single-entity, QBO/NetSuite only;
  - email only (no WhatsApp/SMS, which matter in Malaysia and Asia);
  - no autonomous sending;
  - no published metrics yet;
  - collections context limited to Ramp's own data, not CRM, support tickets or contracts held elsewhere [Fact for limits; Inference for implications].

#### 1.11 Relationship to the founder's product
- **Competitor**, for US companies on QuickBooks Online or NetSuite that already run spend on Ramp. Its AR is free and inside a tool they already trust.
- **Teacher**, for the trust mechanics.
- **Possible data source or partner**, through Ramp's API for AP-side context.
- In the founder's likely early markets (Malaysia, Southeast Asia, multi-entity groups, WhatsApp-first collections), Ramp is not present today [Inference; Ramp AR is US-only per the support page].

---
### 2. Spend and payables platforms

#### 2.1 BILL
**In one paragraph.** BILL (NYSE: BILL) sells AP, AR, and spend-and-expense software to small and mid-sized US businesses and their accounting firms.
- **Who buys it:** owners, controllers and outsourced accountants. BILL calls this market the "Fortune 5 Million".
- **Scale:** more than 500,000 businesses, about US$2T in transactions processed, and a payments network of 8M+ members (9M+ in its October 2026 announcement) [Vendor claim, https://www.bill.com/product/ai; https://www.cpapracticeadvisor.com/2026/10/20/bill-unveils-new-agentic-capabilities-for-finance-teams/192079/].
- **The result customers pay for:** bills paid and invoices collected without manual entry. BILL's survey (January 2026) reports 10 hours a week saved.

**Function catalogue** [Fact, https://www.bill.com/product/pricing, read 21 Nov 2026]

*Plans and AR coverage*
- **AP & AR plans:** Essentials US$49, Team US$65, Corporate US$89 per user per month; Enterprise custom.
- **AR on every plan:** custom invoices, send and track, payment reminders, ACH and card acceptance, auto-charge and auto-pay.

*AP features by plan*
- All plans: bill entry, approval workflows, a central inbox, W-9 collection.
- Team and above: the AI Invoice Coding Agent.
- Corporate and above: custom approval policies, SSO, multi-entity, discounted approver-only seats.
- Enterprise only: dual control.
- Procurement (requests, POs, 2-way match): an add-on below Corporate.

*Accounting sync*
- Essentials: CSV only.
- Team and Corporate: two-way QuickBooks and Xero.
- Enterprise adds NetSuite, Sage Intacct, Dynamics, Acumatica and Rillet.

*Other plans and products*
- Cash-flow forecasting: for QuickBooks Online users on Team and above.
- API access: on all plans.
- Spend & Expense: US$0 software, with credit lines from US$1K to US$5M; BILL earns on interchange.
- Accountant Console: US$49 per month.

*Transaction fees (BILL's real meter)*
- ACH: US$0.59 for the payer, US$0.59 for the receiver.
- Check: US$1.99.
- Card acceptance: 2.9%.
- Instant transfer: 1.25%.
- International USD wire: US$19.99.
- Mailed invoice: US$1.99.
- 1099 filing: US$2.99 per form.

*AI* [Fact, https://www.bill.com/product/ai; cpapracticeadvisor 20 Oct 2026]
- **Invoice automation:** about 99% accuracy on common fields "under tested conditions" (the top 20% of common bills).
- **Detection:** duplicate-bill detection and fraud/risk detection, including vendor bank-detail changes.
- **Approvals:** unusual-amount flags during approval.
- **W-9 agent:** emails vendors, follows up, validates the TIN, and updates the vendor record after human review.
- **Expenses:** receipt matching.
- **Onboarding:** AI-assisted onboarding.
- **MCP:** an external MCP server, available now, with docs at developer.bill.com.
- **AI governance hub:** on/off per AI capability, "how much the AI does", and an audit log of every AI action.
- **Chat with BILL:** beta with a waitlist. It answers questions including receivables tracking.
- **Risk intelligence** (19 October 2026): BILL claims an average of US$138,000 in mistakes or unusual payments caught per customer over August–September 2026.
- **Inbox:** auto-labels invoices and W-9s.
- **October 2025 launches:** W-9 and reconciliation agents [search-result titles: businesswire 28 Oct 2025; nysscpa.org].

**Receivables specifically.** BILL's AR is long-standing invoicing with scheduled reminders and auto-charge. I found **no BILL collections agent** in the pages read [Fact as of these pages; a dedicated AR agent may exist on pages I could not open, Unverified].

**Why chosen.**
- Accountant-firm distribution (Console and partner pricing).
- The payments network: vendors already on BILL.
- Mature ledger sync.

**Complaints:** per-transaction fees and per-user pricing [Inference from the fee table; review pages not read].

**Deploys:** self-serve on Essentials and Team; sales-led on Enterprise.

**What to copy.**
1. An AI governance hub: per-capability on/off, autonomy level, and a full log of AI actions in one admin page (https://www.bill.com/product/ai).
2. Publishing accuracy figures together with the tested conditions they hold under (same page).
3. Per-transaction fees on money movement, alongside seat fees (https://www.bill.com/product/pricing).

**Relationship:** a competitor on basic AR for US SMBs. A possible integration source, since many companies send invoices through BILL.

#### 2.2 Brex (now part of Capital One)
Brex sold corporate cards, expense management, bill pay, travel and business accounts to startups and enterprises. Capital One announced the acquisition in January 2026 (reported US$5.15B; https://www.financierworldwide.com/fw-news/2026/1/27/capital-one-acquires-brex-in-515bn-deal) and completed it (https://www.capitalone.com/about/newsroom/capital-one-completes-acquisition-of-brex/; https://www.brex.com/journal/capital-one-completes-acquisition-of-brex). Sacra dates the close to April 2026 [Fact for titles and the Sacra statement; I could not open the pages after the fetch pool ran out]. Brex had shipped AI agents for expense review and an AI assistant in 2025 [Unverified this session].

Relationship: no AR product known [Unverified]. Capital One may bundle Brex into its commercial bank offering. It is a teacher only on spend controls.

#### 2.3 Airbase (Paylocity), Navan, Mercury, Rippling Spend
All [Unverified this session; pages not opened because the fetch pool ran out]:
- **Airbase** was bought by Paylocity (announced 2024) and is now sold as Paylocity's spend management (cards, AP, expenses, procurement) inside an HR and payroll suite.
- **Navan** (formerly TripActions) is travel plus expense with corporate cards. It is AP-light and has no AR.
- **Mercury** is a startup bank (checking, treasury, cards). It has bill pay and simple invoicing with payment links ("Mercury Invoicing"), aimed at small companies. It is not a collections tool.
- **Rippling Spend** (cards, expenses, bill pay, travel) rides on Rippling's employee graph, so policies key off HR attributes. TechCrunch (15 Oct 2026) names Rippling as Ramp's main competitor in cards, expenses and bill pay [Fact, TechCrunch].

The lesson from Rippling is the founder's own thesis: **one shared company model (Rippling's employee graph) makes policy and permission rules cheap to express** [Inference].

---

### 3. Close and accounting automation

#### 3.1 Numeric
**What it is.** Close-management software that has grown into an "ERP replacement" for mid-market and venture-backed finance teams (controllers, accounting managers). Named customers include Brex (close cut from 6 days to 4), Mercury, Plaid, Asana, Wealthfront, ClickUp, Betterment, GOAT and Zip [Fact, https://www.numeric.io/pricing].

**Catalogue (as Numeric groups it)**
- **Close Management:** checklist, account reconciliation, flux analysis, transaction monitors.
- **Cash Management:** matching for up to 95% of bank transactions, journal-entry automation, live bank feeds, AI parsing of bank statements.
- **Billing & Revenue (new):** usage ingestion, usage-to-contract matching, invoicing, **collection automation**, revenue recognition, ASC 606.
- **ERP Replacement (new):** agentic subledgers, reporting, Prism (in-app AI that surfaces each day's agent items for review), App Studio.
- **Platform:** "AI at Numeric", **Numeric MCP**, integrations.

**Commercials.** Pricing is custom, based on transaction volume and seats; onboarding and migration are scoped upfront. Customers can mix and match products. Funding was not on the page.

**Copy.** A **daily "items needing review" queue** produced by agents (Prism) as the main human surface. Modular packaging that runs alongside the existing ERP first, then expands (https://www.numeric.io/pricing).

**Relationship.** An emerging competitor on collections for venture-backed SaaS. Otherwise a teacher.

#### 3.2 Rillet
**What it is.** An AI-native ERP (general ledger) for venture-backed companies.
- Claims 800+ customers in 70+ countries.
- Named logos include Mercor, Sotheby's, Temporal, Gamma, LangChain and Kickstarter [Vendor claim, https://www.rillet.com].
- Funding was not on the page. Earlier press reported large 2025 rounds [Unverified].

**Catalogue**
- Continuous-close general ledger.
- AR: automated invoicing and contract management.
- AP: auto-categorisation.
- Bank reconciliation.
- Revenue recognition, multi-entity and intercompany accounting, GAAP and real-time reporting.
- Aura AI: an agent working on the live ledger.
- Audit & compliance.
- Agentic migration with CPA-led implementation.
- Claims of "12,000+ connectors and MCPs" and 99.7% of transactions posting automatically.
- No collections module.

**Relationship.** A possible partner: an AR agent could sit on top of Rillet's AR ledger. BILL's Enterprise plan already syncs to Rillet [Fact, BILL pricing].

#### 3.3 Basis
**What it is.** AI agents that do accounting work end to end for **accounting firms**: CAS/close, tax returns, audit testing with cited evidence, plus a corporate accounting version.
- Named firms include Baker Tilly, CohnReznick, Citrin Cooperman, Sikich, UHY, Wiss and Clark Nuber.
- Boulay reports a K-1-heavy return falling from 100+ prep hours to 15–20.
- Clark Nuber says its CAS practice grows 50% a year because of Basis [Vendor claim, https://www.getbasis.ai].
- Pricing and funding were not on the page.

**Copy.** "Start at review": the agent prepares everything and humans begin at the review step. Every conclusion cites evidence.

**Relationship.** A teacher. Accounting firms are also a distribution channel for SMB collections [Inference].

#### 3.4 FloQast, BlackLine, Trullion, Digits, Puzzle
All [Unverified this session; pages not opened because the fetch pool ran out]:
- **FloQast:** close management for mid-market and enterprise accounting teams. Checklists, reconciliations, flux, and AI agents for close tasks.
- **BlackLine:** enterprise financial close plus an **Invoice-to-Cash** suite (collections management, cash application, credit and dispute management, team-based worklists) and AI branded "Verity". It is the incumbent for large-enterprise AR. I could not open its page.
- **Trullion:** AI for lease accounting, revenue recognition and audit.
- **Digits:** an AI-native general ledger and bookkeeping product for startups and SMBs, with an "autonomous" ledger claim.
- **Puzzle:** an AI accounting ledger for startups, cash-basis to accrual.

Of these, only BlackLine competes directly in collections, and it targets companies far larger than 1,000 staff [Inference].

---

### 4. AI-native ERPs

| Company | What it ships (vendor page, read 21 Nov 2026) | AR / collections | Deployment claims | Named results |
|---|---|---|---|---|
| Campfire (https://campfire.ai) | Core accounting GL with multi-entity consolidation; revenue automation; reporting; close management (checklists, flux, reconciliation); **Ember AI** assistant; its own "Proprietary Foundation Model"; 100+ integrations; 180+ currencies | No AR or collections module; AR aging only as a use case | None stated | PostHog 5–6 days off close; Flex 70% faster close; Replit grew US$10M to US$200M+ ARR without adding accountants |
| DualEntry (https://www.dualentry.com) | Full ERP: GL, AR, AP, cash, tax, POs, reconciliation, close, order management, revenue recognition, subscription billing, fixed assets, consolidation, multi-book, treasury, API and **CLI**; "13,000+ integrations" | AR with invoice reminders; no collections agent | Data ingested in 24 hours, live under 30 days, next-day QuickBooks migration, US$0 implementation (customer stories); a US$6M "ERP Rescue Fund" | Graphite close cut from 20 days to 1; Slash runs US$600M revenue with 2 finance staff. US$90M Series A (Lightspeed, Khosla, GV) |
| Light (https://light.inc) | A single ledger (payables, receivables, cards, consolidation); **6 agents within approval policies** (including a Bill Agent and an Internal Audit Agent); custom agents; Claude MCP; Sheets, Slack and Teams plug-ins; app store; multibook; e-invoicing mandates; about 20 countries; SOC 1/2 Type 2 | Receivables in the ledger; no collections agent named | Signed to live in "as little as 4 weeks"; 4–16 weeks to first close; Officeguru live in 7 days | Tillo: close from 12 days to 5 across 4 entities and 23 currencies |

**Lessons**
- **Fast migration is now the main selling point** for AI ERPs ("live in 24 hours", "4 weeks").
- **"Agents inside approval policies"** is the standard phrasing.
- **MCP and CLI** are becoming table stakes.
- **None of the three ships a collections agent.** AR stops at the invoice.

They are possible partners or hosts for an AR agent, and teachers for onboarding speed. For the founder, the trap is drifting into building a ledger [Inference].

---

### 5. Finance agents

| Company | What it is | AR? | Controls | Results |
|---|---|---|---|---|
| Truewind (https://www.truewind.ai) | An AI accounting agent for controllers and accounting firms. Turns bank statements, payout reports and workpapers into GL-ready journal entries, reconciliations and SOPs. Coding rules, prepaid and fixed-asset schedules, flux. Integrates with QBO, Intacct, NetSuite and Intuit Enterprise Suite | No | The team keeps final posting authority; audit-ready log per posting decision; the agent **asks clarifying questions instead of guessing**; workpapers roll forward monthly; SOPs reusable across entities or clients; SOC 2 Type 2 | Lavoie CPA: a client month closed in 30–45 minutes; ATTOM: 40% cost saving [Vendor claim] |
| Maxima (https://www.maxima.ai) | Agentic close for strategic accounting teams at larger companies. "Max" agent; journal-entry automation, transaction matching, reconciliation, flux, close orchestrator, cash accounting. Works alongside NetSuite, SAP, Workday and Sage | No | Follows customer permissions and approval workflows, full audit trail, **never posts without sign-off**; deterministic logic so the same inputs give the same outputs | Scale AI: closing 4–5 days faster with 98% automation; customers include Zendesk, Rippling, Miro [Vendor claim] |
| Zeni | AI bookkeeping plus a human-staffed finance service for startups (bookkeeping, bill pay, invoicing, CFO services) [Unverified; page not read] | Invoicing as a service | — | — |
| Rogo | An AI analyst platform for investment banks and investors (research, comps, decks over market data) [Unverified; page fetch rejected] | No | — | — |
| Hebbia | A document-analysis agent platform (Matrix) for finance professionals (PE, banks, asset managers) [Unverified] | No | — | — |

**Lessons**
- These agents earn trust by **preparing work and leaving the posting to a human**.
- They **ask instead of guessing**, which Truewind states outright.
- They are **deterministic where possible**, which Maxima stresses.

Rogo and Hebbia are about buy-side analysis, not operations. They matter only as examples of citation-heavy answers for the founder's internal "questions" face [Inference].

---

### 6. What the ledgers ship natively for receivables and collections

| Ledger | Receivables and collections, native | Source and status |
|---|---|---|
| QuickBooks Online / Intuit Enterprise Suite ("Payments AI", formerly marketed as the Payments Agent, under Intuit Assist) | AI auto-fills invoices from uploaded files, images or text; suggests payment methods (card, ACH, PayPal, Venmo); **sends reminders for overdue invoices on a schedule the user reviews and approves once**; editable reminder message; suggests late-fee policies; drafts invoice email subject and body; creates estimates from Gmail/Outlook negotiation emails. US only; Essentials, Plus, Advanced or IES | [Fact, https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US, updated 5 Aug 2026] |
| Xero (JAX) | JAX predicts when customers will pay and **automatically sends reminders based on those predictions**; deposits and progress payments; bulk payment of several overdue invoices; plain-English reporting; "JAX Assure" anti-hallucination filter. Announced 3 Sep 2025 (Xerocon Brisbane), rolling out Australia first. JAX went to beta August 2024 | [Fact, https://www.techrepublic.com/article/xero-jax-significant-updates/] |
| NetSuite (NetSuite Next, SuiteAgents) | SuiteAgents are defined by goals, instructions, access permissions and business context. They can create draft records and act "within predefined boundaries", and can require approval before any action that affects the business. They run under the same roles and permissions as people. A SuiteAgent Management Workspace shows actions and data accessed, with a kill switch. Approval prompts offer once, for the rest of the chat, or deny. SuiteSkills are reusable process instructions. Ask Oracle shows the reports, assumptions and record links behind each answer. AI Connector for Claude and ChatGPT. Out-of-the-box agents shown cover inventory, project risk, revenue leakage and order triage. **No collections agent in the article** | [Fact, https://itwire.com/guest-articles/company-news/suiteworld-keynote-netsuite-shows-the-mechanics-of-autonomous-suite, Oct 2026] |
| Sage (Sage Copilot in Sage Accounting and Intacct) | Copilot flags overdue invoices and drafts customer reminders; Intacct has an AR module with dunning [Unverified; page not opened] | — |
| Zoho Books | **Automated payment reminders and a self-service customer portal on the free plan** (1 user plus 1 accountant). Progress invoicing from Standard (US$15–20 per organisation per month). Multi-currency, approvals and custom workflows from Professional (US$40–50). Blueprints (process control) on Elite (US$120–150). Extra users US$2.50–3 per user per month. Zia AI, WhatsApp/SMS reminders and auto-charge were not confirmed on the page read | [Fact, https://www.zoho.com/books/pricing/] |

**Implication** [Inference]
- In every ledger a company of 100 to 1,000 staff might use, **basic scheduled reminders are free or bundled**, and QuickBooks and Xero now add AI drafting and payment prediction.
- A paid collections agent has to beat these on:
  1. judgement: disputes, promises to pay, partial payments and escalation;
  2. cross-system context: CRM, support, contracts, usage;
  3. channels: WhatsApp and SMS, in the customer's language;
  4. governance: who approved what, under which policy version;
  5. management reporting: DSO by segment from governed metric definitions.

---
## Synthesis: what finance buyers at 100 to 1,000 staff companies pay for

### 7.1 Patterns in what they pay for
1. **Hours removed from recurring work.** Every vendor leads with hours saved:
   - Ramp: more than 40 hours a month, close 3x faster.
   - BILL: 10 hours a week.
   - Basis: 100 hours down to 15–20.
   - Campfire, DualEntry and Light: days removed from the close.

   The unit is "finance headcount not hired": Replit grew without adding accountants, and Slash runs US$600M revenue on 2 finance staff [Vendor claims, pages cited above].
2. **Money found or protected.** Fraud caught, out-of-policy spend, vendor savings (Ramp 16%), BILL's US$138K of errors caught per customer, card cashback. For AR, the equivalent is cash collected sooner (lower DSO) and fewer write-offs [Inference].
3. **One platform.** Ramp's growth comes from customers adding products (half used two or more by June 2025), and AR was "a top request" [Fact, Sacra; CFO Dive].
4. **Ledger sync that works.** Every plan matrix gates higher ERPs (NetSuite, Intacct, Workday) behind higher tiers. Ledger integration is a pricing lever [Fact, Ramp and BILL pricing].
5. **Governance features**: audit log, custom roles, multi-entity restrictions, SSO, dual control. All sit in paid tiers (Ramp Plus, BILL Corporate and Enterprise) [Fact].

### 7.2 Typical price points (dated November 2026)

| Category | Price point | Source |
|---|---|---|
| Spend/AP suite | Ramp: free, or US$15 per user per month plus a platform fee; BILL AP/AR US$49 / 65 / 89 per user per month; card products free (interchange) | [Fact, pricing pages] |
| Payment fees | ACH US$0.59 each side; card acceptance 2.9%; instant transfer 1–1.25% | [Fact, BILL] |
| SMB ledger with AR reminders | Zoho Books US$0–275 per organisation per month; QuickBooks and Xero include AR AI in existing plans | [Fact, Zoho; Intuit help] |
| Close, AI ERP, agents | Custom pricing, sales-led; based on volume and seats (Numeric) | [Fact, Numeric]; others "request demo" |
| Enterprise AR (BlackLine and similar) | Custom, typically five to six figures a year | [Unverified] |

**Pricing consequence** [Inference]
- Below about 300 staff, collections reminders are effectively free.
- A collections agent has to price on outcomes or on the AR team's time: per active customer account or per invoice under management, or a platform fee of a few hundred to a few thousand dollars a month.
- Card-like take rates are only possible if the product also moves the money, for example payment links.

### 7.3 How these products earn trust for automated actions
These mechanisms recur across the products read:

1. **Suggest first, earn autonomy per workflow.**
   - Ramp: suggestion mode, then subsets, then full autonomy.
   - Ramp AR: drafts only.
   - QuickBooks: the user approves the reminder schedule once, then it runs.
   - NetSuite: approve once, for the session, or deny.
2. **Low-risk actions automatic, high-risk actions reviewed.**
   - Ramp: pre-due reminders are automatic, overdue collections are drafted.
   - Ramp: auto-approve only clearly in-policy expenses.
   - Ramp cash application: automatic or suggested, per entity.
3. **Cited reasoning.**
   - Ramp: policy-text citations, "Why" reasons on matches.
   - NetSuite: reports, assumptions and record links.
   - Basis: evidence cited per audit conclusion.
4. **Categorical outcomes, with "unsure" as a first-class route to a human.** Ramp; Truewind asks clarifying questions.
5. **Deterministic guardrails above the model.**
   - Ramp: hard limits, blocklists.
   - Maxima: same inputs give the same output.
   - Ramp for Agents: budgets and approval thresholds before money moves.
6. **The agent acts under human-equivalent roles and permissions.** NetSuite: same roles as people. Ramp for Agents: an owner and the user's permissions. Maxima: follows the customer's approvals.
7. **Central AI control and audit.** BILL's AI governance hub (toggles plus a log of every AI action); NetSuite's SuiteAgent Management Workspace with a kill switch; Ramp's activity feed and audit log, plus the policy version on each decision.
8. **Measured agreement** shown to customers. Ramp shows agent-reviewer alignment and 90% acceptance; BILL shows field accuracy together with its conditions.
9. **Compliance attestations covering the AI.** The Policy Agent is in scope for Ramp's SOC 1; Light and Truewind hold SOC 2 Type 2. The model provider does not retain data.

### 7.4 Where a receivables-and-collections agent with a governed company model fits or collides

**Collides** [Inference]
- **US SMB and mid-market on QuickBooks Online or NetSuite with simple AR.** Ramp AR (free, collections agent, cash application) plus QuickBooks Payments AI or BILL reminders cover this. Distribution and price both lose here.
- **Xero shops in Australia, New Zealand and the UK.** JAX sends prediction-based reminders natively.
- **Large enterprises (more than 1,000 staff).** BlackLine Invoice-to-Cash and similar enterprise AR suites are entrenched [Unverified details].

**Fits**
1. **Markets Ramp does not serve.** Ramp AR is US-only [Fact]. Malaysia and Southeast Asia rely on WhatsApp, and Zoho and Xero dominate SMB ledgers there [Inference]. Multi-language, WhatsApp-plus-email collections with local payment rails (DuitNow, FPX) is open ground [Inference; local rails not researched here].
2. **Multi-entity and multi-ledger groups** (100 to 1,000 staff, often 3 to 10 entities). Ramp AR is single-entity only [Fact].
3. **Collections judgement that needs context outside the finance tool**: CRM owner, open support tickets, contract terms, usage, and relationship rules such as "never chase a key account in its renewal month". This is the company model's advantage over Ramp, which sees only its own invoices and inbox threads [Inference].
4. **The internal face.** A governed definition of DSO, overdue and at-risk that the CFO's questions and reports use, so the agent's actions and the finance report agree. Ramp, BILL and the ledgers offer chat over their own data, not a company-defined metric layer [Inference; NetSuite's Ask Oracle comes closest].
5. **Graduated autonomy for external messages.** No one yet lets an agent send overdue collections messages on its own (Ramp drafts only). Xero JAX sends automatically, but only reminders. A product with per-segment autonomy, cited policy, versioned rules and measured approve rates could be first to safe auto-send. That makes it both the differentiator and the main risk [Inference].

**Positioning** [Inference]
- Integrate with the ledger and with Ramp and BILL; don't replace them.
- Read AR from Zoho, Xero, QuickBooks, NetSuite or Ramp. Write payments and notes back. Own the collections policy, the case, the conversation and the metric definitions.

---

## What to copy (consolidated, implementable)
1. **Collections policy object** with sections: timing, dispute handling, escalation, tone. Default cadence offsets [3, 10, 17, 24, 31] days overdue, plus a maximum-notices stop. Ramp's defaults are a sensible starting template. https://support.ramp.com/ramp-ar-collections-agent
2. **Case entity, one active case per customer**:
   - fields: customer, status (needs_attention / waiting_on_customer / paused / closed), overdue invoice ids, balance, maximum days overdue, last update;
   - rebuilt by a daily job;
   - pause and resume. Same URL.
3. **PromiseToPay entity** (invoice ids, date ≥ today, amount > 0) that pauses the sequence automatically. Same URL.
4. **Two message classes**, each with its own autonomy setting: pre-due reminders sent automatically (−7 and −1 days) and post-due messages as drafts by default. Same URL.
5. **Least-privilege inbox scope**: read only collection threads; send from the customer's own mailbox. Same URL.
6. **Cash application pipeline**:
   1. filter out reversals, returns, NSF and refunds;
   2. exact single match;
   3. exact combination within one customer, currency and entity;
   4. suggestion with reasons.

   Accepting one suggestion auto-rejects its competitors. Rejections need reason codes. Mode set per entity. https://support.ramp.com/ramp-ar-cash-application
7. **Decision record** on every agent output: outcome class, rationale, cited rule text, rule version, inputs used, reviewer action, feedback. https://support.ramp.com/policy-agent-overview
8. **Deterministic guards above the LLM**: amount ceilings, do-not-contact lists, legal-hold flags, maximum messages per period. https://zenml.io/llmops-database/building-trustworthy-ai-agents-for-automated-expense-management
9. **AI governance page**: a toggle per capability, an autonomy level per capability, a log of all AI actions, and a kill switch. https://www.bill.com/product/ai; https://itwire.com/guest-articles/company-news/suiteworld-keynote-netsuite-shows-the-mechanics-of-autonomous-suite
10. **Agent-human alignment report** (the percentage of drafts sent unedited, by segment) as the gate for raising autonomy. https://support.ramp.com/policy-agent-overview
11. **Approval granularity** in chat-driven actions: "approve once / for this session / deny". NetSuite itwire article.
12. **Expert-labelled golden sets and an eval harness** before launch; user-flagged errors added to the evals; start on a frontier model and step down per task. https://ramp.com/leading-indicators/what-it-takes-to-build-ai-agents-at-scale
13. **Agent identity and ownership**: each agent has a name and a human owner, and acts within that owner's permissions. https://agents.ramp.com
14. **Onboarding in four steps** (imports, payment methods, branding, GL mapping), with explicit validation errors and known ledger traps documented. https://support.ramp.com/ramp-ar-overview
15. **Ask instead of guess**: an "unsure" outcome triggers a clarifying question to the AR owner. https://www.truewind.ai

## What cannot or should not be copied
- **A free tier funded by interchange** (Ramp, BILL Spend & Expense). It needs a card programme and balance sheet [Inference].
- **Ramp's cross-customer price benchmarks.** These need data from 85,000 customers; there is no equivalent at the start [Inference].
- **Building a general ledger** (Campfire, Rillet, DualEntry, Light). Each raised large sums and competes on migration. It is a distraction from the company-model and collections wedge [Inference].
- **Ramp's MCP pattern of LLM-written SQL over raw tables.** It contradicts the governed-metric principle [Inference from code].
- **Autonomous overdue messaging from day one.** No leader does it. Reputational damage with the customer's own clients is the risk that kills trust [Inference].

## Comparison table

| Company | Category | AR / collections | AI autonomy model | Price signal | Relationship to founder |
|---|---|---|---|---|---|
| Ramp | Spend, AP, procurement, treasury, AR | Yes (Sep 2026): invoices, pre-due auto reminders, Collections agent (drafts), AI cash application; US, single-entity, QBO/NetSuite | Recommend, then auto within workflow rules; cited policy; audit log on Plus | Free / US$15 per user per month + fee / Enterprise | Competitor (US) and teacher |
| BILL | AP, AR, spend | Invoicing, reminders, auto-charge; no collections agent found | AI governance hub; human final decision | US$49–89 per user per month + transaction fees | Competitor (US SMB); data source |
| Brex (Capital One) | Cards, spend | None known | — | Bank-bundled | Not relevant |
| Rippling Spend / Navan / Mercury / Airbase | Spend, travel, banking | Mercury basic invoicing; others none | — | Various | Not relevant / teacher (shared employee graph) |
| Numeric | Close, cash, billing | Collection automation in Billing & Revenue | Daily agent review queue (Prism) | Custom | Emerging competitor (SaaS) |
| Rillet / Campfire / DualEntry / Light | AI-native ERP | AR invoicing; no collections agent | Agents within approval policies | Demo-led | Partner or host |
| Basis / Truewind / Maxima | Accounting agents | No | Prepare, human posts; ask, don't guess; deterministic | Demo-led | Teacher; firms as a channel |
| Rogo / Hebbia | Analyst agents | No | Cited answers | Enterprise | Teacher (internal Q&A) |
| QuickBooks | Ledger | Payments AI: reminders on an approved schedule, late fees, drafted emails | Approve the schedule once | In plan | Competitor (US SMB); integration |
| Xero | Ledger | JAX: payment prediction, auto reminders | Auto-send reminders | In plan | Competitor (AU/NZ/UK); integration |
| NetSuite | ERP | SuiteAgents framework; no collections agent seen | Role-scoped, approval before action, kill switch | In NetSuite Next | Integration; teacher |
| Zoho Books | Ledger | Free automated reminders and customer portal | Rules | US$0–275 per organisation per month | Integration (key in Asia); competitor at the low end |
| BlackLine | Enterprise close and AR | Invoice-to-Cash suite [Unverified] | — | Enterprise | Out of segment |

## Open questions and unverified items
- **BlackLine Invoice-to-Cash, Sage Copilot AR, Zoho Zia and WhatsApp reminders, FloQast, Trullion, Digits, Puzzle, Zeni, Rogo, Hebbia, Navan, Mercury, Rippling Spend, Airbase/Paylocity.** No primary page was read for any of these. The fetch pool ran out partway through the run, ending with "hourly limit on web fetches is most likely used up". Each needs one pass of primary pages.
- **Brex acquisition terms and close date.** Known from search titles and Sacra only.
- **Ramp's AR add-on price and Plus platform fee.** Not published.
- **Ramp Developer API.** The resource list, write endpoints and webhooks were not read (docs.ramp.com needs JavaScript).
- **The "How To Build Agents Users Can Trust" post.** Read via the zenml summary, not the original.
- **A BILL collections or AR agent.** None found; one may exist.
- **Whether Ramp AR's collections agent will gain auto-send or SMS.** Not announced.
- **Pricing for Numeric, Rillet, Campfire, Light, Basis, Maxima and Truewind.** All demo-led; no figures.

## Sources (ranked by usefulness)
1. https://support.ramp.com/ramp-ar-collections-agent (read Nov 2026): the full mechanics of a shipped collections agent; the closest template for the founder.
2. https://support.ramp.com/ramp-ar-cash-application (Nov 2026): deterministic-then-AI matching, modes, reason codes.
3. https://support.ramp.com/policy-agent-overview (Nov 2026): policy capture, three-class outcomes, audit feed, alignment reporting, OpenAI use.
4. https://zenml.io/llmops-database/building-trustworthy-ai-agents-for-automated-expense-management: summary of Ramp's 10 July 2025 engineering post on trust (confidence, guardrails, golden sets, rollout).
5. https://ramp.com/pricing (Nov 2026): plan matrix, including AR in Free and the AR add-on.
6. https://support.ramp.com/ramp-ar-overview (Nov 2026): AR scope, roles, onboarding steps, ledger traps.
7. https://www.bill.com/product/pricing and https://www.bill.com/product/ai (Nov 2026): BILL plans, fees, AI governance hub.
8. https://itwire.com/guest-articles/company-news/suiteworld-keynote-netsuite-shows-the-mechanics-of-autonomous-suite (Oct 2026): SuiteAgents permission and approval mechanics.
9. https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US (updated 5 Aug 2026): QuickBooks native AR AI.
10. https://techcrunch.com/2026/10/15/ramp-reaches-60b-valuation-as-it-pushes-deeper-into-ai and https://sacra.com/c/ramp/: Ramp financials and timeline.
11. https://ramp.com/blog/ramp-ap-agents-announcement (7 Oct 2025), https://ramp.com/blog/ramp-agents-announcement (9 Jul 2025), https://ramp.com/blog/introducing-accounts-receivable (22 Sep 2026): agent launches and metrics.
12. https://www.cpapracticeadvisor.com/2026/02/12/ramp-unveils-accounting-agent-to-streamline-bookkeeping/ and https://www.cpapracticeadvisor.com/2026/05/02/ramp-rolls-out-ai-agents-for-procurement/182627/: Accounting and procurement agents.
13. https://ramp.com/leading-indicators/what-it-takes-to-build-ai-agents-at-scale (20 Apr 2026): model cost and eval practice.
14. https://github.com/ramp-public/ramp_mcp (Mar 2025): MCP implementation.
15. https://agents.ramp.com: agent identity and payment controls.
16. https://ramp.com/new-on-ramp and https://ramp.com/intelligence: release history and AI catalogue.
17. https://www.cpapracticeadvisor.com/2026/10/20/bill-unveils-new-agentic-capabilities-for-finance-teams/192079/: BILL's October 2026 agent releases.
18. https://www.techrepublic.com/article/xero-jax-significant-updates/: Xero JAX receivables features.
19. https://www.zoho.com/books/pricing/: Zoho Books tiers.
20. https://www.numeric.io/pricing, https://www.rillet.com, https://campfire.ai, https://www.dualentry.com, https://light.inc: close and AI-ERP catalogues.
21. https://www.truewind.ai, https://www.maxima.ai, https://www.getbasis.ai: accounting-agent control patterns.
22. https://cfodive.com/news/ramp-expands-accounts-receivable-cfos-seek-faster-cash-flow-ai/830994 (22 Sep 2026): AR availability limits and market context.
23. https://www.stampli.com/blog/all/ramp-review/ (updated May 2026): Ramp complaints, curated by a competitor; treat with caution.