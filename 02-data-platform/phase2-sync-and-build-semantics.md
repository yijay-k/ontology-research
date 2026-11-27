# Phase 2 research — source sync, dataset versions and build semantics

**Research date:** 27 November 2026  
**Evidence:** current Palantir official documentation; original Foundry data-layer study; Phase 2 architecture synthesis. No Palantir runtime was executed.

## 1. What the data platform actually guarantees

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

## 2. Build DAG semantics are not global ACID

A Foundry Build compiles job specifications into a dependency graph. Resolution checks for cycles and input availability/schema, opens output transactions (build locking), detects input conflicts and can reuse outputs whose inputs and logic have not changed. Independent jobs can execute in parallel.

Two guarantees need to be separated:

1. **Outputs from one job:** if one job defines multiple output datasets, they update together; the job cannot selectively build only one output.
2. **The full build graph:** if a job fails, dependent jobs and their open output transactions are terminated. Previously completed jobs may already have written outputs and are not globally rolled back.

Therefore, a multi-job build is not one all-or-nothing transaction. It is a coordinated dependency graph with job-level output grouping, dependency cancellation and freshness detection.

Official source: https://www.palantir.com/docs/foundry/data-integration/builds

## 3. Branching is versioned state, not Git merge semantics

Dataset branches are pointers into transaction history. A branch has at most one open transaction, and each non-root branch has one parent. Dataset branches are not merged like source-code branches. Foundry combines code branches with data branches and fallback resolution when a build runs.

This creates a useful separation:
- Code version controls transformation logic.
- Data branch controls the dataset transaction lineage.
- Build resolution decides which JobSpec and dataset branch are used for each dependency.

Official source: https://www.palantir.com/docs/foundry/data-integration/branching

For our MVP, implement schema/model versions and reproducible source checkpoints first. Do not build a general branching data lake until a real collaborative modelling/use-case requires it.

## 4. Proposed source-ingestion contract

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

## 5. Recommended transaction patterns

| Source shape | Recommended ingestion | Canonical current state |
|---|---|---|
| Small reference table with reliable full export | Snapshot into versioned staging, validate, atomically switch active version | Latest validated source version |
| Append-only events or activity history | Append with stable source event ID and sequence/watermark | Event log plus deterministic projections |
| Mutable invoices, matters, contacts, cases | CDC or incremental changed-record extraction with source version/updated sequence | Upsert by stable external key; retain source version and prior history |
| Source with unreliable timestamps/cursors | Periodic full reconciliation plus deduplicated deltas | Reconciled current-state table and visible drift report |
| Large document repository | Versioned document manifest + blob references + content/ACL sync checkpoints | Current document version plus prior versions |

Do not use append-only event semantics to pretend a mutable invoice is immutable. Conversely, do not overwrite the only copy of a business event when audit/history matters.

## 6. Implications for our original architecture

1. Separate connector cursor state from domain object state.
2. Stage and validate source changes before changing the active version.
3. Use a source record key plus source version/sequence; a timestamp alone is not a reliable total ordering unless the source guarantees it.
4. Track deletions/tombstones explicitly. Absence from a partial sync is not proof of deletion.
5. Keep immutable source snapshots/events where the business needs auditability, with a current-state projection for operational queries.
6. A failed downstream transform must not silently invalidate already committed upstream outputs. Every dataset/materialization must expose the source version and build version it reflects.
7. Treat multi-job orchestration as a recoverable DAG with per-job commits, not a distributed transaction.

## 7. Tests we need before adopting a design

- Replay the same page/event twice; verify exactly one logical source record.
- Crash after extracting but before commit; verify cursor does not advance.
- Crash after commit but before cursor acknowledgement; verify replay is idempotent.
- Overwrite an existing record in an append-only stream; ensure the system marks affected projections dirty or rebuild-required.
- Deliver out-of-order updates; ensure an older source version cannot overwrite a newer one.
- Delete a source record; verify tombstone and downstream relationship cleanup.
- Fail one transform after an upstream job completed; verify version lineage clearly shows the mixed build state.
- Change connector schema; test compatible additive change, breaking change, and unknown field policy.

## Evidence limits

The findings above are based on public Foundry documentation, not Palantir's private implementation source. The original archive's detailed Foundry data layer note is preserved at `../sources/archive-original/01-palantir-data-layer.md`. No Foundry build or connector run was executed by this project.
