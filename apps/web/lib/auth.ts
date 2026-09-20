import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { IdentityResponse } from "@attendance/contracts";
import { apiFetch, ApiError } from "./api-client";
import {
  capabilityFailure,
  dashboardDestination,
  type Capability,
} from "./roles";

// Clerk answers only *who* this is (ADR-0012). The role — and therefore every
// authorization decision below — comes from the API's student/identity
// endpoint (apps/web has no database access, ADR-0019).
export const getCurrentStudent = cache(async (): Promise<IdentityResponse | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    return await apiFetch<IdentityResponse>("/v1/api/student/identity");
  } catch (error) {
    // AuthGuard collapses "no session" and "signed in, no Student row yet"
    // (a Pending Student) to the same 401 — both mean null here.
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});

// Signed in but not yet a Student (a Pending Student, ADR-0012). Takes a
// caller-minted token, not an authUserId: proxy.ts (Next middleware) has no
// request-scoped auth() context, so it mints its own token and passes it.
export async function hasStudentRecord(token: string | null): Promise<boolean> {
  if (!token) return false;
  const base = (process.env.API_BASE_URL ?? "http://127.0.0.1:3001").replace(/\/$/, "");
  const response = await fetch(`${base}/v1/api/student/identity`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: "{}",
    cache: "no-store",
  });
  return response.ok;
}

export type Identity = Pick<IdentityResponse, "name" | "email" | "role">;

export async function requireCapability(capability: Capability) {
  const student = await getCurrentStudent();
  const failure = capabilityFailure(student?.role ?? null, capability);
  if (!student || failure === "unauthenticated") {
    // Signed in with no students row is a Pending Student, not a stranger.
    const { userId } = await auth();
    redirect(userId ? "/onboarding" : "/sign-in");
  }
  if (failure === "forbidden") {
    redirect(dashboardDestination(student.role));
  }
  return student;
}

export async function requireGovernor() {
  return requireCapability("administer");
}

export async function requireOfficerOrGovernor() {
  return requireCapability("manage_operations");
}
