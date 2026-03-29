-- Add composite index for cursor-based pagination (created_at DESC, id DESC)
-- Supports keyset seek: WHERE (created_at < ?) OR (created_at = ? AND id < ?)
CREATE INDEX IF NOT EXISTS idx_bookmarks_pagination ON bookmarks(created_at DESC, id DESC);
