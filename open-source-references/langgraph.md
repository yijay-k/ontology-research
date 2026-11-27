# LangGraph (Python and JS)

| | |
|---|---|
| **Repository** | <https://github.com/langchain-ai/langgraphjs> |
| **Why it matters** | Model-agnostic TypeScript agent graph framework with a Postgres checkpointer and interrupts for human review. |
| **What to take** | The checkpoint / blob / writes table split if persisting agent state yourself; interrupt-and-resume for human-in-the-loop. |
| **What not to copy** | Making it mandatory — a hand-written loop is simpler for generated tools. |
| **Feeds** | [08-agent-platform/agent-loop-and-runtime](../engineering/08-agent-platform/agent-loop-and-runtime.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **optional dependency** (model-agnostic, TypeScript, Postgres checkpointer). A hand-written loop over the provider SDKs is simpler for a generated-tool architecture. Copy the checkpoint/blob/writes split if you persist agent state yourself. [Inference]

## From the open-source code study: 23. LangGraph (Python and JS)

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- MIT. Python last commit 2026-11-20. JS: `@langchain/langgraph` 1.0.47 and core 1.7.5; `langgraph-api` is also MIT. [Fact]
- The Postgres checkpointer (`libs/checkpoint-postgres/src/migrations.ts`) has three tables:
  - `checkpoints(thread_id, checkpoint_ns, checkpoint_id, parent_checkpoint_id, type, checkpoint JSONB, metadata JSONB)`.
  - `checkpoint_blobs(thread_id, ns, channel, version, type, blob BYTEA)`.
  - `checkpoint_writes(thread_id, ns, checkpoint_id, task_id, idx, channel, type, blob)`.

  Human-in-the-loop is `interrupt(value)` inside a node, resumed with a command. [Fact] ([migrations.ts](https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts), [interrupt.ts](https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/langgraph-core/src/interrupt.ts))
- Verdict: **optional dependency** (model-agnostic, TypeScript, Postgres checkpointer). A hand-written loop over the provider SDKs is simpler for a generated-tool architecture. Copy the checkpoint/blob/writes split if you persist agent state yourself. [Inference]
