# Original archive reconciliation

## Preservation

The supplied `research-all-markdown.zip` was materialised, extracted and inventoried. Its 32 Markdown files are copied into `sources/archive-original/` without editorial changes. The archive is the preserved historical baseline; this new research pack is a separate synthesis/correction layer.

## Contents confirmed

- Palantir: data layer, ontology, AIP, security, apps/infrastructure and business.
- Alibaba/Lingyang: AgentOne and product stack.
- Research papers: knowledge layer, agent memory and evaluation.
- Context-layer products and agent companies.
- Decagon, Sierra, larger platform agents, Glean.
- Ramp/finance platforms, receivables competitors, integration companies, process/automation platforms and other companies.
- Six consolidated maps: Palantir platform; Lingyang/Alibaba offer catalogue; research/cost; context/code/integration; agent companies; market/competitors.
- Verification report.

## Existing research claims to keep as leads

The original open-source study describes 60+ repositories read from source on 21 November 2026, without executing code. It is an important research asset but its date and inspection scope must remain visible. Current branches can have changed. This phase re-checked selected high-value repositories, not every repository in that catalogue.

## Corrections and current checks

1. **OpenFoundry feature drift:** older PoC/ADR material says properties and link types are deferred or records an earlier ontology-parity estimate. Current CapTrix `main` includes property/link-type handlers and transactional metadata batch-save. Do not carry forward the old estimate as a current branch score.
2. **OpenFoundry transaction semantics:** metadata schema batch edits can share a PostgreSQL transaction with audit/outbox; object writes use a Cassandra primary write followed by a separate PostgreSQL outbox transaction. Those are different guarantees.
3. **OpenFoundry action ordering:** inspected action handler invokes configured webhook writeback before `planAction()`. This requires careful interpretation and a design warning; do not describe it as safe atomic execution.
4. **UModel scope:** its public README and current code give a semantic graph runtime, typed query surface and MCP agent gateway. External metric/log query plans are delegated rather than universally executed by the Query Service. Write tools are disabled by default. Some indexing is secondary and repairable.
5. **Fabric IQ scope:** current Microsoft documentation explicitly says ontology stores definitions and bindings and is not itself a general-purpose query engine; source data stays with owning systems. Feature is preview and old experience lifecycle is time-sensitive.
6. **Graphiti temporal facts:** current code has valid_at/invalid_at and expired_at distinctions. The archive's four-timestamp insight remains useful; inspect exact current provider behaviour before adoption.
7. **LightRAG Postgres graph:** current code confirms workspace/namespace composite keys, JSONB graph properties and canonical edge order.
8. **MetricFlow:** current code confirms typed dataflow and semantic join validation, not arbitrary Text-to-SQL as the core query mechanism.
9. **DataHub:** current code confirms a source/workunit processing model and Kafka MCP emission with backpressure. It is a metadata/catalog platform, not the operational ontology.
10. **DBOS:** current TypeScript code confirms persistent workflow state and checkpointed steps in a PostgreSQL system database; external side effects still need idempotency and reconciliation.
11. **OpenFGA:** inspected type-system validation confirms untrusted models should use `NewAndValidate()` rather than unvalidated graph construction. Full check evaluator audit remains incomplete.
12. **OSDK:** current client contract exposes typed object sets, interfaces, actions and validate-only mode. This does not disclose Palantir backend internals.

## Unchecked archive claims

The original verification report clearly identifies market figures and some company/repository blocks that were not freshly fetched or independently tested. In particular, several “big platform agents” and “more companies” entries rely on prior knowledge, headlines or summary pages. Preserve their labels and do not promote them to verified facts until rechecked.

## How to update this file

For every correction, record: original file and statement; current source URL/path/commit; changed evidence; effect on architecture; confidence; unresolved checks. Never overwrite the preserved original note.