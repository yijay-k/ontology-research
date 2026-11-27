# Palantir and Lingyang (AgentOne, Dataphin, Quick BI, Quick Audience, Quick Service) as buyer-facing offer catalogues

Scope note (written 21 November 2026). This file lists everything each company sells to a customer, grouped the way a buyer meets it: platforms and modules, applications, AI features, security features, deployment options, services and programmes, industry solutions, partner offers, editions and prices. Every item is written as a function plus the benefit to the buyer, with a status, a date where known, and a source. Most of the material comes from the seven technical files in this folder (01 to 07: Palantir data layer, Ontology, AIP, security, apps and infrastructure, business; Lingyang and AgentOne) plus file 13 (cost). The web budget was used to fill catalogue gaps: Palantir's platform overview, AIP navigation, July 2026 announcements, AWS Marketplace and UK G-Cloud listings, the Warp Speed launch, FedStart, two packaged-solution PDFs; and Lingyang's AgentOne product page, AgentOne help navigation, the Data Analysis Agent price page, Dataphin's price page, Quick BI's edition and 智能小Q pages, and Quick Audience's overview. The shared fetch budget ran out twice during the session, so several planned pages were not read (listed in Open questions). Labels: [Fact] = in a primary source; [Vendor claim] = the company says so; [Press] = journalist report; [Inference] = my reasoning; [Unverified] = no source found. For AgentOne every function also carries **[DOC]** (described in a Lingyang help-documentation page with configuration detail, limits or prices) or **[CLAIM]** (only on a product page, in a press article or in a talk; no configuration published).

The founder's product, for the comparison in sections C5 and C6: a system holding a company's model (objects, metric definitions, rules, permissions, actions) that AI agents work through. Its first job is receivables and collections for companies of 100 to 1,000 staff, with an internal face (finance reporting and questions) and an external face (payment reminders by email and messaging). Models are rented.

## Key findings

