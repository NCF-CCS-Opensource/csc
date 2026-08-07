import { verifyToken } from "@clerk/nextjs/server";
import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "./db";
import { capabilityFailure, type Capability } from "./roles";

// Mobile (apps/mobile) has no cookies to send — it authenticates API routes
// with an `Authorization: Bearer <clerk session token>` header instead.
export async function getUserFromBearer(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;

  try {
    const claims = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    return { id: claims.sub };
  } catch {
    // Expired, tampered with, or signed by another instance — all "not you".
    return null;
  }
}

export async function authorizeRequest(
  request: Request,
  capability: Capability,
) {
  const user = await getUserFromBearer(request);
  const actor = user
    ? await db.query.students.findFirst({
        where: eq(students.authUserId, user.id),
      })
    : null;
  const failure = capabilityFailure(actor?.role ?? null, capability);
  if (failure || !actor) {
    const denied = failure ?? "unauthenticated";
    const status = denied === "unauthenticated" ? 401 : 403;
    const error =
      denied === "unauthenticated"
        ? "Authentication required"
        : capability === "use_mobile_booth"
          ? "Mobile booth access requires an Officer or Governor account"
          : "Forbidden";
    return {
      ok: false as const,
      response: NextResponse.json({ error }, { status }),
    };
  }

  return { ok: true as const, actor };
}
