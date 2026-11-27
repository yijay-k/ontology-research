# Repository audit — CapTrix/openfoundry

**Role in research:** closest public multi-service attempt at a Foundry-like ontology platform; important to study for system boundaries and failure modes.  
**Snapshot:** `main`; source paths inspected on 27 November 2026.  
**Licence:** AGPL-3.0 at repository root. This is a material constraint for commercial reuse; obtain legal review before copying/deriving code.  
**Validation:** source inspected remotely; no clone/build/tests run.

## Repository identity and lineage

Do not treat every repository named OpenFoundry as one codebase. The archive separately lists the Rust workspace, CapTrix's Go port, the Shamdon Go port, the pa4s fork, the Przyval TypeScript emulator and small operational-ontology tutorial. This audit applies only to `CapTrix/openfoundry`.

The CapTrix README describes 50 services and 36 top-level libs; the current tree count observed in the prior audit was 51 service directories and 37 library directories. State the counting convention and branch snapshot whenever reporting that number. An earlier ADR describes ontology parity as 6/10 and lists gaps, but the live branch has since gained additional ontology-definition handlers; that older estimate must not be repeated as a current score.

## Architecture map observed

- `ontology-definition-service`: schema/type metadata, definitions, property/link/interface/group/shared-property resources, versioning and batch-save.
- `object-database-service`: runtime object and link storage, currently backed by Cassandra/Scylla adapters in production; local/in-memory paths exist for dev/test.
- `ontology-indexer`: Kafka-consumer pipeline projecting object/link/type events into search indexes.
- `ontology-query-service`: query/read surfaces for narrower object access.
- `ontology-actions-service` plus `libs/ontology-kernel`: action validation/execution and writeback helpers.
- `libs/outbox`: PostgreSQL transactional outbox primitives.
- `libs/authz-cedar-go`: Cedar policy evaluation and audit emission.
- Other services address tenancy, identity, ingestion, search, agents, pipeline, lineage, retrieval and audit.

The service count is not evidence of integrated feature completeness. The key audit step is confirming whether each module is registered, whether the expected identity context is propagated, and whether the same event/policy contract is used by every route.

## Trace A — ontology definition batch mutation

**Code:** [`batch_save.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/repo/batch_save.go), [`events.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/repo/events.go), [`properties_links.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-definition-service/internal/handlers/properties_links.go).

`Repo.SaveBatch()` begins one PostgreSQL transaction, creates an audit writer bound to that same transaction, then dispatches each edit by resource/operation. Domain validation and version conflicts are returned as per-edit statuses. If any edit fails, earlier successful entries are downgraded to `skipped` and the function returns without commit; deferred rollback discards all writes. If every edit succeeds, it commits once. Supported resource cases in the inspected code include object types, link types, object-type groups, properties and shared property types.

`EnqueueSchemaEvent()` accepts the caller's `pgx.Tx`; comments require it to be the same transaction as the primary mutation. It creates before/after snapshots and a deterministic event ID derived from aggregate, aggregate ID, event type, version and payload, then inserts through the outbox helper. This is a strong local atomicity pattern: schema edit + audit + outbox intent can commit or roll back together when wired through the same transaction.

**What is implemented:** batch mutation transaction structure and same-transaction event enqueue are visible in code.  
**What is not established:** every one-shot CRUD handler necessarily uses the same semantics, every projection consumes the event, and full historical schema evolution/branch semantics are complete.

## Trace B — object data write and outbox across stores

**Code:** [`writeback.go`](https://github.com/CapTrix/openfoundry/blob/main/libs/ontology-kernel/domain/writeback.go), [`outbox.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/handlers/outbox.go).

The kernel writeback helper writes the primary object store first (Cassandra adapter with optimistic version handling), then opens a PostgreSQL transaction to enqueue an event. It derives a deterministic UUIDv5 event ID from tenant/aggregate/object/version. If opening or committing the PG transaction fails after the primary write has succeeded, the helper returns a typed `WritebackError` containing event ID and committed version so the caller can retry deterministically. A repeated call that sees the expected target version can be treated as an idempotent retry before re-enqueueing the same event ID.

This is **not a single atomic transaction across Cassandra and PostgreSQL**. The helper explicitly models a partially committed state: object data may exist while the outbox row is absent. Deterministic retry metadata is the recovery approach, and callers need to honour it. A robust implementation should have explicit pending/reconciliation visibility rather than rely only on application callers to notice the error.

## Trace C — action ordering and external side effects

