# Model Context Protocol (spec and SDKs)

| | |
|---|---|
| **Repository** | <https://github.com/modelcontextprotocol/modelcontextprotocol>, <https://github.com/modelcontextprotocol/typescript-sdk> |
| **Why it matters** | The standard interface for exposing ontology tools to external agents; the 2026-07-28 revision is stateless. |
| **What to take** | TypeScript SDK v2; tool annotations (readOnly/destructive/idempotent/openWorld); actor and tenant in auth, not session. |
| **What not to copy** | Assumptions from older MCP versions (sessions, initialize handshake, server-initiated sampling). |
| **Feeds** | [08-agent-platform/mcp-servers](../engineering/08-agent-platform/mcp-servers.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **adopt `@modelcontextprotocol/server` v2** as the external agent interface. Statelessness suits generated tools well: put the actor and tenant in auth, not in session state. [Inference]

> **Source re-check 28 Nov 2026 (code):** [`modelcontextprotocol/typescript-sdk@5ee54ee`](https://github.com/modelcontextprotocol/typescript-sdk/tree/5ee54ee), [`modelcontextprotocol/modelcontextprotocol@024d525`](https://github.com/modelcontextprotocol/modelcontextprotocol/tree/024d525) — Spec 2026-07-28 still latest; SDK packages 2.4.0.

## From the open-source code study: 22. Model Context Protocol (spec and SDKs)

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- Spec repository: licensing is moving from MIT to Apache-2.0 for new contributions; docs are CC-BY-4.0. Schema versions present: 2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25, 2026-07-28 and draft. [Fact] ([LICENSE](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/LICENSE))
- 2026-07-28 major changes:
  - Protocol-level sessions and the `Mcp-Session-Id` header are removed; servers mint explicit handles passed as tool arguments.
  - The initialize handshake is removed; each request carries its protocol version and client capabilities in `_meta`.
  - A mandatory `server/discover` RPC is added.
  - `subscriptions/listen` replaces GET and resource subscribe.
  - `ping` and `logging/setLevel` are removed.
  - Tasks move to an extension that is polled with `tasks/get`.
  - MRTR replaces server-initiated `sampling`/`elicitation`/`roots`, and every result now carries `resultType`.
  - SSE resumability is removed.

  Minor changes include deterministic `tools/list` ordering (for prompt-cache hits), required `ttlMs`/`cacheScope` on list results, OpenTelemetry `traceparent` in `_meta`, and JSON Schema 2020-12 for tool schemas. Roots, Sampling and Logging are deprecated. [Fact] ([changelog.mdx](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx))
- Tool annotations in `schema/2026-07-28/schema.ts`: `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. [Fact]
- TypeScript SDK: `main` is v2, published as `@modelcontextprotocol/server` and `@modelcontextprotocol/client` 2.4.0 (Apache-2.0), implementing 2026-07-28. v1.x (`@modelcontextprotocol/sdk`) receives fixes for at least six months after the v2 release on 2026-07-27. [Fact] ([README](https://github.com/modelcontextprotocol/typescript-sdk/blob/HEAD/README.md))
- Verdict: **adopt `@modelcontextprotocol/server` v2** as the external agent interface. Statelessness suits generated tools well: put the actor and tenant in auth, not in session state. [Inference]
