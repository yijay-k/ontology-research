# Durable workflow engines: Temporal vs DBOS — Phase 2

**Snapshot:** Temporal TypeScript SDK at `8447c6928c773072a94d5f206a34465e3d9ea7df`; DBOS TypeScript at `adde4eb4037d64cd3072d5c6b875cf0bd2927d75` (27 November 2026).  
**Evidence level:** source/test sources and current official docs inspected; no test suite or benchmark run.

## The shared problem

Long-running enterprise work cannot be represented safely as a request handler that calls several services and hopes the process stays alive. A durable runtime must record progress, retry failed work, recover after worker/process loss, expose status and cancellation, and make repeated attempts safe. This matters for document intake, conflict checks, review approvals, deadline preparation, notifications and external integrations.

## Temporal: event-history replay and deterministic orchestration

Temporal documents Event History as the source of truth for a workflow execution. On recovery, workflow code is replayed against recorded events to reconstruct state; activities record results and are not re-executed during replay. Workflow orchestration must be deterministic, so time, randomness, network calls, DB queries, LLM calls and file IO belong in Activities or other supported side-effect boundaries. Timer and other workflow APIs are replay-aware.

Long-lived workflows add a versioning requirement: changing the command sequence can break replay for executions already in flight. Temporal documents Workflow Patching and Worker Versioning as mechanisms to evolve running workflow definitions without violating determinism. Its TypeScript docs also recommend replaying representative historical event histories in CI to detect nondeterministic code changes.

Sources:

- [Temporal workflow execution and replay](https://docs.temporal.io/workflows)
- [Temporal TypeScript workflow versioning](https://docs.temporal.io/develop/typescript/workflows/versioning)
- [Temporal replay testing guidance](https://docs.temporal.io/develop/typescript/best-practices/testing-suite#how-to-replay-a-workflow-execution)
- [Temporal TypeScript SDK source snapshot](https://github.com/temporalio/sdk-typescript/tree/8447c6928c773072a94d5f206a34465e3d9ea7df)

## DBOS: durable steps and transaction-aware persistence in PostgreSQL

DBOS's official docs describe durable workflows and steps backed by a PostgreSQL system database. Completed steps are checkpointed, so workflow recovery can continue from recorded step results rather than repeat every completed step. Its documented guarantee distinguishes ordinary steps (at-least-once execution attempts; code must be idempotent) from DBOS transactions whose database updates and checkpoint can commit together for exactly-once transactional effects within that database boundary.

The TypeScript `tests/recovery.test.ts` source contains concrete recovery scenarios: a workflow can run again after being marked pending; recovery attempts can hit a maximum and enter a dead-letter state; a workflow can be resumed; stale recovery sweeps are ownership-conditional; and duplicate recovery of a running workflow can cause a new execution to become owner while a stale execution is fenced at its next write/checkpoint. This is meaningful evidence of how DBOS approaches multi-executor recovery, but the tests were read, not run.

Sources:

- [DBOS TypeScript workflow recovery tests](https://github.com/dbos-inc/dbos-transact-ts/blob/adde4eb4037d64cd3072d5c6b875cf0bd2927d75/tests/recovery.test.ts)
- [DBOS TypeScript workflow implementation](https://github.com/dbos-inc/dbos-transact-ts/blob/adde4eb4037d64cd3072d5c6b875cf0bd2927d75/src/workflow.ts)
- [DBOS durable workflow guarantees](https://docs.dbos.dev/typescript/tutorials/workflow-tutorial)
- [DBOS architecture](https://docs.dbos.dev/architecture)

## Comparison for this product

| Dimension | Temporal | DBOS | What we must test |
|---|---|---|---|
| Durable state | Event History in Temporal service | PostgreSQL-backed system database/checkpoints | Recovery after process kill and DB restart |
| Orchestration replay | Re-executes workflow code against recorded events | Replays durable workflow/step state; recovery tests exercise re-execution and ownership | Code-change/replay compatibility |
| Side-effect boundary | Activities | Steps; DBOS transaction for DB-local atomic effects | Duplicate HTTP/LLM/provider calls |
| Exactly-once scope | Activity execution is retryable; external effect needs idempotency | DB transaction + checkpoint can be exactly-once within the same DB transaction | Ensure third-party API is not misrepresented as exactly-once |
| Workflow versioning | Determinism-safe patching and worker versioning | Application/workflow version controls; verify exact deployment/version semantics in prototype | Migrate running legal matters through code release |
| Infrastructure shape | Dedicated Temporal service/cluster plus workers | Library integrated with app, PostgreSQL system DB | Operational skill, backups, scale, tenant load |
| Best first prototype fit | Strong general-purpose distributed orchestration | Attractive when Postgres is already core and workflow code is close to app transactions | Run the same workload on both, inspect operational overhead |

This table is a selection guide, not a feature checklist. Check current product edition/feature availability before making a decision, especially for advanced versioning, deployment or scale controls.

## Key design rule — exactly-once stops at the transactional boundary

Neither workflow engine can make an arbitrary third-party HTTP endpoint exactly-once merely by retrying a durable step. If a request reaches the other system but the client times out before recording the response, a retry may repeat the operation. Use receiver-supported idempotency keys, deduplication, an operation ledger and reconciliation. For systems without idempotency, model uncertainty explicitly (e.g. `dispatch_unknown`) and reconcile before resubmitting.

## Provisional recommendation

Do not select on API ergonomics. Since the proposed platform is already likely to use PostgreSQL for canonical metadata and object state, DBOS deserves the first local proof for DB-coupled matter workflows and transactionally checkpointed steps. Keep Temporal as a serious comparator if orchestration must be independently operated, multi-language, long-running across many heterogeneous workers, or more isolated from the application's database. This is a **proposed experiment**, not a final technology decision.

## Minimal bake-off workload

Implement the same workflow in each engine:

1. Create a Matter Intake record and idempotent workflow ID.
2. Store an uploaded document's metadata and hash.
3. Run a retryable extraction activity/step and checkpoint the result.
4. Call an external mock conflict-check API that times out after accepting the request.
5. Kill the worker between response and checkpoint; restart it.
6. Verify no duplicate matter, no lost completed extraction, and no silent duplicate conflict request.
7. Add a human approval wait, a 48-hour timer, cancellation and a schema-version migration.
8. Revoke the approver's access while the workflow is waiting and verify authorization is checked again at approval time.
9. Inspect audit history, retry policy, operator visibility and backup/restore behaviour.

Capture exact engine versions, config, commands, p50/p95 latency, DB load, failure trace and test outcome.