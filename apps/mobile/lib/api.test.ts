import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch } from "./api";
import { supabase } from "./supabase";

vi.mock("./supabase", () => ({
  supabase: { auth: { getSession: vi.fn() } },
}));

const getSession = vi.mocked(supabase.auth.getSession);

beforeEach(() => {
  getSession.mockReset();
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => vi.useRealTimers());

describe("apiFetch", () => {
  it("does not deliver a queued decision under another Officer's session", async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
          user: { id: "officer-b" },
        },
      },
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);

    await expect(apiFetch("/api/scan/approve", {}, "officer-a")).rejects.toEqual(
      new ApiError("Queued scan belongs to another Officer", 401),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("turns a hung request into a retryable timeout", async () => {
    vi.useFakeTimers();
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "token",
          user: { id: "officer-a" },
        },
      },
    } as Awaited<ReturnType<typeof supabase.auth.getSession>>);
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    const request = apiFetch("/api/scan/approve", {}, "officer-a");
    const expectation = expect(request).rejects.toEqual(
      new ApiError("Request timed out", 408),
    );
    await vi.advanceTimersByTimeAsync(15_000);
    await expectation;
  });
});
