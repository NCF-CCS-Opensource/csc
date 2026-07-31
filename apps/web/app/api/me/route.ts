import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "use_mobile_booth");
  if (!authorization.ok) return authorization.response;
  return NextResponse.json({ student: authorization.actor });
}
