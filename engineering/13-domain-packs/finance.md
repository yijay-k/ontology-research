# Finance

**Layer:** [13-domain-packs](README.md) · **What it is:** Finance domain pack: candidate objects, workflows and deterministic rules.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Other companies and products](#other-companies-and-products) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Other companies and products

### 6. What the ledgers ship natively for receivables and collections

> Source: [general-references/22-ramp-and-finance-platforms.md § 6. What the ledgers ship natively for receivables and collections](../../general-references/22-ramp-and-finance-platforms.md#6-what-the-ledgers-ship-natively-for-receivables-and-collections)

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

## Earlier engineering notes (Phase 2)

### Finance and receivables domain pack — research brief

> Source: former `13-domain-packs/finance/README.md` (moved here in the Nov 2026 restructure)

#### Candidate core objects

LegalEntity, Customer, Supplier, Invoice, InvoiceLine, CreditNote, Payment, PaymentAllocation, BankTransaction, PurchaseOrder, Receipt, Dispute, Reminder, PromiseToPay, CollectionCase, LedgerEntry, TaxCode, Currency, Approval, PaymentInstruction and ReconciliationRun.

#### Candidate workflows

Invoice ingestion and validation; customer/account matching; cash application; partial payment allocation; dispute handling; collection scheduling; promise-to-pay tracking; approval for credit/refund/payment; bank reconciliation; month-end close.

#### High-value deterministic rules

- Exact match and tolerance thresholds for cash allocation.
- No double allocation of a bank transaction.
- Currency and rounding policies.
- Invoice status transitions and credit-note effects.
- Collection cadence, communication windows and stop conditions.
- Approval thresholds and separation of duties.
- Promise-to-pay due dates and missed-promise escalation.

The original archive contains deeper competitor and pricing research on Ramp, BILL, Upflow, Stripe and receivables vendors. Keep those business/product findings separate from the technical platform conclusions. Vendor workflow examples are useful design inputs, not universal accounting rules.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No research literature material in the research yet.
