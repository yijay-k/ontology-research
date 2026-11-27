# Object storage and indexing

**Layer:** [03-ontology-engine](README.md) · **What it is:** Where object instances live and how they are indexed and kept in step with source data (Palantir OSv2/Funnel and equivalents).

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (4) · [Open-source implementations](#open-source-implementations) (7) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (3)

## Palantir

### 11. Backend services

> Source: [general-references/02-palantir-ontology.md § 11. Backend services](../../general-references/02-palantir-ontology.md#11-backend-services)

Plain English: one service stores the definitions, one pipeline keeps a search index in sync with the source data and the edits, one database serves the index, one service answers all queries, and one service applies actions.

Technical detail:
- **Ontology Metadata Service (OMS)** holds object, link and action type definitions. [Fact] https://www.palantir.com/docs/foundry/object-backend/overview . Its generated client shows endpoints such as `loadOntology`, `loadAllOntologyEntities`, `bulkLoadOntologyEntities`, `getLinkTypesForObjectTypes`, `getActionTypesForObjectTypes`, `getObjectTypesForInterfaceTypes`, `loadOntologyDatasources`, `modifyOntology`, `loadMergedRebaseState`, plus separate search, workflow, security-provenance and an "Ontology LLM" plugin service. [Fact] `osdk-ts/packages/client.unstable/src/generated/ontology-metadata/api/OntologyMetadataService/*.ts` . [Inference] Definitions are versioned entities modified through one `modifyOntology` call, with branch and rebase state stored in OMS.
- **Object Set Service (OSS)** serves all reads (search, filter, aggregate, load) for every app. [Fact] overview page. Generated client sub-services: ObjectSetService (create, temporary create, get, page, materialize), VersionedObjectSetService (saved sets with versions), ObjectSetAggregationService, ObjectSetScrollService, ObjectSetSuggestService. [Fact] `client.unstable/src/generated/object-set-service/api/`
- **Object databases.** OSv1 (Phonograph): one system for indexing, querying and edits; deprecated, planned unavailable after 30 June 2026. OSv2: indexing and querying separated for horizontal scale; incremental indexing default; "tens of billions" of objects per type [Vendor claim]; 2,000 properties per type; 10,000 objects per action; streaming datasources; Spark-backed search-around; schema migrations of edits. [Fact] https://www.palantir.com/docs/foundry/object-backend/overview
- **Actions service** applies edits to object databases and builds the action log. [Fact] same page.
- **Object Data Funnel ("Funnel")** orchestrates all writes into OSv2: reads datasets, restricted views, streams and action edits; indexes them; keeps them current. [Fact] same page.
- **Batch pipeline stages:** (1) changelog: diff new source transactions into Funnel-owned APPEND changelog datasets; (2) merge: join changelogs with recent action edits on primary key; (3) index: one job per object database writes index files; (4) hydration: search nodes download index files to local disk, after which the type is queryable. **Live** pipelines run on each source update and every 6 hours if edits exist; **replacement** pipelines are built in the background for schema changes and swap in after a successful run. Full reindex triggers: more than 80% of rows changed in one transaction, a schema change, or manual request. Incremental inputs must have at most one row per key per transaction; deletes need a declared deletion column (a column named `is_deleted` is not enough); Iceberg tables must be unique per key or a full reindex fails. [Fact] https://www.palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/
- **Streaming pipelines:** seconds-to-minutes latency; changelog streams with "most recent update wins" in stream order, so partition by key and order by event time upstream; full-row records only; exactly-once (default) or at-least-once; max record 1 MB; max 250 properties; no MDOs; no user edits; no materializations; cannot be cancelled; 2 MB/s indexing throughput per object type; Flink checkpointing every 1 s dominates latency; invalid records are dropped rather than failing; retention windows are best-effort with a two-weekly replacement replay. [Fact] https://www.palantir.com/docs/foundry/object-indexing/funnel-streaming-pipelines/ , https://www.palantir.com/docs/foundry/object-indexing/faq/
- **Direct datasources** (beta): low-latency direct writes from Pipeline Builder, supporting edits on stream-backed types and an optional source-timestamp ordering (older writes dropped). Replay wipes and repopulates the object view. [Fact] https://www.palantir.com/docs/foundry/object-indexing/direct-datasources/
- **Retries and size:** transient indexing errors retry after about 5 minutes; terminal errors wait for new data; index size is bounded by search-node disk. [Fact] https://www.palantir.com/docs/foundry/object-indexing/faq/
- **Monitoring:** "Sync Propagation Delay" rules alert when freshness exceeds a threshold. [Fact] funnel batch page.

### 17. Cost model and performance

> Source: [general-references/02-palantir-ontology.md § 17. Cost model and performance](../../general-references/02-palantir-ontology.md#17-cost-model-and-performance)

- Query minimums since 1 January 2026: base 2, search-around 5, aggregation 5, Ontology SQL 5, advanced (semantic search) 10, derived property 10, action 18 + 1 per extra edited object, OSv1 16 compute-seconds. Compute is charged to the originating app; for Object Explorer and the OSDK it is charged to the queried object types, split evenly across types. Legacy (pre-2026): OSv2 query 4, function on objects 4, action 18. [Fact] https://palantir.com/docs/foundry/ontologies/query-compute-usage/
- Indexing compute = (driver + executors) × max(vCPU, GiB ÷ 7.5) × wall-clock seconds; drivers: records, properties, property size, update frequency; changelog (incremental) indexing can give "orders-of-magnitude" savings. [Fact] https://palantir.com/docs/foundry/ontologies/compute-usage/
- Volume: hourly measurement of index size per object type plus join tables, averaged to GB-months; ontology data is not compressed, so it can exceed dataset size. [Fact] https://palantir.com/docs/foundry/ontologies/volume-usage/
- Guidance: filter first, query single object types rather than multi-type searches, keep object sets small. [Fact] query compute page.

### Palantir Ontology backend — current OSv2 reference and legacy corrections

> Source: former `01-reference-architecture/palantir-osv2-current-state.md` (moved here in the Nov 2026 restructure)

**Checked:** 27 November 2026  
**Evidence:** current public Palantir documentation. This documents the published product contract; it does not disclose private implementation details or prove behaviour in a particular customer enrollment.

#### 1. Why this note exists

The original research map 30 contains valuable, detailed Palantir research. However, some data-layer and object-indexing observations were written against legacy Foundry behaviour. Palantir has since documented a major change from Object Storage v1 (Phonograph) to Object Storage v2 (OSv2).

Do not use OSv1-specific behaviour as a current Foundry design rule without explicitly labelling it as legacy.

#### 2. Current documented logical components

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

#### 3. OSv1 versus OSv2 — important corrections

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

#### 4. Correction to the original ingestion-order recommendation

**Original claim in map 30:** Palantir's Ontology ignores an ordering column and indexes by arrival order; therefore our design should honour the ordering column at index time.

**Current official OSv2 contract:** for object types with a changelog data source, OSv2 does not use the legacy “latest timestamp wins” semantic. It indexes pipelines incrementally by default, and Funnel performs relevant changelog calculations in the background. The old changelog Python decorator is obsolete in this path.

**Corrected interpretation:**

1. The map 30 statement must be scoped to the legacy changelog path; it is not a platform-wide current Foundry rule.
2. Do not reproduce an OSv1-specific workaround as an OSv2 design requirement.
3. Our own ingestion runtime still needs explicit ordering, replay, deduplication and delete semantics, but these must be defined from our connector/source contracts and tested against out-of-order events. They are our design requirements, not claims about current Palantir internals.
4. Distinguish source event time, source sequence/version, observed time and ingestion time. Never silently use one as a substitute for another.

This correction does not prove that “arrival order wins” is the right rule for our product. It means the original Palantir comparison is no longer sufficient evidence for that choice.

#### 5. Actions, writeback and edit history

OSv2 documents several changes that matter to our action model:

- User edits in OSv2 are supported through Actions; direct calls to OSv1 edit APIs must be refactored.
- The OSv1 term “writeback dataset” becomes “materialization” in OSv2; materializations are optional rather than required.
- Migration can preserve edit history, but that choice adds processing/storage cost.
- When full edit-history preservation is not selected, prior edits may persist but the full historical edit trail is not available in OSv2; after migration it cannot be recovered from OSv1. Action Logs remain a distinct mechanism.

**Design implication:** separate canonical state, user-edit history, action logs, materialized outputs and external side effects. Do not assume they are the same ledger or that history is preserved automatically.

Source: https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes

#### 6. Query and schema details that need version labels

The current OSv2 overview documents a maximum of 2,000 properties per object type and a default Search Around limit of 100,000 objects. The breaking-changes page also records OSv2 differences such as no query-string support in OSS APIs and no cardinality metrics for object sets mixing OSv1 and OSv2 objects.

The link-type documentation says one-to-one cardinality expresses intended relationship shape but does not itself enforce uniqueness. Storage constraints and business invariants must therefore be designed and tested separately.

Sources:
- https://www.palantir.com/docs/foundry/object-backend/overview/index.html
- https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes
- https://www.palantir.com/docs/foundry/object-link-types/create-link-type

#### 7. What we should adapt — and what remains unproven

| Finding | Status | Our response |
|---|---|---|
| Separate ontology metadata, object query, actions and indexing responsibilities | Documented | Preserve as logical module boundaries |
| Use Funnel as the current OSv2 ingestion/indexing path | Documented vendor mechanism | Learn from its separation; do not claim we reproduce it |
| OSv2 incremental indexing and changelog calculation | Documented vendor mechanism | Re-evaluate the old arrival-order recommendation |
| User edits flow through Actions in OSv2 | Documented | Use named, server-validated actions as our mutation boundary |
| Preserve action/edit history across migrations | Conditional in vendor migration | Define our own retention and migration contract explicitly |
| Palantir's full private transaction protocol | Not established by these docs | Do not infer atomicity beyond explicitly documented guarantees |
| Our Postgres ingestion and action guarantees | Not implemented/validated here | Prove with replay, concurrency and crash tests |

#### 8. Required follow-up tests for our platform

- Out-of-order events for the same source record.
- Duplicate delivery and replay after a partial batch failure.
- Source deletion and tombstone propagation.
- Source timestamp versus sequence-number precedence.
- Rebuild/reindex while user edits exist.
- Schema migration that changes a primary key or relationship endpoint.
- Action commit succeeds but external writeback times out.
- Historical object state and action audit remain reconstructable after model release changes.

#### 9. Sources and related internal research

- Original map: `sources/archive-original/30-map-palantir-platform.md` — especially data-layer decision 2 and the opening of the ontology/indexing section.
- Original source research: `sources/archive-original/01-palantir-data-layer.md`, `02-palantir-ontology.md`.
- Phase 2 object/query contracts: `03-ontology-engine/phase2-object-and-query-contracts.md`.
- Phase 2 action isolation: `06-action-and-execution-engine/phase2-action-isolation-and-invariants.md`.
- Current official docs: the three URLs in sections 2, 5 and 6.

Historical source maps remain preserved. This file is an erratum/current-reference layer and must not silently rewrite the original research.

### 20. How it all feeds the Ontology (Funnel / OSv2)

> Source: [general-references/01-palantir-data-layer.md § 20. How it all feeds the Ontology (Funnel / OSv2)](../../general-references/01-palantir-data-layer.md#20-how-it-all-feeds-the-ontology-funnel--osv2)

[Fact] https://www.palantir.com/docs/foundry/object-backend/overview/ , https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/
- **Funnel** reads datasources (datasets, restricted views, streams, Iceberg tables, virtual tables) plus Action edits, and indexes them into object databases.
- **Batch pipeline stages:**
  1. *Changelog*: diff the new transaction and write APPEND changelogs into Funnel-owned datasets.
  2. *Merge*: join with recent user edits on the primary key.
  3. *Index*: one job per object database, producing index files.
  4. *Hydrate*: copy index files onto search-node disks.
- **Live and replacement pipelines:**
  - The live pipeline also runs **every 6 hours** if user edits exist, so they get persisted.
  - A replacement pipeline is built in the background on a schema change and swaps in after its first success.
- **Incremental rules:**
  - The latest transaction wins per key, with at most one row per key per transaction.
  - A column named `is_deleted` is *not* treated as a deletion column automatically.
  - Full reindex when more than 80% of rows change.
- **Read and write limits:**
  - Tens of billions of objects per type; maximum 2,000 properties (OSv2).
  - 10,000 objects editable per Action (default).
  - Search Around: 100,000 objects by default.
  - Temporary object sets expire within 24 h.
- **OSv1 (Phonograph)** is unavailable after 30 Jun 2026.
- **Streaming object types:** Section 9.

---

## Open-source implementations

### Trace B — object data write and outbox across stores

> Source: [open-source-references/openfoundry.md](../../open-source-references/openfoundry.md) (repository audit)

**Code:** [`writeback.go`](https://github.com/CapTrix/openfoundry/blob/main/libs/ontology-kernel/domain/writeback.go), [`outbox.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/handlers/outbox.go).

The kernel writeback helper writes the primary object store first (Cassandra adapter with optimistic version handling), then opens a PostgreSQL transaction to enqueue an event. It derives a deterministic UUIDv5 event ID from tenant/aggregate/object/version. If opening or committing the PG transaction fails after the primary write has succeeded, the helper returns a typed `WritebackError` containing event ID and committed version so the caller can retry deterministically. A repeated call that sees the expected target version can be treated as an idempotent retry before re-enqueueing the same event ID.

This is **not a single atomic transaction across Cassandra and PostgreSQL**. The helper explicitly models a partially committed state: object data may exist while the outbox row is absent. Deterministic retry metadata is the recovery approach, and callers need to honour it. A robust implementation should have explicit pending/reconciliation visibility rather than rely only on application callers to notice the error.

### Trace D — indexer retries and dead-letter handling

> Source: [open-source-references/openfoundry.md](../../open-source-references/openfoundry.md) (repository audit)

**Code:** [`runtime.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-indexer/internal/runtime/runtime.go).

The inspected Kafka loop fetches a message, processes it with configured retries and exponential backoff, optionally sends a failed message to the DLQ, and commits the original offset after successful processing or after successful DLQ publication. Default retry values in the helper are 100 ms initial backoff and 2 s cap when not configured; attempts are clamped to at least one. Unknown topics are logged and skipped as decode-error outcome. This is a useful recovery model, but the audit still needs to trace malformed payload handling, consumer offset/configuration, projection idempotency, replay and storage/index divergence.

### Trace C — graph write and search-index repair

> Source: [open-source-references/alibaba-umodel.md](../../open-source-references/alibaba-umodel.md) (repository audit)

`internal/entitystore/service.go` writes entity/relation state to GraphStore and updates the search index as a secondary operation. The source and test fixture show partial-success semantics: a primary graph write may succeed while indexing reports a warning. The service exposes an index restoration/rebuild path by reading the GraphStore. The observed request-key idempotency cache is in-memory; the inspected implementation does not establish durable deduplication across process restart.

### Finding 1 — model definition, runtime records, query and agent tools are separate services

> Source: [open-source-references/alibaba-umodel.md](../../open-source-references/alibaba-umodel.md) (repository audit)

The repository architecture separates model-pack import/validation, workspace metadata, runtime EntityStore writes, Query Service reads, AgentGateway tool exposure and GraphStore persistence. The public documentation describes model packs as the semantic vocabulary and the EntityStore as the runtime layer that instantiates records and relations. Query Service is the common read surface for model/entity/topology query families. This is a useful separation of contracts; the graph database is not the whole ontology product.

**Design implication (proposed):** model schema and runtime business objects should have separate lifecycle and versioning. A schema publication should be validated and versioned independently of object mutations. Query plans should be compiled against a stable model/schema version. Runtime entities should not silently define the ontology by accidental ingestion.

### Finding 2 — provider selection is an interface plus capability boundary

> Source: [open-source-references/alibaba-umodel.md](../../open-source-references/alibaba-umodel.md) (repository audit)

`graphstore.NewProvider` resolves a provider factory by type. The registry includes `memory`, `file.memory`, `local.ladybug`, `neo4j` and `gremlin` when their provider packages are imported. `DefaultProviderType` is `local.ladybug`. The contract tests explicitly verify that the default app uses Ladybug, that memory and file-memory can be selected, and that unknown provider names fail.

The Neo4j provider states that query evaluation remains in the shared Go engine, so workspace and lifecycle semantics remain consistent with the memory/file-memory implementations; it supports Neo4j and OpenCypher dialect modes. The Gremlin provider likewise delegates reads to the shared evaluator and validates the endpoint/TLS configuration. The repository has a GraphStore contract test suite to exercise common semantics, which is the right portability pattern. A provider abstraction does not make providers feature-identical: `GraphStoreCapabilities` and the planner constrain depth, limit and supported operators.

**Design implication (proposed):** define a small portable semantic core and a capability matrix. Make provider-specific limitations explicit in the compiled query plan and API response. Run the same contract suite against every production provider, plus multi-process, crash and concurrency tests. Do not promise arbitrary Cypher/Gremlin portability.

### Finding 3 — import paths have meaningful filesystem confinement

> Source: [open-source-references/alibaba-umodel.md](../../open-source-references/alibaba-umodel.md) (repository audit)

`Import` confines a caller-supplied path to a configured import root, resolves the root and rechecks discovered files; the source comment specifically calls out a symlink escape. `ImportTrusted` bypasses confinement for trusted bundled sample packs and carries an explicit warning that user input must never reach it. The inspected import tests cover in-root import, absolute path escape, `..` traversal and symlink escape.

**Design implication (proposed):** keep trusted and user-originated ingestion paths as separate capabilities. Never expose a trusted filesystem import method directly through MCP/REST. Prefer content-addressed uploads or a controlled object store for user documents, with malware scanning, MIME validation, extraction limits and tenant-bound metadata.

### 3. Keep authoritative state separate from projections

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#3-keep-authoritative-state-separate-from-projections)

UModel graph writes and search indexing can partially succeed; LightRAG stores graph and vector/chunk representations; OpenFoundry has source object persistence and search projections. DataHub has metadata state and event stream.

**Design implication:** declare source of truth per object/property. Indexes/vectors/graphs are rebuildable projections unless the architecture explicitly assigns authority. Build replay and reconciliation from day one.

## Earlier engineering notes (Phase 2)

### 1. An ontology backend is several cooperating responsibilities

> Source: former `03-ontology-engine/phase2-object-and-query-contracts.md` (moved here in the Nov 2026 restructure)

Palantir's public object-backend architecture names:
- Ontology Metadata Service (OMS): object/link/action type definitions and related metadata.
- Object databases: indexed object representation and edit handling.
- Object Set Service (OSS): search, filtering, aggregation, loading and read execution.
- Actions: structured object mutation under conditions and permissions.
- Object Data Funnel: ingests source data and user edits into object databases.
- Functions on Objects: business logic for operational contexts.

This is the important architectural lesson: **schema metadata, object persistence/indexing, query execution and action application are separate contracts**. A single graph database plus a generic CRUD endpoint does not reproduce that separation.

Source: https://www.palantir.com/docs/foundry/object-backend/overview

Palantir's documentation describes Object Storage v1 as legacy and Object Storage v2 as the next-generation canonical data store for backing the Ontology. That does not mean every value originates in the Ontology: mapped source data and user edits still have separate provenance and lifecycle.

### H2 — PostgreSQL as first authoritative store

> Source: former `17-decisions-and-tradeoffs/architecture-hypotheses.md` (moved here in the Nov 2026 restructure)

**Hypothesis:** use PostgreSQL for ontology definitions, core object state, actions, workflow references and outbox initially. Use JSONB selectively, not as a substitute for typed constraints. Consider graph/vector/search stores as projections/adapters until query volume or traversal requirements justify separate authoritative graph storage.

**Alternatives:** Cassandra for high-write partitioned object workloads; Neo4j/TypeDB for graph-specific constraints/reasoning; external warehouse/lakehouse for analytics.

**Evidence:** OpenFoundry uses PostgreSQL metadata/outbox and Cassandra object storage; LightRAG proves a PostgreSQL graph representation; Graphiti demonstrates temporal facts but stores via graph providers. These projects have different workloads.

### H3 — Separate authoritative business objects from extracted knowledge graph

> Source: former `17-decisions-and-tradeoffs/architecture-hypotheses.md` (moved here in the Nov 2026 restructure)

**Hypothesis:** business records and agent-extracted evidence should share identity references but keep distinct trust/provenance and write policies.

**Why:** Graphiti and LightRAG show useful LLM-derived facts/relations; these are not automatically correct canonical business state. Legal evidence and contractual obligations need source citation and review.

## Fact-check notes

_Checked 28 Nov 2026 against current vendor documentation and project pages. **Confirmed** = the research above still matches. **New** = not in the research above. **Changed** = the research above is now out of date._

- **Confirmed — OSv2 architecture.** The Ontology backend is still described as Ontology Metadata Service (definitions), Object Set Service (reads: search, filter, aggregate, load) and the Object Data Funnel (indexes datasources and Action edits into the object databases). Source: https://www.palantir.com/docs/foundry/object-backend/overview/
- **Confirmed — OSv2 limits.** Maximum 2,000 properties per object type; default Search Around limit 100,000 objects, raisable via support. Source: https://www.palantir.com/docs/foundry/object-backend/overview/
- **Changed — OSv1 is now gone, not just deprecated.** The edits page says OSv1 (Phonograph) "is unavailable after June 30, 2026"; the migration page now says migration to OSv2 "is mandatory for all object types". Treat every OSv1 statement in the research (writeback datasets, `StaleObject` on any version change, 32 KB edit limit, query strings) as historical only. Sources: https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/ , https://www.palantir.com/docs/foundry/object-backend/osv1-osv2-migration/
- **New — how Palantir cut over storage engines.** Migration uses an optional *transition window* (low-traffic period) and a *soak period* of up to 14 days in which both indexes stay current, all reads go to OSv2, OSv1 requests are rejected, and abort is instant; after the soak, rollback needs a full re-index. Dual indexing costs extra compute and storage. This is a good pattern for any future storage migration of our own object store. Source: https://www.palantir.com/docs/foundry/object-backend/osv1-osv2-migration/
- **Confirmed — incremental sync semantics.** OSv2 uses "latest transaction wins" per primary key for incremental datasets, and a single transaction may not contain duplicate keys. OSv2 no longer uses the legacy "latest timestamp wins" changelog semantic. Sources: https://www.palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/ , https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes/
- **New — streaming throughput.** Streaming indexing is limited to 2 MB/s per object type into OSv2 (raisable via support), and Ontology streaming is supported only by the OSv2 object database. Source: https://www.palantir.com/docs/foundry/object-indexing/faq/
- **New — Actions cannot edit stream-backed object types.** "Actions are not yet supported on object types with Foundry stream datasources." Direct datasources (beta, configured in Pipeline Builder) are the low-latency write path for those. Sources: https://www.palantir.com/docs/foundry/object-edits/overview/ , https://www.palantir.com/docs/foundry/object-indexing/direct-datasources
- **New — other permanent OSv2 breaking changes worth copying as design rules:** edits only through Actions (no direct edit API); edit history must be switched on per object type ("Track user edit history"); monitoring only through monitoring views; no query-string search in OSS. Source: https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
