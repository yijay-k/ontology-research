# Session state and memory

**Layer:** [08-agent-platform](README.md) · **What it is:** Durable agent sessions, access to the task record, and per-customer memory across interactions.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Other companies and products](#other-companies-and-products) (2) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (3) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (2)

## Other companies and products

### Sierra Agent Data Platform and memory

> Source: [general-references/12-agent-companies.md § Sierra Agent Data Platform and memory](../../general-references/12-agent-companies.md#sierra-agent-data-platform-and-memory)

Plain English. ADP is the customer's memory across calls. "Hi Maria, last week you asked about the upgrade. Still interested?"

- ADP has two components: a memory layer and a decisioning engine. Memory unifies unstructured data (calls, chats, emails) with structured data (CRM, billing, transactions) and connects to the customer's warehouse or systems of record. The decisioning engine picks the next best offer within a strategy the company defines (audience, desired outcomes, inventory of offers, triggers) and inside guardrails. [Vendor claim] https://sierra.ai/blog/agent-data-platform
- Memory has three levels: explicit saves, builder-configured items, and automatically captured preferences. Recalling sensitive items requires identity verification. Per-customer memory is about three orders of magnitude smaller than the knowledge base. [Vendor claim, secondary] https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents
- Horizon's "context engine" stitches every interaction across parties. In the healthcare referral example that means patient, specialist and referring physician. The agent learns from closed and rejected sales, and the customer owns this context. [Vendor claim] https://sierra.ai/blog/horizon
- No schema, retention or permission details are published. [Unverified]

### 3.7 Memory and user context

> Source: [general-references/18-decagon.md § 3.7 Memory and user context](../../general-references/18-decagon.md#37-memory-and-user-context)

Per-conversation metadata (location, role, tier, language) shapes AOPs and greetings. User Memory (Spring 2026) persists history across sessions and channels with controls on what is stored and how it is used; Missions read Memory (e.g. "no calls after 3pm") before each step. Chime credits cross-channel memory. [Vendor claim] https://decagon.ai/proactive-agents ; https://decagon.ai/blog/missions ; https://decagon.ai/case-studies/chime. Storage model, retention and per-field consent: not public. [Unverified]

## Research literature

### 4. Memory

> Source: [general-references/10-papers-agents-memory-eval.md § 4. Memory](../../general-references/10-papers-agents-memory-eval.md#4-memory)

**Plain English.** Memory is what an agent knows next week that it learned this week. Example: the agent learns that "Finance wants dates as DD/MM/YYYY", writes that to `/preferences/finance.md`, and reads it next session.

**MemGPT** (Packer, Wooders, Lin, Fang, Patil, Stoica, Gonzalez; arXiv 2310.08560, Oct 2023). It uses OS-style virtual context management: tiers of memory (in-context "main" memory plus external recall and archival storage) that the LLM pages in and out with function calls, and interrupts to manage control flow. It was evaluated on documents larger than the context window and on multi-session chat [Fact, https://arxiv.org/abs/2310.08560]. It is the ancestor of Letta and of "memory blocks" injected into the prompt.

**Generative agents** (Park, O'Brien, Cai, Morris, Liang, Bernstein; arXiv 2304.03442, 2023). A memory stream records experiences in natural language, periodic reflections synthesise them into higher-level insights, and retrieved memories drive planning. Ablations show observation, planning and reflection each matter [Fact, https://arxiv.org/abs/2304.03442]. The retrieval score (an equal-weighted sum of recency with exponential decay, LLM-rated importance on a 1 to 10 scale, and embedding relevance), and reflection triggering on cumulative importance, come from the paper body, which I did not re-read [Unverified this session].

**Zep / Graphiti** (Rasmussen, Paliychuk, Beauvais, Ryan, Chalef; arXiv 2501.13956, Jan 2025) [Fact, https://arxiv.org/html/2501.13956]:
- Three subgraphs. Episodes are raw messages, text or JSON, kept non-lossy. Semantic entities and facts are edges, possibly hyper-edges. Communities are clusters with summaries, found by label propagation so they can update incrementally, with periodic full refresh.
- Bi-temporal edges. Event time is `t_valid`/`t_invalid` (when the fact was true). Transaction time is `t'_created`/`t'_expired` (when the system learned or retired it). A new contradicting fact invalidates the old edge rather than deleting it, and new information wins.
- Ingestion runs entity extraction on the current message plus the last 4, with a reflection pass, and always extracts the speaker. Entity resolution combines 1024-dimensional BGE-m3 embeddings, full-text search and an LLM check. Graph writes use predefined Cypher, never LLM-generated Cypher.
- Retrieval: search with cosine, BM25 (Neo4j/Lucene) and n-hop BFS. Rerank with RRF, MMR, episode-mention frequency, node distance, or a cross-encoder (most accurate, most expensive). Then construct the context.
- Results: DMR 94.8% vs MemGPT 93.4% (gpt-4-turbo), which the authors call marginal since conversations fit in context. LongMemEval: gpt-4o-mini rose from 55.4% to 63.8% and gpt-4o from 60.2% to 71.2%, latency fell from about 29 to 31 s to about 2.6 to 3.2 s, and context fell from 115k to 1.6k tokens. By category, temporal reasoning (+48.2% with gpt-4o-mini) and preferences improved, while single-session-assistant fell (-9% and -17.7%).
- Limitations stated by the authors: residential-network latency in measurements, weaker models struggle to use the temporal data, and only message episodes were tested. Ontologies and business-data integration were left as future work.

**Mem0** (Chhikara, Khant, Aryan, Singh, Yadav; arXiv 2504.19413, Apr 2025). It extracts and updates salient facts, with a graph variant. It claims +26% relative over OpenAI memory on LoCoMo with an LLM-judge metric, -91% p95 latency and more than 90% token savings against full context. The graph variant adds about 2% [Vendor claim, https://arxiv.org/abs/2504.19413]. Disputed: Zep says Mem0 misconfigured Zep (both speakers as one user, timestamps in text, sequential searches). Corrected, Zep scored 75.14% against Mem0 Graph's 68.44%, and a full-context baseline of about 73% beat Mem0 [Vendor claim, https://www.getzep.com/blog/lies-damn-lies-statistics-is-mem0-really-sota-in-agent-memory/, 6 May 2025, updated 3 Jun 2026].

**A-MEM** (Xu, Liang, Mei, Gao, Tan, Zhang; arXiv 2502.12110, v11 Oct 2025). Zettelkasten-style notes carry a contextual description, keywords and tags. New notes are linked to similar old ones, and adding a note can update older notes' descriptions ("memory evolution"). It reports gains over baselines across six models, with no figures in the abstract [Fact, https://arxiv.org/abs/2502.12110].

**Benchmarks.**
- LongMemEval (Wu, Wang, Yu, Zhang, Chang, Yu; ICLR 2025, arXiv 2410.10813) has 500 questions over five abilities: extraction, multi-session reasoning, temporal reasoning, knowledge updates and abstention. Commercial assistants and long-context LLMs drop about 30%. It frames memory as indexing, retrieval and reading, and recommends session decomposition, fact-augmented keys and time-aware query expansion [Fact, https://arxiv.org/abs/2410.10813].
- LoCoMo: conversations are short (16k to 26k tokens), there are no knowledge-update tests, category 5 lacks ground truth, and some questions are misattributed or ambiguous [Vendor claim (Zep), as above]. Treat LoCoMo numbers as weak evidence.
- Letta (12 Aug 2025): a filesystem agent (GPT-4o-mini, grep/search_files/open, tool rules forcing search) scored 74.0% on LoCoMo. Letta's conclusion is that memory quality depends more on whether the agent knows when and how to search than on the store [Vendor claim, https://www.letta.com/blog/benchmarking-ai-agent-memory].

**Sleep-time compute** (Lin, Snell, Wang, Packer, Wooders, Stoica, Gonzalez; arXiv 2504.13171, Apr 2025). The model reasons offline over a context before queries arrive. It matched accuracy with about 5x less test-time compute, gained up to 13% (Stateful GSM-Symbolic) and 18% (Stateful AIME) with more sleep-time compute, and cut cost per query 2.5x when amortised over related queries. It works best when queries are predictable from the context [Fact, https://arxiv.org/abs/2504.13171]. This is the theoretical basis for nightly "pre-compute" over a company's data.

**Anthropic, "The components of agent memory"** (Lance Martin, 6 Nov 2026) [Fact, https://www.anthropic.com/research/components-of-agent-memory]:
- Definition: memory is knowledge gained from experience, persisted between sessions as readable context. It excludes weights, in-context learning and compaction.
- Hierarchy: transcripts (a searchable log), then memory notes (files the agent writes), then representations (wikis of linked pages), then injected context (a small top layer loaded every session). Dreaming is the offline process that moves information between layers, corrects notes against transcripts, builds wikis and shapes the injected layer.
- CL-Bench 1.0 (fresh sessions, with only a memory directory persisting): Opus 5.5 rose from 0.655 to 0.838, Opus 5 from 0.564 to 0.828, Opus 4.7 from 0.383 to 0.700, and Sonnet 4.6 only from 0.330 to 0.364.
- Steering: telling strong models a memory folder exists is enough. A fixed "record only failures" rule removed much of the gain (Opus 5 lost 0.234). Older models needed explicit instructions to read memory first and test theories (Sonnet 4.6 rose from 0.364 to 0.641).
- Salience (Pokémon): Sonnet 3.7 wrote 413 files and about 978k characters and earned 1 badge. Fable 5 wrote 10 files plus `global.md` (about 43k characters), stored only what the screen could not show, and earned 4 badges.
- Dreaming fixes errors: a wrong location note trapped the agent until dreaming checked it against the transcript.
- Wikis: on a 350k-file Stainless corpus, a wiki plus search scored 61% against search alone at 53%, saving about 20k tokens per question. Wiki alone rose from 13% to 48% over 128 sessions. On Harvey LAB merger questions, the wiki beat search 87% to 73% on multi-document and judgment items, but gave no gain when answers sat in one document. An over-expanded wiki reached 1.77x the corpus size.
- Shared-file contention: agents overwriting one `provisions.md` kept 72% of facts. One page per contract with verbatim quotes kept 100%.
- Injected layer: keep it small. Claude Code's auto-memory loads only the first 200 lines or 25 KB of `MEMORY.md`, used as an index.

**Product mechanics to copy** [Fact, https://platform.claude.com/docs/en/managed-agents/memory; .../dreams; .../memory-tool]:
- Memory store (`memstore_…`): workspace-scoped, with a name and a description (shown to the agent). Each memory is a path-addressed document of at most 100 kB (about 25k tokens), with at most 10,000 per store. Every mutation creates an immutable `memver_…`. Versions are retained 30 days, but the latest versions of a live memory are always kept. Redaction scrubs a historical version but not the current head. There is no restore endpoint, so you roll back by rewriting old content.
- Attach at session creation only, at most 8 stores per session, each with `access: read_only|read_write` (read_write is the default) and up to 4,096 characters of instructions. Mounted at `/mnt/memory/<slug>/`, so the agent uses ordinary file tools. Optimistic concurrency uses `precondition: {content_sha256}`. The docs warn that prompt injection can write poisoned memory that later sessions trust, so use read_only for reference stores.
- Dreams (research preview): input is one memory store plus 1 to 100 session transcripts, plus optional high-level instructions. Output is a new memory store. The input is never modified, so you review and then swap. Runs take minutes to hours, and cost scales roughly linearly with transcript volume.
- Memory tool (client-side, `memory_20250818`): `view`, `create`, `str_replace`, `insert`, `delete`, `rename` under `/memories`. The application must block path traversal, cap sizes and expire stale files. The API auto-injects an instruction to check memory first and assume context may reset.
- Sierra's Agent Data Platform describes customer memory that combines prior conversations and preferences with structured billing, inventory and policy data [Vendor claim, https://sierra.ai/blog/agent-os-2-0, 5 Nov 2025]. No mechanics were published in what I read.

**File vs graph vs vector: what the evidence says** [Inference from the sources above]:
- Current benchmarks do not show specialised memory stores beating "files plus search plus a capable model" on conversational recall. The best-documented frontier lab practice (Anthropic) is file-based with versioning and offline consolidation.
- Temporal graphs win where facts change over time and you need "what was true when" (LongMemEval temporal +48%). That describes company data: prices, owners, statuses.
- Vector-only retrieval is a component (one of Zep's three search methods), not a memory architecture.
- For a company-model product, the authoritative company facts already live in the company model, a typed, versioned, bi-temporal store. Agent "memory" should hold learned preferences, procedures and corrections, not duplicate business data.

## Design decisions already in the reference maps

### 16. Agent session-state design

> Source: [general-references/30-map-palantir-platform.md § 16. Agent session-state design](../../general-references/30-map-palantir-platform.md#16-agent-session-state-design)

**Purpose.** Agent sessions that can last for days, wait for people, be replayed to any point, and survive restarts. *Receivables example:* a dispute-resolution session starts when a customer replies "we never received the goods". It gathers the invoice and the delivery record, asks the collector one question, waits two days for the customer's proof, then proposes a credit note.

**Design to implement.**
- **Session = typed context items + agent state + an ordered event queue** [Fact 03]. Sessions can last indefinitely and have several participants.
- **Context items** are defined with `(type, argSchema, dataSchema, create, render)`. `render` returns `ready` or `pending`. An ordering list (`contextItemOrder`) controls what the model sees; removing an ID hides the item without deleting it, which is how the context window is managed [Fact 03].
- **Events** come from users, schedules, automations and effects, and are processed strictly in order. A pure `handleEvent(state, event)` returns updates (`setAgentState`, create, delete or reorder items) and **effects**. Effects are asynchronous jobs that report back by dispatching events [Fact 03].
- **Recompute before every model call** [Fact 03]: `systemPrompt(state)`, `tools(state)` and `model(state)`. The model can be wrapped for fallback, for example switching to a backup when the primary response has a terminated status.
- **Long-running tools and human questions** return a *pending* item at once and resolve later through an event. A human question is a `UserQuestion` item, and the person's answer arrives as an event [Fact 03].
- **Completion modes** [Fact 03]: "stays open" (conversational) or "ends after first valid output", matching a typed output schema.
- **Pre-computed variables** run before the agent starts (filtered object sets, function results) [Fact 03]. Palantir also lets actions run at session start even if nothing references them. **Do not copy that: pre-computation is read-only** [Inference].
- **Asynchronous agent jobs** [Fact 03]: synchronous calls have a 5-minute limit. Long agents run asynchronously, return nothing, and write transcripts and results to objects that UIs and evals read. Arguments pass primary keys, and the agent re-fetches under its own scope.
- **Chat as a function** [Fact 03]: inputs `userInput` and an optional `sessionId` (omit it for a new session, never pass an empty string). Outputs are the markdown response, the session ID and any changed variables.
- **Postgres tables** [Inference]:
  - `agent_session(id, tenant_id, app_id, scope_markings[], principal_id, state jsonb, status, created_at)`;
  - `session_event(session_id, seq bigint, source, type, payload jsonb, created_at)`, append-only, unique on `(session_id, seq)`;
  - `context_item(session_id, item_id, type, data jsonb, render_status, visible bool, order_index)`;
  - `effect_job(id, session_id, kind, args, status, emits[], attempts)`.
  - One worker holds a per-session advisory lock, so events are processed one at a time.
- **Replay and debugging** [Fact 03]: a timeline filterable by event type and time, searchable payloads, a conversation pane, a raw context-items pane, and **pinning to a past event to see the state at that moment**.
- **Session logging** [Fact 03]: each message is one execution with a trace ID. Events are `session_metadata`, `user_request`, messages, `tool_call`, `tool_call_result`, `final_response` and `execution_error`. Common fields are `uid` and `owning_rid` (the originating app, even through nested calls). Logs carry markings (section 13).
- **Context overflow.** Palantir makes the user start a new session [Fact 03]. Version 1 copies that, with a "carry forward a summary item" option [Inference].
- **Skills** (version 2) [Fact 03]: Markdown resources with a name, a "when to use" description and a body, loaded on demand by description, and permissioned by folder.

**Copies.**
- Document 03, §10 "The Agent Stack": sessions, context items, events, state machine, effects, HITL, model fallback, Agent Manager debugging, completion modes, pre-computed variables. https://www.palantir.com/docs/foundry/agent-sdk/advanced-customization/ , https://www.palantir.com/docs/foundry/aip/agent-stack/ , https://www.palantir.com/docs/foundry/agent-builder/core-concepts/ , https://www.palantir.com/docs/foundry/agent-manager/session-debugging/
- Document 03, §11: async publish and call. https://www.palantir.com/docs/foundry/agents/publish-and-call/
- Document 03, §9: chatbots as functions, session logging. https://www.palantir.com/docs/foundry/chatbot-studio/chatbots-as-functions/ , https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/
- Document 03, §17: skills. https://www.palantir.com/docs/foundry/ai-fde/aip-skills/

**Left out, and why.**
- Multi-agent Boardroom teams: beta, and needs a separate product [Fact 03].
- Agents optimising agents (AIP Evolve): version 2 at earliest.

**Open questions.**
- Agent SDK status (GA or beta) is [Unverified 03]. The design is copied from docs, not from proven production use.
- Palantir says agent memory is policy-checked at runtime [Vendor claim 04]. How is unclear.

---

### 16. Memory design: files, layered memory, consolidation, bi-temporal facts

> Source: [general-references/32-map-research-and-cost.md § 16. Memory design: files, layered memory, consolidation, bi-temporal facts](../../general-references/32-map-research-and-cost.md#16-memory-design-files-layered-memory-consolidation-bi-temporal-facts)

**Purpose.** The agent remembers learned preferences, procedures and corrections. Examples: "the CFO wants the weekly AR report in MYR thousands"; "ACME always pays on the 25th". It does not duplicate business data, which lives in the company model.

**Design to implement.**
- *Stores*:
  - `memory_store(id, scope: user|team|company|agent, name, description)`
  - `memory(path, content ≤ 100 kB, sha256)`
  - immutable `memory_version` rows kept at least 30 days
  - redaction; optimistic writes with a sha256 precondition
  - at most about 8 stores attached per run
- *Layers*:
  - (a) searchable transcript log
  - (b) agent-written notes
  - (c) curated wiki pages, one page per entity (for example per customer) and never a shared page
  - (d) a small injected index, at most 200 lines or 25 KB, that links down
- *Access*: company and team stores are read-only to agents and change only through reviewed consolidation. The per-user store is read-write. Path validation (no `..`, no `%`, canonical prefix), size caps, expiry.
- *Prompting*: tell the model what memory is for. Do not impose rigid write rules.
- *Nightly consolidation ("dream") job*, run through Batch:
  - reads the day's transcripts plus the store
  - writes a *new candidate store*: deduplicate, fix contradictions against transcripts, fix links
  - promoted only after diff review by a human or an eval gate
- *Bi-temporal company facts*: columns `valid_from`/`valid_to` (event time) and `recorded_at`/`superseded_at` (transaction time) on facts that change, such as credit limits, payment terms and account owners. A contradicting fact closes the old row rather than deleting it.

**Evidence.**
- Memory lifted Opus 5.5 from 0.655 to 0.838 on CL-Bench. A rigid "record only failures" rule cost Opus 5 0.234. Sonnet 4.6 only rose to 0.364 without explicit instructions, and to 0.641 with them. One page per contract raised fact survival from 72% to 100%. Dreaming fixed a wrong note that had trapped the agent. Wiki plus search scored 61% against 53% on a 350k-file corpus (Anthropic, "The components of agent memory", 6 Nov 2026).
- Managed Agents limits: 100 kB per memory, 10,000 per store, 8 stores per session, versions kept 30 days (platform docs).
- A filesystem agent scored 74.0% on LoCoMo against Mem0's reported 68.5% [Vendor claim] (Letta).
- Zep's bi-temporal graph on LongMemEval: 71.2% against 60.2% full context (gpt-4o), with 1.6k against 115k context tokens; temporal reasoning +48.2% with gpt-4o-mini (arXiv 2501.13956). All from document 10, section 4.

**Copies.** Document 10, section 4 and "What to copy" items 6 and 7. https://www.anthropic.com/research/components-of-agent-memory ; https://platform.claude.com/docs/en/managed-agents/memory ; https://platform.claude.com/docs/en/managed-agents/dreams ; https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool ; https://arxiv.org/html/2501.13956 ; https://www.letta.com/blog/benchmarking-ai-agent-memory

**Left out.**
- Managed Agents memory and Dreams as a dependency: beta or research preview, Claude-only, and the product must also run on Qwen.
- Choosing a memory vendor on LoCoMo numbers, which are disputed and flawed.
- Using LLM-generated Cypher for graph writes (Zep uses predefined Cypher only).

**Open questions.**
- There is no evidence on how well Qwen or GPT use file-based memory. Sonnet 4.6's weak result suggests weaker models need explicit structure.
- Dream-job cost scales roughly linearly with transcript volume, but no price is given.

### 13. Memory of each customer across interactions

> Source: [general-references/34-map-agent-companies.md § 13. Memory of each customer across interactions](../../general-references/34-map-agent-companies.md#13-memory-of-each-customer-across-interactions)

**Purpose.** Remember what each debtor and contact said and prefers across emails, chats and months. Example: "Ms Tan said they pay suppliers on the 25th and prefers WhatsApp; no calls after 3pm."

**Design to implement.**
- `memory_item(id, tenant_id, subject_type: debtor|contact, subject_id, kind: explicit|configured|captured, key, value, source_message_id, captured_at, expires_at?, sensitivity, acl)`.
  - `explicit`: the contact asked us to remember; `configured`: builder-defined fields (pay day, preferred channel, AP portal); `captured`: automatically extracted preferences.
- One person across channels: link memory to the contact, not the channel identity; resolve channel identities (email address, WhatsApp number) to contacts.
- Sensitive items require identity verification before recall.
- Read before every outbound action (§8) and at conversation start.
- Customer-owned and exportable: an export endpoint to the customer's warehouse; retention on the customer's terms; granular control of what is stored and used.
- Per-customer memory is small relative to the knowledge base (about three orders of magnitude, Sierra's figure) — keep it as rows, not a vector index [Inference].

**Copies.**
- doc 12, Sierra ADP: memory plus decisioning, three memory levels, identity verification for sensitive recall, ~3 orders of magnitude smaller [Vendor claim, secondary]. https://sierra.ai/blog/agent-data-platform ; https://www.zenml.io/llmops-database/building-production-scale-voice-and-multi-modal-customer-experience-agents
- doc 19 §2G, Key finding 10: Context Engine memory tied to one person across channels, customer-owned, permissioned, retained on customer's terms, exportable; "rent the intelligence, own the context". https://sierra.ai/product/context-engine ; https://sierra.ai/blog/summit-recap-2026
- doc 18 §3.7: User Memory across sessions and channels with control over storage and use; Missions read memory ("no calls after 3pm"). https://decagon.ai/proactive-agents ; https://decagon.ai/blog/missions
- doc 21 §2A: saved vs learned memories (learned is a billable unit). https://docs.glean.com/glean-enterprise-flex-pricing

**Left out, and why.** Next-best-offer decisioning for upsell (Sierra ADP): not a receivables need.

**Open questions.** No vendor publishes schema, retention or permission details for memory (doc 12, doc 19 [Unverified]); the schema above is assembled.

## Earlier engineering notes (Phase 2)

### 1. An agent task needs durable session state

> Source: former `08-agent-platform/phase2-agent-sessions-and-evaluation.md` (moved here in the Nov 2026 restructure)

The public Palantir Agent Stack models one task as a session:
- a session contains agent work, its state, context items and event history;
- context items are typed records (messages, tool results, recommendations, decisions, structured outputs);
- events carry input from people, tools or other applications;
- the agent state machine decides how events update context or transition the task, including to a waiting-for-review state;
- sessions can remain open indefinitely while awaiting a person or an external event.

This is materially different from storing a long conversation transcript and replaying it into a prompt on every request. The durable unit is a task with versioned context and state transitions.

Official sources:
- https://www.palantir.com/docs/foundry/aip/agent-stack
- https://www.palantir.com/docs/foundry/agent-manager/overview
- https://www.palantir.com/docs/foundry/agent-manager/session-debugging

### 2. Agent Manager implies access control over the task record itself

> Source: former `08-agent-platform/phase2-agent-sessions-and-evaluation.md` (moved here in the Nov 2026 restructure)

Palantir documents published agents as governed resources. Access to the agent does not automatically grant access to every session; session visibility is separately subject to mandatory and discretionary permissions. This is an important design point for multi-user, long-running workflows: the task transcript, tool outputs and decisions can contain sensitive customer/matter information and require explicit access control.

Our agent/session schema should carry:
- tenant and resource/matter scope;
- initiating principal and delegated agent identity;
- agent version and tool-registry version;
- session state and current state-machine version;
- typed context item references;
- event sequence and workflow correlation;
- visibility/ACL policy and retention classification;
- policy decisions and approvals associated with each write.

## Palantir (updated 28 Nov 2026)

- **Agent Stack sessions:** each task is a session with **typed context items** (instructions, assistant/user messages, tool results) and **events with state transitions**; sessions can last indefinitely, waiting for input and resuming when it arrives. Agent Manager finds, starts, monitors and inspects sessions across Workshop, Automate and Agent Manager itself; agents are published as versioned resources with permissions. Sources: https://palantir.com/docs/foundry/agent-stack/overview/ , https://palantir.com/docs/foundry/aip/agent-stack/ , https://palantir.com/docs/foundry/agent-manager/overview/
- **API surface:** create / list / get / delete sessions, blocking and streaming continue, cancel, get RAG context for a session, session traces. Source: https://palantir.com/docs/foundry/api/aip-agents-v2-resources/sessions/session-basics/

## Open-source implementations (added 28 Nov 2026)

- Claude Agent SDK `SessionStore` contract with a Postgres reference store ([claude-agent-sdk](../../open-source-references/claude-agent-sdk.md)); Letta git-backed memory ([letta](../../open-source-references/letta.md)).

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Checkpoint tables (LangGraph JS, MIT):** [`langchain-ai/langgraphjs` → `libs/checkpoint-postgres/src/migrations.ts`](https://github.com/langchain-ai/langgraphjs/blob/61aad39/libs/checkpoint-postgres/src/migrations.ts) — checkpoints / checkpoint_blobs / checkpoint_writes split.

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
