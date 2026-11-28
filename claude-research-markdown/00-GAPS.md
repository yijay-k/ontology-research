# Gaps: what the openfoundry repo is doing now, and what is pending

**Snapshot 28 Nov 2026 (second pass)**, branch `feat/actions-edit-plans` at `91d45d9` plus uncommitted console work. Re-checked against the restructured research (H1–H7 recommendations, 21 executable proofs) and NVIDIA Auto Ontology. Every item below is justified against [00-BUILD-BRIEF.md](00-BUILD-BRIEF.md):
- **L**n is a layer in the brief's §2 table.
- **R**n is a rule in the brief's §3.
- **§4** is the per-layer to-do list.
- **H**n is a research decision in the brief's §2a; **G/T/I/M**n is a proof; **NV** is the NVIDIA review in §2b.

Status: ✅ done on the branch · 🟡 partly done · 🔜 next · ⏳ pending · ⏸ deferred on purpose.

---

## 0. Review: what we did right, what we did wrong

**Right.**
1. **Writes go only through actions that return an edit plan** (R1, R2). This is the part NVIDIA Auto Ontology does not have at all (NV): its ontology only reads. It is the product's differentiator.
2. **Optimistic concurrency with Foundry's `ObjectChanged` and bounded retries** (R4, R5). This matches Palantir's documented behaviour and the research's action-gate proof for objects an action writes.
3. **Source sync fails whole on a bad source, and user edits survive it** (R6, R7). This is the same "edits are kept across recompiles" principle NVIDIA uses for certified definitions.
4. **The permission model.** The research tells other builders to copy our RLS, resource-grant and marking migrations (`open-source-references/openfoundry.md`). The model is right; only the switch is off.
5. **Typed object sets as the read API, with no query strings** (R10, H4). This is the direction both the research and NVIDIA's deterministic query checks support.
6. **We built layers L2–L7 before agents and metrics**, the order the research prescribes.

**Wrong, or not yet right.**
1. **Postgres is optional, not authoritative** (H2). The demo runs on in-memory stores and JSON files, the two schema sources drift, links are in memory even in Postgres mode, and the Postgres store picks the wrong primary key. Every later layer inherits this. *Fix first.*
2. **No idempotency, no outbox, no pending record** (H5; G1, G2, G5). The research's proofs make these three **mandatory**. Today a client retry can apply an action twice.
3. **Invariant isolation is partial** (G6). Version checks cover written objects only. On Postgres, actions that guard a cross-object invariant need SERIALIZABLE with retry or a locked anchor row.
4. **The security floor is off while higher layers grow** (H6; T1–T6). The research puts tenancy first in the build order, and its T5 proof found a silent RLS bypass through views. Deferral was the owner's call; it must end before customer data.
5. **The service split works against H1 and H5.** An action's commit crosses HTTP from svc-actions to svc-objects, and audit lives elsewhere. Either keep edits, audit and outbox inside svc-objects' one transaction, or consolidate the write path into one process.
6. **The console "Ontology Mind" page runs ahead of the backend.** Its answers, metrics and cascade are scripted. The research warns that a chat-first experience "produces a demo, not the operational platform". Keep it labelled as a demo until the MCP and metric layers exist.
7. **Our local research copy uses the old flat layout,** so links to the research repo's `16-validation/...` and similar paths are dead. The brief's §7 now maps the new layout.

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

### P0: make the write path correct (L3, L4, L7; H2, H5)

These close holes in what is already built. Without them the write path is unsafe for real customer data. Order changed in this pass: the research's proofs moved idempotency and the store above editability.

