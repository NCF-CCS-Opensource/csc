import { beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiFetch }));

import { getEventList } from "./event-list";
import { eventListQueryKey } from "./event-list.query-key";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getEventList", () => {
  it("reads the Event list from the API", async () => {
    const events = [
      {
        id: "evt-1",
        name: "Foundation Day",
        date: "2026-07-15",
        type: "half_day",
        halfDayPenaltyAmount: "50.00",
        wholeDayPenalty: 100,
      },
    ];
    apiFetch.mockResolvedValueOnce(events);

    const result = await getEventList();

    expect(apiFetch).toHaveBeenCalledWith("/v1/api/event/list");
    expect(result).toEqual(events);
  });
});

describe("eventListQueryKey", () => {
  it("is a stable key", () => {
    expect(eventListQueryKey).toEqual(["event-list"]);
  });
});
