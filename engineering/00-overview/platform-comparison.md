# Platform comparison

**Layer:** [00-overview](README.md) · **What it is:** Palantir, Lingyang/AgentOne, Fabric IQ, Glean, Sierra, Decagon and Harvey compared at architecture level.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Open-source implementations](#open-source-implementations) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Palantir

### C5 and C6. Palantir vs AgentOne, function by function, with the founder's smallest faithful equivalent

> Source: [general-references/25-palantir-agentone-offer-catalogue.md § C5 and C6. Palantir vs AgentOne, function by function, with the founder's smallest faithful equivalent](../../general-references/25-palantir-agentone-offer-catalogue.md#c5-and-c6-palantir-vs-agentone-function-by-function-with-the-founders-smallest-faithful-equivalent)

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

## Open-source implementations

### Capability matrix

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#capability-matrix)

| Capability | Representative implementation(s) | What the code shows | Not solved by that component alone |
|---|---|---|---|
| Ontology/schema metadata | OpenFoundry definition service; UModel model packs; Palantir OSDK metadata contract | Type definitions, properties, links, schemas and generated contracts | Durable authoritative business-instance state and permission enforcement |
| Runtime object graph | UModel GraphStore/EntityStore; LightRAG PG graph storage; Graphiti nodes/edges | Entity/link storage, graph provider abstraction, JSONB adjacency or temporal facts | Enterprise source ownership, action gates and full domain constraints |
| Data/catalog ingestion | DataHub source/workunit; Airbyte/dlt in archive | Connector contracts, normalisation, work units and event emission | Business object identity and operational writeback |
| Entity resolution / dedup | Graphiti edge/node resolution; archive Splink/Cognee/OpenSPG | Matching and deduplication before graph insertion | A fully governed entity master without stewardship and merge policy |
| Knowledge retrieval | LightRAG; Graphiti; Glean | Hybrid vector/graph/context search, episodes, connector ACLs | Correct business metrics and source mutation |
| Semantic metrics/query | MetricFlow; Fabric semantic models; UModel query plans | Typed query requests, join planning/validation, source bindings | Full ontology transaction and workflow engine |
| Action execution | OpenFoundry action/writeback; Palantir action contract; gura105 in archive | Named actions, edit plans, validation, versions, external writeback concepts | Atomicity across independent external systems |
| Durable workflow | DBOS; Temporal in archive | Persistent workflow/step status, timers, queues, replay | Business authorization and domain-state ownership |
| Authorization | OpenFGA; OPA/Cedar in archive; Palantir docs | ReBAC/ABAC/policy evaluation and filter compilation | Enforcement unless each data plane and tool integrates it |
| SDK/tool integration | Palantir OSDK; UModel MCP/REST/CLI | Typed interfaces and guarded tool discovery | Safe execution without server-side authorization and audit |
| Agent ADLC | Sierra; Decagon; Harvey product workflows | Procedure authoring, simulations, traces, versioning, controlled release | Canonical data model and verified source state |

### Important differences—not commonalities

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#important-differencesnot-commonalities)

- UModel is a semantic object-graph runtime; Glean is content/people/activity retrieval; MetricFlow is a metrics compiler; DBOS is workflow durability; OpenFGA is authorization. These are complementary layers.
- Graphiti's facts are probabilistic/document-derived knowledge and temporal relationships; OpenFoundry's objects are typed operational state. A platform may use both, but a graph edge is not automatically a validated business fact.
- Fabric IQ emphasises source binding and source-owned data; OpenFoundry materialises runtime object data; Palantir supports an operational read/write engine. Their storage and transaction boundaries differ.
- Palantir OSDK is a client contract; never treat it as source for backend internals.
- AOPs/journeys describe an agent's procedure; they are not substitutes for the domain model that defines what a customer, invoice, legal matter or obligation is.

## Design decisions already in the reference maps

### 18. The 47-row Palantir vs AgentOne comparison, reduced to what version 1 needs

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 18. The 47-row Palantir vs AgentOne comparison, reduced to what version 1 needs](../../general-references/31-map-lingyang-alibaba-offers.md#18-the-47-row-palantir-vs-agentone-comparison-reduced-to-what-version-1-needs)

**Purpose.** Give the coding agent one list of what to build now. Receivables example: build the approval queue (row 9) before any dashboard polish (row 13).

**Design to implement.** Version-1 rows, in build order, with the section above that specifies each (all verdicts are 25's [Inference]):

| Order | Row | Function | Version-1 scope | Spec |
|---|---|---|---|---|
| 1 | 5 | Object model | Fixed starter types and links, customer-added properties | §1 |
| 2 | 1 | Connect sources | Read-only accounting/ERP connector, CSV upload, bank-statement import | §7 connector rules |
| 3 | 2 | Versioned data | Append-only sync snapshots only | §5 |
| 4 | 4 | Quality gates | 3 or 4 strong checks that stop reminders | §6 |
| 5 | 6 | Metrics | About a dozen governed metrics | §3, §4 |
| 6 | 33 | Change management | Draft vs published for rules, metrics, templates | §5 |
| 7 | 7 | Business rules | Dunning rule table with approval | §2 |
| 8 | 26 | Permissions | Roles plus row filters by entity, region, portfolio (RLS) | §13 |
| 9 | 27 | Agent identity | Internal acts as user; external as limited service identity | §13 |
| 10 | 8 | Typed actions | About eight actions | §12 |
| 11 | 9 | Human approval | Approval queue; external always approved at first | §12 |
| 12 | 10 | Action log | Every action and verdict with inputs and rule version | §12, §14 |
| 13 | 12 | Process state | Invoice state field plus transition log | §14 |
| 14 | 11 | Triggers | Daily run plus overdue and missed-promise triggers, caps, auto-pause | §15 |
| 15 | 17 | Glossary | Terms, synonyms, per-customer notes | §9 |
| 16 | 14 | NL Q&A | Through governed metrics only, with transparency and clarification | §10, §11 |
| 17 | 15 | Report | Weekly receivables report with cited figures | §11 |
| 18 | 19 | External agent | Email plus one messaging channel; no voice | §12, §13 |
| 19 | 20 | Reply handling | Classify replies into proposed actions | §7, §14 |
| 20 | 30 | LLM data controls | Mask bank details and identifiers; treat inbound email as untrusted | §7 |
| 21 | 31 | Audit log | Exportable logins, actions, prompts, outbound messages | §12 |
| 22 | 24 | Model choice | Two providers behind one adapter | §10 |
| 23 | 25 | Evaluations | Fixed per-tenant test set, rerun before changes | §8, §13 |
| 24 | 36 | Metering | Per-tenant credits, per-agent caps, published rate | §15 |
| 25 | 23 | External agent interface | MCP server plus Skill package under user token | §13 |
| 26 | 13 | Dashboard | One fixed receivables dashboard plus export | §11 |
| 27 | 35 | Template packaging | The receivables template installed per tenant with field mapping | §16 |
| 28 | 37 | Deployment | Multi-tenant SaaS, one region | — |
| 29 | 39 | Onboarding | Fixed two-week pilot | §16 |
| 30 | 40 | Trial | Time-boxed on own ledger, sending disabled | §16 |
| 31 | 41 | Pricing | Platform fee plus credits | §15 |

Version 2: rows 3 (incremental sync), 16 (proactive insight), 18 (document intelligence for remittances and disputes), 22 (public API), 28 (purpose justification), 32 (retention and deletion), 34 (AI that maps the model), 38 (SOC 2 or ISO 27001), 43 (cash forecast under dunning policies). Never: 21 as a general builder, 29 (markings), 42 at scale (FDEs), 44 (geo, time-series, graph, media apps), 45 (CDP), 46 (multi-agent teams), 47 (ecosystem data).

**Copies.** 25, Part C, C5 and C6 table rows 1 to 47.

**Left out, and why.** As per the "never" list.

**Open questions.** 25 says version 1 needs "about a quarter" of the rows, but its own table marks 31 of 47 as version 1 (see Contradictions). The coding agent should treat the table, not the summary, as binding, and the founder should confirm.

---

## Earlier engineering notes (Phase 2)

### Company and product architecture comparison

> Source: former `01-reference-architecture/company-platform-comparison.md` (moved here in the Nov 2026 restructure)

**Scope:** Current public product/technical evidence cross-checked with the original archive. Vendor descriptions remain labelled as vendor descriptions. Private internals are not inferred from marketing pages.

#### Executive distinction

The companies studied do not all implement the same kind of system:

- **Palantir Foundry Ontology** documents a language, execution engine and developer toolchain joining data, logic, action and dynamic security.
- **Alibaba UnifiedModel (UModel)** is an open semantic object-graph runtime with model packs, entity/relationship writes, graph-store providers and query/agent interfaces. The public repository currently limits some external telemetry operations to query-plan generation.
- **Microsoft Fabric IQ Ontology (preview)** documents a business definition and data-binding layer over source-owned data. Microsoft explicitly says ontology itself is not a general-purpose data-query engine; downstream experiences query the bound sources.
- **Glean** focuses on enterprise knowledge graph/search: content, people and activity, connectors, indexing, permissions and agentic retrieval. It is not equivalent to a transactional object/action runtime.
- **Sierra** and **Decagon** are agent platforms for customer operations. Their public product surfaces reveal workflow authoring, tools/integrations, guardrails, simulations, traces and release controls, not a public general-purpose enterprise object database.
- **Harvey** is a legal workflow and knowledge product, useful for domain design, document intelligence, secure collaboration and legal-specific agent workflows.

#### Palantir — primary operational reference

**Official sources:** [Ontology system](https://www.palantir.com/docs/foundry/architecture-center/ontology-system), [object backend architecture](https://www.palantir.com/docs/foundry/object-backend/overview/index.html), [object permissioning](https://www.palantir.com/docs/foundry/object-permissioning/overview), [object edits](https://www.palantir.com/docs/foundry/object-edits/overview), [actions](https://www.palantir.com/docs/foundry/action-types/overview), [functions on objects](https://www.palantir.com/docs/foundry/functions/functions-on-objects).

##### Documented product architecture

Palantir describes the Ontology as a fourfold integration of data, logic, action and security, organised conceptually into a Language, Engine and Toolchain. The Language includes objects, properties, links, action types, automations, logic and interfaces. The Engine provides read/write architecture and materialisations. The Toolchain supports applications and developers through OSDK and other tooling.

Its documented backend has distinct functional components: Ontology Metadata Service, object databases, Object Set Service, Actions, Object Data Funnel and Functions on Objects. This is a strong warning against compressing “ontology” into one graph database or CRUD API. Definitions, object persistence, object-set query, edits/action execution, ingestion/indexing and developer tooling are separate concerns.

##### Action and security semantics

Palantir documentation describes actions as transactions that change one or more objects according to configured logic. Object permissioning distinguishes permissions on ontology resources (schema/type/action resources) from permissions on object/link instances. Its object-edit documentation describes source-backed data combined with user edits. The original archive also captured consistency guarantees: atomicity applies to Ontology edits within its guarantee boundary; external webhooks/notifications are outside that same atomic guarantee. Exact guarantee scope must be read per action type and current docs.

##### What to learn

- A separate ontology language/type registry and runtime.
- Object-set API as a first-class query abstraction.
- Typed action definitions plus server-side validation and controlled edit plans.
- Permissions evaluated at interaction time, not only at ingestion.
- Distinction between source-derived data and user/ontology edits.
- Generated typed SDKs and application tooling.

##### What is not public

The official service overview is architectural documentation, not a full implementation disclosure. OSDK source code is a client contract and cannot reveal internal object database or action-server implementation. We should not invent Palantir's private algorithms from public diagrams.

#### Alibaba Cloud / Lingyang / AgentOne and UModel

**Sources:** [Alibaba UnifiedModel repository](https://github.com/alibaba/UnifiedModel), [UModel docs index](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/README.md), [Object Graph Semantic Layer](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/concepts/object-graph-semantic-layer.md), [Agent integration guide](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/guides/agent-integration.md).

The user's original archive has separate research on Lingyang/AgentOne, Dataphin and Quick BI AIPro. Keep that enterprise product research distinct from the public UModel repository: UModel's public implementation is evidence for the open semantic-layer/runtime project, not proof of AgentOne's hosted internals.

UModel's current README describes a local service around a workspace-scoped object graph. Model packs define EntitySets, datasets, links, storage and relation semantics. EntityStore writes runtime entities and topology relations. Query Service exposes `.umodel`, `.entity` and `.topo`. AgentGateway/MCP exposes discovery, resources, query examples and tools; UI, CLI, REST and SDK use shared contracts. GraphStore providers include memory, file-backed, Ladybug, Neo4j and Gremlin.

The current public query code and agent guide expose a key limitation: external metrics/log queries can be represented as query plans for downstream Prometheus/Elasticsearch execution; the public Query Service does not itself execute all downstream telemetry plans. Write tools are disabled by default and explicitly enabled. Entity writes can persist the graph record before the search index, returning a warning if the secondary index update fails; the service exposes index restoration. The idempotency cache inspected is in-process, not proven durable across restart.

##### What to learn

- Semantic model definitions distinct from actual runtime graph records.
- Provider abstraction so semantic query contracts can target different graph stores.
- An agent gateway that exposes controlled query context and keeps write tools opt-in.
- Separate indexing/search repair from primary graph persistence.
- Public contracts shared across CLI, REST, MCP, SDK and UI.

##### What not to assume

The public UModel repository is not a complete Foundry replacement. Do not infer full enterprise RBAC, external telemetry execution, data ingestion or business transaction guarantees from the semantic layer alone. Do not assume the open-source UModel implementation is identical to AgentOne's commercial architecture.

#### Microsoft Fabric IQ — semantic context and source bindings

**Sources:** [Fabric IQ docs](https://learn.microsoft.com/en-us/fabric/iq/), [Ontology overview, updated 16 October 2026](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview), [data binding](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-bind-data), [generating ontology from semantic models](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models), [rules](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules).

The current Microsoft docs mark ontology as **preview**. They explicitly describe ontology as a business-context and semantic modelling layer that stores definitions and bindings, not itself a general-purpose data-query engine. Source data remains in owning systems; consumer experiences can query live bound sources. Bindings map entity types, properties, relationships and metrics to supported sources. Microsoft documents entity types, keyless entities, namespaces, inheritance, shared properties, rules and metrics. Power BI DAX measures remain owned by the source semantic model while ontology carries source and business context. The docs state an old ontology experience retires on 31 January 2027; that lifecycle detail is time-sensitive and should be rechecked before implementation planning.

##### What to learn

- Explicit source bindings and source ownership.
- Reuse of an existing governed semantic model rather than duplicating every metric.
- Ontology definitions and graph storage are distinct capabilities.
- Rules and metric context can be attached to entity types and relationships.
- Proposal-first AI assistance for model generation and changes.

##### Product boundary

Fabric IQ's public ontology surface is a good reference for a source-bound semantic model. It is not a drop-in action transaction runtime. It should be compared to the modelling/binding parts of the platform, not treated as a counterpart for every Foundry backend service.

#### Glean — enterprise knowledge graph and permission-aware retrieval

**Sources:** [Knowledge Graph](https://docs.glean.com/security/knowledge-graph), [connector architecture](https://docs.glean.com/connectors/connectors-power-glean), [code search](https://docs.glean.com/security/how-code-search-works).

Glean's public docs describe three knowledge graph pillars: content, people and activity. Connectors crawl document/message/ticket/code content, metadata, identity/permissions and activity signals. The resulting graph and indexes feed search, chat/RAG and agents using indexed, live and hybrid retrieval. Their docs stress permission mirroring where source connectors provide it. Code search has a dedicated crawl, lexical+semantic indices and agentic loop.

##### What to learn

- Connectors are semantic adapters, not simple file downloaders: they normalize content, metadata, ACLs and activity.
- Identity and permissions are data assets that must be synced and used at query time.
- Enterprise retrieval often needs indexed, live and hybrid access rather than one global vector search.
- Search results must retain source identity and click-through provenance.

##### Boundary

This is knowledge retrieval and enterprise context, not a complete canonical object model or transactional operational platform.

#### Sierra — agent development lifecycle and observable operations

**Sources:** [Agent Studio](https://sierra.ai/product/agent-studio), [Agent SDK](https://sierra.ai/product/agent-sdk), [Your agent, laid bare](https://sierra.ai/blog/your-agent-laid-bare-and-why-it-matters) (22 September 2026), [release governance](https://sierra.ai/uk/blog/release-governance-guardrails-for-agents-at-scale), [agent testing guide](https://sierra.ai/learn/how-to-test-ai-agents).

Sierra publicly exposes journeys built from agent instructions, tools and dynamic data, knowledge sources, traces, integrations and agent actions, simulations, outcome-based evaluations and regression tests. Its release-governance article describes checks/simulations, merge approvals and split-traffic rollout. The September 2026 article says journey/action/policy/persona definitions can be inspected and edited, traces show decision/tool/response records, and data can be exported to observability/data systems; it also describes agent configuration living in a Git repository. Treat such statements as vendor descriptions.

##### What to learn

- An Agent Development Lifecycle (ADLC): build → inspect → simulate → review → canary → observe → revise.
- Trace visibility for each decision and tool call.
- Real workflow outcomes and guardrails are better tests than prompt-quality alone.
- Production failures should become regression cases.
- Operational telemetry can be exported into existing infrastructure.

##### Boundary

Sierra's public product is primarily an agent platform for customer-facing workflows. It is useful for orchestration, governance and evaluations; not proof of general-purpose enterprise ontology storage.

#### Decagon — business-authored procedures with engineering controls

**Sources:** [Product overview](https://decagon.ai/product/overview), [Agent Operating Procedures](https://decagon.ai/blog/from-sops-to-agent-operating-procedures).

Decagon describes AOPs as natural-language instructions that compile into structured logic for agents. Business/CX teams can author and iterate procedural behaviour; engineers manage underlying tools, integrations, guardrails and versioning. Duet is presented as a collaborative natural-language interface. This suggests a design where the editable business procedure is not identical to arbitrary model prompt text; it is translated into a controlled execution structure.

##### What to learn

- Separate business procedure authoring from tool implementation.
- Convert SOPs into discrete triggers, steps, actions, conditions and escalation points.
- Make guardrails, integrations and versions inspectable by engineers.
- Evaluate processes against repeatable case outcomes.

##### Boundary

AOPs describe agent workflow logic in a CX product. They do not by themselves provide enterprise object identity, generalized type systems or data governance.

#### Harvey — vertical legal workflow and knowledge product

**Sources:** [Harvey platform](https://www.harvey.ai/platform), [Getting Started with Harvey (29 October 2026)](https://help.harvey.ai/articles/getting-started-with-harvey).

Harvey publicly presents Agents, Vault, Knowledge, Workflows, Spaces, Command Center, Contract Intelligence and Horizon Scanning. Its user guide lists Threads, Vault, Workflows, History and Library. The engineering lessons are mostly product/domain-side: legal work is a combination of secure matter/document context, bulk document analysis, research with grounded citations, reusable workflow procedures, collaboration and reviewable generated outputs.

##### What to learn

- Domain-specific ontology should model matter, client, party, contract, clause, obligation, deadline, authority, precedent, document, evidence and approval separately.
- Document collections need matter/space scopes and permission boundaries.
- Legal agents need source citations, document-level provenance and human review for high-stakes outputs.
- Workflow templates and playbooks are as important as free-form chat.

##### Boundary

Public product pages do not disclose the full internal legal ontology, retrieval stack, training, evaluation or policy architecture. This file does not infer those internals.

#### Cross-company summary

| Company | Strongest public evidence area | Not interchangeable with |
|---|---|---|
| Palantir | Ontology language + read/write engine + action/security/toolchain | A catalog or RAG engine alone |
| Alibaba UModel | Public semantic object graph + query/MCP contracts | Hosted AgentOne internals or full enterprise ETL |
| Fabric IQ | Source-bound semantic definitions and business context | Standalone object/action transaction engine |
| Glean | Connector normalization, ACL-aware enterprise retrieval | Canonical transactional business-object runtime |
| Sierra | Agent authoring, actions, simulation, release and trace lifecycle | Enterprise data/ontology store |
| Decagon | SOP-to-procedure authoring, business-engineering collaboration | General data platform |
| Harvey | Legal work product, knowledge, documents and reusable workflows | Generic ontology runtime |

#### Additional company cross-check and source boundaries

##### Microsoft Fabric IQ — source-bound ontology, not an object transaction runtime

Microsoft's current [Fabric IQ ontology overview](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview) and [data binding documentation](https://learn.microsoft.com/en-us/fabric/iq/ontology/data-bindings) describe entity types, properties, relationships, metrics, rules and bindings to data that remains in source systems. The documentation distinguishes the ontology definition/context layer from the underlying data query engine; it is not itself a general-purpose query engine. The feature is documented as preview in the current material. This is materially different from Palantir's documented operational object read/write engine.

**Lesson:** a semantic ontology can sit over source-owned data and generate context without becoming the source-of-truth database. Our design must explicitly decide which business objects are source-backed/bound and which are platform-owned materialised operational objects.

##### Glean — permission-aware enterprise content graph

Glean's [knowledge graph](https://www.glean.com/product/knowledge-graph) and [connector documentation](https://developers.glean.com/connectors) describe a content/people/activity graph built from connector-normalised documents, metadata, permissions and activity. It supports retrieval across indexed and live/hybrid sources. This is a valuable pattern for enterprise document/knowledge context, but it is not evidence of a transactional business object/action engine.

**Lesson:** connector sync must include source ACLs and identity mapping, not just content and embeddings. Retrieval must preserve source document IDs, permissions and provenance.

##### Sierra and Decagon — agent configuration requires a release lifecycle

Sierra's [Agent Studio](https://sierra.ai/product/agent-studio), [testing guidance](https://sierra.ai/learn/how-to-test-ai-agents) and [release governance](https://sierra.ai/uk/blog/release-governance-guardrails-for-agents-at-scale) expose journeys/instructions, tools, traces, simulations, guardrails and controlled releases. Decagon's [Agent Operating Procedures](https://decagon.ai/blog/from-sops-to-agent-operating-procedures) describe converting business procedures into structured agent operating logic with engineering-owned integrations/guardrails.

**Lesson:** agent prompts/configuration must be versioned, tested against scenarios, reviewed, promoted, traced and rolled back. Production failures should become regression cases.

##### Harvey — domain product surface, not an exposed generic ontology

Harvey's [platform](https://www.harvey.ai/platform) presents legal research, documents, workflows and agent experiences. The public product surface is useful for deriving legal-domain tasks and objects (matter, party, agreement, clause, obligation, evidence, authority and review), but it does not reveal the private internal data model, retrieval stack or policy engine.

**Lesson:** use product surface and public workflow behaviour to shape a legal domain pack, but do not infer Harvey's backend architecture from the UI.

#### Implication for our platform

**Proposed:** keep the ontology/runtime as the common business object and action substrate, but treat data ingestion, knowledge retrieval, semantic metrics, workflow durability and agent authoring as separate bounded capabilities. The shared model should connect them through typed contracts and policy enforcement. Do not force a single graph store to be the warehouse, vector database, metrics engine, workflow state store, action transaction manager and agent memory at once.

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
