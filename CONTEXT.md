# Attendance System

QR-based attendance and penalty tracking for the College of Computer Studies, replacing paper sign-in sheets. Tracks per-semester attendance, computes penalties for absences, and gates end-of-semester clearance on penalty payment.

## Language

**Student**:
A registered user who self-registers via school email, attends Events, and accrues Penalties for incomplete attendance.
_Avoid_: User, enrollee

**Officer**:
A Student promoted (by the Governor) to run Events — creates, edits, and deletes **any** Event (not only ones they created), scans attendance at the booth, edits attendance records, marks Payments received, signs Clearance. Every Officer sees and acts on every Officer's Events; there is no per-Officer Event ownership. Cannot perform ADMIN actions (see Governor), which stay Governor-only.
_Avoid_: Admin, staff

**Governor**:
An Officer plus the ADMIN powers: promoting Students to Officer, managing Semester periods (create/edit/close), and managing the Program list. Everything an Officer can do, a Governor can do; ADMIN is the only thing Officers cannot, and Officer demotion is outside the current domain until safe Offline Scan Queue handoff is required.
_Avoid_: Super admin

**Event**:
An occasion requiring attendance, created by an Officer and shared among all Officers, belonging to a Semester, and scoped to exactly one Asia/Manila calendar date within that Semester's range. Declared as whole-day or half-day, each with its own configurable penalty amount; it may be deleted only while its Semester is open and before any Scan or Attendance Session exists. Before attendance activity every detail may change, after the first Scan or Attendance Session only its name and venue may change, and once the Semester closes its details and existence are immutable so its Attendance, Penalties, and Payments remain auditable. A multi-day activity (e.g. a 3-day workshop) is modeled as multiple Events, one per day — there is no grouping entity linking them; naming them "Day 1", "Day 2", etc. is the Officer's convention, not an enforced relationship.
_Avoid_: Activity, occasion

**Semester**:
A date-ranged period set by the Governor, with at most one open Semester at a time. Events, attendance, and Penalties are scoped to one Semester and do not carry forward into the next; its dates may not be changed to exclude an existing Event. Closing it freezes Event creation and definition but still permits Attendance correction and Payment recording for reconciliation.
_Avoid_: Term, school year

**Attendance Session**:
One half (AM or PM) of an Event's day. Requires both a Time-in and a Time-out scan to count as attended; either missing marks that half absent.
_Avoid_: Shift, period

**Event Attendance Count**:
The Present, Incomplete, and Absent Attendance Session totals for an Event; upcoming Events have no count, while unfinished sessions are Incomplete on the Event date and Absent afterward. Whole-day Events report AM and PM separately while half-day Events report one neutral Session, counting sessions rather than unique Students.
_Avoid_: Attendee count, absence count

**Time-in / Time-out**:
A QR scan recorded against an Attendance Session, written under whichever mode the Officer's booth dropdown is currently set to. Scans are accepted even without their counterpart (e.g. a Time-out with no matching Time-in); the incomplete half is simply treated as absent until an Officer corrects it manually. A **booth scan** stores its true moment — when the Officer's device captured it, not when it reached the backend, so a scan taken offline and synced later still counts as happening at its original capture time; when multiple approved booth scans target the same field, the earliest Time-in and latest Time-out are canonical regardless of delivery order. A **manual grid edit** (the per-Event attendance editor) stores only presence, not a real moment: Present writes a sentinel (the Event's date at noon), Absent nulls the field. Nothing reads the exact value — only its non-null-ness marks the half attended (`isSessionAbsent`) — so the editor is a Present/Absent dropdown, not a timestamp picker (ADR 0009).
_Avoid_: Check-in/check-out

**Scan Approval**:
The modal shown after a readable QR scan, displaying the Student's details for the Officer to visually match against their worn school ID. The Officer approves (records the Time-in/Time-out) or rejects; an unreadable QR or one whose Student ID, name, and Program do not all match the current Student record shows no trusted Student details, cannot be approved, and is retained as a rejection. Rejections are logged for fraud pattern detection (e.g. a shared/stolen QR).
_Avoid_: Verification

**Recent Scans**:
A persistent five-item history of accepted and rejected Scan Approval decisions made on an Officer's current device, visible only to that Officer and used to verify recent booth activity. A decision appears immediately and remains visibly pending until it has synced; adding a sixth discards the oldest without affecting offline delivery.
_Avoid_: Logs, activity log

**Offline Scan Queue**:
The durable collection of every Scan Approval decision awaiting delivery to the backend, bound to the stable authenticated identity of the Officer who made those decisions and accessible only while that Officer is signed in. It is independent of Recent Scans and retains all pending decisions until they sync successfully; its owner cannot log out while pending or Needs Review Scan Decisions remain. Temporary delivery failures retry automatically, while a permanent rejection becomes a Needs Review Scan Decision without blocking later decisions.
_Avoid_: Recent Scans, scan history

**Needs Review Scan Decision**:
A Scan Approval decision the backend permanently rejected, retained for the Officer to inspect and explicitly discard. It is no longer retried automatically and does not block later Offline Scan Queue delivery.
_Avoid_: Failed scan, dead letter

**Penalty**:
A peso amount charged to a Student for an absent Attendance Session, auto-recalculated whenever attendance data changes — never set manually. A whole-day absence is the sum of both halves' penalty amounts. A Student who registers mid-Semester owes for **every** Event in that Semester, including Events dated before their registration (all marked absent, first Event included) — the department charges late registrants for the whole Semester. Liability is per-Semester: a newly created account owes nothing for a Semester that ended before the account existed. Carrying real unpaid debt between Semesters is the Clearance gate's job, not the no-show engine's.
_Avoid_: Fine, fee

**Payment**:
A record of a Student settling a Penalty, logged as a transaction (amount, date, receiving Officer) for financial reporting. Recorded by an Officer.
_Avoid_: Settlement

**Ledger**:
A Student's computed penalty standing for one Semester: total charged, outstanding balance, and the per-Attendance-Session breakdown — including full no-shows that have no stored session row yet. Not a stored table; derived on read from Events, Attendance Sessions, Penalties, and Payments. The single read model behind the dashboard, Clearance, and Analytics, so every surface counts no-shows the same way. No-show Penalty rows are materialized (written) only when an Officer opens an Event's attendance table to record Payment.
_Avoid_: Balance, statement, summary

**Clearance**:
The end-of-semester gate requiring a Student's unpaid Penalty balance to be zero before an Officer signs their physical clearance paper. The system reports readiness only; it does not store a digital signing record.
_Avoid_: Sign-off

**Program**:
One of a fixed set of courses a Student selects at registration: Computer Science, Information Technology, Information System, ACT (Associate in Computer Technology). Governor-managed list.
_Avoid_: Course (use Program as the canonical term; "course" is the student-facing word but Program is used in code/data)
