# Palantir Foundry's data layer, bolt by bolt

**Scope note (21 November 2026).** This covers the part of Foundry that sits "south of the Ontology": getting data in (Data Connection), storing and versioning it (datasets, Iceberg tables, views, streams, media sets), transforming it (Pipeline Builder, Python/Java/SQL transforms, compute engines), orchestrating it (builds, schedules, JobSpecs), watching it (lineage, Data Health, expectations), packaging it (DevOps/Marketplace), branching it (Global Branching), metering it, and handing it to the Ontology (Funnel indexing). Everything comes from palantir.com/docs pages and the monthly 2026 announcements, all read on 21 Nov 2026 unless stated otherwise. Docs pages carry no publication dates, so "as of" means the date I read them. Gaps: the turn's web-search budget ran out (200 calls, shared by every agent in the turn), and then the per-hour fetch budget ran out too. I could not open the Data Catalog page, the Java and SQL transforms pages, the compute-modules body, the Iceberg overview body, the Iceberg branching page, or any page on Ontology-volume pricing. Those items are marked [Unverified] or left open.

Labels: [Fact] = stated on the cited page. [Vendor claim] = Palantir's marketing or a benchmark claim. [Inference] = my reasoning. [Unverified] = no source found.

---

## Key findings

1. **The core storage primitive is "Git for data": a dataset is a set of files in a Hadoop-compatible store (HDFS or S3), plus a transaction log.** There are four transaction types: SNAPSHOT, APPEND, UPDATE and DELETE. A "view" is computed by starting at the latest SNAPSHOT and replaying the transactions after it. DELETE only removes file references; only retention policies free bytes. [Fact] https://www.palantir.com/docs/foundry/data-integration/datasets/
2. **Dataset branches are linear pointers and are never merged.** Builds resolve each input through a fallback chain (for example `feature → master`) and write only to the build branch. Code is what gets merged. Data is rebuilt on the target branch. [Fact] https://www.palantir.com/docs/foundry/data-integration/branching/
3. **Orchestration is declarative.** Committing code publishes a JobSpec (inputs as InputSpecs, plus outputs). A build compiles a job graph from the JobSpecs, rejects cycles, locks outputs by opening a transaction on each, skips "fresh" outputs (inputs and logic unchanged), and runs independent jobs in parallel. Jobs that finished before a failure are not rolled back. [Fact] https://www.palantir.com/docs/foundry/data-integration/builds/
4. **Palantir now defaults to single-node engines, not Spark.** Polars is the recommended Python default. DataFusion ("Faster pipelines") has been Pipeline Builder's default since 3 Nov 2026. Spark is reserved for inputs over roughly 50 GB or 200M rows. Lightweight containers default to 2 cores and are capped by default at 8 cores and 64 GB. [Fact] https://www.palantir.com/docs/foundry/transforms-python/compute-engines/ , https://palantir.com/docs/foundry/transforms-python/configure-resources/ , https://www.palantir.com/docs/foundry/announcements/2026-11
5. **The pipeline maturity ladder is explicit: batch, then incremental, then streaming.** Incremental reaches minute-level latency and is supported only in Python and Java. Streaming (Flink) is for sub-minute needs and is "very high" cost, because resources are always allocated. [Fact] https://palantir.com/docs/foundry/building-pipelines/pipeline-types/
6. **Incremental correctness is mechanical.** Inputs may only receive appended files; any SNAPSHOT or overwrite forces a full recompute. `semantic_version` bumps force a snapshot. `require_incremental` turns silent fallback into a failure. [Fact] https://www.palantir.com/docs/foundry/transforms-python/incremental-reference/
7. **The Ontology is fed by Funnel, a four-stage pipeline: changelog diff, merge with Action edits on the primary key, index, then hydrate onto search-node disks.** Indexing is incremental by default. It switches to a full reindex if more than 80% of rows change, the schema changes, or a user triggers it. A schema change starts a "replacement pipeline" that runs alongside the live one and swaps in after its first success. [Fact] https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/
8. **CDC is defined by metadata, not by special storage.** You declare a primary key, a numeric ordering column and a boolean deletion column, and resolution is "max ordering per key, drop if deleted". The same three-field contract appears in Views, streams, Pipeline Builder "Key By" and Funnel. The Ontology indexes by arrival order and ignores the ordering column. [Fact] https://www.palantir.com/docs/foundry/data-integration/change-data-capture/
9. **Compute is metered in "compute-seconds": `max(vCPU, GiB_RAM / 7.5)` × instances × seconds.** Metering is on allocation, not utilisation. Streaming is multiplied by a 0.5 usage rate. Storage is GB-months, sampled hourly. Deleted-but-retained files still count. [Fact] https://palantir.com/docs/foundry/resource-management/usage-types/ , https://palantir.com/docs/jp/foundry/building-pipelines/streaming-compute-usage/
10. **Ingest is getting cheaper in 2026.** From August 2026, Foundry-worker batch ingest, export, media ingest and Iceberg extract carry no compute charge. From 1 Nov 2026, streaming ingest on Foundry worker is about 97.5% cheaper. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-10 , https://www.palantir.com/docs/foundry/announcements/2026-11
11. **Interop is now Iceberg-first.** Managed Iceberg tables and an Iceberg REST catalog went GA on 15 Sep 2026, with credential vending, OAuth2 client credentials and a customer-owned-bucket option. Virtual tables over Snowflake, Databricks and BigQuery are GA, with compute pushdown through Snowpark, PySpark and Ibis respectively. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09 , https://www.palantir.com/docs/foundry/iceberg/authentication/ , https://www.palantir.com/docs/foundry/data-integration/virtual-tables/
12. **Global Branching (GA week of 18 May 2026) spans pipelines, Ontology, functions, Workshop and more.** Inactive branches are de-indexed after 35 days and their branch-only data is deleted 7 days later. Palantir says outright that active branches cost more. [Fact] https://www.palantir.com/docs/foundry/global-branching/core-concepts/ , https://www.palantir.com/docs/foundry/announcements/2026-06
13. **Quality checks split into two tiers.** Build-time "expectations" in code can abort a job (`on_error='FAIL'`). Post-hoc "health checks" (job status, schedule status and duration, TSLU, data and sync freshness) run after jobs finish and cannot stop a build. Monitoring views add Low, Medium and High alerting with PagerDuty, Slack and webhook channels. [Fact] https://palantir.com/docs/foundry/data-health/check-types/ , https://palantir.com/docs/foundry/monitoring-views/overview/
14. **Packaging works by dependency inference.** DevOps walks dependencies and exposes anything not packaged as an "input" the installer must map. Products are capped at 15,000 inputs plus outputs, counting columns and properties. [Fact] https://www.palantir.com/docs/foundry/foundry-devops/create-products/
15. **Inbound and outbound connectivity are first-class, and the limits are documented.** Outbound webhooks time out at 20 s by default (180 s max) and can be rate- and concurrency-limited. Inbound HTTPS listeners take about 100 requests/s with a 1 MB payload limit and write to a stream. [Fact] https://palantir.com/docs/foundry/data-connection/webhooks-reference/ , https://palantir.com/docs/foundry/data-connection/listeners-https/

