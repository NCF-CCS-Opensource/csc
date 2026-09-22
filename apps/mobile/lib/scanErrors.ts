import { ApiError } from "./api";

// Single source of truth for "does this scan-related failure mean we
// couldn't get an answer (try the offline/local fallback) vs. the backend
// gave a definitive answer we can't recover from". A stale-token 401 or a
// timeout/rate-limit/server error is transient — network flakiness, not the
// backend telling us the QR is bad. Used by both the scan-identify call
// (BoothScreen) and the sync-delivery queue (syncScans) so they can't
// disagree on what counts as "Untrusted QR" vs. "Unverified Scan".
export function isPermanentScanFailure(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    error.status >= 400 &&
    error.status < 500 &&
    error.status !== 401 &&
    error.status !== 408 &&
    error.status !== 429
  );
}
