# Research: E1 Cross-Layer Task Coverage Gap Analysis

**Date**: 2026-03-25
**Issue**: E1 (HIGH) — User Story 2 missing frontend page size selector task
**Feature**: 002-pagination

## The Bug

During `/speckit.tasks` generation for the 002-pagination feature, User Story 2 ("Configurable Page Size") received only backend tasks (page_size validation in the route handler) but no frontend task for a page size selector UI. The spec said "As a user, I want to control how many bookmarks I see per page" which clearly implies a user-facing control, yet the task generator produced only API-level work.

The bug was caught during `/speckit.analyze` and manually remediated by adding T013 (frontend page size selector).

---

## Root Cause Chain — Where the Gap Originated and Propagated

### Stage 1: spec.md — Acceptance scenarios used API language

**File**: `specs/002-pagination/spec.md` (User Story 2, lines 37–42)

User Story 2's acceptance scenarios were written from an **API perspective**, not a user-action perspective:

```
1. "Given I have 30 bookmarks, When I request a page size of 10..."
2. "Given I have 30 bookmarks, When I request a page size of 50..."
3. "Given I request a page size of 0 or a negative number..."
4. "Given I request a page size larger than the maximum allowed..."
```

**The critical issue**: These use "request" language (API calls), not user-action language. They describe what happens when a request is made but **never specify HOW the user provides the page size value**.

Compare to **User Story 1** in the same file (lines 18–25), which uses explicit user-action language:
- "When I load the main page" → implies UI behavior
- "When I navigate to the next page" → implies button interaction
- "When I look for a 'previous' navigation option" → implies UI visibility

US1 naturally produced both backend AND frontend tasks because the scenarios clearly describe user interactions with a visual interface.

US2's scenarios could be satisfied by backend-only work (API validation), which is exactly what happened.

### Stage 2: plan.md — No story-to-layer traceability

**File**: `specs/002-pagination/plan.md` (lines 59–86, "Project Structure")

The plan lists all source files that will be modified:

```
src/services/bookmarkService.js     # Modified
src/routes/bookmarks.js              # Modified: parse cursor/page_size params
src/utils/cursor.js                  # New
public/js/api.js                     # Modified: pass cursor/page_size params
public/js/app.js                     # Modified: pagination state, next/prev handlers
public/js/ui.js                      # Modified: render pagination controls
```

**What's missing**: The plan is a flat file list — there's no mapping of which files serve which user story. The frontend file descriptions only mention pagination controls (Previous/Next buttons), not a page size selector. There's no matrix showing "US2 needs work in both src/routes/ AND public/js/".

Without story-to-layer traceability, the plan couldn't catch that US2 required frontend work.

### Stage 3: tasks.md — No layer coverage validation

**File**: `specs/002-pagination/tasks.md` (Phase 4, originally lines 66–67)

The generated tasks for US2 were:
```
- [ ] T012 [US2] Add page_size validation in src/routes/bookmarks.js...
- [ ] T013 [US2] Add page size integration tests in tests/integration/pagination.test.js...
```

Both tasks are backend-only. The task generation template has no instruction to verify that user-facing stories have tasks in all relevant layers. There's no "layer coverage sweep" step.

### Stage 4: analyze caught it

The `/speckit.analyze` command correctly identified this as issue E1 (HIGH): "US2 spec says 'As a user, I want to control how many bookmarks I see per page' but tasks only have backend validation (T012) — no frontend task for a page size selector UI."

---

## Comparison: Why Feature 001 Didn't Have This Gap

In `specs/001-linkstash-bookmarks/spec.md`, every acceptance scenario describes a **complete user workflow** from UI action through API to display result:

- "When I click 'Add Bookmark' and enter a valid URL with a title..." → clearly implies frontend form
- "When I click edit and change the title..." → clearly implies frontend edit UI
- "When I click the favorite star/icon..." → clearly implies frontend toggle

The 001 tasks accordingly included both backend and frontend work for each story because the scenarios made the multi-layer nature explicit.

---

## Template Analysis — Where Guards Are Missing

### `.specify/templates/spec-template.md`

**Current state**: The comment block (lines 10–21) provides guidance on prioritization and independent testability, but has **zero guidance on acceptance scenario language**. There's nothing preventing API-level scenarios for user-facing stories.

**Gap**: No rule saying "When clauses must describe user actions, not API internals."

