# Gaps: what the openfoundry repo is doing now, and what is pending

**Snapshot 28 Nov 2026**, branch `feat/actions-edit-plans` (not yet merged). Every item below is justified against [00-BUILD-BRIEF.md](00-BUILD-BRIEF.md):
- **L**n is a layer in the brief's §2 table.
- **R**n is a rule in the brief's §3.
- **§4** is the per-layer to-do list.

Status: ✅ done on the branch · 🔜 next · ⏳ pending · ⏸ deferred on purpose.

---

## 1. Done on this branch

The research's core claim is that an ontology is only real once writes are governed and data comes from sources (brief §1, R1). Before this branch, the openfoundry repo was an API copy of Foundry with fake actions. This branch builds layers L2–L7 in the order the brief prescribes, so nothing above them (agents, metrics) sits on a hollow base.

| Feature | What it does | Why (brief) | Evidence | Known limits |
|---|---|---|---|---|
| ✅ Honest actions | Action types read from svc-ontology for the ontology in the path. Logic only reads and returns an edit plan or a refusal. The plan is checked against `modifiedEntities` and declared properties, then committed all or nothing. Refusals answer 200 with `validation.result: INVALID`, as Foundry does. No logic → `ApplyActionFailed`, never a fake success. | L7, R1, R2. It replaced imperative handlers that made 4–5 separate writes and reported `SUCCEEDED` for actions with no logic. | `svc-actions` 42 tests; in-process 3-service test | Logic is code only, with no declarative criteria tree. Only the 4 pest-control actions have logic. |
| ✅ Object versions and conflicts | Every object carries a `version`. Edits carry the version they were planned against; a stale one fails the whole commit with Foundry's `ObjectChanged` (409). The action reruns up to 5 attempts. | L7, R4, R5 | Tests on in-memory and Postgres (both schemas); removing the stamp or the retry fails tests | No protection against write skew across objects an action only reads (R4: use an anchor object) |
| ✅ Dataset → object sync | Object types declare a dataset in Foundry's `ObjectTypeDatasource` shape. Any upload, delete or commit in svc-datasets triggers a resync of every backed type. A bad source (duplicate key, bad value, missing column) fails the whole sync and the old objects stand. | L2, R7. Before this, `datasources` was always `[]` and data never came from datasets. | 27 merge/CSV/route tests; end-to-end over real HTTP | CSV only; one dataset per type; branch ignored; full rescan per change |
| ✅ Edits layer | Action edits are recorded separately from source data. Edited properties outlive source changes; action-created objects aren't driven by the source; deletes stick; a returning row gets its edits back. | L4, R6 | Same tests, on both stores; removing the overlay or sticky deletes fails tests | No "most recent wins" option, edit history, or "drop all edits" |
| ✅ Definition lifecycle | New types default to EXPERIMENTAL (free to change). ACTIVE/DEPRECATED types refuse breaking changes (key, removed property, type change). ACTIVE can't be deleted. No renames. | L3, R9 | 11 tests | Refuses instead of migrating; no version history |
| ✅ Link rules | A link must match a declared link type, its endpoint types, and existing objects. Duplicate → `LinkAlreadyExists`; cardinality ONE → at most one target per source, safe under concurrent requests. | L3, R8. Before, link creation checked nothing. | 7 tests including the concurrent case | Links have no attributes (object-backed links missing); the link store is in-memory only, see §4 |
| ✅ Interface queries | `interfaceBase` object sets return every implementing type's objects. Unknown set types answer 400 instead of an empty result. | L5, R10 | 4 tests | No interface-to-object property mapping |

**Repo gates on the branch:** build 49/49, typecheck 45/45, lint 0 errors, unit tests 97/97, in-process integration 76 passed.

---

## 2. Pending, in priority order

The order follows the brief's build sequence (§2) and its stated next steps: finish the layers already started before opening new ones. Size: S = hours, M = 1–2 days, L = several days.

### P0: finish the write path (L3, L4, L7)

These close holes in what is already built. Without them the write path is unsafe for real customer data.

| Gap | Why now (brief) | Size | Depends on |
|---|---|---|---|
| 🔜 **Per-property editability.** Mark source-owned properties non-editable and keep edit-only properties for action facts. Actions that edit a source-owned property are refused. | §4 L3/L4 ("ERP-owned fields not editable"). Without it, an edit permanently hides later source corrections (R6 turned against us). | S | — |
| ⏳ **Outbox and idempotency keys.** Commit the edits and an outbox row in one transaction; deliver side effects with idempotency keys; an idempotency key per action request. | R3. Needed before any writeback, notification or index projection. A client retry can apply an action twice today. | M | — |
| ⏳ **Declarative submission criteria and parameter constraints.** A criteria tree with a failure message per node; one-of, range and regex constraints on parameters. | §4 L7. Agents need to read *why* an action is refused, and constraints become tool schemas (R14). | M | — |
| ⏳ **Value types.** Enum, range and regex wrappers, enforced on sync and on actions. | §4 L3. Same rules guard both write paths (R1, R7). | M | Editability |
| ⏳ **Action limits and a fuller log.** 10,000 objects per action, 1,000 per batch; the log records edited keys, action type version, actor kind and session. | §4 L7. Unbounded today; the log can't yet support audit or agent traces. | S | — |

