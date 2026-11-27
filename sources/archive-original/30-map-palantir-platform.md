# Reference map 1: what to copy from Palantir's platform

**Scope note (21 November 2026).** This map turns five research documents on Palantir into build decisions for the product: a company model (objects, links, metric definitions, rules, permissions, actions) that AI agents work through. The first use case is receivables and collections for companies of 100 to 1,000 staff. The stack is TypeScript, PostgreSQL with row-level security, one repository, and models rented through APIs (Claude, Qwen). Documents read in full:

- **01** `01-palantir-data-layer.md`: Foundry data layer (connections, datasets, transactions, CDC, builds, incremental processing, Funnel indexing, branching, packaging, metering).
- **02** `02-palantir-ontology.md`: the Ontology (types, links, interfaces, object sets, actions, edits, functions, permissions, OSDK, Ontology MCP).
- **03** `03-palantir-aip.md`: AIP (model gateway, rate limits, Logic, Chatbot Studio, Agent SDK, MCP servers, Evals, Automate, observability).
- **04** `04-palantir-security.md`: security and governance (identity, Markings, policies, scoped sessions, Checkpoints, Approvals, audit, tokens, LLM controls).
- **05** `05-palantir-apps-infra.md`: apps and infrastructure (Workshop, Foundry Rules, Automate, Marketplace/DevOps, Developer Console, Apollo, tenancy).

**Labels.** In the design sections, a bullet that restates documented Palantir behaviour carries the document number and the document's own label, for example "[Fact 02]" or "[Vendor claim 03]". A bullet that is my design choice for this product, going beyond the documents, is marked **[Inference]**. "[Unverified]" means the source document said it could not confirm the item. All Palantir doc pages were undated and read by the researchers on 21 Nov 2026. No new facts are added here.

**Receivables vocabulary used in examples** [Inference]: `Customer`, `Invoice`, `Payment`, `PaymentPromise`, `Dispute`, `DunningStep`, `CollectorAssignment`, `Alert`.

---

## Design decisions

Components are in build order. Read checks come before the query model because every query runs through them.

### 1. Tenancy and identity

**Purpose.** Each customer company is a walled tenant. Staff sign in through their own identity provider, and their groups and attributes drive every later check. *Receivables example:* at a customer called Acme, collectors in group `AR-Collectors-MY`, with attribute `region=MY`, sign in through Acme's Entra ID and can only ever reach Acme's data.

**Design to implement.**
- **Three levels, collapsed.** Palantir has enrollment (one platform instance), organization (a mandatory silo; each user has one home organization plus optional guest memberships) and space (a container of projects with exactly one ontology) [Fact 05, 04]. Palantir's B2B "option A" gives each customer a private organization, space and ontology [Fact 05]. **Implement option A only:** one `tenant` = one organization = one space = one company model [Inference, following 05's "What to copy" 11].
- **Tables** [Inference on shape; fields copied as cited]:
  - `tenant(id, slug, name, status, data_region, created_at)`.
  - `identity_provider(id, tenant_id, protocol saml|oidc, issuer, email_domain_regex, cert_expires_at, claim_map jsonb, group_claim, group_split_regex)`. The login page picks a provider by email-domain regex, and an unmatched domain gives a "no suitable authentication provider" error [Fact 04]. Warn admins when a SAML certificate expires within 30 days [Fact 04].
  - `principal(id uuid, tenant_id, kind human|service|agent, external_subject, username, email, display_name, attributes jsonb, status active|inactive, last_login_at)`. `external_subject` is the stable IdP ID (SAML NameID or OIDC `sub`). Palantir says it must be non-empty, consistently cased and stable for the account's lifetime, and advises against using email or username [Fact 04].
  - `group(id, tenant_id, kind external|internal|rule, name)` and `group_member(group_id, principal_id, added_at, latest_expiration, max_duration)`.
  - `project(id, tenant_id, name, default_role)` and `role_grant(project_id, group_id, role)`.
- **Login flow.** Map username, email and names explicitly. Map extra attributes in "First" or "All" mode. On each login, sync every value of the group claim into external groups, optionally splitting values with a regex [Fact 04]. External groups are read-only and should be nested inside internal groups instead of granting to users directly [Fact 04]. If the IdP cannot send groups at login, use SCIM [Fact 04]. **If no tenant matches, block the login** (Palantir: a user with "No organization" cannot log in) [Fact 04].
- **Roles.** Four default roles: Owner, Editor, Viewer, Discoverer. Grants live at project level only, and folder or file grants are off [Fact 04]. Roles are bundles of named operations, not a strict hierarchy [Fact 04]. Discoverer can see that something exists but cannot download [Fact 04]. New projects default to Viewer [Fact 04]. An access request carries a reason, the target principals and the access type, and a Project Owner approves it [Fact 04].
- **Inactivity.** After 30 days with no successful login an account becomes inactive and all its tokens stop working until the next login. Schedules it owns keep running [Fact 04]. Because of that last point, automations must be owned by service principals (section 11) [Inference].
- **Service principals.** A client-credentials registration creates a service user whose username equals the client ID and which has no access by default [Fact 04].
- **MFA** is delegated to the IdP. Palantir ranks hardware tokens highest and calls SMS, email OTP and security questions weak [Fact 04].
- **Postgres enforcement** [Inference]: every tenant-scoped table carries `tenant_id`. Each request sets `app.tenant_id` and `app.principal_id` with `SET LOCAL`, and an RLS policy on every table enforces `tenant_id = current_setting('app.tenant_id')::uuid`. The tenant wall is therefore structural, as option A intends.
- **Failure behaviour.** No tenant match: login denied. Inactive principal: every token rejected with a typed error. Group claim missing: keep the last-known memberships and flag the account for admin review [Inference].

**Copies.**
- Document 05, B4 "Enrollment and tenancy": enrollment, organization and space levels, and B2B option A. https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/ , https://www.palantir.com/docs/foundry/security/orgs-and-spaces
- Document 04, §1 "Authentication and identity": SAML/OIDC mapping, stable user ID, group sync, regex split, SCIM, certificate warning. https://www.palantir.com/docs/foundry/authentication/saml-getting-started
- Document 04, §1: organization assignment at login, with no organization meaning no login. https://www.palantir.com/docs/foundry/authentication/org-assignment
- Document 04, §3 "Projects, roles and discretionary permissions": four roles, project-level grants, Discoverer, default role, access requests. https://www.palantir.com/docs/foundry/security/projects-and-roles/
- Document 04, §1: 30-day inactivity rule. https://www.palantir.com/docs/foundry/platform-security-management/manage-users/
- Document 04, §19: a client-credentials service user has no access by default. https://www.palantir.com/docs/foundry/platform-security-third-party/register-3pa/

**Left out, and why.**
- Several organizations per tenant, guest memberships and organization discoverability: there is only one company per tenant in version 1, and the guest mechanics are [Unverified] in 04.
- CBAC: built for government (04, "What cannot be copied").
- B2C pattern (one organization, restricted views keyed on user ID) [Fact 05]: deferred to version 2, for a customer self-service portal.
- Custom role sets: version 2 (04, "Optional at small scale").
- Group membership expiry with a 7-day reminder [Fact 04]: version 2.

**Open questions.**
- Do mid-sized customers with several legal entities need hard walls between subsidiaries? If so, organizations with ANY semantics come back.
- Palantir gives no figure for session lifetime ("relatively short") [Unverified 04].

---

### 2. Raw and clean data layers, sync, the "current state" rule, incremental processing and rebuild

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

### 3. Registry of object types, properties, links and interfaces

**Purpose.** A typed, versioned definition of the company's business nouns that every app, rule and agent binds to by API name. *Receivables example:* `Customer` (primary key `customerId`) is linked to many `Invoice`s, and both `Invoice` and `CreditNote` implement an interface `Receivable` with `amountOutstanding` and `dueDate`.

