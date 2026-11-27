# Palantir Foundry/AIP security and governance, bolt by bolt

Scope note (written 21 November 2026): this document breaks down Palantir's documented security and governance model for Foundry and AIP. It covers identity, Projects and roles, mandatory controls (Organizations, Markings, CBAC), propagation through lineage, row, column and cell security, Ontology, action and function permissions, scoped sessions, Checkpoints, Approvals, audit logs, deletion, Sensitive Data Scanner, Cipher and encryption, third-party apps and tokens, LLM and agent controls, privacy and civil liberties (PCL) guidance, and certifications. For each mechanism it says what is checked, when it is checked, and what the user sees. Almost all of it comes from palantir.com/docs pages read in November 2026. Those pages carry no visible "last updated" date, so every doc-derived claim below should be read as "per the docs as of Nov 2026". The final sections turn this into a minimum faithful design for a small product with 100 to 1,000 staff. Labels: [Fact] means documented, with a URL. [Vendor claim] means Palantir's own assertion about outcomes. [Inference] is my reasoning. [Unverified] means I could not find a source. My web search budget ran out near the end of the research, so a few areas were not fully covered (see Open questions).

---

## Key findings

1. **There are two families of control, and only one of them travels with the data.** Mandatory controls (Markings, Classification-based Access Controls, Organizations) propagate through file hierarchy and data lineage. Discretionary controls (roles, restricted views, object and property security policies) filter reads and then stop. Data that has been read, then exported, returned by a function, written by an action, or placed into an LLM context carries no policy from its source. [Fact] https://palantir.com/docs/foundry/security/access-control-propagation/
2. **Access is a conjunction of three checks:** mandatory eligibility (meet all Markings, and belong to one of the Organizations), plus a discretionary role, plus any row or column policy. Roles only add permissions and never override a Marking. [Fact] https://www.palantir.com/docs/foundry/security/security-glossary/ , https://www.palantir.com/docs/foundry/security/markings
3. **Markings are all-or-nothing and conjunctive.** A user must hold every Marking on a resource. Without them the resource cannot be found in search at all. If a user meets the file's Markings but not a Marking inherited from upstream data, they can see the metadata but not the rows. [Fact] https://www.palantir.com/docs/foundry/security/markings
4. **Removing a Marking is a separate, privileged, reviewed act.** It needs the "Remove marking" (expand access) permission on that Marking. Being Owner is not enough. Inherited Markings can only be removed in transform code (`stop_propagating`) on a protected branch, with security approval from a holder of Remove marking. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/ , https://palantir.com/docs/foundry/building-pipelines/remove-inherited-markings/
5. **Row-level policies are templates compiled into queries,** with a documented cost model. The weights are: 0 for user-only comparisons, 1 for a field against a single value, 1,000 for a field against a collection, and 3,000 for a marking condition on a field. The total cap is 10,000. The docs repeatedly warn against `NOT` on group, marking or organization membership, because scoped tokens may lack the attribute and the `NOT` then over-grants. [Fact] https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/
6. **Object security policies give row-level security, property security policies give column-level, and the two together give cell-level.** A user who fails a property policy sees the property as null. Failing the object policy hides the whole object. Each property belongs to at most one property policy, and the primary key belongs to none. [Fact] https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/
7. **Writes are gated three ways:** the user's read access to edited types, submission criteria (conditions on the current user and on parameters, each with a custom failure message), and optional read and write marking authorizations that detect declassification at save time. Palantir recommends making object types editable "only via actions". [Fact] https://palantir.com/docs/foundry/action-types/permissions/ , https://palantir.com/docs/foundry/action-types/submission-criteria/ , https://palantir.com/docs/foundry/action-types/read-write-authorizations/
8. **LLM calls are gated by Markings on the caller's session token, not on the data.** Admins set an allowlist of mandatory Markings per enrollment or per registered model. A request fails if the token carries any Marking outside it. A user narrows their token by picking a scoped session. [Fact] https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
9. **Agents and automations run under one of four identities:** the end user (default for AIP Logic), the project (project-scoped execution), the owner (Automate effects), or a service user (third-party-app-owned automations and client-credentials apps). Pro-code agents get platform-issued tokens limited to the agent's Ontology binding. [Fact] https://palantir.com/docs/foundry/logic/execution-mode-settings/ , https://palantir.com/docs/foundry/automate/permissions/ , https://palantir.com/docs/foundry/agents/scoped-permissions/
10. **A token's effective permission is an intersection** of the user's or service user's permissions, the app's maximum restrictions (Ontology resources, Projects, API operation namespaces), and the scope requested at token time. A token requested with no scope has no permissions. [Fact] https://palantir.com/docs/foundry/developer-console/application-restrictions/
11. **Checkpoints are a purpose-justification layer.** They attach to roughly 90 interaction types (exports, logins, action submissions, group and marking changes, token creation). They can ask for an acknowledgement, free text (optionally checked by regex), a dropdown, or re-authentication, and every submission becomes an immutable record. They do not fire on API/SDK or async action submissions. [Fact] https://www.palantir.com/docs/foundry/checkpoints/checkpoint-types/ , https://www.palantir.com/docs/foundry/checkpoints/configure-checkpoints/
12. **Audit (schema audit.3) is category-typed.** Every event has at least one category from a fixed set (for example `dataExport`, `authorizationCheck`, `llmInference`, `onBehalfOf`, `userJustify`), and category-defined `requestFields` and `resultFields`. Events arrive in about 15 minutes, via a paged API for SIEMs or a dataset export with up to 730 days' retention. [Fact] https://www.palantir.com/docs/foundry/security/audit-logs-overview/ , https://www.palantir.com/docs/foundry/security/audit-log-categories/
13. **Deletion is lineage-aware.** Deleting a transaction also deletes every downstream transaction derived from it. There are two policy types (fixed date; latest view only). Physical deletion can take about 30 days. [Fact] https://www.palantir.com/docs/foundry/data-lifetime/core-concepts-data-lifetime/ , https://www.palantir.com/docs/foundry/data-lifetime/FAQ/
14. **Agent and LLM logs do not inherit Markings automatically.** Only Markings an admin applies when enabling log access are enforced, so prompt and trace logs are a leak path unless they are marked deliberately. [Fact] https://palantir.com/docs/foundry/aip-observability/log-permissioning/
15. **Encryption internals are not publicly documented.** The public docs say only "encrypted in transit and at rest". Detail lives behind NDA in the Trust Center. App-level field encryption (Cipher) is documented in detail (AES-SIV, AES-GCM-SIV, peppered SHA-256/512). [Fact] https://www.palantir.com/docs/foundry/security/overview , https://palantir.com/docs/foundry/cipher/getting-started/

---

## Breakdown

### 1. Authentication and identity (Multipass, SSO, groups, Organizations, attributes)

**Plain English.** Foundry does not hold passwords. The company's identity provider (Okta, Entra ID and so on) proves who you are. Foundry stores your user record, your groups and your attributes, such as `location:country = UK`, and later policies read those attributes. Example: Alice logs in through Okta, which sends `groups=[Sales-UK]` and `country=UK`. Foundry adds her to the provider group "Sales-UK", assigns her to Organization "Acme", and stores her country attribute for row filters.

