# Receivables baseline

**Layer:** [13-domain-packs](README.md) · **What it is:** The original receivables/collections domain model and the evidence behind it.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Other companies and products](#other-companies-and-products) (4) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Other companies and products

### 1.5 Ramp Accounts Receivable in detail (the direct overlap with the founder)

> Source: [general-references/22-ramp-and-finance-platforms.md § 1.5 Ramp Accounts Receivable in detail (the direct overlap with the founder)](../../general-references/22-ramp-and-finance-platforms.md#15-ramp-accounts-receivable-in-detail-the-direct-overlap-with-the-founder)

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

### Common vocabulary for a newcomer

> Source: [general-references/23-receivables-competitors.md § Common vocabulary for a newcomer](../../general-references/23-receivables-competitors.md#common-vocabulary-for-a-newcomer)

- **Dunning sequence:** a scheduled series of reminders. Example: email 7 days before due, on the due date, then SMS at +7 days, a call task at +14, a statement at +30.
- **Collector worklist:** a ranked to-do list telling a human (or agent) which customers to chase today.
- **Cash application (cash app):** matching a received payment to the invoices it pays. Example: a customer pays 41,800 for invoices 1001, 1002 and 1005 minus a 200 short-pay; cash app must find that combination and post it to the ERP.
- **Deduction / short-pay / dispute:** the customer paid less, or refuses to pay, citing damage, pricing, promotions or missing proof of delivery.
- **Credit management:** deciding whether to give a customer credit and how much, and putting orders on hold when they exceed it.
- **EIPP / customer portal:** a web page where the buyer sees invoices, pays, downloads statements and raises disputes.
- **AP portal:** the buyer's own procurement portal (Coupa, Ariba, Tungsten) where the seller must upload invoices to get paid.
- **DSO (days sales outstanding):** roughly receivables divided by daily sales. Lower means cash comes in faster.

### Receivables, collections and invoice chasing: who ships what (the section that matters most)

> Source: [general-references/20-big-platform-agents.md § Receivables, collections and invoice chasing: who ships what (the section that matters most)](../../general-references/20-big-platform-agents.md#receivables-collections-and-invoice-chasing-who-ships-what-the-section-that-matters-most)

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

### Does anyone model the company's own rules explicitly and show the rule behind a number?

> Source: [general-references/23-receivables-competitors.md § Does anyone model the company's own rules explicitly and show the rule behind a number?](../../general-references/23-receivables-competitors.md#does-anyone-model-the-companys-own-rules-explicitly-and-show-the-rule-behind-a-number)

- **Partly:** Sidetrade (agents built on "governed O2C domain models", audit trails, escalation policies; not documented publicly). Upflow's Smart Rules engine (Scale tier; not documented on the page). Stripe's partial-payment tolerance and uncollectible-after-N-days settings are explicit rules but narrow. Paidnice treats late fees, interest and prompt-payment discounts as configured policies. Monk says it pairs AI with deterministic systems for payments. Fazeshift says it tailors to each customer's process. [Fact/Vendor claim, URLs above]
- **Not found:** any vendor that exposes a versioned rule catalogue (allocation, credit notes, disputes, permissions) and, for a given report number or agent action, shows which rule produced it. [Fact: not found in pages read; Unverified as a universal absence]

## Design decisions already in the reference maps

### 3. Promise to pay as a stored record

> Source: [general-references/35-map-market-and-competitors.md § 3. Promise to pay as a stored record](../../general-references/35-map-market-and-competitors.md#3-promise-to-pay-as-a-stored-record)

**Purpose.** Turn "we'll pay on Friday" into a structured object that pauses chasing, is checked automatically, and escalates when broken. Example: the customer replies on WhatsApp promising RM 12,000 for invoices 1001 and 1002 by 28 November; the case pauses until 29 November.

**Design to implement.**
- Table `promise_to_pay`: `id`, `tenant_id`, `case_id`, `customer_id`, `invoice_ids` (link table), `amount` (integer minor units, > 0), `currency`, `promised_date` (≥ today at creation), `promised_by_contact_id`, `source` (`email` | `whatsapp` | `call_note` | `portal` | `manual`), `source_message_id`, `extracted_by` (`agent` | `human`), `confirmed_by_user_id` (nullable), `status` (`open` | `kept` | `partially_kept` | `broken` | `cancelled`), `grace_days` (from policy), `created_at`, `resolved_at`.
- Creation paths: (a) a human uses "Record promise to pay" (Ramp); (b) the agent extracts it from an inbound message (Tesorio, Sidetrade) and proposes it as a decision with outcome `needs_review` unless the policy allows auto-acceptance for that segment.
- Effect: creating an `open` promise sets the case to `paused` with `pause_reason = promise_to_pay` and suppresses post-due drafts for the covered invoices.
- Evaluation job (daily, and on PaymentApplied): if payments applied to covered invoices ≥ amount by `promised_date + grace_days`, set `kept`; if some but less, `partially_kept`; if none, `broken`. Emit PromiseKept or PromiseBroken; a broken promise resumes the case at `needs_attention` and follows the policy's escalation section.
- KPI: promise-kept rate (document 26 adds it to the Celonis KPI list as an inference).
- Who may accept a promise beyond policy limits (for example a date more than 30 days out) is a permission, not a prompt instruction (section 7) [Inference].

**Copies.**
- Document 22, "1.5 Collections agent": "Record promise to pay" takes invoices, a date and an amount, and pauses the sequence. https://support.ramp.com/ramp-ar-collections-agent
- Document 23, "Tesorio": promise extraction from inbound email as a structured object with escalation when broken. https://www.tesorio.com/
- Document 23, "Bectran": promise-to-pay tracking in collections. https://www.bectran.com/
- Document 26, Celonis Transaction Detail View: collectors set promises to pay on the invoice. https://docs.celonis.com/en/accounts-receivable-capabilities.html

**Left out, and why.** Payment-plan schedules with instalments are a separate object for version two (Paidnice offers payment plans on Pro); version one supports only single-date promises [Inference: keeps evaluation simple].

**Open questions.** Default grace days. Whether a partial payment against a promise should split the promise or mark it partially kept.

### 11. Cash matching design

> Source: [general-references/35-map-market-and-competitors.md § 11. Cash matching design](../../general-references/35-map-market-and-competitors.md#11-cash-matching-design)

**Purpose.** Match incoming bank payments to the invoices they pay, using exact rules first and explained suggestions second, with a per-entity switch for automatic posting and reason codes when a human rejects a suggestion. Example: RM 41,800 arrives from Acme; no single invoice matches, but invoices 1001 + 1002 + 1005 minus a RM 200 short-pay do within tolerance.

**Design to implement.**
- Pipeline, in order:
  1. Ingest bank transactions from connected accounts; exclude reversals, returns, chargebacks, NSF and refunds.
  2. Identify customer (remittance reference, payer name, bank account mapping, prior matches).
  3. **Exact single-invoice match**: same customer, same currency, same entity as the receiving account, amount equals open balance.
  4. **Exact combination** of the same customer's open invoices (subset-sum bounded: at most N invoices, default 10 [Inference], oldest first, timeout 2 s [Inference]).
  5. Tolerance match using the `partial_payment_tolerance` named rule (section 5).
  6. **Suggestion** with "Why" reasons (reference matched, amount equals combination, payer previously paid these invoices), produced by code plus an LLM only for reading unstructured remittance emails and PDFs (Monk: LLM for language, deterministic systems for payments; Tesorio cash application agent reads lockbox PDFs and remittance emails).
- Constraints: same customer, currency and entity; unapplied remainders stay on the payment (Ramp).
- Mode per entity: `automatic_and_suggested` or `suggested_only`; default `suggested_only` [Inference].
- Accepting a suggestion auto-rejects competing suggestions for the same payment. Suggestions cannot be edited before acceptance (edit means reject and match manually).
- Rejection requires a reason code: `wrong_customer`, `wrong_invoice`, `other` (with text). Reason codes feed evals.
- Every match is an event (PaymentApplied) with the rule or suggestion id; write-back to the ledger only after acceptance, wrapped in a transaction with rollback where the ledger API allows (Celonis begin/end transaction pattern) [Inference: accounting APIs differ].
- KPIs (Celonis cash app): unapplied cash, manual versus auto-cleared invoices, percentage auto-cleared by entity, automation rate, average time to apply cash.

**Copies.**
- Document 22, "1.5 Cash application" and "1.9" item 5: filter list, matching order, constraints, per-entity modes, auto-reject competitors, reason codes, unapplied remainders. https://support.ramp.com/ramp-ar-cash-application
- Document 23, "Monk" and "What to copy" item 11: deterministic matching and posting, LLM only for language. https://pulse2.com/monk-25-million-series-a-raised-to-automate-accounts-receivable-with-ai/
- Document 23, "Tesorio": unstructured remittance reading. https://www.tesorio.com/
- Document 26, "Celonis AR Cash Application App": grouping, validation, KPI list. https://docs.celonis.com/en/accounts-receivable-cash-app.html
- Document 27, "B2 Numeric": rules on any field plus AI-suggested matches. https://www.numeric.io/pricing

**Left out, and why.** "Mark paid off-platform" as an irreversible non-syncing action (Ramp's design is a known trap). Lockbox and BAI2/MT940 file ingestion (HighRadius; US and enterprise) for version one.

**Open questions.** How bank feeds are obtained in Malaysia (no document covers bank APIs, DuitNow or FPX; document 22 says local rails were not researched). Whether cash matching is version one or a second app (see Contradictions).

## Earlier engineering notes (Phase 2)

### 4. Original receivables domain model (the baseline, not a mandatory forever choice)

> Source: former `01-reference-architecture/original-research-architecture.md` (moved here in the Nov 2026 restructure)

The original maps use receivables/collections to make the platform concrete. The core model includes Customer/Debtor, Contact, Invoice, Payment, PromiseToPay, Dispute, Case, CollectionPolicy, DunningStep/Touch, CollectorAssignment, bank transaction/remittance and an object-centric event history.

Its first valuable workflow is not “chat with invoices”. It is a governed daily collections operation:

1. Bring invoice, payment and customer state in from accounting/bank sources.
2. Resolve identity and calculate balances/ageing deterministically.
3. Build one current case per debtor/customer, with explicit pause/resume and stop conditions.
4. Record payment promises and disputes as first-class objects.
5. Apply versioned collection policies and decision tables.
6. Draft or send only the message classes allowed by risk/consent policy; require approval for judgment-heavy or high-impact responses.
7. Record delivery, replies, broken promises, payment matching and resulting state changes.
8. Measure a small number of outcome KPIs (for example overdue balance, promise kept/broken, cash collected and DSO movement) against a baseline.
9. Replay previous runs as regression cases and expose a central control page/kill switch.

Map 6 records both the case **for** receivables and the case **against** it, including free incumbent reminders and crowded competitors. It is a research-backed first-job hypothesis, not a conclusion that the market is automatically attractive.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No research literature material in the research yet.
