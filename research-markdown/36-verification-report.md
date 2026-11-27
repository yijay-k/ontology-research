# 36. Verification report on research documents 01-14 and 18-27

Checked 21 November 2026 by an independent checker who had not seen how the documents were made. Method: for each document I read the Key findings, What to copy and Open questions sections, plus the number-heavy sections of 06 and 13. I fetched 27 source pages (the cap was 30, and none were refused), read cloned code under `_code/` with file tools only (nothing was executed), and redid the arithmetic by hand. Sampling limits: documents 01, 05, 11, 24 and 26 got no fetch check. Their verdicts rest on internal consistency and how they label claims.

## Overall verdict

The set holds up better than most research of this kind. Of 27 fetched claims, 20 were fully supported, 6 partly supported and none contradicted outright. One further claim was confirmed only on a second fetch. Every code claim I checked matched the files, with one exception: Airbyte's connector folders are not in the local clone, so that claim could not be checked. Every sampled arXiv identifier matched its paper. The worked cost model in 13 and the derived averages in 06 are arithmetically correct. The errors that remain are small but real. Labels are sometimes stronger than the source (search-result titles and secondary blogs tagged [Fact]). A few details go beyond what the page says ("must give a reason code", "Small" tier, "human-approved proposals"). One secondary figure is conflated with a primary one (Harvey/Kimi K3). A few numbers disagree between documents (Sierra ARR label, AgentOne credit rate, Airbyte ELv2 reading). Documents 20 and 27 contain large blocks taken from prior knowledge or headline-only sources. They label these honestly, but nothing in those blocks should be built on without re-reading.

## Verdict per document

| Doc | Verdict | Reason |
|---|---|---|
| 01 Palantir data layer | Mostly reliable | Not fetch-checked. The OSv1 date and compute-second formula agree with 02, 13 and the fetched overview page. Labelled carefully. |
| 02 Palantir ontology | Reliable | All 5 checked claims supported (action limits, batch limits, isolation/retries, query minimums, OSv1 date). Code claim (ObjectSet algebra) verified in the clone. |
| 03 Palantir AIP | Mostly reliable | Capacity rules, evals limits, 89 MCP tools and the 12 Oct 2026 markings date are supported. But the page names tiers Medium/Large/XL, not "Small", and the MCP page does not say Ontology changes need human-approved proposals. |
| 04 Palantir security | Reliable | Policy weights, the 10,000 cap, the NOT warning and the session-token marking check are all supported word for word. |
| 05 Palantir apps/infra | Mostly reliable | Not fetch-checked. Its 7-day execution history conflicts with the 7-vs-30-day open question in 03. |
| 06 Palantir business | Mostly reliable | All arithmetic re-checks (below). Q3 sub-segment figures come from transcript coverage (AOL/Motley Fool) but are tagged [Fact]. NDR is via SaaStr. No filing was fetched by me. |
| 07 Lingyang AgentOne | Mostly reliable | Dataphin limits, Quick BI knowledge base rules and both prices supported. The "additive?" flag is not on the derived-metric page. Says the credit-to-yuan rate was "not found", which contradicts 13 and 25. KF2 rests on one Substack write-up. |
| 08 Alibaba stack | Reliable (code), mostly reliable (rest) | Licence, merger rules, scope defaults, RRF k=60, Higress tools, `db.Raw`, KAG operators, 5 s math timeout and embedding dim 1024 all verified in code. |
| 09 Papers, knowledge layer | Mostly reliable | About 40 arXiv IDs sampled; all matched their titles. Figures were not re-read against the papers. |
| 10 Papers, agents/memory/eval | Mostly reliable | IDs match. "About 16%" for Sequeda vs 16.7% in 09 is rounding only. The Anthropic Nov 2026 memory figures were not checked. |
| 11 Context-layer products | Mostly reliable | Not checked by fetch. Claims carry per-claim primary URLs. |
| 12 Agent companies | Mostly reliable | Sierra ARR timeline matches the Sierra blog I fetched. Sacra estimates are labelled. |
| 13 Cost and economics | Mostly reliable | All Claude, Gemini, Fin, Glean and AgentOne prices supported. The worked model's arithmetic is correct. Problems: Harvey/Kimi K3 conflation; Sierra $400M mislabelled as a Sacra estimate; "406 tokens" for Opus/Sonnet 5.5 is not on the page; the "0.1x on most other models" cache claim misdescribes Fable 5.2 (0.025x); the sensitivity case scales fixed costs; the Harvey source is dated two ways. |
| 14 Open-source code study | Reliable, one gap | 11 of 12 code claims verified. Airbyte's "703 connector directories" and `source-hubspot: license: ELv2` cannot be checked: the local `airbyte` clone has no `airbyte-integrations/` directory. |
| 18 Decagon | Mostly reliable | Revenue is a Sacra estimate, labelled. Not fetch-checked. |
| 19 Sierra | Reliable on headline figures | $400M+ ARR, $150M+ added in Q3, and the 6- and 5-month doublings are all supported by Sierra's blog. |
| 20 Big platform agents | Use with care | It says itself that Microsoft, Google, Amazon, ServiceNow and Workday content is "from prior knowledge, not re-read" (line 324, and line 165 for the catalogue). The Meta and WhatsApp parts are sourced. |
| 21 Glean | Mostly reliable | The FlexCredit rate card and the 100 queries/week allowance are supported. |
| 22 Ramp and finance platforms | Mostly reliable | Collections cadence, BILL pricing, Ramp's $60B valuation, >$2B revenue and 85,000 customers supported. But: "a rejection must give a reason code" is wrong (the reason is optional); "1,900 staff" is not in TechCrunch; the Brex deal is tagged [Fact] from search titles only; KF2 is tagged [Fact] from a zenml summary. |
| 23 Receivables competitors | Mostly reliable | Upflow tiers, Stripe retries and Sidetrade's 68% vs ~50% supported. Funding rounds were not checked. |
| 24 Integration companies | Mostly reliable | Not fetch-checked. Its reading of Airbyte's ELv2 is more permissive than 14's. |
| 25 Palantir/AgentOne offer catalogue | Mostly reliable | It is a consolidation of 02-07 and 13 and inherits their errors. "150,000 credits ≈ CNY 1,500" uses one product's rate. |
| 26 Process and automation giants | Mostly reliable | Not checked. Gaps are labelled openly. |
| 27 More companies | Use with care for numbers | Many valuations and rounds are tagged [H] (headline only) or [U]. The design lessons are fine; the figures need re-reading. |

