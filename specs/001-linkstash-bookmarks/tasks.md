# Tasks: LinkStash Bookmark Manager — Core Feature Set

**Input**: Design documents from `/specs/001-linkstash-bookmarks/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api.md, research.md, quickstart.md

**Tests**: Included per Constitution Principle III — integration tests cover CRUD, tag assignment/removal, and search/filter endpoints. Unit tests cover service logic with complex behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and configuration

- [X] T001 Initialize Node.js project with package.json (type: module, scripts for start/dev/test/lint) and install dependencies (express, better-sqlite3) in package.json
- [X] T002 [P] Create project directory structure per plan.md: src/routes/, src/services/, src/utils/, src/db/migrations/, public/css/, public/js/, tests/integration/, tests/unit/
- [X] T003 [P] Create application config with port, database path, and fetch timeout in src/config.js
- [X] T004 [P] Create Vitest configuration in vitest.config.js and add vitest, supertest as devDependencies in package.json
- [X] T005 [P] Set up ESLint with flat config for Node.js ES modules in eslint.config.js, add eslint as devDependency, and add "lint" script to package.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database, Express server, shared utilities, and frontend shell that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 [P] Create initial schema migration (bookmarks, tags, bookmark_tags, _migrations tables) in src/db/migrations/001-initial-schema.sql
- [X] T007 [P] Implement migration runner that reads SQL files from src/db/migrations/ and tracks applied migrations in src/db/migrate.js
- [X] T008 Implement database initialization with better-sqlite3 connection, WAL mode, foreign keys, and migration execution in src/db/database.js
- [X] T009 [P] Create Express app with JSON body parsing, static file serving from public/, and route mounting in src/app.js
- [X] T010 Create server entry point that initializes database then starts Express listening in src/server.js
- [X] T011 [P] Create single-page HTML shell with bookmark list container, add-bookmark form, search bar, tag sidebar, and favorites filter in public/index.html
- [X] T012 [P] Create fetch wrapper module for all /api/* calls (GET, POST, PUT, DELETE, PATCH) in public/js/api.js
- [X] T013 [P] Create base stylesheet with layout grid, bookmark card styles, form styles, button styles, and responsive design in public/css/style.css
- [X] T014 [P] Create shared tag normalization utility (lowercase, trim, strip to alphanumeric + hyphens + spaces, deduplicate) in src/utils/tags.js

**Checkpoint**: Server starts, serves static files, database initializes with empty tables. Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Save and View Bookmarks (Priority: P1) 🎯 MVP

**Goal**: Users can save bookmarks (URL + title + optional description/tags) and see all bookmarks on the main page sorted newest-first.

**Independent Test**: Save 3–5 bookmarks with different combinations of title/description/tags. Verify they appear on the main page sorted by newest first with correct details displayed.

**Covers**: FR-001, FR-002, FR-003, FR-004, FR-016, FR-017

### Implementation for User Story 1

- [X] T015 [P] [US1] Implement URL validation helper (http/https only via URL constructor) and bookmark create (using shared tag normalization from src/utils/tags.js), getAll (sorted by created_at DESC), and getById methods in src/services/bookmarkService.js
- [X] T016 [P] [US1] Implement URL title auto-fetch using native fetch() with 5-second AbortSignal.timeout and regex title extraction in src/services/titleFetcher.js
- [X] T017 [US1] Create bookmark routes for POST /api/bookmarks, GET /api/bookmarks, GET /api/bookmarks/:id, and GET /api/bookmarks/fetch-title in src/routes/bookmarks.js
- [X] T018 [US1] Implement bookmark list rendering (title, truncated URL, tags, favorite star, date) and add-bookmark modal/form with tag input in public/js/ui.js
- [X] T019 [US1] Wire up page load (fetch and render bookmarks), add-bookmark form submission, and title auto-fetch on URL blur in public/js/app.js

### Tests for User Story 1

- [X] T020 [US1] Write integration tests for POST /api/bookmarks (valid create, invalid URL rejection, missing title rejection) and GET /api/bookmarks (list sorted by newest, empty list) and GET /api/bookmarks/:id (found, not found) in tests/integration/bookmarks.test.js
- [X] T021 [P] [US1] Write unit tests for bookmarkService create, getAll, getById and URL validation logic in tests/unit/bookmarkService.test.js
- [X] T022 [P] [US1] Write unit tests for titleFetcher (successful fetch, timeout handling, missing title fallback) in tests/unit/titleFetcher.test.js

**Checkpoint**: Users can add bookmarks and see them listed on the main page. MVP is functional. CRUD create+read tests pass.

---

## Phase 4: User Story 2 — Edit and Delete Bookmarks (Priority: P1)

**Goal**: Users can edit any bookmark field and permanently delete bookmarks with confirmation.

**Independent Test**: Save a bookmark, edit each field (title, URL, description, tags), verify changes persist. Delete it and confirm it disappears from all views.

**Covers**: FR-005, FR-006

### Implementation for User Story 2

- [X] T023 [US2] Add update (with URL re-validation and tag reconciliation using shared tag normalization from src/utils/tags.js, in a transaction) and delete methods to src/services/bookmarkService.js
- [X] T024 [US2] Add PUT /api/bookmarks/:id and DELETE /api/bookmarks/:id routes in src/routes/bookmarks.js
- [X] T025 [US2] Add edit form pre-population, update submission handling, and delete confirmation dialog to public/js/ui.js
- [X] T026 [US2] Wire up edit button click (populate form), save-edit submission, and delete button with confirmation prompt in public/js/app.js

### Tests for User Story 2

- [X] T027 [US2] Write integration tests for PUT /api/bookmarks/:id (valid update, URL re-validation, tag reconciliation, not found) and DELETE /api/bookmarks/:id (successful delete, not found, verify cascade) in tests/integration/bookmarks.test.js
- [X] T028 [P] [US2] Write unit tests for bookmarkService update and delete methods (transaction behavior, tag reconciliation) in tests/unit/bookmarkService.test.js

**Checkpoint**: Full CRUD is operational. Users can create, view, edit, and delete bookmarks. All CRUD integration tests pass.

---

## Phase 5: User Story 3 — Favorite Bookmarks (Priority: P2)

**Goal**: Users can toggle favorite status with one click and filter the view to show only favorites.

**Independent Test**: Save 5 bookmarks, favorite 2 of them, verify the star toggles visually. Activate favorites-only filter and confirm only the 2 favorited bookmarks appear.

**Covers**: FR-007, FR-008

### Implementation for User Story 3

- [X] T029 [US3] Add toggleFavorite method and is_favorite filter parameter to getAll query in src/services/bookmarkService.js
- [X] T030 [US3] Add PATCH /api/bookmarks/:id/favorite route and ?favorite=true query param handling to src/routes/bookmarks.js
- [X] T031 [US3] Add clickable favorite star toggle on bookmark cards and favorites-only filter button with active state in public/js/ui.js and public/js/app.js

### Tests for User Story 3

- [X] T032 [US3] Write integration tests for PATCH /api/bookmarks/:id/favorite (toggle on, toggle off, not found) and GET /api/bookmarks?favorite=true (filter returns only favorites) in tests/integration/bookmarks.test.js

**Checkpoint**: Favorites work end-to-end. Users can star/unstar bookmarks and filter to favorites only. Favorite tests pass.

---

## Phase 6: User Story 4 — Tag Management (Priority: P2)

**Goal**: Users can see all tags with bookmark counts, click a tag to filter bookmarks, and manage tags on bookmarks.

**Independent Test**: Save 5 bookmarks with various tags. Verify tags display correctly on cards, tag list shows accurate counts, and clicking a tag filters to only bookmarks with that tag.

**Covers**: FR-009, FR-010, FR-011, FR-012

### Implementation for User Story 4

- [X] T033 [P] [US4] Implement tag service with getAllWithCounts (JOIN bookmark_tags, exclude orphans), using shared tag normalization from src/utils/tags.js, in src/services/tagService.js
- [X] T034 [US4] Create GET /api/tags route returning tags with bookmark counts in src/routes/tags.js
- [X] T035 [US4] Add ?tag= query parameter filtering (JOIN bookmark_tags + tags) to GET /api/bookmarks in src/routes/bookmarks.js and src/services/bookmarkService.js
- [X] T036 [US4] Add tag sidebar list with counts, clickable tag badges on bookmark cards, and active tag filter state management in public/js/ui.js and public/js/app.js

### Tests for User Story 4

- [X] T037 [US4] Write integration tests for GET /api/tags (returns tags with counts, excludes orphans) and GET /api/bookmarks?tag=X (filter by tag) in tests/integration/tags.test.js
- [X] T038 [P] [US4] Write integration tests for tag assignment on bookmark create/update and tag removal (verify cascade behavior, orphan cleanup) in tests/integration/bookmarks.test.js
- [X] T039 [P] [US4] Write unit tests for tagService getAllWithCounts in tests/unit/tagService.test.js

**Checkpoint**: Tag browsing works end-to-end. Users can see tags with counts and filter bookmarks by tag. Tag tests pass.

---

## Phase 7: User Story 5 — Search and Filter (Priority: P3)

**Goal**: Users can search bookmarks by keyword across title/URL/description and combine search with tag and favorite filters.

**Independent Test**: Save 10+ bookmarks with diverse titles/descriptions. Search for specific keywords and verify correct results. Combine search with a tag filter and verify both constraints apply simultaneously.

**Covers**: FR-013, FR-014, FR-015

### Implementation for User Story 5

- [X] T040 [US5] Add search parameter to getAll using LIKE '%keyword%' across title, URL, and description (case-insensitive) in src/services/bookmarkService.js
- [X] T041 [US5] Add ?search= query param and combined filter support (search + tag + favorite simultaneously) to GET /api/bookmarks in src/routes/bookmarks.js
- [X] T042 [US5] Add search input with 300ms debounce, combined filter state (search + tag + favorite), and "No bookmarks found" empty state in public/js/ui.js and public/js/app.js

### Tests for User Story 5

- [X] T043 [US5] Write integration tests for GET /api/bookmarks?search=X (keyword match across title/URL/description, case-insensitive, no results) and combined filters (search + tag, search + favorite, search + tag + favorite) in tests/integration/search.test.js

**Checkpoint**: All filtering capabilities work together. Users can search, filter by tag, and filter by favorite in any combination. Search/filter tests pass.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error handling, and UX improvements that span multiple user stories

- [X] T044 Add empty state welcome message ("No bookmarks yet. Click Add Bookmark to save your first link!") for zero-bookmark state in public/js/ui.js
- [X] T045 [P] Add centralized error handling middleware for consistent JSON error responses in src/app.js
- [X] T046 [P] Add graceful handling for long URLs/titles (display truncation), special characters in tags, and edge cases per spec in src/services/ and public/js/ui.js
- [X] T047 Run ESLint across all source files and fix any linting violations
- [X] T048 Run quickstart.md validation: npm install → npm start → verify app loads at localhost:3000 and core workflows function

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phases 3–7)**: All depend on Phase 2 completion
  - US1 and US2 are both P1 — execute sequentially (US2 builds on US1's service/routes)
  - US3 and US4 are both P2 — can run in parallel after US1+US2 (different concerns)
  - US5 is P3 — depends on US3 and US4 (combines their filter params)
- **Polish (Phase 8)**: Depends on all user stories being complete

### Test Task Dependencies

- **US1 tests (T020–T022)**: Depend on T015–T017 (US1 implementation). Run after US1 backend is complete.
- **US2 tests (T027–T028)**: Depend on T023–T024 (US2 implementation). Extend tests/integration/bookmarks.test.js.
- **US3 tests (T032)**: Depends on T029–T030 (US3 implementation).
- **US4 tests (T037–T039)**: Depend on T033–T035 (US4 implementation).
- **US5 tests (T043)**: Depends on T040–T041 (US5 implementation).
- **Linting (T047)**: Depends on all implementation being complete. Run before final validation.

### User Story Dependencies

- **US1 (P1)**: Depends only on Foundational — no other story dependencies
- **US2 (P1)**: Depends on US1 (extends bookmarkService.js and bookmarks.js routes)
- **US3 (P2)**: Depends on US1 (extends bookmarkService.js getAll with favorite filter)
- **US4 (P2)**: Depends on US1 (extends bookmarkService.js getAll with tag filter). Can run in parallel with US3.
- **US5 (P3)**: Depends on US3 + US4 (combines search, tag, and favorite filter params into one query)

### Within Each User Story

1. Service layer before routes (routes call services)
2. Backend (service + routes) before frontend (UI calls API)
3. UI rendering before event wiring (app.js depends on ui.js functions)
4. **Tests after backend implementation** (tests validate API endpoints and service logic)

### Parallel Opportunities

**Phase 1**: T002, T003, T004, T005 can all run in parallel after T001
**Phase 2**: T006, T007 in parallel → T008 after both → T009 parallel with T008 → T010 after T008+T009. T011, T012, T013, T014 all in parallel (independent files).
**Phase 3 (US1)**: T015, T016 in parallel (different service files) → T017 after T015+T016 → T018, then T019. Then T020 after T017; T021, T022 in parallel.
**Phase 5+6 (US3, US4)**: Can run in parallel — US3 modifies favorite logic, US4 adds tag service/routes (no file conflicts except bookmarkService.js getAll, which needs sequential coordination)

---

## Parallel Example: User Story 1

```text
# Step 1 — Launch service implementations in parallel:
T015: "Implement bookmarkService (create, getAll, getById) in src/services/bookmarkService.js"
T016: "Implement titleFetcher (auto-fetch with 5s timeout) in src/services/titleFetcher.js"

