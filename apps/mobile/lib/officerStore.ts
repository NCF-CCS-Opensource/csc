import {
  ApiError,
  apiFetch,
  endOfficerSession,
  rememberOfficerIdentity,
  rememberedOfficerIdentity,
  type OfficerIdentity,
} from "./api";
import { clearBoothCache } from "./queryClient";
import { blockingScanCount, claimLegacyScans } from "./scanQueue";

// `undefined` is "not resolved yet" for both fields, which is what holds the
// splash screen up; `null` identity means resolved to nobody.
export type Admission =
  | { allowed: true }
  | { allowed: false; message: string }
  | undefined;

export type OfficerState = {
  identity: OfficerIdentity | null | undefined;
  admission: Admission;
  pendingCount: number;
};

const initialState: OfficerState = {
  identity: undefined,
  admission: undefined,
  pendingCount: 0,
};

let state: OfficerState = initialState;
const listeners = new Set<() => void>();
// Each reconnect starts another admission run. Only the newest may publish, or
// a slow earlier failure lands on top of a newer successful admission.
let admissionRun = 0;

export function getOfficerState(): OfficerState {
  return state;
}

export function subscribeToOfficer(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// One new object per change, so a subscriber comparing snapshots by reference
// sees the change and an unrelated re-read does not.
function publish(patch: Partial<OfficerState>): void {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function currentOfficerId(): string | undefined {
  return state.identity?.authUserId;
}

// The single definition of the number. Delivery reports its own remaining count
// as it goes, but letting that write the store too would give the badge two
// sources that only agree by coincidence — so every change recounts here.
export async function refreshPendingCount(): Promise<void> {
  const id = currentOfficerId();
  publish({ pendingCount: id ? await blockingScanCount(id) : 0 });
}

/**
 * Resolve who this booth is acting as. The remembered Officer is read from our
 * own storage *before* the identity vendor is consulted (ADR-0012): a booth
 * relaunched in a dead spot must still know whose Offline Scan Queue it holds,
 * and a vendor's offline session policy is not ours to control.
 */
export async function admitOfficer(vendor: {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  userId: string | null | undefined;
}): Promise<void> {
  const run = ++admissionRun;
  const current = () => run === admissionRun;

  const remembered = await rememberedOfficerIdentity();
  if (remembered && current()) {
    publish({ identity: remembered, admission: { allowed: true } });
    await refreshPendingCount();
  }

  if (!vendor.isLoaded) return;
  if (!vendor.isSignedIn || !vendor.userId) {
    if (!remembered && current()) {
      publish({ identity: null, admission: undefined });
    }
    return;
  }

  try {
    const { student } = await apiFetch<{
      student: { id: string; authUserId: string };
    }>("/api/me");
    // The server found this row by the Clerk user id on the Bearer token, so
    // `authUserId` is that id — one identity, not a second source.
    const fresh: OfficerIdentity = {
      authUserId: student.authUserId,
      studentId: student.id,
    };
    await rememberOfficerIdentity(fresh);
    await claimLegacyScans(fresh.authUserId);
    if (!current()) return;
    publish({ identity: fresh, admission: { allowed: true } });
    await refreshPendingCount();
  } catch (error: unknown) {
    const denied =
      error instanceof ApiError && (error.status === 401 || error.status === 403);
    // The stamp is forgotten even by a superseded run: a refusal is about this
    // device's stored identity, not about which run observed it.
    if (denied) await rememberOfficerIdentity(null);
    if (!current()) return;
    if (denied) publish({ identity: null });
    if (denied || !remembered) {
      publish({
        admission: {
          allowed: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to verify mobile booth access",
        },
      });
    }
  }
}

/**
 * Sign out and leave nothing of this Officer behind. A booth is handed between
 * Officers, so the store, the in-memory query cache, and the cache persisted to
 * disk all go together — otherwise the next Officer opens the app to the
 * previous one's Events.
 */
export async function signOutOfficer(
  signOut: () => Promise<unknown>,
): Promise<void> {
  // Clear before consulting the vendor, not after. `endOfficerSession` awaits
  // the vendor's sign out, which rejects on exactly the offline booth this app
  // is built for — and it has already dropped the identity stamp by then. Doing
  // the caches first means a failed sign out cannot strand Officer A's Events
  // on the device with no identity left to explain them.
  await clearBoothCache();
  state = initialState;
  publish({ identity: null });
  await endOfficerSession(signOut);
}
