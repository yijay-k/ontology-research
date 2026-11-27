# Repository audit — palantir/osdk-ts

**Role:** client SDK and public ontology contract reference.  
**Repository:** [palantir/osdk-ts](https://github.com/palantir/osdk-ts), branch `main`.  
**Validation:** client interface and action method inspected; no tests run.

## Client type surface

`packages/client/src/Client.ts` defines a typed callable client. Passing an object-type definition returns a typed `ObjectSet`; passing an interface definition returns a minimal object set; passing an action definition returns an action signature; query definitions are typed separately. `fetchMetadata()` can retrieve metadata for object, interface, action or query definitions.

This shows an API contract where ontology metadata drives compile-time types and object-set operations. It is a strong developer-experience reference: generated ontology definitions give application code typed object properties and typed action parameters rather than generic unvalidated JSON.

## Action execution surface

`packages/client/src/actions/applyAction.ts` maps compile-time typed parameters to the server API. It passes branch/scenario context and can request returned edits. The current action API supports a `VALIDATE_ONLY` mode when `$validateOnly` is set and `VALIDATE_AND_EXECUTE` otherwise. An invalid validation result becomes an `ActionValidationError`. The SDK can request edit details, including V2 edit results with deletions.

## What this proves—and does not

It proves the client contract exposes typed object-set and action operations and validation-only mode. It does **not** reveal the server-side validation algorithm, database transaction model, authorization internals, indexing service, persistence engine or cross-system writeback implementation.

## Adoption recommendation

Learn from metadata-generated type-safe clients, explicit validation-only calls, typed action parameter remapping, returned edit structures, branch/scenario context and semantic version compatibility. Do not mistake a client SDK for a reusable ontology backend.