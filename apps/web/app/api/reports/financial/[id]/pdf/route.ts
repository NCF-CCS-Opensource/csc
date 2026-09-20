import type { FinancialReportData } from "@attendance/contracts";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { buildFinancialReportPrompt, generateReportNarrative } from "@/lib/gemini";
import { FinancialPdfDocument } from "@/components/reports/financial-pdf-document";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: semesterId } = await params;

  let reportData: FinancialReportData;
  try {
    reportData = await apiFetch<FinancialReportData>("/v1/api/report/financial", { semesterId });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const prompt = buildFinancialReportPrompt(reportData);
  const aiNarrative = await generateReportNarrative(prompt);
  reportData.aiNarrative = aiNarrative;

  const pdfBuffer = await renderToBuffer(
    FinancialPdfDocument({ data: reportData }) as React.ReactElement<DocumentProps>,
  );

  const filename = `financial-report-${reportData.semester.startDate}-to-${reportData.semester.endDate}.pdf`;

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-AI-Narrative-Status": aiNarrative ? "generated" : "unavailable",
  };

  return new NextResponse(new Uint8Array(pdfBuffer), { headers });
}
