import type { LedgerInput } from "./ledger";

// A repository interface, satisfied by infrastructure/. Hides Drizzle and
// table shapes from the use case, matching the seam used by
// event/student/program/semester (domain interface + DI token,
// infrastructure Drizzle implementation).
export interface LedgerRepository {
  ledgerInput(semesterId: string, studentId?: string): Promise<LedgerInput | null>;
  eventDetails(semesterId: string): Promise<Map<string, { name: string; venue: string | null }>>;
}

export const LEDGER_REPOSITORY = Symbol("LedgerRepository");
