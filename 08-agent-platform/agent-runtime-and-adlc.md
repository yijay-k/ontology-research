# Agent runtime and agent development lifecycle

## Runtime responsibilities

- Resolve agent identity, tenant, delegated principal and session scope.
- Construct context from ontology objects, documents, graph facts, policies, metrics and workflow state.
- Route to model(s) under budget/privacy/capability constraints.
- Plan tool use through a typed tool registry.
- Separate read/query tools from write/action tools.
- Require server-side policy enforcement for every tool invocation.
- Record tool inputs/outputs, policy result, citations, token/cost, latency and state transition.
- Persist only selected memory/facts with provenance, retention and correction logic.
- Escalate ambiguous/high-risk cases to a human.

## Tool classes

`READ` (retrieve/inspect), `QUERY` (structured semantic read), `PROPOSE` (produce a draft edit/action plan), `WRITE` (execute a named action), `EXTERNAL` (invoke an external connector), `APPROVAL` (ask a human). Tools should declare read-only, destructive, idempotent and approval characteristics. No raw database or unrestricted generic mutation tool should be exposed to the model.

## Agent Development Lifecycle (ADLC)

Author agent specification → connect tools/knowledge → inspect generated journey/plan → run unit simulations → run scenario suite → test authorization and adversarial prompt injection → human review → versioned release → canary/split rollout → monitor traces and outcomes → convert failures into regression cases → rollback or remediate.

Sierra's public Agent Studio material demonstrates journeys, integrations, traces, simulations and staged release governance. Decagon's AOPs suggest a separation between business-authored procedures and engineer-controlled tools/guardrails. Treat these as product patterns rather than evidence of their full private runtimes.

## Evaluation

A task should score business-system end state, policy/guardrail compliance, correct communication, citations/evidence, escalation quality and consistency across repeated trials. Report pass@k and pass^k separately. A high-quality answer that failed to update the required system is not a successful operational task; a successful state change accompanied by a policy violation is also a failure.
