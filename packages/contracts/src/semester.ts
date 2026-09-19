// Shared with apps/api, apps/web (ADR-0019). Dates are "YYYY-MM-DD" strings
// throughout, matching the Postgres `date` column — never a Date object,
// which would smuggle a timezone into a value that has none.
export interface SemesterResponse {
  id: string;
  startDate: string;
  endDate: string;
  closedAt: string | null;
}

export interface CreateSemesterRequest {
  startDate: string;
  endDate: string;
}

export interface UpdateSemesterDatesRequest {
  id: string;
  startDate: string;
  endDate: string;
}

export interface CloseSemesterRequest {
  id: string;
}