1. **Palantir sells one platform under four names, not a set of separate products.** Foundry (data operations), AIP (AI on top), Apollo (delivery) and Gotham (defence and intelligence apps) share one Ontology; Palantir calls the combination the "AI Mesh" [Fact, https://palantir.com/docs/foundry/platform-overview/overview/]. A buyer signs for "the Palantir Platform" in a single unit-based subscription: the AWS Marketplace listing has one dimension, the "Foundry Subscription Unit" [Fact, https://aws.amazon.com/marketplace/pp/B0B1P1GDTF].
2. **The only public Palantir prices are placeholders and one benchmark.** The AWS listing shows $100,000 per unit per month with $50,000 per unit overage, but marks it a placeholder for private pricing [Fact, AWS listing]. UK G-Cloud 14 lists Gotham at £66,000 per unit [Fact, https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/801146272055049]. Forrester's Palantir-commissioned composite assumed $30M a year for a 100,000-employee company [Vendor-commissioned, file 06]. The free Developer Tier is capped at 5 users [Vendor claim, file 06].
3. **What Palantir actually sells first is a demonstration on the buyer's own data.** Bootcamps of 1 to 5 days lead to pilots of 8 to 12 weeks, and pilots convert to multi-million ACV ($3M to $29M, $1.6M to about $21M in Q3 2026). Palantir pays for the bootcamps and pilots itself [Fact and vendor claim, file 06].
4. **Customers buy Palantir for the same five things in almost every case:** one object model over many systems; one recurring decision turned into a recommendation that a human accepts or rejects; cycle time collapsing from days to minutes; governed use of any LLM under fine-grained security; and engineers on site who make it work. NDR of 165% (Q3 2026) shows that the first workflow then spreads [Fact and inference, file 06].
5. **Lingyang sells three layers that it prices separately.** Dataphin (data building and the governed metric model) is priced by processing units, from CNY 4,000 to over CNY 200,000 a month. Quick BI is priced per seat in four editions, with five 智能小Q agents sold as seat add-ons. AgentOne agents are priced per seat plus pooled credits (Data Analysis Agent: CNY 300 per seat per month, 5-seat minimum, 8,000 credits per seat, CNY 0.01 per credit) or per shop connection (Experience Insight Agent: CNY 25,200 for 5 shops for a year) [Fact, Lingyang help pages cited below].
6. **AgentOne's four role-based "AI employees" (Sales, Customer Service, Operations, Marketing) are claims; its documented products are individual packaged agents.** The help-centre navigation contains three agents with overview, quick-start and billing pages (Experience Insight, 店小蜜 enterprise edition, Livestream Inspection), and the Data Analysis Agent has its own price page. The platform itself (agent builder, ontology, evaluation, permissions engine) has no public configuration documentation [Fact for the navigation, https://help.aliyun.com/zh/product/2987146.html; inference for the gap].
7. **The documented core of Lingyang is Dataphin's metric grammar and Quick BI's deterministic Q&A knowledge base.** These are what make AgentOne's claims about consistent business definitions (口径) believable [Fact, file 07].
8. **Lingyang's sales motion mirrors Palantir's at a smaller ticket.** The "seven-day AI employee programme" (Sep 2026) offers a free one-day FDE diagnosis, a 150,000-credit starter pack, a seven-day build and a before/after report. Some projects are free until go-live and agreed results [Press, file 07].
9. **Both companies put one gate in front of anything that moves money or makes a major decision: human confirmation.** Palantir builds it into the product (staged writes, proposals, submission criteria, an action log). AgentOne states it as policy ("funds and major decisions need human confirmation") without published mechanics [Fact for Palantir, files 02 and 03; Vendor claim for AgentOne, file 07].
10. **Neither company offers a receivables-and-collections product for mid-sized firms.** Palantir's Anti-Financial Crime 360 package mentions "credit risk and collections" as an extension of its client view [Vendor claim, Palantir AFC 360 PDF]. AgentOne's customer-service agent does outbound calling and ticket creation in e-commerce [CLAIM]. The founder's first job sits in a gap [Inference].
11. **The founder's version 1 needs about a quarter of the rows in the comparison table (section C6).** These are: objects and links for customer, invoice, payment, promise and dispute; a small metric layer (DSO, ageing buckets, collected amount); typed actions with human approval for anything that leaves the building; an action log; row-level permissions inherited by agents; an MCP or Skill interface; per-tenant credit metering; and a fixed-scope pilot. Most of Palantir's catalogue (pipelines, Gotham, Apollo, edge, Vertex, Map) and most of Lingyang's (warehouse build, tag factory, CDP) are "never" for this buyer [Inference].

---

## Part A. Palantir

### A1. The offer in one paragraph, and the buyer

Palantir sells a single software platform that connects an organisation's scattered systems (ERP, CRM, EHR, email, spreadsheets, sensors) into one shared model of the business. The model's objects, links, logic and permitted actions are what Palantir calls the Ontology. People and AI agents then use that model to make and carry out operational decisions, under security fine-grained enough for defence and healthcare data. Palantir's engineers build the first workflows on site [Fact, 10-K wording via file 06]. The buyer is an organisation large enough to pay several million dollars a year: the average customer pays about $6.7M a year and the top 20 average $146M (TTM to 30 Sep 2026). There are 1,090 customers, of which 904 are commercial and 686 US commercial [Fact and inference, file 06]. The signer is typically a CEO, COO, CIO or chief digital officer, or the operations head of a division (supply chain, manufacturing, hospital operations, underwriting). On the government side it is a programme office or agency head [Inference from the 29 cases in file 06]. Industries named in the filings and AIPCon line-ups include defence, aerospace, shipbuilding, automotive, chemicals, semiconductors, insurance, mortgage, health systems, pharma, media, construction, law, car rental, food co-ops and utilities [Fact, file 06]. What the buyer pays for is a measurable cut in the time or cost of one recurring decision. Examples: General Mills at about $14M a year saved on order fulfilment, and L3Harris finding a shortage in 10 minutes instead of 3 months and 30 people [Vendor claim, file 06]. A second motive is ownership of the data, logic and, since 2026, model weights, instead of renting them from AI labs [Vendor claim, file 06].

### A2. Full catalogue

Status is GA (generally available) unless marked otherwise. Source column: file number and section, or a URL.

#### A2.1 Platforms (what appears on the contract)

| Item | What it does for the buyer | Benefit | Status, date | Source |
|---|---|---|---|---|
| Foundry | The data operations platform: connect, pipeline, model and govern data, and build apps on it | Integrates silos into one governed base | GA | platform overview URL above |
| AIP (Artificial Intelligence Platform) | Connects LLMs and agents to the Ontology, with tooling to build, evaluate and govern them | Use any major model on your own operations without leaking data | GA since 2023 | file 03 |
| Ontology | Shared model of objects, links, logic and actions; it also provides an API gateway and the OSDK | One "operational bus" for people, apps and agents | GA | platform overview; file 02 |
| Apollo | Continuous delivery and fleet management of software across clouds, on-prem, air-gapped and edge | Same software everywhere, upgraded automatically within maintenance windows | GA | file 05 B1 |
| Gotham | Defence, intelligence and investigations apps (maps, symbology, targeting), now on the Foundry Ontology | Mission planning and investigation on classified data | GA; G-Cloud 14 listing | file 05 B8; G-Cloud URL |
| AI Mesh | Palantir's name for AIP + Foundry + Apollo together | One architecture from data to deployed AI product | Naming | platform overview |
| Warp Speed | Packaged "manufacturing operating system" on Foundry and AIP: production scheduling, engineering change management, visual quality inspection, dynamic MRP, variance reduction, inventory | Faster, more flexible production for defence and industrial manufacturers | Launched with first cohort 11 Dec 2024 (Anduril, L3Harris, Panasonic Energy NA, Shield AI); Lear uses it in 2025 | https://www.businesswire.com/news/home/20241211204864/en/ ; file 06 case 8 |
| FedStart | Lets independent software vendors run their product inside Palantir's accredited federal environment, shortening FedRAMP High and IL5 accreditation | Faster route to selling into US government | Live; Google Cloud support announced 23 Apr 2025; Anthropic was the first ISV on that route | https://cloud.google.com/blog/topics/public-sector/google-public-sector-and-palantir-collaborate-to-bring-google-cloud-to-fedstart ; FedRAMP High covers FedStart (file 04 §22) |
| Mission Manager | Federal product named in the FedRAMP High scope | [Unverified] function | Named Dec 2024 | file 04 §22 |

#### A2.2 Foundry: data integration modules

| Item | What it does | Benefit | Status, date | Source |
|---|---|---|---|---|
| Data Connection (sources, agents, workers) | Connectors to databases, files, SaaS and APIs, through cloud workers or an on-prem agent | Pull from any system, including behind the firewall | GA | file 01 §2 |
| Virtual tables | Query Snowflake, Databricks and BigQuery in place, with compute pushed down to them | No copy and no duplicate storage cost | GA | file 01 KF 11 |
| Managed Iceberg tables + Iceberg REST catalog | Store tables in an open format, optionally in the customer's own bucket | Avoids lock-in; other engines can read the data | GA 15 Sep 2026 | file 01 KF 11 |
| Exports | Push datasets back to external systems | Results flow back to systems of record | GA | file 01 §3 |
| Webhooks and HTTPS listeners | Call external APIs (20 s default timeout) and receive inbound events (about 100 requests/s, 1 MB) | Real-time two-way integration | GA | file 01 KF 15 |
| Datasets with transactions | Versioned data: snapshot, append, update and delete transactions, with retention | "Git for data": reproducible, auditable history | GA | file 01 KF 1 |
| Change data capture | Declare a key, ordering and deletion column to keep the latest state | Correct live mirrors of operational databases | GA | file 01 KF 8 |
| Streams (Flink) | Sub-minute pipelines | Real-time operations; priced as "very high" cost | GA | file 01 KF 5 |
| Media sets | Store and process images, video, audio and PDFs | Unstructured data in the same model | GA | file 01 §10 |
| Pipeline Builder | Point-and-click pipelines, including LLM nodes (classify, summarise, embed); DataFusion engine is default | Non-engineers build pipelines; LLM transforms without code | GA; DataFusion default 3 Nov 2026 | file 01 KF 4; platform overview |
| Code Repositories and code transforms | Python (Polars default), Java and SQL transforms with CI | Engineering-grade pipelines | GA | file 01 §12 |
| Code Workspaces | JupyterLab and RStudio inside the platform | Data scientists work on governed data | GA | platform overview |
| Builds and schedules | Declarative orchestration that skips fresh outputs | Lower compute cost and reliable refresh | GA | file 01 KF 3 |
| Branching and Global Branching | Branch pipelines, Ontology, functions, apps, automations and restricted views together; review and merge | Safe change management across the stack | Global Branching GA week of 18 May 2026; Automate on branches 9 Jul 2026; restricted views 21 Jul 2026 | file 01 KF 12; Jul 2026 announcements |
| Data Lineage and Workflow Lineage | Graphs of data and app dependencies, permission debugging, bulk upgrades | See impact before changing anything | GA; permission debugging 21 Jul 2026; bulk upgrades 30 Jul 2026 | https://www.palantir.com/docs/foundry/announcements/2026-07 |
| Data Health, expectations, monitoring views | Build-blocking checks, post-run checks, alert tiers to PagerDuty, Slack or webhook | Bad data is stopped or flagged before decisions use it | GA | file 01 KF 13 |
| Time Travel in Dataset Preview | Compare and bisect dataset versions | Find when a number changed | Beta 23 Jul 2026 | Jul 2026 announcements |
| SQL Studio | SQL workspace with an AI side panel | Analysts query directly | GA Jun 2026 | file 03 §18 |
| Data catalog | Discover and request datasets | Self-service discovery | GA | file 01 §16 |

#### A2.3 Ontology and developer surface

| Item | What it does | Benefit | Status | Source |
|---|---|---|---|---|
| Object types, properties, value types | Business objects (Order, Patient, Part) mapped onto data, with typed and constrained values | Everyone and every agent uses the same nouns | GA | file 02 §2-3 |
| Link types | Relations between objects | Traverse from an order to its supplier to its shipments | GA | file 02 §4 |
| Interfaces | Shared shapes across object types | Reusable apps and agents across divisions | GA | file 02 §5 |
| Object sets and search-around | Composable queries: filter, union, follow links, nearest-neighbour | Rich questions without SQL | GA | file 02 KF 7 |
| Action types | Typed, permissioned business operations with validation, side effects and writeback webhooks | The only door for writes; changes are safe and logged | GA | file 02 KF 2-4 |
| Functions | Business logic in TypeScript or Python for derived values and actions | Logic lives once, next to the model | GA | file 02 §9 |
| Action log and edit history | Every submitted action becomes a logged object linked to what it changed | Full decision audit trail; training data for models | GA | file 02 KF 5 |
| Ontology Manager, statuses, proposals, schema migrations | Lifecycle for model changes, with review and migration | Change the model without breaking apps | GA | file 02 KF 13 |
| Object Views | Auto-generated or designed page per object | Instant "customer 360" style views | GA | file 05 A6 |
| Semantic search, media references | Vector properties and media on objects | Retrieval over documents tied to objects | GA | platform overview; file 03 §16 |
| OSDK (TypeScript, Python, Java) and Platform SDK, REST API | Generated SDKs on the customer's own Ontology | Custom apps and integrations on the governed model | GA | file 05 A17 |
| Developer Console | OAuth app clients, scoped tokens, metrics, hosting, MCP server per app | Least-privilege apps and agents | GA | file 05 A17 |
| Ontology MCP | Exposes an app's object types, actions and query functions to external agents as MCP tools under OAuth | Claude, ChatGPT or any MCP agent can act on the model with the user's rights | GA Jun 2026 | file 02 KF 11; file 03 KF 8 |
| Consumer mode | External users (customers, partners) through in-platform or OAuth apps | Serve outsiders from the same model | Aug 2025 | file 05 B4 |

#### A2.4 Applications

| Item | What it does | Benefit | Status, date | Source |
|---|---|---|---|---|
| Workshop | Low-code operational apps (inboxes, forms, dashboards) over objects and actions | Frontline apps in days | GA | file 05 A1 |
| Slate | Code-first HTML/JS apps, including public apps | Fully custom UIs | GA | file 05 A2 |
| Quiver | Point-and-click analysis of objects and time series, embeddable dashboards | Analysts without code | GA | file 05 A3 |
| Contour | Analysis over datasets not yet in the Ontology | Large ad-hoc analysis | GA | file 05 A4 |
| Object Explorer | Search across objects, compare sets, bulk actions, saved explorations | Find and act on many objects at once | GA | file 05 A5 |
| Vertex | Graphs of linked systems, cause and effect, simulation | See knock-on effects | GA; Search Around V2 10 Nov 2026 | file 05 A7 |
| Map | Geospatial objects, tracks, imagery, geo actions | Field and logistics operations | GA | file 05 A8 |
| Notepad | Object-aware documents with live embeds | Reports that stay current | GA | file 05 A9 |
| Carbon | Curated workspaces for one user group | Simple front door for non-experts | GA | file 05 A10 |
| Automate | Triggers (time, object change, dataset) to effects (action, function, AIP Logic, notification) | Unattended operations and alerting | GA | file 05 A11 |
| Foundry Rules | Business users author rules; changes go through approval proposals; a pipeline runs them into alerts | Rule changes without engineers, with governance | GA (time-series rules sunset) | file 05 A12 |
| Machinery | Process states, transitions and a log of every state change; process mining | Measure and supervise multi-step processes such as order-to-cash | GA | file 05 A13; file 03 §19 |
| Scenarios | Copy-on-write "what if" branches of the Ontology | Test decisions before committing | Legacy | file 05 KF 3 |
| Solution Designer and AIP Architect | Architecture diagrams with an AI critic; a wizard that drafts a data model and plan from requirements | Faster solution design | GA | file 05 A14 |
| Pilot | AI app builder: generates Ontology entities, React and OSDK code, seed data, CI and deployment | Apps from a prompt, still through review gates | GA 29 Oct 2026 | file 05 A15 |
| Insight | Analysis of Ontology data, including on branches; a copilot | Ad-hoc analysis for business users | Branch support 28 Jul 2026; copilot beta 19 Nov 2026 | Jul 2026 announcements; file 03 §18 |
| Marketplace and Foundry DevOps | Package a use case (Ontology, apps, pipelines, models) as a product, install it many times with input mapping, bulk install and upgrade | Reuse across divisions and customers; vertical templates | GA; bulk install 14 Jul 2026 | file 05 A16; Jul 2026 announcements |
| Tableau and Power BI connectors | Existing BI tools read Foundry data | Keep current dashboards | GA | platform overview |
| Issues app, support tickets, Upgrade Assistant | In-platform support and upgrade notices | Lower admin load | GA | platform overview |

#### A2.5 AI features (AIP)

| Item | What it does | Benefit | Status, date | Source |
|---|---|---|---|---|
| Model catalog | About 90 LLMs from about 11 providers through direct APIs, Bedrock, Azure, Vertex or Palantir hosting. Recent additions: Claude Opus 5 and Sonnet 5, GPT-5.6, Gemini 3.6 Flash, Grok-4.5 | Model choice without new contracts; switch as models improve | GA; additions Jul 2026 | file 03 KF 1; Jul 2026 announcements |
| Bring your own model, LLM-provider-compatible APIs, proxy | Register self-hosted or REST models; use OpenAI- and Anthropic-compatible endpoints (also for Claude Code) | Use sovereign or post-trained models | GA | file 03 §6; AIP navigation |
| Capacity management and rate limits | TPM and RPM by enrollment, project and user; 20% reserved for interactive; reservations for critical work; per-user group limits | Predictable cost and no runaway agents | GA; configurable per-user limits 2 Jul 2026 | file 03 KF 2; Jul 2026 announcements |
| Markings-based LLM data control | Allowlist which data classifications may reach which model, checked on the session | Sensitive data never reaches a non-approved model | GA 12 Oct 2026 | file 03 KF 10 |
| AIP Logic | No-code LLM functions with tools; deterministic blocks; writes only through actions; staged writes | Reliable AI steps inside workflows | GA; staged writes beta | file 03 §8 |
| AIP Chatbot Studio (formerly Agent Studio) | No-code chat agents with tools, retrieval and app variables | Assistants for staff in apps | GA | file 03 §9 |
| Agent Builder, Agent Manager, Agent SDK | Durable agent sessions, typed context, event-driven state machine, human questions | Long-running governed agents | Agent Builder beta; SDK available | file 03 §10 |
| Pro-code agents | Templates wrapping the Claude Agent SDK, OpenAI Agents SDK and Google ADK, with scoped credentials | Developers use the agent framework they prefer, safely | 9 Jul 2026 | Jul 2026 announcements |
| Palantir MCP | 89 builder tools that let external coding agents change Ontology types through proposals | Build the platform from Claude Code or Cursor | GA Jun 2026 | file 03 KF 8 |
| AIP Evals and Model Evaluations | Test suites, 20 built-in evaluators, simulated Ontology edits, experiments; a Python API for model results | Prove an agent works before go-live; catch drift | GA; Model Evaluations 7 Jul 2026 | file 03 KF 9 |
| Automate with AIP | Agents triggered by data changes; edits become proposals for review | Proactive agents with a human gate | GA | file 03 §14 |
| AIP observability | Traces, metrics, logs per action, function and agent; daily token-usage dataset | Debug and cost control | GA | file 03 §15; file 05 KF 13 |
| AIP Document Intelligence | Extraction strategies, chunking and embeddings from documents | Turn PDFs and forms into objects | Python extraction GA 28 Jul 2026 | Jul 2026 announcements |
| Ontology-augmented generation (retrieval) | Vector, KNN, hybrid search over objects | Answers grounded in the company's data | GA | file 03 KF 11 |
| AI FDE | In-platform building agent: pipelines, Ontology, functions, evals, apps; proposes changes on branches; uses the user's session | One person builds what used to need an engineering team | GA 12 Mar 2026; lineage graphs 23 Jul 2026 | file 03 §17 |
| AIP Skills | Markdown skills with a "when to use" description, personal or promoted to groups | Capture know-how for agents | GA with AI FDE | file 03 §17 |
| AIP Analyst | Ad-hoc analysis agent with citations and a dependency graph; saved analyses re-run under the viewer's rights | Trusted answers for business users | GA week of 13 Apr 2026; saved analyses 2 Jul 2026 | file 03 §18 |
| AIP Assist | In-product help sidebar, aware of the current app | Faster learning | GA | file 03 §18 |
| AIP Threads | LLM work on uploaded documents with no setup | Quick document Q&A | GA | file 03 §18 |
| AIP Evolve | Fleets of AI FDE agents optimise a workflow for cost, latency, score or model migration, and return a proposal | Cheaper and better agents over time | GA 8 Sep 2026 | file 03 KF 15 |
| Boardroom | Multi-agent teams (director plus specialists) for chat, meetings, documents, decks and plans | Drafting and critique at team scale | Beta | file 03 §19 |
| Realtime audio | Voice models with tool calling | Voice agents | Available [status unverified] | AIP navigation; file 03 §18 |
| Small AI helpers | Pipeline Builder LLM nodes, Regex helper, NL to cron, Notepad rewrite, Workshop SQL from text | Productivity across the platform | GA (SQL from text Aug 2026) | file 03 §18 |
| Post-training on open models ("sovereign AI") | Post-train open models (for example Nemotron) on the customer's own decisions | Lower cost (about 95% in L3Harris and NVIDIA claims) and owned weights | Vendor programme 2026 | file 06 KF 12, cases 9, 10, 16 |

#### A2.6 Security and governance features

| Item | What it does | Benefit | Source |
|---|---|---|---|
| Multipass identity, SSO, groups, user attributes | Central identity with SAML or OIDC | One login and attribute-based policies | file 04 §1 |
| Organizations and spaces | Mandatory silos between groups or customers | Strict separation of tenants and units | file 04 §2 |
| Projects and roles | Discretionary permissions | Day-to-day access management | file 04 §3 |
| Markings and classification-based access (CBAC) | Mandatory labels that travel through lineage | Sensitive data stays sensitive downstream | file 04 §4-6 |
| Restricted views, granular policies | Row-level filters compiled into queries | Each user sees only their rows | file 04 §7-8 |
| Object and property security policies | Row, column and cell-level security on objects | Field-level privacy (for example salary) | file 04 §9 |
| Action permissions and submission criteria | Who may run an action, under what conditions, with custom messages | Business rules enforced at the moment of change | file 04 §11 |
| Scoped sessions and emulation | Narrow your own rights; test as another user | Least privilege; safe testing | file 04 §12 |
| Checkpoints | Ask for a justification before exports, logins and actions | Purpose-based access with a record | file 04 §13 |
| Approvals | Reviewed access and change requests | Four-eyes control | file 04 §14 |
| Audit logs (audit.3) | Typed events, about 15-minute delivery, up to 730 days | SIEM integration and investigations | file 04 §15 |
| Data Lifetime | Retention and lineage-aware deletion | GDPR-style deletion that is actually complete | file 04 §16 |
| Sensitive Data Scanner | Finds PII and other sensitive data | Discover risk before exposure | file 04 §17 |
| Encryption and Cipher | Encryption in transit and at rest; app-level field encryption | Protect identifiers even from admins | file 04 §18 |
| Application restrictions and scoped tokens | Effective permission = user ∩ app maximum ∩ requested scope | Agents and apps cannot exceed their remit | file 04 §19 |
| LLM data controls and log permissioning | Markings allowlists for models; marked agent logs | AI cannot leak through prompts or logs | file 04 §20 |
| Privacy and civil liberties engineering guidance | Published design guidance | Reputational cover for public sector | file 04 §21 |
| Certifications | FedRAMP High (Dec 2024, covering AIP, Apollo, Foundry, Gotham, FedStart, Mission Manager), FedRAMP Moderate, IL5 and IL6, CMMC Level 2 (Sep 2025), IRAP PROTECTED (about Nov 2025); ISO 27001 certificate seen for 2021-2024, current one not verified; a reseller lists SOC 2 Type 2 and NHS DSPT | Passes regulated procurement | file 04 §22 |

#### A2.7 Deployment options

| Option | What the buyer gets | Source |
|---|---|---|
| Palantir-managed SaaS on AWS, Azure, GCP or Oracle | Fastest start; billed through Palantir or a cloud marketplace | file 05 B2, B5; AWS listing |
| Customer cloud, single-tenant | Runs in the customer's own cloud tenancy (OCI reference architecture: one deployment per tenancy, NAT path to Palantir's management plane) | file 05 B5 |
| Self-hosted, on-prem, bare metal | The customer owns physical security and patching; Apollo-connected sites update automatically | file 05 B5 |
| Air-gapped and classified | Apollo remote hubs synced by bundles; Azure Government Secret and Top Secret partnership announced 8 Aug 2024 | file 05 B1; https://news.microsoft.com/source/2024/08/08/palantir-and-microsoft-partner-to-deliver-enhanced-analytics-and-ai-services-to-classified-networks-for-critical-national-security-operations |
| Edge | Apollo for Edge; partner edge stacks with NVIDIA, Dell and Armada (2026) | file 05 B1; file 06 §7 |
| Federal cloud | Palantir Federal Cloud Service at FedRAMP High | file 04 §22 |

