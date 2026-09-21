import { describe, expect, it } from "vitest";
import type { RecentScan } from "./scanQueue";
import {
  isAlreadyScanned,
  isNeedsReviewActionable,
  recentScanOutcomeLabel,
} from "./recentScanStatus";

const scan: RecentScan = {
  id: "1",
  officerId: "officer-a",
  studentName: "Ada Lovelace",
  studentId: "24-001",
  eventName: "Foundation Day",
  mode: "time_in_am",
  scannedAt: "2026-07-29T08:00:00.000Z",
  decisionAt: "2026-07-29T08:00:00.000Z",
  decision: "accepted",
  deliveryState: "pending",
};

describe("isAlreadyScanned", () => {
  it("is true only for a delivered, accepted scan flagged alreadyScanned", () => {
    const base = { ...scan, decision: "accepted" as const, deliveryState: "delivered" as const };
    expect(isAlreadyScanned({ ...base, alreadyScanned: true })).toBe(true);
    expect(isAlreadyScanned({ ...base, alreadyScanned: false })).toBe(false);
    expect(
      isAlreadyScanned({ ...base, deliveryState: "pending", alreadyScanned: true }),
    ).toBe(false);
    expect(
      isAlreadyScanned({ ...base, decision: "rejected", alreadyScanned: true }),
    ).toBe(false);
  });
});

describe("recentScanOutcomeLabel", () => {
  it("labels a delivered, already-scanned accept as Already scanned", () => {
    expect(
      recentScanOutcomeLabel({
        ...scan,
        deliveryState: "delivered",
        alreadyScanned: true,
      }),
    ).toBe("Already scanned");
  });

  it("still labels a delivered accept without the flag as a fresh accept", () => {
    expect(
      recentScanOutcomeLabel({ ...scan, deliveryState: "delivered" }),
    ).toBe("✓ Accepted");
  });

  it("does not label an already-scanned pending deliver as Already scanned", () => {
    expect(
      recentScanOutcomeLabel({ ...scan, alreadyScanned: true }),
    ).toBe("✓ Accepted");
  });

  it("labels a rejected decision as Rejected even when alreadyScanned is set", () => {
    expect(
      recentScanOutcomeLabel({
        ...scan,
        decision: "rejected",
        deliveryState: "delivered",
        alreadyScanned: true,
      }),
    ).toBe("✕ Rejected");
  });

  it("labels a discarded Needs Review scan as discarded", () => {
    expect(
      recentScanOutcomeLabel({
        ...scan,
        deliveryState: "needs_review",
        discarded: true,
        alreadyScanned: true,
      }),
    ).toBe("! Needs Review · Discarded");
  });
});

describe("isNeedsReviewActionable", () => {
  it("is true for a needs_review scan that has not been discarded", () => {
    expect(
      isNeedsReviewActionable({
        deliveryState: "needs_review",
        discarded: false,
      }),
    ).toBe(true);
    expect(
      isNeedsReviewActionable({
        deliveryState: "needs_review",
      }),
    ).toBe(true);
  });

  it("is false if the needs_review scan was already discarded", () => {
    expect(
      isNeedsReviewActionable({
        deliveryState: "needs_review",
        discarded: true,
      }),
    ).toBe(false);
  });

  it("is false for pending or delivered scans", () => {
    expect(
      isNeedsReviewActionable({
        deliveryState: "pending",
      }),
    ).toBe(false);
    expect(
      isNeedsReviewActionable({
        deliveryState: "delivered",
      }),
    ).toBe(false);
  });
});
