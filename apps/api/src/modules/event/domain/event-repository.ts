import type { Event } from "./event";
import type { EventInput } from "./event-lifecycle";

// A repository interface, satisfied by infrastructure/. create/update/remove
// own their own transaction and throw EventLifecycleError for a lifecycle
// violation — the infra layer enforces the same locking/consistency
// guarantees apps/web/lib/events.ts did.
export interface EventRepository {
  list(): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  create(input: EventInput): Promise<Event>;
  update(id: string, input: EventInput): Promise<Event>;
  remove(id: string): Promise<void>;
}

export const EVENT_REPOSITORY = Symbol("EventRepository");
