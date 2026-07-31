import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import {
  applyScanDecision,
  ScanApprovalError,
} from "@/lib/scan-approval";

function errorResponse(error: ScanApprovalError) {
  const status =
    error.message === "Event not found"
      ? 404
      : error.message.includes("conflicts")
        ? 409
        : error.message === "Invalid request"
          ? 400
          : 422;
  return NextResponse.json({ error: error.message }, { status });
}

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "use_mobile_booth");
  if (!authorization.ok) return authorization.response;

  const body = (await request.json()) as {
    scanId?: string;
    eventId?: string;
    mode?: string;
    qrPayload?: string;
    scannedAt?: string;
  };
  if (
    !body.scanId ||
    !body.eventId ||
    !body.mode ||
    !body.qrPayload ||
    !body.scannedAt
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await applyScanDecision(authorization.actor, {
        scanId: body.scanId,
        type: "approve",
        eventId: body.eventId,
        mode: body.mode,
        qrPayload: body.qrPayload,
        scannedAt: body.scannedAt,
      }),
    );
  } catch (error) {
    if (error instanceof ScanApprovalError) return errorResponse(error);
    throw error;
  }
}
