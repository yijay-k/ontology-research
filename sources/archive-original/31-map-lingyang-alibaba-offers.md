# Reference map 2: what to copy from Lingyang, Alibaba and the two offer catalogues

Scope note (written 21 November 2026). This map turns four research files into build instructions for a coding agent. The product is a company model (objects, links, metric definitions, rules, permissions, actions) that AI agents work through. Its first job is receivables and collections for companies of 100 to 1,000 staff. The stack is TypeScript, PostgreSQL with row-level security (RLS), one repository, and models rented through APIs (Claude, Qwen). Documents read in full:

- 06 `06-palantir-business.md`: Palantir as a business (customers, cases, Acquire/Expand/Scale, bootcamps, pricing).
- 07 `07-lingyang-agentone.md`: Lingyang, AgentOne, Dataphin, Quick BI.
- 08 `08-alibaba-stack.md`: Qwen, Bailian, QwenWork, MyContext, UModel, OpenSPG/KAG, Higress, agent frameworks.
- 25 `25-palantir-agentone-offer-catalogue.md`: buyer-facing offer catalogues of Palantir and Lingyang, plus the 47-row comparison.

Labels from the sources are kept: [Fact], [Vendor claim], [Press], [Unverified], and for AgentOne [DOC] or [CLAIM]. Anything I reasoned beyond the documents is marked [Inference]. Where a design choice is a PostgreSQL or TypeScript mechanism that none of the documents mention, it is marked [Inference] too. In that case the documented pattern is the source, and the Postgres mechanism is how I propose to implement it.

Build order used below. First the type layer (UModel), then rules inside the schema (OpenSPG), then metrics, periods and compilation (Dataphin), then quality. After that come context and knowledge (MyContext, Bailian), then grounding and answering (Quick BI, UModel plans, KAG), then actions (UModel runbooks), then packaging (AI employees), then the commercial layer (which decisions to automate, credits, setup flow, account economics), and finally the version-1 cut of the 47-row table.

---

## Design decisions

### 1. Type definitions separate from instances (UModel TBox/ABox), with naming and relation rules

**Purpose.** Hold the definition of each kind of thing (Customer, Invoice, Payment) apart from the actual records, so agents can ask what exists and how to reach it before they touch any data. Receivables example: an agent asks "what is an Invoice, what links to it, and how do I get its open amount?" and gets the type definition and links, not raw rows.

**Design to implement.**
- Two layers. The *definition layer* (UModel's TBox) is a versioned set of type records. The *individual layer* (ABox) holds instances synced from the customer's accounting system [Fact, 08 §7].
- Definition record kinds, adapted from UModel's Set and Link primitives [Fact, 08 §7]:
  - `entity_set` (an object type: Customer, Contact, Invoice, Payment, CreditNote, PromiseToPay, Dispute, Reminder). The starter list is from 25 row 5.
  - `metric_set` (governed metrics; see section 3).
  - `event_set` (state transitions, inbound messages, payments received).
  - `runbook_set` (allowed actions; see section 12).
  - `entity_set_link` (relations between types) and `data_link` (pointer from a type to where its data lives).
- Fields per `entity_set`, from UModel's EntitySet [Fact, 08 §7]: `primary_key_fields`, `first_observed_time_field`, `last_observed_time_field`, `fields[]` (each with `type`, `unit`, `filterable`, `analysable`, `value_mapping`), `name_fields`, `tag_fields`, `id_generator`. Add `domain`, `owner`, `display_name_en`, `display_name_ms` or other second language, and `description` [Inference: UModel requires en_us and zh_cn; the founder's market suggests English plus Malay].
- Links carry `src` and `dest` as `{domain, kind, name}` [Fact, 08 §7].
- Naming rules, copied from UModel's principles page [Fact, 08 §7]:
  - entity sets `{domain}.{name}`, e.g. `ar.invoice`;
  - datasets `{domain}.{metric|log|event}.{name}`, e.g. `ar.metric.overdue_amt`;
  - links `{src}_{linktype}_{dest}`, e.g. `invoice_contains_invoice_line`;
  - field names match `[a-z][a-z0-9_]*`.
- Relation vocabulary is closed. Use UModel's standard set (`calls`, `hosts`, `contains` one-way; `same_as`, `related_to` two-way) [Fact, 08 §7], extended with Dataphin's concept-model types (association, inheritance, hierarchy, sequence, flow, containment) [Fact, 07 §4]. For receivables only `contains`, `related_to`, `same_as`, `hierarchy` (parent company to subsidiary) and `sequence` (reminder 1 before reminder 2) are needed in version 1 [Inference]. Direction must be consistent across the whole model [Fact, 08 §7].
- One authoritative source per entity type [Fact, 08 §7]. For Invoice it is the accounting system; for PromiseToPay it is the product itself.
- Prefer generic types with a discriminator field over specialised types. UModel's example is `service` with `service_type` rather than `spring_boot_web_service` [Fact, 08 §7]. So: one `ar.document` with `doc_type in (invoice, credit_note, debit_note)` is a candidate, but because the 25 starter list separates them, keep Invoice and CreditNote as separate types sharing an interface [Inference].
- Quantity caps from UModel: at most 10,000 instances per entity type and 100,000 records per instance [Fact, 08 §7]. [Inference] These caps fit observability. A 1,000-staff company can exceed 10,000 invoices a year, so do not copy the instance cap; keep a configurable soft cap per tenant with an alert.
- Domains have named owners and are created only after review [Fact, 08 §7]. In version 1 the product ships one domain, `ar`, and customer-added properties go into it after an approval (see section 5 for draft and publish).
- Exemptions to naming rules use an `@exempt` marker with a stated reason, reviewed periodically [Fact, 08 §7].
- Storage [Inference]: one Postgres table `model_definition (tenant_id, kind, name, version, status, body jsonb, owner, created_by, published_at)`, with RLS on `tenant_id`. Instance tables per entity type are generated from the published definition (section 5).
- Expose `GET /capabilities` that lists live features and the type and relation vocabularies. MyContext and UnifiedModel both have one, and agents call it first [Fact, 08 What to copy 16].
- Progressive discovery: UModel's `__list_method__` lets an agent ask which methods an entity set supports (`get_metrics`, `get_logs`) [Fact, 08 §7]. Copy as a tool `list_methods(entity_type)`.

**Copies.**
- 08, §7 UModel primitives and modelling method: Set/Link/Field primitives, TBox/ABox split, naming, relation vocabulary, one authoritative source, domain owners. https://help.aliyun.com/en/cms/cloudmonitor-2-0/umodel-modeling-principles ; https://www.alibabacloud.com/help/en/cms/cloudmonitor-2-0/basic-modeling-concepts ; https://github.com/alibaba/UnifiedModel
- 07, §4 Dataphin concept modelling: relation types between business objects and activities. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/the-data-architecture/
- 08, What to copy 16: capabilities endpoint. https://github.com/openTrinity/mycontext (`kl-graph/docs/query-api.md`)
- 25, C6 row 5: the fixed starter type list.

**Left out, and why.**
- UModel's observability storage kinds (Prometheus, SLS, Elasticsearch): no use in receivables [Inference].
- The 10,000-instance cap: too low for invoices [Inference].
- A general ontology modeller UI: 25 row 5 says ship a template, not a modeller.

