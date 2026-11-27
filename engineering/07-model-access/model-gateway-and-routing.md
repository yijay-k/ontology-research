# Model gateway and routing

**Layer:** [07-model-access](README.md) · **What it is:** One proxy for all model calls: provider catalogue, enablement, routing and bring-your-own-model.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### 2. LLM access layer: model catalog, "k-LLM", hosting and regions

> Source: [general-references/03-palantir-aip.md § 2. LLM access layer: model catalog, "k-LLM", hosting and regions](../../general-references/03-palantir-aip.md#2-llm-access-layer-model-catalog-k-llm-hosting-and-regions)

**Plain English.** Customers do not sign up with OpenAI or Anthropic. They switch on "model families" in an admin console, and Palantir routes calls to a provider account it has vetted.

**Technical detail.**
- **Catalog size and providers.** About 90 LLM entries, 5 embedding models and about 15 audio models. Providers include xAI, OpenAI, Anthropic, Meta, Google (Gemini and Gemma), NVIDIA, Mistral, DeepSeek, Moonshot (Kimi), Alibaba (Qwen) and Z.ai (GLM). [Fact, my count from the page, 21 Nov 2026] https://www.palantir.com/docs/foundry/aip/supported-llms/
- **Hosting paths.** Direct (Anthropic, OpenAI, xAI), Amazon Bedrock, Azure, Google Vertex (including a USG variant), Palantir-hosted (Llama, GPT-OSS, Gemma 4 26B, Whisper and others), and Fireworks for some open-weight models (Kimi K3, GLM-5.3, DeepSeek V4.1 Flash, Oct 2026). [Fact] same URL; https://www.palantir.com/docs/foundry/announcements/2026-10
- **Georestriction is set per enrollment, not per user.** An EU-restricted enrollment processes requests in the EU. A model's state can be *enabled*, *disabled* (for example, legal terms not yet accepted) or *disallowed* (for example, wrong region or awaiting Palantir review). [Fact] https://www.palantir.com/docs/foundry/aip/supported-llms/
- **Experimental models** must be acknowledged by an admin, may need manual migration, and are not meant for production. [Fact] same URL.
- **"k-LLM".** The supported-models page does not use the term. It calls AIP model-agnostic. [Fact] same URL. I could not open a Palantir page that defines "k-LLM" before my search quota ran out. [Unverified]
- **Multi-provider failover is used as a capacity and resilience argument.** Claude via Azure (Jun 2026) was justified by "added capacity and routing through Azure during outages", and Anthropic Direct (May 2026) by "failover between providers". [Fact] https://www.palantir.com/docs/foundry/announcements/2026-06 , https://www.palantir.com/docs/foundry/announcements/2026-05
- **Model categories instead of model names.** AIP Analyst replaced direct model selection with Fast, Balanced and Smart categories (1 Oct 2026). A saved analysis bound to a category picks up whatever model the admin currently maps to it. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-10 , https://www.palantir.com/docs/foundry/aip-analyst/analysis-resources/
- **Deprecation tooling.** An Upgrade Assistant and a deprecation page exist. Bulk model replacement across Logic functions from Workflow Lineage went GA in May 2026, and bulk model swaps in Pipeline Builder produce reviewable proposals (Nov 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05 , https://www.palantir.com/docs/foundry/announcements/2026-11

### 6. Bring-your-own-model, provider-compatible APIs and proxy layers

> Source: [general-references/03-palantir-aip.md § 6. Bring-your-own-model, provider-compatible APIs and proxy layers](../../general-references/03-palantir-aip.md#6-bring-your-own-model-provider-compatible-apis-and-proxy-layers)

**Plain English.** A customer can plug in its own Azure OpenAI account, a fine-tuned model or a GPU server, and AIP treats it like any other model.

**Technical detail.**
- **Registered models** reached GA on 21 May 2026 and replaced the older "function interface" method, which is now legacy. They support tool calling, reasoning, structured outputs, vision and streaming. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
- **Sources.** (a) A REST API source in Data Connection, recommended when the model speaks a standard provider API. (b) A compute module, meaning a container hosting a model server on customer hardware, on-premises or air-gapped, or acting as a custom proxy. (c) Self-hosting inside a compute module. [Fact] https://www.palantir.com/docs/foundry/aip/bring-your-own-model/
- **Where registered models work.** AI FDE, Analyst, Chatbot Studio, Logic, Workshop and TypeScript functions. They do **not** work in AIP Assist or in Pipeline Builder's Generate and Explain features, and Palantir has no plans to add them. [Fact] same URL.
- **Governance.** Only enrollment admins can register a model, and they need Owner or Editor on the source. Source permissions are decoupled, so end users do not need access to the source. Enablement can be granted to the whole enrollment or to groups. A model-specific markings policy fully replaces the enrollment policy. [Fact] same URL.
- **Proxy or federation layer.** This is a compute module between AIP and providers, used for PII redaction, injecting system prompts, remapping API formats, and routing across providers by cost, latency or availability. Provider keys are stored as source secrets and read from the `SOURCE_CREDENTIALS` environment variable, with at least 1 replica. Failover is not described. [Fact] https://www.palantir.com/docs/foundry/aip/build-a-proxy-or-federation-layer/
- **Provider-compatible proxy endpoints** under `/api/v2/llm/proxy/`: Anthropic Messages, OpenAI Chat Completions, Responses and Embeddings, plus beta xAI and Google endpoints. Auth is a bearer Foundry token. These endpoints enforce the same zero retention, georestriction and rate limits. An optional `X-Palantir-session-id` header (under 256 characters) asks Foundry to route related requests to the same backend on a best-effort basis, to improve prompt-cache hits. [Fact] https://www.palantir.com/docs/foundry/aip/llm-provider-compatible-apis/
- **Web search tool.** Supported OpenAI models can search the web with citations, via Direct OpenAI or Bedrock, once an admin enables it (3 Nov 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-11

[Inference] The provider-compatible proxy is the cheapest thing in this file to copy. It is one endpoint that speaks the Anthropic, OpenAI and Qwen-compatible formats, adds auth, metering, rate limits and a policy check, and forwards the request. Every SDK then works unchanged.

## Lingyang, AgentOne and Alibaba

### 10. Gateway and registry layer: Higress, Nacos, HiMarket, ModelScope

> Source: [general-references/08-alibaba-stack.md § 10. Gateway and registry layer: Higress, Nacos, HiMarket, ModelScope](../../general-references/08-alibaba-stack.md#10-gateway-and-registry-layer-higress-nacos-himarket-modelscope)

**Higress REST-to-MCP.** [Fact] [plugin docs](https://higress.cn/ai/en/mcp-server)
- `server` fields: `name`, `type` (`rest` or `mcp-proxy`), `config`, `securitySchemes[]` (`http` or `apiKey`, `basic` or `bearer`, `defaultCredential`), `defaultUpstreamSecurity`, `defaultDownstreamSecurity`, `passthroughAuthHeader`, `timeout` (default 5000 ms).
- `allowTools` is intersected with the `x-envoy-allow-mcp-tools` request header, which lets an upstream auth plugin narrow tools per caller.
- `tools[]` fields: `args[]` with `position` (query, path, header, cookie, body), `requestTemplate` (`url`, `method`, `headers`, and exactly one of `body` / `argsToJsonBody` / `argsToUrlParam` / `argsToFormBody`, plus `security`), `responseTemplate` (`body`, `prependBody`, `appendBody`), and `errorResponseTemplate` for status ≥300.
- Templates use GJSON Template plus Sprig.
- The `openapi-to-mcpserver` tool generates this configuration from OpenAPI specs (its page was rate-limited, so not read).

**Higress database-to-MCP.** [Fact] [quick start](https://higress.ai/en/docs/ai/mcp-quick-start/); code
- Defined in the `higress-config` ConfigMap as `type: database` with `config.dsn` (gorm format) and `config.dbType` (`postgres`, `mysql`, `clickhouse`, `sqlite`). Redis is required for SSE. The endpoint is `/<path>/sse`.
- Generated tools: `query`, `execute`, `list tables`, `describe table`, plus an optional `description` that is injected into tool descriptions.
- Inference from code: `query` is not technically read-only, and `execute` cannot be switched off in that server (`servers/gorm/server.go`, `db.go`).

**Nacos MCP templates.** `requestTemplate`, `argsPosition`, `responseTemplate` and `errorResponseTemplate` follow Higress semantics. Secrets are injected by `${nacos.dataId/group}` references in the same namespace. [Fact] [Nacos manual](https://nacos.io/en/docs/v3.0/manual/user/ai/mcp-template/). Registry internals (versioning, hot update) were not on that page. [Unverified]

**HiMarket** (open-sourced 29 Aug 2025 by the Higress and Nacos communities).
- Admin backend: packages model services, MCP servers and agents as API "products", publishes them to a portal bound to a domain, and imports services from a Higress or Nacos instance.
- Developer portal: self-registration with admin approval, consumers, credentials, subscriptions, testing, usage.
- Higress enforces authentication and traffic policy. Nacos handles MCP metadata, versions and grey release.
- Metering and billing were roadmap items as of Sep 2025.

[Fact] [blog 602510](https://www.alibabacloud.com/blog/himarket-is-officially-open-source-providing-enterprises-with-a-ready-to-use-ai-open-platform_602510). A Dec 2025 upgrade article exists, but its body did not load. [Unverified] [1695717](https://developer.aliyun.com/article/1695717)

**ModelScope MCP marketplace.** Not opened. [Unverified]

### 1. Qwen model family (state on 21 Nov 2026)

> Source: [general-references/08-alibaba-stack.md § 1. Qwen model family (state on 21 Nov 2026)](../../general-references/08-alibaba-stack.md#1-qwen-model-family-state-on-21-nov-2026)

**Plain English.** Qwen is Alibaba's model family. The flagship (Max) is now API-only. Mid and small models are still published as open weights. For this product, Qwen is one of several interchangeable "brains" behind the context layer. Example: the same tool-calling agent loop could send a request to `qwen4-max` or to Claude simply by changing the endpoint, because both accept the Anthropic Messages format.

**Detail.**
- **Qwen4-Max.** The model ID is `qwen4-max`, the first Qwen4 model. Context is 1,000,000 tokens. Max input is 991,808 tokens non-thinking or 983,616 thinking. Max output is 131,072 non-thinking, or 262,144 for thinking plus answer. Thinking is on by default with effort levels low / high / xhigh (default high) and a default thinking budget of 131,072. Reasoning is preserved across multi-turn tool calls. It supports function calling with parallel calls, MCP via the Responses API, structured output, and implicit plus explicit caching (TTL 5 minutes or 1 hour). Batch inference and fine-tuning are not supported. Regions are Singapore, Beijing, and a "Global" region (Frankfurt, Hong Kong, Tokyo, Virginia). [Fact] [QwenCloud](https://docs.qwencloud.com/developer-guides/getting-started/latest-model). The Bailian console lists the same 1M context and 131,072 / 262,144 output limits. [Fact] [text-generation-model page, modified 16 Nov 2026](https://help.aliyun.com/zh/model-studio/text-generation-model).
- **Qwen4-Max release and prices.** A preview opened 11 Nov 2026 and the pay-as-you-go launch came 16 Nov 2026. The architecture is reported as 2.4T total parameters and 71B active, with Gated DeltaNet plus "Qwen Sparse Attention". Weights are not released. Reported prices per million tokens in Singapore: $1.50 input, $4.50 output, $0.075 cache read, $1.875 5-minute cache write, $3.00 1-hour cache write. Beijing and Global are slightly lower ($1.413 / $4.24). [Vendor claim reported by a secondary source, [Fello AI](https://felloai.com/qwen-4/); I could not open the official pricing table, and the Token Plan page showed "Loading..." for model prices.]
- **Qwen3.8 series (early Aug 2026).** Qwen3.8-Max (API), Qwen3.8-Flash (described as next-generation architecture, open-sourced early, cache-hit input "as low as ¥0.1 per million tokens"), Qwen3.8-27B (open-weight, runs on consumer GPUs) and Qwen3.8-Omni-Flash. Alibaba claims 460+ open models in total. [Vendor claim] [QbitAI 22 Sep 2026](https://www.qbitai.com/2026/09/493625.html). On Bailian, `qwen3.8-max` is already marked "legacy" (1M context, 128k output). `qwen3.8-flash` is a recommended model (1M context, 128k output). [Fact] [text-generation-model](https://help.aliyun.com/zh/model-studio/text-generation-model).
- **Qwen3.6 and Qwen3.7.** All are listed as legacy on Bailian: `qwen3.7-plus` (1M / 128k, still recommended), `qwen3.7-max` (1M), `qwen3.7-flash` (1M / 64k), `qwen3.6-plus` and `qwen3.6-flash` (1M / 64k), and `qwen3.6-35b-a3b` (256k / 64k, an open-size MoE). All list function calling plus built-in tools. [Fact] Same page. The page does not mark open-weight status. [Inference] The `-35b-a3b` and `-27b` naming follows the open-weight convention of Qwen3.5 (open-sourced 16 Feb 2026 per [Qwen-Agent news](https://github.com/QwenLM/Qwen-Agent)).
- **Technical reports.** I could not open a Qwen4 or Qwen3.8 technical report. [Unverified]
- **Cost drivers for us.** Thinking tokens bill as output. Agent 2.0 tiers in CNY per million tokens: Performance ¥6.4 / ¥22.4, Balanced ¥1.6 / ¥6.4, Economy ¥0.5 / ¥2, AUTO flat ¥3 / ¥12. Implicit cache hits bill at 20% of input. [Fact] [Agent 2.0](https://help.aliyun.com/zh/model-studio/new-single-agent-application).

## Design decisions already in the reference maps

### 12. The model access layer (proxy, enablement, rate limits, metering)

> Source: [general-references/30-map-palantir-platform.md § 12. The model access layer (proxy, enablement, rate limits, metering)](../../general-references/30-map-palantir-platform.md#12-the-model-access-layer-proxy-enablement-rate-limits-metering)

**Purpose.** One governed gateway in front of rented models, so that every SDK works unchanged while enablement, data gates, limits and metering sit in one place. *Receivables example:* the collections agent drafts an email through Claude, and a nightly job classifies remittance emails with Qwen. Both go through `/llm/proxy/...` and are metered to the AR project.

**Design to implement.**
- **Provider-compatible endpoints** [Fact 03]: Palantir exposes `/api/v2/llm/proxy/` endpoints for Anthropic Messages and OpenAI Chat Completions, Responses and Embeddings, authenticated with the platform bearer token. Copy them as `/llm/proxy/anthropic/v1/messages` and `/llm/proxy/openai/v1/chat/completions`. Qwen is reached through an OpenAI-compatible backend [03 "What to copy" 1; the Qwen routing is 03's Inference].
- **Pipeline for each request** [Inference on order; each check copied]:
  1. authenticate the token;
  2. resolve attribution (project or user, item 4 below);
  3. check model enablement;
  4. run the data gate (section 13);
  5. check rate limits;
  6. forward;
  7. meter;
  8. write an audit `llmInference` event.
- **Model catalog** [Fact 03, 04]: `model(id, provider, family, hosting_path, region, state enabled|disabled|disallowed, experimental bool, category fast|balanced|smart, context_threshold, supports_tools, supports_vision)`. Families are enabled per tenant and per group [Fact 04]. Experimental models need an admin to acknowledge them [Fact 03].
- **Model categories instead of IDs in saved configs** [Fact 03]: an agent bound to "balanced" picks up whatever model the admin maps to it. Deprecation uses a bulk model swap that opens reviewable proposals [Fact 03].
- **Attribution** [Fact 03]: workloads run by builder tools (agents, automations, rules) are charged to a **project**. Personal assistants are charged to the **user**. The attribution decides which limits apply.
- **Rate limits: TPM and RPM per model at three levels** [Fact 03]:
  - **Tenant:** a ceiling set from the founder's own provider quota [Inference]. Palantir's tier numbers are not to be copied [03].
  - **Project:** a percentage of the tenant limit, shared by assigned projects, with a default for unassigned projects. Per-model overrides allow an allowlist (base 0% plus overrides) or a blocklist (an override at 0%).
  - **User:** a default percentage, group overrides (highest wins), or absolute values. Palantir says features break below 50k TPM or 10 RPM, and 0 is not supported.
  - **Interactive reserve:** 20% of capacity is held for interactive traffic, so batch work tops out at 80%. Optional reserved capacity of up to 50% for critical workflows.
  - When a project limit is hit, overlapping requests "retry until they succeed" [Fact 03]. Implement a bounded internal retry of about 30 s with jitter, then a typed `RateLimited` error [Inference].
  - Palantir says over 99% of its request failures come from its own limits [Vendor claim 03], so surface limit hits in the usage UI [Fact 03].
- **Metering record per call** [Fact 03]: `model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, resource_id, project_id, user_id, traffic interactive|batch, latency_ms, trace_id`, rolled up daily by model and resource.
  - **Flat surcharges** in internal units: 4 per LLM step and 8 per tool call, on top of tokens (Palantir's Logic numbers [Fact 03]).
  - A debugger view shows the arithmetic [Fact 03].
- **Session affinity**: forward an `X-Session-Id` header so related requests reuse the provider's prompt cache. Palantir does this on a best-effort basis with `X-Palantir-session-id` (under 256 characters) [Fact 03].
- **Customer-owned keys (version 2)** [Fact 03]: like Palantir's registered models, there is no platform fee, the provider bills the customer, and that spend is not in the product's metering. A per-model data policy fully replaces the tenant policy.
- **Proxy hooks** [Fact 03]: Palantir's federation layer is used for PII redaction, system-prompt injection, format remapping and routing by cost or latency. Version 1 implements format remapping and failover between hosting paths of the same model. Palantir justified adding Claude via Azure with "routing ... during outages" [Fact 03].
- **No provider batch APIs.** Palantir avoids them because they require data storage that fails its compliance bar [Fact 03]. Treat this as a per-customer setting [Inference].
- **Defaults:** temperature 0 [Fact 03]. A synchronous call times out at 5 minutes, matching Palantir's synchronous function limit [Fact 03].

**Copies.**
- Document 03, §6: provider-compatible endpoints, proxy layer, registered models, session header. https://www.palantir.com/docs/foundry/aip/llm-provider-compatible-apis/ , https://www.palantir.com/docs/foundry/aip/build-a-proxy-or-federation-layer/ , https://www.palantir.com/docs/foundry/aip/bring-your-own-model/
- Document 03, §4: capacity management. https://www.palantir.com/docs/foundry/aip/llm-capacity-management/
- Document 03, §5: token accounting and Logic surcharges. https://www.palantir.com/docs/foundry/aip/aip-compute-usage/ , https://www.palantir.com/docs/foundry/logic/compute-usage/ , https://www.palantir.com/docs/foundry/announcements/2026-05
- Document 03, §2: model states, categories, deprecation. https://www.palantir.com/docs/foundry/aip/supported-llms/ , https://www.palantir.com/docs/foundry/announcements/2026-10
- Document 04, §20: model enablement per organization and group. https://palantir.com/docs/foundry/aip/enable-aip-features/

**Left out, and why.**
- A 90-model catalog and Palantir's provider contracts: cannot be negotiated by a solo founder [03].
- Enrollment tier sizes [03].
- Autoscaling up to 2×.
- Web search tool: version 2.

**Open questions.**
- Which Qwen hosting path (Alibaba Cloud region, or a third-party host) satisfies Malaysian customers' data terms? Not in these documents.
- Does Palantir route Claude Agent SDK calls through the Anthropic-compatible proxy? [Unverified 03]

---

### 20. Model prices, caching, batch, routing and the published savings

> Source: [general-references/32-map-research-and-cost.md § 20. Model prices, caching, batch, routing and the published savings](../../general-references/32-map-research-and-cost.md#20-model-prices-caching-batch-routing-and-the-published-savings)

**Purpose.** Keep the model bill a small share of revenue. Example: the weekly AR ageing report runs on Batch at half price, from a cached prefix, on the cheapest model that passes its eval.

**Design to implement.**
- *Provider-agnostic model interface* from day one: Claude, Qwen, and optionally GPT, Gemini and an open-weight host.
- *Prompt layout*: a fixed byte-identical prefix ordered tools → system → catalogue/conventions card, with a 1-hour cache breakpoint at its end. Nothing per-request before it: no timestamps, user names or tenant IDs. Deterministic tool order.
- Do not switch `tool_choice` per request or route one conversation across models, since each model has its own cache.
- Log `cache_read_input_tokens` and `cache_creation_input_tokens`; alert if the hit ratio falls below about 80%.
- Respect the minimums: Anthropic needs 512 tokens on 5.x models, with at most 4 breakpoints and a 20-block lookback. OpenAI needs 1,024. Qwen explicit caching needs 1,024 with a 5-minute TTL.
- *Routing*: a small-model classifier (Haiku 5.5 / Qwen3.7-flash / GPT-6 Luna) labels each request easy, standard or hard. Default to the cheapest model that passes that class's eval. Escalate on a validator failure, not on a guess. Optionally expose the frontier model as an advisor tool to a cheaper executor and measure calls per task.
- *Batch* for reports, bulk drafts, enrichment, dream jobs and eval runs, using the 1-hour cache TTL inside batches. Anthropic stacks batch and cache discounts; Qwen does not.
- *Haiku 5.5 tier boundary*: keep prompts under 100k tokens, because the whole request is priced at $0.50/$2.50 above that. Qwen also bills the whole request at its total-input tier.
- *Metering* (copied from Palantir): a per-model input/output rate table converts tokens into an internal unit. Attribute it tenant → agent/project → user, falling back to the user. Export a daily usage dataset per tenant.
- *Capacity limits* at three levels (tenant, agent/project share with model allowlists, user), with 20% always reserved for interactive work and batch capped at 80%.
- *Cache keys and spend caps* per tenant.
- *Semantic caching*: cache query plans keyed on data version, never numeric answers.

**Key prices (Nov 2026, per million tokens, [Fact], document 13, section 1).**
- Claude Opus 5.5 $4/$20 (cache read $0.20; 1-hour write $8).
- Claude Sonnet 5.5 $2/$10 (read $0.10; 1-hour write $4).
- Claude Haiku 5.5, prompts up to 100k: $0.10/$0.50 (read $0.01).
- qwen3.7-flash $0.03/$0.13 up to 32k; qwen3.7-plus $0.4/$1.6 up to 256k; qwen4-max $1.5/$4.5.
- GPT-6.2 Sol $2/$10; GPT-6 Luna $0.10/$0.50.
- Gemini 4 Argon rises from $2/$10 to $4/$20 on 1 Dec 2026.
- Batch is 50% off everywhere.
- Anthropic cache reads do not count toward the input-tokens-per-minute limit.
- Claude 4.7 and later produce about 30% more tokens for the same text, so compare cost per task.
- US data residency is 1.1x.

**Published savings (document 13, section 3).**
- Prompt caching: up to −90% cost and −85% latency [Vendor claim].
- RouteLLM: −85% on MT-Bench at about 95% of GPT-4 quality [Fact, arXiv 2406.18665].
- FrugalGPT: up to −98% [Fact, arXiv 2305.05176].
- Executor plus advisor: 18/100 tasks for $368 against Opus alone at 14/100 for $954 [Vendor claim, Fireworks]. Recomputed: 368/954 = 38.6%.
- Tool search: −85% upfront tokens.
- Programmatic tool calling: 43,588 → 27,297 tokens, recomputed as −37.4% [Vendor claim].
- Code execution with MCP: 150k → 2k, −98.7% [Vendor claim].
- Context editing: −84% [Vendor claim].
- Semantic caching: −68.8% API calls with more than 97% correct hits [Fact, arXiv 2411.05276].
- vCache: up to 12.5x hit rate and 26x lower error rate [Fact, arXiv 2502.03771].
- Harvey's post-trained open models: −90% per query on one feature [Vendor claim].

**Copies.** Document 13, "What to copy" items 2–9, 12, 13. https://platform.claude.com/docs/en/build-with-claude/prompt-caching ; https://platform.claude.com/docs/en/build-with-claude/batch-processing ; https://lmsys.org/blog/2024-07-01-routellm/ ; https://arxiv.org/abs/2305.05176 ; https://fireworks.ai/blog/open-source-agents-frontier-advisors ; https://www.palantir.com/docs/foundry/aip/aip-compute-usage ; https://www.palantir.com/docs/foundry/aip/llm-capacity-management ; https://www.alibabacloud.com/help/en/model-studio/context-cache

**Left out.**
- Fine-tuning closed models (closed to new users or unavailable).
- Post-training an open model as a first step (Harvey took six months).
- Dedicated GPUs: about $4,008 a month per H100 at $5.49/hr.
- Gemini Argon's implicit-only cache on the main path.

**Open questions.**
- OpenAI long-context rates and Gemini context windows are unverified.
- Anthropic compaction pricing was not read.

## Fact-check notes

_No time-sensitive claims in this component were re-checked in the 28 Nov 2026 pass; its sources are dated 21–27 Nov 2026. See the linked references for their own open questions._

## Gaps

- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
