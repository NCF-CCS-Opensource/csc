import { students } from "@attendance/db";
import { and, eq, isNull } from "drizzle-orm";
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
      const [linked] = await db
        .update(students)
        .set({
          authUserId: data.user.id,
          role: determineRole(data.user.email, GOVERNOR_EMAILS),
        })
        .where(
          and(eq(students.email, data.user.email), isNull(students.authUserId)),
        )
        .returning();

      // Only the first confirmation linked a row — skip on repeat sign-ins/resets.
      if (linked) {
        await sendConfirmationEmail(linked.email, linked);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/register?error=auth`);
}
