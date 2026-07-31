# Deployment Runbook

This is the DevOps entry point for CCS Attendance. It summarizes the repeatable release path and links to the retained environment-specific instructions:

- [Test-production details](./setup/README.md)
- [One-time provisioning](./setup/provisioning.md)

## Target topology

| Workload | Platform | Repository path |
| --- | --- | --- |
| Web pages and `/api/*` | Vercel | `apps/web` |
| Auth and Postgres | Supabase | External managed project |
| Auth SMTP and QR email | Resend | External managed account |
| DNS/custom domain | Cloudflare | External managed zone |
| Native booth app | Expo/Android or iOS native build | `apps/mobile` |

The documented test-production endpoint is `https://attendance.ncfccs.org`. Confirm the live target in Vercel before deploying; the repository does not verify external state.

## Prerequisites

- Node.js 20 or newer
- pnpm 11.12.0
- Access to the target Supabase, Vercel, Resend, and Cloudflare projects
- JDK 17 and an Android SDK for Android builds
- A reviewed release commit on `main`
- A database backup before any destructive migration

## Environment contract

### Vercel production

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase client key | Public |
| `DATABASE_URL` | Supabase Postgres transaction-pooler connection | Server only |
| `NEXT_PUBLIC_SITE_URL` | Public callback base, e.g. `https://attendance.ncfccs.org` | Public |
| `RESEND_API_KEY` | QR email delivery | Server only |
| `RESEND_FROM_EMAIL` | Verified sender | Server only |
| `GOVERNOR_EMAILS` | Comma-separated first-confirmation Governor allowlist | Server only |
| `SUPABASE_SERVICE_ROLE_KEY` | Listed by existing provisioning/runbook; not referenced by current source | Server only |

Never place `DATABASE_URL`, Resend credentials, or a Supabase service-role key in an `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` variable.

### Mobile build

