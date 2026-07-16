# Functional Requirements

## 1. Purpose

This document defines externally observable MVP behavior. Requirements are grouped by capability, use stable IDs, and include acceptance criteria that can be verified manually or through automated tests.

All requirements are **Must / Approved** unless another priority or status is shown.

## 2. Authentication and session management

| ID            | Requirement                                                                                                                | Acceptance criteria                                                                                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `FR-AUTH-001` | The system shall allow a visitor to register with an email address and password.                                           | Valid input creates an authentication account and begins the configured email-confirmation flow; invalid input returns field-level feedback without creating an account. |
| `FR-AUTH-002` | The system shall require email confirmation before normal authenticated use.                                               | A valid confirmation link establishes a usable confirmed account; an invalid or expired link displays a recoverable error state.                                         |
| `FR-AUTH-003` | The system shall allow a confirmed user to sign in with email and password.                                                | Valid credentials create an authenticated session and lead to the user's application; invalid credentials do not create a session and show a non-sensitive error.        |
| `FR-AUTH-004` | The system shall allow an authenticated user to sign out.                                                                  | The session is invalidated and protected pages become inaccessible without signing in again.                                                                             |
| `FR-AUTH-005` | The system shall allow a visitor to request password recovery by email.                                                    | A syntactically valid request produces a neutral confirmation response and triggers Supabase recovery handling when the account exists.                                  |
| `FR-AUTH-006` | The system shall allow a user with a valid recovery session to set a new password.                                         | A valid new password replaces the old password; an invalid or expired recovery session does not update it and displays recovery guidance.                                |
| `FR-AUTH-007` | The system shall protect all product routes and mutations from unauthenticated access.                                     | Direct navigation or mutation without verified authentication is rejected or redirected to sign-in.                                                                      |
| `FR-AUTH-008` | The system shall initialize the user's application profile and seven persisted standard activities after account creation. | A successfully initialized user has one profile and the activities Reading, Podcast, Speaking, Writing, Anki, Grammar, and TV Show / Film exactly once.                  |

## 3. Language boards

| ID             | Requirement                                                                               | Acceptance criteria                                                                                                          |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `FR-BOARD-001` | The system shall display the authenticated user's active language boards.                 | Only active boards owned by the user appear; another user's boards never appear.                                             |
| `FR-BOARD-002` | The system shall allow a user to create a language board with a valid name.               | A trimmed unique name of 1–50 characters creates an active board and makes it selectable.                                    |
| `FR-BOARD-003` | The system shall enforce a maximum of six active boards per user.                         | Creation or restoration of a seventh active board is rejected with actionable feedback, including under concurrent requests. |
| `FR-BOARD-004` | The system shall allow the user to select an active board.                                | Selection updates the heatmap, entries, and statistics so that they contain only that board's data.                          |
| `FR-BOARD-005` | The system shall allow the user to rename an active board.                                | A valid unique name is shown in subsequent views; a duplicate normalized name is rejected.                                   |
| `FR-BOARD-006` | The system shall allow the user to reorder active boards.                                 | The saved order is reproduced after a new session or page load.                                                              |
| `FR-BOARD-007` | The system shall require explicit confirmation before archiving a board that has entries. | Cancelling keeps the board active; confirming archives it without deleting its entries.                                      |
| `FR-BOARD-008` | The system shall exclude archived boards from the normal active-board UI and statistics.  | An archived board cannot be selected for new entries and does not appear in the active board switcher.                       |

## 4. Global activity catalog

