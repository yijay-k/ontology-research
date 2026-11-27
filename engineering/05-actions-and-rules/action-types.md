# Action types

**Layer:** [05-actions-and-rules](README.md) · **What it is:** The only way state changes: typed, permissioned action definitions with parameters, rules and side effects.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Open-source implementations](#open-source-implementations) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (2)

## Palantir

### 7. Action types in detail

> Source: [general-references/02-palantir-ontology.md § 7. Action types in detail](../../general-references/02-palantir-ontology.md#7-action-types-in-detail)

Plain English: an action type is a form plus a transaction. "Assign Employee" takes an employee and a role, checks the submitter is in HR, updates two objects, adds a link, and emails the new manager.

Technical detail:
- **Anatomy (from code).** `apiName`, `displayName`, `description`, `icon`, `parameters`, `parameterOrdering`, `rules`, `sections`, `formContentOrdering`, `validation` (submission criteria), `isolationSettings` (isolation mode + retry settings), `entities`, `status`, `typeClasses`, display layout, `submissionMetadata` (button text, success message, undo button toggle), `permission`. [Fact] `osdk-ts/packages/maker/src/api/action/ActionType.ts`, `SubmissionMetadata.ts`. The internal level validation also carries `readAuthorization` and `writeAuthorization`. [Fact] `ActionTypeLevelValidation` in OMS `__components.ts`
- **Parameters.** Types include boolean, integer, long, double, decimal, string, timestamp, date, geohash, geoshape, attachment, marking, media reference, time series reference, geotime series reference, object reference, object set, interface reference, struct, object type reference, each with a list variant where applicable. [Fact] `maker/src/api/action/ActionParameterType.ts`. Allowed-value constraints: one-of (with or without "other values allowed"), range, text (min/max length, regex), datetime range, object query (dropdown filtered by an object set), user (optionally from groups), multipass group, and others. [Fact] `ActionParameterAllowedValues.ts`; validation responses echo constraint kinds `arraySize`, `groupMember`, `objectPropertyValue`, `objectQueryResult`, `oneOf`, `range`, `stringLength`, `stringRegexMatch`. [Fact] `osdk-ts/packages/api/src/actions/ActionResults.ts`. Each parameter can be visible or hidden, editable or fixed, use a value type, be pre-filled by the host app, read an object's current property value, and override later parameters' configuration. [Fact] https://www.palantir.com/docs/foundry/action-types/parameter-overview/ . Conditional overrides exist for parameters and sections. [Fact] `ActionParameterConditionalOverride.ts`, `SectionConditionalOverride.ts` (contents not read in detail).
- **Rules.** Ontology rules: create object (primary key required), modify object(s), create-or-modify, delete object(s), create link(s), delete link (many-to-many only; foreign-key links use modify), function rule (if present, no other rules allowed), and five interface rules. Other rules: notification, webhook, schedule (trigger a build, edits applied after build starts). Each property value comes from a parameter, a property of an object parameter, a static value, or current user/time; the time is fixed at execution start. Rules compile into one edit per object, so order matters and later rules override earlier ones; you cannot modify or delete an object created in the same action, or create the same object twice. [Fact] https://www.palantir.com/docs/foundry/action-types/rules/ . Code adds value sources `uniqueIdentifier`, `synchronousWebhookOutput` (use the writeback webhook's response), `scheduleRunRid`, and a `scenarioRule`. [Fact] `OntologyIrLogicRuleValue` and `OntologyIrLogicRule` unions in OMS `__components.ts`
- **Submission criteria** (formerly validations). Conditions compare a left value (current user ID, group IDs including inherited, user attributes; a parameter or a property of an object parameter, or a list length; execution context = "in a scenario or not") to a parameter, static value or "no value". Operators: is, is not, matches, less than, greater than or equals; for lists: includes, includes any, is included in, each is, each is not. Logical nodes require all, any or none of children and nest. Each root-level node has its own failure message, shown in every app. Evaluated at submission with the state at that moment; object set and attachment parameters cannot be used. Palantir warns against `NOT` conditions on group, marking or organisation membership because scoped tokens may lack the attribute and the `NOT` then passes. [Fact] https://www.palantir.com/docs/foundry/action-types/submission-criteria/
- **Validation API.** Apply with `mode: VALIDATE_ONLY` (REST) or `$validateOnly: true` (OSDK) returns per-criterion and per-parameter VALID/INVALID with evaluated constraints and configured failure messages. [Fact] `models.py` `ApplyActionMode`; `ActionResults.ts` `ValidateActionResponseV2`
- **Side effects.** Notifications: recipients static, from a parameter, from an object property holding user or group IDs, or from a function; content from a template (subject ≤ 250 chars, body ≤ 1,000, custom email HTML ≤ 51,200) or a function returning a `Notification`; data rendered reflects the state before the edits; up to 500 recipients (50 if function-rendered); by default every recipient must be able to see the rendered data or the action fails, with an option to notify only permitted recipients; no direct email addresses; email redaction settings may replace content. [Fact] https://www.palantir.com/docs/foundry/action-types/notifications/ . Webhooks: see finding 4; inputs mapped from parameters, static values or object properties, or produced by a function; a function can return a list of payloads to fire a side-effect webhook many times; only writeback webhooks have outputs usable by later rules; OAuth 2.0 token handling done by the platform for REST sources with an outbound application. [Fact] https://www.palantir.com/docs/foundry/action-types/webhooks/ . Side effects run only if submission criteria pass; failed notifications do not block edits; configuring webhooks needs extra Data Connection permissions. [Fact] https://www.palantir.com/docs/foundry/action-types/permissions/
- **Function-backed actions.** For edits too complex for rules (close an incident and all its alerts; compute a value from several objects; create several linked objects). [Fact] https://www.palantir.com/docs/foundry/action-types/function-actions-overview/ . **Batched execution**: the function takes one parameter that is a list of structs, so a batch of N action calls becomes one function execution instead of N sequential executions. [Fact] https://www.palantir.com/docs/foundry/action-types/function-actions-batched-execution/
- **Consistency.** Atomic commit of Ontology edits (not side effects); consistency = value type constraints and required properties enforced; write modes "batched" (reads never see own uncommitted edits) or "staged" (reads, searches and aggregations see own edits; TS v2, Python, AIP Logic only; legacy isolation only). Isolation levels: legacy, snapshot (default for new batched actions; one point-in-time view; fails if a written object changed; does not catch write skew, so route invariants through a shared object), read committed (last committer wins per property). Parameters with defaults count as writes. Retries: up to 5 attempts on transient errors, by default only for actions without external calls (webhooks, Data Connection, OSDK calls from functions, calls to other functions/actions); configurable per action type. [Fact] https://www.palantir.com/docs/foundry/action-types/consistency-guarantees/ . Version checks: OSv2 checks only versions of objects used to generate edits against edited objects, fewer `StaleObject` conflicts, weaker guarantees. [Fact] https://www.palantir.com/docs/foundry/object-edits/how-edits-applied/
- **Undo / revert.** Only the submitting user, only from the success toast, only if the action is still the most recent edit to every affected object, only on OSv2, and only if "Allow revert" was on at submission (default on for actions created after May 2024 that touch only OSv2 types). Side effects are not undone. [Fact] https://www.palantir.com/docs/foundry/action-types/action-reverts/
- **Batch apply.** REST `applyBatch` accepts up to 20 actions per call, higher for OSv2-only actions without functions; notifications are not supported on that endpoint; parameter default values are not applied by the apply endpoint. [Fact] `foundry_sdk/v2/ontologies/action.py` docstrings. Docs: up to 10,000 calls in one batch, 20 for non-batched function-backed actions, edits in a batch count as one group against limits. [Fact] https://www.palantir.com/docs/foundry/action-types/scale-property-limits/ . The two sources state different headline batch numbers; the docs page is per-application ("additional limits may apply, depending on the calling application") and the API docstring is for the REST endpoint. [Inference]
- **Return edits.** `returnEdits: ALL | ALL_V2_WITH_DELETIONS | NONE` (default none). Response lists added, modified, deleted objects and added and deleted links, or `largeScaleEdits` with no detail. [Fact] `models.py` `ReturnEditsMode`; `ActionResults.ts`. Overrides allow fixing `uniqueIdentifierLinkIdValues` and `actionExecutionTime`. [Fact] `models.py` `ApplyActionOverrides`. Apply accepts `branch` and `scenarioRid`. [Fact] `action.py`. OSv2 edits are visible immediately after the action completes; OSv1 edits were eventually consistent. [Fact] `action.py` docstring
- **Limits:** 50 object types, 10,000 objects per action, 3 MB per object edit (OSv2; 32 KB OSv1), 10,000 elements in a primitive list parameter, 1,000 in an object reference list, 1,000 for lists used in submission criteria. [Fact] https://www.palantir.com/docs/foundry/action-types/scale-property-limits/

### 11. Action permissions and submission criteria

> Source: [general-references/04-palantir-security.md § 11. Action permissions and submission criteria](../../general-references/04-palantir-security.md#11-action-permissions-and-submission-criteria)

**Plain English.** An Action is a named, validated write, such as "Approve refund". Even if you can see the refund object, the action can require "user is in group Finance-Approvers AND amount < 10,000". If you fail, you get the action's own explanation.

**Technical detail.**
- **Who can apply:** a user who can view the edited object and link types (and their datasources, where relevant) and who passes the submission criteria. If the type allows edits "only via actions" (the default for new types), Read on the edited objects is enough, so users can create objects they cannot later view. Allowing other edit paths requires Edit on the writeback datasets, which exposes all writeback data, so the docs discourage it. If the type is backed by a restricted view, its edit policy must pass. [Fact] https://palantir.com/docs/foundry/action-types/permissions/
- **Submission criteria** (formerly "validations"):
  - Condition templates are Current user (ID, groups direct or inherited, Multipass attributes such as Organization), Parameter (including properties of object parameters), and Execution context (whether inside an Ontology Scenario).
  - Single-value operators: is, is not, matches, <, ≥. Multi-value operators: includes, includes any, is included in, each is, each is not.
  - Conditions nest under all, any and none.
  - Each root-level condition has a failure message, shown in Object Explorer, Workshop and Quiver.
  - Attachment and object-set parameters are not supported. There is a test run in Ontology Manager.
  
  [Fact] https://palantir.com/docs/foundry/action-types/submission-criteria/
- **Read and write authorizations:** a read authorization is an upper bound on the Markings an action may read. A write authorization is a minimum security level the resulting data must meet, and the action is blocked if it would fall below it. If write is less strict than read, the action declassifies. Foundry checks the configurer's right to declassify each severed Marking when the action type is saved or published, not at runtime. Without a read authorization these checks do not run, and the docs warn of a possible "data spill". [Fact] https://palantir.com/docs/foundry/action-types/read-write-authorizations/
- **Side effects:** webhooks need extra Data Connection permissions. Side effects do not fire if criteria fail. Notification recipients who cannot see the data are skipped. An action log requires the submitter to have permissions on the log type. [Fact] https://palantir.com/docs/foundry/action-types/permissions/

## Open-source implementations

### Action execution surface

> Source: [open-source-references/palantir-osdk.md](../../open-source-references/palantir-osdk.md) (repository audit)

`packages/client/src/actions/applyAction.ts` maps compile-time typed parameters to the server API. It passes branch/scenario context and can request returned edits. The current action API supports a `VALIDATE_ONLY` mode when `$validateOnly` is set and `VALIDATE_AND_EXECUTE` otherwise. An invalid validation result becomes an `ActionValidationError`. The SDK can request edit details, including V2 edit results with deletions.

## Design decisions already in the reference maps

### 8. Action types

> Source: [general-references/30-map-palantir-platform.md § 8. Action types](../../general-references/30-map-palantir-platform.md#8-action-types)

**Purpose.** The only write path for staff and agents: named business operations that validate, commit atomically, trigger side effects and log themselves. *Receivables examples:* `RecordPaymentPromise(invoice, promisedDate, amount)`, `SendDunningEmail(invoice, templateId)`, `WriteOffInvoice(invoice, reason)` (only for amounts at or below RM 5,000 and only for group AR-Managers).

**Design to implement.**

**8.1 Definition fields** [Fact 02]: `apiName`, `displayName`, `description`, `agentDescription` (Palantir's "agent tool description" [Fact 02, 03]), `parameters`, `parameterOrdering`, `rules`, `sections`, `submissionCriteria`, `isolation` (mode and retry settings), `sideEffects`, `status`, `submissionMetadata` (button text, success message, undo toggle), `permission`, `logEnabled`. Add `autoApplyPolicy` (`stage`|`auto`) and `toolMode` (`confirm`|`auto`) [Inference from Fact 03 staged writes and chatbot confirm].

**8.2 Parameters** [Fact 02]:
- Types: boolean, integer, long, double, decimal, string, timestamp, date, attachment, marking, object reference, object set, interface reference, struct, each with a list variant.
- Allowed values: one-of (optionally allowing other values), range, text length and regex, datetime range, object query (a dropdown filtered by an object set), user (optionally from groups).
- Each parameter can be visible or hidden, editable or fixed, prefilled by the host app, read an object's current value, and override later parameters.
- Limits: 10,000 elements in a primitive list, 1,000 in an object-reference list, 1,000 in lists used in criteria.

**8.3 Rules (edit compilation)** [Fact 02]:
- Rule kinds: create object (primary key required), modify, create-or-modify, delete, create link, delete link (N:M only), function rule (exclusive with all other rules), plus notification and webhook.
- Value sources: parameter, property of an object parameter, static value, current user, current time (fixed at execution start), unique identifier, writeback-webhook output.
- **Rules compile into one edit per object, and later rules override earlier ones.** An action cannot modify or delete an object it created, and cannot create the same object twice.
- Parameters with defaults count as writes [Fact 02].

**8.4 Submission criteria** [Fact 02, 04]:
- A boolean tree of all/any/none nodes over:
  - the current user (ID, groups including inherited, attributes);
  - parameters and properties of object parameters, including list length;
  - execution context (inside a scenario or not).
- Operators: is, is not, matches, <, ≥; for lists, includes, includes any, is included in, each is, each is not.
- **Each root-level node has its own failure message**, and the agent receives it verbatim so it can explain or escalate [02 and 04 "What to copy"].
- Criteria are evaluated at submission against the state at that moment. Object-set and attachment parameters cannot be used in them [Fact 02].
- Reject `NOT` on membership when the criteria are saved [Fact 02, 04].
- **Evaluate on the server for every caller (UI, API, agent, automation).** Palantir does not state this for API submissions [Unverified 04], but it is required [Inference].

**8.5 Who may apply** [Fact 02, 04]:
- The submitter needs view on the edited types and must pass the criteria.
- Types are "editable only via actions" by default, which means Read on the edited objects is enough. Users can therefore create objects they cannot later view.
- Read-time policies filter what an action reads but not what it writes.
- Read and write marking authorizations (a read ceiling, a write floor, and a declassification check at save) are version 2 [Fact 04].

**8.6 Atomicity and isolation** [Fact 02]:
- All model edits in one action commit together. Side effects are outside that boundary.
- Default isolation is snapshot, with object-level conflict detection: the action fails if a written object changed. Snapshot does not catch write skew, so **route invariants through a shared object**. *Example:* a `Customer.creditHoldVersion` that every hold-related action writes [Inference on the example].
- Read committed (last committer wins per property) is optional.
- **Postgres** [Inference]: one `REPEATABLE READ` transaction per action, with a `version` column per object checked on write. That gives the same object-level conflict detection.

**8.7 Retries** [Fact 02]: up to 5 attempts on transient errors, by default **only for actions without external calls** (webhooks, external fetches, nested actions). This is configurable per action type.

**8.8 Dry run** [Fact 02]: every apply endpoint accepts `mode: VALIDATE_ONLY` and returns VALID or INVALID for each criterion and each parameter, with the evaluated constraints and the configured messages. Agents always validate first, show the person, then apply [02 "What to copy" 10].

**8.9 Staging and proposals** [Fact 03]:
- With staged writes, edits go to temporary storage that later reads in the same run can see, and they are applied when execution completes.
- An automation can turn the staged action into a **proposal**, shown with why it was created, a preview and the agent's decision log. Accepting it runs the action.
- Palantir recommends staging consequential or ambiguous actions, and auto-applying only when "purpose, impact, and recovery path justify it".
- **Proposal table** [Inference on shape]: `action_proposal(id, tenant_id, action_type, action_type_version, parameters jsonb, validation_result jsonb, preview_edits jsonb, proposer_principal_id, agent_session_id, decision_log jsonb, status open|accepted|rejected|expired|stale, reviewer_id, decided_at, created_at)`.
- **Departure from Palantir:** open proposals are visible to the reviewer queue, not "only to the automation creator for 24 hours" (03 lists that as a limit to avoid) [Inference].
- On accept, re-run the criteria and the conflict check. If an affected object changed after the preview, mark the proposal `stale` [Inference].

**8.10 Approval** [Fact 03, 04]:
- An action tool is either `auto` or `confirm` (confirm means the user confirms before it runs). The default is confirm for anything that reaches a customer [04 "What to copy" 15].
- Approval tiers from AI FDE: reads auto-approve, edits auto-approve on branches but need approval on protected main, and actions, publishing and anything external always ask. Pre-approval can be granted for a session, scoped to a project [Fact 03].
- Multi-reviewer approval uses the request → tasks → reviewers engine from section 20 [Fact 04].

**8.11 Side-effect ordering** [Fact 02]:
1. Evaluate the criteria. If they fail, no side effect runs.
2. Optionally run **one writeback webhook** *before* the edits. It blocks: if it fails, there are no edits. Its response can feed later rules.
3. Commit the edits atomically.
4. Run **side-effect webhooks** after the commit, best-effort and unordered, with failures hidden from the user.
5. Send **notifications.** They render the *pre-edit* state. Every recipient must be able to see the rendered data, or the action fails, unless the setting "notify only permitted recipients" is on. There are at most 500 recipients (50 when a function renders the content), a subject of at most 250 characters and a body of at most 1,000. Notifications never go to raw email addresses.

Palantir states that the external call can succeed while the commit then fails [Fact 02]. **For customer messaging** (dunning emails, WhatsApp), do not copy best-effort delivery [Inference]. Commit the edit and an `outbox` row in the same transaction, then deliver with an idempotency key, record delivery status back through a system action, and retry with backoff. This is a deliberate departure (see Contradictions).

Webhook limits copied from Data Connection [Fact 01]: typed inputs, a templated body, a 20 s default timeout (180 s maximum), concurrency and rate limits, and a response history visible only to the caller and kept 6 months.

**8.12 Action log schema** [Fact 02]. Each *successful* submission writes a log object linked to every edited object:
- `action_rid`, `action_type_rid`, `action_type_version` (auto-increment);
- `timestamp` (the commit timestamp), `user`, edited object primary keys;
- webhook IDs (sync and async), notification IDs and recipients;
- `scenario_rid`, `revert_status`, `revert_user`, `revert_time`;
- optionally, parameter values, properties of single-valued object parameters, and extra properties of edited objects for later aggregation;
- a human-readable summary of at most 20 parts, with literal parts of at most 50 characters.

Failures go to action metrics, not the log [Fact 02]. The log is forward-only, with no backfill. An object type can require that every action on it is logged [Fact 02].

**Additions** [Inference, as 02 suggests]: `actor_kind human|agent|automation`, `agent_app_id`, `agent_session_id`, `model_id`, `prompt_version`, `trace_id`, `on_behalf_of_principal_id`, `proposal_id`. For receivables, require logs on `Invoice`, `Customer` and `Dispute` [Inference].

**8.13 Revert** [Fact 02]: only the submitting user, only while the action is still the most recent edit to every affected object, and only if "allow revert" was on at submission. Side effects are never undone. Copy these conditions. Offer revert from the action-log view as well as the success toast [Inference]. Anything that already reached a customer needs a compensating action, such as "Send correction" [Inference].

**8.14 Limits** [Fact 02]: 50 object types and 10,000 objects per action, and 3 MB per object edit. For batches, the docs say 10,000 calls (20 for function-backed actions without batched execution), while the REST docstring says 20 per call. **Version 1 uses 1,000 per batch call** [Inference]. Batched execution passes a list of structs to one function call [Fact 02].

**Failure behaviour.**
- Criteria fail: return each node's message, no edits, no side effects.
- Conflict: return a typed `StaleObject` error; the caller re-reads and re-validates.
- Writeback webhook fails: no edits.
- Outbox delivery fails: the edit stands, the delivery retries, and after N attempts an `Alert` object is created [Inference].

**Copies.**
- Document 02, §7 "Action types in detail": anatomy, parameters, rules, criteria, validation API, side effects, consistency, revert, batch, limits. https://www.palantir.com/docs/foundry/action-types/rules/ , https://www.palantir.com/docs/foundry/action-types/submission-criteria/ , https://www.palantir.com/docs/foundry/action-types/consistency-guarantees/ , https://www.palantir.com/docs/foundry/action-types/webhooks/ , https://www.palantir.com/docs/foundry/action-types/notifications/ , https://www.palantir.com/docs/foundry/action-types/action-reverts/ , https://www.palantir.com/docs/foundry/action-types/scale-property-limits/
- Document 02, §10: action log schema. https://www.palantir.com/docs/foundry/action-types/action-log/
- Document 02, §8 and document 04, §11: permissions to apply. https://palantir.com/docs/foundry/action-types/permissions/
- Document 03, §§8 and 14: staged writes and Automate proposals. https://www.palantir.com/docs/foundry/logic/staged-writes/ , https://www.palantir.com/docs/foundry/logic/aip-logic-integration-automate/
- Document 03, §17: approval tiers. https://www.palantir.com/docs/foundry/ai-fde/security-and-governance/
- Document 01, §4: webhook limits and history. https://palantir.com/docs/foundry/data-connection/webhooks-reference/
- Document 05, A1: the action form is generated from the definition, and submit appears only when the criteria pass. https://www.palantir.com/docs/foundry/workshop/actions-use/

**Left out, and why.**
- Read and write marking authorizations: version 2.
- Schedule rules (an action triggers a build): version 2.
- Interface action rules: version 2.
- Legacy isolation mode.

**Open questions.**
- Are webhook calls inside Palantir actions rolled back when the action fails? [Unverified 01]. The outbox design sidesteps the question.
- How long are action logs retained? [Unverified 02]

---

### 12. Allowed actions as runbooks with risk level and allowed tools (UModel RunbookSet)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 12. Allowed actions as runbooks with risk level and allowed tools (UModel RunbookSet)](../../general-references/31-map-lingyang-alibaba-offers.md#12-allowed-actions-as-runbooks-with-risk-level-and-allowed-tools-umodel-runbookset)

**Purpose.** Every write and every outbound message is a typed action bound to an object type, with a risk level, an approval rule and a list of tools it may use. Receivables example: `send_reminder` on Invoice is medium risk, needs approval until its template has earned auto-send, and may use only the email-send tool; `propose_payment_plan` is high risk and always needs approval.

**Design to implement.**
- RunbookSet fields to copy [Fact, 08 §7]: `actions`, `action_type`, `risk_level`, `confirmation_required`, `allowed_tools`, `inputs`/`outputs`, `observations`, `conclusions`, `knowledge`, `toolkits`, `skills`. RunbookSet is marked experimental [Fact, 08 §7].
- Defaults: read tools on; write tools off or needing explicit authorisation [Fact, 08 KF 5].
- Binding: runbooks link to entity types through `runbook_link` [Fact for the link kind, 08 §7].
- Version-1 action list, from 25 row 8: send reminder, log promise, record dispute, pause dunning, escalate, propose payment plan, mark paid, write note back to the accounting system. Each with parameters, permission and preconditions [Fact as a list, 25].
- Risk levels [Inference, since Lingyang's four grades are not public, 07 KF 12]: `read`, `draft` (generate only), `internal_write` (change product-owned objects), `external` (anything that leaves the building or writes to the accounting system). This mirrors 07's inferred action kinds (read/query, generate, write back, reach out), which line up with the founder's notes but are not published by Lingyang [Inference, 07 §3].
- Approval policy, from 25 row 9: everything sent externally is approved until a template earns auto-send; payment plans and write-offs always approved. AgentOne's stated policy: standard actions under rules; funds and major decisions need human confirmation [CLAIM, 07 §3]; LatePost adds that high-risk actions go to the owner for approval [Press, 07 §3].
- Execution path [Fact for the pattern, 08 §6 SendGuard]: the agent drafts; the host executes after approval; at send time re-read the approved draft by id and compare its hash; pass an idempotency key; on a permission error revoke the grant and fall back to drafting.
- Preconditions read quality status: any strong-rule block on inputs refuses the action (section 6).
- Action log, from 25 row 10: every action and every approve or reject stored with user, agent, inputs, rule version and outcome. This log is the evaluation set (section 14).
- Per-caller tool narrowing [Fact, 08 §10]: Higress intersects a static `allowTools` with a per-request header set by the auth layer. Copy as: effective tools = runbook `allowed_tools` ∩ the agent role's tools ∩ the user's permissions [Inference; Palantir's equivalent is user ∩ app ∩ scope, 25 A2.6].
- Never expose a raw SQL execute tool. Higress's database-to-MCP server registers `execute` always and its "read-only" `query` passes raw SQL with no statement check [Fact from code, 08 KF 13, §10].
- RCA-style evidence rule, adapted from UModel's skill [Fact, 08 §7]: a conclusion counts only with a plausible mechanism, a path in the model and correctly timed data, and every conclusion is cited. [Inference] Apply to escalation proposals: "escalate because three reminders unanswered and promise missed on date X", each item linked.

**Copies.**
- 08, §7 Actions and RCA method. https://github.com/alibaba/UnifiedModel (`expanded_schemas/runbook_set.expanded.yaml`, `skills/umodel-rca/SKILL.md`) ; https://www.alibabacloud.com/blog/the-ai-agent-era-doesnt-need-more-data-%E2%80%94-it-needs-a-semantic-layer_603674
- 08, §6 SendGuard and grants. https://github.com/openTrinity/mycontext (`packages/persona/src/send-guard.ts`)
- 08, §10 Higress tool narrowing and the database-to-MCP warning. https://higress.cn/ai/en/mcp-server
- 07, §3 AI Operations safety statements. https://news.mydrivers.com/1/1139/1139921.htm ; https://finance.sina.cn/stock/jdts/2026-08-04/detail-inimekpf5165695.d.html
- 25, C6 rows 8, 9, 10.

**Left out, and why.** Voice calls (25 row 19: never in version 1).

**Open questions.** The rule by which a template "earns auto-send" (approval count, approval rate, time) has no source; it must be designed [Inference].

## Fact-check notes

_Checked 28 Nov 2026 against current vendor documentation and project pages. **Confirmed** = the research above still matches. **New** = not in the research above. **Changed** = the research above is now out of date._

- **Confirmed — per-submission limits:** 50 object types, 10,000 objects, 3 MB per object edit on OSv2; edits in a batched call count as one group. Source: https://www.palantir.com/docs/foundry/action-types/scale-property-limits
- **New — property types actions cannot edit.** Actions do not support editing float, byte, short or time-series properties, and do not support editing decimal properties because precision cannot be guaranteed through the JSON–Java conversion. Default selection limit for multi-value object reference parameters is 1,000. Sources: same page (English and translated versions).
- **New — function-backed actions edit far fewer objects in a batch.** A community answer, consistent with the limits page, notes that a function-backed action used for inline edits drops to 20 objects at a time unless batched execution is used. For very large edits, Palantir's community guidance is to record the intent with an action and execute it at scale with a transform. Sources: https://community.palantir.com/t/mass-upload-for-edit-only-columns-in-ontology-workshop/5776 , https://community.palantir.com/t/how-to-do-high-scale-actions/609
- **New — conflict error.** `Actions:ObjectVersionChanged` (HTTP 409) fires when the object type's backing datasource updates while the action runs. Source: https://www.palantir.com/docs/foundry/action-types/debug-conflict-errors/

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
