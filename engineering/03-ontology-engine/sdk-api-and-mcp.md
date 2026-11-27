# Sdk api and mcp

**Layer:** [03-ontology-engine](README.md) · **What it is:** How code and agents talk to the ontology: generated SDKs, REST API, developer console and Ontology MCP.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (3) · [Open-source implementations](#open-source-implementations) (3)

## Palantir

### 15. Developer surface: OSDK, Developer Console, Platform SDK, REST API

> Source: [general-references/02-palantir-ontology.md § 15. Developer surface: OSDK, Developer Console, Platform SDK, REST API](../../general-references/02-palantir-ontology.md#15-developer-surface-osdk-developer-console-platform-sdk-rest-api)

Plain English: external code (including agents) talks to the Ontology through a generated, typed client limited to the parts of the model an application was granted.

Technical detail:
- **OSDK** is generated per application from the selected subset of the ontology, for TypeScript (npm), Python (pip/Conda), Java (Maven), or any language via OpenAPI; it includes property names and descriptions; SuperRepo defines the ontology as code and regenerates the SDK locally. [Fact] https://www.palantir.com/docs/foundry/ontology-sdk/overview/ . OSDK 2.0 separates the runtime client (shared logic) from generated metadata, so SDK size scales with metadata and loads lazily; dates are returned as ISO 8601 strings. [Fact] `osdk-ts/dev-docs/design-rationale.md`
- **TypeScript OSDK surface:** `client(Type)` returns an object set with `where`, `union`, `intersect`, `subtract`, `pivotTo`, `nearestNeighbors`, `withProperties`, `narrowToType`, `aggregate`, `fetchPage` / `fetchPageWithErrors` (`$select`, `$pageSize`, `$nextPageToken`, `$orderBy`, `$includeRid`, `$snapshot`), `asyncIter`, `fetchOne`, `subscribe`, `experimental_asyncIterLinks`; actions via `client(Action).applyAction(params, { $returnEdits | $validateOnly })` and `batchApplyAction`. [Fact] `osdk-ts/packages/api/src/objectSet/ObjectSet.ts`, `packages/api/src/actions/Actions.ts`, `packages/client/src/actions/applyAction.ts`
- **Ontology as code** (`@osdk/maker`): `defineObject`, `defineLink`, `defineInterface`, `defineSpt` (shared property type), `defineValueType`, `defineAction` and helpers (`defineCreateObjectAction`, `defineModifyObjectAction`, `defineCreateOrModifyObjectAction`, `defineDeleteObjectAction` and interface variants), `defineFunction`, `defineOntology`, producing an "Ontology IR". [Fact] `osdk-ts/packages/maker/src/api/` . [Inference] This is the closest public artefact to Palantir's real definition schema and is the best template for the founder's own model format.
- **REST API v2** (Platform SDK mirrors it): ontologies list/get/full metadata; object types, outgoing link types, full metadata, edits history; action types (including search and full metadata); `objects/{type}` list, get, search, aggregate, count, loadLinks; `objects/{type}/{pk}/links/{linkType}`; `objectSets/loadObjects`, `aggregate`, `createTemporary`, `loadLinks`, `loadObjectsMultipleObjectTypes`, `loadObjectsOrInterfaces`; interfaces search, aggregate, links; actions `apply`, `applyBatch`, `applyWithOverrides`, `applyBatchWithOverrides`; queries execute; scenarios; transactions edits; value types; attachments, media, time series, geotemporal series, cipher text. Scopes: reads need `api:ontologies-read`; applying actions needs `api:ontologies-read` and `api:ontologies-write`. [Fact] `foundry-platform-python/foundry_sdk/v2/ontologies/*.py`
- **Developer Console** applications bundle an OAuth client, generated SDKs and docs, permissions, metrics (request volume, success rate, latency), optional hosting, repo, Marketplace packaging and an MCP server. Default limit 1,000 data resources and restrictions per application. Restricted applications cap resources (OSDK tab: object types, interfaces, actions, functions; Platform tab: projects) and operations (per API namespace); scopes `api:use-*-read/write` for public APIs only. Apps created after 1 June 2025 cannot call internal service endpoints. Long-lived scoped tokens can be issued. [Fact] https://www.palantir.com/docs/foundry/developer-console/overview/ , https://www.palantir.com/docs/foundry/developer-console/application-restrictions/
- Row and column controls apply at read time only and do not extend to what the client does with the payload. [Fact] OSDK overview page.

### 16. Ontology MCP

> Source: [general-references/02-palantir-ontology.md § 16. Ontology MCP](../../general-references/02-palantir-ontology.md#16-ontology-mcp)

Plain English: a switch that turns a Developer Console app into an MCP server, so Claude, Copilot or any MCP client can read objects and call actions under the same rules as the app.

Technical detail:
- Enable on the app's MCP page; restrictions on the app decide what is exposed; MCP Hub lists servers on the enrollment. [Fact] https://www.palantir.com/docs/foundry/ontology-mcp/getting-started/
- Tool mapping: object types via one SQL tool over the exposed types; one tool per action type; one tool per selected query function; AIP Logic functions and chatbots can be exposed as tools so agents can call agents. [Fact] https://www.palantir.com/docs/foundry/ontology-mcp/sample-architecture/ . Example tool names (`search-osdk-todo-task`, `create-osdk-todo-task` with required `title`, `project_id`) and per-action "agent tool description" editable in Ontology Manager; optional response semantics (`data_path`, Adaptive Card template). [Fact] https://www.palantir.com/docs/foundry/ontology-mcp/mcp-tools-and-agent-configuration/
- Auth reuses the app's OAuth client: authorization code (per user, token reflects their permissions) or client credentials (service user, confidential client); no separate MCP auth. [Fact] https://www.palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/
- Positioning: Ontology MCP is for consumers reading and writing data; "Palantir MCP" is for builders changing ontology structure and cannot write ontology data. External LLM use moves data outside Palantir AIP, so governance review is advised. [Fact] https://www.palantir.com/docs/foundry/ontology-mcp/overview/ . All agent actions through Ontology MCP are recorded in the ontology. [Vendor claim] https://www.palantir.com/docs/foundry/ontology-mcp/example-mcp-workflows/
- The SQL tool's dialect and limits are not documented on the pages I opened; "Ontology SQL query" appears as a billed query type (5 compute-seconds minimum). [Fact for billing; Unverified for SQL dialect]

### A17. OSDK and Developer Console (custom apps)

> Source: [general-references/05-palantir-apps-infra.md § A17. OSDK and Developer Console (custom apps)](../../general-references/05-palantir-apps-infra.md#a17-osdk-and-developer-console-custom-apps)

- **OSDK** ([Fact](https://www.palantir.com/docs/foundry/ontology-sdk/overview/)):
  - SDKs for TypeScript (npm, with React bindings), Python (pip/conda) and Java (Maven), plus OpenAPI for other languages.
  - Generated from *only* the entities added to the application.
  - Enforcement is at read time, by restricted views and object/property security policies. Payloads are not governed after delivery.
  - Not branchable under Global Branching ([Fact](https://www.palantir.com/docs/foundry/getting-started/foundry-platform-summary-llm/)). However, Developer Console gained Global Branching support on 15 Oct 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-10)).
  - **The two sources disagree.** The summary page may be stale.
- **Real-time subscriptions** in osdk-ts ([Fact, code](https://github.com/palantir/osdk-ts)):
  - a WebSocket to `/api/v2/ontologySubscriptions/ontologies/{ontologyRid}/streamSubscriptions`, with the token passed as subprotocol `Bearer-<token>`;
  - message types `objectSetChanged`, `refreshObjectSet`, `subscribeResponses` and `subscriptionClosed`;
  - a minimum reconnect delay of 5 s.
- **Developer Console app components** ([Fact](https://www.palantir.com/docs/foundry/developer-console/overview/)): OAuth client, generated SDKs and docs, sharing, long-lived scoped tokens, metrics (volume, success, latency), optional hosting on a subdomain, a linked repository, Marketplace packaging, and an **MCP server** that exposes object types, actions and query functions as tools. The default cap is 1,000 data resources plus restrictions per app.
- **Restrictions model** ([Fact](https://palantir.com/docs/foundry/developer-console/application-restrictions/)):
  - **Effective token** = user (or service-user) permissions ∩ app restrictions ∩ requested scope.
  - **Restricted app** (the default): explicit object types, interfaces, actions and functions (the OSDK tab), plus explicit projects and API namespaces (the platform tab).
  - **Scopes** are operation-only: `api:use-ontologies-read` and `api:use-ontologies-write` by default. There are no implicit grants across namespaces. A few endpoints are exempt (oauth2, me, authz, token, organizations).
  - **Grant types:** client credentials acts as a service user and needs a confidential client. Authorization code acts as the user, and a public client must use user permissions.
  - Switching an app to unrestricted wipes its configured restrictions.
- **Pro-code agents** get scoped OSDK and MCP credentials "out of the box", and published agents are callable from Workshop or the OSDK (9 Jul 2026) ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-07)).
- **SQL functions:** Ontology SQL and SQL functions went GA 12 Nov 2026, usable in Workshop, Actions, Automate and the OSDK ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-11)).

## Open-source implementations

### 2. Palantir's public SDKs: osdk-ts, foundry-platform-python, conjure

> Source: [open-source-references/palantir-osdk.md](../../open-source-references/palantir-osdk.md) (code study)

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

### Repository audit — palantir/osdk-ts

> Source: [open-source-references/palantir-osdk.md](../../open-source-references/palantir-osdk.md) (repository audit)

**Role:** client SDK and public ontology contract reference.  
**Repository:** [palantir/osdk-ts](https://github.com/palantir/osdk-ts), branch `main`.  
**Validation:** client interface and action method inspected; no tests run.

#### Client type surface

`packages/client/src/Client.ts` defines a typed callable client. Passing an object-type definition returns a typed `ObjectSet`; passing an interface definition returns a minimal object set; passing an action definition returns an action signature; query definitions are typed separately. `fetchMetadata()` can retrieve metadata for object, interface, action or query definitions.

This shows an API contract where ontology metadata drives compile-time types and object-set operations. It is a strong developer-experience reference: generated ontology definitions give application code typed object properties and typed action parameters rather than generic unvalidated JSON.

#### Action execution surface

`packages/client/src/actions/applyAction.ts` maps compile-time typed parameters to the server API. It passes branch/scenario context and can request returned edits. The current action API supports a `VALIDATE_ONLY` mode when `$validateOnly` is set and `VALIDATE_AND_EXECUTE` otherwise. An invalid validation result becomes an `ActionValidationError`. The SDK can request edit details, including V2 edit results with deletions.

#### What this proves—and does not

It proves the client contract exposes typed object-set and action operations and validation-only mode. It does **not** reveal the server-side validation algorithm, database transaction model, authorization internals, indexing service, persistence engine or cross-system writeback implementation.

#### Adoption recommendation

Learn from metadata-generated type-safe clients, explicit validation-only calls, typed action parameter remapping, returned edit structures, branch/scenario context and semantic version compatibility. Do not mistake a client SDK for a reusable ontology backend.

### Palantir OSDK TypeScript — Phase 2 client-contract audit

> Source: [open-source-references/palantir-osdk.md](../../open-source-references/palantir-osdk.md) (repository audit)

**Repository:** https://github.com/palantir/osdk-ts  
**Commit inspected:** `5c6d916f5ab1874ea081402eddeb130960d4c9b4`  
**Date:** 27 November 2026  
**Validation:** source files read remotely; no package install, build, tests or Foundry API calls were executed.

#### Scope

This is a focused source audit to deepen the original Palantir OSDK TypeScript research. It examines the public typed client, object-set paging and action examples. It does not claim access to Palantir's private ontology backend.

#### Files inspected

- `packages/api/src/objectSet/ObjectSet.ts`
- `packages/client/src/object/fetchPage.ts`
- `packages/client/src/objectSet/createObjectSet.ts`
- `packages/typescript-sdk-docs-examples/src/typescriptOsdkExamples.ts`

#### Findings

##### 1. ObjectSet is a typed query builder surface

The public `ObjectSet` interfaces are generic over object/interface definitions, property keys, selections and modifiers. This lets the generated ontology SDK constrain query projections and returned property types at compile time. This confirms that the developer surface is not simply a bag of endpoint strings.

##### 2. Page size is not a total-result cap

The `fetchPage` contract comments state that `$pageSize` sizes one page and does not limit total result count. The client passes `$nextPageToken` and `$pageSize` to the API. A consumer must follow page tokens to completion or deliberately stop with a documented limit.

##### 3. Pagination consistency must be opted into

The `fetchPage` comments say no snapshot is requested unless `$snapshot: true` is provided. If objects change between page requests, later pages may repeat or skip objects. The `asyncIter` implementation in `createObjectSet.ts` requests `$snapshot: true` while iterating through the page tokens.

##### 4. Projection affects cost

The API comments state that without `$select`, the default property set is loaded. Reading fewer fields after the fetch does not avoid that cost. The client examples therefore recommend selecting only properties that are read.

##### 5. Generated action call surfaces return changed objects optionally

The examples show `applyAction` and `batchApplyAction` with `$returnEdits: true`, then discriminate on a result of type `edits` and inspect `editedObjectTypes`. This is a client-side convenience/contract, not proof of backend action atomicity; atomicity is described separately in Palantir's official action docs.

#### Design implications for our own SDK

- Generate types from a versioned ontology definition rather than making every application hand-author string names.
- Make read projections explicit and small by default.
- Make pagination snapshot mode a required explicit choice for complete exports or audits.
- Return opaque, query-bound page tokens and stable total-count semantics only when supported.
- Distinguish action validation responses from committed edit results.
- Provide typed action results that can include changed object references and version stamps.
- Keep SDK ergonomics separate from server-side authorization and transaction guarantees.

#### Evidence links

- Pinned source tree: https://github.com/palantir/osdk-ts/tree/5c6d916f5ab1874ea081402eddeb130960d4c9b4
- ObjectSet API: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/api/src/objectSet/ObjectSet.ts
- Fetch implementation: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/client/src/object/fetchPage.ts
- Object-set construction/iterator: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/client/src/objectSet/createObjectSet.ts
- SDK examples: https://github.com/palantir/osdk-ts/blob/5c6d916f5ab1874ea081402eddeb130960d4c9b4/packages/typescript-sdk-docs-examples/src/typescriptOsdkExamples.ts
- Official backend architecture: https://www.palantir.com/docs/foundry/object-backend/overview
- Official paging semantics: https://www.palantir.com/docs/foundry/api/v2/general/overview/paging

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
