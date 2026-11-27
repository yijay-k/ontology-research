# Palantir's application layer and infrastructure, bolt by bolt

Scope note (written 21 November 2026): this file covers three things. Part A is the applications that sit on the Palantir Ontology: Workshop, Slate, Quiver, Contour, Object Explorer, Object Views, Vertex, Map, Notepad, Carbon, Automate, Foundry Rules, Machinery, Solution Designer/AIP Architect, Pilot, custom widgets, Marketplace/Foundry DevOps, OSDK and Developer Console. Part B is infrastructure and delivery: Apollo, Rubix, Palantir's open-source microservice stack, enrollment and tenancy, deployment, upgrades, observability, and Gotham vs Foundry. Part C is technical onboarding. Primary sources are the palantir.com/docs pages, Palantir PDFs, and four Palantir repositories cloned and read locally: conjure, witchcraft-go-server, atlasdb and sls-packaging, plus osdk-ts and tritium, which other agents had already cloned. Nothing was executed.

Two limits on coverage. First, my web-search quota (200 per turn, shared) and then the fetch quota (800 per hour, shared) ran out partway through. Some sub-pages I meant to read are listed under Open questions. Second, many "overview" docs pages are thin, so where only an overview was readable I say so. Labels: [Fact] means stated on the cited page or in the cited code. [Vendor claim] means a Palantir marketing or performance statement. [Inference] is my own reasoning. [Unverified] means I could not find or open a source.

---

## Key findings

