# Repository audit — Temporal workflow engine

**Repository:** [temporalio/temporal](https://github.com/temporalio/temporal), branch `main`, 27 November 2026. Source and test-tree inspection only; no clone/build/tests run. This is a large production workflow engine; this report traces selected history/state mechanisms rather than attempting a whole-repository audit.

## Role in the architecture

Temporal is a reference for durable, long-running workflows: it persists workflow execution state and event history, reconstructs mutable state from history, manages task/timer generation and handles optimistic/concurrent state updates. It is not an ontology or authorization system. Its most valuable lesson is that workflow state must be a first-class persisted state machine, not a sequence of in-memory callbacks.

## Repository areas inspected

- `service/history/workflow/context.go`
- `service/history/workflow/transaction_impl.go`
- `service/history/workflow/mutable_state_rebuilder.go`
- `service/history/workflow/mutable_state_impl.go` (large file identified in workflow package tree; not fully reviewed)
- `service/history/workflow/task_generator.go` (identified in package tree; not fully reviewed)
- `service/history/workflow/retry.go` (identified in package tree; not fully reviewed)
- `service/history/workflow/mutable_state_rebuilder_test.go`, `mutable_state_impl_test.go`, `task_generator_test.go`, `retry_test.go` (test sources identified; not executed)

## Trace A — load mutable state and establish a transaction

`ContextImpl.LoadMutableState` resolves the namespace, loads workflow execution state through the persistence API, builds a mutable-state object with its database record version, and starts a state transaction. It checks CHASM archetype consistency and failover-version mismatches; speculative state from an earlier failover version can be cleared and reloaded. The context may have to flush state before it is considered ready.

This path highlights that persisted state is not just a JSON workflow blob. It is versioned, namespace-scoped, tied to a workflow/run identity and participates in failover/consistency rules.

## Trace B — persist mutation and history through one persistence request

`TransactionImpl.UpdateWorkflowExecution` constructs a `persistence.UpdateWorkflowExecutionRequest` containing:

- shard ID and update mode;
- current workflow mutation;
- current workflow history event batches;
- optional new workflow snapshot;
- optional new-run event batches;
- run-existence checks and failover-version information.

It calls the shard persistence API with this request. If the operation may have succeeded despite an error, it sends state-mutation/snapshot notifications for cache coherency. After a clean persistence success, it publishes new history mutation/snapshot notifications; notification failures are logged rather than rolling back the persistence operation.

The key idea is to treat mutable-state mutation and history as a coordinated persistence operation while treating downstream notification as a separate, retryable/cache-coherency concern. The implementation depends on the persistence backend's contract; this source alone does not prove every backend has the same storage transaction mechanics.

## Trace C — rebuild state from durable history

`MutableStateRebuilderImpl.ApplyEvents` replays history batches into mutable state, updates current version and version-history items from the last event, applies state-machine-backed events and handles continued-as-new runs. Its state-machine event path tries the newer CHASM representation when enabled and falls back to the legacy HSM route when the event is not claimed by CHASM. This is important for versioned migrations and backward compatibility of long-running state machines.

This suggests a general principle for our workflows: retain an append-only execution/audit log sufficient to reconstruct process state or to explain why the current state was reached. A workflow runner that only stores the latest status cannot safely support replay, migration, diagnosis or compensation.

## Test coverage signal (source inspection only)

The workflow package contains large test suites for mutable state, rebuilder, timers, task generation and retries. Their presence indicates important behavioural contracts, but this audit did not inspect every test case or execute any suite. It does not claim Temporal's current code was validated locally.

## What we should learn

- Persist workflow identity, run identity, status, version, event history and scheduled tasks.
- Use optimistic version/condition checks for concurrent mutations.
- Rebuild or deterministically rehydrate execution state from durable history.
- Separate state persistence from notifications and downstream side effects.
- Model retries, timers, signals, cancellation and continue-as-new explicitly.
- Define workflow migrations and compatibility when state-machine shape changes.

## What not to copy wholesale

Temporal is a distributed workflow server with significant infrastructure and operational complexity. We likely need a durable workflow component, not a fork of Temporal internals. Evaluate using Temporal/DBOS as a workflow runtime versus building simple process orchestration ourselves; do not recreate its cluster/state history mechanisms without a clear need.

## Open questions

- Inspect persistence backend implementations (SQL/Cassandra) and transaction/version conditions.
- Follow task generation into matching/worker queues and timer processing.
- Inspect retry/backoff/cancellation logic and visibility/indexing.
- Examine worker replay determinism constraints and workflow versioning.
- Run selected focused tests and failure-injection scenarios after cloning.