**Open questions.**
- Second display language: Malay, Chinese, or both? The documents do not settle it.
- Whether an `interface` concept (Palantir's shared shapes, 25 A2.3) is needed in version 1 for Invoice and CreditNote.

### 2. Rules and derived relations written inside the schema (OpenSPG)

**Purpose.** Let business rules and derived facts live in the model as declarative code that the engine evaluates, not in prompts. Receivables example: "a customer is a chronic late payer if at least 3 invoices in the last 180 days were paid more than 30 days late" is a named rule attached to `Customer.chronic_late_payer`, and every agent and report reads the same result.

**Design to implement.**
- Rule block shape, copied from OpenSPG: `Define (s:Type)-[p:pred]->(o:Type) { STRUCTURE { pattern } CONSTRAINT { named conditions and assignments } }`, attached to the property or relation it defines [Fact, 08 §8].
- Constraint vocabulary to support, from OpenSPG [Fact, 08 §8]:
  - aggregation `group(s).sum(x)` (also count, max, min) [Inference for count, max, min: only sum is shown];
  - date functions such as `date_diff(from_unix_time(now(),'yyyyMMdd'), f.transDate) < 30`;
  - null handling `rule_value(cond, then, else)`;
  - references to other derived properties;
  - named thresholds, e.g. `R1("share must exceed 50%"): x*1.0/s.total > 0.5`.
- Named thresholds are the unit an agent cites. Store each as `{rule_id, label, expression, version, owner}`, so an answer can say "rule R1 v3, owned by the finance manager" [Inference: 07 notes that citations with rule version and owner are only in the founder's talk notes, not public].
- Concept rules: OpenSPG classifies events into concept nodes (a price-up event belongs to a concept) [Fact, 08 §8]. Receivables use: classify a payment event as `on_time`, `late_1_30`, `late_31_60`, `late_60_plus` [Inference].
- Property constraints from OpenSPG: `NotNull`, `MultiValue`, `Enum`, `Regular` (regex) [Fact, 08 §8]. Put these on entity fields in section 1.
- Semantic properties: a property typed as a concept with `MultiValue` turns a comma-separated column into edges at import [Fact, 08 §8]. Use it for tags such as an invoice's cost centres [Inference].
- Evaluation [Inference]: compile each rule to SQL (a CTE or view) at publish time, in the same pass as metrics (section 5). Never ask an LLM to evaluate a rule.
- Failure behaviour [Inference]: a rule that references an unknown property, or forms a cycle with another derived property, fails publish with the offending path.
- Business-rule table for dunning policy (25 row 7: "remind at +3, +10 and +20 days; stop if a dispute is open; escalate above X") is a separate, simpler structure. Store it as rows a finance owner edits, with draft, publish and approve. The OpenSPG block is for derived facts; the dunning table is for policy [Inference].

**Copies.**
- 08, §8 OpenSPG schema language: rule blocks, constraint functions, named thresholds, concept rules, property constraints, semantic properties. https://github.com/OpenSPG/KAG (`kag/examples/supplychain/schema/SupplyChain.schema`, `concept.rule`, `knext/schema/marklang/schema_ml.py`)
- 08, What to copy 12: evaluate in the engine, not the LLM.
- 25, C6 row 7: rule table with approval.

**Left out, and why.**
- OpenSPG's graph storage (TuGraph, Neo4j adapters): the stack is PostgreSQL [Fact for adapters, 08 §8; Inference for exclusion].
- OpenSPG's `hypernymPredicate` concept hierarchies: not needed for receivables [Inference].

**Open questions.**
- Whether to keep OpenSPG's text syntax, or store the same structure as JSON edited through a form. The documents show only the text syntax.
- The SPG white paper was not opened [Unverified, 08 §8].

### 3. Metric grammar and naming (Dataphin)

**Purpose.** Make every number agents and reports use a governed object built from four parts, so there is exactly one meaning for "overdue amount this month by collector". Receivables example: `overdue_amt_mtd_over30_by_collector` is overdue amount (atomic), month to date (period), more than 30 days past due (qualification), by collector (granularity).

**Design to implement.**
- Derived metric = atomic metric + business qualification + statistical period + granularity [Fact, 07 KF 6, §5].
- **Atomic metric**, fields and limits from Dataphin [Fact, 07 §5]:
  - business entity and subject domain;
  - English name: letters, digits and `_`, at most 64 characters, with suggestions from a word-root list;
  - display name at most 128 characters;
  - unit from an enum: currency, time, ratio, rank, count noun, weight, other;
  - data type;
  - definition text (口径) at most 1,000 characters;
  - description;
  - timeliness: day, hour or minute (version 1: day only [Inference]);
  - source main table, which must be a dimension or fact table (here: an entity type or event set);
  - statistical-period identifier field, allowed on snapshot facts and dimensions but not on event facts;
  - calculation expression, e.g. `sum(open_amount)` or `count(distinct invoice_id)`;
  - additive flag (distinct counts are not additive).
- **Derived atomic metric**: an expression over atomic metrics, e.g. C = A/B [Fact, 07 §5]. DSO is one: receivables over sales times days [Inference for the formula; the documents do not define DSO].
- **Business qualification** [Fact, 07 §5]:
  - basic: a predicate over the source table's fields, e.g. `days_past_due > 30`;
  - composite: a boolean tree over already-submitted qualifications, with match or not-match plus AND/OR and nested groups;
  - must reference the same source main table;
  - no time condition inside a qualification (time belongs to the period);
  - a "preview SQL" button.
- **Granularity**: up to 3 object dimensions [Fact, 07 §5]. Receivables dimensions: customer, collector, legal entity, currency, region [Inference].
- **Derived metric wizard rules** [Fact, 07 §5]:
  - choose up to 3 periods, one atomic metric and qualifications, all with the same timeliness, and up to 3 granularity dimensions;
  - the wizard pre-generates the combinations;
  - default name `<atomic>_<period-abbr>_<qualification>`, starting with a letter, at most 100 characters, unique within its summary table;
  - set ops owner and business owner (batch settable) and description;
  - upstream dependencies are generated by the system and cannot be edited;
  - publish is required in dev/prod mode.
- **Summary table**: exactly one granularity; the primary key is the granularity combination and every other column is a metric; derived metrics with the same period and granularity share one summary table [Fact, 07 §5]. Name pattern `dws_<grain>_<period>`, from Dataphin's prefixes `dim_`, `fct_`, `dws_` and suffixes `_di`, `_df` [Fact, 07 §5].
- **Additive flag enforcement** [Inference from 07 What to copy 3]: when a query rolls a non-additive metric up to a coarser grain, the planner refuses and recomputes from the atomic level instead.
- **Registered existing metric**: attach a column already computed in the customer's system to the governed grain by mapping the grain key to source fields [Fact, 07 §5]. Use for an ageing figure the accounting system already produces.
- **Version 1 metric set**: about a dozen, per 25 row 6: overdue amount, ageing buckets, DSO, collected this period, promise-kept rate [Fact as a list, 25 C6 row 6; Inference for the rest].
- Storage [Inference]: `metric_atomic`, `metric_qualification`, `metric_period`, `metric_derived` as `model_definition` kinds, each version immutable once published.

**Copies.**
- 07, §5 Dataphin logical objects: atomic, derived atomic, qualification, derived metric, summary table, registered metric, naming prefixes. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/creating-atomic-metrics ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-business-qualification ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-derived-metrics ; https://help.aliyun.com/zh/dataphin/user-guide/specification-modeling-overview ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/new-registration-indicator ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-data-panel
- 25, C6 row 6: the version-1 metric list.

**Left out, and why.**
- Hour and minute timeliness: collections runs on a daily cadence (25 row 3 says nightly refresh is enough at first).
- Dataphin's conditional-schedule rules (up to 10, first match wins) [Fact, 07 §5]: no warehouse scheduling in this product.
- Word-root dictionaries from data standards: version 1 ships a fixed name list [Inference].

**Open questions.**
- Metric versioning beyond dev/prod publishing: Dataphin does not document a version history for 口径 and expression [Unverified, 07 Open questions]. This product needs one for citations, so it must be designed without a source [Inference].
- The DSO formula variant (count-back or simple) should come from each customer's finance head.

### 4. Time-window language (Dataphin period expressions)

**Purpose.** Name every time window once and evaluate it in code, because "last 7 days", "month to date" and fiscal periods are where agent answers most often go wrong. Receivables example: "collected this fiscal quarter" for a company whose fiscal year starts 1 April resolves to fixed dates through `CustomBeginDate`, not through the model's guess.

**Design to implement.**
- Period record fields, from Dataphin [Fact, 07 §5]: name (≤64), abbreviation (≤64), grain (day, hour, minute; version 1 day only), calendar (regular or fiscal; fiscal only for day grain), start and end as expressions.
- Function set, copied from Dataphin's appendix [Fact, 07 §5]:
  - `lastNDate(date, N)`;
  - `cBeginDate(date, 'w|m|q|y', [len])` and `cEndDate(...)` for natural periods;
  - `tdBeginDate(date, 'm|q|y')` for to-date periods;
  - `CustomBeginDate/CustomEndDate(date, 'm|q|y', shift)` for fiscal periods, e.g. fiscal year start `'0401'`;
  - hour and minute variants exist (`lastNHour`, `lastNMinute`, `dthBeginDatetime`, `dtmiBeginDatetime`), but are left for version 2.
- Anchor variable `${bizdate}`, the business date of the run [Fact, 07 §5]. Examples: last 7 days = `lastNDate('${bizdate}',7)` to `${bizdate}`; month to date = `tdBeginDate('${bizdate}','m')` to `${bizdate}`.
- Rules [Fact, 07 §5]: no two periods may share the same start and end; only admins create periods; a default set is generated when the tenant is set up.
- The same functions are reused in quality rules and partition expressions [Fact, 07 §5]. Here: in quality rules (section 6) and in dunning rules ("due date plus 10 days").
- Implementation [Inference]: a small parser in TypeScript that evaluates an expression to a `[start, end]` date pair for a given `bizdate` and tenant calendar, then binds the dates as SQL parameters. Unknown functions or malformed arguments fail at publish. The tenant record holds its time zone and fiscal-year start.
- The period's resolved dates are returned with every answer (section 11), so a user sees "1 Oct to 21 Nov 2026".
- Event facts cannot carry the period identifier field; snapshots can [Fact, 07 §5]. Receivables mapping [Inference]: the daily open-invoice snapshot is a snapshot fact (`_df`); payments received are event facts (`_di`).

**Copies.**
- 07, §5 Statistical period and period expression language. https://help.aliyun.com/en/dataphin/fullmanaged/user-guide/new-statistical-cycle ; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/appendix-statistical-period-expression-parameters
- 07, What to copy 4: a small closed DSL.

**Left out, and why.** Hour and minute periods, for the cadence reason in section 3.

**Open questions.** Whether customers with 4-4-5 or other non-calendar fiscal months exist in the target segment. Dataphin's fiscal shift handles only a shifted start date [Inference].

### 5. Publishing a definition generates the build (Dataphin "design is development")

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

### 6. Data-quality rules with two strengths (Dataphin strong and weak)

**Purpose.** Give agents a machine-readable signal that data cannot be trusted right now. Receivables example: if the nightly sync from the accounting system is late, a strong rule fails and the collections agent stops sending reminders, so nobody is chased for an invoice they paid yesterday.

**Design to implement.**
- A failed **strong** rule raises an alert and blocks downstream task nodes; a failed **weak** rule only alerts [Fact, 07 §5].
- Coverage in Dataphin includes data-source connectivity and schema changes [Fact, 07 §5]. Copy both as built-in checks.
- Rule record [Inference]: `{rule_id, target (entity type, sync, or metric), check_type, expression, strength: strong|weak, owner, schedule, version}`.
- Version-1 strong checks, from 25 row 4: invoice totals reconcile, no negative balances, sync is fresh. Add schema change on the source and connector reachability, from Dataphin's coverage [Fact for categories, 07 §5].
- Blocking semantics [Inference, from 07 What to copy 9: "agents should also refuse to answer from blocked data"]:
  - each definition and action carries the set of rules guarding its inputs (derived from the dependency graph in section 5);
  - a strong failure sets `blocked=true` on every dependent metric and on every action whose preconditions read them;
  - questions touching a blocked metric return "data is blocked by rule X, failed at T", not a number;
  - outbound actions (send reminder) refuse; drafts can still be prepared and wait;
  - weak failures attach a warning to answers.
- Governance workbench with fix, ignore and notify [Fact, 07 §5]. "Ignore" on a strong rule needs a reason and an owner, logged [Inference].
- The same period functions are usable in quality rules [Fact, 07 §5], e.g. "no payment dated after `${bizdate}`".
- Alerts by email and one messaging channel [Inference; Dataphin data services alert by DingTalk, email, SMS or phone, Fact, 07 §5].

**Copies.**
- 07, §5 Governance modules, Quality. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/asset-quality-overview
- 25, C6 row 4: the receivables strong checks and "agents stop sending reminders".

**Left out, and why.** Real-time versus offline comparison and the long list of external engines Dataphin monitors: not needed for one accounting source [Inference].

**Open questions.** Freshness threshold per connector (for example 26 hours for a nightly sync) has no source; set per tenant [Inference].

### 7. Context and memory design (MyContext): fact nodes with provenance, stable source ids, three-state merge

**Purpose.** Turn emails, notes and call logs about customers into structured, cited facts, and merge human and machine knowledge without letting the machine overwrite people. Receivables example: a customer emails "we will pay on 30 November"; that becomes a fact of type REQUEST or STATUS linked to the email, which proposes a PromiseToPay; if the collector has already typed a different date, the collector's value stays and the conflict goes to review.

**Design to implement.**
- **Source-unit identity.** Key every raw record by `(source_id, source_type, unit_id)` plus `content_hash` [Fact, 08 §6].
  - Same hash: skip.
  - Different hash: MyContext warns and skips, with replacement still a TODO [Fact, 08 §6]; this product should flag for re-extraction (08 What to copy 1).
  - No timestamp watermark, so late messages with old timestamps are still processed [Fact, 08 §6].
  - A scan that no longer finds a unit does not delete it [Fact, 08 §6].
- **Chunks versus extraction items.** Chunks are the only content node; a unit-to-chunk table maps many-to-many with ordinals and half-open character spans [Fact, 08 §6]. Each extraction item has exactly one primary chunk, validated before writing; a fact is created once with one `STATES` edge to every evidence chunk [Fact, 08 §6].
- Chunking modes `session` (idle-gap slices), `fixed_size` (never crossing a session break), `none`; extraction modes `message`, `chunk`, `document`; invalid pairings fail fast [Fact, 08 §6]. For email threads, use `message` extraction with neighbours as read-only context, and move quoted replies into context so they are not asserted again [Fact, 08 §6].
- **Fact node** [Fact, 08 §6]: `text`, `fact_type`, `timestamp`, `confidence` (default 0.8), `subject_entity_id`, `object_entity_id`, `source_chunk_id`, `source_unit_id`, `extraction_item_id`.
  - Fact types: DECISION, DELEGATE, REQUEST, ACTION_ITEM, STATUS, CAUSAL, OPINION, GENERAL.
  - REQUEST and ACTION_ITEM have fixed roles (subject requester, object recipient), and an ask to N people is N facts.
  - [Inference] Add receivables-specific mapping: a fact that names an amount and date from a customer contact becomes a *candidate* PromiseToPay, never a PromiseToPay directly; the action `log_promise` (section 12) creates the object after approval.
- **Scope ids.** Deterministic UUID5 from canonical JSON `["scope", source_type, native_id]` [Fact, 08 §6]. Use for email threads and customer accounts.
- **Entity records** [Fact, 08 §6]: name, type, first and last seen, mention count, description, `quality_status` (active or quarantined). Optional LLM cleanup may only answer KEEP, RETYPE or reversible QUARANTINE, never rename or merge [Fact, 08 §6]. [Inference] In this product, contact persons resolve to the Contact object by email address first; the LLM never merges customers.
- **Extraction cache key** includes item id, model, prompt version, strategy version and schema version; prompt language is part of the prompt version; batch size defaults to 5; exhausted items make the run `partial`, never empty [Fact, 08 §6].
- **Three-state merge** for human-editable business facts (contact preferences, agreed payment terms, owner of an account), copied from `merger.ts` [Fact, 08 §6]:
  - row key `(facet, scope, scope_ref, key)`; fields `value_json`, `confidence`, `evidence_json` (≤50 ids, newest first), `source in {llm, stat, user}`, `conflict_json`, `revision`;
  - a `user` row is never overwritten by a non-user candidate;
  - numeric facets combine by evidence-weighted average, confidence +0.05 capped at 0.95;
  - equal value = **confirm**: keep value, confidence +0.05 capped at 0.98, merge evidence;
  - array superset = **supplement**: take the new value, keep the higher confidence;
  - anything else = **conflict**: keep both in `conflict_json`, confidence becomes max(0.2, min(old, new) − 0.15), and a human decides;
  - comparison is structural JSON equality, never an LLM.
- **Materialisation thresholds** [Fact, 08 §6]: drop rows below confidence 0.5; flag rows below 0.65 as thin evidence. Agents must say "thin evidence" when citing such a row [Inference].
- **Collection scope per data domain** [Fact, 08 §6]: a compile-time-required default per domain (MyContext: chat collect-nothing, docs and minutes collect-all, contacts collect-nothing); scope re-read every run, never cached. [Inference] Here: the AR mailbox collect-all; personal mailboxes collect-nothing; enforce with a TypeScript `Record<Domain, Scope>` so a new domain without a default fails the build.
- **Connector rules** [Fact, 08 §6]: exact-command allow-lists, never prefix; PII commands never allowed; anything else throws FORBIDDEN; unreadable sources recorded as "unreadable", not as zero; pagination fully drained; stay inside the chosen time bound.
- **Agent never sends** [Fact, 08 §6]: MyContext's persona agent has no send tool; `draft_reply` is its endpoint; sending goes through a four-layer SendGuard (dry-run short-circuit; re-read approved draft and compare content hash; idempotency key; the source app's own authorisation). Grants are typed `once | session | timed | permanent`, local TTL only an optimisation, and a permission error revokes the grant and downgrades to drafting. Copy all four layers for outbound reminders [Inference for the mapping].
- **Retrieval** [Fact, 08 §6]: hybrid BM25 plus vector fused by RRF with k=60, keeping per-route ranks for citations; callers can pass a structured `intent` to skip a rewrite call; answer synthesis off by default. `/context` returns a fact with its source chunk and surrounding messages; `/requests` and `/todos` answer "what is on my plate today" with a query in the user's IANA time zone. [Inference] Use Postgres full-text search plus a vector column; the documents do not cover pgvector.
- Refresh policy: MyContext re-extracts the work profile only after 200 new messages or 3 days with new data, with backoff [Fact, 08 §6]. Use as a cost control for customer summaries [Inference].

**Copies.**
- 08, §6 MyContext ingestion and identity, entity and fact model, conflict resolution, storage, retrieval API, agent access. https://github.com/openTrinity/mycontext (`kl-graph/docs/graph-design.md`, `query-api.md`, `kl_graph/models/types.py`, `packages/distill/src/reduce/merger.ts`, `packages/store/src/domain-scope.ts`, `packages/channels/src/plugins/dingtalk/cli.ts`, `packages/persona/src/send-guard.ts`, `grant-manager.ts`, `packages/retrieval/src/fuse.ts`)
- 08, What to copy 1 to 8 and 15.

**Left out, and why.**
- MyContext code: Elastic License 2.0 forbids offering it as a hosted service; copy the design only [Fact, 08 What cannot be copied].
- Its single-user permission model: an organisation model needs RLS and roles [Fact, 08].
- The graph layer's `CONTRADICTS` and `ENTAILS` edges: defined but never populated [Fact, 08 §6].
- Leiden communities and GraphRAG global search (off by default in MyContext): not needed for per-customer context [Inference].
- Local-first storage: the product is multi-tenant SaaS (25 row 37).

**Open questions.** Which inbound channels exist at the target customers (shared AR mailbox, WhatsApp Business) determines the first collectors; the documents do not survey this.

### 8. Knowledge-base defaults and memory store (Bailian)

**Purpose.** Retrieve from policy documents and contracts with known, tunable defaults, and give agents a durable scratch memory that is versioned. Receivables example: the customer's credit policy PDF is chunked at 512 tokens by heading; the collections agent's memory file `/accounts/acme/notes.md` records "prefers WhatsApp; AP clerk is Siti", with every edit versioned.

**Design to implement.**
- **Chunking defaults** [Fact, 08 §2]: smart split default; max chunk 600 tokens (range 10 to 6,000); recommended FAQ 256 by length, manual 600 smart split, long report 2,048 smart split, contract 512 by heading. Chunks listable, updatable, deletable by API.
- **Retrieval** [Fact, 08 §2]: optional query rewrite; vector TopK and keyword TopK each 1 to 100; rerank (qwen3-rerank family or none); max recall 1 to 20 globally and per source; similarity threshold per source 0.01 to 1.0; at most 15 knowledge bases per retrieval service, each weighted; lowering initial TopKs reduces rerank cost. Fusion formula undocumented [Unverified]; use RRF k=60 from section 7.
- **Metadata** [Fact, 08 §2]: at most 5 fields per knowledge base, English letters and underscores; value methods constant, variable, LLM, regex, keyword; two flags per field ("use in retrieval", "use in answer"). Receivables fields: `customer_id`, `doc_type`, `effective_date`, `entity`, `language` [Inference].
- **Do not lock at creation.** Bailian locks metadata (and per one page chunking and embedding) at creation; version index configurations and rebuild in the background instead [Fact for the lock and the advice, 08 §2 and What to copy 17].
- **KB call mode**: "always" (search before first inference) or "intelligent" (model decides) [Fact, 08 §3]. Use "always" for the collections agent's policy KB, so the dunning policy is always in context [Inference].
- **Memory store** [Fact, 08 §4]:
  - path-addressed UTF-8 files, ids `mem_`, store ids `memstore_`; max 102,400 bytes per file;
  - every create, modify or delete makes a version; versions listable; "redact" erases a version's body permanently;
  - optimistic `content_sha256` precondition, conflict on mismatch;
  - mounts fixed at session creation, `read_only` or `read_write`, at most 8 per session, each with `instructions` (≤4,096 characters) saying when to search;
  - access only through Glob, Grep, Read, Write, Edit; shell cannot reach memory paths;
  - listing filters by path only; archiving irreversible;
  - credentials must not be stored in memory.
  - [Inference] Implement as a Postgres table `memory_file (tenant_id, store_id, path, version, body, sha256, redacted)` under RLS, with tools that mirror those five operations. Mount the per-customer store read-write for the collections agent and the tenant policy store read-only.
- **Memory service option** [Fact, 08 §4]: fact memory, skill memory and schema-driven user profiles (`name`, `description`, `attributes[]`); extraction asynchronous, so the first read may be empty; conflict rules undocumented. [Inference] Do not copy the service; the three-state merge (section 7) covers profile facts with documented rules.
- **Agent definitions** [Fact, 08 §3]: every save increments `version`; a session pins the version it started with; updates are full replacements guarded by an optimistic lock; agents can be archived, not deleted; publishing shows a diff and allows rollback (Agent 2.0). ReAct loop capped at 1 to 50 rounds; short-term memory 0 to 30 turns.
- **Evaluation sets** [Fact, 08 §3]: types agent, workflow, trajectory (`input`, `reference_output`, `trajectory`), custom; up to 10 versions kept; must be published before use; column types frozen once data exists. Copy for the per-tenant test set (25 row 25).
- **Tool approval**: "always allow" or "ask each time" [Fact, 08 §3].
- **Credential placeholders**: `${variable}` substituted by the gateway only for configured domains and only in the Authorization header [Fact, 08 §3]. Copy for the accounting-system and email API keys [Inference].

**Copies.**
- 08, §2 KB and RAG pipeline. https://help.aliyun.com/zh/model-studio/rag-knowledge-base ; https://help.aliyun.com/zh/model-studio/rag/chunking ; https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval
- 08, §3 Agent 2.0, evaluation, managed agents. https://help.aliyun.com/zh/model-studio/new-single-agent-application ; https://help.aliyun.com/zh/model-studio/agenteval-evaluation-set ; https://help.aliyun.com/zh/model-studio/managed-agents-agent-definition ; https://help.aliyun.com/document_detail/2679100.html
- 08, §4 memory store and memory service. https://help.aliyun.com/zh/model-studio/managed-agents-memory-store ; https://help.aliyun.com/zh/model-studio/long-term-memory-2-0 ; https://docs.agent.bailian.aliyun.com/zh/memory/user-profile

**Left out, and why.** Image, audio and video knowledge bases; the "visual understanding" no-chunk mode; Bailian's hosted vector storage (stack is Postgres) [Inference]. The "Dreaming" post-session consolidation [Fact that it exists, 08 §4]: no documented mechanics.

**Open questions.** Bailian's default TopN and threshold values were not found [Unverified, 08 Open questions]; start values must be chosen by testing.

### 9. Grounding with business terms, synonyms and routing (Quick BI knowledge base)

**Purpose.** Map the words staff use to exactly one metric or object, deterministically. Receivables example: "past due", "overdue" and "tertunggak" all map to `overdue_amt`; the question "how much is overdue at Penang branch" routes to the receivables topic and the branch dimension.

**Design to implement.**
- Four rule types, from Quick BI [Fact, 07 §6]:
  1. **business logic**: term, definition (≤100 characters), interpretation (≤300 characters in the enterprise knowledge base; ≤3,000 in the dataset knowledge base), synonyms, scope, optional forced rewrite;
  2. **regex**: Python-style regex ≤100 characters (implement with JavaScript regex [Inference]);
  3. **dataset selection**: keyword to up to 10 datasets;
  4. **smart table selection**: an LLM prompt describing each table's facts, grain, period and relationships, as a last resort.
- Precedence: dataset (local) knowledge overrides enterprise (global) knowledge [Fact, 07 §6].
- **No fuzzy matching**: the question must contain the term or a synonym [Fact, 07 KF 9]. Copy this. If no term matches, the system asks a clarifying question (section 11) rather than guessing [Inference].
- Bulk import and export via CSV or XLS ≤5 MB [Fact, 07 §6].
- **Scoped topics ("albums")** from Dataphin X-Analytics [Fact, 07 §5]: each question runs against an explicit set of tables, business knowledge, prompts and example questions; fields are labelled dimension, metric or statistical date and linked to entities. Version 1 has two topics: Receivables and Collections activity [Inference].
- **Dataset preparation** [Fact, 07 §6]: a default aggregation per measure; up to 10 expert ("quick") questions per topic; per-user Q&A permission with expiry; automatic field-quality scoring with suggested edits; guidance to put units in field names and avoid time-specific field names; learn dimension values (customer names, branch names) so they can be matched exactly.
- Dimension-value matching [Inference]: exact or alias match on learned values. The 2024 ChatBI did fuzzy name matching ("小郑" to "郑强") [Press, 07 §6]; the current documentation says no fuzzy matching. Allow aliases a human has confirmed, not fuzzy guesses.
- Glossary lives in the model, versioned with draft and publish (section 5), and synonyms are part of the record so citations can name them (25 row 17).

**Copies.**
- 07, §6 Quick BI knowledge, dataset preparation. https://help.aliyun.com/zh/quick-bi/user-guide/knowledge-base-configuration ; https://help.aliyun.com/zh/quick-bi/user-guide/prepare-data
- 07, §5 X-Analytics albums. https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis
- 25, C6 row 17.

**Left out, and why.** Dimension-value "learning caps" and rewrite modes: Quick BI does not publish the cap, and a 1,000-customer ledger is small [Inference].

**Open questions.** Which limit to use for interpretation text: 300 or 3,000 characters (see Contradictions).

### 10. Answering through query plans and typed plan steps (UModel query-plan service, KAG solver)

**Purpose.** The model never writes free SQL against tables. It asks the semantic layer for a plan, and a deterministic executor runs that plan under the user's rights; multi-step questions are broken into typed steps with arithmetic done in code. Receivables example: "which five customers drove the DSO increase since last month?" becomes: retrieve DSO by customer for two periods, compute the differences in code, sort, output, with each step's query shown.

**Design to implement.**
- **Plan, not data.** UModel's query service returns a plan JSON v1 envelope with `mode`, `version`, `operation`, `next_action: execute_query`, `data_source`, `query`, `time_range` [Fact, 08 §7]. The open-source server is plan-only; `mode=data` returns NOT_IMPLEMENTED [Fact, 08 §7].
- [Inference, adapting to the founder's rule that agents work through the model] Keep the plan envelope, but the executor is part of this product, not the agent. Tool `get_metric_plan(metric, period, filters, grain)` returns the envelope; tool `execute_plan(plan_id)` runs it with the asking user's Postgres role so RLS applies, and returns rows plus the executed SQL. The agent can read the plan but cannot edit its SQL.
- **Typed steps** from KAG [Fact, 08 §8]:
  - `Retrieval(s, p, o, filters)`: here, a metric plan or an object query;
  - `Math(content, target) -> alias`: KAG has the LLM write Python run in a subprocess with a timeout and error feedback;
  - `Deduce(op = judgement | entailment | extract | choice | multiChoice, content, target) -> alias`;
  - `Sort` (min/max, limit), from the paper;
  - `Output(alias)`;
  - exactly one action per step; aliases threaded between steps; type and name given only at first reference.
- Loop [Fact, 08 §8]: planner, then reasoner per sub-query, then a judge asks "resolved?", then a supplementary query, repeating until resolved, then a generator. Cap rounds [Inference: Bailian caps ReAct at 1 to 50; pick a low default such as 8].
- **Arithmetic in code, sandboxed.** KAG's executor runs on the host interpreter with only a timeout, which is not isolation [Fact and Inference, 08 What cannot be copied]. [Inference] Prefer SQL for arithmetic over metric results; where code is needed, run it in an isolated sandbox with no network.
- **Layered trust** from KAG [Fact, 08 §8]: curated schema-constrained knowledge first, then extracted facts of the same types, then raw chunks; every node links to its chunk. Receivables mapping [Inference]: governed metrics and synced objects first; extracted facts from emails (section 7) second; raw email and document chunks last, and an answer must say which layer each claim came from.
- **Multi-candidate SQL** (2 to 5 candidates, pick the best) and LLM repair of failed SQL in the right dialect, as an optional mode [Fact, 07 §5]. [Inference] In this design candidates are alternative *plans* (different metric or grain choices) since SQL comes from the compiler; keep it a toggle because it costs latency.
- Input ≤2,000 characters; last 20 conversations kept per topic [Fact, 07 §5].
- Separate model choice for reasoning and for interpretation [Fact, 07 §6]. With Qwen's Anthropic-Messages-compatible endpoint, one client can drive both Claude and Qwen [Vendor claim, 08 KF 12].

**Copies.**
- 08, §7 UModel runtime and agent access: plan envelope, plan-only server, `.entity_set` methods, capabilities. https://github.com/alibaba/UnifiedModel (CHANGELOG 0.2.0, 0.4.0) ; https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674
- 08, §8 KAG logical-form solver, mutual indexing. https://github.com/OpenSPG/KAG (`kag/solver/prompt/logic_form_plan.py`, `kag/solver/executor/math/py_based_math_executor.py`) ; https://arxiv.org/html/2409.13731v3
- 07, §5 X-Analytics candidate SQL and repair; §6 model choice.

**Left out, and why.** KAG's benchmark claims as evidence: backbones differ and the gains are attributed to opposite datasets in two places [Fact, 08 KF 8]. Fine-tuned planner models: models are rented [25 row 24].

**Open questions.** UModel reports +10 to 20 points on DataAgentBench with the semantic layer [Vendor claim, 08 §7]; the product needs its own test set to know its accuracy.

### 11. Answer transparency (business logic and executed query) and clarification (Quick BI)

**Purpose.** Every number comes with the definition used, the query that ran, the owner and the freshness, and the system asks instead of guessing when the period or metric is missing. Receivables example: "what's overdue?" gets "Which date: today, or month end? And for which entity?" if the tenant has more than one entity; the answer then shows the metric `overdue_amt`, its definition text, owner "Finance Manager", period dates, data as of 06:00, and the SQL.

**Design to implement.**
- Show both the **business-logic query** (the metric expression with period and qualification resolved) and the **executed SQL** [Fact, 07 §6].
- **Clarification** when the period or metric is missing or ambiguous [Fact, 07 §6]. [Inference] Trigger rules: no period term matched; more than one metric matched with equal precedence; a dimension value unmatched.
- **Trace id** per answer; like or dislike feedback, with a reason [Fact, 07 §6 and What to copy 12]. One follow-up per question in Quick BI [Fact, 07 §6]; [Inference] this product can allow more, since threads are kept.
- **Permission-aware previews**: return only columns the user may SELECT, at most 50 rows in previews; run SQL only if the topic allows execution [Fact, 07 §5].
- Limits worth copying [Fact, 07 §6]: attribution only for a single date dimension; forecasting needs at least 12 date points. [Inference] The cash-forecast feature is version 2 (25 row 43), so this applies later.
- Citation block per answer [Inference, combining 07 KF 8 and 25 row 14]: metric id and version, definition text, business owner, rule ids and versions used, period resolved dates, data freshness, quality status (section 6), trace id.
- Saved analyses re-run under the viewer's rights, as Palantir's AIP Analyst does [Fact as listed, 25 A2.5].

**Copies.**
- 07, §6 Answering. https://help.aliyun.com/zh/quick-bi/user-guide/user-guide-for-smart-q-a
- 07, §5 X-Analytics. https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis
- 25, C6 row 14; A2.5 AIP Analyst (file 03 §18 per 25).

**Left out, and why.** Quick BI's charting: version 1 has one fixed dashboard (25 row 13).

**Open questions.** None beyond section 10.

### 12. Allowed actions as runbooks with risk level and allowed tools (UModel RunbookSet)

**Purpose.** Every write and every outbound message is a typed action bound to an object type, with a risk level, an approval rule and a list of tools it may use. Receivables example: `send_reminder` on Invoice is medium risk, needs approval until its template has earned auto-send, and may use only the email-send tool; `propose_payment_plan` is high risk and always needs approval.

**Design to implement.**
- RunbookSet fields to copy [Fact, 08 §7]: `actions`, `action_type`, `risk_level`, `confirmation_required`, `allowed_tools`, `inputs`/`outputs`, `observations`, `conclusions`, `knowledge`, `toolkits`, `skills`. RunbookSet is marked experimental [Fact, 08 §7].
- Defaults: read tools on; write tools off or needing explicit authorisation [Fact, 08 KF 5].
- Binding: runbooks link to entity types through `runbook_link` [Fact for the link kind, 08 §7].
- Version-1 action list, from 25 row 8: send reminder, log promise, record dispute, pause dunning, escalate, propose payment plan, mark paid, write note back to the accounting system. Each with parameters, permission and preconditions [Fact as a list, 25].
- Risk levels [Inference, since Lingyang's four grades are not public, 07 KF 12]: `read`, `draft` (generate only), `internal_write` (change product-owned objects), `external` (anything that leaves the building or writes to the accounting system). This mirrors 07's inferred action kinds (read/query, generate, write back, reach out), which line up with the founder's notes but are not published by Lingyang [Inference, 07 §3].
- Approval policy, from 25 row 9: everything sent externally is approved until a template earns auto-send; payment plans and write-offs always approved. AgentOne's stated policy: standard actions under rules; funds and major decisions need human confirmation [CLAIM, 07 §3]; LatePost adds that high-risk actions go to the owner for approval [Press, 07 §3].
- Execution path [Fact for the pattern, 08 §6 SendGuard]: the agent drafts; the host executes after approval; at send time re-read the approved draft by id and compare its hash; pass an idempotency key; on a permission error revoke the grant and fall back to drafting.
- Preconditions read quality status: any strong-rule block on inputs refuses the action (section 6).
- Action log, from 25 row 10: every action and every approve or reject stored with user, agent, inputs, rule version and outcome. This log is the evaluation set (section 14).
- Per-caller tool narrowing [Fact, 08 §10]: Higress intersects a static `allowTools` with a per-request header set by the auth layer. Copy as: effective tools = runbook `allowed_tools` ∩ the agent role's tools ∩ the user's permissions [Inference; Palantir's equivalent is user ∩ app ∩ scope, 25 A2.6].
- Never expose a raw SQL execute tool. Higress's database-to-MCP server registers `execute` always and its "read-only" `query` passes raw SQL with no statement check [Fact from code, 08 KF 13, §10].
- RCA-style evidence rule, adapted from UModel's skill [Fact, 08 §7]: a conclusion counts only with a plausible mechanism, a path in the model and correctly timed data, and every conclusion is cited. [Inference] Apply to escalation proposals: "escalate because three reminders unanswered and promise missed on date X", each item linked.

**Copies.**
- 08, §7 Actions and RCA method. https://github.com/alibaba/UnifiedModel (`expanded_schemas/runbook_set.expanded.yaml`, `skills/umodel-rca/SKILL.md`) ; https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674
- 08, §6 SendGuard and grants. https://github.com/openTrinity/mycontext (`packages/persona/src/send-guard.ts`)
- 08, §10 Higress tool narrowing and the database-to-MCP warning. https://higress.cn/ai/en/mcp-server
- 07, §3 AI Operations safety statements. https://news.mydrivers.com/1/1139/1139921.htm ; https://finance.sina.cn/stock/jdts/2026-08-04/detail-inimekpf5165695.d.html
- 25, C6 rows 8, 9, 10.

**Left out, and why.** Voice calls (25 row 19: never in version 1).

**Open questions.** The rule by which a template "earns auto-send" (approval count, approval rate, time) has no source; it must be designed [Inference].

### 13. Role-packaged AI employees: data, knowledge, tools, permissions, evaluation metric

**Purpose.** Sell and govern agents as named jobs, each with exactly what it needs and one measure of success. Receivables example: "Collections Agent" has the AR objects, the dunning policy KB, the eight actions, a service identity limited to reminders and replies, and is measured on promise-kept rate and approval rate.

**Design to implement.**
- AgentOne's role-based design (岗位化): each AI employee is configured with data, knowledge, tools, permissions and evaluation metrics for one job [CLAIM, 07 §3]. Bundle record [Inference]: `{role_id, data_scope (entity types and topics), knowledge (KB ids, glossary scope, memory mounts), tools (runbook ids), permission_identity, evaluation_metrics[], agent_definition_version}`.
- HR-style identity from QwenWork digital employees: name, department, owner, duties, authorisation scope, lifecycle, admin disable; every execution record traces to that identity [Vendor claim, 08 §5].
- Identity rules, from 25 row 27: internal agents act as the asking user (Quick BI's `user_token` defines data scope [Fact, 07 §6]; the Alibaba Cloud CIO principle that an agent acting for an employee inherits that employee's permissions [Fact as reported, 07 What to copy 13]); the external agent acts as a service identity limited to reminder and reply actions.
- Version 1 ships two fixed roles, not a builder (25 row 21): **Finance Analyst** (internal: questions, weekly report) and **Collections Agent** (external: reminders, reply classification, proposed actions).
- Evaluation metric per role [Inference, from the role principle plus 25 rows 10 and 25]: Finance Analyst: answer like rate and test-set pass rate. Collections Agent: draft approval rate, promise-kept rate, days from due date to first contact.
- Know-how packaging: QwenWork "expert kits" bundle skills, connectors and workflows per role; organisation-level skills preserve method when staff leave [Vendor claim, 08 §5]. LatePost: industry know-how packaged as Skills [Press, 07 §3]. [Inference] Ship each role with a skill file describing the dunning cadence, editable by the finance owner through draft and publish.
- Distribution: offer the agent interface as an MCP server and a Skill package using the user's own token (25 row 23; Quick BI Skill credentials api_key, api_secret, user_token, server_domain [Fact, 07 §6]).
- Agent seats gated separately from viewing seats: in Quick BI members without an agent seat cannot use agents [Fact, 25 B2.5].
- Phasing from Yadi's delivery: agent workbench and summaries first, then bots [Press, 07 §3]. [Inference] Launch the Finance Analyst and draft-only collections first; turn on sending after approval history exists.

**Copies.**
- 07, §3 AgentOne official architecture and AI employee behaviours. https://help.aliyun.com/document_detail/3004555.html ; https://news.mydrivers.com/1/1139/1139921.htm
- 08, §5 QwenWork digital employees and expert kits. https://tech.ifeng.com/c/8wd2EoDIYv7 ; https://www.ifanr.com/1673691
- 07, §6 Quick BI Skill. https://help.aliyun.com/zh/quick-bi/user-guide/quick-bi-open-skill-manual
- 25, C6 rows 21, 23, 27; What to copy 4 and 8. https://help.aliyun.com/zh/quick-bi/user-guide/smartq

**Left out, and why.** AI Sales, AI Marketing, AI Operations roles; custom "X employees"; multi-agent expert groups (25 row 46: never).

**Open questions.** AgentOne's role configuration has no published mechanics [CLAIM, 25 KF 6], so the bundle schema above is designed, not copied.

### 14. Which decisions to automate (what Palantir's customer cases imply)

**Purpose.** Pick recurring operational decisions, put a recommendation in front of the person who owns each one, log accept or reject, and measure cycle time. Receivables example: each morning the Collections Agent proposes "who to contact today, by which channel, with which template" for every overdue invoice; the collector approves or rejects, and the product reports time from due date to first contact.

**Design to implement.**
- The repeated shape across 29 cases: unify sources into one object model; pick one recurring decision; surface a recommendation or agent draft to the human owner; record accept or reject; measure cycle time [Inference, 06 KF 8 and §14].
- Evidence for accept or reject logging: General Mills, over 70% of recommendations accepted [Vendor claim, 06 case 1]; NVIDIA captures planners' decisions as an evaluation benchmark [Vendor claim, 06 case 10]; Hertz workers' overtime answers feed the model [Vendor claim, 06 case 7]; Hexion commercial teams keep the decision [Vendor claim, 06 case 13].
- Results are reported as cycle time rather than dollars ("200 hours to 15 seconds", "3 months/30 people to 10 minutes") [Vendor claim, 06 KF 8].
- Order-to-cash is thin in the cases: pricing and finance show up only indirectly; a home-appliance maker expanded into "finance" without detail [Inference, 06 §5]. Palantir's AFC 360 mentions extending to "credit risk and collections" [Vendor claim, 25 A2.9]. Neither vendor sells receivables for mid-sized firms [Inference, 25 KF 10].
- Decisions to automate in version 1, ranked by frequency [Inference, mapping the pattern to 25 rows 8, 9, 11, 20]:
  1. next contact per overdue invoice (who, when, channel, template): recommendation, approve or reject;
  2. reply classification (paid, will pay on date, dispute, wrong contact) into a proposed action: recommendation, approve or reject;
  3. pause dunning when a dispute is open: rule-driven, automatic, logged;
  4. escalation proposal: recommendation, approve or reject;
  5. payment-plan proposal and write-off: always human (25 row 9).
- Decision record [Inference, from 06 What to copy 4]: `{decision_id, decision_type, object_ref, inputs_snapshot, recommendation, rule_versions, model, verdict (accept|reject|edit), verdict_by, verdict_at, edit_diff, outcome (later: paid on date)}`.
- Automatic value metrics [Fact as advice, 06 What to copy 6]: time to detect, time to approve, hours saved, computed by the product. Receivables: days from due date to first contact; days from first contact to cash; approval rate; promise-kept rate; DSO before and after.

**Copies.**
- 06, §4 named cases 1, 7, 10, 13; §5 recurring types; §14 implications; What to copy 4, 5, 6. General Mills study: https://www.palantir.com/assets/xrfr7uokpv1b/1aLBn65y83vdytjpXJKZcO/16989b788b34cb677f6d763d56a72349/Building_an_Intelligent_AI-Driven_Supply_Chain_at_General_Mills_-_AIPCon_March_-24_Impact_Study.pdf ; AIPCon 11: https://www.investing.com/news/transcripts/palantir-at-aipcon-11-ai-shifts-from-talk-to-operations-93CH-4896825 ; Hertz: https://www.cio.com/article/4018601/hertz-adopta-la-ia-para-la-gestion-de-flotas-y-personal.html
- 25, A2.9 AFC 360. https://www.palantir.com/assets/xrfr7uokpv1b/4JcZrw9n5Gw4XDAOA9cxFm/ad94f841995570025dbf5622677ab98c/Palantir_Foundry_for_Anti-Financial_Crime_360.pdf

**Left out, and why.** Post-training on decision logs ("sovereign AI"): needs GPUs and ML staff; copy only the capture of decisions as an evaluation set [Inference, 06 §14].

**Open questions.** No case gives a receivables acceptance-rate baseline; the first pilots must set one.

### 15. Credit-based pricing mechanics

**Purpose.** Charge for rented-model usage through a pooled credit wallet with published rates, so cost cannot outrun price. Receivables example: a tenant with 5 seats gets a monthly credit pool; each answer, draft and sent message debits credits at a model-tier multiplier; when the pool runs out, new agent runs stop while already-approved sends finish.

**Design to implement.**
- Seat plus pooled credits, from the AgentOne Data Analysis Agent [Fact, 25 B2.3, B2.12]: CNY 300 per seat per month; minimum 5 seats in steps of 5; 8,000 credits per seat per month (100,000 a year on annual plans) in a shared pool; top-up CNY 10,000 per 1M credits (CNY 0.01 per credit); add-ons priced in credits per year; included allowances.
- Wallet rules from QwenWork [Fact, 08 §5]: each seat adds 2,000 credits a month into a shared pool; no rollover; packs last one year; deduction order: seat credits first, then packs by earliest expiry; seats added mid-period prorated; reductions at renewal; no direct downgrade.
- Per-model multipliers: 0.1× economy, 0.25× basic, 1× advanced, 1.1× top model [Vendor claim via press, 08 §5].
- Palantir's metering: LLM tokens converted to compute-seconds per model; minimum charges per Ontology query (2 to 18 compute-seconds); overage invoiced once it reaches $1M [Fact as listed, 25 A2.11]. [Inference] Copy the idea of a minimum charge per query so tiny calls still cover fixed cost.
- Hard caps without surprise bills: Palantir's Developer Tier limits cannot be exceeded by accident and capacity shows on a "Your Plan" page [Vendor claim, 06 §7].
- Exhaustion behaviour: for the ad-creative agent, service may stop when credits run out [Fact, 25 B2.3]. [Inference] For collections, stopping mid-cadence is a business risk: block new runs and new drafts, allow already-approved sends to finish, alert the admin at 80% and 100%.
- Capacity limits per agent: Palantir has TPM and RPM limits by project and user with 20% reserved for interactive use [Fact as listed, 25 A2.5]. [Inference] Per-agent daily credit caps plus a reserved share for interactive questions.
- Ledger [Inference]: `credit_grant (tenant_id, source seat|pack|trial|promo, amount, starts_at, expires_at)`, `credit_debit (tenant_id, grant_id, event_id, model, tokens_in, tokens_out, multiplier, credits)`, debits allocated in the QwenWork order.
- Price shape for version 1, from 25 row 41: platform fee per tenant plus credits, priced against the receivables handled; never outcome-only pricing at the start.
- Trial: a starter pack, as Lingyang's 150,000-credit pack (about CNY 1,500 at the Data Analysis Agent rate [Inference, 25 B2.12]).

**Copies.**
- 25, B2.3 and B2.12 AgentOne prices. https://help.aliyun.com/en/document_detail/3029849.html ; https://help.aliyun.com/en/document_detail/3026326.html
- 08, §5 QwenWork enterprise credits. https://help.aliyun.com/zh/qwenwork/product-faq ; https://www.ifanr.com/1673691
- 06, §7 Developer Tier. https://community.palantir.com/t/why-can-i-only-add-up-to-5-users-in-palantir-foundry/3911
- 25, A2.11 Palantir meters; C6 rows 36 and 41.

**Left out, and why.** Outcome-linked "free until results" deals: need capital [Press, 07 §3; 25]. Per-shop quotas: e-commerce specific [Inference].

**Open questions.** The credit cost of one reminder, answer or classification has no source; it must be measured in pilots. Whether to price in MYR, USD or both.

### 16. Delivery sequence turned into a self-setup flow (diagnosis, seven-day build, before and after report)

**Purpose.** Replace forward-deployed engineers with a fixed, mostly self-serve setup that proves value on the buyer's own ledger within days and ends with a before and after report. Receivables example: on day 0 the finance manager uploads an ageing report; the product shows the "before" (overdue amount, DSO, invoices with no contact in 30 days); two weeks later it shows the same figures for the share of the ledger it ran.

**Design to implement.**
- Lingyang's seven-day programme [Press, 07 §3]: (1) topic selection with the company; (2) mapping data, processes, systems and acceptance metrics; (3) build and validate on AgentOne, then the knowledge base and agent; (4) handover with a before/after comparison report. Resources: free one-day FDE diagnosis and a 150,000-credit starter pack. Benchmark: 110+ operating metrics across 5 segments mapped in 7 days for a 150-store company.
- Palantir's bootcamp: 1 to 5 days; stage 1 intuition, stage 2 hands-on, stage 3 deploy initial use cases and plan the MVP; ends with a written plan [Vendor claim, 06 §7].
- 25 row 39: a fixed two-week pilot: connect data, map the template, run reminders on a share of the ledger, report collected amount and DSO before and after.
- Self-setup flow [Inference, combining the above]:
  1. **Diagnosis (day 0, self-serve).** Upload an ageing export or connect read-only. The product computes the baseline metrics and freezes them as the "before" snapshot. Output: a one-page diagnosis.
  2. **Acceptance metrics (day 0).** The buyer picks 2 or 3 from the metric set (DSO, collected amount, promise-kept rate, days to first contact). Copy Lingyang's co-defined acceptance metrics.
  3. **Connect and map (days 1 to 2).** Map the customer's fields onto the template with input mapping, as Palantir's Marketplace installs a packaged use case with input mapping [Fact as listed, 25 A2.4]. Run strong quality checks; nothing proceeds while one fails.
  4. **Policy and glossary (day 3).** The finance owner edits the dunning table, templates and glossary, then publishes.
  5. **Shadow mode (days 4 to 7).** Drafts only; the collector approves or rejects; the approval log fills.
  6. **Live on a share of the ledger (days 8 to 14).** Sending on for the chosen share; everything still approved.
  7. **Report (day 14).** Before and after on the chosen metrics, plus approval rate and time saved.
- Trial safety: outbound sending disabled until approval (25 row 40).
- Founder runs onboarding personally for the first customers, then replaces it with an onboarding assistant that maps fields and proposes them for approval (25 rows 34 and 42).

**Copies.**
- 07, §3 seven-day programme. https://www.sohu.com/a/1080187818_115035
- 06, §7 bootcamps. https://www.hannovermesse.de/apollo/hannover_messe_2024/obs/Binary/A1354173/Palantir%20AIP%20Bootcamp.pdf
- 25, C6 rows 34, 35, 39, 40, 42; What to copy 1 and 2. https://www.palantir.com/docs/foundry/foundry-devops/create-products

**Left out, and why.** On-site interviews at Yadi scale (78 interviews, 24 days) [Press, 07 §3]: does not fit a solo founder.

**Open questions.** Whether 14 days is long enough to see payments move on 30-day terms; the documents give no collections baseline [Inference].

### 17. The acquire, expand, scale model and pilot economics

**Purpose.** Track each account's phase and contribution so the founder knows which pilots pay back, and design expansion paths in advance. Receivables example: a 300-staff distributor starts on one legal entity (Acquire), adds two more entities and three collectors (Expand), and becomes profitable once onboarding time stops being logged against it (Scale).

**Design to implement.**
- Palantir's phases [Fact, 06 §6]: Acquire = revenue under $100K a year; Expand = over $100K with negative contribution margin; Scale = over $100K with positive contribution margin. 2019: Acquire $0.6M revenue and a $65.4M loss; Expand (43)% margin; Scale 55%. Company contribution margin rose from 14% (2018) to 73% (Q3 2026).
- Contribution = revenue minus cost of revenue minus sales and marketing, excluding stock comp; costs allocated to accounts by headcount and time spent [Fact, 06 §1].
- Customer = any organisation billed in the trailing twelve months; NDR excludes customers acquired in that window; report expansion revenue separately from new-logo revenue [Fact and advice, 06 §2, §3, What to copy 1].
- Expansion routes [Fact, 06 §6]: more divisions, more users, partners and suppliers, cross-industry capabilities. 25 What to copy 10 maps them to collections: more entities, more collectors, the customers' own portal.
- Pilot facts: Palantir funds bootcamps and pilots with no guarantee of return; sales cycle 6 to 9 months; pilots of 8 to 12 weeks; recent pilots convert from $1M to $3M into $11.5M to $29M ACV [Fact and Vendor claim, 06 §7, KF 6]. Lingyang's starter pack is worth about CNY 1,500 [Inference, 25 B2.12].
- Implementation [Inference]:
  - per tenant: `revenue_ttm`, `model_cost_ttm` (from the credit ledger), `founder_hours_ttm` (a time log, as Palantir allocates by time spent), contribution, phase;
  - thresholds scaled to this segment, set by the founder (Palantir's $100K is not meaningful here);
  - a customer-specific-work log, promoted into the core monthly, from the Delta/Dev split (06 What to copy 7).
- Contract shape: short initial terms that expand (06 What to copy 10).

**Copies.**
- 06, §6 S-1 model; §1 contribution definition; §3 NDR; §7 pilots; What to copy 1, 2, 7, 10. https://www.sec.gov/Archives/edgar/data/1321655/000119312520230013/d904406ds1.htm ; https://www.sec.gov/Archives/edgar/data/0001321655/000132165526000048/pltr-20260930.htm ; https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87
- 25, What to copy 10.

**Left out, and why.** Funding pilots at a large loss; SPAC-linked deals; FDE teams [06 What cannot be copied].

**Open questions.** Phase thresholds for this segment; trial-to-paid conversion has no benchmark (Palantir's bootcamp conversion is unsourced at about 75% [Unverified, 06 §7]).

### 18. The 47-row Palantir vs AgentOne comparison, reduced to what version 1 needs

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
## Function checklist

Every item in document 25's catalogues (Parts A2 and B2) is carried over, in 25's order, followed by the extra functions from documents 07 and 08 that 25 does not list. "Who" uses P = Palantir, L = Lingyang (AgentOne, Dataphin, Quick BI, Quick Audience), A = other Alibaba or Ant (document 08). Version: V1, V2, or Never for this product. All version verdicts and reasons are [Inference]; where 25 row C6 gave a verdict, it is followed and the row number cited.

### Palantir platforms (25 A2.1)

| Function | Who | Version | Reason |
|---|---|---|---|
| Foundry (data operations platform) | P | Never as a platform; V1 for minimal sync + snapshots | Receivables need one or two sources (C6 rows 1, 2) |
| AIP (LLMs and agents on the model) | P | V1 (the product's core idea) | Agents work through the model |
| Ontology (objects, links, logic, actions; API gateway) | P | V1 | Core (C6 row 5) |
| Apollo (continuous delivery across clouds, on-prem, edge) | P | Never | SaaS only (C6 row 37) |
| Gotham (defence and intelligence apps) | P | Never | Irrelevant segment |
| AI Mesh (naming of the combination) | P | Never | Branding only |
| Warp Speed (manufacturing OS) | P | Never | Not receivables |
| FedStart (ISVs in Palantir's federal environment) | P | Never | US government only |
| Mission Manager | P | Never | Federal; function unverified |

### Palantir data integration (25 A2.2)

| Function | Who | Version | Reason |
|---|---|---|---|
| Data Connection (connectors, agents, workers) | P | V1 (one accounting connector, CSV, bank import) | C6 row 1 |
| Virtual tables (query in place) | P | Never | Customers do not run Snowflake or Databricks at this size |
| Managed Iceberg tables and REST catalog | P | Never | Postgres only |
| Exports | P | V1 (dashboard export) | C6 row 13 |
| Webhooks and HTTPS listeners | P | V1 for inbound email and messaging webhooks | Reply handling, C6 row 20 |
| Datasets with transactions | P | V1 (append-only sync snapshots) | C6 row 2 |
| Change data capture | P | V2 | C6 row 3 |
| Streams (Flink) | P | Never | Daily cadence |
| Media sets | P | Never | C6 row 44 |
| Pipeline Builder with LLM nodes | P | Never | C6 row 2 |
| Code Repositories and transforms | P | Never | No customer code |
| Code Workspaces (Jupyter, RStudio) | P | Never | No data scientists in segment |
| Builds and schedules | P | V1 (compiled views refreshed on sync, §5) | Minimal |
| Branching and Global Branching | P | Never (draft vs published only) | C6 row 33 |
| Data Lineage and Workflow Lineage | P | V1 (dependency graph from publish, §5) | Needed for quality blocking |
| Data Health, expectations, monitoring views | P | V1 | C6 row 4 |
| Time Travel in Dataset Preview | P | V2 | Snapshots allow it later |
| SQL Studio | P | Never | No raw SQL for users |
| Data catalog | P | Never | One template |

### Palantir Ontology and developer surface (25 A2.3)

| Function | Who | Version | Reason |
|---|---|---|---|
| Object types, properties, value types | P | V1 | §1 |
| Link types | P | V1 | §1 |
| Interfaces | P | V2 | Only if Invoice/CreditNote need shared shape |
| Object sets and search-around | P | V1 (object queries through plans) | §10 |
| Action types with validation and writeback | P | V1 | C6 row 8, §12 |
| Functions (derived values) | P | V1 via rules and metrics, not user code | §2, §3 |
| Action log and edit history | P | V1 | C6 row 10 |
| Ontology Manager, proposals, migrations | P | V1 minimal (draft/publish) | C6 row 33 |
| Object Views (page per object) | P | V1 (customer and invoice pages) | Collectors need them |
| Semantic search, media references | P | V1 for documents and emails linked to customers | §7, §8 |
| OSDK and REST API | P | V2 | C6 row 22 |
| Developer Console (OAuth clients, scoped tokens) | P | V2 | With public API |
| Ontology MCP | P | V1 | C6 row 23 |
| Consumer mode (external users) | P | V2 (customer portal) | Expansion route |

### Palantir applications (25 A2.4)

| Function | Who | Version | Reason |
|---|---|---|---|
| Workshop (low-code apps) | P | Never as a builder; V1 fixed approval inbox | One fixed UI |
| Slate | P | Never | No custom apps |
| Quiver | P | Never | C6 row 13 |
| Contour | P | Never | C6 row 13 |
| Object Explorer (bulk actions) | P | V1 minimal (bulk approve, bulk pause) | Collector efficiency |
| Vertex | P | Never | C6 row 44 |
| Map | P | Never | C6 row 44 |
| Notepad | P | V1 as the weekly report | C6 row 15 |
| Carbon (curated workspaces) | P | V1 implicitly (two role views) | Simple front door |
| Automate (triggers to effects) | P | V1 | C6 row 11 |
| Foundry Rules (business-authored, approved) | P | V1 | C6 row 7 |
| Machinery (process states and log) | P | V1 minimal | C6 row 12 |
| Scenarios | P | V2 | C6 row 43 |
| Solution Designer, AIP Architect | P | Never | No custom solutions |
| Pilot (AI app builder) | P | Never | One template |
| Insight (analysis and copilot) | P | V1 via Finance Analyst | C6 row 14 |
| Marketplace and DevOps (install with input mapping) | P | V1 | C6 row 35 |
| Tableau and Power BI connectors | P | V2 | Export first |
| Issues app, support tickets, Upgrade Assistant | P | V2 | Support by email at first |

### Palantir AI features (25 A2.5)

| Function | Who | Version | Reason |
|---|---|---|---|
| Model catalog (about 90 models) | P | V1 two providers | C6 row 24 |
| Bring your own model, compatible APIs | P | V1 (one adapter, Anthropic-Messages format) | Qwen speaks it [Vendor claim, 08] |
| Capacity management and rate limits | P | V1 | §15 |
| Markings-based LLM data control | P | V1 reduced to masking | C6 row 30 |
| AIP Logic (LLM functions, writes only via actions) | P | V1 | §12 |
| AIP Chatbot Studio | P | Never | C6 row 21 |
| Agent Builder, Manager, SDK | P | Never (builder); V2 (API) | C6 rows 21, 22 |
| Pro-code agents | P | V2 | C6 row 22 |
| Palantir MCP (builder tools via proposals) | P | V2 | Onboarding assistant, C6 row 34 |
| AIP Evals and Model Evaluations | P | V1 minimal | C6 row 25 |
| Automate with AIP (edits become proposals) | P | V1 | §12 |
| AIP observability (traces, token dataset) | P | V1 | C6 row 36 |
| AIP Document Intelligence | P | V2 | C6 row 18 |
| Ontology-augmented generation (retrieval) | P | V1 | §8, §10 |
| AI FDE | P | V2 | C6 row 34 |
| AIP Skills | P | V1 (role skill file) | §13 |
| AIP Analyst (citations, re-run under viewer rights) | P | V1 | §11 |
| AIP Assist (in-product help) | P | V2 | Nice to have |
| AIP Threads (document Q&A) | P | Never | Out of scope |
| AIP Evolve (optimise workflows) | P | Never | Needs fleets of agents |
| Boardroom (multi-agent) | P | Never | C6 row 46 |
| Realtime audio | P | Never in V1 | Voice excluded, C6 row 19 |
| Small AI helpers (NL to cron, regex helper) | P | V2 | Polish |
| Post-training open models | P | Never | C6 row 24 |

### Palantir security and governance (25 A2.6)

| Function | Who | Version | Reason |
|---|---|---|---|
| Multipass identity, SSO, groups | P | V1 email login; V2 SSO | Mid-sized buyers ask later [Inference] |
| Organizations and spaces (mandatory silos) | P | V1 (tenant isolation by RLS) | Multi-tenant SaaS |
| Projects and roles | P | V1 four roles | C6 row 26 |
| Markings and CBAC | P | Never | C6 row 29 |
| Restricted views, row-level policies | P | V1 (RLS) | C6 row 26 |
| Object and property security (cell level) | P | V1 "sensitive" field flag only | C6 row 29 |
| Action permissions and submission criteria | P | V1 | §12 |
| Scoped sessions and emulation | P | V2 | Admin testing |
| Checkpoints (justification) | P | V2 | C6 row 28 |
| Approvals (access and change requests) | P | V1 for publish and actions | §5, §12 |
| Audit logs | P | V1 | C6 row 31 |
| Data Lifetime (retention, deletion) | P | V2 | C6 row 32 |
| Sensitive Data Scanner | P | V2 | Masking rules first |
| Encryption and Cipher | P | V1 at rest and in transit; Never field-level Cipher | Standard SaaS |
| Application restrictions and scoped tokens | P | V1 (tool intersection, §12) | Agents cannot exceed remit |
| LLM data controls and log permissioning | P | V1 masking; logs under RLS | C6 row 30 |
| Privacy and civil liberties guidance | P | Never | Public-sector cover |
| Certifications (FedRAMP, IL5/6, CMMC, ISO, SOC 2) | P | V2 SOC 2 or ISO 27001 only | C6 row 38 |

### Palantir deployment (25 A2.7)

| Function | Who | Version | Reason |
|---|---|---|---|
| Managed SaaS on major clouds | P | V1 one region | C6 row 37 |
| Customer cloud single-tenant | P | Never | C6 row 37 |
| Self-hosted, on-prem | P | Never | C6 row 37 |
| Air-gapped and classified | P | Never | C6 row 37 |
| Edge | P | Never | C6 row 37 |
| Federal cloud | P | Never | Segment |

### Palantir services and programmes (25 A2.8)

| Function | Who | Version | Reason |
|---|---|---|---|
| AIP Bootcamp (1 to 5 days) | P | V1 as self-setup | §16 |
| AgentCamp | P | V1 folded into the pilot | §16 |
| Sovereign bootcamp | P | Never | Post-training excluded |
| Pilots (8 to 12 weeks) | P | V1 shortened to two weeks | C6 row 39 |
| Forward-deployed engineers | P | Never at scale | C6 row 42 |
| O&M, training, configuration services | P | V1 by founder, minimal | Early customers |
| Developer Tier (free, 5 users, hard caps) | P | V1 trial with hard caps | C6 row 40 |
| Learning portal and Speedrun | P | V2 | Docs first |
| Build with AIP: Examples (bring your own data) | P | V1 (sample ledger demo) [Inference] | Lowers barrier |
| AIP Now (prebuilt AI products) | P | Never as a catalogue | One template |
| AIPCon (customer conference) | P | Never | Scale |
| Foundry for Builders | P | Never | Failed precedent (06 §11) |
| Warp Speed cohorts | P | Never | Manufacturing |

### Palantir industry solutions (25 A2.9)

| Function | Who | Version | Reason |
|---|---|---|---|
| AFC 360 (AML/KYC; mentions collections) | P | Never, except its feedback-loop and audit-evidence ideas in V1 | Only "collections" is relevant |
| Foundry for Supply Chain (incl. working-capital management) | P | Never | Outside receivables |
| Program Oversight, Health Equity, Emergency, Medtech PDFs | P | Never | Not read; irrelevant |
| Warp Speed | P | Never | Manufacturing |
| ShipOS | P | Never | Defence |
| Defense OSDK | P | Never | Defence |
| Maven, Army agreement | P | Never | Defence |
| Recurring commercial patterns (allocation, scheduling, drafting) | P | V1 pattern only (§14) | The decision shape transfers |

### Palantir partner offers (25 A2.10)

| Function | Who | Version | Reason |
|---|---|---|---|
| AWS Marketplace listing (single unit) | P | V2 | Distribution later |
| UK G-Cloud | P | Never | Public sector |
| Microsoft classified clouds | P | Never | Defence |
| Oracle OCI | P | Never | Single cloud |
| Google Cloud FedStart | P | Never | Federal |
| Anthropic, OpenAI models and resale | P | V1 models only | Rented models |
| Accenture with SAP | P | Never | ERP migration |
| NVIDIA, Dell, Armada | P | Never | Edge |
| Cisco | P | Never | Network vendor |
| Fujitsu, SOMPO, HD Hyundai | P | Never | Regional JVs |
| Carahsoft | P | Never | US public sector |
| Zeta Global | P | Never | Marketing |

### Palantir editions and prices (25 A2.11)

| Function | Who | Version | Reason |
|---|---|---|---|
| Developer Tier free with caps | P | V1 | §15 |
| Unit subscription ($100K/unit placeholder) | P | Never | Price scale |
| Gotham per-unit on G-Cloud | P | Never | Segment |
| Meters (compute-seconds, tokens converted, per-query minimum) | P | V1 per-query minimum idea | §15 |
| Overage invoicing threshold | P | V2 | Top-ups first |
| $25M first deal; pilot conversions | P | Never | Scale |
| Forrester benchmark | P | Never | Not comparable |
| 1 to 5 year contracts, termination for convenience | P | V1 short initial terms | 06 What to copy 10 |

### AgentOne platform (25 B2.1)

| Function | Who | Version | Reason |
|---|---|---|---|
| AgentOne platform (build, deploy, govern agents) [CLAIM] | L | V1 narrow (two fixed roles) | C6 row 21 |
| "Data" pillar (meaning, traceable inputs/outputs) [CLAIM] | L | V1 | §3, §11 |
| Data semantics and ontology modelling [CLAIM] | L | V1 | §1 to §5 |
| "Agent" pillar (planning, memory, tools, logs) [CLAIM] | L | V1 | §8, §10, §12 |
| Role-based design (岗位化) [CLAIM] | L | V1 | §13 |
| Human confirmation for money and major decisions [CLAIM] | L | V1 | §12 |
| AI training ground [CLAIM] | L | V1 minimal (test set) | C6 row 25 |
| Built-in models (Qwen and others) [CLAIM] | L | V1 | Rented models |
| MCP and Skill integration [CLAIM; Quick BI DOC] | L | V1 | C6 row 23 |
| CRM/ERP connectors; one-click e-commerce data [CLAIM] | L | V1 accounting connector only | C6 row 1 |
| Alibaba ecosystem modules (TMIC, Amap, 聚石塔, 店小蜜) [CLAIM] | L | Never | C6 row 47 |
| Privacy computing and clean room [CLAIM] | L | Never | No data circulation |
| Low-code orchestration [CLAIM] | L | Never | C6 row 21 |
| Custom "X employees" (finance, legal, HR) [CLAIM] | L | V2 (a second finance role) | After two roles work |

### AgentOne AI employees by role (25 B2.2)

| Function | Who | Version | Reason |
|---|---|---|---|
| AI Sales (brief, minutes, CRM write-back, risk signals) [CLAIM] | L | Never; copy only "CRM write-back after approval" | Not receivables |
| AI Customer Service (outbound, tickets, appointments) [CLAIM] | L | V1 as Collections Agent, email and messaging only | C6 row 19 |
| AI Operations (patrol alerts, actions under rules, anomalies to groups) [CLAIM] | L | V1 "actions under rules"; V2 anomaly alerts | C6 rows 7, 16 |
| AI Marketing (audience, budget, creative) [CLAIM] | L | Never | C6 row 45 |

### AgentOne packaged agents (25 B2.3)

| Function | Who | Version | Reason |
|---|---|---|---|
| Experience Insight Agent (per shop quota) [DOC] | L | Never | E-commerce |
| 店小蜜 enterprise edition [DOC] | L | Never | Taobao |
| Livestream Inspection [DOC] | L | Never | E-commerce |
| Data Analysis Agent (seat + pooled credits; add-ons in credits) [DOC] | L | V1 pricing model; V1 Finance Analyst function | §15 |
| Ad-creative agent (credit editions) [DOC] | L | Never; copy "stop on empty credits" with changes | §15 |
| WinNexo Sales Operations [DOC named] | L | Never | Sales |
| E-commerce Operations Agent (tiered suggestions) [CLAIM] | L | Never | E-commerce |
| New Product Planning, Outbound Calling, Sales Ops, Financial User Ops agents [CLAIM] | L | Never (outbound calling: voice excluded) | C6 row 19 |
| Cultural Tourism Agent (AI G.O) [CLAIM] | L | Never | Industry |

### Dataphin (25 B2.4)

| Function | Who | Version | Reason |
|---|---|---|---|
| Data integration and sync | L | V1 minimal sync | C6 row 1 |
| Concept modelling (relation types) | L | V1 vocabulary | §1 |
| Specification modelling (metric grammar, design is development) | L | V1 | §3, §5 |
| Registered metrics | L | V1 | §3 |
| Data blocks (dev/prod or basic) | L | V1 as draft/publish | §5 |
| Development, scheduling, operations | L | Never | No warehouse |
| Asset quality (strong/weak) | L | V1 | §6 |
| Asset catalog, lineage, metadata | L | V1 lineage only | §5 |
| Data standards (word roots, code tables) | L | V2 | Fixed names first |
| Asset security (classification, masking) | L | V1 masking | C6 row 30 |
| Permissions and row-level permission | L | V1 | C6 row 26 |
| Data service (OneService API with call logs) | L | V1 call log with executed SQL; V2 public API | §5 |
| Tag factory | L | Never | C6 row 45 |
| Resource governance, asset operations | L | Never | Scale |
| Unstructured data processing | L | V2 | C6 row 18 |
| 超级X AI assistants (Engineering, Analytics, Ops, Quality, Catalog, ...) | L | V1 X-Analytics pattern; V2 X-Data Engineering-like onboarding | §10, C6 row 34 |
| Engines (MaxCompute, many semi-managed) | L | Never | Postgres only |

### Quick BI and 智能小Q (25 B2.5)

| Function | Who | Version | Reason |
|---|---|---|---|
| Editions (Personal to Professional, trial, seats) | L | V1 seat-gating idea | §15 |
| Dashboards, reports, screens, embedding | L | V1 one dashboard; Never general BI | C6 row 13 |
| 小Q问数 (Q&A with SQL transparency, clarification, trace id) | L | V1 | §11 |
| 小Q解读 (interpretation) | L | V1 within weekly report | C6 row 15 |
| 小Q报告 (report agent) | L | V1 | C6 row 15 |
| 小Q搭建 (build dashboards by chat) | L | Never | No BI builder |
| 小Q洞察 (attribution, metric-tree drill-down) | L | V2 | C6 row 16 |
| Agent seat assignment | L | V1 | 25 What to copy 8 |
| Knowledge base (terms, synonyms, regex, routing, no fuzzy) | L | V1 | §9 |
| Data preparation for Q&A (quality score, default aggregation, expert questions) | L | V1 | §9 |
| Quick BI Skill for external agents | L | V1 | §13 |
| Custom agents via Dify or Bailian workflows | L | Never | No builder |
| International availability, trial | L | V1 trial idea | §16 |

### Quick Audience, Quick Service, Quick Tracking (25 B2.6)

| Function | Who | Version | Reason |
|---|---|---|---|
| Quick Audience (CDP, tags, RFM, campaigns, automation) | L | Never | C6 row 45 |
| Quick Service 2.0 (LLM service answers) [CLAIM] | L | Never as a product; reply drafting covered by V1 | C6 row 20 |
| Quick Tracking | L | Never | Product analytics |
| Discontinued products (Lingyang Port, 瓴羊One, Quick Stock, Bizphin, Finplus) | L | Never | Discontinued |

### AgentOne security (25 B2.7)

| Function | Who | Version | Reason |
|---|---|---|---|
| Classification, encryption, masking, encrypted transport [CLAIM] | L | V1 masking and encryption | C6 row 30 |
| Access audit, anomaly detection, log alerts [CLAIM] | L | V1 audit; V2 anomaly detection | C6 row 31 |
| RBAC [CLAIM] | L | V1 | C6 row 26 |
| Prompt-injection and adversarial defence [CLAIM] | L | V1 (inbound email untrusted) | C6 row 30 |
| Third-party penetration testing [CLAIM] | L | V2 | Before upmarket deals |
| Agent inherits user's data rights [DOC for Quick BI, Dataphin] | L | V1 | §13 |
| Certifications (ISO 27001/27018, MLPS 3) [CLAIM] | L | V2 ISO 27001 or SOC 2; Never MLPS | C6 row 38 |

### Lingyang deployment (25 B2.8)

| Function | Who | Version | Reason |
|---|---|---|---|
| Public cloud SaaS | L | V1 | C6 row 37 |
| International Alibaba Cloud | L | V1 one region in target market | — |
| Fully vs semi-managed Dataphin | L | Never | No warehouse |
| Private deployment [Unverified] | L | Never | C6 row 37 |

### Lingyang services (25 B2.9)

| Function | Who | Version | Reason |
|---|---|---|---|
| FDE delivery | L | Never at scale | C6 row 42 |
| Seven-day programme (diagnosis, build, before/after) | L | V1 as self-setup | §16 |
| Free trials | L | V1 | C6 row 40 |
| Outcome-linked commercial models | L | Never at start | C6 row 41 |
| Scope discipline (declining non-repeatable projects) | L | V1 as a sales rule | 07 §3 |

### Lingyang industry solutions (25 B2.10)

| Function | Who | Version | Reason |
|---|---|---|---|
| E-commerce and brands | L | Never | Industry |
| Consumer goods and distribution (Feihe report times) | L | Never; distributors are a possible buyer segment [Inference] | Segment hint only |
| Automotive | L | Never | Industry |
| Agriculture and food | L | Never | Industry |
| Finance (financial user operations agent) [CLAIM] | L | Never | Retail finance, not AR |
| Cultural tourism | L | Never | Industry |
| Energy and mobility | L | Never | Industry |
| Store operations (Amap) | L | Never | Ecosystem data |

### Lingyang partners (25 B2.11)

| Function | Who | Version | Reason |
|---|---|---|---|
| Alibaba Cloud hosting, Bailian, Qwen | L/A | V1 Qwen as one rented model | Stack |
| Amap, TMIC, 聚石塔, 店小蜜, Baozun | L | Never | Ecosystem |
| Dify and Bailian workflow plug-ins | L | Never | No builder |
| Claude Code, OpenClaw, QoderWork, Wukong via Skill | L | V1 Skill package | §13 |
| Alibaba Cloud Research Institute white paper | L | Never | Marketing |

### Lingyang editions and prices (25 B2.12)

| Function | Who | Version | Reason |
|---|---|---|---|
| Dataphin editions by DPU (Personal CNY 0.01 to Smart R&D) | L | V1 idea of a near-free personal tier | 25 What to copy 9 |
| Dataphin DPU counting (only published scheduled items count) | L | V2 idea: bill only published definitions [Inference] | Fairness |
| Dataphin add-ons priced monthly | L | V2 add-ons | Later expansion |
| Quick BI editions and agent add-ons | L | V1 seat gating | §15 |
| Data Analysis Agent seat + credits | L | V1 | §15 |
| Experience Insight shop quota | L | Never | E-commerce |
| Ad-creative credit editions | L | Never | Marketing |
| Seven-day starter pack (150,000 credits) | L | V1 trial credits | §15 |

### Extra functions from documents 07 and 08 not listed in 25

| Function | Who | Version | Reason |
|---|---|---|---|
| Period expression DSL | L (Dataphin) | V1 | §4 |
| Composite qualifications with preview SQL | L (Dataphin) | V1 | §3 |
| X-Analytics albums, permission-aware 50-row preview, 2-5 candidates | L (Dataphin) | V1 (candidates as toggle) | §10, §11 |
| Bring-your-own model via API key + base URL per assistant | L (Dataphin) | V1 | §10 |
| UModel TBox/ABox, naming, relation vocabulary | A (UModel) | V1 | §1 |
| UModel query-plan envelope | A (UModel) | V1 with own executor | §10 |
| UModel RunbookSet (risk, confirmation, allowed tools) | A (UModel) | V1 | §12 |
| UModel RCA skill and evidence rule | A (UModel) | V1 for escalation reasons | §12 |
| `umctl validate/import` model packs | A (UModel) | V1 as template install validation [Inference] | §16 |
| OpenSPG rule blocks, concept rules, constraints | A (Ant) | V1 | §2 |
| KAG typed plan steps, layered trust, mutual index | A (Ant) | V1 | §10 |
| KAG kg-builder extractors (schema-constrained) | A (Ant) | V2 for documents | C6 row 18 |
| MyContext source-unit identity, fact nodes, cache key | A (MyContext) | V1 | §7 |
| MyContext three-state merge | A (MyContext) | V1 | §7 |
| MyContext domain-scope defaults, command allow-lists | A (MyContext) | V1 | §7 |
| MyContext SendGuard and typed grants | A (MyContext) | V1 | §7, §12 |
| MyContext RRF fusion, `/requests`, `/todos`, `/capabilities` | A (MyContext) | V1 | §7, §1 |
| MyContext Leiden communities, global search | A (MyContext) | Never | Not needed |
| Bailian KB chunking, retrieval, metadata knobs | A (Bailian) | V1 with versioned configs | §8 |
| Bailian memory store (versioned files) | A (Bailian) | V1 | §8 |
| Bailian memory service (facts, profiles) | A (Bailian) | Never (use three-state merge) | §8 |
| Bailian agent versioning, session pinning, archive-not-delete | A (Bailian) | V1 | §8 |
| Bailian evaluation sets (versions, publish before use) | A (Bailian) | V1 | §8 |
| Bailian credential placeholders by domain | A (Bailian) | V1 | §8 |
| Bailian custom MCP deployment to Function Compute | A (Bailian) | Never | Own MCP server |
| QwenWork digital-employee identity | A (QwenWork) | V1 | §13 |
| QwenWork scheduled tasks (one session per run) | A (QwenWork) | V1 for daily runs | C6 row 11 |
| QwenWork seats + pooled credits + multipliers | A (QwenWork) | V1 | §15 |
| QwenWork Security Center (pre-run sandbox, in-run approval, post-run logs) [Vendor claim] | A (QwenWork) | V1 in-run approval and logs | §12 |
| Enterprise Context (closed) [Vendor claim] | A (QwenWork) | Never (no design published) | Cannot copy |
| Higress per-caller tool narrowing | A (Higress) | V1 | §12 |
| Higress database-to-MCP (`query`, `execute`) | A (Higress) | Never | Not a safety boundary |
| HiMarket API product portal | A | Never | Scale |
| Nacos MCP templates and secret references | A | Never | Own config || AgentScope, Qwen-Agent, Spring AI Alibaba frameworks | A | Never as dependencies [Inference] | TypeScript stack; Python/Java frameworks |
| Qwen4-Max via Anthropic Messages API | A (Qwen) | V1 as second provider | §10 |
| Quick BI attribution and forecasting limits | L | V2 with forecast | §11 |

---

## Contradictions and corrections

1. **"About a quarter of the rows" versus 31 of 47.** Document 25's key finding 11 says version 1 needs about a quarter of the comparison rows. Its own table marks 31 of 47 rows as V1 (some "minimal"). The table should be treated as binding, and the founder should confirm the scope, because a version 1 with 31 functions is large for a solo build [Inference].
2. **The founder's ontology notes are not public.** The four-layer "Organizational Brain" model, the four action grades, citations with rule version and owner, and the bank and Taobao demos are not in any public source (07 KF 1). Under the founder's "copy something documented" rule, these cannot be cited. Sections 2, 11 and 12 cite Dataphin, OpenSPG, UModel and MyContext instead. The risk-level names in section 12 are [Inference].
3. **Misattributed Apsara numbers.** The 600 digital employees and the 10,000 entity nodes / 20,000 relations are Alibaba Cloud internal and a Lanzhou Petrochemical case, not Lingyang or AgentOne (07 KF 2). Do not use them as AgentOne evidence.
4. **Lingyang's public architecture is "Data + Agent + FDE", not four layers** (07 KF 3). Several press architectures disagree with each other (07 §3). Only the Dataphin and Quick BI docs are design sources.
5. **Interpretation length: 300 versus 3,000 characters** (07 §6 and Open questions). The enterprise knowledge page says 300; the dataset prepare-data page says 3,000. Section 9 uses 300 for global and 3,000 for topic-level entries, which matches both pages if they describe different scopes [Inference].
6. **Fuzzy matching.** The current Quick BI knowledge docs say no fuzzy matching; the 2024 ChatBI did fuzzy name matching (07 §6). Section 9 follows the current docs.
7. **Bailian chunking lock-in.** The chunking page says chunking and vectorisation cannot change after creation; the main KB page says chunking can be adjusted and an embedding change triggers a full rebuild (08 §2). Section 8 avoids the question by versioning index configurations.
8. **Copying a lock-in from Dataphin while criticising one in Bailian.** 07 What to copy 7 recommends Dataphin's "no upgrade from basic to dev/prod". 08 criticises Bailian's create-time lock-ins. Section 5 does not copy the Dataphin lock-in [Inference].
9. **UModel lets the agent run the query; the founder wants agents to work through the model.** UModel's plan-only server hands the PromQL or SQL to the agent to execute (08 KF 4). Combined with the Higress finding that "read-only" query tools may run any SQL (08 KF 13), the safe adaptation is for the product's executor to run plans under the user's Postgres role (section 10) [Inference].
10. **MyContext press versus code.** Press says confirmed user conclusions cannot be overwritten and agent access is limited by organisation permissions. The code does user precedence only in the profile layer, has unpopulated contradiction edges in the graph, and has no organisation permission model (08 §6). Copy the profile-layer merge, not the press description.
11. **MyContext licence.** Elastic License 2.0 forbids a hosted service built on the code (08 §6). The product is hosted SaaS, so only the design may be copied.
12. **KAG results.** Backbones differ from the baselines; the abstract and release notes assign the 19.6% and 33.5% gains to opposite datasets; KAG's 2Wiki Recall@5 is below the best baseline (08 KF 8, §8). Do not cite KAG numbers as evidence for this design.
13. **Credit-to-yuan rate.** 07 says the rate was not found; 25 found CNY 0.01 per credit for the Data Analysis Agent but CNY 0.09 to 0.10 for the ad-creative agent. So "a credit" is not one price across AgentOne, and the 150,000-credit starter pack is worth about CNY 1,500 only at the Data Analysis Agent rate (25 B2.12, [Inference]).
14. **Pricing unit.** 06 §14 suggests pricing per workflow or per active object domain [Inference there]. 25 row 41 recommends a platform fee per tenant plus credits priced against receivables handled. Section 15 follows 25 because it is grounded in documented AgentOne and QwenWork mechanics; the per-workflow idea remains an option for expansion [Inference].
15. **Stack fit.** Dataphin compiles to MaxCompute or other warehouses, UModel to Prometheus/SLS, OpenSPG to TuGraph/Neo4j, MyContext to SQLite/LadybugDB. None targets PostgreSQL with RLS. Every compile target in this map is therefore [Inference]: the documented patterns are copied, the Postgres implementation is new.
16. **UModel instance cap.** UModel caps 10,000 instances per entity type (08 §7), which a 1,000-staff company's invoice table can exceed. Not copied.
17. **Palantir tenure figures.** The 10-K says the top three customers' average tenure is about ten years; the 10-Q says about fifteen (06 §2). Not material to the build.
18. **Founder assumption that Palantir or AgentOne already does collections.** Neither sells a receivables product for mid-sized firms; Palantir AFC 360 only mentions collections as an extension (25 KF 10). This is a gap the product fills, but also means no documented receivables design exists to copy; the receivables specifics in this map are [Inference] on top of documented general patterns.
19. **Bailian long-term memory.** Agent 2.0 says long-term memory is "not yet available" in Agent apps, while Managed Agents has a memory store and the memory service exists (08 KF 11, §4). These are different Bailian products; section 8 copies the Managed Agents memory store.

---

## Gaps

| Item | Source of the gap | Importance |
|---|---|---|
| AgentOne credit-management, permission and data-security help pages (3050036, 3022129, 3019723) | 07 Open questions; 25 Open questions | High |
| Dataphin permission sub-pages (row-level rules, approvals, validity periods) | 07 Open questions | High |
| Metric versioning in Dataphin (history of 口径 and expression) | 07 Open questions | High |
| Bailian retrieval defaults (TopN, threshold) and fusion formula | 08 Open questions | Medium |
| Bailian memory service conflict and overwrite rules | 08 Open questions | Low (not copied) |
| Bailian evaluator types and metrics | 08 §3 | Medium |
| Official Qwen4-Max and Qwen3.8-Flash prices (secondary figures only) | 08 Open questions | High |
| QwenWork seat prices and admin governance features | 08 Open questions | Medium |
| Enterprise Context internals | 08 Open questions | Low |
| Agent Context / Context Engine, AgentCore mechanics | 08 §3, Open questions | Low |
| Quick BI edition and 智能小Q add-on prices | 25 Open questions | Medium |
| AgentOne outside China; private deployment | 07, 25 | Low |
| The founder's Malaysia talk materials (slides, WeChat article) | 07 KF 1, Open questions | Medium |
| 大数据之路 exact OneData terms | 07 §8 | Low |
| SPG white paper | 08 §8 | Medium |
| Palantir NDR definition wording; bootcamp conversion rate | 06 Open questions | Low |
| Palantir AIP Now catalogue | 25 Open questions | Low |
| Palantir packaged PDFs (program oversight etc.) | 25 Open questions | Low |
| Nacos registry, ModelScope MCP, HiMarket Dec 2025 upgrade | 08 Open questions | Low |
| DingTalk and Feishu agent-platform docs | 08 §13 | Low |
| AliCoCo, AliMe papers | 08 §12 | Low |
| Customer complaints about Lingyang | 25 B4 | Low |
| Any receivables-specific baseline (acceptance rate, DSO change in pilots) | 06, 25 (none in any document) | High |

**Research briefs for high items.**

- **AgentOne credit, permission and security pages.** Read https://help.aliyun.com/zh/document_detail/3050036.html (Credit管理 for the Data Analysis Agent), the permission page 3022129 and the data-security page 3019723 under https://help.aliyun.com/zh/product/2987146.html, and the security pages https://help.aliyun.com/zh/document_detail/3019609.html and https://help.aliyun.com/zh/document_detail/3019711.html. Extract: how credits are debited per action and per model, what happens at zero balance, whether credits are per seat or pooled in practice, how agent permissions map to user roles, and any approval or confirmation configuration. This decides whether sections 12, 13 and 15 can cite AgentOne [DOC] instead of [CLAIM].
- **Dataphin permission sub-pages.** Read the pages under https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/data-access/ (user roles, built-in roles, my permissions, permission management, audit, ownership) and the row-level permission add-on on https://help.aliyun.com/zh/dataphin/product-overview/billing-instructions. Extract: row-level rule syntax, how rules combine across roles, request-approve-recall workflow fields, validity periods. This is the documented source for the RLS policy model in row 26 of section 18.
- **Metric versioning.** Search the Dataphin docs (start from https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-derived-metrics and https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/creating-atomic-metrics) for version history, change records and impact analysis on edits to 口径 or expression; also check UModel's CHANGELOG and schema files in https://github.com/alibaba/UnifiedModel for a definition-versioning field, and Palantir's Ontology proposals and migrations (file 02 KF 13 as cited in 25). The product needs immutable metric versions for citations; currently no source documents them.
- **Official Qwen prices.** Read the Model Studio pricing table (from https://help.aliyun.com/zh/model-studio/text-generation-model and the QwenCloud page https://docs.qwencloud.com/developer-guides/getting-started/latest-model) for qwen4-max, qwen3.8-flash and qwen3.7-plus, including cache-read and cache-write rates per region. These set the credit multipliers in section 15.
- **Receivables baselines.** No document has one. The next research pass should look for published collections-automation results from receivables vendors (document 23 in this folder covers receivables competitors and was not in this map's scope) and extract: approval or acceptance rates for drafted reminders, DSO change in the first 30 to 90 days, and reply-classification accuracy. These set the pilot's acceptance metrics in section 16.