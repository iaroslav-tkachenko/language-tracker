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
| `FR-ENTRY-003` | The system shall create one study entry per successful save operation.                              | One submission creates exactly one entry with the selected board, date, activity, exact duration, and optional comment.    |
| `FR-ENTRY-004` | The system shall provide quick duration choices of 10, 15, 20, 30, 45, 60, 90, and 120 minutes.     | Selecting a quick value saves that exact integer number of minutes.                                                        |
| `FR-ENTRY-005` | The system shall allow a custom integer duration from 1 through 1,440 minutes.                      | Values inside the range can be saved; zero, negative, fractional, non-numeric, and greater-than-1,440 values are rejected. |
| `FR-ENTRY-006` | The system shall allow an optional normalized comment of at most 150 characters.                    | An empty comment is stored as absent; a comment longer than 150 characters cannot be saved.                                |
| `FR-ENTRY-007` | The system shall allow the user to edit an owned entry.                                             | Valid changes update the entry and all derived day totals, heatmap values, and statistics.                                 |
| `FR-ENTRY-008` | The system shall allow the user to delete an owned entry.                                           | The entry is removed and no longer contributes to any aggregate.                                                           |
| `FR-ENTRY-009` | The system shall allow any number of entries on one board and date.                                 | Saving a new entry does not replace existing entries for the same date.                                                    |
| `FR-ENTRY-010` | The system shall prevent new entries from referencing an archived board or activity.                | A forged or stale request using an archived resource is rejected at a trusted boundary.                                    |
| `FR-ENTRY-011` | The system shall preserve form input when an expected save error occurs.                            | The user can correct the rejected field without re-entering unrelated valid values.                                        |
| `FR-ENTRY-012` | The system shall prevent unintended duplicate creation from repeated submission of one user action. | Double activation or request retry does not silently create multiple identical entries for the same submission intent.     |

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

## 7. Statistics

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

## 8. Cross-cutting interface behavior

| ID          | Requirement                                                                                                                                        | Acceptance criteria                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `FR-UI-001` | The MVP shall present English UI copy in a light theme.                                                                                            | No theme or language selector is displayed in MVP.                                                               |
| `FR-UI-002` | The primary application screen shall provide board selection, year navigation, heatmap, summary metrics, selected-day entries, and entry creation. | An authenticated user can complete the core logging loop from the primary board experience.                      |
| `FR-UI-003` | Settings shall provide board and global activity-catalog management.                                                                               | The user can reach the in-scope board and activity operations from a clearly identified settings control.        |
| `FR-UI-004` | Destructive or history-hiding actions shall use clear confirmation where required.                                                                 | A populated-board archival cannot complete from an accidental single activation.                                 |
| `FR-UI-005` | Expected empty, loading, success, and error states shall be understandable and actionable.                                                         | The interface does not present a blank or misleading successful state when data is absent, loading, or rejected. |
| `FR-UI-006` | Interactive controls shall support keyboard operation and visible focus.                                                                           | Primary navigation, heatmap dates, forms, dialogs, and settings can be operated without a pointer.               |

## 9. Deferred functions

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
