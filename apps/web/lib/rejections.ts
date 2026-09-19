import { events, scans, students } from "@attendance/db";
import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { decodeQrPayload, qrRejectionReason, type RejectionReason } from "./scan";

export type RejectedScanView = {
  id: string; eventId: string; eventName: string; scannedAt: string;
  student: { name: string; studentId: string; program: string } | null;
  reason: RejectionReason;
};

// Kept for the legacy web integration test while the mobile route itself is
// now an API relay. New production callers use ScanApprovalUseCase.
export async function listOfficerRejections(officerId: string): Promise<RejectedScanView[]> {
  const rows = await db.select({
    id: scans.id, eventId: scans.eventId, eventName: events.name, scannedAt: scans.scannedAt,
    qrPayload: scans.qrPayload, studentName: students.name, studentProgram: students.program,
  }).from(scans).innerJoin(events, eq(scans.eventId, events.id)).leftJoin(students, eq(scans.studentId, students.id))
    .where(and(eq(scans.result, "rejected"), eq(scans.officerId, officerId))).orderBy(desc(scans.scannedAt));
  return rows.map((row) => {
    const decoded = decodeQrPayload(row.qrPayload);
    return {
      id: row.id, eventId: row.eventId, eventName: row.eventName, scannedAt: row.scannedAt.toISOString(),
      student: decoded ? { name: decoded.name, studentId: decoded.studentId, program: decoded.program } : null,
      reason: qrRejectionReason(decoded, row.studentName && row.studentProgram ? { name: row.studentName, program: row.studentProgram } : undefined) ?? "Rejected by Officer",
    };
  });
}