# Step 2 — Routes (depends on T015, T016):
T017: "Create bookmark routes (POST, GET, fetch-title) in src/routes/bookmarks.js"

# Step 3 — Frontend (depends on T017 for API shape):
T018: "Implement bookmark list rendering and add form in public/js/ui.js"
T019: "Wire up app logic and events in public/js/app.js"

# Step 4 — Tests (depends on T015–T017 for backend):
T020: "Integration tests for bookmark CRUD endpoints in tests/integration/bookmarks.test.js"
T021: "Unit tests for bookmarkService in tests/unit/bookmarkService.test.js"  (parallel with T020)
T022: "Unit tests for titleFetcher in tests/unit/titleFetcher.test.js"       (parallel with T020)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Setup (including ESLint)
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Save and View) + Tests
4. **STOP and VALIDATE**: Add a few bookmarks, verify listing works. Run tests — all must pass.
5. Complete Phase 4: User Story 2 (Edit and Delete) + Tests
6. **VALIDATE**: Full CRUD working + all CRUD tests pass — this is a usable MVP

### Incremental Delivery

1. Setup + Foundational → Server starts, DB ready, linting configured
2. US1 (Save/View) + Tests → Can add and browse bookmarks (MVP!)
3. US2 (Edit/Delete) + Tests → Full CRUD operational
4. US3 (Favorites) + Tests → Quick-access organization
5. US4 (Tags) + Tests → Topic-based browsing
6. US5 (Search) + Tests → Full-text discovery with combined filters
7. Polish → Edge cases, error handling, linting pass, UX refinements

