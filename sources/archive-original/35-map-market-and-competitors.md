# Reference map 6: the market, the competitors and whether the first job is right

Scope note (written 21 November 2026). This map consolidates four research documents, all read in full:

- **22**: `22-ramp-and-finance-platforms.md` (Ramp in depth; BILL, Brex, Numeric, Rillet, Basis, AI-native ERPs, finance agents, and what QuickBooks, Xero, NetSuite, Sage and Zoho ship for receivables).
- **23**: `23-receivables-competitors.md` (the direct receivables and collections vendors at every size, regional players, AI-native start-ups, the published evidence on manual-collections cost).
- **26**: `26-process-and-automation-giants.md` (Celonis and UiPath in depth; ServiceNow, Automation Anywhere, Pega, Appian, Camunda, IBM watsonx Orchestrate, Workato, Zapier, n8n, Make, Tines, Microsoft Copilot Studio).
- **27**: `27-more-companies-to-learn-from.md` (Rox, Numeric, Maisa, Basis, Lorikeet, HappyRobot, Relevance AI, Feishu/Lark aily, plus a map of about 55 other agent companies).

Nothing outside these four documents was used. Labels carried over from the documents: [Fact], [Vendor claim], [Unverified]; document 27 uses [F], [V], [A] (analyst estimate), [H] (headline only), [U] (unverified), [I] (inference), and those are kept where cited from 27. My own reasoning beyond the documents is marked [Inference]. All four source documents were written under an exhausted shared web budget; many competitor facts rest on vendor pages only, and several on headlines. Treat every competitor claim as a vendor claim unless marked otherwise.

Stack assumed throughout (from the brief): TypeScript, PostgreSQL with row-level security (every table carries `tenant_id`), one repository, rented models (Claude, Qwen) behind an internal gateway.

---

## Design decisions

The components below are in build order: the record of what happened comes first, then the case and its objects, then the policy and rules the agent obeys, then the trust and sending machinery, then cash matching, then orchestration, testing, measurement and the control page.

### 1. Object-centric event log (and what to take from process mining)

**Purpose.** Keep an immutable diary of everything that happens to every receivables object, linked to all the objects it touches, so that the audit trail, the customer timeline, the KPIs and the evaluation data all come from one structure. Receivables example: "Reminder 2 sent to Acme for invoices 1001 and 1005 at 09:14 by the collections agent under policy v7" is one event linked to the Customer, two Invoices and the Case.

**Design to implement.**
- Two layers, both from day one (document 26, "Why an event log differs from an ontology"):
  - The **ontology** (types, links, actions, permissions) is the contract agents work through.
  - The **event log** is append-only history.
- Table `event` (append-only; no UPDATE or DELETE granted to the application role):
  - `id` (uuid v7, time-ordered), `tenant_id`, `occurred_at` (source time), `recorded_at` (ingest time), `event_type` (enum, below), `actor_type` (`system` | `human` | `agent` | `ledger_sync` | `customer`), `actor_id`, `source` (`xero`, `quickbooks`, `email`, `whatsapp`, `ui`, `agent_run:<id>`), `payload` (jsonb, schema per type), `policy_version_id` (nullable), `decision_id` (nullable; links to the decision record in section 8), `idempotency_key` (unique per tenant, to stop duplicate ingestion).
- Table `event_object` (many-to-many): `event_id`, `object_type`, `object_id`, `role` (for example `subject`, `affected`, `context`). This is the "event-to-object" relation; one event can touch several invoices and a case.
- Object-to-object links live in the ontology tables (Invoice belongs to Customer; PromiseToPay covers Invoices), as in the Celonis OCDM.
- Starting event types, copied from document 26's master list: InvoiceCreated, InvoiceDue, ReminderSent, MessageReceived, PromiseMade, PromiseBroken, PaymentReceived, PaymentApplied, DisputeOpened, DisputeResolved, CreditLimitChanged. Add CasePaused, CaseResumed, DraftCreated, DraftApproved, DraftEdited, DraftRejected, PolicyPublished, AgentDisabled [Inference: needed by sections 2 to 15].
- Master-data objects (Customer, Contact) carry no events of their own beyond create/update audit, following the Celonis split between master-data and event-bearing objects.
- **Perspective** = a named, saved selection of object and event types that defines one process for analysis (for example `receivables_collections`), copied from Celonis perspectives. Version one needs one perspective.
- **Augmented attributes**: writable annotations (collector note, risk score, agent decision) stored as rows in `annotation(object_type, object_id, key, value, actor, created_at)` and also emitted as events, so they appear without any data reload (Celonis Knowledge Model).
- Failure behaviour: if an event cannot be written, the action that caused it must fail (write the event and the state change in the same database transaction). Ledger-sourced events are idempotent on `(tenant_id, source, source_record_id, event_type, source_version)`.
- What to take from process mining, in order of value [Inference drawn from document 26]:
  1. The product generates most events itself (reminders, replies, promises, matches), so there is no mining project.
  2. Throughput metrics come free: days from InvoiceDue to PaymentReceived, promise-kept rate, reminders per payment.
  3. Later, an onboarding diagnostic from 12 months of ledger history ("your DSO by customer") as a sales tool (document 26, "Adopt in version one, later, or never": process mining is *later*).
  4. Never a customer-run extractor and transformation pipeline.

**Copies.**
- Document 26, "Celonis, How it works underneath": object types, event types, object-to-object and event-to-object relationships; master-data objects without events; perspectives. https://docs.celonis.com/en/the-object-centric-data-model.html
- Document 26, "Why an event log differs from an ontology": build both; every state change is an immutable event linked to all objects. Same URL plus https://docs.celonis.com/en/process-intelligence-graph.html
- Document 26, "Where customer rules live": augmented attributes written without reload. https://docs.celonis.com/en/knowledge-models
- Document 26, "What to copy (master list)" item 1: the AR object and event list.
- Document 26, Celonis SAP actions: audit logs kept 12 months. https://docs.celonis.com/en/action-flows-terms-and-limitations.html (minimum retention for this product: 12 months; [Inference] default to 7 years for financial events because accounting records outlive that, an open question below).

**Left out, and why.** Celonis's extractor server and SQL transformation pipeline (the cost a mid-sized firm cannot bear, document 26). PQL or any proprietary query language (document 26: "Never"). Conformance checking against designed BPMN models (no designed model exists in a 300-person firm) [Inference]. Two generations of semantic layer (Celonis legacy Views versus new: pick one schema format early).

**Open questions.** Retention period for events by jurisdiction (Malaysian record-keeping rules are not in the documents). Whether ledger history is back-filled as events at onboarding or only from go-live.

### 2. One case per customer (with case management from the automation vendors)

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

### 3. Promise to pay as a stored record

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

### 4. The collections policy as an editable object

**Purpose.** Hold the company's collections rules as a structured, versioned, agent-facing document the finance head can read and edit, separate from any staff-facing policy PDF. Example: "Key accounts in their renewal month get no reminders after day 17; the account manager is told instead."

**Design to implement.**
- Table `policy` (one row per tenant and policy kind) and `policy_version` (immutable once published): `id`, `policy_id`, `version_no`, `status` (`draft` | `pending_approval` | `published` | `retired`), `sections` (jsonb), `created_by`, `approved_by`, `published_at`, `diff_from_previous` (jsonb), `source_document_id` (the uploaded original, if any).
- Sections (Ramp's editable areas, extended with Maisa's worker fields [Inference for the merge]):
  1. `timing`: pre-due offsets (default −7, −1 days) and post-due offsets (default 3, 10, 17, 24, 31 days overdue), maximum notices (default 5), quiet days.
  2. `dispute_handling`: what pauses chasing, which reason codes exist, who resolves.
  3. `escalation`: who is told when, after which notice, after a broken promise.
  4. `tone`: voice, language preference per customer, words never to use.
  5. `objective` and `expected_outcome` (Maisa): for example "collect without harming key accounts".
  6. `exceptions` and `controls` (Maisa): segments excluded, approval thresholds.
