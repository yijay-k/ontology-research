# Research charter

## Aim

Design a general-purpose enterprise ontology and operational-intelligence platform that gives applications, analysts and AI agents a shared, governed model of business entities, relationships, evidence, rules, metrics and permitted actions.

The objective is broader than search or a graph database. A platform must connect data sources to stable business objects, explain how the objects relate, answer questions with reliable semantics, and perform controlled mutations or workflows while preserving identity, authorization, provenance, audit and recovery.

## Product boundary hypotheses

The platform is expected to cover:

1. Data connectivity and ingestion.
2. Metadata and source mapping.
3. Entity identity and resolution.
4. Ontology definitions and runtime instances.
5. Query/object-set and graph traversal.
6. Document and knowledge retrieval.
7. Semantic metrics and business rules.
8. Action definitions, validation and state mutation.
9. Durable workflows and external system writeback.
10. Agent context, tools, memory and evaluation.
11. Security, tenancy, governance, audit and observability.
12. Application/developer tooling.

These are research domains, not a final microservice map. The system may begin as a modular monolith with internal boundaries and extract services only when scale, isolation, deployment, ownership or independent reliability justifies it.

## Core questions

- What makes an ontology operational rather than merely descriptive?
- What state is authoritative, mirrored, derived or ephemeral?
- How should source-backed objects differ from ontology-owned objects?
- How do ontology types, links, interfaces, rules, metrics and actions evolve safely?
- How should query planning avoid invalid joins, incorrect aggregates and permission leaks?
- How can documents produce traceable knowledge without converting model-generated extractions into unquestioned facts?
- What does a correct action transaction guarantee—and what happens when writeback crosses external systems?
- How does authorization remain consistent across SQL, graph, vector, cache, agent and workflow access?
- How do we evaluate an agent on business end-state, policy compliance and communication quality?
- Which capabilities should be built, adapted, integrated or deliberately deferred?

## Initial target domains

Legal is the first domain pack because the project direction prioritised legal workflows. Finance/receivables is the structured operational comparison: invoices, counterparties, allocations, payment promises, collections rules and reconciliations. Construction remains a transferability test. The core platform must not hard-code any one domain's vocabulary.
