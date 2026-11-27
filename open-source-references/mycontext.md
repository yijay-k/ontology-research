# openTrinity/mycontext

| | |
|---|---|
| **Repository** | <https://github.com/openTrinity/mycontext> |
| **Why it matters** | Alibaba-ecosystem work-context layer with DingTalk/Feishu ingestion and a two-phase knowledge graph build. |
| **What to take** | Two-phase ingestion (cheap index first, LLM extraction later, cached per chunk), dedup on the source-unit key. |
| **What not to copy** | Code (Elastic License 2.0 forbids offering it as a service); personal, not organisational, scope. |
| **Feeds** | [06-knowledge-and-evidence/temporal-facts-and-memory-store](../engineering/06-knowledge-and-evidence/temporal-facts-and-memory-store.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the design** (two-phase ingestion, LLM results cached by content hash, dedup on the source-unit key). **Do not copy code** (ELv2). [Inference]

## From the open-source code study: 16. openTrinity/mycontext

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- **Elastic License 2.0** (SPDX `Elastic-2.0`, which forbids offering the software as a hosted or managed service), TypeScript plus Python, last commit 2026-08-31, labelled "developer preview" with breaking changes promised. The 3.4M Python line count is mostly a vendored runtime (`vendor/`, 407 MB). [Fact] ([LICENSE](https://github.com/openTrinity/mycontext/blob/HEAD/LICENSE), [README](https://github.com/openTrinity/mycontext/blob/HEAD/README.md))
- It is a personal (not organisational) work-context layer. Source plugins exist for `dingtalk` and `feishu` (`packages/channels/src/plugins/`) over a local SQLite vault. Sending and deleting require explicit confirmation. [Fact]
- `kl-graph`, its spatio-temporal knowledge graph, ingests in two phases:
  - **Phase A** chunks new source units, persists lineage and embeds the chunks, with no LLM. Dense and BM25 search work immediately.
  - **Phase B** runs LLM entity and fact extraction and caches results *per chunk* in a separate `extraction_cache.db`, so they can be replayed across database rebuilds.
  - A finalisation step builds similarity edges, runs Leiden community detection at levels L0–L3, disambiguates entities and writes community summaries.
  - Deduplication uses `(source_id, source_type, unit_id)`, not timestamps.

  [Fact] ([kl-graph/README.md](https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md))
- Verdict: **copy the design** (two-phase ingestion, LLM results cached by content hash, dedup on the source-unit key). **Do not copy code** (ELv2). [Inference]
