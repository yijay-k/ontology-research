# gura105/operational-ontology

| | |
|---|---|
| **Repository** | <https://github.com/gura105/operational-ontology> |
| **Why it matters** | The clearest small implementation of the action gate: model as data, preconditions, dry run in a rolled-back transaction, writeback before local commit, audit of every attempt. |
| **What to take** | Zod model definitions; the fixed execution order; ownership of each field (source / ontology / derived); generated MCP tools with no raw-SQL or generic-update tool. |
| **What not to copy** | SQLite store, single writer, no idempotency keys or pending-invocation record, fail-open visibility. A learning resource, not a dependency. |
| **Feeds** | [05-actions-and-rules/action-gate-and-transactions](../engineering/05-actions-and-rules/action-gate-and-transactions.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the design.** It is the most honest small statement of the pattern. Do not depend on it. To make it production-grade, add Postgres, real identity, fail-closed visibility, idempotency keys, an outbox/pending-invocation record, and asynchronous write-back on a durable workflow. [Inference]

> **Source re-check 28 Nov 2026 (code):** [`gura105/operational-ontology@cd8dea3`](https://github.com/gura105/operational-ontology/tree/cd8dea3) — v0.6.3; still no idempotency keys or pending-invocation record.

## From the open-source code study: 1. gura105/operational-ontology: the action gate, implemented

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

Plain-English explanation: imagine an "Order" object that is assembled from two ERPs. An agent may only change an order by calling a named action such as `cancelOrder(orderId, reason)`. The action checks its rule ("a shipped order cannot be cancelled"), describes the change it wants to make, writes that change to the ERP first, then commits locally. It records the attempt whether it succeeded or not.

- Licence and maturity: MIT. TypeScript on Node 24+. Four source files (`src/core.ts` 1,200 lines, `src/query.ts` 170, `src/mcp.ts` 237, `src/index.ts` 49), with tests and five example domains (orders, finance, hospital, factory, recall). Last commit 2026-11-19. The README says it is a learning resource, not a framework or an npm dependency. [Fact] ([README](https://github.com/gura105/operational-ontology/blob/HEAD/README.md))
- Data model. `defineObject({primaryKey, properties: ZodRawShape, owned?, visibility?, source?})` defines an object type; `owned` is either `true` (the whole type is ontology-owned) or a map from property name to default value (ontology-owned properties on a row that otherwise comes from a source). `defineLink({from, to, kind: 'one-to-many'|'many-to-many', owned?, via?})` defines a link type. `defineAction({object, targetParam, params, preconditions[], effects(), writeback?})` defines an action. `defineFunction({params, run})` defines a read-only named query. [Fact] ([core.ts](https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts))
- Edits are data. There are four edit types: `modify`, `create`, `link` and `unlink`. Deletes are deliberately out of scope. Preconditions return `reject(code, message)`, a machine-readable refusal with a `Violation {code, message}` shape. [Fact]
- Storage (SQLite in the reference). There are four tables. `objects(type, pk, data)` holds object rows. `links(name, from_pk, to_pk)` holds link instances. `overlay(type, pk, patch)` holds ontology-owned patches that are reapplied after a source re-index. `audit_log(seq, ts, actor, action, target, params, status CHECK IN ('applied','rejected'), error, edits)` holds every attempt. [Fact] (core.ts, Runtime constructor)
- Execution flow:
  1. Parse the params with Zod.
  2. Load the target object.
  3. Run the preconditions.
  4. Compute the effects.
  5. Run a preflight: apply the edits inside a transaction that always throws `Rollback`, so the commit's own code validates them and there is no second validator to drift.
  6. Check authority. An edit plan that touches source-backed state requires `writeback: true`, a plan touching only ontology-owned state forbids it, and a plan that mixes both is refused.
  7. Call `WritebackAdapter.apply(edits, {action, actor, target})` *before* the local commit.
  8. Commit the edits and the audit entry together in one transaction.
  9. On failure, audit the attempt as `WRITEBACK_FAILED`, `COMMIT_FAILED` or `EXECUTION_CRASHED`.

  [Fact] ([docs/IMPLEMENTATION.md](https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md), "Failure semantics in detail")
- Stated limits. There are no idempotency keys. There is no persisted pending-invocation record, so if the process dies after write-back but before the local commit, the edit is lost. The design assumes a single writer. Visibility is fail-open and the actor is self-declared, because the reference has no authentication. [Fact] (IMPLEMENTATION.md)
- MCP surface. For each object type it generates `search_`, `get_`, union/intersect/subtract and `aggregate_` tools. For each link it generates `traverse_` and `pivot_`. Each action and each function becomes its own tool, and there is a `read_audit_log` tool. The build fails if two generated tool names collide. Errors come back as JSON `{error:{code,message}}` with no stack traces. [Fact] ([mcp.ts](https://github.com/gura105/operational-ontology/blob/HEAD/src/mcp.ts)). It uses the v1 `@modelcontextprotocol/sdk` `McpServer`. [Fact]
- Verdict: **copy the design.** It is the most honest small statement of the pattern. Do not depend on it. To make it production-grade, add Postgres, real identity, fail-closed visibility, idempotency keys, an outbox/pending-invocation record, and asynchronous write-back on a durable workflow. [Inference]
