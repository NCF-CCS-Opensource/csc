import { students } from "@attendance/db";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "./lib/db";

// Coarse redirect gate only — never the authorization mechanism. Every
// destination still runs its own check (ADR-0005): this decides where an
// unusable session gets sent, not what a usable one may do.
const isAppRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/events(.*)",
  "/my-attendance(.*)",
  "/clearance(.*)",
  "/admin(.*)",
  "/analytics(.*)",
]);

export const proxy = clerkMiddleware(async (auth, request) => {
  if (!isAppRoute(request)) return;

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // ponytail: one indexed lookup per app navigation. Move to a Clerk session
  // claim set at onboarding if this ever shows up in navigation latency.
  const student = await db.query.students.findFirst({
    columns: { id: true },
    where: eq(students.authUserId, userId),
  });
  if (!student) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
});
