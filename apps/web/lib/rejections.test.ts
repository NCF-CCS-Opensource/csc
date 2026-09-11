import { describe, expect, it } from "vitest";
import { decodeQrPayload, qrRejectionReason } from "./scan";

function decoded(name = "Ada Lovelace", program = "Computer Science") {
  return { name, studentId: "24-002", program };
}

describe("qrRejectionReason", () => {
  it("reports an unreadable QR when the payload does not decode", () => {
    expect(qrRejectionReason(null, undefined)).toBe("Unreadable QR");
    expect(
      qrRejectionReason(decodeQrPayload("not-json"), {
        name: "Ada Lovelace",
        program: "Computer Science",
      }),
    ).toBe("Unreadable QR");
  });

  it("reports a mismatch when the resolved Student record disagrees", () => {
    expect(
      qrRejectionReason(decoded(), { name: "Wrong Name", program: "Computer Science" }),
    ).toBe("QR does not match current Student record");
    expect(
      qrRejectionReason(decoded(), {
        name: "Ada Lovelace",
        program: "Information Technology",
      }),
    ).toBe("QR does not match current Student record");
    expect(qrRejectionReason(decoded(), undefined)).toBe(
      "QR does not match current Student record",
    );
  });

  it("returns null for a matching QR — the Officer, not the QR, rejected it", () => {
    expect(
      qrRejectionReason(decoded(), { name: "Ada Lovelace", program: "Computer Science" }),
    ).toBeNull();
  });
});