**Technical detail.**
- Protocols: SAML 2.0 and OIDC 1.0, configured in Control Panel's Authentication tab. [Fact] https://palantir.com/docs/foundry/authentication/overview/
- "Multipass" is the internal name of the identity service. The docs show it in IDs (`ri.multipass..organization.`), in "Multipass attributes" used by submission criteria, in "SAML Multipass realm", in "Multipass Group AUM rules", and in the "Token create: Creating a Multipass token" checkpoint. [Fact for the name usage] https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/ , https://palantir.com/docs/foundry/action-types/submission-criteria/ , https://www.palantir.com/docs/foundry/security/single-sign-on-security/ ; [Inference] that it is the central authN/authZ-attribute service. No public architecture page was found.
- **Realm:** the authentication source a user came from. **User manager:** optional login-time logic. Synchronous managers run with no user action; asynchronous ones (AUMs) can show a page, such as accepting a licence. [Fact] https://www.palantir.com/docs/foundry/security/security-glossary/ . The documented AUM example is the "Checkpoints Login" justification. [Fact] https://www.palantir.com/docs/foundry/authentication/saml-getting-started
- **SAML attribute mapping:**
  - The user ID defaults to NameID. It must be non-empty, consistently cased and stable for the account's lifetime, and the docs advise against email or username.
  - Username, email, first name and last name are mapped explicitly.
  - Extra attributes can be mapped with a "First" or "All" mode for multi-valued claims.
  - Group sync is optional. On each login, every value of the configured claim becomes a provider group the user joins. An optional regex can split values such as `Engineering,Analysts`.
  - Without sync, group membership does not update at login, and SCIM is recommended instead.
  - Control Panel warns when the SAML certificate expires within 30 days.
  
  [Fact] https://www.palantir.com/docs/foundry/authentication/saml-getting-started
- **Organization assignment** happens at login. There are two modes: a Default Organization per identity-provider integration, or ordered Advanced rules over user attributes, internal groups or provider groups, with a fallback. Group rules match group names by regex. A user assigned "No organization" cannot log in. [Fact] https://www.palantir.com/docs/foundry/authentication/org-assignment
- **Groups** come in three kinds: external (read-only in Foundry), internal, and rule-based. External groups should be nested inside internal ones rather than adding users directly. Membership can expire, with a "Latest expiration" date and/or a "Maximum duration" (the stricter one wins), a reminder 7 days before, and a revocation notice. External groups must be given an Organization, or they are visible to everyone. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-groups/
- **MFA** is mandatory. The documented ranking of methods is hardware tokens (FIDO2, CAC) above disconnected OTP, then authenticator apps, then biometrics. SMS, email OTP and security questions are called weak. Foundry enforces a "relatively short" maximum session lifetime, with no number given. Palantir's managed "Central Auth" Entra ID can disable accounts after 30 days of inactivity. [Fact] https://www.palantir.com/docs/foundry/security/single-sign-on-security/
- **Inactivity:** an account with no successful login for 30 days becomes inactive. All its tokens stop working until the user logs in again. Schedules owned by the user keep running. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-users/ , https://www.palantir.com/docs/foundry/platform-security-third-party/user-generated-tokens/
- **What the user sees:** the login page shows identity-provider choices matched by email-domain regex. A "suitable authentication provider could not be located" error means the domain or host is not allowlisted. [Fact] https://www.palantir.com/docs/foundry/authentication/saml-getting-started

### 2. Organizations and spaces (mandatory silo)

**Plain English.** An Organization is a hard wall between companies or business units on the same platform. Each user belongs to exactly one, plus optional guest memberships elsewhere. A Project tagged "Acme" is invisible to anyone not in Acme.