## Checked claims (web)

| # | Doc | Claim | Source fetched | Outcome |
|---|---|---|---|---|
| 1 | 02 | Per action: 10,000 objects, 50 types, 3 MB per edit (OSv2); batch 10,000 calls, 20 for non-batched function actions | palantir.com/docs/foundry/action-types/scale-property-limits/ | Supported |
| 2 | 02 | Snapshot isolation by default; up to 5 attempts; only actions without external calls retried; webhooks outside atomicity | .../action-types/consistency-guarantees/ | Supported. Note: the page says snapshot isolation is the default for new action types that use batched writes, a narrower scope than "all new actions". |
| 3 | 02, 13 | Query minimums 2/5/5/5/10/10/18+1 from 1 Jan 2026 | .../ontologies/query-compute-usage/ | Supported |
| 4 | 02, 01 | OSv1 unavailable after 30 June 2026; Funnel writes, OSS reads | .../object-backend/overview | Supported |
| 5 | 03, 13 | 20% held for interactive work; up to 50% reservable; >99% of failures from enrollment and project limits; user caps below 50k TPM or 10 RPM may break features | .../aip/llm-capacity-management/ | Supported |
| 6 | 03 | Tiers "Small, Medium, Large and XLarge" | same page | Partly supported: the page as fetched lists Medium (default), Large and XL. No Small tier seen. 13 agrees with the page. |
| 7 | 03 | Evals: 1-100 iterations per case, 15,000 executions, 10 in parallel, at least 3 iterations recommended | .../aip-evals/run-suite/ | Supported |
| 8 | 03 | Palantir MCP has 89 tools, changes types and not data, and every change goes through human-approved proposals | .../palantir-mcp/available-tools/ | Partly supported: 89 tools (88 plus `search_tools`) and types-only are supported. The page does not say changes need approval. |
| 9 | 03, 04 | Marking check uses the session token, not the prompt data; scoped sessions | .../aip/control-llm-data-access-with-markings/ | Supported |
| 10 | 03 | Shipped 12 Oct 2026 | .../announcements/2026-10 | Supported |
| 11 | 04 | Policy weights 0/1/1,000/3,000; cap 10,000; avoid NOT on membership | .../manage-granular-policies/ | Supported |
| 12 | 07 | Derived metric: up to 3 object granularities; 口径 up to 1,000 characters; business and ops owners | help.aliyun.com/zh/dataphin/.../create-derived-metrics | Supported. The "additive?" flag is not on this page (it may be on the atomic-metric page, which I did not fetch). |
| 13 | 07 | Quick BI: up to 10 datasets per keyword; no fuzzy inference; 300-character interpretation | help.aliyun.com/zh/quick-bi/.../knowledge-base-configuration | Supported |
| 14 | 07, 25 | Experience Insight Agent: 5 shops for 1 year = CNY 25,200 | help.aliyun.com/document_detail/3011198.html | Supported (the page calls it an example price) |
| 15 | 13, 25 | Data Analysis Agent: CNY 300/seat/month, minimum 5 seats, 8,000 credits per seat, CNY 10,000 per 1M credits, ETL bundle 3M credits per 50 tasks | help.aliyun.com/en/document_detail/3029849.html | Supported. The page also says annual plans carry 100,000 credits per seat per year, which the docs omit. |
| 16 | 13 | Claude price table (Fable 5.2, Opus/Sonnet/Haiku 5.5 incl. the >100k Haiku tier, cache prices), 1.1x US residency, Opus 5.5 fast mode $8/$40 | platform.claude.com/docs/en/about-claude/pricing | Supported |
| 17 | 13 | Tool-use system prompt 286 (`auto`/`none`) or 406 (`any`/`tool`) "on Opus/Sonnet/Haiku 5.5" | same page | Partly supported: 406 is listed only for Haiku 5.5. The page gives no `any`/`tool` figure for Opus 5.5 or Sonnet 5.5. |
| 18 | 13 | Gemini 4 Argon doubles on 1 Dec 2026, 3.8 Flash on 1 Jan 2027; Argon caching is implicit only | aistudio.google.com/docs/pricing | Supported |
| 19 | 13, 12 | Fin: $0.99 per outcome, 50-outcome minimum, $9.99 per qualification, one charge per conversation, unresolved handoffs free, Copilot $35 | fin.ai/pricing | Supported |
| 20 | 13, 21 | Glean: 100 queries/user/week; credits ~7/26, ~35/120, ~7/114 | docs.glean.com/glean-enterprise-flex-pricing | Supported |
| 21 | 22 | Ramp collections drafts at 3/10/17/24/31 days; stops after the 5th; a human sends; pre-due reminders at 7 and 1 days sent automatically; email only | support.ramp.com/ramp-ar-collections-agent | Supported |
| 22 | 22 | Cash application: exact single match, then same-customer combination, then suggestion; per-entity mode; "a rejection must give a reason code" | support.ramp.com/ramp-ar-cash-application | Partly supported: the order and modes are right, but the reason is optional (it can be left blank). |
| 23 | 22 | Ramp $60B valuation, >$2B annualised revenue, 85,000 customers, ~1,900 staff | techcrunch.com 15 Oct 2026 | Partly supported: staff count is not in the article. |
| 24 | 22 | BILL from $49/user/month with AR in every plan; ACH $0.59; card 2.9% | bill.com/product/pricing | Supported |
| 25 | 23 | Upflow tiers by invoiced revenue; cash application and Salesforce sync only from Accelerate | upflow.io/pricing | Supported |
| 26 | 23 | Stripe default up to 8 retries in 2 weeks; partial-payment tolerance | docs.stripe.com/invoicing/automatic-collection | Supported (default applies to new accounts) |
| 27 | 23 | Sidetrade 68% vs ~50% for rule-based | sidetrade.com/core-platform/aimie-agent.md | Supported as a vendor claim with no stated method |
| 28 | 19, 12 | Sierra $400M+ ARR, week of 30 Oct 2026; $150M+ added in Q3 | sierra.ai/blog/our-customers-ambition-is-accelerating-our-growth | Supported. 13 mislabels the same figure as a Sacra estimate. |

