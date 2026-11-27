# dlt, Airbyte, Nango, Pipedream (connectors and OAuth)

| | |
|---|---|
| **Repository** | <https://github.com/dlt-hub/dlt>, <https://github.com/airbytehq/airbyte-python-cdk>, <https://github.com/NangoHQ/nango>, <https://github.com/PipedreamHQ/pipedream> |
| **Why it matters** | How production connector frameworks handle cursors, checkpoints, CDC and OAuth — and their licences. |
| **What to take** | dlt's extract/normalize/load packages and incremental cursor semantics, Airbyte's resumable reads and Debezium offsets, Nango's provider config shape. |
| **What not to copy** | Airbyte platform and Nango code (ELv2), Pipedream (no commercial use); assuming a timestamp watermark is enough. |
| **Feeds** | [02-data-platform/connectors-and-ingestion](../engineering/02-data-platform/connectors-and-ingestion.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** Verdict, per tool: - Nango: self-hosting it as an internal component behind your SaaS is arguably not "providing the software as a hosted service", but that reading is mine and should be checked by a lawyer [Inference]. The safer path is Nango Cloud (paid) or writing OAuth for the 5–10 systems you need. - dlt: copy its config grammar for a TypeScript sync engine. - Airbyte: ignore the platform. - Pipedream: ignore entirely.

> **Source re-check 28 Nov 2026 (code):** [`dlt-hub/dlt@f85861b`](https://github.com/dlt-hub/dlt/tree/f85861b), [`airbytehq/airbyte-python-cdk@HEAD`](https://github.com/airbytehq/airbyte-python-cdk/tree/HEAD) — dlt 1.32.0. Airbyte now says connectors and public repos except the protocol are ELv2; CDK repo has mixed licence files — get legal review.

## From the open-source code study: 26. Connectors and OAuth: dlt, Airbyte, Nango, Pipedream, mycontext

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- **dlt**: Apache-2.0, Python, version 1.32.0. The declarative `rest_api` source config has a `client{base_url, headers, auth, paginator}`, and each `resources[]` entry has an `endpoint{path, method, params (with resolve-from-parent or incremental binds), data_selector (JSONPath), paginator, response_actions, incremental{cursor, start_param, end_param}}`. There are sources for sql_database and filesystem. [Fact] ([sources/rest_api/typing.py](https://github.com/dlt-hub/dlt/blob/HEAD/dlt/sources/rest_api/typing.py))
- **Airbyte**: the platform repository is ELv2 (`LICENSE`, copyright "Airbyte, Inc."). There are 703 connector directories, each with its own licence in `metadata.yaml` (for example `source-hubspot`: `license: ELv2`, certified). The Python CDK repository is MIT. Its low-code declarative schema, `declarative_component_schema.yaml`, is 6,077 lines. [Fact] ([airbyte-python-cdk](https://github.com/airbytehq/airbyte-python-cdk/blob/HEAD/airbyte_cdk/sources/declarative/declarative_component_schema.yaml))
- **Nango**: ELv2 at the repository root, with packages marked `Elastic-2.0` or "SEE LICENSE". `packages/providers/providers.yaml` has 1,441 top-level provider entries. Each entry gives `auth_mode`, `authorization_url`/`token_url` with `${connectionConfig.*}` templating, `default_scopes`, `token_response_metadata`, `proxy.base_url`, webhook routing scripts and `connection_config` fields (the Salesforce entry is an example). [Fact] ([providers.yaml](https://github.com/NangoHQ/nango/blob/HEAD/packages/providers/providers.yaml))
- **Pipedream**: the "Pipedream Source Available License 1.0" defines an "Excluded Purpose" as any commercial use. [Fact] ([LICENSE](https://github.com/PipedreamHQ/pipedream/blob/HEAD/LICENSE))
- Verdict, per tool:
  - Nango: self-hosting it as an internal component behind your SaaS is arguably not "providing the software as a hosted service", but that reading is mine and should be checked by a lawyer [Inference]. The safer path is Nango Cloud (paid) or writing OAuth for the 5–10 systems you need.
  - dlt: copy its config grammar for a TypeScript sync engine.
  - Airbyte: ignore the platform.
  - Pipedream: ignore entirely.

## Repository audit: Repository audit — dlt and Airbyte ingestion patterns

> Source: former `15-repository-audits/dlt-airbyte.md` (Phase 2 source inspection, not executed).

These projects are studied as **source ingestion/connector infrastructure**, not as ontology engines. Their job is to acquire changes from external systems, checkpoint progress, normalize records and deliver data packages. They should feed the platform's data layer; they should not own business ontology semantics by accident.

**Snapshots:** `dlt-hub/dlt` branch `devel`; `airbytehq/airbyte` branch `master`, 27 November 2026. Selected source modules inspected remotely. No builds or tests run.

### dlt — pipeline lifecycle and state

#### Code paths inspected

- [Pipeline.extract / normalize / load / run](https://github.com/dlt-hub/dlt/blob/devel/dlt/pipeline/pipeline.py)
- [Incremental resource state](https://github.com/dlt-hub/dlt/blob/devel/dlt/extract/incremental/__init__.py)
- [Load job recovery](https://github.com/dlt-hub/dlt/blob/devel/dlt/load/load.py)
- [Normalize step](https://github.com/dlt-hub/dlt/blob/devel/dlt/normalize/normalize.py)

#### Trace A — extract writes packages and checkpoint state

`Pipeline.extract` creates an `Extract` step over extract/normalize storage, converts inputs into configured sources/resources, executes the sources and calls `_bump_version_and_extract_state` as schema boundaries are crossed and when extraction completes. It then commits extracted packages. The method is wrapped by state-sync and schema-sync decorators and runtime tracing. The extraction stage is therefore responsible for resource iteration, per-pipeline state and durable intermediate packages—not simply streaming rows directly into a warehouse destination.

#### Trace B — normalize produces destination-ready packages

`Pipeline.normalize` checks whether extraction produced a schema, obtains destination capabilities, creates a `Normalize` worker with schema, normalize and load storage configurations, then runs the normalize pool. Its docstring states that it infers schema and creates load packages. The destination is needed because normalization must respect destination capabilities.

#### Trace C — load is job-based and supports crash recovery

`Pipeline._load` constructs a `Load` step and runs it through a worker pool. `Load.resume_started_jobs` checks for jobs left in the started folder. If a pending transition marker exists (written after the destination committed), it creates a restored job and marks it terminal without executing the write again; otherwise it restores and resubmits the started job. That mechanism prevents a crash after destination commit but before local job-state transition from blindly repeating the same job.

#### Trace D — incremental cursor is not only a watermark

`Incremental` is an item transform with persistent state. It stores a cursor value between runs and can use a primary key to deduplicate overlapping records that share cursor values. The source comments explicitly describe cursor state and primary-key dedup. The actual strategy still depends on the source exposing a reliable cursor field/order and on its update semantics.

#### What to learn from dlt

- Separate extraction, schema normalization and destination loading.
- Persist intermediate packages so steps can recover independently.
- Treat schema state and incremental cursor state as pipeline state, not process memory.
- Use source cursor + key dedup to handle overlapping windows, and document late-arriving/update limitations.
- Make load job transitions recoverable around destination commits.

### Airbyte — connector/CDC architecture

#### Code paths inspected

- [Postgres source implementation](https://github.com/airbytehq/airbyte/tree/master/airbyte-integrations/connectors/source-postgres/src/main/kotlin/io/airbyte/integrations/source/postgres)
- [Postgres partition model](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-postgres/src/main/kotlin/io/airbyte/integrations/source/postgres/PostgresSourceJdbcPartition.kt)
- [Partition creator](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-postgres/src/main/kotlin/io/airbyte/integrations/source/postgres/PostgresSourceJdbcPartitionsCreator.kt)
- [Debezium bridge](https://github.com/airbytehq/airbyte/blob/master/airbyte-cdk/java/airbyte-cdk/db-sources/src/main/kotlin/io/airbyte/cdk/integrations/debezium/AirbyteDebeziumHandler.kt)
- [CDC state contract](https://github.com/airbytehq/airbyte/blob/master/airbyte-cdk/java/airbyte-cdk/db-sources/src/main/kotlin/io/airbyte/cdk/integrations/debezium/CdcStateHandler.kt)

#### Trace A — snapshot/partition reads have resumable cursor semantics

The current Postgres connector defines different partition classes, including non-resumable snapshot partitions and cursor-backed partitions. The inspected file imports common JDBC abstractions for partitioning and defines an `xmin` cursor upper-bound query based on transaction snapshot/current transaction ID. The partition creator builds either concurrent or ordinary JDBC partition strategies. The implementation is richer than a single `SELECT *` loop: it includes partition splitting, cursor/upper-bound logic and state models. This audit did not read every partition factory branch or SQL query generator.

#### Trace B — CDC uses Debezium with persisted offsets and schema history

`AirbyteDebeziumHandler.getIncrementalIterators` initializes an offset store from previously saved state and optionally initializes schema-history storage. It starts a Debezium record publisher feeding a bounded blocking queue, wraps it in an iterator with shutdown/target-position handling, and constructs a `DebeziumMessageProducer`. It then wraps the event iterator in `SourceStateIterator`, configured to emit checkpoints by record count and/or elapsed duration. `CdcStateHandler` is the connector-level contract for saving offset and schema-history state and for snapshot-completion state; checkpoint emission is separately feature-flagged.

This makes an important distinction: CDC is not just a “stream of changes”. The connector needs a durable source offset, schema history, conversion from source change events to records and a checkpoint contract so the destination can safely acknowledge progress.

#### What to learn from Airbyte

- Connector interfaces standardize discovery/read/state while database-specific code owns source peculiarities.
- CDC state needs both offsets and schema history; schema evolution can make an old offset uninterpretable without schema context.
- Queue capacity, backpressure, checkpoint frequency and graceful shutdown are explicit runtime concerns.
- Snapshot and CDC paths are different execution modes and need an explicit transition/hand-off policy.
- Connector metadata should include capabilities, supported sync modes, primary keys and cursor semantics.

### dlt vs Airbyte

| Dimension | dlt | Airbyte |
|---|---|---|
| Primary abstraction | Python data pipeline, resource extraction and destination load jobs | Connector platform with source/destination protocol and CDK |
| State | Pipeline state, incremental cursors, schema versions, load package state | Per-stream sync state, database cursor or CDC offset/schema history |
| Intermediate artifacts | Local/package storage between extract, normalize and load | Protocol messages/checkpoints and connector runtime state |
| Crash recovery example | Pending load transition after destination commit | CDC offsets + schema history and state-message cadence |
| Best fit in our architecture | Flexible app/API extraction, lightweight pipelines, transformation/load | Standardized enterprise source connector ecosystem and database CDC |
| Not provided | Ontology identity, governance and business action lifecycle | Ontology identity, semantic model and business actions |

### Open questions

- Check dlt source tests for state restoration, primary-key dedup and load-job transition crash windows.
- Inspect Airbyte PostgreSQL integration tests and Debezium event/state tests; identify source version and feature flags.
- Compare licensing and supported connector maturity at point of adoption; Airbyte CDK/connector licensing may vary by module/connector.
- Reproduce snapshot-to-CDC handoff and crash recovery against a real test database before relying on it.
