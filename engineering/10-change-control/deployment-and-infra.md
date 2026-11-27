# Deployment and infra

**Layer:** [10-change-control](README.md) · **What it is:** Where it runs: continuous delivery, deployment options, infrastructure and the bill of materials.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (4) · [Open-source implementations](#open-source-implementations) (1) · [Other companies and products](#other-companies-and-products) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Palantir

### B1. Apollo (continuous delivery across many environments)

> Source: [general-references/05-palantir-apps-infra.md § B1. Apollo (continuous delivery across many environments)](../../general-references/05-palantir-apps-infra.md#b1-apollo-continuous-delivery-across-many-environments)

**Plain English.** Palantir ships hundreds of services into hundreds of customer environments, some with no internet. A central brain is told "environment X runs product Y and follows the STABLE channel; it may upgrade between 01:00 and 04:00; product Y needs auth-service between 1.2 and 1.x". The brain keeps working out safe next steps and hands them to a small agent in each environment, which pulls them, executes them and reports back.

**Architecture** ([Fact](https://www.palantir.com/docs/apollo/core/overview), [Fact](https://palantir.com/docs/apollo/core/how-apollo-works/), [Fact](https://www.palantir.com/assets/xrfr7uokpv1b/2gFvOhbnVSqDVQ0iMZDtLg/bdb6b7a6a02bfa9edd8f4d4716248dfb/Apollo_WP_H1_-25_VX.pdf)):
- **Hub:** runs the Orchestration Engine. Its inputs are:
  - the Product Catalog: releases, channel membership, recall status, dependencies, schema versions;
  - environment settings: installed products, channel subscriptions, windows. Changes to these go through change management with approvals;
  - central observability: the reported state of every entity.
- **Hub variants:** a Main Hub (SaaS), and Remote Hubs inside isolated networks that are synced by an "Apollo bundle". The bundle is the air-gap mechanism.
- **Spoke Control Plane:** runs on Kubernetes, or container-less. Its agents report state (version, config, liveness and readiness, telemetry) and **poll** for Plans. It is a pull model.
- **Release manifest:** metadata only, needing no code changes. The Catalog takes coordinates from CI; code stays in the customer's own artifact store.
- **Plan types:** install, change config, upgrade plus config in lockstep, uninstall, and secret create/edit/delete ([Fact](https://www.palantir.com/docs/apollo/core/plans-and-constraints)).
- **Constraints:**
  - **Maintenance window:** resolved as product, then entity, then environment. A recalled-release roll-off ignores windows by default.
  - **Product dependency:** `minimum-version` and `maximum-version` in the manifest. A Plan runs only if neither the target nor any dependent breaks.
  - **Suppression window:** manual, or automatic on Plan failure or during promotion soak. If too many entities are auto-suppressed, an environment-wide suppression starts.
  - **Artifacts missing:** registries are probed before install or upgrade.
- **Re-planning triggers:** a dependency's state changes, settings change, config or secrets change, a new release appears, a recall happens, or a Plan has been blocked for more than 4 h. A change re-plans the entity and its direct dependencies and dependents only.
- **Priority:** recalled-release roll-offs and break-glass commands first.
- **Release channels** ([Fact](https://palantir.com/docs/apollo/core/release-channels/)):
  - Defaults are `DEV`, `RELEASE_CANDIDATE` and `RELEASE`, routed by version type.
  - Promotion is automatic, manual, or by pipeline, with label and health criteria during windows.
  - Soak timeout is 2× the soak duration, counting weekday hours only. Waiting for canaries times out after 7 days. Overall promotion times out after 30 calendar days.
- **Failure handling:** a failed Plan leads to entity-level auto-suppression and a rollback Plan if the state changed. A failing release is auto-recalled, and every environment rolls off it.
- **Recall roll-off strategies:** stay, stay with exceptions, move to newer, or roll back to a known-safe version ([Fact](https://www.palantir.com/assets/xrfr7uokpv1b/2gFvOhbnVSqDVQ0iMZDtLg/bdb6b7a6a02bfa9edd8f4d4716248dfb/Apollo_WP_H1_-25_VX.pdf)).
- **Security:**
  - A container-scan integration auto-recalls images that fail.
  - Remediation SLAs are set by severity; the examples are 24 h for an emergency CVE and 60 days for a medium one.
  - A release is flagged "stale" if it has sat on a stable channel for more than 5 days without rolling out.
- **Scale** (white paper, H1 2025) [Vendor claim]: 250+ teams, 700+ environments, 400+ services, 70,000+ entities upgraded daily. Log4j was remediated across 200+ environments within hours.
- **Demo Day, 27 Apr 2022** (Shyam Sankar, Greg DeArment, Sean Hacker) ([Vendor claim](https://investors.palantir.com/files/Apollo%20Demo%20Day%20-%20Transcript%20EN.pdf)):
  - storage services declare schemas and migration steps at compile time, so upgrade and rollback are data-safe;
  - SLOs and monitors live in the artifact;
  - the demo showed an automatic recall of 1.23.0 on canaries, then 1.23.1 passing soak;
  - at the time, 250+ customer environments.
- **Edge:** version differencing sends only delta packets, scaling to "hundreds of thousands of devices" ([Vendor claim](https://www.palantir.com/assets/xrfr7uokpv1b/ECuz16kcqKOQ2P0jBBnVy/fd84e054ee75b9baf9151851d1c30bf9/ApolloForEdge.pdf); the document says its data is notional).

### B2. Rubix

> Source: [general-references/05-palantir-apps-infra.md § B2. Rubix](../../general-references/05-palantir-apps-infra.md#b2-rubix)

[Fact](https://palantir.com/docs/foundry/architecture-center/rubix/)
- **What it is:** Palantir's hardened, autoscaling Kubernetes, which runs AIP, Foundry and Apollo.
- **Nodes:** no node lives longer than 48 hours. Draining uses policy-driven node selection.
- **Isolation:** privileged operations are separated from application execution.
- **Security:** encryption everywhere. Every workload-to-workload call is authenticated, authorized and logged, under immutable config.
- **Deployment pattern:** every service runs multi-node with blue/green rollout. Green nodes are built and monitored, traffic shifts over, and blue nodes are destroyed.
- **Clouds:** AWS, Azure, GCP, Oracle and on-prem.
- **Accreditations:** FedRAMP High, IL5/IL6 and CMMC.
- **Origin:** the 48h-ephemeral idea traces to a KubeCon EU 2019 talk, "Running Kubernetes on Ephemeral Infrastructure" by Greg DeArment and Vlad Ungureanu. I found the slides but could not open them (URL too long) [Unverified content].

### B3. Open-source microservice practices (github.com/palantir), read from cloned code

> Source: [general-references/05-palantir-apps-infra.md § B3. Open-source microservice practices (github.com/palantir), read from cloned code](../../general-references/05-palantir-apps-infra.md#b3-open-source-microservice-practices-githubcompalantir-read-from-cloned-code)

- **Conjure** ([Fact, code](https://github.com/palantir/conjure)):
  - **Pipeline:** API defined once in YAML, compiled to a JSON intermediate representation (IR), then generators produce Java, TypeScript, Python, Rust and Go.
  - **Wire spec rules:**
    - clients must tolerate unknown fields, enum variants and union variants;
    - servers must reject unknown fields;
    - servers tolerate extra headers;
    - `OPTIONS`/CORS support is required.
  - **Errors** are JSON `{errorCode, errorName "Namespace:Name", errorInstanceId uuid, parameters}` with fixed code-to-HTTP mappings (for example PERMISSION_DENIED→403, INVALID_ARGUMENT→400).
  - Foundry's own API errors use the same shape (`errorName`, `parameters`, `errorInstanceId`) ([Fact](https://www.palantir.com/docs/foundry/slate/concepts-queries/)).
  - **Lesson:** schema-first APIs with forward-compatible clients. The structured error envelope is worth copying for agent tool errors.
- **Witchcraft** (witchcraft-go-server) ([Fact, code](https://github.com/palantir/witchcraft-go-server)):
  - **Config:** install config (static) and runtime config (hot-reloaded `runtime.yml`), with encrypted config values. The server will not start if install config has encrypted values but no key.
  - **Status endpoints:** `/status/liveness`, `/status/readiness` and `/status/health`, optionally on a separate management port.
  - **Diagnostics:** `/debug/diagnostic/{type}` serves profiles and metric names.
  - **Security:** HTTPS only.
  - **Logging:** every route emits request, trace and metric logs, with safe/forbidden parameter lists for log redaction.
  - **Lesson:** a standard service chassis, so that Apollo can treat every service the same way.
- **sls-packaging** ([Fact, code](https://github.com/palantir/sls-packaging)):
  - the Service Layout Specification tarball has the structure `deployment/manifest.yml`, `service/bin`, `service/monitoring/bin/check.sh`, `var/`;
  - product dependencies (min, max, recommended, optional) are inferred from libraries;
  - a `product-dependencies.lock` is checked in, and non-overlapping ranges fail the build.
  - This is the producer side of Apollo's dependency constraint.
- **AtlasDB** ([Fact, code](https://github.com/palantir/atlasdb)):
  - a transactional layer over key-value stores (Cassandra, Postgres), offering snapshot isolation or serializable SI, with conflict handlers per table;
  - it supports online migration between backing stores through dual-write, backfill, then a read flip.
  - **Lesson:** Palantir built transactions above dumb storage. A small product should just use Postgres [Inference].
- **Tritium** ([Fact, code](https://github.com/palantir/tritium)): annotation-driven instrumentation of service interfaces for latency percentiles, rates and cache statistics.
- **policy-bot and bulldozer** ([Fact, code](https://github.com/palantir/policy-bot)):
  - policy-bot is a GitHub App for approval policies on pull requests: rules with predicates combined with and/or, a disapproval policy, and a simulation API.
  - bulldozer auto-merges once checks and reviews pass.
  - **Lesson:** the policy-bot rule model (predicates plus required approvers combined with and/or) is a good template for Action/Proposal approval policies [Inference].

### B5. Deployment options

> Source: [general-references/05-palantir-apps-infra.md § B5. Deployment options](../../general-references/05-palantir-apps-infra.md#b5-deployment-options)

- **Palantir-managed SaaS** is the default implied by the docs [Inference from wording].
- **Customer cloud:** the OCI reference architecture describes it as single-tenant, either in the customer's tenancy or in Palantir's OCI tenancy on the customer's behalf, and not self-deployable ([Fact](https://docs.oracle.com/en/solutions/palantir-foundry-ai-platform-on-oci/index.html)):
  - one deployment per tenancy, with a VCN of a public and a private subnet;
  - control plane and data plane in an autoscaling instance pool;
  - up to 3 egress routers;
  - a NAT path to Palantir's management plane and Apollo;
  - VPN or FastConnect, or an on-prem agent, for private sources;
  - audit logs archived to object storage within 24 h.
- **Self-hosted / on-prem / bare metal** ([Fact](https://palantir.com/docs/foundry/security/protect-foundry-installation/)):
  - the customer owns physical security, disk encryption, TLS 1.2+, SSO/MFA, network isolation and patching;
  - "Rescue" handles application backup and restore;
  - Apollo-connected sites get security updates automatically, while unconnected sites must patch critical issues within 30 days.
- **Edge:** Apollo for Edge (see B1).

## Open-source implementations

### Recommended bill of materials (TypeScript + PostgreSQL, one person)

> Source: [open-source-references/README.md](../../open-source-references/README.md) (code study)

**Depend on (permissive licence, TypeScript-callable):**

| Need | Dependency | Licence | Note |
|---|---|---|---|
| Database | PostgreSQL 16/17 + `pgvector` | PostgreSQL / PostgreSQL-style | Holds everything: model, objects, graph, vectors, audit, jobs |
| Schemas | `zod` | MIT | One schema serves validation, MCP tool input and forms (operational-ontology pattern) |
| Agent interface | `@modelcontextprotocol/server` v2 (2.4.0) | Apache-2.0 | Implements the stateless 2026-07-28 spec [Fact] |
| Durable workflows | `@dbos-inc/dbos-transact` (MIT core) | MIT (enterprise features proprietary) | Write-back steps, long agent tasks; avoid the gated features [Fact] |
| Simple queues (alternative) | `pg-boss` 12 | MIT | If DBOS feels too heavy |
| Action authorization | `@cedar-policy/cedar-wasm` 4.15 | Apache-2.0 | Yes/no decisions; no resource queries in the wasm build [Fact] |
| Decision tables (optional) | `@gorules/zen-engine` 2.1.12 | MIT | Business-editable tables with traces |
| Metric compilation (optional) | MetricFlow sidecar binary | Apache-2.0 | NDJSON `explain` → Postgres SQL [Fact]; Python-built binary |
| Document parsing | Docling as an HTTP service | MIT | Separate container [Inference] |
| Entity resolution (batch) | Splink 5 against Postgres | MIT | Python batch job [Fact] |
| Prompt/tool regression | promptfoo | MIT | CI only |
| Agent graph (optional) | `@langchain/langgraph` + `@langchain/langgraph-checkpoint-postgres` | MIT | Only if you want its interrupt and checkpoint machinery |
| Model access | Provider SDKs (Anthropic, OpenAI, DashScope/OpenAI-compatible for Qwen) | Vendor terms | Keep your own loop model-agnostic [Inference] |

**Copy the design of (write it yourself in TypeScript):**
- Ontology definition and runtime: operational-ontology (model-as-data, authority, action gate, MCP generation).
- Action IR, validate/apply, submission-criteria conditions, ObjectSet algebra: osdk-ts and foundry-platform-python.
- Action authorization-policy fields and the schema outbox: CapTrix (AGPL, so design only).
- Tenant RLS, resource-role grants, markings: Przyval/openfoundry.
- Metric definitions and join rules: MetricFlow (if you do not use the sidecar).
- Metric and row access policies: Cube.
- AI context fields: Ossie.
- Temporal facts and invalidation: Graphiti.
- Graph tables and BFS: LightRAG `pgtable_impl`.
- Identity and index fields: Cognee.
- Two-phase ingestion: mycontext (ELv2, so design only).
- Rule-derived links and bilingual labels: KAG.
- SOP executor/verifier: AgentScope.
- Hooks, permission decisions, session store: Claude Agent SDK.
- Error codes and log safety: Conjure.
- Branches and proposals, confirm-preview: OntoForge.
- Connector config grammar (pagination, incremental cursors, parent-child resources): dlt `rest_api`.
- Evaluation: tau2-bench.

**Write from scratch:**
- The Postgres schema for definitions (versioned), objects, links, overlay, audit and outbox.
- The ObjectSet-to-SQL compiler with marking and RLS predicates folded in.
- The action runtime with idempotency and pending-invocation records.
- The 5–10 connectors and OAuth flows your first customers need.
- The model-agnostic agent loop (tool calling across Claude, GPT and Qwen).
- The internal versus external agent separation (different tool sets generated from the same model with different visibility and marking filters).
- The ontology editor UI.
- Trace storage, either OpenTelemetry to your own table or self-hosted Phoenix for internal use.

---

## Other companies and products

### 6. Infrastructure for a small multi-tenant deployment

> Source: [general-references/13-cost-and-economics.md § 6. Infrastructure for a small multi-tenant deployment](../../general-references/13-cost-and-economics.md#6-infrastructure-for-a-small-multi-tenant-deployment)

Plain English: besides model calls, you pay for a database, servers to run the app and background jobs, and tools to see what the agent did and what broke.

List prices [Fact]:
- **Supabase** (https://supabase.com/pricing): Pro from $25/month; Team from $599/month (SOC 2 report, HIPAA add-on); compute Micro $10 to 16XL $3,730; disk $0.125/GB; PITR $100/month per 7 days of retention.
- **Neon** (https://neon.com/pricing): Launch $0.106 per CU-hour; Scale $0.222 per CU-hour (SOC 2 and HIPAA); storage $0.35 per GB-month.
- **Render** (https://render.com/pricing): Pro workspace $25, Scale $499; services $25 (1 CPU / 2 GB) to $300 (8 CPU / 16 GB); Postgres $55 (1 CPU / 4 GB) to $800 (16 CPU / 64 GB); Key Value from $10.
- **Inngest** (https://www.inngest.com/pricing): Pro from $99 with 1M executions; Business $499 with 10M.
- **Langfuse** (https://langfuse.com/pricing): Core $29; Pro $199 (SOC 2 / ISO reports) with 100k units, then $8 per 100k; Enterprise $2,499.
- **Sentry** (https://sentry.io/pricing/): Team $29, Business $89.

| Line | 10 customers | 100 customers | 1,000 customers |
|---|---|---|---|
| App hosting (Render) | Pro $25 + 3 × $25 services = $100 | 4 web + 4 worker × $85 (2 CPU / 4 GB) + $25 = $705 | 12 web + 12 worker × $300 (8 CPU / 16 GB) + Scale $499 = $7,699 |
| Postgres + pgvector (Neon Scale for SOC 2) | ~1 CU × 730 h × $0.222 = $162 + 20 GB × $0.35 = $7 → ~$170 | ~4 CU avg = $648 + 200 GB = $70 + headroom → ~$800 | ~16 CU = $2,593 + 2 TB = $700 → ~$3,300 |
| Redis / KV | none | $60 | $200 |
| Job queue / workflows | Inngest Pro $99 (or a Postgres queue at $0) | $99 | Inngest Business $499 |
| LLM tracing (Langfuse Pro) | $199 | 2M units → $199 + 19 × $8 = $351 | 20M units → ~$1,800 (or self-host) |
| Errors (Sentry) | $29 | $89 | ~$300 with overage |
| **Total / month** | **≈ $600** | **≈ $2,100** | **≈ $13,800** |
| Per customer | ≈ $60 | ≈ $21 | ≈ $14 |

All rows are [Estimate]. The trace-unit volumes assume about 2,000 agent requests per customer per month and about 10 observations per request.

- Compared with design C's model cost of about $30 per customer, infrastructure and model costs are similar in size. The total technical cost of goods is about $50 to $90 per customer per month [Estimate].
- Supabase Team ($599) is the simplest way to get a vendor SOC 2 report on the database layer. Neon Scale has SOC 2 at usage pricing [Fact on plan availability].
- Shared-schema multi-tenancy with row-level security keeps one database for everyone up to hundreds of customers. Database-per-tenant multiplies the fixed minimums [Inference].

### 3.7 Deployment architecture

> Source: [general-references/21-glean.md § 3.7 Deployment architecture](../../general-references/21-glean.md#37-deployment-architecture)

- Two models. Glean Hosted: a single-tenant instance on GCP, with regions on GCP and AWS. Customer Hosted (formerly "Cloud-Prem"): Glean runs the tenant as a managed service inside the customer's GCP or AWS project, with the customer's VPC-SC, SCP, EDR (CrowdStrike, Wiz) and IDS controls. Glean still does upgrades and keeps support access. No manual patching is allowed. AES-256 at rest, TLS in transit ([Fact](https://docs.glean.com/get-started/prepare/about-deployment)). Azure and on-premises are not offered per this page.
- Certifications: ISO 42001, ISO 27001, SOC 2 Type II and HIPAA ([Vendor claim](https://glean.com/blog/agentic-security-aware), Mar 2026). SOC 2 reports are available under NDA via the Trust Portal ([Fact](https://docs.glean.com/security)). FedRAMP and ISO 27701 status: [Unverified]. **Sources disagree on clouds.** The AWARE post says single-tenant deployment is available on AWS, Azure or GCP. The deployment docs list only GCP and AWS for Customer Hosted ([Fact](https://docs.glean.com/get-started/prepare/about-deployment)).

## Design decisions already in the reference maps

### 22. Infrastructure cost by customer count

> Source: [general-references/32-map-research-and-cost.md § 22. Infrastructure cost by customer count](../../general-references/32-map-research-and-cost.md#22-infrastructure-cost-by-customer-count)

**Purpose.** Know the non-model running cost as the customer count grows.

**Design to implement.**
- Shared-schema multi-tenancy with Postgres RLS: one database for everyone up to hundreds of customers. Database-per-tenant multiplies the fixed minimums.
- Managed Postgres with pgvector, with SOC 2 (Neon Scale, or Supabase Team at $599).
- App and worker hosting.
- Job queue: a Postgres queue at $0, or Inngest.
- LLM tracing (Langfuse) and error tracking (Sentry).

**Table, re-stated with a recheck (document 13, section 6, all [Estimate]).**

| Line | 10 customers | 100 customers | 1,000 customers |
|---|---|---|---|
| App hosting (Render) | $100 | $705 (8 × $85 + $25) ✓ | $7,699 (24 × $300 + $499) ✓ |
| Postgres (Neon Scale) | ~$170 (730 h × $0.222 = $162 + $7) ✓ | ~$800 ($648 + $70 + headroom) ✓ | ~$3,300 ($2,593 + $700) ✓ |
| Redis/KV | $0 | $60 | $200 |
| Jobs (Inngest) | $99 | $99 | $499 |
| Langfuse | $199 (recheck: 200k units → $207) | $351 ✓ | ~$1,800 ($1,791) ✓ |
| Sentry | $29 | $89 | ~$300 |
| **Total** | **≈ $600** (recheck ≈ $605) | **≈ $2,100** ✓ | **≈ $13,800** ✓ |
| Per customer | ≈ $60 | ≈ $21 | ≈ $14 |

The arithmetic holds. The one slip: at 10 customers the stated trace volume (10 × 2,000 requests × 10 observations = 200k units) exceeds Langfuse Pro's 100k included units, adding $8. The model plus infrastructure cost of goods is therefore about $50–90 per customer per month at design C.

**Copies.** Document 13, section 6. https://neon.com/pricing ; https://render.com/pricing ; https://www.inngest.com/pricing ; https://langfuse.com/pricing ; https://sentry.io/pricing/ ; https://supabase.com/pricing

**Left out.** Dedicated GPUs (section 20).

**Open questions.**
- SOC 2 is the larger fixed cost. Drata puts the first year at $25k–$50k; one 12-person startup itemised $47.2k [Self-reported].
- Build tooling runs about $400–1,200 a month [Estimate].

### 18. Complete bill of materials

> Source: [general-references/33-map-context-code-integration.md § 18. Complete bill of materials](../../general-references/33-map-context-code-integration.md#18-complete-bill-of-materials)

| Component | Choice | Depend on / copy design / write from scratch | Licence | Reason | Source file worth reading |
|---|---|---|---|---|---|
| Database | PostgreSQL 16/17 + pgvector | Depend on | PostgreSQL / PostgreSQL-style | Holds model, objects, graph, vectors, audit, jobs (doc 14 BOM) | https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/postgres_impl.py |
| Schemas and validation | `zod` | Depend on | MIT | One schema for validation, MCP input and forms (doc 14) | https://github.com/gura105/operational-ontology/blob/HEAD/src/core.ts |
| Model schema (objects, links, metrics, ai_context, verified queries, instructions) | Own Zod model copying Ossie, Snowflake, dbt, Fabric fields | Copy design | n/a (Ossie Apache-2.0) | Converged object set (doc 11) | https://github.com/apache/ossie/blob/main/core-spec/spec.md |
| File format | Ossie ontology + semantic + mapping YAML, plus own actions and policies YAML | Copy design; write exporter | Apache-2.0 spec | Portable, Git-reviewable; Ossie lacks actions and permissions | https://github.com/apache/ossie/blob/main/ontology/ontology.md |
| Branches and proposals | OntoForge pattern | Copy design | MIT | Reviewed schema changes, instance data not branched | https://github.com/jachenms/OntoForge/blob/HEAD/python/src/ontoforge/branches.py |
| Schema change events | Transactional outbox | Copy design (AGPL source) | AGPL-3.0 source; own code | Before/after envelopes in same transaction | https://github.com/CapTrix/openfoundry/blob/HEAD/services/ontology-actions-service/internal/repo/events.go |
| Tenant isolation | Forced Postgres RLS + `SET LOCAL` | Copy design | Apache-2.0 source | Database refuses cross-tenant rows | https://github.com/Przyval/openfoundry/blob/HEAD/db/migrations/009_multi_tenancy.sql |
| Markings and resource roles | Mandatory/discretionary evaluator + grants table | Copy design | Apache-2.0 source | Label filters for agents and documents | https://github.com/Przyval/openfoundry/blob/HEAD/packages/markings/src/marking-evaluator.ts |
| Object access policies | Cube policy object compiled to SQL predicates | Copy design; write compiler | Apache-2.0 source | Most complete open design for rows, members, masking | https://github.com/cube-js/cube/blob/HEAD/packages/cubejs-server-core/src/core/CompilerApi.ts |
| Action authorisation | `@cedar-policy/cedar-wasm` 4.15 | Depend on | Apache-2.0 | Yes/no decisions; no resource queries in wasm | https://github.com/cedar-policy/cedar/blob/HEAD/cedar-wasm/Cargo.toml |
| Relationship sharing (v2) | OpenFGA tuple table | Copy design | Apache-2.0 | Only if sharing graphs get deep | https://github.com/openfga/openfga/blob/HEAD/assets/migrations/postgres/001_initialize_schema.sql |
| Agent identity | Agent principals, invoker or per-step service credential, dual-principal audit | Write from scratch, copying Glean design | n/a | Agent is its own principal; no run-as-creator | https://docs.glean.com/administration/agent-identity/overview |
| OAuth, token rotation, webhook routing, proxy | Nango Cloud pay-as-you-go, own OAuth apps | Depend on (buy) | ELv2 code, used as cloud service | $50/mo floor; prebuilt ledger and email functions | https://github.com/NangoHQ/nango/blob/master/docs/snippets/generated/xero/PreBuiltUseCases.mdx |
| Sync engine | TypeScript connector contract + per-stream opaque state | Write from scratch, copying Airbyte protocol and dlt grammar | n/a (Airbyte docs ELv2 read only; dlt Apache-2.0) | Multi-tenant, small, owned edge cases | https://github.com/airbytehq/airbyte/blob/master/docs/platform/understanding-airbyte/airbyte-protocol.md |
| Ledger read rules | Xero, QBO, NetSuite rules from Airbyte manifests | Copy design (read as specification) | ELv2 (do not ship code) | Cursor, filters, budgets, soft deletes, token rotation | https://github.com/airbytehq/airbyte/blob/master/airbyte-integrations/connectors/source-quickbooks/manifest.yaml |
| Ledger API access | Xero tier, Intuit Builder→Silver, NetSuite customer licence | Depend on (pay vendors) | Commercial terms | Unavoidable; Xero no-AI-training clause | https://developer.xero.com/faq/pricing-and-policy-updates |
| Long-tail ledgers (MYOB, QB Desktop, Sage 50) | Rutter, only on demand | Depend on (buy) | Commercial | Broadest ledger list | https://www.rutter.com/accounting |
| Email | Gmail API and Microsoft Graph direct, Nango tokens; Nylas fallback | Write from scratch | Provider terms | Send from customer's mailbox; `history.list`/`watch`, delta queries | https://github.com/NangoHQ/nango/blob/master/docs/api-integrations/google-mail/webhooks.mdx |
| Document parsing | Docling HTTP service; Reducto or LlamaParse for scans | Depend on | MIT; commercial | Remittance PDFs | https://github.com/docling-project/docling/blob/HEAD/pyproject.toml |
| Durable workflows | DBOS Transact TS (MIT core, no enterprise features) | Depend on | MIT (enterprise proprietary) | Postgres-only; memoised steps for write-back | https://github.com/dbos-inc/dbos-transact-ts/blob/HEAD/src/sysdb_migrations/internal/migrations.ts |
| Simple queues (alternative) | pg-boss 12 | Depend on (optional) | MIT | If DBOS feels heavy | https://github.com/timgit/pg-boss/blob/HEAD/src/plans.ts |
| Temporal facts | Four-timestamp fact table, index-based LLM adjudication, deterministic invalidation, future-tense normaliser | Copy design | Apache-2.0 source | "What was true when" in Postgres | https://github.com/getzep/graphiti/blob/HEAD/graphiti_core/utils/maintenance/edge_operations.py |
| Graph storage | Two JSONB tables + capped BFS | Copy design | MIT source | No graph database needed | https://github.com/HKUDS/LightRAG/blob/HEAD/lightrag/kg/pgtable_impl.py |
| Ingestion of mail and docs | Two-phase (index first, LLM later, cached by chunk hash) | Copy design (ELv2 source) | ELv2 source; own code | Immediate search, replayable extraction | https://github.com/openTrinity/mycontext/blob/HEAD/kl-graph/README.md |
| Entity resolution (batch, v2) | Splink 5 against Postgres | Depend on (Python batch) | MIT | Merge customers across ledgers | https://github.com/moj-analytical-services/splink/tree/HEAD/splink/internals |
| Two-tier knowledge | Learned/modeled table, authority score, confidence-gated proposals | Write from scratch, copying Databricks and Google | n/a | Certified knowledge wins | https://docs.databricks.com/aws/en/genie/genie-ontology |
| Context assembly | Six layers, entity-first, budgeted `lookup_context` | Write from scratch, copying OpenAI, Google, ACE | n/a | Small grounded context per agent | https://docs.cloud.google.com/knowledge-catalog/docs/retrieve-data-context |
| Metric compilation | Own TS compiler with MetricFlow join matrix, 2-hop cap, key-grain `AGG` | Write from scratch, copying MetricFlow; sidecar as fallback | Apache-2.0 source | Data lives in own Postgres | https://github.com/dbt-labs/metricflow/blob/HEAD/metricflow_semantics/metricflow_semantics/model/semantics/semantic_model_join_evaluator.py |
| Metric compilation fallback | MetricFlow sidecar (`explain` NDJSON) | Depend on (optional) | Apache-2.0 | If own compiler stalls | https://github.com/dbt-labs/metricflow/blob/HEAD/sidecar/mf_ipc_protocol.py |
| Action and condition IR, ObjectSet algebra, validate/apply | Palantir SDK shapes | Copy design | Apache-2.0 | Most authoritative public action format | https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts |
| ObjectSet → SQL compiler | Own compiler with permission predicates folded in | Write from scratch | n/a | Agent query language with no raw SQL | https://github.com/palantir/foundry-platform-python/blob/HEAD/foundry_sdk/v2/ontologies/models.py |
| Error taxonomy and log safety | Conjure codes, safe/unsafe args, safety flags | Copy design | Apache-2.0 | Redaction by construction | https://github.com/palantir/conjure/blob/HEAD/docs/spec/conjure_definitions.md |
| Action gate | Parse → authorise → preconditions → effects → rolled-back preflight → authority check → pending record → write-back → commit + audit | Write from scratch, copying operational-ontology | MIT source | The only write path | https://github.com/gura105/operational-ontology/blob/HEAD/docs/IMPLEMENTATION.md |
| Precondition evaluation | Own TS evaluator of condition IR | Write from scratch | n/a | Rules as JSON, never code strings | https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts |
| Decision tables (v2) | `@gorules/zen-engine` 2.1.12 | Depend on (optional) | MIT | Business-editable tables with traces | https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs |
| Monitoring playbooks | State vs transition conditions compiled into playbook | Copy design | n/a | Reminder triggers that fire once per change | https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent |
| Agent loop | Own model-agnostic loop over Anthropic and OpenAI-compatible (Qwen) SDKs | Write from scratch | Vendor SDK terms | Multi-model requirement | https://github.com/anthropics/claude-agent-sdk-python/blob/HEAD/src/claude_agent_sdk/types.py |
| Hooks, permission results, session store | Claude Agent SDK surfaces | Copy design | Commercial Terms (do not depend) | Proven hook taxonomy | https://github.com/anthropics/claude-agent-sdk-typescript/blob/HEAD/examples/session-stores/postgres/src/PostgresSessionStore.ts |
| SOP procedures | Executor/verifier steps, `max_attempts = 3` | Copy design | Apache-2.0 source | Multi-step collections procedures | https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py |
| Agent graph (optional) | `@langchain/langgraph` + Postgres checkpointer | Depend on (optional) | MIT | Only for interrupt/checkpoint machinery | https://github.com/langchain-ai/langgraphjs/blob/HEAD/libs/checkpoint-postgres/src/migrations.ts |
| MCP server | `@modelcontextprotocol/server` v2 2.4.0, generated tools | Depend on + write generator | Apache-2.0 | Stateless 2026-07-28 spec | https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx |
| Answer evaluation | Golden query + golden result | Write from scratch, copying OpenAI | n/a | Compare results, not strings | https://openai.com/index/inside-our-in-house-data-agent/ |
| Action evaluation | tau2 reward (DB × COMMUNICATE), pass^k | Copy design | MIT source | Did the agent do the right thing | https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py |
| Prompt/tool regression | promptfoo | Depend on (CI only) | MIT | TypeScript, CI | https://github.com/promptfoo/promptfoo |
| Tracing | OpenTelemetry spans to own Postgres table; Phoenix optional internally | Write from scratch (Phoenix optional) | Phoenix server ELv2 | Small footprint | https://github.com/langfuse/langfuse/blob/HEAD/docker-compose.yml (to see what to avoid) |
| Ontology editor UI | Own UI with Plan/Act agent and diff preview | Write from scratch, copying Fabric | n/a | Proposal-first authoring | https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-ontology-agent |

---

## Earlier engineering notes (Phase 2)

### Proposed initial technology shortlist (not selected)

> Source: former `17-decisions-and-tradeoffs/architecture-hypotheses.md` (moved here in the Nov 2026 restructure)

| Concern | Candidate(s) | Why / caveat |
|---|---|---|
| Core API | TypeScript/NestJS or Go | Existing preference/skills and repo examples; benchmark team productivity and runtime needs |
| Primary DB | PostgreSQL | Transactions, RLS, JSONB, relational constraints, outbox; test graph/query load |
| Vector | pgvector or Qdrant | Keep retrieval projection distinct; test hybrid ranking and ACL filtering |
| Graph | PostgreSQL first; Neo4j/TypeDB if justified | Avoid premature graph database; graph-specific constraints may later justify it |
| Ingestion | dlt/Airbyte/custom connectors | Licensing varies; connector semantics must preserve ACLs and source identity |
| Orchestration | DBOS or Temporal | Compare durability, operational cost, licensing/package gates and TS ergonomics |
| Authorization | Postgres RLS + OpenFGA and/or OPA/Cedar | Need consistent enforcement; no single product solves all layers |
| Metrics | MetricFlow or custom typed planner | Validate semantic join constraints and source-dialect support |
| Agent runtime | Model-independent tool orchestration; LangGraph/PydanticAI candidates | Avoid provider lock-in; action server remains authoritative |
| Observability | OpenTelemetry + traces/evaluation store | Every tool/action/workflow needs correlated audit/trace IDs |

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No research literature material in the research yet.