### `.specify/templates/plan-template.md`

**Current state**: Has a "Project Structure" section with architecture options (web app, mobile, single project) but produces a **flat file list** with no story-to-layer mapping.

**Gap**: No story-to-layer traceability matrix. No mechanism to verify that each user story is mapped to all relevant layers.

### `.specify/templates/tasks-template.md`

**Current state**: Tasks are organized by user story with clear phase structure. The comment block (lines 28–44) instructs replacement of sample tasks based on spec/plan artifacts. But there's **no validation step** checking layer coverage.

**Gap**: No "layer coverage sweep" instruction. No per-story layer declaration. A story can silently get tasks in only one layer.

### `.specify/templates/checklist-template.md`

**Current state**: Generic template for any checklist type. No awareness of "stack coverage" as a concept.

**Gap**: "Stack coverage" is not a recognized checklist type, so there's no easy way to audit cross-layer completeness.

---

## Gap Summary Table

| Template | What Exists | What's Missing |
|----------|------------|----------------|
| spec-template.md | Prioritization, independent testability guidance | Acceptance scenario language check (user-action vs API language) |
| plan-template.md | Architecture options, file list | Story-to-layer traceability matrix |
| tasks-template.md | Story-based organization, dependencies | Layer coverage sweep validation, per-story layer declaration |
| checklist-template.md | Generic checklist structure | "Stack-coverage" as recognized checklist type |

---

## Proposed Fixes (4 templates, ~55 lines total, zero rewrites)

### Fix 1: spec-template.md — Acceptance Scenario Language Gate

**Location**: Inside existing HTML comment (lines 10–21), append before closing `-->`

```markdown
  ACCEPTANCE SCENARIO LANGUAGE CHECK (user-facing projects):
  - "When" clauses MUST describe USER actions (e.g., "When I click...", "When I select...",
    "When I type..."), NOT system internals ("When I request...", "When the API receives...")
  - "Then" clauses MUST describe what the USER observes (e.g., "Then I see...",
    "Then the list shows...", "Then an error message appears...")
  - If a scenario is genuinely API-only (e.g., for a library or headless service),
    tag it as [API-level] so downstream phases know no UI work is needed.
```

**Why this helps**: Root cause fix. Forces scenarios to use user-action language, making the multi-layer nature of each story explicit. An LLM generating tasks from "When I select 10 from the page size dropdown" cannot reasonably omit the frontend work.

**Limitations**: Guidance, not enforcement. An LLM could still ignore it. Also doesn't help projects that genuinely mix API-only and UI stories without clear demarcation.

### Fix 2: plan-template.md — Layer Coverage Map

**Location**: New section after line 96 (`**Structure Decision**: ...`), before `## Complexity Tracking`

```markdown
## Layer Coverage Map

<!--
  ACTION REQUIRED (multi-layer projects only): If the project spans more than one
  technology layer (e.g., backend + frontend, API + mobile app, CLI + library),
  fill in this matrix. Every user story with user-facing acceptance scenarios MUST
  have entries in ALL layers the user's action traverses.
  Skip this section for single-layer projects (pure library, pure API, pure CLI).
-->

| User Story | Backend | Frontend | Notes |
|------------|---------|----------|-------|
| US1 - [Title] | src/... | public/... | |
| US2 - [Title] | src/... | public/... | |

**Coverage check**: If a story has no entry for a user-facing layer, document why.
```

**Why this helps**: Creates a reviewable artifact. The task generator can cross-reference this matrix when deciding what tasks to create. A human reviewer can also instantly spot missing layer entries.

**Limitations**: Requires the plan-generating LLM to fill it correctly. If the matrix itself is wrong, downstream tasks will still be wrong. However, the matrix is much easier to review than the full plan.

### Fix 3: tasks-template.md — Layer Coverage Sweep + Per-Story Layers

**Location (3a)**: Inside existing HTML comment (lines 28–44), append before closing `============================================================================`

```markdown
  LAYER COVERAGE SWEEP (multi-layer projects only):
  After generating all tasks, validate each user story phase:
  1. Identify the project's layers from plan.md (e.g., backend: src/, frontend: public/).
  2. For each user story with user-facing acceptance scenarios:
     - Verify at least one task touches files in EACH layer the user's action traverses.
     - If a story has backend tasks but no frontend tasks (or vice versa), either:
       (a) Add the missing layer tasks, or
       (b) Add a note explaining why the layer is not affected.
  3. Cross-reference with the Layer Coverage Map in plan.md if present.
  Common gap: A story says "user can configure X" but tasks only add backend
  validation without a corresponding UI control for the user to interact with.
```

