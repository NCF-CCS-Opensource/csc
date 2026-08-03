import { attendanceSessions, events, penalties, programs, semesters, students } from "@attendance/db";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildPerEventReportPrompt, generateReportNarrative } from "@/lib/gemini";
import { computePerEventReport, isEventPastInManila } from "@/lib/reports";
import { PerEventPdfDocument } from "@/components/reports/per-event-pdf-document";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireCapability("manage_operations");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: eventId } = await params;

  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (!isEventPastInManila(event.date)) {
    return NextResponse.json(
      { error: "Report generation is only available for past events" },
      { status: 400 },
    );
  }

  const semester = await db.query.semesters.findFirst({
    where: eq(semesters.id, event.semesterId),
  });

  const [allStudents, allPrograms, sessionRows] = await Promise.all([
    db.select({
      id: students.id,
      name: students.name,
      studentId: students.studentId,
      program: students.program,
      createdAt: students.createdAt,
    }).from(students),
    db.select({ name: programs.name }).from(programs),
    db.select({
      id: attendanceSessions.id,
      studentId: attendanceSessions.studentId,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
    }).from(attendanceSessions).where(eq(attendanceSessions.eventId, eventId)),
  ]);

  // Filter students by semester eligibility (createdAt <= semester.endDate)
  const eligibleStudents = semester
    ? allStudents.filter(
        (s) => s.createdAt.toISOString().slice(0, 10) <= semester.endDate,
      )
    : allStudents;

  const sessionIds = sessionRows.map((s) => s.id);
  const penaltyRows =
    sessionIds.length > 0
      ? await db
          .select({
            id: penalties.id,
            attendanceSessionId: penalties.attendanceSessionId,
            studentId: penalties.studentId,
            amount: penalties.amount,
          })
          .from(penalties)
          .where(inArray(penalties.attendanceSessionId, sessionIds))
      : [];

  const semesterName = semester
    ? `${semester.startDate} to ${semester.endDate}`
    : "Semester";

  const reportData = computePerEventReport({
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
  });

  const prompt = buildPerEventReportPrompt(reportData);
  const aiNarrative = await generateReportNarrative(prompt);
  reportData.aiNarrative = aiNarrative;

  const pdfBuffer = await renderToBuffer(
    PerEventPdfDocument({ data: reportData }) as any,
  );

  const filename = `${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.pdf`;

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-AI-Narrative-Status": aiNarrative ? "generated" : "unavailable",
  };

  return new NextResponse(new Uint8Array(pdfBuffer), { headers });


}
