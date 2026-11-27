# Retention deletion encryption

**Layer:** [01-security](README.md) · **What it is:** Data lifetime, lineage-aware deletion, sensitive-data scanning, encryption, privacy engineering and certifications.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (5)

## Palantir

### 16. Data retention and lineage-aware deletion (Data Lifetime)

> Source: [general-references/04-palantir-security.md § 16. Data retention and lineage-aware deletion (Data Lifetime)](../../general-references/04-palantir-security.md#16-data-retention-and-lineage-aware-deletion-data-lifetime)

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

> Source: [general-references/04-palantir-security.md § 17. Sensitive Data Scanner (SDS)](../../general-references/04-palantir-security.md#17-sensitive-data-scanner-sds)

**Plain English.** A background job looks for things like card numbers or emails in new data and automatically stickers the dataset "PII" and opens a ticket.

**Technical detail.**
- **Match conditions:** regex (built-ins exist for SSNs, emails and phone numbers), overlap (values also found in a reference dataset column), or a language model given a natural-language prompt over content and/or column names.
- **Match actions:** create an Issue, apply Markings, or obfuscate with Cipher (encrypt or hash).

[Fact] https://www.palantir.com/docs/foundry/sensitive-data-scanner/core-concepts/

- **Scope:** datasets, virtual tables, and media sets (audio, document and image). Include or exclude folders, with the most specific rule winning, and filter by Marking. The recommended strategy is "source datasets only". Sampling options are all rows (recommended) or an approximate random subset.
- **Schedules:** one-time; daily at 00:00 UTC; weekly on Tuesday at 00:00 UTC; monthly on the 1st; or continuous on new data. A compute estimate is shown at review.

[Fact] https://www.palantir.com/docs/foundry/sensitive-data-scanner/create-a-sensitive-data-scan/

### 18. Encryption and key management

> Source: [general-references/04-palantir-security.md § 18. Encryption and key management](../../general-references/04-palantir-security.md#18-encryption-and-key-management)

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

### 21. Privacy and civil liberties (PCL) engineering guidance

> Source: [general-references/04-palantir-security.md § 21. Privacy and civil liberties (PCL) engineering guidance](../../general-references/04-palantir-security.md#21-privacy-and-civil-liberties-pcl-engineering-guidance)

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

> Source: [general-references/04-palantir-security.md § 22. Certifications](../../general-references/04-palantir-security.md#22-certifications)

- FedRAMP High for Palantir Federal Cloud Service and its supporting services, covering AIP, Apollo, Foundry, Gotham, FedStart and Mission Manager (around 3 December 2024). The release also cites FedRAMP Moderate, IL5 and IL6. [Vendor claim] https://www.businesswire.com/news/home/20241203054493/en/Palantir-Granted-FedRAMP-High-Baseline-Authorization
- CMMC Level 2 via a C3PAO (17 September 2025). Palantir says it is one of only six cloud providers at IL6. [Vendor claim] https://www.nasdaq.com/press-release/palantir-technologies-achieves-cybersecurity-maturity-model-certification-cmmc-level
- IRAP PROTECTED in Australia (release around 20 November 2025, date inferred from the URL). [Vendor claim] https://www.nasdaq.com/press-release/palantir-achieves-information-security-registered-assessors-program-irap-protected
- The public ISO 27001:2013 certificate I found (Schellman, aligned with 27017 and 27018) ran from 2 April 2021 to 1 April 2024. A current certificate was not verified. [Fact] https://www.palantir.com/assets/xrfr7uokpv1b/1JMPgco1t6e4e2UTdVITLb/605c77226cd62440357725f310eef46d/Palantir_ISO_27001_Certificate_of_Registration.pdf
- A reseller page lists SOC 2 Type 2, SOC 3, ISO 27001/27017/27018/9001, FedRAMP High, IL2/5/6, CMMC, Cyber Essentials Plus, and the NHS DSPT. This is a secondary source, undated. https://www.carahsoft.com/palantir/security . The official list is in the Trust Center (palantir.safebase.us), which mostly sits behind an NDA. [Fact] https://www.palantir.com/docs/foundry/security/overview

---

## Fact-check notes

_Not yet checked against current sources in this pass._

## Gaps

- No lingyang, AgentOne and Alibaba material in the research yet.
- No open-source implementations material in the research yet.
- No other companies and products material in the research yet.
- No research literature material in the research yet.
