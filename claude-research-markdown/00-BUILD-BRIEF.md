# Build brief: the only research page you need

**Updated 28 Nov 2026 (second pass).** This page condenses the 32 research documents in this folder (about 17,500 lines) and [yijay-k/ontology-research](https://github.com/yijay-k/ontology-research) into what matters for building the product. Read this first. Open a source document only through the index at the bottom, and only for the section it names. Line numbers (`L123`) point into this folder's files.

**What changed in this pass.**
- The research repo was restructured (`restructure-engineering`, merged to `main` as #2): 72 engineering component files under `engineering/`, 36 open-source reference files, executable proofs (21/21 passed on Postgres 16), and recommended decisions for H1–H7. See §2a.
- NVIDIA's [Auto Ontology](https://github.com/NVIDIA/auto-ontology) (Apache-2.0, released Nov 2026, #1 on BIRD-Interact and BEAVER) was reviewed against our build. See §2b.
- The local files in this folder are the old flat layout. They still exist and the line numbers below still point into them; the new layout is mapped in §7.

---

## 1. What we are building

A **company model that AI agents work through**:
- typed business objects and links, synced from the company's systems;
- exact queries over them;
- named, validated actions as the only way to change them, each one logged;
- permissions applied on every read.

It is "Palantir's Ontology, sized for a 100–1,000 person company". It is **not** "RAG + a graph database + agents". The first target domain is receivables and collections. A legal-market pivot is open, and nothing built so far depends on the domain.

**Stack:** TypeScript (Node 22), PostgreSQL 16 (row-level security, JSONB, pgvector), and models rented through APIs. The research now **recommends adopting** a modular monolith (H1, awaiting owner sign-off); the openfoundry repo is 13 services. That is workable only if every write's edits, audit row and outbox row commit inside one service's one transaction (§2a, H5).

---

## 2. Build order and where we stand

The research's own rule is to build each layer on the one before it.

| # | Layer | Status in the openfoundry repo | Blueprint |
|---|---|---|---|
| 1 | Tenancy, identity, security floor | ⚠️ RLS, roles on resources and markings exist; not fail-closed (deliberately deferred) | [30 §1 L21](30-map-palantir-platform.md), [30 §5 L224](30-map-palantir-platform.md) |
| 2 | Source data → objects (sync) | ✅ Dataset CSV → objects on every change; ⚠️ no incremental/CDC, no ordering or deletion column, no DAG builds | [30 §2 L62](30-map-palantir-platform.md) |
| 3 | Ontology registry | ✅ Lifecycle statuses, datasources, link rules, interfaces; ⚠️ no definition history, value types, derived properties, per-property editability | [30 §3 L144](30-map-palantir-platform.md) |
| 4 | Edits layer | ✅ "Edits win" merge, sticky deletes, user-created objects; ⚠️ no "most recent wins", edit history, migrations | [30 §4 L190](30-map-palantir-platform.md) |
| 5 | Object-set queries | ⚠️ 8 of 15 set types, missing filters, no size limits or cost metering | [30 §6 L288](30-map-palantir-platform.md) |
| 6 | Functions | ⚠️ Only as action logic; no standalone query functions | [30 §7 L326](30-map-palantir-platform.md) |
| 7 | Actions | ✅ Validate, atomic commit, version conflicts, retries; ⚠️ no declarative criteria, proposals/approval, outbox, revert, limits | [30 §8 L358](30-map-palantir-platform.md) |
| 8 | Metrics | ❌ Not started | [33 §11 L392](33-map-context-code-integration.md) |
| 9 | Evidence/knowledge | ❌ Not started | [33 §7 L251](33-map-context-code-integration.md), [33 §8 L287](33-map-context-code-integration.md) |
| 10 | Agents: MCP, sessions, evals | ❌ Not started | [30 §15–18 L714–L862](30-map-palantir-platform.md) |
| 11 | Durable workflows, automations | ❌ Not started | [30 §11 L535](30-map-palantir-platform.md), [14 §25 L364](14-open-source-code-study.md) |
| 12 | Change control, packaging | ❌ Not started | [30 §20–21 L906–](30-map-palantir-platform.md) |

For the detailed done / pending / deferred list with reasons, see [00-GAPS.md](00-GAPS.md).

**Next, in order** (revised for §2a and §2b):
1. Idempotency key per action call, plus edits, audit and outbox committed in one Postgres transaction (H5; proofs G1, G2, G5).
2. Postgres as the one authoritative store: links persisted, one schema source, the primary-key bug fixed (H2).
3. Per-property editability: which fields actions may change (§4 below).
4. Read-only MCP tools with an answerability check, then action tools that are off by default (R14, §2b).
5. Ossie export and import of the ontology, so an NVIDIA-drafted or dbt semantic model can seed our object types (§2b).
6. Security floor turned on before any real customer data (H6; proofs T1–T6). It is first in the research's build order and still deferred here.

---

## 2a. Research decisions H1–H7 and where we stand

The research recommends all seven for adoption, pending owner sign-off. Its decision gate (one legal and one finance workflow running end to end) is **not met** by the research or by us. Source: `engineering/00-overview/hypotheses-and-decisions.md` in the research repo.

| # | Recommendation | Our build | Verdict |
|---|---|---|---|
| H1 | Modular monolith: one TypeScript service, module-owned tables | 13 services; an action's commit crosses HTTP from svc-actions to svc-objects | ⚠️ Diverges. Acceptable only while each commit stays inside svc-objects' transaction |
| H2 | Postgres for definitions, objects, edits, actions, audit, outbox, workflow state, vectors | Demo default is in-memory/JSON files; Postgres optional; two drifting schema sources; links in memory even in Postgres mode | ❌ Wrong default. Fix before anything is built on top |
| H3 | Extracted knowledge kept apart from authoritative objects; only actions change objects | Actions are the only governed write path; no extraction yet | ✅ On track |
| H4 | Typed query compiler; MetricFlow join matrix and 2-hop cap; text-to-SQL only as a checked fallback | Object sets are a typed JSON tree; no metrics | ✅ Direction right; metrics not started |
| H5 | Local commit + outbox; **idempotency key, persisted pending record and recovery pass are mandatory**; SERIALIZABLE or a locked anchor row for invariants | Version checks + 5 attempts; no idempotency key, no outbox, no pending record | ⚠️ Half done. A client retry can apply an action twice |
| H6 | Forced RLS per tenant with a non-owner app role; `security_invoker` on every view; markings as SQL predicates; Cedar for action yes/no | RLS migrations, roles on resources, markings exist; enforcement off by default; markings checked in app code | ⚠️ Pieces right (the research tells others to copy our migrations); floor not on |
| H7 | Agent configuration versioned and released through review, evals and canary | Not started | — |

Proof results that change the build (`research-log/proof-results.md`):
- **G6:** snapshot isolation let two concurrent actions break a cross-object invariant; SERIALIZABLE stopped it. Our version check only covers objects an action writes.
- **T5:** a view owned by a privileged role silently bypasses RLS unless created `WITH (security_invoker = true)`. Add a migration lint.
- **I1–I3:** both naive watermark strategies lose or duplicate boundary rows; dlt's `>=` plus boundary hashes is exact. Use it when sync becomes incremental.
- **M1–M5:** summing across a one-to-many join inflated revenue 420 vs 220; MetricFlow's join matrix refuses that path. It is a correctness gate for the metric layer.

## 2b. NVIDIA Auto Ontology: what it shows

**What it is.** A Python library and app (Apache-2.0) that drafts a semantic layer from database metadata and lets experts certify it. It produces terms with synonyms, column attributes, reviewed SQL "attributes" (metrics), and foreign keys confirmed against the data. A ReAct agent answers questions as text-to-SQL over it. It also serves a read-only MCP server and imports and exports Apache Ossie YAML. It runs on Postgres + pgvector and ranks #1 on the BIRD-Interact and BEAVER text-to-SQL benchmarks.

**What it is not.** It has no object instances, no edits layer, no actions, no write governance and no row-level permissions on business data. Its ontology is a map for *reading* warehouses. Ours is the model agents *act* through. The two are complementary, not competing.

**Where it confirms our direction.**
- Postgres + pgvector as the single store (H2).
- The agent's read path is grounded in typed definitions, and every answer returns its query and steps (provenance, H4).
- MCP is read-only by default (R14).
- Drafts are certified by people. Edits survive recompilation, because a recompile only touches tables with no term yet (research's "human confirms every link").
- The backend trusts a user-id header forwarded by the gateway on a private network, which is the same trusted-hop pattern as our `x-user-*` headers. The same rule applies: service ports must never be public.

**What to take** (Apache-2.0, so code can be ported with attribution):
1. **`check_answerable`.** Score how much of a question the ontology covers before answering, and refuse or ask instead of guessing. It is the research's "typed refusal" and "sufficiency gate" in a shippable form.
2. **Deterministic guards around a model.** Every query's names are checked against the catalog and against what retrieval showed; failures go back to the model. There are tool budgets (24 calls, 10 SQL runs), result caps (100 rows, 8,000 characters), and a refusal when the budget is spent. This is the "checked fallback" H4 asks for.
3. **Data-confirmed link inference.** A key is unique when at least 95% of sampled values are distinct. An inferred foreign key is kept only if value overlap and an actual join confirm it, and only one default join is chosen per group of alternatives. This applies directly to our dataset-backed object types.
4. **Term families.** Copies of one schema told apart by a prefix (`OLD_`/`NEW_`) are grouped so later steps don't confuse them.
5. **Ossie interchange.** An Ossie export/import lets NVIDIA's drafting, or a dbt or Power BI model, seed our object types as EXPERIMENTAL drafts.

**Where it disagrees with the research, and how to reconcile it.** The research says to build a metric compiler first and treat text-to-SQL as a fallback (H4). NVIDIA wins benchmarks with grounded text-to-SQL. Both hold. Benchmarks measure read accuracy on messy warehouses, while our actions need exact, governed numbers. So: metrics through the compiler, exploration through NVIDIA-style checked text-to-SQL (or object-set generation), and never a write from either.

**What not to copy.** Its ingestion service has no authentication. Its compile step depends on query history, which the research notes a 100–1,000 person SaaS-only company doesn't have (cold-start §9). The answering agent asks no clarifying questions; only the MCP path does.

---

## 3. Rules that hold everywhere

These are the load-bearing decisions. Each is backed by a primary source unless marked *(our choice)*.

1. **Writes go only through named actions.** No generic update tool for agents, and no raw SQL. [02 L10](02-palantir-ontology.md), [14 L11](14-open-source-code-study.md)
2. **An action reads, then returns its edits as data. It never writes directly.** The edits are validated, then committed all or nothing. [14 §1 L31](14-open-source-code-study.md)
3. **External side effects sit outside the transaction.** Commit the edits plus an outbox row together, then deliver with idempotency keys and reconcile. Never call it "atomic". [02 L11–12](02-palantir-ontology.md), [30 §8.11 L418](30-map-palantir-platform.md)
4. **Detect conflicts by object version.** Snapshot-style isolation does not stop write skew, so put cross-object invariants on a shared anchor object. [02 L127](02-palantir-ontology.md)
5. **Retry only actions with no external calls,** up to 5 attempts. [02 L127](02-palantir-ontology.md)
6. **A user edit wins over source data by default.** Deletes stick. A source row that disappears takes its object with it, and the edits come back if the row does. [02 §12 L184](02-palantir-ontology.md)
7. **Primary keys are permanent and deterministic.** A duplicate key fails the whole sync rather than merging. [02 L48](02-palantir-ontology.md)
8. **Declared cardinality is not enforced by Palantir.** Enforce the invariants you need in the database. [02 L81](02-palantir-ontology.md)
9. **Definition lifecycle:** EXPERIMENTAL by default; ACTIVE takes no breaking changes and cannot be deleted; DEPRECATED comes before deletion. [02 L52](02-palantir-ontology.md)
10. **Object sets are the read API.** They compose as a JSON tree, are paginated, default to exact aggregations, and take no query strings. [02 §6 L99](02-palantir-ontology.md)
11. **Live paging can repeat or skip rows.** Use snapshot paging for exports and decisions. [02 L109](02-palantir-ontology.md)
12. **Permissions are checked at read time:** markings first, then role, then row/column policy. Policies don't follow data into exports or model context. [04 §8–9 L133](04-palantir-security.md)
13. **Each agent is its own principal.** Its effective scope is user ∩ app ∩ requested scope, and no scope means no access. [02 L18](02-palantir-ontology.md), [33 §4 L134](33-map-context-code-integration.md)
14. **Agent tools are generated from the model:** one tool per action, read tools separate, write tools off by default. [14 L52](14-open-source-code-study.md), [30 §15 L714](30-map-palantir-platform.md)
15. **A metric is measure + filter + period + grain.** It is not a named SQL string. *(Phase 2 research: Dataphin)* [33 §11 L392](33-map-context-code-integration.md)
16. **Extracted knowledge is not business state.** LLM-derived facts keep provenance and validity times, and are reviewed before they change objects. [33 §7–8 L251](33-map-context-code-integration.md)
17. **Agent evals measure end state and policy compliance,** not answer quality. Run each case ≥3 times. [03 §13 L274](03-palantir-aip.md), [14 §29 L393](14-open-source-code-study.md)
18. **Prefer Postgres for everything first.** Graph, vector and search stores are rebuildable projections. *(research H2, now recommended)*
19. **Every action call carries an idempotency key.** A repeat returns the first outcome. A side effect is recorded as pending before it is sent, and a recovery pass completes it. *(H5; proofs G1, G2, G5)*
20. **Invariants across objects need SERIALIZABLE with retry, or a locked anchor row.** A version check on the written objects is not enough. *(proof G6)*
21. **Every database view is `security_invoker = true`,** enforced by a migration lint. *(proof T5)*
22. **Incremental cursors use `>=` plus boundary-row hashes.** Plain `>` loses rows and plain `>=` duplicates them. *(proofs I1–I3, dlt)*
23. **A metric join must pass the join matrix:** no aggregation across a one-to-many fan-out, at most 2 hops. *(proofs M1–M5, MetricFlow)*
24. **Model-written queries pass deterministic checks before they run:** names exist in the catalog, tables were surfaced by retrieval, there is a tool and row budget, and the answer is a refusal when the budget runs out. Out-of-scope questions are refused after an answerability check. *(NVIDIA Auto Ontology; research map 32 items 5–7)*
25. **Drafted definitions are proposals.** An inferred link is kept only when the data confirms it, and stays EXPERIMENTAL until a person certifies it. *(research cold start §4; NVIDIA semantic FK)*

---

## 4. What to build next, per layer

Only the items still open. Each points at the full spec.

**Registry (layer 3).** [30 §3 L148–168](30-map-palantir-platform.md)
- Per-property editability. ERP-owned fields such as amount and due date are not editable; collection facts are edit-only. [30 L202](30-map-palantir-platform.md)
- Value types: enum, range, regex, enforced on sync and on actions. [02 L71](02-palantir-ontology.md)
- Definition history: each change stored as a model version. [30 L149](30-map-palantir-platform.md)
- Agents see only ACTIVE types by default. Add an `agentDescription` field. [30 L150–152](30-map-palantir-platform.md)
- Derived properties (≤3 link hops, aggregate) and structs. [02 L63–68](02-palantir-ontology.md)
- Modelling lint: warn at more than 10 actions per type, or mostly-null properties. [02 L247](02-palantir-ontology.md)

**Edits (layer 4).** [30 §4 L194–205](30-map-palantir-platform.md)
- Opt-in "most recent wins" strategy, "drop all edits", per-object edit history.
- Schema migrations (drop, move, cast, backfill), so breaking changes become possible instead of refused.

**Queries (layer 5).** [30 §6 L292–310](30-map-palantir-platform.md)
- Missing set types: `reference`, `nearestNeighbors`, `withProperties`, `asType`. Missing filters: regex, wildcard, interval, relative date.
- Limits with a typed `QueryTooLarge` error. Default page size 1,000. `select` mandatory for agents. Usage metering per operation class.

**Actions (layer 7).** [30 §8 L364–443](30-map-palantir-platform.md)
- Declarative submission-criteria tree with a failure message per node, and parameter constraints (one-of, range, regex).
- Outbox and idempotency keys for side effects.
- Proposals and approval tiers: staged edits a human accepts, re-checked for staleness when accepted.
- Revert, and limits: 10,000 objects per action, 1,000 per batch.
- A fuller action log: edited keys, action type version, actor kind, agent session.

**Data (layer 2).** [30 §2 L66–118](30-map-palantir-platform.md)
- Source records and connectors with cursors; incremental APPEND mode; a declared deletion column; data-quality expectations. Connector choices: [33 §5 L159](33-map-context-code-integration.md).

**Cold start (layer 3, new).** Research: `engineering/03-ontology-engine/ontology-drafting-and-cold-start.md`.
- Profile each uploaded dataset: key candidates by distinct ratio (≥95%), low-cardinality value lists, date formats. Propose an EXPERIMENTAL object type with its `propertyMapping`.
- Propose links between datasets only when value overlap and a real join confirm them. Port NVIDIA's `semantic_fk.py` logic.
- Ossie YAML export and import of object types, links and metrics (`ai_context` for descriptions and synonyms).

**Agents (layer 10).**
- MCP read tools first, modelled on NVIDIA's: `check_readiness`, `search_types`, `get_type`, `check_answerable`, `query_objects`. Then one tool per action type, off by default.
- MCP server design: [33 §16 L520](33-map-context-code-integration.md), [30 §18 L826](30-map-palantir-platform.md).
- Sessions: [30 §16 L754](30-map-palantir-platform.md).
- Evals: [30 §17 L795](30-map-palantir-platform.md).
- Model access layer: [30 §12–13 L582–676](30-map-palantir-platform.md).

---

## 5. Corrections: claims in the research you must not use

From the verification report [36](36-verification-report.md) and the Phase 2 correction register.

| Claim in the research | Correct reading |
|---|---|
| "Honour the ordering column at index time; Palantir indexes by arrival order" ([30 L78](30-map-palantir-platform.md)) | Legacy OSv1 behaviour only. OSv2 drops "latest timestamp wins" and its indexing pipeline handles changelogs. Our ordering contract is our own decision. |
| OSv1 as a reference | Unavailable after 30 Jun 2026. Copy OSv2 behaviour only. |
| "Up to 5 retries" | Up to 5 **attempts** (at most 4 retries). |
| "Every Ontology change needs a human-approved proposal" ([03](03-palantir-aip.md)) | Not supported by the source. Branches and proposals exist; approval is policy. |
| Palantir "Small" capacity tier | Only Medium, Large and XL exist. |
| "A rejection must give a reason code" (Ramp, [22](22-ramp-and-finance-platforms.md)) | The reason is optional. |
| Airbyte unusable in SaaS ([14](14-open-source-code-study.md)) vs usable ([24](24-integration-companies.md)) | Depends on the connector and the use. Check each connector's licence. |
| "Submission criteria always empty" in the openfoundry repo ([14 L95](14-open-source-code-study.md)) | Out of date: actions now refuse with real failure messages. |
| RLS setting `app.org_id` ([14](14-open-source-code-study.md)) | It is `app.org_rid`. |
| Microsoft/Google/Amazon/ServiceNow/Workday sections ([20](20-big-platform-agents.md)); figures in [27](27-more-companies-to-learn-from.md) | Written from prior knowledge or headlines. Don't build on them. |

---

## 6. Where the built parts live (openfoundry repo)

| Feature | Code | Notes |
|---|---|---|
| Action apply/validate (Foundry v1 + v2 shapes) | `services/svc-actions/src/apply.ts`, `routes/v1`, `routes/v2` | Action types are read from svc-ontology |
| Action logic (pest-control demo) | `services/svc-actions/src/logic.ts` | Read-only; returns edits or a refusal |
| Atomic commit, versions, edit layer | `services/svc-objects/src/store/object-store.ts`, `pg-object-store.ts`, `routes/edits.ts` | `/internal/...` routes; gateway does not proxy them |
| Dataset → object sync and merge | `services/svc-objects/src/sync/`, `store/source-sync.ts`, `routes/sync.ts` | Triggered by svc-datasets' `onResponse` hook |
| Datasource declaration | `packages/ontology-schema/src/object-type.ts`, `services/svc-ontology/src/routes/v2/object-types.ts` | Foundry `ObjectTypeDatasource` shape |
| Lifecycle status rules | `services/svc-ontology/src/routes/v2/object-type-evolution.ts` | |
| Link rules | `services/svc-objects/src/routes/v2/links.ts`, `store/link-store.ts` | |
| `interfaceBase` object sets | `services/svc-objects/src/routes/v2/object-sets.ts` | |
| Migrations | `db/migrations/017_object_datasources_and_edits.sql`, `scripts/migrate.sql` | Keep both schema sources in step |
| Project rules for agents | `AGENTS.md` | Sections: Actions, Ontology definition and link rules, Dataset-backed object types |

---

## 7. Index of source documents

**Read (build specs).** Open only the section you need.

| File | Use it for | Key sections |
|---|---|---|
| [30-map-palantir-platform.md](30-map-palantir-platform.md) | **The build blueprint**, 21 decisions in build order | §1 tenancy L21 · §2 data L62 · §3 registry L144 · §4 edits L190 · §5 read checks L224 · §6 queries L288 · §7 functions L326 · §8 actions L358 · §9 rules L472 · §10 scenarios L508 · §11 automations L535 · §12–13 model access L582 · §14 token scope L677 · §15 tools L714 · §16 sessions L754 · §17 evals L795 · §18 MCP L826 · §19 audit L863 · §20 change control L906 · §21 packaging L954 |
| [02-palantir-ontology.md](02-palantir-ontology.md) | Exact Palantir Ontology behaviour and limits | Key findings L7 · object types L40 · properties L55 · links L75 · interfaces L87 · object sets L99 · actions L115 · edits merge L184 · schema evolution L198 · MCP L226 · **What to copy L251** |
| [33-map-context-code-integration.md](33-map-context-code-integration.md) | Semantic model, metrics, knowledge, connectors, MCP and agent loop | semantic schema L13 · permissions L101 · agent identity L134 · connectors L159 · durable jobs L230 · temporal facts L251 · metrics and safe joins L392 · action gate L443 · MCP L520 · bill of materials L567 · function checklist L620 |
| [14-open-source-code-study.md](14-open-source-code-study.md) | Code to copy patterns from, and licences | operational-ontology L31 · Palantir SDKs L55 · open-Foundry clones L81 · MetricFlow L108 · Graphiti L169 · Cedar/OPA/OpenFGA L273–298 · Postgres RLS L299 · MCP L326 · durable execution L364 · connectors L371 · evals L393 · **bill of materials L488** · files worth reading L540 |
| [01-palantir-data-layer.md](01-palantir-data-layer.md) | Data layer mechanics, when layer 2 grows | datasets/transactions L149 · CDC L211 · builds L383 · data health L422 · feeding the Ontology L543 · What to copy L569 |
| [04-palantir-security.md](04-palantir-security.md) | Security floor, when it is built | markings L77 · granular policies L133 · object/property policies L161 · action permissions L185 · audit L237 · LLM calls and agents L326 · **minimum faithful version L413** |
| [03-palantir-aip.md](03-palantir-aip.md) | Agents layer, later | model access L41 · rate limits L63 · Logic L120 · Agent Stack L202 · MCP L254 · Evals L274 · Automate L292 · human-in-the-loop L414 |
| [36-verification-report.md](36-verification-report.md) | Which claims were checked or corrected | Corrections to apply, at the end |

**Skim only if the question comes up.**
- [09](09-papers-knowledge-layer.md) / [10](10-papers-agents-memory-eval.md): research papers on knowledge layers, agents, memory and evals.
- [11](11-context-layer-products.md): context-layer products.
- [05](05-palantir-apps-infra.md): Palantir apps and infrastructure (Workshop, Rules, Apollo).
- [08](08-alibaba-stack.md): Alibaba code (mycontext merge rules, KAG).

**Skip for building.** These are market, pricing and company research.
- 06 Palantir business
- 07, 25, 31 Lingyang/AgentOne and offer catalogues
- 12, 18, 19, 20, 34 agent companies (Sierra, Decagon, big platforms)
- 13, 32 cost and economics
- 21 Glean
- 22, 23, 28 finance, receivables competitors, Winnexo
- 24, 26, 27, 35 integration companies, process giants, more companies, market map

**External code and docs worth opening**
- Palantir API models (exact wire shapes): `github.com/palantir/foundry-platform-python` → `foundry_sdk/v2/ontologies/models.py`, `errors.py`, `action.py`
- Palantir ontology-as-code IR: `github.com/palantir/osdk-ts` → `packages/maker/src/api/`, `packages/api/src/objectSet/ObjectSet.ts`
- Action gate reference (MIT): `github.com/gura105/operational-ontology` → `src/core.ts`, `docs/IMPLEMENTATION.md`
- Palantir docs most used: [action consistency](https://www.palantir.com/docs/foundry/action-types/consistency-guarantees/) · [how edits are applied](https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/) · [object backend / OSv2](https://www.palantir.com/docs/foundry/object-backend/overview) · [metadata statuses](https://www.palantir.com/docs/foundry/object-link-types/metadata-statuses/) · [schema migrations](https://www.palantir.com/docs/foundry/object-edits/schema-migrations/) · [OSS limits](https://www.palantir.com/docs/foundry/ontologies/oss-limitations/)
- Research repo, new layout (`main` after #2), on `github.com/yijay-k/ontology-research`:
  - `engineering/00-overview/hypotheses-and-decisions.md`: H1–H7 and the recommended stack.
  - `engineering/00-overview/build-sequence.md` and `bill-of-materials.md`.
  - `engineering/05-actions-and-rules/action-gate-and-transactions.md`: idempotency, pending record, recovery.
  - `engineering/01-security/tenancy-and-isolation.md`: forced RLS and `security_invoker`.
  - `engineering/04-query-and-metrics/metrics-and-semantic-layer.md`: join matrix.
  - `engineering/03-ontology-engine/ontology-drafting-and-cold-start.md`: drafting and its limits.
  - `research-log/proof-results.md` (21 proofs) and `research-log/backlog-and-next-tests.md` (acceptance tests per layer).
  - `proofs/src/action-gate.ts`: runnable reference for rules 19–20.
  - `open-source-references/openfoundry.md`: the research's verdict on this repo ("copy the RLS, resource-grant and marking migrations; ignore the services").
  - The old flat files in this folder now live under `general-references/` with the same numbers.
- NVIDIA Auto Ontology: `github.com/NVIDIA/auto-ontology` → `docs/architecture.md` (every compile and answer step, model vs deterministic), `auto_ontology/semantic/semantic_fk.py` (data-confirmed links), `auto_ontology/semantic/term_families.py`, `mcp/` (read-only tool set).
