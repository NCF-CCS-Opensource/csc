# Test-production deployment

This is the repeatable deployment runbook for the public test-production environment. For provisioning a new Heroku/Vercel stack, see [provisioning.md](./provisioning.md). For local development and testing with Docker, see [docker.md](./docker.md).

## Current environment

- Web and API: `https://attendance.ncfccs.org` (Vercel, custom domain through Cloudflare)
- Data: Heroku Postgres Essential-0, always-on (ADR-0018; identity for both clients is Clerk)
- Mobile: Expo native app; Clerk signs Officers in, while `https://attendance.ncfccs.org/api/*` handles application API requests

Test production is public and uses real credentials. Treat its secrets and data with production care even though it is not the final production environment.

## 1. Check the release

From the repository root:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm --filter web test
pnpm build
```

If `packages/db/src/schema.ts` changed, generate and review the SQL before deploying:

```bash
pnpm --filter @attendance/db db:generate
git diff -- packages/db/migrations
```

Commit the migration with the code that needs it.

## 2. Apply database migrations

The root `.env` must contain the production `DATABASE_URL` (Heroku Postgres connection string, `?sslmode=no-verify`). Drizzle runs from `packages/db`, so create its ignored environment symlink once:

```bash
cd packages/db
ln -sf ../../.env .env
cd ../..
```

Apply every committed migration before deploying code that requires the new schema:

```bash
pnpm --filter @attendance/db db:migrate
```

Confirm the command reports `migrations applied successfully`; otherwise the deployed app and Heroku Postgres schema can drift.

## 2b. Import the official enrollment roster (513 students)

The CCS enrollment roster (`Enrollment List.xlsx`) contains the 513 official students. Import them into the production `enrollment_roster` table so that students' Google SSO logins can automatically claim their identity at onboarding:

```bash
# Against production database:
DATABASE_URL="<production-heroku-url>" node packages/db/scripts/import-enrollment-roster.mjs "Enrollment List.xlsx"
```

Verify with `heroku pg:psql --app <your-app> -c 'select count(*) from enrollment_roster;'` that **513 rows** are present.

> [!NOTE]
> Do **not** run `seed-all-roster-students.mjs` on production. That script is reserved for local testing and staging environments; in production, `students` rows are created with verified Clerk account IDs when each student signs in with their `@gbox.ncf.edu.ph` email for the first time.

## 3. Deploy the web app and API

Merging or pushing the release commit to `main` triggers the Vercel production deployment for `apps/web` (or `develop` for staging).

### Vercel environment

Set `DATABASE_URL` in Vercel Project Settings to the Heroku Postgres connection string (see [provisioning.md](./provisioning.md#1-heroku-postgres-provisioning)). `apps/web/lib/db.ts` reads it directly — no integration or automatic injection.

The remaining required variables in Vercel Project Settings are:

- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
- `GOVERNOR_EMAILS` (comma-separated `@gbox.ncf.edu.ph` addresses)
- `GEMINI_API_KEY` (optional, for report narrative generation)

Redeploy after changing any Vercel environment variable. When deployment finishes, verify the public API is reachable without Vercel SSO:

```bash
curl -i -X POST https://<api-heroku-app>.herokuapp.com/v1/api/student/identity
```

An unauthenticated request must return JSON with HTTP `401`.

## 4. Build the mobile app

`apps/mobile/.env` must use the same Clerk instance as the web app and the public API:

```dotenv
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_API_BASE_URL=https://<api-heroku-app>.herokuapp.com
```

`EXPO_PUBLIC_API_BASE_URL` must point at the deployed `apps/api` origin. Routes such as `/v1/api/event/list` and `/v1/api/scan/approve` verify the Clerk session token the app sends as a Bearer credential.

Expo embeds `EXPO_PUBLIC_*` values at build time, so rebuild after changing them:

```bash
cd apps/mobile
npx expo run:android
```

Android builds require JDK 17 and a valid SDK path in `android/local.properties`, for example:

```properties
sdk.dir=/home/your-user/Android/Sdk
```

## 5. Smoke test

- Open `https://attendance.ncfccs.org` and sign in.
- Create an Event and confirm it appears on web and mobile.
- Sign in to mobile as an Officer and load Events.
- Approve one test scan and confirm it syncs.
- Confirm Governor-only pages remain unavailable to Officers.

## Rollback

- Web/API: promote the previous successful Vercel deployment.
- Mobile: rebuild the previous known-good commit.
- Database: migrations have no automatic rollback. Back up before destructive migrations and forward-fix schema mistakes with a new reviewed migration.