**Location (3b)**: In each user story phase header (lines 76, 102, 124), after the `**Independent Test**` line, add:

```markdown
**Layers**: [e.g., "Backend (src/), Frontend (public/)" or "Backend only — no UI change"]
```

**Why this helps**: Final safety net. Even if the spec used API language and the plan missed a layer mapping, the task template now instructs the LLM to sweep for coverage gaps. The per-story `**Layers**` declaration creates a declare-then-verify pattern: if Layers says "Backend, Frontend" but tasks only cover backend, the inconsistency is visible.

**Limitations**: Instruction-based, so depends on LLM compliance. The "multi-layer projects only" qualifier keeps it lightweight for simple projects.

### Fix 4: checklist-template.md — Stack Coverage Checklist Type

**Location**: New comment block after line 21, before `## [Category 1]`

```markdown
<!--
  RECOGNIZED CHECKLIST TYPES (for /speckit.checklist reference):
  - requirements: Spec requirements are complete and unambiguous
  - api: API contract completeness and consistency
  - stack-coverage: Every user story has tasks in all relevant technology layers
  - security: Security considerations are addressed
  - performance: Performance requirements are testable
-->
```

**Why this helps**: Makes cross-layer validation a first-class concept. Users can run `/speckit.checklist stack-coverage` to generate a purpose-built checklist that validates each story has tasks in all layers.

**Limitations**: Reactive (run after tasks are generated), not proactive. Requires user to know to ask for it.

---

## Defense-in-Depth: How the Fixes Work Together

```
Stage 1: /speckit.specify
  spec-template.md language gate catches "When I request..." → rewrites to "When I select..."
  ↓ (if missed)
Stage 2: /speckit.plan
  plan-template.md Layer Coverage Map forces explicit layer declaration per story
  ↓ (if missed)
Stage 3: /speckit.tasks
  tasks-template.md Layer Coverage Sweep catches backend-only tasks for multi-layer stories
  tasks-template.md per-story **Layers** creates visible inconsistency
  ↓ (if missed)
Stage 4: /speckit.checklist stack-coverage
  Manual audit catches any remaining gaps
  ↓ (if missed)
Stage 5: /speckit.analyze
  Already catches this class of bug (E1 was found here)
```

The bug must slip through ALL FIVE stages to reach implementation undetected. Currently it only needs to slip through one (the spec stage).

---

## What These Fixes Don't Address

1. **Fundamental LLM compliance**: All fixes are guidance-based. A sufficiently careless generation could ignore them. However, LLMs are generally good at following structured instructions in templates.

2. **Retroactive fixes**: These changes don't automatically fix specs/plans/tasks already generated from the old templates. Existing features would need manual review.

3. **Automated enforcement**: There's no programmatic validation (like a CI check) that could reject a tasks.md missing layer coverage. That would require extending Spec Kit's scripting infrastructure.

4. **Novel project types**: The layer concept assumes known patterns (web app = backend + frontend). Unusual architectures might not fit the matrix cleanly.

---

## Implementation Priority

1. **spec-template.md** first — this is the root cause. Fix the language that produces ambiguous specs and all downstream steps benefit.
2. **tasks-template.md** second — this is the most impactful safety net, catching gaps regardless of spec quality.
3. **plan-template.md** third — the Layer Coverage Map creates traceability but depends on LLM compliance.
4. **checklist-template.md** last — optional validation layer for explicit audits.

---

## Files to Modify (When Ready)

| File | Change | Lines Added |
|------|--------|-------------|
| `.specify/templates/spec-template.md` | Acceptance language gate inside existing comment (lines 10–21) | ~7 |
| `.specify/templates/plan-template.md` | New Layer Coverage Map section after line 96 | ~15 |
| `.specify/templates/tasks-template.md` | Layer sweep inside existing comment (lines 28–44) + Layers line in 3 story phases | ~16 |
| `.specify/templates/checklist-template.md` | Recognized types comment after line 21 | ~7 |

**Total**: ~55 lines across 4 files, zero structural changes, zero rewrites.
