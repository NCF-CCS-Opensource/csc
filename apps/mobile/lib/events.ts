import { useQuery, type QueryClient } from "@tanstack/react-query";
import { apiFetch } from "./api";

export type EventType = "whole_day" | "half_day";

export type EventRow = {
  id: string;
  name: string;
  type: EventType;
  halfDayPenaltyAmount: string;
  date: string;
  venue: string | null;
};

export type EventInput = Partial<
  Omit<EventRow, "id" | "date"> & { date: string | null }
>;

export const myEventsKey = ["events", "mine"] as const;

export async function fetchMyEvents(): Promise<EventRow[]> {
  return apiFetch<EventRow[]>("/v1/api/event/list", { method: "POST" });
}

// One shared Event list. A booth relaunched with no signal serves it from the
// persisted cache, which is what lets the Officer reach the Offline Scan Queue.
export function useMyEvents() {
  return useQuery({ queryKey: myEventsKey, queryFn: fetchMyEvents });
}

// Every write below invalidates the shared Events query on success, so every
// screen reading useMyEvents() (Events tab, Booth) reflects the change
// immediately instead of only whichever screen made the call.

export async function createEvent(
  queryClient: QueryClient,
  input: EventInput,
): Promise<EventRow> {
  const result = await apiFetch<EventRow>("/v1/api/event/create", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await queryClient.invalidateQueries({ queryKey: myEventsKey });
  return result;
}

export async function updateEvent(
  queryClient: QueryClient,
  input: EventInput & { id: string },
): Promise<EventRow> {
  const result = await apiFetch<EventRow>("/v1/api/event/update", {
    method: "POST",
    body: JSON.stringify(input),
  });
  await queryClient.invalidateQueries({ queryKey: myEventsKey });
  return result;
}

export async function deleteEvent(
  queryClient: QueryClient,
  id: string,
): Promise<void> {
  await apiFetch("/v1/api/event/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
  await queryClient.invalidateQueries({ queryKey: myEventsKey });
}