| ID           | Requirement                                                                                   | Acceptance criteria                                                                                                          |
| ------------ | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `FR-ACT-001` | The system shall expose the user's active activities on every active board.                   | A custom activity created from one board can be selected when adding an entry on another board owned by the same user.       |
| `FR-ACT-002` | The system shall allow the user to create a named custom activity.                            | A trimmed unique name of 1–50 characters creates an active activity and makes it selectable across boards.                   |
| `FR-ACT-003` | The `Other` action shall use the same named custom-activity creation flow.                    | The user must provide a non-empty name; no entry can be saved against an unnamed generic `Other` value.                      |
| `FR-ACT-004` | The system shall restore an archived activity when the user creates the same normalized name. | The existing activity identity becomes active instead of creating a duplicate, and its earlier statistics remain linked.     |
| `FR-ACT-005` | The system shall allow the user to rename an active activity.                                 | Historical entries and breakdowns display the new activity name because they retain the same activity identity.              |
| `FR-ACT-006` | The system shall allow the user to archive an activity.                                       | The activity disappears from new-entry choices but existing entries remain readable and included in statistics.              |
| `FR-ACT-007` | The system shall enforce a maximum of 30 active persisted activities per user.                | Creation or restoration of a 31st active activity is rejected with actionable feedback, including under concurrent requests. |
| `FR-ACT-008` | The system shall compare active activity names case-insensitively after trimming.             | Names such as `Reading`, `reading`, and `READING` cannot coexist as separate active activities.                              |

## 5. Study entries

| ID             | Requirement                                                                                         | Acceptance criteria                                                                                                        |
| -------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `FR-ENTRY-001` | The system shall allow selection of any valid past, current, or future calendar date.               | A date can be selected regardless of whether it is before, equal to, or after the browser-local current date.              |
| `FR-ENTRY-002` | The system shall display all entries for the selected board and date.                               | The day view contains every matching owned entry and no entry from another board, date, or user.                           |
| `FR-ENTRY-003` | The system shall create one study entry per successful single-day save operation.                   | One single-day submission creates exactly one entry with the selected board, date, activity, exact duration, and optional comment. |
| `FR-ENTRY-004` | The system shall provide quick duration choices of 10, 15, 20, 30, 45, 60, 90, and 120 minutes.     | Selecting a quick value saves that exact integer number of minutes.                                                        |
| `FR-ENTRY-005` | The system shall allow a custom integer duration from 1 through 1,440 minutes.                      | Values inside the range can be saved; zero, negative, fractional, non-numeric, and greater-than-1,440 values are rejected. |
| `FR-ENTRY-006` | The system shall allow an optional normalized comment of at most 150 characters.                    | An empty comment is stored as absent; a comment longer than 150 characters cannot be saved.                                |
| `FR-ENTRY-007` | The system shall allow the user to edit an owned entry.                                             | Valid changes update the entry and all derived day totals, heatmap values, and statistics.                                 |
| `FR-ENTRY-008` | The system shall allow the user to delete an owned entry.                                           | The entry is removed and no longer contributes to any aggregate.                                                           |
| `FR-ENTRY-009` | The system shall allow any number of entries on one board and date.                                 | Saving a new entry does not replace existing entries for the same date.                                                    |
| `FR-ENTRY-010` | The system shall prevent new entries from referencing an archived board or activity.                | A forged or stale request using an archived resource is rejected at a trusted boundary.                                    |
| `FR-ENTRY-011` | The system shall preserve form input when an expected save error occurs.                            | The user can correct the rejected field without re-entering unrelated valid values.                                        |
| `FR-ENTRY-012` | The system shall prevent unintended duplicate creation from repeated submission of one user action. | Double activation or request retry does not silently create multiple identical entries for the same submission intent.     |
| `FR-ENTRY-013` | An empty selected day shall initially present `Add study session` instead of the expanded form.      | Selecting an empty past, current, or future date shows the action; activating it reveals duration, activity, `Other`, `Save`, and `Cancel` controls. |
| `FR-ENTRY-014` | The create form shall keep `Save` disabled until a valid duration and active activity are selected.  | Selecting only one required value does not enable `Save`; selecting both valid values does.                                |
| `FR-ENTRY-015` | An entry card shall show duration, activity, and language-board name with edit and delete controls.  | Controls appear on pointer hover and keyboard focus and remain discoverable on touch; the information remains readable without interaction. |
| `FR-ENTRY-016` | Editing shall expose the current duration and activity with `Update` and `Cancel` actions.           | `Update` saves valid changes; `Cancel` restores the read-only card without changing the entry.                              |
| `FR-ENTRY-017` | Deleting a study entry shall require explicit confirmation.                                          | Cancelling preserves the entry; confirming deletes only that owned entry and refreshes derived data.                       |
| `FR-ENTRY-018` | The system shall create the same study entry across an inclusive date range.                          | The user selects one board, activity, duration, optional shared comment, start date, and end date; confirmation creates one entry per date. |
| `FR-ENTRY-019` | A batch range shall contain at most 366 dates and stay within one calendar year.                      | A reversed range, a cross-year range, or a range longer than 366 inclusive dates is rejected before any entry is created. |
| `FR-ENTRY-020` | Batch creation shall preserve existing entries and create independent new entries.                   | A matching entry already on a target date is not replaced, merged, or skipped; the new batch entry is added beside it.     |
| `FR-ENTRY-021` | A batch submission shall be atomic and idempotent for one submission intent.                         | Either every date is created or none is; retrying the same operation identifier does not create the batch twice.           |
| `FR-ENTRY-022` | The system shall summarize a batch before final confirmation.                                         | The confirmation identifies activity, duration, inclusive dates, number of entries, and that existing entries will remain. |

