# Provisioning (manual, one-time)

Everything code-side is scaffolded. These steps need your own Supabase, Vercel, and Resend accounts — an agent can't run them without your credentials.

## 1. Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Settings > API: copy `Project URL` and `anon public` key into `.env` as `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (also `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` for `apps/mobile`). Copy `service_role` key as `SUPABASE_SERVICE_ROLE_KEY` (server-only, never ship to a client).
3. Settings > Database > Connection string ("Transaction" pooler, port 6543): copy into `.env` as `DATABASE_URL`.

## 2. Run the empty Drizzle baseline

```bash
pnpm --filter @attendance/db db:generate   # writes packages/db/migrations from src/schema.ts
pnpm --filter @attendance/db db:migrate    # applies migrations against DATABASE_URL
```

`src/schema.ts` is intentionally empty — this just proves the migration pipeline reaches the project. Real tables land in later tickets.

## 3. Deploy apps/web to Vercel

1. https://vercel.com/new, import this repo, set **Root Directory** to `apps/web`.
2. Framework preset: Next.js (auto-detected).
3. Add env vars from step 1 (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel project settings.
4. Deploy. The root page renders "Not signed in" until a real auth flow exists (later ticket).

## 4. Resend SMTP on Supabase Auth

1. https://resend.com — add and verify the `ncfccs.org` domain (DNS records on Cloudflare per ADR 0001).
2. Resend > API Keys: create a key with sending access.
3. Supabase dashboard > Authentication > Emails > SMTP Settings: enable custom SMTP.
   - Host: `smtp.resend.com`, Port: `465` (SSL) or `587` (TLS)
   - Username: `resend`
   - Password: the Resend API key
   - Sender email: an address on `ncfccs.org`
4. Save and send a test email from the same screen. Not wired to a real magic-link flow yet — that's a later ticket.
