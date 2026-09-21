export interface LedgerSession {
  eventId: string; eventName: string; eventDate: string; half: "am" | "pm";
  timeIn: string | null; timeOut: string | null;
  status: "present" | "incomplete" | "absent"; amount: number; paid: boolean;
}
export interface StudentLedgerResponse { total: number; outstanding: number; sessions: LedgerSession[]; }
export interface SemesterLedgerEvent {
  eventId: string; name: string; venue: string | null; date: string; type: "half_day" | "whole_day";
  status: "upcoming" | "today" | "past";
  sessions: { label: "AM" | "PM" | "Session"; present: number; incomplete: number; absent: number }[];
  present: number; incomplete: number; absent: number; rate: number; collected: number;
}
export interface SemesterLedgerResponse { events: SemesterLedgerEvent[]; totals: { present: number; absent: number; rate: number; collected: number }; }
export interface PaymentHistoryEntry { id: string; amount: string; paidAt: string; }
