# API Contract Changes: Cursor-Based Pagination

**Date**: 2026-03-24 | **Base URL**: `http://localhost:{PORT}/api`

## Changed Endpoint

### GET /api/bookmarks

List bookmarks with cursor-based pagination. Always returns the paginated envelope.

**Query parameters**:

| Param     | Type    | Required | Description                                                  |
|-----------|---------|----------|--------------------------------------------------------------|
| search    | string  | No       | Substring search across title, URL, description (unchanged)  |
| tag       | string  | No       | Filter by tag name (exact match, lowercase) (unchanged)      |
| favorite  | boolean | No       | If `true`, return only favorites (unchanged)                 |
| cursor    | string  | No       | Opaque cursor value from a previous response's `next_cursor` or `prev_cursor` |
| page_size | integer | No       | Number of results per page (default: 20, min: 1, max: 100)  |

**Parameter behavior**:
- No `cursor`: returns the first page (newest bookmarks)
- `cursor` from `next_cursor`: returns the next page (older bookmarks)
- `cursor` from `prev_cursor`: returns the previous page (newer bookmarks)
- `page_size` > 100: silently capped at 100
- `page_size` < 1, zero, negative, or non-numeric: returns `400`

**Response** `200 OK`:

```json
{
  "bookmarks": [
    {
      "id": 42,
      "url": "https://example.com",
      "title": "Example Site",
      "description": "An example bookmark",
      "is_favorite": false,
      "created_at": "2026-03-24T10:00:00",
      "tags": ["web dev", "reference"]
    }
  ],
  "pagination": {
    "next_cursor": "eyJjIjoiMjAyNi0wMy0yNFQwOTowMDowMCIsImkiOjQxfQ",
    "prev_cursor": null,
    "total": 150,
    "page_size": 20
  }
}
```

**Pagination fields**:

| Field        | Type         | Description                                                      |
|--------------|--------------|------------------------------------------------------------------|
| next_cursor  | string\|null | Cursor to fetch the next page. `null` if on the last page.       |
| prev_cursor  | string\|null | Cursor to fetch the previous page. `null` if on the first page.  |
| total        | integer      | Total count of bookmarks matching the current filters.            |
| page_size    | integer      | The page size used for this response (may differ from requested if capped). |

**Error** `400 Bad Request` (invalid cursor):

```json
{ "error": "Invalid cursor" }
```

**Error** `400 Bad Request` (invalid page_size):

```json
{ "error": "Invalid page size: must be a positive integer" }
```

**Error** `500 Internal Server Error`:

```json
{ "error": "<message>" }
```

## Empty Results

When no bookmarks match the filters:

```json
{
  "bookmarks": [],
  "pagination": {
    "next_cursor": null,
    "prev_cursor": null,
    "total": 0,
    "page_size": 20
  }
}
```

## Unchanged Endpoints

All other endpoints remain exactly as documented in `specs/001-linkstash-bookmarks/contracts/api.md`:

- POST /api/bookmarks
- GET /api/bookmarks/:id
- PUT /api/bookmarks/:id
- DELETE /api/bookmarks/:id
- PATCH /api/bookmarks/:id/favorite
- GET /api/bookmarks/fetch-title
- GET /api/tags
