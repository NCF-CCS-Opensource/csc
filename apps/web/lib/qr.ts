import QRCode from "qrcode";

export type QrSubject = {
  name: string;
  studentId: string;
  program: string;
};

// Self-contained: readable by decoding the QR alone, no server lookup.
export function buildQrPayload(subject: QrSubject): string {
  return JSON.stringify(subject);
}

export function generateQrPngBuffer(subject: QrSubject): Promise<Buffer> {
  return QRCode.toBuffer(buildQrPayload(subject), { type: "png" });
}
