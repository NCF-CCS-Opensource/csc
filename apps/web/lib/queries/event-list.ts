"use server";

import type { EventResponse } from "@attendance/contracts";
import { apiFetch } from "@/lib/api-client";

// The Event list fetch (issue #277): one fetcher shared by every page that
// needs the full Event list, instead of each page redefining its own copy.
// Usable directly for the SSR + initialData pattern, and as a client
// `queryFn` alongside eventListQueryKey (ADR 0013).
export async function getEventList(): Promise<EventResponse[]> {
  return apiFetch<EventResponse[]>("/v1/api/event/list");
}
