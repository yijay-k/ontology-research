# PostgreSQL row-level security for multi-tenant apps

| | |
|---|---|
| **Repository** | <https://github.com/Przyval/openfoundry> |
| **Why it matters** | The database-enforced tenant isolation pattern, seen in full in Przyval/openfoundry. |
| **What to take** | Tenant column on every table, RLS enabled and forced, separate app login role, SET LOCAL tenant per transaction (fails closed when unset). |
| **What not to copy** | Application-level partitions without RLS as the only defence. |
| **Feeds** | [01-security/tenancy-and-isolation](../engineering/01-security/tenancy-and-isolation.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

> **Source re-check 28 Nov 2026 (code):** [`Przyval/openfoundry@96ff1de`](https://github.com/Przyval/openfoundry/tree/96ff1de) — structures cited below verified present; no licence change.

## From the open-source code study: 20. Postgres row-level security for multi-tenant apps (pattern as found in code)

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

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
