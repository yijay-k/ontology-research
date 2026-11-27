# Markings row column object policies

**Layer:** [01-security](README.md) · **What it is:** Mandatory labels (markings), row and column policies, object and property security, and purpose-based checks.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (7) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Palantir

### 4. Markings and marking categories

> Source: [general-references/04-palantir-security.md § 4. Markings and marking categories](../../general-references/04-palantir-security.md#4-markings-and-marking-categories)

**Plain English.** A Marking is a sticker such as "PII" or "Case-1234". Only members of that Marking can see stickered things, whatever their role. Stickers spread to anything built from the data.

**Technical detail.**
- **Semantics:** a user must be a member of all Markings on a resource (conjunctive). Not meeting them means the resource cannot be discovered. Meeting the file Markings but not an inherited data Marking means the user sees the metadata, and an error appears when they try to read the data. [Fact] https://www.palantir.com/docs/foundry/security/markings
- **Categories:** created in Platform Settings and cannot be deleted. Visibility is "Visible" (others can see that the category and its Markings exist) or "Hidden" (invisible without Category Viewer). A category can be restricted to one Organization. Category Administrators edit the category and create Markings. Markings cannot be deleted or moved between categories. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/
- **Per-Marking permissions (independent):** Manage permissions, Apply marking, Remove marking, and Members. Someone can apply a Marking without being able to see the data. Applying a Marking also requires "Update Markings on resource" (in Owner by default). Membership is global, but users still need a role. [Fact] same URL.
- **Suggested patterns:** one Marking per sensitive category, per data owner, per pipeline stage (a "Raw" Marking removed after cleaning), or per case. Markings can also hide existence. [Fact] https://www.palantir.com/docs/foundry/security/markings
- **Apply safely:** a documented process of branch, lineage simulation, review of transaction types, `stop_propagating` where needed, then apply. Applying takes effect downstream immediately and can lock users out. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/ , https://www.palantir.com/docs/foundry/security/protecting-sensitive-data/
- **Row-level Markings:** a restricted view can be built from a STRING ARRAY column of Marking UUIDs, so a row is visible only to users holding all the Markings listed in it. "Mandatory control properties" expose the same thing on objects. The property must be non-null, though an empty array means visible to all. Allowed values are declared per datasource, and violating values fail indexing. Action types can take Marking parameters, so created objects are secured by the value supplied. [Fact] https://www.palantir.com/docs/foundry/security/restricted-views/ , https://www.palantir.com/docs/foundry/object-link-types/mandatory-control-properties/

### 5. Classification-based access controls (CBAC)

> Source: [general-references/04-palantir-security.md § 5. Classification-based access controls (CBAC)](../../general-references/04-palantir-security.md#5-classification-based-access-controls-cbac)

**Plain English.** CBAC is a government-style ladder (Unclassified < Secret < Top Secret) plus "releasable to" lists. Clearance for a higher level covers lower ones.

**Technical detail.**
- CBAC is off by default and needs Palantir to set it up. Levels are hierarchical. Releasability-type categories are disjunctive: holding one listed marking is enough. Rules across categories are conjunctive, and valid combinations are enforced. [Fact] https://www.palantir.com/docs/foundry/security/classification-based-access-controls/
- **Three classifications per resource:**
  - Project classification: needed to discover the Project; set at creation; can be changed but not removed; not inherited along lineage.
  - File classification: needed to discover the file; required when creating a non-derived dataset.
  - Data classification: computed as the maximum of the file classification and upstream data classifications; needed to read the contents.
  
  [Fact] same URL.
- A Project's **maximum classification** blocks creating or moving in anything higher. If higher-classified data flows in from upstream, the dataset and everything downstream stop building, with a warning. [Fact] same URL.
- CBAC Markings can be added to scoped sessions. [Fact] https://www.palantir.com/docs/foundry/administration/configure-scoped-sessions/

### 6. Propagation through lineage, and how removal works

> Source: [general-references/04-palantir-security.md § 6. Propagation through lineage, and how removal works](../../general-references/04-palantir-security.md#6-propagation-through-lineage-and-how-removal-works)

**Plain English.** If table B is computed from table A, and A carries "PII", then B carries "PII" too, until someone with authority writes code that deliberately removes it, usually after dropping the PII columns.

**Technical detail.**
- **Inheritance paths:** the file hierarchy (Project or folder down to children) and data dependencies (inputs to outputs, recorded on transactions). [Fact] https://www.palantir.com/docs/foundry/security/markings
- **Removal at the origin** (where the Marking was applied directly) takes effect downstream immediately. **Removal in a transform** affects only that transform's outputs. [Fact] same URL.
- **`stop_propagating` / `stop_requiring`:**
  - Python syntax: `Input(..., stop_propagating=Markings([ids],[branches]), stop_requiring=OrgMarkings([ids],[branches]))`. Java uses the `@StopPropagating` and `@StopRequiring` annotations. SQL uses `foundry_stop_propagating(...)` hints.
  - The listed branches must be protected, with a required approver; listing an unprotected branch fails the build.
  - Approvers need Remove marking (for Markings) or Expand access (for Organizations), plus the repository's own access and the View Repository workflow. They do not need to be members of the Marking being removed.
  - A single rejection blocks the pull request.
  - Approval mode per repository and Marking: "Require re-approval" on every PR (the default), or approval only the first time.
  
  [Fact] https://palantir.com/docs/foundry/building-pipelines/remove-inherited-markings/
- **Restricted views** can "Stop Propagating" inherited Markings through the UI. Datasets and restricted views are the only places where inherited Markings can be removed. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/
- **Transaction types matter:** APPEND and UPDATE datasets keep historical transactions that still carry the old Marking, so the docs flag them for special attention. [Fact] https://www.palantir.com/docs/foundry/security/protecting-sensitive-data/
- **Where propagation stops:** function return values, action edits, AIP Logic tool-call results in model context, OSDK responses, Pipeline Builder Ontology outputs, writeback, and exports. [Fact] https://palantir.com/docs/foundry/security/access-control-propagation/
- **Investigating:** use Data Lineage or a dataset's Compare tab to find when a Marking was added or removed. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/

### 7. Restricted views

> Source: [general-references/04-palantir-security.md § 7. Restricted views](../../general-references/04-palantir-security.md#7-restricted-views)

**Plain English.** A restricted view is a filtered window onto a table. Each viewer sees only the rows their attributes allow, for example "region column = my region attribute".

**Technical detail.**
- It is built on a backing dataset plus a granular policy. It cannot be used as an input to transforms. It rebuilds on a schedule when the input updates. It can back an object type. It inherits the input's Markings, which can be stopped on the view. Users who should see only the view must not have upstream access. [Fact] https://www.palantir.com/docs/foundry/security/restricted-views/
- Policies must reference users, groups and Organizations by UUID, not name. The docs recommend at least one user-attribute term. Marketplace packaging carries the policy but not the data, and supports only string and boolean constants. [Fact] same URL.
- For Ontology use, Palantir now recommends **object security policies** instead. They give unified cell-level security, near-instant policy updates, and support for streaming and branching. A migration tool exists, with listed exclusions: multi-datasource objects, range operators, numeric constants, and group, Organization or static Marking IDs as user properties. [Fact] https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/

### 8. Granular policies: syntax, user attributes, limits, weights

> Source: [general-references/04-palantir-security.md § 8. Granular policies: syntax, user attributes, limits, weights](../../general-references/04-palantir-security.md#8-granular-policies-syntax-user-attributes-limits-weights)

**Plain English.** A granular policy is a rule like "show the row if row.country equals user.country, OR the user is in group GlobalAccess". The platform rewrites each query to add that filter.

**Technical detail.**
- **Evaluation:** the policy is a template filled with the user's attributes and group memberships. When an application requests data, it is compiled into a query that returns only permitted rows or objects. Conditions combine with All (AND), Any (OR) and NOT. [Fact] https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/
- **User-side operands:** User ID, Username (the identity-provider ID), Group IDs and Group names (direct and inherited), Authorized group IDs (scoped sessions; the docs say ask Palantir before using), Organization Marking IDs (UUIDs, primary and guest), Marking IDs the user can view, and custom identity-provider attributes. [Fact] same URL.
- **Comparisons:** Equal, <, ≤, ≥, >, Intersects, Subset of, Superset of. The two sides must have compatible types. [Fact] same URL.

| Condition | Weight |
|---|---|
| No field involved (e.g., user groups ∩ constant groups) | 0 |
| Field vs single value | 1 |
| Field vs collection | 1,000 |
| Marking condition referencing a field | 3,000 |
| Marking condition without field | 0 |

The cap is **10,000** in total, across nested groups. NOT adds no weight. A collection counts as a collection even with one element. Weight-0 conditions can decide access before any row is read. [Fact] same URL. Property policies are checked against the object policy's weight plus their own. Worked example from the docs: an object policy of 3,000, plus 5,000 for one property policy, gives 8,000, which is within the cap. [Fact] https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/

- **Failure modes:**
  - Rows with null in a policy column are invisible to everyone and can break syncs.
  - Upstream schema changes can silently break a policy's assumptions, so the docs recommend a dedicated policy column plus build-failing invariant checks.
  - `NOT` on memberships combined with scoped tokens can over-grant.
  - Exceeding the weight cap fails policy construction.
  
  [Fact] https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/
- [Inference] The weight model shows how enforcement is implemented: user-only predicates are resolved once per request (cost 0), while field predicates become query filters, and collection or marking predicates on fields are expensive set operations in the index. That is why "field vs collection" costs a thousand times more.

### 9. Object security policies and property security policies

> Source: [general-references/04-palantir-security.md § 9. Object security policies and property security policies](../../general-references/04-palantir-security.md#9-object-security-policies-and-property-security-policies)

**Plain English.** On a business object like "Passenger", an object policy decides which passengers you can see. Property policies decide which fields, such as phone number, you can see on the passengers you can see.

**Technical detail.**
- **Checks for viewing an instance:** (1) Viewer on the object type, (2) passing the granular policy, (3) passing Marking, Organization and classification checks. With a policy in place, Viewer on the backing datasource is not needed (under project-based permissions). [Fact] https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/
- **Outcomes:** failing the object policy hides the object. Passing the object policy but failing a property policy shows that property as null. [Fact] same URL.
- **Rules:** a property policy requires an object policy to exist first. The primary key cannot be in a property policy. Each other property belongs to at most one property policy. Object policies inherit the datasource's mandatory controls by default, and inherited Markings can be removed. Editing policies requires Owner on the Project containing the object type. [Fact] same URL.
- **Materializations:** they get the most restrictive union of Markings. Old transactions keep the old policies, so rebuild after adding a Marking. [Fact] same URL.
- **Testing:** "Test policies" can simulate a user and hypothetical property values, including unsaved policies. It cannot test derived properties, and it does not consider guest Organizations unless the tester belongs to them. [Fact] same URL.
- **Display:** Workshop widgets can show Marking "pills" on each property. These are informational only. [Fact] https://www.palantir.com/docs/foundry/security/property-security-markings/

### 13. Purpose-based access: Checkpoints (justification prompts)

> Source: [general-references/04-palantir-security.md § 13. Purpose-based access: Checkpoints (justification prompts)](../../general-references/04-palantir-security.md#13-purpose-based-access-checkpoints-justification-prompts)

**Plain English.** Before you export a customer list, a dialog asks why, and your answer is stored with your name, the time and the exported file.

**Technical detail.**
- A **configuration** is one or more checkpoint types, plus a scope (an Organization, which needs a Data Governance Officer, or a space), plus optional matchers. Matchers cover location, submitting user, selected user or group, Markings, action type and object set, with at most one of each type per configuration, each combined as AND or NOT. [Fact] https://www.palantir.com/docs/foundry/checkpoints/configure-checkpoints/
- **Justification types:**
  - Acknowledgement (checkbox).
  - Response (free text with an optional regex; can show the user's 5 most recent justifications from the last month).
  - Dropdown (with optional or required text).
  - Re-authentication with the identity provider (not available for Login).
  
  Only Login checkpoints have a frequency setting. Titles are recommended under 45 characters. [Fact] same URL.
- **Types** include about 30 download/export types (Compass export, Object set export, AIP Analyst export, Model export, Report export, and more), upload types, and management types (role grant, Marking member add or remove, group member changes, Project reference, token create, OAuth secret rotation, Cipher decrypt). Login, Run build, Submit action and others are also covered. Submit action covers only UI submissions, not Automate or API/SDK. [Fact] https://www.palantir.com/docs/foundry/checkpoints/checkpoint-types/
- **Record:** submitting user and timestamp, type, justification, Checkpoint RID, configuration RID, a frozen copy of the prompt text, and references to the checkpointed items (for an action: the action type, the Ontology, and the Ontology version). [Fact] https://www.palantir.com/docs/foundry/checkpoints/core-concepts/ . Justifications also appear in audit as `userJustify`. [Fact] https://www.palantir.com/docs/foundry/security/audit-log-categories/

## Design decisions already in the reference maps

### 5. Read checks: mandatory labels, roles, row and column policies

> Source: [general-references/30-map-palantir-platform.md § 5. Read checks: mandatory labels, roles, row and column policies](../../general-references/30-map-palantir-platform.md#5-read-checks-mandatory-labels-roles-row-and-column-policies)

**Purpose.** Every read answers three questions: may you be near this kind of data at all, does your role allow this operation, and which rows and fields may you see? *Receivables example:* a collector sees Malaysian customers only (row). The bank-account field on `Customer` is null for anyone outside Finance-Admins (column). Accounts under legal action carry a `Legal-Hold` marking that only the legal team holds (mandatory).

**Design to implement.**
- **Decision formula:** `can_read = mandatory_ok AND has_role(op) AND policy_filter(rows, fields)`. Roles only add permissions and never override a marking [Fact 04].
- **Markings** [Fact 04]:
  - Conjunctive: a user must hold every marking on a resource.
  - Markings are stored as sets on every resource and on every derived artifact: `output.markings = union(input.markings) − explicitly_stopped` [04 "What to copy" 2].
  - Organizations, if they come back, use ANY semantics [Fact 04].
- **Three-tier visibility** [Fact 04]:
  - Without the mandatory markings, the resource is invisible and excluded from search.
  - With the resource's own markings but not an inherited data marking, the user sees metadata and gets an explanatory error on reading data.
  - Otherwise, full access.
- **Per-marking permissions** are separate: manage, apply, remove, member. "Remove" is not implied by Owner [Fact 04]. Removing an inherited marking is a reviewed request that names the marking, the input and the scope. This replaces Palantir's `stop_propagating` pull request, as 04 suggests [Inference 04].
- **Row-level markings.** A "mandatory control" property holds an array of marking IDs. It must be non-null, and an empty array means no restriction. Allowed values are declared per datasource, and a violation fails indexing or rejects the action [Fact 02, 04].
- **Object policy and property policies.**
  - One object policy per type gives row-level security; property policies give column-level; together they give cell-level [Fact 02, 04].
  - Failing the object policy hides the object. Failing a property policy shows the property as null [Fact 04].
  - The primary key cannot be in a property policy, each property is in at most one, and a property policy needs an object policy to exist [Fact 04].
- **Policy AST** [Fact 04]:
  - Nodes: All, Any, Not.
  - Comparisons: eq, lt, lte, gte, gt, intersects, subsetOf, supersetOf.
  - Operands: field, `user.id`, `user.username`, `user.groupIds` (direct and inherited), `user.markingIds`, `user.attr[k]`, constant.
  - Reference users and groups by ID, never by name [Fact 04].
- **Weight budget** (bounds query cost) [Fact 04]: 0 for user-only, 1 for field vs single value, 1,000 for field vs collection, 3,000 for a marking condition on a field, 0 for a marking condition without a field. The cap is 10,000, counted as the object policy plus one property policy. Weight-0 nodes are resolved once per request, before any row is read.
- **Validation rules** when a policy is saved:
  - Reject `NOT` over group, marking or organization membership, because scoped tokens may lack the attribute and the `NOT` then over-grants [Fact 04, 02].
  - A row with null in a policy column is invisible to everyone, so treat it as deny and fail the build when nulls appear [Fact 04].
  - Use a dedicated policy column with build-failing invariant checks, so upstream schema changes cannot silently break the policy [Fact 04].
- **Schema permission is separate from data permission.** Seeing that the `Customer` type exists comes from a project role. Seeing customers comes from the object policy [Fact 02, 04]. Agents get schema broadly, so they can plan, and data narrowly [04 "What to copy" 8].
- **Postgres implementation** [Inference]:
  - The object policy compiles to an RLS predicate over `current_setting('app.principal_id')`, `app.group_ids` and `app.marking_ids`, all set per request.
  - Mandatory markings become a second RLS predicate: `object.markings <@ current_setting('app.marking_ids')::uuid[]`.
  - Property policies are enforced by a per-type security-barrier view that returns `CASE WHEN <policy> THEN value END` for each covered property, because RLS filters rows, not cells.
  - Agents and apps query only the views, never the base tables.
- **Testing and explanation.**
  - "Test as user X" simulates a principal and hypothetical values, including unsaved policies [Fact 04].
  - A check-access API returns which marking, role and policy conditions pass or fail for a (principal, resource) pair, and lists missing dependent resources [Fact 04]. Agents use the same output to explain a refusal [04 "What to copy" 23].
- **Scope boundary, stated plainly to customers.** These controls apply at read time only. They do not follow data into exports, function return values, action edits or a model's context [Fact 02, 03, 04]. Sections 13 and 19 deal with what this leaves open.

**Copies.**
- Document 04, §§2–4 "Organizations", "Projects", "Markings": conjunctive markings, three-tier visibility, per-marking permissions. https://www.palantir.com/docs/foundry/security/markings , https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/
- Document 04, §6 "Propagation through lineage": where propagation stops. https://palantir.com/docs/foundry/security/access-control-propagation/
- Document 04, §8 "Granular policies": operands, comparisons, weights, cap, failure modes, NOT warning. https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/
- Document 04, §9 and document 02, §8: object and property security policies, null-out, testing. https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/
- Document 02, §3 "Mandatory control properties". https://www.palantir.com/docs/foundry/object-link-types/mandatory-control-properties/
- Document 04, §10: schema vs data permission. https://www.palantir.com/docs/foundry/object-permissioning/ontology-permissions/
- Document 04, §3: Check access. https://www.palantir.com/docs/foundry/security/checking-permissions/

**Left out, and why.**
- CBAC: government-oriented [04].
- Restricted views as a separate object: Palantir itself now steers users to object policies [Fact 04].
- Cipher licence tiers: overkill. Version 2 may add deterministic encryption for bank account numbers [04].
- Sensitive Data Scanner: version 2, using regex built-ins and an LLM classifier [04].
- Project constraints (allowed or prohibited markings): version 2.
- Emulation mode: version 2.

**Open questions.**
- Will RLS predicates built from array settings perform well enough with collection-weight policies at around a million invoices? This needs a benchmark [Inference].
- Can a principal hold incompatible markings, which would require scoped sessions in version 1 (section 13)?

---

## Open-source implementations (added 28 Nov 2026)

- [openfoundry](../../open-source-references/openfoundry.md) marking evaluator and `015_user_groups_markings.sql` — see Implementation starting points above.

## Implementation starting points (from source code)

_Repositories read on 28 Nov 2026 at the pinned commit in each link. Licences checked at that commit._

- **Marking evaluator to copy:** [`Przyval/openfoundry` → `packages/markings/src/marking-evaluator.ts`](https://github.com/Przyval/openfoundry/blob/96ff1de/packages/markings/src/marking-evaluator.ts) — user must hold all mandatory markings and at least one discretionary marking if any are present; unknown markings count as mandatory. Schema in `db/migrations/015_user_groups_markings.sql`.

## Fact-check notes

_Checked 28 Nov 2026. **Confirmed** = research still matches. **New** = not in the research. **Changed** = research is out of date. Items marked (code) were checked by reading the repository at the pinned commit; others against vendor pages._

- **New** — Palantir made testing object and property security policies in Ontology Manager generally available (June 2026). Source: https://www.palantir.com/docs/foundry/announcements/2026-06

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
