# Phase 2 research — agent sessions, typed context and evaluation

**Research date:** 27 November 2026  
**Evidence:** Palantir official Agent Stack / Agent Manager / AIP Evals documentation and original agent-company maps. No hosted agent or eval suite was run.

## 1. An agent task needs durable session state

The public Palantir Agent Stack models one task as a session:
- a session contains agent work, its state, context items and event history;
- context items are typed records (messages, tool results, recommendations, decisions, structured outputs);
- events carry input from people, tools or other applications;
- the agent state machine decides how events update context or transition the task, including to a waiting-for-review state;
- sessions can remain open indefinitely while awaiting a person or an external event.

This is materially different from storing a long conversation transcript and replaying it into a prompt on every request. The durable unit is a task with versioned context and state transitions.

Official sources:
- https://www.palantir.com/docs/foundry/aip/agent-stack
- https://www.palantir.com/docs/foundry/agent-manager/overview
- https://www.palantir.com/docs/foundry/agent-manager/session-debugging

## 2. Agent Manager implies access control over the task record itself

Palantir documents published agents as governed resources. Access to the agent does not automatically grant access to every session; session visibility is separately subject to mandatory and discretionary permissions. This is an important design point for multi-user, long-running workflows: the task transcript, tool outputs and decisions can contain sensitive customer/matter information and require explicit access control.

Our agent/session schema should carry:
- tenant and resource/matter scope;
- initiating principal and delegated agent identity;
- agent version and tool-registry version;
- session state and current state-machine version;
- typed context item references;
- event sequence and workflow correlation;
- visibility/ACL policy and retention classification;
- policy decisions and approvals associated with each write.

## 3. AIP Evals is a regression process, not a one-off prompt score

AIP Evals documents:
- suites containing test cases, target functions and evaluators;
- metrics per test case and aggregate across suites;
- comparisons against previous versions;
- comparisons between different models/parameters;
- multi-run variance investigation;
- execution traces/debugging and configurable thresholds.

Palantir recommends executing LLM-backed test cases at least three times because non-determinism can make a single run misleading. The run metadata can record branch, version and model. Its experiments view supports comparisons across runs and drilling into per-case output differences.

Sources:
- https://www.palantir.com/docs/foundry/aip-evals/overview
- https://www.palantir.com/docs/foundry/aip-evals/run-suite
- https://www.palantir.com/docs/foundry/aip-evals/experiments

## 4. Proposed agent release unit

Treat an agent release as an immutable versioned bundle:
- procedure/SOP and prompt/instructions;
- model/provider and sampling/configuration;
- tool schemas and permissions;
- ontology/model and metric versions;
- knowledge/index snapshot and data scope;
- policy/guardrail versions;
- evaluator/golden-case suite version;
- workflow state-machine version;
- release metadata, approval and rollback pointer.

A production session should pin an agent release and record any explicitly allowed dynamic dependencies. Otherwise an ongoing workflow may change behaviour midway when prompts, tools, models or knowledge are updated.

## 5. Evaluation rubric for operational agents

A single answer-quality score is not enough. Measure at least:
1. **Task outcome:** did the required system state reach the intended end state?
2. **Policy compliance:** was every read, tool call and action permitted?
3. **Evidence correctness:** are claims linked to correct source documents/versions/spans?
4. **Tool correctness:** correct inputs, sequencing, handling errors and no unauthorized calls.
5. **Communication and escalation:** did the agent ask for approval or hand off at the proper boundary?
6. **Reliability:** pass rate across repeated trials, variance, failure-mode distribution.
7. **Economics:** tokens, tool calls, latency and human-review time per successful task.

Report answer quality separately from workflow completion and policy compliance. A correct-looking response with no required state change is not a completed task; a completed action with a policy breach is a hard failure.

## 6. Tests and controls

- Resume a session after process restart and after long approval wait.
- Deliver events out of order or twice; verify event sequence and idempotency.
- Revoke the initiator's or agent's access during a paused session; verify the next event cannot continue under stale authority.
- View session as another firm user without matter access; deny.
- Pin session to agent/tool/ontology versions and test release change during execution.
- Run golden cases at least three times and report variance.
- Add a failing production case to the golden set and verify it blocks promotion.
- Verify rollback moves new sessions to the prior release without mutating historical traces.