## 6. Yearly heatmap

| ID            | Requirement                                                                                     | Acceptance criteria                                                                                             |
| ------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `FR-HEAT-001` | The system shall display a contribution-style calendar for one selected board and year.         | Every date in the selected year has one cell arranged by weeks and weekdays.                                    |
| `FR-HEAT-002` | The system shall allow navigation to earlier and later years.                                   | Changing the year updates the grid and totals without changing the selected board.                              |
| `FR-HEAT-003` | The system shall calculate each cell from the sum of all entry minutes for that board and date. | Multiple entries on one date produce one daily total; entries from other boards do not contribute.              |
| `FR-HEAT-004` | The system shall map daily totals to fixed intensity levels.                                    | The mapping is: `0`, `1–14`, `15–29`, `30–59`, `60–119`, `120–180`, and `181+` minutes.                         |
| `FR-HEAT-005` | The system shall include future-dated entries in their selected-year heatmap cells immediately. | A future entry changes its future cell without changing current streaks or averages.                            |
| `FR-HEAT-006` | The system shall allow the user to select a heatmap cell.                                       | Selection opens or updates the day view for that exact date.                                                    |
| `FR-HEAT-007` | The system shall expose date and minute information without relying on color alone.             | Each interactive cell has an accessible label and a visible tooltip or equivalent detail.                       |
| `FR-HEAT-008` | The heatmap shall remain operable on narrow mobile screens.                                     | Cells retain a usable size and the yearly grid can scroll horizontally without breaking the surrounding layout. |
| `FR-HEAT-009` | The Study Time heatmap shall distinguish empty dates by their relationship to today.            | A past date with zero minutes is red; today and future dates with zero minutes remain white.                     |
| `FR-HEAT-010` | Positive Study Time levels shall use fixed yellow and green semantic families.                  | `1–14`, `15–29`, and `30–59` use progressively stronger yellow-family colors; `60–119`, `120–180`, and `181+` use progressively darker greens. |

## 7. Vocabulary tracking

| ID             | Requirement                                                                                               | Acceptance criteria                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `FR-VOCAB-001` | The primary board experience shall provide `Study Time` and `Vocabulary` tracker tabs.                    | Switching tabs keeps the selected board and year while changing the heatmap, selected-day editor, and summary to that tracker.   |
| `FR-VOCAB-002` | The system shall display one vocabulary value for the selected board and date.                            | A date has either no vocabulary record or one owned positive-integer total; values from other boards or users never appear.       |
| `FR-VOCAB-003` | The system shall allow the user to set the final number of newly learned words for a selected date.       | A positive integer creates the daily value for a past, current, or future date; a second create is handled as an edit, not a duplicate row. |
| `FR-VOCAB-004` | The system shall allow the user to edit an existing daily vocabulary total.                               | Saving a valid replacement updates the same board/date record and all derived vocabulary views.                                  |
| `FR-VOCAB-005` | The system shall allow the user to delete an existing daily vocabulary total after confirmation.         | Cancelling preserves it; confirming removes the record and its contribution to the heatmap and statistics.                       |
| `FR-VOCAB-006` | The system shall display a yearly Vocabulary heatmap for the selected board and year.                     | Every date has one cell whose value is the daily vocabulary total, and year navigation behaves independently of stored data.      |
| `FR-VOCAB-007` | The Vocabulary heatmap shall use fixed green intensity levels.                                            | The mapping is `0`, `1–2`, `3–5`, `6–9`, `10–14`, `15–19`, `20–39`, and `40+` words.                                               |
| `FR-VOCAB-008` | The system shall display selected-year vocabulary total and vocabulary active-day count.                 | Future values count in the selected-year total; active days no later than today contain at least one word.                        |
| `FR-VOCAB-009` | The system shall calculate current and longest vocabulary streaks.                                       | A vocabulary active day contains at least one word; the same today/yesterday and future-exclusion rules as Study Time apply.      |
| `FR-VOCAB-010` | The system shall expose vocabulary dates and counts without relying on color alone.                       | Every cell has an accessible date/count label, visible focus, and equivalent detail on pointer and keyboard interaction.          |
| `FR-VOCAB-011` | Vocabulary statistics shall update after create, edit, or delete.                                        | The next consistent view reflects the single source daily record without a separate manual aggregate update.                     |

