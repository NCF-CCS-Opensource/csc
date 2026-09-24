import { Inject, Injectable } from "@nestjs/common";
import {
  attendanceSessions,
  events,
  payments,
  penalties,
  programs,
  semesters,
  students,
  type Database,
} from "@attendance/db";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { DB } from "../../../shared/infrastructure/db.module";
import type { ReportRepository } from "../domain/report-repository";
import type {
  FinancialReportInput,
  PerEventReportInput,
  PerSemesterReportInput,
  PerStudentReportInput,
} from "../domain/report";

function asOfTimestamp(): string {
  const campusDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce((acc, part) => (part.type === "year" || part.type === "month" || part.type === "day" ? { ...acc, [part.type]: part.value } : acc), {} as Record<string, string>);
  const time = new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour12: false });
  return `${campusDate.year}-${campusDate.month}-${campusDate.day} ${time}`;
}

@Injectable()
export class DrizzleReportRepository implements ReportRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async perEventInput(eventId: string): Promise<PerEventReportInput | null> {
    const event = await this.db.query.events.findFirst({ where: eq(events.id, eventId) });
    if (!event) return null;

    const semester = await this.db.query.semesters.findFirst({ where: eq(semesters.id, event.semesterId) });

    const [allStudents, allPrograms, sessionRows] = await Promise.all([
      this.db.select({ id: students.id, name: students.name, studentId: students.studentId, program: students.program, createdAt: students.createdAt }).from(students),
      this.db.select({ name: programs.name }).from(programs),
      this.db.select({ id: attendanceSessions.id, studentId: attendanceSessions.studentId, half: attendanceSessions.half, timeIn: attendanceSessions.timeIn, timeOut: attendanceSessions.timeOut }).from(attendanceSessions).where(eq(attendanceSessions.eventId, eventId)),
    ]);

    const eligibleStudents = semester
      ? allStudents.filter((s) => s.createdAt.toISOString().slice(0, 10) <= semester.endDate)
      : allStudents;

    const sessionIds = sessionRows.map((s) => s.id);
    const penaltyRows = sessionIds.length
      ? await this.db.select({ id: penalties.id, attendanceSessionId: penalties.attendanceSessionId, studentId: penalties.studentId, amount: penalties.amount }).from(penalties).where(inArray(penalties.attendanceSessionId, sessionIds))
      : [];

    const semesterName = semester ? `${semester.startDate} to ${semester.endDate}` : "Semester";

