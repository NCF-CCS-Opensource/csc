# Architecture Deepening Plan

Status: approved for specification

## Outcome

Deepen four existing areas without changing the Vercel, Supabase, Drizzle, Expo, or Resend topology:

1. Scan Approval becomes one atomic, strictly idempotent command.
2. Event mutation becomes one shared lifecycle module for web and mobile.
3. Offline Scan Queue owns delivery state end to end.
4. Role policy becomes one capability source used by commands, guards, and navigation.

## Confirmed behavior

### Scan Approval

- A decision counts as delivered only when Scan, Attendance Session, and Penalty changes commit in one transaction.
- Identical `scanId` retry returns the completed result without changing attendance.
- Reusing `scanId` with different content returns `409 Conflict`.
- Multiple approved decisions resolve to earliest Time-in and latest Time-out.
- An unreadable QR cannot be approved.
- Student ID, name, and Program must all match the current Student; mismatch is retained as a rejection.

### Event lifecycle

- Create, update, and delete are three shared commands; listing remains a read query.
- Postgres enforces at most one open Semester.
- Semester date edits cannot exclude an existing Event.
- Event deletion is allowed only in an open Semester before any Scan or Attendance Session exists.
- Before attendance begins, all Event fields may change.
- After attendance begins, only name and venue may change.
- Closing a Semester freezes Event definition and deletion but still permits Attendance correction and Payment recording.

### Offline Scan Queue

- Queue state is partitioned by the Officer's stable Supabase user ID.
- Only that Officer may synchronize, review, or discard their decisions.
- Temporary network, timeout, `429`, and server failures retry immediately at enqueue, at startup, when connectivity returns, and with bounded exponential backoff while the app is open.
- Permanent failures move to Needs Review and do not block later decisions.
- Logout is blocked until pending decisions are delivered and Needs Review decisions are explicitly discarded.
- Recent Scans remains a separate five-item local read model.
- No background-task infrastructure is added.

### Role policy

- Capabilities, not scattered role comparisons, determine access.
- Authentication adapters resolve identity; deep command modules require capabilities.
- Missing identity maps to `401`/login; denied capability maps to `403`/the role landing page.
- Governors inherit every Officer capability, including mobile booth access.
- Mobile verifies identity after login and admits only Officers or Governors.
- Officer demotion is outside the domain until safe queue handoff is required.

## Module interfaces

| Module | Interface |
| --- | --- |
| Scan Approval | One command applying an authenticated actor's approve/reject decision |
| Event lifecycle | Three commands: create, update, delete |
| Offline Scan Queue | Enqueue, synchronize, discard, read state |
| Role policy | Test capability, require capability |
| Recent Scans | Read-only five-item local projection fed by Scan Approval outcomes |

Browser and mobile code remain adapters. Storage details, retries, transactions, and lifecycle rules do not leak across these seams.

## Delivery stages

1. Add a disposable Postgres test harness and central role policy.
2. Add transactional Scan Approval and its response contract.
3. Add Event lifecycle commands and database constraints.
4. Add the Officer-owned Offline Scan Queue, Needs Review, Recent Scans, and mobile role gate.

Each stage must remain deployable. The mobile stage waits until the compatible server contract is live.

## Testing

- Scan Approval and Event lifecycle use a disposable Postgres database so transactions and constraints are tested through their highest interface.
- Role policy tests capability outcomes without transport details.
- Offline Scan Queue tests observable state transitions, retry classification, owner isolation, delivery continuation, discard, and logout eligibility.
- Recent Scans tests its five-item limit and independence from queue durability.
- Existing Ledger tests remain the prior art for pure domain behavior.

## Out of scope

- Mobile Payment UI
- Desktop viewport gating
- Officer demotion or queue handoff
- Digital Clearance signing
- Background mobile tasks
- QR signing/rotation
- Deployment-provider replacement
