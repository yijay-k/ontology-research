# Knowledge graph retrieval

**Layer:** [06-knowledge-and-evidence](README.md) · **What it is:** Graph-structured knowledge extracted from text, and when graph retrieval is and is not worth it.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Open-source implementations](#open-source-implementations) (7) · [Other companies and products](#other-companies-and-products) (2) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Lingyang, AgentOne and Alibaba

### 8. Ant Group OpenSPG and KAG

> Source: [general-references/08-alibaba-stack.md § 8. Ant Group OpenSPG and KAG](../../general-references/08-alibaba-stack.md#8-ant-group-openspg-and-kag)

**Plain English.** OpenSPG is a typed knowledge-graph engine: schema plus storage plus rule reasoner. KAG sits on top of it. It builds the graph from documents and answers questions by planning small steps, such as "look up X's founder", "look up the founder's birth year", "compute the age". Example rule in the schema: a company's `mainSupply` relation is *derived*. It exists if the two companies sit on adjacent supply-chain products and over 50% of the source company's inflow comes from the other.

**Schema language** (`.schema` files, committed with `knext schema commit`). [Fact] Parser `KAG/knext/schema/marklang/schema_ml.py`, enums `knext/schema/model/base.py`.
- Type keywords: `EntityType`, `ConceptType`, `EventType`, `StandardType`, `BasicType`, `IndexType`. Basic types are `Text`, `Integer`, `Float`. Each declaration is `EnglishName(中文名): Type`.
- Type-level keys: `desc`, `properties`, `relations`, `hypernymPredicate` (`isA`, `locateAt`, `mannerOf`; used on concepts), `regular`, `spreadable`, `autoRelate`.
- Property constraints: `NotNull`, `MultiValue`, `Enum`, `Regular`. Index types: `VECTOR`, `SPARSE_VECTOR`, `TEXT`, `TEXT_AND_VECTOR`, `TEXT_AND_SPARSE_VECTOR`.
- Built-in properties: events get `eventTime`; concepts get `stdId` and `alias`.
- **Semantic relation prefixes** (`PREFIX#name`):
  - `SYNANT` (synonym, antonym, …)
  - `CAU` (leadTo, causes, …)
  - `SEQ` (happenedBefore, hasSubevent, …)
  - `IND` (belongTo)
  - `INC` (isPartOf, hasA, madeOf, …)
  - `USE` (usedFor, capableOf, …)

  They appear in schemas as e.g. `IND#belongTo` and `CAU#leadTo`.
- **Semantic properties replace hand-built relation tables.** A property typed as a ConceptType with `MultiValue` (e.g. `product(经营产品): Product`) turns a comma-separated CSV column into graph edges at import (`kag/examples/supplychain/schema/README.md`).
- **Rules (metrics and derived relations).**
  - Syntax: `rule: [[ Define (s:Type)-[p:pred]->(o:Type) { STRUCTURE { graph pattern } CONSTRAINT { named conditions and assignments } } ]]`.
  - Constraints use aggregation functions `group(s).sum(f.transAmt)`, date functions `date_diff(from_unix_time(now(),'yyyyMMdd'), f.transDate) < 30`, null handling `rule_value(cond, then, else)`, references to other derived properties (`s.fundTrans1Month`), and named thresholds (`R1("占比必须超过50%"): x*1.0/s.totalTransInAmt > 0.5`).
  - Concept rules (`concept.rule`) classify events into concept nodes, e.g. ProductChainEvent with index 价格 and trend 上涨 belongs to `TaxOfProdEvent/价格上涨`. They also derive causal links between concepts (`leadTo`).
  - Files: `SupplyChain.schema`, `concept.rule`. [Fact]
- Storage: labelled property graph (TuGraph or Neo4j adapters under `openspg/cloudext/impl/graph-store/`) plus a vector store. The paper names Elasticsearch or Milvus. [Fact] repo; [paper](https://arxiv.org/html/2409.13731v3)

**kg-builder.**
- Two chains (`kag/builder/default_chain.py`). [Fact]
  - Structured: `mapping >> vectorizer >> writer`.
  - Unstructured: `reader >> splitter >> extractor(s) >> vectorizer >> post_processor >> writer`.
- Components (`kag/builder/component/`):
  - Scanners: csv, json, directory, file, dataset, odps (MaxCompute), sls, yuque.
  - Readers: pdf, docx, markdown, txt, dict, mix.
  - Splitters: length, outline, pattern, semantic, table.
  - Extractors: `schema_free` (NER, then entity standardization, then triples), `schema_constraint`, outline, summary, knowledge_unit, atomic_query, table, chunk, naive_rag.
  - Aligners: `kag_aligner`, `spg_aligner`.
  - Writers: Neo4j-backed graph writer and in-memory graph writer.
- Concurrency setting `builder.model.execute.num` defaults to 5 (v0.5.1).
- A "lightweight build" mode (v0.7) claims 89% fewer construction tokens. [Vendor claim] README

**Mutual indexing.** [Fact] Every extracted node gets a `source` edge to its Chunk node (`assemble_sub_graph_with_chunk`, `schema_free_extractor.py:365–375`). The paper's built-in properties are `supporting_chunks`, `description`, `summary` and `belongTo`. Chunk IDs combine article, paragraph and in-paragraph index, so neighbouring text has neighbouring IDs. Knowledge is layered into KG_cs (schema-constrained, curated), KG_fr (extracted, same types) and RC (raw chunks) ([paper](https://arxiv.org/html/2409.13731v3)). Retrieval runs exact graph match, then fuzzy graph match, then chunk retrieval. In code the flow components are `kg_cs_open_spg_legacy`, `kg_fr_open_spg_legacy` and `rc_open_spg_legacy` under `kag_hybrid_executor`. [Fact for names; Inference for the exact/fuzzy reading]

**Logical-form solver.** [Fact] `kag/solver/prompt/logic_form_plan.py`; [paper Table 1 and Algorithm 1](https://arxiv.org/html/2409.13731v3)
- Operators:
  - `Retrieval(s=alias:Type[name], p=alias:edge, o=alias:Type[name], s.prop=value…)`, where type and name are given only at first reference and later steps reuse aliases.
  - `Math(content=[…], target=…)->alias`
  - `Deduce(op=judgement|entailment|extract|choice|multiChoice, content, target)->alias`
  - `Output(alias)`
  - The paper also lists `Sort` (min/max, limit).
- Each step must contain exactly one action.
- Loop: planner, then reasoner per sub-query, then judge "resolved?", then supplementary query, repeating until resolved, then generator.
- Planners: static, iterative, LF-static, MCP planner, and a fine-tuned model planner. Executors: hybrid retrieval, deduce, output, py-based math, MCP, web search.
- **Numeric computation** is the LLM generating Python that runs in a subprocess with a timeout. The error is fed back for regeneration (`py_based_math_executor.py`).

**Results.** See finding 8. Retrieval Recall@5 for KAG versus IRCoT+HippoRAG: HotpotQA 88.8 vs 83.0, 2Wiki 91.9 vs 93.9 (KAG is lower here), MuSiQue 65.7 vs 57.6. Knowledge alignment raised CR_ref3 top-5 recall by 15.7% on average. LFSH_ref3 is the slowest configuration. [Fact] [paper](https://arxiv.org/html/2409.13731v3). The E-Government and E-Health figures were not in the parts I could read. [Unverified]

**Release history.** [Fact] README, `docs/release_notes.md`, git tags.
- 2024-10-25: v0.5, first release of kg-builder and kg-solver; kag-model "to be open-sourced later".
- 2024-11-21: v0.5.1, Word upload, concurrency setting.
- 2025-01-07: v0.6, domain knowledge injection, schema-constrained extraction.
- 2025-04-17: v0.7, solver refactor with static and iterative planning, "simple" versus "deep reasoning" modes, lightweight build; v0.7.1 followed.
- 2025-06-27: v0.8.0, private and public knowledge bases, built-in index types (Outline, Summary, KnowledgeUnit, AtomicQuery, Chunk, Table), KBs decoupled from apps, full MCP, KAG-Thinker model.

There is no tag after v0.8.0, though `main` still received commits in Nov 2026. OpenSPG engine tags end at v0.8. Licence Apache-2.0. Product mode runs in Docker Compose on port 8887. arXiv versions: v1 10 Sep 2024, v2 24 Sep 2024, v3 26 Sep 2024.

**SPG white paper.** Not opened. [Unverified]

## Open-source implementations

### 8. Graphiti: temporal knowledge graph

> Source: [open-source-references/graphiti.md](../../open-source-references/graphiti.md) (code study)

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

### 9. LightRAG

> Source: [open-source-references/lightrag.md](../../open-source-references/lightrag.md) (code study)

- MIT, Python, version 1.5.8, last commit 2026-11-21 (very active). The Python line count (489k) is inflated by vendored or generated files. [Fact]/[Inference]
- Query modes: `local`, `global`, `hybrid`, `naive`, `mix` (graph plus vector, the default) and `bypass`. [Fact] ([lightrag/base.py](https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/base.py))
- Postgres storage (`lightrag/kg/postgres_impl.py`, 10,914 lines) has KV, vector, doc-status and graph classes. The graph class uses Apache AGE/Cypher. The DDL defines tables such as `LIGHTRAG_VDB_CHUNKS(workspace, id, full_doc_id, chunk_order_index, tokens, content, content_vector VECTOR(dim), file_path)` and `LIGHTRAG_VDB_ENTITY/RELATION` (with `chunk_ids[]` for provenance), all keyed `(workspace, id)`. [Fact]
- `lightrag/kg/pgtable_impl.py` (`PGTableGraphStorage`) is a Postgres-native graph on two plain tables with JSONB properties and B-tree indexes, with no AGE and no Cypher. Edges are stored in canonical order (`src = min(a,b)`, computed in Python because SQL `LEAST` differs under non-C collations). Node properties are merged with `jsonb ||`, edge properties are replaced, and an edge upsert creates missing endpoints. Graph retrieval is a frontier-capped iterative BFS whose per-hop filtering and degree ranking run in SQL, so cost is bounded by `max_nodes`. [Fact] ([file](https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py))
- Verdict: **copy the design** of `PGTableGraphStorage` and the provenance columns. This is the plan for graph storage in a Postgres-only build. [Inference]

### 10. Microsoft GraphRAG

> Source: [open-source-references/graphrag.md](../../open-source-references/graphrag.md) (code study)

- MIT, Python (about 52k lines), version 3.3.0, last commit 2026-11-01, split into eight packages (graphrag, -cache, -chunking, -common, -input, -llm, -storage, -vectors). [Fact]
- The indexing workflows are `index/workflows/*` (extract_graph or extract_graph_nlp, finalize_graph, prune_graph, create_communities, create_community_reports, generate_text_embeddings, and incremental `update_*` workflows). Search modes are basic, local, global and DRIFT. [Fact]
- Output tables (`data_model/schemas.py`):
  - entities: id, short_id, title, type, description, text_unit_ids, frequency, degree.
  - relationships: source, target, description, weight, degree, text_unit_ids.
  - community_reports: community, level, parent, children, title, summary, full_content, rating, explanation, findings, period.

  [Fact]
- Verdict: **copy the community-report idea**, a hierarchical pre-summary of clusters for "global" questions, as an optional batch job. **Ignore** the pipeline. Indexing is LLM-heavy and better suited to static corpora than to a live operational model. [Inference]

### 11. HippoRAG 2

> Source: [open-source-references/hipporag.md](../../open-source-references/hipporag.md) (code study)

- MIT, Python (about 12k lines), version 2.0.0a5, last commit 2026-10-06. It extracts OpenIE triples, builds a graph of phrases and passages, and ranks passages with personalized PageRank (python-igraph, damping 0.5 by default) seeded by facts matched to the query and reranked by an LLM. [Fact] ([src/hipporag/HippoRAG.py](https://github.com/OSU-NLP-Group/HippoRAG/blob/HEAD/src/hipporag/HippoRAG.py), `run_ppr`, `rerank_facts`)
- Verdict: **ignore** as a dependency, since it is research-grade alpha code. The personalized-PageRank-over-facts idea is the reference if multi-hop recall becomes a problem. [Inference]

### 12. KAG and OpenSPG (Ant Group)

> Source: [open-source-references/openspg-kag.md](../../open-source-references/openspg-kag.md) (code study)

- KAG: Apache-2.0, Python (about 101k lines), version 0.8.0, last commit 2026-11-19. OpenSPG: Apache-2.0, Java/Scala (about 138k lines), last commit 2025-06-29. OpenSPG has been idle for about 17 months while KAG is active. [Fact]
- The schema DSL (`*.schema`, for example [RiskMining.schema](https://github.com/OpenSPG/KAG/blob/HEAD/kag/examples/riskmining/schema/RiskMining.schema)) works like this:
  - Types are bilingual (`Person(自然人): EntityType`) and come in two kinds: `ConceptType` with a `hypernymPredicate: isA` (a taxonomy) and `EntityType` with `properties` and `relations`.
  - Relations can have their own properties (for example `fundTrans` carries transDate and transAmt).
  - Relations can be *derived by rule*. KGDSL `Define (s:Person)-[p:developed]->(o:App) { STRUCTURE {...} CONSTRAINT { deviceNum = group(s,o).count(d); R1(...): deviceNum > 5 } }` defines a relation by a graph pattern plus an aggregate constraint.

  [Fact]
- The solver has planners (static, iterative, logical-form, MCP) and executors (retriever, deduce, math, MCP). [Fact] ([kag/solver/](https://github.com/OpenSPG/KAG/tree/HEAD/kag/solver))
- Verdict: **copy the design** of bilingual labels, concept taxonomies separate from entity types, and *rule-derived relations* (a derived link computed from a pattern). **Ignore** as a dependency (it needs the Java OpenSPG server and a graph store). [Inference]

### Repository audit — getzep/graphiti

> Source: [open-source-references/graphiti.md](../../open-source-references/graphiti.md) (repository audit)

**Role:** temporal knowledge graph and graph-RAG reference.  
**Repository:** [getzep/graphiti](https://github.com/getzep/graphiti), branch `main`; source paths below.  
**Validation:** source inspected; tests and runtime not run.

#### Core model

The node and edge definitions distinguish episodic evidence from extracted entity facts. Episodic nodes capture source type, content, group/scope and reference time. Entity edges represent a relation between two entity nodes and carry the fact text, embedding and links to source episodes.

Most important: entity-edge time fields distinguish two clocks:

- `valid_at`: when the fact became true in the world.
- `invalid_at`: when the fact stopped being true in the world.
- `created_at`: when the graph record was created.
- `expired_at`: when Graphiti marked the stored fact as invalidated/expired (transaction time).

The code comments explicitly distinguish `expired_at` from `invalid_at`. This is the clearest open-source pattern in the audited set for bitemporal fact history.

#### Ingestion and conflict resolution

`Graphiti.add_episode()` validates configured entity/edge types, resolves a request-scoped driver/client bundle, extracts nodes/edges from the episode content, deduplicates nodes/edges, resolves references to existing graph nodes and searches for related edges. `edge_operations.py` parses extracted date bounds into UTC, normalises future temporal bounds, attaches the source episode, and builds the `EntityEdge` with valid/invalid time fields. When a new fact contradicts an existing fact, the resolution path can invalidate the old edge rather than silently overwriting history.

The core flow is not merely “LLM extracts triples”; it combines episode provenance, entity resolution, relation deduplication, temporal parsing, invalidation and persistence.

#### Retrieval

The search module combines configured searches across edges, nodes, episodes and communities. Search configuration can constrain graph scopes and reranking. The advanced search entrypoint accepts group IDs, a center node, BFS origin IDs and optional filters. That is useful for graph-context retrieval, but should not be confused with query-time authorization guarantees.

#### Security boundary

`remove_episode()` documents that callers operating in a multi-tenant context must pass `group_id`; when omitted, the method does not check the episode's group. This explicit caller contract should be treated as a warning: a grouping field is not an enforced tenant boundary unless every operation requires and verifies it.

#### Relevance and limits

**Learn from:** episode-backed provenance, valid-time vs transaction-time separation, fact invalidation, scoped graph retrieval, typed edge evidence and graph-aware deduplication.  
**Do not copy as enterprise ontology:** LLM-extracted facts are not automatically trusted business state; group IDs do not establish comprehensive authorization; graph search does not replace typed business query or action validation.  
**Follow-up:** inspect the currently supported storage providers, transaction model, deletion semantics, and tenant filtering for every graph operation before selecting a provider.

### Repository audit — HKUDS/LightRAG

> Source: [open-source-references/lightrag.md](../../open-source-references/lightrag.md) (repository audit)

**Role:** knowledge graph + vector retrieval over document ingestion; PostgreSQL storage and pipeline-control reference.  
**Repository:** [HKUDS/LightRAG](https://github.com/HKUDS/LightRAG), branch `main`.  
**Validation:** source inspected; tests/build/runtime not run.

#### PostgreSQL graph persistence

`lightrag/kg/pgtable_impl.py` documents two graph tables:

- `lightrag_graph_nodes(workspace, namespace, id, properties JSONB)` with composite primary key `(workspace, namespace, id)`.
- `lightrag_graph_edges(workspace, namespace, src_id, tgt_id, properties JSONB)` with composite primary key `(workspace, namespace, src_id, tgt_id)`.

Edges are stored in canonical endpoint order using Python-side `min/max`. The implementation comments explain why it deliberately does not rely on SQL `LEAST/GREATEST`: locale/collation differences for non-ASCII values could produce inconsistent ordering and duplicate edges. The migration logic adds advisory transaction locks, performs defensive deduplication before changing primary keys, repairs missing endpoint references and creates indexes, including a partial index for non-canonical edge detection.

This is more useful than “LightRAG uses Postgres”: it demonstrates how a graph adapter enforces canonical identity and migrates real-world legacy rows.

#### Ingestion pipeline

The inspected pipeline has explicit document processing states (including pending, parsing, analyzing, processing, failed and processed), content deduplication, workspace locks/reservations, retry/reprocess pathways and protection against race conditions between concurrent enqueue, processing, scan and destructive operations. Its comments discuss how partial storage writes can happen and how status/auto-rescan logic prevents committed work from being stranded. It also separates document/chunk data from graph extraction state. The graph can be skipped while vector/chunk retrieval remains available.

#### Retrieval model

`operate.py` contains distinct graph-query, naive vector-query and mixed/hybrid routes. Retrieval can combine graph entities/relations with chunk content and ranking/reranking. This reinforces the idea that graph and vector retrieval are complementary retrieval strategies rather than interchangeable storage models.

#### Limits for our use

LightRAG is document-centric retrieval infrastructure. Workspace and namespace columns partition data but do not constitute an enterprise policy engine. It does not provide a complete type registry, source-backed object ownership, action model, relationship permissions or business workflow execution.

#### Adoption recommendation

**Learn from:** canonical graph-edge identity, migration care, workspace-scoped storage keys, explicit pipeline job state, concurrency reservations and hybrid retrieval.  
**Adapt:** attach provenance and policy metadata to every derived object/chunk/edge; separate graph facts from authoritative business object state; enforce user/tenant access before ranking and after retrieval.  
**Avoid:** treating workspace filtering as complete authorization or allowing document-extracted relationships to mutate operational records without a validation/action layer.

## Other companies and products

### 14. Graph and knowledge-graph vendors

> Source: [general-references/11-context-layer-products.md § 14. Graph and knowledge-graph vendors](../../general-references/11-context-layer-products.md#14-graph-and-knowledge-graph-vendors)

- **Neo4j** (neo4j-graphrag-python v1.24.0, read from source) ([Fact](https://github.com/neo4j/neo4j-graphrag-python)):
  - The KG-builder pipeline has components for data loading (PDF), text splitting, schema extraction, entity and relation extraction, lexical graph, graph pruning, a KG writer, and entity resolution.
  - The schema object is `GraphSchema`: `NodeType` (label, description, properties as `PropertyType{name, type, description, required}`, `additional_properties`), `RelationshipType`, `Pattern` (allowed source-relationship-target triples) and constraints (KEY and similar).
  - The schema can be supplied, built by `SchemaFromTextExtractor`, or reverse-engineered by `SchemaFromExistingGraphExtractor`.
  - Resolvers: exact match, fuzzy match, and SpaCy semantic match.
  - Retrievers: Vector, VectorCypher, Hybrid, HybridCypher, Text2Cypher, Tools (an LLM picks among retrievers), plus Pinecone, Qdrant and Weaviate adapters.
  - *Copy:* `Pattern` triples as an allow-list for extracted links, and the resolver cascade.
  - The Aura Agent docs page could not be opened. [Unverified]
- **Stardog.** Virtual knowledge graph: SPARQL over relational sources through mappings, without copying data. OWL and SHACL reasoning and validation. An LLM assistant called Voicebox. [Unverified]
- **TigerGraph.** GSQL property graph and the Savanna cloud. Its GraphRAG/CoPilot tooling exists. [Unverified]
- **RelationalAI.** Runs as a Snowflake Native App. Models are written in Python (concepts, relationships, rules), with graph, rules, prescriptive and predictive reasoners. It is an Ossie member. [Unverified, apart from Ossie membership, which is a Fact from the Ossie docs.]
- **Timbr.** A SQL-native ontology layer: concepts with inheritance mapped onto tables, and relationships queryable as virtual joins through SQL. [Unverified]
- **Cognite Data Fusion.** An industrial knowledge graph whose data modeling service has *spaces* (namespace and access boundary), *containers* (physical storage with typed properties and constraints), *views* (logical schemas that can map several containers and implement other views) and *data models* (collections of views), with instances as nodes and edges. It has a Core Data Model of standard types such as asset, equipment, time series, activity and file, and "Atlas AI" low-code agents that call data-model tools. [Unverified: pages not opened this session.] *Copy (if verified):* the container/view split, where physical storage and the logical type are separate and many views map onto one container.
- **C3 AI.** A type system in which every entity is a "Type" with fields and methods, using inheritance and mixins. Applications and agents call type methods. [Unverified]
- **Aera Technology.** "Decision intelligence": skills that recommend decisions, capture user accept or reject choices, and learn from them. "Decision records" as a named object is unconfirmed. [Unverified]

### 15. The "context graph" thesis and responses

> Source: [general-references/11-context-layer-products.md § 15. The "context graph" thesis and responses](../../general-references/11-context-layer-products.md#15-the-context-graph-thesis-and-responses)

- **The thesis** (Ashu Garg, Foundation Capital, 26 Dec 2025) ([Fact](https://ashugarg.substack.com/p/ais-trillion-dollar-opportunity-context)):
  - A rule says what should happen in general. A decision trace records what happened in one case: which policy version applied, which exception was granted, who approved it.
  - A context graph is a living record of decision traces "stitched across entities and time", so that precedent becomes searchable.
  - Entities in it: accounts, renewals, tickets, incidents, policies, approvers and agent runs, connected by decision events and "why" links.
  - Proposed implementation traits: event-sourced state and replayable history.
  - A decision record would capture the inputs gathered, the policy evaluated, the exception route invoked, the approver and the state written.
  - Incumbent systems of record store only current state. Warehouses sit in the read path after ETL. Agent-orchestration startups sit in the execution path.
  - Named startups: Regie, Maximor, PlayerZero (a context graph of code, config and infrastructure) and Arize (observability for agent decision quality).
- **Responses.** The thesis builds on Jamin Ball's "Long Live Systems of Record" (cited in the piece). A reader replied that an agent with full event storage plus later ML analysis would yield the same graph. Incumbents' closest answers in 2026 are Salesforce ACE's shared memory with provenance, Google's interaction-trace enrichment and Atlan's "decision traces" positioning ([Vendor claim](https://atlan.com/know/ai-agent/databricks/genie-ontology-and-atlan-context-layer.md)). I could not run further searches for 2026 decision-trace startups because the budget ran out. Zep/Graphiti (a temporal knowledge graph for agent memory) is a likely relevant open-source project. [Unverified]

## Research literature

### 5. Graph retrieval

> Source: [general-references/09-papers-knowledge-layer.md § 5. Graph retrieval](../../general-references/09-papers-knowledge-layer.md#5-graph-retrieval)

**GraphRAG (Microsoft).** Edge et al., "From Local to Global: A Graph RAG Approach to Query-Focused Summarization", arXiv:2404.16130 (v2 Feb 2025) ([HTML](https://arxiv.org/html/2404.16130)). Method [Fact]:
- Split into 600-token chunks with 100-token overlap.
- GPT-4-turbo extracts entities, relationships and claims using domain few-shot examples, with "gleaning" rounds that ask what was missed. Entities are matched by exact string; duplicate relationships become edge weights.
- Run hierarchical Leiden community detection (graspologic) at levels C0–C3.
- Summarise each community bottom-up into an 8k-token window, prioritised by prominence.
- At query time, shuffle and chunk the community summaries; each chunk yields a partial answer with a 0–100 helpfulness score; drop zeros; reduce the rest in score order.
Data: podcast transcripts (about 1M tokens, 8,564 nodes) and news (about 1.7M tokens). 125 generated questions per dataset, judged pairwise by an LLM. Results: 62–83% win rates over vector RAG on comprehensiveness and diversity; root-level summaries used about 97% fewer tokens than summarising the source text. Indexing the podcast corpus took about 281 minutes. Limits: two corpora only; fabrication not measured; designed for *global sensemaking*, not fact lookup.

**LazyGraphRAG and DRIFT.**
- LazyGraphRAG ([MSR blog, 25 Nov 2024](https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/)), [Vendor claim]:
  - Indexing: NLP noun-phrase extraction, a concept co-occurrence graph and graph-statistics communities; no LLM summarisation at index time.
  - Query: an LLM splits the query into subqueries; chunks are ranked by embedding similarity and communities by their best chunks; an LLM tests chunk relevance within a fixed "relevance test budget" (100, 500 or 1,500), recursing into subcommunities when successive communities yield nothing relevant; answers are built from extracted claims.
  - Results: indexing at about 0.1% of GraphRAG's cost; quality comparable to GraphRAG global search at more than 700× lower query cost. Tested on 5,590 AP articles and 100 synthetic queries. Integrated into Microsoft Discovery per the June 2025 editor's note.
- DRIFT ([MSR blog, 31 Oct 2024](https://www.microsoft.com/en-us/research/blog/introducing-drift-search-combining-global-and-local-search-methods-to-improve-quality-and-efficiency/)), [Vendor claim]: HyDE-expand the query; match it against community reports; the top-K reports produce an initial answer plus follow-up questions; run each follow-up through local search; stop after 2 iterations. Beat local search 78% (comprehensiveness) and 81% (diversity) on 50 questions, LLM-judged.

**LightRAG.** Guo et al. (HKU), arXiv:2410.05779 (v3 Apr 2025) ([HTML](https://arxiv.org/html/2410.05779)). Method [Fact]:
- 1,200-token chunks; the LLM extracts entities and relations.
- An LLM writes a key–value profile per entity (key = name) and per relation (several keys, including themes); duplicates are merged; gleaning = 1.
- At query time the LLM extracts low-level and high-level keywords. Low-level keywords are matched to entities and high-level ones to relations in a vector database, then expanded by one hop.
- Incremental update by taking the union of node and edge sets, with no rebuild.
Results: LLM-judged win rates (about 85% over naive RAG on Legal; about 49–55% against GraphRAG). Retrieval uses fewer than 100 tokens of keyword generation in one call, against about 610k tokens for GraphRAG global on Legal. *Independent tests are much less favourable*: 6.6 average F1 in the HippoRAG 2 benchmark ([2502.14802](https://arxiv.org/html/2502.14802)) and about 100k tokens per query in GraphRAG-Bench ([2506.05690](https://arxiv.org/html/2506.05690)). The two sources disagree sharply. [Inference] The disagreement probably reflects different metrics (LLM-judged comprehensiveness against exact-answer F1) and configurations, so it is a warning sign either way.

**HippoRAG and HippoRAG 2.** HippoRAG: Gutiérrez et al., arXiv:2405.14831, NeurIPS 2024 ([abs](https://arxiv.org/abs/2405.14831)). [Fact] LLM + KG + Personalized PageRank (PPR); up to 20% better on multi-hop QA; comparable to iterative IRCoT at 10–30× lower cost and 6–13× faster.
HippoRAG 2: "From RAG to Memory: Non-Parametric Continual Learning for LLMs", arXiv:2502.14802, ICML 2025 ([HTML](https://arxiv.org/html/2502.14802)).
- Offline [Fact]: an LLM runs OpenIE on each passage to get schema-less triples. Subjects and objects become phrase nodes and relations become edges. Synonym edges link phrase pairs whose embedding similarity exceeds a threshold. Each passage is a node linked by "contains" edges to its phrases.
- Online [Fact]: embed the query and match it to triples (top-k). An LLM "recognition memory" step filters irrelevant triples. Phrase seeds are weighted by the scores of the triples they came from; all passage nodes are seeds weighted by embedding similarity times a balance factor. If no triples survive, fall back to dense retrieval. Run PPR and rank passages by score.
- Models: Llama-3.3-70B and NV-Embed-v2.
- F1 [Fact]: average 59.8 against NV-Embed-v2 57.0, HippoRAG 53.1, GraphRAG 49.6, RAPTOR 48.8, LightRAG 6.6. NQ 63.3 against 61.9; MuSiQue 48.6 against 45.7; 2Wiki 71.0 against 61.5.
Builder lesson: [Inference] the best published recipe for multi-hop questions over *unstructured* text that stays safe on simple questions. Its cost is one OpenIE pass at indexing and one filter call per query.

**KAG (Ant Group).** Liang et al., arXiv:2409.13731 (Sep 2024) ([abs](https://arxiv.org/abs/2409.13731), [HTML](https://arxiv.org/html/2409.13731)). [Fact]
- Representation (LLMFriSPG) layers schema-constrained knowledge, schema-free graph information and raw chunks.
- *Mutual indexing* links graph elements to source chunks.
- A logical-form solver breaks questions into operators (Retrieval, Sort, Math, Deduce) with reflection rounds and a global memory.
- Knowledge alignment uses synonym and hypernym relations.
- Results: the abstract reports relative F1 gains of 19.6% on 2WikiMultiHopQA and 33.5% on HotpotQA over prior RAG; the HTML introduction lists the figures in a different order, so the per-dataset attribution is inconsistent. Deployed for Ant's e-government and e-health Q&A ("significant improvement in professionalism", no figures in the parts I read). Open source via OpenSPG.
Builder lesson: [Inference] the closest academic match to the founder's design. A schema-constrained company model sits alongside a looser extracted layer, both linked to source text, and questions are planned into typed operators including **Math**. Copy the layering and the operator vocabulary. The KAG-Model fine-tuning component does not apply.

**G-Retriever, Think-on-Graph, GraphReader.**
- G-Retriever: He et al., arXiv:2402.07630 (2024) ([abs](https://arxiv.org/abs/2402.07630)). [Fact] Frames subgraph retrieval as Prize-Collecting Steiner Tree optimisation to pick a compact, connected, relevant subgraph; the LLM is fine-tuned with soft prompts (needs training). Copy only the idea: [Inference] when handing an agent a neighbourhood of records, return a *connected* minimal subgraph linking the relevant nodes, not a bag of top-k nodes.
- Think-on-Graph: Sun et al., arXiv:2307.07697 (v6 Mar 2024) ([abs](https://arxiv.org/abs/2307.07697)). [Fact] Training-free. The LLM agent runs iterative beam search over KG entities and relations and returns the best reasoning path; state of the art on 6 of 9 datasets at the time. [Inference] This is the template for agent traversal of a typed company graph through tools (`get_neighbors(object, link_type)`), with beam width and depth limits as cost controls.
- GraphReader: Li et al., arXiv:2406.14550 (v2 Nov 2024) ([abs](https://arxiv.org/abs/2406.14550)). [Fact] Turns long text into a graph; an agent plans, calls functions to read nodes and neighbours from coarse to fine, and records notes until it has enough. With a 4k context it beat GPT-4-128k on LV-Eval from 16k to 256k tokens.

**When graph retrieval helps and when it doesn't.**
- Han et al., "RAG vs. GraphRAG: A Systematic Evaluation and Key Insights", arXiv:2502.11371 (v3 Mar 2026) ([HTML](https://arxiv.org/html/2502.11371)). [Fact]
  - NQ F1: RAG 64.8, GraphRAG-Local 63.0, HippoRAG 2 61.0, KG-GraphRAG (triples only) 34.3.
  - HotpotQA: HippoRAG 2 63.0, RAG 60.0.
  - MultiHop-RAG accuracy: HippoRAG 2 70.3, RAG 67.0. RAG still leads on inference and null queries; graph methods lead on temporal queries (about 50% against 30.7%).
  - Only about 65% of answer entities appear in the LLM-built KG.
  - Hybrids: *Selection* (route fact questions to RAG and reasoning questions to GraphRAG) +1.1%; *Integration* (run both and concatenate contexts) +6.4%, at roughly double the cost.
  - Judge position bias as in Key finding 14.
- Xiang et al., "When to use Graphs in RAG" (GraphRAG-Bench), arXiv:2506.05690 (v3 Feb 2026) ([HTML](https://arxiv.org/html/2506.05690)). [Fact]
  - Fact retrieval: RAG with rerank matches or beats graphs (60.9 against 60.1).
  - Complex reasoning: HippoRAG 2 +10.5 points. Contextual summarisation: MS-GraphRAG local +13.1.
  - Graph quality: HippoRAG 2's graph is the densest (average degree 8.75).
  - Guidelines: retrieve precisely, prefer graph quality to graph size, bound context growth, use simple RAG for simple lookups.
  - The paper's text and its token-cost table disagree for MS-GraphRAG global (about 40k against about 331k).
Builder lesson: [Inference] a graph built by an LLM *from text* is lossy and expensive. A graph built *from the company's own structured records* (foreign keys, IDs) is exact and almost free. The product's main graph should be the latter, with text-derived graphs only as a secondary index.

## Design decisions already in the reference maps

### 9. When graph retrieval over text is, and is not, worth it

> Source: [general-references/32-map-research-and-cost.md § 9. When graph retrieval over text is, and is not, worth it](../../general-references/32-map-research-and-cost.md#9-when-graph-retrieval-over-text-is-and-is-not-worth-it)

**Purpose.** Decide whether to build a graph index over *unstructured* text (emails, call notes, contracts). Example: "Across all collection-call notes this year, what reasons do customers give for late payment?" is a global-summary question. "What did ACME say on 3 Nov?" is a lookup that plain RAG handles.

**Design to implement.**
- *Version 1*: no text-derived graph. Fact lookups use section 7.
- *Version 2, only if customers ask multi-hop questions over text*: HippoRAG 2-style retrieval.
  - Offline: OpenIE triples per passage; phrase nodes and passage nodes; synonym edges above an embedding-similarity threshold.
  - Online: match the query to triples, filter them with a model, seed Personalized PageRank from phrases and passages, fall back to dense retrieval if no triples survive.
- *Version 2, for corpus-wide "themes" questions*: LazyGraphRAG-style deferred work, with cheap noun-phrase co-occurrence communities at index time and model relevance tests under a fixed budget (100/500/1,500) at query time.
- Possible router: fact questions to RAG, reasoning questions to the graph. Gain is +1.1% for selection, or +6.4% for running both, at roughly double the cost.

**Evidence.**
- Single-hop NQ F1: RAG 64.8, GraphRAG-Local 63.0, KG-only GraphRAG 34.3. Multi-hop HotpotQA: HippoRAG 2 63.0 against RAG 60.0 (arXiv 2502.11371).
- HippoRAG 2 averaged 59.8 F1 against NV-Embed-v2 at 57.0, GraphRAG 49.6 and LightRAG 6.6 (arXiv 2502.14802).
- GraphRAG-Bench: fact retrieval with RAG plus rerank 60.9 against 60.1 for graphs; complex reasoning HippoRAG 2 +10.5; summarisation MS-GraphRAG local +13.1 (arXiv 2506.05690).
- Prompt tokens per query: vanilla RAG about 900, HippoRAG 2 about 1,000, MS-GraphRAG local about 39k, LightRAG about 100k, MS-GraphRAG global about 331k (arXiv 2506.05690).
- LazyGraphRAG indexes at about 0.1% of GraphRAG's cost [Vendor claim] (MSR blog).
- Judge bias: GraphRAG-Local won 97% of comparisons when shown first and 12% when shown second (arXiv 2502.11371). All from document 09, section 5.

**Copies.** Document 09, "What to copy" items 16 and 17. https://arxiv.org/html/2502.14802 ; https://arxiv.org/html/2506.05690 ; https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/

**Left out.**
- GraphRAG global search as a default (about 331k tokens per query).
- LightRAG, whose own results conflict with independent benchmarks.
- KG-only GraphRAG.

**Open questions.** HippoRAG 2's PPR damping factor and passage weight are in Appendix G.1, which was not read.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Postgres-native graph storage to copy:** [`HKUDS/LightRAG` → `lightrag/kg/pgtable_impl.py`](https://github.com/HKUDS/LightRAG/blob/47038cf/lightrag/kg/pgtable_impl.py) (LightRAG 1.5.9, MIT) — two JSONB tables, canonical edge order, frontier-capped BFS.
- **Deterministic node identity:** [`topoteretes/cognee` → `cognee/infrastructure/engine/models/DataPoint.py`](https://github.com/topoteretes/cognee/blob/dbc515b/cognee/infrastructure/engine/models/DataPoint.py) (Cognee 1.6.11) — `metadata.index_fields` (embedded) and `identity_fields` (derive the node id).

## Palantir (updated 28 Nov 2026)

- In Palantir the ontology itself is the graph (links, search-arounds) and Vertex visualises cause and effect; semantic search over objects is in [03 § 16](../../general-references/03-palantir-aip.md#16-retrieval-semantic-search-embeddings-documents-and-ontology-augmented-generation).

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Changed (code) — Graphiti backends.** Graphiti 0.32.1 (was 0.31.2) adds **Relate**, an embedded in-process graph database (Python 3.11+, no server), alongside Neo4j, FalkorDB and Neptune; Zep's hosted Konig is also listed. There is still **no Postgres driver**. Source: [`getzep/graphiti` → `README.md`](https://github.com/getzep/graphiti/blob/343a7bb/README.md)
- **Confirmed (code)** — LightRAG `pgtable_impl.py` still present (1.5.9); Cognee `identity_fields`/`index_fields` unchanged (1.6.11).

## Gaps

