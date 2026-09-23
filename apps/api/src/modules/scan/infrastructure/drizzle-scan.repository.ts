import { Inject, Injectable } from "@nestjs/common";
import {
  BOOTH_MODES,
  type BoothMode,
  type RejectedScanLogEntry,
  type RejectedScanLogRequest,
  type ScanDecisionRequest,
  type ScannedStudent,
} from "@attendance/contracts";
import {
  attendanceSessions,
  events,
  payments,
  penalties,
  scans,
  students,
  type Database,
} from "@attendance/db";
import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { DB } from "../../../shared/infrastructure/db.module";
import type { Actor } from "../../../shared/domain/actor";
import { hasCapability } from "../../../shared/domain/role";
import { ScanError } from "../domain/scan-error";
import { decodeQrPayload, modeToHalfAndField, qrRejectionReason, type RejectionReason } from "../domain/scan-rules";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type StudentQuery = Pick<Database, "query">;
type ScanResult =
  | { outcome: "approved"; alreadyScanned: boolean; student: ScannedStudent }
  | { outcome: "rejected"; error?: RejectionReason };

@Injectable()
export class DrizzleScanRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async referencedStudent(database: StudentQuery, qrPayload: string) {
    const decoded = decodeQrPayload(qrPayload);
    const student = decoded
      ? await database.query.students.findFirst({ where: eq(students.studentId, decoded.studentId) })
      : null;
    return { decoded, student };
  }

  private publicStudent(student: { name: string; studentId: string; program: string }): ScannedStudent {
    return { name: student.name, studentId: student.studentId, program: student.program };
  }

  async identify(actor: Actor, qrPayload: string): Promise<{ student: ScannedStudent }> {
    this.authorize(actor);
    const { decoded, student } = await this.referencedStudent(this.db, qrPayload);
    const error = qrRejectionReason(decoded, student);
    if (error) throw new ScanError(error, 422);
    return { student: this.publicStudent(student!) };
  }

  async approve(actor: Actor, decision: ScanDecisionRequest): Promise<ScanResult> {
    this.authorize(actor);
    if (!BOOTH_MODES.includes(decision.mode as BoothMode)) throw new ScanError("Invalid request", 400);
    return this.apply(actor.id, decision, "approve");
  }

  async reject(actor: Actor, decision: ScanDecisionRequest): Promise<ScanResult> {
    this.authorize(actor);
    return this.apply(actor.id, decision, "reject");
  }

  private async apply(
    actorId: string,
    decision: ScanDecisionRequest,
    type: "approve" | "reject",
  ): Promise<ScanResult> {
    const capturedAt = new Date(decision.scannedAt);
    if (Number.isNaN(capturedAt.getTime())) throw new ScanError("Invalid request", 400);

    const result = await this.db.transaction(async (transaction) => {
      await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${decision.scanId}))`);
      const existing = await transaction.query.scans.findFirst({ where: eq(scans.id, decision.scanId) });
      const mode = type === "approve" ? decision.mode! : null;
      if (existing) {
        if (
          existing.eventId !== decision.eventId ||
          existing.officerId !== actorId ||
          existing.qrPayload !== decision.qrPayload ||
          existing.mode !== mode ||
          existing.scannedAt.getTime() !== capturedAt.getTime()
        ) {
          throw new ScanError("Scan UUID conflicts with a different decision", 409);
        }
        if (existing.result === "rejected") {
          return {
            outcome: "rejected" as const,
            ...(existing.mode
              ? { error: qrRejectionReason(decodeQrPayload(existing.qrPayload), undefined)! }
              : {}),
          };
        }
        const student = await transaction.query.students.findFirst({ where: eq(students.id, existing.studentId!) });
        if (!student) throw new ScanError("Student not found", 404);
        return { outcome: "approved" as const, alreadyScanned: true, student: this.publicStudent(student) };
      }

      const event = await transaction.query.events.findFirst({ where: eq(events.id, decision.eventId) });
      if (!event) throw new ScanError("Event not found", 404);

      const { decoded, student } = await this.referencedStudent(transaction, decision.qrPayload);
      if (type === "reject") {
        await transaction.insert(scans).values({
          id: decision.scanId,
          eventId: event.id,
          studentId: student?.id ?? null,
          qrPayload: decision.qrPayload,
          result: "rejected",
          officerId: actorId,
          scannedAt: capturedAt,
        });
        return { outcome: "rejected" as const };
      }

      const rejection = qrRejectionReason(decoded, student);
      if (rejection) {
        await transaction.insert(scans).values({
          id: decision.scanId,
          eventId: event.id,
          studentId: student?.id ?? null,
          qrPayload: decision.qrPayload,
          result: "rejected",
          mode,
          officerId: actorId,
          scannedAt: capturedAt,
        });
        return { outcome: "rejected" as const, error: rejection };
      }

      // TM-2: no separation of duties on money — an Officer must not be able
      // to approve a scan of their own QR, since that directly records their
      // own Attendance Session and clears their own Penalty. (Reaching here
      // means `type === "approve"`: the reject branch above already returned.)
      if (student!.id === actorId) {
        throw new ScanError("Officers cannot approve their own scan", 403);
      }

      // Different decision UUIDs need the same lock too: this preserves the
      // first-vs-rescan response under simultaneous offline deliveries.
      const decisionLock = `${event.id}:${student!.id}:${mode}`;
      await transaction.execute(sql`select pg_advisory_xact_lock(hashtext(${decisionLock}))`);
      const alreadyScanned = Boolean(await transaction.query.scans.findFirst({
        where: sql`${scans.eventId} = ${event.id} and ${scans.studentId} = ${student!.id}
          and ${scans.result} = 'approved' and ${scans.mode} = ${mode}`,
      }));
      await transaction.insert(scans).values({
        id: decision.scanId,
        eventId: event.id,
        studentId: student!.id,
        qrPayload: decision.qrPayload,
        result: "approved",
        mode,
        officerId: actorId,
        scannedAt: capturedAt,
      });
      const { half, field } = modeToHalfAndField(mode as BoothMode);
      const [session] = await transaction
        .insert(attendanceSessions)
        .values(field === "timeIn"
          ? { eventId: event.id, studentId: student!.id, half, timeIn: capturedAt }
          : { eventId: event.id, studentId: student!.id, half, timeOut: capturedAt })
        .onConflictDoUpdate({
          target: [attendanceSessions.eventId, attendanceSessions.studentId, attendanceSessions.half],
          set: field === "timeIn"
            ? { timeIn: sql`least(${attendanceSessions.timeIn}, excluded.time_in)` }
            : { timeOut: sql`greatest(${attendanceSessions.timeOut}, excluded.time_out)` },
        })
        .returning();
      const amount = session.timeIn && session.timeOut ? null : event.halfDayPenaltyAmount;
      if (amount === null) {
        const existingPenalty = await transaction.query.penalties.findFirst({
          where: eq(penalties.attendanceSessionId, session.id),
        });
        if (existingPenalty) {
          const paid = await transaction.query.payments.findFirst({
            where: eq(payments.penaltyId, existingPenalty.id),
          });
          if (!paid) await transaction.delete(penalties).where(eq(penalties.id, existingPenalty.id));
        }
      } else {
        await transaction.insert(penalties).values({ attendanceSessionId: session.id, studentId: session.studentId, amount })
          .onConflictDoUpdate({ target: penalties.attendanceSessionId, set: { amount } });
      }
      return { outcome: "approved" as const, alreadyScanned, student: this.publicStudent(student!) };
    });
    if ("error" in result && result.error) throw new ScanError(result.error, 422);
    return result;
  }

  async rejections(actor: Actor): Promise<{ rejections: Array<{
    id: string; eventId: string; eventName: string; scannedAt: string;
    student: ScannedStudent | null; reason: RejectionReason;
  }> }> {
    this.authorize(actor);
    const rows = await this.db.select({
      id: scans.id, eventId: scans.eventId, eventName: events.name, scannedAt: scans.scannedAt,
      qrPayload: scans.qrPayload, studentName: students.name, studentProgram: students.program,
    }).from(scans).innerJoin(events, eq(scans.eventId, events.id)).leftJoin(students, eq(scans.studentId, students.id))
      .where(and(eq(scans.result, "rejected"), eq(scans.officerId, actor.id))).orderBy(desc(scans.scannedAt));
    return { rejections: rows.map((row) => {
      const decoded = decodeQrPayload(row.qrPayload);
      return {
        id: row.id, eventId: row.eventId, eventName: row.eventName, scannedAt: row.scannedAt.toISOString(),
        student: decoded ? { name: decoded.name, studentId: decoded.studentId, program: decoded.program } : null,
        reason: qrRejectionReason(decoded, row.studentName && row.studentProgram ? { name: row.studentName, program: row.studentProgram } : undefined) ?? "Rejected by Officer",
      };
    }) };
  }

  // Known Gap #6 (PR #184): Governor-wide, searchable/sortable — unlike
  // rejections() above, not scoped to the calling Officer. Ported from
  // admin/rejections/page.tsx's direct-DB read.
  async rejectionsLog(actor: Actor, filter: RejectedScanLogRequest): Promise<{ rejections: RejectedScanLogEntry[] }> {
    if (!hasCapability(actor.role, "administer")) throw new ScanError("Forbidden", 403);

    const officers = alias(students, "officers");
    const conditions = [eq(scans.result, "rejected")];
    if (filter.q) {
      conditions.push(
        or(
          ilike(students.name, `%${filter.q}%`),
          ilike(students.studentId, `%${filter.q}%`),
          ilike(scans.qrPayload, `%${filter.q}%`),
        )!,
      );
    }

    const rows = await this.db
      .select({
        scanId: scans.id,
        qrPayload: scans.qrPayload,
        scannedAt: scans.scannedAt,
        studentName: students.name,
        studentIdText: students.studentId,
        officerName: officers.name,
      })
      .from(scans)
      .leftJoin(students, eq(scans.studentId, students.id))
      .innerJoin(officers, eq(scans.officerId, officers.id))
      .where(and(...conditions))
      .orderBy(filter.sort === "time" ? desc(scans.scannedAt) : asc(students.name));

    return {
      rejections: rows.map((row) => ({
        scanId: row.scanId,
        qrPayload: row.qrPayload,
        scannedAt: row.scannedAt.toISOString(),
        studentName: row.studentName,
        studentIdText: row.studentIdText,
        officerName: row.officerName,
      })),
    };
  }

  private authorize(actor: Actor): void {
    if (!hasCapability(actor.role, "use_mobile_booth")) throw new ScanError("Forbidden", 403);
  }
}
