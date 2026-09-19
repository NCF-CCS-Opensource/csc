import { HttpException, Inject, Injectable } from "@nestjs/common";
import type { AttendanceGridResponse, CorrectAttendanceRequest, EventGridCell, EventGridRow } from "@attendance/contracts";
import { attendanceSessions, events, payments, penalties, semesters, students, type Database } from "@attendance/db";
import { eq, inArray } from "drizzle-orm";
import { DB } from "../../../shared/infrastructure/db.module";

type Half = "am" | "pm";
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
type Db = Database | Transaction;

function absent(session: { timeIn: unknown; timeOut: unknown }) {
  return !session.timeIn || !session.timeOut;
}

function campusDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function owedHalves(type: "half_day" | "whole_day", completed: { am: boolean; pm: boolean }, existing: Set<Half>): Half[] {
  if (type === "half_day") return existing.size || completed.am || completed.pm ? [] : ["am"];
  return (["am", "pm"] as Half[]).filter((half) => !completed[half] && !existing.has(half));
}

@Injectable()
export class AttendanceUseCase {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async syncPenalty(sessionId: string, database: Db): Promise<void> {
    const session = await database.query.attendanceSessions.findFirst({ where: eq(attendanceSessions.id, sessionId) });
    if (!session) return;
    const event = await database.query.events.findFirst({ where: eq(events.id, session.eventId) });
    if (!event) return;
    const existing = await database.query.penalties.findFirst({ where: eq(penalties.attendanceSessionId, sessionId) });
    if (!absent(session)) {
      if (existing && !await database.query.payments.findFirst({ where: eq(payments.penaltyId, existing.id) })) {
        await database.delete(penalties).where(eq(penalties.id, existing.id));
      }
      return;
    }
    if (existing) {
      await database.update(penalties).set({ amount: event.halfDayPenaltyAmount }).where(eq(penalties.id, existing.id));
    } else {
      await database.insert(penalties).values({ attendanceSessionId: session.id, studentId: session.studentId, amount: event.halfDayPenaltyAmount });
    }
  }

