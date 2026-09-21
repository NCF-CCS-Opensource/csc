# Provisioning (manual, one-time)

Everything code-side is scaffolded. These steps need your own Heroku and Vercel accounts — an agent can't run them without your credentials.

The current public test-production web/API domain is `https://attendance.ncfccs.org`. For repeat deployments to that environment, use the [test-production deployment runbook](./README.md).

## 1. Heroku Postgres provisioning

The provider is a configuration value, not a commitment (ADR-0018) — any managed Postgres reachable by a connection string works. Heroku Postgres Essential-0 is the host chosen now because it never pauses on inactivity.

1. Create a Heroku app (or reuse one) and add the addon:
   ```bash
   heroku addons:create heroku-postgresql:essential-0 --app <your-app>
   ```
2. Read the connection string:
   ```bash
   heroku config:get DATABASE_URL --app <your-app>
   ```
   Heroku Postgres uses a self-signed certificate, so append `?sslmode=no-verify` if it is not already present.
3. Set that value as `DATABASE_URL` in Vercel Project Settings > Environment Variables (Production), and in your local `.env` for migrations. No separate pooled/direct pair exists — one URL serves both runtime queries and migrations. `apps/web/lib/db.ts` reads `process.env.DATABASE_URL` directly.
4. No Auth variables are needed from the database host. Identity is Clerk for both `apps/web` and `apps/mobile` (step 6); Postgres is strictly a data store (ADR-0012, ADR-0018).

## 2. Run the Drizzle migrations

`pnpm --filter @attendance/db ...` runs with cwd `packages/db/`, and drizzle-kit only auto-loads `.env` from its own cwd — it will **not** see a `.env` at the repo root and fails with `Please provide required params for Postgres driver: [x] url: undefined`. Symlink it once:

```bash
cd packages/db && ln -sf ../../.env .env && cd ../..
```

Then:

```bash
pnpm --filter @attendance/db db:generate   # writes packages/db/migrations from src/schema.ts (only needed after a schema change)
pnpm --filter @attendance/db db:migrate    # applies migrations against DATABASE_URL (or POSTGRES_URL)
```

`students`, `programs` (seeded with the 4 defaults: `Computer Science`, `Information Technology`, `Information System`, `ACT`), `enrollment_roster`, `semesters`, `events`, `attendance_sessions`, `scans`, `penalties`, and `payments` exist. Verify with `heroku pg:psql --app <your-app> -c '\dt'`.

## 2b. Import the official enrollment roster (513 students)

The official CCS enrollment list (`Enrollment List.xlsx`) must be loaded into the `enrollment_roster` table. This allows students to immediately claim their student records when logging in via `@gbox.ncf.edu.ph` Google SSO:

```bash
DATABASE_URL="<your-heroku-connection-string>" node packages/db/scripts/import-enrollment-roster.mjs "Enrollment List.xlsx"
```

Verify with `heroku pg:psql --app <your-app> -c 'select count(*) from enrollment_roster;'` that **513 rows** are present across BSCS, BSIT, BSIS, and ACT programs.

> [!IMPORTANT]
> Do **not** run `seed-all-roster-students.mjs` on production. Production student records must be created organically through Clerk Google SSO onboarding so each student's record is tied to their real Clerk user ID. `seed-all-roster-students.mjs` is strictly for local Docker and staging test environments.

## 1b. Bootstrap the Governor account

There's no in-app way to create a Governor. Set `GOVERNOR_EMAILS` (comma-separated `@gbox.ncf.edu.ph` addresses) in `.env` / Vercel *before* that person signs in — the role is granted at Student-record creation, i.e. when they submit the onboarding form (`apps/web/app/(marketing)/onboarding/actions.ts`). A Governor completes the same Program / Student ID onboarding as anyone else.

⚠️ **The list is consulted once, and only once.** If the Governor signs in and completes onboarding *before* `GOVERNOR_EMAILS` is set (or with their address missing/misspelled in it), their record is created as a plain `student` and setting the variable afterwards changes nothing — nothing re-reads it. Recovery is a **manual database edit**:

```sql
update students set role = 'governor' where email = 'governor@gbox.ncf.edu.ph';
```

Set the variable *and redeploy* before the first sign-in to avoid this.

## 3. Deploy apps/api to Heroku

`apps/api` (NestJS, ADR-0017) is the workload that owns the domain, use cases, persistence, and authorization — it needs its own Heroku app, separate from the Postgres addon's app if you split them.

1. Create the app (skip if reusing the one from step 1):
   ```bash
   heroku create <api-app-name>
   ```
2. Set its environment:
   ```bash
   heroku config:set --app <api-app-name> \
     DATABASE_URL=<the Heroku Postgres connection string, with ?sslmode=no-verify> \
     CLERK_SECRET_KEY=<Clerk server key>
   ```
   `PORT` is set by Heroku; `apps/api/src/main.ts` falls back to `3001` when unset.
3. Deploy. The repository-root `Procfile` (`web: node apps/api/dist/main.js`) and `heroku-postbuild` (`turbo run build --filter=api...`) are what Heroku's Node buildpack reads — no `app.json` or extra config needed:
   ```bash
   git push heroku main
   ```
4. Verify the identity route is reachable and refuses without a token:
   ```bash
   curl -i https://<api-app-name>.herokuapp.com/v1/api/student/identity
   ```
   Expected result: HTTP `401`.

## 4. Deploy apps/web to Vercel

