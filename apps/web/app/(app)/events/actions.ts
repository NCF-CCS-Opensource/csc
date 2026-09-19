"use server";

import type { EventResponse, EventType, SemesterResponse } from "@attendance/contracts";
import { EVENT_TYPES } from "@attendance/contracts";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOfficerOrGovernor } from "@/lib/auth";
import { apiFetch, ApiError } from "@/lib/api-client";

// The Event module now lives in apps/api (issue #163, ADR-0019) — these
// actions are thin proxies: requireOfficerOrGovernor() still gates page
// navigation (ADR-0005's redirect model), then every read/write forwards the
// caller's Clerk token to the API, which is the only place lifecycle rules
// and authorization are enforced.
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
// by the client cache's queryFn on every revisit (ADR 0013).
export async function eventsSnapshot(): Promise<EventsSnapshot> {
  await requireOfficerOrGovernor();

  const [openSemester, allEvents] = await Promise.all([
    apiFetch<SemesterResponse | null>("/v1/api/semester/current"),
    apiFetch<EventResponse[]>("/v1/api/event/list"),
  ]);

  return {
    openSemester: openSemester
      ? { startDate: openSemester.startDate, endDate: openSemester.endDate }
      : null,
    eventTypes: EVENT_TYPES,
    events: allEvents.map((event) => ({
      id: event.id,
      name: event.name,
      date: event.date,
      type: event.type,
      halfDayPenaltyAmount: event.halfDayPenaltyAmount,
      wholeDayPenalty: event.wholeDayPenalty,
    })),
  };
}

function fail(message: string): never {
  redirect(`/events?error=${encodeURIComponent(message)}`);
}

function parseEventForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    type: String(formData.get("type") ?? "") as EventType,
    halfDayPenaltyAmount: String(formData.get("halfDayPenaltyAmount") ?? ""),
    date: String(formData.get("date") ?? ""),
    venue: String(formData.get("venue") ?? "").trim() || undefined,
  };
}

export async function createEvent(formData: FormData) {
  await requireOfficerOrGovernor();

  try {
    await apiFetch("/v1/api/event/create", parseEventForm(formData));
  } catch (error) {
    if (error instanceof ApiError) fail(error.message);
    throw error;
  }
  redirect("/events");
}

// Edit and delete run from a dialog on the same page rather than a full-page
// form, so both report failure as a return value instead of a redirect —
// the dialog stays open and shows the message inline (e.g. Semester-closure
// rejections). No ownership check: any Officer may edit or delete any Event
// (ADR 0007), enforced by the API, not here.
async function runOrReportError(
  path: string,
  body: unknown,
): Promise<{ error: string | null }> {
  try {
    await apiFetch(path, body);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
  revalidatePath("/events");
  return { error: null };
}

export async function updateEvent(
  id: string,
  formData: FormData,
): Promise<{ error: string | null }> {
  await requireOfficerOrGovernor();
  return runOrReportError("/v1/api/event/update", { id, ...parseEventForm(formData) });
}

export async function deleteEvent(id: string): Promise<{ error: string | null }> {
  await requireOfficerOrGovernor();
  return runOrReportError("/v1/api/event/delete", { id });
}
