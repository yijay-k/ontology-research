# Legal

**Layer:** [13-domain-packs](README.md) · **What it is:** The legal-market pivot: candidate objects and workflows, what must not change, and the law-firm interview guide.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Other companies and products](#other-companies-and-products) (3) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (3)

## Other companies and products

### Harvey: company, products and business model

> Source: [general-references/12-agent-companies.md § Harvey: company, products and business model](../../general-references/12-agent-companies.md#harvey-company-products-and-business-model)

Plain English. Harvey is an AI workspace for lawyers. A partner drops a data room into Vault and asks for a change-of-control memo. Harvey reads every contract, fills a table (one row per document, one column per question), and drafts the memo with sentence-level citations.

Business:
- Sacra estimates: ARR above $100M in Aug 2025, about $195M at end-2025, above $400M in Aug 2026. 1,500+ customers in 60+ countries and 142,000+ lawyers. Pricing about $1,200 per lawyer per month, 12-month terms, about 20-seat minimums; accounts start with a few hundred seats and the median seat count doubles within 12 months. Custom model development fees exist. [Analyst estimate] https://sacra.com/c/harvey/
- 9 Sep 2026: $550M at a $15.5B valuation. Harvey says 80% of the Am Law 100 and five of the Fortune 10 use it. [Vendor claim] https://www.harvey.ai/blog/harvey-raises-dollar550m-at-a-dollar155b-valuation-to-help-legal-teams-own-their-intelligence
- Scale: 700,000+ tasks a day and 50M+ terms extracted a week (Apr 2026). [Vendor claim] https://harvey.ai/blog/two-types-of-legal-work-one-agentic-platform. Document processing grew from about 0.94M documents a week to 24.8M (56 TB) a week, about 3.5M a day (Jul 2026). [Vendor claim] https://www.harvey.ai/blog/scaling-document-processing-across-harvey
- Model history: Harvey built a proprietary vertical legal model, then dropped it when frontier models beat it on BigLaw Bench. It moved to agentic workflows chaining multiple LLMs and added a Model Selector (Anthropic, Google, OpenAI). [Analyst] https://sacra.com/c/harvey/. In Aug 2026 it previewed "Harvey Tenet", a post-trained open-weight model (not opened). [Fact, listing] https://www.harvey.ai/en-US/blog/tag/technical
- Product surface (Apr 2026 navigation): Agents, Vault, Knowledge (legal, regulatory and tax research), Spaces (secure shared workspaces, including with clients), Command Center, Memory, Review Tables, Legal Work Orchestration; apps Contract Intelligence, Horizon Scanning, Intake, Facts & Chronologies; Connector Library. [Fact] https://www.harvey.ai/blog/autonomous-agents-legal-is-next
- Sacra counts 500+ use-case agents, 25,000+ custom agents built by legal teams, and a no-code Agent Builder from March 2026. [Analyst] https://sacra.com/c/harvey/
- Command Center (20 May 2026, early access): usage analytics by practice group, peer benchmarks from 1,500+ deployments, natural-language Q&A over the firm's own usage, one-prompt reports, and recommendations of features peers use. [Vendor claim] https://www.harvey.ai/blog/introducing-command-center
- Contract Intelligence for in-house teams (May 2026): announcement post not opened. [Unverified details] https://www.harvey.ai/blog/introducing-contract-intelligence

### Harvey: from assistant to agents

> Source: [general-references/12-agent-companies.md § Harvey: from assistant to agents](../../general-references/12-agent-companies.md#harvey-from-assistant-to-agents)

- Two kinds of agentic work. Repeatable structured work (checklists, extraction across hundreds of documents) encodes a firm's best practice. Long-horizon work (diligence, fund formation): the agent proposes a plan, the lawyer edits it, and the agent pauses before high-stakes decisions. [Vendor claim] https://harvey.ai/blog/two-types-of-legal-work-one-agentic-platform
- Cloud agents (1 Jun 2026). An agent can review a data room of hundreds of thousands of documents and produce a first-pass issues list. Harvey built its own runtime with three requirements. Multi-model: conflicts, quality differences on LAB, and platform risk; model choice becomes a routing decision. Zero data retention: sandboxes use transient disks purged at teardown, and agent state is session-scoped. Cost: each task goes to the cheapest model above a quality bar, including self-hosted open-source models, giving 3 to 5x lower cost than frontier-only. [Vendor claim] https://www.harvey.ai/blog/why-we-built-our-own-cloud-agent-infrastructure
- Internal agent "Spectre" is triggered by incidents, bug reports, feedback and Slack messages. The post proposes the legal matter as a "world model" for teams of agents. [Vendor claim] https://www.harvey.ai/blog/autonomous-agents-legal-is-next
- Harness engineering (Apr 2026). A loop where the agent attempts the task, an LLM judge scores it against the rubric, and a coding agent clusters the failures and edits the harness (skills, stop hooks, fact sheets, file conversion). On 12 LAB tasks the average rose from 40.8% to 87.7%. Harvey calls it a small experiment. [Fact, reporting] https://www.artificiallawyer.com/2026/04/07/harvey-drives-legal-agent-learning-via-harness-engineering/

### Harvey: review tables and the review algorithm

> Source: [general-references/12-agent-companies.md § Harvey: review tables and the review algorithm](../../general-references/12-agent-companies.md#harvey-review-tables-and-the-review-algorithm)

- The review table is a grid: rows are documents, columns are questions. A cell holds the answer, the reasoning and citations, and rows can be assigned, verified or locked. [Fact] https://www.harvey.ai/blog/making-review-tables-faster-and-more-reliable
- Algorithm rebuild (21 Apr 2026). The output changed from summary plus context to answer plus reasoning, and citations moved from cell-level to sentence-level indices. Attorney side-by-side tests showed 4x overall preference and 7x on credit agreements and trial exhibits. A 30-column, 1,000-document table means 30,000 concurrent cells. The evaluation datasets were built by internal legal researchers, and nobody sees real customer queries. [Vendor claim] https://www.harvey.ai/blog/rebuilding-harveys-review-algorithm
- Storage rebuild (22 Oct 2026). Postgres holds metadata and is the source of truth. Raw customer data lives in segregated Azure blobs. Turbopuffer is the read path (CQRS). Paging is ID-based (the backend returns ordered row IDs and the client fetches rows by ID). Non-string LLM outputs are stored twice, typed and as a string. If drift is detected, reads fall back to Postgres and a backfill repairs the index. Speedups range from 1.2x (under 1K cells) to 5.8x (10K to 100K cells). [Fact] same URL

## Earlier engineering notes (Phase 2)

### 5. Legal pivot: what changes and what must not change

> Source: former `01-reference-architecture/original-research-architecture.md` (moved here in the Nov 2026 restructure)

The later product direction prioritised the lawyer/law-firm market. The pivot should be expressed as a domain pack on the same platform—not a new generic “legal RAG” architecture.

#### Platform invariants to retain

- Firm/tenant isolation and explicit matter/resource scope.
- Versioned object types and relationships.
- Source-system ownership, ingestion checkpoints and provenance.
- Typed queries, deterministic metrics/rules where applicable.
- Permission checks over documents, extracted facts, chunks, embeddings, summaries, caches, agent tools and workflow state.
- Typed action registry, approvals, audit, outbox, durable workflow and agent release controls.

#### Legal domain objects to validate

Potential initial vocabulary: Firm/Tenant, Principal, Team, Client, Party, Contact, Matter, MatterMembership, Document, DocumentVersion, EvidenceSpan, ExtractedAssertion, Clause, LegalIssue, Obligation, Deadline, Task, WorkProduct, Approval and Activity. Do not freeze this schema before a real workflow interview.

Legal has an additional authorization boundary beyond ordinary tenant membership: matter-level access and ethical walls. The system must be able to deny a matter even when a user belongs to the firm or a broad practice group.

Extracted assertions must remain evidence-linked and reviewable. An LLM extraction is a candidate, not an authoritative obligation or legal conclusion. Every accepted claim needs an exact source document version and span, reviewer/provenance and applicable effective dates.

The first legal workflow is still a hypothesis: evidence-linked matter Q&A or obligation/deadline extraction, followed by a reviewed action such as creating a task or drafting a deadline entry. The law-firm interview must decide which workflow is frequent, costly, risky and fundable.

#### Strategy decision that remains open

| Question | Original baseline | Current direction | Decision gate |
|---|---|---|---|
| First vertical | Receivables and collections | Legal/law firms | Compare interview evidence, buyer access, willingness to pay and time-to-value |
| Domain model | Customer, Invoice, Payment, Promise, Dispute, Case | Matter, Party, Document, Evidence, Obligation, Deadline | Keep domain vocabularies in packs; share the platform kernel |
| Market assumption | 100–1,000 staff companies | Not yet validated for law firms | Define by firm size, matter volume, document volume, practice area and budget—not headcount alone |
| Initial workflow | Collections operations | Evidence Q&A or obligation/deadline workflow candidates | Select one observed workflow, not a feature catalogue |

Do not erase the receivables analysis when pivoting to legal. It remains a useful structured-data and action-safety benchmark, but it is no longer automatically the first commercial product.

### Legal domain pack — research brief

> Source: former `13-domain-packs/legal/README.md` (moved here in the Nov 2026 restructure)

#### Purpose

Use legal workflows as the first vertical test of the general ontology. The domain pack should model legal operations, not make legal conclusions automatically.

#### Candidate core objects

Client, Organisation, Matter, Engagement, Party, Person, Lawyer, Team, Court, Jurisdiction, Contract, Clause, Document, Version, EvidenceItem, Citation, Authority, Case, Obligation, Deadline, Filing, Hearing, Task, Approval, RiskIssue, Invoice, TimeEntry and Communication.

#### Candidate relationships

Client owns Matter; Matter has Parties; Matter assigned to Team/Lawyer; Matter contains Documents; Document supersedes DocumentVersion; Document cites Authority; Clause creates Obligation; Obligation has Deadline; EvidenceItem supports/contradicts Claim; Matter has Court/Jurisdiction; Filing relates to Court/Matter; Invoice bills Client/Matter.

Every relationship should have source, scope, valid time, recorded time, access policy and evidence/provenance. “Person is counsel for Client” may be date-bounded and matter-specific rather than global.

#### Candidate workflows

Matter intake and conflict check; document intake and classification; due diligence; contract review; clause extraction and obligation tracking; legal research with source citations; filing/deadline preparation; review/approval; client communication; matter close and retention.

#### Safety boundary

Agents can summarise, retrieve, compare, draft and propose. Actions that bind clients, file documents, send legal advice, change deadlines or approve contractual positions must be subject to role-specific policy and human approval. Do not represent a model's extracted clause/obligation as authoritative without source citation and review state.

#### Competency questions

- Which obligations in this matter have deadlines in the next 14 days, and what source clause establishes each one?
- Which contract versions contain a change in limitation of liability?
- Who may access this matter's documents, and why?
- Which claims in this draft are unsupported by the evidence bundle?
- What documents supersede an earlier version, and when did the new terms become effective?
- Which deadlines are business-valid versus recorded/updated by staff?

Harvey's public product surface is a vertical workflow reference (Agents, Vault, Knowledge, Workflows, Spaces, Contract Intelligence), but its private internal ontology is not publicly established by those descriptions.

### Law-firm workflow interview guide

> Source: former `13-domain-packs/legal/law-firm-interview-guide.md` (moved here in the Nov 2026 restructure)

**Purpose:** exploratory workflow discovery for the conversation on Sunday, 29 November 2026. This guide is for learning how work is actually done. It is not a pitch, a product specification or a claim that the firm has any particular pain point.

#### Opening and boundaries

Explain that the goal is to understand workflows and test whether software could remove administrative friction. Ask permission before taking notes. Do not request client names, privileged advice, confidential documents, case strategy or personal data. Ask for anonymised examples and process descriptions only. Do not record the conversation without consent.

Suggested opening:

> I’m exploring how legal work moves through a firm—from receiving a matter and documents, through research/review, to approvals and client communication. I don’t need confidential case details. I’m trying to understand the process, where people spend time, what systems are used, and what mistakes are costly.

#### Interview sequence

##### 1. Understand the role and type of work

- What kind of work takes most of your time in a normal week?
- Which practice areas or matter types have the most repeatable workflows?
- What does a typical matter look like from first contact to closure?
- Which roles touch the work: partner, associate, paralegal, clerk, finance, client, external counsel?

##### 2. Walk one anonymised matter from start to finish

Ask the interviewee to choose a representative, non-confidential example and walk through:

- How the firm first receives an enquiry or instruction.
- How conflict checks, client onboarding and engagement approval happen.
- Where documents arrive and how they are named, classified, versioned and stored.
- How research, drafting, review and redlining are assigned.
- How deadlines, court dates, obligations and follow-ups are tracked.
- Who reviews, approves and sends work to the client or court.
- How billing, time recording, matter closure and retention work.

For every step ask: **Who does it? What triggers it? What information is needed? Which system is used? What is copied manually? What happens when it fails?**

##### 3. Find high-friction tasks without leading the witness

- Which task is repetitive but still requires careful checking?
- Where do people re-enter the same information in more than one system?
- What is hard to find when a matter gets large?
- What causes avoidable waiting, rework or missed handoffs?
- Which tasks are difficult to delegate to a junior colleague?
- Which errors are embarrassing, expensive or high-risk?
- What work gets postponed because it is administratively painful?

Do not assume document review, drafting or research is the top pain. Let the interviewee rank the problems.

##### 4. Documents, evidence and knowledge

- How do you identify the current authoritative version of a document?
- How do you trace a statement in a draft back to a source document, clause, case or authority?
- How are client-specific precedents and prior work reused?
- How do you know whether a source is current, superseded or no longer reliable?
- What happens when two documents conflict?
- Can staff quickly identify who may read a document or matter, and why?

##### 5. Deadlines, obligations and approvals

- How are dates extracted and checked against the source?
- Who owns a deadline and who confirms it?
- Which events create a new obligation or follow-up task?
- How are reminders escalated when someone is away?
- What approvals are mandatory before sending, filing, advising or changing a contractual position?
- Which actions must always remain with a qualified lawyer?

##### 6. Current systems and workarounds

- Which practice-management, document-management, email, time/billing, research and collaboration tools are used?
- Which integrations work well and which are manual?
- What do people keep in spreadsheets, personal notes or email threads?
- Is there a system the firm would never replace? Why?
- What data is difficult or risky to export?

##### 7. AI appetite and guardrails

- Have people tried AI tools? For which tasks, and what worked or failed?
- What information can never leave the firm's environment?
- What source citations, audit trail and review controls would be required?
- What is acceptable for an AI assistant to draft versus execute?
- Which workflows could tolerate an incorrect first draft, and which cannot tolerate an incorrect result?
- What would make the firm trust or reject an AI-generated summary or extracted obligation?

##### 8. Prioritise opportunity

For each pain point, score together:

| Dimension | Ask |
|---|---|
| Frequency | How often does this happen? Daily, weekly, monthly, per matter? |
| Time | How many people and minutes/hours are involved? |
| Impact | What delay, cost, risk or client experience does it affect? |
| Variability | Is the workflow standard or different every time? |
| Data access | Are the required inputs digital, structured and legally usable? |
| Reviewability | Can a qualified person cheaply verify the output? |
| Adoption | Who would need to change behaviour or approve the tool? |

Ask for the one problem they would fix first and why.

#### Hypotheses to test — not assumptions

- A matter-centric operational view may reduce switching between documents, emails, tasks and deadlines.
- Evidence-linked search and drafting may matter more than generic chat: each assertion needs a source, exact version and review state.
- Permission-aware retrieval must respect matter-level confidentiality and ethical walls, not just firm-wide tenancy.
- Obligation/deadline extraction may be valuable only when it includes confidence, source span, calendar rule, owner and human confirmation.
- Human approvals and durable audit history may be essential differentiators for actions that bind a client or firm.

#### Candidate first workflow experiments

Pick only one after hearing real workflow evidence:

1. **Matter intake pack:** consolidate intake data, documents, entities, conflict-check status and missing information.
2. **Evidence-linked document Q&A:** answer questions with exact document/version/page/paragraph citations and permission checks.
3. **Obligation and deadline register:** propose obligations and dates with supporting clauses, owner, confidence and human verification.
4. **Contract comparison:** compare versions and highlight changed clauses with links to source spans.
5. **Research memo assistant:** assemble authorities and evidence into a draft with source provenance and explicit gaps.

#### Close

- What did I misunderstand about the workflow?
- Which problem would you be comfortable seeing prototyped with synthetic or anonymised data?
- Who else should I learn from (without sharing confidential files)?
- Is there a safe example process or blank template I can inspect?
- Could I come back with a one-page workflow map for correction?

#### Notes capture template

For each workflow, record:

- `workflow_name`
- `trigger`
- `actor_roles`
- `inputs_and_sources`
- `systems_used`
- `steps_and_handoffs`
- `decision_points`
- `outputs`
- `exceptions_and_failure_modes`
- `time_and_frequency`
- `risk_if_wrong`
- `current_controls_and_approvals`
- `confidentiality_and_access_rules`
- `user_quote_or_observation` (anonymised; do not record confidential client details)
- `candidate_automation`
- `open_questions`

**Interview success criterion:** leave with one accurately mapped workflow, at least one quantified pain point, its actual data/permission constraints, and a clear next experiment—not a premature product commitment.

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No research literature material in the research yet.
