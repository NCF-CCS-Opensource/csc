import { Resend } from "resend";
import { buildQrCardModels, type QrSubject } from "./qr";
import { renderQrCardPdf } from "@/components/reports/qr-card-pdf-document";

export type ConfirmationEmail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  attachments: { filename: string; content: Buffer }[];
};

export async function buildConfirmationEmail(
  to: string,
  subject: QrSubject,
): Promise<ConfirmationEmail> {
  // Same builder as the /qr/card download — one card, so the emailed card and
  // the one the Student can fetch themselves are identical (spec #118).
  const [card] = await buildQrCardModels([subject]);
  const pdf = await renderQrCardPdf([card]);

  return {
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "You're registered — your Attendance QR code",
    html: `<p>Hi ${subject.name}, you're verified. Your QR Card is attached — print it and bring it to Events, or scan your QR on screen to record attendance.</p>`,
    attachments: [{ filename: "qr-card.pdf", content: Buffer.from(pdf) }],
  };
}

export async function sendConfirmationEmail(to: string, subject: QrSubject) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send(await buildConfirmationEmail(to, subject));
}