1. https://vercel.com/new, import this repo, set **Root Directory** to `apps/web`.
2. Framework preset: Next.js (auto-detected).
3. With `DATABASE_URL` set from step 1, add the remaining variables in Vercel project settings:
   - `API_URL` — the `apps/api` origin from step 3 (e.g. `https://<api-app-name>.herokuapp.com`); `apps/web`'s server actions proxy identity/roster/program calls here (ADR-0019)
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`
   - `GOVERNOR_EMAILS` (e.g. `governor@gbox.ncf.edu.ph`)
   - `GEMINI_API_KEY` (optional, for report narrative generation)
   *(Note: `EXPO_PUBLIC_*` variables are mobile-only and belong in `apps/mobile/.env`, not Vercel).*
4. Deploy. Then add the deployed origin (`https://attendance.ncfccs.org` or your Vercel URL) to Clerk's allowed domains for this instance and redeploy if you changed any variable.
5. **If `/onboarding` (or any DB-backed page) fails to load after deploy**: it's almost always step 2's migration never having actually run against this Heroku database (check `heroku pg:psql` for the 9 tables), or a missing/stale env var in this Vercel project (not your local `.env`).
6. **If web sign-in fails or bounces back to `/sign-in`**: check, in order — (a) the Clerk keys are set in *this* Vercel project (not just local `.env`), redeployed after setting them; (b) the deployed origin is allowed on the Clerk instance; (c) Clerk's Google connection is enabled and its sign-up restriction still allows `@gbox.ncf.edu.ph`.
7. **If web loads but data-dependent actions fail**: confirm `API_URL` in this Vercel project points at a live, reachable `apps/api` deployment (step 3) — web has no database access of its own (ADR-0019).

### Custom domain via Cloudflare DNS

The current test-production domain is `attendance.ncfccs.org`. Vercel > Project Settings > Domains > add your domain shows the exact records it needs. Common failure: Cloudflare's proxy (orange cloud) intercepts the record, so Vercel can't verify it.

1. In Cloudflare DNS, click the record's cloud icon to set it to **grey ("DNS only")** — at least until verified.
2. Match Vercel's listed records exactly: root domain → `A` → `76.76.21.21`; `www`/subdomain → `CNAME` → `cname.vercel-dns.com`.
3. Wait a few minutes, Vercel auto-rechecks (or hit "Refresh" on the domain).
4. To re-enable Cloudflare's proxy afterward, set Cloudflare SSL mode to **Full (strict)** first, or you'll get cert/redirect errors.

## 5. apps/mobile (Officer booth app)

1. Set `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (step 6) and `EXPO_PUBLIC_API_BASE_URL=https://<api-app-name>.herokuapp.com` in `apps/mobile/.env`, the same `apps/api` origin from step 3. `/v1/api/event/list` and `/v1/api/scan/*` resolve against it, authenticated with the Officer's Clerk session token as a Bearer credential.
2. Officers sign in with their school Google account. The flow opens in the system browser (Google blocks OAuth in an embedded WebView) and returns through the `attendkita://` scheme declared in `apps/mobile/app.json`, so add that redirect to Clerk's allowed redirect URLs in step 6.
3. `npx expo run:ios` / `run:android` for a dev build (`expo-camera` needs a native build, not Expo Go), or `eas build` for a real device.
4. Verify against the live test-production database and a physical device/camera; repository checks only cover typecheck and app-level logic (`pnpm --filter web test`).

## 6. Clerk + Google (identity)

Identity is Clerk with Google SSO; Supabase is no longer an identity provider (ADR-0012). One Clerk instance serves both `apps/web` and `apps/mobile`.

**a. Google OAuth credentials (do this first)** — Clerk ships shared development credentials that work out of the box but are not production-safe and cannot carry the settings below. Use the project's own:

1. https://console.cloud.google.com > APIs & Services > Credentials > Create credentials > **OAuth client ID**, type **Web application**.
2. Authorized redirect URI: the one Clerk shows on its Google connection screen (step b.3) — copy it verbatim, it is instance-specific.
3. Copy the **Client ID** and **Client secret**.

**b. Clerk application**

1. https://dashboard.clerk.com > create an application.
2. **User & Authentication > Email, Phone, Username**: disable every sign-in method — email/password, email code, username, phone. Google must be the only way in.
3. **User & Authentication > Social Connections > Google**: enable it, switch **"Use custom credentials" on** (it is off by default, which means Clerk's shared development credentials) and paste the Client ID/secret from step a. Copy the redirect URI shown here back into the Google console if you have not already.
4. On that same Google connection, set the **hosted domain (`hd`) hint** to `gbox.ncf.edu.ph`. This only pre-filters Google's account picker to school accounts — it is a convenience, **not** a restriction: a user can still complete the flow with a personal account. Enforcement is step b.5 plus the application-side check at onboarding.
5. **User & Authentication > Restrictions**: set sign-up mode to **Allowlist** and add the domain `@gbox.ncf.edu.ph`. This is what actually rejects a non-school account, before a session exists.
6. **API keys**: copy the **Publishable key** into `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (root `.env`, Vercel) and `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (`apps/mobile/.env`) — same value, two names. Copy the **Secret key** into `CLERK_SECRET_KEY` (root `.env`, Vercel; server-only, never ship to a client).

Development instances issue `pk_test_*` / `sk_test_*` keys. Going to a real production domain means a **production instance** in Clerk with its own keys and its own Google OAuth client — repeat steps a and b for it, and re-enter the new keys in Vercel.
