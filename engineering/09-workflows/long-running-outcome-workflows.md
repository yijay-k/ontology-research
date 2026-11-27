# Long running outcome workflows

**Layer:** [09-workflows](README.md) · **What it is:** Work that plans toward an outcome over weeks: cases, suppression windows and audit.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Design decisions already in the reference maps

### 8. Long-running outreach: planning toward an outcome over weeks, suppression, audit

> Source: [general-references/34-map-agent-companies.md § 8. Long-running outreach: planning toward an outcome over weeks, suppression, audit](../../general-references/34-map-agent-companies.md#8-long-running-outreach-planning-toward-an-outcome-over-weeks-suppression-audit)

**Purpose.** Run a collections case as a goal pursued over days or weeks, re-planning when things change, not as a fixed drip sequence. Example: goal "balance paid or plan agreed"; the AP clerk promised payment on the 25th; on the 26th the ledger shows nothing, so the plan escalates to the finance manager by email, then WhatsApp, inside compliance rules.

**Design to implement.**
- **Case record.** `case(id, debtor_id, goal, status, personas[], guidance, plan jsonb, created_at, closed_reason)`; `case_event(case_id, at, type, actor, payload)` for touches, replies, promises, payments, disputes, handoffs, suppressions. The case is built as a procedure (§2), with a plain-language goal, named personas to engage (AP clerk, finance manager, CFO), optional guidance and no fixed steps.
- **Re-read before every action.** Before each touch: reload the ledger state for the case's invoices and the debtor's memory (§13); if the debtor paid, disputed or replied elsewhere, the plan adapts. This is the main defence against "we already paid" complaints.
- **Commitments drive scheduling.** A stated promise ("will pay on the 25th") becomes `promise(case_id, amount, due_on, source_message_id)`; the next touch is scheduled from it; a missed promise is a trigger.
- **Triggers** on signals: invoice due soon, overdue thresholds, promise missed, payment received, reply received, dispute opened. Outbound triggers come in as typed **events** `{event_type, description, payload}` posted by the ledger sync or scheduler (Meta's agent-events shape), processed asynchronously with a queryable status.
- **Next-action decision** within goals and guardrails: choose timing, channel and step; per-customer plan from payment history (consolidate invoices, timed reminders, switch channel email → SMS/WhatsApp). The proposed schedule can require human approval before it runs.
- **Suppression** before each touch: already in progress elsewhere (a staff member is handling it), opted out, no longer relevant (paid, disputed, written off). Record why anyone was suppressed.
- **Audit:** for every touch, store what triggered it, which decision chose it, the compliance evaluation (§7) and the outcome; for every suppression, the reason. Queryable per debtor ("who was contacted and why").
- **Human sign-off** rules declared in the case guidance (offers beyond policy, legal escalation).
- **Long waits:** a case may sleep for days; use a durable workflow engine with timers and retries rather than in-memory schedulers [Inference: doc 12 recommends Temporal or similar for ingestion; reused here].
- **Messaging control:** autonomous wording by default, with exact wording available for any step where needed.

**Copies.**
- doc 19 Key finding 5, §2E, What to copy 5–6: playbooks toward outcomes, triggers, suppression, omnichannel, Horizon Advisors for timing/channel/step, consent per channel, exact wording where needed, human sign-off guardrails, audit of triggers and suppressions. https://sierra.ai/product/horizon ; https://sierra.ai/blog/summit-recap-2026
- doc 18 Key finding 9, What to copy 12–13: Mission case, re-check memory before each action, wait days or weeks, built as an AOP; dated commitments drive the next touch; calls timed to stated paydays. https://decagon.ai/blog/missions ; https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution
- doc 20 §1.2B, What to copy 2: agent events `{type, description, payload}`, async, `accepted`. https://developers.facebook.com/documentation/meta-business-agent/capabilities
- doc 20 §10–11: human-approved reminder schedules (Intuit); per-customer plans with channel escalation (Xero). https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US ; https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/
- doc 20 §8, SAP's eight AR agents as the feature map: account analysis, collector prep, outreach email, dunning insights, dispute creation with duplicate and document checks, dispute resolution, clearing recommendations, orchestration. https://www.sap.com/use-cases/joule-assistant/accounts-receivable-ai

**Left out, and why.** Browser actions against portals without APIs (Decagon Browser Actions, Sierra/Anon): useful later for payer portals, not first. Decagon's own dialer and outbound voice (voice later).

**Open questions.** How to detect "in progress elsewhere" when staff email debtors from their own mailbox (requires live mailbox access, §1). How many concurrent personas per case before it annoys the debtor (no vendor figure).

### 2. One case per customer (with case management from the automation vendors)

> Source: [general-references/35-map-market-and-competitors.md § 2. One case per customer (with case management from the automation vendors)](../../general-references/35-map-market-and-competitors.md#2-one-case-per-customer-with-case-management-from-the-automation-vendors)

**Purpose.** Group every past-due invoice of a customer into one long-running case with a state, an owner and a history, because collections is exception-heavy work that a linear flow cannot specify in advance. Example: Acme has three overdue invoices, one disputed; the collector sees one case, not three reminder threads.

**Design to implement.**
- Table `collection_case`: `id`, `tenant_id`, `customer_id`, `entity_id` (legal entity; multi-entity is a target segment), `status` (`needs_attention` | `waiting_on_customer` | `paused` | `closed`), `pause_reason` (`promise_to_pay` | `dispute` | `manual` | `legal_hold` | `payment_plan`), `owner_user_id`, `overdue_invoice_ids` (derived, also via link table), `balance_overdue` (integer minor units), `max_days_overdue`, `notices_sent`, `last_customer_contact_at`, `last_update_at`, `opened_at`, `closed_at`, `policy_version_id`.
- Rule: **at most one active case per (tenant, customer, entity)**, enforced with a partial unique index `WHERE status <> 'closed'`.
- Rebuild: a daily job (and an on-event trigger on PaymentApplied, InvoiceDue and CreditNote events) recomputes membership from open past-due invoices. Ramp rebuilds daily; [Inference] also recompute on events so a payment closes a case the same day.
- A disputed invoice may split into its own sub-case (document 26 table: "one collections case per customer, or per invoice when disputed"). Implement as `dispute` objects attached to the case, each with its own status and owner, rather than a second case [Inference: keeps the one-case invariant].
- Controls per case: pause, resume, reassign, close. Every control is an action type with a permission (section 7) and an event (section 1).
- Case memory: agent short-term memory is scoped to the case (Camunda keeps conversational memory per process instance).
- Live supervision: pause, resume and retry the case's running workflow instance (UiPath Maestro).
- Stop rule: after the policy's maximum number of notices (Ramp: fifth notice), the case moves to `needs_attention` with `owner_user_id` required, and the agent stops drafting until a human acts.
- Collector screens (copy Celonis's four views): steering (AR due, DSO, collected, risky accounts), prioritised action list, customer detail (contacts, transactions, activities, scorecard, tasks), transaction detail (dispute, promise to pay, notes).
- Prioritisation score: inputs are payment history, disputes, last contact and credit exposure (Celonis inputs); unlike Celonis, the formula and each input's contribution are shown on screen.

**Copies.**
- Document 22, "1.5 Collections agent": one active case per customer, rebuilt daily; statuses "Needs attention" and "Waiting on customer"; pause/resume; stop after the fifth notice. https://support.ramp.com/ramp-ar-collections-agent
- Document 26, "UiPath, Function catalogue": Maestro Case for long-running, exception-heavy work; pause, resume, retry. https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions ; https://investingnews.com/uipath-reports-second-quarter-fiscal-2027-financial-results
- Document 26, "Camunda, Underneath": memory scoped to one process instance. https://docs.camunda.io/docs/8.8/components/agentic-orchestration/ai-agents
- Document 26, "Celonis, Accounts receivable apps": four collector views, prioritisation inputs, KPIs. https://docs.celonis.com/en/accounts-receivable-capabilities.html ; https://docs.celonis.com/en/getting-started-with-the-collections-execution-app.html
- Document 26, "Pega": agents act only inside a case whose stages and rules are deterministic. https://www.techtarget.com/enterprise-software/news/366643870/Pegasystems-refines-Blueprint-agent-builder-expands-marketing-tools

**Left out, and why.** A full BPMN or case-design canvas for customers (document 26: mid-sized finance teams will not author BPMN). Celonis's opaque priority formula. Pega's stage-and-step case-type designer [Inference: one fixed case type is enough for version one].

**Open questions.** Should a customer with several legal entities on the seller's side get one case per entity or one across entities? (Ramp is single-entity, so it gives no guidance.) What the owner assignment rule is when no collector exists (the Chaser "+ Care" segment).

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
