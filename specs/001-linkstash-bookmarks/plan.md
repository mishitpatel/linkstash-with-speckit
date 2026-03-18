# Implementation Plan: LinkStash Bookmark Manager — Core Feature Set

**Branch**: `001-linkstash-bookmarks` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-linkstash-bookmarks/spec.md`

## Summary

Build a personal bookmark manager (LinkStash) as a Node.js/Express web app with SQLite storage and a vanilla HTML/CSS/JS frontend. Core capabilities: save bookmarks with tags, mark favorites, full-text search with combined filters. Single-user, no auth, localhost only.

## Technical Context

**Language/Version**: Node.js 20+ (ES modules)
**Primary Dependencies**: Express 4.x (HTTP server + static files), better-sqlite3 (SQLite driver)
**Storage**: SQLite with WAL mode enabled, versioned SQL migrations in `src/db/migrations/`
**Testing**: Vitest (unit + integration tests), supertest (HTTP endpoint testing)
**Target Platform**: macOS/Linux localhost (personal use)
**Project Type**: Web application (Express backend serving vanilla frontend)
**Performance Goals**: All CRUD operations < 1 second (SC-003), search results within 500ms of pause (SC-004), app startup < 3 seconds (SC-007)
**Constraints**: No pagination (load all bookmarks), auto-fetch title timeout 5 seconds, no external services beyond title fetch
**Scale/Scope**: Hundreds of bookmarks (not thousands), single user, 1 main view + modal/form interactions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate Criteria | Status |
|---|-----------|---------------|--------|
| I | Simplicity First (YAGNI) | Every feature traceable to a user story. No config frameworks. Minimal dependencies. | PASS — 5 user stories cover all 17 FRs. Only 2 runtime deps (express, better-sqlite3). |
| II | Clean Readable Code | Functions do one thing. No abbreviations. Files < 200 lines. | PASS — Enforced by project structure (thin routes → services → db). |
| III | Critical Path Testing | CRUD integration tests. Tag assignment tests. Search/filter tests. | PASS — Vitest + supertest planned. Test scope matches constitution. |
| IV | Minimal UI, Maximum Usability | Search visible on main view. Add bookmark ≤ 2 clicks. 44px touch targets. | PASS — Single-page design with search bar + "Add Bookmark" button always visible. |
| V | Data Integrity | Confirmation on delete. URL validation. Tag normalization. WAL mode. Transactions for multi-table writes. | PASS — All encoded in FRs and edge cases. |
| VI | Convention Over Configuration | Standard layout (src/routes, services, db; public/). RESTful endpoints. Consistent error JSON. Versioned migrations. | PASS — Layout matches constitution exactly. |

**Gate result: ALL PASS** — No violations. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-linkstash-bookmarks/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (REST API contracts)
│   └── api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app.js               # Express app setup (middleware, static files, routes)
├── server.js            # Entry point (start listening)
├── config.js            # Single config file (port, db path, fetch timeout)
├── routes/
│   ├── bookmarks.js     # /api/bookmarks CRUD routes
│   └── tags.js          # /api/tags routes
├── services/
│   ├── bookmarkService.js   # Bookmark business logic
│   ├── tagService.js        # Tag business logic
│   └── titleFetcher.js      # URL title auto-fetch (5s timeout)
└── db/
    ├── database.js       # DB init, connection, WAL mode
    ├── migrations/
    │   └── 001-initial-schema.sql
    └── migrate.js        # Migration runner

public/
├── index.html           # Single page
├── css/
│   └── style.css
└── js/
    ├── app.js            # Main app logic, event wiring
    ├── api.js            # Fetch wrapper for /api/* calls
    └── ui.js             # DOM manipulation, rendering

tests/
├── integration/
│   ├── bookmarks.test.js    # CRUD endpoint tests
│   ├── tags.test.js         # Tag endpoint tests
│   └── search.test.js       # Search/filter endpoint tests
└── unit/
    ├── bookmarkService.test.js
    ├── tagService.test.js
    └── titleFetcher.test.js

package.json
vitest.config.js
```

**Structure Decision**: Web application with Express backend and vanilla static frontend served from `public/`. Backend follows the constitution's mandated `src/routes/`, `src/services/`, `src/db/` layout. Tests split into integration (HTTP endpoints with real DB) and unit (service logic).

## Complexity Tracking

No constitution violations — table not needed.
