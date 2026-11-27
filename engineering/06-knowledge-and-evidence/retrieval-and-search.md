# Retrieval and search

**Layer:** [06-knowledge-and-evidence](README.md) · **What it is:** Finding the right passages: chunking, hybrid search, reranking and permission-aware retrieval.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Other companies and products](#other-companies-and-products) (4) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (3)

## Palantir

### 16. Retrieval: semantic search, embeddings, documents and "ontology-augmented generation"

> Source: [general-references/03-palantir-aip.md § 16. Retrieval: semantic search, embeddings, documents and "ontology-augmented generation"](../../general-references/03-palantir-aip.md#16-retrieval-semantic-search-embeddings-documents-and-ontology-augmented-generation)

**Plain English.** To answer from manuals or contracts, documents are cut into chunks. Each chunk becomes an object with an embedding, so agents can find the right passage and cite the page.

**Technical detail.**
- **OAG as Palantir describes it.** The docs page is about retrieval technique. [Fact] https://www.palantir.com/docs/foundry/ontology/ontology-augmented-generation/
  - Basic flow: chunk the documents, create chunk objects with a media reference, search, and show results in a PDF viewer.
  - Advanced techniques: HyDE; ranked keyword search in Object Storage v2; query *enrichment* (add synonyms, remove stopwords, for keyword search) and *extraction* (reduce the question to its core action, for semantic search); hybrid search with RRF, score = Σ 1/(k + rank).
  - Advice: if the context fits the window, skip search. When answers are bad, check retrieval first.
- **OAG in the blog framing.** A Palantir forward-deployed architect calls OAG a "more expansive, decision-centric version" of RAG. In this framing the LLM also gets *logic tools* (forecasts, optimisers) and *actions* that write back to source systems. [Vendor claim] https://blog.palantir.com/building-with-palantir-aip-data-tools-for-rag-oag-b3b509c8b0f3 (post undated)
- **Vector properties and KNN.**
  - The Pipeline Builder "Text to Embeddings" expression writes to a `vector` property.
  - Workshop KNN filter: K from 1 to 100, not sortable by relevance.
  - TypeScript v1: K up to 100, and needs `"enableVectorProperties": true`.
  - TypeScript v2: `numNeighbors` from 1 to 500, embeds the query internally, and supports relevance ordering.
  - Python `nearest_neighbors` returns `_score`.
  - In Logic, a published search function becomes a tool; the docs example prompts the model with k = 5.
  - [Fact] https://www.palantir.com/docs/foundry/ontology/using-palantir-provided-models-to-create-a-semantic-search-workflow
- **Palantir MCP `semantic_search`** finds objects by natural-language similarity. [Fact] https://www.palantir.com/docs/foundry/palantir-mcp/available-tools/
- **AIP Document Intelligence.**
  - Extraction is either "traditional" (PDF metadata, OCR, layout detection) or VLM-based. An optional "Preprocess document" step passes OCR text plus the page image to the VLM.
  - Extraction quality can be evaluated with a VLM-as-judge rubric scored 1 to 5 for tables and headers. This requires Claude 4 Sonnet on the enrollment.
  - Strategies deploy to Python transforms (batch) or per-page Python functions (GA 28 Jul 2026, with optional chunking and embeddings).
  - Markdown-aware chunking and embeddings shipped on 17 Mar 2026.
  - [Fact] https://www.palantir.com/docs/foundry/document-intelligence/core-concepts/ , https://www.palantir.com/docs/foundry/announcements/2026-07 , https://palantir.com/docs/foundry/announcements/2026-03/
  - I could not read chunk sizes or overlap. [Unverified]
- **Pipeline Builder "Use LLM" node.** Runs LLMs over rows at scale, with "trial runs" on a few rows first. [Fact] https://www.palantir.com/docs/foundry/aip/aip-features

## Lingyang, AgentOne and Alibaba

### 2. Bailian (Model Studio) knowledge base and RAG pipeline

> Source: [general-references/08-alibaba-stack.md § 2. Bailian (Model Studio) knowledge base and RAG pipeline](../../general-references/08-alibaba-stack.md#2-bailian-model-studio-knowledge-base-and-rag-pipeline)

**Plain English.** You upload files. Bailian parses, chunks, embeds and indexes them. A "retrieval service" then searches one or more of these knowledge bases with keyword and vector search together, reranks the results and passes the top chunks to the model. Example: a company handbook PDF is split into roughly 600-token pieces. A question about leave policy pulls the 5 best pieces after reranking.

**Knowledge base types.** [Fact] [rag-knowledge-base](https://help.aliyun.com/zh/model-studio/rag-knowledge-base)
- Document search: hybrid vector plus keyword. Three scenarios: basic Q&A; "visual understanding", where documents are not chunked and the LLM reads them directly; and fast Q&A.
- Data query: CSV, Excel and RDS tables, answered via NL2SQL from table and column headers.
- Image Q&A: multimodal embedding.
- Audio/video search: transcription plus segment localization.

**Editions.** Standard ¥0.03/hour on shared compute. Flagship ¥0.2 per RCU-hour. Billing since 4 Jan 2026 is a spec fee plus model-call fees. [Fact] Same page; [release notes](https://help.aliyun.com/document_detail/2679100.html).

**Import limits.** 50 files per upload, 150 MB each. [Fact]

**Parsers.** Default by file type, or choose: standard e-document parsing, document intelligence (layout OCR), LLM parsing, Qwen-VL parsing (image parsing can use qwen-vl-max or qwen-vl-plus with a custom prompt), or audio/video transcription with timestamps. [Fact]

**Chunking.** Modes: smart split (default), by length, by page, by heading, by regex, by symbol. Max chunk length defaults to 600 tokens (range 10–6000). Recommended settings: FAQ 256 tokens by length, manual 600 smart split, long report 2048 smart split, contract 512 by heading. Chunks can be listed, updated and deleted by API. [Fact] [chunking](https://help.aliyun.com/zh/model-studio/rag/chunking). Sources disagree on whether chunking can change later. The chunking page says neither chunking nor vectorization can be changed after creation. The main KB page says the chunking strategy "can be adjusted after creation" and that changing the embedding model triggers a full rebuild. [Fact: conflict between two official pages]

**Embedding and storage.** `qwen3.7-text-embedding` (default) or `text-embedding-v4`. Vectors live in platform storage or in your own AnalyticDB for PostgreSQL (ADB-PG). [Fact] [rag-knowledge-base](https://help.aliyun.com/zh/model-studio/rag-knowledge-base)

**Metadata.** At most 5 fields per KB, names in English letters and underscores only. Value methods: constant, variable (`file_name`, `cat_name`), LLM extraction, regex, keyword match. Two flags per field: "participate in retrieval" and "participate in model reply". Fields must be defined at creation, and values cannot be edited by hand. API filtering passes `metadata_filter` inside `rag_options` alongside `pipeline_ids`. [Fact] Same page. The retrieval-service UI filters only by tag. [Fact] [retrieval](https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval)

**Retrieval pipeline.** Steps: (1) optional query rewrite; (2) vector search and keyword search, each with its own TopK of 1–100; (3) rerank with `qwen3-rerank`, `qwen3-rerank-hybrid`, `qwen3-vl-rerank` or none, in "Q&A" or "similarity" mode (global settings also allow a custom advanced mode); (4) score weighting and return. Max recall is 1–20 both globally and per KB. The per-KB similarity threshold is 0.01–1.0. At most 15 KBs per retrieval service, all in the same workspace, each with a weight. KB routing uses an LLM and costs model calls. Lowering the initial TopKs reduces rerank token cost. [Fact] [retrieval](https://help.aliyun.com/zh/model-studio/rag-knowledge-retrieval); [release notes](https://help.aliyun.com/document_detail/2679100.html). The fusion formula between the keyword and vector lists is not documented. [Unverified]

**Create API.** `POST https://{workspace_id}.cn-beijing.maas.aliyuncs.com/api/v1/indices/rag/index/create_v2` with fields `structureType`, `sinkType`, `sourceType`, `embeddingModelName`, `chunkSize`, `categoryIds`. [Fact]

**Failure modes.** [Inference] The fields that are locked at creation (metadata schema, and per one page the chunking and embedding settings) force a full re-import when the design changes. A product should version index configurations instead.

## Other companies and products

### 3.1 Connectors: what gets crawled

> Source: [general-references/21-glean.md § 3.1 Connectors: what gets crawled](../../general-references/21-glean.md#31-connectors-what-gets-crawled)

Plain English: a connector is a robot that reads one app (say Confluence) and copies five kinds of thing into Glean. For a page called "Q3 pricing" it copies the text, the last-edited date, who wrote it, the list of people and groups who may see it, and who viewed it recently.

Detail ([Fact](https://docs.glean.com/connectors/connectors-power-glean)):
- Content: titles, bodies, comments, attachments. Metadata: modified time, owner, status, app-specific fields (used for ranking, filters and relationships). Identity: people and groups, matched across apps where directory data allows. Permissions: ACLs. Activity: views, edits and shares, where the API provides them.
- Crawl types: full, incremental, activity, identity and people-data crawls, plus deletion handling by webhook and full-crawl clean-up. The crawler is designed to trade freshness against source API limits. Per-connector refresh rates and limits sit on sub-pages I could not open ([Fact](https://docs.glean.com/connectors/crawling-frequency), updated 29 Sep 2026).
- Freshness: changes arrive "as quickly as the source and connector allow", via webhooks or incremental crawls ([Fact](https://docs.glean.com/connectors/about)).
- Failure mode Glean names itself: enforcement is only as good as the connector configuration. Admins should test search as restricted users before enabling Chat or Agents ([Fact](https://docs.glean.com/connectors/connectors-power-glean)).

### 3.2 Permission mirroring

> Source: [general-references/21-glean.md § 3.2 Permission mirroring](../../general-references/21-glean.md#32-permission-mirroring)

- **Document ACL model** ([Fact](https://developers.glean.com/libraries/indexing-sdk/permissions)): `allowed_users` (email or source user ID), `allowed_groups`, and `allowed_group_intersections`. The last is a list of `required_groups` sets: a user qualifies by being in every group of any one set (for example "Finance" AND "Malaysia").
- **Identity model:** `get_identities()` returns users, groups and memberships. Returning groups without memberships raises `InconsistentDataError`. If source and Glean share an IdP, set `is_user_referenced_by_email=True`. Otherwise push a user record mapping each source ID to a person.
- **Ordering:** the identity crawl runs before content, so ACLs never reference unknown principals. Streaming connectors must push identities separately.
- **Testing:** the SDK supports negative tests (`negative_test_identities`, `assert_negative_identities_absent()`). The harness rejects `allow_anonymous_access` and `allow_all_datasource_users_access`, because these make it impossible to prove denial.
- **Enforcement points:** filtering on search, chat retrieval and agent reads. The same filter applies to live and hybrid fetches. The source app checks again at click time. Everything stays inside a single-tenant environment ([Fact](https://docs.glean.com/connectors/connectors-power-glean)). Earlier research found Glean enforces permissions inside the retrieval path, not as a filter on generated answers ([Vendor claim](https://www.glean.com/blog/from-enterprise-search-to-enterprise-context-what-ai-agents-actually-need), in file 12).
- **Deliberate override:** knowledge profiles (key finding 4). Profiles exclude email and calendar, and admins can scope down to Slack workspaces, GitHub repos, Drive directory groups and similar ([Fact](https://docs.glean.com/administration/managing-agents/knowledge-profiles)).

### 3.3 Enterprise Graph and personal graph

> Source: [general-references/21-glean.md § 3.3 Enterprise Graph and personal graph](../../general-references/21-glean.md#33-enterprise-graph-and-personal-graph)

Plain English: Glean notices that "Project Falcon" shows up in many document titles, Jira epics and Slack channels. It makes "Project Falcon" a node and links it to the people who edit those items. It can then answer "who leads Falcon?" by walking links rather than guessing from text.

Detail ([Vendor claim](https://glean.com/blog/knowledge-graph-agentic-engine), 27 Jun 2025):
- Facts are stored as triples (subject, predicate, object), for example engineer → owns → Jira ticket. Example entities: people, documents, tools, projects, systems, customers, tickets, roles, locations, product versions, OKRs. Predicates: authored-by, led-by, reports-to, references, owns.
- Each edge carries metadata: timestamps, ACL, confidence score and provenance (calendar, directory or email).
- Construction: automatic NLP noun-phrase extraction with no human review of private data, filtered by frequency and heuristics. Prominence comes from titles, link counts and share or access counts. A predicate is kept only on strong, repeatable evidence. LLMs now do entity annotation and intent recognition. A real-time crawler feeds both search and graph. The graph is built inside each customer's single-tenant environment ([Vendor claim](https://www.glean.com/enterprise-context/enterprise-graph)).
- Use: user intent → structured query → graph traversal for deterministic lookups (for example "all account executives in Asia") and multi-hop questions. Context-based disambiguation ("Reddit" the customer versus the platform).
- Personal graph: atomic actions (created doc, attended meeting, ran internal tool) are clustered into subtasks, tasks and themes, and mapped to OKRs. Collaboration edges come from comments and shared Slack channels. A source-agnostic schema with a chronological store reconciles what "comment" means in Jira versus Google Docs. Glean admits that work done off-screen is invisible and some intent needs explicit labels.
- Not published: the storage engine, the full schema, edge scoring and how planning uses the graph. The docs have a security page for the knowledge graph that I could not open ([Fact, title](https://docs.glean.com/security)).

### R7. Onyx (open source, formerly Danswer)

> Source: [general-references/21-glean.md § R7. Onyx (open source, formerly Danswer)](../../general-references/21-glean.md#r7-onyx-open-source-formerly-danswer)

1. **In one paragraph.** A self-hostable "context layer" with 50+ connectors, chat, agents, deep research, a sandbox, an MCP server, a Slack bot and a Chrome extension. The core is MIT-licensed; `ee/` directories (permission sync among them) are under the Onyx Enterprise License ([Fact, code](https://github.com/onyx-dot-app/onyx), commit 6425e7d, 20 Nov 2026).
2. **Functions.** Listed in the README: deep research, custom agents, web search, MCP actions, secure sandbox, artifacts, voice; any LLM including local ones; standard and lite deployments on Docker, Kubernetes or Helm ([Fact, code](https://github.com/onyx-dot-app/onyx)).
3. **Underneath (read in code).**
   - **ACL representation:** `ExternalAccess` = `external_user_emails` + `external_user_group_ids` + `is_public`, with a soft cap of 5,000 entries. If permissions cannot be determined, the fallback is `empty()` (private) (`backend/onyx/access/models.py`).
   - **Index-side ACL:** strings prefixed `user_email:`, `group:` and `external_group:`, with external groups namespaced by source (`slack_finance`) to avoid collisions. Retrieval filters carry `access_control_list` as a frozenset (`backend/onyx/access/utils.py`, `document_index/interfaces.py`).
   - **Sync jobs per source:** separate doc-permission sync and group sync with their own frequencies. Defaults: 5 minutes (Slack, GitHub, Teams, Google Drive groups) and 30 minutes (Confluence, Jira) (`ee/onyx/configs/app_configs.py`). Doc syncs can be checkpointed and resumed after a timeout (`perm_sync_types.py`).
   - **Query-time censoring:** for Salesforce, Onyx asks Salesforce at query time which record IDs the user can see (a `UserRecordAccess` query). The user-ID lookup is cached for 1 hour. The code comment says the uncached access query takes about 0.1 to 0.2 seconds (`ee/onyx/external_permissions/salesforce/`). Documents with unknown access are censored, not passed through (`post_query_censoring.py`).
   - **Federated connectors** (live search, Slack first) sit beside indexed ones (`backend/onyx/federated_connectors/`).
   - Hybrid search weighting `HYBRID_ALPHA` defaults to 0.5 (`configs/chat_configs.py`).
4. **Commercials.** Not read this round [Unverified].
5. **Why chosen.** Self-hosting, data sovereignty, cost.
6. **Deploys.** One-line install script; Docker or Kubernetes ([Fact, code](https://github.com/onyx-dot-app/onyx)).
7. **Copy.** (a) Fail closed: unknown ACL means private. (b) Re-check CRM and ERP record access live at query time rather than mirroring complex sharing rules. (c) Namespace group IDs by source. Source: https://github.com/onyx-dot-app/onyx
8. **Weak.** Enterprise permission sync is not MIT-licensed; you must reimplement it.
9. **Relationship.** Teacher and possible component (MIT parts only).

## Research literature

### 4. Retrieval over text

> Source: [general-references/09-papers-knowledge-layer.md § 4. Retrieval over text](../../general-references/09-papers-knowledge-layer.md#4-retrieval-over-text)

**RAG (Lewis et al. 2020).** "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks", arXiv:2005.11401 (v4, Apr 2021) ([abs](https://arxiv.org/abs/2005.11401)). [Fact] A pre-trained seq2seq generator (parametric memory) is paired with a dense vector index of Wikipedia (non-parametric memory) accessed through a neural retriever. Two variants: the same passages for the whole output, or different passages per token. State of the art on three open-domain QA tasks at the time. The abstract page does not name DPR or BART, the NeurIPS 2020 venue, or the exact-match scores; I recall all three but did not confirm them on a page [Unverified]. Builder lesson: the base pattern; everything below refines it.

**Dense, sparse and hybrid retrieval; reranking.** BEIR: Thakur et al., arXiv:2104.08663, NeurIPS 2021 Datasets & Benchmarks ([abs](https://arxiv.org/abs/2104.08663)). [Fact] 18 datasets, 10 systems. BM25 is a robust zero-shot baseline; dense retrievers often generalise worse out of domain; rerankers and late-interaction models score best but cost the most compute. Anthropic's Contextual Retrieval post (19 Sep 2024) ([post](https://www.anthropic.com/news/contextual-retrieval)) gives the most implementable recipe found:
- For each chunk, prompt a cheap model (Claude 3 Haiku) with the *whole document* plus the chunk, asking for a 50–100-token situating context.
- Prepend that context to the chunk, then build both the embedding index and a BM25 index.
- Retrieve the top 150, rerank, and keep the top 20.
Failure rate (top-20 recall miss): 5.7% baseline, 3.7% with contextual embeddings, 2.9% with contextual BM25 added, 1.9% with reranking. Cost about $1.02 per million document tokens with prompt caching (assuming 800-token chunks and 8k-token documents). [Vendor claim, since Anthropic sells the model used] Below 200k tokens, put the whole knowledge base in the prompt.

**Chunking.**
- Qu, Tu, Bao, "Is Semantic Chunking Worth the Computational Cost?", arXiv:2410.13070 (Oct 2024) ([abs](https://arxiv.org/abs/2410.13070)). [Fact] Across document retrieval, evidence retrieval and answer generation, semantic chunking's cost "not justified by consistent performance gains" over fixed-size chunks.
- Jimeno Yepes et al., "Financial Report Chunking for Effective RAG", arXiv:2402.05131 (Feb 2024) ([abs](https://arxiv.org/abs/2402.05131)). [Fact] Chunks by structural element (title, table, list item) detected by document-understanding models, removing the need to tune chunk size; improves RAG on financial reports. The headline numbers are in the full PDF, which I did not open [Unverified numbers].
- Late chunking: Günther et al. (Jina AI), arXiv:2409.04701 (v3, Jul 2025) ([abs](https://arxiv.org/abs/2409.04701)). [Fact] Embed the whole long document with a long-context embedding model, then mean-pool token embeddings per chunk span *after* the transformer, so each chunk vector carries document context. No training needed. The abstract gives no figures.
Builder lesson: [Inference] use structural chunks (sections, table blocks) plus contextual prefixes. Late chunking is an alternative to LLM-written prefixes when the embedding model supports long inputs and LLM cost matters.

**Late interaction (ColBERT).** Khattab & Zaharia, arXiv:2004.12832 (2020) ([abs](https://arxiv.org/abs/2004.12832)). [Fact] Query and document are encoded independently into per-token vectors; a cheap interaction step scores them; document vectors are precomputed. About 100× faster and about 10,000× fewer FLOPs per query than BERT cross-encoder rerankers, at competitive quality. ColBERTv2, arXiv:2112.01488 ([abs](https://arxiv.org/abs/2112.01488)), adds residual compression that shrinks the index 6–10×. The scoring operator (MaxSim: for each query token, take the maximum similarity over document tokens, then sum) is from my knowledge of the paper, not the abstract [Unverified on page]. Builder lesson: [Inference] a reranker on top of hybrid retrieval gets most of the benefit with less infrastructure. Consider late interaction only when reranking latency becomes the bottleneck.

**RAPTOR.** Sarthi et al. (Stanford), arXiv:2401.18059 (Jan 2024) ([HTML](https://arxiv.org/html/2401.18059)). Method [Fact]:
- Split into 100-token chunks (sentences kept whole) and embed with SBERT multi-qa-mpnet.
- Soft-cluster with a Gaussian mixture model after UMAP; choose the number of clusters by BIC; cluster globally, then locally; re-cluster clusters that are too large.
- Summarise each cluster with gpt-3.5-turbo and repeat up the tree.
- Query a "collapsed tree" (all layers at once) with a 2,000-token budget. This beat tree traversal.
Results: QuALITY 82.6% with GPT-4 (prior best 62.3%); QASPER F1 55.7; about 4% of summary nodes had minor hallucinations; build cost grew linearly with document length. Limits: summaries are lossy and the GMM assumption fits text poorly. In HippoRAG 2's comparison RAPTOR trailed dense retrieval on average (48.8 against 57.0 F1) ([2502.14802](https://arxiv.org/html/2502.14802)). Builder lesson: [Inference] useful for long single documents (a 200-page contract, a policy manual) when broad "what does this say about X" questions are expected. Not a default.

**Self-RAG.** Asai et al., arXiv:2310.11511 (Oct 2023) ([HTML](https://arxiv.org/html/2310.11511)). [Fact] The model emits reflection tokens: Retrieve (yes/no/continue), IsRel, IsSup (fully, partially, or no support) and IsUse (1–5). A critic (Llama 2-7B) is trained on 4k–20k GPT-4-labelled examples per token type, with over 90% agreement with GPT-4. Inference uses segment-level beam search scored by a weighted sum of token probabilities. *It requires training the generator*, so it cannot be used with closed third-party models. Builder lesson: [Inference] copy the *checks*, not the training. After generation, ask the model (or a cheaper one) whether each claim is fully supported by a cited passage, and block unsupported claims.

**Corrective RAG (CRAG).** Yan et al., arXiv:2401.15884 (v3 Oct 2024) ([HTML](https://arxiv.org/html/2401.15884)). Method [Fact]:
- A fine-tuned T5-large evaluator (0.77B parameters) scores each of about 10 retrieved documents from −1 to 1.
- Per-dataset thresholds decide the action: Correct if any document exceeds the upper threshold, Incorrect if all fall below the lower one, Ambiguous otherwise. Example: PopQA uses (0.59, −0.99).
- Correct: split documents into strips, score each strip, and keep the top 5 above −0.5.
- Incorrect: rewrite the question into at most 3 keywords and run a web search (top 5 URLs).
- Ambiguous: combine both.
Gains over standard RAG with SelfRAG-LLaMA2-7b: PopQA +7.0, Biography FactScore +14.9, PubHealth +36.6, Arc +15.4. Limit: needs a separately trained evaluator. Builder lesson: [Inference] build a *retrieval sufficiency gate*. An LLM judges whether the retrieved evidence is sufficient; if not, widen the search (other sources, structured lookup) or say "I don't know" rather than answering from weak context. In a company setting, "web search" becomes "query another internal source".

**Long context against retrieval.**
- Li et al., "Retrieval Augmented Generation or Long-Context LLMs? A Comprehensive Study and Hybrid Approach", arXiv:2407.16833, EMNLP 2024 industry track ([HTML](https://arxiv.org/html/2407.16833)). [Fact] Average scores, long context against RAG: Gemini-1.5-Pro 49.7 against 37.3; GPT-4o 48.7 against 32.6. Self-Route (RAG first; the model may answer "unanswerable", in which case retry with full context) scored 46.4 and 48.9. About 23–43% of queries were routed to long context; cost fell 65% (Gemini) and 39% (GPT-4o). RAG failure classes: multi-step queries, vague general queries, long complex queries, and implicit whole-text queries.
- Lee et al. (Google DeepMind), "Can Long-Context Language Models Subsume Retrieval, RAG, SQL, and More?" (LOFT), arXiv:2406.13121 ([abs](https://arxiv.org/abs/2406.13121)). [Fact] Long-context models rival retrieval and RAG systems but *struggle with SQL-like compositional reasoning*.
- Liu et al., "Lost in the Middle", arXiv:2307.03172, TACL 2023 ([abs](https://arxiv.org/abs/2307.03172)). [Fact] Accuracy is highest when the relevant information sits at the start or end of the context and falls when it is in the middle.
- LaRA, arXiv:2502.09977 (Feb 2025) ([abs](https://arxiv.org/abs/2502.09977)). [Fact] 2,326 cases, 11 models; the better choice depends on model size, context length, task type and chunk characteristics.
Builder lesson: [Inference] for one customer's policy handbook (often under 200k tokens), long context with caching is simpler and better. Aggregations over records should never go to long context; they go to the query engine (LOFT).

## Design decisions already in the reference maps

### 7. Answering from documents: chunking with context, hybrid search, reranking

> Source: [general-references/32-map-research-and-cost.md § 7. Answering from documents: chunking with context, hybrid search, reranking](../../general-references/32-map-research-and-cost.md#7-answering-from-documents-chunking-with-context-hybrid-search-reranking)

**Purpose.** Answer questions whose answer sits in text, citing the source. Example: "What are ACME's contractual payment terms and late-fee clause?" → retrieve the clause from the signed contract and cite page and section.

**Design to implement (defaults).**
1. *Scope check first*: if the scoped document set (for example one customer's contracts plus the credit policy) is under about 200k tokens, put it all in a cached prompt instead of retrieving.
2. *Chunking*: structural elements (title, section, table, list item) from the layout parser. Fixed-size fallback is about 800 tokens. No semantic chunking.
3. *Contextual prefix*: for each chunk, a cheap model reads the whole document plus the chunk and writes a 50–100-token situating context. Cache the document prefix while doing this. Prepend the context to the chunk before indexing.
4. *Hybrid index*: BM25 (Postgres full-text) plus dense vectors (pgvector) over the contextualised chunks. Retrieve the top 150, rerank, keep the top 20.
5. *Mutual indexing*: each chunk stores the object IDs it mentions; each object lists its supporting chunks.
6. *Sufficiency gate*: a model judges the evidence correct, ambiguous or incorrect.
   - Ambiguous or incorrect: widen the search to other internal sources or a structured lookup.
   - Still insufficient: abstain.
7. *Self-Route*: RAG first, with "unanswerable" allowed; if returned, retry with the full scoped context.
8. *Claim-support check* after generation: each claim must be fully supported by a cited chunk. Strip or flag unsupported claims.
9. Put the most relevant chunks at the start or end of the context, not the middle.

**Evidence.**
- Contextual Retrieval (Anthropic, 19 Sep 2024) [Vendor claim]: top-20 retrieval failure fell 5.7% → 3.7% (contextual embeddings) → 2.9% (+ contextual BM25) → 1.9% (+ reranking), a 67% reduction. One-off cost about $1.02 per million document tokens with caching.
- Semantic chunking's cost was "not justified by consistent performance gains" (arXiv 2410.13070).
- Self-Route matched long-context quality at 39–65% lower cost (arXiv 2407.16833).
- CRAG gains over standard RAG: PopQA +7.0, PubHealth +36.6 (arXiv 2401.15884).
- Lost in the Middle (arXiv 2307.03172).
- BEIR: BM25 is a robust zero-shot baseline (arXiv 2104.08663). All from document 09, section 4.

**Copies.** Document 09, "What to copy" items 11, 12, 13, 15. https://www.anthropic.com/news/contextual-retrieval ; https://arxiv.org/abs/2402.05131 ; https://arxiv.org/html/2407.16833 ; https://arxiv.org/html/2401.15884 ; https://arxiv.org/html/2310.11511 ; https://arxiv.org/abs/2409.13731

**Left out.**
- RAPTOR: it trailed dense retrieval at 48.8 against 57.0 F1 in HippoRAG 2's tests.
- Self-RAG training and CRAG's trained evaluator: copy the checks, not the models.
- ColBERT infrastructure: only if reranking latency becomes the bottleneck.
- Late chunking: an alternative to model-written prefixes, but no figures are given.

**Open questions.**
- Financial Report Chunking's numbers were not opened.
- No document names a specific reranker model or its price.

### 1. Permission-mirroring connectors and the enterprise graph

> Source: [general-references/34-map-agent-companies.md § 1. Permission-mirroring connectors and the enterprise graph](../../general-references/34-map-agent-companies.md#1-permission-mirroring-connectors-and-the-enterprise-graph)

**Purpose.** Pull records and their access rules from the customer's systems so every agent sees only what the person (or the agent's own role) may see, and so facts are linked into a graph the agent can walk. Example: a credit controller in the Malaysia team asks "which of my debtors are over 60 days?" and gets only debtors the ledger lets her see; the external reminder agent sees only the one debtor it is writing to.

**Design to implement.**
- **Principals table loaded before records.** Tables `principal_user(id, tenant_id, email, source_ids jsonb)`, `principal_group(id, tenant_id, source, source_group_id)`, `group_membership(group_id, user_id)`. Group IDs are namespaced by source (`xero:finance`, `slack:finance`) so groups from two systems never collide. A sync that returns a group without memberships is rejected as inconsistent. Identity sync runs before content sync on every cycle, so no record ACL can reference an unknown principal.
- **ACL on every record, groups kept as groups.** Column `acl jsonb` with three forms: `allowed_users[]`, `allowed_groups[]`, `allowed_group_intersections[]` (each entry a set of groups; the user must belong to every group in one set, e.g. Finance AND Malaysia). Never flatten groups to user lists. Enforce with a PostgreSQL RLS policy that evaluates the current principal (set per transaction via `set_config('app.principal', ...)`) against `acl`. [Inference: RLS as the enforcement point; the ACL shape is copied.]
- **Fail closed.** If a connector cannot determine a record's access, store `acl = {}` (private to nobody but system service roles). Never default to "all users". Test harnesses refuse `allow_anonymous` and `allow_all_users` shortcuts.
- **Access mode per source.** Each connector declares `mode: indexed | live | hybrid`. Ledger, CRM and payment records are `indexed` (synced into Postgres). Mailboxes and chat are `live` (fetched at request time with the user's own credential). Hybrid merges both through the same permission filter. A fourth path, `tool`, exists for actions and makes nothing searchable.
- **Query-time re-check for complex sharing.** Where the source has rules too complex to mirror (CRM sharing rules), store a coarse ACL and, before returning content to the model, ask the source which record IDs the user can access; cache the user-ID lookup for 1 hour (Onyx's figure). Records with unknown access are dropped.
- **Two enforcement points.** Filter in the query (RLS), then re-check each item against the stored policy immediately before content goes into a model prompt, because indexes and caches may lag. Unauthorised items behave as if they do not exist. No admin bypass for agent reads. Derived artifacts (a generated aging report, a conversation) inherit the union of scopes of every source they used and keep them even after a source is detached.
- **Per-user credentials on tool calls.** Every connector call made on behalf of a staff member uses that person's credential so the source's own ACLs apply. Resolve the effective tool set once per turn: advertised ∩ reviewed by us ∩ tenant admin setting ∩ user setting ∩ user selection. Single-use refresh tokens are written back with a conditional update (compare-and-swap on the old token) instead of a lock.
- **Two retrieval identities.** Internal agents act "as the user". External, customer-facing agents read through a **knowledge profile**: an admin-defined bounded corpus (approved templates, policies, plus the one debtor's account records), the same for every viewer, which overrides any staff member's view. Profiles exclude staff email and calendar.
- **Agent as its own principal** for scheduled work (the nightly reminder run): `agent_principal(id, owner_user_id, service_credentials per system, scopes)`. Each run logs the triggering event or user. Write tools stay behind human approval until promoted. A pause/unpublish switch exists per agent.
- **Typed, authored graph with provenance.** Objects and links are declared in the company model (Debtor → Invoice → Payment; Debtor → Contact; Debtor → Account owner). Every edge row carries `source_system, source_record_id, observed_at, confidence, acl`. Facts carry effective dates and versions; amendments add a new version rather than overwrite. Every read tool returns record IDs so a later action operates on the same invoice. Entity resolution must refuse to merge look-alikes (two "ABC Trading Sdn Bhd" entities with different registration numbers stay separate). [Inference: the authored rather than inferred graph is the founder's thesis; edge metadata is copied from Glean, versioned facts from Hebbia.]
- **Sync jobs.** Separate permission-sync and group-sync jobs per source, each with its own schedule (Onyx defaults: 5 minutes for chat and Drive groups, 30 minutes for wiki and ticket tools), checkpointed and resumable after timeout. Failures keep the last known policy. Users are matched by email; an unmatched person on an inclusionary rule stays excluded.
- **Negative permission tests as a release gate.** For every connector and agent, a fixture identity that must not see a named record; the test asserts absence.

**Copies.**
- doc 21, §3.2 Permission mirroring: three ACL forms, identity-before-content, `InconsistentDataError`, negative tests and refusal of public shortcuts. https://developers.glean.com/libraries/indexing-sdk/permissions
- doc 21, §3.1 Connectors and key finding 3: five data types per connector; indexed/live/hybrid modes; tools path makes nothing searchable; "test search as restricted users before enabling agents". https://docs.glean.com/connectors/connectors-power-glean ; https://docs.glean.com/connectors/about
- doc 21, key finding 4 and §7 item 4: knowledge profiles for external agents. https://docs.glean.com/administration/managing-agents/knowledge-profiles
- doc 21, key finding 5: independent agents as principals with service credentials and approval on writes. https://docs.glean.com/agents/independent-agents
- doc 21, R7 Onyx: fail-closed `ExternalAccess.empty()`, source-namespaced group IDs, sync intervals, Salesforce query-time censoring with 1-hour cache. https://github.com/onyx-dot-app/onyx
- doc 21, §3.3: provenance, confidence, ACL and timestamps on each edge. https://glean.com/blog/knowledge-graph-agentic-engine
- doc 12, Harvey ethical walls: filter before ranking then re-check before model; derived artifacts inherit scopes; nonexistent-looking denials; no admin bypass; immutable content-hashed membership sets; last-known-policy on sync failure; email matching. https://www.harvey.ai/blog/building-ethical-wall-enforcement-into-harvey
- doc 12, Harvey connectors: per-user credentials, tool-set intersection, once-per-turn resolution, conditional write-backs. https://www.harvey.ai/blog/how-we-built-harvey-connector-library
- doc 12, Hebbia: versioned facts with effective dates, alias resolution that refuses look-alike merges, "say when access limits an answer". https://www.hebbia.com/blog/building-a-knowledge-graph-for-financial-institutions
- doc 20, §6 ServiceNow: return record IDs (`sysId`) from every read. https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html

**Left out, and why.** Glean's inferred, activity-based personal graph and corpus-wide NLP entity extraction (doc 21 calls them overkill at this size; the objects are known up front). 275 connectors (a collections product needs about 5 to 10 sources, doc 21 §8). Customer-hosted single-tenant deployments and Protect+ continuous scanning (doc 21 "Overkill"). Harvey's search index on Turbopuffer/LanceDB (stack decision is Postgres; see Contradictions).

**Open questions.** Which accounting systems the first customers use (Xero is "common among Malaysian SMEs" only as [Unverified] in doc 20). How live-mode credentials are granted for shared finance mailboxes (doc 21 covers per-user mail, not shared inboxes). Whether RLS performance holds with group-intersection checks at the record counts expected [Inference].

## Earlier engineering notes (Phase 2)

### Three kinds of representation

> Source: former `04-knowledge-engine/knowledge-graph-and-retrieval.md` (moved here in the Nov 2026 restructure)

1. **Operational objects:** validated business records with explicit ownership and lifecycle.
2. **Evidence/knowledge facts:** extracted from documents, conversations, events or external sources, with provenance, confidence and time validity.
3. **Retrieval projections:** lexical/vector/graph indexes for efficient recall; all items link back to source records/chunks and policy context.

These should connect but not be conflated. A model-extracted statement such as “the customer accepted the variation” should remain a sourced, reviewable fact until a domain policy determines that it can update the canonical contract/matter state.

### Retrieval planner

> Source: former `04-knowledge-engine/knowledge-graph-and-retrieval.md` (moved here in the Nov 2026 restructure)

A hybrid planner can combine:
- lexical/BM25 for exact names, clauses, references and identifiers;
- vector similarity for semantic phrasing;
- graph traversal for connected entities and multi-hop context;
- object-set query for authoritative business state;
- source-live retrieval when the index is stale or freshness is required;
- reranking and evidence aggregation.

Retrieval must filter by tenant and authorization before ranking, then recheck permissions when opening the source or using the evidence in a tool/action. A relevant chunk the user cannot access must not be disclosed through an agent summary.

### Evaluation

> Source: former `04-knowledge-engine/knowledge-graph-and-retrieval.md` (moved here in the Nov 2026 restructure)

Measure recall and precision by question class, retrieval latency, source ACL violations, stale index rate, citation correctness, entity linking accuracy, temporal query correctness and answer grounding. Evaluate multi-hop answers against known source records and graph paths. Maintain adversarial tests for prompt injection hidden in documents.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No open-source implementations material in the research yet.
