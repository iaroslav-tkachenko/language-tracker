# Requirements Traceability Matrix

## 1. Purpose

This matrix connects business intent to functional behavior, end-to-end use cases, and planned verification. It supports impact analysis, scope control, design review, and MVP acceptance.

Requirement IDs are stable references. Test IDs describe the intended verification suite; they become links to executable tests as implementation progresses.

## 2. Planned verification identifiers

| Test ID         | Verification area                                                                       | Primary level                             |
| --------------- | --------------------------------------------------------------------------------------- | ----------------------------------------- |
| `UT-CAL`        | Calendar construction, Monday-first weeks, leap years, and date boundaries              | Unit                                      |
| `UT-HEAT`       | Daily aggregation and every heatmap threshold boundary                                  | Unit                                      |
| `UT-STAT`       | Totals, averages, active days, future-date handling, and streak algorithms              | Unit                                      |
| `DB-CONSTRAINT` | Names, limits, durations, comments, ownership references, and archival invariants       | pgTAP                                     |
| `DB-RLS`        | Allowed owner access and denied cross-user access for every user-facing table           | pgTAP                                     |
| `DB-AGG`        | Board-scoped statistics and grouped distribution functions                              | pgTAP                                     |
| `E2E-AUTH`      | Registration, confirmation callback, sign-in, recovery, sign-out, and route protection  | Playwright                                |
| `E2E-BOARD`     | Board creation, selection, limits, rename, order, and archival confirmation             | Playwright                                |
| `E2E-ACT`       | Global activity creation, `Other`, rename, archive, restore, and limits                 | Playwright                                |
| `E2E-ENTRY`     | Entry creation, custom duration, validation, edit, delete, and multiple daily entries   | Playwright                                |
| `E2E-HEAT`      | Year navigation, day selection, intensity, future entries, and accessible labels        | Playwright                                |
| `E2E-STAT`      | Board scoping, totals, averages, streaks, activities, and distributions                 | Playwright                                |
| `E2E-RESP`      | Critical flows at desktop and mobile viewports, including contained heatmap scrolling   | Playwright and manual review              |
| `A11Y`          | Keyboard navigation, focus, accessible names, contrast, non-color cues, and form errors | Automated and manual accessibility review |
| `BUILD`         | Formatting, linting, strict type checking, tests, and production Next.js build          | CI                                        |

## 3. Business-to-delivery traceability

| Business requirement                    | Functional coverage                                                      | Use cases                 | Primary verification                       |
| --------------------------------------- | ------------------------------------------------------------------------ | ------------------------- | ------------------------------------------ |
| `BR-001` — Secure account access        | `FR-AUTH-001`–`FR-AUTH-008`                                              | `UC-01`, `UC-02`          | `E2E-AUTH`, `DB-RLS`, `A11Y`               |
| `BR-002` — Private owner-only data      | All authenticated functions; especially `FR-AUTH-006`, `FR-AUTH-007`     | `UC-03`–`UC-09`           | `DB-RLS`, `DB-CONSTRAINT`, security review |
| `BR-003` — Separate language boards     | `FR-BOARD-001`–`FR-BOARD-006`, `FR-STAT-001`                             | `UC-03`, `UC-07`, `UC-08` | `E2E-BOARD`, `E2E-HEAT`, `E2E-STAT`        |
| `BR-004` — Safe board lifecycle         | `FR-BOARD-007`, `FR-BOARD-008`                                           | `UC-09`                   | `E2E-BOARD`, `DB-CONSTRAINT`               |
| `BR-005` — Reusable global activities   | `FR-ACT-001`–`FR-ACT-003`, `FR-ACT-008`                                  | `UC-04`, `UC-05`          | `E2E-ACT`, `E2E-ENTRY`, `DB-CONSTRAINT`    |
| `BR-006` — Preserve activity history    | `FR-ACT-004`–`FR-ACT-007`, `FR-STAT-004`                                 | `UC-04`, `UC-08`          | `E2E-ACT`, `E2E-STAT`, `DB-CONSTRAINT`     |
| `BR-007` — Flexible exact entry capture | `FR-ENTRY-001`–`FR-ENTRY-012`                                            | `UC-05`, `UC-06`          | `E2E-ENTRY`, `DB-CONSTRAINT`               |
| `BR-008` — Comparable annual heatmap    | `FR-HEAT-001`–`FR-HEAT-008`                                              | `UC-07`                   | `UT-CAL`, `UT-HEAT`, `E2E-HEAT`, `A11Y`    |
| `BR-009` — Correct calendar semantics   | `FR-ENTRY-001`, `FR-HEAT-001`–`FR-HEAT-005`, `FR-STAT-002`–`FR-STAT-010` | `UC-05`, `UC-07`, `UC-08` | `UT-CAL`, `UT-STAT`, `DB-AGG`              |
| `BR-010` — Actionable board statistics  | `FR-STAT-001`–`FR-STAT-011`                                              | `UC-08`                   | `UT-STAT`, `DB-AGG`, `E2E-STAT`            |

