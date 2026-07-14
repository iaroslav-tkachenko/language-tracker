# Implementation Plan

## 1. Approval gate

**Current status: approved by the project owner on July 14, 2026; implementation in progress.**

Phase 1 has started on branch `codex/mvp-foundation`. The first responsive visual prototype is available for review while database-backed functionality remains in progress.

## 2. Delivery principles

- Deliver vertical, testable increments.
- Put security and schema constraints in place before feature UI depends on them.
- Keep the MVP within the approved product specification.
- Prefer simple source-of-truth data over duplicated aggregates.
- Verify responsive behavior and accessibility throughout implementation, not only at the end.
- Keep every phase buildable and reviewable.

## 3. Phase 1 — Project foundation

### Work

- Scaffold the current stable Next.js App Router with TypeScript and `src/` layout.
- Enable strict TypeScript, Tailwind CSS, linting, and formatting.
- Choose and lock one package manager.
- Add environment-variable validation and `.env.example` without secrets.
- Initialize Supabase CLI directories and local configuration.
- Add baseline unit-test, pgTAP, and Playwright configuration.
- Add CI checks for formatting, linting, type checking, tests, and build.
- Establish accessible UI primitives and global visual tokens based on the supplied mockups.

### Exit criteria

- The empty app runs locally and produces a production build.
- CI executes the baseline checks.
- No secrets are committed.
- Desktop and mobile shell layouts render without overflow defects.

## 4. Phase 2 — Database foundation and RLS

### Work

- Create migrations for `profiles`, `language_boards`, `activity_types`, and `study_entries`.
- Add length, duration, referential, uniqueness, and archival constraints.
- Add composite ownership keys and initial indexes.
- Add the new-user initialization trigger and the seven persisted standard activity seeds; keep `Other` as a UI creation action.
- Enable RLS and define explicit policies.
- Generate TypeScript database types.
- Add pgTAP tests for schema, initialization, constraints, and cross-user isolation.

### Exit criteria

- A clean local database can be rebuilt entirely from version-controlled migrations and seed data.
- Every user-facing table has tested RLS.
- Cross-user board/activity references are rejected by the database.
- Concurrent creation cannot exceed six active boards or 30 active activities.

## 5. Phase 3 — Authentication

### Work

- Implement Supabase browser, server, and proxy clients.
- Implement sign-up, confirmation callback, sign-in, and sign-out.
- Implement forgot-password and update-password flows.
- Add authenticated route protection with verified claims.
- Add error states for invalid, expired, and reused links.
- Configure local email capture and document production SMTP requirements.
- Configure local, Preview, and Production redirect URLs.

### Critical Playwright coverage

- Protected pages redirect unauthenticated users.
- A confirmed user can sign in and sign out.
- Recovery callback reaches the update-password screen.
- One authenticated user cannot open another user's board URL.

### Exit criteria

- Authentication works locally through the supported flows.
- Server authorization does not trust an unverified session cookie.
- Auth pages are responsive and keyboard accessible.

## 6. Phase 4 — Board and activity management

### Work

- Implement board creation, selection, rename, reorder, and confirmed archival.
- Enforce the six-active-board limit with useful feedback.
- Implement the global activity catalog.
- Implement custom activity creation through both catalog management and the `Other` entry flow.
- Require a concrete custom name before an entry started through `Other` can be saved.
- Implement rename, hide/archive, and restore-by-name behavior.
- Enforce case-insensitive uniqueness and the 30-active-activity limit.
- Ensure historical references use the current activity name.

### Critical coverage

- Restoring an archived name reuses the same identity.
- Renaming changes historical display without changing entries.
- Archiving prevents new selection but preserves historical reads.
- Archiving a board requires explicit confirmation and hides its statistics.

### Exit criteria

- Board and activity lifecycle rules match the product specification.
- All operations remain isolated by user.
- Settings work at desktop and mobile widths.

## 7. Phase 5 — Study-entry workflow

### Work

- Implement selected-day navigation and entry list.
- Implement one-entry-at-a-time creation.
- Add quick durations: 10, 15, 20, 30, 45, 60, 90, and 120.
- Add validated custom minute input from 1 through 1,440.
- Add optional comments up to 150 characters.
- Support past, current, and future dates.
- Implement entry edit and delete flows.
- Prevent selection of archived boards and activities for new entries.
- Preserve form values and show actionable errors when a save fails.

### Critical coverage

- Multiple independent entries can exist on one date.
- Custom activity creation makes the activity available on every board.
- Edit/delete changes the derived day total.
- Past and future dates accept entries.
- Duplicate submission protection prevents accidental repeated saves.

