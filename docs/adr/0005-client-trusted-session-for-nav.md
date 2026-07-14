# Sidebar identity trusts the cached session instead of revalidating every navigation

The app shell (`app/(app)/layout.tsx`) no longer calls `getCurrentStudent()`. That call read cookies, which forced the whole layout into Next.js dynamic (uncached) rendering — every sidebar click paid for a live network round-trip to Supabase's `/auth/v1/user` endpoint plus a `students` table query, server-side, before any HTML could render. That was the cause of the 3-5s per-navigation lag.

Instead, `AppSidebar` (a client component) fetches identity once client-side from `/api/identity` on mount and caches it in `localStorage`. Because the sidebar lives in the persistent layout, it isn't remounted on client-side navigation, so this fetch happens once per session load, not once per click.

This trades per-navigation server revalidation for trusting the client-cached identity between navigations. It's scoped to *display only* — which nav items to show, and the email/logout button. Every server action and page that actually reads or mutates data (`requireOfficerOrGovernor`, `requireGovernor`, `getCurrentStudent` on `/dashboard`, etc.) still independently re-checks the session server-side on every request. A stale cached role can make the sidebar list a wrong link for a few seconds after a role change, but it can't grant access to anything — the destination still enforces its own check.

## Considered Options

- Add Next.js middleware to refresh/validate the session — rejected: middleware runs in the same request as the layout, so it wouldn't remove the round-trip, only relocate it.
- Keep server-side revalidation on every nav (status quo) — rejected: this is the 3-5s bug being fixed.

## Consequences

- If a Student is promoted/demoted mid-session, the sidebar's nav list won't reflect it until the next full page load (cache miss) or manual refresh — it re-fetches on mount, not on an interval.
- Any future data shown in the sidebar beyond identity/role should not reuse this cache without separately deciding it's safe to go stale — this decision covers nav display only.
