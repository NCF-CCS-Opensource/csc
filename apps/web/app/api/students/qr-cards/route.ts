import { students } from "@attendance/db";
import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireCapability } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildQrCardModels } from "@/lib/qr";
import { renderQrCardPdf } from "@/components/reports/qr-card-pdf-document";

// ponytail: 60s covers the ~10s-locally / slower-serverless case (spec #119)
// without assuming a Pro/Fluid plan's longer ceiling. Raise if a full-roster
// run times out on the deployment target.
export const maxDuration = 60;

// Bulk sibling to /qr/card (self-scoped): Student ids arrive in a POST body,
// not a query string, so a full-roster selection (~600 ids) can't exceed URL
// limits. requireCapability redirects on a page; here that redirect throws
// and is turned into a 403, same as the report routes (spec #119, #115).
export async function POST(request: Request) {
  try {
    await requireCapability("manage_operations");
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const studentIds = body?.studentIds;

  if (
    !Array.isArray(studentIds) ||
    studentIds.length === 0 ||
    !studentIds.every((id) => typeof id === "string")
  ) {
    return NextResponse.json(
      { error: "studentIds must be a non-empty array of strings" },
      { status: 400 },
    );
  }

  const rows = await db
    .select({
      name: students.name,
      studentId: students.studentId,
      program: students.program,
    })
    .from(students)
    .where(inArray(students.id, studentIds));

  // ids that don't resolve to a row (stale selection, tampered body) are
  // silently dropped above; if none resolved, don't hand back a blank page.
  if (rows.length === 0) {
    return NextResponse.json({ error: "No matching students" }, { status: 400 });
  }

  const cards = await buildQrCardModels(rows);
  const pdfBuffer = await renderQrCardPdf(cards);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="qr-cards.pdf"',
    },
  });
}
