# Temporal facts and memory store

**Layer:** [06-knowledge-and-evidence](README.md) · **What it is:** Facts with valid-time and record-time, invalidation, two-tier (learned vs certified) knowledge and memory stores.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (2) · [Open-source implementations](#open-source-implementations) (7) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (4) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Lingyang, AgentOne and Alibaba

### 4. Bailian long-term memory and user profiles

> Source: [general-references/08-alibaba-stack.md § 4. Bailian long-term memory and user profiles](../../general-references/08-alibaba-stack.md#4-bailian-long-term-memory-and-user-profiles)

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

### 6. MyContext (openTrinity/mycontext): precise architecture from the code

> Source: [general-references/08-alibaba-stack.md § 6. MyContext (openTrinity/mycontext): precise architecture from the code](../../general-references/08-alibaba-stack.md#6-mycontext-opentrinitymycontext-precise-architecture-from-the-code)

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

## Open-source implementations

### 8. Graphiti: temporal knowledge graph

> Source: [open-source-references/graphiti.md](../../open-source-references/graphiti.md) (code study)

Plain-English explanation: "Alice is the account manager for Acme" was true from March. In September a new message says Bob took over. Graphiti does not overwrite the first fact. It closes it (`invalid_at = September`) and keeps both, so "who was the account manager in May?" still has an answer.

- Apache-2.0, Python (about 85k lines), version 0.31.2, last commit 2026-11-20. Graph drivers exist for Neo4j, FalkorDB and Neptune; there is no Postgres driver. [Fact] ([graphiti_core/driver/](https://github.com/getzep/graphiti/tree/HEAD/graphiti_core/driver))
- Schema (`graphiti_core/edges.py`, `nodes.py`):
  - Every node and edge has `uuid` and `group_id` ("partition of the graph", which serves as the tenant or namespace key).
  - `EntityEdge` adds `name`, `fact` (a natural-language sentence), `fact_embedding`, `episodes[]` (provenance), `valid_at`, `invalid_at`, `expired_at` (transaction time), `reference_time` and typed `attributes`.
  - The node types are `EntityNode` (name_embedding, summary, attributes), `EpisodicNode` (the raw source unit, with `source`, `content` and `valid_at`), `CommunityNode` and `SagaNode` (a sequence of episodes with a rolling summary).

  [Fact] ([edges.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/edges.py))
- Ingestion API. `add_episode(name, episode_body, source_description, reference_time, group_id, entity_types: dict[str, pydantic model], edge_types, edge_type_map: {(src_label, tgt_label): [edge names]}, custom_extraction_instructions, saga, identity_properties ...)`. Custom types are Pydantic models. `enforce_edge_type_signatures` drops an edge, or renames it to a default, if its name is not allowed between its endpoint labels. [Fact] ([graphiti.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/graphiti.py), [edge_operations.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py))
- Invalidation, in three steps:
  1. A fast path reuses an existing edge whose endpoints match and whose normalised fact text is identical.
  2. Otherwise one small-model LLM call receives the duplicate candidates and the invalidation candidates with *continuous integer indices*, so the model never sees UUIDs, and returns `duplicate_facts` and `contradicted_facts`. Out-of-range indices are logged and discarded.
  3. `resolve_edge_contradictions` applies a deterministic rule. If the time windows do not overlap, nothing happens. If the old edge started before the new one, the old edge gets `invalid_at = new.valid_at` and `expired_at = now`.

  [Fact]
- Future-tense handling. `temporal_edge_utils.py` uses regular expressions (will, plans to, scheduled to, by/deadline, until/expires, and so on) so that a promise's `valid_at` is the statement time, not the promised date, and so that a soft deadline does not become `invalid_at`. [Fact] ([file](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/temporal_edge_utils.py))
- Search. Edge search methods are cosine similarity, BM25 and breadth-first search. Rerankers are reciprocal rank fusion, node distance, episode mentions, maximal marginal relevance (MMR) and a cross-encoder. [Fact] ([search_config.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/search/search_config.py))
- Verdict: **copy the design** (four-timestamp edges, index-based LLM adjudication, the deterministic invalidation rule, the future-tense normaliser) into Postgres tables. Running Graphiti adds Python plus Neo4j or FalkorDB. [Inference]

### Ingestion and conflict resolution

> Source: [open-source-references/graphiti.md](../../open-source-references/graphiti.md) (repository audit)

`Graphiti.add_episode()` validates configured entity/edge types, resolves a request-scoped driver/client bundle, extracts nodes/edges from the episode content, deduplicates nodes/edges, resolves references to existing graph nodes and searches for related edges. `edge_operations.py` parses extracted date bounds into UTC, normalises future temporal bounds, attaches the source episode, and builds the `EntityEdge` with valid/invalid time fields. When a new fact contradicts an existing fact, the resolution path can invalidate the old edge rather than silently overwriting history.

The core flow is not merely “LLM extracts triples”; it combines episode provenance, entity resolution, relation deduplication, temporal parsing, invalidation and persistence.

### 13. mem0

> Source: [open-source-references/mem0.md](../../open-source-references/mem0.md) (code study)

- Apache-2.0, Python version 2.2.1 and TypeScript package `mem0ai` 3.3.1, last commit 2026-11-18. [Fact]
- The current add path (`mem0/memory/main.py`, `_add_to_vector_store`, about 3,900 lines) runs as a "V3 phased batch pipeline":
  1. Gather context.
  2. Retrieve existing memories, mapping UUIDs to integers "anti-hallucination", the same trick as Graphiti.
  3. Run a single LLM extraction call.
  4. Batch-embed the results.
  5. Deduplicate by hash.
  6. Persist in a batch, reporting only the records the store actually accepted.
  7. Link entities in a batch.

  The prompt file labels the V3 prompt "ADD-only with memory linking". The older `DEFAULT_UPDATE_MEMORY_PROMPT` with ADD/UPDATE/DELETE/NONE events still exists. [Fact] ([main.py](https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/main.py), [configs/prompts.py](https://github.com/mem0ai/mem0/blob/HEAD/mem0/configs/prompts.py))
- Open-core boundary. The OSS SDK raises errors for the `timestamp`, `reference_date` and `decay` parameters ("not supported by the OSS Memory SDK"). [Fact] ([memory/notices.py](https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/notices.py))
- Telemetry. `MEM0_TELEMETRY` defaults to true and sends events to `https://us.i.posthog.com`. [Fact] ([memory/telemetry.py](https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/telemetry.py))
- The TypeScript port has a pgvector store and SQLite or Supabase history managers. [Fact]
- Verdict: **ignore as a dependency** for company memory. It is user-centric (scoped by user_id, agent_id and run_id), the temporal features are paywalled, and telemetry is on by default. **Copy** the integer-ID mapping trick and the "report only confirmed writes" rule. [Inference]

### 14. Cognee

> Source: [open-source-references/cognee.md](../../open-source-references/cognee.md) (code study)

- Apache-2.0, Python version 1.6.10, last commit 2026-11-20. [Fact]
- `DataPoint` (Pydantic) is the unit of storage. A field that holds another DataPoint becomes an edge named after the field. `metadata.index_fields` are embedded into per-type vector collections named `<Type>_<field>`. `identity_fields` derive a deterministic node id, so repeated mentions merge. Provenance records which document owns each node, so `forget()` can remove a document's nodes and edges. [Fact] ([infrastructure/engine/models/DataPoint.py](https://github.com/topoteretes/cognee/blob/HEAD/cognee/infrastructure/engine/models/DataPoint.py))
- Storage adapters: graph on Kuzu, Neo4j, Neptune, Turso, or a "postgres_demo" adapter with `graph_node`/`graph_edge` tables over SQLAlchemy and asyncpg (isolated either per dataset or as one schema per dataset in a shared database). Vectors on LanceDB, pgvector or Turso. [Fact]
- Permissions: dataset ACLs (`principal_id, permission_id, dataset_id`) with permission types `read`, `write`, `delete` and `share`, plus tenant-scoped capabilities such as `manage_users`, `grant_capabilities` and `revoke_capabilities`. Granting can only pass on what the granter already holds. [Fact] ([modules/users/permissions/permission_types.py](https://github.com/topoteretes/cognee/blob/HEAD/cognee/modules/users/permissions/permission_types.py))
- Verdict: **copy the design** of identity_fields/index_fields as metadata on your object types, and the rule that a grant can only pass on what the granter holds. **Ignore** as a dependency (Python, and a large surface of about 779k lines). [Inference]

### 15. Letta (letta-ai/letta and letta-code)

> Source: [open-source-references/letta.md](../../open-source-references/letta.md) (code study)

- `letta-ai/letta` `main` (last commit 2026-10-18) is now a landing page. Its AGENTS.md says the V1 Python server lives on an `archive` branch, is unsupported, and should not be used for production, benchmarks or comparisons. [Fact] ([AGENTS.md](https://github.com/letta-ai/letta/blob/HEAD/AGENTS.md))
- `letta-ai/letta-code`: Apache-2.0, TypeScript (about 647k lines), version 0.34.67, last commit 2026-11-20. It includes channels (Slack, Telegram, Discord), cron, approval execution and recovery, and "git-backed memory" (`src/agent/memory-filesystem.ts`). `memory-constraints.ts` validates memory trees against read-only globs and size limits per changed path. [Fact]
- Verdict: **copy the design** of a versioned memory store (every memory change is a diff with history), but in Postgres rows rather than git. **Ignore** as a dependency. [Inference]

### 16. openTrinity/mycontext

> Source: [open-source-references/mycontext.md](../../open-source-references/mycontext.md) (code study)

- **Elastic License 2.0** (SPDX `Elastic-2.0`, which forbids offering the software as a hosted or managed service), TypeScript plus Python, last commit 2026-08-31, labelled "developer preview" with breaking changes promised. The 3.4M Python line count is mostly a vendored runtime (`vendor/`, 407 MB). [Fact] ([LICENSE](https://github.com/openTrinity/mycontext/blob/HEAD/LICENSE), [README](https://github.com/openTrinity/mycontext/blob/HEAD/README.md))
- It is a personal (not organisational) work-context layer. Source plugins exist for `dingtalk` and `feishu` (`packages/channels/src/plugins/`) over a local SQLite vault. Sending and deleting require explicit confirmation. [Fact]
- `kl-graph`, its spatio-temporal knowledge graph, ingests in two phases:
  - **Phase A** chunks new source units, persists lineage and embeds the chunks, with no LLM. Dense and BM25 search work immediately.
  - **Phase B** runs LLM entity and fact extraction and caches results *per chunk* in a separate `extraction_cache.db`, so they can be replayed across database rebuilds.
  - A finalisation step builds similarity edges, runs Leiden community detection at levels L0–L3, disambiguates entities and writes community summaries.
  - Deduplication uses `(source_id, source_type, unit_id)`, not timestamps.

  [Fact] ([kl-graph/README.md](https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md))
- Verdict: **copy the design** (two-phase ingestion, LLM results cached by content hash, dedup on the source-unit key). **Do not copy code** (ELv2). [Inference]

### 5. Temporal data has multiple clocks

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#5-temporal-data-has-multiple-clocks)

Graphiti distinguishes valid time from transaction time; DBOS stores scheduling and execution time; source data itself has effective timestamps and ingestion timestamps.

**Design implication:** a business fact should carry valid-time bounds, record-time bounds, source-observed time and ingestion time where relevant. Never collapse all timestamps into one `updated_at`.

## Design decisions already in the reference maps

### 7. Temporal facts (four timestamps, invalidation rule) and graph tables in plain PostgreSQL

> Source: [general-references/33-map-context-code-integration.md § 7. Temporal facts (four timestamps, invalidation rule) and graph tables in plain PostgreSQL](../../general-references/33-map-context-code-integration.md#7-temporal-facts-four-timestamps-invalidation-rule-and-graph-tables-in-plain-postgresql)

**Purpose.** Keep "what was true when" for facts extracted from email, notes and calls, and store links that are not in any ledger, without adding a graph database. Receivables example: "Acme's AP contact is Lim" from March; in September an email says Tan took over. The March fact is closed, not overwritten, so "who was the contact when we sent the July reminder?" still has an answer. "We will pay by Friday" becomes a promise whose validity starts when it was said, not on Friday.

**Design to implement.**

Fact edges (Graphiti design, ported to Postgres):
- `facts(org_id, id uuid, group_id, src_node_id, tgt_node_id, name, fact text, fact_embedding vector, episodes uuid[], valid_at, invalid_at, created_at, expired_at, reference_time, attributes jsonb, markings)`. `valid_at`/`invalid_at` are world time; `created_at`/`expired_at` are transaction time; `episodes[]` is provenance [Fact].
- `episodes(org_id, id, source, source_ref, content, valid_at)`: the raw source unit (an email, a call note) [Fact].
- Ingestion with an allow-list of edge types per `(source label, target label)` pair; an edge whose name is not allowed between its endpoints is dropped or renamed to a default (`enforce_edge_type_signatures` [Fact]; neo4j `Pattern` triples are the same idea [Fact]).
- Invalidation, three steps [Fact]:
  1. Fast path: reuse an existing edge with matching endpoints and identical normalised fact text.
  2. Otherwise one small-model LLM call receives duplicate candidates and invalidation candidates with **continuous integer indices** (never UUIDs) and returns `duplicate_facts` and `contradicted_facts`; out-of-range indices are logged and discarded.
  3. Deterministic rule: if the validity windows do not overlap, do nothing; if the old edge started before the new one, set `old.invalid_at = new.valid_at` and `old.expired_at = now()`.
- Future-tense normaliser: regular expressions (will, plans to, scheduled to, by/deadline, until/expires …) so a promise's `valid_at` is the statement time and a soft deadline does not become `invalid_at` [Fact].
- Two-phase ingestion for mailboxes and documents (mycontext, design only): Phase A chunks, stores lineage and embeds with no LLM, so dense and BM25 search work immediately; Phase B runs LLM extraction and caches results per chunk hash so they replay across rebuilds [Fact].
- "Report only confirmed writes" and integer-ID mapping (mem0 [Fact]).

Graph tables (LightRAG `PGTableGraphStorage` design):
- `graph_nodes(org_id, id, label, props jsonb)` and `graph_edges(org_id, src, tgt, label, props jsonb)` with B-tree indexes; node upserts merge properties with `jsonb ||`; edge upserts replace properties and create missing endpoints [Fact].
- LightRAG stores each edge once in canonical order (`src = min(a,b)`, computed in application code because SQL `LEAST` differs under non-C collations) [Fact]. [Inference] Use canonical order only for undirected edges; business links are directed and keep their direction.
- Traversal: a frontier-capped iterative BFS with per-hop filtering and degree ranking in SQL, cost bounded by `max_nodes` [Fact]. [Inference] Default `max_nodes` 200 and 2 hops; permission predicates (section 3) applied at every hop, not after.
- Vectors: pgvector tables keyed `(org_id, id)` with provenance columns (`chunk_ids[]`, `file_path`) as in LightRAG's DDL [Fact].
- [Inference] Ledger-backed object links (Invoice → Customer) stay as ordinary foreign keys in the normalised tables; the generic graph tables hold only owned and extracted links.

**Copies.**
- Document 14, section 8 and "What to copy" 15: Graphiti schema, invalidation, normaliser. https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/edges.py ; https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py ; https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/temporal_edge_utils.py
- Document 14, section 9 and "What to copy" 16: graph in plain Postgres. https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py ; https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/postgres_impl.py
- Document 14, section 16 and "What to copy" 17: two-phase ingestion (design only, ELv2). https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md
- Document 14, section 13: mem0 integer mapping, confirmed writes. https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/main.py
- Document 11, section 14: neo4j `Pattern` allow-list and resolver cascade (exact, fuzzy, semantic). https://github.com/neo4j/neo4j-graphrag-python

**Left out, and why.** Graphiti, KAG/OpenSPG, GraphRAG and HippoRAG as runtime dependencies (Python plus a graph database or heavy batch pipeline; HippoRAG is alpha). Apache AGE/Cypher (LightRAG's other Postgres graph class): extra extension, not needed. mem0 as company memory (user-centric; temporal and decay features not in OSS; PostHog telemetry on by default [Fact]). GraphRAG community reports: optional batch job in version 2.

**Open questions.** Quality of Graphiti's invalidation on Malay/English mixed email was not measured (no benchmarks run). Whether Splink (MIT, Postgres backend) is needed in version 1 for merging duplicate customers across ledgers, or only once a customer runs two ledgers.

### 8. Two-tier knowledge (auto-learned with a score, human-certified overriding)

> Source: [general-references/33-map-context-code-integration.md § 8. Two-tier knowledge (auto-learned with a score, human-certified overriding)](../../general-references/33-map-context-code-integration.md#8-two-tier-knowledge-auto-learned-with-a-score-human-certified-overriding)

**Purpose.** The system learns definitions and habits automatically, but anything a human has certified always wins, and nothing learned silently overwrites the model. Receivables example: the system learns from collectors' behaviour that "overdue" usually means "past due date plus 7 days grace"; the finance controller's certified definition of `overdue_balance` (past due date, no grace) still governs every answer, and the agent mentions the conflict.

**Design to implement.**
- `knowledge_items(org_id, id, tier: learned|modeled, kind: metric_definition|authoritative_source|business_rule|term|memory|instruction, body, source_asset, author, domains[], lineage, authority_score, certification: certified|deprecated|null, owner, scope: global|personal|agent, status, provenance jsonb, created_at)`. [Inference: one table; the fields are Databricks' snippet fields plus OpenAI's memory scopes.]
- **Learned** items are auto-extracted, read-only, and carry source, author, domains, lineage and an authority score. To change one, fix the source or model the concept ("fix the source, not the snippet") [Fact, Databricks].
- **Modeled** items are human-authored definitions (objects, metrics, Pages-style term definitions with domain, owner, synonyms, description, body, related assets) with certification and deprecation tags [Fact, Databricks Pages].
- Conflict rule: modeled and certified knowledge wins; if a conflict cannot be resolved, ask the user (Genie [Fact]). Overlapping definitions from different sources are kept side by side with their source until an owner reconciles them, but assign an owner so they do not live side by side forever (Google, and document 11's warning).
- Authority score: Databricks' OntoRank weighs source authority, certification, author expertise and collaboration closeness, popularity and recency; the formula is not published [Fact/Unverified]. Document 11 warns popularity signals mean little at small scale [Inference]. Version 1 score [Inference]: source type weight (ledger > certified document > SOP document > email > chat) × freshness decay, plus a bonus for an explicit owner; no popularity term.
- Self-improvement gate (Google self-learning enrichment [Vendor claim]): detect ambiguous lookups, ungrounded metrics, missing definitions and rephrased questions from agent traces; find an answer in connected documents; stage a proposal with citations and a confidence score; auto-apply above a threshold (Google's example 85%); anything below the threshold and **every deletion** becomes a change request; log provenance and allow revert. [Inference] In version 1, auto-apply only to the learned tier; promotions to modeled always need a human.
- Memory (OpenAI in-house agent [Fact]): the agent prompts the user to save corrections and non-obvious filters; users can create, edit and delete them; scope global or personal. Memory writes keep provenance and can require confirmation before other agents use them (Salesforce ACE [Vendor claim]). Versioned memory: every change stored as a diff with history, in Postgres rows (letta-code's git-backed memory, design only [Fact]).
- Visibility: learned items inherit permissions from their source assets (Genie [Fact]); never account-wide visibility for items from external sources (Databricks beta hole [Fact]).

**Copies.**
- Document 11, section 3 and "What to copy" 7: learned versus modeled, authority, fix-the-source. https://docs.databricks.com/aws/en/genie/genie-ontology ; https://databricks.com/blog/announcing-ga-genie-ontology ; https://docs.databricks.com/aws/en/uc-semantics/pages
- Document 11, section 6 and "What to copy" 9: confidence-gated proposals, change requests. https://cloud.google.com/blog/products/data-analytics/knowledge-catalog-self-learning-context-enrichment-for-ai-agents
- Document 11, section 7: memory with global/personal scope. https://openai.com/index/inside-our-in-house-data-agent/
- Document 11, section 8: ACE memory provenance and confirmation. https://www.salesforce.com/blog/?p=157012
- Document 14, section 15: versioned memory. https://github.com/letta-ai/letta-code (memory-filesystem.ts)

**Left out, and why.** OntoRank popularity and collaborator signals (no usage volume at this size). Workday-directory weighting of close collaborators (version 2 if ever).

**Open questions.** Whether learning from traces that contain Xero data counts as "contributing to an AI model" under Xero's terms (see Contradictions). The right auto-apply threshold for a finance domain.

### 7. Context and memory design (MyContext): fact nodes with provenance, stable source ids, three-state merge

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 7. Context and memory design (MyContext): fact nodes with provenance, stable source ids, three-state merge](../../general-references/31-map-lingyang-alibaba-offers.md#7-context-and-memory-design-mycontext-fact-nodes-with-provenance-stable-source-ids-three-state-merge)

**Purpose.** Turn emails, notes and call logs about customers into structured, cited facts, and merge human and machine knowledge without letting the machine overwrite people. Receivables example: a customer emails "we will pay on 30 November"; that becomes a fact of type REQUEST or STATUS linked to the email, which proposes a PromiseToPay; if the collector has already typed a different date, the collector's value stays and the conflict goes to review.

**Design to implement.**
- **Source-unit identity.** Key every raw record by `(source_id, source_type, unit_id)` plus `content_hash` [Fact, 08 §6].
  - Same hash: skip.
  - Different hash: MyContext warns and skips, with replacement still a TODO [Fact, 08 §6]; this product should flag for re-extraction (08 What to copy 1).
  - No timestamp watermark, so late messages with old timestamps are still processed [Fact, 08 §6].
  - A scan that no longer finds a unit does not delete it [Fact, 08 §6].
- **Chunks versus extraction items.** Chunks are the only content node; a unit-to-chunk table maps many-to-many with ordinals and half-open character spans [Fact, 08 §6]. Each extraction item has exactly one primary chunk, validated before writing; a fact is created once with one `STATES` edge to every evidence chunk [Fact, 08 §6].
- Chunking modes `session` (idle-gap slices), `fixed_size` (never crossing a session break), `none`; extraction modes `message`, `chunk`, `document`; invalid pairings fail fast [Fact, 08 §6]. For email threads, use `message` extraction with neighbours as read-only context, and move quoted replies into context so they are not asserted again [Fact, 08 §6].
- **Fact node** [Fact, 08 §6]: `text`, `fact_type`, `timestamp`, `confidence` (default 0.8), `subject_entity_id`, `object_entity_id`, `source_chunk_id`, `source_unit_id`, `extraction_item_id`.
  - Fact types: DECISION, DELEGATE, REQUEST, ACTION_ITEM, STATUS, CAUSAL, OPINION, GENERAL.
  - REQUEST and ACTION_ITEM have fixed roles (subject requester, object recipient), and an ask to N people is N facts.
  - [Inference] Add receivables-specific mapping: a fact that names an amount and date from a customer contact becomes a *candidate* PromiseToPay, never a PromiseToPay directly; the action `log_promise` (section 12) creates the object after approval.
- **Scope ids.** Deterministic UUID5 from canonical JSON `["scope", source_type, native_id]` [Fact, 08 §6]. Use for email threads and customer accounts.
- **Entity records** [Fact, 08 §6]: name, type, first and last seen, mention count, description, `quality_status` (active or quarantined). Optional LLM cleanup may only answer KEEP, RETYPE or reversible QUARANTINE, never rename or merge [Fact, 08 §6]. [Inference] In this product, contact persons resolve to the Contact object by email address first; the LLM never merges customers.
- **Extraction cache key** includes item id, model, prompt version, strategy version and schema version; prompt language is part of the prompt version; batch size defaults to 5; exhausted items make the run `partial`, never empty [Fact, 08 §6].
- **Three-state merge** for human-editable business facts (contact preferences, agreed payment terms, owner of an account), copied from `merger.ts` [Fact, 08 §6]:
  - row key `(facet, scope, scope_ref, key)`; fields `value_json`, `confidence`, `evidence_json` (≤50 ids, newest first), `source in {llm, stat, user}`, `conflict_json`, `revision`;
  - a `user` row is never overwritten by a non-user candidate;
  - numeric facets combine by evidence-weighted average, confidence +0.05 capped at 0.95;
  - equal value = **confirm**: keep value, confidence +0.05 capped at 0.98, merge evidence;
  - array superset = **supplement**: take the new value, keep the higher confidence;
  - anything else = **conflict**: keep both in `conflict_json`, confidence becomes max(0.2, min(old, new) − 0.15), and a human decides;
  - comparison is structural JSON equality, never an LLM.
- **Materialisation thresholds** [Fact, 08 §6]: drop rows below confidence 0.5; flag rows below 0.65 as thin evidence. Agents must say "thin evidence" when citing such a row [Inference].
- **Collection scope per data domain** [Fact, 08 §6]: a compile-time-required default per domain (MyContext: chat collect-nothing, docs and minutes collect-all, contacts collect-nothing); scope re-read every run, never cached. [Inference] Here: the AR mailbox collect-all; personal mailboxes collect-nothing; enforce with a TypeScript `Record<Domain, Scope>` so a new domain without a default fails the build.
- **Connector rules** [Fact, 08 §6]: exact-command allow-lists, never prefix; PII commands never allowed; anything else throws FORBIDDEN; unreadable sources recorded as "unreadable", not as zero; pagination fully drained; stay inside the chosen time bound.
- **Agent never sends** [Fact, 08 §6]: MyContext's persona agent has no send tool; `draft_reply` is its endpoint; sending goes through a four-layer SendGuard (dry-run short-circuit; re-read approved draft and compare content hash; idempotency key; the source app's own authorisation). Grants are typed `once | session | timed | permanent`, local TTL only an optimisation, and a permission error revokes the grant and downgrades to drafting. Copy all four layers for outbound reminders [Inference for the mapping].
- **Retrieval** [Fact, 08 §6]: hybrid BM25 plus vector fused by RRF with k=60, keeping per-route ranks for citations; callers can pass a structured `intent` to skip a rewrite call; answer synthesis off by default. `/context` returns a fact with its source chunk and surrounding messages; `/requests` and `/todos` answer "what is on my plate today" with a query in the user's IANA time zone. [Inference] Use Postgres full-text search plus a vector column; the documents do not cover pgvector.
- Refresh policy: MyContext re-extracts the work profile only after 200 new messages or 3 days with new data, with backoff [Fact, 08 §6]. Use as a cost control for customer summaries [Inference].

**Copies.**
- 08, §6 MyContext ingestion and identity, entity and fact model, conflict resolution, storage, retrieval API, agent access. https://github.com/openTrinity/mycontext (`kl-graph/docs/graph-design.md`, `query-api.md`, `kl_graph/models/types.py`, `packages/distill/src/reduce/merger.ts`, `packages/store/src/domain-scope.ts`, `packages/channels/src/plugins/dingtalk/cli.ts`, `packages/persona/src/send-guard.ts`, `grant-manager.ts`, `packages/retrieval/src/fuse.ts`)
- 08, What to copy 1 to 8 and 15.

**Left out, and why.**
- MyContext code: Elastic License 2.0 forbids offering it as a hosted service; copy the design only [Fact, 08 What cannot be copied].
- Its single-user permission model: an organisation model needs RLS and roles [Fact, 08].
- The graph layer's `CONTRADICTS` and `ENTAILS` edges: defined but never populated [Fact, 08 §6].
- Leiden communities and GraphRAG global search (off by default in MyContext): not needed for per-customer context [Inference].
- Local-first storage: the product is multi-tenant SaaS (25 row 37).

**Open questions.** Which inbound channels exist at the target customers (shared AR mailbox, WhatsApp Business) determines the first collectors; the documents do not survey this.

### 8. Knowledge-base defaults and memory store (Bailian)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 8. Knowledge-base defaults and memory store (Bailian)](../../general-references/31-map-lingyang-alibaba-offers.md#8-knowledge-base-defaults-and-memory-store-bailian)

**Purpose.** Retrieve from policy documents and contracts with known, tunable defaults, and give agents a durable scratch memory that is versioned. Receivables example: the customer's credit policy PDF is chunked at 512 tokens by heading; the collections agent's memory file `/accounts/acme/notes.md` records "prefers WhatsApp; AP clerk is Siti", with every edit versioned.

**Design to implement.**
- **Chunking defaults** [Fact, 08 §2]: smart split default; max chunk 600 tokens (range 10 to 6,000); recommended FAQ 256 by length, manual 600 smart split, long report 2,048 smart split, contract 512 by heading. Chunks listable, updatable, deletable by API.
- **Retrieval** [Fact, 08 §2]: optional query rewrite; vector TopK and keyword TopK each 1 to 100; rerank (qwen3-rerank family or none); max recall 1 to 20 globally and per source; similarity threshold per source 0.01 to 1.0; at most 15 knowledge bases per retrieval service, each weighted; lowering initial TopKs reduces rerank cost. Fusion formula undocumented [Unverified]; use RRF k=60 from section 7.
- **Metadata** [Fact, 08 §2]: at most 5 fields per knowledge base, English letters and underscores; value methods constant, variable, LLM, regex, keyword; two flags per field ("use in retrieval", "use in answer"). Receivables fields: `customer_id`, `doc_type`, `effective_date`, `entity`, `language` [Inference].
- **Do not lock at creation.** Bailian locks metadata (and per one page chunking and embedding) at creation; version index configurations and rebuild in the background instead [Fact for the lock and the advice, 08 §2 and What to copy 17].
- **KB call mode**: "always" (search before first inference) or "intelligent" (model decides) [Fact, 08 §3]. Use "always" for the collections agent's policy KB, so the dunning policy is always in context [Inference].
- **Memory store** [Fact, 08 §4]:
  - path-addressed UTF-8 files, ids `mem_`, store ids `memstore_`; max 102,400 bytes per file;
  - every create, modify or delete makes a version; versions listable; "redact" erases a version's body permanently;
  - optimistic `content_sha256` precondition, conflict on mismatch;
  - mounts fixed at session creation, `read_only` or `read_write`, at most 8 per session, each with `instructions` (≤4,096 characters) saying when to search;
  - access only through Glob, Grep, Read, Write, Edit; shell cannot reach memory paths;
  - listing filters by path only; archiving irreversible;
  - credentials must not be stored in memory.
  - [Inference] Implement as a Postgres table `memory_file (tenant_id, store_id, path, version, body, sha256, redacted)` under RLS, with tools that mirror those five operations. Mount the per-customer store read-write for the collections agent and the tenant policy store read-only.
- **Memory service option** [Fact, 08 §4]: fact memory, skill memory and schema-driven user profiles (`name`, `description`, `attributes[]`); extraction asynchronous, so the first read may be empty; conflict rules undocumented. [Inference] Do not copy the service; the three-state merge (section 7) covers profile facts with documented rules.
- **Agent definitions** [Fact, 08 §3]: every save increments `version`; a session pins the version it started with; updates are full replacements guarded by an optimistic lock; agents can be archived, not deleted; publishing shows a diff and allows rollback (Agent 2.0). ReAct loop capped at 1 to 50 rounds; short-term memory 0 to 30 turns.
- **Evaluation sets** [Fact, 08 §3]: types agent, workflow, trajectory (`input`, `reference_output`, `trajectory`), custom; up to 10 versions kept; must be published before use; column types frozen once data exists. Copy for the per-tenant test set (25 row 25).
- **Tool approval**: "always allow" or "ask each time" [Fact, 08 §3].
- **Credential placeholders**: `${variable}` substituted by the gateway only for configured domains and only in the Authorization header [Fact, 08 §3]. Copy for the accounting-system and email API keys [Inference].

**Copies.**
- 08, §2 KB and RAG pipeline. https://help.aliyun.com/zh/model-studio/rag-knowledge-base ; https://help.aliyun.com/zh/model-studio/rag/chunking ; https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval
- 08, §3 Agent 2.0, evaluation, managed agents. https://help.aliyun.com/zh/model-studio/new-single-agent-application ; https://help.aliyun.com/zh/model-studio/agenteval-evaluation-set ; https://help.aliyun.com/zh/model-studio/managed-agents-agent-definition ; https://help.aliyun.com/document_detail/2679100.html
- 08, §4 memory store and memory service. https://help.aliyun.com/zh/model-studio/managed-agents-memory-store ; https://help.aliyun.com/zh/model-studio/long-term-memory-2-0 ; https://docs.agent.bailian.aliyun.com/zh/memory/user-profile

**Left out, and why.** Image, audio and video knowledge bases; the "visual understanding" no-chunk mode; Bailian's hosted vector storage (stack is Postgres) [Inference]. The "Dreaming" post-session consolidation [Fact that it exists, 08 §4]: no documented mechanics.

**Open questions.** Bailian's default TopN and threshold values were not found [Unverified, 08 Open questions]; start values must be chosen by testing.

## Earlier engineering notes (Phase 2)

### Temporal facts

> Source: former `04-knowledge-engine/knowledge-graph-and-retrieval.md` (moved here in the Nov 2026 restructure)

Adopt Graphiti's four-time distinction as a candidate pattern: `valid_at`, `invalid_at`, `recorded_at/created_at`, `expired_at/superseded_at`. Add source observation and ingestion time where needed. Conflicting facts should close/revise their valid interval with an audit trail, not silently overwrite the previous statement.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Edge time fields (Graphiti 0.32.1, code):** `valid_at`, `invalid_at` ("soft deadlines are not invalid_at"), `expired_at`, `reference_time` in [`getzep/graphiti` → `graphiti_core/edges.py`](https://github.com/getzep/graphiti/blob/343a7bb/graphiti_core/edges.py); deterministic close-out in `resolve_edge_contradictions` ([`getzep/graphiti` → `graphiti_core/utils/maintenance/edge_operations.py`](https://github.com/getzep/graphiti/blob/343a7bb/graphiti_core/utils/maintenance/edge_operations.py)). Port the four timestamps and the rule into Postgres.
- **mem0 2.2.1 (code):** `MEM0_TELEMETRY` still defaults to `True` and posts to PostHog ([`mem0ai/mem0` → `mem0/memory/telemetry.py`](https://github.com/mem0ai/mem0/blob/cae3d8c/mem0/memory/telemetry.py)) — set it off if it is ever used.

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed (code)** — Graphiti four-timestamp edges and `resolve_edge_contradictions`; mem0 telemetry still on by default.

## Gaps

- No palantir material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
