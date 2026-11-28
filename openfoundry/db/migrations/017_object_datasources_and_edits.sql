-- Object types backed by datasets, and the user-edit layer merged over them.
--
-- `object_types.datasources` holds Foundry-shaped `ObjectTypeDatasource`
-- entries. `object_edits` records what Actions changed per object, so a
-- re-sync from the source keeps those edits (Palantir's default
-- "apply user edits" strategy): `patch` holds edited properties, `created`
-- marks an object an Action created (the source no longer drives it), and
-- `deleted` marks an Action delete, which stays deleted whatever the source says.

ALTER TABLE object_types ADD COLUMN IF NOT EXISTS datasources JSONB NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS object_edits (
    object_type_rid TEXT NOT NULL REFERENCES object_types(rid) ON DELETE CASCADE,
    primary_key     TEXT NOT NULL,
    patch           JSONB NOT NULL DEFAULT '{}',
    created         BOOLEAN NOT NULL DEFAULT false,
    deleted         BOOLEAN NOT NULL DEFAULT false,
    org_rid         TEXT NOT NULL DEFAULT 'org:default' REFERENCES organizations(rid),
    PRIMARY KEY (object_type_rid, primary_key)
);

ALTER TABLE object_edits ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON object_edits
  USING (org_rid = current_setting('app.org_rid', true))
  WITH CHECK (org_rid = current_setting('app.org_rid', true));
ALTER TABLE object_edits FORCE ROW LEVEL SECURITY;
