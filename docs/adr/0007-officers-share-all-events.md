# Officers share all Events; drop per-Event ownership

Officers were scoped to Events they created (`events.officer_id` gated every read and mutation). We flattened this: **any Officer can CRUD any Event**, and the `events.officer_id` column is removed entirely. The Officer/Governor line is now drawn only around ADMIN — managing Officers, Semesters, and the Program list stay Governor-only; everything else (Events, scanning, Payments, Clearance) is shared.

## Considered Options

- **Keep per-Officer Event ownership, add a Governor override** — rejected: the department runs Officers as one interchangeable pool at the booth; a freshly promoted Officer being unable to see the Semester's Events was the bug that started this, not a feature.
- **Keep `officer_id` as a nullable audit stamp** ("who created it") — rejected: nothing reads it once the gate is gone, and a dead column invites the ownership logic to creep back. Scanning and Payment already record their own acting Officer (`scans.officer_id`, `payments.officer_id`), so the audit trail that matters is unaffected.

## Consequences

- **Schema:** `events.officer_id` column + FK dropped (migration). `scans.officer_id` and `payments.officer_id` are unrelated and stay.
- **Ownership gates removed** in the events page, `events/mine`, `events/[id]`, `scan/approve`, `scan/reject`.
- **Analytics is no longer scopeable per Officer** — `SemesterLedgerScope`'s `{officerId}` variant is gone; every role sees whole-Semester rollups. This falls out of the column removal, it isn't a separate choice.
