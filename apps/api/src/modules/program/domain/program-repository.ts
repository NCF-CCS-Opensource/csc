import type { Program } from "@attendance/contracts";

// A repository interface, satisfied by infrastructure/ (ADR-0017).
export interface ProgramRepository {
  listNames(): Promise<string[]>;
  // Same rows as listNames, with the id the remove-Program form needs.
  listAll(): Promise<Program[]>;
  // Throws DuplicateProgramError on a name collision.
  create(name: string): Promise<Program>;
  // Throws ProgramInUseError when a Student still references this Program.
  delete(id: string): Promise<void>;
}

export const PROGRAM_REPOSITORY = Symbol("ProgramRepository");

export class DuplicateProgramError extends Error {
  constructor() {
    super("That Program already exists");
  }
}

export class ProgramInUseError extends Error {
  constructor() {
    super("Can't remove a Program students are already registered under");
  }
}
