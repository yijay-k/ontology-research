# malloydata/malloy

| | |
|---|---|
| **Repository** | <https://github.com/malloydata/malloy> |
| **Why it matters** | Shows how to aggregate correctly over fanned-out joins. |
| **What to take** | The symmetric-aggregate ('shifty sum') technique, if fan-out joins are ever allowed. |
| **What not to copy** | Malloy as a dependency — it is a whole query language. |
| **Feeds** | [04-query-and-metrics/metrics-and-semantic-layer](../engineering/04-query-and-metrics/metrics-and-semantic-layer.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **ignore as a dependency** (it is a whole language to teach). Copy the symmetric-aggregate idea if you ever allow joins that fan out instead of forbidding them as MetricFlow does. [Inference]

## From the open-source code study: 6. Malloy

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- MIT, TypeScript (about 218k lines), version 0.0.439, last commit 2026-11-18. It has a Postgres dialect (`packages/malloy/src/dialect/postgres/`) and a stable query-interface package (`malloy-interfaces`, Thrift-defined). [Fact]
- Notable technique: `shifty_sum_distinct.ts` implements a "shifty sum". It is a symmetric aggregate: it sums a value over the distinct rows of a fanned-out join by shifting values into wide decimals keyed by row identity, so measures survive joins without double counting. [Fact] ([file](https://github.com/malloydata/malloy/blob/HEAD/packages/malloy/src/dialect/shifty_sum_distinct.ts))
- Verdict: **ignore as a dependency** (it is a whole language to teach). Copy the symmetric-aggregate idea if you ever allow joins that fan out instead of forbidding them as MetricFlow does. [Inference]
