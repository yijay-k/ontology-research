# Claude Agent SDK (TypeScript and Python)

| | |
|---|---|
| **Repository** | <https://github.com/anthropics/claude-agent-sdk-typescript>, <https://github.com/anthropics/claude-agent-sdk-python> |
| **Why it matters** | Shows a mature hook and permission surface for agent tool use. |
| **What to take** | Hook taxonomy, allow/deny-with-rewrite permission results, the SessionStore contract with a Postgres reference store. |
| **What not to copy** | Building the core agent loop on it — commercial terms and Claude-only, while the product must run GPT and Qwen. |
| **Feeds** | [08-agent-platform/agent-loop-and-runtime](../engineering/08-agent-platform/agent-loop-and-runtime.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the design** (the hook taxonomy, allow/deny-with-rewrite, the session-store contract). **Do not build the core agent loop on it**, because the product must run GPT and Qwen as well. [Inference]

> **Source re-check 28 Nov 2026 (code):** TS `e774912` still "all rights reserved" (Commercial Terms); Python `6c1b03f` 0.2.189, MIT wrapper. Hook events now include **SessionStart** in addition to the ten listed below.

## From the open-source code study: 21. Claude Agent SDK (TypeScript and Python)

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- TypeScript: `LICENSE.md` states all rights reserved, with use governed by Anthropic's Commercial Terms of Service. The repository holds only examples and a changelog. Version 0.3.329 ("parity with Claude Code v2.1.329"), last commit 2026-11-19. [Fact] ([LICENSE.md](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/LICENSE.md), [CHANGELOG.md](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/CHANGELOG.md))
- Python: the wrapper code is MIT, but its README says use is governed by the Commercial Terms. Version 0.2.186. It bundles the CLI under `_bundled`. [Fact]
- Surfaces worth copying:
  - Hook events: PreToolUse, PostToolUse, PostToolUseFailure, UserPromptSubmit, Stop, SubagentStop, PreCompact, Notification, SubagentStart and PermissionRequest.
  - Permission results: `allow` with `updated_input`/`updated_permissions`, and `deny` with `message`/`interrupt`.
  - A `SessionStore` interface, with a Postgres reference store holding one JSONB row per transcript entry, ordered by BIGSERIAL and keyed by `(project_key, session_id, subpath)`.

  [Fact] ([types.py](https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py), [PostgresSessionStore.ts](https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts))
- Verdict: **copy the design** (the hook taxonomy, allow/deny-with-rewrite, the session-store contract). **Do not build the core agent loop on it**, because the product must run GPT and Qwen as well. [Inference]