---

## Breakdown

### 1. Architecture context: where the data layer sits

**Plain English.** Foundry has three layers. The bottom one stores and computes on raw data. The middle one (the Ontology) turns rows into business objects such as "Order" or "Customer". The top one holds the apps and agents. This document is about the bottom layer and how it hands data upward.

**Detail.**
- Palantir calls the bottom layer the **Multimodal Data Plane (MMDP)**. It is drawn beneath the Ontology layer and has four parts. [Fact] https://www.palantir.com/docs/foundry/architecture-center/multimodal-data-plane/
  - **Open data layer:** Apache Iceberg is the primary table format, alongside media, documents, streams and geospatial data.
  - **Open compute layer:** autoscaling Spark for batch, autoscaling Flink for streaming, and single-node DataFusion, Polars and DuckDB. Compute Modules let customers bring their own containers, and compute can be pushed down to Databricks or Snowflake.
  - **Model layer.**
  - **Deployment layer:** Apollo.
- Every runtime runs on **Rubix**, a Kubernetes-based compute mesh. Each container is destroyed and recreated within **72 hours** (zero-trust node cycling). [Fact] same page
- Palantir describes transforms as running "south of the Ontology" (raw data → Ontology) and interactive functions as "north of the Ontology". [Fact] same page
- Scale claims: "300+ microservices" across AIP and Foundry; "tens of thousands" of Apollo releases per week. [Vendor claim] https://www.palantir.com/docs/foundry/architecture-center/overview/
- The architecture overview groups "Data Services" as connectivity, transformation, virtualisation, storage, health monitoring and management. [Fact] same page

**For the founder.** [Inference] The useful idea is the split: the raw data plane is commodity (open formats, swappable engines), and the value sits in the semantic layer above it. A 100–1,000-person company already has Postgres, a warehouse or SaaS APIs. Copy the *contract* between the layers, not the engines.

### 2. Data Connection: sources, workers, agents, capabilities

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

### 5. Datasets: files, schemas, transactions, views, retention

**Plain English.** A dataset is like a Git repository whose commits are batches of Parquet files. "Replace everything" is a SNAPSHOT commit. "Add these new files" is an APPEND commit.

**Storage.** [Fact] https://www.palantir.com/docs/foundry/data-integration/datasets/
- Files are not stored "in" Foundry. A mapping points each logical path to a physical path under a base directory in a Hadoop FileSystem (HDFS, S3 and similar).
- Formats: Parquet, Avro, or Text (CSV and JSON, with parse settings in `customMetadata`).
- Semi-structured data (JSON, XML) lands in schema-less datasets and is given a schema downstream.

**Transactions.**
- States: `OPEN` → `COMMITTED` or `ABORTED`.
- **SNAPSHOT** replaces the view.
- **APPEND** adds files only; committing an overwrite fails.
- **UPDATE** adds files and may overwrite. Overwriting breaks downstream incrementality; adding only new files does not.
- **DELETE** removes file *references* only.
- Worked example: SNAPSHOT(A,B), APPEND(C), UPDATE(A→A'), DELETE(B) gives the view {A', C}.
- Recommended sync patterns: SNAPSHOT for a batch mirror; APPEND when the source only adds files; UPDATE only when the source modifies existing files.

**Views (dataset versions).** A view is the effective file set on a branch at a point in time. It is computed from the latest SNAPSHOT forward, so the number of views equals the number of SNAPSHOTs. [Fact] same page

**Schema.**
- The schema is metadata attached to a view, and it can change between views. Files are not guaranteed to match it.
- Types: BOOLEAN, BYTE, SHORT, INTEGER, LONG, FLOAT, DOUBLE, DECIMAL (maximum precision 38; suggested default 38,18), STRING, MAP, ARRAY, STRUCT, BINARY, DATE, TIMESTAMP. [Fact] same page

**Retention.** Because DELETE frees no bytes, retention policies are the only way to reclaim storage. Viewing retention policies is in beta and needs Palantir Support to enable. [Fact] same page. Storage billing confirms that deleted files keep accruing until retention removes them. [Fact] https://palantir.com/docs/foundry/resource-management/usage-types/

**2026 additions.**
- **Time Travel** (beta, 23 Jul 2026): a single-version view, a range diff between two versions (with a key column, edits show as modifications rather than remove-plus-add), and bisect to find when a row or cell changed. Only versions still inside retention can be inspected. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07
- **Compare tab** (17 Nov 2026): primary-key diff across versions, branches or two different resources, with per-column match rates. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-11

