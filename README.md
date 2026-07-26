# Language Learning Time Tracker

A responsive web application for recording and reviewing foreign-language study time, newly learned vocabulary, and self-declared CEFR progress on private language boards.

## Project status

**Phases 0, 1, and 2 are complete and merged. Phase 3 Vocabulary is implemented,
visually approved, and awaiting pull-request verification.**

Phase 0 authentication, hosted Supabase schema, RLS, email confirmation, and
password recovery are complete. Phase 1 provides production-backed language
boards, the responsive Study Time heatmap, single-day study-session CRUD,
activity management, streaks, period statistics, distributions, and
desktop/mobile navigation. Phase 2 adds an atomic, idempotent, confirmed date
range flow that preserves existing entries. Phase 3 adds production-backed
single-day and non-overwriting date-range Vocabulary totals, a responsive
green/red yearly heatmap, word averages and streaks, and board-scoped word
analytics on the shared Statistics screen.

### Current local preview

The current local application runs at
[http://localhost:3000](http://localhost:3000):

- [Sign in](http://localhost:3000/sign-in) — production-backed authentication.
- [Dashboard](http://localhost:3000/dashboard) — responsive Study Time and
  Vocabulary trackers.
- [Statistics](http://localhost:3000/statistics) — board-scoped Study Time and
  Vocabulary analytics.
- [Study Time demo](http://localhost:3000/demo) — preserved design prototype.

`pnpm dev` automatically exposes the development server to private LAN
addresses for same-network mobile review. The LAN IP may change when the
computer reconnects to Wi-Fi or a phone hotspot.

## Local setup

1. Keep the repository on drive `D:` and install dependencies there.
2. Install Node.js 22, pnpm 10.22, and optionally Docker Desktop for the local Supabase stack.
3. Run `pnpm install --frozen-lockfile`.
4. Copy `.env.example` to `.env.local`.
5. Follow the [Supabase setup guide](docs/development/SUPABASE_SETUP.md) to configure a hosted or local project.
6. Run `pnpm dev` for development or `pnpm build` followed by `pnpm start` for a production-like check.

Never commit `.env.local` or a service-role key. The browser receives only the publishable key.

## Quality commands

- `pnpm format:check` checks source formatting.
- `pnpm lint` runs ESLint.
- `pnpm typecheck` runs strict TypeScript checks.
- `pnpm test` runs Vitest unit tests.
- `pnpm test:e2e` runs Playwright desktop and mobile checks.
- `pnpm db:reset` rebuilds a local Supabase database from migrations.
- `pnpm db:test` runs pgTAP database and RLS tests.
- `pnpm db:types` regenerates TypeScript types from the local schema.

The local database commands require a Docker-compatible runtime. The Windows Supabase wrapper stores its CLI home under the repository's ignored `.cache` directory on drive `D:`.

The GitHub browser job starts an isolated local Supabase stack, creates a
confirmed E2E-only user, and runs protected Study Time CRUD in desktop and
mobile Chromium. Without those generated credentials, protected local E2E
tests skip rather than touching a hosted account.

## MVP summary

- Email/password authentication with email confirmation and password recovery.
- Private per-user data protected by Supabase Row Level Security.
- Up to six language boards per user.
- One global activity catalog per user, shared across all boards.
- Unlimited study entries per calendar day plus atomic, non-overwriting date-range creation of up to 366 entries.
- Exact durations from 1 to 1,440 minutes, with fixed quick-select values.
- Separate Study Time and Vocabulary yearly heatmaps with fixed, comparable intensity thresholds.
- One editable final vocabulary total per board and date.
- Board-specific Study Time and Vocabulary totals, averages, active days,
  streaks, period distributions, and recent activity allocation.
- User-declared CEFR history and a clearly qualified Cambridge-based next-level forecast.
- Responsive English-language interface for desktop and mobile.

## Planned stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase PostgreSQL with Row Level Security
- Vercel
- Playwright for critical end-to-end tests
- pgTAP for database constraints, functions, and RLS policies

## Development storage

The repository and installed dependencies live on drive `D:`. Package caches, browser-test artifacts, and other project-controlled development caches must also remain on `D:` as required by the project owner.

## Documentation

- [Documentation home](docs/README.md) — the recommended starting point, with reading paths for product, design, engineering, and QA.
- [Product vision and scope](docs/requirements/PRODUCT_VISION.md)
- [Business requirements](docs/requirements/BUSINESS_REQUIREMENTS.md)
- [Functional requirements](docs/requirements/FUNCTIONAL_REQUIREMENTS.md)
- [Non-functional requirements](docs/requirements/NON_FUNCTIONAL_REQUIREMENTS.md)
- [Use cases](docs/requirements/USE_CASES.md)
- [Requirements traceability matrix](docs/requirements/TRACEABILITY_MATRIX.md)
- [Domain glossary](docs/requirements/GLOSSARY.md)
- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Repository instructions](AGENTS.md)
- [Supabase setup and verification](docs/development/SUPABASE_SETUP.md)
- [Phase 0 authentication screenshots](docs/design/phase-0/README.md)

## Source language

Code, identifiers, database objects, user-interface copy, and project documentation are written in English. Product discussions with the project owner may be conducted in Russian.
