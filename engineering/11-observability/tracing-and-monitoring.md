# Tracing and monitoring

**Layer:** [11-observability](README.md) · **What it is:** Traces of every agent step, monitoring and debugging tools.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Other companies and products](#other-companies-and-products) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### 15. Observability and tracing

> Source: [general-references/03-palantir-aip.md § 15. Observability and tracing](../../general-references/03-palantir-aip.md#15-observability-and-tracing)

- **Components.** Metrics (success/failure counts and P95 for functions, actions and Logic), execution history, distributed tracing, service logs, log search, performance monitoring, Workshop dashboards (Observability Chart widget, GA 21 Jul 2026, 30-day metrics), and log export to a streaming dataset. All sit inside Workflow Lineage. [Fact] https://www.palantir.com/docs/foundry/aip-observability/overview/ , https://www.palantir.com/docs/foundry/announcements/2026-07
- **Execution history retention conflicts.** The general observability page says 7 days of execution history. The AIP observability page says 30 days. Metrics are 30 days in both. [Fact, conflicting] https://www.palantir.com/docs/foundry/observability/overview/ vs https://www.palantir.com/docs/foundry/aip-observability/overview/
- **Trace view.** Nested spans are coloured by type (function, action, automation, model, LLM call). Each span shows duration, function inputs and outputs, **LLM prompt, response and token usage**, and errors with stack traces. Identifiers are `foundryTraceId` and `x-b3-traceid` (B3 propagation, best-effort). [Fact] https://www.palantir.com/docs/foundry/aip-observability/trace-view/
- **"Source executor".** The first executable resource in a call chain (function, action, automation, Logic, agent, model deployment). Log search and permissions are keyed on it. [Fact] https://www.palantir.com/docs/foundry/observability/overview/
- **Log permissions.** You can always see your own executions for 24 hours, except on CBAC stacks. To see other people's executions you need Edit on the source executor, log access enabled on its project, and every marking applied to the logs. Configuring log access requires Information Security Officer or Enrollment Admin. [Fact] https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/
- **Other recent features.** Global log search across a workflow graph (GA 29 Sep 2026). Failure-rate colouring on Logic and function nodes (Aug 2026). An **Object timeline** that shows edits to an object by agents or humans with attribution, total tokens, runtime, *time spent waiting for humans* and "agentic coverage" (11 Aug 2026). An Autopilot workbench that visualises automations, Logic, actions and pro-code agents together (beta, Mar 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09 , https://www.palantir.com/docs/foundry/announcements/2026-08 , https://palantir.com/docs/foundry/announcements/2026-03/

### B7. Observability and reliability

> Source: [general-references/05-palantir-apps-infra.md § B7. Observability and reliability](../../general-references/05-palantir-apps-infra.md#b7-observability-and-reliability)

- **Platform observability** ([Fact](https://palantir.com/docs/foundry/observability/overview/)):
  - execution history (7 days);
  - metrics for functions, actions and AIP Logic (30 days: success/failure counts, P95 latency);
  - trace views across functions, actions and LLM calls (duration, inputs, outputs, errors per step);
  - log search keyed by "source executor", i.e. the first executable in a call chain: function, action, automation, AIP Logic, agent or model deployment;
  - log export to a stream.
- **Monitoring views** ([Fact](https://palantir.com/docs/foundry/monitoring-views/overview/)):
  - rules on resource metrics with Low/Medium/High thresholds;
  - static or dynamic scopes (project, folder, Workshop app, OSDK app);
  - resource types include agents, object types, actions, functions and automations;
  - AND-composite rules;
  - subscribers per severity, notified by email or in-platform, PagerDuty, Slack or a webhook;
  - snooze per alert or per rule;
  - status colours shown in Workflow Lineage.
- **Workshop:** an Observability Chart widget went GA 21 Jul 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-07)).
- **Reliability practices:** blue/green deploys, 48h node lifetimes, auto-suppression and rollback, canary channels, and SLO-gated promotion (B1, B2).

## Other companies and products

### 2.6 Debugging and observability

> Source: [general-references/18-decagon.md § 2.6 Debugging and observability](../../general-references/18-decagon.md#26-debugging-and-observability)

| Function | What it does | Status / date |
|---|---|---|
| Audit Logs | Shows whether the correct AOP ran and whether tool calls errored; used to catch, e.g., refund tool called but no refund issued. | GA. https://decagon.ai/modules/debugging ; https://decagon.ai/modules/watchtower-qa |
| Trace View | Each turn as a "miniature workflow": LLM calls, retrieval, condition checks, tool calls, safety checks; per AOP step shows inputs, reasoning, outputs and transition; shows what instructions the model received and how it responded; latency for every micro-step; AOP switches. | Blog 12 Dec 2025. https://decagon.ai/blog/decagon-trace-view |
| Agent Workbench | Chat assistant over audit logs, reasoning and tool errors; explains why an AOP node ran as it did and where latency started; suggests fixes to AOP configuration, conditions, knowledge gaps, hallucinations; sample prompts; shareable investigations. | 9 Mar 2026. https://decagon.ai/blog/agent-workbench |
| Reasoning timeline in console | Explanation of agent reasoning at any point with runtime and latency (e.g. "Called: Create carousel"). | GA. https://decagon.ai/product/aop |

## Design decisions already in the reference maps

### 9. Traces and observability

> Source: [general-references/34-map-agent-companies.md § 9. Traces and observability](../../general-references/34-map-agent-companies.md#9-traces-and-observability)

**Purpose.** Show exactly why the agent did what it did on any turn, so staff can debug and turn failures into tests. Example: a debtor complains about a wrong amount; the trace shows the balance tool returned a stale figure from a 30-minute-old sync.

**Design to implement.**
- **Trace per turn as a mini-workflow** of micro-steps: router decision (intent, procedure chosen, switches), each model call (model ID, prompt hash, instructions given, response), retrieval (queries, items returned, items dropped by permission re-check), condition and guard checks, tool calls (inputs, outputs, errors), supervisor and compliance decisions, and latency per micro-step. Per procedure step: inputs, reasoning, outputs, transition taken.
- **Audit log view:** did the correct procedure run, did tool calls error (catch "refund tool called but no refund issued" — for us, "payment-plan tool called but no plan created").
- **Debug assistant** over traces: explains why a node ran, where latency started, suggests fixes; investigations are shareable.
- **Actions from a trace:** "turn this conversation into a test" (§11) and "replay this turn on the new version".
- **Annotation:** reviewers mark daily samples: decision right? tone right? knowledge missing? what should it have done?
- **Storage:** append-only `trace_event` rows keyed by `conversation_id, turn_id, seq`; respect the same ACLs as the conversation [Inference]. Exclude tool arguments from telemetry exported outside the tenant (Harvey practice).

**Copies.**
- doc 18 §2.6, What to copy 6: Trace View micro-steps with inputs, reasoning, outputs, transition, latency, AOP switches; Audit Logs; Agent Workbench; reasoning timeline. https://decagon.ai/blog/decagon-trace-view ; https://decagon.ai/blog/agent-workbench ; https://decagon.ai/modules/debugging
- doc 12, Sierra traces and Experience Manager annotation. https://sierra.ai/blog/agent-development-life-cycle
- doc 19 §2B, §3: Agent Traces while building; per-step timing traces. https://sierra.ai/product/agent-studio ; https://sierra.ai/blog/voice-latency
- doc 21 §2D: debugging and re-run from a step (titles only). https://docs.glean.com/llms.txt

**Left out, and why.** Time-to-first-audio and voice VAD metrics (voice later).

**Open questions.** Retention period for traces (no vendor publishes one).

### 17. Evaluation and tracing tools

> Source: [general-references/33-map-context-code-integration.md § 17. Evaluation and tracing tools](../../general-references/33-map-context-code-integration.md#17-evaluation-and-tracing-tools)

**Purpose.** Prove agents give right answers and take right actions, catch regressions before release and in production, and keep a trace of every step. Receivables example: a test seeds a ledger with three overdue invoices and one promise to pay; the agent must send exactly two reminders and tell the collector why the third was skipped; run five times, it must pass all five.

**Design to implement.**
- Answer evaluation (OpenAI [Fact]): a question, golden query and golden result; compare both the generated query and the result data, tolerate syntax differences and immaterial extra columns; run as unit tests in CI and as production canaries. Here the "query" is the semantic request (section 11) and its compiled SQL.
- Action evaluation (tau2-bench [Fact]): seed the database; replay the reference actions to get a target state; reward = product of selected components, default `DB` (end-state match, so any path to an equivalent state passes) × `COMMUNICATE` (required strings appear in the agent's messages); optional `ENV_ASSERTION`, `NL_ASSERTION` (LLM-judged, experimental), `ACTION` (exact trajectory, rarely); report pass^k over k trials; type every tool READ, WRITE or GENERIC.
- Agent-routing checks (Salesforce Testing Center [Fact]): expected topic, expected actions, expected outcome (LLM-judged); synthetic cases generated from agent metadata.
- Sources of cases [Inference]: onboarding questions (section 9), verified queries, and failures detected by the trace loop (section 8). Customers can supply their own evaluation set (Google [Vendor claim]).
- CI: promptfoo (MIT, TypeScript) for prompt and tool regression [Fact]. Context as code with CI evaluations before production (Atlan [Vendor claim]).
- Tracing: emit OpenTelemetry (MCP 2026-07-28 carries `traceparent` in `_meta` [Fact]) and write spans to your own Postgres table in version 1; self-host Phoenix (server ELv2, JS clients Apache-2.0) for internal use only if a UI is needed [Fact/Inference]. Langfuse: core MIT but `ee/` directories commercial, and self-hosting needs Postgres, ClickHouse, Redis, MinIO/S3 and a gateway service [Fact] — too heavy for one person.
- Per-tool-call audit (identity, arguments, downstream calls, outcome) is the same record as the action audit (section 13) plus read calls (Merge [Vendor claim]); redaction by Conjure safety flags.
- Xero clause [Inference]: evaluation datasets containing Xero data must stay out of any model-training path; synthetic seeds are preferable.

**Copies.**
- Document 11, section 7 and "What to copy" 13. https://openai.com/index/inside-our-in-house-data-agent/ ; https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce
- Document 14, section 29 and "What to copy" 25. https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py ; https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/metrics/agent_metrics.py ; https://github.com/langfuse/langfuse/blob/HEAD/LICENSE ; https://github.com/langfuse/langfuse/blob/HEAD/docker-compose.yml
- Document 24, "What to copy" 11. https://www.merge.dev/agent-handler

**Left out, and why.** Langfuse self-hosting (four-service footprint). Exact-trajectory grading as default (penalises valid alternative paths). Salesforce's Einstein-request consumption model (vendor-specific).

**Open questions.** k for pass^k in CI versus nightly (not in the documents) [Inference: k = 3 in CI, k = 8 nightly]. Whether Phoenix's ELv2 permits the planned internal use (document 14 says needs legal review).

## Fact-check notes

_No time-sensitive claims in this component were re-checked in the 28 Nov 2026 pass; its sources are dated 21–27 Nov 2026. See the linked references for their own open questions._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No research literature material in the research yet.
