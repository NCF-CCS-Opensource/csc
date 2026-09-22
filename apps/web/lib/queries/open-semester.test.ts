import { beforeEach, describe, expect, it, vi } from "vitest";

// Mirrors the mocking pattern used for page-local server actions (see
// app/(app)/events/actions.test.ts): mock the API client, then assert the
// fetcher hits the right endpoint and the query key stays stable.
const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiFetch }));

import { getOpenSemester } from "./open-semester";
import { openSemesterQueryKey } from "./open-semester.query-key";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getOpenSemester", () => {
  it("reads the current open Semester from the API", async () => {
    const semester = {
      id: "sem-1",
      startDate: "2026-08-15",
      endDate: "2026-12-15",
      closedAt: null,
    };
    apiFetch.mockResolvedValueOnce(semester);

    const result = await getOpenSemester();

    expect(apiFetch).toHaveBeenCalledWith("/v1/api/semester/current");
    expect(result).toEqual(semester);
  });

  it("reports no open Semester as null", async () => {
    apiFetch.mockResolvedValueOnce(null);

    const result = await getOpenSemester();

    expect(result).toBeNull();
  });
});

describe("openSemesterQueryKey", () => {
  it("is a stable key", () => {
    expect(openSemesterQueryKey).toEqual(["open-semester"]);
  });
});
