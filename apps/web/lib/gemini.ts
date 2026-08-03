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

export function buildPerStudentReportPrompt(data: import("./reports").PerStudentReportData): string {
  const { student, semesterName, standing, clearanceStatus } = data;

  return `
You are an institutional report analyst for Naga College Foundation Inc. College of Computer Studies.
Summarize the attendance standing and clearance readiness for a student in ${semesterName}. Refer to the student generically as "this student" or "the student". Do NOT mention any student names or IDs.

Aggregate Standing:
- Program: ${student.program}
- Total Events in Semester: ${standing.totalEvents}
- Attendance Rate: ${standing.attendanceRate.toFixed(1)}%
- Total Sessions Attended: ${standing.sessionsAttended}
- Total Sessions Absent: ${standing.sessionsAbsent}
- Total Penalties Charged: ₱${standing.totalPenaltiesCharged.toFixed(2)}
- Total Payments Made: ₱${standing.totalPaymentsMade.toFixed(2)}
- Outstanding Balance: ₱${standing.outstandingBalance.toFixed(2)}
- Clearance Status: ${clearanceStatus}
`.trim();
}

export function buildPerSemesterReportPrompt(data: import("./reports").PerSemesterReportData): string {
  const { semester, overall, programBreakdown, eventSummary, clearanceReadiness } = data;

  const progText = programBreakdown
    .map(
      (pb) =>
        `- ${pb.program}: ${pb.studentCount} students, ${pb.attendanceRate.toFixed(1)}% rate, ₱${pb.totalPenalties.toFixed(2)} penalties, ₱${pb.totalPaid.toFixed(2)} paid, ₱${pb.outstanding.toFixed(2)} outstanding`,
    )
    .join("\n");

  const evText = eventSummary
    .map((ev) => `- ${ev.name} (${ev.date}): ${ev.attendanceRate.toFixed(1)}% rate, ₱${ev.penaltiesGenerated.toFixed(2)} penalties`)
    .join("\n");

  const clearanceText = clearanceReadiness
    .map((c) => `- ${c.program}: ${c.clearedCount} cleared, ${c.notClearedCount} not cleared`)
    .join("\n");

  return `
You are an institutional report analyst for Naga College Foundation Inc. College of Computer Studies.
Analyze cross-semester attendance trends, program comparisons, event attendance patterns, and clearance readiness for ${semester.name}.
Do NOT mention individual student names or IDs. Use only the provided aggregate figures.

Overall Semester Statistics:
- Total Registered Students: ${overall.totalRegisteredStudents}
- Total Events: ${overall.totalEvents}
- Overall Attendance Rate: ${overall.overallAttendanceRate.toFixed(1)}%
- Total Penalties Charged: ₱${overall.totalPenaltiesCharged.toFixed(2)}
- Total Payments Collected: ₱${overall.totalCollected.toFixed(2)}
- Total Outstanding Balance: ₱${overall.totalOutstanding.toFixed(2)}

Program Breakdown:
${progText}

Event Summary:
${evText}

Clearance Readiness:
${clearanceText}
`.trim();
}

export function buildFinancialReportPrompt(data: import("./reports").FinancialReportData): string {
  const { semester, overview, programBreakdown, eventBreakdown, paymentLogSummary } = data;

  const progText = programBreakdown
    .map(
      (pb) =>
        `- ${pb.program}: ₱${pb.totalPenalties.toFixed(2)} penalties, ₱${pb.totalCollected.toFixed(2)} collected, ₱${pb.outstanding.toFixed(2)} outstanding, ${pb.collectionRate.toFixed(1)}% collection rate`,
    )
    .join("\n");

  const evText = eventBreakdown
    .map(
      (ev) =>
        `- ${ev.name}: ₱${ev.penaltiesGenerated.toFixed(2)} generated, ₱${ev.amountCollected.toFixed(2)} collected, ₱${ev.outstanding.toFixed(2)} outstanding`,
    )
    .join("\n");

  return `
You are an institutional report analyst for Naga College Foundation Inc. College of Computer Studies.
Analyze the financial picture of penalty generation, payment collections, collection rates, and outstanding balances for ${semester.name}.
Do NOT mention individual student names or IDs. Use only the provided aggregate figures.

Financial Overview:
- Total Penalties Charged: ₱${overview.totalPenaltiesCharged.toFixed(2)}
- Total Payments Collected: ₱${overview.totalPaymentsCollected.toFixed(2)}
- Total Outstanding Balance: ₱${overview.totalOutstandingBalance.toFixed(2)}
- Collection Rate: ${overview.collectionRate.toFixed(1)}%

Program Financial Breakdown:
${progText}

Event Financial Breakdown:
${evText}

Payment Log Summary:
- Total Transactions: ${paymentLogSummary.totalTransactions}
- Date Range: ${paymentLogSummary.dateRange}
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
