"use server";

import { revalidatePath } from "next/cache";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { correctAttendance, recordPayments } from "@/lib/penalties";

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

  const eventId = await correctAttendance(sessionId, field, present);
  if (eventId) revalidatePath(`/events/${eventId}/attendance`);
}

// Settle every unpaid Penalty a Student has for this Event in one click.
// Insert-only, guarded by payments.penaltyId's unique constraint — a
// double-submit conflicts to nothing rather than creating a second Payment.
export async function markPaid(penaltyIds: string[], eventId: string) {
  const officer = await requireOfficerOrGovernor();
  await recordPayments(penaltyIds, officer.id);
  revalidatePath(`/events/${eventId}/attendance`);
}