Each story adds value without breaking previous stories. Tests validate each increment.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable at its checkpoint
- Commit after each task or logical group
- Tag normalization (lowercase, trim, alphanumeric + hyphens + spaces) is implemented once in src/utils/tags.js (T014) and reused by bookmarkService (T015 create, T023 update) and tagService (T033)
- bookmarkService.js getAll is enhanced incrementally: basic (US1) → favorite filter (US3) → tag filter (US4) → search (US5)
- All code MUST pass ESLint before commit (Constitution Development Workflow)
- All CRUD, tag, and search/filter tests MUST pass before deployment (Constitution Principle III)

## Task–FR Coverage Matrix

| FR | Impl Task | Test Task | Description |
|----|-----------|-----------|-------------|
| FR-001 | T015 | T020, T021 | Create bookmark (URL + title + tags) |
| FR-002 | T015 | T020, T021 | URL validation |
| FR-003 | T016 | T022 | Auto-fetch title |
| FR-004 | T015, T017 | T020 | Display bookmarks newest-first |
| FR-005 | T023, T024 | T027, T028 | Edit bookmark fields |
| FR-006 | T024 | T027 | Delete with confirmation |
| FR-007 | T029, T030 | T032 | Toggle favorite |
| FR-008 | T030 | T032 | Filter favorites |
| FR-009 | T014, T015 | T038 | Tag normalization |
| FR-010 | T014, T015 | T038 | No duplicate tags |
| FR-011 | T033, T034 | T037 | Tag list with counts |
| FR-012 | T035 | T037 | Filter by tag |
| FR-013 | T040 | T043 | Full-text search |
| FR-014 | T042 | T043 | Debounced search |
| FR-015 | T041 | T043 | Combined filters |
| FR-016 | T008 | T020 | Persistent SQLite storage |
| FR-017 | T015 | T020 | Creation timestamp |
