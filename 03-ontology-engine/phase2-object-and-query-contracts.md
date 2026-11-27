# Phase 2 research — ontology object lifecycle and query contracts

**Research date:** 27 November 2026  
**Evidence:** Palantir official backend/API documentation and public TypeScript OSDK source at commit `5c6d916f5ab1874ea081402eddeb130960d4c9b4`. No production Foundry server or test suite was run.

## 1. An ontology backend is several cooperating responsibilities

Palantir's public object-backend architecture names:
- Ontology Metadata Service (OMS): object/link/action type definitions and related metadata.
- Object databases: indexed object representation and edit handling.
- Object Set Service (OSS): search, filtering, aggregation, loading and read execution.
- Actions: structured object mutation under conditions and permissions.
- Object Data Funnel: ingests source data and user edits into object databases.
- Functions on Objects: business logic for operational contexts.

This is the important architectural lesson: **schema metadata, object persistence/indexing, query execution and action application are separate contracts**. A single graph database plus a generic CRUD endpoint does not reproduce that separation.

Source: https://www.palantir.com/docs/foundry/object-backend/overview

Palantir's documentation describes Object Storage v1 as legacy and Object Storage v2 as the next-generation canonical data store for backing the Ontology. That does not mean every value originates in the Ontology: mapped source data and user edits still have separate provenance and lifecycle.

## 2. Object set is a first-class query abstraction

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

## 3. Snapshot pagination is a correctness choice

The Palantir v3/v2 API paging documentation states that ordinary pagination may return the latest state on each page. If records change between requests, this can create duplicate or missing items. Snapshot pagination captures a point-in-time view and prevents duplicate/missing items across those pages, at the cost of potentially stale data. Page tokens are short-lived and intended for immediate sequential use. Requested page size is a suggestion, not necessarily the returned size.

Official sources:
- https://www.palantir.com/docs/foundry/api/v2/general/overview/paging
- https://www.palantir.com/docs/foundry/api/v3/general/overview/paging

## 4. Public TypeScript OSDK source inspection

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

## 5. Proposed query contract for our platform

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

## 6. Query correctness and performance tests

- A changing dataset between pages: demonstrate duplicate/skip in live pagination and stable complete traversal in snapshot mode.
- Query hash, filter and tenant changes while reusing a page token: reject token.
- Same query on each supported graph/SQL provider: equal logical results and documented capability differences.
- Aggregation over a one-to-many or many-to-many path: prove no fan-out inflation.
- Derived property filtering: capture planner fallback and cost budget behaviour.
- Paginated traversal with short pages: ensure client continues while a token exists.
- Wide objects with unused properties: verify projections reduce transferred bytes.
- Revoked access during multi-page traversal: enforce the chosen revocation/freshness policy on subsequent pages.

## Design implication

Our v1 should build a relational/object-set query engine with explicit relationship traversal and semantic plans over PostgreSQL. Keep the graph store as an optional provider/projection until benchmarks and query needs justify it. The user-facing SDK should generate typed object definitions and query contracts from published ontology metadata.
