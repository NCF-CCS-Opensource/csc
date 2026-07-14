import { apiFetch } from "./api";
import { dequeue, loadQueue } from "./scanQueue";

// Sends queued scans in order, oldest first. Stops at the first failure
// (still offline, or a server error) so the rest stay queued for next time —
// each request is keyed by the scan's own id, so a retried send upserts on
// the server rather than duplicating.
export async function flushQueue(onCountChange?: (count: number) => void): Promise<void> {
  const queue = await loadQueue();

  for (const scan of queue) {
    try {
      if (scan.type === "approve") {
        await apiFetch("/api/scan/approve", {
          method: "POST",
          body: JSON.stringify({
            scanId: scan.id,
            eventId: scan.eventId,
            mode: scan.mode,
            qrPayload: scan.qrPayload,
            scannedAt: scan.scannedAt,
          }),
        });
      } else {
        await apiFetch("/api/scan/reject", {
          method: "POST",
          body: JSON.stringify({
            scanId: scan.id,
            eventId: scan.eventId,
            qrPayload: scan.qrPayload,
            scannedAt: scan.scannedAt,
          }),
        });
      }
      const remaining = await dequeue(scan.id);
      onCountChange?.(remaining);
    } catch {
      return;
    }
  }
}
