import { beforeEach, describe, expect, it, vi } from "vitest";
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
});
