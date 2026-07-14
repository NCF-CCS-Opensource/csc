"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
  unconfirmedEmail?: string;
};

export async function loginStudent(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("email not confirmed")) {
      return { error: "Confirm your email before logging in.", unconfirmedEmail: email };
    }
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

export async function resendConfirmation(email: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  });

  return error ? { error: error.message } : {};
}
