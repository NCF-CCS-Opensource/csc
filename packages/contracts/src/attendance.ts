export type AttendanceField = "timeIn" | "timeOut";

export interface EventGridCell {
  label: string;
  sessionId: string;
  field: AttendanceField;
  present: boolean;
}

export interface EventGridRow {
  studentId: string;
  name: string;
  studentIdText: string;
  cells: EventGridCell[];
  outstanding: number;
  unpaidPenaltyIds: string[];
  // Un-voided Payments for this Event's Penalties; Undo voids these.
  paidPaymentIds: string[];
  settled: boolean;
}

export interface AttendanceGridResponse {
  event: { id: string; name: string; halfDayPenaltyAmount: string };
  rows: EventGridRow[];
}

export interface CorrectAttendanceRequest {
  sessionId: string;
  field: AttendanceField;
  present: boolean;
}

export interface RecordPaymentsRequest {
  penaltyIds: string[];
}

export interface VoidPaymentRequest {
  paymentId: string;
}
