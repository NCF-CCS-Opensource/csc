import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "attendance.scanQueue.v1";

export type QueuedScan =
  | {
      id: string;
      type: "approve";
      eventId: string;
      mode: string;
      qrPayload: string;
      scannedAt: string;
    }
  | {
      id: string;
      type: "reject";
      eventId: string;
      qrPayload: string;
      scannedAt: string;
    };

export async function loadQueue(): Promise<QueuedScan[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveQueue(queue: QueuedScan[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueue(scan: QueuedScan): Promise<number> {
  const queue = await loadQueue();
  queue.push(scan);
  await saveQueue(queue);
  return queue.length;
}

export async function dequeue(id: string): Promise<number> {
  const queue = await loadQueue();
  const next = queue.filter((scan) => scan.id !== id);
  await saveQueue(next);
  return next.length;
}
