# getzep/graphiti

| | |
|---|---|
| **Repository** | <https://github.com/getzep/graphiti> |
| **Why it matters** | The clearest temporal fact model: each fact has world time and record time, and contradictions close old facts instead of overwriting. |
| **What to take** | Four timestamps per edge, index-based LLM adjudication of duplicates/contradictions, the deterministic invalidation rule, future-tense normaliser. |
| **What not to copy** | Running it (Python plus Neo4j/FalkorDB/Neptune; no Postgres driver). |
| **Feeds** | [06-knowledge-and-evidence/knowledge-graph-retrieval](../engineering/06-knowledge-and-evidence/knowledge-graph-retrieval.md), [06-knowledge-and-evidence/temporal-facts-and-memory-store](../engineering/06-knowledge-and-evidence/temporal-facts-and-memory-store.md) |
| **Evidence level** | Source read (doc 14, 21 Nov 2026) + Phase 2 repository audit (source inspection, not executed) |

**Verdict from the code study:** **copy the design** (four-timestamp edges, index-based LLM adjudication, the deterministic invalidation rule, the future-tense normaliser) into Postgres tables. Running Graphiti adds Python plus Neo4j or FalkorDB. [Inference]

## From the open-source code study: 8. Graphiti: temporal knowledge graph

> Source: original research doc 14 (`14-open-source-code-study.md`), read from source on 21 Nov 2026 at depth 1, no code executed.

Plain-English explanation: "Alice is the account manager for Acme" was true from March. In September a new message says Bob took over. Graphiti does not overwrite the first fact. It closes it (`invalid_at = September`) and keeps both, so "who was the account manager in May?" still has an answer.

- Apache-2.0, Python (about 85k lines), version 0.31.2, last commit 2026-11-20. Graph drivers exist for Neo4j, FalkorDB and Neptune; there is no Postgres driver. [Fact] ([graphiti_core/driver/](https://github.com/getzep/graphiti/tree/HEAD/graphiti_core/driver))
- Schema (`graphiti_core/edges.py`, `nodes.py`):
  - Every node and edge has `uuid` and `group_id` ("partition of the graph", which serves as the tenant or namespace key).
  - `EntityEdge` adds `name`, `fact` (a natural-language sentence), `fact_embedding`, `episodes[]` (provenance), `valid_at`, `invalid_at`, `expired_at` (transaction time), `reference_time` and typed `attributes`.
  - The node types are `EntityNode` (name_embedding, summary, attributes), `EpisodicNode` (the raw source unit, with `source`, `content` and `valid_at`), `CommunityNode` and `SagaNode` (a sequence of episodes with a rolling summary).

  [Fact] ([edges.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/edges.py))
- Ingestion API. `add_episode(name, episode_body, source_description, reference_time, group_id, entity_types: dict[str, pydantic model], edge_types, edge_type_map: {(src_label, tgt_label): [edge names]}, custom_extraction_instructions, saga, identity_properties ...)`. Custom types are Pydantic models. `enforce_edge_type_signatures` drops an edge, or renames it to a default, if its name is not allowed between its endpoint labels. [Fact] ([graphiti.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/graphiti.py), [edge_operations.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py))
- Invalidation, in three steps:
  1. A fast path reuses an existing edge whose endpoints match and whose normalised fact text is identical.
  2. Otherwise one small-model LLM call receives the duplicate candidates and the invalidation candidates with *continuous integer indices*, so the model never sees UUIDs, and returns `duplicate_facts` and `contradicted_facts`. Out-of-range indices are logged and discarded.
  3. `resolve_edge_contradictions` applies a deterministic rule. If the time windows do not overlap, nothing happens. If the old edge started before the new one, the old edge gets `invalid_at = new.valid_at` and `expired_at = now`.

  [Fact]
- Future-tense handling. `temporal_edge_utils.py` uses regular expressions (will, plans to, scheduled to, by/deadline, until/expires, and so on) so that a promise's `valid_at` is the statement time, not the promised date, and so that a soft deadline does not become `invalid_at`. [Fact] ([file](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/temporal_edge_utils.py))
- Search. Edge search methods are cosine similarity, BM25 and breadth-first search. Rerankers are reciprocal rank fusion, node distance, episode mentions, maximal marginal relevance (MMR) and a cross-encoder. [Fact] ([search_config.py](https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/search/search_config.py))
- Verdict: **copy the design** (four-timestamp edges, index-based LLM adjudication, the deterministic invalidation rule, the future-tense normaliser) into Postgres tables. Running Graphiti adds Python plus Neo4j or FalkorDB. [Inference]

## Repository audit: Repository audit — getzep/graphiti

> Source: former `15-repository-audits/graphiti.md` (Phase 2 source inspection, not executed).

**Role:** temporal knowledge graph and graph-RAG reference.  
**Repository:** [getzep/graphiti](https://github.com/getzep/graphiti), branch `main`; source paths below.  
**Validation:** source inspected; tests and runtime not run.

### Core model

The node and edge definitions distinguish episodic evidence from extracted entity facts. Episodic nodes capture source type, content, group/scope and reference time. Entity edges represent a relation between two entity nodes and carry the fact text, embedding and links to source episodes.

Most important: entity-edge time fields distinguish two clocks:

- `valid_at`: when the fact became true in the world.
- `invalid_at`: when the fact stopped being true in the world.
- `created_at`: when the graph record was created.
- `expired_at`: when Graphiti marked the stored fact as invalidated/expired (transaction time).

The code comments explicitly distinguish `expired_at` from `invalid_at`. This is the clearest open-source pattern in the audited set for bitemporal fact history.

### Ingestion and conflict resolution

`Graphiti.add_episode()` validates configured entity/edge types, resolves a request-scoped driver/client bundle, extracts nodes/edges from the episode content, deduplicates nodes/edges, resolves references to existing graph nodes and searches for related edges. `edge_operations.py` parses extracted date bounds into UTC, normalises future temporal bounds, attaches the source episode, and builds the `EntityEdge` with valid/invalid time fields. When a new fact contradicts an existing fact, the resolution path can invalidate the old edge rather than silently overwriting history.

The core flow is not merely “LLM extracts triples”; it combines episode provenance, entity resolution, relation deduplication, temporal parsing, invalidation and persistence.

### Retrieval

The search module combines configured searches across edges, nodes, episodes and communities. Search configuration can constrain graph scopes and reranking. The advanced search entrypoint accepts group IDs, a center node, BFS origin IDs and optional filters. That is useful for graph-context retrieval, but should not be confused with query-time authorization guarantees.

### Security boundary

`remove_episode()` documents that callers operating in a multi-tenant context must pass `group_id`; when omitted, the method does not check the episode's group. This explicit caller contract should be treated as a warning: a grouping field is not an enforced tenant boundary unless every operation requires and verifies it.

### Relevance and limits

**Learn from:** episode-backed provenance, valid-time vs transaction-time separation, fact invalidation, scoped graph retrieval, typed edge evidence and graph-aware deduplication.  
**Do not copy as enterprise ontology:** LLM-extracted facts are not automatically trusted business state; group IDs do not establish comprehensive authorization; graph search does not replace typed business query or action validation.  
**Follow-up:** inspect the currently supported storage providers, transaction model, deletion semantics, and tenant filtering for every graph operation before selecting a provider.
