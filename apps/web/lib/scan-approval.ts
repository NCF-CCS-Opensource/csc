import {
  attendanceSessions,
  events,
  scans,
  students,
} from "@attendance/db";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { syncPenaltyForSession } from "./penalties";
import {
  BOOTH_MODES,
  decodeQrPayload,
  modeToHalfAndField,
  type BoothMode,
} from "./scan";
import { hasCapability, type Role } from "./roles";

export class ScanApprovalError extends Error {}

export type ScanDecision = {
  scanId: string;
  type: "approve" | "reject";
  eventId: string;
  mode?: string;
  qrPayload: string;
  scannedAt: string;
};

export async function applyScanDecision(
  actor: { id: string; role: Role },
  decision: ScanDecision,
) {
  if (!hasCapability(actor.role, "manage_operations")) {
    throw new ScanApprovalError("Forbidden");
  }
  if (
    !["approve", "reject"].includes(decision.type) ||
    (decision.type === "approve" &&
      !BOOTH_MODES.includes(decision.mode as BoothMode))
  ) {
    throw new ScanApprovalError("Invalid request");
  }

  const result = await db.transaction(async (transaction) => {
    await transaction.execute(
      sql`select pg_advisory_xact_lock(hashtext(${decision.scanId}))`,
    );
    const existing = await transaction.query.scans.findFirst({
      where: eq(scans.id, decision.scanId),
    });
    if (existing) {
      const mode = decision.type === "approve" ? decision.mode : null;
      const identical =
        existing.eventId === decision.eventId &&
        existing.officerId === actor.id &&
        existing.qrPayload === decision.qrPayload &&
        existing.mode === mode &&
        existing.scannedAt.getTime() === new Date(decision.scannedAt).getTime();
      if (!identical) {
        throw new ScanApprovalError(
          "Scan UUID conflicts with a different decision",
        );
      }
      if (existing.result === "rejected") {
        return existing.mode
          ? {
              ok: false as const,
              outcome: "rejected" as const,
              error: decodeQrPayload(existing.qrPayload)
                ? "QR does not match current Student record"
                : "Unreadable QR",
            }
          : { ok: true as const, outcome: "rejected" as const };
      }

      const student = await transaction.query.students.findFirst({
        where: eq(students.id, existing.studentId!),
      });
      if (!student) throw new ScanApprovalError("Student not found");
      return {
        ok: true as const,
        outcome: "approved" as const,
        student: {
          name: student.name,
          studentId: student.studentId,
          program: student.program,
        },
      };
    }

    const event = await transaction.query.events.findFirst({
      where: eq(events.id, decision.eventId),
    });
    if (!event) throw new ScanApprovalError("Event not found");

    const decoded = decodeQrPayload(decision.qrPayload);
    const student = decoded
      ? await transaction.query.students.findFirst({
          where: eq(students.studentId, decoded.studentId),
        })
      : null;
    if (decision.type === "reject") {
      await transaction.insert(scans).values({
        id: decision.scanId,
        eventId: event.id,
        studentId: student?.id ?? null,
        qrPayload: decision.qrPayload,
        result: "rejected",
        officerId: actor.id,
        scannedAt: new Date(decision.scannedAt),
      });
      return { ok: true as const, outcome: "rejected" as const };
    }

    const rejection =
      !decoded
        ? "Unreadable QR"
        : !student ||
            student.name !== decoded.name ||
            student.program !== decoded.program
          ? "QR does not match current Student record"
          : null;
    if (rejection) {
      await transaction.insert(scans).values({
        id: decision.scanId,
        eventId: event.id,
        studentId: student?.id ?? null,
        qrPayload: decision.qrPayload,
        result: "rejected",
        mode: decision.mode as BoothMode,
        officerId: actor.id,
        scannedAt: new Date(decision.scannedAt),
      });
      return {
        ok: false as const,
        outcome: "rejected" as const,
        error: rejection,
      };
    }
    if (!student) throw new ScanApprovalError("Student not found");

    const mode = decision.mode as BoothMode;
    await transaction.insert(scans).values({
      id: decision.scanId,
      eventId: event.id,
      studentId: student.id,
      qrPayload: decision.qrPayload,
      result: "approved",
      mode,
      officerId: actor.id,
      scannedAt: new Date(decision.scannedAt),
    });

    const { half, field } = modeToHalfAndField(mode);
    const [session] = await transaction
      .insert(attendanceSessions)
      .values(
        field === "timeIn"
          ? {
              eventId: event.id,
              studentId: student.id,
              half,
              timeIn: new Date(decision.scannedAt),
            }
          : {
              eventId: event.id,
              studentId: student.id,
              half,
              timeOut: new Date(decision.scannedAt),
            },
      )
      .onConflictDoUpdate({
        target: [
          attendanceSessions.eventId,
          attendanceSessions.studentId,
          attendanceSessions.half,
        ],
        set:
          field === "timeIn"
            ? {
                timeIn: sql`least(${attendanceSessions.timeIn}, excluded.time_in)`,
              }
            : {
                timeOut: sql`greatest(${attendanceSessions.timeOut}, excluded.time_out)`,
              },
      })
      .returning();
    await syncPenaltyForSession(session.id, transaction);

    return {
      ok: true as const,
      outcome: "approved" as const,
      student: {
        name: student.name,
        studentId: student.studentId,
        program: student.program,
      },
    };
  });
  if (!result.ok) throw new ScanApprovalError(result.error);
  return result;
}
