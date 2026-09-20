import type { PerEventReportData } from "@attendance/contracts";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import { buildPerEventReportPrompt, generateReportNarrative } from "@/lib/gemini";
import { PerEventPdfDocument } from "@/components/reports/per-event-pdf-document";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;

  let reportData: PerEventReportData;
  try {
    reportData = await apiFetch<PerEventReportData>("/v1/api/report/per-event", { eventId });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const prompt = buildPerEventReportPrompt(reportData);
  const aiNarrative = await generateReportNarrative(prompt);
  reportData.aiNarrative = aiNarrative;

  const pdfBuffer = await renderToBuffer(
    PerEventPdfDocument({ data: reportData }) as React.ReactElement<DocumentProps>,
  );

  const filename = `${reportData.event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.pdf`;

  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-AI-Narrative-Status": aiNarrative ? "generated" : "unavailable",
  };

  return new NextResponse(new Uint8Array(pdfBuffer), { headers });
}
