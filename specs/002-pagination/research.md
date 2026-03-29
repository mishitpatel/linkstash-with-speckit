# Research: Cursor-Based Pagination for Bookmarks

**Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)

## 1. Cursor-Based Pagination with SQLite + better-sqlite3

**Decision**: Use a keyset (seek) pagination approach encoding `(created_at, id)` as the cursor.

**Rationale**: Keyset pagination avoids the performance degradation of `OFFSET` for large datasets. SQLite's B-tree indexes make `WHERE (created_at, id) < (?, ?)` efficient. The `(created_at DESC, id DESC)` compound index supports the required sort order and cursor seek in a single index scan.

**Alternatives considered**:
- **OFFSET/LIMIT**: Simple but O(n) for deep pages. Skips/duplicates when rows are inserted/deleted. Rejected per FR-002.
- **Page tokens with server-side state**: Requires session storage. Rejected — adds complexity and violates Simplicity First (YAGNI).
- **Keyset with opaque encoding (chosen)**: Stateless, O(1) seek, stable under inserts/deletes. Cursor is base64-encoded JSON of `{ created_at, id }`.

## 2. Cursor Encoding Format

**Decision**: Base64url-encoded JSON object `{ "c": "<created_at>", "i": <id> }`.

**Rationale**: JSON is human-debuggable when decoded. Base64url avoids URL-encoding issues in query parameters. Short field names minimize cursor length. The cursor is opaque to clients (they never construct it), so internal format can change without breaking the contract.

**Alternatives considered**:
- **Comma-separated values**: Fragile, no type safety, harder to extend.
- **Encrypted/signed tokens**: Overkill for a single-user local app with no security concerns around cursor tampering.
- **Integer ID only**: Insufficient — sort is by `created_at DESC, id DESC`, so ID alone doesn't define position.

## 3. Composite Index for Pagination Performance

**Decision**: Add a composite index `idx_bookmarks_pagination` on `(created_at DESC, id DESC)`.

**Rationale**: The existing `idx_bookmarks_created_at` index is on `created_at DESC` only. For keyset pagination, the query uses `WHERE (created_at < ?) OR (created_at = ? AND id < ?)` which benefits from a compound index covering both columns. SQLite can use this index for the sort and the seek condition in a single scan.

**Alternatives considered**:
- **Reuse existing index**: Would work but requires a secondary lookup for ID tie-breaking, slightly less efficient.
- **No new index**: Acceptable at small scale but doesn't scale to SC-001's 10,000 bookmark target.

## 4. Total Count Strategy

**Decision**: Execute a separate `SELECT COUNT(*)` with the same filter conditions alongside the paginated query.

**Rationale**: SQLite COUNT(*) is fast for simple conditions. Running it separately keeps the pagination query clean. For the expected scale (up to 10,000 bookmarks), this adds negligible overhead.

**Alternatives considered**:
- **Window function `COUNT(*) OVER()`**: Computes count for every row, wasteful for large pages.
- **Cached/approximate count**: Adds complexity. Unnecessary at this scale.
- **Omit count**: Spec FR-010 requires it.

## 5. Previous Cursor Implementation

**Decision**: Reverse the sort direction to fetch the previous page, then re-reverse the results.

**Rationale**: To get the page before the current cursor, query `WHERE (created_at > ?) OR (created_at = ? AND id > ?)` with `ORDER BY created_at ASC, id ASC LIMIT N`, then reverse the results to restore `created_at DESC, id DESC` order. This avoids fetching all preceding rows.

**Alternatives considered**:
- **Fetch all preceding and take last N**: O(n) for the first page from a deep position. Rejected.
- **Store bidirectional cursors in server state**: Violates stateless design.

## 6. Handling Deleted Bookmark in Cursor

**Decision**: The keyset `WHERE` condition naturally skips deleted rows — no special handling needed.

**Rationale**: The cursor `(created_at, id)` defines a position in the sorted sequence. If that row is deleted, the `<` comparison simply finds the next existing row. This is a built-in property of keyset pagination. Confirmed in spec clarification: "Cursors referencing deleted bookmarks are not invalid — the system resumes pagination from the next available position."

## 7. Response Envelope Design

**Decision**: Replace the existing `{ bookmarks: [...] }` response with `{ bookmarks: [...], pagination: { next_cursor, prev_cursor, total, page_size } }`.

**Rationale**: Nesting pagination metadata under a `pagination` key keeps the response clean and extensible. Confirmed in clarification: always return the paginated envelope, no backward-compatible mode. Cursor fields are `null` when not applicable (first page has no `prev_cursor`, last page has no `next_cursor`).
