# Object set queries

**Layer:** [04-query-and-metrics](README.md) · **What it is:** Querying typed objects as sets: filters, link traversal, aggregation, pagination and consistency.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (7)

## Palantir

### 6. Object sets and the query model

> Source: [general-references/02-palantir-ontology.md § 6. Object sets and the query model](../../general-references/02-palantir-ontology.md#6-object-sets-and-the-query-model)

Plain English: an object set is a saved or ad hoc question such as "open orders over 10,000 for customers in Ohio". It is built by composing operations and is then paged, counted, aggregated or watched.

Technical detail:
- **Kinds of saved sets:** static (list of primary keys), dynamic (saved filter, re-evaluated), temporary (passed between services, creator-only, expires within 24 hours), permanent (stored for reuse). [Fact] https://www.palantir.com/docs/foundry/object-backend/overview
- **Wire format.** The public REST `ObjectSet` is a discriminated union: `base`, `static`, `reference`, `filter`, `union`, `intersect`, `subtract`, `searchAround`, `interfaceLinkSearchAround`, `nearestNeighbors`, `withProperties`, `asType`, `asBaseObjectTypes`, `interfaceBase`, `methodInput`. [Fact] `foundry_sdk/v2/ontologies/models.py` lines ~3607-3627. The internal OSS union is similar and adds `softLinkSearchAround`, `knn`/`knnV2`, `referenced`. [Fact] `client.unstable/src/generated/object-set-service/api/__components.ts`
- **Filters.** Public search query types: eq, gt/gte/lt/lte, in, isNull, and, or, not, contains, startsWith, containsAllTerms, containsAnyTerm, containsAllTermsInOrder (and prefix-on-last-term variant), regex, wildcard, interval, relative date range, within distance, within bounding box, within/intersects polygon, intersects / does not intersect bounding box, geoshape. [Fact] `models.py` `SearchJsonQueryV2`. OSDK string filters support fuzzy and phonetic options. [Fact] `osdk-ts/packages/api/src/aggregate/StringFilter.ts`. Internally OSS also has parameterised filters and a `userContext` filter. [Fact] OSS `ObjectSetFilter` union.
- **Search-around** = follow a link from every object in a set to produce the linked set. OSDK method `pivotTo("linkApiName")`. [Fact] `ObjectSet.ts`
- **Aggregations.** Metrics: count, min, max, avg, sum, approximate distinct, exact distinct, approximate percentile. Group-bys include exact values, fixed-width buckets and ranges. Requests carry an `accuracy` option. [Fact] `models.py` `AggregationV2`, `AggregateObjectSetRequestV2`; `ObjectSet.ts` example. OSS defaults to `PREFER_SPEED`; callers can set `PREFER_ACCURACY` and get an `AggregateResultAccuracy` flag back. Object Explorer histograms fetch an approximate top 100 buckets then exact counts; pivot tables load the first 1,000 values per property; OSDK and Functions always prefer accuracy; Functions cannot groupBy and orderBy in one call. [Fact] https://www.palantir.com/docs/foundry/object-backend/aggregation-considerations/
- **Paging.** Default page size 1,000; a page may be smaller or larger; null properties are omitted; listing has no consistency guarantee (objects may repeat or be missed) unless a snapshot is requested; OSv1 listing capped at 10,000 objects, OSv2 uncapped. [Fact] `foundry_sdk/v2/ontologies/ontology_object.py`; OSDK `fetchPage` docs (`$snapshot`) in `ObjectSet.ts`. `$select` matters: without it the default property set is loaded and paid for. [Fact] `ObjectSet.ts` doc comment.
- **Execution thresholds.** OSS switches from in-memory to Spark when a search-around or derived property involves more than 100,000 objects, or when loading needs more than 25 pages from OSv2. Caps: 10,000,000 objects for a search-around leaf; 30,000,000 objects total per query; `.all()` in OSDK and functions limited to 100,000; functions advisory threshold 10,000. If the estimated size exceeds a limit by more than 2x the query may fail early. [Fact] https://www.palantir.com/docs/foundry/ontologies/oss-limitations/ . OSv2 default search-around limit 100,000, raisable via support. [Fact] https://www.palantir.com/docs/foundry/object-backend/overview
- **Subscriptions.** WebSocket at `wss://{host}/api/v2/ontologySubscriptions/ontologies/{ontology}/streamSubscriptions`, token passed as sub-protocol `Bearer-{token}`. Client sends a list of object set + property set requests (re-sending reconciles); server sends `subscribeResponses`, `objectSetChanged` (each update `ADDED_OR_UPDATED` or `REMOVED`, where removed includes "no longer matches filter"), `refreshObjectSet` (reload via HTTP), `subscriptionClosed` (for example `SUBSCRIPTION_MEMORY_LIMIT_EXCEEDED`), and `qos` back-pressure (client should back off with jitter). Subscriptions do not survive server restarts; joins are not fully supported. [Fact] https://www.palantir.com/docs/foundry/ontology-sdk/websocket-subscriptions/
- **Query strings** are not supported by OSS on OSv2. [Fact] https://www.palantir.com/docs/foundry/object-backend/object-storage-v2-breaking-changes/
- **Semantic search.** `nearestNeighbors(query, k, vectorProperty)` accepts a text query (auto-embedded with the property's model) or a raw vector; k is 1-500 in the OSDK; order by `relevance` to get scores. [Fact] `osdk-ts/packages/api/src/objectSet/ObjectSet.ts`. The docs tutorial embeds text in Pipeline Builder ("Text to Embeddings", example model `text-embedding-ada-002`), stores it as a vector property, then queries via a function (TS v1 k ≤ 100, TS v2 1-500, Python returns `_score`). [Fact] https://palantir.com/docs/foundry/ontology/using-palantir-provided-models-to-create-a-semantic-search-workflow/ . Chunking strategy and dimension limits were not documented on the pages I opened [Unverified].

## Design decisions already in the reference maps

### 6. Object-set query model

> Source: [general-references/30-map-palantir-platform.md § 6. Object-set query model](../../general-references/30-map-palantir-platform.md#6-object-set-query-model)

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

### 8. Multi-hop across records

> Source: [general-references/32-map-research-and-cost.md § 8. Multi-hop across records](../../general-references/32-map-research-and-cost.md#8-multi-hop-across-records)

**Purpose.** Answer questions that cross several linked records. Example: "Which customers with invoices disputed in October also have a sales rep who left the company, and what is their total overdue amount?"

**Design to implement.**
- The main graph is built from *structured records*: foreign keys and resolved entities (section 5) as typed links in Postgres tables `(object_type, link_type, source_id, target_id, valid_from, valid_to)`.
- Expose typed traversal tools:
  - `find_objects(type, filter)`
  - `get_links(object_id, link_type, direction)`
  - `get_object(id, properties, response_format)`
- Server-side limits [Inference: the documents give the pattern, not the numbers]: beam width 5, depth 3, at most 200 objects per call.
- When returning a neighbourhood, return the *connected* minimal subgraph linking the relevant nodes, not a bag of top-k nodes.
- Aggregations at the end of a traversal go back through `query_metric` (section 1). The traversal never sums in the model.
- Permissions (section 10) filter every hop.

**Evidence.**
- Only about 65% of answer entities make it into an LLM-extracted graph (Han et al., arXiv 2502.11371; document 09, section 5).
- Think-on-Graph (training-free beam search over KG entities) was state of the art on 6 of 9 datasets at the time (arXiv 2307.07697).
- G-Retriever: connected subgraph selection (arXiv 2402.07630).
- Document 09 says plainly that no controlled study compares typed traversal tools against text-to-SQL for multi-hop over enterprise records. This recommendation is an inference.

**Copies.** Document 09, "What to copy" item 14 and recommendation (c). https://arxiv.org/abs/2307.07697 ; https://arxiv.org/abs/2402.07630

**Left out.** Text-derived graphs as the primary graph (lossy and expensive).

**Open questions.** Beam and depth defaults are not in any document; tune them by evaluation.

## Earlier engineering notes (Phase 2)

### Query contract

> Source: former `03-ontology-engine/ontology-model-and-runtime.md` (moved here in the Nov 2026 restructure)

An object-set query should support type, predicates, typed property operations, link traversal, interface narrowing, sort, cursor pagination, projection, aggregation and explain plan. It should carry tenant/policy scope and enforce it before data leaves the query layer. Query operators should not be arbitrary user SQL.

### 2. Object set is a first-class query abstraction

> Source: former `03-ontology-engine/phase2-object-and-query-contracts.md` (moved here in the Nov 2026 restructure)

OSS is the shared read path for object search, filtering, aggregation and loading. The public docs describe a tiered execution strategy:
1. push eligible operations down to indexed storage;
2. use in-memory processing for more complex moderate-size requests;
3. fall back to distributed Spark execution for requests above in-memory capacity.

Practical consequences from the documented limitations:
- Filter early, before traversing/loading large object sets.
- A derived property or computed SQL column may not use the internal index path; filtering, aggregation or sorting on it may require evaluating rows and using memory/Spark.
- Search-around relationship traversal uses a left-semi join to return matching destination objects without duplicating starting objects.
- Pagination can return fewer objects than requested while still having more results; continue until the page token is empty.
- The deprecated `loadObjects` endpoint should be replaced with paginated `StaticObjectSetV2` reads.

Sources:
- https://www.palantir.com/docs/foundry/ontologies/oss-limitations
- https://www.palantir.com/docs/foundry/object-backend/overview

### 3. Snapshot pagination is a correctness choice

> Source: former `03-ontology-engine/phase2-object-and-query-contracts.md` (moved here in the Nov 2026 restructure)

The Palantir v3/v2 API paging documentation states that ordinary pagination may return the latest state on each page. If records change between requests, this can create duplicate or missing items. Snapshot pagination captures a point-in-time view and prevents duplicate/missing items across those pages, at the cost of potentially stale data. Page tokens are short-lived and intended for immediate sequential use. Requested page size is a suggestion, not necessarily the returned size.

Official sources:
- https://www.palantir.com/docs/foundry/api/v2/general/overview/paging
- https://www.palantir.com/docs/foundry/api/v3/general/overview/paging

### 4. Public TypeScript OSDK source inspection

> Source: former `03-ontology-engine/phase2-object-and-query-contracts.md` (moved here in the Nov 2026 restructure)

Repository: https://github.com/palantir/osdk-ts  
Commit inspected: https://github.com/palantir/osdk-ts/tree/5c6d916f5ab1874ea081402eddeb130960d4c9b4

Files inspected:
- `packages/api/src/objectSet/ObjectSet.ts`
- `packages/client/src/object/fetchPage.ts`
- `packages/client/src/objectSet/createObjectSet.ts`
- `packages/typescript-sdk-docs-examples/src/typescriptOsdkExamples.ts`

Observed implementation/API contract:
- The ObjectSet type is generic over generated object/interface definitions and property keys, providing compile-time typing for selected properties and query operations.
- `fetchPage` does not request a snapshot by default. Its API comments warn that concurrent changes can cause later pages to repeat or skip records. Callers must pass `$snapshot: true` to pin a consistent view.
- `asyncIter()` internally requests snapshot pagination and loops through page tokens.
- `$pageSize` controls one page, not the total number of results.
- Without `$select`, the API loads its default property set; selecting only needed fields avoids fetching unused property data.
- Generated SDK examples show `applyAction` and `batchApplyAction`, with an optional `$returnEdits` mode for returning changed object information.
- This is a public client contract. It reveals how callers interact with the ontology, not how Palantir's private backend services are implemented.

These observations add implementation-level support to the original OSDK study. They must not be described as a server-side implementation audit.

### 5. Proposed query contract for our platform

> Source: former `03-ontology-engine/phase2-object-and-query-contracts.md` (moved here in the Nov 2026 restructure)

Represent a query as a typed immutable plan, not raw SQL supplied by the model:

- ontology/model version
- object type and projected properties
- filter AST with typed operands
- relationship traversals with declared direction/cardinality
- aggregation and grain
- sort and page size/token
- snapshot/read consistency mode
- tenant, matter/resource and authorization context
- provider capability requirements
- execution cost/timeout budget
- result lineage and explain plan

The query service should choose a provider plan only after validating property indexes, relationships, operators, aggregation grain, permission constraints and provider capabilities. Return a next-page token bound to the query hash, tenant/security scope, model version and consistency mode; reject tokens reused with a different query or scope.

### 6. Query correctness and performance tests

> Source: former `03-ontology-engine/phase2-object-and-query-contracts.md` (moved here in the Nov 2026 restructure)

- A changing dataset between pages: demonstrate duplicate/skip in live pagination and stable complete traversal in snapshot mode.
- Query hash, filter and tenant changes while reusing a page token: reject token.
- Same query on each supported graph/SQL provider: equal logical results and documented capability differences.
- Aggregation over a one-to-many or many-to-many path: prove no fan-out inflation.
- Derived property filtering: capture planner fallback and cost budget behaviour.
- Paginated traversal with short pages: ensure client continues while a token exists.
- Wide objects with unused properties: verify projections reduce transferred bytes.
- Revoked access during multi-page traversal: enforce the chosen revocation/freshness policy on subsequent pages.

### Design implication

> Source: former `03-ontology-engine/phase2-object-and-query-contracts.md` (moved here in the Nov 2026 restructure)

Our v1 should build a relational/object-set query engine with explicit relationship traversal and semantic plans over PostgreSQL. Keep the graph store as an optional provider/projection until benchmarks and query needs justify it. The user-facing SDK should generate typed object definitions and query contracts from published ontology metadata.

## Open-source implementations (added 28 Nov 2026)

- [`gura105/operational-ontology` → `src/query.ts`](https://github.com/gura105/operational-ontology/blob/cd8dea3/src/query.ts) — set algebra and aggregation reference.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Wire format:** the 15-variant `ObjectSet` union and `SearchJsonQueryV2` filter list in [`palantir/foundry-platform-python` → `foundry_sdk/v2/ontologies/models.py`](https://github.com/palantir/foundry-platform-python/blob/cb2bd92/foundry_sdk/v2/ontologies/models.py); typed builder and `$snapshot` pagination in [`palantir/osdk-ts` → `packages/api/src/objectSet/ObjectSet.ts`](https://github.com/palantir/osdk-ts/blob/fe6f8e1/packages/api/src/objectSet/ObjectSet.ts).
- **Minimal working implementation:** [`gura105/operational-ontology` → `src/query.ts`](https://github.com/gura105/operational-ontology/blob/cd8dea3/src/query.ts) — filter / union / intersect / subtract / aggregate with groupBy over an in-memory store; port to SQL.

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed (code)** — ObjectSet algebra and filter list present at cb2bd92; OSv2 search-around default 100,000 (see ontology pass).

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
