import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, isNull } from "drizzle-orm";
import { attendanceSessions, events, scans, semesters, type Database } from "@attendance/db";
import { DB } from "../../../shared/infrastructure/db.module";
import type { EventRepository } from "../domain/event-repository";
import { EventLifecycleError, validateEventInput, type EventInput } from "../domain/event-lifecycle";
import type { Event } from "../domain/event";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

@Injectable()
export class DrizzleEventRepository implements EventRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(): Promise<Event[]> {
    return this.db.query.events.findMany({ orderBy: desc(events.createdAt) });
  }

  async findById(id: string): Promise<Event | null> {
    const event = await this.db.query.events.findFirst({ where: eq(events.id, id) });
    return event ?? null;
  }

  private async hasAttendanceActivity(
    transaction: Transaction,
    eventId: string,
  ): Promise<boolean> {
    return Boolean(
      (await transaction.query.scans.findFirst({ where: eq(scans.eventId, eventId) })) ??
        (await transaction.query.attendanceSessions.findFirst({
          where: eq(attendanceSessions.eventId, eventId),
        })),
    );
  }

  async create(input: EventInput): Promise<Event> {
    return this.db.transaction(async (transaction) => {
      const [openSemester] = await transaction
        .select()
        .from(semesters)
        .where(isNull(semesters.closedAt))
        .limit(1)
        .for("update");
      if (!openSemester) {
        throw new EventLifecycleError(
          "No open Semester — ask the Governor to open one",
          409,
        );
      }

      const errors = validateEventInput(input, openSemester);
      if (errors[0]) throw new EventLifecycleError(errors[0].message, 400);

      const [created] = await transaction
        .insert(events)
        .values({ ...input, semesterId: openSemester.id })
        .returning();
      return created;
    });
  }

  async update(id: string, input: EventInput): Promise<Event> {
    return this.db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1)
        .for("update");
      if (!existing) throw new EventLifecycleError("Event not found", 404);
      const [semester] = await transaction
        .select()
        .from(semesters)
        .where(eq(semesters.id, existing.semesterId))
        .limit(1)
        .for("update");
      if (!semester) throw new EventLifecycleError("Semester not found", 404);
      if (semester.closedAt) {
        throw new EventLifecycleError("Closed Semester Events cannot be changed", 409);
      }

      const errors = validateEventInput(input, semester);
      if (errors[0]) throw new EventLifecycleError(errors[0].message, 400);

      if (
        (await this.hasAttendanceActivity(transaction, id)) &&
        (input.date !== existing.date ||
          input.type !== existing.type ||
          input.halfDayPenaltyAmount !== existing.halfDayPenaltyAmount)
      ) {
        throw new EventLifecycleError(
          "Only name and venue may change after attendance begins",
          409,
        );
      }

      const [updated] = await transaction
        .update(events)
        .set(input)
        .where(eq(events.id, id))
        .returning();
      return updated;
    });
  }

  async remove(id: string): Promise<void> {
    await this.db.transaction(async (transaction) => {
      const [existing] = await transaction
        .select()
        .from(events)
        .where(eq(events.id, id))
        .limit(1)
        .for("update");
      if (!existing) throw new EventLifecycleError("Event not found", 404);
      const [semester] = await transaction
        .select()
        .from(semesters)
        .where(eq(semesters.id, existing.semesterId))
        .limit(1)
        .for("update");
      if (semester?.closedAt) {
        throw new EventLifecycleError("Closed Semester Events cannot be deleted", 409);
      }
      if (await this.hasAttendanceActivity(transaction, id)) {
        throw new EventLifecycleError(
          "Events with attendance history cannot be deleted",
          409,
        );
      }
      await transaction.delete(events).where(eq(events.id, id));
    });
  }
}
