import AsyncStorage from "@react-native-async-storage/async-storage";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentScan,
  blockingScanCount,
  discardScan,
  enqueue,
  loadQueue,
  loadRecentScans,
  retryScan,
  updateRecentScan,
  type QueuedScan,
  type RecentScan,
} from "./scanQueue";

const storage = vi.hoisted(() => new Map<string, string>());

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(storage.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
      return Promise.resolve();
    }),
  },
}));

function queued(id: string, officerId = "officer-a"): QueuedScan {
  return {
    id,
    officerId,
    type: "approve",
    eventId: "event-1",
    mode: "time_in_am",
    qrPayload: '{"studentId":"24-001"}',
    scannedAt: "2026-07-29T08:00:00.000Z",
    decisionAt: `2026-07-29T08:00:0${id}.000Z`,
    deliveryState: "pending",
  };
}

function recent(id: string, officerId = "officer-a"): RecentScan {
  return {
    id,
    officerId,
    studentName: "Ada Lovelace",
    studentId: "24-001",
    eventName: "Foundation Day",
    mode: "time_in_am",
    scannedAt: "2026-07-29T08:00:00.000Z",
    decisionAt: `2026-07-29T08:00:0${id}.000Z`,
    decision: "accepted",
    deliveryState: "pending",
  };
}

beforeEach(() => {
  storage.clear();
  vi.clearAllMocks();
});

describe("Recent scans", () => {
  it("persists only the newest five decisions per Officer without changing the queue", async () => {
    for (let id = 1; id <= 6; id += 1) {
      await enqueue(queued(String(id)));
      await addRecentScan(recent(String(id)));
    }
    await addRecentScan(recent("7", "officer-b"));

    expect((await loadRecentScans("officer-a")).map(({ id }) => id)).toEqual([
      "6",
      "5",
      "4",
      "3",
      "2",
    ]);
    expect((await loadRecentScans("officer-b")).map(({ id }) => id)).toEqual(["7"]);
    expect(await loadQueue("officer-a")).toHaveLength(6);
  });

  it("keeps repeated decisions independent and updates delivery by scan identity", async () => {
    await addRecentScan(recent("1"));
    await addRecentScan(recent("2"));

    await updateRecentScan("officer-a", "1", {
      deliveryState: "failed",
      error: "Unknown student",
    });

    expect(await loadRecentScans("officer-a")).toEqual([
      recent("2"),
      { ...recent("1"), deliveryState: "failed", error: "Unknown student" },
    ]);
  });

  it("does not lose a new decision when an older delivery finishes concurrently", async () => {
    await addRecentScan(recent("1"));

    await Promise.all([
      addRecentScan(recent("2")),
      updateRecentScan("officer-a", "1", { deliveryState: "synced" }),
    ]);

    expect(await loadRecentScans("officer-a")).toEqual([
      recent("2"),
      { ...recent("1"), deliveryState: "synced" },
    ]);
  });
});

describe("Offline Scan Queue ownership", () => {
  it("blocks logout only while the signed-in Officer has unresolved work", async () => {
    await enqueue(queued("1"));
    await enqueue(queued("2", "officer-b"));

    expect(await blockingScanCount("officer-a")).toBe(1);
    expect(await blockingScanCount("officer-b")).toBe(1);
    await discardScan("officer-a", "1");
    expect(await blockingScanCount("officer-a")).toBe(0);
    expect(await blockingScanCount("officer-b")).toBe(1);
  });

  it("quarantines existing ownerless queue data without losing or attributing it", async () => {
    await AsyncStorage.setItem(
      "attendance.scanQueue.v1",
      JSON.stringify([
        {
          id: "legacy",
          type: "reject",
          eventId: "event-1",
          qrPayload: "{}",
          scannedAt: "2026-07-29T08:00:00.000Z",
        },
      ]),
    );

    expect(await loadQueue("officer-a")).toEqual([]);
    expect(await loadQueue()).toEqual([
      expect.objectContaining({
        id: "legacy",
        officerId: null,
        deliveryState: "failed",
      }),
    ]);
    expect(await blockingScanCount("officer-a")).toBe(1);
  });

  it("retries or discards only the selected failed decision", async () => {
    await enqueue({ ...queued("1"), deliveryState: "failed", error: "Bad request" });
    await enqueue({ ...queued("2"), deliveryState: "failed", error: "Unknown student" });

    await retryScan("officer-a", "1");
    await discardScan("officer-a", "2");

    expect(await loadQueue("officer-a")).toEqual([queued("1")]);
  });
});
