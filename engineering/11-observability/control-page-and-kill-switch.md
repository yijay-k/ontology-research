# Control page and kill switch

**Layer:** [11-observability](README.md) · **What it is:** One page to see every agent, its KPI and permissions, with a kill switch.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Other companies and products](#other-companies-and-products) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Other companies and products

### 6. ServiceNow AI Agents and AI Control Tower

> Source: [general-references/20-big-platform-agents.md § 6. ServiceNow AI Agents and AI Control Tower](../../general-references/20-big-platform-agents.md#6-servicenow-ai-agents-and-ai-control-tower)

[Unverified] except where linked. ServiceNow sells AI Agents inside its Now Platform for IT, HR, customer service and finance operations workflows, with AI Agent Studio, AI Agent Orchestrator, and AI Control Tower (announced Knowledge, May 2025) as a governance hub for all agents and models, including third-party ones. It acquired Moveworks (announced March 2025, about $2.85B) for employee-facing agents and data.world for its knowledge-graph catalog [Fact for data.world](https://www.techtarget.com/searchitoperations/news/366623687/ServiceNow-digs-deeper-into-data-for-AI-with-Dataworld-buy). Its Knowledge Graph tool returns table, columns and each record's `sysId`, so a later action can operate on the same records [Fact](https://www.servicenow.com/docs/r/intelligent-experiences/knowledge-graph/leverage-knowledge-graph-prebuild-integration-with-agentic-ai.html). Licensing is via Pro Plus / Pro "assist" packs [Unverified]. ServiceNow Finance Operations has collections workflow features [Unverified]. **Copy:** return record IDs from every read so actions act on the same records; a control tower that inventories every agent with owner, scope and metrics. **Relationship:** teacher.

---

### 7. Workday agents and Agent System of Record

> Source: [general-references/20-big-platform-agents.md § 7. Workday agents and Agent System of Record](../../general-references/20-big-platform-agents.md#7-workday-agents-and-agent-system-of-record)

[Unverified] except where linked. Workday announced the Agent System of Record (February 2025) to manage Workday and third-party agents like workers: onboarding, roles, permissions, cost and performance. Illuminate agents include Recruiting, Talent Mobility, Payroll, Policy, Contracts, Financial Auditing and Expense agents; it bought Sana, Paradox and Flowise in 2025. Workday Data Cloud (16 Oct 2026) adds 240+ curated business objects, a Context Layer with semantic models over MCP, Agent-Ready Tools through an Agent Gateway, and Contextual Security based on the person's relationship to the data [Vendor claim](https://blog.workday.com/en-us/four-layers-workday-data-cloud.html). **Copy:** treat each agent as a managed "worker" with a role and a cost line; relationship-based access. **Relationship:** teacher; Workday Financials customers are larger than the founder's target [Inference].

---

## Design decisions already in the reference maps

### 15. A central AI control page with a kill switch

> Source: [general-references/35-map-market-and-competitors.md § 15. A central AI control page with a kill switch](../../general-references/35-map-market-and-competitors.md#15-a-central-ai-control-page-with-a-kill-switch)

**Purpose.** One admin page lists every agent and capability, its on/off state, autonomy level, owner, recent actions, cost and agreement rate, with a kill switch that stops all agent actions at once. Example: a wrong invoice amount appears in a draft; the finance head disables the reminder agent for all customers in one click and every pending auto-send is held.

**Design to implement.**
- Inventory: every agent, its owner, version, tools, permissions (section 7), KPI (section 14), cost this month, agreement rate (section 8), last 100 actions.
- Toggles: per capability on/off ("how much the AI does") and per playbook autonomy level.
- **Kill switch** at three scopes: tenant-wide, per agent, per channel. Implemented as a row checked inside `executeAction()` on every call (not a cache that can lag) [Inference]; on activation, all queued sends are moved to the human approval queue, running workflow instances pause, an AgentDisabled event is written, and admins are notified.
- Audit log of every AI action with who, what, why and which rule, filterable and exportable; minimum 12 months (Celonis), longer for financial events.
- Registry of approved MCP servers and outside clients that may call the model (ServiceNow MCP Registry).
- MCP and OpenAPI exposure of the governed model with OAuth, application keys for development, rate limit per client (Celonis: 500 calls per minute per asset) and per-tool permission scoping (which Celonis does not document).
- Governance features stay in the base product, not a paid tier, for the target segment [Inference; document 22 notes Ramp and BILL gate audit logs and roles behind paid tiers, which is a pricing lever the founder may choose to copy instead; see Pricing].

**Copies.**
- Document 22, "2.1 BILL, What to copy" item 1: AI governance hub with per-capability on/off, autonomy level and full log. https://www.bill.com/product/ai
- Document 22, "6" (NetSuite): SuiteAgent Management Workspace showing actions and data accessed, with a kill switch. https://itwire.com/guest-articles/company-news/suiteworld-keynote-netsuite-shows-the-mechanics-of-autonomous-suite
- Document 26, "ServiceNow, Copy": inventory of agents with cost and ROI; private MCP registry. https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and
- Document 26, "Celonis, Agent interface": OAuth, app keys, 500/min. https://developer.celonis.com/mcp-server-asset/overview/
- Document 27, "B3 Maisa": 24/7 monitoring with stop-and-escalate. https://maisa.ai/product

**Left out, and why.** Cross-vendor agent discovery (ServiceNow Discover; enterprise scale). Access provenance ("why can I see this record", Rox) is version two.

**Open questions.** Whether the kill switch should also block internal (read-only) agents, or only actions with side effects.

---

## Fact-check notes

_No time-sensitive claims in this component were re-checked in the 28 Nov 2026 pass; its sources are dated 21–27 Nov 2026. See the linked references for their own open questions._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No research literature material in the research yet.
