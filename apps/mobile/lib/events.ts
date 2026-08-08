import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

export type EventType = "whole_day" | "half_day";

export type EventRow = {
  id: string;
  name: string;
  type: EventType;
  halfDayPenaltyAmount: string;
  date: string;
  venue: string | null;
  attendeeCount: number;
};

export const myEventsKey = ["events", "mine"] as const;

export async function fetchMyEvents(): Promise<EventRow[]> {
  const { events } = await apiFetch<{ events: EventRow[] }>("/api/events/mine");
  return events;
}

// One shared Event list. A booth relaunched with no signal serves it from the
// persisted cache, which is what lets the Officer reach the Offline Scan Queue.
export function useMyEvents() {
  return useQuery({ queryKey: myEventsKey, queryFn: fetchMyEvents });
}

// Derived from the row so the two cannot drift apart on nullability.
export type EventInput = Omit<EventRow, "id" | "attendeeCount">;

export async function saveEvent(id: string | undefined, input: EventInput) {
  const { event } = await apiFetch<{ event: EventRow }>(
    id ? `/api/events/${id}` : "/api/events",
    { method: id ? "PATCH" : "POST", body: JSON.stringify(input) },
  );
  return event;
}

export async function deleteEvent(id: string) {
  await apiFetch(`/api/events/${id}`, { method: "DELETE" });
}

// Every Event change invalidates the one shared list, so a create on the Events
// screen shows up in the Scanner's dropdown without a manual refresh. The
// refetch is deliberately not awaited: the form has already succeeded, and on a
// weak link its retries would hold the modal open long after the save landed.
export function useSaveEvent(id?: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: EventInput) => saveEvent(id, input),
    onSuccess: () => void client.invalidateQueries({ queryKey: myEventsKey }),
  });
}

export function useDeleteEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => void client.invalidateQueries({ queryKey: myEventsKey }),
  });
}
