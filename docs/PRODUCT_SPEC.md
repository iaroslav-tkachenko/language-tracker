# Product Specification

> For role-based reading paths and the structured requirements set, start at the [documentation home](README.md).

## 1. Product overview

Language Learning Time Tracker is a responsive web application for recording time spent learning foreign languages. A user creates separate language boards, records study entries on calendar dates, and reviews a yearly contribution-style heatmap and statistics for each board.

The MVP is private and single-user in nature: it has no social graph, public data, administration interface, payments, notifications, offline mode, or native mobile application.

## 2. Goals

- Make daily study logging fast on desktop and mobile.
- Preserve an accurate, editable history of exact study minutes.
- Provide a motivating yearly visual history and study streak.
- Track newly learned vocabulary as a separate daily signal on every language board.
- Preserve self-declared CEFR history and provide transparent, approximate progress guidance.
- Provide useful statistics without combining unrelated languages.
- Protect every user's data at both the application and database layers.

## 3. Non-goals for MVP

- Cross-board or all-language statistics.
- Social features, sharing, public profiles, or viewing another user's data.
- Subscriptions, payments, notifications, or an admin panel.
- Import or export.
- Editable duration presets.
- Theme selection, dark theme, or system theme.
- UI localization or an app-language selector.
- Offline support or native mobile applications.
- Automatic CEFR assessment, certification, or promotion.
- User-defined CEFR hour targets, CEFR vocabulary cutoffs, or ideal activity distributions.

## 4. Users and access

### 4.1 Authentication

A user can:

- register with email and password;
- confirm the email address;
- sign in;
- sign out;
- request a password-reset email;
- set a new password through a valid recovery flow.

### 4.2 Data privacy

- A user can read and mutate only their own profile, boards, activities, and entries.
- Unauthenticated users cannot access product data.
- Ownership is enforced with PostgreSQL Row Level Security, not only UI or route checks.

## 5. Language boards

- A user can have at most six active language boards.
- A new user starts without a language board. The authenticated empty state
  prompts them to create their first board; the product never assumes a
  language or creates `German` automatically.
- A board name contains 1–50 trimmed characters.
- Active board names are unique per user, case-insensitively.
- Example names include `German`, `English`, and `Italian`.
- A user can create, select, rename, reorder, and remove a board.
- Removing a board with entries requires explicit confirmation.
- A used board is archived rather than physically deleted.
- An archived board and its entries disappear from the normal UI and statistics.
- Each heatmap and every statistic are scoped to exactly one selected board.
- Each board exposes `Study Time` and `Vocabulary` tracker tabs and its own CEFR history.
- There is no combined all-language view in MVP.

## 6. Activity catalog

### 6.1 Standard activity choices

The activity picker presents these standard choices:

- Reading
- Podcast
- Speaking
- Writing
- Anki
- Grammar
- TV Show / Film
- Other

The first seven choices are persisted activity types created for each new user. `Other` is a UI action for creating or restoring a named custom activity; it is not an unnamed activity type and an entry cannot be saved against a generic `Other` value.

### 6.2 Global scope

- Activity types belong to the user, not to a language board.
- An activity is available for entries on every active board owned by that user.
- A user can have at most 30 active persisted activities, including the seven seeded activities. The `Other` UI action does not count toward this limit.
- An activity name contains 1–50 trimmed characters.
- Active activity names are unique per user, case-insensitively.

### 6.3 Custom activity creation

`Other` is the entry point for the same operation as adding a custom activity:

1. The user chooses to add another activity.
2. The user enters a name.
3. The application creates it in the user's global activity catalog.
4. The activity becomes reusable on every board.
5. The activity can be selected for the current entry.

The flow must obtain a non-empty custom name before saving the study entry.

### 6.4 Rename, archive, and restore

