# Language Learning Time Tracker

A responsive web application for recording and reviewing foreign-language study time, newly learned vocabulary, and self-declared CEFR progress on private language boards.

## Project status

**Expanded documentation baseline ready for product-owner review; new-scope implementation is not yet authorized.**

The project owner approved the original implementation plan on July 14, 2026 and the expanded four-phase direction on July 16, 2026. The requirements, architecture, traceability, and delivery plan now describe that direction. Phase 1 begins only after explicit review approval. The existing responsive prototype remains in-memory demonstration data rather than proof of the expanded functionality.

### Current local preview

When the development or production server is running, open [http://localhost:3000](http://localhost:3000). The preview supports year navigation, day selection, in-memory entry creation/deletion, board switching, a statistics preview, and board/activity additions through the settings drawer.

## MVP summary

- Email/password authentication with email confirmation and password recovery.
- Private per-user data protected by Supabase Row Level Security.
- Up to six language boards per user.
- One global activity catalog per user, shared across all boards.
- Unlimited study entries per calendar day plus atomic, non-overwriting date-range creation of up to 366 entries.
- Exact durations from 1 to 1,440 minutes, with fixed quick-select values.
- Separate Study Time and Vocabulary yearly heatmaps with fixed, comparable intensity thresholds.
- One editable final vocabulary total per board and date.
- Board-specific totals, averages, active days, streaks, recent activity allocation, and time distributions.
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

## Source language

Code, identifiers, database objects, user-interface copy, and project documentation are written in English. Product discussions with the project owner may be conducted in Russian.
