import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";

// A booth can sit unused over a long weekend and still must come back with a
// usable Event list, so the cache is kept far longer than a browser session
// would need. Retention must be >= CACHE_MAX_AGE_MS or restored entries would
// be dropped again on the way in.
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function createBoothQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: CACHE_MAX_AGE_MS,
        staleTime: 30_000,
        retry: 3,
      },
    },
  });
}

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "attendance.queryCache.v1",
});

const queryClient = createBoothQueryClient();

export function BoothQueryProvider({ children }: { children: ReactNode }) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: CACHE_MAX_AGE_MS }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

export const cacheMaxAgeMs = CACHE_MAX_AGE_MS;
