# Use Cases

## 1. Purpose

This document describes the main MVP interactions from the user's point of view. It complements the atomic requirements in [Functional Requirements](FUNCTIONAL_REQUIREMENTS.md) with end-to-end flows that product, design, engineering, and QA can review together.

## 2. Actors and common conditions

### Primary actor

**Language learner** — a registered person who owns private language boards, activities, and study entries.

### Supporting systems

- **Supabase Auth** manages identity, email confirmation, sessions, and password recovery.
- **Language Tracker** validates commands, stores private data, and calculates board-scoped calendar and statistical views.

### Common guarantees

- An authenticated user can access only their own data.
- Dates are calendar dates interpreted using the browser's local date.
- All statistics and heatmaps are scoped to the selected language board.
- Validation failures preserve the user's valid input whenever practical.

## 3. Use-case overview

| ID      | Use case                        | Primary outcome                                                                   |
| ------- | ------------------------------- | --------------------------------------------------------------------------------- |
| `UC-01` | Register and confirm an account | The learner obtains a verified private account.                                   |
| `UC-02` | Sign in or recover access       | The learner establishes a valid session or resets the password.                   |
| `UC-03` | Manage language boards          | The learner creates, selects, renames, reorders, or archives a board.             |
| `UC-04` | Manage the activity catalog     | The learner maintains reusable global activity types without losing history.      |
| `UC-05` | Add a study entry               | The learner records exact study time for a selected board and date.               |
| `UC-06` | Edit or delete a study entry    | The learner corrects previously recorded data.                                    |
| `UC-07` | Explore the yearly heatmap      | The learner reviews study consistency and opens a calendar day.                   |
| `UC-08` | Review board statistics         | The learner reviews totals, averages, streaks, and distributions.                 |
| `UC-09` | Archive a populated board       | The learner removes a board from the active interface without destroying history. |

## 4. Detailed use cases

### UC-01 — Register and confirm an account

**Goal:** Create a verified account with a private starter activity catalog.

**Preconditions:** The visitor is signed out and has access to an email address not already registered.

**Trigger:** The visitor chooses to create an account.

**Main success scenario:**

1. The visitor enters an email address and a password.
2. The system validates the input and requests account creation from Supabase Auth.
3. The system instructs the visitor to confirm the email address.
4. The visitor follows the confirmation link.
5. The system verifies the callback and makes the account usable.
6. The system ensures the user's profile and seven standard activity types exist.
7. The learner signs in and reaches the application.

**Alternatives and errors:**

- Invalid input is identified next to the relevant field.
- An existing account is not disclosed in a way that enables email enumeration.
- An invalid or expired confirmation link leads to a recoverable explanatory state.

**Postconditions:** A verified account exists; all user-owned data remains private.

**Related requirements:** `FR-AUTH-001`–`FR-AUTH-003`, `FR-AUTH-006`–`FR-AUTH-008`, `NFR-SEC-001`–`NFR-SEC-007`.

### UC-02 — Sign in or recover access

**Goal:** Establish an authenticated session, or regain access after forgetting a password.

**Preconditions:** The visitor has an account.

**Trigger:** The visitor opens sign-in or password recovery.

**Main success scenario — sign-in:**

1. The visitor submits an email address and password.
2. The system authenticates the credentials.
3. The system establishes a secure session and opens the learner's application.
4. The learner can sign out, after which protected pages and mutations are inaccessible.

**Recovery scenario:**

1. The visitor requests password recovery using an email address.
2. The system displays a neutral result regardless of whether the address exists.
3. The learner follows a valid recovery link and submits a new password.
4. The system updates the password and allows a new sign-in.

**Postconditions:** The learner has a valid session, or a reset password; no account existence information is leaked.

**Related requirements:** `FR-AUTH-004`–`FR-AUTH-007`, `NFR-SEC-004`–`NFR-SEC-007`.

### UC-03 — Manage language boards

**Goal:** Organize study entries into separate language-specific boards.

**Preconditions:** The learner is authenticated.

**Trigger:** The learner opens the board selector or board settings.

**Main success scenario:**

1. The learner reviews their active boards.
2. The learner creates a board with a unique name of 1–50 trimmed characters.
3. The system enforces the limit of six active boards even under concurrent requests.
4. The learner selects the board.
5. The heatmap, day entries, and statistics update to that board only.
6. The learner may rename or reorder active boards.

**Alternatives and errors:**

- Blank, overlong, or case-insensitively duplicate names are rejected.
- When six active boards already exist, creation is rejected with a clear explanation.
- Archiving a populated board follows `UC-09`.

**Postconditions:** Board changes persist for the owner and do not affect other users.

**Related requirements:** `FR-BOARD-001`–`FR-BOARD-008`, `BR-003`, `BR-004`.

### UC-04 — Manage the activity catalog

**Goal:** Maintain activity types that are reusable on every language board.

**Preconditions:** The learner is authenticated.

**Trigger:** The learner opens activity settings or chooses `Other` while adding an entry.

**Main success scenario:**

1. The learner sees one global catalog containing active standard and custom activities.
2. The learner creates a custom activity with a unique name of 1–50 trimmed characters.
3. The system makes the activity available on every active board.
4. The learner may rename the activity; its current name is used in historical views.
5. The learner may archive the activity; it disappears from new-entry choices while historical entries and statistics remain intact.

**Restoration scenario:**

1. The learner creates an activity whose case-insensitive normalized name matches an archived activity.
2. The system restores that existing activity identity instead of creating a duplicate.
3. Old and new entries contribute to the same activity statistics.

**Alternatives and errors:**

