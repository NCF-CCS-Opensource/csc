# Needs Review Scan Decisions are re-decidable, not just discardable

Status: accepted

A Needs Review Scan Decision (a Scan Approval the backend permanently rejected on delivery) could previously only be discarded or retried unchanged — the Officer had no way to correct a wrong original approve/reject call. We now let the Officer flip the decision from Needs Review itself, because a permanent rejection can be caused by client-side misclassification (an Unverified Scan wrongly treated as untrusted and auto-rejected) rather than a genuinely bad scan, and the Offline Scan Queue exists precisely to survive the connectivity and backend surprises we can't fully classify in advance.

## Considered Options

- **Keep discard/retry only, fix misclassification at the source** — rejected: today's known bug (a stale-token 401 wrongly treated as a hard failure) can be fixed, but the queue still needs an escape hatch for whichever miscategorization we haven't foreseen yet.
- **Route corrections through the manual grid edit instead** — rejected: a manual grid edit stores only Present/Absent, not a real moment (ADR 0009); correcting a wrong reject that way would discard the scan's true capture time for no reason, when the original Scan Approval already recorded it.

## Consequences

- A Needs Review Scan Decision is no longer a dead end for the Officer, but a permanent rejection is also no longer immutable — a Time-in/Time-out can be approved after initially being recorded as a rejection, purely on the Officer's re-inspection.
- Fraud-pattern detection over rejected Scan Approvals must treat a later-overturned Needs Review Scan Decision as a correction, not as an independent rejection event.
