import AsyncStorage from "@react-native-async-storage/async-storage";

const LEGACY_QUEUE_KEY = "attendance.scanQueue.v1";
const QUEUE_KEY = "attendance.scanQueue.v2";
const RECENT_KEY = "attendance.recentScans.v1";
let storageMutation = Promise.resolve();
// ponytail: one device has one scanner; split this lock per storage key only if write throughput matters.

export type DeliveryState = "pending" | "delivered" | "needs_review";

export type QueuedScan = {
  id: string;
  officerId: string | null;
  type: "approve" | "reject";
  eventId: string;
  mode: string;
  qrPayload: string;
  scannedAt: string;
  decisionAt: string;
  deliveryState: "pending" | "needs_review";
  error?: string;
};

export type RecentScan = {
  id: string;
  officerId: string;
  studentName: string;
  studentId: string;
  eventName: string;
  mode: string;
  scannedAt: string;
  decisionAt: string;
  decision: "accepted" | "rejected";
  deliveryState: DeliveryState;
  error?: string;
  discarded?: boolean;
};

function parseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
}

function mutate<T>(operation: () => Promise<T>): Promise<T> {
  const result = storageMutation.then(operation, operation);
  storageMutation = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function loadAllQueue(): Promise<QueuedScan[]> {
  const current = await AsyncStorage.getItem(QUEUE_KEY);
  if (current !== null) {
    return parseArray<
      Omit<QueuedScan, "deliveryState"> & { deliveryState: string }
    >(current).map((scan) => ({
      ...scan,
      deliveryState:
        scan.deliveryState === "failed"
          ? "needs_review"
          : scan.deliveryState,
    })) as QueuedScan[];
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_QUEUE_KEY);
  const legacy = parseArray<Record<string, unknown>>(legacyRaw).map(
    (scan): QueuedScan => ({
      ...(scan as Omit<QueuedScan, "officerId" | "deliveryState" | "error">),
      mode: typeof scan.mode === "string" ? scan.mode : "unknown",
      decisionAt: typeof scan.decisionAt === "string" ? scan.decisionAt : String(scan.scannedAt),
      officerId: null,
      deliveryState: "pending",
    }),
  );
  await saveQueue(legacy);
  if (legacyRaw !== null) await AsyncStorage.removeItem(LEGACY_QUEUE_KEY);
  return legacy;
}

async function saveQueue(queue: QueuedScan[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function loadQueue(officerId: string): Promise<QueuedScan[]> {
  return (await loadAllQueue()).filter((scan) => scan.officerId === officerId);
}

export async function enqueue(scan: QueuedScan): Promise<number> {
  return mutate(async () => {
    const queue = await loadAllQueue();
    queue.push(scan);
    await saveQueue(queue);
    return queue.filter((item) => item.officerId === scan.officerId).length;
  });
}

export async function dequeue(id: string, officerId: string): Promise<number> {
  return mutate(async () => {
    const queue = await loadAllQueue();
    const next = queue.filter(
      (scan) => scan.id !== id || scan.officerId !== officerId,
    );
    await saveQueue(next);
    return next.filter((scan) => scan.officerId === officerId).length;
  });
}

export async function markNeedsReview(
  officerId: string,
  id: string,
  error: string,
): Promise<void> {
  await mutate(async () => {
    const queue = await loadAllQueue();
    await saveQueue(
      queue.map((scan) =>
        scan.id === id && scan.officerId === officerId
          ? { ...scan, deliveryState: "needs_review", error }
          : scan,
      ),
    );
  });
}

export async function retryScan(officerId: string, id: string): Promise<boolean> {
  const found = await mutate(async () => {
    const queue = await loadAllQueue();
    const found = queue.some((scan) => scan.id === id && scan.officerId === officerId);
    await saveQueue(
      queue.map((scan) => {
        if (scan.id !== id || scan.officerId !== officerId) return scan;
        const { error: _error, ...pending } = scan;
        return { ...pending, deliveryState: "pending" };
      }),
    );
    return found;
  });
  if (!found) return false;
  await updateRecentScan(officerId, id, {
    deliveryState: "pending",
    error: undefined,
    discarded: false,
  });
  return true;
}

export async function discardScan(officerId: string, id: string): Promise<number> {
  const remaining = await dequeue(id, officerId);
  await updateRecentScan(officerId, id, {
    deliveryState: "needs_review",
    discarded: true,
  });
  return remaining;
}

export async function discardLegacyScans(): Promise<void> {
  await mutate(async () =>
    saveQueue((await loadAllQueue()).filter((scan) => scan.officerId !== null)),
  );
}

export async function blockingScanCount(officerId: string): Promise<number> {
  const queue = await loadAllQueue();
  return queue.filter((scan) => scan.officerId === officerId).length;
}

export async function legacyScans(): Promise<QueuedScan[]> {
  return (await loadAllQueue()).filter((scan) => scan.officerId === null);
}

export async function claimLegacyScans(officerId: string): Promise<number> {
  return mutate(async () => {
    const queue = (await loadAllQueue()).map((scan) =>
      scan.officerId === null ? { ...scan, officerId } : scan,
    );
    await saveQueue(queue);
    return queue.filter((scan) => scan.officerId === officerId).length;
  });
}

export async function needsReviewScans(officerId: string): Promise<QueuedScan[]> {
  return (await loadQueue(officerId)).filter(
    (scan) => scan.deliveryState === "needs_review",
  );
}

function recentKey(officerId: string): string {
  return `${RECENT_KEY}.${officerId}`;
}

export async function loadRecentScans(officerId: string): Promise<RecentScan[]> {
  return parseArray<
    Omit<RecentScan, "deliveryState"> & { deliveryState: string }
  >(
    await AsyncStorage.getItem(recentKey(officerId)),
  ).map((scan) => ({
    ...scan,
    deliveryState:
      scan.deliveryState === "synced"
        ? "delivered"
        : scan.deliveryState === "failed"
          ? "needs_review"
          : scan.deliveryState,
  })) as RecentScan[];
}

export async function addRecentScan(scan: RecentScan): Promise<void> {
  await mutate(async () => {
    const recent = await loadRecentScans(scan.officerId);
    recent.unshift(scan);
    recent.sort((left, right) => right.decisionAt.localeCompare(left.decisionAt));
    await AsyncStorage.setItem(recentKey(scan.officerId), JSON.stringify(recent.slice(0, 5)));
  });
}

export async function updateRecentScan(
  officerId: string,
  id: string,
  patch: Pick<RecentScan, "deliveryState"> & {
    error?: string;
    discarded?: boolean;
  },
): Promise<void> {
  await mutate(async () => {
    const recent = await loadRecentScans(officerId);
    await AsyncStorage.setItem(
      recentKey(officerId),
      JSON.stringify(
        recent.map((scan) => {
          if (scan.id !== id) return scan;
          const updated = { ...scan, ...patch };
          if ("error" in patch && patch.error === undefined) delete updated.error;
          return updated;
        }),
      ),
    );
  });
}
