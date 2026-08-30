import type { RecentScan } from "./scanQueue";

type ScanOutcome = Pick<
  RecentScan,
  "decision" | "deliveryState" | "discarded" | "alreadyScanned"
>;

// A replayed/duplicate online scan that delivered as already-scanned — the
// single source both the label and the booth's styling call on, so they can't
// disagree about when an accept counts as "already scanned".
export function isAlreadyScanned(scan: ScanOutcome): boolean {
  return (
    scan.decision === "accepted" &&
    scan.deliveryState === "delivered" &&
    scan.alreadyScanned === true
  );
}

export function recentScanOutcomeLabel(scan: ScanOutcome): string {
  if (scan.discarded) return "! Needs Review · Discarded";
  if (isAlreadyScanned(scan)) return "Already scanned";
  return scan.decision === "accepted" ? "✓ Accepted" : "✕ Rejected";
}
