import { describe, expect, it, vi } from "vitest";
import { fetchEvents } from "./events";
import { boothQueryDefaults, cacheMaxAgeMs } from "./queryClient";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({ apiFetch }));

describe("fetchEvents", () => {
  it("returns the shared Event list", async () => {
    apiFetch.mockResolvedValueOnce([{ id: "e1", name: "Foundation Day" }]);
    await expect(fetchEvents()).resolves.toEqual([
      { id: "e1", name: "Foundation Day" },
    ]);
    expect(apiFetch).toHaveBeenCalledWith("/v1/api/event/list", { method: "POST" });
  });

  it("propagates a failure instead of yielding an empty list", async () => {
    apiFetch.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchEvents()).rejects.toThrow("offline");
  });
});

describe("booth cache retention", () => {
  // A restored entry older than its retention is dropped on the way in, which
  // would empty the Event list on exactly the offline cold start this exists for.
  it("outlives the age the persisted cache is restored up to", () => {
    expect(boothQueryDefaults.gcTime).toBeGreaterThan(cacheMaxAgeMs);
  });
});
