import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { hasStudentRecord } from "./lib/auth";

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
  if (!(await hasStudentRecord(userId))) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
