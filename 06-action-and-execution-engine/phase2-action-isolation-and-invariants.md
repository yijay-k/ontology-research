# Phase 2 research — action isolation, invariants and effect boundaries

**Research date:** 27 November 2026  
**Evidence:** Palantir's current public action consistency documentation and prior Phase 2 OpenFoundry source inspection. No live action was executed.

## 1. A single action transaction has a defined scope

Palantir documents an action as reading Ontology state, applying user-defined logic and committing edits to one or more objects/links in one transaction. Its guarantees cover the Ontology edit batch:
- atomicity: all edits in the action commit or none do;
- consistency: constraints such as types and required properties must hold;
- isolation: depends on the configured isolation mode;
- durability: committed edits persist.

The guarantee does **not** extend to notifications, webhooks or external calls made by backing functions. A successful local object edit must not be described as a successful remote side effect.

Official source: https://www.palantir.com/docs/foundry/action-types/consistency-guarantees

## 2. Batched writes versus staged writes

Palantir documents two modes:
- **Batched writes (default):** collect the action's edits and commit them as one atomic batch at the end. Reads within the action do not see its pending edits.
- **Staged writes:** reads later in the same execution can see earlier edits from that action; other actions cannot see them until the final atomic commit.

Staged writes currently use legacy isolation semantics, so they do not guarantee that all reads came from one point-in-time snapshot.

The design question is not merely whether an action "can edit multiple objects"; it is whether its own read-after-write logic can see staged state and whether the action makes decisions using a consistent snapshot.

## 3. Snapshot isolation does not prevent every business invariant violation

Palantir's docs explicitly describe write skew under snapshot isolation:
- Action A and Action B begin from the same snapshot.
- Each reads a shared invariant over several objects.
- A writes object A; B writes object B.
- Since they write different objects, no write-write conflict is detected.
- Both commit, although the combined result violates the invariant.

Example in the docs: two people each remove themselves from an on-call rotation after reading that at least two people are on call. Both actions can commit and leave nobody on call.

The documented workaround is to make both actions write a shared invariant/anchor object (e.g. a rotation record with a count), so conflicting operations contend on one object. In our system, use explicit invariant rows, unique/exclusion constraints, locks or serializable isolation when warranted. Do not assume snapshot isolation alone proves a cross-object invariant.

## 4. Choose isolation mode from the business command

| Mode | Read behaviour | Conflict behaviour | Suitable use |
|---|---|---|---|
| Snapshot | All reads observe one point-in-time snapshot | Conflicts on write-write object overlap; read-write skew still possible | Default for read-modify-write operations on objects, with explicit invariant protection |
| Read committed | Each read sees latest committed value when executed | Concurrent commits can merge different-property updates; last commit wins for same property | Simple parameter assignment that does not depend on stable read state |
| Legacy | Point-in-time reads not guaranteed | Write conflict checks; depends on action/write mode | Compatibility only, not preferred for new commands |

Palantir recommends snapshot isolation for most workflows. It warns that read committed provides higher commit rates with weaker correctness guarantees.

## 5. Automatic retries can repeat external effects

Palantir documents up to five retries for transient errors. The default retry mode only automatically retries actions without external calls. External calls include configured writeback webhooks, source connections, webhook calls, OSDK use in backing functions and calls to other functions/actions. This prevents the platform from automatically replaying a call that may already have caused a side effect.

Retries can be enabled for all actions if external calls are safe to repeat/idempotent, or disabled. The docs recommend idempotency as the condition for retrying side-effecting operations.

The subtlety: a function that makes even a read-only OSDK request can be classed as making an external call for retry classification. Retry policy must be based on declared effects/resources, not just on whether the programmer thinks a call is "read-only".

## 6. Our recommended command pipeline

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

## 7. Tests required

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

## Sources and caveats

- https://www.palantir.com/docs/foundry/action-types/consistency-guarantees
- https://www.palantir.com/docs/foundry/object-edits/overview
- https://github.com/CapTrix/openfoundry/tree/090e3f19b6b90fb77c23d779a318957c937067b2
- OpenFoundry Phase 2 inspection: `15-repository-audits/openfoundry-action-and-tenancy-phase2.md`

Official Palantir docs are product guarantees, not code disclosure. OpenFoundry is an independent AGPL-3.0-only implementation and should not be treated as Palantir's backend implementation.
