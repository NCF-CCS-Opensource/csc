"use server";

import { currentUser } from "@clerk/nextjs/server";
import { programs, students } from "@attendance/db";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hasStudentRecord } from "@/lib/auth";
import { sendConfirmationEmail } from "@/lib/email";
import {
  ALREADY_TAKEN,
  validateOnboarding,
  verifiedPrimaryEmail,
  type ValidationError,
} from "@/lib/onboarding";
import { determineRole } from "@/lib/roles";

const GOVERNOR_EMAILS = (process.env.GOVERNOR_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export type OnboardingState = { errors: ValidationError[] };

export async function completeOnboarding(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  // Already a Student — a resubmitted form must not look like a taken id.
  if (await hasStudentRecord(user.id)) redirect("/dashboard");

  const email = verifiedPrimaryEmail(user);
  if (!email) {
    return {
      errors: [{ field: "email", message: "Your Google account has no verified email address." }],
    };
  }

  const input = {
    email: email.toLowerCase(),
    name: user.fullName?.trim() ?? "",
    program: String(formData.get("program") ?? ""),
    studentId: String(formData.get("studentId") ?? "").trim(),
  };

  const validPrograms = (await db.select({ name: programs.name }).from(programs)).map(
    (row) => row.name,
  );

  const errors = validateOnboarding(input, validPrograms);
  if (errors.length > 0) return { errors };

  // Program and Student ID stay here, never in Clerk metadata (ADR 0012):
  // Clerk answers who this is, the database answers everything else.
  const [created] = await db
    .insert(students)
    .values({
      authUserId: user.id,
      email: input.email,
      name: input.name,
      program: input.program,
      studentId: input.studentId,
      // Governor bootstrap: the configured list decides the role at record
      // creation — the only moment it is consulted.
      role: determineRole(input.email, GOVERNOR_EMAILS),
    })
    .onConflictDoNothing()
    .returning();

  // Lost to somebody else's email or student id. Nothing was created, so the
  // Pending Student stays pending rather than looping on a missing row.
  if (!created) return { errors: [{ field: "studentId", message: ALREADY_TAKEN }] };

  await sendConfirmationEmail(created.email, created);

  redirect("/dashboard");
}