- A user can rename, hide, and remove an activity from the available catalog.
- Renaming an activity changes its name in historical entry views and statistics because entries reference the activity identity, not a copied label.
- Removing a used activity archives it. Historical entries remain intact and continue contributing to heatmaps and statistics.
- Archived activities cannot be selected for new entries.
- If the user creates an activity whose case-insensitive normalized name matches an archived activity, the application restores that activity identity instead of creating a duplicate.
- Restored activity statistics include both its earlier and later entries.
- An unused custom activity may be physically deleted, although using the same archive flow for all activities is acceptable if it simplifies behavior.

## 7. Study entries

### 7.1 Entry fields

Each entry contains:

- one language board;
- one study date;
- one activity type;
- an exact duration in minutes;
- creation and update timestamps.

### 7.2 Entry rules

- A date can contain any number of entries.
- Each successful single-day submission creates exactly one entry; the separately confirmed batch flow creates one independent entry per target date.
- Users can create entries for past, current, and future dates.
- Users can edit and delete individual entries.
- Deleting an entry removes its minutes from every derived heatmap and statistic.
- Duration is an integer from 1 through 1,440 minutes.
- Study entries do not contain comments or notes.
- The selected board and activity must both belong to the authenticated user.
- An archived board or activity cannot be used for a new entry.

### 7.3 Duration input

Fixed quick-select values are:

- 10 minutes
- 15 minutes
- 20 minutes
- 30 minutes
- 45 minutes
- 60 minutes
- 90 minutes
- 120 minutes

The user can also enter any valid custom integer duration. Values such as `3+ hours` are presentation labels and are never stored as entry durations.

### 7.4 Selected-day interaction

- Selecting an empty past, current, or future date shows its heading and `Add study session`; the entry form is initially collapsed.
- Activating `Add study session` reveals quick durations, custom minutes, active activities, `Other`, disabled `Save`, and `Cancel`.
- `Save` becomes available only after both a valid duration and active activity are selected.
- A saved entry card shows its duration and activity without repeating the current language-board name.
- Every standard activity uses its own recognizable icon. All user-created activities share one distinct custom-activity icon; the icon is presentation metadata and does not change the stored activity model.
- Edit and delete actions appear on pointer hover and keyboard focus on desktop. Both icons remain persistently visible on mobile/touch layouts.
- Edit exposes current values with explicit `Update` and `Cancel` actions.
- When editing begins, the saved duration and activity are selected and visibly highlighted. Choosing another value moves the highlight to the new selection.
- Delete always requires confirmation.
- A populated selected day shows `Add study session` below its existing entry cards so another independent entry can be added directly.
- Prominent previous-day and next-day arrow controls beside the selected date move the day view by exactly one calendar date while preserving the selected board.
- The selected day's total is visually emphasized, with the numeric duration stronger than its supporting `total` label.
- Today uses the `Today` heading with its full date beneath it. Any other selected date uses the full weekday and date as the heading and never displays the generic text `Selected day`.
- An empty selected date displays `No study session for this day yet.`

### 7.5 Batch entry creation

The user can create the same study entry across a date range:

1. Select one active board, active activity, exact duration, start date, and end date.
2. Review a confirmation containing the inclusive dates and number of entries.
3. Confirm one atomic operation that creates one independent entry per date.

The inclusive range must be ordered, remain inside one calendar year, and contain no more than 366 dates. Existing entries are never replaced, merged, or skipped, including entries with the same activity and duration. Retrying the same submission intent must not create a second copy of the batch.

## 8. Calendar and local-date behavior

- An entry represents a calendar date rather than a time of day.
- The product does not display or persist a user time-zone preference.
- The browser's local calendar date defines today and the current week and month.
- A week always runs from Monday through Sunday and is not configurable.
- Existing `study_date` values never shift when the device time zone changes.
- Future dates remain selectable and can contain entries.

## 9. Yearly heatmap

### 9.1 Behavior

- The heatmap displays one selected calendar year for the selected board.
- Users can navigate to earlier and later years.
- Every day is represented by a square cell.
- A cell's level is based on the sum of all entry minutes for that board and date.
- Dates before the board's earliest study entry remain white, including past dates and complete earlier years. From the earliest entry date through yesterday, a zero-minute date is red. Yellow and green are reserved exclusively for dates with positive study minutes.
- Past, current, and future entries are shown immediately in the selected year's heatmap.
- Selecting a cell opens the corresponding day and its entries.
- The layout is contribution-graph-like, with weekdays in rows and weeks in columns.

