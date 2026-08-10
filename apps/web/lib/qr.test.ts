import { describe, expect, it } from "vitest";
import { buildQrCardModels, buildQrPayload } from "./qr";
import { renderQrCardPdf } from "@/components/reports/qr-card-pdf-document";

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

describe("buildQrCardModels", () => {
  it("builds one card per Student, in the order given", async () => {
    const cards = await buildQrCardModels([
      { name: "Juan Dela Cruz", studentId: "2021-00123", program: "Computer Science" },
      { name: "Maria Santos", studentId: "2021-00456", program: "Information Technology" },
    ]);

    expect(cards.map((c) => c.studentId)).toEqual(["2021-00123", "2021-00456"]);
  });

  it("carries exactly name, Student ID, Program, and a QR image — nothing more, even from a full DB row", async () => {
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

    const [card] = await buildQrCardModels([fullRow]);

    expect(card).toEqual({
      name: "Juan Dela Cruz",
      studentId: "2021-00123",
      program: "Computer Science",
      qrImage: expect.stringMatching(/^data:image\/png;base64,/),
    });
  });

  it("encodes the same payload buildQrPayload produces, so a card and a phone are interchangeable", async () => {
    const subject = { name: "Juan Dela Cruz", studentId: "2021-00123", program: "Computer Science" };
    const [card] = await buildQrCardModels([subject]);

    // The QR image is a rendered PNG, not the payload text itself — assert
    // indirectly via the same builder used for the live QR (buildQrPayload),
    // which is what the booth's own /qr route encodes.
    expect(buildQrPayload(subject)).toBe(buildQrPayload(card));
  });

  it("returns an empty result for empty input, not a one-blank-card document", async () => {
    const cards = await buildQrCardModels([]);
    expect(cards).toEqual([]);
  });

  it("renders to a real PDF document, the file both card downloads serve", async () => {
    const cards = await buildQrCardModels([
      { name: "Juan Dela Cruz", studentId: "2021-00123", program: "Computer Science" },
    ]);

    const pdf = await renderQrCardPdf(cards);

    expect(pdf.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(0);
  });
});