  private async materializeNoShows(eventId: string): Promise<void> {
    const event = await this.db.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event || event.date > campusDate()) return;
    const semester = await this.db.query.semesters.findFirst({ where: eq(semesters.id, event.semesterId) });
    if (!semester) return;
    const [allStudents, existing] = await Promise.all([
      this.db.select({ id: students.id, createdAt: students.createdAt }).from(students),
      this.db.select({ studentId: attendanceSessions.studentId, half: attendanceSessions.half, timeIn: attendanceSessions.timeIn, timeOut: attendanceSessions.timeOut }).from(attendanceSessions).where(eq(attendanceSessions.eventId, eventId)),
    ]);
    const halves = new Map<string, Set<Half>>();
    const completed = new Map<string, { am: boolean; pm: boolean }>();
    for (const row of existing) {
      (halves.get(row.studentId) ?? halves.set(row.studentId, new Set()).get(row.studentId)!).add(row.half);
      const studentCompleted = completed.get(row.studentId) ?? { am: false, pm: false };
      if (!absent(row)) studentCompleted[row.half] = true;
      completed.set(row.studentId, studentCompleted);
    }
    const missing = allStudents.flatMap((student) => student.createdAt.toISOString().slice(0, 10) > semester.endDate ? [] : owedHalves(event.type, completed.get(student.id) ?? { am: false, pm: false }, halves.get(student.id) ?? new Set()).map((half) => ({ eventId, studentId: student.id, half })));
    if (!missing.length) return;
    const inserted = await this.db.insert(attendanceSessions).values(missing).onConflictDoNothing().returning({ id: attendanceSessions.id, studentId: attendanceSessions.studentId });
    if (inserted.length) await this.db.insert(penalties).values(inserted.map((session) => ({ attendanceSessionId: session.id, studentId: session.studentId, amount: event.halfDayPenaltyAmount }))).onConflictDoNothing();
  }

  async grid(eventId: string): Promise<AttendanceGridResponse> {
    const event = await this.db.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event) throw new HttpException("Event not found", 404);
    await this.materializeNoShows(event.id);
    const [sessions, penaltyRows, paymentRows] = await Promise.all([
      this.db.select({ id: attendanceSessions.id, studentId: attendanceSessions.studentId, half: attendanceSessions.half, timeIn: attendanceSessions.timeIn, timeOut: attendanceSessions.timeOut, name: students.name, studentIdText: students.studentId }).from(attendanceSessions).innerJoin(students, eq(attendanceSessions.studentId, students.id)).where(eq(attendanceSessions.eventId, event.id)),
      this.db.select({ id: penalties.id, attendanceSessionId: penalties.attendanceSessionId, amount: penalties.amount }).from(penalties).innerJoin(attendanceSessions, eq(penalties.attendanceSessionId, attendanceSessions.id)).where(eq(attendanceSessions.eventId, event.id)),
      this.db.select({ penaltyId: payments.penaltyId }).from(payments).innerJoin(penalties, eq(payments.penaltyId, penalties.id)).innerJoin(attendanceSessions, eq(penalties.attendanceSessionId, attendanceSessions.id)).where(eq(attendanceSessions.eventId, event.id)),
    ]);
    const paid = new Set(paymentRows.map((payment) => payment.penaltyId));
    const penaltyBySession = new Map(penaltyRows.map((penalty) => [penalty.attendanceSessionId, penalty]));
    const byStudentHalf = new Map(sessions.map((session) => [`${session.studentId}:${session.half}`, session]));
    const cells = (session: typeof sessions[number] | undefined, label: string, field: "timeIn" | "timeOut"): EventGridCell => ({ label, sessionId: session?.id ?? "", field, present: !!session?.[field] });
    const studentRows = [...new Map(sessions.map((session) => [session.studentId, session])).values()].sort((a, b) => a.name.localeCompare(b.name));
    const rows: EventGridRow[] = studentRows.map((student) => {
      const ownSessions = sessions.filter((session) => session.studentId === student.studentId);
      const am = byStudentHalf.get(`${student.studentId}:am`);
      const pm = byStudentHalf.get(`${student.studentId}:pm`);
      const unpaidPenaltyIds = ownSessions.flatMap((session) => {
        const penalty = penaltyBySession.get(session.id);
        return penalty && !paid.has(penalty.id) ? [penalty.id] : [];
      });
      const outstanding = ownSessions.reduce((sum, session) => {
        const penalty = penaltyBySession.get(session.id);
        return penalty && !paid.has(penalty.id) ? sum + Number(penalty.amount) : sum;
      }, 0);
      const penaltyCount = ownSessions.filter((session) => penaltyBySession.has(session.id)).length;
      return { studentId: student.studentId, name: student.name, studentIdText: student.studentIdText, cells: event.type === "half_day" ? [cells(am ?? pm, "Time-in", "timeIn"), cells(am ?? pm, "Time-out", "timeOut")] : [cells(am, "AM In", "timeIn"), cells(am, "AM Out", "timeOut"), cells(pm, "PM In", "timeIn"), cells(pm, "PM Out", "timeOut")], outstanding, unpaidPenaltyIds, settled: penaltyCount > 0 && unpaidPenaltyIds.length === 0 };
    });
    return { event: { id: event.id, name: event.name, halfDayPenaltyAmount: event.halfDayPenaltyAmount }, rows };
  }

  async correct(input: CorrectAttendanceRequest): Promise<{ eventId: string }> {
    return this.db.transaction(async (transaction) => {
      const session = await transaction.query.attendanceSessions.findFirst({ where: eq(attendanceSessions.id, input.sessionId) });
      if (!session) throw new HttpException("Attendance Session not found", 404);
      const event = await transaction.query.events.findFirst({ where: eq(events.id, session.eventId) });
      if (!event) throw new HttpException("Event not found", 404);
      const sentinel = input.present ? new Date(`${event.date}T12:00:00+08:00`) : null;
      await transaction.update(attendanceSessions).set(input.field === "timeIn" ? { timeIn: sentinel } : { timeOut: sentinel }).where(eq(attendanceSessions.id, session.id));
      await this.syncPenalty(session.id, transaction);
      return { eventId: event.id };
    });
  }

  async recordPayments(penaltyIds: string[], officerId: string): Promise<void> {
    if (!penaltyIds.length) return;
    const rows = await this.db.query.penalties.findMany({ where: inArray(penalties.id, penaltyIds) });
    if (rows.length) await this.db.insert(payments).values(rows.map((penalty) => ({ penaltyId: penalty.id, amount: penalty.amount, officerId }))).onConflictDoNothing({ target: payments.penaltyId });
  }
}
