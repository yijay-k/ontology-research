# The Alibaba Cloud and Ant Group stack, read for an "organizational brain" build

Scope and date. Written 21 November 2026. This file covers the parts of the Alibaba Cloud, Qwen, DingTalk-adjacent and Ant Group stack that matter to a product that holds a company's model (objects, metrics, rules, permissions, allowed actions) for agents to work through. It goes deeper than the first-pass overview in four places where source code or full documentation was available: MyContext (code read end to end in the knowledge-graph and merge layers), Ant Group's KAG / OpenSPG (code, schema files, paper tables), Alibaba's UModel / UnifiedModel (code, schemas, agent skills), and Bailian (Model Studio) knowledge base, memory and agent pages on help.aliyun.com. Other topics are thinner. Partway through, the session hit its web-search limit and then its web-fetch limit, so several items (AliCoCo, AliMe, the SPG white paper, Nacos registry internals, ModelScope MCP, DingTalk and Feishu agent platforms, PolarDB, AnalyticDB, PAI, and Alibaba's internal "AI-native organization" talk) could not be opened. They are marked [Unverified] and listed in the open questions. Repositories were cloned to `/home/claude/research/_code/` and read as data. None of their code was run.

Labels: [Fact] means taken from a primary source (URL or repo path given). [Vendor claim] means the vendor says it and it was not checked independently. [Inference] is my own reasoning. [Unverified] means no source could be opened.

---

## Key findings

