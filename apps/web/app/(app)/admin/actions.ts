"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { requireGovernor } from "@/lib/auth";
import { apiPost, ApiError } from "@/lib/api-client";
import { OPEN_SEMESTER_CACHE_TAG } from "@/lib/queries/open-semester.query-key";

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
  updateTag(OPEN_SEMESTER_CACHE_TAG);
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
  updateTag(OPEN_SEMESTER_CACHE_TAG);
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
  updateTag(OPEN_SEMESTER_CACHE_TAG);
  redirect("/admin");
}

export async function deleteSemester(formData: FormData) {
  await requireGovernor();

  const id = String(formData.get("id") ?? "");
  try {
    await apiPost("semester/delete", { id });
  } catch (error) {
    if (error instanceof ApiError) fail(error.message);
    throw error;
  }
  updateTag(OPEN_SEMESTER_CACHE_TAG);
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
  try {
    await apiPost(`student/promote/${id}`);
  } catch (error) {
    if (error instanceof ApiError) fail(error.message);
    throw error;
  }
  redirect("/admin");
}
