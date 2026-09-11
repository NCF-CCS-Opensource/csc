import { events, scans, students } from "@attendance/db";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { decodeQrPayload, qrRejectionReason, type RejectionReason } from "./scan";

// A single rejected-scan row shown on the mobile booth's Rejections view.
// `student` carries the details parsed from the QR payload itself (when it
// decodes), so an Officer can review the rejection even after a Student
// record has since been corrected.
export type RejectedScanView = {
  id: string;
  eventId: string;
  eventName: string;
  scannedAt: string;
  student: { name: string; studentId: string; program: string } | null;
  reason: RejectionReason;
};

// The signed-in Officer's rejected scans, newest first, scoped strictly by
// `officerId` so one Officer never sees another's rejections. Equivalent to
// the web ADMIN rejections view, but scoped to the acting Officer.
export async function listOfficerRejections(
  officerId: string,
): Promise<RejectedScanView[]> {
  const rows = await db
    .select({
      id: scans.id,
      eventId: scans.eventId,
      eventName: events.name,
      scannedAt: scans.scannedAt,
      qrPayload: scans.qrPayload,
      studentName: students.name,
      studentProgram: students.program,
    })
    .from(scans)
    .innerJoin(events, eq(scans.eventId, events.id))
    .leftJoin(students, eq(scans.studentId, students.id))
    .where(and(eq(scans.result, "rejected"), eq(scans.officerId, officerId)))
    .orderBy(desc(scans.scannedAt));

  return rows.map((row) => {
    const decoded = decodeQrPayload(row.qrPayload);
    const resolvedStudent =
      row.studentName && row.studentProgram
        ? { name: row.studentName, program: row.studentProgram }
        : undefined;
    return {
      id: row.id,
      eventId: row.eventId,
      eventName: row.eventName,
      scannedAt: row.scannedAt.toISOString(),
      student: decoded
        ? {
            name: decoded.name,
            studentId: decoded.studentId,
            program: decoded.program,
          }
        : null,
      reason: qrRejectionReason(decoded, resolvedStudent) ?? "Rejected by Officer",
    };
  });
}
