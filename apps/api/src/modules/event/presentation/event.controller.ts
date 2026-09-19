import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import type {
  DeleteEventRequest,
  EventInputRequest,
  EventResponse,
  UpdateEventRequest,
} from "@attendance/contracts";
import { AuthGuard } from "../../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../../shared/presentation/capability.guard";
import { RequireCapability } from "../../../shared/presentation/capability.decorator";
import { runLifecycle } from "../../../shared/presentation/run-lifecycle";
import { parseEventInput } from "../domain/event-lifecycle";
import { ListEventsUseCase } from "../application/list-events.use-case";
import { CreateEventUseCase } from "../application/create-event.use-case";
import { UpdateEventUseCase } from "../application/update-event.use-case";
import { DeleteEventUseCase } from "../application/delete-event.use-case";
import { presentEvent } from "./event.presenter";

// Single-action controllers, one per use case (ADR-0017). Every action needs
// only "manage_operations" — no ownership check anywhere, every Officer acts
// on every Event (ADR-0007).
@Controller("event")
@UseGuards(AuthGuard, CapabilityGuard)
export class EventController {
  constructor(
    @Inject(ListEventsUseCase) private readonly listEvents: ListEventsUseCase,
    @Inject(CreateEventUseCase) private readonly createEvent: CreateEventUseCase,
    @Inject(UpdateEventUseCase) private readonly updateEvent: UpdateEventUseCase,
    @Inject(DeleteEventUseCase) private readonly deleteEvent: DeleteEventUseCase,
  ) {}

  @Post("list")
  @RequireCapability("manage_operations")
  async list(): Promise<EventResponse[]> {
    const all = await this.listEvents.execute();
    return all.map(presentEvent);
  }

  @Post("create")
  @RequireCapability("manage_operations")
  async create(@Body() body: EventInputRequest): Promise<EventResponse> {
    const event = await runLifecycle(() =>
      this.createEvent.execute(parseEventInput(body)),
    );
    return presentEvent(event);
  }

  @Post("update")
  @RequireCapability("manage_operations")
  async update(@Body() body: UpdateEventRequest): Promise<EventResponse> {
    const event = await runLifecycle(() =>
      this.updateEvent.execute(body.id, parseEventInput(body)),
    );
    return presentEvent(event);
  }

  @Post("delete")
  @RequireCapability("manage_operations")
  async delete(@Body() body: DeleteEventRequest): Promise<{ ok: true }> {
    await runLifecycle(() => this.deleteEvent.execute(body.id));
    return { ok: true };
  }
}
