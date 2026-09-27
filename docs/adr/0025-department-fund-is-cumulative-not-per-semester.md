# The Department Fund is one cumulative pot, not per-Semester

Every other money and attendance concept in this system is scoped to a Semester and does not carry forward: Events, Attendance, Penalties, and the per-Student Ledger all reset when a new Semester opens. The Department Fund deliberately does not. Its balance is total collected SAF Fee Payments plus total collected Penalty Payments minus total Expenses, across all Semesters, and it never resets — leftover cash from one term is the same cash the council spends in the next.

There is also no stored opening balance. Money collected before Expense tracking shipped enters the Fund the same way all money does — as recorded Payments, with Officers marking already-paid SAF Students paid through the existing Clearance UI. The balance is therefore always exactly "collected minus spent," with nothing to reconcile against a hidden starting figure.

## Considered Options

- **Reset the Fund per Semester, like everything else.** Rejected: it models money as vanishing at Semester close. A council's cash box does not empty in January; pretending it does yields a balance that cannot match physical cash and silently hides carryover.
- **Per-Semester view with a carried-over opening-balance snapshot.** Rejected: accounting-correct, but it requires computing and storing a closing balance at every Semester close — a close-time job for a number the cumulative sum already gives for free.
- **Seed a Governor-entered opening balance at rollout.** Rejected: it reintroduces exactly the pre-tracking-history problem ADR 0024 avoided. Some already-collected cash is recorded as Payments and some would be folded into the opening figure, so the two double-count unless an as-of cutoff is tracked. Marking the already-paid Students paid — plain data entry with an existing tool — makes the opening balance unnecessary.

## Consequences

- The Fund is the one concept a reader should **not** expect to be Semester-scoped. A per-Semester spending breakdown still exists (each Expense carries the Semester it was recorded in), but the headline balance is continuous.
- The model assumes essentially nothing was spent from the fund before tracking began. This holds at rollout — SAF and the Fund are both new, and ADR 0024's rollout Semester is the first tracked one. If prior unrecorded spending later proves material, a single Expense row corrects the balance; no opening-balance mechanism is added retroactively.
- "Collected" always means un-voided Payments. Outstanding SAF and Penalties are receivables, reported separately from the cash balance and never summed into it.
