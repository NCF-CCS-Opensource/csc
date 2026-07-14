import { attendanceSessions, events, payments, penalties } from "@attendance/db";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { isSessionAbsent } from "./scan";

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
export async function syncPenaltyForSession(sessionId: string): Promise<void> {
  const session = await db.query.attendanceSessions.findFirst({
    where: eq(attendanceSessions.id, sessionId),
  });
  if (!session) return;

  const event = await db.query.events.findFirst({ where: eq(events.id, session.eventId) });
  if (!event) return;

  const amount = computeSessionPenalty(session, event.halfDayPenaltyAmount);

  const existing = await db.query.penalties.findFirst({
    where: eq(penalties.attendanceSessionId, sessionId),
  });

  if (amount === null) {
    if (!existing) return;
    // Payments are immutable — a Penalty that's already been paid stays on
    // the books even if a later attendance correction would otherwise clear
    // it, so the payment always references a real row.
    const paid = await db.query.payments.findFirst({
      where: eq(payments.penaltyId, existing.id),
    });
    if (!paid) {
      await db.delete(penalties).where(eq(penalties.id, existing.id));
    }
    return;
  }
  if (existing) {
    await db.update(penalties).set({ amount }).where(eq(penalties.id, existing.id));
  } else {
    await db
      .insert(penalties)
      .values({ attendanceSessionId: sessionId, studentId: session.studentId, amount });
  }
}
