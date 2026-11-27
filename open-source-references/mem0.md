# mem0ai/mem0

| | |
|---|---|
| **Repository** | <https://github.com/mem0ai/mem0> |
| **Why it matters** | Widely used agent-memory library; shows extraction/dedup pipeline tricks. |
| **What to take** | Integer-ID mapping so the LLM never sees UUIDs; report only writes the store confirmed. |
| **What not to copy** | It as company memory: user-centric scoping, temporal features paywalled, telemetry on by default. |
| **Feeds** | [06-knowledge-and-evidence/temporal-facts-and-memory-store](../engineering/06-knowledge-and-evidence/temporal-facts-and-memory-store.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **ignore as a dependency** for company memory. It is user-centric (scoped by user_id, agent_id and run_id), the temporal features are paywalled, and telemetry is on by default. **Copy** the integer-ID mapping trick and the "report only confirmed writes" rule. [Inference]

> **Source re-check 28 Nov 2026 (code):** [`mem0ai/mem0@cae3d8c`](https://github.com/mem0ai/mem0/tree/cae3d8c) — v2.2.1; telemetry still on by default.

## From the open-source code study: 13. mem0

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

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