### 9.2 Fixed intensity levels

| Daily total                             | Level | Semantic color       |
| --------------------------------------- | ----: | -------------------- |
| 0 minutes before the first entry        |     0 | White                |
| 0 minutes from first entry to yesterday |     0 | Red                  |
| 0 minutes today or on a future date     |     0 | White                |
| 1–14 minutes                            |     1 | Light yellow family  |
| 15–29 minutes                           |     2 | Yellow family        |
| 30–59 minutes                           |     3 | Strong yellow family |
| 60–119 minutes                          |     4 | Light green          |
| 120–180 minutes                         |     5 | Green                |
| 181+ minutes                            |     6 | Dark green           |

The highest legend label is `3+ hours`, following the approved product wording. The exact numeric boundary is 181 minutes.

Levels are absolute rather than relative to that year's maximum, so the same color always represents the same range.

The Phase 1 visual direction uses a soft, approachable version of the semantic palette: muted red for missed past dates, warm yellows below 60 minutes, and muted sage-to-forest greens from 60 minutes upward.

### 9.3 Accessibility and responsive behavior

- Color is not the only source of information; each cell exposes its date and minute total to assistive technology and tooltips.
- Cells have visible keyboard focus and can be selected by keyboard.
- Mobile preserves a usable cell size and may horizontally scroll the yearly grid.
- On mobile, the Study Time year is presented as two compact half-year grids labelled `Jan–Jun` and `Jul–Dec`; summary metrics use a compact two-column layout.

### 9.4 Vocabulary tracker and heatmap

Every language board provides a `Vocabulary` tab alongside `Study Time`.

- A board/date has either no vocabulary record or one final non-negative-integer total of newly learned words.
- The record stores only a count, not individual words.
- The user can create the total for a past, current, or future date, edit it, or delete it after confirmation.
- A second save for the same board/date updates the existing daily record rather than creating another row.
- Zero may be stored explicitly so the user can record, edit, and delete a
  zero-word day.
- The Vocabulary heatmap uses a green visual scale and independent year navigation while preserving the selected board.
- Its fixed thresholds are `0`, `1–2`, `3–5`, `6–9`, `10–14`, `15–19`, `20–39`, and `40+` words.
- Each cell exposes its date and word count without requiring color perception.
- Empty and explicit-zero dates from the board's first positive vocabulary
  total through browser-local today are shown as missed days in muted red.
  An explicitly saved zero is always red, including before the first positive
  total or on a future date. Earlier and future dates without a record remain
  white.

Vocabulary summary statistics include selected-year word total, non-future
active days, calendar-day and study-day averages, all-time word total, current
week and month word totals, current streak, and longest streak. A vocabulary
active day has at least one word. Future totals appear in the selected-year
heatmap and total immediately but do not affect active-day counts, averages,
current-period totals, or streaks until their date arrives.

### 9.5 Vocabulary date-range creation

The user can save the same final word total across an inclusive date range.

- The range must remain inside one calendar year and contain at most 366 dates.
- Existing daily vocabulary totals are preserved unchanged.
- The new value is created only for dates without a vocabulary record.
- The confirmation shows the inclusive range, requested word total, empty-date
  count, and existing-date count before submission.
- The database operation is atomic and idempotent for one client-generated
  operation identifier.
- Zero is a valid batch value and creates explicit red zero-word dates.

## 10. Statistics

All statistics are scoped to the selected board.

### 10.1 Totals

- Total time for the selected year includes all entries in that year, including future-dated entries.
- Current-day total includes entries dated today.
- Current-week total includes non-future dates in the current Monday–Sunday week.
- Current-month total includes non-future dates in the current calendar month.
- Activity totals include active and archived activities with historical entries.
- The statistics screen visually separates selected-year metrics from live
  metrics that remain independent of the selected year. Selected-year total,
  active days, and both averages belong to `Selected year`; current and longest
  streak plus current day, week, and month belong to `Current progress`.
