# Repository audit — HKUDS/LightRAG

**Role:** knowledge graph + vector retrieval over document ingestion; PostgreSQL storage and pipeline-control reference.  
**Repository:** [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG), branch `main`.  
**Validation:** source inspected; tests/build/runtime not run.

## PostgreSQL graph persistence

`lightrag/kg/pgtable_impl.py` documents two graph tables:

- `lightrag_graph_nodes(workspace, namespace, id, properties JSONB)` with composite primary key `(workspace, namespace, id)`.
- `lightrag_graph_edges(workspace, namespace, src_id, tgt_id, properties JSONB)` with composite primary key `(workspace, namespace, src_id, tgt_id)`.

Edges are stored in canonical endpoint order using Python-side `min/max`. The implementation comments explain why it deliberately does not rely on SQL `LEAST/GREATEST`: locale/collation differences for non-ASCII values could produce inconsistent ordering and duplicate edges. The migration logic adds advisory transaction locks, performs defensive deduplication before changing primary keys, repairs missing endpoint references and creates indexes, including a partial index for non-canonical edge detection.

This is more useful than “LightRAG uses Postgres”: it demonstrates how a graph adapter enforces canonical identity and migrates real-world legacy rows.

## Ingestion pipeline

The inspected pipeline has explicit document processing states (including pending, parsing, analyzing, processing, failed and processed), content deduplication, workspace locks/reservations, retry/reprocess pathways and protection against race conditions between concurrent enqueue, processing, scan and destructive operations. Its comments discuss how partial storage writes can happen and how status/auto-rescan logic prevents committed work from being stranded. It also separates document/chunk data from graph extraction state. The graph can be skipped while vector/chunk retrieval remains available.

## Retrieval model

`operate.py` contains distinct graph-query, naive vector-query and mixed/hybrid routes. Retrieval can combine graph entities/relations with chunk content and ranking/reranking. This reinforces the idea that graph and vector retrieval are complementary retrieval strategies rather than interchangeable storage models.

## Limits for our use

LightRAG is document-centric retrieval infrastructure. Workspace and namespace columns partition data but do not constitute an enterprise policy engine. It does not provide a complete type registry, source-backed object ownership, action model, relationship permissions or business workflow execution.

## Adoption recommendation

**Learn from:** canonical graph-edge identity, migration care, workspace-scoped storage keys, explicit pipeline job state, concurrency reservations and hybrid retrieval.  
**Adapt:** attach provenance and policy metadata to every derived object/chunk/edge; separate graph facts from authoritative business object state; enforce user/tenant access before ranking and after retrieval.  
**Avoid:** treating workspace filtering as complete authorization or allowing document-extracted relationships to mutate operational records without a validation/action layer.