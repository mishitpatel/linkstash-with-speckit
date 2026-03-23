# Feature Specification: LinkStash Bookmark Manager — Core Feature Set

**Feature Branch**: `001-linkstash-bookmarks`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Build a personal bookmark manager called LinkStash. Save links with tags, mark favorites, search/filter."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Save and View Bookmarks (Priority: P1)

As a user, I want to save a web link with a title, optional description, and optional tags so that I can build my personal bookmark collection. I want to see all my saved bookmarks on the main page, sorted by newest first, showing the title, URL, tags, favorite status, and when I saved it.

**Why this priority**: This is the fundamental value proposition — without the ability to save and view bookmarks, nothing else matters. This alone delivers a usable MVP.

**Independent Test**: Can be fully tested by saving 3-5 bookmarks with different combinations of title/description/tags and verifying they appear correctly on the main page sorted by newest first.

**Acceptance Scenarios**:

1. **Given** the main page is open, **When** I click "Add Bookmark" and enter a valid URL with a title, **Then** the bookmark is saved and appears at the top of the bookmark list.
2. **Given** I am adding a bookmark, **When** I enter a URL, **Then** the system validates the URL format before saving.
3. **Given** I am adding a bookmark, **When** I enter a URL and leave the title blank, **Then** the system attempts to auto-fetch the page title; if it fails, it prompts me to enter a title manually.
4. **Given** I have saved multiple bookmarks, **When** I view the main page, **Then** bookmarks are displayed newest-first showing title, truncated URL, tags, favorite star, and creation date.
5. **Given** I am adding a bookmark, **When** I submit without a URL, **Then** the system shows a validation error and does not save.

---

### User Story 2 - Edit and Delete Bookmarks (Priority: P1)

As a user, I want to edit any bookmark's details (title, description, URL, tags) after saving, and permanently delete bookmarks I no longer need, so that I can keep my collection accurate and tidy.

**Why this priority**: Edit and delete complete the basic CRUD operations. Without them, any typo or stale link becomes permanent, making the tool frustrating to use.

**Independent Test**: Can be tested by saving a bookmark, editing each field, verifying changes persist, then deleting it and confirming it no longer appears.

**Acceptance Scenarios**:

1. **Given** a saved bookmark, **When** I click edit and change the title, **Then** the updated title is saved and displayed.
2. **Given** a saved bookmark, **When** I click edit and change the URL, **Then** the system validates the new URL before saving.
3. **Given** a saved bookmark, **When** I click delete, **Then** the system asks for confirmation before permanently removing it.
4. **Given** a delete confirmation dialog, **When** I cancel, **Then** the bookmark is not deleted.
5. **Given** a delete confirmation dialog, **When** I confirm, **Then** the bookmark is permanently removed and no longer appears in any view.

---

### User Story 3 - Favorite Bookmarks (Priority: P2)

As a user, I want to mark bookmarks as favorites with a single click and filter my view to show only favorites, so that I can quickly access my most important links.

**Why this priority**: Favorites add a lightweight organization layer that makes the app significantly more useful for daily use, but the app is functional without it.

**Independent Test**: Can be tested by saving 5 bookmarks, favoriting 2 of them, verifying the star toggles visually, then filtering to favorites-only and confirming only the 2 appear.

**Acceptance Scenarios**:

1. **Given** a saved bookmark, **When** I click the favorite star/icon, **Then** the bookmark is marked as a favorite and the star appears filled/highlighted.
2. **Given** a favorited bookmark, **When** I click the favorite star/icon again, **Then** the favorite status is removed.
3. **Given** I have a mix of favorited and non-favorited bookmarks, **When** I activate the "Favorites only" filter, **Then** only favorited bookmarks are displayed.
4. **Given** the favorites filter is active, **When** I deactivate it, **Then** all bookmarks are displayed again.

---

### User Story 4 - Tag Management (Priority: P2)

As a user, I want to add and remove tags on my bookmarks, view all bookmarks for a specific tag, and see a list of all tags with bookmark counts, so that I can organize and browse my collection by topic.

**Why this priority**: Tags are the primary organizational mechanism. They transform a flat list into a browsable, categorized collection. Important but not blocking for MVP.

**Independent Test**: Can be tested by saving 5 bookmarks with various tags, verifying tags display correctly, clicking a tag to filter, and checking the tag list shows accurate counts.

**Acceptance Scenarios**:

1. **Given** I am adding or editing a bookmark, **When** I type tags, **Then** tags are normalized to lowercase and trimmed of whitespace before saving.
2. **Given** a bookmark with tags, **When** I view it in the list, **Then** its tags are displayed as clickable elements.
3. **Given** a tag displayed on a bookmark, **When** I click it, **Then** the view filters to show only bookmarks with that tag.
4. **Given** I have bookmarks with various tags, **When** I view the tag list/cloud, **Then** I see all used tags with the count of bookmarks for each.
5. **Given** I am editing a bookmark, **When** I remove a tag and save, **Then** the tag is removed from that bookmark; if no other bookmarks use that tag, it disappears from the tag list.

---

### User Story 5 - Search and Filter (Priority: P3)

As a user, I want to search across my bookmarks by keyword (matching title, URL, and description) and combine search with tag and favorite filters, so that I can quickly find any link in my collection.

**Why this priority**: Search becomes critical as the collection grows, but is less important for small collections. The app is useful without it in early stages.

**Independent Test**: Can be tested by saving 10+ bookmarks with diverse titles/descriptions, searching for specific keywords, and verifying correct results appear. Then combine search with a tag filter and verify both constraints apply.

**Acceptance Scenarios**:

