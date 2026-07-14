import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
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

export async function requireGovernor() {
  const student = await getCurrentStudent();
  if (!student || student.role !== "governor") redirect("/");
  return student;
}

export async function requireOfficerOrGovernor() {
  const student = await getCurrentStudent();
  if (!student || (student.role !== "officer" && student.role !== "governor")) {
    redirect("/");
  }
  return student;
}
