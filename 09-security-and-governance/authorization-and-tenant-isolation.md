# Authorization and tenant isolation

## Security model

Use multiple layers with explicit responsibilities:

- Authentication: identity provider and session/token validation.
- Tenant context: derived from trusted identity/organisation membership; never accept a caller-controlled tenant header without gateway overwrite/verification.
- ReBAC: resource relationships such as matter team, client role, assigned operator and delegated agent (OpenFGA-style model).
- ABAC/policy: sensitivity, jurisdiction, matter status, purpose, time and action risk (OPA/Cedar-style policy evaluation).
- Data-plane enforcement: Postgres RLS, repository tenant predicates, graph/vector filters and storage namespace controls.
- Object/field/action security: resource permission, property masking and action-specific checks.
- Agent controls: tool allow-list, principal delegation, purpose limitation, approval and audit.

## End-to-end invariant

A user or agent must not see a record in any channel if it cannot access that record in the authoritative source or its granted projection. Enforce the invariant in object queries, list counts, graph traversals, vector candidates, rerank context, caches, export/download, logs, notifications and workflow resume.

## Fail-closed requirements

- Missing tenant/identity must reject privileged operations.
- Missing policy service must not silently allow protected writes.
- Every cache key includes tenant and relevant policy/identity scope or is re-authorized on read.
- Search/vector index documents carry source ACL metadata and policy revision; stale permissions trigger invalidation/recheck.
- Background jobs carry a service identity and original actor/delegation context.
- External writeback credentials are tenant-scoped and least privilege.
- Audit logs are append-only and protected from data-plane mutation.

OpenFGA can answer relationship questions; OPA/Cedar can evaluate policy. Neither creates end-to-end enforcement automatically. OpenFoundry's Cedar gate nil behaviour and reliance on gateway-populated tenant headers are examples of the wiring that must be audited, not copied.

## Required tests

Cross-tenant object lookup, count, graph edge, vector hit, cache hit, autocomplete, action, file export, background workflow, webhook and error trace. Also test policy-engine outage, missing tenant header, stale ACL, changed group membership and deleted user. Security tests must assert absence of information, not just 403 on one endpoint.