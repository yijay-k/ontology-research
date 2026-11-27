# Palantir Ontology backend — current OSv2 reference and legacy corrections

**Checked:** 27 November 2026  
**Evidence:** current public Palantir documentation. This documents the published product contract; it does not disclose private implementation details or prove behaviour in a particular customer enrollment.

## 1. Why this note exists

The original research map 30 contains valuable, detailed Palantir research. However, some data-layer and object-indexing observations were written against legacy Foundry behaviour. Palantir has since documented a major change from Object Storage v1 (Phonograph) to Object Storage v2 (OSv2).

Do not use OSv1-specific behaviour as a current Foundry design rule without explicitly labelling it as legacy.

## 2. Current documented logical components

Palantir's Ontology backend overview describes six cooperating responsibilities:

| Component | Publicly documented responsibility |
|---|---|
| Ontology Metadata Service (OMS) | Defines object types, link types, action types and other ontology metadata |
| Object databases | Store indexed object data and support querying, indexing and user edits |
| Object Set Service (OSS) | Shared read path for search, filtering, aggregation and loading |
| Actions | Apply structured user edits with conditions and permissions; can produce action history |
| Object Data Funnel | OSv2 write/indexing path that consumes Foundry data sources and Action edits and keeps indexed objects current |
| Functions on Objects | Executes business logic in operational application contexts |

**Architecture lesson:** schema metadata, object reads, object mutation, indexing and operational functions are separate contracts. This supports a modular logical architecture; it does not require us to copy Palantir's microservice deployment topology.

## 3. OSv1 versus OSv2 — important corrections

The official overview describes OSv1/Phonograph as the legacy backend and states it was planned to become unavailable after 30 June 2026. As that date has passed, treat OSv1 as historical/legacy in new research and do not use it as the baseline for a new design. The public wording is a planned-deprecation notice; verify the status of a particular customer enrollment rather than claiming that every deployment was disabled on that exact date.

OSv2 is a substantial architectural change, not simply a renamed database:

- indexing and querying are separated into specialised components;
- Funnel orchestrates writes from source data and user edits into object databases;
- incremental object indexing is enabled by default;
- OSv2 supports streaming data sources;
- more granular object/property permissions and higher edit throughput are documented;
- the published default Search Around limit is 100,000 objects, and a Spark-based execution layer is used for larger-scale Search Arounds and aggregations.

Official sources:
- https://www.palantir.com/docs/foundry/object-backend/overview/index.html
- https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes

## 4. Correction to the original ingestion-order recommendation

**Original claim in map 30:** Palantir's Ontology ignores an ordering column and indexes by arrival order; therefore our design should honour the ordering column at index time.

**Current official OSv2 contract:** for object types with a changelog data source, OSv2 does not use the legacy “latest timestamp wins” semantic. It indexes pipelines incrementally by default, and Funnel performs relevant changelog calculations in the background. The old changelog Python decorator is obsolete in this path.

**Corrected interpretation:**

1. The map 30 statement must be scoped to the legacy changelog path; it is not a platform-wide current Foundry rule.
2. Do not reproduce an OSv1-specific workaround as an OSv2 design requirement.
3. Our own ingestion runtime still needs explicit ordering, replay, deduplication and delete semantics, but these must be defined from our connector/source contracts and tested against out-of-order events. They are our design requirements, not claims about current Palantir internals.
4. Distinguish source event time, source sequence/version, observed time and ingestion time. Never silently use one as a substitute for another.

This correction does not prove that “arrival order wins” is the right rule for our product. It means the original Palantir comparison is no longer sufficient evidence for that choice.

## 5. Actions, writeback and edit history

OSv2 documents several changes that matter to our action model:

- User edits in OSv2 are supported through Actions; direct calls to OSv1 edit APIs must be refactored.
- The OSv1 term “writeback dataset” becomes “materialization” in OSv2; materializations are optional rather than required.
- Migration can preserve edit history, but that choice adds processing/storage cost.
- When full edit-history preservation is not selected, prior edits may persist but the full historical edit trail is not available in OSv2; after migration it cannot be recovered from OSv1. Action Logs remain a distinct mechanism.

**Design implication:** separate canonical state, user-edit history, action logs, materialized outputs and external side effects. Do not assume they are the same ledger or that history is preserved automatically.

Source: https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes

## 6. Query and schema details that need version labels

The current OSv2 overview documents a maximum of 2,000 properties per object type and a default Search Around limit of 100,000 objects. The breaking-changes page also records OSv2 differences such as no query-string support in OSS APIs and no cardinality metrics for object sets mixing OSv1 and OSv2 objects.

The link-type documentation says one-to-one cardinality expresses intended relationship shape but does not itself enforce uniqueness. Storage constraints and business invariants must therefore be designed and tested separately.

Sources:
- https://www.palantir.com/docs/foundry/object-backend/overview/index.html
- https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes
- https://www.palantir.com/docs/foundry/object-link-types/create-link-type

## 7. What we should adapt — and what remains unproven

| Finding | Status | Our response |
|---|---|---|
| Separate ontology metadata, object query, actions and indexing responsibilities | Documented | Preserve as logical module boundaries |
| Use Funnel as the current OSv2 ingestion/indexing path | Documented vendor mechanism | Learn from its separation; do not claim we reproduce it |
| OSv2 incremental indexing and changelog calculation | Documented vendor mechanism | Re-evaluate the old arrival-order recommendation |
| User edits flow through Actions in OSv2 | Documented | Use named, server-validated actions as our mutation boundary |
| Preserve action/edit history across migrations | Conditional in vendor migration | Define our own retention and migration contract explicitly |
| Palantir's full private transaction protocol | Not established by these docs | Do not infer atomicity beyond explicitly documented guarantees |
| Our Postgres ingestion and action guarantees | Not implemented/validated here | Prove with replay, concurrency and crash tests |

## 8. Required follow-up tests for our platform

- Out-of-order events for the same source record.
- Duplicate delivery and replay after a partial batch failure.
- Source deletion and tombstone propagation.
- Source timestamp versus sequence-number precedence.
- Rebuild/reindex while user edits exist.
- Schema migration that changes a primary key or relationship endpoint.
- Action commit succeeds but external writeback times out.
- Historical object state and action audit remain reconstructable after model release changes.

## 9. Sources and related internal research

- Original map: `sources/archive-original/30-map-palantir-platform.md` — especially data-layer decision 2 and the opening of the ontology/indexing section.
- Original source research: `sources/archive-original/01-palantir-data-layer.md`, `02-palantir-ontology.md`.
- Phase 2 object/query contracts: `03-ontology-engine/phase2-object-and-query-contracts.md`.
- Phase 2 action isolation: `06-action-and-execution-engine/phase2-action-isolation-and-invariants.md`.
- Current official docs: the three URLs in sections 2, 5 and 6.

Historical source maps remain preserved. This file is an erratum/current-reference layer and must not silently rewrite the original research.
