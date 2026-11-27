# microsoft/graphrag

| | |
|---|---|
| **Repository** | _not recorded in the research_ |
| **Why it matters** | Reference for hierarchical community summaries that answer 'global' questions over a corpus. |
| **What to take** | Community-report idea as an optional batch job. |
| **What not to copy** | The LLM-heavy indexing pipeline; suits static corpora, not a live operational model. |
| **Feeds** | [06-knowledge-and-evidence/knowledge-graph-retrieval](../engineering/06-knowledge-and-evidence/knowledge-graph-retrieval.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **copy the community-report idea**, a hierarchical pre-summary of clusters for "global" questions, as an optional batch job. **Ignore** the pipeline. Indexing is LLM-heavy and better suited to static corpora than to a live operational model. [Inference]

## From the open-source code study: 10. Microsoft GraphRAG

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- MIT, Python (about 52k lines), version 3.3.0, last commit 2026-11-01, split into eight packages (graphrag, -cache, -chunking, -common, -input, -llm, -storage, -vectors). [Fact]
- The indexing workflows are `index/workflows/*` (extract_graph or extract_graph_nlp, finalize_graph, prune_graph, create_communities, create_community_reports, generate_text_embeddings, and incremental `update_*` workflows). Search modes are basic, local, global and DRIFT. [Fact]
- Output tables (`data_model/schemas.py`):
  - entities: id, short_id, title, type, description, text_unit_ids, frequency, degree.
  - relationships: source, target, description, weight, degree, text_unit_ids.
  - community_reports: community, level, parent, children, title, summary, full_content, rating, explanation, findings, period.

  [Fact]
- Verdict: **copy the community-report idea**, a hierarchical pre-summary of clusters for "global" questions, as an optional batch job. **Ignore** the pipeline. Indexing is LLM-heavy and better suited to static corpora than to a live operational model. [Inference]
