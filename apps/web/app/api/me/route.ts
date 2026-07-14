import { NextResponse } from "next/server";
import { getStudentFromRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const student = await getStudentFromRequest(request);
  if (!student) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ student });
}
