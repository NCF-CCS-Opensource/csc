// Shared with apps/api, apps/web (ADR-0019). See CONTEXT.md's Event entry —
// one calendar date per Event (ADR-0004), no owning Officer (ADR-0007).
export const EVENT_TYPES = ["whole_day", "half_day"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface EventResponse {
  id: string;
  name: string;
  semesterId: string;
  date: string;
  venue: string | null;
  type: EventType;
  halfDayPenaltyAmount: string;
  // Derived (2x half-day), never stored — see deriveWholeDayPenalty.
  wholeDayPenalty: number;
  createdAt: string;
}

export interface EventInputRequest {
  name: string;
  type: EventType;
  halfDayPenaltyAmount: string;
  date: string;
  venue?: string;
}

export interface UpdateEventRequest extends EventInputRequest {
  id: string;
}

export interface DeleteEventRequest {
  id: string;
}
