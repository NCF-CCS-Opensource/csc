export type QrStudent = { name: string; studentId: string; program: string };

// null when unreadable/malformed; isReadableQrPayload is just `!!parseQrPayload(raw)`.
export function parseQrPayload(raw: string): QrStudent | null {
  try {
    const { name, studentId, program } = JSON.parse(raw) as Record<
      string,
      unknown
    >;
    return [name, studentId, program].every(
      (value) => typeof value === "string" && value.length > 0,
    )
      ? ({ name, studentId, program } as QrStudent)
      : null;
  } catch {
    return null;
  }
}

export function isReadableQrPayload(raw: string): boolean {
  return parseQrPayload(raw) !== null;
}
