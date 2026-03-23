# API Contracts: LinkStash Bookmark Manager

**Date**: 2026-03-18 | **Base URL**: `http://localhost:{PORT}/api`

## Common Conventions

- **Content-Type**: `application/json` for all request/response bodies
- **Error format**: `{ "error": "<message>" }` with appropriate HTTP status code
- **IDs**: Integer, auto-generated
- **Timestamps**: ISO 8601 strings (e.g., `2026-03-18T14:30:00.000Z`)

## Endpoints

### Bookmarks

#### GET /api/bookmarks

List all bookmarks, newest first. Supports optional query filters.

**Query parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| search | string | No | Substring search across title, URL, description |
| tag | string | No | Filter by tag name (exact match, lowercase) |
| favorite | boolean | No | If `true`, return only favorites |

**Response** `200 OK`:
```json
{
  "bookmarks": [
    {
      "id": 1,
      "url": "https://example.com",
      "title": "Example Site",
      "description": "An example bookmark",
      "is_favorite": false,
      "created_at": "2026-03-18T14:30:00.000Z",
      "tags": ["web dev", "reference"]
    }
  ]
}
```

---

#### POST /api/bookmarks

Create a new bookmark.

**Request body**:
```json
{
  "url": "https://example.com",
  "title": "Example Site",
  "description": "Optional description",
  "tags": ["web dev", "reference"]
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| url | string | Yes | Must be valid URL with http/https protocol |
| title | string | Yes | Non-empty after trimming |
| description | string | No | Trimmed, stored as-is |
| tags | string[] | No | Each tag: stripped to alphanumeric + hyphens + spaces, lowercased, trimmed, deduplicated |

**Response** `201 Created`:
```json
{
  "bookmark": {
    "id": 1,
    "url": "https://example.com",
    "title": "Example Site",
    "description": "Optional description",
    "is_favorite": false,
    "created_at": "2026-03-18T14:30:00.000Z",
    "tags": ["web dev", "reference"]
  }
}
```

**Error** `400 Bad Request`:
```json
{ "error": "Invalid URL format" }
```

---

#### GET /api/bookmarks/:id

Get a single bookmark by ID.

**Response** `200 OK`:
```json
{
  "bookmark": {
    "id": 1,
    "url": "https://example.com",
    "title": "Exam
    ple Site",
    "description": "Optional description",
    "is_favorite": false,
    "created_at": "2026-03-18T14:30:00.000Z",
    "tags": ["web dev", "reference"]
  }
}
```

**Error** `404 Not Found`:
```json
{ "error": "Bookmark not found" }
```

---

#### PUT /api/bookmarks/:id

Update an existing bookmark. All fields are optional — only provided fields are updated.

**Request body**:
```json
{
  "url": "https://updated-example.com",
  "title": "Updated Title",
  "description": "Updated description",
  "tags": ["new tag"]
}
```

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| url | string | No | Same as POST |
| title | string | No | Same as POST |
| description | string | No | Same as POST |
| tags | string[] | No | Same as POST; replaces all existing tags |

**Response** `200 OK`: Same shape as GET /api/bookmarks/:id

**Error** `400 Bad Request` / `404 Not Found`: Same error format

---

#### DELETE /api/bookmarks/:id

Delete a bookmark permanently. No confirmation on API level (frontend handles confirmation dialog per FR-006).

**Response** `204 No Content`: Empty body

**Error** `404 Not Found`:
```json
{ "error": "Bookmark not found" }
```

---

#### PATCH /api/bookmarks/:id/favorite

Toggle the favorite status of a bookmark.

**Request body**: None required (server toggles current value)

**Response** `200 OK`:
```json
{
  "bookmark": {
    "id": 1,
    "is_favorite": true
  }
}
```

**Error** `404 Not Found`:
```json
{ "error": "Bookmark not found" }
```

---

#### GET /api/bookmarks/fetch-title

Auto-fetch the title for a given URL. Used by the frontend during bookmark creation.

**Query parameters**:

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| url | string | Yes | URL to fetch title from |

**Response** `200 OK`:
```json
{
  "title": "The Page Title"
}
```

**Response** `200 OK` (fetch failed or no title found):
```json
{
  "title": null
}
```

**Error** `400 Bad Request`:
```json
{ "error": "URL is required" }
```

---

### Tags

#### GET /api/tags

List all tags that have at least one bookmark, with counts.

**Response** `200 OK`:
```json
{
  "tags": [
    { "id": 1, "name": "web dev", "count": 5 },
    { "id": 2, "name": "reference", "count": 3 }
  ]
}
```
