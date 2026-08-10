# Production Launch Runbook

This runbook takes Language Tracker from the merged MVP to a small, usable
production release. Complete the phases in order and record evidence before
advancing. Production user data must never be reset as part of a deployment.

## Release status

| Phase | Name                      | Status      |
| ----- | ------------------------- | ----------- |
| R0    | Release preflight         | Complete    |
| R1    | Database safety           | In progress |
| R2    | Production authentication | Not started |
| R3    | Hosting and domain        | Not started |
| R4    | Release quality gate      | Not started |
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

| Environment | Supabase organization    | Plan | Project                        | Region                     |
| ----------- | ------------------------ | ---- | ------------------------------ | -------------------------- |
| Development | `iaroslav_tkachenko_org` | Free | `Language Tracker Development` | Ireland (`eu-west-1`)      |
| Production  | `iaroslav_tkachenko_org` | Free | `Language Tracker Production`  | Frankfurt (`eu-central-1`) |

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
2. Create `Language Tracker Production` in Frankfurt on the Free plan.
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
- [ ] Review every migration in `supabase/migrations` in timestamp order.
- [ ] Confirm RLS is enabled for every user-facing table and Security Advisor has no
      unresolved critical finding.
- [x] Select a separate Free production project in the existing Free organization.
- [ ] Create the `Language Tracker Production` project in Frankfurt (`eu-central-1`).
- [ ] Record the project reference and database password in the owner's password manager.
- [ ] Document the manual Free-plan backup command before real user data is created.
- [ ] Link deliberately, inspect `pnpm db:migrations`, then apply `pnpm db:push` once.
- [ ] Generate linked database types and confirm they match the committed schema.

Exit: clean local replay and pgTAP pass; production schema is migrated without seed
or reset operations; backup and restore ownership are assigned.

## R2 - Production authentication

Goal: make signup, confirmation, sign-in, recovery, and sign-out reliable on the
real domain.

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

- [ ] GitHub Actions `application`, `database`, and `browser` jobs pass.
- [ ] Playwright critical journeys pass on desktop and mobile Chromium.
- [ ] Authentication is manually verified with real email delivery.
- [ ] Study Time, Vocabulary, Level, Statistics, Settings, and theme switching are
      checked on desktop and a physical phone.
- [ ] Keyboard navigation, focus visibility, labels, contrast, overflow, and touch
      targets are reviewed.
- [ ] Representative multi-year data and more than six activities render correctly.
- [ ] No browser console error, failed application request, or exposed secret remains.

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
- [Vercel environments](https://vercel.com/docs/deployments/environments)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
