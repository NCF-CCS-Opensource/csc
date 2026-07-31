# Deepen Scan Approval, Event Lifecycle, Offline Delivery, and Role Policy

## Problem Statement

Officers need every Scan Approval to produce one trustworthy attendance outcome even when mobile delivery is duplicated, delayed, out of order, or interrupted. Today, Scan, Attendance Session, and Penalty persistence can partially succeed; Event rules are duplicated across web and mobile callers; one permanent mobile delivery failure blocks later decisions; queue state is not safely owned by one Officer; and role knowledge is spread across authentication guards, routes, and navigation.

These shallow seams make correctness depend on callers coordinating implementation details. They also leave historical Event data vulnerable to destructive or money-changing edits, allow documented role behavior to drift from enforcement, and make the most important failure modes difficult to test through a stable interface.

## Solution

Deepen four modules while retaining the existing Vercel, Supabase, Drizzle, Expo, and Resend topology:

1. Make Scan Approval one atomic, strictly idempotent command that validates canonical Student data, resolves out-of-order capture times deterministically, and synchronizes the Penalty in the same database transaction.
2. Put Event creation, update, and deletion behind one lifecycle module shared by web and mobile adapters, with Postgres enforcing the critical Semester invariant.
3. Make the Offline Scan Queue own Officer-partitioned persistence, retry classification, Needs Review state, delivery continuation, discard, and logout eligibility.
4. Replace scattered role comparisons with one capability policy used by deep commands, guards, navigation, and mobile admission.

Recent Scans remains a separate five-item local read model. Clearance remains a readiness result for signing physical paper. Server correctness is delivered before the compatible mobile queue release.

## User Stories

