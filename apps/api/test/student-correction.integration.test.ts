import "reflect-metadata";
import { createDb, students, type Database } from "@attendance/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { CorrectStudentUseCase } from "../src/modules/student/application/correct-student.use-case";
import { DrizzleStudentRepository } from "../src/modules/student/infrastructure/drizzle-student.repository";
import {
  DuplicateStudentIdError,
  InvalidProgramError,
} from "../src/modules/student/domain/student-errors";
import { DrizzleProgramRepository } from "../src/modules/program/infrastructure/drizzle-program.repository";

// Seam 1 (parent issue #157): use cases invoked directly against a
// disposable Postgres, no HTTP, no mocks. Ported from the "Student
// correction" describe block in apps/web/lib/architecture.integration.test.ts
// (#162) — that DB-backed correctStudent now lives here as
// CorrectStudentUseCase. The "refuses a Student actor" case is dropped: it's
// unreachable at this seam now that CapabilityGuard enforces it at the HTTP
// boundary (seam 3, already covered by test/authorization.e2e.test.ts).
const db: Database = createDb(process.env.DATABASE_URL!);
const studentRepository = new DrizzleStudentRepository(db);
const programRepository = new DrizzleProgramRepository(db);
const correctStudent = new CorrectStudentUseCase(studentRepository, programRepository);

async function seedTwoStudents() {
  const [student, other] = await db
    .insert(students)
    .values([
      {
        email: "student@example.com",
        authUserId: "user_student",
        name: "Grace Hopper",
        program: "Computer Science",
        studentId: "24-001",
      },
      {
        email: "other@example.com",
        authUserId: "user_other",
        name: "Katherine Johnson",
        program: "Computer Science",
        studentId: "24-002",
      },
    ])
    .returning();
  return { student: student!, other: other! };
}

beforeEach(async () => {
  await db.delete(students);
});

describe("Student correction", () => {
  it("lets an Officer correct a Student's Student ID and Program", async () => {
    const { student } = await seedTwoStudents();

    const updated = await correctStudent.execute(student.id, {
      studentId: "24-999",
      program: "Information Technology",
    });

    expect(updated).toMatchObject({
      studentId: "24-999",
    });
  });

  it("lets a Governor correct a Student's Student ID and Program", async () => {
    const { student } = await seedTwoStudents();

    const updated = await correctStudent.execute(student.id, {
      studentId: "24-999",
      program: "Information Technology",
    });

    expect(updated).toMatchObject({
      studentId: "24-999",
    });
  });

  it("refuses a Student ID already held by another Student, changing neither record", async () => {
    const { student, other } = await seedTwoStudents();

    await expect(
      correctStudent.execute(student.id, {
        studentId: other.studentId,
        program: "Computer Science",
      }),
    ).rejects.toEqual(new DuplicateStudentIdError());
    expect(
      await db.query.students.findFirst({ where: eq(students.id, student.id) }),
    ).toMatchObject({ studentId: "24-001" });
    expect(
      await db.query.students.findFirst({ where: eq(students.id, other.id) }),
    ).toMatchObject({ studentId: "24-002" });
  });

  it("refuses an unknown Program", async () => {
    const { student } = await seedTwoStudents();

    await expect(
      correctStudent.execute(student.id, {
        studentId: "24-999",
        program: "Underwater Basketry",
      }),
    ).rejects.toEqual(new InvalidProgramError());
  });
});
