export type AttendanceHalf = "am" | "pm";

export function isAbsent(session: { timeIn: unknown; timeOut: unknown }) {
  return !session.timeIn || !session.timeOut;
}

export function currentCampusDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function owedHalves(
  type: "half_day" | "whole_day",
  completed: { am: boolean; pm: boolean },
  existing: Set<AttendanceHalf>,
): AttendanceHalf[] {
  if (type === "half_day") return existing.size || completed.am || completed.pm ? [] : ["am"];
  return (["am", "pm"] as AttendanceHalf[]).filter((half) => !completed[half] && !existing.has(half));
}
