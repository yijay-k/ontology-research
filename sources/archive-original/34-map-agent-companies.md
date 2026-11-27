# Reference map 5: what to copy from Sierra, Decagon, Glean, Harvey and the big platforms

Scope note (written 21 November 2026). This is a build reference for a coding agent. It consolidates five research documents, read in full: `12-agent-companies.md` (doc 12: Sierra, Harvey, Decagon, Fin, Glean, Ramp, Hebbia, Distyl, 11x and others), `18-decagon.md` (doc 18), `19-sierra.md` (doc 19), `20-big-platform-agents.md` (doc 20: Meta, Salesforce, Microsoft, Google, Amazon, ServiceNow, Workday, SAP, Oracle, Intuit, Xero, plus OpenAI, Anthropic and Alibaba) and `21-glean.md` (doc 21: Glean and rivals, including Onyx code). No web pages were opened for this map. Labels carried over from the documents keep their meaning: [Fact] checked on a primary source or code, [Vendor claim], [Analyst], [Competitor claim], [Unverified]. Anything I reason beyond the documents is marked [Inference]. The product being built: a company model (objects, links, metric definitions, rules, permissions, actions) that internal and external agents work through; first job receivables and collections for companies of 100 to 1,000 staff; TypeScript, PostgreSQL with row-level security (RLS), one repository, rented models (Claude, Qwen).

Receivables vocabulary used in examples: debtor (the customer company that owes money), contact (a person at the debtor), invoice, payment, promise-to-pay (PTP), dispute, case (one collections effort on one debtor), touch (one outbound message).

---

## Design decisions

The order below is build order: data and permissions first, then the procedure artifact and its runtime guards, then outbound machinery, then the quality and release loop, then commercial and deployment mechanics, then the competitive map.

### 1. Permission-mirroring connectors and the enterprise graph

**Purpose.** Pull records and their access rules from the customer's systems so every agent sees only what the person (or the agent's own role) may see, and so facts are linked into a graph the agent can walk. Example: a credit controller in the Malaysia team asks "which of my debtors are over 60 days?" and gets only debtors the ledger lets her see; the external reminder agent sees only the one debtor it is writing to.

