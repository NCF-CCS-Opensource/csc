# Provisioning (manual, one-time)

Everything code-side is scaffolded. These steps need your own Supabase, Vercel, and Resend accounts — an agent can't run them without your credentials.

## 1. Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Settings > API: copy `Project URL` and `anon public` key into `.env` as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (also `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` for `apps/mobile`). Copy `service_role` key as `SUPABASE_SERVICE_ROLE_KEY` (server-only, never ship to a client).
3. Settings > Database > Connection string ("Transaction" pooler, port 6543): copy into `.env` as `DATABASE_URL`.

## 2. Run the Drizzle migrations

`pnpm --filter @attendance/db ...` runs with cwd `packages/db/`, and drizzle-kit only auto-loads `.env` from its own cwd — it will **not** see a `.env` at the repo root and fails with `Please provide required params for Postgres driver: [x] url: undefined`. Symlink it once:

```bash
cd packages/db && ln -sf ../../.env .env && cd ../..
```

Then:

```bash
pnpm --filter @attendance/db db:generate   # writes packages/db/migrations from src/schema.ts (only needed after a schema change)
pnpm --filter @attendance/db db:migrate    # applies migrations against DATABASE_URL
```

`students`, `programs` (seeded with the 4 defaults), `semesters`, `events`, `attendance_sessions`, `scans`, `penalties`, and `payments` exist so far. Verify in Supabase dashboard > Table Editor, or from `packages/db`:

```js
// packages/db/verify.mjs — delete after running
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL);
console.log(await sql`select table_name from information_schema.tables where table_schema='public' order by table_name`);
await sql.end();
```

```bash
cd packages/db && node --env-file=.env verify.mjs && rm verify.mjs
```

## 1b. Bootstrap the Governor account

There's no in-app way to create a Governor. Set `GOVERNOR_EMAILS` (comma-separated `@gbox.ncf.edu.ph` addresses) in `.env` / Vercel *before* that person registers — the role is granted automatically the first time they confirm their email (`apps/web/app/auth/callback/route.ts`).

Supabase dashboard > Authentication > Providers > Email: **Confirm email** must be enabled — Students can't sign in with their password until they've clicked the confirmation link (ADR-0003).

## 3. Deploy apps/web to Vercel

1. https://vercel.com/new, import this repo, set **Root Directory** to `apps/web`.
2. Framework preset: Next.js (auto-detected).
3. Add all `.env.example` vars in Vercel project settings — Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`), `DATABASE_URL`, `NEXT_PUBLIC_SITE_URL`, Resend, `GOVERNOR_EMAILS`. Vercel doesn't read your local `.env` — these must be entered in the dashboard, and adding/editing one after the first deploy needs a redeploy to take effect. `EXPO_PUBLIC_*` vars don't belong here — they're mobile-only, go in `apps/mobile/.env`.
4. Deploy. `NEXT_PUBLIC_SITE_URL` is chicken-and-egg — deploy once to get the `*.vercel.app` URL, then set it and redeploy. If you're putting a custom domain on it (below), use that domain, not the `*.vercel.app` one.
5. **If `/register` (or any DB-backed page) fails to load after deploy**: it's almost always step 2's migration never having actually run against this Supabase project (check Table Editor for the 8 tables), or a missing/stale env var in this Vercel project (not your local `.env`).
6. **If registration "succeeds" but no confirmation/reset email ever arrives**: check, in order — (a) `NEXT_PUBLIC_SITE_URL` is actually set in *this* Vercel project (not just local `.env`) and matches the domain you're testing against, redeployed after setting it; (b) Supabase dashboard > Authentication > URL Configuration > **Redirect URLs** includes `<NEXT_PUBLIC_SITE_URL>/auth/callback` — Supabase silently drops the email if the redirect isn't on this allow-list, no error surfaces to the app; (c) step 4a's SMTP is actually saved (send a test email from that same Supabase screen); (d) spam folder.

### Custom domain via Cloudflare DNS

Vercel > Project Settings > Domains > add your domain shows the exact records it needs. Common failure: Cloudflare's proxy (orange cloud) intercepts the record, so Vercel can't verify it.

1. In Cloudflare DNS, click the record's cloud icon to set it to **grey ("DNS only")** — at least until verified.
2. Match Vercel's listed records exactly: root domain → `A` → `76.76.21.21`; `www`/subdomain → `CNAME` → `cname.vercel-dns.com`.
3. Wait a few minutes, Vercel auto-rechecks (or hit "Refresh" on the domain).
4. To re-enable Cloudflare's proxy afterward, set Cloudflare SSL mode to **Full (strict)** first, or you'll get cert/redirect errors.

## 4. Resend — two separate uses

Same Resend account, two different credentials:

**a. SMTP for Supabase Auth's own confirmation/reset-password emails** (sent on registration and on forgot-password, per ADR-0003):

1. https://resend.com — add and verify the `ncfccs.org` domain (DNS records on Cloudflare per ADR 0001).
2. Resend > API Keys: create a key with sending access.
3. Supabase dashboard > Authentication > Emails > SMTP Settings: enable custom SMTP.
   - Host: `smtp.resend.com`, Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: the Resend API key
   - Sender email: an address on `ncfccs.org`
4. Save and send a test email from the same screen.

**b. API key for the app's own confirmation email** (sent by `apps/web/lib/email.ts` after verification, with the QR attached):

1. Resend > API Keys: create a second key (or reuse the one above).
2. Set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` (an `ncfccs.org` address) in `.env` / Vercel.

## 5. apps/mobile (Officer booth app)

1. Set `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (same Supabase project) and `EXPO_PUBLIC_API_BASE_URL` (the deployed `apps/web` URL from step 3 — this is what `/api/events/mine` and `/api/scan/*` resolve against) in `apps/mobile/.env`.
2. Officers sign in with an email OTP code (not a clickable link — avoids deep-linking setup), sent through the same SMTP configured in step 4a.
3. `npx expo run:ios` / `run:android` for a dev build (`expo-camera` needs a native build, not Expo Go), or `eas build` for a real device.
4. Not verifiable without a live Supabase project and a physical device/camera — this repo's checks only cover typecheck and app-level logic (`pnpm --filter web test`).
