import { Inject, Injectable } from "@nestjs/common";
import { and, eq, gt, lt, or } from "drizzle-orm";
import { events, semesters, type Database } from "@attendance/db";
import { DB } from "../../../shared/infrastructure/db.module";
import type { SemesterRepository } from "../domain/semester-repository";
import { SemesterLifecycleError, type DateRange } from "../domain/semester-lifecycle";
import type { Semester } from "../domain/semester";

@Injectable()
export class DrizzleSemesterRepository implements SemesterRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findOpen(): Promise<Semester | null> {
    const semester = await this.db.query.semesters.findFirst({
      where: (row, { isNull }) => isNull(row.closedAt),
    });
    return semester ?? null;
  }

  async findById(id: string): Promise<Semester | null> {
    const semester = await this.db.query.semesters.findFirst({
      where: eq(semesters.id, id),
    });
    return semester ?? null;
  }

  async create(dates: DateRange): Promise<Semester> {
    try {
      const [created] = await this.db.insert(semesters).values(dates).returning();
      return created;
    } catch (error) {
      if ((error as { code?: string }).code === "23505") {
        throw new SemesterLifecycleError(
          "Close the current Semester before opening a new one",
          409,
        );
      }
      throw error;
    }
  }

  async updateDates(id: string, dates: DateRange): Promise<Semester> {
    return this.db.transaction(async (transaction) => {
      const [semester] = await transaction
        .select()
        .from(semesters)
        .where(eq(semesters.id, id))
        .limit(1)
        .for("update");
      if (!semester) throw new SemesterLifecycleError("Semester not found", 404);

      const excludedEvent = await transaction.query.events.findFirst({
        where: and(
          eq(events.semesterId, id),
          or(lt(events.date, dates.startDate), gt(events.date, dates.endDate)),
        ),
      });
      if (excludedEvent) {
        throw new SemesterLifecycleError(
          "Semester dates must include every existing Event",
          409,
        );
      }

      const [updated] = await transaction
        .update(semesters)
        .set(dates)
        .where(eq(semesters.id, id))
        .returning();
      return updated;
    });
  }

  async close(id: string): Promise<Semester> {
    const [closed] = await this.db
      .update(semesters)
      .set({ closedAt: new Date() })
      .where(eq(semesters.id, id))
      .returning();
    if (!closed) throw new SemesterLifecycleError("Semester not found", 404);
    return closed;
  }
}
