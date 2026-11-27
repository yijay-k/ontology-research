# Branches proposals review

**Layer:** [10-change-control](README.md) · **What it is:** Branch, propose, review and merge for ontology, rules and agent configuration.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Design decisions already in the reference maps

### 20. Change control (branch, proposal, review)

> Source: [general-references/30-map-palantir-platform.md § 20. Change control (branch, proposal, review)](../../general-references/30-map-palantir-platform.md#20-change-control-branch-proposal-review)

**Purpose.** Changes to the model, actions, rules, metric definitions and agent configs go through branch → proposal → review → merge, whether a person or an AI drafted them. *Receivables example:* the AR manager wants a new `DunningStep` stage and an updated escalation rule. The founder's builder agent drafts both on a branch, the eval suite runs, the AR manager and the tenant admin approve, and the change merges.

**Design to implement.**
- **Scope in version 1: branch definitions only, never data** [Inference, following 03's "smaller version"]. Definitions are the registry IR, action types, rules, metric definitions, functions and agent configs. Palantir also never merges data; it merges code and rebuilds data [Fact 01].
- **Branch rules** [Fact 01, 02, 03]:
  - Branches are created only from main.
  - Selected resources are "protected", so changes to them must go through a branch.
  - Actions on a branch never write to main.
  - API names cannot change on a branch.
  - A branch rebases automatically until it contains changes; after that, rebasing is manual with a per-resource choice (main, branch, custom).
- **Proposal** [Fact 01, 02, 03]:
  - It needs passing checks: no conflicts with main, approvals in place, branch up to date, everything published and error-free.
  - It is split into **per-resource tasks**, and reviewers approve or reject each one.
  - **One rejection blocks the whole proposal.**
  - A "true conflict" means the same property was edited on both sides, and someone picks one.
  - **Add a check:** attached eval runs must pass for any agent-facing change [Inference].
- **Merge** [Inference]: apply the whole proposal in one Postgres transaction, producing a new `model_version`. Palantir notes that a partially failed merge cannot be reverted [Fact 01], and a single transaction rules that out.
- **Lifecycle** [Fact 01]: Active → Inactive after 35 days by default (branch-only test data deleted 7 days later) → Archived (manual, restorable) → Merged (terminal). Palantir warns that active branches cost more over time.
- **Approvals engine**, shared with access requests and action proposals [Fact 04]:
  - Request states: Pending approval, Changes requested, Action required, Completed, Closed, Rejected and Closed.
  - Task states: Review, Approved, Rejected (a rejection can be overridden while the request is open).
  - All tasks must be approved before the change applies.
  - Completed requests stay as a record.
  - Palantir does not notify members of groups with 50 or more people [Fact 04]. **Notify a named reviewer instead** [Inference].
- **AI-authored changes always arrive as proposals** [Fact 03, 05]: Pilot, AI FDE, Evolve, the builder MCP and bulk model swaps all go through Global Branching proposals. The builder agent's approval tiers come from section 8.10.
- **History and revert** [Fact 02, 05]: every save is a version with editor, time and description. Revert creates a new head version. A changelog panel shows JSON diffs between versions.
- **Status rules** from section 3 still apply: active resources cannot be deleted or renamed [Fact 02].
- **Approval policy language (version 2)** [Fact 05]: policy-bot-style rules, with predicates combined with and/or, a disapproval policy and a simulation API.

**Copies.**
- Document 01, §17 "Global Branching": proposals, checks, true conflicts, single-rejection block, lifecycle, partial-merge warning. https://www.palantir.com/docs/foundry/global-branching/core-concepts/
- Document 02, §13: ontology branching, protected resources, rebase, per-resource review. https://palantir.com/docs/foundry/ontologies/branching-ontology/
- Document 03, §8: Logic branching rules (API names frozen, merge preconditions). https://www.palantir.com/docs/foundry/logic/branching-logic/
- Document 04, §14: Approvals states. https://www.palantir.com/docs/foundry/approvals/overview/
- Document 05, A1 and A15: Workshop versions and diffs; Pilot's gate. https://www.palantir.com/docs/foundry/workshop/versions/ , https://palantir.com/docs/foundry/pilot/overview/
- Document 05, B3: policy-bot. https://github.com/palantir/policy-bot

**Left out, and why.**
- Branching datasets, pipelines and apps: too broad for a solo build [03].
- Indexing data on branches.

**Open questions.**
- Should customers be able to protect their own resources, or does the founder's template protect everything by default?

---

## New research (28 Nov 2026)

### Palantir Global Branching — current model
- An ontology proposal is "analogous to a Pull Request"; on global branches it is created automatically with the Global Branching proposal and carries reviews, name and description. Source: https://palantir.com/docs/foundry/ontologies/review-ontology-proposals/
- Ontology entities are separate resources in Global Branching but grouped under one ontology proposal; reviewers can be added from the branch taskbar, the proposal page or the ontology proposal page. Source: https://www.palantir.com/docs/foundry/ontologies/branching-ontology
- Legacy ontology branches are being sunset; with Global Branching enabled they can no longer be created. Source: https://palantir.com/docs/foundry/ontologies/ontology-branches-legacy/
- Rebase auto-resolves non-conflicting changes; proposals on protected branches need at least one approval; users with approval rights can approve without being listed as reviewers; merge history records per-resource errors; merge checks flag common blockers. Sources: https://www.palantir.com/docs/foundry/global-branching/core-concepts , https://palantir.com/docs/foundry/global-branching/branching-app , https://palantir.com/docs/foundry/ontologies/test-changes-in-ontology
- Branching spans apps (Code Repositories, Pipeline Builder, Ontology Manager, Workshop, Automate, object views); each branch belongs to one ontology; TypeScript v2 and Python functions branch with a local OSDK. Sources: https://palantir.com/docs/foundry/foundry-branching/branching-lifecycle-usage , https://www.palantir.com/docs/foundry/global-branching/integrations/
- If both a branch and main contain schema migrations on the same object type, rebase/merge will most likely fail — see [schema-evolution-and-branching](../03-ontology-engine/schema-evolution-and-branching.md#fact-check-notes).

### Open-source references
- OntoForge (MIT): schema branches as deep copies, name-aligned diffs, merge proposals; instance data not branched — [ontoforge](../../open-source-references/ontoforge.md).
- Dolt (Apache-2.0): Git-style `dolt_branch` / `dolt_merge` / `dolt_diff` procedures — [dolt](../../open-source-references/dolt.md).
- **Changed:** lakeFS is now Business Source License 1.1 (not Apache) at `817bbeb` — do not adopt as an open dependency.

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
