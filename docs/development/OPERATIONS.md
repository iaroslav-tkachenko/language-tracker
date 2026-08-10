# Production Operations

This runbook covers routine operation and recovery for the public Language Tracker
service. It supplements the ordered [production launch runbook](PRODUCTION_LAUNCH.md).
Never paste credentials into this file, an issue, a commit, or chat.

## Production inventory and ownership

| Service                                 | Purpose                  | Owner              | Recovery source                                    |
| --------------------------------------- | ------------------------ | ------------------ | -------------------------------------------------- |
| Supabase project `fbkwirzlvyaykrimpqhy` | Auth and PostgreSQL      | Iaroslav Tkachenko | Owner account, password manager, encrypted backups |
| Vercel project `language-tracker`       | Application hosting      | Iaroslav Tkachenko | GitHub integration and owner account               |
| Vercel canonical domain                 | Public application URL   | Iaroslav Tkachenko | Vercel project settings                            |
| Brevo                                   | Transactional auth email | Iaroslav Tkachenko | Owner account and verified sender                  |
| GitHub repository                       | Source, review, and CI   | Iaroslav Tkachenko | GitHub owner account and local clone               |

Store passwords, backup passphrases, recovery codes, and provider recovery details in
the owner's password manager. Before inviting a larger audience, designate a trusted
backup owner who can access recovery instructions if the primary owner is unavailable.

## Release checklist

Before merge:

1. Use a short-lived `codex/` branch and a reviewed pull request.
2. Run formatting, linting, TypeScript, relevant tests, and a production build.
3. Require the GitHub application, database, browser, and Vercel Preview checks.
4. Verify the Preview deployment on desktop and mobile.
5. Before a production database migration, run `pnpm backup:production`, verify the
   restore rehearsal, and copy `.ltbak` plus `.sha256` off the development machine.
6. Apply database changes only through version-controlled forward migrations. Never
   run `pnpm db:reset` against a linked hosted project.

After merge:

1. Confirm the production deployment is ready and the canonical URL responds.
2. Run the critical production smoke journey without SQL cleanup.
3. Check Vercel Runtime Logs for production `5xx` responses and runtime errors.
4. Check Supabase API, Postgres, and Auth logs plus Security and Performance Advisors.
5. Check Brevo transactional logs for rejected, deferred, or bounced auth email.
6. Record any incident and its resolution in the incident log below.

## Monitoring cadence on free plans

After every release, perform all post-merge checks above. Once a week:

- review Vercel Usage and recent production runtime errors;
- review Supabase usage, project health, Auth logs, and Advisor changes;
- review Brevo quota and failed transactional email;
- create an encrypted production backup and copy both artifacts off-site;
- confirm provider notification email still reaches the owner.

Once a month, verify a recent backup with `pnpm backup:verify -- <backup-path>` and
review account recovery details. Vercel Spend Management is a paid-plan feature, so
the Hobby deployment relies on the Usage page and provider limit notifications.
Supabase Free projects can pause after low activity; monitor the owner inbox for its
warning and pause emails.

## Backup and restore

Create and immediately restore-test a new encrypted logical backup:

```powershell
pnpm backup:production
```

Verify an existing encrypted archive:

```powershell
pnpm backup:verify -- backups\language-tracker-production-TIMESTAMP.ltbak
```

A backup is complete only after the script confirms checksum and isolated restore
success, and the `.ltbak` and `.sha256` files are copied to private off-site storage.
The passphrase remains in the password manager and is stored separately from the
archive. Never commit either artifact.

## Resume a paused Supabase Free project

1. Open the Supabase dashboard and select `Language Tracker Production`.
2. Choose **Resume project** and confirm.
3. Wait for the project to become healthy, then check Auth and database logs.
4. Open the canonical application URL and run sign-in plus one read-only board check.
5. If dashboard recovery is unavailable, preserve the latest encrypted backup and
   follow the provider's project-restore guidance before changing production.

Supabase currently warns the owner before an inactivity pause and retains dashboard
resume capability for a limited period. Do not treat platform retention as the
project's backup strategy.

## Application rollback

Use rollback only for an application regression. On Vercel Hobby, rollback is limited
to the immediately previous production deployment.

1. Confirm the regression in production logs and identify the current deployment.
2. In Vercel Deployments, open the previous known-good production deployment and use
   **Instant Rollback**, or run `vercel rollback` from a linked project.
3. Confirm rollback status and rerun the production smoke check.
4. Fix the issue on a branch, verify Preview, and deploy through a normal pull request.

Application rollback does not reverse a database migration. Database problems must be
fixed with a reviewed forward migration. Stop and assess before restoring data; never
improvise a destructive rollback or production reset.

## Incident log

Add one row per production incident. Do not include user content, credentials, access
tokens, or full email addresses.

| UTC time           | Impact                   | Detection         | Action               | Resolution              | Follow-up         |
| ------------------ | ------------------------ | ----------------- | -------------------- | ----------------------- | ----------------- |
| _YYYY-MM-DD HH:MM_ | _What users experienced_ | _Alert or report_ | _Immediate response_ | _How service recovered_ | _Preventive task_ |

## User contact and privacy

The public contact address is `language.tracker.app@gmail.com`. The application links
to `/privacy` from every page. Handle access, correction, and deletion requests without
placing private learning data in issue trackers or support screenshots.

## Official references

- [Supabase Free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Supabase Auth audit logs](https://supabase.com/docs/guides/auth/audit-logs)
- [Vercel Runtime Logs](https://vercel.com/docs/logs/runtime)
- [Vercel production rollback](https://vercel.com/docs/deployments/rollback-production-deployment)
