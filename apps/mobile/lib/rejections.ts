import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "./api";

export type RejectionReason =
  | "Unreadable QR"
  | "QR does not match current Student record"
  | "Rejected by Officer";

export type RejectedScanRow = {
  id: string;
  eventId: string;
  eventName: string;
  scannedAt: string;
  student: { name: string; studentId: string; program: string } | null;
  reason: RejectionReason;
};

export async function fetchRejectedScans(): Promise<RejectedScanRow[]> {
  const { rejections } = await apiFetch<{ rejections: RejectedScanRow[] }>(
    "/v1/api/scan/rejections",
    { method: "POST" },
  );
  return rejections;
}

// Persistent per-Officer rejection history, served by the server rather than
// the five-item Recent-scans window so older rejections survive eviction and
// app restarts. Persisted through the shared booth query cache.
export function useRejectedScans() {
  return useQuery({
    queryKey: ["scan", "rejections"],
    queryFn: fetchRejectedScans,
  });
}
