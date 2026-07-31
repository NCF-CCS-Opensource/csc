import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import {
  identifyScanStudent,
  ScanApprovalError,
} from "@/lib/scan-approval";

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "use_mobile_booth");
  if (!authorization.ok) return authorization.response;

  const { qrPayload } = (await request.json()) as { qrPayload?: string };
  if (!qrPayload) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const result = await identifyScanStudent(
      authorization.actor,
      qrPayload,
    );
    return "error" in result
      ? NextResponse.json(result, { status: 422 })
      : NextResponse.json(result);
  } catch (error) {
    if (error instanceof ScanApprovalError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}
