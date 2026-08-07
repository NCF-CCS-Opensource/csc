import { students } from "@attendance/db";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { determineRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

const GOVERNOR_EMAILS = (process.env.GOVERNOR_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      const profile = data.user.user_metadata ?? {};

      // Registration data rode along as auth metadata (see register/actions.ts).
      // Password-reset callbacks carry no profile — nothing to create then.
      if (profile.name && profile.program && profile.studentId) {
        const [created] = await db
          .insert(students)
          .values({
            authUserId: data.user.id,
            email: data.user.email,
            name: profile.name,
            program: profile.program,
            studentId: profile.studentId,
            role: determineRole(data.user.email, GOVERNOR_EMAILS),
          })
          .onConflictDoNothing()
          .returning();

        // Only the first confirmation created the row — skip on repeat visits.
        if (created) {
          await sendConfirmationEmail(created.email, created);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/register?error=auth`);
}
