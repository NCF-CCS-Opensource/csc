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

export function officerId(): string | undefined {
  return state.identity?.authUserId;
}

export async function refreshPendingCount(): Promise<void> {
  const id = officerId();
  publish({ pendingCount: id ? await blockingScanCount(id) : 0 });
}

export function setPendingCount(count: number): void {
  publish({ pendingCount: count });
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
  const remembered = await rememberedOfficerIdentity();
  if (remembered) {
    publish({ identity: remembered, admission: { allowed: true } });
    await refreshPendingCount();
  }

  if (!vendor.isLoaded) return;
  if (!vendor.isSignedIn || !vendor.userId) {
    if (!remembered) publish({ identity: null, admission: undefined });
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
    publish({ identity: fresh, admission: { allowed: true } });
    await refreshPendingCount();
  } catch (error: unknown) {
    const denied =
      error instanceof ApiError && (error.status === 401 || error.status === 403);
    if (denied) {
      await rememberOfficerIdentity(null);
      publish({ identity: null });
    }
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
  await endOfficerSession(signOut);
  await clearBoothCache();
  state = initialState;
  publish({ identity: null });
}
