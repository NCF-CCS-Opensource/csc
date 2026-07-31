import { ApiError, apiFetch } from "./api";
import {
  dequeue,
  loadQueue,
  markNeedsReview,
  updateRecentScan,
  type QueuedScan,
} from "./scanQueue";

const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();

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

export function stopQueueRetries(officerId: string): void {
  const timer = retryTimers.get(officerId);
  if (timer) clearTimeout(timer);
  retryTimers.delete(officerId);
}

function scheduleRetry(
  officerId: string,
  onCountChange: ((count: number) => void) | undefined,
  attempt: number,
): void {
  stopQueueRetries(officerId);
  const delay = Math.min(1_000 * 2 ** attempt, 30_000);
  retryTimers.set(
    officerId,
    setTimeout(() => {
      retryTimers.delete(officerId);
      void deliverQueue(officerId, onCountChange, attempt + 1);
    }, delay),
  );
}

async function deliverQueue(
  officerId: string,
  onCountChange: ((count: number) => void) | undefined,
  retryAttempt: number,
): Promise<void> {
  const queue = await loadQueue(officerId);

  for (const scan of queue) {
    if (scan.deliveryState === "needs_review") continue;
    const [path, options] = requestFor(scan);
    try {
      await apiFetch(path, options, officerId);
      const remaining = await dequeue(scan.id, officerId);
      await updateRecentScan(officerId, scan.id, {
        deliveryState: "delivered",
      });
      onCountChange?.(remaining);
    } catch (error) {
      if (!isPermanent(error)) {
        scheduleRetry(officerId, onCountChange, retryAttempt);
        return;
      }
      await markNeedsReview(officerId, scan.id, error.message);
      await updateRecentScan(officerId, scan.id, {
        deliveryState: "needs_review",
        error: error.message,
      });
      onCountChange?.((await loadQueue(officerId)).length);
    }
  }
  stopQueueRetries(officerId);
}

export async function flushQueue(
  officerId: string,
  onCountChange?: (count: number) => void,
): Promise<void> {
  stopQueueRetries(officerId);
  await deliverQueue(officerId, onCountChange, 0);
}
