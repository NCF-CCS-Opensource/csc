export function isReadableQrPayload(raw: string): boolean {
  try {
    const { name, studentId, program } = JSON.parse(raw) as Record<
      string,
      unknown
    >;
    return [name, studentId, program].every(
      (value) => typeof value === "string" && value.length > 0,
    );
  } catch {
    return false;
  }
}
