import { students } from "@attendance/db";
import { createClient } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { db } from "./db";

// Mobile (apps/mobile) has no cookies to send — it authenticates API routes
// with an `Authorization: Bearer <access_token>` header instead.
export async function getUserFromBearer(request: Request) {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function getStudentFromRequest(request: Request) {
  const user = await getUserFromBearer(request);
  if (!user) return null;

  return (
    (await db.query.students.findFirst({
      where: eq(students.authUserId, user.id),
    })) ?? null
  );
}

export async function requireOfficerFromRequest(request: Request) {
  const student = await getStudentFromRequest(request);
  if (!student || (student.role !== "officer" && student.role !== "governor")) {
    return null;
  }
  return student;
}
