import { auth } from "@clerk/nextjs/server";
import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import {
  capabilityFailure,
  dashboardDestination,
  type Capability,
} from "./roles";

// Clerk answers only *who* this is (ADR-0012). The role — and therefore every
// authorization decision below — still comes from the students row.
export const getCurrentStudent = cache(async () => {
  const { userId } = await auth();

  if (!userId) return null;

  return (await db.query.students.findFirst({
    where: eq(students.authUserId, userId),
  })) ?? null;
});

export type Identity = Pick<
  NonNullable<Awaited<ReturnType<typeof getCurrentStudent>>>,
  "name" | "email" | "role"
>;

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
