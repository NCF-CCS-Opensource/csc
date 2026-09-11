import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import { listOfficerRejections } from "@/lib/rejections";

export async function GET(request: Request) {
  const authorization = await authorizeRequest(request, "manage_operations");
  if (!authorization.ok) return authorization.response;
  return NextResponse.json({
    rejections: await listOfficerRejections(authorization.actor.id),
  });
}
