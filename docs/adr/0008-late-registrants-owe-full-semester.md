# Late registrants owe for the full Semester, not just Events after they joined

A Student who registers mid-Semester is charged for **every** Event in that Semester, including Events dated before their registration (all marked absent). This is a department rule: late enrollees don't escape penalties by signing up late. Previously the no-show engine skipped any Event predating `student.created_at`, so a new account showed no absences for earlier Events — the second half of the bug that started this.

The guard changes from a per-**Event**-date check to a per-**Semester**-membership check: a Student is skipped for a Semester only if they registered *after that Semester ended*. Inside a Semester they belong to, every Event counts.

## Considered Options

- **Charge every new account for all past Semesters too** — rejected: a freshman creating an account would instantly owe for years of Events that happened before they existed, born maximally in debt. Cross-Semester carry-forward of *real* unpaid debt is already handled by the Clearance gate; the no-show engine must not invent absences for Semesters a Student was never in.

## Consequences

- The two no-show guards (`lib/ledger.ts`, in `computeLedger` and the materialization path) drop the `created_at > event.date` skip and instead skip when the Student registered after the Semester's end.
- `computeLedger` needs the Semester's end date (or the caller must pre-filter Students to those who existed by Semester end); a bare per-Event-date comparison is no longer correct.
- Registering mid-Semester now creates penalties retroactively for that Semester's earlier Events — intended.
