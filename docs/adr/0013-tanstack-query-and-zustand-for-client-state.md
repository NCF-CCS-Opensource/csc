# TanStack Query and Zustand for client-side data and state

Status: accepted

Both applications adopt **TanStack Query** for server-derived data and **Zustand** for the small amount of client state that is not server-derived. Navigation in the web application re-fetches the same data on every visit and re-renders from scratch; a client-side cache is what makes a revisited page appear immediately instead of re-earning its own data. Mobile gets the same pair so that one set of fetching and state idioms covers the codebase.

Only **Query** is adopted from the TanStack family. Router has no place here: the web already routes through the Next.js App Router and mobile routes through React Navigation, and a third router would compete with both. Table and Form are not adopted either — nothing in the current UI is straining against what we already use, and adopting a library before the pain exists buys maintenance and nothing else.

## Server actions are the query function on web

On the web, the `queryFn` calls the existing server actions directly. No new API routes are introduced for the browser to call.

The alternative was a set of route handlers, which would mean widening the authorization path. Today the API surface authorizes the **mobile booth** by Bearer token; teaching that path to also accept browser session cookies makes one path serve two callers with different trust stories, and the booth is the part of the system we least want to disturb — it is the thing that runs offline in a hallway during an event. Server actions already authorize the browser session correctly and already exist. Calling them from `queryFn` adds a cache without adding an authorization surface.

## Pages keep their server shell and hydrate the cache

Pages are not converted to fully client-rendered components. Each page keeps its server component, does its existing server-side fetch, and passes that result into the Query cache as `initialData`.

If a page became client-rendered, a cold visit would ship HTML with no data, then wait for a client round-trip before showing anything — a first visit would get *slower* than it is today in exchange for making later visits faster. Seeding the cache from the server shell keeps the first paint exactly as it is now, and every subsequent visit reads from cache.

**What this delivers: revisits become instant. First visits are unchanged.** This is not a fix for slow initial page loads.

## The Offline Scan Queue is carved out

The Offline Scan Queue does not move to TanStack Query, and neither does the scan-capture path that feeds it. Query's mutation cache is a retry-and-invalidate mechanism for in-flight requests; the queue is a durable domain object with guarantees Query does not model:

- It is **bound to the stable authenticated identity of the Officer** who made the decisions, and is accessible only while that Officer is signed in. Query's cache is keyed by query key, not by identity, and is not an ownership boundary.
- It must **retain every pending decision durably** across app restarts and an entire booth shift with no connectivity, independent of Recent Scans.
- It distinguishes **temporary delivery failures, which retry automatically, from permanent rejections, which become Needs Review Scan Decisions** — a terminal state that stops being retried and waits for an Officer to inspect and explicitly discard it. Query has retry policies, not terminal domain states.
- A rejection **must not block later decisions** from delivering. Query offers no ordering guarantee of this shape.
- **An Officer cannot sign out while pending or Needs Review decisions remain.** Query has no concept of a cache that refuses to be discarded.

Query may still be used elsewhere in the mobile app for ordinary reads. It is the queue and the decisions flowing into it that are out of scope.

## Considered Options

- **Fix the slowness server-side instead** — rejected, but explicitly available. The navigation lag is dominated by every page rendering dynamically with no streaming boundaries anywhere in the application, so a click renders nothing at all until the server has finished every query for the destination. Adding `Suspense` boundaries and letting the shell stream would be cheap and would attack the *cause* rather than caching around it. It was not chosen because it does not help the repeat-visit case at all — a streamed page still re-fetches everything on every visit — and mobile gains nothing from it. This remains worth doing and is not foreclosed by this decision; it is recorded here so a future reader does not conclude it was never considered.
- **New API route handlers for browser fetching** — rejected: widens the Bearer-token authorization path the mobile booth depends on to also accept browser sessions, for no benefit over calling the server actions that already exist.
- **Fully client-rendered pages** — rejected: trades a slower first visit for a faster second one.
- **The rest of the TanStack family (Router, Table, Form)** — rejected: Router competes with the App Router and React Navigation; Table and Form solve problems the current UI does not have.

## Consequences

- Two caches now exist on the web: the server's and the client's. A mutation must invalidate the Query key as well as revalidate the server path, or a page will show stale data after a write.
- `initialData` means every cached page's server shell is now also the definition of that page's cache shape; changing the server fetch's return type changes the cache.
- Anyone working on mobile scan capture must read the carve-out above before reaching for `useMutation`.
- No new domain term emerged from this decision, and the glossary in `CONTEXT.md` is unchanged.