Not checked (no fetch spent): Palantir 10-Q figures in 06; Brex/Capital One; AI-native AR funding rounds in 23; Harvey margins; ICONIQ and Bessemer margins; Vendr ACVs; Xero developer tiers in 24.

## Checked claims (code, read only)

| # | Doc | Claim | File | Outcome |
|---|---|---|---|---|
| C1 | 08, 14 | mycontext is Elastic License 2.0, which forbids hosted or managed service | `mycontext/LICENSE` (SPDX Elastic-2.0, line 27) | Supported |
| C2 | 08 | Merge rules: user source never overwritten; confirm +0.05 capped at 0.98; conflict → max(0.2, min − 0.15) with both values kept | `mycontext/packages/distill/src/reduce/merger.ts` lines 145, 159, 193 | Supported. Not mentioned in the docs: numeric facets are averaged by evidence weight (cap 0.95); on conflict the stored value becomes the candidate's; supplement keeps the max confidence. |
| C3 | 08 | Scope defaults: chat and contacts collect-nothing, minutes and docs collect-all | `mycontext/packages/store/src/domain-scope.ts` lines 69-72 | Supported |
| C4 | 08 | RRF k = 60 | `mycontext/packages/retrieval/src/fuse.ts` line 38 | Supported |
| C5 | 08 | Embedding dimension default 1024 | `mycontext/kl-graph/config.default.yaml` line 36 | Supported |
| C6 | 08 | Higress gorm server always registers `query`, `execute`, `list tables`, `describe table`; raw SQL goes to `db.Raw` | `higress/.../servers/gorm/server.go` lines 88-101; `db.go` lines 257, 300 | Supported. The `Raw` call is in `db.go`, not `server.go` as KF13 says. |
| C7 | 08 | KAG operators Retrieval/Math/Deduce/Output; Math runs in a subprocess with a timeout | `KAG/kag/solver/prompt/logic_form_plan.py`; `py_based_math_executor.py` (subprocess, 5 s default) | Supported. KAG licence is Apache-2.0. |
| C8 | 14 | osdk-ts ontology metadata IR is 18,102 lines; no root LICENSE | `osdk-ts/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts` (18,102 lines); no LICENSE at root | Supported |
| C9 | 14 | ObjectSet algebra has 15 variants | `foundry-platform-python/foundry_sdk/v2/ontologies/models.py` lines 3607-3626 | Supported (15) |
| C10 | 14 | Nango `providers.yaml` has 1,441 top-level providers | `nango/packages/providers/providers.yaml` | Supported (1,441 top-level keys) |
| C11 | 14 | Pipedream licence excludes any commercial use | `pipedream/LICENSE` §1.1 | Supported: the text says "any commercial use … including, but not limited to" competing services. |
| C12 | 14 | Airbyte platform ELv2; 703 connector directories; `source-hubspot` ELv2 | `airbyte/LICENSE` is ELv2; `airbyte-integrations/` is absent from the clone | Partly checked: ELv2 confirmed. The 703 directories and the HubSpot licence cannot be verified locally. |
| C13 | 14 | Airbyte declarative schema 6,077 lines | `airbyte-python-cdk/.../declarative_component_schema.yaml` | Supported |
| C14 | 14 | operational-ontology is MIT; core.ts 1,200 / query.ts 170 / mcp.ts 237 / index.ts 49 lines | `operational-ontology/LICENSE`, `src/*.ts` | Supported exactly |
| C15 | 14 | claude-agent-sdk-typescript: all rights reserved, Commercial Terms | `claude-agent-sdk-typescript/LICENSE.md` | Supported |
| C16 | 14 | MetricFlow Apache-2.0 | `metricflow/LICENSE` | Supported |

