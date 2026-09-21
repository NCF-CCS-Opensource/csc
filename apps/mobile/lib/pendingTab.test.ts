import { describe, expect, it } from "vitest";
import { networkStatus, unresolvedCount } from "./pendingTab";

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
