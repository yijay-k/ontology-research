# Tenancy and isolation

**Layer:** [01-security](README.md) · **What it is:** How one customer's data, objects and agents are kept separate from another's, and which invariants must hold end to end.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Open-source implementations](#open-source-implementations) (3) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (3)

## Palantir

### 2. Organizations and spaces (mandatory silo)

> Source: [general-references/04-palantir-security.md § 2. Organizations and spaces (mandatory silo)](../../general-references/04-palantir-security.md#2-organizations-and-spaces-mandatory-silo)

**Plain English.** An Organization is a hard wall between companies or business units on the same platform. Each user belongs to exactly one, plus optional guest memberships elsewhere. A Project tagged "Acme" is invisible to anyone not in Acme.

**Technical detail.**
- To see a Project, a user must be a member or guest of at least one Organization applied to it, so Organizations combine with OR. [Fact] https://www.palantir.com/docs/foundry/security/orgs-and-spaces/ . Contrast: Markings combine with AND. In write authorization, Organizations need "at least one". [Fact] https://palantir.com/docs/foundry/action-types/read-write-authorizations/
- Organizations protect spaces, Ontologies, Projects, users, groups, tag categories and collections. Individual files cannot be tied to an Organization, unlike Markings. [Fact] https://www.palantir.com/docs/foundry/security/orgs-and-spaces/
- A **space** is the top-level container, with one Ontology per space, restricted by Organizations. A Project in a multi-Organization space can use any subset of them. Organization discoverability (whether you can see other Organizations' names, users and groups) is admin-controlled. [Fact] same URL.
- Organizations propagate through the file hierarchy and through data dependencies. Removing them downstream uses `stop_requiring` and needs approval from holders of "Expand access" on each listed Organization. Stopping one Organization removes all inherited ones. [Fact] https://palantir.com/docs/foundry/building-pipelines/remove-inherited-markings/
- "Expand access" is defined as any change that widens who could reach a resource. That includes removing any Marking, adding an Organization when one already exists, and removing the only Organization. [Fact] https://www.palantir.com/docs/foundry/security/security-glossary/

### B4. Enrollment and tenancy

> Source: [general-references/05-palantir-apps-infra.md § B4. Enrollment and tenancy](../../general-references/05-palantir-apps-infra.md#b4-enrollment-and-tenancy)

- **Enrollment:** one platform instance containing one or more organizations. Most settings are per organization; some, such as Resource Management, are enrollment-wide ([Fact](https://palantir.com/docs/foundry/administration/enrollments-and-organizations/)).
- **Organization:** a mandatory access control applied to spaces, ontologies, projects, users and groups. A user has exactly one home organization and may hold guest memberships. Admins control whether other organizations are discoverable ([Fact](https://www.palantir.com/docs/foundry/security/orgs-and-spaces)).
- **Space:** a container of projects with **one ontology**, restricted by one or more organizations. Projects carry a subset of the space's organizations. Markings and roles refine access inside projects.
- **B2B and B2C patterns** ([Fact](https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/)):
  - A: a private organization, space and ontology per customer;
  - B: shared spaces plus restricted views;
  - C: a hybrid of the two;
  - B2C: one organization with discoverability off, and restricted views on a user-ID column auto-filled by an Action.
- **Marking propagation:**
  - resources with no upstream dependencies get OR organization markings;
  - derived data gets AND;
  - marks are removed only explicitly (`stop_propagating`, `stop_requiring`, or restricted views).
- **Authentication options:** an IdP per customer (SAML), passthrough federation with an organization attribute, an internal IdP, or a mix.
- **Consumer mode** (external users; 28 Aug 2025) has three patterns: in-platform apps, OAuth apps on Foundry subdomains, and client-credentials apps for externally hosted services ([Fact](https://palantir.com/docs/foundry/announcements/2025-08/)).

## Open-source implementations

### 20. Postgres row-level security for multi-tenant apps (pattern as found in code)

> Source: [open-source-references/postgres-rls.md](../../open-source-references/postgres-rls.md) (code study)

Plain-English explanation: every row carries a tenant id. The database itself refuses to return another tenant's rows, even if application code forgets a `WHERE` clause.

- The pattern in Przyval/openfoundry, which is the only full example in this repository set:
  - An `org_rid TEXT NOT NULL` column on every table, with an index on it.
  - RLS enabled *and forced* on each table.
  - `CREATE POLICY tenant_isolation ... USING (org_rid = current_setting('app.org_rid', true)) WITH CHECK (same)`.
  - A separate application login role, so that the migration owner (which bypasses RLS) is not the role the app connects as.
  - Each request runs inside a transaction that starts with `SET LOCAL app.org_rid = $1`.

  [Fact] ([009_multi_tenancy.sql](https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/009_multi_tenancy.sql), [pg-store.ts](https://github.com/Przyval/openfoundry/blob/HEAD/packages/db/src/pg-store.ts))
- Variants elsewhere: LightRAG uses a `workspace` column in every primary key, Graphiti uses `group_id`, OpenFGA uses `store`, and Cognee offers one database or schema per dataset. These are application-level partitions without RLS. [Fact]
- [Inference] The `true` second argument of `current_setting` makes an unset variable return NULL, so the policy matches no rows. That means it fails closed, which is the behaviour you want. `SET LOCAL` only lasts until the end of the transaction, so a pooled connection does not leak a tenant to the next request. Both points come from my knowledge of Postgres semantics; I did not re-check the Postgres docs in this session. [Unverified against docs this session]

### Finding 1 — tenant extraction has an explicit missing-tenant state

> Source: [open-source-references/openfoundry.md](../../open-source-references/openfoundry.md) (repository audit)

`TenantFromContext` reads the authenticated claims and returns `(uuid.Nil, false)` if claims are absent or `OrgID` is missing. Its comment explicitly warns that a service which gates tenant rows must call this before repository access; allowing `uuid.Nil` to enter a tenant-scoped query can collapse distinct tenants into one bucket.

`TenantContextFromClaims` derives the tenant from the validated claim `OrgID`. It also builds a `ScopeID` fallback from the subject if `OrgID` is missing, while `TenantID` remains nil. That subject-level scope is useful for stable throttling keys, but it is not proof of a valid organisation/tenant partition. The anonymous context uses the literal scope `global`, which must not be mistaken for authorization to read tenant-owned records.

The inspected tests cover present/missing/unauthenticated org context, tier selection, quota selection and subject-scope fallback. These are useful unit cases, but they do not by themselves prove that every route, data adapter, background job, cache or agent tool rejects a missing or forged tenant.

**Design implication (proposed):** represent authenticated principal, tenant, workspace and resource scope as separate typed fields. For tenant-owned business data, fail closed when the tenant is absent. Never infer tenant identity from a body field or caller-controlled header. A single-user/no-tenant mode, if required, must be an explicitly modelled tenancy mode with separate policy—not a nil/global default.

### 6. Permission is a cross-cutting query invariant

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#6-permission-is-a-cross-cutting-query-invariant)

Glean mirrors permissions at connector/index level; Palantir documents object and ontology resource permissions; OpenFGA models tuple-based access; OpenFoundry has Cedar gates, with fail-open wiring risk to investigate. Permission columns or metadata are not enough.

**Design implication:** identity → tenant context → policy decision/filter → repository/query/index/vector/cache/tool/workflow. Test the same principal across every access route and deny on missing/unknown scope.

## Design decisions already in the reference maps

### 1. Tenancy and identity

> Source: [general-references/30-map-palantir-platform.md § 1. Tenancy and identity](../../general-references/30-map-palantir-platform.md#1-tenancy-and-identity)

**Purpose.** Each customer company is a walled tenant. Staff sign in through their own identity provider, and their groups and attributes drive every later check. *Receivables example:* at a customer called Acme, collectors in group `AR-Collectors-MY`, with attribute `region=MY`, sign in through Acme's Entra ID and can only ever reach Acme's data.

**Design to implement.**
- **Three levels, collapsed.** Palantir has enrollment (one platform instance), organization (a mandatory silo; each user has one home organization plus optional guest memberships) and space (a container of projects with exactly one ontology) [Fact 05, 04]. Palantir's B2B "option A" gives each customer a private organization, space and ontology [Fact 05]. **Implement option A only:** one `tenant` = one organization = one space = one company model [Inference, following 05's "What to copy" 11].
- **Tables** [Inference on shape; fields copied as cited]:
  - `tenant(id, slug, name, status, data_region, created_at)`.
  - `identity_provider(id, tenant_id, protocol saml|oidc, issuer, email_domain_regex, cert_expires_at, claim_map jsonb, group_claim, group_split_regex)`. The login page picks a provider by email-domain regex, and an unmatched domain gives a "no suitable authentication provider" error [Fact 04]. Warn admins when a SAML certificate expires within 30 days [Fact 04].
  - `principal(id uuid, tenant_id, kind human|service|agent, external_subject, username, email, display_name, attributes jsonb, status active|inactive, last_login_at)`. `external_subject` is the stable IdP ID (SAML NameID or OIDC `sub`). Palantir says it must be non-empty, consistently cased and stable for the account's lifetime, and advises against using email or username [Fact 04].
  - `group(id, tenant_id, kind external|internal|rule, name)` and `group_member(group_id, principal_id, added_at, latest_expiration, max_duration)`.
  - `project(id, tenant_id, name, default_role)` and `role_grant(project_id, group_id, role)`.
- **Login flow.** Map username, email and names explicitly. Map extra attributes in "First" or "All" mode. On each login, sync every value of the group claim into external groups, optionally splitting values with a regex [Fact 04]. External groups are read-only and should be nested inside internal groups instead of granting to users directly [Fact 04]. If the IdP cannot send groups at login, use SCIM [Fact 04]. **If no tenant matches, block the login** (Palantir: a user with "No organization" cannot log in) [Fact 04].
- **Roles.** Four default roles: Owner, Editor, Viewer, Discoverer. Grants live at project level only, and folder or file grants are off [Fact 04]. Roles are bundles of named operations, not a strict hierarchy [Fact 04]. Discoverer can see that something exists but cannot download [Fact 04]. New projects default to Viewer [Fact 04]. An access request carries a reason, the target principals and the access type, and a Project Owner approves it [Fact 04].
- **Inactivity.** After 30 days with no successful login an account becomes inactive and all its tokens stop working until the next login. Schedules it owns keep running [Fact 04]. Because of that last point, automations must be owned by service principals (section 11) [Inference].
- **Service principals.** A client-credentials registration creates a service user whose username equals the client ID and which has no access by default [Fact 04].
- **MFA** is delegated to the IdP. Palantir ranks hardware tokens highest and calls SMS, email OTP and security questions weak [Fact 04].
- **Postgres enforcement** [Inference]: every tenant-scoped table carries `tenant_id`. Each request sets `app.tenant_id` and `app.principal_id` with `SET LOCAL`, and an RLS policy on every table enforces `tenant_id = current_setting('app.tenant_id')::uuid`. The tenant wall is therefore structural, as option A intends.
- **Failure behaviour.** No tenant match: login denied. Inactive principal: every token rejected with a typed error. Group claim missing: keep the last-known memberships and flag the account for admin review [Inference].

**Copies.**
- Document 05, B4 "Enrollment and tenancy": enrollment, organization and space levels, and B2B option A. https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/ , https://www.palantir.com/docs/foundry/security/orgs-and-spaces
- Document 04, §1 "Authentication and identity": SAML/OIDC mapping, stable user ID, group sync, regex split, SCIM, certificate warning. https://www.palantir.com/docs/foundry/authentication/saml-getting-started
- Document 04, §1: organization assignment at login, with no organization meaning no login. https://www.palantir.com/docs/foundry/authentication/org-assignment
- Document 04, §3 "Projects, roles and discretionary permissions": four roles, project-level grants, Discoverer, default role, access requests. https://www.palantir.com/docs/foundry/security/projects-and-roles/
- Document 04, §1: 30-day inactivity rule. https://www.palantir.com/docs/foundry/platform-security-management/manage-users/
- Document 04, §19: a client-credentials service user has no access by default. https://www.palantir.com/docs/foundry/platform-security-third-party/register-3pa/

**Left out, and why.**
- Several organizations per tenant, guest memberships and organization discoverability: there is only one company per tenant in version 1, and the guest mechanics are [Unverified] in 04.
- CBAC: built for government (04, "What cannot be copied").
- B2C pattern (one organization, restricted views keyed on user ID) [Fact 05]: deferred to version 2, for a customer self-service portal.
- Custom role sets: version 2 (04, "Optional at small scale").
- Group membership expiry with a 7-day reminder [Fact 04]: version 2.

**Open questions.**
- Do mid-sized customers with several legal entities need hard walls between subsidiaries? If so, organizations with ANY semantics come back.
- Palantir gives no figure for session lifetime ("relatively short") [Unverified 04].

---

## Earlier engineering notes (Phase 2)

### End-to-end invariant

> Source: former `09-security-and-governance/authorization-and-tenant-isolation.md` (moved here in the Nov 2026 restructure)

A user or agent must not see a record in any channel if it cannot access that record in the authoritative source or its granted projection. Enforce the invariant in object queries, list counts, graph traversals, vector candidates, rerank context, caches, export/download, logs, notifications and workflow resume.

### Fail-closed requirements

> Source: former `09-security-and-governance/authorization-and-tenant-isolation.md` (moved here in the Nov 2026 restructure)

- Missing tenant/identity must reject privileged operations.
- Missing policy service must not silently allow protected writes.
- Every cache key includes tenant and relevant policy/identity scope or is re-authorized on read.
- Search/vector index documents carry source ACL metadata and policy revision; stale permissions trigger invalidation/recheck.
- Background jobs carry a service identity and original actor/delegation context.
- External writeback credentials are tenant-scoped and least privilege.
- Audit logs are append-only and protected from data-plane mutation.

OpenFGA can answer relationship questions; OPA/Cedar can evaluate policy. Neither creates end-to-end enforcement automatically. OpenFoundry's Cedar gate nil behaviour and reliance on gateway-populated tenant headers are examples of the wiring that must be audited, not copied.

### Required tests

> Source: former `09-security-and-governance/authorization-and-tenant-isolation.md` (moved here in the Nov 2026 restructure)

Cross-tenant object lookup, count, graph edge, vector hit, cache hit, autocomplete, action, file export, background workflow, webhook and error trace. Also test policy-engine outage, missing tenant header, stale ACL, changed group membership and deleted user. Security tests must assert absence of information, not just 403 on one endpoint.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Postgres RLS migrations — copy (Apache-2.0, code):** [`Przyval/openfoundry` → `db/migrations/009_multi_tenancy.sql`](https://github.com/Przyval/openfoundry/blob/96ff1de/db/migrations/009_multi_tenancy.sql) — `ENABLE` RLS → `CREATE POLICY tenant_isolation ... USING (org_rid = current_setting('app.org_rid', true)) WITH CHECK (...)` → `FORCE ROW LEVEL SECURITY` per table; separate app login role; `SET LOCAL app.org_rid` per transaction. Companion migrations: `014_resource_authorization.sql` (resource role grants and policies) and `015_user_groups_markings.sql`.

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed (code)** — Przyval/openfoundry RLS pattern unchanged at 96ff1de (Apache-2.0).

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
