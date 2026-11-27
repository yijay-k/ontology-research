# Edits and merge precedence

**Layer:** [03-ontology-engine](README.md) · **What it is:** How user and agent edits are stored as a layer over source data, and which wins when they conflict.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Palantir

### 12. How user edits merge with datasource data (and writeback)

> Source: [general-references/02-palantir-ontology.md § 12. How user edits merge with datasource data (and writeback)](../../general-references/02-palantir-ontology.md#12-how-user-edits-merge-with-datasource-data-and-writeback)

Plain English: the source system says the order status is "shipped"; an operator corrects it to "returned". Which wins tomorrow when the source reloads?

Technical detail (all [Fact] from https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/ unless noted):
- Edits are enabled per object type. An action writes to the index immediately; Funnel queues each edit with offset tracking (supporting concurrent edits) and periodically flushes them into a Funnel-owned merged dataset. Read-after-write is guaranteed once the modification is sent.
- Merge builds run when a new source transaction lands, or every 6 hours if edits exist.
- **Strategy 1 (default) "apply user edits":** edited properties keep the edit forever; unedited properties follow the source. If a source row disappears, the object leaves the Ontology unless it was created by a user edit; if the row returns, earlier edits reapply. A user-created object takes properties only from the create edit; later source values for those properties are ignored; unset properties are null.
- **Strategy 2 "apply most recent value"** (OSv2): requires a UTC timestamp column in the source; per property, an edit applies only if its time is later than the source timestamp. Edit-only properties always apply; null source timestamps mean edits always apply; changing the timestamp via an edit does not count. Multi-datasource types: each property follows its datasource's strategy.
- **Deletes** are not edits; a deleted object stays hidden whatever the source says; recreation does not inherit edits; modifying a deleted object fails.
- Individual edits cannot be reverted except via the toast; "drop all edits" resets a type to source.
- **Writeback / materializations.** OSv1 needed a writeback dataset for edits; OSv2 does not. OSv2 materializations are optional datasets (or restricted views) of current state (source + edits), schema = property API names; automatic mode propagates edits in minutes, periodic mode on new data or every 6 hours; only the latest snapshot is retained; `__`-prefixed columns are internal. Multiple materializations per type allowed (for example property subsets). [Fact] https://www.palantir.com/docs/foundry/object-edits/materializations/
- **External writeback** is the webhook mechanism in actions (section 7), not the dataset.

### 10. Action log, edit history, metrics

> Source: [general-references/02-palantir-ontology.md § 10. Action log, edit history, metrics](../../general-references/02-palantir-ontology.md#10-action-log-edit-history-metrics)

Plain English: every time someone (or an agent) does something, the system keeps a structured record of who, what, when, why, and which objects changed.

Technical detail:
- **Action log** schema: required action RID, action type RID, action type version (auto-increment), timestamp (OSv2 commit timestamp), user, edited object primary keys, webhook IDs (sync and async), notification IDs and recipients, scenario RID, revert flag/user/time. Optional: parameter values, properties of single-valued object parameters, and extra properties of edited objects for later aggregation. A human-readable summary (max 20 parts, literal parts ≤ 50 characters). Successful submissions only (failures go to action metrics); includes API, SDK and inline edits; forward-only, no backfill; log property types are fixed; function-backed actions must declare edit provenance. An object type can require that all its action types have logs. [Fact] https://www.palantir.com/docs/foundry/action-types/action-log/
- **Edit history** (OSv2): records every direct user edit per object (not pipeline changes), enabled per object type; turning it off deletes history permanently; anyone who can see the object can see its full history, including from a previous incarnation with the same primary key. Exposed at `/v2/ontologies/{ontology}/objectTypes/{objectType}/editsHistory`. [Fact] https://www.palantir.com/docs/foundry/object-edits/user-edit-history/ ; `foundry_sdk/v2/ontologies/object_type.py`
- Action metrics (success/failure rates, duration) and monitoring are separate features (pages listed but not opened). [Unverified on detail]

## Design decisions already in the reference maps

### 4. The edits layer and merge precedence

> Source: [general-references/30-map-palantir-platform.md § 4. The edits layer and merge precedence](../../general-references/30-map-palantir-platform.md#4-the-edits-layer-and-merge-precedence)

**Purpose.** Staff and agents record decisions on top of data the product does not own, and the next sync must not silently undo them. *Receivables example:* the ERP still says INV-1001 is `open`, but a collector records `Dispute raised` and sets `collectionStage=on_hold`. Tomorrow's ERP sync must not reset the stage.

**Design to implement.**
- **Overlay table** [Inference on shape]: `object_edit(id, tenant_id, object_type, pk, property, value jsonb, edit_kind set|create|delete, edited_at timestamptz, action_log_id, seq bigserial)`. An action writes to the index immediately and edits are queued with offset tracking, so read-after-write holds once the change is sent [Fact 02].
- **Merge runs** when a new source transaction lands, or every 6 hours if there are edits [Fact 02].
- **Precedence strategy, set per datasource and recorded in the IR** [Fact 02]:
  1. **"Edits win" (default).** An edited property keeps the edit permanently, and unedited properties follow the source. If a source row disappears, the object leaves the model unless a user created it. If the row comes back, the earlier edits reapply. A user-created object takes properties only from its create edit.
  2. **"Most recent wins" (opt-in).** The source needs a UTC timestamp column. For each property, an edit applies only if it is later than the source timestamp. Edit-only properties always apply. A null source timestamp means the edit applies. Changing the timestamp itself through an edit does not count.
- **Deletes** are not edits. A deleted object stays hidden whatever the source says. A recreated object with the same key does not inherit old edits, and modifying a deleted object fails [Fact 02].
- **Drop all edits** resets a type to the source [Fact 02].
- **Receivables rule** [Inference]: properties owned by the ERP (amount, currency, issue date, due date, ERP status) are **not editable** in the IR. Collection-side facts (stage, promise, dispute flag, next action date) are edit-only properties. This avoids the trap where an "edits win" correction to an amount hides later ERP credit notes forever.
- **Edit history**, separate from the action log, records every direct edit per object, but not pipeline changes. It is enabled per object type. Switching it off deletes the history permanently. Anyone who can see the object can see its full history, including from a previous incarnation with the same key [Fact 02].
- **Current-state output (materialization).** A current-state table (source plus edits) whose schema is the property API names. Palantir propagates edits to it within minutes in automatic mode and keeps only the latest snapshot [Fact 02]. Implement it as a Postgres view over source and overlay, materialised for heavy reads [Inference].
- **Schema migrations for edited types.** Breaking changes are a change to the input datasource, the primary key, a property's data type, or deleting an edited property. Saving is blocked until each one has a migration: drop, move, cast (from a fixed cast matrix), backfill (user-created objects only, never overwriting), or revert. There is a cap of 500 migrations at once and none on the primary key [Fact 02].

**Copies.**
- Document 02, §12 "How user edits merge with datasource data": both strategies, deletes, drop all edits, materializations. https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/ , https://www.palantir.com/docs/foundry/object-edits/materializations/
- Document 02, §10: edit history. https://www.palantir.com/docs/foundry/object-edits/user-edit-history/
- Document 02, §13: schema migrations. https://www.palantir.com/docs/foundry/object-edits/schema-migrations/
- Document 01, §20: the merge stage in Funnel and the 6-hour persistence run. https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/

**Left out, and why.**
- Writeback datasets: needed only on Palantir's deprecated OSv1 [Fact 02].
- Streaming object types, which accept no user edits [Fact 01]: no streaming in version 1.
- Direct datasources (beta): not needed.

**Open questions.**
- How long do action logs and edit history live? Not found in 02 [Unverified].
- Should edits be written back to the ERP? Palantir does external writeback through webhooks in actions (section 8), not through the dataset [Fact 02]. Version 1 assumes collection facts stay in the product.

---

## Fact-check notes

_Checked 28 Nov 2026 against current vendor documentation and project pages. **Confirmed** = the research above still matches. **New** = not in the research above. **Changed** = the research above is now out of date._

- **Confirmed — two conflict strategies.** "Apply user edits" (default: the edit always wins for edited properties) and "Apply most recent value" (an edit applies only if its timestamp is later than the datasource's timestamp). Source: https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/
- **New — the strategy is set per datasource, not per object type.** On a multi-datasource object type each datasource can use a different strategy, and one edit that touches properties from several datasources follows each property's own datasource strategy. Source: same page.
- **New — exact rules for "most recent value":** needs a *timestamp* property (not a date), in UTC; takes effect on save; existing edits are compared against the time the strategy was changed, new edits against action submission time; edit-only properties always apply; if the datasource timestamp is empty, all conditional edits apply; user edits to the timestamp property itself do not change the comparison. Source: same page.
- **New — "Create object" on a key that already exists in the source.** Under "Apply user edits", unedited properties become null and later datasource updates to those properties are ignored. A community answer confirms the same trap: unset properties are stored as implicit nulls in the edit layer and win over the source. Sources: same page; https://community.palantir.com/t/object-edits-conflict-resolution-strategy-not-working-as-expected/6479
- **Confirmed — deletes.** A row removed from the source removes the object, but if the row returns its earlier edits are re-applied; a "Delete object" action is sticky even if the source row changes; an object created by an edit survives source deletion; modifying a deleted object fails. Deletions are not treated as edits, so a recreated object does not inherit earlier edits. Source: same page.
- **Confirmed — persistence.** Edits apply to the index immediately and are flushed to Funnel-owned datasets; the merged dataset rebuilds on each new source transaction or every 6 hours if edits exist. In OSv2 a read after an edit is guaranteed to see it. Source: same page.
- **New — OSv2 weakened optimistic concurrency on purpose.** The Actions server version-checks only the objects used to generate edits, so objects read outside edit generation may change during an action. Separately, an action fails with `Actions:ObjectVersionChanged` (HTTP 409) if the object type's backing datasource updates while the action runs — the check tracks datasource updates for the whole type. Sources: same page; https://www.palantir.com/docs/foundry/action-types/debug-conflict-errors/
- **Confirmed — undo.** A single edit cannot be undone directly; "drop all edits" (Delete edits) resets a type to its sources. Source: same page.

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