**Design to implement.**
- **Principals table loaded before records.** Tables `principal_user(id, tenant_id, email, source_ids jsonb)`, `principal_group(id, tenant_id, source, source_group_id)`, `group_membership(group_id, user_id)`. Group IDs are namespaced by source (`xero:finance`, `slack:finance`) so groups from two systems never collide. A sync that returns a group without memberships is rejected as inconsistent. Identity sync runs before content sync on every cycle, so no record ACL can reference an unknown principal.
- **ACL on every record, groups kept as groups.** Column `acl jsonb` with three forms: `allowed_users[]`, `allowed_groups[]`, `allowed_group_intersections[]` (each entry a set of groups; the user must belong to every group in one set, e.g. Finance AND Malaysia). Never flatten groups to user lists. Enforce with a PostgreSQL RLS policy that evaluates the current principal (set per transaction via `set_config('app.principal', ...)`) against `acl`. [Inference: RLS as the enforcement point; the ACL shape is copied.]
- **Fail closed.** If a connector cannot determine a record's access, store `acl = {}` (private to nobody but system service roles). Never default to "all users". Test harnesses refuse `allow_anonymous` and `allow_all_users` shortcuts.
- **Access mode per source.** Each connector declares `mode: indexed | live | hybrid`. Ledger, CRM and payment records are `indexed` (synced into Postgres). Mailboxes and chat are `live` (fetched at request time with the user's own credential). Hybrid merges both through the same permission filter. A fourth path, `tool`, exists for actions and makes nothing searchable.
- **Query-time re-check for complex sharing.** Where the source has rules too complex to mirror (CRM sharing rules), store a coarse ACL and, before returning content to the model, ask the source which record IDs the user can access; cache the user-ID lookup for 1 hour (Onyx's figure). Records with unknown access are dropped.
- **Two enforcement points.** Filter in the query (RLS), then re-check each item against the stored policy immediately before content goes into a model prompt, because indexes and caches may lag. Unauthorised items behave as if they do not exist. No admin bypass for agent reads. Derived artifacts (a generated aging report, a conversation) inherit the union of scopes of every source they used and keep them even after a source is detached.
- **Per-user credentials on tool calls.** Every connector call made on behalf of a staff member uses that person's credential so the source's own ACLs apply. Resolve the effective tool set once per turn: advertised ∩ reviewed by us ∩ tenant admin setting ∩ user setting ∩ user selection. Single-use refresh tokens are written back with a conditional update (compare-and-swap on the old token) instead of a lock.
- **Two retrieval identities.** Internal agents act "as the user". External, customer-facing agents read through a **knowledge profile**: an admin-defined bounded corpus (approved templates, policies, plus the one debtor's account records), the same for every viewer, which overrides any staff member's view. Profiles exclude staff email and calendar.
- **Agent as its own principal** for scheduled work (the nightly reminder run): `agent_principal(id, owner_user_id, service_credentials per system, scopes)`. Each run logs the triggering event or user. Write tools stay behind human approval until promoted. A pause/unpublish switch exists per agent.
- **Typed, authored graph with provenance.** Objects and links are declared in the company model (Debtor → Invoice → Payment; Debtor → Contact; Debtor → Account owner). Every edge row carries `source_system, source_record_id, observed_at, confidence, acl`. Facts carry effective dates and versions; amendments add a new version rather than overwrite. Every read tool returns record IDs so a later action operates on the same invoice. Entity resolution must refuse to merge look-alikes (two "ABC Trading Sdn Bhd" entities with different registration numbers stay separate). [Inference: the authored rather than inferred graph is the founder's thesis; edge metadata is copied from Glean, versioned facts from Hebbia.]
- **Sync jobs.** Separate permission-sync and group-sync jobs per source, each with its own schedule (Onyx defaults: 5 minutes for chat and Drive groups, 30 minutes for wiki and ticket tools), checkpointed and resumable after timeout. Failures keep the last known policy. Users are matched by email; an unmatched person on an inclusionary rule stays excluded.
- **Negative permission tests as a release gate.** For every connector and agent, a fixture identity that must not see a named record; the test asserts absence.

**Copies.**
- doc 21, §3.2 Permission mirroring: three ACL forms, identity-before-content, `InconsistentDataError`, negative tests and refusal of public shortcuts. https://developers.glean.com/libraries/indexing-sdk/permissions
- doc 21, §3.1 Connectors and key finding 3: five data types per connector; indexed/live/hybrid modes; tools path makes nothing searchable; "test search as restricted users before enabling agents". https://docs.glean.com/connectors/connectors-power-glean ; https://docs.glean.com/connectors/about
- doc 21, key finding 4 and §7 item 4: knowledge profiles for external agents. https://docs.glean.com/administration/managing-agents/knowledge-profiles
- doc 21, key finding 5: independent agents as principals with service credentials and approval on writes. https://docs.glean.com/agents/independent-agents
- doc 21, R7 Onyx: fail-closed `ExternalAccess.empty()`, source-namespaced group IDs, sync intervals, Salesforce query-time censoring with 1-hour cache. https://github.com/onyx-dot-app/onyx
- doc 21, §3.3: provenance, confidence, ACL and timestamps on each edge. https://glean.com/blog/knowledge-graph-agentic-engine
- doc 12, Harvey ethical walls: filter before ranking then re-check before model; derived artifacts inherit scopes; nonexistent-looking denials; no admin bypass; immutable content-hashed membership sets; last-known-policy on sync failure; email matching. https://www.harvey.ai/blog/building-ethical-wall-enforcement-into-harvey
- doc 12, Harvey connectors: per-user credentials, tool-set intersection, once-per-turn resolution, conditional write-backs. https://www.harvey.ai/blog/how-we-built-harvey-connector-library
- doc 12, Hebbia: versioned facts with effective dates, alias resolution that refuses look-alike merges, "say when access limits an answer". https://www.hebbia.com/blog/building-a-knowledge-graph-for-financial-institutions
- doc 20, §6 ServiceNow: return record IDs (`sysId`) from every read. https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html

**Left out, and why.** Glean's inferred, activity-based personal graph and corpus-wide NLP entity extraction (doc 21 calls them overkill at this size; the objects are known up front). 275 connectors (a collections product needs about 5 to 10 sources, doc 21 §8). Customer-hosted single-tenant deployments and Protect+ continuous scanning (doc 21 "Overkill"). Harvey's search index on Turbopuffer/LanceDB (stack decision is Postgres; see Contradictions).

**Open questions.** Which accounting systems the first customers use (Xero is "common among Malaysian SMEs" only as [Unverified] in doc 20). How live-mode credentials are granted for shared finance mailboxes (doc 21 covers per-user mail, not shared inboxes). Whether RLS performance holds with group-intersection checks at the record counts expected [Inference].

### 2. Capturing the customer's procedures, and the file format

**Purpose.** Hold the customer's way of collecting (when to remind, what to say, what needs approval, when a human takes over) in one versioned artifact that business staff can read and edit and engineers can test. Example: "Invoices 1 to 30 days overdue get a friendly reminder with a payment link; a dispute claim stops reminders and opens a dispute case."

**Design to implement.**
- **One artifact, three layers.** (1) Natural-language steps, (2) deterministic guard code for hard rules, (3) typed tool references. All three vendors studied converged on this (Sierra journeys, Decagon AOPs, Fin Procedures).
- **File format: one YAML (or JSON) document per procedure, stored in Git and mirrored in Postgres.** [Inference: the documents publish no syntax for journeys or AOPs; the field list below is assembled from Decagon's published components, Fin's block types and Harvey's playbook rule.] Fields:
  - `id`, `name`, `version`, `owner`, `off_limits_to_autopilot: bool`.
  - `entry_conditions`: structured predicates over the company model (`case.days_overdue between 1 and 30`, `debtor.status != 'disputed'`) plus an optional natural-language intent description used by the router.
  - `required_data`: fields each step needs (`invoice_id`, `contact_id`, `balance`).
  - `steps[]`, each typed: `instruction` (prose), `if` / `else` (condition block), `guard` (code check that must pass before the next step, e.g. `invoice.balance > 0 && !debtor.opted_out(channel)`), `tool_call` (reference to a registered tool by ID, never a free-form endpoint), `exact_text` (regulated wording emitted verbatim, bypassing the model), `escalate_when` (condition plus handoff target), `experiment` (variants, see §12), `success_criteria`.
  - `validation` on sensitive actions: which guards and approvals a write tool needs (e.g. a payment-plan offer above RM X requires a controller's approval) [Inference on the threshold example].
  - `references`: knowledge sources the procedure may cite.
  - `playbook_rules[]` for negotiable terms, using Harvey's shape: `standard_position`, `acceptable_deviations[]` (fallbacks), `unacceptable_deviations[]` (dealbreakers), `guidance`, `optional`. Example: standard = pay in full by due date; fallback = up to 3 instalments; dealbreaker = waiving principal.
- **Compile deterministically.** A compiler turns the document into the runtime representation (a typed step graph). The same artifact is edited in the UI and in the repository; round-trip must be lossless. Run a structural validator before any publish (every `tool_call` resolves to a granted tool, every branch terminates, every write has a guard).
- **Hard rules never live in prose.** `refund.allowed`-style rules are code guards evaluated before any write tool runs; the model cannot override them.
- **Separate from procedures:** a small set of global **guidelines** (tone, banned phrases, language) and **escalation intents** that apply in every procedure ("hardship or bereavement routes to a human", "never threaten legal action"). Versioned with procedures.
- **Router per message.** On each inbound message: extract intent over full history; select the procedure whose entry conditions match; if none matches, answer informational questions by retrieval only; anything that writes (PTP, plan, dispute) only through a procedure. Re-run on every message and log procedure switches.
- **Updatable starter packs.** Ship a "collections basics" pack (identity check, balance lookup, PTP capture, dispute capture, hardship route). Customer edits are stored as a separate layer so pack updates arrive as reviewable merges, never silent overwrites.
- **Capture sources:** SOP PDF, the written credit policy, past email threads with debtors, and historical decisions including exceptions (see §3 builder agent). Autonomy per rule moves from "recommend" to "decide" only when promoted.

**Copies.**
- doc 12, Key finding 1 and Cross-cutting (a): NL procedure + deterministic guardrails + typed tools. https://sierra.ai/blog/agent-development-life-cycle ; https://decagon.ai/product/aop ; https://fin.ai/procedures
- doc 18, §3.1 The AOP: name, entry conditions, steps, content blocks, references, tools, metadata, experiment blocks; per-step trigger, action, data needed, success criteria, escalation points, validation on sensitive actions; typed nodes and structural validator. https://decagon.ai/modules/aops ; https://decagon.ai/resources/from-sops-to-agent-operating-procedures ; https://decagon.ai/resources/aop-copilot
- doc 18, §3.2 Per-message runtime and Key finding 3: router re-run every message, informational vs state-changing split. https://decagon.ai/modules/decagon-platform ; https://decagon.ai/modules/knowledge-base
- doc 18, §2.3 Guidelines and Guardrails: global rules and escalation intents. https://decagon.ai/modules/customizations
- doc 12, Sierra journeys: declarative DSL compiling deterministically to SDK code with Git round-trip [Vendor claim, secondary]. https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents
- doc 12, Sierra Agent SDK: bypass the LLM to emit exact regulated language. https://sierra.ai/blog/meet-the-ai-agent-engineer
- doc 12, Fin Procedures: if/else branches, code for strict rules, escalation rules. https://fin.ai/procedures
- doc 12, Harvey playbooks: standard / acceptable / unacceptable / guidance / optional. https://www.harvey.ai/blog/rebuilding-playbook-review-as-a-multi-agent-system
- doc 12 and doc 19, Accelerators: updatable packs, customer edits tracked separately. https://sierra.ai/blog/accelerators
- doc 12, Ramp: policy PDF plus historical approvals with exceptions; autonomy from recommend to decide. https://ramp.com/blog/ramp-agents-announcement

**Left out, and why.** Meta's prose-only instructions plus phrase blocklist as the whole rules layer (doc 20 §1.8: no typed rules, approvals or metrics; collections needs typed rules). Harvey's orchestrator with one subagent per rule (useful for document review, not for a conversation; Sierra prefers one monolithic agent per customer, doc 12).

**Open questions.** Exact syntax of journeys and AOPs is unpublished (doc 12, doc 18), so the field list above is an assembly, not a copy of a spec. Whether to use YAML or a TypeScript DSL as the source of truth [Inference: YAML is easier for the builder agent to emit; doc 12 notes Ghostwriter needed tuning because Sierra's DSL is not in model training data, which argues for a format models already know].

### 3. The builder agent (documents and conversation to configuration)

**Purpose.** Turn what the customer already has (SOPs, credit policy, email history, a recorded conversation with the credit controller) into draft procedures, rules and tests, and later propose improvements, without ever shipping on its own. Example: the controller uploads the credit policy PDF and 2,000 past reminder threads; the builder drafts four procedures, flags that the policy and the threads disagree on when a second reminder goes out, and generates 40 simulations.

**Design to implement.**
- **Inputs accepted:** PDFs, Word files, transcripts, audio interviews with subject-matter experts, whiteboard photos, zip files of logs and tickets, plain-English goals, and past conversations (Decagon: one builder generated a full set from 25,000 transcripts).
- **Outputs:** draft procedure documents (§2), guideline entries, playbook rules, connector configuration requests, and auto-generated simulations (§11). Each output names the source passages it came from [Inference: provenance per draft line, consistent with doc 12 Hebbia/Harvey provenance practice].
- **Works only inside a session** (§4): every change is a diff inside a session; it never writes to a published release.
- **Builder tools:** it operates the product headlessly through the same API a human uses (Sierra rebuilt itself as headless infrastructure for Ghostwriter). Tools: read/write procedure drafts, run structural validator, run linter (§4), create and run simulations, read traces and monitor flags, query analytics.
- **Two modes.** Copilot (asked by a human) and Autopilot (background): reads scheduled reports and monitor flags, picks an opportunity, root-causes it, drafts an edit, tests it against the originating conversation plus a golden set (auto-maintained, hundreds of conversations), iterates until it improves, then stages it with diffs for mandatory human approval. Admins declare off-limits procedures up front (`off_limits_to_autopilot`).
- **Teammate surface.** Posts in Slack/Teams (for a 100 to 1,000-staff firm, probably email or Teams [Inference]) with evidence, a proposed change and an estimated number of cases affected; announces when an experiment reaches significance; tracks the result after release; stays quiet unless it has something useful.
- **Saved artifacts.** Any analysis is saved and schedulable (weekly "hill-climbing report", monthly guardrails audit).
- **Knowledge-gap suggestions.** Monthly: cluster escalations where the agent lacked context, rank by number of cases, draft the fix from how staff resolved the same issue.
- **Failure behaviour.** If the builder cannot make tests pass it reports what it tried and stops; it never lowers a test's bar or edits an off-limits procedure [Inference from "loops until the change improves" and "off-limits" in doc 18].

**Copies.**
- doc 12 and doc 19 §2A, Ghostwriter: inputs (SOPs, transcripts, audio, whiteboard photos, zips), drafts journeys and sims, headless harness, teammate mode, proposes not ships. https://sierra.ai/blog/agents-as-a-service ; https://sierra.ai/blog/how-customer-teams-became-software-builders ; https://sierra.ai/blog/ghostwriter-ai-tool-to-teammate
- doc 18 §2.2, Duet Copilot/Autopilot, transcript-to-AOP, artifacts, golden set, off-limits procedures. https://decagon.ai/modules/duet ; https://decagon.ai/blog/autopilot
- doc 18 §2.2, Duet Apprentice learning from expert-handled escalations and Slack/Teams threads; data stays in the customer workspace. https://decagon.ai/blog/dialogues-2026
- doc 18 §2.5 and doc 19 §2B, Suggestions and Expert Answers: drafts from how human reps resolved cases. https://decagon.ai/product/suggestions ; https://sierra.ai/product/agent-studio
- doc 12, Harvey harness engineering: judge scores, coding agent clusters failures and edits the harness (40.8% to 87.7% on 12 tasks, a small experiment). https://www.artificiallawyer.com/2026/04/07/harvey-drives-legal-agent-learning-via-harness-engineering/

**Left out, and why.** Ghostwriter's voice-specific work (Persona Studio, voice tuning): voice is not the first channel (doc 19 "What cannot be copied"). DuetBench-style public benchmarks: not needed to ship.

**Open questions.** How much the builder should infer rules from historical decisions vs ask the controller (Ramp captures "messy exceptions" but doc 12 gives no method). Which rented model writes the procedure format reliably (doc 12's DSL warning).

### 4. Release pipeline: sessions with diffs, named reviewer, linter, simulation gates, canary, immutable snapshots

**Purpose.** Treat every change to agent behaviour like a software release so a mistake in wording or logic cannot reach debtors without review and tests. Example: an ops lead asks the builder to soften the second-reminder wording; the change sits in a session, the linter flags that the new step reads the balance before identity is verified, the fix is applied, sims pass, the finance controller (named Reviewer) approves, and it ships to 10% of cases first.

**Design to implement.**
- **Session.** `session(id, tenant_id, title, created_by, status: open|in_review|merged|abandoned, base_release_id, chat_thread_id)`. Holds the conversation (human and builder) and pending changes as diffs against the base release. Sessions can be shared, forked and run in parallel. Nothing in a session affects live traffic. A builder agent can review a colleague's session before merge.
- **Project.** Groups related agents (internal reporting agent, external reminder agent) with shared objects and channels so one change to, say, dispute rules updates both and is tested and released together.
- **Linter ("agent checks").** Static analysis over procedures, tools and the company model, severity-ranked with a suggested fix. Initial checks, copied from Sierra's five: (1) tool referenced in a step but not granted; (2) conflicting instructions; (3) a read/lookup tool used to perform a write; (4) a response unsuitable for the channel (long table by SMS/WhatsApp); (5) sensitive lookup with insufficient authentication. Add [Inference] receivables checks: outbound step without a compliance evaluation (§7), write tool without a guard. Linter errors block merge; warnings require reviewer acknowledgement.
- **Required simulations.** Tenant policy lists which simulation suites must pass before merge (e.g. golden set pass^k ≥ threshold, all negative permission tests).
- **Reviewer role.** Tenant configures named reviewer roles per area (finance controller for wording and offers, compliance for outbound rules, engineering owner for tools). Review UI: line-by-line diffs, inline comments, request changes, approve. Merge requires all required reviewers.
- **Release.** On merge, build an **immutable snapshot**: procedure documents, compiled graphs, guidelines, prompts, model IDs and versions per task class, tool and connector schemas (pinned), knowledge index version, compliance configuration. Numbered. Promote QA → staging → production. One-click rollback to any earlier snapshot.
- **Canary / split traffic.** A new production release takes a configurable share (default small, e.g. 10% [Inference]) with per-version reporting; widen, hold or roll back. Assignment is sticky per case so a debtor's case does not flip versions mid-sequence.
- **Experiments vs split releases.** Experiments pick a winner among variants (§12); split releases ship the chosen winner safely. Keep them as separate mechanisms.
- **Platform upgrades.** When we change the runtime, rerun every tenant's regression suite before rollout.
- **Git.** Procedures, tools and guidelines are commits; sessions map to branches; optional branch protection.

**Copies.**
- doc 19 §2C and Key finding 3, Release governance: Agent Checks with the five checks, required simulations, Reviewer role with diffs, comments and request-changes, split-traffic, experiments vs splits, immutable snapshots, rollback; "hundreds of people in one agent" [Vendor claim]. https://sierra.ai/blog/release-governance-guardrails-for-agents-at-scale
- doc 19 §3 Change model and doc 12, Ghostwriter redesign: sessions, fork/share/parallel, Ghostwriter peer review, projects. https://sierra.ai/blog/redesigning-agent-studio-around-ghostwriter
- doc 12, Agent Studio 2.0: private workspaces, numbered snapshots through QA, staging, production. https://sierra.ai/blog/agent-studio-2-0
- doc 12, Sierra ADLC: snapshot contents (code, prompts, model versions, frozen knowledge), regression suite rerun on platform upgrades. https://sierra.ai/blog/agent-development-life-cycle
- doc 18 §2.4 and Key finding 4, Versions: Git commits, gated workspaces as branches, branch protection, staging, randomized traffic split with per-version reporting. https://decagon.ai/modules/versions
- doc 12, Harvey MCP policy engine: Tool Pinner pins tool descriptions and schemas and alerts on drift. https://www.harvey.ai/blog/building-harveys-mcp-policy-engine

**Left out, and why.** Hundreds-of-editors scale features; at 100 to 1,000 staff a handful of people edit [Inference]. Glean's ADLC review depth by scope is kept only as a rule of thumb (doc 21 §3.6 says it is a guide, not tooling).

**Open questions.** Default canary share and widen criteria are not published by any vendor. Sierra's release governance was earlier known only via Unite.ai (doc 12) and is now a primary read (doc 19).

### 5. Supervisors and guardrails (runtime defence)

**Purpose.** Check each message on the way in and on the way out, and block actions the rules forbid, regardless of what the model wants. Example: the model drafts "we will pass this to our lawyers"; the output check finds a banned phrase and an unauthorised threat, rewrites or blocks it and logs why.

**Design to implement.** Per message, in order:
1. **Input supervisor** (a separate, cheap model call): prompt-injection, abuse, out-of-scope, high-risk intents (hardship, bereavement, dispute, legal threat) mapped to escalation intents.
2. **Agent turn** with retrieval-grounded content and the procedure's rules.
3. **Deterministic guards:** tools not authorised for the current state are absent from the tool list (account-read and write tools appear only after identity verification); guard code from the procedure; the tool-call policy engine (below).
4. **Output supervisor** (separate model): checks facts against retrieved records (balance, due date), policy and tone; may block, rewrite or nudge.
5. **Deterministic output scan:** `never_say_phrases` list, sensitive-data patterns (bank account numbers, IC numbers [Inference]), channel length limits.
About half a dozen checks per message is the published reference point. Record every check result in the trace (§9).
- **Tool-call policy engine.** Data-blind: inputs are tool ID, our own risk annotation (capacity: how much data an argument can carry; authority: what it controls), capability flags and names of prior calls in the turn; never argument values or free text. Outputs: `allow | deny | require_approval`. Fails closed. Detect delegation cycles. Sanitise tool results for hidden characters and confusables. Telemetry excludes arguments and results. [Inference on stack: Harvey embeds Rego via an in-process engine; in TypeScript, either OPA compiled to WebAssembly or a small typed rule evaluator; the documents do not cover a TypeScript option.]
- **Approval gate for external effects:** sends, writes and publishes require approval until the rule is promoted; reads do not.
- **Reliability arithmetic** (vendor claim): a 90%-accurate agent with an independent 90%-accurate supervisor gives about 99%. Treat as motivation, not a guarantee.
- **Sensitive guardrails fixed while low-risk parts change:** guardrails are versioned separately so a tone change cannot alter a compliance guard.

**Copies.**
- doc 19 Key finding 7, §3 Runtime per message, §2L: four layers, input and output supervisors that block/rewrite/nudge, tools withheld until authentication, output scan for sensitive data, ~half a dozen checks, red teaming, Threat Detection. https://sierra.ai/blog/defense-in-depth-in-the-age-of-agents
- doc 12, Sierra supervisors and 90%+90% arithmetic. https://sierra.ai/blog/confidence-in-every-conversation ; https://sierra.ai/blog/meet-the-ai-agent-engineer
- doc 12, constellation of models: sensitive guardrails held fixed while low-risk tasks change. https://sierra.ai/blog/constellation-of-models
- doc 12, Harvey MCP policy engine: data-blind Rego, capacity/authority risk, allow/deny/pause, fail closed, cycle detection, sanitiser, telemetry without arguments. https://www.harvey.ai/blog/building-harveys-mcp-policy-engine
- doc 21 R1, Work IQ: OPA/Rego policy check on every tool call, user-scoped actions, every call logged. https://learn.microsoft.com/microsoft-365/copilot/extensibility/work-iq/
- doc 20 §1.2B, Meta `never_say_phrases`. https://360dialog.com/blog/?p=1433
- doc 18 §3.2, Decagon supervisor model and escalation intents. https://decagon.ai/modules/decagon-platform
- doc 12, Lindy: approval for anything with outside impact, reads free. https://www.lindy.ai/pricing
- doc 19 §3 Identity: capture intent before verification to shorten it (R1 RCM cut authentication time by more than half). https://sierra.ai/customers/r1-rcm

**Left out, and why.** Glean Protect+ alignment models and third-party red teaming at "millions of attempts" (overkill and costly at this size, doc 21). Sierra's Fleming AI-caller detection (voice-specific).

**Open questions.** Which rented model is good enough for the supervisors at acceptable latency for email/WhatsApp (not studied). Malaysia-specific sensitive-data patterns are not in the documents.

### 6. Keeping payments away from the model

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

### 7. Compliance layer for outbound messages

**Purpose.** Evaluate every outbound touch against contact rules before it is sent, so no reminder goes out at night, on a public holiday, too often, or to someone who opted out. Example: a reminder scheduled for 10pm debtor-local time on Hari Raya is deferred to the next allowed window; a contact who replied STOP is blocked on WhatsApp but still allowed by email if consent permits.

**Design to implement.**
- **Evaluator** `evaluate(touch) → {outcome, reasons[], next_allowed_at?}` where `outcome ∈ allowed | deferred | blocked | held_for_review`. Runs in the engine, never in the prompt. Every evaluation is logged.
- **Inputs:** touch (channel, message class `transactional|marketing`, contact, debtor, case, scheduled time), contact's time zone, region, consent per channel, opt-out records, contact history.
- **Rules, in evaluation order** [ordering is Inference; rule set copied]:
  1. **Opt-out / consent** per contact per channel → `blocked`. Opt-outs captured from any channel (STOP keyword, reply text, spoken on a call, staff entry), stored and visible to the company.
  2. **Suppression** (§8: paid, disputed, in progress elsewhere, wrong party) → `blocked` with reason.
  3. **Contact window** in recipient local time; default 08:00 to 21:00; per-day and split windows (e.g. 09:00–12:00 and 14:00–18:00) → `deferred` with `next_allowed_at`.
  4. **Holiday holds** by region from a holiday calendar → `deferred`.
  5. **Frequency caps**, separate for transactional and marketing, per contact per rolling window (Decagon cites Reg F's 7-in-7 as an example of a native cap) → `deferred` or `blocked`.
  6. **Disclosures** per channel (opening line, opt-out wording, email unsubscribe) → attached automatically; missing disclosure → `held_for_review`.
  7. **Content rules** (never-say list, review-required topics such as legal action) → `held_for_review`.
- **Config as data**, editable by finance ops without engineering, per campaign: channels, windows, holidays, retry cadence, caps. Versioned as part of the release snapshot (§4).
- **Dashboard:** counts of allowed, deferred, blocked, held for review, and opt-outs, with drill-down to each touch and reason.
- **Wrong-party suppression and sensitive-data redaction** as built-in rules.

**Copies.**
- doc 19 Key finding 4, §2F, §3 Outbound rules engine, What to copy 4: disclosures per channel, local-time windows default 8am–9pm with split windows, regional holiday exclusions, frequency caps split marketing/transactional, opt-outs by STOP or voice stored and accessible, four outcomes, dashboard. https://sierra.ai/blog/introducing-compliance-console
- doc 18 Key finding 8, §2.3 Campaign Composer, What to copy 11: channels, local calling hours, retry cadence, contact limits as configuration; 7-in-7; opt-out and wrong-party suppression; redaction; FDCPA/TCPA/UDAAP/Reg F claimed "natively" [Vendor claim]. https://decagon.ai/blog/a-better-payment-experience-from-reminder-to-resolution
- doc 19 §2E Horizon: consent-aware delivery per customer per channel. https://sierra.ai/product/horizon

**Left out, and why.** US statute packs (FDCPA, TCPA, Reg F) as named rules: the first market appears to be Malaysia/Southeast Asia (doc 20 §1.4, MYR billing) and the documents contain no Malaysian collections rules. Build the engine; load rule values per jurisdiction.

**Open questions.** Which Malaysian rules apply to a company collecting its own trade receivables (not covered in any document; see Gaps). Whether Meta's WhatsApp policies impose further limits on utility templates used for reminders (doc 20 covers price, not policy limits).

### 8. Long-running outreach: planning toward an outcome over weeks, suppression, audit

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

### 9. Traces and observability

**Purpose.** Show exactly why the agent did what it did on any turn, so staff can debug and turn failures into tests. Example: a debtor complains about a wrong amount; the trace shows the balance tool returned a stale figure from a 30-minute-old sync.

**Design to implement.**
- **Trace per turn as a mini-workflow** of micro-steps: router decision (intent, procedure chosen, switches), each model call (model ID, prompt hash, instructions given, response), retrieval (queries, items returned, items dropped by permission re-check), condition and guard checks, tool calls (inputs, outputs, errors), supervisor and compliance decisions, and latency per micro-step. Per procedure step: inputs, reasoning, outputs, transition taken.
- **Audit log view:** did the correct procedure run, did tool calls error (catch "refund tool called but no refund issued" — for us, "payment-plan tool called but no plan created").
- **Debug assistant** over traces: explains why a node ran, where latency started, suggests fixes; investigations are shareable.
- **Actions from a trace:** "turn this conversation into a test" (§11) and "replay this turn on the new version".
- **Annotation:** reviewers mark daily samples: decision right? tone right? knowledge missing? what should it have done?
- **Storage:** append-only `trace_event` rows keyed by `conversation_id, turn_id, seq`; respect the same ACLs as the conversation [Inference]. Exclude tool arguments from telemetry exported outside the tenant (Harvey practice).

**Copies.**
- doc 18 §2.6, What to copy 6: Trace View micro-steps with inputs, reasoning, outputs, transition, latency, AOP switches; Audit Logs; Agent Workbench; reasoning timeline. https://decagon.ai/blog/decagon-trace-view ; https://decagon.ai/blog/agent-workbench ; https://decagon.ai/modules/debugging
- doc 12, Sierra traces and Experience Manager annotation. https://sierra.ai/blog/agent-development-life-cycle
- doc 19 §2B, §3: Agent Traces while building; per-step timing traces. https://sierra.ai/product/agent-studio ; https://sierra.ai/blog/voice-latency
- doc 21 §2D: debugging and re-run from a step (titles only). https://docs.glean.com/llms.txt

**Left out, and why.** Time-to-first-audio and voice VAD metrics (voice later).

**Open questions.** Retention period for traces (no vendor publishes one).

### 10. Always-on quality monitoring

**Purpose.** Check 100% of conversations and touches after the fact against plain-language rules, so problems are found without anyone reading transcripts. Example: a monitor "agent promised a discount not in policy" flags three conversations this week, each linked to its trace.

**Design to implement.**
- **Monitor (QA job) definition:** `monitor(id, name, criterion_text, positive_examples[], negative_examples[], filters {channel, procedure, outcome, debtor segment, date range}, mode: historical|continuous, rubric [{field, points, description}], category, severity, alert_target)`. Criterion is natural language, judged by a model over the transcript plus trace.
- **Test on a sample first:** "test monitor" runs it on a small sample (e.g. 50 conversations [Inference]) and shows hits for the author to confirm before it runs on all traffic.
- **Defaults shipped:** coherence, repetition, grounding (claims match records), sentiment/frustration; receivables defaults [Inference from doc 18 What to copy 7]: "debtor disputes the debt", "agent promised a discount not in policy", "contact outside permitted hours" (cross-checked against the compliance log, §7), "debtor says already paid".
- **Output:** each flag links to the transcript and trace; flags grouped into categories/clusters; dashboards with rubric averages; drill-down; alerts on spikes or when a metric leaves a range; monitors also cover human-handled conversations.
- **Feeds:** flags become builder-agent opportunities (§3) and one-click tests (§11).
- **Platform-level:** abuse/threat detection across all agents and API-outage or metric-anomaly alerts.
- **Topic discovery and natural-language questions over conversations** (summary, chart, links to sources) for managers.

**Copies.**
- doc 18 Key finding 6, §2.5, What to copy 7: Watchtower natural-language criteria, filters, historical or continuous, rubric scoring, categories, Test Watchtower on a sample, positive and negative examples, AI and human conversations, templates; Insights tags, topic discovery, Ask AI. https://decagon.ai/modules/watchtower-qa ; https://decagon.ai/product/watchtower ; https://decagon.ai/modules/insights-reports
- doc 12, Sierra monitors: natural-language, every conversation, flag links to transcript, default coherence/repetitiveness/grounding/sentiment, custom frustration or brand voice. https://sierra.ai/blog/confidence-in-every-conversation
- doc 19 §2A, §2H: Ghostwriter flags API outages and metric anomalies; alerting on abuse attempts or performance drops; Threat Detection. https://sierra.ai/blog/summit-recap-2026 ; https://sierra.ai/product/insights
- doc 12 Cross-cutting (b): every vendor runs always-on monitors over 100% of conversations [Vendor claim].

**Left out, and why.** Peer benchmarks across deployments (needs a customer base, doc 12).

**Open questions.** Cost of judging 100% of traffic with rented models; no vendor publishes it [Inference: sample-then-scale and cheap models per monitor].

### 11. Simulations

**Purpose.** Test the agent against simulated debtors and mocked systems before release and score whether the ledger ends in the right state. Example: "You are the AP clerk at ABC Trading; you claim you paid last week; insist politely" — pass only if the agent checks the ledger, opens a dispute or confirms the payment correctly, and does not send another reminder.

**Design to implement.**
- **Test case** = user instruction (persona, goal, mood, language, patience) + initial database snapshot (company model state: invoices, payments, contacts, consents) + reference action list + required communicated facts + optional natural-language assertions + checkpoints (right action, data and tool at the right moment).
- **Reward** = product of components (default DB × COMMUNICATE): replay reference actions on a fresh snapshot, compare final DB state hashes with the agent's run; check required strings/facts were communicated; NL assertions judged by an LLM. Any trajectory reaching an equivalent end state passes.
- **pass^k** = C(successes, k) / C(trials, k); run each scenario several times (k ≥ 4 recommended in doc 12).
- **Mocks** of every connector generated from the same tool schemas.
- **Dual control:** when the debtor must act (click a link, forward remittance), the simulated user has its own tools.
- **Judge:** separate model; for document outputs from internal agents, atomic binary criteria scoped to deliverables, two different judge models, all-pass scoring.
- **Generation:** auto-generate initial tests from SOPs and knowledge at agent creation; one click turns an annotated bad conversation into a test; detect stale tests and update or remove them; four buckets (happy, edge, adversarial, permission) run under three user profiles (standard, restricted, admin).
- **Runs:** CLI and CI (GitHub Actions) entry points; scheduled recurring runs; gate releases (§4); alert when metrics leave a range.
- **Message replays** for small changes: replay one turn on updated logic.
- **Salesforce test triple** as a minimum per test: expected topic (procedure), expected action, expected outcome.

**Copies.**
- doc 12, tau-bench/tau2 (code read): reward, DB hash, communicate, pass^k, dual control, reference actions as one valid path. /home/claude/research/_code/tau2-bench/docs/evaluation.md ; https://arxiv.org/abs/2406.12045 ; https://arxiv.org/pdf/2506.07982
- doc 12, Sierra simulations: persona variation, production-matched initial state, repeated runs, judge on goal/SOP/brand/quality, auto-generated tests, failure-to-test, 35,000 tests a day [Vendor claim], CLI/GitHub Actions. https://sierra.ai/blog/simulations-the-secret-behind-every-great-agent
- doc 18 §2.4: Simulations with checkpoints and rationale, stale test detection, scheduled runs, CI/CD, PagerDuty; Message Replays; conversation-to-test; run several times. https://decagon.ai/product/testing-qa ; https://decagon.ai/modules/testing
- doc 21 §3.6: four-bucket golden set, three profiles, pass rates and critical failures, prefer "I don't have access". https://docs.glean.com/agents/agent-development-lifecycle/evaluate-agent-quality
- doc 12, Harvey LAB: atomic binary criteria, two judges, all-pass. /home/claude/research/_code/harvey-labs/docs/eval-strategies.md
- doc 20 §2: Testing Center topic/action/outcome. https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce
- doc 20 §1.2B: Meta Agent Test and Agent Eval (conversation- and turn-level scores). https://developers.facebook.com/documentation/meta-business-agent/capabilities

**Left out, and why.** Voice sims with noise and DTMF, tau-voice (voice later).

**Open questions.** Default judge model under rented-model constraint (tau2 default is gpt-5.5; the stack names Claude and Qwen).

### 12. Experiments

**Purpose.** Test reminder wording, timing or channel against real outcomes and keep the winner. Example: variant B sends the first reminder on the due date at 10am; measure promise-to-pay rate and paid-within-7-days vs control.

**Design to implement.**
- **Experiment block inside a procedure step:** up to 20 variants against a shared control; sample size set up front; gradual ramp; alerts; auto-stop if a variant is significantly worse; one-click publish of the winner (which then goes through the release pipeline, §4).
- **Sticky assignment:** a case keeps its variant even if a new release publishes mid-test.
- **Count only cases that reached the tested step.**
- **Simulation pre-check** of each variant against the golden set before live traffic.
- **Concurrent experiments without overlap** (one case in at most one experiment per step) [as Decagon states; exact allocation algorithm not published].
- **Metrics:** for receivables [Inference]: PTP rate, paid within N days, days-to-pay vs control, dispute rate, opt-out rate, escalation rate, cost per case. Vendor list includes resolution, CSAT, NPS, latency, turn count, cost per conversation.
- **Headline outcome:** "paid N days faster" against a control group on standard reminders.

**Copies.**
- doc 18 Key finding 5, §2.4, What to copy 8: experiment blocks, 20 variants, sizing, ramp, auto-stop, sticky assignment, step-reached counting, 20+ metrics, simulation pre-check, no overlap. https://decagon.ai/blog/experiment-hub
- doc 19 §2C, §2H: experiments vs split releases; conversation-design tests. https://sierra.ai/blog/release-governance-guardrails-for-agents-at-scale ; https://sierra.ai/product/insights
- doc 12: Ghostwriter proposes experiments and announces significance. https://sierra.ai/blog/ghostwriter-ai-tool-to-teammate
- doc 20 What to copy 10: "paid N days faster" against a control group (Intuit claims ~5 days [Vendor claim]). https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/

**Left out, and why.** Nothing material.

**Open questions.** Statistical method (sequential test vs fixed horizon) is unpublished. With 100 to 1,000-staff customers, debtor counts may be too small for significance [Inference]; consider pooling across tenants only with consent.

### 13. Memory of each customer across interactions

**Purpose.** Remember what each debtor and contact said and prefers across emails, chats and months. Example: "Ms Tan said they pay suppliers on the 25th and prefers WhatsApp; no calls after 3pm."

**Design to implement.**
- `memory_item(id, tenant_id, subject_type: debtor|contact, subject_id, kind: explicit|configured|captured, key, value, source_message_id, captured_at, expires_at?, sensitivity, acl)`.
  - `explicit`: the contact asked us to remember; `configured`: builder-defined fields (pay day, preferred channel, AP portal); `captured`: automatically extracted preferences.
- One person across channels: link memory to the contact, not the channel identity; resolve channel identities (email address, WhatsApp number) to contacts.
- Sensitive items require identity verification before recall.
- Read before every outbound action (§8) and at conversation start.
- Customer-owned and exportable: an export endpoint to the customer's warehouse; retention on the customer's terms; granular control of what is stored and used.
- Per-customer memory is small relative to the knowledge base (about three orders of magnitude, Sierra's figure) — keep it as rows, not a vector index [Inference].

**Copies.**
- doc 12, Sierra ADP: memory plus decisioning, three memory levels, identity verification for sensitive recall, ~3 orders of magnitude smaller [Vendor claim, secondary]. https://sierra.ai/blog/agent-data-platform ; https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents
- doc 19 §2G, Key finding 10: Context Engine memory tied to one person across channels, customer-owned, permissioned, retained on customer's terms, exportable; "rent the intelligence, own the context". https://sierra.ai/product/context-engine ; https://sierra.ai/blog/summit-recap-2026
- doc 18 §3.7: User Memory across sessions and channels with control over storage and use; Missions read memory ("no calls after 3pm"). https://decagon.ai/proactive-agents ; https://decagon.ai/blog/missions
- doc 21 §2A: saved vs learned memories (learned is a billable unit). https://docs.glean.com/glean-enterprise-flex-pricing

**Left out, and why.** Next-best-offer decisioning for upsell (Sierra ADP): not a receivables need.

**Open questions.** No vendor publishes schema, retention or permission details for memory (doc 12, doc 19 [Unverified]); the schema above is assembled.

### 14. Human handoff

**Purpose.** Pass a conversation to a person cleanly when rules say so or the debtor asks, and take it back afterwards. Example: the debtor writes "we're in financial difficulty"; the hardship escalation intent hands the thread to the credit controller with a summary; she agrees a plan and releases the thread.

**Design to implement.**
- **Thread ownership:** `thread(owner: agent|human, owner_user_id?)`. The non-owner receives standby copies, delivery and read receipts. A human takes control by sending a message or clicking take-over; returns it with an explicit release. A `handover` event fires on every change.
- **Configurable triggers** (unlike Meta): escalation intents (dispute, hardship, bereavement, legal threat, complaint), procedure `escalate_when` conditions, low confidence, integrity violation, customer asks for a human. Tenant can add and edit triggers.
- **Handoff message** options: custom, agent-written, default.
- **Summary** generated at handoff with history; verified identity carried across.
- **Assist for the human** after transfer: suggested replies, next steps, one-click actions using the same tools as the agent; assisted conversations feed improvements back.
- **Disable semantics:** disabling the agent stops it on all threads; re-enabling applies to new threads only (Meta) — copy so a re-enable does not surprise staff mid-conversation.

**Copies.**
- doc 20 §1.2B, What to copy 3 and 5: thread control, standby copies, `messaging_handovers` webhook, handoff message selection, follow-up intervals, automatic handoff triggers, disable/enable semantics. https://360dialog.com/blog/?p=1433 ; https://developers.facebook.com/documentation/meta-business-agent/capabilities
- doc 20 §1.8: non-configurable triggers are a weakness; disputes, hardship and legal threats must route by rule.
- doc 18 §3.6: AOP-specified handoff, escalation intents, summaries, warm handoff, Decagon Assist; keep emotional or negotiation-heavy procedures human. https://decagon.ai/resources/from-sops-to-agent-operating-procedures ; https://decagon.ai/product/voice
- doc 19 §2J: Live Assist next-step guidance, drafted replies, one-click actions with the agent's tools; verified identity across departments. https://sierra.ai/product/live-assist ; https://sierra.ai/customers/r1-rcm

**Left out, and why.** Contact-centre telephony transfer (voice later). Helpdesk integrations (Zendesk, Salesforce) for human queues — finance teams usually work from email and the ledger [Inference].

**Open questions.** Where the human works the thread (our inbox vs their email client) is a product decision the documents do not settle.

### 15. Channels

**Purpose.** Reach debtors on email and messaging first, and staff inside tools they already use. Example: first reminder by email with PDF invoice; second by WhatsApp utility template; internal "aging summary" posted to the controller in Teams.

**Design to implement.**
- **Build once, deploy to many channels**, with **per-channel exposure control**: for each channel choose which procedures, data and actions it gets (e.g. no payment-plan negotiation over SMS).
- **Email** first: branded templates, signatures, default values when data is missing, language detection.
- **WhatsApp** via the Cloud API / a BSP, using **utility templates** for reminders. Cost model per message category: utility templates are charged per message even inside the 24-hour window since 1 Oct 2026; service messages are paid outside the 72-hour entry window, with 1,000 free per number per month (BSP report); token pricing applies if Meta's own agent is used ($2 per million tokens, about 4 to 5 US cents a message). Store the category on every touch and price it.
- **SMS** as escalation channel (Xero switches to SMS).
- **Inbound input types:** declare which the agent cannot read (Meta cannot read PDFs or video) and send a fallback reply. Remittance PDFs are core to receivables, so our own channel must read them [Inference].
- **Allowlist pilot mode:** the agent talks only to chosen debtors first (`ai_audience = ALLOWLISTED_ONLY`).
- **Internal channels:** Teams/Outlook/Slack for staff questions and builder notifications.
- **Personal-agent channel** (customers' own AI agents) — later.

**Copies.**
- doc 19 §2I, What to copy 11: build once deploy everywhere; per-channel exposure of journeys, data and capabilities. https://sierra.ai/product/channels ; https://sierra.ai/blog/publish-to-chatgpt
- doc 18 §2.1: chat, email (greetings, signatures, defaults, language detection), SMS/WhatsApp in collections. https://decagon.ai/modules/customizations
- doc 20 Key findings 1, 3 and §1.4: WhatsApp pricing changes, token pricing, categories, MYR billing; §1.2B inbound limits and allowlist. https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/ ; https://360dialog.com/blog/?p=1433
- doc 20 §11: channel escalation email → SMS. https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/

**Left out, and why.** Voice (doc 19: largest Sierra channel but tau-voice shows audio-native models at 67% vs ~85% text; heavy investment). ChatGPT app publishing and Personal Agent Protocol (doc 19 §2N; doc 18 PACT) — watch, not v1.

**Open questions.** Malaysian WhatsApp per-message rates after 1 Oct 2026 were not read (doc 20 [Unverified]). Whether Meta treats a company chasing its own invoices as the excluded "Finance" vertical — this matters only if we use Meta's Business Agent; plain Cloud API templates are a different product [Inference].

### 16. Outcome-based pricing mechanics and the definition of a resolution

**Purpose.** Charge in a way the buyer can tie to results without endless arguments. Example: platform fee per month plus a success fee per invoice collected within the case window.

**Design to implement.**
- **Outcome metering:** `outcome_event(case_id|conversation_id, type, value, occurred_at, definition_version)` written by the engine using the tenant's contracted definition stored as configuration (`pricing_config` versioned with the contract). At most once per unit (Fin: once per conversation).
- **Non-attributable traffic** (routing, greeting, internal Q&A) billed per conversation or per action.
- **Escalated or unresolved units free** where outcome pricing applies.
- **Usage wallet** with threshold alerts (80% and 100% as Rovo; Glean downgrades at 75%/90%).
- **Publish worked examples** (median and 90th-percentile cost per action type), as Glean and Meta do.
- **Definitions available in the documents:** Fin: resolution = customer asks for no further help after the last answer, billed once per conversation, $0.99; Sierra: agreed per customer up front, unresolved and escalations generally free, per-conversation blend for routing/greeter traffic, commission for some sales agents; Decagon: per conversation (default) or per resolution (higher rate, only full resolution without a human).
- **Starting recommendation from the documents:** platform fee plus a success component, not pure outcome pricing (doc 19 and doc 12 [Inference]).

**Copies.**
- doc 12, Sierra pricing and "Outcomemaxxing": agreed criteria, escalations free, per-conversation blend, needs autonomy and clean attribution or it becomes "an endless debate". https://sierra.ai/blog/outcome-based-pricing-for-ai-agents ; https://sierra.ai/blog/outcomemaxxing
- doc 12, Fin pricing: $0.99, definition, once per conversation, 50-outcome minimum on other helpdesks. https://fin.ai/pricing
- doc 18 §4: per conversation vs per resolution; Decagon's glossary admits definitions cause "billing disagreements" [Competitor claim citing it]. https://sacra.com/c/decagon/ ; https://fin.ai/learn/decagon-ai-pricing
- doc 20 §2: Salesforce $2 per conversation, $0.10 per action, usage wallet with thresholds. https://www.salesforce.com/agentforce/pricing/
- doc 21 §4, R2: seat with included allowance plus pooled credits with published medians; Rovo $0.01 per credit overage, alerts at 80%/100%, indexing free. https://docs.glean.com/glean-enterprise-flex-pricing ; https://atlassian.com/software/rovo/pricing

**Left out, and why.** Opaque custom pricing with high minimums (Sierra ~$150k/yr start, Decagon ~$50K platform fee, Vendr median ~$386K [Competitor claim]) — the target buyer expects a list price (doc 21 §8). Salesforce's three coexisting schemes. 11x-style break-clause contracts counted as ARR.

**Open questions.** What counts as "collected because of the agent" when the customer's own staff also chase (doc 19 notes this attribution issue [Inference]). How Sierra detects resolutions for billing and handles disputes is unpublished.

### 17. Deployment process, roles and time to live

**Purpose.** Get a customer live quickly with little staff time from a solo founder. Example: week 1 connect ledger and email, load the basics pack, run sims; week 2 allowlist 20 debtors; week 4 widen.

**Design to implement.**
- **Path:** connect sources → wait for full sync → validate permissions by searching as restricted users → ingest SOP/policy and past threads into the builder → apply starter pack → auto-generated simulations → allowlist pilot on a small slice (one surface, about 10% of debtors, a few intents) → misuse testing by the customer's IT → widen.
- **Roles in the product** (replacing the vendors' human pairs): tenant admin, procedure editor, named reviewers (§4), compliance owner, agent owner. The vendor roles they replace: Sierra's agent engineer plus "Strategist, Agent Development" (formerly agent PM); Decagon's Agent Product Manager plus Agent Deployment Engineer.
- **Self-sufficiency:** short certification-style onboarding modules (Decagon University ~51 minutes, ten modules).
- **Customer usage analytics agent** for admins (Command Center): usage by department and recommendations for what to enable next.
- **Agent ROI dashboard** as a standard screen.

**Copies.**
- doc 12 and doc 19 §6: agent engineers, agent PM / Strategist role, time to live 27 days to 10 weeks [Vendor claim], WeightWatchers rollout pattern. https://sierra.ai/blog/our-customers-ambition-is-accelerating-our-growth ; https://sierra.ai/customers/weightwatchers ; https://jobs.thrivecap.com/companies/sierra-2-90e5d64d-40bb-415e-bbca-4108552c8ee9/jobs/52580191-strategist-agent-development
- doc 18 §6, Key finding 12: APM + ADE, one surface ~10% of customers then ramp, "within days" logic flows, University modules. https://decagon.ai/blog/agent-deployment-engineering ; https://saastr.com/from-zero-to-eight-figures-in-18-months-decagon-ceos-playbook-for-ai-native-saas-growth-and-why-they-partnered-with-accel/ ; https://decagon.ai/modules/decagon-platform
- doc 21 §6: deployment order, permission validation before enabling agents. https://docs.glean.com/connectors/connectors-power-glean
- doc 20 §1.6: Meta's seven-step platform setup and allowlist testing; self-serve. https://360dialog.com/blog/?p=1433
- doc 12, Harvey Command Center. https://www.harvey.ai/blog/introducing-command-center
- doc 20 §9: Oracle agent ROI dashboard. https://www.oracle.com/in/applications/fusion-ai/ai-agents/

**Left out, and why.** Forward-deployed teams and GSI partners per account (doc 12, 18, 19 all say a solo founder cannot staff this). Air-gapped and customer-VPC deployments (Decagon) and Glean Customer Hosted.

**Open questions.** Realistic time to live for a 100 to 1,000-staff firm with no vendor staff (no document gives one; Glean's is unpublished).

### 18. What the big platforms ship, and who already ships a receivables agent

**Purpose.** Know which platforms are suppliers, which are teachers and which compete, so the build avoids their strengths and uses their channels.

**Summary (all from doc 20 unless noted).**
- **Meta:** Business Agent on WhatsApp/Messenger/Instagram; Business Agent Platform API (knowledge, instructions, connectors and tools, events, settings, Agent Test/Eval); $2 per million tokens; Finance vertical excluded; no ledger or reminder function [Fact]. Meta Enterprise Platform (Muse) mostly names; Muse for Small Business connects to QuickBooks and Stripe [Fact, reported]. Manus separated from Meta (Sept 2026) [Fact]. Relationship: supplier (channel), potential competitor.
- **Salesforce:** Agentforce 360, Agent Script mixing deterministic `->` and LLM `|` instructions, Testing Center, Flex Credits $0.10 per action, $2 per conversation, seat add-ons [Fact for pricing]. No collections agent found. Teacher.
- **Microsoft:** Copilot Studio, M365 Copilot, Dynamics 365 agents (Payables agent, collections coordinator summary, Business Central reminders), Agent 365 [mostly Unverified]; "collections agent" is a demo scenario only [Fact]; Work IQ with OPA/Rego (doc 21) [Fact]. Supplier (Outlook/Teams), low-end competitor.
- **Google:** Gemini Enterprise, Customer Engagement Suite, ADK, A2A, AP2 [Unverified]; Knowledge Catalog context sets [Fact]. No receivables agent found. Supplier, teacher.
- **Amazon:** AgentCore (runtime, memory, gateway, identity, policy, evaluations), Connect, Quick Suite [Unverified]. Supplier.
- **ServiceNow:** AI Agents, AI Control Tower, Moveworks, data.world; Knowledge Graph returns `sysId` [Fact]. Teacher.
- **Workday:** Agent System of Record, Illuminate agents, Data Cloud with 240+ objects and contextual security [Vendor claim / Unverified]. Teacher.
- **SAP:** Joule Accounts Receivable Assistant with eight agents; no GA date, rollouts to Q1 2027; Nestlé adopting [Fact]. **Ships a receivables agent set** for very large S/4HANA firms.
- **Oracle:** Collectors Workspace (risk analysis, next-best action, automated outreach) and Cash Processing Agent [Fact]. **Ships receivables functions** for Fusion customers.
- **Intuit:** QuickBooks Payments agent (reminder schedule for approval, drafted reminders, late fee and payment-method suggestions), US only, bundled; "paid ~5 days faster" [Vendor claim]. **Ships invoice chasing** for US SMBs.
- **Xero:** JAX Payment Follow Ups (per-customer plan, consolidated invoices, timed reminders, switch to SMS), coming soon; XeroForce no-code builder; Claude and M365 Copilot integrations [Fact]. **About to ship** for small firms.
- **Decagon** (doc 18) also sells collections to large consumer brands (Campaign Composer, compliance claims, +24% recovery for one UK brand [Vendor claim]); **Sierra** (doc 19) has Horizon + Compliance Console naming late-payment collection and R1 RCM patient billing calls.

**Design to implement.** Treat Xero, QuickBooks and the customer's ERP as connectors (data sources), not rivals to replicate; use WhatsApp Cloud API directly as a channel; expose the company model via MCP so customers on Microsoft/Glean/Claude can use it from there [Inference from doc 20 relationship notes and doc 21 §9].

**Copies.**
- doc 20, "Receivables, collections and invoice chasing" table and §1–11 (URLs per row in that document, e.g. https://www.sap.com/use-cases/joule-assistant/accounts-receivable-ai ; https://www.oracle.com/in/applications/fusion-ai/ai-agents/ ; https://quickbooks.intuit.com/learn-support/en-us/help-article/intuit-assist/get-started-payments-agent/L5y4ix9cA_US_en_US ; https://blog.xero.com/product-updates/xerocon-london-2026-agentic-era-small-business-finance/ ; https://adoption.microsoft.com/en-gb/scenario-library/finance/collections-agent/ ; https://developers.facebook.com/documentation/meta-business-agent/overview).
- doc 20 §6–7: agent inventory with owner, scope, metrics (Control Tower); each agent as a managed worker with role and cost line (Workday).

**Left out, and why.** ERP-native ownership of the ledger (not possible for us). Meta's distribution (not copyable).

**Open questions.** Xero Payment Follow Ups release date, markets and price; SAP and Oracle prices; most Microsoft/Google/Amazon/ServiceNow/Workday details are from prior knowledge (doc 20 [Unverified]).

---

## What makes large organisations buy

Evidence from the documents, with labels kept:

1. **Measured production results sold through incremental rollouts.** Chime ran a vendor evaluation on accuracy, automation rate and sNPS; Decagon's CEO advises one surface and ~10% of customers first (doc 18 §5) [Vendor claim]. WeightWatchers started on ~100 inquiries at a time (doc 12) [Vendor claim]. Glean sells adoption numbers a CIO can show a CFO: 5 queries per employee per day, 45% wDAU/wMAU (doc 21 §5) [Vendor claim].
2. **Business teams can change the agent themselves while engineers keep the code.** Duolingo's previous vendor took half a manager's week; Chime keeps core logic with technical teams; Coatue cites "control, transparency, and speed" (doc 18 §5) [Vendor claim]. Sierra's governance lets hundreds of staff edit one agent safely (doc 19 §5) [Vendor claim].
3. **Security and compliance posture that removes procurement blockers.** Sierra's certifications (SOC 2, HIPAA, PCI DSS L1, FedRAMP High, ISO 27001/42001) and payment isolation (doc 19 §5) [Vendor claim]; Decagon's single-tenant and air-gapped options (doc 18 §5) [Vendor claim]; Glean's single tenant, customer-cloud hosting, ZDR and oversharing remediation (doc 21 §5) [Fact/Inference]; Harvey's ethical walls and ZDR runtime (doc 12) [Fact/Vendor claim]. Zero data retention and multi-model routing are "table stakes for regulated buyers" (doc 12 Key finding 15).
4. **Risk transfer through outcome pricing.** Sierra pitches paying for outcomes not tokens, carrying token-cost risk (doc 19 §5) [Vendor claim]. But buyers complain about opaque pricing and unclear outcome definitions (doc 19, Quiq) [Competitor claim].
5. **Speed to live with white-glove delivery.** 27 days to 10 weeks at large firms (doc 12, doc 19) [Vendor claim], delivered by paid strategists and GSIs (doc 19 §6).
6. **Founder and brand credibility.** Taylor and Bavor's backgrounds; JPMorganChase Hall of Innovation (doc 19 §5) [Fact]. Meta's record of shutting enterprise products is cited as the main buyer risk (doc 20 Key finding 5) [Fact, analyst].
7. **Cross-system reach and model neutrality.** Glean wins where firms run Google, Slack, Atlassian and Salesforce beside Microsoft; model choice and cost control by department; "we reduce your AI bill" (doc 21 §5) [Vendor claim/Inference].
8. **It acts on records the company already trusts.** Salesforce agents act on the CRM record (doc 20 §2) [Inference]; SAP and Oracle agents sit on the ERP (doc 20).
9. **Expansion follows proof.** 85%+ of Glean customers in 5+ departments; Harvey median seats double in 12 months (doc 21, doc 12) [Vendor claim/Analyst]. Support → actions → revenue → long-running outcomes (doc 12 Key finding 13).

[Inference] For the founder's 100 to 1,000-staff buyer, items 1, 2, 3 (in reduced form: RLS isolation, ZDR with model providers, audit) and a published price matter most; 5 and 6 cannot be bought and must be replaced by packs, self-serve onboarding and a "paid N days faster" proof on a pilot slice.

---

## Function checklist

Columns: function; who offers it (S = Sierra, D = Decagon, G = Glean, M = Meta Business Agent / Business Agent Platform, plus others where relevant); version (v1, v2, never) for this product; reason. Every function of Sierra, Decagon, Glean and Meta Business Agent named in docs 12, 18, 19, 20 and 21 has a row. "Never" means never for this product, not that the function is bad.

### Sierra

| Function | Who | Version | Reason |
|---|---|---|---|
| Ghostwriter build by prompt from SOPs, transcripts, audio interviews | S | v1 | Core of self-serve onboarding (§3) |
| Ghostwriter ingest of whiteboard photos and zip files of logs/tickets | S | v2 | PDFs and email threads first |
| Review-before-launch of builder output | S | v1 | Builder never ships (§3) |
| Auto-generated simulations on every build or update | S, D | v1 | Gate and regression (§11) |
| Edge-case discovery by builder | S | v1 | Part of draft generation |
| Failure diagnosis with proposed next change | S, D | v1 | Builder Autopilot (§3) |
| Ghostwriter teammate in Slack/Teams with evidence and impact estimate | S, D (Apprentice) | v2 | Email digest in v1 [Inference] |
| Weekly self-reflection, stays quiet unless useful | S | v2 | Polish |
| Always-on monitoring of API outages and metric anomalies | S | v1 | Connector failures break reminders |
| Builder runs and manages A/B tests | S | v2 | Experiments first manual |
| Sessions (chat thread plus pending diff) | S | v1 | Unit of change (§4) |
| Fork, share and parallel sessions | S | v1 | Cheap once sessions exist |
| Builder peer-reviews a colleague's session | S | v2 | Human review first |
| Projects grouping agents with shared data and channels | S | v1 | Internal and external agents share rules |
| Builder applies linter fixes in place | S | v1 | Linter suggests fixes (§4) |
| Journeys (step-by-step instructions or generated from SOPs) | S | v1 | Procedure artifact (§2) |
| Tools and dynamic data references in journeys | S | v1 | Typed tool refs (§2) |
| Agent Traces while building (Preview Chat) | S | v1 | Debugging (§9) |
| Knowledge source management (Help Center, FAQ, policy) | S | v1 | Policies and templates |
| Knowledge gaps auto-detected | S, D (Suggestions) | v2 | Needs volume |
| Expert Answers (articles from human resolutions) | S, D | v2 | Needs volume |
| Integration Library (40+ prebuilt; pick, credentials, publish) | S | v1 | Ledger, email, WhatsApp, processor connectors |
| Custom integration framework | S | v1 | Local accounting systems |
| AI-graded conversation simulations and regression suite | S | v1 | §11 |
| Voice sims (noise, speaker variation, DTMF) | S | never (until voice) | Voice not planned for v1/v2 |
| Branding controls (agent name, logo, colours, welcome) | S | v1 | Email/WhatsApp branding |
| Dynamic updates (promotions, outages) | S | v2 | Low need in collections |
| Multimodality (images, video) | S | v2 | PDF reading is v1; images later |
| Workspaces with automatic versioning | S | v1 | Folded into sessions |
| Numbered snapshots QA → staging → production | S | v1 | §4 |
| Persona Studio (voice samples, mannerisms) | S | never | Voice |
| Accelerators (updatable packs tracked separately from edits) | S | v1 | "Collections basics" pack (§2) |
| Customer-built Accelerators | S (planned) | v2 | After own packs work |
| Agent Checks linter, severity-ranked with fixes | S | v1 | §4 |
| Required simulations as quality gates | S | v1 | §4 |
| Reviewer role with line diffs, comments, request changes | S | v1 | §4 |
| Split-traffic (canary) releases | S, D | v1 | §4 |
| Experiments vs split releases as separate mechanisms | S | v1 | §4, §12 |
| Immutable snapshots and instant rollback | S | v1 | §4 |
| SDK goals and guardrails, declarative | S | v1 | Procedure compiler target |
| Composable skills (triage, respond, confirm) | S | v1 | Built-in step types |
| Tuning flexibility vs determinism per workflow | S | v2 | Default deterministic for writes |
| Build once, deploy to many channels | S, D | v1 | §15 |
| Debugging of API calls and logic traces | S | v1 | §9 |
| Real-time knowledge engine | S | v1 | Retrieval over policies |
| Secure actions on systems of record | S | v1 | Typed write tools |
| Contact-centre handoff with auto summary | S | v1 (as human handoff) | §14 |
| Agents in customer's own SDLC / Git | S, D | v1 | Git-backed procedures |
| Journeys compile deterministically to SDK code | S | v1 | §2 |
| Bypass LLM for exact regulated language | S | v1 | `exact_text` step |
| Custom supervisors per vertical | S | v2 | Default supervisors first |
| Regional policy encoding (UK vs US) | S | v1 | Per-jurisdiction compliance values |
| Voice SDK pacing, interruption, language switching | S | never | Voice |
| Model abstraction (swap models without code change) | S | v1 | Rented models |
| Horizon playbooks toward an outcome | S | v1 | §8 |
| Triggers on behaviour, conversations, milestones | S | v1 | §8 events |
| Suppression (in progress, opted out, irrelevant) | S | v1 | §8 |
| Omnichannel same agent and context | S | v1 | Email + WhatsApp |
| Horizon Advisors next-best timing, channel, step | S | v2 | Rule-based schedule in v1 |
| Consent-aware delivery per customer per channel | S | v1 | §7 |
| Messaging control: autonomy by default, exact wording where needed | S | v1 | §2 |
| Goals and guardrails for human sign-off | S | v1 | §8 |
| Audit of triggers, decisions and suppressions | S | v1 | §8 |
| Browser automation for portals without APIs (Anon) | S, D | v2 | Payer portals later |
| Compliance Console disclosures per channel | S | v1 | §7 |
| Contact windows in recipient local time, split windows | S | v1 | §7 |
| Regional holiday holds | S | v1 | §7 |
| Frequency caps split marketing/transactional | S | v1 | §7 |
| Opt-outs by STOP or voice, stored and accessible | S | v1 (text) | §7 |
| Compliance dashboard: allowed/deferred/blocked/held/opt-outs | S | v1 | §7 |
| Context Engine memory across channels, customer-owned | S | v1 | §13 |
| Memory export to warehouse | S | v1 | Answers lock-in objection |
| Signals re-assessing each customer between conversations | S | v2 | Risk scoring later |
| Next-best-offer personalisation against strategy | S | never | Upsell, not receivables |
| Three memory levels (explicit, configured, captured) | S | v1 | §13 |
| Identity verification before recalling sensitive memory | S | v1 | §13 |
| Insights reporting, custom reports, CSAT/resolution | S, D | v1 | Receivables KPIs instead |
| Automated conversation tagging | S, D | v1 | Cheap |
| Value-discovery and conversation-design experiments | S | v2 | After base experiments |
| Observability auditing (reasoning, sources, systems accessed) | S | v1 | §9 |
| Alerting on abuse or performance drops | S | v1 | §10 |
| Natural-language monitors with defaults | S | v1 | §10 |
| Explorer (NL questions over analytics and samples) | S | v2 | Internal agent answers receivables questions first |
| Experience Manager annotation of daily samples | S | v1 | §9 |
| Voice inbound/outbound, IVR replacement | S, D | never (until voice) | Voice |
| Website chat, mobile app chat | S, D | v2 | Debtor portal later |
| WhatsApp | S, D, M | v1 | Primary messaging channel |
| Apple Business Chat | S | never | Not relevant to B2B in target market [Inference] |
| SMS | S, D | v1 | Escalation channel |
| Proactive outreach | S, D | v1 | Core job |
| Email autonomous branded replies | S, D | v1 | Primary channel |
| Live Assist for human reps | S, D (Assist) | v2 | Handoff summary in v1 |
| Publish agent as ChatGPT App via MCP | S | v2 | Expose company model via MCP instead |
| Per-channel exposure of journeys, data, capabilities | S | v1 | §15 |
| Universal web attachments (maps, forms, charts) | S | never | Not needed |
| Marketplaces (OpenAI, Google, AWS, Stripe) | S | v2 | Distribution later |
| Voice payments by keypad | S | never | Voice |
| Outbound voice: caller ID reputation, voicemail/IVR detection | S, D | never | Voice |
| Tandem Voice (fast talker + reasoner) | S, D (Voice 3) | never | Voice |
| Voice Personas | S | never | Voice |
| Progress indicators / filler lines | S | never | Voice-specific |
| Dual transcription with silence detector | S | never | Voice |
| Certifications (SOC 2, HIPAA, PCI, FedRAMP, ISO 27001/42001) | S | v2 (SOC 2 / ISO 27001 path) | Buyers ask; not day one [Inference] |
| PII encryption and masking | S | v1 | Baseline |
| Filters for off-limits topics | S, D | v1 | Escalation intents |
| Automatic LLM-provider failover | S | v1 | Two rented providers |
| Trust Center with documents on request | S, G | v2 | Sales asset |
| Defence in depth: input supervisor | S | v1 | §5 |
| Output supervisor (block, rewrite, nudge) | S | v1 | §5 |
| Tools withheld until authentication | S | v1 | §5 |
| Output scan for sensitive data | S | v1 | §5 |
| Third-party red teaming at scale | S | v2 | Cost |
| Platform-wide Threat Detection | S | v2 | Per-tenant monitors first |
| Fleming AI-caller detection | S, D | v2 | Personal agents rising |
| PCI-isolated payment path, LLM out of loop | S | v1 (via processor-hosted page) | §6 |
| Card and ACH, autopay, payment plans, card-on-file, receipts | S | v1 (links, plans); v2 (autopay, card-on-file) | §6 |
| Constellation of 15+ models per task | S | v1 (small: 2 to 4 task classes) | Router with failover |
| In-house models (Curie, Fleming, Linnaeus, Darwin) | S | never | Rented models only |
| Provider hedging (fastest valid answer) | S | v2 | Latency matters less on email |
| Personal Agent Protocol | S | v2 | Watch |
| Outcome-based pricing with per-conversation blend | S | v1 (platform fee + success fee) | §16 |
| Regression suite rerun on platform upgrades | S | v1 | §4 |
| tau-bench style end-state evaluation | S | v1 | §11 |
| Speculative retrieval and parallel classification | S | v2 | Latency optimisation |
| Partner programme (GSIs, BPOs) | S | never (v1/v2) | Solo founder |

### Decagon

| Function | Who | Version | Reason |
|---|---|---|---|
| Chat widget with branding, metadata-driven welcome | D | v2 | Debtor portal later |
| Email greetings, signatures, defaults, language detection, routing | D | v1 | §15 |
| Decagon Voice inbound/outbound | D | never (until voice) | Voice |
| Outbound Voice with voicemail and screener handling | D | never | Voice |
| SMS and WhatsApp outreach with payment links | D | v1 | §6, §15 |
| Own dialer | D | never | Voice |
| Personal Agent Gateway and PACT | D | v2 | Watch |
| Decagon Assist copilot for human agents | D | v2 | Summary in v1 |
| Duet Copilot (ask to draft, analyse logs, explain) | D | v1 | §3 |
| AOP generation from prompt, SOP or idea with structural check | D | v1 | §2, §3 |
| Transcript-to-AOP | D | v1 | Past email threads |
| Duet Autopilot with golden set and staged approval | D | v1 | §3 |
| Off-limits procedures for Autopilot | D | v1 | §2 field |
| Duet artifacts, schedulable reports | D | v2 | After core loop |
| Duet Apprentice learning from expert escalations, Slack/Teams | D | v2 | §3 |
| DuetBench benchmarks | D | never | Not needed |
| AOPs (name, entry conditions, steps, content blocks, references, tools, metadata) | D | v1 | §2 |
| Git versioning, code ownership | D | v1 | §4 |
| Guidelines (brand voice, imported guides and glossaries) | D | v1 | §2 |
| Guardrails (voice, escalation, hallucination) and supervisor model | D | v1 | §5 |
| Escalation intents | D | v1 | §2, §14 |
| Tools (API calls, lookups, calculations) | D | v1 | §2 |
| Integrations to helpdesk/CRM, knowledge, telephony; MCP | D | v1 (ledger, email, WhatsApp, MCP) | §1 |
| Partner data integrations (Databricks, Plaid) | D | v2 | Bank feeds later |
| Knowledge base sync and RAG for informational questions | D | v1 | §2 router |
| Snippets (internal non-public notes) | D | v1 | Internal context per debtor |
| User Memory across sessions and channels | D | v1 | §13 |
| Missions (goal, personas, case record, memory re-read) | D | v1 | §8 |
| Agent Modules (packaged journeys incl. collections, team access controls) | D | v1 (one pack) | §2 |
| Campaign Composer (channels, hours, cadence, caps) | D | v1 | §7 |
| Browser Actions | D | v2 | Portals later |
| Agent-detection (counterparty is an agent) | D | v2 | Watch |
| Message Replays | D | v1 | §11 |
| Simulations with checkpoints and rationale | D | v1 | §11 |
| Stale test detection | D | v2 | After suite grows |
| Scheduled recurring test runs, CI/CD, PagerDuty alerts | D | v1 (CI, schedule); v2 (paging) | §11 |
| Conversation-to-test | D | v1 | §9, §11 |
| Experiment Hub (blocks, 20 variants, auto-stop, sticky) | D | v1 (2 to 3 variants) | §12 |
| Version traffic split with per-version reporting | D | v1 | §4 |
| Insights dashboards, heat maps, journey flows | D | v1 (KPIs); v2 (flows) | |
| Tags (custom and intent-based) | D | v1 | Cheap |
| Topic discovery | D | v2 | Volume |
| Ask AI over conversations | D | v2 | Internal agent covers |
| Watchtower (NL QA over 100%, rubrics, Test Watchtower) | D | v1 | §10 |
| Suggestions (knowledge gaps from human resolutions) | D | v2 | Volume |
| Audit Logs (right AOP ran? tool errors?) | D | v1 | §9 |
| Trace View micro-steps with latency | D | v1 | §9 |
| Agent Workbench chat over logs | D | v2 | Builder covers basic case |
| Reasoning timeline in console | D | v1 | Part of trace |
| Chord speech model, Alto conversational model | D | never | Rented models, no voice |
| Decagon Labs research | D | never | Not a solo-founder activity |
| Deployment tiers (multi-tenant, single-tenant VPC, customer VPC, air-gapped, on-prem) | D | v1 multi-tenant only; never air-gapped | Size of buyer |
| Team access controls with admin visibility | D | v1 | Roles (§17) |
| Decagon University and certifications | D | v2 | Short onboarding modules |
| Partner Community | D | never (v1/v2) | |
| OpenAI B2B marketplace listing | D | v2 | Distribution |
| Collections offer: reminders, at-risk check-ins, payday timing | D | v1 | §8 |
| Payment plans and hardship offers | D | v1 | §2 playbook rules, §6 |
| FDCPA/TCPA/UDAAP/Reg F native enforcement | D | never as named (load local rules) | Different jurisdiction [Inference] |
| Wrong-party suppression, sensitive-data redaction | D | v1 | §7 |
| Per-conversation or per-resolution pricing | D | v1 (variant) | §16 |
| Platform fee | D | v1 (low, published) | §16 |
| Per-message router (intent, AOP, else RAG) | D | v1 | §2 |

### Glean

| Function | Who | Version | Reason |
|---|---|---|---|
| 275+ app connectors | G | never at that breadth | 5 to 10 sources needed |
| Connector types: native, push API, partner, web-history | G | v1 native + push API; never web-history | |
| Indexing API / SDK for custom systems | G | v1 | Local accounting systems push data |
| Five data types per connector (content, metadata, identity, permissions, activity) | G | v1 (no activity) | §1 |
| Crawl types (full, incremental, identity, deletion by webhook) | G | v1 | §1 |
| Enterprise Graph (people, projects, customers) | G | v1 (authored, typed) | §1 |
| Enterprise Graph actions for agents | G | v1 | Typed tools over objects |
| Personal graph from activity | G | never | Overkill, privacy cost (doc 21) |
| Saved memories | G | v1 | §13 |
| Learned memories (billable) | G | v2 | |
| Model hub with many vendors | G | v1 (Claude, Qwen) | Stack decision |
| Universal key vs customer key (BYOK) | G | v2 (BYOK) | Larger buyers |
| Auto routing per request | G | v1 | Task-class router |
| Department model policies (Balanced, Frontier, Economy) | G | v2 | |
| Automatic downgrades at 75% and 90% of budget | G | v1 | Cost control is cheap to build |
| Model governance (exclusion, review period, deprecation) | G | v2 | |
| Usage controls per user and department, alerts, limit requests | G | v1 | Wallet (§16) |
| AI gateway and MCP gateway | G | v2 | |
| Assistant Fast vs Thinking modes | G | v1 | Two task classes |
| Assistant: adaptive reasoning, deep research, slides, voice, podcast, image generation | G | never (most) / v2 (deep research) | Not receivables |
| Data analysis in sandbox (spreadsheets) | G | v2 | Internal reports first via metrics |
| Warehouse connections (BigQuery, Snowflake, Databricks) | G | v2 | Larger customers |
| Canvas document editing | G | never | |
| Clarifying questions, plan, deep-linked citations | G | v1 (citations to records) | |
| Meeting notes with transcription consent | G | never | |
| Chat sharing, team chat | G | v2 | |
| Skills and skill reflection | G | v2 | |
| "Update Salesforce opportunities" write action | G | never (as named) | CRM writes later |
| Assistant library of prompts | G | v2 | |
| Agent Builder by NL description | G | v1 | §3 |
| Create agent from an Assistant chat | G | v2 | |
| Flow (workflow) mode | G | v1 | Procedure graph |
| Headless builder (API/code) | G | v1 | Builder agent uses it |
| Git-backed ADLC, branches and merges | G | v1 | §4 |
| Debugging and re-run from a step | G | v1 | §9 |
| Step memory (previous, all, none; `[[step]]` refs; truncation warnings) | G | v1 | Bounds tokens |
| Triggers and schedules | G | v1 | §8 |
| Auto mode agents | G | v2 | |
| Agent library of templates | G | v2 | Packs cover v1 |
| Sharing permissions for agents | G | v1 | Roles |
| Independent agents as own principal | G | v1 | §1 |
| Service credentials per system | G | v1 | §1 |
| Built-in tools (company search, email, people, read doc, respond, think, wait for user input, web search, etc.) | G | v1 subset (search records, read doc, email, wait) | |
| Custom tools; human-in-the-loop for tools; inline execution of write tools | G | v1 | §5 approval gate |
| "Run without user confirmation" per write tool | G | v1 | Promotion of rules |
| Review-and-publish for agents | G | v1 | §4 |
| Agent routing (which agent answers) | G | v2 | One agent per face first |
| Skills roles, sharing, scanning; tool visibility scoping | G | v2 | |
| ADLC six stages, review depth by scope | G | v1 (as guidance) | |
| Golden set four buckets under three profiles | G | v1 | §11 |
| Protect: single tenant, strict permissions, ZDR, SSO/RBAC, audit, oversharing CSV report | G | v1 (RLS isolation, ZDR, SSO, audit); v2 (oversharing report) | |
| Protect+: weekly/continuous sensitive scans, prompt-injection blocking, restricted topics, alignment models | G | v1 (injection blocking via input supervisor, restricted topics); never (100+ source scans) | |
| AWARE security framework | G | never | Not opened, not needed |
| Untrusted-URL monitoring, sensitive-content prompt warning | G | v2 | |
| Enterprise search with filters, facets, home page | G | v2 | Internal Q&A first |
| Knowledge curation (answers, collections, Go links, pins, verification) | G | v1 (verification with owner and expiry on templates) | Guru-style verification |
| People directory, expert search | G | never | Not receivables |
| Surfaces: web app, extension, desktop, mobile, Slack Gleanbot, Companion | G | v1 web + Teams/email; v2 others | |
| Glean Tau desktop agent | G | never | |
| Client APIs (Search, Chat, Agents) metered | G | v1 | API for the company model |
| MCP server, agents as tools, plugins for coding tools | G | v1 (MCP server) | Exposure to other assistants |
| OAuth authorisation server for MCP hosts | G | v2 | |
| Insights for agents, Assistant, LLMs, MCP; insights chat | G | v2 | |
| FlexCredits dashboard by user, product, department, model | G | v1 | §16 |
| Glean Transform (coming soon) | G | never (unknown) | Scope unknown |
| Vertical MCP guides by function | G | never | |
| Knowledge profiles for public/external agents | G | v1 | §1 |
| Access modes indexed / live / hybrid | G | v1 | §1 |
| ACL users, groups, group intersections | G | v1 | §1 |
| Negative permission tests | G | v1 | §1 |
| Glean Hosted vs Customer Hosted | G | v1 hosted only; never customer-hosted | |
| Enterprise Flex (seat + pooled credits) and Core Suite (seat + model hub) pricing | G | v1 (published seat + usage) | §16 |

### Meta Business Agent and Business Agent Platform

| Function | Who | Version | Reason |
|---|---|---|---|
| Answers in customer's language and business tone | M | v1 | Bilingual reminders [Inference] |
| Product recommendations from catalog, closing sales | M | never | Not receivables |
| Appointment booking | M | never | |
| Lead qualification | M | never | |
| Human takeover of any thread | M | v1 | §14 |
| WhatsApp, Messenger, Instagram channels | M | v1 WhatsApp; never Messenger/Instagram for B2B dunning [Inference] | |
| Morning briefing of missed chats | M | v1 (daily digest to controller) | Cheap, useful |
| Market research, product insights, competitive intelligence (announced) | M | never | |
| Calendar connections | M | never | |
| Discovery via WhatsApp search and contact cards | M | never | |
| Away messages and keyword automations paused while agent active | M | v1 (equivalent: pause other automations on a thread owned by agent) | Avoid double messaging |
| Knowledge API: Business Info, FAQs, Files, Websites | M | v1 (business info, files) | Policies and templates |
| Agent instructions and UI instructions ("skills") | M | v1 | Guidelines + channel UI (buttons for "pay now", "dispute") |
| Connectors (base URL, auth) and connector tools (operation schemas) | M | v1 | §1 tool registry |
| Webhooks to the business app | M | v1 | Outbound events |
| Agent events (custom type, description, payload; async; `accepted`) | M | v1 | §8 |
| Handoff policy and message (CUSTOM / AGENT / DEFAULT) | M | v1 | §14 |
| Follow-up policy with fixed intervals (0 to 86,400 s) | M | v1 (as nudge timers) | §8 |
| `ai_audience` EVERYONE / ALLOWLISTED_ONLY and Allowlist endpoint | M | v1 | Pilot mode |
| `never_say_phrases` | M | v1 | §5 |
| Thread control (primary/standby, take, release, handover webhook) | M | v1 | §14 |
| Automatic handoff on low confidence, integrity violation, request | M | v1 (configurable, unlike Meta) | §14 |
| Inbound understanding of text, images, voice notes, reactions, location, buttons, orders | M | v1 text, buttons, images; v2 voice notes | |
| Cannot read documents/video; explicit fallback | M | v1 (must read PDFs; fallback for video) | Remittance PDFs |
| Auto language detection, fallback to primary language | M | v1 | |
| Agent Test (free test messages) | M | v1 | §11 |
| Agent Eval (conversation and turn scores) | M | v1 | §11 |
| Insights endpoint (one conversation at a time) | M | never (too thin); build full analytics | |
| Eligibility endpoint per phone number | M | v1 (check if using Meta agent) | |
| Disable stops all threads; re-enable applies to new threads | M | v1 | §14 |
| Token pricing $2 per million tokens, worked examples | M | v1 (publish worked examples) | §16 |
| Monthly credit line, card billing, 14 currencies incl. MYR | M | v1 (bill in MYR) [Inference] | |
| Excluded verticals (Finance, Government, Health, etc.) | M | constraint | Affects use of Meta's agent, see Contradictions |
| Muse agent, Muse API, Muse Code, Muse for Small Business | Meta | never | Competitor watch; QuickBooks/Stripe connectors |

### Others relevant (Harvey, Fin, big platforms)

| Function | Who | Version | Reason |
|---|---|---|---|
| Ethical-wall permission model | Harvey | v1 (generalised scopes) | §1 |
| MCP tool-call policy engine | Harvey, Microsoft Work IQ | v1 | §5 |
| Connector library with per-user credentials | Harvey | v1 | §1 |
| Review tables (grid of entities × questions with citations) | Harvey | v2 | Bulk analysis of debtor files |
| Playbook rules (standard/fallback/dealbreaker) | Harvey | v1 | §2 |
| Durable ingestion with OCR fallback | Harvey | v1 (remittance PDFs) | |
| Command Center usage analytics | Harvey | v2 | §17 |
| Fin $0.99 outcome definition | Fin | v1 (reference) | §16 |
| SAP eight AR agents decomposition | SAP | v1 feature map | §8 |
| Dispute creation with duplicate and document checks | SAP | v1 | §8 |
| Receivables/payables clearing recommendations | SAP | v2 | Cash application later |
| Cash Processing Agent (receipts from bank lines, remittance matching) | Oracle | v2 | Needs bank feeds |
| Collectors workspace (risk, next-best action) | Oracle | v1 (internal face) | |
| Agent ROI dashboard | Oracle | v1 | §17 |
| AI-proposed reminder schedule approved by human; late-fee suggestion | Intuit | v1 | §8 |
| Per-customer collection plan with channel escalation | Xero | v1 | §8 |
| Agent Script deterministic vs LLM split | Salesforce | v1 (concept) | §2 |
| Test triple topic/action/outcome | Salesforce | v1 | §11 |
| Per-action price unit with wallet | Salesforce | v1 | §16 |
| Agent registry with identity, owner, scope (Agent 365, Control Tower, Workday ASOR) | Microsoft, ServiceNow, Workday | v1 (simple registry) | §1 agent principal |
| Return record IDs from every read | ServiceNow | v1 | §1 |
| Generic verb tools over resource paths | Microsoft Work IQ | v2 | Typed tools first |
| Cache-friendly context (stable prefixes, append-only) | Manus | v1 | Cost |
| Model router to cheapest model above quality bar | Harvey, Sierra | v1 | §5 |

---

## Contradictions and corrections

1. **Sierra release governance source.** Doc 12 knew Agent Checks, Reviewer role and split traffic only via Unite.ai [Vendor claim via secondary]; doc 19 read the primary post (20 Aug 2026) [Fact]. Use doc 19.
2. **Meta Business Agent and Manus.** Doc 12 says Meta's Business Agent details could not be verified and lists "Manus Joins Meta"; doc 20 verified the Business Agent docs and reports the Manus deal was unwound by Beijing (April 2026) and Manus resumed independent operations (1 Sep 2026). Use doc 20.
3. **Fin's owner.** Doc 12 treats Fin as Intercom's; doc 19's competitor table (from Sacra) says Fin was acquired by Salesforce (~$3.6B, Sep 2026) and "Salesforce now owns Fin" [Analyst]. Doc 20's Salesforce section does not mention Fin. Unresolved; treat the acquisition as [Analyst, unconfirmed].
4. **Sierra's deployment role title.** Doc 12: "Product Manager, Agent Development"; doc 19: "Strategist, Agent Development", which "appears to supersede or sit beside" it [Inference in doc 19].
5. **Agent Data Platform vs Context Engine.** Doc 12 uses ADP; doc 19 infers a rename to Context Engine with no announcement found [Inference].
6. **Sierra language counts** differ across its own pages (55+, 58, 60+ locales) and doc 12 says ~60 (doc 19 [Fact, conflict]).
7. **Sierra total funding:** Sacra $1.58B vs Contrary $635M (doc 19). **Decagon:** Sacra's panel ($350M 2026 funding) conflicts with its own text (doc 18); Decagon's ~$100M is dated July 2026 in doc 12/18 and August 2026 in doc 19's table.
8. **Glean connector count:** 100+ (Dec 2025 release) vs 275+ (2026 site) (doc 21); doc 12 quotes 275+ only.
9. **Quiq says Sierra "doesn't support channel switching"**, contradicting Sierra's cross-channel claims (doc 19, competitor claim; treat with caution).
10. **Intuit Payments agent tiers:** the July 2025 note excluded Advanced; the help page now lists it (doc 20).
11. **Sierra outbound payment collection** was "planned" in Oct 2025, while Compliance Console (Oct 2026) names late-payment collection; launch status unverified (doc 19).
12. **Monolith vs multi-agent.** Sierra prefers one monolithic agent per customer (doc 12, secondary); Harvey rebuilt playbook review as orchestrator plus subagents because the chained pipeline lost context (doc 12). Not a true conflict: conversation vs batch document review. This map uses one agent per face plus a batch orchestrator only for internal bulk jobs [Inference].
13. **Stack decision vs vector store evidence.** Harvey found pgvector held ~500K embeddings under 2s vs LanceDB's 15M rows (Feb 2025) and uses Turbopuffer as a read path (doc 12). The founder's stack is Postgres only. [Inference] Receivables data is mostly structured rows, and the knowledge corpus (policies, templates, one firm's email history) is small, so Postgres plus RLS should hold; revisit only if retrieval over large email archives is needed.
14. **Policy engine language.** Harvey embeds Rego in-process via Regorus (Rust) and Microsoft uses OPA/Rego (doc 12, doc 21). The documents give no TypeScript-native option. [Inference] Either OPA compiled to WebAssembly or a small typed evaluator; this is a choice the documents do not settle.
15. **Founder's assumption that a solo founder can deliver what these vendors deliver.** Every enterprise vendor studied is people-heavy (Sierra strategists at GBP 150k–245k, Decagon APM+ADE, contracts from ~$95K to $590K+) (doc 18, doc 19). The documents give no evidence that the same speed is reachable without staff; packs plus the builder agent are the documents' suggested substitute [Inference in docs 12/18/19].
16. **Outcome pricing as the default.** Sierra itself says outcome pricing needs high autonomy and clean attribution or it becomes "an endless debate"; Decagon's glossary concedes disputes (doc 12, doc 18). In collections the customer's own staff also influence payment, so attribution is contested; docs 12 and 19 recommend platform fee plus success component [Inference].
17. **Meta's Finance-vertical exclusion.** Doc 20 infers a manufacturer chasing its own invoices is probably not "Finance" [Inference], but a collection agency, lender or BNPL firm is. Any plan to build on Meta's Business Agent (rather than plain WhatsApp Cloud API templates) must confirm eligibility per number via the eligibility endpoint.
18. **Compliance rules are US-centric.** Decagon's named statutes (FDCPA, TCPA, UDAAP, Reg F) and Sierra's defaults (8am–9pm, US holiday-style rules with European examples) are not Malaysian rules. The engine transfers; the values do not [Inference].
19. **Glean's graph vs the founder's thesis.** Glean's graph is inferred, with no customer-authored objects, metrics or rules (doc 21 Key finding 6); the founder's product is an authored model. Copy Glean's edge metadata and permissions, not its construction method.
20. **Meta's handoff design.** Meta's automatic handoff triggers are not configurable (doc 20); collections needs rule-driven handoff. Copy thread control, not trigger policy.

---

## Gaps

| Item | Source of gap | Importance |
|---|---|---|
| Journey DSL syntax, schema and compiler (Sierra) | doc 12, doc 19 [Unverified] | high |
| AOP v2 syntax, node types, tool schema, roles (Decagon docs behind login) | doc 18 [Unverified] | high |
| How a billable resolution is detected and disputed (Sierra); resolution disputes (Decagon) | doc 12, doc 19, doc 18 | high |
| Malaysian / Southeast Asian collections contact rules (windows, frequency, consent, holidays) | absent from all documents | high |
| Malaysian WhatsApp utility and service message rates after 1 Oct 2026; WhatsApp policy limits on reminder templates | doc 20 [Unverified] | high |
| Whether Meta treats a company chasing its own invoices as "Finance" vertical; authorised-country list | doc 20 [Unverified] | high |
| Payment processors and rails for Malaysian B2B payers (not in documents) | absent | high |
| Sierra Context Engine / Decagon User Memory schema, retention, permissions | doc 12, 18, 19 [Unverified] | medium |
| Sierra permission model beyond Reviewer; audit-log format | doc 19 [Unverified] | medium |
| Decagon Security page, certifications, retention | doc 18 [Unverified] | medium |
| Decagon Autopilot experiment results (5 Nov 2026 post), Agent Modules availability | doc 18 not opened | medium |
| Glean crawl rates and limits sub-pages; knowledge-graph security page; third-generation Assistant | doc 21 not opened | low |
| Glean dollar seat and credit prices | doc 21 [Unverified] | low |
| Xero Payment Follow Ups release date, markets, price | doc 20 | medium |
| Microsoft, Google, Amazon, ServiceNow, Workday details (prior knowledge only) | doc 20 [Unverified] | low |
| SAP AI-unit and Oracle agent pricing | doc 20 | low |
| Salesforce Agentforce collections agent existence; customer numbers after Oct 2025 | doc 20 | low |
| Fin performance guarantee terms; Fin ownership (Salesforce acquisition) | doc 12, doc 19 | low |
| Sierra talk behind ZenML summary (video not watched) | doc 12 | medium |
| Harvey embedding security post; iManage wall extension | doc 12 not opened | low |
| Time to live for Glean; for a self-serve mid-market deployment | doc 21, all | medium |
| Personal Agent Protocol and PACT specs | doc 18, doc 19 not opened | low |
| Independent reviews (G2 etc.) of Sierra, Decagon, Glean | doc 18, 19, 21 | low |

**Research briefs for high items.**

- **Procedure syntax (Sierra journeys, Decagon AOPs).** Goal: find any published field-level description of a journey or AOP so the §2 format copies a real schema rather than an assembly. Pages named in the documents: the Sierra talk at https://www.youtube.com/watch?v=uCKhOmth2ms (source of the ZenML summary, https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents); https://sierra.ai/uk/product/agent-sdk and https://sierra.ai/blog/agent-studio-2-0; Decagon's https://decagon.ai/modules/aops (and its linked "AOP v2 overview and nodes" docs path, login-gated at docs.decagon.ai), https://decagon.ai/resources/aop-copilot and https://decagon.ai/resources/from-sops-to-agent-operating-procedures. As a comparison point with public syntax, read Salesforce Agent Script: https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html. Output: a field list with examples, and whether either vendor exposes step types as an enumerated library.
- **Resolution / outcome definition and disputes.** Goal: a contract-ready definition of a billable outcome for collections and a dispute process. Read https://sierra.ai/blog/outcome-based-pricing-for-ai-agents, https://sierra.ai/blog/outcomemaxxing, https://fin.ai/pricing (published definition), https://fin.ai/guarantee (terms not shown when fetched), https://fin.ai/learn/decagon-ai-pricing (cites Decagon's glossary on billing disagreements; find and read that glossary entry on decagon.ai), and https://www.sacra.com/c/sierra and https://sacra.com/c/decagon/ for pricing mechanics. Output: candidate definitions (e.g. invoice paid within N days of first agent touch with no human contact), attribution rules, and a dispute workflow.
- **Malaysian collections contact rules.** Goal: rule values for the §7 engine (allowed hours, frequency, consent and opt-out obligations, holiday calendar, disclosure wording) for a company collecting its own trade debts, and whether stricter rules apply to licensed collectors. The documents name no source; the researcher must locate primary regulator and statute pages (personal data protection law and any debt-collection conduct guidance) and public-holiday calendars by state. Output: a jurisdiction rule file in the §7 schema, with each value cited.
- **WhatsApp costs and policy for reminders in Malaysia.** Read https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/non-template-messages/ and the template pricing pages it links for Malaysia's utility and service rates after 1 Oct 2026; https://360dialog.com/blog/?p=1433 for the 1,000-free-service-messages detail; https://omdia.tech.informa.com/om146764/the-whatsapp-free-lunch-is-over-and-meta-is-also-coming-for-the-ai-layer for market impact; and Meta's template-category and messaging-policy pages for limits on utility templates used as payment reminders. Output: cost per reminder sequence and any policy limits.
- **Meta eligibility.** Read https://developers.facebook.com/documentation/meta-business-agent/overview (excluded verticals) and the eligibility endpoint description in https://360dialog.com/blog/?p=1433; find Meta's definition of the "Finance" vertical. Output: whether a manufacturer/distributor's own invoice reminders qualify, and the authorised-country list or how to test it.
- **Payment rails for Malaysian B2B payers.** Goal: a processor that offers hosted payment pages or links, instalment plans and webhooks, so §6 hard mode works. The documents name only Stripe as an example (https://sierra.ai/blog/payments) and Stripe/Plaid partnerships; the researcher must identify processors supporting local bank transfer rails and confirm hosted-page and webhook support. Output: two or three options with the fields our tool schema needs.