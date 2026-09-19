import { Inject, Injectable } from "@nestjs/common";
import { EVENT_REPOSITORY, type EventRepository } from "../domain/event-repository";
import type { Event } from "../domain/event";

// Every Officer sees every Event — no ownership scoping (ADR-0007).
@Injectable()
export class ListEventsUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly events: EventRepository) {}

  async execute(): Promise<Event[]> {
    return this.events.list();
  }
}
