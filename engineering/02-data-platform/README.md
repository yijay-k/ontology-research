# 02-data-platform — Data platform

Source data becomes trustworthy operational state: connectors, raw/clean layers, sync and rebuild, data quality, lineage, entity resolution, event log.

[← Engineering index](../README.md)

| Component | What it is | Lines | Sources |
|---|---|---:|---:|
| [connectors-and-ingestion](connectors-and-ingestion.md) | Getting data out of source systems: connector types, extraction, webhooks, the source-record contract and reliability rules. | 523 | 19 |
| [raw-clean-layers-and-transforms](raw-clean-layers-and-transforms.md) | Raw versus clean datasets, transforms, views and the 'publishing a definition generates the build' idea. | 397 | 9 |
| [sync-incremental-rebuild](sync-incremental-rebuild.md) | Keeping clean state current: CDC, streaming, incremental builds, schedules, dataset branching and rebuild semantics. | 263 | 7 |
| [data-quality](data-quality.md) | Health checks, expectations and strong/weak quality rules that block or flag bad data. | 82 | 2 |
| [lineage-and-catalog](lineage-and-catalog.md) | Where every dataset and object came from, and the catalog that lets people find them. | 93 | 3 |
| [entity-resolution](entity-resolution.md) | Deciding that records from different systems are the same customer, matter or invoice. | 81 | 3 |
| [object-centric-event-log](object-centric-event-log.md) | An event log keyed to business objects (process mining), and how it differs from the ontology. | 214 | 4 |
