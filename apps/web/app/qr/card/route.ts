import { NextResponse } from "next/server";
import { buildQrCardModels, resolveOwnQrSubject } from "@/lib/qr";
import { renderQrCardPdf } from "@/components/reports/qr-card-pdf-document";

// Self-scoped, sibling to /qr: any Student may fetch their own card, no
// capability beyond having a Student record. Bulk (by-id, manage_operations)
// is a separate route — out of scope here (spec #116).
export async function GET() {
  const resolved = await resolveOwnQrSubject();
  if ("status" in resolved) {
    return new NextResponse(resolved.status === 404 ? "Not found" : "Not signed in", {
      status: resolved.status,
    });
  }

  const [card] = await buildQrCardModels([resolved.subject]);
  const pdfBuffer = await renderQrCardPdf([card]);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="qr-card.pdf"',
    },
  });
}