#### A2.8 Services and programmes

| Item | What it is | Benefit | Status, date | Source |
|---|---|---|---|---|
| AIP Bootcamp | 1 to 5 days, hands-on, on the buyer's data: build AI intuition, keyboard time, deploy first use cases, plan the MVP | See value before signing; "zero to use case" | Since 2023; over 500 in a year by Apr 2024 | file 06 §7 |
| AgentCamp | Bootcamp variant focused on agents | Fast agent proof | Named Q3 2026 | file 06 §7 |
| Sovereign bootcamp | For CEOs and operations leads: contracts, open versus closed models, Ontology | Executive alignment | Q2 2026 | file 06 §7 |
| Pilots | Short, low or no cost, 8 to 12 weeks typical | Proof on a real workflow | Ongoing | file 06 §7 |
| Forward-deployed engineers (Delta, Echo) | Teams of 4 to 6 on site building workflows | Delivery risk carried by the vendor | Core model | file 06 §8 |
| Operations and maintenance, training, configuration, ontology modelling services | Bundled in subscriptions or as professional services | Ongoing support | Ongoing | file 06 §8 |
| Developer Tier | Free, limited Foundry and AIP access, 5 users, capped capacity, upgrade through sales | Try and learn at no cost | Launched Nov 2024 (AIP for Developers, DevCon); 5-user cap May 2025 | file 06 §7, §11 |
| Learning portal and Speedrun | Courses; one end-to-end workflow tutorial | Self-training | GA | platform overview; file 05 KF 15 |
| Build with AIP: Examples | Installable reference examples, some with "bring your own data" drag-and-drop, plus walkthroughs | Start from a working template | GA | https://palantir.com/docs/foundry/getting-started/start-with-examples/ |
| AIP Now | Prebuilt AI products plus an industry showcase of end-to-end workflows | Buy ready-made rather than build | Listed on platform overview; product list not read | platform overview |
| AIPCon | Customer conference with case presentations | Peer proof | AIPCon 9 (Mar 2026), 11 (Sep 2026) | file 06 §4 |
| Foundry for Builders | Monthly subscription for startups | Low-end entry | Launched Jul 2021; apparently discontinued | file 06 §11 |
| Warp Speed cohorts | Manufacturing cohorts including smaller defence and industrial firms | Shared onboarding | From Dec 2024 | file 06 §11; Warp Speed release |

#### A2.9 Industry solutions (packaged offers, not customer case names)

| Item | What it includes | Source |
|---|---|---|
| Foundry for Anti-Financial Crime 360 (AML/KYC) | Single client view and entity resolution, real-time risk scoring at five levels, scenario manager and ML risk engine, model accountability, network and ultimate-beneficial-owner mapping, investigations environment, analyst feedback loops, audit evidence for regulators; extends to next-best offer, credit risk and collections. One bank resolved 4 billion records across 15+ jurisdictions | https://www.palantir.com/assets/xrfr7uokpv1b/4JcZrw9n5Gw4XDAOA9cxFm/ad94f841995570025dbf5622677ab98c/Palantir_Foundry_for_Anti-Financial_Crime_360.pdf (2022) |
| Foundry for Supply Chain | Five steps: integration, Ontology, simulation, operations, AI/ML. Packaged use cases: disruption management, raw-material inflation cockpit, working-capital management, account demand surveys and action plans. Claims a twin in hours and outcomes in weeks; the data is notional | https://www.palantir.com/assets/xrfr7uokpv1b/1Ck5r0fJHcYaZSgV21tcXi/2fd9e681ed0641c134c4f9c99be93555/Palantir_Foundry_for_Supply_Chain_2022.pdf (2021-2022) |
| Foundry for Program Oversight; Health Disparity and Equity; Emergency Preparedness, Response and Recovery; Medtech | Further packaged PDFs found by search; not read | search results, URLs under palantir.com/assets |
| Warp Speed (manufacturing) | See A2.1 | Warp Speed release |
| ShipOS (US Navy) | Shipbuilding OS across shipbuilders, yards and suppliers | file 06 case 20 |
| Defense OSDK | Domain interfaces (Order of Battle, Targeting and Fires, Sustainment) | file 05 B8 |
| Maven Smart System; Army Enterprise Agreement | Defence programmes | file 06 §9 [Unverified values] |
| Recurring commercial solution patterns | Supply and demand allocation, shortage detection, scheduling, patient flow, risk investigation, underwriting, document drafting | file 06 §5 |

#### A2.10 Partner offers

