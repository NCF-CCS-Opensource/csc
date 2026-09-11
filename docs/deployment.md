# Deployment Runbook

This is the DevOps entry point for CCS Attendance. It summarizes the repeatable release path and links to the retained environment-specific instructions:

- [Test-production details](./setup/README.md)
- [One-time provisioning](./setup/provisioning.md)

## Target topology

| Workload | Platform | Repository path |
| --- | --- | --- |
| Web pages and `/api/*` | Vercel | `apps/web` |
| Auth and Postgres | Supabase | External managed project |
| DNS/custom domain | Cloudflare | External managed zone |
| Native booth app | Expo/Android or iOS native build | `apps/mobile` |

The documented test-production endpoint is `https://attendance.ncfccs.org`. Confirm the live target in Vercel before deploying; the repository does not verify external state.

A self-hosted alternative to the Vercel path exists in-repo as `docker-compose.yml` / `Dockerfile` (web) plus the `db`/`meta`/`studio` services (Supabase Postgres + Studio, no managed Auth/Storage/backups). See [Self-hosted Docker deployment](#self-hosted-docker-deployment) below; day-to-day local use of the same stack is [docs/setup/docker.md](./setup/docker.md).

## Prerequisites

- Node.js 20 or newer
- pnpm 11.12.0
- Access to the target Supabase, Vercel, and Cloudflare projects
- JDK 17 and an Android SDK for Android builds
- A reviewed release commit on `main`
- A database backup before any destructive migration

## Environment contract

### Vercel production

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `DATABASE_URL` / `POSTGRES_URL` | Supabase Postgres transaction-pooler connection (injected automatically when connected via Vercel Supabase integration) | Server only |
| `CLERK_SECRET_KEY` | Clerk server key — the web module's only identity provider | Server only |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk client key | Public |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` — keeps Clerk's redirects on the self-hosted page | Public |
| `GOVERNOR_EMAILS` | Comma-separated Governor allowlist, read at onboarding | Server only |

The web module no longer holds Supabase Auth variables: identity is Clerk (ADR-0012), and Supabase is strictly the Postgres and Storage host. Connecting Supabase to Vercel via the native integration automatically provides `POSTGRES_URL` (transaction pooled, port 6543) and `POSTGRES_URL_NON_POOLING` (direct, port 5432).

Never place `DATABASE_URL`, `POSTGRES_URL`, or a Supabase service-role key in an `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` variable.

### Mobile build

Create `apps/mobile/.env`:

```dotenv
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
EXPO_PUBLIC_API_BASE_URL=https://attendance.ncfccs.org
```

`EXPO_PUBLIC_API_BASE_URL` points to the deployed Next.js module, not Supabase. `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is the same Clerk publishable key as web (ADR-0012); mobile has no Supabase variable, identity and data both go through the Next.js module. Expo embeds these values at build time, so any change requires a rebuild.

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

1. Open the public web endpoint and sign in with a school Google account.
2. Complete onboarding as a new Pending Student and confirm it redirects to My Attendance with the QR already available.
3. Confirm no password or confirm-password field appears anywhere in the web app.
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

## Self-hosted Docker deployment

Use this path instead of Vercel when running the stack on your own host (VM, bare metal, etc.). It builds `apps/web` into the standalone `csc-web` image and runs it alongside a self-managed Postgres (the `public.ecr.aws/supabase/postgres` image, not Supabase's managed cloud — no automatic backups, PITR, or Auth/Storage APIs).

### Environment

Copy `.env.docker` to `.env` and fill in real values before deploying:

```bash
cp .env.docker .env
```

Required overrides for a real deployment (the file ships with local/dev defaults):

- `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — production Clerk keys, not the `sk_test_...` / `pk_test_...` dev keys
- `POSTGRES_PASSWORD` — replace the `postgres` default
- `GOVERNOR_EMAILS` — real Governor allowlist
- `EXPO_PUBLIC_API_BASE_URL` — the public origin mobile clients will hit, not `127.0.0.1`

`docker-compose.yml` reads these from the shell environment (via `${VAR:-default}`), so `export $(grep -v '^#' .env | xargs)` or an equivalent before `docker compose up`, or point compose at the file with `docker compose --env-file .env up -d`.

### Build and run

```bash
docker compose up -d --build      # db, meta, studio, web
# or: pnpm docker:up
```

`web` waits on `db`'s healthcheck. Studio (`STUDIO_PORT`, default 54323) is a local admin UI, not part of the production surface — don't expose it publicly without auth in front of it.

### Migrate

Point Drizzle at the running `db` container:

```bash
DATABASE_URL="postgresql://postgres:<POSTGRES_PASSWORD>@localhost:${POSTGRES_PORT:-54322}/postgres" \
  pnpm --filter @attendance/db db:migrate
```

### Update a running deployment

```bash
git pull
docker compose up -d --build web   # rebuild and replace only the web container
```

The `db` container is left untouched; run the migration step above before or as part of the rollout if the release includes a schema change (same ordering rule as the Vercel path).

### Logs and teardown

```bash
docker compose logs -f web
docker compose down                # add -v to also drop the Postgres volume (destroys data)
```

## Rollback

| Workload | Rollback |
| --- | --- |
| Web and routes (Vercel) | Promote the previous successful Vercel deployment |
| Web and routes (Docker) | `git checkout <previous-sha> && docker compose up -d --build web` |
| Mobile | Rebuild and redistribute the previous known-good commit |
| Database | No automatic down migration; restore only under an approved recovery plan or forward-fix with a new reviewed migration. On Docker, take your own `pg_dump`/volume backups — the self-hosted Postgres has no managed backup |
| Environment | Restore the previous values and redeploy/rebuild the affected workload |

If code depends on a newly applied schema, do not roll back only the web deployment without checking compatibility.

## Common failures

| Symptom | Check |
| --- | --- |
| DB-backed page fails after deploy | Confirm migrations reached the target Supabase project and Vercel has the current `DATABASE_URL` |
| Web sign-in fails or loops | Check the Clerk keys in this Vercel project, Clerk's Google connection, and the `@gbox.ncf.edu.ph` sign-up restriction |
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