**Design to implement.**
- **Definitions are data, held as a versioned intermediate representation (IR).** Store definitions as JSON modelled on Palantir's ontology-as-code types (`defineObject`, `defineLink`, `defineInterface`, `defineValueType`, `defineAction`), which produce an "Ontology IR" [Fact 02]. Table: `model_version(id, tenant_id, branch, parent_version, created_by, created_at, ir jsonb)`. Every change produces a new version through one `modifyModel` call, mirroring Palantir's `modifyOntology` [Fact 02 for the endpoint; the versioning detail is 02's Inference]. Put the IR schema in the repository as TypeScript types so that customer templates are code too [Inference; compare SuperRepo, Fact 01].
- **Object type fields** [Fact 02]: `id`, `rid`, `apiName` (PascalCase, alphanumeric, unique, 1–100 characters), `displayName`, `pluralDisplayName`, `description`, `aliases`, `icon`, `groups`, `visibility` (prominent|normal|hidden), `status`, `primaryKey`, `titleKey`, `datasources`, `implementsInterfaces`, `editsEnabled`, `editsHistoryConfig`. Reserved API names include `ontology`, `object`, `property`, `link`, `relation`, `rid`, `primaryKey`, `typeId` [Fact 02]. **Add `agentDescription`**, text written for agents, by extension of Palantir's per-action "agent tool description" [Inference based on Fact 03].
- **Primary keys.** Must be deterministic and derived from columns, never row numbers or random values, because edits and links attach to the key [Fact 02]. Valid key types are String, Integer and Short. Long is discouraged because JavaScript loses precision above about 1e15 [Fact 02], which matters for a TypeScript stack. Duplicates fail the build [Fact 02].
- **Status lifecycle** [Fact 02]: `experimental` (default) → `active` (cannot be deleted, API name frozen) → `deprecated` (reason, deletion deadline, optional replacement). `example` also exists. "Promoted" is applied only by owners or through a proposal and forces prominent visibility. Status propagates: an experimental object type forces its link types to be experimental. **Agents see only active and promoted types by default** [Inference, from 02 "What to copy" 3].
- **Property base types for version 1:** String, Integer, Long, Double, Decimal, Boolean, Date, Timestamp, Array (no nulls, no nested arrays), Struct (one level, named typed fields, no array fields), Vector, Attachment, and Marking/mandatory-control [Fact 02 for the type list and rules]. Palantir's ontology-as-code Decimal defaults to precision 5, scale 2 [Fact 02], and the dataset schema's suggested Decimal default is 38,18 [Fact 01]. **Money is Decimal(38,18) plus a currency String, never Double** [Inference].
- **Struct conditions on array-of-struct are evaluated per field independently** [Fact 02]. Document this for agents, because a filter on two fields can match two different elements [Inference].
- **Value types** wrap a base type with constraints: enum (case-sensitive or not), range, regex, UUID, RID, array uniqueness, nested (per element), and struct element [Fact 02]. They are enforced on sync and on every action [02 "What to copy" 5]. *Example:* `InvoiceStatus` enum; `CurrencyCode` regex `^[A-Z]{3}$` (the regex example comes from 05's Workshop form validation [Fact]).
- **Derived properties** follow up to three link hops, then aggregate with count, average, sum, min, max, cardinality, collect list or collect set (collect defaults to 10 values, max 100). They cannot derive from another derived property [Fact 02]. Palantir's guidance is to use them freely below roughly 10,000 objects per query [Fact 02]. *Example:* `Customer.totalOverdue` = sum of `Invoice.amountOutstanding` where overdue.
- **Edit-only properties** have no source column and take values only from edits [Fact 02]. They are central for collections: `Invoice.collectionStage`, `Invoice.nextActionDate` [Inference].
- **Struct for LLM outputs.** Group an AI output with its confidence and reasoning in one struct [Fact 02 structural guidance]. *Example:* `Dispute.aiClassification {category, confidence, reasoning}`.
- **Links** have three implementations [Fact 02]:
  - foreign key (1:N; 1:1 is "not enforced");
  - join table (N:M; required for editing many-to-many links);
  - object-backed (a third object type carries relationship data).
  
  One definition has two named sides. Link API names start lowercase, are 1–100 characters and NFKC-normalised [Fact 02]. Foreign-key links are edited by modifying the key property, and N:M links through link rules [Fact 02]. Do not create links that exist only because two datasets share a key [Fact 02]. *Example:* `CollectorAssignment` is object-backed, because it carries start and end dates and a role.
- **Interfaces.** Interface properties (defined locally, which Palantir recommends), link constraints (`ONE`/`MANY`, required flag), action-type constraints (beta) that every implementer maps to a concrete action, and extension of other interfaces. Interfaces are abstract and have no instances [Fact 02]. Save-time validation blocks unmapped required constraints, incompatible types, or one parameter mapped twice [Fact 02].
- **Storage** [Inference]: Postgres with JSONB plus indexes, as 02 suggests for small scale. One `object` table per tenant model, partitioned by object type, with `(tenant_id, object_type, pk)` as the key, a `properties jsonb` column and generated columns for indexed properties. A pgvector column holds vector properties.
- **Modelling lint**, run when a definition is saved [Fact 02 for the rules]: warn when an object type has more than 10 action types (Palantir's "action sprawl" sign), when properties are mostly null (the "kitchen sink"), when names are vague (the "misnomer"), and on "time machine" versions modelled as objects.
- **Limits.** Palantir allows a maximum of 2,000 properties per type [Fact 02]. Choose 200 [Inference].

**Copies.**
- Document 02, §2 "Object types": primary key rules, naming, metadata fields, statuses. https://www.palantir.com/docs/foundry/object-link-types/create-object-type/ , https://www.palantir.com/docs/foundry/object-link-types/object-type-metadata/ , https://www.palantir.com/docs/foundry/object-link-types/metadata-statuses/
- Document 02, §3 "Properties": base types, structs, value types, derived and edit-only properties. https://www.palantir.com/docs/foundry/object-link-types/properties-overview/ , https://www.palantir.com/docs/foundry/object-link-types/value-type-constraints/ , https://www.palantir.com/docs/foundry/object-link-types/derived-properties/ , https://www.palantir.com/docs/foundry/object-link-types/edit-only-properties/
- Document 02, §4 "Link types": three implementations. https://www.palantir.com/docs/foundry/object-link-types/create-link-type/
- Document 02, §5 "Interfaces". https://www.palantir.com/docs/foundry/interfaces/interface-overview/ , https://www.palantir.com/docs/foundry/interfaces/interface-action-type-constraints/
- Document 02, §15 "Developer surface": the ontology-as-code IR in `osdk-ts/packages/maker/src/api/` (github.com/palantir/osdk-ts, commit 09b6f4f).
- Document 02, §18 "Modelling in practice": anti-patterns and structural guidance. https://www.palantir.com/docs/foundry/ontology/ontology-anti-patterns , https://palantir.com/docs/foundry/ontology/ontology-structural-guidance/

**Left out, and why.**
- Geopoint, geoshape, time series, geotemporal series, cipher and media references: no receivables need in version 1.
- Multi-datasource objects (up to 70 datasources joined on the key [Fact 02]): Palantir uses them for column-level permissions, but property policies (section 5) cover that.
- Property reducers (beta): version 2.
- Shared properties: version 2.

**Open questions.**
- Should metric definitions (DSO, collection effectiveness index) be a first-class registry entity or a kind of function? The documents have no Palantir "metric" primitive, so this is a gap.
- Should interfaces be in version 1 at all? They help with templates across ERPs, but Palantir's own support for them is partial in several tools [Fact 02].

---

### 4. The edits layer and merge precedence

**Purpose.** Staff and agents record decisions on top of data the product does not own, and the next sync must not silently undo them. *Receivables example:* the ERP still says INV-1001 is `open`, but a collector records `Dispute raised` and sets `collectionStage=on_hold`. Tomorrow's ERP sync must not reset the stage.

**Design to implement.**
- **Overlay table** [Inference on shape]: `object_edit(id, tenant_id, object_type, pk, property, value jsonb, edit_kind set|create|delete, edited_at timestamptz, action_log_id, seq bigserial)`. An action writes to the index immediately and edits are queued with offset tracking, so read-after-write holds once the change is sent [Fact 02].
- **Merge runs** when a new source transaction lands, or every 6 hours if there are edits [Fact 02].
- **Precedence strategy, set per datasource and recorded in the IR** [Fact 02]:
  1. **"Edits win" (default).** An edited property keeps the edit permanently, and unedited properties follow the source. If a source row disappears, the object leaves the model unless a user created it. If the row comes back, the earlier edits reapply. A user-created object takes properties only from its create edit.
  2. **"Most recent wins" (opt-in).** The source needs a UTC timestamp column. For each property, an edit applies only if it is later than the source timestamp. Edit-only properties always apply. A null source timestamp means the edit applies. Changing the timestamp itself through an edit does not count.
- **Deletes** are not edits. A deleted object stays hidden whatever the source says. A recreated object with the same key does not inherit old edits, and modifying a deleted object fails [Fact 02].
- **Drop all edits** resets a type to the source [Fact 02].
- **Receivables rule** [Inference]: properties owned by the ERP (amount, currency, issue date, due date, ERP status) are **not editable** in the IR. Collection-side facts (stage, promise, dispute flag, next action date) are edit-only properties. This avoids the trap where an "edits win" correction to an amount hides later ERP credit notes forever.
- **Edit history**, separate from the action log, records every direct edit per object, but not pipeline changes. It is enabled per object type. Switching it off deletes the history permanently. Anyone who can see the object can see its full history, including from a previous incarnation with the same key [Fact 02].
- **Current-state output (materialization).** A current-state table (source plus edits) whose schema is the property API names. Palantir propagates edits to it within minutes in automatic mode and keeps only the latest snapshot [Fact 02]. Implement it as a Postgres view over source and overlay, materialised for heavy reads [Inference].
- **Schema migrations for edited types.** Breaking changes are a change to the input datasource, the primary key, a property's data type, or deleting an edited property. Saving is blocked until each one has a migration: drop, move, cast (from a fixed cast matrix), backfill (user-created objects only, never overwriting), or revert. There is a cap of 500 migrations at once and none on the primary key [Fact 02].

**Copies.**
- Document 02, §12 "How user edits merge with datasource data": both strategies, deletes, drop all edits, materializations. https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/ , https://www.palantir.com/docs/foundry/object-edits/materializations/
- Document 02, §10: edit history. https://www.palantir.com/docs/foundry/object-edits/user-edit-history/
- Document 02, §13: schema migrations. https://www.palantir.com/docs/foundry/object-edits/schema-migrations/
- Document 01, §20: the merge stage in Funnel and the 6-hour persistence run. https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/

**Left out, and why.**
- Writeback datasets: needed only on Palantir's deprecated OSv1 [Fact 02].
- Streaming object types, which accept no user edits [Fact 01]: no streaming in version 1.
- Direct datasources (beta): not needed.

**Open questions.**
- How long do action logs and edit history live? Not found in 02 [Unverified].
- Should edits be written back to the ERP? Palantir does external writeback through webhooks in actions (section 8), not through the dataset [Fact 02]. Version 1 assumes collection facts stay in the product.

---

### 5. Read checks: mandatory labels, roles, row and column policies

**Purpose.** Every read answers three questions: may you be near this kind of data at all, does your role allow this operation, and which rows and fields may you see? *Receivables example:* a collector sees Malaysian customers only (row). The bank-account field on `Customer` is null for anyone outside Finance-Admins (column). Accounts under legal action carry a `Legal-Hold` marking that only the legal team holds (mandatory).

**Design to implement.**
- **Decision formula:** `can_read = mandatory_ok AND has_role(op) AND policy_filter(rows, fields)`. Roles only add permissions and never override a marking [Fact 04].
- **Markings** [Fact 04]:
  - Conjunctive: a user must hold every marking on a resource.
  - Markings are stored as sets on every resource and on every derived artifact: `output.markings = union(input.markings) − explicitly_stopped` [04 "What to copy" 2].
  - Organizations, if they come back, use ANY semantics [Fact 04].
- **Three-tier visibility** [Fact 04]:
  - Without the mandatory markings, the resource is invisible and excluded from search.
  - With the resource's own markings but not an inherited data marking, the user sees metadata and gets an explanatory error on reading data.
  - Otherwise, full access.
- **Per-marking permissions** are separate: manage, apply, remove, member. "Remove" is not implied by Owner [Fact 04]. Removing an inherited marking is a reviewed request that names the marking, the input and the scope. This replaces Palantir's `stop_propagating` pull request, as 04 suggests [Inference 04].
- **Row-level markings.** A "mandatory control" property holds an array of marking IDs. It must be non-null, and an empty array means no restriction. Allowed values are declared per datasource, and a violation fails indexing or rejects the action [Fact 02, 04].
- **Object policy and property policies.**
  - One object policy per type gives row-level security; property policies give column-level; together they give cell-level [Fact 02, 04].
  - Failing the object policy hides the object. Failing a property policy shows the property as null [Fact 04].
  - The primary key cannot be in a property policy, each property is in at most one, and a property policy needs an object policy to exist [Fact 04].
- **Policy AST** [Fact 04]:
  - Nodes: All, Any, Not.
  - Comparisons: eq, lt, lte, gte, gt, intersects, subsetOf, supersetOf.
  - Operands: field, `user.id`, `user.username`, `user.groupIds` (direct and inherited), `user.markingIds`, `user.attr[k]`, constant.
  - Reference users and groups by ID, never by name [Fact 04].
- **Weight budget** (bounds query cost) [Fact 04]: 0 for user-only, 1 for field vs single value, 1,000 for field vs collection, 3,000 for a marking condition on a field, 0 for a marking condition without a field. The cap is 10,000, counted as the object policy plus one property policy. Weight-0 nodes are resolved once per request, before any row is read.
- **Validation rules** when a policy is saved:
  - Reject `NOT` over group, marking or organization membership, because scoped tokens may lack the attribute and the `NOT` then over-grants [Fact 04, 02].
  - A row with null in a policy column is invisible to everyone, so treat it as deny and fail the build when nulls appear [Fact 04].
  - Use a dedicated policy column with build-failing invariant checks, so upstream schema changes cannot silently break the policy [Fact 04].
- **Schema permission is separate from data permission.** Seeing that the `Customer` type exists comes from a project role. Seeing customers comes from the object policy [Fact 02, 04]. Agents get schema broadly, so they can plan, and data narrowly [04 "What to copy" 8].
- **Postgres implementation** [Inference]:
  - The object policy compiles to an RLS predicate over `current_setting('app.principal_id')`, `app.group_ids` and `app.marking_ids`, all set per request.
  - Mandatory markings become a second RLS predicate: `object.markings <@ current_setting('app.marking_ids')::uuid[]`.
  - Property policies are enforced by a per-type security-barrier view that returns `CASE WHEN <policy> THEN value END` for each covered property, because RLS filters rows, not cells.
  - Agents and apps query only the views, never the base tables.
- **Testing and explanation.**
  - "Test as user X" simulates a principal and hypothetical values, including unsaved policies [Fact 04].
  - A check-access API returns which marking, role and policy conditions pass or fail for a (principal, resource) pair, and lists missing dependent resources [Fact 04]. Agents use the same output to explain a refusal [04 "What to copy" 23].
- **Scope boundary, stated plainly to customers.** These controls apply at read time only. They do not follow data into exports, function return values, action edits or a model's context [Fact 02, 03, 04]. Sections 13 and 19 deal with what this leaves open.

**Copies.**
- Document 04, §§2–4 "Organizations", "Projects", "Markings": conjunctive markings, three-tier visibility, per-marking permissions. https://www.palantir.com/docs/foundry/security/markings , https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/
- Document 04, §6 "Propagation through lineage": where propagation stops. https://palantir.com/docs/foundry/security/access-control-propagation/
- Document 04, §8 "Granular policies": operands, comparisons, weights, cap, failure modes, NOT warning. https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/
- Document 04, §9 and document 02, §8: object and property security policies, null-out, testing. https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/
- Document 02, §3 "Mandatory control properties". https://www.palantir.com/docs/foundry/object-link-types/mandatory-control-properties/
- Document 04, §10: schema vs data permission. https://www.palantir.com/docs/foundry/object-permissioning/ontology-permissions/
- Document 04, §3: Check access. https://www.palantir.com/docs/foundry/security/checking-permissions/

**Left out, and why.**
- CBAC: government-oriented [04].
- Restricted views as a separate object: Palantir itself now steers users to object policies [Fact 04].
- Cipher licence tiers: overkill. Version 2 may add deterministic encryption for bank account numbers [04].
- Sensitive Data Scanner: version 2, using regex built-ins and an LLM classifier [04].
- Project constraints (allowed or prohibited markings): version 2.
- Emulation mode: version 2.

**Open questions.**
- Will RLS predicates built from array settings perform well enough with collection-weight policies at around a million invoices? This needs a benchmark [Inference].
- Can a principal hold incompatible markings, which would require scoped sessions in version 1 (section 13)?

---

### 6. Object-set query model

**Purpose.** One composable, permission-checked JSON query language for every reader (UI, rules, agents), so that nobody guesses from raw tables. *Receivables example:* "invoices more than 60 days overdue, for customers in my region, with no open PaymentPromise" is `subtract(filter(searchAround(filter(Customer, region=MY), invoices), daysOverdue>60), searchAround(filter(PaymentPromise, status=open), invoice))`.

**Design to implement.**
- **ObjectSet discriminated union** [Fact 02]: `base`, `static` (list of keys), `reference` (a saved set), `filter`, `union`, `intersect`, `subtract`, `searchAround` (follow a link), `nearestNeighbors`, `withProperties` (runtime derived properties), `asType` and `interfaceBase` (interface casts).
- **Filters** [Fact 02]: eq, gt/gte/lt/lte, in, isNull, and/or/not, contains, startsWith, containsAllTerms, containsAnyTerm, containsAllTermsInOrder, regex, wildcard, interval, relative date range. Geo filters are left out.
- **Aggregations** [Fact 02]:
  - Metrics: count, min, max, avg, sum, approximate distinct, exact distinct, approximate percentile.
  - Group-bys: exact values, fixed-width buckets, ranges.
  - The response carries an accuracy flag.
  - **Default to exact.** Palantir defaults some UIs to speed over accuracy, while its OSDK and Functions always prefer accuracy. A product that reports money to staff should be exact [Fact 02 + 02's Inference].
- **Paging** [Fact 02]:
  - Default page size 1,000, with a page token.
  - Null properties are omitted.
  - Listing is not consistent (objects can repeat or be missed) unless a snapshot is requested, so implement `snapshot: true` as a repeatable-read transaction [Inference].
  - A `select` projection is mandatory for agents, because unselected properties are loaded and paid for [Fact 02].
- **Saved sets** [Fact 02]: static, dynamic (a saved filter, re-evaluated), temporary (creator-only, expires within 24 h), permanent.
- **Limits** [Fact 02]: 100,000 objects for a search-around and for `.all()`, an advisory threshold of 10,000 in functions, and early failure when the estimate exceeds a limit by more than 2×. Palantir falls back to Spark above 100,000 [Fact 02]. **Instead, fail with a typed `QueryTooLarge` error that suggests a narrower filter** [Inference].
- **Execution** [Inference]: compile the tree to one SQL statement against the security views from section 5, under the caller's request context. No query strings, because OSv2 does not support them [Fact 02].
- **Semantic search**: `nearestNeighbors(text|vector, k, property)` with k from 1 to 500. A text query is embedded with the property's model, and results can be ordered by relevance [Fact 02]. Version 1 uses it only for dispute notes and email text [Inference].
- **Subscriptions** (version 2) [Fact 02]: `ADDED_OR_UPDATED` and `REMOVED` events (removed includes "no longer matches the filter"), a refresh signal, a close reason, and a back-pressure message.
- **Cost units** [Fact 02]: Palantir charges minimums of 2 compute-seconds for a base query, 5 for a search-around, aggregation or SQL query, 10 for semantic search or derived properties, and 18 for an action plus 1 per extra edited object. **Record the same operation classes in an internal usage table**, to give heavy agent usage a visible cost [Inference, following 02 "What to copy" 27].

**Copies.**
- Document 02, §6 "Object sets and the query model": union, filters, aggregations, paging, thresholds, subscriptions, semantic search. Code source `foundry-platform-python/foundry_sdk/v2/ontologies/models.py` (commit b84ce26) and `osdk-ts/packages/api/src/objectSet/ObjectSet.ts`. https://www.palantir.com/docs/foundry/ontologies/oss-limitations/ , https://www.palantir.com/docs/foundry/object-backend/aggregation-considerations/ , https://www.palantir.com/docs/foundry/ontology-sdk/websocket-subscriptions/
- Document 02, §17 "Cost model": per-operation minimums. https://palantir.com/docs/foundry/ontologies/query-compute-usage/

**Left out, and why.**
- Spark fallback and the 10M/30M caps: wrong scale for this product.
- Geo filters.
- Ontology SQL as an agent read path: its dialect is [Unverified 02]. It also invites agents back towards raw tables (see section 18).

**Open questions.**
- Should the product expose a read-only SQL surface for finance analysts (Palantir's SQL Studio and Ontology SQL are GA [Fact 01, 05])? Proposed for version 2.

---

### 7. Functions

**Purpose.** Server-side TypeScript that computes answers, or proposes edits that only an action commits. *Receivables example:* `computeDSO(customerSet)` is a read-only query function. `proposeDunningStep(invoice)` returns proposed edits that the "Advance dunning" action commits.

**Design to implement.**
- **One runtime, TypeScript.** Palantir supports TypeScript v1, TypeScript v2 and Python, and 02 calls the multiple runtimes a legacy artefact [Fact 02 + Inference 02]. Copy the TypeScript v2 feature set: interfaces, LLM access, staged writes [Fact 02].
- **Query functions** are read-only, have API names, and are callable at `POST /queries/{apiName}/execute` [Fact 02]. Palantir always serves the latest tagged version, so renaming breaks consumers, and its advice is to copy the function to a `V2` name [Fact 02].
- **Edit functions** return an edit batch (`create`, `update`, `delete`, `link`, `unlink`). Running one outside an action changes nothing. Primary keys cannot change. Declared edit provenance lets actions enforce permissions [Fact 02].
- **Read semantics inside a run** [Fact 02, 03]:
  - In batched mode, searches and aggregations see old data, while fetch-by-key returns pending values.
  - In staged mode, reads see the run's own edits.
  - **Version 1 uses staged mode only** [Inference; Palantir says staged writes will become its default, Fact 03].
- **Versioning** [Fact 02]: the publisher picks a semver, and versions are immutable. Pre-publish checks warn on dropped functions or inputs, reordered inputs, new required inputs, incompatible type changes and numeric widening. Consumers reference ranges such as `>=1.2.3 <2.0.0`.
- **Limits** [Fact 02]: 60 s default wall time, configurable; 1,024 MiB default memory, configurable from 512 to 5,120. Long work runs asynchronously, for up to 4 h through automations.
- **Identity.** Functions run as the calling user, so the same function returns different rows to different users [Fact 04]. For function-backed actions, end users need only the action permission [Fact 04].
- **Testing.** Stub objects, verified edits, stubbed searches and mocked dates, IDs and users. Palantir's sub-pages for this were not opened [Unverified 02].

**Copies.**
- Document 02, §9 "Functions": languages, limits, edits, queries, versioning. https://www.palantir.com/docs/foundry/functions/language-feature-support/ , https://www.palantir.com/docs/foundry/functions/enforced-limits/ , https://www.palantir.com/docs/foundry/functions/edits-overview/ , https://www.palantir.com/docs/foundry/functions/query-functions/ , https://www.palantir.com/docs/foundry/functions/functions-versioning/
- Document 03, §8: staged writes. https://www.palantir.com/docs/foundry/logic/staged-writes/
- Document 04, §10: functions run as the caller. https://palantir.com/docs/foundry/functions/permissions/

**Left out, and why.**
- Python and TypeScript v1 runtimes: one runtime is enough.
- Deployed long-running functions: asynchronous agent jobs (section 16) cover that need.
- Pipeline Builder functions: there is no pipeline UI.

**Open questions.**
- Customer-authored functions mean a sandbox. Do customers write code in version 1, or only the founder and templates? [Inference needed]

---

### 8. Action types

**Purpose.** The only write path for staff and agents: named business operations that validate, commit atomically, trigger side effects and log themselves. *Receivables examples:* `RecordPaymentPromise(invoice, promisedDate, amount)`, `SendDunningEmail(invoice, templateId)`, `WriteOffInvoice(invoice, reason)` (only for amounts at or below RM 5,000 and only for group AR-Managers).

**Design to implement.**

**8.1 Definition fields** [Fact 02]: `apiName`, `displayName`, `description`, `agentDescription` (Palantir's "agent tool description" [Fact 02, 03]), `parameters`, `parameterOrdering`, `rules`, `sections`, `submissionCriteria`, `isolation` (mode and retry settings), `sideEffects`, `status`, `submissionMetadata` (button text, success message, undo toggle), `permission`, `logEnabled`. Add `autoApplyPolicy` (`stage`|`auto`) and `toolMode` (`confirm`|`auto`) [Inference from Fact 03 staged writes and chatbot confirm].

**8.2 Parameters** [Fact 02]:
- Types: boolean, integer, long, double, decimal, string, timestamp, date, attachment, marking, object reference, object set, interface reference, struct, each with a list variant.
- Allowed values: one-of (optionally allowing other values), range, text length and regex, datetime range, object query (a dropdown filtered by an object set), user (optionally from groups).
- Each parameter can be visible or hidden, editable or fixed, prefilled by the host app, read an object's current value, and override later parameters.
- Limits: 10,000 elements in a primitive list, 1,000 in an object-reference list, 1,000 in lists used in criteria.

**8.3 Rules (edit compilation)** [Fact 02]:
- Rule kinds: create object (primary key required), modify, create-or-modify, delete, create link, delete link (N:M only), function rule (exclusive with all other rules), plus notification and webhook.
- Value sources: parameter, property of an object parameter, static value, current user, current time (fixed at execution start), unique identifier, writeback-webhook output.
- **Rules compile into one edit per object, and later rules override earlier ones.** An action cannot modify or delete an object it created, and cannot create the same object twice.
- Parameters with defaults count as writes [Fact 02].

**8.4 Submission criteria** [Fact 02, 04]:
- A boolean tree of all/any/none nodes over:
  - the current user (ID, groups including inherited, attributes);
  - parameters and properties of object parameters, including list length;
  - execution context (inside a scenario or not).
- Operators: is, is not, matches, <, ≥; for lists, includes, includes any, is included in, each is, each is not.
- **Each root-level node has its own failure message**, and the agent receives it verbatim so it can explain or escalate [02 and 04 "What to copy"].
- Criteria are evaluated at submission against the state at that moment. Object-set and attachment parameters cannot be used in them [Fact 02].
- Reject `NOT` on membership when the criteria are saved [Fact 02, 04].
- **Evaluate on the server for every caller (UI, API, agent, automation).** Palantir does not state this for API submissions [Unverified 04], but it is required [Inference].

**8.5 Who may apply** [Fact 02, 04]:
- The submitter needs view on the edited types and must pass the criteria.
- Types are "editable only via actions" by default, which means Read on the edited objects is enough. Users can therefore create objects they cannot later view.
- Read-time policies filter what an action reads but not what it writes.
- Read and write marking authorizations (a read ceiling, a write floor, and a declassification check at save) are version 2 [Fact 04].

**8.6 Atomicity and isolation** [Fact 02]:
- All model edits in one action commit together. Side effects are outside that boundary.
- Default isolation is snapshot, with object-level conflict detection: the action fails if a written object changed. Snapshot does not catch write skew, so **route invariants through a shared object**. *Example:* a `Customer.creditHoldVersion` that every hold-related action writes [Inference on the example].
- Read committed (last committer wins per property) is optional.
- **Postgres** [Inference]: one `REPEATABLE READ` transaction per action, with a `version` column per object checked on write. That gives the same object-level conflict detection.

**8.7 Retries** [Fact 02]: up to 5 attempts on transient errors, by default **only for actions without external calls** (webhooks, external fetches, nested actions). This is configurable per action type.

**8.8 Dry run** [Fact 02]: every apply endpoint accepts `mode: VALIDATE_ONLY` and returns VALID or INVALID for each criterion and each parameter, with the evaluated constraints and the configured messages. Agents always validate first, show the person, then apply [02 "What to copy" 10].

**8.9 Staging and proposals** [Fact 03]:
- With staged writes, edits go to temporary storage that later reads in the same run can see, and they are applied when execution completes.
- An automation can turn the staged action into a **proposal**, shown with why it was created, a preview and the agent's decision log. Accepting it runs the action.
- Palantir recommends staging consequential or ambiguous actions, and auto-applying only when "purpose, impact, and recovery path justify it".
- **Proposal table** [Inference on shape]: `action_proposal(id, tenant_id, action_type, action_type_version, parameters jsonb, validation_result jsonb, preview_edits jsonb, proposer_principal_id, agent_session_id, decision_log jsonb, status open|accepted|rejected|expired|stale, reviewer_id, decided_at, created_at)`.
- **Departure from Palantir:** open proposals are visible to the reviewer queue, not "only to the automation creator for 24 hours" (03 lists that as a limit to avoid) [Inference].
- On accept, re-run the criteria and the conflict check. If an affected object changed after the preview, mark the proposal `stale` [Inference].

**8.10 Approval** [Fact 03, 04]:
- An action tool is either `auto` or `confirm` (confirm means the user confirms before it runs). The default is confirm for anything that reaches a customer [04 "What to copy" 15].
- Approval tiers from AI FDE: reads auto-approve, edits auto-approve on branches but need approval on protected main, and actions, publishing and anything external always ask. Pre-approval can be granted for a session, scoped to a project [Fact 03].
- Multi-reviewer approval uses the request → tasks → reviewers engine from section 20 [Fact 04].

**8.11 Side-effect ordering** [Fact 02]:
1. Evaluate the criteria. If they fail, no side effect runs.
2. Optionally run **one writeback webhook** *before* the edits. It blocks: if it fails, there are no edits. Its response can feed later rules.
3. Commit the edits atomically.
4. Run **side-effect webhooks** after the commit, best-effort and unordered, with failures hidden from the user.
5. Send **notifications.** They render the *pre-edit* state. Every recipient must be able to see the rendered data, or the action fails, unless the setting "notify only permitted recipients" is on. There are at most 500 recipients (50 when a function renders the content), a subject of at most 250 characters and a body of at most 1,000. Notifications never go to raw email addresses.

Palantir states that the external call can succeed while the commit then fails [Fact 02]. **For customer messaging** (dunning emails, WhatsApp), do not copy best-effort delivery [Inference]. Commit the edit and an `outbox` row in the same transaction, then deliver with an idempotency key, record delivery status back through a system action, and retry with backoff. This is a deliberate departure (see Contradictions).

Webhook limits copied from Data Connection [Fact 01]: typed inputs, a templated body, a 20 s default timeout (180 s maximum), concurrency and rate limits, and a response history visible only to the caller and kept 6 months.

**8.12 Action log schema** [Fact 02]. Each *successful* submission writes a log object linked to every edited object:
- `action_rid`, `action_type_rid`, `action_type_version` (auto-increment);
- `timestamp` (the commit timestamp), `user`, edited object primary keys;
- webhook IDs (sync and async), notification IDs and recipients;
- `scenario_rid`, `revert_status`, `revert_user`, `revert_time`;
- optionally, parameter values, properties of single-valued object parameters, and extra properties of edited objects for later aggregation;
- a human-readable summary of at most 20 parts, with literal parts of at most 50 characters.

Failures go to action metrics, not the log [Fact 02]. The log is forward-only, with no backfill. An object type can require that every action on it is logged [Fact 02].

**Additions** [Inference, as 02 suggests]: `actor_kind human|agent|automation`, `agent_app_id`, `agent_session_id`, `model_id`, `prompt_version`, `trace_id`, `on_behalf_of_principal_id`, `proposal_id`. For receivables, require logs on `Invoice`, `Customer` and `Dispute` [Inference].

**8.13 Revert** [Fact 02]: only the submitting user, only while the action is still the most recent edit to every affected object, and only if "allow revert" was on at submission. Side effects are never undone. Copy these conditions. Offer revert from the action-log view as well as the success toast [Inference]. Anything that already reached a customer needs a compensating action, such as "Send correction" [Inference].

**8.14 Limits** [Fact 02]: 50 object types and 10,000 objects per action, and 3 MB per object edit. For batches, the docs say 10,000 calls (20 for function-backed actions without batched execution), while the REST docstring says 20 per call. **Version 1 uses 1,000 per batch call** [Inference]. Batched execution passes a list of structs to one function call [Fact 02].

**Failure behaviour.**
- Criteria fail: return each node's message, no edits, no side effects.
- Conflict: return a typed `StaleObject` error; the caller re-reads and re-validates.
- Writeback webhook fails: no edits.
- Outbox delivery fails: the edit stands, the delivery retries, and after N attempts an `Alert` object is created [Inference].

**Copies.**
- Document 02, §7 "Action types in detail": anatomy, parameters, rules, criteria, validation API, side effects, consistency, revert, batch, limits. https://www.palantir.com/docs/foundry/action-types/rules/ , https://www.palantir.com/docs/foundry/action-types/submission-criteria/ , https://www.palantir.com/docs/foundry/action-types/consistency-guarantees/ , https://www.palantir.com/docs/foundry/action-types/webhooks/ , https://www.palantir.com/docs/foundry/action-types/notifications/ , https://www.palantir.com/docs/foundry/action-types/action-reverts/ , https://www.palantir.com/docs/foundry/action-types/scale-property-limits/
- Document 02, §10: action log schema. https://www.palantir.com/docs/foundry/action-types/action-log/
- Document 02, §8 and document 04, §11: permissions to apply. https://palantir.com/docs/foundry/action-types/permissions/
- Document 03, §§8 and 14: staged writes and Automate proposals. https://www.palantir.com/docs/foundry/logic/staged-writes/ , https://www.palantir.com/docs/foundry/logic/aip-logic-integration-automate/
- Document 03, §17: approval tiers. https://www.palantir.com/docs/foundry/ai-fde/security-and-governance/
- Document 01, §4: webhook limits and history. https://palantir.com/docs/foundry/data-connection/webhooks-reference/
- Document 05, A1: the action form is generated from the definition, and submit appears only when the criteria pass. https://www.palantir.com/docs/foundry/workshop/actions-use/

**Left out, and why.**
- Read and write marking authorizations: version 2.
- Schedule rules (an action triggers a build): version 2.
- Interface action rules: version 2.
- Legacy isolation mode.

**Open questions.**
- Are webhook calls inside Palantir actions rolled back when the action fails? [Unverified 01]. The outbox design sidesteps the question.
- How long are action logs retained? [Unverified 02]

---

### 9. Rules as governed objects with proposals

**Purpose.** Business rules (escalation, dunning schedules, alert thresholds) are data that analysts edit and owners approve, and that agents can draft but never ship. *Receivables example:* "Invoices more than 30 days overdue with amount over RM 10,000 for SME customers → Alert, severity High, assignee = senior collector" goes live only after the AR manager approves the proposal.

**Design to implement.**
- **A rule is an object** [Fact 05]: name, description, author, rule type, workflow-specific custom properties (for example `alert_severity`, `alert_assignee`, `priority`), and a logic property. Palantir stores the logic as compressed JSON following a grammar. Store it as `jsonb` with a `grammar_version` [Inference].
- **Logic shape** [Fact 05]: inputs → a chain of blocks → output. Each block takes rows and emits rows, and has a preview. Block types are filter, expression, aggregate and join, and the workflow owner can switch types on or off. Inputs are object types or datasets allowed by the owner. Each output maps to a configured output table with enforced columns and types, and many rules can write to the same output.
- **The grammar itself is undocumented** [Unverified 05], so design one [Inference]:
  - Block = `{kind: filter|expression|aggregate|join, ...}`.
  - Filters reuse the object-set filter operators from section 6.
  - Expressions are a small typed expression tree (arithmetic, comparison, date difference, coalesce).
  - Aggregates use the metric set from section 6.
  - Joins are limited to declared links, so a rule can never join on an undeclared key.
- **A proposal is an object** [Fact 05]: rule ID, author, timestamp, status (open|approved|rejected), reviewer, and diffs (`old_name`/`new_name`, `old_logic`/`new_logic`). A rule may have several open proposals.
- **Approve and reject are actions** whose submission criteria encode the policy [Fact 05]:
  - approve an edit or delete proposal: the rule author or a superuser;
  - reject: the rule author, the proposal author or a superuser.
  - **Addition:** a proposal created by an agent cannot be approved by the agent or by the principal it acts for; it needs a second human [Inference].
- **Executor** [Inference, from 05's suggested equivalent]: compile the AST into one SQL statement over the security views, run as the rule workflow's service principal on a schedule or on data-updated triggers (section 2), and write matching rows to the output table. The indexer then turns them into `Alert` objects. Palantir runs all rules in one managed transform by default, with self-managed incremental execution as an option [Fact 05].
- **Metric definitions use the same pattern** [Inference]: a `MetricDefinition` object (DSO, collection effectiveness index, percent current), with an AST and proposals, so that every number an agent reports has a reviewed, versioned definition.

**Copies.**
- Document 05, A12 "Foundry Rules": rule object, proposal object, approve and reject actions with validation, block chain, output datasets, packaging through Marketplace. https://www.palantir.com/docs/foundry/foundry-rules/object-model/ , https://www.palantir.com/docs/foundry/foundry-rules/rule-logic/ , https://www.palantir.com/docs/foundry/foundry-rules/rule-permissions/ , https://www.palantir.com/docs/foundry/foundry-rules/customize-foundry-rules-pipeline/
- Document 05, B3: policy-bot's predicate rule model as a later template for approval policies. https://github.com/palantir/policy-bot

**Left out, and why.**
- Time-series rules: marked Sunset [Fact 05].
- Streaming rule workflows.
- Self-managed generated transform code: version 2.

**Open questions.**
- Palantir lets the rule author approve. If the rule author also wrote the proposal, is that self-approval? The documents do not say.
- Default execution schedule and alert object conventions [Unverified 05].

---

### 10. Scenarios as dry runs

**Purpose.** Run a multi-step change against a copy-on-write overlay, compare it with reality, then commit or discard. *Receivables example:* "If we apply the new dunning schedule to all 3,200 open invoices, how many customers get a final notice this week?" No email is sent and no record changes.

**Design to implement.**
- **A scenario is an overlay that stores only deltas** [Fact 05]: modified properties, created or deleted objects, created or deleted links. It is created by applying actions and running models, and it is **immutable once created**; to change it, create or duplicate a new one [Fact 05].
- **Limits** [Fact 05]: 30,000 edits, 50 actions, 10,000 objects loaded per object set.
- **API** [Fact 02]: create a scenario, apply actions with a `scenarioRid`, list the edited objects and links, find conflicts, rebase. Submission criteria can test "inside a scenario" [Fact 02]. The action log records the scenario ID [Fact 02].
- **Side effects never fire in a scenario** [Inference; Palantir's Agent Builder Preview "runs actions but edits are not applied", Fact 03].
- **Storage** [Inference]: `scenario(id, tenant_id, base_model_version, created_by, created_at, status)` and `scenario_edit` with the same shape as `object_edit`. Reads inside a scenario layer `scenario_edit` over the current state.
- **Commit** [Inference]: replay the scenario's action list on main, each one re-validated and conflict-checked, as one proposal (section 8.9).
- **The same overlay powers evals** (section 17): Palantir runs each eval case in its own ontology simulation [Fact 03].
- Single-step dry runs use `VALIDATE_ONLY` (section 8.8). Scenarios are for multi-step plans.

**Copies.**
- Document 05, A1 "Scenarios (labelled Legacy)": deltas, immutability, limits. https://www.palantir.com/docs/foundry/workshop/scenarios-concepts/
- Document 02, §13: scenario endpoints and the scenario execution context in criteria. https://www.palantir.com/docs/foundry/action-types/submission-criteria/ ; code `foundry_sdk/v2/ontologies/ontology_scenario.py`
- Document 03, §§10 and 13: Agent Builder preview, eval simulation. https://www.palantir.com/docs/foundry/aip-evals/ontology-edits/

**Left out, and why.**
- Workshop scenario widgets and "Models" as property estimators: the product has no Workshop.

**Open questions.**
- Palantir labels Workshop scenarios Legacy and does not say what replaces them [Unverified 05]. The REST scenario API in 02 may be the successor. This needs checking (see Gaps).

---

### 11. Automations and their limits

**Purpose.** "When X happens in the data, do Y", under a durable owner identity and with hard guard rails. *Receivables example:* when an invoice crosses 7 days overdue, run the collections agent to draft a reminder and stage it as a proposal for the assigned collector.

**Design to implement.**
- **Conditions** [Fact 03, 05]:
  - objects added to a set or removed from it (live or scheduled);
  - objects modified (live, optionally limited to chosen properties);
  - run on all objects (scheduled, with batch size and parallelism);
  - threshold crossed (scheduled; built-in logic or a boolean function);
  - time, dataset updated, and combinations.
  - Palantir picks changes up "typically within minutes" [Fact 03].
- **Effects** [Fact 03, 05]: action, function, agent run, notification. Action, function and agent effects can each have a fallback effect. Effects run sequentially or in parallel.
- **Retries** [Fact 03]: per-effect automatic retries for transient errors such as rate limits, plus event retries for persistent errors. Semantics are **at-least-once**, so every effect must be idempotent. The key is `(automation_id, trigger_event_id, effect_index)`, enforced with a unique constraint on the effect-run table [Inference].
- **Limits, copied as numbers** [Fact 05]:

| Limit | Value |
|---|---|
| Scheduled added/removed input | 100,000 objects |
| Run on all objects | 1,000,000 |
| Objects per evaluation (real-time and scheduled per-object) | 10,000 |
| Batch size | ≤1,000 |
| Manual execution set | 5,000,000 |
| Static recipients | 10,000 |
| Maximum queue wait | 45 min, then dropped |
| Maximum run time | 4 h, finished effects kept |

- **Auto-pause on excessive activity.** Palantir gives no threshold [Fact 05]. Choose: pause if more than 10× the trailing 7-day hourly median of effect runs, or more than 1,000 customer-facing messages in an hour [Inference].
- **Identity** [Fact 03, 04]: conditions are evaluated with the owner's permissions, and action, function and agent effects run as the owner. Notifications render under each recipient's permissions. An automation can be owned by an app's service user, so it survives staff turnover. **Version 1 requires a service-principal owner for every automation** [Inference]. The pro-code agent page says agents run "as the triggering user or the automation's service user", which conflicts with the Automate pages [Fact 03, unresolved].
- **Documentation fields required on save** [Fact 05 guidance]: purpose, data scope, execution identity, impact, recovery path. Consequential writes are staged as proposals by default [Fact 03, 05].
- **Implementation** [Inference]: an edit-event table written in the same transaction as each action commit (transactional outbox), a scheduler, and a worker pool using Postgres `SKIP LOCKED`.

**Copies.**
- Document 05, A11 "Automate": condition kinds, effects, limits table, guidance. https://www.palantir.com/docs/foundry/automate/limits/ , https://www.palantir.com/docs/foundry/automate/overview/
- Document 03, §14: object conditions, fallback effects, retries, at-least-once, identity, proposals. https://www.palantir.com/docs/foundry/automate/condition-objects/ , https://www.palantir.com/docs/foundry/automate/effects/ , https://www.palantir.com/docs/foundry/automate/security/
- Document 04, §20: owner identity and recipient rendering. https://palantir.com/docs/foundry/automate/permissions/

**Left out, and why.**
- Streaming conditions.
- "Metric changed" conditions, which Palantir is retiring [Fact 03].
- Branch-aware automations: version 2.

**Open questions.**
- Retry counts and backoff were on Automate sub-pages that were not read [Unverified 03, 05].

---

### 12. The model access layer (proxy, enablement, rate limits, metering)

**Purpose.** One governed gateway in front of rented models, so that every SDK works unchanged while enablement, data gates, limits and metering sit in one place. *Receivables example:* the collections agent drafts an email through Claude, and a nightly job classifies remittance emails with Qwen. Both go through `/llm/proxy/...` and are metered to the AR project.

**Design to implement.**
- **Provider-compatible endpoints** [Fact 03]: Palantir exposes `/api/v2/llm/proxy/` endpoints for Anthropic Messages and OpenAI Chat Completions, Responses and Embeddings, authenticated with the platform bearer token. Copy them as `/llm/proxy/anthropic/v1/messages` and `/llm/proxy/openai/v1/chat/completions`. Qwen is reached through an OpenAI-compatible backend [03 "What to copy" 1; the Qwen routing is 03's Inference].
- **Pipeline for each request** [Inference on order; each check copied]:
  1. authenticate the token;
  2. resolve attribution (project or user, item 4 below);
  3. check model enablement;
  4. run the data gate (section 13);
  5. check rate limits;
  6. forward;
  7. meter;
  8. write an audit `llmInference` event.
- **Model catalog** [Fact 03, 04]: `model(id, provider, family, hosting_path, region, state enabled|disabled|disallowed, experimental bool, category fast|balanced|smart, context_threshold, supports_tools, supports_vision)`. Families are enabled per tenant and per group [Fact 04]. Experimental models need an admin to acknowledge them [Fact 03].
- **Model categories instead of IDs in saved configs** [Fact 03]: an agent bound to "balanced" picks up whatever model the admin maps to it. Deprecation uses a bulk model swap that opens reviewable proposals [Fact 03].
- **Attribution** [Fact 03]: workloads run by builder tools (agents, automations, rules) are charged to a **project**. Personal assistants are charged to the **user**. The attribution decides which limits apply.
- **Rate limits: TPM and RPM per model at three levels** [Fact 03]:
  - **Tenant:** a ceiling set from the founder's own provider quota [Inference]. Palantir's tier numbers are not to be copied [03].
  - **Project:** a percentage of the tenant limit, shared by assigned projects, with a default for unassigned projects. Per-model overrides allow an allowlist (base 0% plus overrides) or a blocklist (an override at 0%).
  - **User:** a default percentage, group overrides (highest wins), or absolute values. Palantir says features break below 50k TPM or 10 RPM, and 0 is not supported.
  - **Interactive reserve:** 20% of capacity is held for interactive traffic, so batch work tops out at 80%. Optional reserved capacity of up to 50% for critical workflows.
  - When a project limit is hit, overlapping requests "retry until they succeed" [Fact 03]. Implement a bounded internal retry of about 30 s with jitter, then a typed `RateLimited` error [Inference].
  - Palantir says over 99% of its request failures come from its own limits [Vendor claim 03], so surface limit hits in the usage UI [Fact 03].
- **Metering record per call** [Fact 03]: `model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, resource_id, project_id, user_id, traffic interactive|batch, latency_ms, trace_id`, rolled up daily by model and resource.
  - **Flat surcharges** in internal units: 4 per LLM step and 8 per tool call, on top of tokens (Palantir's Logic numbers [Fact 03]).
  - A debugger view shows the arithmetic [Fact 03].
- **Session affinity**: forward an `X-Session-Id` header so related requests reuse the provider's prompt cache. Palantir does this on a best-effort basis with `X-Palantir-session-id` (under 256 characters) [Fact 03].
- **Customer-owned keys (version 2)** [Fact 03]: like Palantir's registered models, there is no platform fee, the provider bills the customer, and that spend is not in the product's metering. A per-model data policy fully replaces the tenant policy.
- **Proxy hooks** [Fact 03]: Palantir's federation layer is used for PII redaction, system-prompt injection, format remapping and routing by cost or latency. Version 1 implements format remapping and failover between hosting paths of the same model. Palantir justified adding Claude via Azure with "routing ... during outages" [Fact 03].
- **No provider batch APIs.** Palantir avoids them because they require data storage that fails its compliance bar [Fact 03]. Treat this as a per-customer setting [Inference].
- **Defaults:** temperature 0 [Fact 03]. A synchronous call times out at 5 minutes, matching Palantir's synchronous function limit [Fact 03].

**Copies.**
- Document 03, §6: provider-compatible endpoints, proxy layer, registered models, session header. https://www.palantir.com/docs/foundry/aip/llm-provider-compatible-apis/ , https://www.palantir.com/docs/foundry/aip/build-a-proxy-or-federation-layer/ , https://www.palantir.com/docs/foundry/aip/bring-your-own-model/
- Document 03, §4: capacity management. https://www.palantir.com/docs/foundry/aip/llm-capacity-management/
- Document 03, §5: token accounting and Logic surcharges. https://www.palantir.com/docs/foundry/aip/aip-compute-usage/ , https://www.palantir.com/docs/foundry/logic/compute-usage/ , https://www.palantir.com/docs/foundry/announcements/2026-05
- Document 03, §2: model states, categories, deprecation. https://www.palantir.com/docs/foundry/aip/supported-llms/ , https://www.palantir.com/docs/foundry/announcements/2026-10
- Document 04, §20: model enablement per organization and group. https://palantir.com/docs/foundry/aip/enable-aip-features/

**Left out, and why.**
- A 90-model catalog and Palantir's provider contracts: cannot be negotiated by a solo founder [03].
- Enrollment tier sizes [03].
- Autoscaling up to 2×.
- Web search tool: version 2.

**Open questions.**
- Which Qwen hosting path (Alibaba Cloud region, or a third-party host) satisfies Malaysian customers' data terms? Not in these documents.
- Does Palantir route Claude Agent SDK calls through the Anthropic-compatible proxy? [Unverified 03]

---

### 13. What reaches a model

**Purpose.** Decide, before any prompt leaves the platform, which data the session may carry to which model, and never let a model see more than its caller could read. *Receivables example:* an `HR-Confidential` marking on staff commission data means the Qwen endpoint is barred from any session that carries it, while Claude is allowed. An external customer-facing agent's session carries only `Customer-Facing` scope.

**Design to implement.**
- **The data gate checks the session, not the prompt** [Fact 03, 04]:
  - There is a tenant policy, "allow any data" or "allow only these markings", plus per-model overrides that fully replace it.
  - A request passes only if **every** mandatory marking on the session token is in the allowlist. A session with no markings always passes.
  - The check does not inspect prompt content, so a user cleared for markings A and C, with an allowlist of A and B, is blocked even when the prompt contains only A data. The remedy is a scoped session.
- **Scoped sessions** [Fact 04]: an admin defines named marking sets, and a user can pick one only if they hold all of its markings. Inside the session, visible = resources carrying one of the session's markings, plus unmarked resources. **Every agent run starts by narrowing to a declared scope** [Inference, following 03 and 04]. Customer-facing agents always run in a narrow scope [04 "What to copy" 12].
- **The model gets data only through tools executed under the caller's identity** (section 15). The model never calls tools itself [Fact 03].
- **Context minimisation** [Fact 03]:
  - each query tool exposes a whitelist of properties per object type and a cap on the number of objects returned;
  - media references and vectors are never printed into context;
  - variable visibility to the LLM is off by default.
- **Retrieval playbook** [Fact 03]: if the content fits the context window (Palantir notes 128k tokens is about 300+ pages), skip search. Otherwise use top-K over chunk objects with vectors, and add HyDE, query enrichment or extraction, and hybrid search with RRF (score = Σ 1/(k + rank)) only when evals show a need. When answers are bad, check retrieval first.
- **Propagation gap, stated as a design constraint** [Fact 04]: tool results in model context carry no link to their source policy. So:
  1. model outputs persisted by agents (drafts, summaries, memory) are written through actions whose output objects inherit the union of the markings the session read [Inference];
  2. **agent logs carry explicit markings** chosen by an admin, because Palantir's logs do not inherit them [Fact 03, 04];
  3. outbound customer messages pass a check that the recipient may receive the referenced objects [Inference, by analogy with Palantir's notification rule that every recipient must be able to see the rendered data, Fact 02].
- **Saved analyses store the recipe, not the results** [Fact 03]: on reopen, re-run under the viewer's permissions.
- **Provider terms.** Palantir's zero-retention and no-training statements are [Vendor claim 03, 04] backed by contracts. Claim only what each provider's own terms say [03, 04].
- **Local MCP clients** send tool outputs to their own provider, under that provider's terms [Fact 03]. Make this visible in the consent screen (section 18).

**Copies.**
- Document 03, §7 and document 04, §20: the markings gate on the session token. https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
- Document 04, §12: scoped sessions. https://www.palantir.com/docs/foundry/administration/configure-scoped-sessions/
- Document 04, §6: where propagation stops. https://palantir.com/docs/foundry/security/access-control-propagation/
- Document 03, §§8–9: query-tool property limits, variable visibility. https://www.palantir.com/docs/foundry/logic/blocks/ , https://www.palantir.com/docs/foundry/chatbot-studio/application-state/
- Document 03, §16: retrieval playbook. https://www.palantir.com/docs/foundry/ontology/ontology-augmented-generation/
- Document 03, §15: log markings not inherited. https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/
- Document 03, §18: saved analyses. https://www.palantir.com/docs/foundry/aip-analyst/analysis-resources/

**Left out, and why.**
- Classifying prompt content (not done by Palantir either).
- PII redaction proxy: version 2.

**Open questions.**
- Do receivables customers have enough marking diversity to need scoped sessions in version 1? Customer-facing agents need them regardless.

---

### 14. Token scope intersection and agent identity

**Purpose.** Every agent is a registered application with a fixed ceiling, and every token it holds is the overlap of who it acts for, what it may ever touch, and what it asked for. *Receivables example:* the "Collections Assistant" app may read `Customer`, `Invoice`, `PaymentPromise` and `Dispute`, and apply `RecordPaymentPromise` and `SendDunningEmail`, nothing else. A collector using it can only ever do the overlap of that list and their own rights.

**Design to implement.**
- **Application registration** [Fact 02, 04, 05]: `agent_app(id, tenant_id, name, client_type confidential|public, restricted bool default true, allowed_object_types[], allowed_interfaces[], allowed_actions[], allowed_functions[], allowed_projects[], allowed_api_namespaces[], owner_principal_id, service_principal_id)`. Restricted is the default, and switching to unrestricted wipes the lists [Fact 04]. Palantir's default cap is 1,000 resources and restrictions per app [Fact 02]. **Version 1 does not offer unrestricted apps at all** [Inference; Palantir advises against them, Fact 04].
- **Effective permission = principal ∩ app ceiling ∩ requested scope.** A token with no scope has no permissions [Fact 02, 04, 05]. Scopes are operation-only (read and write per namespace) and namespaces do not imply each other [Fact 04]. An out-of-scope call returns a typed `ApiUsageDenied` error [Fact 04].
- **Grant types** [Fact 03, 04]:
  - **Authorization code with PKCE (S256, verifier of 43–128 characters):** for staff-facing agents, acting as the consenting user. Codes expire after 10 minutes.
  - **Client credentials:** for headless agents, acting as a service user. Needs a confidential client.
- **Refresh tokens** need `offline_access`, rotate on every use, and revoke the whole grant if reused more than 1 minute after first use. Inactive refresh tokens expire after 30 days [Fact 04].
- **Tenant enablement** [Fact 04]: an app must be enabled per tenant, and each user consents through OAuth. Tenant-wide consent is not offered, because Palantir does not recommend it [Fact 04].
- **Execution identities** (record one in every audit event) [Fact 03, 04]:
  1. **user-scoped** (the default for interactive agents);
  2. **project-scoped** (runs with project permissions; every resource must be imported into the project);
  3. **owner** (automations);
  4. **service principal** (external and headless agents, automations owned by an app).
- **Platform-issued credentials for agent code** [Fact 03, 04]: no client ID or secret in code; helpers resolve the URL and auth headers at runtime; access is bounded by the binding chosen at publish and by the app restrictions. Token lifetime is [Unverified 03]. Choose a 15-minute access token for agents and a 4-hour maximum for "extended execution" tokens (Palantir's function-obtained tokens have a TTL of up to 4 hours [Fact 04]) [Inference].
- **Three parties behind an agent's permissions** [Vendor claim 04, read via an aggregator copy of a Palantir blog post]: the configuring owner, the agent's service user or OSDK scope, and the user it acts for at that moment. **Model this explicitly:** `effective = owner_ceiling ∩ app_ceiling ∩ acting_principal ∩ requested` [Inference].
- **Personal access tokens are not for production** [Fact 04]: version 1 offers them only for local development, with an expiry.
- **Service account hygiene** [Fact 04]: a named owner, periodic review, rotation, monitoring.

**Copies.**
- Document 02, §15 and document 04, §19: Developer Console restrictions, the intersection rule, scopes. https://www.palantir.com/docs/foundry/developer-console/application-restrictions/
- Document 04, §19: OAuth specifics, enablement, personal tokens. https://www.palantir.com/docs/foundry/platform-security-third-party/writing-oauth2-clients/ , https://www.palantir.com/docs/foundry/platform-security-third-party/enabling-3pa-access/ , https://www.palantir.com/docs/foundry/platform-security-third-party/user-generated-tokens/
- Document 03, §§8 and 11 and document 04, §20: execution modes, scoped permissions for pro-code agents. https://www.palantir.com/docs/foundry/logic/execution-mode-settings/ , https://www.palantir.com/docs/foundry/agents/scoped-permissions/
- Document 04, §20: three-party permission model (vendor claim). https://scour.ing/@matmat/p/https:/blog.palantir.com/securing-agents-in-production-agentic-runtime-1-5191a0715240

**Left out, and why.**
- Organization-level consent, unrestricted apps, and production personal tokens: Palantir's own docs advise against all three [Fact 04].
- Hosting apps on subdomains.

**Open questions.**
- How Palantir mints agent tokens, and whether the identity is the user or a service [Unverified 03, 04].

---

### 15. Tool design and tool identities

**Purpose.** Agents act only through tools generated from the registry. The platform runs each tool under an explicit identity; the model only asks. *Receivables example:* the agent sees tools `search-invoice` (object query), `record-payment-promise` (action, confirm mode) and `compute-dso` (query function), each with a description written for agents.

**Design to implement.**
- **Generated tool kinds** [Fact 02, 03]:
  1. **one tool per action type**, whose parameters become the tool schema and whose `agentDescription` says when to use it and how to get the inputs;
  2. **one tool per query function**;
  3. **an object-query tool** over the allowed object types, with a limited property list, supporting filter, aggregate, inspect and link traversal, and with object-return caps;
  4. **request clarification** (pause and ask the user);
  5. **update application variable**.
- **Tool names** follow Palantir's Ontology MCP pattern, for example `search-osdk-todo-task` and `create-osdk-todo-task` [Fact 02]. Use `search-<type>` and `<action-api-name>` [Inference].
- **Execution rule** [Fact 03]: "the LLM never calls tools directly". The platform validates the arguments against the schema, runs the tool under the session identity (section 14), and returns native JSON. Tool responses must be native JSON, not JSON-encoded strings [Fact 03].
- **Errors** use one envelope: `{errorCode, errorName "Namespace:Name", errorInstanceId, parameters}`, from Palantir's Conjure [Fact 05]. A tool error is shown to the model on the next turn [Fact 03]. Submission-criteria failures return their configured messages [Fact 02].
- **Action tools have a mode** of `auto` or `confirm` (the user confirms first) [Fact 03, 04]. The default is confirm for anything customer-facing or financial [04].
- **Deterministic bindings** [Fact 03]: tool parameters can be bound to app variables instead of LLM-generated values, frozen at the start of the reasoning loop. Tool outputs can be mapped straight into variables, which Palantir recommends over LLM-driven updates. *Example:* in the collector's inbox, `invoice` is bound to the selected row, and the model fills only `promisedDate`.
- **Native vs prompted tool calling** [Fact 03]: use native tool calling when the model supports it, since it allows parallel calls and is cheaper. Fall back to prompted mode, where tool instructions are injected into the prompt.
- **Tool budget** [Fact 03]: tool *definitions* are sent on every request, so let builders switch off unused categories. Offer on-demand discovery with a `search_tools` tool, which needs the client to support `tools/list_changed` [Fact 03].
- **Pinning** [Fact 03]: function tools use the latest version by default, or a pinned version. Pin in production configs [Inference].
- **Duplicate prevention**: search before create. Palantir suggests a Claude "skill" for this [Fact 03]. Make the generated create-tools idempotent on a caller-supplied key [Inference].
- **Feedback object** [Fact 03]: persist each AI recommendation, its reasoning and the human verdict as an object (`Suggestion`), and give the agent a query tool over past ones (dynamic few-shot).
- **Tool identity record** [Inference]: every tool call writes `tool_call(id, session_id, tool_name, tool_version, args jsonb, executing_principal_id, on_behalf_of, app_id, result_status, duration_ms, cost_units, trace_id)`.

**Copies.**
- Document 02, §16 and document 03, §12: one tool per action and query function, the agent tool description, tool names. https://www.palantir.com/docs/foundry/ontology-mcp/sample-architecture/ , https://www.palantir.com/docs/foundry/ontology-mcp/mcp-tools-and-agent-configuration/
- Document 03, §§8–9: tool taxonomy, prompted vs native, confirmation, deterministic bindings. https://www.palantir.com/docs/foundry/logic/blocks/ , https://www.palantir.com/docs/foundry/chatbot-studio/tools/ , https://www.palantir.com/docs/foundry/chatbot-studio/application-state/
- Document 03, §5: tool definitions as a cost driver. https://www.palantir.com/docs/foundry/aip-analyst/compute-usage/
- Document 05, B3: Conjure error envelope. https://github.com/palantir/conjure
- Document 03, §8: feedback object pattern. https://www.palantir.com/docs/foundry/logic/faq/

**Left out, and why.**
- Command tools that drive a paired UI: no Palantir apps to drive.
- Calculator tool: the model can use functions.
- No-code custom tool builder: version 2.

**Open questions.**
- Should version 1 expose a free-form object-query tool at all, or only named query functions? Named functions are safer, but the agent may get stuck without the generic tool [Inference].

---

### 16. Agent session-state design

**Purpose.** Agent sessions that can last for days, wait for people, be replayed to any point, and survive restarts. *Receivables example:* a dispute-resolution session starts when a customer replies "we never received the goods". It gathers the invoice and the delivery record, asks the collector one question, waits two days for the customer's proof, then proposes a credit note.

**Design to implement.**
- **Session = typed context items + agent state + an ordered event queue** [Fact 03]. Sessions can last indefinitely and have several participants.
- **Context items** are defined with `(type, argSchema, dataSchema, create, render)`. `render` returns `ready` or `pending`. An ordering list (`contextItemOrder`) controls what the model sees; removing an ID hides the item without deleting it, which is how the context window is managed [Fact 03].
- **Events** come from users, schedules, automations and effects, and are processed strictly in order. A pure `handleEvent(state, event)` returns updates (`setAgentState`, create, delete or reorder items) and **effects**. Effects are asynchronous jobs that report back by dispatching events [Fact 03].
- **Recompute before every model call** [Fact 03]: `systemPrompt(state)`, `tools(state)` and `model(state)`. The model can be wrapped for fallback, for example switching to a backup when the primary response has a terminated status.
- **Long-running tools and human questions** return a *pending* item at once and resolve later through an event. A human question is a `UserQuestion` item, and the person's answer arrives as an event [Fact 03].
- **Completion modes** [Fact 03]: "stays open" (conversational) or "ends after first valid output", matching a typed output schema.
- **Pre-computed variables** run before the agent starts (filtered object sets, function results) [Fact 03]. Palantir also lets actions run at session start even if nothing references them. **Do not copy that: pre-computation is read-only** [Inference].
- **Asynchronous agent jobs** [Fact 03]: synchronous calls have a 5-minute limit. Long agents run asynchronously, return nothing, and write transcripts and results to objects that UIs and evals read. Arguments pass primary keys, and the agent re-fetches under its own scope.
- **Chat as a function** [Fact 03]: inputs `userInput` and an optional `sessionId` (omit it for a new session, never pass an empty string). Outputs are the markdown response, the session ID and any changed variables.
- **Postgres tables** [Inference]:
  - `agent_session(id, tenant_id, app_id, scope_markings[], principal_id, state jsonb, status, created_at)`;
  - `session_event(session_id, seq bigint, source, type, payload jsonb, created_at)`, append-only, unique on `(session_id, seq)`;
  - `context_item(session_id, item_id, type, data jsonb, render_status, visible bool, order_index)`;
  - `effect_job(id, session_id, kind, args, status, emits[], attempts)`.
  - One worker holds a per-session advisory lock, so events are processed one at a time.
- **Replay and debugging** [Fact 03]: a timeline filterable by event type and time, searchable payloads, a conversation pane, a raw context-items pane, and **pinning to a past event to see the state at that moment**.
- **Session logging** [Fact 03]: each message is one execution with a trace ID. Events are `session_metadata`, `user_request`, messages, `tool_call`, `tool_call_result`, `final_response` and `execution_error`. Common fields are `uid` and `owning_rid` (the originating app, even through nested calls). Logs carry markings (section 13).
- **Context overflow.** Palantir makes the user start a new session [Fact 03]. Version 1 copies that, with a "carry forward a summary item" option [Inference].
- **Skills** (version 2) [Fact 03]: Markdown resources with a name, a "when to use" description and a body, loaded on demand by description, and permissioned by folder.

**Copies.**
- Document 03, §10 "The Agent Stack": sessions, context items, events, state machine, effects, HITL, model fallback, Agent Manager debugging, completion modes, pre-computed variables. https://www.palantir.com/docs/foundry/agent-sdk/advanced-customization/ , https://www.palantir.com/docs/foundry/aip/agent-stack/ , https://www.palantir.com/docs/foundry/agent-builder/core-concepts/ , https://www.palantir.com/docs/foundry/agent-manager/session-debugging/
- Document 03, §11: async publish and call. https://www.palantir.com/docs/foundry/agents/publish-and-call/
- Document 03, §9: chatbots as functions, session logging. https://www.palantir.com/docs/foundry/chatbot-studio/chatbots-as-functions/ , https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/
- Document 03, §17: skills. https://www.palantir.com/docs/foundry/ai-fde/aip-skills/

**Left out, and why.**
- Multi-agent Boardroom teams: beta, and needs a separate product [Fact 03].
- Agents optimising agents (AIP Evolve): version 2 at earliest.

**Open questions.**
- Agent SDK status (GA or beta) is [Unverified 03]. The design is copied from docs, not from proven production use.
- Palantir says agent memory is policy-checked at runtime [Vendor claim 04]. How is unclear.

---

### 17. Evaluation suites

**Purpose.** Unit tests for AI behaviour that tolerate randomness, run against a sandbox, and gate every prompt or model change. *Receivables example:* 50 historic disputes with known categories, each run 3 times against two prompt versions. Plus 30 dunning drafts graded by an LLM judge on "mentions the invoice number and due amount; does not threaten legal action before stage 3".

**Design to implement.**
- **Suite = test cases × targets × evaluators** [Fact 03]. Cases are entered manually or generated from an object set, with columns from properties, linked objects or static values. "Add as test case" works from production run history.
- **Evaluators** [Fact 03]: exact match (boolean, string, arrays, numeric with deviation, temporal, object), regex, Levenshtein, string length, keyword checker, object-set contains and size range, numeric, float and temporal ranges, an **LLM-as-judge** (true or false on a written condition, with its reasoning), and ROUGE. Custom evaluators are published functions returning a struct of metrics.
- **Pass criteria** [Fact 03]: boolean metrics pass on True or False. Numeric metrics have a goal of Increase (minimum threshold) or Decrease (maximum threshold), and thresholds are inclusive. A case fails if any metric fails in any iteration. Metrics that do not apply show "No value" and are excluded from aggregates.
- **Run limits** [Fact 03]: 1 to 100 iterations per case (**default 3** for LLM targets), up to 15,000 executions per run, up to 10 cases in parallel. Metadata (branch, version, model) is captured automatically. Runs can be compared side by side with a diff.
- **Experiments** [Fact 03]: grid search over model and prompt variants, up to 25 runs, with up to 4 compared at once.
- **Intermediate parameters** [Fact 03]: builders flag any step's output for grading.
- **Sandbox** [Fact 03]: each case runs in its own simulation (section 10 overlay), so edits never touch real data. Evaluators find created objects by an identifying property, receive the simulated versions of edited objects, and check that deleted objects return a count of zero.
- **Results table** [Inference]: `eval_result(run_id, case_id, iteration, metric, value, passed, judge_reasoning, output jsonb, error)`. This stores **per-metric pass/fail and judge reasoning**, both of which Palantir's results dataset lacks [Fact 03 for the gap].
- **One execution path for tests and production.** Palantir's Debugger does not enforce the 5-minute production timeout, which it lists as a failure mode [Fact 03]. So evals run the real runtime with production limits [Inference].
- **Validation drill** [Fact 02]: business questions sourced from the customer's operating rhythm, structured as situation → contributing factors → impact. People who did not build the model answer them first in general tools only, recording correctness, time, hesitation, search terms, dead ends and manual exports. Then an agent answers them without path hints, and the difference is read as a diagnosis (for example, people succeed but the agent fails = business knowledge not encoded). The questions are kept as a standing suite. Run this at each customer's onboarding.
- **Gate** [Inference]: a proposal that changes a prompt, model mapping, action or rule that an agent uses must attach a passing suite run (section 20).

**Copies.**
- Document 03, §13 "AIP Evals": concepts, evaluators, pass criteria, run configuration, experiments, intermediate parameters, simulated edits, results dataset gaps. https://www.palantir.com/docs/foundry/aip-evals/create-suite/ , https://www.palantir.com/docs/foundry/aip-evals/run-suite/ , https://www.palantir.com/docs/foundry/aip-evals/experiments/ , https://www.palantir.com/docs/foundry/aip-evals/intermediate-parameters/ , https://www.palantir.com/docs/foundry/aip-evals/ontology-edits/ , https://www.palantir.com/docs/foundry/aip-evals/results-dataset/
- Document 02, §18: validation drills. https://palantir.com/docs/foundry/ontology/ontology-design-validation/
- Document 03, §8: keep 5–10 input/output examples as unit tests and rerun them after each prompt change. https://www.palantir.com/docs/foundry/logic/faq/

**Left out, and why.**
- AI-generated suites and AI analysis of failures: version 2.
- Pipeline LLM eval nodes: no pipeline builder.

**Open questions.**
- Who writes the first suite for a new customer: the founder, the customer, or a generator? Palantir offers "Generate with AI FDE" [Fact 03].

---

### 18. MCP servers (builder vs consumer)

**Purpose.** External agents (Claude, Copilot, a customer's own) reach the company model through MCP under exactly the same rules as internal agents. Builder agents can propose model changes but never touch data. *Receivables example:* a finance manager's Claude Desktop connects to the "AR Assistant" MCP server, can search invoices she may see and record promises, and cannot change the `Invoice` type.

**Design to implement.**
- **Consumer MCP server, one per registered app** [Fact 02, 03, 05]:
  - Enable it on the app. The app's restrictions decide what is exposed: one tool per action type, one per selected query function, and an object read tool.
  - Authentication **reuses the app's OAuth client**: authorization code for per-user agents, client credentials for service agents. There is no separate MCP auth. Scopes, app restrictions and user permissions all apply.
- **Read tool** [Inference]: Palantir exposes object types through a single SQL tool, whose dialect is [Unverified 02]. **Version 1 exposes the object-set JSON tool from section 6 instead**, keeping agents off SQL, in line with the founder's aim.
- **Response shaping** [Fact 03]: optional response semantics (a data path plus a card template) for clients such as Copilot Studio. Version 2.
- **Server listing** [Fact 02, 03]: an MCP hub lists the tenant's servers. Per-tool enable/disable and description editing are planned at Palantir; build them in version 1 [Inference].
- **Builder MCP server** [Fact 03, 04]:
  - Tools for reading the registry, lineage, health, docs and object queries.
  - It **can propose changes to types; it cannot write model data.**
  - It has no destructive write tools.
  - Every model change becomes a human-approved proposal.
  - Local use is **off by default** and must be enabled by an admin.
  - It offers tool search.
  - Version 1 builder tools: read IR, diff IR, open proposal, run eval suite, read health [Inference]. Palantir's 89 tools are not needed [03].
- **Governance warning shown at consent** [Fact 02, 03]: connecting an external LLM moves data outside the platform under that provider's terms. Palantir advises a governance review.
- **Audit** [Fact 04]: every MCP call is an audit event with `inApplicationContext` (the app ID) and, for service agents, `onBehalfOf`.

**Copies.**
- Document 02, §16 "Ontology MCP": tool mapping, OAuth reuse, agent tool description, positioning vs builder MCP. https://www.palantir.com/docs/foundry/ontology-mcp/sample-architecture/ , https://www.palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/ , https://www.palantir.com/docs/foundry/ontology-mcp/overview/
- Document 03, §12 "Palantir MCP vs Ontology MCP": table of audience, scope, writes, auth; tool search. https://www.palantir.com/docs/foundry/palantir-mcp/available-tools/ , https://www.palantir.com/docs/foundry/palantir-mcp/security/ , https://www.palantir.com/docs/foundry/announcements/2026-06
- Document 04, §14: no destructive write tools in the builder MCP. https://www.palantir.com/docs/jp/foundry/palantir-mcp/security/

**Left out, and why.**
- Dataset creation through the builder MCP: there are no customer pipelines.
- Agents-as-tools (exposing a chatbot as an MCP tool): version 2.

**Open questions.**
- Palantir's Ontology MCP security page was not read [Unverified 04].
- The SQL tool's limits are [Unverified 02].

---

### 19. Audit categories

**Purpose.** Every meaningful act (login, read, export, permission change, action, LLM call) is a typed event that a customer's security team can query and export. *Receivables example:* an auditor asks who exported the aged-debtors list last quarter and which agent sent final notices. Both answers come from category-filtered queries.

**Design to implement.**
- **Event shape (audit.3)** [Fact 04]: `{time, uid, product, categories[], entities[], users[], requestFields{}, resultFields{}, result}`. Every event has at least one category, and each category defines what goes in `requestFields` and `resultFields`. Only `uid` is populated for users, and enrichment happens downstream [Fact 04]. **Add** `tenant_id`, `trace_id`, `session_id`, `app_id`, `ip` [Inference; Palantir's fields beyond the listed ones are Unverified 04].
- **Categories to implement in version 1** [Fact 04 for the names]:
  - data: `dataLoad`, `dataSearch`, `dataExport`, `dataCreate`, `dataDelete`;
  - model: `ontologyDataLoad`, `ontologyMetadataUpdate`;
  - management: `managementPermissions`, `managementGroups`, `managementMarkings`, `managementTokens`;
  - auth: `authorizationCheck` (succeeded and failed targets), `authenticationCheck`, `userLogin`, `userLogout`;
  - tokens: generation, revoke;
  - secrets: use;
  - requests: create, approve, execute;
  - context: `onBehalfOf`, `inApplicationContext`;
  - LLM: `llmInference` (inputs and responses), `llmRoute`;
  - spill remediation: `auditDataRedact`.
  - `userJustify` comes with checkpoints in version 2.
- **Storage** [Inference]: an append-only `audit_event` table partitioned by month. Writes are revoked for every role except the audit writer. Events are written in the same transaction as the act where possible (actions, permission changes) and asynchronously otherwise (reads, LLM calls).
- **Delivery** [Fact 04]: a cursor-paged API whose next-page token is always returned, for gap-free SIEM polling. A per-tenant export with retention of up to 730 days, carrying the tenant's marking by default. Palantir's events arrive in about 15 minutes. Access needs an audit role plus an `api:audit-read`-style scope.
- **Searching the audit log is itself audited** [Fact 04].
- **Detection recipes** to ship as default monitors [Fact 04]: more than 5 failed authentication checks per user, a data load followed by an export, unusual token generation, abnormal session length.
- **Operational observability is a separate store** [Fact 03, 05]: execution history, P95 metrics, and traces with LLM prompt, response and tokens per span, keyed by the "source executor" (the first executable in the call chain). Users see their own executions for 24 hours. Seeing others' needs edit rights on the source executor, log access enabled, and all markings applied to the logs. Palantir's pages disagree on execution-history retention (7 vs 30 days) [Fact 03]. **Choose 30 days** [Inference].
- **Monitors** [Fact 01, 05]: rules on actions, functions, automations and agents, with Low, Medium and High thresholds, AND-composite rules, snooze, and email, Slack or webhook delivery.
- **Per-object agent timeline** [Fact 03]: who (human or agent) changed each business object, with tokens, runtime and **time spent waiting for humans**. Built from the action log plus tool calls [Inference].
- **Checkpoints** (version 2) [Fact 04]: justification prompts (acknowledge, free text with regex, dropdown, re-authentication) on exports, bulk reads, role grants and token creation. Each submission is an immutable record with a frozen copy of the prompt text. Palantir's checkpoints do not fire on API, SDK or async action submissions [Fact 04]. **Ours must also fire for agent exports** [Inference].

**Copies.**
- Document 04, §15 "Audit logs": schema, categories, delivery, latency, retention, detection recipes. https://www.palantir.com/docs/foundry/security/audit-logs-overview/ , https://www.palantir.com/docs/foundry/security/audit-log-categories/ , https://www.palantir.com/docs/foundry/security/monitor-audit-logs/
- Document 03, §15 and document 05, B7: observability, traces, source executor, log permissions. https://www.palantir.com/docs/foundry/aip-observability/trace-view/ , https://palantir.com/docs/foundry/observability/overview/ , https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/
- Document 01, §15 and document 05, B7: monitoring views. https://palantir.com/docs/foundry/monitoring-views/overview/
- Document 04, §13: checkpoints. https://www.palantir.com/docs/foundry/checkpoints/configure-checkpoints/ , https://www.palantir.com/docs/foundry/checkpoints/core-concepts/

**Left out, and why.**
- An audit explorer UI: version 2. The API comes first.
- Lineage-aware deletion (Data Lifetime): version 2, though it is needed for privacy deletion requests [04].

**Open questions.**
- The full audit.3 field list is [Unverified 04].
- How long must Malaysian customers keep audit and action logs? Not covered in these documents.

---

### 20. Change control (branch, proposal, review)

**Purpose.** Changes to the model, actions, rules, metric definitions and agent configs go through branch → proposal → review → merge, whether a person or an AI drafted them. *Receivables example:* the AR manager wants a new `DunningStep` stage and an updated escalation rule. The founder's builder agent drafts both on a branch, the eval suite runs, the AR manager and the tenant admin approve, and the change merges.

**Design to implement.**
- **Scope in version 1: branch definitions only, never data** [Inference, following 03's "smaller version"]. Definitions are the registry IR, action types, rules, metric definitions, functions and agent configs. Palantir also never merges data; it merges code and rebuilds data [Fact 01].
- **Branch rules** [Fact 01, 02, 03]:
  - Branches are created only from main.
  - Selected resources are "protected", so changes to them must go through a branch.
  - Actions on a branch never write to main.
  - API names cannot change on a branch.
  - A branch rebases automatically until it contains changes; after that, rebasing is manual with a per-resource choice (main, branch, custom).
- **Proposal** [Fact 01, 02, 03]:
  - It needs passing checks: no conflicts with main, approvals in place, branch up to date, everything published and error-free.
  - It is split into **per-resource tasks**, and reviewers approve or reject each one.
  - **One rejection blocks the whole proposal.**
  - A "true conflict" means the same property was edited on both sides, and someone picks one.
  - **Add a check:** attached eval runs must pass for any agent-facing change [Inference].
- **Merge** [Inference]: apply the whole proposal in one Postgres transaction, producing a new `model_version`. Palantir notes that a partially failed merge cannot be reverted [Fact 01], and a single transaction rules that out.
- **Lifecycle** [Fact 01]: Active → Inactive after 35 days by default (branch-only test data deleted 7 days later) → Archived (manual, restorable) → Merged (terminal). Palantir warns that active branches cost more over time.
- **Approvals engine**, shared with access requests and action proposals [Fact 04]:
  - Request states: Pending approval, Changes requested, Action required, Completed, Closed, Rejected and Closed.
  - Task states: Review, Approved, Rejected (a rejection can be overridden while the request is open).
  - All tasks must be approved before the change applies.
  - Completed requests stay as a record.
  - Palantir does not notify members of groups with 50 or more people [Fact 04]. **Notify a named reviewer instead** [Inference].
- **AI-authored changes always arrive as proposals** [Fact 03, 05]: Pilot, AI FDE, Evolve, the builder MCP and bulk model swaps all go through Global Branching proposals. The builder agent's approval tiers come from section 8.10.
- **History and revert** [Fact 02, 05]: every save is a version with editor, time and description. Revert creates a new head version. A changelog panel shows JSON diffs between versions.
- **Status rules** from section 3 still apply: active resources cannot be deleted or renamed [Fact 02].
- **Approval policy language (version 2)** [Fact 05]: policy-bot-style rules, with predicates combined with and/or, a disapproval policy and a simulation API.

**Copies.**
- Document 01, §17 "Global Branching": proposals, checks, true conflicts, single-rejection block, lifecycle, partial-merge warning. https://www.palantir.com/docs/foundry/global-branching/core-concepts/
- Document 02, §13: ontology branching, protected resources, rebase, per-resource review. https://palantir.com/docs/foundry/ontologies/branching-ontology/
- Document 03, §8: Logic branching rules (API names frozen, merge preconditions). https://www.palantir.com/docs/foundry/logic/branching-logic/
- Document 04, §14: Approvals states. https://www.palantir.com/docs/foundry/approvals/overview/
- Document 05, A1 and A15: Workshop versions and diffs; Pilot's gate. https://www.palantir.com/docs/foundry/workshop/versions/ , https://palantir.com/docs/foundry/pilot/overview/
- Document 05, B3: policy-bot. https://github.com/palantir/policy-bot

**Left out, and why.**
- Branching datasets, pipelines and apps: too broad for a solo build [03].
- Indexing data on branches.

**Open questions.**
- Should customers be able to protect their own resources, or does the founder's template protect everything by default?

---

### 21. Packaging and versioned upgrades of templates

**Purpose.** One receivables template, installed into many tenants with each tenant's own field mapping, upgraded through release channels without breaking local changes. *Receivables example:* "AR Collections pack 1.3" holds the `Customer`, `Invoice`, `Payment`, `PaymentPromise` and `Dispute` types, eight actions, five rules, DSO and CEI metric definitions, and two agent configs. It needs inputs such as "map your ERP's customer table and its credit-limit column".

**Design to implement.**
- **A template pack is outputs plus inferred inputs** [Fact 01, 05]:
  - The author picks the most-downstream resources, and dependencies are walked automatically.
  - Anything not packaged becomes a typed **input** the installer must map.
  - An input can be promoted to an output (not parameters or groups).
  - Presets and input API names allow programmatic installs.
- **Size cap** [Fact 01, 05]: 15,000 inputs plus outputs, counting nested columns and properties, with a warning at 75% and publishing blocked at 100%.
- **Install modes** [Fact 01, 05]:
  - **Production:** centrally managed, auto-upgrade off by default.
  - **Singleton:** one installation per tenant model.
  - **Bootstrap:** a starting copy the tenant may modify, never upgraded.
- **Install flow** [Fact 05]: review the dependency graph → map inputs (bulk set, placeholders) → review outputs → validate → install. Options are an installation suffix (DEV/TEST/PROD) and a name prefix on types and actions. Recalled versions cannot be installed.
- **Product groups** [Fact 01]: validate version sets for missing inputs, duplicate outputs and dependency cycles. Linked products' outputs fill downstream inputs.
- **Versions and dependencies** [Fact 05]: each pack declares dependency ranges (`minimum`, `maximum`, `recommended`) with a checked-in lock file, and non-overlapping ranges fail the build (sls-packaging). An upgrade that would break a dependent is blocked (Apollo).
- **Release channels** [Fact 05]: `DEV` → `RELEASE_CANDIDATE` → `RELEASE`, promoted automatically, manually or by pipeline. Each installation subscribes to a channel and has an upgrade window.
- **Upgrade plan per installation** [Fact 05 for the constraints; applying them to tenant content is 05's Inference]:
  1. Check constraints: maintenance window, dependency ranges, suppression window.
  2. Apply the upgrade as a **proposal** on the tenant (section 20) that includes the schema migrations for edited types (section 4).
  3. On failure, auto-suppress that installation and roll back.
  4. Recall a release when it fails on canary tenants, and roll every installation off it.
  - Re-plan when a dependency changes, a new release appears, a recall happens, or a plan has been blocked for more than 4 h [Fact 05].
- **Format** [Inference]: a pack is a directory in the one repository, written in TypeScript IR (compare Palantir's SuperRepo, a TypeScript monorepo of ontology-as-code, functions and a React app compiled to a signed Marketplace product, beta 4 Aug 2026 [Fact 01]). CI builds it into a signed, versioned artifact.
- **Local changes** [Inference]: Production installs allow tenant changes only in declared extension points (extra properties, extra rules). Changes elsewhere convert the install to Bootstrap after a warning.

**Copies.**
- Document 01, §16 "Marketplace / DevOps": dependency inference, inputs, presets, install modes, 15,000 cap, product groups, SuperRepo. https://www.palantir.com/docs/foundry/foundry-devops/create-products/ , https://www.palantir.com/docs/foundry/announcements/2026-09 , https://www.palantir.com/docs/foundry/announcements/2026-08
- Document 05, A16: install flow, suffix and prefix, release channel per install, recalled versions. https://palantir.com/docs/foundry/marketplace/install-product/ , https://palantir.com/docs/foundry/devops/core-concepts/
- Document 05, B1: Apollo plans, constraints, suppression, rollback, recall, channels, timeouts. https://www.palantir.com/docs/apollo/core/plans-and-constraints , https://palantir.com/docs/apollo/core/release-channels/
- Document 05, B3: sls-packaging dependency manifest and lock file. https://github.com/palantir/sls-packaging

**Left out, and why.**
- Apollo hub and spoke, remote hubs and air-gap bundles: the product is one multi-tenant SaaS [05].
- Static data in packs: version 2.
- Remote stores: version 2.

**Open questions.**
- Upgrade Assistant mechanics [Unverified 05].
- How do mapped inputs survive a customer switching ERP? [Inference needed]

---

## Function checklist
"v1" = version 1, "v2" = version 2, "never" = never for this product. P = Palantir, with the product named where useful.

| Function | Who offers it | v1 / v2 / never | Reason |
|---|---|---|---|
| SAML/OIDC login with stable user ID and group sync | P Foundry (Multipass) | v1 | Tenant identity is the base of every check (04 §1) |
| SCIM provisioning | P Foundry | v2 | Login-time sync is enough at first |
| Organization per tenant (B2B option A) | P Foundry | v1 | Structural tenant wall (05 B4) |
| Guest memberships, multiple organizations | P Foundry | never | One company per tenant |
| Four project roles, project-level grants | P Foundry | v1 | 04 §3 |
| Custom role sets and operations | P Foundry | v2 | Defaults cover early tenants |
| Group membership expiry | P Foundry | v2 | Useful for contractors, not urgent |
| Source connections with encrypted credentials | P Data Connection | v1 | ERP ingest |
| On-premises agent as tunnel | P Data Connection | v2 | Only for unreachable ERPs |
| Batch SNAPSHOT/APPEND syncs, transactional | P Data Connection | v1 | 01 §2 |
| CDC syncs (Debezium) | P Data Connection | v2 (Postgres only) | Operationally heavy (01) |
| Streaming syncs and Flink | P Foundry | never | Cost; minute latency suffices |
| Iceberg tables and REST catalog | P Foundry | never (v1) / revisit | Stack is Postgres |
| Virtual tables over warehouses | P Foundry | v2 | Warehouse customers later |
| Dataset transaction log and views | P Foundry | v1 | Audit, incremental detection |
| Changelog current-state rule | P Foundry | v1 | One rule everywhere; honour ordering |
| Deduplicating union views | P Foundry | v2 | Not needed with one source per type |
| Declared jobs, build resolver, staleness skip | P Foundry | v1 | Cost and correctness (01 §13) |
| Incremental transforms with fallback rules | P Foundry | v1 | 01 §12 |
| Schedules with triggers and target modes | P Foundry | v1 | 01 §13 |
| Build-time expectations and health checks | P Data Health | v1 | Trust in numbers |
| Monitoring views with severities | P Foundry | v1 | Alerts on syncs, actions, agents |
| Data lineage graph | P Data Lineage | v2 | Record lineage in v1, UI later |
| Time Travel / Compare diff | P Foundry | v2 | Explaining changed numbers |
| Media sets (PDF, email) | P Foundry | v2 | Remittance and invoice PDFs |
| Object types, properties, links, interfaces as IR | P Ontology | v1 | Core asset |
| Value types with constraints | P Ontology | v1 | Enforce enums and codes |
| Derived properties | P Ontology | v1 | Customer totals |
| Multi-datasource objects | P Ontology | never | Property policies cover column security |
| Shared properties | P Ontology | v2 | Convenience |
| Vector properties and KNN | P Ontology | v1 (limited) | Dispute and email text |
| Edits overlay, two merge strategies | P Ontology | v1 | Collection facts on top of ERP |
| Edit history per object | P Ontology | v1 | Audit for collectors |
| Schema migrations for edits | P Ontology | v1 | Template upgrades need them |
| Object-set query algebra | P OSS/OSDK | v1 | Only read API |
| Aggregations with accuracy flag | P OSS | v1 (exact default) | Money must be exact |
| WebSocket subscriptions | P OSDK | v2 | Live inbox later |
| Ontology SQL for agents | P Ontology MCP | never (agents) / v2 analysts | Keeps agents off raw tables |
| Query functions with API names | P Functions | v1 | Metrics |
| Edit functions and function-backed actions | P Functions | v1 | Complex actions |
| Staged writes | P Functions/Logic (beta) | v1 | Agent proposals |
| Python and TS v1 runtimes | P Functions | never | One runtime |
| Action types with parameters, rules, criteria | P Ontology | v1 | Only write path |
| Validate-only dry run | P Ontology API | v1 | Agents validate first |
| Snapshot isolation and object conflicts | P Ontology | v1 | Concurrency safety |
| Automatic retries for non-external actions | P Ontology | v1 | 02 §7 |
| Writeback and side-effect webhooks | P Ontology | v1 (with outbox) | Customer messaging needs reliability |
| Notifications with recipient checks | P Ontology | v1 (internal only) | Staff alerts |
| Action log objects | P Ontology | v1 | Decision record |
| Action revert | P Ontology | v1 | Copy constraints |
| Read/write marking authorizations | P Ontology | v2 | Declassification control |
| Batched action execution | P Ontology | v1 | Bulk dunning |
| Proposals for staged agent actions | P Automate/Logic | v1 | Human review |
| Foundry Rules (rules and proposals) | P Foundry Rules | v1 | Governed rules |
| Metric definitions as governed objects | none documented | v1 | [Inference] the product's own need |
| Scenarios (copy-on-write) | P Workshop (Legacy), Ontology API | v1 | Dry runs and evals |
| Automate conditions and effects | P Automate | v1 | Proactive agents |
| Fallback effects, auto-pause | P Automate | v1 | Guard rails |
| Model gateway with provider-compatible APIs | P AIP | v1 | Claude and Qwen through one door |
| Three-level TPM/RPM limits, interactive reserve | P AIP | v1 | Fair sharing |
| Token metering with cache tokens | P AIP | v1 | Cost visibility |
| Model categories and bulk swap | P AIP | v1 | Model churn |
| Customer-owned model keys | P AIP (registered models) | v2 | Enterprise ask |
| PII-redaction proxy | P AIP | v2 | Not needed at first |
| Session-token markings gate for LLMs | P AIP | v1 | Per-model data rules |
| Scoped sessions | P Foundry | v1 (agents) | Customer-facing agents |
| Markings with propagation | P Foundry | v1 | Labels on derived artifacts |
| Object and property security policies | P Ontology | v1 | Row, column, cell |
| CBAC | P Foundry | never | Government |
| Restricted views | P Foundry | never | Superseded by object policies |
| Cipher field encryption | P Foundry | v2 (deterministic only) | Bank details |
| Sensitive Data Scanner | P Foundry | v2 | PII discovery |
| Check-access explainer and test-as-user | P Foundry | v1 | Admins and agents explain refusals |
| Checkpoints (justification prompts) | P Foundry | v2 | Exports |
| Approvals engine | P Foundry | v1 | Shared by proposals and access |
| Audit.3-style typed events and export API | P Foundry | v1 | Customer security teams |
| Lineage-aware deletion | P Data Lifetime | v2 | Privacy requests |
| Developer Console apps with restrictions | P Developer Console | v1 | Agent ceilings |
| OAuth code + PKCE, client credentials | P Foundry | v1 | Agent identity |
| Personal access tokens | P Foundry | v1 (dev only) | Not for production |
| Consumer MCP server per app | P Ontology MCP | v1 | External agents |
| Builder MCP server | P Palantir MCP | v1 (small) | Founder's builder agent |
| Tool search on demand | P Palantir MCP | v2 | Small tool sets first |
| Event-sourced agent sessions | P Agent SDK | v1 | Long-running collections work |
| Chatbot with retrieval contexts and citations | P Chatbot Studio | v1 (object and document) | Staff assistant |
| Deterministic tool bindings | P Chatbot Studio | v1 | Inbox integration |
| Pro-code agent templates (Claude Agent SDK) | P Agents | v2 | Founder builds the runtime first |
| Evals with evaluators, iterations, experiments | P AIP Evals | v1 | Gate changes |
| Validation drill (people vs agent) | P Ontology guidance | v1 | Onboarding |
| AI FDE, Evolve, Boardroom | P AIP | never / v2 for Evolve-style | Too broad |
| Skills as Markdown resources | P AIP | v2 | Useful later |
| Traces with prompts, tokens, source executor | P Observability | v1 | Debugging |
| Per-object agent timeline | P Observability | v1 | Collectors see who did what |
| Machinery state-transition log | P Machinery | v1 | SLA metrics on dunning stage |
| Global branching across all resources | P Foundry | never (definitions only in v1) | Scope |
| Template packs with inputs and install modes | P Marketplace/DevOps | v1 | Repeatable customer installs |
| Release channels, recalls, suppression | P Apollo | v1 (for packs) | Safe upgrades |
| Apollo hub/spoke, Rubix | P Apollo, Rubix | never | Use managed cloud |
| Workshop, Quiver, Contour, Vertex, Map, Slate | P apps | never (generated pages instead) | Too broad |
| Auto-generated object pages and search | P Object Views/Explorer | v1 | Cheap UI from metadata |
| Notepad-style reports linked to objects | P Notepad | v2 | Agent reports with value snapshots |
| Custom widget iframe protocol | P Workshop | v2 | Extension point |
| Conjure-style error envelope | P open source | v1 | Structured agent errors |
| Service chassis (liveness, readiness, redaction) | P open source | v1 | Basic operations |

---

## Contradictions and corrections

1. **Arrival order vs ordering column (document vs document guidance).** Palantir's Ontology indexes changelogs by arrival order and ignores the ordering column, and its own CDC page warns of stale values [Fact 01]. Document 01 recommends honouring the ordering column. This is a deliberate **departure from Palantir**, so the founder's rule "copy something documented" is met only by citing Palantir's documented warning, not a documented Palantir behaviour.
2. **Best-effort side effects vs customer messaging (stack and use case vs Palantir).** Palantir's side-effect webhooks are best-effort, unordered and hide failures, and notifications cannot go to raw email addresses [Fact 02]. External agents messaging customers need reliable, recorded, at-most-once delivery. The transactional outbox in section 8.11 is **[Inference], with no Palantir source**. It breaks the founder's rule and should be researched elsewhere (Gaps).
3. **Data layer storage: Iceberg and object storage vs Postgres.** Document 01's "What to copy" items 1–2 recommend Parquet or Iceberg files in object storage, with the log in Postgres. The stack decision is Postgres only. This map follows the stack. Document 02 agrees that Postgres with JSONB plus a search or vector index is enough at this scale [Inference 02].
4. **Row-level security in Postgres vs Palantir's policies.** Palantir compiles policies into queries in its own Object Set Service and nulls out failed properties [Fact 04]. Postgres RLS filters rows but cannot null out cells, so property policies need security-barrier views or an application layer [Inference]. RLS also does not cover what happens to data after it is read. This matches Palantir's stated limit [Fact 02, 04], but founders often assume RLS "secures the agent". It does not secure model output.
5. **Automate execution identity.** The Automate security page says effects run as the owner. The pro-code agent page says "as the triggering user or the automation's service user" [Fact 03, unresolved]. This map requires service-principal owners.
6. **Execution history retention: 7 days vs 30 days** on two Palantir observability pages [Fact 03, 05]. This map chooses 30.
7. **Batch action limits: 10,000 calls (docs) vs 20 per call (REST docstring)** [Fact 02]. This map chooses 1,000 per call.
8. **Branchability of TS v2/Python functions and the OSDK.** The LLM platform summary says they are not branchable, while announcements from October 2026 say Global Branching covers functions and the Developer Console [Fact 01, 05]. Treat the summary as stale.
9. **Built-in evaluator count: 20 (docs) vs 19 (April 2026 announcement)** [Fact 03]. Minor.
10. **Scenarios are "Legacy" at Palantir** [Fact 05], yet this map builds dry runs on them. The design copies the documented mechanics, but the replacement is unknown.
11. **Staged writes and Agent Builder are beta, and Agent SDK status is unknown** [Fact 03, Unverified]. Several core decisions (sections 8.9 and 16) copy features Palantir has not declared GA.
12. **Revert does not undo side effects** [Fact 02]. For collections, a sent dunning email cannot be reverted, so the founder's assumption that "agents can act because we can undo" is wrong for anything customer-facing. Confirm mode and staging are the real controls.
13. **Retries are off by default for actions with external calls** [Fact 02]. "Send dunning email" therefore gets no automatic retry under Palantir's rule, which is another reason for the outbox.
14. **Zero-retention guarantees are contractual** [Vendor claim 03, 04]. The product cannot promise Palantir-like provider terms for Claude or Qwen. It must state each provider's own terms.
15. **Markings gate the session, not the data** [Fact 03, 04]. A founder may assume the gateway inspects prompts for sensitive content. It does not, and Palantir deliberately does not.
16. **Palantir's numbers are built for its scale.** Tier TPMs, 2,000 properties, and "tens of billions" of objects [Vendor claim 02] should not be copied as targets. The limits above are scaled down and marked [Inference].
17. **Rules approval semantics are ambiguous.** Palantir lets the rule author approve [Fact 05], which may allow self-approval. This map adds a two-person rule for agent-authored proposals [Inference].
18. **The founder's "metric definitions" have no Palantir primitive** in these documents. Section 9 models them on Foundry Rules [Inference].

---

## Gaps

| Item | Source of gap | Importance |
|---|---|---|
| Foundry Rules logic grammar, schedule, alert conventions | 05 Open questions | High |
| Reliable external delivery (outbox) pattern: no Palantir source | 02 §7, this map | High |
| Automate retries, execution settings, permissions sub-pages | 03, 05 Open questions | High |
| Token minting, lifetime and identity for agent scoped permissions | 03, 04 Open questions | High |
| Staged writes / ontology transactions docs (02 read code only) | 02 Open questions | High |
| Scenarios: why Legacy, what replaces them | 05 Open questions | High |
| Whether submission criteria are re-checked server-side for API calls | 04 Open questions | Medium |
| Webhooks inside actions: transactional or not | 01 Open questions | Medium |
| Action log and edit-history retention | 02 Open questions | Medium |
| audit.3 full field list | 04 Open questions | Medium |
| Ontology MCP security page and SQL tool dialect | 02, 04 Open questions | Medium |
| Agent SDK GA status | 03 Open questions | Medium |
| Schedule trigger combinations AND/OR | 01 Open questions | Low |
| Chunk size, overlap, default embedding model | 03 Open questions | Low |
| Encryption internals, BYOK | 04 Open questions | Low (for build); Medium for sales |
| Action metrics and monitoring pages | 02 Open questions | Low |
| Upgrade Assistant | 05 Open questions | Low |
| Session lifetime and access-token TTL defaults | 04 Open questions | Medium |
| Column-level lineage | 01 Open questions | Low |
| Certifications currency (ISO certificate expired 2024) | 04 Open questions | Low |

**Research briefs for high items.**

- **Foundry Rules grammar.** Read the full Foundry Rules section, beyond the four pages in 05: https://www.palantir.com/docs/foundry/foundry-rules/rule-logic/ (all block sub-pages), https://www.palantir.com/docs/foundry/foundry-rules/core-concepts/ (workflow configuration editor), https://www.palantir.com/docs/foundry/foundry-rules/customize-foundry-rules-pipeline/ (generated `FoundryRulesTransform` code, which may reveal the JSON shape), and https://www.palantir.com/docs/foundry/foundry-rules/overview/ . Goal: the block parameter schema, the expression language, the default run schedule, how rule outputs become alert objects, and whether a proposal author may approve their own proposal.
- **Reliable external delivery.** No Palantir page covers it. Search other documents in this research set (agent companies, receivables competitors, integration companies: documents 12, 23, 24) for documented outbox, idempotency-key or delivery-receipt designs used to send customer messages. Also re-read https://www.palantir.com/docs/foundry/action-types/webhooks/ for any reconciliation guidance, and https://palantir.com/docs/foundry/data-connection/webhooks-reference/ for its retry and "external system not changed" status-code handling.
- **Automate retries and identity.** Read the Automate sub-pages that 03 and 05 could not open: retries, execution settings, per-object vs batch, and permissions, under https://www.palantir.com/docs/foundry/automate/ ; plus https://palantir.com/docs/foundry/automate/permissions/ in full, and https://www.palantir.com/docs/foundry/agents/publish-and-call/ again. Goal: retry counts and backoff, auto-pause thresholds, and settling the owner vs triggering-user conflict.
- **Agent token minting.** Read https://palantir.com/docs/foundry/agents/scoped-permissions/ in full, the Developer Console token pages under https://www.palantir.com/docs/foundry/developer-console/overview/ (long-lived scoped tokens), and the original blog post at blog.palantir.com "securing-agents-in-production-agentic-runtime-1" (04 read only an aggregator copy). Goal: token TTL, refresh, whether pro-code agents act as a user or a service user, and how memory is policy-checked.
- **Staged writes and ontology transactions.** Read https://www.palantir.com/docs/foundry/logic/staged-writes/ again together with the TypeScript v2 staged-writes page listed under https://www.palantir.com/docs/foundry/functions/overview/ , and the experimental transactions endpoint docs (`/v2/ontologies/{ontology}/transactions`). Goal: buffer limits, conflict behaviour at apply, GA timeline, and how proposals reference a staged transaction.
- **Scenarios successor.** Read the scenarios docs under the Ontology section (02 lists them as unread), the REST scenario reference behind `ontology_scenario.py` (find conflicts, rebase), and https://www.palantir.com/docs/foundry/workshop/scenarios-concepts/ for any deprecation notice. Goal: whether REST scenarios are the supported successor, their limits, and whether side effects are suppressed inside them.