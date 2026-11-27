# 05-actions-and-rules — Actions and rules

The only way state changes: typed actions through a gate with transactions, deterministic rules and decision tables, dry runs, approvals and action marking.

[← Engineering index](../README.md)

| Component | What it is | Lines | Sources |
|---|---|---:|---:|
| [action-types](action-types.md) | The only way state changes: typed, permissioned action definitions with parameters, rules and side effects. | 220 | 5 |
| [action-gate-and-transactions](action-gate-and-transactions.md) | Executing an action: checks, dry run, transaction boundary, isolation, outbox and external effects. | 313 | 9 |
| [rules-and-decision-tables](rules-and-decision-tables.md) | Business rules as governed, versioned objects evaluated by deterministic engines and decision tables. | 345 | 10 |
| [scenarios-and-dry-runs](scenarios-and-dry-runs.md) | Trying a change against a copy of state before committing it. | 70 | 2 |
| [approvals-and-action-marking](approvals-and-action-marking.md) | Marking each action allowed / needs approval / never allowed, approval flows, and keeping money movement away from the model. | 170 | 6 |
