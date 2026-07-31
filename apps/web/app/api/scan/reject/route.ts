import { NextResponse } from "next/server";
import { authorizeRequest } from "@/lib/api-auth";
import {
  applyScanDecision,
  ScanApprovalError,
} from "@/lib/scan-approval";

export async function POST(request: Request) {
  const authorization = await authorizeRequest(request, "use_mobile_booth");
  if (!authorization.ok) return authorization.response;

  const body = (await request.json()) as {
    scanId?: string;
    eventId?: string;
    qrPayload?: string;
    scannedAt?: string;
  };
  if (!body.scanId || !body.eventId || !body.qrPayload || !body.scannedAt) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    return NextResponse.json(
      await applyScanDecision(authorization.actor, {
        scanId: body.scanId,
        type: "reject",
        eventId: body.eventId,
        qrPayload: body.qrPayload,
        scannedAt: body.scannedAt,
      }),
    );
  } catch (error) {
    if (error instanceof ScanApprovalError) {
      const status = error.message.includes("conflicts")
        ? 409
        : error.message === "Event not found"
          ? 404
          : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    throw error;
  }
}
