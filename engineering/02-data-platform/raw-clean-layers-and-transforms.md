# Raw clean layers and transforms

**Layer:** [02-data-platform](README.md) · **What it is:** Raw versus clean datasets, transforms, views and the 'publishing a definition generates the build' idea.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (5) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### 5. Datasets: files, schemas, transactions, views, retention

> Source: [general-references/01-palantir-data-layer.md § 5. Datasets: files, schemas, transactions, views, retention](../../general-references/01-palantir-data-layer.md#5-datasets-files-schemas-transactions-views-retention)

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

### 7. Views (union datasets with key-based deduplication)

> Source: [general-references/01-palantir-data-layer.md § 7. Views (union datasets with key-based deduplication)](../../general-references/01-palantir-data-layer.md#7-views-union-datasets-with-key-based-deduplication)

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

### 11. Pipeline Builder

> Source: [general-references/01-palantir-data-layer.md § 11. Pipeline Builder](../../general-references/01-palantir-data-layer.md#11-pipeline-builder)

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

> Source: [general-references/01-palantir-data-layer.md § 12. Code transforms: Python, Java, SQL; compute engines; lightweight](../../general-references/01-palantir-data-layer.md#12-code-transforms-python-java-sql-compute-engines-lightweight)

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

### 19. Interoperability: Iceberg, Snowflake, Databricks, BigQuery

> Source: [general-references/01-palantir-data-layer.md § 19. Interoperability: Iceberg, Snowflake, Databricks, BigQuery](../../general-references/01-palantir-data-layer.md#19-interoperability-iceberg-snowflake-databricks-bigquery)

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

## Lingyang, AgentOne and Alibaba

### 5. Dataphin in technical depth (the documented core)

> Source: [general-references/07-lingyang-agentone.md § 5. Dataphin in technical depth (the documented core)](../../general-references/07-lingyang-agentone.md#5-dataphin-in-technical-depth-the-documented-core)

Plain English: Dataphin is where data engineers define, once, what "paid order amount" means, which table it comes from and how it is filtered and windowed. The platform then generates the SQL and the schedule. Every downstream consumer (BI, agents, APIs) reads that one definition.

Method and layers:
- Dataphin is the cloud form of Alibaba's OneData method, which has three parts: OneModel (self-service model and metric definition with automated code and theme-based aggregation), OneID (named only) and OneService (data services) [Fact, https://help.aliyun.com/zh/dataphin/product-overview/what-is-a-dataphin].
- It follows Kimball dimensional modelling, starting from a conceptual model of business objects and business activities [Fact, https://help.aliyun.com/zh/dataphin/user-guide/specification-modeling-overview]. The product overview mentions a bus matrix covering data domains, business processes, dimensions, atomic and derived metrics, and periods [Fact, what-is-a-dataphin].
- Logical table prefixes: `dim_`, `fct_`, `dws_`. Timeliness suffixes include `_di` (daily event fact), `_df` (daily snapshot fact) and `_hh` (hourly summary). All are configurable under "研发规范 > 表规范" [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-data-panel].
- ODS/CDM/ADS layering: the Dataphin pages I read do not define it. It comes from the book 大数据之路 (see §8).

Logical objects:
- Data block (数据板块): a namespace grouped by business. Two modes. Dev-Prod gives isolated environments and needs double the compute and storage. Basic gives a single Prod environment with the risk of direct production changes. A Basic block cannot be upgraded to Dev-Prod. The English name (≤64 characters) becomes `LD_{name}_dev` in Dev and cannot be edited once logical tables exist. Each block has an architect, up to 3 business owners (responsible for stability) and up to 3 data owners (responsible for quality). Engine: MaxCompute or EMR Serverless Spark. Only super or system admins can create a block [Fact, create-a-data-panel page].
- Business objects drive dimension logical tables, which come in four kinds: normal, hierarchy, enumeration and virtual. Business activities drive fact logical tables [Fact, specification-modeling-overview].
- Atomic metric fields [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/creating-atomic-metrics]:
  - business entity and subject domain;
  - English name (letters, digits and _, ≤64 characters, with root-word suggestions drawn from data standards);
  - Chinese name (≤128 characters);
  - unit (currency, time, ratio, rank, count noun, weight, other);
  - data type;
  - 口径, a natural-language definition (≤1,000 characters);
  - description;
  - data timeliness (day, hour or minute);
  - source main table, which must be a dimension or fact logical table;
  - statistical-period identifier field, allowed on `da` and `df` facts and on dimension tables but not on `di` event facts;
  - calculation expression, for example `count(distinct order_id)`;
  - "additive?" flag (distinct counts are not additive).
- Derived atomic metric: an expression over atomic metrics, for example C = A/B [Fact, specification-modeling-overview].
- Business qualification (业务限定) [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-business-qualification]:
  - Basic type: a predicate over the source table's fields, for example `is_wireless='Y'`.
  - Composite type: a boolean tree over already-submitted qualifications, using match/not-match plus AND/OR, with nested groups and a "preview SQL" button.
  - It must reference the same source main table. It has its own timeliness setting, and logic can be reused across timeliness levels.
- Statistical period [Fact, https://help.aliyun.com/en/dataphin/fullmanaged/user-guide/new-statistical-cycle]:
  - Fields: name (≤64), abbreviation (≤64), granularity (day, hour, minute), calendar (regular or fiscal; day granularity only), start and end time as either a parameter expression or a function.
  - Start and end may not duplicate an existing period. Only admins can create periods. A default set is generated once a compute engine is configured.
- Period expression language [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/appendix-statistical-period-expression-parameters]:
  - Date functions: `lastNDate(date, N)`, `cBeginDate/cEndDate(date, 'w|m|q|y', [len])` for natural periods, `tdBeginDate` for to-date periods, `CustomBeginDate/CustomEndDate(date, 'm|q|y', shift)` for fiscal periods (for example a fiscal year starting `'0401'`). Hour and minute variants: `lastNHour`, `lastNMinute`, `dthBeginDatetime`, `dtmiBeginDatetime`.
  - Examples: last 7 days = `lastNDate('${bizdate}',7)` to `${bizdate}`; month to date = `tdBeginDate('${bizdate}','m')` to `${bizdate}`.
  - The date functions are also reusable in quality rules and partition expressions.
- Derived metric [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-derived-metrics]:
  - Choose up to 3 statistical periods, one atomic metric and business qualifications (all with the same timeliness), and up to 3 object-granularity dimensions. The time grain is set by the period.
  - The wizard pre-generates metrics. The default English name is `<atomic>_<period-abbr>_<qualification>`: starts with a letter, ≤100 characters, unique within the summary table.
  - Then set the ops owner and business owner (batch settable), the schedule (normal only; cycle derived from the period; up to 10 conditional-schedule rules evaluated top-down with first match winning) and description.
  - Upstream dependencies are auto-generated and cannot be edited. In Dev-Prod mode, the metric must be published.
- Summary logical table: exactly one granularity. Its primary key is the granularity dimension combination and every other column is a metric. Derived metrics with the same period and granularity share one summary table [Fact, specification-modeling-overview].
- Registered upward-attached metric (注册上挂指标): attaches a metric column that already exists in a physical table to a summary logical table, by mapping the granularity primary key to source fields. It is a bridge for legacy SQL into the governed model [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/new-registration-indicator].
- Worked example for a newcomer [Inference, built from the definitions above]: atomic metric `pay_amt = sum(pay_amount)` on `fct_trade_order_di`; qualification `is_wireless='Y'`; period "last 7 days"; granularity "store". The derived metric is `pay_amt_7d_wireless` in the summary table `dws_store_trade_7d`, keyed by `store_id`.

Governance modules:
- Quality: monitors Dataphin physical tables and logical tables (fact, dimension, summary) and external tables (MaxCompute, Hive, MySQL, Oracle, SQL Server, PostgreSQL, SAP HANA, ADB-PG, ClickHouse, DB2, DM, Hologres and others). It also checks data-source connectivity and schema changes, and runs real-time versus offline comparisons. **A failed strong rule raises an alert and blocks downstream task nodes. A failed weak rule only raises an alert.** A governance workbench handles fix, ignore and notify [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/asset-quality-overview].
- Asset catalog: automatic metadata extraction, table-level and field-level lineage, browsing by subject domain, and inventory of compute, storage and security [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/asset-panorama-and-catalog-overview].
- Data standards: standard sets, mapping rules, code tables and word roots. Word roots feed name suggestions in metric creation [Fact, what-is-a-dataphin; creating-atomic-metrics].
- Permissions: fine-grained asset and function permissions with request, approval and recall workflows [Fact, what-is-a-dataphin]. The sub-pages cover user roles, built-in roles and data permissions (my permissions, management, audit, ownership), but I could not read their content [Fact that they exist, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/data-access/]. One super-admin per system [Fact, https://help.aliyun.com/zh/dataphin/product-overview/use-restrictions].
- Data services (OneService): one or more physical tables are joined into a logical table and APIs are built on it, in wizard mode or script (custom SQL) mode. Environments are draft, development and production. Alerts on timeout, failure and rate limit go out by DingTalk, email, SMS or phone. Call logs include the executed SQL [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/summary-of-data-services].
- Engines: the full-managed edition currently opens only MaxCompute [Fact, use-restrictions]. Semi-managed supports MaxCompute, ADB-PG, EMR, CDH, CDP, FusionInsight, ArgoDB/TDH, StarRocks, Lindorm, GaussDB(DWS), Databricks, Amazon EMR, SelectDB, Doris, EMR Serverless Spark and OushuDB, plus Flink variants for real time. From V6.1, tenants run in multi-engine mode [Fact, https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/calculation-settings/].

Dataphin AI ("超级X") [Fact, https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/data-x-ai/]:
- Model connection: API Key plus Base URL, with a model bound per assistant. [Inference] This means you can bring your own OpenAI-compatible endpoint.
- Assistants: X-Data Engineering (generates integration tasks, concept, logical and analytical models, and code from a requirement); X-Analytics (问数); X-Ops (status, root cause, rerun or backfill through chat); X-Coding; X-App authoring; X-Data Standard; X-Data Security (classification from semantics and samples); X-Data Quality (root cause from lineage, task code and bad data); X-Catalog (descriptions and tags); X-Asset Q&A.
- An enterprise knowledge base of terms and uploaded documents.
- Access is gated by global roles with per-app view permission.

X-Analytics specifics [Fact, https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis]:
- Each question is scoped to an "analysis album" (分析专辑) of tables, business knowledge, prompts and example questions.
- Fields are labelled as dimension, metric or statistical date, and linked to entities.
- Preview returns only the columns the user has SELECT on, up to 50 rows. SQL runs only if the album allows execution.
- Optional SQL tuning either refines the SQL or generates 2 to 5 candidates and picks the best.
- LLM repair of failed SQL uses the album's dialect.
- Input ≤2,000 characters. Last 20 conversations kept per album.

### 8. OneData and 大数据之路

> Source: [general-references/07-lingyang-agentone.md § 8. OneData and 大数据之路](../../general-references/07-lingyang-agentone.md#8-onedata-and-大数据之路)

- [Fact] Dataphin presents itself as the productisation of OneData (OneModel, OneID, OneService) [what-is-a-dataphin].
- [Unverified this session: from prior knowledge of the 2017 book 大数据之路：阿里巴巴大数据实践, by Alibaba's data technology and product department, which I could not re-read online] The book's layering is ODS (operational data) → CDM (common data model: DWD detail facts, DWS summary, DIM dimensions) → ADS (application). It sets the order "规范定义 → 模型设计 → 落地", and its metric grammar is the same one Dataphin documents: atomic metric, modifier/qualification, time period, derived metric. Dataphin's `dim_`/`fct_`/`dws_` prefixes and `di`/`df` suffixes match this [Fact for the prefixes, create-a-data-panel page]. Check the book's exact terms before citing it in a build plan.

## Design decisions already in the reference maps

### 2. Raw and clean data layers, sync, the "current state" rule, incremental processing and rebuild

> Source: [general-references/30-map-palantir-platform.md § 2. Raw and clean data layers, sync, the "current state" rule, incremental processing and rebuild](../../general-references/30-map-palantir-platform.md#2-raw-and-clean-data-layers-sync-the-current-state-rule-incremental-processing-and-rebuild)

**Purpose.** Bring accounting or ERP data in exactly as it is, clean it downstream with lineage, and always know each record's current state. *Receivables example:* an hourly pull of the ERP's invoice and payment tables lands raw. A clean transform builds `invoice_current`, where invoice INV-1001's latest status is decided by its largest `updated_seq`.

**Design to implement.**
- **Source record.** A source is a connector type, a target location, encrypted credentials and an assigned worker [Fact 01]. Some sources authenticate with OIDC or cloud identity and store no secret [Fact 01]. Fields [Inference on names]: `source(id, tenant_id, connector_type, target, credential_ref, auth_mode secret|oidc, egress_policy, schema_change_policy default 'block', max_run_seconds default 172800)`. Palantir blocks schema changes by default and auto-cancels syncs after about 48 hours [Fact 01].
- **Ingest philosophy.** Ingest as-is with minimal transformation, and do all cleaning downstream where it is versioned. Pull in small batches with low-complexity queries and retry automatically [Fact 01].
- **Sync runs are transactional:** a failed run commits nothing [Fact 01]. Each run is SNAPSHOT (full mirror) or APPEND (incremental on a monotonically increasing column) [Fact 01]. Timestamps without a timezone sync as strings by default [Fact 01]. **Keep that default** so that no timezone is silently invented for invoice due dates [Inference].
- **Dataset and transaction log in Postgres** [Inference on the storage choice; semantics copied]:
  - `dataset(id, tenant_id, name, layer raw|clean, pk_columns[], ordering_column, deletion_column, schema jsonb, schema_version, markings[])`.
  - `dataset_txn(id, dataset_id, branch, type SNAPSHOT|APPEND|UPDATE|DELETE, state OPEN|COMMITTED|ABORTED, opened_at, committed_at, row_count, job_id)`.
  - Rows go in per-dataset tables with a `txn_id` column.
  - A view (dataset version) = the latest committed SNAPSHOT plus later committed transactions replayed in order [Fact 01].
  - At most one open transaction per branch [Fact 01].
  - DELETE removes references only, and only retention frees storage [Fact 01].
- **The current-state rule (one contract everywhere).** Each keyed dataset declares primary-key columns, a numeric ordering column and a boolean deletion column. Resolution groups by key, keeps the row with the largest ordering value, and drops it if it is flagged deleted [Fact 01]. Use this single rule for ingest changelogs, deduplicating views and object indexing.
  - **Departure from Palantir:** Palantir's Ontology ignores the ordering column and indexes by arrival order, and its own docs warn that out-of-order data can then show stale values [Fact 01]. **Honour the ordering column at index time** [Inference, recommended by 01 "What to copy" 3].
  - A column named `is_deleted` is not treated as a deletion column automatically; it must be declared [Fact 01, 02].
  - An incremental input may carry at most one row per key per transaction [Fact 02]. Duplicate keys fail the index build rather than silently merging [Fact 02].
- **Clean layer as declared jobs.** Each transform declares inputs, outputs and a code hash (Palantir's JobSpec) [Fact 01]. The build resolver:
  1. compiles a DAG and rejects cycles;
  2. checks that inputs exist and resolves their schemas;
  3. opens an output transaction as the "build lock";
  4. skips "fresh" outputs whose input versions and code are unchanged;
  5. runs independent jobs in parallel;
  6. on failure, aborts dependents, while completed upstream outputs keep their data;
  7. commits multiple outputs of one job together, never partially.
  [Fact 01]
- **Incremental processing.**
  - Read only the "added" rows when every input received only APPEND transactions since the last run [Fact 01].
  - Fall back to a full recompute when any input received a SNAPSHOT or an overwriting UPDATE, when files or rows were deleted, when `semantic_version` changed, or when the outputs of a multi-output job disagree [Fact 01].
  - A `require_incremental` flag turns a silent fallback into a failure [Fact 01].
  - The same code must be correct in both modes [Fact 01].
- **Schedules.**
  - Triggers: time, data-updated, logic-updated, and combinations [Fact 01]. Whether combinations are AND or OR is [Unverified 01], so implement explicit `all_of` and `any_of` [Inference].
  - Targets: single dataset, plus upstream, all downstream, or everything connecting two datasets [Fact 01].
  - A trigger that fires mid-run queues exactly one follow-up run [Fact 01].
  - Outcomes: Succeeded, Ignored (everything fresh), Failed [Fact 01].
  - Run project-scoped, under a service identity, not as a user [Fact 01; the default choice is 01's Inference].
- **Rebuild.**
  - A `semantic_version` bump forces a full recompute [Fact 01].
  - The indexer that feeds the object layer (section 3) runs four stages: changelog diff, merge with edits on the primary key, index, publish [Fact 01, 02].
  - It runs incrementally by default and does a full reindex when more than 80% of rows change, on a schema change, or on request [Fact 01, 02].
  - A schema change builds a **replacement pipeline** in parallel, which swaps in after its first success [Fact 01, 02].
  - In Postgres, build the replacement into a shadow table and swap it in with a rename inside one transaction [Inference].
- **Engines.** Palantir now defaults to single-node engines and keeps Spark for inputs over about 50 GB or 200M rows. Its lightweight containers default to 2 cores, capped at 8 cores and 64 GB [Fact 01]. For this product, run transforms as SQL inside Postgres, driven by TypeScript workers [Inference].
- **Quality.**
  - Build-time expectations (primary key, non-null, range) with `FAIL` aborting the job or `WARN` [Fact 01].
  - Post-hoc health checks: schedule status and duration, time since last updated (TSLU), data freshness, sync freshness. These cannot stop a build [Fact 01].
  - Schema checks allow added columns on inputs and require an exact match on outputs. Example threshold: 26 h for a daily 1 h build [Fact 01].
  - An index propagation-delay monitor ("Sync Propagation Delay") watches the object layer [Fact 01].
  - Alert severities are Low, Medium and High, to email, Slack or webhook [Fact 01].
- **Failure behaviour.**
  - A failed sync commits nothing.
  - A failed transform aborts its dependents and leaves earlier outputs at their last good version.
  - Duplicate keys fail indexing and the object layer stays on its previous version.
  - A blocked schema change raises an admin task [Inference].

**Copies.**
- Document 01, §2 "Data Connection": source model, ingest-as-is, small batches, retries, transactional runs, 48 h cancel, schema changes blocked. https://www.palantir.com/docs/foundry/data-connection/core-concepts/ , https://www.palantir.com/docs/foundry/data-connection/set-up-sync/
- Document 01, §5 "Datasets": four transaction types, view replay rule, one open transaction per branch, DELETE semantics. https://www.palantir.com/docs/foundry/data-integration/datasets/
- Document 01, §8 "Change data capture": the three-field changelog contract and the arrival-order warning. https://www.palantir.com/docs/foundry/data-integration/change-data-capture/
- Document 01, §13 "Builds, schedules, orchestration": JobSpecs, resolver, build lock, staleness, failure semantics, trigger and target modes. https://www.palantir.com/docs/foundry/data-integration/builds/ , https://www.palantir.com/docs/foundry/data-integration/schedules/
- Document 01, §12 "Code transforms": incremental fallback rules, `semantic_version`, `require_incremental`. https://www.palantir.com/docs/foundry/transforms-python/incremental-reference/
- Document 01, §20 and document 02, §11 "Backend services": four-stage Funnel, 80% rule, replacement pipelines. https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/
- Document 01, §15 "Data Health": expectations, health checks, recommended placement. https://palantir.com/docs/foundry/data-health/check-types/ , https://www.palantir.com/docs/foundry/maintaining-pipelines/recommended-health-checks

**Left out, and why.**
- Files in object storage and Iceberg tables (01 recommends Iceberg): the stack decision is Postgres. Revisit if a customer's data outgrows it (see Contradictions).
- Spark, Flink and streaming: Palantir calls streaming "very high" cost, and incremental micro-batch gives minute-level latency [Fact 01].
- Debezium CDC for many databases: operationally heavy (01 "What cannot be copied"). At most add Postgres CDC in version 2.
- Virtual tables over Snowflake, Databricks or BigQuery: version 2, for warehouse customers.
- An on-premises agent that acts as an outbound-only tunnel: version 2, when a customer's ERP is not reachable from the internet [Fact 01 design].
- Media sets: version 2, for invoice PDFs and remittance emails (`.eml` items are GA at Palantir [Fact 01]).
- Time Travel and the Compare tab: version 2.

**Open questions.**
- Will rows live in Postgres per dataset, or will raw batches also be kept as files for replay? [Inference needed]
- What latency do collectors actually need? Hourly incremental is assumed.

---

### 5. Publishing a definition generates the build (Dataphin "design is development")

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 5. Publishing a definition generates the build (Dataphin "design is development")](../../general-references/31-map-lingyang-alibaba-offers.md#5-publishing-a-definition-generates-the-build-dataphin-design-is-development)

**Purpose.** The metric and rule definitions are also the executable spec, so the semantic layer cannot drift from what runs. Receivables example: publishing `overdue_amt_mtd_over30_by_collector` creates the SQL view that the dashboard, the weekly report and the agent all read.

**Design to implement.**
- Defining an atomic metric fixes its calculation; publishing a logical model generates the physical code and schedule [Fact, 07 KF 7, §5]. Dependencies are system-derived and cannot be edited [Fact, 07 §5].
- Lifecycle [Fact for the two modes, 07 §5]: Dataphin offers dev/prod (isolated environments, double compute) or basic (single prod, risk of direct changes). Copy as `draft` and `published` statuses on each definition, with an approver for publish [Inference, consistent with 25 row 33: draft vs published versions for rules, metrics and templates].
- Publish pipeline [Inference]:
  1. validate names, types, relation directions, period expressions, rule references;
  2. resolve the dependency graph and reject cycles;
  3. generate SQL views (one per summary table and per derived property) in the tenant schema, created so the querying user's RLS policies apply;
  4. run the strong quality rules that guard the new definition's sources (section 6);
  5. swap the published pointer atomically; keep the previous version readable for citations.
- Data service: Dataphin's OneService builds APIs on logical tables, with draft, development and production environments and call logs that include the executed SQL [Fact, 07 §5]. Copy the call log with executed SQL.
- Do not build a warehouse: compile definitions to views over the customer's synced data in Postgres [Fact as 07's advice: "have them compile to views over the customer's existing database, not a warehouse build system", 07 What cannot be copied].
- Snapshots: keep append-only snapshots of each sync with timestamps so any figure can be reproduced (25 row 2).

**Copies.**
- 07, §5 Method and layers; Data blocks; Data services. https://help.aliyun.com/zh/dataphin/product-overview/what-is-a-dataphin ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-data-panel ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/summary-of-data-services
- 25, C6 rows 2 and 33.

**Left out, and why.**
- Dataphin's rule that a basic block can never be upgraded to dev/prod [Fact, 07 §5]. 07 suggests copying it, but it is a lock-in of the same kind 08 criticises in Bailian [Inference]; allow moving between modes.
- Physical integration, scheduling and compute management: 07 says not needed at this size.

**Open questions.** Whether customers need a separate staging copy of data to test a draft metric, or whether running drafts against production data with a "draft" label is enough [Inference].

## Open-source implementations (added 28 Nov 2026)

- [dbt-core](../../open-source-references/dbt-core.md) — raw → staging → marts layering and tests (Apache-2.0).

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed** — see dataset transaction types in [sync-incremental-rebuild](sync-incremental-rebuild.md#fact-check-notes). **New:** Pipeline Builder "Faster pipelines" are now the default and read/write Iceberg tables (Oct–Nov 2026). Sources: https://www.palantir.com/docs/foundry/announcements/2026-10/ , https://www.palantir.com/docs/foundry/announcements/2026-11/

## Gaps

- No other companies and products material in the research yet.
- No research literature material in the research yet.
