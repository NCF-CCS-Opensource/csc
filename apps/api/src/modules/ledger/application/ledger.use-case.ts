import { Inject, Injectable } from "@nestjs/common";
import type { PaymentHistoryEntry, SemesterLedgerResponse, SemesterOutstandingResponse, StudentLedgerResponse } from "@attendance/contracts";
import { LEDGER_REPOSITORY, type LedgerRepository } from "../domain/ledger-repository";
import { computeLedger } from "../domain/ledger";

@Injectable()
export class LedgerUseCase {
  constructor(@Inject(LEDGER_REPOSITORY) private readonly ledgerRepository: LedgerRepository) {}

  async student(semesterId: string, studentId: string): Promise<StudentLedgerResponse> {
    const input = await this.ledgerRepository.ledgerInput(semesterId, studentId);
    const standing = input && computeLedger(input).students.get(studentId);
    return standing ? { ...standing, sessions: standing.sessions.map((session) => ({ ...session, timeIn: session.timeIn?.toISOString() ?? null, timeOut: session.timeOut?.toISOString() ?? null })) } : { total: 0, outstanding: 0, sessions: [] };
  }

  async semester(semesterId: string): Promise<SemesterLedgerResponse> {
    const input = await this.ledgerRepository.ledgerInput(semesterId);
    if (!input) return { events: [], totals: { present: 0, absent: 0, rate: 0, collected: 0 } };
    const ledger = computeLedger(input);
    const details = await this.ledgerRepository.eventDetails(semesterId);
    return { events: ledger.events.map((event) => ({ ...event, name: details.get(event.eventId)!.name, venue: details.get(event.eventId)!.venue })), totals: ledger.totals };
  }

  // Bulk-computes every student's outstanding balance in one ledgerInput fetch,
  // instead of one fetch per student (avoids the N+1 that timed out /clearance).
  async semesterOutstanding(semesterId: string): Promise<SemesterOutstandingResponse> {
    const input = await this.ledgerRepository.ledgerInput(semesterId);
    if (!input) return {};
    const { students } = computeLedger(input);
    return Object.fromEntries([...students].map(([id, standing]) => [id, standing.outstanding]));
  }

  async paymentHistory(studentId: string): Promise<PaymentHistoryEntry[]> {
    const rows = await this.ledgerRepository.paymentHistory(studentId);
    return rows.map(({ id, amount, paidAt }) => ({ id, amount, paidAt: paidAt.toISOString() }));
  }
}
