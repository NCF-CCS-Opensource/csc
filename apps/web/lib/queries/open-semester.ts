"use server";

import type { SemesterResponse } from "@attendance/contracts";
import { unstable_cache } from "next/cache";
import { apiFetch } from "@/lib/api-client";
import { OPEN_SEMESTER_CACHE_TAG } from "@/lib/queries/open-semester.query-key";

// The current-open-Semester lookup (issue #277): one fetcher shared by every
// page that needs it (Dashboard, My Attendance, Clearance, Events), instead
// of each page redefining its own copy. Usable directly from a server
// component/action for the SSR + initialData pattern, and as a client
// `queryFn` alongside openSemesterQueryKey (ADR 0013).
//
// Cached with no time-based revalidation (issue #307): the open Semester
// only changes when a Governor mutates it, so the four Semester actions in
// admin/actions.ts invalidate this via updateTag(OPEN_SEMESTER_CACHE_TAG)
// instead of it expiring on a timer.
export const getOpenSemester = unstable_cache(
  (): Promise<SemesterResponse | null> => apiFetch<SemesterResponse | null>("/v1/api/semester/current"),
  [OPEN_SEMESTER_CACHE_TAG],
  { revalidate: false, tags: [OPEN_SEMESTER_CACHE_TAG] },
);
