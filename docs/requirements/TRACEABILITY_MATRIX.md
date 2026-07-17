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
| `UT-BATCH`      | Inclusive range validation, same-year limits, counts, and operation idempotency         | Unit                                      |
| `UT-VOCAB`      | Vocabulary thresholds, totals, active days, and streak algorithms                       | Unit                                      |
| `UT-CEFR`       | Reference midpoints, eligible minutes, seven-day pace, rounding, and unavailable states | Unit                                      |
| `DB-CONSTRAINT` | Names, limits, durations, comments, ownership references, and archival invariants       | pgTAP                                     |
| `DB-RLS`        | Allowed owner access and denied cross-user access for every user-facing table           | pgTAP                                     |
| `DB-AGG`        | Board-scoped statistics and grouped distribution functions                              | pgTAP                                     |
| `DB-BATCH`      | Batch atomicity, idempotency, ownership, range constraints, and existing-entry behavior | pgTAP                                     |
| `E2E-AUTH`      | Registration, confirmation callback, sign-in, recovery, sign-out, and route protection  | Playwright                                |
| `E2E-BOARD`     | Board creation, selection, limits, rename, order, and archival confirmation             | Playwright                                |
| `E2E-ACT`       | Global activity creation, `Other`, rename, archive, restore, and limits                 | Playwright                                |
| `E2E-ENTRY`     | Entry creation, custom duration, validation, edit, delete, and multiple daily entries   | Playwright                                |
| `E2E-HEAT`      | Year navigation, day selection, intensity, future entries, and accessible labels        | Playwright                                |
| `E2E-STAT`      | Board scoping, totals, averages, streaks, activities, and distributions                 | Playwright                                |
| `E2E-VOCAB`     | Tracker switching, one daily total, edit/delete, heatmap, totals, and streaks           | Playwright                                |
| `E2E-CEFR`      | Manual declarations, history, forecast, disclosures, and unavailable states             | Playwright                                |
| `E2E-RESP`      | Critical flows at desktop and mobile viewports, including contained heatmap scrolling   | Playwright and manual review              |
| `A11Y`          | Keyboard navigation, focus, accessible names, contrast, non-color cues, and form errors | Automated and manual accessibility review |
| `BUILD`         | Formatting, linting, strict type checking, tests, and production Next.js build          | CI                                        |

## 3. Business-to-delivery traceability

