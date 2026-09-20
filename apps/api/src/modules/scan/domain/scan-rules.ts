import type { BoothMode } from "@attendance/contracts";

export type QrPayload = { name: string; studentId: string; program: string };
export type RejectionReason =
  | "Unreadable QR"
  | "QR does not match current Student record"
  | "Rejected by Officer";

export function decodeQrPayload(raw: string): QrPayload | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const { name, studentId, program } = parsed as Record<string, unknown>;
    return typeof name === "string" && typeof studentId === "string" && typeof program === "string"
      ? { name, studentId, program }
      : null;
  } catch {
    return null;
  }
}

export function qrRejectionReason(
  decoded: QrPayload | null,
  student: { name: string; program: string } | null | undefined,
): RejectionReason | null {
  if (!decoded) return "Unreadable QR";
  if (student?.name !== decoded.name || student?.program !== decoded.program) {
    return "QR does not match current Student record";
  }
  return null;
}

export function modeToHalfAndField(mode: BoothMode): {
  half: "am" | "pm";
  field: "timeIn" | "timeOut";
} {
  return {
    half: mode.endsWith("_am") ? "am" : "pm",
    field: mode.startsWith("time_in") ? "timeIn" : "timeOut",
  };
}
