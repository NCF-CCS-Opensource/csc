# Officers correct Student ID and Program directly

A Student ID typed wrong at onboarding is uncorrectable today — nothing in the app writes to `students` except role promotion — and the existing collision message already tells people to "ask a Governor to sort it out", pointing at a power nobody has. **Any Officer may now edit any Student's Student ID and Program directly, with no approval workflow and no audit trail.** The department is co-located and corrections are reported face-to-face at the booth desk, so the "request" is a conversation, not a record.

## Considered Options

- **An Edit Request entity** — Student submits a proposed correction, Officer approves or rejects, Student is notified. Rejected: it builds a pending/approved lifecycle, a review queue, and a notification path to replace a sentence spoken across a desk.
- **An audit log of every change** — rejected for now, not forever. It is purely additive: nothing built here has to be undone to add it, so it waits until Officers are actually observed editing identity fields carelessly.
- **Governor-only, like the other identity-shaped powers** — rejected: corrections happen at the booth, where Officers are and Governors are not, and a queue behind one person is how typos survive a whole Semester.

## Consequences

- **Officer gains a power that looks ADMIN-shaped.** ADMIN (promotion, Semesters, Programs) stays Governor-only; this deliberately sits outside it. `name` and `email` remain uneditable by anyone — they are Google's assertions (ADR-0012), not facts the department owns, and a wrong email means a different human, which is an onboarding problem rather than a typo.
- **Every edit invalidates that Student's printed QR Cards.** The payload is frozen at print time while the record is not, so a corrected Student ID or Program makes the old card fail `qrError()` at the booth and land in the rejected-scans log — a course shift that reads as a stolen QR. Mitigated at the only moment it is knowable: the edit form offers a replacement card immediately, because the Student is standing there. No reprint state is tracked.
- **Attendance history is unaffected.** Every foreign key is on `students.id`, never on `studentId`.