| Business requirement                           | Functional coverage                                                                                      | Use cases                                   | Primary verification                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| `BR-001` — Private owner-only record           | Authentication plus every user-owned capability                                                          | `UC-01`–`UC-12`                             | `DB-RLS`, `E2E-AUTH`, two-user journeys                          |
| `BR-002` — Separate language-board history     | `FR-BOARD-001`–`FR-BOARD-008`, `FR-STAT-001`, `FR-VOCAB-001`–`FR-VOCAB-011`, `FR-CEFR-001`–`FR-CEFR-009` | `UC-03`, `UC-07`, `UC-08`, `UC-11`, `UC-12` | `E2E-BOARD`, `E2E-STAT`, `E2E-VOCAB`, `E2E-CEFR`                 |
| `BR-003` — Minimize repeated logging input     | `FR-ENTRY-003`–`FR-ENTRY-005`, `FR-ENTRY-013`, `FR-ENTRY-014`, `FR-ENTRY-018`–`FR-ENTRY-022`             | `UC-05`, `UC-10`                            | `E2E-ENTRY`, `UT-BATCH`, `DB-BATCH`                              |
| `BR-004` — Preserve activity meaning           | `FR-ACT-004`–`FR-ACT-006`, `FR-STAT-004`                                                                 | `UC-04`, `UC-08`                            | `E2E-ACT`, `E2E-STAT`, `DB-CONSTRAINT`                           |
| `BR-005` — Preserve archived-board history     | `FR-BOARD-007`, `FR-BOARD-008`                                                                           | `UC-09`                                     | `E2E-BOARD`, `DB-CONSTRAINT`                                     |
| `BR-006` — Stable yearly Study Time intensity  | `FR-HEAT-001`–`FR-HEAT-010`                                                                              | `UC-07`                                     | `UT-CAL`, `UT-HEAT`, `E2E-HEAT`, `A11Y`                          |
| `BR-007` — Board statistics                    | `FR-STAT-001`–`FR-STAT-014`                                                                              | `UC-08`                                     | `UT-STAT`, `DB-AGG`, `E2E-STAT`                                  |
| `BR-008` — Desktop and mobile browser use      | `FR-HEAT-008`, `FR-UI-006`, `FR-UI-008`, `FR-UI-010`, `FR-VOCAB-010`                                     | `UC-05`–`UC-12`                             | `E2E-RESP`, `A11Y`                                               |
| `BR-009` — Exact-minute source of truth        | `FR-ENTRY-003`–`FR-ENTRY-005`, `FR-HEAT-003`, `FR-STAT-002`–`FR-STAT-014`                                | `UC-05`–`UC-08`, `UC-10`, `UC-12`           | `DB-CONSTRAINT`, `DB-AGG`, `UT-STAT`, `UT-CEFR`                  |
| `BR-010` — Operational simplicity              | Aggregation and delivery constraints in `NFR-PERF-001`–`NFR-PERF-004`                                    | All                                         | Query plans, `BUILD`, architecture review                        |
| `BR-011` — Above-the-fold daily action         | `FR-ENTRY-013`–`FR-ENTRY-017`, `FR-UI-007`, `FR-UI-008`, `FR-UI-010`                                     | `UC-05`, `UC-06`                            | `E2E-ENTRY`, `E2E-RESP`, `A11Y`                                  |
| `BR-012` — Safe repeated date-range entry      | `FR-ENTRY-018`–`FR-ENTRY-022`                                                                            | `UC-10`                                     | `UT-BATCH`, `DB-BATCH`, `E2E-ENTRY`                              |
| `BR-013` — Separate Vocabulary tracker         | `FR-VOCAB-001`–`FR-VOCAB-011`                                                                            | `UC-11`                                     | `UT-VOCAB`, `DB-CONSTRAINT`, `DB-RLS`, `E2E-VOCAB`               |
| `BR-014` — CEFR history and qualified forecast | `FR-CEFR-001`–`FR-CEFR-009`                                                                              | `UC-12`                                     | `UT-CEFR`, `DB-CONSTRAINT`, `DB-RLS`, `E2E-CEFR`                 |
| `BR-015` — Recent and reference analytics      | `FR-STAT-012`–`FR-STAT-015`                                                                              | `UC-08`, `UC-12`                            | `UT-STAT`, `UT-CEFR`, `E2E-STAT`; `FR-STAT-015` remains deferred |

## 4. Non-functional traceability

| Quality area                          | Requirements                                                  | Architecture or process control                                                                          | Verification                                                        |
| ------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Security and privacy                  | `NFR-SEC-001`–`NFR-SEC-007`, `NFR-PRIV-001`, `NFR-PRIV-002`   | Supabase Auth, PostgreSQL RLS, verified claims, server-only secrets, composite ownership constraints     | `DB-RLS`, `DB-CONSTRAINT`, `E2E-AUTH`, secret scan, security review |
| Data integrity                        | `NFR-DATA-001`–`NFR-DATA-008`                                 | Versioned migrations, exact source values, atomic batches, daily Vocabulary uniqueness, stable history   | `DB-CONSTRAINT`, `DB-AGG`, `DB-BATCH`, migration replay             |
| Accessibility and usability           | `NFR-A11Y-001`–`NFR-A11Y-006`, `NFR-USE-001`, `NFR-USE-002`   | Semantic HTML, non-color information, hover/focus/touch parity, clear validation and states              | `A11Y`, `E2E-RESP`, manual review                                   |
| Responsive behavior and compatibility | `NFR-RESP-001`–`NFR-RESP-003`, `NFR-COMP-001`, `NFR-COMP-002` | Responsive layout, contained heatmap overflow, 1366×768 visibility contract, browser-based interaction   | `E2E-RESP`, `E2E-HEAT`, manual device review                        |
| Performance and capacity              | `NFR-PERF-001`–`NFR-PERF-004`                                 | Database aggregation, indexed filters, no premature persisted aggregates                                 | Query plans, representative-data measurements, `E2E-STAT`           |
| Reliability                           | `NFR-REL-001`–`NFR-REL-005`                                   | Atomic mutations, recoverable forecast states, reproducible build, environment-specific auth callbacks   | `E2E-AUTH`, `E2E-ENTRY`, `E2E-CEFR`, `BUILD`                        |
| Estimate transparency                 | `NFR-TRUST-001`–`NFR-TRUST-004`                               | Self-declared CEFR language, versioned model, visible limitations, deferred-model gates                  | `UT-CEFR`, `E2E-CEFR`, content and scope review                     |
| Maintainability and delivery          | `NFR-MAINT-001`–`NFR-MAINT-006`, `NFR-OPS-001`, `NFR-OPS-002` | Strict TypeScript, generated database types, tests, D-drive project storage, environment-managed secrets | `BUILD`, test suite, documentation review, repository inspection    |

