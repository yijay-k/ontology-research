# Data quality

**Layer:** [02-data-platform](README.md) · **What it is:** Health checks, expectations and strong/weak quality rules that block or flag bad data.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Palantir

### 15. Data Health: health checks, expectations, monitoring views

> Source: [general-references/01-palantir-data-layer.md § 15. Data Health: health checks, expectations, monitoring views](../../general-references/01-palantir-data-layer.md#15-data-health-health-checks-expectations-monitoring-views)

- **Health check types:** [Fact] https://palantir.com/docs/foundry/data-health/check-types/
  - Job status, schedule status, schedule duration.
  - Time Since Last Updated (TSLU), which counts empty transactions.
  - Data freshness: commit time vs. the maximum of a timestamp column.
  - Sync freshness.
  - Most checks run after the job completes, so they **cannot stop a build**.
- **Recommended placement:** [Fact] https://www.palantir.com/docs/foundry/maintaining-pipelines/recommended-health-checks
  - Schedule status and duration on every schedule.
  - A schema check on inputs that allows added columns.
  - An exact-match schema check plus TSLU on outputs. Example threshold: 26 h for a daily 1 h build.
  - Sync status plus sync freshness on synced data.
- **Expectations (build-time):** [Fact] https://www.palantir.com/docs/foundry/transforms-python/data-expectations-getting-started/
  - `Check(E.primary_key('id'), 'name', on_error='FAIL'|'WARN')`, attachable to inputs or outputs.
  - Composites via `E.all(...)`.
  - FAIL aborts the job.
- **Monitoring views:** [Fact] https://palantir.com/docs/foundry/monitoring-views/overview/
  - Rules over resources: datasets, streams, schedules, object types, link types, actions, functions, automations, agents and others.
  - Static or dynamic scope (folder, project, Workshop app, OSDK app).
  - Composite AND rules.
  - Low, Medium and High severities.
  - Channels: email, Foundry notifications, PagerDuty, Slack, webhooks.
  - Viewer permission is required on both the resource and the monitoring view.
- **Ontology-sync monitoring:** a "Sync Propagation Delay" rule alerts on Ontology index staleness. [Fact] https://palantir.com/docs/foundry/object-indexing/funnel-batch-pipelines/
- **2026 additions:**
  - Health checks now cover virtual and Iceberg tables (19 Mar 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-03
  - Project-scoped monitors for Ontology resources (17 Feb 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-02

## Design decisions already in the reference maps

### 6. Data-quality rules with two strengths (Dataphin strong and weak)

> Source: [general-references/31-map-lingyang-alibaba-offers.md § 6. Data-quality rules with two strengths (Dataphin strong and weak)](../../general-references/31-map-lingyang-alibaba-offers.md#6-data-quality-rules-with-two-strengths-dataphin-strong-and-weak)

**Purpose.** Give agents a machine-readable signal that data cannot be trusted right now. Receivables example: if the nightly sync from the accounting system is late, a strong rule fails and the collections agent stops sending reminders, so nobody is chased for an invoice they paid yesterday.

**Design to implement.**
- A failed **strong** rule raises an alert and blocks downstream task nodes; a failed **weak** rule only alerts [Fact, 07 §5].
- Coverage in Dataphin includes data-source connectivity and schema changes [Fact, 07 §5]. Copy both as built-in checks.
- Rule record [Inference]: `{rule_id, target (entity type, sync, or metric), check_type, expression, strength: strong|weak, owner, schedule, version}`.
- Version-1 strong checks, from 25 row 4: invoice totals reconcile, no negative balances, sync is fresh. Add schema change on the source and connector reachability, from Dataphin's coverage [Fact for categories, 07 §5].
- Blocking semantics [Inference, from 07 What to copy 9: "agents should also refuse to answer from blocked data"]:
  - each definition and action carries the set of rules guarding its inputs (derived from the dependency graph in section 5);
  - a strong failure sets `blocked=true` on every dependent metric and on every action whose preconditions read them;
  - questions touching a blocked metric return "data is blocked by rule X, failed at T", not a number;
  - outbound actions (send reminder) refuse; drafts can still be prepared and wait;
  - weak failures attach a warning to answers.
- Governance workbench with fix, ignore and notify [Fact, 07 §5]. "Ignore" on a strong rule needs a reason and an owner, logged [Inference].
- The same period functions are usable in quality rules [Fact, 07 §5], e.g. "no payment dated after `${bizdate}`".
- Alerts by email and one messaging channel [Inference; Dataphin data services alert by DingTalk, email, SMS or phone, Fact, 07 §5].

**Copies.**
- 07, §5 Governance modules, Quality. https://help.aliyun.com/zh/dataphin/fullmanaged/user-guide/asset-quality-overview
- 25, C6 row 4: the receivables strong checks and "agents stop sending reminders".

**Left out, and why.** Real-time versus offline comparison and the long list of external engines Dataphin monitors: not needed for one accounting source [Inference].

**Open questions.** Freshness threshold per connector (for example 26 hours for a nightly sync) has no source; set per tenant [Inference].

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
