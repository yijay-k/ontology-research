# Connector and writeback contracts

## Connector categories

1. Read-only ingestion connector (batch/CDC/webhook/file).
2. Query-time source adapter (live retrieval for freshness).
3. Writeback connector (execute named, constrained external commands).
4. Event listener/webhook receiver.
5. Document ingestion and export connector.

A connector must declare source identity, auth method, scopes, supported object types/operations, rate limits, retry semantics, webhook signatures, cursor model, idempotency support, ACL support, data residency, deletion and retention semantics, version/ETag support and connector version.

## Writeback execution

Writeback should be called by a durable workflow after the action has passed local validation, permission, approval and commit. Use idempotency keys derived from action ID and target-system operation. Save request hash and external correlation ID. Handle timeouts as unknown outcome—not automatic failure—then query/reconcile external state before retrying a non-idempotent operation.

## Connector license and security

The original archive flags ELv2/proprietary restrictions in several integration platforms and connector-specific licences. Audit the license for the specific connector and commercial deployment model; the platform's main licence does not necessarily cover every connector. Store OAuth tokens/secrets in a secrets manager, never in ontology objects or traces.