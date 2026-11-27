# cedar-policy/cedar

| | |
|---|---|
| **Repository** | <https://github.com/cedar-policy/cedar> |
| **Why it matters** | Fast, analysable policy language for yes/no authorization decisions, available as WebAssembly for TypeScript. |
| **What to take** | @cedar-policy/cedar-wasm for 'may principal P run action A on object O'. |
| **What not to copy** | Relying on it for list filtering — resource queries (tpe) are experimental and not in the wasm build; write that path in SQL. |
| **Feeds** | [01-security/authorization-model](../engineering/01-security/authorization-model.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **adopt `@cedar-policy/cedar-wasm` as a dependency** for "may principal P run action A on object O with context C". Write the "filter the list of objects" path yourself in SQL, because resource queries are not in the wasm build. [Inference]

## From the open-source code study: 17. Cedar

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- Apache-2.0, Rust, workspace version 4.15.0, last commit 2026-11-20. [Fact]
- Crates: `cedar-policy` (API), `-core` (parser, evaluator, validator, batched evaluator, `tpe`), `-cli`, `-formatter`, `-symcc` (symbolic compilation), a language server, and `cedar-wasm`. [Fact]
- Type-aware partial evaluation (`cedar-policy/src/api/tpe.rs`):
  - `PolicySet::tpe` returns a decision, or residual policies that can be inspected as a structured tree.
  - `is_authorized_batched` loads entities on demand through an `EntityLoader`, up to `max_iters` times.
  - `query_resource` and `query_principal` answer "which resources may this principal act on" or "which principals may act on this resource", given a known type.
  - `query_action` is also present.

  The `tpe` feature is listed under `experimental` in `cedar-policy/Cargo.toml`. [Fact] ([tpe.rs](https://github.com/cedar-policy/cedar/blob/HEAD/cedar-policy/src/api/tpe.rs))
- `cedar-wasm` is published as `@cedar-policy/cedar-wasm` in ESM, Node/CommonJS and web flavours. It is built with features `["wasm", "partial-eval"]`, not `tpe`. [Fact] ([cedar-wasm/Cargo.toml](https://github.com/cedar-policy/cedar/blob/HEAD/cedar-wasm/Cargo.toml), [README](https://github.com/cedar-policy/cedar/blob/HEAD/cedar-wasm/README.md))
- Verdict: **adopt `@cedar-policy/cedar-wasm` as a dependency** for "may principal P run action A on object O with context C". Write the "filter the list of objects" path yourself in SQL, because resource queries are not in the wasm build. [Inference]
