"use server";

import { attendanceSessions, events } from "@attendance/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncPenaltyForSession } from "@/lib/penalties";

export async function updateSession(formData: FormData) {
  const officer = await requireOfficerOrGovernor();

  const sessionId = String(formData.get("sessionId") ?? "");
  const timeInRaw = String(formData.get("timeIn") ?? "");
  const timeOutRaw = String(formData.get("timeOut") ?? "");

  const session = await db.query.attendanceSessions.findFirst({
    where: eq(attendanceSessions.id, sessionId),
  });
  if (!session) redirect("/events");

  const event = await db.query.events.findFirst({ where: eq(events.id, session.eventId) });
  if (!event || (event.officerId !== officer.id && officer.role !== "governor")) {
    redirect("/events");
  }

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
