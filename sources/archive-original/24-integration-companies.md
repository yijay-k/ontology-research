# The integration and data-movement layer: Airbyte and the companies around it

Scope note (written 21 November 2026). This document covers the companies that move data out of business systems (accounting ledgers, email, CRMs, documents) and into a product, or let an AI agent act on those systems. The deepest section is Airbyte. After it come the ELT vendors (Fivetran with dbt Labs and Census, Stitch, Matillion, Hevo, Estuary, dlt/dltHub, Meltano, Singer); the unified APIs (Merge, Codat, Rutter, Apideck, Unified.to, Finch, Plaid); embedded-integration and agent-tooling vendors (Nango, Paragon, Prismatic, Pipedream, Composio, Arcade, Zapier, Make, n8n, Workato, Tray); and document and email ingestion (Mindee, Rossum, Nanonets, Reducto, LlamaParse, Nylas, direct Gmail and Microsoft Graph). The final section answers the founder's concrete question: what a one-person company should buy, use as open source and build in order to read invoices, payments and credit notes from Xero, QuickBooks and NetSuite and to send and read email.

Method and its limits. Airbyte and Nango were studied mainly from their own repositories, cloned on 17 to 20 November 2026 under `/home/claude/research/_code/` (docs folders, connector manifests and metadata files). For a code-hosted docs page the citation is the public GitHub path. Web reading was capped by a shared budget: about 30 pages were fetched, and the shared proxy cut off fetching twice. Several vendors (Matillion, Hevo, Stitch, Meltano, Prismatic, Make, Tray, Workato, Rossum, Nanonets, Finch, Plaid) therefore get short sections built from what I could verify, and are marked where the details are unverified. Labels: [Fact] with a URL, [Vendor claim] with a URL, [Inference] for my reasoning, [Unverified] where I could not open a source.

## Key findings

