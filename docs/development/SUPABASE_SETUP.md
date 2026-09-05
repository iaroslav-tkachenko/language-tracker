# Supabase Development Setup and Verification

This guide connects Language Tracker to Supabase without committing credentials. The hosted-project path is recommended for product review. A local Docker-based stack is used for repeatable database and RLS tests.

This document covers development and repeatable local verification. Before
touching a production project, follow the ordered safeguards in the
[production launch runbook](PRODUCTION_LAUNCH.md). In particular, never run a
database reset against a linked production project.

## 1. Prerequisites

- Node.js 22
- pnpm 10.22
- A Supabase account
- Docker Desktop or another Docker-compatible runtime for local database tests

In the project owner's Windows environment, the repository, package store,
Playwright browsers, and project-controlled caches remain on drive `D:`.
Other contributors may use an appropriate local path; the supplied wrappers
keep project-controlled Supabase state under the repository's ignored `.cache`
directory.

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

For the hosted development project, enable custom SMTP and verify:

- the sender address is verified by the SMTP provider;
- the host is the provider's SMTP relay host;
- the port is the provider's supported submission port (`587` for Brevo);
- the username is the provider's SMTP login, not the application name;
- the password is an SMTP key, not an account password or API key.

Never commit SMTP credentials to this repository.

For cookie-based SSR confirmation, update the following templates in
**Authentication > Email Templates**:

- **Confirm signup** link:

  ```html
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next=/dashboard"
    >Confirm email address</a
  >
  ```

- **Reset password** link:

  ```html
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/update-password"
    >Reset password</a
  >
  ```

The `/auth/confirm` Route Handler verifies the token hash and establishes the
cookie session. Do not use the default `{{ .ConfirmationURL }}` link for these
SSR flows because the email may be opened in a browser that does not have the
PKCE verifier cookie created by the original request.

## 5. Apply version-controlled migrations

Authenticate the Supabase CLI and link the repository to the project:

```powershell
pnpm db:login
pnpm db:link --project-ref YOUR_PROJECT_REF
pnpm db:migrations
pnpm db:push
pnpm db:types:linked
```

Review the migration list before running `pnpm db:push`. Never use `db reset` against the hosted project.

These package scripts intentionally run the repository wrapper instead of relying on a
global `node` or Supabase CLI command. On Windows, the wrapper keeps Supabase CLI cache
and login state under the repository's ignored `.cache/supabase-home` directory on drive
`D:`.

`pnpm db:types:linked` regenerates `src/lib/database.types.ts` from the linked
development project after its migrations have been applied. Use `pnpm db:types`
instead when verifying against the local Docker database.

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

The authentication Playwright baseline covers desktop and mobile sign-in
navigation, sign-up, recovery, accessible validation, and recoverable
authentication-link errors. On July 25, 2026, the hosted development project
also passed manual end-to-end verification for sign-up, email confirmation,
authenticated redirect, sign-out, sign-in, recovery email, and password update.

## 8. Phase 0 completion evidence

Phase 0 can close only after all of the following are recorded:

- a clean local database reset;
- passing pgTAP schema and RLS tests;
- generated database types committed from the verified schema;
- successful sign-up, confirmation, sign-in, sign-out, and recovery against a non-production Supabase environment;
- passing formatting, lint, TypeScript, unit, Playwright, and production-build checks;
- no secret or service-role key in Git or browser code.
