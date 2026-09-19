import { Module } from "@nestjs/common";
import { TOKEN_VERIFIER } from "../../shared/domain/token-verifier";
import { ClerkTokenVerifier } from "../../shared/infrastructure/identity-token-verifier";
import { STUDENT_REPOSITORY } from "../student/domain/student-repository";
import { DrizzleStudentRepository } from "../student/infrastructure/drizzle-student.repository";
import { EVENT_REPOSITORY } from "./domain/event-repository";
import { DrizzleEventRepository } from "./infrastructure/drizzle-event.repository";
import { ListEventsUseCase } from "./application/list-events.use-case";
import { CreateEventUseCase } from "./application/create-event.use-case";
import { UpdateEventUseCase } from "./application/update-event.use-case";
import { DeleteEventUseCase } from "./application/delete-event.use-case";
import { EventController } from "./presentation/event.controller";
import { AuthGuard } from "../../shared/presentation/auth.guard";
import { CapabilityGuard } from "../../shared/presentation/capability.guard";

@Module({
  controllers: [EventController],
  providers: [
    { provide: TOKEN_VERIFIER, useClass: ClerkTokenVerifier },
    { provide: STUDENT_REPOSITORY, useClass: DrizzleStudentRepository },
    { provide: EVENT_REPOSITORY, useClass: DrizzleEventRepository },
    ListEventsUseCase,
    CreateEventUseCase,
    UpdateEventUseCase,
    DeleteEventUseCase,
    AuthGuard,
    CapabilityGuard,
  ],
})
export class EventModule {}
