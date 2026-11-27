# Rules and decision tables

**Layer:** [05-actions-and-rules](README.md) · **What it is:** Business rules as governed, versioned objects evaluated by deterministic engines and decision tables.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Open-source implementations](#open-source-implementations) (1) · [Research literature](#research-literature) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (7)

## Palantir

### A12. Foundry Rules (formerly Taurus): the business-rules product

> Source: [general-references/05-palantir-apps-infra.md § A12. Foundry Rules (formerly Taurus): the business-rules product](../../general-references/05-palantir-apps-infra.md#a12-foundry-rules-formerly-taurus-the-business-rules-product)

**Plain English.** An analyst writes a rule in a form: "transactions over 10,000 MYR to a new beneficiary in under 24h → alert, severity High". It does not go live until the rule owner approves the proposal. A nightly pipeline then runs all live rules and writes the matching rows to an alerts dataset, which becomes Alert objects.

**Mechanics.**
- **Rule = object.**
  - Properties: name, description, author, rule type, workflow-specific *custom properties* (for example `alert_severity`, `alert_assignee`, `priority`), and a *logic* property.
  - The logic is stored as a compressed JSON blob following a grammar ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/object-model/)).
- **Proposal = object.**
  - Contents: rule ID, author, timestamp, status (open, approved or rejected), reviewer, and a diff (`old_rule_name`/`new_rule_name`, `old_logic`/`new_logic`).
  - A rule can have several open proposals at once.
  - Proposals are optional, and the approval flow is customizable because it is plain objects plus Actions.
- **Permissions as Action validation** ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/rule-permissions/)):
  - an edit or delete proposal can be approved only by the rule author or a superuser;
  - a proposal can be rejected by the rule author, the proposal author or a superuser.
  - All of this is configured as submission criteria on the approve and reject Actions.
- **Logic structure:** inputs, then a chain of logic blocks, then an output ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/rule-logic/)).
  - Each block takes the previous rows and emits new rows. Each block has a Preview.
  - Block types: filter, expression, aggregate, join. The workflow owner can switch types on or off for end users.
  - Inputs are datasets or object types, as allowed by the workflow owner.
    - Not supported: multi-datasource objects, multi-materialization objects, and edit-only properties.
    - Objects behind restricted views must be swapped for an alternate backing dataset.
  - Each rule output maps to a configured output dataset with enforced columns and types, and many rules write into the same output.
