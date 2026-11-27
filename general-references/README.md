# General references

Company, product, market and research-literature references. These are the original research documents, kept whole and unedited, so their section anchors stay stable. The engineering folder copies the relevant sections out of them by component; the "Used by" column shows where.

> **Read with the correction register.** Known errors and stale claims are listed in [research-log/corrections.md](../research-log/corrections.md). In particular, Palantir object storage (OSv1 vs OSv2) changed — read [02a](02a-palantir-osv2-current-state.md) before relying on 01, 02 or 30 for storage or ingestion order.

## Palantir

| Doc | Title | Used by (engineering components) |
|---|---|---|
| [01-palantir-data-layer](01-palantir-data-layer.md) | Palantir Foundry's data layer, bolt by bolt | 00-overview, 02-data-platform, 03-ontology-engine, 07-model-access |
| [02-palantir-ontology](02-palantir-ontology.md) | The Palantir Ontology, bolt by bolt | 01-security, 03-ontology-engine, 04-query-and-metrics, 05-actions-and-rules, 12-apps-and-integration |
| [02a-palantir-osv2-current-state](02a-palantir-osv2-current-state.md) | Palantir Ontology backend — current OSv2 reference and legacy corrections | — |
| [03-palantir-aip](03-palantir-aip.md) | Palantir AIP, the AI layer, bolt by bolt | 00-overview, 01-security, 04-query-and-metrics, 06-knowledge-and-evidence, 07-model-access, 08-agent-platform, 09-workflows, 11-observability, 12-apps-and-integration |
| [04-palantir-security](04-palantir-security.md) | Palantir Foundry/AIP security and governance, bolt by bolt | 01-security, 05-actions-and-rules, 11-observability |
| [05-palantir-apps-infra](05-palantir-apps-infra.md) | Palantir's application layer and infrastructure, bolt by bolt | 01-security, 02-data-platform, 03-ontology-engine, 05-actions-and-rules, 09-workflows, 10-change-control, 11-observability, 12-apps-and-integration |
| [06-palantir-business](06-palantir-business.md) | Palantir as a business: who buys, what for, what value is reported, how it is sold and delivered | 12-apps-and-integration |
| [25-palantir-agentone-offer-catalogue](25-palantir-agentone-offer-catalogue.md) | Palantir and Lingyang (AgentOne, Dataphin, Quick BI, Quick Audience, Quick Service) as buyer-facing offer catalogues | 00-overview |

## Lingyang, AgentOne and Alibaba

| Doc | Title | Used by (engineering components) |
|---|---|---|
| [07-lingyang-agentone](07-lingyang-agentone.md) | Lingyang (瓴羊) and AgentOne: what is public, what is documented, what is only claimed | 02-data-platform, 03-ontology-engine, 04-query-and-metrics, 08-agent-platform, 12-apps-and-integration |
| [08-alibaba-stack](08-alibaba-stack.md) | The Alibaba Cloud and Ant Group stack, read for an "organizational brain" build | 02-data-platform, 03-ontology-engine, 06-knowledge-and-evidence, 07-model-access, 08-agent-platform |
| [28-winnexo](28-winnexo.md) | WinNexo (Lingyang, Alibaba Cloud): product flow and how it operates | 03-ontology-engine, 07-model-access, 08-agent-platform, 09-workflows, 12-apps-and-integration |

## Context-layer, agent and platform companies

| Doc | Title | Used by (engineering components) |
|---|---|---|
| [11-context-layer-products](11-context-layer-products.md) | Context layer, ontology and semantic layer products: technical teardown | 03-ontology-engine, 04-query-and-metrics, 06-knowledge-and-evidence |
| [12-agent-companies](12-agent-companies.md) | Agent companies: how their products are built and how their businesses work | 01-security, 08-agent-platform, 12-apps-and-integration, 13-domain-packs |
| [18-decagon](18-decagon.md) | Decagon: full product catalogue, mechanics, commercials and lessons | 08-agent-platform, 10-change-control, 11-observability, 12-apps-and-integration |
| [19-sierra](19-sierra.md) | Sierra: full function catalogue, mechanics, commercials and lessons | — |
| [20-big-platform-agents](20-big-platform-agents.md) | Big-platform business agents: Meta, Salesforce, Microsoft, Google, Amazon, ServiceNow, Workday, SAP, Oracle, Intuit, Xero, plus OpenAI, Anthropic and Alibaba in summary | 11-observability, 13-domain-packs |
| [21-glean](21-glean.md) | Glean, in depth, with its closest rivals (Microsoft 365 Copilot and Work IQ, Atlassian Rovo, Notion AI, Dropbox Dash, Moveworks, Guru, Onyx, Atlan) | 06-knowledge-and-evidence, 08-agent-platform, 10-change-control |
| [27-more-companies-to-learn-from](27-more-companies-to-learn-from.md) | More companies to learn from: the valuable AI-agent companies most people have not heard of | — |