### 6. Branching (dataset level)

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

### 7. Views (union datasets with key-based deduplication)

[Fact] https://www.palantir.com/docs/foundry/data-integration/views/
- A View has no files of its own. It is a read-time union of backing datasets that share the same column names and types.
- Views can be transform inputs but not outputs.
- They "build" almost instantly because no data moves, and a build schedule is created automatically.
- **Optional primary key**, which cannot be changed later:
  - plus **ordering column(s)**: the highest value wins;
  - plus an optional **Boolean deletion column**, applied after deduplication.
- Implementation: an automatically created projection plus window-function filter logic evaluated on every read.
- The filter costs almost nothing while the projection is current and backing datasets have received only APPEND or UPDATE transactions. A full projection rebuild means readers apply the filter without the projection until it finishes, at "considerable" compute cost.
- Do not use a View over incremental datasets as an incremental input. Incremental reads deduplicate only within the transaction range being read.
- **Ontology:** a View with a deletion column always forces a **full reindex** in Funnel. [Fact] https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/

### 8. Change data capture (CDC)

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

### 10. Media sets

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

### 11. Pipeline Builder

**Plain English.** A drag-and-drop graph editor for pipelines. You connect input → join → filter → output, and it writes and checks the code for you.

[Fact] https://www.palantir.com/docs/foundry/pipeline-builder/overview/
- **Engine and checks:**
  - A backend "writes transform code and performs checks on pipeline integrity".
  - Functions are **strongly typed**, so errors show before build.
  - Strict output checks block the build.
  - Transform paths that do not lead to an output are pruned.
- **Outputs:** datasets, object types, link types, media sets, virtual tables, geotemporal syncs and more.
- **Engines:**
  - Spark (standard batch).
  - Flink (streaming).
  - **DataFusion "Faster" pipelines**: Rust, single-node, formerly called "lightweight".
  - **External pipelines**: push down to Databricks or Snowflake. Inputs and outputs must be virtual tables from the same source as the compute.
