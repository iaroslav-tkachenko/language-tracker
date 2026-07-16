# Business Requirements

## 1. Purpose

Business requirements describe the outcomes and invariant rules the product must support. They explain **why** capabilities exist; detailed system behavior is specified in [Functional Requirements](FUNCTIONAL_REQUIREMENTS.md).

## 2. Business requirements

| ID       | Requirement                                                                                                                     | Rationale                                                                                             | Priority | Status   |
| -------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------- | -------- |
| `BR-001` | The product shall provide a private personal study record that is accessible only to its owner.                                 | Privacy is a defining product property and prevents cross-user data exposure.                         | Must     | Approved |
| `BR-002` | The product shall keep study history and statistics separate for each language board.                                           | Learners need meaningful progress for one language without contamination from another.                | Must     | Approved |
| `BR-003` | The product shall minimize repeated input when recording study time.                                                            | Fast logging increases the likelihood that the learner maintains an accurate history.                 | Must     | Approved |
| `BR-004` | The product shall preserve historical meaning when an activity is renamed, archived, or restored.                               | Catalog maintenance must not invalidate past entries or statistics.                                   | Must     | Approved |
| `BR-005` | The product shall preserve board history when a populated board is removed from active use.                                     | Destructive catalog actions must not accidentally destroy learning history.                           | Must     | Approved |
| `BR-006` | The product shall visualize yearly study consistency using stable intensity levels.                                             | A fixed scale allows visual comparison across dates and years.                                        | Must     | Approved |
| `BR-007` | The product shall provide board-specific totals, averages, active-day counts, streaks, activity totals, and time distributions. | Learners need both motivation and an understandable analysis of their study behavior.                 | Must     | Approved |
| `BR-008` | The product shall support desktop and mobile browser use.                                                                       | Study entries may be recorded in different contexts and on different devices.                         | Must     | Approved |
| `BR-009` | The product shall retain exact minute values as the source of truth for all calculations.                                       | Exact source data prevents ambiguous or inconsistent statistics.                                      | Must     | Approved |
| `BR-010` | The MVP shall remain operationally simple for an expected population of up to 100 registered users.                             | The first release should avoid infrastructure that adds cost or complexity without demonstrated need. | Must     | Approved |

## 3. Business rules

### Ownership and isolation

- `BR-RULE-001`: Every language board, activity type, and study entry has exactly one owning user.
- `BR-RULE-002`: A user cannot read, reference, mutate, or aggregate another user's data.
- `BR-RULE-003`: A study entry's board and activity must have the same owner as the entry.

### Language boards

- `BR-RULE-010`: A user may have no more than six active language boards.
- `BR-RULE-011`: Active board names are unique per user after trimming and case normalization.
- `BR-RULE-012`: A populated board is archived only after explicit user confirmation.
- `BR-RULE-013`: Archived-board entries remain stored but are excluded from the normal active-board interface and statistics.

### Activity catalog

- `BR-RULE-020`: Activities belong to the user and are available on every active board owned by that user.
- `BR-RULE-021`: A user may have no more than 30 active persisted activities.
- `BR-RULE-022`: Active activity names are unique per user after trimming and case normalization.
- `BR-RULE-023`: `Other` is a creation action, not a persisted unnamed activity.
- `BR-RULE-024`: Creating a name that matches an archived activity restores the existing activity identity.
- `BR-RULE-025`: Renaming an activity changes its label in historical views because entries retain the activity identity.
- `BR-RULE-026`: Archived activities are unavailable for new entries but remain included in historical statistics.

### Study entries

- `BR-RULE-030`: One save operation creates one study entry.
- `BR-RULE-031`: A calendar day may contain any number of study entries.
- `BR-RULE-032`: A study entry contains one board, one date, one activity, one exact duration, and an optional comment.
- `BR-RULE-033`: Duration is an integer from 1 through 1,440 minutes.
- `BR-RULE-034`: A normalized comment contains at most 150 characters.
- `BR-RULE-035`: Study dates may be in the past, present, or future.
- `BR-RULE-036`: Archived boards and activities cannot be assigned to new entries.

### Calendar and statistics

- `BR-RULE-040`: A week runs from Monday through Sunday.
- `BR-RULE-041`: The browser's local calendar date determines today and current periods.
- `BR-RULE-042`: Existing study dates never move when the device time zone changes.
- `BR-RULE-043`: An active day has a board total greater than zero minutes.
- `BR-RULE-044`: Future entries appear in their year's heatmap and selected-year total immediately.
- `BR-RULE-045`: Future entries do not affect current-period averages, active days, or streaks before their date arrives.
- `BR-RULE-046`: A current streak remains active when the latest active day is today or yesterday.
- `BR-RULE-047`: Heatmap thresholds are `0`, `1–14`, `15–29`, `30–59`, `60–119`, `120–180`, and `181+` minutes.

## 4. Business acceptance statement

The business requirements are satisfied when an authenticated learner can maintain private, accurate, board-specific study history; safely manage boards and activities without losing history; and use the heatmap and statistics to understand consistency over time on desktop and mobile.
