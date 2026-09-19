import type { IdentityResponse } from "@attendance/contracts";
import { apiPost, ApiError } from "./api-client";

// An exact verified GBox address is sufficient to claim its corresponding
// roster row. This is used before rendering onboarding at all — any refusal
// (no verified email, not a school address, no roster match) just means the
// caller stays Pending and sees the form, so it collapses to undefined.
export async function claimRosterByEmail(): Promise<IdentityResponse | undefined> {
  try {
    return await apiPost<IdentityResponse>("enrollment-roster/claim");
  } catch (error) {
    if (error instanceof ApiError) return undefined;
    throw error;
  }
}

// Bubbles ApiError so the caller can report the specific field/message
// (Student ID required, no match, etc.) on the onboarding form.
export function claimRosterByStudentId(studentId: string): Promise<IdentityResponse> {
  return apiPost<IdentityResponse>("enrollment-roster/claim", { studentId });
}
