"use server";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { alreadyStudent } from "@/lib/student-identity";
import { claimRosterByStudentId } from "@/lib/enrollment-roster";
import { ApiError } from "@/lib/api-client";
import { isSchoolEmail, verifiedPrimaryEmail, type ValidationError } from "@/lib/onboarding";

const ONBOARDING_TEST_EMAILS = (process.env.ONBOARDING_TEST_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

export type OnboardingState = { errors: ValidationError[] };

export async function claimEnrollmentRoster(
  _prevState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  // Already a Student — a resubmitted form must not look like a taken id.
  if (await alreadyStudent()) redirect("/dashboard");

  const email = verifiedPrimaryEmail(user);
  if (!email) {
    return {
      errors: [{ field: "email", message: "Your Google account has no verified email address." }],
    };
  }
  if (!isSchoolEmail(email, ONBOARDING_TEST_EMAILS)) {
    return { errors: [{ field: "email", message: "Email must be a @gbox.ncf.edu.ph address" }] };
  }

  const name = user.fullName?.trim() ?? "";
  if (!name) {
    return { errors: [{ field: "studentId", message: "Your Google account has no name set." }] };
  }
  const studentId = String(formData.get("studentId") ?? "").trim();
  if (!studentId) return { errors: [{ field: "studentId", message: "Student ID is required" }] };

  try {
    await claimRosterByStudentId(studentId);
  } catch (error) {
    if (error instanceof ApiError) {
      return { errors: [{ field: error.field ?? "studentId", message: error.message }] };
    }
    throw error;
  }

  // Nothing is mailed: the new Student lands where their live QR and their QR
  // Card download already are. Unbranched on purpose — a bootstrap Governor
  // gets the same destination, not dashboardDestination's role split (#130).
  redirect("/my-attendance");
}
