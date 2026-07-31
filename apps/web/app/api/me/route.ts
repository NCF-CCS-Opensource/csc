import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "use_mobile_booth");
  if (!authorization.ok) {
    return NextResponse.json(
      { error: authorization.error },
      { status: authorization.status },
    );
  }
  return NextResponse.json({ student: authorization.actor });
}
