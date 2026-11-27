# Phase 2 research — semantic metrics and business meaning

**Research date:** 27 November 2026  
**Evidence:** Dataphin and Quick BI official help documentation, read as public product contracts. Vendor implementation internals were not inspected.

## 1. Dataphin's metric grammar is more structured than a named SQL expression

Dataphin separates a business data model from statistical metrics. Its documented concepts include business entities, business activities, logical dimension tables and logical fact tables. Metric primitives include:

- **Atomic metric:** statistical scope and calculation algorithm, such as payment amount.
- **Business filter:** business scope predicate, analogous to SQL WHERE but separate from the time interval.
- **Statistical period:** time window for the measurement, e.g. last day or last 30 days.
- **Statistic granularity:** entity/dimensions used to group the measure, analogous to GROUP BY.
- **Statistical timeliness:** how frequently derived metrics are computed.
- **Derived metric:** combines the atomic metric, business filter, statistical period and one or more dimensions.

Dataphin's documented expression is:

`DerivedMetric = AtomicMetric + BusinessFilter + StatisticalPeriod + StatisticGranularity`

The derived metric belongs to a logical aggregate table; physical tables are created in the compute engine and materialized tables hold the actual data.

Sources:
- https://help.aliyun.com/en/dataphin/fullmanaged/getting-started/the-statistical-index
- https://help.aliyun.com/en/dataphin/fullmanaged/product-overview/logical-structure-that
- https://help.aliyun.com/en/dataphin/semimanaged-v4/product-overview/logical-structure-that

## 2. Why this matters to our ontology

A metric is not merely `SUM(invoice.amount)`. The number has a declared business scope and valid grain.

For example, "overdue receivables" requires explicit decisions:
- Which invoice statuses count?
- Is the due-date cut-off inclusive?
- Is the as-of date in tenant-local time?
- Are disputed invoices included?
- Are credit notes/netting included?
- Is amount gross, net of payments, or allocated cash basis?
- Is the measure in document currency or reporting currency?
- Is aggregation valid by customer, entity, office, matter or collector?
- How fresh is the underlying payment/allocation data?

If these are not modelled, an agent can produce plausible but inconsistent answers despite retrieving the correct rows.

## 3. Quick BI Q-Data shows a separate intent-to-dataset routing layer

Quick BI's Question-based Knowledge Management documents:
- business logic rules;
- regular-expression matching;
- dataset selection;
- AI-assisted table selection;
- business definitions and synonyms linked to specific datasets.

A dataset-selection rule maps a business definition and synonyms to up to ten datasets. It acts as controlled question-to-data routing, rather than leaving the model to guess which table might contain an answer. The documentation says the feature was available in Hong Kong, Kuala Lumpur and Singapore regions in the page last updated 23 June 2026; availability should be rechecked before depending on it.

Sources:
- https://help.aliyun.com/en/quick-bi/user-guide/knowledge-base-configuration
- https://help.aliyun.com/en/quick-bi/user-guide/knowledge-base-configuration (page updated 23 June 2026)

This layer complements, but does not replace, authorization or typed metric validation. A synonym or business phrase can help pick a candidate dataset; the server must still verify that the user can access it and that the resulting metric is semantically valid.

## 4. Proposed MetricDefinition contract

A published metric should include:

| Field | Purpose |
|---|---|
| `api_name`, `version`, `display_name`, `description` | Stable identity and human/agent vocabulary |
| `base_measure` | Source property or deterministic expression |
| `aggregation` | sum, count, distinct count, min, max, ratio, custom validated expression |
| `base_grain` | One row per what? invoice, payment, transaction, matter, event |
| `dimensions_allowed` | Valid grouping dimensions and relationship paths |
| `business_predicate` | Versioned typed filter, distinct from time range |
| `time_semantics` | Event/posted/due/created time, timezone and period expression |
| `unit_currency` | Unit, currency and conversion policy |
| `freshness_sla` | Latest data time expected; stale behaviour |
| `null_and_missing_policy` | Whether missing values are zero, unknown or excluded |
| `source_lineage` | Source systems, model and transformation versions |
| `owner_approver`, `status` | Governance and publication lifecycle |
| `synonyms_examples` | Natural language resolution hints; not execution authority |

The query planner must reject a dimension/relationship combination that changes the metric's grain without an explicit, reviewed aggregation rule.

## 5. Metric evaluation and release

Each metric should have golden examples and reconciliation tests:
- known source rows → exact expected metric value;
- same metric by multiple dimensions → aggregation invariants;
- currency and timezone boundary cases;
- as-of date and late-arriving update cases;
- business filter version change → explicit metric version change;
- materialized metric vs live computation → explainable discrepancy and freshness label.

Metric changes are governed artefacts and should be released with the ontology/model version, not edited as undocumented prompt instructions.

## 6. Research boundary

Dataphin/Quick BI public documentation provides evidence about metric modelling and question-to-dataset configuration. It does not prove that their hosted systems use Palantir-like object action transactions or expose the same ontology runtime. Keep these product comparisons at the capability boundary.
