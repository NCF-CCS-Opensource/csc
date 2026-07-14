import { students } from "@attendance/db";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      const [linked] = await db
        .update(students)
        .set({ authUserId: data.user.id })
        .where(
          and(eq(students.email, data.user.email), isNull(students.authUserId)),
        )
        .returning();

      // Only the first verification linked a row — skip on repeat sign-ins.
      if (linked) {
        await sendConfirmationEmail(linked.email, linked);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/register?error=auth`);
}
