-- Add soft-delete support to canvases table
-- Allows marking canvases as deleted without immediately removing them
-- Auto-purge happens after 30 days via admin endpoint

ALTER TABLE canvases ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index for efficient filtering of active (non-deleted) canvases
CREATE INDEX IF NOT EXISTS canvases_deleted_at_idx ON canvases(deleted_at);

-- Index for efficient filtering of trashed (deleted) canvases
CREATE INDEX IF NOT EXISTS canvases_active_idx ON canvases(user_id, deleted_at) WHERE deleted_at IS NULL;
