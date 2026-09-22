"use server";

import type { SemesterResponse } from "@attendance/contracts";
import { apiFetch } from "@/lib/api-client";

// The current-open-Semester lookup (issue #277): one fetcher shared by every
// page that needs it (Dashboard, My Attendance, Clearance, Events), instead
// of each page redefining its own copy. Usable directly from a server
// component/action for the SSR + initialData pattern, and as a client
// `queryFn` alongside openSemesterQueryKey (ADR 0013).
export async function getOpenSemester(): Promise<SemesterResponse | null> {
  return apiFetch<SemesterResponse | null>("/v1/api/semester/current");
}
