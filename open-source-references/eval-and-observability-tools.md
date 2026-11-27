# tau-bench, tau2-bench, Langfuse, promptfoo, Phoenix

| | |
|---|---|
| **Repository** | <https://github.com/sierra-research/tau2-bench>, <https://github.com/langfuse/langfuse> |
| **Why it matters** | tau2-bench defines action-level agent evaluation precisely; Langfuse/Phoenix/promptfoo are the tracing and regression options. |
| **What to take** | tau2's reward = database end-state match × communicated-info check, reported as pass^k; promptfoo in CI. |
| **What not to copy** | Langfuse's four-service self-host footprint for a one-person build; Phoenix server is ELv2. |
| **Feeds** | [08-agent-platform/evaluation-and-simulation](../engineering/08-agent-platform/evaluation-and-simulation.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:**  - Copy tau2's reward design for your own action evaluations: seed the database, replay the reference actions to get a target state, compare end states, run k trials. - Use promptfoo (MIT) in CI for prompt and tool regression. - For traces, either emit OpenTelemetry and self-host Phoenix (ELv2 is fine for internal use, [Inference]), or write traces to your own Postgres table. Langfuse self-hosting is a four-service footprint. [Inference]

> **Source re-check 28 Nov 2026 (code):** [`sierra-research/tau2-bench@768f3d8`](https://github.com/sierra-research/tau2-bench/tree/768f3d8) — structures cited below verified present; no licence change.

> **Source re-check 28 Nov 2026 (code):** Langfuse `8109ce5` 4.88.0 — MIT core, commercial code in `web/src/ee` and `worker/src/ee`; self-host = langfuse-web, langfuse-worker, langfuse-ai-gateway, ClickHouse, MinIO, Redis, Postgres. Phoenix `2676de0` 22.1.0, ELv2. promptfoo `4850744` 0.126.0, MIT.

## From the open-source code study: 29. Evaluation and observability: tau-bench, tau2-bench, Langfuse, promptfoo, Phoenix

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- **tau2-bench**: MIT, Python, version 2.0.0, last commit 2026-11-10. Domains: airline, retail, telecom, banking_knowledge, intake and mock. Each domain has `policy.md`, `db.json`, `tasks.json` and `tools.py`, with tools decorated `@is_tool(ToolType.READ|WRITE|GENERIC)`. The task reward is the product of the components in `reward_basis`:
  - `DB`: the end state matches the result of replaying the reference actions, so any path that produces an equivalent state passes. This is the default together with COMMUNICATE.
  - `ENV_ASSERTION`.
  - `NL_ASSERTION`: LLM-judged, experimental.
  - `ACTION`: an exact trajectory, used only in some banking tasks.
  - `COMMUNICATE`: required strings appear in the agent's messages.

  The `pass_hat_k` metric is in `metrics/agent_metrics.py`. [Fact] ([data_model/tasks.py](https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py)). The original tau-bench is MIT (last commit 2026-03-18). [Fact]
- **Langfuse**: the core is MIT; `ee/`, `web/src/ee/` and two other `ee` directories fall under a commercial licence (audit-log viewer, admin API, multi-tenant SSO, UI customisation, verified domains, and more). Copyright belongs to "ClickHouse, Inc.". Version 4.83.0. Self-hosting needs Postgres, ClickHouse, Redis and MinIO/S3 (`docker-compose.yml`), plus a new `langfuse-ai-gateway` service. [Fact] ([LICENSE](https://github.com/langfuse/langfuse/blob/HEAD/LICENSE), [docker-compose.yml](https://github.com/langfuse/langfuse/blob/HEAD/docker-compose.yml))
- **Phoenix**: the server is ELv2 (version 22.0.0) on SQLite or Postgres. Its JS client packages are Apache-2.0. [Fact]
- **promptfoo**: MIT, TypeScript, version 0.126.0. [Fact]
- Verdict:
  - Copy tau2's reward design for your own action evaluations: seed the database, replay the reference actions to get a target state, compare end states, run k trials.
  - Use promptfoo (MIT) in CI for prompt and tool regression.
  - For traces, either emit OpenTelemetry and self-host Phoenix (ELv2 is fine for internal use, [Inference]), or write traces to your own Postgres table. Langfuse self-hosting is a four-service footprint.

  [Inference]
