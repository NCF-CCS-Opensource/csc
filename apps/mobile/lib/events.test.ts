import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import {
  createEvent,
  deleteEvent,
  fetchMyEvents,
  myEventsKey,
  updateEvent,
} from "./events";
import { boothQueryDefaults, cacheMaxAgeMs } from "./queryClient";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({ apiFetch }));

describe("fetchMyEvents", () => {
  it("returns the Officer's events", async () => {
    apiFetch.mockResolvedValueOnce([{ id: "e1", name: "Foundation Day" }]);
    await expect(fetchMyEvents()).resolves.toEqual([
      { id: "e1", name: "Foundation Day" },
    ]);
    expect(apiFetch).toHaveBeenCalledWith("/v1/api/event/list", { method: "POST" });
  });

  it("propagates a failure instead of yielding an empty list", async () => {
    apiFetch.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchMyEvents()).rejects.toThrow("offline");
  });
});

describe("Event mutations invalidate the shared Events query", () => {
  function queryClientWithSpy() {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    return { queryClient, invalidateQueries };
  }

  it("createEvent invalidates the shared Events query on success", async () => {
    const { queryClient, invalidateQueries } = queryClientWithSpy();
    apiFetch.mockResolvedValueOnce({ id: "e1", name: "Foundation Day" });

    await createEvent(queryClient, { name: "Foundation Day" });

    expect(apiFetch).toHaveBeenCalledWith("/v1/api/event/create", {
      method: "POST",
      body: JSON.stringify({ name: "Foundation Day" }),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: myEventsKey });
  });

  it("updateEvent invalidates the shared Events query on success", async () => {
    const { queryClient, invalidateQueries } = queryClientWithSpy();
    apiFetch.mockResolvedValueOnce({ id: "e1", name: "Renamed" });

    await updateEvent(queryClient, { id: "e1", name: "Renamed" });

    expect(apiFetch).toHaveBeenCalledWith("/v1/api/event/update", {
      method: "POST",
      body: JSON.stringify({ id: "e1", name: "Renamed" }),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: myEventsKey });
  });

  it("deleteEvent invalidates the shared Events query on success", async () => {
    const { queryClient, invalidateQueries } = queryClientWithSpy();
    apiFetch.mockResolvedValueOnce({});

    await deleteEvent(queryClient, "e1");

    expect(apiFetch).toHaveBeenCalledWith("/v1/api/event/delete", {
      method: "POST",
      body: JSON.stringify({ id: "e1" }),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: myEventsKey });
  });

  it("does not invalidate when the mutation fails", async () => {
    const { queryClient, invalidateQueries } = queryClientWithSpy();
    apiFetch.mockRejectedValueOnce(new Error("offline"));

    await expect(deleteEvent(queryClient, "e1")).rejects.toThrow("offline");
    expect(invalidateQueries).not.toHaveBeenCalled();
  });
});

describe("booth cache retention", () => {
  // A restored entry older than its retention is dropped on the way in, which
  // would empty the Event list on exactly the offline cold start this exists for.
  it("outlives the age the persisted cache is restored up to", () => {
    expect(boothQueryDefaults.gcTime).toBeGreaterThan(cacheMaxAgeMs);
  });
});