- The same screen shows Vocabulary metrics for the selected board. Selected-year
  word total, active days, calendar-day average, and study-day average belong to
  `Selected year`. All-time words, current and longest vocabulary streak, and
  current-week/current-month word totals belong to `Current progress`.
- After the user declares a current level, detailed statistics also distinguish
  source-record totals from model-based estimates. The UI labels these metrics
  `Tracked study time`, `Estimated learning time`, `Tracked words`, and
  `Estimated words known`; each card has a corresponding icon. Tracked values
  remain the exact values saved in the trackers. Estimated learning time equals
  the current level's derived cumulative reference baseline plus non-future
  Study Time recorded from that declaration's effective date through today.
  Estimated words known equals the current level's reference vocabulary
  midpoint plus non-future words recorded over the same interval.
- The statistics overview uses the heading `Your learning overview` and the
  status `Current level · <level>`. User-facing copy does not use the technical
  terms `self-declared` or `non-future entries`.
- Estimated totals are unavailable without a current declaration. They are
  recalculated after any CEFR-history change and never rewrite Study Time or
  Vocabulary records.

### 10.2 Active days and averages

- An active day has a board total greater than zero minutes.
- Future dates are excluded from active-day counts and averages until the date arrives.
- Calendar-day average for the current year is the total for dates from January 1 through today, divided by the number of elapsed calendar days including today.
- Calendar-day average for a completed year is the year's total divided by 365 or 366.
- Active-day average is the non-future total divided by the number of non-future active days.
- An average with a zero denominator displays zero rather than an error.

### 10.3 Streaks

A streak is a sequence of consecutive active calendar days.

- Only dates no later than today participate in streak calculations.
- Future entries do not extend current or longest streaks until their dates arrive.
- The current streak remains alive when the latest active day is today or yesterday.
- If neither today nor yesterday is active, the current streak is zero.
- The longest streak is the greatest consecutive sequence among dates no later than today.
- The UI term is `streak`.

### 10.4 Distributions

Statistics include separate blue Study Time and green Vocabulary bar charts.
Each chart has its own granularity selector:

- `Day`: daily minute or word totals for a selected month.
- `Week`: Monday–Sunday weekly totals for a selected year.
- `Month`: monthly totals for a selected year.
- `Year`: yearly totals across the board's complete history.

Future entries can appear in selected-year and selected-month distributions, but they remain excluded from current-period averages and streaks as specified above.

### 10.5 Recent activity analysis

Detailed statistics show actual Study Time grouped by activity across the
selected year and across the latest seven calendar dates ending today. Both
activity allocations use circular charts and a legend that shows absolute
duration and percentage of the period total. The seven-date window includes
zero-study dates and excludes future entries; its heading is
`Activity totals latest 7 days`.

The product also shows an approved suggested weekly learning mix for the
transition from the current level to the next level. The reference week is ten
hours. Percentages always total 100% and are also displayed as hours per week.
The model is fixed and not user-editable.

| Current level | Target | Vocabulary | Grammar | Shadowing | Conversation | Listening | Reading |
| ------------- | ------ | ---------: | ------: | --------: | -----------: | --------: | ------: |
| A0            | A1     |        70% |     15% |       15% |            — |         — |       — |
| A1            | A2     |        65% |     15% |       20% |            — |         — |       — |
| A2            | B1     |        50% |       — |         — |          10% |       40% |       — |
| B1            | B2     |        20% |       — |         — |          20% |       40% |     20% |
| B2            | C1     |          — |       — |         — |          40% |       40% |     20% |
| C1            | C2     |          — |       — |         — |          40% |       40% |     20% |

The recommendation appears after the Study Time and Vocabulary progress cards
and in detailed Statistics. It uses an accessible circular chart, a text legend
with percentages and weekly hours, and adjacent practical advice. C2 has no
next-level recommendation.

Advice is product-authored and grouped into short actionable items:

