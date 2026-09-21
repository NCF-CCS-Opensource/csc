# NestJS Rewrite Plan

Status: approved for specification. Replaces the delivery half of
[architecture-refactor-plan.md](./architecture-refactor-plan.md), whose "Confirmed behavior"
sections remain the acceptance criteria.

## Outcome

Move business logic out of `apps/web` into a NestJS API on Heroku, leave the domain untouched,
and end Supabase's free-tier project pausing. `CONTEXT.md` does not change — this is an
architecture and hosting decision, not a domain one.

## Target topology

| Workload | Platform | Path |
| --- | --- | --- |
| Pages, BFF proxies, Gemini narrative, PDF and QR Card rendering | Vercel | `apps/web` |
| Domain, use cases, persistence, authorization | Heroku Basic dyno ($7) | `apps/api` |
| Postgres | Heroku Essential-0 ($5), swappable by URL | — |
| Identity | Clerk (unchanged) | — |
| Booth app | Expo binary, calls the API directly | `apps/mobile` |

Total $12/month. One environment: production. `docker-compose.yml` is staging.

## Decisions

| | |
| --- | --- |
| ADR-0017 | NestJS, Clean Architecture, single-action controllers, RPC `v1/api/*` |
| ADR-0018 | Any managed Postgres by URL; Heroku now; `prepare` becomes configurable |
| ADR-0019 | Web is a BFF with no database access; `packages/contracts` for shared DTOs |
| ADR-0020 | Report aggregates on the API; Gemini and PDF rendering stay on Vercel |
| ADR-0021 | `ledger` has no repository; no-show materialization is an explicit command |
| ADR-0006, ADR-0013 | Amended, not replaced — see their status notes |

## Acceptance gate

`apps/web/lib/architecture.integration.test.ts` (~38 tests, disposable Postgres) ports first and
stays green through every slice. It is transport-agnostic and is the only proof the rewrite
preserved behavior. `ledger.test.ts` and `reports.test.ts` port with their subjects.

There is no live data, so these tests are the entire safety net. Treat a red suite as a stop.

## Slice order

Each slice must leave `main` deployable.

**0. Foundations.** Scaffold `apps/api` and `packages/contracts`. Clerk JWKS verification guard.
Role policy as capabilities. Drizzle pool capped at 10. Make `createDb`'s `prepare` an option
defaulting to `true`. Provision Heroku, set `DATABASE_URL` with `sslmode=no-verify`, migrate,
re-run the enrollment roster importer.

**1. Events, end to end.** Domain → use cases → Drizzle adapter → single-action controllers → web
BFF. Chosen first because it has real lifecycle rules, is consumed by both clients, and its tests
already exist. This slice exists to surface the four unknowns early: JWKS verification in NestJS,
the Vercel → Heroku hop, pooling inside a long-lived dyno against a 20-connection cap, and H12.

**2. Scan.** `identify`, `approve`, `reject`, `rejections` — transactional and strictly idempotent
per the confirmed behavior. **Mobile repoints here**, once both of its clusters are live: one
`EXPO_PUBLIC_API_BASE_URL` change, one rebuild.

**3. Attendance, penalty, payment.** Correction, sentinel writes (ADR-0009), payment recording.

**4. Ledger.** The read model plus the explicit materialization command (ADR-0021).

**5. Reports.** Aggregate use cases on the API; Vercel keeps Gemini and `@react-pdf/renderer`.

**6. Cleanup.** Delete the superseded Next.js route handlers and `lib/*` business logic, drop
`@attendance/db` from `apps/web`. Keep `/api/identity` and the report and QR Card renderers.

Slices 1–2 duplicate Event logic on purpose: Next.js keeps serving mobile until mobile repoints.

## Loose ends

- CI workflows reference a staging environment that will not exist. Update or remove them.
- `packages/db/scripts/*.mjs` read `DATABASE_URL` directly and need the new URL and `sslmode`.
- Watch gated page latency: `requireCapability()` becomes a Vercel → Heroku round-trip (ADR-0019).
  ADR-0005's display-only caching still holds, but the floor moved.

## Out of scope

Unchanged from the superseded plan: mobile Payment UI, desktop viewport gating, Officer demotion
or queue handoff, digital Clearance signing, background mobile tasks, QR signing/rotation. Add:
a staging environment, and any change to `CONTEXT.md`.
