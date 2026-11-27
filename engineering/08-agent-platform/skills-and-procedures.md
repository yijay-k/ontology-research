# Skills and procedures

**Layer:** [08-agent-platform](README.md) · **What it is:** Capturing a company's procedures as versioned skills/journeys/AOPs, and the builder that writes them.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Other companies and products](#other-companies-and-products) (6) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (3)

## Other companies and products

### Sierra journeys (the declarative language) and how it compiles

> Source: [general-references/12-agent-companies.md § Sierra journeys (the declarative language) and how it compiles](../../general-references/12-agent-companies.md#sierra-journeys-the-declarative-language-and-how-it-compiles)

Plain English. A journey is a no-code description of one customer goal, such as "cancel subscription". It lists the policies to obey, the tools allowed and what to do next, built from blocks rather than a flowchart.

Technical detail:
- Journeys are built from composable building blocks. Sierra contrasts this with sequential workflows and SOP lists, which it says degrade as they grow. The blocks are the same ones engineers use in the SDK. [Vendor claim] https://sierra.ai/blog/agent-studio-2-0
- Journeys are a declarative DSL that compiles deterministically to Agent SDK code, so teams can round-trip between no-code and code, including Git workflows. Journeys have been the main build interface for about 18 months. [Vendor claim, secondary summary of a Sierra talk; the talk itself not watched] https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents
- I found no public syntax, schema or compiler description. [Unverified]

Inference for the founder: the value is the single representation. A business user edits the same artifact engineers version and test. A no-code layer that cannot round-trip to code splits the team.

### Agent Studio and Ghostwriter (25 Mar 2026 to the 2 Nov 2026 redesign)

> Source: [general-references/12-agent-companies.md § Agent Studio and Ghostwriter (25 Mar 2026 to the 2 Nov 2026 redesign)](../../general-references/12-agent-companies.md#agent-studio-and-ghostwriter-25-mar-2026-to-the-2-nov-2026-redesign)

Plain English. Agent Studio is the web app where support and ops staff build, test and release agents. Ghostwriter is an agent inside it that builds and fixes the customer's agent. You upload your SOP PDF and some call recordings, and it drafts the journeys and the tests.

Timeline and mechanics:
- **Agent Studio 2.0 (Nov 2025).** Each person edits in a private workspace. Journeys, configuration and simulations are versioned automatically. Ready changes combine into numbered snapshots that move QA, then staging, then production, with full history and instant rollback. The Integration Library flow is: pick an integration, add credentials and endpoints, publish. The connection then exposes tools usable in both Studio and the SDK, and developers can write their own. [Vendor claim] https://sierra.ai/blog/agent-studio-2-0
- **Ghostwriter launch (25 Mar 2026, "Agents as a Service").** Inputs: SOPs, process documents, call transcripts, whiteboard photos, audio and plain-English goals. It identifies key behaviours and edge cases. It edits journeys, writes integrations, creates simulations and triages issues, testing changes in a sandbox before they go live. To make this possible Sierra rebuilt itself as headless infrastructure that Ghostwriter operates through an agent harness (tools, memory, planning, context). [Vendor claim] https://sierra.ai/blog/agents-as-a-service. It also ingests PDFs, recordings and zip files of logs, tickets and training documents. [Vendor claim] https://sierra.ai/blog/how-customer-teams-became-software-builders
- **Teammate mode (28 Sep 2026).** Ghostwriter joins a Slack or Teams channel. It reports trends on request, proactively suggests experiments, and announces when an experiment reaches statistical significance. It reflects weekly on its engagement and stays quiet unless it has something useful to say. In one example it replaced a week-long manual call review: it proposed three changes, estimated how many customers each would help, and recommended two. [Vendor claim] https://sierra.ai/blog/ghostwriter-ai-tool-to-teammate
- **Redesign (2 Nov 2026, "Redesigning Agent Studio around Ghostwriter").** Each piece of work is a session: a chat thread holding both the conversation and the changes. Changes stay in the session until someone reviews and merges them. Sessions can be shared, forked and run in parallel. Ghostwriter can review a colleague's changes before merge. The UI offers line-by-line diffs, Preview Chat and Simulations. Projects group related agents with their shared data and channels for joint testing and release. In the lender example, one change to document requirements updates both the document-collection agent and the loan-tracking agent. The redesign replaces Explorer, Sierra Assistant and other specialised helpers. [Fact] https://sierra.ai/blog/redesigning-agent-studio-around-ghostwriter
- **Release governance** (reported by Unite.ai from a Sierra post titled "Release Governance Guardrails for Agents at Scale", which I did not open). Agent Checks is a static analyser that flags issues in journeys and the conversations they produce, ranks them by severity and usually suggests a fix. Organisations can require simulations to pass before production. A Reviewer role names who must approve (CX lead, compliance, engineering manager). Approved releases can go out on split traffic, and every release is an immutable snapshot. [Vendor claim via secondary] https://www.unite.ai/es/sierra-puts-ghostwriter-at-the-center-of-agent-studio-workflows/
- **Performance review (18 Nov 2026).** Customers ShipStation, Carta, Tilt, Airtable and Imprint describe a detect, root-cause, fix-with-tests, follow-up loop. Carta's case: it flagged that the chat agent was failing to create support cases, listed the affected customers and later confirmed recovery. No numbers are given. [Vendor claim] https://sierra.ai/blog/ghostwriters-performance-review
- **Accelerators (5 Nov 2026).** These are prebuilt packages added to an agent: greetings, multilingual handling, name matching, CSAT collection; retail order tracking and returns; banking transaction search, dispute status and lending guardrails; healthcare scheduling, patient authentication and an urgent-call guardrail; telecom retention and billing; insurance quoting and first notice of loss. Unlike templates, they receive updates. Changes are tracked separately from the customer's own edits and reviewed before they are applied. Customer-built Accelerators are planned. [Vendor claim] https://sierra.ai/blog/accelerators

### Harvey: playbooks, the most direct "company rules" capture

> Source: [general-references/12-agent-companies.md § Harvey: playbooks, the most direct "company rules" capture](../../general-references/12-agent-companies.md#harvey-playbooks-the-most-direct-company-rules-capture)

- Each playbook rule holds a standard position, acceptable deviations (fallbacks), unacceptable deviations (dealbreakers), guidance, and an "optional" flag. Shared context: represented party, whose paper, negotiation strictness, deal instructions, precedents. [Fact] https://www.harvey.ai/blog/rebuilding-playbook-review-as-a-multi-agent-system
- Architecture (2 Sep 2026). An orchestrator spawns one subagent per rule, up to dozens in parallel. Each subagent classifies compliance, picks a position and drafts edits on its own branch of a versioned document model where every component has an ID. Edits are tracked changes tagged with the rule that produced them. Branches merge like version control, and collisions go to the orchestrator. A final validation pass confirms every rule was classified. Results: risk classification 59% to 77%, redline rubric 53% to 87%, latency 2.6 to 3.8 minutes. Redlines were judged by a committee of three frontier models. Engineering: per-phase timeouts, retrying only the failed rules, concurrency caps, prompts ordered for prefix-cache hits, streaming per rule, per-phase model choice. [Fact] same URL

### 3.1 The AOP: what is in one

> Source: [general-references/18-decagon.md § 3.1 The AOP: what is in one](../../general-references/18-decagon.md#31-the-aop-what-is-in-one)

Plain English: an AOP is the written instruction a supervisor would give a new hire for one kind of request ("replace a lost card"), with the hard parts (look up the account, block the card, order a new one) wired to real system calls. Example in Decagon's own words: return a broken item and ship a replacement to a new address means verify order, confirm policy applies, process return, update address, arrange replacement. [Vendor claim] https://decagon.ai/resources/from-sops-to-agent-operating-procedures

Published components [Vendor claim] https://decagon.ai/modules/aops :
- **Name** (required).
- **Entry conditions**: when the agent should select this AOP. These are what the router matches against extracted intent.
- **Steps** in natural language. Decagon's SOP-conversion guide says each step has a trigger and action, lists the data it needs (customer ID, order number, account status), and that decision points, success criteria and escalation points are explicit; sensitive actions (refunds, account changes) carry explicit validation requirements. https://decagon.ai/resources/from-sops-to-agent-operating-procedures
- **Content blocks** for conditional logic.
- **References** that let the agent act or pull information from external sources.
- **Tools**: custom logic run in real time (API calls, lookups, calculations).
- **Metadata**: customer context such as location, role, product tier.
- **Experiment blocks** (since Oct 2026) holding variants and traffic split. https://decagon.ai/blog/experiment-hub

Docs paths reveal the current form is "AOP v2", whose overview page is titled "overview and nodes", and the Workbench post talks about "why an AOP node executed". So an AOP is now a set of typed nodes (a graph or structured list), not one prompt. [Fact for path names; Inference for the graph] https://decagon.ai/modules/aops ; https://decagon.ai/blog/agent-workbench. The AOP Copilot post confirms a fixed "library of workflow step types" and a structural validator run before production. [Vendor claim] https://decagon.ai/resources/aop-copilot. Trace View says each step shows inputs, reasoning, outputs and a "transition to the next step", which fits a state machine with LLM-chosen transitions. [Vendor claim; Inference] https://decagon.ai/blog/decagon-trace-view

How natural language and code combine: CX teams write steps; engineers add code-level controls for critical operations (refunds, identity checks), guardrails and integrations; language handles messy input, deterministic code executes the critical action. The SOP guide describes AOPs as compiling into "structured logic". [Vendor claim] https://decagon.ai/resources/from-sops-to-agent-operating-procedures ; https://decagon.ai/modules/decagon-platform. Exact syntax (how a tool is referenced in a step, variable notation) is behind the docs login. [Unverified]

### 2.2 Duet (the AI builder and improver)

> Source: [general-references/18-decagon.md § 2.2 Duet (the AI builder and improver)](../../general-references/18-decagon.md#22-duet-the-ai-builder-and-improver)

| Function | What it does | Status / date |
|---|---|---|
| Duet Copilot | Ask Duet to answer questions or act: draft AOPs, build simulations, analyse a conversation's logs (AOP selection, tool calls, model responses), explain and suggest fixes. | GA. https://decagon.ai/modules/duet ; https://decagon.ai/modules/debugging |
| AOP generation (formerly AOP Copilot) | Generates a production AOP from a prompt, an SOP, or a rough idea; knows the library of step types and how they connect; checks structural soundness before production; applies Decagon's writing standards. | AOP Copilot blog 23 Sep 2025, now folded into Duet. https://decagon.ai/resources/aop-copilot |
| Transcript-to-AOP | Drafts happy paths and edge cases from past conversations; one builder generated a full AOP set from 25,000 transcripts. | GA. https://decagon.ai/modules/duet |
| Duet Autopilot | Background mode: reads scheduled reports, turns opportunities into AOP edits, tests against the source conversation plus an auto-maintained golden set, stages in a versioned workspace with diffs for approval; teams can declare off-limits procedures; configured in the Duet toolbar under "Vault and Autopilot". | Launched 9 Jun 2026; validated in live experiments per 5 Nov 2026 post (not opened). https://decagon.ai/blog/autopilot ; https://decagon.ai/modules/duet |
| Duet artifacts | Any output saved as a shareable artifact (e.g. "hillclimbing report": executive summary, dashboard, next steps), schedulable (weekly hillclimbing, monthly guardrails audit). | GA. https://decagon.ai/modules/duet |
| Duet Apprentice | Learns the business from internal resources and expert-handled escalations; drafts AOPs, runs simulations; Slack and Teams plugins follow discussions, draft AOP updates when tagged, ask clarifying questions; data stays in the customer's workspace. | Announced Oct 2026, availability not stated. https://decagon.ai/blog/dialogues-2026 |
| DuetBench / DuetBench-2 | Decagon's own benchmarks for self-improving CX agents. | 9 Jun and 9 Sep 2026 (titles only, not opened). https://decagon.ai/blog |

### 3.4 Knowledge capture

> Source: [general-references/18-decagon.md § 3.4 Knowledge capture](../../general-references/18-decagon.md#34-knowledge-capture)

Three channels into the agent's "company model" [Vendor claim]:
- Documents: help centre, Confluence, Contentful, Kustomer, ticket history, auto-synced; snippets for internal notes. https://decagon.ai/modules/knowledge-base ; https://decagon.ai/product/integrations
- Procedures: AOPs drafted by Duet from SOPs or transcripts, edited by CX staff; Duet Apprentice learns from internal docs, expert escalations and Slack/Teams threads. https://decagon.ai/modules/duet ; https://decagon.ai/blog/dialogues-2026
- Rules: guidelines (imported brand guides and glossaries), guardrails, escalation intents; code in tools for hard rules. https://decagon.ai/modules/customizations
- Gaps fed back: Suggestions drafts articles from human resolutions of escalated cases, monthly. https://decagon.ai/product/suggestions
- Enterprise data: Databricks partnership (30 Sep 2026) for "enterprise context". [Title only] https://decagon.ai/blog

## Research literature

### 5. Skills and procedural knowledge

> Source: [general-references/10-papers-agents-memory-eval.md § 5. Skills and procedural knowledge](../../general-references/10-papers-agents-memory-eval.md#5-skills-and-procedural-knowledge)

**Plain English.** A skill is a folder that teaches the agent how to do one job, for example "month-end accrual report": instructions, a template, and a script that pulls the numbers. The agent sees only the one-line description until the job comes up.

**Agent Skills** (Zhang, Lazuka, Murag, 16 Oct 2025; open standard from 18 Dec 2025) [Fact, https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills; https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview]:
- A skill is a directory with `SKILL.md`. YAML frontmatter has `name` (at most 64 characters, lowercase, digits and hyphens, no "anthropic" or "claude") and `description` (at most 1,024 characters, saying what the skill does and when to use it).
- Three-level disclosure. Metadata, about 100 tokens per skill, is always loaded. The body, under 5k tokens, loads on trigger. Bundled files and scripts load only when referenced. Scripts run via bash, and only their output enters context, which makes deterministic parts deterministic.
- On the API, skills run in the code-execution container with no network and no runtime package installs. Versions are uploaded via `/v1/skills`. Skills are workspace-scoped on the API, and there is no sync across surfaces.
- Security: a malicious skill can exfiltrate data, so audit it like software.

**Voyager** (Wang et al., arXiv 2305.16291, 2023). It combines an automatic curriculum, a growing library of executable code skills retrieved by description, and iterative prompting with execution errors and self-verification. It reported 3.3x more unique items, 2.3x longer distances and up to 15.3x faster tech-tree milestones [Fact, https://arxiv.org/abs/2305.16291]. Lesson: store verified procedures as code that can be retrieved and composed, and add a procedure to the library only after it has passed verification.

**SOP compilation in customer-service vendors.**
- Decagon "Agent Operating Procedures" (AOPs): I could not open the AOP docs or blog pages [Unverified]. DuetBench (9 Jun 2026) shows the operational wrapper. Simulated deployments contain AOPs, tools, guardrails and synthetic traffic. A build task (creating an AOP plus tools from messy design docs) passes only if every associated simulation passes. Decagon reports Autopilot passed 45.5% of build tasks against 23% for certified humans within 3 hours, and simulation accuracy rose from 58% to 88% after self-critique [Vendor claim, https://decagon.ai/blog/duetbench].
- Sierra Journeys: natural-language definition of goals and guardrails for non-engineers, giving the same control as the code-based Agent SDK [Vendor claim, https://sierra.ai/blog/agent-os-2-0]. Execution semantics are not published in what I read.
- OpenAI's guide: derive instructions from existing SOPs and policy docs, break them into small steps, map each step to an action, and capture edge cases [Fact, OpenAI guide].

**ACE (Agentic Context Engineering)** (arXiv 2510.04618) treats contexts as evolving playbooks curated by generator, reflector and curator roles with incremental updates. I could not open it this session [Unverified]. It is relevant if the product auto-evolves procedures.

**Takeaway** [Inference]. Represent each company procedure, such as "issue a refund over RM 500", as a skill: a natural-language body plus links to the company-model actions and rules it uses, plus scripts for deterministic sub-steps. Gate publication on a simulation suite, as in Decagon's "all simulations pass". Version skills, and inject only their metadata.

## Design decisions already in the reference maps

### 17. Skills and procedures

> Source: [general-references/32-map-research-and-cost.md § 17. Skills and procedures](../../general-references/32-map-research-and-cost.md#17-skills-and-procedures)

**Purpose.** Package each collections procedure, for example "dunning sequence for a strategic account" or "handle a disputed invoice", as an executable skill the agent loads only when needed.

**Design to implement.**
- A skill is a folder containing `SKILL.md` and optional scripts.
  - Frontmatter: `name` (at most 64 characters; lowercase, digits, hyphens) and `description` (at most 1,024 characters, saying what the skill does and when to use it).
  - Body under 5k tokens. It references company-model actions and rules by ID; it does not restate them.
  - Scripts handle deterministic sub-steps; only their output enters context.
- Only metadata (about 100 tokens per skill) is injected.
- Skills are versioned. A version publishes only when every linked simulation task passes (section 19).
- Skills are audited like software: a malicious skill can exfiltrate data.
- Source: derive skills from the customer's existing SOPs. Break each into small steps and map each step to an allowed action.

**Evidence.**
- Progressive disclosure: about 100 tokens of metadata, body under 5k, bundled files free until used (Agent Skills docs).
- Voyager's verified skill library gave 3.3x more unique items and up to 15.3x faster milestones (arXiv 2305.16291).
- [Vendor claim] Decagon DuetBench: AOP build tasks pass only if all simulations pass. Autopilot passed 45.5% against 23% for certified humans; simulation accuracy rose from 58% to 88% after self-critique.
- [Vendor claim] Code execution with MCP: 150k → 2k tokens. All from document 10, section 5.

**Copies.** Document 10, section 5 and "What to copy" item 8. https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview ; https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills ; https://arxiv.org/abs/2305.16291 ; https://decagon.ai/blog/duetbench

**Left out.** Auto-evolving playbooks (ACE was not read); Decagon AOP internals (not reachable).

**Open questions.**
- How natural-language procedures compile to executable steps at Decagon or Sierra is unpublished or unread.
- The API skill container has no network and no runtime installs; the documents don't say whether that suits a Qwen path.

### 2. Capturing the customer's procedures, and the file format

> Source: [general-references/34-map-agent-companies.md § 2. Capturing the customer's procedures, and the file format](../../general-references/34-map-agent-companies.md#2-capturing-the-customers-procedures-and-the-file-format)

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

> Source: [general-references/34-map-agent-companies.md § 3. The builder agent (documents and conversation to configuration)](../../general-references/34-map-agent-companies.md#3-the-builder-agent-documents-and-conversation-to-configuration)

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

## Open-source implementations (added 28 Nov 2026)

- [anthropic-skills](../../open-source-references/anthropic-skills.md) — SKILL.md format; spec now at agentskills.io.

## Other companies (updated 28 Nov 2026)

- **Sierra:** Agent Studio was redesigned around Ghostwriter on 2 Nov 2026 — investigation, journey editing and testing in one conversation, with evidence, changes and test results kept together for review before go-live; Ghostwriter launched 25 Mar 2026 and became a proactive Slack/Teams teammate on 28 Sep 2026. Source: https://sierra.ai/jp/blog/redesigning-agent-studio-around-ghostwriter
- **Decagon:** Duet now writes more than 70% of the AOPs running on the platform (Oct 2026); AOPs are natural-language procedures that compile into validated workflows, versioned with Git. Sources: https://decagon.ai/blog/duet-apprentice , https://decagon.ai/product/aop

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **SOP executor (AgentScope, Apache-2.0, code):** `SOPStep(subject, description, executor, …)` with a run state that outlives the process — [`agentscope-ai/agentscope` → `src/agentscope/sop/_schema.py`](https://github.com/agentscope-ai/agentscope/blob/b76f272/src/agentscope/sop/_schema.py).
- **Runbook packaging (UModel, code):** a `RunbookSet` groups `observations`, `actions`, `toolkits`, `knowledge`, `automations`, `skills` (following the Agent Skills specification) and `terms` for one domain — [`alibaba/UnifiedModel` → `schemas/core/dataset/runbook_set.schema.yaml`](https://github.com/alibaba/UnifiedModel/blob/5cd06e9/schemas/core/dataset/runbook_set.schema.yaml). An observation pairs a `phenomenon` (query / action / dashboard / event) with `conclusions`. This is a ready shape for "role-packaged" agents.

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed (code)** — AgentScope SOP module present at b76f272. **New** — UModel RunbookSet packages skills per the Agent Skills spec. **New** — AIP Analyst now loads admin-enabled skills (Oct 2026). Source: https://www.palantir.com/docs/foundry/announcements/2026-10/

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
