# Phase 2 research — ontology schema language, relationship semantics and evolution

**Research date:** 27 November 2026  
**Evidence:** Palantir official ontology modelling documentation, Dataphin dimensional-modelling documentation and the original six reference maps. No Foundry model was published or tested.

## 1. Object types, links and interfaces are different schema primitives

Palantir's public documentation distinguishes:

- **Object type:** concrete, instantiable business entity with typed properties, a primary key, display/title key and one or more backing data sources.
- **Link type:** schema for a semantically meaningful relationship between two object types. A link instance is one relationship between two concrete object instances.
- **Interface:** abstract, reusable contract describing the properties and capabilities an object type must expose. An interface is not backed by a dataset and cannot be instantiated directly.
- **Object-backed relationship:** a relationship represented through its own object type when the relationship itself has properties or lifecycle.

Sources:
- https://www.palantir.com/docs/foundry/object-link-types/create-object-type
- https://www.palantir.com/docs/foundry/object-link-types/link-types-overview
- https://www.palantir.com/docs/foundry/interfaces/interface-overview
- https://www.palantir.com/docs/foundry/ontology/ontology-structural-guidance

## 2. Identity is a durable contract, not a display field

The object-type creation guide defines a primary key as the unique identifier of each object instance. It explicitly warns that user edits are permanently attached to the primary-key value; changing the primary key prompts deletion of existing edits.

Implication:
- Never use a display name, mutable business label or email address as the only durable object identity.
- A source-backed object needs a stable source identifier and a controlled mapping to the canonical object ID.
- When two source systems describe the same real-world entity, identity resolution should be an explicit mapping/merge process, not a silent primary-key change.
- A primary-key migration is a data migration of object identity and all dependent edits/links/audit references, not a simple column rename.

For our multi-tenant platform, a safe source identity tuple is conceptually `(tenant_id, source_system, source_object_type, source_record_id)`. A separate canonical identity maps multiple source identities to one business object where verified. Do not derive canonical identity from mutable display data.

Source: https://www.palantir.com/docs/foundry/object-link-types/create-object-type

## 3. Relationship storage must match the meaning of the relationship

Palantir documents three principal backing patterns for links:

| Relationship shape | Backing pattern | Suitable when |
|---|---|---|
| One-to-one / one-to-many | Foreign key property on one object type referring to the other object's primary key | A simple relationship can be fully described by the foreign key |
| Many-to-many | Join table dataset | A relationship joins sets of objects without needing a rich independent lifecycle |
| Stateful relationship | Object-backed link / intermediate object | The relationship has attributes, status, dates, permissions, ownership or actions of its own |

Examples:
- Direct: `Matter → Firm`, `Invoice → Customer`.
- Many-to-many: `Matter ↔ LegalIssue` where no independent join lifecycle is needed.
- Object-backed: `MatterMembership` between `Principal` and `Matter`, with role, grant source, effective dates, expiry, approval and ethical-wall state.
- Object-backed: `InvoicePaymentAllocation` between `Invoice` and `Payment`, with applied amount, currency, allocation date, reversal and reconciliation status.
- Object-backed: `PartyRepresentation` between `Matter` and `Party`, with represented side, lawyer/team, start/end dates and conflict-review status.

Palantir's structural guidance says direct links are for meaningful relationships without their own metadata; object-backed links are for relationships that carry their own information. This is a practical modelling test, not just a storage preference.

Sources:
- https://www.palantir.com/docs/foundry/object-link-types/create-link-type
- https://www.palantir.com/docs/foundry/ontology/ontology-structural-guidance

## 4. Declared cardinality is not automatically an integrity constraint

Palantir's link-creation documentation makes a specific caveat: one-to-one cardinality indicates the intended relationship shape, but the one-to-one cardinality itself is not enforced. Link type definitions also carry a status such as active, experimental or deprecated.

Therefore our design must distinguish:
1. **Semantic declaration:** intended direction and cardinality for query planning, application and agent reasoning.
2. **Storage constraint:** actual unique, foreign-key, exclusion or check constraints that make invalid states impossible at commit time.
3. **Authorization rule:** who can see/create/remove the relationship.
4. **Lifecycle rule:** how the relationship is approved, expired, revoked or superseded.

Do not let the agent planner infer database integrity merely because a relationship schema says ONE. For relationships where uniqueness or exclusivity is a safety/business invariant, enforce it in the canonical database and test concurrent writes.

