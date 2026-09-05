# Architecture

## 1. Status and decision gate

This document defines the architecture baseline. The original implementation
was authorized on July 14, 2026; the expanded July 16 scope is documented here,
and Phases 0 through 4 are implemented as the current MVP baseline.

## 2. Architecture summary

The MVP is a modular serverless monolith:

```text
Browser
  ├─ server-rendered pages
  └─ interactive heatmap and forms
          │
          ▼
Next.js App Router on Vercel
  ├─ Server Components for initial reads
  ├─ Client Components for interaction and browser-local dates
  ├─ Server Actions for mutations
  ├─ Data Access Layer for verified reads and DTOs
  └─ proxy.ts for Supabase auth-token refresh
          │
          ▼
Supabase
  ├─ Auth: email/password, confirmation, recovery
  └─ PostgreSQL
       ├─ relational constraints
       ├─ Row Level Security
       └─ security-invoker aggregation functions
```

This design is intentionally small. The expected load does not justify a separate API service, ORM, message queue, Redis cache, materialized statistics pipeline, or microservices.

## 3. Technology decisions

### 3.1 Next.js

- Use the current stable Next.js App Router release at scaffold time and lock it in the package manager lockfile.
- Use Server Components by default for authenticated page reads.
- Limit Client Components to interactive heatmap controls, forms, dialogs, charts, and browser-local calendar behavior.
- Use Server Actions for same-application mutations.
- Treat Server Actions and Route Handlers as public endpoints and authenticate, authorize, and validate each invocation.
- Use `proxy.ts`, the Next.js 16+ naming, only for Supabase token refresh and optimistic redirects. Proxy is not the authorization boundary.
- Avoid shared caching of authenticated user data. Revalidate the affected board after mutations.

Official references:

- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Authentication](https://nextjs.org/docs/app/guides/authentication)
- [Next.js Updating Data](https://nextjs.org/docs/app/getting-started/updating-data)
- [Next.js Proxy](https://nextjs.org/docs/app/getting-started/proxy)

### 3.2 Supabase Auth and SSR

- Use `@supabase/ssr` with separate browser and server client factories.
- Use cookie-based PKCE sessions.
- In server code, verify claims with the current recommended Supabase method; do not authorize from an unverified `getSession()` result.
- Configure email confirmation and password-recovery callback routes.
- Configure exact production redirects, local redirects, and scoped Vercel Preview redirects.
- Configure a production SMTP provider before launch. Supabase's default email sender is for limited testing.
- Do not expose a service-role key in browser-accessible modules or `NEXT_PUBLIC_*` variables.

Official references:

- [Creating a Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager)
- [Supabase Password Auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase PKCE flow](https://supabase.com/docs/guides/auth/sessions/pkce-flow)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

### 3.3 PostgreSQL and RLS

- Store schema changes as SQL migrations in `supabase/migrations`.
- Enable RLS on every table exposed through the Data API.
- Grant only necessary privileges to `authenticated`; grant no product-data access to `anon`.
- Create explicit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies with `USING` and `WITH CHECK` expressions as applicable.
- Derive ownership from `auth.uid()`; never accept a trusted `user_id` from form input.
- Use composite foreign keys to guarantee that an entry's board and activity belong to the same user as the entry.
- Test allowed and denied paths with pgTAP.

Official references:

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Securing the Supabase Data API](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase local migrations](https://supabase.com/docs/guides/local-development/overview)
- [Supabase database testing](https://supabase.com/docs/guides/local-development/testing/overview)

## 4. Application boundaries

### 4.1 Route groups

```text
src/app/
  (auth)/
    sign-in/
    sign-up/
    forgot-password/
    update-password/
  auth/
    confirm/
  (app)/
    boards/[boardId]/
    settings/
  actions/
```

### 4.2 Internal modules

```text
src/
  components/
    auth/
    boards/
    entries/
    heatmap/
    vocabulary/
    cefr/
    statistics/
    settings/
    ui/
  lib/
    auth/
    data/
    dates/
    cefr/
    statistics/
    supabase/
    validation/
  types/
```

- `lib/auth`: verified-user helpers and authorization primitives.
- `lib/data`: server-only reads, aggregation calls, and minimal DTO mapping.
- `lib/dates`: local-date parsing, Monday-week boundaries, leap-year behavior, and display formatting.
- `lib/cefr`: immutable reference targets, sourced level descriptions, and pure forecast calculations.
- `lib/statistics`: pure rules for presentation and any non-SQL transformations.
- `lib/supabase`: browser, server, and proxy client factories.
- `lib/validation`: shared schemas for form and server validation.

## 5. Data model

### 5.1 `profiles`

| Column       | Type          | Constraints and purpose                                        |
| ------------ | ------------- | -------------------------------------------------------------- |
| `user_id`    | `uuid`        | Primary key; references `auth.users(id)` with cascade deletion |
| `created_at` | `timestamptz` | Required, default current timestamp                            |
| `updated_at` | `timestamptz` | Required, maintained on update                                 |

No user time-zone setting is stored in MVP. A profile table is retained as an application-owned lifecycle anchor and extension point.

### 5.2 `language_boards`

| Column        | Type          | Constraints and purpose                        |
| ------------- | ------------- | ---------------------------------------------- |
| `id`          | `uuid`        | Primary key, generated UUID                    |
| `user_id`     | `uuid`        | Required owner; references `profiles(user_id)` |
| `name`        | `text`        | Required trimmed name, 1–50 characters         |
| `position`    | `smallint`    | Required display order                         |
| `archived_at` | `timestamptz` | Null while active                              |
| `created_at`  | `timestamptz` | Audit timestamp                                |
| `updated_at`  | `timestamptz` | Audit timestamp                                |

Required database rules:

- Unique `(id, user_id)` for composite references.
- Partial unique index on `(user_id, lower(name)) where archived_at is null`.
- At most six active boards, enforced by a transactional database function used for creation/restoration and covered by concurrency tests.

### 5.3 `activity_types`

| Column        | Type          | Constraints and purpose                        |
| ------------- | ------------- | ---------------------------------------------- |
| `id`          | `uuid`        | Primary key, generated UUID                    |
| `user_id`     | `uuid`        | Required owner; references `profiles(user_id)` |
| `name`        | `text`        | Required current display name, 1–50 characters |
| `system_key`  | `text`        | Nullable stable origin for seeded activities   |
| `position`    | `smallint`    | Required display order                         |
| `archived_at` | `timestamptz` | Null while selectable                          |
| `created_at`  | `timestamptz` | Audit timestamp                                |
| `updated_at`  | `timestamptz` | Audit timestamp                                |

Required database rules:

- Unique `(id, user_id)` for composite references.
- Partial unique index on `(user_id, lower(name)) where archived_at is null`.
- At most 30 active activities, enforced transactionally.
- Custom creation first looks for a case-insensitive archived-name match and restores that identity.
- Renaming changes the referenced label in historical views; entries do not copy the activity name.

### 5.4 `study_entries`

| Column             | Type          | Constraints and purpose                                                           |
| ------------------ | ------------- | --------------------------------------------------------------------------------- |
| `id`               | `uuid`        | Primary key, generated UUID                                                       |
| `user_id`          | `uuid`        | Required owner; references `profiles(user_id)`                                    |
| `board_id`         | `uuid`        | Required board                                                                    |
| `activity_type_id` | `uuid`        | Required activity                                                                 |
| `study_date`       | `date`        | Required local calendar date; past, present, or future                            |
| `duration_minutes` | `smallint`    | Integer from 1 through 1,440                                                      |
| `batch_id`         | `uuid`        | Nullable provenance link to `study_entry_batches`; absent for single-day creation |
| `created_at`       | `timestamptz` | Audit timestamp                                                                   |
| `updated_at`       | `timestamptz` | Audit timestamp                                                                   |

Ownership constraints:

- `(board_id, user_id)` references `language_boards(id, user_id)`.
- `(activity_type_id, user_id)` references `activity_types(id, user_id)`.
- `(batch_id, user_id)` references `study_entry_batches(id, user_id)` when present.

These constraints prevent cross-user references even if application validation fails.

PostgreSQL `date` is appropriate because a study entry belongs to a calendar day and must not move between days when a device time zone changes. Audit timestamps use `timestamptz` because they represent instants.

Reference: [PostgreSQL date/time types](https://www.postgresql.org/docs/current/datatype-datetime.html).

### 5.5 `study_entry_batches`

| Column             | Type          | Constraints and purpose                               |
| ------------------ | ------------- | ----------------------------------------------------- |
| `id`               | `uuid`        | Client-generated operation identifier and primary key |
| `user_id`          | `uuid`        | Required owner; references `profiles(user_id)`        |
| `board_id`         | `uuid`        | Required owned board                                  |
| `activity_type_id` | `uuid`        | Required owned activity                               |
| `start_date`       | `date`        | Inclusive first date                                  |
| `end_date`         | `date`        | Inclusive final date                                  |
| `duration_minutes` | `smallint`    | Integer from 1 through 1,440 copied to each entry     |
| `created_at`       | `timestamptz` | Audit timestamp                                       |

Required rules:

- Composite ownership references match the batch owner.
- `start_date <= end_date`, both dates have the same calendar year, and the inclusive range contains at most 366 dates.
- Unique `(id, user_id)` supports owned provenance references.
- Unique `(batch_id, study_date)` on batch-created study entries guarantees one generated row per target date for one operation.
- Reusing the same owned batch ID returns the original outcome; a conflicting payload for that ID is rejected.
- Individual generated entries remain independently editable and deletable; no bulk-edit or bulk-delete behavior is implied.

An authenticated database function validates the complete payload and inserts the batch plus its entries in one transaction. It expands the inclusive date range with PostgreSQL `generate_series`/date arithmetic and never deletes, replaces, merges, or skips existing entries. Reference: [PostgreSQL set-returning functions](https://www.postgresql.org/docs/current/functions-srf.html).

### 5.6 `vocabulary_daily_totals`

| Column          | Type          | Constraints and purpose                                |
| --------------- | ------------- | ------------------------------------------------------ |
| `id`            | `uuid`        | Primary key, generated UUID                            |
| `user_id`       | `uuid`        | Required owner; references `profiles(user_id)`         |
| `board_id`      | `uuid`        | Required owned board                                   |
| `study_date`    | `date`        | Required local calendar date; past, present, or future |
| `words_learned` | `integer`     | Required non-negative final daily total                |
| `created_at`    | `timestamptz` | Audit timestamp                                        |
| `updated_at`    | `timestamptz` | Audit timestamp                                        |

Required rules:

- `(board_id, user_id)` references `language_boards(id, user_id)`.
- Unique `(user_id, board_id, study_date)` guarantees one record per board/date under concurrency.
- `words_learned >= 0`; zero may be stored as an explicit editable daily total.
- Create-on-existing becomes an explicit update/upsert of the owned record, never a second row.

### 5.7 `cefr_level_events`

| Column           | Type          | Constraints and purpose                                         |
| ---------------- | ------------- | --------------------------------------------------------------- |
| `id`             | `uuid`        | Primary key, generated UUID                                     |
| `user_id`        | `uuid`        | Required owner; references `profiles(user_id)`                  |
| `board_id`       | `uuid`        | Required owned board                                            |
| `level`          | `text`        | Required check-constrained value: A0, A1, A2, B1, B2, C1, or C2 |
| `effective_date` | `date`        | User-declared past or current local calendar date               |
| `created_at`     | `timestamptz` | Audit timestamp                                                 |
| `updated_at`     | `timestamptz` | Audit timestamp                                                 |

Required rules:

- `(board_id, user_id)` references `language_boards(id, user_id)`.
- Unique `(user_id, board_id, effective_date)` allows one effective declaration
  per board/date. Creating or moving another event onto an occupied date is
  rejected rather than upserting over the existing event.
- A trusted mutation validates `effective_date <= local_today`; database ownership and value constraints remain authoritative.
- Current level is the event with the greatest effective date, with deterministic timestamp/ID tie-breaking.
- A trusted mutation locks the board's relevant history and rejects a create or
  edit that would leave two chronologically adjacent events at the same level.
  A non-adjacent return such as `B1 → B2 → B1` remains valid.
- Deletion requires explicit UI confirmation. Deleting the current event makes
  the preceding event current; deleting the final event restores the no-level
  state.
- Forecast calculations read events, study entries, and vocabulary daily totals
  but never mutate level history.

Level descriptions, Study Time transition targets, and Vocabulary ranges are
immutable versioned application reference data rather than user-editable rows.
A0 is application-defined and is disclosed as non-official; sourced CEFR
descriptions apply to A1–C2. If either reference model changes, its version and
methodology must change explicitly so historical interpretation remains
reviewable.

### 5.8 `vocabulary_total_batches`

| Column           | Type          | Constraints and purpose                               |
| ---------------- | ------------- | ----------------------------------------------------- |
| `id`             | `uuid`        | Client-generated operation identifier and primary key |
| `user_id`        | `uuid`        | Required owner; references `profiles(user_id)`        |
| `board_id`       | `uuid`        | Required owned board                                  |
| `start_date`     | `date`        | Inclusive first date                                  |
| `end_date`       | `date`        | Inclusive final date                                  |
| `words_learned`  | `integer`     | Non-negative total for each date in the range         |
| `inserted_count` | `smallint`    | Dates created by the operation                        |
| `updated_count`  | `smallint`    | Existing dates overwritten by the operation           |
| `created_at`     | `timestamptz` | Audit timestamp                                       |

An authenticated database function validates the owned active board and the
same-year range of at most 366 dates. A client-generated operation ID makes
retries idempotent. One transaction upserts the requested total for every date
in the range, creating empty dates and overwriting existing daily totals.

### 5.9 Indexes

Initial indexes:

- `study_entries (user_id, board_id, study_date)` for heatmaps, day views, and period totals.
- `study_entries (user_id, board_id, activity_type_id, study_date)` for activity breakdowns.
- `vocabulary_daily_totals (user_id, board_id, study_date)` for yearly heatmaps and statistics; the uniqueness constraint may provide this index.
- `cefr_level_events (user_id, board_id, effective_date desc)` for current level and history.
- `study_entry_batches (user_id, board_id, created_at)` for owned operation lookup.
- `vocabulary_total_batches (user_id, board_id, created_at)` for owned
  operation lookup.
- Partial active-name indexes described above.

Primary and unique constraints provide their own supporting indexes. Additional indexes require query-plan evidence.

## 6. User initialization

A tested database trigger on `auth.users` creates the application profile and
the ten persisted standard activity rows in the same signup transaction:
Reading, Podcast, Speaking, Writing, Anki, Grammar, TV Show / Film, YouTube,
Shadowing, and Lesson. `Other` remains a UI command that creates or restores a
named custom activity; it is not seeded as an `activity_types` row. The function
must:

- be narrowly scoped;
- use a fixed safe `search_path`;
- be idempotent where possible;
- be covered by database tests because an error could block signup.

The trigger does not create a language board. After authentication, a user with
no active boards receives an application empty state and creates the first board
through `create_or_restore_language_board`.

An application-level recovery path should detect and repair an incomplete profile if operational intervention ever leaves one behind.

## 7. Data access and mutations

### 7.1 Reads

- A Server Component verifies the user and requests only data required by the route.
- The board screen reads the board, selected tracker/year aggregates, summary
  statistics, selected-day data, current CEFR declaration, and the
  tracker-appropriate forecast summary. The board-scoped CEFR management screen
  reads the complete ordered declaration history and both forecast models.
- DTOs prevent accidental exposure of internal or unrelated fields.
- Authenticated reads are dynamic and not shared across users.

### 7.2 Mutations

Each Server Action follows this sequence:

1. Verify authenticated claims.
2. Parse and validate untrusted input.
3. Derive `user_id` from the verified identity.
4. Execute a constrained database operation under the user's session.
5. Map expected constraint errors to user-facing errors.
6. Revalidate the affected board/settings data.

Board/activity creation and restoration use database functions so name restoration and active-count limits remain atomic under concurrent requests.

Board and custom-activity rename operations update the existing owned row rather
than replacing its identity. Study entries retain their `activity_type_id`, so a
custom activity's current name is reflected across historical entry views and
statistics. Server Actions reject rename/archive attempts for standard
activities.

Batch creation uses a single authenticated database function. The function derives the owner from `auth.uid()`, validates the owned board/activity and the complete range, records the operation ID, and inserts all generated entries atomically. Vocabulary uses an owned upsert constrained by the board/date uniqueness rule. CEFR create/edit/delete operations use owned constrained database functions that validate the browser-local effective date, reject an occupied effective date, serialize changes for one board, and preserve the no-adjacent-duplicate-level invariant.

Vocabulary date-range creation similarly uses one authenticated transaction. It
derives ownership from `auth.uid()`, upserts every date in the range, records
inserted/updated counts, and returns the original result when the same operation
identifier and payload are retried.

### 7.3 Client theme preference

Theme preference is a browser-local UI setting with values `system`, `light`, or
`dark`. The default is `system`. The selected value is stored under
`language-tracker-theme` in `localStorage`; it contains no product or identity
data. A small pre-hydration script applies the preference to the root document
to avoid a light-theme flash, and system mode follows
`prefers-color-scheme` changes.

## 8. Aggregation design

MVP stores source entries only and derives heatmap/statistics on demand. The
Statistics Server Component reads RLS-filtered study entries and Vocabulary
daily totals for one selected board. Pure, unit-tested TypeScript functions
calculate both trackers' selected-year/current-period totals, distributions,
averages, active days, and streaks. This is proportionate to the expected MVP
load and avoids persisted aggregate state.

The following `security invoker` functions remain the target if measurement
shows that later phases should move aggregation into PostgreSQL:

- `get_board_year_heatmap(board_id, year)` returns daily totals and intensity levels.
- `get_board_statistics(board_id, selected_year, local_today)` returns totals, averages, active days, activity breakdown, current streak, and longest streak.
- `get_board_distribution(board_id, granularity, period)` returns chart buckets.
- `get_board_recent_activity(board_id, local_today, period_days)` returns minutes grouped by activity for a recent calendar window ending at `local_today`; the UI uses seven and thirty days.
- Activity-average comparison remains a pure application transformation over
  the same RLS-filtered Study Time entries. It derives selected-year, thirty-day,
  and seven-day per-calendar-day averages, selects the union of each period's top
  five activities, groups every other activity into `Other`, and calculates
  rounded presentation changes in the UI.
- `get_board_vocabulary_year(board_id, year, local_today)` returns daily word
  totals, selected-year and current-period totals, averages, active days,
  distributions, and vocabulary streaks.
- `get_board_cefr_forecast(board_id, local_today)` returns the current
  declaration; Study Time and Vocabulary baselines, eligible progress, and
  remaining references; seven- and thirty-day pace inputs; estimated dates; and
  both reference-model keys.

Rules:

- Functions do not accept a trusted user ID.
- RLS and explicit board ownership remain in effect.
- `local_today` is an ISO date supplied from the browser-local context and validated as a date. It affects current-period, average, and streak cutoffs but never rewrites stored dates.
- Selected-year total and heatmap include future entries.
- Current-period averages and streaks exclude dates after `local_today`.
- Weeks begin on Monday.
- Vocabulary uses one source row per board/date and the same non-future active-day/streak cutoffs.
- CEFR pace uses exactly seven or thirty calendar dates ending at `local_today`,
  including zero-value dates. Future Study Time and Vocabulary entries never
  participate in CEFR progress, estimated totals, or pace.

### 8.1 CEFR reference model and calculation

The first approved Study Time model is versioned immutable application
reference data. It stores transition ranges and exact calculation differences:

| Transition | Indicative hours | Calculation hours |
| ---------- | ---------------: | ----------------: |
| A0 → A1    |            40–60 |                40 |
| A1 → A2    |            60–90 |                60 |
| A2 → B1    |          140–200 |               140 |
| B1 → B2    |          160–240 |               310 |
| B2 → C1    |          200–300 |               250 |
| C1 → C2    |          280–450 |               450 |

Indicative hours describe standalone transition guidance. Calculation hours are
approved deltas between cumulative target points and therefore are not
constrained to the corresponding standalone range.

For the latest effective declaration below C2:

```text
levelBaselineMinutes =
  sum(calculation hours for transitions from A0 through currentLevel) * 60
referenceMinutes = calculation hours for currentLevel → nextLevel * 60
eligibleMinutes = sum(study entries from effectiveDate through localToday)
estimatedTotalLearningMinutes = levelBaselineMinutes + eligibleMinutes
remainingMinutes = max(0, referenceMinutes - eligibleMinutes)
sevenDayMinutes = sum(study entries from localToday - 6 days through localToday)
thirtyDayMinutes = sum(study entries from localToday - 29 days through localToday)
sevenDayAverage = sevenDayMinutes / 7
thirtyDayAverage = thirtyDayMinutes / 30
sevenDayRemaining = ceil(remainingMinutes / sevenDayAverage)
thirtyDayRemaining = ceil(remainingMinutes / thirtyDayAverage)
```

The Vocabulary model is separately versioned immutable reference data:

| Level | Indicative cumulative words | Calculation midpoint |
| ----- | --------------------------: | -------------------: |
| A0    |                           0 |                    0 |
| A1    |                   700–1,200 |                  900 |
| A2    |                 1,200–2,000 |                1,600 |
| B1    |                 2,000–3,000 |                2,500 |
| B2    |                 3,000–4,500 |                3,700 |
| C1    |                 4,000–6,000 |                5,000 |
| C2    |                5,000–8,000+ |                7,000 |

```text
levelBaselineWords = midpoint(currentLevel)
referenceWords = midpoint(nextLevel) - midpoint(currentLevel)
eligibleWords = sum(vocabulary totals from effectiveDate through localToday)
estimatedVocabularySize = levelBaselineWords + eligibleWords
remainingWords = max(0, referenceWords - eligibleWords)
sevenDayWords = sum(vocabulary totals from localToday - 6 days through localToday)
thirtyDayWords = sum(vocabulary totals from localToday - 29 days through localToday)
sevenDayWordAverage = sevenDayWords / 7
thirtyDayWordAverage = thirtyDayWords / 30
```

Each positive pace produces an independent estimated date by adding the ceiling
of remaining units divided by average units per calendar day to `localToday`.
Presentation derives an approximate calendar duration in years, months, and
days plus an estimated month/year from that date. A forecast is absent for a
zero pace, no current declaration, or C2. A zero remaining value prompts
reassessment without changing the level. Progress presentation may cap at 100%
while retaining the uncapped eligible total.

The query returns raw calculation inputs and both model keys so UI copy and
tests can reproduce every result. All user-facing Vocabulary values use
`words`, including the reference model, estimated totals, and remaining
progress.

Study Time disclosure:

> Study Time help shows the current level's effective date, the per-step
> indicative hour ranges and exact calculation values, cumulative ranges from
> A0, cumulative calculation values from A0, and a note that the forecast is an
> approximate guide rather than a guaranteed timeframe.

Vocabulary disclosure:

> Vocabulary help shows the current level's effective date, the indicative
> vocabulary ranges, exact calculation values, and a note that stored word totals
> are approximate daily signals rather than deduplicated vocabulary records.

### 8.2 Weekly recommendation model

The approved weekly recommendation model is immutable versioned application
reference data in `lib/cefr`. Each A0–C1 record contains its next-level target,
a 600-minute reference week, category allocations totaling 100%, and
product-authored advice items. C2 has no record because the model has no next
level.

The UI derives weekly hours from `percentage * 600 / 100` and never stores them
as user data. The circular chart uses the same category colors in every level,
while its accessible name and adjacent legend expose category, percentage, and
hours without relying on color. The recommendation appears in both the CEFR
screen and detailed Statistics. It remains suggested reference guidance and is
not compared with actual user activity in Phase 4.

No aggregate table or materialized view is planned. Index-backed aggregation over a single user's board is appropriate for the stated scale.

## 9. Heatmap architecture

- Render a semantic, keyboard-accessible 7-row by week-column grid.
- Calculate the calendar structure with pure deterministic date utilities.
- Return pre-aggregated daily totals rather than all entries.
- Map Study Time totals to fixed levels: `0`, `1–14`, `15–29`, `30–59`, `60–119`, `120–180`, and `181+`.
- Derive the zero-minute semantic state from the cell date: past is red; today/future is white.
- Map the three positive sub-hour levels to yellow-family tokens and the three 60+ levels to progressively darker green tokens.
- Map Vocabulary totals independently to `0`, `1–2`, `3–5`, `6–9`, `10–14`, `15–19`, `20–39`, and `40+` green-family levels.
- Render empty and explicit-zero Vocabulary dates from the first positive
  total through `local_today` in muted red. Keep dates before the first
  positive total and future empty dates white unless an explicit zero total
  exists; an explicit zero is always red.
- Expose a full accessible label such as `July 14, 2026: 30 minutes`.
- Expose equivalent vocabulary labels such as `July 14, 2026: 12 new words`.
- Use horizontal overflow on narrow screens rather than shrinking controls below a usable size.

## 10. Security model

Security is layered:

1. Protected layouts and optimistic redirects improve UX.
2. Verified server claims establish identity.
3. Server Actions validate input and resource intent.
4. Composite foreign keys enforce same-owner relationships.
5. RLS restricts every database operation.
6. Database constraints enforce bounds and referential integrity.

The same controls apply to `study_entry_batches`, `vocabulary_daily_totals`, and `cefr_level_events`. Every table exposed through the Data API enables RLS and has explicit owner policies. Functions run with caller permissions where possible; any narrowly scoped `security definer` function must set a safe `search_path`, derive ownership from `auth.uid()`, avoid accepting trusted owner IDs, and have direct pgTAP abuse cases. Reference: [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

The browser receives only the Supabase publishable key. Any future administrative capability must live in a dedicated server-only module and must never rely on client-provided ownership.

## 11. Environment and deployment

Separate Supabase projects are preferred for local/test and production. Preview may use a dedicated non-production project or a controlled shared test project, never production user data.

Expected environment variables include:

- Supabase project URL;
- Supabase publishable key;
- explicit public site URL for auth redirects.

Secrets are configured separately for Vercel Development, Preview, and Production. Changes require a new deployment. Production auth redirects use exact URLs; preview wildcard patterns are scoped to the owning Vercel account.

Reference: [Vercel environments](https://vercel.com/docs/deployments/environments).

## 12. Testing strategy

### Unit tests

- Leap years and 53-week heatmap layouts.
- Monday week boundaries.
- Intensity thresholds, especially 180 versus 181 minutes.
- Past/today/future zero-state colors and every Study Time and Vocabulary threshold boundary.
- Current/completed-year averages.
- Future-entry exclusions.
- Current and longest streak behavior.
- Batch range validation, leap-year 366-day ranges, and cross-year rejection.
- CEFR Study Time transition differences and derived baselines; Vocabulary
  midpoint differences; estimated totals; seven- and thirty-day zero-inclusive
  pace; calendar-duration presentation; rounding; A0; C2; and unavailable
  forecasts.

### Database tests

- Schema constraints and active-count limits.
- Case-insensitive uniqueness.
- Archived activity restoration.
- Cross-user composite-reference rejection.
- RLS allow/deny behavior for every operation.
- Aggregation correctness with archived activities and future entries.
- Batch atomicity/idempotency and preservation of matching existing entries.
- Vocabulary board/date uniqueness, upsert behavior, ownership, and RLS.
- CEFR event ownership, A0–C2 values, effective-date mutation validation,
  occupied-date rejection, adjacent-level invariant, deletion, history, and RLS.

### Playwright tests

- Registration/confirmation where the test environment permits email capture.
- Sign in, sign out, and password recovery critical path.
- Board and activity lifecycle.
- Entry create/edit/delete on past, current, and future dates.
- Collapsed create form, disabled-save prerequisites, card edit/cancel/update, and confirmed delete.
- Study Time/Vocabulary/Statistics navigation preserves the selected board and
  year.
- Batch creation preview, success, matching-entry preservation, and retry behavior.
- Vocabulary tab create/edit/delete, explicit zero, non-overwriting batch,
  heatmap, streak, distribution, and combined-statistics behavior.
- CEFR declaration history, level regression and non-adjacent return, Study Time
  and Vocabulary forecast disclosures, seven/thirty-day comparison, estimated
  totals, and A0/zero-pace/C2 states.
- User A cannot access User B's data.
- Desktop hover/focus actions, two persistently visible mobile entry-action icons, and the 1366×768 above-the-fold contract.

Playwright can launch the local app through its `webServer` configuration and use separate desktop/mobile projects.

The Phase 1 protected browser journey uses a clean local Supabase stack in CI.
The setup script creates a confirmed E2E-only user through the local admin API,
passes only public project values to Next.js, and never sends a service-role key
to browser code. Hosted accounts and production data are not used by browser
automation.

References: [Playwright web server](https://playwright.dev/docs/test-webserver), [Playwright projects](https://playwright.dev/docs/test-projects).

## 13. Deferred decisions

The following are intentionally outside the current expanded MVP or blocked until separate product approval:

- import/export format;
- localization architecture;
- all-language analytics;
- persisted aggregates or background processing.
