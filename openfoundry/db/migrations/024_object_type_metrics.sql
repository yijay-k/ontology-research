-- Governed metrics declared on object types (measure, filter, time property,
-- unit); periods and grains are chosen when a metric is queried.
-- Mirrored in scripts/migrate.sql.

ALTER TABLE object_types ADD COLUMN IF NOT EXISTS metrics JSONB NOT NULL DEFAULT '{}';
