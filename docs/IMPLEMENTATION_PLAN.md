# Implementation Plan

## 1. Approval gate

**Current status: Phases 0, 1, 2, and 3 are complete, visually approved, verified
by green pull-request checks, and merged. Phase 4 is implemented through the
integrated CEFR screen, Study Time and Vocabulary forecasts, Statistics
analytics, weekly recommendations, and final local verification.**

The project owner approved the original MVP plan on July 14, 2026, the
four-phase product direction on July 16, 2026, and Phase 1 visual work on July
17, 2026. Phase 0 authentication, schema, security, hosted email confirmation,
and password recovery passed automated and manual verification and were merged
on July 25, 2026. The responsive Study Time prototype remains preserved at
`/demo` while Phase 1 replaces fixtures with production-backed data.

The production-backed Phase 1 implementation includes language-board and
activity lifecycle management, single-day entry create/edit/delete, the
responsive yearly heatmap, complete Study Time statistics, mobile LAN review,
and protected desktop/mobile Playwright coverage backed by an isolated local
Supabase stack in CI. Its pull request passed all application, database, and
browser jobs and was merged on July 25, 2026.

## 2. Delivery principles

- Deliver vertical, clickable increments that the project owner can inspect.
- Notify the project owner whenever a new visual or clickable milestone is ready.
- Keep every phase buildable, testable, and independently reviewable.
- Establish database ownership, constraints, and RLS before production UI depends on new data.
- Derive statistics from source records; do not add persisted aggregates without measurement.
- Treat approximate CEFR guidance as transparent motivation, never assessment or guarantee.
- Do not implement deferred reference models with guessed values.
- Verify responsive behavior and accessibility throughout delivery.

## 3. Phase 0 — Foundation and security baseline

Phase 0 consolidates the original technical foundation. Completed items are verified rather than recreated; missing items remain prerequisites for production-backed features.

### Work

- Maintain the locked Next.js App Router, strict TypeScript, Tailwind CSS, formatting, linting, and build configuration.
- Maintain Supabase browser/server clients, environment validation, local configuration, and version-controlled migrations.
- Provide baseline Vitest, pgTAP, Playwright, and CI configuration.
- Complete email/password sign-up, confirmation, sign-in, sign-out, and recovery with verified claims.
- Create and protect `profiles`, `language_boards`, `activity_types`, and `study_entries`.
- Enforce RLS, composite ownership, active-count limits, normalized names, archival, and activity restoration.
- Generate database types from the schema.

### Exit criteria

- A clean database rebuild reproduces the schema and policies.
- Every user-facing table has positive and negative RLS coverage.
- Authentication and protected routes work locally.
- The app formats, lints, type-checks, tests, and builds from the committed lockfile.
- Unrelated local changes remain preserved.

## 4. Phase 1 — Study Time core and revised daily UX

**Status:** complete, approved by the project owner on desktop and a physical
mobile browser, verified by green pull-request application, database, and
browser jobs, and merged on July 25, 2026.

### Milestone 1A — Above-the-fold board experience

- Show `Create your first language board` when an authenticated user has no
  active board. Never create or assume `German` automatically.
- Move year navigation close to the top and remove avoidable vertical whitespace.
- Show `Study Time` and a disabled `Vocabulary` tab labelled `Coming soon`; do not enable Vocabulary behavior before Phase 3.
- Use a `Clock` icon for `Study Time` and `BookOpen` for `Vocabulary`. Treat `Study Time` as the route back to the primary board view and remove the redundant Home icon from the header.
- At 1366×768 and 100% zoom, show navigation, year, heatmap, primary summary, selected-day heading, and either the first entry or `Add study session` without page scrolling.
- Prioritize selected-year total, selected-year active days, and flame-treated current streak. Remove `Top activity` from the main screen. For screenshot review and the isolated test user only, use `Current level: B1` and `Estimated B2: in about 6 months at this pace`; never expose this fixture as production-user data.
- Render the current-level value in a circular badge and give the selected-day numeric total the stronger visual treatment approved from the high-contrast concept.
- Keep the mobile CEFR card to two lines: a `current level → next level` progress row and one concise approximate-forecast row. Retain the more descriptive labels on desktop where space permits.
- Give the statistics destination an explicit text label or icon-and-label treatment.

Before changing the application layout, prepare two static screenshot alternatives using the same content and different heatmap color treatments. The project owner selects one direction; only then implement the approved screen. After implementation, provide desktop and mobile screenshots plus a clickable local preview before continuing to Milestone 1B.

