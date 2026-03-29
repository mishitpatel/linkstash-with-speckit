# 002-Pagination — Workflow Steps

Run each slash command one at a time, in order.

## Step 1 — Write the spec
```
/specify add cursor-based pagination to the GET /api/bookmarks endpoint, returning next/previous cursors and supporting configurable page size
```
Fills out `specs/002-pagination/spec.md` with user stories, requirements, and acceptance criteria.

## Step 2 — Clarify the spec
```
/clarify
```
Answers up to 5 questions to tighten any ambiguities (e.g., default page size, max limit, cursor encoding).

## Step 3 — Create the implementation plan
```
/plan
```
Generates `specs/002-pagination/plan.md` with architecture decisions, data model changes, and API contract.

## Step 4 — Generate tasks
```
/tasks
```
Produces `specs/002-pagination/tasks.md` — an ordered, dependency-aware task list.

## Step 5 — (Optional) Cross-artifact analysis
```
/analyze
```
Validates consistency across spec, plan, and tasks. Fix anything it flags before implementing.

## Step 6 — Implement
```
/implement
```
Walks through each task in `tasks.md` and writes the code + tests.

## Step 7 — Commit and PR
```
/commit
```
Then ask Claude to create the PR against `main`.
