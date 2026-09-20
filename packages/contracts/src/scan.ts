export const BOOTH_MODES = [
  "time_in_am",
  "time_out_am",
  "time_in_pm",
  "time_out_pm",
] as const;

export type BoothMode = (typeof BOOTH_MODES)[number];

// Offline delivery contract: 401, 408, 429, and 5xx are retryable; these
// request and business-rule statuses are permanent and go to Officer review.
export const SCAN_APPROVAL_PERMANENT_STATUSES = [400, 403, 404, 409, 422] as const;

export interface ScanDecisionRequest {
  scanId: string;
  eventId: string;
  mode?: BoothMode;
  qrPayload: string;
  scannedAt: string;
}

export interface ScannedStudent {
  name: string;
  studentId: string;
  program: string;
}

// Governor-wide, searchable/sortable rejected-scan log (unlike scan/rejections,
// which is Actor-scoped to the calling Officer's own Needs Review queue).
export interface RejectedScanLogRequest {
  q?: string;
  sort?: "student" | "time";
}

export interface RejectedScanLogEntry {
  scanId: string;
  qrPayload: string;
  scannedAt: string;
  studentName: string | null;
  studentIdText: string | null;
  officerName: string;
}

export interface RejectedScanLogResponse {
  rejections: RejectedScanLogEntry[];
}