1. As an Officer, I want an approved Scan to count as delivered only after every attendance and Penalty change commits, so that a partial backend failure cannot silently lose attendance.
2. As an Officer, I want a failed Scan Approval transaction to remain queued, so that retry can complete the decision safely.
3. As an Officer, I want retrying an already-completed decision to return success, so that a lost response does not require manual recovery.
4. As an Officer, I want a reused Scan UUID with different content to be rejected, so that one idempotency identity cannot represent conflicting decisions.
5. As an Officer, I want multiple Time-in decisions to retain the earliest device capture time, so that delivery order cannot move arrival later.
6. As an Officer, I want multiple Time-out decisions to retain the latest device capture time, so that delivery order cannot move departure earlier.
7. As an Officer, I want every accepted Scan record retained even when another capture time becomes canonical, so that booth activity remains reviewable.
8. As an Officer, I want an unreadable QR to show no trusted Student details and disable approval, so that demo or fabricated identity cannot be accepted.
9. As an Officer, I want QR Student ID, name, and Program to match the current Student record, so that stale or altered QR data cannot create attendance.
10. As a Governor, I want unreadable and non-canonical QR attempts retained as rejections, so that suspicious booth activity can be reviewed.
11. As an Officer, I want Event creation to use the same rules on web and mobile, so that device choice does not change the outcome.
12. As an Officer, I want Event edits to use the same rules on web and mobile, so that Event history remains consistent.
13. As an Officer, I want Event deletion to use the same rules on web and mobile, so that one client cannot bypass history protection.
14. As an Officer, I want to delete an Event before attendance begins, so that setup mistakes can be removed cleanly.
15. As an Officer, I want deletion blocked after any Scan or Attendance Session exists, so that attendance and financial history cannot cascade away.
16. As an Officer, I want all Event details editable before attendance begins, so that setup mistakes can be corrected.
17. As an Officer, I want only Event name and venue editable after attendance begins, so that date, type, and Penalty rules cannot rewrite history.
18. As a Governor, I want closed-Semester Event definition and deletion frozen, so that historical reporting stays auditable.
19. As an Officer, I want Attendance correction and Payment recording to remain available after Semester closure, so that reconciliation can finish.
20. As a Governor, I want Semester date edits blocked when they would exclude an existing Event, so that every Event remains inside its Semester.
21. As a Governor, I want Postgres to enforce at most one open Semester, so that concurrent or out-of-band writes cannot violate the rule.
22. As an Officer, I want queued decisions partitioned by my authenticated identity, so that another account cannot sync or discard my booth work.
23. As an Officer, I want pending decisions restored after app restart, so that temporary shutdown does not lose capture-time truth.
24. As an Officer, I want temporary network, timeout, rate-limit, and server failures retried automatically, so that ordinary outages require no manual work.
25. As an Officer, I want retries at enqueue, startup, connectivity return, and bounded intervals while open, so that delivery recovers promptly without unbounded requests.
26. As an Officer, I want a permanently rejected decision moved to Needs Review, so that it stops retrying but remains visible.
27. As an Officer, I want later valid decisions to continue syncing after one permanent rejection, so that one bad item cannot block the booth.
28. As an Officer, I want to inspect and explicitly discard a Needs Review decision, so that permanent failures have a deliberate resolution.
29. As an Officer, I want logout blocked while pending or Needs Review decisions remain, so that my decisions cannot be stranded or misattributed.
30. As an Officer, I want Recent Scans to show the latest five approve/reject decisions and pending state, so that I can verify recent booth activity.
31. As an Officer, I want Recent Scans eviction to leave the Offline Scan Queue untouched, so that display history cannot delete durable work.
32. As a Student, I want the mobile app to reject my role before showing booth tabs, so that privileged functionality is not misleadingly exposed.
33. As a Governor, I want to use the native booth app, so that role inheritance includes every Officer capability.
34. As an authenticated caller without permission, I want a clear forbidden result rather than an unauthenticated result, so that clients can respond correctly.
35. As an unauthenticated caller, I want protected mobile routes to return an authentication failure, so that expired or missing sessions are distinguishable.
36. As a maintainer, I want one capability policy for commands, guards, and navigation, so that role behavior cannot drift between callers.
37. As a maintainer, I want browser and mobile code to remain transport adapters, so that domain validation and persistence are tested once.
38. As a maintainer, I want Scan Approval transactions tested against disposable Postgres, so that rollback and constraints are proven rather than mocked.
39. As a maintainer, I want Event lifecycle rules tested against disposable Postgres, so that history protection and Semester constraints are proven.
40. As a maintainer, I want queue tests to observe state transitions through its public operations, so that AsyncStorage details can change safely.
41. As a maintainer, I want role-policy tests to observe capability outcomes, so that transport implementation does not define authorization.
42. As DevOps, I want the server contract deployed before the mobile queue release, so that upgraded clients never depend on missing behavior.
43. As DevOps, I want migrations applied before dependent server code, so that database invariants are present when commands begin using them.
44. As DevOps, I want a physical-device smoke test covering duplicate retry, Needs Review continuation, logout blocking, Governor admission, and Student rejection, so that the complete field workflow is verified.

## Implementation Decisions

