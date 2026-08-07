import { auth } from "@clerk/nextjs/server";
import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateQrPngBuffer } from "@/lib/qr";

export async function GET() {
  const { userId } = await auth();

  if (!userId) return new NextResponse("Not signed in", { status: 401 });

  const student = await db.query.students.findFirst({
    where: eq(students.authUserId, userId),
  });

  if (!student) return new NextResponse("Not found", { status: 404 });

  const png = await generateQrPngBuffer(student);

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'inline; filename="attendance-qr.png"',
    },
  });
}