## Finance, receivables, integration and automation companies

| Doc | Title | Used by (engineering components) |
|---|---|---|
| [22-ramp-and-finance-platforms](22-ramp-and-finance-platforms.md) | Ramp and the finance-operations platforms: product catalogue and lessons for a receivables-and-collections agent | 05-actions-and-rules, 13-domain-packs |
| [23-receivables-competitors](23-receivables-competitors.md) | Receivables and collections automation: the direct competitors | 13-domain-packs |
| [24-integration-companies](24-integration-companies.md) | The integration and data-movement layer: Airbyte and the companies around it | 02-data-platform, 06-knowledge-and-evidence, 12-apps-and-integration |
| [26-process-and-automation-giants](26-process-and-automation-giants.md) | Process-intelligence and automation giants: what they sell, how it works, and what an agent start-up should take | 02-data-platform, 09-workflows |

## Research literature

| Doc | Title | Used by (engineering components) |
|---|---|---|
| [09-papers-knowledge-layer](09-papers-knowledge-layer.md) | The knowledge layer: what the research literature says (ontologies, retrieval, graph retrieval, structured QA, entity resolution, document parsing, numeric reasoning) | 00-overview, 02-data-platform, 03-ontology-engine, 04-query-and-metrics, 06-knowledge-and-evidence |
| [10-papers-agents-memory-eval](10-papers-agents-memory-eval.md) | Research literature and engineering guidance on agents, memory, rules, protocols and evaluation | 05-actions-and-rules, 06-knowledge-and-evidence, 08-agent-platform, 09-workflows |

## Cost and economics

| Doc | Title | Used by (engineering components) |
|---|---|---|
| [13-cost-and-economics](13-cost-and-economics.md) | Cost and economics of running an agent product on rented models | 07-model-access, 10-change-control |

## Reference maps (design decisions distilled from the docs above)

| Doc | Title | Used by (engineering components) |
|---|---|---|
| [30-map-palantir-platform](30-map-palantir-platform.md) | Reference map 1: what to copy from Palantir's platform | 01-security, 02-data-platform, 03-ontology-engine, 04-query-and-metrics, 05-actions-and-rules, 06-knowledge-and-evidence, 07-model-access, 08-agent-platform, 09-workflows, 10-change-control, 11-observability |
| [31-map-lingyang-alibaba-offers](31-map-lingyang-alibaba-offers.md) | Reference map 2: what to copy from Lingyang, Alibaba and the two offer catalogues | 00-overview, 02-data-platform, 03-ontology-engine, 04-query-and-metrics, 05-actions-and-rules, 06-knowledge-and-evidence, 07-model-access, 08-agent-platform, 12-apps-and-integration |
| [32-map-research-and-cost](32-map-research-and-cost.md) | Reference map 3: what the research literature and the cost study say to build | 02-data-platform, 03-ontology-engine, 04-query-and-metrics, 05-actions-and-rules, 06-knowledge-and-evidence, 07-model-access, 08-agent-platform, 09-workflows, 10-change-control |
| [33-map-context-code-integration](33-map-context-code-integration.md) | Reference map 4: schema, open-source building blocks and integration | 01-security, 02-data-platform, 03-ontology-engine, 04-query-and-metrics, 05-actions-and-rules, 06-knowledge-and-evidence, 08-agent-platform, 09-workflows, 10-change-control, 11-observability |
| [34-map-agent-companies](34-map-agent-companies.md) | Reference map 5: what to copy from Sierra, Decagon, Glean, Harvey and the big platforms | 05-actions-and-rules, 06-knowledge-and-evidence, 08-agent-platform, 09-workflows, 10-change-control, 11-observability, 12-apps-and-integration |
| [35-map-market-and-competitors](35-map-market-and-competitors.md) | Reference map 6: the market, the competitors and whether the first job is right | 02-data-platform, 05-actions-and-rules, 08-agent-platform, 09-workflows, 11-observability, 13-domain-packs |
