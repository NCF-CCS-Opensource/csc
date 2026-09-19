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
