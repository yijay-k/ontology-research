# cube-js/cube

| | |
|---|---|
| **Repository** | <https://github.com/cube-js/cube> |
| **Why it matters** | The most complete open design for 'who sees which metric columns and rows'. |
| **What to take** | Per-group access policy object (memberLevel, memberMasking, rowLevel, conditions) and its AND/OR combination semantics; deny-by-default `1 = 0`. |
| **What not to copy** | Running Cube itself next to the ontology (adds a parallel semantic layer). |
| **Feeds** | [04-query-and-metrics/metrics-and-semantic-layer](../engineering/04-query-and-metrics/metrics-and-semantic-layer.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the design** of the policy object and the combination semantics. Running Cube itself is plausible, since it has a Postgres driver and its own SQL API, but it adds a second semantic layer next to your ontology. [Inference]

> **Source re-check 28 Nov 2026 (code):** [`cube-js/cube@47c6d3b`](https://github.com/cube-js/cube/tree/47c6d3b) — structures cited below verified present; no licence change.

## From the open-source code study: 5. Cube: data model and access policies

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- Licence and activity: Apache-2.0 by default, MIT where a package header says so. Mostly TypeScript (about 279k lines) and Rust (about 445k, CubeStore and SQL API), last commit 2026-11-20. [Fact] ([LICENSE](https://github.com/cube-js/cube/blob/HEAD/LICENSE))
- Access policy schema (`CubeValidator.ts`):
  - `GroupPolicySchema` has `group` or `groups` (exactly one), `memberLevel{includes|excludes}`, `memberMasking{includes|excludes}` (which requires memberLevel), `rowLevel{filters | allowAll}` (exactly one of the two), and `conditions[{if: fn(securityContext)}]`.
  - The validator has a deliberate error message warning that an empty `memberLevel` grants every member.

  [Fact]
- Enforcement (`CompilerApi.applyRowLevelSecurity`):
  - The policies of the cube an instance belongs to apply to that instance alone.
  - A member path through joins that resolves to no cube instance is denied by pushing a `1 = 0` segment.
  - A cube accessed through a view skips member-level restrictions but keeps row-level filters ("views act as a security boundary", like Postgres views).
  - The per-cube constraints are AND-ed together; the multiple applicable policies within a cube are combined with OR.

  [Fact] ([CompilerApi.ts](https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-server-core/src/core/CompilerApi.ts))
- Verdict: **copy the design** of the policy object and the combination semantics. Running Cube itself is plausible, since it has a Postgres driver and its own SQL API, but it adds a second semantic layer next to your ontology. [Inference]
