# Process-intelligence and automation giants: what they sell, how it works, and what an agent start-up should take

Scope note (written 21 November 2026). This file covers the process-mining and automation vendors that the earlier rounds (files 01 to 14) skipped: Celonis and UiPath in depth, then ServiceNow, Automation Anywhere, Pega, Appian, Camunda, IBM watsonx Orchestrate, Workato, Zapier, n8n, Make, Tines and Microsoft Power Automate with Copilot Studio in a shorter form. It follows BRIEF.md and BRIEF-COMPANIES.md. The web budget ran out partway through. The shared fetch proxy refused calls, then the hourly fetch limit was reached, and all 18 searches were used. Celonis, UiPath, ServiceNow and Pega rest on primary pages read in full. The other companies rest on fewer pages, plus background knowledge that is labelled [Unverified] wherever it is used. The labels follow BRIEF.md: [Fact], [Vendor claim], [Inference], [Unverified].

The founder's product, restated so the lessons stay specific: it holds a company model (objects, metric definitions, rules, permissions, actions) that rented-model agents work through. Its first job is receivables and collections for companies with 100 to 1,000 staff. It has an internal face (finance reports, questions) and an external face (payment reminders by email and messaging).

## Key findings

1. **Celonis has already built the founder's product shape for very large SAP customers.** It sells an object-centric model of objects, events and relationships, a semantic layer of KPIs, filters, triggers and actions, write-back flows into SAP, an MCP server for outside agents, and pre-built accounts-receivable apps for collections, disputes, credit and cash application. Its weak spot is the 100 to 1,000 staff segment: setup needs an extractor server, connector installation, transformations, data model assignment and variable validation ([Fact] https://docs.celonis.com/en/getting-started-with-the-collections-execution-app.html).
2. **Celonis's AR apps give a ready-made function list and KPI list for version one.** Collections covers aging, top-10 past-due customers, DSO and its trend, average days past due, average days to pay, and weighted average payment terms. It prioritises customers by payment history, disputes and last contact, and offers dunning emails, dispute coding, tasks, promise-to-pay and ERP-synced notes. Disputes covers reason codes, days to identify and days to resolve. Credit covers utilisation, exposure, limit suggestions and approvals. Cash covers auto-match and unapplied cash ([Fact] https://docs.celonis.com/en/accounts-receivable-capabilities.html, https://docs.celonis.com/en/accounts-receivable-cash-app.html).
3. **An event log and an ontology are different kinds of company model.** An ontology states what things are and what may be done. An event log records what actually happened, when and to which objects. Celonis now calls its stack a "Context Model" with three pillars: process data, business knowledge and decision intelligence (forecasting). This is Celonis conceding that the event log alone is not enough for agents ([Fact] https://www.celonis.com/news/article/finally-enterprise-ai-gets-the-context-it-needs-to-succeed-celonis-next-2026, May 2026).
4. **The Celonis Knowledge Model is the closest documented analogue to the founder's "metric definitions, rules and actions" layer.** It holds records, calculated attributes in PQL, augmented attributes that write back without a reload, KPIs, reusable filters ("a business condition"), triggers that fire Action Flows on newly matching items, and actions as buttons ([Fact] https://docs.celonis.com/en/knowledge-models).
5. **Write-back is governed by transactions and audit, not by agent judgment.** Celonis SAP actions group steps in Begin and End Transaction with rollback. Action Flow audit logs are kept for 12 months. A flow may run for at most 60 minutes, and webhook queues hold up to 10,000 executions ([Fact] https://docs.celonis.com/en/sap-action-flows.html, https://docs.celonis.com/en/action-flows-terms-and-limitations.html).
6. **Celonis's agent tooling is still early.** The Studio "Agent Tools" asset (formerly the MCP Server Asset) is in Private Preview. It supports OAuth 2.0 or application keys and is rate-limited to 500 calls per minute per asset. The published docs do not describe per-tool permission scoping ([Fact] https://docs.celonis.com/en/agent-tools--formerly-mcp-server-asset-.html, https://developer.celonis.com/mcp-server-asset/overview/).
7. **Every incumbent converged on the same architecture during 2025 and 2026.** A deterministic orchestrator holds the process (BPMN, case or flow). Agents are one task type inside it, next to robots, APIs and human tasks. Business rules sit in DMN or rules engines, outside the prompt. UiPath Maestro, Camunda, Pega Blueprint, the Celonis Orchestration Engine and ServiceNow all say this ([Fact] https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions; https://www.techtarget.com/enterprise-software/news/366643870/Pegasystems-refines-Blueprint-agent-builder-expands-marketing-tools).
8. **"Case management" came back for exception-heavy work.** UiPath shipped Maestro Case for long-running, exception-heavy processes in 2026 ([Fact] https://investingnews.com/uipath-reports-second-quarter-fiscal-2027-financial-results). Collections is exactly such a case: each overdue customer is a long-running case with promises, disputes, escalations and partial payments.
9. **Going headless over MCP is now table stakes.** ServiceNow Action Fabric (launch partner Claude), the Celonis MCP server, the UiPath MCP Server, Pega's MCP support and the ServiceNow MCP Registry let outside agents call the platform under its own governance ([Fact] https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and; https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-launches-the-real-time-data-foundation-that-puts-autonomous-AI-to-work-across-the-enterprise/default.aspx).
10. **Agent governance became a product category.** ServiceNow's AI Control Tower has five parts: Discover, Observe, Govern, Secure and Measure, where Measure covers cost and ROI. UiPath meters each LLM call, adds an "LLM as Judge" guardrail priced separately, and draws design-time testing from a separate pool ([Fact] constellationr link above; https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md).
11. **Pricing is moving from seats and tokens to per-run and per-outcome.** UiPath charges per LLM call: 0.16, 0.2 or 0.4 Platform Units by model tier, billed in 64k-input-token increments, or a flat 0.2 PU per run when the customer brings its own model. Pega announced a move from token-based to per-"case" pricing in June 2026 ([Fact] UiPath licensing doc; TechTarget Pega article).
12. **UiPath's numbers show the RPA ceiling.** ARR was US$1.938B at 31 July 2026, up only 12% a year, with net retention of 109% and net new ARR of US$37M in the quarter ([Fact] https://investingnews.com/uipath-reports-second-quarter-fiscal-2027-financial-results). The move from bots to agents has not yet re-accelerated growth.
13. **Dependence on SAP's goodwill is an existential risk for anyone who reads ERP data.** Celonis sued SAP in March 2025, alleging SAP made data extraction harder and costlier in order to favour Signavio. SAP agreed not to interfere with the extractor while the case runs, and a US judge later dismissed the claims with leave to refile ([Fact] https://www.processexcellencenetwork.com/process-mining/news/us-court-dismisses-celonis-antitrust-claims-against-sap/amp).
14. **None of the big platforms serves 100 to 1,000 staff companies well for finance agents.** Celonis, UiPath enterprise, ServiceNow, Pega, Appian and IBM are sold to large enterprises through partners. Zapier, Make and n8n reach small and mid-sized firms but carry no finance model, no AR semantics and no governance of external messages [Inference]. This gap is the founder's opening.

## Breakdown

### Celonis

**1. In one paragraph.** Celonis (Munich and New York, founded 2011, 3,000+ staff, 1,000+ platform customers, 17 offices) sells "process intelligence" ([Vendor claim] https://www.celonis.com/company/about-us?active-tab=tab-0). It extracts transaction tables from ERP and CRM systems, rebuilds them into a timeline of events for each business object, and shows where processes deviate, stall or leak cash. It then adds apps and automations that act on what it finds. Buyers are CFOs, COOs, chief process or transformation officers, shared-services heads and SAP centre-of-excellence leaders at very large companies. Its named customers include Mercedes-Benz, Uniper and Vinmar, a distributor with roughly US$3B in revenue ([Vendor claim] https://www.celonis.com/de/news/press/celonis-customers-drive-tangible-business-outcomes-with-enterprise-ai-powered-by-process-intelligence, 4 Nov 2025). The result they pay for is measured money: working capital released, DSO reduced, automation rate raised. Celonis claims US$11.3B of value realised to date and 120 "Value Champions" each above US$10M ([Vendor claim] about-us page).

**2. Function catalogue (grouped as Celonis groups them in 2025 and 2026).**

*Data layer*
- **Data integration and extractors.** Connectors to SAP (through an extractor server and the on-premise client, which needs no open firewall ports), Oracle and others. The Catalogue added 16 connectors, Oracle among them, in May 2026 ([Fact] https://docs.celonis.com/en/process-intelligence-graph.html; [Vendor claim] Next 2026 article). GA.
- **Celonis Data Core.** The storage and query engine, with zero-copy bi-directional integration to data lakes. GA since November 2025 ([Vendor claim] https://www.celonis.com/news/press/celonis-unveils-platform-innovations-to-power-the-ai-driven-composable-enterprise). Celonis reports that 80+ early adopters halved load times and needed 14 times less processing time ([Vendor claim] Next 2026 article).
- **Zero-copy connectivity.** Microsoft Fabric has been available since May 2025, where Celonis also runs as a Fabric workload. Databricks was added in November 2025. Amazon S3 is in private preview and Snowflake is "coming soon" (May 2026). Outbound Delta Sharing of enriched data is in private preview ([Vendor claim] Next 2025, Celosphere 2025 and Next 2026 sources).
- **Task Mining and AI-driven Task Discovery.** Captures desktop clicks, keystrokes and messages and links them to business objects. Task Discovery was in private preview in May 2026 ([Vendor claim] Next 2026 article).
- **Celonis Networks.** Cross-company data sharing, starting with procurement and order management, plus unstructured inputs such as PDFs and emails. In private preview. Design partners Conrad Electronic, TD Synnex and Schukat exchange 5,000 automated order updates a day ([Vendor claim] Next 2026 article).
- **AI assistants for extraction and modelling.** Help build the twin faster (Nov 2025, status not stated) ([Vendor claim] Celosphere 2025 release).

*Process Intelligence Graph and Context Model*
- **Object-centric data model (OCDM).** Object types, event types, and object-to-object and event-to-object relationships. It includes prebuilt process catalogues for Accounts Payable, Accounts Receivable, Order Management, Procurement and Inventory, plus master-data objects that carry no events (Customer, CustomerMasterCompanyCode, CustomerMasterCreditManagement, Material, Plant, User, Vendor and others) and helper objects such as calendar and currency tables ([Fact] https://docs.celonis.com/en/the-object-centric-data-model.html). Celonis ships 60+ pre-built objects and events and offers version control for the graph ([Vendor claim] Celosphere 2025; Next 2025).
- **Perspectives.** Named subsets of objects and events that define one process for analysis, for example `perspective_celonis_AccountsReceivable` ([Fact] OCDM page; https://docs.celonis.com/en/accounts-receivable-starter-kit---object-centric.html).
- **Knowledge Model (KM).** The semantic layer: records, calculated attributes, augmented attributes, KPIs, filters, triggers, actions, variables, event logs and flags (detailed below) ([Fact] https://docs.celonis.com/en/knowledge-models).
- **Context Model.** Launched May 2026 as the core of the platform. It combines process data, business knowledge (goals, best practices, ways of working) and decision intelligence (forecasting and simulation) ([Vendor claim] Next 2026 article).
- **Prediction Builder.** Deploys ML models in the platform to forecast outcomes and flag risks. Private preview, May 2026 ([Vendor claim] Next 2026).
- **Ikigai Labs acquisition** (agreed May 2026). Forecasting and decision-intelligence models ([Vendor claim] Next 2026 article; I could not open the German press release itself).

*Analyse*
- **Process Explorer, Instance Explorer, Performance Spectrum and the Object-Centric Performance app.** Find delays where processes intersect. GA by May 2026 ([Vendor claim] Celosphere 2025; Next 2026).
- **Studio Views.** Reusable view modules, scheduled reports (daily, weekly, monthly) and an event-log builder inside Views ([Vendor claim] Next 2025, 15 May 2025).
- **PQL Editor.** An editor for the Process Query Language that stays in sync with Knowledge Models ([Vendor claim] Next 2025).
- **Process Adherence Manager and Process Management API.** Import designed process models and measure conformance ([Vendor claim] Next 2025).
- **Transformation Hub.** Records ROI and value attribution for audit, embedded in Views (May 2026) ([Vendor claim] Next 2026).
- **Annotation Builder.** A no-code GenAI step that writes recommended decisions into views. GA May 2025 ([Vendor claim] Next 2025).

*Design and operate*
- **Process Designer.** Drag-and-drop redesign from an insight (updated May 2026) ([Vendor claim] Next 2026).
- **Action Flows.** Low-code automation that reads from and writes to source systems. It includes pre-built SAP actions by business object, such as releasing a credit block on a sales order or updating a PO delivery date, and generic RFC calls ([Fact] https://docs.celonis.com/en/sap-action-flows.html).
- **Orchestration Engine (OE).** Coordinates agents, human tasks and system automations. Acquired from partner Emporix (announced May 2025) and GA by November 2025. Branching and looping were added in May 2026. Celonis reports 100+ customers ([Vendor claim] Next 2025; Celosphere 2025; Next 2026). "Orchestration Engine Tools" let agents run deterministic processes on demand ([Vendor claim] Next 2026).
- **Execution Apps / Business Apps and Solution Suites.** Pre-built apps bundled into Finance, Supply Chain, Front Office and Sustainability suites (May 2025), and Industry Suites for manufacturing, automotive, life sciences and banking (May 2026) ([Vendor claim] Next 2025; Next 2026).

*AI and agents*
- **Process Copilots.** Ask about processes in Slack and Microsoft Teams. GA May 2025 ([Vendor claim] Next 2025).
- **AgentC.** The umbrella for agent tools, integrations and partnerships, launched at Celosphere 2024 (October 2024). It includes the Process Intelligence API, which shares context, metrics and recommended actions with Microsoft Copilot Studio, Amazon Bedrock and Salesforce Agentforce ([Vendor claim] Next 2025; [Fact] AgentC press, Oct 2024, https://www.supplychaindive.com/press-release/20241023-celonis-agentc-making-ai-agents-work-for-the-enterprise-with-process-intel-1, title only).
- **Agent Tools (formerly MCP Server Asset).** A Studio asset that exposes Celonis to MCP clients such as Claude Desktop, or through generated OpenAPI specifications. Tools search data models and knowledge bases, retrieve KPIs and process context, trigger external actions and write decisions back. It is in Private Preview ([Fact] https://docs.celonis.com/en/agent-tools--formerly-mcp-server-asset-.html). Celonis markets a "Process Intelligence MCP Server" as launching in November 2025 ([Vendor claim] Celosphere 2025). There are documented integrations with Microsoft Copilot Studio and Amazon Quick, and a Claude connector ([Fact] URLs in developer.celonis.com search results; pages not read).
- **Upgraded RAG search** over vector stores for unstructured knowledge (May 2026) ([Vendor claim] Next 2026).
- **Partner agents and apps.** Rollio Process Collaboration Agent for exception resolution (Campari, Manroland Goss), Trullion for lease accounting, and Bloomfilter Agent Miner for governing coding agents ([Vendor claim] Celosphere 2025).

*Accounts receivable apps (the founder's exact domain), function by function*

- **Collections Execution App** ([Fact] https://docs.celonis.com/en/accounts-receivable-capabilities.html; https://docs.celonis.com/en/getting-started-with-the-collections-execution-app.html)
  - Steering View: AR due, DSO, amount collected, risky accounts; execution gaps.
  - Action View: a customer worklist with open AR, AR due and aging buckets, sorted by priority, with CSV export.
  - Customer Detail View: contacts, transactions, collection activities, a collection scorecard and tasks. Collectors send email, take notes and log calls, and each action is stored as a collection activity.
  - Transaction Detail View: invoice billing items, balance, dispute, promise-to-pay. Collectors record invoice issues, set promises to pay and add notes.
  - Prioritisation uses payment history, disputes and last contact. The scoring formula is not published.
  - Pulls credit information live from the Credit app.
  - Automates or simplifies dunning emails, dispute coding and credit approvals.
  - Leaders create, assign and track tasks and coordinate customer ownership.
  - Collector updates sync to the ERP, and collectors can flag escalations.
  - KPIs: overall aging, top 10 customers by past-due and by AR, DSO (current and trend), average days past due, average days to pay, weighted average payment terms.
- **Disputes Execution App.** Capture and track disputes. Assign owners and resolvers with automated escalation. Pre-written templates and follow-up reminders. Categorise disputes and analyse root causes. KPIs: disputes by status and by reason code, days to identify (current and trend), days to resolution (current and trend), closed disputes by resolution code, valid versus invalid disputes ([Fact] AR capabilities page).
- **Credit Execution App.** Real-time risk assessment. Customers ranked by utilisation, exposure and past behaviour. Automatic or suggested credit-limit changes within set parameters. A one-page customer summary. Action flows for approvals. Bureau data and internal scorecards. Onboarding. Credit feeds into collections priority. KPIs: accounts near or over limit, open and pending reviews, approval stages, monthly review requests, risk by external or internal score ([Fact] AR capabilities page).
- **AR Cash Application App.** Improves daily auto cash posting. The backend groups payments with open invoices. Users validate the groupings, then clear unapplied cash, invoices and cash on account. Views: Steering, Action, Executive. KPIs: unapplied cash, manually versus auto-cleared invoices, percentage auto-cleared by company code or document type, total invoices and value, automation rate, average time to apply cash, cash on account cleared ([Fact] https://docs.celonis.com/en/accounts-receivable-cash-app.html).
- **AR Starter Kit (object-centric).** An AR Knowledge Model, a Validation Cockpit and a Process Cockpit. Use cases: on-time payment, touchless collections, DSO, payment-terms mismatches, cash-discount utilisation ([Fact] https://docs.celonis.com/en/accounts-receivable-starter-kit---object-centric.html).
- **Partner app.** A "Sailfin Accounts Receivable app suite" is documented (page title in search results; not read).

*Celonis Academy.* Free registration, with instructor-led and online training ([Fact] https://www.celonis.com/pricing). The academy works as a moat. It trains a labour market of "Celonis analysts" whom partners and customers hire, and it lowers the cost of the services-heavy rollout [Inference].

**3. How it works underneath.**

*Data model.* Raw ERP tables are transformed (in SQL, inside data pools) into object tables and event tables. Each event type records what happened to which objects. Relationships are declared inside the type definitions, and both object-to-object and event-to-object relationships exist ([Fact] OCDM page). Customers can add custom attributes, relationships and whole custom types ([Fact] OCDM page). Master-data objects have no events. Helper objects carry calendars and FX ([Fact] OCDM page). A perspective then selects the objects and events that make up one process ([Fact]). The PI Graph is built in six steps: ingestion, modelling and transformation, graph construction, enrichment with rules and KPIs, analytics and action, and reuse across processes ([Fact] https://docs.celonis.com/en/process-intelligence-graph.html).

*Where customer rules live.* In the Knowledge Model ([Fact] https://docs.celonis.com/en/knowledge-models):
- **Records**: use-case views of objects. A record can extend one object, combine several or aggregate across dimensions ([Fact] https://developer.celonis.com/process-intelligence-apis/intelligence-api/glossary).
- **Calculated attributes**: PQL virtual columns evaluated at runtime.
- **Augmented attributes**: annotations by a user or a machine, pushed without a data reload. This is how a collector's note or a model's score lands on an invoice.
- **KPIs**: parameterised measures.
- **Filters**: reusable PQL conditions, each defined as a "business condition".
- **Triggers**: detect newly matching record items and start Action Flows. The developer glossary calls a trigger a predefined message emitted when a business condition occurs.
- **Actions**: buttons that start an Action Flow.
- **Flags**: instances that hurt a KPI (execution gaps).

This is a declarative rule layer (condition, then signal, then flow) kept separate from both the data and the automation [Inference].

*Actions and their safety.* Action Flows run through the Celonis Agent for on-premise SAP over the SAP Java Connector, on standard RFC ports. They support transactions with rollback. They can start from data triggers or from manual Studio buttons ([Fact] SAP Action Flows page). The documented limits are 60 minutes per execution, 3,200 records returned by several modules, 2 GB per file, a minimum schedule interval of 1 minute, 10,000 executions per webhook queue, schedules in UTC, and audit logs kept 12 months ([Fact] https://docs.celonis.com/en/action-flows-terms-and-limitations.html).

*Agent interface.* The MCP or OpenAPI asset is configured in Studio. It authenticates with OAuth 2.0 (production) or application keys (development), and clients discover tool names and schemas after connecting. Rate limit: 500 calls per minute per asset ([Fact] https://developer.celonis.com/mcp-server-asset/overview/). The "Search Data" tool needs embedded Knowledge Models switched on in AI Settings ([Fact] Agent Tools page). Per-tool authorisation is not documented, which matters [Unverified whether it exists]. In the AWS case study, an agent built on Strands and Bedrock AgentCore reads orders through the Celonis MCP server, checks partner calendars and writes the result back through an Action Flow. A Celonis engineer described the split as AWS building the agent while Celonis provides "the playbook and the rules of the game" ([Fact] https://aws.amazon.com/solutions/case-studies/celonis-agentcore-case-study, page updated 17 Nov 2026).

**4. Commercials.**
- **Pricing.** Not published. The pricing page routes to sales; only the Academy is free ([Fact] https://www.celonis.com/pricing). Contract sizes are not published [Unverified]. Background knowledge suggests six- to seven-figure annual contracts for large enterprises [Unverified].
- **Revenue.** Not disclosed by Celonis. I could not find a primary source [Unverified].
- **Funding and valuation.** Unicorn in 2018. Raised US$1B as a decacorn in 2021. A Series D extension at a US$13B valuation in 2022 (the page wording is ambiguous; it reads as valuation) ([Vendor claim] about-us page). Investors include Durable, T. Rowe Price, Franklin Templeton, Arena, QIA, Accel and 83North ([Vendor claim]).
- **Customers and results.** 1,000+ customers and 5,000+ enterprise deployments ([Vendor claim] about-us). 120 customers each realised more than US$10M, US$8.1B combined ([Vendor claim] Nov 2025 press). Vinmar's order-to-cash is described as "fully automated", with no figures given ([Vendor claim]). The Orchestration Engine has 100+ customers ([Vendor claim] May 2026).
- **Team.** 3,000+ employees ([Vendor claim] about-us).

**5. Why customers choose it.**
1. *It shows what really happened, with money attached.* The event log makes rework, late payment and maverick buying visible in currency terms, and the value-realisation claims ($11.3B, 120 Value Champions) are central to the pitch [Vendor claim].
2. *Pre-built SAP depth.* Connectors, transformations, a catalogue of 60+ objects and events, and apps per process mean less modelling from scratch ([Vendor claim] Celosphere 2025).
3. *It closes the loop to action.* Triggers, Action Flows with SAP write-back and transactions, and now the Orchestration Engine ([Fact] SAP Action Flows page).
4. *Neutrality across systems and clouds.* Zero-copy with Fabric, Databricks and S3, plus partnerships with Microsoft, AWS and Oracle ([Vendor claim]).
- *Complaints.* Long setup and a dependence on skilled consultants or partners (a 15-step setup even for one app, [Fact] Collections getting-started page). Cost [Unverified]. SAP data-access risk ([Fact] court reports). Several key items stay in private preview for a long time (Agent Tools, S3, Task Discovery) ([Fact]).

**6. How it deploys.** The Collections app needs three phases ([Fact] https://docs.celonis.com/en/getting-started-with-the-collections-execution-app.html):
1. *Extraction*: SAP connection, extractor server, connection configuration, the AR Collection Process connector from the Platform Store, data pool parameters, an initial full load, and full transformations in order.
2. *Installation*: install the app, assign the data model, assign plain-text runtime variables, follow the setup guide.
3. *Configuration*: data model adjustments, variable validation, filter and view customisation.

The steps are documented and need no code, but they assume an SAP Basis team and a Celonis-trained analyst. Calendar time to go live is not published [Unverified]. Background knowledge suggests weeks to a few months for a first use case [Unverified].

**7. What to copy** (see also the master list below).
1. Model AR as objects (Customer, Invoice, Payment, Dispute, PromiseToPay, CollectionActivity, CreditLimit) plus events (InvoiceCreated, DueDateReached, ReminderSent, PaymentReceived, DisputeOpened and so on), with object-to-object and event-to-object links. Source: https://docs.celonis.com/en/the-object-centric-data-model.html
2. Keep a separate semantic layer of KPIs, filters as named business conditions, triggers that fire flows on newly matching items, and actions as buttons. Source: https://docs.celonis.com/en/knowledge-models
3. Use augmented attributes: writable annotations on objects (a collector note, a risk score, an agent decision) that need no data reload. Source: same page.
4. Ship four AR apps with fixed views (steering, action list, customer detail, transaction detail) and the exact KPI lists above. Source: https://docs.celonis.com/en/accounts-receivable-capabilities.html
5. Wrap write-back in transactions with rollback and keep 12-month audit logs. Source: https://docs.celonis.com/en/sap-action-flows.html; https://docs.celonis.com/en/action-flows-terms-and-limitations.html
6. Expose the model over MCP and OpenAPI with OAuth, per-asset rate limits, and a "write decision back" tool for feedback loops. Source: https://developer.celonis.com/mcp-server-asset/overview/

**8. What not to copy, and where it is weak.** Do not copy the extractor-plus-transformation pipeline as a customer-run project; it is the cost a mid-sized firm cannot bear [Inference]. Do not copy the legacy-versus-new split (YAML custom objects that work in "legacy Views only"); it shows the cost of two generations of semantic layer ([Fact] KM page). Do not copy opaque prioritisation: the Collections docs do not explain the scoring ([Fact]). Weaknesses: there is no published external-facing customer channel (the dunning email is manual from the detail view), agent permissions are not documented, and the platform is SAP-centric.

**9. Relationship to the founder.** Mainly a *teacher*, for the object and event model, the semantic layer and the AR function list. In the long run Celonis is a *competitor* if it moves down-market, though no evidence of that was found [Inference]. It is not a supplier.

#### Why an event log differs from an ontology, and what to take from it

*Plain English.* An ontology is a dictionary and a rulebook: "an Invoice belongs to a Customer, has a due date, can be sent a reminder by a Collector." An event log is a diary: "Invoice 1042 created 3 March; reminder sent 2 April; customer disputed line 2 on 5 April; partial payment 20 April." The dictionary tells an agent what is allowed. The diary tells it what is actually going on, including what nobody designed: customers who always pay on day 62, reminders that never produce a payment, a sales rep who promises extended terms.

*Technically.* An ontology (Palantir style, files 02 and 03) is a typed schema: object types, link types, properties, action types and functions. It describes current state and permitted transitions. An object-centric event log (OCEL, Celonis OCDM) is an append-only record of events, each with a timestamp, an activity type and links to one or more objects. It describes history and real transitions. From the log you can derive things a schema cannot give you: throughput times, variants, conformance to the designed process, and the causal context for predictions ([Fact] https://docs.celonis.com/en/process-intelligence-graph.html; [Inference]). The reverse also holds. An event log on its own says nothing about who may do what, what an action does or what a KPI means. That is why Celonis layered the Knowledge Model, and now the Context Model with "business knowledge", on top ([Fact] KM page; Next 2026 article).

*What the founder should take.* Build both from day one, cheaply. (a) Keep the ontology as the contract for agents: types, actions and permissions. (b) Make every state change, whether ERP-sourced, human or agent-made, also an immutable event in an object-centric log linked to all the objects it touches. That gives four things almost free: the audit trail, a collections timeline per customer, measured DSO and promise-kept rates, and evaluation data showing which reminders produced payment [Inference]. For a mid-sized firm the log is mostly generated by the product itself (reminders sent, replies, promises, payments matched) rather than mined from SAP. That sidesteps Celonis's hardest and most expensive step [Inference].

#### The SAP dispute

Celonis sued SAP in US federal court in March 2025. It alleged that SAP used its ERP position to make extracting customers' own data harder and costlier so as to steer them to SAP Signavio, and it claimed antitrust violations, tortious interference and false advertising. In June 2025 SAP agreed not to interfere with the Celonis extractor, and not to charge extra fees or licences for it, until the case is resolved. A San Francisco federal judge then dismissed the data-blocking claims with leave to amend ([Fact] https://www.processexcellencenetwork.com/process-mining/news/us-court-dismisses-celonis-antitrust-claims-against-sap/amp, dated 1 Jul 2025). Search results also show headlines that a judge denied most of SAP's motion to dismiss and that "SAP must face Celonis antitrust claims" (Reuters, 2025). They also show that SAP "dodges German antitrust investigation over data extraction" (CIO.com) ([Fact] titles only in search results; pages not read, so the sequence and dates after mid-2025 are [Unverified]). *Lesson:* for the founder's segment the source systems are often Xero, QuickBooks, NetSuite, SAP Business One, Microsoft Dynamics or local ERPs, which mostly offer public APIs. The founder should still keep the connector layer thin and replaceable, and keep a customer-owned export path [Inference].

### UiPath

**1. In one paragraph.** UiPath (NYSE: PATH) built the robotic process automation (RPA) category. Software robots click through user interfaces and call APIs to repeat rules-based work. Since 2025 it has repositioned as "agentic automation": agents, robots and people coordinated by its Maestro orchestration layer. Buyers are heads of automation centres of excellence, CIOs, and shared-services and finance-operations leaders at large enterprises in banking, insurance, healthcare, the public sector and manufacturing. The job is removing manual swivel-chair work, for example invoice entry, reconciliations, claims and onboarding. The result they pay for is hours saved and throughput at constant headcount [Inference, consistent with UiPath's long-standing positioning].

**2. Function catalogue** (grouped as UiPath's 2026 platform; items without a source in this round are marked).
- *Build*: **Studio / Studio Web** (designer for robots and agents; Studio Web Test and Preview are not billed) ([Fact] https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md). **Agent Builder** (low-code agents with prompts, tools, context grounding, guardrails and evaluations). Coded agents, licensed separately ([Fact] docs page "coded-agents-licensing" appears in search results). Conversational agents, licensed separately ([Fact] search result title). **Coding agents and Maestro BPMN generation** (Preview) ([Fact] search result title "Maestro BPMN (Preview)").
- *Orchestrate*: **Maestro Orchestrate** runs long-running processes across agents, robots and people. It has three canvases on one engine: **Case** (long-running, exception-heavy work), **Flow** (developer-first sequential workflows) and **BPMN 2.0**. A case can invoke a BPMN process. It supports **DMN** business rules, real-time monitoring, live instance supervision (pause, resume, retry), and process mining on process data ([Fact] https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions). **Maestro Automate** handles short runs that finish within 24 hours ([Fact] same). **Maestro Case** and **Maestro Flow** were highlighted as new in the Q2 FY27 results (3 Sep 2026) ([Fact] https://investingnews.com/uipath-reports-second-quarter-fiscal-2027-financial-results).
- *Run and govern*: **Orchestrator**, which handles tenants, folders, robots, queues, triggers, credential assets and logs. The Enterprise tier adds advanced audit, canary tenants, customer-managed keys, an external credential store and Elastic Robot Orchestration ([Fact] https://docs.uipath.com/automation-cloud/automation-cloud/latest/admin-guide/unified-pricing-licensing-plan-framework). **Insights** for real-time monitoring (Basic and above) ([Fact] same). **AI Trust Layer** for model governance, PII handling and audit of LLM calls [Unverified in this round]. **Automation Ops** for governance policies [Unverified in this round].
- *Human in the loop*: **Action Center / Apps**, where people approve, correct or complete tasks [Unverified in this round, long-standing product].
- *Documents*: **Document Understanding** and **IXP** (intelligent extraction). Community limits are 50 documents an hour for Document Understanding, and 500 design and 100 runtime pages a month for IXP ([Fact] unified pricing page).
- *Data*: **Data Fabric** (Community: 1 unit with 100 MB of data, 500 MB of attachments and 1,000 API calls a day) ([Fact] same).
- *AI assistants*: **Autopilot** for developers, testers and end users, with its own licensing ([Fact] same page).
- *Agent interoperability*: **UiPath MCP Server** (Community: 50 a day per organisation) ([Fact] same page).
- *Testing*: **Test Suite / Test Manager**, sold with Automation Test Robots, and "agentic testing" [Unverified in this round; Automation Test Robot licence confirmed by the unified pricing page].
- *Discovery*: **Process Mining** and **Task Mining**, including Maestro's built-in process mining ([Fact] Maestro concepts page).
- *Computer Vision*: Community limit of 30 megapixels a minute ([Fact] unified pricing page).

**3. How it works underneath.** The robot executes deterministic workflows. Orchestrator schedules them through queues and triggers and stores credentials as assets. Maestro sits above as the process engine, where each step is a robot, an agent, an API call or a human task, and DMN tables hold rules ([Fact] Maestro concepts page). Agents run as production "runs", and each run is metered ([Fact] licensing doc). A run starts from Orchestrator (manual, schedule or queue) or from an API or webhook in a production workspace, and a published-channel conversation counts as one run ([Fact] same). Guardrails include "LLM as Judge", which costs extra judge calls ([Fact] same). Design-time debugging and evaluation draw from a per-user monthly pool scaled by licence type: 1x for Basic, 7.5x for Plus and 20x for Pro/Developer ([Fact] same).

**4. Commercials.**
- **Pricing.** "Unified Pricing" has seven plan levels: Free, Community, Basic Trial, Basic, Standard Trial, Standard and Enterprise ([Fact] unified pricing page). User licences are Express, Basic, Plus and Pro. Robots are Unattended and Automation Test. Consumption is in Platform Units: a Standard Trial includes 8,000 PU, Maestro Orchestrate consumes PU per orchestrated instance with no allowance, and Maestro Automate consumes PU at a reduced rate with a monthly allowance ([Fact] same). The older "Flex" plan meters agents in Agent Units ([Fact] licensing doc).
- **Agent metering** (the most precise in the market):

| Model tier | Unified (PU per LLM call) | Flex (AU per LLM call) |
|---|---|---|
| Premium (e.g. Claude Opus 4.6, GPT-5.5) | 0.4 | 2 |
| Standard (e.g. GPT-4.1, Claude Sonnet 4.6, Gemini 2.5 Pro) | 0.2 | 1 |
| Basic (e.g. Claude Haiku 4.5, GPT-4o-mini) | 0.16 | 0.8 |
| Customer-managed model | 0.2 per run (LLM calls not metered) | 1 per run |

  Input is billed in 64k-token increments (system prompt, history, tool definitions and user messages; output excluded). Top-ups come in 50-PU packs that roll over ([Fact] https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md). The money value of a PU was not published on the pages read [Unverified].
- **Revenue (Q2 FY2027, quarter ended 31 July 2026)**: revenue US$410.3M (+13%), ARR US$1.938B (+12%), net new ARR US$37M, dollar-based net retention 109%, non-GAAP gross margin 82%, non-GAAP operating income US$89.0M, cash US$1.405B. FY27 guidance: revenue US$1.789 to 1.794B and ARR US$2.065 to 2.070B ([Fact] https://investingnews.com/uipath-reports-second-quarter-fiscal-2027-financial-results, 3 Sep 2026). The shares fell about 24% after the report despite the raised outlook (headline in search results: Zacks; [Fact] title only).
- **Customers and team.** Not read in this round [Unverified].

**5. Why customers choose it.**
1. It automates systems that have no API (legacy UIs, Citrix) [Inference, long-standing].
2. Governance at scale: tenants, folders, credential stores, audit and canary tenants ([Fact] unified pricing page).
3. One vendor for robots, documents, agents, testing and orchestration ([Fact] catalogue above).
4. An installed base and a trained developer community (Community plan, Academy) [Inference].
- *Complaints*: the licensing is complex (seven plans, four user types, PU and AU) ([Fact]); robots are brittle when UIs change [Unverified, a widely reported pattern]; growth is slowing ([Fact] ARR +12%).

**6. How it deploys.** Self-serve trials last 60 days and then downgrade to Free ([Fact] unified pricing page). Enterprise programmes run through a centre of excellence and partners [Inference]. Time to go live was not read in this round [Unverified].

**7. What to copy.**
1. Meter agent cost per LLM call by model tier, with a flat per-run price when the customer brings a model, and bill input in fixed token increments. This makes the cost of rented models legible to the buyer. Source: https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md
2. Separate design-time (test and evaluation) consumption from run-time, and do not bill previews. Source: same.
3. Use three orchestration shapes on one engine: case for exceptions, flow for linear steps, BPMN for standard processes, with DMN for rules. Source: https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions
4. Allow live instance supervision: pause, resume and retry a running process instance. Source: same.

**8. What not to copy.** Do not copy seven plans and four user types. Do not build UI-scraping robots for version one: the founder's sources (accounting APIs, email) have APIs [Inference]. Weakness: agent value is still unproven in the numbers ([Fact] slowing ARR).

**9. Relationship.** *Teacher* for metering and orchestration design. A possible *competitor* only if UiPath packages AR agents for the mid-market, and there is no evidence it does [Inference].

**What UiPath learned moving from bots to agents** [Inference, drawn from the product shape documented above]: (a) agents did not replace robots and orchestration; they became another task type inside them, hence Maestro; (b) exception-heavy work needed case management, not longer flows; (c) customers demanded cost transparency per call and per model; (d) evaluation and guardrails had to be first-class and billable; (e) agents must be reachable from outside, hence the MCP Server.

### ServiceNow

1. **In one paragraph.** ServiceNow is the workflow platform for IT, employee service, customer service, security and risk at large enterprises. It runs more than 100 billion workflows a year ([Vendor claim] https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-launches-the-real-time-data-foundation-that-puts-autonomous-AI-to-work-across-the-enterprise/default.aspx, 6 May 2026). Buyers are CIOs, heads of IT service management, CHROs' service-delivery teams and customer-service leaders at large enterprises and governments. They pay for tickets resolved without people, SLA compliance, and one governed system of action.
2. **Function catalogue (Knowledge 2026, May 2026).**
   - **AI Control Tower** has five parts: Discover (30 new integrations across AWS, GCP, Azure, SAP, Oracle and Workday, which find AI agents and devices), Observe (from the Traceloop acquisition), Govern (risk assessment and remediation), Secure (from the Veza acquisition) and Measure (cost and ROI). It is part of the August "Australia" release ([Fact] https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and).
   - **Action Fabric** runs the platform headless for any MCP agent and exposes processes, workflows, SLAs, the Knowledge Graph and the Context Engine. Claude is the launch partner ([Fact] same).
   - **Autonomous Workforce / AI Specialists.** An L1 IT service desk specialist (GA). CRM specialists covering qualification, quoting, fulfilment, **invoice disputes** and renewals, available now. Employee-service specialists covering HR, legal, **finance**, procurement and others, available now. IT specialists from June. Security and risk specialists GA in September 2026 ([Fact] same). Moveworks (employee-service agent, acquisition milestone December 2025, see file 12) is being integrated into Autonomous Workforce ([Fact] headline in same article).
   - **Autonomous Security & Risk.** Veza Access Graph and Armis asset context. Armis was acquired for US$7.75B ([Fact] same).
   - **Otto.** A cross-platform AI experience, outlined only ([Fact] same).
   - **Data:** Context Engine (a real-time map of people, roles, assets, services and policies, with a semantic layer over CMDB, workflow and third-party data). **Workflow Data Fabric** (GA). **Data Catalog** with lineage and a business glossary (GA). **RaptorDB Pro**, one engine for operational and analytical work with native graph and time series. Live Perform, Live Connect (a SQL API over live data with no copies) and Live Archive (GA). Autonomous Data Governance (2H 2026). Autonomous Data Analytics (vision, built on Pyramid Analytics). **MCP Registry**, a private catalogue of approved MCP servers governed by AI Control Tower (Innovation Lab, with A2A Agent Cards by year end). **AI Gateway** (announced) ([Fact] newsroom release, 6 May 2026).
3. **Underneath.** A single platform data model (tables plus the CMDB) with workflows, SLAs and roles in one place. Agents inherit the platform's ACLs and workflows. Governance is a separate control plane (Control Tower) that inventories agents across vendors [Inference from sources above].
4. **Commercials.** A related headline reports ServiceNow ending a separate AI add-on in 2026 ([Fact] headline only; details [Unverified]). Revenue and pricing were not read in this round [Unverified]. Named results: PayPal's database tasks ran 2x faster and its longest operations 5x faster on RaptorDB ([Vendor claim] newsroom release). Customers named: City of Raleigh, DocuSign, Honeywell, Zespri ([Fact]).
5. **Why chosen.** It is already the system of record for service work; it has one permission and workflow model; and it now offers cross-vendor agent governance. *Complaints:* cost and implementation partners [Unverified].
6. **Deploys.** Partner-led implementations [Unverified].
7. **Copy.** (a) An inventory of every agent and tool, with cost and ROI measured per agent (Control Tower "Measure"). (b) A private registry of approved MCP servers. (c) A headless action layer that external agents call under the platform's own SLAs and rules. Sources above.
8. **Don't copy.** Platform breadth. Acquisition-led suites (Armis, Veza, Traceloop, Pyramid, Moveworks) are not reproducible by a solo founder.
9. **Relationship.** *Teacher* on governance. *Not a competitor* in the 100 to 1,000 staff segment for AR [Inference]. A *possible integration* where a customer already runs ServiceNow CSM for invoice disputes.

### Automation Anywhere

1. **In one paragraph.** RPA vendor number two, now marketed as "Agentic Process Automation". Its buyers resemble UiPath's: automation CoEs at large enterprises in financial services, healthcare and BPO [Unverified; the product page failed to load in this round].
2. **Function catalogue** [Unverified, from background knowledge, not read]: Automation Success Platform with a cloud **Control Room** for bot governance, scheduling, credential vault and audit; Bot Creator/Automator; **Document Automation**; **AI Agent Studio**; a "Process Reasoning Engine" for agent planning; Enterprise Knowledge (retrieval); Process Discovery. The G2 comparison page title confirms the product name "Automation Anywhere Agentic Process Automation" ([Fact] search result title https://www.g2.com/compare/automation-anywhere-vs-workato-vs-zapier).
3. to 6. Not verified in this round. The company is private; it was valued at US$6.8B in 2019 [Unverified].
7. **Copy:** the Control Room concept, meaning one console where every bot or agent has an owner, credentials from a vault, a schedule and an audit log [Unverified details].
8. **Don't copy:** UI robots.
9. **Relationship:** distant teacher. Not relevant to the founder's segment.

### Pega

1. **In one paragraph.** Pegasystems sells a rules-and-case-management platform (Pega Infinity) and real-time decisioning (Customer Decision Hub, with "next-best-action") to banks, insurers, telcos and governments. Buyers are COOs, heads of customer operations, and CIOs in regulated industries. The result is consistent, auditable handling of high-volume cases (claims, onboarding, collections, disputes) and personalised offers chosen in real time [Inference consistent with sources below].
2. **Function catalogue.**
   - **Pega Blueprint.** Generative design of workflows and applications from a description. Since 2026 it is also an *agent builder* that combines deterministic business rules with generative AI, and Blueprint agents can call MCP servers within data-governance rules (preview at PegaWorld, June 2026; release Q3 2026) ([Fact] https://www.techtarget.com/enterprise-software/news/366643870/Pegasystems-refines-Blueprint-agent-builder-expands-marketing-tools, 8 Jun 2026).
   - **MCP support** exposes Pega data to third-party agents (Anthropic, OpenAI, Google, AWS) under Pega governance ([Fact] same).
   - **Customer Engagement Studio**, a marketing front end to Customer Decision Hub ([Fact] same). The Customer Engagement Blueprint launched February 2025 ([Fact] title https://www.businesswire.com/news/home/20250225477319/en).
   - **Pega Predictable AI Agents**, which combine reasoning with workflow predictability (May 2025), and self-service built from Blueprint plus Predictable AI (August 2025) ([Fact] businesswire titles). An "Agentic Enterprise Transformation Platform" launched September 2025 ([Fact] title).
   - **Long-standing products** [Unverified in this round]: Case Management (stages, steps, SLAs, assignments), decision rules (decision tables, decision trees, when rules), Customer Decision Hub with adaptive models, Process AI, and Robotics.
3. **Underneath.** The rules-engine heritage: every behaviour is a versioned "rule" in layered rulesets, so a bank can override a step for one product line without forking the app [Unverified details]. Founder Alan Trefler says workflows matter because they are a deterministic way "to get stuff done" and make work visible ([Fact] TechTarget).
4. **Commercials.** AI pricing is moving from token-based to **per case**, meaning a completed task from start to finish ([Fact] TechTarget, June 2026). Revenue was not read [Unverified].
5. **Why chosen.** Regulated customers want "de-risked" agents ([Fact] TechTarget). Rules are auditable. Next-best-action is proven at scale [Unverified].
6. **Deploys.** Partner-led, with Blueprint shortening design [Inference].
7. **Copy.** (a) Agents that act only inside a case whose stages and rules are deterministic. (b) Per-case (outcome) pricing. (c) Next-best-action: for each customer, a ranked set of eligible actions (rules filter eligibility, a model ranks propensity), which maps directly onto "which reminder, on which channel, today". Sources: TechTarget; [Inference] for the mapping.
8. **Don't copy.** A proprietary rule language, and a developer certification ecosystem.
9. **Relationship.** *Teacher* (case plus decisioning). Not present in the founder's segment.

### Appian

1. **In one paragraph.** A low-code process automation platform (Nasdaq: APPN, 25 years old) sold to government, financial services, insurance and life sciences for case-heavy processes such as claims ([Fact] https://www.aap.com.au/aapreleases/cision20260512ae54260/, 13 May 2026).
2. **Function catalogue (May 2026).** **Data fabric** with a unified metadata model that gives agents context on how data is structured and linked across systems, and read-write access for third-party agents (enhanced). **MCP integration** for Appian agents (announced). **Agent performance tracking and memory** across processes. **AI objective guidance** (soon). A **Snowflake** partnership via MCP. **AI-assisted spec-driven development**, which extracts specifications from legacy apps. **Developer MCP servers** (build Appian apps from Claude Code or Kiro). **Appian Composer** (coming) ([Fact] same). Long-standing products [Unverified in this round]: process modeller, records, case management, RPA, document AI, and Process HQ (mining).
3. **Underneath.** The data fabric is a virtual layer: "records" over external systems with relationships, row-level security and sync. It is a lightweight ontology [Unverified details; the metadata model is confirmed].
4. **Commercials.** Not read [Unverified]. Customer: Global Excel Management (claims) ([Fact]).
7. **Copy.** A virtual data layer: model objects over the customer's systems with row-level security, without forcing a full copy (data fabric metadata model).
9. **Relationship.** *Teacher*. Enterprise-only.

### Camunda

1. **In one paragraph.** An open-core BPMN/DMN process orchestration engine (Zeebe in Camunda 8), bought by engineering teams at banks, insurers and telcos who code their processes. Since version 8.7 (April 2025) it has sold "agentic orchestration" ([Fact] https://camunda.com/blog/2025/04/camunda-87-agentic-orchestration-for-enterprise/, title only).
2. **Function catalogue.** BPMN modeller and engine, DMN decision engine, Tasklist (human tasks), Operate (instance monitoring and incidents), Optimize (analytics), connectors, and the **AI Agent connector** (Anthropic, Bedrock, Gemini, OpenAI). The **ad-hoc sub-process** works as a governed toolbox. There is an **MCP Client connector** (early access) and a vector database connector ([Fact] https://docs.camunda.io/docs/8.8/components/agentic-orchestration/ai-agents). Enterprise-grade agentic features were announced in October 2025 ([Fact] title https://camunda.com/blog/2025/10/enterprise-grade-agentic-automation-is-here/).
3. **Underneath (the cleanest published agent design in this set).** Camunda defines an agent as an LLM-driven loop with shared memory across iterations. The tools are the BPMN activities inside an ad-hoc sub-process. The LLM picks which tool to call, in what order and with which parameters, but only from the allowed elements. Camunda executes the chosen activity, stores variables, applies retries and incident handling, and routes human tasks and events. Short-term conversational memory is kept for each process instance ([Fact] same page).
4. **Commercials.** Not read [Unverified].
7. **Copy.** (a) Tools = activities in a bounded set; the engine, not the model, owns retries, incidents and human-task routing. (b) Memory scoped to a process instance (for the founder, one collections case). Source: Camunda AI agents page.
8. **Don't copy.** BPMN authoring as the customer's job in version one; mid-sized finance teams will not draw BPMN [Inference].
9. **Relationship.** *Teacher*. A possible *embedded engine* later (open-core) [Inference].

### IBM watsonx Orchestrate

1. **In one paragraph.** IBM's agent builder and orchestrator for enterprises, with a catalogue of domain agents (HR, procurement, sales) and a control plane ([Fact] https://www.ibm.com/products/watsonx-orchestrate/pricing).
2. **Function catalogue.** Agent building and orchestration, chat interface, tools and integrations catalogue, custom tools, workflow and document processing, control plane, evaluation and observability, security and access control, and ready-to-use domain agents (Standard tier). Channels: webchat, voice, Slack, Teams. Third-party agent add-ons: Sparx, Bright Data, Tavily, Symplistic ([Fact] same).
4. **Commercials (published, Nov 2026).** 30-day trial. **Essentials from US$578 a month**: 4,000 MAU, up to 200,000 messages a month, 10 GB of knowledge documents. **Standard from US$6,360 a month**: 40,000 MAU, up to 2,000,000 messages. **Premium** on quote: data isolation, HIPAA-ready. Deploys on IBM Cloud, AWS or on-premises ([Fact] same).
7. **Copy.** Published entry pricing with message and MAU caps. Evaluation and observability included even in the trial.
9. **Relationship.** Possible *competitor* at the top of the founder's range (its entry price fits mid-market budgets) but it has no AR model [Inference].

### Workato

1. **In one paragraph.** An enterprise iPaaS: "recipes" (workflows) across 1,200+ connectors, bought by IT and business-systems teams at mid-to-large companies ([Fact] https://zapier.com/blog/workato-pricing, a competitor's article, Nov 2026).
2. **Function catalogue.** Recipes, connectors, editions Standard, Business MCP, Enterprise MCP and Workato ONE (orchestration, API management, AI). Add-ons: Advanced Security & Governance, Private Link, on-premises agents, OpenLegacy, RobotiQ RPA, extra concurrency ([Fact] same). Genies, Agent Studio and Workbot were not verified in this round [Unverified].
4. **Commercials.** A platform fee plus usage in *tasks*: each action step counts, triggers and control-flow steps do not, each loop iteration counts, and a bulk action counts once. Prices are unpublished. Zapier's author estimates at least mid-six figures a year ([Fact] same; the estimate is biased).
7. **Copy.** A precise billing-unit definition (what counts as one task) published in the docs.
9. **Relationship.** A possible *supplier* of connectors for larger customers; otherwise a competitor for "integration plus agents" budgets [Inference].

### Zapier

1. **In one paragraph.** A self-serve automation tool for SMBs and departments, with 10,000+ apps ([Fact] https://zapier.com/blog/zapier-pricing/, 16 Jun 2026).
2. **Function catalogue.** Zaps (multi-step, Paths, Filters, Formatter), Tables, Forms, AI tools, Copilot (all plans), **Zapier MCP** (all plans), Interfaces, Agents and Canvas (not priced in the article). Governance: roles and permissions, SAML SSO (Team), usage analytics and a technical account manager (Enterprise), connection activity logs, SOC 2 Type II and SOC 3 ([Fact] same).
4. **Commercials.** Free (100 tasks a month), Professional US$19.99 a month (750 tasks, annual billing), Team US$69 a month, Enterprise custom ([Fact] same).
5. **Why chosen.** Self-serve, breadth of connectors, price.
7. **Copy.** Free and self-serve entry. Filters and branching do not consume billable units.
8. **Weak.** No business model of the company: every Zap re-encodes the rules [Inference].
9. **Relationship.** *Competitor* for the founder's buyers' "just automate reminders" budget. Its MCP is also a *possible supplier* of long-tail connectors [Inference].

### n8n

1. **In one paragraph.** A fair-code workflow automation tool with AI-agent nodes, popular with technical teams and self-hosters ([Fact] https://n8n.io/pricing).
2. **Function catalogue.** Workflows, all integrations, AI agent nodes and MCP, AI assistant credits, evaluations (metric-based), environments and Git version control (Business), SSO and LDAP (Business), log streaming (Enterprise), queue mode, custom roles (Enterprise) ([Fact] same).
4. **Commercials (EUR, annual).** Starter €20 a month (2,500 executions, 5 concurrent, maximum 5 minutes per execution, 7-day retention). Pro €50 (10,000 executions, maximum 40 minutes, 30-day retention). Business €667 (40,000 executions, self-hosted only). Enterprise custom (200+ concurrent, unlimited retention). The Community Edition is free to self-host ([Fact] same). n8n bills per *execution* (whole workflow run), not per step ([Fact] same).
7. **Copy.** Per-run billing. Built-in evaluations tied to workflows. Execution retention as a plan lever.
9. **Relationship.** *Competitor* for technical mid-market buyers. A possible *internal tool* for the founder's own connectors (licence terms permitting) [Inference].

### Make

1. **In one paragraph.** A visual scenario builder (formerly Integromat, owned by Celonis since 2020 [Unverified in this round]) for SMBs.
2. **Function catalogue.** Scenarios, routers, **error handlers (Rollback, Break, Resume, Commit, Ignore)**, data stores, webhooks, AI agents and the Maia assistant (not detailed), Enterprise Apps (Workday, ServiceNow), and a platform API with 300+ endpoints ([Fact] https://www.make.com/en/pricing).
4. **Commercials.** Credits: most actions cost 1, and AI features may cost more. Error handlers and routers are free. Free plan 1,000 credits a month. Core, Pro, Teams and Enterprise prices are not shown on the page. Start-up plan: 50% off for organisations under 20 staff. Per 10,000 credits a month: 5 GB transfer and a webhook queue of 667 (maximum 10,000). When credits run out, scenarios stop and webhooks queue ([Fact] same).
7. **Copy.** Named error-handler semantics (rollback, resume, commit, ignore) as first-class workflow elements. Explicit behaviour when the budget is exhausted (queue, don't drop). Source: Make pricing page.
9. **Relationship.** Competitor for simple reminder automation. Note that Celonis's Action Flows feel very like Make [Unverified link].

### Tines

1. **In one paragraph.** Started in security operations; now sells "intelligent workflows" across IT, security, finance, people, RevOps and legal. Customers include Coinbase, Databricks, Reddit and Canva ([Fact] https://www.tines.com/pricing).
2. **Function catalogue.** Workflows, AI agents and Workbench (pages linked, not read), "Govern AI building", flexible hosting, bring-your-own AI model on paid plans ([Fact] same).
4. **Commercials.** Free: unlimited users, 3 live workflows, a one-time US$50 AI allowance. Paid plans on quote ([Fact] same).
7. **Copy.** Bring-your-own model on paid plans; a free tier limited by live workflows rather than users.
9. **Relationship.** Teacher on governed self-build. Minor competitor.

### Microsoft Power Automate with Copilot Studio

1. **In one paragraph.** Microsoft's low-code automation (cloud flows, desktop RPA) and agent builder, bundled into Microsoft 365 and Power Platform. It reaches every company size through existing Microsoft licences [Inference].
2. **Function catalogue (Copilot Studio billing page, updated 31 Oct 2026).** Classic and generative answers, agent actions, tenant graph grounding, **agent flows**, text and generative AI tools in three tiers, content processing, voice tiers, reasoning models and Computer-Using Agents ([Fact] https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management).
4. **Commercials.** Copilot Credits: classic answer 1, generative answer 2, agent action 5, tenant graph grounding 10, agent flow actions 13 per 100, content processing 8 per page, premium AI tools 10 per 1,000 tokens. Voice costs 10, 35 or 75 credits a minute. Employee-facing use by a user with an M365 Copilot licence is often free. Enforcement starts at 125% of prepaid capacity; blocked agents stop mid-conversation unless pay-as-you-go is linked ([Fact] same). Pack prices are not on that page [Unverified].
7. **Copy.** A published rate card per *agent operation type*. An explicit over-capacity rule (125%) and admin alerts.
8. **Weak.** Credit arithmetic is complex. Stopping agents mid-conversation is hostile for external (customer-facing) agents [Inference].
9. **Relationship.** *The default competitor* for the founder's segment, since many 100 to 1,000 staff firms already pay for Microsoft 365. Also a *channel*: the founder's agent could be reachable from Teams and Copilot via MCP [Inference].

## What these companies know that agent start-ups are relearning

1. **Rules belong outside the prompt.** Maestro and Camunda support DMN. Pega Blueprint mixes deterministic rules with GenAI. Celonis stores filters as named business conditions. All keep eligibility and policy in inspectable tables, with the model choosing only within what the rules allow ([Fact] UiPath Maestro concepts; Camunda AI agents; TechTarget Pega; Celonis KM).
2. **A process model is the agent's boundary.** Camunda's ad-hoc sub-process limits tools to a declared set and gives the engine retries, incidents and human routing ([Fact] Camunda page). UiPath puts agents inside Maestro instances that can be paused, resumed and retried ([Fact]).
3. **Exceptions are the work.** Case management (Maestro Case, Pega, Appian) exists because collections, disputes and claims cannot be fully specified in advance ([Fact] UiPath Q2 FY27 release).
4. **Write-back needs transactions.** Celonis SAP actions use begin and end transaction markers with rollback. Make has commit and rollback handlers ([Fact]).
5. **Audit is retention plus attribution.** Action Flow audit logs are kept for 12 months ([Fact]). Every action needs who, what, why and which rule; ServiceNow's Control Tower and Celonis's Transformation Hub attribute value and cost ([Fact]).
6. **Bot governance means an inventory with owners.** Orchestrator folders, credential stores, canary tenants and audit, plus Control Tower discovery of agents across vendors ([Fact]).
7. **Cost must be metered per operation and visible.** UiPath charges per LLM call by tier, Copilot Studio per operation type, n8n per execution ([Fact]).
8. **Separate design-time from run-time,** and evaluate before production (UiPath pools, n8n evaluations, IBM evaluation in the trial) ([Fact]).
9. **The record of what happened is the evidence for value.** Celonis built its business on measured outcomes from the event log ([Vendor claim]).

## Adopt in version one, later, or never

| Concept | Decision | Why |
|---|---|---|
| Object-centric event log (every reminder, reply, promise, payment and dispute as an immutable event linked to Customer, Invoice and Case) | **Version one** | It is the audit trail, the per-customer timeline, the KPI source and the evaluation data in one structure. The product generates most events itself, so no mining project is needed [Inference; Celonis OCDM] |
| Semantic layer of KPIs and named conditions (DSO, average days to pay, weighted payment terms, "eligible for reminder") | **Version one** | It copies the Celonis KM and AR KPI lists exactly |
| Decision tables (DMN-style) for dunning policy: days overdue × amount × customer segment × dispute status → action and channel | **Version one**, as simple editable tables, not full DMN | Finance staff can read and approve them; the agent only drafts wording and handles replies [Inference; Maestro and Camunda DMN] |
| Case management (one collections case per customer, or per invoice when disputed, with states, owner, SLA, promise-to-pay, escalation) | **Version one**, minimal | Collections is exception-heavy (Maestro Case, Pega) |
| Human tasks and approval queue (approve first contact to new customers, any message above a threshold, credit changes) | **Version one** | Every incumbent routes human tasks from the engine (Camunda, Maestro, Celonis OE) |
| Governance of automated actions: agent inventory, per-action audit, kill switch, per-customer rate limits on outbound messages, cost meter per run | **Version one** (thin) | External messages carry reputational and legal risk. Copy UiPath's per-run metering and Control Tower's measure-cost idea |
| Transactional write-back with rollback to the accounting system | **Version one for notes and statuses; later for financial postings** | Copies Celonis SAP actions; postings need careful scoping |
| Next-best-action ranking (rules filter, model ranks) | **Later** (after enough outcome events) | Pega CDH; needs data from the event log |
| Full BPMN orchestration canvas | **Later**, or never customer-facing | Mid-sized finance teams will not author BPMN [Inference] |
| Process mining over ERP history (conformance, variants) | **Later**, as an onboarding diagnostic ("your DSO by customer, last 12 months") | High value as a sales tool; Celonis's expensive part |
| Cash application matching | **Later** (second app) | Celonis Cash app functions are a ready spec |
| Prediction or forecast models (pay date, risk) | **Later** | Celonis Prediction Builder and Ikigai show the direction |
| UI-scraping robots (RPA) | **Never** for the target segment | Target systems have APIs; robots are brittle [Inference] |
| Proprietary query or rule language (PQL, Pega rules) | **Never** | Use SQL plus plain decision tables |
| Seven-plan, multi-unit licensing | **Never** | The UiPath and Copilot complexity is a known complaint |

## Does any of them serve 100 to 1,000 staff companies well?

- **For AR and collections specifically: no.** Celonis's AR apps assume SAP, an extractor server and a trained analyst ([Fact] setup page). Pega, Appian, ServiceNow and UiPath Maestro are enterprise and partner-led [Inference].
- **For generic automation: partly.** Zapier (from US$19.99 a month), Make (with a start-up discount under 20 staff), n8n (from €20 a month) and Tines (free tier) are affordable and self-serve, but they hold no company model, no AR semantics, no case management and weak governance of external messages [Inference from the pricing pages].
- **Closest threats.** Microsoft Copilot Studio and Power Automate, which are already in the customer's Microsoft licence and published per operation. IBM watsonx Orchestrate Essentials at US$578 a month. Neither ships an AR model ([Fact] pricing pages; [Inference] on fit).
- **Conclusion:** the gap the founder targets is real. Enterprise-grade concepts (event log, rules, cases, governance) are delivered in a pre-modelled, self-serve package for mid-sized finance teams, on accounting-system APIs rather than SAP extraction [Inference].

## What to copy (master list)

1. **Object and event schema for AR.** Object types Customer, Invoice, InvoiceLine, Payment, CreditNote, Dispute, PromiseToPay, CollectionCase, Contact, CreditLimit. Event types InvoiceCreated, InvoiceDue, ReminderSent, MessageReceived, PromiseMade, PromiseBroken, PaymentReceived, PaymentApplied, DisputeOpened, DisputeResolved, CreditLimitChanged. Each event carries an id, a timestamp, an actor (system, human or agent id), a source and links to one or more objects. Master data objects carry no events. Why: history, audit and KPIs from one structure. Source: https://docs.celonis.com/en/the-object-centric-data-model.html
2. **A semantic layer with five entity kinds:** records (views over objects), calculated attributes, KPIs, named filters (business conditions) and triggers (condition → flow on *newly* matching items). Why: agents ask for "DSO" or "eligible for reminder", not SQL. Source: https://docs.celonis.com/en/knowledge-models
3. **Augmented attributes:** writable annotations on objects by humans or agents (note, score, decision) with no reload. Source: same.
4. **The exact AR KPI set:** aging, top-10 past due, DSO current and trend, average days past due, average days to pay, weighted average payment terms, disputes by status and reason, days to identify and resolve disputes, valid versus invalid disputes, promise-to-pay kept rate [Inference: last item added]. Source: https://docs.celonis.com/en/accounts-receivable-capabilities.html
5. **Four collector views:** steering, prioritised action list, customer detail (contacts, transactions, activities, scorecard, tasks), transaction detail (dispute, promise-to-pay). Source: https://docs.celonis.com/en/getting-started-with-the-collections-execution-app.html
6. **A prioritisation score from payment history, disputes, last contact and credit exposure,** which, unlike Celonis's, is *explained* on screen. Source: AR capabilities page.
7. **Write-back in transactions** (begin, end, rollback), with 12-month minimum audit retention, a 60-minute execution cap and queue limits. Source: https://docs.celonis.com/en/sap-action-flows.html; https://docs.celonis.com/en/action-flows-terms-and-limitations.html
8. **MCP plus OpenAPI exposure** of the model with OAuth, application keys for development, per-asset rate limits (Celonis: 500 a minute), and a "write decision back" tool. Add the per-tool permission scoping Celonis does not document. Source: https://developer.celonis.com/mcp-server-asset/overview/
9. **The agent is a loop over a bounded tool set inside a case;** the engine owns retries, incidents and human routing, and memory is scoped to the case. Source: https://docs.camunda.io/docs/8.8/components/agentic-orchestration/ai-agents
10. **Decision tables for policy,** kept outside prompts. Source: https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions
11. **Live case supervision:** pause, resume and retry an instance. Source: same.
12. **Metering per run and per LLM call by model tier,** with input billed in fixed increments and a flat per-run rate for bring-your-own model. Do not bill tests or previews. Guardrail "judge" calls are separately visible. Source: https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md
13. **An agent inventory with cost and ROI per agent** (Measure) and a private registry of approved MCP servers. Source: https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and; ServiceNow newsroom release.
14. **Named error-handler semantics** (rollback, resume, commit, ignore) and "queue, don't drop" when budget is exhausted. Source: https://www.make.com/en/pricing
15. **Outcome pricing per completed case** as a later option. Source: https://www.techtarget.com/enterprise-software/news/366643870/Pegasystems-refines-Blueprint-agent-builder-expands-marketing-tools
16. **A published entry price with clear caps** (IBM Essentials US$578 a month; n8n execution caps). Source: https://www.ibm.com/products/watsonx-orchestrate/pricing; https://n8n.io/pricing
17. **Value attribution recorded for audit** (Celonis Transformation Hub): store the cash collected per reminder sequence. Source: https://www.celonis.com/news/article/finally-enterprise-ai-gets-the-context-it-needs-to-succeed-celonis-next-2026

## What cannot or should not be copied

- **Celonis's SAP extraction and transformation project:** it needs SAP Basis access and analysts, the cost the target customer cannot pay, and it carries the SAP legal risk.
- **Two generations of a semantic layer** (Celonis legacy Views versus new): pick one schema format early.
- **Proprietary languages** (PQL, Pega rules): use SQL and tables.
- **RPA UI robots:** not needed for API-based accounting systems.
- **Acquisition-built breadth** (ServiceNow, Celonis buying OE, Ikigai and others).
- **Opaque scoring** (the Celonis collections priority is undocumented): the founder's customers must be able to see why a customer was chased.
- **Hard-stopping agents mid-conversation** on credit exhaustion (Copilot Studio): unacceptable for customer-facing messages.
- **Unpublished enterprise pricing** (Celonis, Workato): incompatible with self-serve mid-market sales [Inference].

## Comparison table

| Company | Core model of the business | Rules | Orchestration / cases | Agent interface | Governance | Pricing (published?) | Fit for 100 to 1,000 staff |
|---|---|---|---|---|---|---|---|
| Celonis | Object-centric event log + Knowledge Model + Context Model | PQL filters, triggers | Orchestration Engine (GA) | MCP Agent Tools (private preview), PI API | 12-month action audit, transactions | No | Poor (SAP-heavy setup) |
| UiPath | Robots + Data Fabric | DMN in Maestro | Maestro Case, Flow, BPMN | MCP Server, Agent Builder | Orchestrator, Enterprise audit, judge guardrail | Partly (PU rates) | Weak |
| ServiceNow | Platform tables, CMDB, Context Engine | Workflow rules | Workflows, AI Specialists | Action Fabric (MCP), MCP Registry | AI Control Tower | No | Weak |
| Automation Anywhere | Bots | [Unverified] | [Unverified] | AI Agent Studio [Unverified] | Control Room [Unverified] | No | Weak |
| Pega | Case types + rules | Rules engine, decisioning | Case management, Blueprint | MCP (Q3 2026) | Rule versioning | No; moving per-case | Poor |
| Appian | Data fabric metadata model | Rules | Process + case | MCP (announced) | Row-level security [Unverified] | No | Poor |
| Camunda | BPMN process instances | DMN | BPMN, ad-hoc sub-process | AI Agent connector, MCP client | Operate incidents | Not read | Fair for engineering teams |
| IBM watsonx Orchestrate | Agent and tool catalogue | Flows | Agent orchestration | Catalogue, channels | Control plane, evaluation | Yes (US$578 to 6,360 a month) | Fair |
| Workato | Recipes over connectors | Recipe logic | Recipes | MCP editions | Add-on governance | No (task-based) | Fair at the top end |
| Zapier | Zaps | Filters, Paths | None | Zapier MCP | Roles, SSO, logs | Yes | Good, but no domain |
| n8n | Workflows | Nodes | None | AI agent nodes, MCP | Environments, Git, SSO (Business) | Yes (per execution) | Good, but technical |
| Make | Scenarios | Routers | None | AI agents | Not shown | Partly (credits) | Good, but no domain |
| Tines | Workflows | Workflow logic | None | Agents, Workbench | "Govern AI building" | Free tier only | Fair |
| MS Copilot Studio / Power Automate | Dataverse + M365 graph | Flows | Agent flows | Agents, MCP | Power Platform admin | Yes (credit rate card) | Good reach, no AR model |

## Open questions and unverified items

- Celonis revenue, contract sizes, deployment time to live, the exact AR object and event type names, the collections priority formula, per-tool permissions for Agent Tools, and the status of the SAP litigation after July 2025 (search titles suggest the claims later partly survived a motion to dismiss).
- The Ikigai Labs press release could not be opened (budget).
- UiPath: the money value of a Platform Unit, customer counts, AI Trust Layer details, Action Center, agentic testing specifics.
- ServiceNow revenue and AI pricing changes; Moveworks integration details.
- Automation Anywhere: the product page failed to load, so everything there is [Unverified].
- Pega and Appian revenue; Workato Genies; Make plan prices; Tines paid prices; Copilot Studio credit pack prices.

## Sources (ranked by usefulness)

1. https://docs.celonis.com/en/accounts-receivable-capabilities.html: the exact AR functions and KPIs (read Nov 2026).
2. https://docs.celonis.com/en/knowledge-models: the semantic-layer entity types.
3. https://docs.celonis.com/en/the-object-centric-data-model.html: the object, event and relationship model.
4. https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md: the most precise agent metering in the market.
5. https://docs.camunda.io/docs/8.8/components/agentic-orchestration/ai-agents: the cleanest bounded-agent design.
6. https://docs.celonis.com/en/getting-started-with-the-collections-execution-app.html: collector views and setup burden.
7. https://docs.celonis.com/en/action-flows-terms-and-limitations.html: action limits and audit retention.
8. https://docs.celonis.com/en/sap-action-flows.html: transactional write-back.
9. https://docs.celonis.com/en/accounts-receivable-cash-app.html: cash application specification.
10. https://www.celonis.com/news/article/finally-enterprise-ai-gets-the-context-it-needs-to-succeed-celonis-next-2026: Context Model, May 2026.
11. https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions: Case, Flow, BPMN and DMN on one engine.
12. https://newsroom.servicenow.com/press-releases/details/2026/ServiceNow-launches-the-real-time-data-foundation-that-puts-autonomous-AI-to-work-across-the-enterprise/default.aspx: data layer and MCP Registry, May 2026.
13. https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and: AI Control Tower and Action Fabric.
14. https://developer.celonis.com/mcp-server-asset/overview/: MCP authentication and rate limits.
15. https://docs.celonis.com/en/agent-tools--formerly-mcp-server-asset-.html: agent tools status.
16. https://investingnews.com/uipath-reports-second-quarter-fiscal-2027-financial-results: UiPath financials, 3 Sep 2026.
17. https://docs.uipath.com/automation-cloud/automation-cloud/latest/admin-guide/unified-pricing-licensing-plan-framework: UiPath plans.
18. https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management: Copilot Studio rate card, 31 Oct 2026.
19. https://www.ibm.com/products/watsonx-orchestrate/pricing: published agent-platform pricing.
20. https://www.techtarget.com/enterprise-software/news/366643870/Pegasystems-refines-Blueprint-agent-builder-expands-marketing-tools: Pega Blueprint and per-case pricing, 8 Jun 2026.
21. https://www.celonis.com/news/press/celonis-unveils-platform-innovations-to-power-the-ai-driven-composable-enterprise: Celosphere 2025 product list.
22. https://www.celonis.com/blog/celonis-next-2025-product-showcase: Celonis:Next 2025 product list.
23. https://docs.celonis.com/en/process-intelligence-graph.html: PI Graph layers and build steps.
24. https://aws.amazon.com/solutions/case-studies/celonis-agentcore-case-study: an agent working through the Celonis MCP server.
25. https://www.processexcellencenetwork.com/process-mining/news/us-court-dismisses-celonis-antitrust-claims-against-sap/amp: the SAP dispute, Jul 2025.
26. https://n8n.io/pricing: per-execution pricing and limits.
27. https://www.make.com/en/pricing: credits and error-handler semantics.
28. https://zapier.com/blog/zapier-pricing/: Zapier plans, Jun 2026.
29. https://zapier.com/blog/workato-pricing: Workato's billing model (competitor-written), Nov 2026.
30. https://www.aap.com.au/aapreleases/cision20260512ae54260/: Appian, May 2026.
31. https://www.tines.com/pricing: Tines tiers.
32. https://www.celonis.com/company/about-us?active-tab=tab-0: Celonis company facts.
33. https://www.celonis.com/de/news/press/celonis-customers-drive-tangible-business-outcomes-with-enterprise-ai-powered-by-process-intelligence: customer value claims, Nov 2025.
34. https://docs.celonis.com/en/accounts-receivable-starter-kit---object-centric.html: AR starter kit components.
35. https://developer.celonis.com/process-intelligence-apis/intelligence-api/glossary: KM glossary.