## 4. Non-functional traceability

| Quality area                          | Requirements                                                   | Architecture or process control                                                                          | Verification                                                        |
| ------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Security and privacy                  | `NFR-SEC-001`–`NFR-SEC-007`, `NFR-PRIV-001`, `NFR-PRIV-002`    | Supabase Auth, PostgreSQL RLS, verified claims, server-only secrets, composite ownership constraints     | `DB-RLS`, `DB-CONSTRAINT`, `E2E-AUTH`, secret scan, security review |
| Data integrity                        | `NFR-DATA-001`–`NFR-DATA-005`                                  | Versioned SQL migrations, exact-minute storage, date/timestamptz types, stable archived identities       | `DB-CONSTRAINT`, `DB-AGG`, migration replay                         |
| Accessibility and usability           | `NFR-A11Y-001`–`NFR-A11Y-004`, `NFR-USE-001`, `NFR-USE-002`    | Semantic HTML, keyboard interaction, visible focus, clear validation and states                          | `A11Y`, `E2E-RESP`, manual review                                   |
| Responsive behavior and compatibility | `NFR-RESP-001`, `NFR-RESP-002`, `NFR-COMP-001`, `NFR-COMP-002` | Responsive layout, contained heatmap overflow, browser-based interaction                                 | `E2E-RESP`, `E2E-HEAT`, manual device review                        |
| Performance and capacity              | `NFR-PERF-001`–`NFR-PERF-004`                                  | Database aggregation, indexed filters, no premature persisted aggregates                                 | Query plans, representative-data measurements, `E2E-STAT`           |
| Reliability                           | `NFR-REL-001`–`NFR-REL-004`                                    | Atomic mutations, recoverable errors, reproducible build, environment-specific auth callbacks            | `E2E-AUTH`, `E2E-ENTRY`, `BUILD`                                    |
| Maintainability and delivery          | `NFR-MAINT-001`–`NFR-MAINT-006`, `NFR-OPS-001`, `NFR-OPS-002`  | Strict TypeScript, generated database types, tests, D-drive project storage, environment-managed secrets | `BUILD`, test suite, documentation review, repository inspection    |

## 5. Critical rule coverage

| Product rule                     | Requirement references                                                   | Minimum boundary cases                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Six active boards maximum        | `FR-BOARD-003`                                                           | 5→6 succeeds; 6→7 fails; concurrent creation cannot exceed 6; archived board does not count.                                          |
| Thirty active activities maximum | `FR-ACT-007`                                                             | 29→30 succeeds; 30→31 fails; concurrent creation cannot exceed 30; archived activity does not count until restored.                   |
| Case-insensitive active names    | `FR-BOARD-002`, `FR-ACT-002`, `FR-ACT-004`, `FR-ACT-008`                 | Trimmed duplicates and casing-only duplicates fail; archived activity with same normalized name restores its identity.                |
| Exact duration limits            | `FR-ENTRY-004`, `FR-ENTRY-005`                                           | 1 and 1,440 succeed; 0, 1,441, fractions, and non-numeric values fail.                                                                |
| Comment limit                    | `FR-ENTRY-006`                                                           | Empty/omitted and 150 normalized characters succeed; 151 fails.                                                                       |
| Heatmap intensities              | `FR-HEAT-003`, `FR-HEAT-004`                                             | 0, 1, 14, 15, 29, 30, 59, 60, 119, 120, 180, 181 and larger totals map correctly.                                                     |
| Calendar-day average             | `FR-STAT-006`                                                            | Current year through today; completed common year /365; leap year /366; future minutes excluded.                                      |
| Current streak                   | `FR-STAT-008`                                                            | Last active today; last active yesterday; gap before yesterday; month/year boundary; leap day; future entries ignored.                |
| Future-entry behavior            | `FR-HEAT-005`, `FR-STAT-002`, `FR-STAT-003`, `FR-STAT-005`–`FR-STAT-009` | Appears in selected-year heatmap and total immediately; excluded from current periods, averages, active days, and streaks until date. |
| Cross-user isolation             | `NFR-SEC-001`–`NFR-SEC-004`                                              | Owner CRUD succeeds; reading or mutating another user's board, activity, or entry fails; cross-owner references fail.                 |

## 6. Change-impact rule

When a requirement changes, reviewers must update every affected row in this matrix, its use case and acceptance criteria, the architecture when technical boundaries change, and the planned or executable tests. An MVP item is accepted only when its linked business requirement, functional behavior, and applicable non-functional controls have evidence of verification.
