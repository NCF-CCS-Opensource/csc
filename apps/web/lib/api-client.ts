import { auth } from "@clerk/nextjs/server";

// Server-only. The web module is a backend-for-frontend (ADR-0019): it mints
// the signed-in user's identity token and forwards it, never asserting an
// identity of its own. Falls back to the local apps/api dev server.
const API_BASE_URL = (process.env.API_BASE_URL ?? "http://127.0.0.1:3001").replace(
  /\/$/,
  "",
);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly field?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Server-only. Mints the signed-in user's Clerk token and forwards it as
// Authorization: Bearer (ADR-0019) — apps/web has no database access for
// anything routed through here; the API is the only authorization point.
export async function apiFetch<T>(path: string, body: unknown = {}): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.message ?? `Request failed (${response.status})`, response.status);
  }
  return data as T;
}

// Nest's built-in exceptions serialize as { statusCode, message, error },
// or { statusCode, message: { message, field }, error } for the
// field-carrying ones thrown by StudentController#correct.
type ErrorBody = { message?: string | { message?: string; field?: string } };

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();

  const response = await fetch(`${API_BASE_URL}/v1/api/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const parsed: ErrorBody = await response.json().catch(() => ({}));
    const message = parsed.message;
    if (typeof message === "object" && message !== null) {
      throw new ApiError(message.message ?? "Request failed", response.status, message.field);
    }
    throw new ApiError(message ?? "Request failed", response.status);
  }

  return response.json() as Promise<T>;
}
