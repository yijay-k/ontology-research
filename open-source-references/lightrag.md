# HKUDS/LightRAG

| | |
|---|---|
| **Repository** | <https://github.com/HKUDS/LightRAG> |
| **Why it matters** | The most directly copyable knowledge-graph-in-Postgres design. |
| **What to take** | PGTableGraphStorage: two JSONB tables, canonical edge order, frontier-capped BFS, workspace tenant key, chunk_ids provenance. |
| **What not to copy** | Its query modes as the product's retrieval logic; adopt only the storage pattern. |
| **Feeds** | [06-knowledge-and-evidence/knowledge-graph-retrieval](../engineering/06-knowledge-and-evidence/knowledge-graph-retrieval.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** **copy the design** of `PGTableGraphStorage` and the provenance columns. This is the plan for graph storage in a Postgres-only build. [Inference]

> **Source re-check 28 Nov 2026 (code):** [`HKUDS/LightRAG@47038cf`](https://github.com/HKUDS/LightRAG/tree/47038cf) — v1.5.9; pgtable_impl.py present.

## From the open-source code study: 9. LightRAG

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

- MIT, Python, version 1.5.8, last commit 2026-11-21 (very active). The Python line count (489k) is inflated by vendored or generated files. [Fact]/[Inference]
- Query modes: `local`, `global`, `hybrid`, `naive`, `mix` (graph plus vector, the default) and `bypass`. [Fact] ([lightrag/base.py](https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/base.py))
- Postgres storage (`lightrag/kg/postgres_impl.py`, 10,914 lines) has KV, vector, doc-status and graph classes. The graph class uses Apache AGE/Cypher. The DDL defines tables such as `LIGHTRAG_VDB_CHUNKS(workspace, id, full_doc_id, chunk_order_index, tokens, content, content_vector VECTOR(dim), file_path)` and `LIGHTRAG_VDB_ENTITY/RELATION` (with `chunk_ids[]` for provenance), all keyed `(workspace, id)`. [Fact]
- `lightrag/kg/pgtable_impl.py` (`PGTableGraphStorage`) is a Postgres-native graph on two plain tables with JSONB properties and B-tree indexes, with no AGE and no Cypher. Edges are stored in canonical order (`src = min(a,b)`, computed in Python because SQL `LEAST` differs under non-C collations). Node properties are merged with `jsonb ||`, edge properties are replaced, and an edge upsert creates missing endpoints. Graph retrieval is a frontier-capped iterative BFS whose per-hop filtering and degree ranking run in SQL, so cost is bounded by `max_nodes`. [Fact] ([file](https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py))
- Verdict: **copy the design** of `PGTableGraphStorage` and the provenance columns. This is the plan for graph storage in a Postgres-only build. [Inference]

## Repository audit: Repository audit — HKUDS/LightRAG

> Source: former `15-repository-audits/lightrag.md` (Phase 2 source inspection, not executed).

**Role:** knowledge graph + vector retrieval over document ingestion; PostgreSQL storage and pipeline-control reference.  
**Repository:** [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG), branch `main`.  
**Validation:** source inspected; tests/build/runtime not run.

### PostgreSQL graph persistence

`lightrag/kg/pgtable_impl.py` documents two graph tables:

- `lightrag_graph_nodes(workspace, namespace, id, properties JSONB)` with composite primary key `(workspace, namespace, id)`.
- `lightrag_graph_edges(workspace, namespace, src_id, tgt_id, properties JSONB)` with composite primary key `(workspace, namespace, src_id, tgt_id)`.

Edges are stored in canonical endpoint order using Python-side `min/max`. The implementation comments explain why it deliberately does not rely on SQL `LEAST/GREATEST`: locale/collation differences for non-ASCII values could produce inconsistent ordering and duplicate edges. The migration logic adds advisory transaction locks, performs defensive deduplication before changing primary keys, repairs missing endpoint references and creates indexes, including a partial index for non-canonical edge detection.

This is more useful than “LightRAG uses Postgres”: it demonstrates how a graph adapter enforces canonical identity and migrates real-world legacy rows.

### Ingestion pipeline

The inspected pipeline has explicit document processing states (including pending, parsing, analyzing, processing, failed and processed), content deduplication, workspace locks/reservations, retry/reprocess pathways and protection against race conditions between concurrent enqueue, processing, scan and destructive operations. Its comments discuss how partial storage writes can happen and how status/auto-rescan logic prevents committed work from being stranded. It also separates document/chunk data from graph extraction state. The graph can be skipped while vector/chunk retrieval remains available.

### Retrieval model

`operate.py` contains distinct graph-query, naive vector-query and mixed/hybrid routes. Retrieval can combine graph entities/relations with chunk content and ranking/reranking. This reinforces the idea that graph and vector retrieval are complementary retrieval strategies rather than interchangeable storage models.

### Limits for our use

LightRAG is document-centric retrieval infrastructure. Workspace and namespace columns partition data but do not constitute an enterprise policy engine. It does not provide a complete type registry, source-backed object ownership, action model, relationship permissions or business workflow execution.

### Adoption recommendation

**Learn from:** canonical graph-edge identity, migration care, workspace-scoped storage keys, explicit pipeline job state, concurrency reservations and hybrid retrieval.  
**Adapt:** attach provenance and policy metadata to every derived object/chunk/edge; separate graph facts from authoritative business object state; enforce user/tenant access before ranking and after retrieval.  
**Avoid:** treating workspace filtering as complete authorization or allowing document-extracted relationships to mutate operational records without a validation/action layer.
