import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildQrCardModels } from "@/lib/qr";
import { renderQrCardPdf } from "@/components/reports/qr-card-pdf-document";

// Self-scoped, sibling to /qr: any Student may fetch their own card, no
// capability beyond having a Student record. Bulk (by-id, manage_operations)
// is a separate route — out of scope here (spec #116).
//
// ponytail-gap: IdentityResponse (getCurrentStudent) carries no `program`,
// which the QR payload needs — a direct DB lookup fills that one field until
// the API exposes it. See the PR description's Known Gaps section.
export async function GET() {
  const identity = await getCurrentStudent();

  if (!identity) {
    // Distinguish a stranger from a signed-in Pending Student, same as
    // requireCapability (lib/auth.ts) — getCurrentStudent collapses both to
    // null, so a second auth() call recovers which one this is.
    const { userId } = await auth();
    return new NextResponse(userId ? "Not found" : "Not signed in", {
      status: userId ? 404 : 401,
    });
  }

  const record = await db.query.students.findFirst({
    where: eq(students.authUserId, identity.authUserId),
  });
  if (!record) return new NextResponse("Not found", { status: 404 });

  const [card] = await buildQrCardModels([record]);
  const pdfBuffer = await renderQrCardPdf([card]);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="qr-card.pdf"',
    },
  });
}