- Choosing `Other` requires a real custom name; an unnamed generic `Other` is never saved.
- Blank, overlong, or duplicate active names are rejected.
- When 30 activities are active, creation or restoration is rejected clearly.

**Postconditions:** The catalog is updated globally for the user without breaking historical data.

**Related requirements:** `FR-ACT-001`–`FR-ACT-008`, `BR-005`, `BR-006`.

### UC-05 — Add a study entry

**Goal:** Record one exact period of study against a board, date, and activity.

**Preconditions:** The learner is authenticated; an active board and activity exist.

**Trigger:** The learner selects a heatmap day or opens the entry form for a date.

**Main success scenario:**

1. The system displays the selected board and calendar date.
2. The learner selects one active activity type.
3. The learner selects a quick duration of 10, 15, 20, 30, 45, 60, 90, or 120 minutes, or enters a custom integer duration.
4. The learner optionally enters a comment of up to 150 normalized characters.
5. The learner saves the entry.
6. The system validates ownership and all values, then stores exactly one entry.
7. The day list, heatmap intensity, and affected statistics refresh.

**Alternatives and errors:**

- The date may be in the past, present, or future.
- Duration outside 1–1,440 minutes or a non-integer value is rejected.
- A missing activity, invalid comment, archived reference, or ownership mismatch is rejected.
- A repeated click or retried request must not unintentionally create duplicate entries.
- Multiple intentional entries may be added to the same date by repeating the flow.

**Postconditions:** One valid study entry exists and remains visible only to its owner.

**Related requirements:** `FR-ENTRY-001`–`FR-ENTRY-012`, `FR-HEAT-003`–`FR-HEAT-006`, `FR-STAT-011`.

### UC-06 — Edit or delete a study entry

**Goal:** Correct or remove a previously saved record.

**Preconditions:** The learner is authenticated and owns the selected entry.

**Trigger:** The learner chooses edit or delete from a day's entry list.

**Main success scenario — edit:**

1. The system loads the entry's current date, activity, duration, and comment.
2. The learner changes one or more values.
3. The system validates ownership and the updated values.
4. The system saves the changes atomically.
5. The affected day lists, heatmaps, and statistics refresh.

**Delete scenario:**

1. The learner requests deletion.
2. The system requires confirmation where the interface could otherwise cause accidental loss.
3. The system deletes only the owned entry.
4. Derived views refresh.

**Alternatives and errors:** Invalid input or an unauthorized/stale entry produces a safe error and no partial update.

**Postconditions:** The entry is updated or removed; aggregate views reflect the stored data.

**Related requirements:** `FR-ENTRY-007`–`FR-ENTRY-012`, `FR-STAT-011`, `NFR-REL-001`, `NFR-REL-002`.

### UC-07 — Explore the yearly heatmap

**Goal:** Understand study consistency across a selected calendar year and open individual days.

**Preconditions:** The learner is authenticated and has selected a board.

**Trigger:** The learner opens the main board view or changes year.

**Main success scenario:**

1. The system displays a Monday-based yearly grid for the selected board and year.
2. Each day shows intensity based on the sum of exact minutes for that date.
3. The legend communicates the approved thresholds: 0, 1–14, 15–29, 30–59, 60–119, 120–180, and 181+ minutes.
4. Future entries appear immediately in their dates and in the selected-year total.
5. The learner moves to a previous or next year.
6. The learner selects a date to review or add entries.

**Accessibility and responsive behavior:** Intensity is available through text or an accessible name, not color alone; on narrow screens the grid scrolls horizontally inside its region without widening the page.

**Postconditions:** The selected board, year, and date are reflected consistently across the interface.

**Related requirements:** `FR-HEAT-001`–`FR-HEAT-008`, `NFR-A11Y-002`, `NFR-RESP-001`, `NFR-RESP-002`.

### UC-08 — Review board statistics

**Goal:** Understand time investment and consistency for one language board.

**Preconditions:** The learner is authenticated and has selected a board.

**Trigger:** The learner opens the statistics view or summary.

**Main success scenario:**

1. The system calculates statistics directly from owned study entries for the selected board.
2. The learner sees total time for the selected year, current month, current Monday-based week, and current day.
3. The learner sees totals by activity, including historically used archived activities.
4. The learner sees active-day count, calendar-day average, active-day average, current streak, and longest streak.
5. The learner switches distribution granularity among day, week, month, and year.
6. The interface explains the period represented by each distribution.

**Calculation rules:** Future entries count in their selected year's total and heatmap, but not in current day/week/month metrics, averages, active-day counts, or streaks until their dates arrive. A current streak remains active when the latest active date is today or yesterday.

**Postconditions:** All displayed metrics use the same board scope and approved date rules.

**Related requirements:** `FR-STAT-001`–`FR-STAT-011`, `BR-010`.

### UC-09 — Archive a populated board

**Goal:** Remove an unwanted board from the active interface without destroying historical records.

**Preconditions:** The learner is authenticated and owns the board.

**Trigger:** The learner requests board deletion or archival.

**Main success scenario:**

1. The system determines whether the board contains entries.
2. For a populated board, the system displays an explicit confirmation that the board and its data will disappear from active views and statistics.
3. The learner confirms the operation.
4. The system archives the board rather than physically deleting it.
5. The board and its entries disappear from active UI and statistics.
6. Historical database records remain intact.

**Alternatives and errors:** Cancellation changes nothing; a stale or unauthorized request is rejected safely.

**Postconditions:** The board is archived and excluded from active product views, while its history remains recoverable at the data level.

**Related requirements:** `FR-BOARD-007`, `FR-BOARD-008`, `BR-004`, `NFR-DATA-004`.
