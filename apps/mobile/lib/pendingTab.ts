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

export type LogoutCounts = {
  blockingCount: number;
  legacyCount: number;
  needsReviewCount: number;
};

export type LogoutResolution =
  | { canLogout: true }
  | { canLogout: false; reason: "quarantined_legacy"; legacyCount: number }
  | {
      canLogout: false;
      reason: "unresolved_scans";
      count: number;
      actionLabel: "Review in Pending" | "View Pending";
      message: string;
    };

/** Determines logout decision and directs officers to the Pending tab
 * when unresolved scans remain (issue #245). */
export function logoutResolution(counts: LogoutCounts): LogoutResolution {
  const { blockingCount, legacyCount, needsReviewCount } = counts;
  if (blockingCount === 0 && legacyCount === 0) {
    return { canLogout: true };
  }
  if (blockingCount === 0) {
    return {
      canLogout: false,
      reason: "quarantined_legacy",
      legacyCount,
    };
  }
  const scanWord =
    blockingCount === 1 ? "1 scan remains" : `${blockingCount} scans remain`;
  const actionLabel =
    needsReviewCount > 0 ? "Review in Pending" : "View Pending";
  const message =
    needsReviewCount > 0
      ? `${scanWord} unresolved. Reconnect to retry Pending scans, or review Needs Review rows in the Pending tab.`
      : `${scanWord} unresolved. Reconnect to retry Pending scans.`;

  return {
    canLogout: false,
    reason: "unresolved_scans",
    count: blockingCount,
    actionLabel,
    message,
  };
}

