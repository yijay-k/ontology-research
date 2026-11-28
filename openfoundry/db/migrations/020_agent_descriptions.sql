-- What agents are told about a definition, kept apart from the description
-- people read (research: agent-facing metadata; NVIDIA Auto Ontology keeps
-- certified descriptions for the same purpose). Mirrored in scripts/migrate.sql.

ALTER TABLE object_types ADD COLUMN IF NOT EXISTS agent_description TEXT;
ALTER TABLE action_types ADD COLUMN IF NOT EXISTS agent_description TEXT;
