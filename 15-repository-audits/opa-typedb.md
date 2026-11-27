# Repository audit — OPA and TypeDB

These systems occupy two very different but important layers: **OPA is a policy evaluation engine**; **TypeDB is a typed database/query engine**. They should not be lumped together as generic “graph/security tooling”.

Snapshots: [open-policy-agent/opa](https://github.com/open-policy-agent/opa), branch `main`; [typedb/typedb](https://github.com/typedb/typedb), branch `master`; 27 November 2026. Selected implementation and test source inspected remotely; no build/tests run.

## OPA — policy decision evaluation and HTTP enforcement adapter

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

## TypeDB — typed semantic schema and query execution

### Relevant code

- [Schema define execution](https://github.com/typedb/typedb/blob/master/query/define.rs)
- [Query analysis and type annotations](https://github.com/typedb/typedb/blob/master/query/analyse.rs)
- [Define integration test](https://github.com/typedb/typedb/blob/master/query/tests/define.rs)
- [Storage isolation manager](https://github.com/typedb/typedb/blob/master/storage/isolation_manager.rs)
- [Storage durability client](https://github.com/typedb/typedb/blob/master/storage/durability_client.rs)

### Trace A — schema declarations are processed in typed phases

`query/define.rs` executes a parsed `Define` against a writable storage snapshot. It processes struct definitions, type definitions and function definitions. Type definitions are handled in ordered phases: type declarations; aliases; value types; annotations; subtyping; relation `relates` declarations and specialization; ownership (`owns`) declarations and specialization; and role-playing (`plays`) declarations. Undefined referenced labels are resolved and produce symbol-resolution errors if absent. This is a typed semantic schema compiler, not arbitrary JSON-schema storage.

The integration test parses TypeQL `define` statements, converts them to a schema query, executes against a writable snapshot and commits it. This is test source evidence of the intended schema write path, not a test run in this research session.

### Trace B — query analysis builds typed annotations

`query/analyse.rs` creates `AnalysedQuery` and builds `QueryStructureAnnotations` using a readable snapshot, `TypeManager`, variable registry, parameter registry and parsed pipeline structure. It derives variable types and fetch annotations from owner types and owned attribute types. This shows how query validation and result shape depend on ontology/schema, before storage operators execute.

### Trace C — snapshot concurrency and durability are explicit storage concerns

`storage/isolation_manager.rs` tracks read and write snapshots against sequence-number timeline windows and tracks concurrent windows/commit records. It integrates commit records and write batches with a durability client. The code includes TODOs around atomic ordering and future WAL retrieval for evicted commit records; do not interpret this as a missing durability feature overall, but note that the inspected source explicitly manages isolation and durability rather than delegating everything to a generic graph engine.

## TypeDB vs a generic property graph

TypeDB's defining strength is the schema/query/type system: entity, relation and attribute types, role/ownership constraints, subtype relationships, typed query analysis and transactional snapshots. A property graph DB can store many of these concepts, but the application must implement more semantic constraints and type checking itself. Conversely, TypeDB's type/query model may impose a different learning curve and data-modelling workflow than a simpler operational object model.

## Implication for our design

- Evaluate whether we need a full semantic DB/type system or whether PostgreSQL plus explicit ontology metadata and constrained queries are enough for our first product.
- Regardless of backing store, implement semantic validation before physical query generation.
- Use explicit schema migration/change control and transaction boundaries.
- Treat OPA as policy decision machinery and add PEP coverage at every service and index—not as a database that automatically secures all data.

## Open questions

- Full TypeDB commit/WAL recovery and schema redefine/delete semantics need more audit.
- OPA policy bundle lifecycle, decision cache and per-resource filtering patterns need implementation study.
- Evaluate actual integration effort and query expressivity with our legal/finance object models; no benchmarks were run.