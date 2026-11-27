# GoRules Zen, json-rules-engine, DMN

| | |
|---|---|
| **Repository** | <https://github.com/gorules/zen>, <https://github.com/bpmn-io/dmn-js> |
| **Why it matters** | Options for business-editable decision tables and rule evaluation with traces. |
| **What to take** | GoRules Zen if business users must edit decision tables; otherwise Palantir-style JSON condition IR evaluated in TypeScript. |
| **What not to copy** | DMN unless a customer demands it; rules stored as code strings. |
| **Feeds** | [05-actions-and-rules/rules-and-decision-tables](../engineering/05-actions-and-rules/rules-and-decision-tables.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:**  - **Adopt Zen** if business users must edit decision tables (pricing, eligibility, approval thresholds) and you want a trace of why a row fired. - Otherwise encode preconditions as the JSON condition IR copied from Palantir's `OntologyIrCondition`, evaluated in TypeScript. - Avoid DMN unless a customer demands it. [Inference] ---

> **Source re-check 28 Nov 2026 (code):** [`gorules/zen@62cd159`](https://github.com/gorules/zen/tree/62cd159), [`CacheControl/json-rules-engine@e1f1fda`](https://github.com/CacheControl/json-rules-engine/tree/e1f1fda) — Zen node kinds unchanged; json-rules-engine unchanged since Feb 2026.

## From the open-source code study: 30. Rules engines: GoRules Zen, json-rules-engine, DMN

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- **Zen**: MIT, Rust (about 89k lines) with napi bindings published as `@gorules/zen-engine` 2.1.12. The JSON Decision Model graph has node kinds Input, Output, Function (JavaScript source), Decision (sub-decision by key), DecisionTable (hit policy `first` or `collect`), Expression, Switch and Custom. A newer `policy` module adds "policy documents" with prose, typed data models and tables, plus tracing (`BlockTrace`, `ConditionTrace`), diagnostics, rename and linting. [Fact] ([core/types/src/decision/mod.rs](https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs), [core/engine/src/policy/mod.rs](https://github.com/gorules/zen/blob/HEAD/core/engine/src/policy/mod.rs))
- **json-rules-engine**: ISC, JavaScript, version 7.3.2, about 1,500 lines, last commit 2026-02-16. It provides all/any/not conditions, custom operators, async facts in an almanac, and events and priorities. [Fact]
- **DMN**: `dmn-js` is MIT plus a clause that the bpmn.io watermark must stay visible. It is a modeller, not an engine. `feelin` (MIT, version 8.2.2) is a JavaScript FEEL interpreter. [Fact] ([dmn-js LICENSE](https://github.com/bpmn-io/dmn-js/blob/HEAD/LICENSE))
- Verdict:
  - **Adopt Zen** if business users must edit decision tables (pricing, eligibility, approval thresholds) and you want a trace of why a row fired.
  - Otherwise encode preconditions as the JSON condition IR copied from Palantir's `OntologyIrCondition`, evaluated in TypeScript.
  - Avoid DMN unless a customer demands it.

  [Inference]

---
