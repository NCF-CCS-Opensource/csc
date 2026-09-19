"use server";

import { semesters, students } from "@attendance/db";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiPost, ApiError } from "@/lib/api-client";
import {
  createSemester as createSemesterCommand,
  SemesterLifecycleError,
  updateSemesterDates,
} from "@/lib/semesters";

function fail(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

export async function createSemester(formData: FormData) {
  const governor = await requireGovernor();

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  try {
    await createSemesterCommand(governor, { startDate, endDate });
  } catch (error) {
    if (error instanceof SemesterLifecycleError) fail(error.message);
    throw error;
  }
  redirect("/admin");
}

export async function editSemester(formData: FormData) {
  const governor = await requireGovernor();

  const id = String(formData.get("id") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  try {
    await updateSemesterDates(governor, id, { startDate, endDate });
  } catch (error) {
    if (error instanceof SemesterLifecycleError) fail(error.message);
    throw error;
  }
  redirect("/admin");
}

export async function closeSemester(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  await db.update(semesters).set({ closedAt: new Date() }).where(eq(semesters.id, id));
  redirect("/admin");
}

export async function deleteSemester(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  let failed = false;
  try {
    await db.delete(semesters).where(eq(semesters.id, id));
  } catch {
    failed = true;
  }
  if (failed) fail("Can't delete a Semester that already has Events under it");
  redirect("/admin");
}

export async function addProgram(formData: FormData) {
  await requireGovernor();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) fail("Program name is required");

  try {
    await apiPost("program/create", { name });
  } catch (error) {
    if (error instanceof ApiError) fail(error.message);
    throw error;
  }
  redirect("/admin");
}

export async function removeProgram(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  try {
    await apiPost("program/delete", { id });
  } catch (error) {
    if (error instanceof ApiError) fail(error.message);
    throw error;
  }
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