- A0 to A1: build phonetics and pronunciation habits; use beginner-friendly
  video and shadowing; learn sentence structure and present-tense changes;
  recognize cases and articles without over-focusing on them; learn sentences
  rather than isolated words; use spaced repetition, preferably Anki; create
  cards for common present-tense verb forms; add at least ten new cards daily.
- A1 to A2: continue level-appropriate video and shadowing; learn the main verb
  tenses; learn sentences rather than isolated words; use spaced repetition;
  create cards for common verbs in different tense forms; add at least ten new
  cards daily.
- A2 to B1: speak regularly with native speakers, AI, or aloud to oneself;
  increase level-appropriate podcast and video listening; capture useful new
  words in cards and review them consistently.
- B1 to B2: increase speaking practice; move toward content created for native
  speakers, beginning with familiar cartoons or series; read comics or
  accessible fiction; use AI to simplify difficult news passages; keep
  collecting and reviewing useful vocabulary.
- B2 to C1 and C1 to C2: consume more content created for native speakers; speak
  with native speakers about varied topics; switch devices and interfaces to
  the language being learned.

### 10.6 CEFR declaration history

- CEFR belongs to one language board.
- The user manually declares A0, A1, A2, B1, B2, C1, or C2 with an effective
  date no later than browser-local today. A0 is labelled `Absolute zero` and is
  an application-defined starting state, not an official CEFR level.
- Earlier declarations remain visible in reverse chronological order; the
  declaration with the latest effective date is current.
- The current history row labels its date as `Since`; earlier rows use `From`.
- The current-level summary and current history row share the heading pattern
  `Level <level>` plus a `Current` badge and a `Since` date. A0 uses the full
  heading `Level A0 - Absolute zero`.
- The current-level summary has no circular level badge or transition arrow. It
  uses a large, non-interactive current-level code in the green side of the
  background as a decorative element; the accessible heading remains the source
  of the level name. The decorative code is hidden when the viewport has no
  clear space for it.
- The CEFR screen uses the title `Your language level` and the subtitle `Track
your progress and get approximate forecasts for reaching the next CEFR
level.` It does not show a separate eyebrow label above the title.
- A0 history cards use the full label `Level A0 - Absolute zero`.
- The current-level summary does not duplicate an edit action. Users add a new
  declaration through `Add level update` or edit an existing declaration from
  `Level history`.
- Each board has at most one declaration per effective date. Creating or editing
  a declaration onto an occupied date is rejected with an actionable error; the
  existing event is never silently replaced.
- Chronologically adjacent declarations cannot use the same level. Returning to
  a previously declared level after an intervening different level is allowed,
  for example `B1 → B2 → B1`.
- The user may edit a declaration's level or effective date and may delete any
  declaration after explicit confirmation. Deleting the current declaration
  makes the preceding declaration current; deleting the final declaration
  returns the board to the no-level state.
- The system never infers or promotes the level from hours or vocabulary.
- Every A0–C2 level has a three-sentence product-authored description whose
  first sentence explicitly names the level. A1–C2 descriptions are based on
  sourced CEFR can-do descriptors. A0 describes an absolute beginner and
  explicitly discloses its non-official status.

### 10.7 Approximate Study Time reference model

Study Time guidance is immutable, versioned application reference data. The
first approved model uses these transition values:

| Transition | Indicative range | Calculation difference |
| ---------- | ---------------: | ---------------------: |
| A0 → A1    |     80–120 hours |              100 hours |
| A1 → A2    |     90–140 hours |              110 hours |
| A2 → B1    |    140–200 hours |              170 hours |
| B1 → B2    |    160–240 hours |              200 hours |
| B2 → C1    |    200–300 hours |              250 hours |
| C1 → C2    |    280–450 hours |              350 hours |

For a current declaration below C2:

1. Required minutes equal the approved calculation difference for the transition.
2. Eligible Study Time equals the board total from the current declaration's
   effective date through browser-local today.
3. Remaining minutes equal required minutes minus eligible minutes, with a zero
   floor.
