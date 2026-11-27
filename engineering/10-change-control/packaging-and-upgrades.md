# Packaging and upgrades

**Layer:** [10-change-control](README.md) · **What it is:** Packaging a use case as a versioned template and upgrading installed copies.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Design decisions already in the reference maps](#design-decisions-already-in-the-reference-maps) (1)

## Palantir

### A16. Marketplace and Foundry DevOps (packaging and redeploying use cases)

> Source: [general-references/05-palantir-apps-infra.md § A16. Marketplace and Foundry DevOps (packaging and redeploying use cases)](../../general-references/05-palantir-apps-infra.md#a16-marketplace-and-foundry-devops-packaging-and-redeploying-use-cases)

- **Concepts** ([Fact](https://palantir.com/docs/foundry/devops/core-concepts/)):
  - A *product* is a set of resources. Kinds: Ontology (full or fragment), Use Case (Workshop, functions, Carbon), Pipeline, Modeling.
  - *Content* (outputs) is what gets recreated. *Inputs* must be mapped by the installer.
  - *Installations* are repeatable, for example per team or per environment (DEV/TEST/PROD). Each has its own release channel and upgrade window.
  - *Stores* are local or remote; the Foundry Store is Palantir's own.
- **Building a product** ([Fact](https://www.palantir.com/docs/foundry/foundry-devops/create-products)):
  1. Add the most downstream resources first; DevOps resolves dependencies.
  2. Dependencies surface as inputs. An input can be promoted to an output, except parameters and groups.
  3. Optionally add presets and input API names.
  4. Static data can be packaged, but this needs the download permission.
  5. Cap: **15,000 inputs plus outputs, including nested columns and properties**. A warning shows at 75% and publishing is blocked at 100%.
- **Install modes:**
  - *Production:* central management, auto-upgrade off by default.
  - *Singleton:* production behaviour, one installation per space and ontology.
  - *Bootstrap:* a starting point the installer can customize.
- **Install flow** ([Fact](https://palantir.com/docs/foundry/marketplace/install-product/)):
  1. Review the dependency graph.
  2. Map inputs. Bulk-set, auto-select-from-folder and placeholder dataset inputs help here.
  3. Review outputs.
  4. Validate, then install.
- **Install options:** an installation suffix (DEV/TEST/PROD), and an ontology prefix on object, link and action names (display names only, or API names too). The project can be locked. The installer needs ontology edit rights. Recalled versions cannot be installed.
- **Not supported:** Data Connection sources, Code Workbooks and Fusion sheets ([Fact](https://www.palantir.com/docs/foundry/foundry-devops/supported-resources)).
- **B2B distribution:** build in a dev organization and install into customer organizations. Self-service install needs `marketplace:install-from-local-marketplace` and `marketplace:install-in` ([Fact](https://palantir.com/docs/foundry/guides-and-workflows/b2b-b2c-collaboration/)).
- **Recent changes:** DevOps went GA and on by default in September 2025 ([Fact](https://palantir.com/docs/foundry/announcements/2025-08/)). Multi-product installation drafts arrived 14 Jul 2026 ([Fact](https://www.palantir.com/docs/foundry/announcements/2026-07)).
- **Small-product equivalent [Inference]:** a "template pack" format (object types, Actions, rules, metric definitions, agent configs, app specs) with declared inputs, for example "map your CRM's customer table here". The installer maps inputs per tenant, and versioned upgrades follow release channels.

### B6. Upgrade model

> Source: [general-references/05-palantir-apps-infra.md § B6. Upgrade model](../../general-references/05-palantir-apps-infra.md#b6-upgrade-model)

- **Server-side:** Apollo continuously upgrades every entity to the newest constraint-satisfying release on its channel, inside maintenance windows (B1).
- **Customer-side content:** Marketplace installations upgrade manually or automatically per release channel and window (A16).
- **Function versions:** function repositories can require stable versions to be tagged only from protected branches, and downstream apps that accept upgrades pick them up ([Fact](https://palantir.com/docs/foundry/announcements/2025-08/)).
- **Upgrade Assistant:** a product for notifying customers about breaking platform changes appears in the admin sidebar, but its page returned 404 for me [Unverified].

## Design decisions already in the reference maps

### 21. Packaging and versioned upgrades of templates

> Source: [general-references/30-map-palantir-platform.md § 21. Packaging and versioned upgrades of templates](../../general-references/30-map-palantir-platform.md#21-packaging-and-versioned-upgrades-of-templates)

**Purpose.** One receivables template, installed into many tenants with each tenant's own field mapping, upgraded through release channels without breaking local changes. *Receivables example:* "AR Collections pack 1.3" holds the `Customer`, `Invoice`, `Payment`, `PaymentPromise` and `Dispute` types, eight actions, five rules, DSO and CEI metric definitions, and two agent configs. It needs inputs such as "map your ERP's customer table and its credit-limit column".

**Design to implement.**
- **A template pack is outputs plus inferred inputs** [Fact 01, 05]:
  - The author picks the most-downstream resources, and dependencies are walked automatically.
  - Anything not packaged becomes a typed **input** the installer must map.
  - An input can be promoted to an output (not parameters or groups).
  - Presets and input API names allow programmatic installs.
- **Size cap** [Fact 01, 05]: 15,000 inputs plus outputs, counting nested columns and properties, with a warning at 75% and publishing blocked at 100%.
- **Install modes** [Fact 01, 05]:
  - **Production:** centrally managed, auto-upgrade off by default.
  - **Singleton:** one installation per tenant model.
  - **Bootstrap:** a starting copy the tenant may modify, never upgraded.
- **Install flow** [Fact 05]: review the dependency graph → map inputs (bulk set, placeholders) → review outputs → validate → install. Options are an installation suffix (DEV/TEST/PROD) and a name prefix on types and actions. Recalled versions cannot be installed.
- **Product groups** [Fact 01]: validate version sets for missing inputs, duplicate outputs and dependency cycles. Linked products' outputs fill downstream inputs.
- **Versions and dependencies** [Fact 05]: each pack declares dependency ranges (`minimum`, `maximum`, `recommended`) with a checked-in lock file, and non-overlapping ranges fail the build (sls-packaging). An upgrade that would break a dependent is blocked (Apollo).
- **Release channels** [Fact 05]: `DEV` → `RELEASE_CANDIDATE` → `RELEASE`, promoted automatically, manually or by pipeline. Each installation subscribes to a channel and has an upgrade window.
- **Upgrade plan per installation** [Fact 05 for the constraints; applying them to tenant content is 05's Inference]:
  1. Check constraints: maintenance window, dependency ranges, suppression window.
  2. Apply the upgrade as a **proposal** on the tenant (section 20) that includes the schema migrations for edited types (section 4).
  3. On failure, auto-suppress that installation and roll back.
  4. Recall a release when it fails on canary tenants, and roll every installation off it.
  - Re-plan when a dependency changes, a new release appears, a recall happens, or a plan has been blocked for more than 4 h [Fact 05].
- **Format** [Inference]: a pack is a directory in the one repository, written in TypeScript IR (compare Palantir's SuperRepo, a TypeScript monorepo of ontology-as-code, functions and a React app compiled to a signed Marketplace product, beta 4 Aug 2026 [Fact 01]). CI builds it into a signed, versioned artifact.
- **Local changes** [Inference]: Production installs allow tenant changes only in declared extension points (extra properties, extra rules). Changes elsewhere convert the install to Bootstrap after a warning.

**Copies.**
- Document 01, §16 "Marketplace / DevOps": dependency inference, inputs, presets, install modes, 15,000 cap, product groups, SuperRepo. https://www.palantir.com/docs/foundry/foundry-devops/create-products/ , https://www.palantir.com/docs/foundry/announcements/2026-09 , https://www.palantir.com/docs/foundry/announcements/2026-08
- Document 05, A16: install flow, suffix and prefix, release channel per install, recalled versions. https://palantir.com/docs/foundry/marketplace/install-product/ , https://palantir.com/docs/foundry/devops/core-concepts/
- Document 05, B1: Apollo plans, constraints, suppression, rollback, recall, channels, timeouts. https://www.palantir.com/docs/apollo/core/plans-and-constraints , https://palantir.com/docs/apollo/core/release-channels/
- Document 05, B3: sls-packaging dependency manifest and lock file. https://github.com/palantir/sls-packaging

**Left out, and why.**
- Apollo hub and spoke, remote hubs and air-gap bundles: the product is one multi-tenant SaaS [05].
- Static data in packs: version 2.
- Remote stores: version 2.

**Open questions.**
- Upgrade Assistant mechanics [Unverified 05].
- How do mapped inputs survive a customer switching ERP? [Inference needed]

---

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
