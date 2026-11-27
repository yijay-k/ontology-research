# open-policy-agent/opa

| | |
|---|---|
| **Repository** | <https://github.com/open-policy-agent/opa> |
| **Why it matters** | Policy engine whose compile API turns policies into SQL WHERE clauses. |
| **What to take** | The pattern: partial evaluation → check translatability → emit SQL filter. |
| **What not to copy** | Treating a policy engine as end-to-end authorization, or adding a Go sidecar and Rego for one person. |
| **Feeds** | [01-security/authorization-model](../engineering/01-security/authorization-model.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** **consider as a sidecar** only if you want policy authors to write Rego and get SQL `WHERE` clauses back. For one person, a Go sidecar plus Rego is a second language and a second service. **Copy the design** of "partial evaluation → check translatability → emit SQL fragment". [Inference]

> **Source re-check 28 Nov 2026 (code):** [`open-policy-agent/opa@58d4683`](https://github.com/open-policy-agent/opa/tree/58d4683) — structures cited below verified present; no licence change.

## From the open-source code study: 18. Open Policy Agent

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- Apache-2.0, Go (about 478k lines), version 1.23.0-dev, last commit 2026-11-20. [Fact]
- The compile API (`v1/server/compile_handler.go`, `v1/rego/compile/compile.go`) runs partial evaluation with post-checks that decide whether a residual can become a filter for a given target. Targets are UCAST (all, minimal, Prisma, LINQ), SQL (PostgreSQL, MySQL, SQL Server, SQLite) and Lucene/Solr, selected by `application/vnd.opa.*` media types. [Fact] ([compile_handler.go](https://github.com/open-policy-agent/opa/blob/HEAD/v1/server/compile_handler.go))
- Verdict: **consider as a sidecar** only if you want policy authors to write Rego and get SQL `WHERE` clauses back. For one person, a Go sidecar plus Rego is a second language and a second service. **Copy the design** of "partial evaluation → check translatability → emit SQL fragment". [Inference]

## Repository audit: OPA — policy decision evaluation and HTTP enforcement adapter

> Source: former `15-repository-audits/opa-typedb.md` (Phase 2 source inspection, not executed).

### Relevant code

- [Rego evaluation API](https://github.com/open-policy-agent/opa/blob/main/v1/rego/rego.go)
- [Bundle compiler](https://github.com/open-policy-agent/opa/blob/main/v1/compile/compile.go)
- [HTTP authorizer](https://github.com/open-policy-agent/opa/blob/main/v1/server/authorizer/authorizer.go)
- [Authorizer test directory](https://github.com/open-policy-agent/opa/tree/main/v1/server/authorizer)

### Trace — request to decision to guarded handler

`authorizer.Basic.ServeHTTP` parses the HTTP request into policy input containing path, method, query parameters, headers and (where expected) parsed request body. It adds authenticated identity and client-certificate data if available in request context. It then constructs a Rego query using the configured decision reference, compiler, store and input, and evaluates it.

The result handling is deliberate:

- no result is an internal error: a configured authorizer with no policy is treated as misconfiguration, not implicit allow;
- a Boolean result is interpreted directly;
- a structured object can contain `allowed` and `reason`;
- only a positive allow calls the wrapped handler; otherwise it returns unauthorized.

The OPA compiler is a separate capability: its target field supports output formats such as Rego, Wasm and plan. It is not a SQL generator or an ontology query engine. The `PreparedEvalQuery` API supports compiling/preparing policy state and evaluating it repeatedly with request inputs.

### What we should learn

- Treat policy evaluation as a reusable PDP (policy decision point) separate from PEP enforcement in each service/gateway.
- Missing policy or malformed policy output must fail closed.
- Supply a structured, trusted identity/context input rather than accepting tenant/role claims directly from user payloads.
- Use prepared policy evaluation/caches carefully; invalidate on policy revision and avoid cross-tenant cache reuse.
- Ensure every object read, object list, property projection, graph traversal, vector retrieval, action, workflow, export and agent tool is actually behind a PEP.

### Important boundary

OPA can decide whether a request is allowed, but OPA does not automatically filter SQL rows, graph nodes, vector results or cached objects. The application must apply policy to the correct resource context and enforce the result in each data path. “We installed OPA” is not an authorization architecture.
