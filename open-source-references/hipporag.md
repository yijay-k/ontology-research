# OSU-NLP-Group/HippoRAG

| | |
|---|---|
| **Repository** | <https://github.com/OSU-NLP-Group/HippoRAG> |
| **Why it matters** | Reference technique for multi-hop recall (personalized PageRank over extracted facts). |
| **What to take** | The PPR-over-facts idea, if multi-hop recall becomes a measured problem. |
| **What not to copy** | The code — research-grade alpha. |
| **Feeds** | [06-knowledge-and-evidence/knowledge-graph-retrieval](../engineering/06-knowledge-and-evidence/knowledge-graph-retrieval.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) |

**Verdict from the code study:** **ignore** as a dependency, since it is research-grade alpha code. The personalized-PageRank-over-facts idea is the reference if multi-hop recall becomes a problem. [Inference]

## From the open-source code study: 11. HippoRAG 2

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- MIT, Python (about 12k lines), version 2.0.0a5, last commit 2026-10-06. It extracts OpenIE triples, builds a graph of phrases and passages, and ranks passages with personalized PageRank (python-igraph, damping 0.5 by default) seeded by facts matched to the query and reranked by an LLM. [Fact] ([src/hipporag/HippoRAG.py](https://github.com/OSU-NLP-Group/HippoRAG/blob/HEAD/src/hipporag/HippoRAG.py), `run_ppr`, `rerank_facts`)
- Verdict: **ignore** as a dependency, since it is research-grade alpha code. The personalized-PageRank-over-facts idea is the reference if multi-hop recall becomes a problem. [Inference]
