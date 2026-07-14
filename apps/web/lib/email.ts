import { Resend } from "resend";
import { generateQrPngBuffer, type QrSubject } from "./qr";

export async function sendConfirmationEmail(to: string, subject: QrSubject) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const qr = await generateQrPngBuffer(subject);

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "You're registered — your Attendance QR code",
    html: `<p>Hi ${subject.name}, you're verified. Your QR code is attached — scan it at Events to record attendance.</p>`,
    attachments: [{ filename: "attendance-qr.png", content: qr }],
  });
}
