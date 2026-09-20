"use server";

import { semesters, students } from "@attendance/db";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiPost, ApiError } from "@/lib/api-client";

function fail(message: string): never {
  redirect(`/admin?error=${encodeURIComponent(message)}`);
}

export async function createSemester(formData: FormData) {
  await requireGovernor();

  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  try {
    await apiPost("semester/create", { startDate, endDate });
  } catch (error) {
    if (error instanceof ApiError) fail(error.message);
    throw error;
  }
  redirect("/admin");
}

export async function editSemester(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");

  try {
    await apiPost("semester/update", { id, startDate, endDate });
  } catch (error) {
    if (error instanceof ApiError) fail(error.message);
    throw error;
  }
  redirect("/admin");
}

export async function closeSemester(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  try {
    await apiPost("semester/close", { id });
  } catch (error) {
    if (error instanceof ApiError) fail(error.message);
    throw error;
  }
  redirect("/admin");
}

// ponytail-gap: no semester/delete endpoint exists on the API yet (only
// create/update/close/current) — issue #169 assumed every screen already had
// an API-side equivalent, but this one doesn't. Left on direct DB access
// until that endpoint is added; see the PR description's Known Gaps section.
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

// ponytail-gap: no student/promote endpoint exists on the API yet — same
// situation as deleteSemester above.
export async function promoteToOfficer(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  await db
    .update(students)
    .set({ role: "officer" })
    .where(and(eq(students.id, id), eq(students.role, "student")));
  redirect("/admin");
}
