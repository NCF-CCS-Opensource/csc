"use client";

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useState } from "react";

// One QueryClient per request/mount, never a module-level singleton: on the
// server a shared client would leak one Student's cached data into another
// user's render (ADR 0013).
//
// Cached data is kept for a full session (not just a page's staleTime) so a
// reload shows the Semester/Program/Event/My-Attendance data that was
// already fetched instead of blocking on a refetch (mirrors
// apps/mobile/lib/queryClient.tsx). staleTime still keeps a server-seeded
// page from immediately re-fetching what it was just handed, but once a
// restored/cached value is older than that, React Query's normal
// stale-while-revalidate behavior refetches it in the background on mount.
const cacheMaxAgeMs = 24 * 60 * 60 * 1000;

const queryDefaults = {
  gcTime: cacheMaxAgeMs,
  staleTime: 30_000,
};

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: queryDefaults },
      }),
  );
  // Built inside the component (not at module scope) so `window.localStorage`
  // is read at render time, not at import time: `window` doesn't exist during
  // SSR, and it must be `undefined` there rather than a value captured once.
  const [persister] = useState(() =>
    createAsyncStoragePersister({
      storage: typeof window === "undefined" ? undefined : window.localStorage,
      key: "attendance.web.queryCache.v1",
    }),
  );
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister, maxAge: cacheMaxAgeMs }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
