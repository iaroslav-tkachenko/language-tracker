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

- A board/date has either no vocabulary record or one final positive-integer total of newly learned words.
- The record stores only a count, not individual words.
- The user can create the total for a past, current, or future date, edit it, or delete it after confirmation.
- A second save for the same board/date updates the existing daily record rather than creating another row.
- Zero is represented by no daily record.
- The Vocabulary heatmap uses a green visual scale and independent year navigation while preserving the selected board.
- Its fixed thresholds are `0`, `1–2`, `3–5`, `6–9`, `10–14`, `15–19`, `20–39`, and `40+` words.
- Each cell exposes its date and word count without requiring color perception.

Vocabulary summary statistics include selected-year word total, non-future active days, current streak, and longest streak. A vocabulary active day has at least one word. Future totals appear in the selected-year heatmap and total immediately but do not affect active-day counts or streaks until their date arrives.

## 10. Statistics

All statistics are scoped to the selected board.

### 10.1 Totals

- Total time for the selected year includes all entries in that year, including future-dated entries.
- Current-day total includes entries dated today.
- Current-week total includes non-future dates in the current Monday–Sunday week.
- Current-month total includes non-future dates in the current calendar month.
- Activity totals include active and archived activities with historical entries.

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

Statistics include a bar chart with a granularity selector:

- `Day`: daily minute totals for a selected month.
- `Week`: Monday–Sunday weekly totals for a selected year.
- `Month`: monthly totals for a selected year.
- `Year`: yearly totals across the board's complete history.

Future entries can appear in selected-year and selected-month distributions, but they remain excluded from current-period averages and streaks as specified above.

### 10.5 Recent activity analysis

Detailed statistics show actual Study Time grouped by activity across the latest seven calendar dates ending today. The window includes zero-study dates and excludes future entries. The user can distinguish activity, minutes, and period represented by the chart.

The product will later compare actual allocation with a fixed ideal distribution for each CEFR level. The model will not be user-editable, but its percentages and methodology remain deferred until separate product-owner approval and must not be implemented with provisional values.

### 10.6 CEFR declaration history

- CEFR belongs to one language board.
- The user manually declares A1, A2, B1, B2, C1, or C2 with an effective date no later than browser-local today.
- Earlier declarations remain visible; the latest effective declaration is current.
- The system never infers or promotes the level from hours or vocabulary.
- Each level has a concise product-authored description based on sourced CEFR can-do descriptors.

### 10.7 Approximate next-level forecast

The forecast uses the midpoint of Cambridge English's published cumulative guided-learning-hour ranges as a fixed reference:

| CEFR level | Published cumulative range | Reference midpoint |
| ---------- | -------------------------: | -----------------: |
| A1         |               90–100 hours |           95 hours |
| A2         |              180–200 hours |          190 hours |
| B1         |              350–400 hours |          375 hours |
| B2         |              500–600 hours |          550 hours |
| C1         |              700–800 hours |          750 hours |
| C2         |          1,000–1,200 hours |        1,100 hours |

For a current declaration below C2:

1. Reference hours to the next level equal the difference between the next and current midpoints.
2. Eligible logged Study Time is the board total from the current declaration's effective date through today.
3. Remaining minutes equal the reference difference in minutes minus eligible logged minutes, with a floor of zero.
4. Recent pace equals total eligible minutes over today and the previous six calendar dates divided by seven, including zero-study dates.
5. When pace is positive, the forecast date is today plus the ceiling of remaining minutes divided by average minutes per calendar day.

A zero pace produces no estimated date. C2 has no next level. Reaching zero remaining minutes prompts the user to reassess their level but never changes it automatically.

Every result must state that the estimate applies Cambridge English guided-learning guidance to all language boards and is not a proficiency assessment or guarantee. Learning background, language, intensity, exposure, age, and other factors can materially change progress. Reference: [Cambridge English guided learning hours](https://support.cambridgeenglish.org/hc/en-gb/articles/202838506-Guided-learning-hours). CEFR descriptions are based on the [Council of Europe CEFR levels](https://www.coe.int/en/web/common-european-framework-reference-languages/level-%20descriptions).

Vocabulary-to-CEFR word-count cutoffs will later be fixed and non-editable. Their values remain deferred and must not be shown until separately approved.

## 11. Responsive UI

- The interface is responsive on desktop and mobile.
- MVP UI copy is English only.
- MVP uses a light theme only.
- The primary board screen contains board selection, year navigation, heatmap, summary metrics, the selected day's entries, and an entry form.
- The primary board screen provides `Study Time` and `Vocabulary` tabs and places year navigation near the top without avoidable empty space.
- The `Study Time` tab uses a clock icon and the `Vocabulary` tab uses an open-book icon. Activating `Study Time` returns to the primary Study Time board view, so the header does not include a separate Home icon.
- During Phases 1 and 2, `Vocabulary` is visible but disabled with `Coming soon`; it becomes interactive only when Phase 3 is complete.
- At 1366×768 CSS pixels and 100% browser zoom, navigation, year, heatmap, primary summary, selected-day heading, and either the first entry or `Add study session` are visible without page scrolling. The fully expanded form may require scrolling.
- The Study Time summary prioritizes selected-year total, selected-year active days, current streak with a flame treatment, and current CEFR/next-level forecast. `Top activity` is excluded from the main screen and may live only in detailed statistics.
- When the current CEFR level appears in the primary summary, its value uses a circular badge rather than a pill or oval.
- On mobile, the CEFR summary uses a compact two-line layout: the first line shows the current circular level badge, a directional arrow, and the next level (for example, `B1 → B2`); the second line shows the approximate forecast (for example, `Estimated in ≈ 6 months`). Desktop may retain the more descriptive current-level and pace labels.
- Phase 1 screenshot reviews may use an isolated test-user fixture reading `Current level: B1` and `Estimated B2: in about 6 months at this pace`. This fixture must never be presented as real data to a production user and is replaced by the Phase 4 calculation.
- The statistics destination uses an explicit `Statistics` label or an icon-and-label treatment rather than an unexplained small icon.
- A settings area manages boards and the global activity catalog.
- Destructive actions use clear labels and confirmation where historical data would become hidden.

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
