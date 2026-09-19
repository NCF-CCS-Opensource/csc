import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { enrollmentRoster, type Database } from "@attendance/db";
import { DB } from "../../../shared/infrastructure/db.module";
import type {
  EnrollmentRosterRepository,
  RosterRow,
} from "../domain/enrollment-roster-repository";

@Injectable()
export class DrizzleEnrollmentRosterRepository implements EnrollmentRosterRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findByEmail(email: string): Promise<RosterRow | null> {
    const row = await this.db.query.enrollmentRoster.findFirst({
      where: eq(enrollmentRoster.email, email),
    });
    return row ?? null;
  }

  async findByStudentId(studentId: string): Promise<RosterRow | null> {
    const row = await this.db.query.enrollmentRoster.findFirst({
      where: eq(enrollmentRoster.studentId, studentId),
    });
    return row ?? null;
  }
}
