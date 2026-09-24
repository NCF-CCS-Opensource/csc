import { Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, gt, isNull, lt, or } from "drizzle-orm";
import { events, payments, semesters, type Database } from "@attendance/db";
import { DB } from "../../../shared/infrastructure/db.module";
import type { SemesterRepository } from "../domain/semester-repository";
import { SemesterLifecycleError, type SemesterInput } from "../domain/semester-lifecycle";
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

  async findAll(): Promise<Semester[]> {
    return this.db.query.semesters.findMany({
      orderBy: desc(semesters.createdAt),
    });
  }

  async create(input: SemesterInput): Promise<Semester> {
    try {
      const [created] = await this.db.insert(semesters).values(input).returning();
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

  async updateDates(id: string, input: SemesterInput): Promise<Semester> {
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
          or(lt(events.date, input.startDate), gt(events.date, input.endDate)),
        ),
      });
      if (excludedEvent) {
        throw new SemesterLifecycleError(
          "Semester dates must include every existing Event",
          409,
        );
      }

      // A recorded SAF Fee Payment snapshotted the amount; changing it now
      // would split Students across two prices. Voided Payments don't count.
      if (Number(input.safFeeAmount) !== Number(semester.safFeeAmount)) {
        const safPayment = await transaction.query.payments.findFirst({
          where: and(eq(payments.semesterId, id), isNull(payments.voidedAt)),
        });
        if (safPayment) {
          throw new SemesterLifecycleError(
            "The SAF Fee amount can't change once a SAF Fee Payment is recorded",
            409,
          );
        }
      }

      const [updated] = await transaction
        .update(semesters)
        .set(input)
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

  async delete(id: string): Promise<void> {
    let deleted: Semester | undefined;
    try {
      [deleted] = await this.db.delete(semesters).where(eq(semesters.id, id)).returning();
    } catch (error) {
      // Events still reference this Semester (events.semester_id FK).
      if ((error as { code?: string }).code === "23503") {
        throw new SemesterLifecycleError(
          "Can't delete a Semester that already has Events under it",
          409,
        );
      }
      throw error;
    }
    if (!deleted) throw new SemesterLifecycleError("Semester not found", 404);
  }
}
