# Reports are computed on the API and rendered on Vercel

A Report's aggregate data is computed by an application use case in `apps/api`. The AI narrative (`gemini-1.5-flash`) and the PDF layout (`@react-pdf/renderer`) stay in `apps/web` on Vercel, which fetches the aggregate over the BFF and renders the document. QR Card rendering stays on Vercel for the same reason; generating the canonical QR *payload* remains domain work in the API.

Two forces point the same way. Heroku kills any request at **30 seconds (H12), hard** — a Drizzle read plus a Gemini call plus PDF rendering in one request is plausibly over that, and the failure mode is an Officer getting nothing. And the split maps onto the architecture being adopted: aggregate computation is an application concern, document layout is presentation, and presentation belongs at the edge.

## Considered Options

- **Everything on the dyno** — rejected: exposes every report to H12 and puts `@react-pdf/renderer` on a $7 dyno that has better things to hold in memory.
- **Everything on the dyno with a background worker** — rejected: correct answer to H12, but it needs a job queue and a second dyno, which does not fit the $12/month budget.

## Consequences

- **ADR-0011 stays intact exactly where it is already implemented and tested.** Student PII is rendered by the Vercel-side PDF layout and never reaches the AI provider; only anonymized aggregates are sent. `lib/gemini.ts` and its tests do not move, so the boundary is not re-implemented and not re-proved.
- Report aggregates cross Vercel ↔ Heroku as JSON, which makes their shape a contract in `packages/contracts` rather than an internal detail.
- Reports remain unstored — each generation is fresh, per `CONTEXT.md`.
- If reports ever do move to the dyno, they need the worker rejected above. That is a budget decision, not a code one.
