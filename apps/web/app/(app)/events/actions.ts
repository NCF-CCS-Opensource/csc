"use server";

import { events } from "@attendance/db";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createEvent as createEventCommand,
  deriveWholeDayPenalty,
  EVENT_TYPES,
  EventLifecycleError,
  findOpenSemester,
  parseEventInput,
  type EventType,
} from "@/lib/events";

// The Event module reaches the database, so the client view must not import it
// — that would pull the db into the browser bundle. Everything the view needs
// from it (the derived whole-day Penalty, the Event types) is resolved here and
// travels as data, leaving the module itself untouched (ADR 0013).
export type EventsSnapshot = {
  openSemester: { startDate: string; endDate: string } | null;
  eventTypes: readonly EventType[];
  events: {
    id: string;
    name: string;
    date: string;
    type: EventType;
    halfDayPenaltyAmount: string;
    wholeDayPenalty: number;
  }[];
};

// The Events page's one read, called by the server shell for the first paint and
// by the client cache's queryFn on every revisit (ADR 0013). No API route: this
// authorizes the browser session, leaving the booth's Bearer path untouched.
export async function eventsSnapshot(): Promise<EventsSnapshot> {
  await requireOfficerOrGovernor();

  const [openSemester, allEvents] = await Promise.all([
    findOpenSemester(),
    db
      .select({
        id: events.id,
        name: events.name,
        date: events.date,
        type: events.type,
        halfDayPenaltyAmount: events.halfDayPenaltyAmount,
      })
      .from(events)
      .orderBy(desc(events.createdAt)),
  ]);

  return {
    openSemester: openSemester
      ? { startDate: openSemester.startDate, endDate: openSemester.endDate }
      : null,
    eventTypes: EVENT_TYPES,
    events: allEvents.map((event) => ({
      ...event,
      wholeDayPenalty: deriveWholeDayPenalty(event.halfDayPenaltyAmount),
    })),
  };
}

function fail(message: string): never {
  redirect(`/events?error=${encodeURIComponent(message)}`);
}

export async function createEvent(formData: FormData) {
  const actor = await requireOfficerOrGovernor();
  const input = parseEventInput({
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? ""),
    halfDayPenaltyAmount: String(formData.get("halfDayPenaltyAmount") ?? ""),
    date: String(formData.get("date") ?? ""),
    venue: String(formData.get("venue") ?? "").trim() || undefined,
  });

  try {
    await createEventCommand(actor, input);
  } catch (error) {
    if (error instanceof EventLifecycleError) fail(error.message);
    throw error;
  }
  redirect("/events");
}
