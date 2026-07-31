# Test-production deployment

This is the repeatable deployment runbook for the public test-production environment. For provisioning a new Supabase/Vercel/Resend stack, see [provisioning.md](./provisioning.md).

## Current environment

- Web and API: `https://attendance.ncfccs.org` (Vercel, custom domain through Cloudflare)
- Data, Auth, and Storage: Supabase
- Mobile: Expo native app; Supabase handles Auth, while `https://attendance.ncfccs.org/api/*` handles application API requests

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

The root `.env` must contain the test-production `DATABASE_URL`. Drizzle runs from `packages/db`, so create its ignored environment symlink once:

```bash
cd packages/db
ln -sf ../../.env .env
cd ../..
```

Apply every committed migration before deploying code that requires the new schema:

```bash
pnpm --filter @attendance/db db:migrate
```

Do not treat a merged migration as applied. Confirm the command reports `migrations applied successfully`; otherwise the deployed app and Supabase schema can drift.

## 3. Deploy the web app and API

Merging or pushing the release commit to `main` triggers the Vercel production deployment for `apps/web`.

The Vercel Production environment must contain:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL=https://attendance.ncfccs.org`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `GOVERNOR_EMAILS`

Redeploy after changing any Vercel environment variable. When deployment finishes, verify the public API is reachable without Vercel SSO:

```bash
curl -i https://attendance.ncfccs.org/api/events/mine
```

An unauthenticated request must return JSON with HTTP `401`. A `302` to `vercel.com/sso-api` means Deployment Protection is blocking the mobile app.

## 4. Build the mobile app

`apps/mobile/.env` must use the same Supabase project and the public web API:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://moczyanmgijiijwlzzkb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_API_BASE_URL=https://attendance.ncfccs.org
```

Do not point `EXPO_PUBLIC_API_BASE_URL` at Supabase: routes such as `/api/events/mine` and `/api/scan/approve` live in `apps/web`.

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
