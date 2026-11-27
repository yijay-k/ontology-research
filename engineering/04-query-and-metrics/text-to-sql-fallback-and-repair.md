# Text to sql fallback and repair

**Layer:** [04-query-and-metrics](README.md) · **What it is:** When no governed metric fits: generated queries as untrusted proposals that are checked and repaired against the ontology.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Open-source implementations](#open-source-implementations) (1) · [Other companies and products](#other-companies-and-products) (1) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Open-source implementations

### 13. LLM-generated plans/code are untrusted proposals

> Source: [open-source-references/cross-repo-patterns.md](../../open-source-references/cross-repo-patterns.md#13-llm-generated-planscode-are-untrusted-proposals)

KAG's planner passes available executor descriptions to an LLM and parses structured plans. Its Python math executor writes LLM-generated code to a temporary file and launches a subprocess with a default five-second timeout. That does not establish a hardened sandbox. UModel's write tools disabled by default and OSDK's validate-only action path show more conservative alternatives for agent-facing mutation.

**Design implication:** agent tools should be capability-scoped; validate typed args; enforce server-side policy; require human approval for high-impact actions; prohibit arbitrary code execution in application workers. A timeout is not a sandbox.

## Other companies and products

### 7. OpenAI Frontier and OpenAI's in-house data agent

> Source: [general-references/11-context-layer-products.md § 7. OpenAI Frontier and OpenAI's in-house data agent](../../general-references/11-context-layer-products.md#7-openai-frontier-and-openais-in-house-data-agent)

**Frontier** (5 Feb 2026). Four pillars: Business Context (connects warehouses, CRM, ticketing and internal apps into "a semantic layer for the enterprise"), Agent Execution (files, code, tools; local, customer cloud or OpenAI-hosted; agents build memories), Identity and Permissions (each AI coworker has its own identity and explicit permissions), and Evaluation and Optimization. Availability was limited at launch, with named adopters HP, Intuit, Oracle, State Farm, Thermo Fisher and Uber ([Vendor claim](https://openai.com/index/introducing-openai-frontier)). The product page adds observability logs and a SOC 2 / ISO compliance list, but no schema, pricing or connector specifics ([Vendor claim](https://openai.com/business/frontier/)). I found no public data-model documentation for Business Context. [Unverified]

**In-house data agent** (29 Jan 2026; authors Bonnie Xu, Aravind Suresh, Emma Tang) ([Fact](https://openai.com/index/inside-our-in-house-data-agent/)):
- Scale: 3.5k users, 600 PB, about 70k datasets. Model GPT-5.2.
- Entry points: Slack, web, IDE, Codex CLI through MCP, and the ChatGPT app.
- Six context layers:
  1. *Table usage*: schema, lineage, historical queries showing common joins.
  2. *Human annotations*: expert descriptions and caveats.
  3. *Codex enrichment*: Codex crawls the pipeline code to learn derivation, uniqueness, update frequency and scope, which separates look-alike tables. It refreshes automatically.
  4. *Institutional knowledge*: Slack, Docs and Notion, embedded with metadata and permissions. A retrieval service enforces ACLs at runtime.
  5. *Memory*: corrections and non-obvious filters. The agent prompts the user to save them; users can create, edit and delete them; scope is global or personal.
  6. *Runtime context*: live warehouse queries, the metadata service, Airflow and Spark.
- A daily offline pipeline normalises layers 1 to 3 into embeddings for retrieval.
- Evaluations run on the Evals API with golden SQL. Both SQL and result data are compared, tolerating syntax differences and immaterial extra columns. They run as unit tests and as production canaries.
- Permissions are strictly pass-through. The agent flags missing access or falls back to tables the user can read. Every answer summarises its assumptions and links to the results.
- Lessons: consolidate tools; guide the goal, not the path; meaning lives in code.

**Copy:** the six-layer context stack, user-confirmed memory with global or personal scope, and golden-result evaluations as production canaries. **Avoid:** relying on a warehouse with dense query history, which small companies do not have.

## Research literature

### 6. Question answering over structured data (text-to-SQL, semantic layers, text-to-Cypher/SPARQL)

> Source: [general-references/09-papers-knowledge-layer.md § 6. Question answering over structured data (text-to-SQL, semantic layers, text-to-Cypher/SPARQL)](../../general-references/09-papers-knowledge-layer.md#6-question-answering-over-structured-data-text-to-sql-semantic-layers-text-to-cyphersparql)

**Spider (2018).** Yu et al., arXiv:1809.08887 ([abs](https://arxiv.org/abs/1809.08887)). [Fact] 10,181 questions, 5,693 SQL queries, 200 databases, 138 domains. Train and test databases are disjoint, testing generalisation to unseen schemas. The best baseline then had 12.4% exact match. Now saturated: 91.2% for o1-preview per Spider 2.0.

**BIRD (2023).** Li et al., arXiv:2305.03111 ([abs](https://arxiv.org/abs/2305.03111)). [Fact] 12,751 question–SQL pairs, 95 databases totalling 33.4 GB, 37 domains; adds "external knowledge" evidence and dirty values. ChatGPT scored 40.08% execution accuracy against 92.96% for humans. Leaderboard as of November 2026: AskData (AT&T) 83.40, Agentar-Scale-SQL (Ant Group, Sep 2025) 81.67. New variants include BIRD-Interact (ICLR 2026 oral, conversational and agentic), LiveSQLBench-Large (480 tasks, about 54 tables per database) and BIRD-Critic ([leaderboard](https://bird-bench.github.io/)).

**Spider 2.0 (2024/2025).** Lei et al., arXiv:2411.07763, ICLR 2025 Oral ([abs](https://arxiv.org/abs/2411.07763)). [Fact] 632 real enterprise workflow tasks on BigQuery, Snowflake and local databases, many with over 1,000 columns; o1-preview agent 21.3%. Leaderboard as of November 2026 ([site](https://spider2-sql.github.io/)): Snow 96.70 (Genloop Sentinel Agent v2 Pro), Lite 76.23, DBT 65.6. Entries carry no dates. [Inference] The near-saturation of Spider 2.0-Snow by heavily engineered agents shows the ceiling is reachable with scaffolding. Lite and DBT show that multi-dialect work and transformation pipelines remain hard.

**Sequeda, Allemang, Jacob 2023: the knowledge-graph benchmark.** arXiv:2311.07509 ([HTML](https://arxiv.org/html/2311.07509)). [Fact]
- Data: 43 questions on a 13-table subset of the OMG Property & Casualty insurance model (199 tables in full).
- Quadrants by question complexity (reporting against KPI/metrics) and schema complexity (4 or fewer denormalised tables against more than 4 normalised).
- Setup: GPT-4 zero-shot, temperature 0.3. The SQL prompt gets the DDL; the SPARQL prompt gets the OWL ontology, with data accessed virtually through 1-to-1 R2RML mappings.
- Scoring: Spider-style execution accuracy averaged over runs (AOEA).
- Results: overall 16.7% (SQL) against 54.2% (KG). Low/low quadrant 25.5 against 71.1; high-schema quadrants 0% against 35.7–38.5%.
- Limits: small manual data, no date filters, GPT-4 only, authors employed by data.world.
Follow-up: Allemang & Sequeda, "Increasing the LLM Accuracy for Question Answering: Ontologies to the Rescue!", arXiv:2405.11706 (May 2024) ([abs](https://arxiv.org/abs/2405.11706)). [Fact] **OBQC** checks the generated SPARQL against ontology semantics (for example, does a property's domain and range fit how the query uses it) and produces error explanations; **LLM repair** regenerates the query from them. Accuracy 72%, plus 8% "I don't know", error 20%.
Independent rerun: dbt Labs 2026 ([blog](https://docs.getdbt.com/blog/semantic-layer-vs-text-to-sql-2026)). [Vendor claim]
- Setup: ACME insurance, 15 tables, 11 questions × 20 runs.
- Raw schema: text-to-SQL 32.7% (GPT-4, 2023) rose to 64.5% (2026 models); Semantic Layer 60.5% to 72.7%.
- Modelled data: Semantic Layer 98.2–100%, text-to-SQL 84.1–90.0%.
- Within scope, the Semantic Layer hit 100%. Questions needing too many entity hops for MetricFlow were unanswerable until modelling was added.
- Sonnet 4.6 beat Opus 4.6 here; higher reasoning effort mostly added latency.
- Caveat: the full schema was in context, which is unrealistic at scale.

**Semantic-layer document study (2026).** Rumiantsau & Fokeev, arXiv:2604.25149 (Apr 2026) ([abs](https://arxiv.org/abs/2604.25149)). [Fact] 100 questions over Contoso Retail in ClickHouse; Claude Opus 4.7, Sonnet 4.6 and GPT-5.4. Schema only: 45.5–50.5%. Schema plus a 4 KB markdown file of measures, conventions and disambiguation rules: 67.7–68.7%. Every model gained 17–23 points (p < 0.01), and models did not differ significantly within each condition. Authors' reading: business semantics change *what the model is asked to do*. Builder lesson: [Inference] even before a full semantic layer exists, a short curated "metric and conventions card" in context is worth about 20 points.

**Industrial reports (2025–2026).**
- LinkedIn SQL Bot: Chen et al., "Text-to-SQL for Enterprise Data Analytics", arXiv:2507.14372, KDD 2025 workshop ([HTML](https://arxiv.org/html/2507.14372v1)). [Fact]
  - Knowledge graph built from DataHub metadata, 3 months of query logs (ICA soft-clustering of user-table access; Trino EXPLAIN plans give table popularity and common joins), example queries from code and wikis filtered by recency, execution count and certification, plus user-taught domain knowledge.
  - Query Writer: retrieve, rank, write, fix. A Researcher agent hunts for missing tables; queries are validated with EXPLAIN; an intent classifier routes between agents.
  - Results on 133 internal questions: 53% rated 4–5 and 77% rated at least 3; table recall 78%, column recall 56%; compile success 96%. Schema-only baseline: 9% rated 4 or higher.
  - Filter-value errors were the top failure (24%). Over 300 weekly active users.
- Snowflake Cortex Analyst, "Agentic Semantic Model Improvement" ([engineering blog](https://www.snowflake.com/en/engineering-blog/agentic-semantic-model-text-to-sql)). [Vendor claim] Agents (creation, relationships, editor, custom instructions, evaluator) refine the YAML semantic model against BIRD question–SQL pairs. On four BIRD databases, average accuracy rose from 57% (vanilla Claude 3.5 Sonnet) to 78%. The page shows no date. Snowflake's separate BI-accuracy post would not load (client error) [Not opened].

**Text-to-Cypher and SPARQL.**
- Ozsoy et al. (Neo4j), "Text2Cypher: Bridging Natural Language and Graph Databases", arXiv:2412.10064 (Dec 2024) ([abs](https://arxiv.org/abs/2412.10064)). [Fact] 44,387 instances; fine-tuning gave significant gains (numbers not in the abstract).
- TEXT2SPARQL'25 at ESWC 2025 ([CEUR preface](https://ceur-ws.org/Vol-4094/preface.pdf)). [Fact] DBpedia and a 50-question corporate KG (eccenca). Best corporate score 0.447 (F1/nDCG); best overall 0.426. Fine-tuned small models beat larger pretrained ones, and some systems only worked once missing prefixes were added.
[Inference] Generating graph queries is *less* mature than text-to-SQL. Don't make Cypher or SPARQL generation the main path to numbers. Give the agent typed tools or a semantic-layer API instead.

## Design decisions already in the reference maps

### 2. Ontology-based check and repair for any generated query

> Source: [general-references/32-map-research-and-cost.md § 2. Ontology-based check and repair for any generated query](../../general-references/32-map-research-and-cost.md#2-ontology-based-check-and-repair-for-any-generated-query)

**Purpose.** Catch a malformed or meaningless query before it runs, and turn some wrong answers into "I don't know". Example: the fallback SQL agent sums `invoice.customer_id`, or joins `payment` to `invoice` on a column that is not a declared link. The check rejects the query and explains why, and the model gets a chance to repair it.

**Design to implement.**
- Checks run in order, with no model involved:
  1. Every table and column exists in the documented views.
  2. Every join follows a declared link type (source, target, cardinality).
  3. Aggregations apply only to properties flagged as measures.
  4. Each property's domain and range matches how the query uses it.
  5. Filter values are valid: enums checked against `sh:in`-style allowed values, and entity names resolved through section 5. This targets LinkedIn's top failure, filter values at 24%.
  6. `EXPLAIN` dry run in Postgres.
- On failure, return a structured explanation `{check, offending_fragment, hint}` to the model. Allow at most N = 2 repair attempts [Inference: the documents give no N]. After that, return "I don't know" with the reason.
- Log the outcomes `answered`, `repaired`, `abstained` and `failed` per question for evaluation (section 19).

**Evidence.**
- OBQC plus LLM repair raised accuracy to 72%, with 8% "I don't know" and 20% errors, up from 54.2% for the ontology alone (Allemang & Sequeda, arXiv 2405.11706; document 09, section 6).
- LinkedIn validates queries with EXPLAIN; compile success was 96% (arXiv 2507.14372).
- Logic-LM, where solver error messages drive self-refinement, gained +39.2% over standard prompting (arXiv 2305.12295; document 10, section 7).

**Copies.**
- Document 09, "What to copy" item 6: the check order and the bounded repair loop. https://arxiv.org/abs/2405.11706 ; https://arxiv.org/html/2507.14372v1
- Document 09, section 1 (SHACL): reuse the shapes' allowed values and datatypes as filter validators. https://www.w3.org/TR/shacl/
- Document 10, section 1 (Reflexion): a retry carrying a written lesson only works when there is a verifier. Here the verifier is the check itself. https://arxiv.org/abs/2303.11366

**Left out.** OWL DL reasoning in the query path. It loses the guaranteed SQL rewriting, and open-world semantics confuses users (document 09).

**Open questions.** The repair limit N and the abstention UX are not given in any document.

## Fact-check notes

_No time-sensitive claims in this component were re-checked in the 28 Nov 2026 pass; its sources are dated 21–27 Nov 2026. See the linked references for their own open questions._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
