# Palantir as a business: who buys, what for, what value is reported, how it is sold and delivered

Scope note (written 21 November 2026). This file covers Palantir's commercial machinery, not its software internals: the revenue mix in the latest filings (10-Q for the quarter ended 30 Sep 2026, filed November 2026; 10-K for FY2025; S-1 from August 2020), customer counts and what a "customer" means, retention and backlog, 29 named customer deployments with the job each one does, pricing and contract structure as far as it is public, the forward-deployed engineer model, bootcamps, efforts aimed at smaller customers, criticisms, and competitors. It ends with inferences for a product aimed at companies with 100 to 1,000 staff. Two limits on this session. First, the web-search budget ran out partway through, and the fetch budget ran out once. So I could not open GSA schedules, cloud marketplace listings, or the primary sources for the large government contract values, and those items are marked [Unverified]. Second, palantir.com/impact renders client-side and returned no content, so the customer cases come from AIPCon transcripts, earnings calls, press releases and customer-side sources. Labels: [Fact] means a filing or primary record; [Vendor claim] means Palantir or a customer speaking about itself; [Inference] means my own reasoning; [Unverified] means I could not open a source for it.

## Key findings

1. **The business is now about half commercial, and US commercial is the engine.** In Q3 2026, revenue was $2.313B (+96% YoY). Commercial was $1.168B, and in that quarter commercial passed government ($1.146B) for the first time. US commercial alone was $984M (+148%). International commercial grew only 21%, to $184M. [Fact, 10-Q Q3 2026 and press release]
2. **There are very few customers, and they are very large.** Palantir had 1,090 customers on a trailing-twelve-month basis at 30 Sep 2026: 904 commercial, 686 of them US commercial. The top 20 averaged $146M of revenue each over the trailing year. My estimate is that the top 20 make up about 40% of revenue [Inference]. Average revenue per customer is about $6.7M a year [Inference from filed figures]. [Fact, 10-Q]
3. **Growth comes from expansion inside existing accounts.** Net dollar retention was 165% in Q3 2026, up from 157% in Q2 and about 150% in Q1. Of the $619M year-on-year rise in commercial revenue in Q3, $407M came from customers that already existed at 31 Dec 2025. [Fact for the split, 10-Q MD&A; NDR from earnings call reporting]
4. **The economics depend on going through a loss-making start.** The S-1 sorts customers into phases. Acquire customers bring in under $100K a year and Palantir funds them at a loss: a $65.4M contribution loss on $0.6M of revenue in 2019. Expand customers had a 2019 contribution margin of minus 43%. Scale customers had a margin of 55%. Overall contribution margin has since risen to 73% (Q3 2026). [Fact, S-1 2020; 10-Q 2026]
5. **Pilots and bootcamps are run at Palantir's own expense with no guarantee of a return.** The filings say this every year. The sales cycle is typically 6 to 9 months, and sometimes over a year. [Fact, 10-K FY2025, 10-Q Q3 2026]
6. **The opening deal has grown much larger.** Karp contrasted an old $250K starting deal with roughly $25M now. Q3 2026 examples show how quickly pilots convert: $3M pilot to $29M ACV, $1.6M to about $21M, $1M to $3M to $15M, and $2.5M (after an "AgentCamp") to $11.5M, each within a quarter or two. [Vendor claim, Q3 2026 call]
7. **Delivery is done by small embedded engineering teams.** Customers report 4 FDEs at Elmet Group and 6 at GE Aerospace. Ex-staff describe teams of 4 to 5 and pilots of 8 to 12 weeks. The Delta (forward-deployed software engineer) role is "one customer, many capabilities". The Dev role is "one capability, many customers". [Vendor claim and secondary sources, below]
8. **Nearly every case has the same shape.** Many systems of record (ERP, EHR, CRM, email, spreadsheets) are unified into one object model. A specific recurring operational decision is then surfaced as a recommendation or agent action, and a human approves it. Reported results are usually cycle time ("200 hours to 15 seconds", "3 months/30 people to 10 minutes") rather than dollars. [Inference from 29 cases]
9. **Prices are custom.** There is no public list price. A Forrester study commissioned by Palantir (Feb 2023) assumed $30M a year in Palantir costs (software, cloud and services) for a 100,000-employee company with 5,000 users, and reported a 315% three-year ROI. A free Developer Tier exists, capped at 5 users. [Fact for the study's assumptions; Vendor claim for the ROI]
10. **Palantir sells against "doing it yourself".** The 10-K names customers' own internal software development as its main competitor, plus categories (enterprise software, contractors, integrators), but no companies. Analyst and advisory sources name Databricks, Azure AI Foundry, Google Vertex AI and AWS Bedrock. In 2026 the frontier labs are partners (Anthropic and OpenAI resell Palantir in some accounts) and also competitors in bake-offs. [Fact, 10-K; secondary sources]
11. **Its earlier attempts to reach smaller customers mostly failed or stalled.** These were Foundry for Builders (2021, monthly subscription for startups) and roughly $405M of SPAC and startup investments tied to software contracts (2021). Revenue from those "Strategic Commercial Contracts" fell to about $400K in Q3 2026, and management expects none after Q4. The surviving low-end channel is the free Developer Tier. [Fact and secondary sources, below]
12. **The value claim has moved twice.** In 2020 it was data integration and decisions. In 2023 to 2025 it was AIP, meaning LLMs grounded in the Ontology. Since Q2 2026 it is "sovereign AI": post-train open models on the customer's own "operational exhaust" so that the customer owns data, logic and weights instead of renting frontier tokens. [Vendor claim, Q2 and Q3 2026 calls]
13. **The risk disclosures are useful as design guidance for a copier.** Customers depend on ongoing operations-and-maintenance services and need training. Many contracts can be ended for convenience. The top three customers are 16% of revenue. The company says AI deployment carries "significant risks". [Fact, 10-Q Q3 2026]

## Breakdown

### 1. Revenue mix by segment and geography

Plain English: Palantir reports two segments, government and commercial, and two geographies, the US and "rest of world". The US now dominates both segments.

Tiny example: of every $100 Palantir earned in Q3 2026, about $43 came from US companies, $41 from the US government, $8 from foreign governments and $8 from foreign companies.

| Period | Total | Government | Commercial | US | Rest of world | Source |
|---|---|---|---|---|---|---|
| Q3 2026 | $2,313.4M (+96%) | $1,145.5M (+81%) | $1,167.9M (+113%) | $1,937.2M (84%) | $376.2M (16%) | [Fact] 10-Q |
| Q3 2025 | $1,181.1M | $632.7M | $548.4M | $882.6M (75%) | $298.5M (25%) | [Fact] 10-Q |
| 9M 2026 | $5,881.5M | $2,994.0M | $2,887.5M | $4,792.3M (81%) | $1,089.2M (19%) | [Fact] 10-Q |
| FY2025 | $4,475.4M (+56%) | $2,402.3M (+53%) | $2,073.2M (+60%) | ~$3.3B (74%) | ~$1.16B (26%) | [Fact] 10-K |
| FY2024 | $2,865.5M | $1,569.6M | $1,295.9M | n/a | n/a | [Fact] 10-K |

Sub-segments for Q3 2026, from the earnings call (reported by AOL/Motley Fool transcript coverage; [Fact] where it matches the release): US commercial was $984M (+148% YoY, +29% QoQ). International commercial was $184M (+21% YoY, +1% QoQ). US government was $953M (+96%). International government was $192M (+31%).

FY2026 guidance (raised 2 Nov 2026): revenue of $8.530 to $8.534B (about +91%), and US commercial above $3.559B (at least +143%). [Fact, Q3 2026 press release]

The 10-Q gives no UK figure and says no other country reached 10% of revenue. [Fact]

Segment contribution and margin (contribution = revenue minus cost of revenue minus sales and marketing, excluding stock comp; costs are allocated to accounts by headcount and time spent) [Fact, 10-K FY2025 definition]:

| | Q3 2026 | Q3 2025 | 9M 2026 |
|---|---|---|---|
| Government | $797.3M (70%) | $417.7M (66%) | 71% |
| Commercial | $897.5M (77%) | $360.4M (66%) | 76% |
| Total | $1,694.8M (73%) | $778.1M (66%) | 74% |

FY2025 total contribution margin was 66%, up from 60% in FY2024. [Fact, 10-K]

Other profitability figures for Q3 2026: adjusted operating margin 62%, GAAP operating margin 47%, adjusted free cash flow $1.216B (53%), adjusted gross margin about 85%, and Rule of 40 at 158%. [Fact, press release]

Cost lines for Q3 2026: sales and marketing $396.7M (+44%); R&D $219.7M (+52%), with cloud hosting a named driver; 4,634 full-time employees. [Fact, 10-Q]

Revenue per employee: Q3 annualised is about $2.0M [Inference: $2.313B × 4 / 4,634]. Karp cited $1.5M for Q1 2026. [Vendor claim via SaaStr]

### 2. Customers: definitions, counts, revenue per customer

Plain English: a "customer" is any organisation that paid Palantir something in the past twelve months. Large government bodies are counted per separately contracting and invoiced sub-agency, so FDA, CDC and NIH count as three customers, not one HHS. [Fact, 10-Q Q3 2026 MD&A; 10-K]

Counts over time:
- H1 2020: 125 customers. Average revenue per customer in 2019 was $5.6M. The top 20 averaged $24.8M, were 67% of 2019 revenue and had an average tenure of 6.6 years. The top 3 were 28% of revenue. [Fact, S-1]
- 31 Dec 2024: 711. 31 Dec 2025: 954. [Fact, 10-K FY2025]
- 30 Jun 2026: 1,049 total, 870 commercial, 653 US commercial (+35% YoY). [Vendor claim via SaaStr and Q2 call]
- 30 Sep 2026: 1,090 total (+20%), 904 commercial (+22%), 686 US commercial (+29% YoY, +5% QoQ). [Fact for total, 10-Q; commercial counts from Q3 slides via Investing.com and the call]

Top-20 average trailing-twelve-month revenue: $64.6M (2024), $93.9M (2025), $124M (Q2 2026), $146M (Q3 2026, +76% YoY). [Fact, 10-K and 10-Q; Q2 from call]

Concentration: the top 3 customers were 16% of revenue in 2025 and in 9M 2026. In the 10-K their average tenure was about ten years; the 10-Q says about fifteen. One customer ("Customer I") holds 27% of receivables. No customer reaches 10% of revenue. [Fact, 10-K and 10-Q; the tenure figures differ between filings]

Derived averages [Inference, arithmetic on filed numbers]:
- TTM revenue to 30 Sep 2026 is about $7.29B (9M 2026 of $5.88B plus Q4 2025 of $1.41B). Divided by 1,090 customers, that is about $6.7M per customer per year.
- US commercial TTM revenue is about $2.8B (9M 2026 of about $2.3B plus Q4 2025 of $507M). Divided by 686 customers, that is about $4.1M per customer. Customer growth (+29%) is far slower than revenue growth (+148%). Management said average US commercial TTM revenue per customer rose 88% YoY. [Vendor claim, Ryan Taylor, Q3 call]
- The top 20 at $146M each come to about $2.9B, roughly 40% of TTM revenue.

Customer base by industry: Palantir says it manages customers by account, not by industry, and discloses no industry revenue split. [Fact, 10-Q MD&A] Industries named in the FY2025 10-K are airline, space, shipbuilding, insurance, healthcare, telecom, automotive, and security and risk management. [Fact] Industries visible in the 2025 to 2026 AIPCon line-ups: defense primes, aerospace, chemicals, specialty metals, electrical equipment, semiconductors, insurance brokers and carriers, mortgage, health systems, accreditation bodies, pharma, media, marketing tech, construction, law, car rental, food supply co-ops and waste management (see section 4). [Fact for the line-ups]

### 3. Net dollar retention, RDV, TCV, RPO: what each measures

Plain English: NDR asks how much more last year's customers pay this year. 165% means a customer that paid $1M over the prior twelve months paid $1.65M over the latest twelve months. Remaining deal value (RDV) is the total value of signed contracts still to be billed, including portions customers could cancel.

- **NDR:** about 150% in Q1 2026, 157% in Q2 2026 and 165% in Q3 2026. [Vendor claim; SaaStr for Q1 and Q2, Q3 call and slides via Investing.com and AOL] SaaStr notes the metric excludes customers acquired during the trailing twelve months, so the newest and fastest-growing cohort is not yet in it. [Secondary] I could not open Palantir's own NDR definition in this session. [Unverified for exact wording]
- **TCV (total contract value of deals closed in the quarter):** $2.918B in Q3 2026 (+6% YoY). US commercial TCV was $1.463B. Q2 2026 TCV was $3.373B, including a record $2.132B of US commercial. [Fact, press releases] Management said Q3 deals were shorter-term than usual. [Vendor claim, CFO]
- **Deal counts in Q3 2026:** 212 deals of at least $1M, 107 of at least $5M and 64 of at least $10M. Q2 2026 had 220, 98 and 73. [Fact]
- **RDV:** $11.2B at 31 Dec 2025 (+105%): $6.8B commercial and $4.4B government. This excludes $12.3B of IDIQ ceilings whose funding is not confirmed. [Fact, 10-K] Total RDV was $13.4B at Q3 2026 (+55% YoY). US commercial RDV was $6.517B (+79%). [Fact for US commercial, press release; total from call coverage]
- **RPO:** $4.9B at Q3 2026, with about 44% due within 12 months and 37% in months 13 to 36. RPO excludes contracts under a year and amounts beyond termination-for-convenience points. That is why it is much smaller than RDV. [Fact, 10-Q; CFO comment on the call]
- **Contract length:** contracts generally run one to five years. The dollar-weighted average duration of contracts closed in 2025 was about four years, assuming every option is exercised. [Fact, 10-K]

### 4. Named customer cases and the job each one does

Format for each case: **Customer (industry)**, then **Job** (one line), then what was automated, which systems were integrated, who is affected, the result, and the source. All results are [Vendor claim] unless stated, meaning customer or Palantir statements made on stage or in press releases, not audited.

1. **General Mills (packaged food). Job: choose the lowest-cost way to fulfil each order given plant capacity and network constraints.** "Project ELF" recommends ways to mitigate disruptions or save cost across thousands of orders in real time. It sits on an Ontology built from about 200 master and operational tables; the company counts about 50M supply-chain decisions a year driving $10B of COGS. Humans accept or reject each recommendation, and over 70% are accepted. Savings are about $40K a day (about $14M a year) from a partial rollout. The partnership dates from 2019. Source: Palantir AIPCon impact study PDF (March 2024), https://www.palantir.com/assets/xrfr7uokpv1b/1aLBn65y83vdytjpXJKZcO/16989b788b34cb677f6d763d56a72349/Building_an_Intelligent_AI-Driven_Supply_Chain_at_General_Mills_-_AIPCon_March_-24_Impact_Study.pdf
2. **Tampa General Hospital (health system). Job: put each patient in the right bed fast, and catch deteriorating patients early.** Systems integrated: Epic EHR as the core source, UKG Dimensions for nurse staffing and QGenda for provider scheduling. Applications built: Care Coordination Center (C3), Care Progression Navigator (placement), Sepsis Hub (built after the FDA forced a prior vendor's tool off the market) and MRI scheduling. Reported results: patient placement time down 83%, PACU holds down 28%, sepsis length of stay down 30%, MRI turnaround up 30%, and 569 lives saved (as of July 2025). At AIPCon 9 (12 Mar 2026), pre-rounds chart review that took about 1.5 hours was reported to take about 2 seconds. In 2026 TGH also runs a post-trained open model locally, with 7% better performance and 22x lower latency. Sources: https://www.healthcareitnews.com/news/tampa-generals-investment-ai-enabled-care-coordination-software-saves-nearly-600-lives ; AIPCon 9 transcript https://www.investing.com/news/transcripts/palantir-at-aipcon-9-ai-transformations-across-industries-93CH-4557860 ; Q3 2026 call.
3. **Cleveland Clinic (health system). Job: forecast census and staff each unit to match.** The Virtual Command Center has three modules. Hospital 360 shows real-time census, capacity forecasts and bed assignment. Staffing Matrix sets staffing from predicted volume. OR Stewardship finds scheduling openings and predicts PACU capacity. Users are nurse managers, a 24/7 centralised staffing team and perioperative leaders. It runs at the main campus and three other hospitals. No numbers are published, only qualitative claims. A 10-year deal was reported in 2023. Source: https://consultqd.clevelandclinic.org/how-ai-assists-with-staffing-scheduling-and-once-tedious-tasks (Feb 2024).
4. **AIG (insurance). Job: triage and underwrite a growing flood of commercial submissions without adding underwriters.** Multi-agent "companions" give underwriters context and challenge their decisions. AIG merged the Ontologies of its own portfolio and an acquired Everest book to prioritise renewals, and used LLMs on Palantir to check a program portfolio against Syndicate 2479's risk appetite. Lexington has processed over 370,000 submissions, against a target of 500,000 by 2030, with no added headcount. Anthropic models are used for complex claims, with Palantir as the integration layer. Sources: https://amp.claimsjournal.com/news/national/2026/02/23/335799.htm (23 Feb 2026); Constellation Research, 3 Nov 2026, https://www.constellationr.com/insights/news/palantirs-q3-highlights-enterprise-inflection-point
5. **Fannie Mae (mortgage GSE). Job: flag suspicious loans and patterns for investigators.** The Crime Detection Unit runs on Palantir's financial-crimes and investigations software across combined loan data. Fannie Mae expects to save "millions", with no measured figure. Announced 28 May 2025. Source: https://www.fanniemae.com/newsroom/fannie-mae-news/fannie-mae-launches-ai-fraud-detection-technology-partnership-palantir
6. **Wendy's Quality Supply Chain Co-op (QSR purchasing). Job: allocate inventory across 6,000+ restaurants when demand deviates.** Planned modules are Dynamic Inventory Management, Variance and Gain for Restaurants, and Demand Deviation and Allocation. The longer-term aim is a connected network of suppliers, distributors and restaurants. No results are published. Announced 7 Aug 2024. Source: https://www.businesswire.com/news/home/20240807171687/en/
7. **Hertz (car rental). Job: move each returned car through cleaning and maintenance and back to a renter as fast as possible, with the right staff in the right place.** A lightweight Foundry app on Android devices replaced radios and dispatchers. Workers log their stage and get next steps. Models propose moving staff ahead of return surges, offer overtime that workers accept or decline (their answers feed the model), and match cars to customers. No measured results are published. Presented at AIPCon in June 2025. Source: https://www.cio.com/article/4018601/hertz-adopta-la-ia-para-la-gestion-de-flotas-y-personal.html (8 Jul 2025).
8. **Lear (automotive seating and electrical). Job: rebalance production lines and manage tariff exposure across plants.** Lear uses Foundry, AIP and the "Warp Speed" manufacturing OS. Over 11,000 employees use it. Lear's IDEA programme saved over $30M in H1 2025. The 2023 partnership was extended by five years. Source: https://www.aol.com/palantir-deepens-industry-ties-lear-155856064.html
9. **McCarthy Building Companies (construction). Job: screen each RFI for schedule and cost risk before it hits the site, and draft subcontract terms.** Nemotron models were post-trained on over 100,000 production RFIs, and project requirements are turned into contract language. McCarthy expects about 30,000 hours saved a year, and says the system costs less than the general models it tested. Sources: https://www.thestreet.com/investing/palantirs-ai-pitch-gets-a-30000-hour-proof-point (25 Oct 2026); Q3 2026 call.
10. **NVIDIA (semiconductors). Job: allocate constrained components across product builds and run supply scenarios.** A "Command Center" combines Ontology, AIP and Autopilot with NVIDIA cuOpt and Nemotron. A Blackwell rack has over 600,000 parts. Planners' decisions are captured as an evaluation benchmark for post-training. Reported: millions of scenarios instead of a handful, retraining in about 2 hours on one GPU, and about 95% lower cost than frontier models. Source: AIPCon 11 (10 Sep 2026), https://www.investing.com/news/transcripts/palantir-at-aipcon-11-ai-shifts-from-talk-to-operations-93CH-4896825
11. **FAA (aviation regulator). Job: detect emerging safety risks, assign mitigations and track them.** Siloed sources (weather, event reports, ATC audio) were merged into one Ontology with agent-led investigations and a shared risk matrix under Flight Plan 2026. The FAA said the work would otherwise need "hundreds of analysts". Source: AIPCon 11.
12. **USA Today Co (media). Job: pick and order articles and affiliate offers for each reader every day.** First-party reading, video, search and subscription data across 200+ local sites feeds personalised newsletters with continuously updated reader profiles. No figures. Source: AIPCon 11.
13. **Hexion (chemicals). Job: replenish customer inventory (VMI), expedite orders and source raw materials such as phenol.** The Ontology links procurement, specifications, demand, supplier agreements and emails, index prices and vessel schedules. Customer-facing agents recalculate customer attractiveness as costs move, and commercial teams keep the decision. Hexion cites a $300M EBITDA improvement over three years from the wider modernisation. Source: AIPCon 11.
14. **Acrisure (insurance brokerage). Job: place each client's risk with the best of 2,000+ carriers and service the policy.** About 1,000 acquired agencies are unified into "Auris AI". Carrier portals, email, rating engines and MCP tools sit behind "The Exchange". No productivity figures. Source: AIPCon 11.
15. **Elmet Group (tungsten and molybdenum maker, Maine; a mid-sized firm). Job: schedule machines and production and predict which quotes will close.** The project covers CRM and ERP integration, purchasing, work-ticket tracking and CMMC compliance. A four-person Palantir FDE team delivered 10 applications across two divisions in two months, and the contract was signed about two weeks after first contact. CRM integration took about two hours; the speaker's description of the earlier baseline was inconsistent. Source: AIPCon 11.
16. **L3Harris (defense prime, 44,000 staff). Job: find material shortages that threaten programmes before they bite.** The integration covers 33 ERPs and hundreds of systems, with over 5,000 scheduled feeds and 3.5M data connections. A glass shortage spanning programmes was found in 10 minutes instead of 3 months and 30 people. A "Program Digital Cockpit" MVP was built in 12 weeks. A fine-tuned open model for country-of-origin monitoring beat frontier models at 95% lower cost. Sources: AIPCon 11; Q3 2026 call.
17. **Eaton (electrical equipment). Job: turn engineer-to-order requirements into a buildable configuration and flag long-lead parts.** "Equipment Forge" links requirements, configurations, BOMs, suppliers, plant constraints and past engineering decisions, replacing email and spreadsheets. Its agents flagged an arc-flash-related part with up to a year's lead time and proposed a second supplier. Speed gains were not quantified. Source: AIPCon 11.
18. **Anduril (defense tech). Job: integrate acquired companies (CRM, ERP, leases, insurance) and plan ISR missions.** Post-merger integration was cut from 12 to 24 months to about 3 months. Mission planning went from hours to minutes. Source: AIPCon 11.
19. **Novartis (pharma). Job: scan drug-indication hypotheses and compile evidence scorecards.** Data 42 (3,000+ trials, 1M+ patient records, omics) runs on Foundry, with "Fractal" agents on top. A proteomic analysis went from 3 days to 45 minutes. The prototype scans 41,000 drug-indication pairs. Source: AIPCon 11.
20. **US Navy ShipOS (shipbuilding). Job: decide whether to act on, defer or reject each engineering change, and triage supplier emails into schedule updates.** The integration covers BOMs, schedules, supplier communications, shop-floor telemetry and maintenance records, across 2 shipbuilders, 3 public yards and 18 suppliers. BOM approval went from 200 hours to 15 seconds. Source: AIPCon 9 (12 Mar 2026).
21. **World View (stratospheric balloons). Job: re-plan flights when weather or tasking changes.** An "AI Flight Director" uses live telemetry and weather inside Maven mission planning. The plan-to-launch baseline was at least 2 weeks. Source: AIPCon 9.
22. **Freedom Mortgage (mortgage servicing and origination). Job: trace each regulatory rule to its source and support agents on 500,000+ calls a month.** Rule and product change management, document extraction and agent assist, about 90 days in. No outcome metrics. Source: AIPCon 9.
23. **SAP with Accenture (ERP migration). Job: assess and validate ERP migrations to RISE with SAP, including go/no-go calls.** Early joint customers report over 99% validation accuracy within 2 weeks, over 70% lower timeline and cost, two-thirds less scarce-expert time, and one customer moving from 5 migrations every 2 weeks to dozens a week. Source: AIPCon 9.
24. **GE Aerospace (engines). Job: predict and clear parts constraints for J85 engine sustainment.** One Ontology covers BOMs, schematics, supplier data, technician notes, ERP, PLM and planning. Six Palantir FDEs were sent to Cincinnati. A weekly 8-hour spreadsheet exercise was replaced by near-real-time constraint feeds. GE reports 2025 engine output up 26%. Source: AIPCon 9.
25. **The Joint Commission (healthcare accreditor). Job: schedule and deploy hundreds of surveyors a week.** About 400 homegrown applications are being replaced with a Foundry control plane. The article summary says scheduling fell from weeks to minutes, but the transcript cut off before that point. [Partly unverified] Source: AIPCon 9.
26. **TeleTracking with Carilion Clinic (health operations). Job: track referrals and demand between referring and receiving providers.** The inpatient product is said to be used by about 1,000 hospitals. Source: AIPCon 9.
27. **Kirkland & Ellis (law). Job: draft and analyse matters from centralised senior-lawyer expertise.** Days of analysis and drafting became minutes. CRO Ryan Taylor said it "would be impossible without the Ontology". Source: Q2 2026 call, https://www.fool.com/earnings/call-transcripts/2026/08/10/palantir-pltr-q2-2026-earnings-call-transcript/
28. **Jacobs (engineering, water utilities). Job: tune water and wastewater plant operations (energy and chemical dosing).** Domain algorithms run in Foundry, extended with AIP for clients. Reported as "weeks, not years" to deploy; efficiency gains are not quantified. Source: https://www.jacobs.com/newsroom/press-release/jacobs-and-palantir-expand-partnership (31 May 2023).
29. **Zeta Global (marketing tech, a partner more than a buyer). Job: decide where to spend marketing money and which customers to prioritise.** The Athena AI platform combines Zeta's 240M-person data cloud with each brand's Ontology. It claims 600 to 700% return on marketing spend. Source: AIPCon 11.

Unnamed conversions from the Q3 2026 call [Vendor claim]: an industrial materials company went from a ~$3M pilot to $29M ACV; a global athletic brand from $1.6M to ~$21M; a home-appliance maker from $1M to $3M to $15M ACV across commercial, finance and supply chain; an apparel firm from a $2.5M pilot (after an AgentCamp) to $11.5M ACV. From the Q2 2026 call: a non-profit health system moved from a late-2025 pilot to a 3-year, $37M TCV deal; a software company signed a $15M, 5-month deal after a bootcamp; and a Silicon Valley tech company awarded a $10M ACV contract after Palantir FDEs beat a frontier lab's deployment team in a bake-off.

AIPCon 8 (4 Sep 2025) presenters with no published detail: Waste Management (fleet), bp, MaineHealth, American Airlines (fleet), TWG Motorsports, Lumen. Source: https://techintelpro.com/news/ai/enterprise-ai/palantirs-aipcon-8-highlights-ai-driven-customer-success

### 5. Use-case types that recur across industries

| Recurring type (the job) | Cases | Typical objects | Typical action | Reported metric style |
|---|---|---|---|---|
| Supply and demand matching, constrained allocation | General Mills, NVIDIA, Wendy's QSCC, Hexion VMI, Hertz (cars to renters) | Order, SKU, plant, lane, inventory position | Re-route, re-allocate or replenish (recommended, human accepts) | $/day saved, acceptance rate, scenario count |
| Shortage and constraint detection, expediting | L3Harris, GE Aerospace, Navy ShipOS, Eaton | Part, BOM, supplier, PO, programme | Flag, propose an alternate supplier, expedite | Time to detect (months to minutes) |
| Production, maintenance and turnaround scheduling | Elmet, Hertz, GE (MRO), Lear (line balance), American Airlines | Machine, work order, vehicle, crew, shift | Sequence work, assign staff, offer overtime | Cycle time, throughput (+26% output) |
| Patient flow and care coordination | Tampa General, Cleveland Clinic, TeleTracking/Carilion, MaineHealth | Patient, bed, unit, nurse, referral | Assign bed, staff a unit, route a referral | % cut in placement time, length of stay |
| Risk detection and investigation | TGH Sepsis Hub, FAA safety, Fannie Mae fraud, L3Harris country of origin | Event, case, alert, loan, patient | Open an investigation, assign a mitigation | Lives saved, analysts avoided |
| Underwriting, placement, claims | AIG, Acrisure, Freedom Mortgage | Submission, policy, carrier, loan, rule | Triage, quote, place, prioritise renewals | Submissions per head, no added staff |
| Document drafting and review against rules | McCarthy (RFI, subcontracts), Kirkland & Ellis, Freedom Mortgage (rule traceability), Navy (engineering change) | Contract, clause, RFI, rule, change request | Draft, assess impact, approve or reject | Hours saved (30,000 a year), days to minutes |
| Quote-to-order (configure, price, quote) | Eaton ETO, Elmet quote-close prediction, Hexion customer attractiveness | Quote, configuration, customer, BOM | Validate the configuration, price, prioritise | Lead-time risk caught |
| Integration, post-merger and system migration | Anduril PMI, SAP/Accenture, Joint Commission (400 apps), Acrisure (1,000 agencies), L3Harris (33 ERPs) | Company, system, dataset, mapping | Map, validate, cut over | Months to weeks; % cost cut |
| Field resource deployment | Joint Commission surveyors, World View flights, Hertz labour | Person or asset, assignment, location, time window | Assign or retask | Weeks to minutes |
| Personalisation and marketing allocation | USA Today Co, Zeta | Reader or customer, content, offer | Select, rank, send | Return on ad spend |
| Research synthesis | Novartis | Hypothesis, trial, biomarker | Score evidence | Days to minutes |

[Inference] Pricing (in the sense of setting customer prices) shows up only indirectly (Hexion index-linked costs, Acrisure quote comparison). Pure order-to-cash and finance cases are named on calls (the home-appliance "finance" expansion) but without detail. The densest clusters are allocation, constraint detection and scheduling: the operational decisions made every day in operations-heavy firms.

### 6. The S-1 business model: Acquire, Expand, Scale

Plain English: Palantir spends money up front to prove value, then expands until each account pays for its own deployment team many times over.

- **Phase definitions** [Fact, S-1 2020 MD&A]: Acquire means revenue under $100K in the year. Expand means over $100K with a negative contribution margin. Scale means over $100K with a positive contribution margin.
- **2019 figures by phase:** Acquire had $0.6M revenue and a $65.4M contribution loss. Expand had $176.3M revenue and a (43)% margin. Scale had $565.7M revenue and a 55% margin. For the same customers in H1 2020: Acquire $18.8M revenue and a $13.9M loss; Expand $160.5M at 35%; Scale $296.3M at 68%. [Fact]
- **Company contribution margin:** 14% (2018), 21% (2019), 48% (H1 2020), 60% (2024), 66% (2025), 73% (Q3 2026). [Fact, S-1, 10-K, 10-Q]
- **Deployment speed claims in 2020:** average time to install and start working fell to 14 days in Q2 2020, more than five times faster than a year earlier, and some customers were running within 6 hours. [Fact, S-1]
- **Contract terms in 2020:** up to five years, some one-year subscriptions, and termination often possible on 3 to 6 months' notice. [Fact, S-1]
- **Expansion mechanics in 2025:** add divisions (horizontal), add users (vertical), extend into partners and suppliers, and sell cross-industry capabilities. [Fact, 10-K FY2025]

[Inference] In 2019, Palantir lost about $65M on pilots, roughly 9% of that year's revenue, to feed the funnel. The 2023 to 2026 bootcamp model compresses the Acquire phase from months to days, which is the main reason contribution margin rose.

### 7. How it is sold: bootcamps, pilots, Developer Tier, partners

**AIP bootcamps.** Plain English: a short workshop in which Palantir engineers and the prospect's staff build a working workflow on the prospect's own data, so the buyer sees it work before signing.
- Format: 1 to 5 days. Stage 1 builds AI intuition. Stage 2 is hands-on keyboard work. Stage 3 configures and deploys initial use cases and plans MVP onboarding. Run in the US, Europe, Asia and LatAm. Marketed as going "zero to use case". [Vendor claim, Palantir AIP Bootcamp flyer for Hannover Messe 2024, https://www.hannovermesse.de/apollo/hannover_messe_2024/obs/Binary/A1354173/Palantir%20AIP%20Bootcamp.pdf]
- Volume: 140+ organisations targeted by the end of November 2023, with real workflows on customer data in "5 days or less". [Secondary, Constellation Research, 2 Nov 2023] Over 500 bootcamps in the prior year, with a plan to average about five a day globally; Karp called them a "rock concert" and said attendance was being limited. [Secondary, Business Insider/Bloomberg coverage, April 2024, https://www.aol.com/palantir-ceo-says-unconventional-boot-185417978.html]
- Conversion: Palantir has not disclosed a rate. Redress Compliance asserts about 75%, without a source. [Unverified]
- 2026 variants: "AgentCamp" (named on the Q3 call) and a "sovereign bootcamp" for CEOs and operations leads covering contracts, open versus closed models and the Ontology. [Vendor claim, Q2 and Q3 2026 calls]
- Cost: run at Palantir's expense with no guarantee of a return. [Fact, 10-Q]

**Pilots.** No or low cost, short term. Converting to a paid contract is not guaranteed. The sales cycle is 6 to 9 months, sometimes over a year. [Fact, 10-Q Q3 2026] Ex-employee account: pilots of 8 to 12 weeks, sometimes lost to delays in data access. [Secondary, Nabeel Qureshi, 15 Oct 2024, https://nabeelqu.co/reflections-on-palantir]

**Developer Tier.** Limited free access to Foundry and AIP in the US and selected countries. [Fact, 10-K FY2025] Staff say it is "completely free" (Dec 2025), that limits cannot be exceeded by accident, and that capacity is shown on a "Your Plan" page. There is no price list, and resource management shows only compute-seconds and storage. [Vendor claim, community.palantir.com threads 1074 and 5684] It is capped at 5 users (May 2025), and upgrades go through a sales conversation. [Vendor claim, https://community.palantir.com/t/why-can-i-only-add-up-to-5-users-in-palantir-foundry/3911]

**Partners and channel.** The 10-K names cloud partnerships, channel sales and joint ventures, with Fujitsu as a strategic partner and SOMPO and HD Hyundai as JV partners. [Fact] In 2026, Accenture and SAP co-deliver ERP migration, NVIDIA, Dell and Armada handle edge "sovereign AI" stacks, Cisco embeds the Ontology in its Secure AI Factory, and Anthropic and OpenAI resell Palantir to some customers. [Vendor claim, AIPCon 9 and 11, Q3 call]

**Sales force.** Account-based direct sales. [Fact, 10-K] Sales and marketing was 24% of FY2025 revenue ($1.057B of $4.475B) and 17% in Q3 2026. [Inference from filed figures]

### 8. How it is delivered: forward-deployed engineers

Plain English: instead of handing over software and leaving, Palantir puts a few of its own engineers inside the customer for months to connect systems and build the first workflows. Product engineers back home turn what works into reusable features.

- **Roles.** The Delta, or forward-deployed software engineer, sits in Business Development, supports a single customer, writes and configures code, meets stakeholders and sometimes contributes code back to the product: "one customer, many capabilities". The Dev, or software engineer, owns a platform component for all customers: "one capability, many customers". Deltas spend "a couple of days most weeks" at customer sites, with stints abroad of about six months. [Vendor claim, Palantir blog "Dev versus Delta", undated, https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87] Echo is commonly described as the business-facing deployment strategist who frames the problem and manages users. a16z confirms that "Deltas" and "Echoes" are internal FDE jargon, but I could not open a primary description of Echo. [Unverified for the Echo definition; a16z, 16 Jan 2026]
- **Team size and duration.** Teams of 4 to 5, onsite 3 to 4 days a week, pilots of 8 to 12 weeks; Qureshi spent about a year at Airbus in Toulouse. [Secondary, Qureshi 2024] 2026 data points: 4 FDEs at Elmet built 10 apps in 2 months; 6 FDEs at GE Aerospace; L3Harris built an MVP in 12 weeks. [Vendor claim, AIPCon 9 and 11]
- **Commercial framing.** Services drive adoption rather than generate revenue. Deals start small (bootcamp plus limited licences) and shift toward subscription. Pricing is fixed-fee rather than per seat. [Secondary, a16z, https://a16z.com/the-palantirization-of-everything/] Karp at AIPCon 11 (Sep 2026) said Palantir gets paid after it creates value, and that FDEs are needed to rebuild the Ontology and post-train models. [Vendor claim]
- **"AI FDE".** This is a product named on the Q3 2026 call and in Developer Tier community posts. The CTO said service members can build integrations with legacy sensors in hours using it. [Vendor claim; product internals are out of scope here]
- **Services in revenue recognition.** Professional services (support, configuration, training, ontology modelling) are recognised over the service term. Cloud and on-premises subscriptions include O&M and are recognised ratably. [Fact, 10-Q]

### 9. Pricing and contract structure as far as public

- **No public list price.** Pricing is tailored by size, complexity and problem. Customers usually buy cloud through Palantir because it is cheaper. [Fact, Forrester TEI, Feb 2023, https://www.palantir.com/assets/xrfr7uokpv1b/7h0zi3GZrU3L7AM2HO1Q6O/1ad26eaa42ad949f8e3c80ea22f96b7a/The_Total_Economic_Impact_of_Palantir_Foundry.pdf]
- **One cost benchmark.** The Forrester composite is a 100,000-employee, $50B-revenue company with about 5,000 Foundry users. It assumes $30M a year paid to Palantir (software, cloud and professional services), $33M risk-adjusted, plus 7 internal staff for 2 months and then 2 ongoing. It reports benefits PV of $345M against costs PV of $83M, a 315% ROI and payback under 6 months. Interviewees' implementations took 1 to 12 weeks. [Vendor-commissioned]
- **Billing meters.** Developer Tier resource management exposes Foundry compute-seconds and storage. [Vendor claim, community] Redress Compliance (updated Apr 2026; an advisory firm whose figures are unsourced) describes usage-based billing on compute-seconds, Ontology storage (per GB-month) and pipeline volume, plus platform access fees. It also describes bundled FDE support for 12 to 18 months, which it estimates at 30 to 40% of first-year spend. [Unverified, https://redresscompliance.com/palantir-aip-foundry-guide.html]
- **Contract terms.** One to five years, many with termination for convenience. The dollar-weighted average for deals closed in 2025 was about 4 years. The US government cannot exercise options more than a year ahead. [Fact, 10-K and 10-Q]
- **Deal sizes.** Starting deals have moved from about $250K to about $25M; recent 8-figure deals have shorter terms. [Vendor claim, Q3 2026 call]
- **Government contract values and GSA or cloud marketplace price lists.** I could not open these this session because the search budget ran out. I recall the following: the US Army Enterprise Agreement (Aug 2025, up to about $10B over 10 years), the Maven Smart System ceiling raised to about $1.3B (2025), and the NHS England Federated Data Platform (Nov 2023, about £330M). I also recall Palantir products listed on AWS Marketplace and resold through Carahsoft. [Unverified, all]

### 10. How Palantir explains its value in one sentence (paraphrased)

- The 10-Q (Q3 2026) says the software helps organisations integrate their data, decisions and operations at scale. [Fact]
- The 10-K (FY2025) describes the Ontology as mapping data to meaningful context, combining data, logic and actions into a representation of the organisation that all users share. [Fact]
- The 10-K says Palantir goes after large, hard projects that competitors avoid, because high barriers to entry favour it. [Fact]
- Shyam Sankar (Q3 2026) called AIP an enterprise "harness" that runs workflows rather than a model wrapper, and said the basic unit of the enterprise is the workflow, not the worker. [Vendor claim]
- Sankar (Q2 2026) said the limit is how fast AIP is deployed, not how good the models are, and that customer-specific benchmarks beat public ones. [Vendor claim]
- Alex Karp (Q2 2026) said customers should own their data, logic and model weights instead of sending their know-how to frontier labs. [Vendor claim]
- Ryan Taylor (Q2 2026) said firms without Palantir spend heavily on tokens with no measurable value, while the value of their proprietary processes leaks to model providers. [Vendor claim]
- Karp's shareholder letter (Q3 2026) warned that LLM agents not grounded in operations become "agents of chaos". [Vendor claim, via Constellation]
- Karp (AIPCon 11, Sep 2026) said Palantir gets paid after it creates value rather than selling value up front. [Vendor claim]
- The bootcamp flyer (2024) promises to go "from zero to use case" in one to five days. [Vendor claim]

### 11. Efforts at smaller customers and what happened

- **Foundry for Builders (20 Jul 2021).** Fully managed Foundry on a monthly subscription for early-stage companies, at first only those linked to Palantir alumni. The first cohort was Chapter, Hence AI, Adyton, an Oslo BNPL fintech and Gecko Robotics, with a second cohort in Oct 2021. No price was published. [Fact, BusinessWire 2021; Bloomberg] I found no later reporting on the programme and no mention in the FY2025 10-K. [Inference: discontinued or folded in]
- **SPAC and startup investments (2021).** About $405.5M was committed to nearly two dozen SPAC targets (Sarcos, Celularity, Roivant and others), often paired with software contracts. These "strategic" programmes were 2% of 9M 2021 revenue. Analysts asked whether Palantir was "buying revenue". [Secondary, Fortune, 24 Nov 2021] Fast Radius went bankrupt nine months after listing, with about $9M of annual sales at risk. [Secondary, Motley Fool, 14 Nov 2022] In 2025, Strategic Commercial Contracts revenue fell by $37M, and it was about $400K in Q3 2026, with nothing expected after Q4 2026. [Fact, 10-K; Q3 call]
- **Developer Tier** (see section 7). Free, 5 users, capped capacity. No disclosed conversion data. [Fact and vendor claim]
- **Warp Speed cohorts** (Dec 2024 onward). Manufacturing OS cohorts that include smaller defense and industrial firms. I could not open details this session. [Unverified]
- **Smallest named 2026 buyer.** Elmet Group: signed within 2 weeks, 4 FDEs, 10 apps in 2 months. Its contract value is not disclosed. [Vendor claim, AIPCon 11]
- **Overall.** Customer count is about 1,090, not 10,000. [Fact] Management did not discuss the mid-market on the Q2 or Q3 2026 calls. [Fact, transcript coverage] The direction of travel is upmarket: $25M starting deals. [Inference]

### 12. Criticisms and risks

- **Cost.** $30M a year in the Forrester composite. Starting deals now about $25M. [Vendor-commissioned; vendor claim] RBC's Jaluria has called the software very complex, and Morningstar has said Palantir needs more staff to support growth. [Secondary, 2024]
- **Lock-in.** The Ontology, workflows and pipelines are proprietary. Redress says default exits cover raw data only (CSV, JSON, Parquet), not Ontology configuration, and estimates 18 to 36 months and £2M to £8M to migrate a mature deployment. [Unverified, advisory estimate]
- **Services intensity.** Customers depend on ongoing O&M services and need training. [Fact, 10-Q] The Expand phase ran at a (43)% contribution margin in 2019. [Fact, S-1] a16z calls the copycat risk the "services trap" and argues few problems justify months of bespoke engineering. [Secondary, 16 Jan 2026]
- **Contract fragility.** Many contracts allow termination for convenience. RPO ($4.9B) is far below RDV ($13.4B) for this reason. [Fact]
- **Concentration and government exposure.** The top 3 customers are 16% of revenue. Government budgets, timing and policy are uncertain. [Fact]
- **AI risk.** The company says deploying AI carries "significant risks". Some customers are reluctant to buy AI products, and competitors are investing more in AI. [Fact, 10-Q]
- **Ethics.** There is criticism of surveillance and immigration-enforcement work, and protests at offices. A former employee acknowledges some work sits in morally grey areas. [Secondary, Qureshi 2024] Karp frames the business around defense and deterrence and openly criticises European AI regulation. [Vendor claim, Q3 2026]
- **Revenue quality (historical).** The 2021 SPAC-linked contracts. [Secondary, Fortune]
- **Culture and costs (historical).** Fiefdoms without a clear strategy, and uncontrolled travel spending. [Secondary, Qureshi]

### 13. Competitors

- **As named by Palantir:** mainly customers' own internal software development, then large enterprise software firms, government contractors, systems integrators, emerging companies and established firms entering the market. No company is named. [Fact, 10-K FY2025; 10-Q Q3 2026] Palantir calls the frontier labs partners. Karp said Palantir is not trying to take Anthropic's customers. Sankar said labs focus on models and miss the workflow. Karp attacked "token resellers" and "lightweight" software firms that count raw usage as revenue. [Vendor claim, Q3 2026]
- **Head-to-head in 2026:** a bake-off against a frontier lab's deployment team at a Silicon Valley company, which Palantir won. [Vendor claim, Q2 2026]
- **As named by advisers and analysts:** Azure AI Foundry, Google Vertex AI, Databricks and AWS Bedrock, as the alternatives buyers should get written proposals from. [Secondary, Redress 2026] a16z describes many "Palantir for X" startups copying the FDE model. [Secondary] Snowflake, C3.ai, Salesforce, ServiceNow and SAP's own data and agent products are commonly mentioned as competitors, but I could not open a 2026 analyst source naming them. [Unverified]

### 14. Implications for a product aimed at 100 to 1,000 person companies (all inference)

- Palantir's model needs customers that can pay millions a year: average revenue is about $6.7M per customer, and a 2019 Acquire-phase customer cost about $65M in aggregate losses. A 300-person company cannot fund a 4-person FDE team for months. The copyable part is the workflow pattern, not the delivery model. [Inference]
- The repeatable unit across 29 cases is: unify 3 to 30 source systems into named objects, pick one recurring decision, put a recommendation or agent draft in front of the human who owns it, record accept or reject, and measure cycle time. For a mid-sized company the sources are fewer (one ERP or accounting system, a CRM, email, spreadsheets). That makes a templated version plausible. [Inference]
- The best-fitting job types for mid-sized firms are probably quote-to-order (Eaton and Elmet style), shortage and expediting (L3Harris style, at small scale), scheduling (Elmet and Hertz style), and document drafting against rules (McCarthy and Freedom style). Patient flow and defense need regulated data and scale. [Inference]
- Elmet Group is the closest public analogue: a mid-sized manufacturer that signed in 2 weeks and had 10 apps in 2 months. But it needed 4 FDEs. A product for this segment has to replace those FDEs with software: templates, guided integration and an agent that builds the ontology. Palantir is itself moving this way with "AI FDE". [Inference]
- The bootcamp principle (prove value on the buyer's own data within days, before the contract) transfers well and costs far less at small scale. A self-serve, time-boxed "first workflow on your data" trial is the analogue. Palantir's Developer Tier (free, 5 users, capped capacity) is a precedent for a free tier with hard limits. [Inference]
- Palantir's smaller-customer attempts (Foundry for Builders, SPAC-linked deals) failed for reasons a focused product can avoid: they were the same heavyweight platform sold to firms with immature data, partly financed by Palantir's own investment. [Inference]
- Pricing: Palantir's per-customer economics come from expansion (NDR 165%) rather than the first deal. A mid-market product should be built to expand from one workflow to many inside one account, priced per workflow or per active object domain rather than per seat. That would let land-and-expand work without FDEs. [Inference]
- Lock-in is both Palantir's moat and its main criticism. Mid-sized buyers are more cautious about it. Offering an exportable model definition (schema and actions in an open format) could be a selling point against Palantir. [Inference]
- The 2026 "sovereign AI" message (own your weights, post-train open models on your own decision logs) needs GPU spend and ML staff that mid-sized firms lack. The part that transfers is capturing every human accept or reject decision as an evaluation set. That costs little and makes later model choice provider-neutral. [Inference]

## What to copy

1. **Define the customer and the retention metrics the way Palantir does from day one.** Count a customer as any organisation billed in the trailing twelve months. Track NDR excluding the newest cohort, plus RDV and contract duration. Report expansion revenue from existing accounts separately from new-logo revenue. This makes land-and-expand measurable. Source: 10-Q Q3 2026 MD&A, https://www.sec.gov/Archives/edgar/data/0001321655/000132165526000048/pltr-20260930.htm
2. **Use phase-based account economics: Acquire, Expand, Scale.** Tag each account by revenue threshold and contribution margin. Allocate delivery cost to accounts by staff time logged. Set a target for how fast an account crosses into positive contribution margin. Source: S-1 2020, https://www.sec.gov/Archives/edgar/data/1321655/000119312520230013/d904406ds1.htm
3. **Build a bootcamp-style trial: a working workflow on the buyer's own data within 1 to 5 days.** Structure it in three stages (intuition, hands-on build, use-case plus rollout plan), and end with a written MVP plan. Source: Palantir AIP Bootcamp flyer 2024 (URL above); 10-Q (pilots at own expense).
4. **Make every recommendation accept-or-reject, and log the outcome.** General Mills reports a 70% human acceptance rate. NVIDIA uses planner decisions as an evaluation benchmark. Store each decision as an object with its inputs, recommendation, human verdict and timestamp. Source: General Mills impact study; AIPCon 11.
5. **Ship use-case templates for the recurring job types in section 5.** Start with allocation, shortage detection, scheduling and quote-to-order, each with a starter object set (Order, SKU, Supplier, PO, Machine, Work order, Quote) and one default action. Source: the cases in section 4 (AIPCon 9 and 11 transcripts).
6. **Report value as cycle time per decision, not abstract ROI.** Measure time-to-detect, time-to-approve and hours saved, as in "200 hours to 15 seconds" and "3 months/30 people to 10 minutes". Instrument the product to compute these automatically. Source: AIPCon 9 and 11.
7. **Split field work from product work: a Delta/Dev-style feedback loop.** Even a solo founder should keep a log of customer-specific code and promote recurring pieces into the core each month (a16z's "recycle custom code into templates"). Source: Palantir "Dev versus Delta" blog; a16z 2026.
8. **Offer a free tier with hard, non-overrunnable limits.** Palantir's version caps at 5 users and shows capacity on a "Your Plan" page, with no surprise bills. Source: community.palantir.com threads (Dec 2025, May 2025).
9. **Expand inside accounts horizontally (more divisions) and vertically (more users), then out to suppliers and partners.** Design multi-tenant org units and external-party access early so that this path exists. Source: 10-K FY2025 Business section.
10. **Write contracts with short initial terms that expand.** Palantir's 2026 eight-figure deals are shorter-term up front. Avoid termination-for-convenience exposure where you can, and track revenue at risk the way RPO versus RDV does. Source: Q3 2026 call; 10-Q.

## What cannot or should not be copied

- **The FDE-heavy delivery model at mid-market prices.** It needs $4M+ average account revenue to pay for 4 to 6 embedded engineers, and Palantir funded losses of about $65M on Acquire-phase accounts in 2019. Source: S-1; AIPCon cases.
- **Funding pilots at a large loss.** Palantir could do this because of patient capital and government anchor revenue. a16z names these as structural advantages.
- **Government and defense credibility and access.** Maven, Army programmes and similar work underpin the brand. They are irrelevant to the target segment and impossible for a solo founder.
- **Investing in customers in exchange for contracts (the SPAC playbook).** It drew "buying revenue" criticism and produced losses.
- **Proprietary, hard-to-export model definitions as a deliberate moat.** This is the main criticism of Palantir, and mid-sized buyers will penalise it.
- **The post-trained "sovereign AI" stack** (GPU racks, NVIDIA Nemotron post-training) at this customer size. Copy only the evaluation-data capture.
- **The rock-concert scale of bootcamps (about five a day).** It depends on brand pull and a large technical staff.

## Open questions and unverified items

- I could not open Palantir's own NDR definition wording in this session. The Q1 2026 figure of 150% comes from SaaStr's arithmetic on "+700 bps", not a filing.
- The Echo role definition (deployment strategist) has no primary source. a16z confirms only that the term exists.
- I have no primary-source data on bootcamp conversion rate or the cumulative number of bootcamps. The 75% figure is Redress's and unsourced. I recall "500+ bootcamps" (2023) and about 1,300 (mid-2024) without having opened the original call text.
- Government contract values (Army Enterprise Agreement about $10B, Maven about $1.3B ceiling, NHS FDP about £330M), GSA schedule prices and AWS or Azure marketplace listings were not opened because the search budget ran out.
- Commercial customer count and NDR at 31 Dec 2025 (10-K) were not extracted.
- Foundry for Builders: I found no record of when it ended or of its outcome.
- Several AIPCon results are on-stage claims with inconsistent baselines (Elmet's "nine months" versus "two days"). The Joint Commission's "weeks to minutes" appears in the summary but not in the transcript.
- I could not read palantir.com/impact. It renders client-side, and the fetch returned only metadata.
- The Q3 2026 call coverage (AOL/Motley Fool) flags itself as partly LLM-generated, and there are TCV growth inconsistencies on the call (+17% versus +11%).

## Sources (ranked by usefulness)

1. Palantir 10-Q for the quarter ended 30 Sep 2026: https://www.sec.gov/Archives/edgar/data/0001321655/000132165526000048/pltr-20260930.htm. Segment, geography and contribution tables, customer definition, MD&A split of existing versus new revenue, pilots and bootcamps language, risk factors.
2. Palantir 10-K FY2025: https://www.sec.gov/Archives/edgar/data/0001321655/000132165526000011/pltr-20251231.htm. Customer counts, RDV split, contract duration, Developer Tier, competition, contribution margin definition.
3. Palantir S-1 (Aug 2020): https://www.sec.gov/Archives/edgar/data/1321655/000119312520230013/d904406ds1.htm. Acquire, Expand and Scale definitions and per-phase margins.
4. AIPCon 11 transcript (10 Sep 2026), Investing.com: https://www.investing.com/news/transcripts/palantir-at-aipcon-11-ai-shifts-from-talk-to-operations-93CH-4896825. Twelve customer deployments with systems, users and numbers.
5. AIPCon 9 transcript (12 Mar 2026), Investing.com: https://www.investing.com/news/transcripts/palantir-at-aipcon-9-ai-transformations-across-industries-93CH-4557860. Navy, GE, Tampa General, SAP/Accenture and others.
6. Q3 2026 press release (2 Nov 2026): https://www.sec.gov/Archives/edgar/data/0001321655/000132165526000045/a2026q3ex991pressrelease.htm. Headline metrics and guidance.
7. Q3 2026 call coverage, AOL: https://www.aol.com/articles/palantir-pltr-q3-2026-earnings-042839000.html. Sub-segments, NDR, pilot conversions, executive framing (flags itself as partly LLM-generated).
8. Q2 2026 call transcript, Motley Fool (10 Aug 2026): https://www.fool.com/earnings/call-transcripts/2026/08/10/palantir-pltr-q2-2026-earnings-call-transcript/. Bake-off, Kirkland & Ellis, sovereign framing.
9. a16z, "The Palantirization of Everything" (16 Jan 2026): https://a16z.com/the-palantirization-of-everything/. FDE economics and the services trap.
10. Forrester TEI of Foundry (Feb 2023): https://www.palantir.com/assets/xrfr7uokpv1b/7h0zi3GZrU3L7AM2HO1Q6O/1ad26eaa42ad949f8e3c80ea22f96b7a/The_Total_Economic_Impact_of_Palantir_Foundry.pdf. The only public cost benchmark.
11. General Mills impact study (Mar 2024): the PDF URL in case 1. Decision volume, acceptance rate, savings.
12. Palantir blog, "Dev versus Delta" (undated): https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87. Role split.
13. Nabeel Qureshi, "Reflections on Palantir" (15 Oct 2024): https://nabeelqu.co/reflections-on-palantir. Team size, pilot length, criticisms.
14. Healthcare IT News on Tampa General (2025): https://www.healthcareitnews.com/news/tampa-generals-investment-ai-enabled-care-coordination-software-saves-nearly-600-lives. Integrated systems and outcomes.
15. Claims Journal on AIG (23 Feb 2026): https://amp.claimsjournal.com/news/national/2026/02/23/335799.htm. Underwriting agents and volumes.
16. SaaStr Q2 2026 analysis: https://saastr.com/5-interesting-learnings-from-palantir-at-7-7-billion-arr-93-growth-157-nrr-and-a-rule-of-40-score-of-155. Customer counts and NDR history.
17. Palantir AIP Bootcamp flyer (Hannover Messe 2024): https://www.hannovermesse.de/apollo/hannover_messe_2024/obs/Binary/A1354173/Palantir%20AIP%20Bootcamp.pdf. Bootcamp format.
18. Redress Compliance guide (Apr 2026): https://redresscompliance.com/palantir-aip-foundry-guide.html. Billing meters and lock-in, with unsourced estimates.
19. Cleveland Clinic Consult QD (Feb 2024): https://consultqd.clevelandclinic.org/how-ai-assists-with-staffing-scheduling-and-once-tedious-tasks. Command-center modules.
20. CIO.com on Hertz (8 Jul 2025): https://www.cio.com/article/4018601/hertz-adopta-la-ia-para-la-gestion-de-flotas-y-personal.html. Frontline workflow design.
21. Fortune on SPAC investments (24 Nov 2021): https://fortune.com/2021/11/24/palantir-spac-investments-wall-street-questions/ ; Foundry for Builders release (20 Jul 2021): https://www.businesswire.com/news/home/20210720005346/en/Palantir-Introduces-Foundry-for-Builders. The small-customer history.
22. Developer Tier community threads: https://community.palantir.com/t/billing-and-usage/1074 , https://community.palantir.com/t/developer-tier-billing-usage/5684 , https://community.palantir.com/t/why-can-i-only-add-up-to-5-users-in-palantir-foundry/3911. Free-tier limits.
23. Constellation Research (3 Nov 2026 and 2 Nov 2023): https://www.constellationr.com/insights/news/palantirs-q3-highlights-enterprise-inflection-point , https://www.constellationr.com/insights/news/palantirs-commercial-business-scales-help-ai-boot-camps. Partner framing and bootcamp counts.
24. Other customer sources: TheStreet on McCarthy (25 Oct 2026) https://www.thestreet.com/investing/palantirs-ai-pitch-gets-a-30000-hour-proof-point ; Fannie Mae (28 May 2025) https://www.fanniemae.com/newsroom/fannie-mae-news/fannie-mae-launches-ai-fraud-detection-technology-partnership-palantir ; Wendy's QSCC (7 Aug 2024) https://www.businesswire.com/news/home/20240807171687/en/ ; Jacobs (31 May 2023) https://www.jacobs.com/newsroom/press-release/jacobs-and-palantir-expand-partnership ; Lear and Lumen https://www.aol.com/palantir-deepens-industry-ties-lear-155856064.html ; AIPCon 8 list https://techintelpro.com/news/ai/enterprise-ai/palantirs-aipcon-8-highlights-ai-driven-customer-success
