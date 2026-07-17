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
| `BR-011` | The primary board view shall expose the selected day's next action without avoidable desktop scrolling.                         | Low-friction daily logging is the core product loop.                                                  | Must     | Approved |
| `BR-012` | The product shall allow one study pattern to be recorded safely across a date range.                                            | Learners often repeat the same activity and duration on many dates.                                   | Must     | Approved |
| `BR-013` | Each language board shall track newly learned vocabulary separately from study time.                                            | Vocabulary consistency is a distinct learning signal and needs its own history.                       | Must     | Approved |
| `BR-014` | Each language board shall retain user-declared CEFR history and provide a qualified next-level forecast.                        | Learners want a motivational direction while retaining control over level assessment.                 | Must     | Approved |
| `BR-015` | Detailed statistics shall compare recent actual behavior with clearly identified reference guidance.                            | Recent activity balance is actionable, but estimated guidance must not be presented as fact.          | Should   | Approved |

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

- `BR-RULE-030`: A single-day save operation creates one study entry; a confirmed batch operation creates one independent entry for each date in its range.
- `BR-RULE-031`: A calendar day may contain any number of study entries.
- `BR-RULE-032`: A study entry contains one board, one date, one activity, and one exact duration.
- `BR-RULE-033`: Duration is an integer from 1 through 1,440 minutes.
- `BR-RULE-034`: Study entries, batch operations, and CEFR declarations do not contain comments or free-form notes.
- `BR-RULE-035`: Study dates may be in the past, present, or future.
- `BR-RULE-036`: Archived boards and activities cannot be assigned to new entries.
- `BR-RULE-037`: A batch range is inclusive, contains at most 366 dates, and cannot cross a calendar-year boundary.
- `BR-RULE-038`: Batch creation never replaces or merges an existing entry, including an entry with the same activity and duration.
- `BR-RULE-039`: One batch submission is atomic and idempotent for the same submission intent.

### Calendar and statistics

- `BR-RULE-040`: A week runs from Monday through Sunday.
- `BR-RULE-041`: The browser's local calendar date determines today and current periods.
- `BR-RULE-042`: Existing study dates never move when the device time zone changes.
- `BR-RULE-043`: An active day has a board total greater than zero minutes.
- `BR-RULE-044`: Future entries appear in their year's heatmap and selected-year total immediately.
- `BR-RULE-045`: Future entries do not affect current-period averages, active days, or streaks before their date arrives.
- `BR-RULE-046`: A current streak remains active when the latest active day is today or yesterday.
- `BR-RULE-047`: Study Time heatmap thresholds are `0`, `1–14`, `15–29`, `30–59`, `60–119`, `120–180`, and `181+` minutes.
- `BR-RULE-048`: A zero-minute past Study Time day is red; a zero-minute current or future day is white; positive totals below 60 minutes use yellow-family levels; totals of 60 minutes or more use increasingly dark green levels.
- `BR-RULE-049`: Heatmap levels are fixed across years rather than normalized to a year's maximum.

### Selected-day workflow

- `BR-RULE-050`: An empty selected day initially shows `Add study session` rather than an expanded entry form.
- `BR-RULE-051`: The create action is unavailable until both a valid exact duration and an active activity are selected.
- `BR-RULE-052`: Editing can change duration and activity and uses explicit `Update` and `Cancel` actions.
- `BR-RULE-053`: Deleting a study entry requires explicit confirmation.
- `BR-RULE-054`: At 1366×768 CSS pixels and 100% browser zoom, the primary view shows the heatmap, summary, selected-day heading, and either its first entry or `Add study session` without page scrolling.
- `BR-RULE-055`: A populated selected day shows `Add study session` below its existing cards.
- `BR-RULE-056`: On mobile/touch layouts, edit and delete icons remain persistently visible on every study-entry card.
- `BR-RULE-057`: During Phases 1 and 2, the visible Vocabulary tab is disabled and labelled `Coming soon`.
- `BR-RULE-058`: `Top activity` does not appear in the primary summary; Phase 1 design review may use an isolated B1-to-B2 six-month test fixture until real Phase 4 CEFR data replaces it.

### Vocabulary

- `BR-RULE-060`: Vocabulary is board-specific and does not combine languages.
- `BR-RULE-061`: A board and calendar date have at most one vocabulary record containing the final total of newly learned words for that day.
- `BR-RULE-062`: A vocabulary total is a positive integer; zero is represented by the absence or deletion of a daily record.
- `BR-RULE-063`: Vocabulary totals may be created for past, current, or future dates and may be edited or deleted.
- `BR-RULE-064`: Vocabulary heatmap thresholds are `0`, `1–2`, `3–5`, `6–9`, `10–14`, `15–19`, `20–39`, and `40+` words.
- `BR-RULE-065`: The Vocabulary heatmap uses a green visual scale and remains understandable without color.
- `BR-RULE-066`: Vocabulary totals, active days, and streaks use the same future-date eligibility rules as Study Time statistics.

### CEFR history and forecast

- `BR-RULE-070`: CEFR level is declared manually per language board and the system never promotes it automatically.
- `BR-RULE-071`: A declaration records A1, A2, B1, B2, C1, or C2 and an effective date no later than today.
- `BR-RULE-072`: The current CEFR level is the latest effective declaration; earlier declarations remain visible in history.
- `BR-RULE-073`: Forecasts use an approximate Cambridge English guided-learning-hours model for every language, with a prominent warning that it is guidance rather than an assessment or guarantee.
- `BR-RULE-074`: Progress toward the next level subtracts eligible study time logged since the effective date of the current declaration from the reference hours between the two levels.
- `BR-RULE-075`: The forecast pace is the average minutes per calendar day across today and the preceding six dates, including zero-study days and excluding future entries.
- `BR-RULE-076`: A zero seven-day pace produces no estimated achievement date; C2 has no next-level forecast.
- `BR-RULE-077`: Reaching the estimated hour target does not change the declared level and instead prompts the user to reassess it.

### Deferred product models

- `BR-RULE-080`: Vocabulary-to-CEFR word-count cutoffs will be fixed and non-editable, but their values remain deferred until separate product approval.
- `BR-RULE-081`: Ideal activity distributions will be fixed and non-editable per CEFR level, but their values remain deferred until separate product approval.

## 4. Business acceptance statement

The business requirements are satisfied when an authenticated learner can maintain private, accurate, board-specific Study Time, Vocabulary, and CEFR history; safely create single-day and batch entries without overwriting history; manage boards and activities without losing historical meaning; and use accessible heatmaps, statistics, and qualified forecasts on desktop and mobile.
