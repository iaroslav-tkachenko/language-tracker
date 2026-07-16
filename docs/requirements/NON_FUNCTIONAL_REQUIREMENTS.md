# Non-Functional Requirements

## 1. Purpose

Non-functional requirements define the quality, security, operational, and implementation constraints under which functional behavior must operate.

## 2. Security and privacy

| ID             | Requirement                                                                                                                          | Verification                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `NFR-SEC-001`  | Every user-facing table shall have PostgreSQL Row Level Security enabled.                                                            | Migration inspection and pgTAP policy tests.                    |
| `NFR-SEC-002`  | Database authorization shall derive ownership from the verified authenticated user, never from a trusted client-supplied `user_id`.  | Code review, policy inspection, and forged-request tests.       |
| `NFR-SEC-003`  | Composite ownership constraints shall prevent an entry from referencing another user's board or activity.                            | Database constraint tests with cross-user fixtures.             |
| `NFR-SEC-004`  | Every Server Action and Route Handler shall authenticate, authorize, and validate its input as a public entry point.                 | Code review and unauthenticated/unauthorized integration tests. |
| `NFR-SEC-005`  | Server-side authorization shall use currently recommended verified Supabase claims and shall not trust an unverified cookie session. | Auth helper inspection and protected-route tests.               |
| `NFR-SEC-006`  | A Supabase service-role secret shall never be included in browser code, public environment variables, logs, or Git history.          | Secret scan, build inspection, and environment review.          |
| `NFR-SEC-007`  | Authentication responses shall not unnecessarily reveal whether an email address is registered.                                      | Password-recovery and sign-in error review.                     |
| `NFR-PRIV-001` | Product data shall be private by default and unavailable to unauthenticated or other authenticated users.                            | Two-user isolation tests for read and mutation paths.           |
| `NFR-PRIV-002` | The MVP shall collect only data required for authentication and study tracking.                                                      | Schema and UI review against the approved scope.                |

## 3. Data integrity

| ID             | Requirement                                                                                                       | Verification                                              |
| -------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `NFR-DATA-001` | Study duration shall be stored as exact integer minutes and all aggregates shall be derived from source entries.  | Schema constraints and aggregation tests.                 |
| `NFR-DATA-002` | Study dates shall use PostgreSQL `date`; audit timestamps shall use `timestamptz`.                                | Migration inspection.                                     |
| `NFR-DATA-003` | Board and activity limits, normalized uniqueness, and ownership shall be enforced at a trusted database boundary. | Constraint/function tests, including concurrent requests. |
| `NFR-DATA-004` | Archival and restoration shall preserve stable identities and historical foreign-key relationships.               | Lifecycle integration tests.                              |
| `NFR-DATA-005` | Database changes shall be reproducible from version-controlled migrations.                                        | Clean local database rebuild.                             |

## 4. Accessibility and usability

| ID             | Requirement                                                                                                                 | Verification                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `NFR-A11Y-001` | The application shall target WCAG 2.2 Level AA for in-scope screens and controls.                                           | Automated accessibility checks plus keyboard and screen-reader-oriented manual review. |
| `NFR-A11Y-002` | Color shall not be the sole means of conveying heatmap information, selection, errors, or status.                           | Visual and accessible-name inspection.                                                 |
| `NFR-A11Y-003` | Interactive controls shall have accessible names, visible focus, and logical keyboard order.                                | Keyboard walkthrough and accessibility-tree inspection.                                |
| `NFR-A11Y-004` | Form errors shall identify the affected field and provide corrective guidance.                                              | Invalid-input use-case tests.                                                          |
| `NFR-USE-001`  | The core logging loop shall be completable from the selected board experience without navigating to unrelated screens.      | Manual walkthrough of `UC-05`.                                                         |
| `NFR-USE-002`  | The UI shall clearly distinguish active, selected, archived, loading, empty, successful, and error states where applicable. | Design review and state-based component tests.                                         |

