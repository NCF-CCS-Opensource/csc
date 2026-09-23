import { beforeEach, describe, expect, it, vi } from "vitest";

// Mirrors the mocking pattern used for page-local server actions (see
// app/(app)/events/actions.test.ts): mock the API client, then assert the
// fetcher hits the right endpoint and the query key stays stable.
const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));
vi.mock("@/lib/api-client", () => ({ apiFetch }));

// unstable_cache has no meaningful behavior outside a real Next.js server
// (no Data Cache to dedupe against), so it's mocked as a passthrough here —
// this file's job is asserting getOpenSemester is wired to cache with the
// right key/tag, not re-testing Next's own caching mechanism.
const unstable_cache = vi.hoisted(() =>
  vi.fn((fn: (...args: unknown[]) => unknown) => fn),
);
vi.mock("next/cache", () => ({ unstable_cache }));

import { getOpenSemester } from "./open-semester";
import { openSemesterQueryKey } from "./open-semester.query-key";

// unstable_cache is only ever called once, at module load, to build the
// wrapper — capture that call now, since beforeEach's clearAllMocks wipes
// mock call history before any test body runs.
const unstableCacheCall = unstable_cache.mock.calls[0];

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

describe("getOpenSemester caching", () => {
  it("is wrapped in unstable_cache, tagged open-semester, with no time-based revalidation", () => {
    expect(unstableCacheCall).toEqual([
      expect.any(Function),
      ["open-semester"],
      { revalidate: false, tags: ["open-semester"] },
    ]);
  });
});

describe("openSemesterQueryKey", () => {
  it("is a stable key", () => {
    expect(openSemesterQueryKey).toEqual(["open-semester"]);
  });
});
