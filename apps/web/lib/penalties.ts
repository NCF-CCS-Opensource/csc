import { attendanceSessions, events, payments, penalties } from "@attendance/db";
import { eq } from "drizzle-orm";
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