## 5. Critical rule coverage

| Product rule                     | Requirement references                                                   | Minimum boundary cases                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Six active boards maximum        | `FR-BOARD-003`                                                           | 5→6 succeeds; 6→7 fails; concurrent creation cannot exceed 6; archived board does not count.                                          |
| Thirty active activities maximum | `FR-ACT-007`                                                             | 29→30 succeeds; 30→31 fails; concurrent creation cannot exceed 30; archived activity does not count until restored.                   |
| Case-insensitive active names    | `FR-BOARD-002`, `FR-ACT-002`, `FR-ACT-004`, `FR-ACT-008`                 | Trimmed duplicates and casing-only duplicates fail; archived activity with same normalized name restores its identity.                |
| Exact duration limits            | `FR-ENTRY-004`, `FR-ENTRY-005`                                           | 1 and 1,440 succeed; 0, 1,441, fractions, and non-numeric values fail.                                                                |
| Comment limit                    | `FR-ENTRY-006`                                                           | Empty/omitted and 150 normalized characters succeed; 151 fails.                                                                       |
| Study Time heatmap semantics     | `FR-HEAT-003`, `FR-HEAT-004`, `FR-HEAT-009`, `FR-HEAT-010`               | Past/today/future zero states differ correctly; 1, 14, 15, 29, 30, 59, 60, 119, 120, 180, 181 and larger totals map correctly.        |
| Calendar-day average             | `FR-STAT-006`                                                            | Current year through today; completed common year /365; leap year /366; future minutes excluded.                                      |
| Current streak                   | `FR-STAT-008`                                                            | Last active today; last active yesterday; gap before yesterday; month/year boundary; leap day; future entries ignored.                |
| Future-entry behavior            | `FR-HEAT-005`, `FR-STAT-002`, `FR-STAT-003`, `FR-STAT-005`–`FR-STAT-009` | Appears in selected-year heatmap and total immediately; excluded from current periods, averages, active days, and streaks until date. |
| Cross-user isolation             | `NFR-SEC-001`–`NFR-SEC-004`                                              | Owner CRUD succeeds; reading or mutating another user's board, activity, or entry fails; cross-owner references fail.                 |
| Above-the-fold desktop contract  | `FR-UI-007`, `FR-UI-008`, `NFR-RESP-003`                                 | At 1366×768/100%, the approved navigation, heatmap, summary, selected-day heading, and first entry/action are visible without scroll. |
| Batch range and preservation     | `FR-ENTRY-018`–`FR-ENTRY-022`                                            | 1/365/366-day same-year ranges succeed; reversed/cross-year/367 fail; matching entries remain; retry and injected failure are safe.   |
| Vocabulary daily uniqueness      | `FR-VOCAB-002`–`FR-VOCAB-005`, `NFR-DATA-007`                            | Create, concurrent create, replacement, deletion, and cross-user attempts preserve at most one owned board/date row.                  |
| Vocabulary heatmap and streak    | `FR-VOCAB-006`–`FR-VOCAB-010`                                            | Every threshold edge maps correctly; future totals show but do not extend active days or streaks; today/yesterday behavior matches.   |
| CEFR declaration history         | `FR-CEFR-001`–`FR-CEFR-004`                                              | A1–C2 accepted; invalid/future rejected; earlier declarations remain; same-day update deterministic; system never auto-promotes.      |
| CEFR forecast                    | `FR-CEFR-005`–`FR-CEFR-009`                                              | Every midpoint transition, effective-date subtraction, seven zero-inclusive days, rounding, zero pace, completed target, and C2 pass. |
| Deferred reference models        | `FR-CEFR-010`, `FR-STAT-015`, `NFR-TRUST-004`                            | No vocabulary cutoffs or ideal distribution appear before immutable values and methodology receive owner approval.                    |

## 6. Change-impact rule

When a requirement changes, reviewers must update every affected row in this matrix, its use case and acceptance criteria, the architecture when technical boundaries change, and the planned or executable tests. An MVP item is accepted only when its linked business requirement, functional behavior, and applicable non-functional controls have evidence of verification.
