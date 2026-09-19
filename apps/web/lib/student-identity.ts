import type { IdentityResponse } from "@attendance/contracts";
import { apiPost, ApiError } from "./api-client";

// A 401 from the identity route means no Student row exists yet — the
// caller is Pending (ADR-0019: the API is the only place this is decided).
// Used only by the onboarding screen/action, which still gate on Clerk's
// currentUser() directly rather than a database read.
export async function alreadyStudent(): Promise<boolean> {
  try {
    await apiPost<IdentityResponse>("student/identity");
    return true;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return false;
    throw error;
  }
}
