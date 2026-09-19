import { Inject, Injectable } from "@nestjs/common";
import { EVENT_REPOSITORY, type EventRepository } from "../domain/event-repository";
import type { Event } from "../domain/event";
import type { EventInput } from "../domain/event-lifecycle";

// Authorization (manage_operations) is decided by CapabilityGuard before this
// runs (ADR-0017/0019) — no role check here, unlike the ported Next.js
// command. Open-Semester scoping and field validation live in the repository
// because they need the same row lock as the insert (see
// DrizzleEventRepository.create).
@Injectable()
export class CreateEventUseCase {
  constructor(@Inject(EVENT_REPOSITORY) private readonly events: EventRepository) {}

  async execute(input: EventInput): Promise<Event> {
    return this.events.create(input);
  }
}
