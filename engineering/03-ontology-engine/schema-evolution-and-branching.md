# Schema evolution and branching

**Layer:** [03-ontology-engine](README.md) · **What it is:** Changing the model safely: versioning, migrations, branches, proposals and review of ontology changes.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Open-source implementations](#open-source-implementations) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (2)

## Palantir

### 13. Schema evolution, Ontology Manager, branching and proposals

> Source: [general-references/02-palantir-ontology.md § 13. Schema evolution, Ontology Manager, branching and proposals](../../general-references/02-palantir-ontology.md#13-schema-evolution-ontology-manager-branching-and-proposals)

Plain English: changing the model is a governed change process, like code review, because apps and agents depend on it.

Technical detail:
- **Ontology Manager** is the UI for types, datasources, properties, security, materializations, capabilities (action logs) and statuses; saving stages then commits changes; "History" allows reverting saved changes. [Fact] create-object-type page; schema-migrations page.
- **Breaking changes** on types with edits: changing input datasources, primary key, property data type, property ID with edits, deleting a property or struct field with edits, changing a struct field type. Non-breaking: display name, title key, render hints, type classes, visibility; changes to never-edited properties. Saving is blocked until each breaking change has a migration: drop property/field/all edits, move edits, cast (a fixed cast matrix, for example String→Integer/Long/Double/Boolean/Date/Timestamp/Geopoint/Geoshape), backfill a value (only on user-created objects, never overwriting), revert migration. Saving creates a new schema version and a replacement pipeline; the new version becomes queryable after hydration. Max 500 migrations at once; none on the primary key. [Fact] https://www.palantir.com/docs/foundry/object-edits/schema-migrations/
- **Branching.** Ontology branches integrate with Foundry Global Branching; branches are created only from main; object, action, link, interface and shared property types can be "protected" so changes must go via a branch; indexing on a branch makes test data available; branches rebase automatically until they contain ontology changes, then manually with a per-resource choice (main, branch, custom); a Global Branching proposal creates an ontology proposal with reviewers who approve or reject individual resource tasks; merge requires policy approval and passing checks; indexing on a protected resource itself requires approval. Known merge failures include keeping a branch version of a datasource that main removed. [Fact] https://palantir.com/docs/foundry/ontologies/branching-ontology/ . The REST API accepts a `branch` on action apply. [Fact] `foundry_sdk/v2/ontologies/action.py`
- **Scenarios** are sandboxed what-if edit layers: REST endpoints create scenarios, list edited objects and links, find conflicts and rebase; actions can be applied within a scenario and submission criteria can test "in a scenario". [Fact] `foundry_sdk/v2/ontologies/ontology_scenario.py`; https://www.palantir.com/docs/foundry/action-types/submission-criteria/

## Open-source implementations

### Trace A — ontology definition batch mutation

> Source: [open-source-references/openfoundry.md](../../open-source-references/openfoundry.md) (repository audit)

**Code:** [`batch_save.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/repo/batch_save.go), [`events.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/repo/events.go), [`properties_links.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/handlers/properties_links.go).

`Repo.SaveBatch()` begins one PostgreSQL transaction, creates an audit writer bound to that same transaction, then dispatches each edit by resource/operation. Domain validation and version conflicts are returned as per-edit statuses. If any edit fails, earlier successful entries are downgraded to `skipped` and the function returns without commit; deferred rollback discards all writes. If every edit succeeds, it commits once. Supported resource cases in the inspected code include object types, link types, object-type groups, properties and shared property types.

`EnqueueSchemaEvent()` accepts the caller's `pgx.Tx`; comments require it to be the same transaction as the primary mutation. It creates before/after snapshots and a deterministic event ID derived from aggregate, aggregate ID, event type, version and payload, then inserts through the outbox helper. This is a strong local atomicity pattern: schema edit + audit + outbox intent can commit or roll back together when wired through the same transaction.

**What is implemented:** batch mutation transaction structure and same-transaction event enqueue are visible in code.  
**What is not established:** every one-shot CRUD handler necessarily uses the same semantics, every projection consumes the event, and full historical schema evolution/branch semantics are complete.

## Earlier engineering notes (Phase 2)

### Definition lifecycle

> Source: former `03-ontology-engine/ontology-model-and-runtime.md` (moved here in the Nov 2026 restructure)

Draft → validate → inspect diff → dependency checks → simulation/migration plan → approve → publish immutable version → runtime compatibility window → deprecate old version. Definitions must be addressable by immutable ID and version. Updating a display name should not create a new semantic identity; changing a property's type or key semantics likely requires a migration.

### 8. Model evolution tests

> Source: former `03-ontology-engine/phase2-schema-language-and-relationships.md` (moved here in the Nov 2026 restructure)

- Changing a title/display key must not change canonical identity.
- Changing a primary key must be rejected unless an explicit identity/edit/link migration exists.
- A declared one-to-one link with duplicate targets must fail at the database constraint layer.
- A relationship with attributes must preserve its own history and ACL.
- Interface property change must identify every implementing object type that requires mapping updates.
- Removing a property used by action/query/eval contracts must fail validation or require an explicit migration.
- Model publish failure leaves the last valid version active.
- Two schema versions can coexist while old sessions/workflows remain pinned to the model version they started with.

## Fact-check notes

_Checked 28 Nov 2026 against current vendor documentation and project pages. **Confirmed** = the research above still matches. **New** = not in the research above. **Changed** = the research above is now out of date._

- **Confirmed — breaking changes on types with edits:** changing input datasources, primary key, a property's data type, the ID of an edited property, deleting an edited property or struct field, changing a struct field's type. Saving is blocked until each has a migration. Source: https://www.palantir.com/docs/foundry/object-edits/schema-migrations/
- **New — the complete migration instruction set:** drop all property edits; drop all struct field edits; drop all edits; move edits (property → property, or whole type when the datasource is replaced); move struct field edits; cast property to new type; cast struct field to new type; backfill a value (sets a property on user-created objects only where unset, never overwriting an explicit null); revert migration. Source: same page.
- **New — cast matrix.** Property casts: most scalar types → String; Double ↔ Integer/Long; Integer → Long/Double; Long → Integer/Double; String → Integer, Long, Double, Boolean, Date, Timestamp, Geopoint, Geoshape. Struct-field casts are a narrower set (no Geoshape, Attachment or Mandatory marking). Source: same page.
- **New — limits.** At most 500 migrations applied at once; migrations cannot be applied to the primary key property; failed migrations surface a "Fix schema migrations" option on the replacement pipeline; revert is done from Ontology Manager History. Source: same page.
- **New — branches.** If both a branch and Main contain schema migrations on the same object type, rebasing or merging the branch "will most likely fail". Source: https://www.palantir.com/docs/foundry/ontologies/test-changes-in-ontology
- **New — data restrictions block migrations.** OSv2 enforces type coherence between datasource and object schema on every sync, rejects NaN/±infinity, and schema migrations do not proceed if incompatible values exist — they are not auto-cleaned. Source: https://www.palantir.com/docs/foundry/object-indexing/data-restrictions/

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
