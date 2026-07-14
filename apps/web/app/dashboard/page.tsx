import { students } from "@attendance/db";
import { eq } from "drizzle-orm";
import Link from "next/link";
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
      <h1 className="text-xl font-medium">Welcome, {student.name}</h1>
      <dl className="text-sm text-zinc-500">
        <div>Email: {student.email}</div>
        <div>Program: {student.program}</div>
        <div>Student ID: {student.studentId}</div>
      </dl>
      {/* eslint-disable-next-line @next/next/no-img-element -- generated PNG, not an optimizable static asset */}
      <img src="/qr" alt="Your attendance QR code" width={200} height={200} />
      <a href="/qr" download="attendance-qr.png" className="text-sm underline">
        Download QR code
      </a>
      {student.role === "governor" && (
        <Link href="/admin" className="text-sm underline">
          Governor admin
        </Link>
      )}
      {(student.role === "officer" || student.role === "governor") && (
        <Link href="/events" className="text-sm underline">
          My Events
        </Link>
      )}
    </main>
  );
}
