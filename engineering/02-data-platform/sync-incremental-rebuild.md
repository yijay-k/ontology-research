# Sync incremental rebuild

**Layer:** [02-data-platform](README.md) · **What it is:** Keeping clean state current: CDC, streaming, incremental builds, schedules, dataset branching and rebuild semantics.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (5) · [Open-source implementations](#open-source-implementations) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Palantir

### 6. Branching (dataset level)

> Source: [general-references/01-palantir-data-layer.md § 6. Branching (dataset level)](../../general-references/01-palantir-data-layer.md#6-branching-dataset-level)

[Fact] https://www.palantir.com/docs/foundry/data-integration/branching/
- **Structure:**
  - A branch is a pointer to its latest transaction, so each branch is a linear sequence.
  - Every non-root branch has exactly one parent. The usual root is `master`.
  - "There is no support for merging dataset branches."
- **Guarantees:**
  - At most **one open transaction per branch**.
  - Transactions are ordered within a branch, with no ordering across branches.
  - Deleting a branch deletes only the pointer, and its children are re-parented.
- **Builds on branches:**
  - Committing on a code branch publishes JobSpecs to the build-system branch of the same name.
  - A build on `develop` with the fallback chain `develop → master` uses JobSpecs and input data from `master` wherever `develop` has none.
  - Outputs are written to the build branch, which is created from the first existing fallback branch if needed.
  - A build never creates branches on its *input* datasets.
- **Iceberg note:** Iceberg's `main` and Foundry's `master` are treated as the same branch. Schema changes are isolated per branch. [Fact] https://www.palantir.com/docs/foundry/iceberg/iceberg-vs-datasets/

### 8. Change data capture (CDC)

> Source: [general-references/01-palantir-data-layer.md § 8. Change data capture (CDC)](../../general-references/01-palantir-data-layer.md#8-change-data-capture-cdc)

**Plain English.** Instead of copying a whole table every hour, you read the database's change log ("row 17 updated", "row 23 deleted") and replay it.

[Fact] https://www.palantir.com/docs/foundry/data-integration/change-data-capture/
- **The changelog contract:**
  - primary-key column(s);
  - a numeric ordering column, often a timestamp stored as a long;
  - a boolean deletion column.
  - Resolution: group by key, keep the row with the largest ordering value, and drop it if it is flagged deleted.
- **Native CDC sources:** Db2, SQL Server, Oracle and PostgreSQL, built on **Debezium**, with per-source custom Debezium properties.
- **Other sources:** Kafka, Kinesis, SQS and similar are ingested as normal streams, then keyed with a Pipeline Builder **Key By** board.
- **Operational limits:**
  - Throughput is fixed at creation; the default is **5 MB/s**.
  - All CDC syncs from one source run as one multi-output job, which must be restarted manually after changes.
  - No automatic backfill.
  - Surviving an outage requires the database to keep its change log longer than the longest expected outage.
- **Defaults:**
  - tombstones off; decimals as strings; schema changes not forwarded; up to 5 retries;
  - offset flush every 60 s (1 s for SQL Server);
  - snapshot modes `schema_only` (Oracle, SQL Server), `no_data` (Db2), `never` (PostgreSQL). These avoid table locks but risk data loss if archived logs are purged.
- **Stream views:** a *live view* holds every change entry; an *archive view* holds entries resolved to current state.
- **Ontology:**
  - Changelog-backed object types index the latest state.
  - The Ontology **ignores ordering columns and indexes by arrival order**, so out-of-order data can show stale values. Reorder upstream.
  - If retention is configured, records with no update inside the window disappear from the Ontology.
- **Iceberg CDC:** Iceberg tables also support changelogs and row-level `UPDATE`, `DELETE` and `MERGE INTO`. [Fact] https://www.palantir.com/docs/foundry/iceberg/iceberg-vs-datasets/

### 9. Streams and streaming (Flink)

> Source: [general-references/01-palantir-data-layer.md § 9. Streams and streaming (Flink)](../../general-references/01-palantir-data-layer.md#9-streams-and-streaming-flink)

[Fact] https://www.palantir.com/docs/foundry/data-integration/streams/
- **Storage:**
  - A stream is a low-latency **hot buffer** plus **cold storage**, in Avro.
  - Records are archived from hot to cold "every few minutes". The streaming-cost page says the archive job runs **every 10 minutes**. [Fact] https://palantir.com/docs/jp/foundry/building-pipelines/streaming-compute-usage/ (the two pages differ slightly)
  - The archive becomes an ordinary dataset. Low-latency readers see a hybrid of hot and cold data.
- **Partitions** are set with a throughput slider at creation. Rule of thumb: about **5 MB/s per partition**. "High Throughput" and "Compressed" stream types are tuning options.
- **Semantics:**
  - `AT_LEAST_ONCE` is faster but can duplicate.
  - `EXACTLY_ONCE` makes records visible only after each Flink checkpoint (default **2 s**).
  - Extracts and exports support only at-least-once.
  - A stream has no transaction boundaries; each row is its own transaction.
- **Streaming in Pipeline Builder:** keyed CoProcess UDFs (13 Aug 2026) join two streams with shared state. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-08
- **Streaming into the Ontology (Funnel streaming):** [Fact] https://palantir.com/docs/foundry/object-indexing/funnel-streaming-pipelines/
  - latency "seconds or minutes"; "most recent update wins"; every stream is treated as a changelog;
  - partition by primary key and order by event time upstream;
  - maximum record size **1 MB**; maximum **250 properties**; no multi-datasource objects;
  - **no user edits on streaming object types**. Workarounds: push edits into the stream, or use an auxiliary object type;
  - live refresh only in Workshop.

### 13. Builds, schedules, orchestration

> Source: [general-references/01-palantir-data-layer.md § 13. Builds, schedules, orchestration](../../general-references/01-palantir-data-layer.md#13-builds-schedules-orchestration)

[Fact] https://www.palantir.com/docs/foundry/data-integration/builds/
- **Jobs:**
  - A job computes one or more outputs. Multiple outputs update together, never partially.
  - Job kinds: syncs, transforms, health checks, analytical app logic, exports.
  - Job states: WAITING, RUN_PENDING, RUNNING, ABORT_PENDING, ABORTED, FAILED, COMPLETED.
- **Resolution:** detect cycles, check that inputs exist and resolve their schemas, open an output transaction (the "build lock"), and queue behind other builds that would change the inputs.
- **Failure:** dependents are aborted. Optionally all jobs are aborted. Completed upstream outputs keep their data.
- **Staleness:** a dataset is fresh, and skipped, if its inputs and JobSpec are unchanged. A "force build" overrides this.
- **Live logs** appear after about 10 s.

[Fact] https://www.palantir.com/docs/foundry/data-integration/schedules/ , https://www.palantir.com/docs/foundry/building-pipelines/scheduling-overview/
- **Triggers:** time, data-updated, logic-updated, and combinations of these. I could not confirm whether combinations are AND or OR.
- **Targets:**
  - a single dataset;
  - a dataset plus its upstream;
  - everything downstream of a dataset;
  - everything "connecting" two datasets.
- **Overlapping triggers:** a trigger that fires during a run queues exactly one follow-up run.
- **Run outcomes:** Succeeded, Ignored (everything is fresh), Failed.
- **Pausing** resets trigger state.
- **Scope:** *User mode* runs with the saver's permissions. *Project-scoped mode* runs independently of users. [Inference] Project scope is the right default for a product, so automations do not break when an employee leaves.
- **Action-triggered schedules** are in beta (May 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05

### 17. Global Branching

> Source: [general-references/01-palantir-data-layer.md § 17. Global Branching](../../general-references/01-palantir-data-layer.md#17-global-branching)

**Plain English.** One branch spans every tool: you change a pipeline, the object type, the action and the app together, test them, and merge them as a unit.

- **Branches and resources:** [Fact] https://www.palantir.com/docs/foundry/global-branching/core-concepts/
  - Ontology entities can be created or deleted on a branch without touching main.
  - *Creating or deleting other Foundry resources* on a branch does affect main.
  - Actions on a branch do not write edits to main. [Fact] https://www.palantir.com/docs/foundry/global-branching/overview/
- **Proposals and merging:**
  - A proposal must pass checks: conflicts with main, approvals, rebase status.
  - A "true conflict" means the same property was edited on both sides, and you pick one.
  - One rejection blocks the whole proposal.
  - Merge-time build options: modified resources plus everything between them, modified resources only, or nothing.
  - A partially failed merge cannot be reverted.
- **Lifecycle:** Active, Inactive (after 35 days by default, then branch-only data deleted after 7 days), Archived (manual, restorable), Merged (terminal). Palantir: "Active branches incur increased cost over time."
- **Integrations:** Workshop, OSDK (npm, Vite 6–8), AIP Logic, Automate, functions, Ontology, action types, materialisations, Object Views, Code Repositories, VS Code, Pipeline Builder, Model Studio, Restricted Views, Data Lineage, Workflow Lineage, Insight. [Fact] https://www.palantir.com/docs/foundry/global-branching/integrations/
- **Timeline (2026):**
  - GA the week of 18 May 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
  - Branch owner roles (17 Mar). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-03
  - TypeScript v2 and Python functions GA on branches (13 Oct), after migrating to a local OSDK. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-10
  - Note: the LLM platform summary still says TS v2 and Python functions cannot be modified on branches. It is stale relative to the October announcement. [Fact: sources disagree] https://www.palantir.com/docs/foundry/getting-started/foundry-platform-summary-llm/
- **Restricted Views on branches:** different markings on a branch and on main can expose restricted data. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07

## Open-source implementations

### 9. Durable ingestion depends on checkpoint meaning, not only timestamps

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#9-durable-ingestion-depends-on-checkpoint-meaning-not-only-timestamps)

The Airbyte PostgreSQL CDC bridge restores Debezium offsets and schema history, buffers change events, then emits state on count/time checkpoint intervals. dlt's incremental transform persists cursor values and can deduplicate overlapping cursor ranges by primary key. Its load process handles a crash after destination commit with a pending transition marker so a restored job does not blindly re-run the write.

**Design implication:** ingestion state should include source cursor/offset, schema version/history, stream identity, checkpoint boundary, destination commit and recovery state. “last_updated_at” alone is not a reliable CDC contract.

## Earlier engineering notes (Phase 2)

### Phase 2 research — source sync, dataset versions and build semantics

> Source: former `02-data-platform/phase2-sync-and-build-semantics.md` (moved here in the Nov 2026 restructure)

**Research date:** 27 November 2026  
**Evidence:** current Palantir official documentation; original Foundry data-layer study; Phase 2 architecture synthesis. No Palantir runtime was executed.

#### 1. What the data platform actually guarantees

Palantir's dataset documentation defines several distinct transaction modes:

- `SNAPSHOT` replaces the current dataset view with a new complete set of files.
- `APPEND` adds files without modifying existing files. It is the foundation for incremental pipelines.
- `UPDATE` can add files and overwrite existing files. If an existing file is overwritten, downstream append-only incremental processing is no longer valid and must fall back to snapshot/batch processing.
- `DELETE` removes files from the current view subject to the platform's transaction and retention semantics.

This is more precise than a generic label such as "incremental sync". The storage operation and the downstream computation mode must agree.

Official sources:
- https://www.palantir.com/docs/foundry/data-integration/datasets
- https://www.palantir.com/docs/foundry/transforms-python/incremental-usage
- https://www.palantir.com/docs/foundry/data-connection/file-based-syncs

#### 2. Build DAG semantics are not global ACID

A Foundry Build compiles job specifications into a dependency graph. Resolution checks for cycles and input availability/schema, opens output transactions (build locking), detects input conflicts and can reuse outputs whose inputs and logic have not changed. Independent jobs can execute in parallel.

Two guarantees need to be separated:

1. **Outputs from one job:** if one job defines multiple output datasets, they update together; the job cannot selectively build only one output.
2. **The full build graph:** if a job fails, dependent jobs and their open output transactions are terminated. Previously completed jobs may already have written outputs and are not globally rolled back.

Therefore, a multi-job build is not one all-or-nothing transaction. It is a coordinated dependency graph with job-level output grouping, dependency cancellation and freshness detection.

Official source: https://www.palantir.com/docs/foundry/data-integration/builds

#### 3. Branching is versioned state, not Git merge semantics

Dataset branches are pointers into transaction history. A branch has at most one open transaction, and each non-root branch has one parent. Dataset branches are not merged like source-code branches. Foundry combines code branches with data branches and fallback resolution when a build runs.

This creates a useful separation:
- Code version controls transformation logic.
- Data branch controls the dataset transaction lineage.
- Build resolution decides which JobSpec and dataset branch are used for each dependency.

Official source: https://www.palantir.com/docs/foundry/data-integration/branching

For our MVP, implement schema/model versions and reproducible source checkpoints first. Do not build a general branching data lake until a real collaborative modelling/use-case requires it.

#### 4. Proposed source-ingestion contract

A connector run should be an explicit durable state machine, not merely a cron invocation:

`CREATED → VALIDATING → EXTRACTING → STAGING → VALIDATING_OUTPUT → COMMITTED`

Failure path:
`... → FAILED` or `... → ABORTED`, with a resumable checkpoint where the source API permits it.

Minimum run record:
- `tenant_id`, `connector_id`, `source_object`, `run_id`
- source cursor / watermark / change token
- source schema fingerprint and connector version
- extraction window and source-side snapshot/version if available
- record count, inserted/updated/deleted/rejected counts
- staged object/file references and validation results
- commit pointer, timestamps, retry count, last error
- idempotency key and deduplication policy

The connector must not advance its source cursor before the corresponding staged data is durably committed. Replayed pages/events must converge to the same result.

#### 5. Recommended transaction patterns

| Source shape | Recommended ingestion | Canonical current state |
|---|---|---|
| Small reference table with reliable full export | Snapshot into versioned staging, validate, atomically switch active version | Latest validated source version |
| Append-only events or activity history | Append with stable source event ID and sequence/watermark | Event log plus deterministic projections |
| Mutable invoices, matters, contacts, cases | CDC or incremental changed-record extraction with source version/updated sequence | Upsert by stable external key; retain source version and prior history |
| Source with unreliable timestamps/cursors | Periodic full reconciliation plus deduplicated deltas | Reconciled current-state table and visible drift report |
| Large document repository | Versioned document manifest + blob references + content/ACL sync checkpoints | Current document version plus prior versions |

Do not use append-only event semantics to pretend a mutable invoice is immutable. Conversely, do not overwrite the only copy of a business event when audit/history matters.

#### 6. Implications for our original architecture

1. Separate connector cursor state from domain object state.
2. Stage and validate source changes before changing the active version.
3. Use a source record key plus source version/sequence; a timestamp alone is not a reliable total ordering unless the source guarantees it.
4. Track deletions/tombstones explicitly. Absence from a partial sync is not proof of deletion.
5. Keep immutable source snapshots/events where the business needs auditability, with a current-state projection for operational queries.
6. A failed downstream transform must not silently invalidate already committed upstream outputs. Every dataset/materialization must expose the source version and build version it reflects.
7. Treat multi-job orchestration as a recoverable DAG with per-job commits, not a distributed transaction.

#### 7. Tests we need before adopting a design

- Replay the same page/event twice; verify exactly one logical source record.
- Crash after extracting but before commit; verify cursor does not advance.
- Crash after commit but before cursor acknowledgement; verify replay is idempotent.
- Overwrite an existing record in an append-only stream; ensure the system marks affected projections dirty or rebuild-required.
- Deliver out-of-order updates; ensure an older source version cannot overwrite a newer one.
- Delete a source record; verify tombstone and downstream relationship cleanup.
- Fail one transform after an upstream job completed; verify version lineage clearly shows the mixed build state.
- Change connector schema; test compatible additive change, breaking change, and unknown field policy.

#### Evidence limits

The findings above are based on public Foundry documentation, not Palantir's private implementation source. The original archive's detailed Foundry data layer note is preserved at `../sources/archive-original/01-palantir-data-layer.md`. No Foundry build or connector run was executed by this project.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Transaction model to copy from Palantir datasets:** four transaction types — `SNAPSHOT` (replace the view), `APPEND` (add files), `UPDATE` (add and may overwrite files), `DELETE`. An `UPDATE` that overwrites existing files breaks append-only incrementality downstream. Incremental logic must survive an occasional full `SNAPSHOT` recompute of an input. Sources: https://www.palantir.com/docs/foundry/data-integration/datasets , https://www.palantir.com/docs/foundry/building-pipelines/incremental-overview/
- **Object sync from an incremental source** (from the ontology pass): latest transaction wins per primary key; no duplicate keys inside one transaction. See [object-storage-and-indexing](../03-ontology-engine/object-storage-and-indexing.md#fact-check-notes).
- **Cursor and de-dup mechanics:** see [connectors-and-ingestion](connectors-and-ingestion.md#implementation-starting-points-from-source-code).

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed / New — dataset transactions.** Four types SNAPSHOT, APPEND, UPDATE, DELETE; UPDATE that overwrites files breaks the append-only requirement for incremental pipelines; Python incremental decorator now exposes `strict_append` and `v2_semantics`. Sources: https://www.palantir.com/docs/foundry/data-integration/datasets , https://www.palantir.com/docs/foundry/api-reference/transforms-python-library/api-incremental
- **New — Iceberg mapping.** Iceberg APPEND ↔ APPEND, OVERWRITE ↔ UPDATE, DELETE ↔ DELETE, REPLACE has no equivalent; Foundry captures a consistent multi-table snapshot at transaction start and retries the job on a conflicting commit. Sources: https://www.palantir.com/docs/foundry/iceberg/snapshots/ , https://www.palantir.com/docs/foundry/iceberg/transactions/

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
