# Threat model

**Layer:** [01-security](README.md) · **What it is:** Attack scenarios, trust boundaries and the negative-test matrix for tenant and matter isolation.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Open-source implementations](#open-source-implementations) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Open-source implementations

### Additional security design note

> Source: [open-source-references/README.md](../../open-source-references/README.md)

See [`../09-security-and-governance/tenant-isolation-threat-model.md`](threat-model.md) for a proposed tenant/matter threat model and negative-test matrix.

## Earlier engineering notes (Phase 2)

### Tenant and matter isolation threat model

> Source: former `09-security-and-governance/tenant-isolation-threat-model.md` (moved here in the Nov 2026 restructure)

**Status:** Proposed threat model for implementation and testing. This is not a claim that current code already satisfies these controls.

#### Security boundary model

Every request must carry separately validated:

- **Principal:** authenticated user or service identity.
- **Tenant:** organisation boundary derived from trusted identity/claims or trusted service mapping.
- **Workspace:** environment/project partition inside a tenant.
- **Resource scope:** specific Matter, document, contract, client or other governed object.
- **Purpose and action:** read, search, export, amend, approve, transmit or delete.

These fields are not interchangeable. A workspace name, document ID, tenant ID supplied in request JSON, group relationship or agent prompt is not proof of authorization.

#### Assets and trust boundaries

| Asset | Primary threat | Minimum control |
|---|---|---|
| Matter and client records | Cross-tenant or cross-matter reads | Server-derived tenant + resource-level policy check |
| Legal documents and versions | Search/vector leak, stale ACL after revocation | Permission-aware retrieval and access re-check before content release |
| Evidence, citations and extracted obligations | Hallucination or provenance loss | Source span/hash, document version, extraction model/version and human review status |
| Actions and approvals | Prompt injection, confused deputy, unauthorized state change | Typed action allowlist, policy check, preconditions, approval and idempotency |
| Search/vector indexes | Stale or incorrectly partitioned records | Tenant+matter filter at query and ingestion; rebuildable index; deletion propagation |
| Logs and traces | Sensitive client data in telemetry | Data minimization, redaction, restricted access and retention policy |
| Connectors and service accounts | Overbroad credential scope | Per-tenant credential isolation, least privilege, secret rotation and egress allowlist |
| Workflow state | Cross-tenant workflow-ID probing | Tenant-bound workflow lookup, non-guessable IDs and policy check on every signal/update |

#### Attack scenarios to test

1. User submits another tenant's `tenant_id` or `workspace_id` in JSON/header.
2. User guesses a Matter/document ID from another tenant and requests direct fetch, search or graph traversal.
3. A document moves between matters or its permissions are revoked, but a vector/cache result remains accessible.
4. A group/matter membership is revoked while a durable workflow is paused at human approval.
5. An agent is instructed by document content to export another matter, call a webhook or override approval.
6. A background worker runs without a user JWT and accidentally falls back to global/default tenant context.
7. A service token created for one connector or purpose is replayed against another service/action.
8. A log, trace, error response or tool output contains another client's confidential text.

#### Enforcement requirements

- Reject tenant-owned access when no trusted tenant context exists; do not collapse nil/empty into a shared tenant key.
- Derive tenant from validated principal mapping. Ignore or compare any tenant supplied in untrusted input; never use it as the source of truth.
- Enforce tenant filter inside repository/query adapters, not only in web route middleware.
- Enforce matter/resource-level policy at the point of data release and again at the point of action execution.
- Carry ACL metadata with documents and every derived chunk, embedding, citation, summary and extracted fact.
- Re-check permission when reading cached search results and before returning document content; on high-risk operations use a freshness policy that avoids stale positive authorization.
- Scope service tokens, connectors, workflow IDs, event topics and object IDs to tenant and purpose.
- Keep audit records for deny, allow, approval, export, mutation and side-effect outcomes without logging full sensitive content.
- Treat agent output and retrieved documents as untrusted data; they may supply facts but must not change trusted policy or action configuration.

#### Required negative-test matrix

| Test | Expected result | Assertion beyond HTTP status |
|---|---|---|
| Missing tenant claim on tenant endpoint | Deny | Repository was not called |
| Fake tenant header/body | Ignore or deny | Query still uses signed tenant only |
| Cross-tenant object ID | Deny/not-found policy | No properties, counts or relationship hints leak |
| Cross-matter document in search | Filter out | No snippet, title, embedding or citation leaks |
| ACL revoked while cache warm | Deny within documented revocation SLA | Cache does not return stale positive decision |
| Workflow approval after revocation | Deny | Pending workflow cannot bypass current policy |
| Prompt injection asks for export | Deny without typed grant | No connector call is made |
| Background task missing tenant | Fail closed | No global tenant access |
| Cross-tenant event replay | Reject | Consumer checks event tenant and resource scope |
| Delete matter | Controlled deletion/retention | Derived stores, chunks, exports, caches and logs follow policy |

#### Legal-specific data governance

Matter-level access is usually narrower than firm-wide tenancy. Avoid assuming everyone in a law firm may read every client matter. Support ethical walls, conflict restrictions, external counsel, client-specific workspaces, document-level confidentiality and privilege labels. A legal-domain ontology edge (e.g. `Lawyer assigned_to Matter`) is not sufficient access policy by itself.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
