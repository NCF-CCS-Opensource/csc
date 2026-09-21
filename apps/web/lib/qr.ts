import { auth } from "@clerk/nextjs/server";
import QRCode from "qrcode";
import { getCurrentStudent } from "./auth";

// Canonical QR payload generation lives in the API domain layer; rendering
// (image/PDF) stays here on the edge, same split as Reports (spec #168).
import { buildQrPayload, type QrSubject } from "../../api/src/modules/student/domain/qr-payload";
export { buildQrPayload, type QrSubject };

// Shared by /qr and /qr/card (both self-scoped, GET-only, PNG/PDF of the
// caller's own QR). IdentityResponse carries name/studentId/program directly
// (ADR-0019), so the QrSubject is built straight off it — no DB lookup.
export async function resolveOwnQrSubject(): Promise<
  { subject: QrSubject } | { status: 401 | 404 }
> {
  const identity = await getCurrentStudent();
  if (!identity) {
    // Distinguish a stranger from a signed-in Pending Student, same as
    // requireCapability (lib/auth.ts) — getCurrentStudent collapses both to
    // null, so a second auth() call recovers which one this is.
    const { userId } = await auth();
    return { status: userId ? 404 : 401 };
  }

  const { name, studentId, program } = identity;
  return { subject: { name, studentId, program } };
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
