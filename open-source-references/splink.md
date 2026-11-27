# moj-analytical-services/splink

| | |
|---|---|
| **Repository** | <https://github.com/moj-analytical-services/splink> |
| **Why it matters** | Production-grade probabilistic entity resolution (Fellegi–Sunter). |
| **What to take** | Run as an offline batch job against Postgres; store match pairs and cluster ids as a link type. |
| **What not to copy** | Real-time matching inside the request path. |
| **Feeds** | [02-data-platform/entity-resolution](../engineering/02-data-platform/entity-resolution.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **adopt as an offline batch job** (Python against your Postgres) for merging customers and suppliers across systems. Its output is match pairs and cluster ids, which your ontology stores as a link type. [Inference]

## From the open-source code study: 27. Entity resolution: Splink

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- MIT, Python, version 5.0.0, last commit 2026-11-11. It implements Fellegi–Sunter probabilistic linkage with blocking rules, comparison levels, m/u estimation by expectation-maximisation, term-frequency adjustments, connected-components clustering and `realtime.py` (score one new record against existing records). Backends are DuckDB, Spark, Postgres and SQLite. [Fact] ([splink/internals/](https://github.com/moj-analytical-services/splink/tree/HEAD/splink/internals))
- Verdict: **adopt as an offline batch job** (Python against your Postgres) for merging customers and suppliers across systems. Its output is match pairs and cluster ids, which your ontology stores as a link type. [Inference]
