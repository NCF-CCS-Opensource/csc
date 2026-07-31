import { describe, expect, it } from "vitest";
import { isReadableQrPayload } from "./qr";

describe("isReadableQrPayload", () => {
  it("accepts only complete Student QR payloads", () => {
    expect(
      isReadableQrPayload(
        JSON.stringify({ name: "Ada", studentId: "24-001", program: "CS" }),
      ),
    ).toBe(true);
    expect(isReadableQrPayload("{}")).toBe(false);
    expect(isReadableQrPayload("not-json")).toBe(false);
  });
});
