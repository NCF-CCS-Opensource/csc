import QRCode from "qrcode";

// Canonical QR payload generation lives in the API domain layer; rendering
// (image/PDF) stays here on the edge, same split as Reports (spec #168).
export { buildQrPayload, type QrSubject } from "../../api/src/modules/student/domain/qr-payload";
import { buildQrPayload, type QrSubject } from "../../api/src/modules/student/domain/qr-payload";

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