### Milestone 1B — Selected-day session workflow

- Keep the form collapsed behind `Add study session` for an empty selected date.
- Reveal quick/custom duration, active activities, `Other`, disabled `Save`, and `Cancel` on demand.
- Enable `Save` only when duration and activity are valid.
- Render entry cards with duration and activity only; do not repeat the current board name.
- Give standard activities distinct Lucide icons: Reading (`BookOpen`), Podcast (`Headphones`), Speaking (`MessagesSquare`), Writing (`PenLine`), Anki (`Layers3`), Grammar (`SpellCheck2`), TV Show / Film (`Clapperboard`), YouTube (`Youtube`), Shadowing (`Repeat2`), and Lesson (`Presentation`). Use `Shapes` as the one shared, visually distinct icon for every user-created activity.
- Place prominent previous-day and next-day arrows beside the selected date; each activation changes the selected date by exactly one calendar day, including across month and year boundaries.
- Use `Today` plus a date only for today; otherwise use the full weekday/date as the heading and never display `Selected day`. Use `No study session for this day yet.` for an empty date.
- Preselect and highlight the saved duration and activity during edit; moving either selection moves its highlight, `Update` persists, and `Cancel` leaves the entry unchanged.
- Provide hover/focus edit and delete controls on desktop and keep both icons persistently visible on mobile/touch layouts.
- Show `Add study session` below existing cards so the user can add another entry to a populated date.
- Implement edit with `Update`/`Cancel` and deletion with explicit confirmation.
- Preserve any number of independent entries per date and all past/current/future rules.

**Review notification:** provide a clickable create/edit/delete flow before proceeding.

### Milestone 1C — Revised heatmap and Study Time statistics

- Retain fixed minute thresholds: 0, 1–14, 15–29, 30–59, 60–119, 120–180, and 181+.
- Render zero-minute past dates red only from the board's earliest entry onward; earlier dates/years and zero-minute today/future dates remain white.
- Use three fixed yellow-family positive levels below 60 minutes and three progressively darker green levels from 60 minutes.
- Use the approved soft treatment: muted missed-day red, warm yellows, and muted sage-to-forest greens.
- Start missed-day coloring at the board's earliest study entry: all earlier dates/years remain white, gaps after that date are red, and yellow/green always means positive minutes.
- On mobile, render `Jan–Jun` and `Jul–Dec` as two compact grids and arrange the four primary summary cards in a compact two-column layout.
- Preserve accessible labels, visible focus, equivalent non-color detail, and mobile horizontal containment.
- Complete selected-year/current-period totals, averages, active days, current/longest streaks, activity totals, and day/week/month/year distributions.
- Add actual activity allocation for the latest seven calendar dates ending today.

### Critical verification

- Unit: calendar boundaries, all heatmap bands and date states, averages, future exclusions, and streaks.
- Database: aggregation and ownership fixtures.
- Playwright: clock/open-book tracker icons, disabled `Vocabulary — Coming soon`, `Study Time` navigation back to the primary board, absence of the redundant Home icon, `Top activity`, and repeated board names on the main screen, collapsed/expanded form, disabled-save prerequisites, add-another action, previous/next day navigation across calendar boundaries, standard/custom activity icons, create/edit/cancel/update/delete, two persistent mobile action icons, desktop 1366×768 visibility, keyboard flow, and non-color information.

### Phase exit criteria

- The complete single-day Study Time loop is production-backed, responsive, and accessible.
- Statistics match independently calculated fixtures.
- The project owner approves the Phase 1 visual and interaction milestone.

## 5. Phase 2 — Batch study-entry creation

**Status:** complete, approved by the project owner through the clickable
desktop flow, verified by green application, database, and desktop/mobile
browser jobs, and merged on July 26, 2026.

### Work

- Add `study_entry_batches` and nullable study-entry batch provenance through migrations.
- Add composite ownership, same-year/ordered/366-date constraints, RLS, and generated database types.
- Implement one authenticated transaction that expands the inclusive date range.
- Use a client-generated operation ID so one submission intent is idempotent.
- Add a date-range mode with activity, duration, start/end dates, and clear cancellation.
- Display a confirmation summarizing activity, duration, dates, count, and preservation of existing entries.
- Create one independent entry per date; never overwrite, merge, or skip matching existing entries.
- Keep generated entries independently editable and deletable.

### Critical verification

