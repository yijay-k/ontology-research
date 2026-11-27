# Law-firm workflow interview guide

**Purpose:** exploratory workflow discovery for the conversation on Sunday, 29 November 2026. This guide is for learning how work is actually done. It is not a pitch, a product specification or a claim that the firm has any particular pain point.

## Opening and boundaries

Explain that the goal is to understand workflows and test whether software could remove administrative friction. Ask permission before taking notes. Do not request client names, privileged advice, confidential documents, case strategy or personal data. Ask for anonymised examples and process descriptions only. Do not record the conversation without consent.

Suggested opening:

> I’m exploring how legal work moves through a firm—from receiving a matter and documents, through research/review, to approvals and client communication. I don’t need confidential case details. I’m trying to understand the process, where people spend time, what systems are used, and what mistakes are costly.

## Interview sequence

### 1. Understand the role and type of work

- What kind of work takes most of your time in a normal week?
- Which practice areas or matter types have the most repeatable workflows?
- What does a typical matter look like from first contact to closure?
- Which roles touch the work: partner, associate, paralegal, clerk, finance, client, external counsel?

### 2. Walk one anonymised matter from start to finish

Ask the interviewee to choose a representative, non-confidential example and walk through:

- How the firm first receives an enquiry or instruction.
- How conflict checks, client onboarding and engagement approval happen.
- Where documents arrive and how they are named, classified, versioned and stored.
- How research, drafting, review and redlining are assigned.
- How deadlines, court dates, obligations and follow-ups are tracked.
- Who reviews, approves and sends work to the client or court.
- How billing, time recording, matter closure and retention work.

For every step ask: **Who does it? What triggers it? What information is needed? Which system is used? What is copied manually? What happens when it fails?**

### 3. Find high-friction tasks without leading the witness

- Which task is repetitive but still requires careful checking?
- Where do people re-enter the same information in more than one system?
- What is hard to find when a matter gets large?
- What causes avoidable waiting, rework or missed handoffs?
- Which tasks are difficult to delegate to a junior colleague?
- Which errors are embarrassing, expensive or high-risk?
- What work gets postponed because it is administratively painful?

Do not assume document review, drafting or research is the top pain. Let the interviewee rank the problems.

### 4. Documents, evidence and knowledge

- How do you identify the current authoritative version of a document?
- How do you trace a statement in a draft back to a source document, clause, case or authority?
- How are client-specific precedents and prior work reused?
- How do you know whether a source is current, superseded or no longer reliable?
- What happens when two documents conflict?
- Can staff quickly identify who may read a document or matter, and why?

### 5. Deadlines, obligations and approvals

- How are dates extracted and checked against the source?
- Who owns a deadline and who confirms it?
- Which events create a new obligation or follow-up task?
- How are reminders escalated when someone is away?
- What approvals are mandatory before sending, filing, advising or changing a contractual position?
- Which actions must always remain with a qualified lawyer?

### 6. Current systems and workarounds

- Which practice-management, document-management, email, time/billing, research and collaboration tools are used?
- Which integrations work well and which are manual?
- What do people keep in spreadsheets, personal notes or email threads?
- Is there a system the firm would never replace? Why?
- What data is difficult or risky to export?

### 7. AI appetite and guardrails

- Have people tried AI tools? For which tasks, and what worked or failed?
- What information can never leave the firm's environment?
- What source citations, audit trail and review controls would be required?
- What is acceptable for an AI assistant to draft versus execute?
- Which workflows could tolerate an incorrect first draft, and which cannot tolerate an incorrect result?
- What would make the firm trust or reject an AI-generated summary or extracted obligation?

### 8. Prioritise opportunity

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

## Hypotheses to test — not assumptions

- A matter-centric operational view may reduce switching between documents, emails, tasks and deadlines.
- Evidence-linked search and drafting may matter more than generic chat: each assertion needs a source, exact version and review state.
- Permission-aware retrieval must respect matter-level confidentiality and ethical walls, not just firm-wide tenancy.
- Obligation/deadline extraction may be valuable only when it includes confidence, source span, calendar rule, owner and human confirmation.
- Human approvals and durable audit history may be essential differentiators for actions that bind a client or firm.

## Candidate first workflow experiments

Pick only one after hearing real workflow evidence:

1. **Matter intake pack:** consolidate intake data, documents, entities, conflict-check status and missing information.
2. **Evidence-linked document Q&A:** answer questions with exact document/version/page/paragraph citations and permission checks.
3. **Obligation and deadline register:** propose obligations and dates with supporting clauses, owner, confidence and human verification.
4. **Contract comparison:** compare versions and highlight changed clauses with links to source spans.
5. **Research memo assistant:** assemble authorities and evidence into a draft with source provenance and explicit gaps.

## Close

- What did I misunderstand about the workflow?
- Which problem would you be comfortable seeing prototyped with synthetic or anonymised data?
- Who else should I learn from (without sharing confidential files)?
- Is there a safe example process or blank template I can inspect?
- Could I come back with a one-page workflow map for correction?

## Notes capture template

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