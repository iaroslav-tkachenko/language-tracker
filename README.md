# Language Learning Time Tracker

A responsive web application for recording and reviewing time spent learning foreign languages. Each user maintains private language boards, logs one or more study entries for any calendar date, and reviews a GitHub-style yearly heatmap and board-specific statistics.

## Project status

**Implementation in progress.**

The project owner approved the implementation plan on July 14, 2026. A responsive, clickable visual prototype is available; its data is currently in-memory demonstration data while the Supabase-backed MVP is being implemented.

### Current local preview

When the development or production server is running, open [http://localhost:3000](http://localhost:3000). The preview supports year navigation, day selection, in-memory entry creation/deletion, board switching, a statistics preview, and board/activity additions through the settings drawer.

## MVP summary

- Email/password authentication with email confirmation and password recovery.
- Private per-user data protected by Supabase Row Level Security.
- Up to six language boards per user.
- One global activity catalog per user, shared across all boards.
- Unlimited study entries per calendar day, saved one entry at a time.
- Exact durations from 1 to 1,440 minutes, with fixed quick-select values.
- A yearly heatmap with fixed, comparable intensity thresholds.
- Board-specific totals, averages, active days, streaks, and time distributions.
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

## Source language

Code, identifiers, database objects, user-interface copy, and project documentation are written in English. Product discussions with the project owner may be conducted in Russian.
