# Agent identity and token scope

**Layer:** [01-security](README.md) · **What it is:** Agents as their own principals: what an agent may see and do is the intersection of its scope and the user's.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### 20. LLM calls and agents

> Source: [general-references/04-palantir-security.md § 20. LLM calls and agents](../../general-references/04-palantir-security.md#20-llm-calls-and-agents)

**Plain English.** The model only receives what the calling identity could already see. Admins can also say "model X may never receive anything from a session marked HR-Confidential". Agents get their own narrowly scoped credentials.

**Technical detail.**
- **Model allowlist by Marking:** the setting is "Allow any data" or "Allow only these Markings". It is set per enrollment (covering all Palantir-provided model families) or per registered model, where it replaces the enrollment policy and can be stricter or looser. The check reads the Markings on the session token; a token with no mandatory Markings passes. A scoped session can bring a token within the allowlist. [Fact] https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
- **Model enablement:**
  - AIP can be enabled for Everyone, for groups, or for Nobody, and restricted to Organizations. A resource is AIP-enabled only if AIP is enabled for all Organization Markings on its Project.
  - Model families are enabled per Organization. Their states are Enabled, Disabled, or Disallowed (legal or geographic reasons).
  - Enabling a family requires accepting subprocessor terms.
  
  [Fact] https://palantir.com/docs/foundry/aip/enable-aip-features/
- **Provider data handling:** Palantir says no customer data in prompts or completions is retained by third-party providers, it is not used for training, and provider personnel cannot access it. Regional endpoints exist in the US, UK and EU for some models. [Vendor claim] https://palantir.com/docs/foundry/aip/aip-security/
- **Execution identity:**
  - AIP Logic is user-scoped by default (each user sees their own logs, kept 24 hours). Project-scoped mode runs with the Project's permissions, needs every resource imported into the Project, and keeps a run-history dataset of the latest 10,000 runs. [Fact] https://palantir.com/docs/foundry/logic/execution-mode-settings/
  - Automate evaluates conditions and runs action, Logic and Function effects as the automation owner, and submission criteria are checked against the owner. Notifications are rendered with each recipient's permissions. Automations owned by a third-party app run as its service user. [Fact] https://palantir.com/docs/foundry/automate/permissions/
  - Pro-code agents (Claude Agent SDK, OpenAI Agents SDK, Google ADK, in Code Repositories) get platform-managed OSDK, Ontology MCP and Palantir MCP credentials. The agent's access is bounded by the Ontology binding chosen at publish time and by the restrictions on its client application. [Fact] https://palantir.com/docs/foundry/agents/scoped-permissions/ , https://palantir.com/docs/foundry/agents/overview/
  - Palantir's January 2026 engineering blog says an agent's permissions derive from three parties: the configuring owner, the agent's service user or OSDK scope, and the user it acts for at that moment. It also says memory (working, episodic, semantic, procedural) is policy-checked at runtime. [Vendor claim] Read via an aggregator copy of blog.palantir.com/securing-agents-in-production-agentic-runtime-1-5191a0715240 (dated 22 Jan 2026 per engineered.at); I could not open the original. https://scour.ing/@matmat/p/https:/blog.palantir.com/securing-agents-in-production-agentic-runtime-1-5191a0715240
- **Chatbot (Agent) Studio tools:** Action tools are configured to run automatically or after user confirmation. Object query tools are limited to configured object types and properties. Function tools are latest or pinned version. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/tools/ . Per-tool user-permission mechanics are not documented on that page. [Inference] They follow the function and action rules above (runs as user).
- **Logs:** session logs capture the system prompt, tools, inputs and outputs, and retrieval context, under per-message trace IDs, and can be exported to a stream that should be Marked. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/ . Trace and service logs do not inherit Markings. Viewing them needs Edit on the source executor, log access enabled, and all Markings applied to the logs. Users see their own executions for 24 hours. [Fact] https://palantir.com/docs/foundry/aip-observability/log-permissioning/
- **Propagation gap:** data returned to the model by tools carries no link to its source policy. [Fact] https://palantir.com/docs/foundry/security/access-control-propagation/ . That is why the token-level Marking allowlist exists. [Inference]

### 11. Pro-code agents, templates and scoped permissions

> Source: [general-references/03-palantir-aip.md § 11. Pro-code agents, templates and scoped permissions](../../general-references/03-palantir-aip.md#11-pro-code-agents-templates-and-scoped-permissions)

**Plain English.** A developer writes an agent with a mainstream SDK such as the Claude Agent SDK, and Palantir supplies the plumbing: credentials, MCP servers, an Ontology client, publishing and triggers.

**Technical detail.**
- Pro-code agents launched on 9 Jul 2026. Supported SDKs are the Claude Agent SDK, OpenAI Agents SDK and Google ADK, in Foundry code repositories, published as Foundry functions. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07 , https://palantir.com/docs/foundry/agents/overview/
- **Template layout.** `agent/index.ts` holds the `AgentArguments` schema (via `defineInputs` and `t`) and `runAgent`. `agent/systemPrompt.ts` and `agent/customTools.ts` hold the prompt and custom tools, plus `utils/` and `scripts/`. Default MCP servers are Palantir MCP, Ontology MCP and Python Transforms MCP, resolved at runtime. Custom MCP config goes in `agent/mcps/custom.ts` to survive template upgrades. Tool search is on by default for Palantir MCP. `getOntologySdkClient($ontologyRid)` builds the OSDK client, and adding an SDK also creates an Ontology MCP from the same resources. `FOUNDRY_EXTERNAL_HOST` is resolved from Control Panel, with a `fallbackHost` option. [Fact] https://www.palantir.com/docs/foundry/agents/agent-templates/
- **Claude Agent SDK template.** The loop is the SDK's `query` iterator. Custom tools use `tool(name, description, zodSchema, handler)` exposed through `createSdkMcpServer`. Palantir MCP configs come from `@palantir/agent-templates-bundle/mcp/anthropic` and are passed in `mcpServers` (for example `"ontology_mcp"`). Stream consumption is left as a placeholder. The page does not say how Claude calls are routed. For Gemini it does: the ADK template routes through a "Foundry language model proxy" (`FoundryGemini`), "no Google API key is required". The OpenAI example uses `model: "gpt-5.4"`. [Fact] same URL. [Inference] Claude calls probably go through the same Anthropic-compatible proxy described in section 6, but the page does not say so. [Unverified]
- **Scoped permissions.** Credentials are provisioned at creation, with no client id, secret or token in code. Helpers resolve the URL and auth headers at runtime. Access is bounded by (a) the **Ontology binding** chosen at publish and (b) the **application restrictions** on the underlying client. [Fact] https://www.palantir.com/docs/foundry/agents/scoped-permissions/ The page does not say how tokens are minted, how long they live, or whether the identity is the user or a service. [Unverified]
- **Publish and call.**
  - Publishing registers an Ontology binding and an agent API name, and exposes the agent as an **asynchronous** function that is **not subject to the five-minute limit**. It returns `Void`.
  - Results must be written to Ontology objects; this applies to eval grading too.
  - Arguments are JSON matching `AgentArguments`. For objects, pass primary keys and re-fetch inside the agent.
  - Streaming and batch invocation are not supported.
  - Automate is the recommended trigger. The agent "runs as the user who triggered the automation or as the automation's service user".
  - Agents can be developed on a global branch.
  - Local runs use `start --json-args`.
  - [Fact] https://www.palantir.com/docs/foundry/agents/publish-and-call/

## Design decisions already in the reference maps

### 14. Token scope intersection and agent identity

> Source: [general-references/30-map-palantir-platform.md § 14. Token scope intersection and agent identity](../../general-references/30-map-palantir-platform.md#14-token-scope-intersection-and-agent-identity)

**Purpose.** Every agent is a registered application with a fixed ceiling, and every token it holds is the overlap of who it acts for, what it may ever touch, and what it asked for. *Receivables example:* the "Collections Assistant" app may read `Customer`, `Invoice`, `PaymentPromise` and `Dispute`, and apply `RecordPaymentPromise` and `SendDunningEmail`, nothing else. A collector using it can only ever do the overlap of that list and their own rights.

**Design to implement.**
- **Application registration** [Fact 02, 04, 05]: `agent_app(id, tenant_id, name, client_type confidential|public, restricted bool default true, allowed_object_types[], allowed_interfaces[], allowed_actions[], allowed_functions[], allowed_projects[], allowed_api_namespaces[], owner_principal_id, service_principal_id)`. Restricted is the default, and switching to unrestricted wipes the lists [Fact 04]. Palantir's default cap is 1,000 resources and restrictions per app [Fact 02]. **Version 1 does not offer unrestricted apps at all** [Inference; Palantir advises against them, Fact 04].
- **Effective permission = principal ∩ app ceiling ∩ requested scope.** A token with no scope has no permissions [Fact 02, 04, 05]. Scopes are operation-only (read and write per namespace) and namespaces do not imply each other [Fact 04]. An out-of-scope call returns a typed `ApiUsageDenied` error [Fact 04].
- **Grant types** [Fact 03, 04]:
  - **Authorization code with PKCE (S256, verifier of 43–128 characters):** for staff-facing agents, acting as the consenting user. Codes expire after 10 minutes.
  - **Client credentials:** for headless agents, acting as a service user. Needs a confidential client.
- **Refresh tokens** need `offline_access`, rotate on every use, and revoke the whole grant if reused more than 1 minute after first use. Inactive refresh tokens expire after 30 days [Fact 04].
- **Tenant enablement** [Fact 04]: an app must be enabled per tenant, and each user consents through OAuth. Tenant-wide consent is not offered, because Palantir does not recommend it [Fact 04].
- **Execution identities** (record one in every audit event) [Fact 03, 04]:
  1. **user-scoped** (the default for interactive agents);
  2. **project-scoped** (runs with project permissions; every resource must be imported into the project);
  3. **owner** (automations);
  4. **service principal** (external and headless agents, automations owned by an app).
- **Platform-issued credentials for agent code** [Fact 03, 04]: no client ID or secret in code; helpers resolve the URL and auth headers at runtime; access is bounded by the binding chosen at publish and by the app restrictions. Token lifetime is [Unverified 03]. Choose a 15-minute access token for agents and a 4-hour maximum for "extended execution" tokens (Palantir's function-obtained tokens have a TTL of up to 4 hours [Fact 04]) [Inference].
- **Three parties behind an agent's permissions** [Vendor claim 04, read via an aggregator copy of a Palantir blog post]: the configuring owner, the agent's service user or OSDK scope, and the user it acts for at that moment. **Model this explicitly:** `effective = owner_ceiling ∩ app_ceiling ∩ acting_principal ∩ requested` [Inference].
- **Personal access tokens are not for production** [Fact 04]: version 1 offers them only for local development, with an expiry.
- **Service account hygiene** [Fact 04]: a named owner, periodic review, rotation, monitoring.

**Copies.**
- Document 02, §15 and document 04, §19: Developer Console restrictions, the intersection rule, scopes. https://www.palantir.com/docs/foundry/developer-console/application-restrictions/
- Document 04, §19: OAuth specifics, enablement, personal tokens. https://www.palantir.com/docs/foundry/platform-security-third-party/writing-oauth2-clients/ , https://www.palantir.com/docs/foundry/platform-security-third-party/enabling-3pa-access/ , https://www.palantir.com/docs/foundry/platform-security-third-party/user-generated-tokens/
- Document 03, §§8 and 11 and document 04, §20: execution modes, scoped permissions for pro-code agents. https://www.palantir.com/docs/foundry/logic/execution-mode-settings/ , https://www.palantir.com/docs/foundry/agents/scoped-permissions/
- Document 04, §20: three-party permission model (vendor claim). https://scour.ing/@matmat/p/https:/blog.palantir.com/securing-agents-in-production-agentic-runtime-1-5191a0715240

**Left out, and why.**
- Organization-level consent, unrestricted apps, and production personal tokens: Palantir's own docs advise against all three [Fact 04].
- Hosting apps on subdomains.

**Open questions.**
- How Palantir mints agent tokens, and whether the identity is the user or a service [Unverified 03, 04].

---

### 4. Agent identity as its own principal

> Source: [general-references/33-map-context-code-integration.md § 4. Agent identity as its own principal](../../general-references/33-map-context-code-integration.md#4-agent-identity-as-its-own-principal)

**Purpose.** Every agent is a named security principal with its own permissions and audit trail, separate from the human who built it or triggered it. Receivables example: the "Collections assistant" agent drafts a reminder when Aisha (a collector) asks; the audit shows both the agent and Aisha. The "Customer portal agent" talks to customers under its own narrow principal.

**Design to implement.**
- Table `principals(org_id, principal_id, kind: human|agent|service, …)` and `agents(org_id, agent_id, principal_id, audience: internal|external, owner_principal_id, tool_pack_id, model_setting, status)`. [Inference: table design; the separate agent principal is copied from Fabric's Entra Agent ID and OpenAI Frontier's per-coworker identity.]
- Two run modes per tool step (Glean, beta [Fact]): **as invoker** (default; the agent's effective rights are the intersection of the invoking human's rights and the agent's tool pack [Inference]) or **service credential**, attached per tool step by an admin, injected server-side only for the approved target, never visible to the model.
- Every audit row records both the agent principal and the triggering principal (Glean [Fact]; Merge Agent Handler records identity, arguments, downstream calls and outcome [Fact/Vendor claim]).
- Approval rule: an approved action never executes with the creator's rights. It executes with the approver's rights or the agent's own scoped credential (document 11, "What to copy" 15, written against the Fabric operations agent, which executes with the creator's permissions [Fact]).
- External agents (customer messaging) get their own principal, an `external` audience, a tool pack generated from the same model with stricter visibility and marking filters, and context assembled entity-first from the resolved customer only (document 14, "Write from scratch"; document 11 section 8, Salesforce ACE [Vendor claim]).
- Tool Packs: tools scoped per agent type, customer tier and environment, so an agent sees only what it may call (Merge Agent Handler [Vendor claim]).
- Agents prepare, humans submit, for money-moving and customer-facing actions in early releases (Airbyte's Stripe-dispute skill never submits [Vendor claim]).

**Copies.**
- Document 11, section 13 (Glean agent identity). https://docs.glean.com/administration/agent-identity/overview
- Document 11, section 2 (Fabric operations agent: what not to do). https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent
- Document 11, section 7 (Frontier: per-coworker identity, [Vendor claim]). https://openai.com/index/introducing-openai-frontier
- Document 24, section 5.1 and "What to copy" 11–12 (Merge Agent Handler: audit record, Tool Packs). https://www.merge.dev/agent-handler
- Document 24, "What to copy" 13 (agents prepare, humans submit). https://github.com/airbytehq/airbyte/blob/master/docs/community/newsletter-archive/jul-2026-agents-can-now-write-to-salesforce-and-hubspot.md
- Document 11, section 8 (ACE entity-first context). https://www.salesforce.com/blog/?p=157012

**Left out, and why.** Run-as-creator after a different approver (privilege escalation). Arcade-style "agent acts with the user's own OAuth grant to each SaaS app" as the default: [Inference] the product holds one service connection per ledger and enforces per-user permissions itself; Arcade is a teacher only (document 24).

**Open questions.** How the external agent authenticates the human customer it talks to (not covered by the three documents). Whether agent principals need their own markings or only inherit.

## Fact-check notes

_No time-sensitive claims in this component were re-checked in the 28 Nov 2026 pass; its sources are dated 21–27 Nov 2026. See the linked references for their own open questions._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