Source: https://www.palantir.com/docs/foundry/object-link-types/create-link-type

## 5. Interfaces are behaviour/data contracts, not merely inheritance

An interface can define:
- required properties;
- link-type constraints;
- action-type constraints;
- metadata and optional properties.

An object type implements an interface by mapping its local properties to the interface properties and satisfying required link/action constraints. Interface searches can return objects from multiple implementing object types, so applications can operate on a common capability without hard-coding every concrete type.

Important limits in the currently documented Palantir surface:
- An interface is abstract and cannot be instantiated.
- Searchability determines whether a single object set can query across all implementing object types.
- Interface support varies across functions, actions, OSDK and Object Set Service; some interface aggregation/link capabilities are described as in development or beta in the docs.

Sources:
- https://www.palantir.com/docs/foundry/interfaces/interface-overview
- https://www.palantir.com/docs/foundry/interfaces/implement-interface
- https://www.palantir.com/docs/foundry/interfaces/interface-link-types-overview

**Recommendation:** use interfaces only when two or more concrete types genuinely share a stable contract needed by queries, actions or applications. Avoid building a large class hierarchy. For example, `Party` may be a reusable interface for `IndividualParty` and `CorporateParty` only if the shared property and action contracts are useful and stable.

## 6. Dataphin's model adds an event/fact perspective

Alibaba Dataphin documents a Kimball-style dimensional modelling flow:
- business entities/business objects lead to logical dimension tables;
- business activities lead to logical fact tables;
- atomic metrics, business filters, derived metrics and logical aggregate tables are designed from that model.

This complements an ontology but should not be collapsed into it:
- the ontology expresses business objects and relationships used by people and agents;
- fact/dimension models express analytical grain and measure calculation;
- metrics express governed analytical definitions.

A single domain may need both object-centric operational queries and fact-centric analytic queries.

Source: https://help.aliyun.com/en/dataphin/semimanaged-v4/user-guide/data-modeling-research-and-development/

## 7. Proposed schema artefacts and lifecycle

The platform model should be a versioned, validated definition bundle with separate runtime data:

- `ObjectTypeDefinition`: API name, version, properties, primary-key contract, title key, source mappings, provenance, access labels, lifecycle status.
- `RelationshipDefinition`: API name, endpoints, direction, storage strategy, intended cardinality, enforced constraints, metadata strategy, lifecycle status.
- `InterfaceDefinition`: properties, required/optional flags, link/action capability constraints, implementing-type mappings, searchable flag.
- `PropertyDefinition`: data type, nullability, unit, source ownership, editability, validation, classification, indexing/search hints, deprecation and migration metadata.
- `ModelBinding`: mapping from source schema/column to a property, identity key, transformation and source version.
- `RuntimeObject` and `RuntimeRelationship`: stable IDs, tenant/resource scope, values, source/version references, timestamps and optimistic version.
- `ModelRelease`: validated model bundle, compatibility report, migration plan, approvals and rollback pointer.

Schema publication flow:
1. Draft and validate definitions.
2. Resolve property/link/interface references.
3. Check uniqueness/cardinality constraints and source key mappings.
4. Produce a compatibility report against the last published version.
5. Require migration steps for breaking changes (primary key, type narrowing, required property, endpoint or cardinality changes).
6. Publish immutable model version.
7. Apply backfills/projections in a controlled build.
8. Monitor old/new reads and preserve rollback until consumers migrate.
9. Deprecate before removal; never silently reinterpret historical facts.

## 8. Model evolution tests

- Changing a title/display key must not change canonical identity.
- Changing a primary key must be rejected unless an explicit identity/edit/link migration exists.
- A declared one-to-one link with duplicate targets must fail at the database constraint layer.
- A relationship with attributes must preserve its own history and ACL.
- Interface property change must identify every implementing object type that requires mapping updates.
- Removing a property used by action/query/eval contracts must fail validation or require an explicit migration.
- Model publish failure leaves the last valid version active.
- Two schema versions can coexist while old sessions/workflows remain pinned to the model version they started with.

## 9. Design conclusion

The original architecture needs three distinct layers in its model language: **concrete object types, relationship types and reusable interfaces**. Relationship storage must be chosen based on whether the relationship itself has state. Declared cardinality guides semantics; database constraints enforce invariants. Stable primary keys and explicit schema evolution protect user edits, source mappings and audit history.