- Single-day, 365-day, and leap-year 366-day ranges.
- Reversed, cross-year, 367-day, unauthorized, and archived-resource rejection.
- Existing matching entries remain and receive an additional entry.
- Injected failure produces zero entries; retrying the same operation ID does not duplicate the batch.

### Phase exit criteria

- Batch creation is atomic, idempotent, RLS-isolated, and understandable before confirmation.
- The project owner approves the clickable range flow.

## 6. Phase 3 — Vocabulary tracker

**Status:** complete, approved by the project owner on desktop and mobile,
verified by green application, database, and browser pull-request jobs, and
merged on July 26, 2026.

### Work

- Add `vocabulary_daily_totals` with one owned non-negative integer per board/date, unique under concurrency.
- Add RLS, composite board ownership, indexes, generated types, and pgTAP coverage.
- Enable the `Study Time`/`Vocabulary` tracker switch while preserving board and year.
- Implement create, edit, and confirmed delete for the single daily final word total.
- Implement atomic, idempotent date-range creation that fills only empty dates
  and preserves existing daily totals.
- Implement the green Vocabulary heatmap with fixed levels: 0, 1–2, 3–5, 6–9, 10–14, 15–19, 20–39, and 40+.
- Implement selected-year and all-time word totals, non-future active days,
  averages, current-week/current-month totals, current streak, and longest
  streak.
- Integrate green Vocabulary metrics and independent day/week/month/year word
  distribution into the shared board-scoped Statistics screen.
- Apply the approved future-date inclusion/exclusion rules.
- Provide accessible date/count labels and responsive heatmap behavior.

### Critical verification

- Concurrent writes cannot create two values for one board/date.
- Date-range retries cannot duplicate totals, and existing dates remain
  unchanged.
- A second save updates the existing record; deletion returns the date to zero.
- Every threshold boundary, year navigation, future total, active-day rule, and vocabulary streak is covered.
- Shared Statistics navigation, metrics, and both period-distribution controls
  work on desktop and mobile.
- User A cannot read or mutate User B's vocabulary.

### Phase exit criteria

- Vocabulary is a complete, private, board-scoped daily tracker with production-backed behavior.
- The project owner approves the clickable Vocabulary milestone.

## 7. Phase 4 — CEFR history, dual forecast, and combined analytics

Phase 4 followed explicit visual gates. Static desktop/mobile concepts were
approved before production UI implementation, and each clickable vertical
milestone was reviewed before the next product milestone.

### Phase 4A — Product model and UX approval

**Status:** complete.

- Reconcile the product specification, architecture, and implementation plan
  before feature code changes.
- Lock the application-defined `A0 — Absolute zero` state and sourced A1–C2
  descriptions.
- Version the approved immutable Study Time transition model and Vocabulary
  midpoint model.
- Document recorded versus estimated totals, consistent user-facing `words`
  terminology, seven- and thirty-day pace, calendar-duration presentation,
  disclosures, and unavailable states.
- Prepare desktop/mobile concepts for the no-level state, board-scoped CEFR
  management, history CRUD, both forecasts, Statistics integration, A0, C2,
  zero pace, and reached-reference states.

**Review gate:** the project owner approves the visual direction before
production CEFR UI work.

### Phase 4B — Data ownership and safe history mutations

**Status:** complete.

- Add `cefr_level_events` with composite board ownership, A0–C2 constraint,
  non-future effective dates, one event per board/date, history index, RLS, and
  generated database types.
- Implement owned create/edit/delete functions. Reject an occupied date rather
  than overwriting its event.
- Reject chronologically adjacent duplicate levels while allowing a
  non-adjacent return such as `B1 → B2 → B1`.
- Preserve deterministic reverse-chronological history and derive current level
  from the greatest effective date.
- Cover concurrency, regression, deletion, every ownership path, and RLS before
  production UI depends on the table.

### Phase 4C — Clickable CEFR history

**Status:** complete.

- Add a board-scoped CEFR management destination reachable from Study Time,
  Vocabulary, Statistics, and Settings.
- Implement no-level CTA, A0–C2 selection, default-today date input, sourced
  level descriptions, and actionable invalid-date/conflict errors.
- Show history newest first with a `Current` marker.
- Implement edit and confirmed delete. Deleting the current event promotes the
  preceding event; deleting the last event restores the no-level state.
- In the no-level state, show an exclamation notification bubble on the `Level`
  navigation item and provide compact prompts from Study Time, Vocabulary, and
  Statistics that explain a current level unlocks more detailed progress
  analytics.

