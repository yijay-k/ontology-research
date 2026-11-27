# Human in the loop and handoff

**Layer:** [08-agent-platform](README.md) · **What it is:** When the agent asks, waits for approval, or hands the case to a human.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Other companies and products](#other-companies-and-products) (1) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### 20. Human-in-the-loop patterns (collected)

> Source: [general-references/03-palantir-aip.md § 20. Human-in-the-loop patterns (collected)](../../general-references/03-palantir-aip.md#20-human-in-the-loop-patterns-collected)

All [Fact]; sources in the sections above.
1. **Action confirmation** in Chatbot Studio: the tool runs automatically or only after the user confirms.
2. **Command approval**: on by default, and the user sees the payload.
3. **Request clarification** tools: Chatbot Studio, AI FDE and Analyst.
4. **Plan-then-act**: AI FDE "Generate plan".
5. **Staged writes plus Automate proposals**, with a decision log, accept and apply.
6. **Branch proposals**: AI FDE, Palantir MCP Ontology changes, Evolve, bulk model swaps and Logic branch protection.
7. **Approval tiers by risk**: always-ask for actions and publishing, branch-aware auto-approval for edits, auto-approval for reads, session pre-approval scoped to a branch or project.
8. **The Agent SDK `UserQuestion` pending context item**, resolved by an event.
9. **Preview mode** in Agent Builder runs actions without applying edits; **evals simulate the Ontology**.
10. **The feedback object pattern**: store suggestions and human verdicts, and let the LLM query them.

## Other companies and products

### 3.6 Escalation and handoff

> Source: [general-references/18-decagon.md § 3.6 Escalation and handoff](../../general-references/18-decagon.md#36-escalation-and-handoff)

Authors specify in the AOP when to hand off; escalation intents catch high-risk topics globally; guidelines cover escalation behaviour; voice transfers include a concise summary; warm handoffs include history; Decagon Assist supports the human after transfer; chat/email handoff through Zendesk Sunshine, Salesforce, Intercom. Procedures needing emotional intelligence or negotiation are advised to stay human. [Vendor claim] https://decagon.ai/resources/from-sops-to-agent-operating-procedures ; https://decagon.ai/product/voice ; https://decagon.ai/product/integrations. Experiment Hub examples include testing "a clarifying question before transfer". https://decagon.ai/blog/experiment-hub

## Research literature

### 3. Intent understanding, ambiguity and clarification

> Source: [general-references/10-papers-agents-memory-eval.md § 3. Intent understanding, ambiguity and clarification](../../general-references/10-papers-agents-memory-eval.md#3-intent-understanding-ambiguity-and-clarification)

**Plain English.** "Show me revenue for Q3" is ambiguous. Is it booked or recognised revenue? Fiscal or calendar Q3? Which region? The agent must either resolve the question from the company model's defaults or ask, and ask early.

**Classical framing** [Inference]. Task-oriented dialogue split this into intent classification plus slot filling. Semantic parsing maps an utterance to a logical form (SQL, SPARQL, an API call). A company model gives you the target grammar: each "allowed action" is an intent with typed slots, and each metric is a parse target.

**Evidence.**
- AmbigQA (Min, Michael, Hajishirzi, Zettlemoyer; arXiv 2004.10645): over half of NQ-open questions are ambiguous. AmbigNQ has 14,042 questions, with event and entity references as the main sources of ambiguity [Fact, https://arxiv.org/abs/2004.10645].
- CLAMBER (Zhang et al., arXiv 2405.12063, 2024): about 12k items over an ambiguity taxonomy. LLMs are poor at both detecting ambiguity and asking good clarifying questions. CoT and few-shot prompting give only marginal gains and can increase overconfidence [Fact, https://arxiv.org/abs/2405.12063].
- AMBROSIA (Saparina and Lapata; NeurIPS 2024 D&B): ambiguous questions to SQL, covering scope, attachment and vagueness, each with multiple interpretations and SQL. Ambiguity persists even with the database schema in hand, and frontier models struggle [Fact, https://arxiv.org/abs/2406.19073]. This is directly relevant to metric questions.
- "LLMs Get Lost in Multi-Turn Conversation" (Laban, Hayashi, Zhou, Neville; arXiv 2505.06120, May 2025): more than 200k simulated conversations with "sharded" instructions. All models dropped an average of 39%. The drop is mostly unreliability (+112%) rather than lost aptitude. Models commit to early assumptions and never recover [Fact, https://arxiv.org/abs/2505.06120].
- Ambig-SWE (Vijayvargiya, Zhou, Yerukola, Sap, Neubig; arXiv 2502.13069): models struggle to tell underspecified from well-specified instructions. When they do interact, results improve by up to 74% [Fact, https://arxiv.org/abs/2502.13069].
- Clarification timing (Gulati et al., arXiv 2605.07937, May 2026): ground-truth clarifications were injected at controlled points across 84 task variants and more than 6,000 runs. Goal clarifications lose almost all value after 10% of execution (pass@3 falls from 0.78 to baseline). Input clarifications retain value until about 50%. Asking after the midpoint is worse than never asking. In 300 unscripted sessions, no frontier model asked in the optimal window, and 52% over-asked [Fact, https://arxiv.org/abs/2605.07937].
- tau2-bench "dual control": performance drops significantly when the user must also act [Fact, https://arxiv.org/abs/2506.07982].

**Grounding to schemas.** See the Sequeda results in section 9. Providing an ontology plus mappings is the single largest lever measured for enterprise question answering.

**Takeaway** [Inference, built on the above]. Implement a cheap "intent and slot resolution" step at turn 0, before any action, against the company model. Map to a known intent or metric. Fill slots from user context and documented defaults, such as "revenue means recognised revenue, fiscal calendar". List unresolved goal-level slots and ask once, immediately, in a single batched question. Never ask about goal-level ambiguity mid-execution. Input-level details can be asked up to the halfway point. Echo resolved defaults in the answer ("Using recognised revenue, FY Q3 = Jul to Sep") so users can correct them, which tackles the early-assumption failure from Laban et al.

## Design decisions already in the reference maps

### 13. Clarification timing

> Source: [general-references/32-map-research-and-cost.md § 13. Clarification timing](../../general-references/32-map-research-and-cost.md#13-clarification-timing)

**Purpose.** Ask about ambiguity once, at the start, or not at all. Example: "Show overdue for Q3". Does that mean fiscal or calendar Q3, overdue from the due date or past the grace period, and which entity? Resolve from defaults or ask before any tool call.

**Design to implement.**
- At turn 0, map the request to a known intent (allowed action) or metric with typed slots, using the company model as the target grammar.
- Fill slots from user context (role, region) and documented defaults.
- Detect unresolved *goal-level* slots deterministically, by checking for missing required slots in the intent schema. Do not rely on the model's own sense of ambiguity.
- Ask one batched question immediately.
- *Input-level* details may be asked up to about the halfway point. After that, proceed with defaults and echo them.
- Echo every resolved default in the answer so the user can correct it.
- For action tools, list the action details and require an explicit "yes" before any write (tau2-bench retail policy).

**Evidence.**
- Goal clarifications lose almost all value after 10% of execution (pass@3 falls from 0.78 to baseline). Input clarifications keep value until about 50%. Asking after the midpoint is worse than never asking. No frontier model asked in the optimal window, and 52% over-asked (Gulati et al., arXiv 2605.07937).
- Interaction gave up to 74% gains on underspecified SWE tasks (arXiv 2502.13069).
- CLAMBER: chain-of-thought and few-shot prompting can increase overconfidence about ambiguity (arXiv 2405.12063).
- Multi-turn underspecified conversations cost 39% on average, mostly unreliability (+112%); models commit to early assumptions (arXiv 2505.06120).
- Over half of NQ-open questions are ambiguous (AmbigQA). All from document 10, section 3.

**Copies.** Document 10, section 3 "Takeaway" and "What to copy" item 1. https://arxiv.org/abs/2605.07937 ; https://arxiv.org/abs/2505.06120 ; https://arxiv.org/abs/2405.12063 ; https://arxiv.org/abs/2406.19073

**Left out.** Relying on prompting to make the model notice ambiguity (CLAMBER).

**Open questions.** None of the papers tests Qwen.

### 14. Human handoff

> Source: [general-references/34-map-agent-companies.md § 14. Human handoff](../../general-references/34-map-agent-companies.md#14-human-handoff)

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

## Fact-check notes

_No time-sensitive claims in this component were re-checked in the 28 Nov 2026 pass; its sources are dated 21–27 Nov 2026. See the linked references for their own open questions._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
