# pgaudit/pgaudit

| | |
|---|---|
| **Repository** | <https://github.com/pgaudit/pgaudit> (read at `62e7f81`) |
| **Licence** | PostgreSQL licence |
| **Why it matters** | PostgreSQL extension for session and object audit logging (`pgaudit.log = 'write, ddl'`, `pgaudit.log_relation`). |
| **What to take** | Database-level audit of every write and DDL as a backstop under the application audit log. |
| **What not to copy** | Using it as the business audit log — it records SQL, not actions, actors or reasons. |
| **Feeds** | [audit-log](../engineering/11-observability/audit-log.md) |
| **Evidence level** | Licence and key files checked in source on 28 Nov 2026; not executed. |

_Added in the 28 Nov 2026 gap-filling pass._
