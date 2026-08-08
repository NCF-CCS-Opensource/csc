import { describe, expect, it, vi } from "vitest";
import { fetchMyEvents } from "./events";
import { cacheMaxAgeMs, createBoothQueryClient } from "./queryClient";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({ apiFetch }));

describe("fetchMyEvents", () => {
  it("returns the Officer's events", async () => {
    apiFetch.mockResolvedValueOnce({ events: [{ id: "e1", name: "Foundation Day" }] });
    await expect(fetchMyEvents()).resolves.toEqual([
      { id: "e1", name: "Foundation Day" },
    ]);
  });

  it("propagates a failure instead of yielding an empty list", async () => {
    apiFetch.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchMyEvents()).rejects.toThrow("offline");
  });
});

describe("booth query client", () => {
  const defaults = createBoothQueryClient().getDefaultOptions().queries!;

  it("retains entries at least as long as the persisted cache is restored", () => {
    expect(defaults.gcTime).toBeGreaterThanOrEqual(cacheMaxAgeMs);
  });

  it("retries a transient failure without user action", () => {
    expect(defaults.retry).toBeTruthy();
  });
});
