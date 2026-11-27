# letta-ai/letta

| | |
|---|---|
| **Repository** | <https://github.com/letta-ai/letta> |
| **Why it matters** | Reference for versioned, diff-tracked agent memory. |
| **What to take** | A memory store where every change is a diff with history (in Postgres rows, not git); per-path memory constraints. |
| **What not to copy** | The archived V1 Python server; letta-code as a dependency. |
| **Feeds** | [06-knowledge-and-evidence/temporal-facts-and-memory-store](../engineering/06-knowledge-and-evidence/temporal-facts-and-memory-store.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the design** of a versioned memory store (every memory change is a diff with history), but in Postgres rows rather than git. **Ignore** as a dependency. [Inference]

## From the open-source code study: 15. Letta (letta-ai/letta and letta-code)

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- `letta-ai/letta` `main` (last commit 2026-10-18) is now a landing page. Its AGENTS.md says the V1 Python server lives on an `archive` branch, is unsupported, and should not be used for production, benchmarks or comparisons. [Fact] ([AGENTS.md](https://github.com/letta-ai/letta/blob/HEAD/AGENTS.md))
- `letta-ai/letta-code`: Apache-2.0, TypeScript (about 647k lines), version 0.34.67, last commit 2026-11-20. It includes channels (Slack, Telegram, Discord), cron, approval execution and recovery, and "git-backed memory" (`src/agent/memory-filesystem.ts`). `memory-constraints.ts` validates memory trees against read-only globs and size limits per changed path. [Fact]
- Verdict: **copy the design** of a versioned memory store (every memory change is a diff with history), but in Postgres rows rather than git. **Ignore** as a dependency. [Inference]
