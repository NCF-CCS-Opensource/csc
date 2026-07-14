"use server";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState = {
  success?: boolean;
};

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  const supabase = await createClient();
  // Always report success regardless of whether the email exists — avoids
  // leaking which addresses are registered.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  return { success: true };
}
