-- Commit log and outbox for action edit plans (research H5).
--
-- svc-objects writes one `action_commits` row, the edits, and one `outbox` row
-- in a single transaction. `idempotency_key` is unique per ontology, so a
-- retried action call finds its first commit instead of applying again. The
-- outbox holds side effects to deliver after commit; delivery is
-- at-least-once and receivers deduplicate on the payload's `commitId`.
-- Same tables in scripts/migrate.sql, without the tenant column.

CREATE TABLE IF NOT EXISTS action_commits (
    id              SERIAL PRIMARY KEY,
    commit_id       TEXT NOT NULL UNIQUE,
    ontology_rid    TEXT NOT NULL,
    idempotency_key TEXT,
    action_type     TEXT,
    actor           TEXT,
    edits           JSONB NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    org_rid         TEXT NOT NULL DEFAULT 'org:default' REFERENCES organizations(rid)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_action_commits_key
    ON action_commits (ontology_rid, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS outbox (
    id           SERIAL PRIMARY KEY,
    ontology_rid TEXT NOT NULL,
    topic        TEXT NOT NULL,
    payload      JSONB NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    org_rid      TEXT NOT NULL DEFAULT 'org:default' REFERENCES organizations(rid)
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox (id) WHERE delivered_at IS NULL;

ALTER TABLE action_commits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON action_commits;
CREATE POLICY tenant_isolation ON action_commits
  USING (org_rid = current_setting('app.org_rid', true))
  WITH CHECK (org_rid = current_setting('app.org_rid', true));
ALTER TABLE action_commits FORCE ROW LEVEL SECURITY;

ALTER TABLE outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON outbox;
CREATE POLICY tenant_isolation ON outbox
  USING (org_rid = current_setting('app.org_rid', true))
  WITH CHECK (org_rid = current_setting('app.org_rid', true));
ALTER TABLE outbox FORCE ROW LEVEL SECURITY;
