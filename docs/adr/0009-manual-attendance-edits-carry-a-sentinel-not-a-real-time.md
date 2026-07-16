# Manual attendance edits record Present/Absent, not a real Time-in/Time-out

The per-Event attendance editor (`/events/[eventId]/attendance`) is a spreadsheet-style grid where each scan field is a **Present / Absent** dropdown, not a timestamp picker. Present writes a sentinel value — the Event's date at noon — to that field; Absent nulls it. No schema change: the two nullable `time_in` / `time_out` columns stay.

## Why

The exact Time-in/Time-out *value* is read nowhere in the system. Its only consumer is `isSessionAbsent` (`!timeIn || !timeOut`) and the Penalty derivation off it (`computeSessionPenalty`, `syncPenaltyForSession`). A Present/Absent dropdown per scan field therefore loses nothing any reader uses, while removing the raw `datetime-local` pickers that made the editor slow and unobvious — the UX problem that had Officers hunting for the editor on the Clearance page instead.

## Considered Options

- **Keep editing raw timestamps** — rejected: no reader needs the exact moment of a manual correction, and the pickers were the main reason the editor read as unusable.
- **Add a boolean `present` column** — rejected: a schema change to store what the existing null-vs-set distinction already encodes. The both-scans-required rule (`isSessionAbsent`) keeps working unchanged with the sentinel.

## Consequences

- **Booth scans are unaffected.** The QR booth flow still records the Officer's true device capture time; only this manual editor stops surfacing/editing the exact moment. So `time_in` / `time_out` now hold either a real capture time (booth) or an all-noon sentinel (manual edit) — a future reader seeing noon everywhere should look here.
- The write path is `setScanField` → sentinel/null on one field → `syncPenaltyForSession`. Penalty creation/deletion and immutability-after-payment stay in the existing sync.
- The grid's read model is a new pure `computeEventGrid` (same style as `computeLedger`), unit-tested; the Present→sentinel / Absent→null mapping is trivial and rides the already-tested Penalty derivation.
