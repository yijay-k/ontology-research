# Knowledge graph and retrieval architecture

## Three kinds of representation

1. **Operational objects:** validated business records with explicit ownership and lifecycle.
2. **Evidence/knowledge facts:** extracted from documents, conversations, events or external sources, with provenance, confidence and time validity.
3. **Retrieval projections:** lexical/vector/graph indexes for efficient recall; all items link back to source records/chunks and policy context.

These should connect but not be conflated. A model-extracted statement such as “the customer accepted the variation” should remain a sourced, reviewable fact until a domain policy determines that it can update the canonical contract/matter state.

## Document pipeline

Ingest → virus/type validation → parse/OCR where necessary → structural segmentation → metadata extraction → chunking with document hierarchy → entity and relation extraction → candidate resolution → provenance attach → embed and index → retrieval evaluation → reprocess/delete handling.

Every chunk/fact should retain document ID, version/hash, source location/page/offset, tenant/ACL, extraction model/prompt version, timestamps, confidence and transformation history.

## Retrieval planner

A hybrid planner can combine:
- lexical/BM25 for exact names, clauses, references and identifiers;
- vector similarity for semantic phrasing;
- graph traversal for connected entities and multi-hop context;
- object-set query for authoritative business state;
- source-live retrieval when the index is stale or freshness is required;
- reranking and evidence aggregation.

Retrieval must filter by tenant and authorization before ranking, then recheck permissions when opening the source or using the evidence in a tool/action. A relevant chunk the user cannot access must not be disclosed through an agent summary.

## Temporal facts

Adopt Graphiti's four-time distinction as a candidate pattern: `valid_at`, `invalid_at`, `recorded_at/created_at`, `expired_at/superseded_at`. Add source observation and ingestion time where needed. Conflicting facts should close/revise their valid interval with an audit trail, not silently overwrite the previous statement.

## Evaluation

Measure recall and precision by question class, retrieval latency, source ACL violations, stale index rate, citation correctness, entity linking accuracy, temporal query correctness and answer grounding. Evaluate multi-hop answers against known source records and graph paths. Maintain adversarial tests for prompt injection hidden in documents.