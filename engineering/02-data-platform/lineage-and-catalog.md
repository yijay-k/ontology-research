# Lineage and catalog

**Layer:** [02-data-platform](README.md) · **What it is:** Where every dataset and object came from, and the catalog that lets people find them.

> Everything below is copied from the research with a link to where it came from. Nothing here is a new design. New, dated fact-check findings go in the "Fact-check notes" section only.

**Sources in this file:** [Palantir](#palantir) (2) · [Open-source implementations](#open-source-implementations) (1)

## Palantir

### 14. Data lineage and Workflow Lineage

> Source: [general-references/01-palantir-data-layer.md § 14. Data lineage and Workflow Lineage](../../general-references/01-palantir-data-layer.md#14-data-lineage-and-workflow-lineage)

- **Data Lineage** is the graph of datasets, with search by project, table and column. It can expand ancestors and descendants, colour the graph (for example, out-of-date datasets), show the code behind each dataset, and save snapshots. Schedules are edited from its sidebar. [Fact] https://www.palantir.com/docs/foundry/data-lineage/overview/
- Lineage links to the Ontology by listing the object types built from a dataset, and object types can be added to the graph. [Fact] https://palantir.com/docs/foundry/data-lineage/explore-artifacts/
- A Global-branches view was added on 26 May 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-05
- **Workflow Lineage** is the graph north of the Ontology. [Fact] https://palantir.com/docs/foundry/workflow-lineage/overview/
  - Nodes: objects, actions, functions, models, Workshop apps and widgets.
  - Bulk upgrades of function versions and model swaps.
  - Seven days of run history.
- **2026 additions to Workflow Lineage:**
  - Log search across call chains, GA 29 Sep 2026. [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09
  - Failure-rate colouring in buckets of <1%, 1–5%, 5–15% and >15% (20 Aug 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-08
- I found no documentation of column-level lineage in what I could open. [Unverified]

### 16. Data catalog and Marketplace / DevOps product packaging

> Source: [general-references/01-palantir-data-layer.md § 16. Data catalog and Marketplace / DevOps product packaging](../../general-references/01-palantir-data-layer.md#16-data-catalog-and-marketplace--devops-product-packaging)

- **Data catalog:** I could not open a dedicated Data Catalog page (the fetch budget ran out). Discovery features I could confirm are search by project, table and column in Data Lineage, plus metadata exposed through the Platform SDK. [Fact] https://www.palantir.com/docs/foundry/data-lineage/overview/ , https://www.palantir.com/docs/foundry/architecture-center/interoperability/ . Anything beyond that is [Unverified].
- **Marketplace** is a storefront for installing "products", with guided installs and automatic upgrades (maintenance windows, release channels). [Fact] https://www.palantir.com/docs/foundry/marketplace/overview/
- **DevOps product creation:** [Fact] https://www.palantir.com/docs/foundry/foundry-devops/create-products/
  - **Stores and outputs:**
    - A store lives in a project and inherits its permissions.
    - Outputs are added manually or through a tracked source folder.
    - Dependencies are detected automatically, and unsatisfied ones become **inputs** the installer must map.
    - Inputs can be "promoted" to outputs. Presets and input API names support programmatic installs.
    - Datasets can ship with static data, which needs download permission.
  - **Install modes:** Production (central management), Singleton (one per space and ontology), Bootstrap (a starting point the installer can modify).
  - **Size cap:** **15,000** inputs plus outputs, counting nested columns and properties; warning at 75%.
- **Unsupported content types** include Data Connection sources, Code Workbooks and Fusion sheets. [Fact] https://www.palantir.com/docs/foundry/foundry-devops/supported-resources/
- **2026 additions:**
  - Product groups with version-set validation: missing inputs, duplicate outputs, dependency cycles (15 Sep 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-09
  - Bulk install and upgrade, where linked products' outputs fill downstream inputs (14 Jul 2026). [Fact] https://www.palantir.com/docs/foundry/announcements/2026-07
  - **SuperRepo** (beta, 4 Aug 2026): a monorepo of Ontology-as-code in TypeScript plus functions plus a React app. It compiles to a signed Marketplace product deployable from external CI. Data pipelines are "in development". [Fact] https://www.palantir.com/docs/foundry/announcements/2026-08

## Open-source implementations

### Repository audit — datahub-project/datahub

> Source: [open-source-references/datahub.md](../../open-source-references/datahub.md) (repository audit)

**Role:** metadata catalog, connector ingestion contract, metadata model and event emission reference.  
**Repository:** [datahub-project/datahub](https://github.com/datahub-project/datahub), branch `master`.  
**Validation:** source inspected; no build/tests run.

#### Runtime structure

The repository splits metadata models, metadata ingestion and the metadata service. The service tree contains distinct authentication, events, GraphQL/OpenAPI/Rest.li, schema registry, plugin and server components. Metadata models are separately generated/compiled. This is a modular design where a source connector does not directly dictate the persistence schema.

#### Ingestion workunit abstraction

`metadata-ingestion/src/datahub/ingestion/api/source.py` defines source capability metadata (profiling, usage stats, operation capture, partition support, table/column lineage, ownership, deletion detection, tags, schema metadata, etc.). A source yields `MetadataWorkUnit` records. `get_workunits()` applies configured processors and an automatic system-metadata stamper, then handles profiling as a separate stage. `get_workunits_internal()` is the source-specific implementation point.

`workunit.py` wraps metadata changes as work units carrying `MetadataChangeEvent`, `MetadataChangeProposal` or wrappers, with attributes such as whether it is a primary source. The pattern standardises connector outputs and enables generic transformation, reporting, checkpointing and emission.

#### Kafka emitter

`kafka_emitter.py` targets the `MetadataChangeProposal_v1` topic, serialises via Avro and a schema registry, and includes queue backpressure. The current source contains a default maximum wait of 300 seconds when the local producer queue is full before surfacing an error, and distinguishes an oversized message from a full producer queue (the former cannot succeed under the same size limit and can use a REST fallback). This is an example of operational details hidden by a simple “uses Kafka” summary.

#### What to learn

- Standard connector interface and capability model.
- Intermediate workunit contract separating source-specific ingestion from generic processing.
- Metadata change proposal as an event contract.
- Source report, warning and failure structures.
- Schema registry and backpressure behaviour.
- Separate catalog service, model schema and ingestion runtime.

#### Limits

DataHub is a data/metadata catalog and lineage platform. Its metadata entity model is not an operational business ontology with action execution semantics. Reuse ideas for ingestion/catalog/lineage, not its model as the sole business object store.

## Fact-check notes

_Reviewed 28 Nov 2026: this component's material is design pattern, research literature or business context without version, licence or launch-status claims, so there was nothing time-sensitive to re-check. Company facts it cites were spot-checked where they feed engineering (Sierra, Decagon, Palantir naming)._

## Gaps

- Lingyang/AgentOne/Alibaba: not covered — the Alibaba research (docs 07, 08, 28, 31) concentrates on Dataphin, Quick BI, Bailian, UModel, OpenSPG and AgentOne; Palantir and open-source sources cover this component.
- Other companies: not covered beyond Palantir, Alibaba and open source in the research for this component.
- Research literature: not applicable. _No research literature is expected here: this component is platform or operations engineering, and its evidence is vendor documentation, source code and the executable proofs in [`proofs/`](../../proofs/README.md)._
