# The web app is a BFF with no database access

`apps/web` keeps its server actions and its server-rendered pages, but those actions stop querying Drizzle and become thin proxies: they mint the signed-in user's Clerk token server-side and forward it to the API as `Authorization: Bearer`. `@attendance/db` is removed from `apps/web` entirely — 30 files lose their schema imports — and `packages/contracts` carries the DTO types shared by `apps/api`, `apps/web` and `apps/mobile`.

The API is the **only** authorization point. `capabilityFailure()` and the role policy move into a NestJS guard; the BFF's `requireCapability()` becomes a reaction to a `401` or `403` rather than its own database lookup.

## Considered Options

- **A thin client: delete the server actions, fetch the API from the browser** — rejected: it would discard the server-side capability redirect to `/onboarding` and the role landing page, which is the whole navigation model of ADR-0005, and replace it with client-side flicker. That is a second rewrite hiding inside the first.
- **A shared service secret, with the BFF asserting the user's identity in a header** — rejected: it makes the API trust a caller's claim about who the user is, so whoever leaks the key becomes every user. Forwarding the user's own token means there is nothing to forge.
- **Keeping direct database access from Vercel for reads** — rejected: Heroku Postgres Essential-0 allows 20 connections (ADR-0018) and Vercel serverless functions would compete with the dyno's pool for them. The architecture and the connection cap happen to cut the same way.
- **A shared contracts package versus hand-written types per client** — contracts chosen: the booth app ships as an installed binary that cannot be redeployed with the API, so a compile-time contract is the only thing that surfaces a breaking change before it reaches a booth.

## Consequences

- `requireCapability()` stops being a Postgres query from Vercel and becomes a **Vercel → Heroku round-trip on every gated page render**. ADR-0005 went to real trouble to remove per-navigation latency; its display-only caching still holds and its argument gets stronger, but gated page loads are slower than they were. This is the accepted price of one authorization point.
- Mobile calls the API directly (ADR-0006, as amended), so the API is publicly reachable regardless. **The BFF is not a security perimeter — the Clerk JWT is.** Nobody should later argue for routing mobile through Vercel on security grounds.
- Both clients authenticate identically: one Clerk token, one JWKS verification path in the API. The two-path split between `lib/auth.ts` (session) and `lib/api-auth.ts` (Bearer) collapses into one.
- `apps/web/app/api/*` route handlers survive only where Vercel still owns the work: the report and QR Card renderers (ADR-0020) and `/api/identity` for the sidebar. The rest are deleted once mobile repoints.
