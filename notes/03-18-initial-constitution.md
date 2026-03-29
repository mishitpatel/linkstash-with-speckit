<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0 (initial ratification)
- Added principles: Intuitive UX, Clean Code, Critical Path Testing, Responsive Design, Data Privacy, Simplicity
- Added sections: Technology & Operational Constraints, Development Workflow
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (Constitution Check section is generic)
  - .specify/templates/spec-template.md ✅ no changes needed (user story format accommodates all principles)
  - .specify/templates/tasks-template.md ✅ no changes needed (task format is flexible)
- Follow-up TODOs: none
-->

# Visitor Management System Constitution

## Core Principles

### I. Intuitive UX First

The system MUST be usable by front desk staff with zero training beyond a brief walkthrough. Every screen MUST have a single clear primary action. Navigation MUST require no more than two clicks to reach any feature. Form inputs MUST use sensible defaults and auto-complete where possible. Error messages MUST tell the user exactly what to do next, not what went wrong internally.

**Rationale**: Front desk receptionists handle visitors while managing phones, deliveries, and other interruptions. The UI cannot demand focused attention or technical literacy.

### II. Clean Readable Code

Code MUST prioritize readability over cleverness. Functions MUST do one thing and be named to describe that thing. No abbreviations in variable or function names unless universally understood (e.g., `id`, `url`). Files MUST be kept under 200 lines; if longer, extract a module. Shared logic MUST live in clearly named utility modules, not be duplicated.

**Rationale**: This is a POC and learning project. Readable code accelerates understanding and iteration.

### III. Critical Path Testing

Automated tests MUST cover the check-in and check-out flows end-to-end. API endpoints that create or modify visitor records MUST have integration tests validating correct responses and database state. Tests are NOT required for static UI components, configuration files, or utility functions unless they contain complex logic.

**Rationale**: The check-in/out flow is the core value of the system. Breaking it silently would make the app useless. Other areas are lower risk for a POC.

### IV. Responsive Tablet Design

All UI views MUST render correctly on screens 768px and wider (iPad portrait). Touch targets MUST be at least 44x44px. The dashboard and check-in form MUST be usable without horizontal scrolling on tablet. Desktop (1024px+) MUST also be supported but tablet is the primary target.

**Rationale**: The primary deployment scenario is a tablet at a reception desk.

### V. Visitor Data Privacy

Visitor personal information (name, photo, contact details) MUST NOT be logged to the console or application logs. Photos MUST be stored locally only, never transmitted to third-party services. The system MUST NOT require visitors to create accounts or provide more information than necessary for check-in. Visitor data MUST be deletable.

**Rationale**: Visitors are not users of the system — they have an expectation of minimal data collection and responsible handling.

### VI. Simplicity (YAGNI)

Every feature MUST be traceable to a user story in the specification. No abstractions MUST be introduced until the same pattern appears at least twice. Configuration MUST use environment variables or a single config file — no configuration frameworks. Dependencies MUST be minimal and well-known; reject libraries that pull in large transitive dependency trees.

**Rationale**: This is a focused POC. Over-engineering obscures the learning objectives and delays delivery.

## Technology & Operational Constraints

- **Frontend**: React with Vite. No CSS frameworks heavier than a utility library. Component files MUST separate logic from presentation where complexity warrants it.
- **Backend**: Node.js with Express. Route handlers MUST be thin — business logic belongs in service modules.
- **Database**: SQLite via better-sqlite3. Migrations MUST be versioned SQL files, not ORM magic. Schema changes MUST be additive where possible.
- **Email**: Nodemailer with Ethereal (fake SMTP) for development. Email sending MUST be asynchronous and MUST NOT block the check-in response.
- **Photo capture**: Browser MediaDevices API. Fallback MUST exist for devices without cameras (manual upload or skip).
- **No authentication**: The system uses a pre-defined employee list. There is no login system. This is intentional for POC scope.

## Development Workflow

- **Commit granularity**: One commit per logical change (one task or tightly related group of tasks).
- **Branch strategy**: Single `main` branch is acceptable for a solo POC. Feature branches are optional.
- **Code review**: Not required for solo development but all code MUST pass linting before commit.
- **Testing gate**: Check-in and check-out API tests MUST pass before any PR or deployment.
- **Dependency management**: `package.json` for both frontend and backend. Lock files MUST be committed.

## Governance

This constitution is the highest-authority document for project decisions. When a proposed change conflicts with a principle, the principle wins unless the constitution is amended first. Amendments require updating this file with a version bump and documenting the rationale in the Sync Impact Report comment block above.

**Version**: 1.0.0 | **Ratified**: 2026-03-16 | **Last Amended**: 2026-03-16
