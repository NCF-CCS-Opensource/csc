import { describe, expect, it, vi } from "vitest";
import { fetchRejectedScans } from "./rejections";

const apiFetch = vi.hoisted(() => vi.fn());
vi.mock("./api", () => ({ apiFetch }));

describe("fetchRejectedScans", () => {
  it("returns the signed-in Officer's rejected scans from the server", async () => {
    apiFetch.mockResolvedValueOnce({
      rejections: [
        {
          id: "r1",
          eventId: "e1",
          eventName: "Foundation Day",
          scannedAt: "2026-07-15T08:00:00.000Z",
          student: { name: "Grace Hopper", studentId: "24-001", program: "Computer Science" },
          reason: "Unreadable QR",
        },
      ],
    });

    await expect(fetchRejectedScans()).resolves.toEqual([
      {
        id: "r1",
        eventId: "e1",
        eventName: "Foundation Day",
        scannedAt: "2026-07-15T08:00:00.000Z",
        student: { name: "Grace Hopper", studentId: "24-001", program: "Computer Science" },
        reason: "Unreadable QR",
      },
    ]);
    expect(apiFetch).toHaveBeenCalledWith("/api/scan/rejections");
  });

  it("propagates a failure instead of yielding an empty list", async () => {
    apiFetch.mockRejectedValueOnce(new Error("offline"));
    await expect(fetchRejectedScans()).rejects.toThrow("offline");
  });
});