### P1: make it usable by agents (L5, L10)

| Gap | Why (brief) | Size | Depends on |
|---|---|---|---|
| ⏳ **MCP tool surface.** One tool per action type, read tools over object sets, write tools off by default, refusals returned verbatim. | R14, brief "next" item 4. This is what the product is for (§1). | M | P0 criteria (tool schemas) |
| ⏳ **Query hardening.** Size limits with `QueryTooLarge`, default page size 1,000, mandatory `select` for agents, page tokens tied to the query, snapshot paging that handles deletes. | R10, R11, §4 L5. Agents will issue unbounded queries otherwise. | M | — |
| ⏳ **Missing object-set types and filters.** `reference`, `nearestNeighbors`, `withProperties`, `asType`; regex, wildcard, interval, relative date. | §4 L5 | M | — |
| ⏳ **Agents see only ACTIVE types; `agentDescription` field.** | §4 L3 | S | — |

### P2: governance of change (L3, L4, L7)

| Gap | Why (brief) | Size |
|---|---|---|
| ⏳ Schema migrations (drop, move, cast, backfill) so ACTIVE types can change safely | §4 L4; today breaking changes are only refused | M |
| ⏳ Definition history (a model version per change) | §4 L3 | M |
| ⏳ Proposals and approval: staged edits a human accepts, re-checked for staleness | §4 L7, R13 | M |
| ⏳ Revert, edit history, "most recent wins", "drop all edits" | §4 L4/L7 | M |
| ⏳ Derived properties, structs, modelling lint | §4 L3 | M |

### P3: new layers, after P0–P1

| Gap | Why (brief) | Size |
|---|---|---|
| ⏳ Ingestion beyond CSV: connectors with cursors, incremental APPEND, deletion column, data-quality expectations | L2, §4 L2 | L |
| ⏳ Metric layer (measure + filter + period + grain, safe joins) | L8, R15 | L |
| ⏳ Evidence/knowledge with provenance and validity times | L9, R16 | L |
| ⏳ Agent sessions and evals | L10, R17 | L |
| ⏳ Durable workflows and automations | L11 | L |

---

## 3. Deferred on purpose

| Item | Why deferred |
|---|---|
| ⏸ Security floor: fail-closed tenancy, cross-tenant test suite (L1, R12, R13) | Explicitly deferred by the owner. The pieces exist (RLS, roles on resources, markings), but anonymous requests pass unless `ENFORCE_PERMISSIONS=true`. **Must be done before any real customer data.** |
| ⏸ Moving to a modular monolith (brief §1) | The research recommends one, but the repo is microservices and works. The cost is a client per cross-service call; not worth a rewrite now. |
| ⏸ Ordering-column indexing (brief §5 corrections) | The research's own erratum withdrew it. Full-snapshot sync needs no ordering; decide the contract when incremental ingestion (P3) arrives. |
| ⏸ Multiple datasources per type, branch-scoped files | Foundry features with no current use case; noted in the code. |
| ⏸ Legal vs receivables domain choice | Nothing in L2–L7 depends on the domain (brief §1). |

---

## 4. Defects found along the way (not research gaps)

Real bugs in pre-existing code that the research did not cover. Each is small, and each sits under a layer we rely on.

| Defect | Where | Impact |
|---|---|---|
| Link store is in-memory even when `DATABASE_URL` is set | `services/svc-objects/src/server.ts` (`new LinkStore()`) | Links are lost on restart in Postgres mode, so the L3 link rules don't persist there |
| Postgres ontology store sets the key to `"id"` when a definition names it `primaryKey` (as the seeds do) | `services/svc-ontology/src/store/pg-ontology-store.ts` (`primaryKeyApiName ?? "id"`) | Seeded types get the wrong primary key in Postgres mode |
| `scripts/migrate-rls.sql` reads `app.current_org_rid`; everything else uses `app.org_rid` | `scripts/migrate-rls.sql` | RLS from that script never matches; GUIDE limitation #15 is half stale |
| Healthcare, logistics and manufacturing demo actions have no logic | `services/svc-actions/src/logic.ts` | Those demos now answer `ApplyActionFailed` (honest, but the demos need logic) |
| Demo seeds write objects directly; no pest-control type is dataset-backed | `scripts/demo/seed-pest-control.sh` | The demo never exercises the L2 sync path |

---

## 5. How to use this file

- Pick the next item from §2 in order. P0 before P1.
- Each item names its brief section; read only that spec section via the brief's index (§7 there).
- When an item lands, move it to §1 with its evidence and limits, and update the brief's §2 status column.
