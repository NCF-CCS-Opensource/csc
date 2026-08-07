import { attendanceSessions, events, payments, penalties, semesters, students } from "@attendance/db";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildPerStudentReportPrompt, generateReportNarrative } from "@/lib/gemini";
import { currentCampusDate } from "@/lib/ledger";
import { computePerStudentReport } from "@/lib/reports";
import { PerStudentPdfDocument } from "@/components/reports/per-student-pdf-document";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireCapability("manage_operations");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: studentId } = await params;
  const { searchParams } = new URL(request.url);
  const semesterId = searchParams.get("semesterId");

  if (!semesterId) {
    return NextResponse.json({ error: "Semester ID is required" }, { status: 400 });
  }

  const student = await db.query.students.findFirst({
    where: eq(students.id, studentId),
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const semester = await db.query.semesters.findFirst({
    where: eq(semesters.id, semesterId),
  });

  if (!semester) {
    return NextResponse.json({ error: "Semester not found" }, { status: 404 });
  }

  const semesterEvents = await db
    .select({
      id: events.id,
      name: events.name,
      date: events.date,
      type: events.type,
      halfDayPenaltyAmount: events.halfDayPenaltyAmount,
    })
    .from(events)
    .where(eq(events.semesterId, semesterId));

  const eventIds = semesterEvents.map((e) => e.id);

  const studentSessions =
    eventIds.length > 0
      ? await db
          .select({
            id: attendanceSessions.id,
            eventId: attendanceSessions.eventId,
            half: attendanceSessions.half,
            timeIn: attendanceSessions.timeIn,
            timeOut: attendanceSessions.timeOut,
          })
          .from(attendanceSessions)
          .where(
            eq(attendanceSessions.studentId, studentId),
          )
      : [];

  const filteredSessions = studentSessions.filter((s) => eventIds.includes(s.eventId));

  const studentPenalties = await db
    .select({
      id: penalties.id,
      attendanceSessionId: penalties.attendanceSessionId,
      studentId: penalties.studentId,
      amount: penalties.amount,
    })
    .from(penalties)
    .where(eq(penalties.studentId, studentId));

  const penaltyIds = studentPenalties.map((p) => p.id);
  const studentPayments =
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

  const reportData = computePerStudentReport({
    student: {
      id: student.id,
      name: student.name,
      studentId: student.studentId,
      program: student.program,
    },
    semesterName,
    events: semesterEvents,
    sessions: filteredSessions,
    penalties: studentPenalties,
    payments: studentPayments,
    asOfTimestamp,
  });

  const prompt = buildPerStudentReportPrompt(reportData);
  const aiNarrative = await generateReportNarrative(prompt);
  reportData.aiNarrative = aiNarrative;

  const pdfBuffer = await renderToBuffer(
    PerStudentPdfDocument({ data: reportData }) as React.ReactElement<DocumentProps>,
  );

  const filename = `${student.studentId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-per-student-report.pdf`;

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-AI-Narrative-Status": aiNarrative ? "generated" : "unavailable",
  };

  return new NextResponse(new Uint8Array(pdfBuffer), { headers });
}