## Cross-document disagreements

1. **Sierra ARR status.** 19 and 12 give $400M+ (Oct 2026) as [Fact] from Sierra's blog. 13 §8 calls it a "Sacra estimate". 13 also gives $130M at end-2025 (Sacra), while 19 and 12 give $100M in Nov 2025 (TechCrunch) and 12 adds Sacra's $130M. The labels and figures should match.
2. **Decagon revenue date.** 13 and 18 say ~$100M in July 2026 (Sacra). 19's comparison table says ~$100M in Aug 2026.
3. **AgentOne credit-to-yuan rate.** 07 §3 says the rate was "not found [Unverified]". 13 and 25 give CNY 0.01 per credit (Data Analysis Agent top-up). 13 also gives CNY 0.09-0.10 per credit for the ad-creative agent. So there is no single rate, and 25's "150,000 credits ≈ CNY 1,500" is one possible value among several (≈ CNY 13,500-15,000 at the ad-creative rate).
4. **Palantir enrollment tiers.** 03 lists Small/Medium/Large/XLarge. 13 and the fetched page list Medium (default), Large and XL.
5. **Palantir execution-history retention.** 05 states 7 days. 03 lists it as unresolved (7 vs 30 days).
6. **Airbyte ELv2.** 14 (KF14 and line 475) treats Airbyte platform and connector code as unusable in a closed SaaS. 24 (KF5) cites Airbyte's FAQ saying you may use Airbyte to bring data in on behalf of your customers inside your own product. The build plan needs one position, and 24's primary-source reading is the more specific of the two.
7. **Ledger incumbents' AR agents.** 22 KF10 marks Intuit, Xero and NetSuite agents [Unverified] ("no product pages opened"). 20 KF8-9 describes the QuickBooks Payments agent and Xero "Payment Follow Ups" with sources. Use 20.
8. **Harvey model.** 13 KF7 says Harvey recovered by post-training Kimi K3, and that Harvey's own post "confirms" this. 13's own technique table (line 194) says the Harvey post names Qwen3.8-27B (Firm Knowledge) and GLM-5.2 (Review Table). Kimi K3 comes only from the andrew.ooo secondary summary.
9. **Harvey source date inside 13.** The table says 21 Sep 2026; the source list says 24 Sep 2026.
10. **Sequeda baseline.** 09 says 16.7%; 10 says "about 16%". Rounding only.
11. **Knowledge interpretation length (Quick BI).** 07 notes 300 vs 3,000 characters on two pages. The fetched knowledge-base page confirms 300 for business-logic and regex rules.

