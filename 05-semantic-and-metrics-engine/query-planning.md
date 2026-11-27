# Semantic query and metrics engine

## Motivation

A natural-language question should not be executed as unconstrained SQL or an LLM-authored graph query. It should compile into a typed representation that the server can validate and explain.

## Proposed planning pipeline

Question → intent/metric/entity resolution → typed query request → authorization context → semantic plan → join/path validation → aggregation/time validation → source plan → backend SQL/API query → result normalization → deterministic calculations → explanation and lineage.

## Typed request example (conceptual)

```json
{
  "metrics": [{"name":"open_invoice_balance","aggregation":"sum"}],
  "group_by": ["customer","aging_bucket"],
  "filters": [{"field":"invoice.status","op":"in","value":["open","partial"]}],
  "time": {"as_of":"2026-11-27"},
  "limit": 100
}
```

The exact API is not final. The important invariant is that fields/metrics/relationships resolve to published ontology resources, types are checked, policy filters are injected and the planner can explain source lineage.

## Query safety

- Reject unknown metrics, dimensions and link paths.
- Prevent many-to-many fan-out from multiplying metrics unexpectedly.
- Require explicit aggregation grain and units.
- Bound traversal depth and result size.
- Bind parameters; never concatenate user strings into SQL.
- Respect valid-time vs transaction-time constraints.
- Detect stale/missing data bindings.
- Inject tenant and policy predicates at the trusted planner layer.
- Store plan and result lineage for audit and reproducibility.

## Reference implementation lesson

MetricFlow shows a semantic dataflow and SQL plan with explicit join validation, while Fabric IQ documents ontology metrics retaining source-owned DAX semantics. UModel's query plan can describe external telemetry queries for another executor. These examples suggest separate `semantic planner`, `source adapter/executor` and `metrics definition` responsibilities.
