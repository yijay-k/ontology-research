# Tool design

**Layer:** [08-agent-platform](README.md) · **What it is:** Designing the tools an agent calls: granularity, identities, descriptions and errors.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Other companies and products](#other-companies-and-products) (1) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (1)

## Other companies and products

### 3.5 Integrations and tool calls

> Source: [general-references/18-decagon.md § 3.5 Integrations and tool calls](../../general-references/18-decagon.md#35-integrations-and-tool-calls)

Prebuilt connectors for helpdesk/CRM, knowledge, telephony; MCP; self-serve APIs; custom tools; custom endpoints. "No custom code required" is claimed for integrations, but the SOP guide admits custom databases and legacy systems need engineering. [Vendor claim] https://decagon.ai/product/integrations ; https://decagon.ai/resources/from-sops-to-agent-operating-procedures. In air-gapped deployments every connector to internal auth and data systems is custom and goes through internal approval. https://decagon.ai/blog/what-an-air-gapped-ai-deployment-actually-requires. Note Intercom's point that Decagon has no native helpdesk: it sits on Zendesk, Salesforce or Intercom for human queues. [Competitor claim] https://fin.ai/learn/decagon-ai-pricing

## Research literature

### 2. Shaping tools (the agent-computer interface)

> Source: [general-references/10-papers-agents-memory-eval.md § 2. Shaping tools (the agent-computer interface)](../../general-references/10-papers-agents-memory-eval.md#2-shaping-tools-the-agent-computer-interface)

**Plain English.** A tool is a function the model can call. Bad tool: `GET /api/v2/users?id=` returns a 4 MB JSON blob. Good tool: `find_customer(name_or_email)` returns the top 5 matches with readable names, IDs, and a hint if none matched.

**Detail** [Fact unless marked; https://www.anthropic.com/engineering/writing-tools-for-agents, 11 Sep 2025]:
- Do not mirror APIs one-to-one. Consolidate multi-step workflows into one tool, for example `schedule_event` instead of `list_users`, `list_events` and `create_event`.
- Namespace by service and resource, for example `crm_accounts_search`, to avoid confusion across many tools.
- Return semantic, human-readable fields rather than UUIDs where possible. A `response_format: concise|detailed` enum let a concise response use about one-third of the tokens (72 vs 206 in their example).
- Paginate, filter and truncate by default. Claude Code caps tool output at 25,000 tokens. Error messages should say how to fix the call.
- Write descriptions for a new hire and use unambiguous parameter names (`user_id`, not `user`).
- Process: prototype, write a realistic multi-step eval with verifiable outcomes, run it, then let Claude refactor the tools from transcripts. Check against a held-out set.
- From the context-engineering post: tools should be self-contained, robust to error, minimally overlapping, and token-efficient. If a human cannot say which tool to use, neither can the model [Fact].
- MCP-level shaping [Fact, https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md]. Name tools with 1 to 128 characters drawn from `[A-Za-z0-9_.-]`. Return input-validation and business-logic failures as tool execution errors (`isError: true`) so the model can self-correct, not as protocol errors. Provide `outputSchema` and `structuredContent`. Return a deterministic tool order to improve prompt-cache hits. Keep state in explicit opaque handles (for example `basket_id`) that are re-authorised on every call, have their lifetime stated in the description, and return a clear error on expiry. Treat tool annotations (read-only, destructive, and so on) as untrusted unless the server is trusted. A human in the loop SHOULD be able to deny invocations.
- Scaling to many tools [Vendor claim, https://www.anthropic.com/engineering/advanced-tool-use, 24 Nov 2025]. Use Tool Search with `defer_loading: true` once there are more than 10 tools or definitions exceed about 10k tokens (77k upfront tokens dropped to 8.7k; MCP-eval accuracy rose 49% to 74% for Opus 4 and 79.5% to 88.1% for Opus 4.5). Add `input_examples` for complex parameters (72% to 90%). Use programmatic tool calling for three or more dependent calls or large intermediate data.

**Failure modes.** Overlapping tools cause wrong selection. Thin wrappers bloat context. Relative identifiers break, as with SWE-bench's relative paths. Tool outputs that contain instructions are an injection vector (section 11).

**Takeaway for a company-model product** [Inference]. Generate tools from the company model, not from source-system APIs. For each business object, expose `search_<object>`, `get_<object>` (with `response_format`), and one tool per allowed action, such as `issue_refund` or `update_shipping_address`. Each action tool carries the preconditions and permission checks server-side. The model never sees raw tables unless it is asking an analytic question, which goes through the semantic layer (section 9).

## Design decisions already in the reference maps

### 15. Tool design and tool identities

> Source: [general-references/30-map-palantir-platform.md § 15. Tool design and tool identities](../../general-references/30-map-palantir-platform.md#15-tool-design-and-tool-identities)

**Purpose.** Agents act only through tools generated from the registry. The platform runs each tool under an explicit identity; the model only asks. *Receivables example:* the agent sees tools `search-invoice` (object query), `record-payment-promise` (action, confirm mode) and `compute-dso` (query function), each with a description written for agents.

**Design to implement.**
- **Generated tool kinds** [Fact 02, 03]:
  1. **one tool per action type**, whose parameters become the tool schema and whose `agentDescription` says when to use it and how to get the inputs;
  2. **one tool per query function**;
  3. **an object-query tool** over the allowed object types, with a limited property list, supporting filter, aggregate, inspect and link traversal, and with object-return caps;
  4. **request clarification** (pause and ask the user);
  5. **update application variable**.
- **Tool names** follow Palantir's Ontology MCP pattern, for example `search-osdk-todo-task` and `create-osdk-todo-task` [Fact 02]. Use `search-<type>` and `<action-api-name>` [Inference].
- **Execution rule** [Fact 03]: "the LLM never calls tools directly". The platform validates the arguments against the schema, runs the tool under the session identity (section 14), and returns native JSON. Tool responses must be native JSON, not JSON-encoded strings [Fact 03].
- **Errors** use one envelope: `{errorCode, errorName "Namespace:Name", errorInstanceId, parameters}`, from Palantir's Conjure [Fact 05]. A tool error is shown to the model on the next turn [Fact 03]. Submission-criteria failures return their configured messages [Fact 02].
- **Action tools have a mode** of `auto` or `confirm` (the user confirms first) [Fact 03, 04]. The default is confirm for anything customer-facing or financial [04].
- **Deterministic bindings** [Fact 03]: tool parameters can be bound to app variables instead of LLM-generated values, frozen at the start of the reasoning loop. Tool outputs can be mapped straight into variables, which Palantir recommends over LLM-driven updates. *Example:* in the collector's inbox, `invoice` is bound to the selected row, and the model fills only `promisedDate`.
- **Native vs prompted tool calling** [Fact 03]: use native tool calling when the model supports it, since it allows parallel calls and is cheaper. Fall back to prompted mode, where tool instructions are injected into the prompt.
- **Tool budget** [Fact 03]: tool *definitions* are sent on every request, so let builders switch off unused categories. Offer on-demand discovery with a `search_tools` tool, which needs the client to support `tools/list_changed` [Fact 03].
- **Pinning** [Fact 03]: function tools use the latest version by default, or a pinned version. Pin in production configs [Inference].
- **Duplicate prevention**: search before create. Palantir suggests a Claude "skill" for this [Fact 03]. Make the generated create-tools idempotent on a caller-supplied key [Inference].
- **Feedback object** [Fact 03]: persist each AI recommendation, its reasoning and the human verdict as an object (`Suggestion`), and give the agent a query tool over past ones (dynamic few-shot).
- **Tool identity record** [Inference]: every tool call writes `tool_call(id, session_id, tool_name, tool_version, args jsonb, executing_principal_id, on_behalf_of, app_id, result_status, duration_ms, cost_units, trace_id)`.

**Copies.**
- Document 02, §16 and document 03, §12: one tool per action and query function, the agent tool description, tool names. https://www.palantir.com/docs/foundry/ontology-mcp/sample-architecture/ , https://www.palantir.com/docs/foundry/ontology-mcp/mcp-tools-and-agent-configuration/
- Document 03, §§8–9: tool taxonomy, prompted vs native, confirmation, deterministic bindings. https://www.palantir.com/docs/foundry/logic/blocks/ , https://www.palantir.com/docs/foundry/chatbot-studio/tools/ , https://www.palantir.com/docs/foundry/chatbot-studio/application-state/
- Document 03, §5: tool definitions as a cost driver. https://www.palantir.com/docs/foundry/aip-analyst/compute-usage/
- Document 05, B3: Conjure error envelope. https://github.com/palantir/conjure
- Document 03, §8: feedback object pattern. https://www.palantir.com/docs/foundry/logic/faq/

**Left out, and why.**
- Command tools that drive a paired UI: no Palantir apps to drive.
- Calculator tool: the model can use functions.
- No-code custom tool builder: version 2.

**Open questions.**
- Should version 1 expose a free-form object-query tool at all, or only named query functions? Named functions are safer, but the agent may get stuck without the generic tool [Inference].

---

### 11. Tool design rules

> Source: [general-references/32-map-research-and-cost.md § 11. Tool design rules](../../general-references/32-map-research-and-cost.md#11-tool-design-rules)

**Purpose.** Tools are the agent's interface to the company model; they move results more than prompts do. Example: `ar.customer.search("acme")` returns 5 matches, each with name, ID, balance and overdue days. It does not return a 4 MB JSON dump.

**Design to implement (generated from the company model, not from source-system APIs).**
- Per object type: `search_<object>(query, filters, limit ≤ 20, response_format: concise|detailed)` and `get_<object>(id, response_format)`.
- Per allowed action, one consolidated tool, for example `send_reminder`, `log_promise_to_pay`, `propose_write_off`, `allocate_payment`. Each has:
  - typed arguments
  - a description written for a new hire: purpose, preconditions, side effects, irreversibility, approval needs
  - `input_examples`
  - an `idempotency_key` (section 14)
- Per metric family: `query_metric` (section 1).
- Naming:
  - namespaced, 1–128 characters from `[A-Za-z0-9_.-]`, for example `ar.invoice.search`
  - unambiguous parameters (`customer_id`, not `customer`)
  - readable names returned alongside IDs
- Outputs:
  - paginate and truncate by default; cap at about 25k tokens
  - provide `outputSchema` and `structuredContent`
  - return validation and business-rule failures as `isError: true` results that say how to fix the call
- Deterministic tool order, which also helps the prompt cache (section 20).
- Multi-step state in opaque, expiring, re-authorised handles (`draft_id`), with the lifetime stated in the description.
- Once there are more than about 10 tools or more than about 10k tokens of definitions:
  - mark rarely used tools `defer_loading: true` behind tool search
  - keep the 3–5 most-used tools loaded
  - put the cache breakpoint on a non-deferred tool
- Process: prototype, write a realistic multi-step eval, run it, let a model refactor the tools from transcripts, and check against a held-out set.

**Evidence.**
- Requiring absolute paths removed a class of SWE-bench errors (Anthropic, "Building effective agents").
- A tool description rewritten by a tool-testing agent cut task time by 40% (multi-agent post).
- `response_format: concise` used 72 tokens against 206 (writing-tools post).
- Tool Search raised MCP-eval accuracy 49% → 74% (Opus 4) and 79.5% → 88.1% (Opus 4.5), with upfront tokens 77k → 8.7k. `input_examples` raised complex-parameter accuracy 72% → 90% [Vendor claim] (advanced-tool-use post).
- Merely providing tools adds 286–406 system tokens per request (document 13, section 1).
- All from document 10, section 2, and document 13, sections 1 and 3.

**Copies.** Document 10, section 2 and "What to copy" items 3 and 4; document 13, "What to copy" item 6. https://www.anthropic.com/engineering/writing-tools-for-agents ; https://www.anthropic.com/engineering/advanced-tool-use ; https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md ; https://platform.claude.com/docs/en/agents-and-tools/tool-search-tool

**Left out.**
- One-to-one API mirroring.
- Raw table access for agents outside the analytic path.
- Trusting tool annotations from untrusted servers.

**Open questions.** Tool search and `input_examples` are Anthropic features. Equivalents for Qwen are not covered by the documents.

## Earlier engineering notes (Phase 2)

### Tool classes

> Source: former `08-agent-platform/agent-runtime-and-adlc.md` (moved here in the Nov 2026 restructure)

`READ` (retrieve/inspect), `QUERY` (structured semantic read), `PROPOSE` (produce a draft edit/action plan), `WRITE` (execute a named action), `EXTERNAL` (invoke an external connector), `APPROVAL` (ask a human). Tools should declare read-only, destructive, idempotent and approval characteristics. No raw database or unrestricted generic mutation tool should be exposed to the model.

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No palantir material in the research yet.
- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
