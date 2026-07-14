"use server";

import { programs, semesters, students } from "@attendance/db";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { validateSemesterDates } from "@/lib/semesters";

function fail(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

export async function createSemester(formData: FormData) {
  await requireGovernor();

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  const errors = validateSemesterDates(startDate, endDate);
  if (errors.length > 0) fail(errors[0].message);

  const open = await db.query.semesters.findFirst({
    where: isNull(semesters.closedAt),
  });
  if (open) fail("Close the current semester before opening a new one");

  await db.insert(semesters).values({ startDate, endDate });
  redirect("/admin");
}

export async function editSemester(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  const errors = validateSemesterDates(startDate, endDate);
  if (errors.length > 0) fail(errors[0].message);

  await db.update(semesters).set({ startDate, endDate }).where(eq(semesters.id, id));
  redirect("/admin");
}

export async function closeSemester(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  await db.update(semesters).set({ closedAt: new Date() }).where(eq(semesters.id, id));
  redirect("/admin");
}

export async function addProgram(formData: FormData) {
  await requireGovernor();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) fail("Program name is required");

  let failed = false;
  try {
    await db.insert(programs).values({ name });
  } catch {
    failed = true;
  }
  if (failed) fail("That Program already exists");
  redirect("/admin");
}

export async function removeProgram(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  let failed = false;
  try {
    await db.delete(programs).where(eq(programs.id, id));
  } catch {
    failed = true;
  }
  if (failed) fail("Can't remove a Program students are already registered under");
  redirect("/admin");
}

export async function promoteToOfficer(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  await db
    .update(students)
    .set({ role: "officer" })
    .where(and(eq(students.id, id), eq(students.role, "student")));
  redirect("/admin");
}
