# Provenance and answer transparency

**Layer:** [06-knowledge-and-evidence](README.md) · **What it is:** Showing the business logic, executed query and sources behind every answer.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Design decisions already in the reference maps

### 11. Answer transparency (business logic and executed query) and clarification (Quick BI)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 11. Answer transparency (business logic and executed query) and clarification (Quick BI)](../../general-references/31-map-lingyang-alibaba-offers.md#11-answer-transparency-business-logic-and-executed-query-and-clarification-quick-bi)

**Purpose.** Every number comes with the definition used, the query that ran, the owner and the freshness, and the system asks instead of guessing when the period or metric is missing. Receivables example: "what's overdue?" gets "Which date: today, or month end? And for which entity?" if the tenant has more than one entity; the answer then shows the metric `overdue_amt`, its definition text, owner "Finance Manager", period dates, data as of 06:00, and the SQL.

**Design to implement.**
- Show both the **business-logic query** (the metric expression with period and qualification resolved) and the **executed SQL** [Fact, 07 §6].
- **Clarification** when the period or metric is missing or ambiguous [Fact, 07 §6]. [Inference] Trigger rules: no period term matched; more than one metric matched with equal precedence; a dimension value unmatched.
- **Trace id** per answer; like or dislike feedback, with a reason [Fact, 07 §6 and What to copy 12]. One follow-up per question in Quick BI [Fact, 07 §6]; [Inference] this product can allow more, since threads are kept.
- **Permission-aware previews**: return only columns the user may SELECT, at most 50 rows in previews; run SQL only if the topic allows execution [Fact, 07 §5].
- Limits worth copying [Fact, 07 §6]: attribution only for a single date dimension; forecasting needs at least 12 date points. [Inference] The cash-forecast feature is version 2 (25 row 43), so this applies later.
- Citation block per answer [Inference, combining 07 KF 8 and 25 row 14]: metric id and version, definition text, business owner, rule ids and versions used, period resolved dates, data freshness, quality status (section 6), trace id.
- Saved analyses re-run under the viewer's rights, as Palantir's AIP Analyst does [Fact as listed, 25 A2.5].

**Copies.**
- 07, §6 Answering. https://help.aliyun.com/zh/quick-bi/user-guide/user-guide-for-smart-q-a
- 07, §5 X-Analytics. https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis
- 25, C6 row 14; A2.5 AIP Analyst (file 03 §18 per 25).

**Left out, and why.** Quick BI's charting: version 1 has one fixed dashboard (25 row 13).

**Open questions.** None beyond section 10.

## Palantir (updated 28 Nov 2026)

- **AIP Chatbot citations:** chatbots with document or Ontology context output citations that link to the source material; citations also appear in a "Sources" dropdown under each message. Function-backed context and tools do not cite by default — the prompt must ask for them, and the chat UI renders citation bubbles only when the model emits them in a specific format. Sources: https://palantir.com/docs/foundry/chatbot-studio/citations/ , https://www.palantir.com/docs/foundry/agent-studio/citations , https://palantir.com/docs/foundry/chatbot-studio/retrieval-context/
- **Web search with citations** for supported OpenAI models in AIP (3 Nov 2026). Source: https://www.palantir.com/docs/foundry/announcements/

## New research (28 Nov 2026)

### Snowflake Cortex Analyst — what an answer carries
- Response content blocks are typed `text`, `sql` and `suggestions`; suggestions appear only when the question is ambiguous and no SQL could be generated. Source: https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-analyst/rest-api
- `message.content[].confidence.verified_query_used` names the verified query used to generate the SQL (null if none), so the UI can show "answered from verified query X". Source: same page.
- A verified query records `name`, `question`, `verified_at`, `verified_by`, `use_as_onboarding_question`, `sql`. Source: https://docs.snowflake.com/user-guide/snowflake-cortex/cortex-analyst/verified-query-repository
- Evaluations execute the generated SQL and compare results with verified queries; a verified query is either runtime guidance or evaluation ground truth, never both (it is removed from the view during evaluation). Source: https://docs.snowflake.com/user-guide/snowflake-cortex/cortex-analyst-evaluations

### Provenance fields in open-source implementations
- Graphiti edges carry `episodes[]` — the source units each fact came from ([`getzep/graphiti` → `graphiti_core/edges.py`](https://github.com/getzep/graphiti/blob/343a7bb/graphiti_core/edges.py)).
- LightRAG entity and relation rows carry `chunk_ids[]` back to source chunks ([`HKUDS/LightRAG` → `lightrag/kg/pgtable_impl.py`](https://github.com/HKUDS/LightRAG/blob/47038cf/lightrag/kg/pgtable_impl.py)).
- UModel attaches a `confidence` block (score, status, source, basis, reason) to definitions — see [object-type-registry](../03-ontology-engine/object-type-registry.md#implementation-starting-points-from-source-code).

### What this adds up to (from the sources above)
Every answer should return: the natural-language answer, the executed query or object-set plan, the verified query or metric definition used (if any), the source records or chunks behind each claim, and a confidence/status flag — or clarifying suggestions instead of an answer.

## Research literature (added 28 Nov 2026)

- **ALCE** (Gao et al., 2023, arXiv 2305.14627) — benchmark and metrics for LLM answers with citations (fluency, correctness, citation recall/precision). Use its citation-recall/precision idea as the eval for answer provenance. Source: https://arxiv.org/abs/2305.14627

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
