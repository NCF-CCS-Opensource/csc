import type { QueueSummary } from "./scanQueue";

/** Tab badge / screen header count: everything not yet safely delivered
 * (needs-review + still-pending), per issue #243. */
export function unresolvedCount(summary: QueueSummary): number {
  return summary.needsReview + summary.pending;
}

export type NetworkStatus = "online" | "offline" | "unknown";

/** Maps NetInfo's tri-state `isConnected` to a stable status the banner can
 * key its copy/color off. `null`/`undefined` (before the first NetInfo event
 * resolves) reads as "unknown", never a false "offline". */
export function networkStatus(
  isConnected: boolean | null | undefined,
): NetworkStatus {
  if (isConnected === true) return "online";
  if (isConnected === false) return "offline";
  return "unknown";
}
