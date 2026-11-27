# Palantir AIP, the AI layer, bolt by bolt

Scope note (written 21 November 2026). This file covers how Palantir's AI Platform (AIP) works, based on Palantir's own documentation as I read it on 21 Nov 2026. It covers the LLM access layer (model catalog, rate limits, token accounting, bring-your-own-model, provider-compatible proxy APIs, data retention, markings), AIP Logic, AIP Chatbot Studio (formerly Agent Studio), the newer Agent Stack (Agent Builder, Agent Manager, Agent SDK), pro-code agents and their templates (including the Claude Agent SDK template), Palantir MCP vs Ontology MCP, AIP Evals, Automate, observability and tracing, retrieval (semantic search and "ontology-augmented generation"), AI FDE, AIP Analyst, AIP Assist, AIP Evolve, Boardroom, Machinery and Document Intelligence. It does not repeat a high-level tour of the Ontology itself; another file covers that. Palantir docs pages carry no "last updated" date, so I date claims by the date I read them (21 Nov 2026) or by the dated announcement that introduced the feature. Limits on this pass: my web search and web fetch quota ran out near the end, so I could not read the Palantir engineering blog index, AIPCon or DevCon talk pages, the Automate retries, evaluation-frequency and permissions sub-pages, the AI FDE admin page, the Workshop chatbot widget page or the Document Intelligence chunking page. Those gaps are listed in "Open questions".

Labels: [Fact] means Palantir documentation states it, with a URL. [Vendor claim] means a Palantir performance or quality assertion. [Inference] is my own reasoning. [Unverified] means I could not find a source.

## Key findings

1. **AIP is a governed proxy in front of many third-party models, not a model.** It lists about 90 LLMs from about 11 providers, reached through direct provider APIs, Bedrock, Azure, Vertex or Palantir-hosted open models. Every call is metered in tokens, rate-limited at the enrollment, project and user levels, and checked against a markings allowlist. [Fact] https://www.palantir.com/docs/foundry/aip/supported-llms/ , https://www.palantir.com/docs/foundry/aip/llm-capacity-management/
2. **Capacity is the hard constraint, and Palantir designed around it.** Usage is measured in TPM and RPM per model. Enrollment tiers run Small, Medium, Large and XLarge, and everyone starts on Medium. Projects get percentage caps. Users get per-user caps. 20% of capacity is always held for interactive traffic, so batch traffic tops out at 80%. Up to 50% can be reserved for critical workflows. Palantir says over 99% of request failures come from its own enrollment and project limits, not from provider outages. [Fact / Vendor claim] https://www.palantir.com/docs/foundry/aip/llm-capacity-management/
3. **Every LLM request is attributed to a project or a user, and that choice decides which limits apply.** Requests from builder tools (Logic, Chatbot Studio, Automate, Workshop, Pipeline Builder) are charged to a project and governed by project limits. Requests from personal assistants (AI FDE, Assist, Analyst, Claude Code through the proxy) are charged to a user and governed by user limits. [Fact] https://www.palantir.com/docs/foundry/aip/llm-capacity-management/
4. **Tool calls run under real identities. The LLM requests a tool and the platform executes it.** In Logic, "the LLM never calls tools directly", and tools run with the invoking user's permissions in user-scoped mode, which is the default. Project-scoped mode runs with the project's permissions and requires every resource to be imported into that project. AI FDE is "not a separate service account or bot". It acts through the user's own session. [Fact] https://www.palantir.com/docs/foundry/logic/blocks/ , https://www.palantir.com/docs/foundry/logic/execution-mode-settings/ , https://www.palantir.com/docs/foundry/ai-fde/security-and-governance/
5. **Writes to the Ontology go only through Actions, and they are increasingly staged for human review.** A Logic function can edit the Ontology only when it is published and called from an Action. "Staged writes" (beta) hold all edits in temporary storage and apply them when execution completes. Automate can turn those edits into proposals that a reviewer accepts or rejects, with a decision log attached. [Fact] https://www.palantir.com/docs/foundry/logic/core-concepts/ , https://www.palantir.com/docs/foundry/logic/staged-writes/ , https://www.palantir.com/docs/foundry/logic/aip-logic-integration-automate/
6. **Palantir has three tiers of agent builder on one runtime.** Chatbot Studio is the mature, no-code chat assistant. The Agent Stack (Agent Builder, which is beta, Agent Manager and the Agent SDK) introduces durable sessions, typed "context items", events and a deterministic state machine. Pro-code agents wrap the Claude Agent SDK, OpenAI Agents SDK or Google ADK in a template whose scoped credentials are wired automatically. [Fact] https://www.palantir.com/docs/foundry/aip/agent-stack/ , https://www.palantir.com/docs/foundry/agents/overview/
7. **The Agent SDK's design is the most copyable idea here.** Session state is a list of strongly typed context items, each with `create` and `render` functions. Events are processed in order by a pure `handleEvent(state, event)`, which returns state updates and "effects" (asynchronous side effects that report back by dispatching events). Human-in-the-loop is a tool that returns a pending `UserQuestion` item; the person's answer arrives as an event. [Fact] https://www.palantir.com/docs/foundry/agent-sdk/advanced-customization/
8. **There are two MCP servers with deliberately different jobs.** Palantir MCP is for builders: 89 tools, it can change Ontology *types*, it cannot write Ontology *data*, and every Ontology change goes through human-approved proposals. Ontology MCP is for consumers: it exposes an app's object types, action types and query functions as MCP tools under OAuth 2.0, and every call runs under the authenticated user's permissions. Both became generally available in June 2026. [Fact] https://www.palantir.com/docs/foundry/palantir-mcp/available-tools/ , https://www.palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/ , https://www.palantir.com/docs/foundry/announcements/2026-06
9. **Evals are a first-class product with concrete limits.** A suite has test cases (manual or backed by an object set), targets and evaluators. There are 20 built-in evaluators, including LLM-as-a-judge and ROUGE, and custom evaluators are published functions. A run allows 1 to 100 iterations per case, up to 15,000 executions and up to 10 cases in parallel, and Palantir recommends at least 3 iterations for LLM functions. Experiments grid-search up to 25 runs. Each test case runs inside its own Ontology simulation, so edits never touch real data. [Fact] https://www.palantir.com/docs/foundry/aip-evals/create-suite/ , https://www.palantir.com/docs/foundry/aip-evals/run-suite/ , https://www.palantir.com/docs/foundry/aip-evals/experiments/ , https://www.palantir.com/docs/foundry/aip-evals/ontology-edits/
10. **The markings check is session-based, not data-based.** Admins can allowlist the mandatory markings that may reach LLMs. AIP checks the markings on the user's *session token*, not on the data in the prompt. A user with access to a disallowed marking is blocked even when the prompt does not contain that data, unless they switch to a "scoped session". This shipped on 12 Oct 2026. [Fact] https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
11. **Retrieval is ordinary engineering, not magic.** "Ontology-augmented generation" in the docs means chunk objects with vector properties, KNN search, HyDE, query enrichment and extraction, and hybrid search with reciprocal rank fusion. The docs advise skipping search when the context fits in the window (128k tokens is about 300+ pages), and they say retrieval, not generation, is usually what fails. [Fact] https://www.palantir.com/docs/foundry/ontology/ontology-augmented-generation/
12. **Determinism is pushed everywhere.** Logic has deterministic blocks (Apply action, Execute function, loops, conditionals) that use no tokens. Chatbot Studio can fill tool inputs from application variables instead of LLM output. It can map tool and context outputs straight into variables ("recommended over LLM-driven updates"). The default temperature is 0. [Fact] https://www.palantir.com/docs/foundry/logic/faq/ , https://www.palantir.com/docs/foundry/chatbot-studio/application-state/
13. **Cost is simple, visible arithmetic.** Tokens convert to compute-seconds per 10k tokens, with input and output priced separately (GPT-4o: 43 input / 172 output in North America). Logic adds a flat 4 compute-seconds per LLM block execution and 8 per tool call. There is a daily "AIP Token Usage" dataset broken down by model and resource, which reports cache read and write tokens separately. [Fact] https://www.palantir.com/docs/foundry/aip/aip-compute-usage/ , https://www.palantir.com/docs/foundry/logic/compute-usage/ , https://www.palantir.com/docs/foundry/announcements/2026-05
14. **Long-running agents are asynchronous and write their results to objects.** Synchronous functions have a five-minute limit. Pro-code agent functions are asynchronous, return `Void`, and must write transcripts and results to Ontology objects for callers and evals to read. [Fact] https://www.palantir.com/docs/foundry/agents/publish-and-call/ , https://www.palantir.com/docs/foundry/logic/faq/
15. **Agents improving agents is now productised.** AIP Evolve (GA 8 Sep 2026) runs fleets of AI FDE agents against a goal (cost, latency, eval score, model migration) and a validation suite. It returns a branch proposal. In Palantir's example it swapped GPT-4o for GPT-5.4 Mini and cut cost by 65% with all 10 tests passing. [Fact / Vendor claim] https://www.palantir.com/docs/foundry/aip-evolve/overview/

## Breakdown

### 1. Overall AIP architecture (as Palantir's Architecture Center draws it)

**Plain English.** AIP is the layer that lets AI models read a company's modelled data, call its business logic and propose changes, all under the same permissions and audit trail as human users. Example: a supply-chain agent sees "Order" and "Plant" objects, calls a "reroute shipment" Action, and the edit is logged against a named user.

