import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  admitOfficer,
  getOfficerState,
  refreshPendingCount,
  signOutOfficer,
  subscribeToOfficer,
} from "./officerStore";
import { ApiError } from "./api";

// Faked whole: the real module reaches Clerk and, through it, React Native's
// Flow-typed source, which this plain-module test has no business loading.
const api = vi.hoisted(() => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
  apiFetch: vi.fn(),
  rememberOfficerIdentity: vi.fn(() => Promise.resolve()),
  rememberedOfficerIdentity: vi.fn(
    (): Promise<{ authUserId: string; studentId: string } | null> =>
      Promise.resolve(null),
  ),
  endOfficerSession: vi.fn(() => Promise.resolve()),
}));

vi.mock("./api", () => api);

const queue = vi.hoisted(() => ({
  blockingScanCount: vi.fn(() => Promise.resolve(0)),
  claimLegacyScans: vi.fn(() => Promise.resolve(0)),
}));
vi.mock("./scanQueue", () => queue);

const clearBoothCache = vi.hoisted(() => vi.fn(() => Promise.resolve()));
vi.mock("./queryClient", () => ({ clearBoothCache }));

const OFFICER = { authUserId: "officer-a", studentId: "student-a" };
const signedIn = { isLoaded: true, isSignedIn: true, userId: "officer-a" };

beforeEach(() => {
  vi.clearAllMocks();
  api.rememberedOfficerIdentity.mockResolvedValue(null);
  api.rememberOfficerIdentity.mockResolvedValue(undefined);
  api.endOfficerSession.mockResolvedValue(undefined);
  queue.blockingScanCount.mockResolvedValue(0);
  queue.claimLegacyScans.mockResolvedValue(0);
});

// The store is module state; every test leaves it signed out.
afterEach(async () => {
  await signOutOfficer(() => Promise.resolve());
});

describe("identity rehydration", () => {
  it("knows the remembered Officer before the identity vendor answers", async () => {
    api.rememberedOfficerIdentity.mockResolvedValue(OFFICER);
    // A booth in a dead spot: /api/me never comes back.
    api.apiFetch.mockReturnValue(new Promise(() => {}));

    const admitted = admitOfficer(signedIn);
    await vi.waitFor(() => expect(getOfficerState().identity).toEqual(OFFICER));
    expect(getOfficerState().admission).toEqual({ allowed: true });
    void admitted;
  });

  it("reads the remembered Officer from the API client, not a second cache", async () => {
    api.rememberedOfficerIdentity.mockResolvedValue(OFFICER);
    api.apiFetch.mockRejectedValue(new Error("offline"));

    await admitOfficer(signedIn);

    expect(api.rememberedOfficerIdentity).toHaveBeenCalled();
    // Offline, so nothing overwrote it — the stamp still stands.
    expect(getOfficerState().identity).toEqual(OFFICER);
  });

  it("resolves to nobody when there is no stamp and no vendor session", async () => {
    await admitOfficer({ isLoaded: true, isSignedIn: false, userId: null });
    expect(getOfficerState().identity).toBeNull();
  });

  it("forgets a stamp the server refuses", async () => {
    api.rememberedOfficerIdentity.mockResolvedValue(OFFICER);
    api.apiFetch.mockRejectedValue(new ApiError("Not an Officer", 403));

    await admitOfficer(signedIn);

    expect(api.rememberOfficerIdentity).toHaveBeenCalledWith(null);
    expect(getOfficerState().identity).toBeNull();
    expect(getOfficerState().admission).toEqual({
      allowed: false,
      message: "Not an Officer",
    });
  });
});

describe("pending scan count", () => {
  it("publishes the signed-in Officer's own count to every subscriber", async () => {
    api.rememberedOfficerIdentity.mockResolvedValue(OFFICER);
    api.apiFetch.mockRejectedValue(new Error("offline"));
    await admitOfficer(signedIn);

    const seen: number[] = [];
    const unsubscribe = subscribeToOfficer(() =>
      seen.push(getOfficerState().pendingCount),
    );
    queue.blockingScanCount.mockResolvedValue(3);
    await refreshPendingCount();
    unsubscribe();

    expect(queue.blockingScanCount).toHaveBeenLastCalledWith("officer-a");
    // One count, one publication — the Scanner and Settings cannot disagree.
    expect(seen).toEqual([3]);
    expect(getOfficerState().pendingCount).toBe(3);
  });

  it("counts nothing while no Officer is signed in", async () => {
    queue.blockingScanCount.mockResolvedValue(9);
    await refreshPendingCount();

    expect(queue.blockingScanCount).not.toHaveBeenCalled();
    expect(getOfficerState().pendingCount).toBe(0);
  });
});

describe("signing out", () => {
  it("leaves no trace of the Officer for the next one on this device", async () => {
    api.rememberedOfficerIdentity.mockResolvedValue(OFFICER);
    api.apiFetch.mockRejectedValue(new Error("offline"));
    queue.blockingScanCount.mockResolvedValue(2);
    await admitOfficer(signedIn);
    expect(getOfficerState().pendingCount).toBe(2);

    const signOut = vi.fn(() => Promise.resolve());
    await signOutOfficer(signOut);

    expect(api.endOfficerSession).toHaveBeenCalledWith(signOut);
    expect(clearBoothCache).toHaveBeenCalled();
    expect(getOfficerState()).toEqual({
      identity: null,
      admission: undefined,
      pendingCount: 0,
    });
  });

  it("tells subscribers, so no screen keeps rendering the old count", async () => {
    api.rememberedOfficerIdentity.mockResolvedValue(OFFICER);
    api.apiFetch.mockRejectedValue(new Error("offline"));
    queue.blockingScanCount.mockResolvedValue(2);
    await admitOfficer(signedIn);

    const seen: number[] = [];
    const unsubscribe = subscribeToOfficer(() =>
      seen.push(getOfficerState().pendingCount),
    );
    await signOutOfficer(() => Promise.resolve());
    unsubscribe();

    expect(seen).toEqual([0]);
  });
});
