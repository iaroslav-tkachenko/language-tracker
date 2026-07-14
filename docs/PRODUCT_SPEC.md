# Product Specification

## 1. Product overview

Language Learning Time Tracker is a responsive web application for recording time spent learning foreign languages. A user creates separate language boards, records study entries on calendar dates, and reviews a yearly contribution-style heatmap and statistics for each board.

The MVP is private and single-user in nature: it has no social graph, public data, administration interface, payments, notifications, offline mode, or native mobile application.

## 2. Goals

- Make daily study logging fast on desktop and mobile.
- Preserve an accurate, editable history of exact study minutes.
- Provide a motivating yearly visual history and study streak.
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
- an optional comment;
- creation and update timestamps.

### 7.2 Entry rules

- A date can contain any number of entries.
- The entry form creates one entry per save operation.
- Users can create entries for past, current, and future dates.
- Users can edit and delete individual entries.
- Deleting an entry removes its minutes from every derived heatmap and statistic.
- Duration is an integer from 1 through 1,440 minutes.
- A normalized comment is at most 150 characters.
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
- Past, current, and future entries are shown immediately in the selected year's heatmap.
- Selecting a cell opens the corresponding day and its entries.
- The layout is contribution-graph-like, with weekdays in rows and weeks in columns.

### 9.2 Fixed intensity levels

| Daily total | Level |
| --- | ---: |
| 0 minutes | 0 |
| 1–14 minutes | 1 |
| 15–29 minutes | 2 |
| 30–59 minutes | 3 |
| 60–119 minutes | 4 |
| 120–180 minutes | 5 |
| 181+ minutes | 6 |

The highest legend label is `3+ hours`, following the approved product wording. The exact numeric boundary is 181 minutes.

Levels are absolute rather than relative to that year's maximum, so the same color always represents the same range.

### 9.3 Accessibility and responsive behavior

- Color is not the only source of information; each cell exposes its date and minute total to assistive technology and tooltips.
- Cells have visible keyboard focus and can be selected by keyboard.
- Mobile preserves a usable cell size and may horizontally scroll the yearly grid.

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

## 11. Responsive UI

- The interface is responsive on desktop and mobile.
- MVP UI copy is English only.
- MVP uses a light theme only.
- The primary board screen contains board selection, year navigation, heatmap, summary metrics, the selected day's entries, and an entry form.
- A settings area manages boards and the global activity catalog.
- Destructive actions use clear labels and confirmation where historical data would become hidden.

## 12. Validation and errors

- Validation runs at the UI boundary and again at the trusted server/database boundary.
- Whitespace-only names and comments are rejected or normalized to empty values as appropriate.
- Duplicate active names are compared case-insensitively after trimming.
- Invalid, expired, or reused authentication links show a recoverable error state.
- Failed saves preserve user input and show actionable feedback.
- Repeated submissions must not silently create unintended duplicate entries.

## 13. Capacity and performance assumptions

- Expected registered users: up to 100.
- A user may accumulate multiple entries per day over many years.
- Database aggregation with appropriate indexes is sufficient for MVP.
- Persisted aggregate tables, background queues, and a separate cache are unnecessary unless measurements later demonstrate a need.

## 14. Acceptance summary

The MVP is acceptable when an authenticated user can manage up to six private boards and 30 global activities, record exact minutes on any date, safely retain history through activity and board archival, use the yearly heatmap, and view correct board-specific statistics on desktop and mobile without accessing another user's data.
