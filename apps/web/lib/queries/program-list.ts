"use server";

import type { ProgramListDetailedResponse } from "@attendance/contracts";
import { apiPost } from "@/lib/api-client";

// The Program list fetch (issue #277): one fetcher shared by every page that
// needs the detailed Program roster, instead of each page redefining its own
// copy. Usable directly for the SSR + initialData pattern, and as a client
// `queryFn` alongside programListQueryKey (ADR 0013).
export async function getProgramList(): Promise<ProgramListDetailedResponse> {
  return apiPost<ProgramListDetailedResponse>("program/list-detailed");
}
