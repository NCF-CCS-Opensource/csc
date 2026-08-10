"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// One QueryClient per request/mount, never a module-level singleton: on the
// server a shared client would leak one Student's cached data into another
// user's render (ADR 0013).
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // staleTime keeps a server-seeded page from immediately re-fetching what it
  // was just handed — a cold visit must not pay for its data twice. It also
  // bounds how stale a cached revisit can be before it refreshes in background.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000 } },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