| Partner | Offer | Source |
|---|---|---|
| AWS Marketplace | "Palantir Platform" SaaS, one Foundry Subscription Unit dimension, billing on the AWS bill | AWS listing |
| UK G-Cloud 14 | Gotham at £66,000 per unit; training, onsite support, data extraction at contract end included | G-Cloud URL |
| Microsoft | Palantir on Azure Government, Secret and Top Secret clouds, with Azure OpenAI (Aug 2024) | Microsoft URL above |
| Oracle | Foundry and AIP on OCI, including customer-tenancy reference architecture | file 05 B5 |
| Google Cloud | FedStart on Google Cloud (Apr 2025); Vertex models in AIP | FedStart URL; Jul 2026 announcements |
| Anthropic, OpenAI | Models in AIP; some resell Palantir; Anthropic joined FedStart | file 06 §7, §13; FedStart URL |
| Accenture with SAP | ERP migration to RISE with SAP: assessment and validation | file 06 case 23 |
| NVIDIA, Dell, Armada | Edge and sovereign AI stacks; cuOpt and Nemotron | file 06 §7, case 10 |
| Cisco | Ontology in Cisco Secure AI Factory | file 06 §7 |
| Fujitsu (strategic partner); SOMPO and HD Hyundai (joint ventures) | Regional resale and delivery | file 06 §7 |
| Carahsoft | US public-sector reseller | file 04 §22 |
| Zeta Global | Athena marketing AI on Palantir | file 06 case 29 |

#### A2.11 Editions and prices (everything public)

| Item | Price or term | Status | Source |
|---|---|---|---|
| Developer Tier | Free, 5 users, capped compute and storage | 2024 onward | file 06 §7 |
| Palantir Platform on AWS | $100,000 per Foundry Unit per month, $50,000 per unit overage, shown as a placeholder for private pricing | Current listing | AWS listing |
| Gotham on G-Cloud 14 | £66,000 per unit | Current listing | G-Cloud URL |
| Meters | Compute-seconds (`max(vCPU, GiB/7.5)` × time), storage in GB-months, LLM tokens converted to compute-seconds per model, minimum charges per Ontology query (2 to 18 compute-seconds) | Rules effective 1 Jan 2026 | files 01, 02, 03, 13 |
| Overage invoicing | Invoiced once overage reaches $1,000,000 (Voyager order form, rates redacted) | Public contract | file 13 §4 |
| Typical first deal | About $25M now, against $250K formerly; pilots of $1M to $3M converting to $11.5M to $29M ACV | Q3 2026 call | file 06 KF 6 |
| Benchmark | $30M a year for a 100,000-employee composite; 315% ROI claim | Forrester, Feb 2023 | file 06 §9 |
| Contract terms | 1 to 5 years, about 4 years dollar-weighted (2025); many cancellable for convenience | 10-K | file 06 §9 |

### A3. What a first purchase contains and what expansion looks like

**First purchase [Fact and vendor claim, file 06; inference where marked].**
1. A bootcamp or AgentCamp of 1 to 5 days on the buyer's own data, paid for by Palantir.
2. A pilot of about 8 to 12 weeks on one or two decisions (for example supply allocation or a sepsis alert), with a team of 4 to 6 FDEs. Recent pilots were priced at $1M to $3M.
3. A first contract that bundles platform subscription units (compute and storage pool), the Ontology for that domain, one to ten Workshop or AIP applications, a few AIP agents or Logic functions, and FDE services. Elmet Group, a mid-sized manufacturer, got 10 apps in 2 months from 4 FDEs [Vendor claim]. Data integration usually covers 3 to 30 systems in the first phase (ERP, CRM, EHR, email) [Inference from cases].
4. Typical term: multi-year with cancellation for convenience. Pricing is fixed-fee rather than per seat [Secondary, a16z via file 06].

**Expansion [Fact, 10-K FY2025 via file 06].** Palantir names four routes: more divisions (horizontal), more users (vertical), extension to partners and suppliers, and cross-industry capabilities. In practice expansion means more object types and actions on the same Ontology, more applications installed through Marketplace, more agents and automations, and model post-training. Examples: a home-appliance maker went from $1M to $3M to $15M across commercial, finance and supply chain; Lear went to 11,000 users; Tampa General went from patient placement to sepsis to MRI to chart review [Vendor claim, file 06]. The measurable result is NDR of 165% and $407M of the $619M year-on-year commercial growth coming from existing customers (Q3 2026) [Fact].

### A4. Top ten functions customers cite as the reason to buy

Ranked by how often they appear in the 29 cases and the calls in file 06 [Inference from the evidence cited].

1. **One object model over many systems.** L3Harris has 33 ERPs, AIG merged two portfolios' Ontologies, Acrisure joined about 1,000 agencies, and Kirkland & Ellis said its work "would be impossible without the Ontology" (file 06 cases 4, 14, 16, 27).
2. **Recommendations on a recurring decision, which a human accepts or rejects.** General Mills accepts over 70% of recommendations; Hexion's commercial teams keep the decision (cases 1, 13).
3. **Cycle time collapsing.** A BOM approval went from 200 hours to 15 seconds; a shortage was found in 10 minutes instead of 3 months; pre-rounds chart review went from 1.5 hours to 2 seconds (cases 2, 16, 20).
4. **Speed to the first working app, delivered by Palantir's own engineers.** Elmet had 10 apps in 2 months, L3Harris an MVP in 12 weeks, Anduril post-merger integration in 3 months instead of 12 to 24 (cases 15, 16, 18).
5. **Governed AI on any model.** AIG uses Anthropic for complex claims with Palantir as the integration layer; the model catalog has about 90 models (case 4; file 03).
6. **Fine-grained security and audit for regulated data.** Hospitals, the FAA, Fannie Mae, defence and CMMC compliance at Elmet (cases 2, 5, 11, 15; file 04).
7. **Writeback into operations.** Hertz staff log stages and receive next steps; agents expedite or re-source parts at Eaton and GE (cases 7, 17, 24).
8. **Deploy anywhere, including classified, air-gapped and edge.** Government and defence buyers (files 04, 05).
9. **Reuse across divisions and partners.** Wendy's co-op across 6,000 restaurants, Lear's 11,000 users, Marketplace products (cases 6, 8; file 05 A16).
10. **Ownership and lower AI cost through post-trained open models.** McCarthy expects about 30,000 hours a year saved at lower cost than general models; NVIDIA and L3Harris claim about 95% lower cost (cases 9, 10, 16).

What customers complain about: price and complexity, services dependence, lock-in (Ontology configuration is not exportable by default, per an unverified advisory estimate), contract fragility, and ethics concerns over government work [file 06 §12].

---

## Part B. Lingyang (瓴羊): AgentOne, Dataphin, Quick BI, Quick Audience, Quick Service

### B1. The offer in one paragraph, and the buyer

Lingyang is Alibaba's wholly owned enterprise data and AI subsidiary, part of Alibaba Cloud Intelligence Group. It sells Alibaba's internal data methods (OneData) as products. Dataphin builds and governs a company's warehouse and its metric definitions. Quick BI and its 智能小Q agents answer questions and write reports from that data. Quick Audience runs customer data and marketing automation. AgentOne packages "AI employees" for sales, customer service, operations and marketing on top of all of these, delivered with forward-deployed engineers. Its official formula is "Data + Agent + FDE = AI employee" [Vendor claim, file 07]. The buyer is typically a large or mid-to-large Chinese consumer, retail, e-commerce, manufacturing, automotive or services company that sells through Alibaba's channels or wants Alibaba-grade data practice. Named cases include Feihe, Yadi, Muyuan, Voyah, Fosun Tourism, Unilever, Baozun, Great Wall Motor and StarCharge. The signer is a CDO, CIO, head of e-commerce, head of customer service or head of marketing [Inference from cases, file 07]. The job is to turn the company's data and its senior staff's know-how into agents that produce reports, serve customers, run campaigns and flag anomalies using the company's own business definitions. The result it is paid for is stated as operating metrics, not technology: report time from 3 days to 1 hour (Feihe), hotline bot resolution from 20% to 42% (Yadi), campaign setup from 12-24 hours to under 3 hours (Voyah) [Press and vendor claim, file 07]. Smaller buyers can start self-serve: Quick BI has a Personal edition and a 30-day trial, Dataphin has a Personal edition at CNY 0.01, and agents start at five seats [Fact, pages cited below].

### B2. Full catalogue

#### B2.1 AgentOne platform (the umbrella)

| Item | What it does for the buyer | Benefit | Status, date | DOC or CLAIM | Source |
|---|---|---|---|---|---|
| AgentOne platform | Build, deploy and govern enterprise agents. Three agent forms: self-planning agents, dialogue-orchestrated agents and "expert groups". Lifecycle: knowledge construction, data governance, agent development, go-live; tools for building, evaluation, analysis and tuning | One place for all company agents | Launched 25 Sep 2025 (Apsara) with 20+ agents | CLAIM | https://www.aliyun.com/product/agentone ; file 07 §3 |
| "Data" pillar | Business meaning and relationships, plus collection, cleaning and processing, so inputs and outputs are traceable | Answers that use the company's own definitions | 2025-2026 | CLAIM (backed by Dataphin DOC) | https://help.aliyun.com/document_detail/3004555.html |
| "Data semantics and ontology modelling" (数据语义与本体建模) | Organises data and business knowledge so AI employees work to company 口径 | Consistent definitions across agents | Official wording from Sep 2026 | CLAIM; no schema published | file 07 §4 |
| "Agent" pillar | Planning, memory, tool calling, multi-agent collaboration; connects CRM, OA, service and store systems; keeps task progress and operation logs reviewable | Agents that do work, not just chat | 2025-2026 | CLAIM | help page 3004555 |
| Role-based design (岗位化) | Each AI employee is configured with data, knowledge, tools, permissions and evaluation metrics for one job | A sellable, governable unit of work | 2026 | CLAIM | help page 3004555 |
| Human confirmation for money and major decisions | Standard actions run under rules; fund-related and major decisions go to a person | Safety for autonomous actions | 29 Jul 2026 | CLAIM; no mechanics published | file 07 §3 |
| AI training ground (AI训练场) | Environment to train and test agents | Quality before go-live | Sep 2025 | CLAIM | file 07 §3 |
| Built-in models | Qwen plus mainstream LLMs (DeepSeek, private models named in press) | No model contracts to manage | 2025 | CLAIM | product page; file 07 §3 |
| MCP and Skill integration | Expose data and tasks to agents and connect external tools through MCP and Skills | Plug into other agents and tools | 2025-2026 | CLAIM for AgentOne; DOC for the Quick BI Skill (B2.5) | help page 3004555; file 07 KF 11 |
| CRM and ERP integration; one-click e-commerce platform data | Connectors to business systems and to Taobao and Tmall shop data | Fast start for e-commerce sellers | 2025-2026 | CLAIM | product page |
| Alibaba ecosystem modules | TMIC trend data, Amap location and population data, 聚石塔 e-commerce cloud, 店小蜜 service bot, Qwen App distribution | Data and channels nobody else has | 2025-2026 | CLAIM | file 07 §2 |
| Privacy computing and secure clean room (安全屋) | Data circulation without exposing raw data | Use partner data legally | Sep 2025 | CLAIM | file 07 §3 |
| Low-code orchestration | Build agents without code | Business teams build | 2025-2026 | CLAIM | https://developer.aliyun.com/article/1746310 (8 Jul 2026) |
| Custom "X employees" | Finance, legal, procurement, admin and HR agents built to order | Extend beyond the four roles | 29 Jul 2026 | CLAIM | file 07 §3 |

