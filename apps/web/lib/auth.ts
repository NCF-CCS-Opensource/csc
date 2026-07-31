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
import { createClient } from "./supabase/server";

export const getCurrentStudent = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (await db.query.students.findFirst({
    where: eq(students.authUserId, user.id),
  })) ?? null;
});

export type Identity = Pick<
  NonNullable<Awaited<ReturnType<typeof getCurrentStudent>>>,
  "name" | "email" | "role"
>;

export async function requireCapability(capability: Capability) {
  const student = await getCurrentStudent();
  const failure = capabilityFailure(student?.role ?? null, capability);
  if (!student || failure === "unauthenticated") redirect("/login");
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
