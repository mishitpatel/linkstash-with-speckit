# Data Model: Cursor-Based Pagination

**Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)

## Schema Changes

No new tables are required. Pagination is implemented via query changes to the existing `bookmarks` table.

### New Index

A composite index is added to support efficient keyset pagination:

```sql
CREATE INDEX IF NOT EXISTS idx_bookmarks_pagination ON bookmarks(created_at DESC, id DESC);
```

This index covers the primary sort order (`created_at DESC`) and the tie-breaker (`id DESC`) in a single B-tree, enabling the cursor seek condition to resolve with a single index scan.

### Migration: 002-pagination-index.sql

```sql
-- Add composite index for cursor-based pagination (created_at DESC, id DESC)
-- Supports keyset seek: WHERE (created_at < ?) OR (created_at = ? AND id < ?)
CREATE INDEX IF NOT EXISTS idx_bookmarks_pagination ON bookmarks(created_at DESC, id DESC);
```

**Note**: The existing `idx_bookmarks_created_at` index on `created_at DESC` alone remains — it may still be useful for non-paginated queries or other features. The new composite index supplements it.

## Cursor Structure (Internal)

The cursor is an opaque base64url-encoded JSON value. Internal structure:

```json
{
  "c": "2026-03-24T10:00:00",
  "i": 42
}
```

| Field | Type   | Description                             |
|-------|--------|-----------------------------------------|
| c     | string | `created_at` value of the boundary row  |
| i     | number | `id` value of the boundary row          |

The cursor for the **next** page encodes the `(created_at, id)` of the **last item** on the current page.
The cursor for the **previous** page encodes the `(created_at, id)` of the **first item** on the current page.

## Pagination Query Patterns

### First page (no cursor)

```sql
SELECT * FROM bookmarks b
  [WHERE filters]
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT ?
```

### Next page (forward cursor)

```sql
SELECT * FROM bookmarks b
  WHERE (b.created_at < ? OR (b.created_at = ? AND b.id < ?))
  [AND filters]
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT ?
```

### Previous page (backward cursor)

```sql
SELECT * FROM bookmarks b
  WHERE (b.created_at > ? OR (b.created_at = ? AND b.id > ?))
  [AND filters]
  ORDER BY b.created_at ASC, b.id ASC
  LIMIT ?
-- Then reverse results in application code
```

### Total count

```sql
SELECT COUNT(*) FROM bookmarks b
  [WHERE filters]
```

## Validation Rules

| Input      | Rule                                                                      | Error                     |
|------------|---------------------------------------------------------------------------|---------------------------|
| cursor     | Must be valid base64url, decode to JSON with string `c` and integer `i`   | 400: "Invalid cursor"     |
| page_size  | Must be a positive integer (1–100); values > 100 silently capped at 100   | 400: "Invalid page size"  |