- Each section is split into **numbered clauses** with stable ids (`clause_id`), so decisions can cite the exact clause text and version (section 8).
- Hard numbers (offsets, thresholds, limits) live in typed fields or in decision tables (section 6), not in prose, so code can enforce them. Prose clauses are guidance for drafting only [Inference; document 22 notes Ramp's policy "is written guidance for the agent, not a rules engine", and document 26 says rules belong outside the prompt].
- Conversion from an uploaded document: the agent drafts a structured version, strips filler, and may not invent rules; anything it cannot map becomes an open question to the policy owner. Cap the source at about 10 pages / 10,000 words; images and hyperlinks are not read (Ramp limits).
- Publishing pipeline: draft → approval by a user with `policy.approve` → published. Every publish writes a change record with a diff and supports one-click rollback to a previous version (Maisa, Feishu aily).
- After a new version publishes, open cases are re-evaluated asynchronously within 24 hours (Ramp re-evaluates recent expenses within 24 hours).
- Default template: Ramp's cadence and five-notice stop.
- Agent proposes, human approves, approval becomes a rule: when a reviewer repeatedly approves the same treatment (for example "dispute reason 'missing PO' → pause 7 days"), the product proposes a new clause or decision-table row; once approved it applies deterministically to similar records (Numeric).

**Copies.**
- Document 22, "1.4 Policy capture" and "1.9 What to copy" items 1 and 10: structured agent-facing document, no invented rules, about 10 pages, asynchronous conversion, re-evaluation within 24 hours, separate from the employee PDF, versioned. https://support.ramp.com/policy-agent-overview
- Document 22, "1.5 Collections agent": default AR Collections Policy with timing, dispute handling, escalation guidance and tone; 3/10/17/24/31 days. https://support.ramp.com/ramp-ar-collections-agent
- Document 27, "B3 Maisa, What to copy" items 1 and 2: worker fields (objective, process knowledge, rules, controls, exceptions, expected outcome); version-controlled approval pipeline. https://maisa.ai/ ; https://maisa.ai/product
- Document 27, "B8 Feishu aily": change record with diff and one-click rollback on every publish. https://feishu.cn/content/article/7631864469689240764
- Document 27, "B2 Numeric, What to copy" item 1: approved treatment becomes a deterministic rule. https://www.numeric.io/product/ai-in-numeric

**Left out, and why.** Letting the model infer rules from user behaviour (Ramp found users approve more leniently than policy allows; document 22). A full rules engine language (document 26: use plain decision tables).

**Open questions.** How many policies per tenant (per entity? per customer segment?). Who in a 100-person firm holds `policy.approve` when the finance head is also the only collector.

### 5. Named rules for fees, discounts and tolerances

**Purpose.** Keep money-affecting allocation and charging rules as named, typed settings the code enforces and every report and agent can cite. Example: "Partial-payment tolerance RM 5: a payment short by RM 5 or less clears the invoice and books the difference to a write-off account."

**Design to implement.**
- Table `named_rule`: `id`, `tenant_id`, `rule_key`, `kind`, `params` (jsonb, schema per kind), `scope` (entity, customer segment, currency), `effective_from`, `effective_to`, `version_no`, `approved_by`, `status`.
- Kinds for version one, each copied from a named product:
  - `late_fee` and `interest` (Paidnice): rate or flat amount, grace days, cap, whether it is added to invoices or only mentioned.
  - `prompt_payment_discount` (Paidnice): percentage, days.
  - `partial_payment_tolerance` (Stripe): absolute and percentage threshold; treatment (credit or write-off account).
  - `uncollectible_after_days` (Stripe: 30, 60 or 90): marks invoices for human write-off review, never automatic write-off [Inference].
  - `card_retry_policy` (Stripe Smart Retries): only if a card gateway is connected; version two.
  - `allocation_order` (document 23 lists allocation order as hidden customer policy): oldest first, or as specified by remittance.
  - `credit_note_offset` (document 23): whether open credit notes net against overdue balance in reminders and in DSO.
- All arithmetic (fees, interest, discounts, tolerances, balances, ageing) is computed by code, never by the model (Numeric: models never compute the numbers).
- Every report figure and every agent action stores the `rule_key` and `version_no` it used, so "show the rule behind this number" works. Document 23 found no vendor that does this.
- Money-moving steps (applying a late fee, issuing a payment link, writing off) are locked functions the agent can call but cannot change (Lorikeet).

**Copies.**
- Document 23, "Paidnice, What to copy" item 1: late fees, interest and prompt-payment discounts as configurable rules. https://www.paidnice.com/pricing
- Document 23, "Stripe Invoicing and Billing": partial-payment tolerance, uncollectible after 30/60/90 days, retry policies by segment; "the founder's model should hold such tolerances as named rules". https://docs.stripe.com/invoicing/automatic-collection
- Document 23, "Does anyone model the company's own rules explicitly": no vendor exposes a versioned rule catalogue with "which rule produced this number".
- Document 27, "B2 Numeric": no model arithmetic. https://www.numeric.io/product/ai-in-numeric
- Document 27, "B5 Lorikeet": sensitive steps as code the agent can call but not change. https://www.lorikeetcx.ai/product/how-it-works

**Left out, and why.** Credit-card surcharging and interchange optimisation (HighRadius; needs payment licences, document 23). Automatic write-offs.

**Open questions.** Whether Malaysian law limits late-payment interest on B2B invoices (not in the documents). Whether fees should post back to the ledger in version one (document 26 says financial postings come later).

### 6. Decision tables (from the automation vendors)

**Purpose.** Hold "which action, on which channel, when" as an editable table finance staff can read and approve, so the model only chooses wording and handles replies. Example: row "days overdue 10 to 16, amount under RM 50,000, segment standard, no dispute → reminder 2 by email, auto-send allowed".

**Design to implement.**
- Table `decision_table` (versioned with the policy) and `decision_row`: `table_id`, `row_no` (priority order), conditions (`days_overdue_min`, `days_overdue_max`, `amount_min`, `amount_max`, `segment`, `dispute_status`, `has_open_promise`, `channel_consent`), outputs (`action_type`, `channel`, `template_id`, `autonomy` from section 7, `escalate_to_role`).
- Hit policy: **first match by `row_no`** (simple DMN "first" semantics) [Inference: DMN hit policies are not described in the documents; "first" is the simplest to explain]. No match → `needs_review`.
- Evaluation is pure code over the governed model's named conditions (Celonis filters as "business conditions": for example `eligible_for_reminder`).
- Validation at publish: overlapping rows flagged; gaps flagged; every output action must exist in the action registry.
- The agent receives the matched row id and its outputs as constraints; it may not choose a different action or channel.
- Next-best-action ranking (rules filter eligibility, a model ranks) is version two, once the event log holds enough outcomes (Pega CDH; document 26 "later").

**Copies.**
- Document 26, "Adopt in version one, later, or never": decision tables for dunning policy (days overdue × amount × segment × dispute status → action and channel), version one, as simple editable tables, not full DMN.
- Document 26, "UiPath Maestro": DMN business rules on the orchestration engine. https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions
- Document 26, "What these companies know" item 1: rules outside the prompt (Maestro, Camunda, Pega, Celonis). https://docs.camunda.io/docs/8.8/components/agentic-orchestration/ai-agents
- Document 26, "Celonis, Where customer rules live": filters as named business conditions; triggers on newly matching items. https://docs.celonis.com/en/knowledge-models
- Document 23, "Key findings" item 3: sequence logic, escalation steps and thresholds remain configured rules almost everywhere.

**Left out, and why.** Full DMN with FEEL expressions; Pega's rule language (document 26: "Never").

**Open questions.** Whether segments are customer-defined free text or a fixed list. How decision tables and prose policy clauses are shown together so the finance head sees one policy.

### 7. Action marking: allowed, needs approval, never allowed

**Purpose.** Give every action type an explicit permission state per agent and per scope, enforced by code before any call, so the agent cannot do what the company has not allowed. Example: "send pre-due reminder: allowed; send reminder 3: needs approval; agree a payment plan over 60 days: never allowed for the agent."

**Design to implement.**
- Table `action_type` (registry): `key` (for example `send_reminder`, `record_promise`, `pause_case`, `apply_late_fee`, `create_payment_link`, `write_back_note`, `propose_write_off`), `side_effect` (`none` | `internal` | `external_message` | `ledger_write` | `money`), `locked_function` (name of the code path), `input_schema`.
- Table `action_permission`: `tenant_id`, `agent_id`, `action_key`, `scope` (jsonb: entity, segment, amount band, channel), `state` (`allowed` | `requires_approval` | `never_allowed`), `approval_role`, `approval_granularity` (`once` | `for_case` | `for_session`, from NetSuite's approve once / for the session / deny), `updated_by`, `version_no`.
- Agents act under a human owner's permissions: the effective permission is the intersection of the agent's `action_permission` and the owner's role (NetSuite SuiteAgents run under the same roles as people; Feishu aily permissions equal the user's; Ramp for Agents gives each agent an owner).
- Enforcement point: one server-side `executeAction()` gate that checks permission, hard limits (section 8) and pre-send checks (section 10), writes the event, then calls the locked function. Models never get raw database or API credentials (Feishu: central credential custody).
- Autonomy ladder per playbook, displayed to the customer: L1 Assisted, L2 Copilot, L3 Autopilot (L4 self-improving left out). Relevance AI defines L1 to L4; Invoiced explains AI as Assist, Automate, Advise, Configure.
- Defaults for a new tenant [Inference, consistent with every source]: everything with `side_effect = external_message` past due, `ledger_write` or `money` is `requires_approval`; pre-due reminders `allowed`; write-off and credit-limit change `never_allowed` for agents.

**Copies.**
- Document 27, "B7 Relevance AI, What to copy" items 1 and 2: per-action states allowed / requires approval / never allowed; autonomy levels L1 to L4. https://relevanceai.com/
- Document 22, "6 What the ledgers ship" (NetSuite): agents under the same roles and permissions as people; approve once / for the rest of the chat / deny. https://itwire.com/guest-articles/company-news/suiteworld-keynote-netsuite-shows-the-mechanics-of-autonomous-suite
- Document 27, "B8 Feishu aily": permissions equal the invoking user's; central credential custody. https://feishu.cn/content/article/7631864469689240764
- Document 22, "1.9 What to copy" item 13: agent identity and owner. https://agents.ramp.com
- Document 23, "Invoiced (Flywire)": Assist / Automate / Advise / Configure. https://www.invoiced.com/pricing

**Left out, and why.** L4 "self-improving" autonomy (no source shows it safe for external finance messages) [Inference]. Per-tool permission scoping in MCP is required but Celonis does not document it (document 26), so there is no source to copy beyond the gate itself.

**Open questions.** Whether customers set permissions per agent or per playbook (Relevance AI uses per factory).

### 8. The trust pattern for finance agents

**Purpose.** Make every agent output a categorical, cited, versioned decision bounded by code limits, and raise autonomy only when measured agreement justifies it. Example: the agent proposes reminder 3 for Acme; the decision shows "needs review: customer replied yesterday asking for a statement (clause dispute_handling.2, policy v7)".

**Design to implement.**
- **Three outcomes, not confidence numbers.** Every agent decision returns `approve` (proceed within permission), `needs_review` (route to a human, with a reason) or `reject` (do not act, with a reason). Vague or missing policy yields `needs_review`. Do not store or show numeric LLM confidence (Ramp: it clusters at 70 to 80%). An `ask` variant of `needs_review` sends a clarifying question to the case owner instead of guessing (Truewind).
- Table `decision`: `id`, `tenant_id`, `agent_id`, `agent_version`, `model_id`, `case_id`, `action_key`, `outcome`, `reason_code`, `rationale` (short text), `cited_clauses` (array of `{policy_version_id, clause_id, quoted_text}`), `cited_rules` (named rules and decision-table rows with versions), `inputs_used` (ids of objects and events read), `hard_limit_hits`, `reviewer_user_id`, `reviewer_action` (`sent_unedited` | `edited_then_sent` | `rejected` | `overridden`), `edit_distance` (for drafts), `feedback` (thumbs up/down plus text), `created_at`, `resolved_at`.
- **Cited policy and version.** The UI shows the quoted clause text on hover (Ramp).
- **Hard limits above the model**, evaluated in code before and after the model call; the model cannot override them: amount ceilings, do-not-contact lists, legal-hold flags, maximum messages per customer per period, segment exclusions (Ramp guardrails; document 22 consolidated list item 8).
- **Staged autonomy per workflow:** suggestion mode (all drafts reviewed), then partial autonomy (auto-send for named segments or decision-table rows), then full autonomy for those rows. The boundary is set in the permissions of section 7, never by the model.
- **Agreement rate shown.** An agent-reviewer alignment report: percentage of drafts sent unedited, edited, rejected, by segment, row and policy version, over a rolling 30 days [Inference for the window]. Raising a row to auto-send requires the customer to see this figure first. Benchmarks buyers have seen: Ramp AP recommendations 90% accepted on 90,000, policy agent more than 65% of approvals autonomous [Vendor claim]; BILL publishes accuracy with its tested conditions.
- **Golden datasets labelled by experts**, not learned from reviewer behaviour; user-flagged errors are added to the eval set (Ramp).
- **Model policy:** start each task on the strongest model, step down per task once evals are stable (Ramp). Rented models with no retention (Ramp uses OpenAI with no retention).
- **Output as a reviewable work product:** the daily collections pack (who to chase, proposed message, evidence, approve/edit/skip) is the main screen (Basis workpapers; Numeric Prism/command centre).

**Copies.**
- Document 22, "Key findings" item 2 and "1.4": three outcomes, cited policy text and version, deterministic limits, workflow-set autonomy, suggestion → partial → full, overrides and feedback in audit log, expert-labelled golden sets. https://support.ramp.com/policy-agent-overview ; https://zenml.io/llmops-database/building-trustworthy-ai-agents-for-automated-expense-management
- Document 22, "1.9" items 6 to 12 and "7.3 How these products earn trust". Same URLs, plus https://ramp.com/leading-indicators/what-it-takes-to-build-ai-agents-at-scale
- Document 22, "2.1 BILL, What to copy" item 2: publish accuracy with the conditions it holds under. https://www.bill.com/product/ai
- Document 22, "5 Finance agents": Truewind asks instead of guessing; Maxima never posts without sign-off and is deterministic. https://www.truewind.ai ; https://www.maxima.ai
- Document 27, "B4 Basis" and "B2 Numeric": reviewable workpaper; command centre surfacing only judgement items. https://www.getbasis.ai/ ; https://www.numeric.io/product/ai-in-numeric

**Left out, and why.** Numeric confidence scores on agent decisions (Ramp's reason). Learning golden labels from reviewers (leniency bias). Billtrust's forecast confidence score is kept only for forecasts (a number with stated confidence), not for decisions.

**Open questions.** What agreement threshold should unlock auto-send (no document gives one). Who labels the golden set for a Malaysian customer: the founder, or the customer's finance head.

### 9. Separating automatic low-risk messages from reviewed high-risk ones

**Purpose.** Treat messages as two classes with separate autonomy settings, so harmless reminders go out on their own while anything that can damage a customer relationship is reviewed. Example: "Invoice 1001 is due in 7 days" goes automatically; "Your account is 24 days overdue and further supply may be held" waits for a human.

**Design to implement.**
- `message_class` on every outbound message: `pre_due` (before due date), `due_day`, `post_due_routine`, `post_due_escalation`, `reply` (answer to an inbound message), `dispute_response`.
- Defaults: `pre_due` and `due_day` → `allowed` (auto-send), pausable per invoice; all others → `requires_approval` (Ramp separates automatic pre-due reminders from drafted overdue collections).
- Inbound replies are classified (promise, dispute, request for statement or copy invoice, payment notification, other) and always produce a decision; automatic replies only for `request_copy_invoice` and `request_statement` once enabled [Inference: the lowest-risk replies].
- Approval queue for AI-drafted replies, with a path to auto-send by decision-table row once agreement is shown (Paidnice reply drafts awaiting approval; section 8).
- Sending identity: from the customer's own Gmail or Outlook mailbox with two-way sync; read only matching collection threads (Ramp, Upflow). WhatsApp is the main extra channel for the target segment (Peakflo is the only regional vendor with WhatsApp agents; document 23).
- Composer: full to/cc/bcc/attachments; nothing post-due is sent until a human clicks Send unless the row allows auto-send.

**Copies.**
- Document 22, "1.5" and "1.9" items 3 and 4: pre-due reminders at 7 and 1 days automatic and pausable per invoice; overdue drafts require a human click; read only collection threads; send from the customer's address. https://support.ramp.com/ramp-ar-collections-agent
- Document 22, "6": QuickBooks sends overdue reminders on a schedule the user approves once; Xero JAX sends prediction-based reminders automatically. https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US ; https://www.techrepublic.com/article/xero-jax-significant-updates/
- Document 23, "Paidnice" and "Upflow": reply drafts awaiting approval; two-way mailbox sync. https://www.paidnice.com/pricing ; https://upflow.io/pricing
- Document 23, "Esker": customer inquiry management (classify and route inbound customer emails). https://www.esker.com/solutions/order-to-cash/

**Left out, and why.** Autonomous post-due sending at launch: no leader does it and reputational damage with the customer's own clients is the risk that kills trust (document 22, "What cannot or should not be copied"). Outbound voice calling (Sidetrade, Emagia, Stuut, Peakflo) is version two at best (document 27: voice is a later add-on).

**Open questions.** WhatsApp Business API rules on template messages and consent are not covered by any document. Whether QuickBooks's "approve the schedule once" pattern counts as review for post-due messages.

### 10. Pre-send compliance checks and holdout measurement

**Purpose.** Check every outbound message against contact hours, frequency limits, consent and flags just before sending, and prove that the agent improves cash collection by comparing with a holdout group. Example: a reminder scheduled for 22:00 on a public holiday is held until 09:00 the next working day; 10% of eligible customers get the old process so uplift can be measured.

**Design to implement.**
- Pre-send check, run inside `executeAction()` for every external message, in this order; any failure blocks the send and records a reason:
  1. Case and customer flags: legal hold, do-not-contact, open dispute covering all invoices, open promise covering the invoices.
  2. Consent for the channel (`channel_consent` per contact and channel, with source and date).
  3. Contact hours in the recipient's time zone and the tenant's calendar of non-working days.
  4. Frequency limits: maximum messages per customer per day and per 7 days (defaults [Inference]: 1 per day, 3 per 7 days).
  5. Content checks: correct invoice numbers and amounts match the model (code-computed), no forbidden words from the tone section; plain-language eval rules (Relevance AI: "message cites the correct invoice number and amount"; "no threat language").
  6. Escalation flag: if the customer needs a person, route instead of sending (Lorikeet).
- Blocked sends are queued, never dropped, when the block is temporal (Make: "queue, don't drop").
- Holdout: at tenant go-live, a configurable share of eligible customers (default 10% [Inference]) is assigned to `holdout` per customer, stably by hash; they receive the tenant's previous process (or the native ledger reminders). Report DSO, days to pay, past-due percentage and collected cash for treated versus holdout (Lorikeet Dreamweaver measures uplift against a holdout; PayJoy figure was against a control group).
- Holdout assignment is stored and shown to the customer; it can be ended by the admin.

**Copies.**
- Document 27, "B5 Lorikeet, What to copy" item 2 and "What to copy (consolidated)" items 5 and 6: contact hours, frequency limits and consent checked before every message; escalation; holdout group. https://www.lorikeetcx.ai/product/dreamweaver
- Document 27, "B7 Relevance AI, What to copy" item 3: evals as plain-language rules scoring every task. https://relevanceai.com/
- Document 26, "Make": queue, don't drop when blocked. https://www.make.com/en/pricing
- Document 22, consolidated list item 8: do-not-contact lists, legal-hold flags, maximum messages per period. https://zenml.io/llmops-database/building-trustworthy-ai-agents-for-automated-expense-management

**Left out, and why.** TCPA-specific consent rules (US voice; document 27 mentions them for Rox). Holdout for very small tenants with fewer than about 50 overdue customers [Inference: the sample is too small to show anything].

**Open questions.** Malaysian PDPA and debt-collection messaging rules (document 27 says PDPA will matter more than SOC 2, but no document details them).

### 11. Cash matching design

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

### 12. Event-driven workflows calling governed agents

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

### 13. Replay of past runs as tests

**Purpose.** Re-run stored past runs against a new agent, model or policy version and compare the outputs before publishing, and simulate on historical data before a tenant goes live. Example: before publishing policy v8, replay last month's 400 reminder decisions and show the 12 whose outcome would change.

**Design to implement.**
- Store every run as a trace: `run(id, agent_id, agent_version, model_id, policy_version_id, inputs_snapshot (object versions and event ids), tool_calls, outputs, decision_id, cost)`. Keep traces in a training-ready format (Maisa) [Inference: JSONL export].
- Replay modes:
  1. **Deterministic replay** (Maisa): same inputs, same code, same model version → compare to stored output; for code steps a difference is a bug.
  2. **Candidate replay**: same inputs, new agent/model/policy version → diff report of outcome changes, cited clauses, and draft text changes.
  3. **Simulation before go-live** (Lorikeet): run the agent over the tenant's historical invoices and messages; show projected decisions and knowledge gaps; go live segment by segment (by customer segment or ageing bucket) only where simulation supports it.
- Publishing gate: a policy or agent version cannot be published while the golden set (section 8) fails above a tenant-set threshold [Inference for threshold].
- Replays and simulations are design-time and not billed to the customer (UiPath).

**Copies.**
- Document 27, "B3 Maisa, What to copy" items 3 and 5: deterministic re-execution as regression test; traces stored training-ready. https://maisa.ai/product ; https://maisa.ai/
- Document 27, "B5 Lorikeet, What to copy" item 4: simulate on historical tickets, then go live topic by topic. https://www.lorikeetcx.ai/product/how-it-works
- Document 22, "1.4 Evals": evals as unit tests, accountant-defined correct path, user-flagged errors into the set. https://ramp.com/leading-indicators/what-it-takes-to-build-ai-agents-at-scale
- Document 26, "UiPath": design-time and preview consumption separate and unbilled. https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md

**Left out, and why.** Owned small models trained from traces (Maisa claims savings only past about 100,000 runs a month; document 27 says irrelevant for the first years).

**Open questions.** Rented models are not bit-for-bit deterministic, so "deterministic replay" applies strictly only to code steps; for model steps the comparison must be on outcome class and cited clauses [Inference].

### 14. One KPI per agent with a baseline

**Purpose.** Tie every agent to one named KPI measured from a baseline taken before go-live, so value is provable and outcome pricing becomes possible later. Example: the reminder agent owns "past-due balance as % of AR", baseline 31% over the 90 days before go-live.

**Design to implement.**
- Table `kpi_definition` (the semantic layer, Celonis Knowledge Model): `key`, `formula` (SQL over governed views), `unit`, `grain`, `filters` (named conditions), `version_no`. Version-one KPIs (Celonis AR lists): aging buckets; top 10 customers by past due and by AR; DSO current and trend; average days past due; average days to pay; weighted average payment terms; disputes by status and reason; days to identify and resolve disputes; valid versus invalid disputes; promise-kept rate; unapplied cash; auto-match rate.
- Table `agent_kpi`: `agent_id`, `kpi_key`, `baseline_value`, `baseline_window` (default 90 days before go-live [Inference]), `baseline_computed_at`, `target`, `holdout_comparison` (section 10).
- Agent health page (Sidetrade health dashboard; ServiceNow Control Tower "Measure"): KPI versus baseline and holdout, runs, cost per run, cost per outcome, agreement rate, errors.
- Value attribution stored for audit: cash collected per reminder sequence (Celonis Transformation Hub).
- DSO definition is shown with its rule choices (credit notes netted? unapplied cash treated how? disputes excluded?), because no vendor shows the definition behind the figure (document 23).

**Copies.**
- Document 23, "HighRadius, What to copy" item 1 and "What to copy" item 1: one KPI per agent with a baseline; basis for outcome pricing. https://www.businesswire.com/news/home/20260227310299/en
- Document 26, "Celonis AR apps" and master list item 4: KPI lists. https://docs.celonis.com/en/accounts-receivable-capabilities.html ; https://docs.celonis.com/en/accounts-receivable-cash-app.html
- Document 26, master list items 13 and 17: cost and ROI per agent; value attribution. https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and ; https://www.celonis.com/news/article/finally-enterprise-ai-gets-the-context-it-needs-to-succeed-celonis-next-2026
- Document 27, "B7 Relevance AI" item 4: cost per outcome by version. https://relevanceai.com/
- Document 23, "Published evidence": measure baselines at each pilot rather than rely on vendor figures.

**Left out, and why.** HighRadius-style gain-share contracts at launch (document 23: needs measurement apparatus and legal agreement per customer; defer). Unverifiable headline claims.

**Open questions.** Which single KPI the cash-matching agent owns (auto-match rate or unapplied cash).

### 15. A central AI control page with a kill switch

**Purpose.** One admin page lists every agent and capability, its on/off state, autonomy level, owner, recent actions, cost and agreement rate, with a kill switch that stops all agent actions at once. Example: a wrong invoice amount appears in a draft; the finance head disables the reminder agent for all customers in one click and every pending auto-send is held.

**Design to implement.**
- Inventory: every agent, its owner, version, tools, permissions (section 7), KPI (section 14), cost this month, agreement rate (section 8), last 100 actions.
- Toggles: per capability on/off ("how much the AI does") and per playbook autonomy level.
- **Kill switch** at three scopes: tenant-wide, per agent, per channel. Implemented as a row checked inside `executeAction()` on every call (not a cache that can lag) [Inference]; on activation, all queued sends are moved to the human approval queue, running workflow instances pause, an AgentDisabled event is written, and admins are notified.
- Audit log of every AI action with who, what, why and which rule, filterable and exportable; minimum 12 months (Celonis), longer for financial events.
- Registry of approved MCP servers and outside clients that may call the model (ServiceNow MCP Registry).
- MCP and OpenAPI exposure of the governed model with OAuth, application keys for development, rate limit per client (Celonis: 500 calls per minute per asset) and per-tool permission scoping (which Celonis does not document).
- Governance features stay in the base product, not a paid tier, for the target segment [Inference; document 22 notes Ramp and BILL gate audit logs and roles behind paid tiers, which is a pricing lever the founder may choose to copy instead; see Pricing].

**Copies.**
- Document 22, "2.1 BILL, What to copy" item 1: AI governance hub with per-capability on/off, autonomy level and full log. https://www.bill.com/product/ai
- Document 22, "6" (NetSuite): SuiteAgent Management Workspace showing actions and data accessed, with a kill switch. https://itwire.com/guest-articles/company-news/suiteworld-keynote-netsuite-shows-the-mechanics-of-autonomous-suite
- Document 26, "ServiceNow, Copy": inventory of agents with cost and ROI; private MCP registry. https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and
- Document 26, "Celonis, Agent interface": OAuth, app keys, 500/min. https://developer.celonis.com/mcp-server-asset/overview/
- Document 27, "B3 Maisa": 24/7 monitoring with stop-and-escalate. https://maisa.ai/product

**Left out, and why.** Cross-vendor agent discovery (ServiceNow Discover; enterprise scale). Access provenance ("why can I see this record", Rox) is version two.

**Open questions.** Whether the kill switch should also block internal (read-only) agents, or only actions with side effects.

---

## Who needs this and why

**The buyer.** The documents agree on the buyer for receivables tools: CFOs, controllers, finance managers and AR managers (documents 22, 23). In the founder's 100 to 1,000 staff band, document 23 maps the buyer to "CFO/controller, AR manager, 3 to 15 collectors" for companies of roughly US$50M to US$500M revenue, and to "finance manager, 1 to 3 collectors" for US$5M to US$50M. Chaser's "+ Care" tier exists for firms with no collector at all (document 23). Document 23's chosen under-served buyer is the finance head of a B2B distributor, manufacturer, contractor or services firm in Malaysia or Southeast Asia, "who must explain aging and DSO to owners" [Inference in document 23].

**The pain, as the documents evidence it.** All figures are vendor-sponsored, with small or unstated samples (document 23's own verdict).
- Time: 40% of businesses spend 6+ hours a week on AR tasks; 76% spend 3+ (Chaser 2026 report, 163 validated responses, mainly UK and Australia) [Fact about the report]. BILL's survey reports 10 hours a week saved (document 22) [Vendor claim]. A Ramp AR customer said one late payment used to mean 20 to 30 emails [Vendor claim].
- Late payment and write-offs: 92% are typically paid late; 17.2% wait 31+ days; 23.1% write off 3 to 5% of revenue, 10% write off 6%+ (Chaser) [Fact about the report]. 86% have up to 30% of monthly invoiced sales overdue (PYMNTS citing Versapay, no sample size) [Fact about the article].
- Disputes: 27% spend at least half of AR team time on disputes (PYMNTS/Versapay, July 2025).
- Manual work: 35% of mid-sized firms fully manual; 75%+ of SMBs chase or handle disputes by email (same source).
- Barriers to buying: 96% of mid-sized firms face barriers to AR automation, cost first; 37% paused or scrapped projects over staff training time; 47% cite security (PYMNTS/Esker, August 2024).
- Demand signal: AR was "a top request" from Ramp's customers before Ramp shipped it (document 22, CFO Dive) [Fact]. Four AI-native AR start-ups raised about US$85M between late 2025 and 2026 (document 23), which shows investors believe the pain is real [Inference].

**What buyers pay for** (document 22, "7.1"): hours removed from recurring work, money found or protected (for AR: cash sooner, fewer write-offs), one platform, ledger sync that works, governance features. Document 27, Part C adds: an attributable outcome, control where money is involved, working inside existing systems, speed to production, peer proof.

**What the documents do not show.** No document gives Malaysian or Southeast Asian survey data on collections pain, WhatsApp usage in B2B collections, or local willingness to pay. The Southeast Asian under-service case rests on the *absence* of vendors found in two searches (document 23), not on buyer evidence. No document gives a clean "cost per collected invoice" or "hours per US$1M receivables" figure.

---

## The competitive map

Dates are the latest dates the documents give. "Ships" means the document read it on a vendor page, not that it was verified in use.

### By customer size and price

| Segment (document 23 bands) | Typical buyer | Who competes | What they ship for collections (with dates) | Price signal |
|---|---|---|---|---|
| Native floor, all sizes | Bookkeeper, finance manager | QuickBooks Online / IES; Xero; Zoho Books; Sage; Stripe | QuickBooks Payments AI (help article updated 5 Aug 2026, US): overdue reminders on a schedule approved once, editable message, late-fee suggestions, drafted emails, estimates from Gmail/Outlook. QBO (SG article): up to three automatic reminders up to 90 days before or after due date, only for emailed invoices; "Intuit Intelligence" sets reminders by prompt. Xero JAX (announced 3 Sep 2025, Australia first): payment prediction and automatic reminders based on it. Zoho Books: automated reminders and customer portal on the free plan. Sage Copilot drafts reminders [Unverified]. Stripe: Smart Retries (up to 8 in 2 weeks default), reminders, partial-payment tolerance, uncollectible at 30/60/90 days | Included in plan; Zoho US$0 to 275 per organisation per month; Stripe [Unverified] about 0.4 to 0.5% |
| Spend and finance platforms (US) | Controller, CFO | Ramp; BILL; Numeric; Mercury; Rillet, Campfire, DualEntry, Light | Ramp AR (22 Sep 2026): invoices from contracts, pre-due auto reminders, Collections agent (drafts only, email only, Gmail/Outlook), promise to pay, AI cash application; US-only, single-entity, QBO or NetSuite (waitlist). BILL: invoicing, reminders, auto-charge on all paid plans; no collections agent found; AI governance hub; agentic releases 20 Oct 2026. Numeric: Billing & Revenue with "collection automation"; Agent Builder whose example is chasing overdue invoices; MCP (no dates on pages). Mercury: simple invoicing [Unverified]. AI ERPs: AR invoicing, no collections agent | Ramp core AR free; Plus US$15/user/month + platform fee; AR add-on unpublished. BILL US$49/65/89 per user/month + US$0.59 ACH, 2.9% card. Numeric custom |
| Micro / SMB (< US$5M revenue) | Owner, bookkeeper | Paidnice, Chaser Compact, Kolleno Business Pay, Debtor Daddy, CreditorWatch Collect | Paidnice: reminders, late fees, discounts, portal, AI reply drafts awaiting approval, MCP server. Chaser: reminders from own mailbox, portal, SMS, calls. Kolleno: drafted templates, AI replies | Paidnice from US$69/month; Chaser Compact US$233 to 259/month; Kolleno US$545/user/month |
| Small mid-market (US$5M to 50M) | Finance manager, 1 to 3 collectors | Chaser Core/Complete, Upflow Starter/Grow/Scale, Kolleno Plus, Gaviti, Paidnice Custom, Peakflo, Centime | Upflow: Collections Agent and AP Portal Agent from Scale; Insights Agent on all plans; Smart Rules at Scale. Gaviti: AI emails, disputes, credit, cash app, agentic chat. Peakflo (SEA): AI voice, browser and WhatsApp agents; Jurnal, Xero, QBO, NetSuite, SAP B1 | Chaser US$700 to 1,050/month annual; "+ Care" US$2,149 to 2,799; Kolleno US$995/user/month (min 2); others quote-only |
| Upper mid-market (US$50M to 500M; roughly 100 to 1,000 staff) | CFO/controller, AR manager, 3 to 15 collectors | Upflow Accelerate/Enterprise, Tesorio, Growfin, Versapay, Quadient AR, Invoiced (Flywire), Bectran, plus AI-natives Stuut, Fazeshift, Monk, Paraglide | Tesorio: Collections Agent with promise extraction, Cash Application Agent, Supplier Portals Agent (27 Mar 2025), AI Chat and MCP. Upflow: Cash Application Agent at Accelerate. Growfin: NetSuite SuiteApp, behavioural AI. Versapay: collaborative portal with disputes. Stuut (Series A US$29.5M, 20 Nov 2025): SMS, email and voice agents, disputes and credits "coming soon", live in 3 to 4 days. Fazeshift (US$17M Series A, 7 May 2026): control layer tailored per customer. Monk (US$25M Series A, 21 Apr 2026): AI plus deterministic payment logic. Paraglide (US$5M seed, 27 Jan 2026): two-way billing conversations, Chargebee | Quote-only; [Inference in document 23] tens of thousands of dollars a year; Quadient about US$500/month start per an aggregator |
| Enterprise (> US$500M, shared services) | CFO, GBS head, credit director | HighRadius, Billtrust, Esker, Sidetrade, Emagia, Serrala, BlackLine | HighRadius: 60+ AR agents (190+ total), outcome pricing from 27 Feb 2026. Sidetrade: Aimie Agents (page 1 Apr 2026), Agent Builder Studio, outbound calling. Billtrust: agentic collections, Claude/Copilot connection. Emagia: inbox and calling agents. BlackLine Invoice-to-Cash [Unverified] | Multi-module contracts; HighRadius US$0 until go-live, then a share of gains |
| Process and automation platforms | Automation CoE, IT, finance ops | Celonis; UiPath; ServiceNow; Pega; Microsoft Copilot Studio; IBM watsonx Orchestrate; Zapier, Make, n8n | Celonis: Collections, Disputes, Credit and Cash Application execution apps on SAP; Orchestration Engine GA by Nov 2025; Agent Tools (MCP) private preview. ServiceNow: CRM specialist for invoice disputes, finance employee-service specialists (May 2026). Copilot Studio: no AR model. Zapier/Make/n8n: generic automation | Celonis unpublished; IBM from US$578/month; Zapier from US$19.99/month; n8n from €20/month |
| Adjacent agents that could add collections | Ops, CX leaders | Lorikeet Dreamweaver; HappyRobot; WIZ.AI (SEA voice); Feishu/Lark Base AI and aily; Genspark AgentBase | HappyRobot (US$150M Series C, 4 Aug 2026) lists payment collections for freight. Lorikeet Dreamweaver: outbound agent "one configuration away" from a collect goal. Base AI (19 Mar 2026) can build a receivables tracker by prompt | Lorikeet from US$2,100/month + US$0.99 per resolution; Feishu AI points |

### Region

- **US and UK mid-market**: the most crowded (Upflow, Tesorio, Growfin, Versapay plus four AI-natives, all claiming 30 to 40% DSO cuts and deployment in days; document 23).
- **Australia, New Zealand, UK small firms**: Xero JAX native, Paidnice, Debtor Daddy, CreditorWatch Collect, Chaser.
- **Southeast Asia**: Peakflo is the only regional AR platform found with WhatsApp and voice agents (customers Carousell, Ninja Van, Hitachi, Pickupp; pricing custom). WIZ.AI does voice in SEA. Feishu/Lark is a substitute channel.
- **Malaysia**: no dedicated B2B AR collections product found; search results were consumer debt-collection tools for digital lenders (document 23, two searches only).
- **Gulf**: Levers dunning on Wafeq (no AI, 2024); ClearGrid and InDebted are consumer collectors.

### What every competitor already ships (the standard function list)

Document 23: dunning sequences, prioritised worklist, cash application, dispute/deduction handling, credit decisions, customer payment portal, cash forecasting; spreading fast: AP-portal agents, inbound-email reading for promises, outbound voice, MCP connectors. Document 23 also says the AI itself is narrow (drafting, classifying replies, extracting remittances, scoring, choosing whom to chase, timing retries) and the sequence logic remains rules almost everywhere.

### Where nobody is found (the claimed gaps)

- A versioned rule catalogue with "which rule produced this number" (document 23: not found; Sidetrade nearest, undocumented).
- Internal analyst and external outreach running on one governed model of definitions, rules and permissions (document 23: Tesorio, Upflow, Sidetrade, Billtrust have both faces as separate features; "a thin" differentiation others could claim within a year).
- WhatsApp outside Peakflo; local Malaysian and Indonesian accounting systems outside Peakflo's Jurnal (document 23).
- Autonomous post-due messaging governed by measured agreement (document 22; but see Contradictions on QuickBooks and Xero).
- Multi-entity at Ramp (single-entity only).

---

## Is receivables the right first job?

**The case for, from the documents.**
1. The outcome is measurable within weeks and is cash: DSO, past-due percentage, cash collected (document 23 verdict; document 27, Part C: "receivables has the most attributable outcome in finance").
2. The rules are concrete and exactly what a governed model is for: allocation, credit notes, disputes, who may agree an extension (document 23).
3. Both faces share the same objects: the AR report and "why is DSO up?" internally, reminders and replies externally (document 23).
4. Errors are expensive, so "show the rule" is a real selling point to a finance head (document 23).
5. Demand is proven: Ramp built it because customers asked; four AI-natives were funded; every incumbent markets agentic collections (documents 22, 23).
6. The documented enterprise concepts (event log, rules, cases, governance) are not packaged for 100 to 1,000 staff firms on accounting APIs (document 26 conclusion).
7. Horizontal agent platforms are narrowing to single functions to sell (Relevance AI), which supports picking one job (document 27).

**The case against, from the documents.**
1. It is crowded at every price point and the crowding moved to AI agents in 2025 and 2026 (document 23, key finding 1).
2. The native floor is free and rising: QuickBooks drafts and schedules overdue reminders; Xero predicts and sends; Zoho gives reminders free; Ramp gives a collections agent free to 85,000 US customers (document 22). Document 22: "below about 300 staff, collections reminders are effectively free" [Inference].
3. The founder's exact band (upper mid-market) is where vendors are most numerous and prices least transparent (document 23).
4. The architectural differentiation is thin and copyable within a year (document 23).
5. Peakflo already serves the region with WhatsApp and voice, so channels are not a moat (document 23).
6. Mid-sized buyers stall on cost and training time (PYMNTS/Esker).
7. Autonomous external messaging, the strongest differentiator, is also the main risk (document 22).

**Under-served segments the documents identify.**
- Document 23: B2B distributors, manufacturers, contractors and services firms of 100 to 1,000 staff in Malaysia and wider Southeast Asia (secondarily the Gulf), on Xero, QuickBooks, Business Central, NetSuite or local systems; several entities; customers replying on WhatsApp in English, Malay or Chinese; frequent partial payments and bank transfers without references; a finance head who must explain aging and DSO.
- Document 22, "7.4 Fits": markets Ramp does not serve; multi-entity and multi-ledger groups; collections that need context outside the finance tool (CRM owner, tickets, contracts, "never chase a key account in its renewal month"); a governed DSO definition shared by reports and agent; graduated autonomy for external messages.
- Document 23, Bectran lesson: in construction supply and distribution, credit limits, holds and liens are half the job.
- Document 26: none of the big platforms serves the band for finance agents.

**Verdict.** Receivables is the right first job **as a proof of the architecture**, and the wrong first job **as a product category to win head-on**. As "another AI collections agent" for US or UK companies it loses: Ramp gives it away, ledgers bundle it, and four funded start-ups and Upflow, Tesorio and Growfin are already there. It is right only if all of these conditions hold:

1. **Region and segment:** Malaysia first (then Southeast Asia), B2B firms with real collections pain (distribution, manufacturing, contracting, services), 100 to 1,000 staff, often multi-entity. Not US SaaS.
2. **Ledgers the incumbents do not cover:** at least one local accounting system plus Xero or QuickBooks. Which local systems matter is unverified (document 23 names AutoCount and SQL Accounting as [Inference]; document 27 marks the Malaysian ERP list unverified). Pick by the first customers, not market share (document 27).
3. **The governed model is visible in the product:** the rule behind every number and every message, named rules, policy versions, agreement rates. If the product only drafts emails, it is a commodity.
4. **WhatsApp plus email from day one**, with the pre-send checks of section 10, because that is where the region's buyers reply. It is not a moat (Peakflo), only a requirement.
5. **Win on price against Peakflo and on speed against enterprise suites**: published prices and a deployment promise in days or a few weeks.
6. **Pilot evidence comes from the customer's own baselines and a holdout**, because the published evidence is weak and none is Malaysian.
7. **Validate demand before building past version one.** The documents contain no buyer evidence from Malaysia; the segment choice rests on absence of competitors, which can also mean absence of demand [Inference].

If condition 7 fails (for example, Malaysian finance heads say WhatsApp reminders from the ledger are enough), the founder should keep the governed-model core and move to one of the jobs below.

---

## Other first jobs the documents point to

The documents were not written to find an alternative job, and **none of them shows a universal back-office job that is clearly less crowded than receivables**. What they do show, with the evidence:

| Candidate job | Evidence of crowding or space | Assessment |
|---|---|---|
| Accounts payable and spend | Ramp (free, AP agents with 90% acceptance), BILL (500,000+ businesses), Brex in Capital One, Airbase in Paylocity, Rippling, Light's Bill Agent (document 22) | More crowded than AR, subsidised by card interchange. Not a first job. |
| Month-end close and reconciliation | Numeric, FloQast, BlackLine, Basis, Truewind, Maxima, Rillet, Campfire, DualEntry (documents 22, 27) | Crowded and well funded (Basis at US$1.15B). Not a first job. |
| Customer support | Fin at US$0.99 per outcome, Lorikeet, Decagon and Sierra (covered elsewhere) (document 27) | Very crowded with low published prices. |
| Dispute and deduction handling | 27% of firms spend half of AR time on disputes (PYMNTS/Versapay); covered by HighRadius, Esker, Gaviti, Versapay, Celonis Disputes app; Stuut lists disputes as "coming soon" (Nov 2025) (documents 23, 26) | Painful and less mature at the mid-market AI-natives, but it is a module of receivables, not a separate job. Best treated as the first expansion inside AR [Inference]. |
| Credit management (applications, limits, holds) | Bectran (credit-first, construction supply and distribution), Gaviti, HighRadius, Celonis Credit app; Stuut lists credits "coming soon" (document 23) | Few mid-market AI-native players; tied to collections in distribution. A candidate second job for the distribution segment [Inference]. |
| Inbound billing questions (copy invoice, statement, "what is this charge?") | Paraglide (seed, Europe), Esker customer inquiry management (enterprise), ServiceNow CRM specialist for invoice disputes (documents 23, 26) | Thinly served in the mid-market; low-risk to automate; naturally part of the external face [Inference]. |
| Governed finance questions and reporting (the internal face) | NetSuite Ask Oracle shows reports and assumptions; Numeric MCP; Tesorio AI Chat; Ramp AI reporting; none uses a company-defined metric layer (documents 22, 23) | The founder's real differentiator but hard to sell alone: buyers pay for outcomes (document 27, Part C), and a "questions" product has no attributable outcome [Inference]. |
| Vendor onboarding and tax-form collection | BILL W-9 agent (US-specific); Ramp vendor compliance (document 22); Maisa withholding-tax reconciliation (document 27) | US-specific in the documents; no Malaysian evidence. |
| Vertical back-office flows (freight calls, healthcare intake) | HappyRobot, Tennr, Assort (document 27) | Not universal; already funded verticals. |

Blunt reading: the documents point back to receivables, narrowed, with disputes, billing questions and credit as the expansion path inside it, rather than to a different first job. Any claim that another job is less crowded would go beyond the evidence [Inference].

---

## Threats, partners and channels

**Threats, ranked for a Malaysia-first receivables product** [Inference for the ranking, combining documents 22, 23, 26, 27]:
1. **Peakflo**: in region, WhatsApp, voice and browser agents, local ERP (Jurnal), named regional customers. The founder must win on explainable rules, local accounting-system depth and price (document 23).
2. **Native ledger features**: Xero (JAX auto-reminders; Xero dominance in SMB ledgers in the region is [Inference] in document 22), QuickBooks Payments AI and Intelligence (US article; the SG reminder article shows QBO in the region), Zoho Books free reminders. They set the "free" floor.
3. **Suite-native do-it-yourself**: Feishu/Lark Base AI plus aily, DingTalk/QwenWork, Genspark AgentBase, Microsoft Copilot Studio (already licensed in many firms). Defence: governed semantics and measured cash results (document 27, Part D; document 26).
4. **Numeric**, if the founder ever sells to US or venture-backed firms (document 27 ranks it the top threat; weak in SEA).
5. **Ramp**, if it leaves the US or adds multi-entity, SMS or auto-send (none announced; document 22).
6. **Funded AI-natives** (Stuut, Fazeshift, Monk, Paraglide) moving into Asia; none mentions the region today (document 23).
7. **Outbound agents one configuration away from collections**: Lorikeet Dreamweaver, HappyRobot, WIZ.AI (document 27).
8. **Platform dependency risk**: Celonis versus SAP shows an ERP vendor can make data extraction harder; keep connectors thin and replaceable, with a customer-owned export path (document 26).

**Partners and suppliers.**
- Ledgers as integrations, not competitors to replace: read AR from Zoho, Xero, QuickBooks, NetSuite or Ramp, write payments and notes back (document 22 positioning).
- AI-native ERPs (Rillet, Light, DualEntry, Campfire) as hosts: none ships a collections agent (document 22).
- Payment gateways for payment links in reminders (Stripe or local gateways; document 27). Do not process payments yourself (document 23).
- Model suppliers: rented Claude and Qwen; Moonshot, Zhipu and MiniMax push prices down (document 27).
- Infrastructure: Supabase Team for a SOC 2 report; Clerk or WorkOS for SSO; DBOS or Temporal for durable execution (document 27, A8; file 14 cross-reference).
- Connectors for the long tail: Zapier MCP as a possible supplier (document 26).

**Channels.**
- **Accounting firms and outsourced bookkeepers** that run receivables for mid-sized clients could operate or resell the product (Basis sells to firms; document 22 notes firms as a channel; document 27 suggests Malaysian firms) [Inference for Malaysia].
- **Lark/Feishu app ecosystem**: ship the internal face as a Lark bot and use Lark identity and permissions (document 27, B8).
- **BPOs and collection agencies** for the human escalation tier a one-person company cannot staff (Parloa, Crescendo pattern; document 27).
- **Accounting-software app stores**: Xero's "debtor tracking" category hosts Chaser, Paidnice, Upflow, Kolleno and others (document 23); a Xero Malaysia listing is the analogue [Inference].
- **Microsoft Teams and Copilot via MCP** (document 26).
- **Design partners as investors** (HappyRobot's WALTER GROUP; document 27).
- Avoid a single bank-partner channel (Satago and Lloyds; document 23).

---

## Pricing

**What buyers pay, as the documents show it (November 2026 unless dated).**

| Product | Model | Price | Source |
|---|---|---|---|
| Ramp AR | Core free (interchange-funded); add-on for billing schedules, rev rec, Avalara | US$0; add-on unpublished; Plus US$15/user/month + undisclosed platform fee | Document 22, https://ramp.com/pricing |
| BILL | Per user plus per transaction | US$49 / 65 / 89 per user/month; ACH US$0.59 each side; card 2.9%; mailed invoice US$1.99 | Document 22, https://www.bill.com/product/pricing |
| Zoho Books | Per organisation | US$0 to 275 per month; extra users US$2.50 to 3 | Document 22 |
| QuickBooks, Xero | Included in plan | — | Documents 22, 23 |
| Paidnice | Per monthly invoice volume, monthly, no contract | From US$69 (150 invoices); Pro US$99 to 279 (300 to 1,000 invoices); Custom from US$389; extra entity US$29; fixed prices in USD, GBP, EUR, AUD, CAD, NZD, ZAR | Document 23 |
| Chaser | Per revenue band | Compact US$233 annual / 259 monthly; Core US$700 / 779; Complete US$1,050 / 1,169; + Care US$2,149 to 2,799 | Document 23 |
| Kolleno | Per user, minimum seats | US$545 and US$995 per user/month; Enterprise minimum 3 seats | Document 23 |
| Upflow | Per invoiced revenue and invoice volume; unlimited seats | Quote; payments add-on 3.5% + US$0.30 card, 0.8% ACH capped US$5, + US$390/month | Document 23 |
| Gaviti | Usage-based; unlimited users | Quote | Document 23 |
| Quadient AR | Invoice volume and modules | About US$500/month start (aggregator, unverified) | Document 23 |
| Tesorio, Growfin, Versapay, Invoiced, Peakflo, Stuut, Fazeshift, Monk, Paraglide, Numeric | Quote-only | [Inference in document 23] tens of thousands of dollars a year for the upper mid-market | Documents 22, 23, 27 |
| HighRadius | Outcome-based (from 27 Feb 2026) | US$0 implementation, US$0 until go-live, then undisclosed share of measured gains | Document 23 |
| Lorikeet (support, for comparison) | Plan fee + per outcome | Start US$2,100/month (annual, < 5,000 tickets); Scale US$5,100; US$0.99 / 0.90 per resolution; US$0.30 triage and QA; escalations free; FDE included; 30-day trial | Document 27 |
| Fin (support) | Per outcome | US$0.99 per outcome | Document 27 |
| Rox (sales agents) | Per agent action, unlimited seats | Individual US$100/month (10K actions); Teams US$255/month (15K) | Document 27 |
| IBM watsonx Orchestrate | Tier with MAU and message caps | Essentials from US$578/month; Standard from US$6,360/month | Document 26 |
| UiPath agents | Per LLM call by model tier | 0.16 / 0.2 / 0.4 Platform Units per call; 0.2 PU per run with own model; input in 64k-token increments; PU money value unpublished | Document 26 |
| Pega | Moving from tokens to per case (June 2026) | — | Document 26 |
| Zapier, n8n, Make | Per task, per execution, per credit | Zapier from US$19.99/month; n8n from €20/month; Make free 1,000 credits | Document 26 |

**How buyers pay, the patterns.**
1. **Free or bundled at the bottom.** Reminders come with the ledger or with Ramp; interchange subsidises free software (document 22). The founder has no card float to copy this.
2. **Revenue or invoice-volume bands with unlimited seats in the mid-market** (Upflow, Gaviti, Paidnice, Chaser) rather than seats (Kolleno is the exception and the expensive one).
3. **Top functions gated to top tiers**: cash application, rules engine, multi-entity, Salesforce sync at Upflow; governance features (audit log, roles, SSO) in paid tiers at Ramp and BILL (documents 22, 23).
4. **Quote-only in the founder's band**, which document 23 says is where prices are least transparent.
5. **Outcome pricing is spreading**: HighRadius gain-share, Lorikeet per resolution, Pega per case, Crescendo outcome guarantees (documents 23, 26, 27).
6. **Transaction fees where money moves** (BILL, Upflow Payments) need payment licences (document 23: integrate a gateway instead).
7. **Services bundled**: Chaser "+ Care" adds human credit control; Lorikeet includes a forward-deployed engineer at entry level (documents 23, 27).

**Implications for the founder's price** [Inference, combining the documents' own suggestions]:
- Publish prices (document 26: unpublished enterprise pricing is incompatible with self-serve mid-market sales; IBM and n8n show published entry prices with caps).
- Unlimited seats; price by active overdue customer accounts or invoices under management, and by entity count (documents 22, 23).
- A plan fee with an included volume band, plus a small per-outcome fee (invoice moved to paid, promise to pay recorded, payment plan agreed), with hand-offs free (document 27, Lorikeet translated).
- Document 22 suggests "a platform fee of a few hundred to a few thousand dollars a month"; the published comparables for the band run from Chaser Core US$700 to Lorikeet Start US$2,100 per month.
- Local-currency fixed prices (Paidnice) for Malaysia.
- A "+ Care" style tier through an accounting-firm or BPO partner for firms with no collector (Chaser; document 27 channels).
- Meter model cost per run internally and never promise a fixed per-seat price that model costs could break (UiPath metering; Cursor lesson, document 27).
- Defer gain-share until baselines and holdouts are routine (document 23).

---

## Function checklist

| Function | Who offers it | Version | Reason |
|---|---|---|---|
| One active case per customer, daily rebuild, two statuses, pause/resume | Ramp | v1 | Core of collections; section 2 |
| Stop after N notices and hand to human | Ramp | v1 | Safety default |
| Promise to pay as a record that pauses chasing | Ramp, Tesorio, Bectran, Celonis | v1 | Section 3 |
| Promise extraction from inbound messages | Tesorio, Sidetrade | v1 (proposed, reviewed) | Main reading task for the model |
| Broken-promise escalation | Tesorio | v1 | Section 3 |
| Payment plans with instalments | Paidnice (Pro) | v2 | More complex evaluation |
| Editable, versioned collections policy with sections | Ramp | v1 | Section 4 |
| Policy conversion from uploaded document, no invented rules | Ramp | v1 | Onboarding speed |
| Change record with diff and rollback | Feishu aily, Maisa, Relevance AI | v1 | Section 4 |
| Approved treatment becomes deterministic rule | Numeric | v1 (proposal only) | Section 4 |
| Named rules: late fees, interest, discounts | Paidnice, Invoiced | v1 (computed, mention only); posting v2 | Section 5 |
| Partial-payment tolerance; uncollectible after N days | Stripe | v1 | Section 5 |
| Card Smart Retries | Stripe | v2 | Only with a card gateway |
| Decision tables for dunning | UiPath Maestro, Camunda (DMN) | v1 (simple) | Section 6 |
| Next-best-action ranking | Pega CDH | v2 | Needs outcome data |
| Allowed / requires approval / never allowed per action | Relevance AI | v1 | Section 7 |
| Autonomy levels per playbook | Relevance AI, Invoiced | v1 (L1 to L3) | Section 7 |
| Agents under owner's permissions; credential custody | NetSuite, Feishu, Ramp for Agents | v1 | Section 7 |
| Approve once / for session / deny | NetSuite | v1 | Section 7 |
| Three-class outcomes with cited clause and version | Ramp | v1 | Section 8 |
| Hard limits above the model | Ramp, Maxima | v1 | Section 8 |
| Agent-reviewer alignment report | Ramp | v1 | Section 8 |
| Ask instead of guess | Truewind | v1 | Section 8 |
| Expert-labelled golden sets | Ramp | v1 | Section 8 |
| Daily review pack / command centre | Basis, Numeric Prism | v1 | Main screen |
| Pre-due automatic reminders | Ramp, QuickBooks, Xero, Zoho | v1 | Section 9 |
| Post-due drafts with human send | Ramp, Paidnice | v1 | Section 9 |
| Auto-send post-due by segment after agreement | None found (Xero auto-reminders closest) | v2 | Main differentiator and main risk |
| Send from own mailbox, read only collection threads | Ramp, Upflow, Chaser | v1 | Section 9 |
| WhatsApp channel | Peakflo | v1 | Required for target region |
| SMS | Upflow, Paidnice, Kolleno, Stuut | v2 | Lower priority than WhatsApp [Inference] |
| Outbound voice calling | Sidetrade, Emagia, Stuut, Peakflo, HappyRobot | v2 or never | Later add-on per document 27 |
| Letters | Upflow | Never | Not relevant [Inference] |
| Inbound reply classification and routing | Esker, Sidetrade, Paraglide | v1 | Section 9 |
| Pre-send checks: hours, frequency, consent, escalation | Lorikeet | v1 | Section 10 |
| Holdout measurement | Lorikeet | v1 | Section 10 |
| Cash matching exact then combination then suggestion | Ramp, Numeric, Celonis | v1 (suggested-only default) | Section 11; see Contradictions |
| Automatic cash posting per entity | Ramp, Upflow (top tier), Tesorio | v2 | After agreement shown |
| Remittance extraction from PDFs and emails | Tesorio, HighRadius | v1 | LLM reading task |
| Lockbox, BAI2, MT940 | HighRadius | Never for segment | US and enterprise |
| Dispute capture with reason codes | Celonis, Gaviti, Versapay, HighRadius | v1 (case-level) | Section 2 |
| Customer portal with line-level disputes | Versapay, Gaviti | v2 | Bigger build |
| Credit applications, limits, order holds | Bectran, Gaviti, HighRadius, Celonis | v2 | Second job for distribution |
| AP-portal invoice submission agents | Tesorio, Upflow, Monk, HighRadius | v2 | Enterprise buyers' portals; unclear in Malaysia |
| Payment links in reminders | Stripe, Paidnice, Kolleno | v1 via gateway | Conversion lever (document 27) |
| Payment processing by the product | Upflow Payments, Tesorio Pay, Billtrust | Never | Licences and risk teams |
| Cash forecasting with confidence | Billtrust, Tesorio, Chaser Complete | v2 | Needs history |
| Invoice creation from contracts | Ramp, Numeric | Never in v1 | Ledger's job |
| Revenue recognition, billing schedules | Ramp add-on, Numeric | Never | Scope trap |
| Object-centric event log | Celonis | v1 | Section 1 |
| Semantic layer of KPIs and named conditions | Celonis | v1 | Section 14 |
| AR KPI set (aging, DSO, days to pay, disputes) | Celonis | v1 | Section 14 |
| Show the rule behind a number | None found | v1 | Core differentiator |
| Process mining over ledger history | Celonis, UiPath | v2 (onboarding diagnostic) | Sales tool |
| Event-driven workflows calling governed agents | Sidetrade, UiPath Maestro, Camunda, Celonis OE | v1 | Section 12 |
| Named error handlers; queue, don't drop | Make | v1 | Section 12 |
| Live instance pause, resume, retry | UiPath Maestro | v1 | Section 2 |
| Customer-authored BPMN | Camunda, UiPath | Never | Finance teams will not author it |
| Replay past runs as tests; simulation before go-live | Maisa, Lorikeet | v1 | Section 13 |
| One KPI per agent with baseline | HighRadius | v1 | Section 14 |
| Agent health dashboard with cost | Sidetrade, ServiceNow | v1 (thin) | Section 14 |
| Cost metering per run and call | UiPath, Copilot Studio, n8n | v1 (internal) | Margin control |
| AI governance hub with toggles and log | BILL | v1 | Section 15 |
| Kill switch | NetSuite | v1 | Section 15 |
| MCP server over the governed model | Tesorio, Paidnice, Numeric, Billtrust, Celonis | v1 (read) / v2 (write) | Customers' own assistants |
| Private MCP registry | ServiceNow | v2 | Enterprise need |
| Access provenance ("why can I see this") | Rox | v2 | Useful, not urgent |
| Internal face as chat bot in Lark or Teams | Feishu, Microsoft | v1 (Lark) | Channel |
| Insights / analyst agent | Upflow, Tesorio, Sidetrade | v1 (through governed metrics) | Internal face |
| Setup "Coach" agent | Lorikeet | v2 | Replaces forward-deployed work at scale |
| Software plus human service tier | Chaser + Care | v2 via partner | Firms with no collector |
| Outcome-based pricing | HighRadius, Lorikeet, Pega | v1 (small per-outcome fee); gain-share never in v1 | Pricing section |
| Owned small model from traces | Maisa | Never before about 100K runs/month | Document 27 |
| On-premise deployment | Maisa | Never | Not the segment |
| Card programme, interchange-funded free tier | Ramp, BILL | Never | No balance sheet |
| Cross-customer benchmarks | Ramp, Sidetrade | Never in early years | No data network |
| ERP or ledger replacement | Numeric, Rillet, Campfire, DualEntry, Light | Never | Scope trap |
| UI-scraping robots | UiPath, Automation Anywhere | Never | Target systems have APIs |

---

## Contradictions and corrections

1. **"No one sends overdue collections messages without review" is not quite true.** Document 22's key finding 9 and section 7.4 say no platform lets an agent send overdue collections messages on its own. The same document says QuickBooks Payments AI sends overdue reminders on a schedule the user approves once, and Xero JAX sends prediction-based reminders automatically. The correct statement: rule-scheduled or prediction-timed overdue *reminders* already go out automatically in the ledgers; what nobody ships is autonomous *judgement* messages (replies, dispute responses, escalations) gated by measured agreement. The differentiator is narrower than document 22 suggests.
2. **Cash matching in version one or later.** Document 26 places cash application as "later (second app)". Document 22 shows Ramp shipping AI cash application as core AR, and document 23 says cash application is the labour-heavy part that mid-market tools gate to top tiers, which is a reason to include it. This map resolves it as v1 deterministic matching in suggested-only mode, automatic posting v2 [Inference]. The founder should confirm with pilots, since bank-feed access in Malaysia is unresearched.
3. **Outcome pricing now or later.** Document 23 says defer gain-share; document 27 recommends a per-outcome fee from the start (Lorikeet model); document 26 lists per-case pricing as "later". These are compatible only if "outcome" means a small per-event fee (promise recorded, invoice paid), not a share of savings. Treated that way here.
4. **The founder's segment is defined by staff; the market defines it by revenue.** Vendors tier by invoiced revenue and invoice volume (Upflow, Chaser, Kolleno), not headcount (document 23). A 100-staff services firm and a 100-staff distributor can fall in different tiers. The founder should define the target by revenue band, invoice volume and entity count as well as staff [Inference].
5. **"Below about 300 staff, reminders are effectively free" versus the founder's band starting at 100.** Document 22's inference implies the lower third of the founder's band will compare the product with free ledger features; document 23 puts 100 to 1,000 staff in the upper mid-market. Both cannot be fully right; the founder should expect free-feature comparison below roughly 300 staff [Inference].
6. **Is the governed model a real differentiator?** Document 23 calls it real but thin (Sidetrade could claim it within a year). Document 27 calls Rox the closest architecture and Numeric the closest finance threat with the same "models never compute numbers" principle. Document 26 says Celonis already built the shape for SAP customers. Taken together, the *idea* is not unique; the *packaging for mid-sized firms on accounting APIs* is the only claimed gap.
7. **Is Numeric a teacher or the main threat?** Document 22 calls Numeric "an emerging competitor on collections for venture-backed SaaS"; document 27 ranks it the top threat. Both agree it is weak in Southeast Asia. Its collections depth was not read in either document.
8. **Ramp's MCP pattern versus the stack decision.** Ramp's MCP loads raw API data into SQLite and lets the model write SQL (document 22). That contradicts the founder's governed-metric principle; documents 22 and 26 both say expose governed metrics instead. Not to be copied.
9. **Model supplier.** Ramp's policy agent runs on OpenAI (document 22); the stack decision rents Claude and Qwen. No document says this matters; UiPath's tier table names Claude models in all three tiers (document 26). Not a real conflict, but evals must be run per chosen model [Inference].
10. **Determinism claims versus rented models.** Maisa promises "same input gives the same output" and Maxima stresses determinism (documents 22, 27). Rented LLMs do not guarantee this. Replay tests must compare outcomes and citations for model steps and require exact equality only for code steps (section 13) [Inference].
11. **Internal inconsistency in vendor claims.** HighRadius cites 1,100+ and 1,500+ customers and both "30 to 40%" and "3X" productivity on one page (document 23). Document 23's Chaser report summary says 300+ responses while the validated sample is 163. Treat these figures as marketing.
12. **Brex status.** Document 22 reports Capital One completed its acquisition of Brex (search-result titles; close dated about April 2026 by Sacra), but the pages were not opened. Do not cite as fact.
13. **Founder assumption that receivables is a "universal" back-office job.** It is universal, but the documents show the universal version is being given away by ledgers and Ramp. Only the regional, multi-entity, rule-heavy version is open (documents 22, 23).
14. **Document 27 cites the user's memory** (the founder already builds Lark bots) as a reason for the Lark channel. That is context, not research evidence.

---

## Gaps

| Item | Marked in | Importance |
|---|---|---|
| Malaysian B2B collections market: competitors, buyer pain, willingness to pay | Doc 23 (absence from two searches); doc 27 | High |
| Malaysian local accounting systems and their APIs (AutoCount, SQL Account, Bukku; Xero and QuickBooks share in Malaysia) | Doc 23 [Inference]; doc 27 unverified | High |
| Malaysian legal limits: PDPA, debt-collection messaging, late-payment interest | Doc 27 mentions PDPA only | High |
| WhatsApp Business rules for B2B reminders (templates, consent) | Not covered | High |
| Peakflo depth, pricing and Malaysian presence | Doc 23 (custom pricing, vendor claims only) | High |
| Bank feeds and local payment rails (DuitNow, FPX) for cash matching | Doc 22 "not researched" | High |
| Numeric collections depth, Agent Builder, funding | Docs 22, 27 | Medium |
| Xero native reminders and JAX availability outside Australia | Doc 23 (Xero help centre not read); doc 22 | Medium |
| Ramp trust post (original "How To Build Agents Users Can Trust") | Doc 22 (read via summary) | Medium |
| Sidetrade Agent Studio PDF: is the "governed O2C domain model" a real schema? | Doc 23 | Medium |
| Stuut and Fazeshift product docs; AgentCollect, Fullseam | Doc 23 | Medium |
| Reviews and complaints for most AR vendors | Doc 23 (only Tesorio G2 found) | Medium |
| Ramp AR add-on and Plus platform fee prices; Ramp developer API webhooks | Doc 22 | Low |
| BlackLine Invoice-to-Cash, Serrala, Quadient AR, Satago | Docs 22, 23 | Low |
| Celonis collections priority formula; Agent Tools per-tool permissions | Doc 26 | Low |
| Lorikeet funding and workflow authoring format | Doc 27 | Low |
| UiPath Platform Unit money value; Copilot Studio credit pack prices | Doc 26 | Low |
| HappyRobot collections results and pricing | Doc 27 | Low |

**Research briefs for the high items.**

*Malaysian B2B collections market.* Establish whether 100 to 1,000 staff Malaysian B2B firms feel collections pain enough to pay, and who serves them today. Read: the Xero Malaysia app store listings in the "debtor tracking" category (the Australian equivalent is https://apps.xero.com/au/function/debtor-tracking, named in document 23); the app marketplaces and partner pages of Bukku, SQL Account and AutoCount; Peakflo's customer stories filtered to Malaysia (https://www.peakflo.co/); and any Malaysian SME late-payment survey from a bank, credit bureau or industry association. Then run five to ten interviews with finance heads in distribution, manufacturing and contracting, asking about hours per week on chasing, channels customers reply on, and what they pay now.

*Malaysian accounting systems and APIs.* For each of Xero, QuickBooks Online, AutoCount, SQL Account and Bukku, read the public developer documentation for: reading open invoices and customers, credit notes, payments, writing notes or payments back, webhooks, rate limits and authentication. Record which offer cloud APIs and which are desktop-only (which would need a sync agent). This decides the first connector, which document 27 says should follow the first customers.

*Malaysian legal limits.* Read the Personal Data Protection Act 2010 guidance from Malaysia's data protection commissioner on direct communication and consent, any Malaysian rules on debt-collection conduct (including whether they apply to B2B trade debts), and statutory or common-law limits on late-payment interest in B2B contracts. Output: a list of hard limits to encode in section 10's pre-send checks and section 5's named rules.

*WhatsApp Business rules.* Read Meta's WhatsApp Business Platform documentation on message templates, template categories (utility versus marketing), opt-in requirements, the 24-hour customer-service window and pricing per conversation in Malaysia. Output: which reminder classes can be sent as templates, what consent must be stored, and the per-message cost to feed pricing.

*Peakflo.* Read https://www.peakflo.co/ and https://www.peakflo.co/pricing in full, its WhatsApp and voice agent pages, help-centre documentation on collections workflows and approvals, and its listed ERP integrations. Establish whether it shows rules behind numbers, supports AutoCount or SQL Account, serves Malaysian customers, and what it charges. This is the decisive competitor for the verdict.

*Bank feeds and payment rails.* Read the developer or corporate-banking API pages of the main Malaysian banks for transaction feeds, plus documentation of DuitNow and FPX for payment links and reference fields carried with transfers. Output: whether automatic bank-feed cash matching is possible in version one or must start from uploaded statements, and whether payment links can carry invoice references to make matching exact.