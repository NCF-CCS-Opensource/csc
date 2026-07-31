# Supabase backend with Drizzle, Turborepo monorepo, Vercel + Expo

Status: accepted (auth-mechanism portion — magic-link — superseded by ADR-0003; Supabase for Postgres/Storage, Drizzle, Turborepo, Vercel, Expo, and Resend are unaffected)

We need Auth (magic-link email verification), Postgres, and file storage (QR images) for a small solo/small-team build, plus a web app and a React Native mobile app sharing types and schema. We chose **Supabase** (Auth + Postgres + Storage) over hand-rolling auth and hosting Postgres separately, since Supabase's magic-link auth maps directly onto our email-verification requirement and removes an entire subsystem we'd otherwise build. **Drizzle ORM** connects the server-side web application to Supabase Postgres through its transaction pooler; the Supabase client remains responsible for BaaS APIs such as Auth. The generated Data API is not the primary server data layer because authorization and relational queries already live in the web backend. Browser and mobile clients retain that boundary, with privileged mobile operations going through the web API instead of directly to application tables. **Turborepo** hosts the Next.js web app (deployed to **Vercel**) and the **Expo**-managed React Native mobile app (officer QR-scan booth tool) as a single repo sharing the Drizzle schema and types. Magic-link email is sent via custom SMTP (**Resend**) on the ncfccs.org domain rather than Supabase's default emailer, to avoid its rate limits and send from a branded address.

## Considered Options

- Bare React Native instead of Expo — rejected: more native toolchain overhead for a solo build, no benefit for a straightforward camera/QR use case.
- Cloudflare Pages instead of Vercel for the web app — rejected: weaker first-class Next.js feature support (server actions, ISR).
- Supabase's default built-in emailer — rejected: low rate limit would fail silently right as real adoption picks up, and sends from an unbranded address.
- Supabase Data API for all application queries — rejected: it would replace the typed Drizzle query layer and require a new RLS policy surface without solving a current product or operational problem.

## Consequences

- Supabase is a lock-in point for Auth, Postgres hosting, and Storage — migrating off it later touches all three.
- `DATABASE_URL` remains a server-only Supabase connection secret. Transaction-pooler clients disable prepared statements as required by Supavisor.
- DNS (Cloudflare) and hosting (Vercel) are on separate providers by design; this is a standard, well-supported split.