Create `apps/mobile/.env`:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_BASE_URL=https://attendance.ncfccs.org
```

`EXPO_PUBLIC_API_BASE_URL` points to the deployed Next.js module, not Supabase. Expo embeds these values at build time, so any change requires a rebuild.

## Configure Resend for Supabase Auth email

Supabase's built-in sender is for testing: it sends only to authorized team addresses and is currently limited to two auth emails per hour. Production signup confirmations and password resets must use custom SMTP.

1. In [Resend Domains](https://resend.com/domains), add and verify a sending domain. Prefer a subdomain such as `auth.ncfccs.org`, then add the supplied DNS records in Cloudflare.
2. Create a Resend API key for transactional email.
3. In Supabase, open **Authentication → Emails → SMTP Settings**, enable custom SMTP, and enter:

   | Setting | Value |
   | --- | --- |
   | Sender email | `no-reply@auth.ncfccs.org` |
   | Sender name | `CCS Attendance` |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | Resend API key |

4. Save the SMTP settings, then open **Authentication → Rate Limits**. Custom SMTP starts with a conservative Supabase auth-email limit; raise it only to the expected signup/reset volume.
5. Use the same verified sender for application QR email by setting Vercel's `RESEND_FROM_EMAIL` to `CCS Attendance <no-reply@auth.ncfccs.org>`. `RESEND_API_KEY` remains server-only.
6. Test a new signup confirmation and a password reset with non-team addresses. Confirm delivery in Resend Logs before opening registration.

Resend's free transactional plan currently includes 3,000 emails per month but also has a 100-email daily limit. Auth and QR emails sent from the same Resend account share those quotas; multiple recipients count separately. Monitor the Resend Usage page and upgrade before either limit becomes operationally insufficient.

References: [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [Supabase Auth rate limits](https://supabase.com/docs/guides/auth/rate-limits), [Resend SMTP credentials](https://resend.com/docs/send-with-smtp), and [Resend quotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits).

## Release

### 1. Validate the release

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

Stop if any check fails.

### 2. Prepare a schema change

Skip this step when `packages/db/src/schema.ts` did not change.

```bash
pnpm --filter @attendance/db db:generate
git diff -- packages/db/migrations
```

Review and commit the generated SQL with the code that requires it. Do not deploy code ahead of its required migration.

### 3. Apply migrations

Drizzle runs with `packages/db` as its working directory. Create the ignored environment link once:

```bash
cd packages/db
ln -sf ../../.env .env
cd ../..
```

Apply every committed migration:

```bash
pnpm --filter @attendance/db db:migrate
```

Proceed only after the command reports successful application. A committed migration is not proof that the target database has it.

### 4. Deploy web and routes

The documented Vercel project uses:

- Root Directory: `apps/web`
- Framework: Next.js
- Production branch: `main`

Merge or push the release commit to `main`, then watch the Vercel deployment to completion. Redeploy after any environment-variable change.

Verify the public route is reachable without Vercel Deployment Protection:

```bash
curl -i https://attendance.ncfccs.org/api/events/mine
```

Expected result: JSON with HTTP `401`. A redirect to `vercel.com/sso-api` means the mobile app is blocked by Vercel SSO.

### 5. Build mobile

For Android:

```bash
cd apps/mobile
npx expo run:android
```

`android/local.properties` must point to the SDK:

```properties
sdk.dir=/absolute/path/to/Android/Sdk
```

The repository has no `eas.json` or checked-in mobile release pipeline. Signing, store distribution, and staged rollout remain external operational steps.

## Smoke test

Use disposable test data:

1. Open the public web endpoint and sign in.
2. Register a disposable non-team email and confirm its signup email arrives through Resend.
3. Request a password reset and confirm it also arrives through Resend.
4. Confirm Student navigation cannot open Officer/Governor pages.
5. Confirm an Officer can load all shared Events on web and mobile.
6. Create one Event and confirm it appears on both clients.
7. Approve one test scan on a physical device and confirm it leaves the Offline Scan Queue.
8. Retry the identical decision and confirm it does not change attendance again.
9. Reuse its UUID with different content and confirm the server returns conflict without changing attendance.
10. Force a disposable-test Penalty failure and confirm the Scan, Attendance Session, and Penalty transaction rolls back.
11. Confirm the Attendance Session and Penalty result on the Event attendance grid.
12. Try to update protected fields and delete the Event after attendance begins; confirm both are rejected without changing history.
13. Reject one test scan and confirm it appears in Governor rejection review.
14. Confirm a permanent queue rejection moves to Needs Review without blocking a later valid decision.
15. Confirm logout is blocked while pending or Needs Review decisions remain.
16. Confirm an Officer cannot open `/admin`.
17. Confirm a Governor can manage the active Semester and Program list and can enter the mobile booth.
18. Confirm a Student is rejected by mobile before booth tabs render.

Officer demotion, digital Clearance signing, a mobile Payment screen, and desktop viewport gates are outside this architecture refactor. Do not use them as release acceptance checks.

## Architecture-refactor rollout order

When deploying the approved architecture refactor:

1. Run the focused unit suite and disposable Postgres integration suite.
2. Apply the one-open-Semester and Event-lifecycle migrations before deploying code that depends on them.
3. Deploy the server role policy, Scan Approval transaction, and Event lifecycle commands.
4. Verify identical retry, conflicting UUID, transaction rollback, and Event-history protections against test data.
5. Build and distribute the mobile queue/Recent Scans/role-gate release only after the server contract is live.
6. Verify a pre-upgrade queued decision still synchronizes after upgrade.

## Rollback

| Workload | Rollback |
| --- | --- |
| Web and routes | Promote the previous successful Vercel deployment |
| Mobile | Rebuild and redistribute the previous known-good commit |
| Database | No automatic down migration; restore only under an approved recovery plan or forward-fix with a new reviewed migration |
| Environment | Restore the previous values and redeploy/rebuild the affected workload |

If code depends on a newly applied schema, do not roll back only the web deployment without checking compatibility.

## Common failures

| Symptom | Check |
| --- | --- |
| DB-backed page fails after deploy | Confirm migrations reached the target Supabase project and Vercel has the current `DATABASE_URL` |
| Confirmation/reset email is absent | Check `NEXT_PUBLIC_SITE_URL`, Supabase redirect allowlist, Resend SMTP, and spam |
| QR confirmation email fails | Check `RESEND_API_KEY`, verified `RESEND_FROM_EMAIL`, and Resend logs |
| Mobile route returns redirect/HTML | Disable Vercel Deployment Protection for the public route |
| Mobile route returns `401` | Confirm both clients use the same Supabase project and the access token is current |
| Mobile cannot reach routes | Confirm `EXPO_PUBLIC_API_BASE_URL` is the public web origin and rebuild |
| Drizzle reports missing URL | Confirm `packages/db/.env` points to the root `.env` |
| Android build cannot locate SDK | Fix `android/local.properties` and verify JDK 17 |

## Post-deploy record

Record outside this repository or in the release ticket:

- deployed commit SHA;
- Vercel deployment identifier;
- migration journal result;
- mobile build/version identifier;
- smoke-test operator and timestamp;
- backup identifier when a destructive migration was involved; and
- rollback target.
