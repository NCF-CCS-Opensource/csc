import type { students } from "@attendance/db";
import type { Actor } from "../../../shared/domain/actor";

type StudentRow = typeof students.$inferSelect;

export function toActor(row: StudentRow): Actor {
  return {
    id: row.id,
    studentId: row.studentId,
    authUserId: row.authUserId,
    email: row.email,
    name: row.name,
    role: row.role,
    program: row.program,
  };
}
