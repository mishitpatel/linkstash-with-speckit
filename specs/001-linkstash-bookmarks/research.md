# Research: LinkStash Bookmark Manager

**Date**: 2026-03-18 | **Status**: Complete

## R-001: SQLite with better-sqlite3 — Best Practices

**Decision**: Use better-sqlite3 as the synchronous SQLite driver for Node.js.

**Rationale**: better-sqlite3 is the fastest SQLite driver for Node.js, uses synchronous API (simpler code, no callback/promise overhead for a single-user app), and supports WAL mode natively. Synchronous is ideal here — single user, no concurrency concerns, and Express handles async I/O at the HTTP layer.

**Alternatives considered**:
- `sqlite3` (async, callback-based) — more complex API, slower, no advantage for single-user.
- `knex` + SQLite — adds an ORM layer that violates YAGNI; raw SQL is clearer for a simple 2-table schema.

**Key practices**:
- Enable WAL mode immediately after opening: `db.pragma('journal_mode = WAL')`
- Use prepared statements for all queries (performance + SQL injection safety)
- Run migrations on startup before accepting requests
- Use transactions for bookmark+tag writes (multi-table)

## R-002: URL Validation Strategy

**Decision**: Use the built-in `URL` constructor (WHATWG URL API) for syntactic validation.

**Rationale**: Available in Node.js 20+ without dependencies. Validates protocol, hostname, and structure. Covers FR-002 requirement of "syntactically valid" without network requests.

**Alternatives considered**:
- `validator.js` library — adds a dependency for one function; YAGNI.
- Regex — fragile, hard to maintain, doesn't handle edge cases.
- HEAD request to check URL is live — too slow, not required by spec (format-only per clarification).

**Implementation**: `try { new URL(input); return true; } catch { return false; }` — accept `http://` and `https://` protocols only.

## R-003: Title Auto-Fetch Approach

**Decision**: Use Node.js built-in `fetch()` (available in Node 20+) with a 5-second `AbortSignal.timeout`.

**Rationale**: No additional dependencies. The 5-second timeout was confirmed in clarification. Parse only the `<title>` tag from the response — no need for a full HTML parser.

**Alternatives considered**:
- `cheerio` for HTML parsing — heavyweight for extracting one tag; YAGNI.
- `node-fetch` — unnecessary, native fetch available in Node 20+.
- `puppeteer` for JS-rendered titles — massive dependency, overkill.

**Implementation**: Fetch the URL, read response as text, regex extract `<title>(.*?)</title>`, trim. If fetch fails or no title found, return null and let the frontend prompt for manual entry.

## R-004: Search Implementation (Substring Matching)

**Decision**: Use SQLite `LIKE` operator with `%keyword%` pattern for substring search across title, URL, and description.

**Rationale**: The spec explicitly says "substring matching — not a weighted relevance engine." SQLite LIKE is sufficient for hundreds of bookmarks. No FTS5 extension needed.

**Alternatives considered**:
- SQLite FTS5 — powerful but overkill for substring matching on < 1000 rows.
- Application-level filtering — less efficient, pushes logic out of the database.

**Implementation**: `WHERE title LIKE ? OR url LIKE ? OR description LIKE ?` with `%keyword%` parameter. Case-insensitive by default in SQLite for ASCII (add `COLLATE NOCASE` for safety).

## R-005: Frontend Architecture (Vanilla JS)

**Decision**: Single-page vanilla HTML/CSS/JS with fetch API calls to the Express backend.

**Rationale**: Constitution mandates "No frameworks." A single `index.html` with modular JS files (app.js for logic, api.js for HTTP, ui.js for DOM) keeps it clean and testable.

**Key practices**:
- Use ES modules (`type="module"` in script tags) for clean imports
- Debounce search input using a simple `setTimeout`/`clearTimeout` pattern (300ms per spec)
- Use event delegation on the bookmark list for click handlers (edit, delete, favorite, tag filter)
- Modal or inline form for add/edit bookmark
- Render bookmarks by building DOM elements (not innerHTML for safety)

## R-006: Migration Strategy

**Decision**: Sequential numbered SQL files executed in order on startup.

**Rationale**: Constitution requires "versioned SQL files executed in order." Simple approach: read files from `src/db/migrations/` sorted by filename prefix (001-, 002-, etc.), track applied migrations in a `_migrations` table, run unapplied ones in a transaction.

**Alternatives considered**:
- `knex` migrations — adds a dependency; YAGNI.
- `umzug` — library overhead for what's ~20 lines of code.

**Implementation**: A `migrate.js` module that checks `_migrations` table, compares against files on disk, runs new ones wrapped in transactions.