## Arithmetic re-checks

**Document 13, worked model (per month, 300 staff).** All figures were recomputed by hand.

- Design A:
  - questions 600k × $4/M + 6k × $20/M = $2.52 × 1,100 = $2,772.00
  - report $20.60 × 4.333 = $89.26
  - drafts $0.83 × 866.7 = $719.36
  - **total $3,580.62**; the doc says $3,581, which is correct. Per staff $11.94, correct.
- Design B:
  - router $0.000125 × 1,971 = $0.25
  - questions: Sonnet $0.148, Opus $0.296, blend $0.1924 × 1,100 = $211.64
  - cache writes 176 × 0.02 × $12 = $42.24
  - report $1.315 × 0.5 × 4.333 = $2.85
  - drafts $0.061 × 0.5 × 866.7 = $26.43
  - **total $283.41**; correct. Ratio A/B = 12.6, correct.
  - Caveat on drafts: the $0.026 prefix cost treats "20k prefix over 2 calls" as 20k tokens in total. If the 20k prefix is read on each of 2 calls (as A's "2 calls × 100k" suggests), the prefix line is $0.052, a draft is $0.087 before discount, and drafts are $37.70. Total B becomes ≈ $294.7. Immaterial, but the assumption should be stated.
- Design C:
  - Haiku $0.00176 × 660 = $1.16
  - Sonnet $0.0336 × 385 = $12.94
  - Opus $0.128 × 55 = $7.04
  - questions subtotal $21.14
  - cache writes 176 × 0.008 × $4.20 = $5.91
  - report $0.448 × 0.5 × 4.333 = $0.97
  - drafts $0.0038 × 0.5 × 866.7 = $1.65
  - router $0.25
  - **total $29.92**; correct. B/C = 9.47 and A/C = 119.7, correct.
- Sensitivity:
  - "5x usage (250 questions a day)" gives A ≈ $17,900, B ≈ $1,417 and C ≈ $150. These are simply 5 × each total. That multiplies reports, drafts and the fixed hourly cache writes as well.
  - If only questions rise to 250 a day: A ≈ $14,668, B ≈ $1,130, C ≈ $115.
  - Either the label or the numbers should change.
- Infrastructure table:
  - $597 / $2,104 / $13,798, matching ≈$600 / $2,100 / $13,800.
  - Neon 730 × $0.222 = $162.06; 16 CU = $2,592.96.
  - Langfuse at 2M units = $199 + 19 × $8 = $351; at 20M units = $1,791.
  - Per customer $60 / $21 / $13.80. All correct.
- Other figures in 13:
  - H100 730 × $5.49 = $4,007.70, correct; it is greater than 100 × $29.92 = $2,992, correct.
  - Fireworks advisor $368 / $954 = 38.6%, correct.
  - Code execution 150k → 2k = −98.7%, correct.
  - Programmatic tool calling 43,588 → 27,297 = −37.4%, correct.
  - Tool search 77k → 8.7k is −88.7%, not −85%. The source probably says "85%", so this is a rounding inconsistency only.
  - AgentOne 8,000 × CNY 0.01 = CNY 80, correct.
  - Model cost as a share of the FloQast median ($24,481/12 = $2,040 a month): $29.92 / $2,040 = 1.5%, consistent with "under 2%".
  - COGS of $50-90 on a $2,000 fee is 2.5-4.5%, consistent with "under 5%".

**Document 06, derived averages.**

- TTM revenue $5.88B + $1.41B = $7.29B; ÷ 1,090 customers = $6.69M. Correct.
- US commercial TTM $2.3B + $0.507B = $2.807B; ÷ 686 = $4.09M. Correct.
- Top 20 × $146M = $2.92B = 40.1% of TTM. Correct.
- Revenue per employee $2.313B × 4 / 4,634 = $1.997M. Correct.
- Segment sums:
  - Q3 2026 1,145.5 + 1,167.9 = 2,313.4
  - Q3 2025 632.7 + 548.4 = 1,181.1
  - 9M 2026 2,994.0 + 2,887.5 = 5,881.5
  - US 984 + 953 = 1,937; rest of world 184 + 192 = 376
  - All consistent.
- Growth rates:
  - total +95.9%
  - government +81.0%
  - commercial +113.0%
  - FY2025 +56.2% (government +53.1%, commercial +60.0%)
  - FY2026 guidance $8.532B / $4.4754B = +90.6%
  - All consistent.
- Contribution margins: 69.6%, 76.8% and 73.3% (Q3 2026); 66.0%, 65.7% and 65.9% (Q3 2025). Consistent.
- "$100 split" example: 42.5 / 41.2 / 8.3 / 8.0. Consistent.
- Commercial YoY rise: 1,167.9 − 548.4 = $619.5M, matching the "$619M rise".

**Elsewhere.**

- 25: 150,000 × 0.01 = CNY 1,500 is arithmetically right, but see disagreement 3.
- 13 cache ratios: Fable 5.2 cache read $0.20 on $8 input is 0.025x, so KF3's "0.1x on most other models" is wrong for the top model (the 2.5% lower bound in KF3 is in fact Fable). Sonnet 5 and Haiku 4.5 are 0.1x.

## Suspected inventions or overstatements

No URL, paper or code file that I checked turned out to be invented. Every fetched URL resolved and said substantially what was claimed. The about 40 sampled arXiv IDs match their titles (for example 2409.13731 KAG, 2406.18665 RouteLLM, 2305.05176 FrugalGPT, 2406.12045 tau-bench, 2307.16648 LLMs4OL, 2403.04651 Cedar). Items that go beyond their source:

1. 03: the "Small" enrollment tier, and "every Ontology change goes through human-approved proposals". Neither is on the cited pages.
2. 22: "a rejection must give a reason code". The source says the reason is optional.
3. 22: "about 1,900 staff" is attributed jointly to TechCrunch and Sacra. TechCrunch does not have it.
4. 13: "406 tokens" for `any`/`tool` on Opus 5.5 and Sonnet 5.5 is not on the pricing page.
5. 13 KF7: "Kimi K3" presented as if Harvey's own post confirms it.
6. 07 KF8: an "additive?" flag on every metric. Not on the derived-metric page (it may be on the atomic page).
7. [Fact] labels on secondary sources:
   - 22 KF8 (Brex deal, "Fact from search-result titles")
   - 22 KF2 (zenml summary of a Ramp post)
   - 07 KF2 ("Fact as reported", one Substack post)
   - 06 §1 sub-segments (AOL/Motley Fool transcript coverage)
   - 13 line 200 (ICONIQ quoting Coinbase, "Fact, secondhand")
   These should be [Secondary] or [Vendor claim].
8. Weak or unusual sources carrying load-bearing numbers:
   - andrew.ooo (Harvey margins, ~50% → ~−50%)
   - dev.to self-report (SOC 2 $47.2k)
   - breezedong.substack and datayuan.substack (Lingyang attributions)
   They are labelled, but no business decision should rest on them.
9. 20: Microsoft, Google, Amazon, ServiceNow and Workday sections written from prior knowledge (admitted at lines 165 and 324). These are not research and should be re-read or dropped.
10. 27: many figures are headline-only ([H]) or unsourced ([U]). Treat them as leads, not facts.
11. 09: Agent-OM is cited as "v29, Oct 2026". That is a high version count; worth a glance, but not evidence of fabrication.

## Long quotation check

Across all 24 files I searched for quoted strings over about 110 characters and for blockquotes. The hits were false positives: regex spans between two short quotes. The quotes I saw in the sampled sections are short (under 15 words), for example "Start here for most workloads", "the LLM never calls tools directly" and the one Chinese sentence in 07. No passage appears to reproduce a source at length. Two caveats: 13's pricing tables and 02's limits tables reproduce vendor price and limit tables almost cell for cell. That is factual data rather than prose, but it should stay in table form with attribution.

## Corrections to apply

1. **03 KF2 and line 70:** change the tiers to "Medium (default), Large and XL" unless a Small tier is re-confirmed on the page. Remove "every Ontology change goes through human-approved proposals" from KF8, or re-source it. The MCP page only says changes are made on a branch, and that global changes can be proposed with `create_global_proposal`.
2. **22 KF4:** replace "a rejection must give a reason code" with "a rejection may carry a reason (wrong customer / wrong invoice / other with an optional note) or none". Any copied design that needs a reason code is the founder's choice, not Ramp's.
3. **22 KF6:** attribute "about 1,900 staff" to Sacra only. Relabel KF8 (Brex) and KF2 as [Secondary].
4. **13 KF7 and §8:** say that Kimi K3 comes from a secondary source only, and that Harvey's post names Qwen3.8-27B and GLM-5.2. Fix the source date (21 vs 24 Sep 2026).
5. **13 §8:** relabel Sierra's $400M+ (Oct 2026) as [Fact, Sierra blog 30 Oct 2026], keeping $130M end-2025 as the Sacra estimate.
6. **13 §1:** limit "406 tokens" to Haiku 5.5. Correct KF3: Anthropic cache reads are 0.05x on Opus and Sonnet 5.5, 0.1x on Haiku 5.5, Sonnet 5 and Haiku 4.5, and 0.025x on Fable 5.2 and Mythos 5.2.
7. **13 §5 sensitivity:** either relabel it "5x all volumes" or recompute for questions only (A ≈ $14,670, B ≈ $1,130, C ≈ $115). State whether the draft prefix is 20k per call or 20k in total.
8. **07 §3:** replace "Credit-to-yuan rate not found" with "the Data Analysis Agent top-up is CNY 0.01/credit; the ad-creative agent is CNY 0.09-0.10/credit; no single rate". Correct 25 so the CNY 1,500 figure for the 150,000-credit pack is shown as a range.
9. **14 vs 24:** settle the Airbyte ELv2 position in the build plan. Cite Airbyte's FAQ (24), and keep 14's warning against offering Airbyte itself as a service. Re-clone Airbyte with connectors before relying on "703 connectors" or the HubSpot licence.
10. **20:** before any of it is used in the build plan, mark the Microsoft, Google, Amazon, ServiceNow and Workday catalogues as not researched, or re-read them.
11. **22 KF10:** point to 20 KF8-9 for Intuit and Xero instead of marking them unverified.
12. **06 §1:** label the Q3 sub-segment split as transcript coverage until checked against the press release.
13. **07 KF8:** limit the "additive?" claim to the atomic-metric page, or drop it.
14. **08 KF13:** cite `db.go` (not `server.go`) for `db.Raw`. Add the merger details the docs omit (numeric averaging capped at 0.95; on conflict the stored value becomes the newer one).
15. **19 table:** align Decagon's ~$100M date with 13 and 18 (July 2026).
