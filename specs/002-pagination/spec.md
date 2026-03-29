# Feature Specification: Cursor-Based Pagination for Bookmarks

**Feature Branch**: `002-pagination`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "Add cursor-based pagination to the GET /api/bookmarks endpoint, returning next/previous cursors and supporting configurable page size"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse Bookmarks Page by Page (Priority: P1)

As a user with a large bookmark collection, I want the bookmark list to load a manageable number of bookmarks at a time and let me navigate forward and backward through pages, so that the interface stays fast and I can browse without being overwhelmed by hundreds of results.

**Why this priority**: This is the core pagination value — without it, the application degrades as the collection grows. A single page of results with "next" navigation is the minimum viable pagination experience.

**Independent Test**: Can be fully tested by adding 50+ bookmarks, loading the main page, verifying only a page-sized subset appears, clicking "next" to see the next set, and clicking "previous" to return to the first set.

**Acceptance Scenarios**:

1. **Given** I have 50 bookmarks saved, **When** I load the main page, **Then** only the first page of bookmarks is displayed (default page size) sorted by newest first.
2. **Given** I am viewing the first page of bookmarks, **When** I navigate to the next page, **Then** the next set of bookmarks is displayed, continuing from where the previous page ended.
3. **Given** I am viewing a page beyond the first, **When** I navigate to the previous page, **Then** the previous set of bookmarks is displayed.
4. **Given** I am viewing the first page of bookmarks, **When** I look for a "previous" navigation option, **Then** it is either absent or disabled since there are no earlier results.
5. **Given** I am viewing the last page of bookmarks, **When** I look for a "next" navigation option, **Then** it is either absent or disabled since there are no more results.
6. **Given** I am viewing any page of bookmarks, **When** I navigate to the next or previous page, **Then** the current list is fully replaced with the new page's bookmarks (not appended).

---

### User Story 2 - Configurable Page Size (Priority: P2)

As a user, I want to control how many bookmarks I see per page so that I can choose between a compact overview (fewer items) or a detailed browse (more items) depending on my preference.

**Why this priority**: Page size control enhances the browsing experience but the feature is fully usable with just the default page size. This adds flexibility on top of the core pagination.

**Independent Test**: Can be tested by requesting bookmarks with different page sizes (e.g., 5, 20, 50), verifying the correct number of results is returned each time, and confirming the page size is respected across pagination.

**Acceptance Scenarios**:

1. **Given** I have 30 bookmarks, **When** I request a page size of 10, **Then** exactly 10 bookmarks are returned on the first page.
2. **Given** I have 30 bookmarks, **When** I request a page size of 50 (more than total), **Then** all 30 bookmarks are returned on a single page with no "next" option.
3. **Given** I request a page size of 0 or a negative number, **When** the system processes my request, **Then** it rejects the request with a clear error message.
4. **Given** I request a page size larger than the maximum allowed, **When** the system processes my request, **Then** it caps the page size at the maximum and returns results accordingly.

---

### User Story 3 - Pagination with Filters (Priority: P2)

As a user, I want pagination to work seamlessly with search, tag, and favorite filters so that I can browse through large filtered result sets page by page.

**Why this priority**: Filters already exist in the application. Pagination must compose with them correctly or the user experience breaks. This is critical for correctness but not the first thing to build.

**Independent Test**: Can be tested by adding 30 bookmarks across different tags, filtering by a tag that matches 15 bookmarks, and paginating through the filtered results (page size 5) to verify all 15 appear across 3 pages with no duplicates or missing items.

**Acceptance Scenarios**:

1. **Given** I have 40 bookmarks and 20 of them are tagged "design", **When** I filter by tag "design" and navigate through pages (page size 10), **Then** I see exactly 20 bookmarks across 2 pages with no duplicates.
2. **Given** I have search results that span multiple pages, **When** I navigate to the next page, **Then** the search filter remains active and the next page shows the next set of matching results.
3. **Given** I am on page 2 of filtered results, **When** I change the filter (e.g., switch tags), **Then** pagination resets to the first page of the new filtered results.

---

### Edge Cases

