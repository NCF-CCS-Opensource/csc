"use server";

import type { AttendanceGridResponse, EventGridRow } from "@attendance/contracts";
import { revalidatePath } from "next/cache";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { apiFetch } from "@/lib/api-client";

// This Event's grid, called by the server shell for the first paint and by the
// client cache's queryFn afterwards (ADR 0013). apiFetch forwards the browser
// session's identity token; the API remains the authorization and data owner.
export async function eventGrid(eventId: string): Promise<EventGridRow[]> {
  await requireOfficerOrGovernor();
  await apiFetch("/v1/api/attendance/materialize-no-shows", { eventId });
  return (await apiFetch<AttendanceGridResponse>("/v1/api/attendance/grid", { eventId })).rows;
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

  const { eventId } = await apiFetch<{ eventId: string }>("/v1/api/attendance/correct", { sessionId, field, present });
  revalidatePath(`/events/${eventId}/attendance`);
}

// Settle every unpaid Penalty a Student has for this Event in one click.
// Guarded by the one-un-voided-Payment-per-Penalty index — a double-submit
// conflicts to nothing rather than creating a second Payment.
export async function markPaid(penaltyIds: string[], eventId: string) {
  await apiFetch("/v1/api/attendance/payments", { penaltyIds });
  revalidatePath(`/events/${eventId}/attendance`);
}

// Undo a Student's Payments for this Event. Each is voided, never deleted —
// the API keeps the row with the voiding Officer and time, and its Penalty
// becomes unpaid (and payable) again.
export async function voidPayments(paymentIds: string[], eventId: string) {
  for (const paymentId of paymentIds) {
    await apiFetch("/v1/api/attendance/payments/void", { paymentId });
  }
  revalidatePath(`/events/${eventId}/attendance`);
}
