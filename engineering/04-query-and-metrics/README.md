# 04-query-and-metrics — Query and metrics

Answering with typed meaning: object-set queries, inspectable query plans, governed metrics, guarded text-to-SQL, arithmetic in code, functions.

[← Engineering index](../README.md)

| Component | What it is | Lines | Sources |
|---|---|---:|---:|
| [object-set-queries](object-set-queries.md) | Querying typed objects as sets: filters, link traversal, aggregation, pagination and consistency. | 222 | 10 |
| [query-plans-and-compiler](query-plans-and-compiler.md) | Turning a question into an inspectable, typed plan, then into executed steps (logical, optimised, physical). | 264 | 8 |
| [metrics-and-semantic-layer](metrics-and-semantic-layer.md) | Governed metric definitions: grammar, time windows, safe joins and compilation to SQL. | 603 | 17 |
| [text-to-sql-fallback-and-repair](text-to-sql-fallback-and-repair.md) | When no governed metric fits: generated queries as untrusted proposals that are checked and repaired against the ontology. | 130 | 4 |
| [numeric-reasoning](numeric-reasoning.md) | Arithmetic done in executed code with a trace, never in the model's head. | 66 | 2 |
| [functions](functions.md) | User-written logic attached to the ontology (functions, AIP Logic) that queries and computes over objects. | 113 | 3 |
