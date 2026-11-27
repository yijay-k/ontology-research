# Cost and economics of running an agent product on rented models

Scope: what it costs to run an ontology-backed agent product (internal reporting, Q&A and outbound drafting for companies of 100 to 1,000 staff) on rented models from Anthropic, OpenAI, Google and Alibaba (Qwen). The document covers current list prices and rules, the evidence behind each cost-reduction technique, how Palantir meters AIP, how Sierra, Decagon, Fin, Harvey, Glean and Lingyang AgentOne charge, what is known about AI application gross margins, a worked monthly cost model for a 300-person customer, infrastructure cost at 10, 100 and 1,000 customers, build and compliance cost, and pricing models. All prices were read from official pricing pages on 21 November 2026 unless a different date is given. Prices change often (Google has increases scheduled for 1 December 2026 and 1 January 2027), so re-check them before quoting. Labels: [Fact] means sourced with a URL; [Vendor claim] means a vendor's own unaudited figure; [Estimate] means my own arithmetic on stated assumptions; [Inference] means my own reasoning; [Unverified] means I could not confirm it. My web search and fetch budgets ran out near the end of the research. Items I could not open are listed under Open questions.

## Key findings

1. **The architecture decides the model bill, not the choice of vendor.** In the worked model below, one 300-person customer costs about **$3,580/month** when everything goes through a frontier model with long context. Routing plus caching brings that to about **$283/month**. Computing the numbers in SQL and using the model only to plan and explain brings it to about **$30/month** [Estimate]. That is a 120x spread on the same workload. The change that matters most is keeping raw data out of the prompt.
2. **Frontier prices have converged and fallen.** The flagship tiers cost $4 to $8 per million input tokens and $20 to $40 per million output tokens: Claude Opus 5.5 is $4/$20, GPT-6.2 Astra $8/$40, and Gemini 4 Argon $2/$10, rising to $4/$20 on 1 Dec 2026. The workhorse tiers are $2/$10 (Claude Sonnet 5.5, GPT-6.2 Sol). The small tiers are $0.10/$0.50 (Claude Haiku 5.5 under 100k prompt tokens, GPT-6 Luna) or less (Qwen3.7-flash at $0.03/$0.13 under 32k). All [Fact]; sources in the Breakdown.
3. **Cache reads now cost 2.5% to 20% of the normal input price.** Anthropic charges 0.05x on Opus 5.5 and Sonnet 5.5 and 0.1x on most other models. OpenAI charges 0.05x on GPT-6.2 Astra and Sol and 0.1x on others. Qwen charges 10% (explicit) or 20% (implicit). Writing to the cache costs extra: 1.25x for 5 minutes or 2x for 1 hour on Anthropic, and 1.25x for 30 minutes or 2.5x for 12 hours on OpenAI. On Anthropic, cache reads **do not count toward the input-tokens-per-minute rate limit** [Fact]. A stable prompt prefix is the cheapest thing you can build.
4. **Batch processing is 50% off at every vendor.** Anthropic lets caching and batch discounts stack. Qwen does not. Anthropic batches usually finish within an hour and expire after 24 hours [Fact]. Weekly reports and bulk outbound drafts should never run at real-time prices.
5. **Tool definitions are a hidden cost.** On Anthropic, simply providing tools adds 286 to 406 system tokens per request on current models. A five-server MCP setup can use about 55k tokens of definitions before any work starts. Tool search cuts that by more than 85%, and Anthropic reports MCP-eval accuracy rising from 49% to 74% (Opus 4) [Fact/Vendor claim].
6. **Published savings for the main techniques:**
   - prompt caching: up to 90% cost and 85% latency [Vendor claim]
   - context editing: 84% fewer tokens on a 100-turn task [Vendor claim]
   - programmatic tool calling: 37% fewer tokens [Vendor claim]
   - code execution over MCP: 150k to 2k tokens in one example [Vendor claim]
   - RouteLLM: 85% cheaper on MT-Bench at about 95% of GPT-4 quality [Fact, paper]
   - FrugalGPT cascades: up to 98% [Fact, paper]
   - semantic caching: up to 68.8% fewer API calls with more than 97% correct hits [Fact, paper]

   Most of these are vendor or academic benchmarks, not production audits.
