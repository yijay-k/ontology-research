-- Action types that require approval, and the proposals they stage (svc-actions).
-- A proposal holds an evaluated edit plan with the versions it was computed
-- from; approval commits it only if none of those objects changed.
-- Mirrored in scripts/migrate.sql.

ALTER TABLE action_types ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS action_proposals (
    id           SERIAL PRIMARY KEY,
    rid          TEXT NOT NULL UNIQUE,
    ontology_rid TEXT NOT NULL,
    action_type  TEXT NOT NULL,
    parameters   JSONB NOT NULL,
    edits        JSONB NOT NULL,
    reads        JSONB NOT NULL DEFAULT '[]',
    proposed_by  TEXT,
    status       TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'STALE')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_by   TEXT,
    decided_at   TIMESTAMPTZ,
    reason       TEXT,
    commit_id    TEXT
);
CREATE INDEX IF NOT EXISTS idx_action_proposals_status ON action_proposals (ontology_rid, status);
