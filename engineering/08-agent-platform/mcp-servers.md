# Mcp servers

**Layer:** [08-agent-platform](README.md) · **What it is:** Exposing and consuming tools over the Model Context Protocol (builder vs consumer servers).

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Open-source implementations](#open-source-implementations) (1) · [Other companies and products](#other-companies-and-products) (1) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (3)

## Palantir

### 12. Palantir MCP vs Ontology MCP

> Source: [general-references/03-palantir-aip.md § 12. Palantir MCP vs Ontology MCP](../../general-references/03-palantir-aip.md#12-palantir-mcp-vs-ontology-mcp)

| | Palantir MCP | Ontology MCP (OMCP) |
|---|---|---|
| Audience | Builders (AI IDEs, coding agents) | Consumers (Copilot Studio, Gemini Enterprise, Claude, custom agents) |
| Scope | 89 platform tools (56 read, 33 write by my count) over Compass, datasets, media, data health, lineage, Ontology types, object queries, OSDK, code repos, Global Branching, Developer Console, compute modules, Data Connection, docs search, and `search_tools` | One Developer Console app's object types, action types and query functions |
| Writes | Can change Ontology *types*, cannot write Ontology *data*. Can create datasets but not update or delete existing ones. Every Ontology change goes through human-approved proposals. | Controlled writes through predefined Actions only |
| Auth | Foundry session or token. Local use is off by default and must be enabled in Control Panel. | OAuth 2.0 of the Developer Console app: authorization code grant (runs as the consenting user) and/or client credentials (runs as a service user, needs a confidential client). Scopes, application restrictions *and* user permissions all apply. |
| GA | Week of 22 Jun 2026 | Week of 16 Jun 2026 |

Sources [Fact]: https://www.palantir.com/docs/foundry/palantir-mcp/available-tools/ , https://www.palantir.com/docs/foundry/palantir-mcp/security/ , https://palantir.com/docs/foundry/palantir-mcp/ , https://www.palantir.com/docs/foundry/ontology-mcp/overview/ , https://www.palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/ , https://www.palantir.com/docs/foundry/announcements/2026-06

Extra detail:
- **Tool search** (opt-in from 30 Jun 2026) exposes only `search_tools` at startup and reveals matching tools on demand, which reduces startup tokens. The client must support `tools/list_changed`. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-06
- **OMCP tool names** in the examples look like `search-osdk-todo-task` and `create-osdk-todo-task`. Action parameters become the tool schema.
- **Agent tool description.** Ontology Manager has a field for this on each Action type, used to tell agents when to use the Action and how to get its inputs. This is metadata written for agents, stored on the semantic object.
- **Copilot Studio** results can be rendered as Adaptive Cards (v1.5) through a `response_semantics.data_path` and a template. Tool responses must be native JSON, not JSON-encoded strings.
- **Duplicate prevention.** The docs suggest a Claude "skill" that searches before creating, to avoid duplicates. [Fact] https://www.palantir.com/docs/foundry/ontology-mcp/mcp-tools-and-agent-configuration/
- **MCP Hub** lists the enrollment's OMCP servers. Per-tool enable/disable and description editing are planned (May 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05

## Open-source implementations

### 22. Model Context Protocol (spec and SDKs)

> Source: [open-source-references/model-context-protocol.md](../../open-source-references/model-context-protocol.md) (code study)

- Spec repository: licensing is moving from MIT to Apache-2.0 for new contributions; docs are CC-BY-4.0. Schema versions present: 2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25, 2026-07-28 and draft. [Fact] ([LICENSE](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/LICENSE))
- 2026-07-28 major changes:
  - Protocol-level sessions and the `Mcp-Session-Id` header are removed; servers mint explicit handles passed as tool arguments.
  - The initialize handshake is removed; each request carries its protocol version and client capabilities in `_meta`.
  - A mandatory `server/discover` RPC is added.
  - `subscriptions/listen` replaces GET and resource subscribe.
  - `ping` and `logging/setLevel` are removed.
  - Tasks move to an extension that is polled with `tasks/get`.
  - MRTR replaces server-initiated `sampling`/`elicitation`/`roots`, and every result now carries `resultType`.
  - SSE resumability is removed.

  Minor changes include deterministic `tools/list` ordering (for prompt-cache hits), required `ttlMs`/`cacheScope` on list results, OpenTelemetry `traceparent` in `_meta`, and JSON Schema 2020-12 for tool schemas. Roots, Sampling and Logging are deprecated. [Fact] ([changelog.mdx](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx))
- Tool annotations in `schema/2026-07-28/schema.ts`: `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint`. [Fact]
- TypeScript SDK: `main` is v2, published as `@modelcontextprotocol/server` and `@modelcontextprotocol/client` 2.4.0 (Apache-2.0), implementing 2026-07-28. v1.x (`@modelcontextprotocol/sdk`) receives fixes for at least six months after the v2 release on 2026-07-27. [Fact] ([README](https://github.com/modelcontextprotocol/typescript-sdk/blob/HEAD/README.md))
- Verdict: **adopt `@modelcontextprotocol/server` v2** as the external agent interface. Statelessness suits generated tools well: put the actor and tenant in auth, not in session state. [Inference]

## Other companies and products

### Harvey: connectors and the MCP policy engine

> Source: [general-references/12-agent-companies.md § Harvey: connectors and the MCP policy engine](../../general-references/12-agent-companies.md#harvey-connectors-and-the-mcp-policy-engine)

- Each connector is a vendor-level catalogue object with one permission and an admin toggle. Its members are native API wrappers or vendor MCP servers. A code-resident registry defines identity, capabilities, permission and routing notes. Resolution happens once per turn. Every call uses the user's own credential, so the source system's ACLs apply. Effective MCP tools = vendor-advertised ∩ Harvey-reviewed ∩ workspace and user settings ∩ the user's selection. Scale: 110,000+ connections, tens of thousands of tool calls a week, about 13M credential reads a day. OAuth 2.1 with PKCE plus RFC 9728/8414/7591/8707, with adapters for vendor deviations (for example, tokens returned with 201). Single-use refresh tokens are handled with conditional write-backs rather than locks. [Fact] https://www.harvey.ai/blog/how-we-built-harvey-connector-library
- Policy engine: Rego (Regorus/OPA in-process). The engine is data-blind and fails closed. Decisions are allow, deny or pause for approval. Argument risk is scored on capacity (how much data an argument can carry) and authority (what it controls). It detects delegation cycles. A Tool Pinner flags changes to descriptions and schemas (it produces many alerts). A sanitizer strips hidden characters and confusables. Telemetry excludes arguments and results. [Fact] https://www.harvey.ai/blog/building-harveys-mcp-policy-engine

## Research literature

### 6. Protocols: MCP and A2A

> Source: [general-references/10-papers-agents-memory-eval.md § 6. Protocols: MCP and A2A](../../general-references/10-papers-agents-memory-eval.md#6-protocols-mcp-and-a2a)

**Plain English.** MCP is a standard plug so any agent app can call your tools and read your resources. A2A is a standard way for one agent to hand a task to another agent run by someone else.

**MCP revision history** [Fact, https://modelcontextprotocol.io/specification/versioning; 2025-11-25 and 2026-07-28 changelogs]:
- Versions are date strings marking the last backward-incompatible change. Current is **2026-07-28**. Deprecated features stay at least 12 months (90 days under expedited removal).
- 2025-11-25 (relative to 2025-06-18) added OpenID Connect discovery, icons, incremental scope consent via `WWW-Authenticate`, tool-name guidance, URL-mode elicitation, tool calling inside sampling, Client ID Metadata Documents (CIMD) as the recommended registration, and experimental tasks (durable requests with polling). It also defaulted to JSON Schema 2020-12 and returns input validation errors as tool execution errors.
- **2026-07-28 major changes:**
  1. No protocol sessions and no `Mcp-Session-Id`. List endpoints do not vary per connection, but may vary by the authorization on the request.
  2. Stateless: no `initialize` handshake. Every request carries `io.modelcontextprotocol/protocolVersion` and `clientCapabilities` in `_meta`. A mismatch returns `UnsupportedProtocolVersionError`.
  3. `server/discover` is mandatory.
  4. `subscriptions/listen` replaces the GET endpoint and resource subscribe.
  5. `ping`, `logging/setLevel` and roots list_changed are removed. Log level is per request.
  6. Tasks moved to an extension (`io.modelcontextprotocol/tasks`) that uses polling via `tasks/get` plus `tasks/update`.
  7. Multi Round-Trip Requests: the server returns `resultType: "input_required"` with `inputRequests` (elicitation and so on), and the client retries with `inputResponses` plus an opaque `requestState`.
  8. SSE resumability is removed, so a broken stream means re-issuing the request.
- 2026-07-28 minor changes: an `extensions` capability, OpenTelemetry `traceparent`/`tracestate`/`baggage` in `_meta`, deterministic `tools/list` order, `Mcp-Method`/`Mcp-Name` headers and `x-mcp-header` parameter mirroring, required `ttlMs`/`cacheScope` on list results, RFC 9207 `iss` validation, full JSON Schema 2020-12 for schemas, and a new error-code range.
- 2026-07-28 deprecations: Roots, Sampling and Logging (use tool params, direct provider APIs, and OTel instead), the HTTP+SSE transport, and Dynamic Client Registration in favour of CIMD.
- **Authorization:** the MCP server is an OAuth 2.1 resource server and MUST publish RFC 9728 Protected Resource Metadata. Clients MUST send an RFC 8707 `resource` parameter naming the server's canonical URI. Servers MUST validate the token audience and MUST NOT accept or pass through other tokens. PKCE is required. Insufficient scope returns 403 with `WWW-Authenticate: error="insufficient_scope", scope=...`, and clients step up with the union of scopes. Clients validate `iss`. STDIO servers take credentials from the environment instead [Fact, https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization.md].
- Tools, errors and handles: see section 2.

**A2A** [Fact, https://a2a-protocol.org/latest/specification/; I read only the first third of a 296k-character page]. Version 1.0.0, with an announcement link dated 27 Aug 2026, authored under the Linux Foundation and joining the Agentic AI Foundation. Core objects: an Agent Card (JSON identity, capabilities, skills, endpoint and auth requirements, which can be signed), a Task (stateful, with states working, input-required, auth-required, completed, failed, canceled, rejected), Message, Part (text, file or data) and Artifact. Operations include SendMessage, SendStreamingMessage, GetTask, ListTasks, CancelTask, SubscribeToTask, push-notification config CRUD and GetExtendedAgentCard. Bindings are JSON-RPC, gRPC and HTTP+JSON. Security schemes are API key, HTTP, OAuth 2.0, OIDC and mTLS.

**Takeaway** [Inference]. Expose the company model to third-party agents (Claude, ChatGPT, Copilot) as an MCP server targeting 2026-07-28. Make it stateless with handle-based state, use OAuth with audience binding and per-scope tool filtering, use `input_required` for confirmations, and use the tasks extension for long jobs. Use A2A only if customers' own agents need to delegate whole tasks to yours, such as a customer's procurement agent talking to your customer-service agent. It is not needed for v1.

## Design decisions already in the reference maps

### 18. MCP servers (builder vs consumer)

> Source: [general-references/30-map-palantir-platform.md § 18. MCP servers (builder vs consumer)](../../general-references/30-map-palantir-platform.md#18-mcp-servers-builder-vs-consumer)

**Purpose.** External agents (Claude, Copilot, a customer's own) reach the company model through MCP under exactly the same rules as internal agents. Builder agents can propose model changes but never touch data. *Receivables example:* a finance manager's Claude Desktop connects to the "AR Assistant" MCP server, can search invoices she may see and record promises, and cannot change the `Invoice` type.

**Design to implement.**
- **Consumer MCP server, one per registered app** [Fact 02, 03, 05]:
  - Enable it on the app. The app's restrictions decide what is exposed: one tool per action type, one per selected query function, and an object read tool.
  - Authentication **reuses the app's OAuth client**: authorization code for per-user agents, client credentials for service agents. There is no separate MCP auth. Scopes, app restrictions and user permissions all apply.
- **Read tool** [Inference]: Palantir exposes object types through a single SQL tool, whose dialect is [Unverified 02]. **Version 1 exposes the object-set JSON tool from section 6 instead**, keeping agents off SQL, in line with the founder's aim.
- **Response shaping** [Fact 03]: optional response semantics (a data path plus a card template) for clients such as Copilot Studio. Version 2.
- **Server listing** [Fact 02, 03]: an MCP hub lists the tenant's servers. Per-tool enable/disable and description editing are planned at Palantir; build them in version 1 [Inference].
- **Builder MCP server** [Fact 03, 04]:
  - Tools for reading the registry, lineage, health, docs and object queries.
  - It **can propose changes to types; it cannot write model data.**
  - It has no destructive write tools.
  - Every model change becomes a human-approved proposal.
  - Local use is **off by default** and must be enabled by an admin.
  - It offers tool search.
  - Version 1 builder tools: read IR, diff IR, open proposal, run eval suite, read health [Inference]. Palantir's 89 tools are not needed [03].
- **Governance warning shown at consent** [Fact 02, 03]: connecting an external LLM moves data outside the platform under that provider's terms. Palantir advises a governance review.
- **Audit** [Fact 04]: every MCP call is an audit event with `inApplicationContext` (the app ID) and, for service agents, `onBehalfOf`.

**Copies.**
- Document 02, §16 "Ontology MCP": tool mapping, OAuth reuse, agent tool description, positioning vs builder MCP. https://www.palantir.com/docs/foundry/ontology-mcp/sample-architecture/ , https://www.palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/ , https://www.palantir.com/docs/foundry/ontology-mcp/overview/
- Document 03, §12 "Palantir MCP vs Ontology MCP": table of audience, scope, writes, auth; tool search. https://www.palantir.com/docs/foundry/palantir-mcp/available-tools/ , https://www.palantir.com/docs/foundry/palantir-mcp/security/ , https://www.palantir.com/docs/foundry/announcements/2026-06
- Document 04, §14: no destructive write tools in the builder MCP. https://www.palantir.com/docs/jp/foundry/palantir-mcp/security/

**Left out, and why.**
- Dataset creation through the builder MCP: there are no customer pipelines.
- Agents-as-tools (exposing a chatbot as an MCP tool): version 2.

**Open questions.**
- Palantir's Ontology MCP security page was not read [Unverified 04].
- The SQL tool's limits are [Unverified 02].

---

### 18. The Model Context Protocol, as currently specified (revision 2026-07-28)

> Source: [general-references/32-map-research-and-cost.md § 18. The Model Context Protocol, as currently specified (revision 2026-07-28)](../../general-references/32-map-research-and-cost.md#18-the-model-context-protocol-as-currently-specified-revision-2026-07-28)

**Purpose.** Let third-party agents (Claude, ChatGPT, Copilot, a customer's own agent) use the company model through a standard plug.

**Design to implement.**
- MCP server targeting **2026-07-28**.
- *Stateless protocol*:
  - no `initialize` handshake and no `Mcp-Session-Id`
  - every request carries `io.modelcontextprotocol/protocolVersion` and `clientCapabilities` in `_meta`; a mismatch returns `UnsupportedProtocolVersionError`
  - implement `server/discover`
  - list results carry `ttlMs`/`cacheScope`
  - `tools/list` order is deterministic
  - `subscriptions/listen` replaces resource subscribe
- *Confirmations and elicitation* via multi round-trip: return `resultType: "input_required"` with `inputRequests`; the client retries with `inputResponses` plus the opaque `requestState`.
- *Long jobs* (report generation) via the tasks extension `io.modelcontextprotocol/tasks`, polled with `tasks/get`.
- *State* in server-minted handles passed as tool arguments.
- *Errors*: input-validation and business-logic failures are tool execution errors (`isError: true`).
- *Auth*:
  - the server is an OAuth 2.1 resource server and MUST publish RFC 9728 Protected Resource Metadata
  - clients send an RFC 8707 `resource` parameter; the server MUST validate the token audience and MUST NOT accept or pass through other tokens
  - PKCE required; clients validate `iss` (RFC 9207)
  - insufficient scope returns 403 with `WWW-Authenticate: error="insufficient_scope", scope=...` listing all needed scopes
  - `tools/list` is filtered by the scopes granted on the request
  - Client ID Metadata Documents (CIMD) for registration
- *Tracing*: propagate `traceparent`/`tracestate` in `_meta`.

**Evidence.** All [Fact] from the MCP 2026-07-28 changelog, the tools page and the authorization page (document 10, sections 2 and 6). Deprecated features stay at least 12 months (90 days under expedited removal).

**Copies.** Document 10, section 6 and "What to copy" item 5. https://modelcontextprotocol.io/specification/2026-07-28/changelog.md ; https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization.md ; https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md

**Left out.**
- Deprecated features: Roots, Sampling, Logging, HTTP+SSE, Dynamic Client Registration, session IDs.
- A2A in version 1. Its use is a customer's agent delegating a whole task; the spec was only one-third read.

**Open questions.** How widely MCP clients support 2026-07-28 is not covered by the documents.

### 16. MCP server implementation

> Source: [general-references/33-map-context-code-integration.md § 16. MCP server implementation](../../general-references/33-map-context-code-integration.md#16-mcp-server-implementation)

**Purpose.** The standard surface through which internal and external agents (the product's own and customers' third-party agents) read the model and invoke actions. Receivables example: a finance team's own Claude client connects to the product's MCP server and can call `search_invoice`, `aggregate_invoice` and `logPromiseToPay`, but not raw SQL.

**Design to implement.**
- Adopt `@modelcontextprotocol/server` v2 (2.4.0, Apache-2.0), implementing spec 2026-07-28 [Fact]. That version is stateless: no initialize handshake, no `Mcp-Session-Id`; each request carries protocol version and client capabilities in `_meta`; a mandatory `server/discover` RPC; tasks move to an extension polled with `tasks/get`; MRTR replaces server-initiated sampling/elicitation; deterministic `tools/list` ordering (prompt-cache hits); `ttlMs`/`cacheScope` on list results; OpenTelemetry `traceparent` in `_meta`; JSON Schema 2020-12 for tool schemas [Fact]. Put the actor and tenant in auth, not session state [Inference]; servers mint explicit handles passed as tool arguments [Fact].
- Generated tools (operational-ontology [Fact]): per object type `search_<type>`, `get_<type>`, `aggregate_<type>` and set operations; per link `traverse_<link>` and `pivot_<link>`; one tool per action and per function; `read_audit_log`. No raw-SQL tool and no generic update tool. Fail the build on name collisions. Errors returned as JSON `{error: {code, message}}` with no stack traces.
- Model-level tools (document 11 "What to copy" 20): `list_object_types` (Fabric `list_ontology_entity_types`), `lookup_context` (Google), `list_rules` (Fabric `list_ontology_rules`), `query_metrics` and `get_metrics_compiled_sql` (dbt), and an async pair for long requests — ask/poll/get-result/cancel (Genie One MCP) — with truncated inline results and a separate full-result fetch.
- Annotations: `readOnlyHint` on reads, `destructiveHint` on actions that cancel, write off or send externally, `idempotentHint` where true, `openWorldHint` on tools that reach ledgers or email [Fact for the annotations; mapping is Inference].
- Tool Packs (section 4) decide which generated tools each agent principal sees; internal and external agents get different generated sets from the same model (document 14 "Write from scratch").
- Read tools return object type plus record ID (ServiceNow [Fact]).
- Auth: OAuth 2.1 with PKCE (Glean's MCP auth [Fact]) [Inference: the documents do not prescribe the auth for this product]. Fabric's MCP does not support service principals because of a known issue [Fact] — support agent principals from day one.
- Keep tool counts small; OpenAI found fewer, consolidated tools work better [Fact]. [Inference] Expose `search/get/aggregate` and a few actions per agent rather than every generated tool.

**Copies.**
- Document 14, section 22 and "What to copy" 9. https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/docs/specification/2026-07-28/changelog.mdx ; https://github.com/modelcontextprotocol/modelcontextprotocol/blob/HEAD/schema/2026-07-28/schema.ts ; https://github.com/modelcontextprotocol/typescript-sdk/blob/HEAD/README.md
- Document 14, section 1: generated tool surface. https://github.com/gura105/operational-ontology/blob/HEAD/src/mcp.ts
- Document 11, "Key findings" 8 and "What to copy" 20. https://docs.databricks.com/aws/en/agents/mcp-tools/genie-mcp ; https://learn.microsoft.com/en-us/microsoft-agent-365/mcp-server-reference/fabric ; https://docs.cloud.google.com/knowledge-catalog/docs/reference/mcp ; https://github.com/dbt-labs/dbt-mcp
- Document 11, section 13: Glean MCP auth. https://docs.glean.com/administration/platform/mcp/about

**Left out, and why.** v1 `@modelcontextprotocol/sdk` (operational-ontology uses it; it only receives fixes for six months after 2026-07-27 [Fact]). Server-initiated sampling and SSE resumability (removed in 2026-07-28 [Fact]).

**Open questions.** Whether 2026-07-28 is the "current" version on modelcontextprotocol.io (document 14 unverified). Which customer agent clients already speak 2026-07-28.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Spec version check (code):** [`modelcontextprotocol/modelcontextprotocol` → `schema`](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/024d525/schema) contains 2024-11-05, 2025-03-26, 2025-06-18, 2025-11-25, 2026-07-28 and `draft` — 2026-07-28 is still the latest released revision. Tool annotations confirmed in `schema/2026-07-28/schema.ts`.
- **SDK:** `@modelcontextprotocol/server` and `@modelcontextprotocol/client` 2.4.0 ([`modelcontextprotocol/typescript-sdk` → `packages`](https://github.com/modelcontextprotocol/typescript-sdk/blob/5ee54ee/packages)).

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed (code)** — 2026-07-28 is still the newest released MCP schema; TypeScript SDK packages 2.4.0.
- **New — Palantir MCP became generally available across all Foundry enrollments the week of 22 June 2026, and Ontology MCP was announced GA the same month**; Palantir MCP also gained a tool-search mode exposing only `search_tools` at startup. Source: https://www.palantir.com/docs/foundry/announcements/2026-06

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
