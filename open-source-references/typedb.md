# TypeDB

| | |
|---|---|
| **Repository** | <https://github.com/typedb/typedb> |
| **Why it matters** | A strongly typed semantic database: schema declarations, typed query analysis and explicit snapshot concurrency. |
| **What to take** | Typed schema phases and query type-annotation as a model for validating ontology definitions and queries. |
| **What not to copy** | Replacing PostgreSQL with it at this stage. |
| **Feeds** | [03-ontology-engine/object-type-registry](../engineering/03-ontology-engine/object-type-registry.md) |
| **Evidence level** | Phase 2 repository audit (source inspection, not executed) |

## Repository audit: TypeDB — typed semantic schema and query execution

> Source: former `15-repository-audits/opa-typedb.md` (Phase 2 source inspection, not executed).

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

## Repository audit: TypeDB vs a generic property graph

> Source: former `15-repository-audits/opa-typedb.md` (Phase 2 source inspection, not executed).

TypeDB's defining strength is the schema/query/type system: entity, relation and attribute types, role/ownership constraints, subtype relationships, typed query analysis and transactional snapshots. A property graph DB can store many of these concepts, but the application must implement more semantic constraints and type checking itself. Conversely, TypeDB's type/query model may impose a different learning curve and data-modelling workflow than a simpler operational object model.

## Repository audit: Implication for our design

> Source: former `15-repository-audits/opa-typedb.md` (Phase 2 source inspection, not executed).

- Evaluate whether we need a full semantic DB/type system or whether PostgreSQL plus explicit ontology metadata and constrained queries are enough for our first product.
- Regardless of backing store, implement semantic validation before physical query generation.
- Use explicit schema migration/change control and transaction boundaries.
- Treat OPA as policy decision machinery and add PEP coverage at every service and index—not as a database that automatically secures all data.

## Repository audit: Open questions

> Source: former `15-repository-audits/opa-typedb.md` (Phase 2 source inspection, not executed).

- Full TypeDB commit/WAL recovery and schema redefine/delete semantics need more audit.
- OPA policy bundle lifecycle, decision cache and per-resource filtering patterns need implementation study.
- Evaluate actual integration effort and query expressivity with our legal/finance object models; no benchmarks were run.
