"use server";

import type { StudentLedgerResponse } from "@attendance/contracts";
import { apiFetch } from "@/lib/api-client";

// The Student's own attendance/Ledger fetch (issue #277): one fetcher shared
// by every page that needs the signed-in Student's own Ledger for a
// Semester, instead of each page redefining its own copy. Usable directly
// for the SSR + initialData pattern, and as a client `queryFn` alongside
// studentLedgerQueryKey (ADR 0013).
export async function getMyLedger(semesterId: string): Promise<StudentLedgerResponse> {
  return apiFetch<StudentLedgerResponse>("/v1/api/ledger/mine", { semesterId });
}
