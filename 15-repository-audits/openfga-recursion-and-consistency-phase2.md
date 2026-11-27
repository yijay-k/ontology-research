# OpenFGA: recursive authorization, cache consistency and design implications — Phase 2

**Snapshot:** `openfga/openfga` main at `d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251` (27 November 2026).  
**Evidence level:** source and test sources inspected; no code/tests executed. Official query consistency documentation checked.

Pinned code links:

- [recursive evaluator](https://github.com/openfga/openfga/blob/d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251/internal/check/recursive.go)
- [recursive evaluator tests](https://github.com/openfga/openfga/blob/d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251/internal/check/recursive_test.go)
- [cache controller](https://github.com/openfga/openfga/blob/d67ba7b1d2eaf945cffab3a9129ca1a4c7ad5251/internal/cachecontroller/cache_controller.go)
- [OpenFGA query consistency modes](https://openfga.dev/docs/interacting/consistency)

## Finding 1 — relationship checks are a bounded recursive graph evaluation, not a simple edge lookup

The recursive evaluator handles userset and tuple-to-userset (TTU) rewrites. It bootstraps left and right tuple streams, traverses in a breadth-first manner, uses visited state to avoid repeated resolution, applies a configured concurrency limit and propagates context cancellation. The code comments explain that a repeated node is not always a cycle: diamond-shaped membership can converge on a shared group without a cycle.

The inspected recursive tests include nested membership, false/true resolution, error paths, cancellation/leak checks and a complex model with union, intersection, exclusion and recursive tuple cycles. This is a useful warning against implementing authorization by a naive recursive SQL or graph traversal that can loop, fan out without bounds or misclassify shared paths.

**Design implication (proposed):** represent authorization as a separately versioned policy/relationship graph with a formally bounded evaluator. Test cycles, diamonds, recursive group membership, cancellation, fanout limits and model migration. The business ontology graph may supply resource relationships, but it should not implicitly become the authorization engine.

## Finding 2 — cache consistency is a security decision, not just a performance knob

The OpenFGA cache controller inspected in source performs asynchronous invalidation based on datastore changelog timestamps. On a cache miss, it may return a zero timestamp and permit use of the cache while invalidation runs; its own comment acknowledges that stale cache hits can occur until invalidation completes. It is an eventual-consistency optimization.

OpenFGA's official consistency documentation says `MINIMIZE_LATENCY` may use cache, while `HIGHER_CONSISTENCY` skips the cache and reads directly from the database. A tuple write followed immediately by a `Check` using the latency mode may not see the permission change if a cached result is served. Higher consistency trades latency for fresher policy state.

**Design implication (proposed):** decide consistency per operation. A dashboard may tolerate a short stale window; matter access, privilege revocation, external sharing, privileged export and irreversible write actions generally should not rely on a stale positive authorization cache. For critical operations, use a policy check with the stronger consistency mode or a version/fencing mechanism tied to the relevant authorization revision. Measure the latency cost rather than selecting the strongest mode everywhere.

## Fit with an enterprise ontology

OpenFGA solves **who can do what to which object under which relationship/policy model**. It does not itself define the rich business object schema, ingest source data, reconcile entities, provide evidence-linked document retrieval or orchestrate long-running business workflows. It can be used behind the ontology service as an authorization decision point, with a controlled mapping from ontology object IDs and relationships to policy tuples.

Do not equate “the graph contains a `Matter -> Client` edge” with “this user is allowed to read the Matter.” Business semantics and access-control semantics can be related, but must be independently governed.

## Highest-value follow-up tests

- Revoke a user or group membership, then attempt access immediately through every cache mode.
- Confirm high-risk action paths request stronger consistency and do not reuse a stale authorization decision.
- Test recursive union/intersection/exclusion, diamonds, cycles, deep nesting, cancellation and concurrency limits.
- Test policy model version changes, tuple migrations and cache invalidation across multiple instances.
- Confirm authorization failures do not leak resource existence or sensitive relationship topology.

## What remains unverified

This is not a full OpenFGA datastore or consistency implementation audit. The cache controller read here is an in-memory cache mechanism; its exact relationship to a production deployment depends on configuration. No performance measurements or revocation-latency experiments were run.
