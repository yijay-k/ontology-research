# Evaluation and simulation

**Layer:** [08-agent-platform](README.md) · **What it is:** Golden sets, state-based checks, simulated users, replay of past runs, experiments and always-on monitoring.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Lingyang, AgentOne and Alibaba](#lingyang-agentone-and-alibaba) (1) · [Open-source implementations](#open-source-implementations) (1) · [Other companies and products](#other-companies-and-products) (3) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (7) · [Earlier engineering notes (Phase 2)](#earlier-engineering-notes-phase-2) (6)

## Palantir

### 13. AIP Evals

> Source: [general-references/03-palantir-aip.md § 13. AIP Evals](../../general-references/03-palantir-aip.md#13-aip-evals)

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

## Lingyang, AgentOne and Alibaba

### 10. Testing and improvement

> Source: [general-references/28-winnexo.md § 10. Testing and improvement](../../general-references/28-winnexo.md#10-testing-and-improvement)

- Evaluation Center: business question cases, batch evaluation, AI-generated cases and suggested semantic optimisations (2 Nov 2026); a feedback dashboard combining web and DingTalk feedback (19 Nov 2026) ([Fact](https://robject.lydaas.com/help/en/changelog/)).
- Conversation Scanning: scheduled scans of conversations with custom analysis, feeding ontology optimisation suggestions (12 Nov 2026) ([Fact](https://robject.lydaas.com/help/en/changelog/)).
- AI Troubleshooting is available to end users in chat (3 Sep 2026) ([Fact](https://robject.lydaas.com/help/en/changelog/)).

## Open-source implementations

### 29. Evaluation and observability: tau-bench, tau2-bench, Langfuse, promptfoo, Phoenix

> Source: [open-source-references/eval-and-observability-tools.md](../../open-source-references/eval-and-observability-tools.md) (code study)

- **tau2-bench**: MIT, Python, version 2.0.0, last commit 2026-11-10. Domains: airline, retail, telecom, banking_knowledge, intake and mock. Each domain has `policy.md`, `db.json`, `tasks.json` and `tools.py`, with tools decorated `@is_tool(ToolType.READ|WRITE|GENERIC)`. The task reward is the product of the components in `reward_basis`:
  - `DB`: the end state matches the result of replaying the reference actions, so any path that produces an equivalent state passes. This is the default together with COMMUNICATE.
  - `ENV_ASSERTION`.
  - `NL_ASSERTION`: LLM-judged, experimental.
  - `ACTION`: an exact trajectory, used only in some banking tasks.
  - `COMMUNICATE`: required strings appear in the agent's messages.

  The `pass_hat_k` metric is in `metrics/agent_metrics.py`. [Fact] ([data_model/tasks.py](https://github.com/sierra-research/tau2-bench/blob/HEAD/src/tau2/data_model/tasks.py)). The original tau-bench is MIT (last commit 2026-03-18). [Fact]
- **Langfuse**: the core is MIT; `ee/`, `web/src/ee/` and two other `ee` directories fall under a commercial licence (audit-log viewer, admin API, multi-tenant SSO, UI customisation, verified domains, and more). Copyright belongs to "ClickHouse, Inc.". Version 4.83.0. Self-hosting needs Postgres, ClickHouse, Redis and MinIO/S3 (`docker-compose.yml`), plus a new `langfuse-ai-gateway` service. [Fact] ([LICENSE](https://github.com/langfuse/langfuse/blob/HEAD/LICENSE), [docker-compose.yml](https://github.com/langfuse/langfuse/blob/HEAD/docker-compose.yml))
- **Phoenix**: the server is ELv2 (version 22.0.0) on SQLite or Postgres. Its JS client packages are Apache-2.0. [Fact]
- **promptfoo**: MIT, TypeScript, version 0.126.0. [Fact]
- Verdict:
  - Copy tau2's reward design for your own action evaluations: seed the database, replay the reference actions to get a target state, compare end states, run k trials.
  - Use promptfoo (MIT) in CI for prompt and tool regression.
  - For traces, either emit OpenTelemetry and self-host Phoenix (ELv2 is fine for internal use, [Inference]), or write traces to your own Postgres table. Langfuse self-hosting is a four-service footprint.

  [Inference]

## Other companies and products

### Sierra simulations, experiments, traces

> Source: [general-references/12-agent-companies.md § Sierra simulations, experiments, traces](../../general-references/12-agent-companies.md#sierra-simulations-experiments-traces)

- Simulated users vary by language, tech comfort, tone and task. The initial state is set to match production (logged in or not, email on file). The same scenario is run several times, and a separate judge agent grades goal completion, SOP adherence, brand compliance and answer quality. Tests are auto-generated at agent creation from SOPs, knowledge bases, coaching transcripts and flows, and they persist for regression. [Vendor claim] https://sierra.ai/blog/simulations-the-secret-behind-every-great-agent
- Traces: the SDK records the reasoning trace behind each decision, so QA can see why a misbehaviour happened. The Experience Manager lets CX teams annotate daily samples: was the decision right, was the tone right, was knowledge missing, what should the agent have done. [Vendor claim] https://sierra.ai/blog/agent-development-life-cycle
- Experiments: releases can be A/B tested against business goals. Ghostwriter now proposes experiments and reports significance. [Vendor claim] same URL; https://sierra.ai/blog/ghostwriter-ai-tool-to-teammate
- When Sierra upgrades Agent OS, it runs the regression suite for every live customer. [Vendor claim] https://sierra.ai/blog/agent-development-life-cycle

### tau-bench and tau2-bench (Sierra Research)

> Source: [general-references/12-agent-companies.md § tau-bench and tau2-bench (Sierra Research)](../../general-references/12-agent-companies.md#tau-bench-and-tau2-bench-sierra-research)

Plain English. A test where an AI pretends to be a customer ("You are Yusuf Rossi in 19122, exchange the keyboard for a clicky one…"). The agent under test has the shop's tools and a policy document. It passes only if the shop database ends in exactly the right state.

Technical detail, from the code:
- Paper: Yao, Shinn, Razavi and Narasimhan, 17 Jun 2024. Function-calling agents like gpt-4o succeeded on under 50% of tasks, and pass^8 was below 25% in retail. [Fact] https://arxiv.org/abs/2406.12045
- Environment: data loader (the JSON database), a tool list, the policy "wiki" in markdown, rules, and a user simulator. The retail policy requires: authenticate by email or by name plus zip even when the user gives an ID; one user per conversation; list action details and get an explicit "yes" before any write; no invented information; one tool call at a time; transfer to a human only when out of scope. [Fact] /home/claude/research/_code/tau-bench/tau_bench/envs/retail/wiki.md ; rules.py
- Reward: hash the final database. Reset, replay the task's reference actions, and hash again. Reward is 1 only if the hashes match and every required output string appears in the agent's replies. [Fact] /home/claude/research/_code/tau-bench/tau_bench/envs/base.py
- In tau2, reward is the product of the components in `reward_basis` (default DB × COMMUNICATE). The reference actions are only one valid path: any trajectory reaching an equivalent end state passes. ACTION-matching is used only in a few banking_knowledge tasks. Other components are env_assertions and nl_assertions judged by an LLM. [Fact] /home/claude/research/_code/tau2-bench/docs/evaluation.md
- pass^k = comb(successes, k) / comb(trials, k). [Fact] /home/claude/research/_code/tau2-bench/src/tau2/metrics/agent_metrics.py
- "Dual control": in the telecom domain the simulated user has its own tools (check status bar, toggle airplane mode, run a speed test), so the agent must guide the user to act. [Fact] /home/claude/research/_code/tau2-bench/src/tau2/domains/telecom/user_tools.py ; paper https://arxiv.org/pdf/2506.07982
- tau-bench 2.0 adds six languages, full-duplex voice, an `intake` domain for exact entity capture (200+ tasks), banking_knowledge (retrieval) and post-hoc speech judges. Benchmarks are frozen at 50 tasks per domain per language. The default semantic judge is gpt-5.5. [Fact] /home/claude/research/_code/tau2-bench/README.md

### 3.6 Testing and the Agent Development Lifecycle

> Source: [general-references/21-glean.md § 3.6 Testing and the Agent Development Lifecycle](../../general-references/21-glean.md#36-testing-and-the-agent-development-lifecycle)

- Six stages: plan and design; evaluate quality; build safe and maintainable agents; test and launch; manage drafts, versions and rollbacks; govern, monitor and maintain. Review depth scales from personal to team to enterprise. More review is required if an agent is shared broadly, touches restricted data, uses write tools or is high-impact ([Fact](https://docs.glean.com/agents/overview/agent-development-lifecycle)).
- Evaluation: a golden test set of prompts with ideal outcomes, in four buckets (happy path, edge, adversarial, permission). Set a pass rate (example: correct citations in 95% of tests) and define critical failures. A graceful "I don't have access to that" beats a hallucination. Permission tests under standard, restricted and admin profiles are mandatory beyond personal scope. When a test fails, fix root causes (scope, connector, missing validation step) rather than tweaking the prompt ([Fact](https://docs.glean.com/agents/agent-development-lifecycle/evaluate-agent-quality)).
- Git-backed ADLC with branches and merges exists (titles only).

## Research literature

### 8. Evaluation

> Source: [general-references/10-papers-agents-memory-eval.md § 8. Evaluation](../../general-references/10-papers-agents-memory-eval.md#8-evaluation)

**Plain English.** Build a test set of realistic conversations with a known correct end state. For example: "customer wants to exchange item X". The correct outcome is order W123 exchanged to item Y, paid by card Z, after the agent asked for confirmation. Run it ten times and count how often everything is right.

**tau-bench** (Yao, Shinn, Razavi, Narasimhan; arXiv 2406.12045, Jun 2024). An LLM-simulated user talks to an agent that has domain API tools and a policy document. Grading compares the final database state with the annotated goal state. pass^k measures reliability over k trials. GPT-4o was under 50%, and pass^8 retail under 25% [Fact, https://arxiv.org/abs/2406.12045].

**tau2-bench** (Barres, Dong, Ray, Si, Narasimhan; arXiv 2506.07982, Jun 2025). Adds a telecom dual-control domain where the user also acts with tools, modelled as a Dec-POMDP. It uses a compositional task generator and a user simulator constrained by its own tools and observable state. Performance drops significantly from no-user to dual-control [Fact, https://arxiv.org/abs/2506.07982]. **Implementation detail from the repo** [Fact, `/home/claude/research/_code/tau2-bench`]:
- Tasks are JSON: `user_scenario.instructions` (reason for call, known info, unknown info, persona) and `evaluation_criteria` (`actions`, `communicate_info`, `nl_assertions`, `reward_basis`).
- Reward is the product of the listed components. `DB` replays the gold actions on a fresh environment and compares end states, so any path to an equivalent end state passes. `COMMUNICATE` checks required info reaches the user (a semantic LLM judge in 2.0, earlier a substring match). `NL_ASSERTION` uses an LLM judge. `ENV_ASSERTION` runs assertions on the environment. `ACTION` is strict trajectory matching, used only in a few `banking_knowledge` tasks.
- pass^k = C(successes, k) / C(trials, k).
- The retail policy (excerpt): authenticate via email or name plus zip even if an ID is given; one user per conversation; list the action details and get an explicit "yes" before any write; one tool call at a time; transfer to a human only when out of scope.
- v2.0 adds 6 languages, voice, an `intake` entity-capture domain (200+ tasks), `banking_knowledge`, task-fix records (`task_issues/*.json`) and judge validation status per language and measure (several judges are explicitly marked "unvalidated").
- Retail has 114 tasks in the shipped file. 2.0 English uses 50 frozen tasks per domain and is not comparable with 1.x scores. Related papers: task fixes (arXiv 2512.07850), τ-Knowledge (2603.04370), τ-Voice (2603.13686) [Fact, README; papers not opened].

**Enterprise and work benchmarks.**
- CRMArena-Pro (Huang et al., Salesforce; arXiv 2505.18878, May 2025): 19 expert-validated tasks across sales, service and CPQ, B2B and B2C, with persona-driven multi-turn conversations and confidentiality tests. Results: about 58% single-turn, about 35% multi-turn, workflow execution above 83%, and near-zero confidentiality awareness. Prompting for confidentiality hurts task success [Fact, https://arxiv.org/abs/2505.18878].
- TheAgentCompany (Xu et al., CMU; arXiv 2412.14161, v3 Sep 2025): a simulated small software company with internal sites and simulated coworkers. The best agent completed 30% of tasks autonomously [Fact, https://arxiv.org/abs/2412.14161]. The checkpoint-based partial credit and the task count of 175 are from the paper body [Unverified].
- WorkArena (Drouin et al., ServiceNow; arXiv 2403.07718): 33 ServiceNow tasks, with BrowserGym as the harness. It found a large open vs closed model gap [Fact, https://arxiv.org/abs/2403.07718].
- WebArena (Zhou et al.; arXiv 2307.13854): four site domains. The best GPT-4 agent scored 14.41% against 78.24% for humans at publication [Fact, https://arxiv.org/abs/2307.13854].
- AgentBench (arXiv 2308.03688) was not opened this session [Unverified].
- SWE-bench lessons that transfer [Fact, https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents]. SWE-bench Verified rose from about 40% to over 80% in a year, so benchmarks saturate. Grading bugs can dominate: Opus 4.5 scored 42% on CORE-Bench until grading was fixed, then 95%. OpenAI's human-verified 500-task subset (removing underspecified issues and unfair tests) shows tasks must be validated before trusting a score [Unverified this session; post not opened].

**LLM-as-judge reliability.**
- Zheng et al. (NeurIPS 2023 D&B, arXiv 2306.05685): strong judges (GPT-4) agree with humans over 80% of the time, about the level of human-human agreement. Documented biases are position, verbosity and self-enhancement, and reasoning is limited [Fact, https://arxiv.org/abs/2306.05685].
- Husain and Shankar (FAQ, Sep 2026): use binary pass/fail per failure mode. Build one judge per failure mode with 100 to 200 labelled examples split train/dev/test. Report TPR and TNR against human labels and use them to correct estimated failure rates. Hand-validate every ground-truth label. Use code checks wherever possible. Generic metrics (helpfulness, ROUGE) are not quality measures. Do error analysis first: read at least 30 traces yourself and keep reading to saturation, at least 100. For agents, check end-to-end success first, then step-level diagnostics with a "transition failure matrix" (last good state against first failure). Guardrails are fast deterministic inline checks. Evaluators are asynchronous, and slow LLM judges almost never belong inline. The authors report spending 60% to 80% of development time on error analysis and evals [Fact, https://hamel.dev/blog/posts/evals-faq/].
- Anthropic's research system used a single-prompt judge (0.0 to 1.0 score plus pass/fail) with a rubric for factual accuracy, citation accuracy, completeness, source quality and tool efficiency, plus human testers who caught source-quality issues the judge missed [Fact, multi-agent post].

**Eval-driven development guidance** [Fact, https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents, 9 Jan 2026]. The vocabulary is task, trial, grader, transcript, outcome, eval harness and agent harness. Capability evals start low. Regression evals sit near 100%, and capability evals graduate into them. Use pass@k when one success suffices and pass^k for customer-facing agents (75% per trial gives about 42% for three in a row). Start with 20 to 50 tasks from real failures. A 0% score across many trials usually means a broken task. Balance "should act" with "should not act" cases. Isolate trials in clean environments. Grade outcomes, allow partial credit, and make graders resistant to gaming. Read transcripts. Conversational agents combine state checks, transcript constraints and LLM rubrics, with a second LLM simulating the user. Pair evals with production monitoring, A/B tests and human review.

**Google trajectory metrics** (exact match, in-order, any-order, precision, recall, single-tool-use in Vertex AI evaluation): the docs page did not render for me [Unverified].

**Simulation-based testing in industry.** tau-bench comes from Sierra. Decagon gates AOP builds on simulations passing (section 5) [Vendor claim].

**Observability (OpenTelemetry GenAI)** [Fact, OTel GenAI agent-spans doc; Dash0 explainer, 14 Sep 2026]:
- Spans: `create_agent {name}` (CLIENT), `invoke_agent {name}` (CLIENT for remote, INTERNAL for in-process), `invoke_workflow {name}`, `plan {name}` (only when reliably distinguishable), `execute_tool`, and inference spans `{operation} {model}`.
- Required attributes: `gen_ai.operation.name`, plus `gen_ai.provider.name` on client spans. Conditionally required: agent id, name and version; `gen_ai.conversation.id` only when a real conversation ID exists (do not synthesise one); `error.type`.
- Metrics: `gen_ai.client.token.usage` and `gen_ai.client.operation.duration`.
- Content (`gen_ai.input.messages`, `gen_ai.output.messages`, `gen_ai.system_instructions`, `gen_ai.tool.definitions`) is opt-in and sensitive.
- Status: all Development. The conventions moved to `open-telemetry/semantic-conventions-genai` in v1.42.0 (12 Jun 2026) with no tagged release, so pin your instrumentation version.

## Design decisions already in the reference maps

### 17. Evaluation suites

> Source: [general-references/30-map-palantir-platform.md § 17. Evaluation suites](../../general-references/30-map-palantir-platform.md#17-evaluation-suites)

**Purpose.** Unit tests for AI behaviour that tolerate randomness, run against a sandbox, and gate every prompt or model change. *Receivables example:* 50 historic disputes with known categories, each run 3 times against two prompt versions. Plus 30 dunning drafts graded by an LLM judge on "mentions the invoice number and due amount; does not threaten legal action before stage 3".

**Design to implement.**
- **Suite = test cases × targets × evaluators** [Fact 03]. Cases are entered manually or generated from an object set, with columns from properties, linked objects or static values. "Add as test case" works from production run history.
- **Evaluators** [Fact 03]: exact match (boolean, string, arrays, numeric with deviation, temporal, object), regex, Levenshtein, string length, keyword checker, object-set contains and size range, numeric, float and temporal ranges, an **LLM-as-judge** (true or false on a written condition, with its reasoning), and ROUGE. Custom evaluators are published functions returning a struct of metrics.
- **Pass criteria** [Fact 03]: boolean metrics pass on True or False. Numeric metrics have a goal of Increase (minimum threshold) or Decrease (maximum threshold), and thresholds are inclusive. A case fails if any metric fails in any iteration. Metrics that do not apply show "No value" and are excluded from aggregates.
- **Run limits** [Fact 03]: 1 to 100 iterations per case (**default 3** for LLM targets), up to 15,000 executions per run, up to 10 cases in parallel. Metadata (branch, version, model) is captured automatically. Runs can be compared side by side with a diff.
- **Experiments** [Fact 03]: grid search over model and prompt variants, up to 25 runs, with up to 4 compared at once.
- **Intermediate parameters** [Fact 03]: builders flag any step's output for grading.
- **Sandbox** [Fact 03]: each case runs in its own simulation (section 10 overlay), so edits never touch real data. Evaluators find created objects by an identifying property, receive the simulated versions of edited objects, and check that deleted objects return a count of zero.
- **Results table** [Inference]: `eval_result(run_id, case_id, iteration, metric, value, passed, judge_reasoning, output jsonb, error)`. This stores **per-metric pass/fail and judge reasoning**, both of which Palantir's results dataset lacks [Fact 03 for the gap].
- **One execution path for tests and production.** Palantir's Debugger does not enforce the 5-minute production timeout, which it lists as a failure mode [Fact 03]. So evals run the real runtime with production limits [Inference].
- **Validation drill** [Fact 02]: business questions sourced from the customer's operating rhythm, structured as situation → contributing factors → impact. People who did not build the model answer them first in general tools only, recording correctness, time, hesitation, search terms, dead ends and manual exports. Then an agent answers them without path hints, and the difference is read as a diagnosis (for example, people succeed but the agent fails = business knowledge not encoded). The questions are kept as a standing suite. Run this at each customer's onboarding.
- **Gate** [Inference]: a proposal that changes a prompt, model mapping, action or rule that an agent uses must attach a passing suite run (section 20).

**Copies.**
- Document 03, §13 "AIP Evals": concepts, evaluators, pass criteria, run configuration, experiments, intermediate parameters, simulated edits, results dataset gaps. https://www.palantir.com/docs/foundry/aip-evals/create-suite/ , https://www.palantir.com/docs/foundry/aip-evals/run-suite/ , https://www.palantir.com/docs/foundry/aip-evals/experiments/ , https://www.palantir.com/docs/foundry/aip-evals/intermediate-parameters/ , https://www.palantir.com/docs/foundry/aip-evals/ontology-edits/ , https://www.palantir.com/docs/foundry/aip-evals/results-dataset/
- Document 02, §18: validation drills. https://palantir.com/docs/foundry/ontology/ontology-design-validation/
- Document 03, §8: keep 5–10 input/output examples as unit tests and rerun them after each prompt change. https://www.palantir.com/docs/foundry/logic/faq/

**Left out, and why.**
- AI-generated suites and AI analysis of failures: version 2.
- Pipeline LLM eval nodes: no pipeline builder.

**Open questions.**
- Who writes the first suite for a new customer: the founder, the customer, or a generator? Palantir offers "Generate with AI FDE" [Fact 03].

---

### 19. Evaluation: golden sets, state-based checks, pass^k, simulated users, judge reliability

> Source: [general-references/32-map-research-and-cost.md § 19. Evaluation: golden sets, state-based checks, pass^k, simulated users, judge reliability](../../general-references/32-map-research-and-cost.md#19-evaluation-golden-sets-state-based-checks-passk-simulated-users-judge-reliability)

**Purpose.** Know before a release whether the agent gets receivables tasks right repeatedly. Example task: "Customer emails a promise to pay invoice INV-1043 on 30 Nov." The correct end state: a promise-to-pay record created on INV-1043 with date 2026-11-30, the dunning step paused, and a confirmation sent to the contact on file. No message goes to any other address.

**Design to implement.**
- *Two golden sets*:
  - (i) numeric competency questions with expected results, scored by execution accuracy (section 4)
  - (ii) agent tasks in tau-bench shape
- *Agent task file*:
  - `user_scenario` (reason, known info, unknown info, persona)
  - initial company-model state
  - `evaluation_criteria`: `actions`, `communicate_info`, `nl_assertions`, `reward_basis`
  - "should not act" cases: wrong user, policy-forbidden request, confidential data request, injected email
- *Reward = product of gated components*:
  - DB end-state match, by replaying gold actions on a fresh copy and comparing, so any path to an equivalent end state passes
  - communicate-info judge
  - NL-assertion judges
  - environment assertions
  - permission or guard violation sets the reward to 0
  - strict action match only where order matters
- *Simulated user*: a model constrained to its scenario. Include dual-control cases in which the user must also act.
- *Trials*: 5–10 per task, each in isolated state. Report pass^1 and pass^k = C(successes, k) / C(trials, k).
- *Size and life cycle*: start with 20–50 tasks from real failures and grow from production traces. Capability tasks graduate to a regression suite held near 100%. A 0% score across many trials usually means a broken task.
- *Judges*: one binary judge per failure mode, validated on 100–200 human labels split train/dev/test, with TPR and TNR reported. Pairwise judges run in both orders. Inline guardrails stay deterministic; judges run asynchronously.
- *Error analysis*: read at least 30 traces, continuing to saturation (about 100). Keep a failure taxonomy and a transition-failure matrix. Review weekly.
- *Observability*: OTel GenAI spans (`invoke_agent`, `execute_tool`, inference spans) with a real `gen_ai.conversation.id`, token and duration metrics, and content capture off by default. Pin the semconv version.

**Evidence.**
- tau-bench: GPT-4o under 50%, and pass^8 on retail under 25% (arXiv 2406.12045).
- CRMArena-Pro: about 58% single-turn, about 35% multi-turn, near-zero confidentiality awareness (arXiv 2505.18878).
- 75% per trial gives about 42% for three in a row (Anthropic "Demystifying evals"). Recomputed: 0.75³ = 0.42.
- Grading bugs matter: Opus 4.5 scored 42% on CORE-Bench until grading was fixed, then 95% (Anthropic).
- Judges agree with humans over 80% of the time, but show position, verbosity and self-enhancement bias (Zheng et al., arXiv 2306.05685).
- GraphRAG-Local won 97% of comparisons shown first and 12% shown second (document 09, Key finding 14).
- tau2-bench reward composition and pass^k code (`_code/tau2-bench`, tasks.py and agent_metrics.py; read, not executed). All from document 10, section 8, and document 09.

**Copies.** Document 10, section 8 and "What to copy" item 11; document 09, "What to copy" items 10 and 21. https://arxiv.org/abs/2406.12045 ; https://arxiv.org/abs/2506.07982 ; https://github.com/sierra-research/tau2-bench ; https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents ; https://hamel.dev/blog/posts/evals-faq/ ; https://raw.githubusercontent.com/open-telemetry/semantic-conventions-genai/2e994c6d59a93bb4fc1752c5378eedb9b8e14d6b/docs/gen-ai/gen-ai-agent-spans.md

**Left out.**
- Generic metrics (helpfulness, ROUGE).
- Slow judges inline.
- Unvalidated judges: tau2-bench marks several as "unvalidated".

**Open questions.**
- The OTel GenAI conventions are all at Development stability, with no tagged release in the new repository.
- No paper measures write-action accuracy through an ontology (document 09). The founder's own suite is the only evidence.

### 10. Always-on quality monitoring

> Source: [general-references/34-map-agent-companies.md § 10. Always-on quality monitoring](../../general-references/34-map-agent-companies.md#10-always-on-quality-monitoring)

**Purpose.** Check 100% of conversations and touches after the fact against plain-language rules, so problems are found without anyone reading transcripts. Example: a monitor "agent promised a discount not in policy" flags three conversations this week, each linked to its trace.

**Design to implement.**
- **Monitor (QA job) definition:** `monitor(id, name, criterion_text, positive_examples[], negative_examples[], filters {channel, procedure, outcome, debtor segment, date range}, mode: historical|continuous, rubric [{field, points, description}], category, severity, alert_target)`. Criterion is natural language, judged by a model over the transcript plus trace.
- **Test on a sample first:** "test monitor" runs it on a small sample (e.g. 50 conversations [Inference]) and shows hits for the author to confirm before it runs on all traffic.
- **Defaults shipped:** coherence, repetition, grounding (claims match records), sentiment/frustration; receivables defaults [Inference from doc 18 What to copy 7]: "debtor disputes the debt", "agent promised a discount not in policy", "contact outside permitted hours" (cross-checked against the compliance log, §7), "debtor says already paid".
- **Output:** each flag links to the transcript and trace; flags grouped into categories/clusters; dashboards with rubric averages; drill-down; alerts on spikes or when a metric leaves a range; monitors also cover human-handled conversations.
- **Feeds:** flags become builder-agent opportunities (§3) and one-click tests (§11).
- **Platform-level:** abuse/threat detection across all agents and API-outage or metric-anomaly alerts.
- **Topic discovery and natural-language questions over conversations** (summary, chart, links to sources) for managers.

**Copies.**
- doc 18 Key finding 6, §2.5, What to copy 7: Watchtower natural-language criteria, filters, historical or continuous, rubric scoring, categories, Test Watchtower on a sample, positive and negative examples, AI and human conversations, templates; Insights tags, topic discovery, Ask AI. https://decagon.ai/modules/watchtower-qa ; https://decagon.ai/product/watchtower ; https://decagon.ai/modules/insights-reports
- doc 12, Sierra monitors: natural-language, every conversation, flag links to transcript, default coherence/repetitiveness/grounding/sentiment, custom frustration or brand voice. https://sierra.ai/blog/confidence-in-every-conversation
- doc 19 §2A, §2H: Ghostwriter flags API outages and metric anomalies; alerting on abuse attempts or performance drops; Threat Detection. https://sierra.ai/blog/summit-recap-2026 ; https://sierra.ai/product/insights
- doc 12 Cross-cutting (b): every vendor runs always-on monitors over 100% of conversations [Vendor claim].

**Left out, and why.** Peer benchmarks across deployments (needs a customer base, doc 12).

**Open questions.** Cost of judging 100% of traffic with rented models; no vendor publishes it [Inference: sample-then-scale and cheap models per monitor].

### 11. Simulations

> Source: [general-references/34-map-agent-companies.md § 11. Simulations](../../general-references/34-map-agent-companies.md#11-simulations)

**Purpose.** Test the agent against simulated debtors and mocked systems before release and score whether the ledger ends in the right state. Example: "You are the AP clerk at ABC Trading; you claim you paid last week; insist politely" — pass only if the agent checks the ledger, opens a dispute or confirms the payment correctly, and does not send another reminder.

**Design to implement.**
- **Test case** = user instruction (persona, goal, mood, language, patience) + initial database snapshot (company model state: invoices, payments, contacts, consents) + reference action list + required communicated facts + optional natural-language assertions + checkpoints (right action, data and tool at the right moment).
- **Reward** = product of components (default DB × COMMUNICATE): replay reference actions on a fresh snapshot, compare final DB state hashes with the agent's run; check required strings/facts were communicated; NL assertions judged by an LLM. Any trajectory reaching an equivalent end state passes.
- **pass^k** = C(successes, k) / C(trials, k); run each scenario several times (k ≥ 4 recommended in doc 12).
- **Mocks** of every connector generated from the same tool schemas.
- **Dual control:** when the debtor must act (click a link, forward remittance), the simulated user has its own tools.
- **Judge:** separate model; for document outputs from internal agents, atomic binary criteria scoped to deliverables, two different judge models, all-pass scoring.
- **Generation:** auto-generate initial tests from SOPs and knowledge at agent creation; one click turns an annotated bad conversation into a test; detect stale tests and update or remove them; four buckets (happy, edge, adversarial, permission) run under three user profiles (standard, restricted, admin).
- **Runs:** CLI and CI (GitHub Actions) entry points; scheduled recurring runs; gate releases (§4); alert when metrics leave a range.
- **Message replays** for small changes: replay one turn on updated logic.
- **Salesforce test triple** as a minimum per test: expected topic (procedure), expected action, expected outcome.

**Copies.**
- doc 12, tau-bench/tau2 (code read): reward, DB hash, communicate, pass^k, dual control, reference actions as one valid path. /home/claude/research/_code/tau2-bench/docs/evaluation.md ; https://arxiv.org/abs/2406.12045 ; https://arxiv.org/pdf/2506.07982
- doc 12, Sierra simulations: persona variation, production-matched initial state, repeated runs, judge on goal/SOP/brand/quality, auto-generated tests, failure-to-test, 35,000 tests a day [Vendor claim], CLI/GitHub Actions. https://sierra.ai/blog/simulations-the-secret-behind-every-great-agent
- doc 18 §2.4: Simulations with checkpoints and rationale, stale test detection, scheduled runs, CI/CD, PagerDuty; Message Replays; conversation-to-test; run several times. https://decagon.ai/product/testing-qa ; https://decagon.ai/modules/testing
- doc 21 §3.6: four-bucket golden set, three profiles, pass rates and critical failures, prefer "I don't have access". https://docs.glean.com/agents/agent-development-lifecycle/evaluate-agent-quality
- doc 12, Harvey LAB: atomic binary criteria, two judges, all-pass. /home/claude/research/_code/harvey-labs/docs/eval-strategies.md
- doc 20 §2: Testing Center topic/action/outcome. https://admin.salesforce.com/blog/2025/ensuring-ai-accuracy-5-steps-to-test-agentforce
- doc 20 §1.2B: Meta Agent Test and Agent Eval (conversation- and turn-level scores). https://developers.facebook.com/documentation/meta-business-agent/capabilities

**Left out, and why.** Voice sims with noise and DTMF, tau-voice (voice later).

**Open questions.** Default judge model under rented-model constraint (tau2 default is gpt-5.5; the stack names Claude and Qwen).

### 12. Experiments

> Source: [general-references/34-map-agent-companies.md § 12. Experiments](../../general-references/34-map-agent-companies.md#12-experiments)

**Purpose.** Test reminder wording, timing or channel against real outcomes and keep the winner. Example: variant B sends the first reminder on the due date at 10am; measure promise-to-pay rate and paid-within-7-days vs control.

**Design to implement.**
- **Experiment block inside a procedure step:** up to 20 variants against a shared control; sample size set up front; gradual ramp; alerts; auto-stop if a variant is significantly worse; one-click publish of the winner (which then goes through the release pipeline, §4).
- **Sticky assignment:** a case keeps its variant even if a new release publishes mid-test.
- **Count only cases that reached the tested step.**
- **Simulation pre-check** of each variant against the golden set before live traffic.
- **Concurrent experiments without overlap** (one case in at most one experiment per step) [as Decagon states; exact allocation algorithm not published].
- **Metrics:** for receivables [Inference]: PTP rate, paid within N days, days-to-pay vs control, dispute rate, opt-out rate, escalation rate, cost per case. Vendor list includes resolution, CSAT, NPS, latency, turn count, cost per conversation.
- **Headline outcome:** "paid N days faster" against a control group on standard reminders.

**Copies.**
- doc 18 Key finding 5, §2.4, What to copy 8: experiment blocks, 20 variants, sizing, ramp, auto-stop, sticky assignment, step-reached counting, 20+ metrics, simulation pre-check, no overlap. https://decagon.ai/blog/experiment-hub
- doc 19 §2C, §2H: experiments vs split releases; conversation-design tests. https://sierra.ai/blog/release-governance-guardrails-for-agents-at-scale ; https://sierra.ai/product/insights
- doc 12: Ghostwriter proposes experiments and announces significance. https://sierra.ai/blog/ghostwriter-ai-tool-to-teammate
- doc 20 What to copy 10: "paid N days faster" against a control group (Intuit claims ~5 days [Vendor claim]). https://quickbooks.intuit.com/r/news/virtual-team-of-ai-agents/

**Left out, and why.** Nothing material.

**Open questions.** Statistical method (sequential test vs fixed horizon) is unpublished. With 100 to 1,000-staff customers, debtor counts may be too small for significance [Inference]; consider pooling across tenants only with consent.

### 13. Replay of past runs as tests

> Source: [general-references/35-map-market-and-competitors.md § 13. Replay of past runs as tests](../../general-references/35-map-market-and-competitors.md#13-replay-of-past-runs-as-tests)

**Purpose.** Re-run stored past runs against a new agent, model or policy version and compare the outputs before publishing, and simulate on historical data before a tenant goes live. Example: before publishing policy v8, replay last month's 400 reminder decisions and show the 12 whose outcome would change.

**Design to implement.**
- Store every run as a trace: `run(id, agent_id, agent_version, model_id, policy_version_id, inputs_snapshot (object versions and event ids), tool_calls, outputs, decision_id, cost)`. Keep traces in a training-ready format (Maisa) [Inference: JSONL export].
- Replay modes:
  1. **Deterministic replay** (Maisa): same inputs, same code, same model version → compare to stored output; for code steps a difference is a bug.
  2. **Candidate replay**: same inputs, new agent/model/policy version → diff report of outcome changes, cited clauses, and draft text changes.
  3. **Simulation before go-live** (Lorikeet): run the agent over the tenant's historical invoices and messages; show projected decisions and knowledge gaps; go live segment by segment (by customer segment or ageing bucket) only where simulation supports it.
- Publishing gate: a policy or agent version cannot be published while the golden set (section 8) fails above a tenant-set threshold [Inference for threshold].
- Replays and simulations are design-time and not billed to the customer (UiPath).

**Copies.**
- Document 27, "B3 Maisa, What to copy" items 3 and 5: deterministic re-execution as regression test; traces stored training-ready. https://maisa.ai/product ; https://maisa.ai/
- Document 27, "B5 Lorikeet, What to copy" item 4: simulate on historical tickets, then go live topic by topic. https://www.lorikeetcx.ai/product/how-it-works
- Document 22, "1.4 Evals": evals as unit tests, accountant-defined correct path, user-flagged errors into the set. https://ramp.com/leading-indicators/what-it-takes-to-build-ai-agents-at-scale
- Document 26, "UiPath": design-time and preview consumption separate and unbilled. https://docs.uipath.com/agents/automation-cloud/latest/user-guide/licensing.md

**Left out, and why.** Owned small models trained from traces (Maisa claims savings only past about 100,000 runs a month; document 27 says irrelevant for the first years).

**Open questions.** Rented models are not bit-for-bit deterministic, so "deterministic replay" applies strictly only to code steps; for model steps the comparison must be on outcome class and cited clauses [Inference].

### 14. One KPI per agent with a baseline

> Source: [general-references/35-map-market-and-competitors.md § 14. One KPI per agent with a baseline](../../general-references/35-map-market-and-competitors.md#14-one-kpi-per-agent-with-a-baseline)

**Purpose.** Tie every agent to one named KPI measured from a baseline taken before go-live, so value is provable and outcome pricing becomes possible later. Example: the reminder agent owns "past-due balance as % of AR", baseline 31% over the 90 days before go-live.

**Design to implement.**
- Table `kpi_definition` (the semantic layer, Celonis Knowledge Model): `key`, `formula` (SQL over governed views), `unit`, `grain`, `filters` (named conditions), `version_no`. Version-one KPIs (Celonis AR lists): aging buckets; top 10 customers by past due and by AR; DSO current and trend; average days past due; average days to pay; weighted average payment terms; disputes by status and reason; days to identify and resolve disputes; valid versus invalid disputes; promise-kept rate; unapplied cash; auto-match rate.
- Table `agent_kpi`: `agent_id`, `kpi_key`, `baseline_value`, `baseline_window` (default 90 days before go-live [Inference]), `baseline_computed_at`, `target`, `holdout_comparison` (section 10).
- Agent health page (Sidetrade health dashboard; ServiceNow Control Tower "Measure"): KPI versus baseline and holdout, runs, cost per run, cost per outcome, agreement rate, errors.
- Value attribution stored for audit: cash collected per reminder sequence (Celonis Transformation Hub).
- DSO definition is shown with its rule choices (credit notes netted? unapplied cash treated how? disputes excluded?), because no vendor shows the definition behind the figure (document 23).

**Copies.**
- Document 23, "HighRadius, What to copy" item 1 and "What to copy" item 1: one KPI per agent with a baseline; basis for outcome pricing. https://www.businesswire.com/news/home/20260227310299/en
- Document 26, "Celonis AR apps" and master list item 4: KPI lists. https://docs.celonis.com/en/accounts-receivable-capabilities.html ; https://docs.celonis.com/en/accounts-receivable-cash-app.html
- Document 26, master list items 13 and 17: cost and ROI per agent; value attribution. https://www.constellationr.com/insights/news/servicenow-knowledge-2026-ai-control-tower-action-fabric-autonomous-workforce-and ; https://www.celonis.com/news/article/finally-enterprise-ai-gets-the-context-it-needs-to-succeed-celonis-next-2026
- Document 27, "B7 Relevance AI" item 4: cost per outcome by version. https://relevanceai.com/
- Document 23, "Published evidence": measure baselines at each pilot rather than rely on vendor figures.

**Left out, and why.** HighRadius-style gain-share contracts at launch (document 23: needs measurement apparatus and legal agreement per customer; defer). Unverifiable headline claims.

**Open questions.** Which single KPI the cash-matching agent owns (auto-match rate or unapplied cash).

## Earlier engineering notes (Phase 2)

### Agent Development Lifecycle (ADLC)

> Source: former `08-agent-platform/agent-runtime-and-adlc.md` (moved here in the Nov 2026 restructure)

Author agent specification → connect tools/knowledge → inspect generated journey/plan → run unit simulations → run scenario suite → test authorization and adversarial prompt injection → human review → versioned release → canary/split rollout → monitor traces and outcomes → convert failures into regression cases → rollback or remediate.

Sierra's public Agent Studio material demonstrates journeys, integrations, traces, simulations and staged release governance. Decagon's AOPs suggest a separation between business-authored procedures and engineer-controlled tools/guardrails. Treat these as product patterns rather than evidence of their full private runtimes.

### Evaluation

> Source: former `08-agent-platform/agent-runtime-and-adlc.md` (moved here in the Nov 2026 restructure)

A task should score business-system end state, policy/guardrail compliance, correct communication, citations/evidence, escalation quality and consistency across repeated trials. Report pass@k and pass^k separately. A high-quality answer that failed to update the required system is not a successful operational task; a successful state change accompanied by a policy violation is also a failure.

### 3. AIP Evals is a regression process, not a one-off prompt score

> Source: former `08-agent-platform/phase2-agent-sessions-and-evaluation.md` (moved here in the Nov 2026 restructure)

AIP Evals documents:
- suites containing test cases, target functions and evaluators;
- metrics per test case and aggregate across suites;
- comparisons against previous versions;
- comparisons between different models/parameters;
- multi-run variance investigation;
- execution traces/debugging and configurable thresholds.

Palantir recommends executing LLM-backed test cases at least three times because non-determinism can make a single run misleading. The run metadata can record branch, version and model. Its experiments view supports comparisons across runs and drilling into per-case output differences.

Sources:
- https://www.palantir.com/docs/foundry/aip-evals/overview
- https://www.palantir.com/docs/foundry/aip-evals/run-suite
- https://www.palantir.com/docs/foundry/aip-evals/experiments

### 4. Proposed agent release unit

> Source: former `08-agent-platform/phase2-agent-sessions-and-evaluation.md` (moved here in the Nov 2026 restructure)

Treat an agent release as an immutable versioned bundle:
- procedure/SOP and prompt/instructions;
- model/provider and sampling/configuration;
- tool schemas and permissions;
- ontology/model and metric versions;
- knowledge/index snapshot and data scope;
- policy/guardrail versions;
- evaluator/golden-case suite version;
- workflow state-machine version;
- release metadata, approval and rollback pointer.

A production session should pin an agent release and record any explicitly allowed dynamic dependencies. Otherwise an ongoing workflow may change behaviour midway when prompts, tools, models or knowledge are updated.

### 5. Evaluation rubric for operational agents

> Source: former `08-agent-platform/phase2-agent-sessions-and-evaluation.md` (moved here in the Nov 2026 restructure)

A single answer-quality score is not enough. Measure at least:
1. **Task outcome:** did the required system state reach the intended end state?
2. **Policy compliance:** was every read, tool call and action permitted?
3. **Evidence correctness:** are claims linked to correct source documents/versions/spans?
4. **Tool correctness:** correct inputs, sequencing, handling errors and no unauthorized calls.
5. **Communication and escalation:** did the agent ask for approval or hand off at the proper boundary?
6. **Reliability:** pass rate across repeated trials, variance, failure-mode distribution.
7. **Economics:** tokens, tool calls, latency and human-review time per successful task.

Report answer quality separately from workflow completion and policy compliance. A correct-looking response with no required state change is not a completed task; a completed action with a policy breach is a hard failure.

### 6. Tests and controls

> Source: former `08-agent-platform/phase2-agent-sessions-and-evaluation.md` (moved here in the Nov 2026 restructure)

- Resume a session after process restart and after long approval wait.
- Deliver events out of order or twice; verify event sequence and idempotency.
- Revoke the initiator's or agent's access during a paused session; verify the next event cannot continue under stale authority.
- View session as another firm user without matter access; deny.
- Pin session to agent/tool/ontology versions and test release change during execution.
- Run golden cases at least three times and report variance.
- Add a failing production case to the golden set and verify it blocks promotion.
- Verify rollback moves new sessions to the prior release without mutating historical traces.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Reward design to copy (tau2-bench 2.0.0, MIT, code):** `RewardType` in [`sierra-research/tau2-bench` → `src/tau2/data_model/tasks.py`](https://github.com/sierra-research/tau2-bench/blob/768f3d8/src/tau2/data_model/tasks.py) — final reward is the product of the components in `reward_basis`; default basis `[DB, COMMUNICATE]` (end-state database match × required information communicated). Report pass^k over repeated trials.

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed (code)** — tau2-bench 2.0.0 reward basis default `[DB, COMMUNICATE]`.

## Gaps

- Every source category has some material; see the open questions in each linked source.
