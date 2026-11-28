-- Edit history and revert (research P2): each commit records, per object it
-- touched, the properties before and the version after, so an object's history
-- is the commits whose `changes` contain it, and a commit can be undone while
-- its objects are still at those versions. A revert is itself a commit;
-- `revert_of` and `reverted_by` link the two. Mirrored in scripts/migrate.sql.

ALTER TABLE action_commits ADD COLUMN IF NOT EXISTS changes JSONB NOT NULL DEFAULT '[]';
ALTER TABLE action_commits ADD COLUMN IF NOT EXISTS revert_of TEXT;
ALTER TABLE action_commits ADD COLUMN IF NOT EXISTS reverted_by TEXT;
CREATE INDEX IF NOT EXISTS idx_action_commits_changes ON action_commits USING GIN (changes jsonb_path_ops);
