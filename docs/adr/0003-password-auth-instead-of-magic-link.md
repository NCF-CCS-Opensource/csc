# Email + password auth, replacing magic-link sign-in

Status: accepted (revises the auth-mechanism portion of ADR-0001; the rest of ADR-0001 — Supabase for Postgres/Storage, Drizzle, Turborepo, Vercel, Expo, Resend — is unaffected)

ADR-0001 chose Supabase's magic-link auth because it mapped directly onto the email-verification requirement with no extra backend work. We're reversing that for **email + password** (Supabase's standard password provider) because an upcoming gamification feature (Students earn points from programming/quiz challenges, redeemable against Penalty balance) implies persistent, frequently-revisited Student accounts — a standing credential fits that better than re-requesting a fresh magic link every visit. A one-time-use 6-digit code (Supabase's OTP alongside the magic link) was considered and rejected as a *recurring* login mechanism: fine as a single-use, short-lived token, but not as a reusable standing credential — 6 numeric digits is only 1,000,000 combinations, too weak to stand as a password students keep reusing indefinitely.

Email ownership still needs proving — that requirement didn't disappear, only the login mechanism changed. Registration now creates a Supabase password-auth account and requires the standard "confirm your email" link to be clicked once before the account can sign in; this replaces the old magic-link click as the point where a Student's `authUserId` and role get linked and the QR-code confirmation email fires (`auth/callback` route, same side effect, different trigger). Forgotten passwords go through Supabase's standard reset-password-via-email flow — not a regenerated PIN.

## Considered Options

- Keep magic-link-only (ADR-0001's original choice) — rejected: doesn't fit a "come back often to redeem points" usage pattern as well as a standing credential does.
- Recurring one-time 6-digit code as the login mechanism itself (no password) — rejected: would need per-login email round-trips indefinitely, and offers no benefit over magic-link once you're issuing a code every visit anyway.
- System-generated persistent 6-digit numeric PIN as the password — rejected: too small a keyspace (1,000,000 combinations) to be a safe *standing* credential; fine only as a single-use, time-limited token, which is the OTP option above.

## Consequences

- Supabase Auth now needs "Confirm email" enabled for the email/password provider (Supabase dashboard, Authentication > Providers > Email) — the account isn't sign-in-capable until the confirmation link is clicked.
- Registration form gains password + confirm-password fields; `apps/web/lib/registration.ts` validation and `decideRegistrationAction` need to account for password matching/strength and the confirmed/unconfirmed account states.
- A new `/login` page is needed (email + password), separate from `/register`.
- Password reset (forgot password) is a new, separate flow using Supabase's built-in reset-password email + a reset-password page.
- The published spec's Out of Scope line "Password-based authentication — magic link only, no passwords anywhere in the system" (GitHub issue #1) is superseded by this ADR.
