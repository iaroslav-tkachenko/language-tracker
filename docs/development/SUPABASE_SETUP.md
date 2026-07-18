# Supabase Setup and Phase 0 Verification

This guide connects Language Tracker to Supabase without committing credentials. The hosted-project path is recommended for product review. A local Docker-based stack is used for repeatable database and RLS tests.

## 1. Prerequisites

- Node.js 22
- pnpm 10.22
- A Supabase account
- Docker Desktop or another Docker-compatible runtime for local database tests

The repository, package store, Playwright browsers, and project-controlled caches must remain on drive `D:` on the owner's Windows machine.

## 2. Create the hosted project

1. Create a new project in the Supabase dashboard.
2. Choose a nearby region.
3. Generate a strong database password and store it in a password manager.
4. Wait until the database reports that it is ready.
5. Open the project's API settings and copy:
   - the project URL;
   - the publishable key, never the service-role or secret key.

## 3. Configure the application

Create `.env.local` from `.env.example` and replace the placeholders:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`.env.local` is ignored by Git. Do not place a service-role key in any `NEXT_PUBLIC_*` variable.

## 4. Configure authentication URLs

In the Supabase authentication URL configuration:

1. Set the local site URL to `http://localhost:3000`.
2. Add `http://localhost:3000/auth/callback` to the redirect allow-list.
3. Add the exact Vercel preview and production callback URLs when those environments exist.

Email confirmation remains enabled. Production launch also requires a production SMTP provider; Supabase's development email delivery is not a production mail service.

## 5. Apply version-controlled migrations

Authenticate the Supabase CLI and link the repository to the project:

```powershell
node scripts/run-supabase.mjs login
node scripts/run-supabase.mjs link --project-ref YOUR_PROJECT_REF
node scripts/run-supabase.mjs db push
```

Review the migration list before confirming a remote push. Never use `db reset` against the hosted project.

## 6. Run the local database verification

Start Docker Desktop, then run:

```powershell
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:types
```

Expected results:

- both Phase 0 migrations apply from an empty database;
- every pgTAP assertion passes;
- RLS prevents cross-user reads and writes;
- direct board/activity inserts are denied;
- study entries cannot use archived or foreign resources;
- `src/lib/database.types.ts` is regenerated from the resulting schema.

Stop the local stack when it is not needed:

```powershell
pnpm db:stop
```

## 7. Run application checks

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

The authentication Playwright baseline covers desktop and mobile sign-in navigation, sign-up, recovery, and accessible validation. Connected-project journeys for confirmation email, authenticated redirects, sign-out, and password recovery are added after hosted credentials and an email test path are available.

## 8. Phase 0 completion evidence

Phase 0 can close only after all of the following are recorded:

- a clean local database reset;
- passing pgTAP schema and RLS tests;
- generated database types committed from the verified schema;
- successful sign-up, confirmation, sign-in, sign-out, and recovery against a non-production Supabase environment;
- passing formatting, lint, TypeScript, unit, Playwright, and production-build checks;
- no secret or service-role key in Git or browser code.