1. **Every application reads through one object layer and writes through one door, Actions.** Workshop takes all of its data from the Object Data Layer. Writeback goes through Actions, logic through Functions, and runtime values through derived properties ([Fact](https://www.palantir.com/docs/foundry/workshop/overview/)). The Action definition auto-generates the form and carries its own validation ("submission criteria") and per-action permissions ([Fact](https://www.palantir.com/docs/foundry/workshop/actions-use/)). For the founder, the agent-facing tool layer and the human UI should share one Action registry.
2. **Workshop is a small reactive runtime with three parts: typed variables, ordered events and widgets.** Variables are typed (object set, object-set filter, primitives, struct, time series, and so on). Each is defined as static, function, aggregation, object property, object-set definition, transformation or SQL ([Fact](https://www.palantir.com/docs/foundry/workshop/concepts-variables/)). Events run in sequence but do not wait for downstream recomputation, and Palantir documents this as a known limitation ([Fact](https://www.palantir.com/docs/foundry/workshop/concepts-events/)). Variables load lazily and cache function results until their inputs change ([Fact](https://www.palantir.com/docs/foundry/workshop/functions-use/)).
3. **"Scenarios" are copy-on-write forks of the ontology.** A scenario is an immutable overlay created by applying Actions and running Models, and it stores only the deltas. Limits: 30,000 edits, 50 Actions, and 10,000 objects loaded per object set ([Fact](https://www.palantir.com/docs/foundry/workshop/scenarios-concepts/)). This is the documented pattern for "what-if" runs and agent dry runs, though Palantir now labels it Legacy.
4. **Foundry Rules is not a separate engine.** A rule is an ontology object whose logic is a compressed JSON blob following a grammar. Changes go through "Proposal" objects that work like pull requests, with old/new diffs and approve/reject Actions guarded by validation rules. A generated transform pipeline executes the rules into output datasets ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/object-model/), [Fact](https://www.palantir.com/docs/foundry/foundry-rules/rule-logic/), [Fact](https://www.palantir.com/docs/foundry/foundry-rules/customize-foundry-rules-pipeline/)). The governance layer is built from the platform's own primitives.
5. **Automate is the trigger engine and it has hard numbers.** Conditions are time, object-set change or dataset. Effects are Action, Function, AIP Logic or notification, plus fallback effects. Limits: 10,000 objects per real-time evaluation, a 45-minute maximum queue wait, a 4-hour maximum run, batches of up to 1,000, and 100,000 objects for scheduled added/removed conditions ([Fact](https://www.palantir.com/docs/foundry/automate/limits/)).
6. **Token scope is an intersection of three sets: user permissions, application restrictions and the requested operation scope.** A restricted application must list every object type, action, function and API namespace it may touch. Requesting a token with no scope at all produces a token with no permissions ([Fact](https://palantir.com/docs/foundry/developer-console/application-restrictions/)). Ontology MCP reuses exactly this OAuth client, with no separate authentication ([Fact](https://palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/)). This is the model to copy for agent credentials.
7. **OSDK permission enforcement happens at read time and does not follow the data out.** Restricted views and object/property security policies filter what is returned. What the app does with the payload afterwards is not governed, unless markings or classification-based access control (CBAC) apply ([Fact](https://www.palantir.com/docs/foundry/ontology-sdk/overview/)).
8. **Marketplace packages use cases as "products": content plus auto-detected inputs, installed many times with input mapping.** The combined cap is 15,000 inputs plus outputs. Installation modes are Production, Singleton and Bootstrap. Installs take name prefixes and suffixes per environment, and each installation can follow its own release channel and upgrade window ([Fact](https://www.palantir.com/docs/foundry/foundry-devops/create-products), [Fact](https://palantir.com/docs/foundry/devops/core-concepts/)). This is the mechanism by which a vertical template is redeployed to many customers.
9. **Apollo has no pinned target version.** An entity is defined as Product plus Release Channel. A central orchestration engine continuously proposes Plans, and each Plan must pass constraints: maintenance window, product dependency version ranges, suppression windows and artifact availability. Agents in each environment pull Plans, execute them and report back. A failed Plan triggers auto-suppression and a rollback ([Fact](https://www.palantir.com/docs/apollo/core/plans-and-constraints), [Fact](https://palantir.com/docs/apollo/core/how-apollo-works/)).
10. **Dependency ranges are declared at build time in the artifact manifest.** sls-packaging writes `product-dependencies` with minimum, maximum and recommended versions into `deployment/manifest.yml`, plus a checked-in lock file. Apollo blocks any upgrade that would break a dependent ([Fact, code](https://github.com/palantir/sls-packaging), [Fact](https://www.palantir.com/docs/apollo/core/plans-and-constraints)).
11. **Tenancy has three levels: enrollment, organization and space.** An enrollment is one instance of the platform. An organization is a mandatory access-control silo, and each user has exactly one home organization plus guest memberships. A space holds projects and exactly one ontology. B2B can be done with a private space per customer or with shared spaces plus restricted views. B2C uses one organization with discoverability off and row-level restricted views keyed on user ID ([Fact](https://www.palantir.com/docs/foundry/security/orgs-and-spaces), [Fact](https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/)).
12. **Rubix is Palantir's hardened Kubernetes.** Nodes never live longer than 48 hours. Every service runs multi-node with blue/green rollout. Every workload-to-workload call is authenticated, authorized and logged ([Fact](https://palantir.com/docs/foundry/architecture-center/rubix/)). For a small product, Rubix itself cannot be copied, but "immutable, short-lived nodes" can, using a managed Kubernetes service.
13. **Observability is per Action, Function and agent:** execution history kept for 7 days, metrics with P95 latency kept for 30 days, and distributed traces through functions, actions and LLM calls, all keyed to a "source executor". Monitoring views attach Low/Medium/High rules to Action types, Functions, Automations and Agents ([Fact](https://palantir.com/docs/foundry/observability/overview/), [Fact](https://palantir.com/docs/foundry/monitoring-views/overview/)).
14. **Gotham now sits on the Foundry Ontology.** Gotham types can be derived from Foundry object types through "type mapping". Gotham then queries Foundry objects through the Object Set Service, and markings carry over ([Fact](https://www.palantir.com/docs/foundry/architecture-center/platforms/), [Fact](https://palantir.com/docs/jp/foundry/object-link-types/enable-gotham-integration/)).
15. **Onboarding is use-case-first and fast by design.** The "Speedrun" course builds one pipeline, one object type, one Action and one Workshop app ([Fact](https://learn.palantir.com/speedrun-your-first-e2e-workflow)). Palantir pitches AIP Bootcamps as "zero to use case in one to five days" ([Vendor claim](https://www.hannovermesse.de/apollo/hannover_messe_2024/obs/Binary/A1354173/Palantir%20AIP%20Bootcamp.pdf)). Palantir's own docs give the build order as data asset, then ontology plus first interfaces, then enrichment and models ([Fact](https://palantir.com/docs/foundry/use-case-life-cycle/sequencing-development/)). I found no published figure for typical first ontology size.

---

## Breakdown

### Part A: applications on the Ontology

#### A1. Workshop (low-code operational app builder)

**Plain English.** Workshop is a drag-and-drop builder for apps such as a triage inbox. For example, a table lists "Open Tickets" (an object set). Clicking a row sets a variable `selectedTicket`. A side panel shows that ticket's properties, and an "Assign" button runs the `assign-ticket` Action with `ticket = selectedTicket` pre-filled.

**Principles.**
- All data comes from the Object Data Layer. Writes go through Actions and logic through Functions. "Derived properties" are computed at runtime from links and aggregations ([Fact](https://www.palantir.com/docs/foundry/workshop/overview/)).
- The platform summary counts 60+ widgets across display, visualization, filtering, navigation and embedding ([Fact](https://www.palantir.com/docs/foundry/getting-started/foundry-platform-summary-llm/)).
- The widget catalogue includes: Object Table, Object List, Object View, Property List, XY/Vega/Pie/Gantt charts, Map, Metric Card, Pivot Table, Timeline, PDF Viewer, Image Annotation, Filter List, Object Dropdown, Date picker, Button Group, Inline Action, Comments, Stepper, AIP Analyst, AIP Chatbot, AIP Generated Content, Observability Chart, Iframe and the Scenario widgets ([Fact](https://www.palantir.com/docs/foundry/workshop/overview/)).

**Variables (the data model of an app).** [Fact](https://www.palantir.com/docs/foundry/workshop/concepts-variables/)
- **Types:** Array, Boolean, Date, GeoPoint, GeoShape, Numeric, Object set, Object-set filter, String, Struct, Timestamp, Time-series set.
  - A Struct is function-initialized only and cannot be nested.
  - An Object set is initialized from an object type, an *interface*, or another object-set variable.
- **Definition kinds:** Static, Function, Object-set aggregation, Object property, Object-set definition, Variable transformation, SQL query.
- **Object-set definitions can:**
  - filter by property or by a filter variable;
  - pivot along links ("Search Around");
  - pivot via shared property types;
  - be derived from another object-set variable while keeping the reference.
- **Naming:** names are unique per module and case-insensitive. Each variable has an *external ID* used by the module interface, routing (URL) and state saving.
- **Loading:** values are computed lazily, only when a visible widget or a required downstream variable needs them. A lineage graph shows variable and widget dependencies and the last computation time.

**Recompute semantics.** [Fact](https://www.palantir.com/docs/foundry/workshop/variable-recompute/)
- **Modes:** Automatic (the default), Only on event, or On load plus event.
- **Mode support:** Function, aggregation, object-property, transformation, filter and SQL variables support all modes. Object-set definitions do not; they always follow their inputs.
- **After an Action:** an Action submission or a data refresh triggers recompute of Automatic variables.
- **Known pitfalls:**
  - A recompute overwrites values that a user or a Set-variable event wrote.
  - Events placed after a Recompute event may see stale or loading values.
- Function results are cached when inputs are unchanged ([Fact](https://www.palantir.com/docs/foundry/workshop/functions-use/)).
- Function-backed columns compute only for the rows currently displayed ([Fact](https://www.palantir.com/docs/foundry/getting-started/foundry-platform-summary-llm/)).

**Events.** [Fact](https://www.palantir.com/docs/foundry/workshop/concepts-events/)
- Events are triggered by widget interactions such as a button, row selection, dropdown or tab. They execute sequentially in their configured order, and Workshop cannot force an event to wait for downstream updates.
- **Event families:**
  - open or close an overlay (drawer, modal);
  - switch page or tab, expand or collapse a section;
  - Reset, Recompute or Set variable value;
  - **Stream LLM response into variable** (prompt variable or function; temperature 0–1; update delay in ms; model list GPT-3/4/4-32K on that page);
  - Send to AIP Assist (with an optional default agent);
  - open another Workshop module (maps variables onto the target's module interface), or open Quiver, Object View, Object Explorer, Notepad or Vertex;
  - Refresh data; toggle auto-refresh; toggle the theme.

**Actions in Workshop.** [Fact](https://www.palantir.com/docs/foundry/workshop/actions-use/)
- **Surfaces:** Actions appear through Button Group, Inline Action, or the legacy Media Uploader.
- **Forms:** the form is generated from the Action type. Each parameter can be bound to a variable (for example, the table's active object) and set to visible, hidden or disabled.
- **Validation:** submission criteria, such as a regex `^[A-Z]{3}$` with a custom message, are evaluated in the form. Submit appears only when all criteria pass.
- **Hooks:** "On start of Action submission" and "On successful completion". No failure hook is documented.
- **Permissions:** editing Action types requires the `actions-admins` group. Executing one is governed per Action.
- **Multi-file upload:** the Action runs once per file.

**Module interface and composition.** [Fact](https://www.palantir.com/docs/foundry/workshop/module-interface/)
- Variables marked "module interface" (they need an external ID) form a module's input/output API, used when it is embedded, opened from another module, or loaded from a URL (`?externalId=value`).
- URL parameters are read only on first load.
- In an embedded child, the parent's variable definition overrides the child's.
- `/latest/` serves the published version and `/dev/` the last saved one.

**Versioning.** [Fact](https://www.palantir.com/docs/foundry/workshop/versions/)
- Save and publish are separate steps, though "auto-publish on save" can be switched on.
- Versions are timestamped entries with an editor and optional description; the page shows no numbers.
- Revert creates a new head version.
- A Changelog panel shows JSON diffs between versions.
- Modules can be branched, rebased onto `main` with conflict detection per widget, and merged.

**Scenarios (labelled Legacy).** [Fact](https://www.palantir.com/docs/foundry/workshop/scenarios-concepts/)
- **What a scenario is:** a fork of ontology data produced by applying a set of Actions and evaluating a set of Models. It stores only deltas: modified properties, created or deleted objects, and created or deleted links.
- **Immutability:** a scenario is immutable once created. To change it, create a new one or duplicate it.
- **Models:** a Model is a function that estimates property values. It is used by wrapping it in a function-backed Action.
- **Domains:** a Model runs over a Domain (a set of objects). Results must be independent of the subset evaluated.
- **Limits:** 30,000 ontology edits, 50 Actions, 10,000 objects loaded per object set, and no attachment properties.
- The page does not say why scenarios are Legacy or what replaces them [Unverified].

**Embedded AIP.**
- **AIP Generated Content widget** ([Fact](https://www.palantir.com/docs/foundry/workshop/widgets-aip-generated-content/)):
  - modes: an AIP Logic function, "Direct to LLM" with a prompt from a string variable, or a prompt from a function;
  - output: a string or object-set variable;
  - the page lists only older OpenAI models, so it appears stale [Inference].
- **Other AIP widgets:** AIP Chatbot and AIP Analyst exist ([Fact](https://www.palantir.com/docs/foundry/workshop/overview/)).

**Custom widgets.** Read from source in `osdk-ts/packages/widget.api`, last commit 20 Nov 2026.
- **Manifest:** a widget declares a `WidgetConfig` with `id`, `name` and `type: "workshop"`.
- **Parameters:** typed `parameters`, which may be primitives, arrays, `objectSet` with an `allowedType`, or `mapTileLayer`.
- **Events:** named `events`, each listing the `parameterUpdateIds` it updates.
- **Other config fields:** an optional `refreshHostDataOnAction` flag, and an allow-list of browser `permissions` (camera, microphone, autoplay, and the iframe sandbox flags allow-downloads/forms/modals/popups).
- **Messages:**
  - host to widget: `SetTheme`, `SetHotkeys`, `UpdateParameters`;
  - widget to host: `Ready`, `Reload`, `Resize`, `Hotkey`, `EmitEvent`.
  ([Fact, code](https://github.com/palantir/osdk-ts))
- **Status:** custom widgets were announced 21 Aug 2025 with GA "in the coming weeks" ([Fact](https://palantir.com/docs/foundry/announcements/2025-08/)). Pilot can generate them and publish versioned widget sets to a "Widget Registry" ([Fact](https://palantir.com/docs/foundry/pilot/overview/)).

**What a small product needs as an equivalent [Inference].**
- **Typed variables and events:** a JSON app spec of typed variables (object-set queries, aggregations, function calls), widgets bound to variables, and ordered event lists.
- **Forms from Actions:** Action forms generated from Action parameter schemas, with defaults bound to variables.
- **Composition:** a module interface (named inputs and outputs) so screens can embed and link to each other.
- **Versioning:** save-vs-publish versioning with JSON diffs.
- **Extension point:** an iframe postMessage protocol modelled on the widget.api messages above.

#### A2. Slate (code-first app builder)

- **What it is:** an HTML/CSS/JS builder with drag-and-drop layout. It supports public apps reachable without a Foundry account, behind validation logic ([Fact](https://www.palantir.com/docs/foundry/slate/overview/)).
- **Query sources** ([Fact](https://www.palantir.com/docs/foundry/slate/concepts-queries/)):
  - API Gateway, i.e. any Foundry API;
  - Foundry (legacy), i.e. SQL on datasets synced to Postgres;
  - external SQL;
  - HTTP JSON (GET/POST/PUT/DELETE).
- **Templating** is Handlebars with security helpers:
  - SQL must use `schema`, `table`, `column`, `alias` and `param` (which emits `?` for prepared statements);
  - HTTP templates must be wrapped in `jsonStringify`, and `..` is forbidden in paths.
- **Execution control:** queries can be gated on "all dependencies not null" or on a custom true condition.
- **Results limit:** results are capped at 5,000,000 bytes, and oversized results fail rather than truncate.
- **Ontology access** is through the OSDK, the object-set panel or the object-context panel.
- **Effort comparison:** Palantir's own docs estimate that the same chart-and-form need costs roughly a tenth of the front-end investment in Workshop as in Slate ([Fact](https://www.palantir.com/docs/foundry/use-case-life-cycle/overview/)).
- **Lesson [Inference]:** if templated queries are ever offered, copy the "helpers only, prepared statements" rule. Better still, offer only ontology queries.

#### A3. Quiver (analysis of objects and time series)

- **What it does:** point-and-click analysis over objects and time series. It has a Canvas mode and a Graph mode (a dependency graph of cards), and a formula language ([Fact](https://www.palantir.com/docs/foundry/quiver/overview/)).
- **Card types:** Object, Time series, Event set, Dataset, Chart, Table, Numeric, String, Date/Time, Boolean, Array, Writeback and Display.
- **Linked objects:** object sets are built by filtering and Search Around, so the user never does joins.
- **Dashboards** embed into Workshop, Notepad, Object View and Carbon.
- **Writeback:** analytical decisions can be written back through an Action.
- No limits are documented on the overview page.
- **Small-product equivalent [Inference]:** a notebook-like "analysis graph", where each card is a typed node over an object set, and the result can be saved as a dashboard or turned into an Action.

#### A4. Contour (analysis of datasets, not objects)

- **What it does:** point-and-click analytical "paths" over datasets. Results can be saved as a new dataset, and analyses can be parameterized into dashboards ([Fact](https://www.palantir.com/docs/foundry/contour/overview/)).
- **When Palantir says to use it:** for data not mapped into the Ontology, such as one-off uploads. Palantir says it suits large workloads such as joins over 100k+ objects or aggregations over 50k+ rows.
- **Small-product equivalent [Inference]:** none needed at first. Point users at a SQL console over the warehouse.

#### A5. Object Explorer

- **What it does:** keyword and multi-property search across object types. It offers exploration presets (charts, maps), compare-object-sets, bulk Actions over a whole object set, export, and saved explorations that re-run live ([Fact](https://www.palantir.com/docs/foundry/object-explorer/overview/)).
- **Bulk Action cap:** Automate allows up to 5,000,000 objects for manual execution ([Fact](https://www.palantir.com/docs/foundry/automate/limits/)). The cap for Object Explorer bulk Actions themselves is [Unverified].
- **Small-product equivalent [Inference]:** a generic search UI generated from the object schema. This is also the obvious "read" tool for agents.

#### A6. Object Views

- **Two kinds** ([Fact](https://www.palantir.com/docs/foundry/object-views/overview/)):
  - *Standard* views are auto-generated from the object type's configuration.
  - *Configured* views are built in Workshop. Once one exists it becomes the default, and users can switch back to the standard view.
- **Two form factors:** Full (everything about the object) and Panel (a compact view embedded in other apps).
- **Further features** listed in the sidebar but not read: tabs, version management and branching.
- **Small-product equivalent [Inference]:** an auto-generated object page (properties, linked objects, Action buttons) with an optional custom layout.

#### A7. Vertex (graphs, cause and effect, simulation)

- **What it does:** explore curated system graphs of linked objects, monitor events and time series on them, and simulate scenarios ([Fact](https://www.palantir.com/docs/foundry/vertex/overview/)). The scenario sub-feature "chained models" is marked sunset.
- **Recent change:** Search Around V2 went GA in Vertex on 10 Nov 2026, and saved searches can ship in Marketplace products ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-11)).
- Internals were not read [Unverified].

#### A8. Map

- **What it does:** geospatial exploration of objects. It supports bounding-box and polygon search, high-scale vector layers, imagery, movement tracks, drawn shapes and geospatial Actions, and has a Workshop widget ([Fact](https://www.palantir.com/docs/foundry/map/overview/)).
- **Projections:** rendering is in Web Mercator (EPSG:3857), and inputs are expected in WGS 84 (EPSG:4326).
- **Relevance [Inference]:** low for a 100–1,000-staff target unless the customer has a field workforce.

#### A9. Notepad

- **What it does:** a rich-text editor aware of objects. It embeds Contour, Quiver, Code Workbook and Object Explorer content, and keeps structured links to the objects it references ([Fact](https://www.palantir.com/docs/foundry/notepad/overview/)).
- **Templates** generate new documents from selected objects, for example monthly reports.
- **Freezing** captures point-in-time content.
- **Not suited to dashboards,** because it has no dynamic filtering.
- **Small-product equivalent [Inference]:** this is the natural target for "agent writes a report". Store reports as documents that link to object IDs, with a snapshot of the values used. That gives auditability.

#### A10. Carbon (curated workspaces)

- **What it is:** a workspace bundles a custom landing page with a set of modules (Workshop, Quiver and others) for one user group. It can hide the rest of the platform and restrict navigation, and is configured by an admin, including through YAML ([Fact](https://www.palantir.com/docs/foundry/carbon/overview/)).
- **Parameter passing:** Workshop modules opened as Carbon tabs take parameters prefixed `variable.` ([Fact](https://www.palantir.com/docs/foundry/workshop/module-interface/)).
- **Small-product equivalent [Inference]:** role-based home pages, i.e. "the sales desk sees these 4 apps and this agent".

#### A11. Automate (triggers to effects)

- **Conditions:** time, object data, time plus object data, or dataset. They are evaluated continuously (streaming or real-time) or on a schedule ([Fact](https://www.palantir.com/docs/foundry/automate/overview/)).
- **Effects:** Foundry Action, AIP Logic, Function, or platform/email notification with attachments, plus fallback effects.
- **Other features:** branching on Global Branching was added 9 Jul 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-07)). Automate replaces "Object Monitoring".
- **Design guidance Palantir gives:** document each effect's purpose, data scope, *execution identity* and impact. Stage consequential writes for human review, and include a recovery path ([Fact](https://www.palantir.com/docs/foundry/automate/overview/)).
- **Limits** ([Fact](https://www.palantir.com/docs/foundry/automate/limits/)):

| Limit | Value |
|---|---|
| Objects added/removed (scheduled) input | 100,000 |
| "Run on all objects" (scheduled) | 1,000,000 |
| Objects per evaluation, real-time | 10,000 (excess dropped or error) |
| Objects per evaluation, scheduled per-object | 10,000 (excess = runtime error, nothing runs) |
| Manual execution object set | 5,000,000 |
| Batch size | 1,000 |
| Static recipients | 10,000 |
| Scenarios tracked | 100 |
| Max queue wait | 45 min (then dropped) |
| Max run time | 4 h (finished effects kept) |

- Automatic pausing on "excessive activity" exists, but no threshold is given.
- **Effect execution:** Retries, execution settings and per-object vs batch settings exist as sub-pages I could not read [Unverified].
- **Small-product equivalent [Inference]:**
  - an event bus fed by ontology edits, a scheduler, and an effects worker;
  - each automation has an owner identity, a batch size, a queue timeout, a run timeout, a fallback effect, and an auto-pause on runaway;
  - this is how "agents that act unprompted" should be built.

#### A12. Foundry Rules (formerly Taurus): the business-rules product

**Plain English.** An analyst writes a rule in a form: "transactions over 10,000 MYR to a new beneficiary in under 24h → alert, severity High". It does not go live until the rule owner approves the proposal. A nightly pipeline then runs all live rules and writes the matching rows to an alerts dataset, which becomes Alert objects.

**Mechanics.**
- **Rule = object.**
  - Properties: name, description, author, rule type, workflow-specific *custom properties* (for example `alert_severity`, `alert_assignee`, `priority`), and a *logic* property.
  - The logic is stored as a compressed JSON blob following a grammar ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/object-model/)).
- **Proposal = object.**
  - Contents: rule ID, author, timestamp, status (open, approved or rejected), reviewer, and a diff (`old_rule_name`/`new_rule_name`, `old_logic`/`new_logic`).
  - A rule can have several open proposals at once.
  - Proposals are optional, and the approval flow is customizable because it is plain objects plus Actions.
- **Permissions as Action validation** ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/rule-permissions/)):
  - an edit or delete proposal can be approved only by the rule author or a superuser;
  - a proposal can be rejected by the rule author, the proposal author or a superuser.
  - All of this is configured as submission criteria on the approve and reject Actions.
- **Logic structure:** inputs, then a chain of logic blocks, then an output ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/rule-logic/)).
  - Each block takes the previous rows and emits new rows. Each block has a Preview.
  - Block types: filter, expression, aggregate, join. The workflow owner can switch types on or off for end users.
  - Inputs are datasets or object types, as allowed by the workflow owner.
    - Not supported: multi-datasource objects, multi-materialization objects, and edit-only properties.
    - Objects behind restricted views must be swapped for an alternate backing dataset.
  - Each rule output maps to a configured output dataset with enforced columns and types, and many rules write into the same output.
- **Authoring UI:** a Workshop app with a Rule Editor and a Proposal Reviewer. A "workflow configuration editor" defines the allowed inputs, outputs and features ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/core-concepts/)).
- **Execution:** by default, a Palantir-managed transform runs all the rules. Advanced users can enable "self-managed transforms" ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/customize-foundry-rules-pipeline/)). That generates code into a `FoundryRulesTransform` file in a repository, which enables subset scheduling, pre-processing and incremental runs. Streaming workflows cannot use custom pipelines.
- **Packaging:** rules ship through Marketplace ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/overview/)).
- **Time-series rules** are marked [Sunset].
- **Small-product equivalent [Inference]:**
  - a `Rule` table (metadata, custom properties, JSON AST logic) and a `RuleProposal` table (old/new AST diff, status, reviewer);
  - approve and reject as Actions with validation;
  - an executor that compiles the AST to SQL over the warehouse, on a schedule or on events;
  - output rows land in an `Alert` object type.
  - Agents could draft proposals but never approve them.

#### A13. Machinery (process mining)

- **Processes and states** ([Fact](https://www.palantir.com/docs/foundry/process-mining/core-concepts/)):
  - A process is a container of states and actions, and processes can nest.
  - The process object type needs a string *state* property with enumerable values. Backing it with an enum value type keeps it in sync.
  - Each object is in exactly one state at a time; multiple dimensions mean sub-processes.
- **Transitions:** ontology Actions cause state transitions. Actions are imported into the graph and given roles.
- **Log:** Machinery maintains a `Log` object type that records every change to one tracked property, whether made by Actions or by external data. For off-platform processes, a changelog dataset can be supplied instead.
- **Derived values:** previous state, time between states, and path taken.
- **Not read:** mining algorithms and limits [Unverified].
- **Small-product equivalent [Inference]:** keep an append-only state-transition log per object type from day one. It is cheap and it powers SLA metrics.

#### A14. Solution Designer and AIP Architect

- **Solution Designer** is an architecture-diagram tool whose nodes link to platform resources. It has a reference-architecture library and an "AIP Critic" that reviews diagrams, and it exports PDF, image or JSON ([Fact](https://palantir.com/docs/foundry/solution-designer/overview/)). The page does not say it generates resources.
- **AIP Architect** ([Fact](https://palantir.com/docs/foundry/solution-designer/aip-architect/)):
  - **Wizard inputs:** end artifact, workflow requirements (free text), data source type, data properties (frequency, scale, geo, time series, media), and build preference (no-, low- or pro-code).
  - **Outputs:** a workflow graph of concept nodes, implementation patterns with rationale and trade-offs, an implementation plan, and a step-by-step walkthrough.
  - **Ontology node:** "Generate data model" drafts object types, properties and link types from a prompt.
  - **Models:** the LLM is selectable, and the page recommends GPT-5.
- **Small-product equivalent [Inference]:** an onboarding wizard that drafts the ontology from interviews and documents. Its output should be a proposal, not a live change.

#### A15. Pilot (AI app builder, GA 29 Oct 2026)

- **Status:** GA on 29 Oct 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-10)).
- **What it generates:** ontology entities (reusing existing ones first), React plus OSDK code with live preview, seed data in an isolated container, and deployment and CI configuration ([Fact](https://palantir.com/docs/foundry/pilot/overview/)).
- **Deploy flow:**
  1. Promote ontology changes to main through Global Branching plus proposals.
  2. Create a Developer Console app with application restrictions limited to the needed entities.
  3. Request a subdomain.
  4. CI must pass before tagging.
  5. Users authorize through OAuth.
- **Models:** Claude, GPT or Gemini families, depending on enrollment.
- **Lesson [Inference]:** even Palantir's AI builder must go through branch, proposal, review and a least-privilege app client. Copy that gate.

#### A16. Marketplace and Foundry DevOps (packaging and redeploying use cases)

- **Concepts** ([Fact](https://palantir.com/docs/foundry/devops/core-concepts/)):
  - A *product* is a set of resources. Kinds: Ontology (full or fragment), Use Case (Workshop, functions, Carbon), Pipeline, Modeling.
  - *Content* (outputs) is what gets recreated. *Inputs* must be mapped by the installer.
  - *Installations* are repeatable, for example per team or per environment (DEV/TEST/PROD). Each has its own release channel and upgrade window.
  - *Stores* are local or remote; the Foundry Store is Palantir's own.
- **Building a product** ([Fact](https://www.palantir.com/docs/foundry/foundry-devops/create-products)):
  1. Add the most downstream resources first; DevOps resolves dependencies.
  2. Dependencies surface as inputs. An input can be promoted to an output, except parameters and groups.
  3. Optionally add presets and input API names.
  4. Static data can be packaged, but this needs the download permission.
  5. Cap: **15,000 inputs plus outputs, including nested columns and properties**. A warning shows at 75% and publishing is blocked at 100%.
- **Install modes:**
  - *Production:* central management, auto-upgrade off by default.
  - *Singleton:* production behaviour, one installation per space and ontology.
  - *Bootstrap:* a starting point the installer can customize.
- **Install flow** ([Fact](https://palantir.com/docs/foundry/marketplace/install-product/)):
  1. Review the dependency graph.
  2. Map inputs. Bulk-set, auto-select-from-folder and placeholder dataset inputs help here.
  3. Review outputs.
  4. Validate, then install.
- **Install options:** an installation suffix (DEV/TEST/PROD), and an ontology prefix on object, link and action names (display names only, or API names too). The project can be locked. The installer needs ontology edit rights. Recalled versions cannot be installed.
- **Not supported:** Data Connection sources, Code Workbooks and Fusion sheets ([Fact](https://www.palantir.com/docs/foundry/foundry-devops/supported-resources)).
- **B2B distribution:** build in a dev organization and install into customer organizations. Self-service install needs `marketplace:install-from-local-marketplace` and `marketplace:install-in` ([Fact](https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/)).
- **Recent changes:** DevOps went GA and on by default in September 2025 ([Fact](https://palantir.com/docs/foundry/announcements/2025-08/)). Multi-product installation drafts arrived 14 Jul 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-07)).
- **Small-product equivalent [Inference]:** a "template pack" format (object types, Actions, rules, metric definitions, agent configs, app specs) with declared inputs, for example "map your CRM's customer table here". The installer maps inputs per tenant, and versioned upgrades follow release channels.

#### A17. OSDK and Developer Console (custom apps)

- **OSDK** ([Fact](https://www.palantir.com/docs/foundry/ontology-sdk/overview/)):
  - SDKs for TypeScript (npm, with React bindings), Python (pip/conda) and Java (Maven), plus OpenAPI for other languages.
  - Generated from *only* the entities added to the application.
  - Enforcement is at read time, by restricted views and object/property security policies. Payloads are not governed after delivery.
  - Not branchable under Global Branching ([Fact](https://www.palantir.com/docs/foundry/getting-started/foundry-platform-summary-llm/)). However, Developer Console gained Global Branching support on 15 Oct 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-10)).
  - **The two sources disagree.** The summary page may be stale.
- **Real-time subscriptions** in osdk-ts ([Fact, code](https://github.com/palantir/osdk-ts)):
  - a WebSocket to `/api/v2/ontologySubscriptions/ontologies/{ontologyRid}/streamSubscriptions`, with the token passed as subprotocol `Bearer-<token>`;
  - message types `objectSetChanged`, `refreshObjectSet`, `subscribeResponses` and `subscriptionClosed`;
  - a minimum reconnect delay of 5 s.
- **Developer Console app components** ([Fact](https://www.palantir.com/docs/foundry/developer-console/overview/)): OAuth client, generated SDKs and docs, sharing, long-lived scoped tokens, metrics (volume, success, latency), optional hosting on a subdomain, a linked repository, Marketplace packaging, and an **MCP server** that exposes object types, actions and query functions as tools. The default cap is 1,000 data resources plus restrictions per app.
- **Restrictions model** ([Fact](https://palantir.com/docs/foundry/developer-console/application-restrictions/)):
  - **Effective token** = user (or service-user) permissions ∩ app restrictions ∩ requested scope.
  - **Restricted app** (the default): explicit object types, interfaces, actions and functions (the OSDK tab), plus explicit projects and API namespaces (the platform tab).
  - **Scopes** are operation-only: `api:use-ontologies-read` and `api:use-ontologies-write` by default. There are no implicit grants across namespaces. A few endpoints are exempt (oauth2, me, authz, token, organizations).
  - **Grant types:** client credentials acts as a service user and needs a confidential client. Authorization code acts as the user, and a public client must use user permissions.
  - Switching an app to unrestricted wipes its configured restrictions.
- **Pro-code agents** get scoped OSDK and MCP credentials "out of the box", and published agents are callable from Workshop or the OSDK (9 Jul 2026) ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-07)).
- **SQL functions:** Ontology SQL and SQL functions went GA 12 Nov 2026, usable in Workshop, Actions, Automate and the OSDK ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-11)).

### Part B: infrastructure and delivery

#### B1. Apollo (continuous delivery across many environments)

**Plain English.** Palantir ships hundreds of services into hundreds of customer environments, some with no internet. A central brain is told "environment X runs product Y and follows the STABLE channel; it may upgrade between 01:00 and 04:00; product Y needs auth-service between 1.2 and 1.x". The brain keeps working out safe next steps and hands them to a small agent in each environment, which pulls them, executes them and reports back.

**Architecture** ([Fact](https://www.palantir.com/docs/apollo/core/overview), [Fact](https://palantir.com/docs/apollo/core/how-apollo-works/), [Fact](https://www.palantir.com/assets/xrfr7uokpv1b/2gFvOhbnVSqDVQ0iMZDtLg/bdb6b7a6a02bfa9edd8f4d4716248dfb/Apollo_WP_H1_-25_VX.pdf)):
- **Hub:** runs the Orchestration Engine. Its inputs are:
  - the Product Catalog: releases, channel membership, recall status, dependencies, schema versions;
  - environment settings: installed products, channel subscriptions, windows. Changes to these go through change management with approvals;
  - central observability: the reported state of every entity.
- **Hub variants:** a Main Hub (SaaS), and Remote Hubs inside isolated networks that are synced by an "Apollo bundle". The bundle is the air-gap mechanism.
- **Spoke Control Plane:** runs on Kubernetes, or container-less. Its agents report state (version, config, liveness and readiness, telemetry) and **poll** for Plans. It is a pull model.
- **Release manifest:** metadata only, needing no code changes. The Catalog takes coordinates from CI; code stays in the customer's own artifact store.
- **Plan types:** install, change config, upgrade plus config in lockstep, uninstall, and secret create/edit/delete ([Fact](https://www.palantir.com/docs/apollo/core/plans-and-constraints)).
- **Constraints:**
  - **Maintenance window:** resolved as product, then entity, then environment. A recalled-release roll-off ignores windows by default.
  - **Product dependency:** `minimum-version` and `maximum-version` in the manifest. A Plan runs only if neither the target nor any dependent breaks.
  - **Suppression window:** manual, or automatic on Plan failure or during promotion soak. If too many entities are auto-suppressed, an environment-wide suppression starts.
  - **Artifacts missing:** registries are probed before install or upgrade.
- **Re-planning triggers:** a dependency's state changes, settings change, config or secrets change, a new release appears, a recall happens, or a Plan has been blocked for more than 4 h. A change re-plans the entity and its direct dependencies and dependents only.
- **Priority:** recalled-release roll-offs and break-glass commands first.
- **Release channels** ([Fact](https://palantir.com/docs/apollo/core/release-channels/)):
  - Defaults are `DEV`, `RELEASE_CANDIDATE` and `RELEASE`, routed by version type.
  - Promotion is automatic, manual, or by pipeline, with label and health criteria during windows.
  - Soak timeout is 2× the soak duration, counting weekday hours only. Waiting for canaries times out after 7 days. Overall promotion times out after 30 calendar days.
- **Failure handling:** a failed Plan leads to entity-level auto-suppression and a rollback Plan if the state changed. A failing release is auto-recalled, and every environment rolls off it.
- **Recall roll-off strategies:** stay, stay with exceptions, move to newer, or roll back to a known-safe version ([Fact](https://www.palantir.com/assets/xrfr7uokpv1b/2gFvOhbnVSqDVQ0iMZDtLg/bdb6b7a6a02bfa9edd8f4d4716248dfb/Apollo_WP_H1_-25_VX.pdf)).
- **Security:**
  - A container-scan integration auto-recalls images that fail.
  - Remediation SLAs are set by severity; the examples are 24 h for an emergency CVE and 60 days for a medium one.
  - A release is flagged "stale" if it has sat on a stable channel for more than 5 days without rolling out.
- **Scale** (white paper, H1 2025) [Vendor claim]: 250+ teams, 700+ environments, 400+ services, 70,000+ entities upgraded daily. Log4j was remediated across 200+ environments within hours.
- **Demo Day, 27 Apr 2022** (Shyam Sankar, Greg DeArment, Sean Hacker) ([Vendor claim](https://investors.palantir.com/files/Apollo%20Demo%20Day%20-%20Transcript%20EN.pdf)):
  - storage services declare schemas and migration steps at compile time, so upgrade and rollback are data-safe;
  - SLOs and monitors live in the artifact;
  - the demo showed an automatic recall of 1.23.0 on canaries, then 1.23.1 passing soak;
  - at the time, 250+ customer environments.
- **Edge:** version differencing sends only delta packets, scaling to "hundreds of thousands of devices" ([Vendor claim](https://www.palantir.com/assets/xrfr7uokpv1b/ECuz16kcqKOQ2P0jBBnVy/fd84e054ee75b9baf9151851d1c30bf9/ApolloForEdge.pdf); the document says its data is notional).

#### B2. Rubix

[Fact](https://palantir.com/docs/foundry/architecture-center/rubix/)
- **What it is:** Palantir's hardened, autoscaling Kubernetes, which runs AIP, Foundry and Apollo.
- **Nodes:** no node lives longer than 48 hours. Draining uses policy-driven node selection.
- **Isolation:** privileged operations are separated from application execution.
- **Security:** encryption everywhere. Every workload-to-workload call is authenticated, authorized and logged, under immutable config.
- **Deployment pattern:** every service runs multi-node with blue/green rollout. Green nodes are built and monitored, traffic shifts over, and blue nodes are destroyed.
- **Clouds:** AWS, Azure, GCP, Oracle and on-prem.
- **Accreditations:** FedRAMP High, IL5/IL6 and CMMC.
- **Origin:** the 48h-ephemeral idea traces to a KubeCon EU 2019 talk, "Running Kubernetes on Ephemeral Infrastructure" by Greg DeArment and Vlad Ungureanu. I found the slides but could not open them (URL too long) [Unverified content].

#### B3. Open-source microservice practices (github.com/palantir), read from cloned code

- **Conjure** ([Fact, code](https://github.com/palantir/conjure)):
  - **Pipeline:** API defined once in YAML, compiled to a JSON intermediate representation (IR), then generators produce Java, TypeScript, Python, Rust and Go.
  - **Wire spec rules:**
    - clients must tolerate unknown fields, enum variants and union variants;
    - servers must reject unknown fields;
    - servers tolerate extra headers;
    - `OPTIONS`/CORS support is required.
  - **Errors** are JSON `{errorCode, errorName "Namespace:Name", errorInstanceId uuid, parameters}` with fixed code-to-HTTP mappings (for example PERMISSION_DENIED→403, INVALID_ARGUMENT→400).
  - Foundry's own API errors use the same shape (`errorName`, `parameters`, `errorInstanceId`) ([Fact](https://www.palantir.com/docs/foundry/slate/concepts-queries/)).
  - **Lesson:** schema-first APIs with forward-compatible clients. The structured error envelope is worth copying for agent tool errors.
- **Witchcraft** (witchcraft-go-server) ([Fact, code](https://github.com/palantir/witchcraft-go-server)):
  - **Config:** install config (static) and runtime config (hot-reloaded `runtime.yml`), with encrypted config values. The server will not start if install config has encrypted values but no key.
  - **Status endpoints:** `/status/liveness`, `/status/readiness` and `/status/health`, optionally on a separate management port.
  - **Diagnostics:** `/debug/diagnostic/{type}` serves profiles and metric names.
  - **Security:** HTTPS only.
  - **Logging:** every route emits request, trace and metric logs, with safe/forbidden parameter lists for log redaction.
  - **Lesson:** a standard service chassis, so that Apollo can treat every service the same way.
- **sls-packaging** ([Fact, code](https://github.com/palantir/sls-packaging)):
  - the Service Layout Specification tarball has the structure `deployment/manifest.yml`, `service/bin`, `service/monitoring/bin/check.sh`, `var/`;
  - product dependencies (min, max, recommended, optional) are inferred from libraries;
  - a `product-dependencies.lock` is checked in, and non-overlapping ranges fail the build.
  - This is the producer side of Apollo's dependency constraint.
- **AtlasDB** ([Fact, code](https://github.com/palantir/atlasdb)):
  - a transactional layer over key-value stores (Cassandra, Postgres), offering snapshot isolation or serializable SI, with conflict handlers per table;
  - it supports online migration between backing stores through dual-write, backfill, then a read flip.
  - **Lesson:** Palantir built transactions above dumb storage. A small product should just use Postgres [Inference].
- **Tritium** ([Fact, code](https://github.com/palantir/tritium)): annotation-driven instrumentation of service interfaces for latency percentiles, rates and cache statistics.
- **policy-bot and bulldozer** ([Fact, code](https://github.com/palantir/policy-bot)):
  - policy-bot is a GitHub App for approval policies on pull requests: rules with predicates combined with and/or, a disapproval policy, and a simulation API.
  - bulldozer auto-merges once checks and reviews pass.
  - **Lesson:** the policy-bot rule model (predicates plus required approvers combined with and/or) is a good template for Action/Proposal approval policies [Inference].

#### B4. Enrollment and tenancy

- **Enrollment:** one platform instance containing one or more organizations. Most settings are per organization; some, such as Resource Management, are enrollment-wide ([Fact](https://palantir.com/docs/foundry/administration/enrollments-and-organizations/)).
- **Organization:** a mandatory access control applied to spaces, ontologies, projects, users and groups. A user has exactly one home organization and may hold guest memberships. Admins control whether other organizations are discoverable ([Fact](https://www.palantir.com/docs/foundry/security/orgs-and-spaces)).
- **Space:** a container of projects with **one ontology**, restricted by one or more organizations. Projects carry a subset of the space's organizations. Markings and roles refine access inside projects.
- **B2B and B2C patterns** ([Fact](https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/)):
  - A: a private organization, space and ontology per customer;
  - B: shared spaces plus restricted views;
  - C: a hybrid of the two;
  - B2C: one organization with discoverability off, and restricted views on a user-ID column auto-filled by an Action.
- **Marking propagation:**
  - resources with no upstream dependencies get OR organization markings;
  - derived data gets AND;
  - marks are removed only explicitly (`stop_propagating`, `stop_requiring`, or restricted views).
- **Authentication options:** an IdP per customer (SAML), passthrough federation with an organization attribute, an internal IdP, or a mix.
- **Consumer mode** (external users; 28 Aug 2025) has three patterns: in-platform apps, OAuth apps on Foundry subdomains, and client-credentials apps for externally hosted services ([Fact](https://palantir.com/docs/foundry/announcements/2025-08/)).

#### B5. Deployment options

- **Palantir-managed SaaS** is the default implied by the docs [Inference from wording].
- **Customer cloud:** the OCI reference architecture describes it as single-tenant, either in the customer's tenancy or in Palantir's OCI tenancy on the customer's behalf, and not self-deployable ([Fact](https://docs.oracle.com/en/solutions/palantir-foundry-ai-platform-on-oci/index.html)):
  - one deployment per tenancy, with a VCN of a public and a private subnet;
  - control plane and data plane in an autoscaling instance pool;
  - up to 3 egress routers;
  - a NAT path to Palantir's management plane and Apollo;
  - VPN or FastConnect, or an on-prem agent, for private sources;
  - audit logs archived to object storage within 24 h.
- **Self-hosted / on-prem / bare metal** ([Fact](https://palantir.com/docs/foundry/security/protect-foundry-installation/)):
  - the customer owns physical security, disk encryption, TLS 1.2+, SSO/MFA, network isolation and patching;
  - "Rescue" handles application backup and restore;
  - Apollo-connected sites get security updates automatically, while unconnected sites must patch critical issues within 30 days.
- **Edge:** Apollo for Edge (see B1).

#### B6. Upgrade model

- **Server-side:** Apollo continuously upgrades every entity to the newest constraint-satisfying release on its channel, inside maintenance windows (B1).
- **Customer-side content:** Marketplace installations upgrade manually or automatically per release channel and window (A16).
- **Function versions:** function repositories can require stable versions to be tagged only from protected branches, and downstream apps that accept upgrades pick them up ([Fact](https://palantir.com/docs/foundry/announcements/2025-08/)).
- **Upgrade Assistant:** a product for notifying customers about breaking platform changes appears in the admin sidebar, but its page returned 404 for me [Unverified].

#### B7. Observability and reliability

- **Platform observability** ([Fact](https://palantir.com/docs/foundry/observability/overview/)):
  - execution history (7 days);
  - metrics for functions, actions and AIP Logic (30 days: success/failure counts, P95 latency);
  - trace views across functions, actions and LLM calls (duration, inputs, outputs, errors per step);
  - log search keyed by "source executor", i.e. the first executable in a call chain: function, action, automation, AIP Logic, agent or model deployment;
  - log export to a stream.
- **Monitoring views** ([Fact](https://palantir.com/docs/foundry/monitoring-views/overview/)):
  - rules on resource metrics with Low/Medium/High thresholds;
  - static or dynamic scopes (project, folder, Workshop app, OSDK app);
  - resource types include agents, object types, actions, functions and automations;
  - AND-composite rules;
  - subscribers per severity, notified by email or in-platform, PagerDuty, Slack or a webhook;
  - snooze per alert or per rule;
  - status colours shown in Workflow Lineage.
- **Workshop:** an Observability Chart widget went GA 21 Jul 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-07)).
- **Reliability practices:** blue/green deploys, 48h node lifetimes, auto-suppression and rollback, canary channels, and SLO-gated promotion (B1, B2).

#### B8. Gotham vs Foundry

- **Shared:** Gotham's core applications run on the Foundry-managed Ontology. Its earliest parts predate the common architecture but are now fully integrated, and defense apps share the commercial core architecture ([Fact](https://www.palantir.com/docs/foundry/architecture-center/platforms/)).
- **Type mapping** ([Fact](https://palantir.com/docs/jp/foundry/object-link-types/enable-gotham-integration/)):
  - Foundry object types can be exposed to Gotham. Each needs a Gotham parent category (entity, event or document).
  - Properties are mapped individually; shared properties are mapped automatically.
  - Once enabled on an ontology it cannot be disabled. One Foundry ontology per Gotham installation.
  - Gotham queries through the Object Set Service. Markings and classifications carry over.
  - A `geopoint` is needed for display on Gaia maps.
- **What differs:** Gotham-specific apps (for example Gaia maps), military symbology, and a Defense OSDK of domain interfaces (Order of Battle, Targeting and Fires, Sustainment and others). The Defense OSDK leans on interfaces such as `Unit extends Organization` ([Fact](https://www.palantir.com/docs/defense-osdk/api/general/overview/build-with-the-defense-osdk/)).

#### B9. Engineering posts and talks that explain architecture (one line each)

- "Ontology-Oriented Software Development", Peter Wilczynski, Palantir blog, 22 Jan 2024. It argues that the ontology is the shared integration layer, so apps are written in business nouns via the OSDK. It shows a flight-swap example and says GUIs, APIs and NLIs all sit over one model ([Fact](https://blog.palantir.com/ontology-oriented-software-development-68d7353fdb12)).
- Apollo Demo Day, 27 Apr 2022: Sankar, DeArment and Hacker on the catalog, environments as entities, channels, compile-time schema declarations, SLO-in-artifact, auto-recall and SBOM ([source](https://investors.palantir.com/files/Apollo%20Demo%20Day%20-%20Transcript%20EN.pdf)).
- Apollo white paper, H1 2025: hub and spoke, remote hubs via bundle, constraints, scanning SLAs, scale figures ([source](https://www.palantir.com/assets/xrfr7uokpv1b/2gFvOhbnVSqDVQ0iMZDtLg/bdb6b7a6a02bfa9edd8f4d4716248dfb/Apollo_WP_H1_-25_VX.pdf)).
- Architecture Center, "The Rubix substrate" and "Integrated platforms": the closest thing to a published architecture doc ([source](https://palantir.com/docs/foundry/architecture-center/rubix/), [source](https://www.palantir.com/docs/foundry/architecture-center/platforms/)).
- KubeCon EU 2019, "Running Kubernetes on Ephemeral Infrastructure" (DeArment and Ungureanu): the ephemeral-node philosophy behind Rubix. The slides were not readable here [Unverified content].
- AIPCon, DevCon and FoundryCon talks: my search quota ran out before I could locate specific talk pages [Unverified].

### Part C: technical onboarding of a new customer

What Palantir publishes, in order:

1. **Enrollment and tenancy setup.**
   - Palantir provisions an enrollment: SaaS, or customer cloud where "provisioning requires account teams" ([Fact](https://docs.oracle.com/en/solutions/palantir-foundry-ai-platform-on-oci/index.html)).
   - Admins configure organizations, spaces and the IdP (SAML/OIDC/SCIM), and set egress/ingress and domains. These are the Control Panel areas listed in the admin docs ([Fact](https://palantir.com/docs/foundry/administration/enrollments-and-organizations/)).
   - The exact ordering of these steps was not read [Unverified].
2. **Scope a use case.**
   - The "Scoping Use Cases" course takes about 15 minutes ([Fact](https://palantir.com/docs/foundry/aip/getting-started-with-aip/)).
   - Palantir defines a use case as time-bound, with a dedicated team, named users and a measurable improvement ([Fact](https://www.palantir.com/docs/foundry/use-case-life-cycle/overview/)).
3. **Solution design** ([Fact](https://www.palantir.com/docs/foundry/use-case-life-cycle/solution-design)):
   - **Object-model sketch:** core, derived and use-case object types and links, with optional keys and cardinality.
   - **Lifecycle diagram:** a state machine of Actions.
   - **Enrichments:** object-level and property-level.
   - **Interface intents.**
   - **Defaults:** Workshop for an inbox, Object View for a single-item view, Quiver for an executive dashboard, Carbon for unified search.
   - **Heuristic:** put enrichments in the data layer unless they depend on Action-edited data.
4. **Sequence the build** ([Fact](https://palantir.com/docs/foundry/use-case-life-cycle/sequencing-development/)):
   - Level 1 is the data asset (pipeline).
   - Level 2 is guided decision-making (ontology plus first interfaces).
   - Then expand with models and enrichment.
5. **Hands-on build.** "Speedrun: Your First End-to-End Workflow" ([Fact](https://learn.palantir.com/speedrun-your-first-e2e-workflow)):
   1. Create a project and folder.
   2. Upload data manually.
   3. Build a pipeline that cleans two sources, joins them to a Master Customer List, unions them and outputs Master Orders.
   4. Create the object.
   5. Build a Workshop module with pie and bar charts and an object table.
   6. Enable edits and create an "Assign Order" Action.
   7. Add the Action to the app.
   - The AIP variant (about 60–90 minutes) extracts PDFs into the ontology, configures an AIP Chatbot on that knowledge graph, and builds an app around it ([Fact](https://palantir.com/docs/foundry/aip/getting-started-with-aip/)).
6. **Examples and templates.** "Build with AIP" / Examples are installable reference workflows, some taking your own data via drag-and-drop, some with walkthroughs ([Fact](https://palantir.com/docs/foundry/getting-started/start-with-examples/)). Marketplace installs products into the customer's space (A16).
7. **Bootcamp.** One to five days: build AI intuition, keyboard time, then configure and deploy initial use cases plus an implementation plan for an MVP rollout ([Vendor claim](https://www.hannovermesse.de/apollo/hannover_messe_2024/obs/Binary/A1354173/Palantir%20AIP%20Bootcamp.pdf), Hannover Messe 2024 flyer).

**Typical first ontology size and time.**
- No Palantir source I could open states a number.
- The Speedrun builds one object type and one Action in one session.
- Bootcamps claim a deployed use case in 1–5 days.
- [Inference] A first production use case is therefore probably a handful of object types (core plus use-case types) and a few Actions, not a full enterprise model. Treat this as unverified.

---

## What to copy

1. **One write path: typed Actions with parameters, submission criteria (validation rules with messages) and per-Action permissions. Generate both UI forms and agent tool schemas from the same definition.** It stops agents and humans having different rules. [source](https://www.palantir.com/docs/foundry/workshop/actions-use/)
2. **Token = user permissions ∩ app restrictions ∩ requested scope. Every agent gets its own restricted client listing its allowed object types, Actions, functions and API namespaces. An empty scope means no permissions.** This is least privilege for agents. [source](https://palantir.com/docs/foundry/developer-console/application-restrictions/)
3. **Expose the ontology as MCP tools through the same OAuth client. Use authorization-code grants for staff-facing agents (they act as the user) and client credentials for back-office agents (a service user with its own permissions).** It needs no separate agent auth system. [source](https://palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/)
4. **Read-time enforcement through row-level restricted views plus property-level policies. Document clearly that once data leaves via the API, it is out of scope.** [source](https://www.palantir.com/docs/foundry/ontology-sdk/overview/)
5. **Rules as data: a `Rule` record whose logic is a JSON AST under a versioned grammar (inputs → filter/expression/aggregate/join blocks → typed output), with `RuleProposal` records holding old/new diffs. Approve and reject are Actions with validation (author or superuser). A scheduled executor writes to typed output tables.** This gives auditable, reviewable business rules that agents can draft but not ship. [source](https://www.palantir.com/docs/foundry/foundry-rules/object-model/), [source](https://www.palantir.com/docs/foundry/foundry-rules/rule-logic/), [source](https://www.palantir.com/docs/foundry/foundry-rules/rule-permissions/)
6. **Automations with explicit limits and an owner identity: condition (schedule / object-set change / threshold), ordered effects (Action, function, agent, notification), a fallback effect, a batch size (≤1,000), a per-evaluation object cap (10,000), a queue timeout (45 min), a run timeout (4 h) and an auto-pause on runaway.** Proactive agents need guard rails. [source](https://www.palantir.com/docs/foundry/automate/limits/)
7. **Copy-on-write scenarios for dry runs: apply Actions into an overlay that stores only deltas, cap it (for example 30k edits and 50 Actions), let the user compare, then commit or discard.** This lets agents propose multi-step changes safely. [source](https://www.palantir.com/docs/foundry/workshop/scenarios-concepts/)
8. **App spec = typed variables + widgets + ordered events, with lazy evaluation, cached function results, explicit recompute modes and a module interface (external IDs) for embedding and URL parameters. Keep save and publish separate, with JSON diffs.** [source](https://www.palantir.com/docs/foundry/workshop/concepts-variables/), [source](https://www.palantir.com/docs/foundry/workshop/variable-recompute/), [source](https://www.palantir.com/docs/foundry/workshop/module-interface/), [source](https://www.palantir.com/docs/foundry/workshop/versions/)
9. **Custom-widget iframe protocol: a manifest of typed parameters (including `objectSet` with allowed type), named events listing the parameters they update, an allow-list of browser permissions, and messages `Ready`/`Resize`/`EmitEvent` up and `UpdateParameters`/`SetTheme` down.** [source](https://github.com/palantir/osdk-ts)
10. **Packaged use cases ("products"): outputs plus auto-detected inputs, input mapping at install, a name prefix and suffix per install, Production/Singleton/Bootstrap modes, per-install release channel and upgrade window, and a size cap with a 75% warning.** This is how one vertical template gets redeployed to many tenants. [source](https://www.palantir.com/docs/foundry/foundry-devops/create-products), [source](https://palantir.com/docs/foundry/marketplace/install-product/)
11. **Tenancy: one org per customer (B2B option A, private space and ontology) as the default, so tenancy is enforced structurally. Reserve shared spaces for Palantir-style shared reference data.** [source](https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/)
12. **Delivery: tenants subscribe to channels (`DEV` → `RC` → `RELEASE`), with dependency ranges in the build manifest, maintenance windows per tenant, auto-suppression and rollback on failure, auto-recall on canary failure, and soak timeouts.** For SaaS on one cluster, apply this to tenant-level content (template packs, schema migrations) more than to binaries. [source](https://www.palantir.com/docs/apollo/core/plans-and-constraints), [source](https://palantir.com/docs/apollo/core/release-channels/)
13. **Schema-first internal APIs with a fixed error envelope `{errorCode, errorName: "Ns:Name", errorInstanceId, parameters}`. Clients tolerate unknown fields; servers reject them.** Agents get structured, retryable errors. [source](https://github.com/palantir/conjure)
14. **Service chassis: liveness, readiness and health endpoints, static install config plus hot-reloaded runtime config, encrypted config values, and request/trace logs with safe/forbidden parameter redaction.** [source](https://github.com/palantir/witchcraft-go-server)
15. **Observability per Action, function and agent call: execution history (7d), metrics with P95 (30d), and traces across function → Action → LLM call keyed by the originating "source executor". Monitoring rules with Low/Medium/High thresholds route to email, Slack or a webhook.** [source](https://palantir.com/docs/foundry/observability/overview/), [source](https://palantir.com/docs/foundry/monitoring-views/overview/)
16. **A state-transition log per process object (previous state, time in state, path), maintained automatically.** It gives cheap SLA analytics and agent context. [source](https://www.palantir.com/docs/foundry/process-mining/core-concepts/)
17. **AI-built changes must go branch → proposal → review → least-privilege client → CI → release, never straight to main.** [source](https://palantir.com/docs/foundry/pilot/overview/)
18. **Onboarding playbook: scope one use case with named users and a metric; sketch the object model and the Action state machine; build data asset → ontology → one inbox app plus one Action; then iterate. Offer a 1–5 day bootcamp format.** [source](https://www.palantir.com/docs/foundry/use-case-life-cycle/solution-design), [source](https://learn.palantir.com/speedrun-your-first-e2e-workflow)

## What cannot or should not be copied

- **Rubix and Apollo as products.** They solve Palantir's problem: hundreds of services in 700+ environments, including air-gapped classified networks. A solo founder on one multi-tenant SaaS should use a managed Kubernetes service or a PaaS with blue/green deploys, and a simple channel system for tenant content [Inference].
- **Air-gapped, IL5/IL6 and edge delivery.** These are out of scope for 100–1,000-staff companies, and expensive to accredit.
- **The breadth of the app suite** (Quiver, Contour, Vertex, Map, Notepad, Slate, Carbon). Each is a product team's worth of work. Start with: auto-generated object pages, one generic search/explorer, an inbox app spec, report documents and agent chat. Add analysis tools later [Inference].
- **Slate's open templated SQL/HTTP.** It is a security surface. If copied at all, use helper-only templates with prepared statements; prefer ontology queries only.
- **AtlasDB-style custom transactions over key-value stores.** Use Postgres transactions instead.
- **Forward-deployed-engineer-heavy onboarding.** Palantir's bootcamps rely on its engineers sitting with customers. A solo founder needs the AIP Architect pattern (an AI-drafted ontology proposal from interviews and documents) plus templates, not people [Inference].
- **Gotham-specific symbology and the defense ontology.** Not relevant.
- **Model choice baked into widgets** (for example a hard-coded GPT-4 list in the LLM widgets). Palantir's own pages show this goes stale. Route through a model-agnostic gateway instead [Inference].

## Open questions and unverified items

- **Automate:** execution identity (owner vs triggering user), retry policy, per-object vs batch semantics. Sub-pages exist but were not read; the object-set-conditions page returned 404.
- **Foundry Rules:** the JSON logic grammar, the default execution schedule, and alert object conventions are not documented in what I read.
- **Workshop scenarios:** the reason for "Legacy" status and the replacement are not stated.
- **OSDK branching:** the platform summary says the OSDK is not branchable, while an announcement says Developer Console supports Global Branching (15 Oct 2026). The two may differ in scope.
- **Upgrade Assistant:** the page returned 404, so the mechanics are unknown.
- **Carbon, Object Views, Vertex, Map, Notepad, Quiver:** only overview pages were read. No limits were found.
- **AIPCon, DevCon and FoundryCon talks:** not located because the search quota was exhausted.
- **KubeCon 2019 Rubix talk:** content not opened.
- **learn.palantir.com AIP Speedrun page:** fetch failed. Course details were taken from the docs page instead.
- **Typical first ontology size and time to first production use case:** no primary source found. The 1–5 day bootcamp figure is a vendor claim from a 2024 flyer.
- **Apollo scale numbers** are vendor claims (H1 2025 white paper; 2022 Demo Day).
- **Exact enrollment setup order** (IdP, then organizations, then egress, then data connection agent) was not read, because the admin overview fetch failed when the budget ran out.

## Sources

Ranked by usefulness for the build plan.

1. https://www.palantir.com/docs/apollo/core/plans-and-constraints — plan types, the four constraints, re-plan triggers, suppression and rollback; the core of the delivery design.
2. https://palantir.com/docs/foundry/developer-console/application-restrictions/ — the token-intersection model, scopes and grant types; copy for agent credentials.
3. https://www.palantir.com/docs/foundry/foundry-rules/object-model/ (+ /rule-logic/, /rule-permissions/, /customize-foundry-rules-pipeline/) — rules as objects, proposals, approval Actions, the block pipeline.
4. https://www.palantir.com/docs/foundry/automate/limits/ — concrete automation limits.
5. https://www.palantir.com/docs/foundry/foundry-devops/create-products and https://palantir.com/docs/foundry/marketplace/install-product/ and https://palantir.com/docs/foundry/devops/core-concepts/ — packaging and redeploying use cases.
6. https://www.palantir.com/docs/foundry/workshop/concepts-variables/ (+ /concepts-events/, /variable-recompute/, /module-interface/, /actions-use/, /versions/, /functions-use/) — Workshop runtime semantics.
7. https://www.palantir.com/docs/foundry/workshop/scenarios-concepts/ — copy-on-write scenarios and their limits.
8. https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/ and https://www.palantir.com/docs/foundry/security/orgs-and-spaces — tenancy patterns.
9. https://palantir.com/docs/apollo/core/release-channels/ and https://palantir.com/docs/apollo/core/how-apollo-works/ and https://www.palantir.com/docs/apollo/core/overview — channels, promotion timeouts, hub/spoke.
10. https://www.palantir.com/assets/xrfr7uokpv1b/2gFvOhbnVSqDVQ0iMZDtLg/bdb6b7a6a02bfa9edd8f4d4716248dfb/Apollo_WP_H1_-25_VX.pdf — Apollo white paper (H1 2025): remote hubs, scanning SLAs, scale.
11. https://palantir.com/docs/foundry/observability/overview/ and https://palantir.com/docs/foundry/monitoring-views/overview/ — observability retention and monitor model.
12. https://github.com/palantir/osdk-ts (commit 20 Nov 2026) — widget.api manifest and messages; subscription WebSocket.
13. https://github.com/palantir/conjure (docs/spec/wire.md) — wire compatibility and error envelope.
14. https://github.com/palantir/witchcraft-go-server and https://github.com/palantir/sls-packaging — service chassis and dependency manifest.
15. https://palantir.com/docs/foundry/architecture-center/rubix/ and https://www.palantir.com/docs/foundry/architecture-center/platforms/ — Rubix and the Gotham/Foundry relationship.
16. https://palantir.com/docs/foundry/pilot/overview/ and https://palantir.com/docs/foundry/solution-designer/aip-architect/ — AI-built apps and ontology drafting with gates.
17. https://palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/ — MCP on the same OAuth client.
18. https://www.palantir.com/docs/foundry/ontology-sdk/overview/ and https://www.palantir.com/docs/foundry/developer-console/overview/ — OSDK scoping and Developer Console components.
19. https://www.palantir.com/docs/foundry/use-case-life-cycle/solution-design and /sequencing-development/ and /overview/ — onboarding method.
20. https://learn.palantir.com/speedrun-your-first-e2e-workflow — first-workflow course outline.
21. https://docs.oracle.com/en/solutions/palantir-foundry-ai-platform-on-oci/index.html — customer-cloud deployment topology.
22. https://palantir.com/docs/foundry/security/protect-foundry-installation/ — self-hosted responsibilities.
23. https://investors.palantir.com/files/Apollo%20Demo%20Day%20-%20Transcript%20EN.pdf — Apollo Demo Day, 27 Apr 2022.
24. https://blog.palantir.com/ontology-oriented-software-development-68d7353fdb12 — Wilczynski, 22 Jan 2024.
25. https://palantir.com/docs/jp/foundry/object-link-types/enable-gotham-integration/ and https://www.palantir.com/docs/defense-osdk/api/general/overview/build-with-the-defense-osdk/ — Gotham type mapping and the Defense OSDK.
26. https://www.palantir.com/docs/foundry/process-mining/core-concepts/ — Machinery states and log.
27. https://www.palantir.com/docs/foundry/slate/concepts-queries/ — Slate query templating and limits.
28. Announcements: https://palantir.com/docs/foundry/announcements/2025-08/, https://www.palantir.com/docs/foundry/announcements/2026-07, /2026-10, /2026-11 — dated status of DevOps, custom widgets, Pilot GA, SQL functions, Developer Console branching.
29. https://www.hannovermesse.de/apollo/hannover_messe_2024/obs/Binary/A1354173/Palantir%20AIP%20Bootcamp.pdf — bootcamp format (vendor flyer, 2024).
30. Overview pages for Quiver, Contour, Object Explorer, Object Views, Vertex, Map, Notepad, Carbon, Marketplace and Solution Designer (palantir.com/docs/foundry/<app>/overview/) — positioning only.