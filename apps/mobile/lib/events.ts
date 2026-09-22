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
};

// Events are shared among all Officers — there is no per-Officer ownership,
// so this query key and hook name must never imply "mine".
export const eventsKey = ["events"] as const;

export async function fetchEvents(): Promise<EventRow[]> {
  return apiFetch<EventRow[]>("/v1/api/event/list", { method: "POST" });
}

// One shared Event list. A booth relaunched with no signal serves it from the
// persisted cache, which is what lets the Officer reach the Offline Scan Queue.
export function useEvents() {
  return useQuery({ queryKey: eventsKey, queryFn: fetchEvents });
}
