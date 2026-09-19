import { Inject, Injectable } from "@nestjs/common";
import type { SemesterLedgerResponse, StudentLedgerResponse } from "@attendance/contracts";
import { attendanceSessions, events, payments, penalties, semesters, students, type Database } from "@attendance/db";
import { and, eq, inArray } from "drizzle-orm";
import { DB } from "../../../shared/infrastructure/db.module";
import { computeLedger, currentCampusDate, type LedgerInput } from "../domain/ledger";

@Injectable()
export class LedgerUseCase {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async input(semesterId: string, studentId?: string): Promise<LedgerInput | null> {
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
    const paymentRows = penaltyIds.length ? await this.db.select({ penaltyId: payments.penaltyId, amount: payments.amount }).from(payments).where(inArray(payments.penaltyId, penaltyIds)) : [];
    return { campusDate: currentCampusDate(), semesterEndDate: semester.endDate, events: eventRows, students: studentRows, sessions: sessionRows, penalties: penaltyRows, payments: paymentRows };
  }

  async student(semesterId: string, studentId: string): Promise<StudentLedgerResponse> {
    const input = await this.input(semesterId, studentId);
    const standing = input && computeLedger(input).students.get(studentId);
    return standing ? { ...standing, sessions: standing.sessions.map((session) => ({ ...session, timeIn: session.timeIn?.toISOString() ?? null, timeOut: session.timeOut?.toISOString() ?? null })) } : { total: 0, outstanding: 0, sessions: [] };
  }

  async semester(semesterId: string): Promise<SemesterLedgerResponse> {
    const input = await this.input(semesterId);
    if (!input) return { events: [], totals: { present: 0, absent: 0, rate: 0, collected: 0 } };
    const ledger = computeLedger(input);
    const details = new Map((await this.db.select({ id: events.id, name: events.name, venue: events.venue }).from(events).where(eq(events.semesterId, semesterId))).map((event) => [event.id, event]));
    return { events: ledger.events.map((event) => ({ ...event, name: details.get(event.eventId)!.name, venue: details.get(event.eventId)!.venue })), totals: ledger.totals };
  }
}
