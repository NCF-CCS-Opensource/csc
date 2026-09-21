import { describe, expect, it } from "vitest";
import { logoutResolution, networkStatus, unresolvedCount } from "./pendingTab";

describe("unresolvedCount", () => {
  it("sums needs-review and pending", () => {
    expect(unresolvedCount({ needsReview: 2, pending: 3 })).toBe(5);
  });

  it("is zero when the queue is clear", () => {
    expect(unresolvedCount({ needsReview: 0, pending: 0 })).toBe(0);
  });
});

describe("networkStatus", () => {
  it("maps true to online", () => {
    expect(networkStatus(true)).toBe("online");
  });

  it("maps false to offline", () => {
    expect(networkStatus(false)).toBe("offline");
  });

  it("maps null/undefined to unknown, never a false offline", () => {
    expect(networkStatus(null)).toBe("unknown");
    expect(networkStatus(undefined)).toBe("unknown");
  });
});

describe("logoutResolution", () => {
  it("allows logout when both blocking and legacy scan counts are zero", () => {
    expect(
      logoutResolution({
        blockingCount: 0,
        legacyCount: 0,
        needsReviewCount: 0,
      }),
    ).toEqual({ canLogout: true });
  });

  it("quarantines legacy scans when blocking is zero but legacy scans exist", () => {
    expect(
      logoutResolution({
        blockingCount: 0,
        legacyCount: 3,
        needsReviewCount: 0,
      }),
    ).toEqual({
      canLogout: false,
      reason: "quarantined_legacy",
      legacyCount: 3,
    });
  });

  it("directs to Pending with 'Review in Pending' when unresolved scans include needs-review items", () => {
    const res = logoutResolution({
      blockingCount: 3,
      legacyCount: 0,
      needsReviewCount: 2,
    });
    expect(res).toEqual({
      canLogout: false,
      reason: "unresolved_scans",
      count: 3,
      actionLabel: "Review in Pending",
      message:
        "3 scans remain unresolved. Reconnect to retry Pending scans, or review Needs Review rows in the Pending tab.",
    });
  });

  it("directs to Pending with 'View Pending' when unresolved scans are purely pending sync", () => {
    const res = logoutResolution({
      blockingCount: 1,
      legacyCount: 0,
      needsReviewCount: 0,
    });
    expect(res).toEqual({
      canLogout: false,
      reason: "unresolved_scans",
      count: 1,
      actionLabel: "View Pending",
      message: "1 scan remains unresolved. Reconnect to retry Pending scans.",
    });
  });
});

