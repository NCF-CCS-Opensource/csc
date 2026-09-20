import { NextResponse } from "next/server";
import { generateQrPngBuffer, resolveOwnQrSubject } from "@/lib/qr";

export async function GET() {
  const resolved = await resolveOwnQrSubject();
  if ("status" in resolved) {
    return new NextResponse(resolved.status === 404 ? "Not found" : "Not signed in", {
      status: resolved.status,
    });
  }

  const png = await generateQrPngBuffer(resolved.subject);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="attendance-qr.png"',
    },
  });
}
