# openfga/openfga

| | |
|---|---|
| **Repository** | <https://github.com/openfga/openfga> |
| **Why it matters** | Zanzibar-style relationship-based authorization with a Postgres tuple store. |
| **What to take** | The tuple-table design for relationship-based sharing; validate untrusted models with NewAndValidate(); treat cache consistency as a security decision. |
| **What not to copy** | Running OpenFGA before relationship graphs get deep — role and group grants in Postgres are likely enough at 100–1,000 staff. |
| **Feeds** | [01-security/authorization-model](../engineering/01-security/authorization-model.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** **copy the tuple-table design** if you need relationship-based sharing ("viewer of this account because member of team T, which owns region R"). Run OpenFGA itself only if relationship graphs become deep; at 100–1,000 staff, group and role grants in Postgres are likely enough. [Inference]

## From the open-source code study: 19. OpenFGA

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- Apache-2.0, Go (about 185k lines), last commit 2026-11-20. It uses CEL (`cel.dev/cel-go` v0.33.2) for conditional tuples. [Fact]
- The Postgres schema (`assets/migrations/postgres/001_initialize_schema.sql`) has `tuple(store, object_type, object_id, relation, _user, user_type, ulid, inserted_at)` with primary key `(store, object_type, object_id, relation, _user)` and partial indexes for user versus userset. It also has `authorization_model(store, id, type, type_definition BYTEA)`, `changelog` for the watch API, and `assertion`. Migration 005 adds `condition_name` and `condition_context` to tuples. [Fact] ([migrations](https://github.com/openfga/openfga/tree/HEAD/assets/migrations/postgres))
- Verdict: **copy the tuple-table design** if you need relationship-based sharing ("viewer of this account because member of team T, which owns region R"). Run OpenFGA itself only if relationship graphs become deep; at 100–1,000 staff, group and role grants in Postgres are likely enough. [Inference]

## Repository audit: Repository audit — openfga/openfga

> Source: former `15-repository-audits/openfga.md` (Phase 2 source inspection, not executed).

**Role:** relationship-based authorization model and evaluation reference.  
**Repository:** [openfga/openfga](https://github.com/openfga/openfga), branch `main`.  
**Validation:** type-system source and module/test inventory inspected; full check evaluator trace and test execution remain open.

### What was inspected

- `pkg/typesystem/typesystem.go` and its tests.
- `internal/check/check.go`, `bottom_up.go`, `recursive.go`, request/response and corresponding tests were inventoried.

### Type-system validation path

`TypeSystem.New()` constructs internal relation/type graphs. The source warns that an invalid/untrusted model can cause graph construction to panic and recommends `NewAndValidate()` for untrusted model input. `NewAndValidate()` constructs a type-system shell, validates schema-version support and the model's constraints before graph construction. Methods such as `IsPubliclyAssignable()` and `PubliclyAssignableReferences()` reason over relation references and directly related user types.

The check subsystem contains dedicated bottom-up and recursive evaluators, request/response types, strategies and tests. A complete implementation audit should follow request parsing → model lookup → type-system resolution → tuple datastore lookup → recursive userset expansion → contextual tuple conditions → response/consistency metadata → cache and metrics.

### Architecture use

OpenFGA is a good reference for relationship-based authorization (ReBAC): a resource's access is derived from modelled relations and tuples, not only static user roles. That can express relationships such as “user is a member of this matter's legal team” or “this agent is delegated by a responsible lawyer”.

### Boundary and warning

An authorization decision service does not automatically enforce policy on Postgres rows, vector search, a graph store, a cache, a background workflow or an external SaaS API. Every consumer must call the policy engine or compile equivalent constraints into its data access path. A separate tenancy boundary may still require database isolation/RLS. Do not use OpenFGA as a substitute for transactional action preconditions or tenant partitioning.

### Follow-up audit

Trace full check request and recursive evaluation; inspect datastore adapters, caching, consistency tokens, model/version selection, tuple conditions and batch APIs. Execute the full check/type-system test suites before adopting.

## Repository audit: OpenFGA: recursive authorization, cache consistency and design implications — Phase 2

> Source: former `15-repository-audits/openfga-recursion-and-consistency-phase2.md` (Phase 2 source inspection, not executed).

**Snapshot:** `openfga/openfga` main at `d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251` (27 November 2026).  
**Evidence level:** source and test sources inspected; no code/tests executed. Official query consistency documentation checked.

Pinned code links:

- [recursive evaluator](https://github.com/openfga/openfga/blob/d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251/internal/check/recursive.go)
- [recursive evaluator tests](https://github.com/openfga/openfga/blob/d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251/internal/check/recursive_test.go)
- [cache controller](https://github.com/openfga/openfga/blob/d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251/internal/cachecontroller/cache_controller.go)
- [OpenFGA query consistency modes](https://openfga.dev/docs/interacting/consistency)

### Finding 1 — relationship checks are a bounded recursive graph evaluation, not a simple edge lookup

The recursive evaluator handles userset and tuple-to-userset (TTU) rewrites. It bootstraps left and right tuple streams, traverses in a breadth-first manner, uses visited state to avoid repeated resolution, applies a configured concurrency limit and propagates context cancellation. The code comments explain that a repeated node is not always a cycle: diamond-shaped membership can converge on a shared group without a cycle.

The inspected recursive tests include nested membership, false/true resolution, error paths, cancellation/leak checks and a complex model with union, intersection, exclusion and recursive tuple cycles. This is a useful warning against implementing authorization by a naive recursive SQL or graph traversal that can loop, fan out without bounds or misclassify shared paths.

**Design implication (proposed):** represent authorization as a separately versioned policy/relationship graph with a formally bounded evaluator. Test cycles, diamonds, recursive group membership, cancellation, fanout limits and model migration. The business ontology graph may supply resource relationships, but it should not implicitly become the authorization engine.

### Finding 2 — cache consistency is a security decision, not just a performance knob

The OpenFGA cache controller inspected in source performs asynchronous invalidation based on datastore changelog timestamps. On a cache miss, it may return a zero timestamp and permit use of the cache while invalidation runs; its own comment acknowledges that stale cache hits can occur until invalidation completes. It is an eventual-consistency optimization.

OpenFGA's official consistency documentation says `MINIMIZE_LATENCY` may use cache, while `HIGHER_CONSISTENCY` skips the cache and reads directly from the database. A tuple write followed immediately by a `Check` using the latency mode may not see the permission change if a cached result is served. Higher consistency trades latency for fresher policy state.

**Design implication (proposed):** decide consistency per operation. A dashboard may tolerate a short stale window; matter access, privilege revocation, external sharing, privileged export and irreversible write actions generally should not rely on a stale positive authorization cache. For critical operations, use a policy check with the stronger consistency mode or a version/fencing mechanism tied to the relevant authorization revision. Measure the latency cost rather than selecting the strongest mode everywhere.

### Fit with an enterprise ontology

OpenFGA solves **who can do what to which object under which relationship/policy model**. It does not itself define the rich business object schema, ingest source data, reconcile entities, provide evidence-linked document retrieval or orchestrate long-running business workflows. It can be used behind the ontology service as an authorization decision point, with a controlled mapping from ontology object IDs and relationships to policy tuples.

Do not equate “the graph contains a `Matter -> Client` edge” with “this user is allowed to read the Matter.” Business semantics and access-control semantics can be related, but must be independently governed.

### Highest-value follow-up tests

- Revoke a user or group membership, then attempt access immediately through every cache mode.
- Confirm high-risk action paths request stronger consistency and do not reuse a stale authorization decision.
- Test recursive union/intersection/exclusion, diamonds, cycles, deep nesting, cancellation and concurrency limits.
- Test policy model version changes, tuple migrations and cache invalidation across multiple instances.
- Confirm authorization failures do not leak resource existence or sensitive relationship topology.

### What remains unverified

This is not a full OpenFGA datastore or consistency implementation audit. The cache controller read here is an in-memory cache mechanism; its exact relationship to a production deployment depends on configuration. No performance measurements or revocation-latency experiments were run.