- **Faster pipelines:** [Fact] https://www.palantir.com/docs/foundry/building-pipelines/create-faster-pipeline-pb/
  - Optimal for 1–50 GB uncompressed and 1–200M rows, and pipelines that run in under 15 minutes. Can reach TB scale for suitable transforms.
  - Known differences from Spark: decimal overflow raises an error; structs cannot be compared; empty outputs produce 0 files; only row-count stats; no trained-model nodes; some geo and array expressions unsupported.
  - Became the default for new pipelines on 3 Nov 2026, with LLM and embedding nodes supported. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-11
  - Bulk "Convert to Faster" migration opens one proposal per eligible pipeline (17 Nov 2026). [Fact] same
  - Custom profiles of up to **32 cores**, with DataFusion session parameters such as target partitions (20 Aug 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-08
  - Iceberg inputs and outputs supported (1 Oct 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-10
- **Governance of compute:** Large and XL Spark profiles must be **imported into a project** by someone with project editor plus Resource Management admin rights (27 Aug 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-08
- **Managed profiles:** scale down based on the last 5 builds, never up (14 Apr 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-04?hl=en-US
- **Incremental:** "Require incremental execution" makes silent snapshot fallbacks fail instead (17 Mar 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-03
- **State-break viewer:** shows which change caused a state break in streaming or incremental pipelines (15 Oct 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-10
- **Reuse and collaboration:**
  - **Subgraphs** (reusable, parameterised graph fragments) GA from 27 Oct 2026. [Fact] same
  - Node-level proposal comments (31 Mar 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-03
- **LLM and model features:**
  - LLM evaluation suites GA (10 Sep 2026), with exact-match and LLM-as-judge evaluators. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09
  - No-code model inference, Spark only; models run as sidecar processes next to executors (2 Apr 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-04?hl=en-US

### 12. Code transforms: Python, Java, SQL; compute engines; lightweight

**Plain English.** For engineers: write a Python function decorated with its inputs and outputs. Foundry runs it whenever inputs change and versions the result.

**API.** [Fact] https://www.palantir.com/docs/foundry/transforms-python/transforms-python-api/
- Decorators: `transform` / `transform.using`, `transform_df`, `transform_pandas`, `transform_polars`, `configure` (Spark profile and allowed run duration), `incremental`, `lightweight`.
- I/O: `Input(alias, branch, …)` and `Output(alias, sever_permissions, …)`, plus `InputSet` and `OutputSet`.
- Parameters: `BooleanParam`, `IntegerParam`, `FloatParam`, `StringParam`.
- Data Health: `Check` objects.
- Other: `Markings` and `OrgMarkings` for marking propagation; `Pipeline()` groups transforms.
- Parameterised transforms and action-triggered schedules are in beta (14 May 2026). An Action can trigger a schedule and pass its parameters into the transform. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05

**Engines.** [Fact] https://www.palantir.com/docs/foundry/transforms-python/compute-engines/

| Engine | Optimal size | Rows | Notes |
|---|---|---|---|
| pandas | <1 GB | <1M | single-threaded, no spilling |
| **Polars (recommended default)** | 1–50 GB | 1–200M | lazy, Arrow/Rust, optional GPU (cudf-polars) |
| DuckDB | 1–50 GB | 1–200M | SQL-first, automatic spilling |
| PySpark | >50 GB | >200M | distributed, significant startup |

- Single-node gaps: limited expectations; no source unmarking; no `sever_permissions`; no "allowed run duration".
- Suggested migration path from Spark: test with DuckDB plus SQLFrame first.

**Lightweight resources.** [Fact] https://palantir.com/docs/foundry/transforms-python/configure-resources/
- `with_resources(cpu_cores=…, memory_gb=… | memory_mb=…, gpu_type=…)`.
- Defaults: 2 cores. Default caps: **8 cores and 64 GB**.
- GPUs: T4, V100, A10G, A100, A16, H100, H200, L4, L40S, if enabled for the project.

**Spark profiles.** [Fact] https://www.palantir.com/docs/foundry/optimizing-pipelines/spark-profiles-reference/
- Named presets, for example:
  - `EXECUTOR_MEMORY_MEDIUM` = 13g plus 2g overhead;
  - `EXECUTOR_CORES_MEDIUM` = 4;
  - `NUM_EXECUTORS_1` through `_512`;
  - `DRIVER_MEMORY_LARGE` = 13g (maxResultSize 8g);
  - dynamic-allocation ranges from 1–2 up to 64–128.
- Column statistics are off by default.

**Managed profiles (Spark).** [Fact] https://palantir.com/docs/foundry/optimizing-pipelines/managed-profiles/
- Eligible when the last 5 runs succeeded and the configuration is unchanged.
- Resources are capped at the maximum observed usage, never above the original request.
- If executors × cores ≤ 4, Foundry may recommend local mode.

**Spark version:** transforms moved from Spark 3.5.5 to **4.0.1** on 22 Sep 2026. Breaking changes are absorbed in the transforms API layer. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09

**Incremental transforms.** [Fact] https://www.palantir.com/docs/foundry/transforms-python/incremental-reference/
- `@incremental(require_incremental, semantic_version=1, snapshot_inputs, allow_retention, allow_user_deletes, strict_append, v2_semantics)`.
- Read modes `added`, `previous`, `current`; write modes `modify` and `replace`. The same code must be correct in both incremental and full runs.
- **Falls back to a snapshot when:**
  - an input received a SNAPSHOT or an overwriting UPDATE;
  - files were deleted, unless deletes are explicitly allowed;
  - `semantic_version` changed;
  - multi-output transforms disagree.
- `v2_semantics=True` is recommended.
- Preview in Code Repositories always runs non-incrementally.

**Languages and tools.**
- Java has the full Spark Java API. SQL transforms are declarative. [Fact] https://www.palantir.com/docs/foundry/getting-started/foundry-platform-summary-llm/ . I could not open the Java and SQL pages. [Unverified details]
- **Python editing in Code Repositories went legacy on 23 Jun 2026**; new work focuses on VS Code workspaces. Code Repositories remains recommended for Java and SQL. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-06
- **SQL Studio** GA 16 Jun 2026:
  - Ontology SQL plus **Furnace**, which routes tabular queries between **Trino and Spark**, all in a Spark SQL dialect.
  - Iceberg CREATE, INSERT, UPDATE and DELETE.
  - Previews 1,000 rows by default; 10,000 maximum. [Fact] same
- **Code Repositories** is a Git service with pull requests, holding transforms in Python, Java and SQL, and functions in TypeScript and Python. [Fact] https://www.palantir.com/docs/foundry/code-repositories/overview/

### 13. Builds, schedules, orchestration

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

### 14. Data lineage and Workflow Lineage

- **Data Lineage** is the graph of datasets, with search by project, table and column. It can expand ancestors and descendants, colour the graph (for example, out-of-date datasets), show the code behind each dataset, and save snapshots. Schedules are edited from its sidebar. [Fact] https://www.palantir.com/docs/foundry/data-lineage/overview/
- Lineage links to the Ontology by listing the object types built from a dataset, and object types can be added to the graph. [Fact] https://palantir.com/docs/foundry/data-lineage/explore-artifacts/
- A Global-branches view was added on 26 May 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
- **Workflow Lineage** is the graph north of the Ontology. [Fact] https://palantir.com/docs/foundry/workflow-lineage/overview/
  - Nodes: objects, actions, functions, models, Workshop apps and widgets.
  - Bulk upgrades of function versions and model swaps.
  - Seven days of run history.
- **2026 additions to Workflow Lineage:**
  - Log search across call chains, GA 29 Sep 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09
  - Failure-rate colouring in buckets of <1%, 1–5%, 5–15% and >15% (20 Aug 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-08
- I found no documentation of column-level lineage in what I could open. [Unverified]

### 15. Data Health: health checks, expectations, monitoring views

- **Health check types:** [Fact] https://palantir.com/docs/foundry/data-health/check-types/
  - Job status, schedule status, schedule duration.
  - Time Since Last Updated (TSLU), which counts empty transactions.
  - Data freshness: commit time vs. the maximum of a timestamp column.
  - Sync freshness.
  - Most checks run after the job completes, so they **cannot stop a build**.
- **Recommended placement:** [Fact] https://www.palantir.com/docs/foundry/maintaining-pipelines/recommended-health-checks
  - Schedule status and duration on every schedule.
  - A schema check on inputs that allows added columns.
  - An exact-match schema check plus TSLU on outputs. Example threshold: 26 h for a daily 1 h build.
  - Sync status plus sync freshness on synced data.
- **Expectations (build-time):** [Fact] https://www.palantir.com/docs/foundry/transforms-python/data-expectations-getting-started/
  - `Check(E.primary_key('id'), 'name', on_error='FAIL'|'WARN')`, attachable to inputs or outputs.
  - Composites via `E.all(...)`.
  - FAIL aborts the job.
- **Monitoring views:** [Fact] https://palantir.com/docs/foundry/monitoring-views/overview/
  - Rules over resources: datasets, streams, schedules, object types, link types, actions, functions, automations, agents and others.
  - Static or dynamic scope (folder, project, Workshop app, OSDK app).
  - Composite AND rules.
  - Low, Medium and High severities.
  - Channels: email, Foundry notifications, PagerDuty, Slack, webhooks.
  - Viewer permission is required on both the resource and the monitoring view.
- **Ontology-sync monitoring:** a "Sync Propagation Delay" rule alerts on Ontology index staleness. [Fact] https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/
- **2026 additions:**
  - Health checks now cover virtual and Iceberg tables (19 Mar 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-03
  - Project-scoped monitors for Ontology resources (17 Feb 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-02

### 16. Data catalog and Marketplace / DevOps product packaging

- **Data catalog:** I could not open a dedicated Data Catalog page (the fetch budget ran out). Discovery features I could confirm are search by project, table and column in Data Lineage, plus metadata exposed through the Platform SDK. [Fact] https://www.palantir.com/docs/foundry/data-lineage/overview/ , https://www.palantir.com/docs/foundry/architecture-center/interoperability/ . Anything beyond that is [Unverified].
- **Marketplace** is a storefront for installing "products", with guided installs and automatic upgrades (maintenance windows, release channels). [Fact] https://www.palantir.com/docs/foundry/marketplace/overview/
- **DevOps product creation:** [Fact] https://www.palantir.com/docs/foundry/foundry-devops/create-products/
  - **Stores and outputs:**
    - A store lives in a project and inherits its permissions.
    - Outputs are added manually or through a tracked source folder.
    - Dependencies are detected automatically, and unsatisfied ones become **inputs** the installer must map.
    - Inputs can be "promoted" to outputs. Presets and input API names support programmatic installs.
    - Datasets can ship with static data, which needs download permission.
  - **Install modes:** Production (central management), Singleton (one per space and ontology), Bootstrap (a starting point the installer can modify).
  - **Size cap:** **15,000** inputs plus outputs, counting nested columns and properties; warning at 75%.
- **Unsupported content types** include Data Connection sources, Code Workbooks and Fusion sheets. [Fact] https://www.palantir.com/docs/foundry/foundry-devops/supported-resources/
- **2026 additions:**
  - Product groups with version-set validation: missing inputs, duplicate outputs, dependency cycles (15 Sep 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09
  - Bulk install and upgrade, where linked products' outputs fill downstream inputs (14 Jul 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07
  - **SuperRepo** (beta, 4 Aug 2026): a monorepo of Ontology-as-code in TypeScript plus functions plus a React app. It compiles to a signed Marketplace product deployable from external CI. Data pipelines are "in development". [Fact] https://www.palantir.com/docs/foundry/announcements/2026-08

### 17. Global Branching

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

### 18. Metering and cost drivers

[Fact] https://palantir.com/docs/foundry/resource-management/usage-types/
- **Compute-seconds** are a unit of work, not wall-clock time: `max(num_vCPU, GiB_RAM/7.5)` per instance × instances × seconds, on *allocated* resources.
  - Worked example: 2 executors × (1 core, 12 GiB) × 5 s = 16 compute-seconds.
  - Usage is dated to the UTC day the job finished.
- **Batch** is metered from provisioning to release. **Interactive** compute costs more because of always-on idle capacity. **Continuous** compute is metered while a job is ready to receive messages.
- **Storage** is in GB-months, sampled hourly and averaged over the month. Retained files count until retention removes them.
- **Ontology volume** is also in GB-months, and synced size can differ from dataset size. I found no rate or formula. [Fact / Unverified rate]
- **Streaming:** [Fact] https://palantir.com/docs/jp/foundry/building-pipelines/streaming-compute-usage/
  - JobManager plus TaskManagers × (parallelism + 1), times a 0.5 usage rate, billed whether or not data flows.
  - The archiver always uses 1 vCPU and 4 GiB, and only when data is flowing.
  - Example: a small profile at parallelism 2 for 10 minutes = 600 compute-seconds.
- **Media:** compute-seconds per GB, from 2 to 275 (Section 10).
- **Iceberg:** compute in compute-seconds and storage in GB-months, counting all data and delete files referenced by retained snapshots, branches and tags. Bring-your-own-bucket storage is not metered. Snapshot expiry reduces usage. [Fact] https://www.palantir.com/docs/foundry/iceberg/resource-usage/
- **Virtual tables** cut storage but may increase compute when queried often. [Fact] https://www.palantir.com/docs/foundry/data-integration/virtual-tables/
- **Rate-limit visibility:** a "Foundry usage & limits" page tracks Ontology Reads, Platform APIs and Function Compute against enrollment limits, drillable by organisation and user. GA 19 Nov 2026. [Fact] https://palantir.com/docs/foundry/resource-management/foundry-usage-and-limits/ , https://www.palantir.com/docs/foundry/announcements/2026-11
- **LLM usage:** an AIP token-usage internal dataset with daily input, output and cache tokens plus currency (28 May 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
- **Prices:** no per-unit prices are published in the pages I read. [Fact: absent]

### 19. Interoperability: Iceberg, Snowflake, Databricks, BigQuery

- **Iceberg tables, GA 15 Sep 2026:** [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09
  - Managed tables plus a REST catalog on AWS, Azure and GCP, stored in Palantir storage or a customer bucket.
  - Writable from Python transforms, Pipeline Builder, and syncs from JDBC, SQL Server, Oracle, PostgreSQL and Snowflake.
  - Can back Ontology object types.
  - Compaction, snapshot expiry, row-level updates and deletes, and changelogs.
  - Must be enabled by an administrator.
- **REST catalog for external engines:** [Fact] https://www.palantir.com/docs/foundry/iceberg/authentication/
  - URI `https://<host>/iceberg`; token endpoint `/iceberg/v1/oauth/tokens`.
  - OAuth2 client credentials for production; a user bearer token for development only.
  - Scopes `api:iceberg-read` and `api:iceberg-write`.
  - **Credential vending:** S3 STS with refresh and remote signing; ABFS SAS without refresh.
- **Transactions:** inside Foundry builds, Iceberg reads and writes are wrapped all-or-nothing, with repeatable reads and multi-table snapshot isolation. At most one job runs against an output at a time; commit conflicts with compaction are retried. External clients get standard Iceberg semantics. [Fact] https://www.palantir.com/docs/foundry/iceberg/transactions/
- **Iceberg vs. datasets:** [Fact] https://www.palantir.com/docs/foundry/iceberg/iceberg-vs-datasets/
  - No Foundry views, restricted views, streaming or materialisations on Iceberg tables.
  - Primary keys must be unique when a table backs the Ontology.
  - Markings apply table-wide, across all retained snapshots.
- **Virtual tables:** [Fact] https://www.palantir.com/docs/foundry/data-integration/virtual-tables/
  - GA sources: S3, ADLS/OneLake, GCS (Avro, Delta, Iceberg, Parquet), plus BigQuery, Databricks and Snowflake tables and views (manual, automatic or bulk registration).
  - Pushdown: BigQuery through Ibis; Databricks through PySpark and Pipeline Builder; Snowflake through Snowpark and Pipeline Builder.
  - Update detection polls on a schedule. Versioned formats trigger builds only when changed; objects backed by virtual tables reindex automatically.
  - Incremental is append-only.
  - No Foundry versioning or branching on virtual tables.
  - Only Foundry worker with direct egress.
- **Other interfaces:** [Fact] https://www.palantir.com/docs/foundry/architecture-center/interoperability/
  - REST, JDBC and S3-compatible access.
  - Power BI, Tableau, Jupyter and RStudio connectors.
  - Ontology over REST, the OSDK and **Palantir MCP**.

### 20. How it all feeds the Ontology (Funnel / OSv2)

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

## What to copy

1. **Immutable, typed transaction log per table, with SNAPSHOT, APPEND, UPDATE and DELETE.** A table version = latest SNAPSHOT + replayed later transactions. Store files in object storage (S3 or GCS) as Parquet or Iceberg, and keep the log in Postgres. Allow only one open transaction per branch. *Why:* it gives free audit, time travel, rollback and incremental detection ("was this an append?"). Source: https://www.palantir.com/docs/foundry/data-integration/datasets/
2. **Use Iceberg rather than inventing a format.** Palantir itself converged on Iceberg plus a REST catalog with credential vending. Pick an off-the-shelf catalog (Polaris, Lakekeeper or similar) and expose OAuth2 client-credentials access with read/write scopes. *Why:* customers' Snowflake, Databricks or DuckDB can then read the same tables. Sources: https://www.palantir.com/docs/foundry/announcements/2026-09 , https://www.palantir.com/docs/foundry/iceberg/authentication/
3. **Adopt one changelog contract (primary key, numeric ordering column, boolean deletion column) everywhere:** CDC ingest, deduplicating views, stream resolution and object indexing. Resolve as max(order) per key, then drop if deleted. *Why:* one rule covers a single primitive for "current state". Unlike Palantir's Ontology, **honour the ordering column at index time**, not arrival order. Their docs admit stale values otherwise. Source: https://www.palantir.com/docs/foundry/data-integration/change-data-capture/
4. **Declarative JobSpecs plus a build resolver.** Each transform declares inputs and outputs. A build:
   - compiles the DAG and rejects cycles;
   - opens an output transaction as the lock;
   - skips outputs whose input versions and code hash are unchanged;
   - runs independent jobs in parallel;
   - aborts dependents on failure.
   *Why:* freshness-based skipping is the biggest cost saver. Source: https://www.palantir.com/docs/foundry/data-integration/builds/
5. **Schedules with time, data-updated and logic-updated triggers, and four target modes** (single, upstream, downstream, connecting). Run them **project-scoped** (a service identity), not as a user. Queue at most one follow-up run when a trigger fires mid-run. Source: https://www.palantir.com/docs/foundry/data-integration/schedules/
6. **Default to single-node engines (DuckDB or Polars, or DataFusion) and add Spark only at more than 50 GB or 200M rows.** Use 2-core default containers capped at 8 cores and 64 GB, with explicit sizing tiers. *Why:* at a 100–1,000-staff company almost every table fits this envelope. Startup overhead dominates Spark cost. Sources: https://www.palantir.com/docs/foundry/transforms-python/compute-engines/ , https://palantir.com/docs/foundry/transforms-python/configure-resources/
7. **Incremental transforms with explicit fallback rules.** Process "added" rows when every input is append-only; otherwise do a full recompute. Provide a `semantic_version` bump and a `require_incremental` flag so silent fallbacks fail loudly. Source: https://www.palantir.com/docs/foundry/transforms-python/incremental-reference/
8. **Branch fallback chains for data.** A build on branch X reads each input from X if it exists there, else from the next branch in the chain, and writes only to X. Data is never merged; code is merged and data rebuilt. *Why:* it allows safe experimentation without copying data. Source: https://www.palantir.com/docs/foundry/data-integration/branching/
9. **One global branch spanning pipeline, semantic model, actions and UI**, with proposals that run checks (conflicts, approvals, rebase). Per-property conflict detection. Auto-expire inactive branches after N days (Palantir: 35) and delete branch-only data after M more days (Palantir: 7). Actions on a branch must not write to main. Source: https://www.palantir.com/docs/foundry/global-branching/core-concepts/
10. **A four-stage indexer from tables into the object store:**
    1. compute the diff (changelog);
    2. merge user edits on the primary key;
    3. build the index;
    4. publish.
    Also: incremental by default; full reindex above an 80% change ratio or on schema change; a *replacement pipeline* that builds in parallel and swaps atomically; periodic persistence of edits (Palantir: every 6 h). *Why:* edits survive source refreshes, and schema migrations cause no downtime. Source: https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/
11. **Two-tier quality checks.**
    - (a) Build-time expectations in code — primary key, non-null, range, type — with `FAIL` or `WARN`.
    - (b) Post-hoc monitors: schedule status and duration, TSLU, data freshness, sync freshness, schema drift (allow added columns on inputs; exact match on outputs). Alert at Low, Medium or High to email, Slack or webhook.
    Add an "index propagation delay" monitor for the semantic layer. Sources: https://palantir.com/docs/foundry/data-health/check-types/ , https://www.palantir.com/docs/foundry/maintaining-pipelines/recommended-health-checks
12. **Connector architecture: run all logic centrally and keep the on-prem agent a dumb tunnel** (an outbound websocket only, no processing, no credentials). Store credentials encrypted centrally. Support OIDC and cloud-identity authentication with no stored secret. Auto-cancel syncs after a maximum duration (Palantir: 48 h). Block schema changes by default. Source: https://www.palantir.com/docs/foundry/data-connection/architecture/
13. **Outbound webhooks as typed, versioned, rate-limited objects bound to one source.** Typed inputs, templated body, extracted outputs written back to objects. Default timeout 20 s, maximum 180 s. Concurrency and rate caps. Response history visible only to the caller, kept 6 months. Callable from actions and agents. *Why:* this is exactly how an agent's "allowed action" should reach an external system. Source: https://palantir.com/docs/foundry/data-connection/webhooks-reference/
14. **Inbound listeners: a per-provider signature-verifying endpoint that writes into a stream.** About 100 req/s, 1 MB payload limit. Rotate endpoints with an overlap window. Source: https://palantir.com/docs/foundry/data-connection/listeners-https/
15. **An egress allowlist by data classification.** A source can export only data whose markings are on its allowlist. Turning exports on needs both the source owner and a security role. Export only from the main branch. Source: https://www.palantir.com/docs/foundry/data-connection/export-overview/
16. **Virtual tables for warehouse customers:** register Snowflake, Databricks or BigQuery tables without copying them, poll for changes (cheap for versioned formats), and push compute down. Accept the trade-off: no versioning or branching. Source: https://www.palantir.com/docs/foundry/data-integration/virtual-tables/
17. **Meter in allocation-based compute-seconds:** `max(vCPU, GiB/7.5) × seconds`. Storage in GB-months sampled hourly. Separate line items for semantic-index volume, LLM tokens and API rate-limit consumption. Expose usage by project, user and day. *Why:* it gives a transparent cost model the founder can price against. Source: https://palantir.com/docs/foundry/resource-management/usage-types/
18. **Packaging by dependency inference.** Pick the most-downstream resources, auto-walk dependencies, expose unpackaged dependencies as typed inputs with presets, cap product size, and validate product groups for cycles and missing inputs. *Why:* "template a deployment for customer #2" becomes repeatable. Source: https://www.palantir.com/docs/foundry/foundry-devops/create-products/
19. **Media items as first-class, path-addressed versioned objects**, with an operation-priced processing catalogue (OCR, transcription, render) and a choice of transactional or transactionless writes (10k items per transaction). Source: https://www.palantir.com/docs/foundry/media-sets-advanced-formats/media-set-settings
20. **Version diff and bisect tooling** (Time Travel, Compare tab) using a primary key. *Why:* this is what lets staff trust the model when a number changes. Sources: https://www.palantir.com/docs/foundry/announcements/2026-07 , https://www.palantir.com/docs/foundry/announcements/2026-11

## What cannot or should not be copied

- **Rubix, Apollo and 72-hour node cycling.** This is defence-grade infrastructure. A solo founder should run on a managed cloud (managed Kubernetes or serverless containers) and rely on its patching. [Inference]
- **Spark plus Flink as defaults.** Palantir itself is moving away from Spark for small and medium data. Streaming is "very high" cost and complexity. For 100–1,000-staff customers, incremental micro-batch gives minute latency at much lower cost. Skip Flink at first. [Inference, grounded in] https://palantir.com/docs/foundry/building-pipelines/pipeline-types/
- **A bespoke file-log format on HDFS.** It is historical baggage. Iceberg now provides snapshots, branches and tags, row-level deletes and changelogs. Copy the semantics, not the implementation. [Inference] https://www.palantir.com/docs/foundry/iceberg/iceberg-vs-datasets/
- **Debezium-at-scale CDC for every database.** Operationally heavy: log retention, snapshot modes, manual restarts. Start with incremental pulls on a monotonic column, and offer CDC only for Postgres. [Inference] https://www.palantir.com/docs/foundry/data-integration/change-data-capture/
- **The full breadth of 200+ connectors and SAP HyperAuto.** Integrate an existing open-source connector library rather than building one. [Inference]
- **Arrival-order indexing of changelogs.** This is a known Palantir weakness that their own docs warn about. Do not copy it. https://www.palantir.com/docs/foundry/data-integration/change-data-capture/
- **Security markings and classification-based mandatory access control in full.** Likely overkill for most mid-size firms. Keep the *concept* (labels that propagate through lineage and gate exports and agent access), but implement a simpler model. [Inference]
- **Pricing levels.** Palantir publishes the units but not the prices, so there is no price to copy. [Fact: absent]

## Open questions and unverified items

- Java and SQL transforms pages, compute-modules details, the Iceberg overview and branching body, and a dedicated Data Catalog page: not read, because the fetch and search budgets ran out on 21 Nov 2026. The Data Catalog features remain [Unverified].
- Whether combined schedule triggers are AND or OR: not stated on the pages read.
- Column-level lineage: no documentation found.
- Ontology volume (GB-months): no formula or rate found; synced size may differ from dataset size.
- Default number of stream partitions and the TaskManager profile defaults: not stated.
- Archive interval: "every few minutes" (streams page) vs. "every 10 minutes" (streaming compute page). The two disagree.
- Global Branching: the platform summary for LLMs says TS v2 and Python functions are not branchable. The 13 Oct 2026 announcement says GA. The announcement is newer.
- Whether webhook calls inside Actions are transactional (rolled back if the Action fails): not documented on the pages read.
- How dataset JobSpecs are physically stored, and the internal name of the build service: not documented publicly.
- Exact usage cost of an Ontology query (Object Set Service): pointed to other pages I did not read.

## Sources

Ranked by usefulness. All were read on 21 Nov 2026; docs pages are undated.

1. https://www.palantir.com/docs/foundry/data-integration/datasets/ — transaction types, views, schemas, backing filesystem; the core storage model.
2. https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/ — how tables become Ontology objects: four stages, live vs. replacement pipelines, 80% full-reindex rule, edit merge.
3. https://palantir.com/docs/foundry/resource-management/usage-types/ — compute-second formula, storage GB-month method, attribution rules.
4. https://www.palantir.com/docs/foundry/data-integration/builds/ — JobSpecs, build resolution, locking, staleness, failure semantics.
5. https://www.palantir.com/docs/foundry/data-integration/branching/ — branch model, fallback chains, build-branch guarantees.
6. https://www.palantir.com/docs/foundry/transforms-python/incremental-reference/ — exact incremental rules and fallbacks.
7. https://www.palantir.com/docs/foundry/data-integration/change-data-capture/ — changelog contract, Debezium defaults, Ontology ordering caveat.
8. https://www.palantir.com/docs/foundry/transforms-python/compute-engines/ — engine sizing table (pandas, Polars, DuckDB, Spark).
9. https://www.palantir.com/docs/foundry/global-branching/core-concepts/ — proposals, conflicts, lifecycle, retention defaults.
10. https://www.palantir.com/docs/foundry/data-integration/virtual-tables/ — source matrix, pushdown engines, update detection, limits.
11. https://www.palantir.com/docs/foundry/data-connection/core-concepts/ and https://www.palantir.com/docs/foundry/data-connection/architecture/ — workers, egress policies, agent design, capability list.
12. https://palantir.com/docs/foundry/data-connection/webhooks-reference/ — webhook typing, limits, history, publishing.
13. https://www.palantir.com/docs/foundry/data-connection/export-overview/ — export modes and marking-based egress control.
14. https://palantir.com/docs/foundry/building-pipelines/pipeline-types/ — batch vs. incremental vs. streaming trade-off table.
15. https://www.palantir.com/docs/foundry/building-pipelines/create-faster-pipeline-pb/ — DataFusion engine envelope and incompatibilities.
16. https://www.palantir.com/docs/foundry/data-integration/streams/ and https://palantir.com/docs/jp/foundry/building-pipelines/streaming-compute-usage/ — stream storage, semantics, streaming metering (Japanese machine translation of the English page).
17. https://palantir.com/docs/foundry/object-indexing/funnel-streaming-pipelines/ — streaming Ontology limits (1 MB, 250 properties, no edits).
18. https://www.palantir.com/docs/foundry/iceberg/iceberg-vs-datasets/ , https://www.palantir.com/docs/foundry/iceberg/transactions/ , https://www.palantir.com/docs/foundry/iceberg/authentication/ , https://www.palantir.com/docs/foundry/iceberg/resource-usage/ — Iceberg semantics, REST catalog authentication, metering.
19. https://www.palantir.com/docs/foundry/data-integration/views/ — key-based deduplicating union views and their cost profile.
20. https://palantir.com/docs/foundry/data-health/check-types/ , https://www.palantir.com/docs/foundry/maintaining-pipelines/recommended-health-checks , https://palantir.com/docs/foundry/monitoring-views/overview/ , https://www.palantir.com/docs/foundry/transforms-python/data-expectations-getting-started/ — the quality stack.
21. https://www.palantir.com/docs/foundry/foundry-devops/create-products/ — packaging by dependency inference, 15k cap, install modes.
22. https://www.palantir.com/docs/foundry/media-sets-advanced-formats/media-set-settings and https://palantir.com/docs/foundry/media-sets-advanced-formats/media-usage-limits/ — media transactions, retention, per-operation compute rates.
23. https://www.palantir.com/docs/foundry/object-backend/overview/ — OSv2 limits, Object Set Service, OSv1 sunset date.
24. https://www.palantir.com/docs/foundry/architecture-center/multimodal-data-plane/ and https://www.palantir.com/docs/foundry/architecture-center/interoperability/ — architecture framing and the engine list.
25. Monthly announcements, 2026: https://www.palantir.com/docs/foundry/announcements/2026-01 , -02, -03, https://www.palantir.com/docs/foundry/announcements/2026-04?hl=en-US , -05, -06, -07, -08, -09, -10, -11 — dated status changes (Iceberg GA, Global Branching GA, Faster-pipeline default, ingest pricing, Spark 4.0.1, SQL Studio).
26. https://palantir.com/docs/foundry/transforms-python/configure-resources/ , https://www.palantir.com/docs/foundry/optimizing-pipelines/spark-profiles-reference/ , https://palantir.com/docs/foundry/optimizing-pipelines/managed-profiles/ — resource sizing numbers.
27. https://palantir.com/docs/foundry/data-connection/listeners-https/ , https://www.palantir.com/docs/foundry/data-connection/set-up-agent/ , https://www.palantir.com/docs/foundry/data-connection/set-up-sync/ — inbound limits, agent host requirements, sync limits.
28. https://www.palantir.com/docs/foundry/getting-started/foundry-platform-summary-llm/ — a useful map of the platform, but partly stale (branching).