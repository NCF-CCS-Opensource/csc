import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteEvent, fetchMyEvents, saveEvent, type EventInput } from "./events";
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

describe("saveEvent", () => {
  const input: EventInput = {
    name: "Foundation Day",
    venue: "ST Quad",
    date: "2026-08-08",
    type: "whole_day",
    halfDayPenaltyAmount: "50.00",
  };

  beforeEach(() => apiFetch.mockReset());

  it("creates against the collection when there is no id", async () => {
    apiFetch.mockResolvedValueOnce({ event: { id: "e1" } });
    await expect(saveEvent(undefined, input)).resolves.toEqual({ id: "e1" });
    expect(apiFetch).toHaveBeenCalledWith("/api/events", {
      method: "POST",
      body: JSON.stringify(input),
    });
  });

  it("edits in place against the Event's own path", async () => {
    apiFetch.mockResolvedValueOnce({ event: { id: "e1" } });
    await saveEvent("e1", input);
    expect(apiFetch).toHaveBeenCalledWith("/api/events/e1", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  });

  it("deletes against the Event's own path", async () => {
    apiFetch.mockResolvedValueOnce(undefined);
    await deleteEvent("e1");
    expect(apiFetch).toHaveBeenCalledWith("/api/events/e1", { method: "DELETE" });
  });
});

describe("booth cache retention", () => {
  // A restored entry older than its retention is dropped on the way in, which
  // would empty the Event list on exactly the offline cold start this exists for.
  it("outlives the age the persisted cache is restored up to", () => {
    expect(boothQueryDefaults.gcTime).toBeGreaterThan(cacheMaxAgeMs);
  });
});
