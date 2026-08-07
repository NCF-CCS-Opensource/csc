import { attendanceSessions, events, payments, penalties, programs, semesters, students } from "@attendance/db";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildPerSemesterReportPrompt, generateReportNarrative } from "@/lib/gemini";
import { currentCampusDate } from "@/lib/ledger";
import { computePerSemesterReport } from "@/lib/reports";
import { PerSemesterPdfDocument } from "@/components/reports/per-semester-pdf-document";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireCapability("manage_operations");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: semesterId } = await params;

  const semester = await db.query.semesters.findFirst({
    where: eq(semesters.id, semesterId),
  });

  if (!semester) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 });
  }

  const [allStudents, allPrograms, semesterEvents] = await Promise.all([
    db.select({
      id: students.id,
      name: students.name,
      studentId: students.studentId,
      program: students.program,
      createdAt: students.createdAt,
    }).from(students),
    db.select({ name: programs.name }).from(programs),
    db.select({
      id: events.id,
      name: events.name,
      date: events.date,
      type: events.type,
      halfDayPenaltyAmount: events.halfDayPenaltyAmount,
    }).from(events).where(eq(events.semesterId, semesterId)),
  ]);

  const eligibleStudents = allStudents.filter(
    (s) => s.createdAt.toISOString().slice(0, 10) <= semester.endDate,
  );

  const eventIds = semesterEvents.map((e) => e.id);

  const sessionRows =
    eventIds.length > 0
      ? await db
          .select({
            id: attendanceSessions.id,
            eventId: attendanceSessions.eventId,
            studentId: attendanceSessions.studentId,
            half: attendanceSessions.half,
            timeIn: attendanceSessions.timeIn,
            timeOut: attendanceSessions.timeOut,
          })
          .from(attendanceSessions)
          .where(inArray(attendanceSessions.eventId, eventIds))
      : [];

  const eligibleStudentIds = eligibleStudents.map((s) => s.id);
  const penaltyRows =
    eligibleStudentIds.length > 0
      ? await db
          .select({
            id: penalties.id,
            attendanceSessionId: penalties.attendanceSessionId,
            studentId: penalties.studentId,
            amount: penalties.amount,
          })
          .from(penalties)
          .where(inArray(penalties.studentId, eligibleStudentIds))
      : [];

  const penaltyIds = penaltyRows.map((p) => p.id);
  const paymentRows =
    penaltyIds.length > 0
      ? await db
          .select({
            id: payments.id,
            penaltyId: payments.penaltyId,
            amount: payments.amount,
          })
          .from(payments)
          .where(inArray(payments.penaltyId, penaltyIds))
      : [];

  const semesterName = `${semester.startDate} to ${semester.endDate}`;
  const asOfTimestamp = `${currentCampusDate()} ${new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour12: false })}`;

  const reportData = computePerSemesterReport({
    semester: {
      id: semester.id,
      name: semesterName,
      startDate: semester.startDate,
      endDate: semester.endDate,
      closedAt: semester.closedAt,
    },
    students: eligibleStudents,
    events: semesterEvents,
    sessions: sessionRows,
    penalties: penaltyRows,
    payments: paymentRows,
    programs: allPrograms.map((p) => p.name),
    asOfTimestamp,
  });

  const prompt = buildPerSemesterReportPrompt(reportData);
  const aiNarrative = await generateReportNarrative(prompt);
  reportData.aiNarrative = aiNarrative;

  const pdfBuffer = await renderToBuffer(
    PerSemesterPdfDocument({ data: reportData }) as React.ReactElement<DocumentProps>,
  );

  const filename = `per-semester-report-${semester.startDate}-to-${semester.endDate}.pdf`;

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-AI-Narrative-Status": aiNarrative ? "generated" : "unavailable",
  };

  return new NextResponse(new Uint8Array(pdfBuffer), { headers });
}
