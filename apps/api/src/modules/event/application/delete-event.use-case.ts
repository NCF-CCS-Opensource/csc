import { Inject, Injectable } from "@nestjs/common";
import { EVENT_REPOSITORY, type EventRepository } from "../domain/event-repository";

@Injectable()
export class DeleteEventUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly events: EventRepository) {}

  async execute(id: string): Promise<void> {
    return this.events.remove(id);
  }
}
