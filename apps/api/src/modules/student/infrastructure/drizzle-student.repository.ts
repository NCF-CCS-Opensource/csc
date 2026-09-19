import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { students, type Database } from "@attendance/db";
import { DB } from "../../../shared/infrastructure/db.module";
import type {
  NewStudent,
  StudentCorrection,
  StudentRepository,
} from "../domain/student-repository";
import { DuplicateStudentIdError, StudentNotFoundError } from "../domain/student-errors";
import type { Actor } from "../../../shared/domain/actor";
import { toActor } from "./student.mapper";

@Injectable()
export class DrizzleStudentRepository implements StudentRepository {
  constructor(@Inject(DB) private readonly db: Database) {}

  async findByAuthUserId(authUserId: string): Promise<Actor | null> {
    const row = await this.db.query.students.findFirst({
      where: eq(students.authUserId, authUserId),
    });
    return row ? toActor(row) : null;
  }

  async create(input: NewStudent): Promise<Actor> {
    const [row] = await this.db
      .insert(students)
      .values({
        authUserId: input.authUserId,
        email: input.email.toLowerCase(),
        name: input.name,
        program: input.program,
        section: input.section,
        studentId: input.studentId,
        role: input.role,
      })
      .onConflictDoNothing()
      .returning();
    // A concurrent duplicate claim raced this one — the row already exists.
    const created = row ?? (await this.findRowByAuthUserId(input.authUserId));
    return toActor(created!);
  }

  async updateIdAndProgram(id: string, input: StudentCorrection): Promise<Actor> {
    let row: typeof students.$inferSelect | undefined;
    try {
      [row] = await this.db
        .update(students)
        .set({ studentId: input.studentId, program: input.program })
        .where(eq(students.id, id))
        .returning();
    } catch (error) {
      // Collision on the unique Student ID — Postgres rejects the whole
      // statement, so the other Student's record is untouched too.
      if ((error as { code?: string }).code === "23505") {
        throw new DuplicateStudentIdError();
      }
      throw error;
    }
    if (!row) throw new StudentNotFoundError();
    return toActor(row);
  }

  private findRowByAuthUserId(authUserId: string) {
    return this.db.query.students.findFirst({
      where: eq(students.authUserId, authUserId),
    });
  }
}
