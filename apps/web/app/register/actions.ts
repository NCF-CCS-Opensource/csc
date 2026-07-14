"use server";

import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  decideRegistrationAction,
  validateRegistration,
  type Program,
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
    program: String(formData.get("program") ?? "") as Program,
    studentId: String(formData.get("studentId") ?? "").trim(),
  };

  const errors = validateRegistration(input);
  if (errors.length > 0) return { errors };

  const existing = await db.query.students.findFirst({
    where: eq(students.email, input.email),
    columns: { authUserId: true },
  });

  const decision = decideRegistrationAction(input, existing ?? null);

  if (decision.action === "reject") {
    return { errors: [{ field: "email", message: decision.reason }] };
  }

  if (decision.action === "create") {
    await db.insert(students).values(input);
  } else {
    await db
      .update(students)
      .set({ name: input.name, program: input.program, studentId: input.studentId })
      .where(eq(students.email, input.email));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: input.email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { errors: [{ field: "email", message: error.message }] };
  }

  return { errors: [], success: true };
}
