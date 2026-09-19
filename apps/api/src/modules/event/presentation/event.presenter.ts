import type { EventResponse } from "@attendance/contracts";
import type { Event } from "../domain/event";
import { deriveWholeDayPenalty } from "../domain/event-lifecycle";

export function presentEvent(event: Event): EventResponse {
  return {
    id: event.id,
    name: event.name,
    semesterId: event.semesterId,
    date: event.date,
    venue: event.venue,
    type: event.type,
    halfDayPenaltyAmount: event.halfDayPenaltyAmount,
    wholeDayPenalty: deriveWholeDayPenalty(event.halfDayPenaltyAmount),
    createdAt: event.createdAt.toISOString(),
  };
}
