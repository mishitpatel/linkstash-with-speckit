# Quickstart: Cursor-Based Pagination

## What Changed

The `GET /api/bookmarks` endpoint now returns paginated results instead of all bookmarks at once.

## API Usage

### First page (default)

```bash
curl http://localhost:3000/api/bookmarks
```

Returns the 20 newest bookmarks with pagination metadata.

### Custom page size

```bash
curl "http://localhost:3000/api/bookmarks?page_size=10"
```

### Next page

Use the `next_cursor` from the previous response:

```bash
curl "http://localhost:3000/api/bookmarks?cursor=eyJjIjoiMjAyNi0wMy0yNFQwOTowMDowMCIsImkiOjQxfQ"
```

### Previous page

Use the `prev_cursor` from the current response:

```bash
curl "http://localhost:3000/api/bookmarks?cursor=eyJjIjoiMjAyNi0wMy0yNFQxMDowMDowMCIsImkiOjQyfQ"
```

### With filters

Filters compose with pagination:

```bash
curl "http://localhost:3000/api/bookmarks?tag=design&page_size=5"
curl "http://localhost:3000/api/bookmarks?search=react&cursor=eyJj..."
```

## Response Shape

```json
{
  "bookmarks": [...],
  "pagination": {
    "next_cursor": "...",
    "prev_cursor": null,
    "total": 150,
    "page_size": 20
  }
}
```

## Key Behaviors

- **Default page size**: 20 (min: 1, max: 100)
- **Over-max page size**: silently capped at 100
- **Invalid page size** (0, negative, non-numeric): returns 400 error
- **Invalid cursor** (malformed): returns 400 error
- **Deleted bookmark in cursor**: pagination resumes from next available position
- **Empty results**: `bookmarks: []` with `total: 0`, both cursors `null`

## Migration

A new migration `002-pagination-index.sql` adds a composite index. It runs automatically on server start.
