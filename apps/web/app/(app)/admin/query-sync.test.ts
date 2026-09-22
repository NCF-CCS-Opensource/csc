import { describe, expect, it, vi } from "vitest";
import { dashboardQueryKey } from "../dashboard/query-key";
import { eventsQueryKey } from "../events/query-key";
import { myAttendanceQueryKey } from "../my-attendance/query-key";
import { studentsQueryKey } from "../students/query-key";
import { invalidateProgramCaches, invalidateSemesterCaches } from "./query-sync";

// Issue #281: Program and Semester are mutated as Server Actions on this page
// with no client mutation to assert against directly, so these test the pure
// invalidation functions in isolation against a mocked query client.
describe("invalidateProgramCaches", () => {
  it("invalidates the Students roster and Dashboard governor counts", () => {
    const queryClient = { invalidateQueries: vi.fn() };

    invalidateProgramCaches(queryClient);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: studentsQueryKey });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: dashboardQueryKey });
  });
});

describe("invalidateSemesterCaches", () => {
  it("invalidates every page caching Semester data", () => {
    const queryClient = { invalidateQueries: vi.fn() };

    invalidateSemesterCaches(queryClient);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: dashboardQueryKey });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: eventsQueryKey });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: myAttendanceQueryKey });
  });
});
