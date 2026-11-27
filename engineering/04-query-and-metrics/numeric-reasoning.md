# Numeric reasoning

**Layer:** [04-query-and-metrics](README.md) · **What it is:** Arithmetic done in executed code with a trace, never in the model's head.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Research literature

### 9. Table and numeric reasoning

> Source: [general-references/09-papers-knowledge-layer.md § 9. Table and numeric reasoning](../../general-references/09-papers-knowledge-layer.md#9-table-and-numeric-reasoning)

- **TAT-QA.** Zhu et al., arXiv:2105.07624, 2021 ([abs](https://arxiv.org/abs/2105.07624)). [Fact] Hybrid table plus text QA from real financial reports. The TAGOP model tags the relevant cells and spans, then applies symbolic aggregation operators: 58.0% F1 against 90.8% for experts. The dataset size of about 16.6k questions is from memory [Unverified].
- **FinQA.** Chen et al., arXiv:2109.00122, 2021 ([abs](https://arxiv.org/abs/2109.00122)). [Fact] Multi-step numeric reasoning over financial reports, annotated with gold reasoning programs; pre-trained models fall far short of experts. The size of about 8.3k QA pairs and the DSL of add/subtract/multiply/divide/greater/exp plus table aggregation are from memory [Unverified].
- **Program of Thoughts.** Chen, Ma, Wang, Cohen, arXiv:2211.12588, TMLR 2023 ([abs](https://arxiv.org/abs/2211.12588)). [Fact] The model writes a program and an interpreter executes it; about 12% average gain over chain-of-thought on math and financial QA (FinQA, ConvFinQA, TAT-QA).
- **Chain-of-Table.** Wang et al. (Google), arXiv:2401.04398 ([abs](https://arxiv.org/abs/2401.04398)). [Fact] The LLM repeatedly picks a table operation (add column, select rows, group, sort) and applies it; the evolving table records the reasoning. State of the art on WikiTQ, FeTaQA and TabFact at publication.
- **FinanceBench.** Islam et al. (Patronus AI), arXiv:2311.11944 ([abs](https://arxiv.org/abs/2311.11944)). [Fact] 10,231 questions on public-company filings; on a 150-case sample, GPT-4-Turbo with retrieval was wrong or refused on 81%. Long context helps but is impractical for large filings.
Builder lesson: [Inference] numbers should come from either (i) the semantic layer or query engine, or (ii) values extracted from documents and then computed in a sandbox (Python or SQL over a temporary table). The LLM never adds numbers in its head. Every displayed number should carry a trace: the query or program and the source rows or cells.

## Design decisions already in the reference maps

### 3. Table and numeric reasoning: arithmetic in executed code, with a trace

> Source: [general-references/32-map-research-and-cost.md § 3. Table and numeric reasoning: arithmetic in executed code, with a trace](../../general-references/32-map-research-and-cost.md#3-table-and-numeric-reasoning-arithmetic-in-executed-code-with-a-trace)

**Purpose.** The model never adds, divides or computes percentages in its head. Example: "How much of the overdue balance would be cleared if the top 10 promises-to-pay are kept?" The semantic layer returns the rows, and a sandboxed SQL step computes the sum. The model only explains the result.

**Design to implement.**
- Derived arithmetic runs either (i) as SQL over a temporary table built from `query_metric` results, or (ii) in a sandboxed interpreter with no network.
- Every displayed number carries `{source: metric_query|extraction|computation, plan_or_program, input_row_ids or cell refs}`. The UI can expand the trace.
- Table-manipulation steps (select rows, group, sort, add a column) are exposed as operations, following Chain-of-Table, rather than as free-form reasoning.
- Planned operators are typed: Retrieval, Sort, Math, Deduce (KAG's operator vocabulary).

**Evidence.**
- Program-of-Thoughts gained about 12% over chain-of-thought on FinQA, ConvFinQA and TAT-QA (arXiv 2211.12588).
- On FinanceBench, GPT-4-Turbo with retrieval answered 81% of questions wrongly or refused (arXiv 2311.11944).
- TAT-QA: TAGOP scored 58.0% F1 against 90.8% for experts (arXiv 2105.07624). All three are from document 09, section 9.
- LOFT: long-context models struggle with SQL-like compositional reasoning (arXiv 2406.13121; document 09, section 4).

**Copies.**
- Document 09, section 9 and "What to copy" item 20: arithmetic in code with a provenance trace. https://arxiv.org/abs/2211.12588 ; https://arxiv.org/abs/2401.04398
- Document 09, section 5 (KAG): the logical-form operators, including Math. https://arxiv.org/abs/2409.13731
- Document 10, section 1 (CodeAct): code as action, which needs sandboxing, resource limits and monitoring. https://arxiv.org/abs/2402.01030

**Left out.** The KAG-Model fine-tuning; the TAGOP model, which needs training.

**Open questions.** Which sandbox to use in a TypeScript stack? The documents name Anthropic's code-execution container (no network) but not a self-hosted option.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
