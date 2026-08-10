import { useQuery } from "@tanstack/react-query";
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
