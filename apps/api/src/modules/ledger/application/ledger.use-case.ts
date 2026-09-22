import { Inject, Injectable } from "@nestjs/common";
import type { BatchStudentLedgerResponse, PaymentHistoryEntry, SemesterLedgerResponse, StudentLedgerResponse } from "@attendance/contracts";
import { LEDGER_REPOSITORY, type LedgerRepository } from "../domain/ledger-repository";
import { computeLedger, type StudentStanding } from "../domain/ledger";

const EMPTY_STANDING: StudentLedgerResponse = { total: 0, outstanding: 0, sessions: [] };

function toResponse(standing: StudentStanding | null | undefined): StudentLedgerResponse {
  return standing ? { ...standing, sessions: standing.sessions.map((session) => ({ ...session, timeIn: session.timeIn?.toISOString() ?? null, timeOut: session.timeOut?.toISOString() ?? null })) } : EMPTY_STANDING;
}

@Injectable()
export class LedgerUseCase {
  constructor(@Inject(LEDGER_REPOSITORY) private readonly ledgerRepository: LedgerRepository) {}

  async student(semesterId: string, studentId: string): Promise<StudentLedgerResponse> {
    const input = await this.ledgerRepository.ledgerInput(semesterId, studentId);
    return toResponse(input && computeLedger(input).students.get(studentId));
  }

  // Batched form of `student`: reuses the same per-Semester computation
  // (computeLedger already derives every Student's standing internally) but
  // reads it once and returns every requested Student's balance in one call,
  // instead of one DB read + computeLedger per Student.
  async students(semesterId: string, studentIds?: string[]): Promise<BatchStudentLedgerResponse> {
    const input = await this.ledgerRepository.ledgerInput(semesterId);
    if (!input) return {};
    const ledger = computeLedger(input);
    const ids = studentIds ?? input.students.map((student) => student.id);
    return Object.fromEntries(ids.map((id) => [id, toResponse(ledger.students.get(id))]));
  }

  async semester(semesterId: string): Promise<SemesterLedgerResponse> {
    const input = await this.ledgerRepository.ledgerInput(semesterId);
    if (!input) return { events: [], totals: { present: 0, absent: 0, rate: 0, collected: 0 } };
    const ledger = computeLedger(input);
    const details = await this.ledgerRepository.eventDetails(semesterId);
    return { events: ledger.events.map((event) => ({ ...event, name: details.get(event.eventId)!.name, venue: details.get(event.eventId)!.venue })), totals: ledger.totals };
  }

  async paymentHistory(studentId: string): Promise<PaymentHistoryEntry[]> {
    const rows = await this.ledgerRepository.paymentHistory(studentId);
    return rows.map(({ id, amount, paidAt }) => ({ id, amount, paidAt: paidAt.toISOString() }));
  }
}
