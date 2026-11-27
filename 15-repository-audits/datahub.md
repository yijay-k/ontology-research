# Repository audit — datahub-project/datahub

**Role:** metadata catalog, connector ingestion contract, metadata model and event emission reference.  
**Repository:** [datahub-project/datahub](https://github.com/datahub-project/datahub), branch `master`.  
**Validation:** source inspected; no build/tests run.

## Runtime structure

The repository splits metadata models, metadata ingestion and the metadata service. The service tree contains distinct authentication, events, GraphQL/OpenAPI/Rest.li, schema registry, plugin and server components. Metadata models are separately generated/compiled. This is a modular design where a source connector does not directly dictate the persistence schema.

## Ingestion workunit abstraction

`metadata-ingestion/src/datahub/ingestion/api/source.py` defines source capability metadata (profiling, usage stats, operation capture, partition support, table/column lineage, ownership, deletion detection, tags, schema metadata, etc.). A source yields `MetadataWorkUnit` records. `get_workunits()` applies configured processors and an automatic system-metadata stamper, then handles profiling as a separate stage. `get_workunits_internal()` is the source-specific implementation point.

`workunit.py` wraps metadata changes as work units carrying `MetadataChangeEvent`, `MetadataChangeProposal` or wrappers, with attributes such as whether it is a primary source. The pattern standardises connector outputs and enables generic transformation, reporting, checkpointing and emission.

## Kafka emitter

`kafka_emitter.py` targets the `MetadataChangeProposal_v1` topic, serialises via Avro and a schema registry, and includes queue backpressure. The current source contains a default maximum wait of 300 seconds when the local producer queue is full before surfacing an error, and distinguishes an oversized message from a full producer queue (the former cannot succeed under the same size limit and can use a REST fallback). This is an example of operational details hidden by a simple “uses Kafka” summary.

## What to learn

- Standard connector interface and capability model.
- Intermediate workunit contract separating source-specific ingestion from generic processing.
- Metadata change proposal as an event contract.
- Source report, warning and failure structures.
- Schema registry and backpressure behaviour.
- Separate catalog service, model schema and ingestion runtime.

## Limits

DataHub is a data/metadata catalog and lineage platform. Its metadata entity model is not an operational business ontology with action execution semantics. Reuse ideas for ingestion/catalog/lineage, not its model as the sole business object store.
