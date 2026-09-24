import { Inject, Injectable } from "@nestjs/common";
import { attendanceSessions, events, payments, penalties, semesters, students, type Database } from "@attendance/db";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { DB } from "../../../shared/infrastructure/db.module";
import type { LedgerRepository } from "../domain/ledger-repository";
import { currentCampusDate, type LedgerInput } from "../domain/ledger";

@Injectable()
export class DrizzleLedgerRepository implements LedgerRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async ledgerInput(semesterId: string, studentId?: string): Promise<LedgerInput | null> {
    const [semester, eventRows, studentRows] = await Promise.all([
      this.db.query.semesters.findFirst({ where: eq(semesters.id, semesterId) }),
      this.db.select({ id: events.id, name: events.name, date: events.date, type: events.type, halfDayPenaltyAmount: events.halfDayPenaltyAmount }).from(events).where(eq(events.semesterId, semesterId)),
      studentId ? this.db.select({ id: students.id, createdAt: students.createdAt }).from(students).where(eq(students.id, studentId)) : this.db.select({ id: students.id, createdAt: students.createdAt }).from(students),
    ]);
    if (!semester || !eventRows.length || (studentId && !studentRows.length)) return null;
    const eventIds = eventRows.map((event) => event.id);
    const sessionRows = await this.db.select({ id: attendanceSessions.id, eventId: attendanceSessions.eventId, studentId: attendanceSessions.studentId, half: attendanceSessions.half, timeIn: attendanceSessions.timeIn, timeOut: attendanceSessions.timeOut }).from(attendanceSessions).where(studentId ? and(eq(attendanceSessions.studentId, studentId), inArray(attendanceSessions.eventId, eventIds)) : inArray(attendanceSessions.eventId, eventIds));
    const sessionIds = sessionRows.map((session) => session.id);
    const penaltyRows = sessionIds.length ? await this.db.select({ id: penalties.id, attendanceSessionId: penalties.attendanceSessionId, studentId: penalties.studentId, amount: penalties.amount }).from(penalties).where(inArray(penalties.attendanceSessionId, sessionIds)) : [];
    const penaltyIds = penaltyRows.map((penalty) => penalty.id);
    const paymentRows = penaltyIds.length ? await this.db.select({ penaltyId: payments.penaltyId, amount: payments.amount, voidedAt: payments.voidedAt }).from(payments).where(inArray(payments.penaltyId, penaltyIds)) : [];
    return { campusDate: currentCampusDate(), semesterEndDate: semester.endDate, events: eventRows, students: studentRows, sessions: sessionRows, penalties: penaltyRows, payments: paymentRows };
  }

  async eventDetails(semesterId: string): Promise<Map<string, { name: string; venue: string | null }>> {
    const rows = await this.db.select({ id: events.id, name: events.name, venue: events.venue }).from(events).where(eq(events.semesterId, semesterId));
    return new Map(rows.map((event) => [event.id, event]));
  }

  async paymentHistory(studentId: string): Promise<{ id: string; amount: string; paidAt: Date }[]> {
    return this.db
      .select({ id: payments.id, amount: payments.amount, paidAt: payments.paidAt })
      .from(payments)
      .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
      .where(and(eq(penalties.studentId, studentId), isNull(payments.voidedAt)))
      .orderBy(desc(payments.paidAt));
  }
}
