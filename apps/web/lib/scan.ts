export const BOOTH_MODES = [
  "time_in_am",
  "time_out_am",
  "time_in_pm",
  "time_out_pm",
] as const;
export type BoothMode = (typeof BOOTH_MODES)[number];

export function modeToHalfAndField(mode: BoothMode): {
  half: "am" | "pm";
  field: "timeIn" | "timeOut";
} {
  const half = mode.endsWith("_am") ? "am" : "pm";
  const field = mode.startsWith("time_in") ? "timeIn" : "timeOut";
  return { half, field };
}

export type QrPayload = {
  name: string;
  studentId: string;
  program: string;
};

// The QR is self-contained (see #4) — decoded client-side for the Scan
// Approval modal, then re-decoded here server-side to resolve the Student
// before writing an Attendance Session.
export function decodeQrPayload(raw: string): QrPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const { name, studentId, program } = parsed as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    typeof studentId !== "string" ||
    typeof program !== "string"
  ) {
    return null;
  }

  return { name, studentId, program };
}

// Legacy attendance-table helpers still use these QR rules. The API owns the
// Scan Approval command and rejection view.
export type RejectionReason =
  | "Unreadable QR"
  | "QR does not match current Student record"
  | "Rejected by Officer";

export function qrRejectionReason(
  decoded: ReturnType<typeof decodeQrPayload>,
  student: { name: string; program: string } | null | undefined,
): RejectionReason | null {
  if (!decoded) return "Unreadable QR";
  if (
    !student ||
    student.name !== decoded.name ||
    student.program !== decoded.program
  ) {
    return "QR does not match current Student record";
  }
  return null;
}

export function isSessionAbsent(session: {
  timeIn: unknown;
  timeOut: unknown;
}): boolean {
  return !session.timeIn || !session.timeOut;
}
