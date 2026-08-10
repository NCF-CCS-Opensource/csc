import QRCode from "qrcode";

export type QrSubject = {
  name: string;
  studentId: string;
  program: string;
};

// Self-contained: readable by decoding the QR alone, no server lookup.
// Destructure-and-rebuild, don't `JSON.stringify(subject)` directly — callers
// pass full DB rows (extra fields like authUserId/role/id aren't stripped by
// the QrSubject type at runtime) and those must never end up on a printed QR.
export function buildQrPayload(subject: QrSubject): string {
  const { name, studentId, program } = subject;
  return JSON.stringify({ name, studentId, program });
}

export function generateQrPngBuffer(subject: QrSubject): Promise<Buffer> {
  return QRCode.toBuffer(buildQrPayload(subject), { type: "png" });
}
