// The Governor-managed Program list (ADR-0019).
export interface Program {
  id: string;
  name: string;
}

export interface CreateProgramRequest {
  name: string;
}

export interface DeleteProgramRequest {
  id: string;
}

// program/list returns names only (enough for a correction dropdown);
// program/list-detailed carries the id the remove-Program form needs.
export interface ProgramListDetailedResponse {
  programs: Program[];
}
