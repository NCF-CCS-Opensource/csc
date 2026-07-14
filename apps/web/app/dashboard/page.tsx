import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/register");

  const student = await db.query.students.findFirst({
    where: eq(students.authUserId, user.id),
  });

  if (!student) redirect("/register");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2">
      <h1 className="text-xl font-medium">Welcome, {student.email}</h1>
      <dl className="text-sm text-zinc-500">
        <div>Program: {student.program}</div>
        <div>Student ID: {student.studentId}</div>
      </dl>
    </main>
  );
}
