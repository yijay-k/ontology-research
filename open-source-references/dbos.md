# dbos-inc/dbos-transact-ts

| | |
|---|---|
| **Repository** | <https://github.com/dbos-inc/dbos-transact-ts> |
| **Why it matters** | Durable workflows as a library on PostgreSQL — the best fit for one person on Postgres. |
| **What to take** | Checkpointed steps (operation_outputs memo), workflow_status and queues tables in the same database. |
| **What not to copy** | Assuming external side effects become exactly-once; enterprise-gated features (sharding, auto-upgrade, suspend, external storage). |
| **Feeds** | [09-workflows/durable-execution](../engineering/09-workflows/durable-execution.md) |
| **Evidence level** | Phase 2 repository audit (source inspection, not executed) |

> **Source re-check 28 Nov 2026 (code):** [`dbos-inc/dbos-transact-ts@adde4eb`](https://github.com/dbos-inc/dbos-transact-ts/tree/adde4eb) — Enterprise gates now autoUpgrade, sharding, suspendMode, externalStores, workflowArchive; new system tables (streams, scheduler_state, event_dispatch_kv, workflow_queue).

## Repository audit: Repository audit — dbos-inc/dbos-transact-ts

> Source: former `15-repository-audits/dbos.md` (Phase 2 source inspection, not executed).

**Role:** durable workflow execution and state persistence reference.  
**Repository:** [dbos-inc/dbos-transact-ts](https://github.com/dbos-inc/dbos-transact-ts), branch `main`.  
**Validation:** source inspected; no test or runtime execution performed.

### Runtime model

`DBOS.workflow` and `DBOS.step` decorators register functions with the runtime. The `DBOS.step` documentation says a step invoked within a workflow is checkpointed and can have retry/timeout semantics; called outside a workflow it behaves as an ordinary function. This distinction means durable semantics depend on the call context and registration mechanism.

`DBOSExecutor` holds a system database and coordinates workflow execution, queueing, execution ownership and recovery. `workflow.ts` represents explicit statuses including PENDING, SUCCESS, ERROR, CANCELLED, ENQUEUED, DELAYED and SUSPENDED. A suspended workflow can be parked in the database until a receive or timer/sleep resumes it. Workflow metadata includes executor ID, application version, ownership and timing/deadline fields.

`system_database.ts` references persistent tables such as `workflow_status`, `operation_outputs`, `workflow_events`, `workflow_schedules`, queues and streams. The inspected source describes PostgreSQL `LISTEN/NOTIFY` as a wakeup signal sent from transaction triggers only after the row commit; notifications are coalesced off the write path. It also contains controls for poll concurrency, database pool starvation, statement timeout and idle-in-transaction timeout.

### Design lessons

- Durable workflow state is data in a system database, not just an in-memory queue.
- A step boundary is a checkpoint/replay boundary; external effects need idempotency or their own durable state.
- Timers, waits, cancellation and workflow ownership must be modelled explicitly.
- Database-pool fairness and notification pressure matter under high workflow fan-out.
- Queue dispatch and status updates are part of control-plane correctness.

### Open questions

The inspected code is not enough to claim full semantics for every retry/recovery path. Follow-up should trace operation output commit and replay, exactly-once claims vs at-least-once external effects, worker leases, application upgrades, queue deduplication, migrations and corresponding test cases. The original archive notes that some advanced capabilities are in a separate enterprise package; check the current licence/package boundary before relying on them.

### Adoption recommendation

Use DBOS or Temporal as a workflow engine candidate, not as the ontology or action database. Keep local action commit and the outbox pattern in the platform's domain layer; let the durable workflow coordinate approvals, external APIs, waits, retries and reconciliation.
