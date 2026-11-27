# Customer onboarding

**Layer:** [12-apps-and-integration](README.md) · **What it is:** Technical onboarding of a new customer: forward-deployed engineering, self-setup flow and time to live.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (3) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Other companies and products](#other-companies-and-products) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### Part C: technical onboarding of a new customer

> Source: [general-references/05-palantir-apps-infra.md § Part C: technical onboarding of a new customer](../../general-references/05-palantir-apps-infra.md#part-c-technical-onboarding-of-a-new-customer)

What Palantir publishes, in order:

1. **Enrollment and tenancy setup.**
   - Palantir provisions an enrollment: SaaS, or customer cloud where "provisioning requires account teams" ([Fact](https://docs.oracle.com/en/solutions/palantir-foundry-ai-platform-on-oci/index.html)).
   - Admins configure organizations, spaces and the IdP (SAML/OIDC/SCIM), and set egress/ingress and domains. These are the Control Panel areas listed in the admin docs ([Fact](https://palantir.com/docs/foundry/administration/enrollments-and-organizations/)).
   - The exact ordering of these steps was not read [Unverified].
2. **Scope a use case.**
   - The "Scoping Use Cases" course takes about 15 minutes ([Fact](https://palantir.com/docs/foundry/aip/getting-started-with-aip/)).
   - Palantir defines a use case as time-bound, with a dedicated team, named users and a measurable improvement ([Fact](https://www.palantir.com/docs/foundry/use-case-life-cycle/overview/)).
3. **Solution design** ([Fact](https://www.palantir.com/docs/foundry/use-case-life-cycle/solution-design)):
   - **Object-model sketch:** core, derived and use-case object types and links, with optional keys and cardinality.
   - **Lifecycle diagram:** a state machine of Actions.
   - **Enrichments:** object-level and property-level.
   - **Interface intents.**
   - **Defaults:** Workshop for an inbox, Object View for a single-item view, Quiver for an executive dashboard, Carbon for unified search.
   - **Heuristic:** put enrichments in the data layer unless they depend on Action-edited data.
4. **Sequence the build** ([Fact](https://palantir.com/docs/foundry/use-case-life-cycle/sequencing-development/)):
   - Level 1 is the data asset (pipeline).
   - Level 2 is guided decision-making (ontology plus first interfaces).
   - Then expand with models and enrichment.
5. **Hands-on build.** "Speedrun: Your First End-to-End Workflow" ([Fact](https://learn.palantir.com/speedrun-your-first-e2e-workflow)):
   1. Create a project and folder.
   2. Upload data manually.
   3. Build a pipeline that cleans two sources, joins them to a Master Customer List, unions them and outputs Master Orders.
   4. Create the object.
   5. Build a Workshop module with pie and bar charts and an object table.
   6. Enable edits and create an "Assign Order" Action.
   7. Add the Action to the app.
   - The AIP variant (about 60–90 minutes) extracts PDFs into the ontology, configures an AIP Chatbot on that knowledge graph, and builds an app around it ([Fact](https://palantir.com/docs/foundry/aip/getting-started-with-aip/)).
6. **Examples and templates.** "Build with AIP" / Examples are installable reference workflows, some taking your own data via drag-and-drop, some with walkthroughs ([Fact](https://palantir.com/docs/foundry/getting-started/start-with-examples/)). Marketplace installs products into the customer's space (A16).
7. **Bootcamp.** One to five days: build AI intuition, keyboard time, then configure and deploy initial use cases plus an implementation plan for an MVP rollout ([Vendor claim](https://www.hannovermesse.de/apollo/hannover_messe_2024/obs/Binary/A1354173/Palantir%20AIP%20Bootcamp.pdf), Hannover Messe 2024 flyer).

**Typical first ontology size and time.**
- No Palantir source I could open states a number.
- The Speedrun builds one object type and one Action in one session.
- Bootcamps claim a deployed use case in 1–5 days.
- [Inference] A first production use case is therefore probably a handful of object types (core plus use-case types) and a few Actions, not a full enterprise model. Treat this as unverified.

---

### 17. AI FDE (AI Forward Deployed Engineer)

> Source: [general-references/03-palantir-aip.md § 17. AI FDE (AI Forward Deployed Engineer)](../../general-references/03-palantir-aip.md#17-ai-fde-ai-forward-deployed-engineer)

**Plain English.** AI FDE is a coding and building agent that works inside the platform: it builds pipelines, Ontology types, functions, evals and automations from chat.

**Technical detail.**
- GA on 12 Mar 2026. [Fact] https://palantir.com/docs/foundry/announcements/2026-03/
- **Modes.** Data integration, data connection, Ontology editing, functions editing, exploration (read-only), governance, machine learning, OSDK React and platform Q&A. Modes load their own docs and tools, and the agent can switch modes mid-task. [Fact] https://www.palantir.com/docs/foundry/ai-fde/modes-and-capabilities/
- **Agent capabilities.** Change mode, request clarification (multiple-choice or free text), **generate plan** for the user to review, load docs, load skills, manage context and manage capabilities. [Fact] same URL.
- **Closed loop.** It acts, observes and validates using transform previews, function previews and CI checks. By default it proposes changes as Global Branch proposals or pull requests. [Fact] https://www.palantir.com/docs/foundry/ai-fde/overview/
- **Approvals** ([Fact] https://www.palantir.com/docs/foundry/ai-fde/security-and-governance/):
  - Always ask: executing Ontology actions, creating apps or widgets, publishing, creating tags.
  - Auto-approve on feature branches but ask on protected branches: file edits and builds.
  - Auto-approve: reads.
  - Users can pre-approve tools for a session, scoped to a branch or project.
- **Identity and audit.** It uses the user's own session, so audit logs attribute actions to the user and LLM usage is rate-limited per user. A session gets the user's markings, and a lost marking means the session is lost. Sessions are private and cannot be shared. [Fact] same URL.
- **AIP Skills** ([Fact] https://www.palantir.com/docs/foundry/ai-fde/aip-skills/):
  - A skill has a name, a "when to use" description and a Markdown body.
  - Skills are stored as Foundry resources and inherit folder permissions.
  - Each user has a personal skill set. Admins can promote skills to groups.
  - The agent picks skills by their description, so vague descriptions mean the skill is not loaded.
  - The same skills concept is used in Analyst and Boardroom.

### 8. How it is delivered: forward-deployed engineers

> Source: [general-references/06-palantir-business.md § 8. How it is delivered: forward-deployed engineers](../../general-references/06-palantir-business.md#8-how-it-is-delivered-forward-deployed-engineers)

Plain English: instead of handing over software and leaving, Palantir puts a few of its own engineers inside the customer for months to connect systems and build the first workflows. Product engineers back home turn what works into reusable features.

- **Roles.** The Delta, or forward-deployed software engineer, sits in Business Development, supports a single customer, writes and configures code, meets stakeholders and sometimes contributes code back to the product: "one customer, many capabilities". The Dev, or software engineer, owns a platform component for all customers: "one capability, many customers". Deltas spend "a couple of days most weeks" at customer sites, with stints abroad of about six months. [Vendor claim, Palantir blog "Dev versus Delta", undated, https://blog.palantir.com/dev-versus-delta-demystifying-engineering-roles-at-palantir-ad44c2a6e87] Echo is commonly described as the business-facing deployment strategist who frames the problem and manages users. a16z confirms that "Deltas" and "Echoes" are internal FDE jargon, but I could not open a primary description of Echo. [Unverified for the Echo definition; a16z, 16 Jan 2026]
- **Team size and duration.** Teams of 4 to 5, onsite 3 to 4 days a week, pilots of 8 to 12 weeks; Qureshi spent about a year at Airbus in Toulouse. [Secondary, Qureshi 2024] 2026 data points: 4 FDEs at Elmet built 10 apps in 2 months; 6 FDEs at GE Aerospace; L3Harris built an MVP in 12 weeks. [Vendor claim, AIPCon 9 and 11]
- **Commercial framing.** Services drive adoption rather than generate revenue. Deals start small (bootcamp plus limited licences) and shift toward subscription. Pricing is fixed-fee rather than per seat. [Secondary, a16z, https://a16z.com/the-palantirization-of-everything/] Karp at AIPCon 11 (Sep 2026) said Palantir gets paid after it creates value, and that FDEs are needed to rebuild the Ontology and post-train models. [Vendor claim]
- **"AI FDE".** This is a product named on the Q3 2026 call and in Developer Tier community posts. The CTO said service members can build integrations with legacy sensors in hours using it. [Vendor claim; product internals are out of scope here]
- **Services in revenue recognition.** Professional services (support, configuration, training, ontology modelling) are recognised over the service term. Cloud and on-premises subscriptions include O&M and are recognised ratably. [Fact, 10-Q]

## Lingyang, AgentOne and Alibaba

### 9. Delivery model, partners and the FDE

> Source: [general-references/07-lingyang-agentone.md § 9. Delivery model, partners and the FDE](../../general-references/07-lingyang-agentone.md#9-delivery-model-partners-and-the-fde)

- The FDE role: define the scenario, design the solution, prepare data, drive agent build and system integration, turn senior staff's tacit know-how into AI-executable SOPs, tune in use, and feed productised capabilities back into AgentOne [Vendor claim, sohu; mydrivers].
- Effort: Yadi needed 24 days and 78 interviews [Press]. A large pharma client expected 3 to 5 years to build agents and took about 1.5 years on a solid data foundation [Press, LatePost].
- Partners and ecosystem: Alibaba Cloud Research Institute (the "AI超级公司" white paper, a survey of 500 managers and 1,500 practitioners) [tmtpost]; TMIC, 店小蜜, Amap, 聚石塔 [leiphone; tmtpost]; Baozun [product page]. Third-party partners are expected to add industry agents [tmtpost]. No formal partner programme document was found [Unverified].

## Other companies and products

### Sierra deployment process and team structure

> Source: [general-references/12-agent-companies.md § Sierra deployment process and team structure](../../general-references/12-agent-companies.md#sierra-deployment-process-and-team-structure)

- Agent engineers design, build and maintain agents with customers. They build reusable higher-order components and scope deeply with the customer's technical team. A demo takes about an hour; production reliability across millions of conversations is the real work. [Vendor claim] https://sierra.ai/blog/meet-the-ai-agent-engineer
- "Product Manager, Agent Development" (the agent PM): assesses requirements, demos, advises executives, ships agents with engineers, and feeds the product roadmap. Listed pay $180k to $390k. There are variants for flagship deployments, financial services, public sector and Spanish speakers. [Fact, job post] https://jobs.thrivecap.com/companies/sierra-2-90e5d64d-40bb-415e-bbca-4108552c8ee9/jobs/43095444-product-manager-agent-development
- Time to live: a $40B+ US retailer went live 27 days after the first meeting. A large healthcare company took seven weeks from kickoff. Singtel took under 10 weeks. [Vendor claim] https://sierra.ai/blog/our-customers-ambition-is-accelerating-our-growth ; https://sierra.ai/blog/year-two-in-review ; https://sierra.ai/customers
- Rollout pattern (WeightWatchers): start on a small slice of traffic and a few intents, have IT and security stress-test with misuse requests, then widen. [Vendor claim] https://sierra.ai/customers/weightwatchers

## Design decisions already in the reference maps

### 16. Delivery sequence turned into a self-setup flow (diagnosis, seven-day build, before and after report)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 16. Delivery sequence turned into a self-setup flow (diagnosis, seven-day build, before and after report)](../../general-references/31-map-lingyang-alibaba-offers.md#16-delivery-sequence-turned-into-a-self-setup-flow-diagnosis-seven-day-build-before-and-after-report)

**Purpose.** Replace forward-deployed engineers with a fixed, mostly self-serve setup that proves value on the buyer's own ledger within days and ends with a before and after report. Receivables example: on day 0 the finance manager uploads an ageing report; the product shows the "before" (overdue amount, DSO, invoices with no contact in 30 days); two weeks later it shows the same figures for the share of the ledger it ran.

**Design to implement.**
- Lingyang's seven-day programme [Press, 07 §3]: (1) topic selection with the company; (2) mapping data, processes, systems and acceptance metrics; (3) build and validate on AgentOne, then the knowledge base and agent; (4) handover with a before/after comparison report. Resources: free one-day FDE diagnosis and a 150,000-credit starter pack. Benchmark: 110+ operating metrics across 5 segments mapped in 7 days for a 150-store company.
- Palantir's bootcamp: 1 to 5 days; stage 1 intuition, stage 2 hands-on, stage 3 deploy initial use cases and plan the MVP; ends with a written plan [Vendor claim, 06 §7].
- 25 row 39: a fixed two-week pilot: connect data, map the template, run reminders on a share of the ledger, report collected amount and DSO before and after.
- Self-setup flow [Inference, combining the above]:
  1. **Diagnosis (day 0, self-serve).** Upload an ageing export or connect read-only. The product computes the baseline metrics and freezes them as the "before" snapshot. Output: a one-page diagnosis.
  2. **Acceptance metrics (day 0).** The buyer picks 2 or 3 from the metric set (DSO, collected amount, promise-kept rate, days to first contact). Copy Lingyang's co-defined acceptance metrics.
  3. **Connect and map (days 1 to 2).** Map the customer's fields onto the template with input mapping, as Palantir's Marketplace installs a packaged use case with input mapping [Fact as listed, 25 A2.4]. Run strong quality checks; nothing proceeds while one fails.
  4. **Policy and glossary (day 3).** The finance owner edits the dunning table, templates and glossary, then publishes.
  5. **Shadow mode (days 4 to 7).** Drafts only; the collector approves or rejects; the approval log fills.
  6. **Live on a share of the ledger (days 8 to 14).** Sending on for the chosen share; everything still approved.
  7. **Report (day 14).** Before and after on the chosen metrics, plus approval rate and time saved.
- Trial safety: outbound sending disabled until approval (25 row 40).
- Founder runs onboarding personally for the first customers, then replaces it with an onboarding assistant that maps fields and proposes them for approval (25 rows 34 and 42).

**Copies.**
- 07, §3 seven-day programme. https://www.sohu.com/a/1080187818_115035
- 06, §7 bootcamps. https://www.hannovermesse.de/apollo/hannover_messe_2024/obs/Binary/A1354173/Palantir%20AIP%20Bootcamp.pdf
- 25, C6 rows 34, 35, 39, 40, 42; What to copy 1 and 2. https://www.palantir.com/docs/foundry/foundry-devops/create-products

**Left out, and why.** On-site interviews at Yadi scale (78 interviews, 24 days) [Press, 07 §3]: does not fit a solo founder.

**Open questions.** Whether 14 days is long enough to see payments move on 30-day terms; the documents give no collections baseline [Inference].

### 17. Deployment process, roles and time to live

> Source: [general-references/34-map-agent-companies.md § 17. Deployment process, roles and time to live](../../general-references/34-map-agent-companies.md#17-deployment-process-roles-and-time-to-live)

**Purpose.** Get a customer live quickly with little staff time from a solo founder. Example: week 1 connect ledger and email, load the basics pack, run sims; week 2 allowlist 20 debtors; week 4 widen.

**Design to implement.**
- **Path:** connect sources → wait for full sync → validate permissions by searching as restricted users → ingest SOP/policy and past threads into the builder → apply starter pack → auto-generated simulations → allowlist pilot on a small slice (one surface, about 10% of debtors, a few intents) → misuse testing by the customer's IT → widen.
- **Roles in the product** (replacing the vendors' human pairs): tenant admin, procedure editor, named reviewers (§4), compliance owner, agent owner. The vendor roles they replace: Sierra's agent engineer plus "Strategist, Agent Development" (formerly agent PM); Decagon's Agent Product Manager plus Agent Deployment Engineer.
- **Self-sufficiency:** short certification-style onboarding modules (Decagon University ~51 minutes, ten modules).
- **Customer usage analytics agent** for admins (Command Center): usage by department and recommendations for what to enable next.
- **Agent ROI dashboard** as a standard screen.

**Copies.**
- doc 12 and doc 19 §6: agent engineers, agent PM / Strategist role, time to live 27 days to 10 weeks [Vendor claim], WeightWatchers rollout pattern. https://sierra.ai/blog/our-customers-ambition-is-accelerating-our-growth ; https://sierra.ai/customers/weightwatchers ; https://jobs.thrivecap.com/companies/sierra-2-90e5d64d-40bb-415e-bbca-4108552c8ee9/jobs/52580191-strategist-agent-development
- doc 18 §6, Key finding 12: APM + ADE, one surface ~10% of customers then ramp, "within days" logic flows, University modules. https://decagon.ai/blog/agent-deployment-engineering ; https://saastr.com/from-zero-to-eight-figures-in-18-months-decagon-ceos-playbook-for-ai-native-saas-growth-and-why-they-partnered-with-accel/ ; https://decagon.ai/modules/decagon-platform
- doc 21 §6: deployment order, permission validation before enabling agents. https://docs.glean.com/connectors/connectors-power-glean
- doc 20 §1.6: Meta's seven-step platform setup and allowlist testing; self-serve. https://360dialog.com/blog/?p=1433
- doc 12, Harvey Command Center. https://www.harvey.ai/blog/introducing-command-center
- doc 20 §9: Oracle agent ROI dashboard. https://www.oracle.com/in/applications/fusion-ai/ai-agents/

**Left out, and why.** Forward-deployed teams and GSI partners per account (doc 12, 18, 19 all say a solo founder cannot staff this). Air-gapped and customer-VPC deployments (Decagon) and Glean Customer Hosted.

**Open questions.** Realistic time to live for a 100 to 1,000-staff firm with no vendor staff (no document gives one; Glean's is unpublished).

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No open-source implementations material in the research yet.
- No research literature material in the research yet.
