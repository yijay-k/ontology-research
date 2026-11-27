# Durable workflow and automation design

## Separate workflow from action

An action is a single validated business state transition. A workflow is a durable process that may invoke several actions, wait for humans or external systems, pause, retry, compensate, time out and resume days later.

## Workflow record

A workflow instance should persist definition/version, input snapshot or references, actor/agent identity, tenant, current state, step cursor, attempts, deadlines, wait tokens, event subscriptions, errors, output references, execution owner/lease and audit/trace identifiers.

## Required capabilities

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
