import { Inject, Injectable } from "@nestjs/common";
import { attendanceSessions, events, payments, penalties, semesters, students, type Database } from "@attendance/db";
import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { DB } from "../../../shared/infrastructure/db.module";
import type { LedgerRepository } from "../domain/ledger-repository";
import { currentCampusDate, type LedgerInput } from "../domain/ledger";

@Injectable()
export class DrizzleLedgerRepository implements LedgerRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async ledgerInput(semesterId: string, studentId?: string): Promise<LedgerInput | null> {
    // A Payment's target columns are nullable (Penalty or SAF Fee); each query
    // filters on its own target, so the casts narrow them back to string.
    const [semester, eventRows, studentRows, safPayments] = await Promise.all([
      this.db.query.semesters.findFirst({ where: eq(semesters.id, semesterId) }),
      this.db.select({ id: events.id, name: events.name, date: events.date, type: events.type, halfDayPenaltyAmount: events.halfDayPenaltyAmount }).from(events).where(eq(events.semesterId, semesterId)),
      studentId ? this.db.select({ id: students.id, createdAt: students.createdAt }).from(students).where(eq(students.id, studentId)) : this.db.select({ id: students.id, createdAt: students.createdAt }).from(students),
      this.db.select({ id: payments.id, studentId: sql<string>`${payments.studentId}`, voidedAt: payments.voidedAt }).from(payments).where(and(eq(payments.semesterId, semesterId), isNull(payments.voidedAt), studentId ? eq(payments.studentId, studentId) : undefined)),
    ]);
    if (!semester || (studentId && !studentRows.length)) return null;
    const eventIds = eventRows.map((event) => event.id);
    const sessionRows = !eventIds.length ? [] : await this.db.select({ id: attendanceSessions.id, eventId: attendanceSessions.eventId, studentId: attendanceSessions.studentId, half: attendanceSessions.half, timeIn: attendanceSessions.timeIn, timeOut: attendanceSessions.timeOut }).from(attendanceSessions).where(studentId ? and(eq(attendanceSessions.studentId, studentId), inArray(attendanceSessions.eventId, eventIds)) : inArray(attendanceSessions.eventId, eventIds));
    const sessionIds = sessionRows.map((session) => session.id);
    const penaltyRows = sessionIds.length ? await this.db.select({ id: penalties.id, attendanceSessionId: penalties.attendanceSessionId, studentId: penalties.studentId, amount: penalties.amount }).from(penalties).where(inArray(penalties.attendanceSessionId, sessionIds)) : [];
    const penaltyIds = penaltyRows.map((penalty) => penalty.id);
    const paymentRows = penaltyIds.length ? await this.db.select({ penaltyId: sql<string>`${payments.penaltyId}`, amount: payments.amount, voidedAt: payments.voidedAt }).from(payments).where(inArray(payments.penaltyId, penaltyIds)) : [];
    return { campusDate: currentCampusDate(), semesterEndDate: semester.endDate, events: eventRows, students: studentRows, sessions: sessionRows, penalties: penaltyRows, payments: paymentRows, safFeeAmount: semester.safFeeAmount, safPayments };
  }

  async eventDetails(semesterId: string): Promise<Map<string, { name: string; venue: string | null }>> {
    const rows = await this.db.select({ id: events.id, name: events.name, venue: events.venue }).from(events).where(eq(events.semesterId, semesterId));
    return new Map(rows.map((event) => [event.id, event]));
  }

  async paymentHistory(studentId: string): Promise<{ id: string; amount: string; paidAt: Date }[]> {
    return this.db
      .select({ id: payments.id, amount: payments.amount, paidAt: payments.paidAt })
      .from(payments)
      .leftJoin(penalties, eq(payments.penaltyId, penalties.id))
      .where(and(or(eq(penalties.studentId, studentId), eq(payments.studentId, studentId)), isNull(payments.voidedAt)))
      .orderBy(desc(payments.paidAt));
  }
}
