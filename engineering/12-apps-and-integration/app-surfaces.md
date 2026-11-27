# App surfaces

**Layer:** [12-apps-and-integration](README.md) · **What it is:** The applications built on the ontology: operational apps, object views, analysis tools and AI app builders.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (13)

## Palantir

### A1. Workshop (low-code operational app builder)

> Source: [general-references/05-palantir-apps-infra.md § A1. Workshop (low-code operational app builder)](../../general-references/05-palantir-apps-infra.md#a1-workshop-low-code-operational-app-builder)

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

### A2. Slate (code-first app builder)

> Source: [general-references/05-palantir-apps-infra.md § A2. Slate (code-first app builder)](../../general-references/05-palantir-apps-infra.md#a2-slate-code-first-app-builder)

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

### A3. Quiver (analysis of objects and time series)

> Source: [general-references/05-palantir-apps-infra.md § A3. Quiver (analysis of objects and time series)](../../general-references/05-palantir-apps-infra.md#a3-quiver-analysis-of-objects-and-time-series)

- **What it does:** point-and-click analysis over objects and time series. It has a Canvas mode and a Graph mode (a dependency graph of cards), and a formula language ([Fact](https://www.palantir.com/docs/foundry/quiver/overview/)).
- **Card types:** Object, Time series, Event set, Dataset, Chart, Table, Numeric, String, Date/Time, Boolean, Array, Writeback and Display.
- **Linked objects:** object sets are built by filtering and Search Around, so the user never does joins.
- **Dashboards** embed into Workshop, Notepad, Object View and Carbon.
- **Writeback:** analytical decisions can be written back through an Action.
- No limits are documented on the overview page.
- **Small-product equivalent [Inference]:** a notebook-like "analysis graph", where each card is a typed node over an object set, and the result can be saved as a dashboard or turned into an Action.

### A4. Contour (analysis of datasets, not objects)

> Source: [general-references/05-palantir-apps-infra.md § A4. Contour (analysis of datasets, not objects)](../../general-references/05-palantir-apps-infra.md#a4-contour-analysis-of-datasets-not-objects)

- **What it does:** point-and-click analytical "paths" over datasets. Results can be saved as a new dataset, and analyses can be parameterized into dashboards ([Fact](https://www.palantir.com/docs/foundry/contour/overview/)).
- **When Palantir says to use it:** for data not mapped into the Ontology, such as one-off uploads. Palantir says it suits large workloads such as joins over 100k+ objects or aggregations over 50k+ rows.
- **Small-product equivalent [Inference]:** none needed at first. Point users at a SQL console over the warehouse.

### A5. Object Explorer

> Source: [general-references/05-palantir-apps-infra.md § A5. Object Explorer](../../general-references/05-palantir-apps-infra.md#a5-object-explorer)

- **What it does:** keyword and multi-property search across object types. It offers exploration presets (charts, maps), compare-object-sets, bulk Actions over a whole object set, export, and saved explorations that re-run live ([Fact](https://www.palantir.com/docs/foundry/object-explorer/overview/)).
- **Bulk Action cap:** Automate allows up to 5,000,000 objects for manual execution ([Fact](https://www.palantir.com/docs/foundry/automate/limits/)). The cap for Object Explorer bulk Actions themselves is [Unverified].
- **Small-product equivalent [Inference]:** a generic search UI generated from the object schema. This is also the obvious "read" tool for agents.

### A6. Object Views

> Source: [general-references/05-palantir-apps-infra.md § A6. Object Views](../../general-references/05-palantir-apps-infra.md#a6-object-views)

- **Two kinds** ([Fact](https://www.palantir.com/docs/foundry/object-views/overview/)):
  - *Standard* views are auto-generated from the object type's configuration.
  - *Configured* views are built in Workshop. Once one exists it becomes the default, and users can switch back to the standard view.
- **Two form factors:** Full (everything about the object) and Panel (a compact view embedded in other apps).
- **Further features** listed in the sidebar but not read: tabs, version management and branching.
- **Small-product equivalent [Inference]:** an auto-generated object page (properties, linked objects, Action buttons) with an optional custom layout.

### A8. Map

> Source: [general-references/05-palantir-apps-infra.md § A8. Map](../../general-references/05-palantir-apps-infra.md#a8-map)

- **What it does:** geospatial exploration of objects. It supports bounding-box and polygon search, high-scale vector layers, imagery, movement tracks, drawn shapes and geospatial Actions, and has a Workshop widget ([Fact](https://www.palantir.com/docs/foundry/map/overview/)).
- **Projections:** rendering is in Web Mercator (EPSG:3857), and inputs are expected in WGS 84 (EPSG:4326).
- **Relevance [Inference]:** low for a 100–1,000-staff target unless the customer has a field workforce.

### A9. Notepad

> Source: [general-references/05-palantir-apps-infra.md § A9. Notepad](../../general-references/05-palantir-apps-infra.md#a9-notepad)

- **What it does:** a rich-text editor aware of objects. It embeds Contour, Quiver, Code Workbook and Object Explorer content, and keeps structured links to the objects it references ([Fact](https://www.palantir.com/docs/foundry/notepad/overview/)).
- **Templates** generate new documents from selected objects, for example monthly reports.
- **Freezing** captures point-in-time content.
- **Not suited to dashboards,** because it has no dynamic filtering.
- **Small-product equivalent [Inference]:** this is the natural target for "agent writes a report". Store reports as documents that link to object IDs, with a snapshot of the values used. That gives auditability.

### A10. Carbon (curated workspaces)

> Source: [general-references/05-palantir-apps-infra.md § A10. Carbon (curated workspaces)](../../general-references/05-palantir-apps-infra.md#a10-carbon-curated-workspaces)

- **What it is:** a workspace bundles a custom landing page with a set of modules (Workshop, Quiver and others) for one user group. It can hide the rest of the platform and restrict navigation, and is configured by an admin, including through YAML ([Fact](https://www.palantir.com/docs/foundry/carbon/overview/)).
- **Parameter passing:** Workshop modules opened as Carbon tabs take parameters prefixed `variable.` ([Fact](https://www.palantir.com/docs/foundry/workshop/module-interface/)).
- **Small-product equivalent [Inference]:** role-based home pages, i.e. "the sales desk sees these 4 apps and this agent".

### A14. Solution Designer and AIP Architect

> Source: [general-references/05-palantir-apps-infra.md § A14. Solution Designer and AIP Architect](../../general-references/05-palantir-apps-infra.md#a14-solution-designer-and-aip-architect)

- **Solution Designer** is an architecture-diagram tool whose nodes link to platform resources. It has a reference-architecture library and an "AIP Critic" that reviews diagrams, and it exports PDF, image or JSON ([Fact](https://palantir.com/docs/foundry/solution-designer/overview/)). The page does not say it generates resources.
- **AIP Architect** ([Fact](https://palantir.com/docs/foundry/solution-designer/aip-architect/)):
  - **Wizard inputs:** end artifact, workflow requirements (free text), data source type, data properties (frequency, scale, geo, time series, media), and build preference (no-, low- or pro-code).
  - **Outputs:** a workflow graph of concept nodes, implementation patterns with rationale and trade-offs, an implementation plan, and a step-by-step walkthrough.
  - **Ontology node:** "Generate data model" drafts object types, properties and link types from a prompt.
  - **Models:** the LLM is selectable, and the page recommends GPT-5.
- **Small-product equivalent [Inference]:** an onboarding wizard that drafts the ontology from interviews and documents. Its output should be a proposal, not a live change.

### A15. Pilot (AI app builder, GA 29 Oct 2026)

> Source: [general-references/05-palantir-apps-infra.md § A15. Pilot (AI app builder, GA 29 Oct 2026)](../../general-references/05-palantir-apps-infra.md#a15-pilot-ai-app-builder-ga-29-oct-2026)

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

### 14. Object views

> Source: [general-references/02-palantir-ontology.md § 14. Object views](../../general-references/02-palantir-ontology.md#14-object-views)

Plain English: a default "profile page" for any object: key facts, linked objects, metrics, related apps.

Technical detail: standard object views are generated automatically from the type's configuration; configured views are built in Workshop and become the default (users can switch back); both come as full and panel form factors (panel for embedding in other apps). [Fact] https://www.palantir.com/docs/foundry/object-views/overview/ . Versioning, branching and configuration sub-pages were not opened [Unverified].

### 18. AIP Analyst, AIP Assist and other in-app AI features

> Source: [general-references/03-palantir-aip.md § 18. AIP Analyst, AIP Assist and other in-app AI features](../../general-references/03-palantir-aip.md#18-aip-analyst-aip-assist-and-other-in-app-ai-features)

- **AIP Analyst** (GA week of 13 Apr 2026) is an agent for ad-hoc analysis. [Fact] https://palantir.com/docs/foundry/announcements/2026-03/ , https://www.palantir.com/docs/foundry/aip-analyst/capabilities/
  - Tool categories: Ontology (search, object sets, Ontology SQL, aggregations, geo); Vega-Lite visualisation; planning (clarify, clean context, toggle tools, skills); datasets (SQL); functions; actions (need approval unless set to auto-submit); media (PDF page ranges, PDF semantic search); time series; integrations (Notepad, Quiver, Contour, Workshop lookup, Machinery lookup).
  - Each analysis shows a dependency graph with inline citations.
  - Saved "analysis resources" store messages, tool calls and references but **not results**. On reopening, tools are re-run against live data under the viewer's permissions. [Fact] https://www.palantir.com/docs/foundry/aip-analyst/analysis-resources/
  - Can be embedded as a Workshop widget or iframe.
- **AIP Assist** is the in-product help sidebar (Cmd/Ctrl+Shift+U). Modes cover platform docs, developer docs and custom sources. It knows which app the user is in. Palantir says Assist "does not access your data". Custom docs are Notepad documents or a Markdown documentation repo. Published chatbots can appear as Assist modes. [Fact] https://www.palantir.com/docs/foundry/assist/overview/
- **Other in-app AI.**
  - Pipeline Builder: Use LLM node, Text to Embeddings, Explain, Regex helper, Transform Assist.
  - Notepad: rewrite and translate.
  - Scheduler: natural-language to cron.
  - SQL Studio side panel (GA Jun 2026).
  - Workshop SQL variables from natural language (Aug 2026).
  - Insight copilot (beta, 19 Nov 2026).
  - Pilot app builder (GA Oct 2026), which generates an Ontology plus React OSDK front ends.
  - Realtime voice models with tool calling.
  - [Fact] https://www.palantir.com/docs/foundry/aip/aip-features , https://www.palantir.com/docs/foundry/announcements/2026-06 , https://www.palantir.com/docs/foundry/announcements/2026-08 , https://www.palantir.com/docs/foundry/announcements/2026-11 , https://www.palantir.com/docs/foundry/announcements/2026-10
- **AIP Threads** runs LLM tasks over uploaded documents or existing chatbots with no setup. [Fact] https://www.palantir.com/docs/foundry/aip/aip-features

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Conflict — Pilot status.** The research cites the Oct 2026 announcements for "GA on 29 Oct 2026", but the Pilot documentation page still carries a **Beta** banner ("may not be available on your enrollment"). Treat as GA-announced, docs not yet updated. Source: https://www.palantir.com/docs/foundry/pilot
- **New** — AIP Analyst GA week of 13 April 2026 (SQL over object sets and datasets, Vega charts, actions and functions in conversation); Insight (point-and-click ontology analysis) GA from 30 March 2026. Source: https://www.palantir.com/docs/foundry/announcements/2026-03/

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Open-source implementations: not applicable — product, onboarding or domain content rather than code.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
