"use server";

import { programs, students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  decideRegistrationAction,
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
    columns: { authUserId: true },
  });

  const decision = decideRegistrationAction(input, existing ?? null);

  if (decision.action === "reject") {
    return { errors: [{ field: "email", message: decision.reason }] };
  }

  const studentRow = {
    email: input.email,
    name: input.name,
    program: input.program,
    studentId: input.studentId,
  };

  const supabase = await createClient();
  const emailRedirectTo = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  if (decision.action === "create") {
    const { error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { emailRedirectTo },
    });
    if (error) return { errors: [{ field: "email", message: error.message }] };

    await db.insert(students).values(studentRow);
  } else {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: input.email,
      options: { emailRedirectTo },
    });
    if (error) return { errors: [{ field: "email", message: error.message }] };

    await db
      .update(students)
      .set({ name: input.name, program: input.program, studentId: input.studentId })
      .where(eq(students.email, input.email));
  }

  return { errors: [], success: true };
}
