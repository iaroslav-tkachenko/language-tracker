# Repository Instructions

## Current project status

The project owner approved the original implementation plan on July 14, 2026,
the expanded phased scope on July 16, 2026, and the production-backed Phase 1
Study Time implementation on desktop and a physical mobile browser on July 25, 2026. Phases 0, 1, and 2 are complete and merged. The project owner approved
the clickable Phase 2 atomic batch entry flow on July 26, 2026, and all
pull-request checks passed. Continue to use explicit visual review gates before
advancing between product milestones.

Notify the project owner whenever a new visual or clickable milestone is ready for review.

## Sources of truth

Read these files before making changes:

1. `docs/PRODUCT_SPEC.md` for product behavior and business rules.
2. `docs/ARCHITECTURE.md` for technical boundaries and data design.
3. `docs/IMPLEMENTATION_PLAN.md` for sequencing, quality gates, and scope.

If the files conflict, stop and ask the project owner to resolve the conflict. Do not infer a materially different product rule.

## Language and naming

- Write code, filenames, variables, database objects, documentation, and UI copy in English.
- Use `streak` for a consecutive run of active study days.
- Use descriptive domain names such as `languageBoard`, `activityType`, `studyEntry`, and `studyDate`.
- Store study duration as exact integer minutes. Never store display labels such as `3+ hours` as data.

## Product boundaries

- Every user-owned row must be isolated with PostgreSQL Row Level Security.
- Activities are global to a user and reusable on every language board.
- `Other` is a UI action that creates or restores a named custom activity; do not save entries against an unnamed generic `Other` activity.
- Statistics and heatmaps are always scoped to one language board.
- Study entries may use past, current, or future calendar dates.
- Vocabulary uses one editable daily word total per language board and date.
- CEFR levels are user-declared, board-specific historical events; the system never promotes a user automatically.
- CEFR forecasts are approximate guidance and must display their methodology and limitations.
- A used activity or language board must be archived rather than physically deleted.
- Historical entries and statistics must survive activity archival and restoration.
- Do not add features listed as out of scope in the product specification.

## Implementation rules after approval

- Use the Next.js App Router and strict TypeScript.
- Prefer Server Components for initial reads and Client Components only where interaction or browser APIs require them.
- Treat every Server Action and Route Handler as a public entry point: authenticate, authorize, and validate its input.
- Use the current Supabase SSR package and verified server-side claims. Do not trust an unverified cookie session for authorization.
- Never expose a Supabase service-role key to browser code.
- Keep database changes in version-controlled SQL migrations.
- Enable RLS on every user-facing table and test both allowed and denied access.
- Use composite ownership constraints so an entry cannot reference another user's board or activity.
- Generate TypeScript database types from the schema rather than duplicating them manually.
- Use `date` for `study_date` and `timestamptz` for audit timestamps.
- Do not create cached or persisted aggregate tables for MVP statistics unless measurements prove they are necessary.
- Batch entry creation must be atomic, idempotent for one submission intent, and must never overwrite existing study entries.
- Preserve unrelated user changes in a dirty worktree.

## Validation defaults

- Language board name: 1–50 trimmed characters.
- Activity name: 1–50 trimmed characters.
- Duration: integer from 1 through 1,440 minutes.
- At most six active language boards per user.
- At most 30 active activities per user.
- Active board and activity names are unique per user, case-insensitively.

## Required verification after approval

Run checks proportional to the change. The completed MVP must include:

- formatting and linting;
- TypeScript type checking;
- unit tests for calendar, both heatmaps, batch ranges, averages, streaks, and CEFR forecast rules;
- pgTAP tests for schema constraints, batch atomicity/idempotency, database functions, and RLS isolation across every user-facing table;
- Playwright tests for critical authentication, Study Time, batch, Vocabulary, CEFR, and statistics journeys;
- a production Next.js build;
- responsive and accessibility checks on desktop and mobile viewports.

Do not claim completion when required checks have not run. Report any unavailable check and the reason.