**Code:** [`execute.go`](https://github.com/CapTrix/openfoundry/blob/main/libs/ontology-kernel/handlers/actions/execute.go).

The inspected action handler runs configured webhook writeback before calling `planAction()`. If the later action plan rejects the proposed mutation, the webhook may already have produced an external side effect. This is a code-ordering observation, not a proof every configured webhook is destructive. The correct lesson is to define precisely whether a pre-plan webhook is a read/parameter-enrichment hook or a mutating write; do not allow external mutation before local authorization, preconditions and an approved action plan.

**Proposed safe sequence:** authenticate → authorize → parse/validate input → load current state → construct pure edit plan → evaluate invariants/preconditions → preview/dry run → obtain required approval → commit local object changes + audit + outbox atomically → asynchronously execute external effects with idempotency/reconciliation.

## Trace D — indexer retries and dead-letter handling

**Code:** [`runtime.go`](https://github.com/CapTrix/openfoundry/blob/main/services/ontology-indexer/internal/runtime/runtime.go).

The inspected Kafka loop fetches a message, processes it with configured retries and exponential backoff, optionally sends a failed message to the DLQ, and commits the original offset after successful processing or after successful DLQ publication. Default retry values in the helper are 100 ms initial backoff and 2 s cap when not configured; attempts are clamped to at least one. Unknown topics are logged and skipped as decode-error outcome. This is a useful recovery model, but the audit still needs to trace malformed payload handling, consumer offset/configuration, projection idempotency, replay and storage/index divergence.

## Trace E — security boundary and wiring risk

**Code:** [`cedar_gate.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/handlers/cedar_gate.go), [`handlers.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/handlers/handlers.go), [`server.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/internal/server/server.go), [`main.go`](https://github.com/CapTrix/openfoundry/blob/main/services/object-database-service/cmd/object-database-service/main.go).

The object DB HTTP service is described as internal-only and relies on an upstream gateway to establish tenant context (including `x-of-tenant`). In the inspected constructors, `runCedarGate` treats a nil Cedar engine as allow, and schema validation can be absent when the schema resolver is nil. The service main wiring examined did not make the complete Cedar/schema wiring obvious. This is a **potential fail-open configuration risk**, not a demonstrated exploitable vulnerability: verify the deployed ingress, gateway header sanitisation, environment wiring, network policy and all handler construction paths before drawing a security conclusion.

The important engineering requirement is end-to-end enforcement. Internal-only is a valid architecture boundary only if it is actually enforced at network and identity boundaries, and headers such as tenant ID are overwritten from trusted identity rather than accepted from arbitrary callers.

## Current ontology surface

The current `properties_links.go` handlers explicitly add property and link-type operations; the definition service's current handlers also expose other resource families and batch-save/audit functionality. This corrects an older PoC-era ADR/documentation claim that properties/link types were deferred. It does not prove the full Foundry type system, object-set algebra, derived properties or all runtime enforcement are complete.

## Strengths

- Clear decomposition into schema metadata, object store, query, action, indexing and auxiliary services.
- Same-transaction audit/outbox for metadata batch edits.
- Deterministic event IDs and surfaced retry metadata for cross-store writeback.
- Explicit action and indexing pipeline modules.
- Cedar policy engine as a reusable authorization component.

## Gaps and risks to investigate

1. Confirm every object mutation path publishes object/link events; compare high-level ontology routes with low-level routes. The inspected bridge CRUD methods did not consistently expose event enqueue calls in the excerpt, so trace route registration and helper indirection before concluding.
2. Determine if search indexes are strictly disposable projections and how rebuild/replay handles deleted links and schema version changes.
3. Verify tenant and marking enforcement on every read, list, search, query, cache and action path.
4. Verify Cedar is mandatory in production wiring and cannot silently default to allow.
5. Remove or isolate any side-effecting webhook that runs before action validation/authorization.
6. Add explicit reconciliation state for primary-store success with missing outbox/event.
7. Assess feature parity and test coverage at pinned commit, not from service count or old ADR score.

## Adoption recommendation

**Learn from:** service boundaries, PG schema batch transaction, transactional outbox helper, deterministic idempotency IDs, projection indexer, Cedar integration.  
**Adapt cautiously:** object database storage architecture and service split.  
**Avoid copying directly:** AGPL-3.0 implementation into a closed-source product without legal review; pre-plan mutating webhook order; fail-open defaults; reliance on cross-store retry without operator-visible reconciliation.
