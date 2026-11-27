# Repository audit — getzep/graphiti

**Role:** temporal knowledge graph and graph-RAG reference.  
**Repository:** [getzep/graphiti](https://github.com/getzep/graphiti), branch `main`; source paths below.  
**Validation:** source inspected; tests and runtime not run.

## Core model

The node and edge definitions distinguish episodic evidence from extracted entity facts. Episodic nodes capture source type, content, group/scope and reference time. Entity edges represent a relation between two entity nodes and carry the fact text, embedding and links to source episodes.

Most important: entity-edge time fields distinguish two clocks:

- `valid_at`: when the fact became true in the world.
- `invalid_at`: when the fact stopped being true in the world.
- `created_at`: when the graph record was created.
- `expired_at`: when Graphiti marked the stored fact as invalidated/expired (transaction time).

The code comments explicitly distinguish `expired_at` from `invalid_at`. This is the clearest open-source pattern in the audited set for bitemporal fact history.

## Ingestion and conflict resolution

`Graphiti.add_episode()` validates configured entity/edge types, resolves a request-scoped driver/client bundle, extracts nodes/edges from the episode content, deduplicates nodes/edges, resolves references to existing graph nodes and searches for related edges. `edge_operations.py` parses extracted date bounds into UTC, normalises future temporal bounds, attaches the source episode, and builds the `EntityEdge` with valid/invalid time fields. When a new fact contradicts an existing fact, the resolution path can invalidate the old edge rather than silently overwriting history.

The core flow is not merely “LLM extracts triples”; it combines episode provenance, entity resolution, relation deduplication, temporal parsing, invalidation and persistence.

## Retrieval

The search module combines configured searches across edges, nodes, episodes and communities. Search configuration can constrain graph scopes and reranking. The advanced search entrypoint accepts group IDs, a center node, BFS origin IDs and optional filters. That is useful for graph-context retrieval, but should not be confused with query-time authorization guarantees.

## Security boundary

`remove_episode()` documents that callers operating in a multi-tenant context must pass `group_id`; when omitted, the method does not check the episode's group. This explicit caller contract should be treated as a warning: a grouping field is not an enforced tenant boundary unless every operation requires and verifies it.

## Relevance and limits

**Learn from:** episode-backed provenance, valid-time vs transaction-time separation, fact invalidation, scoped graph retrieval, typed edge evidence and graph-aware deduplication.  
**Do not copy as enterprise ontology:** LLM-extracted facts are not automatically trusted business state; group IDs do not establish comprehensive authorization; graph search does not replace typed business query or action validation.  
**Follow-up:** inspect the currently supported storage providers, transaction model, deletion semantics, and tenant filtering for every graph operation before selecting a provider.