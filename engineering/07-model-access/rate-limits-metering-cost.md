# Rate limits metering cost

**Layer:** [07-model-access](README.md) · **What it is:** Rate limits, token and compute accounting, caching and the cost model per customer.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (3) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Other companies and products](#other-companies-and-products) (4) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### 4. Rate limits and capacity management

> Source: [general-references/03-palantir-aip.md § 4. Rate limits and capacity management](../../general-references/03-palantir-aip.md#4-rate-limits-and-capacity-management)

**Plain English.** Model providers cap each account. Palantir resells that capacity, so it splits it carefully between teams, users and jobs, and keeps a lane open for people clicking buttons.

**Technical detail** (all [Fact] from https://www.palantir.com/docs/foundry/aip/llm-capacity-management/ unless noted):
- **Units.** Tokens per minute (TPM) and requests per minute (RPM), tracked separately for each model.
- **Three levels.** Enrollment, project and user.
- **Enrollment tiers.** Small, Medium, Large and XLarge. All customers start on Medium; Large and XL come through Support. Example limits, as TPM/RPM: GPT-5.5 (OpenAI) is 1M/1,000 per user; Small 150k/30, Medium 3M/1,500, Large 6M/3,000, XLarge 10M/5,000. Llama 3.3 70B (Palantir-hosted) is 50k/100 per user and Medium 300k/450. "Enrollment limits from enabled backends are added together", so enabling both Azure and Direct OpenAI raises the ceiling. Georestricted enrollments may get lower limits. [Fact] https://www.palantir.com/docs/foundry/aip/llm-enrollment-rate-limits/
- **Project limits.** Each limit is a percentage of a model's enrollment TPM and RPM, shared by every project assigned to it. There is a default limit for unassigned projects. Per-model overrides let you build an allowlist (base 0% plus overrides) or a blocklist (an override at 0%). Projects in the same category can each burst to the percentage, and overlapping requests "retry until they succeed".
- **User limits.** Palantir sets defaults. Overrides can be a percentage (1 to 100) or absolute TPM and RPM. They apply per model, per user group, or as a default for all users. Where several group overrides apply, the highest wins. Below 50k TPM or 10 RPM some features break, and 0 is not supported. Configurable per-user limits shipped on 2 Jul 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07
- **Attribution decides which limits apply.** Requests charged to a project (Pipeline Builder, Logic, Automate, Chatbot Studio, Workshop) use enrollment and project limits. Requests charged to a user (AI FDE, Assist, Analyst, Pipeline Builder Explain/Generate, Continue, Claude Code) use enrollment and user limits.
- **Interactive vs batch.** Interactive traffic is Workshop, Chatbot Studio and Logic or Pipeline Builder previews. Batch traffic is transforms, Pipeline Builder and Automate running Logic. 20% of capacity at both enrollment and project level is always reserved for interactive use.
- **Reserved capacity.** Up to 50% of a model's capacity can be reserved and split across projects. If total capacity shrinks, reservations are kept up to 95% of the new total. Reservation costs nothing extra.
- **Autoscaling.** On by default for some OpenAI models since 21 Apr 2026. It raises limits up to 2x where Palantir has validated capacity, with per-project overrides. User folders are excluded. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-04
- **Registered (BYO) models.** Admins set enrollment and user limits when registering. Project limits default to 70%. [Fact] https://www.palantir.com/docs/foundry/aip/bring-your-own-model/
- **Observed reliability.** 99.9% uptime over the past year, and over 99% of failures came from enrollment or project limits. The largest cause of shortages is georestriction, and pipelines running millions of items are the hardest to support. [Vendor claim] capacity page.
- **Example policy from the docs.** Production project at 90%, testing at 30%, experimentation at 20%. User default at 10% for GPT-5 and Claude Sonnet 4.6. User home folders at 0% "to encourage shared work". [Fact]
- **Monitoring UI.** Resource Management > AIP usage & limits shows per-minute usage with drill-down to project, resource and user, rate-limit thresholds as dashed lines, two weeks of history, and an Analysis tab with daily cost by model. Since 30 Apr 2026, anyone with project view permission can see that project's usage, with rate-limit hits flagged. [Fact] capacity page; https://www.palantir.com/docs/foundry/announcements/2026-04

### 5. Token and compute accounting

> Source: [general-references/03-palantir-aip.md § 5. Token and compute accounting](../../general-references/03-palantir-aip.md#5-token-and-compute-accounting)

- A token is about 4 characters. Tokens convert to compute-seconds at a per-model rate per 10k tokens, with separate input and output rates and three regional price bands. Examples for North America, input/output: GPT-4o 43/172, GPT-4o mini 2.6/10.3, GPT-5 20.5/163.6, Claude 3.5 Sonnet v2 46/232, Claude 4.5 Haiku 17.3/86.4. Some models have higher rates above a context threshold such as 128k or 200k. The rates apply to AWS-hosted enrollments on default terms and "do not apply to all customers". [Fact] https://www.palantir.com/docs/foundry/aip/aip-compute-usage/ (I read about 100k of the page's 154k characters, so the table I saw was incomplete.)
- **Attribution.** Usage is charged to the resource that made the request, for example the pipeline being explained. When no resource fits (Assist, Error Explainer), it goes to the user's folder. [Fact] same URL.
- **Logic surcharges.** 4 compute-seconds per Use LLM block execution (each loop iteration counts) and 8 per tool call, plus tokens, plus the compute of whatever the tool runs. Deterministic blocks cost nothing on their own. Worked example: 2 LLM blocks and 1 tool call per run is 16 compute-seconds per run before tokens. [Fact] https://www.palantir.com/docs/foundry/logic/compute-usage/
- **Analyst cost model.** Tokens grow over a conversation because history and tool results are resent every turn. Large tool results are the main cost driver. Enabled tool *definitions* are sent on every request, so switching off unused tool categories reduces cost. Model prices differ "by more than an order of magnitude". The docs suggest moving stable steps into functions (low token cost) or pro-code agents. [Fact] https://www.palantir.com/docs/foundry/aip-analyst/compute-usage/
- **Export.** The "AIP Token Usage" dataset reports daily usage by model and resource, with input, output and cache read/write tokens separately, plus compute-seconds and currency. It requires the Resource Management Administrator role (since 28 May 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
- **Registered models** carry no Palantir platform fee. The provider bills the customer directly, and that spend does not appear in Resource Management. [Fact] https://www.palantir.com/docs/foundry/aip/bring-your-own-model/

### 18. Metering and cost drivers

> Source: [general-references/01-palantir-data-layer.md § 18. Metering and cost drivers](../../general-references/01-palantir-data-layer.md#18-metering-and-cost-drivers)

[Fact] https://palantir.com/docs/foundry/resource-management/usage-types/
- **Compute-seconds** are a unit of work, not wall-clock time: `max(num_vCPU, GiB_RAM/7.5)` per instance × instances × seconds, on *allocated* resources.
  - Worked example: 2 executors × (1 core, 12 GiB) × 5 s = 16 compute-seconds.
  - Usage is dated to the UTC day the job finished.
- **Batch** is metered from provisioning to release. **Interactive** compute costs more because of always-on idle capacity. **Continuous** compute is metered while a job is ready to receive messages.
- **Storage** is in GB-months, sampled hourly and averaged over the month. Retained files count until retention removes them.
- **Ontology volume** is also in GB-months, and synced size can differ from dataset size. I found no rate or formula. [Fact / Unverified rate]
- **Streaming:** [Fact] https://palantir.com/docs/jp/foundry/building-pipelines/streaming-compute-usage/
  - JobManager plus TaskManagers × (parallelism + 1), times a 0.5 usage rate, billed whether or not data flows.
  - The archiver always uses 1 vCPU and 4 GiB, and only when data is flowing.
  - Example: a small profile at parallelism 2 for 10 minutes = 600 compute-seconds.
- **Media:** compute-seconds per GB, from 2 to 275 (Section 10).
- **Iceberg:** compute in compute-seconds and storage in GB-months, counting all data and delete files referenced by retained snapshots, branches and tags. Bring-your-own-bucket storage is not metered. Snapshot expiry reduces usage. [Fact] https://www.palantir.com/docs/foundry/iceberg/resource-usage/
- **Virtual tables** cut storage but may increase compute when queried often. [Fact] https://www.palantir.com/docs/foundry/data-integration/virtual-tables/
- **Rate-limit visibility:** a "Foundry usage & limits" page tracks Ontology Reads, Platform APIs and Function Compute against enrollment limits, drillable by organisation and user. GA 19 Nov 2026. [Fact] https://palantir.com/docs/foundry/resource-management/foundry-usage-and-limits/ , https://www.palantir.com/docs/foundry/announcements/2026-11
- **LLM usage:** an AIP token-usage internal dataset with daily input, output and cache tokens plus currency (28 May 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
- **Prices:** no per-unit prices are published in the pages I read. [Fact: absent]

## Lingyang, AgentOne and Alibaba

### 11. Models, credits and cost controls

> Source: [general-references/28-winnexo.md § 11. Models, credits and cost controls](../../general-references/28-winnexo.md#11-models-credits-and-cost-controls)

- Models selectable by name on 5 Nov 2026: Deepseek-v4.1-flash-1017, GLM-5.3 and Kimi-K3, each with a usage multiplier, plus an Auto mode with a preference for quality, cost or neither ([Fact](https://robject.lydaas.com/help/en/changelog/)).
- Two work modes: Quick Q&A and Deep Work, with reasoning effort Low, Medium or High and "usage for this round" shown ([Fact](https://robject.lydaas.com/help/en/changelog/)).
- Credits: separate concurrency and credit quotas for individuals and spaces, spending averages and limit notifications ([Fact](https://robject.lydaas.com/help/en/changelog/)). No prices appear on the pages read.

## Other companies and products

### 2. Prompt caching rules (the largest single lever)

> Source: [general-references/13-cost-and-economics.md § 2. Prompt caching rules (the largest single lever)](../../general-references/13-cost-and-economics.md#2-prompt-caching-rules-the-largest-single-lever)

Plain English: if the start of every request is identical (system prompt, tool definitions, metric catalogue), the provider keeps its processed form and charges a fraction of the normal price to reuse it. Example: a 20k-token prefix on Sonnet 5.5 costs $0.04 uncached and $0.002 as a cache hit.

- **Anthropic** [Fact: https://platform.claude.com/docs/en/build-with-claude/prompt-caching]
  - Minimum cacheable prompt is 512 tokens on all 5.x models. Shorter prompts silently don't cache; check `cache_creation_input_tokens` and `cache_read_input_tokens`.
  - At most 4 explicit breakpoints. Automatic caching (a top-level `cache_control`) uses one of them.
  - Each breakpoint looks back at most 20 blocks.
  - Order of invalidation is tools → system → messages. Changing a tool definition invalidates everything after it. Toggling web search or the fast/standard speed setting invalidates system and messages. Changing `tool_choice` or adding images invalidates messages only.
  - Hits need a 100% identical prefix.
  - 1-hour entries must come before 5-minute entries.
  - Cache hits are not counted against rate limits. The docs recommend the 1-hour TTL to improve rate-limit use.
  - Bedrock supports only explicit caching, with a 512-token minimum and 4 checkpoints [Fact: https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-haiku-5-5.html].
  - In batches, hit rates are best-effort at 30% to 98%; use the 1-hour TTL [Fact: https://platform.claude.com/docs/en/build-with-claude/batch-processing].
- **OpenAI** [Fact: https://developers.openai.com/api/docs/guides/prompt-caching]
  - Caching is on by default.
  - GPT-5.6 and later: 1,024 visible-token minimum. TTL is `"30m"` (default) or `"12h"` (Responses API only). Writes are 1.25x (30m) or 2.5x (12h). Reads are 0.1x, or 0.05x on Astra/Sol/Terra 6.x.
  - `prompt_cache_key` is optional on new models and mainly separates cache accounting per customer.
  - Caches are not shared across organisations or regional processing boundaries.
  - OpenAI does not guarantee lower latency.
- **Published effect.** Anthropic's August 2025 examples [Vendor claim: https://claude.com/resources/articles/prompt-caching]:
  - 100k-token book chat: −90% cost, time to first token 11.5 s → 2.4 s
  - 10k-token many-shot prompt: −86% cost
  - 10-turn conversation: −53% cost
- **Failure modes** [Inference from the invalidation rules]:
  - Putting a timestamp, user name or per-tenant data before the breakpoint (that content belongs after it)
  - Reordering tools
  - Switching `tool_choice` per request
  - Letting a long agent loop push the breakpoint more than 20 blocks past the last write
  - Routing one conversation across several models (each model has its own cache)

### 3. Cost-reduction techniques and their evidence

> Source: [general-references/13-cost-and-economics.md § 3. Cost-reduction techniques and their evidence](../../general-references/13-cost-and-economics.md#3-cost-reduction-techniques-and-their-evidence)

| Technique | What it is (one line) | Published figure | Source |
|---|---|---|---|
| Prompt caching | Reuse a stable prefix at 0.05x–0.2x price | Up to −90% cost, −85% latency | [Vendor claim] claude.com prompt-caching article (14 Aug 2025) |
| Model routing (learned router) | Send easy queries to a cheap model | −85% cost on MT-Bench, −45% MMLU, −35% GSM8K at ~95% of GPT-4 quality | [Fact] https://lmsys.org/blog/2024-07-01-routellm/ ; paper https://arxiv.org/abs/2406.18665 |
| Cascades (cheap model first, escalate on low confidence) | Try small, escalate when a scorer rejects the answer | Matches GPT-4 with up to −98% cost | [Fact] FrugalGPT https://arxiv.org/abs/2305.05176 |
| Executor + advisor | Open model does the work and calls a frontier model as a tool for hard steps | GLM 5.1 + Opus 4.7 advisor passed 18/100 tasks for $368, vs Opus alone 14/100 for $954 (≈39% of the cost); advisor called 0.83 times per task; ±2.5 pt noise | [Vendor claim] https://fireworks.ai/blog/open-source-agents-frontier-advisors (3 Jun 2026) |
| Deterministic computation outside the model | Model writes the query; SQL / semantic layer computes the numbers | No standard benchmark. Mechanism: result tables are ~1k tokens vs raw data at 100k+. Worked model: −90% vs routed design | [Estimate], section 5 |
| Code execution instead of tool round trips | Model writes code that filters data in a sandbox; only results return | 150,000 → 2,000 tokens (−98.7%) in one workflow | [Vendor claim] https://www.anthropic.com/engineering/code-execution-with-mcp (4 Nov 2025) |
| Programmatic tool calling | Model orchestrates many tool calls in code | 43,588 → 27,297 tokens (−37%) | [Vendor claim] https://www.anthropic.com/engineering/advanced-tool-use (24 Nov 2025) |
| Tool search / deferred loading | Load only the 3–5 tool definitions needed | ~77k → ~8.7k tokens (−85%); MCP eval accuracy Opus 4 49%→74%, Opus 4.5 79.5%→88.1% | [Vendor claim] same post; [Fact] docs https://platform.claude.com/docs/en/agents-and-tools/tool-search-tool |
| Context editing / tool-result clearing | Drop stale tool results from long loops | −84% tokens on 100-turn search eval; +29% performance (+39% with memory tool) | [Vendor claim] https://claude.com/resources/articles/context-management (29 Sep 2025) |
| Server-side compaction | API replaces old turns with a summary | No figure published on the main page; beta header `compact-2026-09-04` | [Fact] https://platform.claude.com/docs/en/build-with-claude/compaction |
| Retrieval instead of long context | Put 5–20 relevant chunks in the prompt instead of whole documents | No vendor figure; in the worked model, 150k → 30k per call cuts question cost by ~13x on the same model | [Estimate] |
| Batch | Asynchronous processing within 24 h | −50% at Anthropic, OpenAI, Google, Qwen, Fireworks; OpenAI background −30%/−40% | [Fact] pricing pages |
| Semantic caching | Return a stored answer for a near-duplicate question | API calls −68.8%, hit rates 61.6–68.8%, >97% correct hits | [Fact] https://arxiv.org/abs/2411.05276 |
| Verified semantic caching | Per-entry learned thresholds with error-rate bounds | Up to 12.5x higher hit rate, 26x lower error rate than static thresholds | [Fact] vCache, ICLR 2026, https://arxiv.org/abs/2502.03771 |
| Post-training an open model | Specialise a cheaper open model for a narrow task | Harvey: Firm Knowledge −90% cost per query (Qwen3.8-27B); Review Table ~1/10 cost per cell (GLM-5.2) | [Vendor claim] https://harvey.ai/blog/post-training-update-harvey-tenet (20 Aug 2026) |
| Structured outputs | Force a JSON schema | No published savings figure found. Benefit: shorter outputs and no retries for malformed responses | [Unverified] / [Inference] |
| Fine-tuning closed models | n/a | OpenAI closed to new users; Claude only ever on Claude 3 Haiku via Bedrock | [Fact] OpenAI pricing page; Bedrock Haiku 5.5 card lists no customisation |

Caveats:
- Semantic caching is risky for finance numbers. A cached "revenue last month" answer goes stale when the books change. Cache the query plan, not the numbers, and key it on the data version [Inference].
- ICONIQ reports that Coinbase halved its AI spend while its token volume grew, by routing, caching and defaulting to cheaper open models [Fact, secondhand: https://www.iconiq.com/growth/insights/ai-economics-is-a-design-problem, 13 Aug 2026].
- The same ICONIQ piece says multi-step agentic workflows use 5 to 30 times more tokens than a simple chat exchange [Fact].
- a16z measured that the price of a constant level of LLM capability falls about 10x a year [Fact: https://a16z.com/llmflation-llm-inference-cost/, 12 Nov 2024]. Google's scheduled 2x increases show that list prices for a given model can also go up.

### 4. How Palantir meters AIP and compute

> Source: [general-references/13-cost-and-economics.md § 4. How Palantir meters AIP and compute](../../general-references/13-cost-and-economics.md#4-how-palantir-meters-aip-and-compute)

Plain English: Palantir does not bill customers per token. It converts everything (Spark jobs, ontology queries, LLM tokens) into one unit, the compute-second, and sells the customer a pool of them under the contract.

- **LLM tokens → compute-seconds** [Fact: https://www.palantir.com/docs/foundry/aip/aip-compute-usage]
  - Formula: compute-seconds = tokens × per-model rate ÷ 10,000, with separate input and output rates.
  - North America rates per 10k tokens (input / output):
    - GPT-4o: 43 / 172
    - GPT-4o mini: 2.6 / 10.3
    - GPT-5: 20.5 / 163.6
    - GPT-5.4 (≤272k): 45.5 / 272.7
    - Claude 4.5 Sonnet (≤200k): 51.8 / 259.1
    - Claude 4.5 Haiku: 17.3 / 86.4
  - Regional rates differ (GPT-4o is 36/145 in EU/UK).
  - Usage is attributed to the resource that made the request (for example a pipeline). If no resource can be identified, it goes to the user's folder.
  - An "AIP Token Usage" dataset gives daily tokens by model and resource, with matching compute-seconds and currency.
  - The docs do not mention caching, and say the rates do not apply to all customers.
  - Implication [Inference]: an output:input ratio of about 5:1 in compute-seconds mirrors vendor price ratios. Palantir passes token cost through in its own unit and adds margin.
- **Ontology query metering (effective 1 Jan 2026)** [Fact: https://palantir.com/docs/foundry/ontologies/query-compute-usage/]
  - Minimum compute-seconds by query type:
    - base query: 2
    - Search Around: 5
    - aggregation: 5
    - Ontology SQL: 5
    - advanced: 10
    - derived property: 10
    - Action: 18, plus 1 per object edited beyond the first
  - Actual usage grows with object-set size and complexity.
- **Platform compute** [Fact: https://palantir.com/docs/foundry/resource-management/usage-types/]
  - Spark: compute-seconds = max(vCPU, GiB RAM / 7.5) × duration, measured on allocated rather than used resources.
  - Interactive compute is more expensive because idle capacity is kept warm.
  - Storage and ontology volume are billed in GB-months.
  - The page gives no currency conversion.
- **Capacity governance** [Fact: https://www.palantir.com/docs/foundry/aip/llm-capacity-management]
  - Tokens-per-minute and requests-per-minute limits per model, at enrollment level (medium by default; large or XL on request), project level (percentage shares and model allowlists) and user level (setting limits below 50k TPM or 10 RPM may break features).
  - Up to 50% of a model's capacity can be reserved for critical projects.
  - 20% is always held for interactive use, so batch work is capped at 80%.
- **Dollar price**: not published.
  - The AWS Marketplace listing is a placeholder of $100,000/month per "Foundry Subscription Unit" with $50,000 overage per unit; actual pricing is private [Fact: https://aws.amazon.com/marketplace/pp/prodview-a5m5xespbqyci].
  - UK G-Cloud lists £3,000,000 per licence [Fact: https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/804537709233305].
  - A public Voyager order form shows Palantir invoices usage overages once they reach $1,000,000. The rates are redacted [Fact: https://contracts.justia.com/companies/voyager-technologies-inc-103693/contract/1327627].

### Five design rules that most reduce cost without reducing quality

> Source: [general-references/13-cost-and-economics.md § Five design rules that most reduce cost without reducing quality](../../general-references/13-cost-and-economics.md#five-design-rules-that-most-reduce-cost-without-reducing-quality)

1. **The model plans and explains; the database computes.** Every number in an answer or report comes from a governed SQL or semantic-layer query, and the model sees only the small result table. This is cheaper (about 10x below a routed design in the worked model) and more accurate, because arithmetic and permissions are deterministic and traceable.
2. **Keep one byte-identical cached prefix per agent.** Order it tools → system → catalogue, put a 1-hour breakpoint at its end, and put nothing per-request before it. Monitor the hit rate. Reads cost 5 to 20% of input and do not count toward Anthropic's input rate limit.
3. **Use the cheapest model that passes the eval, and escalate on a failed check, not by default.** A small-model router, a workhorse model as the default, and the frontier model used as an advisor or fallback. Re-run the evals each time vendors change prices or models.
4. **Anything that can wait goes to batch.** Reports, bulk drafts, enrichment and evals run on the 50%-off batch APIs, with caching stacked where the vendor allows it.
5. **Send the model only what it needs.** Retrieval instead of whole documents, deferred tool loading, code-side filtering of tool results, and clearing or compacting stale turns. Each of these has a published reduction of roughly 37% to 98% of tokens on the affected step.

## Design decisions already in the reference maps

### 21. Worked cost model, re-stated and recomputed

> Source: [general-references/32-map-research-and-cost.md § 21. Worked cost model, re-stated and recomputed](../../general-references/32-map-research-and-cost.md#21-worked-cost-model-re-stated-and-recomputed)

**Purpose.** Show that architecture, not vendor choice, sets the bill. The workload is one 300-staff customer per month:
- 1,100 questions (50 a day × 22 days)
- 4.333 weekly reports (52/12)
- 866.7 outbound drafts (200 a week × 4.333)

Here the outbound drafts stand in for collection reminders. Anthropic Nov 2026 list prices throughout. Cache writes assume one 1-hour write per model per working hour, so 176 a month (document 13, section 5).

**Design A: frontier model, long context, no cache (Opus 5.5).**
- Question: 4 calls × 150k input = 600k × $4/M = $2.40, plus 6k output × $20/M = $0.12. Total $2.52 × 1,100 = **$2,772.00**.
- Report: 5M input × $4/M = $20.00, plus 30k output × $20/M = $0.60. Total $20.60 × 4.333 = **$89.27**.
- Draft: 200k × $4/M = $0.80, plus 1.5k × $20/M = $0.03. Total $0.83 × 866.7 = **$719.33**.
- **Total $3,580.60/month**, or $11.94 per staff member. *Holds.*

**Design B: routed, cached, retrieval (the model still reads the numbers).**
- Router (Haiku): 2.5k cached × $0.01/M + 500 × $0.10/M + 100 × $0.50/M = $0.000125 per call. Calls = 1,100 + 4.33 + 866.7 = 1,971, so **$0.25**.
- Sonnet question: 80k cached × $0.10/M + 40k × $2/M + 6k × $10/M = $0.008 + $0.08 + $0.06 = $0.148.
- Opus question: 80k cached × $0.20/M + 40k × $4/M + 6k × $20/M = $0.016 + $0.16 + $0.12 = $0.296.
- Blend: 0.7 × 0.148 + 0.3 × 0.296 = $0.1924 × 1,100 = **$211.64**.
- Cache writes: 176 × 20k × ($4 + $8)/M = **$42.24**.
- Report, under Batch:
  - Haiku condenses 800k ledger tokens: 800k × $0.10/M = $0.08, plus 30k output × $0.50/M = $0.015.
  - Opus composes: 150k × $4/M = $0.60, plus 100k cached × $0.20/M = $0.02, plus 30k × $20/M = $0.60.
  - Sum $1.315, halved for Batch = $0.6575 × 4.333 = **$2.85**.
- Drafts: ($0.026 prefix + $0.02 uncached + $0.015 output) × 0.5 = $0.0305 × 866.7 = **$26.43**.
- **Total $283.41/month**, or $0.94 per staff member; A/B = 12.63x. *Holds as stated.*

**Design C: SQL computes; the model plans and explains.**
- Haiku question: 16k cached × $0.01/M + 8k × $0.10/M + 1.6k × $0.50/M = $0.00176 × 660 = $1.16.
- Sonnet question: 16k × $0.10/M + 8k × $2/M + 1.6k × $10/M = $0.0336 × 385 = $12.94.
- Opus question, uncached: 24k × $4/M + 1.6k × $20/M = $0.128 × 55 = $7.04.
- Questions subtotal **$21.14**.
- Cache writes (Haiku and Sonnet): 176 × 8k × ($4 + $0.20)/M = **$5.91**.
- Report, under Batch: (72k × $4/M + 8k × $20/M) × 0.5 = $0.224 × 4.333 = **$0.97**.
- Drafts: Haiku $0.0008 plus a Sonnet review on 20% (0.2 × $0.015 = $0.003), halved for Batch = $0.0019 × 866.7 = **$1.65**.
- Router: **$0.25**.
- **Total $29.91/month**, or $0.10 per staff member; B/C = 9.47x; A/C = 119.7x. *Holds.*

**Verdict on the arithmetic.** Every line in designs A, B and C reproduces to the cent from the stated assumptions. I recomputed it in a short script. These issues remain:

1. *Ambiguous draft input in design B.* "20k prefix over 2 calls" yields $0.026 only if the 20k is the total across both calls (10k at the read rate, 10k at the write rate). The 10k uncached input is also a total. If each call carried a 20k prefix and 10k of new input, the per-draft cost would be $0.0535, the drafts line $46.37 and B $303.34. A/B would still be about 11.8x. The conclusion stands either way.
2. *Sensitivity figures scale fixed costs.* "At 5x the usage, A ≈ $17,900, B ≈ $1,417, C ≈ $150" multiplies every line by 5, including the hourly cache writes, which do not grow with volume. Holding cache writes fixed gives B ≈ $1,248 and C ≈ $126. The text also says "250 questions a day", which suggests only questions scale. If so, A ≈ $14,668. The document's figures overstate B and C slightly, which is conservative.
3. *"A + caching ≈ $1,000–1,500" looks low.* Caching 60% of every input at the Opus read rate gives about $1,267 for questions, $324 for drafts and $40 for reports. Add 176 hourly writes of a 90k prefix at $8/M ($127), and the total is about **$1,758** [Inference]. The point that raw data per call is the irreducible cost still holds.
4. *Minor omissions.* The router's own hourly cache write in B and C (about $0.09) is left out. The first call of each hour is billed as both a write and a read, a slight double count. Both are immaterial.
5. *The token counts are assumptions*, not measurements. Document 13 says to replace them with p50/p90 figures from a pilot tenant.

**Copies.** Document 13, section 5. Prices from https://platform.claude.com/docs/en/about-claude/pricing.

**Left out.** No receivables-specific volumes exist in the documents. [Inference] A collections deployment may send far more than 200 drafts a week. The draft line in design C is cheap enough ($0.0019 each) that this hardly matters.

**Open questions.** The real token counts per task, measured on a pilot.

### 15. Credit-based pricing mechanics

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 15. Credit-based pricing mechanics](../../general-references/31-map-lingyang-alibaba-offers.md#15-credit-based-pricing-mechanics)

**Purpose.** Charge for rented-model usage through a pooled credit wallet with published rates, so cost cannot outrun price. Receivables example: a tenant with 5 seats gets a monthly credit pool; each answer, draft and sent message debits credits at a model-tier multiplier; when the pool runs out, new agent runs stop while already-approved sends finish.

**Design to implement.**
- Seat plus pooled credits, from the AgentOne Data Analysis Agent [Fact, 25 B2.3, B2.12]: CNY 300 per seat per month; minimum 5 seats in steps of 5; 8,000 credits per seat per month (100,000 a year on annual plans) in a shared pool; top-up CNY 10,000 per 1M credits (CNY 0.01 per credit); add-ons priced in credits per year; included allowances.
- Wallet rules from QwenWork [Fact, 08 §5]: each seat adds 2,000 credits a month into a shared pool; no rollover; packs last one year; deduction order: seat credits first, then packs by earliest expiry; seats added mid-period prorated; reductions at renewal; no direct downgrade.
- Per-model multipliers: 0.1× economy, 0.25× basic, 1× advanced, 1.1× top model [Vendor claim via press, 08 §5].
- Palantir's metering: LLM tokens converted to compute-seconds per model; minimum charges per Ontology query (2 to 18 compute-seconds); overage invoiced once it reaches $1M [Fact as listed, 25 A2.11]. [Inference] Copy the idea of a minimum charge per query so tiny calls still cover fixed cost.
- Hard caps without surprise bills: Palantir's Developer Tier limits cannot be exceeded by accident and capacity shows on a "Your Plan" page [Vendor claim, 06 §7].
- Exhaustion behaviour: for the ad-creative agent, service may stop when credits run out [Fact, 25 B2.3]. [Inference] For collections, stopping mid-cadence is a business risk: block new runs and new drafts, allow already-approved sends to finish, alert the admin at 80% and 100%.
- Capacity limits per agent: Palantir has TPM and RPM limits by project and user with 20% reserved for interactive use [Fact as listed, 25 A2.5]. [Inference] Per-agent daily credit caps plus a reserved share for interactive questions.
- Ledger [Inference]: `credit_grant (tenant_id, source seat|pack|trial|promo, amount, starts_at, expires_at)`, `credit_debit (tenant_id, grant_id, event_id, model, tokens_in, tokens_out, multiplier, credits)`, debits allocated in the QwenWork order.
- Price shape for version 1, from 25 row 41: platform fee per tenant plus credits, priced against the receivables handled; never outcome-only pricing at the start.
- Trial: a starter pack, as Lingyang's 150,000-credit pack (about CNY 1,500 at the Data Analysis Agent rate [Inference, 25 B2.12]).

**Copies.**
- 25, B2.3 and B2.12 AgentOne prices. https://help.aliyun.com/en/document_detail/3029849.html ; https://help.aliyun.com/en/document_detail/3026326.html
- 08, §5 QwenWork enterprise credits. https://help.aliyun.com/zh/qwenwork/product-faq ; https://www.ifanr.com/1673691
- 06, §7 Developer Tier. https://community.palantir.com/t/why-can-i-only-add-up-to-5-users-in-palantir-foundry/3911
- 25, A2.11 Palantir meters; C6 rows 36 and 41.

**Left out, and why.** Outcome-linked "free until results" deals: need capital [Press, 07 §3; 25]. Per-shop quotas: e-commerce specific [Inference].

**Open questions.** The credit cost of one reminder, answer or classification has no source; it must be measured in pilots. Whether to price in MYR, USD or both.

## Fact-check notes

_No time-sensitive claims in this component were re-checked in the 28 Nov 2026 pass; its sources are dated 21–27 Nov 2026. See the linked references for their own open questions._

## Gaps

- No open-source implementations material in the research yet.
- No research literature material in the research yet.
