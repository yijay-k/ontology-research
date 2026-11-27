# Identity and auth

**Layer:** [01-security](README.md) · **What it is:** Who a user or service is: authentication, SSO, groups, roles, scoped sessions and third-party app tokens.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (4)

## Palantir

### 1. Authentication and identity (Multipass, SSO, groups, Organizations, attributes)

> Source: [general-references/04-palantir-security.md § 1. Authentication and identity (Multipass, SSO, groups, Organizations, attributes)](../../general-references/04-palantir-security.md#1-authentication-and-identity-multipass-sso-groups-organizations-attributes)

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

### 3. Projects, roles and discretionary permissions

> Source: [general-references/04-palantir-security.md § 3. Projects, roles and discretionary permissions](../../general-references/04-palantir-security.md#3-projects-roles-and-discretionary-permissions)

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

### 12. Scoped sessions and emulation mode

> Source: [general-references/04-palantir-security.md § 12. Scoped sessions and emulation mode](../../general-references/04-palantir-security.md#12-scoped-sessions-and-emulation-mode)

**Plain English.** A scoped session is like logging in "wearing one hat". An analyst cleared for both Case-A and Case-B picks "Case-A session" at login and sees only Case-A data plus unmarked data, so the cases cannot be mixed by accident.

**Technical detail.**
- Admins define sessions in Control Panel ("Security presets & scoped sessions") as named sets of Markings, CBAC included. A user can select a session only if they are a member of all its Markings. While in a session, the user sees resources carrying one or more of the session's Markings, plus unmarked resources. [Fact] https://www.palantir.com/docs/foundry/administration/configure-scoped-sessions/
- **Selector modes:** Off, Auto (shown if the user has more than one session), or Always. "Unscoped access" can be granted to all users, to selected groups, or to all except selected groups; it is typical for admins. A banner shows the active session, and switching refreshes the page. [Fact] same URL; https://www.palantir.com/docs/foundry/security/markings
- **Group scoping and emulation mode (beta):** users can drop groups and Markings to test what others see. Organizations and attributes stay unchanged, and inherited group membership still applies. [Fact] https://www.palantir.com/docs/foundry/security/emulation-mode/
- **Enforcement:** the scope is carried on the session token. This is shown by the LLM check, which reads "the mandatory Markings on the user's current Foundry session, as represented on the request token". [Fact] https://palantir.com/docs/foundry/aip/control-llm-data-access-with-markings/ . This is also why `NOT` conditions are dangerous: scoped tokens carry only a subset of attributes. [Fact] https://palantir.com/docs/foundry/platform-security-management/manage-granular-policies/

### 19. Third-party apps, OSDK apps, tokens and scoping

> Source: [general-references/04-palantir-security.md § 19. Third-party apps, OSDK apps, tokens and scoping](../../general-references/04-palantir-security.md#19-third-party-apps-osdk-apps-tokens-and-scoping)

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

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
