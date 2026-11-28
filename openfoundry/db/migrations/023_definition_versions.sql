-- Definition history (svc-ontology): one numbered model version per change to
-- an object, action or link type, with the definition before and after.
-- Mirrored in scripts/migrate.sql.

CREATE TABLE IF NOT EXISTS definition_versions (
    id           SERIAL PRIMARY KEY,
    ontology_rid TEXT NOT NULL,
    version      INTEGER NOT NULL,
    kind         TEXT NOT NULL CHECK (kind IN ('objectType', 'actionType', 'linkType')),
    api_name     TEXT NOT NULL,
    change       TEXT NOT NULL CHECK (change IN ('CREATED', 'UPDATED', 'DELETED')),
    before       JSONB,
    after        JSONB,
    actor        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (ontology_rid, version)
);
CREATE INDEX IF NOT EXISTS idx_definition_versions_name ON definition_versions (ontology_rid, kind, api_name);
