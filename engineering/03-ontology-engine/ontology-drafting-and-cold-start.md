# Ontology drafting and cold start

**Layer:** [03-ontology-engine](README.md) · **What it is:** Drafting a first model with LLMs from a company's apps and documents, and its limits.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (2) · [Research literature](#research-literature) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Lingyang, AgentOne and Alibaba

### 2. The simple flow (no data model)

> Source: [general-references/28-winnexo.md § 2. The simple flow (no data model)](../../general-references/28-winnexo.md#2-the-simple-flow-no-data-model)

Source for this section: [Fact](https://robject.lydaas.com/help/en/getting-started/quickstart).

| Step | Where | What the person does |
|---|---|---|
| 1 Create a position | Admin Console > Positions > Create Position | Enter a name (letters, numbers, underscores, hyphens), a display name, an avatar, and one or two sentences on responsibilities |
| 2 Add a knowledge base | Admin Console > Knowledge Bases > New Knowledge Base | Upload files (PDF, Word, Excel, PPT, images, audio, video, up to 2 GB each), link DingTalk or Feishu documents for automatic sync, add meeting recordings, or write notes. Link the knowledge base to positions and set visibility. Wait for status Waiting > Processing > Success |
| 3 Chat | Workspace | Pick the Digital Worker, ask in natural language. `@` references knowledge; `/` or shortcut buttons invoke skills. Reasoning steps are shown |
| 4 Schedule a task | Automated Tasks > Add Task | Describe the task in natural language, pick skills if needed. Results appear under execution records and "My Outputs", and can be sent to a chat group |

Recommended practice on the same page: one Digital Worker per position; start with basic knowledge and skills and refine from real conversations; review answer quality every two weeks.

### 3. The full flow (with the ontology)

> Source: [general-references/28-winnexo.md § 3. The full flow (with the ontology)](../../general-references/28-winnexo.md#3-the-full-flow-with-the-ontology)

Source for this section: [Fact](https://robject.lydaas.com/help/en/getting-started/advanced).

| Step | Where | What happens |
|---|---|---|
| 1 Accounts and data sources | Platform Management > User Management; Data Source Configuration | Organise users into groups by position (the page names platform administrators, frontline business users and managers of specific positions). Connect databases. The page warns that inconsistent field names, keys and comments in physical tables lead the AI to produce an unusable model |
| 2 Build an ontology | Ontology > AI Generation | Create an ontology space, describe the business scenario and goals, select source tables, click Generate. The AI extracts entities, creates object types and business logic, identifies relationships and configures table mappings. The person reviews added, modified and deleted definitions and corrects them by hand or in YAML editing mode |
| 3 Create skills | Skill Center | Use built-in skills (office documents, follow-up emails, meeting summaries, sales collateral, outreach strategies, lead discovery) or create custom ones: describe the skill in chat and let the model write it, or import a `.zip` or `.md` containing `SKILL.md`. Debug, save, publish |
| 4 Create a position | Positions > Create Position | Attach object types, business logic, analysis views, a skill scope and knowledge bases. Assign users and administrators |
| 5 Use the workspace | Workspace | Users sign in and pick the worker for their position |

Acceptance check before rollout, from the same page: ask questions the worker should answer and confirm it uses the ontology and knowledge base; ask questions outside its permissions and confirm they are refused; run one or two custom skills and check the output.

## Research literature

### 2. Knowledge graphs and LLMs: roadmaps and surveys

> Source: [general-references/09-papers-knowledge-layer.md § 2. Knowledge graphs and LLMs: roadmaps and surveys](../../general-references/09-papers-knowledge-layer.md#2-knowledge-graphs-and-llms-roadmaps-and-surveys)

**Pan et al. 2023/2024.** S. Pan, L. Luo, Y. Wang, C. Chen, J. Wang, X. Wu, "Unifying Large Language Models and Knowledge Graphs: A Roadmap", arXiv:2306.08302, *IEEE TKDE* (DOI 10.1109/TKDE.2024.3352100) ([abs](https://arxiv.org/abs/2306.08302)). [Fact] Three frameworks: (1) KG-enhanced LLMs, where KGs are used in pre-training, inference and interpretability; (2) LLM-augmented KGs, where LLMs help with KG embedding, completion, construction, graph-to-text and KGQA; (3) synergised LLM+KG with two-way reasoning. Builder lesson: [Inference] a product that uses third-party models without training them works only in framework 1 *at inference time* and framework 2 *for construction*. The training-based parts of the roadmap (pre-training with KGs, KG-tuned models) are off the table.

**Newer surveys (2024–2026).**
- Peng et al., "Graph Retrieval-Augmented Generation: A Survey", arXiv:2408.08921 (Aug 2024) ([abs](https://arxiv.org/abs/2408.08921)). [Fact] Divides GraphRAG into graph-based indexing, graph-guided retrieval and graph-enhanced generation. Useful as a checklist of design slots.
- Ma et al., "Large Language Models Meet Knowledge Graphs for Question Answering: Synthesis and Opportunities", arXiv:2505.20099 (May 2025, v2 Sep 2025) ([abs](https://arxiv.org/abs/2505.20099v2)). [Fact] Classifies methods by complex-QA task type and by the role the KG plays.
- Bian, "LLM-empowered knowledge graph construction: A survey", arXiv:2510.20345 (Oct 2025) ([abs](https://arxiv.org/abs/2510.20345)). [Fact] Covers ontology engineering, extraction and fusion, and contrasts schema-based approaches (normalisation, consistency) with schema-free ones (open discovery).
- Jelodar et al., "Integrating Graphs, Large Language Models, and Agents: Reasoning and Retrieval", arXiv:2604.15951 (Apr 2026) ([abs](https://arxiv.org/abs/2604.15951)). [Fact] Classifies by purpose, graph modality and integration strategy (prompting, augmentation, training, agents).
- Singh et al., "Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG", arXiv:2501.09136 (Jan 2025, v4 Apr 2026) ([abs](https://arxiv.org/abs/2501.09136)). [Fact] The agentic patterns it names are reflection, planning, tool use and multi-agent collaboration.
Builder lesson: [Inference] the surveys are for orientation only and report no new head-to-head numbers. For decisions, rely on the controlled comparisons in sections 4 and 5.

### 3. Learning ontologies and schemas with LLMs

> Source: [general-references/09-papers-knowledge-layer.md § 3. Learning ontologies and schemas with LLMs](../../general-references/09-papers-knowledge-layer.md#3-learning-ontologies-and-schemas-with-llms)

**LLMs4OL (2023).** H. Babaei Giglou, J. D'Souza, S. Auer, arXiv:2307.16648 ([HTML](https://arxiv.org/html/2307.16648)). Problem: can LLMs do ontology learning? Method: zero-shot prompting of nine model families on three tasks: (A) term typing, (B) taxonomy discovery (is-a), (C) non-taxonomic relations. Sources were WordNet, GeoNames and UMLS (plus schema.org for B). Results [Fact]:
- Task A, MAP@1: WordNet 91.7% (GPT-3.5); GeoNames 43.3% (GPT-4, the text says 39.4%); UMLS-NCI 16.1%.
- Task B, F1: UMLS 78.1% (GPT-4), schema.org 74.4%, GeoNames 67.8%.
- Task C, F1: best 49.5% (Flan-T5-XL), with GPT-4 at 41.3%.
- Fine-tuning Flan-T5-XL raised Task A on WordNet from 52.2% to 86.3%.
Conclusion: foundation LLMs are not sufficient for ontology construction on their own, though fine-tuned ones may serve as assistants.

**LLMs4OL 2024 Challenge (ISWC 2024).** arXiv:2409.10146 ([HTML](https://arxiv.org/html/2409.10146v1)). [Fact] 272 submissions from 14 participants. Best F1: term typing on WordNet 0.994, but GeoNames 0.59 and Gene Ontology about 0.27–0.30. Taxonomy discovery on Gene Ontology 0.049. Non-taxonomic relations on UMLS 0.078. Fine-tuning beat RAG, and performance fell from few-shot to zero-shot. Builder lesson: [Inference] LLMs are good at *naming and typing* things and weak at *proposing relationships*. In a company model, relationships should come from foreign keys, join statistics in query logs and human confirmation, not from free LLM generation.

**SPIRES / OntoGPT.** Caufield et al., "Structured prompt interrogation and recursive extraction of semantics (SPIRES)", arXiv:2304.02711, *Bioinformatics* (DOI 10.1093/bioinformatics/btae104) ([abs](https://arxiv.org/abs/2304.02711)); code at [OntoGPT](https://github.com/monarch-initiative/ontogpt). Method [Fact]: the user supplies a schema; the LLM is prompted recursively to fill each schema slot, nested objects trigger further prompts, and matched values are grounded to identifiers from existing ontologies and vocabularies, zero-shot. Accuracy is described as comparable to the mid-range of relation-extraction methods. OntoGPT works with many providers through LiteLLM; the CLI is `ontogpt extract -i file -t template`. The schema language (LinkML) is suggested only by the repository's topic tags; the README I opened does not explain it [Unverified detail]. Builder lesson: [Inference] SPIRES is the right pattern for *populating* the company model from documents (contracts, policies): extract against the typed object schema, then ground each value to an existing object ID through entity resolution. Never let extraction mint free-text entities.

**Ontology generation from requirements.** Lippolis et al., "Ontology Generation using Large Language Models", arXiv:2503.05388 (Mar 2025) ([abs](https://arxiv.org/abs/2503.05388v1)). [Fact] Two prompting methods, Memoryless CQbyCQ (one competency question at a time) and Ontogenia. Benchmark: 10 ontologies, 100 competency questions, 29 user stories. o1-preview with Ontogenia produced drafts good enough for ontology engineers and better than novice engineers, but with recurring mistakes and variable quality. Builder lesson: [Inference] drive onboarding with *competency questions* ("What was net revenue by outlet last month?"). Generate the model one question at a time, and keep each question as a regression test.

**Ontologies from relational databases.**
- RIGOR: Nayyeri et al., "Retrieval-Augmented Generation of Ontologies from Relational Databases", arXiv:2506.01232 (Jun 2025) ([abs](https://arxiv.org/abs/2506.01232v1)). [Fact] Works table by table, following foreign keys. For each step it retrieves from (i) the schema and its documentation, (ii) a repository of domain ontologies, and (iii) the growing core ontology. The LLM emits *provenance-tagged delta fragments*; a judge LLM refines each before it is merged. The abstract gives no numbers.
- Thombre, Patwardhan, Sarawagi, "Surprising Effectiveness of Self-Demonstrations in Enhancing Schema-Ontology Mapping with LLMs", arXiv:2609.13776 (Sep 2026) ([abs](https://arxiv.org/abs/2609.13776)). [Fact] Splits mapping into cascaded sub-tasks in which symbolic constraints narrow the candidates and the LLM reasons only inside each sub-task, guided by self-generated demonstrations built from domain-agnostic patterns. Reports about +25 F1 over traditional and LLM baselines on three hard RODI scenarios. One-shot prompting and naive multi-stage pipelines did badly.
- Zhang & Zhu (Yonyou AI Lab), "Construct, Align, and Reason: Large Ontology Models for Enterprise Knowledge Management", arXiv:2602.00029 (Jan 2026) ([HTML](https://arxiv.org/html/2602.00029v1)). [Fact] Finds implicit foreign keys in legacy databases with a multi-factor confidence score (name similarity, type compatibility, value overlap, cardinality). Extracts triples from text with Qwen3, disambiguates with BGE-M3 embeddings, and fuses the two. Requires training a graph-encoder plus Qwen3-4B model, evaluated on 190 synthetic graph-algorithm tasks. The construction pipeline itself has no quantitative evaluation. Builder lesson: copy the *implicit-FK scoring* (useful on messy SME databases); ignore the trained model.

**Ontology matching.** Qiang, Wang, Taylor, "Agent-OM: Leveraging LLM Agents for Ontology Matching", arXiv:2312.00326 (v29, Oct 2026) ([abs](https://arxiv.org/abs/2312.00326)). [Fact] Two Siamese agents (retrieval and matching) with matching tools, evaluated on three OAEI tracks. Close to the long-standing best on simple tasks; clearly better on complex and few-shot tasks. Builder lesson: [Inference] use this pattern to map a customer's schema onto the product's domain-pack ontology. Candidate generation by embedding retrieval, then LLM judgement per candidate pair, then human confirmation.

## Design decisions already in the reference maps

### 4. Ontology drafting with models, and its limits

> Source: [general-references/32-map-research-and-cost.md § 4. Ontology drafting with models, and its limits](../../general-references/32-map-research-and-cost.md#4-ontology-drafting-with-models-and-its-limits)

**Purpose.** Speed up onboarding by letting a model draft the customer's object types, mappings and metrics from their schema, with a human confirming every link and metric. Example: given the customer's accounting database, the model proposes `Customer`, `Invoice`, `Payment`, `CreditNote` and a candidate link `Payment → Invoice` with evidence. A finance lead confirms the link.

**Design to implement.**
- *Competency questions first*: collect 30–100 real questions per customer ("Which customers are more than 60 days overdue and have no open dispute?"). Generate the model one question at a time. Store each question with its expected answer as a regression test (section 19).
- *Table-by-table drafting along foreign keys* (RIGOR). For each table, retrieve its schema and documentation, the domain-pack ontology (receivables pack) and the current core model. The model emits a *provenance-tagged delta* `{add_object|add_property|add_link|add_metric, evidence[], confidence}`. A judge-model pass refines the delta, then a human approves it.
- *Implicit foreign-key discovery* for messy databases. Score candidate pairs on name similarity, type compatibility, value overlap and cardinality (Yonyou's multi-factor confidence).
- *Mapping split into constrained sub-tasks*. Symbolic filters narrow the candidates; the model chooses only within each sub-task, guided by self-demonstrations.
- *Mapping customer schema to the domain pack*: retrieve candidates by embedding, have the model judge each candidate pair, then a human confirms (Agent-OM).
- *Lint rules* on every draft:
  - OntoClean: roles such as Customer and Supplier are relationships on a rigid Organisation, never subclasses. The same company can be both.
  - No relationship is accepted from the model alone.
- *Layering*: a small fixed top level (Party, Document, Event, Amount, Period), then the receivables domain pack, then a per-customer application layer.
- *Populating from documents* (contracts, payment terms): use SPIRES-style extraction against the typed schema, then ground each value to an existing object ID through section 5. Extraction never mints free-text entities.

**Evidence.**
- LLMs4OL, zero-shot GPT-4: taxonomy F1 78.1% on UMLS, but non-taxonomic relations only 41.3%. The authors call foundation LLMs "not sufficiently suitable" (arXiv 2307.16648).
- LLMs4OL 2024 challenge: non-taxonomic relations peaked at F1 0.078; taxonomy discovery on Gene Ontology at 0.049 (arXiv 2409.10146).
- o1-preview with Ontogenia produced drafts usable by ontology engineers, but with recurring mistakes (arXiv 2503.05388).
- Constrained sub-task mapping gained about +25 F1 on three hard RODI scenarios; one-shot and naive multi-stage pipelines did badly (arXiv 2609.13776).
- RIGOR v1 reports no numbers (arXiv 2506.01232). All of the above are from document 09, section 3.
- LLM-generated runtime rules reached 95.56% precision but 70.96% recall (AgentSpec, arXiv 2503.18666; document 10, section 7). The same lesson applies: drafts need review.

**Copies.**
- Document 09, "What to copy" items 4, 9, 10. https://arxiv.org/abs/2506.01232v1 ; https://arxiv.org/abs/2609.13776 ; https://arxiv.org/html/2602.00029v1 ; https://arxiv.org/abs/2503.05388v1 ; https://cacm.acm.org/research/evaluating-ontological-decisions-with-ontoclean
- Document 09, section 3 (SPIRES / OntoGPT): recursive schema-slot extraction grounded to IDs. https://arxiv.org/abs/2304.02711
- Document 09, section 3 (Agent-OM): retrieve, judge, confirm. https://arxiv.org/abs/2312.00326

**Left out.**
- Fully automatic ontology construction, given relation F1 of 0.078 (document 09).
- Yonyou's trained graph-encoder plus Qwen3-4B model, and fine-tuned LLMs4OL models: they require training.

**Open questions.**
- RIGOR v2 (July 2026) was not reviewed.
- No document measures how long human confirmation takes per customer. Document 13 (section 7) says onboarding each customer's data model, not product code, is the bottleneck, and that the first hire should be a forward-deployed engineer.

### 9. Cold start, and the design for a company with only SaaS apps

> Source: [general-references/33-map-context-code-integration.md § 9. Cold start, and the design for a company with only SaaS apps](../../general-references/33-map-context-code-integration.md#9-cold-start-and-the-design-for-a-company-with-only-saas-apps)

**Purpose.** Get a useful model for a new customer in days without interviews or a data team. Receivables example: connect Xero and Gmail on day one; by day two the agent can answer "who owes us most and what did they last say?".

**Design to implement.**

Every product's cold-start method, as the documents report it:

| Product | Cold-start inputs | Status |
|---|---|---|
| Fabric IQ | "Generate Ontology" from a Power BI semantic model: tables → entity types, columns → properties, relationships → relationship types, DAX measures → metrics; manual follow-up for keys, time series, bindings, friendly names; ontology agent samples a few rows per table in its Discover stage | [Fact] |
| Snowflake Autopilot | Query history, question/SQL CSV, table and column comments, Tableau TWB/TDS, Power BI PBIX/PBIT, YAML, sample values; outputs tables, relationships, metrics, descriptions, keys inferred from metadata or distinct counts, verified and suggested queries; post-creation suggestions | [Fact] |
| Databricks Genie Ontology | Mines metric views, dashboards, SQL query history (including dbt), notebooks, Genie Agents, Power BI models (beta) into snippets; Unity Catalog primary/foreign keys saved as joins; Pages bulk import from documents with conflict, duplicate and low-confidence flags | [Fact] |
| Google Knowledge Catalog | Joins and golden queries from query logs; data profiles; interaction traces; document mining (Docs, GitHub, Confluence, SharePoint, GCS); ingestion of LookML, dbt, Snowflake, Databricks, SAP CSN models | [Fact]/[Vendor claim] |
| OpenAI in-house agent | Table usage and lineage; human annotations; Codex crawling pipeline code; Slack/Docs/Notion | [Fact] |
| Salesforce ACE | Business experts define sources, terms and intended use per job; Data 360 identity resolution | [Vendor claim] |
| Workday Data Cloud | 240+ pre-curated business objects and prebuilt finance/HCM semantic models | [Vendor claim] |
| Oracle AI Data Platform | AI Discovery agent drafts ontologies from schemas, semantic models, API docs and documents; experts approve | [Vendor claim], not shipped |
| Atlan | Context agents generate certified descriptions, glossary terms and ontology relationships | [Vendor claim] |
| dbt, Cube | Hand-authored YAML (Cube with AI assist [Unverified]) | [Fact] |
| Neo4j GraphRAG | Schema supplied, extracted from text (`SchemaFromTextExtractor`) or reverse-engineered from an existing graph | [Fact] |
| Airbyte | `discover` catalog; AI assistant reads API docs to pre-fill a connector manifest | [Fact] |

Document 11's conclusion: every incumbent mines analytics artefacts (warehouse, BI model, query history) that a 100–1,000 person company on SaaS apps does not have [Inference]. The equivalents to mine are SaaS schemas, reports and saved views inside those apps, spreadsheets and SOP documents [Inference, document 11].

Design for a SaaS-only company [Inference, each step tied to a documented pattern]:
1. **Prebuilt domain template** (Workday's pre-curated objects): ship a certified receivables ontology and metric set, plus one prebuilt mapping file per ledger (Xero, QuickBooks, NetSuite). The customer starts from a modeled tier that is already certified by the product, to be re-certified by their controller.
2. **Connector discovery** (Airbyte `discover`; NetSuite's REST record metadata catalog): list the customer's actual record types and custom fields and diff them against the template's mapping.
3. **Sample rows** (Fabric Discover): sample a few rows per stream to infer keys by distinct counts (Snowflake), value formats and representative values for entity matching (Genie format assistance; Genie's caps of 120 columns, 1,024 distinct values, 127 characters per value are a reasonable ceiling [Fact]).
4. **Ledger settings crawl** in place of OpenAI's code crawl: payment terms, tax codes, custom fields, invoice templates and reminder settings define what tables mean in a SaaS-only company.
5. **Document and mailbox mining** (Databricks Pages bulk import; Google document mining): parse the collections SOP, credit policy and a sample of AR mailbox threads into draft Pages and draft rules, deduplicated and flagged for conflicts and low confidence, in the learned tier.
6. **Proposal-first authoring agent** (Fabric ontology agent): Plan mode (discover, draft, validate, explain, no writes) and Act mode (applies changes after stating them); stages Discover → Draft → Validate (structural and grounding checks) → Apply; read-only diff of added, edited and removed items with an explanation each; stable IDs.
7. **Onboarding questions**: verified queries flagged `onboardingQuestion` are shown as first-run suggestions (Snowflake) and double as the first evaluation set (section 16); a "test the model" step generates representative questions (Fabric).
8. **Learn from use**: from week one, the trace-driven proposal loop (section 8) replaces the missing query history.

**Copies.**
- Document 11, "Key findings" 3 and 12, and sections 1, 3, 4, 6, 7, 9: methods table. URLs: https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-generate-from-semantic-models ; https://docs.snowflake.com/en/user-guide/views-semantic/autopilot ; https://databricks.com/blog/announcing-ga-genie-ontology ; https://docs.cloud.google.com/knowledge-catalog/docs/about-context ; https://openai.com/index/inside-our-in-house-data-agent/ ; https://blog.workday.com/en-us/four-layers-workday-data-cloud.html ; https://www.oracle.com/news/announcement/ai-world-oracle-ai-data-platform-brings-ai-assisted-business-context-to-enterprise-ai-2026-10-27/
- Document 11, section 1 and "What to copy" 8: proposal-first agent. https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent
- Document 11, section 3: Pages bulk import. https://docs.databricks.com/aws/en/uc-semantics/pages
- Document 24, section 1.3: Airbyte discover and NetSuite metadata discovery. https://github.com/airbytehq/airbyte/blob/master/docs/integrations/sources/netsuite.md

**Left out, and why.** Query-history mining and BI-model import (inputs do not exist for these customers). Forward-deployed setup (Frontier, C3, Cognite): not feasible for a solo founder; onboarding must be self-serve and agent-driven (document 11).

**Open questions.** How many customers already keep receivables rules in spreadsheets that should be imported (no data in the documents). Fabric's ontology agent caps conversations at 24 hours and keeps data 2 days [Fact] — what retention should the onboarding agent's conversations have?

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
