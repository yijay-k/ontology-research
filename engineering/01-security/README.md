# 01-security — Security, tenancy and identity

Wraps every other layer. Tenant isolation, identity, authorization, markings and row/column/object policies, agent identity, retention, threat model.

[← Engineering index](../README.md)

| Component | What it is | Lines | Sources |
|---|---|---:|---:|
| [tenancy-and-isolation](tenancy-and-isolation.md) | How one customer's data, objects and agents are kept separate from another's, and which invariants must hold end to end. | 171 | 9 |
| [identity-and-auth](identity-and-auth.md) | Who a user or service is: authentication, SSO, groups, roles, scoped sessions and third-party app tokens. | 96 | 4 |
| [authorization-model](authorization-model.md) | How allow/deny decisions are made on data, objects, links, actions and functions, and which engine evaluates them. | 302 | 12 |
| [markings-row-column-object-policies](markings-row-column-object-policies.md) | Mandatory labels (markings), row and column policies, object and property security, and purpose-based checks. | 225 | 8 |
| [agent-identity-and-token-scope](agent-identity-and-token-scope.md) | Agents as their own principals: what an agent may see and do is the intersection of its scope and the user's. | 136 | 4 |
| [retention-deletion-encryption](retention-deletion-encryption.md) | Data lifetime, lineage-aware deletion, sensitive-data scanning, encryption, privacy engineering and certifications. | 104 | 5 |
| [threat-model](threat-model.md) | Attack scenarios, trust boundaries and the negative-test matrix for tenant and matter isolation. | 104 | 2 |
