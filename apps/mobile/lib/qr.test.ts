import { describe, expect, it } from "vitest";
import { isReadableQrPayload, parseQrPayload } from "./qr";

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

describe("parseQrPayload", () => {
  it("returns the student fields for a complete payload", () => {
    expect(
      parseQrPayload(
        JSON.stringify({ name: "Ada", studentId: "24-001", program: "CS" }),
      ),
    ).toEqual({ name: "Ada", studentId: "24-001", program: "CS" });
  });
  it("returns null for missing fields or bad JSON", () => {
    expect(parseQrPayload("{}")).toBeNull();
    expect(parseQrPayload("not-json")).toBeNull();
  });
});
