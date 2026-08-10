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

  it("drops extra fields on the passed object (e.g. a full DB row)", () => {
    const fullRow = {
      id: "1e402593-5889-42f4-b931-9d06edb4e91a",
      authUserId: "user_3HbqTlutjcBlDxQ4GRURrYnHeVx",
      email: "jinfante@gbox.ncf.edu.ph",
      name: "Juan Dela Cruz",
      program: "Computer Science",
      studentId: "2021-00123",
      role: "governor",
      createdAt: "2026-08-08T00:01:43.238Z",
    };

    const payload = buildQrPayload(fullRow);

    expect(JSON.parse(payload)).toEqual({
      name: "Juan Dela Cruz",
      studentId: "2021-00123",
      program: "Computer Science",
    });
  });
});
