# Approvals and action marking

**Layer:** [05-actions-and-rules](README.md) · **What it is:** Marking each action allowed / needs approval / never allowed, approval flows, and keeping money movement away from the model.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Other companies and products](#other-companies-and-products) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (4)

## Palantir

### 14. Approvals workflow

> Source: [general-references/04-palantir-security.md § 14. Approvals workflow](../../general-references/04-palantir-security.md#14-approvals-workflow)

**Plain English.** If you lack permission to make a change, you can request it. The right reviewers approve it, and the platform then applies it automatically.

**Technical detail.**
- **Request types:** group membership, Project access, Marking access, add reference, and Ontology proposal. Each task has its own eligible reviewers, for example Manage membership on a group, Project Owner, Manage permissions on a Marking, or Ontology Owner. [Fact] https://www.palantir.com/docs/foundry/approvals/overview/
- **Task states:** Review, Approved, Rejected (a rejection can be overridden while the request is open). **Request states:** Pending approval, Changes requested, Action required (for example a checkpoint is outstanding), Completed, Closed, Rejected and Closed. All tasks must be approved before the change is invoked. Reviewers can complete checkpoints on the requester's behalf. Members of large groups (50 or more) do not get reviewer notifications. Completed requests remain as a record. [Fact] same URL.
- **AI-generated changes:** Palantir MCP has no destructive write tools. Ontology changes go through Ontology proposals, which need human approval to merge. [Fact] https://www.palantir.com/docs/jp/foundry/palantir-mcp/security/ (Japanese-locale page, read in English summary)

## Other companies and products

### 7.3 How these products earn trust for automated actions

> Source: [general-references/22-ramp-and-finance-platforms.md § 7.3 How these products earn trust for automated actions](../../general-references/22-ramp-and-finance-platforms.md#73-how-these-products-earn-trust-for-automated-actions)

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

## Design decisions already in the reference maps

### 7. Action marking: allowed, needs approval, never allowed

> Source: [general-references/35-map-market-and-competitors.md § 7. Action marking: allowed, needs approval, never allowed](../../general-references/35-map-market-and-competitors.md#7-action-marking-allowed-needs-approval-never-allowed)

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

> Source: [general-references/35-map-market-and-competitors.md § 8. The trust pattern for finance agents](../../general-references/35-map-market-and-competitors.md#8-the-trust-pattern-for-finance-agents)

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

> Source: [general-references/35-map-market-and-competitors.md § 9. Separating automatic low-risk messages from reviewed high-risk ones](../../general-references/35-map-market-and-competitors.md#9-separating-automatic-low-risk-messages-from-reviewed-high-risk-ones)

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

### 6. Keeping payments away from the model

> Source: [general-references/34-map-agent-companies.md § 6. Keeping payments away from the model](../../general-references/34-map-agent-companies.md#6-keeping-payments-away-from-the-model)

**Purpose.** Let a debtor pay inside the conversation without the language model ever seeing card or bank details. Example: the reminder includes a pay-now link; the debtor pays RM 4,200; the agent sees only "paid, card ending 1234" and closes the case.

**Design to implement.**
- **Hard mode.** When a step involves payment capture, the model is removed from the loop: the dialogue follows a server-validated fixed sequence (`exact_text` steps), and capture happens on a processor-hosted page or embedded form that sends data straight to the processor. The agent receives only `status`, `amount`, `last4`, `processor_payment_id`.
- **Supported flows to model as tools:** one-off card or bank transfer link; payment plan / instalments (create schedule, e.g. three payments); autopay setup; card-on-file update; receipt in conversation. Each is a typed tool whose arguments never include card data.
- **Reconciliation:** processor webhook → payment record → case update → suppression of further touches (§8). [Inference on webhook flow; doc 19 describes isolation, not reconciliation.]
- **Generalise:** any step whose wording or data handling is regulated uses hard mode (doc 19 calls this a general pattern [Inference]).

**Copies.**
- doc 19 Key finding 6, §3 Secure mode, What to copy 7: PCI-isolated path, LLM out of the loop, fixed server-validated sequence, status and last four only, card/ACH, autopay, plans, card-on-file, receipts. https://sierra.ai/blog/payments
- doc 12, Sierra Agent OS: isolated PCI DSS Level 1 cluster [Vendor claim, secondary]. https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents
- doc 18 Key finding 8: SMS payment links, in-call payment, payment plans, hardship offers in Decagon's collections offer. https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution

**Left out, and why.** Running our own PCI zone (doc 19: use processor-hosted payment pages instead). Voice keypad capture (voice not first).

**Open questions.** Which processors serve Malaysian B2B payers (FPX, DuitNow are not mentioned in the documents) [Unverified gap]. Doc 19 names Stripe only as the example.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No research literature material in the research yet.
