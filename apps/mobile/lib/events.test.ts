import { describe, expect, it, vi } from "vitest";
import { fetchMyEvents } from "./events";
import { boothQueryDefaults, cacheMaxAgeMs } from "./queryClient";

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

describe("booth cache retention", () => {
  // A restored entry older than its retention is dropped on the way in, which
  // would empty the Event list on exactly the offline cold start this exists for.
  it("outlives the age the persisted cache is restored up to", () => {
    expect(boothQueryDefaults.gcTime).toBeGreaterThan(cacheMaxAgeMs);
  });
});
