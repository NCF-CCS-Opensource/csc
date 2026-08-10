"use server";

import { attendanceSessions, events, payments, penalties, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  computeEventGrid,
  materializeEventNoShows,
  type EventGridRow,
} from "@/lib/ledger";
import { correctAttendance, recordPayments } from "@/lib/penalties";

// This Event's grid, called by the server shell for the first paint and by the
// client cache's queryFn afterwards (ADR 0013). No API route: this authorizes
// the browser session, leaving the booth's Bearer path untouched.
export async function eventGrid(eventId: string): Promise<EventGridRow[]> {
  await requireOfficerOrGovernor();

  const event = await db.query.events.findFirst({ where: eq(events.id, eventId) });
  if (!event) return [];

  // Give every no-show a real absent session + Penalty row so it appears here
  // as a payable row. Scoped to this Event, idempotent — safe to repeat.
  await materializeEventNoShows(event.id);

  const sessionRows = await db
    .select({
      id: attendanceSessions.id,
      studentId: attendanceSessions.studentId,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
      name: students.name,
      studentIdText: students.studentId,
    })
    .from(attendanceSessions)
    .innerJoin(students, eq(attendanceSessions.studentId, students.id))
    .where(eq(attendanceSessions.eventId, event.id))
    .orderBy(students.name);

  const penaltyRows = await db
    .select({
      id: penalties.id,
      attendanceSessionId: penalties.attendanceSessionId,
      amount: penalties.amount,
    })
    .from(penalties)
    .innerJoin(attendanceSessions, eq(penalties.attendanceSessionId, attendanceSessions.id))
    .where(eq(attendanceSessions.eventId, event.id));

  const paymentRows = await db
    .select({ penaltyId: payments.penaltyId })
    .from(payments)
    .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
    .innerJoin(attendanceSessions, eq(penalties.attendanceSessionId, attendanceSessions.id))
    .where(eq(attendanceSessions.eventId, event.id));

  // Distinct liable Students, in name order (materialize ran first, so every
  // liable Student already has session rows).
  const studentList = [...new Map(sessionRows.map((r) => [r.studentId, r])).values()].map(
    (r) => ({ id: r.studentId, name: r.name, studentId: r.studentIdText }),
  );

  return computeEventGrid({
    eventType: event.type,
    students: studentList,
    sessions: sessionRows,
    penalties: penaltyRows,
    payments: paymentRows,
  });
}

// Toggle one scan field Present/Absent. Present writes a sentinel (the Event's
// date at noon); Absent nulls it — nothing reads the exact moment here, only
// its non-null-ness drives isSessionAbsent (see ADR 0009). Re-syncs the
// Penalty so balances follow the change. Booth scans are unaffected.
//
// Throws rather than returning quietly when nothing was written: the caller
// shows the Officer the new value before the write lands, so a silent no-op
// would leave a correction on screen that the database never took.
export async function setScanField(
  sessionId: string,
  field: "timeIn" | "timeOut",
  present: boolean,
) {
  await requireOfficerOrGovernor();
  if (field !== "timeIn" && field !== "timeOut") {
    throw new Error("Unknown scan field");
  }

  const eventId = await correctAttendance(sessionId, field, present);
  if (!eventId) throw new Error("Attendance Session no longer exists");
  revalidatePath(`/events/${eventId}/attendance`);
}

// Settle every unpaid Penalty a Student has for this Event in one click.
// Insert-only, guarded by payments.penaltyId's unique constraint — a
// double-submit conflicts to nothing rather than creating a second Payment.
export async function markPaid(penaltyIds: string[], eventId: string) {
  const officer = await requireOfficerOrGovernor();
  await recordPayments(penaltyIds, officer.id);
  revalidatePath(`/events/${eventId}/attendance`);
}