| Gap | Why now | Size | Depends on |
|---|---|---|---|
| 🟡 **Postgres as the one authoritative store.** ✅ Links persist (`PgLinkStore`, migration 018, link rules tested on memory and both schema sources). ✅ Primary-key alias fixed. ✅ `security_invoker` view lint. ⏳ One schema source: blocked on the tenancy decision, because `db/migrations` forces RLS (009). ⏳ Make Postgres the demo default instead of in-memory/JSON files. | H2; defects in §4. Everything else is built on this. | M | Tenancy decision (§3) |
| 🟡 **Idempotency key, commit log and outbox.** ✅ `Idempotency-Key` header on apply/applyBatch; a repeat replays the first commit without re-evaluating. ✅ `action_commits` row, edits and `action.committed` outbox row in one svc-objects transaction (migration 019). ✅ Outbox read/ack routes. ⏳ A delivery worker and a recovery pass for external side effects (needed with the first writeback; DBOS per research). | H5, R3, R19; proofs G1, G2, G5 | M | — |
| ✅ **Invariant isolation.** Objects an action only read are sent as `reads`, share-locked and version-checked at commit; deadlock and serialization aborts surface as `ObjectChanged` and are retried. Write-skew test on memory and both schema sources. ⏳ Proof under real parallel connections (PGlite is single-session). | R20; proof G6 | S | — |
| ⏳ **Per-property editability.** Source-owned properties are not editable; edit-only properties hold action facts. Actions that edit a source-owned property are refused. | §4 L3/L4. Without it an edit permanently hides later source corrections. | S | — |
| ⏳ **Declarative submission criteria and parameter constraints.** A criteria tree with a failure message per node; one-of, range and regex constraints. | §4 L7. They become tool schemas for agents (R14). | M | — |
| ⏳ **Value types.** Enum, range and regex, enforced on sync and on actions. | §4 L3 | M | Editability |
| ⏳ **Action limits and a fuller log.** 10,000 objects per action, 1,000 per batch; the log records edited keys, action type version, actor kind and session. | §4 L7 | S | Outbox (same table work) |

### P1: make it usable by agents (L5, L10; NV)

| Gap | Why | Size | Depends on |
|---|---|---|---|
| ⏳ **Read-only MCP tools with an answerability check.** `check_readiness`, `search_types`, `get_type`, `check_answerable`, `query_objects`; budgets on calls and rows; a refusal when the budget is spent. Action tools follow, off by default, with refusals returned verbatim. | R14, R24; NVIDIA's MCP surface is a working reference. This is what the product is for. | M | Query hardening |
| ⏳ **Query hardening.** Size limits with `QueryTooLarge`, default page size 1,000, mandatory `select` for agents, page tokens tied to the query, snapshot paging. | R10, R11 | M | — |
| ⏳ **Ossie export and import.** Object types, links and metrics as Apache Ossie YAML, with `ai_context` for descriptions and synonyms. Imported types arrive as EXPERIMENTAL. | NV; research `open-source-references/apache-ossie.md`. Lets NVIDIA's drafting, dbt or Power BI models seed our ontology. | M | — |
| ⏳ **Dataset profiling for cold start.** Infer keys from distinct ratio, propose object types and data-confirmed links from uploaded datasets. | R25; NV `semantic_fk.py`; research cold start §4 and §9 | M | — |
| ⏳ **Missing object-set types and filters.** `reference`, `nearestNeighbors`, `withProperties`, `asType`; regex, wildcard, interval, relative date. | §4 L5 | M | — |
| ⏳ **Agents see only ACTIVE types; `agentDescription` field.** | §4 L3 | S | — |

### P2: governance of change (L3, L4, L7)

| Gap | Why | Size |
|---|---|---|
| ⏳ Schema migrations (drop, move, cast, backfill) so ACTIVE types can change safely | §4 L4; today breaking changes are only refused | M |
| ⏳ Definition history (a model version per change) | §4 L3 | M |
| ⏳ Proposals and approval: staged edits a human accepts, re-checked for staleness | §4 L7, R13 | M |
| ⏳ Revert, edit history, "most recent wins", "drop all edits" | §4 L4/L7 | M |
| ⏳ Derived properties, structs, modelling lint | §4 L3 | M |
| ⏳ Decide H1: consolidate svc-actions, svc-objects and svc-ontology's write path into one process, or document the single-transaction rule as permanent | H1, H5 | M |