#### B2.2 AI employees by role (the four launched 29 Jul 2026)

Capabilities as listed on the product page (Nov 2026) and in the launch press. All are **CLAIM**: no help-centre page describes their configuration.

| Role | Listed capabilities | Benefit claimed | Source |
|---|---|---|---|
| AI Sales | Unified customer view from CRM, ERP, meeting recordings, email and IM; support before, during and after visits (customer brief, decision-maker and risk map, live Q&A, minutes, follow-up tasks, CRM write-back, automatic quotes, competitor responses); reusable top-seller playbooks; unified sales definitions (customer, opportunity, stage); early risk signals (renewal and upsell alerts, health scores) | Every salesperson works like the best one | product page; file 07 §3 |
| AI Customer Service | E-commerce service expert (shopping guidance, end-to-end service, human-AI risk control, self-improvement); intelligent outbound calling (fast onboarding, natural voice, automatic evaluation, tasks from calls); all-in-one service (Q&A plus case handling, 24/7, agent assist, full quality inspection); creates tickets, changes appointments, reissues goods by calling business systems | Higher resolution, lower cost per contact | product page; file 07 §3 |
| AI Operations | Competitor tracking (price, new products, promotions); category and competitor analysis; store patrol alerts on products, traffic and reviews; consumer insight; ad plan tuning with dynamic budgets; new-product development from insight to draft; price changes and coupons "under rules"; anomalies pushed to work groups | Operators spend time on decisions, not monitoring | product page; file 07 §3 |
| AI Marketing | Brand tone management; GEO monitoring (brand visibility in LLM search); smart ad placement with automatic bids; full-funnel member marketing; automatic creative generation; campaign review written into a knowledge base; strategy breakdown to audience, budget, simulation, content, approval and delivery, with humans confirming budget | Faster campaigns with measured ROI | product page; file 07 §3 |

#### B2.3 Packaged agents (individually sold)

| Agent | What it does | Price | DOC or CLAIM | Source |
|---|---|---|---|---|
| Experience Insight Agent (体验洞察Agent) | Consolidates multi-channel store feedback and raises alerts | Per shop-connection quota: minimum 1 shop, 1 month to 3 years; 5 shops for 1 year = CNY 25,200 | DOC (overview, quick start, billing pages) | https://help.aliyun.com/zh/product/2987146.html ; https://help.aliyun.com/document_detail/3011198.html |
| 店小蜜 enterprise edition Agent (店小蜜大客版) | Taobao and Tmall customer-service agent for large merchants | Billing page exists, not read | DOC (navigation) | help navigation |
| Livestream Inspection Agent (直播巡检) | Monitors live-commerce streams | Billing page exists, not read | DOC (navigation) | help navigation |
| Data Analysis Agent (数据分析Agent) | Multi-source data fusion, AI-assisted analysis, dashboards, data screens, lightweight ETL, report embedding | CNY 300 per seat per month; minimum 5 seats in steps of 5; 8,000 credits per seat per month (100,000 a year on annual plans) in a shared pool; top-up CNY 10,000 per 1M credits; add-ons in credits per year: Quick Engine 500,000 per 5 GB, data screens 75,000 each up to 20 then 50,000 (minimum 2), ETL 3,000,000 per 50 tasks (maximum 100), report embeddings 200,000 per 10; included: 10 data-prep units, 10 GB acceleration storage, 5 screens; Ticket-enhanced embedding needs 25+ seats | DOC (prices "for reference", published 20 May 2026, modified 7 Aug 2026) | https://help.aliyun.com/en/document_detail/3029849.html |
| Ad-creative agent | Generates ad creatives | Credit editions at CNY 0.09 to 0.10 per credit; service may stop when credits run out | DOC | https://help.aliyun.com/en/document_detail/3026326.html (via file 13) |
| WinNexo Sales Operations | Sales operations agent | Not found | DOC (named in file 07) | file 07 §3 |
| E-commerce Operations Agent | Unifies cross-platform e-commerce data; scenario reports; tiered strategy suggestions for executives, managers and frontline staff | Not listed | CLAIM | product page |
| New Product Planning, Intelligent Outbound Calling, Sales Operations, Financial User Operations Agents | Named only | Not listed | CLAIM | product page |
| Cultural Tourism Agent (AI G.O, Fosun) | Pre-, during- and post-trip service, itinerary planning, recommendations; 100+ request types in under 1.5 s | Project | CLAIM | product page; file 07 §3 |

#### B2.4 Dataphin (data building and governance; DOC throughout)

| Module | What it does | Benefit | Source |
|---|---|---|---|
| Data integration and sync | Batch and real-time sync from many sources into the warehouse | One place for all data | file 07 §5; price page |
| Concept modelling | Subject domains, business objects and activities, typed relations (association, inheritance, hierarchy, sequence, flow, containment) | A drawn map of the business | file 07 §4 |
| Specification modelling (OneModel) | Atomic metric + business qualification + statistical period + granularity = derived metric; owners, 口径 text, units, additive flag; period expression language; auto-generated code and schedules ("design is development") | One definition per metric, which cannot drift from the code | file 07 §5 |
| Registered metrics | Attach existing physical metric columns to the governed model | Onboard legacy logic quickly | file 07 §5 |
| Data blocks (Dev-Prod or Basic) | Namespaces with isolated or single environments and named owners | Safe change, or a cheaper single environment | file 07 §5 |
| Development, scheduling, intelligent operations | Code tasks, schedules, baselines and throttles | Reliable refresh | price page |
| Asset quality | Strong rules block downstream, weak rules alert; covers external databases too | Untrustworthy data is stopped | file 07 §5 |
| Asset catalog, lineage, metadata center | Automatic metadata, table and field lineage | Find and trust data | file 07 §5; price page |
| Data standards | Standard sets, code tables, word roots that feed naming | Consistent names | file 07 §5 |
| Asset security | Classification, masking | Protect sensitive fields | price page |
| Permissions, row-level permission | Asset and function permissions with request and approval; row-level add-on | Each user sees their rows | file 07 §5; price page |
| Data service (OneService API) | APIs on logical tables, with QPS tiers, alerts and call logs | Apps and agents consume governed data | file 07 §5; price page |
| Tag factory | Offline tags for customers or products | Segmentation for marketing | price page |
| Resource governance, asset operations | Cost and usage governance; asset promotion | Lower cost, more reuse | price page |
| Unstructured data | Processing of documents (credit-based) | Bring documents into the model | price page |
| 超级X AI assistants | X-Data Engineering (requirement to models and code), X-Analytics (问数 with albums, permission-aware previews, 2-5 candidate SQLs), X-Ops, X-Coding, X-App, X-Data Standard, X-Data Security, X-Data Quality, X-Catalog, X-Asset Q&A; bring your own model via API key and base URL | An AI data team | file 07 §5 |
| Engines | Full-managed: MaxCompute only. Semi-managed: MaxCompute, Hologres-adjacent, EMR, CDH, StarRocks, Doris, Databricks, GaussDB, Amazon EMR and others; multi-engine from V6.1 | Fits the existing stack | file 07 §5 |

#### B2.5 Quick BI and 智能小Q (DOC throughout)

| Item | What it does | Benefit | Status, date | Source |
|---|---|---|---|---|
| Editions | Personal, Advanced, Professional, Role-based Professional (same features as Professional, different sales model); same four on the international site; one seat = one RAM user or primary account; trial is 50 Professional licences; 30-day free trial | Start small, upgrade by seat | Page modified 9 Jul 2026 | https://help.aliyun.com/zh/quick-bi/product-overview/purchases-upgrades-downgrades-renewals-and-overdue-payments |
| Dashboards, reports, data screens, datasets, embedding | Core BI; Ticket-based enhanced embedding | Reporting inside other apps | GA | file 07 §6 |
| 小Q问数 Agent (Q&A) | Natural-language questions, multi-turn, dataset selection, anomaly drill-down, variance attribution; shows business-logic SQL and executed SQL; asks for clarification; Trace_ID | Self-service answers that can be checked | Add-on, Advanced and Professional only | https://help.aliyun.com/zh/quick-bi/user-guide/smartq (modified 5 Nov 2026) |
| 小Q解读 Agent (interpretation) | Explains dashboards, from one-click summaries to multi-chart analysis | Executives read dashboards faster | Included with 问数 | same |
| 小Q报告 Agent (report) | Editable online analysis documents with automated insights and live data | Periodic reports written for you | Add-on | same |
| 小Q搭建 Agent (build) | Builds reports from datasets and configures charts through conversation | Faster dashboard building | Add-on | same |
| 小Q洞察 Agent (insight) | Multi-metric attribution, metric-tree drill-down, automatic insight briefs, instant or scheduled | Finds the "why" proactively | Add-on | same |
| Seat assignment | An admin assigns agent seats to members; members without a seat cannot use the agents | Cost control | Current | same |
| Knowledge base | Business terms with synonyms, regex rules, dataset routing (keyword to up to 10 datasets), table-selection prompt; bulk CSV import; no fuzzy matching | Predictable, auditable answers | Current | file 07 §6 |
| Data preparation for Q&A | Field quality scoring, default aggregations, expert questions, per-user Q&A permission with expiry | Higher accuracy | Current | file 07 §6 |
| Quick BI Skill for external agents | Zip package for Claude Code, OpenClaw, QoderWork, Wukong: 问数, 报表, 解读, 报告; authenticated with api_key, api_secret and user_token so the agent gets the user's data rights | Use Quick BI from any agent | 2026 | file 07 §6 |
| Custom agents | Plug in Dify or Bailian workflows | Extend | Current | file 07 §6 |
| International | Nine overseas zones; 30-day trial with unlimited tokens (Singapore, May 2026); Gartner ABI Magic Quadrant 7 years in a row | Usable outside China | Vendor claim | file 07 §6, §10 |

#### B2.6 Quick Audience, Quick Service, Quick Tracking