**Technical detail.**
- To see a Project, a user must be a member or guest of at least one Organization applied to it, so Organizations combine with OR. [Fact] https://www.palantir.com/docs/foundry/security/orgs-and-spaces/ . Contrast: Markings combine with AND. In write authorization, Organizations need "at least one". [Fact] https://palantir.com/docs/foundry/action-types/read-write-authorizations/
- Organizations protect spaces, Ontologies, Projects, users, groups, tag categories and collections. Individual files cannot be tied to an Organization, unlike Markings. [Fact] https://www.palantir.com/docs/foundry/security/orgs-and-spaces/
- A **space** is the top-level container, with one Ontology per space, restricted by Organizations. A Project in a multi-Organization space can use any subset of them. Organization discoverability (whether you can see other Organizations' names, users and groups) is admin-controlled. [Fact] same URL.
- Organizations propagate through the file hierarchy and through data dependencies. Removing them downstream uses `stop_requiring` and needs approval from holders of "Expand access" on each listed Organization. Stopping one Organization removes all inherited ones. [Fact] https://palantir.com/docs/foundry/building-pipelines/remove-inherited-markings/
- "Expand access" is defined as any change that widens who could reach a resource. That includes removing any Marking, adding an Organization when one already exists, and removing the only Organization. [Fact] https://www.palantir.com/docs/foundry/security/security-glossary/

### 3. Projects, roles and discretionary permissions

**Plain English.** A Project is a shared folder with a membership list. Roles (Owner, Editor, Viewer, Discoverer) say what you may do inside it. Example: the "Sales Dashboard" Project gives Viewer to group Sales-All, so everyone in sales can open the dashboard but not edit it.

**Technical detail.**
- **Default roles:** Owner, Editor, Viewer and Discoverer. Each role can grant itself or a lesser role. Roles are "independent sets of operations rather than a strict hierarchy". Grants inherit down to child resources. Folder- and file-level grants are off by default, so grants live only at the Project level; disabling them removes existing file grants. [Fact] https://www.palantir.com/docs/foundry/security/projects-and-roles/
- **Operations** are the atomic permissions that applications check, for example `stemma:mutate-default-branch`, and roles are bundles of operations. Custom roles live in **role sets** (Project, Ontology, Marketplace Installation defaults), which are applied per space. Every role belongs to exactly one set. Copies of the default Project set receive Palantir's future role updates. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-roles/
- **Default role on a Project:** the role automatically given to everyone who meets the access requirements. Without one, eligible users see only the Project name and description and can request access. New Projects default to Viewer. [Fact] https://www.palantir.com/docs/foundry/security/security-glossary/
- **Discoverer** can see that a resource exists. Discoverer is the only default role without download operations. [Fact] https://www.palantir.com/docs/foundry/security/download-controls/ . Cover pages can be made discoverable to the whole Organization even when the Project is marked, which supports "find, then request". [Fact] https://www.palantir.com/docs/foundry/security/cover-pages/
- **Access requests** need a reason, the target principals and the access type. Requests involving internal groups go to group admins. External groups redirect to a URL. Otherwise a Project Owner approves. [Fact] https://www.palantir.com/docs/foundry/security/projects-and-roles/
- **References:** builds need inputs and outputs in the same Project. Upstream datasets are brought in by reference, which requires Viewer on the source and Editor on the destination. Colleagues can view derived data without upstream access if they meet the Organization and Marking requirements. [Fact] same URL.
- **Project constraints** come in three kinds: no constraints, allowed Markings, or prohibited Markings. A violating file cannot be saved, and a violating dataset cannot be built. The purpose is to stop data that must stay apart from being joined. [Fact] https://www.palantir.com/docs/foundry/security/project-constraints/
- **What the user sees:** a "Check access" panel lists access requirements met or unmet, roles (direct, via group, or default) and "additional data requirements", such as an inherited Marking or a Workshop module's dependent object, link and action types. Lineage can be coloured by permission, and an access graph shows the relationships. [Fact] https://www.palantir.com/docs/foundry/security/checking-permissions/

### 4. Markings and marking categories

**Plain English.** A Marking is a sticker such as "PII" or "Case-1234". Only members of that Marking can see stickered things, whatever their role. Stickers spread to anything built from the data.

**Technical detail.**
- **Semantics:** a user must be a member of all Markings on a resource (conjunctive). Not meeting them means the resource cannot be discovered. Meeting the file Markings but not an inherited data Marking means the user sees the metadata, and an error appears when they try to read the data. [Fact] https://www.palantir.com/docs/foundry/security/markings
- **Categories:** created in Platform Settings and cannot be deleted. Visibility is "Visible" (others can see that the category and its Markings exist) or "Hidden" (invisible without Category Viewer). A category can be restricted to one Organization. Category Administrators edit the category and create Markings. Markings cannot be deleted or moved between categories. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/
- **Per-Marking permissions (independent):** Manage permissions, Apply marking, Remove marking, and Members. Someone can apply a Marking without being able to see the data. Applying a Marking also requires "Update Markings on resource" (in Owner by default). Membership is global, but users still need a role. [Fact] same URL.
- **Suggested patterns:** one Marking per sensitive category, per data owner, per pipeline stage (a "Raw" Marking removed after cleaning), or per case. Markings can also hide existence. [Fact] https://www.palantir.com/docs/foundry/security/markings
- **Apply safely:** a documented process of branch, lineage simulation, review of transaction types, `stop_propagating` where needed, then apply. Applying takes effect downstream immediately and can lock users out. [Fact] https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/ , https://www.palantir.com/docs/foundry/security/protecting-sensitive-data/
- **Row-level Markings:** a restricted view can be built from a STRING ARRAY column of Marking UUIDs, so a row is visible only to users holding all the Markings listed in it. "Mandatory control properties" expose the same thing on objects. The property must be non-null, though an empty array means visible to all. Allowed values are declared per datasource, and violating values fail indexing. Action types can take Marking parameters, so created objects are secured by the value supplied. [Fact] https://www.palantir.com/docs/foundry/security/restricted-views/ , https://www.palantir.com/docs/foundry/object-link-types/mandatory-control-properties/

### 5. Classification-based access controls (CBAC)

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

**Plain English.** A restricted view is a filtered window onto a table. Each viewer sees only the rows their attributes allow, for example "region column = my region attribute".

**Technical detail.**
- It is built on a backing dataset plus a granular policy. It cannot be used as an input to transforms. It rebuilds on a schedule when the input updates. It can back an object type. It inherits the input's Markings, which can be stopped on the view. Users who should see only the view must not have upstream access. [Fact] https://www.palantir.com/docs/foundry/security/restricted-views/
- Policies must reference users, groups and Organizations by UUID, not name. The docs recommend at least one user-attribute term. Marketplace packaging carries the policy but not the data, and supports only string and boolean constants. [Fact] same URL.
- For Ontology use, Palantir now recommends **object security policies** instead. They give unified cell-level security, near-instant policy updates, and support for streaming and branching. A migration tool exists, with listed exclusions: multi-datasource objects, range operators, numeric constants, and group, Organization or static Marking IDs as user properties. [Fact] https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/

### 8. Granular policies: syntax, user attributes, limits, weights

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

**Plain English.** On a business object like "Passenger", an object policy decides which passengers you can see. Property policies decide which fields, such as phone number, you can see on the passengers you can see.

**Technical detail.**
- **Checks for viewing an instance:** (1) Viewer on the object type, (2) passing the granular policy, (3) passing Marking, Organization and classification checks. With a policy in place, Viewer on the backing datasource is not needed (under project-based permissions). [Fact] https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/
- **Outcomes:** failing the object policy hides the object. Passing the object policy but failing a property policy shows that property as null. [Fact] same URL.
- **Rules:** a property policy requires an object policy to exist first. The primary key cannot be in a property policy. Each other property belongs to at most one property policy. Object policies inherit the datasource's mandatory controls by default, and inherited Markings can be removed. Editing policies requires Owner on the Project containing the object type. [Fact] same URL.
- **Materializations:** they get the most restrictive union of Markings. Old transactions keep the old policies, so rebuild after adding a Marking. [Fact] same URL.
- **Testing:** "Test policies" can simulate a user and hypothetical property values, including unsaved policies. It cannot test derived properties, and it does not consider guest Organizations unless the tester belongs to them. [Fact] same URL.
- **Display:** Workshop widgets can show Marking "pills" on each property. These are informational only. [Fact] https://www.palantir.com/docs/foundry/security/property-security-markings/

### 10. Ontology permissions (object types, links, actions, functions; project-based vs datasource-derived)

**Plain English.** Seeing that an object type "Building" exists is different from seeing the buildings. The type definition is permissioned like a file in a Project. The rows are permissioned by the object security policy or by the datasource.

**Technical detail.**
- **Project-based (current default for new Ontologies):** Ontology resources live in a Project, and the Project role decides who can view or edit their definitions. Viewer on an object type shows schema and contacts but not data. [Fact] https://www.palantir.com/docs/foundry/object-permissioning/ontology-permissions/
- **Legacy models:** in the datasource-derived model, you are editor on the object type if and only if you are editor on the datasource. In the Ontology-roles model, there are Ontology viewer, editor and owner roles. [Fact] same URL.
- **Edit rules:** editing a link type requires edit on the link type and on both object types. Editing an action type requires edit on it and on every type it edits. [Fact] same URL.
- **Objects with no backing datasource** must be saved in a Project and must have an object security policy. [Fact] https://palantir.com/docs/foundry/ontologies/ontology-permissions/
- **Functions:** executing one needs Viewer on the repository where it was published (otherwise `ReadFunctionsPermissionDenied`), and the function must be registered. Functions run as the calling user, so the same function returns different rows to different users. For function-backed actions, end users need only action permissions. Admin allowlists control "extended execution" (calling actions; tokens with a TTL of up to 4 hours). [Fact] https://palantir.com/docs/foundry/functions/permissions/
- **Downloads** are checked on the object type for Project-based types, and on the backing datasource otherwise. [Fact] https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/

### 11. Action permissions and submission criteria

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

### 12. Scoped sessions and emulation mode

**Plain English.** A scoped session is like logging in "wearing one hat". An analyst cleared for both Case-A and Case-B picks "Case-A session" at login and sees only Case-A data plus unmarked data, so the cases cannot be mixed by accident.

**Technical detail.**
- Admins define sessions in Control Panel ("Security presets & scoped sessions") as named sets of Markings, CBAC included. A user can select a session only if they are a member of all its Markings. While in a session, the user sees resources carrying one or more of the session's Markings, plus unmarked resources. [Fact] https://www.palantir.com/docs/foundry/administration/configure-scoped-sessions/
- **Selector modes:** Off, Auto (shown if the user has more than one session), or Always. "Unscoped access" can be granted to all users, to selected groups, or to all except selected groups; it is typical for admins. A banner shows the active session, and switching refreshes the page. [Fact] same URL; https://www.palantir.com/docs/foundry/security/markings
- **Group scoping and emulation mode (beta):** users can drop groups and Markings to test what others see. Organizations and attributes stay unchanged, and inherited group membership still applies. [Fact] https://www.palantir.com/docs/foundry/security/emulation-mode/
- **Enforcement:** the scope is carried on the session token. This is shown by the LLM check, which reads "the mandatory Markings on the user's current Foundry session, as represented on the request token". [Fact] https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/ . This is also why `NOT` conditions are dangerous: scoped tokens carry only a subset of attributes. [Fact] https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/

### 13. Purpose-based access: Checkpoints (justification prompts)

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

### 14. Approvals workflow

**Plain English.** If you lack permission to make a change, you can request it. The right reviewers approve it, and the platform then applies it automatically.

**Technical detail.**
- **Request types:** group membership, Project access, Marking access, add reference, and Ontology proposal. Each task has its own eligible reviewers, for example Manage membership on a group, Project Owner, Manage permissions on a Marking, or Ontology Owner. [Fact] https://www.palantir.com/docs/foundry/approvals/overview/
- **Task states:** Review, Approved, Rejected (a rejection can be overridden while the request is open). **Request states:** Pending approval, Changes requested, Action required (for example a checkpoint is outstanding), Completed, Closed, Rejected and Closed. All tasks must be approved before the change is invoked. Reviewers can complete checkpoints on the requester's behalf. Members of large groups (50 or more) do not get reviewer notifications. Completed requests remain as a record. [Fact] same URL.
- **AI-generated changes:** Palantir MCP has no destructive write tools. Ontology changes go through Ontology proposals, which need human approval to merge. [Fact] https://www.palantir.com/docs/jp/foundry/palantir-mcp/security/ (Japanese-locale page, read in English summary)

### 15. Audit logs

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

### 16. Data retention and lineage-aware deletion (Data Lifetime)

**Plain English.** You set "delete raw customer uploads after N" on the root table, and every table derived from those rows is deleted too.

**Technical detail.**
- **Policies** are defined per namespace and applied to datasets. They assign deletion dates to transactions.
- **Types:**
  - Fixed deletion date (all transactions, or those before a cutoff).
  - Keep latest view only (transactions outside the current view are marked for immediate deletion; new SNAPSHOTs trigger re-evaluation).
- Downstream transactions inherit the deletion date of their parents. The docs recommend applying policies at root datasets.
- The older Retention app is not lineage-aware.
- Roles: the Data Governance Officer creates policies. Dataset Editors can set or remove them. Overrides need a higher level of access.

[Fact] https://www.palantir.com/docs/foundry/data-lifetime/core-concepts-data-lifetime/ , https://www.palantir.com/docs/foundry/data-lifetime/deletion-policies-implications/

- Policies apply to datasets only, not media sets or models. Evaluations and deletions are rate-limited. Marking happens several times a day, and physical removal from storage such as S3 typically takes up to about 30 days. [Fact] https://www.palantir.com/docs/foundry/data-lifetime/FAQ/ . Checkpoints can require justification for applying a policy ("Retention policy application"). [Fact] https://www.palantir.com/docs/foundry/data-lifetime/getting-started/ , https://www.palantir.com/docs/foundry/checkpoints/checkpoint-types/
- Deletion eventually becomes irreversible, and the docs recommend eligibility reviews before it. [Fact] https://www.palantir.com/docs/foundry/security/data-protection-and-governance/

### 17. Sensitive Data Scanner (SDS)

**Plain English.** A background job looks for things like card numbers or emails in new data and automatically stickers the dataset "PII" and opens a ticket.

**Technical detail.**
- **Match conditions:** regex (built-ins exist for SSNs, emails and phone numbers), overlap (values also found in a reference dataset column), or a language model given a natural-language prompt over content and/or column names.
- **Match actions:** create an Issue, apply Markings, or obfuscate with Cipher (encrypt or hash).

[Fact] https://www.palantir.com/docs/foundry/sensitive-data-scanner/core-concepts/

- **Scope:** datasets, virtual tables, and media sets (audio, document and image). Include or exclude folders, with the most specific rule winning, and filter by Marking. The recommended strategy is "source datasets only". Sampling options are all rows (recommended) or an approximate random subset.
- **Schedules:** one-time; daily at 00:00 UTC; weekly on Tuesday at 00:00 UTC; monthly on the 1st; or continuous on new data. A compute estimate is shown at review.

[Fact] https://www.palantir.com/docs/foundry/sensitive-data-scanner/create-a-sensitive-data-scan/

### 18. Encryption and key management

- **Platform level:** the docs state only that all data is encrypted in transit and at rest with modern cryptography, that this is included in the standard offering, and that encryption in transit and at rest is Palantir's responsibility under the shared model. They give no algorithms, TLS versions, per-tenant keys or BYOK details. [Fact] https://www.palantir.com/docs/foundry/security/overview , https://www.palantir.com/docs/foundry/security/shared-security-responsibility-model/ . Customer-managed keys: [Unverified]. Not found in the public docs, and the Trust Center (SafeBase) content requires an NDA.
- **Cipher (app-level field crypto):**
  - A Channel defines the algorithm and key. A License (a filesystem resource tied to one Channel) grants use: whoever can view the License can perform its operations.
  - Values are stored as `CIPHER::<channel-rid>::<value>::CIPHER`.
  
  [Fact] https://palantir.com/docs/foundry/cipher/core-concepts/
  - Algorithms: AES_GCM_SIV (probabilistic), AES_SIV / AES-256-SIV (deterministic, recommended when joins are needed), SHA-256 or SHA-512 with a pepper, and reversible image scrambling.
  - Keys: a stretched key derived from a secret (recommended), or a 64-character base64 key. Hash secrets must be at least 14 characters.
  - License tiers: Operational User (single values, cell-level audit, optional rate limits, can bypass checkpoints for use in Functions and APIs), Data Manager (whole columns), Admin (key access; the docs warn that allowing operations in Transforms effectively grants key access).
  
  [Fact] https://palantir.com/docs/foundry/cipher/getting-started/
- Downloaded Cipher values stay encrypted. [Fact] https://www.palantir.com/docs/foundry/security/download-controls/

### 19. Third-party apps, OSDK apps, tokens and scoping

**Plain English.** An external app (your customer portal, a script, an agent) gets an OAuth client. An admin decides which Ontology types, Projects and API families it may ever touch. Each token it gets is the overlap of that ceiling and the user's own rights.

**Technical detail.**
- **Client types:** confidential (authorization code plus client credentials) or public (authorization code with PKCE only). Client credentials create a **service user** whose username equals the client ID, with no access by default. The secret is shown once and rotated if lost. [Fact] https://www.palantir.com/docs/foundry/platform-security-third-party/register-3pa/
- **OAuth details:** PKCE verifier of 43–128 characters with S256. Authorization codes expire in 10 minutes. `offline_access` is needed for refresh tokens. Refresh tokens rotate on each use. Reusing one more than 1 minute after first use revokes every token from that grant. Inactive refresh tokens expire after 30 days. [Fact] https://www.palantir.com/docs/foundry/platform-security-third-party/writing-oauth2-clients/
- **Developer Console restrictions:**
  - Effective permission = user (or service user) permissions ∩ app maximum restrictions ∩ requested scope. A token with no scope has no permissions.
  - Restrictions list Ontology resources (object types, interfaces, actions, functions), Projects, and API operation namespaces (`use-` scopes are public APIs only; namespaces do not grant each other's endpoints).
  - A few identity endpoints are always allowed. Out-of-scope calls return `ApiUsageDenied`.
  - Restricted is the default; switching to unrestricted wipes the restrictions.
  
  [Fact] https://palantir.com/docs/foundry/developer-console/application-restrictions/
- **Organization enablement:** each Organization must enable an app before its users can use it, including the Organization that registered it. Enablement can narrow access by Project and by Marking (intersection; the docs recommend leaving these Unrestricted). Each user consents through OAuth, unless Organization-level consent is turned on (not recommended). Disabling an app invalidates authorizations, and users must re-consent. [Fact] https://www.palantir.com/docs/foundry/platform-security-third-party/enabling-3pa-access/
- **Personal tokens:** expiry is set by the user. A token is shown once and can be disabled or revoked. Holding one "is equivalent to possessing a user's username and password". Personal tokens are not for production. Inactive accounts invalidate them. [Fact] https://www.palantir.com/docs/foundry/platform-security-third-party/user-generated-tokens/
- **Service accounts guidance:** a named owner, periodic review, IP restriction, credentials held in a privileged-access-management (PAM) tool, rotation, and monitoring. [Fact] https://www.palantir.com/docs/foundry/security/single-sign-on-security/

### 20. LLM calls and agents

**Plain English.** The model only receives what the calling identity could already see. Admins can also say "model X may never receive anything from a session marked HR-Confidential". Agents get their own narrowly scoped credentials.

**Technical detail.**
- **Model allowlist by Marking:** the setting is "Allow any data" or "Allow only these Markings". It is set per enrollment (covering all Palantir-provided model families) or per registered model, where it replaces the enrollment policy and can be stricter or looser. The check reads the Markings on the session token; a token with no mandatory Markings passes. A scoped session can bring a token within the allowlist. [Fact] https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
- **Model enablement:**
  - AIP can be enabled for Everyone, for groups, or for Nobody, and restricted to Organizations. A resource is AIP-enabled only if AIP is enabled for all Organization Markings on its Project.
  - Model families are enabled per Organization. Their states are Enabled, Disabled, or Disallowed (legal or geographic reasons).
  - Enabling a family requires accepting subprocessor terms.
  
  [Fact] https://palantir.com/docs/foundry/aip/enable-aip-features/
- **Provider data handling:** Palantir says no customer data in prompts or completions is retained by third-party providers, it is not used for training, and provider personnel cannot access it. Regional endpoints exist in the US, UK and EU for some models. [Vendor claim] https://palantir.com/docs/foundry/aip/aip-security/
- **Execution identity:**
  - AIP Logic is user-scoped by default (each user sees their own logs, kept 24 hours). Project-scoped mode runs with the Project's permissions, needs every resource imported into the Project, and keeps a run-history dataset of the latest 10,000 runs. [Fact] https://palantir.com/docs/foundry/logic/execution-mode-settings/
  - Automate evaluates conditions and runs action, Logic and Function effects as the automation owner, and submission criteria are checked against the owner. Notifications are rendered with each recipient's permissions. Automations owned by a third-party app run as its service user. [Fact] https://palantir.com/docs/foundry/automate/permissions/
  - Pro-code agents (Claude Agent SDK, OpenAI Agents SDK, Google ADK, in Code Repositories) get platform-managed OSDK, Ontology MCP and Palantir MCP credentials. The agent's access is bounded by the Ontology binding chosen at publish time and by the restrictions on its client application. [Fact] https://palantir.com/docs/foundry/agents/scoped-permissions/ , https://palantir.com/docs/foundry/agents/overview/
  - Palantir's January 2026 engineering blog says an agent's permissions derive from three parties: the configuring owner, the agent's service user or OSDK scope, and the user it acts for at that moment. It also says memory (working, episodic, semantic, procedural) is policy-checked at runtime. [Vendor claim] Read via an aggregator copy of blog.palantir.com/securing-agents-in-production-agentic-runtime-1-5191a0715240 (dated 22 Jan 2026 per engineered.at); I could not open the original. https://scour.ing/@matmat/p/https:/blog.palantir.com/securing-agents-in-production-agentic-runtime-1-5191a0715240
- **Chatbot (Agent) Studio tools:** Action tools are configured to run automatically or after user confirmation. Object query tools are limited to configured object types and properties. Function tools are latest or pinned version. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/tools/ . Per-tool user-permission mechanics are not documented on that page. [Inference] They follow the function and action rules above (runs as user).
- **Logs:** session logs capture the system prompt, tools, inputs and outputs, and retrieval context, under per-message trace IDs, and can be exported to a stream that should be Marked. [Fact] https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/ . Trace and service logs do not inherit Markings. Viewing them needs Edit on the source executor, log access enabled, and all Markings applied to the logs. Users see their own executions for 24 hours. [Fact] https://palantir.com/docs/foundry/aip-observability/log-permissioning/
- **Propagation gap:** data returned to the model by tools carries no link to its source policy. [Fact] https://palantir.com/docs/foundry/security/access-control-propagation/ . That is why the token-level Marking allowlist exists. [Inference]

### 21. Privacy and civil liberties (PCL) engineering guidance

Palantir maps seven practices to features:
1. Proportionality and minimization: SDS, Markings, Cipher.
2. Purpose limitation: Checkpoints, Approvals, field-limited exports. An approval does not authorize unrelated future uses.
3. Access governance: least privilege, groups, and separating eligibility for a data type (Marking) from the workflow role (role).
4. Privacy-enhancing transformations: transformation is not anonymization, so pair it with access controls.
5. Human oversight: reviewers need context and the authority to change outcomes; there is an example of an agent decision log a planner can accept or reject.
6. Accountability: named owners and defined review cadences. "Records alone don't create accountability."
7. Retention set early, accounting for derived copies.

[Fact] https://www.palantir.com/docs/foundry/privacy-civil-liberties/pcl-in-practice/

### 22. Certifications

- FedRAMP High for Palantir Federal Cloud Service and its supporting services, covering AIP, Apollo, Foundry, Gotham, FedStart and Mission Manager (around 3 December 2024). The release also cites FedRAMP Moderate, IL5 and IL6. [Vendor claim] https://www.businesswire.com/news/home/20241203054493/en/Palantir-Granted-FedRAMP-High-Baseline-Authorization
- CMMC Level 2 via a C3PAO (17 September 2025). Palantir says it is one of only six cloud providers at IL6. [Vendor claim] https://www.nasdaq.com/press-release/palantir-technologies-achieves-cybersecurity-maturity-model-certification-cmmc-level
- IRAP PROTECTED in Australia (release around 20 November 2025, date inferred from the URL). [Vendor claim] https://www.nasdaq.com/press-release/palantir-achieves-information-security-registered-assessors-program-irap-protected
- The public ISO 27001:2013 certificate I found (Schellman, aligned with 27017 and 27018) ran from 2 April 2021 to 1 April 2024. A current certificate was not verified. [Fact] https://www.palantir.com/assets/xrfr7uokpv1b/1JMPgco1t6e4e2UTdVITLb/605c77226cd62440357725f310eef46d/Palantir_ISO_27001_Certificate_of_Registration.pdf
- A reseller page lists SOC 2 Type 2, SOC 3, ISO 27001/27017/27018/9001, FedRAMP High, IL2/5/6, CMMC, Cyber Essentials Plus, and the NHS DSPT. This is a secondary source, undated. https://www.carahsoft.com/palantir/security . The official list is in the Trust Center (palantir.safebase.us), which mostly sits behind an NDA. [Fact] https://www.palantir.com/docs/foundry/security/overview

---

## What to copy

1. **Make the access decision three independent checks combined with AND: mandatory, then role, then row and column policy.** Implement `can_read(user, resource) = mandatory_ok(user, resource) AND has_role(user, resource, op) AND policy_filter(user, rows)`. Roles can only add permissions and must never bypass the mandatory check. This removes the "Owner of a PII table can see PII" class of bug. Source: https://www.palantir.com/docs/foundry/security/security-glossary/
2. **Store Markings as sets on every resource and on every derived output.** When computing any artifact (metric table, report, cached answer, embedding index), set `output.markings = union(input.markings) − explicitly_stopped`. Mark Organizations with ANY semantics and Markings with ALL semantics. Source: https://palantir.com/docs/foundry/security/access-control-propagation/ , https://www.palantir.com/docs/foundry/security/orgs-and-spaces/
3. **Separate the permissions on each Marking:** manage, apply, remove (expand access) and member. Make "remove" a distinct, audited permission that Owner does not imply. Remove inherited Markings only through a reviewed change (a PR or approval request) naming the Marking, the input and the scope. Source: https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/ , https://palantir.com/docs/foundry/building-pipelines/remove-inherited-markings/
4. **Three-tier visibility:** no mandatory access means invisible (excluded from search). Mandatory met on the file but not on the inherited data means metadata only, with an explanatory error. Full access shows data. A Discoverer-like role can see existence and request access. Source: https://www.palantir.com/docs/foundry/security/markings , https://www.palantir.com/docs/foundry/security/cover-pages/
5. **Row policies as compiled predicate templates.** Define a policy AST: All/Any/Not plus comparisons (eq, lt, lte, gt, gte, intersects, subset, superset) over operands {field, user.id, user.groups, user.orgs, user.markings, user.attr[k], constant}. Resolve user-only nodes once per request, then compile the rest into a SQL WHERE or vector-store filter. Adopt the weight budget (0 / 1 / 1,000 / 3,000, cap 10,000) to bound query cost. Store IDs, never names. Treat null policy columns as deny-all, and fail the build if one appears. Source: https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/
6. **Ban `NOT` on membership in policy validation** (groups, Markings, Organizations), because scoped or partial tokens make it over-grant. Source: same URL, and https://palantir.com/docs/foundry/action-types/submission-criteria/
7. **Object policy plus property policies for cell-level security.** On each business object type: one object policy (row), and optional property policies, each covering a disjoint set of non-key properties. Failing a property policy returns null, not an error. Count weight as the object policy plus one property policy. Source: https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/
8. **Separate schema permission from data permission.** Seeing the "Customer" type definition comes from a Project role. Seeing customers comes from the object policy. Agents should get schema broadly (to plan) and data narrowly. Source: https://www.palantir.com/docs/foundry/object-permissioning/ontology-permissions/
9. **All writes through typed Actions with submission criteria.** Each action declares parameters, edits, and criteria conditions over (current user ID, groups, attributes), (parameter values and object-parameter properties) and (execution context), nested all/any/none, each with a human-readable failure message. Make object types "edit only via actions" by default. Return the failure message to agents verbatim so they can explain or escalate. Source: https://palantir.com/docs/foundry/action-types/submission-criteria/ , https://palantir.com/docs/foundry/action-types/permissions/
10. **Write-floor checks on actions:** an action may declare the minimum Markings its outputs must carry. Reject the edit if the result would be less protected. Detect declassification when the action is saved and require the "remove" permission from its author. Source: https://palantir.com/docs/foundry/action-types/read-write-authorizations/
11. **Per-model data allowlists checked against the session token.** For every LLM call, compute the caller's active Markings (session scope) and reject if any is outside the model's allowlist. Store a default policy at tenant level plus per-model overrides that replace it. This lets "Qwen hosted region X" be barred from HR data while Claude is allowed. Source: https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
12. **Scoped sessions:** let a user (or an agent run) choose a subset of Markings for a session, carried on the token, with visible = (resources ∩ session Markings) ∪ unmarked. Use this for external customer-facing agents: their token carries only the "Customer-Public" scope. Source: https://www.palantir.com/docs/foundry/administration/configure-scoped-sessions/
13. **Explicit execution identity for every agent and automation,** recorded in audit: user-scoped (default), project-scoped (resources must be imported into the project), owner-scoped (automations), or service user. Render notifications under each recipient's permissions. Source: https://palantir.com/docs/foundry/logic/execution-mode-settings/ , https://palantir.com/docs/foundry/automate/permissions/
14. **Token = user ∩ app ceiling ∩ requested scope.** Each agent or app registers a ceiling (allowed object types, actions, functions, projects, API families). No scope means no permissions. Out-of-scope calls return a typed `ApiUsageDenied`-style error. Refresh tokens rotate, with a 1-minute reuse grace and revoke-all on replay. Source: https://palantir.com/docs/foundry/developer-console/application-restrictions/ , https://www.palantir.com/docs/foundry/platform-security-third-party/writing-oauth2-clients/
15. **Agent action tools can require confirmation:** each action tool is either "auto" or "confirm". Default to confirm for anything external-facing. Source: https://www.palantir.com/docs/foundry/chatbot-studio/tools/
16. **Checkpoints as a generic justification interceptor.** Define a list of interaction types (export, bulk read, action submit, role grant, marking membership change, token create, login). A configuration = types + scope + matchers (user, group, Marking, action type) + a prompt (acknowledge, text with regex, dropdown, re-auth). Store an immutable record with a frozen copy of the prompt text and references to the items. Source: https://www.palantir.com/docs/foundry/checkpoints/configure-checkpoints/ , https://www.palantir.com/docs/foundry/checkpoints/core-concepts/
17. **Approvals as request → tasks → per-task reviewers → auto-apply.** Model the states exactly: Pending, Changes requested, Action required, Completed, Closed. Use the same engine for "agent proposes an Ontology or rule change". Source: https://www.palantir.com/docs/foundry/approvals/overview/ , https://www.palantir.com/docs/jp/foundry/palantir-mcp/security/
18. **Category-typed audit events.** Use the audit.3 shape: `{time, uid, product, categories[], entities[], users[], requestFields{}, resultFields{}, result}`, with per-category field contracts. Include `authorizationCheck` (succeeded and failed targets), `onBehalfOf`, `inApplicationContext`, `userJustify`, `llmInference`. Expose a cursor-paged export API whose next-page token is always returned. Source: https://www.palantir.com/docs/foundry/security/audit-log-categories/ , https://www.palantir.com/docs/foundry/security/audit-logs-overview/
19. **Mark agent logs explicitly.** Prompts and traces are sensitive. When enabling log viewing for an agent, require the admin to pick Markings for the logs, and show users their own runs for 24 hours by default. Source: https://palantir.com/docs/foundry/aip-observability/log-permissioning/
20. **Lineage-aware deletion.** Record parent→child links for derived rows and artifacts. A deletion policy on a root source cascades to derived data. Show the "deletion date" per item, rate-limit the deletes, and require justification to apply a policy. Source: https://www.palantir.com/docs/foundry/data-lifetime/core-concepts-data-lifetime/
21. **Sensitive data scan on ingestion:** use regex built-ins, overlap with known values, and an LLM classifier over column names and samples. Actions are apply Marking or create a review issue. Scan only source data by default. Source: https://www.palantir.com/docs/foundry/sensitive-data-scanner/core-concepts/
22. **Login-time Organization and group assignment from identity-provider claims,** with ordered rules and a fallback. No Organization means login is blocked. A stable immutable user ID (not email). Group sync on each login or by SCIM. Source: https://www.palantir.com/docs/foundry/authentication/org-assignment , https://www.palantir.com/docs/foundry/authentication/saml-getting-started
23. **"Check access" explanation API:** for (user, resource), return which Organization, Marking, role and policy conditions are met or unmet, and which dependent resources are missing. The same output lets an agent explain refusals. Source: https://www.palantir.com/docs/foundry/security/checking-permissions/
24. **Group membership expiry** with a max duration and a reminder 7 days before. It is cheap and covers temporary contractor access. Source: https://www.palantir.com/docs/foundry/platform-security-management/manage-groups/

---

## What cannot or should not be copied

- **CBAC (classification hierarchies, releasability, validity rules)** is built for government and needs Palantir to configure it. A 100–1,000-staff company does not need it, and it adds a whole lattice system. Ordinary conjunctive Markings plus Organizations cover the commercial cases. [Inference] from https://www.palantir.com/docs/foundry/security/classification-based-access-controls/
- **Transaction-level propagation through Spark pipelines and protected-branch unmarking in code repositories.** Palantir's model assumes customers write transforms in Foundry repositories. A small product that does not host customer pipelines should propagate Markings at the level of its own derived artifacts (metric definitions, cached tables, indexes). It should replace `stop_propagating` PRs with an Approvals request naming the Marking and output. [Inference] from https://palantir.com/docs/foundry/building-pipelines/remove-inherited-markings/
- **Infrastructure certifications (FedRAMP High, IL5/IL6, IRAP, CMMC)** reflect years of audited operations and dedicated government clouds. They cannot be copied as features. A small product should target SOC 2 Type 2 and ISO 27001 and inherit infrastructure controls from its cloud provider. [Inference]
- **The "no retention, no training" guarantees for providers** are contractual. Palantir negotiates them. A small vendor must rely on each provider's own zero-data-retention terms (for example enterprise API terms) and must not claim more than those contracts say. [Inference] from https://palantir.com/docs/foundry/aip/aip-security/
- **Cipher's full licence tiering and visual obfuscation** are overkill early on. Use deterministic encryption only where joins on pseudonymised IDs are truly needed. [Inference]
- **Rubix and Kubernetes workload isolation details** are Palantir infrastructure, and the public detail is only blog level. [Vendor claim; not reproducible from docs]
- **Restricted views as a separate object.** Palantir itself now steers Ontology use toward object security policies. Do not build both. [Fact] https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/
- **Do not copy:** Organization-level OAuth consent, unrestricted apps, or personal tokens for production. Palantir's own docs advise against all three. [Fact] https://www.palantir.com/docs/foundry/platform-security-third-party/enabling-3pa-access/ , https://www.palantir.com/docs/foundry/platform-security-third-party/user-generated-tokens/

---

## Minimum faithful version for a small product

The ordering is: what is essential on day one, then what can wait, each with the Palantir source it copies.

**Essential (v0):**
1. **Identity via OIDC/SAML with a stable user ID, group claims and attributes, and Organization assignment at login** (one Organization per customer tenant; tenants are walls). Source: https://www.palantir.com/docs/foundry/authentication/saml-getting-started , https://www.palantir.com/docs/foundry/authentication/org-assignment
2. **Projects with four roles (Owner, Editor, Viewer, Discoverer), granted to groups at Project level only.** Source: https://www.palantir.com/docs/foundry/security/projects-and-roles/
3. **Markings (conjunctive), with separate apply, remove and member permissions,** propagated to all derived artifacts the product creates (metrics, reports, agent memory, vector indexes). Source: https://www.palantir.com/docs/foundry/security/markings , https://palantir.com/docs/foundry/security/access-control-propagation/
4. **Object security policy plus property security policies (cell-level) on business objects,** using the policy AST with the weight cap and the NOT ban, and null on property failure. Source: https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/ , https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/
5. **Actions as the only write path, with submission criteria and failure messages.** Source: https://palantir.com/docs/foundry/action-types/submission-criteria/
6. **Agent execution identity:** user-scoped by default, plus a service user for external agents, plus token = principal ∩ app ceiling ∩ scope. Source: https://palantir.com/docs/foundry/logic/execution-mode-settings/ , https://palantir.com/docs/foundry/developer-console/application-restrictions/
7. **Per-model Marking allowlist checked against the session token** on every LLM call. This matters directly because the product uses Claude, GPT and Qwen under different data terms. Source: https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/
8. **Confirm-before-execute flag on agent action tools.** Source: https://www.palantir.com/docs/foundry/chatbot-studio/tools/
9. **audit.3-shaped event log,** including authorizationCheck, llmInference, onBehalfOf and dataExport, with a cursor API. Mark the agent logs. Source: https://www.palantir.com/docs/foundry/security/audit-log-categories/ , https://palantir.com/docs/foundry/aip-observability/log-permissioning/
10. **Check-access explainer** (needed by both admins and agents). Source: https://www.palantir.com/docs/foundry/security/checking-permissions/

**Optional at small scale (v1+):**
- Checkpoints (start with export and bulk-read justification only). https://www.palantir.com/docs/foundry/checkpoints/configure-checkpoints/
- Approvals engine (start with "request access" and "agent-proposed change"). https://www.palantir.com/docs/foundry/approvals/overview/
- Scoped sessions (needed once one user holds incompatible Markings, or for customer-facing agents' narrowed tokens). https://www.palantir.com/docs/foundry/administration/configure-scoped-sessions/
- Read and write marking authorizations on actions. https://palantir.com/docs/foundry/action-types/read-write-authorizations/
- Project constraints (allowed or prohibited Markings). https://www.palantir.com/docs/foundry/security/project-constraints/
- Lineage-aware deletion policies. https://www.palantir.com/docs/foundry/data-lifetime/core-concepts-data-lifetime/
- Sensitive data scanner (regex plus LLM classifier). https://www.palantir.com/docs/foundry/sensitive-data-scanner/core-concepts/
- Group membership expiry. https://www.palantir.com/docs/foundry/platform-security-management/manage-groups/
- Emulation mode for admins. https://www.palantir.com/docs/foundry/security/emulation-mode/
- Custom role sets and operation-level roles. https://www.palantir.com/docs/foundry/platform-security-management/manage-roles/

**Skip:** CBAC, Cipher licence tiers, code-level unmarking, restricted views as a separate concept.

---

## Open questions and unverified items

- **Encryption at rest and in transit internals** (algorithms, per-tenant keys, BYOK/CMK, TLS versions) are not in the public docs. [Unverified]
- **The full audit.3 top-level schema:** only `time`, `uid`, `product`, `categories`, `entities`, `users`, `requestFields`, `resultFields` and `result` are documented on the pages I read. Fields like session ID, token ID, IP and trace ID are [Unverified].
- **Whether submission criteria are re-evaluated server-side for API/SDK submissions** is not stated. [Inference] They must be, since API calls bypass the UI. [Unverified]
- **Chatbot (Agent) Studio's exact per-tool permission checks** and the identity used for retrieval context were not documented on the pages read. Ontology MCP security was not read; my search budget ran out before I could locate the page.
- **Maximum session lifetime and access-token TTL values:** the docs say "relatively short" and return `expires_in` without giving defaults. The 4-hour cap applies only to function-obtained tokens.
- **Organization guest membership** mechanics, and what happens when attributes change between logins, are not covered.
- **Certifications:** the only public ISO 27001 certificate found expired on 1 April 2024. The current SOC 2 and ISO status comes from a reseller page; the Trust Center needs an NDA. The IRAP date is inferred from the URL.
- **The agent security blog post** was read through an aggregator, not the original Medium URL. Its claims are vendor-level and unaudited.
- **The "remove inherited markings" page** was very long, and only the later portion containing the syntax was read in detail.

---

## Sources (ranked by usefulness)

1. https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/ — policy operands, comparisons, the weight table and failure modes; the core of row security.
2. https://www.palantir.com/docs/foundry/object-permissioning/object-security-policies/ — object and property (cell-level) security rules, the three checks, limits, testing.
3. https://palantir.com/docs/foundry/security/access-control-propagation/ — the mandatory vs discretionary split and exactly where propagation stops (including LLM tool calls).
4. https://www.palantir.com/docs/foundry/platform-security-management/manage-markings/ — Marking and category permissions, apply and remove procedure.
5. https://palantir.com/docs/foundry/building-pipelines/remove-inherited-markings/ — `stop_propagating`/`stop_requiring` syntax and approval model.
6. https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/ — per-model Marking allowlist checked on the session token.
7. https://palantir.com/docs/foundry/developer-console/application-restrictions/ — token intersection model and app ceilings.
8. https://palantir.com/docs/foundry/action-types/submission-criteria/ , https://palantir.com/docs/foundry/action-types/permissions/ , https://palantir.com/docs/foundry/action-types/read-write-authorizations/ — write-path governance.
9. https://www.palantir.com/docs/foundry/security/audit-log-categories/ and https://www.palantir.com/docs/foundry/security/audit-logs-overview/ — audit.3 category contracts, delivery, latency, retention.
10. https://www.palantir.com/docs/foundry/checkpoints/checkpoint-types/ , https://www.palantir.com/docs/foundry/checkpoints/configure-checkpoints/ , https://www.palantir.com/docs/foundry/checkpoints/core-concepts/ — justification mechanics and records.
11. https://palantir.com/docs/foundry/logic/execution-mode-settings/ and https://palantir.com/docs/foundry/automate/permissions/ — agent and automation execution identity.
12. https://palantir.com/docs/foundry/aip-observability/log-permissioning/ — logs do not inherit Markings.
13. https://www.palantir.com/docs/foundry/security/security-glossary/ — precise definitions (expand access, default role, mandatory controls).
14. https://www.palantir.com/docs/foundry/security/markings — Marking semantics and user experience.
15. https://www.palantir.com/docs/foundry/administration/configure-scoped-sessions/ — scoped sessions.
16. https://www.palantir.com/docs/foundry/approvals/overview/ — request and task state machine.
17. https://www.palantir.com/docs/foundry/data-lifetime/core-concepts-data-lifetime/ , https://www.palantir.com/docs/foundry/data-lifetime/deletion-policies-implications/ , https://www.palantir.com/docs/foundry/data-lifetime/FAQ/ — lineage-aware deletion.
18. https://www.palantir.com/docs/foundry/authentication/saml-getting-started , https://www.palantir.com/docs/foundry/authentication/org-assignment — identity mapping.
19. https://www.palantir.com/docs/foundry/platform-security-third-party/writing-oauth2-clients/ , https://www.palantir.com/docs/foundry/platform-security-third-party/enabling-3pa-access/ , https://www.palantir.com/docs/foundry/platform-security-third-party/register-3pa/ — OAuth specifics.
20. https://www.palantir.com/docs/foundry/sensitive-data-scanner/core-concepts/ , https://www.palantir.com/docs/foundry/sensitive-data-scanner/create-a-sensitive-data-scan/ — SDS.
21. https://palantir.com/docs/foundry/cipher/getting-started/ , https://palantir.com/docs/foundry/cipher/core-concepts/ — field crypto.
22. https://www.palantir.com/docs/foundry/security/classification-based-access-controls/ — CBAC (for contrast).
23. https://www.palantir.com/docs/foundry/privacy-civil-liberties/pcl-in-practice/ — PCL practice-to-feature mapping.
24. https://palantir.com/docs/foundry/agents/scoped-permissions/ , https://palantir.com/docs/foundry/agents/overview/ — pro-code agent credentials.
25. https://www.palantir.com/docs/foundry/chatbot-studio/tools/ , https://www.palantir.com/docs/foundry/chatbot-studio/session-logging/ — chatbot tool confirmation and logs.
26. https://palantir.com/docs/foundry/functions/permissions/ , https://palantir.com/docs/foundry/ontologies/ontology-permissions/ , https://www.palantir.com/docs/foundry/object-permissioning/ontology-permissions/ — Ontology and function permissions.
27. https://www.palantir.com/docs/foundry/security/projects-and-roles/ , https://www.palantir.com/docs/foundry/platform-security-management/manage-roles/ , https://www.palantir.com/docs/foundry/platform-security-management/manage-groups/ , https://www.palantir.com/docs/foundry/platform-security-management/manage-users/ — roles, groups, users.
28. https://www.palantir.com/docs/foundry/security/checking-permissions/ , https://www.palantir.com/docs/foundry/security/emulation-mode/ , https://www.palantir.com/docs/foundry/security/project-constraints/ , https://www.palantir.com/docs/foundry/security/download-controls/ , https://www.palantir.com/docs/foundry/security/cover-pages/ — supporting mechanisms.
29. https://www.palantir.com/docs/foundry/security/single-sign-on-security/ , https://www.palantir.com/docs/foundry/security/shared-security-responsibility-model/ , https://www.palantir.com/docs/foundry/security/overview — identity hygiene and shared responsibility.
30. https://palantir.com/docs/foundry/aip/aip-security/ , https://palantir.com/docs/foundry/aip/enable-aip-features/ — AIP provider claims and enablement.
31. https://www.palantir.com/docs/jp/foundry/palantir-mcp/security/ — MCP write limits (Japanese-locale page).
32. https://scour.ing/@matmat/p/https:/blog.palantir.com/securing-agents-in-production-agentic-runtime-1-5191a0715240 — aggregator copy of the Jan 2026 agent-security blog post (vendor claims).
33. https://www.businesswire.com/news/home/20241203054493/en/Palantir-Granted-FedRAMP-High-Baseline-Authorization (Dec 2024), https://www.nasdaq.com/press-release/palantir-technologies-achieves-cybersecurity-maturity-model-certification-cmmc-level (Sep 2025), https://www.nasdaq.com/press-release/palantir-achieves-information-security-registered-assessors-program-irap-protected (Nov 2025), ISO certificate PDF (2021–2024), https://www.carahsoft.com/palantir/security (reseller, undated) — certifications.