1. **MyContext is open source and readable. It shows how DingTalk's own team builds a context layer.** [Fact] The repo `openTrinity/mycontext` (Elastic License 2.0, developer preview, last commit 31 Aug 2026) is attributed by the press to the QwenWork (千问办公) team ([QbitAI, 18 Aug 2026](https://www.qbitai.com/2026/08/474647.html)). Its knowledge graph has five node types (Chunk, Entity, Fact, Scope, Community) and typed edges. Facts are reified nodes, and each one points back to its evidence chunks. Ingestion is idempotent on `(source_id, source_type, unit_id)` with no timestamp watermark (`kl-graph/docs/graph-design.md`).
2. **Two different conflict policies live side by side in MyContext, and the press describes only one.** [Fact] The knowledge graph allows contradictions: it defines `CONTRADICTS` and `ENTAILS` edges but never populates them (graph-design.md, "Current Implementation Baseline"). The separate profile ("distill") layer uses a three-state merge (confirm / supplement / conflict). That merge works by structured comparison on an exact key `(facet, scope, scope_ref, key)`, not by an LLM. A user-written value always wins (`packages/distill/src/reduce/merger.ts`). This is the cleanest documented, copyable rule-precedence design in the whole stack.
3. **"Enterprise Context" (企业上下文) is a closed QwenWork product, announced 22 Sep 2026. No open-source enterprise component was found.** [Fact] The MyContext repo contains no enterprise or multi-tenant module (grep found none). The press describes Enterprise Context as compressing documents, communications and business-system data, refreshing it as the business changes, and returning only task-relevant context via a dedicated low-cost model ([ifeng / IT之家](https://tech.ifeng.com/c/8wd2EoDIYv7), [Jiemian](https://m.jiemian.com/article/15128675.html)). [Vendor claim]
4. **UModel / UnifiedModel is Alibaba's most directly copyable ontology design, and it is Apache-2.0 on GitHub.** [Fact] Its primitives are Set (EntitySet, MetricSet, LogSet, TraceSet, EventSet, RunbookSet), Link (EntitySetLink, DataLink, StorageLink) and Field. A definition layer (TBox) is kept separate from a runtime layer of individuals (ABox). The query service returns *query plans*, not data: the agent runs the PromQL or SQL itself ([blog, 26 Oct 2026](https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674); repo `alibaba/UnifiedModel` v0.4.0, 16 Jun 2026).
5. **UModel's RunbookSet schema models "allowed actions" with `risk_level`, `confirmation_required` and `allowed_tools`.** [Fact] (`expanded_schemas/runbook_set.expanded.yaml`). Read tools are on by default. Write tools are off or need explicit authorization ([blog 603674](https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674)).
6. **Ant Group's OpenSPG schema language is the best documented way to write rules and derived metrics *inside* the schema.** [Fact] Properties and relations can carry a `rule: [[ Define (s:Company)-[p:totalTransInAmt]->(o:Float) { STRUCTURE {...} CONSTRAINT {...} } ]]` block. The block holds a graph pattern plus aggregations (`group(s).sum(...)`), date filters and thresholds (`KAG/kag/examples/supplychain/schema/SupplyChain.schema`). That is metric definitions and derived relations as code.
7. **KAG's solver turns a question into a small typed program over the graph.** [Fact] Each step calls exactly one of four operators, `Retrieval(s,p,o)`, `Math`, `Deduce` or `Output`, with variables threaded between steps (`kag/solver/prompt/logic_form_plan.py`). `Math` works by having the LLM write Python and running it in a subprocess (`kag/solver/executor/math/py_based_math_executor.py`). The result is deterministic arithmetic, not trusted model arithmetic.
8. **KAG's reported gains are real but confounded.** [Fact] KAG with DeepSeek-V2 scored F1 76.2 / 76.2 / 48.7 on HotpotQA / 2Wiki / MuSiQue. The best baseline, IRCoT+HippoRAG on ChatGPT-3.5, scored 59.2 / 62.7 / 33.3 ([arXiv 2409.13731v3, Table 8](https://arxiv.org/html/2409.13731v3)). The backbones differ. The abstract and the KAG release notes also give the 19.6% and 33.5% gains to opposite datasets.
9. **Bailian (Model Studio) has quietly cloned a managed-agent design with file-tree memory stores.** [Fact] Memory stores are path-addressed UTF-8 files, at most 100 KB each. Every write creates a version, and an optimistic `content_sha256` precondition guards edits. A session can mount at most 8 stores, read-only or read-write, fixed at session creation ([Memory Store](https://help.aliyun.com/zh/model-studio/managed-agents-memory-store)). A separate "Bailian memory" option offers fact memory, skill memory and schema-driven user profiles ([long-term memory 2.0](https://help.aliyun.com/zh/model-studio/long-term-memory-2-0), [user profile](https://docs.agent.bailian.aliyun.com/zh/memory/user-profile)).
10. **Bailian's knowledge base exposes the knobs worth copying, and its lock-ins.** [Fact] Defaults are 600-token "smart split" chunks (range 10–6000), embedding `qwen3.7-text-embedding` or `text-embedding-v4`, separate vector TopK and keyword TopK (1–100 each), a `qwen3-rerank` family reranker, a per-KB similarity threshold (0.01–1.0), and at most 15 knowledge bases per retrieval service. Metadata extraction allows at most 5 fields, with methods constant, variable, LLM, regex or keyword. It cannot be added after creation, and neither can the chunking method or embedding model ([KB](https://help.aliyun.com/zh/model-studio/rag-knowledge-base), [chunking](https://help.aliyun.com/zh/model-studio/rag/chunking), [retrieval](https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval)).
11. **Agent 2.0 (26 Dec 2025) makes knowledge bases ordinary tools in a ReAct loop.** [Fact] The loop is capped at 1–50 rounds with 0–30 turns of short-term memory. Long-term memory is "not yet available" inside Agent apps. AUTO routing bills a flat ¥3 input / ¥12 output per million tokens ([Agent 2.0](https://help.aliyun.com/zh/model-studio/new-single-agent-application)).
12. **Qwen4-Max (16 Nov 2026) is closed-weight with 1M context and three API dialects.** [Fact] Max output is 131,072 tokens non-thinking and 262,144 with thinking. It speaks OpenAI Chat Completions, OpenAI Responses and Anthropic Messages, plus explicit 5-minute and 1-hour caching ([QwenCloud model page](https://docs.qwencloud.com/developer-guides/getting-started/latest-model)). Open weights continue only below the flagship (Qwen3.8-27B, Qwen3.8-Flash) ([QbitAI, 22 Sep 2026](https://www.qbitai.com/2026/09/493625.html)). [Vendor claim] For a product that must stay model-agnostic, the Anthropic-Messages-compatible endpoint means one client can drive both Claude and Qwen.
13. **The Higress database-to-MCP server exposes `execute` (writes) next to `query`. Its "read-only" query tool is read-only in name only.** [Fact from code] `plugins/golang-filter/mcp-server/servers/gorm/server.go` always registers `query`, `execute`, `list tables` and `describe table`. The query handler passes raw SQL to `db.Raw(sql)` with no statement-type check. [Inference] Do not copy this as a permission boundary.
14. **QwenWork's enterprise model is seats plus a pooled credit wallet, with per-model multipliers.** [Fact] Each seat carries 2,000 credits per month into a shared pool that does not roll over. Credit packs last one year ([QwenWork FAQ](https://help.aliyun.com/zh/qwenwork/product-faq)). Credit multipliers are 0.1× economy, 0.25× basic, 1× advanced and 1.1× Qwen3.8-Max ([ifanr, 3 Aug 2026](https://www.ifanr.com/1673691)). [Vendor claim via press] "Digital employees" carry name, department, owner, duties, authorization scope and lifecycle ([ifeng](https://tech.ifeng.com/c/8wd2EoDIYv7)).
15. **Alibaba's own practice reported at Apsara 2026 is "recursive self-improvement" on models and chips, not an org-design case study.** [Vendor claim] Examples are 33 autonomous iteration rounds on Qwen3.8-Max and a chip-design run with 10,000+ EDA tool calls ([QbitAI](https://www.qbitai.com/2026/09/493625.html), [Alibaba Cloud blog 603589](https://www.alibabacloud.com/blog/alibaba-unveils-roadmap-on-full-stack-ai-strategy-from-chips-cloud-infrastructure-models-to-agents_603589)). I found no primary source describing an internal "AI-native organization" programme. [Unverified]

---

## Breakdown

### 1. Qwen model family (state on 21 Nov 2026)

**Plain English.** Qwen is Alibaba's model family. The flagship (Max) is now API-only. Mid and small models are still published as open weights. For this product, Qwen is one of several interchangeable "brains" behind the context layer. Example: the same tool-calling agent loop could send a request to `qwen4-max` or to Claude simply by changing the endpoint, because both accept the Anthropic Messages format.

**Detail.**
- **Qwen4-Max.** The model ID is `qwen4-max`, the first Qwen4 model. Context is 1,000,000 tokens. Max input is 991,808 tokens non-thinking or 983,616 thinking. Max output is 131,072 non-thinking, or 262,144 for thinking plus answer. Thinking is on by default with effort levels low / high / xhigh (default high) and a default thinking budget of 131,072. Reasoning is preserved across multi-turn tool calls. It supports function calling with parallel calls, MCP via the Responses API, structured output, and implicit plus explicit caching (TTL 5 minutes or 1 hour). Batch inference and fine-tuning are not supported. Regions are Singapore, Beijing, and a "Global" region (Frankfurt, Hong Kong, Tokyo, Virginia). [Fact] [QwenCloud](https://docs.qwencloud.com/developer-guides/getting-started/latest-model). The Bailian console lists the same 1M context and 131,072 / 262,144 output limits. [Fact] [text-generation-model page, modified 16 Nov 2026](https://help.aliyun.com/zh/model-studio/text-generation-model).
- **Qwen4-Max release and prices.** A preview opened 11 Nov 2026 and the pay-as-you-go launch came 16 Nov 2026. The architecture is reported as 2.4T total parameters and 71B active, with Gated DeltaNet plus "Qwen Sparse Attention". Weights are not released. Reported prices per million tokens in Singapore: $1.50 input, $4.50 output, $0.075 cache read, $1.875 5-minute cache write, $3.00 1-hour cache write. Beijing and Global are slightly lower ($1.413 / $4.24). [Vendor claim reported by a secondary source, [Fello AI](https://felloai.com/qwen-4/); I could not open the official pricing table, and the Token Plan page showed "Loading..." for model prices.]
- **Qwen3.8 series (early Aug 2026).** Qwen3.8-Max (API), Qwen3.8-Flash (described as next-generation architecture, open-sourced early, cache-hit input "as low as ¥0.1 per million tokens"), Qwen3.8-27B (open-weight, runs on consumer GPUs) and Qwen3.8-Omni-Flash. Alibaba claims 460+ open models in total. [Vendor claim] [QbitAI 22 Sep 2026](https://www.qbitai.com/2026/09/493625.html). On Bailian, `qwen3.8-max` is already marked "legacy" (1M context, 128k output). `qwen3.8-flash` is a recommended model (1M context, 128k output). [Fact] [text-generation-model](https://help.aliyun.com/zh/model-studio/text-generation-model).
- **Qwen3.6 and Qwen3.7.** All are listed as legacy on Bailian: `qwen3.7-plus` (1M / 128k, still recommended), `qwen3.7-max` (1M), `qwen3.7-flash` (1M / 64k), `qwen3.6-plus` and `qwen3.6-flash` (1M / 64k), and `qwen3.6-35b-a3b` (256k / 64k, an open-size MoE). All list function calling plus built-in tools. [Fact] Same page. The page does not mark open-weight status. [Inference] The `-35b-a3b` and `-27b` naming follows the open-weight convention of Qwen3.5 (open-sourced 16 Feb 2026 per [Qwen-Agent news](https://github.com/QwenLM/Qwen-Agent)).
- **Technical reports.** I could not open a Qwen4 or Qwen3.8 technical report. [Unverified]
- **Cost drivers for us.** Thinking tokens bill as output. Agent 2.0 tiers in CNY per million tokens: Performance ¥6.4 / ¥22.4, Balanced ¥1.6 / ¥6.4, Economy ¥0.5 / ¥2, AUTO flat ¥3 / ¥12. Implicit cache hits bill at 20% of input. [Fact] [Agent 2.0](https://help.aliyun.com/zh/model-studio/new-single-agent-application).

### 2. Bailian (Model Studio) knowledge base and RAG pipeline

**Plain English.** You upload files. Bailian parses, chunks, embeds and indexes them. A "retrieval service" then searches one or more of these knowledge bases with keyword and vector search together, reranks the results and passes the top chunks to the model. Example: a company handbook PDF is split into roughly 600-token pieces. A question about leave policy pulls the 5 best pieces after reranking.

**Knowledge base types.** [Fact] [rag-knowledge-base](https://help.aliyun.com/zh/model-studio/rag-knowledge-base)
- Document search: hybrid vector plus keyword. Three scenarios: basic Q&A; "visual understanding", where documents are not chunked and the LLM reads them directly; and fast Q&A.
- Data query: CSV, Excel and RDS tables, answered via NL2SQL from table and column headers.
- Image Q&A: multimodal embedding.
- Audio/video search: transcription plus segment localization.

**Editions.** Standard ¥0.03/hour on shared compute. Flagship ¥0.2 per RCU-hour. Billing since 4 Jan 2026 is a spec fee plus model-call fees. [Fact] Same page; [release notes](https://help.aliyun.com/document_detail/2679100.html).

**Import limits.** 50 files per upload, 150 MB each. [Fact]

**Parsers.** Default by file type, or choose: standard e-document parsing, document intelligence (layout OCR), LLM parsing, Qwen-VL parsing (image parsing can use qwen-vl-max or qwen-vl-plus with a custom prompt), or audio/video transcription with timestamps. [Fact]

**Chunking.** Modes: smart split (default), by length, by page, by heading, by regex, by symbol. Max chunk length defaults to 600 tokens (range 10–6000). Recommended settings: FAQ 256 tokens by length, manual 600 smart split, long report 2048 smart split, contract 512 by heading. Chunks can be listed, updated and deleted by API. [Fact] [chunking](https://help.aliyun.com/zh/model-studio/rag/chunking). Sources disagree on whether chunking can change later. The chunking page says neither chunking nor vectorization can be changed after creation. The main KB page says the chunking strategy "can be adjusted after creation" and that changing the embedding model triggers a full rebuild. [Fact: conflict between two official pages]

**Embedding and storage.** `qwen3.7-text-embedding` (default) or `text-embedding-v4`. Vectors live in platform storage or in your own AnalyticDB for PostgreSQL (ADB-PG). [Fact] [rag-knowledge-base](https://help.aliyun.com/zh/model-studio/rag-knowledge-base)

**Metadata.** At most 5 fields per KB, names in English letters and underscores only. Value methods: constant, variable (`file_name`, `cat_name`), LLM extraction, regex, keyword match. Two flags per field: "participate in retrieval" and "participate in model reply". Fields must be defined at creation, and values cannot be edited by hand. API filtering passes `metadata_filter` inside `rag_options` alongside `pipeline_ids`. [Fact] Same page. The retrieval-service UI filters only by tag. [Fact] [retrieval](https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval)

**Retrieval pipeline.** Steps: (1) optional query rewrite; (2) vector search and keyword search, each with its own TopK of 1–100; (3) rerank with `qwen3-rerank`, `qwen3-rerank-hybrid`, `qwen3-vl-rerank` or none, in "Q&A" or "similarity" mode (global settings also allow a custom advanced mode); (4) score weighting and return. Max recall is 1–20 both globally and per KB. The per-KB similarity threshold is 0.01–1.0. At most 15 KBs per retrieval service, all in the same workspace, each with a weight. KB routing uses an LLM and costs model calls. Lowering the initial TopKs reduces rerank token cost. [Fact] [retrieval](https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval); [release notes](https://help.aliyun.com/document_detail/2679100.html). The fusion formula between the keyword and vector lists is not documented. [Unverified]

**Create API.** `POST https://{workspace_id}.cn-beijing.maas.aliyuncs.com/api/v1/indices/rag/index/create_v2` with fields `structureType`, `sinkType`, `sourceType`, `embeddingModelName`, `chunkSize`, `categoryIds`. [Fact]

**Failure modes.** [Inference] The fields that are locked at creation (metadata schema, and per one page the chunking and embedding settings) force a full re-import when the design changes. A product should version index configurations instead.

### 3. Bailian Agent 2.0, workflows, MCP, evaluation, managed agents

**Agent 2.0** (released 26 Dec 2025). Knowledge bases, MCP servers and built-in tools are all "tools" the agent plans over. KB retrieval can be "intelligent" (the model decides) or "always" (search before the first inference). The loop is plan / act / reflect, with ReAct max rounds 1–50. Short-term memory is 0–30 turns. Long-term memory is "planned". Publishing shows a diff against the last release, and you can roll back to an earlier version. Models can be fixed or routed by AUTO / performance / balanced / economy. [Fact] [Agent 2.0](https://help.aliyun.com/zh/model-studio/new-single-agent-application)

**Workflows.** Workflows support batch, multimodal generation and document/image/video/audio parsing nodes. The KB node call modes are always / intelligent / legacy. Async runs return a task ID, and Dify workflows can be imported. [Fact] [release notes](https://help.aliyun.com/document_detail/2679100.html)

**Custom MCP.** Three ways to add one:
1. Script deployment to Function Compute: npx/uvx stdio servers, or an `http` connection to a remote SSE or streamable-HTTP server, using an `mcpServers` JSON config. Two modes: Basic (pay per call) or Speed (always on).
2. Import a REST API already published as MCP in AI Gateway (that is, Higress).
3. Import Alibaba Cloud OpenAPI services under a RAM role and RAM policy.
After deployment only the name and description can be edited. [Fact] [custom-mcp](https://help.aliyun.com/zh/model-studio/custom-mcp)

**Evaluation ("Evolution").** Set types are agent, workflow, trajectory (columns `input`, `reference_output`, `trajectory`) and custom. Column types: String, Number, Boolean, Object, Array, trajectory, multimodal. Imports from xls, xlsx or csv up to 20 MB. At most 10 versions are retained, and a set must be published before use. Column types are frozen once data exists. [Fact] [evaluation set](https://help.aliyun.com/zh/model-studio/agenteval-evaluation-set). Evaluator types and metrics were not on that page. [Unverified]

**Managed Agents (commercial billing since 17 Aug 2026).**
- Agent definition: name, model, system prompt, 9 built-in tools, MCP servers, version-locked skills, multi-agent "coordinator team", and metadata. Every save increments `version`. A session pins the agent version it started with. API updates are full replacements guarded by an optimistic lock on `version`. Agents can be archived but not deleted. [Fact] [agent definition](https://help.aliyun.com/zh/model-studio/managed-agents-agent-definition)
- Sandbox: images `code-interpreter-v1`, `browser`, `all-in-one`; E2B-compatible. Persistence is off by default; snapshots are kept 1–30 days (default 3). `web_search` costs ¥0.03 per call. Credentials use `${variable}` placeholders that the gateway substitutes only for configured domains, and only in the Authorization header. Scheduled tasks (cron) run one session per run. Webhooks are supported. Tool approval is either "always allow" or "ask each time". [Fact] [release notes](https://help.aliyun.com/document_detail/2679100.html)
- Memory Store: described in finding 9 and the memory section below.

**July 2026 enterprise agent platform.** The Bailian July 2026 monthly report (3 Aug 2026) lists an "enterprise-grade full-stack agent platform with visual orchestration and long-horizon autonomous planning", Token Plan (personal), "Knowledge Studio", and 39 new MCP templates. [Vendor claim] [developer.aliyun.com/article/1752713](https://developer.aliyun.com/article/1752713). The article body did not load, so no mechanics are known. At Apsara (22 Sep 2026) Alibaba also named **AgentCore** (build, run and manage agents, with human-agent collaboration controls), **Agent Security Center**, and a "Context Engine" with **Agent Context**, "real-time context and long-term memory for agents", claimed to cut tokens up to 67%. [Vendor claim] [blog 603589](https://www.alibabacloud.com/blog/alibaba-unveils-roadmap-on-full-stack-ai-strategy-from-chips-cloud-infrastructure-models-to-agents_603589)

### 4. Bailian long-term memory and user profiles

**Plain English.** Two memory designs sit side by side. (a) A *file-tree* memory store that the agent reads and edits like a folder. (b) A *service* memory that extracts facts and a user profile from conversations automatically. Example of (b): you define a profile schema with attributes "occupation" and "hobbies". After a chat, the service fills them in asynchronously for that `user_id`.

**File-tree Memory Store.** [Fact] [memory store](https://help.aliyun.com/zh/model-studio/managed-agents-memory-store)
- Store IDs start `memstore_`; memories are files with IDs `mem_` and paths like `/notes/project.md`.
- Every create, modify or delete makes a version. Versions can be listed and read. "Redact" erases a version's body permanently. Concurrent edits use a `content_sha256` precondition and return a conflict on mismatch.
- Mounts are fixed at session creation, `read_only` or `read_write`, at most 8 per session, with an `instructions` field (≤4,096 characters) telling the agent when to search.
- The agent accesses memory only through Glob, Grep, Read, Write and Edit; shell commands cannot reach memory paths. A post-session "Dreaming" step can consolidate read-write mounts.
- Max file size is 102,400 bytes. Listing filters by path only, with no content search. Archiving is irreversible.
- Credentials must not be stored in memory.

**Bailian memory service.** [Fact] [long-term memory 2.0](https://help.aliyun.com/zh/model-studio/long-term-memory-2-0)
- Base path `https://{WorkspaceId}.cn-beijing.maas.aliyuncs.com/api/v2/apps/memory/`.
- Endpoints: `/add` (synchronous extraction), `/add-async`, `/events/{id}`, `/memory_nodes`, `/memory_nodes/search` (returns fact memory by default), a skill export endpoint, PATCH and DELETE on nodes, `/profile_schemas` CRUD, and `/profile_schemas/{id}/user_profile?user_id=`.
- Limits: 3,000 QPM per account overall, `add` 120 QPM, `search` 300 QPM.
- When mounted into managed agents it takes `memory_store_id`, `entity_id`, up to 5 rule IDs (`project_ids`) and one `profile_schema`. [Fact] [memory store page](https://help.aliyun.com/zh/model-studio/managed-agents-memory-store)
- Profile schema: `name`, `description`, and an `attributes[]` list of name and description pairs. Extraction is asynchronous, so the first read may return nothing. Conflict and overwrite rules are not documented. [Fact / Unverified] [user profile](https://docs.agent.bailian.aliyun.com/zh/memory/user-profile)

### 5. QwenWork (千问办公) and Enterprise Context

**Plain English.** QwenWork is Alibaba's agent workbench for staff: chat with an agent that writes documents, analyses data, runs scheduled jobs and acts in DingTalk. "Enterprise Context" is its company-memory layer. "Digital employees" are agents with an HR-style identity. Example: a tea chain loads store-operations documents, Q&A group chats and training schedules into a "store operations knowledge space" for about 10,000 frontline staff. [Vendor claim] [Jiemian](https://m.jiemian.com/article/15128675.html)

**History.** QwenWork is the merged successor of QoderWork, Wukong (悟空) and MuleRun, combined in July 2026 under the head of DingTalk. [Vendor claim via press] [Jiemian](https://m.jiemian.com/article/15128675.html); [ifanr](https://www.ifanr.com/1673691). Public beta was running by 3 Aug 2026. [ifanr]

**Surfaces.** The desktop client handles local files and computer control. The cloud handles research, web building and long tasks. DingTalk handles groups, meetings, documents, approvals and to-dos. [Vendor claim] [ifanr](https://www.ifanr.com/1673691). Browser automation and local file work are client-only. [Fact] [FAQ](https://help.aliyun.com/zh/qwenwork/product-faq)

**Connectors** (from press, not docs): browser, computer control, macOS apps, Microsoft 365, DingTalk, Feishu, Slack, LINE, Linear, Notion, Figma, Canva, Vercel, Supabase, Neon, Google Calendar, Google Maps, Todoist. IM channels: DingTalk, Feishu, Lark, WeChat, WeCom, Slack, WhatsApp. [Vendor claim] [ifanr](https://www.ifanr.com/1673691). After authorization, DingTalk access covers docs, attendance, AI meeting notes and knowledge bases. [Fact] [FAQ](https://help.aliyun.com/zh/qwenwork/product-faq). A community article counts 25 native DingTalk capabilities. [Unverified, user-contributed] [developer.aliyun.com/article/1753347](https://developer.aliyun.com/article/1753347)

**Skills and expert kits.** Skills are packaged workflows. Expert kits bundle skills, connectors and workflows per role or industry. Organization-level skills preserve method when staff leave. [Vendor claim] [ifanr](https://www.ifanr.com/1673691)

**Scheduled tasks.** They run in the cloud. Rules: one-time, interval, hourly, daily, weekly, monthly, custom. Each run gets its own session, and "run now" does not change the schedule. [Fact] [FAQ](https://help.aliyun.com/zh/qwenwork/product-faq)

**Enterprise controls and pricing.** Seats plus a pooled credit wallet. Each seat gives 2,000 credits per month into the pool, with no rollover. Packs last one year. Deduction order is seat credits first, then packs by earliest expiry. Seats added mid-period are prorated; reductions apply at renewal; there is no direct downgrade. [Fact] [FAQ](https://help.aliyun.com/zh/qwenwork/product-faq). Credit multipliers by model tier: 0.1× / 0.25× / 1× / 1.1× (Qwen3.8-Max). [Vendor claim] [ifanr](https://www.ifanr.com/1673691). CNY seat prices were not found. [Unverified]

**Enterprise Context, digital employees and Security Center (22 Sep 2026).** [Vendor claim] [ifeng](https://tech.ifeng.com/c/8wd2EoDIYv7)
- Enterprise Context compresses and structures documents, communications and business systems, updates continuously, and returns only the context a task needs. A built-in dedicated model keeps token cost low.
- A digital employee has a name, department, owner, duties, authorization scope and lifecycle. Admins can disable it, and every execution record traces to its identity.
- Security Center sets sandbox boundaries before a run, approves or blocks high-risk operations during it, and keeps logs and recovery afterwards. With DingTalk security it adds least privilege, sensitive-information detection, and an audit trail recording who started the task, which data was used and which actions were taken.
- Apps: SaaS vendors plug their systems in, keeping their own interfaces and data, and results can be written back.

**Open source.** No Enterprise Context code was found. MyContext (next section) is the personal layer only. [Fact for the repo contents; Inference that nothing enterprise-level is open]

### 6. MyContext (openTrinity/mycontext): precise architecture from the code

**Plain English.** MyContext is a desktop app (Electron plus React) that copies your DingTalk (and partly Feishu) chats, documents and meeting minutes onto your laptop. It builds a "who / what / decided what" graph from them and lets an AI search it with sources. Example: ask "who owns the network whitelist?". The app finds DELEGATE facts about the entity "网络白名单" and returns each fact with the chat message it came from.

**Provenance and licence.** Elastic License 2.0: you may self-host, including inside a company, but may not offer it as a hosted service. Developer preview with breaking migrations. The last commit was 31 Aug 2026. The press attributes it to Alibaba's QwenWork team (open-sourced around 16–18 Aug 2026, 1k stars in a week). [Fact] README, LICENSE; [QbitAI](https://www.qbitai.com/2026/08/474647.html). The repo's CLAUDE.md shows the old internal name was "Inklings", and it bans real names, IDs and trademarks from the repo. [Fact]

**Layers** (README; `packages/*`, `kl-graph/`): channels → ingest → store → context pipeline (distill) → retrieval → knowledge graph (kl-graph, Python) → persona (digital self) → agent runtime → desktop. [Fact]

**Collectors (channels).** Plugins exist for `dingtalk` (conversations, documents, minutes, events, send, self-identity) and `feishu` (auth, conversations, documents, ingest) (`packages/channels/src/plugins/`). DingTalk access runs through a CLI ("dws") under a command **allow-list** that the code itself treats as the security boundary.
- Commands are allowed by exact full command, never by prefix.
- PII commands (roster, phone lookup, resignations, bank or contract data) are never allowed.
- Commands outside the list throw `FORBIDDEN` (`packages/channels/src/plugins/dingtalk/cli.ts`, `assertAllowedCommand`; CLAUDE.md §5).
- Hard rules: confidential or unauthorized chats are skipped and recorded as "unreadable", not as 0 messages. Collection must stay within the user's chosen time bound and selected chats. Pagination must be fully drained. [Fact]

**Scope defaults per data domain** (`packages/store/src/domain-scope.ts`). With no explicit setting, chat is `collect-nothing`, minutes and docs are `collect-all`, contacts are `collect-nothing`. The table is a compile-time-required `Record`, so adding a domain without choosing a default fails the build. Scope is never cached, so a user's change takes effect on the next run. [Fact]

**Ingestion and identity** (`kl-graph/docs/graph-design.md`, `models/types.py`). [Fact]
- The source unit identity is `(source_id, source_type, unit_id)`. A repeat with the same hash is skipped. A repeat with different content is warned and skipped; replacement is still a TODO. There is no watermark, so late messages with old timestamps are still processed. A directory scan that no longer finds a unit does not delete it.
- **Chunks** are the only content node. The `chunk_units` table maps units to chunks many-to-many, with `unit_ordinal_in_chunk`, `chunk_ordinal_in_unit` and half-open character spans.
- **Two orthogonal axes.**
  - Chunking: `session` (idle-gap session slices), `fixed_size` (overlapping character windows that never cross a session break), or `none`.
  - Extraction: `message` (one LLM item per message, neighbours as read-only context; quoted replies move to context so they are not asserted again), `chunk`, or `document` (whole chunk with its title).
  - Presets: `chat_message`, `fixed_size_chat`, `document_chunk`, `stored_chunk`. Invalid pairings fail fast.
- **Extraction items** are ephemeral. Each has exactly one primary projection onto a chunk, validated in `IngestionPlan.validate()`. A fact is created once and gets one `STATES` edge to every evidence chunk, so splitting a message across chunks does not duplicate facts.
- The extraction cache key includes item ID, model, prompt version, strategy version and schema version. Prompt language (`zh` or `en`) is part of the prompt version. The LLM batch size defaults to 5. Failed slots retry with backoff, and exhausted items are reported as a `partial` run rather than treated as empty.

**Entity and fact model.** [Fact] (`models/types.py`, graph-design.md)
- Entity: `name`, `entity_type` (Person, System, Project, Organization, Location, Document, Event, Unknown), `first_seen`, `last_seen`, `mention_count`, `description` (accumulated bullets that collapse into one LLM-generalized paragraph past a size gate), and `quality_status` (`active` or quarantined).
- Fact: `text`, `fact_type` (DECISION, DELEGATE, REQUEST, ACTION_ITEM, STATUS, CAUSAL, OPINION, GENERAL), `timestamp`, `confidence` (default 0.8), `subject_entity_id`, `object_entity_id`, `source_chunk_id`, `source_unit_id`, `extraction_item_id`.
- REQUEST and ACTION_ITEM have fixed roles: subject is the requester, object is the recipient. An ask to N people is stored as N facts.
- Scope (conversation, document, mail thread, meeting, calendar event) has a deterministic UUID5 from canonical JSON `["scope", source_type, native_id]`.
- Community has levels L0–L3 from Leiden.
- Structural edges: MENTIONS, AUTHORED_BY, REPLY_TO, TEMPORAL, STATES, ABOUT, PART_OF. Improvement edges: ENTITY_SIMILAR (embedding plus pinyin plus co-occurrence Jaccard), FACT_SIMILAR, ENTAILS, CONTRADICTS, COMM_MEMBER.

**Entity resolution and cleanup.** Entities merge by normalized name, and Person entities come from chunk authors. Optional budgeted LLM cleanup (off by default) ranks suspicious entities by `suspicion_score × (1 + log1p(impact_score))`. The LLM can only answer KEEP, RETYPE or reversible QUARANTINE; it cannot rename or merge, which is deferred until transactional rewrites exist. Disambiguation uses pinyin plus hybrid candidates and an LLM judge, capped at `llm_max_budget` (default 500). [Fact] graph-design.md; `ingestion-cost-profile.md`.

**Conflict resolution.** There are two mechanisms. [Fact]
1. *Graph layer.* "Allow conflicts": contradictions are kept and resolution happens at query time. The `CONTRADICTS` and `ENTAILS` edges are "defined but never populated" (graph-design.md, implementation baseline). So in practice the graph does no contradiction detection.
2. *Profile ("distill") layer* (`packages/distill/src/reduce/merger.ts`). Rows are keyed `(facet, scope, scope_ref, key)`, and each carries `value_json`, `confidence`, `evidence_json` (≤50 IDs, newest first), `source ∈ {llm, stat, user}`, `conflict_json` and `revision`. The rules:
   - A user-sourced row is never overwritten by a non-user candidate (`user_override_wins`).
   - Numeric facets (e.g. `routines`) are combined by an evidence-weighted average, with confidence +0.05 capped at 0.95.
   - Equal value counts as **confirm**: keep the value, confidence +0.05 capped at 0.98, merge evidence.
   - An array superset counts as **supplement**: take the new value, keep the higher confidence.
   - Anything else counts as **conflict**: keep both values in `conflict_json`, confidence drops to max(0.2, min(old, new) − 0.15), and a human decides.
   - The comparison is structural JSON equality, deliberately not done by an LLM.
   - The README credits the three-state idea to an outside project's merger prompt.

   Materializers drop rows below confidence 0.5 and flag rows below 0.65 as "thin evidence" (`materializer/work.ts`).

**Storage.**
- App vault: SQLite with versioned migrations, plus a contentless FTS5 table for messages (`packages/store/src/migrations/vault/v4-index.ts`). [Fact]
- kl-graph: SQLite (`sqlite_store.py`) for authoritative rows and the dedup ledger. Graph backend `ladybug` by default (LadybugDB / Kuzu, embedded), with `sqlite` and experimental `falkordb` as alternatives. Vector backend `zvec` (HNSW, cosine) by default, with Qdrant (embedded file or remote) as the alternative. Embedding dimension defaults to 1024. A separate bounded `extraction_cache.db` stores extraction results. [Fact] `kl-graph/config.default.yaml`
- The TypeScript retrieval package quantizes vectors to int8 with a per-row scale. The comment reports 195 MB / 35.7 ms at float32 versus 49 MB / 38.6 ms at int8 for 50k × 1024-dimension vectors. [Fact, repo-measured claim] `packages/retrieval/src/quantize.ts`

**Retrieval API** (kl-graph FastAPI on `127.0.0.1:8200`; `kl-graph/docs/query-api.md`). [Fact]
- `GET /capabilities` advertises feature gates and the entity and fact type vocabularies.
- `/ask` runs a hybrid search over chunks and facts: BM25 via SQLite FTS5 with jieba, plus dense vectors, fused by RRF. An optional cross-encoder reranker (`gte-reranker-v2` by default) applies if configured. Callers may pass `intent` (entities, entity types, fact types) to skip the server's rewrite LLM call. Answer synthesis is off by default, so the agent writes the answer. The response returns a graph frontier and a `cursor` for `/graph_hop`.
- `/neighbors`: batch exact adjacency for up to 2,000 nodes, filtered by edge type, direction and target type, with per-node pagination.
- `/context`: a fact plus its source chunk and surrounding messages.
- `/timeline`: entities with degree above 200 auto-filter to the last 90 days.
- `/requests` and `/todos`: REQUEST or ACTION_ITEM facts addressed to the configured current user and aliases on one local day, using an IANA timezone.
- Also `/path` (1–8 hops), `/search`, `/entity`, `/facts`, `/expand`, and `/global_search` (GraphRAG-style map-reduce over community summaries; disabled with the community gate, which defaults off).
- Desktop-side fusion of `local.fts`, `local.vector`, `kl.ask` and `dws.search` uses RRF with k=60 and keeps per-route ranks for citations (`packages/retrieval/src/fuse.ts`).

**Agent access and permissions.**
- Search uses an "opencode" agent with a generated SKILL.md that contains only query commands (no start, stop or ingest). Its permission allow-list is exactly `kl` / `kl *`, resolved through PATH injection (`packages/agent-runtime/src/kl-skill.ts`). [Fact]
- The persona (digital self) agent **has no send tool**: `draft_reply` is its endpoint. Sending is a host decision behind a four-layer SendGuard:
  1. App-level short-circuit in test or dry-run mode.
  2. Re-read the approved draft from the database and compare its content hash.
  3. The CLI's own `--dry-run`, plus a `--uuid` idempotency key (claimed idempotent for 24 hours).
  4. The source app's own authorization prompt, which cannot be bypassed.

  Grants are typed `once | session | timed | permanent`, and local TTL is treated only as an optimization. A permission error marks the grant revoked and downgrades the session to drafting (`packages/persona/src/send-guard.ts`, `grant-manager.ts`). [Fact]
- A separate pull "Feed Server" for an algorithm team binds to 127.0.0.1 with a random port and a 32-byte bearer token. That token is deliberately not interchangeable with the agent MCP token (`packages/knowledge-feed/src/server.ts`). [Fact]

**What "local-first" means in the code.** [Fact plus Inference]
- Stored locally: raw records, indexes, the graph, vectors and caches, all in the user's data directory. Every server binds to loopback.
- Leaving the machine: model calls. Extraction, embedding and answering go to an OpenAI- or Anthropic-compatible gateway. Example defaults are `MYCONTEXT_MODEL_MAIN=glm-5.2`, `text-embedding-v4`, and kl extraction model `qwen3.7-flash` (`.env.example`, `config.default.yaml`).
- [Inference] So "local" means local *storage and indexing*, not local inference, unless the user points the gateway at a local model server. The config supports this (`send_dimensions` note for vLLM).

**Cost profile.** LLM extraction is usually the heaviest stage, then embeddings. Full graph improvement is the main RAM risk: all-pairs cosine needs about 1.1 GB for 17k facts at 4096 dimensions. The incremental path updates only one-hop frontier Leiden communities. The work profile is re-extracted only after 200 new messages or 3 days with new data, with exponential backoff (`ingestion-cost-profile.md`, `packages/distill/src/work-refresh.ts`). [Fact]

**Gaps versus the press description.** [Fact / Inference] The press says confirmed user conclusions cannot be overwritten and conflicts are shown side by side. The code does this in the profile layer only, not in the knowledge graph. The press also says agent access is limited by user and organization permissions. The code has no organization permission model: it is single-user, with per-domain scopes and command allow-lists.

### 7. UModel / UnifiedModel (Alibaba Cloud Observability): the ontology method

**Plain English.** UModel describes a system as typed objects (services, hosts, pods, deployments), links between them, and pointers from each object to where its data lives (a Prometheus metric, a log store). An agent asks the model "what is `payment-gateway`, what does it call, and how do I get its p99 latency?" The model answers with the *query to run*. The agent never guesses metric names or labels.

**Primitives** ([basic concepts](https://www.alibabacloud.com/help/en/cms/cloudmonitor-2-0/basic-modeling-concepts); repo `schemas/core/`). [Fact]
- Sets: `entity_set`, `metric_set`, `log_set`, `trace_set`, `event_set`, `profile_set`, `runbook_set`, `entity_source`, `explorer`.
- Links: `entity_set_link`, `data_link`, `storage_link`, `runbook_link`, `explorer_link`, `entity_source_link`.
- Storage kinds: Prometheus, Aliyun Prometheus, VictoriaMetrics, Elasticsearch, ClickHouse, MySQL, SLS logstore / metricstore / entitystore, external.
- EntitySet fields include `primary_key_fields`, `first_observed_time_field`, `last_observed_time_field`, `keep_alive_seconds`, `dynamic`, `fields` (with `type`, `unit`, `filterable`, `analysable`, `value_mapping`), `name_fields`, `tag_fields` and `id_generator`.
- Links carry `src` and `dest` as `{domain, kind, name}`.

**Modelling method** ([blog 603058, 23 Apr 2026](https://www.alibabacloud.com/blog/603058); [principles](https://help.aliyun.com/en/cms/cloudmonitor-2-0/umodel-modeling-principles)). [Fact]
1. Divide domains with clear owners (e.g. `apm`, `infra`, `acs`), created only after team review.
2. Define entity sets and relations, generic rather than over-specialized. Prefer `service` with a `service_type` field over `spring_boot_web_service`.
3. Make rules explicit from interviews and past incidents.
4. Map telemetry through DataLinks without copying data ("storage decoupling").
5. Apply to alerting and RCA, then iterate.

Rules from the principles page:
- Naming: `{domain}.{name}` for entity sets, `{domain}.{metric|trace|log|event|profile}.{name}` for datasets, `{src}_{linktype}_{dest}` for links. Field names match `[a-z][a-z0-9_]*`.
- Standard relation types: `calls`, `hosts`, `contains` (one-way), `same_as`, `related_to` (two-way). The page also writes `is_same` once. Relation direction must be consistent system-wide.
- Each entity type has one authoritative source. Cross-domain links are computed by matching fields such as IP or hostname, e.g. by scheduled SQL. Avoid Cartesian products.
- Quantity caps: ≤10,000 instances per entity type and ≤100,000 records per instance.
- Every display name and description must be bilingual (en_us and zh_cn). Exemptions use `@exempt` with a stated reason and periodic review.

**Runtime and agent access** ([blog 603674, 26 Oct 2026](https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674); repo). [Fact]
- Definition layer versus individual layer, which the blog equates with TBox and ABox.
- Query surfaces in SPL: `.umodel`, `.entity`, `.entity_set` (methods such as `get_metrics` and `get_logs`, plus `__list_method__` for progressive discovery), `.topo`, `.runbook_set`.
- The plan JSON v1 envelope has `mode`, `version`, `operation`, `next_action: execute_query`, `data_source`, `query` and `time_range`. The open-source server is plan-only: `mode=data` returns `NOT_IMPLEMENTED` with migration hints (CHANGELOG 0.2.0, 0.4.0).
- GraphStore providers: memory, file.memory, local.ladybug.
- Interfaces: `umctl` CLI, REST and MCP on :8080, web UI on :5173.
- Onboarding: `umctl umodel validate|import --file model-pack.yaml`, then `umctl entity write` and `umctl topo write` from CMDB, Kubernetes, OpenTelemetry and similar sources.

**RCA method** (`skills/umodel-rca/SKILL.md`). [Fact]
1. Orient: find the symptomatic entity and read its runbook metadata.
2. Characterize with telemetry, not with alert text.
3. Form competing hypotheses: deploys, config changes (retry, timeout, circuit breaker), upstream traffic, downstream saturation, runtime capacity.
4. Gather cross-domain evidence both upstream and downstream.
5. Cite every conclusion.

A recent change counts as suspicious only with a plausible mechanism, a topological path and correctly timed telemetry. The worked example rules out a recent deploy that only changed the log format. It then derives 4000 QPS × 3.5 promotion × 2.5 retry amplification = 35,000 QPS (8.75× capacity) ([blog 603674](https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674)).

**Actions.** The RunbookSet schema includes `actions`, `action_type`, `risk_level`, `confirmation_required`, `allowed_tools`, `inputs`/`outputs`, `observations`, `conclusions`, `knowledge`, `toolkits` and `skills` (`expanded_schemas/runbook_set.expanded.yaml`; RunbookSet is marked `release_stage: experimental`). [Fact]

**Results.** On DataAgentBench, the vendor reports +10–20 percentage points for four flagship models with the semantic layer, and GLM-5.2 at 50.2% pass@1. [Vendor claim] [blog 603674](https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674). The June 2026 ontology blog gives no measured numbers. [Fact] [blog 603207](https://www.alibabacloud.com/blog/ontology-is-trending-again--can-it-improve-my-ai-agents-performance_603207)

**Open-sourcing and standards.** Announced 20 May 2026 alongside a "Universal Semantic Standard" initiative with Chanjet, XPeng, JLCPCB, CAICT and others. [Vendor claim] [blog 603289](https://alibabacloud.com/blog/enabling-boundless-intelligent-collaboration-umodel-now-open-source-launching-the-universal-semantics-standard-initiative_603289)

### 8. Ant Group OpenSPG and KAG

**Plain English.** OpenSPG is a typed knowledge-graph engine: schema plus storage plus rule reasoner. KAG sits on top of it. It builds the graph from documents and answers questions by planning small steps, such as "look up X's founder", "look up the founder's birth year", "compute the age". Example rule in the schema: a company's `mainSupply` relation is *derived*. It exists if the two companies sit on adjacent supply-chain products and over 50% of the source company's inflow comes from the other.

**Schema language** (`.schema` files, committed with `knext schema commit`). [Fact] Parser `KAG/knext/schema/marklang/schema_ml.py`, enums `knext/schema/model/base.py`.
- Type keywords: `EntityType`, `ConceptType`, `EventType`, `StandardType`, `BasicType`, `IndexType`. Basic types are `Text`, `Integer`, `Float`. Each declaration is `EnglishName(中文名): Type`.
- Type-level keys: `desc`, `properties`, `relations`, `hypernymPredicate` (`isA`, `locateAt`, `mannerOf`; used on concepts), `regular`, `spreadable`, `autoRelate`.
- Property constraints: `NotNull`, `MultiValue`, `Enum`, `Regular`. Index types: `VECTOR`, `SPARSE_VECTOR`, `TEXT`, `TEXT_AND_VECTOR`, `TEXT_AND_SPARSE_VECTOR`.
- Built-in properties: events get `eventTime`; concepts get `stdId` and `alias`.
- **Semantic relation prefixes** (`PREFIX#name`):
  - `SYNANT` (synonym, antonym, …)
  - `CAU` (leadTo, causes, …)
  - `SEQ` (happenedBefore, hasSubevent, …)
  - `IND` (belongTo)
  - `INC` (isPartOf, hasA, madeOf, …)
  - `USE` (usedFor, capableOf, …)

  They appear in schemas as e.g. `IND#belongTo` and `CAU#leadTo`.
- **Semantic properties replace hand-built relation tables.** A property typed as a ConceptType with `MultiValue` (e.g. `product(经营产品): Product`) turns a comma-separated CSV column into graph edges at import (`kag/examples/supplychain/schema/README.md`).
- **Rules (metrics and derived relations).**
  - Syntax: `rule: [[ Define (s:Type)-[p:pred]->(o:Type) { STRUCTURE { graph pattern } CONSTRAINT { named conditions and assignments } } ]]`.
  - Constraints use aggregation functions `group(s).sum(f.transAmt)`, date functions `date_diff(from_unix_time(now(),'yyyyMMdd'), f.transDate) < 30`, null handling `rule_value(cond, then, else)`, references to other derived properties (`s.fundTrans1Month`), and named thresholds (`R1("占比必须超过50%"): x*1.0/s.totalTransInAmt > 0.5`).
  - Concept rules (`concept.rule`) classify events into concept nodes, e.g. ProductChainEvent with index 价格 and trend 上涨 belongs to `TaxOfProdEvent/价格上涨`. They also derive causal links between concepts (`leadTo`).
  - Files: `SupplyChain.schema`, `concept.rule`. [Fact]
- Storage: labelled property graph (TuGraph or Neo4j adapters under `openspg/cloudext/impl/graph-store/`) plus a vector store. The paper names Elasticsearch or Milvus. [Fact] repo; [paper](https://arxiv.org/html/2409.13731v3)

**kg-builder.**
- Two chains (`kag/builder/default_chain.py`). [Fact]
  - Structured: `mapping >> vectorizer >> writer`.
  - Unstructured: `reader >> splitter >> extractor(s) >> vectorizer >> post_processor >> writer`.
- Components (`kag/builder/component/`):
  - Scanners: csv, json, directory, file, dataset, odps (MaxCompute), sls, yuque.
  - Readers: pdf, docx, markdown, txt, dict, mix.
  - Splitters: length, outline, pattern, semantic, table.
  - Extractors: `schema_free` (NER, then entity standardization, then triples), `schema_constraint`, outline, summary, knowledge_unit, atomic_query, table, chunk, naive_rag.
  - Aligners: `kag_aligner`, `spg_aligner`.
  - Writers: Neo4j-backed graph writer and in-memory graph writer.
- Concurrency setting `builder.model.execute.num` defaults to 5 (v0.5.1).
- A "lightweight build" mode (v0.7) claims 89% fewer construction tokens. [Vendor claim] README

**Mutual indexing.** [Fact] Every extracted node gets a `source` edge to its Chunk node (`assemble_sub_graph_with_chunk`, `schema_free_extractor.py:365–375`). The paper's built-in properties are `supporting_chunks`, `description`, `summary` and `belongTo`. Chunk IDs combine article, paragraph and in-paragraph index, so neighbouring text has neighbouring IDs. Knowledge is layered into KG_cs (schema-constrained, curated), KG_fr (extracted, same types) and RC (raw chunks) ([paper](https://arxiv.org/html/2409.13731v3)). Retrieval runs exact graph match, then fuzzy graph match, then chunk retrieval. In code the flow components are `kg_cs_open_spg_legacy`, `kg_fr_open_spg_legacy` and `rc_open_spg_legacy` under `kag_hybrid_executor`. [Fact for names; Inference for the exact/fuzzy reading]

**Logical-form solver.** [Fact] `kag/solver/prompt/logic_form_plan.py`; [paper Table 1 and Algorithm 1](https://arxiv.org/html/2409.13731v3)
- Operators:
  - `Retrieval(s=alias:Type[name], p=alias:edge, o=alias:Type[name], s.prop=value…)`, where type and name are given only at first reference and later steps reuse aliases.
  - `Math(content=[…], target=…)->alias`
  - `Deduce(op=judgement|entailment|extract|choice|multiChoice, content, target)->alias`
  - `Output(alias)`
  - The paper also lists `Sort` (min/max, limit).
- Each step must contain exactly one action.
- Loop: planner, then reasoner per sub-query, then judge "resolved?", then supplementary query, repeating until resolved, then generator.
- Planners: static, iterative, LF-static, MCP planner, and a fine-tuned model planner. Executors: hybrid retrieval, deduce, output, py-based math, MCP, web search.
- **Numeric computation** is the LLM generating Python that runs in a subprocess with a timeout. The error is fed back for regeneration (`py_based_math_executor.py`).

**Results.** See finding 8. Retrieval Recall@5 for KAG versus IRCoT+HippoRAG: HotpotQA 88.8 vs 83.0, 2Wiki 91.9 vs 93.9 (KAG is lower here), MuSiQue 65.7 vs 57.6. Knowledge alignment raised CR_ref3 top-5 recall by 15.7% on average. LFSH_ref3 is the slowest configuration. [Fact] [paper](https://arxiv.org/html/2409.13731v3). The E-Government and E-Health figures were not in the parts I could read. [Unverified]

**Release history.** [Fact] README, `docs/release_notes.md`, git tags.
- 2024-10-25: v0.5, first release of kg-builder and kg-solver; kag-model "to be open-sourced later".
- 2024-11-21: v0.5.1, Word upload, concurrency setting.
- 2025-01-07: v0.6, domain knowledge injection, schema-constrained extraction.
- 2025-04-17: v0.7, solver refactor with static and iterative planning, "simple" versus "deep reasoning" modes, lightweight build; v0.7.1 followed.
- 2025-06-27: v0.8.0, private and public knowledge bases, built-in index types (Outline, Summary, KnowledgeUnit, AtomicQuery, Chunk, Table), KBs decoupled from apps, full MCP, KAG-Thinker model.

There is no tag after v0.8.0, though `main` still received commits in Nov 2026. OpenSPG engine tags end at v0.8. Licence Apache-2.0. Product mode runs in Docker Compose on port 8887. arXiv versions: v1 10 Sep 2024, v2 24 Sep 2024, v3 26 Sep 2024.

**SPG white paper.** Not opened. [Unverified]

### 9. Agent frameworks: AgentScope, Qwen-Agent, Spring AI Alibaba

- **AgentScope 2.0** (Apache-2.0, Python ≥3.11; latest tag v2.0.12 by `git ls-remote`). [Fact] [repo](https://github.com/agentscope-ai/agentscope)
  - ReAct agent with realtime interrupt and resume, sequential or concurrent tool calls.
  - Toolkit spanning Python tools, MCP and skills. Memory backends ReMe or Mem0. Context compaction and middleware.
  - Permission and human-in-the-loop controls. A2A via `A2AAgent` (Sep 2026). `TeamPipeline` leader/worker teams (Sep 2026). Experimental SOP support (Sep 2026). `ModelRouterMiddleware`.
  - Agent service: FastAPI with web UI, multi-tenancy, SQL or NoSQL persistence, scheduling, IM channels, WebRTC voice (Oct 2026).
  - Sandboxes: local, Docker, Apple Container, Bubblewrap, E2B, OpenSandbox, Daytona, Kubernetes.
- **AgentScope Runtime** is being archived into AgentScope 2.0 (last tags v1.1.x). It provided `AgentApp` as a FastAPI subclass with init / query / shutdown and SSE. Sandboxes: Base, GUI, Browser, Filesystem, Mobile, Training, Agentbay, on docker, gvisor, boxlite or fc backends. `RedisSession` keyed by `session_id` and `user_id`. Deploy targets: local, Kubernetes, Function Compute, ACK, and `ModelstudioDeployManager`. Protocols: A2A, Responses API, OpenAI-compatible. [Fact] [repo](https://github.com/agentscope-ai/agentscope-runtime)
- **Qwen-Agent** (Apache-2.0, latest tag v0.0.26). LLM wrappers over DashScope or any OpenAI-compatible server. A parallel function-call template with `fncall_prompt_type` and `use_raw_api`. MCP via `mcpServers`. A Docker code interpreter that the README itself calls not hardened for production. Long-document RAG. DeepPlanning benchmark (Jan 2026). [Fact] [repo](https://github.com/QwenLM/Qwen-Agent)
- **Spring AI Alibaba** (Apache-2.0, Maven 1.1.2.2; tag v2.0.0-M1.1 exists). Modules: agent framework (ReactAgent), Graph core, Admin, Studio, Sandbox. "Context engineering" policies: human-in-the-loop, compaction, model and tool call limits, tool retry, planning, dynamic tool selection. A2A with Nacos. NL2SQL/DataAgent and DeepResearch are separate projects. [Fact] [repo](https://github.com/alibaba/spring-ai-alibaba)

### 10. Gateway and registry layer: Higress, Nacos, HiMarket, ModelScope

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

### 11. Data platforms (one paragraph each)

- **MaxCompute** (formerly ODPS). Serverless cloud data warehouse with storage and compute separated, tiered storage (Standard, Infrequent Access, Archive), and the OpenLake lakehouse. The MaxFrame Python framework is pandas-compatible and integrates with PAI. Announcements mention SQL "AI Function" capabilities and model objects, but the page gives no specific function list. KAG has an `odps_scanner` to read from it. [Fact] [overview, updated 10 Oct 2026](https://www.alibabacloud.com/help/en/maxcompute/product-overview/what-is-maxcompute); KAG repo.
- **DataWorks.** Integration, development, governance and analytics over MaxCompute, EMR, Hologres, Flink, AnalyticDB, StarRocks and PAI. Data Map handles the catalog and lineage; Data Quality handles rules. Copilot shipped in 2024. Data Agent and MCP features are not mentioned on the overview page. [Fact] [overview](https://www.alibabacloud.com/help/en/dataworks/product-overview/what-is-dataworks). [Inference] The lineage and quality-rule metadata is the obvious source for an ontology's metric definitions in Alibaba-centric customers.
- **Hologres.** PostgreSQL-compatible real-time warehouse combining ingestion, sub-second OLAP and high-QPS point serving. It has built-in Proxima vector retrieval. Full-text, AI functions and MCP are not on the overview page. [Fact] [overview, updated 17 Sep 2026](https://www.alibabacloud.com/help/en/hologres/product-overview/what-is-hologres)
- **AnalyticDB for PostgreSQL.** Can serve as the customer-owned vector store behind Bailian knowledge bases ("self-purchased ADB-PG"). [Fact] [rag-knowledge-base](https://help.aliyun.com/zh/model-studio/rag-knowledge-base). Its own product page did not render. [Unverified beyond this]
- **PolarDB.** Not opened; the fetch budget was exhausted. [Unverified]
- **PAI.** Alibaba claims PAI completed Qwen post-training in five days. [Vendor claim] [blog 603589](https://www.alibabacloud.com/blog/alibaba-unveils-roadmap-on-full-stack-ai-strategy-from-chips-cloud-infrastructure-models-to-agents_603589). The product page did not render. [Unverified]
- **Context Engine / Agent Context / OpenLake (Apsara 2026).** Agent Context offers real-time context and long-term memory, claimed to cut tokens by up to 67%. OpenLake claims −38% total cost and −40% query time. [Vendor claim] Same blog.

### 12. AliCoCo and AliMe (not opened)

AliCoCo (arXiv 2003.13230) and AliMe knowledge-graph papers could not be fetched after the search and fetch limits were hit. From memory only: AliCoCo is Alibaba's e-commerce concept net. It organizes a taxonomy, "primitive concepts" and user-need "e-commerce concepts" (e.g. "outdoor barbecue") that link to items. [Unverified, not opened] Read it before citing.

### 13. DingTalk and Feishu/Lark agent platforms (brief)

- MyContext's code shows that DingTalk exposes a workspace CLI ("dws") with OAuth-style scopes. Chat-scope sends need user confirmation in the DingTalk UI every time, and grants default to a 24-hour TTL (comments in `packages/persona/src/grant-manager.ts`, "measured" from the CLI's help output). [Fact as a repo claim]
- DingTalk-side error codes include `PAT_NO_PERMISSION`, `PAT_ORG_POLICY_DENIED` and `PAT_SCOPE_AUTH_REQUIRED` (`cli.ts`), which shows that org policy can deny agent scopes. [Fact]
- Feishu is a MyContext source (auth, conversations, documents) and a QwenWork IM channel. [Fact / Vendor claim]
- Platform docs for DingTalk AI agents and Feishu aily were not opened. [Unverified]

### 14. Alibaba's internal "AI-native organization" practice (Apsara 2026)

The sources I could open (QbitAI's conference recap and the Alibaba Cloud roadmap blog) describe "recursive self-improvement":
- 33 unattended iteration rounds on Qwen3.8-Max over a month.
- +96% single-instance throughput with an adapted SGLang on a new T-Head GPU.
- A 60-hour chip-design run with 10,000+ EDA tool calls: −42% area, −59.5% power.
- A "Token Foundry" lab.

[Vendor claim] [QbitAI](https://www.qbitai.com/2026/09/493625.html); [blog 603589](https://www.alibabacloud.com/blog/alibaba-unveils-roadmap-on-full-stack-ai-strategy-from-chips-cloud-infrastructure-models-to-agents_603589). Neither describes org structure, headcount policy or internal agent governance. [Unverified]

---

## What to copy

1. **Make the source-unit identity, not the timestamp, the ingestion key.** Key every raw record as `(source_id, source_type, unit_id)` plus `content_hash`. Skip a repeat with the same hash. Flag a repeat with a changed hash for re-extraction. Never use a watermark. Re-runs are then safe and late data still lands. Source: `mycontext/kl-graph/docs/graph-design.md` (https://github.com/openTrinity/mycontext).
2. **Separate storage chunks from extraction items, and validate the projection plan before writing.** Each LLM extraction item has exactly one primary chunk and N supporting chunks. A fact is stored once, with a `STATES` edge to each evidence chunk. This prevents double-counted facts and keeps citations. Source: `kl-graph/kl_graph/models/types.py` (`IngestionPlan.validate`).
3. **Reify facts as nodes with typed roles and provenance.** Fact = text, type, timestamp, confidence, subject, object, source chunk, extraction-item ID. Use fixed role semantics for request and action types (requester → assignee), one fact per recipient. This answers "what's on my plate today" with a query instead of an LLM call. Source: graph-design.md and query-api.md (`/requests`, `/todos`).
4. **Use a cache key that includes model, prompt, strategy and schema versions.** It prevents old extractions from being replayed under a new contract. Report exhausted items as a `partial` run, never as empty. Source: graph-design.md "Extraction batching and cache identity".
5. **Copy the three-state merge with user precedence for any human-editable business fact (metric definitions, owners, rules).** Key each row exactly by `(facet, scope, scope_ref, key)`. Compare structurally. Confirm raises confidence +0.05 (cap 0.98). Supplement takes the new value. Conflict keeps both values in `conflict_json`, lowers confidence to max(0.2, min − 0.15) and goes to a review queue. `source='user'` is never overwritten by a machine. Source: `packages/distill/src/reduce/merger.ts`.
6. **Give every data domain an explicit, compile-time-required default scope.** Chat is collect-nothing; docs are collect-all, or whatever your policy says. Re-read scope on every run with no cache. Source: `packages/store/src/domain-scope.ts`.
7. **Use exact-command allow-lists for connectors, with PII commands excluded by policy.** Record "unreadable" as different from "empty". Drain pagination. Source: `packages/channels/src/plugins/dingtalk/cli.ts`, CLAUDE.md §5.
8. **Never give an agent a send or write tool directly. The agent drafts; the host executes.** Re-read the approved draft by ID and compare its hash at send time. Pass a server idempotency key. Treat local grant TTLs as hints, and on a permission error mark the grant revoked and fall back to draft. Source: `packages/persona/src/send-guard.ts`, `grant-manager.ts`.
9. **Adopt UModel's TBox/ABox split and naming rules for the business model.** Use `{domain}.{entity}`, `{domain}.{metric|log|event}.{name}`, `{src}_{linktype}_{dest}`, snake_case fields, a small standard relation vocabulary (`calls`, `hosts`, `contains`, `same_as`, `related_to`), one authoritative source per entity type, and domain owners. Source: https://help.aliyun.com/en/cms/cloudmonitor-2-0/umodel-modeling-principles.
10. **Return query plans, not data, from the semantic layer.** `get_metric(entity)` returns `{data_source, query, time_range, next_action: execute_query}`, and a separate executor runs it under the caller's credentials. Agents stop guessing column or label names, and execution permission stays where the data lives. Source: UnifiedModel CHANGELOG 0.2.0 and 0.4.0 (https://github.com/alibaba/UnifiedModel); blog 603674.
11. **Model allowed actions as runbook entries with `risk_level`, `confirmation_required`, `allowed_tools`, `inputs` and `outputs`, bound to entity types.** Reads default on, writes default off. Source: `UnifiedModel/expanded_schemas/runbook_set.expanded.yaml`; blog 603674.
12. **Express metric definitions and derived relations as declarative rules over graph patterns.** Use a STRUCTURE (pattern) plus CONSTRAINT (filters, `group().sum()`, date windows, named thresholds) block attached to the property it defines, and evaluate it in the engine, not the LLM. Source: `KAG/kag/examples/supplychain/schema/SupplyChain.schema`.
13. **Plan answers as typed steps, and do arithmetic in code.** One operator per step (Retrieve, Math, Deduce, Output), aliases threaded between steps, and Math executed as generated code in a sandbox with an error-feedback retry. Source: `kag/solver/prompt/logic_form_plan.py`, `kag/solver/executor/math/py_based_math_executor.py`.
14. **Layer knowledge by trust: curated schema-constrained facts, then extracted facts, then raw chunks.** Retrieve in that order and link every node back to its chunk (mutual index). Source: arXiv 2409.13731 §2 (https://arxiv.org/html/2409.13731v3); `schema_free_extractor.py`.
15. **Use hybrid retrieval fused by RRF (k=60) and keep per-route ranks for citations.** Let agent callers pass a structured `intent` to skip server-side rewrite. Make answer synthesis optional so the calling agent writes the answer. Source: `packages/retrieval/src/fuse.ts`; `kl-graph/docs/query-api.md`.
16. **Expose a capabilities endpoint listing live features and the type vocabularies, and have agents call it first.** Source: `GET /capabilities` in query-api.md; UnifiedModel `GET /api/v1/capabilities`.
17. **For RAG settings, copy Bailian's ranges as starting defaults but version them.** 600-token chunks (256 for FAQ, 512 by heading for contracts), separate vector and keyword TopK (1–100), rerank to ≤20, a per-source similarity threshold, ≤5 metadata fields with "use in retrieval" and "use in answer" flags. Do not repeat Bailian's create-time lock-in; version index configs and rebuild in the background. Source: https://help.aliyun.com/zh/model-studio/rag/chunking, https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval.
18. **Agent memory as versioned, path-addressed files with optimistic concurrency.** `content_sha256` precondition, version history with redaction, mounts fixed at session start (read-only or read-write, ≤8), and no shell access to memory paths. Source: https://help.aliyun.com/zh/model-studio/managed-agents-memory-store.
19. **Pin the agent version per session and update with full replacement plus a version check.** Source: https://help.aliyun.com/zh/model-studio/managed-agents-agent-definition.
20. **Give agents an HR-style identity record**: name, department, owner, duties, authorization scope, lifecycle, admin disable. Every log line carries that identity. Source: https://tech.ifeng.com/c/8wd2EoDIYv7 (vendor description).
21. **Per-caller tool narrowing at the gateway.** A static `allowTools` intersected with a per-request header set by the auth layer. Source: https://higress.cn/ai/en/mcp-server.
22. **Pricing shape: seats plus a pooled monthly credit wallet with per-model multipliers.** Seat credits are used first, then packs by earliest expiry. Source: https://help.aliyun.com/zh/qwenwork/product-faq; https://www.ifanr.com/1673691.

## What cannot or should not be copied

- **MyContext code itself in a hosted product.** The Elastic License 2.0 forbids offering it to third parties as a hosted or managed service. Copy the design, not the code. (README, LICENSE)
- **MyContext's single-user permission model.** It has no organization roles, row-level permissions or cross-user sharing. An org brain needs its own permission layer. [Inference from code]
- **MyContext's graph-layer conflict handling.** `CONTRADICTS` and `ENTAILS` are unpopulated, and same-ID content replacement and deletion are TODOs. Treat these as gaps, not designs. (graph-design.md)
- **Higress's database-to-MCP server as a safety boundary.** The query tool does not enforce read-only and the execute tool is always exposed. Use a DB role with SELECT-only grants, or your own SQL guard. [Inference from `servers/gorm` code]
- **Bailian's create-time lock-ins** (metadata schema; per one page also chunking and embedding). They force full re-imports. (help.aliyun.com KB pages; the two pages disagree)
- **Qwen4-Max weights.** Not released, so it cannot be self-hosted; open weights are only for smaller models. [Fact / Vendor claim]
- **KAG's benchmark claims as evidence for our design.** The backbones differ from the baselines, the abstract and release notes contradict each other on which dataset got which gain, and KAG's 2Wiki Recall@5 is below the best baseline. (arXiv 2409.13731v3 Tables 8–9; KAG release notes)
- **KAG's LLM-generated-Python math in production without a real sandbox.** It shells out to the host Python interpreter in a temp file with a timeout, which is not isolation. Run it in a proper sandbox. [Inference from `py_based_math_executor.py`]
- **QwenWork's DingTalk-native depth.** It relies on DingTalk owning identity, org chart and host-UI authorization prompts. A third-party product for Malaysian or other mid-size firms cannot assume that. [Inference]
- **UModel's open-source server for data execution.** It is plan-only by design (`mode=data` returns NOT_IMPLEMENTED). Data execution exists in the commercial CloudMonitor. You must build your own executor. (CHANGELOG 0.2.0)

## Open questions and unverified items

- Official Model Studio per-token prices for qwen4-max, qwen3.8-flash and qwen3.7-plus. The figures here are from a secondary site, and the official table did not render.
- Qwen4 and Qwen3.8 technical reports, and exact open-weight licences for Qwen3.8-27B and Qwen3.8-Flash.
- Whether Bailian's chunking settings can be changed after creation (two official pages disagree).
- Bailian hybrid fusion formula; default TopN and threshold values; evaluator types and metrics in "Evolution".
- Bailian memory-service conflict and overwrite policy, and profile attribute types.
- The Bailian July 2026 "enterprise agent platform", AgentCore, and Agent Context (Context Engine): mechanics, APIs, pricing. Only summaries were seen.
- QwenWork CNY seat prices, the admin console's governance features, and the official connector list (the list here is from press).
- Enterprise Context internals, and whether any part will be open-sourced. Nothing was found.
- Nacos MCP registry versioning and hot-update mechanics; ModelScope MCP marketplace; HiMarket's Dec 2025 upgrade contents.
- PolarDB, AnalyticDB and PAI current AI features (pages unreadable or budget exhausted).
- SPG white paper; AliCoCo (arXiv 2003.13230); AliMe knowledge-graph papers. None were opened.
- DingTalk and Feishu/Lark official agent-platform docs.
- Any primary account of Alibaba's internal "AI-native organization" practice from Apsara 2026.
- The 24-hour DingTalk grant TTL and 24-hour `--uuid` idempotency are MyContext code comments describing upstream behaviour, not DingTalk documentation.
- The web-search limit (200 per turn, shared) and the web-fetch limit were both hit mid-research. A follow-up session could close the gaps above.

## Sources (ranked by usefulness)

1. MyContext repository, `openTrinity/mycontext` (last commit 31 Aug 2026), https://github.com/openTrinity/mycontext. Read `kl-graph/docs/graph-design.md`, `query-api.md`, `ingestion-cost-profile.md`, `kl_graph/models/types.py`, `packages/distill/src/reduce/merger.ts`, `packages/persona/src/send-guard.ts`, `packages/store/src/domain-scope.ts`. The most concrete context-layer design available.
2. UnifiedModel repository, `alibaba/UnifiedModel` (v0.4.0, 16 Jun 2026; last commit 9 Nov 2026), https://github.com/alibaba/UnifiedModel. Schemas, plan contract, RCA skill.
3. "The AI Agent Era Doesn't Need More Data — It Needs a Semantic Layer" (26 Oct 2026), https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674. UModel runtime, agent flow, benchmark claim.
4. KAG repository (v0.8.0, 27 Jun 2025), https://github.com/OpenSPG/KAG. Read `SupplyChain.schema`, `concept.rule`, `knext/schema/marklang/schema_ml.py`, `logic_form_plan.py`, builder components. Rule and solver mechanics.
5. KAG paper, arXiv 2409.13731 v3 (26 Sep 2024), https://arxiv.org/html/2409.13731v3. Representation, mutual index, operators, result tables.
6. UModel modelling principles, https://help.aliyun.com/en/cms/cloudmonitor-2-0/umodel-modeling-principles. Naming, relation vocabulary, governance rules.
7. Bailian Memory Store, https://help.aliyun.com/zh/model-studio/managed-agents-memory-store. Versioned file memory design.
8. Bailian knowledge base, https://help.aliyun.com/zh/model-studio/rag-knowledge-base (with chunking https://help.aliyun.com/zh/model-studio/rag/chunking and retrieval https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval). RAG knobs and limits.
9. Bailian agent platform release notes (to 11 Nov 2026), https://help.aliyun.com/document_detail/2679100.html. Dated change log for Managed Agents, sandbox, KB billing, Agent 2.0.
10. Bailian Agent 2.0, https://help.aliyun.com/zh/model-studio/new-single-agent-application. Tool-unified ReAct design and tier prices.
11. Bailian long-term memory 2.0 API, https://help.aliyun.com/zh/model-studio/long-term-memory-2-0; user profile, https://docs.agent.bailian.aliyun.com/zh/memory/user-profile.
12. Managed Agent definition, https://help.aliyun.com/zh/model-studio/managed-agents-agent-definition. Versioning and locking.
13. QwenCloud qwen4-max page, https://docs.qwencloud.com/developer-guides/getting-started/latest-model. Limits and API compatibility.
14. Bailian text-generation model list (modified 16 Nov 2026), https://help.aliyun.com/zh/model-studio/text-generation-model. Context and output limits across Qwen 3.5–4.
15. QwenWork FAQ, https://help.aliyun.com/zh/qwenwork/product-faq. Scheduled tasks and enterprise credit mechanics.
16. ifeng / IT之家 on QwenWork Enterprise Context and digital employees (22 Sep 2026), https://tech.ifeng.com/c/8wd2EoDIYv7; Jiemian, https://m.jiemian.com/article/15128675.html.
17. ifanr on QwenWork (3 Aug 2026), https://www.ifanr.com/1673691. Connectors and credit multipliers (press).
18. QbitAI on MyContext (18 Aug 2026), https://www.qbitai.com/2026/08/474647.html. Attribution and press description.
19. Higress MCP server plugin, https://higress.cn/ai/en/mcp-server; quick start, https://higress.ai/en/docs/ai/mcp-quick-start/; code `alibaba/higress` `plugins/golang-filter/mcp-server/servers/gorm`.
20. UModel basic concepts, https://www.alibabacloud.com/help/en/cms/cloudmonitor-2-0/basic-modeling-concepts.
21. Bailian custom MCP, https://help.aliyun.com/zh/model-studio/custom-mcp; evaluation sets, https://help.aliyun.com/zh/model-studio/agenteval-evaluation-set.
22. Alibaba Cloud Apsara 2026 roadmap blog (22 Sep 2026), https://www.alibabacloud.com/blog/alibaba-unveils-roadmap-on-full-stack-ai-strategy-from-chips-cloud-infrastructure-models-to-agents_603589; QbitAI recap, https://www.qbitai.com/2026/09/493625.html.
23. UModel blogs: 603058 (23 Apr 2026), https://www.alibabacloud.com/blog/603058; 603207 (3 Jun 2026), https://www.alibabacloud.com/blog/ontology-is-trending-again--can-it-improve-my-ai-agents-performance_603207; 603289 open-source announcement, https://alibabacloud.com/blog/enabling-boundless-intelligent-collaboration-umodel-now-open-source-launching-the-universal-semantics-standard-initiative_603289.
24. HiMarket open-source blog (3 Sep 2025), https://www.alibabacloud.com/blog/himarket-is-officially-open-source-providing-enterprises-with-a-ready-to-use-ai-open-platform_602510.
25. Nacos MCP template manual, https://nacos.io/en/docs/v3.0/manual/user/ai/mcp-template/.
26. AgentScope, https://github.com/agentscope-ai/agentscope; AgentScope Runtime, https://github.com/agentscope-ai/agentscope-runtime; Qwen-Agent, https://github.com/QwenLM/Qwen-Agent; Spring AI Alibaba, https://github.com/alibaba/spring-ai-alibaba.
27. Fello AI on Qwen4-Max (secondary; prices), https://felloai.com/qwen-4/. Use only until the official price table is read.
28. MaxCompute, DataWorks and Hologres overviews on alibabacloud.com/help (Sep–Oct 2026). One-paragraph role facts.
29. Bailian July 2026 monthly report (summary only), https://developer.aliyun.com/article/1752713.