**Technical detail.** The Architecture Center lists 12 capability areas: secure LLM access, end-to-end observability, context engineering, the Ontology system, vector/compute/tool services, security and governance, agent lifecycle, operational automation, development environments, human-plus-AI applications, packaging and release, and "enterprise automation" (agents such as AI FDE and AIP Analyst that build on the platform itself). [Fact] https://palantir.com/docs/foundry/architecture-center/aip-architecture
- AIP and Foundry run on a shared service mesh, deployed by Apollo inside the "Rubix" substrate. [Fact] same URL.
- Context engineering covers batch, streaming and CDC replication on Spark, Flink, DataFusion and Polars runtimes. [Fact] same URL.
- The Ontology is described as unifying "data, logic, action, and security". Palantir claims it can query "billions" of objects and orchestrate "tens of thousands" of actions. [Vendor claim] same URL.
- The vector and tool services include integrated vectorisation, multi-node and single-node engines, bring-your-own containers, and a "tool factory" built from the Ontology. [Fact] same URL.
- Security is "role-, marking-, and purpose-based", and the page says it applies uniformly across UI, APIs and SDKs. [Fact] same URL.
- Agents work under the same change management as humans, such as Global Branching. [Fact] same URL.

[Inference] For a 100 to 1,000 person company, the parts that matter are: one model gateway, one semantic model with permissions, tools generated from that model, agents that run as a user, branch-and-proposal review for changes, and evals plus tracing. The multi-engine compute and Apollo deployment layers are overkill.

### 2. LLM access layer: model catalog, "k-LLM", hosting and regions

**Plain English.** Customers do not sign up with OpenAI or Anthropic. They switch on "model families" in an admin console, and Palantir routes calls to a provider account it has vetted.

