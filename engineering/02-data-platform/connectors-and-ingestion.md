# Connectors and ingestion

**Layer:** [02-data-platform](README.md) · **What it is:** Getting data out of source systems: connector types, extraction, webhooks, the source-record contract and reliability rules.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (4) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Open-source implementations](#open-source-implementations) (2) · [Other companies and products](#other-companies-and-products) (3) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (8)

## Palantir

### 2. Data Connection: sources, workers, agents, capabilities

> Source: [general-references/01-palantir-data-layer.md § 2. Data Connection: sources, workers, agents, capabilities](../../general-references/01-palantir-data-layer.md#2-data-connection-sources-workers-agents-capabilities)

**Plain English.** A "source" is a saved connection, for example "our Postgres at db.acme.com with this password". You then attach "capabilities" to it: pull a table every hour, stream a Kafka topic, push a webhook. The work runs either inside Palantir's cloud or through a small agent installed in the customer's network.

**Data model.** [Fact] https://www.palantir.com/docs/foundry/data-connection/core-concepts/
- **Source** = connector type + target location (usually a URL) + encrypted credentials + an assigned **worker**.
- Some sources need no stored secret. They authenticate with OIDC, outbound applications or cloud identities.

**Workers and networking.** [Fact] https://www.palantir.com/docs/foundry/data-connection/core-concepts/ , https://www.palantir.com/docs/foundry/data-connection/architecture/
- **Foundry worker** (formerly "direct connection"):
  - Capabilities run in Foundry's containerised job execution.
  - It is the only worker type that supports "use in code".
  - Network reach is defined by **egress policies**. A *direct connection policy* means the public internet, or the installed network for private Foundry. An *agent proxy policy* tunnels through an agent.
- **Agent proxy:**
  - The agent opens an **outbound websocket** to Foundry and acts purely as a network tunnel. All processing stays in the Foundry worker.
  - Multiple agents can load-balance.
  - Credentials are encrypted in the platform, and the keys are also held in the platform.
  - Available only on Rubix-based enrollments.
- **Agent worker (legacy):**
  - The agent polls Foundry over outbound HTTPS and runs tasks on the customer host.
  - Credentials are encrypted with AES-128-GCM, with keys on the agent. Decrypted credentials are cleared from memory after use.
  - It cannot be used from code. Palantir recommends migrating away.
- **Agent host requirements:** [Fact] https://www.palantir.com/docs/foundry/data-connection/set-up-agent/
  - 64-bit Linux (RHEL 8+ or Ubuntu 22.04+), 4 cores, 16 GB RAM, 500 GB at `/opt`.
  - Open-files limit 262,144; process limit 65,536.
  - One agent per host. Outbound-only traffic.
  - Connectivity test: `/magritte-coordinator/api/ping`. Automatic upgrade windows.

**Capabilities.** [Fact] core-concepts page
- **Batch syncs** come in two kinds: file batch (schema-less) and table batch (schema-based). Each run is transactional, so a failed run commits nothing.
- **Iceberg syncs** write directly to Iceberg (Foundry worker only).
- **Streaming syncs** read Kafka, Kinesis, Pub/Sub and similar.
- **CDC syncs** are streaming syncs plus changelog metadata.
- **Media syncs** write to media sets.
- **HyperAuto** is SAP-only. It discovers the schema and generates syncs, pipelines and Ontology.
- **Exports** come in three kinds: file, table and streaming.
- **Webhooks**, **virtual tables**, **virtual media**, **exploration**, and **use in code**:
  - external transforms (Python),
  - external functions (TypeScript `fetch` or Python `requests`),
  - compute modules (any language, long-running),
  - custom CI.
- The older YAML/Java "tasks" plugin model is sunset.

**Philosophy.** Ingest raw data "as-is", with minimal transformation at sync time. Every cleaning step happens downstream, where it is versioned and has lineage. Syncs pull "in small batches with low-complexity queries", with automatic retries. [Fact] https://www.palantir.com/docs/foundry/data-connection/overview/

**Batch sync settings and limits.** [Fact] https://www.palantir.com/docs/foundry/data-connection/set-up-sync/
- The transaction type is SNAPSHOT or APPEND.
- Table syncs can be incremental on a **monotonically increasing column**, and are then written as APPEND.
- File syncs take a subdirectory plus filters, including "exclude files already synced".
- Syncs on a Foundry worker are auto-cancelled after **about 48 hours**.
- A "build policy" can restrict when a sync may run.
- Timezone-less timestamps are synced as strings by default.
- Schema changes are **blocked by default**.
- Writing into an existing dataset is discouraged.

**Cost change (2026).** Foundry-worker data ingest, export, media ingest and Iceberg extract have incurred **no compute charges from August 2026**. They were previously billed as transforms, and no credits are issued for past charges. Streaming ingest is still billed. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-10 . From **1 Nov 2026**, streaming ingest on Foundry worker is "expected to cost ~97.5% less". [Vendor claim] https://www.palantir.com/docs/foundry/announcements/2026-11
- The **Foundry connector** (Foundry-to-Foundry, batch, incremental and streaming) has been GA since 15 Jan 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-01

### 3. Exports

> Source: [general-references/01-palantir-data-layer.md § 3. Exports](../../general-references/01-palantir-data-layer.md#3-exports)

**Plain English.** Exports push Foundry data back out, for example writing a cleaned table into the customer's Postgres.

**Detail.** [Fact] https://www.palantir.com/docs/foundry/data-connection/export-overview/
- **File export:** exports only files changed since the last successfully exported upstream transaction.
- **Streaming export:** start/stop jobs that resume from the last position. Targets are Kinesis, SQS, Pub/Sub, Kafka, PostgreSQL and Solace. On replay you must choose one of two behaviours: re-export everything (duplicates possible) or skip replayed records (some records may never be exported).
- **Table export:** GA since June 2024.
  - Uses INSERT (plus TRUNCATE for truncating modes) into an *existing* table.
  - Requires 1:1 column names and types and Parquet files. Array, Map and Struct columns fail.
  - Supported for custom JDBC.
- **Six table-export modes**, normalised from older options. The recommended one is "efficiently mirror": export the transactions not yet exported, and truncate on SNAPSHOT. Another mode, "fail if not APPEND", guarantees no duplicates.
- **Only the master branch is exported.** Exports do not transform data.
- Since June 2025, an export with no new data reports `success`.
- **Governance:**
  - Exports must be enabled per source by the source Owner together with someone holding the Information Security Officer role.
  - Only data whose markings and organisations are on the source's "exportable markings" allowlist can leave.
  - An escape hatch, "exports without markings validation", exists for webhooks in functions and for custom CI.

### 4. Webhooks (outbound) and listeners (inbound)

> Source: [general-references/01-palantir-data-layer.md § 4. Webhooks (outbound) and listeners (inbound)](../../general-references/01-palantir-data-layer.md#4-webhooks-outbound-and-listeners-inbound)

**Plain English.** A webhook is a parameterised HTTP call that Foundry makes to another system, typically fired when a user clicks an Action button such as "Create ticket in Jira". A listener is a URL that Foundry exposes so other systems can push events in.

**Webhooks.** [Fact] https://palantir.com/docs/foundry/data-connection/webhooks-reference/
- Each webhook is bound to exactly one source, which holds the credentials. [Fact] https://www.palantir.com/docs/foundry/data-connection/webhooks-overview/
- **Inputs** are typed: Boolean, Integer, Long, Double, String (optionally enum-constrained), Date, Timestamp, List, Record, Optional, and Attachment.
- Request bodies are Handlebars templates.
- **Outputs** can be the whole response, extracted by key path, or extracted by index. They can be chained into later calls with `@` references and written back into objects through Actions.
- A legacy rule allowed only one non-GET ("unsafe") call per webhook. Configurable status codes control retry and "external system not changed" handling.
- **Limits:**
  - time limit default **20 s**, maximum **180 s**;
  - a concurrency limit;
  - a rate limit per second, minute, hour or day.
- **Publishing:** a webhook can be published as a function, which cannot be undone. It is then callable from Workshop, TypeScript v2 and Python functions, the OSDK, function-backed actions and Automate.
- **Audit:** responses are retained **6 months** by default. Full input and response history is visible only to the caller, unless someone holds `webhooks:read-privileged-data`.

**HTTPS listeners.** [Fact] https://palantir.com/docs/foundry/data-connection/listeners-https/
- They write to a **stream**. About **100 req/s**, **1 MB** maximum per event; larger events are rejected.
- Around 25 provider presets (GitHub, Slack, Stripe, Shopify, Zendesk, Twilio and others), which handle each provider's message signing.
- They can run on a dedicated subdomain, and endpoints can be rotated without downtime.
- Public beta from 8 Jan 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-01
- WebSocket and email listeners are also listed. [Fact] https://www.palantir.com/docs/foundry/getting-started/foundry-platform-summary-llm/

### 10. Media sets

> Source: [general-references/01-palantir-data-layer.md § 10. Media sets](../../general-references/01-palantir-data-layer.md#10-media-sets)

**Plain English.** A media set is a folder of PDFs, images, audio or video that share a format. It comes with built-in operations (OCR, transcription, rendering) and can be referenced from objects.

[Fact] https://www.palantir.com/docs/foundry/data-integration/media-sets/ , https://www.palantir.com/docs/foundry/media-sets-advanced-formats/media-set-settings , https://palantir.com/docs/foundry/media-sets-advanced-formats/media-usage-limits/
- **Transaction policies:**
  - *Transactionless*: items are readable immediately, concurrent writers are allowed, a failed build leaves partial items, and there is no item upload limit.
  - *Transactional*: one open transaction per branch; commit or abort applies all-or-nothing; maximum **10,000 items per transaction**.
- **Retention:** two policies can run together — "older than N" (from upload time) and "N after being overwritten or deleted". Shortening a window takes effect immediately and cannot be undone.
- **Paths:** uploading to an existing path overwrites the item; older versions are kept in version history.
- **Limits:** maximum **50 GB** per item; path up to 256 characters; no cap on total items. Throttling returns 429 or 503.
- **Compute rates (compute-seconds per GB processed):**
  - download or stream: 2;
  - resize, rotate, page count, render page: 40;
  - raw text extraction, crop, audio transcode: 75;
  - OCR, transcription, video transcode, embeddings, layout-aware extraction, VLM extraction (plus VLM usage): 275.
- **2026 additions:**
  - `.eml` email items are GA, with attachment and body extraction (9 Apr 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-04?hl=en-US
  - Incremental media-set inputs in Pipeline Builder (7 Apr 2026). [Fact] same
  - Media sets in Faster pipelines (9 Jun 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-06
  - PDF text extraction v2 uses PyMuPDF on CPU. "~10x faster" than v1 (Tesseract/Docling) (19 May 2026). [Vendor claim] https://www.palantir.com/docs/foundry/announcements/2026-05
  - Media uploads on global branches (10 Nov 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-11
- **Ontology:** a "media reference property" links an object to an item. Administrators can configure which markings that property inherits per media source (22 Jan 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-01

## Lingyang, AgentOne and Alibaba

### 11. Data platforms (one paragraph each)

> Source: [general-references/08-alibaba-stack.md § 11. Data platforms (one paragraph each)](../../general-references/08-alibaba-stack.md#11-data-platforms-one-paragraph-each)

- **MaxCompute** (formerly ODPS). Serverless cloud data warehouse with storage and compute separated, tiered storage (Standard, Infrequent Access, Archive), and the OpenLake lakehouse. The MaxFrame Python framework is pandas-compatible and integrates with PAI. Announcements mention SQL "AI Function" capabilities and model objects, but the page gives no specific function list. KAG has an `odps_scanner` to read from it. [Fact] [overview, updated 10 Oct 2026](https://www.alibabacloud.com/help/en/maxcompute/product-overview/what-is-maxcompute); KAG repo.
- **DataWorks.** Integration, development, governance and analytics over MaxCompute, EMR, Hologres, Flink, AnalyticDB, StarRocks and PAI. Data Map handles the catalog and lineage; Data Quality handles rules. Copilot shipped in 2024. Data Agent and MCP features are not mentioned on the overview page. [Fact] [overview](https://www.alibabacloud.com/help/en/dataworks/product-overview/what-is-dataworks). [Inference] The lineage and quality-rule metadata is the obvious source for an ontology's metric definitions in Alibaba-centric customers.
- **Hologres.** PostgreSQL-compatible real-time warehouse combining ingestion, sub-second OLAP and high-QPS point serving. It has built-in Proxima vector retrieval. Full-text, AI functions and MCP are not on the overview page. [Fact] [overview, updated 17 Sep 2026](https://www.alibabacloud.com/help/en/hologres/product-overview/what-is-hologres)
- **AnalyticDB for PostgreSQL.** Can serve as the customer-owned vector store behind Bailian knowledge bases ("self-purchased ADB-PG"). [Fact] [rag-knowledge-base](https://help.aliyun.com/zh/model-studio/rag-knowledge-base). Its own product page did not render. [Unverified beyond this]
- **PolarDB.** Not opened; the fetch budget was exhausted. [Unverified]
- **PAI.** Alibaba claims PAI completed Qwen post-training in five days. [Vendor claim] [blog 603589](https://www.alibabacloud.com/blog/alibaba-unveils-roadmap-on-full-stack-ai-strategy-from-chips-cloud-infrastructure-models-to-agents_603589). The product page did not render. [Unverified]
- **Context Engine / Agent Context / OpenLake (Apsara 2026).** Agent Context offers real-time context and long-term memory, claimed to cut tokens by up to 67%. OpenLake claims −38% total cost and −40% query time. [Vendor claim] Same blog.

## Open-source implementations

### 26. Connectors and OAuth: dlt, Airbyte, Nango, Pipedream, mycontext

> Source: [open-source-references/dlt-airbyte-and-connectors.md](../../open-source-references/dlt-airbyte-and-connectors.md) (code study)

- **dlt**: Apache-2.0, Python, version 1.32.0. The declarative `rest_api` source config has a `client{base_url, headers, auth, paginator}`, and each `resources[]` entry has an `endpoint{path, method, params (with resolve-from-parent or incremental binds), data_selector (JSONPath), paginator, response_actions, incremental{cursor, start_param, end_param}}`. There are sources for sql_database and filesystem. [Fact] ([sources/rest_api/typing.py](https://github.com/dlt-hub/dlt/blob/HEAD/dlt/sources/rest_api/typing.py))
- **Airbyte**: the platform repository is ELv2 (`LICENSE`, copyright "Airbyte, Inc."). There are 703 connector directories, each with its own licence in `metadata.yaml` (for example `source-hubspot`: `license: ELv2`, certified). The Python CDK repository is MIT. Its low-code declarative schema, `declarative_component_schema.yaml`, is 6,077 lines. [Fact] ([airbyte-python-cdk](https://github.com/airbytehq/airbyte-python-cdk/blob/HEAD/airbyte_cdk/sources/declarative/declarative_component_schema.yaml))
- **Nango**: ELv2 at the repository root, with packages marked `Elastic-2.0` or "SEE LICENSE". `packages/providers/providers.yaml` has 1,441 top-level provider entries. Each entry gives `auth_mode`, `authorization_url`/`token_url` with `${connectionConfig.*}` templating, `default_scopes`, `token_response_metadata`, `proxy.base_url`, webhook routing scripts and `connection_config` fields (the Salesforce entry is an example). [Fact] ([providers.yaml](https://github.com/NangoHQ/nango/blob/HEAD/packages/providers/providers.yaml))
- **Pipedream**: the "Pipedream Source Available License 1.0" defines an "Excluded Purpose" as any commercial use. [Fact] ([LICENSE](https://github.com/PipedreamHQ/pipedream/blob/HEAD/LICENSE))
- Verdict, per tool:
  - Nango: self-hosting it as an internal component behind your SaaS is arguably not "providing the software as a hosted service", but that reading is mine and should be checked by a lawyer [Inference]. The safer path is Nango Cloud (paid) or writing OAuth for the 5–10 systems you need.
  - dlt: copy its config grammar for a TypeScript sync engine.
  - Airbyte: ignore the platform.
  - Pipedream: ignore entirely.

### Repository audit — dlt and Airbyte ingestion patterns

> Source: [open-source-references/dlt-airbyte-and-connectors.md](../../open-source-references/dlt-airbyte-and-connectors.md) (repository audit)

These projects are studied as **source ingestion/connector infrastructure**, not as ontology engines. Their job is to acquire changes from external systems, checkpoint progress, normalize records and deliver data packages. They should feed the platform's data layer; they should not own business ontology semantics by accident.

**Snapshots:** `dlt-hub/dlt` branch `devel`; `airbytehq/airbyte` branch `master`, 27 November 2026. Selected source modules inspected remotely. No builds or tests run.

#### dlt — pipeline lifecycle and state

##### Code paths inspected

- [Pipeline.extract / normalize / load / run](https://github.com/dlt-hub/dlt/blob/devel/dlt/pipeline/pipeline.py)
- [Incremental resource state](https://github.com/dlt-hub/dlt/blob/devel/dlt/extract/incremental/__init__.py)
- [Load job recovery](https://github.com/dlt-hub/dlt/blob/devel/dlt/load/load.py)
- [Normalize step](https://github.com/dlt-hub/dlt/blob/devel/dlt/normalize/normalize.py)

##### Trace A — extract writes packages and checkpoint state

`Pipeline.extract` creates an `Extract` step over extract/normalize storage, converts inputs into configured sources/resources, executes the sources and calls `_bump_version_and_extract_state` as schema boundaries are crossed and when extraction completes. It then commits extracted packages. The method is wrapped by state-sync and schema-sync decorators and runtime tracing. The extraction stage is therefore responsible for resource iteration, per-pipeline state and durable intermediate packages—not simply streaming rows directly into a warehouse destination.

##### Trace B — normalize produces destination-ready packages

`Pipeline.normalize` checks whether extraction produced a schema, obtains destination capabilities, creates a `Normalize` worker with schema, normalize and load storage configurations, then runs the normalize pool. Its docstring states that it infers schema and creates load packages. The destination is needed because normalization must respect destination capabilities.

##### Trace C — load is job-based and supports crash recovery

`Pipeline._load` constructs a `Load` step and runs it through a worker pool. `Load.resume_started_jobs` checks for jobs left in the started folder. If a pending transition marker exists (written after the destination committed), it creates a restored job and marks it terminal without executing the write again; otherwise it restores and resubmits the started job. That mechanism prevents a crash after destination commit but before local job-state transition from blindly repeating the same job.

##### Trace D — incremental cursor is not only a watermark

`Incremental` is an item transform with persistent state. It stores a cursor value between runs and can use a primary key to deduplicate overlapping records that share cursor values. The source comments explicitly describe cursor state and primary-key dedup. The actual strategy still depends on the source exposing a reliable cursor field/order and on its update semantics.

##### What to learn from dlt

- Separate extraction, schema normalization and destination loading.
- Persist intermediate packages so steps can recover independently.
- Treat schema state and incremental cursor state as pipeline state, not process memory.
- Use source cursor + key dedup to handle overlapping windows, and document late-arriving/update limitations.
- Make load job transitions recoverable around destination commits.

#### Airbyte — connector/CDC architecture

##### Code paths inspected

- [Postgres source implementation](https://github.com/airbytehq/airbyte/tree/master/airbyte-integrations/connectors/source-postgres/src/main/kotlin/io/airbyte/integrations/source/postgres)
- [Postgres partition model](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-postgres/src/main/kotlin/io/airbyte/integrations/source/postgres/PostgresSourceJdbcPartition.kt)
- [Partition creator](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-postgres/src/main/kotlin/io/airbyte/integrations/source/postgres/PostgresSourceJdbcPartitionsCreator.kt)
- [Debezium bridge](https://github.com/airbytehq/airbyte/blob/master/airbyte-cdk/java/airbyte-cdk/db-sources/src/main/kotlin/io/airbyte/cdk/integrations/debezium/AirbyteDebeziumHandler.kt)
- [CDC state contract](https://github.com/airbytehq/airbyte/blob/master/airbyte-cdk/java/airbyte-cdk/db-sources/src/main/kotlin/io/airbyte/cdk/integrations/debezium/CdcStateHandler.kt)

##### Trace A — snapshot/partition reads have resumable cursor semantics

The current Postgres connector defines different partition classes, including non-resumable snapshot partitions and cursor-backed partitions. The inspected file imports common JDBC abstractions for partitioning and defines an `xmin` cursor upper-bound query based on transaction snapshot/current transaction ID. The partition creator builds either concurrent or ordinary JDBC partition strategies. The implementation is richer than a single `SELECT *` loop: it includes partition splitting, cursor/upper-bound logic and state models. This audit did not read every partition factory branch or SQL query generator.

##### Trace B — CDC uses Debezium with persisted offsets and schema history

`AirbyteDebeziumHandler.getIncrementalIterators` initializes an offset store from previously saved state and optionally initializes schema-history storage. It starts a Debezium record publisher feeding a bounded blocking queue, wraps it in an iterator with shutdown/target-position handling, and constructs a `DebeziumMessageProducer`. It then wraps the event iterator in `SourceStateIterator`, configured to emit checkpoints by record count and/or elapsed duration. `CdcStateHandler` is the connector-level contract for saving offset and schema-history state and for snapshot-completion state; checkpoint emission is separately feature-flagged.

This makes an important distinction: CDC is not just a “stream of changes”. The connector needs a durable source offset, schema history, conversion from source change events to records and a checkpoint contract so the destination can safely acknowledge progress.

##### What to learn from Airbyte

- Connector interfaces standardize discovery/read/state while database-specific code owns source peculiarities.
- CDC state needs both offsets and schema history; schema evolution can make an old offset uninterpretable without schema context.
- Queue capacity, backpressure, checkpoint frequency and graceful shutdown are explicit runtime concerns.
- Snapshot and CDC paths are different execution modes and need an explicit transition/hand-off policy.
- Connector metadata should include capabilities, supported sync modes, primary keys and cursor semantics.

#### dlt vs Airbyte

| Dimension | dlt | Airbyte |
|---|---|---|
| Primary abstraction | Python data pipeline, resource extraction and destination load jobs | Connector platform with source/destination protocol and CDK |
| State | Pipeline state, incremental cursors, schema versions, load package state | Per-stream sync state, database cursor or CDC offset/schema history |
| Intermediate artifacts | Local/package storage between extract, normalize and load | Protocol messages/checkpoints and connector runtime state |
| Crash recovery example | Pending load transition after destination commit | CDC offsets + schema history and state-message cadence |
| Best fit in our architecture | Flexible app/API extraction, lightweight pipelines, transformation/load | Standardized enterprise source connector ecosystem and database CDC |
| Not provided | Ontology identity, governance and business action lifecycle | Ontology identity, semantic model and business actions |

#### Open questions

- Check dlt source tests for state restoration, primary-key dedup and load-job transition crash windows.
- Inspect Airbyte PostgreSQL integration tests and Debezium event/state tests; identify source version and feature flags.
- Compare licensing and supported connector maturity at point of adoption; Airbyte CDK/connector licensing may vary by module/connector.
- Reproduce snapshot-to-CDC handoff and crash recovery against a real test database before relying on it.

## Other companies and products

### 1.3 How it works underneath

> Source: [general-references/24-integration-companies.md § 1.3 How it works underneath](../../general-references/24-integration-companies.md#13-how-it-works-underneath)

- **The Airbyte Protocol** is the contract between the platform and every connector. Every actor (source or destination) implements `spec()` and `check(config)`. Sources add `discover(config)`, which returns a catalog, and `read(config, configured_catalog, state)`, which returns a message stream. Destinations add `write(config, configured_catalog, stream of messages)`. All output is wrapped in an `AirbyteMessage` envelope, one JSON object per line on STDOUT, with STDERR reserved for logs. The message types are RECORD, STATE, LOG, TRACE, CONTROL, SPEC, CATALOG and CONNECTION_STATUS. The protocol was at v0.19.0 on 10 October 2025. [Fact] ([protocol](https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md))
- **State and checkpointing.**
  - The state blob belongs to the source; the platform and the destination treat it as opaque.
  - The destination echoes back each state message only after every record before it has been committed. That echo is what makes partial success safe.
  - There are three state types: per-stream (isolated, so streams can be parallelised and reset individually), global (a shared part plus per-stream parts, used by CDC), and legacy (deprecated).
  - Rules: always emit state, even for zero records; never emit the same state twice in a row with records in between; destinations must return state in the order received.
  [Fact] (same). This is the most transferable design in the company. [Inference]
- **Two data channels.** Legacy mode passes JSONL through STDIO and the orchestrator. Socket mode sends Protocol Buffers over several Unix sockets, with the socket count defaulting to min(source CPU, destination CPU) × 2, and sends control messages to a "Bookkeeper". An `ArchitectureDecider` component picks the mode for each sync. [Fact] (same)
- **The declarative manifest** (worked example: Xero). It has:
  - a `DatetimeBasedCursor` on `UpdatedDateUTC`, with the start value injected as an `If-Modified-Since` header;
  - `PageIncrement` pagination at 1,000 records per page;
  - an `OAuthAuthenticator` against `identity.xero.com/connect/token`, or a bearer token;
  - a `CompositeErrorHandler`: 401 fails, 403 is ignored, 429 with "daily limit" fails, other 429s retry with exponential backoff;
  - 20 streams, including invoices, credit_notes, payments, overpayments, prepayments, bank_transactions and contacts.
  [Fact] ([Xero manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-xero/manifest.yaml)). The Xero docs page lists the limits as 5 concurrent calls, 60 a minute and 5,000 a day per tenant. [Fact] ([Xero docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/xero.md))
- **QuickBooks manifest (v5.15.0).**
  - An `HTTPAPIBudget` with a moving-window policy of 10 calls per second and 500 per minute.
  - Concurrency of 4 by default, up to 40.
  - Intuit fault codes 3200 and 3201 are mapped to config errors.
  - Each stream runs a query of the form `SELECT * FROM X WHERE Metadata.LastUpdatedTime > a AND <= b AND Active IN (true,false) ORDER BY … STARTPOSITION n MAXRESULTS 1000`. The `Active` clause is what makes soft deletes arrive.
  - A computed `airbyte_cursor` field copies `MetaData.LastUpdatedTime`.
  - Refresh tokens rotate about every 24 hours and expire after 100 days of disuse, so a token must never be shared between two tools.
  [Fact] ([QuickBooks manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml), [QuickBooks docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/quickbooks.md))
- **NetSuite** (Python, alpha). It discovers streams at runtime from the account's REST record metadata catalog and authenticates with TBA, using HMAC-SHA256. It walks history in "Window in Days" slices with up to a day of look-back. The role decides what can actually be read: a record the role cannot read still appears as a stream but returns `INSUFFICIENT_PERMISSION`. [Fact] ([NetSuite docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md))
- **Email.** Gmail is certified and manifest-only. It replicates messages, drafts, threads, labels and the profile. With your own OAuth client it can use the narrower `gmail.readonly` scope (Cloud's flow asks for `gmail.modify`), and service-account keys cannot read a mailbox. Outlook (alpha) reads `/me/messages` with `Mail.Read`. [Fact] ([Gmail docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/gmail.md), [Outlook docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/outlook.md))
- **Capacity model.** On Pro and Flex, each running sync uses part of a data worker: about 0.5 for a database, 0.25 for a file, 0.2 for an API. Allocations are set per region in steps of 0.5. Queued syncs have no ordering and each rechecks capacity about once a minute. Manual syncs left queued for 8 hours are cancelled. [Fact] ([data workers](https://github.com/airbytehq/airbyte/blob/master/docs/platform/cloud/managing-airbyte-cloud/manage-data-workers.md))
- **Cloud limits**: up to 1,000 streams per discover call, 1,000 streams per connection, 20,000 fields per connection and 20 MB per record. [Fact] ([limits](https://github.com/airbytehq/airbyte/blob/master/docs/platform/cloud/managing-airbyte-cloud/understand-airbyte-cloud-limits.md))
- **Permissions in the agent layer.** Agents act with the Airbyte permissions of the person using the MCP. The stored connector credentials decide which records can be seen, and the docs warn that those credentials may see more than the person could. Organisation admins turn agent access and search on or off; workspace editors choose the resources. [Fact] ([manage access](https://github.com/airbytehq/airbyte/blob/master/docs/platform/context-layer/manage-access.md)). This is a weakness the founder's product should fix: it should enforce per-user and per-object permissions on top of a shared service credential. [Inference]

### 4. dlt and dltHub

> Source: [general-references/24-integration-companies.md § 4. dlt and dltHub](../../general-references/24-integration-companies.md#4-dlt-and-dlthub)

**In one paragraph.** dlt (Apache-2.0, Python, version 1.32.0 on 17 November 2026) is an open-source library. You write a Python pipeline that pulls from a REST API, database or files and loads typed, schema-evolving tables into DuckDB, Postgres, Snowflake and other destinations. dltHub (ScaleVector GmbH, Berlin) sells a managed platform on top of it. [Fact] ([dlt repo](https://github.com/dlt-hub/dlt)). The buyers are Python data engineers and, more and more, people driving coding agents.

**Function catalogue.**
- *dlt OSS*:
  - sources and resources, incremental cursors, merge (upsert) write dispositions, schema inference and evolution, and state kept in the destination;
  - the declarative `rest_api` source (client, auth, paginator, endpoints with parent-child resolution, data selectors, incremental parameters);
  - `sql_database`, `filesystem` and `pg_replication`;
  - verified sources (about 30 listed in the docs tree, including HubSpot, Salesforce, Stripe, Zendesk, Google Sheets and `inbox`, which reads email over IMAP and fetches attachments).
  [Fact] ([verified-sources docs](https://github.com/dlt-hub/dlt/tree/devel/docs/website/docs/dlt-ecosystem/verified-sources); study 14). There are **no Xero, QuickBooks or NetSuite verified sources** in that tree. [Fact, from the docs tree listing]
- *dltHub platform*: an "agent-native" workspace with dev, prod and access profiles; an AI Harness that scaffolds pipelines through Claude Code, Codex or Cursor; transformations; data-quality checks and alerts; managed runs and a scheduler; a "Playground" destination; dashboards and data apps; and platform agents (`AGENT.md` definitions). [Fact] ([dltHub introduction](https://github.com/dlt-hub/dlt/blob/devel/docs/website/docs/hub/getting-started/introduction.md))

**Licence trap.** The dltHub platform and toolkits are under a commercial dltHub Licence. It allows use only "in connection with dltHub Services", and it defines Derivative Works to include code generated with the help of the licensed toolkits. [Fact] ([dltHub licence](https://github.com/dlt-hub/dlt/blob/devel/docs/website/docs/hub/license.md)). Plain `dlt` stays Apache-2.0. The founder should use the library, not the AI toolkits, for anything shipped in the product. [Inference]

**Commercials.** dltHub pricing was not read this round. [Unverified]

**What to copy**: the `rest_api` configuration grammar (study 14) and destination-stored state, so the pipeline can resume from the warehouse itself. **Relationship**: a **teacher**, and a possible **supplier** if part of the stack is in Python. [Inference]

### 8. The concrete answer: what a one-person company should buy, use as open source and build

> Source: [general-references/24-integration-companies.md § 8. The concrete answer: what a one-person company should buy, use as open source and build](../../general-references/24-integration-companies.md#8-the-concrete-answer-what-a-one-person-company-should-buy-use-as-open-source-and-build)

**The job**: read invoices, payments and credit notes, incrementally and with deletes and voids, from Xero, QuickBooks Online and NetSuite for each customer company. Write back a small set of things: notes, reminder history, and later payment allocations. Send and read email from the customer's own mailbox.

#### 8.1 What each system demands

| | Xero | QuickBooks Online | NetSuite |
|---|---|---|---|
| **OAuth** | OAuth 2.0 authorisation code with `offline_access`; one connection can cover several tenants, so pick the tenant with `Xero-Tenant-Id`. Also offers client credentials ("custom connections") for a single organisation [Fact] ([Nango providers](https://github.com/NangoHQ/nango/blob/master/packages/providers/providers.yaml), [Airbyte Xero manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-xero/manifest.yaml)) | OAuth 2.0; `realmId` is returned on the redirect; refresh tokens **rotate about every 24 hours** and expire after 100 days unused, so store each new token atomically and never share one [Fact] ([Airbyte QBO docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/quickbooks.md)) | OAuth 2.0 (scope `rest_webservices`, account-specific URLs) or TBA (OAuth 1.0a). **No new TBA integrations can be created from 2027.1**, so build on OAuth 2.0. The customer's admin must create an integration record and a role [Fact] ([Airbyte NetSuite docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md), [Nango providers](https://github.com/NangoHQ/nango/blob/master/packages/providers/providers.yaml)) |
| **Rate limits** | 5 concurrent, 60 a minute and 1,000 (Starter) or 5,000 a day per organisation, 10,000 a minute per app; egress over the tier's allowance costs A$2.40 per GB [Fact] ([Xero FAQ](https://developer.xero.com/faq/pricing-and-policy-updates)) | 500 a minute per realm; Airbyte budgets 10 per second. Read calls are metered per Intuit partner tier [Fact] (Airbyte QBO docs; [Apideck](https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program)) | Concurrency is governed per account and shared with SOAP and RESTlets [Fact] (Airbyte NetSuite docs) |
| **Incremental sync** | `If-Modified-Since` header on `UpdatedDateUTC`; pages of 1,000 [Fact] (Xero manifest) | Query on `Metadata.LastUpdatedTime` with `Active IN (true,false)`; `STARTPOSITION`/`MAXRESULTS` 1,000 [Fact] (QBO manifest). Intuit also has a Change Data Capture endpoint [Unverified this round] | Date-windowed queries on last-modified date with up to a day of look-back (Airbyte). SuiteQL is an alternative [Fact for Airbyte's approach; SuiteQL unverified] |
| **Deletes and voids** | Voided and deleted invoices come through as status changes on update [Inference; check against Xero docs] | Soft delete through `Active=false`; hard-deleted transactions need CDC [Fact for Active; CDC unverified] | Deletions need a saved search or deleted-record query [Unverified] |
| **Webhooks** | Yes: contact and invoice events (and others), signed with a webhook key, plus "intent to receive" validation [Fact] ([Nango Xero webhooks](https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/xero/webhooks.mdx)). Payments and credit notes still need polling [Unverified] | Yes: Intuit webhooks recommended to cut GET calls [Fact as reported] (Apideck) | No native outbound webhooks for REST; would need a SuiteScript user-event script or polling [Unverified] |
| **Write-back** | POST and PUT for invoices, credit notes, payments and allocations; the Nango tools exist [Fact] (Nango Xero functions) | Writes are free (Core) under Intuit's programme [Fact as reported] | REST record create and update; the Nango tools exist [Fact] (Nango NetSuite functions) |
| **Ledger-vendor fee** | Xero tier by connections: Core A$35 a month for up to 50 connections, Plus A$245 for up to 1,000 [Fact] ([Xero](https://developer.xero.com/pricing)) | Builder is free up to 500,000 reads a month, then blocked; Silver is $300 a month [Fact as reported] | No API fee; the customer's licence and SuiteCloud Plus decide concurrency [Unverified] |

#### 8.2 The options, side by side

| Option | OAuth | Rate limits | Incremental sync | Webhooks | Write-back | Cost at 20 customers × 3 ledgers + email | Licence |
|---|---|---|---|---|---|---|---|
| **A. Build everything** (own OAuth apps, own sync engine) | You build token storage, rotation locks and re-consent flows | You build per-tenant budgets | You build cursors (copy the Airbyte rules) | You build receivers and signature checks | You build | Ledger fees only (Xero Core A$35, Intuit Builder $0) plus hosting | n/a |
| **B. Nango plus your own sync engine** (recommended) | Nango, white-labelled | Nango proxy honours retry-after; you add budgets | Nango syncs (fork the prebuilt ones), or your engine pulling through the proxy | Nango routes Xero and Gmail webhooks | Nango tools | About $50 to $100 a month on pay-as-you-go: 60 to 100 connections × $0.29 plus compute [Inference], plus ledger fees | ELv2 for the code, but you use Nango Cloud, so no issue |
| **C. Unified API** (Merge, Apideck, Rutter) | Vendor's link UI | Vendor | Vendor cache (Merge, Rutter) or pass-through with virtual webhooks (Apideck) | Vendor webhooks | Vendor; Merge passthrough needs Professional | Merge about $650 + $65 × 50 = about $3,900 a month; Apideck $599+ a month; Rutter not published | Commercial |
| **D. Airbyte Cloud as ingestion** | Airbyte's OAuth app or yours | Built into the manifests | Excellent (state protocol) | None (scheduled syncs) | None for ledgers (data activation goes from a warehouse to CRMs) | Credits are cheap, but 60 sources plus connections, and no tenant isolation behind your product | ELv2: allowed to bring data in for your customers; not allowed to expose Airbyte's UI or API |
| **E. Agent tool platforms** (Composio, Arcade, Merge Agent Handler, Zapier MCP) | Managed | Vendor | **None**: per-call tools, no stored, deduplicated history | Triggers on some | Yes, per call | $0.005 to $0.01 per call, or 2 Zapier tasks per call | Commercial |

#### 8.3 Recommendation [Inference, built on the facts above]

1. **Buy:**
   - **Nango pay-as-you-go** for OAuth, token rotation, webhook routing and the proxy, covering Xero, QuickBooks, NetSuite (OAuth 2.0), Gmail and Outlook. Register **your own** OAuth apps with each provider so you own the customer relationship and can leave Nango later.
   - **Xero Core or Plus** and **Intuit Builder, then Silver**, paid directly. These fees cannot be avoided whichever option you pick.
   - **Reducto or LlamaParse**, pay-as-you-go, for scanned remittances.
   - Optionally, **Rutter**, *only* when a customer needs MYOB, QuickBooks Desktop or Sage 50.
2. **Use as open source:**
   - the **Airbyte connector manifests and docs** (ELv2) as a *specification* to read, not code to ship;
   - **dlt** (Apache-2.0), only if a Python side job is wanted;
   - **Docling** (MIT) for clean PDFs.
   - Do not embed n8n, Pipedream or the Airbyte platform.
3. **Build:**
   - A small **sync engine in TypeScript and Postgres**: per-customer, per-object cursors stored as an opaque state blob that advances only after the row commit (the Airbyte state rule); per-tenant rate budgets (Xero 60 a minute and the daily cap, QBO 500 a minute); the soft-delete and void rules; and a nightly full reconcile of open invoices to catch missed deletes.
   - The **normalised receivables model**: invoice, payment, credit note, allocation and customer, each with a `source_ref` back to the ledger record.
   - **Webhook-triggered targeted re-reads**: a webhook only marks a record dirty, and the poller fetches it.
   - **Write-back** limited to safe actions (notes, reminder logs), with payment allocation behind human approval.
   - **Email** through Gmail and Graph directly, using Nango tokens: `history.list` and `watch` for Gmail, delta queries and subscriptions for Graph. Send from the customer's own mailbox.
4. **Trade-offs to accept:**
   - With Nango you depend on one vendor for credentials. Keep your own OAuth client IDs so you could migrate.
   - Building your own sync means owning the edge cases of three ledgers. Copying the Airbyte rules shortens that work.
   - SQL Account and AutoCount (Malaysia) have no integration vendor. They need a desktop agent or a file-import path, and should be scoped separately.
   - Xero's no-AI-training clause: never put Xero data into fine-tuning or training datasets, and document this in the data-processing terms.

## Design decisions already in the reference maps

### 5. Connectors: Xero, QuickBooks Online, NetSuite and email (buy, use or build)

> Source: [general-references/33-map-context-code-integration.md § 5. Connectors: Xero, QuickBooks Online, NetSuite and email (buy, use or build)](../../general-references/33-map-context-code-integration.md#5-connectors-xero-quickbooks-online-netsuite-and-email-buy-use-or-build)

**Purpose.** Bring each customer company's invoices, payments, credit notes and contacts in incrementally (including deletes and voids), write back a small set of safe things, and read and send email from the customer's own mailbox. Receivables example: a payment applied in Xero at 10:02 shows up as a reduced overdue balance before the 10:30 reminder run.

**Design to implement.**

Buy/use/build decision (document 24, section 8.3 [Inference built on facts]):
- **Buy Nango pay-as-you-go** for OAuth, token refresh and rotation, webhook routing and the authenticated proxy across Xero, QuickBooks, NetSuite (OAuth 2.0), Gmail and Outlook. Price: $50 a month including $50 of usage, then $0.29 per connection per month, $0.72 per compute hour, $0.50 per GB egress; Free tier capped at 10 connections, 10 compute hours, 10 GB [Fact]. Self-hosting is Enterprise only [Fact]. Licence ELv2, but using Nango Cloud avoids the hosted-service question (document 24). Register **your own** OAuth apps with each provider so you can leave Nango later.
- **Pay the ledger vendors directly** — unavoidable whichever option: Xero tiers since 2 March 2026 from Starter (free, 5 connections, 1,000 calls per day per organisation) through Core (A$35 a month, up to 50 connections), Plus (A$245, up to 1,000) to Advanced (A$1,445, 10,000 connections, 250 GB egress), with A$2.40 per GB over allowance on every tier [Fact]. Intuit: Builder free up to 500,000 metered read calls a month, then blocked; Silver $300 a month for 1 million, $3.50 per 1,000 over; writes free [Fact, via a secondary source written by Apideck]. NetSuite: no API fee; the customer's licence and SuiteCloud Plus decide concurrency [Unverified].
- **Build** a TypeScript + Postgres sync engine and the normalised receivables model.
- **Use as specification only** the Airbyte manifests and docs (ELv2; read, do not ship), and dlt's `rest_api` config grammar (Apache-2.0).
- **Do not use** Airbyte Core as the engine (Kubernetes and Java services, per-customer sources, ELv2 forbids exposing its UI or API), store-everything unified APIs below three ledgers, agent tool platforms as a system of record, Pipedream (no commercial use), n8n (licence unverified), the dltHub toolkits (derivative-works clause).

Connector contract (copied from the Airbyte Protocol [Fact]):
- `spec()`, `check(config)`, `discover(config) → catalog`, `read(config, configuredCatalog, state) → stream of {RECORD | STATE | LOG | TRACE}`.
- State is an opaque blob owned by the source; the sink commits records, then persists the state that followed them. Rules: always emit state, even for zero records; never emit the same state twice in a row with records between; process state in order.
- Per-stream state: one cursor per object type per customer ledger, so one stream can be reset alone.
- Declarative per-stream config in the dlt grammar: `client {base_url, headers, auth, paginator}`, `resources[] {endpoint {path, method, params (parent binds, incremental binds), data_selector, paginator, response_actions, incremental {cursor, start_param, end_param}}}` [Fact].
- Tables [Inference]: `sync_connections(org_id, connection_id, provider, nango_connection_id, status, schema_change_policy)`, `sync_streams(org_id, connection_id, stream, state jsonb, last_success_at, egress_bytes)`, normalised `ar_invoice`, `ar_payment`, `ar_credit_note`, `ar_allocation`, `ar_customer`, each with `source_ref` back to the ledger record (document 24, 8.3).

Per-system rules:

| | Xero | QuickBooks Online | NetSuite |
|---|---|---|---|
| OAuth | OAuth 2.0 authorisation code with `offline_access`; one connection can cover several tenants, pick with `Xero-Tenant-Id`; client-credentials "custom connections" for one organisation [Fact] | OAuth 2.0; `realmId` on redirect; refresh tokens rotate about every 24 hours and expire after 100 days unused; store each new token atomically; never share a token between tools [Fact] | OAuth 2.0 (scope `rest_webservices`, account-specific URLs). TBA (OAuth 1.0a) closed to new integrations from release 2027.1, so do not build on it. Customer admin must create an integration record and a role [Fact] |
| Rate budget | 5 concurrent, 60 a minute, daily cap per organisation (1,000 on Starter or 5,000), 10,000 a minute per app [Fact] | 500 a minute per realm; budget 10 a second (Airbyte `HTTPAPIBudget`), concurrency 4 default up to 40 [Fact] | Concurrency governed per account, shared with SOAP and RESTlets [Fact] |
| Incremental read | `If-Modified-Since` header on `UpdatedDateUTC`; pages of 1,000 [Fact] | `SELECT * FROM <Entity> WHERE Metadata.LastUpdatedTime > a AND <= b AND Active IN (true,false) ORDER BY … STARTPOSITION n MAXRESULTS 1000` [Fact] | Date-windowed queries on last-modified date with up to one day look-back; streams discovered from the REST record metadata catalog [Fact]; SuiteQL an alternative [Unverified] |
| Deletes, voids | Arrive as status changes on update [Inference; check Xero docs] | Soft delete via `Active=false` [Fact]; hard deletes need Intuit CDC [Unverified] | Saved search or deleted-record query [Unverified] |
| Errors | 401 = re-consent; 403 ignored by Airbyte; 429 with "daily limit" = stop until reset; other 429 = exponential backoff [Fact] | Fault codes 3200 and 3201 = config error, re-authorise [Fact] | Role cannot read a record type → `INSUFFICIENT_PERMISSION`; surface to customer admin per record type [Fact] |
| Webhooks | Yes: contact and invoice events, signed with a webhook key, "intent to receive" validation [Fact]; payments and credit notes may still need polling [Unverified] | Yes, recommended to cut metered GETs [Fact as reported] | No native REST webhooks; SuiteScript user-event script or polling [Unverified] |
| Write-back | POST/PUT for invoices, credit notes, payments, allocations; Nango tools exist [Fact] | Writes free under Intuit's programme [Fact as reported] | REST create/update; Nango tools exist [Fact] |
| Prebuilt in Nango | Syncs: accounts, bank transactions, contacts, credit notes, invoices, items, organisations, payments, purchase orders, journals; tools for create/get/list/update [Fact] | Create/get tools for invoices, payments, credit memos, customers, journal entries and more, plus list tools [Fact] | Syncs: credit notes, customers, invoices, payments, GL, locations (TBA); tools to create/update invoices, payments, credit notes, customers [Fact] |

Engine behaviours [Inference, from document 24's "What to copy" and 8.3]:
- Webhooks only mark a record dirty; the poller re-reads it. Route webhooks to a connection by a stored hash of the account identifier (Nango Gmail routing [Fact]).
- Nightly full reconcile of **open** invoices to catch missed deletes and voids.
- Two error classes: config errors pause the connection and email the customer's admin; transient errors retry with backoff; each code has a human-readable message (Airbyte manifests [Fact]).
- Schema-change policy per connection with Airbyte's four values (propagate field changes; propagate all; approve myself; stop syncs); auto-pause when a cursor or primary key disappears; a removed column is kept and filled with NULL [Fact].
- Rate budgets per tenant **and** per app; token-refresh locks with Postgres advisory locks (Nango uses Redis locks [Fact]; Postgres variant suggested in document 24 [Inference]).
- Track egress bytes per customer from day one, because Xero bills egress per GB [Fact]; avoid full re-pulls.
- Three access paths, each labelled with freshness in the agent's answer: synced tables, live direct reads through the proxy, and a search index (Airbyte context layer [Fact]).
- A connector "skill" document per source listing entities, actions and filters, which the agent reads before calling (Airbyte MCP [Fact]).
- Write-back in version 1 limited to notes and reminder logs; payment allocation behind human approval (document 24, 8.3).

Email:
- Gmail and Microsoft Graph called directly using Nango-held tokens (document 24, 8.3). Gmail: incremental via `history.list` from a stored `historyId`; push via `users.watch` to Pub/Sub; quota 1,200,000 units a minute per project and 6,000 per user; unit costs `messages.send` 100, `messages.get` 20 (60 full or raw), `messages.list` 5, `history.list` 2, `watch` 100 [Fact]. Use `gmail.readonly` where possible (Airbyte notes Cloud's flow asks for `gmail.modify`; service-account keys cannot read a mailbox) [Fact]. Restricted scopes need Google OAuth verification and an annual security assessment [Unverified].
- Graph: `/me/messages` or delta queries, `sendMail`, scopes `Mail.Read`, `Mail.Send`, `offline_access`, change notifications via subscriptions [Fact for scopes]; throttling limits [Unverified].
- Send reminders from the customer's own mailbox for deliverability and threading; a transactional sender only for "no-reply" [Inference].
- Fallback vendor: Nylas (Free 5 accounts; Essentials $15 for 10 then $2.25; Pro from $49 for 25 then $2.00; shared Google OAuth app $2,400 a year) [Fact].
- Attachments (remittances): two-phase ingestion (section 7); Docling self-hosted for clean PDFs; Reducto Extract (about $20 per 1,000 pages) or LlamaParse Cost-effective tier for scans; store extracted fields with confidence and a link to the source page [Fact for prices; Inference for the choice].

Licences that block commercial embedding: Nango and Airbyte platform ELv2 (Airbyte's FAQ allows bringing data in for your customers inside your product, forbids selling Airbyte as ELT or exposing its UI/API [Fact]); Pipedream excludes any commercial use and Workday agreed to acquire it on 19 Nov 2025 [Fact]; n8n Sustainable Use Licence [Unverified]; dltHub toolkit licence treats generated code as derivative [Fact]. Clean: dlt (Apache-2.0), Airbyte Python CDK (MIT) [Fact].

Contractual constraint: Xero's terms forbid using API data to train or contribute to any AI or ML model (developers registered from 4 Dec 2025; everyone from 2 Mar 2026) [Fact]. Never put Xero data into fine-tuning or training sets; check prompt caching, evaluation datasets and the self-learning loop (section 6) against the clause [Inference].

**Copies.**
- Document 24, section 1.3 and "What to copy" 1–2: protocol and state. https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md
- Document 24, "What to copy" 3–5: Xero, QuickBooks, NetSuite rules. https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-xero/manifest.yaml ; https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml ; https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/quickbooks.md ; https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md
- Document 24, "What to copy" 7: schema-change policy. https://github.com/airbytehq/airbyte/blob/master/docs/platform/using-airbyte/schema-change-management.md
- Document 24, "What to copy" 8–9: three access paths; skill document. https://github.com/airbytehq/airbyte/blob/master/docs/platform/context-layer/readme.md ; https://github.com/airbytehq/airbyte/blob/master/docs/platform/airbyte-mcp/tools.md
- Document 24, section 6.1: Nango pricing, prebuilt functions, webhook routing. https://nango.dev/pricing ; https://github.com/NangoHQ/nango/blob/master/docs/snippets/generated/xero/PreBuiltUseCases.mdx ; https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/google-mail/webhooks.mdx ; https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/xero/webhooks.mdx
- Document 24, section 8.1 and "What to copy" 15–16: Xero tiers, limits, egress, AI clause. https://developer.xero.com/pricing ; https://developer.xero.com/faq/pricing-and-policy-updates
- Document 24, key finding 1: Intuit metering (secondary). https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program
- Document 24, section 7.2: Gmail quota; Nylas. https://developers.google.com/workspace/gmail/api/reference/quota ; https://www.nylas.com/pricing/
- Document 14, section 26: dlt grammar. https://github.com/dlt-hub/dlt/blob/HEAD/dlt/sources/rest_api/typing.py
- Document 24, section 1.4 and licence FAQ. https://github.com/airbytehq/airbyte/blob/master/docs/community/licenses/license-faq.md

**Left out, and why.** Unified APIs (Merge about $3,900 a month at 20 customers × 3 ledgers by document 24's arithmetic; Apideck from $599; Unified.to from $750; Codat and Rutter unpublished): too expensive below three ledgers and, for Merge/Codat/Rutter, a second stored copy of the customer's ledger to explain in security reviews. Rutter kept as the option only when a customer needs MYOB, QuickBooks Desktop or Sage 50. Airbyte Cloud: not multi-tenant behind another product. Agent tool platforms (Composio $0.005 a call, Arcade $0.01, Zapier MCP two tasks per call): no stored, deduplicated history to compute metrics on. Copying Nango's `providers.yaml`: ELv2 data file; re-derive endpoints from providers' docs.

**Open questions.** Xero webhook coverage of payments and credit notes; Intuit CDC limits; NetSuite delete detection; Graph throttling; Google restricted-scope cost and timeline; whether Malaysian ledgers SQL Account and AutoCount expose any API (no integration vendor covers them [Fact]).

## Earlier engineering notes (Phase 2)

### Objective

> Source: former `02-data-platform/ingestion-and-source-of-truth.md` (moved here in the Nov 2026 restructure)

Bring data into the platform without erasing the external system's ownership or pretending every ingested fact is equally authoritative. Each connector should declare source identity, entity mappings, change semantics, deletion semantics, permissions available, watermarks, retry strategy and writeback capability.

### Proposed source record contract

> Source: former `02-data-platform/ingestion-and-source-of-truth.md` (moved here in the Nov 2026 restructure)

A connector output should include: `source_system`, `source_tenant`, `source_object_type`, `source_record_id`, `source_version` or ETag, `observed_at`, `ingested_at`, `operation` (upsert/delete), `payload`, `schema_version`, `source_acl` (if available), `lineage/run_id`, and connector diagnostics. This contract is a proposal; source-specific fields may be preserved in an extension envelope.

### Pipeline stages

> Source: former `02-data-platform/ingestion-and-source-of-truth.md` (moved here in the Nov 2026 restructure)

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

### Authority model

> Source: former `02-data-platform/ingestion-and-source-of-truth.md` (moved here in the Nov 2026 restructure)

Every property should have an authority policy: source-owned, ontology-owned, derived, user-editable overlay, or contested. A generic last-write-wins merge is unsafe for legal clauses, payment status, customer identity or contract obligations. Merge policy is property-specific and must define precedence, version conflict, review requirement and history retention.

### Ingestion reliability requirements

> Source: former `02-data-platform/ingestion-and-source-of-truth.md` (moved here in the Nov 2026 restructure)

- Connector run ledger and per-source watermark.
- Idempotent page/item processing.
- Tombstones and explicit deletion handling.
- Schema evolution and replay from a selected version/watermark.
- Backpressure, rate limits and source throttling.
- Dead-letter and quarantine for malformed records.
- Source ACL sync status and staleness measurement.
- Partial failure visible by connector/run/entity.
- Rebuildable projections and reconciliation jobs.

### References

> Source: former `02-data-platform/ingestion-and-source-of-truth.md` (moved here in the Nov 2026 restructure)

DataHub's workunit/source/emitter design is a useful metadata ingestion pattern; Airbyte and dlt are connector/data movement candidates from the original archive. OpenFoundry's object/outbox implementation demonstrates why cross-database writes need deterministic IDs and reconciliation. Fabric IQ demonstrates a different boundary: bind ontology definitions to source-owned data instead of necessarily copying all data into an ontology store.

### Connector categories

> Source: former `10-integration-platform/connector-and-writeback-contracts.md` (moved here in the Nov 2026 restructure)

1. Read-only ingestion connector (batch/CDC/webhook/file).
2. Query-time source adapter (live retrieval for freshness).
3. Writeback connector (execute named, constrained external commands).
4. Event listener/webhook receiver.
5. Document ingestion and export connector.

A connector must declare source identity, auth method, scopes, supported object types/operations, rate limits, retry semantics, webhook signatures, cursor model, idempotency support, ACL support, data residency, deletion and retention semantics, version/ETag support and connector version.

### Connector license and security

> Source: former `10-integration-platform/connector-and-writeback-contracts.md` (moved here in the Nov 2026 restructure)

The original archive flags ELv2/proprietary restrictions in several integration platforms and connector-specific licences. Audit the license for the specific connector and commercial deployment model; the platform's main licence does not necessarily cover every connector. Store OAuth tokens/secrets in a secrets manager, never in ontology objects or traces.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Incremental cursor contract — copy from dlt** ([`dlt-hub/dlt` → `dlt/extract/incremental/__init__.py`](https://github.com/dlt-hub/dlt/blob/f85861b/dlt/extract/incremental/__init__.py)). Parameters: `cursor_path`, `initial_value`, `last_value_func` (`max`/`min`/custom), `primary_key`, `end_value`, `row_order`, `on_cursor_value_missing` (default `raise`), `lag`, `range_start` (default `closed`), `range_end` (default `open`).
- **Persisted cursor state shape** ([`dlt-hub/dlt` → `dlt/common/incremental/typing.py`](https://github.com/dlt-hub/dlt/blob/f85861b/dlt/common/incremental/typing.py)): `{initial_value, last_value, unique_hashes[], start_value}`. Store this per (tenant, source, stream) row in Postgres.
- **Boundary de-duplication rule** ([`dlt-hub/dlt` → `dlt/extract/incremental/transform.py`](https://github.com/dlt-hub/dlt/blob/f85861b/dlt/extract/incremental/transform.py)): rows whose cursor equals the previous `last_value` are hashed on the primary key and dropped if the hash is already in `unique_hashes`; rows below the start value are dropped; the hash set is reset whenever a new maximum appears. De-dup is switched off when `lag` is set or `range_start` is `open` — then the destination must de-duplicate. This is the exact behaviour to port to a TypeScript sync engine.
- **Connector config grammar** to copy (not run): dlt's declarative `rest_api` source (client / resources / endpoint / paginator / incremental) — see [open-source-references/dlt-airbyte-and-connectors](../../open-source-references/dlt-airbyte-and-connectors.md).

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Changed — Airbyte licensing is broader ELv2 than the research's "licences vary per connector".** Airbyte's current licence page says connectors and everything in its public repos except `airbyte-protocol` are under ELv2, with the protocol MIT. An older FAQ page still says connectors and CDK are MIT. In the Python CDK repo, `LICENSE.txt` is MIT but `LICENSE_SHORT` reads "all rights reserved" — get a legal reading before copying any Airbyte code. Sources: https://docs.airbyte.com/community/licenses/ , https://airbyte.com/license-faq , https://github.com/airbytehq/airbyte-python-cdk
- **Confirmed (code) — dlt 1.32.0, Apache-2.0,** at f85861b.

## Gaps

- No research literature material in the research yet.
