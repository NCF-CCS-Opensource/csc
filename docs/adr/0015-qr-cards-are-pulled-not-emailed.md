# QR Cards are pulled, not emailed

Status: accepted

Onboarding no longer emails a Student their QR Card. Google SSO (ADR-0012) already proves an account is a real school identity before onboarding runs at all, so the confirmation email was not protecting anything ownership-related — it was a second delivery of a document the self-scoped card route already served from the same builder. A send with no retry, no queue, and no recovery job (a failure was logged and dropped) did not justify keeping a third-party mail dependency and two server secrets (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) alive for one message. Completing onboarding now redirects to My Attendance, where the live QR and its download already live — the "here is your QR" moment moves from an inbox to the screen the Student is already on. Officers keep issuing QR Cards in bulk for a roster from the same builder, unchanged.

## Considered Options

- **Keep the email as a convenience copy** — rejected: it duplicated the self-scoped download byte-for-byte, so it added a delivery-failure mode without adding a capability.
- **Add retry/queue machinery to make the send reliable** — rejected: building durable delivery infrastructure to protect a message that already has a working pull alternative solves a problem the pull already solves.
- **Swap Resend for a different mail provider** — rejected: the dependency itself, not the vendor, is the cost being removed.

## Consequences

- The project carries no transactional email channel after this change. A future feature that needs to send mail is adding a capability, not reusing an existing one.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` leave the environment example; the mail provider SDK leaves the web application's dependencies.
- Authentication mail (sign-in, confirmation, reset) is unaffected — Clerk owns and delivers it itself (ADR-0012).
- ADR-0001's status line is amended to withdraw the mail provider, alongside the auth portion it already withdrew.

## Manual steps outside the repository

Not code changes, and not covered by any PR:

1. Delete `RESEND_API_KEY` and `RESEND_FROM_EMAIL` from the hosting project's environment settings.
2. Delete them from local environment files.
3. Revoke the API key in the mail provider's dashboard — it authorizes sending as the school domain until revoked.
4. Leave the verified sending domain and its DNS records in place, so transactional email can be restored later without re-verification.
