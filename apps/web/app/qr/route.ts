import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentStudent } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr";

// ponytail-gap: same as /qr/card — IdentityResponse has no `program`, so a
// direct DB lookup fills it in until the API exposes it (see PR
// description's Known Gaps section).
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

  const png = await generateQrPngBuffer(record);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="attendance-qr.png"',
    },
  });
}
