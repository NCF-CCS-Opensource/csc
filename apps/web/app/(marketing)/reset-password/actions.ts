"use server";

import { redirect } from "next/navigation";
import { MIN_PASSWORD_LENGTH } from "@/lib/registration";
import { createClient } from "@/lib/supabase/server";

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
