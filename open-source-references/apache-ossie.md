# Apache Ossie (formerly Open Semantic Interchange)

| | |
|---|---|
| **Repository** | <https://github.com/open-semantic-interchange/OSI> |
| **Why it matters** | Emerging open interchange format for semantic models and ontologies (datasets, relationships, metrics, ai_context, concept mappings). |
| **What to take** | The ai_context shape (instructions, synonyms, examples) on objects and metrics; plan an import/export. |
| **What not to copy** | Using it as the internal model: no actions, rules or permissions, and the spec is unstable. |
| **Feeds** | [03-ontology-engine/semantic-model-format](../engineering/03-ontology-engine/semantic-model-format.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the shape** of `ai_context` onto your objects and metrics, and plan an Ossie export later. Do not make it the internal model: it has no actions, rules or permissions, and the spec is still changing. [Inference]

> **Fact-check 28 Nov 2026:** entered the Apache Incubator on 22 June 2026; canonical repository is now <https://github.com/apache/ossie>. Spec unchanged by the rename. See [engineering/03-ontology-engine/semantic-model-format.md](../engineering/03-ontology-engine/semantic-model-format.md#fact-check-notes).

> **Source re-check 28 Nov 2026 (code):** [`apache/ossie@34e4d37`](https://github.com/apache/ossie/tree/34e4d37) — Spec 0.3.0.dev0 (unreleased); standalone documents carry version/name/datasets at root.

## From the open-source code study: 7. Apache Ossie (formerly Open Semantic Interchange)

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- Apache-2.0, Python SDK (Pydantic v2), last commit 2026-11-20, repository `open-semantic-interchange/OSI`. The README states the rename to "Apache Ossie (incubating)" and points to `apache/ossie-converters` for converters to and from dbt, GoodData, Polaris and Salesforce. [Fact] ([README](https://github.com/open-semantic-interchange/OSI/blob/HEAD/README.md))
- Core spec (`core-spec/spec.md`, 953 lines):
  - A model contains datasets (primary key, unique keys), relationships (from/to columns), fields (with an `is_time` role), and metrics.
  - Metrics are either dataset-scoped (unqualified field names, `source.column`, `AGG(source.measure)`) or model-scoped (`dataset.field`, `AGG(dataset.metric)`).
  - An expression has a portable `sql` in the `OSSIE_SQL_2026` dialect plus optional per-dialect variants.
  - `ai_context` is a string or `{instructions, synonyms, examples}`, and `nonportable_extensions` carries vendor attributes.
  - The version history gives 0.1.1 as released on 2025-12-11 and 0.3.0.dev0 as unreleased, with breaking changes and an explicit warning against production use.

  [Fact]
- Ontology spec (`ontology/ontology.md`, 764 lines): concept types `EntityType` and `ValueType`, extends, relationships with roles and multiplicities, identifying relationships, derivation expressions, global identifiers, annotations, and mapping documents (concept, object and link mappings to datasets). [Fact]
- Verdict: **copy the shape** of `ai_context` onto your objects and metrics, and plan an Ossie export later. Do not make it the internal model: it has no actions, rules or permissions, and the spec is still changing. [Inference]
