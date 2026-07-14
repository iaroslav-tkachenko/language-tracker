# Language Learning Time Tracker

A responsive web application for recording and reviewing time spent learning foreign languages. Each user maintains private language boards, logs one or more study entries for any calendar date, and reviews a GitHub-style yearly heatmap and board-specific statistics.

## Project status

**Specification complete; implementation not started.**

The product requirements, architecture, and implementation plan are documented, but no application scaffold, dependency, database migration, or product functionality may be added until the project owner explicitly approves the plan.

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

## Documentation

- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Repository instructions](AGENTS.md)

## Source language

Code, identifiers, database objects, user-interface copy, and project documentation are written in English. Product discussions with the project owner may be conducted in Russian.

