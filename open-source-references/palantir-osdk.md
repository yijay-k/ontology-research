# Palantir public SDKs (osdk-ts, foundry-platform-python, conjure)

| | |
|---|---|
| **Repository** | <https://github.com/palantir/osdk-ts>, <https://github.com/palantir/foundry-platform-python>, <https://github.com/palantir/conjure> |
| **Why it matters** | Palantir's own Apache-2.0 SDKs are the most authoritative public evidence of Foundry's ontology metadata, action and ObjectSet formats. |
| **What to take** | Ontology IR shapes (12 logic-rule kinds, 9 condition kinds), validate-only vs validate-and-execute, the 15-variant ObjectSet algebra, snapshot pagination opt-in, Conjure's error taxonomy and log-safety flags. |
| **What not to copy** | The SDKs as a dependency (useful only against a real Foundry); they reveal the client contract, not backend internals. |
| **Feeds** | [03-ontology-engine/sdk-api-and-mcp](../engineering/03-ontology-engine/sdk-api-and-mcp.md), [05-actions-and-rules/action-types](../engineering/05-actions-and-rules/action-types.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** **copy the design** (IR shapes, the validate/apply split, ObjectSet algebra, error taxonomy). As a dependency the SDKs only make sense when talking to a real Foundry.

> **Source re-check 28 Nov 2026 (code):** [`palantir/osdk-ts@fe6f8e1`](https://github.com/palantir/osdk-ts/tree/fe6f8e1), [`palantir/foundry-platform-python@cb2bd92`](https://github.com/palantir/foundry-platform-python/tree/cb2bd92) — IR still 12 logic-rule and 9 condition variants.

## From the open-source code study: 2. Palantir's public SDKs: osdk-ts, foundry-platform-python, conjure

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

Plain-English explanation: these are the client libraries Palantir publishes so customers can call Foundry. They are generated from Foundry's internal API definitions, so their types reveal how Foundry itself models object types, actions and object sets.

- **osdk-ts**: Apache-2.0 (per-package `license` field; there is no root LICENSE file), TypeScript, about 636k lines across roughly 80 packages, last commit 2026-11-20. [Fact]
  - `packages/api/src/ontology/ObjectTypeDefinition.ts`: `ObjectMetadata` has `apiName`, `primaryKeyApiName`, `titleProperty`, `links`, `primaryKeyType`, `visibility`, `status`, `implements`, and `interfaceMap`/`inverseInterfaceMap` (interface property ↔ object property). Properties carry `type`, `multiplicity`, `nullable`, `valueTypeApiName`, `valueFormatting` and `readonly`. [Fact] ([file](https://github.com/palantir/osdk-ts/blob/HEAD/packages/api/src/ontology/ObjectTypeDefinition.ts))
  - `ActionDefinition.ts`: action parameters are typed as base types (boolean, string, integer, long, double, decimal, datetime, timestamp, attachment, marking, mediaReference, geoshape and others) or as `object`, `objectSet`, `interface` or `struct`. Each action declares `modifiedEntities: {created, modified}` per object type. [Fact]
  - `packages/api/src/actions/Actions.ts`: the apply options `$validateOnly` and `$returnEdits` are mutually exclusive. [Fact]
  - The ontology-as-code "maker" lives in `packages/maker/src/api/` (`defineObject`, `defineLink`, `defineAction`, `defineCreateObjectAction`, `defineModifyObjectAction`, `defineInterface`, `defineValueType`, and more). An action type there carries `rules: OntologyIrLogicRule[]`, `validation: OntologyIrValidationRule[]`, `sections`, `parameterOrdering`, `submissionMetadata` and `isolationSettings` ("runtime isolation and retries"). [Fact] ([ActionType.ts](https://github.com/palantir/osdk-ts/blob/HEAD/packages/maker/src/api/action/ActionType.ts))
  - `packages/client.unstable/src/generated/ontology-metadata/api/__components.ts` (18,102 lines) is the ontology metadata IR:
    - `OntologyIrLogicRule` has twelve variants: addObject, addOrModifyObjectV2, modifyObject, deleteObject, add/modifyInterface, add/deleteLink, add/deleteInterfaceLink, function and scenario.
    - `OntologyIrCondition` has nine variants: true, or, and, not, comparison, markings, regex, executionContext and redacted.
    - `ComparisonOperator` covers `LESS_THAN_EQUALS`, `LESS_THAN`, `EQUALS`, `NOT_EQUALS`, `GREATER_THAN_EQUALS`, `GREATER_THAN`, `INTERSECTS` and `IS_OF_OBJECT_TYPE`.
    - Condition values can be a parameterId, a staticValue, an objectParameterPropertyValue, an interfaceParameterPropertyValue, a userProperty or a parameterLength.

    [Fact]. This is the most concrete public evidence of how Foundry encodes submission criteria, and it is directly copyable as a JSON shape.
- **foundry-platform-python**: Apache-2.0, generated, about 160k lines, last commit 2026-11-20. [Fact]
  - `foundry_sdk/v2/ontologies/action.py` exposes the endpoints `/v2/ontologies/{ontology}/actions/{action}/apply`, `/applyBatch`, `/applyWithOverrides` and `/applyBatchWithOverrides`.
  - `models.py`: `ApplyActionRequestV2{options:{mode: VALIDATE_ONLY|VALIDATE_AND_EXECUTE, returnEdits: ALL|ALL_V2_WITH_DELETIONS|NONE}, parameters}`. `ValidateActionResponseV2{result: VALID|INVALID, submissionCriteria: [{configuredFailureMessage, result}], parameters: {id: ParameterEvaluationResult}}`. `ObjectSet` is a union discriminated on `type` with 15 variants: base, static, filter, searchAround, union, intersect, subtract, nearestNeighbors, withProperties, asType, asBaseObjectTypes, interfaceBase, interfaceLinkSearchAround, methodInput and reference. [Fact] ([models.py](https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py))
- **conjure**: Apache-2.0, Java (about 15k lines), last commit 2026-11-18. It is Palantir's YAML IDL. Two pieces are worth copying:
  1. A closed set of error codes: PERMISSION_DENIED, INVALID_ARGUMENT, NOT_FOUND, CONFLICT, REQUEST_ENTITY_TOO_LARGE, FAILED_PRECONDITION, INTERNAL, TIMEOUT, CUSTOM_CLIENT and CUSTOM_SERVER. Each error is split into `safe-args` and `unsafe-args`.
  2. Per-field `safety: safe | unsafe | do-not-log`, with bearer tokens always treated as do-not-log.

  [Fact] ([docs/spec/conjure_definitions.md](https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md)). [Inference] Do not adopt Conjure's toolchain, which is Gradle/Java. Copy the error taxonomy and the log-safety flag into your Zod schemas so that audit logs and agent traces redact by construction.
- Verdict: **copy the design** (IR shapes, the validate/apply split, ObjectSet algebra, error taxonomy). As a dependency the SDKs only make sense when talking to a real Foundry.

## Repository audit: Repository audit — palantir/osdk-ts

> Source: former `15-repository-audits/palantir-osdk-ts.md` (Phase 2 source inspection, not executed).

**Role:** client SDK and public ontology contract reference.  
**Repository:** [palantir/osdk-ts](https://github.com/palantir/osdk-ts), branch `main`.  
**Validation:** client interface and action method inspected; no tests run.

### Client type surface

`packages/client/src/Client.ts` defines a typed callable client. Passing an object-type definition returns a typed `ObjectSet`; passing an interface definition returns a minimal object set; passing an action definition returns an action signature; query definitions are typed separately. `fetchMetadata()` can retrieve metadata for object, interface, action or query definitions.

This shows an API contract where ontology metadata drives compile-time types and object-set operations. It is a strong developer-experience reference: generated ontology definitions give application code typed object properties and typed action parameters rather than generic unvalidated JSON.

### Action execution surface

`packages/client/src/actions/applyAction.ts` maps compile-time typed parameters to the server API. It passes branch/scenario context and can request returned edits. The current action API supports a `VALIDATE_ONLY` mode when `$validateOnly` is set and `VALIDATE_AND_EXECUTE` otherwise. An invalid validation result becomes an `ActionValidationError`. The SDK can request edit details, including V2 edit results with deletions.

### What this proves—and does not

It proves the client contract exposes typed object-set and action operations and validation-only mode. It does **not** reveal the server-side validation algorithm, database transaction model, authorization internals, indexing service, persistence engine or cross-system writeback implementation.

### Adoption recommendation

Learn from metadata-generated type-safe clients, explicit validation-only calls, typed action parameter remapping, returned edit structures, branch/scenario context and semantic version compatibility. Do not mistake a client SDK for a reusable ontology backend.

## Repository audit: Palantir OSDK TypeScript — Phase 2 client-contract audit

> Source: former `15-repository-audits/palantir-osdk-runtime-phase2.md` (Phase 2 source inspection, not executed).

**Repository:** https://github.com/palantir/osdk-ts  
**Commit inspected:** `5c6d916f5ab1874ea081402eddeb130960d4c9b4`  
**Date:** 27 November 2026  
**Validation:** source files read remotely; no package install, build, tests or Foundry API calls were executed.

### Scope

This is a focused source audit to deepen the original Palantir OSDK TypeScript research. It examines the public typed client, object-set paging and action examples. It does not claim access to Palantir's private ontology backend.

### Files inspected

- `packages/api/src/objectSet/ObjectSet.ts`
- `packages/client/src/object/fetchPage.ts`
- `packages/client/src/objectSet/createObjectSet.ts`
- `packages/typescript-sdk-docs-examples/src/typescriptOsdkExamples.ts`

### Findings

#### 1. ObjectSet is a typed query builder surface

The public `ObjectSet` interfaces are generic over object/interface definitions, property keys, selections and modifiers. This lets the generated ontology SDK constrain query projections and returned property types at compile time. This confirms that the developer surface is not simply a bag of endpoint strings.

#### 2. Page size is not a total-result cap

The `fetchPage` contract comments state that `$pageSize` sizes one page and does not limit total result count. The client passes `$nextPageToken` and `$pageSize` to the API. A consumer must follow page tokens to completion or deliberately stop with a documented limit.

#### 3. Pagination consistency must be opted into

The `fetchPage` comments say no snapshot is requested unless `$snapshot: true` is provided. If objects change between page requests, later pages may repeat or skip objects. The `asyncIter` implementation in `createObjectSet.ts` requests `$snapshot: true` while iterating through the page tokens.

#### 4. Projection affects cost

The API comments state that without `$select`, the default property set is loaded. Reading fewer fields after the fetch does not avoid that cost. The client examples therefore recommend selecting only properties that are read.

#### 5. Generated action call surfaces return changed objects optionally

The examples show `applyAction` and `batchApplyAction` with `$returnEdits: true`, then discriminate on a result of type `edits` and inspect `editedObjectTypes`. This is a client-side convenience/contract, not proof of backend action atomicity; atomicity is described separately in Palantir's official action docs.

### Design implications for our own SDK

- Generate types from a versioned ontology definition rather than making every application hand-author string names.
- Make read projections explicit and small by default.
- Make pagination snapshot mode a required explicit choice for complete exports or audits.
- Return opaque, query-bound page tokens and stable total-count semantics only when supported.
- Distinguish action validation responses from committed edit results.
- Provide typed action results that can include changed object references and version stamps.
- Keep SDK ergonomics separate from server-side authorization and transaction guarantees.

### Evidence links

- Pinned source tree: https://github.com/palantir/osdk-ts/tree/5c6d916f5ab1874ea081402eddeb130960d4c9b4
- ObjectSet API: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/api/src/objectSet/ObjectSet.ts
- Fetch implementation: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/client/src/object/fetchPage.ts
- Object-set construction/iterator: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/client/src/objectSet/createObjectSet.ts
- SDK examples: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/typescript-sdk-docs-examples/src/typescriptOsdkExamples.ts
- Official backend architecture: https://www.palantir.com/docs/foundry/object-backend/overview
- Official paging semantics: https://www.palantir.com/docs/foundry/api/v2/general/overview/paging
