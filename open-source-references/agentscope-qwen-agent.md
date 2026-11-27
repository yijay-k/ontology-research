# AgentScope and Qwen-Agent (Alibaba)

| | |
|---|---|
| **Repository** | <https://github.com/agentscope-ai/agentscope> |
| **Why it matters** | Alibaba's agent frameworks; AgentScope's SOP module is a close analogue of Lingyang-style SOP agents. |
| **What to take** | SOPStep(executor, verifier, max_attempts) with run state that outlives the process; permission rules with updated_input. |
| **What not to copy** | Either as a dependency in a TypeScript build. |
| **Feeds** | [08-agent-platform/agent-loop-and-runtime](../engineering/08-agent-platform/agent-loop-and-runtime.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the SOP executor/verifier/max_attempts structure** for multi-step agent procedures, a close analogue of what Lingyang-style "SOP agents" describe [Inference]. Ignore both as dependencies in a TypeScript build. Qwen's fncall templates matter only if you call Qwen models without native tool calling. [Inference]

## From the open-source code study: 24. AgentScope (Alibaba Tongyi) and Qwen-Agent

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- AgentScope: Apache-2.0, Python, version 2.0.13dev, last commit 2026-11-20. Three modules matter:
  - The `sop` module defines a procedure as an ordered list of `SOPStep(subject, description, executor, verifier?, max_attempts=3)`. Each attempt is "work, then judgement"; run state (`SOPRunState`) outlives the process; a user interrupt parks the step without spending an attempt. [Fact] ([sop/_schema.py](https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py))
  - The `permission` module defines rules `PermissionRule(tool_name, rule_content, behavior, source)` and decisions with `updated_input`, `suggested_rules` and `bypass_immune`. [Fact]
  - Middleware covers budget, a model router, RAG, steering and long-term memory. [Fact]
- Qwen-Agent: Apache-2.0, Python, version 0.0.34, last commit 2026-03-04 (slowing). It has Qwen-specific and Nous-style function-calling prompt templates (`llm/fncall_prompts/`), DashScope and OpenAI-compatible clients, and an MCP manager. [Fact]
- Verdict: **copy the SOP executor/verifier/max_attempts structure** for multi-step agent procedures, a close analogue of what Lingyang-style "SOP agents" describe [Inference]. Ignore both as dependencies in a TypeScript build. Qwen's fncall templates matter only if you call Qwen models without native tool calling. [Inference]
