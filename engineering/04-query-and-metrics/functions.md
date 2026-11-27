# Functions

**Layer:** [04-query-and-metrics](README.md) · **What it is:** User-written logic attached to the ontology (functions, AIP Logic) that queries and computes over objects.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Palantir

### 9. Functions

> Source: [general-references/02-palantir-ontology.md § 9. Functions](../../general-references/02-palantir-ontology.md#9-functions)

Plain English: functions are server-side code (TypeScript or Python) that reads objects and returns values, or returns proposed edits that an action then commits.

Technical detail:
- **Languages:** TypeScript v1, TypeScript v2, Python. Feature table: interfaces only in TS v2; LLM integration in TS v2 and Python, not TS v1; Python is the only one usable in Pipeline Builder; deployed (long-running) execution only TS v2 and Python; staged writes (beta) only TS v2 and Python; TS v2 runs on full Node.js and can request up to 8 vCPUs and 5 GB. [Fact] https://www.palantir.com/docs/foundry/functions/language-feature-support/
- **Limits:** 60 s default wall time (configurable), 280 s in live preview, up to 4 hours async via Automate; TS v1 30 s CPU and 128 MB memory; serverless Python and TS v2 1,024 MiB default, 512-5,120 MiB configurable; deployed Python 2 GB; TS v1 object sets error above 100,000 objects loaded or more than 3 search-arounds in one `.all()`. [Fact] https://www.palantir.com/docs/foundry/functions/enforced-limits/
- **Ontology edits.** TS v1 `@OntologyEditFunction` with `@Edits` provenance; TS v2 `createEditBatch(client)` with `create`, `update`, `delete`, `link`, `unlink`, `getEdits()` and an `Edits.Object<T> | Edits.Link<...> | Edits.Interface<I>` union type; Python `@function(edits=[...])`, `FoundryClient().ontology.edits()`, `.edit(obj)`, `.create(pk, ...)`, `.delete(...)`, link `.set/.clear/.add/.remove`, `get_edits()`. Primary keys cannot be changed. Declared edit provenance lets actions enforce permissions. Running an edit function outside an action changes nothing. Within a run, searches and aggregations see old data; fetch-by-key returns pending values. Automate does not apply edits returned by functions used as effects. [Fact] https://www.palantir.com/docs/foundry/functions/edits-overview/ , https://www.palantir.com/docs/foundry/functions/typescript-v2-ontology-edits/ , https://www.palantir.com/docs/foundry/functions/python-ontology-edits/
- **Staged writes.** [Inference from code] The OSDK functions package implements staged writes as an ontology transaction: edits are buffered per event-loop tick and posted to `POST /v2/ontologies/{ontology}/transactions/{transactionId}/edits` (preview), so later reads in the same function see them; batch actions are refused when a transaction ID is set. `osdk-ts/packages/functions/src/transactions/EditRequestManager.ts`, `packages/client/src/actions/applyAction.ts`, `foundry_sdk/v2/ontologies/ontology_transaction.py` ("Transactions are an experimental feature"). I could not open the staged writes doc page.
- **Queries.** Read-only functions with an API name become callable at `POST /v2/ontologies/{ontology}/queries/{queryApiName}/execute`. API-named queries always serve the latest tagged version (no semver), so renaming or removing the API name breaks consumers; Palantir suggests copying to a `V2` name. [Fact] https://www.palantir.com/docs/foundry/functions/query-functions/ ; endpoint path from `foundry_sdk/v2/ontologies/query.py`
- **Versioning.** Semver chosen by the publisher, immutable; pre-publish checks warn on dropped functions or inputs, reordered inputs, new required inputs, incompatible type changes, numeric widening; consumers reference ranges like `>=1.2.3 <2.0.0` and pick up stable releases immediately. [Fact] https://www.palantir.com/docs/foundry/functions/functions-versioning/
- **Testing.** TS v1 has documented unit testing with stub objects, verified edits, stubbed searches and aggregations, mocked dates, UUIDs, users and groups (sub-pages listed on https://www.palantir.com/docs/foundry/functions/overview/; not opened). OSDK has TypeScript testing and integration-testing guides (listed on https://www.palantir.com/docs/foundry/ontology-sdk/overview/; not opened). [Unverified on detail]
- Function config in TS v2 can declare `apiName`, `sources` (external connections) and an experimental `scope` (authorization constraint). [Fact] `osdk-ts/packages/functions/src/FunctionConfig.ts`

### 8. AIP Logic

> Source: [general-references/03-palantir-aip.md § 8. AIP Logic](../../general-references/03-palantir-aip.md#8-aip-logic)

**Plain English.** Logic is a no-code canvas for building one AI function. Example: "given a Support Ticket object, classify its priority and propose an assignee", chaining an LLM step with lookups and an Action.

**Technical detail.**
- **Function shape.** Inputs are objects, strings and similar. The output is a value, an object or Ontology edits. Logic functions can be called anywhere a function can, such as Workshop, Actions, Automate, Chatbot Studio tools and OSDK. To edit the Ontology, the function "must be published and called from an action". [Fact] https://www.palantir.com/docs/foundry/logic/core-concepts/
- **Blocks** ([Fact] https://www.palantir.com/docs/foundry/logic/blocks/):
  - *Use LLM* has a prompt, tools and an output. Prompt guidance: task overview first, then data, then when to use tools. The model sees only what you pass in, and `/` inserts inputs, block outputs or object properties. Output can be a Struct to return several named values. [Fact] plus https://www.palantir.com/docs/foundry/logic/faq/
  - *Tools* inside Use LLM, grouped as data, logic and action: **Apply actions** (with a description of when to use each Action), **Call function** (code functions or other Logic functions), **Query objects** (choose object types and limit the properties exposed to save tokens, with "Configure object return limits" capping objects returned) and a **Calculator**.
  - *Tool-calling mode*: "prompted" (tool instructions are injected into the prompt) or "native" (the provider's tool API). Logic switches to native automatically when every model in the block supports it, and the Debugger shows a notice.
  - *Apply action* calls an Action deterministically, with no LLM involved.
  - *Execute function* calls TypeScript, Python or Logic functions.
  - *Conditionals* are multi-branch if/else blocks. All branches must return the same type, and if they return edits, each branch must run an action or explicitly take no action.
  - *Loops* run over Lists only (an Array is converted automatically), expose `element` and `index`, and output either values or edits. Loops without actions run in parallel.
  - *Create variable* supports array, boolean, date, double, float, integer, long, object, short, string and timestamp.
- **Execution identity.** User-scoped is the default and runs with the invoker's permissions; each user sees only their own logs, kept for 24 hours. Project-scoped runs with the project's permissions; all resources must be imported into the project, users still need the markings, and logs are visible to everyone with project access. Project-scoped mode can also write an optional run-history dataset that keeps the last 10,000 runs. [Fact] https://www.palantir.com/docs/foundry/logic/execution-mode-settings/
- **Staged writes (beta)** ([Fact] https://www.palantir.com/docs/foundry/logic/staged-writes/):
  - All edits go to temporary storage and are applied when execution completes.
  - Later reads in the same run see the edits from nested calls.
  - Staged-write functions can call other edit-making functions and actions, and they lift legacy restrictions on filters after an edit.
  - Toggling the mode on a function that returns edits publishes a new **major version**. Existing consumers do not auto-upgrade.
  - Staged writes will become the default for new functions, and the legacy mode will be deprecated.
- **Limits** ([Fact] https://www.palantir.com/docs/foundry/logic/faq/):
  - Each block has its own context window and token budget. Tool responses count toward it.
  - Calls from Workshop or the function API time out after **five minutes**. The Debugger does not enforce this limit, which is a stated failure mode: a function can pass in the Debugger and fail in production.
  - Temperature is set in the block's Configuration field and defaults to 0.
- **Debugging.** The Debugger shows the LLM's chain of thought for each block, the tool calls it made, and token usage per message (a red bar means high usage). "Add as test case" turns a past run into an eval case. The version-history sidebar supports compare and rollback. [Fact] https://www.palantir.com/docs/foundry/logic/core-concepts/ , https://www.palantir.com/docs/foundry/logic/faq/
- **Palantir's reliability advice for Logic** ([Fact] FAQ):
  - Keep 5 to 10 input/output examples as unit tests and rerun them after every prompt change.
  - Add few-shot examples.
  - Ask the model to explain its plan so you can spot missing context.
  - Split a block when its results become inconsistent or it nears its context limit.
  - Prefer deterministic blocks.
  - Build a feedback loop: store each recommendation and its reasoning on a "Suggestion" object, write back the human decision, and give the LLM a Query objects tool over past suggestions. This is how "dynamic few-shot" works.
- **Branching.** Logic files can be edited on Global Branches. Branch publishes are tagged "Branched pre-release" and are invisible to main. Main can be protected so that changes require proposals and reviewers. A merge requires the branch to be up to date with main, published, error-free, and free of pending approvals. API names cannot change on a branch, and branches can only be created from main. [Fact] https://www.palantir.com/docs/foundry/logic/branching-logic/

## Design decisions already in the reference maps

### 7. Functions

> Source: [general-references/30-map-palantir-platform.md § 7. Functions](../../general-references/30-map-palantir-platform.md#7-functions)

**Purpose.** Server-side TypeScript that computes answers, or proposes edits that only an action commits. *Receivables example:* `computeDSO(customerSet)` is a read-only query function. `proposeDunningStep(invoice)` returns proposed edits that the "Advance dunning" action commits.

**Design to implement.**
- **One runtime, TypeScript.** Palantir supports TypeScript v1, TypeScript v2 and Python, and 02 calls the multiple runtimes a legacy artefact [Fact 02 + Inference 02]. Copy the TypeScript v2 feature set: interfaces, LLM access, staged writes [Fact 02].
- **Query functions** are read-only, have API names, and are callable at `POST /queries/{apiName}/execute` [Fact 02]. Palantir always serves the latest tagged version, so renaming breaks consumers, and its advice is to copy the function to a `V2` name [Fact 02].
- **Edit functions** return an edit batch (`create`, `update`, `delete`, `link`, `unlink`). Running one outside an action changes nothing. Primary keys cannot change. Declared edit provenance lets actions enforce permissions [Fact 02].
- **Read semantics inside a run** [Fact 02, 03]:
  - In batched mode, searches and aggregations see old data, while fetch-by-key returns pending values.
  - In staged mode, reads see the run's own edits.
  - **Version 1 uses staged mode only** [Inference; Palantir says staged writes will become its default, Fact 03].
- **Versioning** [Fact 02]: the publisher picks a semver, and versions are immutable. Pre-publish checks warn on dropped functions or inputs, reordered inputs, new required inputs, incompatible type changes and numeric widening. Consumers reference ranges such as `>=1.2.3 <2.0.0`.
- **Limits** [Fact 02]: 60 s default wall time, configurable; 1,024 MiB default memory, configurable from 512 to 5,120. Long work runs asynchronously, for up to 4 h through automations.
- **Identity.** Functions run as the calling user, so the same function returns different rows to different users [Fact 04]. For function-backed actions, end users need only the action permission [Fact 04].
- **Testing.** Stub objects, verified edits, stubbed searches and mocked dates, IDs and users. Palantir's sub-pages for this were not opened [Unverified 02].

**Copies.**
- Document 02, §9 "Functions": languages, limits, edits, queries, versioning. https://www.palantir.com/docs/foundry/functions/language-feature-support/ , https://www.palantir.com/docs/foundry/functions/enforced-limits/ , https://www.palantir.com/docs/foundry/functions/edits-overview/ , https://www.palantir.com/docs/foundry/functions/query-functions/ , https://www.palantir.com/docs/foundry/functions/functions-versioning/
- Document 03, §8: staged writes. https://www.palantir.com/docs/foundry/logic/staged-writes/
- Document 04, §10: functions run as the caller. https://palantir.com/docs/foundry/functions/permissions/

**Left out, and why.**
- Python and TypeScript v1 runtimes: one runtime is enough.
- Deployed long-running functions: asynchronous agent jobs (section 16) cover that need.
- Pipeline Builder functions: there is no pipeline UI.

**Open questions.**
- Customer-authored functions mean a sandbox. Do customers write code in version 1, or only the founder and templates? [Inference needed]

---

## Open-source implementations (added 28 Nov 2026)

- [isolated-vm](../../open-source-references/isolated-vm.md) — sandbox for user-written TypeScript functions with memory/time limits (ISC).

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
