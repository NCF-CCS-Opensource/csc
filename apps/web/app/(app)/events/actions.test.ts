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
vi.mock("@/lib/api-client", () => ({
  apiFetch,
  apiFetchWithToken: (path: string, _body: unknown, _token: string | null) => apiFetch(path),
  ApiError: MockApiError,
}));

// getOpenSemester (via eventsSnapshot) mints a Clerk token outside its cached
// scope — mocked the same way as lib/queries/open-semester.test.ts.
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn().mockResolvedValue({ getToken: vi.fn().mockResolvedValue("test-token") }),
}));

// Next's real redirect() throws a control-flow signal so it never returns
// (actions.ts relies on that: fail() is typed `never`). The mock must do the
// same, or the `throw error` after a fail() call would wrongly execute too.
const redirect = vi.hoisted(() => vi.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
}));
vi.mock("next/navigation", () => ({ redirect }));

const revalidatePath = vi.hoisted(() => vi.fn());
// getOpenSemester (imported transitively via eventsSnapshot) wraps itself
// in unstable_cache — mocked as a passthrough here for the same reason as
// lib/queries/open-semester.test.ts.
vi.mock("next/cache", () => ({
  revalidatePath,
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

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
    // getOpenSemester and getEventList run concurrently (Promise.all), and
    // getOpenSemester's real auth() round-trip resolves its apiFetch call
    // after getEventList's — so responses are keyed by path, not call order.
    apiFetch.mockImplementation((path: string) => {
      if (path === "/v1/api/semester/current") {
        return Promise.resolve({
          id: "sem-1",
          startDate: "2026-06-01",
          endDate: "2026-10-31",
          closedAt: null,
        });
      }
      return Promise.resolve([
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
    apiFetch.mockImplementation((path: string) =>
      Promise.resolve(path === "/v1/api/semester/current" ? null : []),
    );

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