| Product | What it does | Benefit | DOC or CLAIM | Source |
|---|---|---|---|---|
| Quick Audience (CDP and marketing) | Data sources on AnalyticDB; datasets for user tags, RFM, AIPL, behaviour and product tags; tag assets; audience building by selection, upload or set operations; audience filtering, analysis (tag insight, significance, RFM), user analysis (AIPL flow); push to DataBank, Damodisk and Kafka; campaign management; marketing automation engine with a component library; delivery across private-domain, ad and other channels; WeChat social interaction; media return analysis; app behaviour collection; Quick BI dashboards; business solutions (repurchase prediction, product recommendation, global insight, member centre with levels, points and benefits, WeCom shopping-guide mini-program, smart retail, global membership); an intelligent marketing creative assistant | Find, reach and convert the right customers | DOC (page published 10 Apr 2026, modified 2 Jun 2026; no prices shown) | https://help.aliyun.com/en/document_detail/136924.html |
| Quick Service 2.0 | LLM customer-service answers, claimed 93% accuracy, knowledge-base setup from 7 days to 5 minutes | Faster service bot launch | CLAIM (2024 press); now folded into the AI Customer Service employee and 店小蜜 | file 07 §7 |
| Quick Tracking | User-behaviour analytics (named in the 2022 product map) | Product and marketing analytics | Named only; not read | file 07 §1-2 |
| Discontinued or rebranded | Lingyang Port (data marketplace, 2023), 瓴羊One, Quick Stock, Bizphin, Finplus | — | Named | file 07 §1 |

#### B2.7 Security features and certifications (AgentOne)

| Item | What it does | DOC or CLAIM | Source |
|---|---|---|---|
| Data classification and grading, encryption and masking, end-to-end encrypted transport | Protect data | CLAIM | product page |
| Access audit and anomalous-behaviour detection; real-time log audit with automatic alerts | Detect misuse | CLAIM | product page |
| RBAC identity and access management | Role-based access | CLAIM (help pages on permissions and data security exist, not read) | product page; file 07 §3 |
| Model security: adversarial-sample defence, prompt-injection protection | Protect agents | CLAIM | product page |
| Third-party penetration testing | Assurance | CLAIM | product page |
| Agent inherits the user's data rights | The Quick BI Skill's user_token; Dataphin X-Analytics previews only SELECT-permitted columns, maximum 50 rows | DOC (for Quick BI and Dataphin, not for AgentOne as such) | file 07 KF 10-11 |
| Certifications | ISO/IEC 27001, ISO/IEC 27018, MLPS Level 3 (等保三级), CAICT SDK security certification | CLAIM (listed by vendor) | product page |

#### B2.8 Deployment options

| Option | Details | Source |
|---|---|---|
| Public cloud SaaS on Alibaba Cloud (China) | Default for AgentOne and Quick BI | product page; Quick BI pages |
| International Alibaba Cloud | Quick BI and Dataphin documented in English and Japanese; AgentOne outside China [Unverified] | file 07 §10 |
| Dataphin fully managed vs semi-managed | Fully managed runs on MaxCompute; semi-managed runs on the customer's own engines (many supported); separate billing | price page; file 07 §5 |
| Standalone or private deployment | Not documented in the pages read [Unverified] | — |

#### B2.9 Services and programmes

| Item | What it is | Status, date | Source |
|---|---|---|---|
| FDE delivery | Scenario definition, solution design, data preparation, agent build and integration, turning tacit know-how into SOPs, tuning, feeding capabilities back into the product. Yadi needed 24 days on site and 78 interviews | Core model | file 07 §9 |
| Seven-day AI employee programme (AI员工7日上场计划) | Pick a topic, map data and acceptance metrics with FDEs, build on AgentOne, deliver with a before/after report; free one-day diagnosis; 150,000-credit starter pack. Benchmark: 110+ metrics across 5 segments in 7 days for a 150-store company | Launched 23 Sep 2026; 27 letters of intent on day one | file 07 §3 |
| Free trials | AgentOne free trial and free use; Quick BI 30-day trial | Current | product page; Quick BI page |
| Outcome-linked commercial models | Free until go-live and results; per seat; per resource; per campaign; per promotion cycle (618, Double 11); upside share above a target | 2026 | file 07 KF 14 |
| Scope discipline | Turned down a production-scheduling project for lack of domain repeatability | 2026 | file 07 §3 |

#### B2.10 Industry solutions

| Industry | Offer or case | Source |
|---|---|---|
| E-commerce and brands | E-commerce operations agent, 店小蜜, livestream inspection, experience insight; Baozun serving 490+ brands; Taobao: 300,000+ merchants on the 解读 agent over 1,500+ metrics | product page; file 07 §3 |
| Consumer goods and distribution | Feihe (2,600+ distributors, 67,000 outlets); Unilever food knowledge engine | file 07 §3 |
| Automotive | Voyah lead activation; Great Wall service; Yadi service | file 07 §3 |
| Agriculture and food | Muyuan reports from days to 30 minutes | file 07 §3 |
| Finance | Financial user operations agent | product page |
| Cultural tourism | Fosun AI G.O | product page |
| Energy and mobility | StarCharge station search in the Qwen App | file 07 §3 |
| Store operations | Amap co-built store-operations assistant | file 07 §2 |

#### B2.11 Partner offers

Alibaba Cloud (hosting, Bailian, Qwen); Amap; TMIC; 聚石塔; 店小蜜; Baozun; Dify and Bailian workflow plug-ins into Quick BI; Claude Code, OpenClaw, QoderWork and Wukong through the Quick BI Skill; Alibaba Cloud Research Institute (white paper). No formal partner programme document was found [file 07 §9].

#### B2.12 Editions and prices (everything public)

| Product | Edition or item | Price (CNY) | Source |
|---|---|---|---|
| Dataphin (fully managed, per month) | Personal, 100 DPU | 0.01 | https://help.aliyun.com/zh/dataphin/product-overview/billing-instructions (modified 24 Aug 2026) |
| | Agile R&D, 200 / 500 / 1,000 DPU | 4,000 / 8,000 / 12,000 (big-data engine); 2,000 / 4,000 / 6,000 (database engine) | same |
| | Basic R&D, 200 to 5,000 DPU | 8,500 to 93,500 | same |
| | Smart R&D, 200 to 5,000 DPU (and above) | 25,000 to 110,000 (example 11,000 DPU = 212,000) | same |
| | DPU counting | Basic and Smart: (sync + integration tasks) ÷ 3 + compute tasks; Smart also counts logical tables and 1 DPU per 10 metrics; only published scheduled items count; first 200 integration tasks free | same |
| | Add-ons (monthly) | Query acceleration 2,000; data standard 8,500; intelligent ops free to 800; quality rules free to 8,500; asset security 1,000 (beta promotion); resource governance 8,500; data service API 8,500 to 28,500 by QPS; tag factory 0 to 29,260; asset operations 1,000 to 5,000; metadata 1,000 to 2,000; row-level permission 2,000; 超级X assistants printed as "1,5000" and "1,0000" (probably 15,000 and 10,000, unconfirmed); unstructured data 5,000 to 35,000; credit packs 100 (10k) to 30,000 (5M) | same |
| Quick BI | Personal, Advanced, Professional, Role-based Professional | Prices on separate pages, not read | Quick BI edition page |
| | 智能小Q agents | Seat add-ons, prices not shown | 智能小Q page |
| AgentOne Data Analysis Agent | Seat + credits | 300 per seat per month, 5-seat minimum; 1M credits = 10,000 | help 3029849 |
| AgentOne Experience Insight Agent | Shop quota | 5 shops × 1 year = 25,200 | help 3011198 |
| AgentOne ad-creative agent | Credit editions | 0.09 to 0.10 per credit | help 3026326 |
| Seven-day programme | Starter pack | 150,000 credits free (about CNY 1,500 at the Data Analysis Agent rate [Inference]) | file 07 §3 |

### B3. What a first purchase contains and what expansion looks like

**First purchase [Press and vendor claim, file 07; inference where marked].** Two entry routes.
- **Project route (large accounts).** A free one-day FDE diagnosis, then a seven-day build of one AI employee on one scenario with agreed acceptance metrics, delivered with a before/after report and paid in credits from a starter pack. Larger projects run 3 to 4 weeks (formerly 3 to 4 months). Yadi took 24 days on site in two phases: agent workbench and summaries first, then bots. Commercial terms vary: free until results, per seat, per campaign or per promotion cycle.
- **Self-serve route.** Buy five seats of the Data Analysis Agent (about CNY 1,500 a month), or a Quick BI edition plus a 智能小Q add-on, or a shop-quota agent such as Experience Insight.
- In both routes the data foundation either already exists (Dataphin, MaxCompute, Taobao shop data) or is built in the first weeks. The benchmark is 110+ metrics semantically mapped across 5 segments in 7 days [Press].

**Expansion [Inference from the product structure and cases].** More seats and credits. More AI employees (service, then sales, then marketing). A Dataphin edition upgrade (Agile to Basic to Smart, more DPU, add-ons such as quality rules, row-level permission, the API service and 超级X). Quick Audience for marketing. Ecosystem modules (Amap, TMIC). Muyuan and Feihe show expansion from reports to company-wide self-service (22 provinces, 100 meetings a week; 2,600 distributors) [Press].

### B4. Top ten functions customers cite as the reason to buy

From the cases and statements in file 07; all are press or vendor claims.

1. **Consistent business definitions (口径) across every report and agent.** The Singapore pitch: three agents, three definitions of "sales revenue". The sales-definition feature for AI Sales.
2. **Reports and analysis in minutes instead of days.** Muyuan: from days to 30 minutes, 90% of queries self-served. Feihe: from 3 days to 1 hour.
3. **Higher service resolution at lower cost.** Yadi: hotline resolution 20% to 42%, connection rate 88% to 95%, call time 6 to 4 minutes. An appliance brand: pre-sales accuracy 60% to 90%+.
4. **Marketing speed and conversion.** Voyah: setup from 12-24 hours to under 3, CTR +15%, lead-to-order +20%. A maternal brand: ad ROI +20%.
5. **Alibaba ecosystem data and channels.** Taobao and Tmall, Amap, TMIC, Qwen App (StarCharge).
6. **Fast, scoped delivery by FDEs.** Seven days for a pilot; 3 to 4 weeks for projects.
7. **Captured know-how of top staff.** Unilever's knowledge engine reviewed by top salespeople; "reusable top-seller playbooks".
8. **Low entry price and pay-as-you-go credits.** Five seats at CNY 300; free starter credits; free-until-results deals.
9. **Self-service Q&A that shows its working.** SQL transparency, clarifying questions, deterministic knowledge rules (Quick BI documentation).
10. **Alibaba-grade security and certification.** ISO 27001 and 27018, MLPS Level 3.

What customers complain about: not found in public sources this session [Unverified]. [Inference] Likely concerns are China-only availability of AgentOne, the heavy people-led delivery (78 interviews at Yadi) and dependence on Alibaba's cloud and ecosystem.

---

## Part C. Side by side

### C5 and C6. Palantir vs AgentOne, function by function, with the founder's smallest faithful equivalent

Key to column 4: **V1** = needed in the first version (receivables and collections for 100 to 1,000 staff); **V2** = second version; **Never** = do not build. Every reason in column 4 is [Inference]. AgentOne marks: [DOC] or [CLAIM].

