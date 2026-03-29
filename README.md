# LinkStash

Personal bookmark manager with tags, favorites, and search.

## Features

- Save and organize bookmarks with titles, descriptions, and tags
- Toggle favorites for quick access
- Full-text search across URLs, titles, and descriptions
- Filter by tag or favorites
- Auto-fetch page titles from URLs
- Vanilla JS frontend — no build step required

## Tech Stack

- **Runtime:** Node.js 20+ (ES modules)
- **Server:** Express 5
- **Database:** SQLite via better-sqlite3
- **Frontend:** Vanilla HTML/CSS/JS
- **Testing:** Vitest + Supertest

## Quick Start

**Prerequisites:** Node.js 20+

```bash
# Install dependencies
npm install

# Start the server (port 3000)
npm start

# Start with file watching (dev mode)
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

Open http://localhost:3000 in your browser.

## Project Structure

```
src/
  app.js              # Express app setup
  server.js           # Server entry point
  config.js           # Configuration (port, DB path)
  db/
    database.js       # Database connection
    migrate.js        # Migration runner
    migrations/       # SQL migration files
  routes/
    bookmarks.js      # Bookmark endpoints
    tags.js           # Tag endpoints
  services/
    bookmarkService.js
    tagService.js
    titleFetcher.js   # Auto-fetch page titles
  utils/
    tags.js           # Tag parsing utilities
public/
  index.html          # Frontend entry point
  css/style.css
  js/
    app.js            # Frontend app init
    api.js            # API client
    ui.js             # UI rendering
tests/
  unit/               # Unit tests
  integration/        # API integration tests
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/bookmarks` | List bookmarks (query: `search`, `tag`, `favorite`) |
| `GET` | `/api/bookmarks/:id` | Get a single bookmark |
| `POST` | `/api/bookmarks` | Create a bookmark |
| `PUT` | `/api/bookmarks/:id` | Update a bookmark |
| `DELETE` | `/api/bookmarks/:id` | Delete a bookmark |
| `PATCH` | `/api/bookmarks/:id/favorite` | Toggle favorite status |
| `GET` | `/api/bookmarks/fetch-title` | Auto-fetch title (query: `url`) |
| `GET` | `/api/tags` | List all tags with bookmark counts |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `DB_PATH` | `data/linkstash.db` | SQLite database file path |

## License

ISC

## TBD
1. Pagination — Practical, since the app currently loads all bookmarks at once. Good for scaling beyond hundreds.
  2. Bookmark Import/Export — Import from browser HTML bookmark files, export to JSON. Useful and has interesting edge cases (duplicate handling, tag mapping, malformed files).

  New ideas that would add real value:
  3. Link Health Checker — Periodically or on-demand check if bookmarked URLs are still alive. Show status indicators (alive/dead/redirect), detect link rot. This is a more
  interesting spec with background processing, status tracking, and UI considerations.
  4. Collections — Group bookmarks into named collections (beyond flat tags). Adds organizational depth — e.g., "Research", "Recipes", "Work".

  My recommendation: Bookmark Import/Export or Link Health Checker would make for the most interesting and well-scoped spec. Pagination is straightforward but a bit thin as a
  standalone feature. Import/Export has clear user value and meaty edge cases. Link Health Checker is the most architecturally interesting.