- **Authoring UI:** a Workshop app with a Rule Editor and a Proposal Reviewer. A "workflow configuration editor" defines the allowed inputs, outputs and features ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/core-concepts/)).
- **Execution:** by default, a Palantir-managed transform runs all the rules. Advanced users can enable "self-managed transforms" ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/customize-foundry-rules-pipeline/)). That generates code into a `FoundryRulesTransform` file in a repository, which enables subset scheduling, pre-processing and incremental runs. Streaming workflows cannot use custom pipelines.
- **Packaging:** rules ship through Marketplace ([Fact](https://www.palantir.com/docs/foundry/foundry-rules/overview/)).
- **Time-series rules** are marked [Sunset].
- **Small-product equivalent [Inference]:**
  - a `Rule` table (metadata, custom properties, JSON AST logic) and a `RuleProposal` table (old/new AST diff, status, reviewer);
  - approve and reject as Actions with validation;
  - an executor that compiles the AST to SQL over the warehouse, on a schedule or on events;
  - output rows land in an `Alert` object type.
  - Agents could draft proposals but never approve them.

## Open-source implementations

### 30. Rules engines: GoRules Zen, json-rules-engine, DMN

> Source: [open-source-references/rules-engines.md](../../open-source-references/rules-engines.md) (code study)

- **Zen**: MIT, Rust (about 89k lines) with napi bindings published as `@gorules/zen-engine` 2.1.12. The JSON Decision Model graph has node kinds Input, Output, Function (JavaScript source), Decision (sub-decision by key), DecisionTable (hit policy `first` or `collect`), Expression, Switch and Custom. A newer `policy` module adds "policy documents" with prose, typed data models and tables, plus tracing (`BlockTrace`, `ConditionTrace`), diagnostics, rename and linting. [Fact] ([core/types/src/decision/mod.rs](https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs), [core/engine/src/policy/mod.rs](https://github.com/gorules/zen/blob/HEAD/core/engine/src/policy/mod.rs))
- **json-rules-engine**: ISC, JavaScript, version 7.3.2, about 1,500 lines, last commit 2026-02-16. It provides all/any/not conditions, custom operators, async facts in an almanac, and events and priorities. [Fact]
- **DMN**: `dmn-js` is MIT plus a clause that the bpmn.io watermark must stay visible. It is a modeller, not an engine. `feelin` (MIT, version 8.2.2) is a JavaScript FEEL interpreter. [Fact] ([dmn-js LICENSE](https://github.com/bpmn-io/dmn-js/blob/HEAD/LICENSE))
- Verdict:
  - **Adopt Zen** if business users must edit decision tables (pricing, eligibility, approval thresholds) and you want a trace of why a row fired.
  - Otherwise encode preconditions as the JSON condition IR copied from Palantir's `OntologyIrCondition`, evaluated in TypeScript.
  - Avoid DMN unless a customer demands it.

  [Inference]

---

## Research literature

### 7. Neuro-symbolic reasoning and rules

> Source: [general-references/10-papers-agents-memory-eval.md § 7. Neuro-symbolic reasoning and rules](../../general-references/10-papers-agents-memory-eval.md#7-neuro-symbolic-reasoning-and-rules)

**Plain English.** Let the LLM translate ("refunds over RM 500 need a manager") into a formal rule once. Let a deterministic engine evaluate that rule every time. The LLM never decides whether the rule applies by reading prose.

**LLM plus solver.** Logic-LM (Pan, Albalak, Wang, Wang; arXiv 2305.12295, 2023): the LLM formulates the problem symbolically, a deterministic solver infers, and solver error messages drive self-refinement of the formalisation. Across ProofWriter, PrOntoQA, FOLIO, LogicalDeduction and AR-LSAT it averaged +39.2% over standard prompting and +18.4% over CoT [Fact, https://arxiv.org/abs/2305.12295]. That the paper used Prover9, Pyke, Z3 and a CSP solver is from the body [Unverified this session]. Other LLM plus ASP/Datalog work (for example LLM-to-ASP pipelines, LINC) was not read this session [Unverified].

**LLM plus SQL as symbolic executor.** Spider 2.0: 632 enterprise workflows on BigQuery, Snowflake and others, often with more than 1,000 columns. o1-preview in a code-agent framework scored 21.3%, against 91.2% on Spider 1.0 and 73.0% on BIRD [Fact, https://arxiv.org/abs/2411.07763]. Sequeda/Allemang/Jacob: 43 questions on a 13-table insurance subset. GPT-4 zero-shot SQL scored 25.5%, 37.4%, 0% and 0% across the four quadrants. SPARQL over an OWL ontology with R2RML mappings (data.world virtualisation into SQL) scored 71.1%, 66.9%, 35.7% and 38.5% [Fact, https://arxiv.org/html/2311.07509]. Limitations: small question set, one model (GPT-4, 2023), 1-to-1 mappings. AMBROSIA (section 3) shows that ambiguity, not just schema size, breaks text-to-SQL.

**Rule representation standards.**
- DMN (OMG): 1.6 became formal in September 2026, with 1.7 in beta [Fact, https://www.omg.org/spec/DMN/]. DMN decision tables have input columns, output columns and a hit policy (Unique, First, Priority, Any, Collect, Rule order, Output order), with FEEL expressions [Unverified this session; from the standard as I know it].
- GoRules ZEN: an MIT-licensed Rust engine with Node, Python, Go, Java/Kotlin, .NET, iOS and Android bindings. Decisions are JSON (JDM) graphs of decision tables, switches, expressions, functions and sub-decisions. Tables are first-match with optional collect columns. Decisions are pre-compiled at load and evaluate "in microseconds", with no benchmark published. Loading from file, database or service is the host's job [Vendor claim, https://github.com/gorules/zen].
- Drools (Rete-based production rules, DRL, DMN support): not read this session [Unverified].

**Policy as code.**
- Cedar (Cutler et al., arXiv 2403.04651; AWS) [Fact, https://arxiv.org/html/2403.04651v2]. A policy is `permit|forbid (principal, action, resource) when {…} unless {…}` over `context`. Default is deny, and any forbid overrides permits. Evaluation is deterministic and independent of order: no side effects, no general loops. Entities have types, IDs and attributes, and parents form a DAG (roles and groups). A schema-based validator typechecks policies against every allowed request shape. A symbolic compiler to SMT gives sound, complete, decidable analysis (for example "does this refactor change any permission?" with a counterexample). The design is modelled and proven in Lean, with the Rust implementation differential-tested against the model. Performance: 28.7x to 35.2x faster than OpenFGA and 42.8x to 80.8x faster than Rego, and policy slicing gave a further 10x to 18x. SMT analysis averaged about 75 ms.
- OPA/Rego is Datalog-inspired and extended to JSON. `input` is the request and `data` is stored documents. Rules define virtual documents, `default allow := false` sets the fallback, and decision logs record rule labels [Fact, https://www.openpolicyagent.org/docs/policy-language].

**Constraint checking of LLM actions.** AgentSpec (Wang, Poskitt, Sun; ICSE 2026, arXiv 2503.18666) is a DSL whose rules are trigger (an event such as a specific tool call), predicate (a condition over state and arguments) and enforcement (block, ask a user, take a corrective action, stop). It prevented unsafe executions in over 90% of code-agent cases, removed all hazardous embodied actions, and gave 100% AV compliance at millisecond overhead. Rules auto-generated by o1 reached 95.56% precision and 70.96% recall on embodied tasks [Fact, https://arxiv.org/abs/2503.18666]. In other words, an LLM can draft rules, but recall is not enough to skip human review.

**Rule extraction from documents.** I found no primary benchmark this session for "policy PDF to executable rules" accuracy [Open question]. Indirect evidence: AgentSpec's LLM-generated rules (recall of about 71%) and DuetBench's build-from-messy-docs tasks (45.5% pass) [Vendor claim]. Both say a human must review every extracted rule.

**Takeaway** [Inference]. Use three rule types, each in the engine that fits it:
- Authorization ("who may do what to which object"): Cedar, chosen for analysability and speed.
- Business decisions ("discount tier", "refund approval route"): DMN-style decision tables, using ZEN or a DMN engine.
- Action guards ("before `send_email` to an external domain, require a human approval if the body contains a customer record"): AgentSpec-style trigger, predicate and enforcement.

The LLM drafts rules from documents, and humans approve them. Every agent action passes through all applicable checks in the tool server, never in the prompt.

## Design decisions already in the reference maps

### 9. Rules as governed objects with proposals

> Source: [general-references/30-map-palantir-platform.md § 9. Rules as governed objects with proposals](../../general-references/30-map-palantir-platform.md#9-rules-as-governed-objects-with-proposals)

**Purpose.** Business rules (escalation, dunning schedules, alert thresholds) are data that analysts edit and owners approve, and that agents can draft but never ship. *Receivables example:* "Invoices more than 30 days overdue with amount over RM 10,000 for SME customers → Alert, severity High, assignee = senior collector" goes live only after the AR manager approves the proposal.

**Design to implement.**
- **A rule is an object** [Fact 05]: name, description, author, rule type, workflow-specific custom properties (for example `alert_severity`, `alert_assignee`, `priority`), and a logic property. Palantir stores the logic as compressed JSON following a grammar. Store it as `jsonb` with a `grammar_version` [Inference].
- **Logic shape** [Fact 05]: inputs → a chain of blocks → output. Each block takes rows and emits rows, and has a preview. Block types are filter, expression, aggregate and join, and the workflow owner can switch types on or off. Inputs are object types or datasets allowed by the owner. Each output maps to a configured output table with enforced columns and types, and many rules can write to the same output.
- **The grammar itself is undocumented** [Unverified 05], so design one [Inference]:
  - Block = `{kind: filter|expression|aggregate|join, ...}`.
  - Filters reuse the object-set filter operators from section 6.
  - Expressions are a small typed expression tree (arithmetic, comparison, date difference, coalesce).
  - Aggregates use the metric set from section 6.
  - Joins are limited to declared links, so a rule can never join on an undeclared key.
- **A proposal is an object** [Fact 05]: rule ID, author, timestamp, status (open|approved|rejected), reviewer, and diffs (`old_name`/`new_name`, `old_logic`/`new_logic`). A rule may have several open proposals.
- **Approve and reject are actions** whose submission criteria encode the policy [Fact 05]:
  - approve an edit or delete proposal: the rule author or a superuser;
  - reject: the rule author, the proposal author or a superuser.
  - **Addition:** a proposal created by an agent cannot be approved by the agent or by the principal it acts for; it needs a second human [Inference].
- **Executor** [Inference, from 05's suggested equivalent]: compile the AST into one SQL statement over the security views, run as the rule workflow's service principal on a schedule or on data-updated triggers (section 2), and write matching rows to the output table. The indexer then turns them into `Alert` objects. Palantir runs all rules in one managed transform by default, with self-managed incremental execution as an option [Fact 05].
- **Metric definitions use the same pattern** [Inference]: a `MetricDefinition` object (DSO, collection effectiveness index, percent current), with an AST and proposals, so that every number an agent reports has a reviewed, versioned definition.

**Copies.**
- Document 05, A12 "Foundry Rules": rule object, proposal object, approve and reject actions with validation, block chain, output datasets, packaging through Marketplace. https://www.palantir.com/docs/foundry/foundry-rules/object-model/ , https://www.palantir.com/docs/foundry/foundry-rules/rule-logic/ , https://www.palantir.com/docs/foundry/foundry-rules/rule-permissions/ , https://www.palantir.com/docs/foundry/foundry-rules/customize-foundry-rules-pipeline/
- Document 05, B3: policy-bot's predicate rule model as a later template for approval policies. https://github.com/palantir/policy-bot

**Left out, and why.**
- Time-series rules: marked Sunset [Fact 05].
- Streaming rule workflows.
- Self-managed generated transform code: version 2.

**Open questions.**
- Palantir lets the rule author approve. If the rule author also wrote the proposal, is that self-approval? The documents do not say.
- Default execution schedule and alert object conventions [Unverified 05].

---

### 2. Rules and derived relations written inside the schema (OpenSPG)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 2. Rules and derived relations written inside the schema (OpenSPG)](../../general-references/31-map-lingyang-alibaba-offers.md#2-rules-and-derived-relations-written-inside-the-schema-openspg)

**Purpose.** Let business rules and derived facts live in the model as declarative code that the engine evaluates, not in prompts. Receivables example: "a customer is a chronic late payer if at least 3 invoices in the last 180 days were paid more than 30 days late" is a named rule attached to `Customer.chronic_late_payer`, and every agent and report reads the same result.

**Design to implement.**
- Rule block shape, copied from OpenSPG: `Define (s:Type)-[p:pred]->(o:Type) { STRUCTURE { pattern } CONSTRAINT { named conditions and assignments } }`, attached to the property or relation it defines [Fact, 08 §8].
- Constraint vocabulary to support, from OpenSPG [Fact, 08 §8]:
  - aggregation `group(s).sum(x)` (also count, max, min) [Inference for count, max, min: only sum is shown];
  - date functions such as `date_diff(from_unix_time(now(),'yyyyMMdd'), f.transDate) < 30`;
  - null handling `rule_value(cond, then, else)`;
  - references to other derived properties;
  - named thresholds, e.g. `R1("share must exceed 50%"): x*1.0/s.total > 0.5`.
- Named thresholds are the unit an agent cites. Store each as `{rule_id, label, expression, version, owner}`, so an answer can say "rule R1 v3, owned by the finance manager" [Inference: 07 notes that citations with rule version and owner are only in the founder's talk notes, not public].
- Concept rules: OpenSPG classifies events into concept nodes (a price-up event belongs to a concept) [Fact, 08 §8]. Receivables use: classify a payment event as `on_time`, `late_1_30`, `late_31_60`, `late_60_plus` [Inference].
- Property constraints from OpenSPG: `NotNull`, `MultiValue`, `Enum`, `Regular` (regex) [Fact, 08 §8]. Put these on entity fields in section 1.
- Semantic properties: a property typed as a concept with `MultiValue` turns a comma-separated column into edges at import [Fact, 08 §8]. Use it for tags such as an invoice's cost centres [Inference].
- Evaluation [Inference]: compile each rule to SQL (a CTE or view) at publish time, in the same pass as metrics (section 5). Never ask an LLM to evaluate a rule.
- Failure behaviour [Inference]: a rule that references an unknown property, or forms a cycle with another derived property, fails publish with the offending path.
- Business-rule table for dunning policy (25 row 7: "remind at +3, +10 and +20 days; stop if a dispute is open; escalate above X") is a separate, simpler structure. Store it as rows a finance owner edits, with draft, publish and approve. The OpenSPG block is for derived facts; the dunning table is for policy [Inference].

**Copies.**
- 08, §8 OpenSPG schema language: rule blocks, constraint functions, named thresholds, concept rules, property constraints, semantic properties. https://github.com/OpenSPG/KAG (`kag/examples/supplychain/schema/SupplyChain.schema`, `concept.rule`, `knext/schema/marklang/schema_ml.py`)
- 08, What to copy 12: evaluate in the engine, not the LLM.
- 25, C6 row 7: rule table with approval.

**Left out, and why.**
- OpenSPG's graph storage (TuGraph, Neo4j adapters): the stack is PostgreSQL [Fact for adapters, 08 §8; Inference for exclusion].
- OpenSPG's `hypernymPredicate` concept hierarchies: not needed for receivables [Inference].

**Open questions.**
- Whether to keep OpenSPG's text syntax, or store the same structure as JSON edited through a form. The documents show only the text syntax.
- The SPG white paper was not opened [Unverified, 08 §8].

### 10. Rules executed in deterministic engines: permissions, decision tables, action guards

> Source: [general-references/32-map-research-and-cost.md § 10. Rules executed in deterministic engines: permissions, decision tables, action guards](../../general-references/32-map-research-and-cost.md#10-rules-executed-in-deterministic-engines-permissions-decision-tables-action-guards)

**Purpose.** The model never decides by reading prose whether a rule applies. Examples:
- "Collectors may only see customers in their region": a permission.
- "Write-offs over RM 5,000 need the finance controller": a decision table that routes approval.
- "Before `send_message` to an external address, block if the recipient came from email content": an action guard.

**Design to implement.**
- *(a) Permissions in Cedar-style policy*: `permit|forbid(principal, action, resource) when {…} unless {…}`.
  - Default deny; any forbid overrides permits; no side effects.
  - Entities come from the company model (staff, roles and teams as a parent DAG; objects). Actions are the model's allowed actions.
  - Policies are validated against a schema. CI runs SMT analysis to prove a policy change grants nothing unintended.
  - Mirror read permissions into Postgres RLS so SQL results are filtered in the database. External (customer-facing) agents are a separate principal type with forbid policies on internal fields.
- *(b) Business decisions as DMN-style decision tables*: input columns, output columns, an explicit hit policy. Use GoRules ZEN (MIT, Node bindings, JSON decision graphs) or a DMN 1.6 engine. Version and unit-test the tables. Examples: dunning-step selection by days overdue × customer tier; approval routing by amount.
- *(c) Action guards in AgentSpec form*: `{trigger: tool + argument pattern, predicate: over args, state and data provenance, enforcement: allow | block | require_approval(role) | redact | stop}`.
- *Execution point*: all three run in the tool server at the boundary. The agent receives `{decision, reason, rule_id}` as a tool result.
- *Authoring*: a model may draft rules from policy documents; a human approves each one.

**Evidence.**
- Cedar was 28.7–35.2x faster than OpenFGA and 42.8–80.8x faster than Rego. Policy slicing gave a further 10–18x. SMT analysis averaged about 75 ms (arXiv 2403.04651; document 10, section 7).
- AgentSpec prevented unsafe executions in over 90% of code-agent cases at millisecond overhead. Model-drafted rules reached 95.56% precision and 70.96% recall (arXiv 2503.18666).
- CRMArena-Pro: near-zero inherent confidentiality awareness, and prompting for it hurts task success (arXiv 2505.18878; document 10, section 8).
- Logic-LM: +39.2% when a solver executes rules the model has formalised (arXiv 2305.12295).
- [Vendor claim] ZEN evaluates "in microseconds" with no benchmark published (document 10, section 7).

**Copies.**
- Document 10, section 7 and "What to copy" items 9 and 14. https://arxiv.org/html/2403.04651v2 ; https://github.com/gorules/zen ; https://www.omg.org/spec/DMN/ ; https://arxiv.org/abs/2503.18666 ; https://arxiv.org/abs/2505.18878
- Document 09, section 1 and "What to copy" item 3: SHACL-style closed-world shapes (`minCount`, datatype, `in`, `class`, severity) that validate records, extractions and write actions, with per-record reports. https://www.w3.org/TR/shacl/
- Document 10, section 2: OpenAI's tool risk ratings (low, medium, high) and escalation on irreversible actions. https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf

**Left out.**
- OPA/Rego: slower in Cedar's benchmarks.
- Drools: not read.
- Publishing rules extracted by a model without review (recall about 71%).

**Open questions.**
- The documents do not say whether Cedar has a supported TypeScript or WASM binding [Gap]. Its implementation is Rust.
- DMN hit-policy specifics in 1.6 are [Unverified].
- No benchmark exists for "policy PDF to executable rules" accuracy.

### 14. Rules engines

> Source: [general-references/33-map-context-code-integration.md § 14. Rules engines](../../general-references/33-map-context-code-integration.md#14-rules-engines)

**Purpose.** Business rules that are evaluated, not just described: preconditions on actions, eligibility and threshold tables, and monitoring conditions that trigger work. Receivables example: "Do not send a reminder within 5 days of a promise to pay"; a dunning ladder table (days overdue × customer tier → template and channel); a monitor "invoice becomes 30 days overdue".

**Design to implement.**
- Rule record (Fabric [Fact]) with `enforcement: advisory | enforced` and `requires` in the JSON condition IR (section 12). Advisory rules are text the agent reads (`list_rules` tool); enforced rules are evaluated by the action gate. Never store rules as code strings (anti-source: `eval()` in foundry-ontology-open [Fact]).
- Evaluator for preconditions: a small TypeScript evaluator of the Palantir-shaped condition IR (document 14 verdict [Inference]); json-rules-engine (ISC, all/any/not, custom operators, async facts) is the off-the-shelf alternative [Fact].
- Decision tables, when business users must edit them: **GoRules Zen** (`@gorules/zen-engine` 2.1.12, MIT, Rust with napi). JSON Decision Model nodes: Input, Output, Function (JavaScript), Decision, DecisionTable (hit policy `first` or `collect`), Expression, Switch, Custom; traces (`BlockTrace`, `ConditionTrace`) explain why a row fired [Fact]. [Inference] Version 2 for the dunning ladder; version 1 hard-codes the ladder as a certified metric threshold set.
- Monitoring conditions (Fabric operations agent [Fact]): state conditions (is, is above, is below) re-fire every evaluation; transition conditions (becomes, crosses above/below, enters/exits range) fire once per change. Compile instructions, monitored concepts, rules with backing queries and actions into a reviewable **playbook** before the monitor starts. Fabric evaluates every 5 minutes [Fact]; [Inference] receivables needs hourly at most, and after each sync.
- Mixed deterministic and LLM steps in agent procedures: Agent Script's `->` (deterministic logic) and `|` (text for the LLM) split [Fact]; AgentScope SOP steps (subject, description, executor, optional verifier, `max_attempts = 3`) [Fact].

**Copies.**
- Document 11, section 1 and "What to copy" 3, 16. https://learn.microsoft.com/en-us/fabric/iq/ontology/how-to-use-rules ; https://learn.microsoft.com/en-us/fabric/real-time-intelligence/operations-agent
- Document 14, section 30: Zen, json-rules-engine, DMN verdicts. https://github.com/gorules/zen/blob/HEAD/core/types/src/decision/mod.rs ; https://github.com/gorules/zen/blob/HEAD/core/engine/src/policy/mod.rs
- Document 14, section 2: condition IR. https://github.com/palantir/osdk-ts/blob/HEAD/packages/client.unstable/src/generated/ontology-metadata/api/__components.ts
- Document 11, section 8: Agent Script. https://developer.salesforce.com/docs/ai/agentforce/guide/agent-script.html
- Document 14, section 24: AgentScope SOP. https://github.com/agentscope-ai/agentscope/blob/HEAD/src/agentscope/sop/_schema.py

**Left out, and why.** DMN (dmn-js is a modeller with a watermark clause; avoid unless a customer demands it [Fact/Inference]). Text-only rules as the whole story (Fabric). Python `eval()`.

**Open questions.** Whether Zen's Function node (JavaScript source) needs sandboxing in a multi-tenant service (not discussed in document 14).

### 4. The collections policy as an editable object

> Source: [general-references/35-map-market-and-competitors.md § 4. The collections policy as an editable object](../../general-references/35-map-market-and-competitors.md#4-the-collections-policy-as-an-editable-object)

**Purpose.** Hold the company's collections rules as a structured, versioned, agent-facing document the finance head can read and edit, separate from any staff-facing policy PDF. Example: "Key accounts in their renewal month get no reminders after day 17; the account manager is told instead."

**Design to implement.**
- Table `policy` (one row per tenant and policy kind) and `policy_version` (immutable once published): `id`, `policy_id`, `version_no`, `status` (`draft` | `pending_approval` | `published` | `retired`), `sections` (jsonb), `created_by`, `approved_by`, `published_at`, `diff_from_previous` (jsonb), `source_document_id` (the uploaded original, if any).
- Sections (Ramp's editable areas, extended with Maisa's worker fields [Inference for the merge]):
  1. `timing`: pre-due offsets (default −7, −1 days) and post-due offsets (default 3, 10, 17, 24, 31 days overdue), maximum notices (default 5), quiet days.
  2. `dispute_handling`: what pauses chasing, which reason codes exist, who resolves.
  3. `escalation`: who is told when, after which notice, after a broken promise.
  4. `tone`: voice, language preference per customer, words never to use.
  5. `objective` and `expected_outcome` (Maisa): for example "collect without harming key accounts".
  6. `exceptions` and `controls` (Maisa): segments excluded, approval thresholds.
- Each section is split into **numbered clauses** with stable ids (`clause_id`), so decisions can cite the exact clause text and version (section 8).
- Hard numbers (offsets, thresholds, limits) live in typed fields or in decision tables (section 6), not in prose, so code can enforce them. Prose clauses are guidance for drafting only [Inference; document 22 notes Ramp's policy "is written guidance for the agent, not a rules engine", and document 26 says rules belong outside the prompt].
- Conversion from an uploaded document: the agent drafts a structured version, strips filler, and may not invent rules; anything it cannot map becomes an open question to the policy owner. Cap the source at about 10 pages / 10,000 words; images and hyperlinks are not read (Ramp limits).
- Publishing pipeline: draft → approval by a user with `policy.approve` → published. Every publish writes a change record with a diff and supports one-click rollback to a previous version (Maisa, Feishu aily).
- After a new version publishes, open cases are re-evaluated asynchronously within 24 hours (Ramp re-evaluates recent expenses within 24 hours).
- Default template: Ramp's cadence and five-notice stop.
- Agent proposes, human approves, approval becomes a rule: when a reviewer repeatedly approves the same treatment (for example "dispute reason 'missing PO' → pause 7 days"), the product proposes a new clause or decision-table row; once approved it applies deterministically to similar records (Numeric).

**Copies.**
- Document 22, "1.4 Policy capture" and "1.9 What to copy" items 1 and 10: structured agent-facing document, no invented rules, about 10 pages, asynchronous conversion, re-evaluation within 24 hours, separate from the employee PDF, versioned. https://support.ramp.com/policy-agent-overview
- Document 22, "1.5 Collections agent": default AR Collections Policy with timing, dispute handling, escalation guidance and tone; 3/10/17/24/31 days. https://support.ramp.com/ramp-ar-collections-agent
- Document 27, "B3 Maisa, What to copy" items 1 and 2: worker fields (objective, process knowledge, rules, controls, exceptions, expected outcome); version-controlled approval pipeline. https://maisa.ai/ ; https://maisa.ai/product
- Document 27, "B8 Feishu aily": change record with diff and one-click rollback on every publish. https://feishu.cn/content/article/7631864469689240764
- Document 27, "B2 Numeric, What to copy" item 1: approved treatment becomes a deterministic rule. https://www.numeric.io/product/ai-in-numeric

**Left out, and why.** Letting the model infer rules from user behaviour (Ramp found users approve more leniently than policy allows; document 22). A full rules engine language (document 26: use plain decision tables).

**Open questions.** How many policies per tenant (per entity? per customer segment?). Who in a 100-person firm holds `policy.approve` when the finance head is also the only collector.

### 5. Named rules for fees, discounts and tolerances

> Source: [general-references/35-map-market-and-competitors.md § 5. Named rules for fees, discounts and tolerances](../../general-references/35-map-market-and-competitors.md#5-named-rules-for-fees-discounts-and-tolerances)

**Purpose.** Keep money-affecting allocation and charging rules as named, typed settings the code enforces and every report and agent can cite. Example: "Partial-payment tolerance RM 5: a payment short by RM 5 or less clears the invoice and books the difference to a write-off account."

**Design to implement.**
- Table `named_rule`: `id`, `tenant_id`, `rule_key`, `kind`, `params` (jsonb, schema per kind), `scope` (entity, customer segment, currency), `effective_from`, `effective_to`, `version_no`, `approved_by`, `status`.
- Kinds for version one, each copied from a named product:
  - `late_fee` and `interest` (Paidnice): rate or flat amount, grace days, cap, whether it is added to invoices or only mentioned.
  - `prompt_payment_discount` (Paidnice): percentage, days.
  - `partial_payment_tolerance` (Stripe): absolute and percentage threshold; treatment (credit or write-off account).
  - `uncollectible_after_days` (Stripe: 30, 60 or 90): marks invoices for human write-off review, never automatic write-off [Inference].
  - `card_retry_policy` (Stripe Smart Retries): only if a card gateway is connected; version two.
  - `allocation_order` (document 23 lists allocation order as hidden customer policy): oldest first, or as specified by remittance.
  - `credit_note_offset` (document 23): whether open credit notes net against overdue balance in reminders and in DSO.
- All arithmetic (fees, interest, discounts, tolerances, balances, ageing) is computed by code, never by the model (Numeric: models never compute the numbers).
- Every report figure and every agent action stores the `rule_key` and `version_no` it used, so "show the rule behind this number" works. Document 23 found no vendor that does this.
- Money-moving steps (applying a late fee, issuing a payment link, writing off) are locked functions the agent can call but cannot change (Lorikeet).

**Copies.**
- Document 23, "Paidnice, What to copy" item 1: late fees, interest and prompt-payment discounts as configurable rules. https://www.paidnice.com/pricing
- Document 23, "Stripe Invoicing and Billing": partial-payment tolerance, uncollectible after 30/60/90 days, retry policies by segment; "the founder's model should hold such tolerances as named rules". https://docs.stripe.com/invoicing/automatic-collection
- Document 23, "Does anyone model the company's own rules explicitly": no vendor exposes a versioned rule catalogue with "which rule produced this number".
- Document 27, "B2 Numeric": no model arithmetic. https://www.numeric.io/product/ai-in-numeric
- Document 27, "B5 Lorikeet": sensitive steps as code the agent can call but not change. https://www.lorikeetcx.ai/product/how-it-works

**Left out, and why.** Credit-card surcharging and interchange optimisation (HighRadius; needs payment licences, document 23). Automatic write-offs.

**Open questions.** Whether Malaysian law limits late-payment interest on B2B invoices (not in the documents). Whether fees should post back to the ledger in version one (document 26 says financial postings come later).

### 6. Decision tables (from the automation vendors)

> Source: [general-references/35-map-market-and-competitors.md § 6. Decision tables (from the automation vendors)](../../general-references/35-map-market-and-competitors.md#6-decision-tables-from-the-automation-vendors)

**Purpose.** Hold "which action, on which channel, when" as an editable table finance staff can read and approve, so the model only chooses wording and handles replies. Example: row "days overdue 10 to 16, amount under RM 50,000, segment standard, no dispute → reminder 2 by email, auto-send allowed".

**Design to implement.**
- Table `decision_table` (versioned with the policy) and `decision_row`: `table_id`, `row_no` (priority order), conditions (`days_overdue_min`, `days_overdue_max`, `amount_min`, `amount_max`, `segment`, `dispute_status`, `has_open_promise`, `channel_consent`), outputs (`action_type`, `channel`, `template_id`, `autonomy` from section 7, `escalate_to_role`).
- Hit policy: **first match by `row_no`** (simple DMN "first" semantics) [Inference: DMN hit policies are not described in the documents; "first" is the simplest to explain]. No match → `needs_review`.
- Evaluation is pure code over the governed model's named conditions (Celonis filters as "business conditions": for example `eligible_for_reminder`).
- Validation at publish: overlapping rows flagged; gaps flagged; every output action must exist in the action registry.
- The agent receives the matched row id and its outputs as constraints; it may not choose a different action or channel.
- Next-best-action ranking (rules filter eligibility, a model ranks) is version two, once the event log holds enough outcomes (Pega CDH; document 26 "later").

**Copies.**
- Document 26, "Adopt in version one, later, or never": decision tables for dunning policy (days overdue × amount × segment × dispute status → action and channel), version one, as simple editable tables, not full DMN.
- Document 26, "UiPath Maestro": DMN business rules on the orchestration engine. https://docs.uipath.com/maestro/automation-cloud/latest/user-guide/key-concepts-and-definitions
- Document 26, "What these companies know" item 1: rules outside the prompt (Maestro, Camunda, Pega, Celonis). https://docs.camunda.io/docs/8.8/components/agentic-orchestration/ai-agents
- Document 26, "Celonis, Where customer rules live": filters as named business conditions; triggers on newly matching items. https://docs.celonis.com/en/knowledge-models
- Document 23, "Key findings" item 3: sequence logic, escalation steps and thresholds remain configured rules almost everywhere.

**Left out, and why.** Full DMN with FEEL expressions; Pega's rule language (document 26: "Never").

**Open questions.** Whether segments are customer-defined free text or a fixed list. How decision tables and prose policy clauses are shown together so the finance head sees one policy.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **GoRules Zen, MIT (code):** [`gorules/zen` → `core/types/src/decision/mod.rs`](https://github.com/gorules/zen/blob/62cd159/core/types/src/decision/mod.rs) — `DecisionNodeKind` = InputNode, OutputNode, FunctionNode, DecisionNode, DecisionTableNode, ExpressionNode, SwitchNode, CustomNode. Use `@gorules/zen-engine` when business users must edit decision tables and you need a trace of which row fired.
- **json-rules-engine 7.3.2, ISC** ([`CacheControl/json-rules-engine`](https://github.com/CacheControl/json-rules-engine/tree/e1f1fda)) — last commit 16 Feb 2026, so treat as low-activity.
- **Default (no engine):** encode preconditions as Palantir's 9-variant condition IR — see [03-ontology-engine/object-type-registry](../03-ontology-engine/object-type-registry.md#implementation-starting-points-from-source-code).

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **Confirmed (code)** — Zen node kinds unchanged; json-rules-engine 7.3.2 unchanged since 16 Feb 2026.

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
