# Implementation Plan: Cursor-Based Pagination for Bookmarks

**Branch**: `002-pagination` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-pagination/spec.md`

## Summary

Add cursor-based pagination to the `GET /api/bookmarks` endpoint using keyset pagination over `(created_at DESC, id DESC)`. The response envelope changes from `{ bookmarks }` to `{ bookmarks, pagination }` with next/previous cursors, total count, and page size. A new composite index supports efficient seeks. The frontend is updated to show Previous/Next navigation controls that replace the bookmark list on each page transition.

## Technical Context

**Language/Version**: Node.js 20+ (ES modules)
**Primary Dependencies**: Express 4.x, better-sqlite3 (no new dependencies needed)
**Storage**: SQLite with WAL mode, new migration `002-pagination-index.sql` for composite index
**Testing**: Vitest + supertest (existing test infrastructure)
**Target Platform**: macOS/Linux localhost (personal use)
**Project Type**: Web application (Express backend + vanilla frontend)
**Performance Goals**: Sub-1-second page loads for collections up to 10,000 bookmarks (SC-001)
**Constraints**: Keyset pagination only — no OFFSET. Default page size 20, max 100. Single sort order (created_at DESC, id DESC).
**Scale/Scope**: Up to 10,000 bookmarks (upgrade from 001's "hundreds" target)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate Criteria | Status |
|---|-----------|---------------|--------|
| I | Simplicity First (YAGNI) | Every feature traceable to a user story. No new dependencies. | PASS — 3 user stories cover all 15 FRs. Zero new dependencies. Cursor encoding uses built-in `Buffer.from`/`JSON.parse`. |
| II | Clean Readable Code | Functions do one thing. Files < 200 lines. | PASS — Pagination logic in bookmarkService.js (single function change). Cursor encode/decode as small utility. |
| III | Critical Path Testing | CRUD integration tests. Pagination-specific tests. | PASS — Existing CRUD tests updated for new response shape. New pagination tests for cursor navigation, filters, edge cases. |
| IV | Minimal UI, Maximum Usability | Pagination controls visible. Search/filter still prominent. | PASS — Previous/Next buttons below bookmark list. Search bar unchanged. No pagination controls when ≤1 page. |
| V | Data Integrity | No data loss. Cursor seeks are stable. | PASS — Keyset pagination is insert/delete-stable. No schema changes to data tables. |
| VI | Convention Over Configuration | Standard layout. RESTful endpoints. Consistent error JSON. | PASS — Same endpoint, extended response. Errors use existing `{ "error": "..." }` format. Migration follows versioned pattern. |

**Gate result: ALL PASS** — No violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-pagination/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output (GET /api/bookmarks changes)
├── checklists/
│   ├── requirements.md  # Spec quality checklist
│   └── api.md           # API contract checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

Files modified or created by this feature:

```text
src/
├── services/
│   ├── bookmarkService.js   # Modified: getAll() → getPaginated() with cursor logic
│   └── paginationHelper.js  # New (if bookmarkService.js exceeds 200 lines): keyset query builder
├── routes/
│   └── bookmarks.js          # Modified: parse cursor/page_size params, return paginated envelope
├── utils/
│   └── cursor.js             # New: encodeCursor(), decodeCursor() helpers
└── db/
    └── migrations/
        └── 002-pagination-index.sql  # New: composite index

public/
└── js/
    ├── api.js                # Modified: pass cursor/page_size params
    ├── app.js                # Modified: pagination state, next/prev handlers
    └── ui.js                 # Modified: render pagination controls

tests/
├── integration/
│   ├── bookmarks.test.js     # Modified: update assertions for paginated response
│   ├── search.test.js        # Modified: update assertions for paginated response
│   └── pagination.test.js    # New: cursor pagination integration tests
└── unit/
    ├── bookmarkService.test.js  # Modified: test getPaginated()
    └── cursor.test.js           # New: cursor encode/decode unit tests
```

**Structure Decision**: No new directories. One new utility file (`src/utils/cursor.js`) for cursor encoding/decoding — this logic is shared between service and route layers. All other changes modify existing files. Test structure follows the existing pattern (integration + unit).

## Complexity Tracking

No constitution violations — table not needed.
