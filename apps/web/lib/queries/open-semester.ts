"use server";

import type { SemesterResponse } from "@attendance/contracts";
import { auth } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";
import { apiFetchWithToken } from "@/lib/api-client";
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
//
// auth() can't be called inside unstable_cache (Clerk forbids reading
// headers() in a cached scope), so the token is minted here and passed in.
// ponytail: token is a cache-key argument, so a rotated token forces a
// refetch even though the underlying data didn't change — switch to a
// service-level credential if that dedupe loss starts to matter.
export async function getOpenSemester(): Promise<SemesterResponse | null> {
  const { getToken } = await auth();
  const token = await getToken();
  return getOpenSemesterCached(token);
}

const getOpenSemesterCached = unstable_cache(
  (token: string | null): Promise<SemesterResponse | null> =>
    apiFetchWithToken<SemesterResponse | null>("/v1/api/semester/current", {}, token),
  [OPEN_SEMESTER_CACHE_TAG],
  { revalidate: false, tags: [OPEN_SEMESTER_CACHE_TAG] },
);
