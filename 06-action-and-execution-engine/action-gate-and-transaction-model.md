# Action gate and transaction model

## Action contract

An action is a named business command, not a generic row update. It has: type/version, parameters, target-selection rules, caller/agent permission, preconditions, domain invariants, edit plan, approval requirements, side-effect declarations, idempotency key, audit context and expected result.

## Recommended execution sequence

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

## Transaction boundary

A local ACID transaction can protect changes in one database. It cannot make a remote ERP API, email provider, payment network and another database commit atomically. Use outbox/inbox, idempotency, durable workflow and reconciliation. Never describe cross-system side effects as atomic unless an explicit distributed transaction protocol and participant support has been demonstrated.

## Lessons from source inspection

OpenFoundry's metadata batch-save illustrates how to keep schema edits, audit and outbox in one PostgreSQL transaction. Its object writeback helper illustrates a cross-store partial-commit case: Cassandra primary object write precedes PostgreSQL outbox. Deterministic event IDs and version metadata allow retries, but the system still needs visible reconciliation. The action path inspection also found a configured webhook writeback before action plan validation; our action gate should avoid mutating side effects before the local action is validated/authorised.

Palantir's public action docs describe a single transaction over ontology edits and distinguish external side effects from internal atomic edits. The exact boundaries and guarantees should be read per action type; do not generalize one guarantee to every side effect.