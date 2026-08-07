"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Inlined: the password validator moved out with onboarding (ADR 0012). This
// whole password flow goes away with the Supabase Auth removal.
const MIN_PASSWORD_LENGTH = 8;

export type ResetPasswordState = {
  error?: string;
};

export async function updatePassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords don't match" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
