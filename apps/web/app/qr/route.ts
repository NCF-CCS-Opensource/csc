import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/auth";
import { generateQrPngBuffer } from "@/lib/qr";

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

  const png = await generateQrPngBuffer(student);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="attendance-qr.png"',
    },
  });
}
