import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as SecureStore from "expo-secure-store";
import {
  ApiError,
  apiFetch,
  rememberOfficerIdentity,
  rememberedOfficerIdentity,
} from "./api";
import { clerk } from "./clerk";

vi.mock("./clerk", () => ({
  clerk: {
    session: { getToken: vi.fn() },
    user: { id: "officer-a" },
  },
}));

vi.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: vi.fn((key: string) =>
      Promise.resolve(store.get(key) ?? null),
    ),
    setItemAsync: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

const getToken = vi.mocked(clerk.session!.getToken);
const signedInAs = (id: string) => {
  (clerk as { user: { id: string } | null }).user = { id };
};

beforeEach(() => {
  getToken.mockReset();
  getToken.mockResolvedValue("token");
  signedInAs("officer-a");
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => vi.useRealTimers());

describe("apiFetch", () => {
  it("sends the Clerk session token as a Bearer credential", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true }),
    } as Response);

    await apiFetch("/api/me");

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/me"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );
  });

  it("does not deliver a queued decision under another Officer's session", async () => {
    signedInAs("officer-b");

    await expect(apiFetch("/api/scan/approve", {}, "officer-a")).rejects.toEqual(
      new ApiError("Queued scan belongs to another Officer", 401),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("turns a hung request into a retryable timeout", async () => {
    vi.useFakeTimers();
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

describe("offline Officer identity", () => {
  beforeEach(() => rememberOfficerIdentity(null));

  it("reads back the identity written at sign-in without touching Clerk or the network", async () => {
    await rememberOfficerIdentity({
      authUserId: "officer-a",
      studentId: "student-1",
    });

    getToken.mockRejectedValue(new Error("offline"));
    signedInAs("");

    await expect(rememberedOfficerIdentity()).resolves.toEqual({
      authUserId: "officer-a",
      studentId: "student-1",
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(getToken).not.toHaveBeenCalled();
  });

  it("forgets the identity when signed out", async () => {
    await rememberOfficerIdentity({
      authUserId: "officer-a",
      studentId: "student-1",
    });
    await rememberOfficerIdentity(null);

    await expect(rememberedOfficerIdentity()).resolves.toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it("treats unreadable secure storage as no cached identity", async () => {
    vi.mocked(SecureStore.getItemAsync).mockResolvedValueOnce("not json");

    await expect(rememberedOfficerIdentity()).resolves.toBeNull();
  });
});
