import * as SecureStore from "expo-secure-store";
import { clerk, clerkHydrated } from "./clerk";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL!;
const REQUEST_TIMEOUT_MS = 15_000;
const OFFICER_IDENTITY_KEY = "attendance.officerIdentity.v1";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Who the booth is sending as, cached by us rather than read from Clerk at
// capture time (ADR-0012). A scan taken in a dead spot must still be
// attributable, and a vendor's offline session policy is not ours to control.
// Convenience stamp only — the server re-verifies the Bearer token at sync.
export type OfficerIdentity = { authUserId: string; studentId: string };

export async function rememberOfficerIdentity(
  identity: OfficerIdentity | null,
): Promise<void> {
  if (!identity) {
    await SecureStore.deleteItemAsync(OFFICER_IDENTITY_KEY).catch(() => {});
    return;
  }
  await SecureStore.setItemAsync(
    OFFICER_IDENTITY_KEY,
    JSON.stringify(identity),
  ).catch(() => {});
}

export async function rememberedOfficerIdentity(): Promise<OfficerIdentity | null> {
  const raw = await SecureStore.getItemAsync(OFFICER_IDENTITY_KEY).catch(
    () => null,
  );
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    const { authUserId, studentId } = (value ?? {}) as Partial<OfficerIdentity>;
    return authUserId && studentId ? { authUserId, studentId } : null;
  } catch {
    return null;
  }
}

// The only way the stamp is cleared. Signing out without forgetting it would
// leave the next Officer on this device holding the previous one's identity.
export async function endOfficerSession(
  signOut: () => Promise<unknown>,
): Promise<void> {
  await rememberOfficerIdentity(null);
  await signOut();
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  expectedOfficerId?: string,
): Promise<T> {
  await clerkHydrated();
  if (expectedOfficerId && clerk.user?.id !== expectedOfficerId) {
    throw new ApiError("Queued scan belongs to another Officer", 401);
  }
  const token = await clerk.session?.getToken();

  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(abort, REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(
        body.error ?? `Request failed (${response.status})`,
        response.status,
      );
    }
    return body as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("Request timed out", 408);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