**Review gate:** provide a clickable desktop/mobile create/edit/delete flow.

### Phase 4D — Study Time forecast, seven-day milestone

**Status:** complete.

- Store the approved transition ranges and exact calculation differences as
  versioned immutable application data.
- Derive the current-level baseline by summing transition differences from A0.
- Calculate eligible non-future minutes from the current declaration's
  effective date, remaining transition minutes with a zero floor, and estimated
  total learning time.
- Calculate pace over exactly seven calendar dates ending today, including
  zero-study dates.
- Present remaining hours, progress, approximate years/months/days, estimated
  month/year, methodology, and disclosure.
- Handle no declaration, zero pace, reached reference, A0, and C2 without
  automatic promotion.

**Review gate:** provide a clickable Study Time forecast on desktop and mobile.

### Phase 4E — Vocabulary forecast, seven-day milestone

**Status:** complete.

- Store the approved A0–C2 vocabulary ranges and calculation midpoints as a
  separate versioned immutable model.
- Calculate eligible non-future recorded words from the current declaration's
  effective date, remaining midpoint difference in words with a zero floor, and
  estimated vocabulary size.
- Calculate pace over exactly seven calendar dates ending today, including
  zero-word dates.
- Use `words` consistently across tracker, heatmap, statistics, CEFR reference
  intervals, estimated totals, and forecast copy.
- Present progress, remaining words, approximate years/months/days, estimated
  month/year, methodology, and disclosure.
- Keep the current-level baseline, recorded increment, estimated total,
  next-level cumulative reference, completed percentage, and absolute remainder
  in one progress visualization; do not show the raw interval size in the
  primary UI.
- Handle no declaration, zero pace, reached reference, A0, and C2 independently
  of the Study Time forecast.

**Review gate:** provide a clickable Vocabulary forecast on desktop and mobile.

### Phase 4F — Thirty-day pace comparison

**Status:** complete.

- Add an independent Study Time pace over today and the previous 29 calendar
  dates, including zeros.
- Add an independent Vocabulary pace over the same calendar window.
- Present seven- and thirty-day forecasts with explicit units and period labels.
- Keep one forecast available when the other has zero pace.

### Phase 4G — Board and Statistics integration

**Status:** complete.

- Replace the isolated Phase 1 CEFR fixture with the real current declaration
  and tracker-appropriate forecast.
- Add compact current-to-next summaries to Study Time and Vocabulary.
- Add detailed CEFR information to the existing combined Statistics
  destination.
- Ensure a newly added CEFR history event visibly affects the product after the
  forecast milestones land: Study Time, Vocabulary, and Statistics should stop
  showing no-level prompts and should show the current level plus the relevant
  forecast or estimated-total analytics.
- Add the approved immutable ten-hour weekly recommendation model for A0 through
  C1, including the circular allocation chart, derived weekly hours, and
  product-authored advice in both the CEFR and Statistics destinations.
- Distinguish the four user-facing metrics: `Tracked study time`, `Estimated
learning time`, `Tracked words`, and `Estimated words known`.
- Show Study Time and Vocabulary progress, remaining units, seven/thirty-day
  estimates, history access, model versions, methodologies, and disclosures.
- Keep `Top activity` and latest-seven-day actual allocation in detailed
  statistics.

**Review gate:** provide the complete integrated desktop/mobile flow for product
owner approval.

### Phase 4H — Verification, accessibility, and documentation

**Status:** complete for local application verification and documentation.
Database and browser checks remain environment-dependent and must be rerun in
CI or a clean local Supabase/browser stack before merge.

- Unit-test all transition/midpoint differences, derived baselines, effective
  date subtraction, estimated totals, seven/thirty-day zero-inclusive pace,
  calendar-duration formatting, rounding, A0, zero remaining, zero pace, and C2.
- pgTAP-test constraints, concurrency, occupied-date rejection, adjacent-level
  validation, create/edit/delete, history ordering, and cross-user isolation.
- Playwright-test history CRUD, regression/non-adjacent return, both forecast
  models, all unavailable states, navigation, and combined Statistics on
  desktop and mobile.
- Run formatting, linting, strict type checking, unit tests, database tests,
  browser tests, and the production build.
- Complete responsive, keyboard, touch, screen-reader, and non-color manual
  checks.
- Document reference-model versions, formulas, rounding, sources, limitations,
  and deferred work.

