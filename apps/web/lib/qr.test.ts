import { describe, expect, it } from "vitest";
import { buildQrPayload } from "./qr";

describe("buildQrPayload", () => {
  it("encodes name, student ID, and Program as self-contained JSON", () => {
    const payload = buildQrPayload({
      name: "Juan Dela Cruz",
      studentId: "2021-00123",
      program: "Computer Science",
    });

    expect(JSON.parse(payload)).toEqual({
      name: "Juan Dela Cruz",
      studentId: "2021-00123",
      program: "Computer Science",
    });
  });
});