1. **Given** I have multiple bookmarks, **When** I type a keyword in the search box, **Then** results update as I type (debounced) showing only bookmarks whose title, URL, or description contain the keyword.
2. **Given** search results are displayed, **When** I clear the search box, **Then** all bookmarks are shown again.
3. **Given** I have a search term entered, **When** I also select a tag filter, **Then** only bookmarks matching both the search term and the tag are displayed.
4. **Given** I have a search term entered, **When** I also activate the favorites filter, **Then** only favorited bookmarks matching the search term are displayed.
5. **Given** I search for a term that matches no bookmarks, **When** results are empty, **Then** a helpful "No bookmarks found" message is displayed.

---

### Out of Scope

- Bookmark import from browsers (HTML bookmark files) — future feature.
- Bookmark export (JSON or other formats) — future feature.
- Multi-user support / authentication — intentionally excluded for POC.
- Browser extension for saving bookmarks — future feature.

### Edge Cases

- What happens when the user saves a duplicate URL? The system allows it — the same URL can be bookmarked multiple times with different titles/tags.
- What happens when a very long URL or title is entered? The display truncates gracefully; the full value is stored and accessible via edit.
- What happens when the user enters an invalid URL (e.g., missing protocol, plain text)? The system rejects it with a clear error message indicating the URL format is invalid.
- What happens when the bookmark list is empty (first launch or all deleted)? The system displays a welcome message with a call-to-action: "No bookmarks yet. Click Add Bookmark to save your first link!"
- What happens when the database file is corrupted or missing on startup? The system creates a fresh database and runs migrations. No silent failures.
- What happens when the user adds a tag with special characters? Tags are stripped to alphanumeric characters, hyphens, and spaces, then normalized to lowercase.
- What happens when the auto-fetch title request times out or fails? The system falls back to requiring manual title entry without blocking the save flow. Timeout is 5 seconds.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create a bookmark by providing a URL (required), title (required, auto-fetched or manual), optional description, and optional tags.
- **FR-002**: System MUST validate that the URL is syntactically valid before saving a bookmark.
- **FR-003**: System MUST attempt to auto-fetch the page title when a URL is provided; if fetching fails, the user MUST be able to enter a title manually.
- **FR-004**: System MUST display all bookmarks on the main page sorted by creation date (newest first).
- **FR-005**: System MUST allow users to edit any field of an existing bookmark (title, URL, description, tags).
- **FR-006**: System MUST require user confirmation before permanently deleting a bookmark.
- **FR-007**: System MUST allow users to toggle favorite status on any bookmark with a single click.
- **FR-008**: System MUST allow filtering bookmarks to show only favorites.
- **FR-009**: System MUST normalize tags to lowercase, trimmed of leading/trailing whitespace, before saving.
- **FR-010**: System MUST not allow duplicate tags on a single bookmark.
- **FR-011**: System MUST display a tag list showing all tags with their bookmark counts.
- **FR-012**: System MUST allow filtering bookmarks by clicking a tag.
- **FR-013**: System MUST provide full-text search across bookmark title, URL, and description.
- **FR-014**: System MUST update search results as the user types (debounced, not on every keystroke).
- **FR-015**: System MUST allow combining search, tag filter, and favorite filter simultaneously.
- **FR-016**: System MUST persist all bookmark data to a local database that survives application restarts.
- **FR-017**: System MUST auto-capture and display the creation timestamp for each bookmark.

### Key Entities

- **Bookmark**: The core entity. Attributes: unique identifier, URL, title, description (optional), favorite status (boolean), creation timestamp. A bookmark can have zero or more tags.
- **Tag**: A label applied to bookmarks for categorization. Attributes: unique identifier, name (lowercase, trimmed). A tag can be associated with zero or more bookmarks. Tags with zero bookmarks are not displayed.

### Assumptions

- Single-user application — no authentication, no concurrent multi-user access.
- Title auto-fetch is best-effort; manual entry is always available as fallback.
- "Full-text search" means substring matching across title, URL, and description — not a weighted relevance engine.
- Debounce interval for search-as-you-type is 300ms (standard UX practice).
- Tags are entered as comma-separated values in a text input (e.g., "web dev, design, tools"). Multi-word tags are supported. Each tag is split on commas, trimmed, and normalized to lowercase.
- The application runs on localhost for personal use.
- No pagination for MVP — the main page loads all bookmarks at once. Acceptable for the expected scale (hundreds, not thousands). Pagination can be added later if needed.

## Clarifications

### Session 2026-03-18

- Q: Should tags be comma-separated, space-separated, or both? → A: Comma-separated only (allows multi-word tags like "web dev").
- Q: How should the main page handle large bookmark collections (200+)? → A: No pagination for MVP — load all bookmarks at once. Revisit if performance degrades.
- Q: How long should the auto-fetch title request wait before timing out? → A: 5 seconds.
- Q: Is bookmark import/export in scope for this feature? → A: Out of scope for MVP. Can be a future feature.
- Q: What should the user see on first launch with zero bookmarks? → A: Welcome message with call-to-action (e.g., "No bookmarks yet. Click Add Bookmark to save your first link!").

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can save a new bookmark (URL + title) in under 10 seconds from the main page.
- **SC-002**: A user can find a specific bookmark using search in under 5 seconds, given a collection of 100+ bookmarks.
- **SC-003**: All CRUD operations (create, read, update, delete) complete and reflect in the UI within 1 second.
- **SC-004**: Searching with a keyword returns results while the user is still typing (within 500ms of pausing).
- **SC-005**: No bookmarks are lost or corrupted during normal operations including rapid create/edit/delete sequences.
- **SC-006**: The interface is usable without documentation — a new user can add their first bookmark on the first attempt.
- **SC-007**: The application starts and is ready to use within 3 seconds.
