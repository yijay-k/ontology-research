# External integrations and writeback

**Layer:** [12-apps-and-integration](README.md) · **What it is:** Writing results back to source systems, unified APIs and embedded-integration vendors.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Other companies and products](#other-companies-and-products) (2) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Lingyang, AgentOne and Alibaba

### 12. API and command line

> Source: [general-references/28-winnexo.md § 12. API and command line](../../general-references/28-winnexo.md#12-api-and-command-line)

- 82 endpoints under `/openapi`, with bearer tokens of three kinds: a user token (`wn_`), a deployment token (`wn_dpl_`) and an encrypted token. Groups: chat (7), skills (4), personal resources (19), knowledge base (16), scheduled tasks (8), object data (3), user and billing (4), user and permission management (15), organisation sync (4) ([Fact](https://robject.lydaas.com/help/en/extensions/openapi)).
- Tenant and user identifiers may not be passed in request bodies; they are derived from the token. Skill runs are asynchronous: `runSkill` returns a run id and `getSkillRun` is polled ([Fact](https://robject.lydaas.com/help/en/extensions/openapi)).

## Other companies and products

### 5. Unified APIs for accounting and finance

> Source: [general-references/24-integration-companies.md § 5. Unified APIs for accounting and finance](../../general-references/24-integration-companies.md#5-unified-apis-for-accounting-and-finance)

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

> Source: [general-references/24-integration-companies.md § 6. Embedded-integration and agent-tooling vendors](../../general-references/24-integration-companies.md#6-embedded-integration-and-agent-tooling-vendors)

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

## Earlier engineering notes (Phase 2)

### Writeback execution

> Source: former `10-integration-platform/connector-and-writeback-contracts.md` (moved here in the Nov 2026 restructure)

Writeback should be called by a durable workflow after the action has passed local validation, permission, approval and commit. Use idempotency keys derived from action ID and target-system operation. Save request hash and external correlation ID. Handle timeouts as unknown outcome—not automatic failure—then query/reconcile external state before retrying a non-idempotent operation.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No open-source implementations material in the research yet.
- No research literature material in the research yet.
