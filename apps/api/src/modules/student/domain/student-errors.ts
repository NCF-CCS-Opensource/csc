// Domain refusals for Student correction (ADR-0014, ported from
// apps/web/lib/students.ts). Thrown by the repository (persistence
// conflicts) or the use case (input validation); translated to HTTP status
// codes only in presentation/.
export class DuplicateStudentIdError extends Error {
  constructor() {
    super("That Student ID already belongs to another Student");
  }
}

export class StudentNotFoundError extends Error {
  constructor() {
    super("Student not found");
  }
}

export class InvalidStudentIdError extends Error {
  constructor() {
    super("Student ID is required");
  }
}

export class InvalidProgramError extends Error {
  constructor() {
    super("Select a valid Program");
  }
}
