# Phase 2 findings and next tests

**Research date:** 27 November 2026  
**Status:** source-level deepening completed for four high-value seams; implementation validation remains open.

## Executive synthesis

The strongest cross-cutting finding is that an enterprise ontology is not merely a graph database with a chat interface. The difficult engineering work sits at the boundaries: tenant and matter identity, schema versus runtime data lifecycle, query planning across provider capability, authorization freshness, atomic state changes, external side effects, and durable recovery.

### Findings that materially change the design discussion

1. **Atomicity needs an exact boundary.** OpenFoundry's inspected `ActionWriteTransaction` stages writes but applies object, link and audit-store operations sequentially. The success tests do not establish rollback on partial failure. Our design should treat a same-database transaction plus outbox as a strong default; cross-system effects require a saga and reconciliation.
2. **Do not hide external effects inside “writeback.”** OpenFoundry invokes a configured webhook before action planning/validation. Separate read-only preparation from committed external effects; execute irreversible work after commit or manage it as an explicit saga.
3. **Tenant is not workspace, and neither is a matter permission.** An absent organisation claim is a distinct state. Subject scope fallback can help throttling but does not establish a tenant. Legal software also needs matter-level access, ethical walls and document-level restrictions.
4. **An ontology platform has multiple schemas and runtimes.** UModel separates model definitions, runtime entities/relations, graph-store providers, query planning and agent tools. Preserve those boundaries rather than binding business schema directly to a chosen graph database.
5. **Query portability is capability-bound.** UModel's planner validates requested limits/depth/operators against provider capabilities. A provider abstraction is useful only when differences are explicit and contract-tested.
6. **Agent read access and write access should be separate capabilities.** UModel's write tools are disabled unless explicitly enabled and the corresponding adapters are wired. This is a useful default for legal workflows.
7. **Authorization cache freshness is part of the security model.** OpenFGA documents a latency mode that can use cache and a higher-consistency mode that bypasses it. Revocation-sensitive operations need an explicit freshness policy.
8. **Durable steps do not make arbitrary remote APIs exactly-once.** Temporal replay and DBOS checkpoints help recover orchestration. External calls still need receiver idempotency keys, a durable operation ledger and a reconciliation strategy.

## Provisional architecture direction — not a final decision

- Keep the canonical source of truth for governed business objects and transactional state in a store that can atomically update the object state and outbox record.
- Represent business objects and relationships with stable IDs, typed schemas, explicit versioning and provenance.
- Treat graph, search and vector systems as purpose-built projections unless the prototype proves one of them should own canonical state.
- Carry tenant, matter/resource, classification and ACL data through ingestion, chunks, embeddings, summaries, query results, workflow state and logs.
- Compile queries into typed plans with provider capabilities, cost budgets and explain output.
- Use an authorization service or policy engine separate from the business ontology; check at release and action time.
- Make agent tools read-only by default. Make write tools typed, narrow, policy-bound, approval-aware and auditable.
- Persist action intent and canonical state changes before dispatching external effects. Make dispatch idempotent and observable.
- Evaluate DBOS first for a Postgres-centric local proof while retaining Temporal for an operationally decoupled orchestration comparator.

These are hypotheses to test. They are not architecture approvals.

## Phase 2 audit coverage

| Area | Evidence collected | Still missing |
|---|---|---|
| OpenFoundry tenant | Claims extraction and missing-tenant behaviour; unit test sources | End-to-end route/data-adapter coverage and negative cross-tenant tests |
| OpenFoundry action writes | Staged object/link writes, audit append order, success tests | Failure injection, rollback proof and store-specific transaction scope |
| OpenFoundry webhooks | Writeback-before-plan order; side-effect logging | Receiver idempotency, external mutation semantics and crash reconciliation |
| UModel storage | Provider registry, default provider, Neo4j/Gremlin/Ladybug implementations, GraphStore contract | Run contract tests on all providers; distributed/concurrent writer semantics |
| UModel import | Path confinement and symlink escape test source | Full schema validation/atomic pack publication review |
| UModel query | Provider-capability limits/depth/operator validation | Cost model, index/search semantics, query explain quality |
| UModel agents | Write tools opt-in and adapters required | Full auth check at service boundary and idempotent write behaviour |
| OpenFGA | Recursive evaluation, cycle/diamond/cancel tests, cache consistency docs | Multi-instance revocation tests and latency benchmarks |
| Temporal / DBOS | Official docs and DBOS recovery test source | Same workflow bake-off, production backup/restore and ops test |

## Acceptance tests before architecture freeze

### Identity and access

- Missing or forged tenant context is rejected before data access.
- Cross-tenant and cross-matter reads are denied across APIs, query, graph traversal, search, vector retrieval, agent tools and workflow status.
- ACL revocation is effective within an explicitly declared and tested SLA, including warm caches and paused workflows.
- A legal ethical wall can override a broader firm/team relationship.

### Object model and query

- A schema version can be published without rewriting all runtime records.
- Invalid model packs fail atomically and leave the last valid version active.
- Object/relationship IDs remain stable across source sync and reindex.
- Queries enforce row, depth, timeout and cost budgets and produce a typed explain plan.
- Provider contract tests pass for every provider we claim to support.

### Action and workflow

- Object mutation and outbox append are atomic in the canonical store.
- A failed write cannot leave an untracked partial mutation.
- Duplicate actions and concurrent submissions converge to one logical transition.
- An external API timeout after acceptance does not duplicate the external effect.
- Human approval is checked at action time, not only when the workflow started.
- Crash/restart resumes the workflow and does not repeat completed side effects without deduplication.

### Legal evidence

- Every extracted claim/obligation links to the exact document version and source span.
- An agent cannot elevate an unverified extraction into an authoritative obligation.
- Search, summaries and embeddings obey the same matter/document access rules as the source.
- An approver can inspect source material and a full action/audit history before approval.

## Next work, in order

1. Complete the law-firm interview and capture one real, anonymised workflow with frequency, cost, risk and current tooling.
2. Pick one narrow workflow, preferably evidence-linked document Q&A or obligation/deadline extraction only if the interview confirms it is valuable.
3. Build a minimal vertical slice: ingest one document, preserve versions and source spans, extract typed candidates, retrieve with matter ACLs, and require human verification.
4. Add the object+outbox transaction and durable workflow around one approved action.
5. Run the acceptance suite above before expanding to more domains or more tools.

## Research integrity

All GitHub source inspection is pinned by commit in the individual audit files. Test files were inspected but not run. No quantitative benchmark, legal workflow validation, security test or deployment experiment was performed in this pass. Do not describe these findings as production-validated.
