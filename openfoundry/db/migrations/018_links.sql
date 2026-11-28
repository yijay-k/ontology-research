-- Links between objects, addressed the way the object store addresses objects:
-- by ontology, object type API name and primary key. `object_links` (001)
-- keys links by object RID and link-type RID, which the link routes never have.
--
-- Same shape as `links` in scripts/migrate.sql, plus the tenant column and
-- policy every other tenant table here carries. `id` gives insertion order;
-- never order links by `created_at` (see AGENTS.md, store sharp edges).

CREATE TABLE IF NOT EXISTS links (
    id           SERIAL PRIMARY KEY,
    ontology_rid TEXT NOT NULL,
    source_type  TEXT NOT NULL,
    source_key   TEXT NOT NULL,
    link_type    TEXT NOT NULL,
    target_type  TEXT NOT NULL,
    target_key   TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    org_rid      TEXT NOT NULL DEFAULT 'org:default' REFERENCES organizations(rid),
    UNIQUE (ontology_rid, source_type, source_key, link_type, target_type, target_key)
);

CREATE INDEX IF NOT EXISTS idx_links_source ON links (ontology_rid, source_type, source_key);

ALTER TABLE links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON links;
CREATE POLICY tenant_isolation ON links
  USING (org_rid = current_setting('app.org_rid', true))
  WITH CHECK (org_rid = current_setting('app.org_rid', true));
ALTER TABLE links FORCE ROW LEVEL SECURITY;
