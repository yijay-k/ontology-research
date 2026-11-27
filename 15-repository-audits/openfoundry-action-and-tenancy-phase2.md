# OpenFoundry: action writeback and tenant enforcement — Phase 2

**Snapshot:** `CapTrix/openfoundry` main at `090e3f19b6b90fb77c23d779a318957c937067b2` (27 November 2026).  
**Evidence level:** source inspected; selected test sources inspected; no build or tests run.  
**License note:** repository README declares AGPL-3.0-only. Treat it as a behavioural reference unless counsel approves a reuse strategy.

## Scope actually inspected

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

## Finding 1 — tenant extraction has an explicit missing-tenant state

`TenantFromContext` reads the authenticated claims and returns `(uuid.Nil, false)` if claims are absent or `OrgID` is missing. Its comment explicitly warns that a service which gates tenant rows must call this before repository access; allowing `uuid.Nil` to enter a tenant-scoped query can collapse distinct tenants into one bucket.

`TenantContextFromClaims` derives the tenant from the validated claim `OrgID`. It also builds a `ScopeID` fallback from the subject if `OrgID` is missing, while `TenantID` remains nil. That subject-level scope is useful for stable throttling keys, but it is not proof of a valid organisation/tenant partition. The anonymous context uses the literal scope `global`, which must not be mistaken for authorization to read tenant-owned records.

The inspected tests cover present/missing/unauthenticated org context, tier selection, quota selection and subject-scope fallback. These are useful unit cases, but they do not by themselves prove that every route, data adapter, background job, cache or agent tool rejects a missing or forged tenant.

**Design implication (proposed):** represent authenticated principal, tenant, workspace and resource scope as separate typed fields. For tenant-owned business data, fail closed when the tenant is absent. Never infer tenant identity from a body field or caller-controlled header. A single-user/no-tenant mode, if required, must be an explicitly modelled tenancy mode with separate policy—not a nil/global default.

## Finding 2 — `ActionWriteTransaction` is a staged coordinator, not yet proof of ACID atomicity

The helper stages object and link writes in memory. On `Commit`, the non-branched path then performs object `Put` calls, link `Put`/`Delete` calls and finally appends an action-log audit event. The branch path writes objects and links to the branch overlay in sequence, then appends the audit record. The interface passed to the helper exposes independent stores; the inspected function does not obtain one shared transaction handle spanning them.

The deterministic event ID is derived from tenant, branch, action, actor, policy and staged mutations. That is valuable for deduplication in a compatible store. It is not, by itself, a rollback mechanism. If a later link write or audit append fails after an earlier object write succeeded, the shown coordinator returns an error but contains no compensating rollback loop. The name and comments should therefore not be interpreted as a distributed ACID guarantee without verifying the actual backing store adapters and their transaction semantics.

The test `TestActionWriteTransactionMaterializesOnlyOnCommitAndAudits` verifies that nothing is visible before `Commit` and verifies the successful object/link/audit path. The branch test verifies writes land in the overlay rather than main. The inspected tests do not inject a failure at the second object, first link, or audit append to prove no partial state remains.

**Design implication (proposed):** put the canonical state mutation and its outbox/event record in the same database transaction whenever they share a relational source of truth. Treat graph, full-text and vector indexes as projections updated from the outbox. For unavoidable multi-system writes, use an explicit saga/state machine with idempotency keys, retries, reconciliation and compensating actions; do not market it as atomic.

## Finding 3 — webhook writeback runs before action planning/validation

`ExecuteAction` documents this order: (1) configured webhook writeback, (2) plan and execute, (3) audit POST, (4) notification fan-out, (5) webhook side-effect fan-out. In the handler, `runWebhookWriteback` is called before `planAction` and the later validation/execution path. The webhook output is merged into the action parameter set.

`invokeRegisteredWebhook` sends an HTTP POST to connector management and may obtain a service token scoped for the action webhook. The side-effect fan-out is described as best effort; its errors are persisted/logged but not returned to the action. The inspected call path does not establish that a pre-planning webhook is read-only. If it mutates an external system, a later invalid action can still leave an external effect.

**Design implication (proposed):** separate four stages explicitly:

1. **Prepare:** read-only enrichment or deterministic parameter derivation.
2. **Validate:** permissions, target scope, preconditions, invariants and approval state.
3. **Commit:** canonical object mutation plus outbox in one transaction.
4. **Dispatch:** post-commit external work with a stable idempotency key and durable status/reconciliation.

If a webhook is actually a required write-before-commit, model it as a saga step with a declared compensation or an externally visible pending state. Do not hide it in a generic “writeback” label.

## Highest-value follow-up tests

- Missing `OrgID` against every tenant-owned route must deny before a repository is touched.
- Forged body/header tenant differs from the signed claim; request must stay in the signed tenant.
- Cross-tenant object ID, relation endpoint, document ID, search result and agent tool target must deny with no existence leak.
- Inject failure after object #1, after link #1 and during audit/outbox append; verify rollback or a durable recoverable partial-state record.
- Re-submit the same action idempotency key concurrently; exactly one canonical state transition and one logical effect must result.
- Force webhook success followed by plan validation failure; assert no irreversible side effect occurred, or assert explicit saga compensation/reconciliation.
- Crash after database commit but before webhook dispatch; outbox dispatcher must eventually deliver once logically, with retries safe.

## What remains unverified

Route registration and every service/data-adapter tenant filter were not exhaustively traced in this pass. Backing-store transaction guarantees were not tested. The external webhook receiver's idempotency behaviour is outside this repository boundary. No tests were run.