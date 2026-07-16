"use server";

import { attendanceSessions, events, payments, penalties } from "@attendance/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncPenaltyForSession } from "@/lib/penalties";

export async function updateSession(formData: FormData) {
  await requireOfficerOrGovernor();

  const sessionId = String(formData.get("sessionId") ?? "");
  const timeInRaw = String(formData.get("timeIn") ?? "");
  const timeOutRaw = String(formData.get("timeOut") ?? "");

  const session = await db.query.attendanceSessions.findFirst({
    where: eq(attendanceSessions.id, sessionId),
  });
  if (!session) redirect("/events");

  const event = await db.query.events.findFirst({ where: eq(events.id, session.eventId) });
  if (!event) redirect("/events");

  // Clearing a field (empty input) is how the table marks that half absent —
  // the penalty is never set directly, only ever derived from this write.
  await db
    .update(attendanceSessions)
    .set({
      timeIn: timeInRaw ? new Date(timeInRaw) : null,
      timeOut: timeOutRaw ? new Date(timeOutRaw) : null,
    })
    .where(eq(attendanceSessions.id, sessionId));

  await syncPenaltyForSession(sessionId);

  redirect(`/events/${event.id}/attendance`);
}

export async function recordPayment(formData: FormData) {
  const officer = await requireOfficerOrGovernor();

  const penaltyId = String(formData.get("penaltyId") ?? "");

  const penalty = await db.query.penalties.findFirst({ where: eq(penalties.id, penaltyId) });
  if (!penalty) redirect("/events");

  const session = await db.query.attendanceSessions.findFirst({
    where: eq(attendanceSessions.id, penalty.attendanceSessionId),
  });
  const event = session
    ? await db.query.events.findFirst({ where: eq(events.id, session.eventId) })
    : null;
  if (!event) redirect("/events");

  // Insert-only, guarded by payments.penaltyId's unique constraint — a
  // double-submit upserts to nothing rather than creating a second Payment.
  await db
    .insert(payments)
    .values({ penaltyId, amount: penalty.amount, officerId: officer.id })
    .onConflictDoNothing({ target: payments.penaltyId });

  redirect(`/events/${event.id}/attendance`);
}
