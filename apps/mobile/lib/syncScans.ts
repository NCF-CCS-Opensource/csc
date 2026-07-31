import { ApiError, apiFetch } from "./api";
import {
  dequeue,
  failScan,
  loadQueue,
  updateRecentScan,
  type QueuedScan,
} from "./scanQueue";

function isPermanent(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 401 &&
    error.status !== 408 &&
    error.status !== 429
  );
}

function requestFor(scan: QueuedScan): [string, RequestInit] {
  return [
    `/api/scan/${scan.type}`,
    {
      method: "POST",
      body: JSON.stringify({
        scanId: scan.id,
        eventId: scan.eventId,
        ...(scan.type === "approve" ? { mode: scan.mode } : {}),
        qrPayload: scan.qrPayload,
        scannedAt: scan.scannedAt,
      }),
    },
  ];
}

export async function flushQueue(
  officerId: string,
  onCountChange?: (count: number) => void,
): Promise<void> {
  const queue = await loadQueue(officerId);

  for (const scan of queue) {
    if (scan.deliveryState === "failed") continue;
    const [path, options] = requestFor(scan);
    try {
      await apiFetch(path, options, officerId);
      const remaining = await dequeue(scan.id, officerId);
      await updateRecentScan(officerId, scan.id, { deliveryState: "synced" });
      onCountChange?.(remaining);
    } catch (error) {
      if (!isPermanent(error)) return;
      await failScan(officerId, scan.id, error.message);
      await updateRecentScan(officerId, scan.id, {
        deliveryState: "failed",
        error: error.message,
      });
      onCountChange?.((await loadQueue(officerId)).length);
    }
  }
}
