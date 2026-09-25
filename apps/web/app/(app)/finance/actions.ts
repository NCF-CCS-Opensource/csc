"use server";

import type { DepartmentFundSummary } from "@attendance/contracts";
import { requireCapability } from "@/lib/auth";
import { apiPost } from "@/lib/api-client";

// The Department Fund's one read (issue #346), called by the server shell for
// the first paint and by the client cache's queryFn on every revisit (ADR 0013).
// Gated to Officers/Governors (manage_operations); a Student is redirected away
// by requireCapability, matching the API's own finance/summary gate.
export async function financeSummary(): Promise<DepartmentFundSummary> {
  await requireCapability("manage_operations");
  return apiPost<DepartmentFundSummary>("finance/summary");
}
