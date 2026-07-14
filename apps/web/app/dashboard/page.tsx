import { attendanceSessions, events, payments, penalties, semesters, students } from "@attendance/db";
import { desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSemesterPenaltySummary } from "@/lib/penalties";
import { isSessionAbsent } from "@/lib/scan";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

  const attendanceHistory = await db
    .select({
      sessionId: attendanceSessions.id,
      eventName: events.name,
      half: attendanceSessions.half,
      timeIn: attendanceSessions.timeIn,
      timeOut: attendanceSessions.timeOut,
    })
    .from(attendanceSessions)
    .innerJoin(events, eq(attendanceSessions.eventId, events.id))
    .where(eq(attendanceSessions.studentId, student.id))
    .orderBy(desc(attendanceSessions.createdAt));

  const openSemester = await db.query.semesters.findFirst({
    where: isNull(semesters.closedAt),
  });

  const { total: totalPenalty, outstanding } = openSemester
    ? await getSemesterPenaltySummary(student.id, openSemester.id)
    : { total: 0, outstanding: 0 };

  const paymentHistory = await db
    .select({ id: payments.id, amount: payments.amount, paidAt: payments.paidAt })
    .from(payments)
    .innerJoin(penalties, eq(payments.penaltyId, penalties.id))
    .where(eq(penalties.studentId, student.id))
    .orderBy(desc(payments.paidAt));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 p-8">
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
        <>
          <Link href="/events" className="text-sm underline">
            My Events
          </Link>
          <Link href="/clearance" className="text-sm underline">
            Clearance lookup
          </Link>
          <Link href="/analytics" className="text-sm underline">
            Analytics
          </Link>
        </>
      )}

      <section className="w-full">
        <h2 className="font-medium">This Semester</h2>
        {openSemester ? (
          <p className="text-sm text-zinc-500">
            Total penalties: ₱{totalPenalty.toFixed(2)} — Outstanding: ₱
            {outstanding.toFixed(2)}
          </p>
        ) : (
          <p className="text-sm text-zinc-500">No open Semester.</p>
        )}
      </section>

      <section className="w-full">
        <h2 className="font-medium">Attendance history</h2>
        {attendanceHistory.length === 0 ? (
          <p className="text-sm text-zinc-500">No attendance recorded yet.</p>
        ) : (
          <ul className="text-sm">
            {attendanceHistory.map((row) => (
              <li key={row.sessionId} className="flex justify-between border-t py-1">
                <span>
                  {row.eventName} ({row.half.toUpperCase()})
                </span>
                <span
                  className={
                    isSessionAbsent(row) ? "text-red-600" : "text-green-700"
                  }
                >
                  {isSessionAbsent(row) ? "Absent" : "Present"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="w-full">
        <h2 className="font-medium">Payment history</h2>
        {paymentHistory.length === 0 ? (
          <p className="text-sm text-zinc-500">No payments yet.</p>
        ) : (
          <ul className="text-sm">
            {paymentHistory.map((payment) => (
              <li key={payment.id} className="flex justify-between border-t py-1">
                <span>{new Date(payment.paidAt).toLocaleDateString()}</span>
                <span>₱{payment.amount}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
