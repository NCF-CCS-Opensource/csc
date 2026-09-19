import { Inject, Injectable } from "@nestjs/common";
import { EVENT_REPOSITORY, type EventRepository } from "../domain/event-repository";
import type { Event } from "../domain/event";
import type { EventInput } from "../domain/event-lifecycle";

@Injectable()
export class UpdateEventUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly events: EventRepository) {}

  async execute(id: string, input: EventInput): Promise<Event> {
    return this.events.update(id, input);
  }
}
