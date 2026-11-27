# Data ingestion and source-of-truth model

## Objective

Bring data into the platform without erasing the external system's ownership or pretending every ingested fact is equally authoritative. Each connector should declare source identity, entity mappings, change semantics, deletion semantics, permissions available, watermarks, retry strategy and writeback capability.

## Proposed source record contract

A connector output should include: `source_system`, `source_tenant`, `source_object_type`, `source_record_id`, `source_version` or ETag, `observed_at`, `ingested_at`, `operation` (upsert/delete), `payload`, `schema_version`, `source_acl` (if available), `lineage/run_id`, and connector diagnostics. This contract is a proposal; source-specific fields may be preserved in an extension envelope.

## Pipeline stages

1. **Acquire:** pull, webhook, CDC, file drop or API read.
2. **Checkpoint:** persist cursor/watermark before declaring a page complete.
3. **Normalize:** canonical types, timestamps, currency, identifiers, null semantics and document metadata.
4. **Validate:** schema, required fields, constraints, duplicate IDs and source version.
5. **Resolve identity:** map source record to a canonical entity, with match evidence and confidence.
6. **Map to ontology:** source bindings and ownership mapping determine object type/property/link.
7. **Apply:** update authoritative or mirrored object projection with version conflict handling.
8. **Emit event:** transactional outbox for local state changes; external events are not published before durable commit.
9. **Project:** update search, graph, vector, analytics and caches idempotently.
10. **Reconcile:** compare source watermarks/counts/hashes and repair gaps.

## Authority model

Every property should have an authority policy: source-owned, ontology-owned, derived, user-editable overlay, or contested. A generic last-write-wins merge is unsafe for legal clauses, payment status, customer identity or contract obligations. Merge policy is property-specific and must define precedence, version conflict, review requirement and history retention.

## Ingestion reliability requirements

- Connector run ledger and per-source watermark.
- Idempotent page/item processing.
- Tombstones and explicit deletion handling.
- Schema evolution and replay from a selected version/watermark.
- Backpressure, rate limits and source throttling.
- Dead-letter and quarantine for malformed records.
- Source ACL sync status and staleness measurement.
- Partial failure visible by connector/run/entity.
- Rebuildable projections and reconciliation jobs.

## References

DataHub's workunit/source/emitter design is a useful metadata ingestion pattern; Airbyte and dlt are connector/data movement candidates from the original archive. OpenFoundry's object/outbox implementation demonstrates why cross-database writes need deterministic IDs and reconciliation. Fabric IQ demonstrates a different boundary: bind ontology definitions to source-owned data instead of necessarily copying all data into an ontology store.
