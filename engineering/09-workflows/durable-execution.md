# Durable execution

**Layer:** [09-workflows](README.md) · **What it is:** Workflows that survive crashes: event-history replay vs durable steps, and where exactly-once stops.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Open-source implementations](#open-source-implementations) (5) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Open-source implementations

### 25. Durable execution: Temporal vs DBOS vs pg-boss

> Source: [open-source-references/durable-execution-comparison.md](../../open-source-references/durable-execution-comparison.md) (code study)

- Temporal server: MIT, Go (about 1.16M lines), version 1.33.0. Persistence schemas exist for Cassandra, MySQL, PostgreSQL and SQLite, plus Elasticsearch for visibility. The TypeScript SDK is 1.26.0 (MIT). [Fact]. Operationally it is a separate multi-service cluster. [Inference]
- DBOS Transact TS: MIT core, last commit 2026-11-18. Its Postgres system tables include `workflow_status` (status, name, authenticated_user, assumed_role, request, output, error, executor_id, created_at), `operation_outputs(workflow_uuid, function_id, function_name, output, error)` (the per-step memo that makes replay safe), `notifications`, `workflow_events(_history)`, `workflow_schedules`, `queues`, `application_versions` and `workflow_input`/`workflow_output`. [Fact] ([sysdb_migrations/internal/migrations.ts](https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts)). `src/enterprise.ts` gates `autoUpgrade`, `sharding`, `suspendWorkflows` and `externalStorage` behind the proprietary `@dbos-inc/dbos-enterprise` package and a Conductor entitlement check. [Fact] ([enterprise.ts](https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/enterprise.ts))
- pg-boss: MIT, version 12.38.2. It has a partitioned `job` table (cloned per queue), `queue`, `schedule`, `subscription`, a warning table and queue statistics, with options for CockroachDB-style inline indexes. [Fact] ([src/plans.ts](https://github.com/timgit/pg-boss/blob/HEAD/src/plans.ts))
- Verdict: **adopt DBOS** for action write-back and long agent tasks (steps are memoised, so a write-back that crashed is resumed rather than re-run blindly), or **pg-boss** for simpler background jobs. Skip Temporal until you have operations staff. [Inference]

### Repository audit — Temporal workflow engine

> Source: [open-source-references/temporal.md](../../open-source-references/temporal.md) (repository audit)

**Repository:** [temporalio/temporal](https://github.com/temporalio/temporal), branch `main`, 27 November 2026. Source and test-tree inspection only; no clone/build/tests run. This is a large production workflow engine; this report traces selected history/state mechanisms rather than attempting a whole-repository audit.

#### Role in the architecture

Temporal is a reference for durable, long-running workflows: it persists workflow execution state and event history, reconstructs mutable state from history, manages task/timer generation and handles optimistic/concurrent state updates. It is not an ontology or authorization system. Its most valuable lesson is that workflow state must be a first-class persisted state machine, not a sequence of in-memory callbacks.

#### Repository areas inspected

- `service/history/workflow/context.go`
- `service/history/workflow/transaction_impl.go`
- `service/history/workflow/mutable_state_rebuilder.go`
- `service/history/workflow/mutable_state_impl.go` (large file identified in workflow package tree; not fully reviewed)
- `service/history/workflow/task_generator.go` (identified in package tree; not fully reviewed)
- `service/history/workflow/retry.go` (identified in package tree; not fully reviewed)
- `service/history/workflow/mutable_state_rebuilder_test.go`, `mutable_state_impl_test.go`, `task_generator_test.go`, `retry_test.go` (test sources identified; not executed)

#### Trace A — load mutable state and establish a transaction

`ContextImpl.LoadMutableState` resolves the namespace, loads workflow execution state through the persistence API, builds a mutable-state object with its database record version, and starts a state transaction. It checks CHASM archetype consistency and failover-version mismatches; speculative state from an earlier failover version can be cleared and reloaded. The context may have to flush state before it is considered ready.

This path highlights that persisted state is not just a JSON workflow blob. It is versioned, namespace-scoped, tied to a workflow/run identity and participates in failover/consistency rules.

#### Trace B — persist mutation and history through one persistence request

`TransactionImpl.UpdateWorkflowExecution` constructs a `persistence.UpdateWorkflowExecutionRequest` containing:

- shard ID and update mode;
- current workflow mutation;
- current workflow history event batches;
- optional new workflow snapshot;
- optional new-run event batches;
- run-existence checks and failover-version information.

It calls the shard persistence API with this request. If the operation may have succeeded despite an error, it sends state-mutation/snapshot notifications for cache coherency. After a clean persistence success, it publishes new history mutation/snapshot notifications; notification failures are logged rather than rolling back the persistence operation.

The key idea is to treat mutable-state mutation and history as a coordinated persistence operation while treating downstream notification as a separate, retryable/cache-coherency concern. The implementation depends on the persistence backend's contract; this source alone does not prove every backend has the same storage transaction mechanics.

#### Trace C — rebuild state from durable history

`MutableStateRebuilderImpl.ApplyEvents` replays history batches into mutable state, updates current version and version-history items from the last event, applies state-machine-backed events and handles continued-as-new runs. Its state-machine event path tries the newer CHASM representation when enabled and falls back to the legacy HSM route when the event is not claimed by CHASM. This is important for versioned migrations and backward compatibility of long-running state machines.

This suggests a general principle for our workflows: retain an append-only execution/audit log sufficient to reconstruct process state or to explain why the current state was reached. A workflow runner that only stores the latest status cannot safely support replay, migration, diagnosis or compensation.

#### Test coverage signal (source inspection only)

The workflow package contains large test suites for mutable state, rebuilder, timers, task generation and retries. Their presence indicates important behavioural contracts, but this audit did not inspect every test case or execute any suite. It does not claim Temporal's current code was validated locally.

#### What we should learn

- Persist workflow identity, run identity, status, version, event history and scheduled tasks.
- Use optimistic version/condition checks for concurrent mutations.
- Rebuild or deterministically rehydrate execution state from durable history.
- Separate state persistence from notifications and downstream side effects.
- Model retries, timers, signals, cancellation and continue-as-new explicitly.
- Define workflow migrations and compatibility when state-machine shape changes.

#### What not to copy wholesale

Temporal is a distributed workflow server with significant infrastructure and operational complexity. We likely need a durable workflow component, not a fork of Temporal internals. Evaluate using Temporal/DBOS as a workflow runtime versus building simple process orchestration ourselves; do not recreate its cluster/state history mechanisms without a clear need.

#### Open questions

- Inspect persistence backend implementations (SQL/Cassandra) and transaction/version conditions.
- Follow task generation into matching/worker queues and timer processing.
- Inspect retry/backoff/cancellation logic and visibility/indexing.
- Examine worker replay determinism constraints and workflow versioning.
- Run selected focused tests and failure-injection scenarios after cloning.

### Repository audit — dbos-inc/dbos-transact-ts

> Source: [open-source-references/dbos.md](../../open-source-references/dbos.md) (repository audit)

**Role:** durable workflow execution and state persistence reference.  
**Repository:** [dbos-inc/dbos-transact-ts](https://github.com/dbos-inc/dbos-transact-ts), branch `main`.  
**Validation:** source inspected; no test or runtime execution performed.

#### Runtime model

`DBOS.workflow` and `DBOS.step` decorators register functions with the runtime. The `DBOS.step` documentation says a step invoked within a workflow is checkpointed and can have retry/timeout semantics; called outside a workflow it behaves as an ordinary function. This distinction means durable semantics depend on the call context and registration mechanism.

`DBOSExecutor` holds a system database and coordinates workflow execution, queueing, execution ownership and recovery. `workflow.ts` represents explicit statuses including PENDING, SUCCESS, ERROR, CANCELLED, ENQUEUED, DELAYED and SUSPENDED. A suspended workflow can be parked in the database until a receive or timer/sleep resumes it. Workflow metadata includes executor ID, application version, ownership and timing/deadline fields.

`system_database.ts` references persistent tables such as `workflow_status`, `operation_outputs`, `workflow_events`, `workflow_schedules`, queues and streams. The inspected source describes PostgreSQL `LISTEN/NOTIFY` as a wakeup signal sent from transaction triggers only after the row commit; notifications are coalesced off the write path. It also contains controls for poll concurrency, database pool starvation, statement timeout and idle-in-transaction timeout.

#### Design lessons

- Durable workflow state is data in a system database, not just an in-memory queue.
- A step boundary is a checkpoint/replay boundary; external effects need idempotency or their own durable state.
- Timers, waits, cancellation and workflow ownership must be modelled explicitly.
- Database-pool fairness and notification pressure matter under high workflow fan-out.
- Queue dispatch and status updates are part of control-plane correctness.

#### Open questions

The inspected code is not enough to claim full semantics for every retry/recovery path. Follow-up should trace operation output commit and replay, exactly-once claims vs at-least-once external effects, worker leases, application upgrades, queue deduplication, migrations and corresponding test cases. The original archive notes that some advanced capabilities are in a separate enterprise package; check the current licence/package boundary before relying on them.

#### Adoption recommendation

Use DBOS or Temporal as a workflow engine candidate, not as the ontology or action database. Keep local action commit and the outbox pattern in the platform's domain layer; let the durable workflow coordinate approvals, external APIs, waits, retries and reconciliation.

### Durable workflow engines: Temporal vs DBOS — Phase 2

> Source: [open-source-references/durable-execution-comparison.md](../../open-source-references/durable-execution-comparison.md) (repository audit)

**Snapshot:** Temporal TypeScript SDK at `8447c6928c773072a94d5f206a34465e3d9ea7df`; DBOS TypeScript at `adde4eb4037d64cd3072d5c6b875cf0bd2927d75` (27 November 2026).  
**Evidence level:** source/test sources and current official docs inspected; no test suite or benchmark run.

#### The shared problem

Long-running enterprise work cannot be represented safely as a request handler that calls several services and hopes the process stays alive. A durable runtime must record progress, retry failed work, recover after worker/process loss, expose status and cancellation, and make repeated attempts safe. This matters for document intake, conflict checks, review approvals, deadline preparation, notifications and external integrations.

#### Temporal: event-history replay and deterministic orchestration

Temporal documents Event History as the source of truth for a workflow execution. On recovery, workflow code is replayed against recorded events to reconstruct state; activities record results and are not re-executed during replay. Workflow orchestration must be deterministic, so time, randomness, network calls, DB queries, LLM calls and file IO belong in Activities or other supported side-effect boundaries. Timer and other workflow APIs are replay-aware.

Long-lived workflows add a versioning requirement: changing the command sequence can break replay for executions already in flight. Temporal documents Workflow Patching and Worker Versioning as mechanisms to evolve running workflow definitions without violating determinism. Its TypeScript docs also recommend replaying representative historical event histories in CI to detect nondeterministic code changes.

Sources:

- [Temporal workflow execution and replay](https://docs.temporal.io/workflows)
- [Temporal TypeScript workflow versioning](https://docs.temporal.io/develop/typescript/workflows/versioning)
- [Temporal replay testing guidance](https://docs.temporal.io/develop/typescript/best-practices/testing-suite#how-to-replay-a-workflow-execution)
- [Temporal TypeScript SDK source snapshot](https://github.com/temporalio/sdk-typescript/tree/8447c6928c773072a94d5f206a34465e3d9ea7df)

#### DBOS: durable steps and transaction-aware persistence in PostgreSQL

DBOS's official docs describe durable workflows and steps backed by a PostgreSQL system database. Completed steps are checkpointed, so workflow recovery can continue from recorded step results rather than repeat every completed step. Its documented guarantee distinguishes ordinary steps (at-least-once execution attempts; code must be idempotent) from DBOS transactions whose database updates and checkpoint can commit together for exactly-once transactional effects within that database boundary.

The TypeScript `tests/recovery.test.ts` source contains concrete recovery scenarios: a workflow can run again after being marked pending; recovery attempts can hit a maximum and enter a dead-letter state; a workflow can be resumed; stale recovery sweeps are ownership-conditional; and duplicate recovery of a running workflow can cause a new execution to become owner while a stale execution is fenced at its next write/checkpoint. This is meaningful evidence of how DBOS approaches multi-executor recovery, but the tests were read, not run.

Sources:

- [DBOS TypeScript workflow recovery tests](https://github.com/dbos-inc/dbos-transact-ts/blob/adde4eb4037d64cd3072d5c6b875cf0bd2927d75/tests/recovery.test.ts)
- [DBOS TypeScript workflow implementation](https://github.com/dbos-inc/dbos-transact-ts/blob/adde4eb4037d64cd3072d5c6b875cf0bd2927d75/src/workflow.ts)
- [DBOS durable workflow guarantees](https://docs.dbos.dev/typescript/tutorials/workflow-tutorial)
- [DBOS architecture](https://docs.dbos.dev/architecture)

#### Comparison for this product

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

#### Key design rule — exactly-once stops at the transactional boundary

Neither workflow engine can make an arbitrary third-party HTTP endpoint exactly-once merely by retrying a durable step. If a request reaches the other system but the client times out before recording the response, a retry may repeat the operation. Use receiver-supported idempotency keys, deduplication, an operation ledger and reconciliation. For systems without idempotency, model uncertainty explicitly (e.g. `dispatch_unknown`) and reconcile before resubmitting.

#### Provisional recommendation

Do not select on API ergonomics. Since the proposed platform is already likely to use PostgreSQL for canonical metadata and object state, DBOS deserves the first local proof for DB-coupled matter workflows and transactionally checkpointed steps. Keep Temporal as a serious comparator if orchestration must be independently operated, multi-language, long-running across many heterogeneous workers, or more isolated from the application's database. This is a **proposed experiment**, not a final technology decision.

#### Minimal bake-off workload

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

### 11. Workflow state should be reconstructible

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#11-workflow-state-should-be-reconstructible)

Temporal stores workflow mutation and event-history information through a coordinated persistence request and has a mutable-state rebuilder that reapplies events, versions and state-machine transitions. DBOS uses checkpointed operations and workflow status/output records. Both imply the workflow engine should be able to recover after process loss without trusting process memory.

**Design implication:** persist workflow state transitions, version, event log, scheduled tasks and external-effect checkpoints. Treat downstream notifications as a separately recoverable operation.

## Research literature

### 10. Durable execution for agents

> Source: [general-references/10-papers-agents-memory-eval.md § 10. Durable execution for agents](../../general-references/10-papers-agents-memory-eval.md#10-durable-execution-for-agents)

**Plain English.** If the server restarts halfway through "approve invoice, then pay supplier, then email confirmation", you must not pay twice or forget to email. Durable execution records each completed step so the run resumes exactly where it stopped.

- Anthropic: agents are long-running and stateful, so errors compound. They resume from the failure point using checkpoints and retries, and use rainbow deployments so in-flight runs keep old code [Fact, multi-agent post].
- Temporal (Egger and Androulakis, 12 Nov 2025): the workflow is a deterministic `while` loop. "Ask the LLM for the next action" is an activity, and so is "execute the chosen tool". Results append to history. On a crash the workflow replays recorded results rather than re-calling the LLM, so decisions do not change. Plans can fan out as child workflows [Fact, https://temporal.io/blog/of-course-you-can-build-dynamic-ai-agents-with-temporal]. Signals for human input, event-history limits and continue-as-new were not covered in that post [Unverified].
- DBOS (Peter Kraft, 20 May 2026, updated 12 Nov 2026): workflows and step outputs are checkpointed in Postgres tables. The queue is a Postgres table that workers poll with row locks. There is no orchestrator server. Workers recover each other's workflows, and duplicate checkpoints fail on integrity constraints. Claimed throughput is tens of thousands of workflows per second on one Postgres server and over 1M per second sharded [Vendor claim, https://dbos.dev/blog/postgres-is-all-you-need-for-durable-execution].
- Restate: a journal of durable steps (LLM and tool calls). Durable promises for human approval suspend without compute. Virtual Objects keyed by session give one instance per key and queued interactions. Parallel tool calls need promise combinators because replay is non-deterministic [Vendor claim, https://restate.dev/blog/durable-ai-loops-fault-tolerance-across-frameworks-and-without-handcuffs].
- MCP 2026-07-28 removed SSE resumability: a broken stream loses the in-flight request. That makes idempotency keys on action tools mandatory in practice [Fact plus Inference].

## Design decisions already in the reference maps

### 14. Durable execution

> Source: [general-references/32-map-research-and-cost.md § 14. Durable execution](../../general-references/32-map-research-and-cost.md#14-durable-execution)

**Purpose.** If the server restarts midway through "allocate payment, then close the dunning case, then send the confirmation", nothing is done twice and nothing is forgotten.

**Design to implement (fits a single Postgres stack).**
- Durable-workflow table `agent_steps(run_id, step_no, kind: llm|tool|approval, input_hash, output, status, created_at)`, or a library that checkpoints to Postgres (DBOS-style).
- The loop body is deterministic code. Each model call and each tool call is a checkpointed step. On recovery, replay recorded outputs; never re-call the model or re-send.
- Job queue as a Postgres table polled with row locks. Duplicate checkpoints fail on integrity constraints.
- Human approvals are durable waits that consume no compute.
- Every write tool takes an `idempotency_key`, stored with a unique constraint.
- Versioned workers (rainbow deployment), so in-flight runs finish on the code they started with.

**Evidence.**
- Anthropic's research system needed resumable checkpoints and rainbow deployments because errors compound [Fact] (multi-agent post).
- Temporal maps the LLM call and each tool call to activities replayed from history [Fact] (Temporal blog).
- DBOS claims tens of thousands of workflows per second on one Postgres server [Vendor claim].
- Restate: durable promises for approvals [Vendor claim].
- MCP 2026-07-28 removed SSE resumability, so a broken stream loses the in-flight request and idempotency keys become mandatory in practice [Fact plus Inference]. All from document 10, section 10.

**Copies.** Document 10, section 10 and "What to copy" items 2 and 4. https://temporal.io/blog/of-course-you-can-build-dynamic-ai-agents-with-temporal ; https://dbos.dev/blog/postgres-is-all-you-need-for-durable-execution ; https://restate.dev/blog/durable-ai-loops-fault-tolerance-across-frameworks-and-without-handcuffs

**Left out.** A separate orchestrator server (Temporal) in version 1. [Inference] The single-repository Postgres stack favours the DBOS-style approach. Document 13 (section 6) also prices Inngest at $99/month as an alternative.

**Open questions.** Temporal's signals and continue-as-new are [Unverified]. Restate's parallel-call replay caveat applies if tools run in parallel.

### 6. Durable jobs

> Source: [general-references/33-map-context-code-integration.md § 6. Durable jobs](../../general-references/33-map-context-code-integration.md#6-durable-jobs)

**Purpose.** Long or failure-prone work (syncs, write-back to the ledger, multi-step agent tasks, scheduled reminder runs) survives crashes and is resumed, not blindly re-run. Receivables example: the process dies after Xero accepted a credit-note note but before the local commit; on restart, the memoised step result is reused and the local commit completes.

**Design to implement.**
- **DBOS Transact TS (MIT core)** as the durable workflow layer. State lives in Postgres system tables: `workflow_status` (status, name, authenticated_user, assumed_role, request, output, error, executor_id, created_at), `operation_outputs(workflow_uuid, function_id, function_name, output, error)` (the per-step memo that makes replay safe), `notifications`, `workflow_events`, `workflow_schedules`, `queues`, `application_versions` [Fact].
- Do not use the four features gated behind the proprietary `@dbos-inc/dbos-enterprise` package: auto-upgrade, sharding, suspend workflows, external storage [Fact].
- **pg-boss 12 (MIT)** as the alternative for plain job queues (partitioned `job` table per queue, `queue`, `schedule`, `subscription`) [Fact].
- Workflows to put on it [Inference]: per-stream sync runs (one workflow per connection per schedule tick); action write-back (section 13 step 7 as a DBOS step); nightly reconcile; reminder playbook evaluations (section 11); phase-B LLM extraction (section 7); daily context normalisation (section 9).
- Ingestion idempotency on `(source_id, source_type, unit_id)` (mycontext, design only [Fact]).
- Human-in-the-loop parking: a step waiting for approval parks without spending an attempt (AgentScope SOP [Fact]); LangGraph's `interrupt(value)` and resume is the same idea [Fact].

**Copies.**
- Document 14, section 25: DBOS tables and enterprise gate; pg-boss; Temporal weight. https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts ; https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/enterprise.ts ; https://github.com/timgit/pg-boss/blob/HEAD/src/plans.ts
- Document 14, "What to copy" 3: pending-invocation record via `operation_outputs`.
- Document 14, section 24: AgentScope SOP parking. https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py

**Left out, and why.** Temporal: a separate multi-service cluster; skip until there are operations staff (document 14). DBOS enterprise features: proprietary.

**Open questions.** Whether DBOS's per-step memo covers external side effects whose response is lost mid-flight (document 14 does not say) [Inference: still pass an idempotency key to the ledger where it supports one].

## Earlier engineering notes (Phase 2)

### Durable workflow and automation design

> Source: former `07-workflow-and-automation/durable-workflows.md` (moved here in the Nov 2026 restructure)

#### Separate workflow from action

An action is a single validated business state transition. A workflow is a durable process that may invoke several actions, wait for humans or external systems, pause, retry, compensate, time out and resume days later.

#### Workflow record

A workflow instance should persist definition/version, input snapshot or references, actor/agent identity, tenant, current state, step cursor, attempts, deadlines, wait tokens, event subscriptions, errors, output references, execution owner/lease and audit/trace identifiers.

#### Required capabilities

- durable timers and sleep;
- message/event receive and correlation;
- deterministic step checkpoints;
- retries with bounded exponential backoff and jitter;
- deduplication and workflow ID reuse policy;
- cancellation and timeout semantics;
- human approval with identity and decision audit;
- compensation for reversible steps;
- explicit manual-review path for irreversible effects;
- DLQ and replay tools;
- version-aware workflow execution;
- operator visibility for stuck, delayed, failed and divergent instances.

DBOS is a PostgreSQL-based durability reference; Temporal is an alternative with a separate service cluster. Neither is an ontology or policy engine. The workflow runtime should call actions and connectors through typed contracts.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **DBOS system tables (MIT core, code):** [`dbos-inc/dbos-transact-ts` → `src/sysdb_migrations/internal/migrations.ts`](https://github.com/dbos-inc/dbos-transact-ts/blob/adde4eb/src/sysdb_migrations/internal/migrations.ts) now creates `workflow_status`, `operation_outputs` (per-step memo), `workflow_inputs`/`workflow_input`/`workflow_output`, `workflow_events`, `workflow_events_history`, `workflow_queue`, `queues`, `notifications`, `streams`, `workflow_schedules`, `scheduler_state`, `event_dispatch_kv`, `external_objects`, `application_versions`, `dbos_migrations`.
- **pg-boss 12.40.0, MIT (code):** tables `job` (partitioned per queue), `job_dependency`, `queue`, `queue_stats`, `schedule`, `subscription`, `warning`, `version`, `bam`, `instance` — [`timgit/pg-boss` → `src/plans.ts`](https://github.com/timgit/pg-boss/blob/b2198aa/src/plans.ts).

## Palantir (updated 28 Nov 2026)

- Palantir does not expose a general durable-workflow engine; long work runs as Automate effects and Agent Stack sessions (see [automations-and-triggers](automations-and-triggers.md) and [session-state-and-memory](../08-agent-platform/session-state-and-memory.md#palantir-updated-28-nov-2026)); action retries are limited to actions without external calls.

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Changed (code) — DBOS enterprise gates.** `src/enterprise.ts` now gates `autoUpgrade`, `sharding`, `suspendMode`, `externalStores` and **`workflowArchive`** (research listed four, with older names `suspendWorkflows`/`externalStorage`). The system database also has new tables (`streams`, `scheduler_state`, `event_dispatch_kv`, `workflow_queue`). [`dbos-inc/dbos-transact-ts` → `src/enterprise.ts`](https://github.com/dbos-inc/dbos-transact-ts/blob/adde4eb/src/enterprise.ts)
- **Changed (code) — pg-boss 12.40.0** (research: 12.38.2), now with a `job_dependency` table.
- **New — Temporal.** Task Queue Priority & Fairness became GA (May 2026); the Rust SDK went GA (Sep 2026); OSS server images were slimmed in v1.30 (breaking for Docker/Helm users). Sources: https://temporal.io/changelog/product-area/server , https://temporal.io/blog/durable-digest-february-2026

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