    return {
      event: {
        id: event.id,
        name: event.name,
        date: event.date,
        venue: event.venue,
        type: event.type,
        halfDayPenaltyAmount: event.halfDayPenaltyAmount,
        semesterName,
      },
      students: eligibleStudents,
      sessions: sessionRows,
      penalties: penaltyRows,
      programs: allPrograms.map((p) => p.name),
    };
  }

  async perStudentInput(studentId: string, semesterId: string): Promise<PerStudentReportInput | null> {
    const student = await this.db.query.students.findFirst({ where: eq(students.id, studentId) });
    if (!student) return null;

    const semester = await this.db.query.semesters.findFirst({ where: eq(semesters.id, semesterId) });
    if (!semester) return null;

    const semesterEvents = await this.db.select({ id: events.id, name: events.name, date: events.date, type: events.type, halfDayPenaltyAmount: events.halfDayPenaltyAmount }).from(events).where(eq(events.semesterId, semesterId));
    const eventIds = new Set(semesterEvents.map((e) => e.id));

    const studentSessions = await this.db.select({ id: attendanceSessions.id, eventId: attendanceSessions.eventId, half: attendanceSessions.half, timeIn: attendanceSessions.timeIn, timeOut: attendanceSessions.timeOut }).from(attendanceSessions).where(eq(attendanceSessions.studentId, studentId));
    const filteredSessions = studentSessions.filter((s) => eventIds.has(s.eventId));

    const studentPenalties = await this.db.select({ id: penalties.id, attendanceSessionId: penalties.attendanceSessionId, studentId: penalties.studentId, amount: penalties.amount }).from(penalties).where(eq(penalties.studentId, studentId));
    const penaltyIds = studentPenalties.map((p) => p.id);
    // penalty_id is nullable since SAF Fee Payments (#336); filtering by it
    // leaves only Penalty Payments, so the cast narrows it back to string.
    const studentPayments = penaltyIds.length
      ? await this.db.select({ id: payments.id, penaltyId: sql<string>`${payments.penaltyId}`, amount: payments.amount }).from(payments).where(and(inArray(payments.penaltyId, penaltyIds), isNull(payments.voidedAt)))
      : [];
    const safFeePayments = await this.db.select({ amount: payments.amount, voidedAt: payments.voidedAt }).from(payments).where(and(eq(payments.studentId, studentId), eq(payments.semesterId, semesterId)));

    return {
      student: { id: student.id, name: student.name, studentId: student.studentId, program: student.program },
      semesterName: `${semester.startDate} to ${semester.endDate}`,
      events: semesterEvents,
      sessions: filteredSessions,
      penalties: studentPenalties,
      payments: studentPayments,
      safFeeAmount: semester.safFeeAmount,
      safFeePayments,
      asOfTimestamp: asOfTimestamp(),
    };
  }

  async perSemesterInput(semesterId: string): Promise<PerSemesterReportInput | null> {
    const semester = await this.db.query.semesters.findFirst({ where: eq(semesters.id, semesterId) });
    if (!semester) return null;

    const { eligibleStudents, allPrograms, semesterEvents, sessionRows, penaltyRows, paymentRows } =
      await this.semesterAggregateRows(semester);

    return {
      semester: { id: semester.id, name: `${semester.startDate} to ${semester.endDate}`, startDate: semester.startDate, endDate: semester.endDate, closedAt: semester.closedAt },
      students: eligibleStudents,
      events: semesterEvents,
      sessions: sessionRows,
      penalties: penaltyRows,
      payments: paymentRows,
      programs: allPrograms.map((p) => p.name),
      asOfTimestamp: asOfTimestamp(),
    };
  }

  async financialInput(semesterId: string): Promise<FinancialReportInput | null> {
    const semester = await this.db.query.semesters.findFirst({ where: eq(semesters.id, semesterId) });
    if (!semester) return null;

    const { eligibleStudents, allPrograms, semesterEvents, sessionRows, penaltyRows, paymentRows } =
      await this.semesterAggregateRows(semester);

    const officerIds = Array.from(new Set(paymentRows.map((p) => p.officerId).filter(Boolean)));
    const officerRows = officerIds.length
      ? await this.db.select({ id: students.id, name: students.name }).from(students).where(inArray(students.id, officerIds))
      : [];
    const officerMap = new Map(officerRows.map((o) => [o.id, o.name]));
    // student_id is set on every SAF Fee Payment (payments_one_target), so the cast narrows it.
    const safFeePayments = await this.db.select({ studentId: sql<string>`${payments.studentId}`, amount: payments.amount, voidedAt: payments.voidedAt }).from(payments).where(eq(payments.semesterId, semesterId));

    const enrichedPayments = paymentRows.map((p) => ({
      id: p.id,
      penaltyId: p.penaltyId,
      amount: p.amount,
      officerName: p.officerId ? officerMap.get(p.officerId) ?? "Officer" : "Officer",
    }));

    return {
      semester: { id: semester.id, name: `${semester.startDate} to ${semester.endDate}`, startDate: semester.startDate, endDate: semester.endDate, closedAt: semester.closedAt },
      students: eligibleStudents,
      events: semesterEvents,
      sessions: sessionRows,
      penalties: penaltyRows,
      payments: enrichedPayments,
      programs: allPrograms.map((p) => p.name),
      safFeeAmount: semester.safFeeAmount,
      safFeePayments,
      asOfTimestamp: asOfTimestamp(),
    };
  }

  // Shared shape between per-semester and financial reports: eligible
  // students, programs, this semester's events/sessions/penalties, and the
  // payments against those penalties (financial additionally needs officerId,
  // so it re-derives paymentRows via this helper rather than reusing a
  // narrower projection).
  private async semesterAggregateRows(semester: { id: string; endDate: string }) {
    const [allStudents, allPrograms, semesterEvents] = await Promise.all([
      this.db.select({ id: students.id, name: students.name, studentId: students.studentId, program: students.program, createdAt: students.createdAt }).from(students),
      this.db.select({ name: programs.name }).from(programs),
      this.db.select({ id: events.id, name: events.name, date: events.date, type: events.type, halfDayPenaltyAmount: events.halfDayPenaltyAmount }).from(events).where(eq(events.semesterId, semester.id)),
    ]);

    const eligibleStudents = allStudents.filter((s) => s.createdAt.toISOString().slice(0, 10) <= semester.endDate);
    const eventIds = semesterEvents.map((e) => e.id);

    const sessionRows = eventIds.length
      ? await this.db.select({ id: attendanceSessions.id, eventId: attendanceSessions.eventId, studentId: attendanceSessions.studentId, half: attendanceSessions.half, timeIn: attendanceSessions.timeIn, timeOut: attendanceSessions.timeOut }).from(attendanceSessions).where(inArray(attendanceSessions.eventId, eventIds))
      : [];

    const eligibleStudentIds = eligibleStudents.map((s) => s.id);
    const penaltyRows = eligibleStudentIds.length
      ? await this.db.select({ id: penalties.id, attendanceSessionId: penalties.attendanceSessionId, studentId: penalties.studentId, amount: penalties.amount }).from(penalties).where(inArray(penalties.studentId, eligibleStudentIds))
      : [];

    const penaltyIds = penaltyRows.map((p) => p.id);
    const paymentRows = penaltyIds.length
      ? await this.db.select({ id: payments.id, penaltyId: sql<string>`${payments.penaltyId}`, amount: payments.amount, officerId: payments.officerId }).from(payments).where(and(inArray(payments.penaltyId, penaltyIds), isNull(payments.voidedAt)))
      : [];

    return { eligibleStudents, allPrograms, semesterEvents, sessionRows, penaltyRows, paymentRows };
  }
}
