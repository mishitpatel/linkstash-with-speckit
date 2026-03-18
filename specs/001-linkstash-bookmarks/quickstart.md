# Quickstart: LinkStash Bookmark Manager

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
# Install dependencies
npm install

# Start the server
npm start
```

The app will be available at `http://localhost:3000` (default port).

## Development

```bash
# Run in development mode with auto-restart
npm run dev

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Layout

```
src/
├── app.js           # Express app setup
├── server.js        # Entry point
├── config.js        # Port, DB path, fetch timeout
├── routes/          # Thin HTTP handlers
├── services/        # Business logic
└── db/              # Database, migrations

public/              # Frontend (vanilla HTML/CSS/JS)
tests/               # Vitest test suites
```

## Key Design Decisions

- **SQLite** with WAL mode — data persists in a single file at `data/linkstash.db`
- **No authentication** — single-user personal tool
- **No pagination** — loads all bookmarks at once (suitable for hundreds)
- **Comma-separated tags** — supports multi-word tags like "web dev"
- **Title auto-fetch** — 5-second timeout, falls back to manual entry

## API Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/bookmarks | List all (with search/tag/favorite filters) |
| POST | /api/bookmarks | Create bookmark |
| GET | /api/bookmarks/:id | Get one |
| PUT | /api/bookmarks/:id | Update |
| DELETE | /api/bookmarks/:id | Delete |
| PATCH | /api/bookmarks/:id/favorite | Toggle favorite |
| GET | /api/bookmarks/fetch-title?url=... | Auto-fetch page title |
| GET | /api/tags | List tags with counts |

See [contracts/api.md](./contracts/api.md) for full request/response schemas.
