# Supabase backend with Drizzle, Turborepo monorepo, Vercel + Expo

Status: accepted

We need Auth (magic-link email verification), Postgres, and file storage (QR images) for a small solo/small-team build, plus a web app and a React Native mobile app sharing types and schema. We chose **Supabase** (Auth + Postgres + Storage) over hand-rolling auth and hosting Postgres separately, since Supabase's magic-link auth maps directly onto our email-verification requirement and removes an entire subsystem we'd otherwise build. **Drizzle ORM** sits on top of Supabase's Postgres for type-safe schema/queries instead of using the Supabase client for all data access. **Turborepo** hosts the Next.js web app (deployed to **Vercel**) and the **Expo**-managed React Native mobile app (officer QR-scan booth tool) as a single repo sharing Drizzle schema and types. Magic-link email is sent via custom SMTP (**Resend**) on the ncfccs.org domain rather than Supabase's default emailer, to avoid its rate limits and send from a branded address.

## Considered Options

- Bare React Native instead of Expo — rejected: more native toolchain overhead for a solo build, no benefit for a straightforward camera/QR use case.
- Cloudflare Pages instead of Vercel for the web app — rejected: weaker first-class Next.js feature support (server actions, ISR).
- Supabase's default built-in emailer — rejected: low rate limit would fail silently right as real adoption picks up, and sends from an unbranded address.

## Consequences

- Supabase is a lock-in point for Auth, Postgres hosting, and Storage — migrating off it later touches all three.
- DNS (Cloudflare) and hosting (Vercel) are on separate providers by design; this is a standard, well-supported split.
