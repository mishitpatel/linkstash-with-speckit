<!--
Sync Impact Report
- Version change: 1.0.0 → 2.0.0 (MAJOR: complete project redefinition)
- Previous project: Visitor Management System
- New project: LinkStash — A Personal Bookmark Manager
- Removed principles: Intuitive UX First, Responsive Tablet Design, Visitor Data Privacy
- Renamed/replaced principles:
  - "Clean Readable Code" → "Clean Readable Code" (retained, updated rationale)
  - "Critical Path Testing" → "Critical Path Testing" (retained, updated scope to bookmark CRUD)
  - "Simplicity (YAGNI)" → "Simplicity First (YAGNI)" (retained, minor rewording)
- Added principles: Minimal UI Maximum Usability, Data Integrity, Convention Over Configuration
- Changed sections:
  - "Technology & Operational Constraints" updated for new stack (vanilla frontend, no auth, no email, no photo capture)
  - "Development Workflow" retained with minor updates
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (Constitution Check section is generic)
  - .specify/templates/spec-template.md ✅ no changes needed (user story format accommodates all principles)
  - .specify/templates/tasks-template.md ✅ no changes needed (task format is flexible)
  - .specify/templates/checklist-template.md ✅ no changes needed (generic structure)
  - .specify/templates/agent-file-template.md ✅ no changes needed (generic structure)
- Follow-up TODOs: none
-->

# LinkStash Constitution

## Core Principles

### I. Simplicity First (YAGNI)

Every feature MUST be traceable to a user story in the specification. No abstractions MUST be introduced until the same pattern appears at least twice. Configuration MUST use environment variables or a single config file — no configuration frameworks. Dependencies MUST be minimal and well-known; reject libraries that pull in large transitive dependency trees. If a feature is not in the spec, it does not get built.

**Rationale**: LinkStash is a focused learning project. Over-engineering obscures the learning objectives and delays delivery. Every line of code must earn its place.

### II. Clean Readable Code

Code MUST prioritize readability over cleverness. Functions MUST do one thing and be named to describe that thing. No abbreviations in variable or function names unless universally understood (e.g., `id`, `url`). Files MUST be kept under 200 lines; if longer, extract a module. Shared logic MUST live in clearly named utility modules, not be duplicated.

**Rationale**: This is a POC and learning project. Readable code accelerates understanding and iteration.

### III. Critical Path Testing

Automated tests MUST cover all CRUD operations for bookmarks (create, read, update, delete). API endpoints that create or modify bookmark data MUST have integration tests validating correct responses and database state. Tag assignment and removal MUST be tested. Search and filter endpoints MUST be tested with representative data. Tests are NOT required for static HTML markup, CSS, or simple utility functions unless they contain complex logic.

**Rationale**: Bookmark CRUD is the core value of LinkStash. Breaking it silently would make the app useless. Tag and search functionality are close seconds in importance.

### IV. Minimal UI, Maximum Usability

The interface MUST be clean and functional with no unnecessary decoration. Search and filtering MUST be immediately visible on the main view — not hidden behind menus. Adding a bookmark MUST take no more than 2 clicks from the main view. The UI MUST work on screens 768px and wider but desktop is the primary target. Touch targets MUST be at least 44x44px for interactive elements.

**Rationale**: A bookmark manager lives or dies by how fast you can save and find links. Every extra click is friction that discourages use.

### V. Data Integrity

Bookmarks MUST never be silently lost or corrupted. Delete operations MUST require user confirmation before execution. URLs MUST be validated before saving (must be syntactically valid). Tags MUST be normalized: lowercase, trimmed of whitespace, no duplicates on a single bookmark. The SQLite database MUST use WAL mode for safe concurrent reads. All database writes MUST use transactions where multiple tables are affected.

**Rationale**: Users trust a bookmark manager with links they want to keep. Silent data loss or corruption destroys that trust instantly.

### VI. Convention Over Configuration

The project MUST follow a standard layout: `src/routes/`, `src/services/`, `src/db/` for backend code; `public/` for frontend static files. API endpoints MUST follow RESTful naming (`GET /api/bookmarks`, `POST /api/bookmarks`, etc.). Error responses MUST use a consistent JSON format: `{ "error": "<message>" }` with appropriate HTTP status codes. Database migrations MUST be versioned SQL files executed in order.

**Rationale**: Consistent conventions reduce cognitive load and make the codebase navigable without documentation. New readers can predict where things live.

## Technology & Operational Constraints

- **Backend**: Node.js with Express. Route handlers MUST be thin — business logic belongs in service modules under `src/services/`.
- **Frontend**: Vanilla HTML, CSS, and JavaScript. No frameworks. Served as static files by Express from the `public/` directory.
- **Database**: SQLite via better-sqlite3. Migrations MUST be versioned SQL files in `src/db/migrations/`. Schema changes MUST be additive where possible.
- **No authentication**: This is a single-user personal app. There is no login system. This is intentional for POC scope.
- **No external services**: No third-party APIs, analytics, or tracking. The app runs entirely locally.

## Development Workflow

- **Commit granularity**: One commit per logical change (one task or tightly related group of tasks).
- **Branch strategy**: Single `main` branch is acceptable for a solo POC. Feature branches are optional.
- **Code review**: Not required for solo development but all code MUST pass linting before commit.
- **Testing gate**: Bookmark CRUD API tests MUST pass before any deployment.
- **Dependency management**: `package.json` at project root. Lock files MUST be committed.

## Governance

This constitution is the highest-authority document for project decisions. When a proposed change conflicts with a principle, the principle wins unless the constitution is amended first. Amendments require updating this file with a version bump and documenting the rationale in the Sync Impact Report comment block above.

**Version**: 2.0.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-18
