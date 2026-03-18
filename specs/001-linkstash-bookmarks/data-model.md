# Data Model: LinkStash Bookmark Manager

**Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)

## Entity-Relationship Overview

```
Bookmark  ──< bookmark_tags >──  Tag
  (1)          (M:N join)        (1)
```

Two domain entities with a many-to-many relationship via a join table.

## Tables

### bookmarks

| Column      | Type    | Constraints                        | Notes                            |
| ----------- | ------- | ---------------------------------- | -------------------------------- |
| id          | INTEGER | PRIMARY KEY AUTOINCREMENT          | Unique identifier                |
| url         | TEXT    | NOT NULL                           | Full URL including protocol      |
| title       | TEXT    | NOT NULL                           | Auto-fetched or manually entered |
| description | TEXT    | DEFAULT NULL                       | Optional user description        |
| is_favorite | INTEGER | NOT NULL DEFAULT 0                 | Boolean (0/1)                    |
| created_at  | TEXT    | NOT NULL DEFAULT (datetime('now')) | ISO 8601 timestamp               |

**Indexes**:
- `idx_bookmarks_created_at` on `created_at DESC` — supports default sort order (FR-004)
- `idx_bookmarks_is_favorite` on `is_favorite` — supports favorites filter (FR-008)

### tags

| Column | Type    | Constraints               | Notes                       |
| ------ | ------- | ------------------------- | --------------------------- |
| id     | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique identifier           |
| name   | TEXT    | NOT NULL UNIQUE           | Lowercase, trimmed (FR-009) |

**Indexes**:
- UNIQUE constraint on `name` serves as the index

### bookmark_tags (join table)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| bookmark_id | INTEGER | NOT NULL, FK → bookmarks(id) ON DELETE CASCADE | |
| tag_id | INTEGER | NOT NULL, FK → tags(id) ON DELETE CASCADE | |

**Constraints**:
- PRIMARY KEY (`bookmark_id`, `tag_id`) — prevents duplicate tags on a single bookmark (FR-010)
- CASCADE deletes ensure cleanup when a bookmark or orphan tag is removed

### _migrations (internal)

| Column     | Type | Constraints                        | Notes              |
| ---------- | ---- | ---------------------------------- | ------------------ |
| name       | TEXT | PRIMARY KEY                        | Migration filename |
| applied_at | TEXT | NOT NULL DEFAULT (datetime('now')) | When migration ran |

## Validation Rules

| Entity   | Field       | Rule                                                                                     | Source            |
| -------- | ----------- | ---------------------------------------------------------------------------------------- | ----------------- |
| Bookmark | url         | Must parse via `new URL()`, protocol must be `http:` or `https:`                         | FR-002            |
| Bookmark | title       | Required, non-empty string after trimming                                                | FR-001            |
| Bookmark | description | Optional, stored as-is (trimmed)                                                         | FR-001            |
| Tag      | name        | Stripped to alphanumeric + hyphens + spaces, then lowercase + trimmed. No empty strings. | FR-009, Edge Case |
|          |             |                                                                                          |                   |

## State Transitions

Bookmarks have a simple lifecycle with no complex state machine:

```
[Created] → [Exists] → [Edited] → [Exists]
                     → [Favorited/Unfavorited] → [Exists]
                     → [Deleted] → [Gone]
```

- **Created**: INSERT into bookmarks + INSERT/link tags in bookmark_tags (transaction)
- **Edited**: UPDATE bookmarks + reconcile bookmark_tags (delete removed, insert added — transaction)
- **Favorited/Unfavorited**: UPDATE bookmarks SET is_favorite = toggle (single statement, no transaction needed)
- **Deleted**: DELETE from bookmarks (CASCADE handles bookmark_tags cleanup — single statement)

## Tag Lifecycle

Tags are created implicitly when first used and become invisible when orphaned:
- **Created**: INSERT OR IGNORE into tags when assigning to a bookmark
- **Displayed**: Only when `bookmark_tags` has at least one row referencing the tag (FR-011)
- **Cleanup**: Orphan tags (zero bookmarks) can remain in the table but are excluded from queries via JOIN. Optional: periodic cleanup or cleanup on bookmark edit/delete.

## Migration: 001-initial-schema.sql

```sql
CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    is_favorite INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_is_favorite ON bookmarks(is_favorite);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS bookmark_tags (
    bookmark_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (bookmark_id, tag_id),
    FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```
