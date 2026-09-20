import type { PerSemesterReportData } from "@attendance/contracts";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { buildPerSemesterReportPrompt, generateReportNarrative } from "@/lib/gemini";
import { PerSemesterPdfDocument } from "@/components/reports/per-semester-pdf-document";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: semesterId } = await params;

  let reportData: PerSemesterReportData;
  try {
    reportData = await apiFetch<PerSemesterReportData>("/v1/api/report/per-semester", { semesterId });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const prompt = buildPerSemesterReportPrompt(reportData);
  const aiNarrative = await generateReportNarrative(prompt);
  reportData.aiNarrative = aiNarrative;

  const pdfBuffer = await renderToBuffer(
    PerSemesterPdfDocument({ data: reportData }) as React.ReactElement<DocumentProps>,
  );

  const filename = `per-semester-report-${reportData.semester.startDate}-to-${reportData.semester.endDate}.pdf`;

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-AI-Narrative-Status": aiNarrative ? "generated" : "unavailable",
  };

  return new NextResponse(new Uint8Array(pdfBuffer), { headers });
}