### P3: new layers, after P0–P1

| Gap | Why | Size |
|---|---|---|
| ⏳ Ingestion beyond CSV: connectors with cursors (`>=` plus boundary hashes), incremental APPEND, deletion column, data-quality expectations | L2, R22; proofs I1–I3 | L |
| ⏳ Metric layer: measure + filter + period + grain, compiled with the join matrix and 2-hop cap; checked text-to-SQL only for exploration | L8, R15, R23, R24; proofs M1–M5; NV | L |
| ⏳ Evidence/knowledge with provenance and validity times | L9, R16, H3 | L |
| ⏳ Agent sessions, evals (≥3 runs per case, end-state scoring) and versioned agent releases | L10, R17, H7 | L |
| ⏳ Durable workflows and automations (DBOS recommended; proof D1) | L11 | L |
| ⏳ One finance workflow end to end (receivables: sync → query → action → approval → writeback → reconcile → eval). This is the research's decision gate for freezing H1–H7. | Research decision gate | L |

---

## 3. Deferred on purpose

| Item | Why deferred |
|---|---|
| ⏸ Security floor: fail-closed tenancy, forced RLS with a non-owner app role, `security_invoker` lint on views, cross-tenant test suite (L1, R12, R13, R21; H6; proofs T1–T6) | Explicitly deferred by the owner. The research now ranks it first in build order, and its T5 proof found a silent RLS bypass through owner-created views. The pieces exist, but anonymous requests pass unless `ENFORCE_PERMISSIONS=true`. **Must be done before any real customer data; re-raise at every merge.** |
| ⏸ Moving to a modular monolith (brief §1, H1) | The research now recommends adopting it. Not worth a rewrite yet, provided the P0 outbox work keeps every commit inside svc-objects' one transaction. Revisit at the P2 H1 decision. |
| ⏸ Ordering-column indexing (brief §5 corrections) | The research's own erratum withdrew it. Full-snapshot sync needs no ordering; decide the contract when incremental ingestion (P3) arrives. |
| ⏸ Multiple datasources per type, branch-scoped files | Foundry features with no current use case; noted in the code. |
| ⏸ Legal vs receivables domain choice | Nothing in L2–L7 depends on the domain (brief §1). |

---

## 4. Defects found along the way (not research gaps)

Real bugs in pre-existing code that the research did not cover. Each is small, and each sits under a layer we rely on.

| Defect | Where | Impact |
|---|---|---|
| ✅ Fixed: link store was in-memory even when `DATABASE_URL` is set | now `PgLinkStore` (`services/svc-objects/src/store/pg-link-store.ts`) | Links survive a restart in Postgres mode |
| ✅ Fixed: Postgres ontology store set the key to `"id"` when a definition names it `primaryKey` | `normalize` in `services/svc-ontology/src/routes/v2/object-types.ts`; test `pg-primary-key.test.ts` | Seeded types keep their key |
| `scripts/migrate-rls.sql` reads `app.current_org_rid`; everything else uses `app.org_rid` | `scripts/migrate-rls.sql` | RLS from that script never matches; GUIDE limitation #15 is half stale |
| Healthcare, logistics and manufacturing demo actions have no logic | `services/svc-actions/src/logic.ts` | Those demos now answer `ApplyActionFailed` (honest, but the demos need logic) |
| Demo seeds write objects directly; no pest-control type is dataset-backed | `scripts/demo/seed-pest-control.sh` | The demo never exercises the L2 sync path |

---

## 5. How to use this file

- Pick the next item from §2 in order. P0 before P1.
- Each item names its brief section; read only that spec section via the brief's index (§7 there).
- When an item lands, move it to §1 with its evidence and limits, and update the brief's §2 status column.
