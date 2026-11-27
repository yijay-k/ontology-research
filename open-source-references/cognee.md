# topoteretes/cognee

| | |
|---|---|
| **Repository** | <https://github.com/topoteretes/cognee> |
| **Why it matters** | Shows graph + vector storage keyed by deterministic identity, with dataset-level permissions. |
| **What to take** | identity_fields / index_fields metadata on object types; grants can only pass on what the granter holds; provenance for forget(). |
| **What not to copy** | The dependency (large Python surface). |
| **Feeds** | [06-knowledge-and-evidence/temporal-facts-and-memory-store](../engineering/06-knowledge-and-evidence/temporal-facts-and-memory-store.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the design** of identity_fields/index_fields as metadata on your object types, and the rule that a grant can only pass on what the granter holds. **Ignore** as a dependency (Python, and a large surface of about 779k lines). [Inference]

## From the open-source code study: 14. Cognee

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- Apache-2.0, Python version 1.6.10, last commit 2026-11-20. [Fact]
- `DataPoint` (Pydantic) is the unit of storage. A field that holds another DataPoint becomes an edge named after the field. `metadata.index_fields` are embedded into per-type vector collections named `<Type>_<field>`. `identity_fields` derive a deterministic node id, so repeated mentions merge. Provenance records which document owns each node, so `forget()` can remove a document's nodes and edges. [Fact] ([infrastructure/engine/models/DataPoint.py](https://github.com/topoteretes/cognee/blob/HEAD/cognee/infrastructure/engine/models/DataPoint.py))
- Storage adapters: graph on Kuzu, Neo4j, Neptune, Turso, or a "postgres_demo" adapter with `graph_node`/`graph_edge` tables over SQLAlchemy and asyncpg (isolated either per dataset or as one schema per dataset in a shared database). Vectors on LanceDB, pgvector or Turso. [Fact]
- Permissions: dataset ACLs (`principal_id, permission_id, dataset_id`) with permission types `read`, `write`, `delete` and `share`, plus tenant-scoped capabilities such as `manage_users`, `grant_capabilities` and `revoke_capabilities`. Granting can only pass on what the granter already holds. [Fact] ([modules/users/permissions/permission_types.py](https://github.com/topoteretes/cognee/blob/HEAD/cognee/modules/users/permissions/permission_types.py))
- Verdict: **copy the design** of identity_fields/index_fields as metadata on your object types, and the rule that a grant can only pass on what the granter holds. **Ignore** as a dependency (Python, and a large surface of about 779k lines). [Inference]
