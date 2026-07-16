"use server";

import { attendanceSessions, events, payments, penalties } from "@attendance/db";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncPenaltyForSession } from "@/lib/penalties";

// Toggle one scan field Present/Absent. Present writes a sentinel (the Event's
// date at noon); Absent nulls it — nothing reads the exact moment here, only
// its non-null-ness drives isSessionAbsent (see ADR 0009). Re-syncs the
// Penalty so balances follow the change. Booth scans are unaffected.
export async function setScanField(
  sessionId: string,
  field: "timeIn" | "timeOut",
  present: boolean,
) {
  await requireOfficerOrGovernor();
  if (field !== "timeIn" && field !== "timeOut") return;

  const session = await db.query.attendanceSessions.findFirst({
    where: eq(attendanceSessions.id, sessionId),
  });
  if (!session) return;

  const event = await db.query.events.findFirst({ where: eq(events.id, session.eventId) });
  if (!event) return;

  const sentinel = present ? new Date(`${event.date}T12:00:00`) : null;
  const patch = field === "timeIn" ? { timeIn: sentinel } : { timeOut: sentinel };
  await db.update(attendanceSessions).set(patch).where(eq(attendanceSessions.id, sessionId));

  await syncPenaltyForSession(sessionId);
  revalidatePath(`/events/${event.id}/attendance`);
}

// Settle every unpaid Penalty a Student has for this Event in one click.
// Insert-only, guarded by payments.penaltyId's unique constraint — a
// double-submit conflicts to nothing rather than creating a second Payment.
export async function markPaid(penaltyIds: string[], eventId: string) {
  const officer = await requireOfficerOrGovernor();
  if (penaltyIds.length === 0) return;

  const rows = await db.query.penalties.findMany({
    where: inArray(penalties.id, penaltyIds),
  });
  if (rows.length === 0) return;

  await db
    .insert(payments)
    .values(rows.map((p) => ({ penaltyId: p.id, amount: p.amount, officerId: officer.id })))
    .onConflictDoNothing({ target: payments.penaltyId });

  revalidatePath(`/events/${eventId}/attendance`);
}
