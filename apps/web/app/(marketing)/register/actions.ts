"use server";

import { programs, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ALREADY_REGISTERED,
  validateRegistration,
  type ValidationError,
} from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

export type RegisterState = {
  errors: ValidationError[];
  success?: boolean;
};

export async function registerStudent(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const input = {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? "").trim(),
    program: String(formData.get("program") ?? ""),
    studentId: String(formData.get("studentId") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const validPrograms = (await db.select({ name: programs.name }).from(programs)).map(
    (row) => row.name,
  );

  const errors = validateRegistration(input, validPrograms);
  if (errors.length > 0) return { errors };

  const existing = await db.query.students.findFirst({
    where: eq(students.email, input.email),
    columns: { id: true },
  });
  if (existing) return { errors: [{ field: "email", message: ALREADY_REGISTERED }] };

  // The Student row is written at confirmation (auth/callback), not here: it
  // needs the auth user id, which only counts once the email is verified. The
  // profile fields ride along as auth metadata until then. Re-registering an
  // unconfirmed email re-sends the confirmation, which is what we want.
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: { name: input.name, program: input.program, studentId: input.studentId },
    },
  });
  if (error) return { errors: [{ field: "email", message: error.message }] };

  return { errors: [], success: true };
}
