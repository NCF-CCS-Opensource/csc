import { describe, expect, it, vi, beforeEach } from "vitest";

// requireOfficerOrGovernor and the API proxy are mocked so this exercises
// only actions.ts's own plumbing — token forwarding is apiFetch's job
// (see lib/api-client.ts), lifecycle rules are apps/api's (see
// apps/api/test/semester-event-lifecycle.integration.test.ts). This is the
// web-side proxy coverage actions.integration.test.ts used to provide before
// the Event module moved to apps/api (issue #163).
const requireOfficerOrGovernor = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ requireOfficerOrGovernor }));

const { apiFetch, MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  }
  return { apiFetch: vi.fn(), MockApiError };
});
vi.mock("@/lib/api-client", () => ({ apiFetch, ApiError: MockApiError }));

// Next's real redirect() throws a control-flow signal so it never returns
// (actions.ts relies on that: fail() is typed `never`). The mock must do the
// same, or the `throw error` after a fail() call would wrongly execute too.
const redirect = vi.hoisted(() => vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
}));
vi.mock("next/navigation", () => ({ redirect }));

const revalidatePath = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidatePath }));

import { createEvent, deleteEvent, eventsSnapshot, updateEvent } from "./actions";

function eventFormData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireOfficerOrGovernor.mockResolvedValue({ role: "officer" });
});

describe("eventsSnapshot", () => {
  it("requires the capability, then reads the open Semester and Events from the API", async () => {
    apiFetch.mockResolvedValueOnce({
      id: "sem-1",
      startDate: "2026-06-01",
      endDate: "2026-10-31",
      closedAt: null,
    });
    apiFetch.mockResolvedValueOnce([
      {
        id: "evt-1",
        name: "Foundation Day",
        date: "2026-07-15",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
        wholeDayPenalty: 100,
      },
    ]);

    const snapshot = await eventsSnapshot();

    expect(requireOfficerOrGovernor).toHaveBeenCalled();
    expect(apiFetch).toHaveBeenCalledWith("/v1/api/semester/current");
    expect(apiFetch).toHaveBeenCalledWith("/v1/api/event/list");
    expect(snapshot.openSemester).toEqual({ startDate: "2026-06-01", endDate: "2026-10-31" });
    expect(snapshot.events).toEqual([
      {
        id: "evt-1",
        name: "Foundation Day",
        date: "2026-07-15",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
        wholeDayPenalty: 100,
      },
    ]);
  });

  it("reports no open Semester as null", async () => {
    apiFetch.mockResolvedValueOnce(null);
    apiFetch.mockResolvedValueOnce([]);

    const snapshot = await eventsSnapshot();
    expect(snapshot.openSemester).toBeNull();
  });
});

describe("createEvent", () => {
  it("redirects to /events on success", async () => {
    apiFetch.mockResolvedValueOnce({});

    await expect(
      createEvent(
        eventFormData({ name: "Foundation Day", date: "2026-07-15", type: "half_day", halfDayPenaltyAmount: "50.00" }),
      ),
    ).rejects.toThrow("NEXT_REDIRECT:/events");

    expect(apiFetch).toHaveBeenCalledWith(
      "/v1/api/event/create",
      expect.objectContaining({ name: "Foundation Day" }),
    );
  });

  it("redirects with the API's error message on an ApiError", async () => {
    apiFetch.mockRejectedValueOnce(new MockApiError("No open Semester — ask the Governor to open one", 409));

    await expect(
      createEvent(
        eventFormData({ name: "Foundation Day", date: "2026-07-15", type: "half_day", halfDayPenaltyAmount: "50.00" }),
      ),
    ).rejects.toThrow(
      "NEXT_REDIRECT:/events?error=No%20open%20Semester%20%E2%80%94%20ask%20the%20Governor%20to%20open%20one",
    );
  });
});

describe("updateEvent", () => {
  it("revalidates the Events page and returns no error on success", async () => {
    apiFetch.mockResolvedValueOnce({});

    const result = await updateEvent(
      "evt-1",
      eventFormData({ name: "Renamed", date: "2026-07-15", type: "half_day", halfDayPenaltyAmount: "50.00" }),
    );

    expect(apiFetch).toHaveBeenCalledWith(
      "/v1/api/event/update",
      expect.objectContaining({ id: "evt-1", name: "Renamed" }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/events");
    expect(result).toEqual({ error: null });
  });

  it("returns the API's error message inline on an ApiError, without redirecting", async () => {
    apiFetch.mockRejectedValueOnce(new MockApiError("Closed Semester Events cannot be changed", 409));

    const result = await updateEvent(
      "evt-1",
      eventFormData({ name: "Renamed", date: "2026-07-15", type: "half_day", halfDayPenaltyAmount: "50.00" }),
    );

    expect(result).toEqual({ error: "Closed Semester Events cannot be changed" });
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("deleteEvent", () => {
  it("revalidates the Events page and returns no error on success", async () => {
    apiFetch.mockResolvedValueOnce({ ok: true });

    const result = await deleteEvent("evt-1");

    expect(apiFetch).toHaveBeenCalledWith("/v1/api/event/delete", { id: "evt-1" });
    expect(revalidatePath).toHaveBeenCalledWith("/events");
    expect(result).toEqual({ error: null });
  });

  it("returns the API's error message inline on an ApiError", async () => {
    apiFetch.mockRejectedValueOnce(new MockApiError("Events with attendance history cannot be deleted", 409));

    const result = await deleteEvent("evt-1");
    expect(result).toEqual({ error: "Events with attendance history cannot be deleted" });
  });
});
