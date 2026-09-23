import { beforeEach, describe, expect, it, vi } from "vitest";

// Mirrors the mocking pattern used for other page-local server actions (see
// app/(app)/events/actions.test.ts).
const requireGovernor = vi.hoisted(() => vi.fn());
vi.mock("@/lib/auth", () => ({ requireGovernor }));

const { apiPost, MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  }
  return { apiPost: vi.fn(), MockApiError };
});
vi.mock("@/lib/api-client", () => ({ apiPost, ApiError: MockApiError }));

const redirect = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
);
vi.mock("next/navigation", () => ({ redirect }));

const updateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ updateTag }));

import { closeSemester, createSemester, deleteSemester, editSemester } from "./actions";

function semesterFormData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  requireGovernor.mockResolvedValue({ role: "governor" });
});

describe.each([
  ["createSemester", createSemester, { startDate: "2026-08-15", endDate: "2026-12-15" }],
  ["editSemester", editSemester, { id: "sem-1", startDate: "2026-08-15", endDate: "2026-12-15" }],
  ["closeSemester", closeSemester, { id: "sem-1" }],
  ["deleteSemester", deleteSemester, { id: "sem-1" }],
])("%s", (_name, action, fields) => {
  it("invalidates the open-Semester cache before redirecting on success", async () => {
    apiPost.mockResolvedValueOnce({});

    await expect(action(semesterFormData(fields))).rejects.toThrow("NEXT_REDIRECT:/admin");

    expect(updateTag).toHaveBeenCalledWith("open-semester");
    expect(redirect).toHaveBeenCalledWith("/admin");
    const updateOrder = updateTag.mock.invocationCallOrder[0];
    const redirectOrder = redirect.mock.invocationCallOrder[0];
    expect(updateOrder).toBeLessThan(redirectOrder);
  });

  it("leaves the cache untouched when the API call fails", async () => {
    apiPost.mockRejectedValueOnce(new MockApiError("Something went wrong", 409));

    await expect(action(semesterFormData(fields))).rejects.toThrow("NEXT_REDIRECT:");

    expect(updateTag).not.toHaveBeenCalled();
  });
});
