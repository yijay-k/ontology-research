# 03-ontology-engine — Ontology engine

The company model: typed object types, properties, links and interfaces; their storage and indexing; the edits layer; schema evolution; drafting; SDK/API/MCP.

[← Engineering index](../README.md)

| Component | What it is | Lines | Sources |
|---|---|---:|---:|
| [object-type-registry](object-type-registry.md) | The schema of the company model: object types, properties, identity, link types, interfaces, and how they are validated. | 594 | 30 |
| [semantic-model-format](semantic-model-format.md) | The file format a company model is written in: objects, keys, relationships, metrics, synonyms, mappings (Ossie, UModel, Palantir SDK metadata). | 221 | 6 |
| [object-storage-and-indexing](object-storage-and-indexing.md) | Where object instances live and how they are indexed and kept in step with source data (Palantir OSv2/Funnel and equivalents). | 298 | 14 |
| [edits-and-merge-precedence](edits-and-merge-precedence.md) | How user and agent edits are stored as a layer over source data, and which wins when they conflict. | 97 | 3 |
| [schema-evolution-and-branching](schema-evolution-and-branching.md) | Changing the model safely: versioning, migrations, branches, proposals and review of ontology changes. | 74 | 4 |
| [ontology-drafting-and-cold-start](ontology-drafting-and-cold-start.md) | Drafting a first model with LLMs from a company's apps and documents, and its limits. | 178 | 6 |
| [sdk-api-and-mcp](sdk-api-and-mcp.md) | How code and agents talk to the ontology: generated SDKs, REST API, developer console and Ontology MCP. | 201 | 6 |
