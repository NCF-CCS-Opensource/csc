# Clerk with Google SSO restricted to the school domain

Status: accepted (supersedes ADR-0003 entirely; revises the auth portion of ADR-0001, which now covers Supabase as a Postgres/Storage host only)

Identity moves from Supabase Auth to **Clerk**, and the only sign-in method is **Google SSO restricted to the `@gbox.ncf.edu.ph` domain**. Every Student and Officer already holds a school Google account, so the school's own identity provider — not our registration form — becomes the thing that proves who someone is. This removes the parts of the auth surface we were maintaining by hand: password strength and confirm-password validation, the "confirm your email" round trip, the forgotten-password reset flow, and the unconfirmed-account state. Domain restriction also replaces the school-email check we were enforcing ourselves; a personal Gmail account cannot reach the application at all.

Proving email ownership was ADR-0003's reason for the confirmation link, and that requirement has not gone away — it is now satisfied upstream, because Google has already verified the account and the domain restriction proves it is a school account.

The **gamification requirement is not dropped**. ADR-0003 chose standing passwords because Students earning redeemable points implies frequently-revisited accounts. Google SSO serves that better than a password: an already-signed-in Google session makes returning to redeem points close to frictionless, with no credential for the Student to forget and no reset flow for us to run.

Sign-in and Student record are now separate things. A verified school identity that has not yet completed onboarding is a **Pending Student** — signed in, but not yet a Student.

## Considered Options

- **Keep Supabase email + password (ADR-0003)** — rejected: we maintain a credential surface (validation, confirmation, reset) that the school's Google accounts already provide, and it cannot enforce the school domain as strongly as SSO does.
- **Supabase's own Google OAuth provider** — rejected: keeps identity coupled to Supabase, which we otherwise want to reduce to a Postgres host, and offers weaker session and organization tooling across the web and mobile clients.
- **Google SSO with any Google account, plus an application-side school-email check** — rejected: an application-side check is a rule we enforce after the fact; domain-restricted SSO refuses the sign-in outright.

## Consequences

- Supabase is no longer an identity provider. ADR-0001 chose it largely for auth, and that justification is gone; it remains for Postgres hosting and Storage only.
- Registration stops creating credentials. A first-time signed-in user is a Pending Student until onboarding creates the Student record, and the QR-code confirmation email fires at completed onboarding rather than at an email-confirmation click.
- There is no `/login` password page, no password reset flow, and no unconfirmed-account state to handle.
- **The mobile app owns its offline Officer identity.** The native app persists the signed-in Officer itself instead of relying on Clerk's offline session behaviour. The Offline Scan Queue is bound to the Officer who made those decisions and must stay readable and attributable through an entire booth shift with no connectivity — that is a correctness requirement for queued scans, not a convenience. A vendor's offline cache is a refresh/expiry policy we do not control and could change under us, so we do not stake queue ownership on it.
- Existing accounts do not carry over. Supabase `authUserId` links must be re-established against Clerk user identifiers.