### Fixed recommendation model within Phase 4

- The owner approved the per-level percentages, ten-hour reference week, and
  advice copy on July 27, 2026.
- Store the recommendation model as immutable versioned application reference
  data. Users do not edit it.
- Treat the mix as suggested guidance, not a personalized guarantee or a record
  of actual activity allocation.

### Phase exit criteria

- A0–C2 history is preserved with safe mutations and verified owner isolation.
- Study Time and Vocabulary forecasts are deterministic, transparent,
  reproducible for seven- and thirty-day pace, and non-authoritative.
- Recorded and estimated totals are clearly separated.
- Combined statistics are responsive and accessible.
- All required automated checks pass, manual desktop/mobile review is complete,
  documentation matches behavior, and the project owner approves the final
  Phase 4 visual and analytical milestone.

## 8. Hardening and deployment

### Work

- Complete critical Playwright journeys in desktop Chromium and emulated mobile, with targeted Firefox/WebKit coverage.
- Run WCAG 2.2 AA-oriented automated and manual checks, including red/yellow/green heatmaps and color-vision considerations.
- Test representative multi-year study, vocabulary, batch, and CEFR data and inspect query plans.
- Rebuild a clean database and re-run all RLS/grant tests.
- Verify Vercel Development, Preview, and Production environments, Supabase redirects, and production SMTP.
- Update setup, migration, testing, deployment, and recovery documentation.

### Exit criteria

- Formatting, linting, strict type checking, unit tests, pgTAP, Playwright, and production build pass.
- Preview deployment passes critical smoke tests.
- No secret or service-role key is exposed to browser code or Git.
- Product-owner acceptance passes on representative desktop and mobile viewports.

## 9. Planned critical end-to-end journeys

1. Register, confirm email, sign in, recover password, and sign out.
2. Manage two boards and prove their Study Time, Vocabulary, CEFR, and statistics remain separate.
3. Create, archive, restore, and reuse a custom activity across boards.
4. Add, edit, cancel, update, and confirm-delete study entries on past/current/future dates.
5. Create a batch across a valid range without overwriting matching entries.
6. Navigate both yearly heatmaps and verify semantic states without relying only on color.
7. Create, replace, and delete one vocabulary total and verify vocabulary streaks.
8. Declare CEFR twice, preserve history, and review forecast/no-forecast states.
9. Review current and longest Study Time streaks across an empty today.
10. Prove User A cannot read, reference, aggregate, or mutate User B's data in any feature.

## 10. Risks and mitigations

| Risk                                         | Mitigation                                                                                             |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Dense desktop layout harms readability       | Treat 1366×768 as a tested contract while allowing the expanded form and detailed statistics to scroll |
| Red/green heatmap excludes color-blind users | Accessible labels, equivalent detail, patterns/borders where needed, and measured contrast             |
| Batch requests partially write or duplicate  | One database transaction, operation ID, unique provenance/date constraint, and retry/failure tests     |
| Vocabulary daily values race                 | Database uniqueness plus owned upsert and concurrent tests                                             |
| CEFR forecast appears authoritative          | Persistent approximation/source warning, self-declared language, and explicit unavailable states       |
| Cross-language reference guidance varies     | Version and disclose the multi-source Study Time model and non-normative Vocabulary research model     |
| Recorded words cannot be deduplicated        | Label Vocabulary reference totals as approximate and disclose that individual words are not stored     |
| Deferred models acquire guessed values       | Traceable deferred requirements and an implementation gate requiring owner-approved values             |
| Future entries corrupt current metrics       | Centralized `local_today` cutoff and boundary fixtures for both trackers                               |
| RLS policies miss new tables/functions       | Explicit allow/deny pgTAP coverage and composite ownership constraints before UI delivery              |

## 11. Expanded MVP definition of done

The expanded MVP is done only when:

- Phases 0–4 in the approved specification are implemented, except explicitly deferred reference models;
- every user-owned table and callable mutation has verified owner isolation;
- batch, Study Time, Vocabulary, CEFR, and statistics rules pass boundary fixtures;
- critical Playwright journeys pass on representative desktop and mobile configurations;
- the interface is keyboard/touch usable and does not depend on color alone;
- CEFR guidance is sourced, versioned, and presented as approximate;
- authentication, SMTP, and redirect configuration are production-ready;
- documentation accurately describes setup, behavior, calculations, and deferred scope;
- no deferred values or out-of-scope feature has been silently introduced.
