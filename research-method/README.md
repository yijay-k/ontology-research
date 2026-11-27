# Research method

This folder defines the method used for every company profile, repository audit, architecture claim and design recommendation. Documentation is treated as a navigation map and a statement of intended capability—not proof that the capability works.

## Evidence chain

For each high-value feature, the audit should trace:

`product claim → official docs → architecture docs → repo entrypoint → owning module → data model/schema → execution path → storage/event side effects → permission boundary → tests → runtime verification`

If a link in that chain is unavailable, the gap is named. A README claim with no implementation evidence remains **Documented**, not **Implemented**. A test file is evidence that the project intends to test a behaviour; it is not proof that the test passes. A passing unit test would still not prove production security or resilience.

## Research units

- **Company/product:** product boundaries, architecture, customer workflow, commercial model, deployment, public customer evidence and limitations.
- **Repository:** identity and lineage, modules, entrypoints, runtime boundaries, schemas, persistence, dataflow, APIs/events, security, tests, packaging and licensing.
- **Architecture capability:** problem definition, candidate implementations, common pattern, divergent approaches, failure modes and design implications.
- **Domain pack:** business objects, source systems, rules, workflows, actors, controls and competency questions.

## Standard workflow

1. Preserve the supplied source pack and inventory it.
2. Build the list of claims and questions from previous research.
3. Locate canonical upstream repositories and distinguish forks, ports, emulators and derived projects.
4. Check licence, release/commit activity, supported language/runtime and deployment instructions.
5. Read project docs and architecture docs to map the design.
6. Inspect actual code: startup and dependency wiring, core service handlers, domain types, repository/storage adapters, transaction boundaries, indexers, query planners, policy enforcement and error/retry paths.
7. Inspect tests and CI for claimed guarantees; do not infer a passing result without execution.
8. Compare the implementation to the feature claim and to relevant independent projects.
9. Reconcile contradictions against the original ZIP and prior research.
10. Write a recommendation with evidence, limitations, alternatives and a confidence label.

## Research status for this phase

The audits in `15-repository-audits/` contain remote source inspection. The `validation_status` field in each audit indicates whether build/test/runtime verification occurred. In this phase, test sources were inspected selectively, but no repository tests were run.