import { auth } from "@clerk/nextjs/server";

const API_BASE_URL = (process.env.API_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
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
