import AsyncStorage from "@react-native-async-storage/async-storage";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentScan,
  blockingScanCount,
  claimLegacyScans,
  discardScan,
  enqueue,
  loadQueue,
  loadRecentScans,
  needsReviewScans,
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
      deliveryState: "needs_review",
      error: "Unknown student",
    });

    expect(await loadRecentScans("officer-a")).toEqual([
      recent("2"),
      {
        ...recent("1"),
        deliveryState: "needs_review",
        error: "Unknown student",
      },
    ]);
  });

  it("does not lose a new decision when an older delivery finishes concurrently", async () => {
    await addRecentScan(recent("1"));

    await Promise.all([
      addRecentScan(recent("2")),
      updateRecentScan("officer-a", "1", { deliveryState: "delivered" }),
    ]);

    expect(await loadRecentScans("officer-a")).toEqual([
      recent("2"),
      { ...recent("1"), deliveryState: "delivered" },
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

  it("restores the owner queue after an app-module reload", async () => {
    await enqueue(queued("1"));

    vi.resetModules();
    const { loadQueue: loadAfterRestart } = await import("./scanQueue");

    expect(await loadAfterRestart("officer-a")).toEqual([queued("1")]);
  });

  it("claims legacy queue data only for the verified mobile actor", async () => {
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

    await claimLegacyScans("officer-a");

    expect(await loadQueue("officer-a")).toEqual([
      expect.objectContaining({
        id: "legacy",
        officerId: "officer-a",
        deliveryState: "pending",
      }),
    ]);
    expect(await loadQueue("officer-b")).toEqual([]);
    expect(await blockingScanCount("officer-a")).toBe(1);
  });

  it("retries or discards only the selected Needs Review decision", async () => {
    await enqueue({
      ...queued("1"),
      deliveryState: "needs_review",
      error: "Bad request",
    });
    await enqueue({
      ...queued("2"),
      deliveryState: "needs_review",
      error: "Unknown student",
    });
    await addRecentScan({
      ...recent("2"),
      deliveryState: "needs_review",
      error: "Unknown student",
    });

    await retryScan("officer-a", "1");
    await discardScan("officer-a", "2");

    expect(await loadQueue("officer-a")).toEqual([queued("1")]);
    expect(await loadRecentScans("officer-a")).toEqual([
      {
        ...recent("2"),
        deliveryState: "needs_review",
        error: "Unknown student",
        discarded: true,
      },
    ]);
    expect(await retryScan("officer-a", "2")).toBe(false);
    expect((await loadRecentScans("officer-a"))[0].discarded).toBe(true);
  });

  it("keeps a Needs Review decision reviewable after normal Recent-scan eviction", async () => {
    const failed = {
      ...queued("1"),
      deliveryState: "needs_review" as const,
      error: "Invalid request",
    };
    await enqueue(failed);
    await addRecentScan({
      ...recent("1"),
      deliveryState: "needs_review",
      error: "Invalid request",
    });
    for (let id = 2; id <= 6; id += 1) await addRecentScan(recent(String(id)));

    expect((await loadRecentScans("officer-a")).some(({ id }) => id === "1")).toBe(false);
    expect(await needsReviewScans("officer-a")).toEqual([failed]);
  });
});
