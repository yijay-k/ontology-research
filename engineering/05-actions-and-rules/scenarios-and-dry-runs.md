# Scenarios and dry runs

**Layer:** [05-actions-and-rules](README.md) · **What it is:** Trying a change against a copy of state before committing it.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (1) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Palantir

### A7. Vertex (graphs, cause and effect, simulation)

> Source: [general-references/05-palantir-apps-infra.md § A7. Vertex (graphs, cause and effect, simulation)](../../general-references/05-palantir-apps-infra.md#a7-vertex-graphs-cause-and-effect-simulation)

- **What it does:** explore curated system graphs of linked objects, monitor events and time series on them, and simulate scenarios ([Fact](https://www.palantir.com/docs/foundry/vertex/overview/)). The scenario sub-feature "chained models" is marked sunset.
- **Recent change:** Search Around V2 went GA in Vertex on 10 Nov 2026, and saved searches can ship in Marketplace products ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-11)).
- Internals were not read [Unverified].

## Design decisions already in the reference maps

### 10. Scenarios as dry runs

> Source: [general-references/30-map-palantir-platform.md § 10. Scenarios as dry runs](../../general-references/30-map-palantir-platform.md#10-scenarios-as-dry-runs)

**Purpose.** Run a multi-step change against a copy-on-write overlay, compare it with reality, then commit or discard. *Receivables example:* "If we apply the new dunning schedule to all 3,200 open invoices, how many customers get a final notice this week?" No email is sent and no record changes.

**Design to implement.**
- **A scenario is an overlay that stores only deltas** [Fact 05]: modified properties, created or deleted objects, created or deleted links. It is created by applying actions and running models, and it is **immutable once created**; to change it, create or duplicate a new one [Fact 05].
- **Limits** [Fact 05]: 30,000 edits, 50 actions, 10,000 objects loaded per object set.
- **API** [Fact 02]: create a scenario, apply actions with a `scenarioRid`, list the edited objects and links, find conflicts, rebase. Submission criteria can test "inside a scenario" [Fact 02]. The action log records the scenario ID [Fact 02].
- **Side effects never fire in a scenario** [Inference; Palantir's Agent Builder Preview "runs actions but edits are not applied", Fact 03].
- **Storage** [Inference]: `scenario(id, tenant_id, base_model_version, created_by, created_at, status)` and `scenario_edit` with the same shape as `object_edit`. Reads inside a scenario layer `scenario_edit` over the current state.
- **Commit** [Inference]: replay the scenario's action list on main, each one re-validated and conflict-checked, as one proposal (section 8.9).
- **The same overlay powers evals** (section 17): Palantir runs each eval case in its own ontology simulation [Fact 03].
- Single-step dry runs use `VALIDATE_ONLY` (section 8.8). Scenarios are for multi-step plans.

**Copies.**
- Document 05, A1 "Scenarios (labelled Legacy)": deltas, immutability, limits. https://www.palantir.com/docs/foundry/workshop/scenarios-concepts/
- Document 02, §13: scenario endpoints and the scenario execution context in criteria. https://www.palantir.com/docs/foundry/action-types/submission-criteria/ ; code `foundry_sdk/v2/ontologies/ontology_scenario.py`
- Document 03, §§10 and 13: Agent Builder preview, eval simulation. https://www.palantir.com/docs/foundry/aip-evals/ontology-edits/

**Left out, and why.**
- Workshop scenario widgets and "Models" as property estimators: the product has no Workshop.

**Open questions.**
- Palantir labels Workshop scenarios Legacy and does not say what replaces them [Unverified 05]. The REST scenario API in 02 may be the successor. This needs checking (see Gaps).

---

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
