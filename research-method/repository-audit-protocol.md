# Repository audit protocol

## 1. Identity and provenance

Record canonical repository URL, owner, branch, current commit SHA where obtained, release tag/date, licence, language, package manager, support policy, archived/fork status and lineage. A similarly named repository is not assumed to be the same project. Record whether the target is an upstream, port, fork, emulator, tutorial or example implementation.

## 2. Repository map

Inventory runtime services, libraries, packages, apps, generated code, migrations, schemas, test suites, deployment manifests and CI. Do not read generated/vendor/build output line-by-line. Inspect the generator or code that produces it and sample generated contracts when needed.

## 3. Runtime trace

A README or architecture document is only a claim inventory and navigation aid. It is never sufficient evidence that a feature is implemented. For each material capability, trace:

`product claim → official docs → repository entrypoint/route/consumer → owning module → domain model/IR → validation → authorization → persistence/transaction → event/outbox/projection → tests`.

If the documented feature cannot be located in active code, record it as documented-only, planned, incomplete or not found. If the feature is only present in a disconnected module, check startup/DI/route/event registration before calling it active. If a code path is only seen in one handler, do not generalize it to every route.

## 4. Runtime trace

For each capability, trace the real path from public API or event consumer to domain operation and persistence. Identify the caller, validation, authorization, transaction, side effects, event emission, retry and response. Follow dependency injection and startup wiring; a feature module that is never registered is not an active runtime feature.

## 5. Data and persistence

Record identifiers, tenant or workspace keys, ownership, versions, history, unique constraints, indexes, migrations, storage adapters, cache invalidation and materialized/search/vector projections. Distinguish authoritative state from derived indexes and caches.

## 6. Security

Trace identity at ingress through service context, repository scope, storage constraints, search/vector filters, caches, agent tools and external calls. Inspect fail-open defaults and missing-context behaviour. A `tenant_id` column or workspace field is not, by itself, proof of isolation.

## 7. Reliability

Inspect transaction boundaries across databases and services, outbox/inbox pattern, event IDs, idempotency keys, retries, DLQ behaviour, replay, reconciliation, partial success, cancellation and compensation. Identify effects that occur outside the transaction guarantee.

## 8. Tests and validation

List relevant unit/integration/e2e tests, fixtures, CI jobs and local build commands. Distinguish test source inspection from actual test execution. Record exact commands and outcomes only when run. Record environmental blockers without converting them into assumptions.

## 9. Output format

Each audit should include: scope; exact commit/branch snapshot; claim-to-code matrix; architecture map; core execution traces; data/schema path; API/events; security path; test coverage; licence; strengths; limitations; risks; adoption classification (reuse/adapt/learn/avoid); open questions; confidence and coverage ledger.
