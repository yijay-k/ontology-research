# Audit log

**Layer:** [11-observability](README.md) · **What it is:** What gets audited, in which categories, and how audit logs are kept.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Palantir

### 15. Audit logs

> Source: [general-references/04-palantir-security.md § 15. Audit logs](../../general-references/04-palantir-security.md#15-audit-logs)

**Plain English.** Every meaningful act (login, search, data load, export, permission change, LLM prompt) is written as a typed event that a security team can query.

**Technical detail.**
- **audit.3** is the current schema. Each event has at least one enforced category, plus top-level `product`, `categories`, `entities`, `users`, `requestFields` (what the caller provided) and `resultFields` (what was returned). Only `uid` is populated in the user fields, so enrichment must happen downstream. audit.2 is legacy. [Fact] https://www.palantir.com/docs/foundry/security/audit-logs-overview/ . Also referenced: `time`, `result` (for example FAILURE). [Fact] https://www.palantir.com/docs/foundry/security/monitor-audit-logs/
- **Categories**, grouped:
  - Data: create, delete, export, import, load, merge, search, share, transform.
  - Ontology: data load, transform and search; logic and metadata create, read, update, delete.
  - Management: permissions, groups, users, markings, tokens.
  - Auth: authorizationCheck (succeeded and failed targets), authenticationCheck, userLogin, userLogout, userJustify.
  - Tokens: generation, access, revoke.
  - Secrets: create, load, use.
  - Requests: create, approve, execute.
  - Context: `onBehalfOf` (service users), `inApplicationContext` (third-party app RID).
  - LLM: `llmInference` (inputs and responses), `llmRoute`.
  - `auditDataRedact` for spill remediation.
  
  [Fact] https://www.palantir.com/docs/foundry/security/audit-log-categories/
- **Delivery:** the `list-log-files` and `get-log-file-content` APIs, with an always-returned `nextPageToken` for gap-free polling (preferred for SIEM), or a per-Organization export to a dataset. Latency is about 15 minutes (audit.2 could take more than 24 hours). Export datasets support retention up to 730 days and carry the Organization's Marking by default. Access needs the `audit-export:orchestrate-v3` operation, or an Organization role plus the `api:audit-read` scope. There was a schema-cutover gap around 24–25 November 2025; full audit.3 is recommended for analyses after 4 December 2025. [Fact] https://www.palantir.com/docs/foundry/security/audit-logs-overview/
- **Audit Explorer (beta)** searches audit.3, and each search is itself audited. [Fact] https://www.palantir.com/docs/foundry/security/data-protection-and-governance/
- **Documented detection recipes:** more than 5 failed authenticationChecks per uid, dataLoad followed by dataExport, unusual tokenGeneration, and abnormal session length. [Fact] https://www.palantir.com/docs/foundry/security/monitor-audit-logs/

## Design decisions already in the reference maps

### 19. Audit categories

> Source: [general-references/30-map-palantir-platform.md § 19. Audit categories](../../general-references/30-map-palantir-platform.md#19-audit-categories)

**Purpose.** Every meaningful act (login, read, export, permission change, action, LLM call) is a typed event that a customer's security team can query and export. *Receivables example:* an auditor asks who exported the aged-debtors list last quarter and which agent sent final notices. Both answers come from category-filtered queries.

**Design to implement.**
- **Event shape (audit.3)** [Fact 04]: `{time, uid, product, categories[], entities[], users[], requestFields{}, resultFields{}, result}`. Every event has at least one category, and each category defines what goes in `requestFields` and `resultFields`. Only `uid` is populated for users, and enrichment happens downstream [Fact 04]. **Add** `tenant_id`, `trace_id`, `session_id`, `app_id`, `ip` [Inference; Palantir's fields beyond the listed ones are Unverified 04].
- **Categories to implement in version 1** [Fact 04 for the names]:
  - data: `dataLoad`, `dataSearch`, `dataExport`, `dataCreate`, `dataDelete`;
  - model: `ontologyDataLoad`, `ontologyMetadataUpdate`;
  - management: `managementPermissions`, `managementGroups`, `managementMarkings`, `managementTokens`;
  - auth: `authorizationCheck` (succeeded and failed targets), `authenticationCheck`, `userLogin`, `userLogout`;
  - tokens: generation, revoke;
  - secrets: use;
  - requests: create, approve, execute;
  - context: `onBehalfOf`, `inApplicationContext`;
  - LLM: `llmInference` (inputs and responses), `llmRoute`;
  - spill remediation: `auditDataRedact`.
  - `userJustify` comes with checkpoints in version 2.
- **Storage** [Inference]: an append-only `audit_event` table partitioned by month. Writes are revoked for every role except the audit writer. Events are written in the same transaction as the act where possible (actions, permission changes) and asynchronously otherwise (reads, LLM calls).
- **Delivery** [Fact 04]: a cursor-paged API whose next-page token is always returned, for gap-free SIEM polling. A per-tenant export with retention of up to 730 days, carrying the tenant's marking by default. Palantir's events arrive in about 15 minutes. Access needs an audit role plus an `api:audit-read`-style scope.
- **Searching the audit log is itself audited** [Fact 04].
- **Detection recipes** to ship as default monitors [Fact 04]: more than 5 failed authentication checks per user, a data load followed by an export, unusual token generation, abnormal session length.
- **Operational observability is a separate store** [Fact 03, 05]: execution history, P95 metrics, and traces with LLM prompt, response and tokens per span, keyed by the "source executor" (the first executable in the call chain). Users see their own executions for 24 hours. Seeing others' needs edit rights on the source executor, log access enabled, and all markings applied to the logs. Palantir's pages disagree on execution-history retention (7 vs 30 days) [Fact 03]. **Choose 30 days** [Inference].
- **Monitors** [Fact 01, 05]: rules on actions, functions, automations and agents, with Low, Medium and High thresholds, AND-composite rules, snooze, and email, Slack or webhook delivery.
- **Per-object agent timeline** [Fact 03]: who (human or agent) changed each business object, with tokens, runtime and **time spent waiting for humans**. Built from the action log plus tool calls [Inference].
- **Checkpoints** (version 2) [Fact 04]: justification prompts (acknowledge, free text with regex, dropdown, re-authentication) on exports, bulk reads, role grants and token creation. Each submission is an immutable record with a frozen copy of the prompt text. Palantir's checkpoints do not fire on API, SDK or async action submissions [Fact 04]. **Ours must also fire for agent exports** [Inference].

**Copies.**
- Document 04, §15 "Audit logs": schema, categories, delivery, latency, retention, detection recipes. https://www.palantir.com/docs/foundry/security/audit-logs-overview/ , https://www.palantir.com/docs/foundry/security/audit-log-categories/ , https://www.palantir.com/docs/foundry/security/monitor-audit-logs/
- Document 03, §15 and document 05, B7: observability, traces, source executor, log permissions. https://www.palantir.com/docs/foundry/aip-observability/trace-view/ , https://palantir.com/docs/foundry/observability/overview/ , https://www.palantir.com/docs/foundry/aip-observability/log-permissioning/
- Document 01, §15 and document 05, B7: monitoring views. https://palantir.com/docs/foundry/monitoring-views/overview/
- Document 04, §13: checkpoints. https://www.palantir.com/docs/foundry/checkpoints/configure-checkpoints/ , https://www.palantir.com/docs/foundry/checkpoints/core-concepts/

**Left out, and why.**
- An audit explorer UI: version 2. The API comes first.
- Lineage-aware deletion (Data Lifetime): version 2, though it is needed for privacy deletion requests [04].

**Open questions.**
- The full audit.3 field list is [Unverified 04].
- How long must Malaysian customers keep audit and action logs? Not covered in these documents.

---

## Fact-check notes

_No time-sensitive claims in this component were re-checked in the 28 Nov 2026 pass; its sources are dated 21–27 Nov 2026. See the linked references for their own open questions._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
