import { beforeAll, describe, expect, it } from "vitest";
import { buildConfirmationEmail, type ConfirmationEmail } from "./email";

describe("buildConfirmationEmail", () => {
  const subject = {
    name: "Juan Dela Cruz",
    studentId: "2021-00123",
    program: "Computer Science",
  };

  let email: ConfirmationEmail;
  beforeAll(async () => {
    email = await buildConfirmationEmail("juan@gbox.ncf.edu.ph", subject);
  });

  it("carries exactly one attachment, the QR Card PDF", () => {
    expect(email.attachments).toHaveLength(1);
    expect(email.attachments[0].filename).toBe("qr-card.pdf");
  });

  it("attaches a PDF, not the bare QR PNG", () => {
    const content = email.attachments[0].content;
    expect(content.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("addresses the new Student and names them in the body", () => {
    expect(email.to).toBe("juan@gbox.ncf.edu.ph");
    expect(email.html).toContain("Juan Dela Cruz");
  });
});