### Exit criteria

- The primary logging journey is complete and responsive.
- Database constraints and UI validation agree.
- Entry mutations update the affected board without exposing other data.

## 8. Phase 6 — Yearly heatmap

### Work

- Implement selected-year navigation and calendar-grid generation.
- Add the yearly daily-total database function.
- Implement fixed level mapping:
  - 0;
  - 1–14;
  - 15–29;
  - 30–59;
  - 60–119;
  - 120–180;
  - 181+ minutes.
- Include future-dated entries in the heatmap.
- Add tooltips, accessible labels, keyboard navigation, today/selected states, and legend.
- Add horizontal mobile overflow while retaining usable cell targets.

### Critical coverage

- Leap years and year boundaries render correctly.
- 180 minutes uses level 5 and 181 uses level 6.
- Multiple entries aggregate to one daily cell.
- Editing or deleting an entry updates its cell.
- Desktop and mobile interaction remain usable.

### Exit criteria

- Heatmap data and visual levels match the specification.
- The heatmap is operable without a pointer and understandable without color alone.

## 9. Phase 7 — Statistics

### Work

- Add database functions for board summary and distributions.
- Implement selected-year total, current day/week/month totals, and per-activity totals.
- Implement active days and both average calculations.
- Implement current and longest streaks.
- Implement bar-chart granularity for day, week, month, and year.
- Include archived activities in historical breakdowns.
- Apply the approved future-entry inclusion and exclusion rules.

### Critical coverage

- Weeks start on Monday.
- Current streak survives an empty today when yesterday is active.
- Future dates do not extend streaks or current averages.
- Current-year average uses elapsed days including today.
- Completed-year average uses 365 or 366 days.
- Selected-year total includes future entries.
- Zero denominators return zero.

### Exit criteria

- Statistics match independently calculated fixtures.
- Chart controls are accessible and responsive.
- Queries remain fast for realistic multi-year seed data.

## 10. Phase 8 — Hardening and deployment

### Work

- Complete critical Playwright journeys in desktop Chromium and an emulated mobile project.
- Add targeted cross-browser coverage where layout or date behavior differs.
- Run accessibility checks on auth, board, entry, heatmap, statistics, and settings screens.
- Test realistic multi-year data and query plans.
- Verify RLS policies and grants from a clean database.
- Configure Vercel Development, Preview, and Production environments.
- Configure production Supabase redirects and SMTP.
- Document local setup, migration, testing, deployment, and recovery procedures in `README.md`.

### Exit criteria

- Formatting, linting, type checks, unit tests, database tests, Playwright tests, and production build pass.
- Preview deployment passes the critical smoke test.
- Production has no test credentials or service-role key exposed to the client.
- Product-owner acceptance testing is complete on desktop and mobile.

## 11. Planned critical end-to-end journeys

1. Register, confirm email, sign in, and sign out.
2. Request password recovery and set a new password.
3. Create two language boards and verify their entries/statistics remain separate.
4. Create a custom activity and use it on multiple boards.
5. Archive and restore an activity while preserving historical statistics.
6. Add, edit, and delete multiple entries on one date.
7. Add entries to past and future dates and verify heatmap/statistics rules.
8. Verify current and longest streak behavior across an empty today.
9. Archive a populated board through explicit confirmation.
10. Prove User A cannot read or mutate User B's data.

## 12. Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Auth callback failures across Vercel environments | Explicit site URL, scoped redirect allowlist, and Preview smoke tests |
| Default Supabase email limits | Local Mailpit and production SMTP before launch |
| RLS policy mistakes | Composite ownership constraints plus positive and negative pgTAP tests |
| Concurrent board/activity limit bypass | Atomic database functions and concurrency-oriented tests |
| Browser/server disagreement about today | Browser-local ISO date passed explicitly to validated current-period queries |
| Future entries corrupt streaks | Centralized cutoff rule and boundary tests |
| Archived activities disappear from history | Stable foreign-key identity and restoration rather than duplication |
| Mobile heatmap becomes unreadable | Fixed usable cell size and horizontal scroll |
| Statistics become inconsistent | Source entries only; aggregation rules centralized and tested |

## 13. Final MVP definition of done

The MVP is done only when:

- all in-scope behavior in `PRODUCT_SPEC.md` is implemented;
- RLS isolation and ownership constraints are proven by tests;
- critical Playwright journeys pass;
- statistics pass fixed boundary fixtures;
- the interface is usable on representative desktop and mobile viewports;
- authentication email and redirect settings are production-ready;
- documentation accurately describes setup and operation;
- no deferred feature has been silently added to scope.
