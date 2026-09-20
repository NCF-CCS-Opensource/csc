import type { PerStudentReportData } from "@attendance/contracts";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { buildPerStudentReportPrompt, generateReportNarrative } from "@/lib/gemini";
import { PerStudentPdfDocument } from "@/components/reports/per-student-pdf-document";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: studentId } = await params;
  const { searchParams } = new URL(request.url);
  const semesterId = searchParams.get("semesterId");

  if (!semesterId) {
    return NextResponse.json({ error: "Semester ID is required" }, { status: 400 });
  }

  let reportData: PerStudentReportData;
  try {
    reportData = await apiFetch<PerStudentReportData>("/v1/api/report/per-student", { studentId, semesterId });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const prompt = buildPerStudentReportPrompt(reportData);
  const aiNarrative = await generateReportNarrative(prompt);
  reportData.aiNarrative = aiNarrative;

  const pdfBuffer = await renderToBuffer(
    PerStudentPdfDocument({ data: reportData }) as React.ReactElement<DocumentProps>,
  );

  const filename = `${reportData.student.studentId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-per-student-report.pdf`;

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-AI-Narrative-Status": aiNarrative ? "generated" : "unavailable",
  };

  return new NextResponse(new Uint8Array(pdfBuffer), { headers });
}
