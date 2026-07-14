# Attendance System

QR-based attendance and penalty tracking for the College of Computer Studies, replacing paper sign-in sheets. Tracks per-semester attendance, computes penalties for absences, and gates end-of-semester clearance on penalty payment.

## Language

**Student**:
A registered user who self-registers via school email, attends Events, and accrues Penalties for incomplete attendance.
_Avoid_: User, enrollee

**Officer**:
A Student promoted (by the Governor) to manage Events they create — scans attendance at the booth, edits attendance records, marks Payments received. Scoped to their own Events only.
_Avoid_: Admin, staff

**Governor**:
The top-level administrator with oversight of all Events, all Officers, Semester periods, and the Program list. Only role that spans every Officer's scope.
_Avoid_: Super admin

**Event**:
An occasion requiring attendance, created and owned by an Officer, belonging to a Semester, scoped to exactly one calendar date within that Semester's range. Declared as whole-day or half-day, each with its own configurable penalty amount. A multi-day activity (e.g. a 3-day workshop) is modeled as multiple Events, one per day — there is no grouping entity linking them; naming them "Day 1", "Day 2", etc. is the Officer's convention, not an enforced relationship.
_Avoid_: Activity, occasion

**Semester**:
A date-ranged period set by the Governor. Events, attendance, and Penalties are scoped to one Semester and do not carry forward into the next.
_Avoid_: Term, school year

**Attendance Session**:
One half (AM or PM) of an Event's day. Requires both a Time-in and a Time-out scan to count as attended; either missing marks that half absent.
_Avoid_: Shift, period

**Time-in / Time-out**:
A QR scan recorded against an Attendance Session, written under whichever mode the Officer's booth dropdown is currently set to. Scans are accepted even without their counterpart (e.g. a Time-out with no matching Time-in); the incomplete half is simply treated as absent until an Officer corrects it manually. The scan's true moment is when the Officer's device captured it, not when it reached the backend — a scan taken offline and synced later still counts as happening at its original capture time.
_Avoid_: Check-in/check-out

**Scan Approval**:
The modal shown after a QR scan, displaying the Student's details for the Officer to visually match against their worn school ID. Officer approves (records the Time-in/Time-out) or rejects. Rejections are logged for fraud pattern detection (e.g. a shared/stolen QR).
_Avoid_: Verification

**Penalty**:
A peso amount charged to a Student for an absent Attendance Session, auto-recalculated whenever attendance data changes — never set manually. A whole-day absence is the sum of both halves' penalty amounts.
_Avoid_: Fine, fee

**Payment**:
A record of a Student settling a Penalty, logged as a transaction (amount, date, receiving Officer) for financial reporting. Recorded by an Officer.
_Avoid_: Settlement

**Clearance**:
The end-of-semester gate requiring a Student's unpaid Penalty balance to be zero before an Officer will sign their clearance paper.
_Avoid_: Sign-off

**Program**:
One of a fixed set of courses a Student selects at registration: Computer Science, Information Technology, Information System, ACT (Associate in Computer Technology). Governor-managed list.
_Avoid_: Course (use Program as the canonical term; "course" is the student-facing word but Program is used in code/data)
