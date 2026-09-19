import type { EventType } from "./event-lifecycle";

// See CONTEXT.md's Event entry. No officer_id — every Officer sees and acts
// on every Officer's Events (ADR-0007).
export interface Event {
  id: string;
  name: string;
  semesterId: string;
  date: string;
  venue: string | null;
  type: EventType;
  halfDayPenaltyAmount: string;
  createdAt: Date;
}