| # | Function | Palantir | Lingyang / AgentOne | Founder's smallest faithful equivalent, version, reason |
|---|---|---|---|---|
| 1 | Connect source systems | Data Connection, agents, virtual tables, Iceberg, listeners (file 01) | Dataphin integration [DOC]; CRM/ERP connectors and one-click e-commerce data [CLAIM] | **V1**: read-only connectors to the customer's accounting or ERP system (invoices, payments, customers) plus CSV upload and a bank-statement import. Reason: receivables live in one or two systems; without this there is no data. |
| 2 | Versioned datasets and pipelines | Datasets with transactions, Pipeline Builder, code transforms, builds (file 01) | Dataphin development, scheduling, data blocks [DOC] | **V1 (minimal)**: append-only snapshots of each sync with timestamps, so any figure can be reproduced. **Never**: a general pipeline builder. Reason: auditability of finance numbers matters; a pipeline product does not. |
| 3 | Change data capture | Key + ordering + deletion contract (file 01 KF 8) | Real-time sync [DOC] | **V2**: incremental sync by modified-at. Reason: nightly full refresh is enough for collections at first. |
| 4 | Data quality gates | Expectations block builds; health checks alert (file 01 KF 13) | Strong rules block, weak rules alert [DOC] | **V1**: three or four strong checks (invoice totals reconcile, no negative balances, sync is fresh); when one fails, agents stop sending reminders. Reason: chasing a customer who has already paid destroys trust. |
| 5 | Object model (objects, properties, links) | Ontology object and link types, interfaces (file 02) | Dataphin concept model with typed relations [DOC]; "ontology modelling" [CLAIM] | **V1**: fixed starter types (Customer, Contact, Invoice, Payment, Credit note, Promise-to-pay, Dispute, Reminder) and their links, with customer-added properties. Reason: this is the product's core. Ship a template rather than a modeller. |
| 6 | Metric definitions | Functions and derived properties (file 02) | Atomic + qualification + period + granularity, with owner, 口径 and additive flag [DOC] | **V1**: a dozen governed metrics (overdue amount, ageing buckets, DSO, collected this period, promise-kept rate), each with owner, definition text, period expression and grain. Reason: the finance report and agent answers must agree, and Dataphin's grammar is the documented pattern. |
| 7 | Business rules | Foundry Rules with approval proposals (file 05 A12) | Rules for standard actions [CLAIM] | **V1**: a rule table (for example "remind at +3, +10 and +20 days; stop if a dispute is open; escalate above X") with approve and reject by a finance owner. Reason: dunning policy is the customer's know-how, and changes need sign-off. |
| 8 | Typed actions with validation | Action types, submission criteria, writeback webhooks (file 02) | Write-back to CRM and tickets [CLAIM] | **V1**: about eight actions (send reminder, log promise, record dispute, pause dunning, escalate, propose payment plan, mark paid, write note back to the accounting system), each with parameters, permission and preconditions. Reason: agents must never write raw rows. |
| 9 | Human approval of consequential actions | Staged writes, proposals, AI FDE "always ask" (file 03) | Human confirmation for funds and major decisions [CLAIM] | **V1**: an approval queue. Everything sent externally is approved until a template earns auto-send; payment plans and write-offs are always approved. Reason: the external face carries reputational and legal risk. |
| 10 | Action log and decision capture | Action log objects, edit history (file 02 KF 5) | Operation logs reviewable [CLAIM] | **V1**: every action and every approve/reject is stored with user, agent, inputs, rule version and outcome. Reason: audit for finance, and the accept/reject log becomes the evaluation set. |
| 11 | Triggers and automation | Automate (file 05 A11) | Inspection and anomaly push [CLAIM]; Quick BI scheduled insight [DOC] | **V1**: scheduled daily run plus event triggers (invoice becomes overdue, promise missed), with run limits and auto-pause. Reason: collections is a cadence business. |
| 12 | Process state tracking | Machinery state log (file 05 A13) | — | **V1 (minimal)**: a state field on each invoice (current, reminded, promised, disputed, escalated, paid) with an append-only transition log. Reason: cheap, and it powers "time to collect" metrics. |
| 13 | BI dashboards | Quiver, Contour, Workshop, Tableau and Power BI connectors (file 05) | Quick BI editions [DOC] | **V1 (minimal)**: one fixed receivables dashboard and an export. **Never**: a general BI tool. Reason: customers already have Excel or BI; the product needs only the report it owns. |
| 14 | Natural-language Q&A over data | AIP Analyst with citations (file 03 §18) | 小Q问数 with SQL transparency, clarification, deterministic knowledge base [DOC] | **V1**: questions answered only through the governed metrics and object queries, showing the query, the metric definitions used, owner and data freshness, and asking when the period is missing. Reason: this is the internal face; Quick BI's documented pattern is the safest. |
| 15 | Report generation | Notepad, Boardroom (file 03, 05) | 小Q报告 [DOC]; AI Sales minutes [CLAIM] | **V1**: a weekly receivables report generated from metrics, with cited figures. Reason: finance heads buy the report first. |
| 16 | Proactive insight and anomalies | Automate with AIP (file 03 §14) | 小Q洞察 attribution [DOC]; AI Operations alerts [CLAIM] | **V2**: alerts such as "customer X's payment behaviour changed" or "DSO up 5 days, driven by segment Y". Reason: valuable but secondary to running the cadence. |
| 17 | Knowledge and synonyms | AIP Skills, retrieval (file 03) | Knowledge base with synonyms, regex, routing [DOC] | **V1**: a glossary (terms, synonyms, definitions) and per-customer notes from the finance team. Reason: "overdue" and "past due" must map to one metric. |
| 18 | Document intelligence | AIP Document Intelligence (file 03) | Unstructured data module [DOC] | **V2**: read remittance advice and dispute emails into Payment and Dispute objects. Reason: high value, but email classification can come first. |
| 19 | External customer-facing agent | Consumer mode and OSDK apps (file 05 B4) | AI Customer Service, outbound calling [CLAIM]; 店小蜜 [DOC] | **V1**: email reminders and replies, plus one messaging channel (for example WhatsApp Business), working only through actions and approved templates. **Never in V1**: voice calls. Reason: this is the external face; voice adds regulatory and quality risk. |
| 20 | Inbound reply handling | Listeners, AIP Logic (files 01, 03) | Ticket creation from service [CLAIM] | **V1**: classify replies (paid, will pay on date, dispute, wrong contact) into proposed actions for approval. Reason: replies are where collections work actually happens. |
| 21 | No-code agent builder | Chatbot Studio, Agent Builder (file 03) | Self-planning, orchestrated agents, expert groups [CLAIM] | **Never as a general builder**: ship two fixed agents (finance analyst, collections agent) configured by rules and templates. Reason: a solo founder cannot support a builder; role-based configuration is AgentOne's sellable unit. |
| 22 | Pro-code agents and SDK | Pro-code agents, OSDK, Agent SDK (file 03) | — | **V2**: a public API with scoped keys. Reason: mid-sized firms rarely build their own agents at first. |
| 23 | External agent interface | Ontology MCP (GA Jun 2026) | MCP and Skill [CLAIM]; Quick BI Skill [DOC] | **V1**: an MCP server exposing the metrics, object queries and actions under the user's token, plus a Skill package. Reason: cheap distribution into Claude and ChatGPT, and it reuses the same permission model. |
| 24 | Model choice | About 90 models, BYOM (file 03) | Built-in Qwen and others [CLAIM]; BYO via API key and base URL in Dataphin [DOC] | **V1**: two providers behind one adapter, chosen per task. **Never**: training or post-training. Reason: models are rented by design. |
| 25 | Evaluations | AIP Evals with simulated edits (file 03 KF 9) | AI training ground, evaluation metrics per role [CLAIM] | **V1 (minimal)**: a fixed test set of questions and reply emails per tenant, rerun before any prompt or model change; approve/reject rate tracked. Reason: proves accuracy to the finance buyer. |
| 26 | Row-level and field permissions | Object and property security policies (file 04) | RBAC [CLAIM]; row-level permission add-on [DOC] | **V1**: roles (admin, finance manager, collector, viewer) plus row filters by entity, region or portfolio. Reason: collectors see only their accounts. |
| 27 | Agent identity and scope | User ∩ app ∩ scope tokens (file 04 KF 10) | Agent uses the user's token (Quick BI) [DOC] | **V1**: internal agents act as the asking user; the external agent acts as a service identity limited to reminder and reply actions. Reason: the two faces need different scopes. |
| 28 | Purpose justification and approvals | Checkpoints (file 04 §13) | — | **V2**: require a reason for exports and write-offs. Reason: useful for audit, but not a first-sale blocker. |
| 29 | Classification markings that travel with data | Markings, CBAC (file 04) | Classification and grading [CLAIM]; asset security [DOC] | **Never** (beyond a "sensitive" flag on fields). Reason: built for defence-grade separation; disproportionate here. |
| 30 | LLM data controls | Markings allowlist for models (file 03 KF 10) | Prompt-injection protection [CLAIM] | **V1**: mask bank details and personal identifiers before prompts; treat inbound email as untrusted input to the model. Reason: external email is an injection vector. |
| 31 | Audit logs | audit.3, 730 days (file 04) | Log audit and alerts [CLAIM] | **V1**: an exportable audit log of logins, actions, prompts and outbound messages. Reason: finance and legal buyers ask for it. |
| 32 | Retention and deletion | Data Lifetime (file 04 §16) | — | **V2**: per-tenant retention and deletion on request. Reason: privacy law; can follow first customers. |
| 33 | Change management for the model | Global Branching, proposals (files 01, 02) | Dev-Prod data blocks with publish [DOC] | **V1 (minimal)**: draft vs published versions for rules, metrics and templates, with an approver. **Never**: branching of the whole stack. Reason: changing a dunning rule must be reviewed, but full branching is overkill. |
| 34 | AI that builds the model | AI FDE, AIP Architect, Pilot (files 03, 05) | X-Data Engineering [DOC] | **V2**: an onboarding assistant that maps the customer's chart of accounts and customer fields onto the template and proposes it for approval. Reason: this replaces the FDE at mid-market prices. |
| 35 | Packaging and templates | Marketplace products with input mapping (file 05 A16) | Packaged agents [DOC] | **V1**: the receivables template is itself the product, installed per tenant with field mapping. Reason: repeatable onboarding. |
| 36 | Observability and cost metering | Traces, compute-seconds, token dataset, capacity limits (file 03) | Credits pool [DOC] | **V1**: per-tenant token and message metering into credits, with per-agent caps and a published credit rate. Reason: rented models make cost the main margin risk; AgentOne publishes its rate. |
| 37 | Deployment options | SaaS, customer cloud, on-prem, air-gap, edge (file 05) | Alibaba Cloud SaaS; semi-managed Dataphin [DOC] | **V1**: multi-tenant SaaS in one region. **Never**: on-prem, air-gap or edge. Reason: 100 to 1,000-staff buyers accept SaaS; anything else consumes a solo founder. |
| 38 | Certifications | FedRAMP High, IL6, CMMC, ISO (file 04) | ISO 27001 and 27018, MLPS 3 [CLAIM] | **V2**: SOC 2 Type 1 or ISO 27001 once paying customers ask. Reason: needed for upmarket deals, not for the first ones. |
| 39 | Onboarding programme | Bootcamp 1 to 5 days, pilot 8 to 12 weeks (file 06) | One-day diagnosis + seven-day build + before/after report [Press] | **V1**: a fixed two-week pilot: connect data, map the template, run reminders on a share of the ledger, report collected amount and DSO before and after. Reason: both vendors sell proof on the buyer's data first; the seven-day format is the size a solo founder can repeat. |
| 40 | Free tier or trial | Developer Tier, 5 users | Free trial; Quick BI 30 days; Dataphin Personal | **V1**: a time-boxed trial on the customer's own ledger, with outbound sending disabled until approval. Reason: lowers the barrier at no risk. |
| 41 | Pricing | Unit subscriptions, compute pools, $M contracts | Seat + pooled credits; per shop; outcome-linked | **V1**: platform fee per tenant plus credits, priced against the receivables handled. **Never**: outcome-only pricing at the start. Reason: seat plus credits is documented and mid-market-friendly; outcome pricing needs capital. |
| 42 | Forward-deployed engineers | 4 to 6 per customer | FDE team, 24 days on site at Yadi | **Never at scale**: the founder runs onboarding personally for the first customers, then replaces it with row 34. Reason: FDE economics need $M contracts. |
| 43 | Scenario simulation | Scenarios, Vertex (file 05) | Effect simulation in marketing [CLAIM] | **V2**: a cash-collection forecast under different dunning policies. Reason: a strong upsell, but after the cadence works. |
| 44 | Geospatial, time-series, graph, media apps | Map, Vertex, Quiver, media sets | — | **Never**. Reason: no receivables use. |
| 45 | CDP, tags and campaign automation | — | Quick Audience, tag factory [DOC] | **Never**. Reason: marketing is out of scope; the only "segmentation" needed is by risk and ageing. |
| 46 | Multi-agent teams | Boardroom (beta) | Expert groups [CLAIM] | **Never** in V1 or V2. Reason: two fixed agents suffice; multi-agent adds cost and failure modes. |
| 47 | Industry ecosystem data | Partner data (Zeta) | TMIC, Amap, Taobao [CLAIM] | **Never**. Reason: not available, and not needed. |