- Keep the current deployment topology and providers.
- Treat browser server actions and mobile HTTP routes as adapters, not owners of domain rules.
- The Scan Approval module exposes one command that receives an authenticated actor and one approve/reject decision.
- The Scan Approval command owns capability enforcement, Event and booth-mode validation, QR parsing, exact Student ID/name/Program matching, strict idempotency, the database transaction, Attendance Session resolution, Penalty synchronization, and its result.
- A Scan UUID permanently identifies one unchanged decision. Identical replay returns the completed result; conflicting replay returns HTTP `409`.
- Approved Scan, Attendance Session, and Penalty writes commit or roll back together.
- Earliest Time-in and latest Time-out are canonical regardless of delivery order; every accepted Scan record remains retained.
- Unreadable or non-canonical QR approval attempts are retained as rejected Scans and do not alter attendance.
- The Event lifecycle module exposes three commands: create, update, and delete. Event listing remains a read query.
- Event commands receive the authenticated actor and own capability, open-Semester, date-range, attendance-started, closed-Semester, and persistence rules.
- Postgres enforces at most one open Semester.
- Semester date changes cannot exclude an existing Event.
- Event deletion is allowed only in an open Semester before any Scan or Attendance Session exists.
- Before attendance begins, all Event fields may change. Afterward, only name and venue may change.
- Semester closure freezes Event creation, definition, and deletion but does not block Attendance correction or Payment recording.
- The Offline Scan Queue exposes enqueue, synchronize, discard, and read-state operations.
- Queue persistence is partitioned by Supabase user ID, and only the same signed-in Officer or Governor can act on it.
- Temporary failures include network errors, timeouts, HTTP `429`, and server errors. They retry immediately after enqueue, at app startup, when connectivity returns, and with bounded exponential backoff while the app remains open.
- Permanent client errors become Needs Review Scan Decisions. They do not retry automatically and do not block later queue items.
- Logout is unavailable until pending decisions are delivered and Needs Review decisions are explicitly discarded.
- Recent Scans remains an independent five-item local projection fed by Scan Approval outcomes; its eviction never affects queue persistence.
- Role policy exposes a capability predicate for display and a required-capability check for deep commands.
- Authentication adapters distinguish missing identity from denied capability. Mobile routes return `401` for missing identity and `403` for denied capability; web redirects to login or the actor's role landing page respectively.
- Governors inherit all Officer capabilities, including mobile booth access.
- Mobile verifies identity immediately after login and renders booth tabs only for Officers or Governors.
- Delivery order is: disposable Postgres checks and role policy; transactional Scan Approval; Event lifecycle and constraints; Offline Scan Queue, Recent Scans, and mobile role admission.

## Testing Decisions

- Tests assert external module behavior, not private helper calls, SQL statement count, AsyncStorage keys, or transport parsing.
- Scan Approval is tested through its single command against disposable Postgres.
- Scan Approval cases include atomic rollback, identical replay, conflicting replay, readable/canonical validation, rejection retention, earliest Time-in, latest Time-out, out-of-order delivery, and Penalty synchronization.
- Event lifecycle is tested through create/update/delete commands against disposable Postgres.
- Event cases include one-open-Semester enforcement, Semester range protection, pre-attendance edits/deletion, post-attendance field locks, closed-Semester locks, and continued Attendance/Payment reconciliation.
- Offline Scan Queue is tested through enqueue, synchronize, discard, and read state.
- Queue cases include owner isolation, persistence across reload, temporary retry, permanent Needs Review transition, continued later delivery, explicit discard, bounded retry scheduling, and logout eligibility.
- Recent Scans is tested through its read behavior, five-item limit, pending-state projection, and independence from queue durability.
- Role policy is tested through capability outcomes for Student, Officer, and Governor.
- Mobile admission is tested for Student rejection and Officer/Governor acceptance.
- Existing Ledger tests are prior art for pure domain behavior and remain unchanged unless a new externally visible Ledger rule requires it.
- Physical-device smoke testing verifies the complete queue and role flow after server deployment.

## Out of Scope

- Mobile Payment entry UI
- Desktop viewport gating
- Officer demotion or Offline Scan Queue handoff
- Digital Clearance signing or a Clearance table
- Background mobile task infrastructure
- QR signing, encryption, rotation, or payload minimization
- Partial Payments
- Per-Officer Event ownership
- Replacing Vercel, Supabase, Drizzle, Expo, Resend, or Cloudflare
- Production SLO definition, incident ownership, or backup policy

## Further Notes

- Clearance remains a computed readiness gate for an Officer signing physical paper.
- Governors may use the native booth under ADR-0010, which supersedes only the Governor platform restriction in ADR-0006.
- The mobile release must follow the compatible server release.
- Migration rollback remains forward-fix; destructive production migration work requires a backup.
- The smallest safe implementation uses plain functions and existing dependencies. No command bus, repository interface, factory hierarchy, or background-job framework is required.