1. **For this founder, the bill from the ledger vendor now matters more than the bill from the integration vendor.** Xero moved developers to five paid tiers on 2 March 2026. The tiers run from Starter (free, 5 connections, 1,000 calls per day per organisation) to Advanced (A$1,445 a month, 10,000 connections, 250 GB of egress), and every tier charges A$2.40 per GB of egress over its allowance. [Fact] ([Xero partner plans](https://developer.xero.com/pricing)). Intuit has metered QuickBooks read calls ("CorePlus", mainly GETs) since 1 November 2025. Builder is free with 500,000 calls a month and is then blocked. Silver costs $300 a month for 1 million calls, with $3.50 per 1,000 calls over that. Writes ("Core", mainly POSTs) are free. [Fact, via a secondary source] ([Apideck summary of the Intuit App Partner Program, updated 2026-11-19](https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program)). Unified APIs do not take these fees away. Codat tells its customers to pick a Xero tier and add a payment method in Xero's own developer portal. [Fact] ([Codat update, 16 Jan 2026](https://docs.codat.io/updates/260116-xero-pricing))
2. **Xero's terms now forbid using API data to train or contribute to any AI or machine-learning model.** This applies to developers registered from 4 December 2025, and to everyone from 2 March 2026. [Fact] ([Xero FAQ](https://developer.xero.com/faq/pricing-and-policy-updates)). An agent product that only rents models and does no training is probably fine, but the clause has to be checked against prompt caching, fine-tuning and evaluation datasets. [Inference]
3. **NetSuite is the hardest of the three ledgers.** Its token-based authentication (OAuth 1.0a) is being retired: from release 2027.1 no new TBA integrations can be created, so new builds should use OAuth 2.0. REST concurrency is governed per account and shared with SOAP and RESTlets. Airbyte's NetSuite connector is alpha, community-supported, Python and TBA-only. [Fact] ([Airbyte NetSuite docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md), [metadata](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-netsuite/metadata.yaml))
4. **Airbyte is an ELT product, built to copy data into a warehouse. It is not built for a SaaS product to embed per customer.** Its Cloud pricing is per credit (6 credits per million API rows) or per data worker, and its hosted agent features (the context layer, the Airbyte MCP direct reads and search) run only in Airbyte Cloud. Each organisation gets 100,000 free direct reads and searches a month, and direct reads are read-only. [Fact] ([context layer readme](https://github.com/airbytehq/airbyte/blob/master/docs/platform/context-layer/readme.md), [credits](https://github.com/airbytehq/airbyte/blob/master/docs/platform/cloud/managing-airbyte-cloud/manage-credits.md))
5. **ELv2, Airbyte's licence, allows more than people assume.** Airbyte's own FAQ says you may use Airbyte to bring data in on behalf of your customers inside your own product. What you may not do is sell Airbyte as an ELT tool, or expose its UI or API to your customers. [Fact] ([licence FAQ](https://github.com/airbytehq/airbyte/blob/master/docs/community/licenses/license-faq.md), [examples](https://github.com/airbytehq/airbyte/blob/master/docs/community/licenses/examples.md)). The Python CDK is MIT. [Fact] (study 14)
6. **Airbyte's connector manifests are the best free specification of how to read Xero and QuickBooks.** They cover the cursor field, the server-side filter, page size, rate-limit handling and how deletes show up. Two examples: Xero uses `UpdatedDateUTC` with an `If-Modified-Since` header, pages of 1,000, a hard stop on the daily-limit 429 and exponential retry on the per-minute 429. QuickBooks runs `SELECT * FROM <Entity> WHERE Metadata.LastUpdatedTime > … AND Active IN (true,false)`, with a budget of 10 calls per second and 500 per minute, and its refresh tokens rotate about every 24 hours. [Fact] ([Xero manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-xero/manifest.yaml), [QuickBooks manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml), [QuickBooks docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/quickbooks.md))
7. **Airbyte has moved hard toward agents** in five steps. Agent Connectors, standalone Python packages, came in December 2025. A public beta of the "agentic data platform" with a Context Store followed in February 2026, then the Agent MCP, Agent SDK and Automations in May 2026, and the Team plan with 10,000 Agent Operations a month and the Agent CLI in June. In July 2026, write operations reached Salesforce and HubSpot. [Fact] ([newsletter archive](https://github.com/airbytehq/airbyte/tree/master/docs/community/newsletter-archive)). None of the published agent connectors is an accounting ledger. [Inference from the listed connectors]
8. **Airbyte no longer sells Self-Managed Enterprise.** Its self-managed options are now the free Core and Enterprise Flex, a hybrid with Airbyte's control plane and the customer's data plane. [Fact] ([enterprise-setup](https://github.com/airbytehq/airbyte/blob/master/docs/platform/enterprise-setup/README.md))
9. **Nango is the closest fit for this founder's "read and write a customer's Xero, QuickBooks and NetSuite" job.** It ships prebuilt syncs and tools for invoices, payments and credit notes on all three systems, routes webhooks (Xero) and handles OAuth. Pricing is pay-as-you-go at $50 a month including $50 of usage, then $0.29 per connection, $0.72 per compute hour and $0.50 per GB. Self-hosting is now an Enterprise-only offer. [Fact] ([Nango pricing](https://nango.dev/pricing), [self-hosting docs](https://github.com/NangoHQ/nango/blob/master/docs/guides/platform/self-hosting/self-hosting.mdx), [Xero functions](https://github.com/NangoHQ/nango/blob/master/docs/snippets/generated/xero/PreBuiltUseCases.mdx))
10. **The unified-API price points are now public, and none is cheap at small scale.** Merge charges $650 a month for up to 10 linked accounts and $65 for each one after that. Apideck starts at $599 a month for 25 consumers. Unified.to starts at $750 a month for 750,000 calls. Codat and Rutter do not publish prices. [Fact] ([Merge](https://www.merge.dev/pricing), [Unified.to](https://unified.to/pricing), [Apideck blog, 2026-11](https://www.apideck.com/blog/best-accounting-apis-for-fintech.md)). None of them is known to cover the Malaysian ledgers SQL Account or AutoCount. MYOB and Zoho Books are covered by Rutter and partly by others. [Fact/Unverified per vendor, see the table]
11. **The two families store data differently, and that matters.** Merge, Codat and Rutter sync and store your customers' ledger data. Apideck and Unified.to pass requests through in real time and generate "virtual webhooks" by polling. A store-everything vendor becomes a second copy of the customer's ledger that you must explain in security reviews. A pass-through vendor gives you no history unless you build it. [Fact for the models] ([Apideck blog](https://www.apideck.com/blog/best-accounting-apis-for-fintech.md), [Unified.to](https://unified.to/pricing)); [Inference for the consequence]
12. **Agent-tool platforms (Composio, Arcade, Merge Agent Handler, Zapier MCP, Paragon ActionKit) price per tool call.** Composio charges $0.005 per extra call and Arcade $0.01. These products are good for long-tail actions and poor as the system of record for receivables, because they do not keep an incremental, deduplicated copy you can compute metrics on. [Fact for prices] ([Composio](https://composio.dev/pricing), [Arcade](https://www.arcade.dev/pricing)); [Inference]
13. **Licences that block commercial embedding:** Pipedream's source-available licence excludes commercial use, and Workday agreed to acquire Pipedream on 19 November 2025. n8n's Sustainable Use Licence restricts commercial redistribution [Unverified this round]. Nango and Airbyte are ELv2. dlt (Apache-2.0) and the Airbyte CDK (MIT) are the clean permissive options. [Fact] (study 14; [Workday press release](https://newsroom.workday.com/2025-11-19-Workday-Signs-Definitive-Agreement-to-Acquire-Pipedream))
14. **Fivetran and dbt Labs completed their all-stock merger on 1 June 2026.** At announcement the combined ARR was said to approach $600M. Census reverse-ETL syncs are now sold as Fivetran "Activations". dbt Core v2.0 (alpha) open-sources the Fusion engine under Apache 2.0. [Fact] ([Fivetran press](https://www.fivetran.com/press/fivetran-dbt-labs-complete-merger-to-create-the-data-infrastructure-for-trusted-ai-agents), [announcement](https://www.businesswire.com/news/home/20251013172495/en/Fivetran-and-dbt-Labs-Unite-to-Set-the-Standard-for-Open-Data-Infrastructure), [Fivetran pricing](https://www.fivetran.com/pricing))
15. **Recommended stack for the founder** [Inference]:
   - **Buy** Nango pay-as-you-go for OAuth, token refresh and webhook routing on Xero, QuickBooks, NetSuite, Gmail and Outlook. This is about $50 to $100 a month at pilot scale.
   - **Build** a small TypeScript sync engine for invoices, payments and credit notes, copying the cursor and error rules from Airbyte's manifests and the config grammar from dlt.
   - **Pay** Xero and Intuit directly.
   - **Leave out** the ELT products (Airbyte Cloud, Fivetran) and the store-everything unified APIs until the number of ledgers passes three.

## Breakdown

### 1. Airbyte

#### 1.1 In one paragraph

Airbyte is an open-source-first data movement company, founded in 2020 by Michel Tricot and John Lafleur in San Francisco [Fact] ([Sacra](https://sacra.com/c/airbyte/)). It copies data from about 600 sources (SaaS APIs, databases, files) into about 80 destinations, mostly warehouses and lakes. Since late 2025 it has also given AI agents live read, search and, for a few systems, write access to those sources. The buyers are data engineers and heads of data at companies from start-ups to large enterprises; platform engineers who self-host the free Core edition; and, since 2025 to 2026, AI-agent developers. They pay so that tables in Snowflake, BigQuery, Postgres or S3 stay in sync with Salesforce, Stripe, Postgres and the rest, without writing and maintaining pipelines. The main alternative they are choosing against is Fivetran, and the reasons are a lower or more predictable bill, the ability to self-host, and the ability to fix or write connectors themselves. Airbyte commissioned a Forrester study that reports a 239% ROI, a net present value of $1.1M, payback in under six months, 60% faster pipeline building and 40% less maintenance time. [Vendor claim, commissioned study] ([June 2026 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jun-2026-airbyte-agents-now-supports-teams.md))

#### 1.2 Function catalogue

Grouped as Airbyte groups them in its docs (`docs/platform/*`) and newsletters. Status and date are given where known.

**A. Editions and deployment**
- **Airbyte Core** (free, self-managed, ELv2). This is the full replication platform on your own Kubernetes, deployed with the Helm V2 chart or `abctl`. Core 2.1 shipped on 3 April 2026, labelled experimental. It turns authentication on by default, adds 15- and 30-minute sync frequencies and asynchronous schema discovery, and makes connectors exit cleanly on JVM out-of-memory errors. [Fact] ([May 2026 newsletter](https://docs.airbyte.com/community/newsletter-archive/may-2026-three-ways-to-build-with-airbyte-agents))
- **Airbyte Cloud Standard**: self-serve and usage-billed with credits. It allows one workspace, syncs at most hourly, and has no SSO or RBAC. [Fact] ([Cloud limits](https://github.com/airbytehq/airbyte/blob/master/docs/platform/cloud/managing-airbyte-cloud/understand-airbyte-cloud-limits.md))
- **Airbyte Cloud Plus** (launched 30 October 2025): the same features as Standard, but billed annually with prioritised support. It adds SSO, two workspaces and 15-minute syncs. [Fact] ([Oct 2025 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/oct-2025-introducing-airbyte-plus.md))
- **Pro**: contracted and capacity-based ("data workers"). It adds RBAC, row filtering, hashing and encryption, multiple regions, 5-minute syncs and a dedicated solutions architect. [Fact] ([pricing](https://airbyte.com/pricing))
- **Enterprise Flex**: Pro plus a hybrid deployment, in which Airbyte runs the control plane and the customer runs data planes in its own region, deployed with Helm or the single-node utility "Airbox". Cursor and primary-key values still sit in Airbyte's control plane. [Fact] ([Enterprise Flex getting started](https://github.com/airbytehq/airbyte/blob/master/docs/platform/enterprise-flex/getting-started.md))
- **Self-Managed Enterprise**: discontinued. Airbyte "no longer sells" it. [Fact] ([enterprise-setup](https://github.com/airbytehq/airbyte/blob/master/docs/platform/enterprise-setup/README.md))

**B. Data replication (the core product)**
- **Sources and destinations.** In the monorepo on 17 November 2026 there were 616 `source-*` and 82 `destination-*` connector directories. [Fact, counted from the cloned repo]. Marketing says "700+" connectors. [Vendor claim] ([pricing](https://airbyte.com/pricing))
- **Connector support levels**: *certified* (maintained by Airbyte) or *community*, plus release stages (alpha, beta, generally available). Each connector's `metadata.yaml` also carries `sl` (support level) and `ql` (quality level) scores. Xero is beta and community-supported (sl 100, ql 300). QuickBooks is GA and certified (sl 200, ql 300). NetSuite is alpha and community-supported (sl 100, ql 200). Gmail is GA and certified. Outlook is alpha and community-supported. [Fact] (metadata files under [`airbyte-integrations/connectors/`](https://github.com/airbytehq/airbyte/tree/master/airbyte-integrations/connectors))
- **Sync modes.** A source mode (Incremental, which uses a cursor or change data capture, or Full Refresh) is combined with a destination mode (Overwrite, Append, Append Deduped or Overwrite Deduped). That gives five options: Incremental Append; Incremental Append + Deduped; Full Refresh Append; Full Refresh Overwrite; and Full Refresh Overwrite + Deduped. [Fact] ([sync modes](https://github.com/airbytehq/airbyte/blob/master/docs/platform/using-airbyte/core-concepts/sync-modes/README.md))
- **Change data capture (CDC)** for databases: log-based (Postgres, MySQL, SQL Server and others). It starts with an initial `SELECT` snapshot and then reads the log from a stored position on each scheduled sync, because Airbyte does not treat CDC as an infinite stream. It adds `_ab_cdc_*` metadata columns, including `_ab_cdc_deleted_at`. It needs primary keys and does not see `TRUNCATE` or `ALTER`, and a new table needs a refresh. [Fact] ([CDC](https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/cdc.md))
- **Schema change management.** Four per-connection policies: propagate field changes only; propagate all field and stream changes; approve all changes myself; or stop future syncs. If a cursor or primary key is removed, the connection pauses for manual review. A removed column is kept in the destination and filled with `NULL`. Major connector version upgrades are flagged by change type, such as schema, state format or spec. [Fact] ([schema change management](https://github.com/airbytehq/airbyte/blob/master/docs/platform/using-airbyte/schema-change-management.md))
- **Typing and deduping / Direct Loading.** Destinations V2 writes typed final tables, with per-record change notes in `airbyte_meta.changes`. "Direct Loading", which writes without raw staging tables, reached every certified destination in July 2026. [Fact] ([Cloud limits](https://github.com/airbytehq/airbyte/blob/master/docs/platform/cloud/managing-airbyte-cloud/understand-airbyte-cloud-limits.md), [July 2026 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jul-2026-agents-can-now-write-to-salesforce-and-hubspot.md))
- **Speed Mode / socket mode.** Records pass directly from source to destination over Unix domain sockets as Protocol Buffers, bypassing the orchestrator, for a claimed 4 to 10 times the throughput. [Fact for the design, vendor claim for the speed-up] ([protocol](https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md)). Vendor results: Snowflake destination "up to 10x faster, up to 95% cheaper" (October 2025), MSSQL 84% faster, Redshift 4.0 up to 4.6 times the throughput. [Vendor claim] (newsletters Oct 2025 and Jun 2026)
- **Data activation (reverse ETL).** Syncs from a warehouse to operational tools (HubSpot, Customer.io, Zendesk and others) with declarative field mapping. [Fact] ([data activation](https://github.com/airbytehq/airbyte/blob/master/docs/platform/move-data/elt-data-activation.md))
- **Data residency and regions, external secrets managers, IP allow lists, notifications, connection timeline, and connection-state editing** (manage-connection-state). [Fact] (docs index `docs/platform/cloud/managing-airbyte-cloud/`)
- **dbt Cloud integration**, which triggers a dbt Cloud job after a sync. [Fact] (docs index)

**C. Building connectors**
- **Connector Builder (UI)**: a no-code and low-code builder that produces a YAML "declarative manifest". It covers authentication, pagination, incremental sync, partitioning (parent-child streams), error handling, record processing, async streams, stream templates and custom components. [Fact] ([builder docs index](https://github.com/airbytehq/airbyte/tree/master/docs/platform/connector-development/connector-builder-ui))
- **AI Assistant for the Connector Builder** (beta, Cloud). It reads API docs and pre-fills the base URL, authentication, pagination, primary key, record selector, incremental sync and streams. [Fact] ([AI assist](https://github.com/airbytehq/airbyte/blob/master/docs/platform/connector-development/connector-builder-ui/ai-assist.md))
- **Low-code CDK / declarative component schema**: a 6,077-line YAML schema (MIT, in `airbyte-python-cdk`). Over half of the repository's connectors, including Xero, QuickBooks, Gmail and Outlook, are now `language:manifest-only`. [Fact] (study 14; metadata files)
- **Python CDK and Bulk CDK** (Kotlin, for databases and destinations). [Fact] (newsletters)
- **AI-Assisted Connector Configuration** (December 2025): a chat-based setup flow that validates field formats and fills the form for you. [Fact] ([Dec 2025 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/dec-2025-airbyte-agent-connectors.md))

**D. Developer surfaces**
- **PyAirbyte** (`pip install airbyte`): runs any connector inside Python and caches results in DuckDB (the default), Postgres, Snowflake, BigQuery or MotherDuck. It also has a Cloud client (workspaces, connections, sync results) and a bundled MCP module (`airbyte.mcp`: local, cloud, registry, prompts). [Fact] ([PyAirbyte reference tree](https://github.com/airbytehq/airbyte/tree/master/docs/developers/pyairbyte/reference/airbyte))
- **Terraform provider and public API.** [Unverified this round; docs path not read]

**E. AI and agent products**
- **Airbyte Agent Connectors** (16 December 2025). These are standalone Python packages with typed request and response models, schema validation, and real-time fetch, search and actions. The first set: Gong, Zendesk Support, GitHub, HubSpot, Salesforce, Jira, Asana, Stripe, Greenhouse and Linear. [Fact] ([Dec 2025 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/dec-2025-airbyte-agent-connectors.md))
- **Agentic data platform** (public beta on 26 February 2026, general launch on 5 May 2026, described as "early"). It has three parts: managed OAuth, hosted agent connectors, and the **Context Store**, a subset of source data held in Airbyte-managed object storage for agentic search. It started with 20+ agent connectors. [Fact] ([Feb 2026 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/feb-2026-context-store.md)). Vendor benchmark: up to 80% fewer tokens and 40% fewer tool calls than calling vendor MCP servers or APIs directly. [Vendor claim] ([May 2026 newsletter](https://docs.airbyte.com/community/newsletter-archive/may-2026-three-ways-to-build-with-airbyte-agents))
- **Three ways to build** (May 2026):
  - **Airbyte Agent MCP**: one MCP connection that reaches the Context Store and direct API calls.
  - **Agent SDK**: Python; works with the Claude Agent SDK, OpenAI Agents SDK, PydanticAI, LangChain and FastMCP; writes to live systems with an audit trail.
  - **Automations**: a visual agent builder, in research preview.
  [Fact] (same)
- **Team plan for agents** (June 2026). Each member gets a private workspace plus access to shared workspaces, with parallel workflow execution and 10,000 Agent Operations a month. [Fact] ([June 2026 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jun-2026-airbyte-agents-now-supports-teams.md))
- **Agent CLI** (June 2026). A single binary, JSON in and JSON out: list connectors, inspect schemas, and run reads, searches, creates and updates. [Fact] (same)
- **Write operations** (June to July 2026): Salesforce (update records, move opportunities through stages) and HubSpot (create and update contacts, companies, deals and tickets), through MCP, the SDK, the API and the CLI. [Fact] ([July 2026 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jul-2026-agents-can-now-write-to-salesforce-and-hubspot.md))
- **Semantic search** over Gong transcripts and Linear issues (July 2026). Workspaces split the Context Store by team. [Fact] (same)
- **Context layer in Airbyte Cloud** (current docs). This is the version folded into the main product:
  - *Agent access*: read-only direct reads through a connector's stored credentials, with no connection needed, using `list`, `get` and the connector's own `search`. There is also read-only SQL on Snowflake and BigQuery (only `SELECT` and `SHOW TABLES`).
  - *Search*: a keyword, semantic or hybrid index built from synced data, with backfill from Snowflake or BigQuery destinations.
  - Both are free up to 100,000 combined direct reads and searches per organisation per month. Both are Cloud-only, not available on Core, and not available on customer-owned Flex data planes. Direct reads do not work when secrets are held in an external secrets manager.
  [Fact] ([context layer](https://github.com/airbytehq/airbyte/tree/master/docs/platform/context-layer))
- **Airbyte MCP** (hosted at `mcp.airbyte.com/mcp`, OAuth 2.0 sign-in; tool list in [tools.md](https://github.com/airbytehq/airbyte/blob/master/docs/platform/airbyte-mcp/tools.md)). Its tools cover:
  - workspace and organisation tools;
  - connector deploy, check and update;
  - connection create and update, stream selection, catalog discovery, state retrieval, and sync run, cancel and logs;
  - dashboards;
  - custom connector manifest publishing;
  - direct reads (`get_external_access_skill_docs`, `execute_external_api_query`, `execute_external_sql_query`);
  - search (`execute_external_search_query`, `get_search_index_status`, `request_search_index_backfill`).
  Each connector has a "skill" document describing its entities, actions and parameters, and the agent reads it before reading data. [Fact] ([MCP readme](https://github.com/airbytehq/airbyte/blob/master/docs/platform/airbyte-mcp/readme.md))
- **Airbyte Knowledge MCP**: a public MCP server over Airbyte's docs, API specs, GitHub issues and pull requests, and YouTube videos. [Fact] (Feb 2026 newsletter)
- **Airbyte Embedded**: a product for SaaS companies to offer connectors to their own customers. It was announced in 2025 [Unverified: I could not open its page this round, and it does not appear in the current docs tree]. Treat its status as unknown.

#### 1.3 How it works underneath

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

#### 1.4 Commercials

- **Pricing** (fetched 21 November 2026):
  - Core: free.
  - Standard: from $20 a month, with 5 credits (about 1 GB), hourly syncs and a 14-day trial with 400 credits.
  - Plus: annual; $189 a month for 40 credits, $449 for 100, $999 for 250, $1,799 for 500, $3,199 for 1,000 and $4,999 for 2,000. That works out to about $4.73 down to $2.50 per credit.
  - Pro and Enterprise Flex: custom and capacity-based, with "~3 syncs at once" per data worker.
  [Fact] ([pricing](https://airbyte.com/pricing))
- **Credit consumption:** APIs and custom sources use 6 credits per million rows; databases and files use 4 credits per GB, measured on the serialised protocol representation. Incremental syncs bill only changed rows. If credits run out, syncs keep running and are billed in arrears. A saved card is charged automatically when usage passes $10,000 in a period. [Fact] ([credits](https://github.com/airbytehq/airbyte/blob/master/docs/platform/cloud/managing-airbyte-cloud/manage-credits.md))
- **Worked example for the founder** [Inference]: 100 customer ledgers × 20,000 changed invoice, payment and credit-note rows a month = 2 million rows = 12 credits, which is about $45 to $55 a month on Plus. Credits are not the obstacle. The obstacle is that each customer's ledger would be a separate source plus connection inside Airbyte, and Airbyte is not designed to be multi-tenant behind someone else's product.
- **Funding and valuation:** about $181M raised; valued at $1.5B (2024, per Sacra; the round was the December 2021 Series B). [Fact for the figures as Sacra reports them] ([Sacra](https://sacra.com/c/airbyte/)). Revenue is not disclosed. [Unverified]
- **Customers:** "thousands of companies" [Vendor claim via Sacra]. Airbyte's own Controller used an agent automation and took the share of Stripe disputes contested from under 10% to over 90%. It is packaged as a Claude skill that prepares evidence but never submits. [Vendor claim] ([July 2026 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jul-2026-agents-can-now-write-to-salesforce-and-hubspot.md))

#### 1.5 Why engineering teams choose it over Fivetran, and what they complain about

Reasons [Inference from product facts, cited]:
1. **Self-hosting and source access.** Core is free with no limits on volume, users or connections, and you can patch a connector yourself. [Fact] ([licence FAQ](https://github.com/airbytehq/airbyte/blob/master/docs/community/licenses/license-faq.md))
2. **Building connectors is cheap.** The Connector Builder plus the AI assistant produce a YAML manifest for any REST API in hours. Fivetran's equivalent is a Function connector or a paid build.
3. **A more predictable bill.** Credits are charged per changed row, or by capacity. Fivetran's MAR model charges per connection on a declining curve and adds a $5 base charge per connection. [Fact] ([Fivetran pricing](https://www.fivetran.com/pricing))
4. **Long-tail coverage.** Hundreds of community manifest connectors exist. The catch is quality: Xero beta and NetSuite alpha are both community-supported.
5. **Agent features at no extra charge** inside Cloud (100,000 free reads and searches a month).

Complaints and weaknesses [Inference from the docs, plus prior knowledge marked Unverified]:
- Community connectors vary in quality, and the support level is right there in `metadata.yaml`.
- Self-hosting means running Kubernetes, and the Helm V1 to V2 migration was mandatory.
- Schema changes and CDC pitfalls need manual refreshes.
- Cursor and primary-key values stay in Airbyte's control plane even on Flex.
- Agent features are Cloud-only.
- Public review-site complaints about upgrade breakage and sync reliability exist [Unverified this round: I did not open G2 or Reddit].

#### 1.6 How it deploys

- Cloud Standard is fully self-serve. The trial starts at the first successful sync and lasts 14 days or 400 credits. [Fact] ([credits](https://github.com/airbytehq/airbyte/blob/master/docs/platform/cloud/managing-airbyte-cloud/manage-credits.md))
- Core goes on Kubernetes with Helm V2, or with `abctl` on a single machine.
- Flex: create one workspace per region; managed data planes need nothing from the customer; self-managed data planes connect outbound only and must share the control plane's secrets manager. [Fact] ([Flex](https://github.com/airbytehq/airbyte/blob/master/docs/platform/enterprise-flex/getting-started.md))
- The agent layer: an admin switches on Context layer > Settings, then the agent is pointed at `mcp.airbyte.com/mcp`. [Fact]

#### 1.7 What to copy from Airbyte

1. **The four-verb connector contract (`spec`, `check`, `discover`, `read`) plus an opaque, source-owned state blob that the sink echoes back only after it commits.** Use it as the TypeScript interface for every ledger reader. [Protocol](https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md)
2. **Per-stream state** (one cursor per object type per customer ledger), so one stream can be reset without touching the others. Same source.
3. **Treat schema-change policy as a per-connection setting**, using the four policy values, and auto-pause on a lost cursor or primary key. [Schema change management](https://github.com/airbytehq/airbyte/blob/master/docs/platform/using-airbyte/schema-change-management.md)
4. **Copy the Xero and QuickBooks read rules, not the code**: cursor fields, server-side filters, page sizes, rate-limit budgets, the soft-delete clause and refresh-token rotation. [Xero manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-xero/manifest.yaml), [QuickBooks manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml)
5. **Split error handling into config errors** (stop and ask the customer to re-authorise) **and transient errors** (retry with backoff), with a human-readable message per error code. Same source.
6. **Give each connector a "skill" document** (entities, actions, filters) that the agent reads before calling it. [MCP tools](https://github.com/airbytehq/airbyte/blob/master/docs/platform/airbyte-mcp/tools.md)
7. **Run three access paths side by side: replicated tables, live direct reads and a search index**, and tell the agent the freshness of each. [Context layer](https://github.com/airbytehq/airbyte/blob/master/docs/platform/context-layer/readme.md)
8. **Agents may prepare, humans submit.** The Stripe-dispute skill never submits on the user's behalf. Copy this for the first payment-reminder releases. [July 2026 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jul-2026-agents-can-now-write-to-salesforce-and-hubspot.md)

#### 1.8 What not to copy, and weaknesses

- Do not run Airbyte Core as the founder's ingestion engine. It needs Kubernetes and Java services, its per-customer sources do not match a multi-tenant product, and ELv2 forbids exposing its UI or API to customers. [Inference + Fact for ELv2]
- Do not copy the agent-permission model, in which the service credential defines what an agent can see. [Fact for the model]
- Do not lean on community-grade connectors for ledgers that are core to the product.

#### 1.9 Relationship to the founder's product

**Teacher**, first of all: the protocol, state design and manifests. Possibly a **supplier**: an ELv2-permitted use would be a customer's own warehouse feed, or PyAirbyte for back-office analytics. A **future competitor**, if the Context Store grows into a governed "business model for agents", but today it has no metrics, rules or actions layer. [Inference]

### 2. Fivetran (with dbt Labs and Census)

**In one paragraph.** Fivetran is the market-leading managed ELT service. The buyers are heads of data and analytics engineers at mid-market companies and enterprises; named customers include OpenAI, LVMH, Pfizer, Verizon and Spotify [Vendor claim] ([announcement](https://www.businesswire.com/news/home/20251013172495/en/Fivetran-and-dbt-Labs-Unite-to-Set-the-Standard-for-Open-Data-Infrastructure)). They pay for warehouse tables that stay current without engineering effort. Fivetran acquired Census, a reverse-ETL company, in 2025; Census syncs are now sold as "Activations" [Fact] ([pricing](https://www.fivetran.com/pricing)). Its all-stock merger with dbt Labs was announced on 13 October 2025 and completed on 1 June 2026, with George Fraser as CEO and Tristan Handy as President [Fact] ([press release](https://www.fivetran.com/press/fivetran-dbt-labs-complete-merger-to-create-the-data-infrastructure-for-trusted-ai-agents)).

**Function catalogue** (from the pricing page and the merger release, 21 November 2026):
- *Connections*: 700+ managed connectors, 15-minute syncs on Standard and 1-minute syncs on Enterprise and above, SSH tunnels, VPN tunnels (Enterprise, annual contracts), hybrid deployment, a choice of cloud, and enterprise database connectors. [Fact] ([pricing](https://www.fivetran.com/pricing))
- *Activations* (formerly Census): 200+ destinations, and Audience Hub on Enterprise. [Fact] (same)
- *Transformations*: dbt Core integration, billed per successful model run (free up to 5,000 runs, then $0.01, $0.007 and $0.002 per run by volume band). [Fact] (same)
- *Security tiers*: Business Critical adds customer-managed keys, PCI DSS Level 1 and private networking. [Fact] (same)
- *dbt after the merger*:
  - dbt Core v2.0 (alpha) open-sources the Fusion engine runtime under Apache 2.0.
  - dbt State (preview) is a cache that builds only changed models, with a claimed saving of 30% or more.
  - dbt Wizard (beta) is AI help for writing models.
  - "Agents Schema" is an open standard that uses one warehouse schema as the shared context layer for agents.
  [Fact for what was announced, vendor claim for the savings] ([press release](https://www.fivetran.com/press/fivetran-dbt-labs-complete-merger-to-create-the-data-infrastructure-for-trusted-ai-agents))
- HVR (high-volume database replication, acquired 2021) was not mentioned on the pricing page. [Unverified status]

**Commercials.**
- Pricing is by monthly active rows (MAR): inserts, updates and deletes, with unchanged rows excluded. The spend rate falls as volume rises.
- Each standard connection with 1 MAR to 1M MAR carries a $5 base charge.
- The Free plan includes 500,000 MAR for connections, 3,500 MAR for activations and 5,000 model runs.
- Annual contracts earn discounts of up to 22.6%+ on list.
- Example on the pricing page: four marketing connectors come to $511.15 a month.
[Fact] ([pricing](https://www.fivetran.com/pricing))
- Combined ARR was said to be "approaching $600M" at the merger announcement (October 2025). dbt is used by more than 80,000 data teams, and the combined company says it supports over 100,000. [Vendor claim] ([announcement](https://www.businesswire.com/news/home/20251013172495/en/Fivetran-and-dbt-Labs-Unite-to-Set-the-Standard-for-Open-Data-Infrastructure))

**Why customers choose it**: reliability and zero maintenance, breadth of enterprise connectors, and security certifications. **Complaints**: cost unpredictability under MAR, made worse by the per-connection base charge. [Inference from the pricing model; review sites not opened]

**Relationship to the founder**: a **teacher** for pricing mechanics (bill only changed rows; exclude initial syncs). It is not a supplier for a per-customer embedded product. The "Agents Schema" idea, one warehouse schema as agent context, is a direct conceptual **competitor** to the founder's model layer. [Inference]

### 3. Stitch, Matillion, Hevo, Estuary, Meltano, Singer (ELT long tail)

These are short sections, because of the web budget.
- **Singer** is the original open spec for "taps" and "targets" exchanging JSON-lines messages (SCHEMA, RECORD, STATE). It is the ancestor of the Airbyte Protocol, which kept the opaque STATE idea. [Inference from protocol similarity; Singer spec not opened this round]
- **Stitch** (owned by Qlik via Talend) is a hosted Singer runner. Pricing and current status were not verified. [Unverified]
- **Meltano** is an open-source (MIT) ELT command-line tool and orchestrator for Singer taps, with the "Meltano Hub" catalogue. Current company status was not verified. [Unverified]
- **Matillion** is an ELT and transformation platform for Snowflake, Databricks and Redshift, and has announced an AI "data engineer" agent (Maia). Pricing was not verified. [Unverified]
- **Hevo** is a no-code ELT vendor aimed at mid-market teams, including in India and South-East Asia, and publishes Fivetran comparisons. Pricing was not verified this round. [Unverified]
- **Estuary** is a real-time CDC and streaming ELT vendor ("Flow"). Pricing was not verified this round. [Unverified]

None of these covers the founder's per-customer ledger job better than the options below. [Inference]

### 4. dlt and dltHub

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

### 5. Unified APIs for accounting and finance

**What the category is, with a tiny example.** A unified API gives you one `GET /invoices` that works against Xero, QuickBooks, NetSuite and others. The vendor maps each ledger's fields onto a common model and handles each customer's OAuth through a hosted "link" screen. You pay per connected customer (a "linked account" or "consumer") or per API call. The real choice inside the category is between **sync-and-store**, where the vendor copies the customer's ledger and you read the copy (Merge, Codat, Rutter), and **real-time pass-through**, where each call goes to the ledger and the vendor generates "virtual webhooks" by polling (Apideck, Unified.to). [Fact] ([Apideck comparison, 2 to 19 Nov 2026, written by a competitor](https://www.apideck.com/blog/best-accounting-apis-for-fintech.md))

#### 5.1 Merge

- **What it is.** A unified API across accounting, HR and payroll, ATS, CRM, ticketing and file storage, plus a newer **Agent Handler** product. The buyers are product and engineering leaders at B2B SaaS and AI companies. Logos on the Agent Handler page include OpenAI, Ramp, Perplexity, JetBrains and Culture Amp. [Vendor claim] ([Agent Handler](https://www.merge.dev/agent-handler))
- **Functions.**
  - Unified API with read and write.
  - Merge webhooks plus forwarded third-party webhooks.
  - Authenticated Passthrough to raw endpoints.
  - Field Mappings, including through the API.
  - Custom fields and field-level scopes (Professional).
  - Audit Trail and unlimited sandboxes (Enterprise).
  - The `/meta` endpoint, which returns each integration's required fields before a write.
  - Accounting common models: Account, AccountingPeriod, Attachment, BalanceSheet, BankFeedAccount, BankFeedTransaction, CashFlowStatement, CompanyInfo, Invoice, Payment, JournalEntry and more.
  [Fact] ([pricing](https://www.merge.dev/pricing), [accounting page](https://www.merge.dev/categories/accounting-api))
- **Accounting coverage listed**: Clear Books, FreeAgent, FreshBooks, Dynamics 365 Business Central, Moneybird, NetSuite, Oracle Fusion, QuickBooks Online, Sage Business Cloud Accounting, Sage Intacct, Wave, Workday, Xero and Zoho Books. MYOB, QuickBooks Desktop, SQL Account and AutoCount are not listed. My page extraction also showed a "Beta / Coming soon" marker, which may apply to only some entries. [Fact for the list, unverified for the status markers] ([accounting page](https://www.merge.dev/categories/accounting-api))
- **Agent Handler.**
  - An MCP-based gateway with "Tool Packs" (groups of connectors), scoped per agent type, customer tier or environment.
  - Authorisation prompts appear when an agent needs a connector the user has not yet authorised.
  - Data-loss prevention scans tool inputs and outputs and can block, redact or mask.
  - SCIM provisioning through Okta or Azure AD.
  - An audit log on every plan, recording identity, arguments, downstream API calls and outcome.
  - Users can import any public MCP server.
  - Pricing is credit-based per tool call, free to start, with Enterprise at a custom price.
  [Fact/Vendor claim] ([Agent Handler](https://www.merge.dev/agent-handler))
- **Pricing.** Launch: the first 3 production linked accounts are free, then $650 a month for up to 10 and $65 for each account after that; 100 requests a minute; 3-day log retention. Professional and Enterprise are contract-priced, at 400 and 600 requests a minute, with 30 and 90+ days of log retention. [Fact] ([pricing](https://www.merge.dev/pricing)). Merge stores synced data by default, indefinitely until deleted, and Launch syncs daily. Passthrough requests need Professional or Enterprise. [Fact as reported by a competitor] ([Apideck](https://www.apideck.com/blog/best-accounting-apis-for-fintech.md))
- **Relationship**: a **supplier** option. Agent Handler is a **competitor** to the founder's "governed actions for agents" layer, but at the tool-call level, not the business-model level. [Inference]

#### 5.2 Codat

- **What it is.** A UK-based API for connecting small-business accounting, banking and commerce data. The buyers are lenders, banks and fintechs (underwriting, bank feeds, payables and expense sync). Product lines listed on its site: Spend Insights, Bank Feeds, Bill Pay, Expenses, Lending and the Platform API. [Fact] ([Codat update](https://docs.codat.io/updates/260116-xero-pricing))
- **How it works.** Sync-and-store: data is read into Codat's cache on a per-dataset schedule. The default frequency is "None", with monthly to daily options, and hourly is premium. Writes are asynchronous, taking "a few seconds to a couple of minutes". [Fact as reported by a competitor] ([Apideck](https://www.apideck.com/blog/best-accounting-apis-for-fintech.md))
- **Coverage**: 17 integrations, with bank feeds for Xero, QuickBooks Online, NetSuite and Sage. [Fact as reported] (same)
- **Pricing**: not published; platform fees are priced annually. [Fact as reported] (same). Codat's own guidance on Xero's 2026 tiers tells customers to choose a Xero tier, add a payment method in Xero's portal and reduce sync frequency. In other words, **the customer holds the Xero app and pays Xero**. [Fact] ([Codat update](https://docs.codat.io/updates/260116-xero-pricing))
- **Relationship**: a **teacher** for lender-grade data products. A poor **supplier** fit for collections, because its sync is too slow and its pricing is opaque. [Inference]

#### 5.3 Rutter

- **What it is.** A unified API for accounting/ERP, commerce and payments, sold to fintechs. Its page says it is "Trusted by 100+ fintech companies", with logos including Mercury, Parafin, Airwallex, PayPal and Payoneer. Orb shipped a NetSuite integration in 2.5 weeks. [Vendor claim] ([Rutter accounting](https://www.rutter.com/accounting))
- **Coverage**: the broadest of the group. It includes Xero, QuickBooks Online **and Desktop**, NetSuite, Sage Intacct, Sage 50, Sage 200 Cloud, Sage Business Cloud, **MYOB**, **Zoho Books**, Wave, FreshBooks, Exact Online, Dynamics 365 Business Central and F&O, Great Plains, SAP, Oracle Fusion, Workday, Acumatica and Odoo. SQL Account and AutoCount are not listed. [Fact] (same)
- **How it works**: read, write, update and delete through one model; white-labelled "Rutter Link". It caches with webhooks. The initial sync takes hours to days, and data refreshes every 60 minutes by default, configurable up to two weeks. [Fact; the sync timings come from a competitor's article] ([Rutter](https://www.rutter.com/accounting), [Apideck](https://www.apideck.com/blog/best-accounting-apis-for-fintech.md))
- **Pricing**: not published. There is a free 30-day Starter with four ledgers. [Fact as reported] (Apideck)
- **Relationship**: the best **supplier** candidate if the founder needs MYOB, QuickBooks Desktop or Sage 50 coverage quickly. [Inference]

#### 5.4 Apideck

- **What it is.** A real-time pass-through unified API with 55+ accounting connectors. It says it does not store customer financial data. It polls ledgers that lack webhooks and emits "virtual webhooks". It writes invoices, bills, payments and journals "where the platform allows". [Vendor claim] ([Apideck](https://www.apideck.com/blog/best-accounting-apis-for-fintech.md))
- **Pricing**: Launch from $599 a month for 25 active consumers; Scale (100 to 500 consumers) drops to $8.50 per consumer; 30-day trial, no free tier. [Vendor claim] (same)
- **Relationship**: a **supplier** option. Its blog posts are the best secondary summaries of the Xero and Intuit price changes. [Inference]

#### 5.5 Unified.to

- **What it is.** A real-time unified API and MCP server across 2,300+ integrations, 377 of them tagged Accounting. It has a passthrough API, an optional "database sync" and virtual webhooks. [Vendor claim] ([pricing](https://unified.to/pricing))
- **Pricing**:
  - Test: free, non-production, 10,000 calls.
  - Grow: $750 a month, 750,000 calls, $1.00 per 1,000 over.
  - Pro: $1,500 a month, 2 million calls, $0.75 per 1,000 over.
  - Scale: $3,000 a month, 6 million calls, $0.50 per 1,000 over.
  - Enterprise: custom, including single-tenant or on-premises.
  - Connections and customers are unlimited. A list call returning up to 100 records counts as one call. Webhook deliveries count; polls that find nothing new do not.
  [Fact] (same)
- **Relationship**: a **supplier** option, priced per call, so cost does not grow with customer count. [Inference]

#### 5.6 Finch (payroll) and Plaid (banking)

- **Finch**: a unified payroll and HRIS API (US-centric). Not opened this round. It is outside the receivables job except for employee data. [Unverified]
- **Plaid**: bank-account aggregation (transactions, balances, identity), mainly in the US, Canada and Europe. Bank-side cash data for reconciliation would come from Plaid in those markets. In Malaysia, bank data would come from local open-finance initiatives or bank statements, not Plaid. [Unverified this round: neither Plaid's coverage pages nor its pricing were opened]. Airbyte has a community `source-plaid` connector. [Fact] (repo listing)

#### 5.7 Coverage and price matrix for the ledgers the founder cares about

| | Xero | QBO | NetSuite | Sage | MYOB | Zoho Books | SQL Account | AutoCount | Published price |
|---|---|---|---|---|---|---|---|---|---|
| Merge | Yes | Yes | Yes | Intacct, Business Cloud | No | Yes | No | No | $650/mo for 10, then $65 each |
| Codat | Yes | Yes | Yes | Yes | [Unverified] | [Unverified] | No | No | Not published |
| Rutter | Yes | Yes (+Desktop) | Yes | Intacct, 50, 200, BC | Yes | Yes | No | No | Not published |
| Apideck | [Not stated] | Yes | Yes | Intacct | [Not stated] | Yes | No | No | $599/mo for 25 |
| Unified.to | 377 accounting integrations; individual ledgers not checked | | | | | | [Unverified] | [Unverified] | $750/mo for 750k calls |
| Nango | Yes | Yes | Yes (OAuth2, TBA, client credentials) | Sage, Intacct | Yes (provider entry) | Yes (provider entry) | No | No | $50/mo pay-as-you-go |
| Airbyte | Beta, community | GA, certified | Alpha, community | No (Sage HR only) | No | Yes (community) | No | No | Credits |

Sources: [Merge](https://www.merge.dev/categories/accounting-api), [Rutter](https://www.rutter.com/accounting), [Apideck](https://www.apideck.com/blog/best-accounting-apis-for-fintech.md), [Nango providers.yaml](https://github.com/NangoHQ/nango/blob/master/packages/providers/providers.yaml), Airbyte connector metadata. SQL Account and AutoCount, the Malaysian desktop and on-premises ledgers, appear in none of these catalogues. They would need direct work: a local agent, database or export reading, or the vendors' own APIs if any exist. [Inference; the vendors' API availability is unverified]

### 6. Embedded-integration and agent-tooling vendors

#### 6.1 Nango

**In one paragraph.** Nango is infrastructure for product integrations. It stores and refreshes your end users' OAuth tokens and API keys, proxies API calls, runs your TypeScript "functions" (syncs, tools and webhook handlers) on its runners, and keeps synced records for your backend to pull. The buyers are engineering leads at B2B SaaS and AI-agent companies who want code-level control without running OAuth infrastructure. [Fact] (study 14; [self-hosting architecture](https://github.com/NangoHQ/nango/blob/master/docs/guides/platform/self-hosting/self-hosting.mdx))

**Function catalogue** (from the repo docs, 20 November 2026):
- **API and MCP auth.** There are 1,441 provider entries in `providers.yaml`. Each has an auth mode (OAUTH2, OAUTH2_CC, TBA, TWO_STEP, API key and others), templated authorisation and token URLs, default scopes, proxy base URL, retry-after headers and connection-config fields (for example QuickBooks `realmId`, NetSuite `accountId`). [Fact] ([providers.yaml](https://github.com/NangoHQ/nango/blob/master/packages/providers/providers.yaml))
- **Proxy**: authenticated pass-through with the provider's base URL and retry-after handling. [Fact] (same)
- **Syncs**: scheduled functions that fetch records and store them in Nango's Postgres, with change detection; your backend pulls changes or receives a webhook. **Tools**: synchronous actions (create, update, get, list) callable from your backend or from an agent through MCP. **Webhooks**: provider webhooks routed to the right connection by a per-provider routing script. [Fact] ([Xero functions](https://github.com/NangoHQ/nango/blob/master/docs/snippets/generated/xero/PreBuiltUseCases.mdx), [Xero webhooks guide](https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/xero/webhooks.mdx))
- **Prebuilt functions for the founder's three ledgers** [Fact] (generated docs under `docs/snippets/generated/`):
  - *Xero*: syncs for accounts, bank transactions, contacts, credit notes, invoices, items, organisations, payments, purchase orders and the general ledger (journals); tools for create, get, list and update of invoices, credit notes, payments, contacts, bank transactions and items, plus list and get tenants.
  - *QuickBooks*: create and get tools for accounts, bills, credit memos, customers, deposits, estimates, invoices, items, journal entries, payments, purchase orders and vendors, plus list tools.
  - *NetSuite (TBA)*: syncs for credit notes, customers, invoices, payments, general ledger and locations; tools to create and update invoices, payments, credit notes, customers, bills and purchase orders, plus `fetch-fields`.
- **Email**: Gmail tools (messages, threads, drafts, labels, filters, attachments, send-as) and webhooks through Google Pub/Sub `watch`. Nango matches each notification to a connection by a stored hash of the mailbox address. Outlook tools cover messages, folders, attachments, reply and reply-all, and calendar. [Fact] ([Gmail webhooks guide](https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/google-mail/webhooks.mdx), generated Outlook docs)
- **NetSuite authentication variants**: OAuth 2.0 (authorisation code against `<account>.app.netsuite.com`, scope `rest_webservices`), TBA, and client credentials. [Fact] ([providers.yaml](https://github.com/NangoHQ/nango/blob/master/packages/providers/providers.yaml))
- **Platform features**: white-labelled auth ("Secured by Nango" can be removed), SAML SSO, SCIM, RBAC, audit trail, HIPAA/BAA, logs, metrics and alerts. [Fact] ([pricing](https://nango.dev/pricing))

**How it works underneath.**
- Five Node services: Server, Orchestrator, Jobs, Runner and Persist.
- Postgres holds the control plane, credentials, schedules and synced records.
- Object storage holds compiled function code, Elasticsearch or OpenSearch holds logs, and Redis holds token-refresh locks and rate limits.
- Credentials are encrypted at rest with `NANGO_ENCRYPTION_KEY`, optionally wrapped by a KMS.
- Recommended self-hosted sizing: 1 CPU and 2 GB per service, and Postgres at 2 CPU, 8 GB and 128 GB.
[Fact] ([self-hosting](https://github.com/NangoHQ/nango/blob/master/docs/guides/platform/self-hosting/self-hosting.mdx), [self-managed](https://github.com/NangoHQ/nango/blob/master/docs/guides/platform/self-hosting/self-managed.mdx))

**Commercials.**
- Free: $0, hard caps of 10 connections, 10 compute hours and 10 GB.
- Pay-as-you-go: $50 a month including $50 of usage, then $0.29 per connection per month, $0.72 per compute hour and $0.50 per GB of egress.
- Growth add-on: $450 a month, for Slack support.
- Enterprise: custom, "as low as $0.01/connection/month at scale".
- Self-hosting (BYOC or self-managed) is **Enterprise only**: a fixed annual licence plus a fraction of Cloud usage fees.
[Fact] ([pricing](https://nango.dev/pricing), [self-hosting](https://github.com/NangoHQ/nango/blob/master/docs/guides/platform/self-hosting/self-hosting.mdx)). The licence is ELv2. [Fact] (study 14)

**Why customers choose it** [Inference]: code-first functions in TypeScript that live in your own repository; the widest auth catalogue; prebuilt functions you can fork; and per-connection pricing low enough for a start-up.

**What to copy**:
- the provider-catalogue format, but re-derived from each provider's docs, not copied, because the file is ELv2;
- token-refresh locks held in Redis, or Postgres advisory locks;
- webhook routing by a stored hash of the account identifier.
[Inference]

**Relationship**: the strongest **supplier** candidate for the founder's auth and ledger layer. [Inference]

#### 6.2 Paragon

- **What it is.** An embedded integration platform for SaaS companies. Products:
  - *Connect* (a white-labelled connect portal or headless UI, with managed auth);
  - *Workflows* (an embedded iPaaS, written in TypeScript or a low-code builder, with git sync and dev, staging and prod environments);
  - *Managed Sync* (high-volume ingestion with normalised schemas and a Permissions API for RAG);
  - *ActionKit* (one API plus an MCP server for synchronous actions, with schemas for agents and workflow UIs).
  [Fact] ([pricing](https://www.useparagon.com/pricing))
- **Pricing**: Pro and Enterprise are both "talk to sales", metered on connected users; integrations are unlimited; syncs can run up to every minute. Enterprise adds self-hosting or forward-deployment and single-tenant options. SOC 2 Type II and GDPR are listed. [Fact] (same)
- **Relationship**: a **supplier** alternative to Nango, more expensive and less transparent. [Inference]

#### 6.3 Prismatic

An embedded iPaaS for B2B SaaS, with a low-code designer plus code-native integrations and an embedded marketplace. Not opened this round. [Unverified]

#### 6.4 Pipedream

- Pipedream Connect offers managed auth plus an MCP server over thousands of APIs for developers. Workday signed a definitive agreement to acquire Pipedream on 19 November 2025. [Fact] ([Workday press release](https://newsroom.workday.com/2025-11-19-Workday-Signs-Definitive-Agreement-to-Acquire-Pipedream))
- The component code is under the Pipedream Source Available License, which excludes commercial use. [Fact] (study 14)
- **Relationship**: do not depend on it. Its future pricing and terms under Workday are unknown. [Inference]

#### 6.5 Composio

- **What it is now.** A tool-calling layer for AI agents: 1,700+ apps, managed connections, triggers that start background agents from app events, custom MCP servers, and a plain-English "Firewall" policy engine. [Vendor claim] ([pricing](https://composio.dev/pricing))
- **Pricing**:
  - Free: $2 of one-time credits, 10,000 tool calls a month, 3 members.
  - Standard: $18 per seat per month, "coming soon", 10,000 calls per seat.
  - Extra tool calls: $0.005 each. Firewall policies: $0.50 per million tokens.
  - Enterprise: BYOC.
  [Fact] (same)
- Xero, NetSuite and Gmail are named in its use cases. QuickBooks is not named on the pricing page. [Fact] (same)
- **Relationship**: a **competitor** for "agents act across apps". A weak supplier for a system of record. [Inference]

#### 6.6 Arcade

- Arcade sells agent tool execution with user-scoped authorisation: Free (2,000 calls a month), Team ($25 a month plus $0.01 per call), and Enterprise (Arcade Cloud, your VPC or air-gapped, with SSO, RBAC, audit logs and a private registry). [Fact] ([pricing](https://www.arcade.dev/pricing))
- **Relationship**: a **teacher** for "the agent acts as the user, with that user's own OAuth grant". A possible supplier for long-tail actions. [Inference]

#### 6.7 Zapier, Make, n8n, Workato, Tray

- **Zapier MCP.** It connects Claude, ChatGPT, Cursor and other clients to 9,000+ apps and 30,000+ actions, and it is included in every Zapier plan. **Each tool call uses two tasks** from the same task quota that Zaps use. Credentials stay in Zapier's connection layer. Admins set access controls per app and per action, and MCP history records what ran. Enterprise admins can switch MCP on or off per workspace. Workflows can be saved as reusable "Skills". "Code Actions" let the agent write and run code when no standard action fits. Next-Gen Zaps built from AI clients are in early access, free until billing starts on 1 December 2026. [Fact/Vendor claim] ([Zapier MCP](https://zapier.com/mcp)). **Relationship**: fine for the founder's own back office. It is not something to build a product on, because each customer would need a Zapier account and the task costs grow with every call. [Inference]
- **Make** is a visual automation tool (scenarios and operations). Not opened this round. [Unverified]
- **n8n** is a workflow automation tool that can be self-hosted, with AI-agent nodes. It ships under the "Sustainable Use License", which allows internal business use and restricts offering it commercially to others. I could not open the licence page this round (the URL returned not-found), so treat the exact limits as unverified and have a lawyer read them before embedding n8n. [Unverified]
- **Workato** is an enterprise iPaaS that now describes itself as "Workato ONE":
  - a *control plane*: AI Control Plane, AI Gateway, API Gateway, Enterprise MCP, and App & Data MCP Servers;
  - an *execution plane*: iPaaS, data orchestration and IDP (document processing);
  - *Agent Studio*, a low-code agent builder for "Genies" over 1,200+ apps;
  - prebuilt Genies for CX, HR, IT, Sales, Support and SecOps;
  - *AIRO*, a new multi-agent system.
  Customer data is encrypted with a key that rotates every hour. No prices or customers are on the page. [Vendor claim] ([Workato agentic](https://www.workato.com/agentic)). **Relationship**: a **competitor** at the enterprise end, with "Genies grounded in enterprise rules". Its MCP-server-per-app pattern is worth studying. [Inference]
- **Tray.ai** is an enterprise iPaaS with an agent builder ("Merlin"). Not opened this round. [Unverified]

### 7. Document and email ingestion for finance

**Why this matters.** Remittance advices, customer payment confirmations and credit-note requests often arrive as PDF attachments by email. The founder's product has to read the mailbox, decide what each message is, extract the invoice numbers and amounts, and match them to open invoices in the ledger. [Inference]

#### 7.1 Document parsers

| Vendor | What it does | Price (fetched 21 Nov 2026) | Notes |
|---|---|---|---|
| **LlamaParse** (LlamaIndex) | Parsing at four tiers (Fast, Cost-effective, Agentic, Agentic Plus), plus LlamaExtract schema extraction with citations and confidence | Pay-as-you-go: 10,000 free credits a month, then $1.50 per 1,000 credits. Pro: $500 a month for 400,000 credits. Per page: 1, 3, 10 or 25 credits, so $1.50 to $37.50 per 1,000 pages. Layout adds 3 credits. Re-parsing a cached file is free | Extraction credits are charged on top of parsing and were not listed on the page [Fact] ([pricing](https://www.llamaindex.ai/pricing)) |
| **Reducto** | APIs to parse, extract, split, classify and edit | r-1 Parse $10 per 1,000 pages; r-1 mini $1; Extract $20 (includes parsing); Deep Extract $40; Split $20; Classify $7.50. $150 free usage. 20% batch discount | Zero-data-retention agreement and BAA on Growth; VPC or on-prem on Enterprise; EU and Australian residency [Fact] ([pricing](https://reducto.ai/pricing)) |
| **Mindee** | Prebuilt models (invoice, receipt, bank statement, IBAN, bill of lading and others), plus a custom data extractor, classifier and splitter | Starter about 44 a month, Pro about 116 a month (currency not shown); 1 credit per page, 1.5 with a confidence score; overage from $0.05 with a 20% surcharge; 14-day trial | The page had placeholder values, so check before relying on these figures [Fact with caveat] ([pricing](https://www.mindee.com/pricing)) |
| **Rossum** | Transactional-document AI for accounts payable and receivable, with a validation UI and workflows | Not opened | [Unverified] |
| **Nanonets** | Invoice OCR and workflow automation | Not opened | [Unverified] |
| **Docling** (open source, MIT) | Layout and table parsing that runs on your own machines | Free | Study 14 recommends running it as a separate service [Fact] |

**Choice** [Inference]: run Docling yourself for clean digital PDFs, and send hard scans to Reducto Extract (about $0.02 a page) or LlamaParse's Cost-effective tier (about $0.0045 a page). At an estimated 2,000 remittance pages a month per customer, either costs less than $50 a month. Always store the extracted fields with a confidence score and a link back to the source page.

#### 7.2 Email: Nylas compared with direct Gmail and Microsoft Graph

- **Nylas.** One API across Gmail, Microsoft and IMAP for email, calendar, contacts, a scheduler and a meeting notetaker, with webhooks for messages, threads and drafts, bounces, and connect/disconnect/re-authorisation events. Delivery can go to Pub/Sub or SNS. It keeps a 90-day IMAP cache. "Agent Accounts" give an agent its own inbox. Pricing:
  - Free: 5 accounts.
  - Essentials: $15 a month for 10 accounts, then $2.25 each.
  - Pro: from $49 a month for 25 accounts, then $2.00 each.
  - Use of Nylas's *shared* Google OAuth app (which saves you Google's verification process) is a $2,400-a-year add-on.
  [Fact] ([Nylas pricing](https://www.nylas.com/pricing/))
- **Gmail API directly.**
  - Quota: 1,200,000 units per minute per project and 6,000 units per minute per user.
  - Unit costs: `messages.send` 100, `messages.get` 20 (60 with full or raw format), `messages.list` 5, `history.list` 2, `watch` 100.
  - Up to 500 recipients per message.
  [Fact] ([Gmail quota](https://developers.google.com/workspace/gmail/api/reference/quota))
  - Incremental sync uses `history.list` from a stored `historyId`. Push notifications use `users.watch` to a Pub/Sub topic. Nango's guide documents the routing. [Fact] ([Nango Gmail webhooks](https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/google-mail/webhooks.mdx))
  - A product that requests restricted Gmail scopes must pass Google's OAuth verification and, for restricted scopes, an annual security assessment. [Unverified this round: Google's verification page was not opened; this is widely documented]
- **Microsoft Graph directly.** Mail is read through `/me/messages` (or delta queries) and sent with `sendMail`. The scopes are `Mail.Read`, `Mail.Send` and `offline_access`. Change notifications come from Graph subscriptions. [Fact for the scopes] ([Airbyte Outlook docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/outlook.md)). The per-mailbox throttling limits were not extracted: the page fetch was truncated. [Unverified]
- **For outbound reminders**, sending *from the customer's own mailbox* through Gmail or Graph gives the best deliverability and keeps replies in the customer's own thread. A transactional sender (SES, Postmark) is needed only for a "no-reply" sender. [Inference]

### 8. The concrete answer: what a one-person company should buy, use as open source and build

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

### 9. Comparison table

| Company | Category | Best at | Open source / licence | Entry price | Relationship to founder |
|---|---|---|---|---|---|
| Airbyte | ELT + agent context layer | Protocol, manifests, breadth | Core ELv2; CDK MIT | Cloud $20/mo; Plus $189/mo | Teacher; possible supplier; future competitor |
| Fivetran + dbt + Census | Managed ELT + transformation + activation | Reliability, enterprise | dbt Core Apache 2.0 | Free tier; MAR plus a $5 base per connection | Teacher; competitor (Agents Schema) |
| dlt / dltHub | Python EL library + platform | Config grammar | dlt Apache-2.0; dltHub commercial | dlt free | Teacher; optional supplier |
| Merge | Unified API + Agent Handler | Breadth of categories, governance | Closed | $650/mo for 10 accounts | Supplier option; competitor at the tool layer |
| Codat | Unified finance-data API | Lending, bank feeds | Closed | Not published | Teacher |
| Rutter | Unified accounting, commerce, payments | Ledger breadth (MYOB, QB Desktop) | Closed | Not published | Supplier for the long tail |
| Apideck | Real-time unified API | Pass-through, no storage | Closed | $599/mo for 25 | Supplier option |
| Unified.to | Real-time unified API + MCP | Per-call pricing | Closed | $750/mo | Supplier option |
| Nango | Integration infrastructure | OAuth, functions, webhooks | ELv2 (self-host Enterprise only) | $50/mo pay-as-you-go | **Primary supplier** |
| Paragon | Embedded iPaaS | Workflows, ActionKit | Closed | Sales-led | Alternative supplier |
| Pipedream | Connect + workflows | Breadth | Source-available, no commercial use | n/a (Workday) | Avoid |
| Composio / Arcade | Agent tool calling | Long-tail actions | Partly open source | $0.005 to $0.01 per call | Teacher; competitor |
| Zapier / Make / n8n / Workato / Tray | Automation / iPaaS | Business-user automation | n8n Sustainable Use (unverified) | Zapier: 2 tasks per MCP call | Competitor at the edges |
| LlamaParse / Reducto / Mindee / Docling | Document AI | Remittance extraction | Docling MIT | About $1 to $20 per 1,000 pages | Supplier |
| Nylas / direct Gmail and Graph | Email | Mailbox read and send | n/a | Nylas $2 to $2.25 per account | Build direct; Nylas is the fallback |

## What to copy

1. **The connector contract `spec / check / discover / read`, with an opaque, source-owned state blob that is committed only after the sink commits.** This gives resumable, exactly-once-enough incremental syncs. [Airbyte protocol](https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md)
2. **Per-stream state**, so one object type can be reset for one customer without affecting the others. Same source.
3. **Xero read rule**: `If-Modified-Since` on `UpdatedDateUTC`, page size 1,000, fail fast on the daily-limit 429, exponential retry on the per-minute 429, and treat a 401 as "re-consent needed". [Xero manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-xero/manifest.yaml)
4. **QuickBooks read rule**: a query on `Metadata.LastUpdatedTime` within a closed time window, with `Active IN (true,false)` so soft deletes arrive; a budget of 10 per second and 500 per minute per realm; map fault codes 3200 and 3201 to "re-authorise"; and store each rotated refresh token atomically. [QBO manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml), [QBO docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/quickbooks.md)
5. **NetSuite**: OAuth 2.0 only (TBA closes to new integrations from 2027.1); date windows with a one-day look-back; surface role-permission errors to the customer's admin, record type by record type. [NetSuite docs](https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md)
6. **Errors fall into two classes, config and transient**, each with a human-readable message per code. Config errors pause the connection and email the customer's admin. [QBO manifest](https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml)
7. **Schema-change policy per connection** (propagate, approve, or pause), with an automatic pause when a cursor or primary key is lost. [Schema change management](https://github.com/airbytehq/airbyte/blob/master/docs/platform/using-airbyte/schema-change-management.md)
8. **Three access paths with labelled freshness**: synced tables, live direct reads and a search index. The agent is told which path answered. [Context layer](https://github.com/airbytehq/airbyte/blob/master/docs/platform/context-layer/readme.md)
9. **A connector "skill" document** listing entities, actions and filters, which the agent reads before calling. [MCP tools](https://github.com/airbytehq/airbyte/blob/master/docs/platform/airbyte-mcp/tools.md)
10. **Webhooks as dirty markers**, routed to a connection by a stored hash of the account identifier and followed by a targeted re-read. [Nango Gmail webhooks](https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/google-mail/webhooks.mdx)
11. **A per-tool-call audit record**: identity, arguments, downstream calls and outcome. Add DLP-style masking on tool outputs. [Merge Agent Handler](https://www.merge.dev/agent-handler)
12. **Tool Packs**: tools scoped per agent type, customer tier and environment, so an agent only sees what it may call. Same source.
13. **Agents prepare, humans submit**, for money-moving and customer-facing actions in early releases. [Airbyte July 2026 newsletter](https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jul-2026-agents-can-now-write-to-salesforce-and-hubspot.md)
14. **Bill only changed rows, and exclude initial syncs.** This is a fair usage metric if the founder ever prices by volume. [Fivetran pricing](https://www.fivetran.com/pricing)
15. **Rate budgets per tenant *and* per app**, as Xero sets them: 60 a minute and the daily cap per organisation, plus 10,000 a minute per app. [Xero FAQ](https://developer.xero.com/faq/pricing-and-policy-updates)
16. **Track egress per customer from day one.** Xero now bills egress in GB, so log bytes per tenant and avoid full re-pulls. [Xero pricing](https://developer.xero.com/pricing)

## What cannot or should not be copied

- **Code from ELv2 projects (the Airbyte platform and connectors, Nango, its `providers.yaml`) shipped inside the product.** Read them as specifications; re-derive the details from each provider's documentation. [Inference; licence facts from study 14 and the Airbyte FAQ]
- **The dltHub toolkits**: their licence claims code generated with their help as a derivative work. [Fact] ([dltHub licence](https://github.com/dlt-hub/dlt/blob/devel/docs/website/docs/hub/license.md))
- **Pipedream components**: no commercial use. [Fact]
- **The Airbyte agent-permission model**, in which the stored service credential defines visibility. The founder needs per-user, per-object permissions. [Inference]
- **Store-everything-indefinitely by default** (Merge). It is a liability for finance data. Keep only what the model needs, and set retention limits. [Inference]
- **Training on ledger data**: contractually forbidden for Xero. [Fact]

## Open questions and unverified items

- Airbyte Embedded's current status and pricing; the list of connectors in the airbyte-agent-connectors repository; Airbyte's revenue.
- Codat and Rutter prices; Merge's per-ledger status (GA or beta); whether Unified.to and Apideck cover MYOB, SQL Account or AutoCount.
- Xero webhook coverage of payments and credit notes. The Intuit CDC endpoint limits. How deleted records are detected in NetSuite.
- Microsoft Graph throttling limits for Outlook, and Google's restricted-scope verification cost and timeline.
- The exact terms of n8n's Sustainable Use Licence. Pricing for Make, Tray, Prismatic, Matillion, Hevo, Estuary, Stitch, Meltano, Rossum, Nanonets, Finch and Plaid (not opened because of the web budget).
- Whether SQL Account and AutoCount expose any API.

## Sources

1. https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md (protocol v0.19.0, 2025-10): the state and checkpoint design to copy.
2. https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml and https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/quickbooks.md (2026-11): QuickBooks read rules, rate budget and token rotation.
3. https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-xero/manifest.yaml and https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/xero.md: Xero cursor, paging and limits.
4. https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md: NetSuite authentication, the TBA end of support and concurrency governance.
5. https://developer.xero.com/pricing and https://developer.xero.com/faq/pricing-and-policy-updates (2026): Xero tiers, egress, rate limits and the no-AI-training clause.
6. https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program (updated 2026-11-19): Intuit partner tiers and metering (secondary source).
7. https://nango.dev/pricing and https://github.com/NangoHQ/nango (2026-11-20): pricing, providers, prebuilt ledger and email functions, self-hosting architecture.
8. https://github.com/airbytehq/airbyte/tree/master/docs/platform/context-layer and https://github.com/airbytehq/airbyte/blob/master/docs/platform/airbyte-mcp/tools.md: the agent access, search and MCP design.
9. https://github.com/airbytehq/airbyte/tree/master/docs/community/newsletter-archive (Oct 2025 to Jul 2026): dated Airbyte product timeline.
10. https://airbyte.com/pricing (fetched 2026-11-21): Airbyte plans; https://github.com/airbytehq/airbyte/blob/master/docs/platform/cloud/managing-airbyte-cloud/manage-credits.md and manage-data-workers.md: billing mechanics.
11. https://github.com/airbytehq/airbyte/blob/master/docs/community/licenses/license-faq.md and examples.md: what ELv2 permits.
12. https://www.apideck.com/blog/best-accounting-apis-for-fintech.md (2026-11): a competitor's comparison of Codat, Merge, Rutter, Chift and Apideck storage models and prices.
13. https://www.merge.dev/pricing, https://www.merge.dev/agent-handler, https://www.merge.dev/categories/accounting-api: Merge pricing, Agent Handler governance, accounting coverage.
14. https://unified.to/pricing: per-call unified API pricing.
15. https://www.rutter.com/accounting: the broadest ledger list.
16. https://docs.codat.io/updates/260116-xero-pricing (2026-01-16): unified-API customers pay Xero directly.
17. https://www.fivetran.com/pricing; https://www.fivetran.com/press/fivetran-dbt-labs-complete-merger-to-create-the-data-infrastructure-for-trusted-ai-agents (2026-06-01); https://www.businesswire.com/news/home/20251013172495/en/Fivetran-and-dbt-Labs-Unite-to-Set-the-Standard-for-Open-Data-Infrastructure (2025-10-13): Fivetran pricing, the merger and ARR.
18. https://developers.google.com/workspace/gmail/api/reference/quota: Gmail quota units.
19. https://www.nylas.com/pricing/: email API pricing and webhook catalogue.
20. https://reducto.ai/pricing, https://www.llamaindex.ai/pricing, https://www.mindee.com/pricing: document AI prices.
21. https://zapier.com/mcp: two tasks per MCP tool call.
22. https://composio.dev/pricing, https://www.arcade.dev/pricing, https://www.useparagon.com/pricing: agent tool and embedded iPaaS pricing.
23. https://www.workato.com/agentic: Workato ONE and agent products.
24. https://github.com/dlt-hub/dlt (2026-11-17), including the dltHub licence and verified-sources tree.
25. https://newsroom.workday.com/2025-11-19-Workday-Signs-Definitive-Agreement-to-Acquire-Pipedream: the Pipedream acquisition.
26. https://sacra.com/c/airbyte/: Airbyte funding and valuation (thin).
27. https://docs.airbyte.com/community/newsletter-archive/may-2026-three-ways-to-build-with-airbyte-agents: the Airbyte agent launch, May 2026.