# Terminology

| Term | Working definition |
|---|---|
| Ontology definition / TBox | Type-level model: entity/object types, attributes, relationship types, constraints, rules, metrics, interfaces and actions. |
| Runtime instance / ABox | Actual business objects, links and events conforming to ontology definitions. |
| Source-backed object | Object whose authoritative values are owned by an external system; the ontology stores a mapping/projection and provenance. |
| Ontology-owned object | Object whose authoritative state is maintained by our platform. |
| Derived object/property | Computed from other records/rules; generally recomputable and not independently authoritative. |
| Entity resolution | Linking records from multiple systems to one business identity, with match evidence and uncertainty. |
| Object set | Typed, composable selection of ontology instances; filters, joins/links, aggregation, sort, pagination and policy constraints. |
| Semantic layer | Governed business concepts and measures mapped to underlying data sources. It may or may not execute queries itself. |
| Knowledge graph | Graph of entities and relations, often enriched by evidence and temporal facts. It is not automatically a complete enterprise ontology. |
| Provenance | Origin, source record/document, extraction method, timestamps, confidence, transformations and actor behind a fact. |
| Valid time | When a fact is true in the business world. |
| Transaction/system time | When the platform recorded, changed or invalidated the fact. |
| Action | Named, typed, validated command that applies a bounded business state transition. |
| Workflow | Durable sequence of work, waits, approvals, retries, timers and external interactions. |
| Outbox | Durable event intent written in the same transaction as the local authoritative mutation. |
| Reconciliation | Process that compares local intent/state to external system outcomes and repairs divergence. |
| Marking | Classification or information-control label applied to data/objects/fields. |
| Policy evaluation | Decision about whether a principal/agent may perform an operation on a resource under context and constraints. |
| Projection/index | Derived representation optimised for search, analytics, graph traversal or vector retrieval; not authoritative unless explicitly designated. |
| Agent tool | A constrained interface to read/query or request an action; never equivalent to unrestricted database access. |
