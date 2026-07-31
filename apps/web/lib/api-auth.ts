import { students } from "@attendance/db";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "./db";
import { capabilityFailure, type Capability } from "./roles";

// Mobile (apps/mobile) has no cookies to send — it authenticates API routes
// with an `Authorization: Bearer <access_token>` header instead.
export async function getUserFromBearer(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
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
