import AsyncStorage from "@react-native-async-storage/async-storage";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api";
import {
  addRecentScan,
  claimLegacyScans,
  enqueue,
  loadQueue,
  loadRecentScans,
  retryScan,
  type QueuedScan,
  type RecentScan,
} from "./scanQueue";
import { flushQueue, stopQueueRetries } from "./syncScans";

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

vi.mock("./api", () => ({
  ApiError: class ApiError extends Error {
    constructor(message: string, readonly status: number) {
      super(message);
    }
  },
  apiFetch: vi.fn(),
}));

const send = vi.mocked(apiFetch);

function queued(id: string, officerId = "officer-a"): QueuedScan {
  return {
    id,
    officerId,
    type: "approve",
    eventId: "event-1",
    mode: "time_in_am",
    qrPayload: '{"studentId":"24-001"}',
    scannedAt: "2026-07-29T08:00:00.000Z",
    decisionAt: `2026-07-29T08:00:${id.padStart(2, "0")}.000Z`,
    deliveryState: "pending",
  };
}

function recent(id: string): RecentScan {
  return {
    id,
    officerId: "officer-a",
    studentName: "Ada Lovelace",
    studentId: "24-001",
    eventName: "Foundation Day",
    mode: "time_in_am",
    scannedAt: "2026-07-29T08:00:00.000Z",
    decisionAt: `2026-07-29T08:00:${id.padStart(2, "0")}.000Z`,
    decision: "accepted",
    deliveryState: "pending",
  };
}

beforeEach(() => {
  storage.clear();
  send.mockReset();
});

describe("flushQueue", () => {
  it("claims and delivers a legacy queued decision after upgrade", async () => {
    await AsyncStorage.setItem(
      "attendance.scanQueue.v1",
      JSON.stringify([
        {
          id: "00000000-0000-4000-8000-000000000001",
          type: "approve",
          eventId: "event-1",
          mode: "time_in_am",
          qrPayload: '{"studentId":"24-001"}',
          scannedAt: "2026-07-29T08:00:00.000Z",
        },
      ]),
    );
    send.mockResolvedValue({ ok: true });

    await claimLegacyScans("officer-a");
    await flushQueue("officer-a");

    expect(send).toHaveBeenCalledWith(
      "/api/scan/approve",
      expect.objectContaining({
        body: expect.stringContaining(
          '"scanId":"00000000-0000-4000-8000-000000000001"',
        ),
      }),
      "officer-a",
    );
    expect(await loadQueue("officer-a")).toEqual([]);
  });

  it("delivers all 50 queued decisions in capture order while retaining only five Recent scans", async () => {
    await enqueue(queued("1", "officer-b"));
    for (let id = 1; id <= 50; id += 1) {
      await enqueue(queued(String(id)));
      await addRecentScan(recent(String(id)));
    }
    send.mockResolvedValue({ ok: true });

    await flushQueue("officer-a");

    expect(send.mock.calls.map(([, options]) => JSON.parse(String(options?.body)).scanId)).toEqual(
      Array.from({ length: 50 }, (_, index) => String(index + 1)),
    );
    expect(send.mock.calls.every(([, , owner]) => owner === "officer-a")).toBe(true);
    expect(await loadQueue("officer-a")).toEqual([]);
    expect((await loadQueue("officer-b")).map(({ officerId }) => officerId)).toEqual([
      "officer-b",
    ]);
    expect(await loadRecentScans("officer-a")).toHaveLength(5);
    expect(
      (await loadRecentScans("officer-a")).every(
        ({ deliveryState }) => deliveryState === "delivered",
      ),
    ).toBe(true);
  });

  it("keeps temporary failures Pending for retry and stops before later decisions", async () => {
    await enqueue(queued("1"));
    await enqueue(queued("2"));
    await addRecentScan(recent("1"));
    send.mockRejectedValue(new ApiError("Offline", 503));

    await flushQueue("officer-a");

    expect(send).toHaveBeenCalledTimes(1);
    expect((await loadQueue("officer-a")).map(({ id }) => id)).toEqual(["1", "2"]);
    expect((await loadRecentScans("officer-a"))[0].deliveryState).toBe("pending");
    stopQueueRetries("officer-a");
  });

  it("retries temporary failures with bounded exponential backoff", async () => {
    vi.useFakeTimers();
    await enqueue(queued("1"));
    send.mockRejectedValue(new ApiError("Offline", 503));

    await flushQueue("officer-a");
    expect(send).toHaveBeenCalledTimes(1);

    for (const [delay, calls] of [
      [1_000, 2],
      [2_000, 3],
      [4_000, 4],
      [8_000, 5],
      [16_000, 6],
      [30_000, 7],
      [30_000, 8],
    ] as const) {
      await vi.advanceTimersByTimeAsync(delay);
      expect(send).toHaveBeenCalledTimes(calls);
    }

    stopQueueRetries("officer-a");
    vi.useRealTimers();
  });

  it("moves permanent failures to Needs Review and continues with later decisions", async () => {
    await enqueue(queued("1"));
    await enqueue(queued("2"));
    await addRecentScan(recent("1"));
    await addRecentScan(recent("2"));
    send
      .mockRejectedValueOnce(new ApiError("Unknown student", 422))
      .mockResolvedValueOnce({ ok: true });

    await flushQueue("officer-a");

    expect(send).toHaveBeenCalledTimes(2);
    expect(await loadQueue("officer-a")).toEqual([
      {
        ...queued("1"),
        deliveryState: "needs_review",
        error: "Unknown student",
      },
    ]);
    expect(await loadRecentScans("officer-a")).toEqual([
      { ...recent("2"), deliveryState: "delivered" },
      {
        ...recent("1"),
        deliveryState: "needs_review",
        error: "Unknown student",
      },
    ]);

    send.mockResolvedValueOnce({ ok: true });
    await retryScan("officer-a", "1");
    await flushQueue("officer-a");
    expect(await loadQueue("officer-a")).toEqual([]);
    expect((await loadRecentScans("officer-a"))[1].deliveryState).toBe(
      "delivered",
    );
  });
});