## 8. CEFR history and forecast

| ID            | Requirement                                                                                                              | Acceptance criteria                                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `FR-CEFR-001` | The system shall allow the user to declare A1, A2, B1, B2, C1, or C2 for one language board.                             | A valid manual declaration is stored only for the selected owned board; no study or vocabulary data changes the level automatically. |
| `FR-CEFR-002` | A CEFR declaration shall contain an effective date no later than browser-local today and an optional comment.           | Past and current dates can be saved; a future effective date or comment longer than 150 normalized characters is rejected.   |
| `FR-CEFR-003` | The system shall retain and display the board's CEFR declaration history.                                                | Earlier declarations remain visible in effective-date order after a later level is added; the latest effective one is current. |
| `FR-CEFR-004` | The system shall provide a concise description for each CEFR level.                                                      | The selected and next levels display product-authored summaries based on CEFR can-do descriptors with source attribution.    |
| `FR-CEFR-005` | The system shall calculate approximate remaining study hours to the next level from a fixed Cambridge-based model.      | It uses the fixed reference target difference and subtracts eligible logged minutes since the current level's effective date, never below zero. |
| `FR-CEFR-006` | The system shall calculate a seven-calendar-day study pace.                                                              | The pace sums Study Time entries from today minus six days through today, excludes future entries, includes zero-study dates, and divides by seven. |
| `FR-CEFR-007` | The system shall estimate a next-level date when the seven-day pace is positive and the current level is below C2.      | The date is today plus the ceiling of remaining minutes divided by average minutes per calendar day.                          |
| `FR-CEFR-008` | The system shall handle unavailable or completed forecasts honestly.                                                     | Zero pace shows no date; C2 shows no next level; reaching estimated hours prompts reassessment but does not change the level. |
| `FR-CEFR-009` | Every forecast shall disclose that Cambridge guided-learning-hour values are approximate and applied across languages. | The warning is visible with the result and explains that background, exposure, language, intensity, and other factors affect progress. |

## 9. Statistics

| ID            | Requirement                                                                                                | Acceptance criteria                                                                                                               |
| ------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `FR-STAT-001` | The system shall scope every statistic to the selected board.                                              | No aggregate includes entries from another board or user.                                                                         |
| `FR-STAT-002` | The system shall display total minutes for the selected year.                                              | The total includes all entries dated within that year, including future dates.                                                    |
| `FR-STAT-003` | The system shall display totals for the browser-local current day, Monday–Sunday week, and calendar month. | Each total includes only dates in its current period and not after today.                                                         |
| `FR-STAT-004` | The system shall display total minutes grouped by activity.                                                | Active and archived activities with matching historical entries appear with correct totals.                                       |
| `FR-STAT-005` | The system shall display the number of non-future active days.                                             | A date is counted once when its board total is greater than zero; future dates are excluded until they arrive.                    |
| `FR-STAT-006` | The system shall calculate average minutes per calendar day.                                               | Current year uses January 1 through today inclusive; a completed year uses 365 or 366; zero denominator displays zero.            |
| `FR-STAT-007` | The system shall calculate average minutes per active day.                                                 | Non-future total is divided by non-future active-day count; zero active days displays zero.                                       |
| `FR-STAT-008` | The system shall calculate the current streak.                                                             | Only dates through today count; the result remains active when the latest active day is today or yesterday, otherwise it is zero. |
| `FR-STAT-009` | The system shall calculate the longest streak.                                                             | The result is the maximum consecutive sequence of active dates no later than today.                                               |
| `FR-STAT-010` | The system shall display time distribution by day, week, month, and year.                                  | Day shows a selected month, week and month show a selected year, and year shows complete board history; weeks begin Monday.       |
| `FR-STAT-011` | The system shall update derived statistics after entry creation, edit, or deletion.                        | The next consistent view reflects the mutation without manual data repair or a separate aggregation write.                        |
| `FR-STAT-012` | The statistics view shall display actual time by activity for the latest seven calendar dates ending today. | Each owned activity's minutes are aggregated for today and the previous six dates, including zero-study dates and excluding future entries. |
| `FR-STAT-013` | The statistics view shall combine Study Time, Vocabulary, and CEFR information for the selected board.      | The user can distinguish the source, unit, period, and calculation method of every graph and metric.                              |
| `FR-STAT-014` | The main Study Time summary shall prioritize selected-year total, selected-year active days, current streak, and CEFR forecast. | The cards remain board-scoped; `Top activity` may move to detailed statistics rather than occupy the primary summary.              |

