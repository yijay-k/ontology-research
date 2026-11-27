# Repository audit — openfga/openfga

**Role:** relationship-based authorization model and evaluation reference.  
**Repository:** [openfga/openfga](https://github.com/openfga/openfga), branch `main`.  
**Validation:** type-system source and module/test inventory inspected; full check evaluator trace and test execution remain open.

## What was inspected

- `pkg/typesystem/typesystem.go` and its tests.
- `internal/check/check.go`, `bottom_up.go`, `recursive.go`, request/response and corresponding tests were inventoried.

## Type-system validation path

`TypeSystem.New()` constructs internal relation/type graphs. The source warns that an invalid/untrusted model can cause graph construction to panic and recommends `NewAndValidate()` for untrusted model input. `NewAndValidate()` constructs a type-system shell, validates schema-version support and the model's constraints before graph construction. Methods such as `IsPubliclyAssignable()` and `PubliclyAssignableReferences()` reason over relation references and directly related user types.

The check subsystem contains dedicated bottom-up and recursive evaluators, request/response types, strategies and tests. A complete implementation audit should follow request parsing → model lookup → type-system resolution → tuple datastore lookup → recursive userset expansion → contextual tuple conditions → response/consistency metadata → cache and metrics.

## Architecture use

OpenFGA is a good reference for relationship-based authorization (ReBAC): a resource's access is derived from modelled relations and tuples, not only static user roles. That can express relationships such as “user is a member of this matter's legal team” or “this agent is delegated by a responsible lawyer”.

## Boundary and warning

An authorization decision service does not automatically enforce policy on Postgres rows, vector search, a graph store, a cache, a background workflow or an external SaaS API. Every consumer must call the policy engine or compile equivalent constraints into its data access path. A separate tenancy boundary may still require database isolation/RLS. Do not use OpenFGA as a substitute for transactional action preconditions or tenant partitioning.

## Follow-up audit

Trace full check request and recursive evaluation; inspect datastore adapters, caching, consistency tokens, model/version selection, tuple conditions and batch APIs. Execute the full check/type-system test suites before adopting.