**Technical detail.**
- **Catalog size and providers.** About 90 LLM entries, 5 embedding models and about 15 audio models. Providers include xAI, OpenAI, Anthropic, Meta, Google (Gemini and Gemma), NVIDIA, Mistral, DeepSeek, Moonshot (Kimi), Alibaba (Qwen) and Z.ai (GLM). [Fact, my count from the page, 21 Nov 2026] https://www.palantir.com/docs/foundry/aip/supported-llms/
- **Hosting paths.** Direct (Anthropic, OpenAI, xAI), Amazon Bedrock, Azure, Google Vertex (including a USG variant), Palantir-hosted (Llama, GPT-OSS, Gemma 4 26B, Whisper and others), and Fireworks for some open-weight models (Kimi K3, GLM-5.3, DeepSeek V4.1 Flash, Oct 2026). [Fact] same URL; https://www.palantir.com/docs/foundry/announcements/2026-10
- **Georestriction is set per enrollment, not per user.** An EU-restricted enrollment processes requests in the EU. A model's state can be *enabled*, *disabled* (for example, legal terms not yet accepted) or *disallowed* (for example, wrong region or awaiting Palantir review). [Fact] https://www.palantir.com/docs/foundry/aip/supported-llms/
- **Experimental models** must be acknowledged by an admin, may need manual migration, and are not meant for production. [Fact] same URL.
- **"k-LLM".** The supported-models page does not use the term. It calls AIP model-agnostic. [Fact] same URL. I could not open a Palantir page that defines "k-LLM" before my search quota ran out. [Unverified]
- **Multi-provider failover is used as a capacity and resilience argument.** Claude via Azure (Jun 2026) was justified by "added capacity and routing through Azure during outages", and Anthropic Direct (May 2026) by "failover between providers". [Fact] https://www.palantir.com/docs/foundry/announcements/2026-06 , https://www.palantir.com/docs/foundry/announcements/2026-05
- **Model categories instead of model names.** AIP Analyst replaced direct model selection with Fast, Balanced and Smart categories (1 Oct 2026). A saved analysis bound to a category picks up whatever model the admin currently maps to it. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-10 , https://www.palantir.com/docs/foundry/aip-analyst/analysis-resources/
- **Deprecation tooling.** An Upgrade Assistant and a deprecation page exist. Bulk model replacement across Logic functions from Workflow Lineage went GA in May 2026, and bulk model swaps in Pipeline Builder produce reviewable proposals (Nov 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05 , https://www.palantir.com/docs/foundry/announcements/2026-11

### 3. Data retention and provider guarantees

- When AIP uses third-party models, Palantir says no customer data in prompts or completions is retained by the provider, data is not used for retraining, provider staff have no access, and Palantir secures "technical and contractual guarantees" before enabling a model. [Vendor claim] https://www.palantir.com/docs/foundry/aip/aip-security/
- The capacity FAQ and the provider-compatible API page both say Palantir "guarantees zero data retention and regional routing". The capacity FAQ adds that **provider Batch APIs are not used because they require data storage that fails compliance**. That is one reason throughput is limited. [Fact] https://www.palantir.com/docs/foundry/aip/llm-capacity-management/ , https://www.palantir.com/docs/foundry/aip/llm-provider-compatible-apis/
- The security page does not say whether Palantir itself stores prompts. The observability docs show that it does capture prompts, responses and token usage in traces, and that chatbot session logs can be exported. [Fact] https://www.palantir.com/docs/foundry/aip-observability/trace-view/ , https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/
- Caveats: regional endpoint use depends on provider restrictions "which may change over time", and certifications apply "unless stated explicitly otherwise" in the contract. [Fact] https://www.palantir.com/docs/foundry/aip/aip-security/
- Exception: if a builder connects a local IDE (Claude Code, Copilot, Cursor) to Palantir MCP or Ontology MCP, tool outputs go to *that* provider under *that* provider's terms. Palantir MCP for local use is off by default. [Fact] https://www.palantir.com/docs/foundry/palantir-mcp/security/ , https://www.palantir.com/docs/foundry/ontology-mcp/overview/

### 4. Rate limits and capacity management

**Plain English.** Model providers cap each account. Palantir resells that capacity, so it splits it carefully between teams, users and jobs, and keeps a lane open for people clicking buttons.

**Technical detail** (all [Fact] from https://www.palantir.com/docs/foundry/aip/llm-capacity-management/ unless noted):
- **Units.** Tokens per minute (TPM) and requests per minute (RPM), tracked separately for each model.
- **Three levels.** Enrollment, project and user.
- **Enrollment tiers.** Small, Medium, Large and XLarge. All customers start on Medium; Large and XL come through Support. Example limits, as TPM/RPM: GPT-5.5 (OpenAI) is 1M/1,000 per user; Small 150k/30, Medium 3M/1,500, Large 6M/3,000, XLarge 10M/5,000. Llama 3.3 70B (Palantir-hosted) is 50k/100 per user and Medium 300k/450. "Enrollment limits from enabled backends are added together", so enabling both Azure and Direct OpenAI raises the ceiling. Georestricted enrollments may get lower limits. [Fact] https://www.palantir.com/docs/foundry/aip/llm-enrollment-rate-limits/
- **Project limits.** Each limit is a percentage of a model's enrollment TPM and RPM, shared by every project assigned to it. There is a default limit for unassigned projects. Per-model overrides let you build an allowlist (base 0% plus overrides) or a blocklist (an override at 0%). Projects in the same category can each burst to the percentage, and overlapping requests "retry until they succeed".
- **User limits.** Palantir sets defaults. Overrides can be a percentage (1 to 100) or absolute TPM and RPM. They apply per model, per user group, or as a default for all users. Where several group overrides apply, the highest wins. Below 50k TPM or 10 RPM some features break, and 0 is not supported. Configurable per-user limits shipped on 2 Jul 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07
- **Attribution decides which limits apply.** Requests charged to a project (Pipeline Builder, Logic, Automate, Chatbot Studio, Workshop) use enrollment and project limits. Requests charged to a user (AI FDE, Assist, Analyst, Pipeline Builder Explain/Generate, Continue, Claude Code) use enrollment and user limits.
- **Interactive vs batch.** Interactive traffic is Workshop, Chatbot Studio and Logic or Pipeline Builder previews. Batch traffic is transforms, Pipeline Builder and Automate running Logic. 20% of capacity at both enrollment and project level is always reserved for interactive use.
- **Reserved capacity.** Up to 50% of a model's capacity can be reserved and split across projects. If total capacity shrinks, reservations are kept up to 95% of the new total. Reservation costs nothing extra.
- **Autoscaling.** On by default for some OpenAI models since 21 Apr 2026. It raises limits up to 2x where Palantir has validated capacity, with per-project overrides. User folders are excluded. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-04
- **Registered (BYO) models.** Admins set enrollment and user limits when registering. Project limits default to 70%. [Fact] https://www.palantir.com/docs/foundry/aip/bring-your-own-model/
- **Observed reliability.** 99.9% uptime over the past year, and over 99% of failures came from enrollment or project limits. The largest cause of shortages is georestriction, and pipelines running millions of items are the hardest to support. [Vendor claim] capacity page.
- **Example policy from the docs.** Production project at 90%, testing at 30%, experimentation at 20%. User default at 10% for GPT-5 and Claude Sonnet 4.6. User home folders at 0% "to encourage shared work". [Fact]
- **Monitoring UI.** Resource Management > AIP usage & limits shows per-minute usage with drill-down to project, resource and user, rate-limit thresholds as dashed lines, two weeks of history, and an Analysis tab with daily cost by model. Since 30 Apr 2026, anyone with project view permission can see that project's usage, with rate-limit hits flagged. [Fact] capacity page; https://www.palantir.com/docs/foundry/announcements/2026-04

### 5. Token and compute accounting

- A token is about 4 characters. Tokens convert to compute-seconds at a per-model rate per 10k tokens, with separate input and output rates and three regional price bands. Examples for North America, input/output: GPT-4o 43/172, GPT-4o mini 2.6/10.3, GPT-5 20.5/163.6, Claude 3.5 Sonnet v2 46/232, Claude 4.5 Haiku 17.3/86.4. Some models have higher rates above a context threshold such as 128k or 200k. The rates apply to AWS-hosted enrollments on default terms and "do not apply to all customers". [Fact] https://www.palantir.com/docs/foundry/aip/aip-compute-usage/ (I read about 100k of the page's 154k characters, so the table I saw was incomplete.)
- **Attribution.** Usage is charged to the resource that made the request, for example the pipeline being explained. When no resource fits (Assist, Error Explainer), it goes to the user's folder. [Fact] same URL.
- **Logic surcharges.** 4 compute-seconds per Use LLM block execution (each loop iteration counts) and 8 per tool call, plus tokens, plus the compute of whatever the tool runs. Deterministic blocks cost nothing on their own. Worked example: 2 LLM blocks and 1 tool call per run is 16 compute-seconds per run before tokens. [Fact] https://www.palantir.com/docs/foundry/logic/compute-usage/
- **Analyst cost model.** Tokens grow over a conversation because history and tool results are resent every turn. Large tool results are the main cost driver. Enabled tool *definitions* are sent on every request, so switching off unused tool categories reduces cost. Model prices differ "by more than an order of magnitude". The docs suggest moving stable steps into functions (low token cost) or pro-code agents. [Fact] https://www.palantir.com/docs/foundry/aip-analyst/compute-usage/
- **Export.** The "AIP Token Usage" dataset reports daily usage by model and resource, with input, output and cache read/write tokens separately, plus compute-seconds and currency. It requires the Resource Management Administrator role (since 28 May 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
- **Registered models** carry no Palantir platform fee. The provider bills the customer directly, and that spend does not appear in Resource Management. [Fact] https://www.palantir.com/docs/foundry/aip/bring-your-own-model/

### 6. Bring-your-own-model, provider-compatible APIs and proxy layers

**Plain English.** A customer can plug in its own Azure OpenAI account, a fine-tuned model or a GPU server, and AIP treats it like any other model.

**Technical detail.**
- **Registered models** reached GA on 21 May 2026 and replaced the older "function interface" method, which is now legacy. They support tool calling, reasoning, structured outputs, vision and streaming. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
- **Sources.** (a) A REST API source in Data Connection, recommended when the model speaks a standard provider API. (b) A compute module, meaning a container hosting a model server on customer hardware, on-premises or air-gapped, or acting as a custom proxy. (c) Self-hosting inside a compute module. [Fact] https://www.palantir.com/docs/foundry/aip/bring-your-own-model/
- **Where registered models work.** AI FDE, Analyst, Chatbot Studio, Logic, Workshop and TypeScript functions. They do **not** work in AIP Assist or in Pipeline Builder's Generate and Explain features, and Palantir has no plans to add them. [Fact] same URL.
- **Governance.** Only enrollment admins can register a model, and they need Owner or Editor on the source. Source permissions are decoupled, so end users do not need access to the source. Enablement can be granted to the whole enrollment or to groups. A model-specific markings policy fully replaces the enrollment policy. [Fact] same URL.
- **Proxy or federation layer.** This is a compute module between AIP and providers, used for PII redaction, injecting system prompts, remapping API formats, and routing across providers by cost, latency or availability. Provider keys are stored as source secrets and read from the `SOURCE_CREDENTIALS` environment variable, with at least 1 replica. Failover is not described. [Fact] https://www.palantir.com/docs/foundry/aip/build-a-proxy-or-federation-layer/
- **Provider-compatible proxy endpoints** under `/api/v2/llm/proxy/`: Anthropic Messages, OpenAI Chat Completions, Responses and Embeddings, plus beta xAI and Google endpoints. Auth is a bearer Foundry token. These endpoints enforce the same zero retention, georestriction and rate limits. An optional `X-Palantir-session-id` header (under 256 characters) asks Foundry to route related requests to the same backend on a best-effort basis, to improve prompt-cache hits. [Fact] https://www.palantir.com/docs/foundry/aip/llm-provider-compatible-apis/
- **Web search tool.** Supported OpenAI models can search the web with citations, via Direct OpenAI or Bedrock, once an admin enables it (3 Nov 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-11

[Inference] The provider-compatible proxy is the cheapest thing in this file to copy. It is one endpoint that speaks the Anthropic, OpenAI and Qwen-compatible formats, adds auth, metering, rate limits and a policy check, and forwards the request. Every SDK then works unchanged.

### 7. Markings and what reaches an LLM

**Plain English.** Markings are labels such as "PII" or "Export-controlled" that a user must hold to see data. AIP lets an admin say "only sessions carrying these markings may talk to models".

**Technical detail** ([Fact] https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/ , shipped 12 Oct 2026 per https://www.palantir.com/docs/foundry/announcements/2026-10):
- There are two policies: "Allow any data" or "Allow only the following markings". A request passes only if *every* mandatory marking on the request's session token is in the allowlist. A token with no mandatory markings always passes.
- The check uses the **session token**, not the data in the prompt. A user cleared for markings A and C, with an allowlist of A and B, is blocked even if the prompt contains only A data.
- The fix is a **scoped session**, where the user narrows their session to fewer markings.
- The policy covers interactive use and automations, and agents such as AI FDE. Registered models can override it with a stricter or looser policy.
- **Row and column security applies only to reads.** In Logic, restricted views and object or property security policies apply when the Query objects tool reads data. They do not cover model output or edits made through Apply actions. Palantir says to pair them with markings or classification-based access control to protect downstream data. [Fact] https://www.palantir.com/docs/foundry/logic/blocks/
- **Log markings are not inherited.** When log access is enabled, only the markings an admin explicitly applies are enforced on logs. They are not inherited from the data the execution touched, so admins must set them to the highest sensitivity the workflow could reach. [Fact] https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/

[Inference] Checking the session is coarse but safe and cheap, because nothing has to classify the prompt. A product for mid-sized companies could copy it as "this agent's session is narrowed to these data scopes before any model call".

### 8. AIP Logic

**Plain English.** Logic is a no-code canvas for building one AI function. Example: "given a Support Ticket object, classify its priority and propose an assignee", chaining an LLM step with lookups and an Action.

**Technical detail.**
- **Function shape.** Inputs are objects, strings and similar. The output is a value, an object or Ontology edits. Logic functions can be called anywhere a function can, such as Workshop, Actions, Automate, Chatbot Studio tools and OSDK. To edit the Ontology, the function "must be published and called from an action". [Fact] https://www.palantir.com/docs/foundry/logic/core-concepts/
- **Blocks** ([Fact] https://www.palantir.com/docs/foundry/logic/blocks/):
  - *Use LLM* has a prompt, tools and an output. Prompt guidance: task overview first, then data, then when to use tools. The model sees only what you pass in, and `/` inserts inputs, block outputs or object properties. Output can be a Struct to return several named values. [Fact] plus https://www.palantir.com/docs/foundry/logic/faq/
  - *Tools* inside Use LLM, grouped as data, logic and action: **Apply actions** (with a description of when to use each Action), **Call function** (code functions or other Logic functions), **Query objects** (choose object types and limit the properties exposed to save tokens, with "Configure object return limits" capping objects returned) and a **Calculator**.
  - *Tool-calling mode*: "prompted" (tool instructions are injected into the prompt) or "native" (the provider's tool API). Logic switches to native automatically when every model in the block supports it, and the Debugger shows a notice.
  - *Apply action* calls an Action deterministically, with no LLM involved.
  - *Execute function* calls TypeScript, Python or Logic functions.
  - *Conditionals* are multi-branch if/else blocks. All branches must return the same type, and if they return edits, each branch must run an action or explicitly take no action.
  - *Loops* run over Lists only (an Array is converted automatically), expose `element` and `index`, and output either values or edits. Loops without actions run in parallel.
  - *Create variable* supports array, boolean, date, double, float, integer, long, object, short, string and timestamp.
- **Execution identity.** User-scoped is the default and runs with the invoker's permissions; each user sees only their own logs, kept for 24 hours. Project-scoped runs with the project's permissions; all resources must be imported into the project, users still need the markings, and logs are visible to everyone with project access. Project-scoped mode can also write an optional run-history dataset that keeps the last 10,000 runs. [Fact] https://www.palantir.com/docs/foundry/logic/execution-mode-settings/
- **Staged writes (beta)** ([Fact] https://www.palantir.com/docs/foundry/logic/staged-writes/):
  - All edits go to temporary storage and are applied when execution completes.
  - Later reads in the same run see the edits from nested calls.
  - Staged-write functions can call other edit-making functions and actions, and they lift legacy restrictions on filters after an edit.
  - Toggling the mode on a function that returns edits publishes a new **major version**. Existing consumers do not auto-upgrade.
  - Staged writes will become the default for new functions, and the legacy mode will be deprecated.
- **Limits** ([Fact] https://www.palantir.com/docs/foundry/logic/faq/):
  - Each block has its own context window and token budget. Tool responses count toward it.
  - Calls from Workshop or the function API time out after **five minutes**. The Debugger does not enforce this limit, which is a stated failure mode: a function can pass in the Debugger and fail in production.
  - Temperature is set in the block's Configuration field and defaults to 0.
- **Debugging.** The Debugger shows the LLM's chain of thought for each block, the tool calls it made, and token usage per message (a red bar means high usage). "Add as test case" turns a past run into an eval case. The version-history sidebar supports compare and rollback. [Fact] https://www.palantir.com/docs/foundry/logic/core-concepts/ , https://www.palantir.com/docs/foundry/logic/faq/
- **Palantir's reliability advice for Logic** ([Fact] FAQ):
  - Keep 5 to 10 input/output examples as unit tests and rerun them after every prompt change.
  - Add few-shot examples.
  - Ask the model to explain its plan so you can spot missing context.
  - Split a block when its results become inconsistent or it nears its context limit.
  - Prefer deterministic blocks.
  - Build a feedback loop: store each recommendation and its reasoning on a "Suggestion" object, write back the human decision, and give the LLM a Query objects tool over past suggestions. This is how "dynamic few-shot" works.
- **Branching.** Logic files can be edited on Global Branches. Branch publishes are tagged "Branched pre-release" and are invisible to main. Main can be protected so that changes require proposals and reviewers. A merge requires the branch to be up to date with main, published, error-free, and free of pending approvals. API names cannot change on a branch, and branches can only be created from main. [Fact] https://www.palantir.com/docs/foundry/logic/branching-logic/

### 9. AIP Chatbot Studio (formerly AIP Agent Studio)

**Plain English.** Chatbot Studio is a no-code builder for chat assistants embedded in apps. Example: a maintenance chatbot inside a Workshop screen, which sees the aircraft the user has selected, can search manuals, and can file a work order after the user confirms.

**Naming.** It was renamed from AIP Agent Studio in the week of 27 Apr 2026. "AIP Agents" became "AIP Chatbots", and the API endpoints kept the old "Agent" names. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-04

**Definition components** ([Fact] https://www.palantir.com/docs/foundry/chatbot-studio/core-concepts/):
- The system prompt is compiled from instructions plus tool descriptions plus variable descriptions.
- Application state, retrieval context and tools are the other parts.
- The context window holds the system prompt, history, injected context, state and tools. If it overflows, the user must start a new session.

**Retrieval context types.** Any number can be combined, and retrieval runs on *every* user message. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/retrieval-context/
- *Ontology context* uses a fixed set of N objects, or semantic search for the top K (which requires a vector property). The starting set can be static (the whole type) or a variable (a filtered object set from app state). You choose which properties are printed; media references and vectors are excluded. Outputs can be routed to variables.
- *Document context* sends either full document text, or (in beta) the top K semantic chunks.
- *Function-backed context* is a TypeScript v1 function implementing the `AipAgentsContextRetrieval` interface. It takes `messages` and returns a `retrievedPrompt` string that is inserted into the system prompt. It can take string or object-set variables, and it can tell the LLM to emit custom XML citations. This is how hybrid keyword plus semantic retrieval is built.
- *Custom documentation context* uses Notepad or Markdown documents registered for AIP Assist. [Fact] https://www.palantir.com/docs/foundry/assist/agents-in-aip-assist/

**Tool types** ([Fact] https://www.palantir.com/docs/foundry/chatbot-studio/tools/):
- **Action** applies an Ontology edit, either automatically or after the user confirms.
- **Object query** covers several object types with a limited property list, and supports filter, aggregate, inspect and link traversal.
- **Function** can call any Foundry function, including Logic. It uses the latest version by default or can be pinned to a version.
- **Update application variable** sets a variable.
- **Command** triggers a UI operation in a paired Palantir app, such as moving a map. It requires user approval by default, the retention window expires after 24 hours of inactivity, and commands are ignored when the chatbot runs as a function in Automate. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/commands-as-tools/
- **Request clarification** pauses so the bot can ask the user a question.
- **(Legacy) Ontology semantic search** is superseded by Ontology context.

**Tool modes.** Prompted mode works with all tools and models but makes one call at a time and uses tokens less efficiently. Native mode supports parallel calls and is faster and cheaper, but only works with Action, Object query, Function and Update variable tools, and only on a subset of Palantir-provided models. "View reasoning" exposes the reasoning trace. [Fact] tools page.

**Application state** ([Fact] https://www.palantir.com/docs/foundry/chatbot-studio/application-state/):
- Variables are strings or object sets. Each has a description that is injected into the prompt, and a visibility flag that controls whether the LLM can read the value. Palantir advises keeping visibility off where possible.
- There are three write paths: (1) *deterministic* mapping of tool or context outputs to a variable after streaming, which Palantir recommends; (2) the LLM-driven Update variable tool; (3) clicking a citation.
- *Deterministic tool inputs*: Action and Function tool parameters can be bound to variables instead of LLM-generated values. Values are frozen at the start of the reasoning loop. Palantir cites "more consistent behavior and lower token usage".
- In Workshop, variables map to Workshop variables of the same type, which lets the chat drive other widgets.

**Citations.** Supported types are object, PDF document (with page), external URL and function-backed (when prompted for). They use a small XML grammar: `<citation><key>RID</key>`, `objectTypeId` plus `primaryKey`, `mediaSetKey` plus `mediaItemKey` plus `page`, and `name` plus `href`. Responses carry a Sources dropdown, and clicking a citation can set a variable. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/citations/

**Deployment.**
- *Workshop widget.*
- *AIP Assist mode.* Toggled on under Usage. Publishing creates version 1.0, and later changes need a new publish. [Fact] https://www.palantir.com/docs/foundry/assist/agents-in-aip-assist/
- *Chatbot as a Function.* Inputs are `userInput` and an optional `sessionRid` (omit it for a new session, never pass an empty string). Outputs are `markdownResponse`, `sessionRid` and any variables that changed. Optionally a minor version is published on every save. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/chatbots-as-functions/
- *Platform APIs / OSDK.* Create Session, Blocking Continue, Streaming Continue, Get Session, Get Content and Get Session Trace (with a client-generated UUIDv4 `sessionTraceId` so you can poll while the answer streams). `parameterInputs` and `parameterUpdates` carry state. A Developer Console app must explicitly include every object, action and function type the bot uses, plus its projects, and the "AIP Chatbots write permission". It does **not** update automatically when the bot changes. Under OSDK the bot must use resources from a single Ontology. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/foundry-apis/

**Permissions.** A chatbot is a filesystem resource. Users need read access to its folder, access to its sources, and access to its model. [Fact] https://www.palantir.com/docs/foundry/assist/agents-in-aip-assist/

**Session logging.** Each message is one execution with a `traceId`. Events are `session_metadata`, `user_request`, the chat messages, `tool_call`, `tool_call_result`, `final_response` and `execution_error`. Common fields are `uid` and `owning_rid` (the originating bot, function or app, even through nested calls). Logs export to a streaming dataset that the docs say to mark and to retain only as long as needed. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/

### 10. The Agent Stack: Agent Builder, Agent Manager and Agent SDK

**Plain English.** This is Palantir's newer runtime for agents that run longer than a single chat and can wait for people. Example: an airline rebooking agent takes an airport code, pre-computes the cancelled flights before it starts, proposes rebookings, and pauses for an operator.

**Core concepts** ([Fact] https://www.palantir.com/docs/foundry/aip/agent-stack/):
- **Sessions** hold state, context items and event history. They can last indefinitely and can have several participants.
- **Context items** are strongly typed records such as messages, tool results and recommendations.
- **Events** bring input into a session. A state machine and event handlers decide what happens next.
- Agents are published as Compass (filesystem) resources. Agent Manager shows sessions subject to the viewer's mandatory and discretionary access.
- Integrations: Workshop embedding, Automate (to create sessions or send events) and platform APIs. OSDK and Logic integration are marked "coming soon".

**Agent Builder (beta)** ([Fact] https://www.palantir.com/docs/foundry/agent-builder/core-concepts/ , https://www.palantir.com/docs/foundry/agent-builder/overview/):
- **Inputs** can be required or optional.
- **Pre-computed variables** run before the agent: filtered object sets, function results, and even Actions. Those Actions run at session start even if nothing references them. In Preview, the Actions run but their edits are not applied.
- There is a **system prompt** and an **initial user message**.
- **Tools** can be functions, actions, Ontology queries, Ontology SQL, or custom tools built in a no-code tool builder.
- **Completion** is either "stays open" (conversational) or "ends after first valid output" matching a typed Agent output.

**Agent Manager.** It shows a session timeline filterable by event type and time, searchable payloads, a Preview pane (conversation), a Raw pane (context items) and session state. You can pin a past event to see the state at that moment, which shows where behaviour diverged. There are Trace (telemetry spans) and Logs tabs. [Fact] https://www.palantir.com/docs/foundry/agent-manager/session-debugging/

**Agent SDK (TypeScript)** ([Fact] https://www.palantir.com/docs/foundry/agent-sdk/overview/ , https://www.palantir.com/docs/foundry/agent-sdk/customize-agent/ , https://www.palantir.com/docs/foundry/agent-sdk/advanced-customization/):
- `defineAgent({ systemPrompt, model, tools, contextItemDefinitions, agentStateSchema, createSessionArgsSchema, createSession, handleEvent ... })`.
- `systemPrompt(state)` runs before *each* model request, so a change in state changes the instructions.
- `model` is any `LanguageModel` object exposing `generateResponse`. It can be a function of state, so the model can change at runtime. You can wrap models for fallback, for example switching to a backup when the primary response has a terminated status. Built-in constructors are `anthropic`, `openAi`, `openAiChat`, `google` and `xAi`, each taking a model resource id from "Resource imports" plus `modelSettings`.
- `tools` can be a function of state. Tools are built with `zodTool(name, description, argsSchema, emits, execute)`. A tool returns context items and events. A thrown error is shown to the model on the next turn.
- **Context items** use `zodContextItem(type, argSchema, dataSchema, create, render)`. `render` returns `RenderResult.ready` or `RenderResult.pending`. Removing an id from `contextItemOrder` hides an item from the model without deleting it, which manages the context window.
- **Long-running tools** return a *pending* item at once and finish later through `zodContextItemEffect` and `zodContextItemEvent`, so the UI can show progress.
- **Human-in-the-loop** works the same way: the tool returns a `UserQuestion` item, and the human's answer is dispatched as an event.
- The **state machine** processes queued events in order. `handleEvent(state, event)` returns updates (`setAgentState`, create, delete or reorder items) and effects. Effects come from `zodSessionEffect` with declared emitted events. Custom events come from `zodSessionEvent`. Event sources include users, schedules and effects.
- **Ontology access** goes through the TypeScript OSDK. Resources must be imported or calls fail with permission errors. *Applying actions requires "scoped mode"*, which is turned on in Scope settings.

[Inference] This is an event-sourced agent design in the style of Redux or the Elm architecture: deterministic reducer, typed state, side effects as messages. It makes sessions replayable and debuggable at any point in time, which explains why Agent Manager can "pin the timeline to an event". It is the strongest single design to copy.

### 11. Pro-code agents, templates and scoped permissions

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

### 12. Palantir MCP vs Ontology MCP

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

### 13. AIP Evals

**Plain English.** Evals are unit tests for AI functions that tolerate randomness. Example: 50 historic tickets with known correct priorities. Each one runs 3 times against two prompt versions, and you compare pass rates.

**Technical detail.**
- **Concepts.** Suite, test cases, targets (one or more functions), evaluators, runs, metrics. Targets can be Logic functions, chatbots published as functions, or code functions. [Fact] https://www.palantir.com/docs/foundry/aip-evals/overview/
- **Test cases.** Manual, or backed by an object set, where each case is an object and columns come from properties, linked objects, linked-object properties (Object Storage v2) or static values. "Add as test case" works from Logic run history. [Fact] https://www.palantir.com/docs/foundry/aip-evals/create-suite/ , https://www.palantir.com/docs/foundry/logic/faq/
- **Built-in evaluators (20).** Exact boolean, boolean array, string and string array match; regex; Levenshtein distance; string length; keyword checker; exact object match; object set contains; object set size range; integer range; exact numeric match (with optional deviation); numeric array match; float range; temporal range; exact temporal match; generic exact match; **LLM-as-a-judge** (true/false on a user-written condition, with reasoning shown as debug output); and **ROUGE** (rouge1, rouge2, rouge3, rougeL, rougeLsum). [Fact] create-suite page. Note: the 14 Apr 2026 announcement says AI FDE has "19 built-in evaluators", and lists Rubric Grader, Contains Key Details and ROUGE as Marketplace evaluators. So the count and packaging have shifted over time. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-04
- **Custom evaluators** are any published function, including a Logic function, that returns at least one boolean or numeric metric. A `struct` returns several metrics, and its string fields become debug output. [Fact] create-suite page.
- **Pass criteria.** Boolean metrics pass on True or False. Numeric metrics have a goal of Increase (minimum threshold) or Decrease (maximum threshold), with inclusive thresholds. A case fails if any metric fails in any iteration. A case with no pass/fail metrics shows "Ran successfully". Optional metrics that do not apply show "No value" and are excluded from aggregates. [Fact] create-suite page; https://www.palantir.com/docs/foundry/logic/core-concepts/
- **Run configuration.** Target version or branch. Input mapping. Execution mode: project-scoped is the default (results kept indefinitely and written to the results dataset; not supported for chatbots or stateful functions) or user-scoped (only you can see results, for 24 hours). **1 to 100 iterations per case, up to 15,000 executions per run, at least 3 recommended for LLMs, up to 10 cases in parallel** (lower this to avoid rate limits). Metadata such as branch, version and model is captured automatically, plus custom key-value pairs. Side-by-side run comparison has a "View diff" option. [Fact] https://www.palantir.com/docs/foundry/aip-evals/run-suite/
- **Experiments.** Grid search over parameters such as model and prompt suffix. To do this, the model becomes an optional input and each Use LLM block points at that variable. **Max 25 runs per experiment. Up to 4 runs compared side by side.** Results can be grouped by parameter. [Fact] https://www.palantir.com/docs/foundry/aip-evals/experiments/
- **Intermediate parameters.** A flask icon on a Logic block exposes its output for grading. This is not supported inside loops or custom tools. Top-level flagged blocks always run; nested ones may come back null. [Fact] https://www.palantir.com/docs/foundry/aip-evals/intermediate-parameters/
- **Ontology edits.** Each test case runs in its **own Ontology simulation**. Evaluators find created objects by an identifying property (expecting exactly one), receive simulated versions of edited objects, and check that deleted objects return a count of zero. [Fact] https://www.palantir.com/docs/foundry/aip-evals/ontology-edits/
- **Results dataset.** This applies to project-scoped runs only. It records outputs, evaluator results, metadata and errors. It does not record per-metric pass/fail ("not yet supported"), outputs of functions that edit the Ontology, judge reasoning, or single-case runs. [Fact] https://www.palantir.com/docs/foundry/aip-evals/results-dataset/
- **AI-assisted eval work.** "Generate with AI FDE" builds a starting suite. "Analyze in AI FDE" finds root-cause patterns in failing cases and suggests prompt changes. AI FDE can write, run and fix suites (14 Apr 2026). [Fact] https://www.palantir.com/docs/foundry/aip-evals/analyze-run-results/ , https://www.palantir.com/docs/foundry/announcements/2026-04
- **Pipeline Builder** gained LLM eval suites for Use LLM nodes (GA 10 Sep 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09

### 14. Automate and agents triggered by Ontology changes

**Plain English.** Automate is "when X happens in the data, do Y". Example: when a new high-priority Alert object appears, run a triage Logic function and stage its proposed assignment for a supervisor to approve.

**Technical detail.**
- **Conditions.** Time-based, object data, combined, dataset updated, and streaming. [Fact] https://www.palantir.com/docs/foundry/automate/overview/
- **Object conditions** ([Fact] https://www.palantir.com/docs/foundry/automate/condition-objects/):
  - Objects added to a set (live or scheduled).
  - Objects removed from a set (live or scheduled).
  - Objects modified in a set (live only; can be limited to chosen properties).
  - Run on all objects (scheduled, with batch size and parallelism settings).
  - Threshold crossed (scheduled; Automate-defined logic or a function returning true/false).
  - Metric changed (being retired).
  - Changes are "typically picked up within minutes".
- **Effects.** Action, Logic, Function and Notification. Action, Logic and Function effects can each have a fallback effect. There are per-effect automatic retries for transient errors such as rate limits, and event retries for persistent errors. Effects can run sequentially or in parallel, with **at-least-once** semantics. [Fact] https://www.palantir.com/docs/foundry/automate/effects/
- **Execution identity.** Conditions are evaluated with the *owner's* permissions. Action, Logic and Function effects run as the *owner*. Notifications use each recipient's permissions. An automation can be owned by a third-party application's service user, so it keeps working when a person leaves. [Fact] https://www.palantir.com/docs/foundry/automate/security/ The pro-code agent page instead says agents run "as the user who triggered the automation or as the automation's service user". [Fact] https://www.palantir.com/docs/foundry/agents/publish-and-call/ The two pages describe identity differently, and I could not open the Automate permissions page to reconcile them. [Unverified]
- **Limits** ([Fact] https://www.palantir.com/docs/foundry/automate/limits/):
  - 100k input objects for scheduled added/removed conditions.
  - 1M input objects for "run on all objects".
  - 10k objects per evaluation, both real-time and scheduled per-object.
  - Batch size 1,000.
  - 5M objects for manual execution.
  - 45 minutes maximum in the execution queue.
  - **4-hour maximum run time**.
  - Automations can be paused automatically on excessive activity.
- **Human review of AI edits.**
  - With staged writes on, the Logic function is wrapped in an Action, and the Action effect can be *staged* as a proposal.
  - Proposals appear under "Agent proposals", showing why each was created, a preview, and the agent's decision log.
  - Accepting a proposal runs the Action.
  - Palantir recommends staging consequential or ambiguous actions, and auto-applying only when "purpose, impact, and recovery path justify it".
  - Open proposals are visible only to the automation creator, for 24 hours. [Fact] https://www.palantir.com/docs/foundry/logic/aip-logic-integration-automate/
- **Branching and AI authoring.** Automate supports Global Branching (9 Jul 2026). AI FDE can create and modify automations (27 Aug 2026), but not yet function or agent effects. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07 , https://www.palantir.com/docs/foundry/announcements/2026-08

### 15. Observability and tracing

- **Components.** Metrics (success/failure counts and P95 for functions, actions and Logic), execution history, distributed tracing, service logs, log search, performance monitoring, Workshop dashboards (Observability Chart widget, GA 21 Jul 2026, 30-day metrics), and log export to a streaming dataset. All sit inside Workflow Lineage. [Fact] https://www.palantir.com/docs/foundry/aip-observability/overview/ , https://www.palantir.com/docs/foundry/announcements/2026-07
- **Execution history retention conflicts.** The general observability page says 7 days of execution history. The AIP observability page says 30 days. Metrics are 30 days in both. [Fact, conflicting] https://www.palantir.com/docs/foundry/observability/overview/ vs https://www.palantir.com/docs/foundry/aip-observability/overview/
- **Trace view.** Nested spans are coloured by type (function, action, automation, model, LLM call). Each span shows duration, function inputs and outputs, **LLM prompt, response and token usage**, and errors with stack traces. Identifiers are `foundryTraceId` and `x-b3-traceid` (B3 propagation, best-effort). [Fact] https://www.palantir.com/docs/foundry/aip-observability/trace-view/
- **"Source executor".** The first executable resource in a call chain (function, action, automation, Logic, agent, model deployment). Log search and permissions are keyed on it. [Fact] https://www.palantir.com/docs/foundry/observability/overview/
- **Log permissions.** You can always see your own executions for 24 hours, except on CBAC stacks. To see other people's executions you need Edit on the source executor, log access enabled on its project, and every marking applied to the logs. Configuring log access requires Information Security Officer or Enrollment Admin. [Fact] https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/
- **Other recent features.** Global log search across a workflow graph (GA 29 Sep 2026). Failure-rate colouring on Logic and function nodes (Aug 2026). An **Object timeline** that shows edits to an object by agents or humans with attribution, total tokens, runtime, *time spent waiting for humans* and "agentic coverage" (11 Aug 2026). An Autopilot workbench that visualises automations, Logic, actions and pro-code agents together (beta, Mar 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09 , https://www.palantir.com/docs/foundry/announcements/2026-08 , https://palantir.com/docs/foundry/announcements/2026-03/

### 16. Retrieval: semantic search, embeddings, documents and "ontology-augmented generation"

**Plain English.** To answer from manuals or contracts, documents are cut into chunks. Each chunk becomes an object with an embedding, so agents can find the right passage and cite the page.

**Technical detail.**
- **OAG as Palantir describes it.** The docs page is about retrieval technique. [Fact] https://www.palantir.com/docs/foundry/ontology/ontology-augmented-generation/
  - Basic flow: chunk the documents, create chunk objects with a media reference, search, and show results in a PDF viewer.
  - Advanced techniques: HyDE; ranked keyword search in Object Storage v2; query *enrichment* (add synonyms, remove stopwords, for keyword search) and *extraction* (reduce the question to its core action, for semantic search); hybrid search with RRF, score = Σ 1/(k + rank).
  - Advice: if the context fits the window, skip search. When answers are bad, check retrieval first.
- **OAG in the blog framing.** A Palantir forward-deployed architect calls OAG a "more expansive, decision-centric version" of RAG. In this framing the LLM also gets *logic tools* (forecasts, optimisers) and *actions* that write back to source systems. [Vendor claim] https://blog.palantir.com/building-with-palantir-aip-data-tools-for-rag-oag-b3b509c8b0f3 (post undated)
- **Vector properties and KNN.**
  - The Pipeline Builder "Text to Embeddings" expression writes to a `vector` property.
  - Workshop KNN filter: K from 1 to 100, not sortable by relevance.
  - TypeScript v1: K up to 100, and needs `"enableVectorProperties": true`.
  - TypeScript v2: `numNeighbors` from 1 to 500, embeds the query internally, and supports relevance ordering.
  - Python `nearest_neighbors` returns `_score`.
  - In Logic, a published search function becomes a tool; the docs example prompts the model with k = 5.
  - [Fact] https://www.palantir.com/docs/foundry/ontology/using-palantir-provided-models-to-create-a-semantic-search-workflow
- **Palantir MCP `semantic_search`** finds objects by natural-language similarity. [Fact] https://www.palantir.com/docs/foundry/palantir-mcp/available-tools/
- **AIP Document Intelligence.**
  - Extraction is either "traditional" (PDF metadata, OCR, layout detection) or VLM-based. An optional "Preprocess document" step passes OCR text plus the page image to the VLM.
  - Extraction quality can be evaluated with a VLM-as-judge rubric scored 1 to 5 for tables and headers. This requires Claude 4 Sonnet on the enrollment.
  - Strategies deploy to Python transforms (batch) or per-page Python functions (GA 28 Jul 2026, with optional chunking and embeddings).
  - Markdown-aware chunking and embeddings shipped on 17 Mar 2026.
  - [Fact] https://www.palantir.com/docs/foundry/document-intelligence/core-concepts/ , https://www.palantir.com/docs/foundry/announcements/2026-07 , https://palantir.com/docs/foundry/announcements/2026-03/
  - I could not read chunk sizes or overlap. [Unverified]
- **Pipeline Builder "Use LLM" node.** Runs LLMs over rows at scale, with "trial runs" on a few rows first. [Fact] https://www.palantir.com/docs/foundry/aip/aip-features

### 17. AI FDE (AI Forward Deployed Engineer)

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

### 18. AIP Analyst, AIP Assist and other in-app AI features

- **AIP Analyst** (GA week of 13 Apr 2026) is an agent for ad-hoc analysis. [Fact] https://palantir.com/docs/foundry/announcements/2026-03/ , https://www.palantir.com/docs/foundry/aip-analyst/capabilities/
  - Tool categories: Ontology (search, object sets, Ontology SQL, aggregations, geo); Vega-Lite visualisation; planning (clarify, clean context, toggle tools, skills); datasets (SQL); functions; actions (need approval unless set to auto-submit); media (PDF page ranges, PDF semantic search); time series; integrations (Notepad, Quiver, Contour, Workshop lookup, Machinery lookup).
  - Each analysis shows a dependency graph with inline citations.
  - Saved "analysis resources" store messages, tool calls and references but **not results**. On reopening, tools are re-run against live data under the viewer's permissions. [Fact] https://www.palantir.com/docs/foundry/aip-analyst/analysis-resources/
  - Can be embedded as a Workshop widget or iframe.
- **AIP Assist** is the in-product help sidebar (Cmd/Ctrl+Shift+U). Modes cover platform docs, developer docs and custom sources. It knows which app the user is in. Palantir says Assist "does not access your data". Custom docs are Notepad documents or a Markdown documentation repo. Published chatbots can appear as Assist modes. [Fact] https://www.palantir.com/docs/foundry/assist/overview/
- **Other in-app AI.**
  - Pipeline Builder: Use LLM node, Text to Embeddings, Explain, Regex helper, Transform Assist.
  - Notepad: rewrite and translate.
  - Scheduler: natural-language to cron.
  - SQL Studio side panel (GA Jun 2026).
  - Workshop SQL variables from natural language (Aug 2026).
  - Insight copilot (beta, 19 Nov 2026).
  - Pilot app builder (GA Oct 2026), which generates an Ontology plus React OSDK front ends.
  - Realtime voice models with tool calling.
  - [Fact] https://www.palantir.com/docs/foundry/aip/aip-features , https://www.palantir.com/docs/foundry/announcements/2026-06 , https://www.palantir.com/docs/foundry/announcements/2026-08 , https://www.palantir.com/docs/foundry/announcements/2026-11 , https://www.palantir.com/docs/foundry/announcements/2026-10
- **AIP Threads** runs LLM tasks over uploaded documents or existing chatbots with no setup. [Fact] https://www.palantir.com/docs/foundry/aip/aip-features

### 19. AIP Evolve, Boardroom and Machinery

- **AIP Evolve** (beta 18 Aug 2026, GA 8 Sep 2026). You set a target, a goal (model migration, cost, latency, eval score or custom), validation (selected cases or existing suites) and constraints (allowed change types, maximum iterations). A graph of AI FDE agents (analysis, test creation, model swap, evaluation, prompt engineering, proposal writing) produces a proposal with validation results, output comparisons, a confidence assessment and limitations, reviewed in Global Branching. You can resume with new instructions. [Fact] https://www.palantir.com/docs/foundry/aip-evolve/overview/ , https://www.palantir.com/docs/foundry/announcements/2026-09
- **Boardroom** (beta) runs multi-agent teams: a "director" agent plus specialist agents, each with its own instructions, model, tools and context. Modes are chat, meetings (live transcription to tasks), documents, slide decks and plans (one team drafts, another critiques over several rounds). Sessions are stored as Ontology objects under object security policies. It requires the "Mindkit" Ontology product. [Fact] https://www.palantir.com/docs/foundry/boardroom/overview/
- **Machinery** (process modelling) ([Fact] https://www.palantir.com/docs/foundry/machinery/core-concepts/ , https://www.palantir.com/docs/foundry/machinery/overview/):
  - A process object is an object type with a string *state* property drawn from a finite set; an enum value type keeps it in sync. States are nodes. Actions are transitions, imported and given roles.
  - Each object is in exactly one state. Concurrent conditions are modelled as linked sub-processes under a parent.
  - Machinery maintains a **Log object type** of every state change. For external processes you supply a changelog dataset, and it derives the previous state, time in state and path taken (process mining).
  - The overview says Machinery orchestrates multiple automations and agents in multi-step AIP workflows, with apps for supervising them with human intervention. Examples: claims, patient journeys, purchase-to-pay, order-to-cash.

### 20. Human-in-the-loop patterns (collected)

All [Fact]; sources in the sections above.
1. **Action confirmation** in Chatbot Studio: the tool runs automatically or only after the user confirms.
2. **Command approval**: on by default, and the user sees the payload.
3. **Request clarification** tools: Chatbot Studio, AI FDE and Analyst.
4. **Plan-then-act**: AI FDE "Generate plan".
5. **Staged writes plus Automate proposals**, with a decision log, accept and apply.
6. **Branch proposals**: AI FDE, Palantir MCP Ontology changes, Evolve, bulk model swaps and Logic branch protection.
7. **Approval tiers by risk**: always-ask for actions and publishing, branch-aware auto-approval for edits, auto-approval for reads, session pre-approval scoped to a branch or project.
8. **The Agent SDK `UserQuestion` pending context item**, resolved by an event.
9. **Preview mode** in Agent Builder runs actions without applying edits; **evals simulate the Ontology**.
10. **The feedback object pattern**: store suggestions and human verdicts, and let the LLM query them.

## What to copy

1. **One model gateway with provider-compatible endpoints.** Expose `/llm/proxy/anthropic/v1/messages`, `/openai/v1/chat/completions` and `/openai/v1/responses` (Qwen via an OpenAI-compatible backend), authenticated with the platform token. Each request is checked for model enablement, markings and data-scope policy, rate limits and attribution before it is forwarded. Why: every SDK and agent framework works unchanged, and governance sits in one place. Source: https://www.palantir.com/docs/foundry/aip/llm-provider-compatible-apis/
2. **Attribute every LLM call to a project or a user, and decide which by caller type.** Builder-run workloads go to the project. Personal assistants go to the user. Store `model, input_tokens, output_tokens, cache_read, cache_write, resource_id, project_id, user_id, interactive|batch` on every call and roll it up daily. Why: cost visibility and the right limits for each caller. Sources: https://www.palantir.com/docs/foundry/aip/llm-capacity-management/ , https://www.palantir.com/docs/foundry/announcements/2026-05
3. **Three-level rate limiting with an interactive reserve.** Enforce TPM and RPM per model at tenant, project (percentage of the tenant limit, with per-model overrides where 0% blocks a model) and user level (default percentage, group overrides, highest group wins). Keep 20% for interactive traffic and allow optional reserved capacity of up to 50%. When a project limit is hit, retry internally before failing. Why: one batch job must not freeze chat users; Palantir reports most failures come from its own limits. Source: https://www.palantir.com/docs/foundry/aip/llm-capacity-management/
4. **Price tool calls separately from tokens.** Charge a flat unit per LLM step and per tool call on top of tokens, and show the arithmetic in a debugger. Why: tool loops are the hidden cost driver, and customers can see what they will pay. Source: https://www.palantir.com/docs/foundry/logic/compute-usage/
5. **The platform executes tools; the model only requests them.** Each tool runs under an explicit identity: the invoking user by default, or a project or service identity for automations whose resources are listed explicitly. Why: the model cannot exceed the caller's permissions. Sources: https://www.palantir.com/docs/foundry/logic/blocks/ , https://www.palantir.com/docs/foundry/logic/execution-mode-settings/
6. **Writes only through declared Actions, staged by default.** Agent edits go to a staging buffer that later reads in the same run can see, and are committed atomically at the end. Optionally the buffer is converted into a proposal with the agent's decision log, for accept or reject. Auto-apply should be opt-in per Action and justified by "purpose, impact, recovery path". Sources: https://www.palantir.com/docs/foundry/logic/staged-writes/ , https://www.palantir.com/docs/foundry/logic/aip-logic-integration-automate/
7. **An "agent tool description" field on every Action and object type.** Store text written for agents (when to use this, how to get the inputs) on the semantic model, and generate MCP and tool schemas from it. Source: https://www.palantir.com/docs/foundry/ontology-mcp/mcp-tools-and-agent-configuration/
8. **Two MCP servers.** A *consumer* MCP exposes a scoped app's object types, actions and query functions under OAuth: authorization code to act as the user, client credentials to act as a service. Scopes and user permissions are intersected. A *builder* MCP can propose schema changes but never writes data, and every schema change becomes a human-reviewed proposal. Add on-demand tool discovery (`search_tools`) to keep the startup context small. Sources: https://www.palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/ , https://www.palantir.com/docs/foundry/palantir-mcp/security/ , https://www.palantir.com/docs/foundry/announcements/2026-06
9. **An event-sourced agent runtime.**
   - Session = typed context items + agent state + an ordered event queue.
   - A pure `handleEvent(state, event) -> {updates, effects}`.
   - Effects are asynchronous jobs that report back by emitting events.
   - `systemPrompt(state)`, `tools(state)` and `model(state)` are recomputed before every model call.
   - Long tools and human questions are pending items resolved by events.
   - Persist the event log so any point in time can be inspected.
   - Source: https://www.palantir.com/docs/foundry/agent-sdk/advanced-customization/
10. **A context window controlled by the item list.** Hide items through an ordering list instead of deleting them, cap objects returned per query tool, and whitelist the properties exposed per object type. Sources: https://www.palantir.com/docs/foundry/agent-sdk/advanced-customization/ , https://www.palantir.com/docs/foundry/logic/faq/
11. **Deterministic bindings in chat assistants.** Let tool parameters be bound to UI or app variables (frozen at the start of the loop) and map tool outputs straight into variables. Use LLM-driven variable updates only where judgement is needed. Source: https://www.palantir.com/docs/foundry/chatbot-studio/application-state/
12. **Three pluggable retrieval sources**: object context (fixed N or top-K semantic), document context (full text or top-K chunks), and a function-backed context contract (`messages -> retrievedPrompt` string). Run retrieval on every user message. Use a tiny XML citation grammar (object id, document id plus page, URL) that the UI renders as clickable sources. Sources: https://www.palantir.com/docs/foundry/chatbot-studio/retrieval-context/ , https://www.palantir.com/docs/foundry/chatbot-studio/citations/
13. **A retrieval playbook in this order.** Use full context if it fits. Otherwise chunk objects with embeddings and KNN (cap k at 100 to 500), then add HyDE, query enrichment and extraction, and hybrid search with RRF only when evals show a need. Debug retrieval before prompts. Source: https://www.palantir.com/docs/foundry/ontology/ontology-augmented-generation/
14. **A markings and data-scope gate before any model call, based on the session.** Use a per-tenant allowlist of sensitivity labels, a per-model override, and a "scoped session" that the user or agent narrows before calling the model. Source: https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
15. **An eval harness with the same shape and limits.** Suite = cases (manual or generated from a filtered object query) × targets × evaluators.
    - Include exact, range, regex, Levenshtein and ROUGE evaluators, an LLM judge with stored reasoning, and custom function evaluators returning structs of metrics.
    - Pass criteria per metric, with inclusive thresholds.
    - N iterations per case, default 3, max 100, with up to 10 cases in parallel.
    - Grid-search experiments over model and prompt variants, max 25.
    - Each case runs against a sandboxed copy of the semantic model so writes are safe.
    - "Add run as test case" from production history.
    - Sources: https://www.palantir.com/docs/foundry/aip-evals/create-suite/ , https://www.palantir.com/docs/foundry/aip-evals/run-suite/ , https://www.palantir.com/docs/foundry/aip-evals/ontology-edits/
16. **Flagged intermediate outputs.** Let builders flag any step's output for grading, so a multi-step agent can be graded per step. Source: https://www.palantir.com/docs/foundry/aip-evals/intermediate-parameters/
17. **Data-change triggers for agents.** Support object added, removed and modified (with a property filter), threshold crossed and scheduled triggers. Provide fallback effects, per-effect retries for rate-limit errors, at-least-once semantics, batch size 1,000, a 4-hour maximum run, and owner or service-app identity so automations survive staff turnover. Sources: https://www.palantir.com/docs/foundry/automate/condition-objects/ , https://www.palantir.com/docs/foundry/automate/effects/ , https://www.palantir.com/docs/foundry/automate/limits/ , https://www.palantir.com/docs/foundry/automate/security/
18. **Asynchronous agent jobs write results to objects.** Synchronous tools have a 5-minute limit. Long agents run asynchronously, return nothing, and write transcripts and results to model objects that UIs and evals read. Arguments pass ids, and the agent re-fetches under its own scope. Source: https://www.palantir.com/docs/foundry/agents/publish-and-call/
19. **Traces carry prompts, responses, tokens and tool inputs/outputs, keyed by a trace id and a "source executor".** Users see their own traces for 24 hours. Seeing others' traces requires edit rights plus explicit log markings, which are not inherited. Sources: https://www.palantir.com/docs/foundry/aip-observability/trace-view/ , https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/
20. **A per-object agent timeline.** Show who (human or agent) changed each business object, with tokens, runtime and time spent waiting for humans. Source: https://www.palantir.com/docs/foundry/announcements/2026-08
21. **Risk-tiered approvals for any internal builder agent.** Reads are auto-approved. Edits are auto-approved on branches and need approval on protected main. Actions, publishing and anything external always need approval. Session pre-approval is scoped to a project or branch. Source: https://www.palantir.com/docs/foundry/ai-fde/security-and-governance/
22. **Skills as permissioned Markdown resources** with a name, a "when to use" description and a body, loaded on demand by description. They can be personal, shared by folder, or promoted to groups by an admin. Source: https://www.palantir.com/docs/foundry/ai-fde/aip-skills/
23. **Model categories (Fast, Balanced, Smart) instead of hard-coded model ids** in saved artifacts, plus a bulk model-swap tool that opens reviewable proposals. Sources: https://www.palantir.com/docs/foundry/announcements/2026-10 , https://www.palantir.com/docs/foundry/announcements/2026-05
24. **Saved analyses store the recipe, not the results.** Save messages, tool calls and references, re-run on open under the viewer's permissions, so a shared analysis never leaks data the viewer cannot see. Source: https://www.palantir.com/docs/foundry/aip-analyst/analysis-resources/
25. **A feedback object for dynamic few-shot.** Persist each AI recommendation, its reasoning and the human verdict as an object, and give the agent a query tool over it. Source: https://www.palantir.com/docs/foundry/logic/faq/

## What cannot or should not be copied

- **The catalog of about 90 models and the provider contracts.** Palantir's zero-retention and regional-routing guarantees rest on enterprise agreements with Azure, Bedrock, Vertex, Anthropic, OpenAI and xAI. A solo founder cannot negotiate that at launch. [Inference] Use the providers' own zero-retention and enterprise terms, or let customers bring their own keys, which is Palantir's "registered model" path, and be explicit about which guarantees come from whom.
- **Enrollment tier sizes.** Numbers like 10M TPM for XLarge reflect pooled capacity across Palantir's whole customer base. [Inference] Copy the shape of the limits, not the numbers.
- **The full set of builder apps.** Pipeline Builder, Workshop, Quiver, Contour, Notepad, Machinery, Boardroom and Pilot are separate products. Rebuilding even three of them would sink a solo build. [Inference] Most can be replaced by a chat or agent surface plus a small admin UI.
- **Global Branching across every resource type.** Palantir's proposals depend on branchable datasets, Ontology, functions, automations and apps. [Inference] A smaller version is feasible: branch only the semantic model definitions and Actions, and treat agent edits as staged proposals rather than branches.
- **AI FDE, Evolve and Palantir MCP's 89 builder tools** exist because Foundry is huge and hard to configure. [Inference] A product for mid-sized companies should need far fewer builder tools. Copy the approval tiers and proposal flow, not the tool list.
- **Session-token markings checks** assume Palantir's mandatory-marking model and scoped sessions. [Inference] They can be copied conceptually as "data scopes on the agent session", but the full CBAC and markings system is a large security subsystem.
- **Some Palantir limits are bugs to avoid, not features to copy.**
  - The Debugger not enforcing the production 5-minute limit.
  - Developer Console apps not updating when a chatbot gains new resources.
  - Open proposals visible only to the creator, for only 24 hours.
  - Results datasets missing pass/fail per metric.
  - [Fact for each limitation, in sections 8, 9, 13 and 14] Design so that test and production share one execution path.

## Open questions and unverified items

- **"k-LLM".** I did not find a Palantir page defining the term before my search quota ran out. [Unverified]
- **Agent Stack launch date and status.** No announcement page I read mentions Agent Builder, Agent Manager or the Agent SDK. The August 2026 SuperRepo item lists "Agent engine and Agent SDK" as in development. The docs mark Agent Builder as beta. [Unverified] I don't know whether the SDK is GA as of Nov 2026.
- **Token minting and identity for pro-code agents' scoped permissions** (lifetime, refresh, user vs service). Not documented on the page I read. [Unverified]
- **How the Claude Agent SDK template routes Claude calls** (presumably through the Anthropic-compatible proxy). [Unverified]
- **Automate execution identity.** The pages conflict: "effects run as the owner" vs "as the triggering user or the automation's service user". [Unresolved]
- **Execution history retention.** The pages say 7 days vs 30 days. [Unresolved]
- **Built-in evaluator count.** 20 in the docs vs 19 in the April 2026 AI FDE announcement. [Minor discrepancy]
- **Whether Palantir stores prompts beyond traces and logs**, and the retention of traces and logs beyond the 24-hour self-view and 30-day metrics. [Unverified]
- **Chunk size, overlap and default embedding model** for Document Intelligence and document context; the defaults and maximums for N and K in Chatbot Studio Ontology context. [Unverified]
- **Automate retries (counts and backoff), evaluation frequency and the permissions pages** were not readable, because my fetch quota ran out.
- **Palantir engineering blog series, AIPCon and DevCon talks, and "Build with AIP" examples.** I could not open the blog index or talk pages (quota). The only blog post I read is the OAG post by Chad Wahlquist, which is undated. Palantir's published reliability guidance in this file therefore comes from docs (the Logic FAQ, the OAG page, the prompt-engineering page, capacity management) rather than from talks. [Gap]
- **The compute-usage rate table** was read only partially (100k of 154k characters).

## Sources

Ranked by usefulness for design. All Palantir documentation pages were read on 21 Nov 2026; pages are undated unless an announcement date is given.

1. https://www.palantir.com/docs/foundry/aip/llm-capacity-management/ : the full rate-limit, attribution, interactive-reserve and reserved-capacity design, with numbers.
2. https://www.palantir.com/docs/foundry/agent-sdk/advanced-customization/ : the event-sourced agent runtime (context items, events, effects, HITL).
3. https://www.palantir.com/docs/foundry/logic/blocks/ : block and tool taxonomy, prompted vs native tool calls, and the permission caveat on row and column security.
4. https://www.palantir.com/docs/foundry/aip-evals/run-suite/ and https://www.palantir.com/docs/foundry/aip-evals/create-suite/ : eval limits, the evaluator catalog and pass criteria.
5. https://www.palantir.com/docs/foundry/chatbot-studio/application-state/ : deterministic bindings between UI and agent.
6. https://www.palantir.com/docs/foundry/chatbot-studio/retrieval-context/ and https://www.palantir.com/docs/foundry/chatbot-studio/tools/ : retrieval types, tool types and tool modes.
7. https://www.palantir.com/docs/foundry/ontology-mcp/authentication-and-authorization/ : the OAuth model for exposing the semantic layer to outside agents.
8. https://www.palantir.com/docs/foundry/palantir-mcp/available-tools/ and https://www.palantir.com/docs/foundry/palantir-mcp/security/ : the builder MCP tool catalog and its write and approval rules.
9. https://www.palantir.com/docs/foundry/logic/staged-writes/ and https://www.palantir.com/docs/foundry/logic/aip-logic-integration-automate/ : staged edits and the proposal review flow.
10. https://www.palantir.com/docs/foundry/ai-fde/security-and-governance/ : identity, approval tiers and audit for an internal agent.
11. https://www.palantir.com/docs/foundry/agents/agent-templates/ , https://www.palantir.com/docs/foundry/agents/publish-and-call/ , https://www.palantir.com/docs/foundry/agents/scoped-permissions/ : pro-code agent templates (Claude Agent SDK and others), async semantics, binding.
12. https://www.palantir.com/docs/foundry/aip/llm-provider-compatible-apis/ : proxy endpoints and session affinity for prompt caching.
13. https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/ : the markings gate for LLM calls.
14. https://www.palantir.com/docs/foundry/logic/faq/ : limits (5-minute timeout, per-block context) and Palantir's reliability advice.
15. https://www.palantir.com/docs/foundry/aip-evals/ontology-edits/ , https://www.palantir.com/docs/foundry/aip-evals/experiments/ , https://www.palantir.com/docs/foundry/aip-evals/intermediate-parameters/ : simulated edits, grid search, step grading.
16. https://www.palantir.com/docs/foundry/aip-observability/trace-view/ and https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/ : trace contents and log access rules.
17. https://www.palantir.com/docs/foundry/automate/limits/ , https://www.palantir.com/docs/foundry/automate/condition-objects/ , https://www.palantir.com/docs/foundry/automate/effects/ , https://www.palantir.com/docs/foundry/automate/security/ : trigger types, limits and identity.
18. https://www.palantir.com/docs/foundry/aip/llm-enrollment-rate-limits/ : concrete TPM and RPM tier numbers.
19. https://www.palantir.com/docs/foundry/aip/aip-compute-usage/ and https://www.palantir.com/docs/foundry/logic/compute-usage/ : token-to-compute conversion and Logic surcharges.
20. https://www.palantir.com/docs/foundry/aip-analyst/compute-usage/ : why agent conversations get expensive and how to cut costs.
21. https://www.palantir.com/docs/foundry/aip/bring-your-own-model/ and https://www.palantir.com/docs/foundry/aip/build-a-proxy-or-federation-layer/ : BYOM and redaction or federation proxies.
22. https://www.palantir.com/docs/foundry/ontology/ontology-augmented-generation/ and https://www.palantir.com/docs/foundry/ontology/using-palantir-provided-models-to-create-a-semantic-search-workflow : the retrieval playbook and KNN limits.
23. https://www.palantir.com/docs/foundry/chatbot-studio/foundry-apis/ , https://www.palantir.com/docs/foundry/chatbot-studio/chatbots-as-functions/ , https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/ , https://www.palantir.com/docs/foundry/chatbot-studio/citations/ , https://www.palantir.com/docs/foundry/chatbot-studio/commands-as-tools/ : chatbot deployment, API, logging and citations.
24. https://www.palantir.com/docs/foundry/aip/agent-stack/ , https://www.palantir.com/docs/foundry/agent-builder/core-concepts/ , https://www.palantir.com/docs/foundry/agent-manager/session-debugging/ , https://www.palantir.com/docs/foundry/agent-sdk/customize-agent/ : Agent Stack concepts and debugging.
25. https://palantir.com/docs/foundry/architecture-center/aip-architecture : Palantir's own 12-part architecture map.
26. https://www.palantir.com/docs/foundry/ai-fde/overview/ , https://www.palantir.com/docs/foundry/ai-fde/modes-and-capabilities/ , https://www.palantir.com/docs/foundry/ai-fde/aip-skills/ : the builder agent and skills.
27. https://www.palantir.com/docs/foundry/aip-analyst/capabilities/ and https://www.palantir.com/docs/foundry/aip-analyst/analysis-resources/ : analyst agent tools and the saved-recipe model.
28. https://www.palantir.com/docs/foundry/aip-evolve/overview/ : agents optimising agents against evals.
29. https://www.palantir.com/docs/foundry/machinery/core-concepts/ : process state model and event log object.
30. https://www.palantir.com/docs/foundry/boardroom/overview/ : multi-agent director pattern.
31. Announcements, dated: https://www.palantir.com/docs/foundry/announcements/2026-11 , https://www.palantir.com/docs/foundry/announcements/2026-10 , https://www.palantir.com/docs/foundry/announcements/2026-09 , https://www.palantir.com/docs/foundry/announcements/2026-08 , https://www.palantir.com/docs/foundry/announcements/2026-07 , https://www.palantir.com/docs/foundry/announcements/2026-06 , https://www.palantir.com/docs/foundry/announcements/2026-05 , https://www.palantir.com/docs/foundry/announcements/2026-04 , https://palantir.com/docs/foundry/announcements/2026-03/ : status and dates for every feature above.
32. https://www.palantir.com/docs/foundry/aip/aip-security/ : provider data-handling assurances (vendor claims).
33. https://www.palantir.com/docs/foundry/aip/supported-llms/ : model catalog, hosting paths and regions.
34. https://www.palantir.com/docs/foundry/document-intelligence/core-concepts/ : extraction strategies and VLM-judge evaluation.
35. https://www.palantir.com/docs/foundry/assist/overview/ and https://www.palantir.com/docs/foundry/assist/agents-in-aip-assist/ : Assist modes and publishing chatbots into Assist.
36. https://blog.palantir.com/building-with-palantir-aip-data-tools-for-rag-oag-b3b509c8b0f3 : the OAG framing (data plus logic plus action tools); undated, vendor voice.
37. https://www.palantir.com/docs/foundry/aip/best-practices-prompt-engineering/ : generic prompt advice, low value.