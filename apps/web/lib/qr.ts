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

export type QrCardModel = {
  name: string;
  studentId: string;
  program: string;
  qrImage: string;
};

// Pure: rows in, card models out — no PDF, no I/O — so the QR Card's PDF layout
// and the field-stripping guarantee can be tested independently (spec #116).
// Same destructure-and-rebuild rule as buildQrPayload: callers may pass full DB
// rows, and only name/studentId/program/qrImage may survive onto a card.
export function buildQrCardModels(subjects: QrSubject[]): Promise<QrCardModel[]> {
  return Promise.all(
    subjects.map(async (subject) => {
      const { name, studentId, program } = subject;
      const qrImage = await QRCode.toDataURL(buildQrPayload(subject));
      return { name, studentId, program, qrImage };
    }),
  );
}
