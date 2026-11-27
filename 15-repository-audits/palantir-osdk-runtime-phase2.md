# Palantir OSDK TypeScript — Phase 2 client-contract audit

**Repository:** https://github.com/palantir/osdk-ts  
**Commit inspected:** `5c6d916f5ab1874ea081402eddeb130960d4c9b4`  
**Date:** 27 November 2026  
**Validation:** source files read remotely; no package install, build, tests or Foundry API calls were executed.

## Scope

This is a focused source audit to deepen the original Palantir OSDK TypeScript research. It examines the public typed client, object-set paging and action examples. It does not claim access to Palantir's private ontology backend.

## Files inspected

- `packages/api/src/objectSet/ObjectSet.ts`
- `packages/client/src/object/fetchPage.ts`
- `packages/client/src/objectSet/createObjectSet.ts`
- `packages/typescript-sdk-docs-examples/src/typescriptOsdkExamples.ts`

## Findings

### 1. ObjectSet is a typed query builder surface

The public `ObjectSet` interfaces are generic over object/interface definitions, property keys, selections and modifiers. This lets the generated ontology SDK constrain query projections and returned property types at compile time. This confirms that the developer surface is not simply a bag of endpoint strings.

### 2. Page size is not a total-result cap

The `fetchPage` contract comments state that `$pageSize` sizes one page and does not limit total result count. The client passes `$nextPageToken` and `$pageSize` to the API. A consumer must follow page tokens to completion or deliberately stop with a documented limit.

### 3. Pagination consistency must be opted into

The `fetchPage` comments say no snapshot is requested unless `$snapshot: true` is provided. If objects change between page requests, later pages may repeat or skip objects. The `asyncIter` implementation in `createObjectSet.ts` requests `$snapshot: true` while iterating through the page tokens.

### 4. Projection affects cost

The API comments state that without `$select`, the default property set is loaded. Reading fewer fields after the fetch does not avoid that cost. The client examples therefore recommend selecting only properties that are read.

### 5. Generated action call surfaces return changed objects optionally

The examples show `applyAction` and `batchApplyAction` with `$returnEdits: true`, then discriminate on a result of type `edits` and inspect `editedObjectTypes`. This is a client-side convenience/contract, not proof of backend action atomicity; atomicity is described separately in Palantir's official action docs.

## Design implications for our own SDK

- Generate types from a versioned ontology definition rather than making every application hand-author string names.
- Make read projections explicit and small by default.
- Make pagination snapshot mode a required explicit choice for complete exports or audits.
- Return opaque, query-bound page tokens and stable total-count semantics only when supported.
- Distinguish action validation responses from committed edit results.
- Provide typed action results that can include changed object references and version stamps.
- Keep SDK ergonomics separate from server-side authorization and transaction guarantees.

## Evidence links

- Pinned source tree: https://github.com/palantir/osdk-ts/tree/5c6d916f5ab1874ea081402eddeb130960d4c9b4
- ObjectSet API: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/api/src/objectSet/ObjectSet.ts
- Fetch implementation: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/client/src/object/fetchPage.ts
- Object-set construction/iterator: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/client/src/objectSet/createObjectSet.ts
- SDK examples: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/typescript-sdk-docs-examples/src/typescriptOsdkExamples.ts
- Official backend architecture: https://www.palantir.com/docs/foundry/object-backend/overview
- Official paging semantics: https://www.palantir.com/docs/foundry/api/v2/general/overview/paging
