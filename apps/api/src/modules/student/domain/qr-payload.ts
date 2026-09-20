export type QrSubject = {
  name: string;
  studentId: string;
  program: string;
};

// Canonical QR payload generation is domain work (spec #168): rendering the
// QR image/PDF stays on the edge (apps/web/lib/qr.ts), but the string a QR
// encodes is decided here, once, so every rendering path stays in sync.
//
// Self-contained: readable by decoding the QR alone, no server lookup.
// Destructure-and-rebuild, don't `JSON.stringify(subject)` directly — callers
// pass full DB rows (extra fields like authUserId/role/id aren't stripped by
// the QrSubject type at runtime) and those must never end up on a printed QR.
export function buildQrPayload(subject: QrSubject): string {
  const { name, studentId, program } = subject;
  return JSON.stringify({ name, studentId, program });
}
