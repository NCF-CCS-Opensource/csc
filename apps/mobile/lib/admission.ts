import type { OfficerIdentity } from "./api";

/** Result of the `/v1/api/student/identity` round-trip, or omitted entirely
 * when the check was skipped because the device is offline. */
export type AdmissionOutcome =
  | { type: "success"; identity: OfficerIdentity }
  | { type: "denied"; message: string } // 401/403 received while online
  | { type: "error"; message: string }; // any other failure while online

export type AdmissionState =
  | { identity: OfficerIdentity; admission: { allowed: true } }
  | { identity: null; admission: { allowed: false; message: string } }
  | { identity: undefined; admission: { allowed: false; message: string } }
  | { identity: undefined; admission: undefined };

/**
 * Decides whether an Officer/Governor stays admitted, given the identity
 * remembered from a prior session, whether the device is currently known
 * offline (per NetInfo), and the outcome of the identity-check network call
 * (omitted when that call was skipped for being offline).
 *
 * A device that goes offline mid-shift must never be forced out purely for
 * elapsed offline time (issue #266): while offline, the remembered identity
 * carries forward unchanged and no network call is attempted. Only a
 * 401/403 received while genuinely online revokes the session.
 */
export function resolveAdmission({
  remembered,
  isOffline,
  outcome,
}: {
  remembered: OfficerIdentity | null;
  isOffline: boolean;
  outcome?: AdmissionOutcome;
}): AdmissionState {
  if (isOffline || !outcome) {
    return remembered
      ? { identity: remembered, admission: { allowed: true } }
      : { identity: undefined, admission: undefined };
  }

  if (outcome.type === "success") {
    return { identity: outcome.identity, admission: { allowed: true } };
  }

  if (outcome.type === "denied") {
    return {
      identity: null,
      admission: { allowed: false, message: outcome.message },
    };
  }

  // Transient failure while online: a remembered identity stays signed in
  // (matches the existing offline-tolerant behavior); with nothing
  // remembered there is no fallback to fall back to.
  return remembered
    ? { identity: remembered, admission: { allowed: true } }
    : { identity: undefined, admission: { allowed: false, message: outcome.message } };
}
