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

export class ScanApprovalError extends Error {
  constructor(
    message: string,
    readonly status = 422,
  ) {
    super(message);
  }
}
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Database = typeof db | Transaction;

export type ScanDecision = {
  scanId: string;
  type: "approve" | "reject";
  eventId: string;
  mode?: string;
  qrPayload: string;
  scannedAt: string;
};

async function findReferencedStudent(
  database: Database,
  qrPayload: string,
) {
  const decoded = decodeQrPayload(qrPayload);
  const student = decoded
    ? await database.query.students.findFirst({
        where: eq(students.studentId, decoded.studentId),
      })
    : null;
  return { decoded, student };
}

function qrError(
  decoded: ReturnType<typeof decodeQrPayload>,
  student: Awaited<ReturnType<typeof findReferencedStudent>>["student"],
): string | null {
  if (!decoded) return "Unreadable QR";
  return !student ||
    student.name !== decoded.name ||
    student.program !== decoded.program
    ? "QR does not match current Student record"
    : null;
}

export async function identifyScanStudent(
  actor: { role: Role },
  qrPayload: string,
) {
  if (!hasCapability(actor.role, "manage_operations")) {
    throw new ScanApprovalError("Forbidden", 403);
  }
  const { decoded, student } = await findReferencedStudent(db, qrPayload);
  const error = qrError(decoded, student);
  return error
    ? { error }
    : {
        student: {
          name: student!.name,
          studentId: student!.studentId,
          program: student!.program,
        },
      };
}

export async function applyScanDecision(
  actor: { id: string; role: Role },
  decision: ScanDecision,
) {
  if (!hasCapability(actor.role, "manage_operations")) {
    throw new ScanApprovalError("Forbidden", 403);
  }
  if (
    !["approve", "reject"].includes(decision.type) ||
    (decision.type === "approve" &&
      !BOOTH_MODES.includes(decision.mode as BoothMode))
  ) {
    throw new ScanApprovalError("Invalid request", 400);
  }
  const capturedAt = new Date(decision.scannedAt);
  if (Number.isNaN(capturedAt.getTime())) {
    throw new ScanApprovalError("Invalid request", 400);
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
        existing.scannedAt.getTime() === capturedAt.getTime();
      if (!identical) {
        throw new ScanApprovalError(
          "Scan UUID conflicts with a different decision",
          409,
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
      if (!student) throw new ScanApprovalError("Student not found", 404);
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
    if (!event) throw new ScanApprovalError("Event not found", 404);

    const { decoded, student } = await findReferencedStudent(
      transaction,
      decision.qrPayload,
    );
    if (decision.type === "reject") {
      await transaction.insert(scans).values({
        id: decision.scanId,
        eventId: event.id,
        studentId: student?.id ?? null,
        qrPayload: decision.qrPayload,
        result: "rejected",
        officerId: actor.id,
        scannedAt: capturedAt,
      });
      return { ok: true as const, outcome: "rejected" as const };
    }

    const rejection = qrError(decoded, student);
    if (rejection) {
      await transaction.insert(scans).values({
        id: decision.scanId,
        eventId: event.id,
        studentId: student?.id ?? null,
        qrPayload: decision.qrPayload,
        result: "rejected",
        mode: decision.mode as BoothMode,
        officerId: actor.id,
        scannedAt: capturedAt,
      });
      return {
        ok: false as const,
        outcome: "rejected" as const,
        error: rejection,
      };
    }
    if (!student) throw new ScanApprovalError("Student not found", 404);

    const mode = decision.mode as BoothMode;
    await transaction.insert(scans).values({
      id: decision.scanId,
      eventId: event.id,
      studentId: student.id,
      qrPayload: decision.qrPayload,
      result: "approved",
      mode,
      officerId: actor.id,
      scannedAt: capturedAt,
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
              timeIn: capturedAt,
            }
          : {
              eventId: event.id,
              studentId: student.id,
              half,
              timeOut: capturedAt,
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
