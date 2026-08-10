import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { getCurrentStudent } from "@/lib/auth";
import { buildQrCardModels } from "@/lib/qr";
import { QrCardPdfDocument } from "@/components/reports/qr-card-pdf-document";

// Self-scoped, sibling to /qr: any Student may fetch their own card, no
// capability beyond having a Student record. Bulk (by-id, manage_operations)
// is a separate route — out of scope here (spec #116).
export async function GET() {
  const student = await getCurrentStudent();

  if (!student) {
    // Distinguish a stranger from a signed-in Pending Student, same as
    // requireCapability (lib/auth.ts) — getCurrentStudent collapses both to
    // null, so a second auth() call recovers which one this is.
    const { userId } = await auth();
    return new NextResponse(userId ? "Not found" : "Not signed in", {
      status: userId ? 404 : 401,
    });
  }

  const [card] = await buildQrCardModels([student]);
  const pdfBuffer = await renderToBuffer(
    QrCardPdfDocument({ cards: [card] }) as React.ReactElement<DocumentProps>,
  );

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="qr-card.pdf"',
    },
  });
}
