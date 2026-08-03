import { GoogleGenerativeAI } from "@google/generative-ai";
import type { PerEventReportData } from "./reports";

export function buildPerEventReportPrompt(data: PerEventReportData): string {
  const { event, summary, programBreakdowns, totalPenalties } = data;

  const programText = programBreakdowns
    .map(
      (pb) =>
        `- ${pb.program}: ${pb.totalStudents} students, ${pb.presentHalves} present halves, ${pb.absentHalves} absent halves, ${pb.rate.toFixed(1)}% attendance rate`,
    )
    .join("\n");

  return `
You are an institutional report analyst for Nagas College Foundation Inc. College of Computer Studies.
Analyze the following aggregate attendance data for an institutional event and write a concise, professional, 2-3 paragraph summary focusing on overall participation trends, program-level comparisons, and financial penalty implications.

Do NOT mention individual student names or IDs. Use only the provided aggregate figures.

Event Details:
- Name: ${event.name}
- Semester: ${event.semesterName}
- Date: ${event.date}
- Type: ${event.type === "whole_day" ? "Whole Day" : "Half Day"}
- Venue: ${event.venue || "N/A"}

Aggregate Statistics:
- Total Students Expected: ${summary.totalStudents}
- Overall Attendance Rate: ${summary.attendanceRate.toFixed(1)}%
- Present Halves: ${summary.presentHalves}
- Incomplete Halves: ${summary.incompleteHalves}
- Absent Halves: ${summary.absentHalves}
- Total Penalties Generated: ₱${totalPenalties.toFixed(2)}

Program Breakdown:
${programText}
`.trim();
}

export async function generateReportNarrative(prompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text || null;
  } catch (err) {
    console.error("Gemini API narrative generation failed:", err);
    return null;
  }
}
