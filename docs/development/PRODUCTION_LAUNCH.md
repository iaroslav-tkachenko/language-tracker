# Production Launch Runbook

This runbook takes Language Tracker from the merged MVP to a small, usable
production release. Complete the phases in order and record evidence before
advancing. Production user data must never be reset as part of a deployment.

## Release status

| Phase | Name                      | Status      |
| ----- | ------------------------- | ----------- |
| R0    | Release preflight         | Complete    |
| R1    | Database safety           | Complete    |
| R2    | Production authentication | Complete    |
| R3    | Hosting and domain        | Complete    |
| R4    | Release quality gate      | Complete    |
| R5    | Production smoke test     | Not started |
| R6    | Operations and recovery   | Not started |
| R7    | Soft launch               | Not started |

## Non-negotiable data rules

- Use separate Supabase projects for development and production.
- Apply every schema change through a reviewed, version-controlled migration.
- Never run `pnpm db:reset` against a linked hosted production project.
- Never replace or reseed production tables to deploy application code.
- Back up production before a migration and verify the restore path before launch.
- Prefer additive migrations. For destructive changes, migrate data first and
  remove obsolete fields only in a later release.
- Do not expose a service-role or secret key through a `NEXT_PUBLIC_*` variable.

## Selected environment topology

The product owner selected a separate production project on August 10, 2026.

| Environment | Supabase organization    | Plan | Project                        | Region                |
| ----------- | ------------------------ | ---- | ------------------------------ | --------------------- |
| Development | `iaroslav_tkachenko_org` | Free | `Language Tracker Development` | Ireland (`eu-west-1`) |
| Production  | `iaroslav_tkachenko_org` | Free | `Language Tracker Production`  | Paris (`eu-west-3`)   |

The product owner requires the production project to remain on the Free plan.
Supabase currently permits two active Free projects; a paused project does not
count toward that limit. Both environments may therefore remain in the existing
Free organization while keeping separate databases, Auth users, and API keys.

Free projects may be paused after a low-activity seven-day period and do not
include downloadable automatic database backups. Production operations must
monitor pause-warning emails and use scheduled manual exports. A normal Vercel
health check does not prove that the database has remained active.

## R0 - Release preflight

Goal: prove that the repository is ready to become a release candidate.

- [x] Work from a clean branch based on current `main`.
- [x] Run `pnpm format:check`.
- [x] Run `pnpm lint`.
- [x] Run `pnpm typecheck`.
- [x] Run `pnpm test` (121 tests).
- [x] Run `pnpm build`.
- [x] Confirm `.env.local` is ignored and not tracked.
- [x] Confirm no production service-role key is present in Git or browser code.
- [x] Add this launch runbook to the release branch.

Exit: application checks pass and the release process is documented.

## R1 - Database safety

Goal: prove that the complete schema can be built safely and preserves ownership.

Owner action required in the Supabase Dashboard:

1. Open [Create project](https://supabase.com/dashboard/new) and select the existing
   `iaroslav_tkachenko_org` Free organization.
2. Create `Language Tracker Production` in the European region selected by Supabase.
3. Generate a unique database password and save it in the owner's password manager.
   Never send or commit this password.
4. Wait for project status `ACTIVE_HEALTHY`, then share only the project ref from the
   dashboard URL. The project ref and publishable key are not secrets.

After the project exists, the engineer will inspect the empty migration history,
link deliberately, apply the repository migrations once, verify RLS, and return the
repository to its development-safe state.

- [x] Start the local Supabase stack with `pnpm db:start`.
- [x] Rebuild only the local database with `pnpm db:reset`.
- [x] Run all 118 pgTAP tests with `pnpm db:test`.
- [x] Generate local types with `pnpm db:types` and confirm no schema diff.
- [x] Review every migration in `supabase/migrations` in timestamp order.
- [x] Confirm RLS is enabled for every user-facing table and Security Advisor has no
      unresolved critical finding. The production review found zero errors. Direct
      Data API access to Supabase's automatic-RLS event-trigger helper is removed by
      migration `20260810000200_restrict_automatic_rls_helper.sql`.
- [x] Select a separate Free production project in the existing Free organization.
- [x] Create the `Language Tracker Production` project in Paris (`eu-west-3`).
- [x] Record project ref `fbkwirzlvyaykrimpqhy`; the database password remains only
      in the owner's password manager.
- [x] Document the manual Free-plan backup and restore-rehearsal commands before
      real user data is created.
- [x] Create the first AES-256-GCM encrypted production backup and verify its
      external SHA-256 checksum.
- [x] Restore the first backup into an isolated local Supabase baseline database,
      verify representative Auth and application row counts, and remove the test
      database and every plaintext temporary file.
- [x] Link deliberately, confirm empty remote history, then apply all ten migrations
      with `pnpm db:push`.
- [x] Confirm remote migration history matches all local migrations.
- [x] Generate linked database types and confirm no schema difference. The hosted
      generator adds only its PostgREST-version metadata.

Exit: clean local replay and pgTAP pass; production schema is migrated without seed
or reset operations; backup and restore ownership are assigned.

### Security Advisor review

The application intentionally exposes eight `SECURITY DEFINER` RPC functions to
the `authenticated` role. They implement atomic operations that cannot be expressed
safely as direct table writes. Each function has an empty fixed `search_path`,
derives or verifies ownership with `auth.uid()`, rejects cross-user resources, and
is covered by database authorization tests. `PUBLIC` and `anon` execution are
revoked. Supabase Security Advisor reports authenticated execution as a warning;
these eight warnings are accepted because removing the grants would break the
corresponding signed-in workflows.

Supabase Free does not include leaked-password protection. Keep strong password
validation, confirmed email ownership, custom SMTP, and tested password recovery;
record the Advisor warning as a Free-plan limitation rather than silently treating
the control as enabled.

The August 10 production hardening removed direct Data API execution of
`rls_auto_enable()` and verified the resulting privilege from a schema-only dump.
After rerunning the Advisor, the expected baseline is nine accepted warnings: eight
authenticated application RPCs and the Free-plan leaked-password limitation.

### Free-plan backup procedure

Supabase recommends regular CLI exports and off-site copies for Free projects.
Run the repository workflow before every production migration and at least weekly
while the service contains user data:

```powershell
pnpm backup:production
```

The command deliberately links project `fbkwirzlvyaykrimpqhy`, creates the three
Supabase-recommended logical dumps (`roles.sql`, `schema.sql`, and `data.sql`), and
immediately unlinks the project. It packages a manifest with SHA-256 checksums,
encrypts the package with AES-256-GCM, and removes every plaintext temporary file.
The passphrase must contain at least 16 characters, must be stored in the owner's
password manager, and must never be sent through chat or committed to Git.

Every backup is written to the ignored `backups/` directory as an `.ltbak` file
with a `.sha256` sidecar. Copy both files to private off-site storage after the
workflow succeeds. The encrypted backup contains Auth records, email addresses,
and password hashes; do not place it in a public repository or shared folder.

The same workflow decrypts the new archive, validates every member checksum, and
restores `schema.sql` and `data.sql` into an isolated local database named
`language_tracker_restore_test`. The database is deleted after verification.
`roles.sql` is checksum-verified but is not replayed into the shared local cluster,
whose Supabase-managed roles already exist. To rehearse an existing archive again:

```powershell
pnpm backup:verify -- backups\language-tracker-production-TIMESTAMP.ltbak
```

A backup is complete only when the command prints
`Backup checksums and isolated local database restore passed.` and the encrypted
file has been copied off the development machine.

The first encrypted backup and local restore rehearsal completed on August 10, 2026. Artifact `language-tracker-production-20260810T194334Z.ltbak` has SHA-256
`5c677aceb189c3f4ec58cfddf560c11ed8113e96c258f6134b790696ce183a47`. The restored
database contained one Auth user, one profile, one language board, ten activity
types, and zero Study Time, Vocabulary, and CEFR records, matching the production
state at capture time. The production CLI link, plaintext dumps, and isolated test
database were removed after verification. Copying the encrypted artifact and its
checksum to private off-site storage was confirmed on August 10, 2026. R6 retains
ownership of recurring backups and periodic restore rehearsals.

## R2 - Production authentication

Goal: make signup, confirmation, sign-in, recovery, and sign-out reliable on the
real domain.

**Completed August 10, 2026.** The canonical production deployment uses custom
Brevo SMTP with a dedicated verified sender. A real external account completed
signup, email confirmation, sign-out, password recovery, password update, and
sign-in with the new password without callback errors.

1. Set Supabase Auth Site URL to the canonical HTTPS production origin.
2. Add the exact production callback URL to the redirect allow-list.
3. Add only deliberate Preview and localhost patterns; do not use a broad production
   wildcard.
4. Configure a production SMTP provider such as Resend, Postmark, or Brevo.
5. Verify the sender domain, SPF, DKIM, and DMARC with the mail provider.
6. Configure the Confirm signup and Reset password templates documented in
   `SUPABASE_SETUP.md`.
7. Set appropriate Auth rate limits and keep leaked-password protection enabled when
   the selected Supabase plan supports it.
8. Test links in a different browser/device from the one that requested the email.

Exit: a new external email address can complete signup and password recovery on the
production domain without callback errors.

## R3 - Hosting and domain

Goal: deploy one immutable release candidate before exposing it to users.

**Completed August 10, 2026.** Vercel serves the application at
`https://language-tracker-phi.vercel.app`. The canonical URL is configured as
`NEXT_PUBLIC_SITE_URL` in the Production environment only, and both public
Supabase variables point to project `fbkwirzlvyaykrimpqhy`. Preview deployments
do not receive production database variables.

1. Import the GitHub repository into Vercel and select the Next.js preset.
2. Set `main` as the Production Branch.
3. Configure these variables separately for Preview and Production:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://PRODUCTION_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=PRODUCTION_PUBLISHABLE_KEY
   NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
   ```

4. Do not add a Supabase service-role key; the current app does not require one.
5. Deploy the release branch to Preview and inspect build logs.
6. Attach the custom domain, configure DNS, and wait for HTTPS to become valid.
7. Redeploy after changing environment variables; existing deployments do not receive
   environment changes retroactively.
8. Keep automatic Production deployment from `main` disabled until R4 is complete, or
   use a deliberate promotion step.

Exit: Preview uses the intended production services and the production domain is ready
without yet inviting users.

## R4 - Release quality gate

Goal: run the same automated and human checks required for a product release.

- [x] GitHub Actions `application`, `database`, and `browser` jobs pass. PR #13
      completed all five required GitHub and Vercel checks.
- [x] Local application checks pass: formatting, linting, TypeScript, 121 unit tests,
      and the production Next.js build.
- [x] Local database reset and all 118 pgTAP assertions pass.
- [x] Playwright critical journeys pass on desktop and mobile Chromium: 24 of 24
      tests passed in CI mode with one worker on August 10, 2026.
- [x] Authentication is manually verified with real email delivery. The production
      signup, confirmation, sign-out, recovery, password update, and new-password
      sign-in journey completed during R2.
- [x] Public production authentication screens pass desktop and mobile Chromium
      smoke checks: successful responses, labelled form controls, no horizontal
      overflow, and no runtime or console errors.
- [x] Study Time, Vocabulary, Level, Statistics, Settings, and theme switching were
      checked on desktop and a physical phone and approved by the owner on August 10, 2026.
- [x] Keyboard navigation, focus visibility, labels, contrast, overflow, and touch
      targets were reviewed as part of the owner approval.
- [x] Representative multi-year data and more than six activities render correctly.
- [x] No browser console error, failed application request, or exposed secret remains.
      A tracked-file secret scan found only the expected `.env.example` template and
      no production credentials, private keys, or backup artifacts.

Exit: the owner approves the exact deployment that will be promoted.

## R5 - Production smoke test

Goal: confirm the public system works end to end after promotion.

Use a dedicated smoke-test account and one temporary board.

1. Open the canonical domain in a private desktop window and on a physical phone.
2. Sign up, confirm email, sign in, recover the password, and sign out.
3. Create and rename a board; create, rename, archive, and restore a custom activity.
4. Add, edit, and delete a Study Time session.
5. Add and edit a Vocabulary total.
6. Set a CEFR level and inspect Statistics and forecasts.
7. Switch system/light/dark themes and refresh.
8. Confirm another account cannot read the smoke account's data.
9. Archive test data through the UI; do not clean production with SQL deletion.

Exit: every critical journey succeeds on the canonical domain.

## R6 - Operations and recovery

Goal: know how to detect and recover from failures without erasing user progress.

- Assign an owner for Supabase, Vercel, DNS, SMTP, and GitHub access.
- Enable billing and usage alerts before public invitations.
- Check Vercel runtime logs, Supabase logs, Auth logs, database health, and SMTP
  delivery after each release.
- Schedule manual logical database exports because the Free plan does not include
  downloadable automatic backups.
- Perform a manual export and restore rehearsal into a local or separate
  non-production database.
- Monitor Supabase pause-warning emails and record the dashboard resume procedure.
- Roll back application failures by promoting the previous Vercel deployment.
- Fix database failures with a reviewed forward migration; do not run an improvised
  production reset or destructive rollback.
- Keep a short incident log with time, impact, action, and resolution.
- Publish a contact path and appropriate privacy information before collecting public
  user emails and learning records.

Exit: monitoring, backup, restore, rollback, ownership, and user-contact procedures are
tested and written down.

## R7 - Soft launch

Goal: expose the service gradually and validate real usage safely.

1. Invite a small named group first.
2. Watch signup delivery, callback failures, database errors, latency, and quotas.
3. Collect usability feedback without inspecting private learning data.
4. Fix release blockers through migrations and normal deployments.
5. Expand access only after several stable days and one verified backup.

Exit: the service is usable by invited users, operational signals are healthy, and no
manual production-data cleanup is required.

## Official references

- [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase deployment and branching](https://supabase.com/docs/guides/deployment)
- [Supabase Auth redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase database advisors](https://supabase.com/docs/guides/database/database-advisors)
- [Supabase database function privileges](https://supabase.com/docs/guides/database/functions)
- [Supabase CLI backup and restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase plan feature comparison](https://supabase.com/pricing)
- [Vercel environments](https://vercel.com/docs/deployments/environments)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