7. **Flat per-seat pricing on top of per-token costs can wipe out the margin.** Harvey charges per seat with unlimited use. Its token use rose about 20x after an agent update, and its gross margin reportedly went from about 50% to about −50% between early and mid-2026. Harvey recovered by post-training an open-weight model (Kimi K3) with Fireworks [Secondary report of Bloomberg; Harvey's own post confirms the post-training and 90% / 10x cost cuts on specific features]. Any seat price needs a usage pool or cap behind it.
8. **The market now sells seats plus pooled credits, or charges per outcome.**
   - Glean includes 100 standard assistant queries per user per week in each seat. Everything else draws on pooled "FlexCredits" [Fact].
   - Lingyang AgentOne's Data Analysis Agent costs CNY 300 per seat per month, includes 8,000 pooled credits per seat, and sells top-ups at CNY 10,000 per 1M credits [Fact].
   - Fin charges $0.99 per outcome with a 50-outcome monthly minimum [Fact].
   - ICONIQ (July 2026) found consumption pricing rising from 35% to 42% of builders and outcome pricing from 18% to 23%, with companies blending 1.7 pricing models on average [Fact].
9. **AI application gross margins average roughly 45 to 60%, below SaaS.** ICONIQ reports 45% average AI product gross margin in 2025, a projected 53% in 2026 and 59% in 2027. Bessemer (Aug 2025) reports about 25% for fast "Supernovas" and about 60% for "Shooting Stars" [Fact]. A design that computes in SQL makes 80%+ achievable for this product type [Inference from the worked model].
10. **Palantir meters LLM use in "compute-seconds".** The conversion is tokens × a per-model rate ÷ 10,000 (for example Claude 4.5 Sonnet at 51.8 input and 259.1 output per 10k tokens). Ontology queries carry minimum compute-second charges (2 for a base query, 5 for an aggregation, 18 for an Action plus 1 per extra object edited). LLM capacity is governed by tokens-per-minute and requests-per-minute limits at enrollment, project and user level, with 20% always reserved for interactive use [Fact]. Palantir does not publish the dollar price of a compute-second [Fact: docs say to ask your rep].
11. **Infrastructure is small next to people and compliance.** A multi-tenant stack (managed Postgres with pgvector, app hosting, a job queue, LLM tracing, error tracking) costs about $600/month at 10 customers, $2,100 at 100 and $13,800 at 1,000 [Estimate from list prices]. Per customer, that falls from about $60 to $14.
12. **SOC 2 costs $25k to $50k in the first year for a small company.** The Type 2 audit fee alone is $12k to $20k [Fact: Drata]. One 12-person startup itemised $47.2k, including $18k for the auditor and $6k for Vanta [Fact, self-reported].
13. **Mid-market finance-operations software sells for $15k to $77k a year.** Vendr data: Numeric median $15,000/yr (n=42), FloQast median $24,481/yr (n=312), BlackLine average about $77,000/yr [Fact, Feb 2026 updates]. A product that writes a 300-person company's weekly finance report and answers its finance questions can be priced in the FloQast band. At design C costs, models would then be under 2% of revenue [Estimate].
14. **Fine-tuning closed models is mostly unavailable.** OpenAI lists only two deprecated GPT-4.1 models for fine-tuning and has closed it to new users. Claude fine-tuning has only ever been offered for Claude 3 Haiku on Bedrock. The only route to a cheaper specialised model is distilling into open-weight models on Together or Fireworks [Fact/Inference].

## Breakdown

### 1. Model list prices (November 2026)

Plain English: you pay per token, the chunks of text the model reads (input) and writes (output). Output costs about 5x input everywhere. Example: a question that sends 10,000 tokens and gets 500 back from Claude Sonnet 5.5 costs 10,000 × $2/1M + 500 × $10/1M = $0.02 + $0.005 = $0.025.

**Anthropic (Claude)** [Fact: https://platform.claude.com/docs/en/about-claude/pricing; https://platform.claude.com/docs/en/about-claude/models/overview]

| Model | Input $/MTok | Output $/MTok | 5-min cache write | 1-h cache write | Cache read | Batch in/out | Context / max output |
|---|---|---|---|---|---|---|---|
| Claude Fable 5.2 (top tier) | 8 | 40 | 10 | 16 | 0.20 | 4 / 20 | 1M / 128K |
| Claude Opus 5.5 | 4 | 20 | 5 | 8 | 0.20 | 2 / 10 | 1M / 128K |
| Claude Sonnet 5.5 | 2 | 10 | 2.50 | 4 | 0.10 | 1 / 5 | 1M / 128K |
| Claude Haiku 5.5 (≤100k prompt) | 0.10 | 0.50 | 0.125 | 0.20 | 0.01 | 0.05 / 0.25 | 1M / 128K |
| Claude Haiku 5.5 (>100k prompt) | 0.50 | 2.50 | 0.625 | 1 | 0.05 | 0.25 / 1.25 | |
| Claude Haiku 4.5 (older) | 1 | 5 | 1.25 | 2 | 0.10 | 0.5 / 2.5 | 200K / 64K |

- Anthropic describes Opus 5.5 as the model to "Start here for most workloads". Haiku 5.5 is positioned for classification, extraction and routing [Fact, models overview].
- Claude 4.6 and later include the full 1M context at standard price, except Haiku 5.5, which prices the whole request by prompt length. Prompt length includes cache reads and writes [Fact].
- Tokenizer: Claude 4.7 and later produce about 30% more tokens for the same text than earlier models [Fact]. Compare cost per task, not price per token.
- Data residency: `inference_geo: "us"` costs 1.1x on all token categories. Bedrock and Google-managed regional endpoints carry a 10% premium [Fact].
- Fast mode: Opus 5.5 costs $8/$40, roughly 2x, for up to 2.5x output speed. It is not available in Batch [Fact].
- Built-in tools:
  - web search: $10 per 1,000 searches plus the result tokens
  - web fetch: tokens only
  - code execution: free with the 2026-02-09 search/fetch tools; otherwise 1,550 free container-hours per month, then $0.05 per hour
  - tool-use system prompt: 286 tokens (`auto`/`none`) or 406 tokens (`any`/`tool`) on Opus/Sonnet/Haiku 5.5
  - bash tool: +325 tokens; text editor: +974; computer use toolset: about +4,520; browser toolset: about +6,610 [Fact]
- Rate limits [Fact: https://platform.claude.com/docs/en/api/rate-limits]:
  - Monthly spend caps: Start $500, Build $1,000, Scale $200,000; Custom has none.
  - Opus/Sonnet/Haiku 5.5 each get 4,000 RPM, 2M ITPM and 400k OTPM at Start, rising to 13,000 RPM, 10M ITPM and 2M OTPM at Scale.
  - `cache_read_input_tokens` do not count toward ITPM. Cache writes and uncached input do.
  - Batch: up to 100,000 requests per batch, and a 200k to 500k request queue depending on tier.

**OpenAI (GPT-6 family)** [Fact: https://developers.openai.com/api/docs/pricing; https://developers.openai.com/api/docs/models]

| Model | Input | Cached input | Output | Batch in/out | Context / max output |
|---|---|---|---|---|---|
| gpt-6.2-astra (flagship) | 8 | 0.40 | 40 | 4 / 20 | 1.05M / 128K |
| gpt-6.2-sol (balanced) | 2 | 0.10 | 10 | 1 / 5 | 1.05M / 128K |
| gpt-6.1-terra (fast) | 1 | (flex 0.025) | 5 | flex 0.50 / 2.50 | 1.05M / 128K |
| gpt-6-luna (smallest) | 0.10 | (flex 0.005) | 0.50 | flex 0.05 / 0.25 | 1.05M / 128K |

- Background requests are 30% off for a 2-hour window and 40% off for an 8-hour window [Fact].
- Priority ("Fast mode") is 2x [Fact].
- Regional processing and FedRAMP endpoints carry +10% for models released on or after 5 Mar 2026 [Fact].
- The pricing page has a short/long context toggle, but the fetched content did not show the long-context rates [Unverified].
- Built-in tools [Fact]:
  - web search: $10 per 1k calls plus content tokens
  - file search: $2.50 per 1k calls, plus storage at $0.10/GB-day after 1 GB free
  - hosted shell / code interpreter containers: $0.03 per 20-minute session for 1 GB, up to $1.92 for 64 GB
- Usage tiers [Fact: https://developers.openai.com/api/docs/guides/rate-limits]:
  - Build: $5 paid; $500/month limit; 5,000 RPM and 1M TPM on Astra/Sol/Terra
  - Launch: $100 paid; $5,000/month; 10,000 RPM and 4M TPM
  - Grow: $500 paid; $200,000/month; 15,000 RPM and 40M TPM (Luna 180M TPM)
- Fine-tuning: only the deprecated gpt-4.1 and gpt-4.1-mini, closed to new users [Fact].

**Google (Gemini Developer API)** [Fact: https://aistudio.google.com/docs/pricing]

| Model | Input | Output | Cache read | Cache storage /MTok-hour | Batch/Flex in/out |
|---|---|---|---|---|---|
| Gemini 4 Argon | 2.00 → 4.00 from 1 Dec 2026 | 10.00 → 20.00 | 0.10 → 0.20 (implicit only) | n/a | 1.00/5.00 → 2.00/10.00 |
| Gemini 3.8 Flash | 0.75 → 1.50 from 1 Jan 2027 | 3.75 → 7.50 | 0.075 → 0.15 | 0.50 → 1.00 | 0.375/1.875 → 0.75/3.75 |
| Gemini 3.5 Flash-Lite | 0.30 | 2.50 | 0.03 | 1.00 | 0.15/1.25 |
| Gemini 3.1 Flash-Lite | 0.25 | 1.50 | 0.025 | 1.00 | 0.125/0.75 |
| Gemini 3.1 Pro Preview | 2.00 (≤200k) / 4.00 | 12.00 / 18.00 | 0.20 / 0.40 | 4.50 | 1.00/6.00 (≤200k) |

- Grounding with Google Search on Gemini 3+: 5,000 free requests per month, then $14 per 1,000 [Fact].
- Priority tier is about 1.8x standard [Fact].
- Rate-limit tiers [Fact: https://aistudio.google.com/docs/rate-limits]:
  - Tier 1: billing linked; $250 cap
  - Tier 2: $100 paid and 3 days; $2,000 cap
  - Tier 3: $1,000 paid and 30 days; $20k to $100k+ cap
  - Per-model RPM and TPM are shown only in the AI Studio console.
- Gemini context windows: not confirmed (the models page fetch failed) [Unverified].
- **Google's prices are rising**: Argon doubles on 1 Dec 2026 and 3.8 Flash doubles on 1 Jan 2027 [Fact]. Do not build the margin on today's Google price.

**Alibaba Model Studio (Qwen), Singapore/international** [Fact: https://www.alibabacloud.com/help/en/model-studio/model-pricing]

| Model | Input | Output | Notes |
|---|---|---|---|
| qwen4-max | 1.5 | 4.5 | 5-min cache write 1.875; 1-h write 3; cache hit 0.075 |
| qwen3.8-max | 2 | 6 | |
| qwen3.7-plus | 0.4 (≤256k) / 1.2 (256k–1M) | 1.6 / 4.8 | 1M free tokens; 20% promo noted |
| qwen3.8-flash | 0.15 | 0.47 | |
| qwen3.7-flash | 0.03 (≤32k) / 0.10 (≤256k) / 0.20 (≤1M) | 0.13 / 0.40 / 0.80 | cheapest capable tier |

- The whole request is billed at the tier that its total input falls into [Fact].
- Batch is 50% of real-time and cannot be combined with cache discounts [Fact].
- Context cache [Fact: https://www.alibabacloud.com/help/en/model-studio/context-cache]:
  - explicit: creation 125% of input price; hit 10%; 1,024-token minimum; 5-minute TTL refreshed on each hit
  - implicit: creation 100%; hit 20%; automatic and cannot be turned off
  - the two modes are mutually exclusive

**Open-weight models hosted by others** (the alternative to closed APIs)
- Together serverless prices per MTok in/out [Fact: https://www.together.ai/pricing]:
  - gpt-oss-120B: $0.15 / $0.60
  - Qwen3.5 9B: $0.17 / $0.25
  - DeepSeek V4.1 Flash: $0.30 / $1.20
  - GLM-5.3: $1.40 / $4.40
  - Kimi K3: $3.00 / $15.00
- Together dedicated GPUs: H100 $5.49/hr, H200 $5.99, B200 $9.29. Cluster H100s cost $1.99 preemptible to $3.99 on-demand [Fact].
- Fireworks [Fact: https://fireworks.ai/pricing]:
  - Qwen 3.8 Max: $2.00 / $0.25 cached / $6.00
  - gpt-oss-120B: $0.15 / $0.015 / $0.60
  - batch 50% off; cached input half price or less with no write fee
  - on-demand H100: $8/hr; region-restricted deployments 1.5x
  - fine-tuning example: Qwen 3.6 35B A3B at $0.45 prefill / $1.335 sample / $2.14 train per MTok
- Dedicated GPUs only pay off at sustained load. One H100 at $5.49/hr runs about $4,000/month [Estimate: 730 h × $5.49 = $4,008], which is more than the entire design C model bill for 100 customers (see section 5). Use serverless open models for cheap high-volume steps. Do not rent a GPU before you have steady volume [Inference].

### 2. Prompt caching rules (the largest single lever)

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

### 5. Worked cost model: one 300-staff customer, per month

Plain English: the same three jobs costed three ways. The only things that change are how much text goes into the model and which model reads it.

**Shared assumptions** [Estimate]
- 22 working days a month and 52/12 = 4.333 weeks a month.
- Volumes: 50 questions/day = 1,100 questions/month; 1 finance report/week = 4.33 reports/month; 200 outbound drafts/week = 866.7 drafts/month.
- Prices (Anthropic list, Nov 2026, per MTok):
  - Opus 5.5: $4 in / $20 out; cache read $0.20; 1-h write $8; 5-min write $5
  - Sonnet 5.5: $2 / $10; read $0.10; 1-h write $4; 5-min write $2.50
  - Haiku 5.5 (≤100k prompt): $0.10 / $0.50; read $0.01; 1-h write $0.20
  - Batch: 50%
- Token counts are model tokens and include reasoning output.
- Cache write cost for design B and C uses one 1-hour write per model per working hour: 8 h × 22 days = 176 writes a month.
- Arithmetic was computed in a script; figures are rounded.

**Design A: everything through a frontier model with long context** (Opus 5.5, no caching, raw data in the prompt)
- Question: 4 agent calls × 150k input (schema docs, metric definitions, raw extracts) = 600k input; 4 × 1.5k = 6k output.
  - 600k × $4/M = $2.40; 6k × $20/M = $0.12. **$2.52 per question** × 1,100 = **$2,772**
- Weekly report: 10 passes × 500k tokens of ledger extracts = 5M input; 30k output.
  - $20.00 + $0.60 = **$20.60 per report** × 4.333 = **$89**
- Outbound draft: 2 calls (draft, self-check) × 100k context (CRM history, policies) = 200k input; 1.5k output.
  - $0.80 + $0.03 = **$0.83 per draft** × 866.7 = **$719**
- **Total ≈ $3,581/month (about $11.94 per staff member)**

**Design B: routed, cached, retrieval instead of long context** (the model still reads the numbers)
- Router: Haiku 5.5 classifies every request with a 2.5k cached prefix, 500 new tokens and 100 output tokens.
  - About $0.000125 per call × about 1,971 calls = **$0.25**
- Questions: 70% go to Sonnet 5.5 and 30% to Opus 5.5. Each of 4 calls has a 20k cached prefix plus 10k retrieved/new tokens; 1.5k output per call.
  - Sonnet: 80k × $0.10 + 40k × $2 + 6k × $10 = $0.008 + $0.08 + $0.06 = $0.148
  - Opus: 80k × $0.20 + 40k × $4 + 6k × $20 = $0.016 + $0.16 + $0.12 = $0.296
  - Blend: 0.7 × 0.148 + 0.3 × 0.296 = $0.1924 × 1,100 = **$211.64**
- Cache writes: 176 × 20k × ($4 + $8)/M = **$42.24**
- Report (Batch):
  - Haiku condenses 800k ledger tokens in 10 chunks of 80k (staying under the 100k tier): $0.08 in + 30k out × $0.50/M = $0.015.
  - Opus composes from 150k uncached + 100k cached tokens with 30k output: $0.60 + $0.02 + $0.60.
  - Sum $1.315 × 0.5 = **$0.66 per report** × 4.333 = **$2.85**
- Drafts (Batch, Sonnet): 20k prefix over 2 calls at an assumed 50% batch cache-hit rate (half at $0.10, half at the $2.50 write rate) = $0.026; 10k uncached = $0.02; 1.5k output = $0.015.
  - $0.061 × 0.5 = **$0.0305 per draft** × 866.7 = **$26.43**
- **Total ≈ $283/month (about $0.94 per staff member); 12.6x cheaper than A**

**Design C: numbers computed in SQL over the semantic layer; the model only plans and explains**
- The model picks metrics and filters from the governed catalogue (found through tool search). The platform compiles and runs the SQL. The model sees a result table of about 1k tokens and writes the explanation.
- Questions: 2 calls each (plan, then explain). Each call has an 8k cached prefix plus 4k new tokens; 800 output per call. Mix: 60% Haiku 5.5, 35% Sonnet 5.5, 5% Opus 5.5 (Opus assumed uncached because it is used so rarely).
  - Haiku: 16k × $0.01 + 8k × $0.10 + 1.6k × $0.50 = $0.00176 × 660 = $1.16
  - Sonnet: 16k × $0.10 + 8k × $2 + 1.6k × $10 = $0.0336 × 385 = $12.94
  - Opus: 24k × $4 + 1.6k × $20 = $0.128 × 55 = $7.04
  - Questions subtotal: **$21.14**
- Cache writes (Haiku and Sonnet only): 176 × 8k × ($4 + $0.20)/M = **$5.91**
- Report (Batch, Opus): SQL produces all KPI and variance tables (about 10k tokens). The model plans and writes 3 sections: 4 calls × 18k input = 72k; 8k output.
  - ($0.288 + $0.16) × 0.5 = **$0.224 per report** × 4.333 = **$0.97**
- Drafts (Batch): Haiku drafts from template plus SQL-pulled CRM fields (5k in, 600 out) = $0.0008. Sonnet reviews the 20% flagged by rules (6k in, 300 out) = $0.015 × 0.2 = $0.003.
  - $0.0038 × 0.5 = **$0.0019 per draft** × 866.7 = **$1.65**
- Router: **$0.25**
- **Total ≈ $29.91/month (about $0.10 per staff member); 9.5x cheaper than B and 120x cheaper than A**

**Sensitivity** [Estimate]
- At 5x the usage (250 questions a day), A ≈ $17,900, B ≈ $1,417 and C ≈ $150 a month.
- Adding Anthropic's 1.1x US-residency multiplier raises each total by 10%.
- Switching design C to Qwen3.7-flash and qwen3.7-plus, or to GPT-6 Luna and Sol, gives the same order of magnitude [Inference from the prices above].
- Design A is overstated if you also add caching to it, since about 60% of its input could be a cached prefix. A + caching would still come to roughly $1,000 to $1,500 [Estimate]. The irreducible cost in A is the 150k tokens of raw data per call.
- Quality [Inference]: C should also be more accurate on numbers, because arithmetic is done by the database and the figures can be traced. This matches the brief's premise that agents should work through a governed model.

### 6. Infrastructure for a small multi-tenant deployment

Plain English: besides model calls, you pay for a database, servers to run the app and background jobs, and tools to see what the agent did and what broke.

List prices [Fact]:
- **Supabase** (https://supabase.com/pricing): Pro from $25/month; Team from $599/month (SOC 2 report, HIPAA add-on); compute Micro $10 to 16XL $3,730; disk $0.125/GB; PITR $100/month per 7 days of retention.
- **Neon** (https://neon.com/pricing): Launch $0.106 per CU-hour; Scale $0.222 per CU-hour (SOC 2 and HIPAA); storage $0.35 per GB-month.
- **Render** (https://render.com/pricing): Pro workspace $25, Scale $499; services $25 (1 CPU / 2 GB) to $300 (8 CPU / 16 GB); Postgres $55 (1 CPU / 4 GB) to $800 (16 CPU / 64 GB); Key Value from $10.
- **Inngest** (https://www.inngest.com/pricing): Pro from $99 with 1M executions; Business $499 with 10M.
- **Langfuse** (https://langfuse.com/pricing): Core $29; Pro $199 (SOC 2 / ISO reports) with 100k units, then $8 per 100k; Enterprise $2,499.
- **Sentry** (https://sentry.io/pricing/): Team $29, Business $89.

| Line | 10 customers | 100 customers | 1,000 customers |
|---|---|---|---|
| App hosting (Render) | Pro $25 + 3 × $25 services = $100 | 4 web + 4 worker × $85 (2 CPU / 4 GB) + $25 = $705 | 12 web + 12 worker × $300 (8 CPU / 16 GB) + Scale $499 = $7,699 |
| Postgres + pgvector (Neon Scale for SOC 2) | ~1 CU × 730 h × $0.222 = $162 + 20 GB × $0.35 = $7 → ~$170 | ~4 CU avg = $648 + 200 GB = $70 + headroom → ~$800 | ~16 CU = $2,593 + 2 TB = $700 → ~$3,300 |
| Redis / KV | none | $60 | $200 |
| Job queue / workflows | Inngest Pro $99 (or a Postgres queue at $0) | $99 | Inngest Business $499 |
| LLM tracing (Langfuse Pro) | $199 | 2M units → $199 + 19 × $8 = $351 | 20M units → ~$1,800 (or self-host) |
| Errors (Sentry) | $29 | $89 | ~$300 with overage |
| **Total / month** | **≈ $600** | **≈ $2,100** | **≈ $13,800** |
| Per customer | ≈ $60 | ≈ $21 | ≈ $14 |

All rows are [Estimate]. The trace-unit volumes assume about 2,000 agent requests per customer per month and about 10 observations per request.

- Compared with design C's model cost of about $30 per customer, infrastructure and model costs are similar in size. The total technical cost of goods is about $50 to $90 per customer per month [Estimate].
- Supabase Team ($599) is the simplest way to get a vendor SOC 2 report on the database layer. Neon Scale has SOC 2 at usage pricing [Fact on plan availability].
- Shared-schema multi-tenancy with row-level security keeps one database for everyone up to hundreds of customers. Database-per-tenant multiplies the fixed minimums [Inference].

### 7. What the build itself costs

- **Coding-agent tooling** [Fact]:
  - Claude Pro: $20/month. Max: $100/month (5x Pro). Ultra: $200/month (10x weekly usage). Claude Code is included in all paid plans (https://claude.com/pricing).
  - Cursor: Premium $30, Super $100, Ultra $200 (https://cursor.com/pricing).
  - Realistic solo budget [Estimate]: one $200 plan plus $200 to $1,000/month of API spend for evals and test tenants, so about $400 to $1,200/month.
- **Effort** [Estimate; no rigorous published benchmark found]:
  - Design-partner v1 (semantic layer over Postgres, connectors for one ERP or accounting system, the question/report/draft agents, permissions, audit log, evals): about 4 to 6 months full-time with a coding agent.
  - Connectors, permission edge cases and eval datasets dominate. Model integration is the easy part.
- **SOC 2** [Fact]:
  - Drata (https://drata.com/learn/soc-2/cost): Type 1 audit $7.5k to $15k and Type 2 audit $12k to $20k for small and mid-size companies; first-year total about $25k to $50k for a startup; pen test $5k to $15k; $15k to $40k a year recurring.
  - A 12-person startup's itemised Type II cost was $47.2k: auditor $18k (including readiness), Vanta $6k/yr, policy consultant $4.5k, about 320 engineering hours ≈ $12k, pen test $3.5k, plus training, background checks and MDM [Self-reported: https://dev.to/robertatkinson3570/soc-2-cost-us-47k-here-59bf].
  - Vanta does not publish prices [Fact: https://www.vanta.com/pricing].
- **First hire** [Inference with precedent]: a forward-deployed / implementation engineer who maps each customer's data into the ontology and writes its metric definitions.
  - Lingyang describes AgentOne as resting on three pillars: data, agent and FDE (forward-deployed engineers who onboard and "train" the AI employee) [Fact: https://help.aliyun.com/document_detail/3004555.html].
  - Palantir's model is the same.
  - The bottleneck is onboarding each customer's data model, not product code.

### 8. Competitor pricing and margins

| Company | How it charges | Known numbers | Margin evidence |
|---|---|---|---|
| Fin (Intercom) | Per outcome | $0.99 per outcome (resolution, procedure handoff, disqualification, self-serve routing); $9.99 per qualification; 50-outcome monthly minimum; one charge per conversation; unresolved handoffs free; Copilot $35/user/month [Fact: https://fin.ai/pricing] | Not published |
| Sierra | Volume-based for routine work, per resolution for complex work; no public price list | ARR estimates: $130M end-2025, $400M Oct 2026 [Sacra estimate: https://www.sacra.com/c/sierra] | Not published [Unverified] |
| Decagon | Per conversation (more common) or a higher per-resolution rate; volume discounts | ~$100M annualised July 2026 [Sacra estimate: https://sacra.com/c/decagon/] | Not published |
| Harvey | Per seat, unlimited use | From $1,200 per lawyer per month, 12-month term, ~20-seat minimum [Sacra: https://www.sacra.com/c/harvey] | Reported: ~50% GM early 2026 → ~−50% June 2026 after token use rose ~20x; positive after the Aug 2026 Tenet launch [secondary summary of Bloomberg, 21 Sep 2026: https://andrew.ooo/answers/why-harvey-post-trained-kimi-k3-negative-gross-margin-september-2026/]. Harvey's own post confirms the post-trained open models and cost cuts but not the margins |
| Glean | Per seat plus pooled FlexCredits | Seat includes 100 Basic/Standard assistant queries per user per week. Typical credits: Basic query ~7 (p50) / ~26 (p90); Premium query ~35 / ~120; agent run ~7 / ~114. Customer-supplied LLM keys get discounted rates [Fact: https://docs.glean.com/glean-enterprise-flex-pricing]. Contracts ~$100k–$500k initial [Sacra: https://sacra.com/c/glean/] | Not published |
| Lingyang AgentOne (Data Analysis Agent) | Per seat plus pooled credits | CNY 300 per seat per month, 5-seat minimum, 8,000 credits per seat per month pooled; top-ups CNY 10,000 per 1M credits (CNY 0.01 per credit, so each seat carries about CNY 80 of credits); add-ons priced in credits (an ETL bundle is 3M credits per 50 tasks per year) [Fact: https://help.aliyun.com/en/document_detail/3029849.html]. The ad-creative agent sells credit editions at CNY 0.09–0.10 per credit; service may stop when credits run out [Fact: https://help.aliyun.com/en/document_detail/3026326.html] | Not published |
| Palantir | Contracted compute-second pools plus licence | See section 4 | Gross margin not retrieved [Unverified] |

Industry margin commentary:
- **ICONIQ, July 2026** (survey of about 300 executives): average AI product gross margin 45% in 2025, projected 53% in 2026 and 59% in 2027. Inference's share of cost rises with scale. Anthropic is used by 81% of builders (up from 51% in Q4 2025). Companies use about 3.3 models on average [Fact: https://www.iconiq.com/growth/insights/state-of-ai-2026].
- **Bessemer, 13 Aug 2025**: "Supernovas" average about 25% gross margin (often negative); "Shooting Stars" about 60% [Fact: https://www.bvp.com/atlas/the-state-of-ai-2025].
- **SaaStr's compilation** (secondary, sources mostly unnamed): OpenAI compute margin about 35% in Jan 2024 rising to about 70% in Oct 2025 (citing The Information); Cursor about −30% in mid-2025; Replit −14% rising to 36% during 2025 [Secondary: https://www.saastr.com/have-ai-gross-margins-really-turned-the-corner/]. Treat these as indicative only.

### 9. Pricing the product

Evidence on what mid-market buyers accept:
- **Finance-ops software ACVs** [Fact, Vendr, updated Feb 2026]:
  - Numeric: median $15,000/yr, range $4,320–$34,070, n=42 (https://www.vendr.com/marketplace/numeric)
  - FloQast: median $24,481/yr, range $10,147–$68,727, n=312 (https://vendr.com/marketplace/floqast)
  - BlackLine: average about $77,000/yr, up to $340,000 (https://www.vendr.com/buyer-guides/blackline)
  - Numeric prices on transactions and seats [Fact: https://www.numeric.io/pricing].
- **Pricing model trends**: per ICONIQ, consumption pricing and outcome pricing are both rising, and subscriptions remain the most common [Fact].
- **Per seat**: easy for buyers, but it caused Harvey's margin problem [Secondary]. Glean and AgentOne solve this with seat-included allowances plus pooled credits [Fact].
- **Per outcome**: works when the outcome is countable and the buyer agrees on the definition. Fin defines a resolution as no further help requested after Fin's last answer [Fact]. For finance reporting, the obvious outcomes are a report delivered or a reconciliation closed, which are lumpier than support tickets [Inference].
- **Recommended structure** [Estimate/Inference]:
  - A per-company platform fee in the FloQast band: about $1,500 to $2,500/month for a 300-person company, about $18k to $30k a year.
  - An included pooled allowance, for example 2,000 questions and 1,000 drafts a month.
  - Credits for overage.
  - Optional per-outcome add-ons for outbound messages actually sent.
  - At design C cost (about $30 model + $20 to $60 infrastructure), technical COGS is under 5% of a $2,000/month fee. Onboarding and support labour then dominate COGS.
  - Under design A, the same fee would leave about 0% to −80% gross margin, depending on usage [Estimate: $3,581 model cost against $2,000].

## What to copy

1. **Compute numbers in a governed query layer; never let the model do arithmetic on raw rows.** The model emits a structured query plan (metric IDs, dimensions, filters, time grain). The platform compiles it to SQL, runs it under the user's permissions, and returns a result table capped at about 1k to 2k tokens. In the worked model this is the 9.5x step from design B to design C. Source: Palantir's metering separates ontology aggregations (5 compute-seconds) from LLM tokens, https://palantir.com/docs/foundry/ontologies/query-compute-usage/ ; Anthropic code-execution pattern (150k → 2k tokens), https://www.anthropic.com/engineering/code-execution-with-mcp.
2. **Lay out every prompt as a fixed prefix (tools → system → catalogue) followed by a variable suffix.** Put a 1-hour cache breakpoint at the end of the prefix. Never put timestamps, user names or tenant IDs in the prefix. Keep tool order deterministic. Log `cache_read_input_tokens` and `cache_creation_input_tokens`, and alert if the hit ratio drops below about 80%. Source: https://platform.claude.com/docs/en/build-with-claude/prompt-caching.
3. **Route every request through a small-model classifier** (Haiku 5.5, GPT-6 Luna or Qwen3.7-flash) into easy, standard or hard. Default to the cheapest model that passes your eval for that class. Escalate on a validator failure, not on a guess. Source: RouteLLM https://lmsys.org/blog/2024-07-01-routellm/ ; FrugalGPT https://arxiv.org/abs/2305.05176 ; ICONIQ "route by task", https://www.iconiq.com/growth/insights/ai-economics-is-a-design-problem.
4. **Expose the frontier model as an advisor tool to a cheaper executor**, called only for hard sub-steps. The executor decides when to call it. Measure calls per task (Fireworks saw 0.83). Source: https://fireworks.ai/blog/open-source-agents-frontier-advisors.
5. **Put all non-interactive work on the Batch API**: weekly reports, bulk drafts, nightly ontology enrichment and eval runs. Use the 1-hour cache TTL inside batches. Source: https://platform.claude.com/docs/en/build-with-claude/batch-processing.
6. **Defer-load tools.** Keep the 3 to 5 most-used tools always loaded and mark the rest `defer_loading: true` behind tool search. Put the cache breakpoint on a non-deferred tool. Source: https://platform.claude.com/docs/en/agents-and-tools/tool-search-tool.
7. **Clear stale tool results and compact long agent loops** using server-side context editing or compaction, or your own summariser, once a loop exceeds N turns. Source: https://claude.com/resources/articles/context-management ; https://platform.claude.com/docs/en/build-with-claude/compaction.
8. **Copy Palantir's per-model token-to-unit rate table and attribution.** Convert every model call into an internal unit using a per-model input/output rate. Attribute it to tenant → project/agent → user, falling back to the user when no resource is known. Export a daily usage dataset per tenant. Source: https://www.palantir.com/docs/foundry/aip/aip-compute-usage.
9. **Copy Palantir's three-level capacity limits.** Tenant (enrollment) ceilings, per-agent/project percentage shares with model allowlists, and per-user caps. Always reserve 20% for interactive work and cap batch at 80%. Allow reserving up to 50% of capacity for critical agents. Source: https://www.palantir.com/docs/foundry/aip/llm-capacity-management.
10. **Price as seat or platform plus pooled credits with a published rate card at p50/p90**, as Glean does. Include an allowance and charge credits for premium models and agent runs. Let admins switch premium models off. Source: https://docs.glean.com/glean-enterprise-flex-pricing ; AgentOne credit pool https://help.aliyun.com/en/document_detail/3029849.html.
11. **If you charge per outcome, define the outcome in one sentence, bill at most one per conversation, and don't bill handoffs**, as Fin does. Source: https://fin.ai/pricing.
12. **Make the model layer provider-agnostic from day one** (Claude, GPT, Gemini, Qwen and an open-weight host behind one interface). Google is doubling Argon and 3.8 Flash prices on 1 Dec 2026 and 1 Jan 2027, and Harvey had to move workloads to open models. Source: https://aistudio.google.com/docs/pricing ; https://harvey.ai/blog/post-training-update-harvey-tenet.
13. **Keep per-tenant cache keys and per-tenant spend caps.** OpenAI's `prompt_cache_key` separates cache accounting per customer, and caches are not shared across organisations. Source: https://developers.openai.com/api/docs/guides/prompt-caching.

## What cannot or should not be copied

- **Harvey's unlimited per-seat model** (as reported): token use grew 20x faster than revenue, and the reported gross margin went negative. Do not offer unlimited agent runs without a pool or cap. Source as in section 8.
- **Post-training or distillation as a first step**: Harvey spent six months of research with Fireworks [Fact]. A solo founder should use routing and SQL first. Post-train an open model only when one narrow task has thousands of graded examples and visible spend [Inference].
- **Fine-tuning closed models**: OpenAI's fine-tuning is closed to new users on deprecated models, and no current Claude model shows customisation on Bedrock [Fact]. It cannot be relied on.
- **Palantir's compute-second opacity**: Palantir can withhold the dollar conversion because it sells $1M+ contracts. A mid-market product should publish its credit-to-dollar rate, as AgentOne does at CNY 0.01 per credit [Inference].
- **Gemini 4 Argon's implicit-only caching**: you cannot control what is cached, so cost is less predictable [Fact on implicit-only]. Prefer explicit breakpoints for your main path.
- **Semantic caching of financial answers**: the numbers change when the books change. Cache query plans keyed on data version, not answer text [Inference].
- **Long-context "dump everything" designs**: 1M windows at standard price (Claude 4.6+) make it possible, but the per-call input cost is what makes design A 120x more expensive [Estimate].
- **Dedicated GPUs for open models at small scale**: about $4,000/month per H100 on Together [Estimate from $5.49/hr] is more than the entire model bill for 100 design C customers.

## Open questions and unverified items

- Gemini context window and per-model rate limits: the models page fetch failed (fetch budget exhausted). Not verified.
- OpenAI long-context rates: the page toggle content was not exposed. Not verified.
- Anthropic compaction pricing and threshold defaults: the sub-pages were not read. Not verified.
- Sierra and Decagon price points: only secondary blogs (one claims $1.50 per resolution for Sierra) were found, and none was opened. Not verified. No gross margin figures were found for Sierra, Decagon, Fin or Glean.
- Harvey margin figures come from a secondary summary of a Bloomberg report. The Bloomberg article itself was not opened, and the cryptobriefing copy failed to load.
- Palantir: no dollar price per compute-second, and no current gross margin pulled from filings in this pass. Palantir's 10-K is the place to check.
- a16z 2025 to 2026 commentary on AI app margins: the search budget ran out before I could find it. Only the Nov 2024 "LLMflation" post was read.
- Glean per-seat dollar price and the dollar value of a FlexCredit: not on the docs page.
- The dollar value of AgentOne's included credits in terms of tokens is not published. I could not tell how many LLM tokens one credit buys.
- Structured outputs: no published cost-saving figure found.
- The worked model's token counts are assumptions. Validate them by instrumenting a pilot tenant and replacing them with measured p50/p90 tokens per task.
- The effort estimate for a solo build is my own. No rigorous public benchmark was found.

## Sources

1. https://platform.claude.com/docs/en/about-claude/pricing (read 21 Nov 2026): every Claude price, cache multiplier, tool token overhead, residency multiplier and fast-mode rate.
2. https://platform.claude.com/docs/en/build-with-claude/prompt-caching (Nov 2026): exact caching rules (minimums, 4 breakpoints, 20-block lookback, invalidation order, rate-limit exemption).
3. https://www.palantir.com/docs/foundry/aip/aip-compute-usage (Nov 2026): token-to-compute-second formula and per-model rates; template for internal metering.
4. https://www.palantir.com/docs/foundry/aip/llm-capacity-management (Nov 2026): enrollment/project/user TPM-RPM limits, 20% interactive reserve, 50% reservations.
5. https://palantir.com/docs/foundry/ontologies/query-compute-usage/ (rules effective 1 Jan 2026): per-query minimum compute-seconds for ontology reads and actions.
6. https://developers.openai.com/api/docs/pricing and https://developers.openai.com/api/docs/guides/prompt-caching (Nov 2026): GPT-6 prices, batch/background/priority tiers, cache TTLs and write multipliers.
7. https://aistudio.google.com/docs/pricing (Nov 2026): Gemini prices, including the scheduled 1 Dec 2026 and 1 Jan 2027 increases.
8. https://www.alibabacloud.com/help/en/model-studio/model-pricing and /context-cache (Nov 2026): Qwen tiered prices, explicit vs implicit cache rates, batch rules.
9. https://docs.glean.com/glean-enterprise-flex-pricing (Nov 2026): the clearest public seat-plus-credits rate card with p50/p90 costs.
10. https://help.aliyun.com/en/document_detail/3029849.html (Nov 2026): Lingyang AgentOne seat price and credit pool.
11. https://fin.ai/pricing (Nov 2026): outcome pricing definitions and minimums.
12. https://harvey.ai/blog/post-training-update-harvey-tenet (20 Aug 2026): primary source for open-model post-training cost cuts.
13. https://fireworks.ai/blog/open-source-agents-frontier-advisors (3 Jun 2026): executor-plus-advisor cost/quality numbers.
14. https://www.anthropic.com/engineering/advanced-tool-use (24 Nov 2025): tool search, programmatic tool calling and tool-example figures.
15. https://www.anthropic.com/engineering/code-execution-with-mcp (4 Nov 2025): code-based filtering, 150k → 2k tokens.
16. https://claude.com/resources/articles/context-management (29 Sep 2025): context editing −84% tokens.
17. https://claude.com/resources/articles/prompt-caching (14 Aug 2025): cache latency and cost examples.
18. https://platform.claude.com/docs/en/api/rate-limits and https://developers.openai.com/api/docs/guides/rate-limits (Nov 2026): tier caps and RPM/TPM.
19. https://platform.claude.com/docs/en/agents-and-tools/tool-search-tool (Nov 2026): tool search limits and defer_loading rules.
20. https://platform.claude.com/docs/en/build-with-claude/batch-processing (Nov 2026): batch limits, completion window, stacking with caching.
21. https://www.iconiq.com/growth/insights/state-of-ai-2026 (July 2026) and https://www.iconiq.com/growth/insights/ai-economics-is-a-design-problem (13 Aug 2026): margins, pricing-model shares, routing advice.
22. https://www.bvp.com/atlas/the-state-of-ai-2025 (13 Aug 2025): Supernova vs Shooting Star margins.
23. https://lmsys.org/blog/2024-07-01-routellm/ and https://arxiv.org/abs/2406.18665 (2024): routing savings.
24. https://arxiv.org/abs/2305.05176 (FrugalGPT, 2023): cascade savings.
25. https://arxiv.org/abs/2411.05276 and https://arxiv.org/abs/2502.03771 (2024; ICLR 2026): semantic cache hit rates and verified error bounds.
26. https://www.together.ai/pricing and https://fireworks.ai/pricing (Nov 2026): open-weight hosting, GPU-hour and fine-tuning prices.
27. https://supabase.com/pricing, https://neon.com/pricing, https://render.com/pricing, https://www.inngest.com/pricing, https://langfuse.com/pricing, https://sentry.io/pricing/ (Nov 2026): infrastructure line items.
28. https://drata.com/learn/soc-2/cost and https://dev.to/robertatkinson3570/soc-2-cost-us-47k-here-59bf: SOC 2 cost ranges and one itemised actual.
29. https://vendr.com/marketplace/floqast, https://www.vendr.com/marketplace/numeric, https://www.vendr.com/buyer-guides/blackline (updated Feb 2026): finance-ops price points.
30. https://www.sacra.com/c/harvey, /c/sierra, /c/decagon, /c/glean (2026): ARR estimates and pricing structures (estimates, not company figures).
31. https://andrew.ooo/answers/why-harvey-post-trained-kimi-k3-negative-gross-margin-september-2026/ (24 Sep 2026): secondary summary of Bloomberg's Harvey margin report; use with caution.
32. https://palantir.com/docs/foundry/resource-management/usage-types/: Spark compute-second formula.
33. https://aws.amazon.com/marketplace/pp/prodview-a5m5xespbqyci and https://contracts.justia.com/companies/voyager-technologies-inc-103693/contract/1327627: the only public traces of Palantir contract pricing (placeholder list price; redacted overage terms).
34. https://claude.com/pricing and https://cursor.com/pricing (Nov 2026): coding-agent tooling prices.
35. https://a16z.com/llmflation-llm-inference-cost/ (12 Nov 2024): about 10x a year decline in the price of constant capability.
36. https://www.saastr.com/have-ai-gross-margins-really-turned-the-corner/: secondary compilation of reported AI margins; indicative only.

## Five design rules that most reduce cost without reducing quality

1. **The model plans and explains; the database computes.** Every number in an answer or report comes from a governed SQL or semantic-layer query, and the model sees only the small result table. This is cheaper (about 10x below a routed design in the worked model) and more accurate, because arithmetic and permissions are deterministic and traceable.
2. **Keep one byte-identical cached prefix per agent.** Order it tools → system → catalogue, put a 1-hour breakpoint at its end, and put nothing per-request before it. Monitor the hit rate. Reads cost 5 to 20% of input and do not count toward Anthropic's input rate limit.
3. **Use the cheapest model that passes the eval, and escalate on a failed check, not by default.** A small-model router, a workhorse model as the default, and the frontier model used as an advisor or fallback. Re-run the evals each time vendors change prices or models.
4. **Anything that can wait goes to batch.** Reports, bulk drafts, enrichment and evals run on the 50%-off batch APIs, with caching stacked where the vendor allows it.
5. **Send the model only what it needs.** Retrieval instead of whole documents, deferred tool loading, code-side filtering of tool results, and clearing or compacting stale turns. Each of these has a published reduction of roughly 37% to 98% of tokens on the affected step.