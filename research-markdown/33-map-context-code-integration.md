# Reference map 4: schema, open-source building blocks and integration

Scope note (written 21 November 2026). This map consolidates three research documents, read in full: **11-context-layer-products.md** (document 11: context-layer, ontology and semantic-layer products), **14-open-source-code-study.md** (document 14: a source-level study of 60+ open-source repositories) and **24-integration-companies.md** (document 24: Airbyte, ELT vendors, unified APIs, embedded-integration and agent-tooling vendors, document and email ingestion; re-read from the start in its completed form). No web search or fetch was used, and no code under `_code` was run. Labels carried over from the documents are kept: [Fact], [Vendor claim], [Unverified]. Anything I reason beyond the documents is marked [Inference]. Receivables examples are mine and are illustrations, not facts from the documents.

Stack assumed throughout (the founder's decision): TypeScript, PostgreSQL with row-level security, one repository, models rented through APIs (Claude, Qwen). First job: receivables and collections for companies of 100 to 1,000 staff.

---

## Design decisions

Components are in build order: the model schema and file format first (everything else refers to it), then the security floor, then data coming in, then knowledge and context, then compute over the model (metrics, rules, actions), then the agent-facing surfaces, then evaluation. The bill of materials closes the section.

### 1. Common semantic-model schema (objects, keys, relationships, metrics, synonyms, verified queries, instructions)

**Purpose.** One typed description of the company's business: what things exist, how they are identified, how they connect, which numbers about them are official, what words people use for them, which questions have known-good answers, and what free-text guidance an agent must follow. Receivables example: `Customer` (key `customer_id`) *is billed by* `Invoice`; metric `overdue_balance`; synonym "debtor" for Customer; verified query "Which customers are more than 60 days overdue?"

**Design to implement.**

Document 11 found that every big vendor converged on the same object set: typed entity or table, keyed field, relationship with cardinality, governed metric, synonyms or description for the LLM, verified question-to-query pairs, and free-text instructions [Inference in document 11, drawn from the specs it read]. The internal model should hold exactly that set, plus the three things no vendor has in the model (actions, enforced rules, permissions; see sections 13 and 3). Definitions are Zod schemas and are stored as versioned rows in Postgres (document 14: model as plain data validated by Zod, with tools, forms and docs generated from it).

Object type (`ObjectType`):
- `apiName` (unique per tenant and namespace), `displayName`, `description`, `namespace` (Fabric's namespace concept for team sharing).
- `primaryKey`: one or more property names; key datatype string or integer (Fabric restricts keys to these two [Fact]).
- `uniqueKeys[]` (Ossie dataset `unique_keys` [Fact]).
- `titleProperty`, `status` (active, experimental, deprecated) and `visibility` (from osdk-ts `ObjectMetadata` [Fact]).
- `extends` (inheritance; Fabric supports base types extended by specialised types, Ossie has `extends` [Fact]).
- `identityFields[]` (derive a deterministic id so repeated extractions merge) and `indexFields[]` (what gets embedded), from Cognee `DataPoint` [Fact].
- `aiContext` (see below).
- `properties[]`, each with `name`, `datatype` (use Ossie's list: String, Integer, Decimal, Float, Boolean, Date, Time, DateTime, DateTimeTz, Opaque [Fact]), `nullable`, `multiplicity`, `isTime` (Ossie `dimension.is_time`), `authority` (`source` | `owned` | `derived`, from operational-ontology's `owned` map and the "authority line" [Fact]), `safety` (`safe` | `unsafe` | `do-not-log`, from Conjure [Fact]), `private` (Snowflake `PRIVATE` facts: building blocks agents cannot query directly [Fact]), `hidden` (Genie column hide flag [Fact]), `aiContext`.
- Every key property also carries an **entity type** for join safety: `primary` | `unique` | `natural` | `foreign` (dbt and MetricFlow [Fact]; used by section 10).

Link type (`LinkType`):
- `name`, dot-addressed under the first role (`Customer.isBilledBy`, Ossie dot notation [Fact]).
- `from` (many side), `to` (one side), `fromKeys[]`, `toKeys[]` as property names, not physical columns (Ossie relationship [Fact]).
- `multiplicity`: `many_to_one` (default, as in Databricks), `one_to_one`, `one_to_many`, `many_to_many`. Ossie ontology allows only ManyToOne and OneToOne [Fact]; operational-ontology allows one-to-many and many-to-many [Fact]. [Inference] Store all four internally; export many-to-many to Ossie only via an intermediate concept, which is also what BigQuery Graph forces (junction tables promoted to nodes [Fact]).
- `verbalizes`: a required sentence pattern, for example `"{Customer} is billed by {Invoice}"` (Ossie [Fact]; document 11 recommends it as both LLM description and validation-message text).
- `owned` (link instances live in the product, not the source) and `via` (join table), from operational-ontology [Fact].
- `derivedBy` (optional): a rule-derived link computed from a pattern plus an aggregate constraint (KAG [Fact]; Ossie `derived_by` [Fact]). Example [Inference]: `Customer.isChronicLatePayer` derived when more than 3 invoices in 12 months were paid over 30 days late.
- `aiContext`.

Metric (`Metric`): see section 10 for compilation. Fields: `name`, `type` (simple, ratio, cumulative, derived, conversion; dbt and MetricFlow [Fact]), `agg` (sum, max, min, average, median, count_distinct, percentile, count, sum_boolean [Fact]), `expr`, `filter`, `nonAdditiveDimension {name, windowAgg, groupBy}`, `joinToTimespine`, `fillNullsWith`, `offsetWindow`, `offsetToGrain`, `inputMetrics`, `numerator`/`denominator`, `using` (pin a link path; Snowflake `USING(relationship)` [Fact]), `private`, `format`, `displayName`, `datatype`, `owner`, `certification` (section 6), `aiContext`. Scope is either object-scoped or model-scoped, with Ossie's rule that a model-scoped metric composes an object metric only through `AGG(object.metric)` [Fact].

AI context (`aiContext`), copied from Ossie: either a string or `{instructions, synonyms[], examples[]}` [Fact]. Limits copied from Databricks metric views: up to 10 synonyms, each up to 255 characters; `displayName` up to 255 characters [Fact].

Verified query (`VerifiedQuery`): `name`, `question`, `query` (stored as a **semantic query** — an ObjectSet or metric request in JSON, section 12 — not SQL; Cube's AI API argues constrained semantic output reduces hallucination [Vendor claim]), typed `parameters[]` with `sampleValues` (Google Query Template entries [Fact]; Genie `:param` [Fact]), `verifiedAt`, `verifiedBy`, `onboardingQuestion: boolean` (Snowflake `AI_VERIFIED_QUERIES` with `VERIFIED_AT` and `ONBOARDING_QUESTION` [Fact]), `intent`. An answer produced through a verified query is labelled "verified answer" in the response (Genie trusted assets [Fact]).

Instruction (`Instruction`): `scope` (`global` | `domain` | `objectType` | `agent`), `text`, `owner`. Genie reserves text instructions for global context such as the fiscal calendar [Fact]; Fabric data agents use instructions for routing [Fact]. Precedence is fixed (section 3).

Rule (`Rule`): see section 11. Fabric's record (`name` unique, `definition` in natural language, `linkedConcepts[]`, `description`, key-value `metadata`) [Fact], extended with `enforcement: advisory | enforced` and an optional `requires` condition in the JSON condition IR (document 11, "What to copy" 3; document 14, section 2).

Defaults and limits [Inference, sized from the documents' numbers]: one domain bundle per agent; Snowflake recommends fewer than 10 tables and at most 50 columns for a first semantic view [Fact]; Genie caps 100 instructions and 200 snippets [Fact]. Start the receivables bundle at about 8 object types (Customer, Contact, Invoice, InvoiceLine, Payment, CreditNote, Allocation, PromiseToPay) and validate the bundle size at save time with a warning above 10 object types or 50 properties per type.

Failure behaviour: definition saves are validated as a whole (Zod), name collisions are rejected (Databricks: field and measure names unique across both lists ignoring case [Fact]; operational-ontology fails the build on tool-name collisions [Fact]). Every definition change writes a before/after event to a transactional outbox in the same transaction (CapTrix pattern, design only [Fact]). Patches keep stable IDs so downstream integrations do not break (Fabric ontology agent [Fact]).

**Copies.**
- Document 11, "Key findings" 1: the converged object set.
- Document 11, section 5 (Apache Ossie): dataset, field, relationship, metric fields, `ai_context`, name resolution, `AGG()` rule. https://github.com/apache/ossie/blob/main/core-spec/spec.md
- Document 11, section 4 (Snowflake): `PRIVATE`, `USING`, verified queries with `VERIFIED_AT` and `ONBOARDING_QUESTION`. https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view
- Document 11, section 3 (Databricks): synonym limits, join cardinality default, trusted assets. https://docs.databricks.com/aws/en/uc-semantics/metric-views/yaml-reference ; https://docs.databricks.com/aws/en/genie-agents/tune-quality
- Document 11, section 10 (dbt): entity types and five metric types. https://docs.getdbt.com/docs/build/metrics-overview
- Document 11, section 1 (Fabric): key types, inheritance, namespaces, rule record, stable IDs. https://learn.microsoft.com/en-us/fabric/iq/ontology/overview ; https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules
- Document 11, section 6 (Google): query templates with typed parameters and sample values. https://docs.cloud.google.com/knowledge-catalog/docs/context-sets
- Document 14, section 1 (operational-ontology): model as data with Zod, `owned`, `via`. https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts
- Document 14, section 2 (osdk-ts): `ObjectMetadata` fields. https://github.com/palantir/osdk-ts/blob/HEAD/packages/api/src/ontology/ObjectTypeDefinition.ts
- Document 14, section 14 (Cognee): identity and index fields. https://github.com/topoteretes/cognee/blob/HEAD/cognee/infrastructure/engine/models/DataPoint.py
- Document 14, section 2 (Conjure): per-field safety flag. https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md
- Document 14, "What to copy" 23: schema-change outbox (design only, AGPL). https://github.com/CapTrix/openfoundry/blob/HEAD/services/ontology-actions-service/internal/repo/events.go

**Left out, and why.** DAX-only metrics (Fabric): ties metrics to one BI tool. Power BI's "LSDL" storage: undocumented. Snowflake level-of-detail and window-function metrics: preview features, not needed for receivables in version 1. Bilingual labels (KAG) are left to version 2 [Inference: useful for Malay and Chinese labels later, not needed to prove the job].

**Open questions.** Whether `PromiseToPay` is an object type or a temporal fact (section 7) [Inference: both — a fact extracted from email, promoted to an object once a collector confirms it]. Whether many-to-many should be allowed in version 1 at all.

### 2. Exact file format: Ossie ontology, semantic model and mapping split

**Purpose.** A portable, inspectable on-disk form of the model so it can be reviewed in Git, diffed, imported and exported. Receivables example: `receivables.ontology.yaml` says a Customer is billed by Invoices; `xero.semantic.yaml` says where Xero invoices live and how `overdue_balance` is computed; `xero.mapping.yaml` binds the two.

**Design to implement.**
- Postgres rows are the source of truth at runtime; YAML files are the authoring, review and exchange form. [Inference, following document 14's verdict that Ossie is an import/export format, not the internal model.]
- Per domain bundle, five files in one folder:
  1. `<domain>.ontology.yaml` — Ossie ontology document: `concept`, `type` (`EntityType` | `ValueType`), `description`, `extends`, `identify_by`, `requires`, `derived_by`, `relationships` (with `roles`, `multiplicity`, `verbalizes`), `iri`, `annotations` [Fact, document 11 section 5].
  2. `<source>.semantic.yaml` — Ossie core model: `version`, `name`, `description`, `ai_context`, `datasets` (`name`, `source`, `primary_key`, `unique_keys`, `fields`, `metrics`), `relationships` (`from`, `to`, `from_columns`, `to_columns`), model-scoped `metrics`, `nonportable_extensions` [Fact]. Expressions in the portable `OSSIE_SQL_2026` dialect with an optional `postgres` variant [Fact].
  3. `<source>.mapping.yaml` — Ossie mapping: references exactly one ontology and one semantic model; `concept_mappings` with `object_mappings` and `link_mappings` [Fact]. One ontology binds to several sources (Xero, QuickBooks, NetSuite) through one mapping file each (document 11, "What to copy" 1).
  4. `<domain>.actions.yaml` — product-specific, because Ossie has no actions [Fact]. Shape from section 12.
  5. `<domain>.policies.yaml` — product-specific, because Ossie has no permissions [Fact]. Shape from section 3.
- Product-only fields inside Ossie files (authority, safety, entity type, certification) go in `nonportable_extensions`, which Ossie consumers must preserve and core semantics must never depend on [Fact].
- Versioning: pin exchange to Ossie **0.1.1** (released 11 Dec 2025) and keep a versioned converter for 0.3.0.dev0, which is unreleased, mutable and explicitly not for production [Fact, documents 11 and 14].
- Import/export: the `apache/ossie-converters` project converts to and from dbt, GoodData, Polaris and Salesforce [Fact, document 14]; dbt v1.12 accepts Ossie documents in place of native YAML [Fact, document 11]. Fabric imports and exports RDF/Turtle/OWL [Fact]; Ossie `iri` fields allow RDF/OWL alignment [Fact]. [Inference] Write an exporter to Ossie in version 1 (cheap, proves portability) and importers in version 2.
- Branches and proposals: a branch is a copy of the schema definitions compared by name into `{added, removed, changed}`; a merge proposal is reviewed before it reaches main; instance data is not branched (OntoForge [Fact]).

**Copies.**
- Document 11, section 5 and "What to copy" 1–2: three-document split, roles and verbalizations. https://github.com/apache/ossie/blob/main/ontology/ontology.md
- Document 11, section 5: `nonportable_extensions`; version warning. https://github.com/apache/ossie/blob/main/core-spec/spec.md
- Document 14, section 7: verdict "copy the shape, plan an export, not the internal model"; converters. https://github.com/open-semantic-interchange/OSI/blob/HEAD/README.md
- Document 11, section 1: Fabric RDF/Turtle export and named version checkpoints. https://learn.microsoft.com/en-us/fabric/iq/ontology/overview
- Document 14, section 3 (OntoForge): branches and proposals. https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/branches.py

**Left out, and why.** Ossie as the runtime model (no actions, permissions or enforced rules; mutable). Fabric's "import only into an empty item" restriction: [Inference] the product should allow merge-import through a proposal instead.

**Open questions.** Whether the ontology spec and mapping documents exist in the released 0.1.1 or only in 0.3.0.dev0 — neither document says explicitly [Inference: probably only in the dev line, which makes the ontology file itself unstable]. Which repository URL is canonical (see Contradictions).

### 3. Permissions: tenant row-level security, label (marking) filters, object policies, Cedar for action decisions

**Purpose.** Make it impossible for an agent or a staff member to see or change data they should not, whatever the agent asks for. The context layer itself never grants access. Receivables example: a collector sees only customers in their own portfolio; the external customer-messaging agent sees only the one customer it is talking to and never sees internal notes marked `internal-only`.

**Design to implement**, in four layers, applied in this order on every query:

1. **Tenant isolation in Postgres (forced RLS).** `org_id` column on every table, indexed; `ENABLE` and `FORCE ROW LEVEL SECURITY`; policy `USING (org_id = current_setting('app.org_id', true)) WITH CHECK (same)`; a dedicated non-owner application login role; each request inside a transaction that starts with `SET LOCAL app.org_id = $1` (Przyval/openfoundry migration 009 [Fact]). The fail-closed behaviour of an unset setting and the `SET LOCAL` scope are from document 14's knowledge of Postgres and marked [Unverified against docs this session].
2. **Markings (labels).** Each object row, property and document chunk can carry markings. A user must hold every mandatory marking and at least one discretionary marking if any are present; unknown markings are treated as mandatory (Przyval marking evaluator [Fact]). Resource roles held on a resource (owner, editor, viewer, discoverer) inherited by contents (Przyval migration 014 [Fact]). Granting can pass on only what the granter holds (Cognee [Fact]).
3. **Per-object-type access policies**, Cube's shape: per group `memberLevel {includes|excludes}`, `memberMasking`, `rowLevel {filters | allowAll}` (filters may interpolate user attributes), `conditions [{if: …}]`. Combination: policies within one object type are OR-ed; constraints across object types are AND-ed; once any group policy exists, groups without one get nothing (default deny); a path that resolves to no object instance is denied by injecting `1 = 0`; an empty `memberLevel` grants every member, so warn on it (Cube validator and compiler [Fact]). Add relationship-based scoping in the Workday style ("collector of this portfolio", "manager of region X") [Vendor claim, Workday]. Version 2, if sharing graphs get deep: OpenFGA-style tuple table `tuple(store, object_type, object_id, relation, user, user_type, condition_name, condition_context)` copied as design [Fact]; document 14 judges group and role grants in Postgres likely enough at 100–1,000 staff [Inference].
   - Implementation: a hand-written TypeScript compiler folds layers 2 and 3 into SQL predicates on every ObjectSet query (section 12). This is required because Cedar's resource-query APIs are not in the wasm build (below) and OPA's SQL compile target would add a Go sidecar and Rego [Fact for both facts; Inference for the choice].
4. **Action decisions with Cedar.** `@cedar-policy/cedar-wasm` 4.15 answers "may principal P run action A on object O with context C" [Fact: published in ESM, Node and web builds with features `wasm` and `partial-eval`, not `tpe`]. The action's own authorization-policy fields (copied from CapTrix, design only): `required_permission_keys`, `any_role`, `all_roles`, `attribute_equals`, `allowed_markings`, `minimum_clearance`, `deny_guest_sessions`, plus `confirmation_required` with a mandatory justification [Fact]. [Inference] Compile these fields into Cedar policies at definition-save time so there is one evaluator.

Governance precedence, fixed in the runtime: tenant policy, then role, then developer instructions, then the user's prompt (Fabric data agent [Fact]).

Pass-through rule: agents read with the invoking principal's permissions (Fabric, Google, OpenAI [Fact]); missing access is flagged, or the agent falls back to what the user can read (OpenAI [Fact]). Do not copy Airbyte's model where the stored service credential decides what the agent sees (document 24 [Fact for the model]). Masked or regulated values never go into metadata fields (Snowflake warning [Fact]).

Failure behaviour: any evaluation error denies. Unknown marking = mandatory. Unresolvable path = `1 = 0`. Cedar errors = deny with `PERMISSION_DENIED` (Conjure error code, section 12).

**Copies.**
- Document 14, section 20 and "What to copy" 10: forced RLS pattern. https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/009_multi_tenancy.sql ; https://github.com/Przyval/openfoundry/blob/HEAD/packages/db/src/pg-store.ts
- Document 14, "What to copy" 11: markings and resource grants. https://github.com/Przyval/openfoundry/blob/HEAD/packages/markings/src/marking-evaluator.ts ; https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/014_resource_authorization.sql
- Document 14, section 5 and document 11, section 11: Cube policies and combination semantics. https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-schema-compiler/src/compiler/CubeValidator.ts ; https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-server-core/src/core/CompilerApi.ts ; https://docs.cube.dev/reference/data-modeling/data-access-policies.md
- Document 11, section 9: Workday contextual security. https://blog.workday.com/en-us/four-layers-workday-data-cloud.html
- Document 14, section 17: Cedar wasm features. https://github.com/cedar-policy/cedar/blob/HEAD/cedar-wasm/Cargo.toml ; https://github.com/cedar-policy/cedar/blob/HEAD/cedar-policy/src/api/tpe.rs
- Document 14, section 3: CapTrix action authorization policy (design only). https://github.com/CapTrix/openfoundry/blob/HEAD/libs/ontology-kernel/models/action_type.go
- Document 14, section 14: Cognee grant-only-what-you-hold. https://github.com/topoteretes/cognee/blob/HEAD/cognee/modules/users/permissions/permission_types.py
- Document 11, section 2: Fabric governance precedence. https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent
- Document 11, "Key findings" 6 and section 7: pass-through permissions. https://openai.com/index/inside-our-in-house-data-agent/

**Left out, and why.** OPA as a sidecar (second language, second service, document 14). OpenFGA as a running service (version 2 at most). foundry-ontology-open's permission checks (placeholders; any user with one role can read [Fact]). Cedar `tpe` (experimental, not in wasm [Fact]). Account-wide snippet visibility (Databricks beta hole [Fact]).

**Open questions.** Whether Cedar resource queries will reach `cedar-wasm` (document 14 open item). Postgres RLS semantics need re-checking against the Postgres docs (see Gaps). How masking interacts with metric aggregation (Cube masks members outside the policy's row filter [Fact]; [Inference] aggregate metrics over masked rows need an explicit rule).

### 4. Agent identity as its own principal

**Purpose.** Every agent is a named security principal with its own permissions and audit trail, separate from the human who built it or triggered it. Receivables example: the "Collections assistant" agent drafts a reminder when Aisha (a collector) asks; the audit shows both the agent and Aisha. The "Customer portal agent" talks to customers under its own narrow principal.

**Design to implement.**
- Table `principals(org_id, principal_id, kind: human|agent|service, …)` and `agents(org_id, agent_id, principal_id, audience: internal|external, owner_principal_id, tool_pack_id, model_setting, status)`. [Inference: table design; the separate agent principal is copied from Fabric's Entra Agent ID and OpenAI Frontier's per-coworker identity.]
- Two run modes per tool step (Glean, beta [Fact]): **as invoker** (default; the agent's effective rights are the intersection of the invoking human's rights and the agent's tool pack [Inference]) or **service credential**, attached per tool step by an admin, injected server-side only for the approved target, never visible to the model.
- Every audit row records both the agent principal and the triggering principal (Glean [Fact]; Merge Agent Handler records identity, arguments, downstream calls and outcome [Fact/Vendor claim]).
- Approval rule: an approved action never executes with the creator's rights. It executes with the approver's rights or the agent's own scoped credential (document 11, "What to copy" 15, written against the Fabric operations agent, which executes with the creator's permissions [Fact]).
- External agents (customer messaging) get their own principal, an `external` audience, a tool pack generated from the same model with stricter visibility and marking filters, and context assembled entity-first from the resolved customer only (document 14, "Write from scratch"; document 11 section 8, Salesforce ACE [Vendor claim]).
- Tool Packs: tools scoped per agent type, customer tier and environment, so an agent sees only what it may call (Merge Agent Handler [Vendor claim]).
- Agents prepare, humans submit, for money-moving and customer-facing actions in early releases (Airbyte's Stripe-dispute skill never submits [Vendor claim]).

**Copies.**
- Document 11, section 13 (Glean agent identity). https://docs.glean.com/administration/agent-identity/overview
- Document 11, section 2 (Fabric operations agent: what not to do). https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent
- Document 11, section 7 (Frontier: per-coworker identity, [Vendor claim]). https://openai.com/index/introducing-openai-frontier
- Document 24, section 5.1 and "What to copy" 11–12 (Merge Agent Handler: audit record, Tool Packs). https://www.merge.dev/agent-handler
- Document 24, "What to copy" 13 (agents prepare, humans submit). https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jul-2026-agents-can-now-write-to-salesforce-and-hubspot.md
- Document 11, section 8 (ACE entity-first context). https://www.salesforce.com/blog/?p=157012

**Left out, and why.** Run-as-creator after a different approver (privilege escalation). Arcade-style "agent acts with the user's own OAuth grant to each SaaS app" as the default: [Inference] the product holds one service connection per ledger and enforces per-user permissions itself; Arcade is a teacher only (document 24).

**Open questions.** How the external agent authenticates the human customer it talks to (not covered by the three documents). Whether agent principals need their own markings or only inherit.

### 5. Connectors: Xero, QuickBooks Online, NetSuite and email (buy, use or build)

**Purpose.** Bring each customer company's invoices, payments, credit notes and contacts in incrementally (including deletes and voids), write back a small set of safe things, and read and send email from the customer's own mailbox. Receivables example: a payment applied in Xero at 10:02 shows up as a reduced overdue balance before the 10:30 reminder run.

**Design to implement.**

Buy/use/build decision (document 24, section 8.3 [Inference built on facts]):
- **Buy Nango pay-as-you-go** for OAuth, token refresh and rotation, webhook routing and the authenticated proxy across Xero, QuickBooks, NetSuite (OAuth 2.0), Gmail and Outlook. Price: $50 a month including $50 of usage, then $0.29 per connection per month, $0.72 per compute hour, $0.50 per GB egress; Free tier capped at 10 connections, 10 compute hours, 10 GB [Fact]. Self-hosting is Enterprise only [Fact]. Licence ELv2, but using Nango Cloud avoids the hosted-service question (document 24). Register **your own** OAuth apps with each provider so you can leave Nango later.
- **Pay the ledger vendors directly** — unavoidable whichever option: Xero tiers since 2 March 2026 from Starter (free, 5 connections, 1,000 calls per day per organisation) through Core (A$35 a month, up to 50 connections), Plus (A$245, up to 1,000) to Advanced (A$1,445, 10,000 connections, 250 GB egress), with A$2.40 per GB over allowance on every tier [Fact]. Intuit: Builder free up to 500,000 metered read calls a month, then blocked; Silver $300 a month for 1 million, $3.50 per 1,000 over; writes free [Fact, via a secondary source written by Apideck]. NetSuite: no API fee; the customer's licence and SuiteCloud Plus decide concurrency [Unverified].
- **Build** a TypeScript + Postgres sync engine and the normalised receivables model.
- **Use as specification only** the Airbyte manifests and docs (ELv2; read, do not ship), and dlt's `rest_api` config grammar (Apache-2.0).
- **Do not use** Airbyte Core as the engine (Kubernetes and Java services, per-customer sources, ELv2 forbids exposing its UI or API), store-everything unified APIs below three ledgers, agent tool platforms as a system of record, Pipedream (no commercial use), n8n (licence unverified), the dltHub toolkits (derivative-works clause).

Connector contract (copied from the Airbyte Protocol [Fact]):
- `spec()`, `check(config)`, `discover(config) → catalog`, `read(config, configuredCatalog, state) → stream of {RECORD | STATE | LOG | TRACE}`.
- State is an opaque blob owned by the source; the sink commits records, then persists the state that followed them. Rules: always emit state, even for zero records; never emit the same state twice in a row with records between; process state in order.
- Per-stream state: one cursor per object type per customer ledger, so one stream can be reset alone.
- Declarative per-stream config in the dlt grammar: `client {base_url, headers, auth, paginator}`, `resources[] {endpoint {path, method, params (parent binds, incremental binds), data_selector, paginator, response_actions, incremental {cursor, start_param, end_param}}}` [Fact].
- Tables [Inference]: `sync_connections(org_id, connection_id, provider, nango_connection_id, status, schema_change_policy)`, `sync_streams(org_id, connection_id, stream, state jsonb, last_success_at, egress_bytes)`, normalised `ar_invoice`, `ar_payment`, `ar_credit_note`, `ar_allocation`, `ar_customer`, each with `source_ref` back to the ledger record (document 24, 8.3).

Per-system rules:

| | Xero | QuickBooks Online | NetSuite |
|---|---|---|---|
| OAuth | OAuth 2.0 authorisation code with `offline_access`; one connection can cover several tenants, pick with `Xero-Tenant-Id`; client-credentials "custom connections" for one organisation [Fact] | OAuth 2.0; `realmId` on redirect; refresh tokens rotate about every 24 hours and expire after 100 days unused; store each new token atomically; never share a token between tools [Fact] | OAuth 2.0 (scope `rest_webservices`, account-specific URLs). TBA (OAuth 1.0a) closed to new integrations from release 2027.1, so do not build on it. Customer admin must create an integration record and a role [Fact] |
| Rate budget | 5 concurrent, 60 a minute, daily cap per organisation (1,000 on Starter or 5,000), 10,000 a minute per app [Fact] | 500 a minute per realm; budget 10 a second (Airbyte `HTTPAPIBudget`), concurrency 4 default up to 40 [Fact] | Concurrency governed per account, shared with SOAP and RESTlets [Fact] |
| Incremental read | `If-Modified-Since` header on `UpdatedDateUTC`; pages of 1,000 [Fact] | `SELECT * FROM <Entity> WHERE Metadata.LastUpdatedTime > a AND <= b AND Active IN (true,false) ORDER BY … STARTPOSITION n MAXRESULTS 1000` [Fact] | Date-windowed queries on last-modified date with up to one day look-back; streams discovered from the REST record metadata catalog [Fact]; SuiteQL an alternative [Unverified] |
| Deletes, voids | Arrive as status changes on update [Inference; check Xero docs] | Soft delete via `Active=false` [Fact]; hard deletes need Intuit CDC [Unverified] | Saved search or deleted-record query [Unverified] |
| Errors | 401 = re-consent; 403 ignored by Airbyte; 429 with "daily limit" = stop until reset; other 429 = exponential backoff [Fact] | Fault codes 3200 and 3201 = config error, re-authorise [Fact] | Role cannot read a record type → `INSUFFICIENT_PERMISSION`; surface to customer admin per record type [Fact] |
| Webhooks | Yes: contact and invoice events, signed with a webhook key, "intent to receive" validation [Fact]; payments and credit notes may still need polling [Unverified] | Yes, recommended to cut metered GETs [Fact as reported] | No native REST webhooks; SuiteScript user-event script or polling [Unverified] |
| Write-back | POST/PUT for invoices, credit notes, payments, allocations; Nango tools exist [Fact] | Writes free under Intuit's programme [Fact as reported] | REST create/update; Nango tools exist [Fact] |
| Prebuilt in Nango | Syncs: accounts, bank transactions, contacts, credit notes, invoices, items, organisations, payments, purchase orders, journals; tools for create/get/list/update [Fact] | Create/get tools for invoices, payments, credit memos, customers, journal entries and more, plus list tools [Fact] | Syncs: credit notes, customers, invoices, payments, GL, locations (TBA); tools to create/update invoices, payments, credit notes, customers [Fact] |

Engine behaviours [Inference, from document 24's "What to copy" and 8.3]:
- Webhooks only mark a record dirty; the poller re-reads it. Route webhooks to a connection by a stored hash of the account identifier (Nango Gmail routing [Fact]).
- Nightly full reconcile of **open** invoices to catch missed deletes and voids.
- Two error classes: config errors pause the connection and email the customer's admin; transient errors retry with backoff; each code has a human-readable message (Airbyte manifests [Fact]).
- Schema-change policy per connection with Airbyte's four values (propagate field changes; propagate all; approve myself; stop syncs); auto-pause when a cursor or primary key disappears; a removed column is kept and filled with NULL [Fact].
- Rate budgets per tenant **and** per app; token-refresh locks with Postgres advisory locks (Nango uses Redis locks [Fact]; Postgres variant suggested in document 24 [Inference]).
- Track egress bytes per customer from day one, because Xero bills egress per GB [Fact]; avoid full re-pulls.
- Three access paths, each labelled with freshness in the agent's answer: synced tables, live direct reads through the proxy, and a search index (Airbyte context layer [Fact]).
- A connector "skill" document per source listing entities, actions and filters, which the agent reads before calling (Airbyte MCP [Fact]).
- Write-back in version 1 limited to notes and reminder logs; payment allocation behind human approval (document 24, 8.3).

Email:
- Gmail and Microsoft Graph called directly using Nango-held tokens (document 24, 8.3). Gmail: incremental via `history.list` from a stored `historyId`; push via `users.watch` to Pub/Sub; quota 1,200,000 units a minute per project and 6,000 per user; unit costs `messages.send` 100, `messages.get` 20 (60 full or raw), `messages.list` 5, `history.list` 2, `watch` 100 [Fact]. Use `gmail.readonly` where possible (Airbyte notes Cloud's flow asks for `gmail.modify`; service-account keys cannot read a mailbox) [Fact]. Restricted scopes need Google OAuth verification and an annual security assessment [Unverified].
- Graph: `/me/messages` or delta queries, `sendMail`, scopes `Mail.Read`, `Mail.Send`, `offline_access`, change notifications via subscriptions [Fact for scopes]; throttling limits [Unverified].
- Send reminders from the customer's own mailbox for deliverability and threading; a transactional sender only for "no-reply" [Inference].
- Fallback vendor: Nylas (Free 5 accounts; Essentials $15 for 10 then $2.25; Pro from $49 for 25 then $2.00; shared Google OAuth app $2,400 a year) [Fact].
- Attachments (remittances): two-phase ingestion (section 7); Docling self-hosted for clean PDFs; Reducto Extract (about $20 per 1,000 pages) or LlamaParse Cost-effective tier for scans; store extracted fields with confidence and a link to the source page [Fact for prices; Inference for the choice].

Licences that block commercial embedding: Nango and Airbyte platform ELv2 (Airbyte's FAQ allows bringing data in for your customers inside your product, forbids selling Airbyte as ELT or exposing its UI/API [Fact]); Pipedream excludes any commercial use and Workday agreed to acquire it on 19 Nov 2025 [Fact]; n8n Sustainable Use Licence [Unverified]; dltHub toolkit licence treats generated code as derivative [Fact]. Clean: dlt (Apache-2.0), Airbyte Python CDK (MIT) [Fact].

Contractual constraint: Xero's terms forbid using API data to train or contribute to any AI or ML model (developers registered from 4 Dec 2025; everyone from 2 Mar 2026) [Fact]. Never put Xero data into fine-tuning or training sets; check prompt caching, evaluation datasets and the self-learning loop (section 6) against the clause [Inference].

**Copies.**
- Document 24, section 1.3 and "What to copy" 1–2: protocol and state. https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md
- Document 24, "What to copy" 3–5: Xero, QuickBooks, NetSuite rules. https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-xero/manifest.yaml ; https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml ; https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/quickbooks.md ; https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md
- Document 24, "What to copy" 7: schema-change policy. https://github.com/airbytehq/airbyte/blob/master/docs/platform/using-airbyte/schema-change-management.md
- Document 24, "What to copy" 8–9: three access paths; skill document. https://github.com/airbytehq/airbyte/blob/master/docs/platform/context-layer/readme.md ; https://github.com/airbytehq/airbyte/blob/master/docs/platform/airbyte-mcp/tools.md
- Document 24, section 6.1: Nango pricing, prebuilt functions, webhook routing. https://nango.dev/pricing ; https://github.com/NangoHQ/nango/blob/master/docs/snippets/generated/xero/PreBuiltUseCases.mdx ; https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/google-mail/webhooks.mdx ; https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/xero/webhooks.mdx
- Document 24, section 8.1 and "What to copy" 15–16: Xero tiers, limits, egress, AI clause. https://developer.xero.com/pricing ; https://developer.xero.com/faq/pricing-and-policy-updates
- Document 24, key finding 1: Intuit metering (secondary). https://www.apideck.com/blog/quickbooks-api-pricing-and-the-intuit-app-partner-program
- Document 24, section 7.2: Gmail quota; Nylas. https://developers.google.com/workspace/gmail/api/reference/quota ; https://www.nylas.com/pricing/
- Document 14, section 26: dlt grammar. https://github.com/dlt-hub/dlt/blob/HEAD/dlt/sources/rest_api/typing.py
- Document 24, section 1.4 and licence FAQ. https://github.com/airbytehq/airbyte/blob/master/docs/community/licenses/license-faq.md

**Left out, and why.** Unified APIs (Merge about $3,900 a month at 20 customers × 3 ledgers by document 24's arithmetic; Apideck from $599; Unified.to from $750; Codat and Rutter unpublished): too expensive below three ledgers and, for Merge/Codat/Rutter, a second stored copy of the customer's ledger to explain in security reviews. Rutter kept as the option only when a customer needs MYOB, QuickBooks Desktop or Sage 50. Airbyte Cloud: not multi-tenant behind another product. Agent tool platforms (Composio $0.005 a call, Arcade $0.01, Zapier MCP two tasks per call): no stored, deduplicated history to compute metrics on. Copying Nango's `providers.yaml`: ELv2 data file; re-derive endpoints from providers' docs.

**Open questions.** Xero webhook coverage of payments and credit notes; Intuit CDC limits; NetSuite delete detection; Graph throttling; Google restricted-scope cost and timeline; whether Malaysian ledgers SQL Account and AutoCount expose any API (no integration vendor covers them [Fact]).

### 6. Durable jobs

**Purpose.** Long or failure-prone work (syncs, write-back to the ledger, multi-step agent tasks, scheduled reminder runs) survives crashes and is resumed, not blindly re-run. Receivables example: the process dies after Xero accepted a credit-note note but before the local commit; on restart, the memoised step result is reused and the local commit completes.

**Design to implement.**
- **DBOS Transact TS (MIT core)** as the durable workflow layer. State lives in Postgres system tables: `workflow_status` (status, name, authenticated_user, assumed_role, request, output, error, executor_id, created_at), `operation_outputs(workflow_uuid, function_id, function_name, output, error)` (the per-step memo that makes replay safe), `notifications`, `workflow_events`, `workflow_schedules`, `queues`, `application_versions` [Fact].
- Do not use the four features gated behind the proprietary `@dbos-inc/dbos-enterprise` package: auto-upgrade, sharding, suspend workflows, external storage [Fact].
- **pg-boss 12 (MIT)** as the alternative for plain job queues (partitioned `job` table per queue, `queue`, `schedule`, `subscription`) [Fact].
- Workflows to put on it [Inference]: per-stream sync runs (one workflow per connection per schedule tick); action write-back (section 13 step 7 as a DBOS step); nightly reconcile; reminder playbook evaluations (section 11); phase-B LLM extraction (section 7); daily context normalisation (section 9).
- Ingestion idempotency on `(source_id, source_type, unit_id)` (mycontext, design only [Fact]).
- Human-in-the-loop parking: a step waiting for approval parks without spending an attempt (AgentScope SOP [Fact]); LangGraph's `interrupt(value)` and resume is the same idea [Fact].

**Copies.**
- Document 14, section 25: DBOS tables and enterprise gate; pg-boss; Temporal weight. https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts ; https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/enterprise.ts ; https://github.com/timgit/pg-boss/blob/HEAD/src/plans.ts
- Document 14, "What to copy" 3: pending-invocation record via `operation_outputs`.
- Document 14, section 24: AgentScope SOP parking. https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py

**Left out, and why.** Temporal: a separate multi-service cluster; skip until there are operations staff (document 14). DBOS enterprise features: proprietary.

**Open questions.** Whether DBOS's per-step memo covers external side effects whose response is lost mid-flight (document 14 does not say) [Inference: still pass an idempotency key to the ledger where it supports one].

### 7. Temporal facts (four timestamps, invalidation rule) and graph tables in plain PostgreSQL

**Purpose.** Keep "what was true when" for facts extracted from email, notes and calls, and store links that are not in any ledger, without adding a graph database. Receivables example: "Acme's AP contact is Lim" from March; in September an email says Tan took over. The March fact is closed, not overwritten, so "who was the contact when we sent the July reminder?" still has an answer. "We will pay by Friday" becomes a promise whose validity starts when it was said, not on Friday.

**Design to implement.**

Fact edges (Graphiti design, ported to Postgres):
- `facts(org_id, id uuid, group_id, src_node_id, tgt_node_id, name, fact text, fact_embedding vector, episodes uuid[], valid_at, invalid_at, created_at, expired_at, reference_time, attributes jsonb, markings)`. `valid_at`/`invalid_at` are world time; `created_at`/`expired_at` are transaction time; `episodes[]` is provenance [Fact].
- `episodes(org_id, id, source, source_ref, content, valid_at)`: the raw source unit (an email, a call note) [Fact].
- Ingestion with an allow-list of edge types per `(source label, target label)` pair; an edge whose name is not allowed between its endpoints is dropped or renamed to a default (`enforce_edge_type_signatures` [Fact]; neo4j `Pattern` triples are the same idea [Fact]).
- Invalidation, three steps [Fact]:
  1. Fast path: reuse an existing edge with matching endpoints and identical normalised fact text.
  2. Otherwise one small-model LLM call receives duplicate candidates and invalidation candidates with **continuous integer indices** (never UUIDs) and returns `duplicate_facts` and `contradicted_facts`; out-of-range indices are logged and discarded.
  3. Deterministic rule: if the validity windows do not overlap, do nothing; if the old edge started before the new one, set `old.invalid_at = new.valid_at` and `old.expired_at = now()`.
- Future-tense normaliser: regular expressions (will, plans to, scheduled to, by/deadline, until/expires …) so a promise's `valid_at` is the statement time and a soft deadline does not become `invalid_at` [Fact].
- Two-phase ingestion for mailboxes and documents (mycontext, design only): Phase A chunks, stores lineage and embeds with no LLM, so dense and BM25 search work immediately; Phase B runs LLM extraction and caches results per chunk hash so they replay across rebuilds [Fact].
- "Report only confirmed writes" and integer-ID mapping (mem0 [Fact]).

Graph tables (LightRAG `PGTableGraphStorage` design):
- `graph_nodes(org_id, id, label, props jsonb)` and `graph_edges(org_id, src, tgt, label, props jsonb)` with B-tree indexes; node upserts merge properties with `jsonb ||`; edge upserts replace properties and create missing endpoints [Fact].
- LightRAG stores each edge once in canonical order (`src = min(a,b)`, computed in application code because SQL `LEAST` differs under non-C collations) [Fact]. [Inference] Use canonical order only for undirected edges; business links are directed and keep their direction.
- Traversal: a frontier-capped iterative BFS with per-hop filtering and degree ranking in SQL, cost bounded by `max_nodes` [Fact]. [Inference] Default `max_nodes` 200 and 2 hops; permission predicates (section 3) applied at every hop, not after.
- Vectors: pgvector tables keyed `(org_id, id)` with provenance columns (`chunk_ids[]`, `file_path`) as in LightRAG's DDL [Fact].
- [Inference] Ledger-backed object links (Invoice → Customer) stay as ordinary foreign keys in the normalised tables; the generic graph tables hold only owned and extracted links.

**Copies.**
- Document 14, section 8 and "What to copy" 15: Graphiti schema, invalidation, normaliser. https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/edges.py ; https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py ; https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/temporal_edge_utils.py
- Document 14, section 9 and "What to copy" 16: graph in plain Postgres. https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py ; https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/postgres_impl.py
- Document 14, section 16 and "What to copy" 17: two-phase ingestion (design only, ELv2). https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md
- Document 14, section 13: mem0 integer mapping, confirmed writes. https://github.com/mem0ai/mem0/blob/HEAD/mem0/memory/main.py
- Document 11, section 14: neo4j `Pattern` allow-list and resolver cascade (exact, fuzzy, semantic). https://github.com/neo4j/neo4j-graphrag-python

**Left out, and why.** Graphiti, KAG/OpenSPG, GraphRAG and HippoRAG as runtime dependencies (Python plus a graph database or heavy batch pipeline; HippoRAG is alpha). Apache AGE/Cypher (LightRAG's other Postgres graph class): extra extension, not needed. mem0 as company memory (user-centric; temporal and decay features not in OSS; PostHog telemetry on by default [Fact]). GraphRAG community reports: optional batch job in version 2.

**Open questions.** Quality of Graphiti's invalidation on Malay/English mixed email was not measured (no benchmarks run). Whether Splink (MIT, Postgres backend) is needed in version 1 for merging duplicate customers across ledgers, or only once a customer runs two ledgers.

### 8. Two-tier knowledge (auto-learned with a score, human-certified overriding)

**Purpose.** The system learns definitions and habits automatically, but anything a human has certified always wins, and nothing learned silently overwrites the model. Receivables example: the system learns from collectors' behaviour that "overdue" usually means "past due date plus 7 days grace"; the finance controller's certified definition of `overdue_balance` (past due date, no grace) still governs every answer, and the agent mentions the conflict.

**Design to implement.**
- `knowledge_items(org_id, id, tier: learned|modeled, kind: metric_definition|authoritative_source|business_rule|term|memory|instruction, body, source_asset, author, domains[], lineage, authority_score, certification: certified|deprecated|null, owner, scope: global|personal|agent, status, provenance jsonb, created_at)`. [Inference: one table; the fields are Databricks' snippet fields plus OpenAI's memory scopes.]
- **Learned** items are auto-extracted, read-only, and carry source, author, domains, lineage and an authority score. To change one, fix the source or model the concept ("fix the source, not the snippet") [Fact, Databricks].
- **Modeled** items are human-authored definitions (objects, metrics, Pages-style term definitions with domain, owner, synonyms, description, body, related assets) with certification and deprecation tags [Fact, Databricks Pages].
- Conflict rule: modeled and certified knowledge wins; if a conflict cannot be resolved, ask the user (Genie [Fact]). Overlapping definitions from different sources are kept side by side with their source until an owner reconciles them, but assign an owner so they do not live side by side forever (Google, and document 11's warning).
- Authority score: Databricks' OntoRank weighs source authority, certification, author expertise and collaboration closeness, popularity and recency; the formula is not published [Fact/Unverified]. Document 11 warns popularity signals mean little at small scale [Inference]. Version 1 score [Inference]: source type weight (ledger > certified document > SOP document > email > chat) × freshness decay, plus a bonus for an explicit owner; no popularity term.
- Self-improvement gate (Google self-learning enrichment [Vendor claim]): detect ambiguous lookups, ungrounded metrics, missing definitions and rephrased questions from agent traces; find an answer in connected documents; stage a proposal with citations and a confidence score; auto-apply above a threshold (Google's example 85%); anything below the threshold and **every deletion** becomes a change request; log provenance and allow revert. [Inference] In version 1, auto-apply only to the learned tier; promotions to modeled always need a human.
- Memory (OpenAI in-house agent [Fact]): the agent prompts the user to save corrections and non-obvious filters; users can create, edit and delete them; scope global or personal. Memory writes keep provenance and can require confirmation before other agents use them (Salesforce ACE [Vendor claim]). Versioned memory: every change stored as a diff with history, in Postgres rows (letta-code's git-backed memory, design only [Fact]).
- Visibility: learned items inherit permissions from their source assets (Genie [Fact]); never account-wide visibility for items from external sources (Databricks beta hole [Fact]).

**Copies.**
- Document 11, section 3 and "What to copy" 7: learned versus modeled, authority, fix-the-source. https://docs.databricks.com/aws/en/genie/genie-ontology ; https://databricks.com/blog/announcing-ga-genie-ontology ; https://docs.databricks.com/aws/en/uc-semantics/pages
- Document 11, section 6 and "What to copy" 9: confidence-gated proposals, change requests. https://cloud.google.com/blog/products/data-analytics/knowledge-catalog-self-learning-context-enrichment-for-ai-agents
- Document 11, section 7: memory with global/personal scope. https://openai.com/index/inside-our-in-house-data-agent/
- Document 11, section 8: ACE memory provenance and confirmation. https://www.salesforce.com/blog/?p=157012
- Document 14, section 15: versioned memory. https://github.com/letta-ai/letta-code (memory-filesystem.ts)

**Left out, and why.** OntoRank popularity and collaborator signals (no usage volume at this size). Workday-directory weighting of close collaborators (version 2 if ever).

**Open questions.** Whether learning from traces that contain Xero data counts as "contributing to an AI model" under Xero's terms (see Contradictions). The right auto-apply threshold for a finance domain.

### 9. Cold start, and the design for a company with only SaaS apps

**Purpose.** Get a useful model for a new customer in days without interviews or a data team. Receivables example: connect Xero and Gmail on day one; by day two the agent can answer "who owes us most and what did they last say?".

**Design to implement.**

Every product's cold-start method, as the documents report it:

| Product | Cold-start inputs | Status |
|---|---|---|
| Fabric IQ | "Generate Ontology" from a Power BI semantic model: tables → entity types, columns → properties, relationships → relationship types, DAX measures → metrics; manual follow-up for keys, time series, bindings, friendly names; ontology agent samples a few rows per table in its Discover stage | [Fact] |
| Snowflake Autopilot | Query history, question/SQL CSV, table and column comments, Tableau TWB/TDS, Power BI PBIX/PBIT, YAML, sample values; outputs tables, relationships, metrics, descriptions, keys inferred from metadata or distinct counts, verified and suggested queries; post-creation suggestions | [Fact] |
| Databricks Genie Ontology | Mines metric views, dashboards, SQL query history (including dbt), notebooks, Genie Agents, Power BI models (beta) into snippets; Unity Catalog primary/foreign keys saved as joins; Pages bulk import from documents with conflict, duplicate and low-confidence flags | [Fact] |
| Google Knowledge Catalog | Joins and golden queries from query logs; data profiles; interaction traces; document mining (Docs, GitHub, Confluence, SharePoint, GCS); ingestion of LookML, dbt, Snowflake, Databricks, SAP CSN models | [Fact]/[Vendor claim] |
| OpenAI in-house agent | Table usage and lineage; human annotations; Codex crawling pipeline code; Slack/Docs/Notion | [Fact] |
| Salesforce ACE | Business experts define sources, terms and intended use per job; Data 360 identity resolution | [Vendor claim] |
| Workday Data Cloud | 240+ pre-curated business objects and prebuilt finance/HCM semantic models | [Vendor claim] |
| Oracle AI Data Platform | AI Discovery agent drafts ontologies from schemas, semantic models, API docs and documents; experts approve | [Vendor claim], not shipped |
| Atlan | Context agents generate certified descriptions, glossary terms and ontology relationships | [Vendor claim] |
| dbt, Cube | Hand-authored YAML (Cube with AI assist [Unverified]) | [Fact] |
| Neo4j GraphRAG | Schema supplied, extracted from text (`SchemaFromTextExtractor`) or reverse-engineered from an existing graph | [Fact] |
| Airbyte | `discover` catalog; AI assistant reads API docs to pre-fill a connector manifest | [Fact] |

Document 11's conclusion: every incumbent mines analytics artefacts (warehouse, BI model, query history) that a 100–1,000 person company on SaaS apps does not have [Inference]. The equivalents to mine are SaaS schemas, reports and saved views inside those apps, spreadsheets and SOP documents [Inference, document 11].

Design for a SaaS-only company [Inference, each step tied to a documented pattern]:
1. **Prebuilt domain template** (Workday's pre-curated objects): ship a certified receivables ontology and metric set, plus one prebuilt mapping file per ledger (Xero, QuickBooks, NetSuite). The customer starts from a modeled tier that is already certified by the product, to be re-certified by their controller.
2. **Connector discovery** (Airbyte `discover`; NetSuite's REST record metadata catalog): list the customer's actual record types and custom fields and diff them against the template's mapping.
3. **Sample rows** (Fabric Discover): sample a few rows per stream to infer keys by distinct counts (Snowflake), value formats and representative values for entity matching (Genie format assistance; Genie's caps of 120 columns, 1,024 distinct values, 127 characters per value are a reasonable ceiling [Fact]).
4. **Ledger settings crawl** in place of OpenAI's code crawl: payment terms, tax codes, custom fields, invoice templates and reminder settings define what tables mean in a SaaS-only company.
5. **Document and mailbox mining** (Databricks Pages bulk import; Google document mining): parse the collections SOP, credit policy and a sample of AR mailbox threads into draft Pages and draft rules, deduplicated and flagged for conflicts and low confidence, in the learned tier.
6. **Proposal-first authoring agent** (Fabric ontology agent): Plan mode (discover, draft, validate, explain, no writes) and Act mode (applies changes after stating them); stages Discover → Draft → Validate (structural and grounding checks) → Apply; read-only diff of added, edited and removed items with an explanation each; stable IDs.
7. **Onboarding questions**: verified queries flagged `onboardingQuestion` are shown as first-run suggestions (Snowflake) and double as the first evaluation set (section 16); a "test the model" step generates representative questions (Fabric).
8. **Learn from use**: from week one, the trace-driven proposal loop (section 8) replaces the missing query history.

**Copies.**
- Document 11, "Key findings" 3 and 12, and sections 1, 3, 4, 6, 7, 9: methods table. URLs: https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models ; https://docs.snowflake.com/en/user-guide/views-semantic/autopilot ; https://databricks.com/blog/announcing-ga-genie-ontology ; https://docs.cloud.google.com/knowledge-catalog/docs/about-context ; https://openai.com/index/inside-our-in-house-data-agent/ ; https://blog.workday.com/en-us/four-layers-workday-data-cloud.html ; https://www.oracle.com/news/announcement/ai-world-oracle-ai-data-platform-brings-ai-assisted-business-context-to-enterprise-ai-2026-10-27/
- Document 11, section 1 and "What to copy" 8: proposal-first agent. https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent
- Document 11, section 3: Pages bulk import. https://docs.databricks.com/aws/en/uc-semantics/pages
- Document 24, section 1.3: Airbyte discover and NetSuite metadata discovery. https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md

**Left out, and why.** Query-history mining and BI-model import (inputs do not exist for these customers). Forward-deployed setup (Frontier, C3, Cognite): not feasible for a solo founder; onboarding must be self-serve and agent-driven (document 11).

**Open questions.** How many customers already keep receivables rules in spreadsheets that should be imported (no data in the documents). Fabric's ontology agent caps conversations at 24 hours and keeps data 2 days [Fact] — what retention should the onboarding agent's conversations have?

### 10. The six-layer context design (OpenAI in-house data agent), adapted

**Purpose.** Decide what the agent is told, in what order and within what budget, so answers are grounded and small. Receivables example: for "Why is Acme late?", the agent gets Acme's profile, open invoices, the certified `overdue_balance` definition, the last three email facts and the collector's saved memory "Acme pays on the 25th".

**Design to implement.** OpenAI's six layers [Fact], mapped to a SaaS-only company [Inference]:

| OpenAI layer | What OpenAI uses | Equivalent here |
|---|---|---|
| 1. Table usage | Schema, lineage, historical queries showing common joins | Model schema plus the product's own agent query log (no warehouse history exists) |
| 2. Human annotations | Expert descriptions and caveats | `aiContext`, Pages, certified definitions (sections 1, 8) |
| 3. Codex enrichment | Crawls pipeline code for derivation, uniqueness, update frequency, scope | Ledger settings and connector config crawl; sync freshness per stream |
| 4. Institutional knowledge | Slack, Docs, Notion, embedded with permissions; ACLs enforced at retrieval | SOPs, credit policy, AR mailbox chunks, with markings enforced at retrieval |
| 5. Memory | User-confirmed corrections, global or personal | Section 8 memory |
| 6. Runtime context | Live warehouse queries, metadata service, Airflow, Spark | Live direct reads through the Nango proxy; temporal facts; current sync status |

- Layers 1–3 are normalised by a daily offline job into embeddings (OpenAI [Fact]) — a DBOS scheduled workflow here.
- Assembly order **entity-first** (Salesforce ACE [Vendor claim]): resolve the customer or object first, then traverse only permitted edges to build a scoped payload (profile, memories, signals, graph slice).
- Reading order for a domain bundle (Google context sets [Fact]): root index first, then matching query templates (verified queries), then object context, then concepts, learnings and documents.
- One budgeted call (Google LookupContext [Fact]): `lookup_context(resources ≤ 10, format yaml|json, budget_chars)` returns schema, links, definitions, sample values, quality and related objects, plus the relationships between the requested objects, in one LLM-ready block. dbt lesson: return the metric, its dimensions and sample values in one payload instead of a chatty loop [Inference, document 11].
- Freshness labels: each item states which access path answered (synced table, live read, search index) and its age (Airbyte context layer [Fact]).
- Every answer summarises its assumptions and links to results (OpenAI [Fact]); read tools return object type plus record ID so a later action acts on exactly those records (ServiceNow [Fact]).
- Lessons kept: consolidate tools; guide the goal, not the path; meaning lives in code — here, in connector config and ledger settings (OpenAI [Fact]; adaptation [Inference]).
- Limits [Inference]: default `budget_chars` 24,000 per call; keep each agent bound to one domain bundle (document 11, key finding 13).

**Copies.**
- Document 11, section 7 and "What to copy" 12. https://openai.com/index/inside-our-in-house-data-agent/
- Document 11, section 6 and "What to copy" 10–11. https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context ; https://docs.cloud.google.com/knowledge-catalog/docs/context-sets
- Document 11, section 8 and "What to copy" 18. https://www.salesforce.com/blog/?p=157012
- Document 11, section 9 and "What to copy" 19. https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html
- Document 24, "What to copy" 8. https://github.com/airbytehq/airbyte/blob/master/docs/platform/context-layer/readme.md

**Left out, and why.** Dependence on dense warehouse query history (absent). Answer caps such as Fabric's 25 rows × 25 columns (fits chat, not reporting). Foundry IQ-style multi-source agentic retrieval with reasoning effort levels: version 2 if document search becomes a bottleneck.

**Open questions.** The right default budget per model (Claude versus Qwen context windows are not in the documents). How to rank layer 4 chunks against layer 5 memories when they disagree [Inference: memory wins only if confirmed and newer].

### 11. Metric compilation and safe-join rules

**Purpose.** Agents ask for metrics by name; the product writes correct SQL, never double-counts across joins, and applies permissions. Receivables example: "overdue balance by collector for the last 90 days" compiles to SQL that joins invoices to customers (many-to-one, safe) and never joins invoices to payments in a way that repeats invoice amounts.

**Design to implement.**
- Decision: **write a small compiler in TypeScript** that copies MetricFlow's rules, because the data lives in the product's own Postgres (normalised receivables tables), not in a customer warehouse. Document 14's verdict is to adopt the MetricFlow sidecar only when metrics must compile over a customer's warehouse; otherwise copy the design [Inference, document 14].
- Agents never emit SQL. They emit a semantic request: `{metrics[], groupBy[], where[] (JSON condition IR), orderBy[], limit, timeRange}` (MetricFlow sidecar parameters [Fact]; Cube semantic query [Vendor claim]).
- Pipeline (MetricFlow dataflow plan [Fact]): read source → filter elements → join to base (only allowed joins) → join to time spine (cumulative or `joinToTimespine`) → where filter → aggregate simple metric inputs → compute metrics (ratio, derived) → semi-additive join for `nonAdditiveDimension` → order/limit → render Postgres SQL.
- Join safety (MetricFlow `_VALID_ENTITY_JOINS` [Fact]): allowed — primary → {natural, primary, unique}; unique → {natural, primary, unique}; foreign → {natural, primary, unique}; natural → {primary, unique}. Any join landing on a foreign entity is invalid; natural → natural is invalid. `MAX_JOIN_HOPS = 2`.
- Composition: model-scoped metrics compose object metrics only through `AGG(object.metric)` (Ossie [Fact]); measures are locked to the key grain of their object, so `AGG()` over joins never double-counts (BigQuery Graph measures [Fact]).
- `using(link)` pins the join path when two exist (Snowflake [Fact]); without it, ambiguous paths are an error, not a guess [Inference].
- Semi-additive metrics: balances such as `ar_balance` use `nonAdditiveDimension {name: snapshot_date, windowAgg: last}` (MetricFlow/dbt [Fact]; Snowflake `NON ADDITIVE BY` [Fact]).
- Permissions: the section 3 predicates are folded in at the "read source" node, before aggregation; any path that resolves to no permitted object yields `1 = 0` (Cube [Fact]).
- Private metrics and properties are usable as inputs but not requestable (Snowflake [Fact]).
- Execution: run under the request transaction with `SET LOCAL app.org_id` (section 3); return rows plus the compiled SQL for audit and evaluation (dbt `get_metrics_compiled_sql` [Fact]).
- Version 1 metric types [Inference]: simple, ratio, derived, plus `nonAdditiveDimension`. Version 2: cumulative (needs a time spine), conversion (e.g., reminder → payment within N days), symmetric aggregates if fan-out joins are ever allowed (Malloy "shifty sum" [Fact]).
- Fallback: if the hand-written compiler stalls, spawn the MetricFlow sidecar (Apache-2.0, NDJSON `explain` over stdin/stdout, Postgres renderer exists, parameters `manifest_path`, `metric_names`, `group_by_names`, `where_constraints`, `order_by_names`, `limit`, `sql_engine`) and execute the returned SQL under your own filters [Fact for the protocol].

**Copies.**
- Document 14, section 4 and "What to copy" 13. https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py ; https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow/dataflow/builder/dataflow_plan_builder.py ; https://github.com/dbt-labs/metricflow/blob/HEAD/sidecar/mf_ipc_protocol.py ; https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantic_interfaces/protocols/metric.py
- Document 11, section 6 and "What to copy" 6: key-grain measures. https://docs.cloud.google.com/bigquery/docs/graph-measures
- Document 11, section 4: `USING`, `NON ADDITIVE BY`, `PRIVATE`. https://docs.snowflake.com/en/sql-reference/sql/create-semantic-view
- Document 11, section 11: Cube semantic-query output. https://cube.dev/blog/a-practical-guide-to-getting-started-with-cubes-ai-api
- Document 14, section 6: Malloy symmetric aggregates (version 2). https://github.com/malloydata/malloy/blob/HEAD/packages/malloy/src/dialect/shifty_sum_distinct.ts

**Left out, and why.** Running Cube itself (a second semantic layer beside the ontology [Inference]). Malloy as a dependency (a whole language). Databricks `rely.at_most_one_match` hint (not validated; wrong use gives wrong measures [Fact]). Materialised metric views (Databricks: impossible with row-level security [Fact]; at this data size, [Inference] not needed).

**Open questions.** Whether MetricFlow's relicensing to Apache-2.0 is settled (document 14 unverified). Whether two hops are enough for receivables (Invoice → Customer → Collector is two hops; Allocation → Payment → Customer → Collector is three) [Inference: model `collector_id` on Customer and keep the limit].

### 12. Public Palantir SDK metadata format (action IR, conditions, ObjectSet, validate/apply)

**Purpose.** Use the most authoritative public description of how Palantir encodes actions, submission criteria and object queries as the JSON shape for the product's own actions and queries. Receivables example: the action `sendPaymentReminder` has a submission criterion "invoice.status = OVERDUE AND customer.doNotContact = false", expressed as JSON, not code.

**Design to implement.**
- Condition IR (`OntologyIrCondition`, nine variants [Fact]): `true | and | or | not | comparison | markings | regex | executionContext | redacted`. Comparison operators: `<=, <, =, !=, >=, >, INTERSECTS, IS_OF_OBJECT_TYPE`. Values: `parameterId | staticValue | objectParameterPropertyValue | interfaceParameterPropertyValue | userProperty | parameterLength`. Used for action submission criteria, rule `requires`, policy conditions and metric `where`.
- Logic rules (`OntologyIrLogicRule`, twelve variants [Fact]); version 1 subset (document 14 "What to copy" 6): `addObject`, `modifyObject`, `addOrModifyObject`, `deleteObject`, `addLink`, `deleteLink`, `function` (computes edits), `webhook` (side effect). [Inference] Deletes stay out of version 1, as in operational-ontology.
- Action definition (osdk-ts `ActionDefinition` and maker `ActionType` [Fact]): `apiName`, `parameters` typed as base types (boolean, string, integer, long, double, decimal, datetime, timestamp, attachment, marking …) or `object | objectSet | interface | struct`; `modifiedEntities {created, modified}` per object type; `rules[]`; `validation[]` (submission criteria with `configuredFailureMessage`); `sections`, `parameterOrdering`; `submissionMetadata`; `isolationSettings` (runtime isolation and retries).
- Apply API (foundry-platform-python [Fact]): `apply` with `options {mode: VALIDATE_ONLY | VALIDATE_AND_EXECUTE, returnEdits: ALL | ALL_V2_WITH_DELETIONS | NONE}`; `$validateOnly` and `$returnEdits` are mutually exclusive in osdk-ts [Fact]; `applyBatch`. Validate response: `{result: VALID|INVALID, submissionCriteria: [{configuredFailureMessage, result}], parameters: {id: evaluation}}`.
- ObjectSet algebra as the agent's query language (foundry-platform-python, 15 variants [Fact]); version 1 subset: `base`, `static(pks)`, `filter`, `searchAround(link)`, `union`, `intersect`, `subtract`, `withProperties` (derived), `nearestNeighbors` (vector). Compiled to SQL with permission predicates folded in (section 3).
- Error taxonomy (Conjure [Fact]): `PERMISSION_DENIED, INVALID_ARGUMENT, NOT_FOUND, CONFLICT, REQUEST_ENTITY_TOO_LARGE, FAILED_PRECONDITION, INTERNAL, TIMEOUT, CUSTOM_CLIENT, CUSTOM_SERVER`, each error split into `safeArgs` and `unsafeArgs`.
- Confirm-preview handshake (OntoForge [Fact]): if `requireConfirm`, the first call returns `{needConfirm: true, preview}` until repeated with `confirmed`.
- Naming: mirror the shapes (Apache-2.0) but do not use Palantir trademarks in the product (document 14 [Inference]).

**Copies.**
- Document 14, section 2 and "What to copy" 4–6, 8, 22. https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts ; https://github.com/palantir/osdk-ts/blob/HEAD/packages/api/src/ontology/ObjectTypeDefinition.ts ; https://github.com/palantir/osdk-ts/blob/HEAD/packages/maker/src/api/action/ActionType.ts ; https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py ; https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md
- Document 14, section 3: OntoForge confirm-preview and nine-operator JSON rules. https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/actions.py

**Left out, and why.** Interface types and interface links (version 2). Scenario logic rules (no use for receivables yet). The SDKs as dependencies (only useful against a real Foundry [Inference]). Conjure's Gradle/Java toolchain.

**Open questions.** Which of the twelve logic rules a receivables v1 actually needs beyond modifyObject, addObject and webhook.

### 13. Action gate (checks, dry run in a rolled-back transaction, write to source first, commit with audit)

**Purpose.** The only way anything changes. Every agent or staff write goes through a named, typed action that checks rules, previews its edits, writes to the ledger first, and records the attempt whether it succeeds or not. Receivables example: `logPromiseToPay(invoiceId, date, amount)` checks the invoice is open, previews the edit, writes a note to Xero, then commits locally and audits.

**Design to implement** (operational-ontology's order [Fact], plus the production additions document 14 lists):
1. **Idempotency**: the caller supplies or the runtime derives `invocation_id`; a repeated id returns the stored outcome. [Fact: the reference has no idempotency keys; addition recommended by document 14.]
2. **Parse** parameters with Zod.
3. **Authorise** with Cedar (section 3): principal, agent principal, action, target, context. Deny → audit `rejected` with `PERMISSION_DENIED`.
4. **Load** the target object(s).
5. **Preconditions / submission criteria**: evaluate the JSON condition IR; each failure returns `Violation {code, message}` (operational-ontology `reject(code, message)` [Fact]; Foundry `configuredFailureMessage` [Fact]).
6. **Effects** as data: `Edit[]` of `modify | create | link | unlink` (operational-ontology [Fact]).
7. **Preflight**: apply the edits inside a transaction that always throws `Rollback`, so the commit code validates them and there is no second validator to drift [Fact].
8. **Authority check**: an edit plan touching source-backed state requires `writeback: true`; one touching only ontology-owned state forbids it; a plan mixing both is refused [Fact].
9. If `mode = VALIDATE_ONLY`, return `{result, submissionCriteria, parameters, edits?}` and stop. If `confirmation_required`, return the preview and require a confirmed second call with a justification string (CapTrix, OntoForge [Fact]). Agents call validate first.
10. **Pending record**: write `pending_invocations(invocation_id, action, actor, agent_principal, target, params, edits, status)` **before** write-back (document 14 addition; DBOS `operation_outputs` provides this).
11. **Write back to the source first**, as a DBOS step: `WritebackAdapter.apply(edits, {action, actor, target})` through the Nango proxy or tool [Fact for the adapter call; DBOS step is document 14's recommendation].
12. **Commit** local edits and the audit row in one transaction [Fact].
13. **Audit** every attempt, applied or refused: `audit_log(org_id, seq, ts, actor, agent_principal, action, target, params (redacted by safety flags), status IN ('applied','rejected'), error_code, error, edits, invocation_id, trace_id)`. Failure codes `WRITEBACK_FAILED`, `COMMIT_FAILED`, `EXECUTION_CRASHED` [Fact for the codes and the two statuses].
- Storage: `objects`, `links`, `overlay(type, pk, patch)` (ontology-owned patches reapplied after a source re-index), `audit_log` (operational-ontology's four tables [Fact]); in this product the ledger-backed objects are the normalised `ar_*` tables and overlay holds owned properties such as `doNotContact` or `assignedCollector` [Inference].
- Failure behaviour: if the process dies after write-back and before commit, the DBOS workflow resumes from the memoised write-back output and completes the commit (closes the gap the reference documents [Fact]). Visibility fails closed and the actor comes from authentication, never self-declared (both are limits of the reference [Fact]).
- Monitoring-triggered actions (reminder runs) come from section 14's playbook and pass through the same gate.

**Copies.**
- Document 14, section 1 and "What to copy" 1–3. https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts ; https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md
- Document 14, "What to copy" 4 and 7: validate/apply; confirmation with justification. https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py ; https://github.com/CapTrix/openfoundry/blob/HEAD/libs/ontology-kernel/models/action_type.go
- Document 14, section 25: DBOS step memo. https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts
- Document 11, section 17: no product has actions as typed ontology members — this is the gap the gate fills [Inference, document 11].

**Left out, and why.** Deletes (out of scope in the reference too). Generic update tools and raw SQL (deliberately absent [Fact]). Przyval's action engine (submission criteria hard-coded empty [Fact]). CapTrix code (AGPL).

**Open questions.** How to reconcile when the ledger accepted the write but returned an error to the client (needs per-ledger idempotency support; not in the documents). Whether write-back for email sends (a side effect, not a ledger write) should use the `webhook` logic rule.

### 14. Rules engines

**Purpose.** Business rules that are evaluated, not just described: preconditions on actions, eligibility and threshold tables, and monitoring conditions that trigger work. Receivables example: "Do not send a reminder within 5 days of a promise to pay"; a dunning ladder table (days overdue × customer tier → template and channel); a monitor "invoice becomes 30 days overdue".

**Design to implement.**
- Rule record (Fabric [Fact]) with `enforcement: advisory | enforced` and `requires` in the JSON condition IR (section 12). Advisory rules are text the agent reads (`list_rules` tool); enforced rules are evaluated by the action gate. Never store rules as code strings (anti-source: `eval()` in foundry-ontology-open [Fact]).
- Evaluator for preconditions: a small TypeScript evaluator of the Palantir-shaped condition IR (document 14 verdict [Inference]); json-rules-engine (ISC, all/any/not, custom operators, async facts) is the off-the-shelf alternative [Fact].
- Decision tables, when business users must edit them: **GoRules Zen** (`@gorules/zen-engine` 2.1.12, MIT, Rust with napi). JSON Decision Model nodes: Input, Output, Function (JavaScript), Decision, DecisionTable (hit policy `first` or `collect`), Expression, Switch, Custom; traces (`BlockTrace`, `ConditionTrace`) explain why a row fired [Fact]. [Inference] Version 2 for the dunning ladder; version 1 hard-codes the ladder as a certified metric threshold set.
- Monitoring conditions (Fabric operations agent [Fact]): state conditions (is, is above, is below) re-fire every evaluation; transition conditions (becomes, crosses above/below, enters/exits range) fire once per change. Compile instructions, monitored concepts, rules with backing queries and actions into a reviewable **playbook** before the monitor starts. Fabric evaluates every 5 minutes [Fact]; [Inference] receivables needs hourly at most, and after each sync.
- Mixed deterministic and LLM steps in agent procedures: Agent Script's `->` (deterministic logic) and `|` (text for the LLM) split [Fact]; AgentScope SOP steps (subject, description, executor, optional verifier, `max_attempts = 3`) [Fact].

**Copies.**
- Document 11, section 1 and "What to copy" 3, 16. https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules ; https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent
- Document 14, section 30: Zen, json-rules-engine, DMN verdicts. https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs ; https://github.com/gorules/zen/blob/HEAD/core/engine/src/policy/mod.rs
- Document 14, section 2: condition IR. https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts
- Document 11, section 8: Agent Script. https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html
- Document 14, section 24: AgentScope SOP. https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py

**Left out, and why.** DMN (dmn-js is a modeller with a watermark clause; avoid unless a customer demands it [Fact/Inference]). Text-only rules as the whole story (Fabric). Python `eval()`.

**Open questions.** Whether Zen's Function node (JavaScript source) needs sandboxing in a multi-tenant service (not discussed in document 14).

### 15. Agent loop and model interface

**Purpose.** One loop that runs Claude or Qwen (and GPT if wanted) with the same generated tools, hooks and permissions. Receivables example: a tenant switches from Claude to Qwen for cost; the reminder-drafting agent keeps the same tools, permissions and evaluations.

**Design to implement.**
- **Write the loop yourself** over the provider SDKs (Anthropic; OpenAI-compatible endpoint for Qwen via DashScope) [Inference, document 14]. The model is a per-tenant (and per-agent) setting, never fixed by the platform (document 11 warns against Cortex Analyst's fixed order and Fabric's fixed model [Fact]).
- Do **not** build the core loop on the Claude Agent SDK: TypeScript licence is all rights reserved under Anthropic's Commercial Terms; it drives the Claude Code runtime and cannot carry other models' turns [Fact/Inference].
- Copy its surfaces [Fact]: hook events PreToolUse, PostToolUse, PostToolUseFailure, UserPromptSubmit, Stop, SubagentStop, PreCompact, Notification, SubagentStart, PermissionRequest; permission results `allow` (optionally with `updatedInput`) and `deny` (with `message` and `interrupt`); a session store with one JSONB row per transcript entry, ordered by BIGSERIAL, keyed by `(project_key, session_id, subpath)` — here `(org_id, session_id, subpath)` [Inference].
- PreToolUse is where the permission layer and tool-pack check run; PostToolUse is where audit, DLP-style masking of outputs (Merge Agent Handler [Vendor claim]) and safety-flag redaction (Conjure) run [Inference].
- Multi-step procedures: SOP steps with executor and verifier, `max_attempts = 3`, run state that outlives the process, parking on human input (AgentScope [Fact]), running as DBOS workflows (section 6).
- Optional: LangGraph JS (MIT) with its Postgres checkpointer (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`) and `interrupt()`; document 14 judges a hand-written loop simpler for a generated-tool architecture [Fact/Inference].
- Qwen function-calling prompt templates (Qwen-Agent `fncall_prompts`) matter only if a Qwen model without native tool calling is used [Fact/Inference].
- Lessons: few consolidated tools; guide the goal, not the path (OpenAI [Fact]); the Fabric data agent pipeline (validate against policy, rephrase, pick a source, generate, validate, execute, summarise) is a reasonable reading pipeline [Fact].

**Copies.**
- Document 14, section 21. https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py ; https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/LICENSE.md ; https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts
- Document 14, sections 23–24. https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts ; https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py
- Document 11, section 7 lessons; section 2 pipeline. https://openai.com/index/inside-our-in-house-data-agent/ ; https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent

**Left out, and why.** Claude Agent SDK as runtime (licence, single model). Letta V1 server (archived; maintainers forbid new use [Fact]). Snowflake-style per-message pricing that reprocesses full history (cost grows with conversation length [Fact]).

**Open questions.** Whether DashScope exposes an Anthropic-compatible endpoint (document 14 unverified). Tool-calling reliability of Qwen on generated tool sets was not measured.

### 16. MCP server implementation

**Purpose.** The standard surface through which internal and external agents (the product's own and customers' third-party agents) read the model and invoke actions. Receivables example: a finance team's own Claude client connects to the product's MCP server and can call `search_invoice`, `aggregate_invoice` and `logPromiseToPay`, but not raw SQL.

**Design to implement.**
- Adopt `@modelcontextprotocol/server` v2 (2.4.0, Apache-2.0), implementing spec 2026-07-28 [Fact]. That version is stateless: no initialize handshake, no `Mcp-Session-Id`; each request carries protocol version and client capabilities in `_meta`; a mandatory `server/discover` RPC; tasks move to an extension polled with `tasks/get`; MRTR replaces server-initiated sampling/elicitation; deterministic `tools/list` ordering (prompt-cache hits); `ttlMs`/`cacheScope` on list results; OpenTelemetry `traceparent` in `_meta`; JSON Schema 2020-12 for tool schemas [Fact]. Put the actor and tenant in auth, not session state [Inference]; servers mint explicit handles passed as tool arguments [Fact].
- Generated tools (operational-ontology [Fact]): per object type `search_<type>`, `get_<type>`, `aggregate_<type>` and set operations; per link `traverse_<link>` and `pivot_<link>`; one tool per action and per function; `read_audit_log`. No raw-SQL tool and no generic update tool. Fail the build on name collisions. Errors returned as JSON `{error: {code, message}}` with no stack traces.
- Model-level tools (document 11 "What to copy" 20): `list_object_types` (Fabric `list_ontology_entity_types`), `lookup_context` (Google), `list_rules` (Fabric `list_ontology_rules`), `query_metrics` and `get_metrics_compiled_sql` (dbt), and an async pair for long requests — ask/poll/get-result/cancel (Genie One MCP) — with truncated inline results and a separate full-result fetch.
- Annotations: `readOnlyHint` on reads, `destructiveHint` on actions that cancel, write off or send externally, `idempotentHint` where true, `openWorldHint` on tools that reach ledgers or email [Fact for the annotations; mapping is Inference].
- Tool Packs (section 4) decide which generated tools each agent principal sees; internal and external agents get different generated sets from the same model (document 14 "Write from scratch").
- Read tools return object type plus record ID (ServiceNow [Fact]).
- Auth: OAuth 2.1 with PKCE (Glean's MCP auth [Fact]) [Inference: the documents do not prescribe the auth for this product]. Fabric's MCP does not support service principals because of a known issue [Fact] — support agent principals from day one.
- Keep tool counts small; OpenAI found fewer, consolidated tools work better [Fact]. [Inference] Expose `search/get/aggregate` and a few actions per agent rather than every generated tool.

**Copies.**
- Document 14, section 22 and "What to copy" 9. https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx ; https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/schema/2026-07-28/schema.ts ; https://github.com/modelcontextprotocol/typescript-sdk/blob/HEAD/README.md
- Document 14, section 1: generated tool surface. https://github.com/gura105/operational-ontology/blob/HEAD/src/mcp.ts
- Document 11, "Key findings" 8 and "What to copy" 20. https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp ; https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric ; https://docs.cloud.google.com/knowledge-catalog/docs/reference/mcp ; https://github.com/dbt-labs/dbt-mcp
- Document 11, section 13: Glean MCP auth. https://docs.glean.com/administration/platform/mcp/about

**Left out, and why.** v1 `@modelcontextprotocol/sdk` (operational-ontology uses it; it only receives fixes for six months after 2026-07-27 [Fact]). Server-initiated sampling and SSE resumability (removed in 2026-07-28 [Fact]).

**Open questions.** Whether 2026-07-28 is the "current" version on modelcontextprotocol.io (document 14 unverified). Which customer agent clients already speak 2026-07-28.

### 17. Evaluation and tracing tools

**Purpose.** Prove agents give right answers and take right actions, catch regressions before release and in production, and keep a trace of every step. Receivables example: a test seeds a ledger with three overdue invoices and one promise to pay; the agent must send exactly two reminders and tell the collector why the third was skipped; run five times, it must pass all five.

**Design to implement.**
- Answer evaluation (OpenAI [Fact]): a question, golden query and golden result; compare both the generated query and the result data, tolerate syntax differences and immaterial extra columns; run as unit tests in CI and as production canaries. Here the "query" is the semantic request (section 11) and its compiled SQL.
- Action evaluation (tau2-bench [Fact]): seed the database; replay the reference actions to get a target state; reward = product of selected components, default `DB` (end-state match, so any path to an equivalent state passes) × `COMMUNICATE` (required strings appear in the agent's messages); optional `ENV_ASSERTION`, `NL_ASSERTION` (LLM-judged, experimental), `ACTION` (exact trajectory, rarely); report pass^k over k trials; type every tool READ, WRITE or GENERIC.
- Agent-routing checks (Salesforce Testing Center [Fact]): expected topic, expected actions, expected outcome (LLM-judged); synthetic cases generated from agent metadata.
- Sources of cases [Inference]: onboarding questions (section 9), verified queries, and failures detected by the trace loop (section 8). Customers can supply their own evaluation set (Google [Vendor claim]).
- CI: promptfoo (MIT, TypeScript) for prompt and tool regression [Fact]. Context as code with CI evaluations before production (Atlan [Vendor claim]).
- Tracing: emit OpenTelemetry (MCP 2026-07-28 carries `traceparent` in `_meta` [Fact]) and write spans to your own Postgres table in version 1; self-host Phoenix (server ELv2, JS clients Apache-2.0) for internal use only if a UI is needed [Fact/Inference]. Langfuse: core MIT but `ee/` directories commercial, and self-hosting needs Postgres, ClickHouse, Redis, MinIO/S3 and a gateway service [Fact] — too heavy for one person.
- Per-tool-call audit (identity, arguments, downstream calls, outcome) is the same record as the action audit (section 13) plus read calls (Merge [Vendor claim]); redaction by Conjure safety flags.
- Xero clause [Inference]: evaluation datasets containing Xero data must stay out of any model-training path; synthetic seeds are preferable.

**Copies.**
- Document 11, section 7 and "What to copy" 13. https://openai.com/index/inside-our-in-house-data-agent/ ; https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce
- Document 14, section 29 and "What to copy" 25. https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py ; https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/metrics/agent_metrics.py ; https://github.com/langfuse/langfuse/blob/HEAD/LICENSE ; https://github.com/langfuse/langfuse/blob/HEAD/docker-compose.yml
- Document 24, "What to copy" 11. https://www.merge.dev/agent-handler

**Left out, and why.** Langfuse self-hosting (four-service footprint). Exact-trajectory grading as default (penalises valid alternative paths). Salesforce's Einstein-request consumption model (vendor-specific).

**Open questions.** k for pass^k in CI versus nightly (not in the documents) [Inference: k = 3 in CI, k = 8 nightly]. Whether Phoenix's ELv2 permits the planned internal use (document 14 says needs legal review).

### 18. Complete bill of materials

| Component | Choice | Depend on / copy design / write from scratch | Licence | Reason | Source file worth reading |
|---|---|---|---|---|---|
| Database | PostgreSQL 16/17 + pgvector | Depend on | PostgreSQL / PostgreSQL-style | Holds model, objects, graph, vectors, audit, jobs (doc 14 BOM) | https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/postgres_impl.py |
| Schemas and validation | `zod` | Depend on | MIT | One schema for validation, MCP input and forms (doc 14) | https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts |
| Model schema (objects, links, metrics, ai_context, verified queries, instructions) | Own Zod model copying Ossie, Snowflake, dbt, Fabric fields | Copy design | n/a (Ossie Apache-2.0) | Converged object set (doc 11) | https://github.com/apache/ossie/blob/main/core-spec/spec.md |
| File format | Ossie ontology + semantic + mapping YAML, plus own actions and policies YAML | Copy design; write exporter | Apache-2.0 spec | Portable, Git-reviewable; Ossie lacks actions and permissions | https://github.com/apache/ossie/blob/main/ontology/ontology.md |
| Branches and proposals | OntoForge pattern | Copy design | MIT | Reviewed schema changes, instance data not branched | https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/branches.py |
| Schema change events | Transactional outbox | Copy design (AGPL source) | AGPL-3.0 source; own code | Before/after envelopes in same transaction | https://github.com/CapTrix/openfoundry/blob/HEAD/services/ontology-actions-service/internal/repo/events.go |
| Tenant isolation | Forced Postgres RLS + `SET LOCAL` | Copy design | Apache-2.0 source | Database refuses cross-tenant rows | https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/009_multi_tenancy.sql |
| Markings and resource roles | Mandatory/discretionary evaluator + grants table | Copy design | Apache-2.0 source | Label filters for agents and documents | https://github.com/Przyval/openfoundry/blob/HEAD/packages/markings/src/marking-evaluator.ts |
| Object access policies | Cube policy object compiled to SQL predicates | Copy design; write compiler | Apache-2.0 source | Most complete open design for rows, members, masking | https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-server-core/src/core/CompilerApi.ts |
| Action authorisation | `@cedar-policy/cedar-wasm` 4.15 | Depend on | Apache-2.0 | Yes/no decisions; no resource queries in wasm | https://github.com/cedar-policy/cedar/blob/HEAD/cedar-wasm/Cargo.toml |
| Relationship sharing (v2) | OpenFGA tuple table | Copy design | Apache-2.0 | Only if sharing graphs get deep | https://github.com/openfga/openfga/blob/HEAD/assets/migrations/postgres/001_initialize_schema.sql |
| Agent identity | Agent principals, invoker or per-step service credential, dual-principal audit | Write from scratch, copying Glean design | n/a | Agent is its own principal; no run-as-creator | https://docs.glean.com/administration/agent-identity/overview |
| OAuth, token rotation, webhook routing, proxy | Nango Cloud pay-as-you-go, own OAuth apps | Depend on (buy) | ELv2 code, used as cloud service | $50/mo floor; prebuilt ledger and email functions | https://github.com/NangoHQ/nango/blob/master/docs/snippets/generated/xero/PreBuiltUseCases.mdx |
| Sync engine | TypeScript connector contract + per-stream opaque state | Write from scratch, copying Airbyte protocol and dlt grammar | n/a (Airbyte docs ELv2 read only; dlt Apache-2.0) | Multi-tenant, small, owned edge cases | https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md |
| Ledger read rules | Xero, QBO, NetSuite rules from Airbyte manifests | Copy design (read as specification) | ELv2 (do not ship code) | Cursor, filters, budgets, soft deletes, token rotation | https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml |
| Ledger API access | Xero tier, Intuit Builder→Silver, NetSuite customer licence | Depend on (pay vendors) | Commercial terms | Unavoidable; Xero no-AI-training clause | https://developer.xero.com/faq/pricing-and-policy-updates |
| Long-tail ledgers (MYOB, QB Desktop, Sage 50) | Rutter, only on demand | Depend on (buy) | Commercial | Broadest ledger list | https://www.rutter.com/accounting |
| Email | Gmail API and Microsoft Graph direct, Nango tokens; Nylas fallback | Write from scratch | Provider terms | Send from customer's mailbox; `history.list`/`watch`, delta queries | https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/google-mail/webhooks.mdx |
| Document parsing | Docling HTTP service; Reducto or LlamaParse for scans | Depend on | MIT; commercial | Remittance PDFs | https://github.com/docling-project/docling/blob/HEAD/pyproject.toml |
| Durable workflows | DBOS Transact TS (MIT core, no enterprise features) | Depend on | MIT (enterprise proprietary) | Postgres-only; memoised steps for write-back | https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts |
| Simple queues (alternative) | pg-boss 12 | Depend on (optional) | MIT | If DBOS feels heavy | https://github.com/timgit/pg-boss/blob/HEAD/src/plans.ts |
| Temporal facts | Four-timestamp fact table, index-based LLM adjudication, deterministic invalidation, future-tense normaliser | Copy design | Apache-2.0 source | "What was true when" in Postgres | https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py |
| Graph storage | Two JSONB tables + capped BFS | Copy design | MIT source | No graph database needed | https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py |
| Ingestion of mail and docs | Two-phase (index first, LLM later, cached by chunk hash) | Copy design (ELv2 source) | ELv2 source; own code | Immediate search, replayable extraction | https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md |
| Entity resolution (batch, v2) | Splink 5 against Postgres | Depend on (Python batch) | MIT | Merge customers across ledgers | https://github.com/moj-analytical-services/splink/tree/HEAD/splink/internals |
| Two-tier knowledge | Learned/modeled table, authority score, confidence-gated proposals | Write from scratch, copying Databricks and Google | n/a | Certified knowledge wins | https://docs.databricks.com/aws/en/genie/genie-ontology |
| Context assembly | Six layers, entity-first, budgeted `lookup_context` | Write from scratch, copying OpenAI, Google, ACE | n/a | Small grounded context per agent | https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context |
| Metric compilation | Own TS compiler with MetricFlow join matrix, 2-hop cap, key-grain `AGG` | Write from scratch, copying MetricFlow; sidecar as fallback | Apache-2.0 source | Data lives in own Postgres | https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py |
| Metric compilation fallback | MetricFlow sidecar (`explain` NDJSON) | Depend on (optional) | Apache-2.0 | If own compiler stalls | https://github.com/dbt-labs/metricflow/blob/HEAD/sidecar/mf_ipc_protocol.py |
| Action and condition IR, ObjectSet algebra, validate/apply | Palantir SDK shapes | Copy design | Apache-2.0 | Most authoritative public action format | https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts |
| ObjectSet → SQL compiler | Own compiler with permission predicates folded in | Write from scratch | n/a | Agent query language with no raw SQL | https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py |
| Error taxonomy and log safety | Conjure codes, safe/unsafe args, safety flags | Copy design | Apache-2.0 | Redaction by construction | https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md |
| Action gate | Parse → authorise → preconditions → effects → rolled-back preflight → authority check → pending record → write-back → commit + audit | Write from scratch, copying operational-ontology | MIT source | The only write path | https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md |
| Precondition evaluation | Own TS evaluator of condition IR | Write from scratch | n/a | Rules as JSON, never code strings | https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts |
| Decision tables (v2) | `@gorules/zen-engine` 2.1.12 | Depend on (optional) | MIT | Business-editable tables with traces | https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs |
| Monitoring playbooks | State vs transition conditions compiled into playbook | Copy design | n/a | Reminder triggers that fire once per change | https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent |
| Agent loop | Own model-agnostic loop over Anthropic and OpenAI-compatible (Qwen) SDKs | Write from scratch | Vendor SDK terms | Multi-model requirement | https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py |
| Hooks, permission results, session store | Claude Agent SDK surfaces | Copy design | Commercial Terms (do not depend) | Proven hook taxonomy | https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts |
| SOP procedures | Executor/verifier steps, `max_attempts = 3` | Copy design | Apache-2.0 source | Multi-step collections procedures | https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py |
| Agent graph (optional) | `@langchain/langgraph` + Postgres checkpointer | Depend on (optional) | MIT | Only for interrupt/checkpoint machinery | https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts |
| MCP server | `@modelcontextprotocol/server` v2 2.4.0, generated tools | Depend on + write generator | Apache-2.0 | Stateless 2026-07-28 spec | https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx |
| Answer evaluation | Golden query + golden result | Write from scratch, copying OpenAI | n/a | Compare results, not strings | https://openai.com/index/inside-our-in-house-data-agent/ |
| Action evaluation | tau2 reward (DB × COMMUNICATE), pass^k | Copy design | MIT source | Did the agent do the right thing | https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py |
| Prompt/tool regression | promptfoo | Depend on (CI only) | MIT | TypeScript, CI | https://github.com/promptfoo/promptfoo |
| Tracing | OpenTelemetry spans to own Postgres table; Phoenix optional internally | Write from scratch (Phoenix optional) | Phoenix server ELv2 | Small footprint | https://github.com/langfuse/langfuse/blob/HEAD/docker-compose.yml (to see what to avoid) |
| Ontology editor UI | Own UI with Plan/Act agent and diff preview | Write from scratch, copying Fabric | n/a | Proposal-first authoring | https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent |

---

## Function checklist

| Function | Who offers it | Version | Reason |
|---|---|---|---|
| Typed objects with keys, properties, inheritance | Fabric, Ossie, osdk-ts, operational-ontology | v1 | Core of the model |
| Relationships with cardinality and verbalization | Ossie, Fabric, Snowflake, dbt | v1 | Join safety and LLM text |
| Rule-derived links | KAG, Ossie `derived_by` | v2 | Useful (chronic late payer) but not needed to prove the job |
| Five metric types | dbt/MetricFlow | v1 (simple, ratio, derived); v2 (cumulative, conversion) | Receivables needs balances and ratios first |
| Semi-additive metrics | MetricFlow, Snowflake | v1 | AR balances are semi-additive |
| Private facts/metrics | Snowflake | v1 | Stops agents querying intermediates |
| Level-of-detail and window metrics | Snowflake (preview) | Never for v1/v2 | Preview, no receivables need |
| Synonyms, instructions, examples (`ai_context`) | Ossie, Databricks, Snowflake | v1 | Grounding |
| Verified queries with onboarding flag | Snowflake, Genie trusted assets, Google query templates | v1 | Onboarding and evaluation |
| Entity value matching | Genie | v2 | Helps fuzzy customer names; Genie disables it on row-filtered tables |
| Ossie export | Ossie, dbt v1.12 | v1 | Cheap portability |
| Ossie/RDF import | Ossie converters, Fabric | v2 | Not needed for SaaS-only customers |
| Schema branches and proposals | OntoForge | v1 | Safe model change |
| Proposal-first authoring agent (Plan/Act, diff) | Fabric ontology agent | v1 | Self-serve onboarding |
| Generate model from BI artefacts | Fabric, Snowflake Autopilot, Databricks | Never | Inputs absent at these customers |
| Prebuilt domain objects | Workday | v1 | Receivables template |
| Learned vs modeled knowledge with authority | Databricks Genie Ontology | v1 | Certified wins |
| Popularity-based authority (OntoRank) | Databricks | Never | No usage volume |
| Trace-driven self-improvement with confidence gate | Google Knowledge Catalog | v1 (learned tier only) | Replaces query history |
| User-confirmed memory, global/personal | OpenAI in-house agent, Salesforce ACE | v1 | Collector corrections |
| Pages (governed term definitions) | Databricks | v1 | SOP definitions |
| Six-layer context | OpenAI | v1 | Context design |
| Budgeted single context call | Google LookupContext | v1 | Small prompts |
| Entity-first scoped payload | Salesforce ACE | v1 | External agent safety |
| Forced RLS tenant isolation | Przyval/openfoundry | v1 | Security floor |
| Markings | Przyval, Palantir | v1 | Internal-only notes |
| Row/member/masking policies | Cube | v1 | Collector portfolios |
| Relationship-based security | Workday, OpenFGA | v1 (simple), v2 (tuples) | Portfolio scoping |
| Cedar action decisions | Cedar | v1 | Action authorisation |
| OPA policy → SQL | OPA | Never (for a solo build) | Second language and service |
| Agent as own principal | Fabric, Glean, Frontier | v1 | Audit and least privilege |
| Per-step service credential | Glean (beta) | v1 | Ledger write-back |
| Tool Packs | Merge Agent Handler | v1 | Internal vs external agents |
| DLP masking of tool outputs | Merge Agent Handler | v2 | Safety flags cover v1 |
| Action types with submission criteria | Palantir, CapTrix, OntoForge | v1 | Core gap in all incumbents |
| Validate-only mode and confirm-preview | Palantir, OntoForge | v1 | Human approval |
| Write-back before local commit | operational-ontology | v1 | Ledger stays source of truth |
| Idempotency and pending invocations | DBOS (recommended addition) | v1 | Crash safety |
| Batch apply | Palantir `applyBatch` | v2 | Bulk reminders later |
| Typed monitoring conditions and playbook | Fabric operations agent | v1 | Reminder triggers |
| Decision tables with traces | GoRules Zen | v2 | Dunning ladder editing |
| Deterministic/LLM mixed scripts | Salesforce Agent Script | v1 (as SOP steps) | Predictable procedures |
| Temporal facts with invalidation | Graphiti | v1 | Contacts, promises to pay |
| Community reports | GraphRAG | v2 | Global questions, batch |
| Personalized PageRank retrieval | HippoRAG | Never | Research-grade |
| Graph in plain Postgres | LightRAG | v1 | No graph DB |
| Durable workflows | DBOS, Temporal, pg-boss | v1 (DBOS) | Write-back, syncs |
| Connector contract and opaque state | Airbyte | v1 | Resumable syncs |
| Schema-change policy per connection | Airbyte | v1 | Ledger custom fields change |
| Managed OAuth and webhook routing | Nango, Paragon, Airbyte | v1 (Nango) | Buy, not build |
| Unified accounting API | Merge, Codat, Rutter, Apideck, Unified.to | v2 (Rutter on demand) | Cost below three ledgers |
| Agent tool platforms | Composio, Arcade, Zapier MCP, Merge Agent Handler | Never as system of record | No stored history |
| Three access paths with freshness | Airbyte context layer | v1 | Honest freshness |
| Connector skill documents | Airbyte MCP | v1 | Agent reads before calling |
| Email read/send from customer mailbox | Nango, Nylas, Gmail/Graph | v1 (direct) | Deliverability |
| Remittance document extraction | Docling, Reducto, LlamaParse, Mindee | v1 | Payment matching |
| Agent prepares, human submits | Airbyte | v1 | Money-moving safety |
| MCP server, stateless 2026-07-28 | MCP TS SDK v2 | v1 | Agent surface |
| Async ask/poll MCP tools | Genie One MCP | v2 | Long reports later |
| Golden-result evaluation, canaries | OpenAI | v1 | Answer quality |
| End-state action evaluation, pass^k | tau2-bench | v1 | Action quality |
| Topic/action/outcome tests | Salesforce Testing Center | v2 | Once multiple agents route |
| Trace UI | Langfuse, Phoenix | v2 (Phoenix internal at most) | Footprint |
| Billing only changed rows | Fivetran | v2 | If volume pricing is ever used |
| Decision traces as queryable records | Foundation Capital thesis, ACE (preview) | v1 (via audit + facts) | Thesis says whoever is in the execution path captures it [Inference] |

---

## Contradictions and corrections

1. **Does Ossie carry rules?** Document 11 rates Ossie "Y" for rules (machine-readable `requires` and `derived_by`) and calls it the one exception to text-only rules. Document 14 says Ossie has "no actions, rules or permissions". Correction: Ossie's ontology spec has constraint and derivation expressions but no rule record, enforcement flag or evaluator; treat `requires` as an export target for enforced rules, not as a rules engine.
2. **Canonical Ossie repository.** Document 11 cites `github.com/apache/ossie`; document 14 read `open-semantic-interchange/OSI` whose README points to `apache/ossie-converters`. The engineer should confirm which repository holds the spec before pinning a commit (see Gaps).
3. **Ossie version for the ontology split.** Both documents say pin 0.1.1, but the ontology and mapping documents they describe appear in the 0.3.0.dev0 line (document 11 says the format "now has an ontology layer" and 0.3.0.dev0 is mutable). [Inference] The three-document split the founder wants may rest on an unreleased spec; the internal Postgres model must not depend on it.
4. **Xero daily limit.** Document 24's key finding gives 1,000 calls a day per organisation on Starter; Airbyte's Xero docs give 5,000 a day per tenant. Document 24's table reconciles them as tier-dependent (1,000 on Starter or 5,000). Rate budgets must read the tier.
5. **Nango self-hosting.** Document 14 says self-hosting Nango behind a SaaS is arguably permitted under ELv2 but needs a lawyer; document 24 found self-hosting is now Enterprise-only. The question is moot for version 1: use Nango Cloud.
6. **Airbyte licence reading.** Document 14 says "ignore the Airbyte platform" because of ELv2; document 24 quotes Airbyte's FAQ that bringing data in for your own customers inside your product is allowed. Both stand: it is permitted, but still a poor fit (Kubernetes, per-customer sources, no tenant isolation).
7. **Founder's "copy something documented" rule versus self-learning.** Google's and OpenAI's learning loops are documented, but Xero's terms forbid using API data to train or contribute to any AI or ML model [Fact]. Whether trace-driven proposals, memory and evaluation sets built from Xero data "contribute to" a model is unresolved [Inference]. Until reviewed, keep Xero-derived content out of anything resembling training or fine-tuning, and prefer synthetic evaluation seeds.
8. **"Models rented through APIs (Claude, Qwen)" versus the Claude Agent SDK.** The SDK is the most convenient Claude runtime but its licence is Anthropic's Commercial Terms and it is Claude-only [Fact]; it cannot be the core loop. The documents also mention GPT throughout; the founder's list is Claude and Qwen.
9. **Incumbent cold start versus the target customer.** Every documented cold-start method assumes a warehouse, BI model or query history (document 11). The founder's customers have SaaS apps only, so no incumbent method can be copied directly; the SaaS-only design in section 9 is assembled from documented parts but is itself [Inference].
10. **Authority scoring at small scale.** Document 11 recommends copying the two-tier design with an authority score, and in the same document warns that OntoRank-style popularity signals mean little at this size. Resolution: keep the score but drop popularity terms; rely on explicit owners and certification.
11. **Cedar for "permissions" generally.** Document 14 recommends Cedar, but `cedar-wasm` lacks the resource-query (`tpe`) APIs [Fact], so Cedar cannot filter object lists. List filtering must be the hand-written SQL compiler; Cedar is only for yes/no action decisions.
12. **MetricFlow sidecar versus "one repository, TypeScript".** The sidecar is a Nuitka-compiled Python binary [Fact]. It fits only as an external binary; with data in the product's own Postgres, document 14's own criterion points to copying the design instead.
13. **LightRAG canonical edge order.** LightRAG stores each edge once in canonical order, which treats edges as undirected [Fact]. Business links (Customer → Invoice) are directed; copying the canonical-order rule verbatim would lose direction [Inference].
14. **Fabric operations agent permissions.** Fabric's design executes approved actions with the creator's rights [Fact]; both documents 11 and 14 treat that as a pattern to avoid. The product's approval rule (section 4) explicitly contradicts Fabric.
15. **Malaysian ledgers.** Document 24 notes SQL Account and AutoCount appear in no integration catalogue [Fact]. If early customers are Malaysian (the documents frame Malaysia as relevant), the recommended Nango stack does not cover their ledgers at all.
16. **QuickBooks pricing source.** The Intuit metering figures come from Apideck, a competitor's blog, not Intuit [Fact as reported]; treat as provisional.

---

## Gaps

| Item | Status in documents | Importance |
|---|---|---|
| Postgres RLS semantics (`current_setting(…, true)` NULL, `SET LOCAL` scope, `FORCE` and table owners) | [Unverified this session], document 14 | High |
| Xero webhook coverage of payments and credit notes; how voids/deletes appear | [Unverified]/[Inference], document 24 | High |
| QuickBooks hard-delete detection (Intuit CDC endpoint limits) | [Unverified], document 24 | High |
| NetSuite deleted-record detection, webhooks (SuiteScript), SuiteQL incremental | [Unverified], document 24 | High |
| Xero no-AI-training clause scope (memory, traces, evals, prompt caching) | [Inference], document 24 | High |
| Ossie: canonical repository and which release contains ontology and mapping specs | Conflicting URLs; version unclear, documents 11 and 14 | High |
| Google restricted Gmail scope verification and annual assessment cost/timeline | [Unverified], document 24 | High |
| SQL Account and AutoCount API availability | [Unverified], document 24 | High (if Malaysian customers) |
| Microsoft Graph mail throttling | [Unverified], document 24 | Medium |
| Intuit partner tiers from primary source | Secondary source only, document 24 | Medium |
| Cedar `tpe` / resource queries in wasm | [Fact for now], document 14 | Medium |
| MetricFlow relicensing history | [Unverified], document 14 | Low |
| ELv2 reading for internal Phoenix use | [Inference], document 14 | Low |
| Qwen via DashScope Anthropic-compatible endpoint | [Unverified], document 14 | Medium |
| Docling-serve HTTP contract and container size | [Unverified], document 14 | Medium |
| MCP 2026-07-28 as current spec on modelcontextprotocol.io | [Fact for SDK README only], document 14 | Medium |
| Fabric ontology MCP parameter schemas | Not published, document 11 | Low |
| OntoRank formula | Not published, document 11 | Low |
| Google "Open Knowledge Format" spec | Not found, document 11 | Low |
| Glean graph internals, Neo4j Aura Agent, Stardog, TigerGraph, RelationalAI, Timbr, Cognite, C3, Aera, Hebbia, Kyligence, Malloy MCP, LookML access pages | [Unverified], document 11 | Low |
| n8n Sustainable Use Licence exact terms | [Unverified], document 24 | Low (not used) |
| Airbyte Embedded status; Codat and Rutter prices; Merge per-ledger GA status | [Unverified], document 24 | Low |
| Quality of Graphiti invalidation, mem0 extraction, LightRAG modes | Not benchmarked, document 14 | Medium |
| Stars, contributors, release cadence of all repositories | Not fetched, document 14 | Low |

Research briefs for high items:

- **Postgres RLS semantics.** Read the PostgreSQL 17 documentation pages for `CREATE POLICY`, `ALTER TABLE … FORCE ROW LEVEL SECURITY`, "Row Security Policies" (section 5.9 in recent manuals), `current_setting` (System Administration Functions, configuration settings functions) and `SET LOCAL`. Confirm that `current_setting('app.org_id', true)` returns NULL when unset so the policy matches nothing, that `SET LOCAL` resets at transaction end under a pooled connection (and how PgBouncer transaction pooling behaves), and that table owners and `BYPASSRLS` roles skip policies unless `FORCE` is set. Also read Przyval's `009_multi_tenancy.sql` and `pg-store.ts` side by side with those pages.
- **Xero change detection.** Read Xero's developer docs for webhooks (event categories and which entities emit events), the Invoices, Payments, CreditNotes and Overpayments endpoints (status values such as VOIDED and DELETED, `If-Modified-Since`, `where` filters, `page` parameter), and the rate-limit page. Cross-check against Nango's `docs/api-integrations/xero/webhooks.mdx` and Airbyte's `source-xero/manifest.yaml`. Decide whether payments and credit notes require polling and how deleted payments appear.
- **QuickBooks hard deletes.** Read Intuit's QuickBooks Online Accounting API pages for Change Data Capture (`/cdc` endpoint: entity list, look-back window, record caps, how deleted entities are flagged), webhooks (event types, signature verification, payload), and the App Partner Program metering page (which calls are CorePlus). Compare with Airbyte's `source-quickbooks/manifest.yaml` `Active IN (true,false)` approach.
- **NetSuite change detection.** Read Oracle NetSuite Help Center pages on REST Web Services (record API, `lastModifiedDate` queries), SuiteQL via REST (`/query/v1/suiteql`, paging limits), deleted-record search (`DeletedRecord` saved search or SuiteQL table), OAuth 2.0 for integrations (authorization code and client credentials setup, token lifetimes), concurrency governance, and SuiteScript user-event scripts for outbound notifications. Also the 2027.1 TBA notice.
- **Xero no-AI-training clause.** Read the full Xero Developer Platform Terms and the FAQ at https://developer.xero.com/faq/pricing-and-policy-updates, focusing on the definitions of "AI or machine-learning model", "train" and "contribute". Map each product data flow (prompts to rented models, prompt caching at Anthropic and Alibaba, stored memories, trace-driven proposals, evaluation datasets) against the wording, and check the model vendors' API data-use terms for training opt-outs. Get legal review.
- **Ossie repository and release contents.** Open the GitHub repositories `apache/ossie`, `open-semantic-interchange/OSI` and `apache/ossie-converters`: compare the README, `core-spec/spec.md` version history, `ontology/ontology.md` header, the mapping spec and the tag list. Establish whether the ontology and mapping specs exist in tag 0.1.1 or only on `main` as 0.3.0.dev0, and pin a commit hash for the exporter.
- **Gmail restricted scopes.** Read Google's "OAuth API verification FAQs", "Restricted scope verification" and the CASA (Cloud Application Security Assessment) tier pages: which Gmail scopes (`gmail.readonly`, `gmail.modify`, `gmail.send`) are restricted or sensitive, the assessment cost range, renewal frequency and typical timeline. Compare with Nylas's shared-app add-on ($2,400 a year) as a time-to-market alternative.
- **SQL Account and AutoCount.** Read each vendor's developer or integration pages (SQL Account "SDK"/"API" documentation, AutoCount Accounting API or plugin documentation), local partner forums, and any marketplace listings, to establish whether a cloud API, an on-premises SDK (COM/.NET), database access or only file export exists. Scope a desktop agent or file-import path from the findings.