## 10. Cross-cutting interface behavior

| ID          | Requirement                                                                                                                                        | Acceptance criteria                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `FR-UI-001` | The MVP shall present English UI copy in a light theme.                                                                                            | No theme or language selector is displayed in MVP.                                                               |
| `FR-UI-002` | The primary application screen shall provide board selection, year navigation, heatmap, summary metrics, selected-day entries, and entry creation. | An authenticated user can complete the core logging loop from the primary board experience.                      |
| `FR-UI-003` | Settings shall provide board and global activity-catalog management.                                                                               | The user can reach the in-scope board and activity operations from a clearly identified settings control.        |
| `FR-UI-004` | Destructive or history-hiding actions shall use clear confirmation where required.                                                                 | A populated-board archival cannot complete from an accidental single activation.                                 |
| `FR-UI-005` | Expected empty, loading, success, and error states shall be understandable and actionable.                                                         | The interface does not present a blank or misleading successful state when data is absent, loading, or rejected. |
| `FR-UI-006` | Interactive controls shall support keyboard operation and visible focus.                                                                           | Primary navigation, heatmap dates, forms, dialogs, and settings can be operated without a pointer.               |
| `FR-UI-007` | Year navigation shall be positioned close to the top of the board content without avoidable empty vertical space.                                  | The year and arrows remain clear and reachable while leaving enough room for the heatmap and selected-day content. |
| `FR-UI-008` | At 1366×768 and 100% browser zoom, the primary Study Time view shall expose the core daily action without page scrolling.                           | Navigation, year, heatmap, primary summary, selected-day heading, and either the first entry or `Add study session` are visible. |
| `FR-UI-009` | The statistics destination shall use a text label or an icon-and-label treatment rather than an unexplained small icon alone.                      | A new user can identify and activate `Statistics` without relying on tooltip discovery.                         |
| `FR-UI-010` | Pointer-hover actions shall have equivalent keyboard and touch access.                                                                               | Edit/delete controls are reachable through focus and a persistent or explicit touch affordance.                 |

## 11. Approved behavior with deferred reference values

The following product behaviors are approved, but implementation is blocked until the project owner supplies and approves their fixed reference values:

| ID            | Future behavior                                                                                           | Status   |
| ------------- | --------------------------------------------------------------------------------------------------------- | -------- |
| `FR-CEFR-010` | Display an immutable vocabulary-size reference for each CEFR level and relate logged new words to it.    | Deferred |
| `FR-STAT-015` | Compare actual activity allocation with an immutable ideal distribution defined for each CEFR level.     | Deferred |

Users will not edit either model. No provisional values may be silently introduced.

## 12. Deferred functions

The following functions are explicitly **Won't (MVP)**:

- all-language combined statistics;
- public profiles or social interactions;
- payments or subscriptions;
- notifications or reminders;
- administration UI;
- import or export;
- editable duration presets;
- theme switching;
- UI localization;
- offline mode;
- native mobile applications.
