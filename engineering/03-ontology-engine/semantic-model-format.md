# Semantic model format

**Layer:** [03-ontology-engine](README.md) · **What it is:** The file format a company model is written in: objects, keys, relationships, metrics, synonyms, mappings (Ossie, UModel, Palantir SDK metadata).

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Open-source implementations](#open-source-implementations) (1) · [Other companies and products](#other-companies-and-products) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (3) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Open-source implementations

### 7. Apache Ossie (formerly Open Semantic Interchange)

> Source: [open-source-references/apache-ossie.md](../../open-source-references/apache-ossie.md) (code study)

- Apache-2.0, Python SDK (Pydantic v2), last commit 2026-11-20, repository `open-semantic-interchange/OSI`. The README states the rename to "Apache Ossie (incubating)" and points to `apache/ossie-converters` for converters to and from dbt, GoodData, Polaris and Salesforce. [Fact] ([README](https://github.com/open-semantic-interchange/OSI/blob/HEAD/README.md))
- Core spec (`core-spec/spec.md`, 953 lines):
  - A model contains datasets (primary key, unique keys), relationships (from/to columns), fields (with an `is_time` role), and metrics.
  - Metrics are either dataset-scoped (unqualified field names, `source.column`, `AGG(source.measure)`) or model-scoped (`dataset.field`, `AGG(dataset.metric)`).
  - An expression has a portable `sql` in the `OSSIE_SQL_2026` dialect plus optional per-dialect variants.
  - `ai_context` is a string or `{instructions, synonyms, examples}`, and `nonportable_extensions` carries vendor attributes.
  - The version history gives 0.1.1 as released on 2025-12-11 and 0.3.0.dev0 as unreleased, with breaking changes and an explicit warning against production use.

  [Fact]
- Ontology spec (`ontology/ontology.md`, 764 lines): concept types `EntityType` and `ValueType`, extends, relationships with roles and multiplicities, identifying relationships, derivation expressions, global identifiers, annotations, and mapping documents (concept, object and link mappings to datasets). [Fact]
- Verdict: **copy the shape** of `ai_context` onto your objects and metrics, and plan an Ossie export later. Do not make it the internal model: it has no actions, rules or permissions, and the spec is still changing. [Inference]

## Other companies and products

### 5. Apache Ossie (formerly Open Semantic Interchange)

> Source: [general-references/11-context-layer-products.md § 5. Apache Ossie (formerly Open Semantic Interchange)](../../general-references/11-context-layer-products.md#5-apache-ossie-formerly-open-semantic-interchange)

**What it is.** An Apache-incubating JSON/YAML spec in which one document holds one semantic model, plus a separate ontology spec and a mapping spec. It is backed by 50+ organisations, including Snowflake, Databricks, dbt Labs, Salesforce, Oracle, Cube, AtScale, Atlan, RelationalAI and ThoughtSpot ([Fact](https://github.com/apache/ossie/blob/main/docs/index.md)). Snowflake leads it ([Vendor claim](https://www.businesswire.com/news/home/20260127372541/en/AtScale-Joins-the-Open-Semantic-Interchange-OSI-Bringing-over-a-Decade-of-Semantic-Layer-Expertise-to-support-Open-Standards)). Released version 0.1.1 (11 Dec 2025); 0.3.0.dev0 is in development and mutable ([Fact](https://github.com/apache/ossie/blob/main/core-spec/spec.md)).

**Core model fields** ([Fact](https://github.com/apache/ossie/blob/main/core-spec/spec.md)):
- Model: `version`, `name`, `description`, `ai_context`, `datasets`, `relationships`, `metrics` (model-scoped), `nonportable_extensions`.
- Dataset: `name`, `source`, `primary_key`, `unique_keys`, `description`, `ai_context`, `fields`, `metrics` (dataset-scoped).
- Relationship: `name`, `from` (the many side), `to` (the one side), `from_columns`, `to_columns` (these are field names, not physical columns), `ai_context`.
- Field: `name`, `expression` (`sql` in the portable `OSSIE_SQL_2026` dialect, plus optional per-dialect variants), `dimension.is_time`, `label`, `description`, `datatype` (String, Integer, Decimal, Float, Boolean, Date, Time, DateTime, DateTimeTz, Opaque), `ai_context`.
- Metric: `name`, `expression`, `description`, `datatype`, `ai_context`.
- `ai_context` is a string or an object with `instructions`, `synonyms` and `examples`.
- Strict name resolution. A dataset-scoped metric references its own fields, or `source.column`. A model-scoped metric must use `dataset.field` and may compose a dataset metric only through `AGG(dataset.metric)`, which preserves the guarantee that nothing is double-counted.
- Vendor state rides in `nonportable_extensions`, which consumers must preserve and core semantics must never depend on.

**Ontology spec** ([Fact](https://github.com/apache/ossie/blob/main/ontology/ontology.md)):
- Concepts are `EntityType` or `ValueType`. Built-in concepts: Any, Boolean, Date, DateTime, Decimal, Float, Integer, String.
- Concept fields: `concept`, `type`, `description`, `extends`, `derived_by`, `identify_by`, `requires`, `relationships`, `iri`, `annotations`.
- Relationships are declared under the concept that plays the first role. They can be unary or n-ary, with `roles` (concept plus optional role name), `multiplicity` (ManyToOne or OneToOne), `derived_by`, `requires`, and required `verbalizes` patterns such as "{Person} earns {Salary}". They are addressed with dot notation (`Person.earns`).
- *Mapping documents* reference exactly one ontology and one semantic model. `concept_mappings` contain `object_mappings` (a SQL expression or referent mappings through identifying relationships) and `link_mappings`.
- The SAP Business Partner example encodes SAP data-dictionary domains as value types with `requires` constraints (for example a length limit), and a customer role as a subtype defined by `derived_by` ([Fact](https://github.com/apache/ossie/blob/main/examples/sap_business_partner.ontology.yaml)).
- The roadmap cites Palantir and Goldman Sachs Legend as motivation for the ontology layer ([Fact](https://github.com/apache/ossie/blob/main/ROADMAP.md)).

[Inference] The verbalization-plus-roles style is Object-Role Modeling. RelationalAI, a listed member, is the likely source of this design, but I did not verify authorship.

**Copy:** use Ossie as the import/export format, and separate ontology, semantic model and mapping. **Avoid:** depending on 0.3.0.dev0 field names in production; the spec itself warns against it.

## Design decisions already in the reference maps

### 1. Common semantic-model schema (objects, keys, relationships, metrics, synonyms, verified queries, instructions)

> Source: [general-references/33-map-context-code-integration.md § 1. Common semantic-model schema (objects, keys, relationships, metrics, synonyms, verified queries, instructions)](../../general-references/33-map-context-code-integration.md#1-common-semantic-model-schema-objects-keys-relationships-metrics-synonyms-verified-queries-instructions)

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

> Source: [general-references/33-map-context-code-integration.md § 2. Exact file format: Ossie ontology, semantic model and mapping split](../../general-references/33-map-context-code-integration.md#2-exact-file-format-ossie-ontology-semantic-model-and-mapping-split)

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

### 12. Public Palantir SDK metadata format (action IR, conditions, ObjectSet, validate/apply)

> Source: [general-references/33-map-context-code-integration.md § 12. Public Palantir SDK metadata format (action IR, conditions, ObjectSet, validate/apply)](../../general-references/33-map-context-code-integration.md#12-public-palantir-sdk-metadata-format-action-ir-conditions-objectset-validateapply)

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

## Earlier engineering notes (Phase 2)

### 7. Proposed schema artefacts and lifecycle

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

The platform model should be a versioned, validated definition bundle with separate runtime data:

- `ObjectTypeDefinition`: API name, version, properties, primary-key contract, title key, source mappings, provenance, access labels, lifecycle status.
- `RelationshipDefinition`: API name, endpoints, direction, storage strategy, intended cardinality, enforced constraints, metadata strategy, lifecycle status.
- `InterfaceDefinition`: properties, required/optional flags, link/action capability constraints, implementing-type mappings, searchable flag.
- `PropertyDefinition`: data type, nullability, unit, source ownership, editability, validation, classification, indexing/search hints, deprecation and migration metadata.
- `ModelBinding`: mapping from source schema/column to a property, identity key, transformation and source version.
- `RuntimeObject` and `RuntimeRelationship`: stable IDs, tenant/resource scope, values, source/version references, timestamps and optimistic version.
- `ModelRelease`: validated model bundle, compatibility report, migration plan, approvals and rollback pointer.

Schema publication flow:
1. Draft and validate definitions.
2. Resolve property/link/interface references.
3. Check uniqueness/cardinality constraints and source key mappings.
4. Produce a compatibility report against the last published version.
5. Require migration steps for breaking changes (primary key, type narrowing, required property, endpoint or cardinality changes).
6. Publish immutable model version.
7. Apply backfills/projections in a controlled build.
8. Monitor old/new reads and preserve rollback until consumers migrate.
9. Deprecate before removal; never silently reinterpret historical facts.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No research literature material in the research yet.
