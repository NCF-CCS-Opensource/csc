import { events, semesters } from "@attendance/db";
import { desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import { deriveWholeDayPenalty, EVENT_TYPES } from "@/lib/events";
import { createEvent } from "./actions";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const officer = await requireOfficerOrGovernor();
  const { error } = await searchParams;

  const openSemester = await db.query.semesters.findFirst({
    where: isNull(semesters.closedAt),
  });
  const myEvents = await db
    .select()
    .from(events)
    .where(eq(events.officerId, officer.id))
    .orderBy(desc(events.createdAt));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
      <h1 className="text-xl font-medium">My Events</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <ul className="flex flex-col gap-2 text-sm">
        {myEvents.map((event) => (
          <li key={event.id}>
            {event.name} — {event.type === "whole_day" ? "Whole-day" : "Half-day"} — ₱
            {event.halfDayPenaltyAmount}/half
            {event.type === "whole_day" &&
              ` (₱${deriveWholeDayPenalty(event.halfDayPenaltyAmount)} full absence)`}{" "}
            <Link href={`/events/${event.id}/attendance`} className="underline">
              Attendance
            </Link>
          </li>
        ))}
      </ul>

      {openSemester ? (
        <form action={createEvent} className="flex max-w-sm flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Name
            <input name="name" required className="rounded border px-2 py-1" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Type
            <select name="type" required className="rounded border px-2 py-1">
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === "whole_day" ? "Whole-day" : "Half-day"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Half-day absence penalty (₱)
            <input
              name="halfDayPenaltyAmount"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="rounded border px-2 py-1"
            />
          </label>
          <button type="submit" className="rounded bg-black px-3 py-2 text-white">
            Create Event
          </button>
        </form>
      ) : (
        <p className="text-sm text-zinc-500">
          No open Semester — ask the Governor to open one before creating Events.
        </p>
      )}
    </main>
  );
}
