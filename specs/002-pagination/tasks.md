# Tasks: Cursor-Based Pagination for Bookmarks

**Input**: Design documents from `/specs/002-pagination/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Create the new migration and cursor utility that all stories depend on

- [x] T001 [P] Create pagination composite index migration in src/db/migrations/002-pagination-index.sql
- [x] T002 [P] Create cursor encode/decode utility in src/utils/cursor.js with encodeCursor(created_at, id) and decodeCursor(cursorString) functions using base64url JSON format `{ c, i }`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Refactor the bookmark service and route handler to support paginated queries — this is the engine for all user stories

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Refactor bookmarkService.getAll() in src/services/bookmarkService.js to a new getPaginated({ search, tag, favorite, cursor, pageSize }) function that: (1) builds keyset WHERE clause from decoded cursor using (created_at, id) seek, (2) applies existing filter conditions, (3) sorts by created_at DESC, id DESC, (4) applies LIMIT, (5) runs separate COUNT(*) for total, (6) computes next_cursor from last result and prev_cursor from first result, (7) returns { bookmarks, pagination: { next_cursor, prev_cursor, total, page_size } }. Note: if bookmarkService.js exceeds 200 lines (Constitution Principle II), extract pagination query-building logic into src/services/paginationHelper.js
- [x] T004 Update GET /api/bookmarks route handler in src/routes/bookmarks.js to: (1) parse `cursor` and `page_size` query parameters, (2) catch decodeCursor errors and return 400 `{ "error": "Invalid cursor" }` for malformed cursors (FR-014), (3) call bookmarkService.getPaginated() instead of getAll(), (4) return the paginated response envelope `{ bookmarks, pagination }`

**Checkpoint**: Backend pagination working — can be tested via curl/API calls

---

## Phase 3: User Story 1 - Browse Bookmarks Page by Page (Priority: P1) MVP

**Goal**: Users can navigate forward and backward through paginated bookmark pages with Previous/Next controls

**Independent Test**: Add 50+ bookmarks, load main page, verify only 20 appear. Click Next, verify next 20. Click Previous, verify original 20 return. Confirm Previous is hidden on first page and Next is hidden on last page.

### Implementation for User Story 1

- [x] T005 [US1] Update frontend api.js in public/js/api.js to: (1) accept cursor and page_size parameters in the getBookmarks() function, (2) append them as query params, (3) return the full response including pagination metadata
- [x] T006 [US1] Update frontend app.js in public/js/app.js to: (1) store current pagination state (next_cursor, prev_cursor, total, page_size), (2) add loadNextPage() and loadPreviousPage() handlers that call getBookmarks with the appropriate cursor, (3) wire up event listeners for pagination controls, (4) reset pagination when filters change
- [x] T007 [US1] Update frontend ui.js in public/js/ui.js to: (1) render Previous/Next buttons below the bookmark list, (2) show/hide Previous button based on prev_cursor being null, (3) show/hide Next button based on next_cursor being null, (4) display a total count indicator (e.g., "Showing 1–20 of 150") computed from page_size, total, and current page position
- [x] T008 [US1] Update existing bookmark integration tests in tests/integration/bookmarks.test.js to assert the new paginated response shape `{ bookmarks, pagination }` instead of `{ bookmarks }` for all existing test cases
- [x] T009 [US1] Add cursor pagination integration tests in tests/integration/pagination.test.js covering: (1) first page returns default 20 results with next_cursor and null prev_cursor, (2) navigating forward with next_cursor returns correct next page, (3) navigating backward with prev_cursor returns correct previous page, (4) last page has null next_cursor, (5) collection smaller than page_size returns all results with both cursors null, (6) empty collection returns empty bookmarks array with both cursors null, (7) total count is accurate across all pages, (8) no duplicate or missing bookmarks when paginating through entire collection
- [x] T010 [P] [US1] Add cursor utility unit tests in tests/unit/cursor.test.js covering: (1) encodeCursor produces valid base64url string, (2) decodeCursor round-trips correctly, (3) decodeCursor rejects malformed input (not base64, invalid JSON, missing fields, wrong types), (4) decodeCursor rejects empty string and null
- [x] T011 [US1] Update bookmarkService unit tests in tests/unit/bookmarkService.test.js to test getPaginated() with: (1) no cursor returns first page, (2) forward cursor returns correct subset, (3) backward cursor returns correct subset in correct order, (4) results are sorted by created_at DESC, id DESC

**Checkpoint**: User Story 1 fully functional — users can browse paginated bookmarks with Previous/Next controls

---

## Phase 4: User Story 2 - Configurable Page Size (Priority: P2)

**Goal**: Users can control how many bookmarks appear per page, with validation and capping

**Independent Test**: Request page_size=5, verify 5 results. Request page_size=200, verify 100 results (silently capped). Request page_size=0, verify 400 error. Request page_size=-1, verify 400 error. Request page_size=abc, verify 400 error.

### Implementation for User Story 2

- [x] T012 [US2] Add page_size validation in src/routes/bookmarks.js to: (1) parse page_size as integer, (2) reject non-numeric, zero, and negative values with 400 `{ "error": "Invalid page size: must be a positive integer" }`, (3) cap values > 100 at 100 silently, (4) default to 20 when not provided
- [x] T013 [US2] Add a page size selector to the frontend: (1) in public/js/ui.js render a dropdown or input near the pagination controls with preset options (10, 20, 50, 100), (2) in public/js/app.js store the selected page_size in state, pass it to getBookmarks(), and reset to page 1 when page size changes, (3) in public/js/api.js ensure page_size is included in the query string
- [x] T014 [US2] Add page size integration tests in tests/integration/pagination.test.js covering: (1) custom page_size returns correct number of results, (2) page_size > 100 is silently capped at 100 (response pagination.page_size = 100), (3) page_size = 0 returns 400 error, (4) page_size = -1 returns 400 error, (5) page_size = "abc" returns 400 error, (6) page_size = 1 returns exactly 1 result, (7) no page_size defaults to 20

**Checkpoint**: User Story 2 complete — page size validation and capping working

---

## Phase 5: User Story 3 - Pagination with Filters (Priority: P2)

**Goal**: Pagination composes correctly with search, tag, and favorite filters — no duplicates or gaps

**Independent Test**: Create 30 bookmarks with mixed tags. Filter by a tag matching 15. Paginate with page_size=5 through all 3 pages. Verify 15 total bookmarks seen, no duplicates. Change the tag filter and verify pagination resets to first page.

### Implementation for User Story 3

- [x] T015 [US3] Verify and fix filter composition in src/services/bookmarkService.js getPaginated() to ensure cursor seek conditions AND with filter conditions correctly (the keyset WHERE clause must be combined with filter WHERE clauses using AND, not replace them)
- [x] T016 [US3] Update search integration tests in tests/integration/search.test.js to assert the paginated response shape `{ bookmarks, pagination }` for all existing search/filter test cases
- [x] T017 [US3] Add filter+pagination integration tests in tests/integration/pagination.test.js covering: (1) tag filter + pagination returns only matching bookmarks across pages, (2) search filter + pagination returns only matching bookmarks across pages, (3) favorite filter + pagination returns only favorites across pages, (4) combined tag + search + pagination returns correct intersection, (5) total count reflects filtered count (not global count), (6) no duplicates or missing bookmarks when paginating through filtered results

**Checkpoint**: All three user stories complete — pagination works with all filter combinations

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements that affect multiple user stories

- [x] T018 Refine pagination bar visibility in public/js/ui.js: hide the entire pagination bar (buttons + count indicator) when total ≤ page_size (SC-005), distinct from T007 which hides individual buttons based on cursor nulls. This ensures users with fewer than 20 bookmarks see no pagination UI at all
- [x] T019 Run all tests via `npm test` and verify zero failures across existing and new test suites
- [x] T020 Add a performance smoke test in tests/integration/pagination.test.js that: (1) seeds 10,000 bookmarks using a loop insert, (2) requests the first page via GET /api/bookmarks, (3) asserts response completes in under 1 second (SC-001), (4) cleans up seeded data after test
- [x] T021 Validate quickstart.md scenarios manually — test each curl example from specs/002-pagination/quickstart.md against running server

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately. T001 and T002 are parallel.
- **Foundational (Phase 2)**: Depends on Phase 1 completion. T003 depends on T002 (cursor utility). T004 depends on T003.
- **User Story 1 (Phase 3)**: Depends on Phase 2 completion. Frontend tasks (T005–T007) are sequential. Test tasks (T008–T011) can start after T003/T004.
- **User Story 2 (Phase 4)**: Depends on Phase 2 completion. Can run in parallel with US1 backend but practically builds on T004.
- **User Story 3 (Phase 5)**: Depends on Phase 2 completion. T015 validates work done in T003. Tests depend on T003/T004.
- **Polish (Phase 6)**: Depends on all user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational (Phase 2) only. No dependencies on other stories.
- **User Story 2 (P2)**: Depends on Foundational (Phase 2). Validation logic layers on top of route handler from T004.
- **User Story 3 (P2)**: Depends on Foundational (Phase 2). Verifies filter composition from T003.

### Within Each User Story

- Backend changes before frontend changes
- Core logic before validation/edge cases
- Implementation before tests (tests validate the implementation)

### Parallel Opportunities

- T001 and T002 are fully parallel (different files)
- T008, T010 can run in parallel (different test files)
- US2 (T012–T014) and US3 (T015–T017) can be worked in parallel after Phase 2

---

## Parallel Example: Phase 1

```text
# Launch both setup tasks in parallel (different files):
Task: "Create migration in src/db/migrations/002-pagination-index.sql"
Task: "Create cursor utility in src/utils/cursor.js"
```

## Parallel Example: User Story 1 Tests

```text
# Launch parallel test tasks (different files):
Task: "Update bookmarks.test.js for paginated response"
Task: "Add cursor.test.js unit tests"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T004)
3. Complete Phase 3: User Story 1 (T005–T011)
4. **STOP and VALIDATE**: Test pagination end-to-end with 50+ bookmarks
5. Commit and demo if ready

### Incremental Delivery

1. Setup + Foundational → Pagination engine ready
2. Add User Story 1 → Forward/backward browsing works → MVP!
3. Add User Story 2 → Page size configuration validated
4. Add User Story 3 → Filter composition verified
5. Polish → Hide controls on single page, run full test suite

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No new npm dependencies required — cursor encoding uses built-in Buffer/JSON
- The existing `idx_bookmarks_created_at` index is kept (other features may use it)
- Commit after each phase completion for clean git history
