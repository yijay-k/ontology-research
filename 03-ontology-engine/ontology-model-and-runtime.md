# Ontology model and runtime — proposed specification

## Core model components

- **Namespace/domain:** owner and scope for model resources.
- **Object type:** stable type identity, API name, version, description, key strategy, lifecycle and ownership policy.
- **Property definition:** type, nullability, units, validation, mutability, sensitivity/marking, source mapping and authority.
- **Link type:** source/target types, cardinality, direction, delete semantics and link-level policy.
- **Interface:** reusable capabilities/properties shared across object types, without forcing unsafe inheritance semantics.
- **Shared property:** governed reusable field definition.
- **Action type:** typed parameters, preconditions, required permissions, effect plan, approval policy and audit contract.
- **Function/derived property:** deterministic calculation or query over typed objects; pure vs side-effecting execution must be explicit.
- **Rule:** declarative predicate/constraint and scope.
- **Metric:** formula, unit, grain, aggregation, time semantics and source ownership.
- **Object view/group:** presentation/navigation metadata, not a replacement for the schema.

## Definition lifecycle

Draft → validate → inspect diff → dependency checks → simulation/migration plan → approve → publish immutable version → runtime compatibility window → deprecate old version. Definitions must be addressable by immutable ID and version. Updating a display name should not create a new semantic identity; changing a property's type or key semantics likely requires a migration.

## Runtime object model

A runtime object has immutable platform ID, canonical type ID/version, tenant/namespace, key tuple or external source key, property values, per-property provenance/authority, version, created/updated time, effective-time bounds when applicable, markings and soft-delete/tombstone state. Link records have immutable ID, source and target IDs, type ID, attributes, validity and audit metadata.

## Query contract

An object-set query should support type, predicates, typed property operations, link traversal, interface narrowing, sort, cursor pagination, projection, aggregation and explain plan. It should carry tenant/policy scope and enforce it before data leaves the query layer. Query operators should not be arbitrary user SQL.

## Type validation

Validation has at least four levels:
1. Structural schema: fields and data types.
2. Reference integrity: referenced type/property/action exists.
3. Semantic integrity: key constraints, cardinality, relation compatibility, dependency cycles and rule type correctness.
4. Runtime compatibility: can existing data migrate or continue to resolve under the new definition?

UModel's schema validator TODO and OpenFoundry's batch schema editing provide concrete examples of why JSON validation and a CRUD route list are not the whole ontology engine.