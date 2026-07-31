import { attendanceSessions, events, payments, penalties } from "@attendance/db";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { isSessionAbsent } from "./scan";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// A Penalty is charged per absent Attendance Session, never set manually —
// see CONTEXT.md's Penalty entry. Whole-day absence (both halves absent)
// isn't computed here; it falls out of summing each half's penalty row.
export function computeSessionPenalty(
  session: { timeIn: unknown; timeOut: unknown },
  halfDayPenaltyAmount: string,
): string | null {
  return isSessionAbsent(session) ? halfDayPenaltyAmount : null;
}

// Called after every Attendance Session write (booth scan or table edit) so
// the Penalty always reflects current attendance — never set manually.
export async function syncPenaltyForSession(
  sessionId: string,
  database: typeof db | Transaction = db,
): Promise<void> {
  const session = await database.query.attendanceSessions.findFirst({
    where: eq(attendanceSessions.id, sessionId),
  });
  if (!session) return;

  const event = await database.query.events.findFirst({
    where: eq(events.id, session.eventId),
  });
  if (!event) return;

  const amount = computeSessionPenalty(session, event.halfDayPenaltyAmount);

  const existing = await database.query.penalties.findFirst({
    where: eq(penalties.attendanceSessionId, sessionId),
  });

  if (amount === null) {
    if (!existing) return;
    // Payments are immutable — a Penalty that's already been paid stays on
    // the books even if a later attendance correction would otherwise clear
    // it, so the payment always references a real row.
    const paid = await database.query.payments.findFirst({
      where: eq(payments.penaltyId, existing.id),
    });
    if (!paid) {
      await database.delete(penalties).where(eq(penalties.id, existing.id));
    }
    return;
  }
  if (existing) {
    await database
      .update(penalties)
      .set({ amount })
      .where(eq(penalties.id, existing.id));
  } else {
    await database
      .insert(penalties)
      .values({ attendanceSessionId: sessionId, studentId: session.studentId, amount });
  }
}

export async function correctAttendance(
  sessionId: string,
  field: "timeIn" | "timeOut",
  present: boolean,
): Promise<string | null> {
  return db.transaction(async (tx) => {
    const session = await tx.query.attendanceSessions.findFirst({
      where: eq(attendanceSessions.id, sessionId),
    });
    if (!session) return null;

    const event = await tx.query.events.findFirst({
      where: eq(events.id, session.eventId),
    });
    if (!event) return null;

    const value = present ? new Date(`${event.date}T12:00:00`) : null;
    await tx
      .update(attendanceSessions)
      .set(field === "timeIn" ? { timeIn: value } : { timeOut: value })
      .where(eq(attendanceSessions.id, sessionId));
    await syncPenaltyForSession(sessionId, tx);
    return event.id;
  });
}

export async function recordPayments(
  penaltyIds: string[],
  officerId: string,
): Promise<void> {
  if (penaltyIds.length === 0) return;
  const rows = await db.query.penalties.findMany({
    where: inArray(penalties.id, penaltyIds),
  });
  if (rows.length === 0) return;
  await db
    .insert(payments)
    .values(rows.map(({ id, amount }) => ({ penaltyId: id, amount, officerId })))
    .onConflictDoNothing({ target: payments.penaltyId });
}
