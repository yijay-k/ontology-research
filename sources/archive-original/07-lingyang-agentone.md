# Lingyang (瓴羊) and AgentOne: what is public, what is documented, what is only claimed

Scope note (written 21 November 2026). This file covers Lingyang (瓴羊智能科技), Alibaba's enterprise data and agent subsidiary, and its products: AgentOne (enterprise agent platform, launched 25 Sep 2025), Dataphin (data building and governance, the productised OneData method), Quick BI and its conversational analyst 智能小Q, and the older Quick Audience / Quick Service lines. The aim is design detail for a founder building an "organisational model for agents" product. Sources were read in Chinese and English. Hard limits on this session: the web-search budget ran out part-way through and the fetch budget was throttled, so some pages I had planned to read (Dataphin permission sub-pages, the Dataphin analysis-album page (it returned a 404), AgentOne Credit-management and permission pages, CSDN and DataFunTalk talks, patent databases) were not read. Each gap is listed in "Open questions". Labels: [Fact] = in a primary source (official docs or a first-hand report of an official statement), with URL; [Vendor claim] = Lingyang or Alibaba says so, not independently checked; [Press] = a journalist's report; [Inference] = my reasoning; [Unverified] = I could not find a source.

The main point up front: almost everything Lingyang publishes about AgentOne itself is marketing. The technically documented, copyable material is in the **Dataphin** and **Quick BI** help documentation, which spells out the metric model (atomic metric + business qualification + statistical period + granularity), the period-expression language, the naming rules, the quality-rule blocking semantics, and the Q&A knowledge configuration in detail. AgentOne's own help docs cover individual packaged agents and their billing, and say little about the platform internals.

## Key findings

