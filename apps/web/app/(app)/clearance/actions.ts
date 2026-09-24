"use server";

import { revalidatePath } from "next/cache";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { ApiError, apiFetch } from "@/lib/api-client";

// Returned rather than thrown: Next redacts a thrown Server Action message in
// production, and the Officer needs the API's reason (already paid, no SAF
// Fee on this Semester, their own SAF Fee).
type Result = { error?: string };

async function run(path: string, body: Record<string, string>): Promise<Result> {
  await requireOfficerOrGovernor();
  try {
    await apiFetch(path, body);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  // Re-renders the page with fresh Ledger balances in this same round trip.
  revalidatePath("/clearance");
  return {};
}

export async function markSafFeePaid(studentId: string, semesterId: string): Promise<Result> {
  return run("/v1/api/attendance/payments/saf", { studentId, semesterId });
}

// Voided, never deleted: the API keeps the row with the voiding Officer.
export async function voidSafFeePayment(paymentId: string): Promise<Result> {
  return run("/v1/api/attendance/payments/void", { paymentId });
}
