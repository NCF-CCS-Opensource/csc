import { describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => vi.fn());
vi.mock("@clerk/nextjs/server", () => ({ auth }));

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("./api-client", async () => {
  const actual = await vi.importActual<typeof import("./api-client")>("./api-client");
  return { ...actual, apiFetch };
});

import { getCurrentStudent } from "./auth";

const identity = {
  studentId: "24-001",
  authUserId: "user_1",
  email: "student@example.com",
  name: "Grace Hopper",
  role: "student" as const,
};

describe("getCurrentStudent", () => {
  it("returns null without a Clerk session — never calls the API", async () => {
    auth.mockResolvedValueOnce({ userId: null });

    await expect(getCurrentStudent()).resolves.toBeNull();
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("returns the identity for a Student with a record", async () => {
    auth.mockResolvedValueOnce({ userId: "user_1" });
    apiFetch.mockResolvedValueOnce(identity);

    await expect(getCurrentStudent()).resolves.toEqual(identity);
  });

  it("collapses a 401 (Pending Student, no record yet) to null", async () => {
    const { ApiError } = await import("./api-client");
    auth.mockResolvedValueOnce({ userId: "user_1" });
    apiFetch.mockRejectedValueOnce(new ApiError("Authentication required", 401));

    await expect(getCurrentStudent()).resolves.toBeNull();
  });

  it("rethrows a non-401 API failure", async () => {
    const { ApiError } = await import("./api-client");
    auth.mockResolvedValueOnce({ userId: "user_1" });
    apiFetch.mockRejectedValueOnce(new ApiError("Service unavailable", 503));

    await expect(getCurrentStudent()).rejects.toThrow("Service unavailable");
  });
});