4. The current level baseline equals the sum of approved transition differences
   from A0 through that level. Estimated total learning time equals that baseline
   plus eligible Study Time.
5. Seven-day pace equals the total over today and the previous six calendar
   dates divided by seven. Thirty-day pace equals the total over today and the
   previous 29 calendar dates divided by 30. Both include zero-study dates and
   exclude future entries.
6. For each positive pace, the forecast date is today plus the ceiling of
   remaining minutes divided by average minutes per calendar day.

The primary progress visualization keeps these values in one reading flow:
current-level baseline on the left, eligible recorded progress and its estimated
total in the center, and the next-level cumulative reference on the right. The
line below the progress bar shows the completed percentage and absolute
remainder. The raw transition-interval size is calculation detail and is not
shown in the primary UI. The same presentation applies to Study Time and
Vocabulary.

Each available forecast displays the approximate calendar duration in years,
months, and days and the estimated month and year. Compact summaries may omit
days but must retain an approximation label and the period used. A zero pace
produces no estimate for that period. C2 has no next-level forecast. Reaching a
zero remaining value prompts reassessment but never changes the declared level.
The comparison table labels an unavailable average as `No data`; dependent
forecast values use `Not available`.
C2 total displays use a strict greater-than sign rather than an approximation
sign because the highest level has no modeled upper bound.
The pace comparison explicitly states that both averages cover calendar days,
including dates with no recorded sessions or words. It presents the latest
seven- and thirty-day values as columns and uses rows for average pace,
next-level duration, and estimated month/year. Its heading names the next level
as the forecast destination.

Every Study Time result includes this disclosure:

> Reference ranges and values used for calculations: A0 to A1: 80–120 hours
> (calculation value: 100 hours); A1 to A2: 90–140 hours (110 hours); A2 to B1:
> 140–200 hours (170 hours); B1 to B2: 160–240 hours (200 hours); B2 to C1:
> 200–300 hours (250 hours); C1 to C2: 280–450 hours (350 hours). These figures
> are based on averaged data from Cambridge English, the Goethe-Institut, and
> European language institutes. They are approximate guides, not guaranteed
> timeframes.

### 10.8 Approximate Vocabulary reference model

Vocabulary guidance is a separate immutable, versioned reference model:

| Level | Indicative cumulative vocabulary |  Calculation midpoint |
| ----- | -------------------------------: | --------------------: |
| A0    |                          0 words |                     0 |
| A1    |                  700–1,200 words |                   900 |
| A2    |                1,200–2,000 words |                 1,600 |
| B1    |                2,000–3,000 words |                 2,500 |
| B2    |                3,000–4,500 words |                 3,700 |
| C1    |                4,000–6,000 words |                 5,000 |
| C2    |               5,000–8,000+ words | 7,000; no upper bound |

For a current declaration below C2:

1. Required words equal the next level's midpoint minus the current level's
   midpoint.
2. Eligible words equal non-future Vocabulary totals from the current
   declaration's effective date through today.
3. Remaining words equal required words minus eligible words, with a zero
   floor.
4. Estimated vocabulary size equals the current level midpoint plus eligible
   words.
5. Seven-day and thirty-day paces use the same zero-inclusive calendar windows
   as Study Time and produce independent forecast dates when positive.

All user-facing Vocabulary copy uses `words`, including tracker entries,
heatmaps, primary statistics, CEFR reference intervals, estimated vocabulary
size, and remaining targets. The methodology explains that recorded words are
an approximate progress signal; individual words are not stored and the product
cannot deduplicate repeated vocabulary.

Every Vocabulary result includes this disclosure:

> Reference ranges and values used for calculations: A1: 700–1,200 words
> (calculation value: 900 words); A2: 1,200–2,000 words (1,600 words); B1:
> 2,000–3,000 words (2,500 words); B2: 3,000–4,500 words (3,700 words); C1:
> 4,000–6,000 words (5,000 words); C2: 5,000–8,000+ words (7,000 words). These
> ranges are based on vocabulary research by Milton and by Finlayson, Marsden,
> and Hawkes. They are not official CEFR standards.

