# Action gate and transactions

**Layer:** [05-actions-and-rules](README.md) · **What it is:** Executing an action: checks, dry run, transaction boundary, isolation, outbox and external effects.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Open-source implementations](#open-source-implementations) (5) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (3)

## Diagram

_From the former `diagrams/action-lifecycle.mmd`._

```mermaid
sequenceDiagram
  participant U as User/Agent
  participant G as Action Gate
  participant P as Policy Engine
  participant DB as Object DB
  participant OB as Outbox
  participant WF as Durable Workflow
  participant X as External System
  U->>G: Invoke typed action + idempotency key
  G->>P: Authorize principal, tenant, target, purpose
  P-->>G: Allow/deny + obligations
  G->>DB: Load target version and invariants
  DB-->>G: Versioned object state
  G->>G: Validate parameters and build pure edit plan
  G-->>U: Preview and approval requirement
  U->>G: Confirm/approve
  G->>DB: Begin transaction; re-check version and policy
  G->>DB: Apply edits + audit row
  G->>OB: Insert outbox event in same transaction
  DB-->>G: Commit
  G-->>U: Accepted with action ID
  OB->>WF: Deliver durable event
  WF->>X: External writeback with idempotency key
  X-->>WF: Result / unknown timeout
  WF->>WF: Retry or reconcile; record delivery state
  WF-->>DB: Update workflow/action delivery status
```

## Open-source implementations

### 1. gura105/operational-ontology: the action gate, implemented

> Source: [open-source-references/operational-ontology.md](../../open-source-references/operational-ontology.md) (code study)

Plain-English explanation: imagine an "Order" object that is assembled from two ERPs. An agent may only change an order by calling a named action such as `cancelOrder(orderId, reason)`. The action checks its rule ("a shipped order cannot be cancelled"), describes the change it wants to make, writes that change to the ERP first, then commits locally. It records the attempt whether it succeeded or not.

- Licence and maturity: MIT. TypeScript on Node 24+. Four source files (`src/core.ts` 1,200 lines, `src/query.ts` 170, `src/mcp.ts` 237, `src/index.ts` 49), with tests and five example domains (orders, finance, hospital, factory, recall). Last commit 2026-11-19. The README says it is a learning resource, not a framework or an npm dependency. [Fact] ([README](https://github.com/gura105/operational-ontology/blob/HEAD/README.md))
- Data model. `defineObject({primaryKey, properties: ZodRawShape, owned?, visibility?, source?})` defines an object type; `owned` is either `true` (the whole type is ontology-owned) or a map from property name to default value (ontology-owned properties on a row that otherwise comes from a source). `defineLink({from, to, kind: 'one-to-many'|'many-to-many', owned?, via?})` defines a link type. `defineAction({object, targetParam, params, preconditions[], effects(), writeback?})` defines an action. `defineFunction({params, run})` defines a read-only named query. [Fact] ([core.ts](https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts))
- Edits are data. There are four edit types: `modify`, `create`, `link` and `unlink`. Deletes are deliberately out of scope. Preconditions return `reject(code, message)`, a machine-readable refusal with a `Violation {code, message}` shape. [Fact]
- Storage (SQLite in the reference). There are four tables. `objects(type, pk, data)` holds object rows. `links(name, from_pk, to_pk)` holds link instances. `overlay(type, pk, patch)` holds ontology-owned patches that are reapplied after a source re-index. `audit_log(seq, ts, actor, action, target, params, status CHECK IN ('applied','rejected'), error, edits)` holds every attempt. [Fact] (core.ts, Runtime constructor)
- Execution flow:
  1. Parse the params with Zod.
  2. Load the target object.
  3. Run the preconditions.
  4. Compute the effects.
  5. Run a preflight: apply the edits inside a transaction that always throws `Rollback`, so the commit's own code validates them and there is no second validator to drift.
  6. Check authority. An edit plan that touches source-backed state requires `writeback: true`, a plan touching only ontology-owned state forbids it, and a plan that mixes both is refused.
  7. Call `WritebackAdapter.apply(edits, {action, actor, target})` *before* the local commit.
  8. Commit the edits and the audit entry together in one transaction.
  9. On failure, audit the attempt as `WRITEBACK_FAILED`, `COMMIT_FAILED` or `EXECUTION_CRASHED`.

  [Fact] ([docs/IMPLEMENTATION.md](https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md), "Failure semantics in detail")
- Stated limits. There are no idempotency keys. There is no persisted pending-invocation record, so if the process dies after write-back but before the local commit, the edit is lost. The design assumes a single writer. Visibility is fail-open and the actor is self-declared, because the reference has no authentication. [Fact] (IMPLEMENTATION.md)
- MCP surface. For each object type it generates `search_`, `get_`, union/intersect/subtract and `aggregate_` tools. For each link it generates `traverse_` and `pivot_`. Each action and each function becomes its own tool, and there is a `read_audit_log` tool. The build fails if two generated tool names collide. Errors come back as JSON `{error:{code,message}}` with no stack traces. [Fact] ([mcp.ts](https://github.com/gura105/operational-ontology/blob/HEAD/src/mcp.ts)). It uses the v1 `@modelcontextprotocol/sdk` `McpServer`. [Fact]
- Verdict: **copy the design.** It is the most honest small statement of the pattern. Do not depend on it. To make it production-grade, add Postgres, real identity, fail-closed visibility, idempotency keys, an outbox/pending-invocation record, and asynchronous write-back on a durable workflow. [Inference]

### Trace C — action ordering and external side effects

> Source: [open-source-references/openfoundry.md](../../open-source-references/openfoundry.md) (repository audit)

**Code:** [`execute.go`](https://github.com/CapTrix/openfoundry/blob/main/libs/ontology-kernel/handlers/actions/execute.go).

The inspected action handler runs configured webhook writeback before calling `planAction()`. If the later action plan rejects the proposed mutation, the webhook may already have produced an external side effect. This is a code-ordering observation, not a proof every configured webhook is destructive. The correct lesson is to define precisely whether a pre-plan webhook is a read/parameter-enrichment hook or a mutating write; do not allow external mutation before local authorization, preconditions and an approved action plan.

**Proposed safe sequence:** authenticate → authorize → parse/validate input → load current state → construct pure edit plan → evaluate invariants/preconditions → preview/dry run → obtain required approval → commit local object changes + audit + outbox atomically → asynchronously execute external effects with idempotency/reconciliation.

### Finding 2 — `ActionWriteTransaction` is a staged coordinator, not yet proof of ACID atomicity

> Source: [open-source-references/openfoundry.md](../../open-source-references/openfoundry.md) (repository audit)

The helper stages object and link writes in memory. On `Commit`, the non-branched path then performs object `Put` calls, link `Put`/`Delete` calls and finally appends an action-log audit event. The branch path writes objects and links to the branch overlay in sequence, then appends the audit record. The interface passed to the helper exposes independent stores; the inspected function does not obtain one shared transaction handle spanning them.

The deterministic event ID is derived from tenant, branch, action, actor, policy and staged mutations. That is valuable for deduplication in a compatible store. It is not, by itself, a rollback mechanism. If a later link write or audit append fails after an earlier object write succeeded, the shown coordinator returns an error but contains no compensating rollback loop. The name and comments should therefore not be interpreted as a distributed ACID guarantee without verifying the actual backing store adapters and their transaction semantics.

The test `TestActionWriteTransactionMaterializesOnlyOnCommitAndAudits` verifies that nothing is visible before `Commit` and verifies the successful object/link/audit path. The branch test verifies writes land in the overlay rather than main. The inspected tests do not inject a failure at the second object, first link, or audit append to prove no partial state remains.

**Design implication (proposed):** put the canonical state mutation and its outbox/event record in the same database transaction whenever they share a relational source of truth. Treat graph, full-text and vector indexes as projections updated from the outbox. For unavoidable multi-system writes, use an explicit saga/state machine with idempotency keys, retries, reconciliation and compensating actions; do not market it as atomic.

### Finding 3 — webhook writeback runs before action planning/validation

> Source: [open-source-references/openfoundry.md](../../open-source-references/openfoundry.md) (repository audit)

`ExecuteAction` documents this order: (1) configured webhook writeback, (2) plan and execute, (3) audit POST, (4) notification fan-out, (5) webhook side-effect fan-out. In the handler, `runWebhookWriteback` is called before `planAction` and the later validation/execution path. The webhook output is merged into the action parameter set.

`invokeRegisteredWebhook` sends an HTTP POST to connector management and may obtain a service token scoped for the action webhook. The side-effect fan-out is described as best effort; its errors are persisted/logged but not returned to the action. The inspected call path does not establish that a pre-planning webhook is read-only. If it mutates an external system, a later invalid action can still leave an external effect.

**Design implication (proposed):** separate four stages explicitly:

1. **Prepare:** read-only enrichment or deterministic parameter derivation.
2. **Validate:** permissions, target scope, preconditions, invariants and approval state.
3. **Commit:** canonical object mutation plus outbox in one transaction.
4. **Dispatch:** post-commit external work with a stable idempotency key and durable status/reconciliation.

If a webhook is actually a required write-before-commit, model it as a saga step with a declared compensation or an externally visible pending state. Do not hide it in a generic “writeback” label.

### 4. Events need identity, durable intent and replay

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#4-events-need-identity-durable-intent-and-replay)

OpenFoundry derives deterministic outbox IDs; DataHub emits metadata-change proposals; DBOS persists workflow events and output checkpoints. The common need is durable coordination across components.

**Design implication:** local transaction + outbox, idempotent consumers, schema-versioned events, DLQ, replay, and operator-visible reconciliation.

## Design decisions already in the reference maps

### 13. Action gate (checks, dry run in a rolled-back transaction, write to source first, commit with audit)

> Source: [general-references/33-map-context-code-integration.md § 13. Action gate (checks, dry run in a rolled-back transaction, write to source first, commit with audit)](../../general-references/33-map-context-code-integration.md#13-action-gate-checks-dry-run-in-a-rolled-back-transaction-write-to-source-first-commit-with-audit)

**Purpose.** The only way anything changes. Every agent or staff write goes through a named, typed action that checks rules, previews its edits, writes to the ledger first, and records the attempt whether it succeeds or not. Receivables example: `logPromiseToPay(invoiceId, date, amount)` checks the invoice is open, previews the edit, writes a note to Xero, then commits locally and audits.

**Design to implement** (operational-ontology's order [Fact], plus the production additions document 14 lists):
1. **Idempotency**: the caller supplies or the runtime derives `invocation_id`; a repeated id returns the stored outcome. [Fact: the reference has no idempotency keys; addition recommended by document 14.]
2. **Parse** parameters with Zod.
3. **Authorise** with Cedar (section 3): principal, agent principal, action, target, context. Deny → audit `rejected` with `PERMISSION_DENIED`.
4. **Load** the target object(s).
5. **Preconditions / submission criteria**: evaluate the JSON condition IR; each failure returns `Violation {code, message}` (operational-ontology `reject(code, message)` [Fact]; Foundry `configuredFailureMessage` [Fact]).
6. **Effects** as data: `Edit[]` of `modify | create | link | unlink` (operational-ontology [Fact]).
7. **Preflight**: apply the edits inside a transaction that always throws `Rollback`, so the commit code validates them and there is no second validator to drift [Fact].
8. **Authority check**: an edit plan touching source-backed state requires `writeback: true`; one touching only ontology-owned state forbids it; a plan mixing both is refused [Fact].
9. If `mode = VALIDATE_ONLY`, return `{result, submissionCriteria, parameters, edits?}` and stop. If `confirmation_required`, return the preview and require a confirmed second call with a justification string (CapTrix, OntoForge [Fact]). Agents call validate first.
10. **Pending record**: write `pending_invocations(invocation_id, action, actor, agent_principal, target, params, edits, status)` **before** write-back (document 14 addition; DBOS `operation_outputs` provides this).
11. **Write back to the source first**, as a DBOS step: `WritebackAdapter.apply(edits, {action, actor, target})` through the Nango proxy or tool [Fact for the adapter call; DBOS step is document 14's recommendation].
12. **Commit** local edits and the audit row in one transaction [Fact].
13. **Audit** every attempt, applied or refused: `audit_log(org_id, seq, ts, actor, agent_principal, action, target, params (redacted by safety flags), status IN ('applied','rejected'), error_code, error, edits, invocation_id, trace_id)`. Failure codes `WRITEBACK_FAILED`, `COMMIT_FAILED`, `EXECUTION_CRASHED` [Fact for the codes and the two statuses].
- Storage: `objects`, `links`, `overlay(type, pk, patch)` (ontology-owned patches reapplied after a source re-index), `audit_log` (operational-ontology's four tables [Fact]); in this product the ledger-backed objects are the normalised `ar_*` tables and overlay holds owned properties such as `doNotContact` or `assignedCollector` [Inference].
- Failure behaviour: if the process dies after write-back and before commit, the DBOS workflow resumes from the memoised write-back output and completes the commit (closes the gap the reference documents [Fact]). Visibility fails closed and the actor comes from authentication, never self-declared (both are limits of the reference [Fact]).
- Monitoring-triggered actions (reminder runs) come from section 14's playbook and pass through the same gate.

**Copies.**
- Document 14, section 1 and "What to copy" 1–3. https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts ; https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md
- Document 14, "What to copy" 4 and 7: validate/apply; confirmation with justification. https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py ; https://github.com/CapTrix/openfoundry/blob/HEAD/libs/ontology-kernel/models/action_type.go
- Document 14, section 25: DBOS step memo. https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts
- Document 11, section 17: no product has actions as typed ontology members — this is the gap the gate fills [Inference, document 11].

**Left out, and why.** Deletes (out of scope in the reference too). Generic update tools and raw SQL (deliberately absent [Fact]). Przyval's action engine (submission criteria hard-coded empty [Fact]). CapTrix code (AGPL).

**Open questions.** How to reconcile when the ledger accepted the write but returned an error to the client (needs per-ledger idempotency support; not in the documents). Whether write-back for email sends (a side effect, not a ledger write) should use the `webhook` logic rule.

## Earlier engineering notes (Phase 2)

### Action gate and transaction model

> Source: former `06-action-and-execution-engine/action-gate-and-transaction-model.md` (moved here in the Nov 2026 restructure)

#### Action contract

An action is a named business command, not a generic row update. It has: type/version, parameters, target-selection rules, caller/agent permission, preconditions, domain invariants, edit plan, approval requirements, side-effect declarations, idempotency key, audit context and expected result.

#### Recommended execution sequence

1. Authenticate actor or agent and establish tenant context.
2. Load published action definition and target object under policy scope.
3. Validate parameter types, action version and target cardinality.
4. Check authorization, markings and delegated authority.
5. Evaluate preconditions and business invariants against a consistent object version.
6. Build a pure edit plan; do not cause external side effects during planning.
7. Return a preview/dry-run including changed objects, links, fields, derived impacts and external effects.
8. Obtain required human approval/confirmation.
9. Re-check optimistic version and policy at commit time.
10. Commit object edits, action audit record and outbox event in one local database transaction.
11. A durable workflow performs external writeback, retries idempotently and records each delivery attempt.
12. Reconcile the local intended state with external system result; expose divergence for operator review.

#### Transaction boundary

A local ACID transaction can protect changes in one database. It cannot make a remote ERP API, email provider, payment network and another database commit atomically. Use outbox/inbox, idempotency, durable workflow and reconciliation. Never describe cross-system side effects as atomic unless an explicit distributed transaction protocol and participant support has been demonstrated.

#### Lessons from source inspection

OpenFoundry's metadata batch-save illustrates how to keep schema edits, audit and outbox in one PostgreSQL transaction. Its object writeback helper illustrates a cross-store partial-commit case: Cassandra primary object write precedes PostgreSQL outbox. Deterministic event IDs and version metadata allow retries, but the system still needs visible reconciliation. The action path inspection also found a configured webhook writeback before action plan validation; our action gate should avoid mutating side effects before the local action is validated/authorised.

Palantir's public action docs describe a single transaction over ontology edits and distinguish external side effects from internal atomic edits. The exact boundaries and guarantees should be read per action type; do not generalize one guarantee to every side effect.

### Phase 2 research — action isolation, invariants and effect boundaries

> Source: former `06-action-and-execution-engine/phase2-action-isolation-and-invariants.md` (moved here in the Nov 2026 restructure)

**Research date:** 27 November 2026  
**Evidence:** Palantir's current public action consistency documentation and prior Phase 2 OpenFoundry source inspection. No live action was executed.

#### 1. A single action transaction has a defined scope

Palantir documents an action as reading Ontology state, applying user-defined logic and committing edits to one or more objects/links in one transaction. Its guarantees cover the Ontology edit batch:
- atomicity: all edits in the action commit or none do;
- consistency: constraints such as types and required properties must hold;
- isolation: depends on the configured isolation mode;
- durability: committed edits persist.

The guarantee does **not** extend to notifications, webhooks or external calls made by backing functions. A successful local object edit must not be described as a successful remote side effect.

Official source: https://www.palantir.com/docs/foundry/action-types/consistency-guarantees

#### 2. Batched writes versus staged writes

Palantir documents two modes:
- **Batched writes (default):** collect the action's edits and commit them as one atomic batch at the end. Reads within the action do not see its pending edits.
- **Staged writes:** reads later in the same execution can see earlier edits from that action; other actions cannot see them until the final atomic commit.

Staged writes currently use legacy isolation semantics, so they do not guarantee that all reads came from one point-in-time snapshot.

The design question is not merely whether an action "can edit multiple objects"; it is whether its own read-after-write logic can see staged state and whether the action makes decisions using a consistent snapshot.

#### 3. Snapshot isolation does not prevent every business invariant violation

Palantir's docs explicitly describe write skew under snapshot isolation:
- Action A and Action B begin from the same snapshot.
- Each reads a shared invariant over several objects.
- A writes object A; B writes object B.
- Since they write different objects, no write-write conflict is detected.
- Both commit, although the combined result violates the invariant.

Example in the docs: two people each remove themselves from an on-call rotation after reading that at least two people are on call. Both actions can commit and leave nobody on call.

The documented workaround is to make both actions write a shared invariant/anchor object (e.g. a rotation record with a count), so conflicting operations contend on one object. In our system, use explicit invariant rows, unique/exclusion constraints, locks or serializable isolation when warranted. Do not assume snapshot isolation alone proves a cross-object invariant.

#### 4. Choose isolation mode from the business command

| Mode | Read behaviour | Conflict behaviour | Suitable use |
|---|---|---|---|
| Snapshot | All reads observe one point-in-time snapshot | Conflicts on write-write object overlap; read-write skew still possible | Default for read-modify-write operations on objects, with explicit invariant protection |
| Read committed | Each read sees latest committed value when executed | Concurrent commits can merge different-property updates; last commit wins for same property | Simple parameter assignment that does not depend on stable read state |
| Legacy | Point-in-time reads not guaranteed | Write conflict checks; depends on action/write mode | Compatibility only, not preferred for new commands |

Palantir recommends snapshot isolation for most workflows. It warns that read committed provides higher commit rates with weaker correctness guarantees.

#### 5. Automatic retries can repeat external effects

Palantir documents up to five retries for transient errors. The default retry mode only automatically retries actions without external calls. External calls include configured writeback webhooks, source connections, webhook calls, OSDK use in backing functions and calls to other functions/actions. This prevents the platform from automatically replaying a call that may already have caused a side effect.

Retries can be enabled for all actions if external calls are safe to repeat/idempotent, or disabled. The docs recommend idempotency as the condition for retrying side-effecting operations.

The subtlety: a function that makes even a read-only OSDK request can be classed as making an external call for retry classification. Retry policy must be based on declared effects/resources, not just on whether the programmer thinks a call is "read-only".

#### 6. Our recommended command pipeline

1. Authenticate actor/agent and resolve tenant/resource scope.
2. Resolve action definition/version and target objects.
3. Validate types, cardinality, object versions and preconditions.
4. Evaluate policy and delegated authority.
5. Produce a pure, explainable edit plan; make no irreversible calls.
6. Preview changes, rule outcomes, data dependencies and required approvers.
7. Obtain explicit approval where required.
8. Re-check policy, approval and object versions at commit time.
9. Commit canonical state + action audit + outbox event in one database transaction.
10. Dispatch remote effects asynchronously through a durable workflow using receiver idempotency keys.
11. Reconcile actual external state against intended state; expose uncertain/failed delivery for human resolution.

#### 7. Tests required

- Two concurrent actions that violate a shared cross-object invariant: only one can commit.
- Two actions updating different properties on the same object under each isolation mode.
- Snapshot write skew over a relationship-set invariant.
- Action retry after a transient database conflict.
- Remote API accepts request but response times out; retry must not create a duplicate.
- Process crashes after local commit but before dispatch: outbox resumes.
- Process crashes after remote acceptance but before local delivery acknowledgement: idempotency/reconciliation converge.
- Approval revocation between preview and commit: commit is denied.
- A read-only OSDK/source call inside an action: retry classification remains explicit.
- Action definition version changes while a durable workflow is waiting: define whether to pin, migrate or reject.

#### Sources and caveats

- https://www.palantir.com/docs/foundry/action-types/consistency-guarantees
- https://www.palantir.com/docs/foundry/object-edits/overview
- https://github.com/CapTrix/openfoundry/tree/090e3f19b6b90fb77c23d779a318957c937067b2
- OpenFoundry Phase 2 inspection: `15-repository-audits/openfoundry-action-and-tenancy-phase2.md`

Official Palantir docs are product guarantees, not code disclosure. OpenFoundry is an independent AGPL-3.0-only implementation and should not be treated as Palantir's backend implementation.

### H5 — Action commit plus outbox; workflows for external effects

> Source: former `17-decisions-and-tradeoffs/architecture-hypotheses.md` (moved here in the Nov 2026 restructure)

**Hypothesis:** local authoritative object mutation, audit and outbox intent commit atomically in one database transaction. Durable workflow performs external calls and reconciliation.

**Evidence:** OpenFoundry's schema batch edit provides a good local transaction pattern; its Cassandra+PG object writeback demonstrates the partial-commit problem when databases differ; DBOS illustrates durable execution state.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