1. **The four-layer "Organizational Brain for Agents" model and the ontology grammar the founder heard in Malaysia (objects, relations, rules, actions; four action grades; citations with rule version and owner; the 380,000 vs 420,000 bank demo; the Taobao/Tmall price-competitiveness workbench) are not in any public source I could find.** The only public trace of the 19 Nov 2026 talk is the agenda line "AI Last Mile: Decisions to Action with Ontology & FDE", given by Shijing (Solutions Architect, Lingyang) from 14:50 to 15:10 [Fact, https://www.alibabacloud.com/en/campaign/qwen-conference-mys-2026]. Treat those details as the founder's own notes from the talk, not as citable documentation.
2. **The Apsara 2026 numbers have been misattributed.** The figure of roughly 600 digital employees refers to Alibaba Cloud's own internal workforce, and the 10,000+ entity nodes and 20,000 ontology relations come from an anomaly-diagnosis agent at a Lanzhou Petrochemical distillation unit. Both were presented at the 22 Sep 2026 "AI Native Organization" forum (Alibaba CPO, Alibaba Cloud CIO and HR speakers). The write-up does not mention Lingyang or AgentOne [Fact as reported, https://breezedong.substack.com/p/reflections-from-attending-the-ai].
3. **Lingyang's official public architecture is "Data + Agent + FDE = AI employee".** It is not a four-layer ontology stack. Data is "memory", Agent is "job skills", and FDE (forward-deployed engineers) are the "onboarding trainers" [Vendor claim, https://help.aliyun.com/document_detail/3004555.html; https://news.mydrivers.com/1/1139/1139921.htm; https://i.ifeng.com/c/8wnEITDyxMe].
4. **The closest public match to the four-layer model is the CEO's four-step "Data to AI Data" pipeline (Apsara, Sep 2026):** (1) connect scattered sources securely and in real time; (2) unify fields and business definitions (口径); (3) turn employee know-how into knowledge, rules and context; (4) expose data and tasks to agents through APIs and MCP [Press quoting CEO 朋新宇, https://i.ifeng.com/c/8wnEITDyxMe]. [Inference] Map these to ingestion, semantic/metric layer, ontology/knowledge, and the agent interface.
5. **"Ontology" entered Lingyang's official messaging only in 2026.** On 8 Sep 2025 VP 王赛 cited Palantir's ontology idea of business "nouns" (static) plus "verbs" (dynamic) in a semantic model, and pitched Dataphin as the place where an AI-readable semantic layer is built [Press, https://datayuan.substack.com/p/ai-agent-5b0]. By 23 Sep 2026 the official line was "数据语义与本体建模" (data semantics and ontology modelling), which organises data and business knowledge so AI employees work to company-specific 口径 [Press, https://www.sohu.com/a/1080187818_115035]. No public document defines a Lingyang ontology schema.
6. **The best-documented, copyable artefact is Dataphin's metric grammar:** derived metric = atomic metric + business qualification (a WHERE clause without time) + statistical period + granularity (up to 3 object dimensions). Each part has field limits, naming rules and publish rules [Fact, https://help.aliyun.com/zh/dataphin/user-guide/specification-modeling-overview; https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-derived-metrics].
7. **Dataphin's "design is development" principle:** defining an atomic metric also fixes its calculation logic (for example `count(distinct order_id)`), and publishing a logical model auto-generates the physical code and the schedule [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/creating-atomic-metrics; https://help.aliyun.com/zh/dataphin/product-overview/what-is-a-dataphin]. A semantic layer that is also the build spec cannot drift from the data. This matters for the founder.
8. **Every metric carries governance metadata:** a natural-language 口径 (up to 1,000 characters), an "additive?" flag, a unit, a business owner and an ops owner [Fact, the same two pages]. That is exactly what an agent needs in order to cite "rule version and owner". Dataphin documents owner fields. I did not find metric versioning documented beyond Dev-Prod publishing.
9. **Quick BI's Q&A grounding is deliberately simple and deterministic:** a dataset knowledge base plus an enterprise knowledge base of business definitions with synonyms, regex rules, dataset-routing rules (up to 10 datasets per keyword) and a "smart table selection" prompt. The docs say plainly that it does no fuzzy inference: the question must contain the term or a synonym [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/knowledge-base-configuration].
10. **Transparency is built in.** Quick BI shows both the "business logic SQL" and the "executed SQL" for each answer, asks clarifying questions when the time period or metric is missing, and returns a Trace_ID [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/user-guide-for-smart-q-a]. Dataphin's X-Analytics returns only the fields the user has SELECT on, previews at most 50 rows, and can generate 2 to 5 candidate SQLs and pick the best [Fact, https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis].
11. **External agents already call Lingyang through a Skill package, not MCP.** The Quick BI "智能小Q Skill" is a zip that installs into Claude Code (`~/.claude/skills/`), OpenClaw, QoderWork or Wukong. It authenticates with api_key, api_secret and user_token, so access is scoped to the user's own data rights [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/quick-bi-open-skill-manual]. AgentOne itself advertises MCP and Skill for external integration [Vendor claim, https://help.aliyun.com/document_detail/3004555.html].
12. **The action safety model, as published, is coarse:** standard actions (price changes, coupons) run under rules, while anything touching funds or major business decisions needs human confirmation [Vendor claim, https://news.mydrivers.com/1/1139/1139921.htm]. The four action grades the founder heard are not public.
13. **Delivery is people-heavy.** One customer-service project (Yadi) took 24 days on site and 78 interviews across 10+ departments [Press, https://news.mydrivers.com/1/1139/1139921.htm]. Projects that used to take 3 to 4 months now target 3 to 4 weeks [Press, LatePost via https://finance.sina.cn/stock/jdts/2026-08-04/detail-inimekpf5165695.d.html]. The 7-day programme is a scoped pilot: free one-day FDE diagnosis, a 150,000-Credit starter pack, and a before/after report [Press, https://www.sohu.com/a/1080187818_115035].
14. **Pricing is non-standard and outcome-linked.** Some projects are free until go-live and the agreed results are hit. Other models are per seat, per resource consumption, per campaign or per promotion cycle (618, Double 11) [Press, LatePost]. The only published list price I found is for one packaged agent: the Experience Insight Agent costs 25,200 yuan for 5 shop connections for one year [Fact, https://help.aliyun.com/document_detail/3011198.html].
15. **Patents: not found.** Lingyang's own overview page claims Dataphin holds 19 public patent certificates [Vendor claim, https://help.aliyun.com/zh/quick-bi/lingyang-overview]. Google Patents blocked automated access, and the search budget ran out before I could list any by number.

## Breakdown

### 1. Company history and structure

Plain English: Lingyang is the unit that sells Alibaba's internal data platform to other companies, and now sells "AI employees" built on that platform.

- Timeline. Alibaba began internal work on data silos in 2012. It launched the "大中台，小前台" (big middle platform, small front end) strategy in 2015, and in 2017 began selling middle-platform capabilities externally: Dataphin, Quick BI and Data Bank [Vendor claim, https://help.aliyun.com/zh/quick-bi/lingyang-overview]. Lingyang was founded on 1 Dec 2021 [Fact per that page]. The public brand launch and press coverage came on 20 July 2022 [Press, https://developer.aliyun.com/article/987294]. LatePost says it became independent in 2021 [Press, https://finance.sina.cn/stock/jdts/2026-08-04/detail-inimekpf5165695.d.html].
- Structure. It was formed by merging Alibaba's data middle platform, business middle platform and service-system teams [Press, 2022, https://developer.aliyun.com/article/987294]. It is a wholly owned Alibaba subsidiary and described as "an important business unit of Alibaba Cloud Intelligence Group" [Fact, https://help.aliyun.com/zh/quick-bi/lingyang-overview]. LatePost reports that it moved out of Alibaba's Xixi campus in 2023 and back to Alibaba Cloud Valley at the end of 2025 [Press]. [Inference] The move suggests it was pulled back under Alibaba Cloud.
- People. CEO 朋新宇 (Peng Xinyu, nickname 小芃) joined Alibaba in 2004. He created Alibaba's data middle-platform methodology, chairs the Alibaba Group Data Committee, and led 生意参谋 (Sycamore) and Data Bank [Fact/Vendor, https://help.aliyun.com/zh/quick-bi/lingyang-overview; LatePost]. Other named executives: VP 甄日新 (spoke on the 7-day programme, Sep 2026) [https://www.sohu.com/a/1080187818_115035]; VP 王赛 (Data×AI talk, Sep 2025) [https://datayuan.substack.com/p/ai-agent-5b0]; VP 林永钦 (spoke to 36Kr at the AgentOne launch) [https://www.36kr.com/p/3483384622619523]; and Solutions Architect Shijing (Malaysia, Nov 2026) [agenda URL above]. Solutions Architect "Chris" presented Quick BI at the Qwen Conference Singapore on 26 May 2026 [https://www.alibabacloud.com/blog/603196].
- Positioning. Lingyang described itself as "DaaS, Data intelligence as a Service, not SaaS" from 2022 to 2024 [Press, https://developer.aliyun.com/article/987294]. From 2025 the pitch moved to "enterprise Agent = large model × good data × strong scenario" [Vendor claim, https://www.tmtpost.com/7705705.html], and from 2026 to "Data + Agent + FDE".
- Discontinued or rebranded products. Lingyang Port (瓴羊港), a data-circulation marketplace launched Nov 2023 with pricing by use scenario rather than data volume [Press, 2023 interview republished at https://lydaas.com/lydaas/api/forward/articles?id=1123]; 瓴羊One (Data SaaS); Quick Tracking; Quick Stock; Bizphin; Finplus [https://help.aliyun.com/zh/quick-bi/lingyang-overview; https://developer.aliyun.com/article/987294].

### 2. Product line and how the pieces connect

Plain English: Dataphin builds and governs the warehouse and its metric definitions. Quick BI asks questions of that data. AgentOne packages agents ("AI employees") that use both, plus Alibaba ecosystem data.

- 2022 map: five "clouds" covering 11 sub-products. Analytics: Quick BI, 生意参谋, 经营参谋. Marketing: Quick Tracking, Quick Audience. Production and sales: Quick Stock. Service: Quick Service. Development: Dataphin and Bizphin [Press, https://developer.aliyun.com/article/987294].
- 2024 map: an application layer (Quick BI, Quick Audience, Quick Service), a data layer (Dataphin, Lingyang Port) and a Qwen base with fine-tuned vertical models [Press, 机器之心 via https://m.aitntnews.com/newDetail.html?newId=7282].
- 2025 onward: AgentOne sits on top. Analytics agents come from Quick BI (问数, 解读 and 报告 agents). The marketing agent runs on Quick Audience and 天攻智投. E-commerce service comes via 店小蜜 (Taobao/Tmall). The ecosystem modules are TMIC trend data, Amap (高德) location data and the 聚石塔 e-commerce cloud [Press, https://www.tmtpost.com/7705705.html; https://www.leiphone.com/category/digitalindustry/CIVlQ0TuWa4IBiXC.html].
- [Inference] No public document describes a single shared semantic store across Dataphin, Quick BI and AgentOne. The documented integration points are: Quick BI datasets can be created from Dataphin assets ("资产消费", where dataset names are limited to 100 characters with no spaces) [Fact, https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis]; AgentOne uses MCP and Skill to connect external data [Vendor claim]; and Amap Cloud Map co-built a store-operations assistant that combines location and population data with internal sales, member, inventory and scheduling data "via MCP and Skill" [Press, https://news.mydrivers.com/1/1139/1139921.htm].

### 3. AgentOne: launch to today

Plain English: AgentOne is a platform where a company "hires" preset AI employees (sales, service, operations, marketing) or builds custom "X employees". Lingyang engineers go on site to wire them to the company's data and systems.

Timeline [all dated]:
- Jul 2025 to Sep 2025: three batches of enterprise agents released (customer service, data analysis, marketing) [Press, https://www.tmtpost.com/7705705.html].
- 25 Sep 2025: AgentOne launched at Apsara (云栖) 2025 with 20+ ready-made agents and an "AI training ground" (AI训练场) [Press/Vendor, tmtpost; https://help.aliyun.com/document_detail/3004555.html]. Over 100 customers were claimed [Vendor claim, tmtpost].
- 29 Jul 2026: four role-based AI employees went live (AI Sales, AI Customer Service, AI Operations, AI Marketing), plus custom "X employees" (finance, legal, procurement, admin, HR) [Fact as reported, https://news.mydrivers.com/1/1139/1139921.htm].
- 23 Sep 2026: the "AI员工7日上场计划" (seven-day AI employee programme) launched at Apsara 2026 with Feihe, 盈峰数科 and 易豹集团. 27 companies signed letters of intent on site [Press, https://www.sohu.com/a/1080187818_115035; https://i.ifeng.com/c/8wnEITDyxMe].
- 19 Nov 2026: Malaysia talk on Ontology & FDE (agenda only).

Published architecture descriptions (they disagree; all are marketing-level):
- Official help page: three elements. **Data** supplies business meaning and relationships, plus collection, cleaning and processing, so AI inputs and outputs are traceable. **Agent** supplies planning, memory, tool calling and multi-agent collaboration, connects to CRM, OA, service and store systems, and keeps task progress and operation logs reviewable. **FDE** covers discovery, diagnosis, SOP abstraction, integration and knowledge transfer. Design principle: "岗位化" (role-based), meaning each AI employee is configured with data, knowledge, tools, permissions and evaluation metrics for one job. Human confirmation is required for fund-related and major decisions [Vendor claim, https://help.aliyun.com/document_detail/3004555.html].
- Datayuan, Sep 2025: five layers. Model integration (Qwen, DeepSeek, private models); data semantic layer (governance plus metric semantic layer); low- or no-code agent development and orchestration; plugins and tools (BI, CRM, ERP, mail, DingTalk, Feishu, OA); runtime and governance (permission boundaries, operation logs, task status, feedback, monitoring) [Press, https://datayuan.substack.com/p/all-in-agent].
- 36Kr, Sep 2025: three agent maturity levels. "Thinking" (model plus knowledge base Q&A), "execution" (tool-calling task completion) and "self-evolution". Enterprise agents were said to be at level two [Press, https://www.36kr.com/p/3483384622619523].
- Apsara 2026: the CEO's three AI layers. Chat (public knowledge), work (operating PCs, files, browsers), and business (connected to ERP and CRM, understands 口径 and role know-how, measured on GMV, ROI and retention). Lingyang places itself in the business layer [Press, https://i.ifeng.com/c/8wnEITDyxMe].
- LatePost, Aug 2026: workflows constrain each step, multiple agents split complex tasks, and "Harness-style orchestration" is named as the 2026 enabler. Industry know-how is packaged as Skills. Member, transaction and ad records become reusable agent context. In a car-sales example, sub-agents handle lead cleaning, planning, sales strategy and store invitations [Press, https://finance.sina.cn/stock/jdts/2026-08-04/detail-inimekpf5165695.d.html].
- Leiphone, Sep 2025: privacy computing and "安全屋" (secure clean room) for data circulation. Business semantics turn data into agent-readable terms such as "inventory turnover" and "member repurchase propensity". A "Lego-style" composition of ecosystem modules. A development workflow covering build, test and deploy [Press, https://www.leiphone.com/category/digitalindustry/CIVlQ0TuWa4IBiXC.html].
- Product page: unified definitions for sales terms (customer, opportunity, stage, product) so every query returns the same 口径 with traceable results. Agent forms: autonomous-planning agents, dialogue-orchestrated agents and "expert groups". Security: classification, encryption, masking, RBAC, audit logging, anomaly detection and prompt-injection defence. Certifications: ISO 27001 and 27018, and China's MLPS Level 3 (等保三级) [Vendor claim, https://www.aliyun.com/product/agentone].

AI employee behaviours (29 Jul 2026) [Vendor claim, https://news.mydrivers.com/1/1139/1139921.htm]:
- AI Sales: before the meeting, a customer brief plus a decision-maker and risk map. During the meeting, real-time Q&A and requirement logging. After the meeting, minutes, follow-up tasks and CRM write-back.
- AI Customer Service: outbound, inbound, service operations, pre-sales and after-sales. Plans the service path, then creates tickets, changes appointments and reissues goods by calling business systems.
- AI Operations: standard actions (price changes, coupons) run "under rules". Inspection findings and anomaly suggestions go to work groups. Funds and major decisions need human confirmation. LatePost adds that high-risk actions such as budget increases or price changes are submitted to the owner for approval [Press].
- AI Marketing: strategy breakdown, then audience matching, budget allocation, effect simulation, content and benefit generation, approval and delivery. Humans confirm key budget decisions. A demo campaign: 38,000 yuan over 14 days, projected at +5,012 members and 1.6M yuan GMV [Press, LatePost].
- [Inference] The published behaviours fall into four action kinds: read/query, generate (briefs, minutes, content), write back (CRM, tickets, price changes) and reach out (outbound calls, IM pushes). These line up with the founder's "read, generate, write back, reach out" grades, but Lingyang has not published that taxonomy.

Seven-day programme mechanics (23 Sep 2026) [Press, https://www.sohu.com/a/1080187818_115035]:
1. Topic selection: the company brings a real business problem, and the FDE team and the company pick a scenario suitable for AI.
2. Mapping: FDEs work with business, data and IT staff to map data, processes, systems and acceptance metrics.
3. Build: validate on AgentOne, then build the knowledge base and agent.
4. Delivery: hand over the AI employee with a before/after comparison report.

Resources: a free one-day FDE scenario diagnosis and a 150,000-Credit starter pack plus tooling. Example: a smart-bed company with about 150 stores semantically mapped 110+ operating metrics across 5 business segments in the first 7 days, and got NL query, AI diagnostic reports, and drill-down from whole company to city, store and process step.

Customers and quantified cases (all vendor or press claims, unaudited):
- Yadi (EV two-wheelers), Mar to Sep 2025: hotline bot resolution 20% → 42%; online bot resolution 78%; peak connection rate 88% → 95%; average call time 6 → 4 min. Delivery took 24 days on site, 78 interviews and 10+ departments, in two phases (agent workbench and summaries first, then bots) [mydrivers; LatePost].
- Muyuan Foods: report generation went from days to about 30 min; 80% efficiency gain; 90% of queries self-served; 22 provinces, about 100 meetings a week [36Kr; help page].
- Fosun Tourism & Culture "AI G.O": handles 100+ request types in under 1.5 s and dispatches work orders; development to launch in about 90 days; built on Qwen [tmtpost; 36Kr].
- Voyah (岚图): lead pool of 20M+; campaign setup 12–24 h → under 3 h; CTR +15%; dormant-lead activation +20%; lead-to-order +20% [ifeng].
- Feihe: 2,600+ distributors and about 67,000 outlets; provincial management report 3 days → 1 hour [ifeng].
- Unilever: a "food knowledge engine" built from sales-call recordings, category data and reviews; produces visit prep per restaurant with traceable sources, reviewed by top salespeople [ifeng].
- StarCharge: NL charging-station search inside the Qwen App, with AgentOne connecting the model, data and tools [ifeng].
- Others: Qianxun Positioning (target accuracy 80%, completeness 50%) [36Kr]; an appliance brand's pre-sales accuracy 60% → 90%+ [LatePost]; a maternal brand's ad ROI +20% [LatePost]; Great Wall Motor service efficiency +50% [datayuan]; Baozun data-analysis agent serving 490+ brands [product page]; Taobao, where 300,000+ merchants use the 解读 agent over 1,500+ metrics [datayuan].
- Lingyang turned down a manufacturer's production-scheduling project for lack of domain experience and repeatability [Press, LatePost]. This is a useful signal about the scope they will deliver.

Pricing and credits:
- The packaged Experience Insight Agent is billed by shop-connection quota: minimum 1 shop, terms of 1 month to 3 years; the example is 5 shops × 1 year = 25,200 yuan [Fact, https://help.aliyun.com/document_detail/3011198.html].
- The Data Analysis Agent docs include a "Credit管理" (credit management) sub-page; I did not read it [Fact that it exists, https://help.aliyun.com/zh/document_detail/3050036.html, updated 2026-08-06].
- The 7-day programme includes a 150,000-Credit starter pack [Press]. The Credit-to-yuan rate was not found [Unverified].
- Commercial models: free until go-live and target results; per seat or resource; per campaign; per promotion cycle; negotiated upside above a target conversion rate [Press, LatePost].

AgentOne help-doc structure (shows what is actually productised): the overview, quick-start and billing pages cover individual agents (Experience Insight, 店小蜜大客版, Live-stream Inspection, Data Analysis, WinNexo Sales Operations). The security section has permission, data-security and compliance pages [Fact, https://help.aliyun.com/zh/product/2987146.html; https://help.aliyun.com/zh/document_detail/3019609.html; https://help.aliyun.com/zh/document_detail/3019711.html]. There is no public platform API reference, ontology editor documentation or agent-builder documentation [Inference from the navigation].

### 4. Ontology at Lingyang: what has actually been said

Plain English: an ontology here means a model of the company's things (customer, order, store), how they relate, the rules about them and the actions allowed on them. Lingyang talks about it but has not published its design.

- Sep 2025, VP 王赛: AI's biggest bottleneck is understanding enterprise data, and the semantic model is the key. Cited Palantir's ontology of static "nouns" and dynamic "verbs" in a digital-twin semantic model. Dataphin assigns business meaning to assets and builds an AI-readable semantic layer through standards mapping (落标) and auto-completion. He also argued for modelling for AI rather than humans: simpler physical models and "逆宽表化", converting wide tables into long tables to reduce token load and help pattern learning [Press, https://datayuan.substack.com/p/ai-agent-5b0].
- Sep 2025, press: Leiphone framed Lingyang explicitly as Alibaba's answer to Palantir's Ontology plus FDE model [Press, https://www.leiphone.com/category/digitalindustry/CIVlQ0TuWa4IBiXC.html].
- Sep 2026, official: "数据语义与本体建模" organises enterprise data and business knowledge into AI-usable assets, so AI employees work to company-specific 口径. This is attributed to "over a decade of data middle-platform practice" [Press, https://www.sohu.com/a/1080187818_115035].
- Nov 2026: Malaysia session title "Decisions to Action with Ontology & FDE" [Fact, agenda].
- Dataphin's concept-modelling docs are the only Lingyang product documentation with an explicit entity-relationship layer. Subject domains form a multi-level tree. Entities are business objects (people, goods, places) and business activities (for example "sales"). Relationship types are association, inheritance, hierarchy, sequence, flow and containment, drawn as an entity-relationship diagram. Logical tables are then created from the entities [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/the-data-architecture/]. [Inference] This is a lightweight ontology with objects and relations but no actions, and it is probably the base for whatever "ontology" AgentOne uses.
- Related Alibaba Cloud work, not Lingyang: a PolarDB-PG article (6 May 2026) describes an embedded ontology engine modelling objects, relations and actions, with "OAG" (ontology-augmented generation) for supply-chain, operations and marketing decisions. Only the abstract was readable [Fact, https://developer.aliyun.com/article/1732640].
- Not public: an ontology schema, the action definition format, rule versioning, the citation format ("source table + rule version + owner"), the four action grades. All are [Unverified] from public sources.

### 5. Dataphin in technical depth (the documented core)

Plain English: Dataphin is where data engineers define, once, what "paid order amount" means, which table it comes from and how it is filtered and windowed. The platform then generates the SQL and the schedule. Every downstream consumer (BI, agents, APIs) reads that one definition.

Method and layers:
- Dataphin is the cloud form of Alibaba's OneData method, which has three parts: OneModel (self-service model and metric definition with automated code and theme-based aggregation), OneID (named only) and OneService (data services) [Fact, https://help.aliyun.com/zh/dataphin/product-overview/what-is-a-dataphin].
- It follows Kimball dimensional modelling, starting from a conceptual model of business objects and business activities [Fact, https://help.aliyun.com/zh/dataphin/user-guide/specification-modeling-overview]. The product overview mentions a bus matrix covering data domains, business processes, dimensions, atomic and derived metrics, and periods [Fact, what-is-a-dataphin].
- Logical table prefixes: `dim_`, `fct_`, `dws_`. Timeliness suffixes include `_di` (daily event fact), `_df` (daily snapshot fact) and `_hh` (hourly summary). All are configurable under "研发规范 > 表规范" [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-data-panel].
- ODS/CDM/ADS layering: the Dataphin pages I read do not define it. It comes from the book 大数据之路 (see §8).

Logical objects:
- Data block (数据板块): a namespace grouped by business. Two modes. Dev-Prod gives isolated environments and needs double the compute and storage. Basic gives a single Prod environment with the risk of direct production changes. A Basic block cannot be upgraded to Dev-Prod. The English name (≤64 characters) becomes `LD_{name}_dev` in Dev and cannot be edited once logical tables exist. Each block has an architect, up to 3 business owners (responsible for stability) and up to 3 data owners (responsible for quality). Engine: MaxCompute or EMR Serverless Spark. Only super or system admins can create a block [Fact, create-a-data-panel page].
- Business objects drive dimension logical tables, which come in four kinds: normal, hierarchy, enumeration and virtual. Business activities drive fact logical tables [Fact, specification-modeling-overview].
- Atomic metric fields [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/creating-atomic-metrics]:
  - business entity and subject domain;
  - English name (letters, digits and _, ≤64 characters, with root-word suggestions drawn from data standards);
  - Chinese name (≤128 characters);
  - unit (currency, time, ratio, rank, count noun, weight, other);
  - data type;
  - 口径, a natural-language definition (≤1,000 characters);
  - description;
  - data timeliness (day, hour or minute);
  - source main table, which must be a dimension or fact logical table;
  - statistical-period identifier field, allowed on `da` and `df` facts and on dimension tables but not on `di` event facts;
  - calculation expression, for example `count(distinct order_id)`;
  - "additive?" flag (distinct counts are not additive).
- Derived atomic metric: an expression over atomic metrics, for example C = A/B [Fact, specification-modeling-overview].
- Business qualification (业务限定) [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-business-qualification]:
  - Basic type: a predicate over the source table's fields, for example `is_wireless='Y'`.
  - Composite type: a boolean tree over already-submitted qualifications, using match/not-match plus AND/OR, with nested groups and a "preview SQL" button.
  - It must reference the same source main table. It has its own timeliness setting, and logic can be reused across timeliness levels.
- Statistical period [Fact, https://help.aliyun.com/en/dataphin/fullmanaged/user-guide/new-statistical-cycle]:
  - Fields: name (≤64), abbreviation (≤64), granularity (day, hour, minute), calendar (regular or fiscal; day granularity only), start and end time as either a parameter expression or a function.
  - Start and end may not duplicate an existing period. Only admins can create periods. A default set is generated once a compute engine is configured.
- Period expression language [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/appendix-statistical-period-expression-parameters]:
  - Date functions: `lastNDate(date, N)`, `cBeginDate/cEndDate(date, 'w|m|q|y', [len])` for natural periods, `tdBeginDate` for to-date periods, `CustomBeginDate/CustomEndDate(date, 'm|q|y', shift)` for fiscal periods (for example a fiscal year starting `'0401'`). Hour and minute variants: `lastNHour`, `lastNMinute`, `dthBeginDatetime`, `dtmiBeginDatetime`.
  - Examples: last 7 days = `lastNDate('${bizdate}',7)` to `${bizdate}`; month to date = `tdBeginDate('${bizdate}','m')` to `${bizdate}`.
  - The date functions are also reusable in quality rules and partition expressions.
- Derived metric [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-derived-metrics]:
  - Choose up to 3 statistical periods, one atomic metric and business qualifications (all with the same timeliness), and up to 3 object-granularity dimensions. The time grain is set by the period.
  - The wizard pre-generates metrics. The default English name is `<atomic>_<period-abbr>_<qualification>`: starts with a letter, ≤100 characters, unique within the summary table.
  - Then set the ops owner and business owner (batch settable), the schedule (normal only; cycle derived from the period; up to 10 conditional-schedule rules evaluated top-down with first match winning) and description.
  - Upstream dependencies are auto-generated and cannot be edited. In Dev-Prod mode, the metric must be published.
- Summary logical table: exactly one granularity. Its primary key is the granularity dimension combination and every other column is a metric. Derived metrics with the same period and granularity share one summary table [Fact, specification-modeling-overview].
- Registered upward-attached metric (注册上挂指标): attaches a metric column that already exists in a physical table to a summary logical table, by mapping the granularity primary key to source fields. It is a bridge for legacy SQL into the governed model [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/new-registration-indicator].
- Worked example for a newcomer [Inference, built from the definitions above]: atomic metric `pay_amt = sum(pay_amount)` on `fct_trade_order_di`; qualification `is_wireless='Y'`; period "last 7 days"; granularity "store". The derived metric is `pay_amt_7d_wireless` in the summary table `dws_store_trade_7d`, keyed by `store_id`.

Governance modules:
- Quality: monitors Dataphin physical tables and logical tables (fact, dimension, summary) and external tables (MaxCompute, Hive, MySQL, Oracle, SQL Server, PostgreSQL, SAP HANA, ADB-PG, ClickHouse, DB2, DM, Hologres and others). It also checks data-source connectivity and schema changes, and runs real-time versus offline comparisons. **A failed strong rule raises an alert and blocks downstream task nodes. A failed weak rule only raises an alert.** A governance workbench handles fix, ignore and notify [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/asset-quality-overview].
- Asset catalog: automatic metadata extraction, table-level and field-level lineage, browsing by subject domain, and inventory of compute, storage and security [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/asset-panorama-and-catalog-overview].
- Data standards: standard sets, mapping rules, code tables and word roots. Word roots feed name suggestions in metric creation [Fact, what-is-a-dataphin; creating-atomic-metrics].
- Permissions: fine-grained asset and function permissions with request, approval and recall workflows [Fact, what-is-a-dataphin]. The sub-pages cover user roles, built-in roles and data permissions (my permissions, management, audit, ownership), but I could not read their content [Fact that they exist, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/data-access/]. One super-admin per system [Fact, https://help.aliyun.com/zh/dataphin/product-overview/use-restrictions].
- Data services (OneService): one or more physical tables are joined into a logical table and APIs are built on it, in wizard mode or script (custom SQL) mode. Environments are draft, development and production. Alerts on timeout, failure and rate limit go out by DingTalk, email, SMS or phone. Call logs include the executed SQL [Fact, https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/summary-of-data-services].
- Engines: the full-managed edition currently opens only MaxCompute [Fact, use-restrictions]. Semi-managed supports MaxCompute, ADB-PG, EMR, CDH, CDP, FusionInsight, ArgoDB/TDH, StarRocks, Lindorm, GaussDB(DWS), Databricks, Amazon EMR, SelectDB, Doris, EMR Serverless Spark and OushuDB, plus Flink variants for real time. From V6.1, tenants run in multi-engine mode [Fact, https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/calculation-settings/].

Dataphin AI ("超级X") [Fact, https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/data-x-ai/]:
- Model connection: API Key plus Base URL, with a model bound per assistant. [Inference] This means you can bring your own OpenAI-compatible endpoint.
- Assistants: X-Data Engineering (generates integration tasks, concept, logical and analytical models, and code from a requirement); X-Analytics (问数); X-Ops (status, root cause, rerun or backfill through chat); X-Coding; X-App authoring; X-Data Standard; X-Data Security (classification from semantics and samples); X-Data Quality (root cause from lineage, task code and bad data); X-Catalog (descriptions and tags); X-Asset Q&A.
- An enterprise knowledge base of terms and uploaded documents.
- Access is gated by global roles with per-app view permission.

X-Analytics specifics [Fact, https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis]:
- Each question is scoped to an "analysis album" (分析专辑) of tables, business knowledge, prompts and example questions.
- Fields are labelled as dimension, metric or statistical date, and linked to entities.
- Preview returns only the columns the user has SELECT on, up to 50 rows. SQL runs only if the album allows execution.
- Optional SQL tuning either refines the SQL or generates 2 to 5 candidates and picks the best.
- LLM repair of failed SQL uses the album's dialect.
- Input ≤2,000 characters. Last 20 conversations kept per album.

### 6. Quick BI and 智能小Q (conversational analytics)

Plain English: a business user types "why did sales drop in Penang last week?" Quick BI picks a dataset, writes the query, shows the SQL, draws a chart and optionally explains it.

- Agents: since Aug or Sep 2025 marketed as a "super data analyst" made of 问数 (query), 解读 (interpretation) and 报告 (report) agents [Press, https://www.tmtpost.com/7705705.html; https://www.36kr.com/p/3483384622619523]. Metrics are computed on the fly. A "发现" (discovery) feature links the org chart, job duties and targets so it can push insights proactively [Press, Wang Sai talk].
- Singapore, May 2026: Quick BI described its stack as LLMs → AI-ready data layer → cognitive and memory layer → action execution layer. The point was that any agent calling Quick BI gets consistent metric definitions and permission boundaries. The motivating example: three agents gave three definitions of "sales revenue" [Vendor claim, https://www.alibabacloud.com/blog/603196].
- Dataset preparation (documented) [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/prepare-data]:
  - Dataset type: detail table, multi-metric periodic table, key-value table or other.
  - "Learning acceleration" maps dimension fields to tables and learns dimension values. When a dimension has more values than the learning cap, the dimension-value rewrite mode is auto or custom per dimension.
  - Automatic field-quality scoring (takes 1 to 2 minutes) with suggested edits.
  - Default aggregation per measure, used when the user does not specify one.
  - Guidance: put units in field names, avoid time-specific field names, create calculated fields for distinct counts.
  - Quick questions: up to 10 expert questions, and per-audience sets.
  - Q&A permission per user, with an expiry date.
- Knowledge [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/knowledge-base-configuration]:
  - Four rule types: (1) business logic (definition ≤100 characters, interpretation ≤300 characters in the enterprise knowledge base and ≤3,000 characters in the dataset knowledge base per prepare-data, synonyms, scope, optional forced rewrite); (2) regex (Python regex ≤100 characters); (3) dataset selection (keyword → up to 10 datasets); (4) smart table selection (an LLM prompt describing each table's facts, grain, period and relationships).
  - Dataset knowledge overrides enterprise knowledge.
  - Bulk import and export via xls or csv (≤5 MB).
  - No fuzzy matching.
- Answering [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/user-guide-for-smart-q-a]:
  - Clarification when the period or metric is missing or ambiguous.
  - Separate model choice for reasoning and for interpretation (built-in or custom).
  - "Smart planning" mode for multi-step, multi-turn questions.
  - Both the business-logic SQL and the executed SQL are shown.
  - Attribution only for a single date dimension on a line or metric chart. Forecasting needs at least 12 date points.
  - One follow-up per question. Like or dislike feedback. Trace_ID.
- Packaging [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/chat-bi-overview]: a paid add-on with per-member seats, in the advanced and professional editions only. 30 days of history. Embedding via "Ticket" enhanced embedding. Custom agents can be built in Dify or Bailian workflows and plugged in.
- Skill for external agents [Fact, https://help.aliyun.com/zh/quick-bi/user-guide/quick-bi-open-skill-manual]: four tools (问数, 报表, 解读, 报告). 小Q报表 crawls a dashboard URL by browser automation and generates a dashboard-specific skill. Credentials: api_key, api_secret, user_token (which defines data scope) and server_domain (`https://bi.aliyun.com`). Files ≤5 MB.
- Recognition: Quick BI has been in the Gartner ABI Magic Quadrant for 7 consecutive years [Vendor claim, lingyang-overview]. The 2024 ChatBI did NL2SQL with fuzzy name matching, for example "小郑" → "郑强" [Press, aitntnews].

### 7. Quick Audience and Quick Service (brief)

- Quick Audience: the CDP and marketing engine under the marketing agent. 2024 claims: an apparel brand with 42 stores saw store visits +18% and offline conversion +35% [Press, aitntnews].
- Quick Service 2.0 (2024): LLM answers, claimed 93% accuracy, knowledge-base setup cut from 7 days to 5 minutes [Press, aitntnews]. It is now folded into the AI Customer Service employee and 店小蜜.
- OneID: named in the Dataphin docs as part of OneData, but not described [Fact, what-is-a-dataphin]. Its use in Quick Audience identity resolution is [Unverified] this session.

### 8. OneData and 大数据之路

- [Fact] Dataphin presents itself as the productisation of OneData (OneModel, OneID, OneService) [what-is-a-dataphin].
- [Unverified this session: from prior knowledge of the 2017 book 大数据之路：阿里巴巴大数据实践, by Alibaba's data technology and product department, which I could not re-read online] The book's layering is ODS (operational data) → CDM (common data model: DWD detail facts, DWS summary, DIM dimensions) → ADS (application). It sets the order "规范定义 → 模型设计 → 落地", and its metric grammar is the same one Dataphin documents: atomic metric, modifier/qualification, time period, derived metric. Dataphin's `dim_`/`fct_`/`dws_` prefixes and `di`/`df` suffixes match this [Fact for the prefixes, create-a-data-panel page]. Check the book's exact terms before citing it in a build plan.

### 9. Delivery model, partners and the FDE

- The FDE role: define the scenario, design the solution, prepare data, drive agent build and system integration, turn senior staff's tacit know-how into AI-executable SOPs, tune in use, and feed productised capabilities back into AgentOne [Vendor claim, sohu; mydrivers].
- Effort: Yadi needed 24 days and 78 interviews [Press]. A large pharma client expected 3 to 5 years to build agents and took about 1.5 years on a solid data foundation [Press, LatePost].
- Partners and ecosystem: Alibaba Cloud Research Institute (the "AI超级公司" white paper, a survey of 500 managers and 1,500 practitioners) [tmtpost]; TMIC, 店小蜜, Amap, 聚石塔 [leiphone; tmtpost]; Baozun [product page]. Third-party partners are expected to add industry agents [tmtpost]. No formal partner programme document was found [Unverified].

### 10. International availability

- Quick BI is sold internationally on Alibaba Cloud. It was presented at the Qwen Conference in Singapore (26 May 2026) with "nine overseas availability zones", a 30-day free trial with unlimited tokens, and planned expansion into Southeast Asia, the Middle East and Japan [Vendor claim, https://www.alibabacloud.com/blog/603196].
- The Dataphin docs exist in English and Japanese on alibabacloud.com [Fact from URLs].
- AgentOne: the product page and help docs I found are Chinese only (aliyun.com). The Malaysia talk is the only overseas AgentOne-adjacent appearance found. Whether AgentOne is sold outside China is [Unverified].

### 11. Patents

- Claim: Dataphin holds 19 public patent certificates [Vendor claim, https://help.aliyun.com/zh/quick-bi/lingyang-overview].
- Google Patents blocked automated access, and press searches returned only other companies' patents. No Lingyang patent numbers are listed here. Many Lingyang inventions may also be filed under Alibaba entities (阿里巴巴(中国)有限公司 or 阿里云计算有限公司) rather than 瓴羊智能科技 [Inference]. Do this search by hand on CNIPA or Google Patents.

## What to copy

1. **A four-part metric grammar as the core semantic object.** Metric = atomic measure (expression over one source table) + qualification (boolean predicate tree, no time) + period (named window expression) + granularity (≤3 dimensions). Why: it lets agents compose metrics instead of writing free SQL, and it makes metric identity unambiguous. Source: https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-derived-metrics ; https://help.aliyun.com/zh/dataphin/user-guide/specification-modeling-overview
2. **Generate metric names from their parts** (`<measure>_<period>_<qualifier>`, starts with a letter, ≤100 characters, unique per table). Why: agents and humans can read a metric's meaning from its name, and duplicates are caught at creation. Source: create-derived-metrics page.
3. **Required metadata on every metric:** a natural-language 口径 (≤1,000 characters), unit (from an enum), data type, additive flag, business owner, technical owner and description. Why: these are what an agent cites ("defined by X, owned by Y") and the additive flag blocks wrong roll-ups of distinct counts. Source: https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/creating-atomic-metrics
4. **A small, closed period-expression DSL** (`lastNDate`, `cBeginDate/cEndDate`, `tdBeginDate`, `CustomBeginDate` with a fiscal shift such as `'0401'`) over `${bizdate}`, also used in quality rules. Why: fiscal calendars and "last N days" are where agent answers most often go wrong. Source: https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/appendix-statistical-period-expression-parameters
5. **Qualifications as reusable named predicates** composed with AND/OR/NOT, with a "preview SQL" view. Why: a "valid order" or "wireless channel" definition is written once and reused by every metric and agent. Source: https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-business-qualification
6. **"Design is development":** publishing a definition generates the executable query or view and its schedule, and the dependencies are system-derived and not editable. Why: the semantic layer cannot drift from what actually runs. Source: https://help.aliyun.com/zh/dataphin/product-overview/what-is-a-dataphin
7. **A Dev/Prod split for semantic definitions with an explicit publish step,** plus a cheaper single-environment mode for small customers, with no upgrade path from single to dual. Why: 100 to 1,000-staff companies will mostly want the simple mode, but changes to definitions agents rely on need a gate. Source: https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-data-panel
8. **A "register existing metric" path** that maps a column already computed in a customer's warehouse onto the governed grain. Why: it speeds onboarding because legacy logic does not have to be rewritten before agents can use it. Source: https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/new-registration-indicator
9. **Strong vs weak data-quality rules:** a strong rule failure blocks downstream consumers, and agents should also refuse to answer from blocked data; a weak rule only alerts. Why: it gives agents a machine-readable "data is not trustworthy right now" signal. Source: https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/asset-quality-overview
10. **Knowledge rules as typed, deterministic entries:** term + synonyms + interpretation (with forced rewrite), regex triggers, keyword → dataset routing (≤10), and a last-resort LLM table-selection prompt. Local (dataset) entries override global ones. Bulk CSV import. Why: it is predictable, auditable and editable by business users, and the doc states the trade-off (no fuzzy matching). Source: https://help.aliyun.com/zh/quick-bi/user-guide/knowledge-base-configuration
11. **Scoped "albums" or analysis topics:** every question runs against an explicit set of tables, knowledge, prompts and example questions. Why: it narrows retrieval, raises accuracy, and gives a natural unit for permissions and evaluation. Source: https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis
12. **Answer transparency:** show the business-logic query and the executed SQL, ask a clarifying question when the period or metric is missing, attach a trace ID, and collect like/dislike feedback with a reason. Why: it is the minimum audit trail for trusted answers. Source: https://help.aliyun.com/zh/quick-bi/user-guide/user-guide-for-smart-q-a
13. **Permission inheritance at query time:** the agent's token is the user's token (Quick BI `user_token`), previews return only columns the user can SELECT, and row caps apply (50). Why: agents never exceed the human's rights. This matches the Alibaba Cloud CIO's principle that an agent acting for an employee inherits that employee's permissions. Source: https://help.aliyun.com/zh/quick-bi/user-guide/quick-bi-open-skill-manual ; https://breezedong.substack.com/p/reflections-from-attending-the-ai
14. **Multi-candidate SQL with selection** (2 to 5 candidates) as an optional accuracy mode, plus LLM repair of failed SQL that knows the dialect. Why: a cheap accuracy gain on hard questions; it costs latency, so make it a toggle. Source: intelligent-analysis page.
15. **Bring-your-own model via API key + base URL, bound per assistant,** with separate model choices for reasoning and interpretation. Why: the founder must use third-party models. Source: https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/data-x-ai/ ; user-guide-for-smart-q-a
16. **Ship the agent interface as a Skill package plus an API key, not only MCP.** Why: Lingyang reaches Claude Code and OpenClaw users with a zip of instructions and credentials; it is the cheapest distribution route. Source: quick-bi-open-skill-manual page.
17. **Role-based AI employees as configuration bundles:** data + knowledge + tools + permissions + evaluation metric per job, with human confirmation required for money and major decisions, and rule-bounded autonomy for standard actions. Why: it is a sellable unit and a clear safety boundary. Source: https://help.aliyun.com/document_detail/3004555.html
18. **A fixed-scope pilot offer:** one-day diagnosis → co-define acceptance metrics → 7-day build → before/after report. The benchmark deliverable is roughly 100 metrics mapped across about 5 segments in 7 days. Why: it turns FDE work into a repeatable sales motion. Source: https://www.sohu.com/a/1080187818_115035
19. **Concept-model relation types** (association, inheritance, hierarchy, sequence, flow, containment) between business objects and activities, from which logical tables are created. Why: a ready-made, minimal relation vocabulary for the object layer. Source: https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/the-data-architecture/

## What cannot or should not be copied

- **Alibaba ecosystem data and channels** (TMIC trends, Amap location and population data, 聚石塔, 店小蜜, the Taobao merchant base). These are Lingyang's moat and are not available to a solo founder [Press, leiphone; tmtpost].
- **The heavy FDE model at Lingyang's scale.** 78 interviews per project and multi-week on-site work do not fit a solo founder. Copy the scoped pilot format, not the headcount.
- **Data-warehouse building (Dataphin's integration, scheduling and compute management).** It is a large product in its own right and not needed by companies of 100 to 1,000 staff. Copy the semantic definitions and have them compile to views over the customer's existing database, not a warehouse build system [Inference].
- **The Malaysia-talk specifics** (four layers, four action grades, citation format, demos). They are not public, so they cannot be cited as sources in a build plan. Use them only as the founder's own design notes, and cite the Dataphin and Quick BI documents for each component.
- **Outcome-based pricing (free until results).** It needs capital and leverage a solo founder lacks [Press, LatePost].
- **Marketing numbers** (resolution rates, ROI uplifts). They are unaudited and should not be used as benchmarks.

## Open questions and unverified items

- Whether the Malaysia talk's "Organizational Brain for Agents" model (four layers: ingestion, enterprise ontology, semantic centre, digital employees; ontology = objects, relations, rules, actions; four action grades; citations with rule version and owner; the bank supply-chain-finance demo 380,000 vs 420,000; the Taobao/Tmall price-competitiveness workbench with a marketing ontology) has been published anywhere (slides, a WeChat article, an Alibaba Cloud blog). Not found. The search budget ran out before I could try Lingyang's WeChat account or alibabacloud.com/blog after 19 Nov.
- The "600 digital employees, 10,000 entity nodes, 20,000 relations" attribution. The breezedong write-up assigns them to Alibaba Cloud's internal workforce and a Lanzhou Petrochemical case. I could not open the underlying 29 Sep 2026 WeChat article to check whether Lingyang or AgentOne built the Lanzhou agent.
- AgentOne internals: agent builder, ontology editor, memory, evaluation, Credit pricing and API. The help pages for Credit management, permissions (3022129) and data security (3019723) were not read because the fetch budget ran out.
- Dataphin permission details (row-level rules, approvals, validity periods): the sub-pages exist but were not read.
- Metric versioning in Dataphin: is there a version history for 口径 and expression? Not found.
- Talks by named engineers at DataFunTalk, QCon, InfoQ or CSDN on Quick BI's agent or Dataphin's semantic layer: not found this session (the CSDN page failed to load, and search was exhausted). Only executive talks (朋新宇, 王赛, 甄日新, 林永钦) and the solutions-architect sessions were found.
- Patents: none listed; needs a manual CNIPA or Google Patents search under 瓴羊智能科技 and the Alibaba entities.
- The exact wording of 大数据之路 on OneData. Summarised from prior knowledge, not re-read.
- Discrepancies: founding date (1 Dec 2021 per the help page; brand press launch Jul 2022). Knowledge interpretation length (300 characters on the enterprise knowledge page vs 3,000 on the dataset prepare-data page). The AgentOne help page metadata (published 2026-01-26, modified 2026-11-16) includes July 2026 content, so it has been revised.
- Whether AgentOne is sold outside mainland China.

## Sources

1. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-derived-metrics (current) — the full derived-metric wizard: periods, qualifications, granularity, naming, owners, scheduling.
2. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/creating-atomic-metrics (current) — atomic-metric fields, limits, additive flag, example expression.
3. https://help.aliyun.com/zh/dataphin/user-guide/specification-modeling-overview (current) — concept definitions and summary-table rules.
4. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/appendix-statistical-period-expression-parameters (current) — the period DSL with examples.
5. https://help.aliyun.com/zh/quick-bi/user-guide/knowledge-base-configuration (current) — the four knowledge rule types, limits, no-fuzzy-matching caveat.
6. https://help.aliyun.com/zh/quick-bi/user-guide/prepare-data (current) — dataset readiness for NL Q&A, field quality scoring.
7. https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/intelligent-analysis (current) — X-Analytics albums, permission handling, candidate SQL, engine list.
8. https://help.aliyun.com/zh/quick-bi/user-guide/user-guide-for-smart-q-a (current) — answer flow, clarification, SQL transparency.
9. https://help.aliyun.com/zh/quick-bi/user-guide/quick-bi-open-skill-manual (2026) — the Skill for Claude Code and OpenClaw, auth model.
10. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-business-qualification (current) — predicate types and composition.
11. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/create-a-data-panel (current) — data block modes, owners, naming prefixes.
12. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/asset-quality-overview (current) — strong vs weak rules.
13. https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/data-x-ai/ (current) — Dataphin AI assistants, BYO model config.
14. https://help.aliyun.com/document_detail/3004555.html (modified 2026-11-16) — official AgentOne overview: Data/Agent/FDE, four AI employees, cases.
15. https://news.mydrivers.com/1/1139/1139921.htm (29 Jul 2026) — role-based AI employee launch, Yadi delivery details.
16. https://finance.sina.cn/stock/jdts/2026-08-04/detail-inimekpf5165695.d.html (LatePost, 4 Aug 2026) — the best independent interview: pricing models, delivery times, history.
17. https://i.ifeng.com/c/8wnEITDyxMe (QbitAI, 28 Sep 2026) — Apsara 2026: CEO's "Data to AI Data" four steps, customer numbers.
18. https://www.sohu.com/a/1080187818_115035 (24 Sep 2026) — seven-day programme mechanics, Credit pack, ontology-modelling wording.
19. https://datayuan.substack.com/p/ai-agent-5b0 (19 Sep 2025) — VP Wang Sai on Palantir ontology, semantic layer, de-widening tables.
20. https://www.alibabacloud.com/en/campaign/qwen-conference-mys-2026 (Nov 2026) — Malaysia agenda; the only public trace of the ontology and FDE talk.
21. https://breezedong.substack.com/p/reflections-from-attending-the-ai (1 Oct 2026) — source of the 600 digital employees and 10k/20k figures (not Lingyang).
22. https://www.alibabacloud.com/blog/603196 (1 Jun 2026) — Quick BI in Singapore: layered stack, international reach.
23. https://help.aliyun.com/zh/dataphin/product-overview/what-is-a-dataphin (current) — module map, OneData naming.
24. https://help.aliyun.com/zh/dataphin/semimanaged-v4/user-guide/calculation-settings/ (current) — supported engines.
25. https://www.tmtpost.com/7705705.html (Sep 2025) — AgentOne launch facts, customers.
26. https://www.36kr.com/p/3483384622619523 (26 Sep 2025) — launch interview, agent maturity levels, Muyuan numbers.
27. https://www.leiphone.com/category/digitalindustry/CIVlQ0TuWa4IBiXC.html (26 Sep 2025) — Palantir framing, ecosystem modules.
28. https://datayuan.substack.com/p/all-in-agent (29 Sep 2025) — five-layer marketing architecture.
29. https://help.aliyun.com/zh/quick-bi/lingyang-overview (2026) — company facts, the 19-patents claim, client list.
30. https://developer.aliyun.com/article/987294 (Jul 2022) — founding structure and the 2022 product map.
31. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/the-data-architecture/ (current) — concept model and relation types.
32. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/new-registration-indicator (current) — registering legacy metrics.
33. https://help.aliyun.com/document_detail/3011198.html (current) — the only public AgentOne-family price.
34. https://www.aliyun.com/product/agentone (Nov 2025 metadata) — product page claims and certifications.
35. https://m.aitntnews.com/newDetail.html?newId=7282 (Sep 2024) — 2024 product matrix and ChatBI details.
36. https://developer.aliyun.com/article/1732640 (6 May 2026) — PolarDB-PG ontology engine abstract (Alibaba Cloud, not Lingyang).
Low value (SEO pieces, no technical content): developer.aliyun.com articles 1746310, 1738509, 1750376, 1746560; guide.lydaasai.com listing pages.