## 5. Responsive behavior and compatibility

| ID             | Requirement                                                                                                           | Verification                                                |
| -------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `NFR-RESP-001` | In-scope screens shall work from a 320 CSS-pixel viewport through common desktop widths.                              | Playwright viewport matrix and manual responsive review.    |
| `NFR-RESP-002` | The heatmap may scroll horizontally on narrow screens but shall not force unrelated page content beyond the viewport. | Mobile screenshot and overflow assertions.                  |
| `NFR-COMP-001` | The MVP shall support current stable Chromium, Firefox, and WebKit-class browsers represented by Playwright projects. | Critical end-to-end smoke suite across configured projects. |
| `NFR-COMP-002` | The application shall remain usable with touch, mouse, and keyboard input.                                            | Device-emulation and keyboard walkthroughs.                 |

## 6. Performance and capacity

| ID             | Requirement                                                                                                                                               | Verification                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `NFR-PERF-001` | Board views shall request pre-aggregated daily/statistical data rather than downloading another user's or unbounded raw history.                          | Data-access review and network inspection.           |
| `NFR-PERF-002` | Common board/date/activity queries shall use indexes aligned with ownership, board, activity, and study-date filters.                                     | Migration review and representative `EXPLAIN` plans. |
| `NFR-PERF-003` | The MVP shall remain responsive with representative multi-year data at the expected scale of up to 100 registered users.                                  | Seeded performance smoke test and query-plan review. |
| `NFR-PERF-004` | Persisted aggregates, queues, or external caches shall not be introduced without measured evidence that indexed source-entry aggregation is insufficient. | Architecture review.                                 |

## 7. Reliability and error handling

| ID            | Requirement                                                                                                                                     | Verification                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `NFR-REL-001` | Expected validation, authentication, constraint, and network failures shall produce controlled user-facing states rather than unhandled errors. | Negative-path integration and end-to-end tests. |
| `NFR-REL-002` | Mutations shall either complete consistently or fail without partial cross-entity state.                                                        | Transactional database-function tests.          |
| `NFR-REL-003` | A clean production build shall succeed from the committed lockfile and documented environment.                                                  | CI production-build job.                        |
| `NFR-REL-004` | Authentication callback configuration shall be verified independently for local, Preview, and Production environments.                          | Environment checklist and smoke tests.          |

## 8. Maintainability and delivery

| ID              | Requirement                                                                                                                                         | Verification                                                         |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `NFR-MAINT-001` | Application code shall use strict TypeScript and English identifiers.                                                                               | Typecheck and code review.                                           |
| `NFR-MAINT-002` | Database types shall be generated from the schema rather than manually duplicated.                                                                  | Build/repository inspection.                                         |
| `NFR-MAINT-003` | Pure calendar, heatmap, average, and streak rules shall have unit tests.                                                                            | Unit-test suite.                                                     |
| `NFR-MAINT-004` | RLS policies, constraints, and database functions shall have pgTAP coverage.                                                                        | Database-test suite.                                                 |
| `NFR-MAINT-005` | Critical user journeys shall have Playwright end-to-end coverage.                                                                                   | E2E suite and traceability matrix.                                   |
| `NFR-MAINT-006` | Documentation and requirement traceability shall be updated when approved behavior changes.                                                         | Pull-request review checklist.                                       |
| `NFR-OPS-001`   | Development dependencies, caches, test browsers, builds, and project-controlled artifacts shall be stored on drive `D:` in the owner's environment. | Environment and path inspection.                                     |
| `NFR-OPS-002`   | Secrets shall be configured through environment-specific secret storage and excluded from Git.                                                      | `.gitignore`, secret scan, and Vercel/Supabase configuration review. |

## 9. Quality gate

The MVP cannot be declared complete until formatting, linting, TypeScript checks, unit tests, pgTAP tests, critical Playwright tests, a production build, and representative responsive/accessibility checks have run successfully or any unavailable check has been explicitly reported and accepted.
