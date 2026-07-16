import { attendanceSessions, events, penalties, students } from "@attendance/db";
import { and, eq, inArray, lt } from "drizzle-orm";
import { db } from "./db";
import { isSessionAbsent } from "./scan";

type Half = "am" | "pm";
type EventType = "whole_day" | "half_day";

// The absences a Student owes for one Event: expected sessions minus the ones
// they actually *completed* (both Time-in and Time-out). Pure so it's unit-
// tested — the money rule lives here, not tangled in the DB query.
//
// whole_day expects am + pm; half_day expects one. For half_day we can't know
// which half it was (the Event doesn't record it), so a total no-show is
// charged as "am" — the amount is 1x either way. A half_day attendee who
// completed *either* half owes nothing.
export function missingHalves(
  type: EventType,
  completed: { am: boolean; pm: boolean },
): Half[] {
  if (type === "half_day") {
    return completed.am || completed.pm ? [] : ["am"];
  }
  const out: Half[] = [];
  if (!completed.am) out.push("am");
  if (!completed.pm) out.push("pm");
  return out;
}

// No-shows leave no Attendance Session, so the per-session Penalty sync in
// lib/penalties.ts never fires for them. This backfills an absent session (and
// its Penalty, priced at that Event's own rate) for every Student who missed a
// PAST Event in the open Semester — so a full absence surfaces on the dashboard
// exactly like a partial one.
//
// Idempotent: the unique (eventId, studentId, half) constraint plus
// returning() means a repeated or concurrent run inserts each row at most once.
//
// ponytail: O(pastEvents x students) scan on every read that calls it. Fine at
// college scale; move to a per-Event "finalize" job if reads get slow.
export async function reconcileAbsences(semesterId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const pastEvents = await db
    .select({
      id: events.id,
      type: events.type,
      date: events.date,
      penalty: events.halfDayPenaltyAmount,
    })
    .from(events)
    .where(and(eq(events.semesterId, semesterId), lt(events.date, today)));
  if (pastEvents.length === 0) return;

  const allStudents = await db
    .select({ id: students.id, createdAt: students.createdAt })
    .from(students);
  if (allStudents.length === 0) return;

  const existing = await db
    .select({
      eventId: attendanceSessions.eventId,
      studentId: attendanceSessions.studentId,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
    })
    .from(attendanceSessions)
    .where(
      inArray(
        attendanceSessions.eventId,
        pastEvents.map((e) => e.id),
      ),
    );

  // A completed (present) session for a given event/student/half. Incomplete
  // sessions are left alone — lib/penalties.ts already priced them.
  const completed = new Set(
    existing
      .filter((r) => !isSessionAbsent(r))
      .map((r) => `${r.eventId}:${r.studentId}:${r.half}`),
  );
  // Any existing row (complete or not) — a half_day row means "attended".
  const present = new Set(existing.map((r) => `${r.eventId}:${r.studentId}:${r.half}`));

  const toInsert: { eventId: string; studentId: string; half: Half }[] = [];
  for (const ev of pastEvents) {
    for (const st of allStudents) {
      // A Student can't owe for an Event that predates their registration.
      if (st.createdAt.toISOString().slice(0, 10) > ev.date) continue;
      const done = {
        am: completed.has(`${ev.id}:${st.id}:am`),
        pm: completed.has(`${ev.id}:${st.id}:pm`),
      };
      for (const half of missingHalves(ev.type, done)) {
        // Skip halves that already have a row (incomplete) — don't duplicate.
        if (present.has(`${ev.id}:${st.id}:${half}`)) continue;
        toInsert.push({ eventId: ev.id, studentId: st.id, half });
      }
    }
  }
  if (toInsert.length === 0) return;

  const insertedSessions = await db
    .insert(attendanceSessions)
    .values(toInsert)
    .onConflictDoNothing()
    .returning({
      id: attendanceSessions.id,
      studentId: attendanceSessions.studentId,
      eventId: attendanceSessions.eventId,
    });
  if (insertedSessions.length === 0) return;

  const rateByEvent = new Map(pastEvents.map((e) => [e.id, e.penalty]));
  await db
    .insert(penalties)
    .values(
      insertedSessions.map((s) => ({
        attendanceSessionId: s.id,
        studentId: s.studentId,
        amount: rateByEvent.get(s.eventId)!,
      })),
    )
    .onConflictDoNothing();
}