Both forecast models are guidance rather than assessment or guarantee. Language,
learning background, intensity, exposure, age, retention, and other factors can
materially change progress. CEFR descriptions are based on the
[Council of Europe CEFR levels](https://www.coe.int/en/web/common-european-framework-reference-languages/level-%20descriptions).

## 11. Responsive UI

- The interface is responsive on desktop and mobile.
- MVP UI copy is English only.
- MVP uses a light theme only.
- The primary board screen contains board selection, year navigation, heatmap, summary metrics, the selected day's entries, and an entry form.
- The primary board screen provides `Study Time` and `Vocabulary` tabs and places year navigation near the top without avoidable empty space.
- The `Study Time` tab uses a clock icon and the `Vocabulary` tab uses an open-book icon. Activating `Study Time` returns to the primary Study Time board view, so the header does not include a separate Home icon.
- During Phases 1 and 2, `Vocabulary` is visible but disabled with `Coming soon`; it becomes interactive only when Phase 3 is complete.
- Mobile keeps `Study Time`, disabled `Vocabulary — Coming soon`, and
  `Statistics` visible in a dedicated primary-navigation row. `Statistics`
  remains interactive and `Sign out` remains available without opening
  Settings.
- At 1366×768 CSS pixels and 100% browser zoom, navigation, year, heatmap, primary summary, selected-day heading, and either the first entry or `Add study session` are visible without page scrolling. The fully expanded form may require scrolling.
- The Study Time summary prioritizes selected-year total, selected-year active days, current streak with a flame treatment, and current CEFR/next-level forecast. `Top activity` is excluded from the main screen and may live only in detailed statistics.
- When the current CEFR level appears in the primary summary, its value uses a circular badge rather than a pill or oval.
- On mobile, the CEFR summary uses a compact layout: the first line shows the
  current circular level badge, a directional arrow, and the next level (for
  example, `B1 → B2`); supporting copy shows the tracker-appropriate forecast
  and its seven- or thirty-day pace period. Desktop may show both pace periods
  and more methodology detail.
- Phase 1 screenshot reviews may use an isolated test-user fixture reading `Current level: B1` and `Estimated B2: in about 6 months at this pace`. This fixture must never be presented as real data to a production user and is replaced by the Phase 4 calculation.
- The statistics destination uses an explicit `Statistics` label or an icon-and-label treatment rather than an unexplained small icon.
- A board-scoped CEFR management screen is reachable from Study Time,
  Vocabulary, Statistics, and Settings. Settings also manages boards and the
  global activity catalog.
- Destructive actions use clear labels and confirmation where historical data would become hidden.
- Signing out always requires explicit confirmation; cancellation preserves the
  current authenticated screen.

## 12. Validation and errors

- Validation runs at the UI boundary and again at the trusted server/database boundary.
- Whitespace-only names are rejected after normalization.
- Duplicate active names are compared case-insensitively after trimming.
- Invalid, expired, or reused authentication links show a recoverable error state.
- Failed saves preserve user input and show actionable feedback.
- Repeated submissions must not silently create unintended duplicate entries.
- Batch creation either creates every target entry or none and is idempotent for one operation identifier.
- Forecast errors or unavailable inputs produce an honest unavailable state rather than an invented value.

## 13. Capacity and performance assumptions

- Expected registered users: up to 100.
- A user may accumulate multiple entries per day over many years.
- Database aggregation with appropriate indexes is sufficient for MVP.
- Persisted aggregate tables, background queues, and a separate cache are unnecessary unless measurements later demonstrate a need.

## 14. Acceptance summary

The expanded phased MVP is acceptable when an authenticated user can manage up to six private boards and 30 global activities; record exact minutes on one date or an approved date range; maintain one daily vocabulary total; retain study, vocabulary, activity, board, and CEFR history safely; use both yearly heatmaps; and review correct, transparent board-specific statistics and forecasts on desktop and mobile without accessing another user's data.