---

## What to copy (numbered, offer-level)

1. **Sell the template as the product, installed per customer with input mapping.** Palantir's Marketplace installs a packaged use case many times, mapping its inputs to each customer's data. Source: https://www.palantir.com/docs/foundry/foundry-devops/create-products (file 05 A16).
2. **Lead with proof on the buyer's own data within days, then charge.** Palantir's 1-5 day bootcamp (file 06 §7). Lingyang's one-day diagnosis plus seven-day build with a before/after report: https://www.sohu.com/a/1080187818_115035 (file 07).
3. **Price as seats or platform plus a shared credit pool, with a published credit rate and add-ons priced in credits.** Source: https://help.aliyun.com/en/document_detail/3029849.html.
4. **Sell AI by role, not by feature.** Each "AI employee" bundles data, knowledge, tools, permissions and an evaluation metric for one job. Source: https://help.aliyun.com/document_detail/3004555.html.
5. **Offer the agent interface as both an MCP server and a Skill package, using the user's own token.** Sources: Ontology MCP (file 02 KF 11); Quick BI Skill https://help.aliyun.com/zh/quick-bi/user-guide/quick-bi-open-skill-manual.
6. **List security features as a buyer checklist on the product page:** classification, encryption, masking, RBAC, audit, prompt-injection protection, certifications. Source: https://www.aliyun.com/product/agentone.
7. **Report the result as cycle time and money for one decision, and show the accept rate.** General Mills' over 70% acceptance and $40K a day (file 06 case 1).
8. **Gate seats for AI features separately from viewing seats,** as Quick BI does (members without an agent seat cannot use agents). Source: https://help.aliyun.com/zh/quick-bi/user-guide/smartq.
9. **Publish a free entry tier with hard caps** (Developer Tier: 5 users, capped capacity; Dataphin Personal at CNY 0.01). Sources: file 06 §7; Dataphin price page.
10. **Name the expansion routes in advance:** more units, more users, partners (for collections: more entities, more collectors, the customers' own portal). Source: 10-K FY2025 via file 06 §6.

## What cannot or should not be copied

- Palantir's multi-million first deal, the vendor-funded pilot and the FDE team. The economics need $6.7M average customers (file 06).
- Classified, air-gapped and edge deployment, markings and CBAC. These are defence-grade and irrelevant to the target buyer.
- Lingyang's Alibaba ecosystem data (Taobao, Amap, TMIC) and its distribution through Alibaba Cloud.
- Outcome-only pricing at the start ("free until results"). It needs capital.
- The breadth of either catalogue. Both sell dozens of modules because they serve thousands of use cases; a receivables product wins by depth in one.
- AgentOne's role-employee claims as a design source. They are marketing; the build plan should cite Dataphin and Quick BI documentation instead.

## Open questions and unverified items

- **AIP Now product list.** The platform overview names it ("prebuilt AI products and an industry showcase"), but I did not find its catalogue page.
- **Palantir list prices** beyond the placeholder AWS and G-Cloud units; the Azure, GCP and Oracle marketplace listings were not read.
- **FedStart mechanics** (which controls ISVs inherit, pricing). The Webull article returned no content.
- **The Developer Tier launch release** (Nov 2024). The fetch was rate-limited, so its contents rest on file 06.
- **Palantir packaged PDFs** for program oversight, health equity, emergency response and medtech: found by search, not read.
- **Quick BI edition prices and 智能小Q add-on prices.** On separate billing pages I did not reach.
- **AgentOne:** billing pages for 店小蜜 enterprise edition and Livestream Inspection; the credit-management, permission and data-security help pages; WinNexo; whether AgentOne is sold outside China; any standalone or private deployment option; customer complaints.
- **Quick Service and Quick Tracking** current product pages: not read. lydaas.com renders client-side and returned only metadata.
- **Dataphin 超级X prices.** The page prints "1,5000" and "1,0000"; probably CNY 15,000 and 10,000 a month, unconfirmed.
- **Dataphin semi-managed and standalone deployment prices.** On other pages, not read.
- **Budget.** I used 13 of 18 searches. The shared fetch pool was exhausted twice (HTTP 403 at the proxy), so I made about 22 fetch attempts, of which about 19 returned content.

## Sources (ranked by usefulness for this catalogue)

1. /home/claude/research/06-palantir-business.md: Palantir customers, cases, sales motion, pricing evidence; the basis for A1, A3 and A4.
2. /home/claude/research/07-lingyang-agentone.md: Lingyang history, AgentOne claims, Dataphin and Quick BI documented detail; the basis for Part B.
3. https://palantir.com/docs/foundry/platform-overview/overview/ (2026): Palantir's own map of platforms, decision components, AIP Bootcamps, AIP Now and Build with AIP.
4. https://help.aliyun.com/zh/dataphin/product-overview/billing-instructions (modified 24 Aug 2026): every Dataphin edition and add-on price.
5. https://help.aliyun.com/en/document_detail/3029849.html (modified 7 Aug 2026): AgentOne Data Analysis Agent seat, credit and add-on pricing.
6. https://www.aliyun.com/product/agentone (Nov 2026): AgentOne role capabilities, agent list, security list and certifications (claims).
7. https://help.aliyun.com/zh/quick-bi/user-guide/smartq (modified 5 Nov 2026): the five 智能小Q agents and their edition and seat rules.
8. /home/claude/research/03-palantir-aip.md: AIP feature catalogue with statuses and dates.
9. /home/claude/research/05-palantir-apps-infra.md: Palantir applications, Marketplace, Apollo, deployment options.
10. /home/claude/research/04-palantir-security.md: security features and certifications.
11. https://www.palantir.com/docs/foundry/announcements/2026-07 (Jul 2026): a month of shipped features, with model additions, pro-code agents and Marketplace bulk install.
12. https://aws.amazon.com/marketplace/pp/B0B1P1GDTF: Palantir's single subscription unit and placeholder price.
13. https://www.applytosupply.digitalmarketplace.service.gov.uk/g-cloud/services/801146272055049: Gotham G-Cloud 14 unit price and service terms.
14. https://help.aliyun.com/en/document_detail/136924.html (modified 2 Jun 2026): the full Quick Audience module list.
15. https://www.palantir.com/assets/xrfr7uokpv1b/4JcZrw9n5Gw4XDAOA9cxFm/ad94f841995570025dbf5622677ab98c/Palantir_Foundry_for_Anti-Financial_Crime_360.pdf (2022): a packaged Palantir industry solution, which mentions collections.
16. https://www.palantir.com/assets/xrfr7uokpv1b/1Ck5r0fJHcYaZSgV21tcXi/2fd9e681ed0641c134c4f9c99be93555/Palantir_Foundry_for_Supply_Chain_2022.pdf (2021-2022): packaged supply-chain use cases and claimed timelines.
17. https://help.aliyun.com/zh/quick-bi/product-overview/purchases-upgrades-downgrades-renewals-and-overdue-payments (modified 9 Jul 2026): Quick BI editions, seats and trial.
18. https://help.aliyun.com/zh/product/2987146.html (modified 26 Jan 2026): AgentOne help navigation, showing which agents are documented.
19. https://www.businesswire.com/news/home/20241211204864/en/ (11 Dec 2024): Warp Speed launch and cohort.
20. https://cloud.google.com/blog/topics/public-sector/google-public-sector-and-palantir-collaborate-to-bring-google-cloud-to-fedstart (23 Apr 2025): FedStart purpose and accreditation route.
21. https://news.microsoft.com/source/2024/08/08/palantir-and-microsoft-partner-to-deliver-enhanced-analytics-and-ai-services-to-classified-networks-for-critical-national-security-operations (8 Aug 2024): classified-cloud partner offer (search result; not fetched).
22. https://palantir.com/docs/foundry/getting-started/start-with-examples/: Build with AIP Examples and bring-your-own-data install.
23. /home/claude/research/13-cost-and-economics.md: AgentOne credit pricing comparison and Palantir metering.
24. /home/claude/research/01-palantir-data-layer.md and 02-palantir-ontology.md: data-layer and Ontology feature detail behind A2.2 and A2.3.
25. https://developer.aliyun.com/article/1746310 (8 Jul 2026): AgentOne "20+ out-of-the-box agents" and low-code claim.
