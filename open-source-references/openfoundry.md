# The "open Foundry" family (CapTrix/openfoundry and forks)

| | |
|---|---|
| **Repository** | <https://github.com/CapTrix/openfoundry>, <https://github.com/Przyval/openfoundry>, <https://github.com/cloudbadal007/foundry-ontology-open>, <https://github.com/jachenms/OntoForge> |
| **Why it matters** | The only large open re-implementations of Foundry; useful for how action types, policies, outbox and tenant RLS can be laid out. |
| **What to take** | Action-type authorization-policy fields, confirm-with-justification, Przyval's RLS / resource-grant / marking migrations, OntoForge's confirm-preview handshake and JSON rule vocabulary. |
| **What not to copy** | CapTrix code (AGPL-3.0); its webhook writeback runs before action planning; foundry-ontology-open's eval()-based rules. |
| **Feeds** | [01-security/tenancy-and-isolation](../engineering/01-security/tenancy-and-isolation.md), [03-ontology-engine/object-storage-and-indexing](../engineering/03-ontology-engine/object-storage-and-indexing.md), [03-ontology-engine/schema-evolution-and-branching](../engineering/03-ontology-engine/schema-evolution-and-branching.md), [05-actions-and-rules/action-gate-and-transactions](../engineering/05-actions-and-rules/action-gate-and-transactions.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** **ignore as code** because of AGPL. As design reference only: the action-type authorization-policy fields, and confirmation with justification. [Inference]

> **Source re-check 28 Nov 2026 (code):** [`Przyval/openfoundry@96ff1de`](https://github.com/Przyval/openfoundry/tree/96ff1de) — structures cited below verified present; no licence change.

## From the open-source code study: 3. The "open Foundry" family

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

Plain-English explanation: several projects call themselves "open-source Foundry". They range from a full platform rewrite to an infrastructure skeleton with no ontology code yet.

- **CapTrix/openfoundry**: AGPL-3.0, last commit 2026-05-20 (stale for six months). It is large: about 528k lines of Go plus 358k of TS, 51 service directories and 36 libraries. [Fact]. Its README links to `openfoundry/openfoundry-go` as the project home, and the last merge commit references a `DioCrafts` contributor branch. I could not clone either upstream (authentication required, so it is probably private, renamed or deleted) and could not search the web. [Unverified]. What the code shows:
  - Action types live in Postgres rows with `operation_kind` (14 kinds, including `invoke_function`, `invoke_webhook`, interface create/modify/delete and interface links), `input_schema`, `form_schema` (sections and conditional parameter overrides), `confirmation_required`, `permission_key` and `authorization_policy`. The policy object has `required_permission_keys`, `any_role`, `all_roles`, `attribute_equals`, `allowed_markings`, `minimum_clearance` and `deny_guest_sessions`. [Fact] ([libs/ontology-kernel/models/action_type.go](https://github.com/CapTrix/openfoundry/blob/HEAD/libs/ontology-kernel/models/action_type.go))
  - Execution (`libs/ontology-kernel/handlers/actions/execute.go`, 2,735 lines) has `planAction`, `planPreview`, `simulateTargetAfterPreview` and `ensureConfirmationJustification`. [Fact]
  - Schema changes are published through a transactional outbox (`outbox.events`, sent to Kafka by Debezium) on topics such as `ontology.action_type.changed.v1`, with before/after envelopes. [Fact] ([services/ontology-actions-service/internal/repo/events.go](https://github.com/CapTrix/openfoundry/blob/HEAD/services/ontology-actions-service/internal/repo/events.go))
  - Comments say the Go code "mirrors" Rust structs, so it is a port of a Rust codebase. `proto/ontology/action.proto` is a two-line stub. [Fact]
  - Verdict: **ignore as code** because of AGPL. As design reference only: the action-type authorization-policy fields, and confirmation with justification. [Inference]
- **Przyval/openfoundry**: Apache-2.0, TypeScript (about 114k lines), last commit 2026-11-03. It describes itself as a local Foundry *emulator* for development and testing. [Vendor claim] ([README](https://github.com/Przyval/openfoundry/blob/HEAD/README.md))
  - `db/migrations/009_multi_tenancy.sql` adds `org_rid` to about 40 tables. It enables and forces RLS on 16 tables with policies of the form `USING (org_rid = current_setting('app.org_rid', true)) WITH CHECK (...)`, and creates a dedicated `openfoundry_app` login role. `packages/db/src/pg-store.ts` wraps queries in `BEGIN; SET LOCAL app.org_rid = $1; ...; COMMIT`. [Fact]
  - `014_resource_authorization.sql` models Foundry-style roles held *on a resource*: `resource_role_grants(resource_rid, principal_type user|group, principal_id, role_id owner|editor|viewer|discoverer)`, plus `resource_policies(resource_rid, organizations[], markings[])`. [Fact]
  - `packages/markings/src/marking-evaluator.ts`: a user must hold *all* mandatory markings and *at least one* discretionary marking if any are present. Unknown markings are treated as mandatory. [Fact]
  - Action submission criteria are always an empty array (`services/svc-actions/src/routes/v1/actions.ts`), so its action logic is shallow. [Fact]
  - Verdict: **copy the design** of the RLS, resource-grant and marking migrations (Apache-2.0 also allows copying code with attribution). Ignore the services.
- **smilebank7/OpenFoundry**: Apache-2.0, last commit 2026-02-22. Its status line says "Phase 0 — Infrastructure Skeleton". It is a Compose file with Postgres 17, MinIO, Valkey, Trino 479, Keycloak 26.5, OPA 1.13, Dagster 1.12, OpenMetadata 1.11, Superset 6 and Grafana, plus one Rego policy gating Trino schemas by group. The README says the ontology layer is not implemented. [Fact]. Verdict: **ignore**. It is useful only as evidence that "compose existing OSS" stacks are heavy.
- **cloudbadal007/foundry-ontology-open**: MIT, Python, 1,848 lines, last commit 2026-07-19. Validation rules are strings run through `eval(rule.expression, {"__builtins__": {}}, context)`, which is a known-unsafe sandbox. `PermissionCheck.can_read` returns true for any user with at least one role. Markings are a linear 0–3 level scale. It also has OWL/SHACL exporters. [Fact] ([core/action_type.py](https://github.com/cloudbadal007/foundry-ontology-open/blob/HEAD/foundry_ontology/core/action_type.py), [governance/permissions.py](https://github.com/cloudbadal007/foundry-ontology-open/blob/HEAD/foundry_ontology/governance/permissions.py)). Verdict: **ignore**, except as a warning: never store rules as code strings.
- **jachenms/OntoForge**: MIT, Python (2,266 lines) plus a 95 KB single-file HTML workbench, last commit 2026-10-24, bilingual Chinese/English.
  - Action rules are declarative JSON with nine operators (`eq, neq, in, notIn, gt, lt, ge, le, contains`).
  - Edits use five operators (`set, create, delete, addLink, removeLink`).
  - Side effects are limited to `notify` and `webhookLog`.
  - A `submissionCriteria.requireConfirm` setting makes `run_action` return `{needConfirm: true, preview}` until the call is repeated with `confirmed`.
  - Schema branches are deep copies of the schema with name-aligned diffs and merge proposals. Instance data is global, not branched.

  [Fact] ([python/src/ontoforge/actions.py](https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/actions.py), [branches.py](https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/branches.py)). Its `docs/research/逆向分析-Foundry-Ontology.md` is a Chinese evidence-labelled reverse-analysis of Foundry docs, useful as a secondary source. Verdict: **copy the design** of the confirm-preview handshake and the JSON rule vocabulary.

## Repository audit: Repository audit — CapTrix/openfoundry

> Source: former `15-repository-audits/openfoundry-captix.md` (Phase 2 source inspection, not executed).

**Role in research:** closest public multi-service attempt at a Foundry-like ontology platform; important to study for system boundaries and failure modes.  
**Snapshot:** `main`; source paths inspected on 27 November 2026.  
**Licence:** AGPL-3.0 at repository root. This is a material constraint for commercial reuse; obtain legal review before copying/deriving code.  
**Validation:** source inspected remotely; no clone/build/tests run.

### Repository identity and lineage

Do not treat every repository named OpenFoundry as one codebase. The archive separately lists the Rust workspace, CapTrix's Go port, the Shamdon Go port, the pa4s fork, the Przyval TypeScript emulator and small operational-ontology tutorial. This audit applies only to `CapTrix/openfoundry`.

The CapTrix README describes 50 services and 36 top-level libs; the current tree count observed in the prior audit was 51 service directories and 37 library directories. State the counting convention and branch snapshot whenever reporting that number. An earlier ADR describes ontology parity as 6/10 and lists gaps, but the live branch has since gained additional ontology-definition handlers; that older estimate must not be repeated as a current score.

### Architecture map observed

- `ontology-definition-service`: schema/type metadata, definitions, property/link/interface/group/shared-property resources, versioning and batch-save.
- `object-database-service`: runtime object and link storage, currently backed by Cassandra/Scylla adapters in production; local/in-memory paths exist for dev/test.
- `ontology-indexer`: Kafka-consumer pipeline projecting object/link/type events into search indexes.
- `ontology-query-service`: query/read surfaces for narrower object access.
- `ontology-actions-service` plus `libs/ontology-kernel`: action validation/execution and writeback helpers.
- `libs/outbox`: PostgreSQL transactional outbox primitives.
- `libs/authz-cedar-go`: Cedar policy evaluation and audit emission.
- Other services address tenancy, identity, ingestion, search, agents, pipeline, lineage, retrieval and audit.

The service count is not evidence of integrated feature completeness. The key audit step is confirming whether each module is registered, whether the expected identity context is propagated, and whether the same event/policy contract is used by every route.

### Trace A — ontology definition batch mutation

**Code:** [`batch_save.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/repo/batch_save.go), [`events.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/repo/events.go), [`properties_links.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/handlers/properties_links.go).

`Repo.SaveBatch()` begins one PostgreSQL transaction, creates an audit writer bound to that same transaction, then dispatches each edit by resource/operation. Domain validation and version conflicts are returned as per-edit statuses. If any edit fails, earlier successful entries are downgraded to `skipped` and the function returns without commit; deferred rollback discards all writes. If every edit succeeds, it commits once. Supported resource cases in the inspected code include object types, link types, object-type groups, properties and shared property types.

`EnqueueSchemaEvent()` accepts the caller's `pgx.Tx`; comments require it to be the same transaction as the primary mutation. It creates before/after snapshots and a deterministic event ID derived from aggregate, aggregate ID, event type, version and payload, then inserts through the outbox helper. This is a strong local atomicity pattern: schema edit + audit + outbox intent can commit or roll back together when wired through the same transaction.

**What is implemented:** batch mutation transaction structure and same-transaction event enqueue are visible in code.  
**What is not established:** every one-shot CRUD handler necessarily uses the same semantics, every projection consumes the event, and full historical schema evolution/branch semantics are complete.

### Trace B — object data write and outbox across stores

**Code:** [`writeback.go`](https://github.com/CapTrix/openfoundry/blob/main/libs/ontology-kernel/domain/writeback.go), [`outbox.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/handlers/outbox.go).

The kernel writeback helper writes the primary object store first (Cassandra adapter with optimistic version handling), then opens a PostgreSQL transaction to enqueue an event. It derives a deterministic UUIDv5 event ID from tenant/aggregate/object/version. If opening or committing the PG transaction fails after the primary write has succeeded, the helper returns a typed `WritebackError` containing event ID and committed version so the caller can retry deterministically. A repeated call that sees the expected target version can be treated as an idempotent retry before re-enqueueing the same event ID.

This is **not a single atomic transaction across Cassandra and PostgreSQL**. The helper explicitly models a partially committed state: object data may exist while the outbox row is absent. Deterministic retry metadata is the recovery approach, and callers need to honour it. A robust implementation should have explicit pending/reconciliation visibility rather than rely only on application callers to notice the error.

### Trace C — action ordering and external side effects

**Code:** [`execute.go`](https://github.com/CapTrix/openfoundry/blob/main/libs/ontology-kernel/handlers/actions/execute.go).

The inspected action handler runs configured webhook writeback before calling `planAction()`. If the later action plan rejects the proposed mutation, the webhook may already have produced an external side effect. This is a code-ordering observation, not a proof every configured webhook is destructive. The correct lesson is to define precisely whether a pre-plan webhook is a read/parameter-enrichment hook or a mutating write; do not allow external mutation before local authorization, preconditions and an approved action plan.

**Proposed safe sequence:** authenticate → authorize → parse/validate input → load current state → construct pure edit plan → evaluate invariants/preconditions → preview/dry run → obtain required approval → commit local object changes + audit + outbox atomically → asynchronously execute external effects with idempotency/reconciliation.

### Trace D — indexer retries and dead-letter handling

**Code:** [`runtime.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-indexer/internal/runtime/runtime.go).

The inspected Kafka loop fetches a message, processes it with configured retries and exponential backoff, optionally sends a failed message to the DLQ, and commits the original offset after successful processing or after successful DLQ publication. Default retry values in the helper are 100 ms initial backoff and 2 s cap when not configured; attempts are clamped to at least one. Unknown topics are logged and skipped as decode-error outcome. This is a useful recovery model, but the audit still needs to trace malformed payload handling, consumer offset/configuration, projection idempotency, replay and storage/index divergence.

### Trace E — security boundary and wiring risk

**Code:** [`cedar_gate.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/handlers/cedar_gate.go), [`handlers.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/handlers/handlers.go), [`server.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/server/server.go), [`main.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/cmd/object-database-service/main.go).

The object DB HTTP service is described as internal-only and relies on an upstream gateway to establish tenant context (including `x-of-tenant`). In the inspected constructors, `runCedarGate` treats a nil Cedar engine as allow, and schema validation can be absent when the schema resolver is nil. The service main wiring examined did not make the complete Cedar/schema wiring obvious. This is a **potential fail-open configuration risk**, not a demonstrated exploitable vulnerability: verify the deployed ingress, gateway header sanitisation, environment wiring, network policy and all handler construction paths before drawing a security conclusion.

The important engineering requirement is end-to-end enforcement. Internal-only is a valid architecture boundary only if it is actually enforced at network and identity boundaries, and headers such as tenant ID are overwritten from trusted identity rather than accepted from arbitrary callers.

### Current ontology surface

The current `properties_links.go` handlers explicitly add property and link-type operations; the definition service's current handlers also expose other resource families and batch-save/audit functionality. This corrects an older PoC-era ADR/documentation claim that properties/link types were deferred. It does not prove the full Foundry type system, object-set algebra, derived properties or all runtime enforcement are complete.

### Strengths

- Clear decomposition into schema metadata, object store, query, action, indexing and auxiliary services.
- Same-transaction audit/outbox for metadata batch edits.
- Deterministic event IDs and surfaced retry metadata for cross-store writeback.
- Explicit action and indexing pipeline modules.
- Cedar policy engine as a reusable authorization component.

### Gaps and risks to investigate

1. Confirm every object mutation path publishes object/link events; compare high-level ontology routes with low-level routes. The inspected bridge CRUD methods did not consistently expose event enqueue calls in the excerpt, so trace route registration and helper indirection before concluding.
2. Determine if search indexes are strictly disposable projections and how rebuild/replay handles deleted links and schema version changes.
3. Verify tenant and marking enforcement on every read, list, search, query, cache and action path.
4. Verify Cedar is mandatory in production wiring and cannot silently default to allow.
5. Remove or isolate any side-effecting webhook that runs before action validation/authorization.
6. Add explicit reconciliation state for primary-store success with missing outbox/event.
7. Assess feature parity and test coverage at pinned commit, not from service count or old ADR score.

### Adoption recommendation

**Learn from:** service boundaries, PG schema batch transaction, transactional outbox helper, deterministic idempotency IDs, projection indexer, Cedar integration.  
**Adapt cautiously:** object database storage architecture and service split.  
**Avoid copying directly:** AGPL-3.0 implementation into a closed-source product without legal review; pre-plan mutating webhook order; fail-open defaults; reliance on cross-store retry without operator-visible reconciliation.

## Repository audit: OpenFoundry: action writeback and tenant enforcement — Phase 2

> Source: former `15-repository-audits/openfoundry-action-and-tenancy-phase2.md` (Phase 2 source inspection, not executed).

**Snapshot:** `CapTrix/openfoundry` main at `090e3f19b6b90fb77c23d779a318957c937067b2` (27 November 2026).  
**Evidence level:** source inspected; selected test sources inspected; no build or tests run.  
**License note:** repository README declares AGPL-3.0-only. Treat it as a behavioural reference unless counsel approves a reuse strategy.

### Scope actually inspected

- `libs/auth-middleware/tenant.go` and `tenant_test.go`
- `libs/ontology-kernel/domain/action_write_transaction.go` and `action_write_transaction_test.go`
- `libs/ontology-kernel/handlers/actions/execute.go`
- `libs/ontology-kernel/handlers/actions/side_effects.go`
- Related action logs, object/link write and test paths identified in the repository tree.

Pinned source links:

- [tenant.go](https://github.com/CapTrix/openfoundry/blob/090e3f19b6b90fb77c23d779a318957c937067b2/libs/auth-middleware/tenant.go)
- [tenant tests](https://github.com/CapTrix/openfoundry/blob/090e3f19b6b90fb77c23d779a318957c937067b2/libs/auth-middleware/tenant_test.go)
- [action write transaction](https://github.com/CapTrix/openfoundry/blob/090e3f19b6b90fb77c23d779a318957c937067b2/libs/ontology-kernel/domain/action_write_transaction.go)
- [action write transaction tests](https://github.com/CapTrix/openfoundry/blob/090e3f19b6b90fb77c23d779a318957c937067b2/libs/ontology-kernel/domain/action_write_transaction_test.go)
- [action execution handler](https://github.com/CapTrix/openfoundry/blob/090e3f19b6b90fb77c23d779a318957c937067b2/libs/ontology-kernel/handlers/actions/execute.go)
- [webhook and side-effect handlers](https://github.com/CapTrix/openfoundry/blob/090e3f19b6b90fb77c23d779a318957c937067b2/libs/ontology-kernel/handlers/actions/side_effects.go)

### Finding 1 — tenant extraction has an explicit missing-tenant state

`TenantFromContext` reads the authenticated claims and returns `(uuid.Nil, false)` if claims are absent or `OrgID` is missing. Its comment explicitly warns that a service which gates tenant rows must call this before repository access; allowing `uuid.Nil` to enter a tenant-scoped query can collapse distinct tenants into one bucket.

`TenantContextFromClaims` derives the tenant from the validated claim `OrgID`. It also builds a `ScopeID` fallback from the subject if `OrgID` is missing, while `TenantID` remains nil. That subject-level scope is useful for stable throttling keys, but it is not proof of a valid organisation/tenant partition. The anonymous context uses the literal scope `global`, which must not be mistaken for authorization to read tenant-owned records.

The inspected tests cover present/missing/unauthenticated org context, tier selection, quota selection and subject-scope fallback. These are useful unit cases, but they do not by themselves prove that every route, data adapter, background job, cache or agent tool rejects a missing or forged tenant.

**Design implication (proposed):** represent authenticated principal, tenant, workspace and resource scope as separate typed fields. For tenant-owned business data, fail closed when the tenant is absent. Never infer tenant identity from a body field or caller-controlled header. A single-user/no-tenant mode, if required, must be an explicitly modelled tenancy mode with separate policy—not a nil/global default.

### Finding 2 — `ActionWriteTransaction` is a staged coordinator, not yet proof of ACID atomicity

The helper stages object and link writes in memory. On `Commit`, the non-branched path then performs object `Put` calls, link `Put`/`Delete` calls and finally appends an action-log audit event. The branch path writes objects and links to the branch overlay in sequence, then appends the audit record. The interface passed to the helper exposes independent stores; the inspected function does not obtain one shared transaction handle spanning them.

The deterministic event ID is derived from tenant, branch, action, actor, policy and staged mutations. That is valuable for deduplication in a compatible store. It is not, by itself, a rollback mechanism. If a later link write or audit append fails after an earlier object write succeeded, the shown coordinator returns an error but contains no compensating rollback loop. The name and comments should therefore not be interpreted as a distributed ACID guarantee without verifying the actual backing store adapters and their transaction semantics.

The test `TestActionWriteTransactionMaterializesOnlyOnCommitAndAudits` verifies that nothing is visible before `Commit` and verifies the successful object/link/audit path. The branch test verifies writes land in the overlay rather than main. The inspected tests do not inject a failure at the second object, first link, or audit append to prove no partial state remains.

**Design implication (proposed):** put the canonical state mutation and its outbox/event record in the same database transaction whenever they share a relational source of truth. Treat graph, full-text and vector indexes as projections updated from the outbox. For unavoidable multi-system writes, use an explicit saga/state machine with idempotency keys, retries, reconciliation and compensating actions; do not market it as atomic.

### Finding 3 — webhook writeback runs before action planning/validation

`ExecuteAction` documents this order: (1) configured webhook writeback, (2) plan and execute, (3) audit POST, (4) notification fan-out, (5) webhook side-effect fan-out. In the handler, `runWebhookWriteback` is called before `planAction` and the later validation/execution path. The webhook output is merged into the action parameter set.

`invokeRegisteredWebhook` sends an HTTP POST to connector management and may obtain a service token scoped for the action webhook. The side-effect fan-out is described as best effort; its errors are persisted/logged but not returned to the action. The inspected call path does not establish that a pre-planning webhook is read-only. If it mutates an external system, a later invalid action can still leave an external effect.

**Design implication (proposed):** separate four stages explicitly:

1. **Prepare:** read-only enrichment or deterministic parameter derivation.
2. **Validate:** permissions, target scope, preconditions, invariants and approval state.
3. **Commit:** canonical object mutation plus outbox in one transaction.
4. **Dispatch:** post-commit external work with a stable idempotency key and durable status/reconciliation.

If a webhook is actually a required write-before-commit, model it as a saga step with a declared compensation or an externally visible pending state. Do not hide it in a generic “writeback” label.

### Highest-value follow-up tests

- Missing `OrgID` against every tenant-owned route must deny before a repository is touched.
- Forged body/header tenant differs from the signed claim; request must stay in the signed tenant.
- Cross-tenant object ID, relation endpoint, document ID, search result and agent tool target must deny with no existence leak.
- Inject failure after object #1, after link #1 and during audit/outbox append; verify rollback or a durable recoverable partial-state record.
- Re-submit the same action idempotency key concurrently; exactly one canonical state transition and one logical effect must result.
- Force webhook success followed by plan validation failure; assert no irreversible side effect occurred, or assert explicit saga compensation/reconciliation.
- Crash after database commit but before webhook dispatch; outbox dispatcher must eventually deliver once logically, with retries safe.

### What remains unverified

Route registration and every service/data-adapter tenant filter were not exhaustively traced in this pass. Backing-store transaction guarantees were not tested. The external webhook receiver's idempotency behaviour is outside this repository boundary. No tests were run.