- What happens when a bookmark is added or deleted while the user is paginating? The cursor-based approach ensures no items are skipped or duplicated — the cursor anchors to a specific position in the ordered list, so inserts/deletes before the cursor don't shift the window.
- What happens when the cursor value is malformed or unparseable? The system returns a clear error and the user is directed back to the first page. Cursors referencing deleted bookmarks are not considered invalid — pagination resumes from the next available position.
- What happens when the requested page size is not a number? The system returns a validation error.
- What happens when the collection is empty? The system returns an empty list with no cursors.
- What happens when exactly one page of results exists? The system returns the results with no next or previous cursors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST return bookmarks in pages rather than as a single unbounded list.
- **FR-002**: System MUST use cursor-based pagination (not offset-based) so that results remain stable when items are added or removed between page requests.
- **FR-003**: System MUST return a "next" cursor with each page of results when more results exist beyond the current page.
- **FR-004**: System MUST return a "previous" cursor with each page of results when earlier results exist before the current page.
- **FR-005**: System MUST accept a cursor parameter to fetch a specific page of results (next or previous).
- **FR-006**: System MUST accept a page size parameter to control how many bookmarks are returned per page.
- **FR-007**: System MUST use a default page size of 20 when no page size is specified.
- **FR-008**: System MUST silently cap page size at 100 when a value greater than 100 is requested (return 100 results, no error).
- **FR-009**: System MUST enforce a minimum page size of 1.
- **FR-010**: System MUST return a total count of matching bookmarks alongside each page of results so the user knows how many items exist.
- **FR-011**: System MUST maintain the existing sort order (newest first by creation date) when paginating, using bookmark ID as a secondary sort (descending) to guarantee deterministic ordering when timestamps are identical.
- **FR-012**: System MUST support pagination combined with all existing filters (search, tag, favorite) without duplicating or skipping results.
- **FR-013**: System MUST return an empty list with no cursors when the result set is empty.
- **FR-014**: System MUST reject malformed or unparseable cursor values with a clear error message. Cursors referencing deleted bookmarks are not invalid — the system resumes pagination from the next available position.
- **FR-015**: System MUST reject invalid page size values (non-numeric, zero, negative) with a clear error message. Values exceeding the maximum are not rejected — they are silently capped per FR-008.

### Key Entities

- **Cursor**: An opaque value representing a position in the ordered bookmark list. Used to fetch the next or previous page of results. The cursor encodes enough information to reliably resume pagination from a specific point.
- **Paginated Result**: A response envelope containing a list of bookmarks for the current page, optional next/previous cursors, the total count of matching items, and the page size used.

### Assumptions

- The existing sort order (newest first by creation date) is the only supported sort for pagination. Sorting by other fields is out of scope.
- Cursors are opaque to the client — the client does not need to understand or construct cursor values, only pass them back to the server.
- The default page size of 20 and maximum of 100 are reasonable for a personal bookmark manager.
- Backward pagination (previous cursor) navigates toward newer items (since default sort is newest-first).
- The total count is computed per request and reflects the current state of the filtered collection.
- The response format always includes the paginated envelope (bookmarks, cursors, total count, page size), even when no pagination parameters are provided. There is no backward-compatible "old format" mode — the frontend is updated alongside the backend.

## Clarifications

### Session 2026-03-24

- Q: How should the cursor handle tie-breaking when multiple bookmarks share the same creation timestamp? → A: Use bookmark ID as tie-breaker (secondary sort by ID descending).
- Q: Should clients that don't pass pagination parameters get the old response format or the new paginated format? → A: Always return the paginated envelope — no backward-compatible old format mode.
- Q: How should the frontend update when navigating between pages? → A: Page replacement — the current list is replaced with the new page's bookmarks (not infinite scroll or load-more).
- Q: Should requesting a page size exceeding the maximum (100) be rejected as an error or silently capped? → A: Silently cap at 100; only reject zero, negative, or non-numeric values.
- Q: What constitutes an "invalid cursor" — only malformed values, or also cursors referencing deleted bookmarks? → A: Only malformed/unparseable cursors are invalid; deleted-item cursors still work by resuming from the next position.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The bookmark list loads in under 1 second regardless of collection size (up to 10,000 bookmarks), compared to linear degradation without pagination.
- **SC-002**: Users can browse their entire collection by paginating forward through all pages without encountering duplicate or missing bookmarks.
- **SC-003**: Filtered results (search, tag, favorite) paginate correctly — the total count of items seen across all pages equals the total count reported in the response.
- **SC-004**: 100% of existing functionality (filters, search, favorites) continues to work correctly with pagination enabled.
- **SC-005**: A new user with fewer than 20 bookmarks sees no change in their experience — all bookmarks appear on a single page with no confusing pagination controls.
