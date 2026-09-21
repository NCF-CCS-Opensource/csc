import { describe, expect, it } from "vitest";
import { resolveAdmission } from "./admission";

const officer = { authUserId: "user_1", studentId: "stu_1" };

describe("resolveAdmission", () => {
  it("grants from the remembered identity while offline", () => {
    expect(resolveAdmission({ remembered: officer, isOffline: true })).toEqual({
      identity: officer,
      admission: { allowed: true },
    });
  });

  it("never revokes admission purely for staying offline indefinitely", () => {
    // Simulate the device staying offline across many admission-check ticks.
    for (let tick = 0; tick < 1000; tick++) {
      expect(resolveAdmission({ remembered: officer, isOffline: true })).toEqual({
        identity: officer,
        admission: { allowed: true },
      });
    }
  });

  it("stays unresolved (not denied) while offline with nothing remembered", () => {
    expect(resolveAdmission({ remembered: null, isOffline: true })).toEqual({
      identity: undefined,
      admission: undefined,
    });
  });

  it("seeds from the remembered identity online before the network check resolves", () => {
    expect(resolveAdmission({ remembered: officer, isOffline: false })).toEqual({
      identity: officer,
      admission: { allowed: true },
    });
  });

  it("grants the fresh identity on a successful online check", () => {
    const fresh = { authUserId: "user_2", studentId: "stu_2" };
    expect(
      resolveAdmission({
        remembered: officer,
        isOffline: false,
        outcome: { type: "success", identity: fresh },
      }),
    ).toEqual({ identity: fresh, admission: { allowed: true } });
  });

  it("revokes on a 401/403 received while online, even with a remembered identity", () => {
    expect(
      resolveAdmission({
        remembered: officer,
        isOffline: false,
        outcome: { type: "denied", message: "Session expired" },
      }),
    ).toEqual({
      identity: null,
      admission: { allowed: false, message: "Session expired" },
    });
  });

  it("revokes on denial even with nothing remembered", () => {
    expect(
      resolveAdmission({
        remembered: null,
        isOffline: false,
        outcome: { type: "denied", message: "Mobile booth access is limited to Officers and Governors" },
      }),
    ).toEqual({
      identity: null,
      admission: {
        allowed: false,
        message: "Mobile booth access is limited to Officers and Governors",
      },
    });
  });

  it("keeps a remembered identity signed in through a transient online error", () => {
    expect(
      resolveAdmission({
        remembered: officer,
        isOffline: false,
        outcome: { type: "error", message: "Network request failed" },
      }),
    ).toEqual({ identity: officer, admission: { allowed: true } });
  });

  it("denies with no fallback on a transient online error and nothing remembered", () => {
    expect(
      resolveAdmission({
        remembered: null,
        isOffline: false,
        outcome: { type: "error", message: "Network request failed" },
      }),
    ).toEqual({
      identity: undefined,
      admission: { allowed: false, message: "Network request failed" },
    });
  });
});
