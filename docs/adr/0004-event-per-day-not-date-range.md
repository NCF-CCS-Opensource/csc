# Multi-day activities are separate Events, one per day — not a date range

`events` gets a single `date` column, not `startDate`/`endDate`. A 3-day workshop is created as three separate Event rows ("Day 1 Workshop", "Day 2 Workshop", "Day 3 Workshop"), each with its own date, penalty amount, and independently-scanned attendance. There is no grouping entity linking them — the naming convention is the Officer's, not enforced by the schema.

## Considered Options

- Event date range (`startDate`/`endDate`) with attendance tracked per-day within a single Event — rejected: would require adding a `date` column to `attendance_sessions` and widening its `(eventId, studentId, half)` uniqueness to `(eventId, studentId, date, half)`, a bigger schema/domain change. The one-Event-per-day model needs neither.
- A grouping/series entity ("Workshop" owning multiple day-Events) — rejected: no current requirement reads Penalty or Clearance data grouped by series; adding one now would be speculative.

## Consequences

- Per-day penalty/attendance reporting falls out for free — each day is already an independent Event.
- Nothing stops an Officer from creating unrelated Events with matching names; there's no system-enforced link between "Day 1" and "Day 2" of the same activity.
