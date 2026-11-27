# Object type registry

**Layer:** [03-ontology-engine](README.md) · **What it is:** The schema of the company model: object types, properties, identity, link types, interfaces, and how they are validated.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (6) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (3) · [Open-source implementations](#open-source-implementations) (7) · [Other companies and products](#other-companies-and-products) (1) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (10)

## Palantir

### 1. How Palantir frames the Ontology (data, logic, action, security; semantic vs kinetic)

> Source: [general-references/02-palantir-ontology.md § 1. How Palantir frames the Ontology (data, logic, action, security; semantic vs kinetic)](../../general-references/02-palantir-ontology.md#1-how-palantir-frames-the-ontology-data-logic-action-security-semantic-vs-kinetic)

Plain English: the Ontology is a map of the business written in business words (customers, orders, aircraft), connected to the real data, with the allowed ways of changing things attached. Example: "Flight" is linked to "Aircraft"; a "Reassign aircraft" action changes the link and notifies the controller.

Technical detail:
- Palantir splits the Ontology into **semantic** elements (objects, properties, links: what things are) and **kinetic** elements (action types, functions, and dynamic security: how things change), plus **interfaces** for polymorphism. [Fact] https://www.palantir.com/docs/foundry/ontology/overview/
- The "Why create an Ontology?" page argues the model should capture **decisions**, not just data, and breaks a decision into four parts: data (including "decision data": context, options considered, effects), logic (rules, forecasts, optimisers, LLM functions, bound through one interface), action ("verbs" to data's "nouns", stageable as scenarios, written back to source systems), and security (marking, purpose and role policies computed per interaction; agent tool use tied to access to the underlying objects). [Vendor claim] https://palantir.com/docs/foundry/ontology/why-ontology/
- The Architecture Center describes three layers: a **Language** (definitions of objects, links, actions, automations, logic), an **Engine** (read path: high-scale queries, real-time subscriptions, materializations; write path: atomic transactional updates, batch mutations, streams, change data capture to operational systems), and a **Toolchain** (OSDK and DevOps tooling). It states the Ontology is not merely a semantic layer. [Vendor claim] https://palantir.com/docs/foundry/architecture-center/ontology-system/
- Core vocabulary: object type (schema), object (instance), object set (collection); property and property value; shared property; link type and link; action type and action; roles; functions; interfaces; object views. [Fact] https://www.palantir.com/docs/foundry/ontology/core-concepts/
- Type system: "Ontology types" model the domain; "data types" are modelled on RDF, OWL and XSD datatype concepts. Field types and base types are fixed; users can create value types. [Fact] https://www.palantir.com/docs/foundry/object-link-types/type-reference/

[Inference] For the founder, the useful framing is: semantic layer (types) + governed write layer (actions) + logic layer (functions) + security evaluated on every call, with every write producing a decision record. The "decision data" idea maps directly onto the action log (section 10).

### 2. Object types

> Source: [general-references/02-palantir-ontology.md § 2. Object types](../../general-references/02-palantir-ontology.md#2-object-types)

Plain English: an object type is a table definition in business terms. "Employee" with properties name, start date, manager. Each row of the backing data becomes one object, identified by its primary key.

Technical detail:
- **Backing datasources.** An object type maps columns of a datasource to properties. Analogy given by Palantir: object type ≈ dataset, object ≈ row, object set ≈ filtered rows. An object type can have no datasource if all objects are created by actions. [Fact] https://www.palantir.com/docs/foundry/object-link-types/object-types-overview/
- A datasource can back only one object type (error `Phonograph2:DatasetAndBranchAlreadyRegistered`). Backing datasets cannot contain `MapType` or `StructType` columns in the create wizard (struct properties are added from struct columns separately). Without a datasource you must save the type in a project, configure an object security policy, still define a primary key, and populate everything through actions; an empty dataset is created to carry permissions. [Fact] https://www.palantir.com/docs/foundry/object-link-types/create-object-type/
- The ontology-as-code package lists the datasource kinds a type can use: `dataset`, `stream`, `restrictedView`, `derived` (link-based derived properties), and `direct`. [Fact] `osdk-ts/packages/maker/src/api/object/ObjectTypeDatasourceDefinition.ts`. The internal OMS types list more, including time series, media, media set view, geotime series, table (Iceberg-style), restricted stream and `editsOnly`. [Fact] `osdk-ts/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts`
- **Primary key.** Must be unique per row and deterministic (derived from columns, never row numbers or random values), because edits and links attach to primary key values; changing the key prompts you to delete edits. Duplicates fail the OSv2 index build; on OSv1 they silently corrupted state. [Fact] https://www.palantir.com/docs/foundry/object-link-types/create-object-type/ . Valid key types: String, Integer, Short; Date, Timestamp, Boolean, Byte, Long are "discouraged" (format collisions, Boolean allows only two objects, Long loses JavaScript precision above 1e15); floats, decimals, arrays, structs, vectors, geo, media, attachments, markings, cipher are invalid. [Fact] https://www.palantir.com/docs/foundry/object-link-types/properties-overview/
- **Title key.** The display name property; need not be unique. [Fact] https://www.palantir.com/docs/foundry/object-link-types/create-object-type/
- **Naming rules.** Object type API name: PascalCase, alphanumeric, unique, 1-100 characters. Property API name: camelCase, unique within the type, 1-100 characters. Reserved words include `ontology`, `object`, `property`, `link`, `relation`, `rid`, `primaryKey`, `typeId`, `ontologyObject`. Object type ID: lowercase letters, numbers, dashes; changing it breaks applications. [Fact] same page.
- **Metadata fields.** ID, RID (platform-wide resource ID), icon (glyph and colour), display name, plural display name, description, groups (multi-valued labels), API name, visibility (`prominent`, `normal`, `hidden`), status, index status (`success`, `failed`, `not started`), writeback (dataset generated or not; editing enabled or not). [Fact] https://www.palantir.com/docs/foundry/object-link-types/object-type-metadata/ . The code-level definition adds `aliases`, `implementsInterfaces`, `editsEnabled`, `editsHistoryConfig`, `interfaceActionsEnabled`, `permission`. [Fact] `osdk-ts/packages/maker/src/api/object/ObjectTypeDefinition.ts`
- **Statuses** apply to object types, properties, link types, action types and interfaces: `experimental` (default), `active` (no major breaking changes; cannot be deleted; API name frozen), `deprecated` (requires a reason, a deletion deadline, optional replacement), `example`. Object types alone can be **promoted** (internally `endorsed`), applied only by Ontology Owners or via proposal, and it forces prominent visibility. Status propagates: an experimental object type forces its link types to be experimental; a link's status must not conflict with its foreign key property's status. [Fact] https://www.palantir.com/docs/foundry/object-link-types/metadata-statuses/ ; `ObjectTypeStatus_endorsed` in `__components.ts`.
- **Multi-datasource object types (MDOs).** One object type can join up to 70 datasources (datasets or restricted views, not streams) on the primary key, column-wise only (no row-wise union). Each property comes from exactly one datasource. A user who lacks access to one datasource sees its properties as `null`; rows missing from one datasource show `null` rather than being dropped. MDOs are the mechanism for column-level permissions in OSv2. Palantir notes that filtering on one type's properties is cheaper than traversing links, which is the trade-off against splitting into linked types. [Fact] https://www.palantir.com/docs/foundry/object-permissioning/multi-datasource-objects/

### 3. Properties and property types

> Source: [general-references/02-palantir-ontology.md § 3. Properties and property types](../../general-references/02-palantir-ontology.md#3-properties-and-property-types)

Plain English: a property is a column with meaning. "startDate" on Employee is a Date; "location" on Plant is a Geopoint; "embedding" on Document is a Vector used for semantic search.

Technical detail:
- **Base types** (complete list from the properties table): String, Integer, Short, Date, Timestamp, Boolean, Byte, Long, Float, Double, Decimal, Vector, Array, Struct, Media Reference, Time Series, Geotemporal Series, Attachment, Geopoint, Geoshape, Marking, Cipher. Arrays cannot contain nulls; nested arrays are not supported in OSv2; Geopoint is stored as a `lat,lon` string. [Fact] https://www.palantir.com/docs/foundry/object-link-types/properties-overview/ . All field types except Map and Binary are valid; all types can be arrays except Vector and Time series. [Fact] https://www.palantir.com/docs/foundry/object-link-types/base-types/
- **String options** in the code definition: `isLongText`, `supportsEfficientLeadingWildcard`, `supportsExactMatching`, `supportsFullTextRegex`, `supportsPhonetic`, `enableAsciiFolding`, `analyzerOverride`. Decimal defaults to precision 5, scale 2. [Fact] `osdk-ts/packages/maker/src/api/properties/PropertyTypeType.ts` . [Inference] Search behaviour is configured per property at index time, as in Elasticsearch mappings.
- **Vector.** Defined by `dimension` (at least 1), `supportsSearchWith` (one of `COSINE_SIMILARITY`, `DOT_PRODUCT`, `EUCLIDEAN_DISTANCE`), optional `embeddingModel` (text or multimodal), optional `quantization` (`NO_QUANTIZATION`, `BYTE`, `HALF_BYTE`, `BINARY`). [Fact] same file and `client.unstable/.../ontology-metadata/api/__components.ts`
- **Struct.** A single property with named typed fields, backed by one struct-typed column. No nesting; fields cannot be arrays, but a property can be an array of structs. Allowed field types: boolean, byte, date, decimal, double, float, geopoint, integer, long, short, string, timestamp. Indexed like Elasticsearch object fields, so conditions on an array-of-struct are evaluated per field independently (a query for first name A and last name B can match an object where two different elements each satisfy one condition). Not in OSv1. [Fact] https://www.palantir.com/docs/foundry/object-link-types/structs-overview/ . Structs can declare a "main value" (one or more fields) so the struct behaves like a simple value. [Fact] `PropertyTypeType.ts`; https://palantir.com/docs/foundry/ontology/ontology-structural-guidance/
- **Property reducers** (beta) collapse an array property to one display value (highest/lowest, latest/earliest, first/last, true-first/false-first; for struct arrays, by one field with chained tie-breakers). Queries still operate on the whole array; you cannot filter on the reduced value; reducers change instantly without reindexing; a reduced array can implement a non-array interface property. [Fact] https://www.palantir.com/docs/foundry/object-link-types/property-reducers/
- **Time series, geotemporal series, media reference, attachment.** These are references to data stored elsewhere (time series syncs, media sets, uploaded files), with dedicated API endpoints (for example `.../timeseries/{property}/firstPoint|lastPoint|streamPoints`, `.../media/{property}/content|metadata`, `.../attachments/{property}`). Media references need a media reference column and a configured media source. [Fact] https://www.palantir.com/docs/foundry/object-link-types/base-types/ ; endpoint paths from `foundry_sdk/v2/ontologies/*.py`
- **Cipher text** has encrypt and decrypt endpoints per property. [Fact] `foundry_sdk/v2/ontologies/cipher_text_property.py`
- **Edit-only properties** (OSv2 only) are not mapped to any column; values come only from edits; each must be "permissioned to" one of the type's backing datasets. You can later map them to a column. [Fact] https://www.palantir.com/docs/foundry/object-link-types/edit-only-properties/
- **Derived properties** (beta) are computed at query time from linked objects: follow up to three link hops, then aggregate with count, average, sum, min, max, approximate or exact cardinality, collect list or collect set (collect defaults to 10 values, max 100; filters and sorts see the full set, not just the returned values). A derived property cannot derive from another derived property. Not available on OSv1; restrictions apply to primary keys, required properties, value types and formatting. [Fact] https://www.palantir.com/docs/foundry/object-link-types/derived-properties/ . The code definition confirms the aggregation set and the 100 cap. [Fact] `ObjectTypeDatasourceDefinition.ts` . Derived properties cannot use internal indexes and may force in-memory or Spark execution even on small sets. [Fact] https://www.palantir.com/docs/foundry/ontologies/oss-limitations/ . Palantir's guidance: use them freely below roughly 10,000 objects per query, and above that consider documented denormalisation. [Fact] https://palantir.com/docs/foundry/ontology/ontology-structural-guidance/
- **Runtime derived properties.** Separately, any OSDK caller can add derived properties to an object set at query time with `withProperties`, for example a lead count computed by pivoting to a link and counting. [Fact] `osdk-ts/packages/api/src/objectSet/ObjectSet.ts`
- **Shared properties** are property definitions reused across object types: metadata is shared, data is not. Marked with a globe icon. [Fact] https://www.palantir.com/docs/foundry/object-link-types/shared-property-overview/
- **Value types** are semantic wrappers over a base type with optional constraints, scoped to a "space", permissioned and versioned, enforced in pipelines (Pipeline Builder) and the Ontology. Constraint kinds: enum (one-of, case-sensitive or not for strings), range (numeric, temporal, string length, array size), regex (optionally substring match), RID, UUID, uniqueness (array elements), nested (constraint applied per array element), element constraints (struct field → value type). Not available in the Default ontology. [Fact] https://www.palantir.com/docs/foundry/object-link-types/value-types-overview/ , https://www.palantir.com/docs/foundry/object-link-types/value-type-constraints/ . Exposed via `/v2/ontologies/{ontology}/valueTypes`. [Fact] `foundry_sdk/v2/ontologies/ontology_value_type.py`
- **Mandatory control properties** (OSv2): a property of type Mandatory Control, mapped to a marking column of a marking-backed restricted view, that secures the other properties in the same datasource row by row. Types: markings (user needs all), organizations (user needs at least one), both, or classifications (hierarchical; requires CBAC). Values must be non-null (empty array means no restriction), must fall within an allowed set declared on the datasource, and violations fail indexing or reject the action. Hidden by default. [Fact] https://www.palantir.com/docs/foundry/object-link-types/mandatory-control-properties/
- Other property sub-pages (value formatting, conditional formatting, render hints, type classes, required properties) were listed but not opened [Unverified].

### 4. Link types

> Source: [general-references/02-palantir-ontology.md § 4. Link types](../../general-references/02-palantir-ontology.md#4-link-types)

Plain English: a link type is a named relationship between two object types. "Flight → assignedAircraft → Aircraft". One definition is traversable in both directions.

Technical detail:
- Each link type has two sides, each with its own display name and API name; multiple link types may connect the same pair; links cannot cross ontologies. [Fact] https://www.palantir.com/docs/foundry/object-link-types/link-types-overview/
- **Three implementations:** (a) foreign key: a property on one side holds the other side's primary key, giving one-to-many or one-to-one, and one-to-one is "not enforced"; (b) join table: a datasource with one column per side's primary key and one row per link, giving many-to-many, required for editing many-to-many links; (c) object-backed: a third "backing" object type with a many-to-one link to each endpoint, used when the relationship has its own data (role, dates, allocation). Link API names: lowercase first letter, alphanumeric, unique per object type, 1-100 characters, NFKC-normalised. [Fact] https://www.palantir.com/docs/foundry/object-link-types/create-link-type/ . In code these are `OneToManyLinkTypeDefinition` (with `manyForeignKeyProperty`, `cardinality: OneToMany | OneToOne`), `ManyToManyLinkTypeDefinition`, and `IntermediaryLinkTypeDefinition` (with `intermediaryObjectType`). [Fact] `osdk-ts/packages/maker/src/api/links/LinkType.ts`
- **Editing links.** Many-to-many links are created and deleted with link rules; foreign-key links are changed by modifying the foreign key property. [Fact] https://www.palantir.com/docs/foundry/action-types/rules/
- **Guidance:** use direct links when the relationship carries no metadata, object-backed links when it does; do not create links that exist only because two datasets share a key. [Fact] https://palantir.com/docs/foundry/ontology/ontology-structural-guidance/
- Index and storage: join tables are indexed alongside objects and count towards ontology volume, growing linearly with link count. [Fact] https://palantir.com/docs/foundry/ontologies/volume-usage/
- Bulk link loading in the OSDK (`experimental_asyncIterLinks`) returns at most 100,000 links per page of source objects and may return stale keys. [Fact] `osdk-ts/packages/api/src/objectSet/ObjectSet.ts`

### 5. Interfaces

> Source: [general-references/02-palantir-ontology.md § 5. Interfaces](../../general-references/02-palantir-ontology.md#5-interfaces)

Plain English: an interface is a shared shape, like "Facility" with a location and a manager, that several object types (Airport, Warehouse) implement, so one app or agent can work across all of them.

Technical detail:
- An interface has interface properties (defined locally, which Palantir recommends, or via shared properties), link type constraints, action type constraints, and metadata. Object types can implement many interfaces; interfaces can extend many interfaces. Interfaces are abstract: no datasets, no direct instances. Permissioned through Ontology roles. Support: full in Ontology Manager, Marketplace, TypeScript v2 functions; partial in Actions, Object Set Service (aggregation and interface links in development), OSDK (TypeScript yes; Java and Python in development), Workshop; not in TypeScript v1 or Python functions. [Fact] https://www.palantir.com/docs/foundry/interfaces/interface-overview/ (the feature table on https://www.palantir.com/docs/foundry/functions/language-feature-support/ agrees that Python functions lack interface support).
- **Interface link types** declare a link to an interface or a concrete object type, with cardinality `ONE` or `MANY` and a required flag; implementers satisfy them with concrete link types. [Fact] https://www.palantir.com/docs/foundry/interfaces/interface-link-types-overview/
- **Interface action type constraints** (beta) declare a capability (for example "Close") with typed parameter constraints that every implementer must map to one of its own concrete action types. Save-time validation blocks unmapped required constraints, incompatible types, or one parameter mapped twice. Constraints do not define logic, criteria or side effects; the OSDK resolves the concrete action for an object type and calls it. [Fact] https://www.palantir.com/docs/foundry/interfaces/interface-action-type-constraints/
- Action rules exist for create, modify and delete objects of an interface and create or delete links on interface objects. [Fact] https://www.palantir.com/docs/foundry/action-types/rules/
- In queries, `narrowToType` casts an object set between an interface and implementing types; the REST `ObjectSet` union includes `interfaceBase`, `asType`, `asBaseObjectTypes` and `interfaceLinkSearchAround`. [Fact] `ObjectSet.ts`; `foundry_sdk/v2/ontologies/models.py`
- Subscription updates on an interface object set arrive as the underlying object types; clients remap properties using `implementsInterfaces2` metadata. [Fact] https://www.palantir.com/docs/foundry/ontology-sdk/websocket-subscriptions/

### 18. Modelling in practice: Palantir's guidance

> Source: [general-references/02-palantir-ontology.md § 18. Modelling in practice: Palantir's guidance](../../general-references/02-palantir-ontology.md#18-modelling-in-practice-palantirs-guidance)

- **Checklist:** model reality not systems; curate properties; collaborate across teams; one entity per type; actions for human or agent decisions, pipelines for automated transforms; interfaces for shared shape; document decisions; validate against real questions. **Principles in priority order:** domain-driven design; DRY with a "rule of three"; open for extension, closed for modification; composition over deep hierarchies (capability interfaces like `Schedulable`, `Inspectable`). Pragmatism: name trade-offs (for example denormalisation acceptable until about 10,000 objects), protect naming, semantics and security as hard-to-fix invariants. [Fact] https://palantir.com/docs/foundry/ontology/ontology-best-practices/
- **Anti-patterns:** system silos, kitchen sink (all columns), department silos, god object, golden hammer (one tool for everything), action sprawl (warning sign: more than 10 action types on one object type; design actions around business operations like "Transfer Employee"), time machine (versions as objects), misnomer (vague names). [Fact] https://www.palantir.com/docs/foundry/ontology/ontology-anti-patterns
- **Structural guidance:** store each fact once; pre-compute same-object values in pipelines, use derived properties for link-dependent values; group related fields into structs (including LLM outputs with confidence and reasoning); interfaces even if a workflow must be duplicated temporarily; object-backed links for relationship metadata; names readable by humans and agents; security in domain terms. [Fact] https://palantir.com/docs/foundry/ontology/ontology-structural-guidance/
- **Validation drills:** questions sourced from the organisation's operating rhythm, structured situation → contributing factors → impact; run by non-builders in general tools only; record correctness, time, hesitation, search terms, dead ends, manual exports; diagnose with a symptom table; then rerun with an AI agent without path hints and compare; keep the questions as a standing evaluation suite. [Fact] https://palantir.com/docs/foundry/ontology/ontology-design-validation/

## Lingyang, AgentOne and Alibaba

### 4. Ontology at Lingyang: what has actually been said

> Source: [general-references/07-lingyang-agentone.md § 4. Ontology at Lingyang: what has actually been said](../../general-references/07-lingyang-agentone.md#4-ontology-at-lingyang-what-has-actually-been-said)

Plain English: an ontology here means a model of the company's things (customer, order, store), how they relate, the rules about them and the actions allowed on them. Lingyang talks about it but has not published its design.

- Sep 2025, VP 王赛: AI's biggest bottleneck is understanding enterprise data, and the semantic model is the key. Cited Palantir's ontology of static "nouns" and dynamic "verbs" in a digital-twin semantic model. Dataphin assigns business meaning to assets and builds an AI-readable semantic layer through standards mapping (落标) and auto-completion. He also argued for modelling for AI rather than humans: simpler physical models and "逆宽表化", converting wide tables into long tables to reduce token load and help pattern learning [Press, https://datayuan.substack.com/p/ai-agent-5b0].
- Sep 2025, press: Leiphone framed Lingyang explicitly as Alibaba's answer to Palantir's Ontology plus FDE model [Press, https://www.leiphone.com/category/digitalindustry/CIVlQ0TuWa4IBiXC.html].
- Sep 2026, official: "数据语义与本体建模" organises enterprise data and business knowledge into AI-usable assets, so AI employees work to company-specific 口径. This is attributed to "over a decade of data middle-platform practice" [Press, https://www.sohu.com/a/1080187818_115035].
- Nov 2026: Malaysia session title "Decisions to Action with Ontology & FDE" [Fact, agenda].
- Dataphin's concept-modelling docs are the only Lingyang product documentation with an explicit entity-relationship layer. Subject domains form a multi-level tree. Entities are business objects (people, goods, places) and business activities (for example "sales"). Relationship types are association, inheritance, hierarchy, sequence, flow and containment, drawn as an entity-relationship diagram. Logical tables are then created from the entities [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/the-data-architecture/]. [Inference] This is a lightweight ontology with objects and relations but no actions, and it is probably the base for whatever "ontology" AgentOne uses.
- Related Alibaba Cloud work, not Lingyang: a PolarDB-PG article (6 May 2026) describes an embedded ontology engine modelling objects, relations and actions, with "OAG" (ontology-augmented generation) for supply-chain, operations and marketing decisions. Only the abstract was readable [Fact, https://developer.aliyun.com/article/1732640].
- Not public: an ontology schema, the action definition format, rule versioning, the citation format ("source table + rule version + owner"), the four action grades. All are [Unverified] from public sources.

### 7. UModel / UnifiedModel (Alibaba Cloud Observability): the ontology method

> Source: [general-references/08-alibaba-stack.md § 7. UModel / UnifiedModel (Alibaba Cloud Observability): the ontology method](../../general-references/08-alibaba-stack.md#7-umodel--unifiedmodel-alibaba-cloud-observability-the-ontology-method)

**Plain English.** UModel describes a system as typed objects (services, hosts, pods, deployments), links between them, and pointers from each object to where its data lives (a Prometheus metric, a log store). An agent asks the model "what is `payment-gateway`, what does it call, and how do I get its p99 latency?" The model answers with the *query to run*. The agent never guesses metric names or labels.

**Primitives** ([basic concepts](https://www.alibabacloud.com/help/en/cms/cloudmonitor-2-0/basic-modeling-concepts); repo `schemas/core/`). [Fact]
- Sets: `entity_set`, `metric_set`, `log_set`, `trace_set`, `event_set`, `profile_set`, `runbook_set`, `entity_source`, `explorer`.
- Links: `entity_set_link`, `data_link`, `storage_link`, `runbook_link`, `explorer_link`, `entity_source_link`.
- Storage kinds: Prometheus, Aliyun Prometheus, VictoriaMetrics, Elasticsearch, ClickHouse, MySQL, SLS logstore / metricstore / entitystore, external.
- EntitySet fields include `primary_key_fields`, `first_observed_time_field`, `last_observed_time_field`, `keep_alive_seconds`, `dynamic`, `fields` (with `type`, `unit`, `filterable`, `analysable`, `value_mapping`), `name_fields`, `tag_fields` and `id_generator`.
- Links carry `src` and `dest` as `{domain, kind, name}`.

**Modelling method** ([blog 603058, 23 Apr 2026](https://www.alibabacloud.com/blog/603058); [principles](https://help.aliyun.com/en/cms/cloudmonitor-2-0/umodel-modeling-principles)). [Fact]
1. Divide domains with clear owners (e.g. `apm`, `infra`, `acs`), created only after team review.
2. Define entity sets and relations, generic rather than over-specialized. Prefer `service` with a `service_type` field over `spring_boot_web_service`.
3. Make rules explicit from interviews and past incidents.
4. Map telemetry through DataLinks without copying data ("storage decoupling").
5. Apply to alerting and RCA, then iterate.

Rules from the principles page:
- Naming: `{domain}.{name}` for entity sets, `{domain}.{metric|trace|log|event|profile}.{name}` for datasets, `{src}_{linktype}_{dest}` for links. Field names match `[a-z][a-z0-9_]*`.
- Standard relation types: `calls`, `hosts`, `contains` (one-way), `same_as`, `related_to` (two-way). The page also writes `is_same` once. Relation direction must be consistent system-wide.
- Each entity type has one authoritative source. Cross-domain links are computed by matching fields such as IP or hostname, e.g. by scheduled SQL. Avoid Cartesian products.
- Quantity caps: ≤10,000 instances per entity type and ≤100,000 records per instance.
- Every display name and description must be bilingual (en_us and zh_cn). Exemptions use `@exempt` with a stated reason and periodic review.

**Runtime and agent access** ([blog 603674, 26 Oct 2026](https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674); repo). [Fact]
- Definition layer versus individual layer, which the blog equates with TBox and ABox.
- Query surfaces in SPL: `.umodel`, `.entity`, `.entity_set` (methods such as `get_metrics` and `get_logs`, plus `__list_method__` for progressive discovery), `.topo`, `.runbook_set`.
- The plan JSON v1 envelope has `mode`, `version`, `operation`, `next_action: execute_query`, `data_source`, `query` and `time_range`. The open-source server is plan-only: `mode=data` returns `NOT_IMPLEMENTED` with migration hints (CHANGELOG 0.2.0, 0.4.0).
- GraphStore providers: memory, file.memory, local.ladybug.
- Interfaces: `umctl` CLI, REST and MCP on :8080, web UI on :5173.
- Onboarding: `umctl umodel validate|import --file model-pack.yaml`, then `umctl entity write` and `umctl topo write` from CMDB, Kubernetes, OpenTelemetry and similar sources.

**RCA method** (`skills/umodel-rca/SKILL.md`). [Fact]
1. Orient: find the symptomatic entity and read its runbook metadata.
2. Characterize with telemetry, not with alert text.
3. Form competing hypotheses: deploys, config changes (retry, timeout, circuit breaker), upstream traffic, downstream saturation, runtime capacity.
4. Gather cross-domain evidence both upstream and downstream.
5. Cite every conclusion.

A recent change counts as suspicious only with a plausible mechanism, a topological path and correctly timed telemetry. The worked example rules out a recent deploy that only changed the log format. It then derives 4000 QPS × 3.5 promotion × 2.5 retry amplification = 35,000 QPS (8.75× capacity) ([blog 603674](https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674)).

**Actions.** The RunbookSet schema includes `actions`, `action_type`, `risk_level`, `confirmation_required`, `allowed_tools`, `inputs`/`outputs`, `observations`, `conclusions`, `knowledge`, `toolkits` and `skills` (`expanded_schemas/runbook_set.expanded.yaml`; RunbookSet is marked `release_stage: experimental`). [Fact]

**Results.** On DataAgentBench, the vendor reports +10–20 percentage points for four flagship models with the semantic layer, and GLM-5.2 at 50.2% pass@1. [Vendor claim] [blog 603674](https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674). The June 2026 ontology blog gives no measured numbers. [Fact] [blog 603207](https://www.alibabacloud.com/blog/ontology-is-trending-again--can-it-improve-my-ai-agents-performance_603207)

**Open-sourcing and standards.** Announced 20 May 2026 alongside a "Universal Semantic Standard" initiative with Chanjet, XPeng, JLCPCB, CAICT and others. [Vendor claim] [blog 603289](https://alibabacloud.com/blog/enabling-boundless-intelligent-collaboration-umodel-now-open-source-launching-the-universal-semantics-standard-initiative_603289)

### 4. The ontology module

> Source: [general-references/28-winnexo.md § 4. The ontology module](../../general-references/28-winnexo.md#4-the-ontology-module)

- An ontology space has four functions: Ontology Model, Data Mapping, Ontology Optimization, and Validate and Publish. The stated order of work is to define business meaning first, associate data second, then validate and publish ([Fact](https://robject.lydaas.com/help/en/admin/ontology/)).
- Seven definition types: object types, relationships, business processes, logic, rules, metrics and analysis views. Analysis views provide reusable dimensions and measures. There is a graph view and a list view ([Fact](https://robject.lydaas.com/help/en/admin/ontology/model/)).
- Two construction methods: AI-assisted (from business materials or data tables, producing candidate definitions that a person reviews and adopts) and manual ([Fact](https://robject.lydaas.com/help/en/admin/ontology/create/)).
- Editing: a form per element with a "View YAML" switch, or "Manual Construction Mode" for the whole model in form or YAML mode. There is one shared "Draft Pending Publication" per ontology. The page states that saving a model does not mean its data is ready to query ([Fact](https://robject.lydaas.com/help/en/admin/ontology/model/edit-yaml)).
- Cross-table attributes: an object attribute can come from another physical table by selecting the table, the value field and a join key that matches the object's `_id`. Link attributes attach files from object storage or from a knowledge base selected by tags with AND or OR matching ([Fact](https://robject.lydaas.com/help/en/admin/ontology/model/edit-yaml)).
- Not published on the pages read: the YAML schema itself. The page refers to "Examples and Specifications" inside the product.

## Open-source implementations

### Architecture reconstructed

> Source: [open-source-references/alibaba-umodel.md](../../open-source-references/alibaba-umodel.md) (repository audit)

UModel's public README and docs describe a local service around a workspace-scoped object graph. A model pack establishes EntitySets, datasets, links, storage references and relation semantics. EntityStore writes runtime entities and topology relations. Query Service exposes three aligned query surfaces—`.umodel`, `.entity` and `.topo`. AgentGateway and MCP expose discovery/resources/tools. REST, CLI, web UI and SDK share public contracts. GraphStore adapters isolate runtime persistence from higher layers.

Relevant code/docs:

- [`internal/query/service.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/query/service.go)
- [`internal/agentgateway/service.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/agentgateway/service.go)
- [`internal/entitystore/service.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/entitystore/service.go)
- [`internal/umodel/schemaspec/validator.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/umodel/schemaspec/validator.go)
- [`internal/agentgateway/service_test.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/agentgateway/service_test.go)
- [`internal/entitystore/service_test.go`](https://github.com/alibaba/UnifiedModel/blob/main/internal/entitystore/service_test.go)
- [`docs/en/guides/agent-integration.md`](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/guides/agent-integration.md)
- [`docs/en/concepts/object-graph-semantic-layer.md`](https://github.com/alibaba/UnifiedModel/blob/main/docs/en/concepts/object-graph-semantic-layer.md)

### Trace D — model validation

> Source: [open-source-references/alibaba-umodel.md](../../open-source-references/alibaba-umodel.md) (repository audit)

The model schema registry loads schema definitions, and the validator checks the model envelope and important structural requirements. There is a TODO in the validation path for fuller field-level schema validation. This is a reminder to distinguish JSON/YAML shape validation from semantic integrity validation (references exist, keys unique, cardinality valid, source bindings compatible, dependency cycles controlled).

### TypeDB — typed semantic schema and query execution

> Source: [open-source-references/typedb.md](../../open-source-references/typedb.md) (repository audit)

#### Relevant code

- [Schema define execution](https://github.com/typedb/typedb/blob/master/query/define.rs)
- [Query analysis and type annotations](https://github.com/typedb/typedb/blob/master/query/analyse.rs)
- [Define integration test](https://github.com/typedb/typedb/blob/master/query/tests/define.rs)
- [Storage isolation manager](https://github.com/typedb/typedb/blob/master/storage/isolation_manager.rs)
- [Storage durability client](https://github.com/typedb/typedb/blob/master/storage/durability_client.rs)

#### Trace A — schema declarations are processed in typed phases

`query/define.rs` executes a parsed `Define` against a writable storage snapshot. It processes struct definitions, type definitions and function definitions. Type definitions are handled in ordered phases: type declarations; aliases; value types; annotations; subtyping; relation `relates` declarations and specialization; ownership (`owns`) declarations and specialization; and role-playing (`plays`) declarations. Undefined referenced labels are resolved and produce symbol-resolution errors if absent. This is a typed semantic schema compiler, not arbitrary JSON-schema storage.

The integration test parses TypeQL `define` statements, converts them to a schema query, executes against a writable snapshot and commits it. This is test source evidence of the intended schema write path, not a test run in this research session.

#### Trace B — query analysis builds typed annotations

`query/analyse.rs` creates `AnalysedQuery` and builds `QueryStructureAnnotations` using a readable snapshot, `TypeManager`, variable registry, parameter registry and parsed pipeline structure. It derives variable types and fetch annotations from owner types and owned attribute types. This shows how query validation and result shape depend on ontology/schema, before storage operators execute.

#### Trace C — snapshot concurrency and durability are explicit storage concerns

`storage/isolation_manager.rs` tracks read and write snapshots against sequence-number timeline windows and tracks concurrent windows/commit records. It integrates commit records and write batches with a durability client. The code includes TODOs around atomic ordering and future WAL retrieval for evicted commit records; do not interpret this as a missing durability feature overall, but note that the inspected source explicitly manages isolation and durability rather than delegating everything to a generic graph engine.

### TypeDB vs a generic property graph

> Source: [open-source-references/typedb.md](../../open-source-references/typedb.md) (repository audit)

TypeDB's defining strength is the schema/query/type system: entity, relation and attribute types, role/ownership constraints, subtype relationships, typed query analysis and transactional snapshots. A property graph DB can store many of these concepts, but the application must implement more semantic constraints and type checking itself. Conversely, TypeDB's type/query model may impose a different learning curve and data-modelling workflow than a simpler operational object model.

### Implication for our design

> Source: [open-source-references/typedb.md](../../open-source-references/typedb.md) (repository audit)

- Evaluate whether we need a full semantic DB/type system or whether PostgreSQL plus explicit ontology metadata and constrained queries are enough for our first product.
- Regardless of backing store, implement semantic validation before physical query generation.
- Use explicit schema migration/change control and transaction boundaries.
- Treat OPA as policy decision machinery and add PEP coverage at every service and index—not as a database that automatically secures all data.

### 1. Separate definitions from instances

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#1-separate-definitions-from-instances)

UModel separates model packs from entity/relation instances. OpenFoundry has a separate ontology-definition service from its object database. Palantir documents ontology resources separately from object/link data. This is a recurring structural boundary, not a coincidence.

**Design implication:** our type registry should version and publish ontology definitions separately from object-instance mutations. A schema change must define how existing instances migrate or remain compatible.

### 12. Typed schema is more than field metadata

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#12-typed-schema-is-more-than-field-metadata)

TypeDB `define` processing handles inheritance/subtyping, relation roles, owns/plays constraints, aliases, value types and annotations in explicit phases, then query analysis resolves variables and fetch annotations against a readable schema snapshot. This is deeper than a table of object-type names and JSON properties.

**Design implication:** decide whether the first ontology release needs strict relation/ownership/cardinality/type checking, interfaces, property constraints and typed query analysis. If these are postponed, document the compatibility and validation gap rather than implying full semantic constraints.

## Other companies and products

### 1. Microsoft Fabric IQ: Ontology item

> Source: [general-references/11-context-layer-products.md § 1. Microsoft Fabric IQ: Ontology item](../../general-references/11-context-layer-products.md#1-microsoft-fabric-iq-ontology-item)

**Plain English.** A Fabric "ontology" is a list of business things (Customer, Order, Machine), what each thing has (properties), how they connect (Customer *places* Order), the governed numbers about them (metrics), and plain-language rules ("every refrigeration unit must be inspected every 90 days"). Each piece is bound to the tables that actually hold the data. Nothing is copied: the ontology is a map that points at live data. Tiny example: entity type `Store` (key `store_id`, properties `name`, `region`), relationship `Store stocks Product`, metric `Total Sales` (a DAX measure owned by a Power BI model), rule "Stores in EMEA must not stock product category X."

**Data model** ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview), [Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-create-entity-types)):
- *Entity type*: name, description, properties, identifiers (key), metrics, rules, metadata, relationships. Keys must be string or integer. Keyless entity types, hierarchies, inheritance (a base type extended by specialised types) and shared properties (defined once, reused) are all supported.
- *Property*: a name plus one of five value types: integer, boolean, datetime, double, string. There is also an `Unknown` type for an unbound placeholder, which never appears in results until it is bound. A property name can repeat across entity types only if the type matches. Time-series bindings need a timestamp column.
- *Relationship type*: an explicit link between two entity types. It does not need a dedicated join table.
- *Metric*: in preview, metrics come only from DAX measures in a source semantic model. The semantic model keeps ownership of the expression, and the ontology keeps the business context around it.
- *Rule*: name (required, unique), definition (required, natural language), linked concepts (optional: entity types, properties, relationship types), description (rationale), and free key-value metadata (for example `category: maintenance`, `owner: facilities-operations`). Authors are advised to use "must be true / must not be true / should normally be true" phrasing. Rules are read-only to consumers, and the ontology never evaluates them ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules)).
- *Namespace*: a scope that lets several teams share one model.
- *Data binding*: maps definitions to sources. Supported sources: semantic models, lakehouses, eventhouses, warehouses, SQL databases, mirrored databases, OneLake shortcuts and views.

**Storage and compute.** This is a virtual layer. Consumers query the bound source live: KQL for eventhouse, SQL for lakehouse, DAX for semantic model, and GQL only when a Graph model has been materialised. Graph is optional and does not load instance data unless you opt in. It is meant only for multi-hop traversal, reachability and shortest path ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)). Row limits in the ontology agent: 1,000 for KQL, SQL and GQL; 200 for DAX ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent)).

**Authoring and lifecycle.** Authoring is done in the UI, through APIs and CI/CD, or by the ontology agent. Named manual version checkpoints are supported, and restoring one replaces the whole definition. Import accepts RDF, Turtle or OWL, and only into an empty item. Export produces RDF or Turtle ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)).

**Cold start.** "Generate Ontology" on a Power BI semantic model maps tables to entity types, columns to properties, model relationships to relationship types and DAX measures to metrics. Afterwards you must do these by hand: bind time series, review keys, bind relationship types to data, rename to friendly names, and review everything. Combining several semantic models is possible only through the ontology agent in Act mode. The agent reconciles overlapping tables and can create relationships across models. You need Read and Build permission on every semantic model ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models)).

**Ontology agent (proposal-first).** It has two modes: Plan (discover, draft, validate, query, explain, with no writes) and Act (applies changes after stating them). The pipeline is Discover (samples a few rows per table), then Draft (entity types, relationships, bindings), then Validate (structural and grounding checks), then Apply. A read-only diff preview highlights added, edited and removed items, each with an explanation. Patches keep stable IDs, so downstream integrations do not break. It runs as the user: Viewers can query, Contributors can change. Limits: one ontology per conversation, no undo per operation, no polymorphic queries, conversations capped at 24 hours, 10 attachments of 5 MB each, and conversation data kept for up to 2 days ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent)).

**Agent consumption.** The MCP endpoint is `https://api.fabric.microsoft.com/v1/mcp/dataPlane/workspaces/<ws>/items/<ontology>/ontologyEndpoint` over HTTP. Auth is the signed-in user's credentials; service principals are not supported because of a known issue. It needs F2+ or P1+ capacity ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-mcp-server)). The Agent 365 reference lists the tools `list_ontology_entity_types` (entity types with property names, types and available telemetry) and `search_ontology` (a natural-language question that returns raw JSON plus an optional natural-language answer). It requires the scope `McpServers.FabricIQOntology.All` and warns that tool names may change ([Fact](https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric)). The rules page adds `list_ontology_rules` ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules)). Parameter schemas are not published. The ontology can also feed Fabric data agents, Foundry IQ knowledge bases, Copilot Studio and operations agents ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/concepts-agent-integration)).

**Permissions.** Workspace and item permissions control the ontology itself. Queries respect OneLake security plus source row-, object- and column-level security ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)).

**Status.** Preview. The old experience retires on 31 January 2027, and its Activator-linked rules must be recreated by hand ([Fact](https://learn.microsoft.com/en-us/fabric/iq/ontology/overview)). Pricing is not stated on the ontology pages beyond the capacity requirement. [Unverified: billing is through Fabric capacity units.]

**Copy:** the proposal-first agent with a Plan/Act split, a diff preview and stable IDs on every patch. **Avoid:** text-only rules that nothing evaluates, and an ontology whose metrics can only come from one BI tool.

## Research literature

### 1. Ontology foundations

> Source: [general-references/09-papers-knowledge-layer.md § 1. Ontology foundations](../../general-references/09-papers-knowledge-layer.md#1-ontology-foundations)

**Plain English.** An ontology is an agreed, machine-readable dictionary of the things a business talks about, how they relate, and which rules hold. Example: "a Customer places Orders; an Order has one or more OrderLines; each OrderLine refers to exactly one Product; Net Revenue = sum of OrderLine amount minus refunds." Agents that read this dictionary don't have to guess what the column `amt_2` means.

**Gruber 1993.** Thomas R. Gruber, "A Translation Approach to Portable Ontology Specifications", *Knowledge Acquisition* 5(2):199–220, 1993 ([author page](https://tomgruber.org/writing/ontolingua-kaj-1993/)). [Fact] The paper is the source of the definition "a specification of a conceptualization". Problem: AI systems could not share knowledge because each used its own representation. Method: write ontologies once in a standard predicate-calculus form, then use Ontolingua to translate them into the target systems (frame systems, relational languages). A "Frame Ontology" bridges object-oriented and relational representations. Hard parts: keeping meaning intact across systems with different styles, and translating from expressive to restricted languages. Builder lesson: [Inference] keep the company model in one canonical, declarative form and *compile* it into each runtime target (SQL views, a graph store, tool schemas for agents, prompt context). Don't let each target drift away from the canonical form.

**Guarino 1998.** N. Guarino, "Formal Ontology and Information Systems", in *Formal Ontology in Information Systems: Proceedings of FOIS'98*, Trento, 6–8 June 1998, IOS Press, pp. 3–15 ([PDF](https://www.loa.istc.cnr.it/wp-content/uploads/2020/03/FOIS98.pdf)). [Fact] Defines an ontology as a logical theory accounting for the intended meaning of a formal vocabulary. A conceptualisation is language-independent; an ontology only approximates the "intended models" and usually also admits unintended ones. Ontologies are layered: top-level, domain, task, and application (domain plus task, often modelling roles). Guarino separates *ontology-aware* systems (which can consult an ontology) from *ontology-driven* ones (where the ontology is an active component), at both development and run time. At run time he lists database mediation, intensional queries, user-interface vocabulary mapping and agent communication. Builder lesson: [Inference] the product should be ontology-driven at run time. Agents' tools, permissions and query compilation should be *generated from* the model rather than written by hand next to it. Layer the model: a small fixed top level (Party, Document, Event, Amount, Period), domain packs per industry, and an application layer per customer.

**OntoClean (Guarino & Welty).** "Evaluating Ontological Decisions with OntoClean", *Communications of the ACM*, 2002 ([CACM](https://cacm.acm.org/research/evaluating-ontological-decisions-with-ontoclean); volume and issue listed by [dblp](https://dblp.org/rec/journals/cacm/GuarinoW02) as 45(2) [Unverified: page numbers]). [Fact] Meta-properties: rigidity (rigid, semi-rigid, anti-rigid), identity and unity. Key constraint: an anti-rigid property cannot subsume a rigid one. Example: Student cannot be a superclass of Person. Builder lesson: [Inference] model *roles* (Customer, Supplier, Employee) as relationships or role objects attached to rigid kinds (Person, Organisation), not as subclasses. The same company can be both a customer and a supplier. An LLM-generated ontology will often get this wrong, so add a lint rule for it.

**RDFS, OWL 2 and SHACL in brief.**
- RDF models data as subject–predicate–object triples with global IRIs. RDFS adds classes, subclass, domain and range. [Fact] RDF 1.2 is a Candidate Recommendation Draft dated 16 Nov 2026. It adds *triple terms*: a triple can be the object of another triple through `rdf:reifies`, so you can record "Alice claims X" without asserting X ([W3C RDF 1.2 Concepts](https://www.w3.org/TR/rdf12-concepts/)). This is the RDF answer to provenance and edge properties.
- OWL 2 profiles (W3C Recommendation, 11 Dec 2012) ([OWL 2 Profiles](https://www.w3.org/TR/owl2-profiles/)): [Fact] **EL** has polynomial-time reasoning and suits very large class hierarchies such as SNOMED CT. **QL** answers queries in AC0 data complexity by *rewriting queries into SQL over the unchanged relational data*, the basis of "virtual knowledge graphs". **RL** is implementable with rule engines and has polynomial data complexity. Builder lesson: [Inference] OWL 2 QL is the closest formal match to "an ontology over the customer's existing databases without copying data". Its restrictions (no transitive properties, no cardinality, limited existentials) are a useful upper bound on what the model should express if queries are to compile to SQL.
- SHACL (W3C Recommendation, 20 July 2017) ([SHACL](https://www.w3.org/TR/shacl/)): [Fact] a *shapes graph* validates a *data graph*. Node shapes and property shapes with `sh:path` are selected by targets (`sh:targetClass` and others). Core constraints include `sh:minCount`/`sh:maxCount`, `sh:datatype`, `sh:class`, `sh:pattern`, `sh:in` and `sh:closed`. Output is a `sh:ValidationReport` with `sh:conforms` and one result per failure (focus node, path, value, severity, message). SHACL-SPARQL adds custom constraints. [Inference, also the page's own reading] SHACL is closed-world: missing data is a violation. OWL is open-world: missing data is just unknown. Business rules ("every invoice must have exactly one supplier") are SHACL-style, not OWL-style.

**RDF compared with labelled property graphs (LPG), and ISO GQL.** [Fact] ISO/IEC 39075:2024, "GQL", edition 1, April 2024, 610 pages, from JTC 1/SC 32. It defines property-graph data structures and a language to create, query, maintain and control them; a corrigendum came out in 2026 and a revision is under development ([ISO](https://www.iso.org/standard/76120.html)). [Inference] The practical differences: an LPG stores key–value properties directly on nodes *and edges* (for example the date and amount on an "ordered" edge) and has a now-standard query language. RDF has global identifiers, a formal-semantics stack (RDFS/OWL), validation (SHACL), and, with RDF 1.2, statement-level annotation. For a small product neither is required as a storage engine. The company model can live in relational tables (object types, link types, properties), with a GQL/Cypher-style or SPARQL-style *view* generated where traversal is needed. Sequeda's results (section 5) come from the *semantic context* the ontology adds, not from the RDF storage format.

## Design decisions already in the reference maps

### 3. Registry of object types, properties, links and interfaces

> Source: [general-references/30-map-palantir-platform.md § 3. Registry of object types, properties, links and interfaces](../../general-references/30-map-palantir-platform.md#3-registry-of-object-types-properties-links-and-interfaces)

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

### 1. Type definitions separate from instances (UModel TBox/ABox), with naming and relation rules

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 1. Type definitions separate from instances (UModel TBox/ABox), with naming and relation rules](../../general-references/31-map-lingyang-alibaba-offers.md#1-type-definitions-separate-from-instances-umodel-tboxabox-with-naming-and-relation-rules)

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

## Earlier engineering notes (Phase 2)

### Core model components

> Source: former `03-ontology-engine/ontology-model-and-runtime.md` (moved here in the Nov 2026 restructure)

- **Namespace/domain:** owner and scope for model resources.
- **Object type:** stable type identity, API name, version, description, key strategy, lifecycle and ownership policy.
- **Property definition:** type, nullability, units, validation, mutability, sensitivity/marking, source mapping and authority.
- **Link type:** source/target types, cardinality, direction, delete semantics and link-level policy.
- **Interface:** reusable capabilities/properties shared across object types, without forcing unsafe inheritance semantics.
- **Shared property:** governed reusable field definition.
- **Action type:** typed parameters, preconditions, required permissions, effect plan, approval policy and audit contract.
- **Function/derived property:** deterministic calculation or query over typed objects; pure vs side-effecting execution must be explicit.
- **Rule:** declarative predicate/constraint and scope.
- **Metric:** formula, unit, grain, aggregation, time semantics and source ownership.
- **Object view/group:** presentation/navigation metadata, not a replacement for the schema.

### Runtime object model

> Source: former `03-ontology-engine/ontology-model-and-runtime.md` (moved here in the Nov 2026 restructure)

A runtime object has immutable platform ID, canonical type ID/version, tenant/namespace, key tuple or external source key, property values, per-property provenance/authority, version, created/updated time, effective-time bounds when applicable, markings and soft-delete/tombstone state. Link records have immutable ID, source and target IDs, type ID, attributes, validity and audit metadata.

### Type validation

> Source: former `03-ontology-engine/ontology-model-and-runtime.md` (moved here in the Nov 2026 restructure)

Validation has at least four levels:
1. Structural schema: fields and data types.
2. Reference integrity: referenced type/property/action exists.
3. Semantic integrity: key constraints, cardinality, relation compatibility, dependency cycles and rule type correctness.
4. Runtime compatibility: can existing data migrate or continue to resolve under the new definition?

UModel's schema validator TODO and OpenFoundry's batch schema editing provide concrete examples of why JSON validation and a CRUD route list are not the whole ontology engine.

### 1. Object types, links and interfaces are different schema primitives

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

Palantir's public documentation distinguishes:

- **Object type:** concrete, instantiable business entity with typed properties, a primary key, display/title key and one or more backing data sources.
- **Link type:** schema for a semantically meaningful relationship between two object types. A link instance is one relationship between two concrete object instances.
- **Interface:** abstract, reusable contract describing the properties and capabilities an object type must expose. An interface is not backed by a dataset and cannot be instantiated directly.
- **Object-backed relationship:** a relationship represented through its own object type when the relationship itself has properties or lifecycle.

Sources:
- https://www.palantir.com/docs/foundry/object-link-types/create-object-type
- https://www.palantir.com/docs/foundry/object-link-types/link-types-overview
- https://www.palantir.com/docs/foundry/interfaces/interface-overview
- https://www.palantir.com/docs/foundry/ontology/ontology-structural-guidance

### 2. Identity is a durable contract, not a display field

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

The object-type creation guide defines a primary key as the unique identifier of each object instance. It explicitly warns that user edits are permanently attached to the primary-key value; changing the primary key prompts deletion of existing edits.

Implication:
- Never use a display name, mutable business label or email address as the only durable object identity.
- A source-backed object needs a stable source identifier and a controlled mapping to the canonical object ID.
- When two source systems describe the same real-world entity, identity resolution should be an explicit mapping/merge process, not a silent primary-key change.
- A primary-key migration is a data migration of object identity and all dependent edits/links/audit references, not a simple column rename.

For our multi-tenant platform, a safe source identity tuple is conceptually `(tenant_id, source_system, source_object_type, source_record_id)`. A separate canonical identity maps multiple source identities to one business object where verified. Do not derive canonical identity from mutable display data.

Source: https://www.palantir.com/docs/foundry/object-link-types/create-object-type

### 3. Relationship storage must match the meaning of the relationship

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

Palantir documents three principal backing patterns for links:

| Relationship shape | Backing pattern | Suitable when |
|---|---|---|
| One-to-one / one-to-many | Foreign key property on one object type referring to the other object's primary key | A simple relationship can be fully described by the foreign key |
| Many-to-many | Join table dataset | A relationship joins sets of objects without needing a rich independent lifecycle |
| Stateful relationship | Object-backed link / intermediate object | The relationship has attributes, status, dates, permissions, ownership or actions of its own |

Examples:
- Direct: `Matter → Firm`, `Invoice → Customer`.
- Many-to-many: `Matter ↔ LegalIssue` where no independent join lifecycle is needed.
- Object-backed: `MatterMembership` between `Principal` and `Matter`, with role, grant source, effective dates, expiry, approval and ethical-wall state.
- Object-backed: `InvoicePaymentAllocation` between `Invoice` and `Payment`, with applied amount, currency, allocation date, reversal and reconciliation status.
- Object-backed: `PartyRepresentation` between `Matter` and `Party`, with represented side, lawyer/team, start/end dates and conflict-review status.

Palantir's structural guidance says direct links are for meaningful relationships without their own metadata; object-backed links are for relationships that carry their own information. This is a practical modelling test, not just a storage preference.

Sources:
- https://www.palantir.com/docs/foundry/object-link-types/create-link-type
- https://www.palantir.com/docs/foundry/ontology/ontology-structural-guidance

### 4. Declared cardinality is not automatically an integrity constraint

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

Palantir's link-creation documentation makes a specific caveat: one-to-one cardinality indicates the intended relationship shape, but the one-to-one cardinality itself is not enforced. Link type definitions also carry a status such as active, experimental or deprecated.

Therefore our design must distinguish:
1. **Semantic declaration:** intended direction and cardinality for query planning, application and agent reasoning.
2. **Storage constraint:** actual unique, foreign-key, exclusion or check constraints that make invalid states impossible at commit time.
3. **Authorization rule:** who can see/create/remove the relationship.
4. **Lifecycle rule:** how the relationship is approved, expired, revoked or superseded.

Do not let the agent planner infer database integrity merely because a relationship schema says ONE. For relationships where uniqueness or exclusivity is a safety/business invariant, enforce it in the canonical database and test concurrent writes.

Source: https://www.palantir.com/docs/foundry/object-link-types/create-link-type

### 5. Interfaces are behaviour/data contracts, not merely inheritance

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

An interface can define:
- required properties;
- link-type constraints;
- action-type constraints;
- metadata and optional properties.

An object type implements an interface by mapping its local properties to the interface properties and satisfying required link/action constraints. Interface searches can return objects from multiple implementing object types, so applications can operate on a common capability without hard-coding every concrete type.

Important limits in the currently documented Palantir surface:
- An interface is abstract and cannot be instantiated.
- Searchability determines whether a single object set can query across all implementing object types.
- Interface support varies across functions, actions, OSDK and Object Set Service; some interface aggregation/link capabilities are described as in development or beta in the docs.

Sources:
- https://www.palantir.com/docs/foundry/interfaces/interface-overview
- https://www.palantir.com/docs/foundry/interfaces/implement-interface
- https://www.palantir.com/docs/foundry/interfaces/interface-link-types-overview

**Recommendation:** use interfaces only when two or more concrete types genuinely share a stable contract needed by queries, actions or applications. Avoid building a large class hierarchy. For example, `Party` may be a reusable interface for `IndividualParty` and `CorporateParty` only if the shared property and action contracts are useful and stable.

### 6. Dataphin's model adds an event/fact perspective

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

Alibaba Dataphin documents a Kimball-style dimensional modelling flow:
- business entities/business objects lead to logical dimension tables;
- business activities lead to logical fact tables;
- atomic metrics, business filters, derived metrics and logical aggregate tables are designed from that model.

This complements an ontology but should not be collapsed into it:
- the ontology expresses business objects and relationships used by people and agents;
- fact/dimension models express analytical grain and measure calculation;
- metrics express governed analytical definitions.

A single domain may need both object-centric operational queries and fact-centric analytic queries.

Source: https://help.aliyun.com/en/dataphin/semimanaged-v4/user-guide/data-modeling-research-and-development/

### 9. Design conclusion

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

The original architecture needs three distinct layers in its model language: **concrete object types, relationship types and reusable interfaces**. Relationship storage must be chosen based on whether the relationship itself has state. Declared cardinality guides semantics; database constraints enforce invariants. Stable primary keys and explicit schema evolution protect user edits, source mappings and audit history.

## Fact-check notes

_Checked 28 Nov 2026 against current vendor documentation and project pages. **Confirmed** = the research above still matches. **New** = not in the research above. **Changed** = the research above is now out of date._

- **Confirmed — link implementations.** Foreign-key links (one-to-one / one-to-many / many-to-one), join-table links (many-to-many) and object-backed links (a backing object type extending many-to-one) are all current. Changing a link's cardinality or a many-to-many link's backing datasource unregisters and re-registers its datasource. On non-many-to-many links the key on the "one" side must be that type's primary key. Sources: https://www.palantir.com/docs/foundry/object-link-types/create-link-type/ , https://www.palantir.com/docs/foundry/object-link-types/edit-link-types
- **Confirmed — interfaces.** Shared properties plus link-type constraints plus metadata; object types can implement many interfaces; interfaces can extend many interfaces. Interface link constraints have ONE or MANY cardinality and a required flag. Sources: https://www.palantir.com/docs/foundry/interfaces , https://www.palantir.com/docs/foundry/interfaces/interface-link-types-overview/
- **Confirmed, still incomplete at Palantir:** in the Object Set Service, aggregation by interface and interface link types are still "in development"; interface action type constraints are still beta, and end users cannot discover or invoke them from apps. Sources: https://www.palantir.com/docs/foundry/interfaces/interface-overview/ , https://www.palantir.com/docs/foundry/interfaces/interface-action-type-constraints
- **Changed — derived properties now have two tiers.** Runtime-defined derived properties (added at query time) are generally available and support arithmetic and date expressions (OSDK `@osdk/client` 2.4.0+). Ontology-defined derived properties are still beta and do not support expressions. Both: maximum three link traversals; an aggregation is required whenever a traversal can reach more than one object; linked-property and aggregation derived properties cannot reference other derived properties. Sources: https://palantir.com/docs/foundry/ontology/derived-properties/ , https://palantir.com/docs/foundry/ontology/derived-properties-reference/
- **New — Microsoft Fabric IQ status.** Fabric IQ was announced generally available at Build (June 2026), but its Ontology item is still labelled preview on Microsoft Learn as of late 2026. Microsoft has added Ontology Rules backed by Fabric Activator and announced public Ontology MCP endpoints as "coming soon". Sources: https://learn.microsoft.com/en-us/fabric/iq/overview , https://thenewstack.io/microsoft-build-2026-data-fabric-horizondb-ai-agents/ , https://community.fabric.microsoft.com/t5/Fabric-Updates-Blog/What-s-next-for-Fabric-IQ-Ontology-The-operational-context-that/ba-p/5172145
- **New — Alibaba UModel is open source.** Alibaba Cloud open-sourced UnifiedModel on 20 May 2026 and launched a Universal Semantic Standard initiative. Its published primitives are Set + Link + Field; the model is workspace-scoped; public surfaces are a REST API (OpenAPI), the `umctl` CLI, an MCP server (`umodel-mcp`), a web UI and Go/Python SDKs; model changes go through PR review with schema-checksum validation on import and conformance tests. Sources: https://alibabacloud.com/blog/enabling-boundless-intelligent-collaboration-umodel-now-open-source-launching-the-universal-semantics-standard-initiative_603289 , https://alibaba.github.io/UnifiedModel/en/concepts/object-graph-semantic-layer.html

## Gaps

- Every source category has some material; see the open questions in each linked source.
