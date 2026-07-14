import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "./db";
import { createClient } from "./supabase/server";

export async function getCurrentStudent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (await db.query.students.findFirst({
    where: eq(students.authUserId, user.id),
  })) ?? null;
}

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
